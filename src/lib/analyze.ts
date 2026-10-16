import type { RequirementAnalysis, TaskType } from "@/types";

// 任务类型检测关键词（按优先级排序，意图明确的排在前面）
const TASK_TYPE_PATTERNS: { type: TaskType; pattern: RegExp }[] = [
  {
    type: "learning",
    pattern: /(学习|教程|讲解|入门|基础|原理|概念|解释|教我|怎么学|从零|指南|课程|练习|习题|学数据分析|进阶学|学会)/,
  },
  {
    type: "automation",
    pattern: /(自动化|批处理|智能体|agent|工作流|定时|爬虫|监控|自动执行|机器人|rpa|自动发送|自动处理)/i,
  },
  {
    type: "image",
    pattern: /(图|画|海报|插画|logo|设计图|图像|封面|头像|壁纸|midjourney|stable diffusion|ai绘画)/i,
  },
  {
    type: "analysis",
    pattern: /(分析|对比|评估|决策|选择|优劣势|利弊|比较|权衡|调查|研究|复盘)/,
  },
  {
    type: "coding",
    pattern:
      /(代码|编程|开发|函数|bug|debug|接口|api|数据库|前端|后端|算法|程序|部署|重构|类|模块|框架|react|vue|python|java|javascript|typescript|sql|查询|命令行|脚本)/i,
  },
  {
    type: "writing",
    pattern: /(写|文章|文案|故事|诗|邮件|报告|新闻|推文|演讲稿|博客|散文|小说|剧本|标题|slogan|想.*个|广告语)/,
  },
  {
    type: "business",
    pattern: /(营销|推广|品牌|增长|转化|商业|运营|市场|销售|定价|竞品|奶茶店|生意|策略)/,
  },
];

export function detectTaskType(input: string): TaskType {
  for (const { type, pattern } of TASK_TYPE_PATTERNS) {
    if (pattern.test(input)) return type;
  }
  return "other";
}

// 从输入中提取约束（常见约束表达）
function extractConstraints(input: string): string[] {
  const constraints: string[] = [];
  const constraintPatterns = [
    /(必须|一定|不能|不要|禁止|避免|需要|要求|只能|只允许)[^，。！？\n]*/g,
    /(限制|约束|条件|前提)[^，。！？\n]*/g,
  ];
  for (const pattern of constraintPatterns) {
    const matches = input.match(pattern);
    if (matches) constraints.push(...matches.map((m) => m.trim()));
  }
  return constraints.slice(0, 5);
}

// 检测缺失的关键信息（基于任务类型）
function detectMissingInfo(input: string, taskType: TaskType): string[] {
  const missing: string[] = [];
  const text = input.toLowerCase();

  switch (taskType) {
    case "coding":
      if (!/(语言|技术栈|框架|python|java|js|ts|react|vue|node|sql)/i.test(text))
        missing.push("编程语言或技术栈");
      if (!/(功能|需求|实现|目标|做什么)/.test(text))
        missing.push("具体功能需求");
      if (!/(环境|系统|平台|浏览器|服务器)/.test(text) && !input.includes("报错"))
        missing.push("运行环境");
      break;
    case "writing":
      if (!/(读者|受众|给谁|用户|学生|客户|老板)/.test(text))
        missing.push("目标读者");
      if (!/(语气|风格|正式|轻松|幽默|专业)/.test(text))
        missing.push("期望语气风格");
      if (!/(字数|篇幅|长度|多少字|简短|详细)/.test(text))
        missing.push("篇幅要求");
      break;
    case "analysis":
      if (!/(标准|维度|依据|指标|看重)/.test(text))
        missing.push("评估标准或决策依据");
      if (!/(预算|成本|资源|限制)/.test(text))
        missing.push("可用资源或预算");
      break;
    case "learning":
      if (!/(基础|水平|程度|零基础|已有|会|懂)/.test(text))
        missing.push("现有基础水平");
      if (!/(目标|达到|掌握|学会|深度)/.test(text))
        missing.push("学习目标深度");
      break;
    case "automation":
      if (!/(工具|软件|平台|api|浏览器|系统)/i.test(text))
        missing.push("可用工具或平台");
      if (!/(权限|确认|人工|审批)/.test(text))
        missing.push("执行权限与人工确认条件");
      break;
    case "image":
      if (!/(风格|画风|写实|卡通|插画|简约|赛博)/.test(text))
        missing.push("图像风格");
      if (!/(尺寸|比例|横版|竖版|正方形)/.test(text))
        missing.push("尺寸与比例");
      break;
    default:
      if (input.length < 20) missing.push("更具体的需求描述");
  }
  return missing;
}

