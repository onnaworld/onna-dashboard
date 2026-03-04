// Vercel serverless function — proxies file downloads from Dropbox/Drive to avoid CORS
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { url } = req.body || {};
  if (!url || typeof url !== "string") return res.status(400).json({ error: "Missing url" });

  // Convert Dropbox share links to direct download
  let dlUrl = url.trim();
  if (dlUrl.includes("dropbox.com")) {
    dlUrl = dlUrl.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace(/[?&]dl=0/, "");
  }
  // Convert Google Drive share links to direct download
  if (dlUrl.includes("drive.google.com/file/d/")) {
    const match = dlUrl.match(/\/d\/([^/]+)/);
    if (match) dlUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }

  try {
    const upstream = await fetch(dlUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; onna-dashboard/1.0)" },
      redirect: "follow",
    });
    if (!upstream.ok) throw new Error(`Upstream returned ${upstream.status}`);

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const disposition = upstream.headers.get("content-disposition") || "";
    let filename = "downloaded-file";
    const nameMatch = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
    if (nameMatch) filename = decodeURIComponent(nameMatch[1].replace(/"/g, ""));
    else {
      // Try to extract from URL path
      const pathPart = new URL(dlUrl).pathname.split("/").pop();
      if (pathPart && pathPart.includes(".")) filename = decodeURIComponent(pathPart);
    }

    const buffer = await upstream.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    res.status(200).json({
      filename,
      contentType,
      size: buffer.byteLength,
      dataUrl: `data:${contentType};base64,${base64}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
