import type { PromptStrategy, StrategyContext } from "./types";
import {
  buildCommonSections,
  buildConstraintsSection,
  buildOutputSection,
  buildAcceptanceSection,
  buildExceptionSection,
} from "./types";

export const codingStrategy: PromptStrategy = {
  name: "编程开发",

  getSpecificConstraints(ctx: StrategyContext): string[] {
    const constraints = [
      "先分析现有代码或需求，再给出方案，最后实施",
      "修改时说明影响范围",
      "代码需包含必要的注释",
      "禁止未经授权删除数据或执行危险操作",
      "如涉及生产环境或数据操作，需明确提示风险",
    ];
    if (ctx.optimizationLevel === "expert") {
      constraints.push("要求汇报修改文件清单、测试结果和未解决问题");
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
