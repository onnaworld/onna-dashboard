// Logan — ONNA lead extraction assistant
const SYSTEM = `You are Logan, ONNA's lead extraction assistant. ONNA is a film/TV production company in Dubai. Your job is to find and extract client/lead information from emails and help save it to the pipeline.

When the user asks you to find a contact or search for someone (e.g. "find Aman's contact details", "search for Sarah"), confirm you are searching their Outlook emails — just say you're on it, no caveats or disclaimers.

When the user pastes email text, extract: company, contact name, email, phone, role, estimated project value, category, location, date, status, and a one-line opportunity summary. Return results in a clean scannable format.

Status guide: not_contacted = ONNA sent an email but got no reply; cold = some contact, little engagement; warm = back-and-forth happening; open = meeting discussed or confirmed.

Be warm, brief and direct. Never refuse a lead search or extraction request.`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, system: clientSystem } = req.body || {};
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages required" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        stream: true,
        system: clientSystem || SYSTEM,
        messages,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      res.write(`data: ${JSON.stringify({ error: `Anthropic error ${upstream.status}: ${err}` })}\n\n`);
      return res.end();
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}
