import React from "react";

// ─── BILLIE (ESTIMATE) UTILITY FUNCTIONS ────────────────────────────────────

// ─── BILLIE (ESTIMATE) HELPERS ───────────────────────────────────────────────
function buildBillieSystem(project, estData, versionLabel, estSnapshot, baseCurrency = "AED", secondCurrency = "USD") {
  return `You are Budget Billie, ONNA's production budget assistant. ONNA is a film, TV and commercial production company based in Dubai and London. You are DIRECTLY CONNECTED to the live estimate database.

CRITICAL: You ALREADY HAVE the full estimate data below. NEVER ask the user to paste, share, or provide estimate details — you can see everything. Just act on their request immediately.

You are viewing: "${project.name}" — ${versionLabel}
Base currency: ${baseCurrency} | Secondary currency: ${secondCurrency}

CURRENT ESTIMATE STATE:
${estSnapshot}

REGIONAL MARKET AWARENESS:
- When populating rates, use market-appropriate rates for the shoot location (check the SHOOT LOCATION field above).
- Dubai/UAE: Use AED rates — crew day rates typically AED 500–8,000 depending on role.
- London/UK: Use GBP rates — crew day rates typically £250–£2,500 depending on role.
- Europe/EU: Use EUR rates — crew day rates typically €300–€3,000 depending on role and country. Southern Europe (Spain, Italy, Greece) ~20% lower than Northern/Western Europe (France, Germany, Netherlands).
- Saudi Arabia/KSA: Use SAR rates — generally 5–15% higher than Dubai equivalents.
- US: Use USD rates — vary significantly by city (LA/NYC premium vs other markets).
- If the shoot location isn't clear, default to Dubai rates in AED.
- Always enter rates in the BASE CURRENCY (${baseCurrency}) shown above. The system auto-converts to ${secondCurrency}.

INSTRUCTIONS:
- When the user asks to ADD, UPDATE, or CHANGE rows, header fields, or notes, output a SINGLE JSON patch inside a \`\`\`json code block. Only ONE json block per response.
- For top sheet fields: {"ts": {"client":"...","date":"...","project":"...","photographer":"...","deliverables":"...","deadlines":"...","usage":"...","shootDate":"...","location":"...","payment":"..."}}
- PREFER updating existing rows by ref — the template already has most standard line items (photographer, DOP, gaffer, models, lighting, catering, etc). Match your items to existing refs: {"rows": {"1A": {"rate":"5000","days":"2","qty":"1"}, "4B": {"rate":"3000","days":"1","qty":"1"}}}
- You can update MANY rows at once in a single "rows" object. When populating a budget, set days, qty, and rate on every relevant existing ref.
- To add NEW rows that don't exist in the template: {"addRows": [{"section":4, "desc":"NEW ITEM", "days":"1", "qty":"1", "rate":"2000"}, {"section":11, "desc":"ANOTHER ITEM", "days":"1", "qty":"1", "rate":"1500"}]}
- To add a single new row: {"addRow": {"section":4, "desc":"NEW ITEM", "days":"1", "qty":"1", "rate":"2000"}}
- You can combine "rows" and "addRows" in the same patch to update existing AND add new rows simultaneously.
- To remove a row: {"removeRow": "4P"}
- For notes: {"notes": "..."}
- To save as a NEW version (e.g. "save as V2"): {"saveAsVersion": "PRODUCTION ESTIMATE V2"}. This duplicates the current estimate into a new version tab WITHOUT overwriting the original. Always use this when the user says "save as V2", "create V2", "duplicate as V3", etc. NEVER overwrite an existing version — always create a new one.
- Only output JSON for write intents. For read-only questions answer in plain text with NO JSON block.
- Each row has: ref (e.g. "1A"), desc, notes, days, qty, rate. Total = days × qty × rate. All values MUST be strings.
- Section 18 (Production Fees) rows with a % in notes auto-calculate from subtotal.
- When discussing totals, show the base currency (${baseCurrency}). The UI automatically shows the secondary currency (${secondCurrency}) conversion.
- Be warm, concise and professional.
- NEVER say you don't have access to data, can't see the estimate, or need the user to share information. You have FULL access.
- When images are attached (PDF pages, briefs, moodboards), ANALYZE them for budget-relevant info: crew roles, equipment, locations, shoot days, talent, deliverables, post-production. Extract into a JSON patch.
- From a brief: look for project scope, deliverables, shoot dates, locations, crew, talent, equipment, post-production, explicit budget figures.
- From a moodboard: infer production requirements from visual style — studio vs location, lighting complexity, special effects, props, wardrobe scale.

RESPONSE STYLE:
- Use bullet points for lists and summaries
- Keep responses short and scannable — no walls of text
- Lead with the action taken or answer, then details
- Use bold (text) for key names, fields, and labels
- Tone: warm, confident, professional — never robotic
- When confirming changes, summarise what was updated in a quick bullet list`;
}

