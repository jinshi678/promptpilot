import type { PromptStrategy, StrategyContext } from "./types";
import {
  buildCommonSections,
  buildConstraintsSection,
  buildOutputSection,
  buildAcceptanceSection,
  buildExceptionSection,
} from "./types";

export const imageStrategy: PromptStrategy = {
  name: "图像生成",

  getSpecificConstraints(ctx: StrategyContext): string[] {
    const constraints = [
      "画面主体描述清晰具体",
      "明确图像风格（写实/插画/卡通等）",
      "说明色调和光影",
      "注明尺寸比例",
      "如含文字，明确文字内容和样式",
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
