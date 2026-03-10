// Vercel serverless proxy — injects API_SECRET server-side
const BACKEND = "https://onna-backend.vercel.app";
const API_SECRET = process.env.API_SECRET || "";
const ALLOWED_ORIGINS = ["https://app.onna.digital", "https://app.onna.world"];

// ─── Rate limiting (in-memory, per serverless instance) ─────────────────────
const RATE_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT = 120;        // max requests per window
const LOGIN_RATE_LIMIT = 10;   // stricter limit for auth endpoints
const hits = {};

function rateLimit(ip, target) {
  const isAuth = target && target.startsWith("/api/auth");
  const limit = isAuth ? LOGIN_RATE_LIMIT : RATE_LIMIT;
  const key = isAuth ? `auth:${ip}` : ip;
  const now = Date.now();
  if (!hits[key] || now - hits[key].start > RATE_WINDOW) {
    hits[key] = { start: now, count: 1 };
  } else {
    hits[key].count++;
  }
  // Clean up old entries periodically
  if (Object.keys(hits).length > 5000) {
    for (const k of Object.keys(hits)) { if (now - hits[k].start > RATE_WINDOW) delete hits[k]; }
  }
  return hits[key].count > limit;
}

function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const target = req.query.target;
  if (!target) return res.status(400).json({ error: "Missing target parameter" });

  // Rate limit check
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (rateLimit(ip, target)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  const url = new URL(target, BACKEND);
  // SSRF protection: ensure resolved URL points to our backend
  if (url.origin !== new URL(BACKEND).origin) {
    return res.status(400).json({ error: "Invalid target" });
  }
  // Forward additional query params (skip 'target')
  for (const [key, val] of Object.entries(req.query)) {
    if (key === "target") continue;
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
    return res.status(502).json({ error: "Proxy error" });
  }
}
