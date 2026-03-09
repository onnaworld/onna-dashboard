import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const UIContext = createContext(null);

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
};

export function UIProvider({ initialTab, initialLgStep, children }) {
  // ── Navigation / Tab ──
  const [activeTab,setActiveTab] = useState(initialTab);
  useEffect(()=>{localStorage.setItem("onna_tab",activeTab);},[activeTab]);

  // ── Mobile ──
  const [isMobile,setIsMobile] = useState(()=>window.innerWidth<768);
  const [mobileMenuOpen,setMobileMenuOpen] = useState(false);
  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<768);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);

  // ── Login ──
  const [lgUser,setLgUser]         = useState("");
  const [lgPass,setLgPass]         = useState("");
  const [lgErr,setLgErr]           = useState("");
  const [lgLoading,setLgLoading]   = useState(false);
  const [lgStep,setLgStep]         = useState(initialLgStep||"login");
  const [lgEmail,setLgEmail]       = useState("");
  const [lgNewPass,setLgNewPass]   = useState("");
  const [lgNewPass2,setLgNewPass2] = useState("");

  // ── Timeout warning ──
  const [showTimeoutWarning,setShowTimeoutWarning] = useState(false);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);

  // ── Sign page ──
  const [signData,setSignData]               = useState(null);
  const [signLoading,setSignLoading]         = useState(false);
  const [signError,setSignError]             = useState("");
  const [signSubmitted,setSignSubmitted]     = useState(false);
  const [signVendorName,setSignVendorName]   = useState("");
  const [signVendorDate,setSignVendorDate]   = useState("");
  const [signVendorSig,setSignVendorSig]     = useState("");
  const [signSubmitting,setSignSubmitting]   = useState(false);

  // ── Vault ──
  const [vaultLocked,setVaultLocked]         = useState(true);
  const [vaultKey,setVaultKey]               = useState(null);
  const [vaultPass,setVaultPass]             = useState("");
  const [vaultErr,setVaultErr]               = useState("");
  const [vaultLoading,setVaultLoading]       = useState(false);
  const [vaultResources,setVaultResources]   = useState([]);
  const [vaultView,setVaultView]             = useState("passwords");
  const [vaultShowPw,setVaultShowPw]         = useState({});
  const [vaultCopied,setVaultCopied]         = useState(null);
  const [vaultSaving,setVaultSaving]         = useState(false);
  const [vaultAddPwOpen,setVaultAddPwOpen]   = useState(false);
  const [vaultEditId,setVaultEditId]         = useState(null);
  const [vaultNewPw,setVaultNewPw]           = useState({name:"",url:"",username:"",password:"",notes:""});
  const [vaultFileRef,setVaultFileRef]       = useState(null);
  const [vaultFileName,setVaultFileName]     = useState("");
  const [vaultFileErr,setVaultFileErr]       = useState("");
  const [vaultPwSearch,setVaultPwSearch]     = useState("");
  const [vaultViewEntry,setVaultViewEntry]   = useState(null);

  // ── Misc UI ──
  const [searches,setSearches]               = useState({});
  const setSearch = (tab,val) => setSearches(p=>({...p,[tab]:val}));
  const getSearch = tab => searches[tab]||"";
  const [selectedLead,setSelectedLead]       = useState(null);
  const [selectedOutreach,setSelectedOutreach] = useState(null);
  const [addContactForm,setAddContactForm]   = useState(null);
  const [undoToastMsg,setUndoToastMsg]       = useState("");

  const value = {
    // Navigation
    activeTab,setActiveTab,
    // Mobile
    isMobile,setIsMobile,mobileMenuOpen,setMobileMenuOpen,
    // Login
    lgUser,setLgUser,lgPass,setLgPass,lgErr,setLgErr,
    lgLoading,setLgLoading,lgStep,setLgStep,lgEmail,setLgEmail,
    lgNewPass,setLgNewPass,lgNewPass2,setLgNewPass2,
    // Timeout
    showTimeoutWarning,setShowTimeoutWarning,timeoutRef,warningRef,
    // Sign page
    signData,setSignData,signLoading,setSignLoading,
    signError,setSignError,signSubmitted,setSignSubmitted,
    signVendorName,setSignVendorName,signVendorDate,setSignVendorDate,
    signVendorSig,setSignVendorSig,signSubmitting,setSignSubmitting,
    // Vault
    vaultLocked,setVaultLocked,vaultKey,setVaultKey,
    vaultPass,setVaultPass,vaultErr,setVaultErr,
    vaultLoading,setVaultLoading,vaultResources,setVaultResources,
    vaultView,setVaultView,vaultShowPw,setVaultShowPw,
    vaultCopied,setVaultCopied,vaultSaving,setVaultSaving,
    vaultAddPwOpen,setVaultAddPwOpen,vaultEditId,setVaultEditId,
    vaultNewPw,setVaultNewPw,vaultFileRef,setVaultFileRef,
    vaultFileName,setVaultFileName,vaultFileErr,setVaultFileErr,
    vaultPwSearch,setVaultPwSearch,vaultViewEntry,setVaultViewEntry,
    // Misc UI
    searches,setSearches,setSearch,getSearch,
    selectedLead,setSelectedLead,selectedOutreach,setSelectedOutreach,
    addContactForm,setAddContactForm,undoToastMsg,setUndoToastMsg,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
