// Vercel serverless function — proxies the Outlook ICS feed server-side to avoid CORS
const ICS_URL = process.env.OUTLOOK_CAL_ICS || "";

export default async function handler(req, res) {
  try {
    const upstream = await fetch(ICS_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; onna-dashboard/1.0)" },
    });
    if (!upstream.ok) throw new Error(`Upstream returned ${upstream.status}`);
    const text = await upstream.text();
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "https://app.onna.digital");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: "Calendar fetch failed" });
  }
}
