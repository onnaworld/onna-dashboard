import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { migrateContract } from "../components/agents/ContractCody";

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
  const [activeCSVersion,setActiveCSVersion]             = useState(null);

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
