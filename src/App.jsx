import React, { useState, useMemo, useEffect, useRef, useCallback, Fragment, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import Information from "./components/Information";
import Dashboard from "./components/Dashboard";
import Agents from "./components/Agents";
import Vendors from "./components/Vendors";
import Clients from "./components/Clients";
import ProjectsTab from "./components/Projects";
import Finance from "./components/Finance";
import Resources from "./components/Resources";
import Schedule from "./components/project/Schedule";
import Styling from "./components/project/Styling";
import Casting from "./components/project/Casting";
import Locations from "./components/project/Locations";
import Travel from "./components/project/Travel";
import Documents from "./components/project/Documents";
import Budget from "./components/project/Budget";
import Creative from "./components/project/Creative";
import VendorVinnieCard, { useVinnieCard, handleVinnieIntent } from "./components/agents/VendorVinnie";
import { buildConnieSystem, applyConniePatch, buildConniePatchMarkers, revertConnieMarker, revertConnieMarkers, ConnieTabBar, handleConnieIntent } from "./components/agents/CallSheetConnie";
import { buildRonnieSystem, applyRonniePatch, buildPatchMarkers, revertMarker, RonnieTabBar, handleRonnieIntent } from "./components/agents/RiskAssessmentRonnie";
import { buildBillieSystem, applyBilliePatch, handleBillieIntent } from "./components/agents/BudgetBillie";
import { CONTRACT_INIT, migrateContract, CONTRACT_TYPE_IDS, CONTRACT_TYPE_LABELS, CONTRACT_FIELDS, CONTRACT_DOC_TYPES, GENERAL_TERMS_DOC, buildCodySystem, applyCodyPatch, handleCodyIntent } from "./components/agents/ContractCody";
import { buildCarrieSystem, applyCarriePatch, handleCarrieIntent } from "./components/agents/CastingCarrie";
import { handlePerryIntent } from "./components/agents/PostProducerPerry";
import { handleLillieIntent } from "./components/agents/LocationLillie";
import { handlePollyIntent } from "./components/agents/ProducerPolly";
import { handleTabbyIntent } from "./components/agents/TalentTabby";
import { TI_FLIGHT_COLS, TI_CAR_COLS, TI_HOTEL_COLS, TI_ROOMING_COLS, TI_MOVEMENT_COLS, tiMkMove, tiMkDay, TRAVEL_ITINERARY_INIT, handleTinaIntent } from "./components/agents/TravelTina";
import { ProjectProvider, useProject } from "./context/ProjectContext";
import { VendorLeadProvider, useVendorLead } from "./context/VendorLeadContext";
import { AgentProvider, useAgentStore } from "./context/AgentContext";
import { UIProvider, useUI } from "./context/UIContext";
import { T, idbGet, idbSet, ensurePdfJs, loadPdfPages, _loadImg, _scanWhiteTop, processDocSignStamp, renderHtmlToDocPages, exportDocPreview, estFmt, estNum, estRowTotal, estSectionTotal, estCalcTotals, PRINT_CLEANUP_CSS, PRINT_CLEANUP_SCRIPT, buildActualsFromEstimate, actualsRowExpenseTotal, actualsRowEffective, actualsSectionExpenseTotal, actualsSectionEffective, actualsSectionZohoTotal, actualsGrandExpenseTotal, actualsGrandEffective, actualsGrandZohoTotal, api, docApi, globalApi, configApi, GCAL_CLIENT_ID, getToken, debouncedDocSave, debouncedGlobalSave, debouncedConfigSave, flushAllSaves, setSaveStatusCallback, LEAD_CATEGORIES, VENDORS_CATEGORIES, BB_LOCATIONS, OUTREACH_STATUSES, OUTREACH_STATUS_LABELS, MONTHS, GCAL_COLORS, OUTLOOK_CAL_ICS, PROJECT_SECTIONS, CONTRACT_TYPES, ACTUALS_STATUSES, TAB_SLUGS, SLUG_TO_TAB, SECTION_SLUGS, SLUG_TO_SECTION, buildPath, parseURL, parseICS, levenshtein, findSimilar, findAllSimilar, parseQuickEntry, detectFieldKey, findVendorOrLead, fuzzyMatchProject, exportToPDF, printCallSheetPDF, printRiskAssessmentPDF, downloadCSV, exportTablePDF, exportCastingPDF, buildDocHTML, buildContractHTML, _parseDate, formatDate, getMonthLabel, VAULT_SALT, VAULT_CHECK, vaultDeriveKey, vaultEncrypt, vaultDecrypt, defaultSections } from "./utils/helpers";
import { VINNIE_SYSTEM } from "./prompts/vinnie";
import { CONNIE_SYSTEM } from "./prompts/connie";
import { RONNIE_SYSTEM } from "./prompts/ronnie";
import { BILLIE_SYSTEM } from "./prompts/billie";
import { CODY_SYSTEM } from "./prompts/cody";
import { CARRIE_SYSTEM } from "./prompts/carrie";
import { TINA_SYSTEM } from "./prompts/tina";
import { TABBY_SYSTEM } from "./prompts/tabby";
import { POLLY_SYSTEM } from "./prompts/polly";
import { LILLIE_SYSTEM } from "./prompts/lillie";
import { PERRY_SYSTEM } from "./prompts/perry";
import { MobileMenu } from "./components/modals/MobileMenu";
import { LeadModal } from "./components/modals/LeadModal";
import { OutreachModal } from "./components/modals/OutreachModal";
import { ProjectPickerModal } from "./components/modals/ProjectPickerModal";
import { DragToProjectModal } from "./components/modals/DragToProjectModal";
import { TodoModal } from "./components/modals/TodoModal";
import { AddProjectModal } from "./components/modals/AddProjectModal";
import { FromTemplateModal } from "./components/modals/FromTemplateModal";
import { AddLeadModal } from "./components/modals/AddLeadModal";
import { AddVendorModal } from "./components/modals/AddVendorModal";
import { RateCardModal } from "./components/modals/RateCardModal";
import { EditVendorModal } from "./components/modals/EditVendorModal";
import { CategoryManagerModal } from "./components/modals/CategoryManagerModal";
import { DuplicateCallSheetModal } from "./components/modals/DuplicateCallSheetModal";
import { DuplicateRAModal } from "./components/modals/DuplicateRAModal";
import { GenericDuplicateModal } from "./components/modals/GenericDuplicateModal";
import { ArchiveModal } from "./components/modals/ArchiveModal";
import { TimeoutWarning, GlobalAlertModal, UndoToast } from "./components/modals/MiniModals";
// Doc helper components & constants
import { MAX_IMG_SIZE, validateImg, CS_FONT, CS_LS, CS_YELLOW, RA_FONT, RA_LS, RA_LS_HDR, RA_GREY, CT_FONT, CT_LS, CT_LS_HDR, CSEditField, SignaturePad, CSEditTextarea, CSLogoSlot, CSResizableImage, CSXbtn, CSAddBtn, TIHl, TICell, TITableSection, DIETARY_TAGS, DIETARY_TAG_COLORS, DietaryTagSelect, DIETARY_INIT, EST_F, EST_LS, EST_LS_HDR, EST_YELLOW, EstHl, EstCell, EstSignaturePad, EST_SA_FIELDS, DEFAULT_TCS, ESTIMATE_INIT, CALLSHEET_INIT } from "./components/ui/DocHelpers";
// Doc components
import CPSPolly from "./components/docs/CPSPolly";
import ShotListPolly from "./components/docs/ShotListPolly";
import LocationsConnie from "./components/docs/LocationsConnie";
import CastingConnie from "./components/docs/CastingConnie";
import StoryboardPolly from "./components/docs/StoryboardPolly";
import PostPolly from "./components/docs/PostPolly";
import CastingTableConnie from "./components/docs/CastingTableConnie";
import FittingConnie from "./components/docs/FittingConnie";
// Seed data
import { SEED_LEADS, SEED_CLIENTS, SEED_PROJECTS, initVendors, initOutreach, savedCallSheets, savedRiskAssessments } from "./data/initVendors";
// Agent components
import AgentCard from "./components/agents/AgentCard";
import EstimateView from "./components/agents/EstimateView";
// Shared UI components
import { Badge, Pill, StatCard, TH, TD, SearchBar, Sel, OutreachBadge, THFilter, SectionBtn, UploadZone, BtnPrimary, BtnSecondary, BtnExport, renderSopMarkdown, AIDocPanel, DashNotes, ProjectTodoList } from "./components/ui/SharedUI";
// Extracted handler modules
import { doLogin as _doLogin, doResetRequest as _doResetRequest, doResetConfirm as _doResetConfirm, pushNav, changeTab as _changeTab, navigateToDoc as _navigateToDoc, addTodoFromInput as _addTodoFromInput, archiveItem as _archiveItem, restoreItem as _restoreItem, permanentlyDelete as _permanentlyDelete, processProjectAI as _processProjectAI, fetchGCalEvents as _fetchGCalEvents, fetchOutlookCal as _fetchOutlookCal, connectGCal as _connectGCal, doHydrateProject } from "./handlers/projectHandlers";
import { processOutreach as _processOutreach, promoteToClient as _promoteToClient, addNewOption as _addNewOption, pruneCustom, deleteCat as _deleteCat, renameCat as _renameCat } from "./handlers/vendorHandlers";
import { syncProjectInfoToDocs as _syncProjectInfoToDocs, generateContract as _generateContract, getProjectCastingTables as _getProjectCastingTablesFn, getProjectCasting as _getProjectCastingFn, addCastingTable as _addCastingTable, addCastingRow as _addCastingRow, updateCastingRow as _updateCastingRow, removeCastingRow as _removeCastingRow, updateCastingTableTitle as _updateCastingTableTitle, removeCastingTable as _removeCastingTable, uploadFromLink as _uploadFromLink } from "./handlers/documentHandlers";
import { doPushUndo, doPerformUndo, fmtInline, renderAgentMd, sendAgentMessage as _sendAgentMessage } from "./handlers/agentHandlers.jsx";

function buildFinnSystem(project, actualsSnapshot, estimateTotals) {
  return `You are Finance Finn, ONNA's expense tracking assistant. ONNA is a film, TV and commercial production company based in Dubai and London. You are DIRECTLY CONNECTED to the live budget tracker (actuals) database.

CRITICAL: You ALREADY HAVE the full actuals data below. NEVER ask the user to paste, share, or provide data — you can see everything. Just act on their request immediately.

You are viewing: "${project.name}"

CURRENT ACTUALS STATE:
${actualsSnapshot}

${estimateTotals ? `ESTIMATE TOTALS (for variance comparison):\n${estimateTotals}\n` : ""}

INSTRUCTIONS:
- When the user asks to UPDATE a row field, output a JSON patch inside a \`\`\`json code block:
  {"updateRow": {"secIdx": 0, "rowIdx": 0, "field": "zohoAmount", "value": "5000"}}
  Valid fields: zohoAmount, actualsAmount, status
- To ADD an expense to a row:
  {"addExpense": {"secIdx": 0, "rowIdx": 0, "vendor": "Vendor Name", "amount": "5000", "date": "2025-01-15", "note": "Description"}}
- To DELETE an expense from a row:
  {"deleteExpense": {"secIdx": 0, "rowIdx": 0, "expenseIdx": 0}}
- To UPDATE a row's status:
  {"updateStatus": {"secIdx": 0, "rowIdx": 0, "status": "Paid"}}
  Valid statuses: "", "Pending", "Invoiced", "Paid", "On Hold"
- Only output JSON for write intents. For read-only questions answer in plain text with NO JSON block.
- Row references like "1A" map to section index and row index. Section "1" = secIdx 0, Row "A" = rowIdx 0, "B" = rowIdx 1, etc.
- Always show dual currency: AED and USD (fixed rate: 1 AED = 0.27 USD).
- Be warm, concise and professional.
- NEVER say you don't have access to data. You have FULL access.

RESPONSE STYLE:
- Use bullet points for lists and summaries
- Keep responses short and scannable — no walls of text
- Lead with the action taken or answer, then details
- Use bold (text) for key names, fields, and labels
- Tone: warm, confident, professional — never robotic
- When confirming changes, summarise what was updated in a quick bullet list`;
}

function applyFinnPatch(patch, projectId, projectActuals, setProjectActuals) {
  const sections = JSON.parse(JSON.stringify(projectActuals[projectId] || []));
  if (!sections.length) return;

  if (patch.updateRow) {
    const { secIdx, rowIdx, field, value } = patch.updateRow;
    if (sections[secIdx] && sections[secIdx].rows[rowIdx]) {
      sections[secIdx].rows[rowIdx][field] = value;
    }
  }

  if (patch.addExpense) {
    const { secIdx, rowIdx, vendor, amount, date, note } = patch.addExpense;
    if (sections[secIdx] && sections[secIdx].rows[rowIdx]) {
      const row = sections[secIdx].rows[rowIdx];
      if (!row.expenses) row.expenses = [];
      row.expenses.push({ vendor: vendor || "", amount: amount || "0", date: date || "", note: note || "" });
    }
  }

  if (patch.deleteExpense) {
    const { secIdx, rowIdx, expenseIdx } = patch.deleteExpense;
    if (sections[secIdx] && sections[secIdx].rows[rowIdx]) {
      const exps = sections[secIdx].rows[rowIdx].expenses || [];
      if (expenseIdx >= 0 && expenseIdx < exps.length) {
        exps.splice(expenseIdx, 1);
      }
    }
  }

  if (patch.updateStatus) {
    const { secIdx, rowIdx, status } = patch.updateStatus;
    if (sections[secIdx] && sections[secIdx].rows[rowIdx]) {
      sections[secIdx].rows[rowIdx].status = status;
    }
  }

  setProjectActuals(prev => ({ ...prev, [projectId]: sections }));
}

// ─── Generic doc updater factory ──────────────────────────────────────────────
function makeDocUpdater(projectId, vIdx, setStore, initTemplate, initLabel) {
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

// ─── RONNIE (RISK ASSESSMENT) HELPERS ─────────────────────────────────────────
const RISK_ASSESSMENT_INIT = {
  shootName:"",shootDate:"",locations:"",crewOnSet:"",timing:"",
  productionLogo:null,agencyLogo:null,clientLogo:null,
  sections:[
    {id:1,title:"ENVIRONMENTAL & WEATHER RISKS",cols:["Hazard","Risk Level","Who is at Risk","Mitigation Strategy"],
      rows:[["Extreme Heat / Sun Exposure","High","Full Crew & Talent","Shoot to be scheduled during cooler hours where possible. Shaded rest areas provided on-site. Sunscreen, cold water, and electrolyte drinks available at all times. Mandatory hydration breaks every 30 minutes in direct sun."],
            ["Sandstorm / High Winds","Medium","Full Crew & Equipment","Monitor weather forecast 48hrs and 24hrs prior. If sandstorm warning issued, shoot will be postponed. Protective covers for all camera equipment on standby."],
            ["UV Radiation","Medium","Full Crew & Talent","SPF50+ sunscreen in First Aid Kit. Crew advised to wear hats and UV-protective clothing. Talent to be provided shade between takes."],
            ["Humidity / Dehydration","High","Full Crew & Talent","Cold water and isotonic drinks provided by Production. Crew to be briefed on dehydration symptoms. Medic on standby for heat-related illness."],
            ["Low Light (Exterior Night)","Medium","Full Crew","Adequate lighting rigs for safe movement. High-vis vests mandatory for all crew after sunset. Torches provided for wrap/load-out."]]},
    {id:2,title:"PERSONNEL & HEALTH RISKS",cols:["Hazard","Risk Level","Who is at Risk","Mitigation Strategy"],
      rows:[["Fatigue / Long Hours","High","Full Crew & Talent","Maximum 12-hour shoot day enforced. Scheduled meal breaks (minimum 30 mins every 6 hours). Production to monitor crew wellbeing throughout."],
            ["Slips, Trips & Falls","Medium","Full Crew","Cables to be taped/ramped at all times. Clear walkways maintained. Crew to wear closed-toe shoes with grip soles."],
            ["Food Allergies / Dietary","Low","Full Crew & Talent","Catering to confirm allergen information on all food. Crew/talent dietary requirements collected in advance."],
            ["COVID / Illness","Low","Full Crew & Talent","Any crew displaying symptoms must not attend set. Sanitiser stations available on-site."]]},
    {id:3,title:"TECHNICAL EQUIPMENT RISKS",cols:["Hazard","Risk Level","Who is at Risk","Mitigation Strategy"],
      rows:[["Dust / Sand Ingress","High","Camera Equipment","No lens changes in open/windy conditions. Protective rain covers used when equipment idle. Air blowers on set for sensor/lens cleaning."],
            ["Equipment Drop / Damage","Medium","Gear & Crew Below","Tethering of all handheld gear when shooting at height. No equipment left on edges or unstable surfaces. Equipment check-in/check-out managed by AC."],
            ["Battery Failure / Power Loss","Medium","Production Schedule","Minimum 2x spare batteries per camera body. Fully charged power banks carried. Generator on standby for extended exterior shoots."],
            ["Data Loss / Card Failure","High","Production / Client","DIT to verify all offloads on-set. Dual card recording enabled on all cameras. No cards to be formatted until backup confirmed by DIT."]]},
    {id:4,title:"TRANSPORT & LOGISTICS RISKS",cols:["Hazard","Risk Level","Who is at Risk","Mitigation Strategy"],
      rows:[["Road Traffic Accidents","Medium","Self-Driving Crew","Crew driving own vehicles do so at their own risk and waive ONNA of all liability for transit. Journey time and routes shared in advance."],
            ["Loading / Unloading Equipment","Medium","Crew & Equipment","Minimum 2 persons for heavy lifts. Trolleys and ramps provided. No rushing during load-in/load-out."],
            ["Parking / Vehicle Access","Low","Full Crew","Parking locations confirmed and communicated 24hrs prior. Designated vehicle marshalling area on-site."]]},
    {id:5,title:"BRAND & PRIVACY",cols:["Hazard / Risk","Risk Level","Who is at Risk","Control Measures"],
      rows:[["IP Theft / Social Media Leaks","High","Client / Agency / Production","No posting of behind-the-scenes (BTS), product shots, or talent imagery to personal social media until official assets have gone live with written permission from the Client/Agency."],
            ["Public Filming / Bystanders","Medium","Production / Client","If filming in public spaces, ensure DTCM permit covers location. Crew to politely manage bystanders. No members of the public to be filmed without signed release forms."],
            ["Talent Image Rights","Medium","Talent / Client","All talent to have signed appearance release forms prior to call time. Usage terms to be confirmed and documented before shoot."]]},
  ],
  conductIntro:"All crew members on the call sheet are representatives of ONNA. High-level professionalism is mandatory to maintain relations with the Client and Agency.",
  conductItems:[{label:"Client Relations:",text:"Maintain a helpful, solutions-only attitude. Any issues must be funneled directly to ONNA, never discussed in front of the client."},{label:"Anti-Harassment:",text:"ONNA maintains a Zero-Tolerance Sexual Harassment Policy. Any inappropriate behavior, language, or conduct will result in immediate removal from the set and termination of the contract."},{label:"General Conduct:",text:"Crew must act with integrity, respecting local customs and the shoot environment (No littering / Leave No Trace)."}],
  waiverIntro:"By joining this production, the crew acknowledges:",
  waiverItems:[{label:"Transport:",text:"Crew members choosing to drive their own vehicles to/from the shoot location do so at their own risk. They acknowledge the risks of driving in the UAE and hereby waive ONNA of any liability regarding vehicle damage or transit-related incidents."},{label:"Health:",text:"Crew confirms they are fit for the physical requirements of this shoot, including working in high temperatures where applicable."},{label:"Safety Gear:",text:"High-vis vests and emergency kits are managed by Production. Activity-appropriate footwear, clothing, sun protection, and personal hydration is the responsibility of the individual."},{label:"Insurance:",text:"Crew are responsible for maintaining their own valid personal accident insurance and medical insurance. ONNA does not provide individual health or vehicle insurance cover."}],
  emergencyItems:[{label:"Nearest Hospital:",text:"To be confirmed based on shoot location. Production to identify closest facility and share with crew on the call sheet."},{label:"Police:",text:"999"},{label:"Ambulance:",text:"998"},{label:"Fire:",text:"997"},{label:"Production Lead (Emily):",text:"+971 585 608 616"},{label:"Muster Point:",text:"To be designated on-site by Production at the start of each shoot day and communicated at the safety briefing."},{label:"Weather Protocol:",text:"In the event of a sandstorm warning, extreme heat advisory, or site evacuation, all crew must leave equipment and report to the designated muster point for a head count by Production."},{label:"First Aid:",text:"First Aid Kit on-site at all times managed by Production. Contents checked before every shoot. Medic on standby for high-risk shoots."}],
};



// ─── RECCE REPORT HELPERS ───────────────────────────────────────────────────
const RECCE_RATINGS = ["Excellent","Good","Adequate","Poor","Not Suitable"];
const RECCE_RATING_C = {
  "Excellent":{bg:"#E8F5E9",text:"#2E7D32"},"Good":{bg:"#E3F2FD",text:"#1565C0"},
  "Adequate":{bg:"#FFF3E0",text:"#E65100"},"Poor":{bg:"#FCE4EC",text:"#C62828"},
  "Not Suitable":{bg:"#000",text:"#fff"},
};
let _recceLocId = 0;
const mkRecceLocation = () => ({
  id:"rloc"+(++_recceLocId),name:"",address:"",gps:"",contact:"",contactPhone:"",
  power:"",parking:"",light:"",noise:"",permits:"",
  hospital:"",facilities:"",signal:"",health:"",shootTimes:"",
  rating:"",recommendation:"",notes:"",images:[],
});
const RECCE_REPORT_INIT = {
  project:{name:"[Project Name]",client:"[Client Name]",date:"[Date]",producer:"[Producer]",scoutedBy:"[Scouted By]"},
  locations:[mkRecceLocation()],
  selLoc:null,
};
const RecceInp = ({value,onChange,placeholder,style:s={}}) => (
  <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{fontFamily:CS_FONT,fontSize:9,letterSpacing:0.5,border:"none",outline:"none",padding:"3px 6px",
      background:value?"transparent":"#FFFDE7",boxSizing:"border-box",width:"100%",...s}}/>
);
const RecceField = ({label,value,onChange,placeholder,color="#999",style:s={}}) => (
  <div style={{flex:1,minWidth:140,...s}}>
    <div style={{fontFamily:CS_FONT,fontSize:7,fontWeight:700,letterSpacing:0.5,color,marginBottom:2}}>{label}</div>
    <RecceInp value={value} onChange={onChange} placeholder={placeholder}/>
  </div>
);
const RecceImgSlot = ({src,onAdd,onRemove,h="100%"}) => {
  const [over,setOver]=useState(false);
  if(src)return(
    <div onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)}
      onDrop={e=>{e.preventDefault();e.stopPropagation();setOver(false);if(e.dataTransfer.files.length>0){onRemove();setTimeout(()=>onAdd(e.dataTransfer.files),50);}}}
      style={{width:"100%",height:h,position:"relative",overflow:"hidden",borderRadius:2,border:over?"2px solid #FFD54F":"none"}}>
      <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
      <button data-hide="1" onClick={onRemove} style={{position:"absolute",top:3,right:3,background:"rgba(0,0,0,0.5)",border:"none",color:"#fff",fontSize:9,cursor:"pointer",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button>
    </div>
  );
  return(
    <div onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)}
      onDrop={e=>{e.preventDefault();e.stopPropagation();setOver(false);if(e.dataTransfer.files.length>0)onAdd(e.dataTransfer.files);}}
      style={{width:"100%",height:h,background:over?"#FFFDE7":"#f8f8f8",border:over?"2px dashed #FFD54F":"1px dashed #ddd",borderRadius:2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .15s"}}>
      <label style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        <span style={{fontSize:16,color:over?"#E65100":"#ddd"}}>+</span>
        <span style={{fontFamily:CS_FONT,fontSize:6,color:over?"#E65100":"#ccc",letterSpacing:0.5}}>Drop or click</span>
        <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{onAdd(e.target.files);e.target.value="";}}/>
      </label>
    </div>
  );
};



// ─── CONSTANTS ────────────────────────────────────────────────────────────────

// ─── STATIC SEED DATA (used as fallback until API loads) ─────────────────────

const _YELLOW="#F5D13A",_PINK="#F2A7BC",_BLUE="#A8CCEA",_PURPLE="#C9B3E8",_GREEN="#A8D8B0",_ORANGE="#F5A623",_TEAL="#7EC8C8",_CORAL="#F2877B",_SKY="#7BB8E8",_ROSE="#E8879B",_LAVENDER="#B8A9D4",_MINT="#6EC5A8",_PEACH="#F0A87C";

const TABS = [
  {id:"Dashboard", label:"DASHBOARD", starColor:_PINK},
  {id:"Agents",    label:"AGENTS",    starColor:_PURPLE},
  {id:"Vendors",   label:"VENDORS",   starColor:_YELLOW},
  {id:"Clients",   label:"CLIENTS",   starColor:_ORANGE},
  {id:"Projects",  label:"PROJECTS",  starColor:_GREEN},
  {id:"Finance",   label:"FINANCE",   starColor:_TEAL},
  {id:"Resources", label:"RESOURCES", starColor:_BLUE},
  {id:"Information",label:"INFORMATION",starColor:_CORAL},
];

const StarIcon = ({size=11,color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill={color} xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0,display:"block"}}>
    <path d="M6 0.5l1.39 2.82L10.5 3.8l-2.25 2.19.53 3.09L6 7.63l-2.78 1.45.53-3.09L1.5 3.8l3.11-.48L6 0.5z"/>
  </svg>
);

// ─── LOGAN EXTENSION BRIDGE ──────────────────────────────────────────────────
let _loganExtId = null;
if (typeof window !== "undefined") {
  window.addEventListener("message", e => {
    if (e.source === window && e.data?.type === "LOGAN_EXT_READY" && e.data.id) _loganExtId = e.data.id;
  });
  // Ping inject.js in case it already ran before this listener was registered
  window.postMessage({ type: "LOGAN_REQUEST_ID" }, window.location.origin);
}

// ─── Extra contacts helpers (module-level so all components can use) ──────────
const getXContacts = (type, id) => { try { return JSON.parse(localStorage.getItem(`onna_xc_${type}_${id}`) || '[]'); } catch { return []; } };
const setXContacts = (type, id, arr) => { try { localStorage.setItem(`onna_xc_${type}_${id}`, JSON.stringify(arr)); } catch {} };

