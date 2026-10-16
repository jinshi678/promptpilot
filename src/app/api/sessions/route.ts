import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { TaskType } from "@/types";

const VALID_TASK_TYPES: TaskType[] = [
  "auto", "coding", "writing", "learning", "analysis",
  "business", "automation", "image", "other",
];

const MAX_ORIGINAL_INPUT = 6000;
const MAX_PROMPT = 20000;
const MAX_TITLE = 200;
const MAX_REVISION_NOTES = 4000;

// 从请求头获取匿名用户 ID（数据隔离的关键）
function getUserId(request: Request): string | null {
  const uid = request.headers.get("x-user-id");
  if (!uid || uid.length > 64) return null;
  return uid;
}

// 带 versions 的会话查询结果类型
type SessionWithVersions = Awaited<
  ReturnType<typeof prisma.promptSession.findFirstOrThrow>
> & { versions: Array<{ id: string; prompt: string; qualityScore: number; createdAt: Date }> };

// 映射为前端 SavedPrompt 兼容的结构（时间戳用毫秒数）
function mapSession(s: SessionWithVersions) {
  const latest = s.versions[s.versions.length - 1];
  return {
    id: s.id,
    title: s.title,
    category: s.taskType,
    originalInput: s.originalInput,
    taskType: s.taskType,
    prompt: latest?.prompt ?? "",
    qualityScore: latest?.qualityScore ?? 0,
    isMock: s.isMock,
    createdAt: s.createdAt.getTime(),
    versions: s.versions.map((v) => ({
      id: v.id,
      prompt: v.prompt,
      qualityScore: v.qualityScore,
      createdAt: v.createdAt.getTime(),
    })),
  };
}

// GET /api/sessions —— 当前用户的收藏列表
export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "缺少用户标识" }, { status: 400 });
  }

  const sessions = await prisma.promptSession.findMany({
    where: { anonUserId: userId },
    orderBy: { createdAt: "desc" },
    include: { versions: { orderBy: { versionNumber: "asc" } } },
  });

  return NextResponse.json({ sessions: sessions.map(mapSession) });
}

// POST /api/sessions —— 新建收藏（或为相同原始输入追加新版本）
export async function POST(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "缺少用户标识" }, { status: 400 });
    }

    const body = (await request.json()) as {
      originalInput?: unknown;
      title?: unknown;
      taskType?: unknown;
      optimizationLevel?: unknown;
      outputFormat?: unknown;
      isMock?: unknown;
      prompt?: unknown;
      qualityScore?: unknown;
      revisionNotes?: unknown;
    };

    // 输入校验
    const originalInput = typeof body.originalInput === "string" ? body.originalInput.trim() : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const taskType = body.taskType as TaskType;

    if (!originalInput || originalInput.length > MAX_ORIGINAL_INPUT) {
      return NextResponse.json({ error: "originalInput 无效或过长" }, { status: 400 });
    }
    if (!prompt || prompt.length > MAX_PROMPT) {
      return NextResponse.json({ error: "prompt 无效或过长" }, { status: 400 });
    }
    if (!VALID_TASK_TYPES.includes(taskType)) {
      return NextResponse.json({ error: "taskType 无效" }, { status: 400 });
    }
    const qualityScore = body.qualityScore;
    if (typeof qualityScore !== "number" || !Number.isInteger(qualityScore) || qualityScore < 0 || qualityScore > 100) {
      return NextResponse.json({ error: "qualityScore 无效" }, { status: 400 });
    }

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, MAX_TITLE)
        : originalInput.slice(0, 30) + (originalInput.length > 30 ? "..." : "");
    const optimizationLevel = typeof body.optimizationLevel === "string" ? body.optimizationLevel : "deep";
    const outputFormat = typeof body.outputFormat === "string" ? body.outputFormat : "prompt";
    const isMock = body.isMock === true;
    const revisionNotes =
      typeof body.revisionNotes === "string" ? body.revisionNotes.slice(0, MAX_REVISION_NOTES) : null;

    // 相同原始输入 → 追加新版本
    const existing = await prisma.promptSession.findFirst({
      where: { anonUserId: userId, originalInput },
    });

    if (existing) {
      const count = await prisma.promptVersion.count({ where: { sessionId: existing.id } });
      await prisma.$transaction([
        prisma.promptVersion.create({
          data: {
            sessionId: existing.id,
            prompt,
            qualityScore,
            revisionNotes,
            versionNumber: count + 1,
          },
        }),
        prisma.promptSession.update({
          where: { id: existing.id },
          data: { isMock },
        }),
      ]);

      const updated = await prisma.promptSession.findUniqueOrThrow({
        where: { id: existing.id },
        include: { versions: { orderBy: { versionNumber: "asc" } } },
      });
      return NextResponse.json(mapSession(updated));
    }

    // 新建会话 + 第一个版本
    const created = await prisma.promptSession.create({
      data: {
        anonUserId: userId,
        title,
        originalInput,
        taskType,
        optimizationLevel,
        outputFormat,
        isMock,
        versions: {
          create: { prompt, qualityScore, revisionNotes, versionNumber: 1 },
        },
      },
      include: { versions: { orderBy: { versionNumber: "asc" } } },
    });

    return NextResponse.json(mapSession(created), { status: 201 });
  } catch (error) {
    console.error("保存收藏失败:", error instanceof Error ? error.message : "未知错误");
    return NextResponse.json({ error: "保存失败，请稍后重试" }, { status: 500 });
  }
}
