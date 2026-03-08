// Vercel serverless catch-all proxy — injects API_SECRET server-side
const BACKEND = "https://onna-backend-v2.vercel.app";
const API_SECRET = process.env.API_SECRET || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://app.onna.digital");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.status(200).end();

  const pathSegments = req.query.path;
  const backendPath = "/" + (Array.isArray(pathSegments) ? pathSegments.join("/") : pathSegments || "");

  const url = new URL(backendPath, BACKEND);
  for (const [key, val] of Object.entries(req.query)) {
    if (key === "path") continue;
    url.searchParams.set(key, val);
  }

  const headers = { "X-API-Secret": API_SECRET };
  if (req.headers.authorization) headers["Authorization"] = req.headers.authorization;
  if (req.headers["content-type"]) headers["Content-Type"] = req.headers["content-type"];

  try {
    const opts = { method: req.method, headers };
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      opts.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const backendRes = await fetch(url.toString(), opts);
    const contentType = backendRes.headers.get("content-type") || "application/json";
    res.setHeader("Content-Type", contentType);
    const body = await backendRes.text();
    return res.status(backendRes.status).send(body);
  } catch (err) {
    return res.status(502).json({ error: "Proxy error", detail: err.message });
  }
}
