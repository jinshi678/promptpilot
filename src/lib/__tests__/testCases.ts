// 30+ 条代表性测试需求，覆盖不同场景和难度
export interface TestCase {
  id: string;
  input: string;
  expectedTaskType?: string;
  expectedMissingInfo?: string[];
  category: string;
}

export const testCases: TestCase[] = [
  // 编程开发
  {
    id: "code-1",
    input: "用 Python 写一个批量重命名文件的脚本",
    expectedTaskType: "coding",
    category: "编程开发",
  },
  {
    id: "code-2",
    input: "帮我修复 React 组件的内存泄漏问题",
    expectedTaskType: "coding",
    expectedMissingInfo: ["具体功能需求"],
    category: "编程开发",
  },
  {
    id: "code-3",
    input: "用 TypeScript 实现一个 LRU 缓存，要求线程安全",
    expectedTaskType: "coding",
    category: "编程开发",
  },
  {
    id: "code-4",
    input: "写一个 SQL 查询，统计每个用户的订单总数和总金额",
    expectedTaskType: "coding",
    category: "编程开发",
  },
  // 写作创作
  {
    id: "write-1",
    input: "帮我写一封给客户的道歉邮件，因为订单延迟了",
    expectedTaskType: "writing",
    expectedMissingInfo: ["目标读者", "期望语气风格", "篇幅要求"],
    category: "写作创作",
  },
  {
    id: "write-2",
    input: "写一篇关于人工智能发展历史的科普文章，适合高中生阅读，1500字左右",
    expectedTaskType: "writing",
    category: "写作创作",
  },
  {
    id: "write-3",
    input: "帮我想 10 个咖啡品牌的 slogan",
    expectedTaskType: "writing",
    category: "写作创作",
  },
  {
    id: "write-4",
    input: "写一个关于时间旅行的短篇故事开头",
    expectedTaskType: "writing",
    category: "写作创作",
  },
  // 学习辅导
  {
    id: "learn-1",
    input: "我想从零开始学习机器学习，该怎么入门？",
    expectedTaskType: "learning",
    expectedMissingInfo: ["现有基础水平", "学习目标深度"],
    category: "学习辅导",
  },
  {
    id: "learn-2",
    input: "解释一下什么是区块链，用通俗的语言",
    expectedTaskType: "learning",
    category: "学习辅导",
  },
  {
    id: "learn-3",
    input: "我已经会 Python 基础，想进阶学数据分析，给我一个学习路径",
    expectedTaskType: "learning",
    category: "学习辅导",
  },
  // 分析决策
  {
    id: "analysis-1",
    input: "帮我分析买 Mac 还是 Windows 笔记本",
    expectedTaskType: "analysis",
    expectedMissingInfo: ["评估标准或决策依据", "可用资源或预算"],
    category: "分析决策",
  },
  {
    id: "analysis-2",
    input: "对比 React 和 Vue 的优劣势，帮我决定新项目用哪个",
    expectedTaskType: "analysis",
    category: "分析决策",
  },
  {
    id: "analysis-3",
    input: "分析一下远程办公和办公室办公的利弊",
    expectedTaskType: "analysis",
    category: "分析决策",
  },
  // 商业与营销
  {
    id: "biz-1",
    input: "帮我制定一个新产品的上市推广策略",
    expectedTaskType: "business",
    category: "商业与营销",
  },
  {
    id: "biz-2",
    input: "我的奶茶店生意不好，帮我想想怎么提升销量",
    expectedTaskType: "business",
    category: "商业与营销",
  },
  {
    id: "biz-3",
    input: "帮我制定新产品的定价和推广策略",
    expectedTaskType: "business",
    category: "商业与营销",
  },
  // 自动化与智能体
  {
    id: "auto-1",
    input: "帮我写一个自动发送每日日报邮件的脚本",
    expectedTaskType: "automation",
    expectedMissingInfo: ["可用工具或平台", "执行权限与人工确认条件"],
    category: "自动化与智能体",
  },
  {
    id: "auto-2",
    input: "设计一个自动监控网站可用性并告警的智能体",
    expectedTaskType: "automation",
    category: "自动化与智能体",
  },
  {
    id: "auto-3",
    input: "写一个爬虫自动抓取新闻标题",
    expectedTaskType: "automation",
    category: "自动化与智能体",
  },
  // 图像生成
  {
    id: "image-1",
    input: "帮我生成一张赛博朋克风格的城市夜景图",
    expectedTaskType: "image",
    expectedMissingInfo: ["尺寸与比例"],
    category: "图像生成",
  },
  {
    id: "image-2",
    input: "设计一个简约风格的咖啡店 Logo",
    expectedTaskType: "image",
    category: "图像生成",
  },
  // 模糊需求
  {
    id: "vague-1",
    input: "帮我做点东西",
    expectedTaskType: "other",
    expectedMissingInfo: ["更具体的需求描述"],
    category: "模糊需求",
  },
  {
    id: "vague-2",
    input: "写点什么",
    expectedTaskType: "writing",
    category: "模糊需求",
  },
  {
    id: "vague-3",
    input: "给我一个方案",
    expectedTaskType: "other",
    category: "模糊需求",
  },
  // 冲突约束
  {
    id: "conflict-1",
    input: "写一个简洁详细的技术方案，既要非常简短又要面面俱到",
    category: "冲突约束",
  },
  {
    id: "conflict-2",
    input: "用 Python 写一个不需要安装任何库的数据分析工具，必须支持可视化",
    category: "冲突约束",
  },
  // 缺少关键条件
  {
    id: "missing-1",
    input: "帮我写个程序",
    expectedMissingInfo: ["编程语言或技术栈", "具体功能需求"],
    category: "缺少关键条件",
  },
  {
    id: "missing-2",
    input: "帮我写一篇文章",
    expectedMissingInfo: ["目标读者", "期望语气风格", "篇幅要求"],
    category: "缺少关键条件",
  },
  // 清晰完整需求
  {
    id: "clear-1",
    input: "用 Python 写一个函数，输入一个列表，返回列表中所有偶数的和。要求有类型注解和文档字符串。",
    expectedTaskType: "coding",
    category: "清晰完整需求",
  },
  {
    id: "clear-2",
    input: "写一封正式的商务邮件，通知客户我们的服务价格将在下个月上调 10%，语气要礼貌专业，200 字以内。",
    expectedTaskType: "writing",
    category: "清晰完整需求",
  },
  // 其他
  {
    id: "other-1",
    input: "帮我做一道番茄炒蛋",
    category: "其他",
  },
  {
    id: "other-2",
    input: "推荐几本适合产品经理读的书",
    category: "其他",
  },
];
