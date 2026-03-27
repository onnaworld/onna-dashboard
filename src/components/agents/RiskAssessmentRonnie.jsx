import React from "react";
import { stripThinking } from "../../utils/helpers";

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

/**
 * handleRonnieIntent - handles Risk Assessment Ronnie intent detection in sendMessage.
 * Returns true if the intent was handled (caller should return), false otherwise.
 */
export async function handleRonnieIntent({
  input, history, intro, agent,
  setMsgs, setInput, setLoading, setMood,
  ronnieCtx, setRonnieCtx,
  ronniePendingReview, setRonniePendingReview,
  ronnieTabs, setRonnieTabs, addRonnieTab,
  setActiveRAVersion,
  riskAssessmentStore, setRiskAssessmentStore,
  localProjects, curAttachments,
  fuzzyMatchProject, printRiskAssessmentPDF, syncProjectInfoToDocs,
  popAgentUndo, projectInfoRef, onNavigateToDoc,
  RISK_ASSESSMENT_INIT, PRINT_CLEANUP_CSS,
  buildRonnieSystem, applyRonniePatch, buildPatchMarkers,
}) {
  if (agent.id !== "researcher") return false;
  if (!riskAssessmentStore || !setRiskAssessmentStore) return false;

    // ── Ronnie: live risk assessment handler ──

      // ── Step 0: No context — ask for project ──
      if(!ronnieCtx){
        if(!localProjects?.length){
          setMsgs([...history,{role:"assistant",content:"No projects found. Create a project first, then come back to me!"}]);
          setLoading(false);setMood("idle");return true;
        }

        // Export intent without context — find the right RA and export
        if(/\b(export|pdf|download|print|save)\b/i.test(input)){
          let expProj=null;let expIdx=-1;
          for(const p of localProjects){
            const rav=riskAssessmentStore?.[p.id]||[];
            if(rav.length>0){expProj=p;expIdx=rav.length===1?0:rav.length-1;break;}
          }
          if(expProj){
            const rav=riskAssessmentStore[expProj.id];
            const raData=rav[expIdx];
            setRonnieCtx({projectId:expProj.id,vIdx:expIdx});
            if(setActiveRAVersion)setActiveRAVersion(expIdx);
            addRonnieTab(expProj.id,expIdx,`${expProj.name} · ${raData.label||"Untitled"}`);
            printRiskAssessmentPDF(raData);
            setMsgs([...history,{role:"assistant",content:"Opening the print dialog for the risk assessment now — save it as PDF from there!"}]);
            setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
          }
          setMsgs([...history,{role:"assistant",content:"No risk assessments found to export. Pick a project first and I'll create one!"}]);
          setLoading(false);setMood("idle");return true;
        }

        const lower=input.toLowerCase();
        const num=parseInt(input.trim(),10);
        let project=null;
        if(num>=1&&num<=localProjects.length) project=localProjects[num-1];
        else project=fuzzyMatchProject(localProjects,input);
        if(!project){
          const list=localProjects.map((p,i)=>`${i+1}. ${p.name}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`Which project's risk assessment should I work on?\n\n${list}\n\nPick a number or name.`}]);
          setLoading(false);setMood("idle");return true;
        }
        const raLabels=riskAssessmentStore?.[project.id]||[];
        if(raLabels.length===0){
          const newRA={id:Date.now(),label:"[Untitled]",...JSON.parse(JSON.stringify(RISK_ASSESSMENT_INIT))};
          newRA.shootName=`${project.client||""} | ${project.name}`.replace(/^TEMPLATE \| /,"");
          const _pi3=(projectInfoRef.current||{})[project.id];
          if(_pi3){if(_pi3.shootName)newRA.shootName=_pi3.shootName;if(_pi3.shootDate)newRA.shootDate=_pi3.shootDate;if(_pi3.shootLocation)newRA.locations=_pi3.shootLocation;if(_pi3.crewOnSet)newRA.crewOnSet=_pi3.crewOnSet;}
          const _raLogo=new Image();_raLogo.crossOrigin="anonymous";_raLogo.onload=()=>{try{const cv=document.createElement("canvas");cv.width=_raLogo.naturalWidth;cv.height=_raLogo.naturalHeight;cv.getContext("2d").drawImage(_raLogo,0,0);newRA.productionLogo=cv.toDataURL("image/png");}catch{}finally{setRiskAssessmentStore(prev=>({...prev,[project.id]:[newRA]}));}};_raLogo.onerror=()=>{setRiskAssessmentStore(prev=>({...prev,[project.id]:[newRA]}));};_raLogo.src="/onna-default-logo.png";
          setRonnieCtx({projectId:project.id,vIdx:0});
          if(setActiveRAVersion)setActiveRAVersion(0);
          addRonnieTab(project.id,0,`${project.name} · [Untitled]`);
          setMsgs([...history,{role:"assistant",content:`Created a new risk assessment for ${project.name}. What would you like to do?`}]);
          setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
        }
        raLabels.forEach((v,i)=>{addRonnieTab(project.id,i,`${project.name} · ${v.label||`RA ${i+1}`}`);});
        // Backfill default logo for any RA missing it
        const _missingLogo=raLabels.some(v=>!v.productionLogo);
        if(_missingLogo){const _bl=new Image();_bl.crossOrigin="anonymous";_bl.onload=()=>{try{const cv=document.createElement("canvas");cv.width=_bl.naturalWidth;cv.height=_bl.naturalHeight;cv.getContext("2d").drawImage(_bl,0,0);const du=cv.toDataURL("image/png");setRiskAssessmentStore(prev=>{const s=JSON.parse(JSON.stringify(prev));const arr=s[project.id]||[];arr.forEach(r=>{if(!r.productionLogo)r.productionLogo=du;});return s;});}catch{}};_bl.src="/onna-default-logo.png";}
        const lastIdx=raLabels.length-1;
        setRonnieCtx({projectId:project.id,vIdx:lastIdx});
        if(setActiveRAVersion)setActiveRAVersion(lastIdx);
        setMsgs([...history,{role:"assistant",content:`Opened ${raLabels.length} risk assessment${raLabels.length>1?"s":""} for ${project.name}. What would you like to do?`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      // Clean up any stale _step state
      if(ronnieCtx._step){setRonnieCtx(null);setLoading(false);setMood("idle");return true;}

      // ── Ready state: editing ──
      let {projectId,vIdx}=ronnieCtx;
      let project=localProjects?.find(p=>p.id===projectId);
      if(!project){setRonnieCtx(null);setMsgs([...history,{role:"assistant",content:"That project no longer exists. Let's start over — which project?"}]);setLoading(false);setMood("idle");return true;}

      // Close command — close doc panel without clearing chat
      if(/^\s*(close|exit|done|bye|finish)\s*$/i.test(input)){
        setRonnieCtx(null);
        setMsgs([...history,{role:"assistant",content:"Closed! Let me know when you need me again."}]);
        setLoading(false);setMood("idle");return true;
      }
      // Undo command
      if(/^\s*(undo|undo that|go back|revert|command z)\s*$/i.test(input)){
        if(popAgentUndo()){setMsgs([...history,{role:"assistant",content:"Done — reverted the last change. You can undo up to 50 changes, or press ⌘Z."}]);}
        else{setMsgs([...history,{role:"assistant",content:"Nothing to undo — the undo history is empty."}]);}
        setLoading(false);setMood("idle");return true;
      }

      // Rename via chat
      {const _rm=input.match(/\b(?:rename|call it|name it|title it)\s+(?:to\s+)?["']?(.+?)["']?\s*$/i);
      if(_rm&&_rm[1]){const newLabel=_rm[1].trim();const raVersions_rn=riskAssessmentStore?.[projectId]||[];const rIdx=Math.min(vIdx,raVersions_rn.length-1);if(rIdx>=0&&raVersions_rn[rIdx]){setRiskAssessmentStore(prev=>{const s=JSON.parse(JSON.stringify(prev));s[projectId][rIdx].label=newLabel;return s;});setRonnieTabs(prev=>prev.map(t=>t.projectId===projectId&&t.vIdx===rIdx?{...t,label:`${project.name} · ${newLabel}`}:t));setMsgs([...history,{role:"assistant",content:`✓ Renamed to "${newLabel}".`}]);setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;}}}

      // Navigate to risk assessment list view
      if(onNavigateToDoc&&(/\b(show|list|see|view|open|manage|go\s*to)\b.*\b(risk\s*assess)\b/i.test(input)||/\b(risk\s*assess)\b.*\b(show|list|see|view|open|manage|go\s*to)\b/i.test(input))){
        onNavigateToDoc(project,"Documents","risk");
        setMsgs([...history,{role:"assistant",content:"Taking you to your risk assessments now!"}]);setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      // Handle "yes, export" confirmation
      const lastMsg_ex = history[history.length-2];
      if(lastMsg_ex&&lastMsg_ex._pendingExport&&/\b(yes|go ahead|proceed|export|confirm|sure)\b/i.test(input)){
        const _ryEl=document.getElementById("onna-ra-print");
        if(_ryEl){const _ryC=_ryEl.cloneNode(true);_ryC.querySelectorAll("button").forEach(b=>b.remove());_ryC.querySelectorAll("input[type=file]").forEach(b=>b.remove());const _ryF=document.createElement("iframe");_ryF.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(_ryF);const _ryD=_ryF.contentDocument;_ryD.open();_ryD.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${(lastMsg_ex._pendingExport.raData?.label||"V1")} Risk Assessment | ${project?.name||""}</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;padding:10mm 12mm;}@media print{@page{margin:0;size:A4;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);_ryD.close();_ryD.body.appendChild(_ryD.adoptNode(_ryC));const _ryOT=document.title;document.title=`${(lastMsg_ex._pendingExport.raData?.label||"V1")} Risk Assessment | ${project?.name||""}`;window.addEventListener("afterprint",function _ryAP(){document.title=_ryOT;window.removeEventListener("afterprint",_ryAP);});setTimeout(()=>{_ryF.contentWindow.focus();_ryF.contentWindow.print();setTimeout(()=>document.body.removeChild(_ryF),1000);},300);}
        else{printRiskAssessmentPDF(lastMsg_ex._pendingExport.raData);}
        setMsgs([...history,{role:"assistant",content:`Opening the print dialog for the risk assessment — save it as PDF from there!`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }
      // Export / PDF intent — uses exact same DOM clone as BtnExport
      if(/\b(export|pdf|download|print|save)\b/i.test(input)){
        // Check for missing fields first
        const raVersions_ex=riskAssessmentStore?.[project.id]||[];
        const vIdx_ex=Math.min(vIdx,raVersions_ex.length-1);
        const ver_ex=raVersions_ex[vIdx_ex];
        if(!ver_ex){setMsgs([...history,{role:"assistant",content:"No risk assessment found to export. Create one first!"}]);setLoading(false);setMood("idle");return true;}
        const _missing=[];
        if(!ver_ex.shootName) _missing.push("Shoot Name");
        if(!ver_ex.shootDate) _missing.push("Shoot Date");
        if(!ver_ex.locations) _missing.push("Locations");
        if(!ver_ex.crewOnSet) _missing.push("Crew on Set");
        if(!ver_ex.timing) _missing.push("Timing");
        if(!(ver_ex.sections||[]).length) _missing.push("Risk Sections (none added)");
        (ver_ex.sections||[]).forEach(s=>{const emptyRows=s.rows.filter(r=>!r[0]&&!r[1]&&!r[2]&&!r[3]);if(emptyRows.length) _missing.push(`Empty rows in "${s.title}" (${emptyRows.length})`);s.rows.forEach((r,ri)=>{if(r[0]&&!r[3]) _missing.push(`Missing mitigation for "${r[0]}" in "${s.title}" (row ${ri+1})`);});});
        if(!(ver_ex.conductItems||[]).length) _missing.push("Code of Conduct items");
        if(!(ver_ex.waiverItems||[]).length) _missing.push("Liability Waiver items");
        if(!(ver_ex.emergencyItems||[]).length) _missing.push("Emergency Response items");
        if(_missing.length>0){
          const warnMsg=`Before exporting, I noticed the following fields are missing or incomplete:\n\n${_missing.map(m=>`- ${m}`).join("\n")}\n\nAre you sure you want to export as-is? Type **"yes, export"** to proceed, or let me know what you'd like to fill in first.`;
          setMsgs([...history,{role:"assistant",content:warnMsg,_pendingExport:{raData:ver_ex,label:ver_ex.label||"risk assessment"}}]);
          setLoading(false);setMood("thinking");setTimeout(()=>setMood("idle"),2500);return true;
        }
        const _raEl=document.getElementById("onna-ra-print");
        if(_raEl){
          const _raC=_raEl.cloneNode(true);_raC.querySelectorAll("button").forEach(b=>b.remove());_raC.querySelectorAll("input[type=file]").forEach(b=>b.remove());
          const _raF=document.createElement("iframe");_raF.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(_raF);
          const _raD=_raF.contentDocument;_raD.open();_raD.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${(ver_ex.label||"V1")} Risk Assessment | ${project?.name||""}</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;padding:10mm 12mm;}@media print{@page{margin:0;size:A4;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);_raD.close();
          const _raOT=document.title;document.title=`${(ver_ex.label||"V1")} Risk Assessment | ${project?.name||""}`;window.addEventListener("afterprint",function _raAP(){document.title=_raOT;window.removeEventListener("afterprint",_raAP);});_raD.body.appendChild(_raD.adoptNode(_raC));setTimeout(()=>{_raD.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(x=>x.remove());_raF.contentWindow.focus();_raF.contentWindow.print();setTimeout(()=>document.body.removeChild(_raF),1000);},300);
          setMsgs([...history,{role:"assistant",content:"Opening the print dialog for the risk assessment now — save it as PDF from there!"}]);
        }else{
          const ver_ex=(riskAssessmentStore?.[project.id]||[])[Math.min(vIdx,(riskAssessmentStore?.[project.id]||[]).length-1)];
          if(!ver_ex){setMsgs([...history,{role:"assistant",content:"No risk assessment found to export. Create one first!"}]);setLoading(false);setMood("idle");return true;}
          printRiskAssessmentPDF(ver_ex);
          setMsgs([...history,{role:"assistant",content:"Opening the print dialog for the risk assessment now — save it as PDF from there!"}]);
        }
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      const lower=input.toLowerCase();
      const switchProject=fuzzyMatchProject(localProjects,input,projectId);
      if(switchProject){
        const raLabels=riskAssessmentStore?.[switchProject.id]||[];
        if(raLabels.length===0){
          const newRA={id:Date.now(),label:"[Untitled]",...JSON.parse(JSON.stringify(RISK_ASSESSMENT_INIT))};
          newRA.shootName=`${switchProject.client||""} | ${switchProject.name}`.replace(/^TEMPLATE \| /,"");
          const _pi3s=(projectInfoRef.current||{})[switchProject.id];
          if(_pi3s){if(_pi3s.shootName)newRA.shootName=_pi3s.shootName;if(_pi3s.shootDate)newRA.shootDate=_pi3s.shootDate;if(_pi3s.shootLocation)newRA.locations=_pi3s.shootLocation;if(_pi3s.crewOnSet)newRA.crewOnSet=_pi3s.crewOnSet;}
          const _raLogo2=new Image();_raLogo2.crossOrigin="anonymous";_raLogo2.onload=()=>{try{const cv=document.createElement("canvas");cv.width=_raLogo2.naturalWidth;cv.height=_raLogo2.naturalHeight;cv.getContext("2d").drawImage(_raLogo2,0,0);newRA.productionLogo=cv.toDataURL("image/png");}catch{}finally{setRiskAssessmentStore(prev=>({...prev,[switchProject.id]:[newRA]}));}};_raLogo2.onerror=()=>{setRiskAssessmentStore(prev=>({...prev,[switchProject.id]:[newRA]}));};_raLogo2.src="/onna-default-logo.png";
          setRonnieCtx({projectId:switchProject.id,vIdx:0});
          if(setActiveRAVersion)setActiveRAVersion(0);
          addRonnieTab(switchProject.id,0,`${switchProject.name} · [Untitled]`);
          setMsgs([...history,{role:"assistant",content:`Created a new risk assessment for ${switchProject.name}. What would you like to do?`}]);
        }else{
          raLabels.forEach((v,i)=>{addRonnieTab(switchProject.id,i,`${switchProject.name} · ${v.label||`RA ${i+1}`}`);});
          const _missingLogo2=raLabels.some(v=>!v.productionLogo);
          if(_missingLogo2){const _bl2=new Image();_bl2.crossOrigin="anonymous";_bl2.onload=()=>{try{const cv=document.createElement("canvas");cv.width=_bl2.naturalWidth;cv.height=_bl2.naturalHeight;cv.getContext("2d").drawImage(_bl2,0,0);const du=cv.toDataURL("image/png");setRiskAssessmentStore(prev=>{const s=JSON.parse(JSON.stringify(prev));const arr=s[switchProject.id]||[];arr.forEach(r=>{if(!r.productionLogo)r.productionLogo=du;});return s;});}catch{}};_bl2.src="/onna-default-logo.png";}
          const lastIdx=raLabels.length-1;
          setRonnieCtx({projectId:switchProject.id,vIdx:lastIdx});
          if(setActiveRAVersion)setActiveRAVersion(lastIdx);
          setMsgs([...history,{role:"assistant",content:`Switched to ${switchProject.name} — opened ${raLabels.length} risk assessment${raLabels.length>1?"s":""}. What would you like to do?`}]);
        }
        setLoading(false);setMood("idle");return true;
      }

      if(/\b(switch|change|different)\s+project\b/i.test(input)){
        setRonnieCtx(null);
        const list=localProjects.map((p,i)=>`${i+1}. ${p.name}`).join("\n");
        setMsgs([...history,{role:"assistant",content:`Sure! Which project's risk assessment should I work on?\n\n${list}`}]);
        setLoading(false);setMood("idle");return true;
      }

      // "create new risk assessment" / "new version" / "create new" for current project
      if(/\b(create|new|add)\b/i.test(lower)&&/\b(risk\s*assess|ra|assessment|version)\b/i.test(lower) || /\bcreate\s+new\b/i.test(lower)){
        setRonnieCtx({projectId,_step:"create_label"});
        setMsgs([...history,{role:"assistant",content:"What should I call this new risk assessment? (e.g. Shoot Day, Recce Day, Pre-Production)"}]);
        setLoading(false);setMood("idle");return true;
      }

      // Logo intent
      const logoMatch=input.match(/\b(agency|client|production)\s*(logo|image|jpeg|jpg|png|pic|photo|branding)\b/i);
      if(logoMatch&&curAttachments&&curAttachments.length>0){
        const logoType=logoMatch[1].toLowerCase();
        const logoKey=logoType==="agency"?"agencyLogo":logoType==="client"?"clientLogo":"productionLogo";
        const imgData=curAttachments[0].dataUrl;
        const raVersions_l=riskAssessmentStore?.[project.id]||[];
        const vIdx_l=Math.min(vIdx,raVersions_l.length-1);
        setRiskAssessmentStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[project.id]||[];arr[vIdx_l][logoKey]=imgData;store[project.id]=arr;return store;});
        setMsgs([...history,{role:"assistant",content:`\u2713 ${logoType.charAt(0).toUpperCase()+logoType.slice(1)} logo updated on the risk assessment!`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }


      const raVersions = riskAssessmentStore?.[project.id] || [];
      vIdx = Math.min(vIdx, raVersions.length-1);
      const ver = raVersions[vIdx];
      const vLabel = ver.label || "Risk Assessment";

      // Build risk assessment snapshot
      let snap = `Label: ${ver.label||"(empty)"} | Shoot: ${ver.shootName||"(empty)"} | Date: ${ver.shootDate||"(empty)"} | Locations: ${ver.locations||"(empty)"} | Crew: ${ver.crewOnSet||"(empty)"} | Timing: ${ver.timing||"(empty)"}\n`;
      if(ver.sections?.length) snap += "Risk Sections:\n" + ver.sections.map((s,si)=>`  ${si+1}. ${s.title}:\n` + s.rows.map((r,ri)=>`    [row ${ri}] ${r[0]||"?"} | Level: ${r[1]||"?"} | At Risk: ${r[2]||"?"} | Mitigation: ${r[3]||"(empty)"}`).join("\n")).join("\n") + "\n";
      if(ver.conductItems?.length) snap += "Code of Conduct:\n" + ver.conductItems.map((c,ci)=>`  [item ${ci}] ${c.label} ${c.text}`).join("\n") + "\n";
      if(ver.waiverItems?.length) snap += "Liability Waiver:\n" + ver.waiverItems.map((w,wi)=>`  [item ${wi}] ${w.label} ${w.text}`).join("\n") + "\n";
      if(ver.emergencyItems?.length) snap += "Emergency Plan:\n" + ver.emergencyItems.map((e,ei)=>`  [item ${ei}] ${e.label} ${e.text}`).join("\n") + "\n";

      const ronnieSystem = buildRonnieSystem(project, ver, vLabel, snap);

      setMsgs(history);setInput("");setLoading(true);setMood("thinking");
      try{
        const ronnieIntro = intro;
        const apiMessages=history.map((m,mi)=>{
          if(m.role==="assistant"){
            if(mi===0) return{role:m.role,content:ronnieIntro};
            return{role:m.role,content:typeof m.content==="string"?m.content:""};
          }
          if(m._attachments&&m._attachments.length){
            const blocks=[];
            m._attachments.forEach(att=>{const b64=att.dataUrl.split(",")[1];const mt=att.type||"image/jpeg";blocks.push({type:"image",source:{type:"base64",media_type:mt,data:b64}});});
            const txt=(m.content||"").replace(/\s*\[\d+ images?\]\s*$/,"").trim();
            if(txt)blocks.push({type:"text",text:txt});
            return{role:"user",content:blocks};
          }
          return{role:m.role,content:m.content};
        });
        const res=await fetch(`/api/agents/${agent.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:ronnieSystem,messages:apiMessages})});
        if(!res.ok){const e=await res.json().catch(()=>({error:`HTTP ${res.status}`}));setMsgs(p=>[...p,{role:"assistant",content:`Error: ${e.error||"Unknown"}`}]);setLoading(false);setMood("idle");return true;}
        const reader=res.body.getReader();const decoder=new TextDecoder();let fullText="";let buffer="";
        while(true){const{done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.startsWith("data: "))continue;const raw=line.slice(6).trim();if(!raw||raw==="[DONE]")continue;try{const ev=JSON.parse(raw);if(ev.type==="content_block_delta"&&ev.delta?.type==="text_delta"){fullText+=ev.delta.text;setMsgs([...history,{role:"assistant",content:stripThinking(fullText)}]);}}catch{}}}
        fullText=stripThinking(fullText);

        const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
        if(jsonMatch){
          try{
            const patch = JSON.parse(jsonMatch[1].trim());
            const cleanText = fullText.replace(/```json[\s\S]*?```/g,"").trim();
            // Save pre-snapshot, apply patch, set up inline review markers
            // Use the ORIGINAL pre-snapshot if there's already a pending review (preserves revert baseline)
            const existingReview = ronniePendingReview && ronniePendingReview.projectId===project.id && ronniePendingReview.vIdx===vIdx ? ronniePendingReview : null;
            const preSnapshot = existingReview ? existingReview.preSnapshot : JSON.parse(JSON.stringify(ver));
            const newMarkers = buildPatchMarkers(patch, ver);
            applyRonniePatch(patch, project.id, vIdx, raVersions, setRiskAssessmentStore);
            setTimeout(()=>syncProjectInfoToDocs(project.id),100);
            if(newMarkers.size > 0){
              // Merge with any existing unresolved markers
              const mergedMarkers = existingReview ? [...new Set([...existingReview.markers, ...newMarkers])] : [...newMarkers];
              setRonniePendingReview({ preSnapshot, markers: mergedMarkers, projectId: project.id, vIdx });
              setMsgs([...history,{role:"assistant",content:(cleanText||"Changes applied.")+"\n\nReview the highlighted changes on the left — ✓ to keep, ✕ to revert."}]);
            } else if (existingReview && existingReview.markers.length > 0) {
              // No new markers but existing review still has unresolved markers — keep it
              setMsgs([...history,{role:"assistant",content:(cleanText||"Done.")+"\n\nYou still have pending changes to review on the left."}]);
            } else {
              // No markers at all — just confirm
              setMsgs([...history,{role:"assistant",content:(cleanText?cleanText+"\n\n":"")+"\u2713 Risk assessment updated."}]);
            }
          }catch(pe){
            setMsgs([...history,{role:"assistant",content:fullText+"\n\n\u26a0\ufe0f Could not parse patch: "+pe.message}]);
          }
        }else{
          // Post-response export fallback: if the LLM mentioned exporting, trigger print
          if(/\b(export|print|pdf)\b/i.test(fullText)&&/🖨️|📄|print dialog/i.test(fullText)){
            const _rrEl=document.getElementById("onna-ra-print");
            if(_rrEl){const _rrC=_rrEl.cloneNode(true);_rrC.querySelectorAll("button").forEach(b=>b.remove());_rrC.querySelectorAll("input[type=file]").forEach(b=>b.remove());const _rrF=document.createElement("iframe");_rrF.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(_rrF);const _rrD=_rrF.contentDocument;_rrD.open();_rrD.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${(ver.label||"V1")} Risk Assessment | ${project?.name||""}</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;padding:10mm 12mm;}@media print{@page{margin:0;size:A4;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);_rrD.close();_rrD.body.appendChild(_rrD.adoptNode(_rrC));const _rrOT=document.title;document.title=`${(ver.label||"V1")} Risk Assessment | ${project?.name||""}`;window.addEventListener("afterprint",function _rrAP(){document.title=_rrOT;window.removeEventListener("afterprint",_rrAP);});setTimeout(()=>{_rrF.contentWindow.focus();_rrF.contentWindow.print();setTimeout(()=>document.body.removeChild(_rrF),1000);},300);}
          }
          setMsgs([...history,{role:"assistant",content:fullText||"Hmm, something went wrong!"}]);
        }
        setMood("excited");setTimeout(()=>setMood("idle"),2500);
      }catch(err){setMsgs(p=>[...p,{role:"assistant",content:`Oops! ${err.message}`}]);setMood("idle");}
      setLoading(false);return true;

  return false;
}