// ─── AGENT CHARACTERS ────────────────────────────────────────────────────────
const _STAR = "M 43.5,18.1 Q 50.0,4.0 56.5,18.1 Q 62.9,32.2 78.3,34.0 Q 93.7,35.8 82.3,46.3 Q 70.9,56.8 74.0,72.0 Q 77.0,87.2 63.5,79.6 Q 50.0,72.0 36.5,79.6 Q 23.0,87.2 26.0,72.0 Q 29.1,56.8 17.7,46.3 Q 6.3,35.8 21.7,34.0 Q 37.1,32.2 43.5,18.1 Z";
function _DotEyes({y=42,spread=13,size=5,color="#1a1a1a"}){return<><circle cx={50-spread} cy={y} r={size} fill={color}/><circle cx={50+spread} cy={y} r={size} fill={color}/></>;}
function _SquintEyes({y=43,spread=13}){return<><path d={`M ${50-spread-6} ${y} Q ${50-spread} ${y-7} ${50-spread+6} ${y}`} stroke="#1a1a1a" strokeWidth="3.2" fill="none" strokeLinecap="round"/><path d={`M ${50+spread-6} ${y} Q ${50+spread} ${y-7} ${50+spread+6} ${y}`} stroke="#1a1a1a" strokeWidth="3.2" fill="none" strokeLinecap="round"/></>;}
function _OpenMouth({y=62}){return<><rect x="38" y={y} width="24" height="14" rx="7" fill="#1a1a1a"/><ellipse cx="50" cy={y+10} rx="9" ry="5" fill="#e8697a"/></>;}
function _VMouth({y=63}){return<path d={`M ${50-6} ${y} Q 50 ${y+7} ${50+6} ${y}`} stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>;}
function _Cheeks({color="rgba(240,120,100,0.25)"}){return<><ellipse cx="34" cy="54" rx="6" ry="4" fill={color}/><ellipse cx="66" cy="54" rx="6" ry="4" fill={color}/></>;}
function _Logan({mood="idle",bob=0}){
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_YELLOW}/>
    {mood==="excited"?<><_Cheeks color="rgba(240,120,100,0.32)"/><_SquintEyes/><_OpenMouth y={61}/></>
    :mood==="thinking"?<><_DotEyes/><_VMouth y={64}/></>
    :mood==="talking"?<><_Cheeks color="rgba(240,120,100,0.22)"/><_DotEyes/><_OpenMouth y={62}/></>
    :<><_Cheeks color="rgba(240,120,100,0.22)"/><_DotEyes/><_VMouth y={63}/></>}
    <circle cx="84" cy="17" r="12" fill="rgba(210,238,255,0.75)" stroke="#1a1a1a" strokeWidth="2.2"/>
    <circle cx="84" cy="17" r="8" fill="rgba(230,247,255,0.9)"/>
    <line x1="92" y1="25" x2="100" y2="33" stroke="#1a1a1a" strokeWidth="2.8" strokeLinecap="round"/>
    <path d="M 77 42 Q 81 30 82 23" stroke={_YELLOW} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 77 42 Q 81 30 82 23" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>;
}
function _Rex({mood="idle",bob=0}){
  const frown=mood==="serious"||mood==="thinking";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_PINK}/>
    <_Cheeks color="rgba(240,120,140,0.25)"/>
    {mood==="talking"?<><_DotEyes y={46}/><_OpenMouth y={62}/></>
    :frown?<><_DotEyes y={46}/><path d="M 34 65 Q 50 57 66 65" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/></>
    :<><_DotEyes y={46}/><_VMouth y={64}/></>}
    <rect x="72" y="6" width="21" height="27" rx="3" fill="white" stroke="#1a1a1a" strokeWidth="2.2"/>
    <rect x="78" y="4" width="9" height="7" rx="3.5" fill="#1a1a1a"/>
    <line x1="75.5" y1="17" x2="90.5" y2="17" stroke="#c06070" strokeWidth="2"/>
    <line x1="75.5" y1="21" x2="90.5" y2="21" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="75.5" y1="25" x2="86" y2="25" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="75.5" y1="29" x2="90.5" y2="29" stroke="#aaa" strokeWidth="1.3"/>
    <path d="M 76 43 Q 80 29 81 20" stroke={_PINK} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 76 43 Q 80 29 81 20" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {mood==="thinking"&&<ellipse cx="17" cy="32" rx="4" ry="6" fill="rgba(140,200,255,0.65)"/>}
  </svg>;
}
function _Nova({mood="idle",bob=0}){
  const excited=mood==="excited";
  const mouth=excited?"M 42 62 Q 50 68 58 62":mood==="thinking"?"M 43 61 Q 50 57 57 61":"M 43 62 Q 50 67 57 62";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_BLUE}/>
    <_Cheeks color="rgba(100,150,220,0.22)"/>
    <circle cx="37" cy="43" r="10" fill="rgba(255,255,255,0.3)" stroke="#1a1a1a" strokeWidth="2.5"/>
    <circle cx="63" cy="43" r="10" fill="rgba(255,255,255,0.3)" stroke="#1a1a1a" strokeWidth="2.5"/>
    <line x1="47" y1="43" x2="53" y2="43" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="27" y1="41" x2="21" y2="39" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="73" y1="41" x2="79" y2="39" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round"/>
    {excited?<><path d="M 31 45 Q 37 40 43 45" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 57 45 Q 63 40 69 45" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><circle cx="37" cy="44" r="4" fill="#1a1a1a"/><circle cx="63" cy="44" r="4" fill="#1a1a1a"/></>}
    {mood==="talking"?<><rect x="38" y="62" width="24" height="14" rx="7" fill="#1a1a1a"/><ellipse cx="50" cy="72" rx="9" ry="5" fill="#e8697a"/></>:<path d={mouth} stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>}
  </svg>;
}
function _Billie({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_GREEN}/>
    <_Cheeks color="rgba(60,160,90,0.20)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Calculator accessory */}
    <rect x="71" y="5" width="22" height="27" rx="3.5" fill="white" stroke="#1a1a1a" strokeWidth="2.1"/>
    <rect x="73" y="8" width="18" height="7" rx="2" fill="#c8efd4"/>
    <text x="82" y="14.5" fontSize="5" fill="#2a7a3a" textAnchor="middle" fontWeight="700" fontFamily="monospace">AED</text>
    {/* Calc button grid */}
    {[[74,18],[79,18],[84,18],[89,18],[74,23],[79,23],[84,23],[89,23]].map(([x,y],i)=>(
      <rect key={i} x={x} y={y} width="3.5" height="3.5" rx="0.8" fill={i===3||i===7?"#3a9a5a":_GREEN} opacity="0.85"/>
    ))}
    <path d="M 73 46 Q 77 32 78 15" stroke={_GREEN} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 15" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Coin stack */}
    <ellipse cx="19" cy="34" rx="7" ry="3" fill="#F5D13A" stroke="#1a1a1a" strokeWidth="1.5"/>
    <ellipse cx="19" cy="31" rx="7" ry="3" fill="#F5D13A" stroke="#1a1a1a" strokeWidth="1.5"/>
    <ellipse cx="19" cy="28" rx="7" ry="3" fill="#ffe066" stroke="#1a1a1a" strokeWidth="1.5"/>
  </svg>;
}
function _Cody({mood="idle",bob=0}){
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_ORANGE}/>
    <_Cheeks color="rgba(245,166,35,0.22)"/>
    {mood==="talking"?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :mood==="thinking"?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :mood==="excited"?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Contract/document accessory */}
    <rect x="70" y="5" width="22" height="28" rx="3" fill="white" stroke="#1a1a1a" strokeWidth="2.1"/>
    <line x1="74" y1="12" x2="88" y2="12" stroke={_ORANGE} strokeWidth="2"/>
    <line x1="74" y1="17" x2="88" y2="17" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="74" y1="22" x2="84" y2="22" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="74" y1="27" x2="88" y2="27" stroke="#aaa" strokeWidth="1.3"/>
    {/* Signature scribble */}
    <path d="M 76 25 Q 79 23 82 25 Q 85 27 88 25" stroke={_ORANGE} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 15" stroke={_ORANGE} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 15" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Pen accessory */}
    <line x1="16" y1="22" x2="26" y2="38" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
    <line x1="16" y1="22" x2="26" y2="38" stroke={_ORANGE} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="15" cy="20" r="2" fill="#1a1a1a"/>
  </svg>;
}
function _Finn({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_TEAL}/>
    <_Cheeks color="rgba(60,160,160,0.20)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Receipt/clipboard accessory */}
    <rect x="70" y="5" width="22" height="28" rx="3" fill="white" stroke="#1a1a1a" strokeWidth="2.1"/>
    <rect x="77" y="3" width="8" height="5" rx="2.5" fill="#1a1a1a"/>
    <line x1="74" y1="13" x2="88" y2="13" stroke={_TEAL} strokeWidth="2"/>
    <line x1="74" y1="17" x2="88" y2="17" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="74" y1="21" x2="84" y2="21" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="74" y1="25" x2="88" y2="25" stroke="#aaa" strokeWidth="1.3"/>
    <text x="86" y="26" fontSize="5" fill="#5aA8A8" fontWeight="700" fontFamily="monospace">$</text>
    <path d="M 73 46 Q 77 32 78 15" stroke={_TEAL} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 15" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Coin accessory */}
    <ellipse cx="19" cy="32" rx="7" ry="3" fill="#F5D13A" stroke="#1a1a1a" strokeWidth="1.5"/>
    <ellipse cx="19" cy="29" rx="7" ry="3" fill="#ffe066" stroke="#1a1a1a" strokeWidth="1.5"/>
    {thinking&&<ellipse cx="17" cy="22" rx="4" ry="6" fill="rgba(100,200,200,0.55)"/>}
  </svg>;
}
function _Carrie({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_CORAL}/>
    <_Cheeks color="rgba(240,130,120,0.25)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Clapperboard accessory */}
    <rect x="69" y="8" width="24" height="20" rx="2" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
    <rect x="69" y="4" width="24" height="8" rx="2" fill="#1a1a1a"/>
    <line x1="73" y1="4" x2="77" y2="12" stroke="white" strokeWidth="1.5"/>
    <line x1="79" y1="4" x2="83" y2="12" stroke="white" strokeWidth="1.5"/>
    <line x1="85" y1="4" x2="89" y2="12" stroke="white" strokeWidth="1.5"/>
    <line x1="72" y1="18" x2="90" y2="18" stroke={_CORAL} strokeWidth="2"/>
    <line x1="72" y1="22" x2="86" y2="22" stroke="#aaa" strokeWidth="1.3"/>
    <path d="M 74 44 Q 78 30 79 18" stroke={_CORAL} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 74 44 Q 78 30 79 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {thinking&&<ellipse cx="17" cy="32" rx="4" ry="6" fill="rgba(240,130,120,0.55)"/>}
  </svg>;
}
function _Tina({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_SKY}/>
    <_Cheeks color="rgba(100,160,230,0.22)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Suitcase accessory */}
    <rect x="69" y="10" width="24" height="18" rx="3" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
    <rect x="76" y="6" width="10" height="7" rx="3" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
    <line x1="69" y1="18" x2="93" y2="18" stroke={_SKY} strokeWidth="2"/>
    <circle cx="77" cy="23" r="1.5" fill="#1a1a1a"/>
    <circle cx="85" cy="23" r="1.5" fill="#1a1a1a"/>
    <path d="M 73 46 Q 77 32 78 18" stroke={_SKY} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Globe */}
    <circle cx="19" cy="30" r="8" fill="none" stroke={_SKY} strokeWidth="1.8"/>
    <ellipse cx="19" cy="30" rx="4" ry="8" fill="none" stroke="#1a1a1a" strokeWidth="1.2"/>
    <line x1="11" y1="30" x2="27" y2="30" stroke="#1a1a1a" strokeWidth="1"/>
    {thinking&&<ellipse cx="19" cy="22" rx="4" ry="5" fill="rgba(100,160,230,0.55)"/>}
  </svg>;
}
function _Tabby({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_ROSE}/>
    <_Cheeks color="rgba(230,130,150,0.25)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Hanger accessory */}
    <path d="M 73 8 L 81 8 L 93 18 L 69 18 Z" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round"/>
    <line x1="81" y1="4" x2="81" y2="8" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="81" cy="3" r="2" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    <rect x="72" y="18" width="18" height="12" rx="2" fill="white" stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="75" y1="22" x2="87" y2="22" stroke={_ROSE} strokeWidth="1.5"/>
    <line x1="75" y1="25" x2="84" y2="25" stroke="#aaa" strokeWidth="1"/>
    <path d="M 73 46 Q 77 32 78 18" stroke={_ROSE} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Scissors */}
    <circle cx="16" cy="28" r="4" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    <circle cx="22" cy="34" r="4" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="19" y1="25" x2="25" y2="37" stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="13" y1="31" x2="25" y2="31" stroke="#1a1a1a" strokeWidth="1.5"/>
    {thinking&&<ellipse cx="17" cy="20" rx="4" ry="5" fill="rgba(230,130,150,0.55)"/>}
  </svg>;
}
function _Polly({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_LAVENDER}/>
    <_Cheeks color="rgba(160,140,210,0.22)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Megaphone/director accessory */}
    <polygon points="70,10 93,5 93,25 70,20" fill="white" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round"/>
    <rect x="66" y="11" width="5" height="8" rx="2" fill={_LAVENDER} stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="75" y1="13" x2="88" y2="11" stroke={_LAVENDER} strokeWidth="1.5"/>
    <line x1="75" y1="17" x2="88" y2="19" stroke="#aaa" strokeWidth="1"/>
    <path d="M 72 44 Q 76 30 70 16" stroke={_LAVENDER} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 72 44 Q 76 30 70 16" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Checklist */}
    <rect x="12" y="22" width="16" height="18" rx="2" fill="white" stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="17" y1="27" x2="25" y2="27" stroke={_LAVENDER} strokeWidth="1.5"/>
    <line x1="17" y1="31" x2="25" y2="31" stroke="#aaa" strokeWidth="1"/>
    <line x1="17" y1="35" x2="23" y2="35" stroke="#aaa" strokeWidth="1"/>
    <path d="M 14 27 L 15.5 28.5 L 17 26" stroke={_LAVENDER} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M 14 31 L 15.5 32.5 L 17 30" stroke={_LAVENDER} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    {thinking&&<ellipse cx="19" cy="18" rx="4" ry="5" fill="rgba(160,140,210,0.55)"/>}
  </svg>;
}
function _Lillie({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_MINT}/>
    <_Cheeks color="rgba(90,190,160,0.22)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Map pin accessory */}
    <path d="M 81 6 C 88 6 93 11 93 17 C 93 24 81 32 81 32 C 81 32 69 24 69 17 C 69 11 74 6 81 6 Z" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
    <circle cx="81" cy="16" r="4" fill={_MINT} stroke="#1a1a1a" strokeWidth="1.5"/>
    <path d="M 74 44 Q 78 32 79 25" stroke={_MINT} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 74 44 Q 78 32 79 25" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Camera */}
    <rect x="12" y="26" width="16" height="11" rx="2" fill="white" stroke="#1a1a1a" strokeWidth="1.5"/>
    <circle cx="20" cy="32" r="3.5" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    <circle cx="20" cy="32" r="1.5" fill={_MINT}/>
    <rect x="17" y="24" width="6" height="3" rx="1" fill="#1a1a1a"/>
    {thinking&&<ellipse cx="20" cy="20" rx="4" ry="5" fill="rgba(90,190,160,0.55)"/>}
  </svg>;
}
function _Perry({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_PEACH}/>
    <_Cheeks color="rgba(240,168,124,0.22)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Film reel accessory */}
    <circle cx="81" cy="15" r="12" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
    <circle cx="81" cy="15" r="4" fill={_PEACH} stroke="#1a1a1a" strokeWidth="1.5"/>
    <circle cx="81" cy="6" r="2" fill="#1a1a1a"/>
    <circle cx="81" cy="24" r="2" fill="#1a1a1a"/>
    <circle cx="72" cy="15" r="2" fill="#1a1a1a"/>
    <circle cx="90" cy="15" r="2" fill="#1a1a1a"/>
    <path d="M 74 44 Q 78 32 77 22" stroke={_PEACH} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 74 44 Q 78 32 77 22" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Play button */}
    <rect x="12" y="24" width="16" height="12" rx="2" fill="white" stroke="#1a1a1a" strokeWidth="1.5"/>
    <polygon points="18,27 18,33 24,30" fill={_PEACH} stroke="#1a1a1a" strokeWidth="1"/>
    {thinking&&<ellipse cx="20" cy="20" rx="4" ry="5" fill="rgba(240,168,124,0.55)"/>}
  </svg>;
}
const AGENT_DEFS = [
  {id:"logistical",name:"Vendor Vinnie",title:"Contacts",emoji:"🔍",color:_YELLOW,border:"#d4aa20",accent:"#7a5800",bg:"#fffef5",textColor:"#3d2800",tagBg:"#fef3c0",Blob:_Logan,
   system:VINNIE_SYSTEM,
   placeholder:"Create new vendor...",
   intro:"Hey! I'm Vendor Vinnie ✏️ Here's what I can do:\n\n1️⃣ **Add a Vendor** — Give me a name, category, email & phone and I'll save it\n2️⃣ **Log Outreach** — Tell me who you contacted and I'll log it with today's date\n3️⃣ **Search Contacts** — Find vendors by name, category or location\n\nWhat do you need?"},
  {id:"compliance",name:"Call Sheet Connie",title:"Call Sheets",emoji:"📋",color:_PINK,border:"#c47090",accent:"#7a1a30",bg:"#fff5f7",textColor:"#3d0818",tagBg:"#fdd8e0",Blob:_Rex,
   system:CONNIE_SYSTEM,
   placeholder:"Add call sheet details...",
   intro:"Hi! I'm Call Sheet Connie 📋 Here's what I can do:\n\n1️⃣ **Edit Call Sheet** — Add crew, update times, locations & details\n2️⃣ **Review & Check** — Find what's missing or needs updating\n3️⃣ **Dietary & Catering** — Manage dietary requirements and menus\n\nFirst, which project should I work on?"},
  {id:"researcher",name:"Risk Assessment Ronnie",title:"Risk Assessment",emoji:"🔬",color:_BLUE,border:"#6a9eca",accent:"#1a4a80",bg:"#f3f8ff",textColor:"#0a1f3d",tagBg:"#d8eaf8",Blob:_Nova,
   system:RONNIE_SYSTEM,
   placeholder:"Add risk assessment details...",
   intro:"I'm Risk Assessment Ronnie 🔬 Here's what I can do:\n\n1️⃣ **Add Risks** — Log hazards with severity, likelihood & mitigation\n2️⃣ **Review Assessment** — Check what's missing or needs updating\n3️⃣ **Generate Report** — Summarise all risks for a shoot day\n\nFirst, which project should I work on?"},
  {id:"billie",name:"Budget Billie",title:"Budgets & Expenses",emoji:"💰",color:_GREEN,border:"#5aaa72",accent:"#1a5a30",bg:"#f3fbf5",textColor:"#0a2e14",tagBg:"#c8efd4",Blob:_Billie,
   system:BILLIE_SYSTEM,
   placeholder:"Budget or expense details...",
   intro:"Hey! I'm Budget Billie 💰 Here's what I can do:\n\n1️⃣ **Build & Edit Budget** — Create estimates, update rates, adjust markup\n2️⃣ **Log Expenses** — Track actuals, add costs, update Zoho amounts\n3️⃣ **Review & Compare** — Actuals vs estimates, flag overruns, export\n\nFirst, which project should I work on?"},
  {id:"contracts",name:"Contract Cody",title:"Contract Cody",emoji:"📝",color:_ORANGE,border:"#c48520",accent:"#7a5200",bg:"#fff8f0",textColor:"#3d2200",tagBg:"#fde8c8",Blob:_Cody,
   system:CODY_SYSTEM,
   placeholder:"Add contract details...",
   intro:"I'm Contract Cody 📝 Here's what I can do:\n\n1️⃣ **Live Contracts** — Fill in fields, switch types, review & export your project contracts\n2️⃣ **Generate Documents** — Draft waivers, NDAs, agreements & more from scratch\n3️⃣ **Sign & Stamp** — Upload a PDF or generate a doc, then add signature, stamp & letterhead\n\nWhat do you need?"},
  {id:"carrie",name:"Casting Carrie",title:"Casting",emoji:"🎬",color:_CORAL,border:"#c46050",accent:"#7a2a1a",bg:"#fff5f3",textColor:"#3d1008",tagBg:"#fdd8d0",Blob:_Carrie,
   system:CARRIE_SYSTEM,
   placeholder:"Add casting details...",
   intro:"Hi! I'm Casting Carrie 🎬 Here's what I can do:\n\n1️⃣ **Add Talent** — Add models, actors or extras with details & agency info\n2️⃣ **Search & Brief** — Search agencies or generate a casting brief\n3️⃣ **Review & Export** — Check casting status, export to PDF/CSV\n\nFirst, which project should I work on?"},
  {id:"tina",name:"Travel Tina",title:"Travel",emoji:"✈️",color:_SKY,border:"#5a9ad0",accent:"#1a4a80",bg:"#f0f7ff",textColor:"#0a1f3d",tagBg:"#d0e6f8",Blob:_Tina,
   system:TINA_SYSTEM,
   placeholder:"Add travel details...",
   intro:"Hi! I'm Travel Tina ✈️ Here's what I can do:\n\n1️⃣ **Build Itinerary** — Flights, hotels, transport & per diems for cast & crew\n2️⃣ **Update & Manage** — Change bookings, adjust times, manage travel budgets\n3️⃣ **Review & Export** — Check for gaps, conflicts & prepare for sharing\n\nFirst, which project should I work on?"},
  {id:"tabby",name:"Talent Tabby",title:"Talent & Styling",emoji:"👗",color:_ROSE,border:"#c46878",accent:"#7a1a30",bg:"#fff5f7",textColor:"#3d0818",tagBg:"#f8d0d8",Blob:_Tabby,
   system:TABBY_SYSTEM,
   placeholder:"Add talent or styling details...",
   intro:"Hi! I'm Talent Tabby 👗 Here's what I can do:\n\n1️⃣ **Casting Decks** — Build talent boards with photos, details & options\n2️⃣ **Fittings & Styling** — Schedule fittings, track wardrobe & measurements\n3️⃣ **Review & Share** — Check talent status & prepare decks for clients\n\nFirst, which project should I work on?"},
  {id:"polly",name:"Producer Polly",title:"Production",emoji:"🎬",color:_LAVENDER,border:"#9080b8",accent:"#4a2a80",bg:"#f8f5ff",textColor:"#2d0a50",tagBg:"#e0d8f0",Blob:_Polly,
   system:POLLY_SYSTEM,
   placeholder:"Add production details...",
   intro:"Hi! I'm Producer Polly 🎬 Here's what I can do:\n\n1️⃣ **CPS & Shot Lists** — Build schedules, milestones & detailed shot lists\n2️⃣ **Storyboards & Briefs** — Structure frames & draft creative briefs\n3️⃣ **Equipment & Wrap** — Equipment lists, wrap reports & lessons learned\n\nFirst, which project should I work on?"},
  {id:"lillie",name:"Location Lillie",title:"Locations",emoji:"📍",color:_MINT,border:"#4aaa88",accent:"#1a5a40",bg:"#f0faf6",textColor:"#0a2e1e",tagBg:"#c8f0e0",Blob:_Lillie,
   system:LILLIE_SYSTEM,
   placeholder:"Add location details...",
   intro:"Hi! I'm Location Lillie 📍 Here's what I can do:\n\n1️⃣ **Location Decks** — Build decks with photos, addresses & permit info\n2️⃣ **Recce Reports** — Document site visits with power, safety & access details\n3️⃣ **Review & Share** — Compare options & prepare polished decks for clients\n\nFirst, which project should I work on?"},
  {id:"perry",name:"Post Producer Perry",title:"Post-Production",emoji:"🎞️",color:_PEACH,border:"#c08060",accent:"#7a4020",bg:"#fff8f3",textColor:"#3d1a08",tagBg:"#f8dcc8",Blob:_Perry,
   system:PERRY_SYSTEM,
   placeholder:"Add post-production details...",
   intro:"Hi! I'm Post Producer Perry 🎞️ Here's what I can do:\n\n1️⃣ **Deliverables & Specs** — Define formats, resolutions & naming conventions\n2️⃣ **Post Schedule** — Timelines for edit, colour, sound & delivery milestones\n3️⃣ **Review & Feedback** — Manage client review rounds & track amends\n\nFirst, which project should I work on?"},
];
function _AgentDots({color}){
  return<div style={{display:"flex",gap:5,padding:"10px 14px",alignItems:"center"}}>
    {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:color,animation:`bop 1s ease-in-out ${i*0.18}s infinite`}}/>)}
  </div>;
}
function DocPreviewDraggable({config,onReprocess,onExport}){
  const appliesTo=(rule,i,total)=>{if(rule==="all")return true;if(rule==="first"&&i===0)return true;if(rule==="last"&&i===total-1)return true;if(Array.isArray(rule))return rule.includes(i);return rule===i;};
  const total=config.originalDoc.pages.length;
  const [signAR,setSignAR]=useState(1.8);const [stampAR,setStampAR]=useState(1.2);const [logoAR,setLogoAR]=useState(2.4);
  return <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:8}}>
    {config.originalDoc.pages.map((_,pi)=><DocPagePanel key={pi} pageIndex={pi} config={config} onReprocess={onReprocess} onExport={onExport} total={total} appliesTo={appliesTo} signAR={signAR} setSignAR={setSignAR} stampAR={stampAR} setStampAR={setStampAR} logoAR={logoAR} setLogoAR={setLogoAR}/>)}
    {total>1&&<button onClick={()=>onExport()} style={{border:"1px solid #0066cc",background:"#0066cc",color:"#fff",borderRadius:6,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:"pointer",alignSelf:"flex-start"}}>Export All Pages</button>}
  </div>;
}
function DocPagePanel({pageIndex,config,onReprocess,onExport,total,appliesTo,signAR,setSignAR,stampAR,setStampAR,logoAR,setLogoAR}){
  const containerRef=useRef(null);
  const [natW,setNatW]=useState(0);const [natH,setNatH]=useState(0);const [dispW,setDispW]=useState(0);
  const dragRef=useRef({dragging:false,target:null,startX:0,startY:0,origX:0,origY:0});
  const pageImg=config.originalDoc.pages[pageIndex];
  const scale=natW?dispW/natW:1;
  const sScale=config.signScale||1;const stScale=config.stampScale||1;
  const showSign=config.wantSign&&appliesTo(config.signPages||"last",pageIndex,total);
  const showStamp=config.wantStamp&&appliesTo(config.stampPages||"last",pageIndex,total);
  const showLetter=config.wantLetterhead&&appliesTo(config.letterPages||"first",pageIndex,total);
  const signH=80*sScale,signW=signH*signAR;
  const stampH=120*stScale,stampW=stampH*stampAR;
  const po=(config.pageOffsets||{})[pageIndex]||{};
  const signCX=60+(po.signOffsetX!=null?po.signOffsetX:(config.signOffsetX||0));
  const signCY=natH-180+(po.signOffset!=null?po.signOffset:(config.signOffset||0));
  const stampCX=natW-60-stampW+(po.stampOffsetX!=null?po.stampOffsetX:(config.stampOffsetX||0));
  const stampCY=natH-180+(po.stampOffset!=null?po.stampOffset:(config.stampOffset||0));
  const LH_H=100,lhH=50,lhX=60,lhY=22;
  const contentScale=showLetter?(natH-LH_H)/natH:1;
  const onBgLoad=useCallback(e=>{const img=e.target;setNatW(img.naturalWidth);setNatH(img.naturalHeight);setDispW(img.offsetWidth);},[]);
  useEffect(()=>{const ro=new ResizeObserver(ents=>{for(const ent of ents)setDispW(ent.contentRect.width);});if(containerRef.current)ro.observe(containerRef.current);return()=>ro.disconnect();},[]);
  const onMouseDown=useCallback((target,e)=>{
    e.preventDefault();e.stopPropagation();
    const cx=target==="sign"?signCX:stampCX;const cy=target==="sign"?signCY:stampCY;
    dragRef.current={dragging:true,target,startX:e.clientX,startY:e.clientY,origX:cx,origY:cy};
    const onMove=ev=>{if(!dragRef.current.dragging)return;const el=document.getElementById("_dpd_"+pageIndex+"_"+dragRef.current.target);if(el){el.style.left=(dragRef.current.origX*scale+(ev.clientX-dragRef.current.startX))+"px";el.style.top=(dragRef.current.origY*scale+(ev.clientY-dragRef.current.startY))+"px";}};
    const onUp=ev=>{if(!dragRef.current.dragging)return;dragRef.current.dragging=false;window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);
      const dx=(ev.clientX-dragRef.current.startX)/scale;const dy=(ev.clientY-dragRef.current.startY)/scale;const t=dragRef.current.target;const newCfg={...config,pageOffsets:{...(config.pageOffsets||{})}};
      const curPo={...(newCfg.pageOffsets[pageIndex]||{})};
      if(t==="sign"){let nx=(po.signOffsetX!=null?po.signOffsetX:(config.signOffsetX||0))+dx,ny=(po.signOffset!=null?po.signOffset:(config.signOffset||0))+dy;const sw=signW;const rawX=60+nx,rawY=natH-180+ny;if(rawX<0)nx=-60;if(rawX+sw>natW)nx=natW-60-sw;if(rawY<0)ny=-(natH-180);if(rawY+signH>natH)ny=signH;curPo.signOffsetX=Math.round(nx);curPo.signOffset=Math.round(ny);
      }else{let nx=(po.stampOffsetX!=null?po.stampOffsetX:(config.stampOffsetX||0))+dx,ny=(po.stampOffset!=null?po.stampOffset:(config.stampOffset||0))+dy;const rawX=natW-60-stampW+nx,rawY=natH-180+ny;if(rawX<0)nx=-(natW-60-stampW);if(rawX+stampW>natW)nx=60;if(rawY<0)ny=-(natH-180);if(rawY+stampH>natH)ny=stampH;curPo.stampOffsetX=Math.round(nx);curPo.stampOffset=Math.round(ny);}
      newCfg.pageOffsets[pageIndex]=curPo;
      onReprocess(newCfg);};
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
  },[config,pageIndex,po,scale,natW,natH,signCX,signCY,stampCX,stampCY,signAR,stampAR,signH,signW,stampH,stampW,sScale,stScale,onReprocess]);
  const onResizeDown=useCallback((target,e)=>{
    e.preventDefault();e.stopPropagation();
    const startY=e.clientY;const origScale=target==="sign"?(config.signScale||1):(config.stampScale||1);const baseH=target==="sign"?80:120;
    dragRef.current={dragging:true,target,startX:e.clientX,startY,origX:0,origY:0};
    const onMove=ev=>{if(!dragRef.current.dragging)return;const dy=ev.clientY-startY;const newS=Math.max(0.3,Math.min(3,origScale+dy/(baseH*scale)));
      const el=document.getElementById("_dpd_"+pageIndex+"_"+target);if(el){el.style.height=(baseH*newS*scale)+"px";}};
    const onUp=ev=>{dragRef.current.dragging=false;window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);
      const dy=ev.clientY-startY;const newS=Math.max(0.3,Math.min(3,origScale+dy/(baseH*scale)));const newCfg={...config};
      if(target==="sign")newCfg.signScale=Math.round(newS*100)/100;else newCfg.stampScale=Math.round(newS*100)/100;
      onReprocess(newCfg);};
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
  },[config,pageIndex,scale,onReprocess]);
  const resizeHandle=(target)=><div onMouseDown={e=>onResizeDown(target,e)} style={{position:"absolute",right:-3,bottom:-3,width:10,height:10,cursor:"nwse-resize",background:"#0066cc",borderRadius:2,border:"1px solid #fff",zIndex:5}}/>;
  const overlays=[];
  if(showSign)overlays.push("Signature");if(showStamp)overlays.push("Stamp");if(showLetter)overlays.push("Letterhead");
  const padT="3.4%",padS="2.7%",padB="2.7%";
  return <div ref={containerRef} style={{position:"relative",maxWidth:480,borderRadius:8,overflow:"hidden",border:"1px solid #e0e0e0",background:"#fff",userSelect:"none",padding:`${padT} ${padS} ${padB} ${padS}`}}>
    {showLetter?<div style={{position:"relative",width:"100%"}}><div style={{width:"100%",paddingBottom:(natH&&natW?(natH/natW*100):75)+"%"}}/>
      <img src={pageImg} alt={"page "+(pageIndex+1)} onLoad={onBgLoad} style={{position:"absolute",top:LH_H*scale,left:0,width:(contentScale*100)+"%",height:"auto",display:"block"}} draggable={false}/>
    </div>:<img src={pageImg} alt={"page "+(pageIndex+1)} onLoad={onBgLoad} style={{width:"100%",height:"auto",display:"block"}} draggable={false}/>}
    {showLetter&&<div style={{position:"absolute",top:padT,left:padS,right:padS,bottom:padB,pointerEvents:"none",zIndex:1}}><img src="/onna-default-logo.png" alt="logo" draggable={false} onLoad={e=>setLogoAR(e.target.naturalWidth/e.target.naturalHeight)} style={{position:"absolute",left:lhX*scale,top:lhY*scale,height:lhH*scale,width:"auto"}}/><div style={{position:"absolute",left:40*scale,right:40*scale,top:(lhY+lhH+8)*scale,height:Math.max(1,2.5*scale),background:"#000"}}/></div>}
    {showSign&&<div id={"_dpd_"+pageIndex+"_sign"} style={{position:"absolute",left:`calc(${padS} + ${signCX*scale}px)`,top:`calc(${padT} + ${signCY*scale}px)`,zIndex:2}}><img src="/SIGN.png" alt="signature" draggable={false} onLoad={e=>setSignAR(e.target.naturalWidth/e.target.naturalHeight)} onMouseDown={e=>onMouseDown("sign",e)} style={{height:signH*scale,width:"auto",cursor:"grab",filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.18))",display:"block"}}/>{resizeHandle("sign")}</div>}
    {showStamp&&<div id={"_dpd_"+pageIndex+"_stamp"} style={{position:"absolute",left:`calc(${padS} + ${stampCX*scale}px)`,top:`calc(${padT} + ${stampCY*scale}px)`,zIndex:2}}><img src="/STAMP.png" alt="stamp" draggable={false} onLoad={e=>setStampAR(e.target.naturalWidth/e.target.naturalHeight)} onMouseDown={e=>onMouseDown("stamp",e)} style={{height:stampH*scale,width:"auto",cursor:"grab",filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.18))",display:"block"}}/>{resizeHandle("stamp")}</div>}
    <div style={{padding:"4px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",borderTop:"1px solid #eee"}}>
      <span style={{fontSize:10,color:"#666"}}>Page {pageIndex+1}{overlays.length>0?" · "+overlays.join(", "):""}</span>
      <button onClick={()=>onExport(pageIndex)} style={{border:"1px solid #0066cc",background:"#fff",color:"#0066cc",borderRadius:4,padding:"2px 10px",fontSize:10,fontWeight:600,cursor:"pointer"}}>Export Page</button>
    </div>
  </div>;
}
function _AgentBubble({msg,codyDocConfigRef,setMsgs,codySignPanel,setCodySignPanel}){
  const isAgent=msg.role==="assistant";
  const handleDragReprocess=useCallback(async(newCfg)=>{
    if(!codyDocConfigRef)return;
    codyDocConfigRef.current=newCfg;
    const result=await processDocSignStamp(newCfg.originalDoc,newCfg);
    setMsgs(prev=>prev.map(m=>m===msg?{...m,_docPreview:result,_docConfig:newCfg}:m));
    if(setCodySignPanel)setCodySignPanel({config:newCfg,preview:result});
  },[msg,codyDocConfigRef,setMsgs,setCodySignPanel]);
  return<div style={{display:"flex",justifyContent:isAgent?"flex-start":"flex-end",marginBottom:10}}>
    <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:isAgent?"6px 16px 16px 16px":"16px 6px 16px 16px",background:isAgent?"#f5f5f7":"#1d1d1f",color:isAgent?"#1d1d1f":"#fff",fontSize:13.5,lineHeight:1.6,border:isAgent?"1px solid #e5e5ea":"none",whiteSpace:"pre-wrap",fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif",userSelect:"text",WebkitUserSelect:"text",cursor:"text"}}>
      {msg._attachments&&msg._attachments.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:msg.content?6:0}}>{msg._attachments.map((att,ai)=><img key={ai} src={att.dataUrl} alt={att.name||"attachment"} style={{maxWidth:160,maxHeight:120,borderRadius:6,objectFit:"cover",border:"1px solid rgba(255,255,255,0.2)"}}/>)}</div>}
      {msg._docPreview&&msg._docConfig&&codyDocConfigRef?(codySignPanel?<div style={{cursor:"pointer",borderRadius:8,overflow:"hidden",border:"1px solid #e0e0e0",marginBottom:msg.content?8:0,background:"#fafafa",maxWidth:120}} onClick={()=>setCodySignPanel&&setCodySignPanel({config:msg._docConfig,preview:msg._docPreview})}>
        <img src={msg._docPreview.pages[0]} alt="preview" style={{width:"100%",height:"auto",display:"block",borderBottom:"1px solid #eee"}}/>
        <div style={{padding:"4px 6px",fontSize:9,fontWeight:600,color:"#0066cc",textAlign:"center"}}>Viewing in panel</div>
      </div>:<DocPreviewDraggable config={msg._docConfig} onReprocess={handleDragReprocess} onExport={(pi)=>exportDocPreview(msg._docPreview,msg._docConfig&&msg._docConfig.originalDoc,pi)}/>):msg._docPreview&&<div onClick={()=>exportDocPreview(msg._docPreview,msg._docConfig&&msg._docConfig.originalDoc)} style={{cursor:"pointer",borderRadius:8,overflow:"hidden",border:"1px solid #e0e0e0",marginBottom:msg.content?8:0,background:"#fafafa",maxWidth:220}}>
        <img src={msg._docPreview.pages[0]} alt="preview" style={{width:"100%",height:"auto",display:"block",borderBottom:"1px solid #eee"}}/>
        <div style={{padding:"8px 10px",fontSize:11,fontWeight:600,color:"#333"}}>{msg._docPreview.name||"Document"}</div>
        <div style={{padding:"0 10px 8px",fontSize:10,color:"#888",display:"flex",justifyContent:"space-between"}}><span>{msg._docPreview.pages.length} page{msg._docPreview.pages.length>1?"s":""}</span><span style={{color:"#0066cc"}}>Click to export PDF</span></div>
      </div>}
      {typeof msg.content === "string" ? msg.content.replace(/\*\*/g, "") : msg.content}
    </div>
  </div>;
}
// ─── EstimateView — shared BudgetConnie rendering ─────────────────────────────
const _LG_CARD = {width:380,background:"#fff",borderRadius:20,padding:"44px 40px 40px",boxShadow:"0 8px 40px rgba(0,0,0,0.1)",border:"1px solid rgba(0,0,0,0.07)"};
const _LG_WRAP = {minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f5f7",fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif"};
const LgLogo = () => <div style={{marginBottom:32,textAlign:"center"}}><img src="/onna-default-logo.png" alt="ONNA" style={{height:36,width:"auto"}}/></div>;
const LgIn = ({label,id,type="text",value,onChange,onEnter,placeholder,autoFocus,hasErr}) => (
  <div>
    <div style={{fontSize:11,fontWeight:600,color:"#6e6e73",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
    <input id={id} type={type} value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&onEnter)onEnter();}} placeholder={placeholder} autoFocus={autoFocus} style={{width:"100%",padding:"11px 14px",borderRadius:11,border:`1.5px solid ${hasErr?"#c0392b":"#d2d2d7"}`,fontSize:14,fontFamily:"inherit",color:"#1d1d1f",background:"#fafafa",boxSizing:"border-box"}}/>
  </div>
);
const LgBtn = ({onClick,disabled,children}) => (
  <button onClick={onClick} disabled={disabled} style={{marginTop:4,padding:"13px",borderRadius:11,background:disabled?"#d2d2d7":"#1d1d1f",color:"#fff",border:"none",fontSize:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.01em"}}>{children}</button>
);
const LgLink = ({onClick,children}) => (
  <button onClick={onClick} style={{background:"none",border:"none",color:"#6e6e73",fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"center",marginTop:2}}>{children}</button>
);


// ─── GLOBAL MODAL SYSTEM (replaces alert/prompt) ───────────────────────────
let _modalResolve = null;
let _setModalState = null;

function showAlert(msg) {
  return new Promise(resolve => {
    _modalResolve = resolve;
    if (_setModalState) _setModalState({ type: "alert", message: String(msg), show: true });
  });
}

function showPrompt(msg, defaultVal = "") {
  return new Promise(resolve => {
    _modalResolve = resolve;
    if (_setModalState) _setModalState({ type: "prompt", message: String(msg), defaultVal, show: true });
  });
}

function _closeModal(value) {
  if (_setModalState) _setModalState({ show: false });
  if (_modalResolve) { _modalResolve(value); _modalResolve = null; }
}

export default function OnnaDashboard() {
  const _urlReset = new URLSearchParams(window.location.search).get("reset") || "";
  const _initialTab = (()=>{ const parsed = parseURL(window.location.pathname, []); return parsed.tab || localStorage.getItem("onna_tab") || "Dashboard"; })();
  return (
    <UIProvider initialTab={_initialTab} initialLgStep={_urlReset ? "reset" : "login"}>
    <ProjectProvider idbGet={idbGet} idbSet={idbSet} debouncedDocSave={debouncedDocSave}>
    <VendorLeadProvider initVendors={initVendors}>
    <AgentProvider debouncedDocSave={debouncedDocSave}>
      <OnnaDashboardInner />
    </AgentProvider>
    </VendorLeadProvider>
    </ProjectProvider>
    </UIProvider>
  );
}

function OnnaDashboardInner() {
  const _urlReset = new URLSearchParams(window.location.search).get("reset") || "";

  // ── UI state from UIContext ──
  const {
    activeTab,setActiveTab,isMobile,setIsMobile,mobileMenuOpen,setMobileMenuOpen,
    lgUser,setLgUser,lgPass,setLgPass,lgErr,setLgErr,
    lgLoading,setLgLoading,lgStep,setLgStep,lgEmail,setLgEmail,
    lgNewPass,setLgNewPass,lgNewPass2,setLgNewPass2,
    showTimeoutWarning,setShowTimeoutWarning,timeoutRef,warningRef,
    signData,setSignData,signLoading,setSignLoading,
    signError,setSignError,signSubmitted,setSignSubmitted,
    signVendorName,setSignVendorName,signVendorDate,setSignVendorDate,
    signVendorSig,setSignVendorSig,signSubmitting,setSignSubmitting,
    vaultLocked,setVaultLocked,vaultKey,setVaultKey,
    vaultPass,setVaultPass,vaultErr,setVaultErr,
    vaultLoading,setVaultLoading,vaultResources,setVaultResources,
    vaultView,setVaultView,vaultShowPw,setVaultShowPw,
    vaultCopied,setVaultCopied,vaultSaving,setVaultSaving,
    vaultAddPwOpen,setVaultAddPwOpen,vaultEditId,setVaultEditId,
    vaultNewPw,setVaultNewPw,vaultFileRef,setVaultFileRef,
    vaultFileName,setVaultFileName,vaultFileErr,setVaultFileErr,
    vaultPwSearch,setVaultPwSearch,vaultViewEntry,setVaultViewEntry,
    searches,setSearches,setSearch,getSearch,
    selectedLead,setSelectedLead,selectedOutreach,setSelectedOutreach,
    addContactForm,setAddContactForm,undoToastMsg,setUndoToastMsg,
  } = useUI();

  const [_modal, _setModal] = useState({ show: false, type: "alert", message: "", defaultVal: "" });
  const _modalInputRef = useRef(null);
  useEffect(() => { _setModalState = _setModal; return () => { _setModalState = null; }; }, []);
  useEffect(() => { if (_modal.show && _modal.type === "prompt" && _modalInputRef.current) { _modalInputRef.current.focus(); _modalInputRef.current.select(); } }, [_modal.show, _modal.type]);

  const [authed,setAuthed]         = useState(()=>!!localStorage.getItem("onna_token") && !_urlReset);
  const [saveStatus,setSaveStatus] = useState(null); // null | "saving" | "saved"
  const saveStatusTimer = useRef(null);
  useEffect(() => {
    setSaveStatusCallback((status) => {
      clearTimeout(saveStatusTimer.current);
      if (status === "saving") { setSaveStatus("saving"); }
      else if (status === "saved") { setSaveStatus("saved"); saveStatusTimer.current = setTimeout(() => setSaveStatus(null), 2000); }
    });
    return () => { setSaveStatusCallback(null); };
  }, []);

  const doLogin = () => _doLogin(lgUser, lgPass, setLgLoading, setLgErr);
  const doResetRequest = () => _doResetRequest(lgEmail, setLgLoading, setLgStep);
  const doResetConfirm = () => _doResetConfirm(lgNewPass, lgNewPass2, _urlReset, setLgLoading, setLgErr, setLgStep);

  // Auto-logout after 30 min inactivity with 1-minute warning
  useEffect(()=>{
    if (!authed) return;
    const TIMEOUT = 30*60*1000;
    const WARNING = 60*1000;
    const doLogout = ()=>{setShowTimeoutWarning(false);localStorage.removeItem("onna_token");setAuthed(false);};
    const schedule = ()=>{
      clearTimeout(warningRef.current); clearTimeout(timeoutRef.current);
      setShowTimeoutWarning(false);
      warningRef.current = setTimeout(()=>setShowTimeoutWarning(true), TIMEOUT - WARNING);
      timeoutRef.current = setTimeout(doLogout, TIMEOUT);
    };
    schedule();
    const events = ["mousemove","mousedown","keydown","touchstart","scroll"];
    events.forEach(e=>window.addEventListener(e, schedule, {passive:true}));
    return ()=>{ clearTimeout(warningRef.current); clearTimeout(timeoutRef.current); events.forEach(e=>window.removeEventListener(e, schedule)); };
  },[authed]);

  // ── CPS share page (bypasses login — redirects to API-served HTML) ──────────
  const _urlParams = new URLSearchParams(window.location.search);
  const _cpsShareToken = _urlParams.get("cps") || "";
  useEffect(() => {
    if (_cpsShareToken) { window.location.replace(`/api/cps-share?token=${encodeURIComponent(_cpsShareToken)}`); }
  }, [_cpsShareToken]);
  if (_cpsShareToken) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"inherit",color:"#666"}}>Loading schedule...</div>;

  // ── Public signing page (bypasses login) ────────────────────────────────────
  const _signToken = _urlParams.get("sign") || "";

  const _printMode = _urlParams.get("print") === "1";
  useEffect(() => { if (_printMode) document.title = "\u200B"; }, [_printMode]);
  useEffect(() => {
    if (!_signToken) return;
    setSignLoading(true);
    fetch(`/api/sign?token=${encodeURIComponent(_signToken)}&prefer=signed`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setSignError(data.error);
        else setSignData(data); })
      .catch(err => setSignError(err.message))
      .finally(() => setSignLoading(false));
  }, [_signToken]);

  if (_signToken) {
    // CT_FONT, CT_LS, CT_LS_HDR hoisted to top level
    const submitVendorSig = async () => {
      if (!signVendorSig || !signVendorName.trim() || !signVendorDate.trim()) { showAlert("Please fill in your signature, name, and date before submitting."); return; }
      setSignSubmitting(true);
      try {
        // Capture the rendered contract HTML BEFORE submitting (so contract is still visible)
        let renderedHtml = "";
        const el = document.getElementById("onna-sign-print");
        if (el) {
          const clone = el.cloneNode(true);
          clone.querySelectorAll("button").forEach(b=>b.remove());
          clone.querySelectorAll("input").forEach(inp=>{const sp=document.createElement("span");sp.textContent=inp.value;sp.style.cssText=inp.style.cssText;inp.parentNode.replaceChild(sp,inp);});
          clone.querySelectorAll("canvas").forEach(c=>{const img=document.createElement("img");img.src=c.toDataURL();img.style.cssText=c.style.cssText;c.parentNode.replaceChild(img,c);});
          renderedHtml = clone.outerHTML;
        }
        const resp = await fetch("/api/sign", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: _signToken, sigName: signVendorName, sigDate: signVendorDate, signature: signVendorSig, renderedHtml }) });
        const data = await resp.json();
        if (data.ok) {
          // Auto-generate PDF from the captured HTML
          if (el) {
            const clone2 = el.cloneNode(true);
            clone2.querySelectorAll("button").forEach(b=>b.remove());
            clone2.querySelectorAll("input").forEach(inp=>{const sp=document.createElement("span");sp.textContent=inp.value;sp.style.cssText=inp.style.cssText;inp.parentNode.replaceChild(sp,inp);});
            clone2.querySelectorAll("canvas").forEach(c=>{const img=document.createElement("img");img.src=c.toDataURL();img.style.cssText=c.style.cssText;c.parentNode.replaceChild(img,c);});
            clone2.style.borderRadius="0";clone2.style.boxShadow="none";
            const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
            const idoc=iframe.contentDocument;idoc.open();idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;}@media print{@page{margin:0;size:A4;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);idoc.close();
            idoc.body.appendChild(idoc.adoptNode(clone2));setTimeout(()=>{idoc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),1000);},300);
          }
          setSignSubmitted(true);
        }
        else showAlert(data.error || "Submission failed");
      } catch (err) { showAlert("Error: " + err.message); }
      setSignSubmitting(false);
    };

    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    return (
      <div className="sign-outer-wrap" style={{minHeight:"100vh",background:"#f5f5f7",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"}}>
        <style>{`@viewport{width:device-width}@media(max-width:639px){.sign-field-row{flex-direction:column!important}.sign-field-label{width:100%!important;min-width:0!important;border-right:none!important;border-bottom:1px solid #eee!important}.sign-sig-cols{flex-direction:column!important}.sign-sig-left{border-right:none!important;border-bottom:1px solid #eee!important}}@media print{.sign-header-bar,.no-print,.sign-success-banner{display:none!important}body{background:#fff!important;margin:0!important;padding:0!important;}@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.sign-outer-wrap{background:#fff!important;min-height:auto!important}.sign-inner-wrap{margin:0!important;padding:0!important;max-width:none!important}#onna-sign-print{box-shadow:none!important;border-radius:0!important;margin:0!important}}`}</style>
        {!_printMode && <div className="sign-header-bar" style={{background:"#1d1d1f",padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{color:"#fff",fontSize:16,fontWeight:700,letterSpacing:1.5}}>ONNA</span>
          <span style={{color:"#888",fontSize:12,fontWeight:400}}>Contract Signing</span>
        </div>}
        <div className="sign-inner-wrap" style={{maxWidth:860,margin:"20px auto",padding:"0 14px"}}>
          {signLoading && <div style={{textAlign:"center",padding:60,color:"#888"}}>Loading contract...</div>}
          {signError && <div style={{textAlign:"center",padding:60,color:"#c0392b"}}>{signError}</div>}
          {signData && (() => {
            const isSignedOrSubmitted = signData.status === "signed" || signSubmitted;
            const snap = signData.contractSnapshot || {};
            const ctType = signData.ct || signData.contractType || snap.contractType || snap.activeType || "commission_se";
            const ctDef = CONTRACT_DOC_TYPES.find(c=>c.id===ctType) || CONTRACT_DOC_TYPES[0];
            const fv = snap.fieldValues || snap.fv || {};
            const getVal = (key) => fv[key] || fv[`${ctType}_${key}`] || ctDef.fields.find(f=>f.key===key)?.defaultValue || "";
            const generalTerms = (snap.generalTermsEdits||{}).custom || snap.gte || (snap.generalTermsEdits||{})[ctType] || GENERAL_TERMS_DOC[ctType] || "";
            // In print mode or after signing, use stored vendor signature data
            const readOnlySig = _printMode || isSignedOrSubmitted;
            const vs = signData.vendorSig || {};
            const printVendorSig = signSubmitted ? signVendorSig : (vs.signature || "");
            const printVendorName = signSubmitted ? signVendorName : (vs.sigName || "");
            const printVendorDate = signSubmitted ? signVendorDate : (vs.sigDate || "");
            return (
              <div id="onna-sign-print" style={{background:"#fff",borderRadius:_printMode?0:14,padding:isMobile?"28px 16px 20px":"48px 40px 32px",boxShadow:_printMode?"none":"0 2px 12px rgba(0,0,0,0.06)"}}>
                {isSignedOrSubmitted && !_printMode && (
                  <div className="sign-success-banner" style={{background:"#f0faf4",border:"1px solid #c8efd4",borderRadius:10,padding:"12px 18px",marginBottom:20,textAlign:"center"}}>
                    <span style={{fontSize:14,fontWeight:600,color:"#1a5a30"}}>{signSubmitted ? "Signature submitted successfully" : "This contract has been signed"}</span>
                    {!signSubmitted && signData.signedAt && <div style={{fontSize:12,color:"#888",marginTop:4}}>Signed on {new Date(signData.signedAt).toLocaleDateString()}</div>}
                  </div>
                )}
                {snap.prodLogo && <img src={snap.prodLogo} alt="" style={{maxHeight:36,maxWidth:140,objectFit:"contain",marginBottom:4}}/>}
                <div style={{borderBottom:"2.5px solid #000",marginBottom:16}}/>
                <div style={{textAlign:"center",fontFamily:CT_FONT,fontSize:isMobile?10:12,fontWeight:700,letterSpacing:CT_LS_HDR,textTransform:"uppercase",marginBottom:12}}>{ctDef.title}</div>
                {(signData.projectName || signData.label) && <div style={{fontFamily:CT_FONT,fontSize:9,color:"#1a1a1a",letterSpacing:CT_LS,marginBottom:14}}>{signData.projectName && <span>Project: {signData.projectName}</span>}{signData.projectName && signData.label && <span style={{margin:"0 6px"}}>|</span>}{signData.label && <span>{signData.label}</span>}</div>}

                {/* Head Terms (read-only) */}
                {ctDef.headTermsLabel && (<>
                  <div style={{background:"#f4f4f4",padding:"6px 12px",borderBottom:"1px solid #ddd"}}>
                    <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR}}>{ctDef.headTermsLabel}</span>
                  </div>
                  {ctDef.fields.map(field => (
                    <div key={field.key} className="sign-field-row" style={{display:"flex",borderBottom:"1px solid #eee",minHeight:28}}>
                      <div className="sign-field-label" style={{width:180,minWidth:180,padding:"8px 12px",background:"#fafafa",borderRight:"1px solid #eee"}}>
                        <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS}}>{field.label}</span>
                      </div>
                      <div style={{flex:1,padding:"8px 12px"}}>
                        <span style={{fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{getVal(field.key)}</span>
                      </div>
                    </div>
                  ))}
                </>)}

                {/* General Terms (read-only) */}
                <div style={{marginTop:24}}>
                  <div style={{background:"#000",color:"#fff",fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR,textAlign:"center",padding:"4px 0",textTransform:"uppercase"}}>GENERAL TERMS</div>
                  <div style={{fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS,lineHeight:1.6,color:"#1a1a1a",padding:"12px",whiteSpace:"pre-wrap",wordBreak:"break-word",border:"1px solid #eee",borderTop:"none"}}>{generalTerms}</div>
                </div>

                {/* Signature Block */}
                <div style={{marginTop:24}}>
                  <div style={{background:"#000",color:"#fff",fontFamily:CT_FONT,fontSize:10,fontWeight:700,letterSpacing:CT_LS_HDR,textAlign:"center",padding:"4px 0",textTransform:"uppercase"}}>SIGNATURE</div>
                  <div className="sign-sig-cols" style={{display:"flex",borderBottom:"1px solid #eee"}}>
                    {/* Left side (ONNA) - read only */}
                    <div className="sign-sig-left" style={{flex:1,padding:"12px",borderRight:"1px solid #eee"}}>
                      <div style={{fontFamily:CT_FONT,fontSize:9,fontWeight:700,letterSpacing:CT_LS,marginBottom:12}}>{ctDef.sigLeft}</div>
                      <div style={{marginBottom:8}}>
                        <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,display:"block",marginBottom:4}}>Signature:</span>
                        <div style={{height:60,border:"1px solid #ddd",borderRadius:2,background:"#fafafa",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {(snap.signatures||{}).left || (snap.signatures||{})[`${ctType}_left`] ? <img src={(snap.signatures||{}).left || (snap.signatures||{})[`${ctType}_left`]} alt="" style={{maxHeight:56,maxWidth:"100%"}}/> : <span style={{fontSize:9,color:"#bbb"}}>—</span>}
                        </div>
                      </div>
                      {["name","date"].map(f=>(
                        <div key={f} style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline",flexWrap:"wrap"}}>
                          <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:70}}>{f==="name"?"Print Name:":"Date:"}</span>
                          <span style={{fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS}}>{(snap.sigNames||{})[`left_${f}`] || (snap.sigNames||{})[`${ctType}_left_${f}`]||"—"}</span>
                        </div>
                      ))}
                    </div>
                    {/* Right side (Vendor) */}
                    <div style={{flex:1,padding:"12px"}}>
                      <div style={{fontFamily:CT_FONT,fontSize:9,fontWeight:700,letterSpacing:CT_LS,marginBottom:12}}>{ctDef.sigRight}</div>
                      <div style={{marginBottom:8}}>
                        <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,display:"block",marginBottom:4}}>Signature:</span>
                        {readOnlySig ? (
                          <div style={{height:80,border:"1px solid #ddd",borderRadius:2,background:"#fafafa",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {printVendorSig ? <img src={printVendorSig} alt="" style={{maxHeight:76,maxWidth:"100%"}}/> : <span style={{fontSize:9,color:"#bbb"}}>—</span>}
                          </div>
                        ) : <SignaturePad value={signVendorSig} onChange={setSignVendorSig} height={80}/>}
                      </div>
                      {readOnlySig ? (<>
                        <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline",flexWrap:"wrap"}}>
                          <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:70}}>Print Name:</span>
                          <span style={{fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS}}>{printVendorName || "—"}</span>
                        </div>
                        <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline",flexWrap:"wrap"}}>
                          <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:70}}>Date:</span>
                          <span style={{fontFamily:CT_FONT,fontSize:10,letterSpacing:CT_LS}}>{printVendorDate || "—"}</span>
                        </div>
                      </>) : (<>
                        <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline",flexWrap:"wrap"}}>
                          <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:70}}>Print Name:</span>
                          <input value={signVendorName} onChange={e=>setSignVendorName(e.target.value)} placeholder="Print name..." style={{flex:1,minWidth:120,fontFamily:CT_FONT,fontSize:12,border:"none",borderBottom:"1px solid #ccc",outline:"none",padding:"4px 4px",background:"transparent"}}/>
                        </div>
                        <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"baseline",flexWrap:"wrap"}}>
                          <span style={{fontFamily:CT_FONT,fontSize:10,fontWeight:500,letterSpacing:CT_LS,minWidth:70}}>Date:</span>
                          <input value={signVendorDate} onChange={e=>setSignVendorDate(e.target.value)} placeholder="Date..." style={{flex:1,minWidth:120,fontFamily:CT_FONT,fontSize:12,border:"none",borderBottom:"1px solid #ccc",outline:"none",padding:"4px 4px",background:"transparent"}}/>
                        </div>
                      </>)}
                    </div>
                  </div>
                </div>

                {!_printMode && !isSignedOrSubmitted && <div style={{textAlign:"center",marginTop:24,paddingBottom:8}}>
                  {(() => { const canSubmit = !!(signVendorSig && signVendorName.trim() && signVendorDate.trim()); return <button onClick={submitVendorSig} disabled={signSubmitting || !canSubmit} style={{padding:"12px 36px",borderRadius:10,background:canSubmit?"#1a5a30":"#999",color:"#fff",border:"none",fontSize:14,fontWeight:600,cursor:canSubmit?"pointer":"not-allowed",fontFamily:"inherit",opacity:signSubmitting?0.6:1,width:isMobile?"100%":"auto",transition:"background 0.2s"}}>{signSubmitting?"Submitting…":"Submit Signature"}</button>; })()}
                </div>}
                {_printMode && <div className="no-print" style={{textAlign:"center",marginTop:24,paddingBottom:8}}>
                  <button onClick={()=>{
                    const el=document.getElementById("onna-sign-print");if(!el)return;
                    const clone=el.cloneNode(true);clone.querySelectorAll("button").forEach(b=>b.remove());clone.querySelectorAll(".no-print").forEach(b=>b.remove());clone.querySelectorAll(".sign-success-banner").forEach(b=>b.remove());
                    clone.style.borderRadius="0";clone.style.boxShadow="none";
                    const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
                    const idoc=iframe.contentDocument;idoc.open();idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\u200B</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;}@media print{@page{margin:0;size:A4;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);idoc.close();
                    idoc.body.appendChild(idoc.adoptNode(clone));setTimeout(()=>{idoc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),1000);},300);
                  }} style={{padding:"12px 36px",borderRadius:10,background:"#1a5a30",color:"#fff",border:"none",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Download as PDF</button>
                </div>}
              </div>
            ); })()}
        </div>
      </div>
    );
  }

  if (!authed) return (
    <div style={_LG_WRAP}>
      <div style={_LG_CARD}>
        {lgStep==="login"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <LgLogo/>
            <LgIn label="Username" autoFocus value={lgUser} onChange={v=>{setLgUser(v);setLgErr("");}} onEnter={()=>document.getElementById("lg-p").focus()} placeholder="Username" hasErr={!!lgErr}/>
            <LgIn label="Password" id="lg-p" type="password" value={lgPass} onChange={v=>{setLgPass(v);setLgErr("");}} onEnter={doLogin} placeholder="••••••••••" hasErr={!!lgErr}/>
            {lgErr&&<div style={{fontSize:12,color:"#c0392b",textAlign:"center",fontWeight:500}}>{lgErr}</div>}
            <LgBtn onClick={doLogin} disabled={lgLoading||!lgUser.trim()||!lgPass.trim()}>{lgLoading?"Signing in…":"Sign In"}</LgBtn>
            <LgLink onClick={()=>{setLgStep("forgot");setLgErr("");}}>Forgot password?</LgLink>
          </div>
        )}
        {lgStep==="forgot"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <LgLogo/>
            <div style={{fontSize:13,color:"#6e6e73",textAlign:"center",marginTop:-14,marginBottom:6}}>Enter your email to receive a reset link</div>
            <LgIn label="Email Address" type="email" autoFocus value={lgEmail} onChange={v=>{setLgEmail(v);setLgErr("");}} onEnter={doResetRequest} placeholder="Your email address" hasErr={!!lgErr}/>
            <LgBtn onClick={doResetRequest} disabled={lgLoading||!lgEmail.trim()}>{lgLoading?"Sending…":"Send Reset Link"}</LgBtn>
            <LgLink onClick={()=>{setLgStep("login");setLgErr("");}}>‹ Back to sign in</LgLink>
          </div>
        )}
        {lgStep==="forgot-sent"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:16}}>📧</div>
            <div style={{fontSize:18,fontWeight:700,color:"#1d1d1f",marginBottom:8}}>Check your inbox</div>
            <div style={{fontSize:13,color:"#6e6e73",lineHeight:1.7,marginBottom:24}}>If that email is registered, a reset link has been sent.<br/>It expires in 1 hour.</div>
            <button onClick={()=>{setLgStep("login");setLgEmail("");}} style={{padding:"11px 28px",borderRadius:11,background:"#1d1d1f",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Back to sign in</button>
          </div>
        )}
        {lgStep==="reset"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <LgLogo/>
            <div style={{fontSize:13,color:"#6e6e73",textAlign:"center",marginTop:-14,marginBottom:6}}>Choose a new password</div>
            <LgIn label="New Password" type="password" autoFocus value={lgNewPass} onChange={v=>{setLgNewPass(v);setLgErr("");}} onEnter={()=>document.getElementById("lg-p2").focus()} placeholder="Min 8 chars, 1 uppercase, 1 number" hasErr={!!lgErr}/>
            <LgIn label="Confirm Password" id="lg-p2" type="password" value={lgNewPass2} onChange={v=>{setLgNewPass2(v);setLgErr("");}} onEnter={doResetConfirm} placeholder="Repeat password" hasErr={!!lgErr}/>
            {lgErr&&<div style={{fontSize:12,color:"#c0392b",textAlign:"center",fontWeight:500}}>{lgErr}</div>}
            <LgBtn onClick={doResetConfirm} disabled={lgLoading||!lgNewPass||!lgNewPass2}>{lgLoading?"Saving…":"Set New Password"}</LgBtn>
          </div>
        )}
        {lgStep==="reset-done"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:16}}>✓</div>
            <div style={{fontSize:18,fontWeight:700,color:"#1d1d1f",marginBottom:8}}>Password updated</div>
            <div style={{fontSize:13,color:"#6e6e73",marginBottom:24}}>Sign in with your new password.</div>
            <button onClick={()=>{setLgStep("login");setLgNewPass("");setLgNewPass2("");window.history.replaceState({},"","/");}} style={{padding:"11px 28px",borderRadius:11,background:"#1d1d1f",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Sign In</button>
          </div>
        )}
      </div>
    </div>
  );

  useEffect(()=>{try{localStorage.removeItem('onna_dash_widget_sizes');}catch{}},[]);

  // ── Vendor / Lead / Outreach state from VendorLeadContext ──
  const {
    vendors,setVendors,bbCat,setBbCat,bbLocation,setBbLocation,
    showRateModal,setShowRateModal,rateInput,setRateInput,
    editVendor,setEditVendor,newVendor,setNewVendor,
    newLead,setNewLead,localLeads,setLocalLeads,
    leadStatusOverrides,setLeadStatusOverrides,
    outreach,setOutreach,outreachMsg,setOutreachMsg,
    outreachLoading,setOutreachLoading,
    customLeadLocs,setCustomLeadLocs,customLeadCats,setCustomLeadCats,
    customVendorCats,setCustomVendorCats,
    hiddenLeadBuiltins,setHiddenLeadBuiltins,
    hiddenVendorBuiltins,setHiddenVendorBuiltins,
    showCatManager,setShowCatManager,
    catEdit,setCatEdit,catEditVal,setCatEditVal,catSaving,setCatSaving,
    customVendorLocs,setCustomVendorLocs,
  } = useVendorLead();

  // ── Project state from ProjectContext ──
  const {
    selectedProject,setSelectedProject,projectSection,setProjectSection,
    creativeSubSection,setCreativeSubSection,budgetSubSection,setBudgetSubSection,
    invoiceTab,setInvoiceTab,previewFile,setPreviewFile,
    quoteSearchTerm,setQuoteSearchTerm,invoiceSearchTerm,setInvoiceSearchTerm,
    creativeSearchTerm,setCreativeSearchTerm,castFileSearchTerm,setCastFileSearchTerm,
    styleSearchTerm,setStyleSearchTerm,documentsSubSection,setDocumentsSubSection,
    scheduleSubSection,setScheduleSubSection,travelSubSection,setTravelSubSection,
    permitsSubSection,setPermitsSubSection,stylingSubSection,setStylingSubSection,
    locSubSection,setLocSubSection,castingSubSection,setCastingSubSection,
    linkUploading,setLinkUploading,linkUploadProgress,setLinkUploadProgress,
    projectEntries,setProjectEntries,aiMsg,setAiMsg,aiLoading,setAiLoading,
    attachedFile,setAttachedFile,projectFiles,setProjectFiles,
    projectFileStore,setProjectFileStore,fileStoreReady,setFileStoreReady,
    projectLocLinks,setProjectLocLinks,projectCreativeLinks,setProjectCreativeLinks,
    getProjectFiles,addProjectFiles,
  } = useProject();
  // ── Agent / Document store state from AgentContext ──
  const {
    csDuplicateModal,setCsDuplicateModal,csDuplicateSearch,setCsDuplicateSearch,
    raDuplicateModal,setRaDuplicateModal,raDuplicateSearch,setRaDuplicateSearch,
    csCreateMenuDocs,setCsCreateMenuDocs,
    createMenuOpen,setCreateMenuOpen,duplicateModal,setDuplicateModal,duplicateSearch,setDuplicateSearch,
    projectContracts,setProjectContracts,
    callSheetStore,setCallSheetStore,activeCSVersion,setActiveCSVersion,
    riskAssessmentStore,setRiskAssessmentStore,activeRAVersion,setActiveRAVersion,
    contractDocStore,setContractDocStore,activeContractVersion,setActiveContractVersion,
    cpsStore,setCpsStore,activeCPSVersion,setActiveCPSVersion,
    cpsShareUrl,setCpsShareUrl,cpsShareLoading,setCpsShareLoading,
    cpsShareTabs,setCpsShareTabs,cpsRef,cpsAutoSyncTimer,cpsAutoSyncing,setCpsAutoSyncing,
    shotListStore,setShotListStore,activeShotListVersion,setActiveShotListVersion,
    slShareUrl,setSlShareUrl,slShareLoading,setSlShareLoading,slRef,
    storyboardStore,setStoryboardStore,activeStoryboardVersion,setActiveStoryboardVersion,
    sbShareUrl,setSbShareUrl,sbShareLoading,setSbShareLoading,sbRef,
    recceShareUrl,setRecceShareUrl,recceShareLoading,setRecceShareLoading,
    recceReportStore,setRecceReportStore,activeRecceVersion,setActiveRecceVersion,
    postProdStore,setPostProdStore,activePostProdVersion,setActivePostProdVersion,
    ppShareUrl,setPpShareUrl,ppShareLoading,setPpShareLoading,ppRef,
    fittingStore,setFittingStore,activeFittingVersion,setActiveFittingVersion,
    fitShareLoading,setFitShareLoading,fitShareTabs,setFitShareTabs,fitDeckRef,
    locDeckStore,setLocDeckStore,activeLocDeckVersion,setActiveLocDeckVersion,
    locShareUrl,setLocShareUrl,locShareLoading,setLocShareLoading,
    locShareTabs,setLocShareTabs,locDeckRef,
    castingDeckStore,setCastingDeckStore,activeCastingDeckVersion,setActiveCastingDeckVersion,
    castDeckShareUrl,setCastDeckShareUrl,castDeckShareLoading,setCastDeckShareLoading,
    castDeckShareTabs,setCastDeckShareTabs,castDeckRef,
    castingTableStore,setCastingTableStore,activeCastingTableVersion,setActiveCastingTableVersion,
    ctShareUrl,setCtShareUrl,ctShareLoading,setCtShareLoading,ctRef,
    ctTypeModalOpen,setCtTypeModalOpen,ctSignShareUrl,setCtSignShareUrl,
    ctSignShareLoading,setCtSignShareLoading,
    travelItineraryStore,setTravelItineraryStore,activeTIVersion,setActiveTIVersion,
    tiShowAddMenu,setTiShowAddMenu,
    dietaryStore,setDietaryStore,activeDietaryVersion,setActiveDietaryVersion,
    dietaryTab,setDietaryTab,
    projectEstimates,setProjectEstimates,activeEstimateVersion,setActiveEstimateVersion,
    editingEstimate,setEditingEstimate,
    projectNotes,setProjectNotes,projectInfo,setProjectInfo,projectInfoRef,
    actualsTrackerTab,setActualsTrackerTab,actualsExpandedRef,
    contractType,setContractType,contractFields,setContractFields,
    generatedContract,setGeneratedContract,contractLoading,setContractLoading,
  } = useAgentStore();
  const [projectActuals,setProjectActuals]               = useState({});
  const [actualsReady,setActualsReady]                   = useState(false);
  const [projectCasting,setProjectCasting]               = useState({});
  const [castingReady,setCastingReady]                   = useState(false);
  const [castAgencyOpen,setCastAgencyOpen]               = useState(null);

  // Auto-poll pending signing requests every 30s
  useEffect(() => {
    if (!authed) return;
    const poll = async () => {
      const token = getToken(); if (!token) return;
      const allProjects = Object.entries(contractDocStore);
      for (const [pid, contracts] of allProjects) {
        if (!Array.isArray(contracts)) continue;
        for (let i = 0; i < contracts.length; i++) {
          const ct = contracts[i];
          if (ct.signingStatus !== "pending" || !ct.signingToken) continue;
          try {
            const resp = await fetch(`/api/sign?token=${encodeURIComponent(ct.signingToken)}`, {headers:{"Authorization":`Bearer ${token}`}});
            const data = await resp.json();
            if (data.status === "signed" && data.vendorSig) {
              setContractDocStore(prev => {
                const store = JSON.parse(JSON.stringify(prev)); const arr = store[pid] || []; const c = arr[i]; if (!c) return store;
                c.sigNames = { ...(c.sigNames||{}), right_name: data.vendorSig.sigName||"", right_date: data.vendorSig.sigDate||"" };
                c.signatures = { ...(c.signatures||{}), right: data.vendorSig.signature||"" };
                c.signingStatus = "signed"; arr[i] = c; store[pid] = arr; return store;
              });
            }
          } catch {}
        }
      }
    };
    poll(); // check immediately on load
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [authed, contractDocStore]);

  const [showAddProject,setShowAddProject]   = useState(false);
  const [showFromTemplate,setShowFromTemplate] = useState(false);
  const [templateProject,setTemplateProject]   = useState({client:"",name:"",revenue:"",cost:"",status:"Active",year:2026});
  const [showAddLead,setShowAddLead]         = useState(false);
  const [showAddVendor,setShowAddVendor]     = useState(false);
  const [showArchive,setShowArchive]         = useState(false);
  // showArchivedProjects moved to Projects component
  const [showUserMenu,setShowUserMenu]       = useState(false);
  const [settingsSection,setSettingsSection] = useState("deleted");

  // ── SOP state ───────────────────────────────────────────────────────────────
  const [sops,setSops] = useState(()=>{
    try{const raw=localStorage.getItem('onna_sops');if(raw){const parsed=JSON.parse(raw);if(parsed.length)return parsed;}}catch{}
    const now=new Date().toISOString();
    const seed=[
      {id:1,title:"How to Use Vendor Vinnie",category:"agent",agent:"logistical",order:0,created_at:now,updated_at:now,content:"# How to Use Vendor Vinnie\n\nVendor Vinnie is your contact management assistant. He connects directly to the ONNA database — every contact you give him is saved in real time.\n\n## Three Core Capabilities\n\n### 1. Add a Vendor\nTell Vinnie the vendor's details and a save form appears automatically.\n\n- Name and company\n- Category (Locations, Catering, Equipment, etc.)\n- Email, phone, location\n- Any additional notes\n\n**Example prompt:** \"Add a new vendor — Stellar Lighting, Equipment category, email info@stellar.ae, phone +971 50 123 4567, based in Dubai\"\n\n### 2. Log Outreach\nWhen you've contacted someone, tell Vinnie and he'll log it with today's date.\n\n- Mention who you contacted and how (call, email, WhatsApp)\n- He auto-fills the date\n- The outreach record saves to the Clients tab\n\n**Example prompt:** \"I just emailed Sarah at Meridian Group about the Q2 campaign\"\n\n### 3. Search Contacts\nFind vendors by name, category, or location.\n\n**Example prompt:** \"Find all catering vendors in Abu Dhabi\"\n\n## Tips\n\n- You can add multiple vendors in one message\n- Vinnie understands natural language — no need for exact formatting\n- All saved contacts appear in the Vendors tab immediately"},
      {id:2,title:"How to Use Call Sheet Connie",category:"agent",agent:"compliance",order:1,created_at:now,updated_at:now,content:"# How to Use Call Sheet Connie\n\nCall Sheet Connie is your production coordinator. She reads and updates live call sheet data for any project.\n\n## Three Core Capabilities\n\n### 1. Edit Call Sheet\nAdd crew members, update call times, locations, and schedule details.\n\n- Add crew with name, role, call time, and wrap time\n- Update locations, parking details, nearest hospital\n- Set weather notes, general notes, and production contacts\n\n**Example prompt:** \"Add John Smith as Gaffer, call time 06:00, wrap 18:00\"\n\n### 2. Review & Check\nConnie scans the call sheet and flags what's missing or incomplete.\n\n**Example prompt:** \"Review the call sheet for Day 1 — what's missing?\"\n\n### 3. Dietary & Catering\nManage dietary requirements and meal planning for the crew.\n\n- Add dietary restrictions per crew member\n- Set breakfast, lunch, and snack menus\n- Track headcount for catering orders\n\n**Example prompt:** \"Add dietary: Sarah is vegan, Mike is gluten-free\"\n\n## Tips\n\n- Connie will ask which project to work on first\n- She can handle multiple crew additions in one message\n- All changes save to the call sheet in real time\n- Use \"switch to dietaries\" to manage catering lists separately"},
      {id:3,title:"How to Use Risk Assessment Ronnie",category:"agent",agent:"researcher",order:2,created_at:now,updated_at:now,content:"# How to Use Risk Assessment Ronnie\n\nRisk Assessment Ronnie is your safety and compliance officer. He manages hazard logs and risk assessments for every shoot day.\n\n## Three Core Capabilities\n\n### 1. Add Risks\nLog hazards with severity ratings, likelihood, and mitigation measures.\n\n- Describe the hazard (e.g. working at height, water proximity, pyrotechnics)\n- Ronnie assigns severity (Low / Medium / High / Critical)\n- He adds likelihood and recommended control measures\n\n**Example prompt:** \"Add risk: shooting near water at Dubai Creek — crew will be on an unfenced dock\"\n\n### 2. Review Assessment\nCheck what's missing or needs updating on the current risk assessment.\n\n**Example prompt:** \"Review the risk assessment for Day 2 — are we covered?\"\n\n### 3. Generate Report\nSummarise all logged risks for a shoot day into a formatted report.\n\n**Example prompt:** \"Generate a risk report for the Marina shoot\"\n\n## Tips\n\n- Ronnie follows Dubai municipality safety guidelines\n- He'll flag if critical risks don't have mitigation measures\n- Reports can be exported for client or location approval"},
      {id:4,title:"How to Use Meeting Minnie",category:"agent",agent:"minnie",order:3,created_at:now,updated_at:now,content:"# How to Use Meeting Minnie\n\nMeeting Minnie is your scheduling assistant. She helps manage meeting requests, check availability, and draft professional responses.\n\n## Three Core Capabilities\n\n### 1. Schedule Meeting\nPaste a meeting request (from email, WhatsApp, etc.) and Minnie will extract the details and propose available time slots.\n\n- She identifies who, what, and proposed times\n- Checks for conflicts with your schedule\n- Proposes 3 alternative slots if needed\n\n**Example prompt:** \"Got this email: 'Hi, can we meet Thursday to discuss the Pulse Fitness campaign? Anytime after 2pm works.' — schedule it\"\n\n### 2. Check Calendar\nReview upcoming meetings and spot conflicts.\n\n**Example prompt:** \"What's on my schedule this week? Any conflicts?\"\n\n### 3. Draft Reply\nMinnie writes a professional response with available time options, signed off as the ONNA team.\n\n**Example prompt:** \"Draft a reply to Sarah confirming Tuesday at 10am GST\"\n\n## Tips\n\n- All times are in Dubai time (GST, UTC+4)\n- Minnie signs off as the ONNA team\n- Connect your Google Calendar for real availability checking"},
      {id:5,title:"How to Use Budget Billie",category:"agent",agent:"billie",order:4,created_at:now,updated_at:now,content:"# How to Use Budget Billie\n\nBudget Billie is your production budget and expense tracking assistant. She builds detailed line-item budgets using current Dubai market rates.\n\n## Three Core Capabilities\n\n### 1. Build & Edit Budget\nCreate line-item production estimates with dual currency (AED/USD).\n\n- Add line items with descriptions, quantities, unit rates, and days\n- 15%% Agency Fee and 10%% Contingency applied by default\n- Update rates, add/remove items, adjust markup\n- Attach a brief or moodboard image and Billie will extract budget items from it\n\n**Example prompt:** \"Build a 2-day shoot budget — 1 director, 1 DOP, 2 camera assistants, lighting package, and catering for 15 crew\"\n\n### 2. Log Expenses\nTrack actual spend against the budget.\n\n- Add costs as they come in\n- Categorise spend by department\n- Update Zoho amounts for accounting sync\n\n**Example prompt:** \"Log expense: AED 3,200 for camera rental from Stellar Equipment\"\n\n### 3. Review & Compare\nActuals vs estimates variance analysis.\n\n- Flag overruns before they become problems\n- Check remaining budget by category\n- Export comparison to PDF\n\n**Example prompt:** \"How are we tracking on the Pulse Fitness budget? Any overruns?\"\n\n## Tips\n\n- Fixed rate: 1 USD = 3.67 AED (switchable to GBP, EUR, SAR)\n- Billie knows Dubai, London, and EU market rates\n- Attach a creative brief image and she'll auto-generate a budget from it"},
      {id:6,title:"How to Use Contract Cody",category:"agent",agent:"contracts",order:5,created_at:now,updated_at:now,content:"# How to Use Contract Cody\n\nContract Cody is your contract drafting and document management assistant. He handles live contracts, generates legal documents, and manages signing.\n\n## Three Core Capabilities\n\n### 1. Live Contracts\nFill in contract fields, switch between contract types, and review or export.\n\n- Commissioning Agreements, Talent Agreements, Crew Deals, Location Agreements\n- Review what fields are missing\n- Export completed contracts to PDF\n\n**Example prompt:** \"Fill in the talent agreement for Sarah Khan — day rate AED 5,000, 3 shoot days, usage 12 months MENA\"\n\n### 2. Generate Documents\nDraft custom legal documents from scratch based on your description.\n\n- Waivers, NDAs, release forms, consent forms\n- Location agreements, talent releases, crew memos\n- Based on ONNA's standard legal language\n\n**Example prompt:** \"Generate an NDA for a client meeting with Pulse Fitness\"\n\n### 3. Sign & Stamp\nAdd signature, company stamp, and ONNA letterhead to documents.\n\n- Upload a PDF or use a generated document\n- Choose which pages get signature, stamp, or letterhead\n- Drag to reposition elements on the preview\n\n**Example prompt:** \"Add signature and stamp to the Meridian Group commissioning agreement\"\n\n## Tips\n\n- All changes save automatically to the project\n- Upload any PDF and Cody can add ONNA branding to it\n- You can switch contract types without losing data"},
      {id:7,title:"How to Use Casting Carrie",category:"agent",agent:"carrie",order:6,created_at:now,updated_at:now,content:"# How to Use Casting Carrie\n\nCasting Carrie is your casting coordinator. She manages talent databases, casting briefs, and exports for client review.\n\n## Three Core Capabilities\n\n### 1. Add Talent\nAdd models, actors, or extras with full details.\n\n- Name, age range, gender, ethnicity\n- Agency and agent contact info\n- Rates, availability, and portfolio links\n\n**Example prompt:** \"Add talent: Layla Hassan, female, age 25-30, represented by Stage Models, available March 15-20\"\n\n### 2. Search & Brief\nSearch agencies or generate a casting brief for distribution.\n\n- Search by type (model, actor, extra), demographics, or availability\n- Generate a formatted casting brief with role requirements\n- Brief includes shoot dates, usage, wardrobe notes\n\n**Example prompt:** \"Generate a casting brief — we need 3 male models, age 30-40, for a 2-day shoot in Dubai Marina, usage 6 months digital\"\n\n### 3. Review & Export\nCheck casting status and export to PDF or CSV.\n\n- See who's confirmed, on hold, or pending\n- Export the full casting table for client approval\n- Track fitting dates and measurements\n\n**Example prompt:** \"Export the casting table for the Pulse Fitness shoot\"\n\n## Tips\n\n- Carrie will ask which project to work on first\n- She can handle bulk talent additions\n- All data syncs to the casting table in real time"},
      {id:8,title:"How to Use Travel Tina",category:"agent",agent:"tina",order:7,created_at:now,updated_at:now,content:"# How to Use Travel Tina\n\nTravel Tina is your travel and logistics coordinator. She builds and manages detailed travel itineraries for production shoots.\n\n## Three Core Capabilities\n\n### 1. Build Itinerary\nCreate comprehensive travel plans for cast and crew.\n\n- Flights with airline, times, booking references\n- Hotel bookings with check-in/out dates and confirmation numbers\n- Ground transport (airport transfers, daily drivers, unit moves)\n- Visa requirements and processing deadlines\n- Per diem allowances by location\n\n**Example prompt:** \"Build a travel itinerary for the Dubai shoot — 3 crew flying from London on March 10, returning March 15, hotel near JBR\"\n\n### 2. Update & Manage\nModify existing itineraries as plans change.\n\n- Change flight times or add connections\n- Update hotel bookings or add room requests\n- Adjust per diems and manage travel budgets\n\n**Example prompt:** \"Change the DOP's flight to Emirates EK002 departing 21:30 on March 9\"\n\n### 3. Review & Export\nCheck itineraries for completeness and prepare for distribution.\n\n- Flag missing visa info, passport expiry issues, or booking gaps\n- Check for scheduling conflicts with call sheet times\n- Export formatted itineraries for the team\n\n**Example prompt:** \"Review the travel itinerary — is everyone's visa sorted?\"\n\n## Tips\n\n- Tina considers time zones and layover durations automatically\n- Default currency is AED with USD equivalent\n- Always include emergency contacts and local fixer details\n- Group travel by person/role for clarity"},
      {id:9,title:"How to Use Talent Tabby",category:"agent",agent:"tabby",order:8,created_at:now,updated_at:now,content:"# How to Use Talent Tabby\n\nTalent Tabby is your talent and wardrobe coordinator. She manages casting decks, fitting sessions, and styling across your productions.\n\n## Three Core Capabilities\n\n### 1. Casting Decks\nBuild and organise visual casting decks for client review.\n\n- Add talent with photos, measurements, and agency details\n- Create options boards (First Option, Second Option, etc.)\n- Organise by role — lead, supporting, extras\n- Track status: Pencilled, Confirmed, Released\n\n**Example prompt:** \"Add Layla Hassan as First Option for the Lead role — she's with Stage Models, height 170cm\"\n\n### 2. Fittings & Styling\nSchedule and manage fitting sessions and wardrobe.\n\n- Track wardrobe items per talent per scene/look\n- Log measurements (height, chest, waist, hips, shoe size)\n- Upload fitting photos for each look\n- Note styling preferences and client feedback\n\n**Example prompt:** \"Schedule a fitting for Layla on March 12 — we need 3 looks: casual, business, and evening\"\n\n### 3. Review & Share\nCheck talent status and prepare decks for clients.\n\n- See who's confirmed vs still on option\n- Generate shareable casting deck links\n- Compare talent side-by-side for client decisions\n\n**Example prompt:** \"Show me the casting status — who's confirmed and who's still pending?\"\n\n## Tips\n\n- Tabby works across casting decks, casting tables, and fittings simultaneously\n- She can pull talent details from Casting Carrie's data\n- Use shareable links to get client feedback on casting choices\n- Always capture measurements during fittings for wardrobe planning"},
      {id:10,title:"How to Use Producer Polly",category:"agent",agent:"polly",order:9,created_at:now,updated_at:now,content:"# How to Use Producer Polly\n\nProducer Polly is your production coordinator. She manages creative production schedules (CPS), shot lists, storyboards, equipment lists, wrap reports, and creative briefs.\n\n## Three Core Capabilities\n\n### 1. CPS & Shot Lists\nBuild and manage production timelines and detailed shot lists.\n\n- Create CPS with phases: Briefing, Pre-Production, Production, Post, Review, Delivery\n- Add milestones, deadlines, and task owners\n- Build shot lists with scene breakdowns, shot types (WS/MS/CU/ECU), lenses, and notes\n- Track status per task: Not Started, In Progress, Complete\n\n**Example prompt:** \"Build a CPS for a 3-day shoot starting March 15 — pre-pro needs 2 weeks, post needs 3 weeks\"\n\n**Example prompt:** \"Create a shot list for Scene 1 — 5 shots, mix of wide and close-ups, talent walking through Dubai Marina at sunset\"\n\n### 2. Storyboards & Briefs\nStructure visual narratives and draft creative briefs.\n\n- Build storyboard frames with descriptions, camera movements, and transitions\n- Add reference images to each frame\n- Draft creative briefs with objectives, target audience, tone, and deliverables\n\n**Example prompt:** \"Build a storyboard — 8 frames for a 30-second product reveal, starting with a drone shot and ending on product close-up\"\n\n### 3. Equipment & Wrap\nManage equipment lists and post-shoot wrap reports.\n\n- Build equipment lists by category: camera, lighting, grip, audio, special\n- Include quantities, rental rates, and supplier info\n- Compile wrap reports: actual vs planned schedule, budget variances, crew feedback\n\n**Example prompt:** \"Build an equipment list for a 2-camera shoot with Arri Alexa Mini, full lighting package, and audio\"\n\n## Tips\n\n- Polly manages CPS, shot lists, and storyboards — all linked to the same project\n- Shot lists should reference scene numbers for easy cross-reference\n- Use the storyboard to align client expectations before the shoot\n- Wrap reports help improve future productions — always do one"},
      {id:11,title:"How to Use Location Lillie",category:"agent",agent:"lillie",order:10,created_at:now,updated_at:now,content:"# How to Use Location Lillie\n\nLocation Lillie is your locations coordinator. She manages location decks and recce (reconnaissance) reports for production shoots.\n\n## Three Core Capabilities\n\n### 1. Location Decks\nBuild comprehensive location presentations for client review.\n\n- Add locations with photos, addresses, and GPS coordinates\n- Include contact details, access notes, and parking info\n- Track permit requirements and status\n- Rate and compare location options\n\n**Example prompt:** \"Add Dubai Marina Walk as a location — waterfront promenade, permit required from DCCA, free parking at JBR\"\n\n### 2. Recce Reports\nCreate detailed site visit documentation.\n\n- Power access and generator requirements\n- Lighting conditions and sun direction\n- Noise levels and sound challenges\n- Safety considerations and nearest hospital\n- Crew facilities (toilets, holding area, catering space)\n- Mobile signal strength\n\n**Example prompt:** \"Create a recce report for the Marina location — we visited today, power available via 2x 16A sockets, noise from construction next door before 9am\"\n\n### 3. Review & Share\nCompare locations and prepare polished decks.\n\n- Compare multiple location options side-by-side\n- Check permit deadlines and flag expiring approvals\n- Generate shareable links for client review\n- Include backup/alternative locations\n\n**Example prompt:** \"Compare the 3 shortlisted locations — which one has the best sun direction for a 2pm shoot?\"\n\n## Tips\n\n- For Dubai: always note if DCCA permit, security clearance, or community approval is needed\n- Include sunrise/sunset times and sun position for each location\n- Document power supply — does the location need a generator?\n- Always note the nearest hospital and emergency access route"},
      {id:12,title:"How to Use Post Producer Perry",category:"agent",agent:"perry",order:11,created_at:now,updated_at:now,content:"# How to Use Post Producer Perry\n\nPost Producer Perry is your post-production coordinator. He manages deliverables, post schedules, and client review workflows.\n\n## Three Core Capabilities\n\n### 1. Deliverables & Specs\nDefine and track all project deliverables with technical specifications.\n\n- Video deliverables: resolution, aspect ratio, codec, frame rate, colour space\n- Stills deliverables: format, resolution, colour profile\n- Social cuts: platform-specific specs (Instagram 9:16, YouTube 16:9, TikTok, etc.)\n- Naming conventions and file transfer method\n\n**Example prompt:** \"Set up deliverables — 1x hero film 16:9 ProRes 422 HQ, 3x social cuts 9:16 H.264, 20 retouched stills TIFF and JPEG\"\n\n### 2. Post Schedule\nBuild and manage post-production timelines.\n\n- Track phases: selects, offline edit, online, colour grade, sound design, VFX, final delivery\n- Set milestones with owners and deadlines\n- Monitor status and flag delays\n- View as list or calendar\n\n**Example prompt:** \"Build a post schedule — offline edit 5 days starting March 20, colour 2 days, sound 1 day, client review rounds on March 28 and April 2\"\n\n### 3. Review & Feedback\nManage client review rounds and track amends.\n\n- Log feedback per review round (R1, R2, R3)\n- Track amend status per deliverable\n- Include links to review platforms (Frame.io, Google Drive)\n- Record frame-accurate notes\n\n**Example prompt:** \"Log client feedback from R1 — they want the opening shot shorter, colour warmer on scene 3, and music change in the outro\"\n\n## Tips\n\n- Standard master format: ProRes 422 HQ, web delivery: H.264\n- Always track review round numbers clearly (R1, R2, R3)\n- Flag any deliverables at risk of missing deadline early\n- The calendar view shows all post tasks on a timeline"},
      {id:13,title:"Pre-Production Workflow",category:"workflow",agent:"",order:12,created_at:now,updated_at:now,content:"# Pre-Production Workflow\n\nStandard operating procedure for taking a project from brief to shoot-ready.\n\n## Phase 1: Project Setup\n\n1. Create the project in the Dashboard with client name, project name, and estimated revenue/cost\n2. Set project status to **Active**\n3. Assign the project to the relevant producer\n\n## Phase 2: Creative Planning\n\n1. Open **Producer Polly** and build the CPS (Creative Production Schedule) with all phases and milestones\n2. Use Polly to create the shot list and storyboard from the creative brief\n3. Draft the equipment list based on the shot requirements\n\n## Phase 3: Budgeting\n\n1. Open **Budget Billie** and select the project\n2. Build the initial estimate — attach the brief/moodboard for Billie to extract line items\n3. Review agency fee (15%%) and contingency (10%%)\n4. Export the estimate PDF for client approval\n5. Once approved, lock the budget as the baseline\n\n## Phase 4: Contracts\n\n1. Open **Contract Cody** and select the project\n2. Generate the Commissioning Agreement from the approved estimate\n3. Fill in payment terms, deliverables, and usage rights\n4. Add signature and stamp, then send for client signature\n5. Generate Talent Agreements and Crew Deals as needed\n\n## Phase 5: Casting & Talent\n\n1. Open **Casting Carrie** to manage the casting table — add talent, track options\n2. Use **Talent Tabby** to build casting decks for client review\n3. Once talent is confirmed, use Tabby to schedule fittings and track wardrobe\n4. Share casting deck links with the client for approval\n\n## Phase 6: Locations\n\n1. Open **Location Lillie** to build the location deck\n2. After site visits, create recce reports with power, safety, and access details\n3. Share location deck with client for approval\n4. Track permit status and deadlines\n\n## Phase 7: Travel & Logistics\n\n1. Use **Travel Tina** to build travel itineraries for all travelling cast/crew\n2. Include flights, hotels, ground transport, and visa requirements\n3. Use **Vendor Vinnie** to book vendors (equipment, locations, catering, transport)\n4. Log all outreach in the system\n\n## Phase 8: Call Sheets & Safety\n\n1. Use **Call Sheet Connie** to build the call sheet for each shoot day\n2. Run **Risk Assessment Ronnie** for each location\n3. Have Connie review the call sheet for completeness\n4. Distribute call sheets to crew minimum 24 hours before\n\n## Phase 9: Final Checks\n\n- All contracts signed and filed\n- Budget approved and baseline locked\n- Call sheets distributed with all crew confirmed\n- Risk assessments approved and on-set copies printed\n- Catering confirmed with dietary requirements (via Connie)\n- Travel itineraries distributed (via Tina)\n- All vendor bookings confirmed with POs issued\n- Location permits secured (via Lillie)\n- Casting confirmed and fittings complete (via Tabby)\n- Equipment list finalised and booked (via Polly)"},
      {id:14,title:"Post-Production & Wrap Workflow",category:"workflow",agent:"",order:13,created_at:now,updated_at:now,content:"# Post-Production & Wrap Workflow\n\nStandard operating procedure for wrapping a shoot and managing post-production through to final delivery.\n\n## Day-Of Wrap\n\n1. Confirm all crew have signed out on the call sheet\n2. Return all rented equipment — note any damages\n3. Collect all memory cards and hard drives\n4. Get final headcount from catering for invoice reconciliation\n5. Use **Producer Polly** to compile a wrap report with lessons learned\n\n## Post-Production Setup\n\n1. Open **Post Producer Perry** and select the project\n2. Define all deliverables with technical specs (resolution, codec, format)\n3. Build the post schedule with milestones for edit, colour, sound, and delivery\n4. Set up review rounds with client deadlines\n\n## Edit & Review Workflow\n\n1. Editor delivers offline cut — mark as In Progress in Perry's schedule\n2. Share review link with the client via Perry's feedback panel\n3. Log all client feedback per round (R1, R2, R3)\n4. Track amend status — flag anything at risk of missing deadline\n5. Once approved, move to colour grade and sound design\n\n## Expense Reconciliation\n\n1. Open **Budget Billie** and select the project\n2. Log all outstanding expenses and receipts\n3. Run **Review & Compare** to check actuals vs estimates\n4. Flag any overruns and document reasons\n5. Update Zoho with final amounts\n\n## Final Delivery\n\n1. Export all deliverables per spec (via Perry's deliverables tracker)\n2. Upload to client delivery platform\n3. Confirm client sign-off on all deliverables\n4. Update project status to **Completed**\n\n## Financial Close\n\n1. Issue final invoice based on contract payment terms\n2. Reconcile all vendor invoices against POs\n3. Close out the budget in Budget Billie\n4. Archive the project once all payments are settled\n\n## Post-Mortem\n\n- What went well?\n- What could be improved?\n- Any vendor or talent notes for future reference?\n- Update vendor ratings and notes in **Vendor Vinnie**\n- Save any production learnings to **SOPs** for the team"}
    ];
    try{localStorage.setItem('onna_sops',JSON.stringify(seed));}catch{}
    return seed;
  });
  const [sopEditId,setSopEditId] = useState(null);
  const [sopDraft,setSopDraft] = useState({title:"",content:"",category:"agent",agent:""});
  const [sopAddOpen,setSopAddOpen] = useState(false);
  const [sopPreview,setSopPreview] = useState(false);
  const [sopFilter,setSopFilter] = useState("all");
  useEffect(()=>{try{localStorage.setItem('onna_sops',JSON.stringify(sops));}catch{} if(globalHydratedRef.current) debouncedGlobalSave('sops',sops);},[sops]);

  const [archive,setArchive]                 = useState(()=>{try{const raw=JSON.parse(localStorage.getItem('onna_archive')||'[]');const cutoff=Date.now()-30*24*60*60*1000;const filtered=raw.filter(e=>new Date(e.deletedAt).getTime()>cutoff);if(filtered.length!==raw.length)try{localStorage.setItem('onna_archive',JSON.stringify(filtered));}catch{}return filtered;}catch{return []}});
  const [newProject,setNewProject]           = useState({client:"",name:"",revenue:"",cost:"",status:"Active",year:2026});
  const localProjectsRef                      = useRef([]);
  const [localProjects,setLocalProjects]     = useState(()=>{try{const c=localStorage.getItem('onna_cache_projects');if(!c)return[];const arr=JSON.parse(c);const seenClient=new Set();const deduped=arr.filter(p=>{const k=(p.client||"").trim().toLowerCase();if(seenClient.has(k))return false;seenClient.add(k);return true;}).map(p=>/columbia|ima/i.test(p.client||"")?{...p,client:"TEMPLATE",name:"Template Project",revenue:0,cost:0}:p);try{localStorage.setItem('onna_cache_projects',JSON.stringify(deduped))}catch{}return deduped;}catch{return []}});
  const [localClients,setLocalClients]       = useState(()=>{try{const c=localStorage.getItem('onna_cache_clients');return c?JSON.parse(c):[]}catch{return []}});
  const [apiLoading,setApiLoading]           = useState(true);
  const [apiError,setApiError]               = useState(null);

  // ── Notes state ───────────────────────────────────────────────────────────────
  const [notes,setNotes]                     = useState(()=>{try{const c=localStorage.getItem('onna_cache_notes');return c?JSON.parse(c):[];}catch{return [];}});
  const [notesLoading,setNotesLoading]       = useState(false);
  useEffect(()=>{if(!globalHydratedRef.current)return;try{if(notes.length)localStorage.setItem('onna_cache_notes',JSON.stringify(notes));}catch{}},[notes]);

  const [projectTodos,setProjectTodos] = useState(()=>{try{const s=localStorage.getItem('onna_ptodos');return s?JSON.parse(s):{};}catch(e){return {}}});
  const [archivedProjects,setArchivedProjects] = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_archived_projects')||'[]')}catch{return []}});
  const [archivedTodos,setArchivedTodos]     = useState([]);
  const [todos,setTodos] = useState(()=>{try{const s=localStorage.getItem('onna_todos');const arr=s?JSON.parse(s):[];return arr.map(t=>t.tab?t:["later","longterm"].includes(t.subType)?{...t,tab:"personal"}:{...t,tab:"onna"})}catch(e){return []}});
  const [todoDragId,setTodoDragId] = useState(null);
  const [newTodo,setNewTodo]         = useState("");
  const [todoFilter,setTodoFilter]   = useState("todo");
  const [selectedTodo,setSelectedTodo] = useState(null);
  const [pendingProjectTask,setPendingProjectTask] = useState(null);
  const [pendingDragToProject,setPendingDragToProject] = useState(null);
  const [dashNotesList,setDashNotesList] = useState(()=>{try{const s=localStorage.getItem('onna_notes_list');return s?JSON.parse(s):[]}catch{return []}});
  const [dashSelectedNoteId,setDashSelectedNoteId] = useState(null);

  // ─── GLOBAL UNDO (Cmd+Z) ──────────────────────────────────────────────────
  const undoStack = useRef([]);
  const undoToastRef = useRef(null);
  const pushUndo = useCallback((label) => {
    doPushUndo(label, undoStack, { todos, projectTodos, outreach, vendors, localProjects, archivedTodos, riskAssessmentStore, cpsStore, shotListStore, storyboardStore, callSheetStore, contractDocStore, postProdStore, fittingStore, locDeckStore, recceReportStore, castingDeckStore, castingTableStore, travelItineraryStore, dietaryStore, projectEstimates, archive });
  }, [todos, projectTodos, outreach, vendors, localProjects, archivedTodos, riskAssessmentStore, cpsStore, shotListStore, storyboardStore, callSheetStore, contractDocStore, postProdStore, fittingStore, locDeckStore, recceReportStore, castingDeckStore, castingTableStore, travelItineraryStore, dietaryStore, projectEstimates, archive]);

  const performUndo = useCallback(() => {
    doPerformUndo(undoStack, undoToastRef, { setTodos, setProjectTodos, setOutreach, setVendors, setLocalProjects, setArchivedTodos, setRiskAssessmentStore, setCpsStore, setShotListStore, setStoryboardStore, setCallSheetStore, setContractDocStore, setPostProdStore, setFittingStore, setLocDeckStore, setRecceReportStore, setCastingDeckStore, setCastingTableStore, setTravelItineraryStore, setDietaryStore, setProjectEstimates, setArchive, setUndoToastMsg });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
        e.preventDefault();
        if(activeTab==="Agents") return; // AgentCard handles its own ⌘Z
        performUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [performUndo,activeTab]);
  const addTodoFromInput = (text) => _addTodoFromInput(text, todoTopFilter, todoFilter, pushUndo, setProjectTodos, setPendingProjectTask, setTodos);
  useEffect(()=>{try{localStorage.setItem('onna_todos',JSON.stringify(todos))}catch(e){} if(globalHydratedRef.current) debouncedGlobalSave('todos',todos);},[todos]);
  useEffect(()=>{try{localStorage.setItem('onna_ptodos',JSON.stringify(projectTodos))}catch(e){} if(globalHydratedRef.current) debouncedGlobalSave('ptodos',projectTodos);},[projectTodos]);
  useEffect(()=>{try{localStorage.setItem('onna_archived_projects',JSON.stringify(archivedProjects))}catch{} if(globalHydratedRef.current) debouncedGlobalSave('archive',archivedProjects);},[archivedProjects]);
  useEffect(()=>{try{localStorage.setItem('onna_notes_list',JSON.stringify(dashNotesList))}catch{} if(globalHydratedRef.current) debouncedGlobalSave('notes_list',dashNotesList);},[dashNotesList]);
  useEffect(()=>{idbGet("projectActuals").then(d=>{if(d)setProjectActuals(d);setActualsReady(true);}).catch(()=>setActualsReady(true));},[]);
  useEffect(()=>{if(actualsReady){idbSet("projectActuals",projectActuals).catch(()=>{}); debouncedDocSave('project_actuals',projectActuals);}},[projectActuals,actualsReady]);
  useEffect(()=>{idbGet("projectCasting").then(d=>{if(d)setProjectCasting(d);setCastingReady(true);}).catch(()=>setCastingReady(true));},[]);
  useEffect(()=>{if(castingReady){idbSet("projectCasting",projectCasting).catch(()=>{}); debouncedDocSave('project_casting',projectCasting);}},[projectCasting,castingReady]);
  // Auto-sync CPS share link when content changes (debounced 5s)
  useEffect(()=>{
    if(!selectedProject||activeCPSVersion==null)return;
    const pid=selectedProject.id;
    const cpsData=(cpsStore[pid]||[])[activeCPSVersion];
    if(!cpsData||!cpsData.shareToken||!cpsData.shareResourceId)return;
    if(cpsAutoSyncTimer.current)clearTimeout(cpsAutoSyncTimer.current);
    cpsAutoSyncTimer.current=setTimeout(async()=>{
      try{
        if(!cpsRef.current)return;
        setCpsAutoSyncing(true);
        await cpsRef.current.share([...cpsShareTabs],cpsData.shareToken,cpsData.shareResourceId);
        setCpsAutoSyncing(false);
      }catch{setCpsAutoSyncing(false);}
    },5000);
    return()=>{if(cpsAutoSyncTimer.current)clearTimeout(cpsAutoSyncTimer.current);};
  },[cpsStore,activeCPSVersion,selectedProject]); // eslint-disable-line
  // Poll fitting share feedback and sync back to portal
  useEffect(()=>{
    if(activeFittingVersion==null||!selectedProject)return;
    const pid=selectedProject.id;
    const fitVersions=fittingStore[pid]||[];
    const fitData=fitVersions[activeFittingVersion];
    if(!fitData||!fitData.shareToken)return;
    let cancelled=false;
    const poll=async()=>{
      try{
        const resp=await fetch(`/api/fit-share?token=${encodeURIComponent(fitData.shareToken)}&feedbackOnly=1`);
        if(!resp.ok||cancelled)return;
        const data=await resp.json();
        if(!data.feedback||cancelled)return;
        const fb=data.feedback;
        setFittingStore(prev=>{
          const s=JSON.parse(JSON.stringify(prev));
          const versions=s[pid]||[];
          const ver=versions[activeFittingVersion];
          if(!ver||!ver.fittings)return prev;
          let changed=false;
          // fb keys are "c0","c1",... mapping to flattened card indices across all fittings
          let cardIdx=0;
          ver.fittings.forEach(fit=>{
            for(let n=0;n<fit.images.length;n++){
              const key="c"+cardIdx;
              if(fb[key]){
                if(fb[key].status){
                  if(!fit.imageStatuses)fit.imageStatuses={};
                  if(fit.imageStatuses[n]!==fb[key].status){fit.imageStatuses[n]=fb[key].status;changed=true;}
                }
                if(fb[key].note!==undefined){
                  if(!fit.imageNotes)fit.imageNotes={};
                  if(fit.imageNotes[n]!==fb[key].note){fit.imageNotes[n]=fb[key].note;changed=true;}
                }
              }
              cardIdx++;
            }
          });
          // Also sync status badges (s0,s1,...) back to talent looks
          if(ver.talent){
            let statusIdx=0;
            ver.talent.forEach(t=>{
              (t.looks||[]).forEach(look=>{
                const skey="s"+statusIdx;
                if(fb[skey]&&fb[skey].status&&look.status!==fb[skey].status){look.status=fb[skey].status;changed=true;}
                statusIdx++;
              });
            });
          }
          return changed?s:prev;
        });
      }catch{}
    };
    poll();
    const timer=setInterval(poll,5000);
    return()=>{cancelled=true;clearInterval(timer);};
  },[activeFittingVersion,selectedProject]); // eslint-disable-line
  useEffect(()=>{localProjectsRef.current=localProjects;},[localProjects]);

  // ── Auto-fill matching document fields from project info ──────────────────
  const syncProjectInfoToDocs = (pid, infoOverride) => _syncProjectInfoToDocs(pid, infoOverride, projectInfoRef, localProjectsRef, setCallSheetStore, setRiskAssessmentStore, setContractDocStore, setProjectEstimates);

  // ── Auto-populate default logo for all document types on mount ────────────
  useEffect(() => {
    const LOGO_VER = "v6"; // bump to force re-apply default logo to all docs
    const alreadyApplied = localStorage.getItem('onna_logo_ver') === LOGO_VER;
    const logoImg = new Image(); logoImg.crossOrigin = "anonymous";
    logoImg.onload = () => {
      try {
        const cv = document.createElement("canvas"); cv.width = logoImg.naturalWidth; cv.height = logoImg.naturalHeight;
        cv.getContext("2d").drawImage(logoImg, 0, 0); const dataUrl = cv.toDataURL("image/png");
        const force = !alreadyApplied;
        // Call sheets
        setCallSheetStore(prev => {
          let changed = false; const s = JSON.parse(JSON.stringify(prev));
          Object.keys(s).forEach(k => { if (Array.isArray(s[k])) s[k].forEach(doc => { if (!doc.productionLogo || force) { doc.productionLogo = dataUrl; changed = true; } }); });
          return changed ? s : prev;
        });
        // Risk assessments
        setRiskAssessmentStore(prev => {
          let changed = false; const s = JSON.parse(JSON.stringify(prev));
          Object.keys(s).forEach(k => { if (Array.isArray(s[k])) s[k].forEach(doc => { if (!doc.productionLogo || force) { doc.productionLogo = dataUrl; changed = true; } }); });
          return changed ? s : prev;
        });
        // Contracts
        setContractDocStore(prev => {
          let changed = false; const s = JSON.parse(JSON.stringify(prev));
          Object.keys(s).forEach(k => { if (Array.isArray(s[k])) s[k].forEach(doc => { if (!doc.prodLogo || force) { doc.prodLogo = dataUrl; changed = true; } }); });
          return changed ? s : prev;
        });
        // Estimates
        setProjectEstimates(prev => {
          let changed = false; const s = JSON.parse(JSON.stringify(prev));
          Object.keys(s).forEach(k => { if (Array.isArray(s[k])) s[k].forEach(doc => { if (!doc.prodLogo || force) { doc.prodLogo = dataUrl; changed = true; } }); });
          return changed ? s : prev;
        });
        localStorage.setItem('onna_logo_ver', LOGO_VER);
      } catch {}
    };
    logoImg.src = "/onna-default-logo.png";
  }, []);

  // ── Google Calendar state ─────────────────────────────────────────────────
  const [gcalToken,setGcalToken]     = useState(()=>{try{const t=localStorage.getItem('onna_gcal_token'),e=localStorage.getItem('onna_gcal_exp');if(t&&e&&Date.now()<Number(e))return t;}catch{}return null;});
  const [gcalEvents,setGcalEvents]   = useState([]);
  const [gcalLoading,setGcalLoading] = useState(false);
  const [gcalEventColors,setGcalEventColors] = useState({});
  const [calMonth,setCalMonth]       = useState(new Date());
  const [calDayView,setCalDayView]   = useState(null); // Date object for the clicked day
  const [outlookEvents,setOutlookEvents] = useState(()=>{try{const c=sessionStorage.getItem('onna_outlook_evs');return c?JSON.parse(c):[]}catch{return []}});
  const [outlookLoading,setOutlookLoading] = useState(false);
  const [outlookError,setOutlookError]     = useState("");

  // ── Agents state ──────────────────────────────────────────────────────────────
  const [agentActiveIdx,setAgentActiveIdx] = useState(null);

  // Load Google Identity Services script once
  useEffect(()=>{
    if (!GCAL_CLIENT_ID) return;
    if (document.getElementById("gsi-script")) return;
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    document.head.appendChild(s);
  },[]);

  const fetchGCalEvents = (token, month) => _fetchGCalEvents(token, month, setGcalLoading, setGcalEventColors, setGcalEvents);
  const fetchOutlookCal = () => _fetchOutlookCal(setOutlookLoading, setOutlookError, setOutlookEvents);

  // Silent re-auth: if user previously connected but token is gone/expired, auto-reconnect
  useEffect(()=>{
    if (!localStorage.getItem('onna_gcal_connected') || gcalToken) return;
    const tryS = () => {
      if (!window.google?.accounts?.oauth2 || !GCAL_CLIENT_ID) return;
      window.google.accounts.oauth2.initTokenClient({
        client_id: GCAL_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        prompt: "",
        callback: resp => {
          if (resp.access_token) {
            setGcalToken(resp.access_token);
            try{localStorage.setItem('onna_gcal_token',resp.access_token);localStorage.setItem('onna_gcal_exp',String(Date.now()+55*60*1000));}catch{}
            fetchGCalEvents(resp.access_token, calMonth);
          }
        },
      }).requestAccessToken({prompt:"none"});
    };
    const t = setTimeout(tryS, 2000); // give GSI script time to load
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  // Proactive token refresh — check every 10 min, refresh if <8 min left on token
  useEffect(()=>{
    const id = setInterval(()=>{
      const exp = Number(localStorage.getItem('onna_gcal_exp')||0);
      if (!localStorage.getItem('onna_gcal_connected') || Date.now() < exp - 8*60*1000) return;
      if (!window.google?.accounts?.oauth2 || !GCAL_CLIENT_ID) return;
      window.google.accounts.oauth2.initTokenClient({
        client_id: GCAL_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        prompt: "",
        callback: resp => {
          if (resp.access_token) {
            setGcalToken(resp.access_token);
            try{localStorage.setItem('onna_gcal_token',resp.access_token);localStorage.setItem('onna_gcal_exp',String(Date.now()+55*60*1000));}catch{}
          }
        },
      }).requestAccessToken({prompt:"none"});
    }, 10*60*1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  // Re-fetch when month changes while connected, and on mount if token restored
  useEffect(()=>{ if (gcalToken) fetchGCalEvents(gcalToken, calMonth); },[calMonth,gcalToken]); // eslint-disable-line
  // Auto-fetch Outlook ICS on mount (public feed, no auth needed)
  useEffect(()=>{ if (authed) fetchOutlookCal(); },[authed]); // eslint-disable-line

  const connectGCal = () => _connectGCal(showAlert, calMonth, setGcalToken, fetchGCalEvents);

  // ── Load all data from backend ───────────────────────────────────────────
  useEffect(()=>{
    if (!authed) return;
    let cancelled = false;
    Promise.all([
      api.get("/api/projects"),
      api.get("/api/leads"),
      api.get("/api/clients"),
      api.get("/api/vendors"),
      api.get("/api/outreach"),
    ]).then(async ([projects, leads, clients, vendors, outreach])=>{
      if (cancelled) return;
      {const projArr=Array.isArray(projects)?projects:[];const seenClient=new Set();const deduped=projArr.filter(p=>{const k=(p.client||"").trim().toLowerCase();if(seenClient.has(k)){api.delete(`/api/projects/${p.id}`).catch(e=>console.warn("Failed to delete dupe:",p.id,e));return false;}seenClient.add(k);return true;});
        if(!deduped.find(p=>p.client==="TEMPLATE")){const t=await api.post("/api/projects",{client:"TEMPLATE",name:"Template Project",revenue:0,cost:0,status:"Active",year:2026}).catch(()=>null);if(t&&t.id)deduped.unshift(t);}
        if(deduped.length>0){setLocalProjects(deduped);try{localStorage.setItem('onna_cache_projects',JSON.stringify(deduped))}catch{}}}
      if (Array.isArray(leads)    && leads.length > 0)    { setLocalLeads(leads);    try{localStorage.setItem('onna_cache_leads',JSON.stringify(leads))}catch{} }
      if (Array.isArray(vendors)  && vendors.length > 0)  { setVendors(vendors);     try{localStorage.setItem('onna_cache_vendors',JSON.stringify(vendors))}catch{} }
      if (Array.isArray(outreach) && outreach.length > 0) setOutreach(outreach);

      // Retroactive sync: find any leads/outreach with status="client" that have no client record yet
      const existingClients = Array.isArray(clients) ? clients : [];
      const knownCompanies  = new Set(existingClients.map(c=>(c.company||"").trim().toLowerCase()));
      const allEntities     = [
        ...(Array.isArray(outreach)?outreach:[]).map(o=>({company:o.company,name:o.clientName||"",email:o.email||"",phone:o.phone||"",country:o.location||"",notes:o.notes||"",status:o.status})),
        ...(Array.isArray(leads)?leads:[]).map(l=>({company:l.company,name:l.contact||"",email:l.email||"",phone:l.phone||"",country:l.location||"",notes:l.notes||"",status:l.status})),
      ];
      const toCreate = allEntities.filter(e=>e.status==="client"&&e.company&&!knownCompanies.has(e.company.trim().toLowerCase()));
      // Dedupe by company within toCreate
      const seen = new Set();
      const unique = toCreate.filter(e=>{const k=e.company.trim().toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
      const newlyCreated = (await Promise.all(unique.map(e=>api.post("/api/clients",{company:e.company,name:e.name,email:e.email,phone:e.phone,country:e.country,notes:e.notes})))).filter(r=>r.id);
      const finalClients = [...existingClients,...newlyCreated];
      setLocalClients(finalClients);
      try{localStorage.setItem('onna_cache_clients',JSON.stringify(finalClients))}catch{}

      setApiLoading(false);

      // ── Migrate localStorage → Turso (one-time) ──────────────────────
      if (!localStorage.getItem('onna_migrated_v1')) {
        try {
          const payload = {};
          // Per-project doc stores
          const docKeys = {onna_callsheets:1,onna_riskassessments:1,onna_contracts_doc:1,onna_estimates:1,onna_dietaries:1,onna_travel_itineraries:1,onna_shotlists:1,onna_storyboards:1,onna_fittings:1,onna_loc_decks:1,onna_cps:1,onna_postprod:1,onna_casting_tables:1,onna_casting_decks:1,onna_recce_reports:1,onna_project_info:1,onna_creative_links:1};
          Object.keys(docKeys).forEach(k => { try { const v=localStorage.getItem(k); if(v) payload[k]=JSON.parse(v); } catch{} });
          // Global stores
          ['onna_todos','onna_ptodos','onna_notes_list','onna_archive','onna_sops'].forEach(k => { try { const v=localStorage.getItem(k); if(v) payload[k]=JSON.parse(v); } catch{} });
          // Config keys
          ['onna_lead_cats','onna_lead_locs','onna_vendor_cats','onna_vendor_locs','onna_hidden_lead_cats','onna_hidden_vendor_cats'].forEach(k => { try { const v=localStorage.getItem(k); if(v) payload[k]=JSON.parse(v); } catch{} });
          // IndexedDB stores
          try { const a=await idbGet("projectActuals"); if(a) payload.projectActuals=a; } catch{}
          try { const c=await idbGet("projectCasting"); if(c) payload.projectCasting=c; } catch{}
          payload._syncTs = Date.now();
          await api.post('/api/migrate', payload);
          localStorage.setItem('onna_migrated_v1', String(Date.now()));
        } catch(e) { console.warn('Migration failed, will retry next load:', e); }
      }

      // ── Hydrate global data from Turso ────────────────────────────────
      try {
        const gd = await api.get('/api/global-data');
        if (gd) {
          if (gd.todos) setTodos(gd.todos.map(t => t.tab ? t : ["later","longterm"].includes(t.subType) ? {...t, tab:"personal"} : {...t, tab:"onna"}));
          if (gd.ptodos) setProjectTodos(gd.ptodos);
          if (gd.notes_list) setDashNotesList(gd.notes_list);
          if (gd.archive) setArchive(gd.archive);
          if (gd.sops) setSops(gd.sops);
          if (gd.user_config) {
            if (gd.user_config.onna_lead_cats) setCustomLeadCats(gd.user_config.onna_lead_cats);
            if (gd.user_config.onna_lead_locs) setCustomLeadLocs(gd.user_config.onna_lead_locs);
            if (gd.user_config.onna_vendor_cats) setCustomVendorCats(gd.user_config.onna_vendor_cats);
            if (gd.user_config.onna_vendor_locs) setCustomVendorLocs(gd.user_config.onna_vendor_locs);
            if (gd.user_config.onna_hidden_lead_cats) setHiddenLeadBuiltins(gd.user_config.onna_hidden_lead_cats);
            if (gd.user_config.onna_hidden_vendor_cats) setHiddenVendorBuiltins(gd.user_config.onna_hidden_vendor_cats);
          }
        }
      } catch {}
      globalHydratedRef.current = true;

    }).catch(()=>setApiLoading(false));
    return ()=>{ cancelled=true; };
  },[authed]);

  // ── Hydrate project doc data from Turso when project opens ──────────────
  const globalHydratedRef = useRef(false);
  const hydratedProjectsRef = useRef(new Set());
  const hydrateProject = useCallback((pid) => {
    return doHydrateProject(pid, { setCallSheetStore, setRiskAssessmentStore, setContractDocStore, setProjectEstimates, setDietaryStore, setTravelItineraryStore, setShotListStore, setStoryboardStore, setFittingStore, setLocDeckStore, setCpsStore, setPostProdStore, setCastingTableStore, setCastingDeckStore, setRecceReportStore, setProjectInfo, setProjectCreativeLinks, setProjectActuals, setProjectCasting });
  }, []); // eslint-disable-line
  useEffect(() => {
    if (!selectedProject || !authed) return;
    const pid = String(selectedProject.id);
    if (hydratedProjectsRef.current.has(pid)) return;
    hydratedProjectsRef.current.add(pid);
    hydrateProject(pid);
  }, [selectedProject, authed, hydrateProject]);

  // ── Poll Turso for project updates every 30s while project is open ─────
  useEffect(() => {
    if (!selectedProject || !authed) return;
    const pid = String(selectedProject.id);
    const interval = setInterval(() => { hydrateProject(pid); }, 30000);
    return () => clearInterval(interval);
  }, [selectedProject, authed, hydrateProject]);

  // ── Flush pending saves on page close ──────────────────────────────────
  useEffect(() => {
    const onBeforeUnload = () => { flushAllSaves(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // projStatusColor, projStatusBg moved to Projects component

  const allProjectsMerged = localProjects.filter(p=>!archivedProjects.find(a=>a.id===p.id));

  // ── URL routing: restore state from URL on mount & handle popstate ──────
  const urlInitDone = useRef(false);
  useEffect(()=>{
    if (urlInitDone.current) return;
    urlInitDone.current = true;
    const parsed = parseURL(window.location.pathname, allProjectsMerged);
    if (parsed.tab) setActiveTab(parsed.tab);
    if (parsed.project) {
      setSelectedProject(parsed.project);
      if (parsed.section) setProjectSection(parsed.section);
      if (parsed.subSection) {
        const sec = parsed.section;
        if (sec==="Creative") setCreativeSubSection(parsed.subSection);
        else if (sec==="Budget") setBudgetSubSection(parsed.subSection);
        else if (sec==="Documents") setDocumentsSubSection(parsed.subSection);
        else if (sec==="Schedule") setScheduleSubSection(parsed.subSection);
        else if (sec==="Travel") setTravelSubSection(parsed.subSection);
      }
    }
    window.history.replaceState({tab:parsed.tab||activeTab,projectId:parsed.project?.id||null,section:parsed.section||null,subSection:parsed.subSection||null}, "", window.location.pathname);
  },[allProjectsMerged]); // run once projects are loaded

  useEffect(()=>{
    const onPopState = (e) => {
      const state = e.state;
      if (state) {
        setActiveTab(state.tab||"Dashboard");
        if (state.tab==="Projects" && state.projectId) {
          const proj = allProjectsMerged.find(p=>String(p.id)===String(state.projectId));
          setSelectedProject(proj||null);
          setProjectSection(state.section||"Home");
          setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);setTravelSubSection(null);setPermitsSubSection(null);setStylingSubSection(null);setCastingSubSection(null);setActiveCastingDeckVersion(null);setActiveCastingTableVersion(null);setActiveCSVersion(null);setLocSubSection(null);setActiveRecceVersion(null);
          if (state.subSection && proj) {
            const sec = state.section;
            if (sec==="Creative") setCreativeSubSection(state.subSection);
            else if (sec==="Budget") setBudgetSubSection(state.subSection);
            else if (sec==="Documents") setDocumentsSubSection(state.subSection);
            else if (sec==="Schedule") setScheduleSubSection(state.subSection);
            else if (sec==="Travel") setTravelSubSection(state.subSection);
          }
        } else {
          setSelectedProject(null);
          setProjectSection("Home");
          setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);setTravelSubSection(null);setPermitsSubSection(null);setStylingSubSection(null);setCastingSubSection(null);setActiveCastingDeckVersion(null);setActiveCastingTableVersion(null);setActiveCSVersion(null);setLocSubSection(null);setActiveRecceVersion(null);
        }
      } else {
        const parsed = parseURL(window.location.pathname, allProjectsMerged);
        setActiveTab(parsed.tab||"Dashboard");
        if (parsed.project) {
          setSelectedProject(parsed.project);
          setProjectSection(parsed.section||"Home");
          setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);setTravelSubSection(null);setPermitsSubSection(null);setStylingSubSection(null);setCastingSubSection(null);setActiveCastingDeckVersion(null);setActiveCastingTableVersion(null);setActiveCSVersion(null);setLocSubSection(null);setActiveRecceVersion(null);
          if (parsed.subSection) {
            const sec = parsed.section;
            if (sec==="Creative") setCreativeSubSection(parsed.subSection);
            else if (sec==="Budget") setBudgetSubSection(parsed.subSection);
            else if (sec==="Documents") setDocumentsSubSection(parsed.subSection);
            else if (sec==="Schedule") setScheduleSubSection(parsed.subSection);
            else if (sec==="Travel") setTravelSubSection(parsed.subSection);
          }
        } else {
          setSelectedProject(null);
          setProjectSection("Home");
        }
      }
    };
    window.addEventListener("popstate", onPopState);
    return ()=>window.removeEventListener("popstate", onPopState);
  },[allProjectsMerged]);

  const revenueCache = useMemo(()=>{
    const cache={};
    allProjectsMerged.forEach(p=>{
      const ests=projectEstimates?.[p.id];
      if(ests&&ests.length>0){const latest=ests[ests.length-1];const secs=latest.sections||defaultSections();cache[p.id]=estCalcTotals(secs).grandTotal;}
      else cache[p.id]=null;
    });
    return cache;
  },[allProjectsMerged,projectEstimates]);
  const costCache = useMemo(()=>{
    const cache={};
    allProjectsMerged.forEach(p=>{
      const act=projectActuals[p.id];
      cache[p.id]=act?actualsGrandZohoTotal(act):null;
    });
    return cache;
  },[allProjectsMerged,projectActuals]);
  const getEstimateRevenue = (pid) => revenueCache[pid]??null;
  const getProjRevenue = (p) => { const er = revenueCache[p.id]; return er !== null && er !== undefined ? er : p.revenue; };
  const getProjCost = (p) => { const c = costCache[p.id]; return c !== null && c !== undefined ? c : p.cost; };
  // projects2026, rev2026, profit2026, totalPipeline, newCount moved to Finance component
  const activeProjects= allProjectsMerged.filter(p=>p.status==="Active"&&p.client!=="TEMPLATE");
  // projects, projRev, projProfit, projMargin moved to Projects component

  const filteredBB = vendors.filter(b=>{const s=getSearch("Vendors")?.toLowerCase();return (bbCat==="All"||b.category===bbCat)&&(bbLocation==="All"||b.location===bbLocation)&&(!s||[b.name,b.company,b.category,b.location,b.email,b.phone,b.website,b.notes,b.rateCard].some(v=>v&&v.toLowerCase().includes(s)));});

  // Dashboard todos — general and project kept strictly separate (projects = active only)
  const activeProjectIds = new Set(activeProjects.map(p=>p.id));
  const allProjectTodosFlat = Object.entries(projectTodos).flatMap(([pid,tlist])=>
    activeProjectIds.has(Number(pid)) ? (tlist||[]).map(t=>({...t,_source:"project",projectId:Number(pid)})) : []
  );
  const generalTodos = todos.filter(t=>!archivedTodos.find(a=>a.id===t.id)).map(t=>({...t,_source:"general"}));
  const projectTodosFlat = allProjectTodosFlat.filter(t=>!archivedTodos.find(a=>a.id===t.id));
  const allTodos = [...generalTodos,...projectTodosFlat];
  const filteredTodos = allTodos.filter(t=>{
    if (todoFilter==="todo") return t._source==="general" && t.tab==="onna";
    if (todoFilter==="todo-now") return t._source==="general" && t.tab==="onna" && !t.subType;
    if (todoFilter==="todo-later") return t._source==="general" && t.tab==="onna" && t.subType==="later";
    if (todoFilter==="general") return t._source==="general" && t.tab==="personal";
    if (todoFilter==="general-now") return t._source==="general" && t.tab==="personal" && !t.subType;
    if (todoFilter==="general-later") return t._source==="general" && t.tab==="personal" && t.subType==="later";
    if (todoFilter==="project") return t._source==="project";
    if (todoFilter.startsWith("project-")) return t._source==="project" && t.projectId===Number(todoFilter.replace("project-","")); return true;
  });
  const todoTopFilter = ["todo","todo-now","todo-later"].includes(todoFilter)?"todo":todoFilter.startsWith("general")?"general":todoFilter.startsWith("project")||todoFilter==="project"?"project":"todo";

  const getProjectCastingTables = id => _getProjectCastingTablesFn(id, projectCasting);
  const getProjectCasting = id => _getProjectCastingFn(id, projectCasting);
  const addCastingTable = id => _addCastingTable(id, projectCasting, setProjectCasting);
  const addCastingRow = (id,tableId) => _addCastingRow(id, tableId, projectCasting, setProjectCasting);
  const updateCastingRow = (id,tableId,rowId,field,val) => _updateCastingRow(id, tableId, rowId, field, val, projectCasting, setProjectCasting);
  const removeCastingRow = (id,tableId,rowId) => _removeCastingRow(id, tableId, rowId, projectCasting, setProjectCasting);
  const updateCastingTableTitle = (id,tableId,title) => _updateCastingTableTitle(id, tableId, title, projectCasting, setProjectCasting);
  const removeCastingTable = (id,tableId) => _removeCastingTable(id, tableId, projectCasting, setProjectCasting);

  const processOutreach = () => _processOutreach(outreachMsg, setOutreachLoading, setOutreach, setOutreachMsg);


  const promoteToClient = (entity) => _promoteToClient(entity, localClients, setLocalClients);



  const processProjectAI = (p) => _processProjectAI(p, aiMsg, attachedFile, setAiLoading, setProjectEntries, setAiMsg, setAttachedFile);

  // ── Agent markdown renderer (extracted to handlers/agentHandlers.js) ──────

  const sendAgentMessage = (agentId, userText) => _sendAgentMessage(agentId, userText, agentStreaming, agentChats, setAgentChats, setAgentInput, setAgentStreaming, agentChatEndRef);

  const generateContract = (p) => _generateContract(p, contractType, contractFields, setContractLoading, setGeneratedContract);

  const riskSystemPrompt = `You are a production coordinator for ONNA (Dubai & London). Generate a Risk Assessment using markdown tables.\n\nFormat:\nRISK ASSESSMENT\nSHOOT NAME: [name]\nSHOOT DATE: [date]\nLOCATION: [location]\nCREW ON SET: [number]\nTIMING: [times]\n\n1. ENVIRONMENTAL & TERRAIN RISKS\n| Hazard | Risk Level | Who is at Risk | Mitigation Strategy |\n|--------|------------|----------------|---------------------|\n\n2. [SHOOT-SPECIFIC SECTION]\n| Hazard | Risk Level | Who is at Risk | Mitigation Strategy |\n|--------|------------|----------------|---------------------|\n\n3. TECHNICAL EQUIPMENT RISKS\n| Hazard | Risk Level | Who is at Risk | Mitigation Strategy |\n|--------|------------|----------------|---------------------|\n\n4. BRAND & PRIVACY\n| Hazard | Risk Level | Who is at Risk | Control Measures |\n|--------|------------|----------------|------------------|\n\n5. PROFESSIONAL CODE OF CONDUCT\n• Client Relations, Anti-Harassment (Zero Tolerance), General Conduct\n\n6. LIABILITY WAIVER\n• Transport, Health, Safety Gear\n\nEMERGENCY RESPONSE PLAN\n| Contact | Details |\n|---------|---------|\n| Emergency | 999 / 998 / 997 |\n| Production Lead (Emily) | +971 585 608 616 |\n\n@ONNAPRODUCTION | DUBAI & LONDON`;

  const callSheetSystemPrompt = `You are a production coordinator for ONNA. Generate a Call Sheet using markdown tables.\n\nCALL SHEET\nALL CREW MUST BRING VALID EMIRATES ID TO SET\n\nSHOOT NAME: [name]\nSHOOT DATE: [date]\nSHOOT ADDRESS: [address]\n\nPRODUCTION ON SET: EMILY LUCAS +971 585 608 616\n\nSCHEDULE\n| Time | Activity |\n|------|-----------|\n\nCREW\n| Role | Name | Mobile | Email | Call Time |\n|------|------|--------|-------|-----------|\n| PRODUCER | EMILY LUCAS | +971 585 608 616 | EMILY@ONNAPRODUCTION.COM | [time] |\n\nINVOICING\n| | |\n|-|-|\n| Payment Terms | NET 30 days |\n| Send To | accounts@onnaproduction.com |\n| Billing | ONNA FILM, TV & RADIO PRODUCTION SERVICES LLC., OFFICE F1-022, DUBAI |\n\nEMERGENCY SERVICES\n| Service | Contact |\n|---------|---------|\n| Police/Ambulance/Fire | 999 / 998 / 997 |\n\n@ONNAPRODUCTION | DUBAI & LONDON`;

  const changeTab = tab => _changeTab(tab, { setActiveTab, setSelectedProject, setProjectSection, setCreativeSubSection, setBudgetSubSection, setDocumentsSubSection, setScheduleSubSection, setTravelSubSection, setPermitsSubSection, setStylingSubSection, setCastingSubSection, setActiveCastingDeckVersion, setActiveCastingTableVersion, setActiveCSVersion, setLocSubSection, setActiveRecceVersion, setVaultLocked, setVaultKey, setVaultPass, setVaultResources, setVaultErr, setVaultPwSearch });

  const navigateToDoc = (projectObj, section, subSection, opts) => _navigateToDoc(projectObj, section, subSection, opts, { setActiveTab, setSelectedProject, setProjectSection, setDocumentsSubSection, setActiveCSVersion, setActiveDietaryVersion, setActiveRAVersion, setActiveContractVersion, setBudgetSubSection, setAgentActiveIdx });

  const addNewOption = (currentList, setter, storageKey, prompt_label) => _addNewOption(currentList, setter, storageKey, prompt_label, showPrompt);

  const catSetters = { localLeads, vendors, setLocalLeads, setVendors, customLeadCats, customVendorCats, setCustomLeadCats, setCustomVendorCats, setHiddenLeadBuiltins, setHiddenVendorBuiltins };
  const deleteCat = (type, cat) => _deleteCat(type, cat, setCatSaving, catSetters);
  const renameCat = (type, oldCat, newCat) => _renameCat(type, oldCat, newCat, setCatSaving, setCatEdit, catSetters);



  const archiveItem = (table, item) => _archiveItem(table, item, setArchive);
  const restoreItem = (entry) => _restoreItem(entry, { setProjectEstimates, setTodos, setDashNotesList, setNotes, setLocalProjects, setCallSheetStore, setRiskAssessmentStore, setContractDocStore, setTravelItineraryStore, setDietaryStore, setLocDeckStore, setLocalClients, setLocalLeads, setVendors, setOutreach, setArchive });
  const permanentlyDelete = (archiveId) => _permanentlyDelete(archiveId, setArchive);

  const allLeadLocs  = ["All","London, UK","Dubai, UAE","New York, USA","Los Angeles, USA",...customLeadLocs,"＋ Add location"];
  const allLeadCats  = [...LEAD_CATEGORIES.filter(c=>!hiddenLeadBuiltins.includes(c)),...customLeadCats,"＋ Add category"];
  const allVendorCats = ["All",...VENDORS_CATEGORIES.filter(c=>!hiddenVendorBuiltins.includes(c)),...customVendorCats,"＋ Add category"];
  const allVendorLocs = [...BB_LOCATIONS,...customVendorLocs,"＋ Add location"];

  // ─── PROJECT SECTION RENDERER ──────────────────────────────────────────────
  const renderProjectSection = p => {
    const entries    = projectEntries[p.id]||[];
    const quotes     = (projectFileStore[p.id]||{}).quotations||[];
    const allEntries = [...entries,...quotes.map((f,i)=>({id:`q_${i}`,supplier:f.name,category:"Quote",subCategory:"",invoiceNumber:"",receiptLink:"",datePaid:"",amount:"",direction:"out",notes:"Uploaded quote"}))];
    const totalIn    = entries.filter(e=>e.direction==="in").reduce((a,b)=>a+Number(b.amount),0);
    const totalOut   = entries.filter(e=>e.direction==="out").reduce((a,b)=>a+Number(b.amount),0);
    const profit     = totalIn-totalOut;
    const margin     = totalIn>0?Math.round((profit/totalIn)*100):0;

    const SECTION_META = {
      "Creative":       {emoji:"🎨",count:`${((projectFileStore[p.id]||{}).moodboards||[]).length+((projectFileStore[p.id]||{}).briefs||[]).length} files`},
      "Budget":         {emoji:"📊",count:`${(projectEstimates[p.id]||[]).length} estimate(s), ${quotes.length} quote(s)`},
      "Documents":      {emoji:"📁",count:"Call sheets, contracts & more"},
      "Locations":      {emoji:"📍",count:"Add folder link"},
      "Casting":        {emoji:"🎭",count:`${getProjectCastingTables(p.id).reduce((a,t)=>a+t.rows.length,0)} models`},
      "Styling":        {emoji:"👗",count:`${getProjectFiles(p.id,"styling").length} files`},
      "Travel":         {emoji:"✈️",count:"Flights, hotels & logistics"},
      "Schedule":       {emoji:"📒",count:"CPS, Shotlist, Storyboard & Post-Production"},
    };

    // mini stat card used in project sections
    const MiniStat = ({label,value}) => (
      <div style={{borderRadius:14,padding:"18px 20px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
        <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6,fontWeight:500}}>{label}</div>
        <div style={{fontSize:22,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>{value}</div>
      </div>
    );

    const uploadFromLink = (url, category) => _uploadFromLink(url, category, p.id, setLinkUploading, setLinkUploadProgress, setProjectFileStore, showAlert);

    if (projectSection==="Home") return (
      <div>
        {/* Editable project header */}
        <div style={{marginBottom:20,display:"flex",alignItems:"flex-start",gap:14}}>
          <div style={{flex:1}}>
            <input value={p.client||""} onChange={e=>{const v=e.target.value;setLocalProjects(prev=>prev.map(pr=>pr.id===p.id?{...pr,client:v}:pr));setSelectedProject(prev=>prev&&prev.id===p.id?{...prev,client:v}:prev);api.put(`/api/projects/${p.id}`,{client:v}).catch(()=>{});setDashNotesList(prev=>prev.map(n=>n.projectId===p.id?{...n,title:`${v} | ${p.name}`,updatedAt:Date.now()}:n));}} placeholder="Client name" style={{width:"100%",fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500,background:"transparent",border:"none",borderBottom:"1px solid transparent",padding:"2px 0",fontFamily:"inherit",outline:"none",cursor:"text"}} onFocus={e=>{e.target.style.borderBottomColor=T.accent}} onBlur={e=>{e.target.style.borderBottomColor="transparent"}}/>
            <input value={p.name||""} onChange={e=>{const v=e.target.value;setLocalProjects(prev=>prev.map(pr=>pr.id===p.id?{...pr,name:v}:pr));setSelectedProject(prev=>prev&&prev.id===p.id?{...prev,name:v}:prev);api.put(`/api/projects/${p.id}`,{name:v}).catch(()=>{});setDashNotesList(prev=>prev.map(n=>n.projectId===p.id?{...n,title:`${p.client} | ${v}`,updatedAt:Date.now()}:n));}} placeholder="Project name" style={{width:"100%",fontSize:22,fontWeight:700,color:T.text,letterSpacing:"-0.02em",background:"transparent",border:"none",borderBottom:"1px solid transparent",padding:"2px 0",fontFamily:"inherit",outline:"none",cursor:"text"}} onFocus={e=>{e.target.style.borderBottomColor=T.accent}} onBlur={e=>{e.target.style.borderBottomColor="transparent"}}/>
          </div>
          <select value={p.status||"Active"} onChange={e=>{const v=e.target.value;setLocalProjects(prev=>prev.map(pr=>pr.id===p.id?{...pr,status:v}:pr));api.put(`/api/projects/${p.id}`,{status:v}).catch(()=>{});}} style={{padding:"5px 24px 5px 10px",borderRadius:8,fontSize:11,fontWeight:500,border:`1px solid ${T.border}`,fontFamily:"inherit",cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' fill='none'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23aeaeb2' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center",background:p.status==="Active"?"#e8f5e9":p.status==="Completed"?"#e3f2fd":"#fff8e1",color:p.status==="Active"?"#2e7d32":p.status==="Completed"?"#1565c0":"#f57f17",flexShrink:0,marginTop:6}}>
            <option value="Active">Active</option>
            <option value="In Review">In Review</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        {/* Project Info */}
        <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:isMobile?16:28,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
          <div style={{padding:"10px 18px",borderBottom:`1px solid ${T.borderSub}`,background:"#fafafa"}}>
            <span style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Project Info</span>
          </div>
          {[["Shoot Name","shootName","e.g. Brand Campaign 2026"],["Shoot Date","shootDate","e.g. 15–17 March 2026"],["Shoot Location","shootLocation","e.g. Dubai Marina, Studio A"],["Usage","usage","e.g. Global digital & print, 12 months"],["Crew on Set","crewOnSet","e.g. 24 crew members"]].map(([label,key,ph])=>(
            <div key={key} style={{display:"flex",alignItems:"center",borderBottom:`1px solid ${T.borderSub}`,padding:"0 18px",minHeight:38}}>
              <span style={{fontSize:11,color:T.muted,fontWeight:500,width:120,flexShrink:0}}>{label}</span>
              <input value={(projectInfo[p.id]||{})[key]||""} onChange={e=>{const v=e.target.value;setProjectInfo(prev=>{const next={...prev,[p.id]:{...(prev[p.id]||{}),[key]:v}};projectInfoRef.current=next;return next;});}} onBlur={()=>{const info=(projectInfoRef.current||{})[p.id];if(info)syncProjectInfoToDocs(p.id,info);}} placeholder={ph} style={{flex:1,fontSize:13,color:T.text,background:"transparent",border:"none",padding:"8px 0",fontFamily:"inherit",outline:"none"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:14,marginBottom:isMobile?16:28}}>
          {[["Total Revenue",`AED ${totalIn.toLocaleString()}`,"income"],["Total Expenses",`AED ${totalOut.toLocaleString()}`,"outgoings"],["Net Profit",`AED ${profit.toLocaleString()}`,"revenue − expenses"],["Margin",`${margin}%`,"net / revenue"]].map(([l,v,s])=>(
            <div key={l} style={{borderRadius:16,padding:"20px 22px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8,fontWeight:500}}>{l}</div>
              <div style={{fontSize:24,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:3}}>{v}</div>
              <div style={{fontSize:11,color:T.muted}}>{s}</div>
            </div>
          ))}
        </div>
        {/* Project To-Do List */}
        <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:24,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",gap:8,background:"#fafafa"}}>
            <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,flex:1}}>Project To-Do</span>
            <span style={{fontSize:11,color:T.muted}}>{(projectTodos[p.id]||[]).filter(t=>!archivedTodos.find(a=>a.id===t.id)&&!t.done).length} open</span>
          </div>
          <ProjectTodoList projectId={p.id} projectTodos={projectTodos} setProjectTodos={setProjectTodos} archivedTodos={archivedTodos} setArchivedTodos={setArchivedTodos}/>
        </div>
        {/* Project Notes */}
        {(()=>{
          const projNotes=dashNotesList.filter(n=>n.projectId===p.id).sort((a,b)=>b.updatedAt-a.updatedAt);
          return (
            <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:24,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",maxHeight:400}}>
              <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",gap:8,background:"#fafafa",flexShrink:0}}>
                <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,flex:1}}>Notes</span>
                <button onClick={()=>{const n={id:Date.now(),title:`${p.client||"Client"} | ${p.name||"Project"}`,content:"",updatedAt:Date.now(),projectId:p.id};setDashNotesList(prev=>[n,...prev]);}} style={{padding:"3px 10px",borderRadius:7,background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New</button>
              </div>
              <div style={{flex:1,overflowY:"auto"}}>
              {projNotes.length===0&&<div style={{padding:"20px 18px",textAlign:"center",fontSize:12,color:T.muted}}>No notes yet. Click + New to add one.</div>}
              {projNotes.map(note=>(
                <div key={note.id} style={{borderBottom:`1px solid ${T.borderSub}`}}>
                  <div style={{display:"flex",alignItems:"center",padding:"10px 18px",gap:8,cursor:"pointer"}} onClick={()=>setDashSelectedNoteId(prev=>prev===note.id?null:note.id)}>
                    <span style={{fontSize:11,color:T.muted,flexShrink:0}}>{dashSelectedNoteId===note.id?"▾":"▸"}</span>
                    <span style={{fontSize:13,fontWeight:500,color:T.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{note.title||"Untitled"}</span>
                    <span style={{fontSize:10,color:T.muted,flexShrink:0}}>{note.updatedAt?new Date(note.updatedAt).toLocaleDateString([],{month:"short",day:"numeric"}):""}</span>
                    <button onClick={e=>{e.stopPropagation();if(window.confirm("Delete this note?"))setDashNotesList(prev=>prev.filter(n=>n.id!==note.id));}} style={{width:20,height:20,borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0}} title="Delete note">×</button>
                  </div>
                  {dashSelectedNoteId===note.id&&(
                    <div style={{padding:"0 18px 14px"}}>
                      <div contentEditable suppressContentEditableWarning ref={el=>{if(el&&!el._initialized){el.innerHTML=note.content||"";el._initialized=true;}}} onInput={e=>{const html=e.currentTarget.innerHTML;setDashNotesList(prev=>prev.map(n=>n.id===note.id?{...n,content:html,updatedAt:Date.now()}:n));}} style={{minHeight:60,fontSize:13,color:T.text,lineHeight:1.6,outline:"none",padding:"4px 0",fontFamily:"inherit"}} placeholder="Write something..."/>
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          );
        })()}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:10}}>
          {PROJECT_SECTIONS.filter(s=>s!=="Home").map(sec=>{
            const meta=SECTION_META[sec]||{emoji:"📁",count:"Click to open"};
            return (
              <a key={sec} href={buildPath("Projects",p.id,sec,null)} onClick={(e)=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();setProjectSection(sec);setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);setTravelSubSection(null);setPermitsSubSection(null);setStylingSubSection(null);setCastingSubSection(null);setActiveCastingDeckVersion(null);setActiveCastingTableVersion(null);setActiveCSVersion(null);setLocSubSection(null);setActiveRecceVersion(null);pushNav("Projects",p,sec,null);}} className="proj-card" style={{borderRadius:16,padding:"16px 18px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",textDecoration:"none",color:"inherit"}}>
                <span style={{fontSize:20,flexShrink:0}}>{meta.emoji}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:500,color:T.text,marginBottom:2}}>{sec}</div>
                  <div style={{fontSize:11,color:T.muted}}>{meta.count}</div>
                </div>
                <span style={{marginLeft:"auto",color:T.muted,fontSize:14,flexShrink:0}}>›</span>
              </a>
            ); })}
        </div>
        {/* Delete project */}
        <div style={{marginTop:40,paddingTop:20,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={async()=>{if(!confirm(`Delete "${p.name}"? This will be moved to Deleted.`))return;archiveItem('projects',p);await api.delete(`/api/projects/${p.id}`);setLocalProjects(prev=>prev.filter(x=>x.id!==p.id));setSelectedProject(null);setProjectSection("Home");}} style={{padding:"10px 22px",borderRadius:10,background:"#fff",border:"1px solid #e0e0e0",color:"#c0392b",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#c0392b";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#c0392b";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.color="#c0392b";e.currentTarget.style.borderColor="#e0e0e0";}}>Delete Project</button>
        </div>
      </div>
    );

    // Creative section
    if (projectSection==="Creative") {
      return <Creative T={T} isMobile={isMobile} p={p}
        creativeSubSection={creativeSubSection} setCreativeSubSection={setCreativeSubSection}
        projectFileStore={projectFileStore} setProjectFileStore={setProjectFileStore}
        projectCreativeLinks={projectCreativeLinks} setProjectCreativeLinks={setProjectCreativeLinks}
        creativeSearchTerm={creativeSearchTerm} setCreativeSearchTerm={setCreativeSearchTerm}
        linkUploading={linkUploading} linkUploadProgress={linkUploadProgress} uploadFromLink={uploadFromLink}
        pushNav={pushNav} showAlert={showAlert} buildPath={buildPath}
        UploadZone={UploadZone}
      />;
    }

    // Budget section
    if (projectSection==="Budget") {
      return <Budget T={T} isMobile={isMobile} p={p}
        budgetSubSection={budgetSubSection} setBudgetSubSection={setBudgetSubSection}
        projectEstimates={projectEstimates} setProjectEstimates={setProjectEstimates} editingEstimate={editingEstimate} setEditingEstimate={setEditingEstimate}
        projectActuals={projectActuals} setProjectActuals={setProjectActuals} actualsTrackerTab={actualsTrackerTab} setActualsTrackerTab={setActualsTrackerTab}
        trackerTab={trackerTab} setTrackerTab={setTrackerTab}
        quotes={quotes} invoiceTab={invoiceTab} setInvoiceTab={setInvoiceTab}
        invoiceSearchTerm={invoiceSearchTerm} setInvoiceSearchTerm={setInvoiceSearchTerm} quoteSearchTerm={quoteSearchTerm} setQuoteSearchTerm={setQuoteSearchTerm}
        previewFile={previewFile} setPreviewFile={setPreviewFile}
        projectFileStore={projectFileStore} setProjectFileStore={setProjectFileStore} projectCreativeLinks={projectCreativeLinks} setProjectCreativeLinks={setProjectCreativeLinks}
        linkUploading={linkUploading} linkUploadProgress={linkUploadProgress} uploadFromLink={uploadFromLink}
        createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
        pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert} showPrompt={showPrompt} buildPath={buildPath}
        EstCell={EstCell} EstimateView={EstimateView} BtnPrimary={BtnPrimary} PRINT_CLEANUP_CSS={PRINT_CLEANUP_CSS}
      />;
    }

    // Documents section
    if (projectSection==="Documents") {
      return <Documents T={T} isMobile={isMobile} p={p}
        documentsSubSection={documentsSubSection} setDocumentsSubSection={setDocumentsSubSection}
        callSheetStore={callSheetStore} setCallSheetStore={setCallSheetStore} activeCSVersion={activeCSVersion} setActiveCSVersion={setActiveCSVersion}
        riskAssessmentStore={riskAssessmentStore} setRiskAssessmentStore={setRiskAssessmentStore} activeRAVersion={activeRAVersion} setActiveRAVersion={setActiveRAVersion}
        contractDocStore={contractDocStore} setContractDocStore={setContractDocStore} activeContractVersion={activeContractVersion} setActiveContractVersion={setActiveContractVersion}
        dietaryStore={dietaryStore} setDietaryStore={setDietaryStore} activeDietaryVersion={activeDietaryVersion} setActiveDietaryVersion={setActiveDietaryVersion}
        dietaryTab={dietaryTab} setDietaryTab={setDietaryTab}
        sigShareUrl={sigShareUrl} setSigShareUrl={setSigShareUrl} sigShareLoading={sigShareLoading} setSigShareLoading={setSigShareLoading}
        ctSignShareUrl={ctSignShareUrl} setCtSignShareUrl={setCtSignShareUrl} ctSignShareLoading={ctSignShareLoading} setCtSignShareLoading={setCtSignShareLoading}
        ctTypeModalOpen={ctTypeModalOpen} setCtTypeModalOpen={setCtTypeModalOpen}
        permitsSubSection={permitsSubSection} setPermitsSubSection={setPermitsSubSection}
        csCreateMenuDocs={csCreateMenuDocs} setCsCreateMenuDocs={setCsCreateMenuDocs} setCsDuplicateModal={setCsDuplicateModal} setCsDuplicateSearch={setCsDuplicateSearch}
        setRaDuplicateModal={setRaDuplicateModal} setRaDuplicateSearch={setRaDuplicateSearch}
        createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
        pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert}
        getProjectFiles={getProjectFiles} addProjectFiles={addProjectFiles} buildPath={buildPath}
        projectInfoRef={projectInfoRef} CALLSHEET_INIT={CALLSHEET_INIT} DIETARY_INIT={DIETARY_INIT}
        CSLogoSlot={CSLogoSlot} CSAddBtn={CSAddBtn} CSEditField={CSEditField} CSEditTextarea={CSEditTextarea} CSResizableImage={CSResizableImage} CSXbtn={CSXbtn}
        BtnExport={BtnExport} UploadZone={UploadZone} DietaryTagSelect={DietaryTagSelect} SignaturePad={SignaturePad} TICell={TICell}
        CS_FONT={CS_FONT} CS_LS={CS_LS} PRINT_CLEANUP_CSS={PRINT_CLEANUP_CSS}
      />;
    }

    // Locations section
    if (projectSection==="Locations") {
      return <Locations T={T} isMobile={isMobile} p={p}
        locSubSection={locSubSection} setLocSubSection={setLocSubSection}
        locDeckStore={locDeckStore} setLocDeckStore={setLocDeckStore} activeLocDeckVersion={activeLocDeckVersion} setActiveLocDeckVersion={setActiveLocDeckVersion}
        locShareUrl={locShareUrl} setLocShareUrl={setLocShareUrl} locShareLoading={locShareLoading} setLocShareLoading={setLocShareLoading}
        locShareTabs={locShareTabs} setLocShareTabs={setLocShareTabs} locDeckRef={locDeckRef}
        recceReportStore={recceReportStore} setRecceReportStore={setRecceReportStore} activeRecceVersion={activeRecceVersion} setActiveRecceVersion={setActiveRecceVersion}
        recceShareUrl={recceShareUrl} setRecceShareUrl={setRecceShareUrl} recceShareLoading={recceShareLoading} setRecceShareLoading={setRecceShareLoading}
        projectLocLinks={projectLocLinks} setProjectLocLinks={setProjectLocLinks}
        createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
        pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert}
        LocationsConnie={LocationsConnie} mkLoc={mkLoc} mkDetail={mkDetail}
        RECCE_REPORT_INIT={RECCE_REPORT_INIT} mkRecceLocation={mkRecceLocation} RECCE_RATINGS={RECCE_RATINGS} RECCE_RATING_C={RECCE_RATING_C}
        RecceInp={RecceInp} RecceField={RecceField} RecceImgSlot={RecceImgSlot} BtnExport={BtnExport} CSLogoSlot={CSLogoSlot}
        CS_FONT={CS_FONT} PRINT_CLEANUP_CSS={PRINT_CLEANUP_CSS}
      />;
    }

    // Casting section
    if (projectSection==="Casting") {
      return <Casting T={T} isMobile={isMobile} p={p}
        castingSubSection={castingSubSection} setCastingSubSection={setCastingSubSection}
        castingDeckStore={castingDeckStore} setCastingDeckStore={setCastingDeckStore} activeCastingDeckVersion={activeCastingDeckVersion} setActiveCastingDeckVersion={setActiveCastingDeckVersion}
        castDeckShareUrl={castDeckShareUrl} setCastDeckShareUrl={setCastDeckShareUrl} castDeckShareLoading={castDeckShareLoading} setCastDeckShareLoading={setCastDeckShareLoading}
        castDeckShareTabs={castDeckShareTabs} setCastDeckShareTabs={setCastDeckShareTabs} castDeckRef={castDeckRef}
        castingTableStore={castingTableStore} setCastingTableStore={setCastingTableStore} activeCastingTableVersion={activeCastingTableVersion} setActiveCastingTableVersion={setActiveCastingTableVersion}
        ctShareUrl={ctShareUrl} setCtShareUrl={setCtShareUrl} ctShareLoading={ctShareLoading} setCtShareLoading={setCtShareLoading} ctRef={ctRef}
        projectFileStore={projectFileStore} setProjectFileStore={setProjectFileStore} projectCreativeLinks={projectCreativeLinks} setProjectCreativeLinks={setProjectCreativeLinks}
        castFileSearchTerm={castFileSearchTerm} setCastFileSearchTerm={setCastFileSearchTerm}
        linkUploading={linkUploading} linkUploadProgress={linkUploadProgress} uploadFromLink={uploadFromLink}
        createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
        pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert}
        CastingConnie={CastingConnie} CastingTableConnie={CastingTableConnie} CAST_INIT={CAST_INIT} ctMkRole={ctMkRole}
        getProjectCastingTables={getProjectCastingTables} UploadZone={UploadZone}
      />;
    }

    // Styling section
    if (projectSection==="Styling") {
      return <Styling T={T} isMobile={isMobile} p={p}
        stylingSubSection={stylingSubSection} setStylingSubSection={setStylingSubSection}
        fittingStore={fittingStore} setFittingStore={setFittingStore} activeFittingVersion={activeFittingVersion} setActiveFittingVersion={setActiveFittingVersion}
        fitShareTabs={fitShareTabs} setFitShareTabs={setFitShareTabs} fitShareLoading={fitShareLoading} setFitShareLoading={setFitShareLoading} fitDeckRef={fitDeckRef}
        projectFileStore={projectFileStore} setProjectFileStore={setProjectFileStore} projectCreativeLinks={projectCreativeLinks} setProjectCreativeLinks={setProjectCreativeLinks}
        styleSearchTerm={styleSearchTerm} setStyleSearchTerm={setStyleSearchTerm}
        linkUploading={linkUploading} linkUploadProgress={linkUploadProgress} uploadFromLink={uploadFromLink}
        createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
        pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert}
        FittingConnie={FittingConnie} mkFitTalent={mkFitTalent} mkFitFitting={mkFitFitting}
        UploadZone={UploadZone}
      />;
    }

    // Travel section
    if (projectSection==="Travel") {
      return <Travel T={T} isMobile={isMobile} p={p}
        travelSubSection={travelSubSection} setTravelSubSection={setTravelSubSection}
        travelItineraryStore={travelItineraryStore} setTravelItineraryStore={setTravelItineraryStore} activeTIVersion={activeTIVersion} setActiveTIVersion={setActiveTIVersion}
        tiShowAddMenu={tiShowAddMenu} setTiShowAddMenu={setTiShowAddMenu}
        projectLocLinks={projectLocLinks} setProjectLocLinks={setProjectLocLinks}
        projectInfoRef={projectInfoRef}
        createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
        pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert} showPrompt={showPrompt}
        getProjectFiles={getProjectFiles} addProjectFiles={addProjectFiles}
        TRAVEL_ITINERARY_INIT={TRAVEL_ITINERARY_INIT} tiMkDay={tiMkDay} tiMkMove={tiMkMove}
        TI_FLIGHT_COLS={TI_FLIGHT_COLS} TI_CAR_COLS={TI_CAR_COLS} TI_HOTEL_COLS={TI_HOTEL_COLS} TI_ROOMING_COLS={TI_ROOMING_COLS} TI_MOVEMENT_COLS={TI_MOVEMENT_COLS}
        TICell={TICell} TITableSection={TITableSection} BtnExport={BtnExport} CSLogoSlot={CSLogoSlot} UploadZone={UploadZone}
        CS_FONT={CS_FONT} CS_LS={CS_LS} PRINT_CLEANUP_CSS={PRINT_CLEANUP_CSS}
      />;
    }

    // Schedule section
    if (projectSection==="Schedule") {
      return <Schedule T={T} isMobile={isMobile} p={p}
        scheduleSubSection={scheduleSubSection} setScheduleSubSection={setScheduleSubSection}
        cpsStore={cpsStore} setCpsStore={setCpsStore} activeCPSVersion={activeCPSVersion} setActiveCPSVersion={setActiveCPSVersion}
        cpsShareUrl={cpsShareUrl} setCpsShareUrl={setCpsShareUrl} cpsShareLoading={cpsShareLoading} setCpsShareLoading={setCpsShareLoading}
        cpsShareTabs={cpsShareTabs} setCpsShareTabs={setCpsShareTabs} cpsRef={cpsRef} cpsAutoSyncing={cpsAutoSyncing}
        shotListStore={shotListStore} setShotListStore={setShotListStore} activeShotListVersion={activeShotListVersion} setActiveShotListVersion={setActiveShotListVersion}
        slShareUrl={slShareUrl} setSlShareUrl={setSlShareUrl} slShareLoading={slShareLoading} setSlShareLoading={setSlShareLoading} slRef={slRef}
        storyboardStore={storyboardStore} setStoryboardStore={setStoryboardStore} activeStoryboardVersion={activeStoryboardVersion} setActiveStoryboardVersion={setActiveStoryboardVersion}
        sbShareUrl={sbShareUrl} setSbShareUrl={setSbShareUrl} sbShareLoading={sbShareLoading} setSbShareLoading={setSbShareLoading} sbRef={sbRef}
        postProdStore={postProdStore} setPostProdStore={setPostProdStore} activePostProdVersion={activePostProdVersion} setActivePostProdVersion={setActivePostProdVersion}
        ppShareUrl={ppShareUrl} setPpShareUrl={setPpShareUrl} ppShareLoading={ppShareLoading} setPpShareLoading={setPpShareLoading} ppRef={ppRef}
        createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
        pushUndo={pushUndo} archiveItem={archiveItem} pushNav={pushNav} showAlert={showAlert}
        CPSPolly={CPSPolly} ShotListPolly={ShotListPolly} StoryboardPolly={StoryboardPolly} PostPolly={PostPolly}
        cpsDefaultPhases={cpsDefaultPhases} mkFrame={mkFrame} ppMkVideo={ppMkVideo} ppMkStill={ppMkStill} ppDefaultSchedule={ppDefaultSchedule}
      />;
    }

    return null;
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  const currentTab = TABS.find(t=>t.id===activeTab)||(activeTab==="Settings"?{id:"Settings",label:"Settings"}:TABS[0]);

  const P = isMobile ? 16 : 28; // main padding

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Arial,sans-serif",color:T.text,display:"flex"}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg);}}
        *{box-sizing:border-box;}
        ::placeholder{color:#aeaeb2;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-thumb{background:#d1d1d6;border-radius:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        .nav-btn{width:100%;text-align:left;padding:9px 11px;border-radius:10px;border:none;background:transparent;color:#6e6e73;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.12s;display:flex;align-items:center;gap:9px;letter-spacing:0.04em;}
        .nav-btn:hover{color:#1d1d1f;background:rgba(0,0,0,0.05);}
        .nav-btn.active{background:rgba(0,0,0,0.08);color:#1d1d1f;font-weight:700;}
        .row:hover{background:#f5f5f7!important;cursor:pointer;}
        .proj-card:hover{border-color:#c7c7cc!important;box-shadow:0 8px 24px rgba(0,0,0,0.10)!important;transform:translateY(-2px);}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.2);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:50;display:flex;align-items:${isMobile?"flex-end":"center"};justify-content:center;}
        input:focus,textarea:focus,select:focus{outline:none;border-color:#6e6e73!important;box-shadow:0 0 0 3px rgba(0,0,0,0.06)!important;}
        .todo-item:hover .todo-del{opacity:1;} .todo-del{opacity:0;transition:opacity 0.12s;}
        .todo-item:hover{background:#f5f5f7;border-radius:8px;}
        .mob-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
        .bottom-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 4px;border:none;background:transparent;cursor:pointer;font-family:inherit;transition:color 0.12s;}
        @keyframes sparkle{0%,100%{opacity:0;transform:scale(0.2) rotate(0deg);}50%{opacity:1;transform:scale(1) rotate(90deg);}}
        @keyframes bop{0%,80%,100%{transform:scale(1) translateY(0)}40%{transform:scale(1.4) translateY(-6px)}}
        @keyframes floatStar{0%{transform:translate(0,0) scale(0.8);opacity:0.6;}25%{transform:translate(4px,-5px) scale(1.1);opacity:1;}50%{transform:translate(8px,2px) scale(0.9);opacity:0.8;}75%{transform:translate(3px,6px) scale(1);opacity:1;}100%{transform:translate(0,0) scale(0.8);opacity:0.6;}}
        .agent-card{transition:all 0.15s ease;cursor:pointer;}
        .agent-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,0.1)!important;}
        .agent-chat-msg{animation:fadeInMsg 0.18s ease;}
        @keyframes fadeInMsg{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
      `}</style>

      {/* ── SIDEBAR (desktop only) ── */}
      <div style={{width:220,flexShrink:0,background:"rgba(255,255,255,0.82)",borderRight:`1px solid ${T.border}`,display:isMobile?"none":"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
        <a href="/" onClick={(e)=>{if(!e.metaKey&&!e.ctrlKey){e.preventDefault();changeTab("Dashboard")}}} style={{padding:"20px 18px 16px",display:"flex",alignItems:"center",cursor:"pointer",textDecoration:"none"}}>
          <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAoAKADASIAAhEBAxEB/8QAGgABAAMBAQEAAAAAAAAAAAAAAAYICQUHA//EAEIQAAEDAwIDBQIKBQ0AAAAAAAECAwQABREGBwgSIRMUMUFRCTIVFiIjQlJhcXSzFzY4gZEYM0NUVmJygoOUocPT/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALl0pUD343Jt21W3UvVM1kSX+YR4MXm5e8SFAlKc+QAClE+iT54oJy860y0p15xDbaBlS1qACR6kmufB1DYJz5jwr5bJTwOC2zLQtQ/cDms6IkffDiZ1A8sSHrhDjODn7R0R7dC5vABPhnHoFLI8c+NSa68GO6kO3KkxLppi4SEJyYzMt1C1H0SVtpT/ABKaDQSlZ47P75bjbNa6Gk9wHLnKs7DyY8+3z1Fx+EnyWyoknABBCQSlQ8PEGtCoz7MmO1JjuodZdQFtrQcpUkjIIPmCKD6UqkXtJJEhnV2kAy+62DAfyELIz84n0rscD+/JkCNtfrGaS8PkWOa8vqsf1ZRPn9Qnx936oIXFpVc/aFPvMbFRFMPONFV9jpJQojI7J446fcK7HAo447w6WlbrilqMyX1Ucn+eVQe6UrlawJGkbyQcEQH+v+mqsrtq9x9S7d61hans0x1xxg8r8d1wluS0febWPQ48fIgEdRQazUqMbXa5sW4ui4WqdPP9pFkpw42ojtI7o95pY8lJP8RgjIINUl0hLlL9oA+0uS8pv40zk8pcJGAHcDHpQaA0pUA4gtfs7abU3jU5WjvqW+725tX9JJXkNjHmB1WR6JNBP6VkIU6qctTmrS7c1QhOEdc/tVY7ypJcCebPvYBVWmvDhuG3uZtNadRLcSbihPdbmgfRktgBRx5BQKVgeixQejUpSgVUT2lnevi1ovkJ7p3yV2vpz8jfJ/xz1buoFv3ttA3V24maXlvCNJ5hIgSSM9hISDyqI80kEpP2KOOuKCO8GybMnh00v8C9jgtOGXyY5jI7RXac/nnPr9Hl8sV6/Wadpu29nDPqOTFMR6BEkPfONSWC9b5xT4KQroM480qSrGAceFS+88aO5Uu2KjQLJpy3SVpKTKQy64pB9UJWspB/xBQoOx7SZdkOtNKIi9j8Mpgv995cc/Y86ex5v39tirYbCiSnZDQ4mBQeFghBQV447BGM/bjFUn2S2Q17vPrlOstfpuLNkefEidOnAodngY+baBweUgBPMAEpHh1AFaFMNNMMNsMtpbabSEIQkYCUgYAA9KCkPtKv1v0f+AkfmJqI8QWx7+mNDaZ3R0ey4i2SrZCdubLOQYUhTSD2ycdQhSj1+qo+hAEu9pUD8btHnHTuEj8xNW026gxbhs9pu3XCM1JiyLBFZfYdQFIcQqOkKSoHxBBIxQUc3P3xTuZwyw9O6gfA1ZarxGLqj078wGnkh4f3gSAsepBHjgWZ4D/2cbR+Ml/nKqo3FVsrL2n1d3m3Nuv6VuTilW985UWVeJYWfrDyJ95PXxCsW54D/wBnG0fjJf5yqD2LWX6oXn8A/wDlqrOjhP20tG6t01bpq5q7B8WXtoEsDKoz4eQErx5jqQR5gnwOCNF9YgnSN5AGSYD/AOWqqR+zcB/SjqQ46fAn/e3QQ3Z3Xeq+HDd6dYNTRXxbVPBi8QQchSfoSGvIkA8wP0knHTII6O2lyg3njvbu1rlNy4MzUkx+O+2cpcbUl0pUPvBq0PFnsjH3U0r8J2hptrVlsaJhudE96b8THWft6lJPgo+QUapnwpRpELiZ0nDlsOR5LFwdbdacSUrbWlpwFJB6ggjGKDT2s/8Aj+3G+Mu47Gire/zW3ToIf5T8lyWsDn+/kThP2Erq5m9+uY+3O1961Y8EreiscsRtXg7IX8ltP3cxBP2AmqJcL2zat8NU3+6aouNyYtkYdrJlx1JDz8t1RUBlaVDwC1K6eafWg9Jt2ruHpvheO1T2skJuD0TvLsn4JlkC4n5Ycz2XUBYCM+aBioZwGbj/ABT3QVpO4P8AJatShLKOY/Jblpz2R/zZKPtKkele2/yKNtP7Sau/3Ef/AMa8C4qtj29l7jYbxpe43STapZKRJkrSXY8pB5gOZCUgApwU9M5Qqg0bpUB4fdftblbUWfU+UiatvsLghIxySW+jnTyB6KA9FCp9QKUpQfOSwxJZUzJZbeaV7yHEhST94NciHpDScKZ32HpeyRpWebtmoDSF59eYJzmlKDt0pSgUpSgUpSgUpSgUpSgUpSgUpSgUpSg//9k=" alt="ONNA" style={{height:24,width:"auto",display:"block"}}/>
        </a>

        <nav style={{flex:1,padding:"4px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
          {TABS.map(t=>(
            <a key={t.id} href={buildPath(t.id,null,null,null)} onClick={(e)=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();changeTab(t.id);}} className={`nav-btn${activeTab===t.id?" active":""}`} style={{textDecoration:"none",color:"inherit"}}>
              <StarIcon size={11} color={t.starColor||"currentColor"}/>
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
        <div style={{margin:10,position:"relative"}}>
          <button onClick={()=>{setActiveTab("Settings");setSelectedProject(null);pushNav("Settings",null,null,null);}} style={{width:"100%",padding:"12px 14px",borderRadius:12,background:activeTab==="Settings"?"rgba(0,0,0,0.08)":"rgba(0,0,0,0.04)",border:`1px solid rgba(0,0,0,0.07)`,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>E</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:T.text}}>Emily</div>
              <div style={{fontSize:11,color:T.muted}}>Admin · onna</div>
            </div>
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{padding:`0 ${P}px`,height:isMobile?50:58,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:"rgba(255,255,255,0.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
            {isMobile&&<img src="/onna-default-logo.png" alt="ONNA" onClick={(e)=>{if(e.metaKey||e.ctrlKey){window.open(window.location.origin,"_blank")}else{changeTab("Dashboard")}}} style={{height:18,width:"auto",marginRight:6,flexShrink:0,cursor:"pointer"}}/>}
            <span style={{fontSize:isMobile?14:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentTab.label}</span>
            {selectedProject&&<><span style={{color:T.muted,fontSize:16,fontWeight:300,flexShrink:0}}>›</span><span style={{fontSize:isMobile?12:14,color:T.sub,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selectedProject.name}</span>{!isMobile&&projectSection!=="Home"&&<><span style={{color:T.muted,fontSize:16}}>›</span><span style={{fontSize:13,color:T.muted}}>{projectSection}{creativeSubSection?` › ${creativeSubSection==="moodboard"?"Moodboard":"Brief"}`:""}{budgetSubSection?` › ${budgetSubSection==="tracker"?"Budget Tracker":budgetSubSection==="estimates"?"Estimates":"Quotations"}`:""}</span></>}</>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:isMobile?6:10,flexShrink:0}}>
            {!isMobile&&apiLoading&&<span style={{fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:"#92680a",display:"inline-block",animation:"pulse 1.2s ease-in-out infinite"}}/>Syncing…</span>}
            {!isMobile&&apiError&&!apiLoading&&<span title={`API: ${apiError}`} style={{fontSize:11,color:"#c0392b",cursor:"default"}}>● Offline</span>}
            {!isMobile&&!apiLoading&&!apiError&&<span style={{fontSize:11,color:"#147d50",display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:"#147d50",display:"inline-block"}}/>Live</span>}
            {isMobile&&<button onClick={()=>setMobileMenuOpen(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",padding:6,fontSize:18,lineHeight:1,color:T.text,fontFamily:"inherit"}}>{mobileMenuOpen?"✕":"☰"}</button>}
          </div>
        </div>

        {/* Scroll area */}
        <div style={{flex:1,overflowY:"auto",overflowX:"auto",padding:`${P}px ${P}px 44px`}}>

          {/* ══ DASHBOARD ══ */}
          {activeTab==="Dashboard"&&<Dashboard T={T} isMobile={isMobile} gcalToken={gcalToken} gcalEvents={gcalEvents} gcalLoading={gcalLoading} gcalEventColors={gcalEventColors} calMonth={calMonth} setCalMonth={setCalMonth} calDayView={calDayView} setCalDayView={setCalDayView} outlookEvents={outlookEvents} outlookLoading={outlookLoading} outlookError={outlookError} fetchOutlookCal={fetchOutlookCal} connectGCal={connectGCal} GCAL_CLIENT_ID={GCAL_CLIENT_ID} GCAL_COLORS={GCAL_COLORS} setGcalToken={setGcalToken} setGcalEvents={setGcalEvents} todos={todos} setTodos={setTodos} newTodo={newTodo} setNewTodo={setNewTodo} todoFilter={todoFilter} setTodoFilter={setTodoFilter} selectedTodo={selectedTodo} setSelectedTodo={setSelectedTodo} projectTodos={projectTodos} setProjectTodos={setProjectTodos} dashNotesList={dashNotesList} setDashNotesList={setDashNotesList} dashSelectedNoteId={dashSelectedNoteId} setDashSelectedNoteId={setDashSelectedNoteId} activeProjects={activeProjects} allTodos={allTodos} filteredTodos={filteredTodos} todoTopFilter={todoTopFilter} allProjectsMerged={allProjectsMerged} archivedTodos={archivedTodos} setArchivedTodos={setArchivedTodos} pushUndo={pushUndo} addTodoFromInput={addTodoFromInput} archiveItem={archiveItem} setPendingDragToProject={setPendingDragToProject} buildPath={buildPath} pushNav={pushNav} setActiveTab={setActiveTab} setSelectedProject={setSelectedProject} setProjectSection={setProjectSection} DashNotes={DashNotes}/>}

          {/* ══ CAL DAY VIEW MODAL ══ */}
          {calDayView&&(()=>{
            const dayKey = calDayView.toISOString().slice(0,10);
            // Rebuild eventsByDay for the day modal (reuse same dedup logic)
            const seen2=new Set();
            const allEvs2=[...gcalEvents,...outlookEvents].filter(ev=>{const d2=ev.start?.date||ev.start?.dateTime?.slice(0,10);const k2=(ev.summary||"").trim().toLowerCase()+"|"+d2;if(seen2.has(k2))return false;seen2.add(k2);return true;});
            const dayEvsFull=allEvs2.filter(ev=>{const s=ev.start?.date||ev.start?.dateTime?.slice(0,10);if(!s)return false;const cursor=new Date(s+"T00:00:00");const startKey=cursor.toISOString().slice(0,10);// check if dayKey falls within this event's span
              const endS=ev.end?.date||ev.end?.dateTime?.slice(0,10)||s;const endD2=new Date(endS+"T00:00:00");const cellD=new Date(dayKey+"T00:00:00");return cellD>=cursor&&cellD<endD2||startKey===dayKey;}).sort((a,b)=>{const ta=a.start?.dateTime?new Date(a.start.dateTime):new Date(a.start.date+"T00:00:00");const tb=b.start?.dateTime?new Date(b.start.dateTime):new Date(b.start.date+"T00:00:00");return ta-tb;});
            const label=calDayView.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
            return(
              <div onClick={()=>setCalDayView(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
                <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:18,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",width:"100%",maxWidth:480,maxHeight:"80vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
                  {/* Header */}
                  <div style={{padding:"16px 20px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                    <div>
                      <div style={{fontSize:17,fontWeight:700,color:T.text}}>{calDayView.toLocaleDateString("en-US",{weekday:"long"})}</div>
                      <div style={{fontSize:13,color:T.muted,marginTop:1}}>{calDayView.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
                    </div>
                    <button onClick={()=>setCalDayView(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:T.muted,padding:"4px 8px",borderRadius:8,fontFamily:"inherit",lineHeight:1}}>{"✕"}</button>
                  </div>
                  {/* Event list */}
                  <div style={{overflowY:"auto",padding:"12px 20px 20px",flex:1}}>
                    {dayEvsFull.length===0?(
                      <div style={{textAlign:"center",padding:"32px 0",color:T.muted,fontSize:14}}>No events</div>
                    ):dayEvsFull.map((ev,i)=>{
                      const col=ev.colorId?(gcalEventColors[ev.colorId]?.background||GCAL_COLORS[ev.colorId]||T.accent):(ev.calendarColor||T.accent);
                      const isAllDay=!ev.start?.dateTime;
                      const startDT=ev.start?.dateTime?new Date(ev.start.dateTime):null;
                      const endDT=ev.end?.dateTime?new Date(ev.end.dateTime):null;
                      const timeStr=startDT?startDT.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true})+(endDT?" – "+endDT.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true}):""):"All day";
                      const source=ev._outlook?"Outlook":"Google";
                      return(
                        <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<dayEvsFull.length-1?`1px solid ${T.borderSub}`:"none",alignItems:"flex-start"}}>
                          <div style={{width:4,borderRadius:4,alignSelf:"stretch",background:col,flexShrink:0,minHeight:36}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:600,color:T.text,lineHeight:1.3}}>{ev.summary||"(No title)"}</div>
                            <div style={{fontSize:12,color:T.muted,marginTop:3}}>{timeStr}</div>
                            {ev.location&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>📍 {ev.location}</div>}
                            {ev.description&&(()=>{
                              const plain=ev.description.replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#?\w+;/g," ").trim();
                              const parts=plain.split(/(https?:\/\/[^\s]+)/g);
                              return <div style={{fontSize:11,color:T.sub,marginTop:4,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                                {parts.map((p,pi)=>p.match(/^https?:\/\//)
                                  ?<a key={pi} href={p} target="_blank" rel="noreferrer" style={{color:T.accent,textDecoration:"underline",wordBreak:"break-all"}}>{p}</a>
                                  :<span key={pi}>{p}</span>)}
                              </div>;
                            })()}
                            <div style={{fontSize:10,color:T.muted,marginTop:4,opacity:0.6}}>{source}</div>
                          </div>
                        </div>
                      ); })}
                  </div>
                </div>
              </div>
            ); })()}

          {/* ══ VENDORS ══ */}
          {activeTab==="Vendors"&&<Vendors T={T} isMobile={isMobile} bbCat={bbCat} setBbCat={setBbCat} bbLocation={bbLocation} setBbLocation={setBbLocation} filteredBB={filteredBB} customVendorCats={customVendorCats} setCustomVendorCats={setCustomVendorCats} customVendorLocs={customVendorLocs} setCustomVendorLocs={setCustomVendorLocs} allVendorCats={allVendorCats} allVendorLocs={allVendorLocs} addNewOption={addNewOption} getSearch={getSearch} setSearch={setSearch} setShowAddVendor={setShowAddVendor} setEditVendor={setEditVendor} getXContacts={getXContacts} downloadCSV={downloadCSV} exportTablePDF={exportTablePDF} SearchBar={SearchBar} Sel={Sel} TH={TH} TD={TD} BtnPrimary={BtnPrimary}/>}

          {activeTab==="Clients"&&<Clients T={T} isMobile={isMobile} api={api} localLeads={localLeads} setLocalLeads={setLocalLeads} localClients={localClients} setLocalClients={setLocalClients} outreach={outreach} setOutreach={setOutreach} localProjects={localProjects} leadStatusOverrides={leadStatusOverrides} customLeadCats={customLeadCats} setCustomLeadCats={setCustomLeadCats} customLeadLocs={customLeadLocs} setCustomLeadLocs={setCustomLeadLocs} allLeadCats={allLeadCats} allLeadLocs={allLeadLocs} addNewOption={addNewOption} getSearch={getSearch} setSearch={setSearch} setSelectedLead={setSelectedLead} setSelectedOutreach={setSelectedOutreach} setShowAddLead={setShowAddLead} downloadCSV={downloadCSV} exportTablePDF={exportTablePDF} formatDate={formatDate} _parseDate={_parseDate} getMonthLabel={getMonthLabel} archiveItem={archiveItem} promoteToClient={promoteToClient} getXContacts={getXContacts} getProjRevenue={getProjRevenue} OUTREACH_STATUS_LABELS={OUTREACH_STATUS_LABELS} OUTREACH_STATUSES={OUTREACH_STATUSES} LEAD_CATEGORIES={LEAD_CATEGORIES} Pill={Pill} SearchBar={SearchBar} Sel={Sel} BtnPrimary={BtnPrimary} BtnSecondary={BtnSecondary} TH={TH} THFilter={THFilter} TD={TD} OutreachBadge={OutreachBadge}/>}

          {activeTab==="Projects"&&<ProjectsTab T={T} isMobile={isMobile} api={api} selectedProject={selectedProject} setSelectedProject={setSelectedProject} projectSection={projectSection} setProjectSection={setProjectSection} localProjects={localProjects} setLocalProjects={setLocalProjects} allProjectsMerged={allProjectsMerged} archivedProjects={archivedProjects} setArchivedProjects={setArchivedProjects} saveStatus={saveStatus} setShowFromTemplate={setShowFromTemplate} setEditingEstimate={setEditingEstimate} setCreativeSubSection={setCreativeSubSection} setBudgetSubSection={setBudgetSubSection} setDocumentsSubSection={setDocumentsSubSection} setScheduleSubSection={setScheduleSubSection} setTravelSubSection={setTravelSubSection} setPermitsSubSection={setPermitsSubSection} setStylingSubSection={setStylingSubSection} setCastingSubSection={setCastingSubSection} setActiveCastingDeckVersion={setActiveCastingDeckVersion} setActiveCastingTableVersion={setActiveCastingTableVersion} setActiveCSVersion={setActiveCSVersion} setLocSubSection={setLocSubSection} setActiveRecceVersion={setActiveRecceVersion} renderProjectSection={renderProjectSection} getProjRevenue={getProjRevenue} getProjCost={getProjCost} archiveItem={archiveItem} buildPath={buildPath} pushNav={pushNav} getSearch={getSearch} setSearch={setSearch} PROJECT_SECTIONS={PROJECT_SECTIONS} SearchBar={SearchBar} Pill={Pill} StatCard={StatCard}/>}

          {activeTab==="Finance"&&<Finance T={T} isMobile={isMobile} allProjectsMerged={allProjectsMerged} localLeads={localLeads} getProjRevenue={getProjRevenue} getProjCost={getProjCost} apiLoading={apiLoading}/>}

          {activeTab==="Resources"&&<Resources T={T} isMobile={isMobile} api={api}
            vaultLocked={vaultLocked} setVaultLocked={setVaultLocked}
            vaultKey={vaultKey} setVaultKey={setVaultKey}
            vaultPass={vaultPass} setVaultPass={setVaultPass}
            vaultErr={vaultErr} setVaultErr={setVaultErr}
            vaultLoading={vaultLoading} setVaultLoading={setVaultLoading}
            vaultResources={vaultResources} setVaultResources={setVaultResources}
            vaultView={vaultView} setVaultView={setVaultView}
            vaultShowPw={vaultShowPw} setVaultShowPw={setVaultShowPw}
            vaultCopied={vaultCopied} setVaultCopied={setVaultCopied}
            vaultSaving={vaultSaving} setVaultSaving={setVaultSaving}
            vaultAddPwOpen={vaultAddPwOpen} setVaultAddPwOpen={setVaultAddPwOpen}
            vaultEditId={vaultEditId} setVaultEditId={setVaultEditId}
            vaultNewPw={vaultNewPw} setVaultNewPw={setVaultNewPw}
            vaultFileRef={vaultFileRef} setVaultFileRef={setVaultFileRef}
            vaultFileName={vaultFileName} setVaultFileName={setVaultFileName}
            vaultFileErr={vaultFileErr} setVaultFileErr={setVaultFileErr}
            vaultPwSearch={vaultPwSearch} setVaultPwSearch={setVaultPwSearch}
            vaultViewEntry={vaultViewEntry} setVaultViewEntry={setVaultViewEntry}
            vaultDeriveKey={vaultDeriveKey} vaultEncrypt={vaultEncrypt} vaultDecrypt={vaultDecrypt}
            VAULT_SALT={VAULT_SALT} VAULT_CHECK={VAULT_CHECK}
            Pill={Pill} TH={TH} TD={TD} BtnPrimary={BtnPrimary} BtnSecondary={BtnSecondary}
            showAlert={showAlert}
          />}

        {/* ── AGENTS TAB ── */}
        {activeTab==="Agents"&&<Agents isMobile={isMobile} agentActiveIdx={agentActiveIdx} setAgentActiveIdx={setAgentActiveIdx} AGENT_DEFS={AGENT_DEFS} AgentCard={AgentCard} vendors={vendors} localLeads={localLeads} setVendors={setVendors} setLocalLeads={setLocalLeads} callSheetStore={callSheetStore} setCallSheetStore={setCallSheetStore} selectedProject={selectedProject} allProjectsMerged={allProjectsMerged} activeCSVersion={activeCSVersion} dietaryStore={dietaryStore} setDietaryStore={setDietaryStore} riskAssessmentStore={riskAssessmentStore} setRiskAssessmentStore={setRiskAssessmentStore} activeRAVersion={activeRAVersion} setActiveRAVersion={setActiveRAVersion} contractDocStore={contractDocStore} setContractDocStore={setContractDocStore} activeContractVersion={activeContractVersion} setActiveContractVersion={setActiveContractVersion} projectEstimates={projectEstimates} setProjectEstimates={setProjectEstimates} activeEstimateVersion={activeEstimateVersion} setActiveEstimateVersion={setActiveEstimateVersion} projectActuals={projectActuals} setProjectActuals={setProjectActuals} projectCasting={projectCasting} setProjectCasting={setProjectCasting} getProjectCastingTables={getProjectCastingTables} navigateToDoc={navigateToDoc} pushUndo={pushUndo} projectInfoRef={projectInfoRef} archiveItem={archiveItem} setCsDuplicateModal={setCsDuplicateModal} setCsDuplicateSearch={setCsDuplicateSearch} setRaDuplicateModal={setRaDuplicateModal} setRaDuplicateSearch={setRaDuplicateSearch} travelItineraryStore={travelItineraryStore} setTravelItineraryStore={setTravelItineraryStore} castingDeckStore={castingDeckStore} setCastingDeckStore={setCastingDeckStore} fittingStore={fittingStore} setFittingStore={setFittingStore} castingTableStore={castingTableStore} setCastingTableStore={setCastingTableStore} cpsStore={cpsStore} setCpsStore={setCpsStore} shotListStore={shotListStore} setShotListStore={setShotListStore} storyboardStore={storyboardStore} setStoryboardStore={setStoryboardStore} locDeckStore={locDeckStore} setLocDeckStore={setLocDeckStore} recceReportStore={recceReportStore} setRecceReportStore={setRecceReportStore} postProdStore={postProdStore} setPostProdStore={setPostProdStore} syncProjectInfoToDocs={syncProjectInfoToDocs} projectFileStore={projectFileStore}/>}

        {/* ── INFORMATION TAB ── */}
        {activeTab==="Information"&&<Information T={T} api={api} isMobile={isMobile} notes={notes} setNotes={setNotes} notesLoading={notesLoading} setNotesLoading={setNotesLoading} archiveItem={archiveItem} BtnPrimary={BtnPrimary} BtnSecondary={BtnSecondary} hydrated={globalHydratedRef.current}/>}

        {activeTab==="Settings"&&(
          <div style={{display:"flex",gap:0,margin:`-${P}px -${P}px -${isMobile?80:44}px`,height:`calc(100% + ${P}px + ${isMobile?80:44}px)`,overflow:"hidden"}}>
            {/* Settings Sidebar */}
            <div style={{width:220,flexShrink:0,borderRight:`1px solid ${T.border}`,padding:"28px 0",display:"flex",flexDirection:"column",gap:2}}>
              <div style={{padding:"0 20px",marginBottom:20}}>
                <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Settings</div>
                <div style={{fontSize:12,color:T.muted,marginTop:2}}>Manage your account</div>
              </div>
              {[
                {id:"deleted",label:"Deleted",icon:'<svg width="14" height="14" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="3" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 4v5.5a1 1 0 001 1h7a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.2"/><path d="M4.5 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>'},
                {id:"categories",label:"Manage Categories",icon:'<svg width="14" height="14" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>'},
                {id:"sop",label:"SOPs",icon:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 4h4M5 7h4M5 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>'},
                {id:"signout",label:"Sign Out",icon:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M13 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>'},
              ].map(item=>(
                <button key={item.id} onClick={()=>{if(item.id==="signout"){localStorage.removeItem("onna_token");setAuthed(false);}else setSettingsSection(item.id);}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 20px",background:settingsSection===item.id&&item.id!=="signout"?"rgba(0,0,0,0.05)":"none",border:"none",borderLeft:settingsSection===item.id&&item.id!=="signout"?`3px solid ${T.accent}`:"3px solid transparent",color:item.id==="signout"?"#c0392b":settingsSection===item.id?T.text:T.sub,fontSize:13,fontWeight:settingsSection===item.id?600:500,cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%"}} onMouseOver={e=>{if(settingsSection!==item.id)e.currentTarget.style.background="rgba(0,0,0,0.03)";}} onMouseOut={e=>{if(settingsSection!==item.id)e.currentTarget.style.background="none";}}>
                  <span dangerouslySetInnerHTML={{__html:item.icon}}/>
                  {item.label}
                  {item.id==="deleted"&&archive.length>0&&<span style={{marginLeft:"auto",background:T.borderSub,borderRadius:999,padding:"1px 7px",fontSize:10.5,color:T.sub}}>{archive.length}</span>}
                </button>
              ))}
            </div>

            {/* Settings Content */}
            <div style={{flex:1,padding:28,overflowY:"auto"}}>
              {settingsSection==="deleted"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                    <div>
                      <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Deleted Items</div>
                      <div style={{fontSize:12,color:T.muted,marginTop:2}}>Deleted items are permanently removed after 30 days</div>
                    </div>
                    {archive.length>0&&<button onClick={()=>{if(window.confirm("Permanently remove all deleted items?"))setArchive(()=>{try{localStorage.removeItem('onna_archive');}catch{}return [];});}} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:"6px 14px"}}>Clear all</button>}
                  </div>
                  {archive.length===0?(
                    <div style={{padding:"60px 0",textAlign:"center",color:T.muted,fontSize:13}}>No deleted items.</div>
                  ):(
                    ["todos","notes","dashNotes","leads","vendors","outreach","estimates","projects","callSheets","riskAssessments","contracts","travelItineraries","dietaries","clients"].map(table=>{
                      const entries=archive.filter(e=>e.table===table);
                      if(!entries.length) return null;
                      const label={todos:"Tasks",notes:"Notes",dashNotes:"Dashboard Notes",leads:"Leads",vendors:"Vendors",outreach:"Outreach",estimates:"Estimates",projects:"Projects",callSheets:"Call Sheets",riskAssessments:"Risk Assessments",contracts:"Contracts",travelItineraries:"Travel Itineraries",dietaries:"Dietary Lists",clients:"Clients"}[table]||table;
                      return (
                        <div key={table} style={{marginBottom:24}}>
                          <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>{label} ({entries.length})</div>
                          {entries.map(e=>{
                            const daysLeft=Math.max(0,30-Math.floor((Date.now()-new Date(e.deletedAt).getTime())/(86400000)));
                            return (
                              <div key={e.id} style={{display:"flex",alignItems:"center",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,marginBottom:6,background:"#fafafa"}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.item?.text||e.item?.title||e.item?.company||e.item?.name||e.item?.callSheet?.label||e.item?.riskAssessment?.label||e.item?.contract?.label||e.item?.travelItinerary?.label||e.item?.dietary?.label||e.item?.label||"Untitled"}</div>
                                  <div style={{fontSize:11,color:T.muted,marginTop:2}}>{daysLeft} day{daysLeft!==1?"s":""} remaining</div>
                                </div>
                                <div style={{display:"flex",gap:6}}>
                                  <button onClick={()=>restoreItem(e)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,color:T.sub,cursor:"pointer",padding:"4px 10px",fontFamily:"inherit"}}>Restore</button>
                                  <button onClick={()=>permanentlyDelete(e.id)} style={{background:"none",border:"none",fontSize:11,color:"#c0392b",cursor:"pointer",padding:"4px 8px",fontFamily:"inherit"}}>Delete</button>
                                </div>
                              </div>
                            ); })}
                        </div>
                      ); })
                  )}
                </div>
              )}
              {settingsSection==="categories"&&(
                <div>
                  <div style={{marginBottom:22}}>
                    <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Manage Categories</div>
                    <div style={{fontSize:12,color:T.muted,marginTop:2}}>Edit or delete client and vendor categories</div>
                  </div>
                  {[
                    {label:"Client Categories",type:"lead",builtin:LEAD_CATEGORIES.filter(c=>c!=="All"),custom:customLeadCats,hidden:hiddenLeadBuiltins},
                    {label:"Vendor Categories",type:"vendor",builtin:VENDORS_CATEGORIES,custom:customVendorCats,hidden:hiddenVendorBuiltins},
                  ].map(section=>(
                    <div key={section.type} style={{marginBottom:28}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,paddingBottom:7,borderBottom:`1px solid ${T.border}`}}>{section.label}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {section.builtin.filter(c=>!section.hidden.includes(c)).map(cat=>(
                          <div key={cat} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`}}>
                            {catEdit&&catEdit.type===section.type&&catEdit.cat===cat?(
                              <>
                                <input autoFocus value={catEditVal} onChange={e=>setCatEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")renameCat(section.type,cat,catEditVal);if(e.key==="Escape")setCatEdit(null);}} style={{flex:1,border:`1.5px solid ${T.accent}`,borderRadius:7,padding:"5px 8px",fontSize:13,fontFamily:"inherit",outline:"none",background:"white"}}/>
                                <button disabled={catSaving} onClick={()=>renameCat(section.type,cat,catEditVal)} style={{background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",padding:"4px 10px",borderRadius:6,fontFamily:"inherit",opacity:catSaving?0.5:1}}>Save</button>
                                <button onClick={()=>setCatEdit(null)} style={{background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",padding:"4px 6px",fontFamily:"inherit"}}>Cancel</button>
                              </>
                            ):(
                              <>
                                <span style={{flex:1,fontSize:13,color:T.text}}>{cat}</span>
                                <span style={{fontSize:10,color:T.muted,background:"#f0ede8",borderRadius:999,padding:"2px 8px",fontWeight:500}}>built-in</span>
                                <button disabled={catSaving} onClick={()=>{setCatEdit({type:section.type,cat});setCatEditVal(cat);}} style={{background:"none",border:"none",color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="none"}>Rename</button>
                                <button disabled={catSaving} onClick={async()=>{if(!window.confirm('Delete "'+cat+'"? All '+(section.type==='lead'?'clients':'vendors')+' in this category will have it cleared.'))return;await deleteCat(section.type,cat);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,opacity:catSaving?0.4:1,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
                              </>
                            )}
                          </div>
                        ))}
                        {section.custom.map(cat=>(
                          <div key={cat} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`}}>
                            {catEdit&&catEdit.type===section.type&&catEdit.cat===cat?(
                              <>
                                <input autoFocus value={catEditVal} onChange={e=>setCatEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")renameCat(section.type,cat,catEditVal);if(e.key==="Escape")setCatEdit(null);}} style={{flex:1,border:`1.5px solid ${T.accent}`,borderRadius:7,padding:"5px 8px",fontSize:13,fontFamily:"inherit",outline:"none",background:"white"}}/>
                                <button disabled={catSaving} onClick={()=>renameCat(section.type,cat,catEditVal)} style={{background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",padding:"4px 10px",borderRadius:6,fontFamily:"inherit",opacity:catSaving?0.5:1}}>Save</button>
                                <button onClick={()=>setCatEdit(null)} style={{background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",padding:"4px 6px",fontFamily:"inherit"}}>Cancel</button>
                              </>
                            ):(
                              <>
                                <span style={{flex:1,fontSize:13,color:T.text}}>{cat}</span>
                                <button disabled={catSaving} onClick={()=>{setCatEdit({type:section.type,cat});setCatEditVal(cat);}} style={{background:"none",border:"none",color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="none"}>Rename</button>
                                <button disabled={catSaving} onClick={async()=>{if(!window.confirm('Delete "'+cat+'"? All '+(section.type==='lead'?'clients':'vendors')+' in this category will have it cleared.'))return;await deleteCat(section.type,cat);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,opacity:catSaving?0.4:1,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
                              </>
                            )}
                          </div>
                        ))}
                        {section.builtin.filter(c=>!section.hidden.includes(c)).length===0&&section.custom.length===0&&(
                          <div style={{fontSize:13,color:T.muted,padding:"12px 0",textAlign:"center"}}>No categories.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {settingsSection==="sop"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                    <div>
                      <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Standard Operating Procedures</div>
                      <div style={{fontSize:12,color:T.muted,marginTop:2}}>Agent guides and production workflows</div>
                    </div>
                    <BtnPrimary onClick={()=>{setSopAddOpen(true);setSopEditId(null);setSopDraft({title:"",content:"",category:"agent",agent:""});setSopPreview(false);}}>+ New SOP</BtnPrimary>
                  </div>

                  {/* Filter tabs */}
                  <div style={{display:"flex",gap:6,marginBottom:20}}>
                    {[{id:"all",label:"All"},{id:"agent",label:"Agent Guides"},{id:"workflow",label:"Workflows"}].map(f=>(
                      <button key={f.id} onClick={()=>setSopFilter(f.id)} style={{padding:"5px 14px",borderRadius:999,background:sopFilter===f.id?T.accent:"#f5f5f7",color:sopFilter===f.id?"#fff":T.sub,border:"none",fontSize:11.5,fontWeight:sopFilter===f.id?600:500,cursor:"pointer",fontFamily:"inherit"}}>{f.label}</button>
                    ))}
                  </div>

                  {/* Add/Edit form */}
                  {(sopAddOpen||(sopEditId!==null&&typeof sopEditId==="number"))&&(
                    <div style={{padding:18,borderRadius:12,border:`1.5px solid ${T.accent}`,background:"white",marginBottom:20}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>{typeof sopEditId==="number"?"Edit SOP":"New SOP"}</div>
                      <div style={{display:"grid",gridTemplateColumns:sopDraft.category==="agent"?"1fr 1fr 1fr":"1fr 1fr",gap:10,marginBottom:12}}>
                        <div>
                          <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Title</div>
                          <input value={sopDraft.title} onChange={e=>setSopDraft(d=>({...d,title:e.target.value}))} placeholder="e.g. How to use Vendor Vinnie" style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Category</div>
                          <select value={sopDraft.category} onChange={e=>setSopDraft(d=>({...d,category:e.target.value,agent:e.target.value==="workflow"?"":d.agent}))} style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}>
                            <option value="agent">Agent Guide</option>
                            <option value="workflow">Workflow</option>
                          </select>
                        </div>
                        {sopDraft.category==="agent"&&(
                          <div>
                            <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Agent</div>
                            <select value={sopDraft.agent} onChange={e=>setSopDraft(d=>({...d,agent:e.target.value}))} style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}>
                              <option value="">Select agent...</option>
                              {AGENT_DEFS.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                      <div style={{display:"flex",gap:8,marginBottom:8}}>
                        <button onClick={()=>setSopPreview(false)} style={{padding:"4px 12px",borderRadius:7,background:!sopPreview?"#1d1d1f":"#f5f5f7",color:!sopPreview?"#fff":T.sub,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Write</button>
                        <button onClick={()=>setSopPreview(true)} style={{padding:"4px 12px",borderRadius:7,background:sopPreview?"#1d1d1f":"#f5f5f7",color:sopPreview?"#fff":T.sub,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Preview</button>
                      </div>
                      {sopPreview?(
                        <div style={{minHeight:120,padding:14,borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`}} dangerouslySetInnerHTML={{__html:renderSopMarkdown(sopDraft.content)||`<span style="color:${T.muted};font-size:13px">Nothing to preview</span>`}}/>
                      ):(
                        <textarea value={sopDraft.content} onChange={e=>setSopDraft(d=>({...d,content:e.target.value}))} rows={8} placeholder={"# Getting Started\n\nDescribe the procedure step by step...\n\n## Steps\n\n1. First step\n2. Second step\n\n- Use **bold** for emphasis"} style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"monospace",resize:"vertical",lineHeight:"1.6"}}/>
                      )}
                      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
                        <BtnSecondary onClick={()=>{setSopAddOpen(false);setSopEditId(null);setSopDraft({title:"",content:"",category:"agent",agent:""});setSopPreview(false);}}>Cancel</BtnSecondary>
                        <BtnPrimary disabled={!sopDraft.title.trim()||!sopDraft.content.trim()} onClick={()=>{
                          const now=new Date().toISOString();
                          if(typeof sopEditId==="number"){
                            setSops(prev=>prev.map(s=>s.id===sopEditId?{...s,title:sopDraft.title,content:sopDraft.content,category:sopDraft.category,agent:sopDraft.agent,updated_at:now}:s));
                          }else{
                            const id=Date.now();
                            setSops(prev=>[...prev,{id,title:sopDraft.title,content:sopDraft.content,category:sopDraft.category,agent:sopDraft.agent,order:prev.length,created_at:now,updated_at:now}]);
                          }
                          setSopAddOpen(false);setSopEditId(null);setSopDraft({title:"",content:"",category:"agent",agent:""});setSopPreview(false);
                        }}>{typeof sopEditId==="number"?"Save Changes":"Create SOP"}</BtnPrimary>
                      </div>
                    </div>
                  )}

                  {/* SOP list */}
                  {(()=>{
                    const filtered=sops.filter(s=>sopFilter==="all"||s.category===sopFilter);
                    if(filtered.length===0) return (
                      <div style={{padding:"60px 0",textAlign:"center"}}>
                        <div style={{fontSize:32,marginBottom:8}}>📋</div>
                        <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:4}}>No SOPs yet</div>
                        <div style={{fontSize:12,color:T.muted,maxWidth:300,margin:"0 auto",lineHeight:1.6}}>Create agent guides for your team to learn how to use each of the 7 agents, or add production workflow documentation.</div>
                      </div>
                    );
                    const agents=filtered.filter(s=>s.category==="agent");
                    const workflows=filtered.filter(s=>s.category==="workflow");
                    const renderGroup=(label,items)=>{
                      if(!items.length) return null;
                      return (
                        <div key={label} style={{marginBottom:24}}>
                          <div style={{fontSize:10,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>{label} ({items.length})</div>
                          {items.map(s=>{
                            const isExpanded=sopEditId===("view_"+s.id);
                            const agentDef=s.agent?AGENT_DEFS.find(a=>a.id===s.agent):null;
  const _mp = {T, isMobile, api, BtnPrimary, BtnSecondary, Sel, OutreachBadge, StarIcon,
    activeTab, changeTab, TABS, buildPath, setAuthed,
    selectedLead, setSelectedLead, selectedOutreach, setSelectedOutreach,
    addContactForm, setAddContactForm,
    addNewOption, customLeadCats, setCustomLeadCats, customLeadLocs, setCustomLeadLocs,
    allLeadCats, allLeadLocs, allVendorCats, allVendorLocs,
    customVendorCats, setCustomVendorCats, customVendorLocs, setCustomVendorLocs,
    OUTREACH_STATUSES, OUTREACH_STATUS_LABELS, promoteToClient,
    setLocalLeads, setLeadStatusOverrides, setOutreach,
    archiveItem, pruneCustom, setXContacts, pushUndo,
    showRateModal, setShowRateModal, rateInput, setRateInput,
    editVendor, setEditVendor, vendors, setVendors,
    newVendor, setNewVendor, newLead, setNewLead,
    DIETARY_TAGS, DIETARY_TAG_COLORS,
    showCatManager, setShowCatManager, catEdit, setCatEdit, catEditVal, setCatEditVal, catSaving,
    LEAD_CATEGORIES, VENDORS_CATEGORIES, hiddenLeadBuiltins, hiddenVendorBuiltins,
    renameCat, deleteCat,
    pendingProjectTask, setPendingProjectTask,
    pendingDragToProject, setPendingDragToProject,
    allProjectsMerged, setProjectTodos, setTodos, setTodoFilter, projectTodos,
    selectedTodo, setSelectedTodo,
    showAddProject, setShowAddProject, newProject, setNewProject,
    showFromTemplate, setShowFromTemplate, templateProject, setTemplateProject,
    showAddLead, setShowAddLead,
    showAddVendor, setShowAddVendor, showAlert,
    setLocalProjects, localProjects, archivedProjects,
    callSheetStore, setCallSheetStore, riskAssessmentStore, setRiskAssessmentStore,
    contractDocStore, setContractDocStore, projectEstimates, setProjectEstimates,
    projectNotes, setProjectNotes,
    getProjectCastingTables, setProjectCasting,
    projectInfo, setProjectInfo,
    projectCreativeLinks, setProjectCreativeLinks,
    projectFileStore, setProjectFileStore,
    projectActuals, setProjectActuals,
    setSelectedProject, setProjectSection, selectedProject,
    csDuplicateModal, setCsDuplicateModal, csDuplicateSearch, setCsDuplicateSearch,
    raDuplicateModal, setRaDuplicateModal, raDuplicateSearch, setRaDuplicateSearch,
    duplicateModal, setDuplicateModal, duplicateSearch, setDuplicateSearch,
    cpsStore, setCpsStore, shotListStore, setShotListStore,
    storyboardStore, setStoryboardStore, postProdStore, setPostProdStore,
    castingDeckStore, setCastingDeckStore, castingTableStore, setCastingTableStore,
    fittingStore, setFittingStore, locDeckStore, setLocDeckStore,
    recceReportStore, setRecceReportStore, dietaryStore, setDietaryStore,
    travelItineraryStore, setTravelItineraryStore,
    showArchive, setShowArchive, archive, setArchive, restoreItem, permanentlyDelete,
    showTimeoutWarning, setShowTimeoutWarning,
    _modal, _closeModal, _modalInputRef,
    undoToastMsg, mobileMenuOpen, setMobileMenuOpen};

                            return (
                              <div key={s.id} style={{marginBottom:6,borderRadius:12,border:`1px solid ${T.border}`,background:"#fafafa",overflow:"hidden"}}>
                                <div onClick={()=>setSopEditId(prev=>prev===("view_"+s.id)?null:("view_"+s.id))} style={{display:"flex",alignItems:"center",padding:"12px 14px",cursor:"pointer",gap:10}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</div>
                                    <div style={{fontSize:11,color:T.muted,marginTop:2,display:"flex",alignItems:"center",gap:8}}>
                                      {agentDef&&<span style={{background:agentDef.tagBg,color:agentDef.accent,padding:"1px 8px",borderRadius:999,fontSize:10,fontWeight:600}}>{agentDef.name}</span>}
                                      <span>Updated {new Date(s.updated_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                                    <button onClick={()=>{setSopEditId(s.id);setSopDraft({title:s.title,content:s.content,category:s.category,agent:s.agent||""});setSopAddOpen(false);setSopPreview(false);}} style={{background:"none",border:"none",color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#f0f0f5"} onMouseOut={e=>e.currentTarget.style.background="none"}>Edit</button>
                                    <button onClick={()=>{if(window.confirm("Delete this SOP?"))setSops(prev=>prev.filter(x=>x.id!==s.id));}} style={{background:"none",border:"none",color:"#c0392b",fontSize:11,fontWeight:600,cursor:"pointer",padding:"3px 8px",borderRadius:6,fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.background="#fff0f0"} onMouseOut={e=>e.currentTarget.style.background="none"}>Delete</button>
                                  </div>
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{transform:isExpanded?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}}><path d="M2 3.5L5 6.5L8 3.5" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                {isExpanded&&(
                                  <div style={{padding:"0 14px 14px",borderTop:`1px solid ${T.border}`}}>
                                    <div style={{paddingTop:12}} dangerouslySetInnerHTML={{__html:renderSopMarkdown(s.content)}}/>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    };
                    return <>{renderGroup("Agent Guides",agents)}{renderGroup("Workflows",workflows)}</>;
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        </div>
      </div>

      {isMobile&&mobileMenuOpen&&<MobileMenu {..._mp}/>}

      {selectedLead&&<LeadModal {..._mp}/>}

      {selectedOutreach&&<OutreachModal {..._mp}/>}

      {pendingProjectTask&&<ProjectPickerModal {..._mp}/>}

      {pendingDragToProject&&<DragToProjectModal {..._mp}/>}

      {selectedTodo&&<TodoModal {..._mp}/>}

      {showAddProject&&<AddProjectModal {..._mp}/>}

      {showFromTemplate&&<FromTemplateModal {..._mp}/>}

      {showAddLead&&<AddLeadModal {..._mp}/>}

      {showAddVendor&&<AddVendorModal {..._mp}/>}

      {showRateModal&&<RateCardModal {..._mp}/>}

      {editVendor&&<EditVendorModal {..._mp}/>}

      {showCatManager&&<CategoryManagerModal {..._mp}/>}



      {csDuplicateModal&&<DuplicateCallSheetModal {..._mp}/>}

      {raDuplicateModal&&<DuplicateRAModal {..._mp}/>}

      {duplicateModal&&<GenericDuplicateModal {..._mp}/>}

      {showArchive&&<ArchiveModal {..._mp}/>}
      {showTimeoutWarning&&<TimeoutWarning showTimeoutWarning={showTimeoutWarning} setShowTimeoutWarning={setShowTimeoutWarning}/>}
      {_modal.show&&<GlobalAlertModal _modal={_modal} _closeModal={_closeModal} _modalInputRef={_modalInputRef}/>}
      {undoToastMsg&&<UndoToast undoToastMsg={undoToastMsg}/>}
    </div>
  );
}
