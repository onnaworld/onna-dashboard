import { api } from "../utils/helpers";
import { CONTRACT_DOC_TYPES } from "../components/agents/ContractCody";
import { ESTIMATE_INIT, EST_SA_FIELDS } from "../components/ui/DocHelpers";

// ── Sync project info to docs ────────────────────────────────────────────────

export const syncProjectInfoToDocs = (pid, infoOverride, projectInfoRef, localProjectsRef, setCallSheetStore, setRiskAssessmentStore, setContractDocStore, setProjectEstimates) => {
  const info = infoOverride || (projectInfoRef.current||{})[pid];
  if(!info) return;
  // Call Sheets
  setCallSheetStore(prev=>{
    const arr=prev[pid]; if(!arr||!arr.length) return prev;
    let changed=false;
    const next=arr.map(cs=>{
      const c={...cs};
      if(info.shootName && c.shootName!==info.shootName){c.shootName=info.shootName;changed=true;}
      if(info.shootDate && c.date!==info.shootDate){c.date=info.shootDate;changed=true;}
      if(info.shootLocation && c.venueRows){
        const locRow=c.venueRows.find(r=>r.label==="LOCATIONS");
        if(locRow&&locRow.value!==info.shootLocation){c.venueRows=c.venueRows.map(r=>r.label==="LOCATIONS"?{...r,value:info.shootLocation}:r);changed=true;}
      }
      return c;
    });
    return changed?{...prev,[pid]:next}:prev;
  });
  // Risk Assessments
  setRiskAssessmentStore(prev=>{
    const arr=prev[pid]; if(!arr||!arr.length) return prev;
    let changed=false;
    const next=arr.map(ra=>{
      const c={...ra};
      if(info.shootName && c.shootName!==info.shootName){c.shootName=info.shootName;changed=true;}
      if(info.shootDate && c.shootDate!==info.shootDate){c.shootDate=info.shootDate;changed=true;}
      if(info.shootLocation && c.locations!==info.shootLocation){c.locations=info.shootLocation;changed=true;}
      if(info.crewOnSet && c.crewOnSet!==info.crewOnSet){c.crewOnSet=info.crewOnSet;changed=true;}
      return c;
    });
    return changed?{...prev,[pid]:next}:prev;
  });
  // Contracts
  setContractDocStore(prev=>{
    const arr=prev[pid]; if(!arr||!arr.length) return prev;
    let changed=false;
    const next=arr.map(ct=>{
      const type=ct.contractType||"commission_se";
      const typeDef=CONTRACT_DOC_TYPES.find(c=>c.id===type);
      if(!typeDef) return ct;
      const fv={...(ct.fieldValues||{})};
      if(info.usage && fv.usage!==info.usage){fv.usage=info.usage;changed=true;}
      if((type==="talent"||type==="talent_psc")&&info.shootLocation&&fv.venue!==info.shootLocation){fv.venue=info.shootLocation;changed=true;}
      if((type==="talent"||type==="talent_psc")&&info.shootName&&fv.campaign!==info.shootName){fv.campaign=info.shootName;changed=true;}
      return changed?{...ct,fieldValues:fv}:ct;
    });
    return changed?{...prev,[pid]:next}:prev;
  });
  // Budget Estimates
  const proj = (localProjectsRef.current||[]).find(p=>p.id===pid);
  setProjectEstimates(prev=>{
    const arr=prev[pid]; if(!arr||!arr.length) return prev;
    let changed=false;
    const next=arr.map(est=>{
      const ts={...(est.ts||ESTIMATE_INIT.ts)};
      if(proj&&proj.client && ts.client!==proj.client){ts.client=proj.client;changed=true;}
      if(info.shootName && ts.project!==info.shootName){ts.project=info.shootName;changed=true;}
      if(info.usage && ts.usage!==info.usage){ts.usage=info.usage;changed=true;}
      if(info.shootDate && ts.shootDate!==info.shootDate){ts.shootDate=info.shootDate;changed=true;}
      if(info.shootLocation && ts.location!==info.shootLocation){ts.location=info.shootLocation;changed=true;}
      // Services Agreement fields (by index: 3=Campaign, 5=Timetable/ShootDate, 7=Usage)
      const saInit={}; EST_SA_FIELDS.forEach((_f,i)=>{saInit[i]=EST_SA_FIELDS[i].defaultValue;});
      const sa={...(est.saFields||saInit)};
      if(info.shootName && sa[3]!==info.shootName){sa[3]=info.shootName;changed=true;}
      if(info.usage && sa[7]!==info.usage){sa[7]=info.usage;changed=true;}
      if(info.shootDate && sa[5]!==info.shootDate){sa[5]=info.shootDate;changed=true;}
      return changed?{...est,ts,saFields:sa}:est;
    });
    return changed?{...prev,[pid]:next}:prev;
  });
};

