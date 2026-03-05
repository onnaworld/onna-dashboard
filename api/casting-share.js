// Vercel serverless function — Casting Deck share link generator
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
  return (str || "casting")
    .replace(/[^a-zA-Z0-9 _]/g, "")
    .trim()
    .split(/\s+/)
    .join("-")
    .toLowerCase() || "casting";
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  _svcToken = null;

  const auth = req.headers.authorization || "";

  try {
    // POST — create or update Casting share
    if (req.method === "POST") {
      const { html, projectName, mode, token: existingToken, resourceId } = req.body;
      if (!html) return res.status(400).json({ error: "Missing html" });

      const token = existingToken || (makeSlug(projectName || "casting") + "-" + Date.now().toString(36));
      const url = `https://app.onna.world/api/casting-share?token=${encodeURIComponent(token)}`;

      const useAuth = await resolveAuth(auth);

      const blobData = JSON.stringify({
        token,
        html,
        projectName: projectName || "",
        mode: mode || "casting",
        createdAt: new Date().toISOString(),
      });

      // If we have a resourceId, update the existing resource directly via PUT
      if (resourceId) {
        try {
          const putResp = await fetch(`${BACKEND}/api/resources/${resourceId}`, {
            method: "PUT",
            headers: backendHeaders(useAuth),
            body: JSON.stringify({ type: "casting_share", blob: blobData }),
          });
          if (putResp.ok) {
            const putData = await putResp.json();
            return res.status(200).json({ token, url, id: putData.id || putData._id || resourceId });
          }
        } catch {}
      }

      // If reusing token but no resourceId, delete old entries with this token
      if (existingToken) {
        try {
          const listResp = await fetch(`${BACKEND}/api/resources`, { headers: backendHeaders(useAuth) });
          if (listResp.ok) {
            const entries = await listResp.json();
            const list = Array.isArray(entries) ? entries : entries.data || [];
            for (const e of list) {
              if (e.type !== "casting_share") continue;
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

      const payload = { type: "casting_share", blob: blobData };
      const resp = await fetch(`${BACKEND}/api/resources`, {
        method: "POST",
        headers: backendHeaders(useAuth),
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) return res.status(500).json({ error: "Backend storage failed", detail: data });

      return res.status(200).json({ token, url, id: data.id || data._id });
    }

    // GET — fetch Casting share by token
    if (req.method === "GET") {
      const { token } = req.query;
      if (!token) return res.status(400).json({ error: "Missing token" });

      const useAuth = await resolveAuth(auth);
      const resp = await fetch(`${BACKEND}/api/resources`, { headers: backendHeaders(useAuth) });
      if (!resp.ok) return res.status(500).json({ error: `Backend returned ${resp.status}` });
      const entries = await resp.json();
      const list = Array.isArray(entries) ? entries : entries.data || [];
      const match = list.find((e) => {
        if (e.type !== "casting_share") return false;
        try { return (typeof e.blob === "string" ? JSON.parse(e.blob) : e.blob).token === token; }
        catch { return false; }
      });
      if (!match) return res.status(404).json({ error: "Share not found" });

      const parsed = typeof match.blob === "string" ? JSON.parse(match.blob) : match.blob;

      // Return full rendered HTML page with interactive approve/shortlist/reject
      const title = parsed.projectName || "Casting Deck";
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
body{margin:0;padding:24px;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:10px;color:#1a1a1a;background:#f5f5f7}
.cast-wrap{max-width:1123px;margin:0 auto;background:#fff;border-radius:4px;box-shadow:0 2px 16px rgba(0,0,0,0.08);overflow:hidden}
.cast-inner{padding:24px 16px}
.actions{text-align:center;padding:24px 0}
.btn{display:inline-block;background:#1a1a1a;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;text-decoration:none}
.btn:hover{background:#333}
@media print{
  body{background:#fff;padding:12mm;padding-bottom:18mm}
  .cast-wrap{box-shadow:none;border-radius:0}
  .actions{display:none!important}
  @page{size:landscape;margin:0}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
}
</style></head><body>
<div class="cast-wrap"><div class="cast-inner">${parsed.html}</div></div>
<div class="actions"><button class="btn" onclick="window.print()">Download as PDF</button></div>
<script>
/* Interactive approve/shortlist/reject on shared casting page */
(function(){
  var ACTIONS=[
    {k:"approved",l:"APPROVE",c:"#2E7D32"},
    {k:"shortlisted",l:"SHORTLIST",c:"#E65100"},
    {k:"rejected",l:"REJECT",c:"#C62828"}
  ];
  /* Find all cast card containers that have the approve/shortlist/reject button row */
  document.querySelectorAll('div').forEach(function(row){
    var kids=row.children;
    if(!kids||kids.length!==3)return;
    var isActionRow=true;
    for(var i=0;i<3;i++){
      var txt=(kids[i].textContent||"").trim().toUpperCase();
      if(txt!=="APPROVE"&&txt!=="SHORTLIST"&&txt!=="REJECT"){isActionRow=false;break;}
    }
    if(!isActionRow)return;
    /* This is an action row — make buttons interactive */
    var card=row.parentElement;
    if(!card)return;
    var currentStatus="none";
    for(var j=0;j<3;j++){
      (function(btn,action){
        btn.style.cursor="pointer";
        btn.addEventListener("click",function(){
          var newStatus=currentStatus===action.k?"none":action.k;
          currentStatus=newStatus;
          /* Update all 3 buttons */
          for(var x=0;x<3;x++){
            var b=row.children[x];
            var a=ACTIONS[x];
            if(currentStatus===a.k){
              b.style.background=a.c;
              b.style.color="#fff";
            }else{
              b.style.background="#fff";
              b.style.color=a.c;
            }
          }
          /* Update card border */
          var bc=currentStatus==="approved"?"#2E7D32":currentStatus==="shortlisted"?"#E65100":currentStatus==="rejected"?"#C62828":"#eee";
          var bw=currentStatus!=="none"?"3px":"1px";
          card.style.border=bw+" solid "+bc;
        });
      })(kids[j],ACTIONS[j]);
    }
  });
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
