import type { PromptStrategy, StrategyContext } from "./types";
import {
  buildCommonSections,
  buildConstraintsSection,
  buildOutputSection,
  buildAcceptanceSection,
  buildExceptionSection,
} from "./types";

export const writingStrategy: PromptStrategy = {
  name: "写作创作",

  getSpecificConstraints(ctx: StrategyContext): string[] {
    const constraints = [
      "保留用户提供的关键事实和数据",
      "减少套话和无意义扩写",
      "确保内容逻辑连贯",
    ];
    if (ctx.optimizationLevel === "expert") {
      constraints.push("明确读者画像、写作目的、语气风格和篇幅要求");
    }
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
