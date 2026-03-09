import React from "react";

// ─── RONNIE (RISK ASSESSMENT) UTILITY FUNCTIONS ─────────────────────────────

function buildRonnieSystem(project, raData, versionLabel, raSnapshot) {
  return `You are Risk Assessment Ronnie, a serious safety and compliance officer for ONNA, a film/TV production company in Dubai. You are DIRECTLY CONNECTED to the live risk assessment database.

CRITICAL: You ALREADY HAVE the full risk assessment data below. NEVER ask the user to paste, share, or provide risk assessment details — you can see everything. Just act on their request immediately.

You are viewing the risk assessment for: "${project.name}"

CURRENT RISK ASSESSMENT STATE:
${raSnapshot}

INSTRUCTIONS:
- When the user asks to ADD or UPDATE risks, sections, header fields, conduct items, waiver items, or emergency items, output a JSON patch inside a \`\`\`json code block.
- For scalar fields: {"label":"...","shootName":"...","shootDate":"...","locations":"...","crewOnSet":"...","timing":"..."} — use "label" to rename the risk assessment
- For conductIntro/waiverIntro: {"conductIntro":"...","waiverIntro":"..."}
- For sections (merge by title, case-insensitive):
  - ADD rows: {"sections":[{"title":"SECTION TITLE","rows":[["Hazard","Level","Who","Mitigation"]]}]} — rows are APPENDED.
  - EDIT rows by 0-based index: {"sections":[{"title":"SECTION TITLE","updateRows":[{"index":0,"row":["Updated Hazard","High","Crew","Updated Mitigation"]}]}]}
  - DELETE rows by 0-based index: {"sections":[{"title":"SECTION TITLE","deleteRows":[0,2]}]}
  - REPLACE ALL rows: {"sections":[{"title":"SECTION TITLE","replaceAllRows":[["H","L","W","M"],...]}]}
  - DELETE entire section: {"sections":[{"title":"SECTION TITLE","deleteSection":true}]}
  - ADD new section: include a new title with "rows".
  - Row indices are 0-based. Refer to CURRENT RISK ASSESSMENT STATE above to count row positions.
- For conductItems/waiverItems/emergencyItems (replace array): {"conductItems":[{"label":"...","text":"..."},...],"waiverItems":[...],"emergencyItems":[...]}
- Only output JSON for write intents. For read-only questions (e.g. "what risks are missing?", "review the assessment"), answer in plain text with NO JSON block.
- When asked "what's missing?" or "review", scan all sections and identify gaps, missing risk levels, empty mitigations, etc.
- Cross-reference project details with UAE and international safety laws (Media Regulatory Authority, Dubai Film Permit, DDA, DTCM).
- NEVER say you don't have access to data. You have FULL access.
- Be thorough, formal, and professional. Structure advice clearly.

RESPONSE STYLE:
- Use bullet points for lists and summaries
- Keep responses short and scannable — no walls of text
- Lead with the action taken or answer, then details
- Use bold (text) for key names, fields, and labels
- Tone: warm, confident, professional — never robotic
- When confirming changes, summarise what was updated in a quick bullet list
- EXPORT / PDF: If the user asks to export, download, print, save as PDF, or generate a document — simply reply "Exporting now..." and the platform will handle it automatically. Do NOT say you can't export. The export is triggered automatically by the platform when it detects export-related keywords in the user's message.`;
}

