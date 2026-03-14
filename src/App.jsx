import React, { useState, useMemo, useEffect, useRef, useCallback, Fragment, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import Information from "./components/Information";
import Dashboard from "./components/Dashboard";
import Agents from "./components/Agents";
import Vendors from "./components/Vendors";
import Clients from "./components/Clients";
import ProjectsTab from "./components/Projects";
import Finance from "./components/Finance";
import Expenses from "./components/Expenses";
import Resources from "./components/Resources";
import Schedule from "./components/project/Schedule";
import Styling from "./components/project/Styling";
import Casting from "./components/project/Casting";
import Locations from "./components/project/Locations";
import Travel from "./components/project/Travel";
import Documents from "./components/project/Documents";
import Budget from "./components/project/Budget";
import Creative from "./components/project/Creative";
import { buildConnieSystem, applyConniePatch, buildConniePatchMarkers, revertConnieMarker, revertConnieMarkers, ConnieTabBar } from "./components/agents/CallSheetConnie";
import { buildRonnieSystem, applyRonniePatch, buildPatchMarkers, revertMarker, RonnieTabBar } from "./components/agents/RiskAssessmentRonnie";
import { buildBillieSystem, applyBilliePatch } from "./components/agents/BudgetBillie";
import { CONTRACT_INIT, migrateContract, CONTRACT_TYPE_IDS, CONTRACT_TYPE_LABELS, CONTRACT_FIELDS, CONTRACT_DOC_TYPES, GENERAL_TERMS_DOC, buildCodySystem, applyCodyPatch, handleCodyIntent } from "./components/agents/ContractCody";
import { buildCarrieSystem, applyCarriePatch } from "./components/agents/CastingCarrie";
import { handlePerryIntent } from "./components/agents/PostProducerPerry";
import { handleLillieIntent } from "./components/agents/LocationLillie";
import { handlePollyIntent } from "./components/agents/ProducerPolly";
import { handleTabbyIntent } from "./components/agents/TalentTabby";
import { TI_FLIGHT_COLS, TI_CAR_COLS, TI_HOTEL_COLS, TI_ROOMING_COLS, TI_MOVEMENT_COLS, tiMkMove, tiMkDay, TRAVEL_ITINERARY_INIT, handleTinaIntent } from "./components/agents/TravelTina";
import { ProjectProvider, useProject } from "./context/ProjectContext";
import { VendorLeadProvider, useVendorLead } from "./context/VendorLeadContext";
import { AgentProvider, useAgentStore } from "./context/AgentContext";
import { UIProvider, useUI } from "./context/UIContext";
import { TodoProvider, useTodo } from "./context/TodoContext";
import { T, idbGet, idbSet, ensurePdfJs, loadPdfPages, _loadImg, _scanWhiteTop, processDocSignStamp, renderHtmlToDocPages, exportDocPreview, estFmt, estNum, estRowTotal, estSectionTotal, estCalcTotals, PRINT_CLEANUP_CSS, PRINT_CLEANUP_SCRIPT, buildActualsFromEstimate, actualsRowExpenseTotal, actualsRowEffective, actualsSectionExpenseTotal, actualsSectionEffective, actualsSectionZohoTotal, actualsGrandExpenseTotal, actualsGrandEffective, actualsGrandZohoTotal, api, docApi, globalApi, configApi, GCAL_CLIENT_ID, getToken, debouncedDocSave, debouncedGlobalSave, debouncedConfigSave, flushAllSaves, setSaveStatusCallback, LEAD_CATEGORIES, VENDORS_CATEGORIES, BB_LOCATIONS, OUTREACH_STATUSES, OUTREACH_STATUS_LABELS, MONTHS, GCAL_COLORS, PROJECT_SECTIONS, CONTRACT_TYPES, ACTUALS_STATUSES, TAB_SLUGS, SLUG_TO_TAB, SECTION_SLUGS, SLUG_TO_SECTION, buildPath, parseURL, parseICS, levenshtein, findSimilar, findAllSimilar, parseQuickEntry, detectFieldKey, findVendorOrLead, fuzzyMatchProject, exportToPDF, printCallSheetPDF, printRiskAssessmentPDF, downloadCSV, exportTablePDF, exportCastingPDF, buildDocHTML, buildContractHTML, _parseDate, formatDate, getMonthLabel, VAULT_SALT, VAULT_CHECK, vaultDeriveKey, vaultEncrypt, vaultDecrypt, defaultSections, getXContacts, setXContacts, makeDocUpdater } from "./utils/helpers";
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
import CPSPolly, { cpsDefaultPhases } from "./components/docs/CPSPolly";
import ShotListPolly from "./components/docs/ShotListPolly";
import LocationsConnie, { mkLoc, mkDetail } from "./components/docs/LocationsConnie";
import CastingConnie, { CAST_INIT } from "./components/docs/CastingConnie";
import StoryboardPolly, { mkFrame } from "./components/docs/StoryboardPolly";
import PostPolly, { ppMkVideo, ppMkStill, ppDefaultSchedule } from "./components/docs/PostPolly";
import CastingTableConnie, { ctMkRole } from "./components/docs/CastingTableConnie";
import FittingConnie, { mkFitTalent, mkFitFitting } from "./components/docs/FittingConnie";
// Seed data
import { SEED_LEADS, SEED_CLIENTS, SEED_PROJECTS, initVendors, initOutreach, savedCallSheets, savedRiskAssessments } from "./data/initVendors";
// Agent components
import AgentCard from "./components/agents/AgentCard";
import EstimateView from "./components/agents/EstimateView";
// Shared UI components
import { Badge, Pill, StatCard, TH, TD, SearchBar, Sel, OutreachBadge, THFilter, SectionBtn, UploadZone, BtnPrimary, BtnSecondary, BtnExport, renderSopMarkdown, AIDocPanel, DashNotes, ProjectTodoList, LocationPicker, CategoryPicker } from "./components/ui/SharedUI";
// Extracted handler modules
import { doLogin as _doLogin, doResetRequest as _doResetRequest, doResetConfirm as _doResetConfirm, pushNav, changeTab as _changeTab, navigateToDoc as _navigateToDoc, addTodoFromInput as _addTodoFromInput, archiveItem as _archiveItem, restoreItem as _restoreItem, permanentlyDelete as _permanentlyDelete, processProjectAI as _processProjectAI, fetchGCalEvents as _fetchGCalEvents, fetchOutlookCal as _fetchOutlookCal, connectGCal as _connectGCal, doHydrateProject } from "./handlers/projectHandlers";
import { processOutreach as _processOutreach, promoteToClient as _promoteToClient, addNewOption as _addNewOption, pruneCustom, deleteCat as _deleteCat, renameCat as _renameCat } from "./handlers/vendorHandlers";
import { syncProjectInfoToDocs as _syncProjectInfoToDocs, generateContract as _generateContract, getProjectCastingTables as _getProjectCastingTablesFn, getProjectCasting as _getProjectCastingFn, addCastingTable as _addCastingTable, addCastingRow as _addCastingRow, updateCastingRow as _updateCastingRow, removeCastingRow as _removeCastingRow, updateCastingTableTitle as _updateCastingTableTitle, removeCastingTable as _removeCastingTable, uploadFromLink as _uploadFromLink } from "./handlers/documentHandlers";
import { doPushUndo, doPerformUndo, fmtInline, renderAgentMd, sendAgentMessage as _sendAgentMessage } from "./handlers/agentHandlers.jsx";
// Extracted data & components
import { buildFinnSystem, applyFinnPatch } from "./components/agents/FinanceFinn";
import { RISK_ASSESSMENT_INIT } from "./data/riskAssessmentInit";
import { RECCE_RATINGS, RECCE_RATING_C, mkRecceLocation, RECCE_REPORT_INIT, RecceInp, RecceField, RecceImgSlot } from "./data/recceReportInit.jsx";
import { _YELLOW, _PINK, _BLUE, _PURPLE, _GREEN, _ORANGE, _TEAL, _CORAL, _PEACH } from "./components/agents/AgentCharacters";
import { AGENT_DEFS } from "./data/agentDefs";
import SigningPage from "./components/SigningPage";
import Settings from "./components/Settings";
import ProjectSection from "./components/ProjectSection";
import { AppSidebar, Topbar } from "./components/Sidebar";
import { riskSystemPrompt } from "./prompts/risk";
import { callSheetSystemPrompt } from "./prompts/callsheet";
import "./styles/global.css";

// ─── Generic doc updater factory ──────────────────────────────────────────────
// makeDocUpdater moved to helpers.js




// ─── CONSTANTS ────────────────────────────────────────────────────────────────

// ─── STATIC SEED DATA (used as fallback until API loads) ─────────────────────


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

// ─── Extra contacts helpers (imported from helpers.js) ──────────

// _AgentBubble moved to AgentCard.jsx
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


// ─── GLOBAL MODAL SYSTEM (imported from utils/modal.js) ─────────────────────
import { showAlert, showPrompt, closeModal as _closeModal, registerModalSetter } from "./utils/modal";

export default function OnnaDashboard() {
  const _urlReset = new URLSearchParams(window.location.search).get("reset") || "";
  const _initialTab = (()=>{ const parsed = parseURL(window.location.pathname, []); return parsed.tab || localStorage.getItem("onna_tab") || "Dashboard"; })();
  return (
    <UIProvider initialTab={_initialTab} initialLgStep={_urlReset ? "reset" : "login"}>
    <ProjectProvider idbGet={idbGet} idbSet={idbSet} debouncedDocSave={debouncedDocSave}>
    <VendorLeadProvider initVendors={initVendors}>
    <AgentProvider debouncedDocSave={debouncedDocSave}>
    <TodoProvider>
      <OnnaDashboardInner />
    </TodoProvider>
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

  // ── Todo state from TodoContext ──
  const {
    todos, setTodos, projectTodos, setProjectTodos, archivedTodos, setArchivedTodos,
    newTodo, setNewTodo, todoFilter, setTodoFilter, selectedTodo, setSelectedTodo,
    todoDragId, setTodoDragId, pendingProjectTask, setPendingProjectTask,
    pendingDragToProject, setPendingDragToProject,
    dashNotesList, setDashNotesList, dashSelectedNoteId, setDashSelectedNoteId,
    setActiveProjects: setTodoActiveProjects,
    hydrateTodos, hydrateProjectTodos, hydrateDashNotes, markHydrated: markTodoHydrated,
    generalTodos, projectTodosFlat, allProjectTodosFlat, allTodos, filteredTodos, todoTopFilter,
  } = useTodo();

  const [_modal, _setModal] = useState({ show: false, type: "alert", message: "", defaultVal: "" });
  const _modalInputRef = useRef(null);
  useEffect(() => { registerModalSetter(_setModal); return () => { registerModalSetter(null); }; }, []);
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
    const doLogout = ()=>{setShowTimeoutWarning(false);localStorage.removeItem("onna_token");window.location.reload();};
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
    return <SigningPage signData={signData} signLoading={signLoading} signError={signError} signSubmitted={signSubmitted} signVendorName={signVendorName} setSignVendorName={setSignVendorName} signVendorDate={signVendorDate} setSignVendorDate={setSignVendorDate} signVendorSig={signVendorSig} setSignVendorSig={setSignVendorSig} signSubmitting={signSubmitting} setSignSubmitting={setSignSubmitting} setSignSubmitted={setSignSubmitted} _signToken={_signToken} _printMode={_printMode} showAlert={showAlert}/>;
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
    cashFlowStore,setCashFlowStore,activeCashFlowVersion,setActiveCashFlowVersion,
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
  const [newProject,setNewProject]           = useState({client:"",name:"",revenue:"",cost:"",status:"Active",year:new Date().getFullYear(),month:new Date().getMonth()+1});
  const localProjectsRef                      = useRef([]);
  const [localProjects,setLocalProjects]     = useState(()=>{try{const c=localStorage.getItem('onna_cache_projects');return c?JSON.parse(c):[];}catch{return []}});
  const [localClients,setLocalClients]       = useState(()=>{try{const c=localStorage.getItem('onna_cache_clients');return c?JSON.parse(c):[]}catch{return []}});
  const [apiLoading,setApiLoading]           = useState(true);
  const [apiError,setApiError]               = useState(null);

  // ── Notes state ───────────────────────────────────────────────────────────────
  const [notes,setNotes]                     = useState(()=>{try{const c=localStorage.getItem('onna_cache_notes');return c?JSON.parse(c):[];}catch{return [];}});
  const [notesLoading,setNotesLoading]       = useState(false);
  useEffect(()=>{if(!globalHydratedRef.current)return;try{if(notes.length)localStorage.setItem('onna_cache_notes',JSON.stringify(notes));}catch{}},[notes]);

  const [archivedProjects,setArchivedProjects] = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_archived_projects')||'[]')}catch{return []}});

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
  useEffect(()=>{try{localStorage.setItem('onna_archived_projects',JSON.stringify(archivedProjects))}catch{} if(globalHydratedRef.current) debouncedGlobalSave('archive',archivedProjects);},[archivedProjects]);
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
        // Cash Flows
        setCashFlowStore(prev => {
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
      api.get("/api/notes").catch(()=>[]),
    ]).then(async ([projects, leads, clients, vendors, outreach, notesData])=>{
      if (cancelled) return;
      {const projArr=Array.isArray(projects)?projects:[];const deduped=projArr;
        if(!deduped.find(p=>p.client==="TEMPLATE")){const t=await api.post("/api/projects",{client:"TEMPLATE",name:"Template Project",revenue:0,cost:0,status:"Active",year:2026}).catch(()=>null);if(t&&t.id)deduped.unshift(t);}
        if(deduped.length>0){setLocalProjects(deduped);try{localStorage.setItem('onna_cache_projects',JSON.stringify(deduped))}catch{}}}
      if (Array.isArray(leads)    && leads.length > 0)    { setLocalLeads(leads);    try{localStorage.setItem('onna_cache_leads',JSON.stringify(leads))}catch{} }
      if (Array.isArray(vendors)  && vendors.length > 0)  { setVendors(vendors);     try{localStorage.setItem('onna_cache_vendors',JSON.stringify(vendors))}catch{} }
      if (Array.isArray(outreach) && outreach.length > 0) setOutreach(outreach);
      if (Array.isArray(notesData) && notesData.length > 0) { setNotes(notesData); try{localStorage.setItem('onna_cache_notes',JSON.stringify(notesData))}catch{} }

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
          if (gd.todos && gd.todos.length) hydrateTodos(gd.todos);
          if (gd.ptodos && Object.keys(gd.ptodos).length) hydrateProjectTodos(gd.ptodos);
          if (gd.notes_list && Array.isArray(gd.notes_list)) hydrateDashNotes(gd.notes_list);
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
      markTodoHydrated();

    }).catch(()=>setApiLoading(false));
    return ()=>{ cancelled=true; };
  },[authed]);

  // ── Hydrate project doc data from Turso when project opens ──────────────
  const globalHydratedRef = useRef(false);
  const hydratedProjectsRef = useRef(new Set());
  const hydrateProject = useCallback((pid) => {
    return doHydrateProject(pid, { setCallSheetStore, setRiskAssessmentStore, setContractDocStore, setProjectEstimates, setDietaryStore, setTravelItineraryStore, setShotListStore, setStoryboardStore, setFittingStore, setLocDeckStore, setCpsStore, setPostProdStore, setCastingTableStore, setCastingDeckStore, setRecceReportStore, setCashFlowStore, setProjectInfo, setProjectCreativeLinks, setProjectActuals, setProjectCasting });
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
        else if (sec==="Styling") setStylingSubSection(parsed.subSection);
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
            else if (sec==="Styling") setStylingSubSection(state.subSection);
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
            else if (sec==="Styling") setStylingSubSection(parsed.subSection);
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
      cache[p.id]=act?actualsGrandEffective(act):null;
    });
    return cache;
  },[allProjectsMerged,projectActuals]);
  const getEstimateRevenue = (pid) => revenueCache[pid]??null;
  const getProjRevenue = (p) => { const er = revenueCache[p.id]; return er !== null && er !== undefined ? er : p.revenue; };
  const getProjCost = (p) => { const c = costCache[p.id]; return c !== null && c !== undefined ? c : p.cost; };
  // projects2026, rev2026, profit2026, totalPipeline, newCount moved to Finance component
  const activeProjects= allProjectsMerged.filter(p=>p.status==="Active"&&p.client!=="TEMPLATE");
  useEffect(()=>{setTodoActiveProjects(activeProjects);},[activeProjects]);
  // projects, projRev, projProfit, projMargin moved to Projects component

  const _hasLoc = (loc,filter) => {if(!loc)return false;if(loc.includes("|"))return loc.split("|").some(l=>l.trim()===filter);return loc.trim()===filter;};
  const filteredBB = vendors.filter(b=>{const s=getSearch("Vendors")?.toLowerCase();return (bbCat==="All"||b.category===bbCat)&&(bbLocation==="All"||_hasLoc(b.location,bbLocation))&&(!s||[b.name,b.company,b.category,b.location,b.email,b.phone,b.website,b.notes,b.rateCard].some(v=>v&&v.toLowerCase().includes(s)));});

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
  const renderProjectSection = p => <ProjectSection p={p} T={T} isMobile={isMobile} api={api}
    projectEntries={projectEntries} projectFileStore={projectFileStore} setProjectFileStore={setProjectFileStore} projectEstimates={projectEstimates} setProjectEstimates={setProjectEstimates}
    projectInfo={projectInfo} setProjectInfo={setProjectInfo} projectInfoRef={projectInfoRef} syncProjectInfoToDocs={syncProjectInfoToDocs}
    projectTodos={projectTodos} setProjectTodos={setProjectTodos} archivedTodos={archivedTodos} setArchivedTodos={setArchivedTodos}
    dashNotesList={dashNotesList} setDashNotesList={setDashNotesList} dashSelectedNoteId={dashSelectedNoteId} setDashSelectedNoteId={setDashSelectedNoteId}
    projectSection={projectSection} setProjectSection={setProjectSection}
    projectCreativeLinks={projectCreativeLinks} setProjectCreativeLinks={setProjectCreativeLinks}
    projectLocLinks={projectLocLinks} setProjectLocLinks={setProjectLocLinks}
    projectActuals={projectActuals} setProjectActuals={setProjectActuals}
    setLocalProjects={setLocalProjects} setSelectedProject={setSelectedProject}
    creativeSubSection={creativeSubSection} setCreativeSubSection={setCreativeSubSection}
    budgetSubSection={budgetSubSection} setBudgetSubSection={setBudgetSubSection}
    documentsSubSection={documentsSubSection} setDocumentsSubSection={setDocumentsSubSection}
    locSubSection={locSubSection} setLocSubSection={setLocSubSection}
    castingSubSection={castingSubSection} setCastingSubSection={setCastingSubSection}
    stylingSubSection={stylingSubSection} setStylingSubSection={setStylingSubSection}
    travelSubSection={travelSubSection} setTravelSubSection={setTravelSubSection}
    scheduleSubSection={scheduleSubSection} setScheduleSubSection={setScheduleSubSection}
    permitsSubSection={permitsSubSection} setPermitsSubSection={setPermitsSubSection}
    activeCSVersion={activeCSVersion} setActiveCSVersion={setActiveCSVersion}
    activeRAVersion={activeRAVersion} setActiveRAVersion={setActiveRAVersion}
    activeContractVersion={activeContractVersion} setActiveContractVersion={setActiveContractVersion}
    activeDietaryVersion={activeDietaryVersion} setActiveDietaryVersion={setActiveDietaryVersion}
    activeCastingDeckVersion={activeCastingDeckVersion} setActiveCastingDeckVersion={setActiveCastingDeckVersion}
    activeCastingTableVersion={activeCastingTableVersion} setActiveCastingTableVersion={setActiveCastingTableVersion}
    activeLocDeckVersion={activeLocDeckVersion} setActiveLocDeckVersion={setActiveLocDeckVersion}
    activeRecceVersion={activeRecceVersion} setActiveRecceVersion={setActiveRecceVersion}
    activeFittingVersion={activeFittingVersion} setActiveFittingVersion={setActiveFittingVersion}
    activeTIVersion={activeTIVersion} setActiveTIVersion={setActiveTIVersion}
    activeCPSVersion={activeCPSVersion} setActiveCPSVersion={setActiveCPSVersion}
    activeShotListVersion={activeShotListVersion} setActiveShotListVersion={setActiveShotListVersion}
    activeStoryboardVersion={activeStoryboardVersion} setActiveStoryboardVersion={setActiveStoryboardVersion}
    activePostProdVersion={activePostProdVersion} setActivePostProdVersion={setActivePostProdVersion}
    callSheetStore={callSheetStore} setCallSheetStore={setCallSheetStore}
    riskAssessmentStore={riskAssessmentStore} setRiskAssessmentStore={setRiskAssessmentStore}
    contractDocStore={contractDocStore} setContractDocStore={setContractDocStore}
    dietaryStore={dietaryStore} setDietaryStore={setDietaryStore}
    locDeckStore={locDeckStore} setLocDeckStore={setLocDeckStore}
    recceReportStore={recceReportStore} setRecceReportStore={setRecceReportStore}
    castingDeckStore={castingDeckStore} setCastingDeckStore={setCastingDeckStore}
    castingTableStore={castingTableStore} setCastingTableStore={setCastingTableStore}
    fittingStore={fittingStore} setFittingStore={setFittingStore}
    travelItineraryStore={travelItineraryStore} setTravelItineraryStore={setTravelItineraryStore}
    cpsStore={cpsStore} setCpsStore={setCpsStore}
    shotListStore={shotListStore} setShotListStore={setShotListStore}
    storyboardStore={storyboardStore} setStoryboardStore={setStoryboardStore}
    postProdStore={postProdStore} setPostProdStore={setPostProdStore}
    editingEstimate={editingEstimate} setEditingEstimate={setEditingEstimate}
    actualsTrackerTab={actualsTrackerTab} setActualsTrackerTab={setActualsTrackerTab} actualsExpandedRef={actualsExpandedRef}
    invoiceTab={invoiceTab} setInvoiceTab={setInvoiceTab}
    invoiceSearchTerm={invoiceSearchTerm} setInvoiceSearchTerm={setInvoiceSearchTerm}
    quoteSearchTerm={quoteSearchTerm} setQuoteSearchTerm={setQuoteSearchTerm}
    previewFile={previewFile} setPreviewFile={setPreviewFile}
    creativeSearchTerm={creativeSearchTerm} setCreativeSearchTerm={setCreativeSearchTerm}
    castFileSearchTerm={castFileSearchTerm} setCastFileSearchTerm={setCastFileSearchTerm}
    styleSearchTerm={styleSearchTerm} setStyleSearchTerm={setStyleSearchTerm}
    linkUploading={linkUploading} setLinkUploading={setLinkUploading} linkUploadProgress={linkUploadProgress} setLinkUploadProgress={setLinkUploadProgress}
    ctSignShareUrl={ctSignShareUrl} setCtSignShareUrl={setCtSignShareUrl} ctSignShareLoading={ctSignShareLoading} setCtSignShareLoading={setCtSignShareLoading}
    ctTypeModalOpen={ctTypeModalOpen} setCtTypeModalOpen={setCtTypeModalOpen}
    dietaryTab={dietaryTab} setDietaryTab={setDietaryTab}
    csCreateMenuDocs={csCreateMenuDocs} setCsCreateMenuDocs={setCsCreateMenuDocs}
    setCsDuplicateModal={setCsDuplicateModal} setCsDuplicateSearch={setCsDuplicateSearch}
    setRaDuplicateModal={setRaDuplicateModal} setRaDuplicateSearch={setRaDuplicateSearch}
    createMenuOpen={createMenuOpen} setCreateMenuOpen={setCreateMenuOpen} setDuplicateModal={setDuplicateModal} setDuplicateSearch={setDuplicateSearch}
    locShareUrl={locShareUrl} setLocShareUrl={setLocShareUrl} locShareLoading={locShareLoading} setLocShareLoading={setLocShareLoading}
    locShareTabs={locShareTabs} setLocShareTabs={setLocShareTabs} locDeckRef={locDeckRef}
    recceShareUrl={recceShareUrl} setRecceShareUrl={setRecceShareUrl} recceShareLoading={recceShareLoading} setRecceShareLoading={setRecceShareLoading}
    castDeckShareUrl={castDeckShareUrl} setCastDeckShareUrl={setCastDeckShareUrl} castDeckShareLoading={castDeckShareLoading} setCastDeckShareLoading={setCastDeckShareLoading}
    castDeckShareTabs={castDeckShareTabs} setCastDeckShareTabs={setCastDeckShareTabs} castDeckRef={castDeckRef}
    ctShareUrl={ctShareUrl} setCtShareUrl={setCtShareUrl} ctShareLoading={ctShareLoading} setCtShareLoading={setCtShareLoading} ctRef={ctRef}
    fitShareTabs={fitShareTabs} setFitShareTabs={setFitShareTabs} fitShareLoading={fitShareLoading} setFitShareLoading={setFitShareLoading} fitDeckRef={fitDeckRef}
    tiShowAddMenu={tiShowAddMenu} setTiShowAddMenu={setTiShowAddMenu}
    cpsShareUrl={cpsShareUrl} setCpsShareUrl={setCpsShareUrl} cpsShareLoading={cpsShareLoading} setCpsShareLoading={setCpsShareLoading}
    cpsShareTabs={cpsShareTabs} setCpsShareTabs={setCpsShareTabs} cpsRef={cpsRef} cpsAutoSyncing={cpsAutoSyncing}
    slShareUrl={slShareUrl} setSlShareUrl={setSlShareUrl} slShareLoading={slShareLoading} setSlShareLoading={setSlShareLoading} slRef={slRef}
    sbShareUrl={sbShareUrl} setSbShareUrl={setSbShareUrl} sbShareLoading={sbShareLoading} setSbShareLoading={setSbShareLoading} sbRef={sbRef}
    ppShareUrl={ppShareUrl} setPpShareUrl={setPpShareUrl} ppShareLoading={ppShareLoading} setPpShareLoading={setPpShareLoading} ppRef={ppRef}
    archiveItem={archiveItem} pushUndo={pushUndo} pushNav={pushNav} showAlert={showAlert} showPrompt={showPrompt} buildPath={buildPath}
    getProjectFiles={getProjectFiles} addProjectFiles={addProjectFiles} getProjectCastingTables={getProjectCastingTables}
    PROJECT_SECTIONS={PROJECT_SECTIONS} ProjectTodoList={ProjectTodoList}
    EstCell={EstCell} EstimateView={EstimateView} BtnPrimary={BtnPrimary} BtnExport={BtnExport} UploadZone={UploadZone}
    CSLogoSlot={CSLogoSlot} CSAddBtn={CSAddBtn} CSEditField={CSEditField} CSEditTextarea={CSEditTextarea} CSResizableImage={CSResizableImage} CSXbtn={CSXbtn}
    DietaryTagSelect={DietaryTagSelect} SignaturePad={SignaturePad} TICell={TICell} TITableSection={TITableSection}
    CS_FONT={CS_FONT} CS_LS={CS_LS} PRINT_CLEANUP_CSS={PRINT_CLEANUP_CSS}
    CALLSHEET_INIT={CALLSHEET_INIT} DIETARY_INIT={DIETARY_INIT}
    LocationsConnie={LocationsConnie} mkLoc={mkLoc} mkDetail={mkDetail}
    RECCE_REPORT_INIT={RECCE_REPORT_INIT} mkRecceLocation={mkRecceLocation} RECCE_RATINGS={RECCE_RATINGS} RECCE_RATING_C={RECCE_RATING_C}
    RecceInp={RecceInp} RecceField={RecceField} RecceImgSlot={RecceImgSlot}
    CastingConnie={CastingConnie} CastingTableConnie={CastingTableConnie} CAST_INIT={CAST_INIT} ctMkRole={ctMkRole}
    FittingConnie={FittingConnie} mkFitTalent={mkFitTalent} mkFitFitting={mkFitFitting}
    TRAVEL_ITINERARY_INIT={TRAVEL_ITINERARY_INIT} tiMkDay={tiMkDay} tiMkMove={tiMkMove}
    TI_FLIGHT_COLS={TI_FLIGHT_COLS} TI_CAR_COLS={TI_CAR_COLS} TI_HOTEL_COLS={TI_HOTEL_COLS} TI_ROOMING_COLS={TI_ROOMING_COLS} TI_MOVEMENT_COLS={TI_MOVEMENT_COLS}
    CPSPolly={CPSPolly} ShotListPolly={ShotListPolly} StoryboardPolly={StoryboardPolly} PostPolly={PostPolly}
    cpsDefaultPhases={cpsDefaultPhases} mkFrame={mkFrame} ppMkVideo={ppMkVideo} ppMkStill={ppMkStill} ppDefaultSchedule={ppDefaultSchedule}
  />;

  // ── Modal props bundle ──
  const _mp = {T, isMobile, api, BtnPrimary, BtnSecondary, Sel, OutreachBadge, StarIcon, LocationPicker, CategoryPicker,
    activeTab, changeTab, TABS, buildPath, setAuthed,
    selectedLead, setSelectedLead, selectedOutreach, setSelectedOutreach,
    addContactForm, setAddContactForm,
    addNewOption, customLeadCats, setCustomLeadCats, customLeadLocs, setCustomLeadLocs,
    allLeadCats, allLeadLocs, allVendorCats, allVendorLocs,
    customVendorCats, setCustomVendorCats, customVendorLocs, setCustomVendorLocs,
    OUTREACH_STATUSES, OUTREACH_STATUS_LABELS, promoteToClient,
    localLeads, setLocalLeads, setLeadStatusOverrides, setOutreach,
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
    undoToastMsg, setUndoToastMsg, mobileMenuOpen, setMobileMenuOpen};

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  const currentTab = TABS.find(t=>t.id===activeTab)||(activeTab==="Settings"?{id:"Settings",label:"Settings"}:TABS[0]);

  const P = isMobile ? 16 : 28; // main padding

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Arial,sans-serif",color:T.text,display:"flex"}}>
      <style>{`.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.2);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:50;display:flex;align-items:${isMobile?"flex-end":"center"};justify-content:center;}`}</style>

      <AppSidebar T={T} isMobile={isMobile} activeTab={activeTab} TABS={TABS} changeTab={changeTab} buildPath={buildPath} setActiveTab={setActiveTab} setSelectedProject={setSelectedProject} pushNav={pushNav} StarIcon={StarIcon}/>

      {/* ── MAIN ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <Topbar T={T} isMobile={isMobile} P={P} currentTab={currentTab} selectedProject={selectedProject} projectSection={projectSection} creativeSubSection={creativeSubSection} budgetSubSection={budgetSubSection} apiLoading={apiLoading} apiError={apiError} changeTab={changeTab} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>

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

          {activeTab==="Clients"&&<Clients T={T} isMobile={isMobile} api={api} localLeads={localLeads} setLocalLeads={setLocalLeads} localClients={localClients} setLocalClients={setLocalClients} outreach={outreach} setOutreach={setOutreach} localProjects={localProjects} leadStatusOverrides={leadStatusOverrides} customLeadCats={customLeadCats} setCustomLeadCats={setCustomLeadCats} customLeadLocs={customLeadLocs} setCustomLeadLocs={setCustomLeadLocs} allLeadCats={allLeadCats} allLeadLocs={allLeadLocs} addNewOption={addNewOption} getSearch={getSearch} setSearch={setSearch} setSelectedLead={setSelectedLead} setSelectedOutreach={setSelectedOutreach} setShowAddLead={setShowAddLead} downloadCSV={downloadCSV} exportTablePDF={exportTablePDF} formatDate={formatDate} _parseDate={_parseDate} getMonthLabel={getMonthLabel} archiveItem={archiveItem} promoteToClient={promoteToClient} getXContacts={getXContacts} getProjRevenue={getProjRevenue} OUTREACH_STATUS_LABELS={OUTREACH_STATUS_LABELS} OUTREACH_STATUSES={OUTREACH_STATUSES} LEAD_CATEGORIES={LEAD_CATEGORIES} Pill={Pill} SearchBar={SearchBar} Sel={Sel} BtnPrimary={BtnPrimary} BtnSecondary={BtnSecondary} TH={TH} THFilter={THFilter} TD={TD} OutreachBadge={OutreachBadge} LocationPicker={LocationPicker} CategoryPicker={CategoryPicker} setUndoToastMsg={setUndoToastMsg}/>}

          {activeTab==="Projects"&&<ProjectsTab T={T} isMobile={isMobile} api={api} selectedProject={selectedProject} setSelectedProject={setSelectedProject} projectSection={projectSection} setProjectSection={setProjectSection} localProjects={localProjects} setLocalProjects={setLocalProjects} allProjectsMerged={allProjectsMerged} archivedProjects={archivedProjects} setArchivedProjects={setArchivedProjects} saveStatus={saveStatus} setShowFromTemplate={setShowFromTemplate} setEditingEstimate={setEditingEstimate} setCreativeSubSection={setCreativeSubSection} setBudgetSubSection={setBudgetSubSection} setDocumentsSubSection={setDocumentsSubSection} setScheduleSubSection={setScheduleSubSection} setTravelSubSection={setTravelSubSection} setPermitsSubSection={setPermitsSubSection} setStylingSubSection={setStylingSubSection} setCastingSubSection={setCastingSubSection} setActiveCastingDeckVersion={setActiveCastingDeckVersion} setActiveCastingTableVersion={setActiveCastingTableVersion} setActiveCSVersion={setActiveCSVersion} setLocSubSection={setLocSubSection} setActiveRecceVersion={setActiveRecceVersion} renderProjectSection={renderProjectSection} getProjRevenue={getProjRevenue} getProjCost={getProjCost} archiveItem={archiveItem} buildPath={buildPath} pushNav={pushNav} getSearch={getSearch} setSearch={setSearch} PROJECT_SECTIONS={PROJECT_SECTIONS} SearchBar={SearchBar} Pill={Pill} StatCard={StatCard}/>}

          {activeTab==="Finance"&&<Finance T={T} isMobile={isMobile} allProjectsMerged={allProjectsMerged} localLeads={localLeads} getProjRevenue={getProjRevenue} getProjCost={getProjCost} apiLoading={apiLoading} cashFlowStore={cashFlowStore} setCashFlowStore={setCashFlowStore} activeCashFlowVersion={activeCashFlowVersion} setActiveCashFlowVersion={setActiveCashFlowVersion} debouncedDocSave={debouncedDocSave} allProjects={allProjectsMerged} projectEstimates={projectEstimates} projectActuals={projectActuals} SearchBar={SearchBar} Pill={Pill} setUndoToastMsg={setUndoToastMsg}/>}

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
        {activeTab==="Agents"&&<Agents isMobile={isMobile} agentActiveIdx={agentActiveIdx} setAgentActiveIdx={setAgentActiveIdx} AGENT_DEFS={AGENT_DEFS} AgentCard={AgentCard} vendors={vendors} localLeads={localLeads} setVendors={setVendors} setLocalLeads={setLocalLeads} outreach={outreach} setOutreach={setOutreach} callSheetStore={callSheetStore} setCallSheetStore={setCallSheetStore} selectedProject={selectedProject} allProjectsMerged={allProjectsMerged} activeCSVersion={activeCSVersion} dietaryStore={dietaryStore} setDietaryStore={setDietaryStore} riskAssessmentStore={riskAssessmentStore} setRiskAssessmentStore={setRiskAssessmentStore} activeRAVersion={activeRAVersion} setActiveRAVersion={setActiveRAVersion} contractDocStore={contractDocStore} setContractDocStore={setContractDocStore} activeContractVersion={activeContractVersion} setActiveContractVersion={setActiveContractVersion} projectEstimates={projectEstimates} setProjectEstimates={setProjectEstimates} activeEstimateVersion={activeEstimateVersion} setActiveEstimateVersion={setActiveEstimateVersion} projectActuals={projectActuals} setProjectActuals={setProjectActuals} projectCasting={projectCasting} setProjectCasting={setProjectCasting} getProjectCastingTables={getProjectCastingTables} navigateToDoc={navigateToDoc} pushUndo={pushUndo} projectInfoRef={projectInfoRef} archiveItem={archiveItem} setCsDuplicateModal={setCsDuplicateModal} setCsDuplicateSearch={setCsDuplicateSearch} setRaDuplicateModal={setRaDuplicateModal} setRaDuplicateSearch={setRaDuplicateSearch} travelItineraryStore={travelItineraryStore} setTravelItineraryStore={setTravelItineraryStore} castingDeckStore={castingDeckStore} setCastingDeckStore={setCastingDeckStore} fittingStore={fittingStore} setFittingStore={setFittingStore} castingTableStore={castingTableStore} setCastingTableStore={setCastingTableStore} cpsStore={cpsStore} setCpsStore={setCpsStore} shotListStore={shotListStore} setShotListStore={setShotListStore} storyboardStore={storyboardStore} setStoryboardStore={setStoryboardStore} locDeckStore={locDeckStore} setLocDeckStore={setLocDeckStore} recceReportStore={recceReportStore} setRecceReportStore={setRecceReportStore} postProdStore={postProdStore} setPostProdStore={setPostProdStore} syncProjectInfoToDocs={syncProjectInfoToDocs} projectFileStore={projectFileStore} setLocalProjects={setLocalProjects}/>}

        {/* ── INFORMATION TAB ── */}
        {activeTab==="Information"&&<Information T={T} api={api} isMobile={isMobile} notes={notes} setNotes={setNotes} notesLoading={notesLoading} setNotesLoading={setNotesLoading} archiveItem={archiveItem} BtnPrimary={BtnPrimary} BtnSecondary={BtnSecondary} hydrated={globalHydratedRef.current}/>}

        {activeTab==="Settings"&&<Settings T={T} isMobile={isMobile} P={P} setAuthed={setAuthed} settingsSection={settingsSection} setSettingsSection={setSettingsSection} archive={archive} setArchive={setArchive} restoreItem={restoreItem} permanentlyDelete={permanentlyDelete} catEdit={catEdit} setCatEdit={setCatEdit} catEditVal={catEditVal} setCatEditVal={setCatEditVal} catSaving={catSaving} renameCat={renameCat} deleteCat={deleteCat} customLeadCats={customLeadCats} customVendorCats={customVendorCats} hiddenLeadBuiltins={hiddenLeadBuiltins} hiddenVendorBuiltins={hiddenVendorBuiltins} LEAD_CATEGORIES={LEAD_CATEGORIES} VENDORS_CATEGORIES={VENDORS_CATEGORIES} sops={sops} setSops={setSops} sopFilter={sopFilter} setSopFilter={setSopFilter} sopAddOpen={sopAddOpen} setSopAddOpen={setSopAddOpen} sopEditId={sopEditId} setSopEditId={setSopEditId} sopDraft={sopDraft} setSopDraft={setSopDraft} sopPreview={sopPreview} setSopPreview={setSopPreview} AGENT_DEFS={AGENT_DEFS} BtnPrimary={BtnPrimary} BtnSecondary={BtnSecondary} renderSopMarkdown={renderSopMarkdown} localProjects={localProjects} localLeads={localLeads} localClients={localClients} vendors={vendors} outreach={outreach} notes={notes}/>}

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
