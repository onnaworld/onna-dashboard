import React, { useState, useMemo } from "react";

export default function Clients({
  T, isMobile, api,
  // Shared state
  localLeads, setLocalLeads,
  localClients, setLocalClients,
  outreach, setOutreach,
  localProjects,
  leadStatusOverrides,
  customLeadCats, setCustomLeadCats,
  customLeadLocs, setCustomLeadLocs,
  allLeadCats, allLeadLocs, addNewOption,
  // Search helpers
  getSearch, setSearch,
  // Selections / modals
  setSelectedLead, setSelectedOutreach, setShowAddLead,
  // Functions
  downloadCSV, exportTablePDF, formatDate, _parseDate, getMonthLabel,
  archiveItem, promoteToClient, getXContacts, getProjRevenue,
  // Constants
  OUTREACH_STATUS_LABELS, OUTREACH_STATUSES, LEAD_CATEGORIES,
  // UI components
  Pill, SearchBar, Sel, BtnPrimary, BtnSecondary, TH, THFilter, TD, OutreachBadge, LocationPicker,
  setUndoToastMsg,
}) {
  const showToast = msg => { if(setUndoToastMsg){setUndoToastMsg(msg);setTimeout(()=>setUndoToastMsg(""),3000);} };
  // ── Local state (Clients-tab-only) ──
  const [leadsView, setLeadsView] = useState(() => localStorage.getItem("onna_leads_view") || "dashboard");
  React.useEffect(() => { localStorage.setItem("onna_leads_view", leadsView); }, [leadsView]);

  const [leadCat, setLeadCat] = useState("All");
  const [leadStatus, setLeadStatus] = useState("All");
  const [leadMonth, setLeadMonth] = useState("All");
  const [leadLoc, setLeadLoc] = useState("All");
  const [clientCountry, setClientCountry] = useState("All");
  const [clientCat, setClientCat] = useState("All");

  const [outreachSort, setOutreachSort] = useState("date");
  const [outreachCatFilter, setOutreachCatFilter] = useState("All");
  const [outreachStatusFilter, setOutreachStatusFilter] = useState("All");
  const [outreachLocFilter, setOutreachLocFilter] = useState("All");
  const [outreachMonthFilter, setOutreachMonthFilter] = useState("All");

  // Not Contacted section toggle
  const [showNotContacted, setShowNotContacted] = useState(true);

  // Selected client (edit modal)
  const [selectedClient, setSelectedClient] = useState(null);

  // Add Client modal
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({company:"",name:"",email:"",phone:"",country:"",category:"",notes:""});

  // Add Outreach modal
  const [showAddOutreach, setShowAddOutreach] = useState(false);
  const [newOutreach, setNewOutreach] = useState({company:"",clientName:"",role:"",email:"",phone:"",category:"Production Companies",location:"Dubai, UAE",status:"cold",date:"",value:"",notes:""});

  // ── Computed values ──
  const allLeadsMerged = localLeads.map(l => leadStatusOverrides[l.id] ? { ...l, status: leadStatusOverrides[l.id] } : l);
  const _outreachKeys = new Set(outreach.map(o => o.company.trim().toLowerCase()));
  const _pureLeads = allLeadsMerged.filter(l => !_outreachKeys.has(l.company.trim().toLowerCase()));
  const _outreachAsLeads = outreach.map(o => ({ id: o.id, _fromOutreach: true, company: o.company, contact: o.clientName, role: o.role, email: o.email, category: o.category, status: o.status, date: o.date, value: o.value, location: o.location, notes: o.notes, phone: o.phone }));
  const allLeadsCombined = [..._pureLeads, ..._outreachAsLeads];
  const leadMonths = ["All", ...Array.from(new Set(allLeadsCombined.map(l => getMonthLabel(l.date)).filter(Boolean)))];
  const leadLocations = ["All", ...Array.from(new Set(allLeadsCombined.flatMap(l => (l.location||"").includes("|")?(l.location||"").split("|").map(s=>s.trim()).filter(Boolean):[l.location].filter(Boolean)))).sort()];

  const filteredLeads = useMemo(() => {
    const q = getSearch("Leads").toLowerCase();
    return allLeadsCombined
      .filter(l => {
        const s = q;
        const _hl = (loc,f) => {if(!loc)return false;if(loc.includes("|"))return loc.split("|").some(x=>x.trim()===f);return loc.trim()===f;};
        return (!s || [l.company,l.contact,l.role,l.email,l.phone,l.category,l.location,l.notes].some(v=>v&&v.toLowerCase().includes(s))) && (leadCat === "All" || l.category === leadCat) && (leadStatus === "All" || l.status === leadStatus) && (leadMonth === "All" || getMonthLabel(l.date) === leadMonth) && (leadLoc === "All" || _hl(l.location, leadLoc));
      })
      .sort((a, b) => (a.company || "").toLowerCase().localeCompare((b.company || "").toLowerCase()));
  }, [getSearch("Leads"), leadCat, leadStatus, leadMonth, leadLoc, localLeads, outreach, leadStatusOverrides]);

  const outreachCategories = ["All", ...Array.from(new Set(outreach.map(o => o.category).filter(Boolean)))];
  const outreachMonths = ["All", ...Array.from(new Set(outreach.map(o => getMonthLabel(o.date)).filter(Boolean)))];
  const outreachLocations = ["All", ...Array.from(new Set(outreach.flatMap(o => (o.location||"").includes("|")?(o.location||"").split("|").map(s=>s.trim()).filter(Boolean):[o.location].filter(Boolean)))).sort()];
  const filteredOutreach = outreach.filter(o => {
    if (o.status === "not_contacted" || o.status === "client") return false;
    const q = getSearch("Outreach").toLowerCase();
    const _hl2 = (loc,f) => {if(!loc)return false;if(loc.includes("|"))return loc.split("|").some(x=>x.trim()===f);return loc.trim()===f;};
    return (!q || [o.company,o.clientName,o.role,o.email,o.phone,o.category,o.location,o.notes].some(v=>v&&v.toLowerCase().includes(q))) && (outreachCatFilter === "All" || o.category === outreachCatFilter) && (outreachStatusFilter === "All" || o.status === outreachStatusFilter) && (outreachMonthFilter === "All" || getMonthLabel(o.date) === outreachMonthFilter) && (outreachLocFilter === "All" || _hl2(o.location, outreachLocFilter));
  }).sort((a, b) => outreachSort === "az"
    ? (a.company || "").toLowerCase().localeCompare((b.company || "").toLowerCase())
    : (_parseDate(b.date) || new Date(0)) - (_parseDate(a.date) || new Date(0)));

  // Client categories and countries for filters
  const clientCountries = ["All", ...Array.from(new Set(localClients.map(c => c.country).filter(Boolean))).sort()];
  const clientCategories = ["All", ...Array.from(new Set(localClients.map(c => c.category).filter(Boolean))).sort()];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        <Pill label="Overview" active={leadsView === "dashboard"} onClick={() => setLeadsView("dashboard")} />
        <Pill label="Outreach Tracker" active={leadsView === "outreach"} onClick={() => setLeadsView("outreach")} />
        <Pill label="Leads" active={leadsView === "leads"} onClick={() => setLeadsView("leads")} />
        <Pill label="Clients" active={leadsView === "clients"} onClick={() => setLeadsView("clients")} />
      </div>

      {leadsView === "dashboard" && (() => {
        const STATUSES = ["not_contacted", "cold", "warm", "open", "client"];
        const COLORS = { not_contacted: "#c0392b", cold: "#6e6e73", warm: "#1a56db", open: "#147d50", client: "#7c3aed" };
        const STATUS_LABELS = OUTREACH_STATUS_LABELS;
        const counts = STATUSES.map(s => allLeadsCombined.filter(l => l.status === s).length);
        const total = counts.reduce((a, b) => a + b, 0) || 1;

        const PAL = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16", "#a78bfa"];

        const stageGroups = STATUSES.map((s, i) => ({ label: STATUS_LABELS[s], count: counts[i], color: COLORS[s] })).filter(g => g.count > 0);

        const _catMap = {}; allLeadsCombined.forEach(l => { if (l.category) _catMap[l.category] = (_catMap[l.category] || 0) + 1; });
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
        const toContact = allLeadsCombined.filter(l => l.status === "not_contacted").slice(0, 5);
        const toFollowUp = allLeadsCombined.filter(l => {
          if (l.status === "not_contacted" || l.status === "client") return false;
          const d = _parseDate(l.date); return d && d < oneMonthAgo;
        }).slice(0, 5);

        const ReminderCard = ({ lead, showDate }) => (
          <div onClick={() => openLead(lead)} className="row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, cursor: "pointer", marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.company}</div>
              <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.contact || "\u2014"}{lead.category ? ` \u00b7 ${lead.category}` : ""}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <OutreachBadge status={lead.status} onClick={async (e) => { e.stopPropagation(); const next = OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(lead.status) + 1) % OUTREACH_STATUSES.length]; if (lead._fromOutreach) { await api.put(`/api/outreach/${lead.id}`, { status: next }); setOutreach(prev => prev.map(x => x.id === lead.id ? { ...x, status: next } : x)); } else { await api.put(`/api/leads/${lead.id}`, { status: next }); setLocalLeads(prev => prev.map(x => x.id === lead.id ? { ...x, status: next } : x)); } if(next==="client"){const comp=(lead.company||"").trim().toLowerCase();if(!localClients.some(c=>(c.company||"").trim().toLowerCase()===comp)){const nc={company:lead.company,name:lead.contact||"",email:lead.email||"",phone:lead.phone||"",category:lead.category||"",country:lead.location||"",status:"client",notes:lead.notes||""};const saved=await api.post("/api/clients",nc);if(saved?.id)setLocalClients(prev=>[...prev,{...nc,id:saved.id}]);}} }} />
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
                {toContact.length === 0 ? <div style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: "24px 0" }}>All leads contacted!</div> : toContact.map(l => <ReminderCard key={l.id} lead={l} showDate={false} />)}
              </div>
              <div style={{ borderRadius: 16, background: T.surface, border: "1px solid " + T.border, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Follow Up</div>
                  <span style={{ fontSize: 11, color: "#92680a", background: "#fff8e8", padding: "2px 8px", borderRadius: 999, fontWeight: 500 }}>1+ month since contact</span>
                </div>
                {toFollowUp.length === 0 ? <div style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: "24px 0" }}>No follow-ups due yet.</div> : toFollowUp.map(l => <ReminderCard key={l.id} lead={l} showDate={true} />)}
              </div>
            </div>
          </div>
        );
      })()}

      {leadsView === "leads" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <SearchBar value={getSearch("Leads")} onChange={v => setSearch("Leads", v)} placeholder="Search leads..." />
            <Sel value={leadStatus} onChange={setLeadStatus} options={["All", ...OUTREACH_STATUSES.map(s => ({value:s,label:OUTREACH_STATUS_LABELS[s]}))]} minWidth={140} />
            <Sel value={leadCat} onChange={setLeadCat} options={[...LEAD_CATEGORIES, ...customLeadCats]} minWidth={170} />
            <Sel value={leadLoc} onChange={setLeadLoc} options={leadLocations} minWidth={170} />
            <span style={{ fontSize: 12, color: T.muted }}>{filteredLeads.length} leads</span>
            <button onClick={() => downloadCSV(filteredLeads, [{ key: "company", label: "Company" }, { key: "contact", label: "Contact" }, { key: "role", label: "Role" }, { key: "email", label: "Email" }, { key: "category", label: "Category" }, { key: "status", label: "Status" }, { key: "date", label: "Date Contacted" }, { key: "value", label: "Value (AED)" }, { key: "location", label: "Location" }, { key: "notes", label: "Notes" }], "leads.csv")} style={{ background: "#f5f5f7", border: "none", color: T.sub, padding: "6px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>CSV</button>
            <button onClick={() => exportTablePDF(filteredLeads, [{ key: "company", label: "Company" }, { key: "contact", label: "Contact" }, { key: "role", label: "Role" }, { key: "email", label: "Email" }, { key: "category", label: "Category" }, { key: "status", label: "Status" }, { key: "date", label: "Date Contacted" }], "Leads Pipeline")} style={{ background: "#f5f5f7", border: "none", color: T.sub, padding: "6px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>PDF</button>
            <BtnPrimary onClick={() => setShowAddLead(true)}>+ New Lead</BtnPrimary>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
            {[["not_contacted", "Not yet reached out", "#c0392b", "#fff3e0"], ["cold", "No response", T.sub, "#f5f5f7"], ["warm", "Responded", "#1a56db", "#eef4ff"], ["open", "Meeting arranged", "#147d50", "#edfaf3"], ["client", "Converted to client", "#7c3aed", "#f3e8ff"]].map(([s, l, c, bg]) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: bg, border: `1.5px solid ${c}` }} /><span style={{ color: c, fontWeight: 600 }}>{OUTREACH_STATUS_LABELS[s]}</span><span style={{ color: T.muted }}>{"\u2014"} {l}</span></div>
            ))}
            <span style={{ fontSize: 11.5, color: T.muted, marginLeft: "auto" }}>Click badge to cycle</span>
          </div>
          <div className="mob-table-wrap" style={{ borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: T.surface, minWidth: isMobile ? 620 : "auto" }}>
              <thead><tr>
                <TH>Company</TH><TH>Contact</TH><TH>Role</TH><TH>Email</TH>
                <THFilter label="Category" value={leadCat} onChange={setLeadCat} options={[...LEAD_CATEGORIES, ...customLeadCats]} />
                <THFilter label="Location" value={leadLoc} onChange={setLeadLoc} options={leadLocations} />
                <THFilter label="Status" value={leadStatus} onChange={setLeadStatus} options={[{ value: "All", label: "All" }, ...OUTREACH_STATUSES.map(s => ({ value: s, label: OUTREACH_STATUS_LABELS[s] }))]} />
                <THFilter label="Date Contacted" value={leadMonth} onChange={setLeadMonth} options={leadMonths} />
              </tr></thead>
              <tbody>
                {filteredLeads.map(l => (
                  <tr key={`${l._fromOutreach ? "o" : "l"}_${l.id}`} className="row" onClick={() => { if (l._fromOutreach) { const o = outreach.find(o => o.id === l.id) || { ...l, clientName: l.contact }; setSelectedOutreach({ ...o, _xContacts: getXContacts('outreach', o.id) }); } else { setSelectedLead({ ...l, _xContacts: getXContacts('lead', l.id) }); } }}>
                    <TD bold>{l.company}</TD><TD>{l.contact}</TD><TD muted>{l.role || ""}</TD>
                    <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }}><a href={`mailto:${l.email}`} onClick={e => e.stopPropagation()} style={{ fontSize: 12.5, color: T.link, textDecoration: "none" }}>{l.email}</a></td>
                    <TD muted>{l.category}</TD>
                    <TD muted>{l.location || "\u2014"}</TD>
                    <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }} onClick={e => e.stopPropagation()}><OutreachBadge status={l.status} onClick={async () => { const next = OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(l.status) + 1) % OUTREACH_STATUSES.length]; if (l._fromOutreach) { await api.put(`/api/outreach/${l.id}`, { status: next }); setOutreach(prev => prev.map(x => x.id === l.id ? { ...x, status: next } : x)); } else { await api.put(`/api/leads/${l.id}`, { status: next }); setLocalLeads(prev => prev.map(x => x.id === l.id ? { ...x, status: next } : x)); } if(next==="client"){const comp=(l.company||"").trim().toLowerCase();if(!localClients.some(c=>(c.company||"").trim().toLowerCase()===comp)){const nc={company:l.company,name:l.contact||"",email:l.email||"",phone:l.phone||"",category:l.category||"",country:l.location||"",status:"client",notes:l.notes||"",source:l.source||""};const saved=await api.post("/api/clients",nc);if(saved?.id)setLocalClients(prev=>[...prev,{...nc,id:saved.id}]);}} }} /></td>
                    <TD muted>{formatDate(l.date)}</TD>
                  </tr>
                ))}
                {filteredLeads.length === 0 && <tr><td colSpan={8} style={{ padding: 44, textAlign: "center", color: T.muted, fontSize: 13 }}>No leads found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {leadsView === "clients" && (() => {
        if (selectedClient) {
          const cKey = (selectedClient.company || "").trim().toLowerCase();
          const cProjects = localProjects.filter(p => (p.client || "").trim().toLowerCase() === cKey);
          const cRevenue = cProjects.reduce((a, p) => a + getProjRevenue(p), 0);
          return (
            <div>
              <button onClick={()=>setSelectedClient(null)} style={{background:"none",border:"none",color:T.link,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",padding:0,marginBottom:20,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:16}}>{"‹"}</span> Back to Clients
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
                    <Sel value={selectedClient.category||""} onChange={v=>{if(v==="\uff0b Add category"){const n=addNewOption(customLeadCats,setCustomLeadCats,'onna_lead_cats',"New category name:");if(n)setSelectedClient(p=>({...p,category:n}));}else setSelectedClient(p=>({...p,category:v}));}} options={allLeadCats.filter(c=>c!=="All")} minWidth="100%"/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:T.muted,marginBottom:5,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Location</div>
                    <LocationPicker value={selectedClient.country||""} onChange={v=>setSelectedClient(p=>({...p,country:v}))} options={allLeadLocs} addNewOption={addNewOption} customLocs={customLeadLocs} setCustomLocs={setCustomLeadLocs} storageKey="onna_lead_locs"/>
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
                  <button onClick={async()=>{if(!confirm(`Delete ${selectedClient.company}?`))return;archiveItem('clients',selectedClient);await api.delete(`/api/clients/${selectedClient.id}`);setLocalClients(prev=>prev.filter(x=>x.id!==selectedClient.id));setSelectedClient(null);}} style={{background:"none",border:"none",color:"#c0392b",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",padding:0}}>Delete client</button>
                  <div style={{display:"flex",gap:8}}>
                    <BtnSecondary onClick={()=>setSelectedClient(null)}>Cancel</BtnSecondary>
                    <BtnPrimary onClick={async()=>{const {id,_fromClient,_fromLead,_fromOutreach,...fields}=selectedClient;if((selectedClient.status||"client")!=="client"&&_fromClient){const newLead={company:selectedClient.company,contact:selectedClient.name||"",role:selectedClient.role||"",email:selectedClient.email||"",phone:selectedClient.phone||"",category:selectedClient.category||"",location:selectedClient.country||"",status:selectedClient.status,date:selectedClient.date||"",value:selectedClient.value||"",notes:selectedClient.notes||"",source:selectedClient.source||""};const saved=await api.post("/api/leads",newLead);if(saved?.id)setLocalLeads(prev=>[...prev,{...newLead,id:saved.id}]);await api.delete(`/api/clients/${id}`);setLocalClients(prev=>prev.filter(x=>x.id!==id));}else if(_fromLead&&_fromOutreach){await api.put(`/api/outreach/${id}`,{...fields,clientName:fields.name,location:fields.country});setOutreach(prev=>prev.map(x=>x.id===id?{...x,...fields,clientName:fields.name,location:fields.country}:x));}else if(_fromLead){await api.put(`/api/leads/${id}`,{...fields,contact:fields.name,location:fields.country});setLocalLeads(prev=>prev.map(x=>x.id===id?{...x,...fields,contact:fields.name,location:fields.country}:x));}else{await api.put(`/api/clients/${id}`,fields);setLocalClients(prev=>prev.map(c=>c.id===id?selectedClient:c));}showToast("Saved ✓");setSelectedClient(null);}}>Save Changes</BtnPrimary>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Combine actual clients + leads/outreach with "client" status
        const _clientLeads = allLeadsCombined.filter(l => l.status === "client").map(l => ({ ...l, _fromLead: true, name: l.contact, country: l.location }));
        const _allClients = [...localClients.map(c => ({ ...c, _fromClient: true })), ..._clientLeads.filter(l => !localClients.some(c => (c.company||"").trim().toLowerCase() === (l.company||"").trim().toLowerCase()))];
        const _cq = getSearch("Clients").toLowerCase();
        const _filteredClients = _allClients.filter(c => {
          return (!_cq || [c.company,c.name,c.email,c.phone,c.country,c.category,c.notes].some(v=>v&&v.toLowerCase().includes(_cq))) && (clientCountry === "All" || (c.country || "") === clientCountry) && (clientCat === "All" || (c.category || "") === clientCat);
        });
        return (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <SearchBar value={getSearch("Clients")} onChange={v => setSearch("Clients", v)} placeholder="Search clients..." />
              <Sel value={clientCat} onChange={setClientCat} options={clientCategories} minWidth={170} />
              <Sel value={clientCountry} onChange={setClientCountry} options={clientCountries} minWidth={170} />
              <span style={{ fontSize: 12, color: T.muted }}>{_filteredClients.length} clients</span>
              <BtnPrimary onClick={() => setShowAddClient(true)}>+ New Client</BtnPrimary>
            </div>
            <div className="mob-table-wrap" style={{ borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: T.surface, minWidth: isMobile ? 620 : "auto" }}>
                <thead><tr>
                  <TH>Company</TH><TH>Contact</TH><TH>Email</TH><TH>Phone</TH>
                  <THFilter label="Category" value={clientCat} onChange={setClientCat} options={clientCategories} />
                  <THFilter label="Location" value={clientCountry} onChange={setClientCountry} options={clientCountries} />
                  <TH>Status</TH>
                  <TH>Revenue</TH>
                  <TH>Projects</TH>
                </tr></thead>
                <tbody>
                  {_filteredClients.map(c => {
                    const cKey = (c.company || "").trim().toLowerCase();
                    const cProjects = localProjects.filter(p => (p.client || "").trim().toLowerCase() === cKey);
                    const cRevenue = cProjects.reduce((a, p) => a + getProjRevenue(p), 0);
                    return (
                      <tr key={c.id} className="row" onClick={()=>setSelectedClient({...c})}>
                        <TD bold>{c.company}</TD>
                        <TD>{c.name || "\u2014"}</TD>
                        <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }}>{c.email ? <a href={`mailto:${c.email}`} onClick={e=>e.stopPropagation()} style={{ fontSize: 12.5, color: T.link, textDecoration: "none" }}>{c.email}</a> : "\u2014"}</td>
                        <TD muted>{c.phone || "\u2014"}</TD>
                        <TD muted>{c.category || "\u2014"}</TD>
                        <TD muted>{c.country || "\u2014"}</TD>
                        <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }} onClick={e=>e.stopPropagation()}><OutreachBadge status={c.status||"client"} onClick={async()=>{const cur=c.status||"client";const next=OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(cur)+1)%OUTREACH_STATUSES.length];if(c._fromLead){if(c._fromOutreach){await api.put(`/api/outreach/${c.id}`,{status:next});setOutreach(prev=>prev.map(x=>x.id===c.id?{...x,status:next}:x));}else{await api.put(`/api/leads/${c.id}`,{status:next});setLocalLeads(prev=>prev.map(x=>x.id===c.id?{...x,status:next}:x));}}else if(c._fromClient&&next!=="client"){const newLead={company:c.company,contact:c.name||"",role:c.role||"",email:c.email||"",phone:c.phone||"",category:c.category||"",location:c.country||"",status:next,date:c.date||"",value:c.value||"",notes:c.notes||"",source:c.source||""};const saved=await api.post("/api/leads",newLead);if(saved?.id)setLocalLeads(prev=>[...prev,{...newLead,id:saved.id}]);await api.delete(`/api/clients/${c.id}`);setLocalClients(prev=>prev.filter(x=>x.id!==c.id));}else{await api.put(`/api/clients/${c.id}`,{status:next});setLocalClients(prev=>prev.map(x=>x.id===c.id?{...x,status:next}:x));}}}/></td>
                        <TD muted>AED {cRevenue.toLocaleString()}</TD>
                        <TD muted>{cProjects.length}</TD>
                      </tr>
                    );
                  })}
                  {_filteredClients.length === 0 && <tr><td colSpan={9} style={{ padding: 44, textAlign: "center", color: T.muted, fontSize: 13 }}>No clients yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {leadsView === "outreach" && (
        <div>
          {/* ── NOT CONTACTED queue ── */}
          {(() => {
            const notContacted = allLeadsCombined.filter(l => l.status === "not_contacted");
            if (notContacted.length === 0) return null;
            return (
              <div style={{ marginBottom: 22 }}>
                <div onClick={() => setShowNotContacted(p => !p)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: showNotContacted ? 0 : 0, userSelect: "none" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Not Contacted</span>
                  <span style={{ fontSize: 10, fontWeight: 600, background: "#fff3e0", color: "#c0392b", padding: "1px 7px", borderRadius: 999 }}>{notContacted.length}</span>
                  <span style={{ fontSize: 11, color: T.muted, transition: "transform 0.15s", display: "inline-block", transform: showNotContacted ? "rotate(0)" : "rotate(-90deg)" }}>▾</span>
                </div>
                {showNotContacted && (
                  <div className="mob-table-wrap" style={{ borderRadius: 12, border: `1px solid ${T.border}`, marginTop: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", background: T.surface, minWidth: isMobile ? 500 : "auto" }}>
                      <thead><tr>
                        <TH>Company</TH><TH>Contact</TH><TH>Email</TH><TH>Category</TH><TH>Location</TH><TH />
                      </tr></thead>
                      <tbody>
                        {notContacted.map(l => (
                          <tr key={`nc_${l._fromOutreach?"o":"l"}_${l.id}`} className="row" style={{ cursor: "pointer" }}
                            onClick={() => { if (l._fromOutreach) { const o = outreach.find(o => o.id === l.id) || { ...l, clientName: l.contact }; setSelectedOutreach({ ...o, _xContacts: getXContacts('outreach', o.id) }); } else { setSelectedLead({ ...l, _xContacts: getXContacts('lead', l.id) }); } }}>
                            <TD bold>{l.company}</TD>
                            <TD>{l.contact || "\u2014"}</TD>
                            <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }}>{l.email ? <a href={`mailto:${l.email}`} onClick={e => e.stopPropagation()} style={{ fontSize: 12.5, color: T.link, textDecoration: "none" }}>{l.email}</a> : "\u2014"}</td>
                            <TD muted>{l.category || "\u2014"}</TD>
                            <TD muted>{l.location || "\u2014"}</TD>
                            <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }} onClick={e => e.stopPropagation()}>
                              <button onClick={async () => { const next = "cold"; if (l._fromOutreach) { await api.put(`/api/outreach/${l.id}`, { status: next }); setOutreach(prev => prev.map(x => x.id === l.id ? { ...x, status: next } : x)); } else { await api.put(`/api/leads/${l.id}`, { status: next }); setLocalLeads(prev => prev.map(x => x.id === l.id ? { ...x, status: next } : x)); } showToast(`${l.company} → Cold`); }}
                                style={{ padding: "3px 10px", borderRadius: 7, background: "#f5f5f7", border: `1px solid ${T.border}`, color: T.sub, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>→ Cold</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <SearchBar value={getSearch("Outreach")} onChange={v => setSearch("Outreach", v)} placeholder="Search outreach..." />
            <Sel value={outreachCatFilter} onChange={setOutreachCatFilter} options={outreachCategories} minWidth={170} />
            <Sel value={outreachLocFilter} onChange={setOutreachLocFilter} options={outreachLocations} minWidth={170} />
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, flexShrink: 0 }}>
              <button onClick={() => setOutreachSort("date")} style={{ padding: "5px 11px", background: outreachSort === "date" ? T.accent : "#f5f5f7", border: "none", color: outreachSort === "date" ? "#fff" : T.sub, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Recent first</button>
              <button onClick={() => setOutreachSort("az")} style={{ padding: "5px 11px", background: outreachSort === "az" ? T.accent : "#f5f5f7", border: "none", borderLeft: `1px solid ${T.border}`, color: outreachSort === "az" ? "#fff" : T.sub, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>A{"\u2013"}Z</button>
            </div>
            <span style={{ fontSize: 12, color: T.muted }}>{filteredOutreach.length} contacts</span>
            <button onClick={() => downloadCSV(filteredOutreach, [{ key: "company", label: "Company" }, { key: "clientName", label: "Contact" }, { key: "role", label: "Role" }, { key: "email", label: "Email" }, { key: "category", label: "Category" }, { key: "status", label: "Status" }, { key: "date", label: "Date Contacted" }, { key: "value", label: "Value (AED)" }, { key: "location", label: "Location" }, { key: "notes", label: "Notes" }], "outreach.csv")} style={{ background: "#f5f5f7", border: "none", color: T.sub, padding: "6px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>CSV</button>
            <button onClick={() => exportTablePDF(filteredOutreach, [{ key: "company", label: "Company" }, { key: "clientName", label: "Contact" }, { key: "role", label: "Role" }, { key: "email", label: "Email" }, { key: "category", label: "Category" }, { key: "status", label: "Status" }, { key: "date", label: "Date Contacted" }], "Outreach Tracker")} style={{ background: "#f5f5f7", border: "none", color: T.sub, padding: "6px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>PDF</button>
            <BtnPrimary onClick={() => setShowAddOutreach(true)}>+ New Outreach</BtnPrimary>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
            {[["cold", "No response", T.sub, "#f5f5f7"], ["warm", "Responded", "#1a56db", "#eef4ff"], ["open", "Meeting arranged", "#147d50", "#edfaf3"], ["client", "Converted to client", "#7c3aed", "#f3e8ff"]].map(([s, l, c, bg]) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: bg, border: `1.5px solid ${c}` }} /><span style={{ color: c, fontWeight: 600 }}>{OUTREACH_STATUS_LABELS[s]}</span><span style={{ color: T.muted }}>{"\u2014"} {l}</span></div>
            ))}
            <span style={{ fontSize: 11.5, color: T.muted, marginLeft: "auto" }}>Click badge to cycle</span>
          </div>
          <div className="mob-table-wrap" style={{ borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: T.surface, minWidth: isMobile ? 660 : "auto" }}>
              <thead><tr>
                <TH>Company</TH><TH>Contact</TH><TH>Role</TH><TH>Email</TH>
                <THFilter label="Category" value={outreachCatFilter} onChange={setOutreachCatFilter} options={outreachCategories} />
                <THFilter label="Location" value={outreachLocFilter} onChange={setOutreachLocFilter} options={outreachLocations} />
                <THFilter label="Status" value={outreachStatusFilter} onChange={setOutreachStatusFilter} options={[{ value: "All", label: "All" }, ...OUTREACH_STATUSES.filter(s => s !== "not_contacted").map(s => ({ value: s, label: OUTREACH_STATUS_LABELS[s] }))]} />
                <THFilter label="Date Contacted" value={outreachMonthFilter} onChange={setOutreachMonthFilter} options={outreachMonths} />
                <TH />
              </tr></thead>
              <tbody>
                {filteredOutreach.map(o => (
                  <tr key={o.id} className="row" onClick={() => setSelectedOutreach({ ...o, _xContacts: getXContacts('outreach', o.id) })}>
                    <TD bold>{o.company}</TD><TD>{o.clientName}</TD><TD muted>{o.role}</TD>
                    <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }}><a href={`mailto:${o.email}`} onClick={e => e.stopPropagation()} style={{ fontSize: 12.5, color: T.link, textDecoration: "none" }}>{o.email}</a></td>
                    <TD muted>{o.category}</TD>
                    <TD muted>{o.location || "\u2014"}</TD>
                    <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }} onClick={e => e.stopPropagation()}><OutreachBadge status={o.status} onClick={async () => { const next = OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(o.status) + 1) % OUTREACH_STATUSES.length]; await api.put(`/api/outreach/${o.id}`, { status: next }); setOutreach(prev => prev.map(x => x.id === o.id ? { ...x, status: next } : x)); if(next==="client"){const comp=(o.company||"").trim().toLowerCase();if(!localClients.some(c=>(c.company||"").trim().toLowerCase()===comp)){const nc={company:o.company,name:o.clientName||"",email:o.email||"",phone:o.phone||"",category:o.category||"",country:o.location||"",status:"client",notes:o.notes||"",source:o.source||""};const saved=await api.post("/api/clients",nc);if(saved?.id)setLocalClients(prev=>[...prev,{...nc,id:saved.id}]);}} }} /></td>
                    <TD muted>{formatDate(o.date)}</TD>
                    <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }} onClick={e => e.stopPropagation()}><button onClick={async () => { archiveItem('outreach', o); await api.delete(`/api/outreach/${o.id}`); setOutreach(prev => prev.filter(x => x.id !== o.id)); }} style={{ background: "none", border: "none", color: T.muted, fontSize: 16, cursor: "pointer", padding: 0 }}>{"\u00d7"}</button></td>
                  </tr>
                ))}
                {filteredOutreach.length === 0 && <tr><td colSpan={9} style={{ padding: 44, textAlign: "center", color: T.muted, fontSize: 13 }}>No outreach contacts found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD CLIENT MODAL ── */}
      {showAddClient&&(
        <div className="modal-bg" onClick={()=>setShowAddClient(false)}>
          <div style={{borderRadius:isMobile?"20px 20px 0 0":20,padding:isMobile?"24px 20px":28,width:isMobile?"100%":520,maxWidth:isMobile?"100%":"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Client</div>
              <button onClick={()=>setShowAddClient(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:18}}>
              {[["Company","company"],["Contact Name","name"],["Email","email"],["Phone","phone"]].map(([label,key])=>(
                <div key={key}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
                  <input value={newClient[key]} onChange={e=>setNewClient(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Category</div>
                <Sel value={newClient.category} onChange={v=>{if(v==="\uff0b Add category"){const n=addNewOption(customLeadCats,setCustomLeadCats,'onna_lead_cats',"New category name:");if(n)setNewClient(p=>({...p,category:n}));}else setNewClient(p=>({...p,category:v}));}} options={allLeadCats.filter(c=>c!=="All")} minWidth={200}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Location</div>
                <LocationPicker value={newClient.country} onChange={v=>setNewClient(p=>({...p,country:v}))} options={allLeadLocs} addNewOption={addNewOption} customLocs={customLeadLocs} setCustomLocs={setCustomLeadLocs} storageKey="onna_lead_locs"/>
              </div>
              <div style={{gridColumn:"span 2"}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Notes</div>
                <input value={newClient.notes} onChange={e=>setNewClient(p=>({...p,notes:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <BtnSecondary onClick={()=>setShowAddClient(false)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={async()=>{if(!newClient.company)return;try{const saved=await api.post("/api/clients",newClient);if(saved&&saved.id){setLocalClients(prev=>[...prev,saved]);}else{alert("Failed to save client: "+(saved?.error||"Unknown error"));return;}}catch(e){alert("Failed to save client: "+(e.message||"Network error"));return;}setNewClient({company:"",name:"",email:"",phone:"",country:"",category:"",notes:""});setShowAddClient(false);}}>Save Client</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD OUTREACH MODAL ── */}
      {showAddOutreach&&(
        <div className="modal-bg" onClick={()=>setShowAddOutreach(false)}>
          <div style={{borderRadius:isMobile?"20px 20px 0 0":20,padding:isMobile?"24px 20px":28,width:isMobile?"100%":520,maxWidth:isMobile?"100%":"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Outreach</div>
              <button onClick={()=>setShowAddOutreach(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:18}}>
              {[["Company","company"],["Contact Name","clientName"],["Role","role"],["Email","email"],["Phone","phone"],["Date Contacted","date"],["Value (AED)","value"]].map(([label,key])=>(
                <div key={key}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
                  <input value={newOutreach[key]} onChange={e=>setNewOutreach(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Category</div>
                <Sel value={newOutreach.category} onChange={v=>{if(v==="\uff0b Add category"){const n=addNewOption(customLeadCats,setCustomLeadCats,'onna_lead_cats',"New category name:");if(n)setNewOutreach(p=>({...p,category:n}));}else setNewOutreach(p=>({...p,category:v}));}} options={allLeadCats.filter(c=>c!=="All")} minWidth={200}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Location</div>
                <LocationPicker value={newOutreach.location} onChange={v=>setNewOutreach(p=>({...p,location:v}))} options={allLeadLocs} addNewOption={addNewOption} customLocs={customLeadLocs} setCustomLocs={setCustomLeadLocs} storageKey="onna_lead_locs"/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Status</div>
                <Sel value={newOutreach.status} onChange={v=>setNewOutreach(p=>({...p,status:v}))} options={OUTREACH_STATUSES.map(s=>({value:s,label:OUTREACH_STATUS_LABELS[s]}))} minWidth={200}/>
              </div>
              <div style={{gridColumn:"span 2"}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Notes</div>
                <input value={newOutreach.notes} onChange={e=>setNewOutreach(p=>({...p,notes:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <BtnSecondary onClick={()=>setShowAddOutreach(false)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={async()=>{if(!newOutreach.company)return;try{const saved=await api.post("/api/outreach",{...newOutreach,value:Number(newOutreach.value)||0});if(saved&&saved.id){setOutreach(prev=>[...prev,saved]);}else{alert("Failed to save outreach: "+(saved?.error||"Unknown error"));return;}}catch(e){alert("Failed to save outreach: "+(e.message||"Network error"));return;}setNewOutreach({company:"",clientName:"",role:"",email:"",phone:"",category:"Production Companies",location:"Dubai, UAE",status:"cold",date:"",value:"",notes:""});setShowAddOutreach(false);}}>Save Outreach</BtnPrimary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
