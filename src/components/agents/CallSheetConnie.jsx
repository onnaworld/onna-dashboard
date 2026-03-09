import React, { useRef, useState } from "react";

// ─── CONNIE (CALL SHEET) UTILITY FUNCTIONS ────────────────────────────────────

function buildConnieSystem(project, csData, versionLabel, csSnapshot, vendorSummary, leadsSummary) {
  return `You are Call Sheet Connie, a production coordinator for ONNA, a film/TV production company in Dubai. You are DIRECTLY CONNECTED to the live call sheet database.

CRITICAL: You ALREADY HAVE the full call sheet data below. NEVER ask the user to paste, share, or provide call sheet details — you can see everything. Just act on their request immediately.

TODAY'S DATE: ${new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} (Dubai/GST, UTC+4)\n\nYou are viewing: "${project.name}" — ${versionLabel}

CURRENT CALL SHEET STATE:
${csSnapshot}

VENDOR DATABASE (name|category|email|phone):
${vendorSummary || "(empty)"}

CLIENT & LEADS PIPELINE (company|contact|email|phone|role|category):
${leadsSummary || "(empty)"}

THE USER:
- The user is Emily Lucas, Senior Producer at ONNA. Phone: +971 585 608 616, Email: emily@onnaproduction.com
- If the user says "me", "I'm on set", "production on set is me", or similar, use Emily Lucas +971 585 608 616 as the value.

IMPORTANT FIELD MAPPING (ALWAYS INCLUDE THESE):
- Hospital info MUST go in "emergency":{"hospital":"..."} — ALWAYS fill this when you know the shoot location. Find the nearest hospital.
- Police station info MUST go in "emergency":{"police":"..."} — ALWAYS fill this when you know the location.
- Emergency numbers MUST go in "emergencyNumbers" array — ALWAYS include local emergency numbers for the country.
  Format: [{"number":"999","label":"POLICE"},{"number":"998","label":"AMBULANCE"},{"number":"997","label":"FIRE DEPARTMENT"}]
  CRITICAL: "number" MUST be SHORT DIAL CODES ONLY (e.g. 999, 998, 911, 112). NEVER put addresses, hospital names, or descriptions in emergencyNumbers fields.
- "emergency.hospital" is for FULL NAME, ADDRESS, PHONE NUMBER and OPENING HOURS of the nearest hospital (e.g. "American Hospital Nad Al Sheba Clinic, Avenue Mall - Nad Al Sheba, +971 800 24392, Open 24hrs")
- "emergency.police" is for FULL NAME, ADDRESS, PHONE NUMBER and OPENING HOURS of the nearest police station (e.g. "Nad Al Sheba Police Station, Road - Nad Al Sheba 1, +971 4 336 3535, Open 24hrs")
- NEVER add hospital or police as venue rows, schedule entries, or emergency numbers.
- "emergencyDialPrefix" must be set to "[COUNTRY] DIAL:" based on the shoot region (e.g. "UAE DIAL:", "UK DIAL:", "US DIAL:", "FRANCE DIAL:"). Always update this when the location changes.
- When filling in location info, ALWAYS include emergency.hospital, emergency.police, emergencyNumbers AND emergencyDialPrefix in your patch.
- In venueRows, after ACCESS always include a NOTES row with key shooting information for the location (e.g. daylight hours, local customs, permit requirements, temperature warnings, altitude, timezone). Example: {"label":"NOTES","value":"Only 11.5 hours of daylight. Outdoor permits required after 6pm. High UV index — ensure sun protection for crew."}

WEATHER & LOCATION:
- When the user provides a LOCATION (city, venue, address), generate a Google Maps link in the format https://www.google.com/maps/search/[URL-encoded address] and include it in the patch as "mapLink". The system will automatically fetch a map screenshot from the link.
- When the user asks about weather, or provides a date and location, use your knowledge to estimate realistic weather for that location and date. Output a JSON patch with:
  - "weatherSummary": short description like "Sunny, Clear Skies" or "Partly Cloudy, Hot & Humid"
  - "weatherHighC", "weatherHighF", "weatherLowC", "weatherLowF": temperature values as strings (e.g. "34", "93")
  - "weatherRealFeelHighC", "weatherRealFeelHighF", "weatherRealFeelLowC", "weatherRealFeelLowF": real feel temperatures
  - "weatherSunrise", "weatherSunset", "weatherBlueHour": times as strings (e.g. "06:12", "18:45", "18:50")
  - "weatherHourly": array of {time, tempC, tempF, condition} for each hour of the shoot window (based on schedule start/end times, or default 06:00-20:00). Example: [{"time":"06:00","tempC":"28","tempF":"82","condition":"Clear"},{"time":"07:00","tempC":"30","tempF":"86","condition":"Sunny"}]
- When the user says "get weather" or "add weather", look at the call sheet date and location/venue fields to determine the forecast. If date or location is missing, ask which is needed.
- Always provide BOTH Celsius and Fahrenheit values.

INSTRUCTIONS:
- When the user asks to ADD or UPDATE crew, schedule, venues, or any call sheet field, output a JSON patch inside a \`\`\`json code block.
- For scalar fields: {"shootName":"...","date":"..."}
- For departments/crew (merge by role, case-insensitive): {"departments":[{"name":"MOTION","crew":[{"role":"GAFFER","name":"Elie Kolko","mobile":"+971...","email":"elie@x.com"}]}]}
- CRITICAL CREW RULES:
  1. ALWAYS check the CURRENT CALL SHEET STATE above to find where a role already exists before adding crew.
  2. Use the EXACT role name as it appears in the call sheet (e.g. if it says "LOCAL PRODUCER", use "LOCAL PRODUCER", not "PRODUCER").
  3. If the user says a role name that doesn't EXACTLY match any existing role, ASK: "I see [existing role] in [department] — should I update that one, or add a new row?"
  4. Never add a duplicate when an existing role could be updated.
  5. When placing crew, put them in the CORRECT department (e.g. a Producer goes in PRODUCTION & LOCATION, not BRAND).
- For schedule: {"schedule":[{time,activity,notes},...]} (full array replacement)
- For venueRows: {"venueRows":[{label,value},...]} (full array replacement)
- Only output JSON for write intents. For read-only questions (e.g. "what's missing?", "show me the schedule"), answer in plain text with NO JSON block.
- When a name matches a vendor in the database above, auto-fill their email and phone, and mention: "I found [name] in the vendor database and filled in their details."
- ALSO search the CLIENT & LEADS PIPELINE above. If a client company or contact name matches a lead, use their details. For the CLIENT department, check the leads pipeline for the client company name.
- When asked "what's missing?" or similar, scan every department and crew slot and list which fields (name, mobile, email, callTime) are empty, grouped by department.
- NEVER say you don't have access to data, can't see the call sheet, or need the user to share information. You have FULL access.
- Be warm, concise and professional.

EXPORT / PDF:
- If the user asks to export, download, print, save as PDF, or generate the call sheet — say "Exporting now..." The platform will automatically trigger the PDF export.
- Do NOT output a JSON patch for export requests.

RESPONSE STYLE:
- Use bullet points for lists and summaries
- Keep responses short and scannable — no walls of text
- Lead with the action taken or answer, then details
- Use bold (text) for key names, fields, and labels
- Tone: warm, confident, professional — never robotic
- When confirming changes, summarise what was updated in a quick bullet list`;
}

