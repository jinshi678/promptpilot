"use client";

import { useMemo, useState } from "react";
import type { SavedVersion } from "@/lib/storage";
import { diffLines, diffStats } from "@/lib/diff";

interface VersionDiffProps {
  versions: SavedVersion[];
  onClose: () => void;
}

// 版本选择器标签
function versionLabel(v: SavedVersion, index: number): string {
  const num = index + 1; // versions 数组按时间正序，最早的为版本1
  return `版本${num} · ${v.qualityScore}分 · ${new Date(v.createdAt).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function VersionDiff({ versions, onClose }: VersionDiffProps) {
  const [idxA, setIdxA] = useState(Math.max(0, versions.length - 2));
  const [idxB, setIdxB] = useState(versions.length - 1);

  const diff = useMemo(
    () => diffLines(versions[idxA]?.prompt ?? "", versions[idxB]?.prompt ?? ""),
    [versions, idxA, idxB]
  );
  const stats = useMemo(() => diffStats(diff), [diff]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            版本差异对比
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            关闭
          </button>
        </div>

        {/* 版本选择 */}
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-zinc-500">旧版本</span>
            <select
              value={idxA}
              onChange={(e) => setIdxA(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {versions.map((v, i) => (
                <option key={v.id} value={i} disabled={i === idxB}>
                  {versionLabel(v, i)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-zinc-500">新版本</span>
            <select
              value={idxB}
              onChange={(e) => setIdxB(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {versions.map((v, i) => (
                <option key={v.id} value={i} disabled={i === idxA}>
                  {versionLabel(v, i)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* 统计 */}
        <div className="mb-3 flex gap-3 text-xs">
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            +{stats.added} 新增行
          </span>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            -{stats.removed} 删除行
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {stats.same} 相同行
          </span>
        </div>

        {/* 差异内容 */}
        <div className="overflow-auto rounded-lg border border-zinc-200 text-xs leading-relaxed dark:border-zinc-700">
          {diff.map((line, idx) => (
            <div
              key={idx}
              className={
                line.type === "added"
                  ? "bg-green-50 px-3 py-0.5 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : line.type === "removed"
                    ? "bg-red-50 px-3 py-0.5 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                    : "px-3 py-0.5 text-zinc-600 dark:text-zinc-400"
              }
            >
              <span className="mr-2 inline-block w-4 select-none text-zinc-400">
                {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
              </span>
              <span className="whitespace-pre-wrap break-words">
                {line.text || " "}
              </span>
            </div>
          ))}
          {diff.length === 0 && (
            <div className="px-3 py-4 text-center text-zinc-400">两个版本内容相同</div>
          )}
        </div>
      </div>
    </div>
  );
}
