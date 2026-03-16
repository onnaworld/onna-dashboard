import React from "react";
import { defaultSections, stripThinking as _stripThinking } from "../../utils/helpers";

// Strip JSON code blocks (complete or partial/in-progress) from display during streaming
function _stripJsonBlocks(text) {
  // Remove complete ```json ... ``` blocks
  let cleaned = text.replace(/```json[\s\S]*?```/g, "");
  // Remove partial/unclosed ```json block (still streaming)
  cleaned = cleaned.replace(/```json[\s\S]*$/g, "");
  // Remove trailing ``` opener without json yet
  cleaned = cleaned.replace(/```\s*$/g, "");
  return cleaned.trim() || "Working on it…";
}

// ─── BILLIE (ESTIMATE) UTILITY FUNCTIONS ────────────────────────────────────

// ─── BILLIE (ESTIMATE) HELPERS ───────────────────────────────────────────────
function buildBillieSystem(project, estData, versionLabel, estSnapshot, baseCurrency = "AED", secondCurrency = "USD", billieRateCards = []) {
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
${(() => {
  // Support both flat array (legacy) and location-keyed object
  const cards = Array.isArray(billieRateCards) ? { Dubai: billieRateCards } : (billieRateCards || {});
  const allEntries = Object.entries(cards).filter(([, v]) => v && v.length > 0);
  if (allEntries.length === 0) return "";
  let block = "\nCUSTOM RATE CARD (user-defined default rates — ALWAYS use these over market defaults):\n";
  block += "You have rate cards for: " + allEntries.map(([loc]) => loc).join(", ") + "\n";
  block += "Match the rate card to the shoot location. If no exact match, use the closest region.\n";
  allEntries.forEach(([loc, rates]) => {
    block += "\n[" + loc + "]\n";
    rates.forEach(r => { if (r.role && r.rate) block += "- " + r.role + ": " + (r.currency || "AED") + " " + r.rate + "/" + (r.per || "day") + (r.notes ? " (" + r.notes + ")" : "") + "\n"; });
  });
  block += "\nWhen populating estimates, match line items to these rates first. Only fall back to market rates for items not in the rate card.\n";
  block += 'The user can say "rate card" or "show rates" to open the rate card manager.\n';
  return block;
})()}
INSTRUCTIONS:
- When the user asks to ADD, UPDATE, or CHANGE rows, header fields, or notes, output a SINGLE JSON patch inside a \`\`\`json code block. Only ONE json block per response.
- For top sheet fields: {"ts": {"client":"...","date":"...","project":"...","photographer":"...","deliverables":"...","deadlines":"...","usage":"...","shootDate":"...","location":"...","payment":"..."}}
- Only output JSON for write intents. For read-only questions answer in plain text with NO JSON block.
- Each row has: ref (e.g. "1A"), desc, notes, days, qty, rate. Total = days × qty × rate. All values MUST be strings.
- Section 18 (Production Fees) rows with a % in notes auto-calculate from subtotal.
- When discussing totals, show the base currency (${baseCurrency}). The UI automatically shows the secondary currency (${secondCurrency}) conversion.
- Be warm, concise and professional.
- NEVER say you don't have access to data, can't see the estimate, or need the user to share information. You have FULL access.

ROW MATCHING (CRITICAL — follow these rules strictly):
The template has 18 sections with pre-defined rows. You MUST match items to existing rows by ref before creating new ones.

FULL TEMPLATE REF MAP:
Sec 1 PHOTOGRAPHY FEES: 1A=PHOTOGRAPHER DAY RATE, 1B=PHOTOGRAPHER RECCE, 1C=USAGE, 1D=1ST ASSISTANT, 1E=2ND ASSISTANT, 1F=DIGI TECH, 1G=OVERTIME
Sec 2 PHOTOGRAPHY EQUIPMENT: 2A=CAMERA EQUIPMENT, 2B=LIGHTING EQUIPMENT, 2C=FILM, 2D=FILM PROCESSING, 2E=STORAGE, 2F=COURIERS, 2G=EQUIPMENT TRANSPORTATION, 2H=EQUIPMENT CARNET, 2I=EQUIPMENT SHIPPING, 2J=CUSTOMS PAPERWORK
Sec 3 STILLS POST: 3A=RETOUCH
Sec 4 VIDEO CREW: 4A=DIRECTOR, 4B=DOP, 4C=1ST AD, 4D=1ST AC, 4E=2ND AC, 4F=STEADICAM OPERATOR, 4G=GAFFER, 4H=SPARK, 4I=DIT, 4J=VTO, 4K=KEY GRIP, 4L=BEST BOY GRIP, 4M=SOUND ENGINEER, 4N=DRONE OPERATOR, 4O=OVERTIME
Sec 5 VIDEO EQUIPMENT: 5A=MOTION CAMERA PACKAGE, 5B=GRIP & LIGHTING, 5C=FILM, 5D=FILM PROCESSING, 5E=STORAGE, 5F=EQUIPMENT TRANSPORTATION, 5G=EQUIPMENT CARNET, 5H=EQUIPMENT SHIPPING
Sec 6 VIDEO POST: 6A=EDIT, 6B=GRADE, 6C=SOUND DESIGN, 6D=LIBRARY MUSIC, 6E=STOCK FOOTAGE, 6F=VFX
Sec 7 STYLING: 7A=STYLIST SHOOT, 7B=STYLIST PREP, 7C=1ST ASSISTANT, 7D=1ST ASSISTANT PREP, 7E=WARDROBE ALLOWANCE ADULTS, 7F=WARDROBE ALLOWANCE CHILDS, 7G=STYLING EQUIPMENT, 7H=SEAMSTRESS, 7I=FITTING BACKGROUND, 7J=SELPHY PRINTER, 7K=SELPHY PRINTER CONSUMABLES, 7L=COLLECTION TRANSPORTATION, 7M=STYLIST TRAVEL, 7N=ASSISTANT TRAVEL, 7O=OVERTIME
Sec 8 HAIR & MAKEUP: 8A=HMUA, 8B=HMUA TRAVEL, 8C=MUA ASSISTANT, 8D=MUA ASSISTANT TRAVEL, 8E=MANICURIST, 8F=HMU SET UP & EQ, 8G=OVERTIME
Sec 9 TALENT: 9A=CASTING DIRECTOR, 9B=STUDIO RENTAL, 9C=ADULT MODELS, 9D=CHILD MODELS, 9E=FIT MODELS, 9F=ADULT TRAVEL, 9G=CHILD TRAVEL, 9H=USAGE BUYOUT ADULT, 9I=USAGE BUYOUT CHILD, 9J=MODEL TRAVEL EXPENSES, 9K=OVERTIME
Sec 10 PROPS & SET: 10A=SET DESIGNER SHOOT, 10B=SET DESIGNER PREP, 10C=PROP MASTER SHOOT, 10D=PROP MASTER PREP, 10E=ART ASSISTANT SHOOT, 10F=ART ASSISTANT PREP, 10G=ON SET HELPER, 10H=PROPS BUDGET, 10I=EXPERIENTIAL PROPS, 10J=BACKDROPS, 10K=TRUCK RENTAL, 10L=PROPS CLEARANCE, 10M=OVERTIME
Sec 11 PRODUCTION: 11A=PRODUCER, 11B=PRODUCER PREP, 11C=PRODUCTION MANAGER, 11D=PRODUCTION COORDINATOR, 11E=RUNNER, 11F=FIXER, 11G=SET MEDIC, 11H=SECURITY, 11J=OVERTIME
Sec 12 PRODUCTION EXPENSES: 12A=PRODUCTION KIT, 12B=PREPROD EXPENSES
Sec 13 CATERING: 13A=CATERING SHOOT, 13B=CATERING RECCE/FITTING, 13C=CATERING TRAVEL, 13D=CRAFT, 13E=COFFEES/REFRESHMENTS, 13F=DINNERS, 13G=TALENT RIDER
Sec 14 VEHICLES: 14A=VEHICLE RENTAL, 14B=TAXI ALLOWANCE, 14C=PARKING TOLL & FUEL, 14D=OVERTIME
Sec 15 LOCATIONS: 15A=STUDIO HIRE, 15B=COVE PAINTING, 15C=LOCATION HIRE, 15D=LOCATION MANAGER SHOOT, 15E=LOCATION MANAGER SCOUT, 15F=LOCATION ASSISTANT, 15G=LOCATION EXPENSES, 15H=BASE CAMP, 15I=UNIT GEAR, 15J=WIFI RENTAL, 15K=OVERTIME
Sec 16 PERMITS: 16A=DFTC PERMIT, 16B=DRONE PERMIT, 16C=CAR/DRIVING PERMITS, 16D=OPEN SEA PERMIT
Sec 17 TRAVEL: 17A=AIRPORT TRANSFERS, 17B=FLIGHTS, 17C=FLIGHTS, 17D=HOTEL, 17E=EXCESS BAGGAGE, 17F=VISAS, 17G=TRAVEL AGENT FEE, 17H=PER DIEMS, 17I=FLIGHT CONTINGENCY
Sec 18 PRODUCTION FEES: 18A=INSURANCE (3%), 18B=GENERAL FEES & BANK CHARGES (1%), 18D=PRODUCTION FEE (10%)

FUZZY MATCHING RULES:
1. ALWAYS scan ALL existing refs above before creating addRows. If a brief item fuzzy-matches an existing row, USE that ref.
2. Examples of fuzzy matches you MUST catch:
   - "Cinematographer" / "Camera Operator" / "DP" → 4B (DOP)
   - "Photo equipment" / "Stills camera" / "Camera rental" → 2A (CAMERA EQUIPMENT)
   - "Lights" / "Lighting package" / "HMIs" → 2B or 5B (LIGHTING EQUIPMENT / GRIP & LIGHTING)
   - "Transport" / "Ground transport" / "Cars" / "Buggy" / "Shuttle" → 14A (VEHICLE RENTAL)
   - "Food" / "Lunch" / "Meals" → 13A (CATERING SHOOT)
   - "Location fee" / "Venue" / "Space rental" → 15C (LOCATION HIRE)
   - "Talent" / "Cast" / "Actors" / "Models" → 9C (ADULT MODELS) or 9D (CHILD MODELS)
   - "Hair" / "Makeup" / "MUA" / "HMUA" → 8A (HMUA)
   - "Wardrobe" / "Clothes" / "Outfits" → 7E (WARDROBE ALLOWANCE ADULTS)
   - "Editing" / "Editor" / "Offline" → 6A (EDIT)
   - "Color" / "Colour" / "Grading" / "Colorist" → 6B (GRADE)
   - "Sound" / "Audio" / "Mix" → 6C (SOUND DESIGN) or 4M (SOUND ENGINEER)
   - "Permits" / "Filming permit" → 16A (DFTC PERMIT)
   - "PA" / "Production Assistant" → 11E (RUNNER)
   - "Art Director" / "Art Dept" → 10A (SET DESIGNER)
3. Keep descriptions TOPLINE/GENERIC using the existing template labels. Put specific details in the notes field.
   - ✅ ref "14A" VEHICLE RENTAL, notes: "Island buggy + driver"
   - ❌ addRow "ISLAND BUGGY / GROUND TRANSPORT" ← WRONG, this already matches 14A
   - ✅ ref "2A" CAMERA EQUIPMENT, notes: "Phase One + Broncolor kit"
   - ❌ addRow "PHASE ONE CAMERA SYSTEM" ← WRONG, matches 2A
   - ✅ ref "15C" LOCATION HIRE, notes: "Beach villa Day 1, Desert camp Day 2"
   - ❌ addRow "BEACH VILLA RENTAL" ← WRONG, matches 15C
4. Only use addRows for genuinely new items that have NO equivalent in the template — e.g. "AI image generation", "NFT minting", "influencer fee".
5. When using addRows, ALWAYS put them in the correct section number. Never add crew in equipment sections or vice versa.

JSON PATCH FORMAT:
- Update existing rows by ref: {"rows": {"1A": {"rate":"5000","days":"2","qty":"1"}, "4B": {"rate":"3000","days":"1","qty":"1"}}}
- You can update MANY rows at once. When populating a budget, set days, qty, and rate on every relevant existing ref.
- You can also set the notes field to add specifics: {"rows": {"14A": {"rate":"800","days":"2","qty":"1","notes":"Island buggy + driver"}}}
- To add NEW rows (only when no template match): {"addRows": [{"section":4, "desc":"NEW ITEM", "days":"1", "qty":"1", "rate":"2000"}]}
- You can combine "rows" and "addRows" in the same patch.
- To remove a row: {"removeRow": "4P"}
- For notes: {"notes": "..."}
- To save as a NEW version: {"saveAsVersion": "PRODUCTION ESTIMATE V2"}. NEVER overwrite — always create new.
NATURAL LANGUAGE EDIT HANDLING:
- "change to X-day shoot" / "make it a 2 day shoot" → update the "days" field on ALL relevant crew/equipment rows AND set ts.shootDays to X. Output a single JSON patch covering all affected rows.
- "make sure location covers permits for X, Y, Z" → add line items in Section 16 (Locations & Permits) for each permit type mentioned (filming permit, drone permit, road closure, etc.) with reasonable market rates.
- "but change this to..." / "actually make it..." → modify the CURRENT estimate in place. Do NOT create a new version unless the user explicitly says "save as V2" or "create new version".
- "double the crew rates" / "increase rates by 20%" → apply the multiplier to the rate field on all relevant crew rows in a single JSON patch.
- "add a second camera day" / "add an extra shoot day" → increment days on camera, lighting, grip, and related crew rows.
- "remove all styling" / "cut the wardrobe" → set rate to "0" on those rows (or use removeRow if the user explicitly says "delete").
- When the user references multiple changes in one message, combine them into a SINGLE JSON patch.

- When images are attached (PDF pages, briefs, moodboards), ANALYZE them for budget-relevant info: crew roles, equipment, locations, shoot days, talent, deliverables, post-production. Extract into a JSON patch.
- From a brief: look for project scope, deliverables, shoot dates, locations, crew, talent, equipment, post-production, explicit budget figures.
- From a moodboard: infer production requirements from visual style — studio vs location, lighting complexity, special effects, props, wardrobe scale.

BRIEF ANALYSIS & DRAFTING:
- When the user says "draft from brief", "build from brief", "populate from brief", or similar, load the attached/referenced brief and:
  1. Extract ALL budget-relevant details: shoot days, locations, crew roles, talent, equipment, deliverables, post-production, travel, catering, permits.
  2. Map each item to an existing estimate row ref where possible (photographer→1A, DOP→1B, etc.).
  3. For items not in the template, use addRows to create them in the correct section.
  4. Set realistic rates based on your rate card and regional market awareness.
  5. Output a SINGLE comprehensive JSON patch that populates the entire estimate from the brief.
  6. Summarise what you extracted and any assumptions you made.

RESPONSE STYLE:
- CRITICAL: Do NOT show your thinking, reasoning, analysis, or extraction process. No "here's what I extracted", no "key extractions", no "assumptions" lists before the JSON. The user sees the estimate update in real time — they don't need a play-by-play.
- When outputting a JSON patch, write a SHORT 1-2 sentence summary AFTER the JSON block (e.g. "Populated the full Maldives shoot — 4 shoot days, 20 crew, AED 850K total. Review the estimate and let me know if anything needs adjusting.").
- Do NOT list every line item you changed — the user can see them on the estimate.
- Keep ALL responses under 3-4 sentences max. Be concise and confident.
- Tone: warm, confident, professional — never robotic
- Never use phrases like "Great brief!", "Here's what I've extracted", "Let me analyze", "Key extractions:", "Assumptions:" — just do the work silently and confirm it's done.`;
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

// ─── BILLIE PATCH MARKERS (✓/✕ review flow) ────────────────────────────────
function buildBilliePatchMarkers(patch, preVer) {
  const markers = [];
  // Top sheet field changes
  if (patch.ts) {
    const preTs = preVer.ts || {};
    Object.keys(patch.ts).forEach(k => {
      if (patch.ts[k] !== (preTs[k] || "")) markers.push("est:ts:" + k);
    });
  }
  if (patch.notes !== undefined) markers.push("est:ts:notes");
  // Row updates by ref
  if (patch.rows) {
    Object.keys(patch.rows).forEach(ref => markers.push("est:row:" + ref));
  }
  // Added rows
  const rowsToAdd = patch.addRows ? patch.addRows : patch.addRow ? [patch.addRow] : [];
  rowsToAdd.forEach((_, i) => markers.push("est:addRow:" + i));
  // Removed row
  if (patch.removeRow) markers.push("est:removeRow:" + patch.removeRow);
  return markers;
}

function _revertBillieField(ver, marker, preSnapshot) {
  if (marker.startsWith("est:ts:")) {
    const k = marker.slice(7);
    if (!ver.ts) ver.ts = {};
    const preTs = preSnapshot.ts || {};
    ver.ts[k] = preTs[k] !== undefined ? preTs[k] : "";
  } else if (marker.startsWith("est:row:")) {
    const ref = marker.slice(8);
    const preSections = preSnapshot.sections || [];
    const curSections = ver.sections || [];
    for (const preSec of preSections) {
      const preRow = preSec.rows.find(r => r.ref === ref);
      if (preRow) {
        for (const curSec of curSections) {
          const ci = curSec.rows.findIndex(r => r.ref === ref);
          if (ci >= 0) { curSec.rows[ci] = JSON.parse(JSON.stringify(preRow)); break; }
        }
        break;
      }
    }
  } else if (marker.startsWith("est:addRow:")) {
    // Revert an added row — find and remove it (it was added at end of its section)
    const curSections = ver.sections || [];
    const preSections = preSnapshot.sections || [];
    for (let si = 0; si < curSections.length; si++) {
      const preRefs = new Set((preSections[si]?.rows || []).map(r => r.ref));
      const toRemove = curSections[si].rows.findIndex(r => !preRefs.has(r.ref));
      if (toRemove >= 0 && curSections[si].rows.length > 1) {
        curSections[si].rows.splice(toRemove, 1);
        break;
      }
    }
  } else if (marker.startsWith("est:removeRow:")) {
    // Revert a removed row — restore it from pre-snapshot
    const ref = marker.slice(14);
    const preSections = preSnapshot.sections || [];
    for (const preSec of preSections) {
      const preRow = preSec.rows.find(r => r.ref === ref);
      if (preRow) {
        const curSec = (ver.sections || []).find(s => s.num === preSec.num || s.id === preSec.id);
        if (curSec) curSec.rows.push(JSON.parse(JSON.stringify(preRow)));
        break;
      }
    }
  }
}

function revertBillieMarker(marker, preSnapshot, projectId, vIdx, setStore) {
  revertBillieMarkers([marker], preSnapshot, projectId, vIdx, setStore);
}

function revertBillieMarkers(markers, preSnapshot, projectId, vIdx, setStore) {
  setStore(prev => {
    const store = JSON.parse(JSON.stringify(prev));
    const arr = store[projectId] || [];
    const ver = arr[vIdx]; if (!ver) return store;
    markers.forEach(m => _revertBillieField(ver, m, preSnapshot));
    arr[vIdx] = ver;
    store[projectId] = arr;
    return store;
  });
}

export { buildBillieSystem, applyBilliePatch, buildBilliePatchMarkers, revertBillieMarker, revertBillieMarkers };

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
      <div onClick={()=>{const _pid=billieCtx?.projectId||billieTabs[billieTabs.length-1]?.projectId;if(_pid){const proj=localProjects?.find(p=>p.id===_pid);if(proj){const _curVs=projectEstimates?.[proj.id]||[];const _autoLbl=`V${_curVs.length+1}`;const ne={...JSON.parse(JSON.stringify(ESTIMATE_INIT)),id:Date.now()};const _pi5=(projectInfoRef.current||{})[proj.id];ne.ts={...ne.ts,version:_autoLbl,client:proj.client||"",project:_pi5?.shootName||proj.name||""};setProjectEstimates(prev=>({...prev,[proj.id]:[...(prev[proj.id]||[]),ne]}));const newIdx=_curVs.length;setBillieCtx({projectId:proj.id,vIdx:newIdx});if(setActiveEstimateVersion)setActiveEstimateVersion(newIdx);addBillieTab(proj.id,newIdx,`${proj.name} \u00b7 ${_autoLbl}`);setMsgs(prev=>[...prev,{role:"assistant",content:`Created ${_autoLbl} for ${proj.name}. What would you like to do?`}]);}}}} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:8,border:"1.5px dashed #ccc",background:"transparent",fontSize:14,color:"#999",cursor:"pointer",flexShrink:0,fontFamily:"inherit"}}>+</div>
    </div>
  );
}