// 主分析函数
export function analyzeRequirement(
  input: string,
  userTaskType: TaskType
): RequirementAnalysis {
  const trimmed = input.trim();
  const taskType =
    userTaskType === "auto" ? detectTaskType(trimmed) : userTaskType;

  const constraints = extractConstraints(trimmed);
  const missingInfo = detectMissingInfo(trimmed, taskType);

  const analysis: RequirementAnalysis = {
    goal: trimmed.slice(0, 150) + (trimmed.length > 150 ? "..." : ""),
    context: buildContext(taskType, trimmed),
    taskType,
    inputMaterials: trimmed.length > 50 ? [`用户原始描述（${trimmed.length} 字）`] : [],
    constraints,
    expectedOutput: buildExpectedOutput(taskType),
    successCriteria: buildSuccessCriteria(taskType),
    missingInfo,
    risks: buildRisks(taskType, constraints),
    assumptions: buildAssumptions(taskType, missingInfo),
  };

  return analysis;
}

function buildContext(taskType: TaskType, input: string): string {
  const base: Record<TaskType, string> = {
    auto: "用户希望完成一项通用任务。",
    coding: "用户希望完成编程开发相关任务。",
    writing: "用户希望完成写作创作任务。",
    learning: "用户希望学习某个主题或获取知识。",
    analysis: "用户希望进行分析或获得决策支持。",
    business: "用户希望解决商业或营销相关问题。",
    automation: "用户希望实现自动化流程或智能体。",
    image: "用户希望生成或设计图像。",
    other: "通用任务，将采用通用提示词结构。",
  };
  return base[taskType];
}

function buildExpectedOutput(taskType: TaskType): string {
  const map: Record<TaskType, string> = {
    auto: "满足用户需求的结果。",
    coding: "可运行的代码或明确的修改方案，包含必要说明。",
    writing: "符合要求的文本内容。",
    learning: "分步骤的学习路径、讲解与练习。",
    analysis: "结构化的分析结论、备选方案与建议。",
    business: "可执行的商业或营销策略。",
    automation: "可执行的自动化方案、脚本或流程说明。",
    image: "清晰的图像生成提示词。",
    other: "满足用户需求的结果。",
  };
  return map[taskType];
}

function buildSuccessCriteria(taskType: TaskType): string[] {
  const map: Record<TaskType, string[]> = {
    auto: ["满足用户描述的需求"],
    coding: ["代码可运行", "满足功能需求", "有基本错误处理"],
    writing: ["符合目标读者", "语气恰当", "结构清晰"],
    learning: ["匹配现有基础", "有练习与反馈", "可衡量进展"],
    analysis: ["区分事实与假设", "给出备选方案", "说明判断依据"],
    business: ["有明确目标", "可执行", "有衡量指标"],
    automation: ["明确输入输出", "定义停止条件", "有失败处理"],
    image: ["画面描述清晰", "风格明确", "尺寸比例说明"],
    other: ["满足用户描述的需求"],
  };
  return map[taskType];
}

function buildRisks(taskType: TaskType, constraints: string[]): string[] {
  const risks: string[] = [];
  if (constraints.length === 0) risks.push("未明确约束条件，可能产生不符合预期的结果");
  switch (taskType) {
    case "coding":
      risks.push("可能遗漏边界条件和异常处理");
      break;
    case "writing":
      risks.push("可能出现内容空泛或偏离用户原意");
      break;
    case "analysis":
      risks.push("可能混淆事实与推测");
      break;
    case "automation":
      risks.push("自动化操作可能产生意外副作用");
      break;
  }
  return risks;
}

function buildAssumptions(taskType: TaskType, missingInfo: string[]): string[] {
  const assumptions = [
    "用户希望获得可直接用于大语言模型的提示词。",
  ];
  if (missingInfo.length > 0) {
    assumptions.push(
      `未明确说明的部分（${missingInfo.slice(0, 2).join("、")}）将采用行业通用默认值。`
    );
  }
  return assumptions;
}
