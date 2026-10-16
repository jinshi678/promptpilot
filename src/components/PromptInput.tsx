"use client";

import { useState } from "react";
import {
  TASK_TYPE_LABELS,
  OPTIMIZATION_LEVEL_LABELS,
  OUTPUT_FORMAT_LABELS,
  type TaskType,
  type OptimizationLevel,
  type OutputFormat,
} from "@/types";

interface PromptInputProps {
  onSubmit: (data: {
    input: string;
    taskType: TaskType;
    optimizationLevel: OptimizationLevel;
    outputFormat: OutputFormat;
  }) => void;
  loading: boolean;
}

const EXAMPLES = [
  "帮我写一封给客户的道歉邮件，因为订单延迟了",
  "用 Python 写一个批量重命名文件的脚本",
  "我想从零开始学习机器学习，该怎么入门？",
  "帮我分析一下买 Mac 还是买 Windows 笔记本",
];

export default function PromptInput({ onSubmit, loading }: PromptInputProps) {
  const [input, setInput] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("auto");
  const [optimizationLevel, setOptimizationLevel] =
    useState<OptimizationLevel>("deep");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("prompt");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSubmit({ input, taskType, optimizationLevel, outputFormat });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 需求输入框 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          描述你的需求
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例如：帮我写一篇关于人工智能发展历史的科普文章，适合高中生阅读..."
          rows={6}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <div className="mt-1 text-right text-xs text-zinc-400">
          {input.length} / 4000
        </div>
      </div>

      {/* 任务类型 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          任务类型
        </label>
        <select
          value={taskType}
          onChange={(e) => setTaskType(e.target.value as TaskType)}
          className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 优化程度 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          优化程度
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(OPTIMIZATION_LEVEL_LABELS) as OptimizationLevel[]).map(
            (level) => (
              <button
                key={level}
                type="button"
                onClick={() => setOptimizationLevel(level)}
                className={`rounded-xl border p-3 text-sm font-medium transition ${
                  optimizationLevel === level
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                {OPTIMIZATION_LEVEL_LABELS[level]}
              </button>
            )
          )}
        </div>
      </div>

      {/* 输出形式 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          期望输出形式
        </label>
        <select
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
          className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {Object.entries(OUTPUT_FORMAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 生成按钮 */}
      <button
        type="submit"
        disabled={!input.trim() || loading}
        className="w-full rounded-xl bg-indigo-600 py-4 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-indigo-900/30"
      >
        {loading ? "生成中..." : "生成优化提示词"}
      </button>

      {/* 示例需求 */}
      <div>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">试试这些示例：</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInput(ex)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {ex.length > 20 ? ex.slice(0, 20) + "..." : ex}
            </button>
          ))}
        </div>
      </div>

      {/* 隐私提示 */}
      <p className="text-center text-xs text-zinc-400">
        你的需求仅用于本次生成，不会默认长期存储。
      </p>
    </form>
  );
}
