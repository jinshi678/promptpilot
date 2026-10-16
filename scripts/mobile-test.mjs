// 移动端专项测试：iPhone 视口仿真（375×812 / 320×568）+ 完整功能流 + 布局审计
// 用法: SHOT_DIR=<目录> node scripts/mobile-test.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = "http://localhost:3000";
const OUT = process.env.SHOT_DIR || "mobile-shots";
mkdirSync(OUT, { recursive: true });

const results = [];
function log(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await ctx.newPage();
page.setDefaultTimeout(15000);

// ---------- 审计工具 ----------
async function auditViewportMeta(label) {
  const ok = await page.evaluate(() => !!document.querySelector('meta[name="viewport"]'));
  log(`${label}: viewport meta 存在`, ok);
}

async function auditOverflow(label) {
  const r = await page.evaluate(() => {
    const vw = window.innerWidth;
    const bad = [];
    document.querySelectorAll("body *").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      if (rect.right > vw + 1 || rect.left < -1) {
        const cls = typeof el.className === "string" ? el.className.slice(0, 36) : "";
        bad.push(`${el.tagName}(${cls}) r=${Math.round(rect.right)}`);
      }
    });
    return { vw, scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 6) };
  });
  log(`${label}: 无横向溢出`, r.scrollW <= r.vw + 1, `scrollW=${r.scrollW}/vw=${r.vw}${r.bad.length ? " | " + r.bad.join(" ; ") : ""}`);
}

