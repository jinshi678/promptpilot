import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_TITLE = 200;

function getUserId(request: Request): string | null {
  const uid = request.headers.get("x-user-id");
  if (!uid || uid.length > 64) return null;
  return uid;
}

// GET /api/sessions/[id] —— 会话详情（含全部版本）
export async function GET(request: Request, ctx: RouteContext<'/api/sessions/[id]'>) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "缺少用户标识" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const session = await prisma.promptSession.findFirst({
    where: { id, anonUserId: userId },
    include: { versions: { orderBy: { versionNumber: "asc" } } },
  });

  if (!session) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  return NextResponse.json({
    session: {
      id: session.id,
      title: session.title,
      originalInput: session.originalInput,
      taskType: session.taskType,
      isMock: session.isMock,
      createdAt: session.createdAt.getTime(),
      versions: session.versions.map((v) => ({
        id: v.id,
        prompt: v.prompt,
        qualityScore: v.qualityScore,
        revisionNotes: v.revisionNotes,
        createdAt: v.createdAt.getTime(),
      })),
    },
  });
}

// PATCH /api/sessions/[id] —— 修改标题
export async function PATCH(request: Request, ctx: RouteContext<'/api/sessions/[id]'>) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "缺少用户标识" }, { status: 400 });
    }

    const { id } = await ctx.params;
    const body = (await request.json()) as { title?: unknown };
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title || title.length > MAX_TITLE) {
      return NextResponse.json({ error: "标题无效（1-200 字）" }, { status: 400 });
    }

    // 匿名用户归属检查：只能改自己的记录
    const updated = await prisma.promptSession.updateMany({
      where: { id, anonUserId: userId },
      data: { title },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "更新失败，请稍后重试" }, { status: 500 });
  }
}

// DELETE /api/sessions/[id] —— 删除收藏（级联删除版本）
export async function DELETE(request: Request, ctx: RouteContext<'/api/sessions/[id]'>) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "缺少用户标识" }, { status: 400 });
    }

    const { id } = await ctx.params;
    // 匿名用户归属检查：只能删自己的记录
    const deleted = await prisma.promptSession.deleteMany({
      where: { id, anonUserId: userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "删除失败，请稍后重试" }, { status: 500 });
  }
}
