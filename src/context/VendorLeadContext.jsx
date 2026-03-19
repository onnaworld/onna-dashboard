import React, { createContext, useContext, useState, useEffect } from "react";

const VendorLeadContext = createContext(null);

export const useVendorLead = () => {
  const ctx = useContext(VendorLeadContext);
  if (!ctx) throw new Error("useVendorLead must be used within VendorLeadProvider");
  return ctx;
};

export function VendorLeadProvider({ initVendors, children }) {
  // ── Vendors ──
  const [vendors,setVendors]                         = useState(()=>{try{const c=localStorage.getItem('onna_cache_vendors');return c?JSON.parse(c):initVendors}catch{return initVendors}});
  const [bbCat,setBbCat]                             = useState("All");
  const [bbLocation,setBbLocation]                   = useState("All");
  const [showRateModal,setShowRateModal]              = useState(null);
  const [rateInput,setRateInput]                     = useState("");
  const [editVendor,setEditVendor]                   = useState(null);
  const [newVendor,setNewVendor]                     = useState({name:"",company:"",category:"Locations",email:"",phone:"",website:"",location:"Dubai, UAE",notes:"",rateCard:""});

  // ── Leads ──
  const [newLead,setNewLead]                         = useState({company:"",contact:"",email:"",phone:"",role:"",date:"",source:"Referral",status:"not_contacted",value:"",category:"Production Companies",location:"Dubai, UAE"});
  const [localLeads,setLocalLeads]                   = useState(()=>{try{const c=localStorage.getItem('onna_cache_leads');return c?JSON.parse(c):[]}catch{return []}});
  const [leadStatusOverrides,setLeadStatusOverrides] = useState({});

  // ── Outreach ──
  const [outreach,setOutreach]                       = useState([]);
  const [outreachMsg,setOutreachMsg]                 = useState("");
  const [outreachLoading,setOutreachLoading]         = useState(false);

  // ── Category / Location customisation ──
  const [customLocations,setCustomLocations]         = useState(()=>{try{const cl=JSON.parse(localStorage.getItem('onna_custom_locations')||'[]');if(cl.length)return cl;const ll=JSON.parse(localStorage.getItem('onna_lead_locs')||'[]');const vl=JSON.parse(localStorage.getItem('onna_vendor_locs')||'[]');const merged=[...new Set([...ll,...vl])];if(merged.length){localStorage.setItem('onna_custom_locations',JSON.stringify(merged));}return merged;}catch{return []}});
  const [hiddenBuiltinLocs,setHiddenBuiltinLocs]     = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_hidden_builtin_locs')||'[]')}catch{return []}});
  const [customLeadCats,setCustomLeadCats]           = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_lead_cats')||'[]')}catch{return []}});
  const [customVendorCats,setCustomVendorCats]       = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_vendor_cats')||'[]')}catch{return []}});
  const [hiddenLeadBuiltins,setHiddenLeadBuiltins]   = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_hidden_lead_cats')||'[]')}catch{return []}});
  const [hiddenVendorBuiltins,setHiddenVendorBuiltins] = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_hidden_vendor_cats')||'[]')}catch{return []}});
  const [showCatManager,setShowCatManager]           = useState(false);
  const [catEdit,setCatEdit]                         = useState(null);
  const [catEditVal,setCatEditVal]                   = useState("");
  const [catSaving,setCatSaving]                     = useState(false);

  // ── Persistence ──
  useEffect(()=>{try{if(vendors.length)localStorage.setItem('onna_cache_vendors',JSON.stringify(vendors));}catch{}},[vendors]);

  const value = {
    vendors,setVendors,
    bbCat,setBbCat,bbLocation,setBbLocation,
    showRateModal,setShowRateModal,rateInput,setRateInput,
    editVendor,setEditVendor,newVendor,setNewVendor,
    newLead,setNewLead,localLeads,setLocalLeads,
    leadStatusOverrides,setLeadStatusOverrides,
    outreach,setOutreach,outreachMsg,setOutreachMsg,
    outreachLoading,setOutreachLoading,
    customLocations,setCustomLocations,
    hiddenBuiltinLocs,setHiddenBuiltinLocs,
    customLeadCats,setCustomLeadCats,
    customVendorCats,setCustomVendorCats,
    hiddenLeadBuiltins,setHiddenLeadBuiltins,
    hiddenVendorBuiltins,setHiddenVendorBuiltins,
    showCatManager,setShowCatManager,
    catEdit,setCatEdit,catEditVal,setCatEditVal,catSaving,setCatSaving,
  };

  return <VendorLeadContext.Provider value={value}>{children}</VendorLeadContext.Provider>;
}
