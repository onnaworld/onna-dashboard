import React, { useState, useMemo } from "react";
import BulkActionBar from "./ui/BulkActionBar";
import { normalizeLocation, LOCATION_ALIASES } from "../utils/helpers";

export default function Clients({
  T, isMobile, api,
  // Shared state
  localLeads, setLocalLeads,
  localClients, setLocalClients,
  outreach, setOutreach,
  localProjects,
  leadStatusOverrides,
  customLeadCats, setCustomLeadCats,
  customLocations, setCustomLocations,
  allLeadCats, allLocations, addNewOption,
  // Search helpers
  getSearch, setSearch,
  // Selections / modals
  setSelectedLead, setSelectedOutreach, setShowAddLead,
  // Functions
  downloadCSV, exportTablePDF, formatDate, _parseDate, getMonthLabel,
  archiveItem, promoteToClient, getXContacts, getProjRevenue,
  // Constants
  OUTREACH_STATUS_LABELS, OUTREACH_STATUSES,
  // UI components
  Pill, SearchBar, Sel, BtnPrimary, BtnSecondary, TH, THFilter, TD, OutreachBadge, LocationPicker, CategoryPicker,
  setUndoToastMsg,
}) {
  const showToast = msg => { if(setUndoToastMsg){setUndoToastMsg(msg);setTimeout(()=>setUndoToastMsg(""),3000);} };

  // ── Local state ──
  const [leadsView, setLeadsView] = useState(() => {
    const saved = localStorage.getItem("onna_leads_view");
    // Migrate old tab values to new two-tab system
    if (saved === "outreach" || saved === "leads" || saved === "clients" || saved === "competitors") return "contacts";
    return saved || "dashboard";
  });
  React.useEffect(() => { localStorage.setItem("onna_leads_view", leadsView); }, [leadsView]);

  // Type filter for unified table
  const [typeFilter, setTypeFilter] = useState("all");

  // Shared filters
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterLoc, setFilterLoc] = useState("All");

  // Pagination state
  const [contactPage, setContactPage] = useState(1);
  const [followUpPage, setFollowUpPage] = useState(1);
  const [contactsPage, setContactsPage] = useState(1);

  // Reusable Pager component
  const Pager = ({ page, total, perPage, onChange }) => {
    const pages = Math.ceil(total / perPage);
    if (pages <= 1) return null;
    const btnStyle = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 13, color: T.sub, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 };
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} style={{ ...btnStyle, opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? "default" : "pointer" }}>{"\u2039"}</button>
        <span style={{ fontSize: 12, color: T.muted }}>Page {page} of {pages}</span>
        <button disabled={page >= pages} onClick={() => onChange(page + 1)} style={{ ...btnStyle, opacity: page >= pages ? 0.4 : 1, cursor: page >= pages ? "default" : "pointer" }}>{"\u203A"}</button>
      </div>
    );
  };

  const [outreachSort, setOutreachSort] = useState("az");

  // Bulk select
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const toggleLeadId = id => setSelectedLeadIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const bulkDeleteLeads = async () => {
    if (!window.confirm(`Delete ${selectedLeadIds.size} contacts?`)) return;
    const ids = [...selectedLeadIds];
    for (const id of ids) {
      const l = localLeads.find(x => x.id === id);
      if (l) { archiveItem('leads', l); try { await api.delete(`/api/leads/${id}`); } catch {} }
      else {
        const o = outreach.find(x => x.id === id);
        if (o) { archiveItem('outreach', o); try { await api.delete(`/api/outreach/${id}`); } catch {} }
        else {
          const c = localClients.find(x => x.id === id);
          if (c) { archiveItem('clients', c); try { await api.delete(`/api/clients/${id}`); } catch {} }
        }
      }
    }
    setLocalLeads(prev => prev.filter(l => !selectedLeadIds.has(l.id)));
    setOutreach(prev => prev.filter(o => !selectedLeadIds.has(o.id)));
    setLocalClients(prev => prev.filter(c => !selectedLeadIds.has(c.id)));
    setSelectedLeadIds(new Set());
  };

  // Selected client (detail view)
  const [selectedClient, setSelectedClient] = useState(null);

  // Add Contact modal (unified)
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({company:"",clientName:"",role:"",email:"",phone:"",category:"Production Companies",location:"Dubai, UAE",status:"cold",date:"",value:"",notes:""});

  // ── Drag & drop between type pills ──
  const [dragItem, setDragItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const handleRowDragStart = (l, e) => {
    setDragItem(l);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", l.id);
  };
  const handleRowDragEnd = () => { setDragItem(null); setDropTarget(null); };
  const handlePillDragOver = (tab, e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropTarget(tab); };
  const handlePillDragLeave = () => setDropTarget(null);
  const handlePillDrop = async (tab) => {
    const l = dragItem;
    setDragItem(null); setDropTarget(null);
    if (!l) return;
    const isOutreach = !!l._fromOutreach;
    const isFromClient = !!l._fromClient;
    const apiPath = isFromClient ? `/api/clients/${l.id}` : isOutreach ? `/api/outreach/${l.id}` : `/api/leads/${l.id}`;

    if (tab === "competitor") {
      await api.put(apiPath, { category: "Market Research" });
      if (isFromClient) setLocalClients(prev => prev.map(x => x.id === l.id ? { ...x, category: "Market Research" } : x));
      else if (isOutreach) setOutreach(prev => prev.map(x => x.id === l.id ? { ...x, category: "Market Research" } : x));
      else setLocalLeads(prev => prev.map(x => x.id === l.id ? { ...x, category: "Market Research" } : x));
      showToast(`${l.company} → Competitor`);
    } else if (tab === "lead" || tab === "outreach") {
      const wasCompetitor = _isCompetitor(l);
      const updates = {};
      if (wasCompetitor) updates.category = "Production Companies";
      if (tab === "outreach" && (l.status === "not_contacted")) updates.status = "cold";
      if (Object.keys(updates).length === 0) return;
      await api.put(apiPath, updates);
      if (isFromClient) setLocalClients(prev => prev.map(x => x.id === l.id ? { ...x, ...updates } : x));
      else if (isOutreach) setOutreach(prev => prev.map(x => x.id === l.id ? { ...x, ...updates } : x));
      else setLocalLeads(prev => prev.map(x => x.id === l.id ? { ...x, ...updates } : x));
      showToast(`${l.company} → ${tab === "lead" ? "Lead" : "Outreach"}`);
    }
  };
  const dragRowProps = l => ({
    draggable: true,
    onDragStart: e => handleRowDragStart(l, e),
    onDragEnd: handleRowDragEnd,
  });
  const dropPillProps = tab => ({
    onDragOver: e => handlePillDragOver(tab, e),
    onDragLeave: handlePillDragLeave,
    onDrop: e => { e.preventDefault(); handlePillDrop(tab); },
  });

  // ── Computed values ──
  const allLeadsMerged = localLeads.map(l => leadStatusOverrides[l.id] ? { ...l, status: leadStatusOverrides[l.id] } : l);
  const _outreachKeys = new Set(outreach.map(o => o.company.trim().toLowerCase()));
  const _pureLeads = allLeadsMerged.filter(l => !_outreachKeys.has(l.company.trim().toLowerCase()));
  const _outreachAsLeads = outreach.map(o => ({ id: o.id, _fromOutreach: true, company: o.company, contact: o.clientName, role: o.role, email: o.email, category: o.category, status: o.status, date: o.date, value: o.value, location: o.location, notes: o.notes, phone: o.phone }));
  const _isCompetitor = l => { const c=(l.category||""); return c==="Market Research"||(c.includes("|")&&c.split("|").some(x=>x.trim()==="Market Research")); };

  // For dashboard compatibility
  const allLeadsCombined = [..._pureLeads, ..._outreachAsLeads].filter(l => !_isCompetitor(l));
  const competitorLeads = [..._pureLeads, ..._outreachAsLeads].filter(l => _isCompetitor(l));

  // ── Unified data array with _type tag ──
  const unifiedContacts = useMemo(() => {
    const allFromLeadsOutreach = [..._pureLeads, ..._outreachAsLeads];
    // Track companies already covered by leads/outreach
    const coveredCompanies = new Set(allFromLeadsOutreach.map(l => (l.company || "").trim().toLowerCase()));

    // Pure clients not already in leads/outreach
    const pureClients = localClients
      .filter(c => !coveredCompanies.has((c.company || "").trim().toLowerCase()))
      .map(c => ({ ...c, _fromClient: true, contact: c.name, location: c.country }));

    // Assign _type to each entry
    const tagged = [...allFromLeadsOutreach, ...pureClients].map(entry => {
      let _type;
      if (_isCompetitor(entry)) {
        _type = "competitor";
      } else if (entry.status === "client" || entry._fromClient) {
        _type = "client";
      } else if (entry._fromOutreach && entry.status !== "not_contacted") {
        _type = "outreach";
      } else {
        _type = "lead";
      }
      return { ...entry, _type };
    });

    return tagged;
  }, [localLeads, outreach, localClients, leadStatusOverrides]);

  // Auto-sync unknown locations from data into customLocations (case-insensitive dedup)
  const dataLocations = useMemo(()=>Array.from(new Set([...allLeadsCombined,...outreach].flatMap(l=>(l.location||"").includes("|")?(l.location||"").split("|").map(s=>normalizeLocation(s.trim())).filter(Boolean):[l.location].filter(Boolean).map(normalizeLocation)))),[allLeadsCombined,outreach]);
  React.useEffect(()=>{
    const knownLower = new Set(allLocations.map(l=>l.toLowerCase()));
    const missing = dataLocations.filter(l=>l&&!knownLower.has(l.toLowerCase())&&!LOCATION_ALIASES[l]);
    if(missing.length>0) setCustomLocations(prev=>{const sLower=new Set(prev.map(p=>p.toLowerCase()));const added=missing.filter(m=>!sLower.has(m.toLowerCase()));if(!added.length)return prev;return[...prev,...added];});
  },[dataLocations]); // eslint-disable-line
  // Auto-sync unknown categories from data into customLeadCats (case-insensitive dedup)
  const dataCategories = useMemo(()=>Array.from(new Set([...allLeadsCombined,...outreach].flatMap(l=>(l.category||"").includes("|")?(l.category||"").split("|").map(s=>s.trim()).filter(Boolean):[l.category].filter(Boolean)))),[allLeadsCombined,outreach]);
  React.useEffect(()=>{
    const knownLower = new Set(allLeadCats.map(c=>c.toLowerCase()));
    const missing = dataCategories.filter(c=>c&&!knownLower.has(c.toLowerCase()));
    if(missing.length>0) setCustomLeadCats(prev=>{const sLower=new Set(prev.map(p=>p.toLowerCase()));const added=missing.filter(m=>!sLower.has(m.toLowerCase()));if(!added.length)return prev;return[...prev,...added];});
  },[dataCategories]); // eslint-disable-line

  // ── Filtered unified contacts ──
  const filteredContacts = useMemo(() => {
    const q = getSearch("Contacts").toLowerCase();
    const _hl = (loc,f) => {if(!loc)return false;if(loc.includes("|"))return loc.split("|").some(x=>normalizeLocation(x.trim())===f);return normalizeLocation(loc.trim())===f;};
    const _hc = (cat,f) => {if(!cat)return false;if(cat.includes("|"))return cat.split("|").some(x=>x.trim()===f);return cat.trim()===f;};
    return unifiedContacts
      .filter(l => {
        // Type filter
        if (typeFilter !== "all" && l._type !== typeFilter) return false;
        // Text search
        if (q && ![l.company,l.contact,l.role,l.email,l.phone,l.category,l.location,l.notes].some(v=>v&&v.toLowerCase().includes(q))) return false;
        // Category
        if (filterCat !== "All" && !_hc(l.category, filterCat)) return false;
        // Status
        if (filterStatus !== "All" && l.status !== filterStatus) return false;
        // Location
        if (filterLoc !== "All" && !_hl(l.location, filterLoc)) return false;
        return true;
      })
      .sort((a, b) => outreachSort === "date"
        ? (_parseDate(b.date) || new Date(0)) - (_parseDate(a.date) || new Date(0))
        : outreachSort === "za"
        ? (b.company || "").toLowerCase().localeCompare((a.company || "").toLowerCase())
        : outreachSort === "location"
        ? (a.location || "").toLowerCase().localeCompare((b.location || "").toLowerCase())
        : (a.company || "").toLowerCase().localeCompare((b.company || "").toLowerCase()));
  }, [getSearch("Contacts"), typeFilter, filterCat, filterStatus, filterLoc, outreachSort, unifiedContacts]);

  // Reset table page when filters change
  React.useEffect(() => { setContactsPage(1); }, [typeFilter, filterCat, filterStatus, filterLoc, getSearch("Contacts")]);

  const leadMonths = ["All", ...Array.from(new Set(allLeadsCombined.map(l => getMonthLabel(l.date)).filter(Boolean)))];

  // Type pill colors
  const TYPE_COLORS = { lead: { bg: "#eef4ff", color: "#1a56db" }, client: { bg: "#f3e8ff", color: "#7c3aed" }, outreach: { bg: "#edfaf3", color: "#147d50" }, competitor: { bg: "#fff3e0", color: "#c0392b" } };
  const TYPE_LABELS = { lead: "Lead", client: "Client", outreach: "Outreach", competitor: "Competitor" };

  // Type counts for filter pills
  const typeCounts = useMemo(() => {
    const c = { all: unifiedContacts.length, lead: 0, client: 0, outreach: 0, competitor: 0 };
    unifiedContacts.forEach(l => { if (c[l._type] !== undefined) c[l._type]++; });
    return c;
  }, [unifiedContacts]);

  // Status cycling handler (shared)
  const cycleStatus = async (l, e) => {
    if (e) e.stopPropagation();
    const cur = l.status || "not_contacted";
    const next = OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(cur) + 1) % OUTREACH_STATUSES.length];
    const updates = { status: next };
    if (next === "not_contacted") updates.date = "";

    if (l._fromClient) {
      if (next !== "client") {
        // Demote: create lead, delete client
        const newLead = { company: l.company, contact: l.contact || l.name || "", role: l.role || "", email: l.email || "", phone: l.phone || "", category: l.category || "", location: l.location || l.country || "", status: next, date: l.date || "", value: l.value || "", notes: l.notes || "", source: l.source || "" };
        const saved = await api.post("/api/leads", newLead);
        if (saved?.id) setLocalLeads(prev => [...prev, { ...newLead, id: saved.id }]);
        await api.delete(`/api/clients/${l.id}`);
        setLocalClients(prev => prev.filter(x => x.id !== l.id));
      } else {
        await api.put(`/api/clients/${l.id}`, updates);
        setLocalClients(prev => prev.map(x => x.id === l.id ? { ...x, ...updates } : x));
      }
    } else if (l._fromOutreach) {
      await api.put(`/api/outreach/${l.id}`, updates);
      setOutreach(prev => prev.map(x => x.id === l.id ? { ...x, ...updates } : x));
    } else {
      await api.put(`/api/leads/${l.id}`, updates);
      setLocalLeads(prev => prev.map(x => x.id === l.id ? { ...x, ...updates } : x));
    }

    // Auto-create client record when promoted
    if (next === "client") {
      const comp = (l.company || "").trim().toLowerCase();
      if (!localClients.some(c => (c.company || "").trim().toLowerCase() === comp)) {
        const nc = { company: l.company, name: l.contact || "", email: l.email || "", phone: l.phone || "", category: l.category || "", country: l.location || "", status: "client", notes: l.notes || "", source: l.source || "" };
        const saved = await api.post("/api/clients", nc);
        if (saved?.id) setLocalClients(prev => [...prev, { ...nc, id: saved.id }]);
      }
    }
  };

  // Open row handler
  const openRow = (l) => {
    if (l._fromClient || l._type === "client") {
      // Open client detail view
      setSelectedClient({ ...l, _fromClient: l._fromClient || false, _fromLead: !l._fromClient, _fromOutreach: l._fromOutreach || false, name: l.contact || l.name, country: l.location || l.country });
    } else if (l._fromOutreach) {
      const o = outreach.find(o => o.id === l.id) || { ...l, clientName: l.contact };
      setSelectedOutreach({ ...o, _xContacts: getXContacts('outreach', o.id) });
    } else {
      setSelectedLead({ ...l, _xContacts: getXContacts('lead', l.id) });
    }
  };

  return (
    <div>
      {/* ── Top-level nav: Overview + All Contacts ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        <Pill label="Overview" active={leadsView === "dashboard"} onClick={() => { setLeadsView("dashboard"); setSelectedClient(null); }} />
        <Pill label="All Contacts" active={leadsView === "contacts"} onClick={() => { setLeadsView("contacts"); setSelectedClient(null); }} />
      </div>

      {/* ── OVERVIEW DASHBOARD ── */}
      {leadsView === "dashboard" && (() => {
        const STATUSES = ["not_contacted", "cold", "warm", "open", "client"];
        const COLORS = { not_contacted: "#c0392b", cold: "#6e6e73", warm: "#1a56db", open: "#147d50", client: "#7c3aed" };
        const STATUS_LABELS = OUTREACH_STATUS_LABELS;
        const counts = STATUSES.map(s => allLeadsCombined.filter(l => l.status === s).length);
        const total = counts.reduce((a, b) => a + b, 0) || 1;

        const PAL = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16", "#a78bfa"];

        const stageGroups = STATUSES.map((s, i) => ({ label: STATUS_LABELS[s], count: counts[i], color: COLORS[s] })).filter(g => g.count > 0);

        const _catMap = {}; allLeadsCombined.forEach(l => { if (l.category) { const parts = l.category.includes("|")?l.category.split("|").map(s=>s.trim()):[l.category.trim()]; parts.filter(Boolean).forEach(cat=>{ _catMap[cat]=(_catMap[cat]||0)+1; }); } });
        const catGroups = Object.entries(_catMap).sort((a, b) => b[1] - a[1]).map(([label, count], i) => ({ label, count, color: PAL[i % PAL.length] }));

        const _locMap = {}; allLeadsCombined.forEach(l => { if (l.location) { const parts = l.location.includes("|")?l.location.split("|").map(s=>s.trim()):[l.location.trim()]; parts.filter(Boolean).forEach(loc=>{ const k=loc.split(",")[0].trim(); _locMap[k]=(_locMap[k]||0)+1; }); } });
        const locGroups = Object.entries(_locMap).sort((a, b) => b[1] - a[1]).map(([label, count], i) => ({ label, count, color: PAL[i % PAL.length] }));

        const Donut = ({ title, groups }) => {
          const R = 58, CIR = 2 * Math.PI * R, gt = groups.reduce((a, g) => a + g.count, 0) || 1;
          let o = 0;
          const sg = groups.map(g => { const d = (g.count / gt) * CIR, s = { ...g, d, o }; o += d; return s; });
          return (
            <div style={{ borderRadius: 16, background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "22px 24px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>{title}</div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, flexShrink: 0 }}>
                <svg width={156} height={156} viewBox="0 0 156 156">
                  <circle cx={78} cy={78} r={R} fill="none" stroke={T.borderSub} strokeWidth={22} />
                  {sg.filter(g => g.count > 0).map((g, i) => (
                    <circle key={i} cx={78} cy={78} r={R} fill="none" stroke={g.color} strokeWidth={22}
                      strokeDasharray={`${g.d} ${CIR - g.d}`} strokeDashoffset={-(g.o - (CIR / 4))} />
                  ))}
                  <text x={78} y={74} textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: T.text, fontFamily: "inherit" }}>{gt}</text>
                  <text x={78} y={89} textAnchor="middle" style={{ fontSize: 10, fill: T.muted, fontFamily: "inherit" }}>total</text>
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, overflowY: "auto" }}>
                {sg.map((g, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: g.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: T.sub, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{g.count}</span>
                    <span style={{ fontSize: 11, color: T.muted, minWidth: 28, textAlign: "right" }}>{Math.round((g.count / gt) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        };

        const today = new Date();
        const oneMonthAgo = new Date(today); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const openLead = l => { if (l._fromOutreach) { const o = outreach.find(o => o.id === l.id) || { ...l, clientName: l.contact }; setSelectedOutreach({ ...o, _xContacts: getXContacts('outreach', o.id) }); } else { setSelectedLead({ ...l, _xContacts: getXContacts('lead', l.id) }); } };
        const toContact = allLeadsCombined.filter(l => l.status === "not_contacted");
        const toFollowUp = allLeadsCombined.filter(l => {
          if (l.status === "not_contacted" || l.status === "client") return false;
          const d = _parseDate(l.date); return d && d < oneMonthAgo;
        });
        const pagedContact = toContact.slice((contactPage - 1) * 5, contactPage * 5);
        const pagedFollowUp = toFollowUp.slice((followUpPage - 1) * 5, followUpPage * 5);

        const ReminderCard = ({ lead, showDate }) => (
          <div onClick={() => openLead(lead)} className="row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, cursor: "pointer", marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.company}</div>
              <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.contact || "\u2014"}{lead.category ? ` \u00b7 ${lead.category}` : ""}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <OutreachBadge status={lead.status} onClick={async (e) => { e.stopPropagation(); await cycleStatus(lead, e); }} />
              {showDate && lead.date && <span style={{ fontSize: 10.5, color: T.muted }}>{formatDate(lead.date)}</span>}
            </div>
            {lead.email && <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: T.link, textDecoration: "none", background: "#f0f4ff", padding: "4px 9px", borderRadius: 7, whiteSpace: "nowrap", flexShrink: 0 }}>Email</a>}
          </div>
        );

        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 12 : 18, marginBottom: isMobile ? 14 : 22 }}>
              <Donut title="Conversion" groups={stageGroups} />
              <Donut title="By Category" groups={catGroups} />
              <Donut title="By Location" groups={locGroups} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 18 }}>
              <div style={{ borderRadius: 16, background: T.surface, border: "1px solid " + T.border, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Contact Today</div>
                  <span style={{ fontSize: 11, color: "#c0392b", background: "#fff3e0", padding: "2px 8px", borderRadius: 999, fontWeight: 500 }}>Not yet reached out</span>
                </div>
                {toContact.length === 0 ? <div style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: "24px 0" }}>All leads contacted!</div> : pagedContact.map(l => <ReminderCard key={l.id} lead={l} showDate={false} />)}
                <Pager page={contactPage} total={toContact.length} perPage={5} onChange={setContactPage} />
              </div>
              <div style={{ borderRadius: 16, background: T.surface, border: "1px solid " + T.border, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Follow Up</div>
                  <span style={{ fontSize: 11, color: "#92680a", background: "#fff8e8", padding: "2px 8px", borderRadius: 999, fontWeight: 500 }}>1+ month since contact</span>
                </div>
                {toFollowUp.length === 0 ? <div style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: "24px 0" }}>No follow-ups due yet.</div> : pagedFollowUp.map(l => <ReminderCard key={l.id} lead={l} showDate={true} />)}
                <Pager page={followUpPage} total={toFollowUp.length} perPage={5} onChange={setFollowUpPage} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ALL CONTACTS: Client Detail View ── */}
      {leadsView === "contacts" && selectedClient && (() => {
        const cKey = (selectedClient.company || "").trim().toLowerCase();
        const cProjects = localProjects.filter(p => (p.client || "").trim().toLowerCase() === cKey);
        const cRevenue = cProjects.reduce((a, p) => a + getProjRevenue(p), 0);
        return (
          <div>
            <button onClick={()=>setSelectedClient(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:20,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:16}}>{"‹"}</span> Back to All Contacts
            </button>
            <div style={{borderRadius:20,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",padding:isMobile?20:32}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
                <div>
                  <div style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{selectedClient.company||"Client"}</div>
                  <div style={{fontSize:13,color:T.muted,marginTop:4}}>{[selectedClient.category,selectedClient.country].filter(Boolean).join(" · ")}</div>
                </div>
                <span style={{fontSize:11,padding:"4px 12px",borderRadius:999,background:"#f3e8ff",color:"#7c3aed",fontWeight:600}}>Client</span>
              </div>

              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:14,marginBottom:28}}>
                <div style={{padding:"16px 18px",background:"#fafafa",borderRadius:14}}>
                  <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>Revenue</div>
                  <div style={{fontSize:22,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>AED {cRevenue.toLocaleString()}</div>
                </div>
                <div style={{padding:"16px 18px",background:"#fafafa",borderRadius:14}}>
                  <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>Projects</div>
                  <div style={{fontSize:22,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>{cProjects.length}</div>
                </div>
                {selectedClient.source&&<div style={{padding:"16px 18px",background:"#fafafa",borderRadius:14}}>
                  <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>Source</div>
                  <div style={{fontSize:15,fontWeight:600,color:T.text}}>{selectedClient.source}</div>
                </div>}
              </div>

              {/* Editable fields */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:20}}>
                {[["Company","company"],["Contact Name","name"],["Email","email"],["Phone","phone"]].map(([label,key])=>(
                  <div key={key}>
                    <div style={{fontSize:10,color:T.muted,marginBottom:5,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</div>
                    <input value={selectedClient[key]||""} onChange={e=>setSelectedClient(p=>({...p,[key]:e.target.value}))}
                      style={{width:"100%",padding:"10px 14px",borderRadius:10,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13.5,fontFamily:"inherit"}}/>
                  </div>
                ))}
                <div>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Category</div>
                  <CategoryPicker value={selectedClient.category||""} onChange={v=>setSelectedClient(p=>({...p,category:v}))} options={allLeadCats.filter(c=>c!=="All")} addNewOption={addNewOption} customCats={customLeadCats} setCustomCats={setCustomLeadCats} storageKey="onna_lead_cats"/>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Location</div>
                  <LocationPicker value={selectedClient.country||""} onChange={v=>setSelectedClient(p=>({...p,country:v}))} options={allLocations} addNewOption={addNewOption} customLocs={customLocations} setCustomLocs={setCustomLocations} storageKey="onna_custom_locations"/>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Status</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:4}}>
                    <OutreachBadge status={selectedClient.status||"client"} onClick={()=>{const cur=selectedClient.status||"client";const next=OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(cur)+1)%OUTREACH_STATUSES.length];setSelectedClient(p=>({...p,status:next}));}}/>
                    <span style={{fontSize:11,color:T.muted}}>click to cycle</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={{marginBottom:24}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Notes</div>
                <textarea value={selectedClient.notes||""} onChange={e=>setSelectedClient(p=>({...p,notes:e.target.value}))} rows={5}
                  placeholder="Notes about this client..."
                  style={{width:"100%",padding:"12px 14px",borderRadius:10,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13.5,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
              </div>

              {/* Projects list */}
              {cProjects.length>0&&(
                <div style={{marginBottom:24}}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:8,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Projects</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {cProjects.map(p=>(
                      <div key={p.id} style={{padding:"12px 16px",borderRadius:12,background:"#fafafa",border:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:13.5,fontWeight:600,color:T.text}}>{p.name||p.project||"Untitled"}</div>
                          {p.date&&<div style={{fontSize:11.5,color:T.muted,marginTop:2}}>{p.date}</div>}
                        </div>
                        <div style={{fontSize:13,fontWeight:600,color:T.text}}>AED {getProjRevenue(p).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:16,borderTop:`1px solid ${T.borderSub}`}}>
                <button onClick={async()=>{if(!confirm(`Delete ${selectedClient.company}?`))return;const comp=(selectedClient.company||"").trim().toLowerCase();if(selectedClient._fromClient){archiveItem('clients',selectedClient);try{await api.delete(`/api/clients/${selectedClient.id}`);}catch{}setLocalClients(prev=>prev.filter(x=>x.id!==selectedClient.id));}if(selectedClient._fromLead&&selectedClient._fromOutreach){archiveItem('outreach',selectedClient);try{await api.delete(`/api/outreach/${selectedClient.id}`);}catch{}setOutreach(prev=>prev.filter(x=>x.id!==selectedClient.id));}else if(selectedClient._fromLead){archiveItem('leads',selectedClient);try{await api.delete(`/api/leads/${selectedClient.id}`);}catch{}setLocalLeads(prev=>prev.filter(x=>x.id!==selectedClient.id));}const dupeLeads=localLeads.filter(l=>(l.company||"").trim().toLowerCase()===comp&&l.status==="client");for(const d of dupeLeads){try{await api.put(`/api/leads/${d.id}`,{status:"open"});}catch{}setLocalLeads(prev=>prev.map(x=>x.id===d.id?{...x,status:"open"}:x));}const dupeOutreach=outreach.filter(o=>(o.company||"").trim().toLowerCase()===comp&&o.status==="client");for(const d of dupeOutreach){try{await api.put(`/api/outreach/${d.id}`,{status:"open"});}catch{}setOutreach(prev=>prev.map(x=>x.id===d.id?{...x,status:"open"}:x));}setSelectedClient(null);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",padding:0}}>Delete client</button>
                <div style={{display:"flex",gap:8}}>
                  <BtnSecondary onClick={()=>setSelectedClient(null)}>Cancel</BtnSecondary>
                  <BtnPrimary onClick={async()=>{const {id,_fromClient,_fromLead,_fromOutreach,_type,...fields}=selectedClient;if((selectedClient.status||"client")!=="client"&&_fromClient){const newLead={company:selectedClient.company,contact:selectedClient.name||"",role:selectedClient.role||"",email:selectedClient.email||"",phone:selectedClient.phone||"",category:selectedClient.category||"",location:selectedClient.country||"",status:selectedClient.status,date:selectedClient.date||"",value:selectedClient.value||"",notes:selectedClient.notes||"",source:selectedClient.source||""};const saved=await api.post("/api/leads",newLead);if(saved?.id)setLocalLeads(prev=>[...prev,{...newLead,id:saved.id}]);await api.delete(`/api/clients/${id}`);setLocalClients(prev=>prev.filter(x=>x.id!==id));}else if(_fromLead&&_fromOutreach){await api.put(`/api/outreach/${id}`,{...fields,clientName:fields.name,location:fields.country});setOutreach(prev=>prev.map(x=>x.id===id?{...x,...fields,clientName:fields.name,location:fields.country}:x));}else if(_fromLead){await api.put(`/api/leads/${id}`,{...fields,contact:fields.name,location:fields.country});setLocalLeads(prev=>prev.map(x=>x.id===id?{...x,...fields,contact:fields.name,location:fields.country}:x));}else{await api.put(`/api/clients/${id}`,fields);setLocalClients(prev=>prev.map(c=>c.id===id?selectedClient:c));}showToast("Saved \u2713");setSelectedClient(null);}}>Save Changes</BtnPrimary>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ALL CONTACTS: Unified Table ── */}
      {leadsView === "contacts" && !selectedClient && (
        <div>
          {/* Filter bar */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            <SearchBar value={getSearch("Contacts")} onChange={v => setSearch("Contacts", v)} placeholder="Search contacts…"/>
            <Sel value={typeFilter} onChange={setTypeFilter} options={[
              { value: "all", label: "All Types" },
              { value: "lead", label: "Lead" },
              { value: "client", label: "Client" },
              { value: "outreach", label: "Outreach" },
              { value: "competitor", label: "Competitor" },
            ]} minWidth={130}/>
            <Sel value={filterCat} onChange={setFilterCat} options={allLeadCats.filter(c=>c!=="＋ Add category")} minWidth={170} searchable/>
            <Sel value={filterLoc} onChange={setFilterLoc} options={allLocations.filter(l=>l!=="＋ Add location")} minWidth={170} searchable/>
            <Sel value={filterStatus} onChange={setFilterStatus} options={["All", ...OUTREACH_STATUSES.map(s => ({value:s,label:OUTREACH_STATUS_LABELS[s]}))]} minWidth={130}/>
            <Sel value={outreachSort} onChange={setOutreachSort} options={[
              { value: "date", label: "Most Recent" },
              { value: "az", label: "A → Z" },
              { value: "za", label: "Z → A" },
              { value: "location", label: "Location" },
            ]} minWidth={130}/>
            <span style={{fontSize:12,color:T.muted}}>{filteredContacts.length} contacts</span>
            <button onClick={() => downloadCSV(filteredContacts, [{ key: "company", label: "Company" }, { key: "contact", label: "Contact" }, { key: "role", label: "Role" }, { key: "email", label: "Email" }, { key: "category", label: "Category" }, { key: "_type", label: "Type" }, { key: "status", label: "Status" }, { key: "date", label: "Date" }, { key: "location", label: "Location" }, { key: "notes", label: "Notes" }], "contacts.csv")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>CSV</button>
            <button onClick={() => exportTablePDF(filteredContacts, [{ key: "company", label: "Company" }, { key: "contact", label: "Contact" }, { key: "role", label: "Role" }, { key: "email", label: "Email" }, { key: "category", label: "Category" }, { key: "_type", label: "Type" }, { key: "status", label: "Status" }, { key: "date", label: "Date" }], "All Contacts")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>PDF</button>
            <BtnPrimary onClick={() => setShowAddContact(true)}>+ New</BtnPrimary>
          </div>

          {/* Unified table */}
          <div className="mob-table-wrap" style={{ borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: T.surface, minWidth: isMobile ? 780 : "auto" }}>
              <thead><tr>
                <th style={{padding:"11px 8px",borderBottom:`1px solid ${T.border}`,width:32}}><input type="checkbox" checked={selectedLeadIds.size===filteredContacts.length&&filteredContacts.length>0} onChange={()=>{if(selectedLeadIds.size===filteredContacts.length)setSelectedLeadIds(new Set());else setSelectedLeadIds(new Set(filteredContacts.map(l=>l.id)));}}/></th>
                <TH>Company</TH><TH>Contact</TH><TH>Role</TH><TH>Email</TH>
                <THFilter label="Category" value={filterCat} onChange={setFilterCat} options={allLeadCats.filter(c=>c!=="＋ Add category")} />
                <THFilter label="Location" value={filterLoc} onChange={setFilterLoc} options={allLocations.filter(l=>l!=="＋ Add location")} />
                <THFilter label="Status" value={filterStatus} onChange={setFilterStatus} options={[{ value: "All", label: "All" }, ...OUTREACH_STATUSES.map(s => ({ value: s, label: OUTREACH_STATUS_LABELS[s] }))]} />
                <TH>Type</TH>
                <TH>Date</TH>
              </tr></thead>
              <tbody>
                {filteredContacts.slice((contactsPage - 1) * 50, contactsPage * 50).map(l => {
                  const tc = TYPE_COLORS[l._type] || TYPE_COLORS.lead;
                  return (
                    <tr key={`${l._fromOutreach ? "o" : l._fromClient ? "c" : "l"}_${l.id}`} className="row" {...dragRowProps(l)} onClick={() => openRow(l)} style={{ cursor: "grab", background: selectedLeadIds.has(l.id) ? "#fffbe6" : undefined }}>
                      <td style={{padding:"11px 8px",borderBottom:`1px solid ${T.borderSub}`}} onClick={e=>{e.stopPropagation();toggleLeadId(l.id);}}><input type="checkbox" checked={selectedLeadIds.has(l.id)} readOnly/></td>
                      <TD bold>{l.company}</TD>
                      <TD>{l.contact || l.name || "\u2014"}</TD>
                      <TD muted>{l.role || ""}</TD>
                      <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }}>{l.email ? <a href={`mailto:${l.email}`} onClick={e => e.stopPropagation()} style={{ fontSize: 12.5, color: T.link, textDecoration: "none" }}>{l.email}</a> : "\u2014"}</td>
                      <TD muted>{l.category || "\u2014"}</TD>
                      <TD muted>{l.location || "\u2014"}</TD>
                      <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }} onClick={e => e.stopPropagation()}><OutreachBadge status={l.status} onClick={async (e) => { await cycleStatus(l, e); }} /></td>
                      <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 999, background: tc.bg, color: tc.color, whiteSpace: "nowrap" }}>{TYPE_LABELS[l._type]}</span>
                      </td>
                      <TD muted>{formatDate(l.date)}</TD>
                    </tr>
                  );
                })}
                {filteredContacts.length === 0 && <tr><td colSpan={10} style={{ padding: 44, textAlign: "center", color: T.muted, fontSize: 13 }}>No contacts found.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={contactsPage} total={filteredContacts.length} perPage={50} onChange={setContactsPage} />
          {selectedLeadIds.size>0&&<BulkActionBar selectedIds={selectedLeadIds} onDelete={bulkDeleteLeads} onClear={()=>setSelectedLeadIds(new Set())}/>}
        </div>
      )}

      {/* ── ADD CONTACT MODAL (unified) ── */}
      {showAddContact&&(
        <div className="modal-bg" onClick={()=>setShowAddContact(false)}>
          <div style={{borderRadius:isMobile?"20px 20px 0 0":20,padding:isMobile?"24px 20px":28,width:isMobile?"100%":520,maxWidth:isMobile?"100%":"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Contact</div>
              <button onClick={()=>setShowAddContact(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>&times;</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:18}}>
              {[["Company","company"],["Contact Name","clientName"],["Role","role"],["Email","email"],["Phone","phone"],["Date Contacted","date"],["Value (AED)","value"]].map(([label,key])=>(
                <div key={key}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
                  <input value={newContact[key]} onChange={e=>setNewContact(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Category</div>
                <CategoryPicker value={newContact.category} onChange={v=>setNewContact(p=>({...p,category:v}))} options={allLeadCats.filter(c=>c!=="All")} addNewOption={addNewOption} customCats={customLeadCats} setCustomCats={setCustomLeadCats} storageKey="onna_lead_cats"/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Location</div>
                <LocationPicker value={newContact.location} onChange={v=>setNewContact(p=>({...p,location:v}))} options={allLocations} addNewOption={addNewOption} customLocs={customLocations} setCustomLocs={setCustomLocations} storageKey="onna_custom_locations"/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Status</div>
                <Sel value={newContact.status} onChange={v=>setNewContact(p=>({...p,status:v}))} options={OUTREACH_STATUSES.map(s=>({value:s,label:OUTREACH_STATUS_LABELS[s]}))} minWidth={200}/>
              </div>
              <div style={{gridColumn:"span 2"}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Notes</div>
                <input value={newContact.notes} onChange={e=>setNewContact(p=>({...p,notes:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <BtnSecondary onClick={()=>setShowAddContact(false)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={async()=>{
                if(!newContact.company)return;
                try{
                  // Save as outreach entry
                  const saved=await api.post("/api/outreach",{...newContact,value:Number(newContact.value)||0});
                  if(saved&&saved.id){
                    setOutreach(prev=>[...prev,saved]);
                    // If status is "client", also create client record
                    if(newContact.status==="client"){
                      const comp=(newContact.company||"").trim().toLowerCase();
                      if(!localClients.some(c=>(c.company||"").trim().toLowerCase()===comp)){
                        const nc={company:newContact.company,name:newContact.clientName||"",email:newContact.email||"",phone:newContact.phone||"",category:newContact.category||"",country:newContact.location||"",status:"client",notes:newContact.notes||""};
                        const cs=await api.post("/api/clients",nc);
                        if(cs?.id)setLocalClients(prev=>[...prev,{...nc,id:cs.id}]);
                      }
                    }
                  }else{alert("Failed to save contact: "+(saved?.error||"Unknown error"));return;}
                }catch(e){alert("Failed to save contact: "+(e.message||"Network error"));return;}
                setNewContact({company:"",clientName:"",role:"",email:"",phone:"",category:"Production Companies",location:"Dubai, UAE",status:"cold",date:"",value:"",notes:""});
                setShowAddContact(false);
              }}>Save Contact</BtnPrimary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
