import type { OptimizeResponse, TaskType } from "@/types";

// 存储的提示词记录
export interface SavedPrompt {
  id: string;
  title: string;
  category: string;
  originalInput: string;
  taskType: TaskType;
  prompt: string;
  qualityScore: number;
  isMock: boolean; // 记录结果来源：真实模型 / 模拟模式
  createdAt: number;
  versions: SavedVersion[];
}

export interface SavedVersion {
  id: string;
  prompt: string;
  qualityScore: number;
  createdAt: number;
}

const STORAGE_KEY = "promptpilot_saved";

// 生成唯一 ID
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 获取所有收藏
export function getSavedPrompts(): SavedPrompt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPrompt[];
  } catch {
    return [];
  }
}

// 保存新提示词（或为已有记录添加新版本）
export function savePrompt(data: {
  originalInput: string;
  taskType: TaskType;
  result: OptimizeResponse;
}): SavedPrompt {
  const saved = getSavedPrompts();
  const now = Date.now();

  // 查找是否已有相同原始输入的记录
  const existing = saved.find(
    (s) => s.originalInput === data.originalInput
  );

  const version: SavedVersion = {
    id: genId(),
    prompt: data.result.prompt,
    qualityScore: data.result.qualityCheck.totalScore,
    createdAt: now,
  };

  if (existing) {
    // 添加新版本
    existing.versions.push(version);
    existing.prompt = data.result.prompt;
    existing.qualityScore = data.result.qualityCheck.totalScore;
    existing.isMock = data.result.isMock;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return existing;
  }

  // 创建新记录
  const record: SavedPrompt = {
    id: genId(),
    title: data.originalInput.slice(0, 30) + (data.originalInput.length > 30 ? "..." : ""),
    category: data.taskType,
    originalInput: data.originalInput,
    taskType: data.taskType,
    prompt: data.result.prompt,
    qualityScore: data.result.qualityCheck.totalScore,
    isMock: data.result.isMock,
    createdAt: now,
    versions: [version],
  };

  saved.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return record;
}

// 更新标题或分类
export function updatePrompt(
  id: string,
  updates: { title?: string; category?: string }
): SavedPrompt[] {
  const saved = getSavedPrompts();
  const idx = saved.findIndex((s) => s.id === id);
  if (idx === -1) return saved;
  if (updates.title !== undefined) saved[idx].title = updates.title;
  if (updates.category !== undefined) saved[idx].category = updates.category;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return saved;
}

// 删除记录
export function deletePrompt(id: string): SavedPrompt[] {
  const saved = getSavedPrompts().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return saved;
}

// 导出提示词为文本
export function exportPrompt(prompt: string): string {
  return prompt;
}

// 搜索和筛选
export function searchPrompts(
  prompts: SavedPrompt[],
  keyword: string,
  category?: string
): SavedPrompt[] {
  return prompts.filter((p) => {
    const matchKeyword =
      !keyword ||
      p.title.includes(keyword) ||
      p.originalInput.includes(keyword) ||
      p.prompt.includes(keyword);
    const matchCategory = !category || p.category === category;
    return matchKeyword && matchCategory;
  });
}