// ── Contract generation ──────────────────────────────────────────────────────

export const generateContract = async (p, contractType, contractFields, setContractLoading, setGeneratedContract) => {
  setContractLoading(true); setGeneratedContract("");
  const templates = {
    "Commissioning Agreement – Self Employed":`You are generating a COMMISSIONING AGREEMENT for ONNA. Fill in ALL fields with the provided details and output a complete, professional agreement. Structure:\n\nONNA\nCOMMISSIONING AGREEMENT\n\nCOMMERCIAL TERMS\nCommencement Date: [date]\nCommissioner: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nCommissionee: [commissionee name]\nRole/Services: [role]\nProject: [project]\nDeadline: [deadline]\nFee: [fee]\nPayment Terms: [payment terms]\nDeliverables: [deliverables]\nUsage Rights: [usage rights]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by Commissionee: _______________  Date: ______\n\nGENERAL TERMS\n[Include all standard ONNA general terms: IP assignment, confidentiality, warranties, indemnity, termination, force majeure, governing law — Dubai courts]`,
    "Commissioning Agreement – Via PSC":`Generate a COMMISSIONING AGREEMENT VIA PSC for ONNA. Commercial terms:\n\nONNA\nCOMMISSIONING AGREEMENT – VIA PSC\n\nCOMMERCIAL TERMS\nCommencement Date: [date]\nCommissioner: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nCommissionee (PSC): [commissionee name]\nIndividual: [individual name]\nRole/Services: [role]\nProject: [project]\nDeadline: [deadline]\nFee: [fee]\nPayment Terms: [payment terms]\nDeliverables: [deliverables]\nUsage Rights: [usage rights]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by PSC: _______________  Date: ______\n\nGENERAL TERMS\n[Include all standard PSC terms: IP assignment by PSC and Individual jointly, confidentiality, warranties, joint indemnity, termination, governing law — Dubai]`,
    "Talent Agreement":`Generate a TALENT AGREEMENT for ONNA. Structure:\n\nONNA\nTALENT AGREEMENT – COMMERCIAL TERMS\n\nCommencement Date: [date]\nAgency: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nClient/Brand: [project client]\nTalent Name: [commissionee]\nRole/Services: [role]\nShoot Date: [shoot date]\nFee: [fee]\nPayment Terms: NET 60 days from invoice\nDeliverables/Usage: [usage rights]\nDeadline: [deadline]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by Talent/Agent: _______________  Date: ______\n\nGENERAL TERMS\n[Include: commencement, supply of services, warranties, image waiver, IP assignment, charges/payment, termination, governing law — Dubai/UK]`,
    "Talent Agreement – Via PSC":`Generate a TALENT AGREEMENT VIA PSC for ONNA. Structure:\n\nONNA\nTALENT AGREEMENT VIA PSC – COMMERCIAL TERMS\n\nCommencement Date: [date]\nAgency: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nClient/Brand: [project client]\nPSC Name: [commissionee]\nTalent Name: [individual]\nRole/Services: [role]\nShoot Date: [shoot date]\nFee: [fee]\nDeliverables/Usage: [usage rights]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by PSC: _______________  Date: ______\n\nGENERAL TERMS\n[Include PSC-specific terms: PSC procures talent compliance, joint IP assignment, image waiver, indemnity, payment via PSC, governing law — Dubai/UK]`,
  };
  try {
    const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:2000,system:templates[contractType]||templates["Commissioning Agreement – Self Employed"],messages:[{role:"user",content:`Generate the contract with these details:\nProject: ${p.client} — ${p.name}\nCommissionee: ${contractFields.commissionee}\nIndividual: ${contractFields.individual}\nRole: ${contractFields.role}\nFee: ${contractFields.fee}\nShoot Date: ${contractFields.shootDate}\nDeliverables: ${contractFields.deliverables}\nUsage Rights: ${contractFields.usageRights}\nPayment Terms: ${contractFields.paymentTerms}\nDeadline: ${contractFields.deadline}\nProject Ref: ${contractFields.projectRef}`}]});
    setGeneratedContract(data?.content?.[0]?.text || data?.error || "No output received.");
  } catch(e) { setGeneratedContract("Error: " + e.message); }
  setContractLoading(false);
};

