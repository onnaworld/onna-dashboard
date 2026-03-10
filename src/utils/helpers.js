// ─── THEME ──────────────────────────────────────────────────────────────────
export const T = {
  bg:       "#f5f5f7",
  surface:  "#ffffff",
  border:   "#d2d2d7",
  borderSub:"#e8e8ed",
  text:     "#1d1d1f",
  sub:      "#6e6e73",
  muted:    "#aeaeb2",
  accent:   "#1d1d1f",
  link:     "#0066cc",
  inBg:     "#f0faf4", inColor:"#1a7f37",
  outBg:    "#fff3f0", outColor:"#c0392b",
};

// ─── INDEXEDDB FILE STORAGE ──────────────────────────────────────────────────
const IDB_NAME="onna_files"; const IDB_STORE="files"; const IDB_VER=1;
const idbOpen=()=>new Promise((res,rej)=>{const r=indexedDB.open(IDB_NAME,IDB_VER);r.onupgradeneeded=e=>{e.target.result.createObjectStore(IDB_STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
export const idbGet=async(key)=>{const db=await idbOpen();return new Promise((res,rej)=>{const t=db.transaction(IDB_STORE,"readonly").objectStore(IDB_STORE).get(key);t.onsuccess=()=>res(t.result);t.onerror=()=>rej(t.error)})};
export const idbSet=async(key,val)=>{const db=await idbOpen();return new Promise((res,rej)=>{const t=db.transaction(IDB_STORE,"readwrite").objectStore(IDB_STORE).put(val,key);t.onsuccess=()=>res();t.onerror=()=>rej(t.error)})};

// ─── PDF PAGE LOADER (pdf.js from CDN) ──────────────────────────────────────
let _pdfjs=null;
export const ensurePdfJs=()=>{if(_pdfjs)return Promise.resolve(_pdfjs);return new Promise((res,rej)=>{if(window.pdfjsLib){_pdfjs=window.pdfjsLib;return res(_pdfjs);}const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";_pdfjs=window.pdfjsLib;res(_pdfjs);};s.onerror=()=>rej(new Error("Failed to load pdf.js"));document.head.appendChild(s);});};
export const loadPdfPages=async(dataUrl)=>{const pdfjs=await ensurePdfJs();const raw=atob(dataUrl.split(",")[1]);const arr=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);const doc=await pdfjs.getDocument({data:arr}).promise;const pages=[];for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i);const vp=pg.getViewport({scale:2});const c=document.createElement("canvas");c.width=vp.width;c.height=vp.height;await pg.render({canvasContext:c.getContext("2d"),viewport:vp}).promise;pages.push(c.toDataURL("image/png"));}return pages;};

// ─── SIGN / STAMP / LETTERHEAD compositing ──────────────────────────────────
export const _loadImg=(src)=>new Promise((res,rej)=>{const img=new Image();img.crossOrigin="anonymous";img.onload=()=>res(img);img.onerror=()=>rej(new Error("Failed to load "+src));img.src=src;});
export const _scanWhiteTop=(pgImg)=>{
  const sc=document.createElement("canvas");sc.width=pgImg.width;sc.height=pgImg.height;const sx=sc.getContext("2d");
  sx.drawImage(pgImg,0,0);const strip=sx.getImageData(0,0,sc.width,Math.min(sc.height,300));
  const w=strip.width,d=strip.data;
  for(let y=0;y<strip.height;y++){
    let hasContent=false;
    for(let x=Math.floor(w*0.05);x<Math.floor(w*0.95);x++){const idx=(y*w+x)*4;if(d[idx]<240||d[idx+1]<240||d[idx+2]<240){hasContent=true;break;}}
    if(hasContent)return y;
  }
  return strip.height;
};
export const processDocSignStamp=async(doc,{wantSign,wantStamp,wantLetterhead,signPages="last",stampPages="last",letterPages="first",signOffset=0,stampOffset=0,signOffsetX=0,stampOffsetX=0,signScale=1,stampScale=1,pageOffsets})=>{
  const appliesTo=(rule,i,total)=>{if(rule==="all")return true;if(rule==="first"&&i===0)return true;if(rule==="last"&&i===total-1)return true;if(Array.isArray(rule))return rule.includes(i);return rule===i;};
  const po=pageOffsets||{};
  const [signImg,stampImg,logoImg]=await Promise.all([wantSign?_loadImg("/SIGN.png"):null,wantStamp?_loadImg("/STAMP.png"):null,wantLetterhead?_loadImg("/onna-default-logo.png"):null]);
  const LH_H=100;
  const result=[];const total=doc.pages.length;
  for(let i=0;i<total;i++){
    const pgImg=await _loadImg(doc.pages[i]);
    const hasLH=wantLetterhead&&appliesTo(letterPages,i,total)&&logoImg;
    const c=document.createElement("canvas");c.width=pgImg.width;c.height=pgImg.height;const ctx=c.getContext("2d");
    ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);
    if(hasLH){
      const contentH=c.height-LH_H;const s=contentH/pgImg.height;const scaledW=pgImg.width*s;
      ctx.drawImage(pgImg,0,LH_H,scaledW,contentH);
      const lh=50,lw=lh*(logoImg.width/logoImg.height);ctx.drawImage(logoImg,60,22,lw,lh);ctx.strokeStyle="#000";ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(40,22+lh+8);ctx.lineTo(c.width-40,22+lh+8);ctx.stroke();
    }else{ctx.drawImage(pgImg,0,0);}
    const pg=po[i]||{};const sOX=pg.signOffsetX!=null?pg.signOffsetX:(signOffsetX||0);const sOY=pg.signOffset!=null?pg.signOffset:(signOffset||0);const stOX=pg.stampOffsetX!=null?pg.stampOffsetX:(stampOffsetX||0);const stOY=pg.stampOffset!=null?pg.stampOffset:(stampOffset||0);
    if(wantSign&&appliesTo(signPages,i,total)&&signImg){const sh=80*(signScale||1),sw=sh*(signImg.width/signImg.height);ctx.drawImage(signImg,60+sOX,c.height-180+sOY,sw,sh);}
    if(wantStamp&&appliesTo(stampPages,i,total)&&stampImg){const sth=120*(stampScale||1),stw=sth*(stampImg.width/stampImg.height);ctx.drawImage(stampImg,c.width-60-stw+stOX,c.height-180+stOY,stw,sth);}
    result.push(c.toDataURL("image/png"));
  }
  return{pages:result,name:doc.name};
};

// ─── Render HTML content to A4-ratio doc pages ─────────────────────────────
export const renderHtmlToDocPages = async (htmlContent, docName) => {
  const A4_W = 794, A4_H = 1123, MARGIN = 60, LOGO_H = 50;
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:" + A4_W + "px;height:auto;border:none;visibility:hidden;";
    document.body.appendChild(iframe);
    const idoc = iframe.contentDocument || iframe.contentWindow.document;
    const logoUrl = window.location.origin + "/onna-default-logo.png";
    idoc.open();
    idoc.write(`<!DOCTYPE html><html><head><style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Avenir','Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#222;padding:${MARGIN + LOGO_H + 20}px ${MARGIN}px ${MARGIN}px ${MARGIN}px;width:${A4_W}px;}
      h1{font-size:22px;font-weight:700;margin-bottom:16px;text-align:center;text-transform:uppercase;letter-spacing:1px;}
      h2{font-size:16px;font-weight:700;margin:20px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px;}
      h3{font-size:14px;font-weight:600;margin:14px 0 6px;}
      p{margin:8px 0;}
      ol,ul{margin:8px 0 8px 24px;}
      li{margin:4px 0;}
      table{width:100%;border-collapse:collapse;margin:12px 0;}
      th,td{border:1px solid #ccc;padding:6px 10px;text-align:left;font-size:12px;}
      th{background:#f5f5f5;font-weight:600;}
      .sig-block{margin-top:40px;display:flex;justify-content:space-between;gap:40px;}
      .sig-line{flex:1;border-top:1px solid #333;padding-top:6px;font-size:12px;}
    </style></head><body>${htmlContent}</body></html>`);
    idoc.close();
    setTimeout(async () => {
      try {
        const body = idoc.body;
        const totalH = Math.max(body.scrollHeight, body.offsetHeight);
        const contentAreaH = A4_H - LOGO_H - 20;
        const numPages = Math.max(1, Math.ceil(totalH / contentAreaH));
        body.style.paddingTop = MARGIN + "px";
        await new Promise(r => setTimeout(r, 100));
        const captureH = Math.max(body.scrollHeight, body.offsetHeight);
        const pages = [];
        const logoImg = await _loadImg(logoUrl).catch(() => null);
        for (let p = 0; p < numPages; p++) {
          const canvas = document.createElement("canvas");
          canvas.width = A4_W * 2; canvas.height = A4_H * 2;
          const ctx = canvas.getContext("2d");
          ctx.scale(2, 2);
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, A4_W, A4_H);
          if (logoImg) {
            const lh = LOGO_H * 0.7, lw = lh * (logoImg.width / logoImg.height);
            ctx.drawImage(logoImg, MARGIN, 16, lw, lh);
            ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(MARGIN - 10, 16 + lh + 6); ctx.lineTo(A4_W - MARGIN + 10, 16 + lh + 6); ctx.stroke();
          }
          const srcY = p * contentAreaH;
          const sliceH = Math.min(contentAreaH, captureH - srcY);
          if (sliceH > 0) {
            const svgNS = "http://www.w3.org/2000/svg";
            const clone = body.cloneNode(true);
            clone.style.width = A4_W + "px";
            clone.style.position = "absolute";
            clone.style.top = "-" + srcY + "px";
            clone.style.left = "0";
            clone.style.overflow = "hidden";
            const serializer = new XMLSerializer();
            const htmlStr = serializer.serializeToString(idoc.documentElement);
            const svgStr = `<svg xmlns="${svgNS}" width="${A4_W}" height="${contentAreaH}">
              <foreignObject width="${A4_W}" height="${contentAreaH}">
                <html xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:0;">
                  <body style="margin:0;padding:0;overflow:hidden;">
                    <div style="width:${A4_W}px;overflow:hidden;height:${contentAreaH}px;">
                      <div style="margin-top:-${srcY}px;">${htmlStr.replace(/<html[^>]*>/, '<div style="width:' + A4_W + 'px;">').replace(/<\/html>/, '</div>')}</div>
                    </div>
                  </body>
                </html>
              </foreignObject>
            </svg>`;
            const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(svgBlob);
            try {
              const img = await _loadImg(url);
              ctx.drawImage(img, 0, LOGO_H + 20, A4_W, contentAreaH);
            } catch (e) {
              // Fallback: just render what we can
            }
            URL.revokeObjectURL(url);
          }
          pages.push(canvas.toDataURL("image/png"));
        }
        document.body.removeChild(iframe);
        resolve({ name: docName || "Document", pages });
      } catch (err) {
        document.body.removeChild(iframe);
        reject(err);
      }
    }, 300);
  });
};

