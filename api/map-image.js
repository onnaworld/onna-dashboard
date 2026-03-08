// Vercel serverless — proxy static map images to avoid CORS
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://app.onna.digital");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { lat, lon, q } = req.query;
  if (!lat && !lon && !q) return res.status(400).json({ error: "Missing lat/lon or q" });

  // Build static map URL
  let mapUrl;
  if (lat && lon) {
    mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=15&size=600x400&maptype=mapnik&markers=${lat},${lon},red-pushpin`;
  } else {
    mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(q)}&zoom=15&size=600x400&maptype=mapnik`;
  }

  try {
    const upstream = await fetch(mapUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; onna-dashboard/1.0)" },
      redirect: "follow",
    });
    if (!upstream.ok) throw new Error(`Map service returned ${upstream.status}`);

    const contentType = upstream.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
