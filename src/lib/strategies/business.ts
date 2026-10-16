import type { PromptStrategy, StrategyContext } from "./types";
import {
  buildCommonSections,
  buildConstraintsSection,
  buildOutputSection,
  buildAcceptanceSection,
  buildExceptionSection,
} from "./types";

export const businessStrategy: PromptStrategy = {
  name: "商业与营销",

  getSpecificConstraints(ctx: StrategyContext): string[] {
    const constraints = [
      "明确目标用户画像",
      "设定可衡量的商业目标",
      "区分事实数据和推测判断",
      "给出具体可执行的动作",
      "标注可能的风险和应对",
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
