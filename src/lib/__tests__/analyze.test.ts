import { describe, it, expect } from "vitest";
import { detectTaskType, analyzeRequirement } from "../analyze";
import { testCases } from "./testCases";

describe("任务类型检测", () => {
  it("检测编程开发任务", () => {
    expect(detectTaskType("用 Python 写一个脚本")).toBe("coding");
    expect(detectTaskType("帮我修复这个 bug")).toBe("coding");
    expect(detectTaskType("写一个 SQL 查询")).toBe("coding");
  });

  it("检测写作创作任务", () => {
    expect(detectTaskType("帮我写一封邮件")).toBe("writing");
    expect(detectTaskType("写一篇文章")).toBe("writing");
  });

  it("检测学习辅导任务", () => {
    expect(detectTaskType("我想学习机器学习")).toBe("learning");
    expect(detectTaskType("解释一下什么是递归")).toBe("learning");
  });

  it("检测分析决策任务", () => {
    expect(detectTaskType("帮我分析两个方案")).toBe("analysis");
    expect(detectTaskType("对比 A 和 B 的优劣")).toBe("analysis");
  });

  it("检测自动化任务", () => {
    expect(detectTaskType("写一个自动发送邮件的脚本")).toBe("automation");
    expect(detectTaskType("设计一个智能体")).toBe("automation");
  });

  it("检测图像生成任务", () => {
    expect(detectTaskType("生成一张风景图")).toBe("image");
    expect(detectTaskType("设计一个 Logo")).toBe("image");
  });

  it("无法识别时返回 other", () => {
    expect(detectTaskType("帮我做点什么")).toBe("other");
  });

  it("遍历所有测试用例，任务类型检测符合预期", () => {
    for (const tc of testCases) {
      if (tc.expectedTaskType) {
        const result = detectTaskType(tc.input);
        expect(result, `用例 ${tc.id}: "${tc.input}"`).toBe(tc.expectedTaskType);
      }
    }
  });
});

describe("需求分析", () => {
  it("返回完整的分析结构", () => {
    const result = analyzeRequirement("用 Python 写一个脚本", "auto");
    expect(result).toHaveProperty("goal");
    expect(result).toHaveProperty("taskType");
    expect(result).toHaveProperty("context");
    expect(result).toHaveProperty("constraints");
    expect(result).toHaveProperty("expectedOutput");
    expect(result).toHaveProperty("successCriteria");
    expect(result).toHaveProperty("missingInfo");
    expect(result).toHaveProperty("risks");
    expect(result).toHaveProperty("assumptions");
  });

  it("提取约束条件", () => {
    const result = analyzeRequirement(
      "写一个函数，必须用 TypeScript，不能使用任何第三方库",
      "auto"
    );
    expect(result.constraints.length).toBeGreaterThan(0);
  });

  it("编程任务检测缺失的技术栈信息", () => {
    const result = analyzeRequirement("帮我写个程序", "auto");
    expect(result.missingInfo).toContain("编程语言或技术栈");
  });

  it("写作任务检测缺失的读者信息", () => {
    const result = analyzeRequirement("帮我写一篇文章", "auto");
    expect(result.missingInfo).toContain("目标读者");
  });

  it("遍历测试用例，缺失信息检测合理", () => {
    for (const tc of testCases) {
      const result = analyzeRequirement(tc.input, "auto");
      // 所有分析结果都应包含 assumptions（默认假设）
      expect(result.assumptions.length).toBeGreaterThan(0);
      // 成功标准不应为空
      expect(result.successCriteria.length).toBeGreaterThan(0);
    }
  });
});
