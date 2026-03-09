import { api, LEAD_CATEGORIES, VENDORS_CATEGORIES } from "../utils/helpers";

// ── Outreach AI processing ───────────────────────────────────────────────────

const _aiSystem = `Extract contact info and return ONLY a raw JSON array with no markdown. Each item: {"company":"","clientName":"","role":"","email":"","phone":"","date":"YYYY-MM-DD","category":"","location":"","source":"Cold Outreach","notes":""}. Use location format like "Dubai, UAE" or "London, UK". If no date, use today's date.`;

export const processOutreach = async (outreachMsg, setOutreachLoading, setOutreach, setOutreachMsg) => {
  if (!outreachMsg.trim()) return;
  setOutreachLoading(true);
  try {
    const data = await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:800,system:_aiSystem,messages:[{role:"user",content:outreachMsg}]});
    const parsed = JSON.parse((data?.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
    const entries = (Array.isArray(parsed)?parsed:[parsed]).map(e=>({...e,status:"not_contacted",value:0}));
    const saved = await Promise.all(entries.map(e=>api.post("/api/outreach",e)));
    const newOutreach = saved.filter(e=>e.id);
    setOutreach(prev=>[...prev,...newOutreach]);
    setOutreachMsg("");
  } catch {}
  setOutreachLoading(false);
};

// ── Promote lead to client ───────────────────────────────────────────────────

export const promoteToClient = async (entity, localClients, setLocalClients) => {
  const company = (entity.company||"").trim();
  if (!company) return;
  if (localClients.some(c=>(c.company||"").toLowerCase()===company.toLowerCase())) return;
  const newClient = {
    company,
    name: entity.contact||entity.clientName||"",
    email: entity.email||"",
    phone: entity.phone||"",
    country: entity.location||"",
    category: entity.category||"",
    role: entity.role||"",
    value: entity.value||"",
    date: entity.date||"",
    source: entity.source||"",
    notes: entity.notes||"",
  };
  const saved = await api.post("/api/clients", newClient);
  if (saved.id) setLocalClients(prev=>[...prev,saved]);
};

// ── Dynamic dropdown helpers ─────────────────────────────────────────────────

export const addNewOption = async (currentList, setter, storageKey, prompt_label, showPrompt) => {
  const val = await showPrompt(prompt_label);
  if (!val || !val.trim()) return null;
  const trimmed = val.trim();
  if (currentList.includes(trimmed)) return trimmed;
  const updated = [...currentList, trimmed];
  setter(updated);
  try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
  return trimmed;
};

export const pruneCustom = (items, fieldName, customList, setter, storageKey) => {
  const used = new Set(items.map(i=>i[fieldName]).filter(Boolean));
  const pruned = customList.filter(opt=>used.has(opt));
  if (pruned.length !== customList.length) {
    setter(pruned);
    try { localStorage.setItem(storageKey, JSON.stringify(pruned)); } catch {}
  }
};

// ── Category manager ─────────────────────────────────────────────────────────

export const deleteCat = async (type, cat, setCatSaving, setters) => {
  const { localLeads, vendors, setLocalLeads, setVendors, customLeadCats, customVendorCats, setCustomLeadCats, setCustomVendorCats, setHiddenLeadBuiltins, setHiddenVendorBuiltins } = setters;
  setCatSaving(true);
  const isLead = type === 'lead';
  const builtin = isLead ? LEAD_CATEGORIES.includes(cat) : VENDORS_CATEGORIES.includes(cat);
  const records = isLead ? localLeads : vendors;
  const affected = records.filter(r => r.category === cat);
  for (const r of affected) {
    const {id, ...fields} = r;
    try {
      if (isLead) {
        await api.put(`/api/leads/${id}`, {...fields, category:'', value:Number(fields.value)||0});
        setLocalLeads(prev => prev.map(x => x.id===id ? {...x,category:''} : x));
      } else {
        await api.put(`/api/vendors/${id}`, {...fields, category:''});
        setVendors(prev => prev.map(x => x.id===id ? {...x,category:''} : x));
      }
    } catch {}
  }
  if (builtin) {
    const key = isLead ? 'onna_hidden_lead_cats' : 'onna_hidden_vendor_cats';
    const setter = isLead ? setHiddenLeadBuiltins : setHiddenVendorBuiltins;
    setter(prev => { const u=[...prev,cat]; try{localStorage.setItem(key,JSON.stringify(u));}catch{} return u; });
  } else {
    if (isLead) {
      const u = customLeadCats.filter(c=>c!==cat);
      setCustomLeadCats(u); try{localStorage.setItem('onna_lead_cats',JSON.stringify(u));}catch{}
    } else {
      const u = customVendorCats.filter(c=>c!==cat);
      setCustomVendorCats(u); try{localStorage.setItem('onna_vendor_cats',JSON.stringify(u));}catch{}
    }
  }
  setCatSaving(false);
};

export const renameCat = async (type, oldCat, newCat, setCatSaving, setCatEdit, setters) => {
  const { localLeads, vendors, setLocalLeads, setVendors, customLeadCats, customVendorCats, setCustomLeadCats, setCustomVendorCats } = setters;
  if (!newCat.trim() || newCat.trim()===oldCat) { setCatEdit(null); return; }
  setCatSaving(true);
  const isLead = type === 'lead';
  const records = isLead ? localLeads : vendors;
  const affected = records.filter(r => r.category === oldCat);
  for (const r of affected) {
    const {id, ...fields} = r;
    try {
      if (isLead) {
        await api.put(`/api/leads/${id}`, {...fields, category:newCat.trim(), value:Number(fields.value)||0});
        setLocalLeads(prev => prev.map(x => x.id===id ? {...x,category:newCat.trim()} : x));
      } else {
        await api.put(`/api/vendors/${id}`, {...fields, category:newCat.trim()});
        setVendors(prev => prev.map(x => x.id===id ? {...x,category:newCat.trim()} : x));
      }
    } catch {}
  }
  if (isLead) {
    const u = customLeadCats.map(c=>c===oldCat?newCat.trim():c);
    setCustomLeadCats(u); try{localStorage.setItem('onna_lead_cats',JSON.stringify(u));}catch{}
  } else {
    const u = customVendorCats.map(c=>c===oldCat?newCat.trim():c);
    setCustomVendorCats(u); try{localStorage.setItem('onna_vendor_cats',JSON.stringify(u));}catch{}
  }
  setCatEdit(null); setCatSaving(false);
};
