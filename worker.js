/* ==========================================================
   StudyFlo quiz server (Cloudflare Worker).
   Keeps your Anthropic API key off the website.
   Setup steps are in server/README.md.
   ========================================================== */

const MODEL = "claude-haiku-4-5-20251001"; // change here to use a different model
const MAX_TEXT = 60000;

const SYSTEM = `You write multiple-choice quiz questions from study material.
Reply with JSON only, no other text, in this shape:
{"questions":[{"q":"question text","options":["A","B","C","D"],"answer":0,"why":"one or two sentence explanation"}]}
Rules: write exactly the number of questions asked. Each has four options and "answer" is the index (0 to 3) of the right one.
Base every question only on the material given. Vary which position holds the right answer. Keep questions clear and self-contained.`;

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    const reply = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return reply({ error: "Use POST." }, 405);

    let body;
    try { body = await request.json(); } catch { return reply({ error: "Bad request." }, 400); }

    const count = Math.min(20, Math.max(5, parseInt(body.count) || 10));
    const material = [];
    if (body.image) {
      material.push({ type: "image", source: { type: "base64", media_type: body.mediaType || "image/png", data: body.image } });
    } else if (typeof body.text === "string" && body.text.length > 40) {
      material.push({ type: "text", text: "Study material:\n\n" + body.text.slice(0, MAX_TEXT) });
    } else {
      return reply({ error: "Nothing to make a quiz from." }, 400);
    }
    material.push({ type: "text", text: `Write ${count} questions from this material.` });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, system: SYSTEM, messages: [{ role: "user", content: material }] }),
    });
    if (!res.ok) return reply({ error: "The AI service couldn't answer. Try again in a moment." }, 502);

    try {
      const data = await res.json();
      const raw = data.content.map((b) => b.text || "").join("").replace(/```json|```/g, "").trim();
      return reply(JSON.parse(raw));
    } catch {
      return reply({ error: "The AI reply couldn't be read. Try again." }, 502);
    }
  },
};
