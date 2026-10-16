import { NextResponse } from "next/server";
import type { OptimizeRequest, TaskType, OptimizationLevel, OutputFormat } from "@/types";
import { optimizePrompt, ModelError } from "@/lib/model";

// 配置
const MAX_INPUT_LENGTH = Number(process.env.MAX_INPUT_LENGTH) || 4000;
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_MINUTE) || 20;

// 简易内存频率限制（按 IP）
// 注意：多实例部署时应改用 Redis 等共享存储
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 分钟窗口
  const record = rateLimitMap.get(ip);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

const VALID_TASK_TYPES: TaskType[] = [
  "auto", "coding", "writing", "learning", "analysis",
  "business", "automation", "image", "other",
];

const VALID_OPTIMIZATION_LEVELS: OptimizationLevel[] = ["light", "deep", "expert"];
const VALID_OUTPUT_FORMATS: OutputFormat[] = ["prompt", "prompt_with_notes", "multi_version"];

export async function POST(request: Request) {
  try {
    // 获取客户端 IP（简化处理，生产环境应正确获取）
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    // 频率限制
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const body = (await request.json()) as OptimizeRequest;

    // 校验输入
    if (!body || typeof body.input !== "string") {
      return NextResponse.json(
        { error: "请求格式错误：缺少 input 字段" },
        { status: 400 }
      );
    }

    const input = body.input.trim();

    if (!input) {
      return NextResponse.json(
        { error: "请输入你的需求后再生成" },
        { status: 400 }
      );
    }

    if (input.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        {
          error: `输入内容过长（最多 ${MAX_INPUT_LENGTH} 字，当前 ${input.length} 字）`,
        },
        { status: 400 }
      );
    }

    if (!VALID_TASK_TYPES.includes(body.taskType)) {
      return NextResponse.json({ error: "任务类型无效" }, { status: 400 });
    }

    if (!VALID_OPTIMIZATION_LEVELS.includes(body.optimizationLevel)) {
      return NextResponse.json({ error: "优化程度无效" }, { status: 400 });
    }

    if (!VALID_OUTPUT_FORMATS.includes(body.outputFormat)) {
      return NextResponse.json({ error: "输出形式无效" }, { status: 400 });
    }

    // 调用模型层（无密钥时自动使用模拟模式）
    const result = await optimizePrompt(body);

    // 安全检查：确保响应中不包含 API 密钥
    const responseJson = JSON.stringify(result);
    if (process.env.MODEL_API_KEY && responseJson.includes(process.env.MODEL_API_KEY)) {
      console.error("安全警告：响应中可能包含 API 密钥，已拦截");
      return NextResponse.json(
        { error: "服务内部错误" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    // 模型调用失败：返回可理解的错误信息（不含密钥）
    if (error instanceof ModelError) {
      console.error("模型调用失败:", error.message);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    // 日志中不记录用户原始内容
    console.error("优化请求处理失败:", error instanceof Error ? error.message : "未知错误");
    return NextResponse.json(
      { error: "服务内部错误，请稍后重试" },
      { status: 500 }
    );
  }
}