function applyConniePatch(patch, projectId, versionIdx, currentVersions, setCallSheetStore) {
  const versions = [...currentVersions];
  const ver = { ...versions[versionIdx] };

  // Merge scalar fields
  const scalars = ["shootName","date","dayNumber","productionContacts","passportNote","emergencyDialPrefix","protocol","weatherSummary","weatherHighC","weatherHighF","weatherLowC","weatherLowF","weatherRealFeelHighC","weatherRealFeelHighF","weatherRealFeelLowC","weatherRealFeelLowF","weatherSunrise","weatherSunset","weatherBlueHour","mapLink","mapImage"];
  scalars.forEach(k => { if (patch[k] !== undefined) ver[k] = patch[k]; });
  if (patch.weatherHourly !== undefined) ver.weatherHourly = patch.weatherHourly;

  // Merge emergency object
  if (patch.emergency) ver.emergency = { ...(ver.emergency || {}), ...patch.emergency };
  if (patch.invoicing) ver.invoicing = { ...(ver.invoicing || {}), ...patch.invoicing };

  // Replace arrays wholesale
  if (patch.schedule) ver.schedule = patch.schedule;
  if (patch.venueRows) ver.venueRows = patch.venueRows;
  if (patch.emergencyNumbers) ver.emergencyNumbers = patch.emergencyNumbers;
  if (patch.extraMapImages) ver.extraMapImages = patch.extraMapImages;

  // Merge departments/crew by role (case-insensitive)
  if (patch.departments && Array.isArray(patch.departments)) {
    const existing = ver.departments ? ver.departments.map(d => ({ ...d, crew: d.crew.map(c => ({ ...c })) })) : [];
    patch.departments.forEach(pd => {
      const deptIdx = existing.findIndex(d => d.name.toUpperCase() === pd.name.toUpperCase());
      if (deptIdx >= 0) {
        const dept = existing[deptIdx];
        (pd.crew || []).forEach(pc => {
          const crewIdx = dept.crew.findIndex(c => c.role.toUpperCase() === pc.role.toUpperCase());
          if (crewIdx >= 0) {
            dept.crew[crewIdx] = { ...dept.crew[crewIdx], ...pc };
          } else {
            dept.crew.push(pc);
          }
        });
      } else {
        existing.push(pd);
      }
    });
    ver.departments = existing;
  }

  versions[versionIdx] = ver;
  setCallSheetStore(prev => ({ ...prev, [projectId]: versions }));

  // Auto-fetch map screenshot when Connie sets mapLink and no mapImage exists
  if (patch.mapLink && !ver.mapImage) {
    try {
      const link = patch.mapLink;
      let q = "";
      try { const u = new URL(link); q = u.pathname.replace("/maps/search/","").replace("/maps/place/","").split("/@")[0]; if (!q) q = u.searchParams.get("q") || ""; } catch {}
      if (!q) q = link.replace(/https?:\/\/[^/]+\//, "");
      q = decodeURIComponent(q).replace(/\+/g, " ");
      const coords = link.match(/@(-?[\d.]+),(-?[\d.]+)/);
      let mapApiUrl;
      if (coords) { mapApiUrl = `/api/map-image?lat=${coords[1]}&lon=${coords[2]}`; }
      else { mapApiUrl = `/api/map-image?q=${encodeURIComponent(q)}`; }
      fetch(mapApiUrl).then(r => { if(!r.ok) throw new Error("Map error"); return r.blob(); }).then(blob => {
        const reader = new FileReader();
        reader.onload = e => {
          setCallSheetStore(prev => {
            const vs = JSON.parse(JSON.stringify(prev[projectId] || []));
            if (vs[versionIdx]) vs[versionIdx].mapImage = e.target.result;
            return { ...prev, [projectId]: vs };
          });
        };
        reader.readAsDataURL(blob);
      }).catch(() => {});
    } catch {}
  }
}

function buildConniePatchMarkers(patch, preVer) {
  const markers = new Set();
  const scalars = ["shootName","date","dayNumber","productionContacts","passportNote","emergencyDialPrefix","protocol","weatherSummary","weatherHighC","weatherHighF","weatherLowC","weatherLowF","weatherRealFeelHighC","weatherRealFeelHighF","weatherRealFeelLowC","weatherRealFeelLowF","weatherSunrise","weatherSunset","weatherBlueHour","mapLink","mapImage"];
  scalars.forEach(k => { if (patch[k] !== undefined && patch[k] !== (preVer[k]||"")) markers.add("cs:scalar:"+k); });
  if (patch.weatherHourly !== undefined) markers.add("cs:weatherHourly");
  if (patch.emergency) { if(patch.emergency.hospital && patch.emergency.hospital!==(preVer.emergency?.hospital||"")) markers.add("cs:emergency.hospital"); if(patch.emergency.police && patch.emergency.police!==(preVer.emergency?.police||"")) markers.add("cs:emergency.police"); }
  if (patch.invoicing) Object.keys(patch.invoicing).forEach(k=>{ if(patch.invoicing[k]!==(preVer.invoicing?.[k]||"")) markers.add("cs:invoicing."+k); });
  if (patch.schedule && Array.isArray(patch.schedule)) { patch.schedule.forEach((_,i) => markers.add("cs:scheduleRow:"+i)); }
  if (patch.venueRows && Array.isArray(patch.venueRows)) { patch.venueRows.forEach((vr,i) => markers.add("cs:venueRow:"+vr.label.toUpperCase())); }
  if (patch.emergencyNumbers) { patch.emergencyNumbers.forEach((_,i)=>markers.add("cs:emergencyNum:"+i)); }
  if (patch.departments && Array.isArray(patch.departments)) {
    patch.departments.forEach(pd => {
      (pd.crew||[]).forEach(pc => {
        markers.add("cs:crew:"+pd.name.toUpperCase()+":"+pc.role.toUpperCase()); }); });
  }
  return markers;
}

function _applyRevert(ver, marker, preSnapshot) {
  if (marker.startsWith("cs:scalar:")) {
    const k = marker.slice(10); ver[k] = preSnapshot[k] !== undefined ? preSnapshot[k] : "";
  } else if (marker === "cs:weatherHourly") {
    ver.weatherHourly = preSnapshot.weatherHourly ? JSON.parse(JSON.stringify(preSnapshot.weatherHourly)) : [];
  } else if (marker.startsWith("cs:emergency.")) {
    const k = marker.slice(13); if(!ver.emergency) ver.emergency={}; ver.emergency[k] = preSnapshot.emergency?.[k] || "";
  } else if (marker.startsWith("cs:invoicing.")) {
    const k = marker.slice(13); if(!ver.invoicing) ver.invoicing={}; ver.invoicing[k] = preSnapshot.invoicing?.[k] || "";
  } else if (marker === "cs:schedule") {
    ver.schedule = preSnapshot.schedule ? JSON.parse(JSON.stringify(preSnapshot.schedule)) : [];
  } else if (marker.startsWith("cs:scheduleRow:")) {
    const ri = parseInt(marker.split(":")[2],10);
    if(!isNaN(ri)) {
      const preSchedule = preSnapshot.schedule ? JSON.parse(JSON.stringify(preSnapshot.schedule)) : [];
      if(ri < preSchedule.length && ri < (ver.schedule||[]).length) ver.schedule[ri] = preSchedule[ri];
      else if(ri >= preSchedule.length && ri < (ver.schedule||[]).length) ver.schedule.splice(ri,1);
    }
  } else if (marker === "cs:venueRows") {
    ver.venueRows = preSnapshot.venueRows ? JSON.parse(JSON.stringify(preSnapshot.venueRows)) : [];
  } else if (marker.startsWith("cs:venueRow:")) {
    const label = marker.slice(12);
    const preRow = (preSnapshot.venueRows||[]).find(r=>r.label.toUpperCase()===label);
    const curIdx = (ver.venueRows||[]).findIndex(r=>r.label.toUpperCase()===label);
    if(preRow && curIdx>=0) ver.venueRows[curIdx] = JSON.parse(JSON.stringify(preRow));
    else if(!preRow && curIdx>=0) ver.venueRows.splice(curIdx,1);
    else if(preRow && curIdx<0) { /* row was removed, restore it */ if(!ver.venueRows) ver.venueRows=[]; ver.venueRows.push(JSON.parse(JSON.stringify(preRow))); }
  } else if (marker === "cs:emergencyNumbers") {
    ver.emergencyNumbers = preSnapshot.emergencyNumbers ? JSON.parse(JSON.stringify(preSnapshot.emergencyNumbers)) : [];
  } else if (marker.startsWith("cs:emergencyNum:")) {
    const ri = parseInt(marker.split(":")[2],10);
    const preNums = preSnapshot.emergencyNumbers ? JSON.parse(JSON.stringify(preSnapshot.emergencyNumbers)) : [];
    if(ri < preNums.length && ri < (ver.emergencyNumbers||[]).length) ver.emergencyNumbers[ri] = preNums[ri];
    else if(ri >= preNums.length && ri < (ver.emergencyNumbers||[]).length) ver.emergencyNumbers.splice(ri,1);
  } else if (marker.startsWith("cs:crew:")) {
    const parts = marker.split(":"); const deptName = parts[2]; const roleName = parts[3];
    const preDept = (preSnapshot.departments||[]).find(d=>d.name.toUpperCase()===deptName);
    const curDept = (ver.departments||[]).find(d=>d.name.toUpperCase()===deptName);
    if (curDept && preDept) {
      const preCrewMember = preDept.crew.find(c=>c.role.toUpperCase()===roleName);
      const ci = curDept.crew.findIndex(c=>c.role.toUpperCase()===roleName);
      if (preCrewMember && ci>=0) curDept.crew[ci] = JSON.parse(JSON.stringify(preCrewMember));
      else if (!preCrewMember && ci>=0) curDept.crew.splice(ci,1);
    }
  }
}

function revertConnieMarker(marker, preSnapshot, projectId, vIdx, setStore) {
  revertConnieMarkers([marker], preSnapshot, projectId, vIdx, setStore);
}

function revertConnieMarkers(markers, preSnapshot, projectId, vIdx, setStore) {
  setStore(prev => {
    const store = JSON.parse(JSON.stringify(prev));
    const arr = store[projectId] || [];
    const ver = arr[vIdx]; if (!ver) return store;
    markers.forEach(m => _applyRevert(ver, m, preSnapshot));
    arr[vIdx] = ver;
    store[projectId] = arr;
    return store;
  });
}

export { buildConnieSystem, applyConniePatch, buildConniePatchMarkers, revertConnieMarker, revertConnieMarkers };

export function ConnieTabBar({
  agent, connieTabs, setConnieTabs, connieCtx, setConnieCtx,
  connieDietMode, setConnieDietMode,
  callSheetStore, setCallSheetStore, onArchiveCallSheet,
  csCreateMenuConnie, setCsCreateMenuConnie, csCreateBtnRef,
  localProjects, setMsgs, projectInfoRef, addConnieTab,
  onOpenDuplicateCS, CALLSHEET_INIT,
}) {
  if (agent.id !== "compliance") return null;

  return (<>
    {/* Connie mode toggle: Call Sheet / Dietary */}
    {(connieTabs.length > 0 || connieDietMode) && (
      <div style={{display:"flex",alignItems:"center",gap:0,padding:"0 12px",background:"#f0f0f2",borderBottom:"1px solid #e5e5ea",flexShrink:0}}>
        <button onClick={()=>{if(connieDietMode){const lastTab=connieTabs[connieTabs.length-1];if(lastTab){setConnieDietMode(null);setConnieCtx({projectId:lastTab.projectId,vIdx:lastTab.vIdx});}else{setConnieDietMode(null);}}}} style={{padding:"6px 14px",fontSize:11,fontWeight:!connieDietMode?700:500,color:!connieDietMode?"#7a1a30":"#86868b",background:"none",border:"none",borderBottom:!connieDietMode?"2px solid #c47090":"2px solid transparent",cursor:"pointer",fontFamily:"inherit"}}>Call Sheets</button>
        <button onClick={()=>{if(!connieDietMode){const pid=connieCtx?.projectId||connieTabs[connieTabs.length-1]?.projectId;if(pid){setConnieDietMode(pid);setConnieCtx(null);}}}} style={{padding:"6px 14px",fontSize:11,fontWeight:connieDietMode?700:500,color:connieDietMode?"#7a1a30":"#86868b",background:"none",border:"none",borderBottom:connieDietMode?"2px solid #c47090":"2px solid transparent",cursor:"pointer",fontFamily:"inherit"}}>Dietaries</button>
      </div>
    )}
    {/* Connie tab bar */}
    {connieTabs.length > 0 && !connieDietMode && (
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#fafafa",borderBottom:"1px solid #e5e5ea",overflowX:"auto",whiteSpace:"nowrap",flexShrink:0}}>
        {connieTabs.map((tab,i)=>{
          const isActive=connieCtx&&connieCtx.projectId===tab.projectId&&connieCtx.vIdx===tab.vIdx;
          return(
            <div key={`${tab.projectId}-${tab.vIdx}`} onClick={()=>{if(!isActive){setConnieCtx({projectId:tab.projectId,vIdx:tab.vIdx});setConnieDietMode(null);setMsgs(prev=>[...prev,{role:"assistant",content:`Switched to ${tab.label}.`}]);}}} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer",border:isActive?"1px solid #c47090":"1px solid #e0e0e0",background:isActive?"#fff5f7":"#f5f5f7",color:isActive?"#7a1a30":"#6e6e73",borderBottom:isActive?"2px solid #c47090":"2px solid transparent",transition:"all 0.15s",flexShrink:0}}>
              <span>{tab.label}</span>
              <span onClick={e=>{e.stopPropagation();if(!confirm("Delete this call sheet? It will be moved to trash."))return;const pid=tab.projectId;const vIdx=tab.vIdx;const csData=(callSheetStore?.[pid]||[])[vIdx];if(csData&&onArchiveCallSheet)onArchiveCallSheet('callSheets',{projectId:pid,callSheet:JSON.parse(JSON.stringify(csData))});setCallSheetStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[pid]||[];arr.splice(vIdx,1);store[pid]=arr;return store;});setConnieTabs(prev=>{const next=prev.filter((_,j)=>j!==i).map(t=>t.projectId===pid&&t.vIdx>vIdx?{...t,vIdx:t.vIdx-1}:t);if(isActive){if(next.length>0){const switchTo=next[0];setConnieCtx({projectId:switchTo.projectId,vIdx:switchTo.vIdx});setMsgs(p=>[...p,{role:"assistant",content:`Deleted and switched to ${switchTo.label}.`}]);}else{setConnieCtx(null);setMsgs(p=>[...p,{role:"assistant",content:"Call sheet deleted. Pick a project to start a new one!"}]);}}return next;});}} style={{marginLeft:2,cursor:"pointer",opacity:0.5,fontSize:11,lineHeight:1}}>\u00d7</span>
            </div>
          ); })}
        <div style={{flexShrink:0}}>
          <div ref={csCreateBtnRef} onClick={()=>setCsCreateMenuConnie(prev=>!prev)} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:8,border:"1.5px dashed #ccc",background:"transparent",fontSize:14,color:"#999",cursor:"pointer",fontFamily:"inherit"}}>+</div>
          {csCreateMenuConnie&&<div onClick={()=>setCsCreateMenuConnie(false)} style={{position:"fixed",inset:0,zIndex:9998}} />}
          {csCreateMenuConnie&&(()=>{const _r=csCreateBtnRef.current?.getBoundingClientRect();return(
            <div style={{position:"fixed",top:(_r?.bottom||0)+4,left:_r?.left||0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:180,overflow:"hidden"}}>
              <div onClick={()=>{setCsCreateMenuConnie(false);const _pid=connieCtx?.projectId||connieTabs[connieTabs.length-1]?.projectId;if(_pid){const proj=localProjects?.find(p=>p.id===_pid);if(proj){const newCS={id:Date.now(),label:"[Untitled]",...JSON.parse(JSON.stringify(CALLSHEET_INIT))};newCS.shootName=`${proj.client||""} | ${proj.name}`.replace(/^TEMPLATE \| /,"");const _pi1=(projectInfoRef.current||{})[proj.id];if(_pi1){if(_pi1.shootName)newCS.shootName=_pi1.shootName;if(_pi1.shootDate)newCS.date=_pi1.shootDate;}setCallSheetStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[proj.id])store[proj.id]=[];store[proj.id].push(newCS);return store;});const newIdx=(callSheetStore?.[proj.id]||[]).length;setConnieCtx({projectId:proj.id,vIdx:newIdx});setConnieDietMode(null);addConnieTab(proj.id,newIdx,`${proj.name} \u00b7 [Untitled]`);const _csLogo2=new Image();_csLogo2.crossOrigin="anonymous";_csLogo2.onload=()=>{try{const cv=document.createElement("canvas");cv.width=_csLogo2.naturalWidth;cv.height=_csLogo2.naturalHeight;cv.getContext("2d").drawImage(_csLogo2,0,0);const du=cv.toDataURL("image/png");setCallSheetStore(prev=>{const s=JSON.parse(JSON.stringify(prev));const arr=s[proj.id]||[];if(arr.length>0&&!arr[arr.length-1].productionLogo)arr[arr.length-1].productionLogo=du;return s;});}catch{}};_csLogo2.src="/onna-default-logo.png";setMsgs(prev=>[...prev,{role:"assistant",content:`Created a new call sheet for ${proj.name}. What would you like to do?`}]);}}}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ New Call Sheet</div>
              <div onClick={()=>{setCsCreateMenuConnie(false);if(onOpenDuplicateCS)onOpenDuplicateCS(connieCtx?.projectId||connieTabs[connieTabs.length-1]?.projectId);}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Duplicate Existing</div>
            </div>);})()}
        </div>
      </div>
    )}
  </>);
}