/**
 * handleBillieIntent - handles Budget Billie intent detection in sendMessage.
 * Returns true if the intent was handled (caller should return), false otherwise.
 */
export async function handleBillieIntent({
  input, history, intro, agent,
  setMsgs, setInput, setLoading, setMood,
  billieCtx, setBillieCtx,
  billieTabs, setBillieTabs, addBillieTab,
  setActiveEstimateVersion,
  projectEstimates, setProjectEstimates,
  projectActuals, setProjectActuals,
  localProjects, projectFileStore,
  fuzzyMatchProject, syncProjectInfoToDocs,
  popAgentUndo, projectInfoRef, onNavigateToDoc,
  loadPdfPages,
  ESTIMATE_INIT, defaultSections,
  estSectionTotal, estRowTotal, estCalcTotals, estNum, estFmt,
  actualsSectionExpenseTotal, actualsSectionZohoTotal,
  actualsRowExpenseTotal, actualsGrandExpenseTotal, actualsGrandZohoTotal,
  buildBillieSystem, applyBilliePatch, buildBilliePatchMarkers,
  billiePendingReview, setBilliePendingReview,
  buildFinnSystem, applyFinnPatch,
  billieRateCards, setBillieRateCards, setShowBillieRates,
}) {
  if (agent.id !== "billie") return false;
  if (!projectEstimates || !setProjectEstimates) return false;

    // ── Billie: live estimate handler ──


      if(!billieCtx){
        if(!localProjects?.length){
          setMsgs([...history,{role:"assistant",content:"No projects found. Create a project first, then come back to me!"}]);
          setLoading(false);setMood("idle");return true;
        }
        const lower=input.toLowerCase();
        const num=parseInt(input.trim(),10);
        let project=null;
        if(num>=1&&num<=localProjects.length) project=localProjects[num-1];
        else project=fuzzyMatchProject(localProjects,input);
        if(!project){
          const list=localProjects.map((p,i)=>`${i+1}. ${p.name}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`Which project's estimate should I work on?\n\n${list}\n\nPick a number or name.`}]);
          setLoading(false);setMood("idle");return true;
        }
        const estVersions = projectEstimates?.[project.id] || [];
        if(estVersions.length===0){
          // Auto-create V1 estimate
          const ne={...JSON.parse(JSON.stringify(ESTIMATE_INIT)),id:Date.now()};
          const _pi5=(projectInfoRef.current||{})[project.id];ne.ts={...ne.ts,version:"V1",client:project.client||"",project:_pi5?.shootName||project.name||""};
          setProjectEstimates(prev=>({...prev,[project.id]:[...(prev[project.id]||[]),ne]}));
          setBillieCtx({projectId:project.id,vIdx:0});if(setActiveEstimateVersion)setActiveEstimateVersion(0);
          addBillieTab(project.id,0,`${project.name} · V1`);
          const logoImg=new Image();logoImg.crossOrigin="anonymous";logoImg.onload=()=>{try{const cv=document.createElement("canvas");cv.width=logoImg.naturalWidth;cv.height=logoImg.naturalHeight;cv.getContext("2d").drawImage(logoImg,0,0);const dataUrl=cv.toDataURL("image/png");setProjectEstimates(prev=>{const s=JSON.parse(JSON.stringify(prev));const arr=s[project.id]||[];if(arr.length>0&&!arr[arr.length-1].prodLogo)arr[arr.length-1].prodLogo=dataUrl;return s;});}catch{}};logoImg.src="/onna-default-logo.png";
          setMsgs([...history,{role:"assistant",content:`✓ Created a new estimate for ${project.name}. What would you like to do?`}]);
          setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
        }
        // 1+ estimates: open ALL as tabs, activate last
        estVersions.forEach((v,i)=>{addBillieTab(project.id,i,`${project.name} · ${v.ts?.version||`V${i+1}`}`);});
        const lastIdx=estVersions.length-1;
        setBillieCtx({projectId:project.id,vIdx:lastIdx});if(setActiveEstimateVersion)setActiveEstimateVersion(lastIdx);
        const lastLabel=estVersions[lastIdx].ts?.version||`V${lastIdx+1}`;
        setMsgs([...history,{role:"assistant",content:`Opened ${estVersions.length} estimate${estVersions.length>1?"s":""} for ${project.name}. Working on ${lastLabel}. What would you like to do?`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      let {projectId,vIdx}=billieCtx;
      let project=localProjects?.find(p=>p.id===projectId);
      if(!project){setBillieCtx(null);setMsgs([...history,{role:"assistant",content:"That project no longer exists. Let's start over — which project?"}]);setLoading(false);setMood("idle");return true;}

      // Close command — close doc panel without clearing chat
      if(/^\s*(close|exit|done|bye|finish)\s*$/i.test(input)){
        setBillieCtx(null);
        setMsgs([...history,{role:"assistant",content:"Closed! Let me know when you need me again."}]);
        setLoading(false);setMood("idle");return true;
      }
      // Undo command
      if(/^\s*(undo|undo that|go back|revert|command z)\s*$/i.test(input)){
        if(popAgentUndo()){setMsgs([...history,{role:"assistant",content:"Done — reverted the last change. You can undo up to 50 changes, or press ⌘Z."}]);}
        else{setMsgs([...history,{role:"assistant",content:"Nothing to undo — the undo history is empty."}]);}
        setLoading(false);setMood("idle");return true;
      }

      // Rate card command
      if(/\b(rate\s*card|show\s*rates|manage\s*rates|edit\s*rates|open\s*rates|my\s*rates)\b/i.test(input)){
        if(setShowBillieRates) setShowBillieRates(true);
        setMsgs([...history,{role:"assistant",content:"Opening your rate card — add or edit your default rates there. I'll use them whenever I populate estimates."}]);
        setLoading(false);setMood("idle");return true;
      }

      // Inline rate rule: "rule = child models rate 2500" / "set X rate to Y" / "X rate is Y" / "X = Y aed"
      {const _ruleMatch = input.match(/(?:rule\s*=\s*(.+?)\s+rate\s+(\d[\d,]*)|set\s+(.+?)\s+rate\s+(?:to\s+)?(\d[\d,]*)|(.+?)\s+rate\s+is\s+(\d[\d,]*)|(.+?)\s*=\s*(\d[\d,]*)\s*(aed|usd|gbp|eur|sar))/i);
      if(_ruleMatch && setBillieRateCards){
        const role = (_ruleMatch[1]||_ruleMatch[3]||_ruleMatch[5]||_ruleMatch[7]||"").trim();
        const rate = (_ruleMatch[2]||_ruleMatch[4]||_ruleMatch[6]||_ruleMatch[8]||"").replace(/,/g,"");
        const currency = (_ruleMatch[9]||"AED").toUpperCase();
        if(role && rate){
          const formatted = role.split(/\s+/).map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(" ");
          const loc = currency === "GBP" ? "London" : currency === "USD" ? "US" : "Dubai";
          setBillieRateCards(prev => {
            const cards = Array.isArray(prev) ? { Dubai: prev } : (prev || {});
            const locRates = cards[loc] || [];
            const existing = locRates.findIndex(r => r.role.toLowerCase() === formatted.toLowerCase());
            if (existing >= 0) {
              const updated = [...locRates];
              updated[existing] = { ...updated[existing], rate, currency };
              return { ...cards, [loc]: updated };
            }
            return { ...cards, [loc]: [...locRates, { id: Date.now(), role: formatted, rate, currency, per: "day", notes: "" }] };
          });
          setMsgs([...history,{role:"assistant",content:`Saved **${formatted}** at ${currency} ${Number(rate).toLocaleString()}/day to your ${loc} rate card.`}]);
          setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
        }
      }}

      // Rename via chat
      {const _rm=input.match(/\b(?:rename|call it|name it|title it)\s+(?:to\s+)?["']?(.+?)["']?\s*$/i);
      if(_rm&&_rm[1]){const newLabel=_rm[1].trim();const estVersions_rn=projectEstimates?.[projectId]||[];const rIdx=Math.min(vIdx,estVersions_rn.length-1);if(rIdx>=0&&estVersions_rn[rIdx]){setProjectEstimates(prev=>{const s=JSON.parse(JSON.stringify(prev));s[projectId][rIdx].ts={...(s[projectId][rIdx].ts||{}),version:newLabel};return s;});setBillieTabs(prev=>prev.map(t=>t.projectId===projectId&&t.vIdx===rIdx?{...t,label:`${project.name} · ${newLabel}`}:t));setMsgs([...history,{role:"assistant",content:`✓ Renamed to "${newLabel}".`}]);setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;}}}

      // Navigate to budget list view
      if(onNavigateToDoc&&(/\b(show|list|see|view|open|manage|go\s*to)\b.*\b(budgets?|estimates?)\b/i.test(input)||/\b(budgets?|estimates?)\b.*\b(show|list|see|view|open|manage|go\s*to)\b/i.test(input))){
        onNavigateToDoc(project,"Budget","estimates");
        setMsgs([...history,{role:"assistant",content:"Taking you to your budgets now!"}]);setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      const lower=input.toLowerCase();
      // Skip project matching when user has attachments, is referencing briefs, or input is clearly an action on the current estimate
      const _hasAttachments = history[history.length-1]?._attachments?.length > 0;
      const _isBriefIntent = /\b(brief|moodboard|mood\s*board|reference\s*board)\b/i.test(input);
      const _isActionIntent = /\b(update|set|add|remove|change|row|section|header|rate|qty|days|notes|payment|deliverable|photographer|shoot|location|date|populate|draft|build|create|fill|yes|yeah|yep|sure|go\s*ahead|do\s*it|proceed|ok|okay|please|make|put|total|subtotal|calculate|recalculate|adjust|edit|modify|apply|save|export|pdf|print|download|undo|revert)\b/i.test(input);
      const _isShortReply = input.trim().split(/\s+/).length <= 4 && !/\b(switch|change|different|open|go\s*to)\s+(project|budget)\b/i.test(input);
      const _skipProjectMatch = _hasAttachments || _isBriefIntent || _isActionIntent || _isShortReply;
      // Check if user is re-selecting the same project (e.g. typing "columbia" when already on columbia)
      const sameProjectMatch=(!_skipProjectMatch) ? fuzzyMatchProject(localProjects,input) : null;
      if(sameProjectMatch && sameProjectMatch.id===projectId && !lower.match(/\b(update|set|add|remove|change|row|section|header|rate|qty|days|notes|payment|deliverable|photographer|shoot|location|date)\b/i)){
        const reVersions=projectEstimates?.[projectId]||[];
        if(reVersions.length<=1){
          setBillieCtx({projectId,vIdx:0});if(setActiveEstimateVersion)setActiveEstimateVersion(0);
          const vLabel=reVersions[0]?.ts?.version||"V1";
          setMsgs([...history,{role:"assistant",content:`Got it — I'm on ${project.name} (${vLabel}). What would you like to do?`}]);
        }else{
          setBillieCtx({projectId,pendingVersion:true});
          const list=reVersions.map((v,i)=>`• ${v.ts?.version||`V${i+1}`}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`${project.name} has multiple estimate versions:\n\n${list}\n\nWhich version should I work on? Or say "create new" to start a fresh estimate.`}]);
        }
        setLoading(false);setMood("idle");return true;
      }
      const switchProject=(!_skipProjectMatch) ? fuzzyMatchProject(localProjects,input,projectId) : null;
      if(switchProject){
        const swVersions=projectEstimates?.[switchProject.id]||[];
        if(swVersions.length===0){
          const _swNe={...JSON.parse(JSON.stringify(ESTIMATE_INIT)),id:Date.now()};
          const _swPi=(projectInfoRef.current||{})[switchProject.id];_swNe.ts={..._swNe.ts,version:"V1",client:switchProject.client||"",project:_swPi?.shootName||switchProject.name||""};
          setProjectEstimates(prev=>({...prev,[switchProject.id]:[...(prev[switchProject.id]||[]),_swNe]}));
          setBillieCtx({projectId:switchProject.id,vIdx:0});if(setActiveEstimateVersion)setActiveEstimateVersion(0);
          addBillieTab(switchProject.id,0,`${switchProject.name} · V1`);
          setMsgs([...history,{role:"assistant",content:`Created V1 estimate for ${switchProject.name}. What would you like to do?`}]);
        }else if(swVersions.length===1){
          setBillieCtx({projectId:switchProject.id,vIdx:0});if(setActiveEstimateVersion)setActiveEstimateVersion(0);
          setMsgs([...history,{role:"assistant",content:`Switched to ${switchProject.name} (${swVersions[0].ts?.version||"V1"}). What would you like to do?`}]);
        }else{
          setBillieCtx({projectId:switchProject.id,pendingVersion:true});
          const list=swVersions.map((v,i)=>`${i+1}. ${v.ts?.version||`V${i+1}`}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`${switchProject.name} has ${swVersions.length} estimates:\n\n${list}\n\nPick one by number/name, or say **new**.`}]);
        }
        setLoading(false);setMood("idle");return true;
      }

      // Export / PDF intent
      if(/\b(export|pdf|download|print)\b/i.test(input)&&/\b(estimate|budget|pdf|export|download|print|document|doc)\b/i.test(input)){
        const el=document.getElementById("onna-est-print");
        if(el){
          window.dispatchEvent(new CustomEvent('onna-export-estimate'));
          setMsgs([...history,{role:"assistant",content:"Opening the print dialog for the full estimate (all tabs) now — save it as PDF from there!"}]);
        }else{
          setMsgs([...history,{role:"assistant",content:"No estimate is currently open to export. Make sure you're viewing the estimate first!"}]);
        }
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      if(/\b(new|create)\s+(estimate|version)\b/i.test(input)||/\bcreate\s+new\b/i.test(input)){
        const _curVersions=projectEstimates?.[projectId]||[];
        const _nextNum=_curVersions.length+1;
        const _autoLabel=`V${_nextNum}`;
        const _newEst={...JSON.parse(JSON.stringify(ESTIMATE_INIT)),id:Date.now()};
        const _pi6=(projectInfoRef.current||{})[projectId];_newEst.ts={..._newEst.ts,version:_autoLabel,client:project.client||"",project:_pi6?.shootName||project.name||""};
        setProjectEstimates(prev=>({...prev,[projectId]:[...(prev[projectId]||[]),_newEst]}));
        const _newIdx=_curVersions.length;
        setBillieCtx({projectId,vIdx:_newIdx});if(setActiveEstimateVersion)setActiveEstimateVersion(_newIdx);
        addBillieTab(projectId,_newIdx,`${project.name} · ${_autoLabel}`);
        setMsgs([...history,{role:"assistant",content:`✓ Created ${_autoLabel} for ${project.name}. What would you like to do?`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      if(/\b(switch|change|different|new)\s+(project|budget)\b/i.test(input)){
        setBillieCtx(null);
        const list=localProjects.map((p,i)=>`${i+1}. ${p.name}`).join("\n");
        setMsgs([...history,{role:"assistant",content:`Sure! Which project's estimate should I work on?\n\n${list}`}]);
        setLoading(false);setMood("idle");return true;
      }

      // ── Mirror / copy budget from another project ──
      const _mirrorMatch = /\b(mirror|copy|duplicate|replicate|base it on|use the budget from|pull the budget from|same as)\b/i.test(input);
      if(_mirrorMatch){
        const sourceProject = fuzzyMatchProject(localProjects, input, projectId);
        if(!sourceProject){
          const list = localProjects.filter(p=>p.id!==projectId).map((p,i)=>`${i+1}. ${p.name}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`Which project's budget should I mirror from?\n\n${list}\n\nPick a number or name.`}]);
          setLoading(false);setMood("idle");return true;
        }
        const sourceVersions = projectEstimates?.[sourceProject.id] || [];
        if(sourceVersions.length===0){
          setMsgs([...history,{role:"assistant",content:`${sourceProject.name} doesn't have any estimates yet — nothing to mirror.`}]);
          setLoading(false);setMood("idle");return true;
        }
        // If multiple versions, use the latest (could ask, but keep it simple)
        const srcIdx = sourceVersions.length - 1;
        const srcVer = sourceVersions[srcIdx];
        const srcLabel = srcVer.ts?.version || `V${srcIdx+1}`;
        const srcSections = srcVer.sections || defaultSections();
        const srcTs = srcVer.ts || {};
        let srcSnap = `Version: ${srcTs.version||"V1"} | Client: ${srcTs.client||""} | Project: ${srcTs.project||""}\n`;
        srcSnap += `Shoot Date: ${srcTs.shootDate||""} | Days: ${srcTs.shootDays||""} | Location: ${srcTs.location||""}\n`;
        srcSnap += "Sections:\n";
        srcSections.forEach(sec => {
          const secT = estSectionTotal(sec);
          if (secT > 0 || sec.rows.some(r => estNum(r.rate) > 0)) {
            srcSnap += `  ${sec.num}. ${sec.title} — ${estFmt(secT)}\n`;
            sec.rows.forEach(r => {
              const rt = estRowTotal(r);
              if (rt > 0) srcSnap += `    ${r.ref}: ${r.desc} | days:${r.days} qty:${r.qty} rate:${r.rate}\n`;
            });
          }
        });
        const { subtotal: srcSub, feesTotal: srcFees, grandTotal: srcGt } = estCalcTotals(srcSections);
        srcSnap += `Subtotal: ${estFmt(srcSub)} | Fees: ${estFmt(srcFees)} | Grand Total: ${estFmt(srcGt)}\n`;
        // Inject into billie context so it gets added to system prompt
        setBillieCtx(prev=>({...prev,_mirrorSnap:srcSnap,_mirrorProject:sourceProject.name,_mirrorLabel:srcLabel}));
        // Don't return — fall through to normal Billie send with the enriched system prompt
      }

      // ── Detect expense/actuals intent → route to actuals handler ──
      const _isExpenseIntent = /\b(expense|actual|actuals|zoho|spend|spent|cost|paid|invoice|invoiced|overrun|variance|log\s+.*(expense|cost|payment)|track\s+.*(actual|spend|expense)|status.*(paid|pending|invoiced))\b/i.test(input);
      if(_isExpenseIntent&&projectActuals&&setProjectActuals){
        const actSections = projectActuals[project.id] || [];
        let actSnap = `Project: ${project.name}\nSections:\n`;
        actSections.forEach((sec, si) => {
          const secExpTotal = actualsSectionExpenseTotal(sec);
          const secZoho = actualsSectionZohoTotal(sec);
          if (secExpTotal > 0 || secZoho > 0 || sec.rows.some(r => (r.expenses||[]).length > 0 || estNum(r.zohoAmount) > 0)) {
            actSnap += `  [secIdx:${si}] ${sec.num||si+1}. ${sec.title} — Expenses: AED ${estFmt(secExpTotal)} | Zoho: AED ${estFmt(secZoho)}\n`;
            sec.rows.forEach((r, ri) => {
              const rExp = actualsRowExpenseTotal(r);
              actSnap += `    [secIdx:${si},rowIdx:${ri}] ${r.ref||""}: ${r.desc||"(empty)"} | zohoAmount:${r.zohoAmount||"0"} | status:${r.status||"(none)"} | expenses(${(r.expenses||[]).length}): AED ${estFmt(rExp)}\n`;
              (r.expenses||[]).forEach((e, ei) => {
                actSnap += `      [expenseIdx:${ei}] vendor:${e.vendor||""} amount:${e.amount||"0"} date:${e.date||""} note:${e.note||""}\n`;
              }); });
          } else {
            actSnap += `  [secIdx:${si}] ${sec.num||si+1}. ${sec.title} — (no expenses yet)\n`;
          }
        });
        const grandExp = actualsGrandExpenseTotal(actSections);
        const grandZoho = actualsGrandZohoTotal(actSections);
        actSnap += `Grand Total Expenses: AED ${estFmt(grandExp)} | Grand Total Zoho: AED ${estFmt(grandZoho)}\n`;
        let estTotals = "";
        const _estVers = projectEstimates?.[project.id] || [];
        if (_estVers.length > 0) {
          const latestEst = _estVers[_estVers.length - 1];
          const _estSecs = latestEst.sections || [];
          const { subtotal: _sub, feesTotal: _fees, grandTotal: estGT } = estCalcTotals(_estSecs);
          estTotals = `Estimate Grand Total: AED ${estFmt(estGT)} | Subtotal: AED ${estFmt(_sub)} | Fees: AED ${estFmt(_fees)}\nVariance (Estimate - Actuals): AED ${estFmt(estGT - grandExp)}`;
        }
        const _expSystem = buildFinnSystem(project, actSnap, estTotals);
        setMsgs(history);setInput("");setLoading(true);setMood("thinking");
        try{
          const billieIntro = intro;
          const apiMessages=history.map((m,mi)=>{
            if(m.role==="assistant"){if(mi===0) return{role:m.role,content:billieIntro};return{role:m.role,content:typeof m.content==="string"?m.content:""};}
            return{role:m.role,content:m.content};
          });
          const res=await fetch(`/api/agents/${agent.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:_expSystem,messages:apiMessages})});
          if(!res.ok){const e=await res.json().catch(()=>({error:`HTTP ${res.status}`}));setMsgs(p=>[...p,{role:"assistant",content:`Error: ${e.error||"Unknown"}`}]);setLoading(false);setMood("idle");return true;}
          const reader=res.body.getReader();const decoder=new TextDecoder();let fullText="";let buffer="";
          while(true){const{done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.startsWith("data: "))continue;const raw=line.slice(6).trim();if(!raw||raw==="[DONE]")continue;try{const ev=JSON.parse(raw);if(ev.type==="content_block_delta"&&ev.delta?.type==="text_delta"){fullText+=ev.delta.text;setMsgs([...history,{role:"assistant",content:_stripJsonBlocks(_stripThinking(fullText))}]);}}catch{}}}
          fullText=_stripThinking(fullText);
          const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
          if(jsonMatch){
            try{
              const patch = JSON.parse(jsonMatch[1].trim());
              applyFinnPatch(patch, project.id, projectActuals, setProjectActuals);
              const cleanText = fullText.replace(/```json[\s\S]*?```/g,"").trim();
              setMsgs([...history,{role:"assistant",content:(cleanText?cleanText+"\n\n":"")+"✓ Budget tracker updated."}]);
            }catch(pe){setMsgs([...history,{role:"assistant",content:fullText+"\n\n⚠️ Could not parse patch: "+pe.message}]);}
          }else{setMsgs([...history,{role:"assistant",content:fullText||"Hmm, something went wrong!"}]);}
          setMood("excited");setTimeout(()=>setMood("idle"),2500);
        }catch(err){setMsgs(p=>[...p,{role:"assistant",content:`Oops! ${err.message}`}]);setMood("idle");}
        setLoading(false);return true;
      }

      const estVersions = projectEstimates?.[project.id] || [];
      if(estVersions.length===0){
        setMsgs([...history,{role:"assistant",content:`No estimates for ${project.name} yet. Say "create new" or use the Estimates folder to create one first!`}]);
        setLoading(false);setMood("idle");return true;
      }
      vIdx = Math.min(vIdx, estVersions.length-1);
      const ver = estVersions[vIdx];
      const vLabel = ver.ts?.version || `V${vIdx+1}`;
      const vSections = ver.sections || defaultSections();
      const vTs = ver.ts || ESTIMATE_INIT.ts;

      let snap = `Version: ${vTs.version||"V1"} | Date: ${vTs.date||"(empty)"} | Client: ${vTs.client||"(empty)"} | Project: ${vTs.project||"(empty)"}\n`;
      snap += `Photographer: ${vTs.photographer||"(empty)"} | Deliverables: ${vTs.deliverables||"(empty)"}\n`;
      snap += `Shoot Date: ${vTs.shootDate||"(empty)"} | Days: ${vTs.shootDays||"(empty)"} | Hours: ${vTs.shootHours||"(empty)"} | Location: ${vTs.location||"(empty)"}\n`;
      snap += `Payment: ${vTs.payment||"(empty)"}\n`;
      snap += "Sections:\n";
      vSections.forEach(sec => {
        const secT = estSectionTotal(sec);
        if (secT > 0 || sec.rows.some(r => estNum(r.rate) > 0)) {
          snap += `  ${sec.num}. ${sec.title} — AED ${estFmt(secT)}\n`;
          sec.rows.forEach(r => {
            const rt = estRowTotal(r);
            if (rt > 0) snap += `    ${r.ref}: ${r.desc} | days:${r.days} qty:${r.qty} rate:${r.rate} = AED ${estFmt(rt)}\n`;
          });
        }
      });
      const { subtotal, feesTotal, grandTotal: gt } = estCalcTotals(vSections);
      const bCur = ver.currency || "AED";
      const bCur2 = ver.currency2 || "USD";
      snap += `Subtotal: ${bCur} ${estFmt(subtotal)} | Fees: ${bCur} ${estFmt(feesTotal)} | Grand Total: ${bCur} ${estFmt(gt)} | VAT: ${bCur} ${estFmt(gt*0.05)} | Total inc VAT: ${bCur} ${estFmt(gt*1.05)}\n`;
      snap += `Base currency: ${bCur} | Secondary currency: ${bCur2}\n`;
      if(vTs.notes) snap += `Notes: ${vTs.notes}\n`;

      // ── "check the brief / moodboard" auto-detect ──
      const _pendingPick=billieCtx._pendingFilePick;
      if(_pendingPick){
        const pickNum=parseInt(input.trim(),10);
        const _pickFiles=(projectFileStore[projectId]||{})[_pendingPick]||[];
        if(pickNum>=1&&pickNum<=_pickFiles.length){
          const chosen=_pickFiles[pickNum-1];
          try{
            let injected=[];
            if(chosen.type==="application/pdf"||chosen.name?.toLowerCase().endsWith(".pdf")){
              const pages=await loadPdfPages(chosen.dataUrl);
              const capped=pages.slice(0,10);
              if(pages.length>10) setMsgs(prev=>[...prev.slice(0,-1),{...prev[prev.length-1]},{role:"assistant",content:`PDF has ${pages.length} pages — using first 10 for analysis.`}]);
              injected=capped.map((pg,i)=>({name:`${chosen.name}_p${i+1}`,type:"image/jpeg",dataUrl:pg}));
            }else{
              injected=[{name:chosen.name,type:chosen.type||"image/jpeg",dataUrl:chosen.dataUrl}];
            }
            if(injected.length){const lastUser=history.findLast(m=>m.role==="user");if(lastUser)lastUser._attachments=(lastUser._attachments||[]).concat(injected);}
            setBillieCtx(prev=>({...prev,_pendingFilePick:undefined}));
          }catch(err){setMsgs([...history,{role:"assistant",content:`Failed to load file: ${err.message}`}]);setLoading(false);setMood("idle");return true;}
        }else{
          setMsgs([...history,{role:"assistant",content:`Please pick a number between 1 and ${_pickFiles.length}.`}]);
          setLoading(false);setMood("idle");return true;
        }
      }
      const _briefMatch=input.match(/\b(check|read|pull|use|load|look at|analyze|review|build from|build off|reference|draft from|populate from|create from)\b.*\b(brief|moodboard|mood board|reference board|moodboards|briefs)\b/i)||(input.match(/\b(brief|moodboard|mood board|reference board)\b/i)&&!/\b(create|write|make)\b/i.test(input))||(/\b(draft|populate|build)\b.*\b(from|off|using)\b.*\b(brief|moodboard)\b/i.test(input));
      if(_briefMatch&&!_pendingPick){
        const _isMood=/\b(moodboard|mood board|reference board)\b/i.test(input);
        const _cat=_isMood?"moodboards":"briefs";
        const _files=(projectFileStore[projectId]||{})[_cat]||[];
        if(_files.length===0){
          setMsgs([...history,{role:"assistant",content:`No ${_cat} found in the Creative folder for ${project.name}. Upload one there or attach directly with 📎`}]);
          setLoading(false);setMood("idle");return true;
        }else if(_files.length===1){
          const chosen=_files[0];
          try{
            let injected=[];
            if(chosen.type==="application/pdf"||chosen.name?.toLowerCase().endsWith(".pdf")){
              const pages=await loadPdfPages(chosen.dataUrl);
              const capped=pages.slice(0,10);
              if(pages.length>10) setMsgs(m=>[...m,{role:"assistant",content:`PDF has ${pages.length} pages — using first 10 for analysis.`}]);
              injected=capped.map((pg,i)=>({name:`${chosen.name}_p${i+1}`,type:"image/jpeg",dataUrl:pg}));
            }else{
              injected=[{name:chosen.name,type:chosen.type||"image/jpeg",dataUrl:chosen.dataUrl}];
            }
            if(injected.length){const lastUser=history.findLast(m=>m.role==="user");if(lastUser)lastUser._attachments=(lastUser._attachments||[]).concat(injected);}
          }catch(err){setMsgs([...history,{role:"assistant",content:`Failed to load ${_cat.slice(0,-1)}: ${err.message}`}]);setLoading(false);setMood("idle");return true;}
        }else{
          const list=_files.map((f,i)=>`${i+1}. ${f.name}`).join("\n");
          setBillieCtx(prev=>({...prev,_pendingFilePick:_cat}));
          setMsgs([...history,{role:"assistant",content:`Found ${_files.length} ${_cat}:\n\n${list}\n\nWhich one should I use? Pick a number.`}]);
          setLoading(false);setMood("idle");return true;
        }
      }

      let billieSystem = buildBillieSystem(project, ver, vLabel, snap, bCur, bCur2, billieRateCards || []);
      // Inject mirror/reference estimate if present
      if(billieCtx._mirrorSnap){
        billieSystem += `\n\nREFERENCE ESTIMATE (from "${billieCtx._mirrorProject}" — ${billieCtx._mirrorLabel}):\n${billieCtx._mirrorSnap}\nThe user wants to mirror/adapt this budget. Map line items to existing refs where possible, add new rows for items not in the template. Adjust rates/days/qty as instructed.`;
        setBillieCtx(prev=>{const{_mirrorSnap,_mirrorProject,_mirrorLabel,...rest}=prev;return rest;});
      }

      setMsgs(history);setInput("");setLoading(true);setMood("thinking");
      try{
        const billieIntro = intro;
        const apiMessages=history.map((m,mi)=>{
          if(m.role==="assistant"){
            if(mi===0) return{role:m.role,content:billieIntro};
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
        const res=await fetch(`/api/agents/${agent.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:billieSystem,messages:apiMessages})});
        if(!res.ok){const e=await res.json().catch(()=>({error:`HTTP ${res.status}`}));setMsgs(p=>[...p,{role:"assistant",content:`Error: ${e.error||"Unknown"}`}]);setLoading(false);setMood("idle");return true;}
        const reader=res.body.getReader();const decoder=new TextDecoder();let fullText="";let buffer="";
        while(true){const{done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.startsWith("data: "))continue;const raw=line.slice(6).trim();if(!raw||raw==="[DONE]")continue;try{const ev=JSON.parse(raw);if(ev.type==="content_block_delta"&&ev.delta?.type==="text_delta"){fullText+=ev.delta.text;setMsgs([...history,{role:"assistant",content:_stripJsonBlocks(_stripThinking(fullText))}]);}}catch{}}}
        fullText=_stripThinking(fullText);

        const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
        if(jsonMatch){
          try{
            const patch = JSON.parse(jsonMatch[1].trim());
            const cleanText = fullText.replace(/```json[\s\S]*?```/g,"").trim();
            // For saveAsVersion, skip review flow
            if (patch.saveAsVersion) {
              const newIdx = applyBilliePatch(patch, project.id, vIdx, estVersions, setProjectEstimates);
              setTimeout(()=>syncProjectInfoToDocs(project.id),100);
              if (newIdx !== vIdx) {
                setBillieCtx(prev => ({...prev, vIdx: newIdx}));
                if(setActiveEstimateVersion)setActiveEstimateVersion(newIdx);
              }
              setMsgs([...history,{role:"assistant",content:(cleanText?cleanText+"\n\n":"")+`✓ Saved as new version: ${patch.saveAsVersion}`}]);
            } else {
              // Build markers for review
              const existingReview = billiePendingReview && billiePendingReview.projectId===project.id && billiePendingReview.vIdx===vIdx ? billiePendingReview : null;
              const preSnapshot = existingReview ? existingReview.preSnapshot : JSON.parse(JSON.stringify(ver));
              const newMarkers = buildBilliePatchMarkers(patch, ver);
              const newIdx = applyBilliePatch(patch, project.id, vIdx, estVersions, setProjectEstimates);
              setTimeout(()=>syncProjectInfoToDocs(project.id),100);
              if (newMarkers.length > 0 && setBilliePendingReview) {
                const mergedMarkers = existingReview ? [...new Set([...existingReview.markers, ...newMarkers])] : newMarkers;
                setBilliePendingReview({ preSnapshot, markers: mergedMarkers, projectId: project.id, vIdx });
                setMsgs([...history,{role:"assistant",content:(cleanText||"Changes applied.")+"\n\nReview the highlighted changes on the left — ✓ to keep, ✕ to revert."}]);
              } else if (existingReview && existingReview.markers.length > 0) {
                setMsgs([...history,{role:"assistant",content:(cleanText||"Done.")+"\n\nYou still have pending changes to review on the left."}]);
              } else {
                setMsgs([...history,{role:"assistant",content:(cleanText?cleanText+"\n\n":"")+"✓ Estimate updated."}]);
              }
            }
          }catch(pe){
            setMsgs([...history,{role:"assistant",content:fullText+"\n\n⚠️ Could not parse patch: "+pe.message}]);
          }
        }else{
          setMsgs([...history,{role:"assistant",content:fullText||"Hmm, something went wrong!"}]);
        }
        setMood("excited");setTimeout(()=>setMood("idle"),2500);
      }catch(err){setMsgs(p=>[...p,{role:"assistant",content:`Oops! ${err.message}`}]);setMood("idle");}
      setLoading(false);return true;

  return false;
}

