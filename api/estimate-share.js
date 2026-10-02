// Vercel serverless function — Estimate share link generator.
// Same pattern as cps-share.js: snapshot the rendered HTML, store it keyed by
// a token, serve it back as a static page. The one difference: at serve time
// we check whether the estimate's project has since been archived, and if so
// the link is treated as expired rather than showing stale/stale-looking data.
const BACKEND = "https://onna-backend-v2.vercel.app";
const API_SECRET = process.env.API_SECRET || "";
const SVC_USER = process.env.ONNA_SVC_USER || "";
const SVC_PASS = process.env.ONNA_SVC_PASS || "";

const backendHeaders = (authToken) => ({
  "Content-Type": "application/json",
  "X-API-Secret": API_SECRET,
  ...(authToken ? { "Authorization": authToken } : {}),
});

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "https://app.onna.digital,https://app.onna.world").split(",");
const cors = (req, res) => {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
};

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

async function resolveAuth(callerAuth) {
  if (callerAuth) return callerAuth;
  const svc = await getServiceToken();
  if (svc) return svc;
  return "";
}

function makeSlug(str) {
  return (str || "")
    .replace(/[^a-zA-Z0-9 _]/g, "")
    .trim()
    .split(/\s+/)
    .join("_")
    .toLowerCase();
}

async function findShareByToken(token, useAuth) {
  const resp = await fetch(`${BACKEND}/api/resources`, { headers: backendHeaders(useAuth) });
  if (!resp.ok) return null;
  const entries = await resp.json();
  const list = Array.isArray(entries) ? entries : entries.data || [];
  return list.find((e) => {
    if (e.type !== "estimate_share") return false;
    try { return (typeof e.blob === "string" ? JSON.parse(e.blob) : e.blob).token === token; }
    catch { return false; }
  });
}

async function isProjectArchived(projectId, useAuth) {
  if (!projectId) return false;
  try {
    const resp = await fetch(`${BACKEND}/api/archive`, { headers: backendHeaders(useAuth) });
    if (!resp.ok) return false;
    const json = await resp.json();
    const archived = json?.data ? JSON.parse(json.data) : [];
    return Array.isArray(archived) && archived.some((p) => String(p.id) === String(projectId));
  } catch { return false; }
}

function expiredPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Link Expired</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font-family:'Avenir','Nunito Sans',sans-serif;background:#f5f5f7;display:flex;align-items:center;justify-content:center;height:100vh;color:#1a1a1a}
.box{text-align:center;max-width:360px;padding:32px}
h1{font-size:16px;margin:0 0 8px}
p{font-size:13px;color:#666;line-height:1.5;margin:0}</style></head>
<body><div class="box"><h1>This link has expired</h1><p>The project this estimate belonged to has been archived, so this preview link is no longer available.</p></div></body></html>`;
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  _svcToken = null;

  const auth = req.headers.authorization || "";

  try {
    // POST — create or update an estimate share
    if (req.method === "POST") {
      const { html, projectName, projectId, token: existingToken, resourceId } = req.body;
      if (!html) return res.status(400).json({ error: "Missing html" });

      const projectSlug = makeSlug(projectName);
      const slugBase = [projectSlug, "estimate"].filter(Boolean).join("_") || "estimate";
      const token = existingToken || (slugBase + "_v" + Date.now().toString(36));
      const url = `https://app.onna.digital/api/estimate-share?token=${encodeURIComponent(token)}`;

      const useAuth = await resolveAuth(auth);

      const blobData = JSON.stringify({
        token,
        html,
        projectName: projectName || "",
        projectId: projectId || "",
        createdAt: new Date().toISOString(),
      });

      if (resourceId) {
        try {
          const putResp = await fetch(`${BACKEND}/api/resources/${resourceId}`, {
            method: "PUT",
            headers: backendHeaders(useAuth),
            body: JSON.stringify({ type: "estimate_share", blob: blobData }),
          });
          if (putResp.ok) {
            const putData = await putResp.json();
            return res.status(200).json({ token, url, id: putData.id || putData._id || resourceId });
          }
        } catch {}
      }

      if (existingToken) {
        try {
          const listResp = await fetch(`${BACKEND}/api/resources`, { headers: backendHeaders(useAuth) });
          if (listResp.ok) {
            const entries = await listResp.json();
            const list = Array.isArray(entries) ? entries : entries.data || [];
            for (const e of list) {
              if (e.type !== "estimate_share") continue;
              try {
                const blob = typeof e.blob === "string" ? JSON.parse(e.blob) : e.blob;
                if (blob.token === existingToken) {
                  const eid = e.id || e._id;
                  if (eid) await fetch(`${BACKEND}/api/resources/${eid}`, { method: "DELETE", headers: backendHeaders(useAuth) });
                }
              } catch {}
            }
          }
        } catch {}
      }

      const payload = { type: "estimate_share", blob: blobData };
      const resp = await fetch(`${BACKEND}/api/resources`, {
        method: "POST",
        headers: backendHeaders(useAuth),
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) return res.status(500).json({ error: "Backend storage failed", detail: data });

      return res.status(200).json({ token, url, id: data.id || data._id });
    }

    // GET — fetch estimate share by token, rendered as a tabbed read-only page
    if (req.method === "GET") {
      const { token } = req.query;
      if (!token) return res.status(400).json({ error: "Missing token" });

      const useAuth = await resolveAuth(auth);
      const match = await findShareByToken(token, useAuth);
      if (!match) return res.status(404).json({ error: "Share not found" });

      const parsed = typeof match.blob === "string" ? JSON.parse(match.blob) : match.blob;

      if (await isProjectArchived(parsed.projectId, useAuth)) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(410).send(expiredPage());
      }

      const title = parsed.projectName || "Production Estimate";
      const PAGE_LABELS = { topsheet: "Top Sheet", estimates: "Estimates", services: "Services Agreement", tcs: "T&Cs", notes: "Notes" };
      const page = `<!DOCTYPE html><html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" type="image/png" href="https://app.onna.digital/onna-o-logo.png">
<meta property="og:image" content="https://app.onna.digital/onna-o-logo.png">
<meta property="og:title" content="ONNA | ${title.replace(/"/g, "&quot;")}">
<meta property="og:type" content="website">
<title>ONNA — ${title.replace(/</g, "&lt;")}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap');
*{box-sizing:border-box}
body{margin:0;padding:24px;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:10px;color:#1a1a1a;background:#f5f5f7}
.est-wrap{max-width:900px;margin:0 auto;background:#fff;border-radius:4px;box-shadow:0 2px 16px rgba(0,0,0,0.08);overflow:hidden}
.est-inner{padding:24px 16px}
.tabs{display:flex;border-bottom:2px solid #000;flex-wrap:wrap}
.tabs .tab{font-family:inherit;font-size:9px;font-weight:400;letter-spacing:0.5px;padding:10px 16px;cursor:pointer;white-space:nowrap;background:#fff;color:#666;text-transform:uppercase;border-right:1px solid #ddd}
.tabs .tab.active{background:#000;color:#fff;font-weight:700}
.phase-tabs{display:none;gap:6px;margin:0 0 14px;flex-wrap:wrap}
.phase-tabs.show{display:flex}
.phase-tabs .ptab{font-family:inherit;font-size:9px;letter-spacing:0.5px;padding:7px 16px;border-radius:6px;cursor:pointer;background:#f0f0f0;color:#666;text-transform:uppercase}
.phase-tabs .ptab.active{background:#1a1a1a;color:#fff;font-weight:700}
[data-page]{display:none}
[data-page].active{display:block}
[data-phase-id]{display:none}
[data-phase-id].active{display:block}
.actions{text-align:center;padding:24px 0}
.btn{display:inline-block;background:#1a1a1a;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;text-decoration:none}
.btn:hover{background:#333}
@media print{
  body{background:#fff;padding:12mm}
  .est-wrap{box-shadow:none;border-radius:0}
  .actions,.tabs,.phase-tabs{display:none!important}
  [data-page]{display:block!important}
  [data-phase-id]{display:block!important}
  [data-page]+[data-page]{page-break-before:always}
  @page{size:A4;margin:10mm 12mm}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
}
</style></head><body>
<div class="est-wrap">
  <div class="tabs" id="est-tabs"></div>
  <div class="est-inner" id="est-content">${parsed.html}</div>
</div>
<div class="actions"><button class="btn" onclick="window.print()">Download as PDF</button></div>
<script>
(function(){
  var labels = ${JSON.stringify(PAGE_LABELS)};
  var content = document.getElementById('est-content');
  var pages = Array.prototype.slice.call(content.querySelectorAll('[data-page]'));
  var tabsEl = document.getElementById('est-tabs');
  if (!pages.length) return;
  pages.forEach(function(pg, i){
    var id = pg.getAttribute('data-page');
    var btn = document.createElement('div');
    btn.className = 'tab' + (i===0?' active':'');
    btn.textContent = labels[id] || id;
    btn.onclick = function(){ showPage(id); };
    tabsEl.appendChild(btn);
    if (i===0) pg.classList.add('active');
  });
  function showPage(id){
    pages.forEach(function(pg){ pg.classList.toggle('active', pg.getAttribute('data-page')===id); });
    Array.prototype.slice.call(tabsEl.children).forEach(function(btn,i){ btn.classList.toggle('active', (pages[i].getAttribute('data-page'))===id); });
  }
  // Nested estimate tabs, inside the "estimates" page only.
  var estPage = pages.find(function(pg){ return pg.getAttribute('data-page')==='estimates'; });
  if (estPage) {
    var phases = Array.prototype.slice.call(estPage.querySelectorAll('[data-phase-id]'));
    if (phases.length > 1) {
      var ptabs = document.createElement('div');
      ptabs.className = 'phase-tabs show';
      phases.forEach(function(ph, i){
        var b = document.createElement('div');
        b.className = 'ptab' + (i===0?' active':'');
        b.textContent = ph.getAttribute('data-phase-label') || ('Estimate ' + (i+1));
        b.onclick = function(){
          phases.forEach(function(p2){ p2.classList.remove('active'); });
          Array.prototype.slice.call(ptabs.children).forEach(function(b2){ b2.classList.remove('active'); });
          ph.classList.add('active'); b.classList.add('active');
        };
        ptabs.appendChild(b);
        if (i===0) ph.classList.add('active');
      });
      estPage.insertBefore(ptabs, estPage.firstChild);
    } else if (phases.length === 1) {
      phases[0].classList.add('active');
    }
  }
})();
</script>
</body></html>`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(page);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
