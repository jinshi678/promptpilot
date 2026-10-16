import { describe, it, expect } from "vitest";
import { diffLines, diffStats } from "../diff";

describe("diffLines", () => {
  it("完全相同的文本无差异", () => {
    const lines = diffLines("# 标题\n内容", "# 标题\n内容");
    expect(diffStats(lines).same).toBe(2);
    expect(diffStats(lines).added).toBe(0);
    expect(diffStats(lines).removed).toBe(0);
  });

  it("检测新增行", () => {
    const lines = diffLines("第一行\n第三行", "第一行\n第二行\n第三行");
    const stats = diffStats(lines);
    expect(stats.added).toBe(1);
    expect(stats.removed).toBe(0);
    expect(lines.find((l) => l.type === "added")?.text).toBe("第二行");
  });

  it("检测删除行", () => {
    const lines = diffLines("第一行\n第二行\n第三行", "第一行\n第三行");
    const stats = diffStats(lines);
    expect(stats.removed).toBe(1);
    expect(stats.added).toBe(0);
    expect(lines.find((l) => l.type === "removed")?.text).toBe("第二行");
  });

  it("检测修改行（先删后增）", () => {
    const lines = diffLines("旧约束", "新约束");
    const stats = diffStats(lines);
    expect(stats.removed).toBe(1);
    expect(stats.added).toBe(1);
  });

  it("空文本对比", () => {
    expect(diffLines("", "新内容")).toHaveLength(1);
    expect(diffLines("旧内容", "")).toHaveLength(1);
    expect(diffLines("", "")).toHaveLength(0);
  });

  it("行号正确标注", () => {
    const lines = diffLines("A\nB", "A\nX\nB");
    const added = lines.find((l) => l.type === "added");
    expect(added?.newLine).toBe(2);
    const sameB = lines.find((l) => l.type === "same" && l.text === "B");
    expect(sameB?.oldLine).toBe(2);
    expect(sameB?.newLine).toBe(3);
  });

  it("处理 CRLF 换行", () => {
    const lines = diffLines("A\r\nB", "A\nB");
    expect(diffStats(lines).same).toBe(2);
  });

  it("真实场景：提示词版本演进", () => {
    const v1 = "# 任务目标\n写邮件\n\n# 验收标准\n- 语气得体";
    const v2 = "# 任务目标\n写道歉邮件\n\n# 约束条件\n- 150字\n\n# 验收标准\n- 语气得体";
    const stats = diffStats(diffLines(v1, v2));
    expect(stats.added).toBeGreaterThanOrEqual(2);
    expect(stats.same).toBeGreaterThanOrEqual(4);
  });
});