function applyBilliePatch(patch, projectId, versionIdx, currentVersions, setProjectEstimates) {
  const versions = JSON.parse(JSON.stringify(currentVersions));
  const ver = versions[versionIdx];
  const sections = ver.sections || defaultSections();

  // Merge top sheet fields
  if (patch.ts) {
    ver.ts = { ...(ver.ts || {}), ...patch.ts };
  }

  // Merge notes into ts.notes
  if (patch.notes !== undefined) {
    if (!ver.ts) ver.ts = {};
    ver.ts.notes = patch.notes;
  }

  // Update rows by ref
  if (patch.rows) {
    Object.entries(patch.rows).forEach(([ref, updates]) => {
      for (const sec of sections) {
        const row = sec.rows.find(r => r.ref === ref);
        if (row) { Object.assign(row, updates); break; }
      }
    });
    ver.sections = sections;
  }

  // Add row(s) to section — supports single addRow or addRows array
  const rowsToAdd = patch.addRows ? patch.addRows : patch.addRow ? [patch.addRow] : [];
  for (const entry of rowsToAdd) {
    const { section: secNum, ...rowData } = entry;
    const sec = sections.find(s => s.id === secNum || s.num === String(secNum));
    if (sec) {
      const nextRef = sec.num + String.fromCharCode(65 + sec.rows.length);
      sec.rows.push({ ref: nextRef, desc: "", notes: "", days: "0", qty: "0", rate: "0", ...rowData });
      ver.sections = sections;
    }
  }

  // Remove row by ref
  if (patch.removeRow) {
    for (const sec of sections) {
      const idx = sec.rows.findIndex(r => r.ref === patch.removeRow);
      if (idx >= 0 && sec.rows.length > 1) { sec.rows.splice(idx, 1); break; }
    }
    ver.sections = sections;
  }

  // Merge SA fields
  if (patch.saFields) {
    ver.saFields = { ...(ver.saFields || {}), ...patch.saFields };
  }

  // Replace T&Cs text
  if (patch.tcsText !== undefined) {
    ver.tcsText = patch.tcsText;
  }

  // Save as new version — duplicate current version with a new label, do NOT overwrite
  if (patch.saveAsVersion) {
    const newVer = JSON.parse(JSON.stringify(ver));
    newVer.id = Date.now();
    newVer.ts = { ...(newVer.ts || {}), version: patch.saveAsVersion };
    // Apply any other patch fields to the NEW version (not the original)
    versions[versionIdx] = JSON.parse(JSON.stringify(currentVersions[versionIdx])); // restore original
    versions.push(newVer);
    setProjectEstimates(prev => ({ ...prev, [projectId]: versions }));
    return versions.length - 1; // return new version index
  }

  versions[versionIdx] = ver;
  setProjectEstimates(prev => ({ ...prev, [projectId]: versions }));
  return versionIdx;
}

export { buildBillieSystem, applyBilliePatch };

