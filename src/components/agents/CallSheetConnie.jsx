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
