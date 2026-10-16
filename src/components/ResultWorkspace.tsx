"use client";

import { useState } from "react";
import type { OptimizeResponse } from "@/types";

interface ResultWorkspaceProps {
  result: OptimizeResponse;
  originalInput: string;
  taskType: string;
  onReoptimize: () => void;
  onSave: () => void;
  saved: boolean;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      : score >= 60
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}

export default function ResultWorkspace({ result, onReoptimize, onSave, saved }: ResultWorkspaceProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级方案
      const textarea = document.createElement("textarea");
      textarea.value = result.prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 模拟结果提示 */}
      {result.isMock && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          ⚠️ 当前为<strong>模拟模式</strong>（未配置 API 密钥），结果仅供演示界面结构。
          配置 <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">MODEL_API_KEY</code> 后将使用真实模型。
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          {copied ? "✓ 已复制" : "复制提示词"}
        </button>
        <button
          onClick={onSave}
          disabled={saved}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {saved ? "✓ 已收藏" : "保存收藏"}
        </button>
        <button
          onClick={onReoptimize}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          重新优化
        </button>
      </div>

      {/* 优化后的提示词 */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          优化后的提示词
        </h3>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          {result.prompt}
        </pre>
      </section>

      {/* 质量检查结果 */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            质量检查
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">总分</span>
            <ScoreBadge score={result.qualityCheck.totalScore} />
          </div>
        </div>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          {result.qualityCheck.summary}
        </p>
        <div className="space-y-3">
          {result.qualityCheck.dimensions.map((dim) => (
            <div key={dim.name} className="border-t border-zinc-100 pt-3 first:border-0 first:pt-0 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {dim.name}
                </span>
                <ScoreBadge score={dim.score} />
              </div>
              {dim.issues.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs text-red-600 dark:text-red-400">
                  {dim.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                {dim.suggestion}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 需求分析摘要 */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          需求分析摘要
        </h3>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">识别目标</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{result.analysis.goal}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">任务类型</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{result.analysis.taskType}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">背景</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{result.analysis.context}</dd>
          </div>
          {result.analysis.missingInfo.length > 0 && (
            <div>
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">缺失的关键信息</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">
                {result.analysis.missingInfo.join("、")}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* 默认假设 */}
      {result.analysis.assumptions.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            默认假设
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            {result.analysis.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 修改说明 */}
      {result.revisionNotes.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            主要修改说明
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            {result.revisionNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-zinc-400">
        以上结果由 AI 生成，建议人工复核后使用。未经过真实模型测试，不标记为已验证成功。
      </p>
    </div>
  );
}
