// 连通性验证脚本：直接调用模型供应商接口
// 用法：node scripts/verify-model.mjs
import { readFileSync } from "node:fs";

// 手动解析 .env.local（避免引入 dotenv 依赖）
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

if (!env.MODEL_API_KEY) {
  console.error("FAIL: .env.local 中未配置 MODEL_API_KEY");
  process.exit(1);
}

const url = `${env.MODEL_API_URL}/chat/completions`;
const body = {
  model: env.MODEL_NAME,
  messages: [{ role: "user", content: "请只回复两个字：正常" }],
  max_tokens: 16,
  temperature: 0,
};

const t0 = Date.now();
try {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MODEL_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const dt = Date.now() - t0;
  const data = await res.json();

  console.log(`HTTP ${res.status}  ${dt}ms`);
  console.log(`供应商: ${env.MODEL_PROVIDER}  模型: ${env.MODEL_NAME}`);
  const reply = data.choices?.[0]?.message?.content;
  if (res.ok && reply) {
    console.log(`回复: ${reply.trim()}`);
    console.log("PASS: 连通性验证通过");
  } else {
    console.log(`FAIL: ${JSON.stringify(data).slice(0, 300)}`);
    process.exit(1);
  }
} catch (err) {
  console.log(`FAIL: ${err.message}`);
  process.exit(1);
}
