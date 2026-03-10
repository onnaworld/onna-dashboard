// Receipt OCR — extracts total amount from receipt image using Claude vision
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "https://app.onna.digital");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image, mediaType } = req.body || {};
  if (!image) return res.status(400).json({ error: "image (base64) required" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

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
        max_tokens: 256,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType || "image/jpeg", data: image },
            },
            {
              type: "text",
              text: "Extract the total amount from this receipt. Return ONLY a JSON object with these fields: {\"amount\": number, \"currency\": \"AED\" or whatever currency, \"vendor\": \"vendor name if visible\", \"description\": \"brief description of what was purchased\"}. If you cannot read a total, return {\"amount\": 0, \"currency\": \"\", \"vendor\": \"\", \"description\": \"\"}. Return ONLY the JSON, no other text.",
            },
          ],
        }],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return res.status(502).json({ error: `Claude error ${upstream.status}: ${err}` });
    }

    const data = await upstream.json();
    const text = data.content?.[0]?.text || "";
    // Parse the JSON from Claude's response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return res.status(200).json(JSON.parse(jsonMatch[0]));
    }
    return res.status(200).json({ amount: 0, currency: "", vendor: "", description: "", raw: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
