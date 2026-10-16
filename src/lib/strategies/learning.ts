import type { PromptStrategy, StrategyContext } from "./types";
import {
  buildCommonSections,
  buildConstraintsSection,
  buildOutputSection,
  buildAcceptanceSection,
  buildExceptionSection,
} from "./types";

export const learningStrategy: PromptStrategy = {
  name: "学习辅导",

  getSpecificConstraints(ctx: StrategyContext): string[] {
    const constraints = [
      "识别学习者的现有基础并匹配难度",
      "将学习内容分解为递进步骤",
      "每个步骤配有练习和理解检查",
      "用通俗易懂的语言解释概念",
      "提供反馈和纠错机制",
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
