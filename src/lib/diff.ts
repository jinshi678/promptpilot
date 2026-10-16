// 行级差异对比（LCS 算法，无外部依赖）

export interface DiffLine {
  type: "same" | "removed" | "added";
  text: string;
  oldLine?: number; // 旧版本行号（1 起）
  newLine?: number; // 新版本行号（1 起）
}

export interface DiffStats {
  added: number;
  removed: number;
  same: number;
}

// 对比两段文本，返回逐行差异
export function diffLines(oldText: string, newText: string): DiffLine[] {
  // 空文本视为零行，避免 split 产生的空行伪差异
  const a = oldText ? oldText.split(/\r?\n/) : [];
  const b = newText ? newText.split(/\r?\n/) : [];
  const n = a.length;
  const m = b.length;

  // dp[i][j] = a[i..] 与 b[j..] 的最长公共子序列长度
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({ type: "same", text: a[i], oldLine: i + 1, newLine: j + 1 });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: "removed", text: a[i], oldLine: i + 1 });
      i++;
    } else {
      result.push({ type: "added", text: b[j], newLine: j + 1 });
      j++;
    }
  }
  while (i < n) {
    result.push({ type: "removed", text: a[i], oldLine: i + 1 });
    i++;
  }
  while (j < m) {
    result.push({ type: "added", text: b[j], newLine: j + 1 });
    j++;
  }
  return result;
}

// 差异统计
export function diffStats(lines: DiffLine[]): DiffStats {
  const stats: DiffStats = { added: 0, removed: 0, same: 0 };
  for (const line of lines) {
    if (line.type === "added") stats.added++;
    else if (line.type === "removed") stats.removed++;
    else stats.same++;
  }
  return stats;
}