// ── Casting table helpers ────────────────────────────────────────────────────

export const getProjectCastingTables = (id, projectCasting) => {
  const val = projectCasting[id];
  if (!val || (Array.isArray(val) && val.length === 0)) return [{id:1,title:"Casting",rows:[]}];
  if (Array.isArray(val) && val.length > 0 && !val[0].rows) return [{id:1,title:"Casting",rows:val}];
  return val;
};

export const getProjectCasting = (id, projectCasting) => getProjectCastingTables(id, projectCasting).reduce((a,t)=>[...a,...t.rows],[]);

export const addCastingTable = (id, projectCasting, setProjectCasting) => setProjectCasting(prev=>{const tables=getProjectCastingTables(id, projectCasting);return {...prev,[id]:[...tables,{id:Date.now(),title:"Untitled",rows:[]}]};});

export const addCastingRow = (id, tableId, projectCasting, setProjectCasting) => setProjectCasting(prev=>{const tables=getProjectCastingTables(id, projectCasting);return {...prev,[id]:tables.map(t=>t.id===tableId?{...t,rows:[...t.rows,{id:Date.now(),agency:"",name:"",email:"",option:"First Option",notes:"",link:"",headshot:null}]}:t)};});

export const updateCastingRow = (id, tableId, rowId, field, val, projectCasting, setProjectCasting) => setProjectCasting(prev=>{const tables=getProjectCastingTables(id, projectCasting);return {...prev,[id]:tables.map(t=>t.id===tableId?{...t,rows:t.rows.map(r=>r.id===rowId?{...r,[field]:val}:r)}:t)};});

export const removeCastingRow = (id, tableId, rowId, projectCasting, setProjectCasting) => setProjectCasting(prev=>{const tables=getProjectCastingTables(id, projectCasting);return {...prev,[id]:tables.map(t=>t.id===tableId?{...t,rows:t.rows.filter(r=>r.id!==rowId)}:t)};});

export const updateCastingTableTitle = (id, tableId, title, projectCasting, setProjectCasting) => setProjectCasting(prev=>{const tables=getProjectCastingTables(id, projectCasting);return {...prev,[id]:tables.map(t=>t.id===tableId?{...t,title}:t)};});

export const removeCastingTable = (id, tableId, projectCasting, setProjectCasting) => {if(!confirm("Delete this casting table?"))return;setProjectCasting(prev=>{const tables=getProjectCastingTables(id, projectCasting);return {...prev,[id]:tables.filter(t=>t.id!==tableId)};});};

// ── Upload from link ─────────────────────────────────────────────────────────

export const uploadFromLink = (url, category, projectId, setLinkUploading, setLinkUploadProgress, setProjectFileStore, showAlert) => {
  setLinkUploading(true);setLinkUploadProgress(0);
  const xhr=new XMLHttpRequest();
  xhr.open("POST","/api/proxy-download");
  xhr.setRequestHeader("Content-Type","application/json");
  xhr.upload.onprogress=e=>{if(e.lengthComputable)setLinkUploadProgress(Math.round((e.loaded/e.total)*50));};
  xhr.onprogress=e=>{if(e.lengthComputable)setLinkUploadProgress(50+Math.round((e.loaded/e.total)*50));else setLinkUploadProgress(75);};
  xhr.onload=()=>{try{const data=JSON.parse(xhr.responseText);if(data.error)throw new Error(data.error);setLinkUploadProgress(100);const entry={id:Date.now()+Math.random(),name:data.filename,size:data.size,type:data.contentType,data:data.dataUrl,createdAt:Date.now()};setProjectFileStore(prev=>({...prev,[projectId]:{...(prev[projectId]||{}),[category]:[...((prev[projectId]||{})[category]||[]),entry]}}));setTimeout(()=>{setLinkUploading(false);setLinkUploadProgress(null);},800);}catch(e){showAlert("Upload failed: "+e.message);setLinkUploading(false);setLinkUploadProgress(null);}};
  xhr.onerror=()=>{showAlert("Upload failed: network error");setLinkUploading(false);setLinkUploadProgress(null);};
  xhr.send(JSON.stringify({url}));
};
