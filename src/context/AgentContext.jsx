import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { migrateContract } from "../components/agents/ContractCody";
import { seedDocSaveSnapshot } from "../utils/helpers";

const AgentContext = createContext(null);

export const useAgentStore = () => {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgentStore must be used within AgentProvider");
  return ctx;
};

const CONTRACT_TYPES_DEFAULT = "Commissioning Agreement – Self Employed";

export function AgentProvider({ debouncedDocSave, children }) {
  // ── Duplicate / Create modals ──
  const [csDuplicateModal,setCsDuplicateModal]           = useState(null);
  const [csDuplicateSearch,setCsDuplicateSearch]         = useState("");
  const [raDuplicateModal,setRaDuplicateModal]           = useState(null);
  const [raDuplicateSearch,setRaDuplicateSearch]         = useState("");
  const [csCreateMenuDocs,setCsCreateMenuDocs]           = useState(false);
  const [createMenuOpen,setCreateMenuOpen]               = useState({});
  const [duplicateModal,setDuplicateModal]               = useState(null);
  const [duplicateSearch,setDuplicateSearch]              = useState("");

  // ── Project contracts ──
  const [projectContracts,setProjectContracts]           = useState({});

  // ── Call Sheets ──
  const [callSheetStore,setCallSheetStore]               = useState(()=>{try{const s=localStorage.getItem('onna_callsheets');if(!s)return {};const d=JSON.parse(s);Object.keys(d).forEach(k=>{if(d[k]&&!Array.isArray(d[k])){d[k]=[{id:Date.now(),label:"Day 1",...d[k]}];}});return d;}catch{return {}}});
  const [activeCSVersion,setActiveCSVersion]             = useState(()=>{
    try {
      const saved = JSON.parse(localStorage.getItem('onna_active_cs')||"null");
      if (!saved) return null;
      const parts = window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);
      if (parts[0]!=="projects" || parts[1]!==saved.pid || parts[3]!=="callsheet") return null;
      const store = JSON.parse(localStorage.getItem('onna_callsheets')||"{}");
      const arr = store[saved.pid];
      if (!Array.isArray(arr)) return null;
      const idx = arr.findIndex(cs=>cs.id===saved.csId);
      return idx>=0 ? idx : null;
    } catch { return null; }
  });
  useEffect(()=>{
    try {
      const parts = window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);
      if (parts[0]!=="projects" || parts[3]!=="callsheet") return;
      if (activeCSVersion===null) { localStorage.removeItem('onna_active_cs'); return; }
      const pid = parts[1];
      const cs = (callSheetStore[pid]||[])[activeCSVersion];
      if (cs) localStorage.setItem('onna_active_cs', JSON.stringify({pid, csId:cs.id}));
    } catch {}
  },[activeCSVersion, callSheetStore]);

  // ── Risk Assessments ──
  const [riskAssessmentStore,setRiskAssessmentStore]     = useState(()=>{try{const s=localStorage.getItem('onna_riskassessments');if(!s)return {};const d=JSON.parse(s);Object.keys(d).forEach(k=>{if(d[k]&&!Array.isArray(d[k])){d[k]=[{id:Date.now(),label:"Risk Assessment",...d[k]}];}});return d;}catch{return {}}});
  const [activeRAVersion,setActiveRAVersion]             = useState(null);

  // ── Contracts doc ──
  const [contractDocStore,setContractDocStore]           = useState(()=>{try{const s=localStorage.getItem('onna_contracts_doc');if(!s)return {};const d=JSON.parse(s);Object.keys(d).forEach(k=>{if(d[k]&&!Array.isArray(d[k])){d[k]=[{id:Date.now(),label:"Version 1",...d[k]}];}if(Array.isArray(d[k])){d[k]=d[k].map(c=>migrateContract(c));}});return d;}catch{return {}}});
  const [activeContractVersion,setActiveContractVersion] = useState(null);

  // ── CPS (Call / Production Schedule) ──
  const [cpsStore,setCpsStore]                           = useState(()=>{try{const s=localStorage.getItem('onna_cps');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeCPSVersion,setActiveCPSVersion]           = useState(null);
  const [cpsShareUrl,setCpsShareUrl]                     = useState(null);
  const [cpsShareLoading,setCpsShareLoading]             = useState(false);
  const [cpsShareTabs,setCpsShareTabs]                   = useState(new Set(["schedule","timeline","calendar"]));
  const cpsRef                                           = useRef(null);
  const cpsAutoSyncTimer                                 = useRef(null);
  const [cpsAutoSyncing,setCpsAutoSyncing]               = useState(false);

  // ── Shot Lists ──
  const [shotListStore,setShotListStore]                 = useState(()=>{try{const s=localStorage.getItem('onna_shotlists');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeShotListVersion,setActiveShotListVersion] = useState(null);
  const [slShareUrl,setSlShareUrl]                       = useState(null);
  const [slShareLoading,setSlShareLoading]               = useState(false);
  const slRef                                            = useRef(null);

  // ── Storyboards ──
  const [storyboardStore,setStoryboardStore]             = useState(()=>{try{const s=localStorage.getItem('onna_storyboards');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeStoryboardVersion,setActiveStoryboardVersion] = useState(null);
  const [sbShareUrl,setSbShareUrl]                       = useState(null);
  const [sbShareLoading,setSbShareLoading]               = useState(false);
  const sbRef                                            = useRef(null);

  // ── Recce ──
  const [recceShareUrl,setRecceShareUrl]                 = useState(null);
  const [recceShareLoading,setRecceShareLoading]         = useState(false);
  const [recceReportStore,setRecceReportStore]           = useState(()=>{try{const s=localStorage.getItem('onna_recce_reports');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeRecceVersion,setActiveRecceVersion]       = useState(null);

  // ── Post Production ──
  const [postProdStore,setPostProdStore]                 = useState(()=>{try{const s=localStorage.getItem('onna_postprod');return s?JSON.parse(s):{}}catch{return {}}});
  const [activePostProdVersion,setActivePostProdVersion] = useState(null);
  const [ppShareUrl,setPpShareUrl]                       = useState(null);
  const [ppShareLoading,setPpShareLoading]               = useState(false);
  const ppRef                                            = useRef(null);

  // ── Fittings ──
  const [fittingStore,setFittingStore]                   = useState(()=>{try{const s=localStorage.getItem('onna_fittings');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeFittingVersion,setActiveFittingVersion]   = useState(null);
  const [fitShareLoading,setFitShareLoading]             = useState(false);
  const [fitShareTabs,setFitShareTabs]                   = useState(new Set(["confirmed","options"]));
  const fitDeckRef                                       = useRef(null);

  // ── Location Decks ──
  const [locDeckStore,setLocDeckStore]                   = useState(()=>{try{const s=localStorage.getItem('onna_loc_decks');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeLocDeckVersion,setActiveLocDeckVersion]   = useState(null);
  const [locShareUrl,setLocShareUrl]                     = useState(null);
  const [locShareLoading,setLocShareLoading]             = useState(false);
  const [locShareTabs,setLocShareTabs]                   = useState(new Set(["overview","detail"]));
  const locDeckRef                                       = useRef(null);

  // ── Casting Decks ──
  const [castingDeckStore,setCastingDeckStore]           = useState(()=>{try{const s=localStorage.getItem('onna_casting_decks');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeCastingDeckVersion,setActiveCastingDeckVersion] = useState(null);
  const [castDeckShareUrl,setCastDeckShareUrl]           = useState(null);
  const [castDeckShareLoading,setCastDeckShareLoading]   = useState(false);
  const [castDeckShareTabs,setCastDeckShareTabs]         = useState(new Set(["confirmed","options"]));
  const castDeckRef                                      = useRef(null);

  // ── Casting Tables ──
  const [castingTableStore,setCastingTableStore]         = useState(()=>{try{const s=localStorage.getItem('onna_casting_tables');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeCastingTableVersion,setActiveCastingTableVersion] = useState(null);
  const [ctShareUrl,setCtShareUrl]                       = useState(null);
  const [ctShareLoading,setCtShareLoading]               = useState(false);
  const ctRef                                            = useRef(null);
  const [ctTypeModalOpen,setCtTypeModalOpen]             = useState(false);
  const [ctSignShareUrl,setCtSignShareUrl]               = useState(null);
  const [ctSignShareLoading,setCtSignShareLoading]       = useState(false);

  // ── Travel Itineraries ──
  const [travelItineraryStore,setTravelItineraryStore]   = useState(()=>{try{const s=localStorage.getItem('onna_travel_itineraries');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeTIVersion,setActiveTIVersion]             = useState(null);
  const [tiShowAddMenu,setTiShowAddMenu]                 = useState(false);

  // ── Dietary ──
  const [dietaryStore,setDietaryStore]                   = useState(()=>{try{const s=localStorage.getItem('onna_dietaries');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeDietaryVersion,setActiveDietaryVersion]   = useState(null);
  const [dietaryTab,setDietaryTab]                       = useState("dietary");

  // ── Estimates ──
  const [projectEstimates,setProjectEstimates]           = useState(()=>{try{const s=localStorage.getItem('onna_estimates');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeEstimateVersion,setActiveEstimateVersion] = useState(0);
  const [editingEstimate,setEditingEstimate]             = useState(null);

  // ── Cash Flows ──
  const [cashFlowStore,setCashFlowStore]                 = useState(()=>{try{const s=localStorage.getItem('onna_cashflows');return s?JSON.parse(s):{}}catch{return {}}});
  const [activeCashFlowVersion,setActiveCashFlowVersion] = useState(null);

  // ── Production Briefs ──
  const [productionBriefStore,setProductionBriefStore]   = useState(()=>{try{const s=localStorage.getItem('onna_prod_briefs');return s?JSON.parse(s):{}}catch{return {}}});

  // ── Project Info / Notes ──
  const [projectNotes,setProjectNotes]                   = useState({});
  const [projectInfo,setProjectInfo]                     = useState(()=>{try{const s=localStorage.getItem('onna_project_info');return s?JSON.parse(s):{}}catch{return {}}});
  const projectInfoRef                                   = useRef(projectInfo);

  // ── Actuals tracker ──
  const [actualsTrackerTab,setActualsTrackerTab]         = useState("detail");
  const actualsExpandedRef                               = useRef({});

  // ── Contract generator ──
  const [contractType,setContractType]                   = useState(CONTRACT_TYPES_DEFAULT);
  const [contractFields,setContractFields]               = useState({commissionee:"",individual:"",role:"",fee:"",shootDate:"",deliverables:"",usageRights:"",paymentTerms:"NET 30 days",deadline:"",projectRef:""});
  const [generatedContract,setGeneratedContract]         = useState("");
  const [contractLoading,setContractLoading]             = useState(false);

  // ── Persistence useEffects ──
  // Every store below is initialized straight from localStorage — a cache
  // that can be behind the server (another tab/device saved more recently
  // since this browser last synced). Without seeding the save-effects'
  // change-tracking snapshot with that same initial value first, each save
  // effect's first run on mount sees "no prior snapshot" and treats the
  // (possibly stale) cached value as a brand-new edit, immediately
  // re-uploading it and silently overwriting anything newer the server
  // already had — e.g. a budget estimate version created on another device.
  // This mount-only effect runs before all the save effects below (React
  // runs effects in declaration order on the same commit), so the very
  // first comparison each of them makes is against the value already on
  // screen, not empty — a plain reload becomes a no-op for the server, and
  // only genuine post-load edits get pushed.
  useEffect(() => {
    seedDocSaveSnapshot('callsheets', callSheetStore);
    seedDocSaveSnapshot('riskassessments', riskAssessmentStore);
    seedDocSaveSnapshot('contracts_doc', contractDocStore);
    seedDocSaveSnapshot('cps', cpsStore);
    seedDocSaveSnapshot('shotlists', shotListStore);
    seedDocSaveSnapshot('storyboards', storyboardStore);
    seedDocSaveSnapshot('recce_reports', recceReportStore);
    seedDocSaveSnapshot('postprod', postProdStore);
    seedDocSaveSnapshot('fittings', fittingStore);
    seedDocSaveSnapshot('loc_decks', locDeckStore);
    seedDocSaveSnapshot('casting_decks', castingDeckStore);
    seedDocSaveSnapshot('casting_tables', castingTableStore);
    seedDocSaveSnapshot('travel_itineraries', travelItineraryStore);
    seedDocSaveSnapshot('dietaries', dietaryStore);
    seedDocSaveSnapshot('estimates', projectEstimates);
    seedDocSaveSnapshot('cashflows', cashFlowStore);
    seedDocSaveSnapshot('prod_briefs', productionBriefStore);
    seedDocSaveSnapshot('project_info', projectInfo);
  }, []);
  useEffect(()=>{try{localStorage.setItem('onna_callsheets',JSON.stringify(callSheetStore))}catch{} debouncedDocSave('callsheets',callSheetStore);},[callSheetStore]);
  useEffect(()=>{try{localStorage.setItem('onna_riskassessments',JSON.stringify(riskAssessmentStore))}catch{} debouncedDocSave('riskassessments',riskAssessmentStore);},[riskAssessmentStore]);
  useEffect(()=>{try{localStorage.setItem('onna_cps',JSON.stringify(cpsStore))}catch{} debouncedDocSave('cps',cpsStore);},[cpsStore]);
  useEffect(()=>{try{localStorage.setItem('onna_shotlists',JSON.stringify(shotListStore))}catch{} debouncedDocSave('shotlists',shotListStore);},[shotListStore]);
  useEffect(()=>{try{localStorage.setItem('onna_storyboards',JSON.stringify(storyboardStore))}catch{} debouncedDocSave('storyboards',storyboardStore);},[storyboardStore]);
  useEffect(()=>{try{localStorage.setItem('onna_postprod',JSON.stringify(postProdStore))}catch{} debouncedDocSave('postprod',postProdStore);},[postProdStore]);
  useEffect(()=>{try{localStorage.setItem('onna_casting_tables',JSON.stringify(castingTableStore))}catch{} debouncedDocSave('casting_tables',castingTableStore);},[castingTableStore]);
  useEffect(()=>{try{localStorage.setItem('onna_fittings',JSON.stringify(fittingStore))}catch{} debouncedDocSave('fittings',fittingStore);},[fittingStore]);
  useEffect(()=>{try{localStorage.setItem('onna_loc_decks',JSON.stringify(locDeckStore))}catch{} debouncedDocSave('loc_decks',locDeckStore);},[locDeckStore]);
  useEffect(()=>{try{localStorage.setItem('onna_recce_reports',JSON.stringify(recceReportStore))}catch{} debouncedDocSave('recce_reports',recceReportStore);},[recceReportStore]);
  useEffect(()=>{try{localStorage.setItem('onna_casting_decks',JSON.stringify(castingDeckStore))}catch{} debouncedDocSave('casting_decks',castingDeckStore);},[castingDeckStore]);
  useEffect(()=>{try{localStorage.setItem('onna_contracts_doc',JSON.stringify(contractDocStore))}catch{} debouncedDocSave('contracts_doc',contractDocStore);},[contractDocStore]);
  useEffect(()=>{try{localStorage.setItem('onna_travel_itineraries',JSON.stringify(travelItineraryStore))}catch{} debouncedDocSave('travel_itineraries',travelItineraryStore);},[travelItineraryStore]);
  useEffect(()=>{try{localStorage.setItem('onna_dietaries',JSON.stringify(dietaryStore))}catch{} debouncedDocSave('dietaries',dietaryStore);},[dietaryStore]);
  // ── Keep dietary lists' crew in real-time sync with their linked call sheet ──
  // Used to require clicking "Sync from Call Sheet", and even then only ever
  // pulled in crew that already had a name typed in — a role with no name
  // yet never appeared at all. This effect runs on every call sheet edit
  // (anywhere, not just while the Dietaries page happens to be open) and
  // keeps every linked dietary list's crew list current automatically:
  // every crew slot shows up (by its role/title as a placeholder) as soon
  // as it exists on the call sheet, and once a real name is typed in, it
  // replaces the placeholder on its own. Matching is by slot position
  // (department index : crew index), not by name — specifically so a slot
  // going from "no name yet" to "has a name" is recognized as the same
  // person rather than creating a duplicate. A slotKey is how an entry
  // opts into this: entries added by hand (no slotKey) or moved to "Not On
  // Set" are never touched here. Reads dietaryStore via the functional
  // updater (not as a dependency) so this can't loop on its own writes.
  useEffect(() => {
    setDietaryStore(prev => {
      let changedAny = false;
      const next = { ...prev };
      Object.keys(prev).forEach(pid => {
        const csForProject = callSheetStore[pid] || [];
        const dietArr = prev[pid] || [];
        let projectChanged = false;
        const nextDietArr = dietArr.map(d => {
          if (!d.callSheetId) return d;
          const cs = csForProject.find(c => c.id === d.callSheetId);
          if (!cs) return d;
          const slots = [];
          (cs.departments || []).forEach((dept, di) => {
            (dept.crew || []).forEach((cr, ci) => {
              const hasName = !!(cr.name && cr.name.trim());
              const role = cr.role || "";
              if (!hasName && !role) return; // nothing to show yet
              slots.push({ slotKey: `${di}:${ci}`, displayName: hasName ? cr.name.trim() : role, role, department: dept.name || "" });
            });
          });
          if (slots.length === 0) return d;
          const people = d.people || [];
          const notOnSetSlots = new Set((d.notOnSet || []).filter(pr => pr.slotKey).map(pr => pr.slotKey));
          const knownSlots = new Set(people.filter(pr => pr.slotKey).map(pr => pr.slotKey));
          let changed = false;
          const updatedPeople = people.map(pr => {
            if (!pr.slotKey) return pr;
            const slot = slots.find(s => s.slotKey === pr.slotKey);
            if (!slot) return pr; // that slot no longer exists on the call sheet — leave it
            if (pr.name !== slot.displayName || pr.role !== slot.role || pr.department !== slot.department) {
              changed = true;
              return { ...pr, name: slot.displayName, role: slot.role, department: slot.department };
            }
            return pr;
          });
          const newSlots = slots.filter(s => !knownSlots.has(s.slotKey) && !notOnSetSlots.has(s.slotKey));
          if (newSlots.length > 0) changed = true;
          const addedPeople = newSlots.map(s => ({ id: Date.now() + Math.random(), name: s.displayName, role: s.role, department: s.department, dietary: ["TBC"], allergies: "", notes: "", slotKey: s.slotKey }));
          if (!changed) return d;
          projectChanged = true;
          return { ...d, people: [...updatedPeople, ...addedPeople] };
        });
        if (projectChanged) { changedAny = true; next[pid] = nextDietArr; }
      });
      return changedAny ? next : prev;
    });
  }, [callSheetStore]);
  useEffect(()=>{try{localStorage.setItem('onna_estimates',JSON.stringify(projectEstimates))}catch{} debouncedDocSave('estimates',projectEstimates);},[projectEstimates]);
  useEffect(()=>{try{localStorage.setItem('onna_cashflows',JSON.stringify(cashFlowStore))}catch{} debouncedDocSave('cashflows',cashFlowStore);},[cashFlowStore]);
  useEffect(()=>{try{localStorage.setItem('onna_prod_briefs',JSON.stringify(productionBriefStore))}catch{} debouncedDocSave('prod_briefs',productionBriefStore);},[productionBriefStore]);
  useEffect(()=>{projectInfoRef.current=projectInfo;try{localStorage.setItem('onna_project_info',JSON.stringify(projectInfo))}catch{} debouncedDocSave('project_info',projectInfo);},[projectInfo]);

  const value = {
    // Duplicate / Create modals
    csDuplicateModal,setCsDuplicateModal,csDuplicateSearch,setCsDuplicateSearch,
    raDuplicateModal,setRaDuplicateModal,raDuplicateSearch,setRaDuplicateSearch,
    csCreateMenuDocs,setCsCreateMenuDocs,
    createMenuOpen,setCreateMenuOpen,duplicateModal,setDuplicateModal,duplicateSearch,setDuplicateSearch,
    // Project contracts
    projectContracts,setProjectContracts,
    // Call Sheets
    callSheetStore,setCallSheetStore,activeCSVersion,setActiveCSVersion,
    // Risk Assessments
    riskAssessmentStore,setRiskAssessmentStore,activeRAVersion,setActiveRAVersion,
    // Contracts doc
    contractDocStore,setContractDocStore,activeContractVersion,setActiveContractVersion,
    // CPS
    cpsStore,setCpsStore,activeCPSVersion,setActiveCPSVersion,
    cpsShareUrl,setCpsShareUrl,cpsShareLoading,setCpsShareLoading,
    cpsShareTabs,setCpsShareTabs,cpsRef,cpsAutoSyncTimer,cpsAutoSyncing,setCpsAutoSyncing,
    // Shot Lists
    shotListStore,setShotListStore,activeShotListVersion,setActiveShotListVersion,
    slShareUrl,setSlShareUrl,slShareLoading,setSlShareLoading,slRef,
    // Storyboards
    storyboardStore,setStoryboardStore,activeStoryboardVersion,setActiveStoryboardVersion,
    sbShareUrl,setSbShareUrl,sbShareLoading,setSbShareLoading,sbRef,
    // Recce
    recceShareUrl,setRecceShareUrl,recceShareLoading,setRecceShareLoading,
    recceReportStore,setRecceReportStore,activeRecceVersion,setActiveRecceVersion,
    // Post Production
    postProdStore,setPostProdStore,activePostProdVersion,setActivePostProdVersion,
    ppShareUrl,setPpShareUrl,ppShareLoading,setPpShareLoading,ppRef,
    // Fittings
    fittingStore,setFittingStore,activeFittingVersion,setActiveFittingVersion,
    fitShareLoading,setFitShareLoading,fitShareTabs,setFitShareTabs,fitDeckRef,
    // Location Decks
    locDeckStore,setLocDeckStore,activeLocDeckVersion,setActiveLocDeckVersion,
    locShareUrl,setLocShareUrl,locShareLoading,setLocShareLoading,
    locShareTabs,setLocShareTabs,locDeckRef,
    // Casting Decks
    castingDeckStore,setCastingDeckStore,activeCastingDeckVersion,setActiveCastingDeckVersion,
    castDeckShareUrl,setCastDeckShareUrl,castDeckShareLoading,setCastDeckShareLoading,
    castDeckShareTabs,setCastDeckShareTabs,castDeckRef,
    // Casting Tables
    castingTableStore,setCastingTableStore,activeCastingTableVersion,setActiveCastingTableVersion,
    ctShareUrl,setCtShareUrl,ctShareLoading,setCtShareLoading,ctRef,
    ctTypeModalOpen,setCtTypeModalOpen,ctSignShareUrl,setCtSignShareUrl,
    ctSignShareLoading,setCtSignShareLoading,
    // Travel Itineraries
    travelItineraryStore,setTravelItineraryStore,activeTIVersion,setActiveTIVersion,
    tiShowAddMenu,setTiShowAddMenu,
    // Dietary
    dietaryStore,setDietaryStore,activeDietaryVersion,setActiveDietaryVersion,
    dietaryTab,setDietaryTab,
    // Estimates
    projectEstimates,setProjectEstimates,activeEstimateVersion,setActiveEstimateVersion,
    editingEstimate,setEditingEstimate,
    // Cash Flows
    cashFlowStore,setCashFlowStore,activeCashFlowVersion,setActiveCashFlowVersion,
    // Production Briefs
    productionBriefStore,setProductionBriefStore,
    // Project Info / Notes
    projectNotes,setProjectNotes,projectInfo,setProjectInfo,projectInfoRef,
    // Actuals tracker
    actualsTrackerTab,setActualsTrackerTab,actualsExpandedRef,
    // Contract generator
    contractType,setContractType,contractFields,setContractFields,
    generatedContract,setGeneratedContract,contractLoading,setContractLoading,
  };

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}
