import type { OptimizeRequest, OptimizeResponse, QualityCheckResult } from "@/types";
import { analyzeRequirement } from "./analyze";
import { getStrategy } from "./strategies";

// 生成质量检查结果（供真实模型链路复用：规则可解释）
export function buildQualityCheck(prompt: string): QualityCheckResult {
  const hasGoal = /任务目标/.test(prompt);
  const hasContext = /背景信息/.test(prompt);
  const hasSteps = /执行步骤/.test(prompt);
  const hasConstraints = /约束条件/.test(prompt);
  const hasOutput = /输出格式/.test(prompt);
  const hasAcceptance = /验收标准/.test(prompt);

  const dimensions = [
    {
      name: "目标清晰度",
      score: hasGoal ? 85 : 40,
      issues: hasGoal ? [] : ["未明确说明任务目标"],
      suggestion: hasGoal ? "目标已明确" : "请补充清晰的任务目标",
    },
    {
      name: "背景完整度",
      score: hasContext ? 75 : 35,
      issues: hasContext ? [] : ["缺少必要背景信息"],
      suggestion: hasContext ? "背景已说明" : "请补充相关背景与上下文",
    },
    {
      name: "任务可执行性",
      score: hasSteps ? 80 : 50,
      issues: hasSteps ? [] : ["缺少执行步骤，任务可执行性不足"],
      suggestion: hasSteps ? "步骤清晰" : "建议补充分步骤执行指引",
    },
    {
      name: "约束明确度",
      score: hasConstraints ? 80 : 45,
      issues: hasConstraints ? [] : ["未说明约束条件"],
      suggestion: hasConstraints ? "约束已明确" : "请补充必须遵守的约束",
    },
    {
      name: "输出可用性",
      score: hasOutput ? 85 : 50,
      issues: hasOutput ? [] : ["输出格式不明确"],
      suggestion: hasOutput ? "输出格式已定义" : "请明确期望的输出格式",
    },
    {
      name: "验收可验证性",
      score: hasAcceptance ? 80 : 40,
      issues: hasAcceptance ? [] : ["缺少验收标准"],
      suggestion: hasAcceptance ? "验收标准已定义" : "请补充可验证的成功标准",
    },
  ];

  const totalScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
  );

  const needsRevision = totalScore < 70;

  return {
    dimensions,
    totalScore,
    summary: needsRevision
      ? "提示词存在可改进空间，已自动生成修订版本。"
      : "提示词结构完整，质量良好。",
    needsRevision,
  };
}

// 主函数：生成模拟优化响应
export function mockOptimize(req: OptimizeRequest): OptimizeResponse {
  // 1. 需求分析
  const analysis = analyzeRequirement(req.input, req.taskType);

  // 2. 场景化提示词生成
  const strategy = getStrategy(analysis.taskType);
  const prompt = strategy.buildPrompt({
    analysis,
    originalInput: req.input,
    optimizationLevel: req.optimizationLevel,
    outputFormat: req.outputFormat,
  });

  // 3. 质量检查
  const qualityCheck = buildQualityCheck(prompt);

  // 4. 澄清问题（仅当有关键缺失信息时）
  const questions = analysis.missingInfo.slice(0, 3).map((info, i) => ({
    id: `q${i}`,
    question: `请补充关于"${info}"的信息（可跳过）`,
    reason: `该信息会影响${analysis.taskType}任务的结果质量`,
    optional: true,
  }));

  // 5. 修改说明
  const revisionNotes = qualityCheck.needsRevision
    ? ["补充了执行步骤以提升可执行性", "补充了验收标准以便验证结果"]
    : ["结构完整，无需重大修改"];

  return {
    isMock: true,
    analysis,
    questions,
    prompt,
    qualityCheck,
    revisionNotes,
  };
}
