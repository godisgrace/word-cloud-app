const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const MAX_BODY = 1024 * 1024;
const API_KEY = process.env.DEEPSEEK_API_KEY;

function send(res, status, data, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(type.startsWith("application/json") ? JSON.stringify(data) : data);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > MAX_BODY) { reject(new Error("请求内容过大")); req.destroy(); }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("请求必须是有效的 JSON")); }
    });
    req.on("error", reject);
  });
}
async function askDeepSeek(system, user) {
  if (!API_KEY) {
    const err = new Error("服务端尚未配置 DEEPSEEK_API_KEY 环境变量。");
    err.status = 503;
    throw err;
  }
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: 0.6,
      response_format: { type: "json_object" },
      stream: false
    }),
    signal: AbortSignal.timeout(60000)
  });
  const raw = await response.text();
  if (!response.ok) {
    const err = new Error("DeepSeek API 请求失败（HTTP " + response.status + "）。请检查 API Key、余额和服务状态。");
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }
  let payload;
  try { payload = JSON.parse(raw); } catch { throw new Error("DeepSeek 返回了无法解析的响应。"); }
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek 没有返回有效内容。");
  try { return JSON.parse(content); } catch { throw new Error("模型返回内容不是有效 JSON，请重试。"); }
}
const system = "你是一位严谨的英语词汇教师。只返回合法 JSON，不要使用 Markdown 代码围栏。内容要准确、适合英语学习者；不确定的词源不要编造。";
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true, configured: Boolean(API_KEY), service: "WORD CLOUD API" });
  }
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    const html = fs.readFileSync(path.join(ROOT, "index.html"));
    return send(res, 200, html.toString(), "text/html; charset=utf-8");
  }
  if (req.method === "GET" && url.pathname === "/favicon.ico") return send(res, 204, "");
  if (req.method !== "POST" || !["/api/expand", "/api/word-card", "/api/quiz"].includes(url.pathname)) {
    return send(res, 404, { error: "Not found" });
  }
  try {
    const body = await readBody(req);
    const word = String(body.word || "").trim().slice(0, 120);
    if (!word) return send(res, 400, { error: "请提供要学习的单词或短语。" });
    let prompt;
    if (url.pathname === "/api/expand") {
      prompt = "请分析英文词汇或短语："+word+"。返回 JSON 对象，字段为 word, pronunciation, part_of_speech, meanings（数组）, word_family（数组，每项含 word、part_of_speech、meaning）, collocations（数组）, synonyms（数组）, antonyms（数组）, example, translation, memory_tip。中文解释，例句自然。只列可靠的词根词缀信息；短语也可分析。";
    } else if (url.pathname === "/api/word-card") {
      prompt = "请为英语学习者制作单词卡片："+word+"。返回 JSON 对象，字段 word, phonetic, gloss, example, translation, part_of_speech。释义和例句准确自然。";
    } else {
      prompt = "请为词汇 "+word+" 生成 3 道不同形式的英语练习，中文说明。返回 JSON 对象，字段 questions（数组，每项含 type、question、options（数组或空数组）、answer、explanation）。题型可为拼写、填空、语境辨析，答案和解析必须准确。";
    }
    const result = await askDeepSeek(system, prompt);
    return send(res, 200, { ok: true, result });
  } catch (err) {
    const status = err.status || (err.name === "TimeoutError" ? 504 : 500);
    return send(res, status, { error: err.message || "服务器发生未知错误。" });
  }
});
server.listen(PORT, "0.0.0.0", () => console.log("WORD CLOUD listening on " + PORT));