/**
 * handleConnieIntent - handles Call Sheet Connie intent detection in sendMessage.
 * Returns true if the intent was handled (caller should return), false otherwise.
 */
export async function handleConnieIntent({
  input, history, intro, agent,
  setMsgs, setInput, setLoading, setMood,
  connieCtx, setConnieCtx,
  conniePending, setConniePending,
  connieDietMode, setConnieDietMode,
  connieDietPending, setConnieDietPending,
  conniePendingReview, setConniePendingReview,
  connieTabs, addConnieTab, setConnieTabs,
  callSheetStore, setCallSheetStore,
  dietaryStore, setDietaryStore,
  localProjects,
  fuzzyMatchProject, printCallSheetPDF, syncProjectInfoToDocs,
  popAgentUndo, projectInfoRef,
  vendorsProp, allLeads,
  CALLSHEET_INIT, DIETARY_INIT, DIETARY_TAGS, PRINT_CLEANUP_CSS,
  buildConnieSystem, applyConniePatch, buildConniePatchMarkers,
  api,
}) {
  if (agent.id !== "compliance") return false;

    // ── Connie: live call sheet handler ──────────────────────────────────────────
      // Step 1: If no confirmed context yet, ask for project
      if(!connieCtx){
        if(!localProjects?.length){
          setMsgs([...history,{role:"assistant",content:"No projects found. Create a project first, then come back to me!"}]);
          setLoading(false);setMood("idle");return true;
        }

        // ── pending: pick project for dietary side view ──
        if(conniePending?.step==="pick_dietary_project"){
          const num=parseInt(input.trim(),10);
          let proj=null;
          if(num>=1&&num<=localProjects.length) proj=localProjects[num-1];
          else proj=fuzzyMatchProject(localProjects,input);
          if(proj){
            setConniePending(null);
            setConnieCtx(null);setConnieDietMode(proj.id);
            const dietCount=(dietaryStore?.[proj.id]||[]).length;
            setMsgs([...history,{role:"assistant",content:`Here are ${proj.name}'s dietary lists (${dietCount} total). You can create, view, or delete them from the panel.`}]);setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
          }
          const list=localProjects.map((p,i)=>`${i+1}. ${p.name}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`Which project's dietaries? Pick a number or name.\n\n${list}`}]);
          setLoading(false);setMood("idle");return true;
        }



        // Switch from dietary back to call sheets
        if(connieDietMode && (/\b(show|list|see|view|open|manage|go\s*to)\b.*\b(call\s*sheets?)\b/i.test(input) || /\b(call\s*sheets?)\b.*\b(show|list|see|view|open|manage|go\s*to)\b/i.test(input) || /^\s*call\s*sheets?\s*$/i.test(input))) {
          const lastTab = connieTabs[connieTabs.length-1];
          if(lastTab) {
            setConnieDietMode(null);
            setConnieCtx({projectId:lastTab.projectId, vIdx:lastTab.vIdx});
            setMsgs([...history,{role:"assistant",content:`Switched back to call sheets — ${lastTab.label}.`}]);
          } else {
            setConnieDietMode(null);
            setMsgs([...history,{role:"assistant",content:"Switched to call sheets. Which project's call sheet should I work on?"}]);
          }
          setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
        }

        // "Open dietaries" without context — show project picker
        if(/\b(show|list|see|view|open|manage|go\s*to)\b.*\bdietar(?:y|ies)\b/i.test(input)||/\bdietar(?:y|ies)\b.*\b(show|list|see|view|open|manage|go\s*to)\b/i.test(input)||/^\s*dietar(?:y|ies)\s*$/i.test(input)){
          setConniePending({step:"pick_dietary_project"});
          const list=localProjects.map((p,i)=>`${i+1}. ${p.name}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`Which dietaries would you like to work on?\n\n${list}`}]);setLoading(false);setMood("idle");return true;
        }

        // Export intent without context — find the right call sheet and export
        if(/\b(export|pdf|download|print|save)\b/i.test(input)){
          // Find the first project that has call sheet data
          let expProj=null;let expIdx=-1;
          for(const p of localProjects){
            const csv=callSheetStore?.[p.id]||[];
            if(csv.length>0){expProj=p;expIdx=csv.length===1?0:csv.length-1;break;}
          }
          if(expProj){
            const csv=callSheetStore[expProj.id];
            const csData=csv[expIdx];
            setConnieCtx({projectId:expProj.id,vIdx:expIdx});setConnieDietMode(null);
            addConnieTab(expProj.id,expIdx,`${expProj.name} · ${csData.label||"Day 1"}`);
            printCallSheetPDF(csData);
            setMsgs([...history,{role:"assistant",content:"Opening the print dialog for the call sheet now — save it as PDF from there!"}]);
            setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
          }
          setMsgs([...history,{role:"assistant",content:"No call sheets found to export. Pick a project first and I'll create one!"}]);
          setLoading(false);setMood("idle");return true;
        }

        // Try to match a project name in this message
        const lower=input.toLowerCase();
        const num=parseInt(input.trim(),10);
        let project=null;
        let _pickedByNumber=false;
        if(num>=1&&num<=localProjects.length){project=localProjects[num-1];_pickedByNumber=true;}
        else project=fuzzyMatchProject(localProjects,input);
        // If input is very short and matched fuzzily (not by number), confirm with the user
        if(project&&!_pickedByNumber&&input.trim().length<4){
          const list=localProjects.map((p,i)=>`${i+1}. ${p.name}${p.client?" ("+p.client+")":""}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`Which project should I work on?\n\n${list}\n\nPick a number or name.`}]);
          setLoading(false);setMood("idle");return true;
        }
        if(!project){
          const list=localProjects.map((p,i)=>`${i+1}. ${p.name}${p.client?" ("+p.client+")":""}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`Which project should I work on?\n\n${list}\n\nPick a number or name.`}]);
          setLoading(false);setMood("idle");return true;
        }
        // If user explicitly asked for dietaries, open dietary mode; otherwise default to call sheet (both visible in side panel)
        if(/\bdietar(?:y|ies)\b/i.test(input)){
          setConnieCtx(null);setConnieDietMode(project.id);
          const dietCount=(dietaryStore?.[project.id]||[]).length;
          setMsgs([...history,{role:"assistant",content:`Here are ${project.name}'s dietary lists (${dietCount} total). You can create, view, or delete them from the panel.`}]);
          setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
        }
        // Project matched — now resolve version (call sheet)
        const csVersions = callSheetStore?.[project.id] || [];
        if(csVersions.length===0){
          // Auto-create [Untitled] call sheet
          const newCS={id:Date.now(),label:"[Untitled]",...JSON.parse(JSON.stringify(CALLSHEET_INIT))};
          newCS.shootName=`${project.client||""} | ${project.name}`.replace(/^TEMPLATE \| /,"");
          const _pi1=(projectInfoRef.current||{})[project.id];
          if(_pi1){if(_pi1.shootName)newCS.shootName=_pi1.shootName;if(_pi1.shootDate)newCS.date=_pi1.shootDate;if(_pi1.shootLocation&&newCS.venueRows){const lr=newCS.venueRows.find(r=>r.label==="LOCATIONS");if(lr)lr.value=_pi1.shootLocation;}}
          setCallSheetStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[project.id])store[project.id]=[];store[project.id].push(newCS);return store;});
          setConnieCtx({projectId:project.id,vIdx:0});setConnieDietMode(null);
          addConnieTab(project.id,0,`${project.name} · [Untitled]`);
          const _csLogo=new Image();_csLogo.crossOrigin="anonymous";_csLogo.onload=()=>{try{const cv=document.createElement("canvas");cv.width=_csLogo.naturalWidth;cv.height=_csLogo.naturalHeight;cv.getContext("2d").drawImage(_csLogo,0,0);const du=cv.toDataURL("image/png");setCallSheetStore(prev=>{const s=JSON.parse(JSON.stringify(prev));const arr=s[project.id]||[];if(arr.length>0&&!arr[arr.length-1].productionLogo)arr[arr.length-1].productionLogo=du;return s;});}catch{}};_csLogo.src="/onna-default-logo.png";
          setMsgs([...history,{role:"assistant",content:`✓ Created a new call sheet for ${project.name}. What would you like to do?`}]);
          setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
        }
        // 1+ docs: open ALL as tabs, activate last
        csVersions.forEach((v,i)=>{addConnieTab(project.id,i,`${project.name} · ${v.label||`Day ${i+1}`}`);});
        const lastIdx=csVersions.length-1;
        setConnieCtx({projectId:project.id,vIdx:lastIdx});setConnieDietMode(null);
        const lastLabel=csVersions[lastIdx].label||`Day ${lastIdx+1}`;
        setMsgs([...history,{role:"assistant",content:`Opened ${csVersions.length} call sheet${csVersions.length>1?"s":""} for ${project.name}. Working on ${lastLabel}. What would you like to do?`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      // Step 2: Context is confirmed but user might be answering a day question
      let {projectId,vIdx}=connieCtx;
      let project=localProjects?.find(p=>p.id===projectId);
      if(!project){setConnieCtx(null);setMsgs([...history,{role:"assistant",content:"That project no longer exists. Let's start over — which project?"}]);setLoading(false);setMood("idle");return true;}

      // Close command — close doc panel without clearing chat
      if(/^\s*(close|exit|done|bye|finish)\s*$/i.test(input)){
        setConnieCtx(null);setConnieDietMode(null);
        setMsgs([...history,{role:"assistant",content:"Closed! Let me know when you need me again."}]);
        setLoading(false);setMood("idle");return true;
      }
      // Undo command
      if(/^\s*(undo|undo that|go back|revert|command z)\s*$/i.test(input)){
        if(popAgentUndo()){setMsgs([...history,{role:"assistant",content:"Done — reverted the last change. You can undo up to 50 changes, or press ⌘Z."}]);}
        else{setMsgs([...history,{role:"assistant",content:"Nothing to undo — the undo history is empty."}]);}
        setLoading(false);setMood("idle");return true;
      }

      // Switch / open another project
      if(/\b(switch|change|another|different|other|pick another|new project|open another|swap)\b.*\bproject\b/i.test(input)||/\bproject\b.*\b(switch|change|another|different|other|swap)\b/i.test(input)||/^\s*(switch|change)\s*(project)?\s*$/i.test(input)){
        setConnieCtx(null);setConnieDietMode(null);
        const list=localProjects.filter(p=>p.client!=="TEMPLATE").map((p,i)=>`${i+1}. ${p.name}${p.client?" ("+p.client+")":""}`).join("\n");
        setMsgs([...history,{role:"assistant",content:`Which project should I switch to?\n\n${list}\n\nPick a number or name.`}]);
        setLoading(false);setMood("idle");return true;
      }

      // Rename via chat
      {const _rm=input.match(/\b(?:rename|call it|name it|title it)\s+(?:to\s+)?["']?(.+?)["']?\s*$/i);
      if(_rm&&_rm[1]){const newLabel=_rm[1].trim();const csVersions_rn=callSheetStore?.[projectId]||[];const rIdx=Math.min(vIdx,csVersions_rn.length-1);if(rIdx>=0&&csVersions_rn[rIdx]){setCallSheetStore(prev=>{const s=JSON.parse(JSON.stringify(prev));s[projectId][rIdx].label=newLabel;return s;});setConnieTabs(prev=>prev.map(t=>t.projectId===projectId&&t.vIdx===rIdx?{...t,label:`${project.name} · ${newLabel}`}:t));setMsgs([...history,{role:"assistant",content:`✓ Renamed to "${newLabel}".`}]);setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;}}}

      // "Show call sheets" while already in call sheet context — stay in side panel
      if(/\b(show|list|see|view|open|manage|go\s*to)\b.*\b(call\s*sheets?)\b/i.test(input)||/\b(call\s*sheets?)\b.*\b(show|list|see|view|open|manage|go\s*to)\b/i.test(input)||/^\s*call\s*sheets?\s*$/i.test(input)){
        setConnieDietMode(null);
        setMsgs([...history,{role:"assistant",content:`Here's your call sheet for ${project.name}. What would you like to do?`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }
      if(/\b(show|list|see|view|open|manage|go\s*to)\b.*\bdietar(?:y|ies)\b/i.test(input)||/\bdietar(?:y|ies)\b.*\b(show|list|see|view|open|manage|go\s*to)\b/i.test(input)||/^\s*dietar(?:y|ies)\s*$/i.test(input)){
        setConnieCtx(null);setConnieDietMode(projectId);
        const dietCount=(dietaryStore?.[projectId]||[]).length;
        setMsgs([...history,{role:"assistant",content:`Here are ${project.name}'s dietary lists (${dietCount} total). You can create, view, or delete them from the panel.`}]);setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      // Handle "yes, export" confirmation (before fuzzyMatch to avoid false project switches)
      const _csLastMsg = history[history.length-2];
      if(_csLastMsg&&_csLastMsg._pendingExport&&/\b(yes|yep|sure|go ahead|do it|confirm|proceed|export anyway|export|that's fine|thats fine|ok|okay)\b/i.test(input)){
        const _yEl=document.getElementById("onna-cs-print");
        if(_yEl){const _yC=_yEl.cloneNode(true);_yC.querySelectorAll("button").forEach(b=>b.remove());_yC.querySelectorAll("input[type=file]").forEach(b=>b.remove());_yC.querySelectorAll("[data-cs-placeholder]").forEach(b=>b.remove());const _yF=document.createElement("iframe");_yF.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(_yF);const _yD=_yF.contentDocument;_yD.open();_yD.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;}@media print{@page{margin:0;size:A4;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);_yD.close();_yD.body.appendChild(_yD.adoptNode(_yC));setTimeout(()=>{_yF.contentWindow.focus();_yF.contentWindow.print();setTimeout(()=>document.body.removeChild(_yF),1000);},300);}
        else{printCallSheetPDF(_csLastMsg._pendingExport.csData);}
        setMsgs([...history,{role:"assistant",content:"Opening the print dialog for the call sheet now — save it as PDF from there!"}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      // Export / PDF intent — uses exact same DOM clone as BtnExport button
      if(/\b(export|pdf|download|print|save)\b/i.test(input)){
        // Check for missing fields first
        const csVersions_ex=callSheetStore?.[project.id]||[];
        const vIdx_ex=Math.min(vIdx,csVersions_ex.length-1);
        const csData_ex=csVersions_ex[vIdx_ex];
        if(!csData_ex){setMsgs([...history,{role:"assistant",content:"No call sheet found to export. Create one first!"}]);setLoading(false);setMood("idle");return true;}
        const missing=[];
        if(!csData_ex.shootName) missing.push("Shoot Name");
        if(!csData_ex.date) missing.push("Date");
        if(!csData_ex.dayNumber) missing.push("Day Number");
        if(!csData_ex.productionContacts) missing.push("Production Contacts");
        const emptyVenues=(csData_ex.venueRows||[]).filter(v=>!v.value).map(v=>v.label);
        if(emptyVenues.length) missing.push(...emptyVenues.map(v=>`Venue: ${v}`));
        const emptySchedule=(csData_ex.schedule||[]).filter(s=>!s.time&&!s.activity).length;
        if(emptySchedule===(csData_ex.schedule||[]).length&&emptySchedule>0) missing.push("Schedule (all rows empty)");
        const emptyCrew=[];
        (csData_ex.departments||[]).forEach(d=>{const unfilled=d.crew.filter(c=>!c.name);if(unfilled.length) emptyCrew.push(`${d.name}: ${unfilled.map(c=>c.role).join(", ")}`);});
        if(emptyCrew.length) missing.push(...emptyCrew.map(c=>`Crew — ${c}`));
        if(missing.length>0){
          setMsgs([...history,{role:"assistant",content:`⚠️ Are you sure you want to export? You're missing information on this call sheet.\n\nSay "yes" to export anyway, or ask me "what's missing" for a full breakdown.`,_pendingExport:{csData:csData_ex}}]);
          setLoading(false);setMood("idle");return true;
        }
        const el=document.getElementById("onna-cs-print");
        if(el){
          const clone=el.cloneNode(true);clone.querySelectorAll("button").forEach(b=>b.remove());clone.querySelectorAll("input[type=file]").forEach(b=>b.remove());clone.querySelectorAll("[data-cs-placeholder]").forEach(b=>b.remove());
          const _iframe=document.createElement("iframe");_iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(_iframe);
          const _doc=_iframe.contentDocument;_doc.open();_doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;}@media print{@page{margin:0;size:A4;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);_doc.close();
          _doc.body.appendChild(_doc.adoptNode(clone));setTimeout(()=>{_doc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(x=>x.remove());_iframe.contentWindow.focus();_iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(_iframe),1000);},300);
          setMsgs([...history,{role:"assistant",content:"Opening the print dialog for the call sheet now — save it as PDF from there!"}]);
        }else{
          printCallSheetPDF((callSheetStore?.[project.id]||[])[Math.min(vIdx,(callSheetStore?.[project.id]||[]).length-1)]);
          setMsgs([...history,{role:"assistant",content:"Opening the print dialog for the call sheet now — save it as PDF from there!"}]);
        }
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      // ── Dietary commands (local pre-flight) ─────────────────────────────────
      const matchDietaryTag = (inp) => {
        const lo = inp.trim().toLowerCase();
        const map = {"none":"None","vegetarian":"Vegetarian","veg":"Vegetarian","vegan":"Vegan",
          "halal":"Halal","kosher":"Kosher","gluten free":"Gluten-Free","gluten-free":"Gluten-Free",
          "gf":"Gluten-Free","dairy free":"Dairy-Free","dairy-free":"Dairy-Free","df":"Dairy-Free",
          "nut allergy":"Nut Allergy","nut":"Nut Allergy","shellfish":"Shellfish Allergy",
          "shellfish allergy":"Shellfish Allergy","pescatarian":"Pescatarian","pesce":"Pescatarian",
          "other":"Other"};
        return map[lo] || DIETARY_TAGS.find(t=>t.toLowerCase()===lo) || null;
      };

      // Check 0: Handle pending "add to call sheet?" confirmation
      if(connieDietPending){
        const isYes=/\b(yes|yep|sure|go ahead|do it|confirm|ok|okay|yeah|yea)\b/i.test(input);
        const isNo=/\b(no|nope|nah|cancel|never\s*mind|skip)\b/i.test(input);
        if(isYes){
          const {name:cdpName,dietary:cdpDietary,vendorMatch:cdpVendor,projectId:cdpProjId}=connieDietPending;
          // Add crew to call sheet
          const csVersions_dp=callSheetStore?.[cdpProjId]||[];
          const dpVIdx=Math.min(vIdx,csVersions_dp.length-1);
          const crewEntry={role:cdpName,name:cdpName};
          if(cdpVendor){if(cdpVendor.email)crewEntry.email=cdpVendor.email;if(cdpVendor.phone)crewEntry.phone=cdpVendor.phone;}
          applyConniePatch({departments:[{name:"PRODUCTION & LOCATION",crew:[crewEntry]}]},cdpProjId,dpVIdx,csVersions_dp,setCallSheetStore);
          // Add to dietary list
          setDietaryStore(prev=>{
            const store=JSON.parse(JSON.stringify(prev));
            let arr=store[cdpProjId]||[];
            if(arr.length===0){
              const newDiet={id:Date.now(),label:"Dietary List 1",...JSON.parse(JSON.stringify(DIETARY_INIT))};
              newDiet.project.name=project.name||"";newDiet.people=[];
              arr=[newDiet];
            }
            const d=arr[arr.length-1];
            d.people.push({id:Date.now()+Math.random(),name:cdpName,role:"",department:"PRODUCTION & LOCATION",dietary:cdpDietary,allergies:"",notes:""});
            arr[arr.length-1]=d;store[cdpProjId]=arr;return store;
          });
          const vendorNote=cdpVendor?` I also pulled their contact details from the database (${cdpVendor.email||"no email"}${cdpVendor.phone?", "+cdpVendor.phone:""}).`:"";
          setConnieDietPending(null);
          setMsgs([...history,{role:"assistant",content:`Done! I've added ${cdpName} to the call sheet and set their dietary to ${cdpDietary}.${vendorNote}`}]);
          setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
        }
        if(isNo){
          setConnieDietPending(null);
          setMsgs([...history,{role:"assistant",content:"No problem!"}]);
          setLoading(false);setMood("idle");return true;
        }
      }

      // Check 1: "Sync dietary with call sheet"
      if(/sync\s+(dietary|dietaries|diet)/i.test(input)||(/sync/i.test(input)&&/(call\s*sheet|cs)/i.test(input)&&/(dietary|diet)/i.test(input))){
        const dietArr=dietaryStore?.[projectId]||[];
        if(dietArr.length===0){
          setMsgs([...history,{role:"assistant",content:"No dietary lists found for this project. Create one first in the Documents tab, or ask me to add a dietary for someone and I'll create one automatically."}]);
          setLoading(false);setMood("idle");return true;
        }
        const csVersions_ds=callSheetStore?.[projectId]||[];
        if(csVersions_ds.length===0){
          setMsgs([...history,{role:"assistant",content:"No call sheets found for this project. Create a call sheet first."}]);
          setLoading(false);setMood("idle");return true;
        }
        const latestCS=csVersions_ds[csVersions_ds.length-1];
        const pulled=[];
        (latestCS.departments||[]).forEach(dept=>{(dept.crew||[]).forEach(cr=>{if(cr.name&&cr.name.trim())pulled.push({name:cr.name.trim().toLowerCase(),role:cr.role||"",department:dept.name||"",origName:cr.name.trim()});});});
        setDietaryStore(prev=>{
          const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];const d=arr[arr.length-1];
          if(latestCS.shootName)d.project.name=latestCS.shootName;
          if(latestCS.date)d.project.date=latestCS.date;
          const csParts=(latestCS.shootName||"").split(" | ");
          if(csParts.length>=2)d.project.client=csParts[0].trim();
          const csNames=new Set(pulled.map(pr=>pr.name));
          const existingMap={};
          d.people.forEach(pr=>{if(pr.name&&pr.name.trim())existingMap[pr.name.trim().toLowerCase()]=pr;});
          const newPeople=[];let addedCount=0;
          pulled.forEach(pr=>{
            const existing=existingMap[pr.name];
            if(existing){newPeople.push({...existing,role:pr.role||existing.role,department:pr.department||existing.department});}
            else{newPeople.push({id:Date.now()+Math.random(),name:pr.origName,role:pr.role,department:pr.department,dietary:"None",allergies:"",notes:""});addedCount++;}
          });
          d.people.forEach(pr=>{if(pr.name&&pr.name.trim()&&!pr.name.startsWith("[")&&!csNames.has(pr.name.trim().toLowerCase())){newPeople.push(pr);}});
          d.people=newPeople;
          arr[arr.length-1]=d;store[projectId]=arr;return store;
        });
        const addedCount=pulled.filter(pr=>{const dietPeople=(dietaryStore?.[projectId]||[])[(dietaryStore?.[projectId]||[]).length-1]?.people||[];return !dietPeople.some(dp=>dp.name&&dp.name.trim().toLowerCase()===pr.name);}).length;
        setMsgs([...history,{role:"assistant",content:`Synced dietary list with call sheet! Added ${addedCount} new crew member${addedCount!==1?"s":""}, updated project info.`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      // Check 2: "Add dietary for [name] as [type]" / "set [name] dietary to [type]" / "[name] is [type]" / "mark [name] as [type]"
      const dietAddPatterns=[
        /(?:add|set)\s+dietar(?:y|ies)\s+(?:for\s+)?(.+?)\s+(?:as|to)\s+(.+)/i,
        /set\s+(.+?)\s+dietar(?:y|ies)\s+(?:as|to)\s+(.+)/i,
        /mark\s+(.+?)\s+(?:as|dietary\s+(?:as|to))\s+(.+)/i,
        /(.+?)\s+is\s+(vegetarian|vegan|halal|kosher|gluten[- ]free|dairy[- ]free|nut(?:\s+allergy)?|shellfish(?:\s+allergy)?|pescatarian|none|other|gf|df|veg|pesce)\s*$/i,
      ];
      let dietNameMatch=null,dietTypeMatch=null;
      for(const pat of dietAddPatterns){
        const m=input.match(pat);
        if(m){dietNameMatch=m[1].trim();dietTypeMatch=matchDietaryTag(m[2]);if(dietTypeMatch)break;dietNameMatch=null;dietTypeMatch=null;}
      }
      if(dietNameMatch&&dietTypeMatch){
        const dietArr=dietaryStore?.[projectId]||[];
        // Auto-create dietary list if none exists
        if(dietArr.length===0){
          const newDiet={id:Date.now(),label:"Dietary List 1",...JSON.parse(JSON.stringify(DIETARY_INIT))};
          newDiet.project.name=project.name||"";newDiet.people=[];
          const csVersions_dc=callSheetStore?.[projectId]||[];
          if(csVersions_dc.length>0){const lcs=csVersions_dc[csVersions_dc.length-1];if(lcs.shootName)newDiet.project.name=lcs.shootName;if(lcs.date)newDiet.project.date=lcs.date;}
          setDietaryStore(prev=>{const store=JSON.parse(JSON.stringify(prev));if(!store[projectId])store[projectId]=[];store[projectId].push(newDiet);return store;});
        }
        const latestDiet=(dietArr.length>0)?dietArr[dietArr.length-1]:null;
        const nameLower=dietNameMatch.toLowerCase();
        // Search dietary people first
        if(latestDiet){
          const existIdx=(latestDiet.people||[]).findIndex(pr=>pr.name&&pr.name.trim().toLowerCase()===nameLower);
          if(existIdx>=0){
            setDietaryStore(prev=>{
              const store=JSON.parse(JSON.stringify(prev));const arr=store[projectId]||[];const d=arr[arr.length-1];
              d.people[existIdx].dietary=dietTypeMatch;
              arr[arr.length-1]=d;store[projectId]=arr;return store;
            });
            setMsgs([...history,{role:"assistant",content:`Updated ${latestDiet.people[existIdx].name}'s dietary to ${dietTypeMatch}.`}]);
            setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
          }
        }
        // Search call sheet crew
        const csVersions_dc2=callSheetStore?.[projectId]||[];
        if(csVersions_dc2.length>0){
          const latestCS2=csVersions_dc2[csVersions_dc2.length-1];
          let csCrewMatch=null;
          (latestCS2.departments||[]).forEach(dept=>{(dept.crew||[]).forEach(cr=>{if(cr.name&&cr.name.trim().toLowerCase()===nameLower)csCrewMatch={name:cr.name.trim(),role:cr.role||"",department:dept.name||""};});});
          if(csCrewMatch){
            setDietaryStore(prev=>{
              const store=JSON.parse(JSON.stringify(prev));let arr=store[projectId]||[];
              if(arr.length===0){const nd={id:Date.now(),label:"Dietary List 1",...JSON.parse(JSON.stringify(DIETARY_INIT))};nd.project.name=project.name||"";nd.people=[];arr=[nd];}
              const d=arr[arr.length-1];
              d.people.push({id:Date.now()+Math.random(),name:csCrewMatch.name,role:csCrewMatch.role,department:csCrewMatch.department,dietary:dietTypeMatch,allergies:"",notes:""});
              arr[arr.length-1]=d;store[projectId]=arr;return store;
            });
            setMsgs([...history,{role:"assistant",content:`Added ${csCrewMatch.name} to the dietary list as ${dietTypeMatch}.`}]);
            setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
          }
        }
        // Search vendor database
        const vendorMatch=(vendorsProp||[]).find(v=>v.name&&v.name.trim().toLowerCase()===nameLower);
        if(vendorMatch){
          setConnieDietPending({type:"confirm_add_cs",name:dietNameMatch,dietary:dietTypeMatch,vendorMatch:{name:vendorMatch.name,email:vendorMatch.email||"",phone:vendorMatch.phone||""},projectId});
          setMsgs([...history,{role:"assistant",content:`${dietNameMatch} isn't added as crew. I found ${vendorMatch.name} in the database — email: ${vendorMatch.email||"N/A"}, mobile: ${vendorMatch.phone||"N/A"}. Do you want me to add them to the call sheet?`}]);
          setLoading(false);setMood("idle");return true;
        }
        // Not found anywhere
        setConnieDietPending({type:"confirm_add_cs",name:dietNameMatch,dietary:dietTypeMatch,vendorMatch:null,projectId});
        setMsgs([...history,{role:"assistant",content:`${dietNameMatch} isn't added as crew. Do you want me to add them to the call sheet?`}]);
        setLoading(false);setMood("idle");return true;
      }

      // Allow switching: if user mentions a different project name, reset context
      const lower=input.toLowerCase();
      const switchProject=fuzzyMatchProject(localProjects,input,projectId);
      if(switchProject){
        setConnieCtx(null);
        const swVersions=callSheetStore?.[switchProject.id]||[];
        if(swVersions.length===0){
          setConniePending({projectId:switchProject.id,step:"pick_name"});
          setMsgs([...history,{role:"assistant",content:`No call sheets for ${switchProject.name} yet. What should I call this call sheet? (e.g. Shoot Day 1, Recce Day)`}]);
        }else if(swVersions.length===1){
          setConnieCtx({projectId:switchProject.id,vIdx:0});setConnieDietMode(null);
          const vl=swVersions[0].label||"Day 1";
          addConnieTab(switchProject.id,0,`${switchProject.name} · ${vl}`);
          setMsgs([...history,{role:"assistant",content:`Switched to ${switchProject.name} (${vl}). What would you like to do?`}]);
        } else {
          setConniePending({projectId:switchProject.id,step:"pick_existing_or_new"});
          const list=swVersions.map((v,i)=>`${i+1}. ${v.label||`Version ${i+1}`}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`${switchProject.name} has ${swVersions.length} call sheets:\n\n${list}\n\nPick one by number/name, or say **new** to create another.`}]);
        }
        setLoading(false);setMood("idle");return true;
      }

      // If user says "switch project" / "change project"
      if(/\b(switch|change|different|new)\s+(project|call\s*sheet)\b/i.test(input)){
        setConnieCtx(null);setConniePending(null);
        const list=localProjects.map((p,i)=>`${i+1}. ${p.name}`).join("\n");
        setMsgs([...history,{role:"assistant",content:`Sure! Which project's call sheet should I work on?\n\n${list}`}]);
        setLoading(false);setMood("idle");return true;
      }

      // "create new call sheet" / "new day" for current project
      if(/\b(create|new|add)\b/i.test(lower)&&/\b(call\s*sheet|day|version)\b/i.test(lower)){
        setConnieCtx(null);
        setConniePending({projectId,step:"pick_name"});
        setMsgs([...history,{role:"assistant",content:`What should I call this new call sheet? (e.g. Shoot Day 2, Recce Day)`}]);
        setLoading(false);setMood("idle");return true;
      }

      // "What's missing" breakdown for call sheet
      if(/\b(what('?s| is) missing|breakdown|what do i need|what('?s| is) empty|missing (fields|info|data|information))\b/i.test(input)){
        const csVersions_m=callSheetStore?.[project.id]||[];
        const vIdx_m=Math.min(vIdx,csVersions_m.length-1);
        const csData_m=csVersions_m[vIdx_m];
        const missing=[];
        if(!csData_m.shootName) missing.push("Shoot Name — not set");
        if(!csData_m.date) missing.push("Date — not set");
        if(!csData_m.dayNumber) missing.push("Day Number — not set");
        if(!csData_m.productionContacts) missing.push("Production Contacts — empty");
        (csData_m.venueRows||[]).forEach(v=>{if(!v.value) missing.push(`${v.label} — empty`);});
        const emptyScheduleRows=(csData_m.schedule||[]).filter(s=>!s.time&&!s.activity);
        if(emptyScheduleRows.length) missing.push(`Schedule — ${emptyScheduleRows.length} empty row${emptyScheduleRows.length>1?"s":""}`);
        (csData_m.departments||[]).forEach(d=>{
          const unfilled=d.crew.filter(c=>!c.name);
          if(unfilled.length) missing.push(`${d.name} — ${unfilled.map(c=>c.role).join(", ")}`); });
        if(missing.length===0){
          setMsgs([...history,{role:"assistant",content:"Everything looks filled in! You're good to export. 🎉"}]);
        }else{
          setMsgs([...history,{role:"assistant",content:`Here's what's still missing on this call sheet:\n\n${missing.map(m=>`• ${m}`).join("\n")}\n\nWant me to help fill any of these in, or say "export" to go ahead anyway?`}]);
        }
        setLoading(false);setMood("idle");return true;
      }

      const csVersions = callSheetStore?.[project.id] || [];
      if(csVersions.length===0){setConnieCtx(null);setConniePending({projectId:project.id,step:"pick_name"});setMsgs([...history,{role:"assistant",content:`No call sheets for ${project.name} yet. What should I call this call sheet? (e.g. Shoot Day 1, Recce Day)`}]);setLoading(false);setMood("idle");return true;}
      vIdx = Math.min(vIdx, csVersions.length-1);

      const ver = csVersions[vIdx];
      const vLabel = ver.label || `Day ${vIdx+1}`;

      // Build call sheet snapshot
      let snap = `Shoot: ${ver.shootName||"(empty)"} | Date: ${ver.date||"(empty)"} | Day: ${ver.dayNumber||"(empty)"}\n`;
      snap += `Contacts: ${ver.productionContacts||"(empty)"}\n`;
      if(ver.venueRows?.length) snap += "Venues:\n" + ver.venueRows.map(v=>`  ${v.label}: ${v.value||"(empty)"}`).join("\n") + "\n";
      if(ver.schedule?.length) snap += "Schedule:\n" + ver.schedule.map(s=>`  ${s.time||"?"} — ${s.activity||"(empty)"} ${s.notes||""}`).join("\n") + "\n";
      snap += `Weather: ${ver.weatherSummary||"(empty)"} | High: ${ver.weatherHighC||"?"}°C / ${ver.weatherHighF||"?"}°F | Low: ${ver.weatherLowC||"?"}°C / ${ver.weatherLowF||"?"}°F\n`;
      snap += `Real Feel: High ${ver.weatherRealFeelHighC||"?"}°C / ${ver.weatherRealFeelHighF||"?"}°F | Low ${ver.weatherRealFeelLowC||"?"}°C / ${ver.weatherRealFeelLowF||"?"}°F\n`;
      snap += `Sunrise: ${ver.weatherSunrise||"(empty)"} | Sunset: ${ver.weatherSunset||"(empty)"} | Blue Hour: ${ver.weatherBlueHour||"(empty)"}\n`;
      if(ver.weatherHourly?.length) snap += "Hourly: " + ver.weatherHourly.map(h=>`${h.time}:${h.tempC}°C`).join(", ") + "\n";
      snap += `Map Link: ${ver.mapLink||"(empty)"}\n`;
      if(ver.departments?.length) snap += "Departments:\n" + ver.departments.map(d=>`  ${d.name}:\n` + d.crew.map(c=>`    ${c.role}: ${c.name||"(empty)"} | mob: ${c.mobile||"(empty)"} | email: ${c.email||"(empty)"} | call: ${c.callTime||"(empty)"}`).join("\n")).join("\n") + "\n";

      // Build vendor summary
      const vendorList = (vendorsProp||[]).map(v=>`${v.name}|${v.category||""}|${v.email||""}|${v.phone||""}`).join("\n");
      const leadsList = (allLeads||[]).filter(l=>l.status==="client"||l.status==="warm"||l.status==="open").map(l=>`${l.company||""}|${l.contact||""}|${l.email||""}|${l.phone||""}|${l.role||""}|${l.category||""}`).join("\n");

      const connieSystem = buildConnieSystem(project, ver, vLabel, snap, vendorList, leadsList);

      // Stream response
      setMsgs(history);setInput("");setLoading(true);setMood("thinking");
      try{
        const connieIntro = intro;
        const apiMessages=history.map((m,mi)=>{
          if(m.role==="assistant"){
            // Replace the intro message (first assistant msg) so old cached intros don't confuse the model
            if(mi===0) return{role:m.role,content:connieIntro};
            return{role:m.role,content:typeof m.content==="string"?m.content:""};
          }
          return{role:m.role,content:m.content};
        });
        const res=await fetch(`/api/agents/${agent.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:connieSystem,messages:apiMessages})});
        if(!res.ok){const e=await res.json().catch(()=>({error:`HTTP ${res.status}`}));setMsgs(p=>[...p,{role:"assistant",content:`Error: ${e.error||"Unknown"}`}]);setLoading(false);setMood("idle");return true;}
        const reader=res.body.getReader();const decoder=new TextDecoder();let fullText="";let buffer="";let streamError="";
        while(true){const{done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.startsWith("data: "))continue;const raw=line.slice(6).trim();if(!raw||raw==="[DONE]")continue;try{const ev=JSON.parse(raw);if(ev.error){streamError=typeof ev.error==="string"?ev.error:ev.error.message||JSON.stringify(ev.error);}else if(ev.type==="error"){streamError=ev.error?.message||JSON.stringify(ev);}else if(ev.type==="content_block_delta"&&ev.delta?.type==="text_delta"){fullText+=ev.delta.text;setMsgs([...history,{role:"assistant",content:fullText}]);}}catch{}}}
        if(!fullText&&streamError){setMsgs([...history,{role:"assistant",content:`Error: ${streamError}`}]);setLoading(false);setMood("idle");return true;}

        // Parse JSON patch from response
        const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
        if(jsonMatch){
          try{
            const patch = JSON.parse(jsonMatch[1].trim());
            const cleanText = fullText.replace(/```json[\s\S]*?```/g,"").trim();
            const existingCReview = conniePendingReview && conniePendingReview.projectId===project.id && conniePendingReview.vIdx===vIdx ? conniePendingReview : null;
            const preSnapshot = existingCReview ? existingCReview.preSnapshot : JSON.parse(JSON.stringify(ver));
            const newMarkers = buildConniePatchMarkers(patch, ver);
            applyConniePatch(patch, project.id, vIdx, csVersions, setCallSheetStore);
            setTimeout(()=>syncProjectInfoToDocs(project.id),100);
            if(newMarkers.size > 0){
              const mergedMarkers = existingCReview ? [...new Set([...existingCReview.markers, ...newMarkers])] : [...newMarkers];
              setConniePendingReview({ preSnapshot, markers: mergedMarkers, projectId: project.id, vIdx });
              setMsgs([...history,{role:"assistant",content:(cleanText||"Changes applied.")+"\n\nReview the highlighted changes on the left — ✓ to keep, ✕ to revert."}]);
            } else if (existingCReview && existingCReview.markers.length > 0) {
              setMsgs([...history,{role:"assistant",content:(cleanText||"Done.")+"\n\nYou still have pending changes to review on the left."}]);
            } else {
              setMsgs([...history,{role:"assistant",content:(cleanText?cleanText+"\n\n":"")+"✓ Call sheet updated."}]);
            }
          }catch(pe){
            setMsgs([...history,{role:"assistant",content:fullText+"\n\n⚠️ Could not parse patch: "+pe.message}]);
          }
        }else{
          // Post-response export fallback: if the LLM mentioned exporting, trigger print
          if(/\b(export|print|pdf)\b/i.test(fullText)&&/🖨️|📄|print dialog/i.test(fullText)){
            const _prEl=document.getElementById("onna-cs-print");
            if(_prEl){const _prC=_prEl.cloneNode(true);_prC.querySelectorAll("button").forEach(b=>b.remove());_prC.querySelectorAll("input[type=file]").forEach(b=>b.remove());_prC.querySelectorAll("[data-cs-placeholder]").forEach(b=>b.remove());const _prF=document.createElement("iframe");_prF.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(_prF);const _prD=_prF.contentDocument;_prD.open();_prD.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;}@media print{@page{margin:0;size:A4;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);_prD.close();_prD.body.appendChild(_prD.adoptNode(_prC));setTimeout(()=>{_prF.contentWindow.focus();_prF.contentWindow.print();setTimeout(()=>document.body.removeChild(_prF),1000);},300);}
          }
          setMsgs([...history,{role:"assistant",content:fullText||"Hmm, something went wrong!"}]);
        }
        setMood("excited");setTimeout(()=>setMood("idle"),2500);
      }catch(err){setMsgs(p=>[...p,{role:"assistant",content:`Oops! ${err.message}`}]);setMood("idle");}
      setLoading(false);return true;

  return false;
}

