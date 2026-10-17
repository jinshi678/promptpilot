import type { PromptStrategy, StrategyContext } from "./types";
import {
  buildCommonSections,
  buildConstraintsSection,
  buildOutputSection,
  buildAcceptanceSection,
  buildExceptionSection,
} from "./types";

export const automationStrategy: PromptStrategy = {
  name: "自动化与智能体",

  getSpecificConstraints(): string[] {
    const constraints = [
      "明确可用工具、输入输出和执行顺序",
      "定义执行权限边界",
      "设定需要人工确认的条件",
      "定义停止条件和失败处理",
      "设置重试次数上限",
      "执行后进行结果验证",
    ];
    return constraints;
  },

  buildPrompt(ctx: StrategyContext): string {
    const sections = buildCommonSections(ctx);
    const specific = this.getSpecificConstraints(ctx);
    const constraints = buildConstraintsSection(ctx, specific);
    const output = buildOutputSection(ctx);
    const acceptance = buildAcceptanceSection(ctx);
    const exception = buildExceptionSection(ctx);

    if (constraints) sections.push(constraints);
    sections.push(output);
    if (acceptance) sections.push(acceptance);
    if (exception) sections.push(exception);

    return sections.join("\n\n");
  },
};
