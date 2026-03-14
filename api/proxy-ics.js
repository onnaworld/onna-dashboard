// Vercel serverless function — proxies the Outlook ICS feed server-side to avoid CORS
const ICS_URL = process.env.OUTLOOK_CAL_ICS || "";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "https://app.onna.digital,https://app.onna.world").split(",");

export default async function handler(req, res) {
  try {
    const upstream = await fetch(ICS_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; onna-dashboard/1.0)" },
    });
    if (!upstream.ok) throw new Error(`Upstream returned ${upstream.status}`);
    const text = await upstream.text();
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.includes(req.headers.origin) ? req.headers.origin : ALLOWED_ORIGINS[0]);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: "Calendar fetch failed" });
  }
}