function applyRonniePatch(patch, projectId, versionIdx, _currentVersions, setRiskAssessmentStore) {
  setRiskAssessmentStore(prev => {
    const store = JSON.parse(JSON.stringify(prev));
    const versions = store[projectId] || JSON.parse(JSON.stringify(_currentVersions));
    const ver = versions[versionIdx];
    if (!ver) return store;

    // Merge scalar fields
    const scalars = ["label","shootName","shootDate","locations","crewOnSet","timing","conductIntro","waiverIntro"];
    scalars.forEach(k => { if (patch[k] !== undefined) ver[k] = patch[k]; });

    // Replace array fields wholesale
    if (patch.conductItems) ver.conductItems = patch.conductItems;
    if (patch.waiverItems) ver.waiverItems = patch.waiverItems;
    if (patch.emergencyItems) ver.emergencyItems = patch.emergencyItems;

    // Merge sections by title (case-insensitive)
    if (patch.sections && Array.isArray(patch.sections)) {
      const existing = ver.sections ? ver.sections.map(s => ({ ...s, rows: s.rows.map(r => [...r]) })) : [];
      let nextId = existing.reduce((max, s) => Math.max(max, s.id || 0), 0) + 1;
      patch.sections.forEach(ps => {
        const sIdx = existing.findIndex(s => s.title.toUpperCase() === ps.title.toUpperCase());
        if (sIdx >= 0) {
          if (ps.deleteSection) { existing.splice(sIdx, 1); return; }
          if (ps.deleteRows && Array.isArray(ps.deleteRows)) {
            [...ps.deleteRows].sort((a,b)=>b-a).forEach(i=>{ if(i>=0&&i<existing[sIdx].rows.length) existing[sIdx].rows.splice(i,1); });
          }
          if (ps.updateRows && Array.isArray(ps.updateRows)) {
            ps.updateRows.forEach(u=>{ if(u.index>=0&&u.index<existing[sIdx].rows.length&&u.row) existing[sIdx].rows[u.index]=u.row; });
          }
          if (ps.rows) existing[sIdx].rows = [...existing[sIdx].rows, ...ps.rows];
          if (ps.replaceAllRows && Array.isArray(ps.replaceAllRows)) existing[sIdx].rows = ps.replaceAllRows;
          if (ps.cols) existing[sIdx].cols = ps.cols;
        } else {
          existing.push({ id: nextId++, title: ps.title, cols: ps.cols || ["Hazard","Risk Level","Who is at Risk","Mitigation Strategy"], rows: ps.rows || [] });
        }
      });
      ver.sections = existing;
    }

    versions[versionIdx] = ver;
    store[projectId] = versions;
    return store;
  });
}

// ─── RONNIE INLINE REVIEW HELPERS ────────────────────────────────────────────

function buildPatchMarkers(patch, preVer) {
  const markers = new Set();
  const scalars = ["label","shootName","shootDate","locations","crewOnSet","timing","conductIntro","waiverIntro"];
  scalars.forEach(k => { if (patch[k] !== undefined) markers.add("scalar:"+k); });
  // Per-item diffing for conduct/waiver/emergency arrays
  ["conductItems","waiverItems","emergencyItems"].forEach(k => {
    if (!patch[k] || !Array.isArray(patch[k])) return;
    const oldArr = (preVer && preVer[k]) || [];
    const newArr = patch[k];
    const maxLen = Math.max(oldArr.length, newArr.length);
    let foundAny = false;
    for (let i = 0; i < maxLen; i++) {
      if (i >= oldArr.length || i >= newArr.length) { markers.add("arrayItem:"+k+":"+i); foundAny=true; continue; }
      const o = oldArr[i], n = newArr[i];
      if ((o.label||"") !== (n.label||"") || (o.text||"") !== (n.text||"")) { markers.add("arrayItem:"+k+":"+i); foundAny=true; }
    }
    // Fallback: if Ronnie included this array but diff found nothing, mark all items for review
    if (!foundAny && newArr.length > 0) { for (let i = 0; i < newArr.length; i++) markers.add("arrayItem:"+k+":"+i); }
  });
  if (patch.sections && Array.isArray(patch.sections)) {
    const existing = (preVer && preVer.sections) || [];
    patch.sections.forEach(ps => {
      const sIdx = existing.findIndex(s => s.title.toUpperCase() === ps.title.toUpperCase());
      if (sIdx >= 0) {
        if (ps.deleteSection) { markers.add("deleteSection:"+ps.title.toUpperCase()); return; }
        if (ps.updateRows) ps.updateRows.forEach(u => markers.add("row:"+ps.title.toUpperCase()+":"+u.index));
        if (ps.rows) { const base = existing[sIdx].rows.length; ps.rows.forEach((_r,ri) => markers.add("row:"+ps.title.toUpperCase()+":"+(base+ri))); }
        if (ps.replaceAllRows) ps.replaceAllRows.forEach((_r,ri) => markers.add("row:"+ps.title.toUpperCase()+":"+ri));
        if (ps.deleteRows) ps.deleteRows.forEach(ri => markers.add("deleteRow:"+ps.title.toUpperCase()+":"+ri));
      } else {
        markers.add("newSection:"+ps.title.toUpperCase());
      }
    });
  }
  return markers;
}

