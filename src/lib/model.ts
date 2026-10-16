import type { OptimizeRequest, OptimizeResponse, RequirementAnalysis, ClarifyingQuestion } from "@/types";
import { analyzeRequirement } from "./analyze";
import { getStrategy } from "./strategies";
import { buildQualityCheck, mockOptimize } from "./mockOptimize";

// 模型配置（仅服务端可用，密钥绝不返回给前端）
const MODEL_API_URL = process.env.MODEL_API_URL || "https://api.siliconflow.cn/v1";
const MODEL_NAME = process.env.MODEL_NAME || "deepseek-ai/DeepSeek-V3";
const MODEL_API_KEY = process.env.MODEL_API_KEY || "";

// 请求超时与重试
const REQUEST_TIMEOUT = 60_000;
const MAX_RETRIES = 2;

// 模型调用错误（消息可直接展示给用户，不含密钥）
export class ModelError extends Error {}

// 无密钥时进入模拟模式（结果明确标识 isMock）
export function shouldUseMock(): boolean {
  return !MODEL_API_KEY;
}

// 从模型输出提取 JSON（剥离 markdown 围栏与多余文本）
function extractJson(text: string): Record<string, unknown> | null {
  let t = text.trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) t = fenced[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(t.slice(start, end + 1));
    return typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// 服务端校验模型返回结构
function validateResult(
  obj: Record<string, unknown> | null
): { prompt: string; notes: string[] } | null {
  if (!obj) return null;
  const prompt = typeof obj.prompt === "string" ? obj.prompt.trim() : "";
  if (prompt.length < 10) return null;
  const notes = Array.isArray(obj.notes)
    ? (obj.notes as unknown[])
        .filter((n): n is string => typeof n === "string" && n.length > 0)
        .slice(0, 5)
    : [];
  return { prompt, notes };
}

// 单次对话调用：超时、重试、JSON 模式降级
async function chat(
  systemPrompt: string,
  userMessage: string,
  jsonMode: boolean
): Promise<string> {
  let useJson = jsonMode;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      const response = await fetch(`${MODEL_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MODEL_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.6,
          max_tokens: 2000,
          ...(useJson ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`模型 API ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      const content: string | undefined = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("模型返回内容为空");
      return content;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new Error("请求超时");
      } else {
        lastError = error;
      }
      // 部分模型不支持 json_object 模式：400 时去掉该参数降级重试
      if (
        useJson &&
        lastError instanceof Error &&
        /模型 API 400/.test(lastError.message)
      ) {
        useJson = false;
        continue;
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new ModelError(
    `模型调用失败（已重试 ${MAX_RETRIES} 次）：${
      lastError instanceof Error ? lastError.message : "未知错误"
    }`
  );
}

const GEN_SYSTEM_PROMPT = `你是资深提示词工程师。任务：把用户的原始需求改写为一份结构化、可执行的高质量提示词。

要求：
1. 必须保留用户原始意图与关键事实，不得擅自改变用户目标
2. 结构按需取舍：任务目标/角色视角/背景信息/具体任务/执行步骤/约束条件/输出格式/验收标准，不为凑段添加无意义内容
3. 用户未提供的关键信息，以"默认假设"方式补全，并在约束条件中注明
4. 用中文输出
5. 只输出 JSON 对象，格式：{"prompt": "优化后的完整提示词", "notes": ["主要修改说明1", "修改说明2"]}`;

// 调用真实模型生成优化提示词
async function generateWithModel(
  req: OptimizeRequest,
  analysis: RequirementAnalysis
): Promise<{ prompt: string; notes: string[] }> {
  const strategy = getStrategy(analysis.taskType);
  const reference = strategy.buildPrompt({
    analysis,
    originalInput: req.input,
    optimizationLevel: req.optimizationLevel,
    outputFormat: req.outputFormat,
  });

  const userMessage = `原始需求：${req.input}
任务类型：${analysis.taskType}
优化程度：${req.optimizationLevel}
期望输出形式：${req.outputFormat}

结构参考（可按需调整，避免无意义凑段）：
${reference}`;

  const content = await chat(GEN_SYSTEM_PROMPT, userMessage, true);
  const result = validateResult(extractJson(content));
  if (!result) {
    throw new ModelError("模型输出格式错误：未返回合法的 JSON 结构（缺少 prompt 字段）");
  }
  return result;
}

// 自动修复：把质检问题反馈给模型重写一次
async function reviseWithModel(
  prompt: string,
  issues: string[]
): Promise<{ prompt: string; notes: string[] } | null> {
  const userMessage = `以下提示词存在质量问题，请修复后重新输出：
${issues.map((i) => `- ${i}`).join("\n")}

待修复的提示词：
${prompt}

只输出 JSON：{"prompt": "修复后的完整提示词", "notes": ["主要修复说明"]}`;

  try {
    const content = await chat(GEN_SYSTEM_PROMPT, userMessage, true);
    return validateResult(extractJson(content));
  } catch {
    return null; // 修复失败时保留原版本
  }
}

// 统一入口：优化提示词
export async function optimizePrompt(
  req: OptimizeRequest
): Promise<OptimizeResponse> {
  if (shouldUseMock()) {
    return mockOptimize(req);
  }

  // 1. 本地规则分析（不依赖模型，保证结构稳定）
  const analysis = analyzeRequirement(req.input, req.taskType);

  // 2. 模型生成优化提示词（结构化 JSON + 服务端校验）
  const generated = await generateWithModel(req, analysis);

  // 3. 本地规则质检（评分依据可解释）
  let prompt = generated.prompt;
  let qualityCheck = buildQualityCheck(prompt);
  let revisionNotes = generated.notes;

  // 4. 自动修复：质检不达标时反馈问题重写一次
  if (qualityCheck.needsRevision) {
    const issues = qualityCheck.dimensions.flatMap((d) => d.issues);
    const fixed = await reviseWithModel(prompt, issues);
    if (fixed) {
      prompt = fixed.prompt;
      revisionNotes = [...fixed.notes, "根据质量检查自动修复了结构缺失问题"];
      qualityCheck = buildQualityCheck(prompt);
    }
  }

  // 5. 澄清问题来自本地缺失信息检测（≤3 个，仅关键项）
  const questions: ClarifyingQuestion[] = analysis.missingInfo
    .slice(0, 3)
    .map((info, i) => ({
      id: `q${i}`,
      question: `请补充关于"${info}"的信息（可跳过）`,
      reason: "该信息会影响结果质量",
      optional: true,
    }));

  return {
    isMock: false,
    analysis,
    questions,
    prompt,
    qualityCheck,
    revisionNotes: revisionNotes.length > 0 ? revisionNotes : ["基于结构化模板重新组织了需求"],
  };
}
