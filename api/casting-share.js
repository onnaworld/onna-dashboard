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
    if (e.type !== "casting_share") return false;
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
        body: JSON.stringify({ type: "casting_share", blob: JSON.stringify(parsed) }),
      });
      if (!putResp.ok) return res.status(500).json({ error: "Failed to save feedback" });
      return res.status(200).json({ ok: true });
    }

    // POST — create or update Casting share
    if (req.method === "POST") {
      const { html, projectName, clientName, mode, token: existingToken, resourceId } = req.body;
      if (!html) return res.status(400).json({ error: "Missing html" });

      const clientSlug = makeSlug(clientName);
      const projectSlug = makeSlug(projectName);
      const slugBase = [clientSlug, projectSlug, "castingdeck"].filter(Boolean).join("_") || "castingdeck";
      const token = existingToken || (slugBase + "_v" + Date.now().toString(36));
      const url = `https://app.onna.world/api/casting-share?token=${encodeURIComponent(token)}`;

      const useAuth = await resolveAuth(auth);

      const blobData = JSON.stringify({
        token,
        html,
        projectName: projectName || "",
        mode: mode || "casting",
        createdAt: new Date().toISOString(),
      });

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

      // Return full rendered HTML page with interactive approve/shortlist/reject
      const title = parsed.projectName || "Casting Deck";
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
body{margin:0;padding:24px;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:10px;color:#1a1a1a;background:#f5f5f7}
.cast-wrap{max-width:1123px;margin:0 auto;background:#fff;border-radius:4px;box-shadow:0 2px 16px rgba(0,0,0,0.08);overflow:hidden}
.cast-inner{padding:24px 16px}
.actions{text-align:center;padding:24px 0}
.btn{display:inline-block;background:#1a1a1a;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;text-decoration:none}
.btn:hover{background:#333}
.save-toast{position:fixed;bottom:20px;right:20px;background:#2E7D32;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;font-family:inherit;opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:9999}
.save-toast.show{opacity:1}
@media print{
  body{background:#fff;padding:12mm;padding-bottom:18mm}
  .cast-wrap{box-shadow:none;border-radius:0}
  .actions{display:none!important}
  .save-toast{display:none!important}
  @page{size:landscape;margin:0}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
}
</style></head><body>
<div class="cast-wrap"><div class="cast-inner">${parsed.html}</div></div>
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
/* Interactive approve/shortlist/reject on shared casting page */
(function(){
  var ACTIONS=[
    {k:"approved",l:"APPROVE",c:"#2E7D32"},
    {k:"shortlisted",l:"SHORTLIST",c:"#E65100"},
    {k:"rejected",l:"REJECT",c:"#C62828"}
  ];
  document.querySelectorAll('div').forEach(function(row){
    var kids=row.children;
    if(!kids||kids.length!==3)return;
    var isActionRow=true;
    for(var i=0;i<3;i++){
      var txt=(kids[i].textContent||"").trim().toUpperCase();
      if(txt!=="APPROVE"&&txt!=="SHORTLIST"&&txt!=="REJECT"){isActionRow=false;break;}
    }
    if(!isActionRow)return;
    var card=row.parentElement;
    if(!card)return;
    var ci=Array.prototype.indexOf.call(card.parentElement?card.parentElement.children:[],card);
    var fb=_feedback['c'+ci];
    var currentStatus=(fb&&fb.status)||"none";
    /* Apply existing feedback */
    if(currentStatus!=="none"){
      for(var x=0;x<3;x++){
        var a=ACTIONS[x];
        if(currentStatus===a.k){kids[x].style.background=a.c;kids[x].style.color="#fff";card.style.border="3px solid "+a.c;}
      }
    }
    for(var j=0;j<3;j++){
      (function(btn,action,idx){
        btn.style.cursor="pointer";
        btn.addEventListener("click",function(){
          var newStatus=currentStatus===action.k?"none":action.k;
          currentStatus=newStatus;
          for(var x=0;x<3;x++){
            var b=row.children[x];
            var a=ACTIONS[x];
            if(currentStatus===a.k){b.style.background=a.c;b.style.color="#fff";}
            else{b.style.background="#fff";b.style.color=a.c;}
          }
          var bc=currentStatus==="approved"?"#2E7D32":currentStatus==="shortlisted"?"#E65100":currentStatus==="rejected"?"#C62828":"#eee";
          var bw=currentStatus!=="none"?"3px":"1px";
          card.style.border=bw+" solid "+bc;
          if(!_feedback['c'+ci])_feedback['c'+ci]={};
          _feedback['c'+ci].status=currentStatus;
          saveFeedback();
        });
      })(kids[j],ACTIONS[j],j);
    }
  });
})();
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
