"use client";

import { useState } from "react";
import type { SavedPrompt } from "@/lib/storage";
import { TASK_TYPE_LABELS } from "@/types";
import VersionDiff from "./VersionDiff";

interface SavedListProps {
  prompts: SavedPrompt[];
  onDelete: (id: string) => void;
  onEditTitle: (id: string, title: string) => void;
  onLoad: (prompt: SavedPrompt) => void;
}

export default function SavedList({ prompts, onDelete, onEditTitle, onLoad }: SavedListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [diffingId, setDiffingId] = useState<string | null>(null);

  const diffingPrompt = prompts.find((p) => p.id === diffingId) ?? null;

  if (prompts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
        还没有收藏的提示词。生成后点击“保存收藏”即可保存。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prompts.map((p) => (
        <div
          key={p.id}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {editingId === p.id ? (
                <div className="flex gap-2">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <button
                    onClick={() => {
                      onEditTitle(p.id, editTitle);
                      setEditingId(null);
                    }}
                    className="rounded bg-indigo-600 px-2 py-1 text-xs text-white"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <h4
                  className="cursor-pointer truncate text-sm font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100"
                  onClick={() => onLoad(p)}
                  title="点击查看"
                >
                  {p.title}
                </h4>
              )}
              <div className="mt-1 text-xs text-zinc-400">
                <span className="whitespace-nowrap">
                  {TASK_TYPE_LABELS[p.taskType as keyof typeof TASK_TYPE_LABELS] || p.taskType}
                  {" · "}
                  {p.versions.length} 个版本
                  {" · "}
                  {new Date(p.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              {p.versions.length >= 2 && (
                <button
                  onClick={() => setDiffingId(p.id)}
                  className="rounded px-2.5 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                >
                  版本对比
                </button>
              )}
              <button
                  onClick={() => {
                    setEditingId(p.id);
                    setEditTitle(p.title);
                  }}
                  className="rounded px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  编辑
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  className="rounded px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  删除
                </button>
            </div>
          </div>
        </div>
      ))}

      {/* 版本差异对比弹窗 */}
      {diffingPrompt && diffingPrompt.versions.length >= 2 && (
        <VersionDiff
          versions={diffingPrompt.versions}
          onClose={() => setDiffingId(null)}
        />
      )}
    </div>
  );
}
