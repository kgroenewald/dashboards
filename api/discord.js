// Vercel serverless relay: forwards alert messages to a Discord webhook
// server-side, so the browser never makes a cross-origin (CORS-blocked)
// request to discord.com. The page POSTs { url, content } to /api/discord.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { url, content } = req.body || {};

  // Only allow real Discord webhook URLs — keeps this from being an open proxy.
  if (!url || !/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//.test(url)) {
    res.status(400).json({ error: "Invalid Discord webhook URL" });
    return;
  }
  if (!content) {
    res.status(400).json({ error: "Missing content" });
    return;
  }

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: String(content).slice(0, 2000) }),
    });
    if (!r.ok) {
      const text = await r.text();
      res.status(502).json({ error: `Discord ${r.status}: ${text.slice(0, 200)}` });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
};