function revertMarker(marker, preSnapshot, projectId, vIdx, setStore) {
  setStore(prev => {
    const store = JSON.parse(JSON.stringify(prev));
    const arr = store[projectId] || [];
    const ver = arr[vIdx]; if (!ver) return store;
    if (marker.startsWith("scalar:")) {
      const k = marker.slice(7); ver[k] = preSnapshot[k] !== undefined ? preSnapshot[k] : "";
    } else if (marker.startsWith("arrayItem:")) {
      const parts = marker.split(":"); const k = parts[1]; const idx = parseInt(parts[2],10);
      const oldArr = preSnapshot[k] ? JSON.parse(JSON.stringify(preSnapshot[k])) : [];
      if (!ver[k]) ver[k] = [];
      if (idx < oldArr.length) { ver[k][idx] = oldArr[idx]; } // revert to original
      else { ver[k].splice(idx, 1); } // was a new item, remove it
    } else if (marker.startsWith("array:")) {
      const k = marker.slice(6); ver[k] = preSnapshot[k] ? JSON.parse(JSON.stringify(preSnapshot[k])) : [];
    } else if (marker.startsWith("newSection:")) {
      const title = marker.slice(11); ver.sections = (ver.sections||[]).filter(s => s.title.toUpperCase() !== title);
    } else if (marker.startsWith("row:")) {
      const parts = marker.split(":"); const secTitle = parts[1]; const ri = parseInt(parts[2],10);
      const si = (ver.sections||[]).findIndex(s => s.title.toUpperCase() === secTitle);
      const preSi = (preSnapshot.sections||[]).findIndex(s => s.title.toUpperCase() === secTitle);
      if (si >= 0) {
        if (preSi >= 0 && ri < (preSnapshot.sections[preSi].rows||[]).length) {
          ver.sections[si].rows[ri] = JSON.parse(JSON.stringify(preSnapshot.sections[preSi].rows[ri]));
        } else { ver.sections[si].rows.splice(ri, 1); }
      }
    }
    arr[vIdx] = ver; store[projectId] = arr; return store;
  });
}

export { buildRonnieSystem, applyRonniePatch, buildPatchMarkers, revertMarker };

