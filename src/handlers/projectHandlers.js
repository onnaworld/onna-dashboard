import { _proxy, buildPath, parseICS, GCAL_CLIENT_ID, api } from "../utils/helpers";

// ── Auth handlers ────────────────────────────────────────────────────────────

export const doLogin = async (lgUser, lgPass, setLgLoading, setLgErr) => {
  if (!lgUser.trim()||!lgPass.trim()) return;
  setLgLoading(true); setLgErr("");
  try {
    const data = await fetch(_proxy("/api/auth/login"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:lgUser,password:lgPass})}).then(r=>r.json());
    if (data.token) { localStorage.setItem("onna_token",data.token); window.location.reload(); }
    else setLgErr("Incorrect username or password");
  } catch { setLgErr("Could not connect. Please try again."); }
  setLgLoading(false);
};

export const doResetRequest = async (lgEmail, setLgLoading, setLgStep) => {
  setLgLoading(true);
  try {
    const data = await fetch(_proxy("/api/auth/reset-request"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:lgEmail})}).then(r=>r.json());
    if (data.reset_url) { window.location.href=data.reset_url; return; }
  } catch {}
  setLgStep("forgot-sent"); setLgLoading(false);
};

export const doResetConfirm = async (lgNewPass, lgNewPass2, _urlReset, setLgLoading, setLgErr, setLgStep) => {
  if (!lgNewPass||lgNewPass.length<8){setLgErr("Password must be at least 8 characters");return;}
  if (!/[A-Z]/.test(lgNewPass)||!/[0-9]/.test(lgNewPass)){setLgErr("Password must include at least one uppercase letter and one number");return;}
  if (lgNewPass!==lgNewPass2){setLgErr("Passwords do not match");return;}
  setLgLoading(true); setLgErr("");
  try {
    const data = await fetch(_proxy("/api/auth/reset-confirm"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:_urlReset,password:lgNewPass})}).then(r=>r.json());
    if (data.ok) setLgStep("reset-done");
    else setLgErr(data.error||"Reset failed. Link may have expired.");
  } catch { setLgErr("Could not connect. Please try again."); }
  setLgLoading(false);
};

// ── Navigation ───────────────────────────────────────────────────────────────

export const pushNav = (tab, project, section, subSection) => {
  const path = buildPath(tab, project?.id||null, section||null, subSection||null);
  window.history.pushState({tab,projectId:project?.id||null,section:section||null,subSection:subSection||null}, "", path);
};

export const changeTab = (tab, setters) => {
  const { setActiveTab, setSelectedProject, setProjectSection, setCreativeSubSection, setBudgetSubSection, setDocumentsSubSection, setScheduleSubSection, setTravelSubSection, setPermitsSubSection, setStylingSubSection, setCastingSubSection, setActiveCastingDeckVersion, setActiveCastingTableVersion, setActiveCSVersion, setLocSubSection, setActiveRecceVersion, setVaultLocked, setVaultKey, setVaultPass, setVaultResources, setVaultErr, setVaultPwSearch } = setters;
  setActiveTab(tab); setSelectedProject(null); setProjectSection("Home"); setCreativeSubSection(null);setBudgetSubSection(null);setDocumentsSubSection(null);setScheduleSubSection(null);setTravelSubSection(null);setPermitsSubSection(null);setStylingSubSection(null);setCastingSubSection(null);setActiveCastingDeckVersion(null);setActiveCastingTableVersion(null);setActiveCSVersion(null);setLocSubSection(null);setActiveRecceVersion(null);
  pushNav(tab, null, null, null);
  if (tab!=="Resources") { setVaultLocked(true); setVaultKey(null); setVaultPass(""); setVaultResources([]); setVaultErr(""); setVaultPwSearch(""); }
  if (tab==="Notes") setActiveTab("Information");
};

export const navigateToDoc = (projectObj, section, subSection, opts, setters) => {
  const { setActiveTab, setSelectedProject, setProjectSection, setDocumentsSubSection, setActiveCSVersion, setActiveDietaryVersion, setActiveRAVersion, setActiveContractVersion, setBudgetSubSection, setAgentActiveIdx } = setters;
  setActiveTab("Projects");
  setSelectedProject(projectObj);
  setProjectSection(section);
  if(section==="Documents"){ setDocumentsSubSection(subSection); setActiveCSVersion(null); setActiveDietaryVersion(opts?.dietaryIdx??null); setActiveRAVersion(null); setActiveContractVersion(null); }
  if(section==="Budget"){ setBudgetSubSection(subSection||"estimates"); }
  pushNav("Projects", projectObj, section, subSection);
  setAgentActiveIdx(null);
};

