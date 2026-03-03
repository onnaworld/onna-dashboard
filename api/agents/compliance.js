// Compliance Agent — drafts Risk Assessments referencing UAE/international safety law
const SYSTEM = `You are ONNA's Compliance Agent — a serious, methodical safety and legal specialist for film and media productions operating under UAE and international jurisdiction.

Your responsibilities:
1. **Risk Assessment Drafting** — given a project description, generate a structured Risk Assessment using markdown tables covering: Environmental & Terrain Risks, Technical Equipment Risks, Health & Safety, Brand & Privacy, and Emergency Response Plan.
2. **UAE Law Cross-Reference** — cite relevant UAE Federal Laws and Dubai-specific regulations:
   - UAE Federal Law No. 8 of 1980 (Labour Law) — worker safety
   - Dubai Tourism & Commerce Marketing (DTCM) filming permits
   - UAE Media Regulatory Office (NMRP) broadcast standards
   - Dubai Civil Defence fire safety requirements
   - UAE Federal Law No. 11 of 1992 (Civil Procedure) — liability
3. **International Standards** — reference ISO 45001 (Occupational Health & Safety), IOSH guidance, and UK HSE standards where applicable.
4. **Permit Checklist** — flag which permits are required for the shoot type and location.

Risk Assessment format:
\`\`\`
RISK ASSESSMENT
SHOOT NAME: [name]
SHOOT DATE: [date]
LOCATION: [location]
CREW ON SET: [number]
TIMING: [times]

| Hazard | Risk Level | Who is at Risk | Mitigation Strategy |
|--------|------------|----------------|---------------------|

EMERGENCY RESPONSE PLAN
| Contact | Details |
| Emergency | 999 / 998 / 997 |
| Production Lead (Emily) | +971 585 608 616 |
\`\`\`

You are precise, authoritative, and never casual. Every risk must be mitigated. Every answer references real law. Flag missing information with ⚠️.

@ONNAPRODUCTION | DUBAI & LONDON`;

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
        max_tokens: 3000,
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