export function RonnieTabBar({
  agent, ronnieTabs, setRonnieTabs, ronnieCtx, setRonnieCtx,
  riskAssessmentStore, setRiskAssessmentStore, onArchiveCallSheet,
  raCreateMenuRonnie, setRaCreateMenuRonnie, raCreateBtnRef,
  localProjects, setMsgs, projectInfoRef, addRonnieTab,
  setActiveRAVersion, onOpenDuplicateRA, RISK_ASSESSMENT_INIT,
}) {
  if (agent.id !== "researcher" || ronnieTabs.length === 0) return null;

  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#fafafa",borderBottom:"1px solid #e5e5ea",overflowX:"auto",whiteSpace:"nowrap",flexShrink:0}}>
      {ronnieTabs.map((tab,i)=>{
        const isActive=ronnieCtx&&ronnieCtx.projectId===tab.projectId&&ronnieCtx.vIdx===tab.vIdx;
        return(
          <div key={`${tab.projectId}-${tab.vIdx}`} onClick={()=>{if(!isActive){setRonnieCtx({projectId:tab.projectId,vIdx:tab.vIdx});if(setActiveRAVersion)setActiveRAVersion(tab.vIdx);setMsgs(prev=>[...prev,{role:"assistant",content:`Switched to ${tab.label}.`}]);}}} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer",border:isActive?"1px solid #6a9eca":"1px solid #e0e0e0",background:isActive?"#f3f8ff":"#f5f5f7",color:isActive?"#1a4a80":"#6e6e73",borderBottom:isActive?"2px solid #6a9eca":"2px solid transparent",transition:"all 0.15s",flexShrink:0}}>
            <span>{tab.label}</span>
            <span onClick={e=>{e.stopPropagation();if(!confirm("Delete this risk assessment? It will be moved to trash."))return;const pid=tab.projectId;const vidx=tab.vIdx;const raData=(riskAssessmentStore?.[pid]||[])[vidx];if(raData&&onArchiveCallSheet)onArchiveCallSheet('riskAssessments',{projectId:pid,riskAssessment:JSON.parse(JSON.stringify(raData))});setRiskAssessmentStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[pid]||[];arr.splice(vidx,1);store[pid]=arr;return store;});setRonnieTabs(prev=>{const next=prev.filter((_,j)=>j!==i).map(t=>t.projectId===pid&&t.vIdx>vidx?{...t,vIdx:t.vIdx-1}:t);if(isActive){if(next.length>0){const switchTo=next[0];setRonnieCtx({projectId:switchTo.projectId,vIdx:switchTo.vIdx});if(setActiveRAVersion)setActiveRAVersion(switchTo.vIdx);setMsgs(p=>[...p,{role:"assistant",content:`Deleted and switched to ${switchTo.label}.`}]);}else{setRonnieCtx(null);setMsgs(p=>[...p,{role:"assistant",content:"Risk assessment deleted. Pick a project to start a new one!"}]);}}return next;});}} style={{marginLeft:2,cursor:"pointer",opacity:0.5,fontSize:11,lineHeight:1}}>\u00d7</span>
          </div>
        ); })}
      <div style={{flexShrink:0}}>
        <div ref={raCreateBtnRef} onClick={()=>setRaCreateMenuRonnie(prev=>!prev)} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:8,border:"1.5px dashed #ccc",background:"transparent",fontSize:14,color:"#999",cursor:"pointer",fontFamily:"inherit"}}>+</div>
        {raCreateMenuRonnie&&<div onClick={()=>setRaCreateMenuRonnie(false)} style={{position:"fixed",inset:0,zIndex:9998}} />}
        {raCreateMenuRonnie&&(()=>{const _r=raCreateBtnRef.current?.getBoundingClientRect();return(
          <div style={{position:"fixed",top:(_r?.bottom||0)+4,left:_r?.left||0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:200,overflow:"hidden"}}>
            <div onClick={()=>{setRaCreateMenuRonnie(false);const _pid=ronnieCtx?.projectId||ronnieTabs[ronnieTabs.length-1]?.projectId;if(_pid){const proj=localProjects?.find(p=>p.id===_pid);if(proj){const newRA={id:Date.now(),label:"[Untitled]",...JSON.parse(JSON.stringify(RISK_ASSESSMENT_INIT))};newRA.shootName=`${proj.client||""} | ${proj.name}`.replace(/^TEMPLATE \| /,"");const _pi3=(projectInfoRef.current||{})[proj.id];if(_pi3){if(_pi3.shootName)newRA.shootName=_pi3.shootName;if(_pi3.shootDate)newRA.shootDate=_pi3.shootDate;if(_pi3.shootLocation)newRA.locations=_pi3.shootLocation;}const _raL3=new Image();_raL3.crossOrigin="anonymous";_raL3.onload=()=>{try{const cv=document.createElement("canvas");cv.width=_raL3.naturalWidth;cv.height=_raL3.naturalHeight;cv.getContext("2d").drawImage(_raL3,0,0);newRA.productionLogo=cv.toDataURL("image/png");}catch{}finally{setRiskAssessmentStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[proj.id])store[proj.id]=[];store[proj.id].push(newRA);return store;});}};_raL3.onerror=()=>{setRiskAssessmentStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[proj.id])store[proj.id]=[];store[proj.id].push(newRA);return store;});};_raL3.src="/onna-default-logo.png";const newIdx=(riskAssessmentStore?.[proj.id]||[]).length;setRonnieCtx({projectId:proj.id,vIdx:newIdx});if(setActiveRAVersion)setActiveRAVersion(newIdx);addRonnieTab(proj.id,newIdx,`${proj.name} \u00b7 [Untitled]`);setMsgs(prev=>[...prev,{role:"assistant",content:`Created a new risk assessment for ${proj.name}. What would you like to do?`}]);}}}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Risk Assessment</div>
            <div onClick={()=>{setRaCreateMenuRonnie(false);if(onOpenDuplicateRA)onOpenDuplicateRA(ronnieCtx?.projectId||ronnieTabs[ronnieTabs.length-1]?.projectId);}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
          </div>);})()}
      </div>
    </div>
  );
}
