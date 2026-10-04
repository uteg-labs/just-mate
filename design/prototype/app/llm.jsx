// Live onboarding questions + vibe line via Claude, with local fallbacks.
const jmWait = (ms) => new Promise((r) => setTimeout(r, ms));
const jmTimeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));

const JM_LLM_SYSTEM = (mode) => `You write onboarding questions for just-mate, an app where two compatible strangers nearby meet in person right now. No photos, no chat.
The user is looking for ${mode === "date" ? "a date (romance)" : "a mate (friendship, someone to hang out with)"}.
Ask ONE new question that builds on their previous answers and digs a little deeper. Never repeat a topic already asked.
Voice: calm, specific, a little wry. Sentence case, under 60 characters, no emoji, no exclamation marks.
Give exactly 4 answer options, each under 26 characters, lowercase, distinct from each other.
Respond with ONLY JSON: {"question":"...","options":["...","...","...","..."]}`;

async function jmNextQuestion({ mode, name, interests, qa, live }) {
  const fb = () => JM_FALLBACK_Q[mode][qa.length % JM_FALLBACK_Q[mode].length];
  if (!live || !window.claude) { await jmWait(650); return { ...fb(), source: "sample" }; }
  try {
    const history = qa.length ? qa.map((x, i) => `Q${i + 1}: ${x.q}\nA${i + 1}: ${x.a}`).join("\n") : "none yet";
    const user = `Name: ${name || "unknown"}\nInterests: ${(interests || []).join(", ") || "none"}\nPrevious questions and answers:\n${history}\nWrite question ${qa.length + 1} of 4.`;
    const res = await Promise.race([window.claude.complete({ system: JM_LLM_SYSTEM(mode), messages: [{ role: "user", content: user }], max_tokens: 300 }), jmTimeout(12000)]);
    const j = JSON.parse(String(res).match(/\{[\s\S]*\}/)[0]);
    if (!j.question || !Array.isArray(j.options) || j.options.length < 2) throw new Error("shape");
    let q = String(j.question).trim();
    q = q.charAt(0).toUpperCase() + q.slice(1);
    if (!/[?.…]$/.test(q)) q += "?";
    return { question: q, options: j.options.slice(0, 4).map((o) => String(o).toLowerCase().trim()), source: "live" };
  } catch (e) {
    return { ...fb(), source: "sample" };
  }
}

async function jmVibe({ mode, interests, qa, live, avoid }) {
  const fb = () => { const pool = JM_VIBES.filter((v) => v !== avoid); return pool[Math.floor(Math.random() * pool.length)]; };
  if (!live || !window.claude) { await jmWait(700); return fb(); }
  try {
    const user = `Interests: ${(interests || []).join(", ")}\n${qa.map((x) => `${x.q} → ${x.a}`).join("\n")}\n${avoid ? `Different from: "${avoid}"` : ""}`;
    const res = await Promise.race([window.claude.complete({
      system: `Write a "vibe line" for a faceless ${mode === "date" ? "dating" : "friendship"} profile from these answers. Two short lowercase clauses joined by " — ", wry and specific, max 60 characters, no names, no emoji, no quotes. Return only the line.`,
      messages: [{ role: "user", content: user }], max_tokens: 80 }), jmTimeout(10000)]);
    const line = String(res).trim().replace(/^["“]|["”]$/g, "").split("\n")[0].toLowerCase();
    if (line.length < 8 || line.length > 90) throw new Error("len");
    return line;
  } catch (e) {
    return fb();
  }
}
async function jmRelated({ item, mode, live, have }) {
  const st = (JM_RELATED[mode] || {})[item] || JM_RELATED.date[item] || JM_RELATED.mate[item];
  const fresh = (list) => list.filter((x) => !have.includes(x)).slice(0, 3);
  if (st) { await jmWait(420); return fresh(st); }
  if (!live || !window.claude) { await jmWait(300); return []; }
  try {
    const res = await Promise.race([window.claude.complete({
      system: "Return exactly 3 interests closely related to the given one, for a social app profile. Each 1-3 words, lowercase, no emoji. Output them comma separated and nothing else.",
      messages: [{ role: "user", content: `${item} (context: ${mode === "date" ? "dating" : "making friends"})` }], max_tokens: 60 }), jmTimeout(8000)]);
    return fresh(String(res).split(/[,\n]/).map((x) => x.trim().toLowerCase().replace(/^[-•\d.\s]+/, "")).filter((x) => x && x.length < 24));
  } catch (e) { return []; }
}
Object.assign(window, { jmNextQuestion, jmVibe, jmRelated });
