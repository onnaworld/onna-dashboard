import React, { createContext, useContext, useState, useEffect } from "react";

const ProjectContext = createContext(null);

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
};

export function ProjectProvider({ idbGet, idbSet, debouncedDocSave, children }) {
  // ── Project Navigation ──
  const [selectedProject,setSelectedProject]             = useState(null);
  const [projectSection,setProjectSection]               = useState("Home");
  const [creativeSubSection,setCreativeSubSection]       = useState(null);
  const [budgetSubSection,setBudgetSubSection]           = useState(null);
  const [invoiceTab,setInvoiceTab]                       = useState("invoices");
  const [previewFile,setPreviewFile]                     = useState(null);
  const [quoteSearchTerm,setQuoteSearchTerm]             = useState("");
  const [invoiceSearchTerm,setInvoiceSearchTerm]         = useState("");
  const [creativeSearchTerm,setCreativeSearchTerm]       = useState("");
  const [castFileSearchTerm,setCastFileSearchTerm]       = useState("");
  const [styleSearchTerm,setStyleSearchTerm]             = useState("");
  const [documentsSubSection,setDocumentsSubSection]     = useState(null);
  const [scheduleSubSection,setScheduleSubSection]       = useState(null);
  const [travelSubSection,setTravelSubSection]           = useState(null);
  const [permitsSubSection,setPermitsSubSection]         = useState(null);
  const [stylingSubSection,setStylingSubSection]         = useState(null);
  const [locSubSection,setLocSubSection]                 = useState(null);
  const [castingSubSection,setCastingSubSection]         = useState(null);

  // ── Project Files / Links / Uploads ──
  const [linkUploading,setLinkUploading]                 = useState(false);
  const [linkUploadProgress,setLinkUploadProgress]       = useState(null);
  const [projectEntries,setProjectEntries]               = useState({});
  const [aiMsg,setAiMsg]                                 = useState("");
  const [aiLoading,setAiLoading]                         = useState(false);
  const [attachedFile,setAttachedFile]                   = useState(null);
  const [projectFiles,setProjectFiles]                   = useState({});
  const [projectFileStore,setProjectFileStore]           = useState({});
  const [fileStoreReady,setFileStoreReady]               = useState(false);
  const [projectLocLinks,setProjectLocLinks]             = useState({});
  const [projectCreativeLinks,setProjectCreativeLinks]   = useState(()=>{try{const s=localStorage.getItem('onna_creative_links');return s?JSON.parse(s):{}}catch{return {}}});

  // ── IndexedDB load/persist for projectFileStore ──
  useEffect(()=>{idbGet("projectFileStore").then(d=>{if(d)setProjectFileStore(d);setFileStoreReady(true);}).catch(()=>setFileStoreReady(true));},[]);
  useEffect(()=>{if(fileStoreReady)idbSet("projectFileStore",projectFileStore).catch(()=>{});},[projectFileStore,fileStoreReady]);

  // ── localStorage persist for projectCreativeLinks ──
  useEffect(()=>{try{localStorage.setItem('onna_creative_links',JSON.stringify(projectCreativeLinks))}catch{} debouncedDocSave('creative_links',projectCreativeLinks);},[projectCreativeLinks]);

  // ── Helpers ──
  const getProjectFiles    = (id,key) => (projectFiles[id]||{})[key]||[];
  const addProjectFiles    = (id,key,newFiles) => setProjectFiles(prev=>({...prev,[id]:{...(prev[id]||{}),[key]:[...((prev[id]||{})[key]||[]),...newFiles]}}));

  const value = {
    selectedProject,setSelectedProject,
    projectSection,setProjectSection,
    creativeSubSection,setCreativeSubSection,
    budgetSubSection,setBudgetSubSection,
    invoiceTab,setInvoiceTab,
    previewFile,setPreviewFile,
    quoteSearchTerm,setQuoteSearchTerm,
    invoiceSearchTerm,setInvoiceSearchTerm,
    creativeSearchTerm,setCreativeSearchTerm,
    castFileSearchTerm,setCastFileSearchTerm,
    styleSearchTerm,setStyleSearchTerm,
    documentsSubSection,setDocumentsSubSection,
    scheduleSubSection,setScheduleSubSection,
    travelSubSection,setTravelSubSection,
    permitsSubSection,setPermitsSubSection,
    stylingSubSection,setStylingSubSection,
    locSubSection,setLocSubSection,
    castingSubSection,setCastingSubSection,
    linkUploading,setLinkUploading,
    linkUploadProgress,setLinkUploadProgress,
    projectEntries,setProjectEntries,
    aiMsg,setAiMsg,
    aiLoading,setAiLoading,
    attachedFile,setAttachedFile,
    projectFiles,setProjectFiles,
    projectFileStore,setProjectFileStore,
    fileStoreReady,setFileStoreReady,
    projectLocLinks,setProjectLocLinks,
    projectCreativeLinks,setProjectCreativeLinks,
    getProjectFiles,addProjectFiles,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
