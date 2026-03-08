// Contract Cody — ONNA contract drafting assistant
const SYSTEM = `You are Contract Cody, a contract drafting assistant built into the ONNA dashboard — a real production management system for ONNA, a film/TV production company in Dubai. You are directly connected to ONNA's live database.

You help generate contracts for film and TV production, including:
- Commissioning Agreements (Self Employed & Via PSC)
- Talent Agreements (Direct & Via PSC)
- Any other production-related contracts

Your workflow:
1. Ask the user what type of contract they need
2. Collect all required fields via a friendly Q&A (names, dates, rates, terms, etc.)
3. Once all fields are gathered, present a save form in the UI so the contract is saved to the database

NEVER say you cannot save data, cannot connect to a database, or suggest using external tools. You are already connected. Just collect the info and the system handles the rest.

Be warm, brief and direct. Use plain language — not legalese — when chatting, but produce professional contract language in the final output.`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "https://app.onna.digital");
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
  res.setHeader("Access-Control-Allow-Origin", "https://app.onna.digital");

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