// ── Todo ─────────────────────────────────────────────────────────────────────

export const addTodoFromInput = (text, todoTopFilter, todoFilter, pushUndo, setProjectTodos, setPendingProjectTask, setTodos) => {
  if (!text) return;
  pushUndo("add task");
  const tab = todoTopFilter==="todo"?"onna":todoTopFilter==="general"?"personal":undefined;
  const subType = todoFilter==="todo-later"||todoFilter==="general-later"?"later":undefined;
  if (todoFilter.startsWith("project-")) {
    const pid = Number(todoFilter.replace("project-",""));
    setProjectTodos(prev=>({...prev,[pid]:[...(prev[pid]||[]),{id:Date.now(),text,done:false,details:""}]}));
  } else if (todoTopFilter==="project") {
    setPendingProjectTask(text);
  } else {
    setTodos(prev=>[...prev,{id:Date.now(),text,done:false,type:"general",tab:tab||"onna",subType,details:""}]);
  }
};

// ── Archive helpers ──────────────────────────────────────────────────────────

export const archiveItem = (table, item, setArchive) => {
  const entry = {id:Date.now(), table, item, deletedAt:new Date().toISOString()};
  setArchive(prev=>{
    const updated=[entry,...prev];
    try{localStorage.setItem('onna_archive',JSON.stringify(updated));}catch{}
    return updated;
  });
};

export const restoreItem = async (entry, setters) => {
  const { setProjectEstimates, setTodos, setDashNotesList, setNotes, setLocalProjects, setCallSheetStore, setRiskAssessmentStore, setContractDocStore, setTravelItineraryStore, setDietaryStore, setLocDeckStore, setLocalClients, setLocalLeads, setVendors, setOutreach, setArchive } = setters;
  const {id:archiveId, table, item} = entry;
  const removeFromArchive = () => {
    setArchive(prev=>{const updated=prev.filter(e=>e.id!==archiveId);try{localStorage.setItem('onna_archive',JSON.stringify(updated));}catch{}return updated;});
  };
  if (table==='estimates') {
    const {projectId, estimate} = item;
    setProjectEstimates(prev=>({...prev,[projectId]:[...(prev[projectId]||[]),estimate]}));
    removeFromArchive();
    return;
  }
  if (table==='todos') {
    setTodos(prev=>[...prev,item]);
    removeFromArchive();
    return;
  }
  if (table==='dashNotes') {
    setDashNotesList(prev=>[item,...prev]);
    removeFromArchive();
    return;
  }
  if (table==='notes') {
    setNotes(prev=>[item,...prev]);
    removeFromArchive();
    return;
  }
  if (table==='projects') {
    setLocalProjects(prev=>[...prev,item]);
    removeFromArchive();
    return;
  }
  if (table==='callSheets') {
    const {projectId, callSheet} = item;
    setCallSheetStore(prev=>{const s=JSON.parse(JSON.stringify(prev));if(!s[projectId])s[projectId]=[];s[projectId].push(callSheet);return s;});
    removeFromArchive();
    return;
  }
  if (table==='riskAssessments') {
    const {projectId, riskAssessment} = item;
    setRiskAssessmentStore(prev=>{const s=JSON.parse(JSON.stringify(prev));if(!s[projectId])s[projectId]=[];s[projectId].push(riskAssessment);return s;});
    removeFromArchive();
    return;
  }
  if (table==='contracts') {
    const {projectId, contract} = item;
    setContractDocStore(prev=>{const s=JSON.parse(JSON.stringify(prev));if(!s[projectId])s[projectId]=[];s[projectId].push(contract);return s;});
    removeFromArchive();
    return;
  }
  if (table==='travelItineraries') {
    const {projectId, travelItinerary} = item;
    setTravelItineraryStore(prev=>{const s=JSON.parse(JSON.stringify(prev));if(!s[projectId])s[projectId]=[];s[projectId].push(travelItinerary);return s;});
    removeFromArchive();
    return;
  }
  if (table==='dietaries') {
    const {projectId, dietary} = item;
    setDietaryStore(prev=>{const s=JSON.parse(JSON.stringify(prev));if(!s[projectId])s[projectId]=[];s[projectId].push(dietary);return s;});
    removeFromArchive();
    return;
  }
  if (table==='locationDecks') {
    const {projectId, locationDeck} = item;
    setLocDeckStore(prev=>{const s=JSON.parse(JSON.stringify(prev));if(!s[projectId])s[projectId]=[];s[projectId].push(locationDeck);return s;});
    removeFromArchive();
    return;
  }
  if (table==='clients') {
    const {id:_cId, ...clientFields} = item;
    const saved = await api.post('/api/clients', clientFields);
    if (saved.id) setLocalClients(prev=>[...prev,saved]);
    removeFromArchive();
    return;
  }
  const {id:_origId, ...fields} = item;
  const saved = await api.post(`/api/${table}`, fields);
  if (saved.id) {
    if (table==='leads') setLocalLeads(prev=>[...prev,saved]);
    else if (table==='vendors') setVendors(prev=>[...prev,saved]);
    else if (table==='outreach') setOutreach(prev=>[...prev,saved]);
  }
  removeFromArchive();
};

