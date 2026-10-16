// 任务类型
export type TaskType =
  | "auto"
  | "coding"
  | "writing"
  | "learning"
  | "analysis"
  | "business"
  | "automation"
  | "image"
  | "other";

// 优化程度
export type OptimizationLevel = "light" | "deep" | "expert";

// 输出形式
export type OutputFormat = "prompt" | "prompt_with_notes" | "multi_version";

// 需求分析结果
export interface RequirementAnalysis {
  goal: string; // 用户目标
  context: string; // 背景和上下文
  taskType: TaskType; // 任务类型
  inputMaterials: string[]; // 已知输入材料
  constraints: string[]; // 必须遵守的约束
  expectedOutput: string; // 期望输出
  successCriteria: string[]; // 成功标准
  missingInfo: string[]; // 尚未确定的关键信息
  risks: string[]; // 潜在冲突和风险
  assumptions: string[]; // 系统默认假设
}

// 澄清问题
export interface ClarifyingQuestion {
  id: string;
  question: string;
  reason: string; // 为什么问这个
  optional: boolean; // 是否可跳过
}

// 质量维度
export interface QualityDimension {
  name: string; // 维度名称
  score: number; // 0-100
  issues: string[]; // 发现的问题
  suggestion: string; // 改进建议
}

// 质量检查结果
export interface QualityCheckResult {
  dimensions: QualityDimension[];
  totalScore: number; // 0-100
  summary: string; // 总体评价
  needsRevision: boolean; // 是否需要修复
}

// 优化响应
export interface OptimizeResponse {
  isMock: boolean; // 是否模拟结果
  analysis: RequirementAnalysis;
  questions: ClarifyingQuestion[]; // 需要用户回答的问题
  prompt: string; // 优化后的提示词
  qualityCheck: QualityCheckResult;
  revisionNotes: string[]; // 主要修改说明
}

// 优化请求
export interface OptimizeRequest {
  input: string;
  taskType: TaskType;
  optimizationLevel: OptimizationLevel;
  outputFormat: OutputFormat;
}

// 任务类型显示名称
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  auto: "自动判断",
  coding: "编程开发",
  writing: "写作创作",
  learning: "学习辅导",
  analysis: "分析决策",
  business: "商业与营销",
  automation: "自动化与 AI 智能体",
  image: "图像生成",
  other: "其他",
};

// 优化程度显示名称
export const OPTIMIZATION_LEVEL_LABELS: Record<OptimizationLevel, string> = {
  light: "轻度优化",
  deep: "深度优化",
  expert: "专家级设计",
};

// 输出形式显示名称
export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  prompt: "可直接使用的提示词",
  prompt_with_notes: "提示词与优化说明",
  multi_version: "多版本提示词",
};
