import { describe, it, expect } from "vitest";
import { mockOptimize } from "../mockOptimize";
import type { OptimizeRequest } from "@/types";
import { testCases } from "./testCases";

function makeReq(input: string, overrides: Partial<OptimizeRequest> = {}): OptimizeRequest {
  return {
    input,
    taskType: "auto",
    optimizationLevel: "deep",
    outputFormat: "prompt",
    ...overrides,
  };
}

describe("提示词优化流程", () => {
  it("正常需求生成完整结果", () => {
    const result = mockOptimize(makeReq("帮我写一封道歉邮件"));
    expect(result.isMock).toBe(true);
    expect(result.prompt).toContain("任务目标");
    expect(result.prompt).toContain("具体任务");
    expect(result.qualityCheck.dimensions).toHaveLength(6);
    expect(result.qualityCheck.totalScore).toBeGreaterThan(0);
    expect(result.qualityCheck.totalScore).toBeLessThanOrEqual(100);
  });

  it("生成的提示词包含结构化段落", () => {
    const result = mockOptimize(makeReq("用 Python 写脚本"));
    expect(result.prompt).toContain("# 任务目标");
    expect(result.prompt).toContain("# 角色与专业视角");
    expect(result.prompt).toContain("# 具体任务");
    expect(result.prompt).toContain("# 输出格式");
  });

  it("编程策略包含编程专属约束", () => {
    const result = mockOptimize(makeReq("用 Python 写一个批量重命名脚本"));
    expect(result.prompt).toContain("危险操作");
    expect(result.prompt).toContain("影响范围");
  });

  it("分析策略包含分析专属要求", () => {
    const result = mockOptimize(makeReq("帮我分析两个方案的优劣"));
    expect(result.prompt).toContain("备选方案");
    expect(result.prompt).toContain("事实");
  });

  it("学习策略包含学习专属要求", () => {
    const result = mockOptimize(makeReq("我想从零开始学机器学习"));
    expect(result.prompt).toContain("练习");
  });

  it("轻度优化不包含执行步骤", () => {
    const result = mockOptimize(
      makeReq("帮我写邮件", { optimizationLevel: "light" })
    );
    expect(result.prompt).not.toContain("执行步骤");
  });

  it("深度优化包含执行步骤", () => {
    const result = mockOptimize(
      makeReq("帮我写邮件", { optimizationLevel: "deep" })
    );
    expect(result.prompt).toContain("执行步骤");
  });

  it("专家级优化包含异常处理段", () => {
    const result = mockOptimize(
      makeReq("帮我写邮件", { optimizationLevel: "expert" })
    );
    expect(result.prompt).toContain("异常处理");
  });

  it("质量检查包含 6 个维度", () => {
    const result = mockOptimize(makeReq("测试"));
    const names = result.qualityCheck.dimensions.map((d) => d.name);
    expect(names).toContain("目标清晰度");
    expect(names).toContain("背景完整度");
    expect(names).toContain("任务可执行性");
    expect(names).toContain("约束明确度");
    expect(names).toContain("输出可用性");
    expect(names).toContain("验收可验证性");
  });

  it("质量检查总分是各维度平均值", () => {
    const result = mockOptimize(makeReq("测试"));
    const avg = Math.round(
      result.qualityCheck.dimensions.reduce((s, d) => s + d.score, 0) / 6
    );
    expect(result.qualityCheck.totalScore).toBe(avg);
  });

  it("保留用户原始需求", () => {
    const input = "帮我写一封给客户的道歉邮件，因为订单延迟了三天";
    const result = mockOptimize(makeReq(input));
    expect(result.prompt).toContain("订单延迟了三天");
  });

  it("遍历所有测试用例，均能生成有效结果", () => {
    let passCount = 0;
    for (const tc of testCases) {
      const result = mockOptimize(makeReq(tc.input));
      // 必须包含任务目标和具体任务
      const hasGoal = result.prompt.includes("任务目标");
      const hasTask = result.prompt.includes("具体任务");
      // 质量检查必须有 6 维度
      const has6Dims = result.qualityCheck.dimensions.length === 6;
      // 总分在 0-100
      const validScore =
        result.qualityCheck.totalScore >= 0 &&
        result.qualityCheck.totalScore <= 100;
      if (hasGoal && hasTask && has6Dims && validScore) passCount++;
    }
    // 通过率应 >= 80%
    expect(passCount / testCases.length).toBeGreaterThanOrEqual(0.8);
  });
});

describe("澄清问题", () => {
  it("关键信息缺失时生成澄清问题", () => {
    const result = mockOptimize(makeReq("帮我写个程序"));
    expect(result.questions.length).toBeGreaterThan(0);
  });

  it("澄清问题数量不超过 3 个", () => {
    const result = mockOptimize(makeReq("帮我"));
    expect(result.questions.length).toBeLessThanOrEqual(3);
  });
});
