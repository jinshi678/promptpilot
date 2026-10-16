"use client";

import { useState, useEffect } from "react";
import PromptInput from "./PromptInput";
import ResultWorkspace from "./ResultWorkspace";
import SavedList from "./SavedList";
import type {
  OptimizeResponse,
  TaskType,
  OptimizationLevel,
  OutputFormat,
} from "@/types";
import {
  getSavedPrompts,
  savePrompt,
  deletePrompt,
  updatePrompt,
  type SavedPrompt,
} from "@/lib/storage";
import {
  fetchSavedPrompts,
  savePromptRemote,
  deletePromptRemote,
  renamePromptRemote,
  migrateLocalIfNeeded,
} from "@/lib/api-storage";

export default function Optimizer() {
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [lastInput, setLastInput] = useState("");
  const [lastTaskType, setLastTaskType] = useState<TaskType>("auto");
  const [lastOptimizationLevel, setLastOptimizationLevel] = useState<OptimizationLevel>("deep");
  const [lastOutputFormat, setLastOutputFormat] = useState<OutputFormat>("prompt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedPrompt[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // 加载已保存的提示词：优先服务端（云端），失败时回退本地 localStorage
  useEffect(() => {
    fetchSavedPrompts()
      .then(async (remote) => {
        // 服务端为空且本地有历史数据：一次性迁移到云端
        await migrateLocalIfNeeded(getSavedPrompts());
        const finalList = await fetchSavedPrompts().catch(() => remote);
        setSaved(finalList);
      })
      .catch(() => setSaved(getSavedPrompts()));
  }, []);

  const handleSubmit = async (data: {
    input: string;
    taskType: TaskType;
    optimizationLevel: OptimizationLevel;
    outputFormat: OutputFormat;
  }) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setIsSaved(false);
    setLastInput(data.input);
    setLastTaskType(data.taskType);
    setLastOptimizationLevel(data.optimizationLevel);
    setLastOutputFormat(data.outputFormat);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "生成失败，请重试");
      }

      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      // 优先保存到服务端（云端收藏）
      const record = await savePromptRemote({
        originalInput: lastInput,
        taskType: lastTaskType,
        optimizationLevel: lastOptimizationLevel,
        outputFormat: lastOutputFormat,
        result,
      });
      setSaved((prev) => {
        const exists = prev.some((p) => p.id === record.id);
        return exists
          ? prev.map((p) => (p.id === record.id ? record : p))
          : [record, ...prev];
      });
    } catch {
      // 服务端不可用：降级保存到本地 localStorage
      savePrompt({
        originalInput: lastInput,
        taskType: lastTaskType,
        result,
      });
      setSaved(getSavedPrompts());
    }
    setIsSaved(true);
  };

  const handleDelete = async (id: string) => {
    setSaved((prev) => prev.filter((p) => p.id !== id));
    try {
      await deletePromptRemote(id);
    } catch {
      // 服务端不可用：降级删除本地记录
      deletePrompt(id);
      setSaved(getSavedPrompts());
    }
  };

  const handleEditTitle = async (id: string, title: string) => {
    setSaved((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
    try {
      await renamePromptRemote(id, title);
    } catch {
      // 服务端不可用：降级更新本地记录
      updatePrompt(id, { title });
      setSaved(getSavedPrompts());
    }
  };

  const handleLoad = (prompt: SavedPrompt) => {
    // 加载收藏的提示词到结果区（保留真实/模拟来源标记）
    setResult({
      isMock: prompt.isMock ?? false,
      analysis: {
        goal: prompt.originalInput.slice(0, 150),
        context: "从收藏加载",
        taskType: prompt.taskType,
        inputMaterials: [],
        constraints: [],
        expectedOutput: "",
        successCriteria: [],
        missingInfo: [],
        risks: [],
        assumptions: [],
      },
      questions: [],
      prompt: prompt.prompt,
      qualityCheck: {
        dimensions: [],
        totalScore: prompt.qualityScore,
        summary: "从收藏加载的提示词",
        needsRevision: false,
      },
      revisionNotes: ["从历史收藏加载"],
    });
    setLastInput(prompt.originalInput);
    setLastTaskType(prompt.taskType);
    setIsSaved(true);
    setShowSaved(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      {/* 标题区 */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          PromptPilot
        </h1>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          把模糊想法变成高质量、可执行的提示词
        </p>
      </header>

      {/* 标签切换 */}
      <div className="mb-6 flex justify-center gap-2">
        <button
          onClick={() => setShowSaved(false)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            !showSaved
              ? "bg-indigo-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          生成提示词
        </button>
        <button
          onClick={() => setShowSaved(true)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            showSaved
              ? "bg-indigo-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          我的收藏 ({saved.length})
        </button>
      </div>

      {!showSaved ? (
        <>
          {/* 输入区 */}
          <PromptInput onSubmit={handleSubmit} loading={loading} />

          {/* 错误提示 */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-zinc-500">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />
              正在分析并优化...
            </div>
          )}

          {/* 结果区 */}
          {result && !loading && (
            <div className="mt-8">
              <ResultWorkspace
                result={result}
                originalInput={lastInput}
                taskType={lastTaskType}
                onReoptimize={() => {
                  setResult(null);
                  setIsSaved(false);
                }}
                onSave={handleSave}
                saved={isSaved}
              />
            </div>
          )}
        </>
      ) : (
        <SavedList
          prompts={saved}
          onDelete={handleDelete}
          onEditTitle={handleEditTitle}
          onLoad={handleLoad}
        />
      )}
    </div>
  );
}