async function auditTouchTargets(label) {
  const small = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("button, a, select, [role=button]").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.height < 24 || rect.width < 24) {
        out.push(`"${(el.textContent || "").trim().slice(0, 8)}" ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
    });
    return out;
  });
  log(`${label}: 触控目标≥24px`, small.length === 0, small.join(" ; "));
}

async function shot(name) {
  await page.screenshot({ path: join(OUT, name), fullPage: true });
}

// ---------- 1. 首页（375px） ----------
await page.goto(BASE, { waitUntil: "networkidle" });
log("首页加载", true, "375x812 iPhone 仿真");
await auditViewportMeta("首页");
await auditOverflow("首页");
await auditTouchTargets("首页");
await shot("m1-home-375.png");

// ---------- 2. 交互：下拉、优化程度按钮、示例填充 ----------
try {
  await page.selectOption("select >> nth=0", "coding");
  await page.getByRole("button", { name: "专家级设计" }).click();
  await page.locator("button", { hasText: "批量重命名" }).click();
  const val = await page.inputValue("textarea");
  log("表单交互（下拉/按钮/示例填充）", val.includes("Python"), `输入${val.length}字`);
  // 恢复默认选项
  await page.selectOption("select >> nth=0", "auto");
} catch (e) {
  log("表单交互（下拉/按钮/示例填充）", false, e.message.slice(0, 80));
}

// ---------- 3. 真实生成流程 ----------
let generated = false;
try {
  await page.fill("textarea", "帮我写一个整理会议纪要的提示词");
  await page.getByRole("button", { name: "生成优化提示词" }).click();
  await page.waitForSelector("text=优化后的提示词", { timeout: 120000 });
  generated = true;
  log("真实模型生成（移动端）", true);
  await auditOverflow("结果页");
  await auditTouchTargets("结果页");
  await shot("m2-result-375.png");
} catch (e) {
  log("真实模型生成（移动端）", false, e.message.slice(0, 80));
}

// ---------- 4. 保存收藏 + API 追加第二版本 ----------
let uid = null;
try {
  if (!generated) throw new Error("未生成结果，跳过");
  await page.getByRole("button", { name: "保存收藏" }).click();
  await page.waitForSelector("text=✓ 已收藏", { timeout: 15000 });
  uid = await page.evaluate(() => localStorage.getItem("promptpilot_uid"));
  if (!uid) throw new Error("未获取到匿名用户 ID");
  // 用同一原始输入追加第二版本（走服务端 API，与前端同款逻辑）
  const status = await page.evaluate(async (uid) => {
    const r = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": uid },
      body: JSON.stringify({
        originalInput: "帮我写一个整理会议纪要的提示词",
        taskType: "automation",
        optimizationLevel: "deep",
        outputFormat: "prompt",
        isMock: false,
        prompt:
          "第二版：你是会议纪要整理专家。请将以下会议记录整理为结构化纪要，包含：一、会议主题与时间；二、参会人；三、议题讨论摘要（按议题分节）；四、决议事项清单（含责任人）；五、待办行动项表格（事项/负责人/截止时间）。语气保持中性、精炼，总长控制在500字以内。",
        qualityScore: 78,
      }),
    });
    return r.status;
  }, uid);
  log("保存收藏 + 追加第二版本", status === 200 || status === 201, `status=${status}`);
  // 刷新以从服务端重新拉取列表（UI 状态还停留在 1 个版本）
  await page.reload({ waitUntil: "networkidle" });
} catch (e) {
  log("保存收藏 + 追加第二版本", false, e.message.slice(0, 80));
}

// ---------- 5. 收藏列表（移动端布局） ----------
try {
  await page.getByRole("button", { name: /我的收藏/ }).click();
  await page.waitForSelector("text=版本对比", { timeout: 10000 });
  log("收藏列表显示 + 版本对比按钮", true);
  await auditOverflow("收藏页");
  await auditTouchTargets("收藏页");
  await shot("m3-favorites-375.png");
} catch (e) {
  log("收藏列表显示 + 版本对比按钮", false, e.message.slice(0, 80));
}

// ---------- 6. 版本差异弹窗（移动端适配） ----------
try {
  await page.getByRole("button", { name: "版本对比" }).click();
  await page.waitForSelector("text=版本差异对比", { timeout: 10000 });
  const fit = await page.evaluate(() => {
    const panel = document.querySelector('[class*="max-h-[85vh]"]');
    if (!panel) return { ok: false, detail: "未找到弹窗面板" };
    const r = panel.getBoundingClientRect();
    return {
      ok: r.left >= -1 && r.right <= window.innerWidth + 1 && r.height <= window.innerHeight + 1,
      detail: `panel ${Math.round(r.width)}x${Math.round(r.height)} viewport ${window.innerWidth}x${window.innerHeight} 可滚动=${panel.scrollHeight > panel.clientHeight}`,
    };
  });
  log("版本对比弹窗适配（宽高在视口内）", fit.ok, fit.detail);
  await shot("m4-diff-375.png");
  // 点击弹窗"关闭"按钮
  await page.getByRole("button", { name: "关闭" }).click();
  const closed = await page
    .waitForSelector("text=版本差异对比", { state: "detached", timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  log("弹窗可正常关闭", closed);
} catch (e) {
  log("版本对比弹窗适配（宽高在视口内）", false, e.message.slice(0, 80));
}

// ---------- 7. 删除收藏 ----------
try {
  await page.getByRole("button", { name: "删除", exact: true }).click();
  await page.waitForSelector("text=还没有收藏的提示词", { timeout: 10000 });
  log("移动端删除收藏", true);
} catch (e) {
  log("移动端删除收藏", false, e.message.slice(0, 80));
}

// ---------- 8. 320px 小屏复检（首页 + 收藏空态） ----------
try {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await auditOverflow("首页320px");
  await auditTouchTargets("首页320px");
  await shot("m5-home-320.png");
} catch (e) {
  log("320px 小屏复检", false, e.message.slice(0, 80));
}

// ---------- 清理测试数据 ----------
try {
  if (uid) {
    await page.evaluate(async (uid) => {
      const list = await (await fetch("/api/sessions", { headers: { "X-User-Id": uid } })).json();
      for (const s of list.sessions) {
        await fetch(`/api/sessions/${s.id}`, { method: "DELETE", headers: { "X-User-Id": uid } });
      }
    }, uid);
    console.log("CLEANUP | 测试数据已清理");
  }
} catch {}

await browser.close();
const failed = results.filter((r) => !r.pass).length;
console.log(`\nSUMMARY: ${results.length - failed}/${results.length} passed`);
process.exit(0);