export const permanentlyDelete = (archiveId, setArchive) => {
  setArchive(prev=>{
    const updated=prev.filter(e=>e.id!==archiveId);
    try{localStorage.setItem('onna_archive',JSON.stringify(updated));}catch{}
    return updated;
  });
};

// ── AI project processing ────────────────────────────────────────────────────

export const processProjectAI = async (p, aiMsg, attachedFile, setAiLoading, setProjectEntries, setAiMsg, setAttachedFile) => {
  if (!aiMsg.trim()&&!attachedFile) return;
  setAiLoading(true);
  let fileData=null;
  if (attachedFile) fileData = await new Promise(resolve=>{const r=new FileReader();r.onload=e=>resolve(e.target.result.split(",")[1]);r.readAsDataURL(attachedFile);});
  const messages=[{role:"user",content:attachedFile?[{type:"image",source:{type:"base64",media_type:attachedFile.type,data:fileData}},{type:"text",text:`${aiMsg}\n\nExtract all financial info and return ONLY a JSON array, no markdown.`}]:aiMsg}];
  try {
    const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:1200,system:"Extract expense/income entries for ONNA. Return ONLY a raw JSON array. Each entry: supplier, category, subCategory, invoiceNumber, receiptLink, datePaid, amount (number only), direction (in/out), notes.",messages});
    const parsed=JSON.parse((data?.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
    setProjectEntries(prev=>({...prev,[p.id]:[...(prev[p.id]||[]),...(Array.isArray(parsed)?parsed:[parsed]).map((e,i)=>({...e,id:Date.now()+i}))]}));
    setAiMsg(""); setAttachedFile(null);
  } catch {}
  setAiLoading(false);
};

// ── Google Calendar ──────────────────────────────────────────────────────────

