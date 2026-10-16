import type { OptimizeResponse, TaskType } from "@/types";
import type { SavedPrompt } from "./storage";

// 匿名用户 ID：浏览器生成并持久化在 localStorage，请求时通过 X-User-Id 头传给服务端做数据隔离
const UID_KEY = "promptpilot_uid";

function getUserId(): string {
  let uid = localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = crypto.randomUUID
      ? crypto.randomUUID()
      : `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(UID_KEY, uid);
  }
  return uid;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": getUserId(),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error || `请求失败 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// 获取服务端收藏列表
export async function fetchSavedPrompts(): Promise<SavedPrompt[]> {
  const data = await api<{ sessions: SavedPrompt[] }>("/api/sessions");
  return data.sessions;
}

// 保存到服务端（相同原始输入自动追加新版本）
export async function savePromptRemote(data: {
  originalInput: string;
  taskType: TaskType;
  optimizationLevel: string;
  outputFormat: string;
  result: OptimizeResponse;
}): Promise<SavedPrompt> {
  const title =
    data.originalInput.slice(0, 30) + (data.originalInput.length > 30 ? "..." : "");

  return api<SavedPrompt>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({
      originalInput: data.originalInput,
      title,
      taskType: data.taskType,
      optimizationLevel: data.optimizationLevel,
      outputFormat: data.outputFormat,
      isMock: data.result.isMock,
      prompt: data.result.prompt,
      qualityScore: data.result.qualityCheck.totalScore,
      revisionNotes: data.result.revisionNotes
        ? JSON.stringify(data.result.revisionNotes)
        : undefined,
    }),
  });
}

// 删除服务端收藏
export async function deletePromptRemote(id: string): Promise<void> {
  await api(`/api/sessions/${id}`, { method: "DELETE" });
}

// 修改服务端收藏标题
export async function renamePromptRemote(id: string, title: string): Promise<void> {
  await api(`/api/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

// 一次性迁移：服务端为空而本地有数据时，把本地收藏推送到服务端
export async function migrateLocalIfNeeded(localPrompts: SavedPrompt[]): Promise<boolean> {
  const remote = await fetchSavedPrompts();
  if (remote.length > 0 || localPrompts.length === 0) return false;

  for (const p of localPrompts) {
    const latest = p.versions[p.versions.length - 1];
    if (!latest) continue;
    await api("/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        originalInput: p.originalInput,
        title: p.title,
        taskType: p.taskType,
        optimizationLevel: "deep",
        outputFormat: "prompt",
        isMock: p.isMock ?? false,
        prompt: latest.prompt,
        qualityScore: latest.qualityScore,
      }),
    });
  }
  return true;
}
