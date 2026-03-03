// Vercel serverless function — proxies the Outlook ICS feed server-side to avoid CORS
const ICS_URL =
  "https://outlook.office365.com/owa/calendar/2b3ad2259c4b4aaeb9ef497749cda730@onnaproduction.com/03e7e6c4750845fcb9ec9bb1040863bb2959111588689312764/calendar.ics";

export default async function handler(req, res) {
  try {
    const upstream = await fetch(ICS_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; onna-dashboard/1.0)" },
    });
    if (!upstream.ok) throw new Error(`Upstream returned ${upstream.status}`);
    const text = await upstream.text();
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
