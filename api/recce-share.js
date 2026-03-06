// Vercel serverless function — Recce Report share link generator
const BACKEND = "https://onna-backend-v2.vercel.app";
const API_SECRET = process.env.VITE_API_SECRET || process.env.API_SECRET || "";
const SVC_USER = process.env.ONNA_SVC_USER || "";
const SVC_PASS = process.env.ONNA_SVC_PASS || "";

const backendHeaders = (authToken) => ({
  "Content-Type": "application/json",
  "X-API-Secret": API_SECRET,
  ...(authToken ? { "Authorization": authToken } : {}),
});

const cors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
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
    if (e.type !== "recce_share") return false;
    try { return (typeof e.blob === "string" ? JSON.parse(e.blob) : e.blob).token === token; }
    catch { return false; }
  });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  _svcToken = null;

  const auth = req.headers.authorization || "";

  try {
    // PUT — save client feedback on a shared link
    if (req.method === "PUT") {
      const { token, feedback } = req.body;
      if (!token || !feedback) return res.status(400).json({ error: "Missing token or feedback" });

      const useAuth = await resolveAuth(auth);
      const match = await findShareByToken(token, useAuth);
      if (!match) return res.status(404).json({ error: "Share not found" });

      const parsed = typeof match.blob === "string" ? JSON.parse(match.blob) : match.blob;
      parsed.feedback = feedback;
      parsed.feedbackUpdatedAt = new Date().toISOString();

      const eid = match.id || match._id;
      const putResp = await fetch(`${BACKEND}/api/resources/${eid}`, {
        method: "PUT",
        headers: backendHeaders(useAuth),
        body: JSON.stringify({ type: "recce_share", blob: JSON.stringify(parsed) }),
      });
      if (!putResp.ok) return res.status(500).json({ error: "Failed to save feedback" });
      return res.status(200).json({ ok: true });
    }

    // POST — create or update Recce Report share
    if (req.method === "POST") {
      const { html, projectName, clientName, mode, token: existingToken, resourceId } = req.body;
      if (!html) return res.status(400).json({ error: "Missing html" });

      const clientSlug = makeSlug(clientName);
      const projectSlug = makeSlug(projectName);
      const slugBase = [clientSlug, projectSlug, "reccereport"].filter(Boolean).join("_") || "reccereport";
      const token = existingToken || (slugBase + "_v" + Date.now().toString(36));
      const url = `https://app.onna.world/api/recce-share?token=${encodeURIComponent(token)}`;

      const useAuth = await resolveAuth(auth);

      const blobData = JSON.stringify({
        token,
        html,
        projectName: projectName || "",
        mode: mode || "recce",
        createdAt: new Date().toISOString(),
      });

      if (resourceId) {
        try {
          const putResp = await fetch(`${BACKEND}/api/resources/${resourceId}`, {
            method: "PUT",
            headers: backendHeaders(useAuth),
            body: JSON.stringify({ type: "recce_share", blob: blobData }),
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
              if (e.type !== "recce_share") continue;
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

      const payload = { type: "recce_share", blob: blobData };
      const resp = await fetch(`${BACKEND}/api/resources`, {
        method: "POST",
        headers: backendHeaders(useAuth),
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) return res.status(500).json({ error: "Backend storage failed", detail: data });

      return res.status(200).json({ token, url, id: data.id || data._id });
    }

    // GET — fetch Recce Report share by token
    if (req.method === "GET") {
      const { token, feedbackOnly } = req.query;
      if (!token) return res.status(400).json({ error: "Missing token" });

      const useAuth = await resolveAuth(auth);
      const match = await findShareByToken(token, useAuth);
      if (!match) return res.status(404).json({ error: "Share not found" });

      const parsed = typeof match.blob === "string" ? JSON.parse(match.blob) : match.blob;

      if (feedbackOnly === "1") {
        return res.status(200).json({
          feedback: parsed.feedback || null,
          feedbackUpdatedAt: parsed.feedbackUpdatedAt || null,
        });
      }

      const title = parsed.projectName || "Recce Report";
      const existingFeedback = parsed.feedback ? JSON.stringify(parsed.feedback) : "null";
      const page = `<!DOCTYPE html><html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" type="image/png" href="https://app.onna.world/onna-o-logo.png">
<meta property="og:image" content="https://app.onna.world/onna-o-logo.png">
<meta property="og:title" content="ONNA | ${title.replace(/"/g, "&quot;")}">
<meta property="og:type" content="website">
<title>ONNA \u2014 ${title.replace(/</g, "&lt;")}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap');
*{box-sizing:border-box}
body{margin:0;padding:24px;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:9px;color:#1a1a1a;background:#f5f5f7}
.rc-wrap{max-width:900px;margin:0 auto;background:#fff;border-radius:4px;box-shadow:0 2px 16px rgba(0,0,0,0.08);overflow:hidden}
.rc-inner{padding:24px 16px}
.actions{text-align:center;padding:24px 0}
.btn{display:inline-block;background:#1a1a1a;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;text-decoration:none}
.btn:hover{background:#333}
.page-break{page-break-before:always;margin-top:32px;padding-top:16px;border-top:2px solid #000}
.save-toast{position:fixed;bottom:20px;right:20px;background:#2E7D32;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;font-family:inherit;opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:9999}
.save-toast.show{opacity:1}
@media print{
  body{background:#fff;padding:0;margin:0}
  .rc-wrap{box-shadow:none;border-radius:0;max-width:100%;width:100%}
  .rc-inner{padding:8mm 10mm}
  .rc-inner img{max-width:100%;height:auto}
  .actions{display:none!important}
  .save-toast{display:none!important}
  @page{size:portrait;margin:0}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
}
</style></head><body>
<div class="rc-wrap"><div class="rc-inner">${parsed.html}</div></div>
<div class="actions"><button class="btn" onclick="window.print()">Download as PDF</button></div>
<div class="save-toast" id="saveToast">Changes saved</div>
<script>
var SHARE_TOKEN="${token.replace(/"/g, '\\"')}";
var _feedback=${existingFeedback}||{};
var _saveTimer=null;
var _toast=document.getElementById('saveToast');
function showToast(){_toast.classList.add('show');setTimeout(function(){_toast.classList.remove('show');},1500);}
function saveFeedback(){
  clearTimeout(_saveTimer);
  _saveTimer=setTimeout(function(){
    fetch(window.location.pathname,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({token:SHARE_TOKEN,feedback:_feedback})
    }).then(function(){showToast();}).catch(function(){});
  },800);
}
document.querySelectorAll('span').forEach(function(s){
  if(s.style.fontFamily&&s.style.fontFamily.indexOf('SackersGothic')!==-1&&s.textContent.trim().toLowerCase()==='onna'){
    var img=document.createElement('img');
    img.src='https://app.onna.world/onna-logo.png';
    img.alt='ONNA';
    img.style.height='36px';
    img.style.display='block';
    s.replaceWith(img);
  }
});
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
