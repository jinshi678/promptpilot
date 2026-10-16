// 验证中文数据经 API 存取后不乱码（模拟浏览器 fetch 的 UTF-8 解码行为）
const BASE = "http://localhost:3000/api/sessions";
const UID = "utf8-check-user";

const save = await fetch(BASE, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-User-Id": UID },
  body: JSON.stringify({
    originalInput: "帮我写一篇关于秋天的散文",
    title: "秋天散文写作助手",
    taskType: "writing",
    optimizationLevel: "deep",
    outputFormat: "prompt",
    isMock: false,
    prompt: "你是一位散文写作专家，请以秋天为主题写一篇800字散文……",
    qualityScore: 88,
  }),
});
const saved = await save.json();
console.log("save status:", save.status, "| title match:", saved.title === "秋天散文写作助手");
console.log("prompt match:", saved.prompt.includes("散文写作专家"));

const list = await fetch(BASE, { headers: { "X-User-Id": UID } });
const { sessions } = await list.json();
const found = sessions.find((s) => s.id === saved.id);
console.log("read-back title match:", found?.title === "秋天散文写作助手");
console.log("read-back input match:", found?.originalInput === "帮我写一篇关于秋天的散文");

const del = await fetch(`${BASE}/${saved.id}`, {
  method: "DELETE",
  headers: { "X-User-Id": UID },
});
console.log("cleanup:", del.status);