export function BillieTabBar({
  agent, billieTabs, setBillieTabs, billieCtx, setBillieCtx,
  projectEstimates, setProjectEstimates, onArchiveCallSheet,
  localProjects, setMsgs, projectInfoRef, addBillieTab,
  setActiveEstimateVersion, ESTIMATE_INIT,
}) {
  if (agent.id !== "billie" || billieTabs.length === 0) return null;

  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#fafafa",borderBottom:"1px solid #e5e5ea",overflowX:"auto",whiteSpace:"nowrap",flexShrink:0}}>
      {billieTabs.map((tab,i)=>{
        const isActive=billieCtx&&billieCtx.projectId===tab.projectId&&billieCtx.vIdx===tab.vIdx;
        const _bEstVs=projectEstimates?.[tab.projectId]||[];
        const _bEstV=_bEstVs[tab.vIdx];
        const _bProj=localProjects?.find(p=>p.id===tab.projectId);
        const _bDynLabel=_bProj?`${_bProj.name} \u00b7 ${_bEstV?.ts?.version||`V${tab.vIdx+1}`}`:tab.label;
        return(
          <div key={`${tab.projectId}-${tab.vIdx}`} onClick={()=>{if(!isActive){setBillieCtx({projectId:tab.projectId,vIdx:tab.vIdx});if(setActiveEstimateVersion)setActiveEstimateVersion(tab.vIdx);setMsgs(prev=>[...prev,{role:"assistant",content:`Switched to ${_bDynLabel}.`}]);}}} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer",border:isActive?"1px solid #7ab87a":"1px solid #e0e0e0",background:isActive?"#f3fff3":"#f5f5f7",color:isActive?"#1a5a1a":"#6e6e73",borderBottom:isActive?"2px solid #7ab87a":"2px solid transparent",transition:"all 0.15s",flexShrink:0}}>
            <span>{_bDynLabel}</span>
            <span onClick={e=>{e.stopPropagation();if(!confirm("Delete this estimate? It will be moved to trash."))return;const pid=tab.projectId;const vIdx=tab.vIdx;const estData=(projectEstimates?.[pid]||[])[vIdx];if(estData&&onArchiveCallSheet)onArchiveCallSheet('estimates',{projectId:pid,estimate:JSON.parse(JSON.stringify(estData))});setProjectEstimates(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[pid]||[];arr.splice(vIdx,1);store[pid]=arr;return store;});setBillieTabs(prev=>{const next=prev.filter((_,j)=>j!==i).map(t=>t.projectId===pid&&t.vIdx>vIdx?{...t,vIdx:t.vIdx-1}:t);if(isActive){if(next.length>0){const switchTo=next[0];setBillieCtx({projectId:switchTo.projectId,vIdx:switchTo.vIdx});if(setActiveEstimateVersion)setActiveEstimateVersion(switchTo.vIdx);setMsgs(p=>[...p,{role:"assistant",content:`Deleted and switched to ${switchTo.label}.`}]);}else{setBillieCtx(null);setMsgs(p=>[...p,{role:"assistant",content:"Estimate deleted. Pick a project to start a new one!"}]);}}return next;});}} style={{marginLeft:2,cursor:"pointer",opacity:0.5,fontSize:11,lineHeight:1}}>\u00d7</span>
          </div>
        ); })}
      <div onClick={()=>{const _pid=billieCtx?.projectId||billieTabs[billieTabs.length-1]?.projectId;if(_pid){const proj=localProjects?.find(p=>p.id===_pid);if(proj){const ne={...JSON.parse(JSON.stringify(ESTIMATE_INIT)),id:Date.now()};const _pi5=(projectInfoRef.current||{})[proj.id];ne.ts={...ne.ts,version:"[Untitled]",client:proj.client||"",project:_pi5?.shootName||proj.name||""};setProjectEstimates(prev=>({...prev,[proj.id]:[...(prev[proj.id]||[]),ne]}));const newIdx=(projectEstimates?.[proj.id]||[]).length;setBillieCtx({projectId:proj.id,vIdx:newIdx});if(setActiveEstimateVersion)setActiveEstimateVersion(newIdx);addBillieTab(proj.id,newIdx,`${proj.name} \u00b7 [Untitled]`);setMsgs(prev=>[...prev,{role:"assistant",content:`Created a new estimate for ${proj.name}. What would you like to do?`}]);}}}} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:8,border:"1.5px dashed #ccc",background:"transparent",fontSize:14,color:"#999",cursor:"pointer",flexShrink:0,fontFamily:"inherit"}}>+</div>
    </div>
  );
}