export const fetchGCalEvents = async (token, month, setGcalLoading, setGcalEventColors, setGcalEvents) => {
  setGcalLoading(true);
  const yr = month.getFullYear(), mo = month.getMonth();
  const timeMin = new Date(yr, mo, 1).toISOString();
  const timeMax = new Date(yr, mo+1, 0, 23, 59, 59).toISOString();
  try {
    const params = new URLSearchParams({timeMin, timeMax, singleEvents:"true", orderBy:"startTime", maxResults:"250"});
    const [calListRes, colorsRes] = await Promise.all([
      fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250&showHidden=true",{headers:{Authorization:`Bearer ${token}`}}),
      fetch("https://www.googleapis.com/calendar/v3/colors",{headers:{Authorization:`Bearer ${token}`}})
    ]);
    const calList = await calListRes.json();
    const colorsData = await colorsRes.json().catch(()=>({}));
    if (colorsData.event) setGcalEventColors(colorsData.event);
    const calItems = calList.items||[];
    const allEventsArr = await Promise.all(calItems.map(cal=>
      fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${params}`,{headers:{Authorization:`Bearer ${token}`}})
        .then(r=>r.json()).then(d=>Array.isArray(d.items)?d.items.map(e=>({...e,calendarColor:cal.backgroundColor,calendarFg:cal.foregroundColor})):[]).catch(()=>[])
    ));
    setGcalEvents(allEventsArr.flat().sort((a,b)=>new Date(a.start?.dateTime||a.start?.date)-new Date(b.start?.dateTime||b.start?.date)));
  } catch {}
  setGcalLoading(false);
};

export const fetchOutlookCal = async (setOutlookLoading, setOutlookError, setOutlookEvents) => {
  setOutlookLoading(true);
  setOutlookError("");
  try {
    const res = await fetch("/api/proxy-ics");
    if (!res.ok) {
      const body = await res.text().catch(()=>"");
      throw new Error(`Proxy ${res.status}: ${body.slice(0,120)}`);
    }
    const text = await res.text();
    const evs = parseICS(text);
    setOutlookEvents(evs);
    try{sessionStorage.setItem('onna_outlook_evs',JSON.stringify(evs));}catch{}
  } catch(err) {
    console.error("Outlook ICS fetch failed:", err);
    setOutlookError(err.message||"Failed");
    try{const c=sessionStorage.getItem('onna_outlook_evs');if(c)setOutlookEvents(JSON.parse(c));}catch{}
  }
  setOutlookLoading(false);
};

export const connectGCal = (showAlert, calMonth, setGcalToken, fetchGCalEventsFn) => {
  if (!window.google?.accounts?.oauth2) {
    showAlert("Google Identity Services not loaded yet — please wait a moment and try again.");
    return;
  }
  window.google.accounts.oauth2.initTokenClient({
    client_id: GCAL_CLIENT_ID,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    callback: (resp) => {
      if (resp.access_token) {
        setGcalToken(resp.access_token);
        try{localStorage.setItem('onna_gcal_token',resp.access_token);localStorage.setItem('onna_gcal_exp',String(Date.now()+55*60*1000));localStorage.setItem('onna_gcal_connected','1');}catch{}
        fetchGCalEventsFn(resp.access_token, calMonth);
      }
    },
  }).requestAccessToken();
};

// ── Hydrate project ──────────────────────────────────────────────────────────

export const doHydrateProject = (pid, setters) => {
  const { setCallSheetStore, setRiskAssessmentStore, setContractDocStore, setProjectEstimates, setDietaryStore, setTravelItineraryStore, setShotListStore, setStoryboardStore, setFittingStore, setLocDeckStore, setCpsStore, setPostProdStore, setCastingTableStore, setCastingDeckStore, setRecceReportStore, setProjectInfo, setProjectCreativeLinks, setProjectActuals, setProjectCasting } = setters;
  return api.get(`/api/project-data/${pid}`).then(d => {
    if (!d) return;
    if (d.callsheets) setCallSheetStore(prev => ({...prev, [pid]: d.callsheets}));
    if (d.riskassessments) setRiskAssessmentStore(prev => ({...prev, [pid]: d.riskassessments}));
    if (d.contracts_doc) setContractDocStore(prev => ({...prev, [pid]: d.contracts_doc}));
    if (d.estimates) setProjectEstimates(prev => ({...prev, [pid]: d.estimates}));
    if (d.dietaries) setDietaryStore(prev => ({...prev, [pid]: d.dietaries}));
    if (d.travel_itineraries) setTravelItineraryStore(prev => ({...prev, [pid]: d.travel_itineraries}));
    if (d.shotlists) setShotListStore(prev => ({...prev, [pid]: d.shotlists}));
    if (d.storyboards) setStoryboardStore(prev => ({...prev, [pid]: d.storyboards}));
    if (d.fittings) setFittingStore(prev => ({...prev, [pid]: d.fittings}));
    if (d.loc_decks) setLocDeckStore(prev => ({...prev, [pid]: d.loc_decks}));
    if (d.cps) setCpsStore(prev => ({...prev, [pid]: d.cps}));
    if (d.postprod) setPostProdStore(prev => ({...prev, [pid]: d.postprod}));
    if (d.casting_tables) setCastingTableStore(prev => ({...prev, [pid]: d.casting_tables}));
    if (d.casting_decks) setCastingDeckStore(prev => ({...prev, [pid]: d.casting_decks}));
    if (d.recce_reports) setRecceReportStore(prev => ({...prev, [pid]: d.recce_reports}));
    if (d.project_info) setProjectInfo(prev => ({...prev, [pid]: d.project_info}));
    if (d.creative_links) setProjectCreativeLinks(prev => ({...prev, [pid]: d.creative_links}));
    if (d.project_actuals) setProjectActuals(prev => ({...prev, [pid]: d.project_actuals}));
    if (d.project_casting) setProjectCasting(prev => ({...prev, [pid]: d.project_casting}));
  }).catch(() => {});
};
