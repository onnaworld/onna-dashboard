// Vercel serverless function — external vendor contract signing
import { randomUUID } from "crypto";
const BACKEND = "https://onna-backend-v2.vercel.app";
const API_SECRET = process.env.API_SECRET || "";
const SVC_USER = process.env.ONNA_SVC_USER || "";
const SVC_PASS = process.env.ONNA_SVC_PASS || "";
const RESEND_KEY = process.env.RESEND_API_KEY || "";
const NOTIFY_EMAIL = process.env.ONNA_NOTIFY_EMAIL || "";

const backendHeaders = (authToken) => ({
  "Content-Type": "application/json",
  "X-API-Secret": API_SECRET,
  ...(authToken ? { "Authorization": authToken } : {}),
});

const cors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://app.onna.digital");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
};

// Service account login — caches token for the request lifecycle
let _svcToken = null;
async function getServiceToken() {
  if (_svcToken) return _svcToken;
  if (!SVC_USER || !SVC_PASS) return "";
  try {
    const resp = await fetch(`${BACKEND}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Secret": API_SECRET },
      body: JSON.stringify({ username: SVC_USER, password: SVC_PASS }),
    });
    const data = await resp.json();
    if (data.token) { _svcToken = `Bearer ${data.token}`; return _svcToken; }
  } catch {}
  return "";
}

// Build auth token: caller auth → service account → stashed auth
async function resolveAuth(callerAuth, stashedAuth) {
  if (callerAuth) return callerAuth;
  const svc = await getServiceToken();
  if (svc) return svc;
  if (stashedAuth) return stashedAuth;
  return "";
}

// Slug from label: "Nathan Evans Commissioning Agreement" → "nathan-evans-commissioning-agreement"
function labelToSlug(label) {
  return (label || "contract")
    .replace(/[^a-zA-Z0-9 _]/g, "")
    .trim()
    .split(/\s+/)
    .join("-")
    .toLowerCase() || "contract";
}

// Find a signing request by token in backend
async function findByToken(token, authToken, preferSigned = false) {
  const resp = await fetch(`${BACKEND}/api/resources`, { headers: backendHeaders(authToken) });
  if (!resp.ok) return { error: resp.status };
  const entries = await resp.json();
  const list = Array.isArray(entries) ? entries : entries.data || [];
  const matches = list.filter((e) => {
    if (e.type !== "signing_request") return false;
    try { return (typeof e.blob === "string" ? JSON.parse(e.blob) : e.blob).token === token; }
    catch { return false; }
  });
  if (matches.length === 0) return { notFound: true };
  // Choose best match based on preference
  const preferred = [...matches].reverse().find(e => {
    try {
      const status = (typeof e.blob === "string" ? JSON.parse(e.blob) : e.blob).status;
      return preferSigned ? status === "signed" : status === "pending";
    } catch { return false; }
  });
  const match = preferred || matches[matches.length - 1];
  const parsed = typeof match.blob === "string" ? JSON.parse(match.blob) : match.blob;
  return { match, parsed, id: match._id || match.id };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  _svcToken = null; // reset per-request cache

  const auth = req.headers.authorization || "";

  try {
    // POST — create signing request (authenticated)
    if (req.method === "POST") {
      const { contractSnapshot, projectName, contractType, label } = req.body;
      if (!contractSnapshot || !contractType) {
        return res.status(400).json({ error: "Missing contractSnapshot or contractType" });
      }

      const token = randomUUID();

      // URL: clean slug only, data lives in backend
      const url = `https://app.onna.digital?sign=${encodeURIComponent(token)}`;

      // Store in backend
      const payload = {
        type: "signing_request",
        blob: JSON.stringify({
          token,
          _auth: auth,
          contractSnapshot,
          projectName: projectName || "",
          contractType,
          label: label || "",
          status: "pending",
          vendorSig: null,
          createdAt: new Date().toISOString(),
          signedAt: null,
        }),
      };
      const resp = await fetch(`${BACKEND}/api/resources`, {
        method: "POST",
        headers: backendHeaders(auth),
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) return res.status(500).json({ error: "Backend storage failed", detail: data });

      return res.status(200).json({ token, url, id: data.id || data._id });
    }

    // GET — fetch signing request by token (public or authenticated)
    if (req.method === "GET") {
      const { token, view, prefer } = req.query;
      if (!token) return res.status(400).json({ error: "Missing token parameter" });
      const preferSigned = prefer === "signed";

      // Try caller auth first, then service account
      const useAuth = await resolveAuth(auth, "");
      let result = await findByToken(token, useAuth, preferSigned);

      if (result.error && !auth) {
        const svcAuth = await getServiceToken();
        if (svcAuth) {
          const retry = await findByToken(token, svcAuth, preferSigned);
          if (!retry.error && !retry.notFound) result = retry;
        }
      }
      if (result.error) return res.status(result.error).json({ error: `Backend returned ${result.error}` });
      if (result.notFound) return res.status(404).json({ error: "Signing request not found" });

      const data = result.parsed;

      // Return printable HTML contract page
      if (view === "print") {
        const title = data.label || token;

        // If we have captured HTML from the signing page, serve it directly — pixel-perfect match
        if (data.renderedHtml) {
          const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" type="image/png" href="https://app.onna.digital/onna-o-logo.png">
<meta property="og:image" content="https://app.onna.digital/onna-o-logo.png">
<meta property="og:title" content="ONNA | ${(title || "Contract").replace(/"/g, "&quot;")}">
<meta property="og:type" content="website">
<title>\u200B</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Avenir','Avenir Next','Helvetica Neue','Nunito Sans',sans-serif;color:#1a1a1a;line-height:1.5;background:#f5f5f7}
.mirror-wrap{max-width:860px;margin:20px auto;padding:0 14px}
.actions{text-align:center;padding:24px 0}
.btn{display:inline-block;background:#1a5a30;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;text-decoration:none}
.btn:hover{background:#155025}
@media print{
  body{background:#fff}
  .mirror-wrap{max-width:none;margin:0;padding:0}
  .actions{display:none!important}
  @page{margin:0;size:A4}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
}
</style></head><body>
<div class="mirror-wrap">${data.renderedHtml}</div>
<div class="actions"><button class="btn" onclick="window.print()">Download as PDF</button></div>
</body></html>`;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          return res.status(200).send(html);
        }

        // Fallback: server-rendered version for older signing requests
        const snap = data.contractSnapshot || {};
        const fv = snap.fieldValues || {};
        const sn = snap.sigNames || {};
        const sigs = snap.signatures || {};
        const ct = data.contractType || "commission_se";
        const gt = (snap.generalTermsEdits || {}).custom || "";
        const vs = data.vendorSig || {};
        let logo = snap.prodLogo || "";
        if (logo && logo.startsWith("/")) logo = `https://app.onna.digital${logo}`;

        const fl = snap.fieldLabels || {};
        const labelKeys = Object.keys(fl);
        const fvKeys = Object.keys(fv);
        const orderedKeys = labelKeys.length > 0 ? [...labelKeys, ...fvKeys.filter(k => !labelKeys.includes(k))] : fvKeys;
        const fieldRows = orderedKeys.map(k => {
          if (k === "contractType") return "";
          const v = fv[k];
          const label = fl[k] || k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          const display = (v != null && v !== "") ? v.toString().replace(/</g, "&lt;") : "\u2014";
          return `<tr><td class="fl">${label}</td><td class="fv">${display}</td></tr>`;
        }).filter(Boolean).join("");

        const leftSig = sigs.left ? `<img src="${sigs.left}" class="sig-img"/>` : "\u2014";
        const rightSig = vs.signature ? `<img src="${vs.signature}" class="sig-img"/>` : "\u2014";

        const isTalent = ct.includes("talent");
        const contractTitle = isTalent ? "TALENT AGREEMENT" : "COMMISSIONING AGREEMENT";
        const sigLeftLabel = "Signed by an authorised representative for and on behalf of ONNA";
        const sigRightLabel = isTalent ? "Signed by the Talent" : (ct.includes("psc") ? "Signed for and on behalf of Commissionee" : "Signed by the Commissionee");

        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" type="image/png" href="https://app.onna.digital/onna-o-logo.png">
<meta property="og:image" content="https://app.onna.digital/onna-o-logo.png">
<meta property="og:title" content="ONNA | ${(title || "Contract").replace(/"/g, "&quot;")}">
<meta property="og:type" content="website">
<title>\u200B</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Avenir','Avenir Next','Helvetica Neue',sans-serif;color:#1a1a1a;line-height:1.5;background:#f5f5f7}
.page{max-width:800px;margin:0 auto;background:#fff;padding:48px 40px 32px}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.logo{font-size:18px;font-weight:700;letter-spacing:2px}
.signed-badge{background:#e8f5e9;color:#1a5a30;font-size:11px;font-weight:600;padding:4px 12px;border-radius:6px}
.divider{border-bottom:2.5px solid #000;margin-bottom:20px}
.ct-title{text-align:center;font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:12px}
.section-hdr{background:#000;color:#fff;font-size:10px;font-weight:700;letter-spacing:2px;text-align:center;padding:5px 0;text-transform:uppercase}
table.fields{width:100%;border-collapse:collapse;font-size:10.5px;margin-bottom:24px}
.fl{padding:8px 12px;background:#fafafa;border:1px solid #eee;font-weight:500;width:220px;vertical-align:top;letter-spacing:0.3px}
.fv{padding:8px 12px;border:1px solid #eee;white-space:pre-wrap;word-break:break-word}
.gt{font-size:10px;line-height:1.6;padding:12px;white-space:pre-wrap;word-break:break-word;border:1px solid #eee;border-top:none}
table.sigs{width:100%;border-collapse:collapse;font-size:11px}
table.sigs td{width:50%;padding:14px;border:1px solid #eee;vertical-align:top}
.sig-label{font-size:9px;font-weight:700;letter-spacing:0.5px;margin-bottom:10px}
.sig-img{max-height:60px;max-width:200px;display:block;margin:4px 0}
.sig-field{margin:4px 0;font-size:10.5px}
.actions{text-align:center;padding:24px 0}
.btn{display:inline-block;background:#1a5a30;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;text-decoration:none}
.btn:hover{background:#155025}
.meta{text-align:center;font-size:11px;color:#888;margin-top:12px}
@media print{
  body{background:#fff}
  .page{padding:48px 24px 20px;max-width:none}
  .actions{display:none!important}
  @page{margin:0;size:A4}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
}
@media(max-width:600px){
  .page{padding:20px 16px}
  .fl{width:100%;display:block}
  .fv{display:block}
  table.sigs td{display:block;width:100%}
}
</style></head><body>
<div class="page">
  <div class="hdr">
    ${logo ? `<img src="${logo}" alt="Logo" style="max-height:36px;max-width:140px;object-fit:contain"/>` : '<span class="logo">ONNA</span>'}
    ${data.status === "signed" ? '<span class="signed-badge">✓ Signed</span>' : ""}
  </div>
  <div class="divider"></div>
  <div class="ct-title">${contractTitle}</div>
  ${(data.projectName || title !== token) ? `<div style="font-size:9px;color:#1a1a1a;letter-spacing:0.3px;margin-bottom:14px">${data.projectName ? `Project: ${data.projectName}` : ""}${data.projectName && title !== token ? " | " : ""}${title !== token ? title : ""}</div>` : ""}
  ${fieldRows ? `<div style="background:#f4f4f4;padding:6px 12px;border-bottom:1px solid #ddd;font-size:10px;font-weight:700;letter-spacing:2px">HEAD TERMS</div><table class="fields">${fieldRows}</table>` : ""}
  ${gt ? `<div style="margin-bottom:24px"><div class="section-hdr">GENERAL TERMS</div><div class="gt">${gt.replace(/</g, "&lt;")}</div></div>` : ""}
  <div><div class="section-hdr">SIGNATURES</div>
  <table class="sigs"><tr>
    <td><div class="sig-label">${sigLeftLabel}</div><div class="sig-field">Signature: ${leftSig}</div><div class="sig-field">Name: ${sn.left_name || "\u2014"}</div><div class="sig-field">Date: ${sn.left_date || "\u2014"}</div></td>
    <td><div class="sig-label">${sigRightLabel}</div><div class="sig-field">Signature: ${rightSig}</div><div class="sig-field">Name: ${vs.sigName || "\u2014"}</div><div class="sig-field">Date: ${vs.sigDate || "\u2014"}</div></td>
  </tr></table></div>
  ${data.signedAt ? `<div class="meta">Signed: ${new Date(data.signedAt).toLocaleDateString()}</div>` : ""}
</div>
<div class="actions">
  <button class="btn" onclick="window.print()">Download as PDF</button>
</div>
</body></html>`;

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(html);
      }

      const out = { ...data, _id: result.id };
      delete out._auth;
      return res.status(200).json(out);
    }

    // PUT — submit vendor signature (public — uses service auth or stashed auth)
    if (req.method === "PUT") {
      const { token, sigName, sigDate, signature, renderedHtml } = req.body;
      if (!token || !signature) return res.status(400).json({ error: "Missing token or signature" });

      // Resolve auth: service account preferred
      const useAuth = await resolveAuth(auth, "");
      const result = await findByToken(token, useAuth);

      if (result.error || result.notFound) {
        // Try with stashed auth from the record (if we can get it)
        if (result.error) {
          return res.status(result.error).json({
            error: `Cannot access backend (${result.error}). Set ONNA_SVC_USER/ONNA_SVC_PASS in Vercel env vars.`
          });
        }
        return res.status(404).json({ error: "Signing request not found" });
      }

      const { parsed, id } = result;
      if (parsed.status === "signed") return res.status(400).json({ error: "Already signed" });

      // Use best available auth for the update
      const updateAuth = await resolveAuth(auth, parsed._auth || "");

      parsed.status = "signed";
      parsed.vendorSig = { sigName: sigName || "", sigDate: sigDate || "", signature };
      parsed.signedAt = new Date().toISOString();
      if (renderedHtml) {
        // Sanitize: strip script tags, event handlers, javascript: URLs
        let sanitized = renderedHtml
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<script[^>]*>/gi, "")
          .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "")
          .replace(/javascript\s*:/gi, "blocked:")
          .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
          .replace(/<iframe[^>]*>/gi, "")
          .replace(/<object[\s\S]*?<\/object>/gi, "")
          .replace(/<embed[^>]*>/gi, "");
        parsed.renderedHtml = sanitized;
      }

      const updateResp = await fetch(`${BACKEND}/api/resources/${id}`, {
        method: "PUT",
        headers: backendHeaders(updateAuth),
        body: JSON.stringify({ type: "signing_request", blob: JSON.stringify(parsed) }),
      });
      const updateData = await updateResp.json();
      if (!updateResp.ok) return res.status(500).json({ error: "Update failed", detail: updateData });

      // Send email notification with download link
      if (RESEND_KEY && NOTIFY_EMAIL) {
        try {
          const pdfUrl = `https://app.onna.digital?sign=${encodeURIComponent(token)}&print=1`;
          const emailHtml = `
<div style="font-family:'Avenir','Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.5">
  <div style="background:#1d1d1f;padding:16px 24px;border-radius:8px 8px 0 0">
    <span style="color:#fff;font-size:16px;font-weight:700;letter-spacing:1.5px">ONNA</span>
  </div>
  <div style="background:#e8f5e9;padding:16px 24px">
    <strong style="color:#1a5a30;font-size:15px">✓ Contract Signed</strong>
  </div>
  <div style="background:#fff;padding:28px 24px;border:1px solid #eee;border-top:none">
    <p style="margin-bottom:6px;font-size:15px;font-weight:600">${parsed.label || token}</p>
    ${parsed.projectName ? `<p style="font-size:12px;color:#888;margin-bottom:16px">Project: ${parsed.projectName}</p>` : ""}
    <p style="font-size:13px;margin-bottom:20px"><strong>${sigName || "Vendor"}</strong> signed this contract on <strong>${new Date().toLocaleDateString()}</strong>.</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${pdfUrl}" style="background:#1a5a30;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">Download Signed Contract (PDF)</a>
    </div>
    <p style="font-size:11px;color:#999;text-align:center">Click the button above to view the full signed contract and save as PDF.</p>
  </div>
  <div style="padding:14px 24px;background:#f5f5f7;border-radius:0 0 8px 8px;text-align:center">
    <a href="https://app.onna.digital" style="color:#888;font-size:11px;text-decoration:none">Open ONNA Dashboard</a>
  </div>
</div>`;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_KEY}` },
            body: JSON.stringify({
              from: "ONNA <notifications@onna.world>",
              to: NOTIFY_EMAIL,
              subject: `Contract Signed: ${parsed.label || token}`,
              html: emailHtml,
            }),
          });
        } catch {}
      }

      return res.status(200).json({ ok: true, status: "signed", vendorSig: parsed.vendorSig });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
