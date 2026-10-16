import type { RequirementAnalysis, OptimizationLevel, OutputFormat } from "@/types";

export interface StrategyContext {
  analysis: RequirementAnalysis;
  originalInput: string;
  optimizationLevel: OptimizationLevel;
  outputFormat: OutputFormat;
}

export interface PromptStrategy {
  // 策略名称
  name: string;
  // 生成提示词
  buildPrompt(ctx: StrategyContext): string;
  // 该策略特有的约束（会追加到约束条件段）
  getSpecificConstraints(ctx: StrategyContext): string[];
}

// 通用提示词段落
export function buildCommonSections(ctx: StrategyContext): string[] {
  const { analysis, originalInput, optimizationLevel, outputFormat } = ctx;
  const sections: string[] = [];

  sections.push(`# 任务目标\n${analysis.goal}`);

  sections.push(`# 角色与专业视角\n请以${roleForTask(analysis.taskType)}的专业视角完成此任务。`);

  if (analysis.context) {
    sections.push(`# 背景信息\n${analysis.context}`);
  }

  if (analysis.inputMaterials.length > 0) {
    sections.push(`# 输入材料\n${analysis.inputMaterials.map((m) => `- ${m}`).join("\n")}`);
  }

  sections.push(`# 具体任务\n${originalInput.trim()}`);

  if (optimizationLevel !== "light") {
    sections.push(
      `# 执行步骤\n1. 理解任务目标与约束条件\n2. 制定执行方案\n3. 执行并产出结果\n4. 对照验收标准自检`
    );
  }

  return sections;
}

export function buildConstraintsSection(
  ctx: StrategyContext,
  specific: string[]
): string {
  const constraints = [...ctx.analysis.constraints, ...specific];
  if (ctx.optimizationLevel === "expert" && ctx.analysis.assumptions.length > 0) {
    constraints.push(...ctx.analysis.assumptions.map((a) => `默认假设：${a}`));
  }
  if (constraints.length === 0) return "";
  return `# 约束条件\n${constraints.map((c) => `- ${c}`).join("\n")}`;
}

export function buildOutputSection(ctx: StrategyContext): string {
  const hint: Record<OutputFormat, string> = {
    prompt: "直接输出最终结果，不要多余解释。",
    prompt_with_notes: "先输出结果，再附上简短的优化说明。",
    multi_version: "提供 2-3 个不同侧重点的版本供选择，并说明各自适用场景。",
  };
  return `# 输出格式\n${hint[ctx.outputFormat]}`;
}

export function buildAcceptanceSection(ctx: StrategyContext): string {
  if (ctx.analysis.successCriteria.length === 0) return "";
  return `# 验收标准\n${ctx.analysis.successCriteria.map((c) => `- ${c}`).join("\n")}`;
}

export function buildExceptionSection(ctx: StrategyContext): string {
  if (ctx.optimizationLevel !== "expert") return "";
  return `# 异常处理与不确定性说明\n- 如遇信息不足，先指出缺失项并给出默认假设\n- 标注不确定的结论，不要编造事实\n- 如发现需求冲突，明确指出并请求澄清`;
}

function roleForTask(t: RequirementAnalysis["taskType"]): string {
  const map: Record<string, string> = {
    auto: "通用",
    coding: "资深软件工程师",
    writing: "专业内容创作者",
    learning: "经验丰富的导师",
    analysis: "严谨的分析师",
    business: "商业策略顾问",
    automation: "自动化与智能体工程师",
    image: "图像创作指导",
    other: "通用",
  };
  return map[t] || "通用";
}