// ─── Export doc preview pages to print/PDF ──────────────────────────────────
export const exportDocPreview=(preview,originalDoc,pageIndex)=>{
  const pages=pageIndex!=null?[preview.pages[pageIndex]]:preview.pages;
  const doExport=(orient)=>{
    const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
    const idoc=iframe.contentDocument||iframe.contentWindow.document;
    const pw=orient==="landscape"?"297mm":"210mm",ph=orient==="landscape"?"210mm":"297mm";
    idoc.open();idoc.write(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}@page{margin:0;size:${pw} ${ph};}html,body{width:100%;height:100%;}div{width:100%;height:100%;padding:10mm 8mm 8mm 8mm;display:flex;align-items:flex-start;justify-content:center;page-break-after:always;page-break-inside:avoid;overflow:hidden;}div:last-child{page-break-after:auto;}img{max-width:100%;max-height:100%;object-fit:contain;display:block;}</style></head><body>${pages.map(p=>`<div><img src="${p}"/></div>`).join("")}</body></html>`);idoc.close();
    setTimeout(()=>{iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),1000);},400);
  };
  const srcPage=(originalDoc&&originalDoc.pages&&originalDoc.pages[pageIndex||0])||pages[0];
  const detectImg=new Image();detectImg.src=srcPage;
  if(detectImg.naturalWidth>0){doExport(detectImg.naturalWidth>detectImg.naturalHeight?"landscape":"portrait");}
  else{detectImg.onload=()=>doExport(detectImg.naturalWidth>detectImg.naturalHeight?"landscape":"portrait");}
};

// ─── ESTIMATE CALC HELPERS ───────────────────────────────────────────────────
export const estFmt = (n) => { const v = parseFloat(n); return isNaN(v) ? "" : v.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
export const estNum = (n) => { const v = parseFloat(String(n).replace(/,/g, "")); return isNaN(v) ? 0 : v; };
export const estRowTotal = (r) => { const d=estNum(r.days)||1; const q=estNum(r.qty)||1; const rt=estNum(r.rate); return d*q*rt; };
export const estSectionTotal = (s) => s.rows.reduce((sum,r)=>sum+estRowTotal(r),0);
export const estCalcTotals = (sections) => {
  const subtotal = sections.filter(s=>!s.isFees).reduce((sum,s)=>sum+estSectionTotal(s),0);
  const feesTotal = sections.filter(s=>s.isFees).reduce((sum,s)=>
    s.rows.reduce((rsum, row) => {
      const pctMatch = (row.notes || "").match(/(\d+(?:\.\d+)?)%/);
      if (pctMatch) return rsum + subtotal * (parseFloat(pctMatch[1]) / 100);
      return rsum + estRowTotal(row);
    }, 0) + sum, 0);
  return { subtotal, feesTotal, grandTotal: subtotal + feesTotal };
};

// ─── PRINT CLEANUP: strip browser headers/footers & extension injections ───
export const PRINT_CLEANUP_CSS = `[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"],[class*="extension"]{display:none!important;visibility:hidden!important;height:0!important;width:0!important;overflow:hidden!important;position:absolute!important;pointer-events:none!important;}`;
export const PRINT_CLEANUP_SCRIPT = `<script>window.onload=function(){document.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(function(el){el.remove();});setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},100);};<\/script>`;

// ─── ACTUALS TRACKER HELPERS ────────────────────────────────────────────────
export const buildActualsFromEstimate = (estimateSections) => {
  const secs = estimateSections || defaultSections();
  return secs.map(s => ({
    ...JSON.parse(JSON.stringify(s)),
    rows: s.rows.map(r => ({
      ...JSON.parse(JSON.stringify(r)),
      expenses: [],
      zohoAmount: "0",
      status: "",
    })),
  }));
};

export const actualsRowExpenseTotal = (row) => (row.expenses || []).reduce((s, e) => s + estNum(e.amount), 0);
export const actualsRowEffective = (row) => { const a = estNum(row.actualsAmount); return a ? a : actualsRowExpenseTotal(row); };
export const actualsSectionExpenseTotal = (sec) => sec.rows.reduce((s, r) => s + actualsRowExpenseTotal(r), 0);
export const actualsSectionEffective = (sec) => sec.rows.reduce((s, r) => s + actualsRowEffective(r), 0);
export const actualsSectionZohoTotal = (sec) => sec.rows.reduce((s, r) => s + estNum(r.zohoAmount), 0);
export const actualsGrandExpenseTotal = (sections) => sections.reduce((s, sec) => s + actualsSectionExpenseTotal(sec), 0);
export const actualsGrandEffective = (sections) => sections.reduce((s, sec) => s + actualsSectionEffective(sec), 0);
export const actualsGrandZohoTotal = (sections) => sections.reduce((s, sec) => s + actualsSectionZohoTotal(sec), 0);

// ─── API ──────────────────────────────────────────────────────────────────────
export const _proxy = (path) => `/api/proxy?target=${encodeURIComponent(path)}`;
export const GCAL_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
export const getToken = () => localStorage.getItem("onna_token") || "";
const _h = (extra={}) => ({"Authorization":`Bearer ${getToken()}`,...extra});
const _guard = r => { if(r.status===401){localStorage.removeItem("onna_token");window.location.reload();} return r.json(); };
export const api = {
  get:    (path)       => fetch(_proxy(path),{headers:_h()}).then(_guard),
  post:   (path, body) => fetch(_proxy(path),{method:"POST",  headers:_h({"Content-Type":"application/json"}),body:JSON.stringify(body)}).then(_guard),
  put:    (path, body) => fetch(_proxy(path),{method:"PUT",   headers:_h({"Content-Type":"application/json"}),body:JSON.stringify(body)}).then(_guard),
  delete: (path)       => fetch(_proxy(path),{method:"DELETE",headers:_h()}).then(_guard),
};

// ─── Document store API helpers (Turso-backed) ─────────────────────────────
export const docApi = {
  get: (table, projectId) => api.get(`/api/${table}?project_id=${projectId}`).then(r => r?.data ? JSON.parse(r.data) : null),
  put: (table, projectId, data) => api.post(`/api/${table}`, { project_id: projectId, data: JSON.stringify(data) }),
};
export const globalApi = {
  get: (table) => api.get(`/api/${table}`).then(r => r?.data ? JSON.parse(r.data) : null),
  put: (table, data) => api.post(`/api/${table}`, { data: JSON.stringify(data) }),
};
export const configApi = {
  get: (key) => api.get(`/api/user_config?key=${key}`).then(r => r?.data ? JSON.parse(r.data) : null),
  put: (key, data) => api.post(`/api/user_config`, { key, data: JSON.stringify(data) }),
};

// ─── Debounced save to Turso (dual-write alongside localStorage) ───────────
const _saveTimers = {};
const _prevStoreSnaps = {};
let _pendingSaves = 0;
let _onSaveStatus = null;
export const setSaveStatusCallback = (cb) => { _onSaveStatus = cb; };
const _notifySaving = () => { _pendingSaves++; if (_onSaveStatus) _onSaveStatus("saving"); };
const _notifySaved = () => { _pendingSaves = Math.max(0, _pendingSaves - 1); if (_pendingSaves === 0 && _onSaveStatus) _onSaveStatus("saved"); };
export const debouncedDocSave = (table, storeObj, delay = 2000) => {
  const prev = _prevStoreSnaps[table] || {};
  const changedPids = Object.keys(storeObj).filter(pid => {
    const cur = JSON.stringify(storeObj[pid]);
    return cur !== prev[pid];
  });
  const snap = {};
  Object.keys(storeObj).forEach(pid => { snap[pid] = JSON.stringify(storeObj[pid]); });
  _prevStoreSnaps[table] = snap;
  changedPids.forEach(pid => {
    const key = `${table}:${pid}`;
    clearTimeout(_saveTimers[key]);
    _notifySaving();
    _saveTimers[key] = setTimeout(() => {
      docApi.put(table, pid, storeObj[pid]).then(_notifySaved).catch(_notifySaved);
    }, delay);
  });
};
export const debouncedGlobalSave = (table, data, delay = 2000) => {
  clearTimeout(_saveTimers[table]);
  _notifySaving();
  _saveTimers[table] = setTimeout(() => {
    globalApi.put(table, data).then(_notifySaved).catch(_notifySaved);
  }, delay);
};
export const debouncedConfigSave = (key, data, delay = 2000) => {
  clearTimeout(_saveTimers[`cfg:${key}`]);
  _notifySaving();
  _saveTimers[`cfg:${key}`] = setTimeout(() => {
    configApi.put(key, data).then(_notifySaved).catch(_notifySaved);
  }, delay);
};
export const flushAllSaves = () => {
  Object.keys(_saveTimers).forEach(k => {
    clearTimeout(_saveTimers[k]);
  });
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const LEAD_CATEGORIES = ["All","Production Companies","Creative Agencies","Beauty & Fragrance","Jewellery & Watches","Fashion","Editorial","Sports","Hospitality","Market Research","Commercial"];
export const VENDORS_CATEGORIES = ["Locations","Hair and Makeup","Stylists","Casting","Catering","Set Design","Equipment","Crew","Production"];
export const BB_LOCATIONS = ["All","Dubai, UAE","London, UK","New York, US","Los Angeles, US"];
export const OUTREACH_STATUSES = ["not_contacted","cold","warm","open","client"];
export const OUTREACH_STATUS_LABELS = {not_contacted:"Not Contacted",cold:"Cold",warm:"Warm",open:"Open",client:"Client"};
export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const GCAL_COLORS = {"1":"#d50000","2":"#e67c73","3":"#f4511e","4":"#f6bf26","5":"#33b679","6":"#0b8043","7":"#039be5","8":"#3f51b5","9":"#7986cb","10":"#8e24aa","11":"#616161"};
export const OUTLOOK_CAL_ICS = "https://outlook.office365.com/owa/calendar/2b3ad2259c4b4aaeb9ef497749cda730@onnaproduction.com/03e7e6c4750845fcb9ec9bb1040863bb2959111588689312764/calendar.ics";
export const PROJECT_SECTIONS = ["Home","Creative","Budget","Documents","Travel","Locations","Casting","Styling","Schedule"];
export const CONTRACT_TYPES = ["Commissioning Agreement – Self Employed","Commissioning Agreement – Via PSC","Talent Agreement","Talent Agreement – Via PSC"];
export const ACTUALS_STATUSES = ["", "Pending", "Confirmed", "Paid"];

// ─── URL ROUTING HELPERS ───────────────────────────────────────────────────
export const TAB_SLUGS = {Dashboard:"dashboard",Agents:"agents",Vendors:"vendors",Clients:"clients",Projects:"projects",Finance:"finance",Resources:"resources",Information:"information",Notes:"notes",Settings:"settings"};
export const SLUG_TO_TAB = Object.fromEntries(Object.entries(TAB_SLUGS).map(([k,v])=>[v,k]));
export const SECTION_SLUGS = Object.fromEntries(PROJECT_SECTIONS.map(s=>[s,s.toLowerCase()]));
export const SLUG_TO_SECTION = Object.fromEntries(PROJECT_SECTIONS.map(s=>[s.toLowerCase(),s]));

export const buildPath = (tab, projectId, section, subSection) => {
  if (tab==="Projects" && projectId) {
    let path = `/projects/${projectId}`;
    if (section && section!=="Home") {
      path += `/${SECTION_SLUGS[section]||section.toLowerCase()}`;
      if (subSection) path += `/${subSection}`;
    }
    return path;
  }
  return `/${TAB_SLUGS[tab]||tab.toLowerCase()}`;
};

export const parseURL = (pathname, projectList) => {
  const parts = pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);
  if (parts.length===0) return {tab:null};
  if (parts[0]==="projects") {
    if (parts.length===1) return {tab:"Projects"};
    const pid = parts[1];
    const proj = projectList.find(p=>String(p.id)===pid);
    if (!proj) return {tab:"Projects"};
    const section = parts[2] ? (SLUG_TO_SECTION[parts[2]]||null) : "Home";
    const subSection = parts[3]||null;
    return {tab:"Projects",project:proj,section:section||"Home",subSection};
  }
  const tab = SLUG_TO_TAB[parts[0]];
  return tab ? {tab} : {tab:null};
};

// ─── ICS CALENDAR PARSER ────────────────────────────────────────────────────
export const parseICS = (text) => {
  const now = new Date();
  const winStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const winEnd   = new Date(now.getFullYear(), now.getMonth() + 13, 0);
  const unfolded = text.replace(/\r\n[ \t]/g,"").replace(/\r\n/g,"\n").replace(/\r/g,"\n");
  const rawBlocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)||[];
  const getF = (block,key) => { const m=block.match(new RegExp(`^${key}(?:;[^:]*)?:(.+)$`,"m")); return m?m[1].trim():""; };
  const isZ = s => (s||"").endsWith("Z");
  const pad = n => String(n).padStart(2,"0");
  const parseDT = s => {
    if (!s) return null;
    const p = s.replace(/[^0-9T]/g,"");
    if (p.length===8) return new Date(+p.slice(0,4),+p.slice(4,6)-1,+p.slice(6,8));
    if (p.length>=15) { const [y,mo,d,h,mi,sc]=[p.slice(0,4),p.slice(4,6),p.slice(6,8),p.slice(9,11),p.slice(11,13),p.slice(13,15)].map(Number); return isZ(s)?new Date(Date.UTC(y,mo-1,d,h,mi,sc)):new Date(y,mo-1,d,h,mi,sc); }
    return null;
  };
  const dtToField = (dt,allDay,utc) => {
    if (!dt) return {};
    if (allDay) return {date:`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`};
    if (utc) return {dateTime:dt.toISOString()};
    return {dateTime:`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`};
  };
  const DAY_JS = {SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};
  const mondayOf = d => { const r=new Date(d); r.setHours(0,0,0,0); r.setDate(r.getDate()-((r.getDay()+6)%7)); return r; };
  const expandRRule = (rrStr,rawS,rawE,exdates) => {
    const parts={}; rrStr.split(";").forEach(p=>{const [k,v]=p.split("=");if(k&&v)parts[k]=v;});
    const freq=parts.FREQ; if(!freq) return [];
    const intv=Math.max(1,parseInt(parts.INTERVAL||"1",10));
    const until=parts.UNTIL?parseDT(parts.UNTIL):winEnd;
    const maxN=parts.COUNT?parseInt(parts.COUNT,10):2000;
    const bds=parts.BYDAY?parts.BYDAY.split(",").map(s=>DAY_JS[s.replace(/[^A-Z]/g,"")]).filter(n=>n!=null):null;
    const allDay=rawS.replace(/[^0-9T]/g,"").length===8, utc=isZ(rawS);
    const dtS=parseDT(rawS),dtE=parseDT(rawE||rawS); if(!dtS) return [];
    const durMs=Math.max(0,(dtE||dtS)-dtS);
    const exSet=new Set(exdates.flatMap(l=>l.split(",")).map(s=>{const d=parseDT(s.trim());return d?`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`:null;}).filter(Boolean));
    const results=[]; let nTotal=0;
    const addOcc=occ=>{
      if(nTotal>=maxN||occ<dtS||occ<winStart||occ>winEnd||occ>until) return;
      const endO=new Date(occ.getTime()+durMs);
      const occKey=`${occ.getFullYear()}-${pad(occ.getMonth()+1)}-${pad(occ.getDate())}`;
      if(exSet.has(occKey)) return;
      results.push({start:dtToField(occ,allDay,utc),end:dtToField(endO,allDay,utc),occKey}); nTotal++;
    };
    if(freq==="DAILY"){
      let c=new Date(dtS); while(c<=winEnd&&c<=until&&nTotal<maxN){addOcc(c);c=new Date(c);c.setDate(c.getDate()+intv);}
    } else if(freq==="WEEKLY"){
      const days=bds||[dtS.getDay()]; let wk=mondayOf(dtS),wkN=0;
      while(wk<=winEnd&&wk<=until&&nTotal<maxN&&wkN<2000){
        for(const dn of days){const dm=(dn+6)%7;const occ=new Date(wk);occ.setDate(wk.getDate()+dm);if(!allDay)occ.setHours(dtS.getHours(),dtS.getMinutes(),dtS.getSeconds(),0);addOcc(occ);}
        wk.setDate(wk.getDate()+7*intv); wkN++;
      }
    } else if(freq==="MONTHLY"){
      let c=new Date(dtS); while(c<=winEnd&&c<=until&&nTotal<maxN){addOcc(c);c=new Date(c);c.setMonth(c.getMonth()+intv);}
    } else if(freq==="YEARLY"){
      let c=new Date(dtS); while(c<=winEnd&&c<=until&&nTotal<maxN){addOcc(c);c=new Date(c);c.setFullYear(c.getFullYear()+intv);}
    }
    return results;
  };
  const baseEvs=[]; const excMap={};
  for(const ve of rawBlocks){
    const g=k=>getF(ve,k);
    const uid=g("UID")||String(Math.random()); const recId=g("RECURRENCE-ID"),rrule=g("RRULE");
    const rawStart=g("DTSTART"),rawEnd=g("DTEND"); const summary=g("SUMMARY")||"(No title)";
    const exdates=[...ve.matchAll(/^EXDATE(?:;[^:]*)?:(.+)$/gm)].map(m=>m[1].trim());
    if(recId){ const rd=parseDT(recId); if(!rd) continue; const key=`${uid}_${rd.getFullYear()}-${pad(rd.getMonth()+1)}-${pad(rd.getDate())}`;
      const allDay=rawStart.replace(/[^0-9T]/g,"").length===8,utc=isZ(rawStart); const s=parseDT(rawStart),e=parseDT(rawEnd||rawStart);
      if(s) excMap[key]={id:key,summary,start:dtToField(s,allDay,utc),end:dtToField(e||s,allDay,utc),calendarColor:"#0078d4",_outlook:true};
    } else { baseEvs.push({uid,rrule,rawStart,rawEnd:rawEnd||rawStart,summary,exdates}); }
  }
  const events=[];
  for(const ev of baseEvs){
    if(!ev.rawStart) continue;
    const allDay=ev.rawStart.replace(/[^0-9T]/g,"").length===8,utc=isZ(ev.rawStart);
    const dtS=parseDT(ev.rawStart); if(!dtS) continue;
    if(ev.rrule){
      const occs=expandRRule(ev.rrule,ev.rawStart,ev.rawEnd,ev.exdates);
      for(const occ of occs){const key=`${ev.uid}_${occ.occKey}`;if(excMap[key]){events.push(excMap[key]);delete excMap[key];}else events.push({id:key,summary:ev.summary,start:occ.start,end:occ.end,calendarColor:"#0078d4",_outlook:true});}
    } else if(dtS>=winStart&&dtS<=winEnd){
      const dtE=parseDT(ev.rawEnd); events.push({id:ev.uid,summary:ev.summary,start:dtToField(dtS,allDay,utc),end:dtToField(dtE||dtS,allDay,utc),calendarColor:"#0078d4",_outlook:true});
    }
  }
  Object.values(excMap).forEach(ex=>{const ds=ex.start?.date||ex.start?.dateTime?.slice(0,10);if(ds){const d=new Date(ds+"T00:00:00");if(d>=winStart&&d<=winEnd)events.push(ex);}});
  return events;
};

// ─── SEARCH & FUZZY MATCHING ────────────────────────────────────────────────
export function levenshtein(a,b){
  a=a.toLowerCase().trim();b=b.toLowerCase().trim();
  if(!a.length)return b.length;if(!b.length)return a.length;
  const dp=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);
  for(let j=0;j<=b.length;j++)dp[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
  return dp[a.length][b.length];
}
export function findSimilar(name,allVendors,allLeads){
  const all=findAllSimilar(name,allVendors,allLeads);
  return all.length?all[0]:null;
}
export function findAllSimilar(name,allVendors,allLeads){
  if(!name)return[];
  const q=name.toLowerCase().trim();
  if(q.length<2)return[];
  const thresh=Math.max(2,Math.floor(q.length*0.28));
  const _m=(a,b)=>a===b||(a.length>=3&&b.length>=3&&(a.includes(b)||b.includes(a)))||levenshtein(a,b)<=thresh;
  const results=[];
  const seen=new Set();
  for(const v of(allVendors||[])){
    const vn=(v.name||"").toLowerCase().trim();
    const vc=(v.company||"").toLowerCase().trim();
    const key="v_"+v.id;
    if(seen.has(key))continue;
    if((vn&&vn===q)||(vc&&vc===q)){seen.add(key);results.push({record:v,type:"vendor",exact:true});}
    else if((vn&&_m(q,vn))||(vc&&_m(q,vc))){seen.add(key);results.push({record:v,type:"vendor",exact:false});}
  }
  for(const l of(allLeads||[])){
    const lc=(l.contact||"").toLowerCase().trim();
    const lco=(l.company||"").toLowerCase().trim();
    const key="l_"+l.id;
    if(seen.has(key))continue;
    if((lc&&lc===q)||(lco&&lco===q)){seen.add(key);results.push({record:l,type:"lead",exact:true});}
    else if((lc&&_m(q,lc))||(lco&&_m(q,lco))){seen.add(key);results.push({record:l,type:"lead",exact:false});}
  }
  return results;
}
export function parseQuickEntry(text){
  if(text.length>300||text.includes("\n"))return null;
  const parts=text.split(",").map(s=>s.trim()).filter(Boolean);
  if(parts.length<3||parts.length>6)return null;
  const emailPart=parts.find(p=>/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(p));
  if(!emailPart)return null;
  const nonEmail=parts.filter(p=>p!==emailPart);
  const isVendor=/vendor|supplier|equipment|studio|hire|rental|crew|freelancer|photographer|videographer|stylist|catering|set design|casting|hair and makeup/i.test(text);
  const locPart=nonEmail.find(p=>/dubai|london|uae|uk|abu dhabi/i.test(p));
  const loc=locPart?locPart.replace(/\b(vendor|supplier|client|customer)\b/gi,"").replace(/[,\s]+$/,"").trim():"Dubai, UAE";
  if(isVendor){
    return{_type:"vendor",name:nonEmail[0]||"",company:"",category:nonEmail[1]||"",email:emailPart,phone:"",website:"",location:loc||"Dubai, UAE",notes:"",rateCard:""};
  }else{
    return{_type:"lead",contact:nonEmail[0]||"",role:nonEmail[1]||"",company:nonEmail[2]||"",email:emailPart,phone:"",value:"",category:"Other",location:loc||"Dubai, UAE",date:new Date().toISOString().split("T")[0],status:"not_contacted",notes:""};
  }
}
export function detectFieldKey(value){
  if(/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(value))return"email";
  if(/^\+?[\d\s\-().]{7,}$/.test(value))return"phone";
  if(/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(value)&&!value.includes("@"))return"website";
  return"notes";
}
export function findVendorOrLead(name,allVendors,allLeads){
  const q=name.toLowerCase().trim();
  const vendor=(allVendors||[]).find(v=>v.name?.toLowerCase().includes(q)||q.includes(v.name?.toLowerCase()?.trim()||"__"));
  if(vendor)return{record:vendor,type:"vendor"};
  const lead=(allLeads||[]).find(l=>(l.contact?.toLowerCase().includes(q)||q.includes(l.contact?.toLowerCase()?.trim()||"__"))||(l.company?.toLowerCase().includes(q)||q.includes(l.company?.toLowerCase()?.trim()||"__")));
  if(lead)return{record:lead,type:"lead"};
  return null;
}

// Fuzzy project match: checks project name AND client name, supports partial/typo matching
export function fuzzyMatchProject(projects, input, excludeId) {
  const lower = input.toLowerCase().trim();
  if (!lower) return null;
  const words = lower.split(/\s+/).filter(w => w.length > 1);
  const candidates = excludeId != null ? projects.filter(p => p.id !== excludeId) : (projects||[]);
  const exact = candidates.find(p => lower.includes(p.name.toLowerCase()) || (lower.length>=4 && p.name.toLowerCase().includes(lower)));
  if (exact) return exact;
  const clientMatch = candidates.find(p => p.client && (lower.includes(p.client.toLowerCase()) || (lower.length>=4 && p.client.toLowerCase().includes(lower))));
  if (clientMatch) return clientMatch;
  const wordMatch = candidates.find(p => {
    const pWords = `${p.name} ${p.client || ""}`.toLowerCase().split(/[\s\/,]+/).filter(w=>w.length>=3);
    return words.filter(w=>w.length>=3).some(w => pWords.some(pw => pw.includes(w) || w.includes(pw))); });
  if (wordMatch) return wordMatch;
  const _ed = (a,b) => { const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>i); for(let j=1;j<=n;j++){let pv=d[0];d[0]=j;for(let i=1;i<=m;i++){const t=d[i];d[i]=a[i-1]===b[j-1]?pv:1+Math.min(pv,d[i],d[i-1]);pv=t;}} return d[m]; };
  for (const p of candidates) {
    const targets = `${p.name} ${p.client||""}`.toLowerCase().split(/[\s\/,]+/).filter(w=>w.length>=3);
    if(words.some(w=>w.length>=3&&targets.some(t=>_ed(w,t)<=2))) return p;
  }
  return null;
}

// ─── PDF EXPORT via Blob URL ──────────────────────────────────────────────────
export const exportToPDF = (content, title) => {
  const date = new Date().toLocaleDateString("en-GB", {day:"2-digit", month:"short", year:"numeric"});
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10.5pt;color:#111;background:#fff;padding:22mm 18mm;line-height:1.65;}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding-bottom:14px;border-bottom:1.5px solid #111;}
  .logo{font-size:22pt;font-weight:700;letter-spacing:-0.02em;}
  .doc-label{font-size:8pt;text-transform:uppercase;letter-spacing:0.1em;color:#666;margin-top:4px;}
  .co{text-align:right;font-size:8.5pt;color:#666;line-height:1.7;}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:5px 18px;margin-bottom:18px;padding:13px 15px;background:#f7f7f7;border-radius:5px;font-size:9pt;}
  .ml label{font-weight:600;font-size:7.5pt;text-transform:uppercase;letter-spacing:0.07em;color:#888;display:block;margin-bottom:2px;}
  table{width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:9.5pt;}
  th{background:#111;color:#fff;padding:7px 11px;text-align:left;font-size:7.5pt;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;}
  td{padding:7px 11px;border-bottom:1px solid #eee;vertical-align:top;}
  tr:nth-child(even) td{background:#fafafa;}
  .sub td{font-weight:600;border-top:1px solid #bbb;}
  .vat td{color:#666;}
  .grand td{font-weight:700;font-size:11pt;background:#111!important;color:#fff;}
  .adv td{color:#666;background:#f5f5f5!important;}
  .right{text-align:right;}
  .sec{font-weight:700;text-transform:uppercase;letter-spacing:0.09em;font-size:8.5pt;color:#333;margin:16px 0 7px;border-bottom:1px solid #e0e0e0;padding-bottom:4px;}
  .bul{padding-left:14px;margin-bottom:4px;font-size:9.5pt;}
  p{margin-bottom:8px;font-size:9.5pt;}
  .sigs{margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:28px;}
  .sig{border-top:1px solid #111;padding-top:5px;font-size:8.5pt;color:#555;}
  .sig2{margin-top:22px;border-top:1px solid #bbb;padding-top:5px;font-size:8pt;color:#888;}
  .note{margin-top:14px;padding:10px 13px;background:#f5f5f5;border-left:2px solid #bbb;font-size:9pt;color:#555;white-space:pre-line;}
  .ftr{margin-top:36px;padding-top:10px;border-top:1px solid #e0e0e0;font-size:7.5pt;color:#aaa;display:flex;justify-content:space-between;}
  @media print{body{padding:15mm 12mm;}@page{margin:0;size:A4;}}
</style>
</head><body>
<div class="hdr">
  <div><div class="logo">onna</div><div class="doc-label">${title}</div></div>
  <div class="co">ONNA FILM TV RADIO PRODUCTION SERVICES LLC<br>Office F1-022, Dubai, UAE<br>hello@onnaproduction.com</div>
</div>
${content}
<div class="ftr"><span>ONNA FILM TV RADIO PRODUCTION SERVICES LLC · DUBAI &amp; LONDON</span><span>Generated ${date}</span></div>
</body></html>`;

  const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
  const doc=iframe.contentDocument;doc.open();doc.write(html);doc.close();
  setTimeout(()=>{doc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),1000);},300);
};

// ─── CALL SHEET PDF EXPORT ─────────────────────────────────────────────────
export const printCallSheetPDF = (cs) => {
  const e = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const F = "'Avenir','Avenir Next','Nunito Sans',sans-serif";
  const LS = "letter-spacing:1.5px;";
  const secTitle = `font-size:10px;font-weight:800;${LS}text-transform:uppercase;border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:10px;`;
  const logoImg = (src) => src ? `<img src="${src}" style="max-height:30px;max-width:120px;object-fit:contain"/>` : "";
  const logos = `<div style="padding:40px 40px 0"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">${logoImg(cs.productionLogo)}<div style="display:flex;gap:16px;align-items:center;margin-top:-3px">${logoImg(cs.agencyLogo)}${logoImg(cs.clientLogo)}</div></div><div style="border-bottom:2.5px solid #000;margin-bottom:16px"></div></div>`;
  const venueHTML = (cs.venueRows||[]).map(r=>`<div style="display:flex;align-items:flex-start;margin-bottom:5px;gap:8px"><div style="min-width:95px;font-size:9px;font-weight:700;color:#888;${LS}text-transform:uppercase">${e(r.label)}</div><div style="flex:1;font-size:11px">${e(r.value)}</div></div>`).join("");
  const thStyle = `padding:5px 4px;font-size:9px;font-weight:800;${LS}color:#555;text-transform:uppercase;white-space:nowrap;`;
  const schedHTML = (cs.schedule||[]).map(r=>`<tr style="border-bottom:1px solid #f0f0f0;background:#fff"><td style="padding:4px 4px 4px 0;font-size:11px;font-weight:600">${e(r.time)}</td><td style="padding:4px;font-size:11px;font-weight:600">${e(r.activity)}</td><td style="padding:4px;font-size:11px">${e(r.notes)}</td></tr>`).join("");
  const deptHTML = (cs.departments||[]).map(dept => {
    const crewRows = (dept.crew||[]).map(c=>`<tr style="background:#fff;border-bottom:1px solid #f5f5f5"><td style="padding:3px 4px;font-size:9px;color:#666">${e(c.role)}</td><td style="padding:3px 4px;font-size:10px;font-weight:600">${e(c.name)}</td><td style="padding:3px 4px;font-size:10px">${e(c.mobile)}</td><td style="padding:3px 4px;font-size:10px;color:#1565C0">${e(c.email)}</td><td style="padding:3px 8px 3px 4px;font-size:10px;font-weight:600;text-align:right">${e(c.callTime)}</td></tr>`).join("");
    return `<tr><td colspan="5" style="padding:0"><div style="background:#1a1a1a;padding:3px 8px;font-size:9px;font-weight:800;${LS}color:#fff">${e(dept.name)}</div></td></tr>${crewRows}`;
  }).join("");
  const emergNums = (cs.emergencyNumbers||[]).map(en=>`<span style="color:#C62828;font-weight:800;font-size:10px">${e(en.number)}</span> <span style="font-weight:600;font-size:10px;${LS}">FOR</span> <strong style="font-size:10px;font-weight:700;${LS}">${e(en.label)}</strong>`).join(` <span style="color:#ccc;margin:0 4px">|</span> `);
  const mapLink = cs.mapLink ? `<div style="padding:0 32px 4px;font-size:10px"><span style="font-size:14px">🔗</span> <a href="${cs.mapLink}" style="color:#1565C0;text-decoration:none">${e(cs.mapLink)}</a></div>` : "";
  const extraMaps = (cs.extraMapImages||[]).filter(Boolean).map(img=>`<img src="${img}" style="width:100%;max-height:220px;object-fit:contain;border-radius:4px;margin-top:8px"/>`).join("");
  const mapImg = cs.mapImage ? `<div style="padding:14px 32px 10px"><div style="${secTitle}">MAP</div>${mapLink}<img src="${cs.mapImage}" style="width:100%;max-height:280px;object-fit:contain;border-radius:4px"/>${extraMaps}</div>` : (extraMaps ? `<div style="padding:14px 32px 10px"><div style="${secTitle}">MAP</div>${mapLink}${extraMaps}</div>` : "");
  const weatherSummaryPDF = cs.weatherSummary ? `<div style="font-size:9px;font-style:italic;letter-spacing:1.5px;margin-bottom:6px">${e(cs.weatherSummary)}</div>` : "";
  const wxEmoji=(c)=>{const l=(c||"").toLowerCase();return l.includes("sun")||l.includes("clear")?"☀️":l.includes("cloud")?"⛅":l.includes("rain")||l.includes("shower")?"🌧️":l.includes("storm")||l.includes("thunder")?"⛈️":l.includes("wind")?"💨":l.includes("fog")||l.includes("mist")?"🌫️":l.includes("snow")?"❄️":"🌤️"};
  const weatherHourlyPDF = (cs.weatherHourly||[]).length > 0 ? `<div style="margin-bottom:10px"><div style="font-weight:700;letter-spacing:1.5px;font-size:9px;color:#888;margin-bottom:4px">HOURLY FORECAST</div><div style="display:flex;width:100%">${cs.weatherHourly.map((h,i)=>`<div style="flex:1;text-align:center;padding:4px 2px;border-right:${i<cs.weatherHourly.length-1?"1px solid #eee":"none"};font-size:9px"><div style="font-weight:700;color:#555">${e(h.time)}</div><div style="font-size:13px;margin:2px 0">${wxEmoji(h.condition)}</div><div style="font-size:11px;font-weight:800;color:#1a1a1a;margin:1px 0">${e(h.tempC)}°</div><div style="font-size:8px;color:#888">${e(h.tempF)}°F</div></div>`).join("")}</div></div>` : "";
  const weatherFields = `<div style="padding:10px 32px 4px"><div style="${secTitle}">WEATHER</div>${weatherSummaryPDF}
  <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:10px">${cs.weatherHighC?`<div><strong style="font-size:9px;${LS}color:#888">HIGH: </strong>${e(cs.weatherHighC)}°C / ${e(cs.weatherHighF||"—")}°F</div>`:""}${cs.weatherLowC?`<div><strong style="font-size:9px;${LS}color:#888">LOW: </strong>${e(cs.weatherLowC)}°C / ${e(cs.weatherLowF||"—")}°F</div>`:""}</div>
  <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:10px">${cs.weatherRealFeelHighC?`<div><strong style="font-size:9px;${LS}color:#888">REAL FEEL HIGH: </strong>${e(cs.weatherRealFeelHighC)}°C / ${e(cs.weatherRealFeelHighF||"—")}°F</div>`:""}${cs.weatherRealFeelLowC?`<div><strong style="font-size:9px;${LS}color:#888">REAL FEEL LOW: </strong>${e(cs.weatherRealFeelLowC)}°C / ${e(cs.weatherRealFeelLowF||"—")}°F</div>`:""}</div>
  <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:10px">${cs.weatherSunrise?`<div><strong style="font-size:9px;${LS}color:#888">SUNRISE: </strong>${e(cs.weatherSunrise)}</div>`:""}${cs.weatherSunset?`<div><strong style="font-size:9px;${LS}color:#888">SUNSET: </strong>${e(cs.weatherSunset)}</div>`:""}${cs.weatherBlueHour?`<div><strong style="font-size:9px;${LS}color:#888">BLUE HOUR: </strong>${e(cs.weatherBlueHour)}</div>`:""}</div></div>`;
  const weatherImg = "";
  const body = `<div style="max-width:880px;margin:0 auto;background:#fff;font-family:${F};color:#1a1a1a">
${logos}
<div style="text-align:center;padding:20px 32px 4px"><div style="font-size:12px;font-weight:800;${LS}color:#000">CALL SHEET</div></div>
<div style="padding:8px 32px 10px;display:flex;justify-content:space-between;align-items:baseline;position:relative">
  <div style="font-size:11px;font-weight:800;${LS}">${e(cs.shootName)}</div>
  <div style="font-size:11px;font-weight:800;${LS}position:absolute;left:50%;transform:translateX(-50%)">${e(cs.date)}</div>
  <div style="font-size:11px;font-weight:800;${LS}white-space:nowrap">SHOOT DAY ${e(cs.dayNumber||"#")}</div>
</div>
${cs.passportNote?`<div style="padding:0 32px 10px;text-align:center;color:#C62828;font-size:8px;font-weight:700;${LS}">${e(cs.passportNote)}</div>`:""}
<div style="height:1px;background:#eee;margin:0 32px"></div>
<div style="padding:10px 32px;border-bottom:1px solid #eee;font-size:11px"><span style="font-size:9px;font-weight:700;color:#888;text-transform:uppercase;${LS}">Production On Set: </span>${e(cs.productionContacts)}</div>
<div style="padding:14px 32px 8px"><div style="${secTitle}">SHOOT</div>${venueHTML}</div>
<div style="padding:10px 32px"><div style="${secTitle}">SCHEDULE</div>
  <table style="width:100%;border-collapse:collapse;table-layout:fixed"><thead><tr style="background:#F4F4F4"><td style="${thStyle}background:#F4F4F4;width:10%">TIME</td><td style="${thStyle}background:#F4F4F4;width:18%">ACTIVITY</td><td style="${thStyle}background:#F4F4F4">NOTES</td></tr></thead><tbody>${schedHTML}</tbody></table>
</div>
<div style="padding:10px 32px"><div style="${secTitle}">CONTACTS</div>
  <table style="width:100%;border-collapse:collapse;table-layout:fixed"><thead><tr><td style="${thStyle}width:17%">ROLE</td><td style="${thStyle}width:15%">NAME</td><td style="${thStyle}width:16%">MOBILE</td><td style="${thStyle}width:30%">EMAIL</td><td style="${thStyle}width:8%;text-align:right;padding-right:8px">CALL TIME</td></tr></thead><tbody>${deptHTML}</tbody></table>
</div>
${mapImg||mapLink}${weatherFields}${weatherHourlyPDF}${weatherImg}
<div style="padding:14px 32px"><div style="${secTitle}">INVOICING</div>
  <div style="font-size:11px;margin-bottom:8px">Please note that payment terms are <strong>${e(cs.invoicing?.terms)}</strong> from the date of invoice.</div>
  <div style="font-size:11px"><div style="font-weight:700;margin-bottom:2px">FOR DUBAI CREW:</div><div>PLEASE SEND INVOICES TO: <span style="color:#1565C0">${e(cs.invoicing?.email)}</span></div><div style="font-weight:700;margin-top:6px">BILLING ADDRESS:</div><div style="white-space:pre-line;line-height:1.6">${e(cs.invoicing?.address)}</div><div style="margin-top:4px"><strong>TRN:</strong> ${e(cs.invoicing?.trn)}</div></div>
</div>
<div style="padding:10px 32px"><div style="${secTitle}">PROTOCOL ON SET</div><div style="font-size:10px;color:#555;line-height:1.7;white-space:pre-wrap">${e(cs.protocol)}</div></div>
<div style="padding:10px 32px"><div style="${secTitle}">NEAREST EMERGENCY SERVICES</div>
  <div style="font-size:9px;margin-bottom:8px;display:flex;flex-wrap:nowrap;align-items:center;gap:3px"><strong style="font-size:9px;font-weight:700;${LS}">${e(cs.emergencyDialPrefix)}</strong> ${emergNums}</div>
  <div style="font-size:11px;margin-bottom:4px;background:#FFFDE7;padding:3px 6px;border-radius:2px"><strong>NEAREST HOSPITAL: </strong>${e(cs.emergency?.hospital)}</div>
  <div style="font-size:11px;background:#FFFDE7;padding:3px 6px;border-radius:2px"><strong>NEAREST POLICE STATION: </strong>${e(cs.emergency?.police)}</div>
</div>
</div>`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Call Sheet</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:${F};}@media print{@page{margin:0;size:A4;}}${PRINT_CLEANUP_CSS}</style></head><body>${body}<script>window.onload=function(){window.print();};<\/script></body></html>`;
  const blob=new Blob([html],{type:"text/html"});
  const url=URL.createObjectURL(blob);
  const w=window.open(url,"_blank");
  if(w){setTimeout(()=>URL.revokeObjectURL(url),60000);}
  else{
    const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
    const doc=iframe.contentDocument;doc.open();doc.write(html);doc.close();
    setTimeout(()=>{iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>{try{document.body.removeChild(iframe);}catch{}},1000);},300);
    URL.revokeObjectURL(url);
  }
};

// ─── RISK ASSESSMENT PDF EXPORT ─────────────────────────────────────────────
export const printRiskAssessmentPDF = (ra) => {
  const e = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const F = "'Avenir','Avenir Next','Nunito Sans',sans-serif";
  const LS = "letter-spacing:1.5px;";
  const logoImg = (src) => src ? `<img src="${src}" style="max-height:30px;max-width:120px;object-fit:contain"/>` : "";
  const logos = `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">${logoImg(ra.productionLogo)}<div style="display:flex;gap:16px;align-items:center;margin-top:-3px">${logoImg(ra.agencyLogo)}${logoImg(ra.clientLogo)}</div></div>`;
  const metaHTML = [{l:"SHOOT NAME:",k:"shootName"},{l:"SHOOT DATE:",k:"shootDate"},{l:"LOCATIONS:",k:"locations"},{l:"CREW ON SET:",k:"crewOnSet"},{l:"TIMING:",k:"timing"}].map(({l,k})=>`<div style="display:flex;gap:6px;margin-bottom:2px"><span style="font-size:10px;font-weight:700;${LS}min-width:100px">${l}</span><span style="font-size:10px;letter-spacing:0.5px">${e(ra[k])}</span></div>`).join("");
  const sectionsHTML = (ra.sections||[]).map((sec,si)=>{
    const cols=sec.cols||["Hazard","Risk Level","Who is at Risk","Mitigation Strategy"];
    const colHead=cols.map((c,ci)=>`<div style="flex:${ci===0?3:ci===3?5:1.2};font-size:9px;font-weight:700;${LS}padding:0 6px;color:#000">${e(c)}</div>`).join("");
    const rows=(sec.rows||[]).map(row=>`<div style="display:flex;border-bottom:1px solid #eee;padding:4px 0;align-items:flex-start">${row.map((cell,ci)=>`<div style="flex:${ci===0?3:ci===3?5:1.2};padding:0 6px;font-size:10px;letter-spacing:0.5px;${ci===0?"font-weight:600;":""}">${e(cell)}</div>`).join("")}</div>`).join("");
    return `<div style="background:#000;color:#fff;font-size:10px;font-weight:700;${LS}text-align:center;padding:4px 8px;text-transform:uppercase;margin-top:24px">${si+1}. ${e(sec.title)}</div><div style="display:flex;background:#F4F4F4;border-bottom:1px solid #ddd;padding:5px 0">${colHead}</div>${rows}`;
  }).join("");
  const sectionHdr=(title)=>`<div style="background:#000;color:#fff;font-size:10px;font-weight:700;${LS}text-align:center;padding:4px 0;text-transform:uppercase;margin-top:24px;margin-bottom:0">${title}</div>`;
  const conductHTML=(ra.conductItems||[]).map(item=>`<div style="display:flex;align-items:baseline;margin-bottom:4px;gap:4px"><span style="font-size:10px">•</span><div style="flex:1"><strong style="font-size:10px;letter-spacing:0.5px">${e(item.label)}</strong> <span style="font-size:10px;letter-spacing:0.5px">${e(item.text)}</span></div></div>`).join("");
  const waiverHTML=(ra.waiverItems||[]).map((item,i)=>`<div style="display:flex;align-items:baseline;margin-bottom:4px;gap:4px"><span style="font-size:10px;font-weight:700;min-width:14px">${i+1}.</span><div style="flex:1"><strong style="font-size:10px;letter-spacing:0.5px">${e(item.label)}</strong> <span style="font-size:10px;letter-spacing:0.5px">${e(item.text)}</span></div></div>`).join("");
  const emergencyHTML=(ra.emergencyItems||[]).map(item=>{const isHosp=/hospital/i.test(item.label);return `<div style="display:flex;align-items:baseline;margin-bottom:4px;gap:4px"><span style="font-size:10px">•</span><div style="flex:1"><strong style="font-size:10px;letter-spacing:0.5px">${e(item.label)}</strong> <span style="font-size:10px;letter-spacing:0.5px;${isHosp?'background:#FFFDE7;padding:1px 4px;border-radius:2px':''}">${e(item.text)}</span></div></div>`;}).join("");
  const body = `<div style="background:#fff;padding:40px 40px;font-family:${F};color:#1a1a1a;line-height:1.5;max-width:880px;margin:0 auto">
${logos}
<div style="border-bottom:2.5px solid #000;margin-bottom:16px"></div>
<div style="text-align:center;font-size:12px;font-weight:700;${LS}text-transform:uppercase;margin-bottom:16px">RISK ASSESSMENT</div>
<div style="margin-bottom:20px">${metaHTML}</div>
${sectionsHTML}
${sectionHdr("PROFESSIONAL CODE OF CONDUCT")}
<div style="padding:8px 12px"><div style="font-size:10px;letter-spacing:0.5px;margin-bottom:8px;white-space:pre-wrap">${e(ra.conductIntro)}</div>${conductHTML}</div>
${sectionHdr("LIABILITY WAIVER & ACKNOWLEDGMENT")}
<div style="padding:8px 12px"><div style="font-size:10px;letter-spacing:0.5px;margin-bottom:8px;white-space:pre-wrap">${e(ra.waiverIntro)}</div>${waiverHTML}</div>
${sectionHdr("EMERGENCY RESPONSE PLAN")}
<div style="padding:8px 12px">${emergencyHTML}</div>
<div style="margin-top:60px;display:flex;justify-content:space-between;font-size:9px;${LS}color:#000"><div><div style="font-weight:700">@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div><div style="text-align:right"><div style="font-weight:700">WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div></div>
</div>`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Risk Assessment</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:${F};}@media print{@page{margin:0;size:A4;}}${PRINT_CLEANUP_CSS}</style></head><body>${body}<script>window.onload=function(){window.print();};<\/script></body></html>`;
  const blob=new Blob([html],{type:"text/html"});
  const url=URL.createObjectURL(blob);
  const w=window.open(url,"_blank");
  if(w){setTimeout(()=>URL.revokeObjectURL(url),60000);}
  else{
    const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
    const doc=iframe.contentDocument;doc.open();doc.write(html);doc.close();
    setTimeout(()=>{iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>{try{document.body.removeChild(iframe);}catch{}},1000);},300);
    URL.revokeObjectURL(url);
  }
};

// ─── TABLE EXPORT HELPERS ──────────────────────────────────────────────────────
export const downloadCSV = (rows, columns, filename) => {
  const header = columns.map(c=>`"${c.label}"`).join(",");
  const body = rows.map(r=>columns.map(c=>`"${String(r[c.key]??'').replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([header+"\n"+body],{type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),10000);
};

export const exportTablePDF = (rows, columns, title) => {
  const thead = `<tr>${columns.map(c=>`<th>${c.label}</th>`).join("")}</tr>`;
  const tbody = rows.map(r=>`<tr>${columns.map(c=>`<td>${r[c.key]??''}</td>`).join("")}</tr>`).join("");
  exportToPDF(`<div class="sec">${title}</div><table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`, title);
};

export const exportCastingPDF = (tables, columns, title) => {
  const date = new Date().toLocaleDateString("en-GB", {day:"2-digit", month:"short", year:"numeric"});
  const logoImg = new Image(); logoImg.crossOrigin = "anonymous";
  logoImg.onload = () => {
    try {
      const cv = document.createElement("canvas"); cv.width = logoImg.naturalWidth; cv.height = logoImg.naturalHeight;
      cv.getContext("2d").drawImage(logoImg, 0, 0); const dataUrl = cv.toDataURL("image/png");
      const PAGE_SIZE = 10;
      const tablesHTML = tables.map(t => {
        const allRows = t.rows||[];
        const pages = [];
        for(let i=0;i<allRows.length;i+=PAGE_SIZE) pages.push(allRows.slice(i,i+PAGE_SIZE));
        if(pages.length===0) pages.push([]);
        return pages.map((pageRows,pi) => {
          const thead = `<tr><th style="width:70px">Photo</th>${columns.map(c=>`<th>${c.label}</th>`).join("")}</tr>`;
          const tbody = pageRows.map(r=>`<tr><td style="width:70px">${r.headshot?`<img src="${r.headshot}" style="width:56px;height:56px;border-radius:6px;object-fit:cover"/>`:''}</td>${columns.map(c=>{const v=r[c.key]??'';if(c.key==='link'&&v){const href=v.startsWith('http')?v:'https://'+v;return `<td><a href="${href}" target="_blank" style="text-decoration:none;color:#1565C0;font-size:9pt" title="${v}">&#x1F4CE; Link to Portfolio</a></td>`;}if(c.key==='link')return `<td></td>`;return `<td>${v}</td>`;}).join("")}</tr>`).join("");
          return `${pi===0?`<div class="sec">${t.title||title}</div>`:''}${pi>0?'<div class="page-break"></div>':''}<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
        }).join(""); }).join("");
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10.5pt;color:#111;background:#fff;padding:18mm 15mm;line-height:1.65;}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding-bottom:14px;border-bottom:1.5px solid #111;}
  .hdr img{max-height:30px;max-width:120px;object-fit:contain;}
  .sec{font-weight:700;text-transform:uppercase;letter-spacing:0.09em;font-size:9pt;color:#333;margin:16px 0 7px;border-bottom:1px solid #e0e0e0;padding-bottom:4px;}
  table{width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:10pt;table-layout:fixed;}
  th{background:#111;color:#fff;padding:9px 14px;text-align:left;font-size:8pt;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;}
  td{padding:9px 14px;border-bottom:1px solid #eee;vertical-align:middle;word-wrap:break-word;}
  tr:nth-child(even) td{background:#fafafa;}
  td img{display:block;}
  .ftr{margin-top:36px;padding-top:10px;border-top:1px solid #e0e0e0;font-size:7.5pt;color:#aaa;display:flex;justify-content:space-between;}
  a{color:#1565C0;text-decoration:underline;}
  .page-break{page-break-before:always;margin-top:0;}
  @media print{body{padding:10mm 12mm;}@page{margin:0;size:A4 landscape;}.page-break{page-break-before:always;}}
</style>
</head><body>
<div class="hdr">
  <div><img src="${dataUrl}" alt="ONNA"/></div>
</div>
${tablesHTML}
<div class="ftr"><span>ONNA FILM TV RADIO PRODUCTION SERVICES LLC · DUBAI &amp; LONDON</span><span>Generated ${date}</span></div>
</body></html>`;
      const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
      const _doc=iframe.contentDocument;_doc.open();_doc.write(html);_doc.close();
      setTimeout(()=>{_doc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),1000);},300);
    } catch(e) { console.error("Casting PDF export error:", e); }
  };
  logoImg.onerror = () => { console.error("Failed to load logo for casting PDF"); };
  logoImg.src = "/onna-default-logo.png";
};

// ─── DOC HTML BUILDERS ──────────────────────────────────────────────────────
export const buildDocHTML = (text) => {
  if (!text) return "<p>No content generated.</p>";
  const lines=text.split("\n"); let html=""; let i=0;
  while (i<lines.length) {
    const line=lines[i].trim();
    if (line.includes("|")&&lines[i+1]&&lines[i+1].replace(/[-|:\s]/g,"")==="") {
      const hdrs=line.split("|").map(c=>c.trim()).filter(Boolean); const rows=[]; i+=2;
      while(i<lines.length&&lines[i].includes("|")){rows.push(lines[i].trim().split("|").map(c=>c.trim()).filter(Boolean));i++;}
      html+=`<table><thead><tr>${hdrs.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      continue;
    }
    if(line&&((line===line.toUpperCase()&&line.length>3&&!line.includes("|"))||/^\d+\./.test(line))) html+=`<div class="sec">${line}</div>`;
    else if(line.startsWith("•")||line.startsWith("-")) html+=`<div class="bul">${line}</div>`;
    else if(line) html+=`<p>${line}</p>`;
    i++;
  }
  return html;
};

export const buildContractHTML = (text) => {
  if (!text) return "<p>No contract generated.</p>";
  let html="";
  text.split("\n").forEach(line=>{
    const t=line.trim(); if(!t){html+="<br>";return;}
    if(t===t.toUpperCase()&&t.length>4&&!t.includes("(")) html+=`<div class="sec">${t}</div>`;
    else if(t.startsWith("•")||t.startsWith("-")) html+=`<div class="bul">${t}</div>`;
    else html+=`<p>${t}</p>`;
  });
  return `<div>${html}</div><div class="sigs"><div><div class="sig">Signed for and on behalf of ONNA</div><div class="sig2">Print Name &amp; Date</div></div><div><div class="sig">Signed by Commissionee / Supplier</div><div class="sig2">Print Name &amp; Date</div></div></div>`;
};

// ─── DATE HELPERS ──────────────────────────────────────────────────────────────
export const _parseDate = (str) => {
  if (!str) return null;
  const clean = str.replace(/(\d+)(st|nd|rd|th)\b/i, "$1");
  const withYear = /\d{4}/.test(clean) ? clean : `${clean} 2026`;
  const d = new Date(withYear);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDate = (str) => {
  if (!str) return "";
  const d = _parseDate(str);
  if (!d) return str;
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(2)}`;
};

export const getMonthLabel = (str) => {
  if (!str) return "";
  const d = _parseDate(str);
  if (!d) return "";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// ─── VAULT CRYPTO (AES-256-GCM + PBKDF2) ─────────────────────────────────────
export const VAULT_SALT  = "onna-vault-salt-2026";
export const VAULT_CHECK = "onna-vault-verified";
export const vaultDeriveKey = async (pass) => {
  const enc = new TextEncoder();
  const mat = await crypto.subtle.importKey("raw",enc.encode(pass),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt:enc.encode(VAULT_SALT),iterations:100000,hash:"SHA-256"},mat,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
};
export const vaultEncrypt = async (key, data) => {
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const ct  = await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(typeof data==="string"?data:JSON.stringify(data)));
  const out = new Uint8Array(12+ct.byteLength); out.set(iv); out.set(new Uint8Array(ct),12);
  return btoa(String.fromCharCode(...out));
};
export const vaultDecrypt = async (key, blob) => {
  const bytes = Uint8Array.from(atob(blob),c=>c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes.slice(0,12)},key,bytes.slice(12));
  const text  = new TextDecoder().decode(plain);
  try { return JSON.parse(text); } catch { return text; }
};

// ─── DEFAULT ESTIMATE SECTIONS ──────────────────────────────────────────────
export const defaultSections = () => [
  { id:1, num:"1", title:"PHOTOGRAPY FEES", rows:[
    {ref:"1A",desc:"PHOTOGRAPHER DAY RATE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"1B",desc:"PHOTOGRAPHER RECCE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"1C",desc:"USAGE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"1D",desc:"1ST ASSISTANT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"1E",desc:"2ND ASSISTANT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"1F",desc:"DIGI TECH",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"1G",desc:"OVERTIME",notes:"OT OVER 10 HR @ 1.5 x BHR",days:"0",qty:"0",rate:"0"},
  ]},
  { id:2, num:"2", title:"PHOTOGRAPHY EQUIPMENT", rows:[
    {ref:"2A",desc:"CAMERA EQUIPMENT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"2B",desc:"LIGHTING EQUIPMENT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"2C",desc:"FILM",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"2D",desc:"FILM PROCESSING",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"2E",desc:"STORAGE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"2F",desc:"COURIERS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"2G",desc:"EQUIPMENT TRANSPORTATION",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"2H",desc:"EQUIPMENT CARNET",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"2I",desc:"EQUIPMENT SHIPPING",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"2J",desc:"CUSTOMS PAPERWORK",notes:"",days:"0",qty:"0",rate:"0"},
  ]},
  { id:3, num:"3", title:"STILLS POST PRODUCTION", rows:[
    {ref:"3A",desc:"RETOUCH",notes:"",days:"0",qty:"0",rate:"0"},
  ]},
  { id:4, num:"4", title:"VIDEO CREW", rows:[
    {ref:"4A",desc:"DIRECTOR",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4B",desc:"DOP",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4C",desc:"1ST AD",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4D",desc:"1ST AC",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4E",desc:"2ND AC",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4F",desc:"STEADICAM OPERATOR",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4G",desc:"GAFFER",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4H",desc:"SPARK",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4I",desc:"DIT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4J",desc:"VTO",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4K",desc:"KEY GRIP",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4L",desc:"BEST BOY GRIP",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4M",desc:"SOUND ENGINEER",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4N",desc:"DRONE OPERATOR",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"4O",desc:"OVERTIME",notes:"OT OVER 10 HR @ 1.5 x BHR",days:"0",qty:"0",rate:"0"},
  ]},
  { id:5, num:"5", title:"VIDEO EQUIPMENT", rows:[
    {ref:"5A",desc:"MOTION CAMERA PACKAGE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"5B",desc:"GRIP & LIGHTING",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"5C",desc:"FILM",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"5D",desc:"FILM PROCESSING",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"5E",desc:"STORAGE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"5F",desc:"EQUIPMENT TRANSPORTATION",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"5G",desc:"EQUIPMENT CARNET",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"5H",desc:"EQUIPMENT SHIPPING",notes:"",days:"0",qty:"0",rate:"0"},
  ]},
  { id:6, num:"6", title:"VIDEO POST-PRODUCTION", rows:[
    {ref:"6A",desc:"EDIT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"6B",desc:"GRADE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"6C",desc:"SOUND DESIGN",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"6D",desc:"LIBRARY MUSIC",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"6E",desc:"STOCK FOOTAGE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"6F",desc:"VFX",notes:"",days:"0",qty:"0",rate:"0"},
  ]},
  { id:7, num:"7", title:"STYLING", rows:[
    {ref:"7A",desc:"STYLIST - SHOOT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7B",desc:"STYLIST - PREP",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7C",desc:"1ST ASSISTANT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7D",desc:"1ST ASSISTANT - PREP",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7E",desc:"WARDROBE ALLOWANCE ADULTS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7F",desc:"WARDROBE ALLOWANCE CHILDS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7G",desc:"STYLING EQUIPMENT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7H",desc:"SEAMSTRESS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7I",desc:"FITTING BACKGROUND",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7J",desc:"SELPHY PRINTER",notes:"ON REQUEST ONLY",days:"0",qty:"0",rate:"0"},
    {ref:"7K",desc:"SELPHY PRINTER CONSUMABLES",notes:"ON REQUEST ONLY",days:"0",qty:"0",rate:"0"},
    {ref:"7L",desc:"COLLECTION TRANSPORTATION",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7M",desc:"STYLIST TRAVEL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7N",desc:"ASSISTANT TRAVEL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"7O",desc:"OVERTIME",notes:"OT OVER 10 HR @ 1.5 x BHR",days:"0",qty:"0",rate:"0"},
  ]},
  { id:8, num:"8", title:"HAIR & MAKEUP", rows:[
    {ref:"8A",desc:"HMUA",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"8B",desc:"HMUA TRAVEL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"8C",desc:"MUA ASSISTANT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"8D",desc:"MUA ASSISTANT TRAVEL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"8E",desc:"MANICURIST",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"8F",desc:"HMU SET UP & EQ",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"8G",desc:"OVERTIME",notes:"OT OVER 10 HR @ 1.5 x BHR",days:"0",qty:"0",rate:"0"},
  ]},
  { id:9, num:"9", title:"TALENT", rows:[
    {ref:"9A",desc:"CASTING DIRECTOR",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"9B",desc:"STUDIO RENTAL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"9C",desc:"ADULT MODELS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"9D",desc:"CHILD MODELS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"9E",desc:"FIT MODELS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"9F",desc:"ADULT TRAVEL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"9G",desc:"CHILD TRAVEL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"9H",desc:"USAGE BUYOUT - ADULT",notes:"ON REQUEST",days:"0",qty:"0",rate:"0"},
    {ref:"9I",desc:"USAGE BUYOUT - CHILD",notes:"ON REQUEST",days:"0",qty:"0",rate:"0"},
    {ref:"9J",desc:"MODEL TRAVEL EXPENSES",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"9K",desc:"OVERTIME",notes:"OT OVER 10 HR @ 1.5 x BHR",days:"0",qty:"0",rate:"0"},
  ]},
  { id:10, num:"10", title:"PROPS & SET", rows:[
    {ref:"10A",desc:"SET DESIGNER - SHOOT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10B",desc:"SET DESIGNER - PREP",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10C",desc:"PROP MASTER - SHOOT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10D",desc:"PROP MASTER - PREP",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10E",desc:"ART ASSISTANT - SHOOT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10F",desc:"ART ASSISTANT - PREP",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10G",desc:"ON SET HELPER - SHOOT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10H",desc:"PROPS BUDGET",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10I",desc:"EXPERIENTIAL PROPS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10J",desc:"BACKDROPS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10K",desc:"TRUCK RENTAL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10L",desc:"PROPS CLEARANCE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"10M",desc:"OVERTIME",notes:"OT OVER 10 HR @ 1.5 x BHR",days:"0",qty:"0",rate:"0"},
  ]},
  { id:11, num:"11", title:"PRODUCTION", rows:[
    {ref:"11A",desc:"PRODUCER",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"11B",desc:"PRODUCER PREP",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"11C",desc:"PRODUCTION MANAGER",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"11D",desc:"PRODUCTION COORDINATOR",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"11E",desc:"RUNNER",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"11F",desc:"FIXER",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"11G",desc:"SET MEDIC",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"11H",desc:"SECURITY",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"11J",desc:"OVERTIME",notes:"OT OVER 10 HR @ 1.5 x BHR",days:"0",qty:"0",rate:"0"},
  ]},
  { id:12, num:"12", title:"PRODUCTION EXPENSES", rows:[
    {ref:"12A",desc:"PRODUCTION KIT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"12B",desc:"PREPROD EXPENSES",notes:"",days:"0",qty:"0",rate:"0"},
  ]},
  { id:13, num:"13", title:"CATERING", rows:[
    {ref:"13A",desc:"CATERING - SHOOT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"13B",desc:"CATERING - RECCE/FITTING",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"13C",desc:"CATERING - TRAVEL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"13D",desc:"CRAFT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"13E",desc:"COFFEES/REFRESHMENTS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"13F",desc:"DINNERS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"13G",desc:"TALENT RIDER",notes:"",days:"0",qty:"0",rate:"0"},
  ]},
  { id:14, num:"14", title:"VEHICLES", rows:[
    {ref:"14A",desc:"VEHICLE RENTAL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"14B",desc:"TAXI ALLOWANCE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"14C",desc:"PARKING, TOLL & FUEL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"14D",desc:"OVERTIME",notes:"",days:"0",qty:"0",rate:"0"},
  ]},
  { id:15, num:"15", title:"LOCATIONS", rows:[
    {ref:"15A",desc:"STUDIO HIRE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"15B",desc:"COVE PAINTING",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"15C",desc:"LOCATION HIRE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"15D",desc:"LOCATION MANAGER - SHOOT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"15E",desc:"LOCATION MANAGER - SCOUT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"15F",desc:"LOCATION ASSISTANT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"15G",desc:"LOCATION EXPENSES",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"15H",desc:"BASE CAMP",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"15I",desc:"UNIT GEAR",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"15J",desc:"WIFI RENTAL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"15K",desc:"OVERTIME",notes:"OT OVER 10 HR @ 1.5 x BHR",days:"0",qty:"0",rate:"0"},
  ]},
  { id:16, num:"16", title:"PERMITS", rows:[
    {ref:"16A",desc:"DFTC PERMIT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"16B",desc:"DRONE PERMIT",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"16C",desc:"CAR/DRIVING PERMITS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"16D",desc:"OPEN SEA PERMIT",notes:"",days:"0",qty:"0",rate:"0"},
  ]},
  { id:17, num:"17", title:"TRAVEL", rows:[
    {ref:"17A",desc:"AIRPORT TRANSFERS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"17B",desc:"FLIGHTS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"17C",desc:"FLIGHTS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"17D",desc:"HOTEL",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"17E",desc:"EXCESS BAGGAGE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"17F",desc:"VISAS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"17G",desc:"TRAVEL AGENT FEE",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"17H",desc:"PER DIEMS",notes:"",days:"0",qty:"0",rate:"0"},
    {ref:"17I",desc:"FLIGHT CONTINGENCY",notes:"",days:"0",qty:"0",rate:"0"},
  ]},
  { id:18, num:"18", title:"PRODUCTION FEES", isFees:true, rows:[
    {ref:"18A",desc:"INSURANCE",notes:"3%",days:"0",qty:"0",rate:"0"},
    {ref:"18B",desc:"GENERAL FEES & BANK CHARGES",notes:"1%",days:"0",qty:"0",rate:"0"},
    {ref:"18D",desc:"PRODUCTION FEE",notes:"10%",days:"0",qty:"0",rate:"0"},
  ]},
];

// ─── Doc updater utility ────────────────────────────────────────────────────
export function makeDocUpdater(projectId, vIdx, setStore, initTemplate, initLabel) {
  const getArr = (store) => store[projectId] || [{id:Date.now(),label:initLabel,...JSON.parse(JSON.stringify(initTemplate))}];
  const update = (path, val) => {
    setStore(prev => {
      const store = JSON.parse(JSON.stringify(prev));
      const arr = getArr(store);
      const idx = Math.min(vIdx, arr.length - 1);
      const d = arr[idx];
      const k = path.split("."); let o = d;
      for (let i = 0; i < k.length - 1; i++) o = o[k[i]];
      o[k[k.length - 1]] = val;
      arr[idx] = d; store[projectId] = arr; return store;
    });
  };
  const set = (fn) => {
    setStore(prev => {
      const store = JSON.parse(JSON.stringify(prev));
      const arr = getArr(store);
      const idx = Math.min(vIdx, arr.length - 1);
      arr[idx] = fn(JSON.parse(JSON.stringify(arr[idx])));
      store[projectId] = arr; return store;
    });
  };
  return { update, set };
}

// ─── Extra contacts helpers ─────────────────────────────────────────────────
export const getXContacts = (type, id) => { try { return JSON.parse(localStorage.getItem(`onna_xc_${type}_${id}`) || '[]'); } catch { return []; } };
export const setXContacts = (type, id, arr) => { try { localStorage.setItem(`onna_xc_${type}_${id}`, JSON.stringify(arr)); } catch {} };
