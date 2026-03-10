import React, { useState, useRef, useImperativeHandle } from "react";
import { validateImg } from "../ui/DocHelpers";

const PP_F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
const PP_LS = 0.5;
const PP_YEL = "#FFFDE7";

const PP_OWNER_COLORS = {
  "client": { bg: "#FFFDE7", border: "#E65100", text: "#E65100" },
  "editor": { bg: "#F3E5F5", border: "#7B1FA2", text: "#7B1FA2" },
  "grader": { bg: "#E3F2FD", border: "#1565C0", text: "#1565C0" },
  "colourist": { bg: "#E3F2FD", border: "#1565C0", text: "#1565C0" },
  "sound": { bg: "#FCE4EC", border: "#C2185B", text: "#C2185B" },
  "retoucher": { bg: "#E8F5E9", border: "#2E7D32", text: "#2E7D32" },
  "photographer": { bg: "#E8F5E9", border: "#388E3C", text: "#388E3C" },
  "dop": { bg: "#E8F5E9", border: "#388E3C", text: "#388E3C" },
  "director": { bg: "#FFF3E0", border: "#E65100", text: "#E65100" },
  "producer": { bg: "#FBE9E7", border: "#BF360C", text: "#BF360C" },
  "vfx": { bg: "#EDE7F6", border: "#4527A0", text: "#4527A0" },
  "motion": { bg: "#EDE7F6", border: "#4527A0", text: "#4527A0" },
  "music": { bg: "#FCE4EC", border: "#880E4F", text: "#880E4F" },
  "stylist": { bg: "#FFF8E1", border: "#F9A825", text: "#F9A825" },
};
const ppGetOwnerColor = (owner) => {
  if (!owner || !owner.startsWith("*")) return null;
  const key = owner.slice(1).trim().toLowerCase();
  for (const [k, v] of Object.entries(PP_OWNER_COLORS)) { if (key.includes(k)) return v; }
  return { bg: "#F5F5F5", border: "#999", text: "#666" };
};

const PP_EDIT_STATUSES = ["Not Started", "In Progress", "Final"];
const PP_EDIT_C = { "Not Started": { bg: "#f4f4f4", text: "#999" }, "In Progress": { bg: "#FFF3E0", text: "#E65100" }, "Final": { bg: "#000", text: "#fff" } };
const PP_DEL_STATUSES = ["Pending", "In Progress", "Review", "Delivered"];
const PP_DEL_C = { "Pending": { bg: "#f4f4f4", text: "#999" }, "In Progress": { bg: "#FFF3E0", text: "#E65100" }, "Review": { bg: "#E3F2FD", text: "#1565C0" }, "Delivered": { bg: "#000", text: "#fff" } };

const PP_PLATFORMS = ["Instagram", "TikTok", "YouTube", "Facebook", "X", "LinkedIn", "Broadcast / TV", "Print / OOH", "Digital Ads", "Website", "E-commerce", "Internal", "Other"];
const PP_RATIOS = ["16:9", "9:16", "4:5", "1:1", "4:3", "2.35:1", "Custom"];
const PP_RES_V = ["3840x2160 (4K)", "1920x1080 (HD)", "1080x1920 (Vert HD)", "1080x1350 (4:5)", "1080x1080 (1:1)", "Custom"];
const PP_RES_S = ["300dpi", "150dpi", "72dpi", "Custom"];
const PP_FMT_V = ["MP4", "MOV", "ProRes", "H.264", "H.265", "GIF", "Other"];
const PP_FMT_S = ["JPEG", "PNG", "TIFF", "PSD", "PDF", "RAW", "Other"];

let _ppId = 0;
export const ppMkVideo = () => ({ id: "pv" + (++_ppId), name: "", platform: "", ratio: "", resolution: "", format: "", duration: "", fps: "", notes: "", status: "Pending" });
export const ppMkStill = () => ({ id: "ps" + (++_ppId), name: "", platform: "", ratio: "", resolution: "", format: "", notes: "", status: "Pending" });
const ppMkTask = () => ({ id: "pt" + (++_ppId), task: "", owner: "", startDate: "", endDate: "", duration: "", status: "Not Started", notes: "" });

export const ppDefaultSchedule = () => [
  { ...ppMkTask(), task: "Selects & string-out", duration: "3 days" }, { ...ppMkTask(), task: "Offline edit v1", duration: "5 days" },
  { ...ppMkTask(), task: "Internal review", duration: "2 days" }, { ...ppMkTask(), task: "Client review \u2014 edit v1", duration: "3 days" },
  { ...ppMkTask(), task: "Amends / edit v2", duration: "3 days" }, { ...ppMkTask(), task: "Client review \u2014 edit v2", duration: "3 days" },
  { ...ppMkTask(), task: "Stills retouch", duration: "5 days" }, { ...ppMkTask(), task: "Colour grade", duration: "2 days" },
  { ...ppMkTask(), task: "Sound design & mix", duration: "3 days" }, { ...ppMkTask(), task: "Music licensing", duration: "5 days" },
  { ...ppMkTask(), task: "VFX / motion graphics", duration: "5 days" }, { ...ppMkTask(), task: "Online / conform", duration: "2 days" },
  { ...ppMkTask(), task: "Final client approval", duration: "2 days" }, { ...ppMkTask(), task: "Final renders & exports", duration: "2 days" },
  { ...ppMkTask(), task: "Asset delivery", duration: "1 day" },
];

const PpInp = ({ value, onChange, placeholder, style = {} }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ fontFamily: PP_F, fontSize: 9, letterSpacing: PP_LS, border: "none", outline: "none", padding: "3px 6px",
      background: value ? "transparent" : PP_YEL, boxSizing: "border-box", width: "100%", ...style }} />
);
const PpSel = ({ value, onChange, options, style = {} }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ fontFamily: PP_F, fontSize: 8, letterSpacing: PP_LS, border: "1px solid #f0f0f0", outline: "none", padding: "3px 4px",
      background: value ? "#fff" : PP_YEL, borderRadius: 2, cursor: "pointer", color: value ? "#1a1a1a" : "#999", width: "100%", boxSizing: "border-box", ...style }}>
    <option value="">&mdash;</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const PpClientLogo = () => {
  const [logo, setLogo] = useState(null);
  const [over, setOver] = useState(false);
  const hf = (files) => { const f = Array.from(files).find(f => f.type.startsWith("image/")); if (!validateImg(f)) return; const r = new FileReader(); r.onload = (e) => setLogo(e.target.result); r.readAsDataURL(f); };
  return (
    <div onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); hf(e.dataTransfer.files); }}
      style={{ width: 80, height: 32, borderRadius: 2, overflow: "hidden", position: "relative" }}>
      {logo ? (<><img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        <button data-hide="1" onClick={() => setLogo(null)} style={{ position: "absolute", top: -2, right: -2, background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 8, cursor: "pointer", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>&times;</button></>
      ) : (<label style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: over ? "1px dashed #FFD54F" : "1px dashed #ddd", background: over ? PP_YEL : "transparent", borderRadius: 2 }}>
        <span style={{ fontFamily: PP_F, fontSize: 6, color: "#ccc", letterSpacing: PP_LS }}>CLIENT LOGO</span>
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { hf(e.target.files); e.target.value = ""; }} />
      </label>)}
    </div>
  );
};

const ppVRow = (v, i, updateV, deleteV, dupeV) => {
  const ds = PP_DEL_C[v.status] || PP_DEL_C["Pending"];
  return (
    <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ width: 14 }}><button data-hide="1" onClick={() => deleteV(v.id)} style={{ background: "none", border: "none", color: "#ddd", fontSize: 10, cursor: "pointer", padding: 0, lineHeight: 1 }}>&times;</button></div>
      <div style={{ width: 20, fontFamily: PP_F, fontSize: 8, fontWeight: 700, color: "#ccc" }}>{i + 1}</div>
      <div style={{ flex: 2 }}><PpInp value={v.name} onChange={val => updateV(v.id, "name", val)} placeholder="Asset name" style={{ fontSize: 9, fontWeight: 600 }} /></div>
      <div style={{ width: 75 }}><PpSel value={v.platform} onChange={val => updateV(v.id, "platform", val)} options={PP_PLATFORMS} /></div>
      <div style={{ width: 50 }}><PpSel value={v.ratio} onChange={val => updateV(v.id, "ratio", val)} options={PP_RATIOS} /></div>
      <div style={{ width: 80 }}><PpSel value={v.resolution} onChange={val => updateV(v.id, "resolution", val)} options={PP_RES_V} /></div>
      <div style={{ width: 50 }}><PpSel value={v.format} onChange={val => updateV(v.id, "format", val)} options={PP_FMT_V} /></div>
      <div style={{ width: 40 }}><PpInp value={v.duration} onChange={val => updateV(v.id, "duration", val)} placeholder="30s" style={{ fontSize: 8 }} /></div>
      <div style={{ width: 30 }}><PpInp value={v.fps} onChange={val => updateV(v.id, "fps", val)} placeholder="25" style={{ fontSize: 8 }} /></div>
      <div style={{ width: 55 }}><div onClick={() => { const idx = PP_DEL_STATUSES.indexOf(v.status); updateV(v.id, "status", PP_DEL_STATUSES[(idx + 1) % PP_DEL_STATUSES.length]); }}
        style={{ fontFamily: PP_F, fontSize: 7, fontWeight: 700, letterSpacing: PP_LS, background: ds.bg, color: ds.text, padding: "3px 6px", borderRadius: 2, cursor: "pointer", textAlign: "center", textTransform: "uppercase" }}>{v.status}</div></div>
      <div style={{ flex: 0.8 }}><PpInp value={v.notes} onChange={val => updateV(v.id, "notes", val)} placeholder="Notes" style={{ fontSize: 8, color: "#999" }} /></div>
      <div style={{ width: 30 }}><button data-hide="1" onClick={() => dupeV(v.id)} style={{ background: "#f4f4f4", border: "none", fontFamily: PP_F, fontSize: 6, fontWeight: 700, color: "#999", cursor: "pointer", padding: "2px 5px", borderRadius: 2 }}>DUPE</button></div>
    </div>
  );
};

const ppSRow = (s, i, updateS, deleteS, dupeS) => {
  const ds = PP_DEL_C[s.status] || PP_DEL_C["Pending"];
  return (
    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ width: 14 }}><button data-hide="1" onClick={() => deleteS(s.id)} style={{ background: "none", border: "none", color: "#ddd", fontSize: 10, cursor: "pointer", padding: 0, lineHeight: 1 }}>&times;</button></div>
      <div style={{ width: 20, fontFamily: PP_F, fontSize: 8, fontWeight: 700, color: "#ccc" }}>{i + 1}</div>
      <div style={{ flex: 2 }}><PpInp value={s.name} onChange={val => updateS(s.id, "name", val)} placeholder="Asset name" style={{ fontSize: 9, fontWeight: 600 }} /></div>
      <div style={{ width: 75 }}><PpSel value={s.platform} onChange={val => updateS(s.id, "platform", val)} options={PP_PLATFORMS} /></div>
      <div style={{ width: 50 }}><PpSel value={s.ratio} onChange={val => updateS(s.id, "ratio", val)} options={PP_RATIOS} /></div>
      <div style={{ width: 80 }}><PpSel value={s.resolution} onChange={val => updateS(s.id, "resolution", val)} options={PP_RES_S} /></div>
      <div style={{ width: 50 }}><PpSel value={s.format} onChange={val => updateS(s.id, "format", val)} options={PP_FMT_S} /></div>
      <div style={{ width: 55 }}><div onClick={() => { const idx = PP_DEL_STATUSES.indexOf(s.status); updateS(s.id, "status", PP_DEL_STATUSES[(idx + 1) % PP_DEL_STATUSES.length]); }}
        style={{ fontFamily: PP_F, fontSize: 7, fontWeight: 700, letterSpacing: PP_LS, background: ds.bg, color: ds.text, padding: "3px 6px", borderRadius: 2, cursor: "pointer", textAlign: "center", textTransform: "uppercase" }}>{s.status}</div></div>
      <div style={{ flex: 1 }}><PpInp value={s.notes} onChange={val => updateS(s.id, "notes", val)} placeholder="Notes" style={{ fontSize: 8, color: "#999" }} /></div>
      <div style={{ width: 30 }}><button data-hide="1" onClick={() => dupeS(s.id)} style={{ background: "#f4f4f4", border: "none", fontFamily: PP_F, fontSize: 6, fontWeight: 700, color: "#999", cursor: "pointer", padding: "2px 5px", borderRadius: 2 }}>DUPE</button></div>
    </div>
  );
};

const ppVHeader = () => (
  <div style={{ display: "flex", background: "#f4f4f4", padding: "3px 8px", gap: 4, marginBottom: 1 }}>
    <div style={{ width: 14 }} /><div style={{ width: 20, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>#</div>
    <div style={{ flex: 2, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>ASSET NAME</div>
    <div style={{ width: 75, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>PLATFORM</div>
    <div style={{ width: 50, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>RATIO</div>
    <div style={{ width: 80, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>RESOLUTION</div>
    <div style={{ width: 50, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>FORMAT</div>
    <div style={{ width: 40, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>DUR.</div>
    <div style={{ width: 30, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>FPS</div>
    <div style={{ width: 55, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>STATUS</div>
    <div style={{ flex: 0.8, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>NOTES</div>
    <div style={{ width: 30 }} />
  </div>
);

const ppSHeader = () => (
  <div style={{ display: "flex", background: "#f4f4f4", padding: "3px 8px", gap: 4, marginBottom: 1 }}>
    <div style={{ width: 14 }} /><div style={{ width: 20, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>#</div>
    <div style={{ flex: 2, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>ASSET NAME</div>
    <div style={{ width: 75, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>PLATFORM</div>
    <div style={{ width: 50, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>RATIO</div>
    <div style={{ width: 80, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>DPI / SIZE</div>
    <div style={{ width: 50, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>FORMAT</div>
    <div style={{ width: 55, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>STATUS</div>
    <div style={{ flex: 1, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999" }}>NOTES</div>
    <div style={{ width: 30 }} />
  </div>
);

const ppSchedHeader = () => (
  <div style={{ display: "flex", background: "#000", padding: "4px 8px", gap: 4 }}>
    <div style={{ width: 14 }} /><div style={{ width: 20, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#fff" }}>#</div>
    <div style={{ flex: 2, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#fff" }}>TASK</div>
    <div style={{ flex: 0.8, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#fff" }}>OWNER</div>
    <div style={{ width: 50, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#fff" }}>START</div>
    <div style={{ width: 50, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#fff" }}>END</div>
    <div style={{ width: 40, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#fff" }}>DUR.</div>
    <div style={{ width: 70, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#fff" }}>STATUS</div>
    <div style={{ flex: 1, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#fff" }}>NOTES</div>
  </div>
);

const ppTaskRow = (task, ti, updateTask, deleteTask) => {
  const ts = PP_EDIT_C[task.status] || PP_EDIT_C["Not Started"];
  const oc = ppGetOwnerColor(task.owner);
  const isDone = task.status === "Final";
  const bg = () => PP_YEL;
  const tc = (v) => v ? "#1a1a1a" : "#999";
  return (
    <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderBottom: "1px solid #f0f0f0", background: oc ? oc.bg : "#fff", borderLeft: oc ? "3px solid " + oc.border : "3px solid transparent", opacity: isDone ? 0.5 : 1 }}>
      <div style={{ width: 14 }}><button data-hide="1" onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "#ddd", fontSize: 10, cursor: "pointer", padding: 0, lineHeight: 1 }}>&times;</button></div>
      <div style={{ width: 20, fontFamily: PP_F, fontSize: 8, fontWeight: 700, color: "#ccc" }}>{ti + 1}</div>
      <div style={{ flex: 2 }}><input value={task.task} onChange={e => updateTask(task.id, "task", e.target.value)} placeholder="Task"
        style={{ fontFamily: PP_F, fontSize: 9, letterSpacing: PP_LS, border: "none", outline: "none", padding: "3px 6px", width: "100%", boxSizing: "border-box", textDecoration: isDone ? "line-through" : "none", background: bg(task.task), color: tc(task.task) }} /></div>
      <div style={{ flex: 0.8 }}><input value={task.owner} onChange={e => updateTask(task.id, "owner", e.target.value)} placeholder="*Owner"
        style={{ fontFamily: PP_F, fontSize: 8, letterSpacing: PP_LS, border: "none", outline: "none", padding: "3px 6px", width: "100%", boxSizing: "border-box", color: oc ? oc.text : tc(task.owner), fontWeight: oc ? 700 : 400, background: bg(task.owner) }} /></div>
      <div style={{ width: 50 }}><input value={task.startDate} onChange={e => updateTask(task.id, "startDate", e.target.value)} placeholder="DD/MM"
        style={{ fontFamily: PP_F, fontSize: 8, letterSpacing: PP_LS, border: "none", outline: "none", padding: "3px 6px", width: "100%", boxSizing: "border-box", background: bg(task.startDate), color: tc(task.startDate) }} /></div>
      <div style={{ width: 50 }}><input value={task.endDate} onChange={e => updateTask(task.id, "endDate", e.target.value)} placeholder="DD/MM"
        style={{ fontFamily: PP_F, fontSize: 8, letterSpacing: PP_LS, border: "none", outline: "none", padding: "3px 6px", width: "100%", boxSizing: "border-box", background: bg(task.endDate), color: tc(task.endDate) }} /></div>
      <div style={{ width: 40 }}><input value={task.duration} onChange={e => updateTask(task.id, "duration", e.target.value)} placeholder="Days"
        style={{ fontFamily: PP_F, fontSize: 8, letterSpacing: PP_LS, border: "none", outline: "none", padding: "3px 6px", width: "100%", boxSizing: "border-box", background: bg(task.duration), color: tc(task.duration) }} /></div>
      <div style={{ width: 70 }}><div onClick={() => { const i = PP_EDIT_STATUSES.indexOf(task.status); updateTask(task.id, "status", PP_EDIT_STATUSES[(i + 1) % PP_EDIT_STATUSES.length]); }}
        style={{ fontFamily: PP_F, fontSize: 6, fontWeight: 700, letterSpacing: PP_LS, background: ts.bg, color: ts.text, padding: "3px 6px", borderRadius: 2, cursor: "pointer", textTransform: "uppercase", textAlign: "center" }}>{task.status}</div></div>
      <div style={{ flex: 1 }}><input value={task.notes} onChange={e => updateTask(task.id, "notes", e.target.value)} placeholder="Notes"
        style={{ fontFamily: PP_F, fontSize: 8, letterSpacing: PP_LS, border: "none", outline: "none", padding: "3px 6px", width: "100%", boxSizing: "border-box", background: bg(task.notes), color: tc(task.notes) }} /></div>
    </div>
  );
};

const ppColorKey = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6, padding: "4px 0" }}>
    <div style={{ fontFamily: PP_F, fontSize: 7, fontWeight: 700, letterSpacing: PP_LS, color: "#ccc" }}>KEY:</div>
    {Object.entries(PP_OWNER_COLORS).filter(([k]) => ["client", "editor", "grader", "sound", "retoucher", "director", "producer", "vfx", "music"].includes(k)).map(([k, v]) => (
      <div key={k} style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <div style={{ width: 8, height: 8, borderRadius: 1, background: v.bg, border: "1px solid " + v.border }} />
        <span style={{ fontFamily: PP_F, fontSize: 6, fontWeight: 700, letterSpacing: PP_LS, color: v.text, textTransform: "uppercase" }}>*{k}</span>
      </div>
    ))}
  </div>
);

const PostPolly = React.forwardRef(function PostPollyInner({ initialProject, initialVideos, initialStills, initialSchedule, initialSpecNotes, initialFeedback, onChangeProject, onChangeVideos, onChangeStills, onChangeSchedule, onChangeSpecNotes, onChangeFeedback, onShareUrl }, fwdRef) {
  const _fitMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const [project, setProjectRaw] = useState(() => initialProject || { name: "", client: "", date: "", editor: "", colourist: "", sound: "", filesLink: "" });
  const [tab, setTab] = useState("master");
  const [schedView, setSchedView] = useState("list");
  const printRef = useRef(null);
  const [videos, setVideosRaw] = useState(() => initialVideos || [ppMkVideo(), ppMkVideo()]);
  const [stills, setStillsRaw] = useState(() => initialStills || [ppMkStill(), ppMkStill()]);
  const [specNotes, setSpecNotesRaw] = useState(() => initialSpecNotes || "");
  const [schedule, setScheduleRaw] = useState(() => initialSchedule || ppDefaultSchedule());
  const [feedback, setFeedbackRaw] = useState(() => initialFeedback || {});
  const setProject = (u) => { setProjectRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeProject) onChangeProject(next); return next; }); };
  const setVideos = (u) => { setVideosRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeVideos) onChangeVideos(next); return next; }); };
  const setStills = (u) => { setStillsRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeStills) onChangeStills(next); return next; }); };
  const setSchedule = (u) => { setScheduleRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeSchedule) onChangeSchedule(next); return next; }); };
  const setSpecNotes = (val) => { setSpecNotesRaw(val); if (onChangeSpecNotes) onChangeSpecNotes(val); };
  const setFeedback = (u) => { setFeedbackRaw(prev => { const next = typeof u === "function" ? u(prev) : u; if (onChangeFeedback) onChangeFeedback(next); return next; }); };
  const updateV = (id, k, v) => setVideos(p => p.map(x => x.id === id ? { ...x, [k]: v } : x));
  const addV = () => setVideos(p => [...p, ppMkVideo()]);
  const deleteV = (id) => setVideos(p => p.filter(x => x.id !== id));
  const dupeV = (id) => { const s = videos.find(x => x.id === id); if (s) setVideos(p => { const i = p.findIndex(x => x.id === id); const n = [...p]; n.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(s)), id: "pv" + (++_ppId) }); return n; }); };
  const updateS = (id, k, v) => setStills(p => p.map(x => x.id === id ? { ...x, [k]: v } : x));
  const addS = () => setStills(p => [...p, ppMkStill()]);
  const deleteS = (id) => setStills(p => p.filter(x => x.id !== id));
  const dupeS = (id) => { const s = stills.find(x => x.id === id); if (s) setStills(p => { const i = p.findIndex(x => x.id === id); const n = [...p]; n.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(s)), id: "ps" + (++_ppId) }); return n; }); };
  const updateTask = (id, k, v) => setSchedule(p => p.map(t => t.id === id ? { ...t, [k]: v } : t));
  const addTask = () => setSchedule(p => [...p, ppMkTask()]);
  const deleteTask = (id) => setSchedule(p => p.filter(t => t.id !== id));
  const setFb = (tid, k, v) => setFeedback(p => ({ ...p, [tid]: { ...(p[tid] || {}), [k]: v } }));
  const reviewTasks = schedule.filter(t => t.task.toLowerCase().includes("review") || t.task.toLowerCase().includes("approval"));
  const schedComplete = schedule.filter(t => t.status === "Final").length;
  const ppCleanClone = (el) => { const clone = el.cloneNode(true); clone.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"],[class*="extension"]').forEach(n=>n.remove()); clone.querySelectorAll('iframe,object,embed').forEach(n=>n.remove()); return clone; };
  const collectFontRules = () => { let r=""; try{for(const s of document.styleSheets){try{for(const ru of s.cssRules){if(ru.cssText&&ru.cssText.startsWith("@font-face"))r+=ru.cssText+"\n";}}catch(e){}}}catch(e){} return r; };
  const ppPrintViaIframe = (clone) => { const fontRules = collectFontRules(); const iframe = document.createElement("iframe"); iframe.style.cssText = "position:fixed;top:0;left:0;width:1200px;height:100%;border:none;z-index:-9999;opacity:0;"; document.body.appendChild(iframe); const idoc = iframe.contentDocument; idoc.open(); idoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><base href="${window.location.origin}/"><title>\u200B</title><style>@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap');${fontRules}*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}body{background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:10px;color:#1a1a1a;padding:12mm;padding-bottom:18mm}.page-break{page-break-before:always}@media print{@page{size:landscape;margin:0}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`); idoc.close(); idoc.body.appendChild(idoc.adoptNode(clone)); const _imgs=[...idoc.querySelectorAll('img')];const _imgReady=_imgs.map(im=>im.complete?Promise.resolve():new Promise(r=>{im.onload=r;im.onerror=r;})); Promise.all(_imgReady).then(()=>{setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 300);}); };
  const exportPDF = () => { const el = printRef.current; if (!el) return; ppPrintViaIframe(ppCleanClone(el)); };
  const generateSharePage = async (modes, existingToken, existingResourceId) => { const captureHtml = () => { const el = printRef.current; if (!el) return null; const clone = ppCleanClone(el); clone.querySelectorAll('input').forEach(n => { const sp = document.createElement('span'); sp.textContent = n.value; sp.style.cssText = n.style.cssText; n.replaceWith(sp); }); clone.querySelectorAll('select').forEach(n => { const sp = document.createElement('span'); sp.textContent = n.value || ""; sp.style.fontFamily = PP_F; sp.style.fontSize = "8px"; n.replaceWith(sp); }); clone.querySelectorAll('textarea').forEach(n => { const sp = document.createElement('span'); sp.textContent = n.value || ""; sp.style.cssText = n.style.cssText; sp.style.whiteSpace = "pre-wrap"; n.replaceWith(sp); }); clone.querySelectorAll('[data-hide]').forEach(n => n.remove()); clone.querySelectorAll('img').forEach(im => { if(im.src && !im.src.startsWith('data:') && !im.src.startsWith('http')) im.src = window.location.origin + im.getAttribute('src'); }); return clone.innerHTML; }; const html = captureHtml(); if (!html) return; try { const body = { html, projectName: project.name || "Post-Production", clientName: project.client || "", mode: "postprod" }; if (existingToken) body.token = existingToken; if (existingResourceId) body.resourceId = existingResourceId; const resp = await fetch("/api/postprod-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await resp.json(); if (data.url) { if (onShareUrl) onShareUrl(data.url, data.token, data.id); else { await navigator.clipboard.writeText(data.url).catch(() => {}); showAlert("Link copied to clipboard!\n\n" + data.url); } } else { showAlert("Failed to generate link: " + (data.error || "Unknown error")); } } catch (err) { showAlert("Error generating link: " + err.message); } };
  useImperativeHandle(fwdRef, () => ({ share: generateSharePage }));
  const parseDate = (d) => { if (!d) return null; const p = d.split("/"); if (p.length < 2) return null; const day = parseInt(p[0]), mon = parseInt(p[1]) - 1, yr = p[2] ? parseInt(p[2]) : new Date().getFullYear(); const dt = new Date(yr, mon, day); return isNaN(dt.getTime()) ? null : dt; };
  const taskDates = schedule.map(t => ({ ...t, start: parseDate(t.startDate), end: parseDate(t.endDate) })).filter(t => t.start);
  const calendarWeeks = (() => { if (taskDates.length === 0) return []; const allD = taskDates.flatMap(t => [t.start, t.end].filter(Boolean)); const mn = new Date(Math.min(...allD.map(d => d.getTime()))); const mx = new Date(Math.max(...allD.map(d => d.getTime()))); mn.setDate(mn.getDate() - (mn.getDay() || 7) + 1); mx.setDate(mx.getDate() + (7 - mx.getDay()) % 7); const weeks = []; const d = new Date(mn); while (d <= mx) { const wk = []; for (let i = 0; i < 7; i++) { wk.push(new Date(d)); d.setDate(d.getDate() + 1); } weeks.push(wk); } return weeks; })();
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const today = new Date(); today.setHours(0,0,0,0);
  const renderVideoSection = () => (<div><div style={{ display: "flex", alignItems: "center", background: "#000", padding: "4px 8px", justifyContent: "space-between", marginBottom: 1 }}><span style={{ fontFamily: PP_F, fontSize: 9, fontWeight: 700, letterSpacing: PP_LS, color: "#fff" }}>VIDEO ({videos.length})</span><span data-hide="1" onClick={addV} style={{ fontFamily: PP_F, fontSize: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", letterSpacing: PP_LS }}>+ ADD</span></div><div style={{ overflowX: "auto" }}>{ppVHeader()}{videos.map((v, i) => ppVRow(v, i, updateV, deleteV, dupeV))}</div></div>);
  const renderStillsSection = () => (<div><div style={{ display: "flex", alignItems: "center", background: "#000", padding: "4px 8px", justifyContent: "space-between", marginBottom: 1 }}><span style={{ fontFamily: PP_F, fontSize: 9, fontWeight: 700, letterSpacing: PP_LS, color: "#fff" }}>STILLS ({stills.length})</span><span data-hide="1" onClick={addS} style={{ fontFamily: PP_F, fontSize: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", letterSpacing: PP_LS }}>+ ADD</span></div><div style={{ overflowX: "auto" }}>{ppSHeader()}{stills.map((s, i) => ppSRow(s, i, updateS, deleteS, dupeS))}</div></div>);
  const renderSchedule = () => (<div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 6, borderBottom: "2px solid #000", paddingBottom: 4 }}><span style={{ fontFamily: PP_F, fontSize: 9, fontWeight: 700, letterSpacing: PP_LS }}>POST SCHEDULE ({schedComplete}/{schedule.length} COMPLETE)</span><div data-hide="1" style={{ display: "flex", gap: 0, borderRadius: 2, overflow: "hidden", border: "1px solid #ddd" }}>{[["list", "LIST"], ["calendar", "CALENDAR"]].map(([id, label]) => (<div key={id} onClick={() => setSchedView(id)} style={{ fontFamily: PP_F, fontSize: 7, fontWeight: 700, letterSpacing: PP_LS, padding: "3px 10px", cursor: "pointer", background: schedView === id ? "#000" : "#fff", color: schedView === id ? "#fff" : "#999", borderRight: id === "list" ? "1px solid #ddd" : "none" }}>{label}</div>))}</div></div>{schedView === "list" ? (<div style={{ overflowX: "auto" }}>{ppSchedHeader()}{schedule.map((t, i) => ppTaskRow(t, i, updateTask, deleteTask))}<div data-hide="1" style={{ marginTop: 2 }}><div onClick={addTask} style={{ display: "flex", alignItems: "center", background: "#f4f4f4", padding: "5px 8px", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "#eee"} onMouseLeave={e => e.currentTarget.style.background = "#f4f4f4"}><span style={{ fontFamily: PP_F, fontSize: 8, fontWeight: 700, letterSpacing: PP_LS, color: "#999" }}>+ ADD TASK</span></div></div></div>) : (taskDates.length === 0 ? <div style={{ fontFamily: PP_F, fontSize: 9, color: "#ccc", padding: "20px 0", textAlign: "center" }}>Add start dates (DD/MM) to see calendar.</div> : (<div><div style={{ display: "flex", borderBottom: "1px solid #eee", marginBottom: 4 }}><div style={{ width: 40 }} />{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => <div key={d} style={{ flex: 1, fontFamily: PP_F, fontSize: 7, fontWeight: 700, letterSpacing: PP_LS, color: "#999", textAlign: "center", padding: "3px 0" }}>{d}</div>)}</div>{calendarWeeks.map((week, wi) => { const showMonth = wi === 0 || week[0].getMonth() !== calendarWeeks[wi - 1][0].getMonth(); return (<div key={wi} style={{ display: "flex", minHeight: 28 }}><div style={{ width: 40, fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#999", letterSpacing: PP_LS, paddingTop: 2 }}>{showMonth ? months[week[0].getMonth()] : ""}</div>{week.map((date, di) => { const isToday = date.getTime() === today.getTime(); const tasksOn = taskDates.filter(t => { const end = t.end || t.start; return date >= t.start && date <= end; }); return (<div key={di} style={{ flex: 1, borderRight: "1px solid #f4f4f4", borderBottom: "1px solid #f4f4f4", padding: "2px 3px", background: isToday ? "#FFFDE7" : di >= 5 ? "#fafafa" : "#fff", minHeight: 24 }}><div style={{ fontFamily: PP_F, fontSize: 7, color: isToday ? "#E65100" : "#ccc", fontWeight: isToday ? 700 : 400 }}>{date.getDate()}</div>{tasksOn.map(t => { const oc = ppGetOwnerColor(t.owner); const ts = PP_EDIT_C[t.status] || PP_EDIT_C["Not Started"]; return (<div key={t.id} style={{ fontFamily: PP_F, fontSize: 6, fontWeight: 600, letterSpacing: PP_LS, padding: "1px 3px", marginTop: 1, borderRadius: 1, background: oc ? oc.bg : ts.bg, color: oc ? oc.text : ts.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: oc ? "2px solid " + oc.border : "none" }}>{t.task}</div>); })}</div>); })}</div>); })}</div>))}{ppColorKey()}</div>);
  const renderFeedback = () => (<div><div style={{ marginTop: 20, marginBottom: 6, fontFamily: PP_F, fontSize: 9, fontWeight: 700, letterSpacing: PP_LS, borderBottom: "2px solid #000", paddingBottom: 4 }}>REVIEW &amp; FEEDBACK ({reviewTasks.length} ROUNDS)</div>{reviewTasks.map((task, ri) => { const ts = PP_EDIT_C[task.status] || PP_EDIT_C["Not Started"]; const fb = feedback[task.id] || {}; return (<div key={task.id} style={{ marginBottom: 6, border: "1px solid #eee", borderLeft: "3px solid " + ts.text, borderRadius: 2, overflow: "hidden" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", background: "#f8f8f8", borderBottom: "1px solid #eee" }}><span style={{ fontFamily: PP_F, fontSize: 9, fontWeight: 700, letterSpacing: PP_LS }}>ROUND {ri + 1}: {task.task}</span><div onClick={() => { const i = PP_EDIT_STATUSES.indexOf(task.status); updateTask(task.id, "status", PP_EDIT_STATUSES[(i + 1) % PP_EDIT_STATUSES.length]); }} style={{ fontFamily: PP_F, fontSize: 7, fontWeight: 700, letterSpacing: PP_LS, background: ts.bg, color: ts.text, padding: "3px 10px", borderRadius: 2, cursor: "pointer", textTransform: "uppercase" }}>{task.status}</div></div><div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: fb.link ? "#E3F2FD" : "#fff", borderBottom: "1px solid #eee" }}><span style={{ fontFamily: PP_F, fontSize: 7, fontWeight: 700, letterSpacing: PP_LS, color: "#1565C0", flexShrink: 0 }}>LINK TO FILES:</span><PpInp value={fb.link || ""} onChange={v => setFb(task.id, "link", v)} placeholder="Paste link to files..." style={{ fontSize: 8, color: "#1565C0", background: "transparent", flex: 1 }} />{fb.link && <a href={(fb.link || "").startsWith("http") ? fb.link : "https://" + fb.link} target="_blank" rel="noopener noreferrer" style={{ fontFamily: PP_F, fontSize: 7, fontWeight: 700, color: "#1565C0", textDecoration: "none", padding: "2px 6px", background: "#fff", borderRadius: 2, border: "1px solid #90CAF9", flexShrink: 0 }}>OPEN &#8599;</a>}</div><textarea value={fb.body || ""} onChange={e => setFb(task.id, "body", e.target.value)} placeholder="Feedback, amends, action items..." style={{ fontFamily: PP_F, fontSize: 9, letterSpacing: PP_LS, border: "none", outline: "none", width: "100%", padding: "6px 10px", color: "#333", minHeight: 40, resize: "none", boxSizing: "border-box", lineHeight: 1.6, background: fb.body ? "#fff" : "#E3F2FD" }} /></div>); })}{reviewTasks.length === 0 && <div style={{ fontFamily: PP_F, fontSize: 9, color: "#ccc", padding: "20px 0", textAlign: "center" }}>No review tasks in schedule yet.</div>}</div>);
  const renderNotes = () => (<div style={{ marginBottom: 10 }}><div style={{ fontFamily: PP_F, fontSize: 7, fontWeight: 700, letterSpacing: PP_LS, color: "#999", marginBottom: 2 }}>DELIVERABLES NOTES</div><textarea value={specNotes} onChange={e => setSpecNotes(e.target.value)} placeholder="General delivery notes, naming, transfer method..." style={{ fontFamily: PP_F, fontSize: 9, letterSpacing: PP_LS, border: "1px solid #eee", outline: "none", width: "100%", padding: "6px 8px", color: "#333", minHeight: 30, resize: "none", boxSizing: "border-box", lineHeight: 1.5, borderRadius: 2, background: specNotes ? "#fff" : PP_YEL }} /></div>);
  return (
    <div style={{ width: _fitMobile ? "100%" : 1123, minWidth: _fitMobile ? 0 : 1123, margin: "0 auto", background: "#fff", fontFamily: PP_F, color: "#1a1a1a" }}>
      <div style={{ display: "flex", borderBottom: "2px solid #000", overflowX: "auto" }}>
        {[{ id: "master", label: "MASTER" }, { id: "video", label: "VIDEO" }, { id: "stills", label: "STILLS" }].map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ fontFamily: PP_F, fontSize: 9, fontWeight: tab === t.id ? 700 : 400, letterSpacing: PP_LS, padding: _fitMobile ? "8px 10px" : "10px 16px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, background: tab === t.id ? "#000" : "#f5f5f5", color: tab === t.id ? "#fff" : "#666", textTransform: "uppercase", borderRight: "1px solid #ddd" }}>{t.label}</div>
        ))}
        <div style={{ flex: 1 }} />
        <div onClick={exportPDF} style={{ fontFamily: PP_F, fontSize: 9, fontWeight: 700, letterSpacing: PP_LS, padding: _fitMobile ? "8px 10px" : "10px 16px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, background: "#000", color: "#fff", textTransform: "uppercase", borderLeft: "1px solid #333" }}>EXPORT PDF</div>
      </div>
      <div ref={printRef} style={{ padding: "16px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, borderBottom: "2.5px solid #000", paddingBottom: 8, flexWrap: _fitMobile ? "wrap" : "nowrap", gap: _fitMobile ? 8 : 0 }}>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 400, letterSpacing: 1 }}>onna</span>
          <div style={{ fontFamily: PP_F, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>POST-PRODUCTION</div>
          <PpClientLogo />
        </div>
        <div style={{ display: "flex", gap: _fitMobile ? 8 : 10, marginBottom: 6, flexWrap: "wrap" }}>
          {[["PROJECT", "name", "Project Name"], ["CLIENT", "client", "Client"], ["DATE", "date", "Date"], ["EDITOR", "editor", "Editor"], ["COLOURIST", "colourist", "Colourist"], ["SOUND", "sound", "Sound"]].map(([lbl, key, ph]) => (
            <div key={key} style={{ display: "flex", gap: 4, alignItems: "baseline", flex: 1, minWidth: _fitMobile ? "45%" : "auto" }}>
              <span style={{ fontFamily: PP_F, fontSize: 9, fontWeight: 700, letterSpacing: PP_LS }}>{lbl}:</span>
              <PpInp value={project[key]} onChange={v => setProject(p => ({ ...p, [key]: v }))} placeholder={ph} style={{ width: 90, borderBottom: "1px solid #eee" }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "5px 10px", background: project.filesLink ? "#E3F2FD" : "#f8f8f8", borderRadius: 2, border: project.filesLink ? "1px solid #90CAF9" : "1px solid #eee" }}>
          <span style={{ fontFamily: PP_F, fontSize: 8, fontWeight: 700, letterSpacing: PP_LS, color: "#1565C0", flexShrink: 0 }}>LINK TO FILES:</span>
          <PpInp value={project.filesLink} onChange={v => setProject(p => ({ ...p, filesLink: v }))} placeholder="Paste link to files (Frame.io, Drive, Dropbox)..." style={{ fontSize: 9, color: "#1565C0", background: "transparent", flex: 1 }} />
          {project.filesLink && <a href={project.filesLink.startsWith("http") ? project.filesLink : "https://" + project.filesLink} target="_blank" rel="noopener noreferrer" style={{ fontFamily: PP_F, fontSize: 8, fontWeight: 700, letterSpacing: PP_LS, color: "#1565C0", textDecoration: "none", flexShrink: 0, padding: "2px 8px", background: "#fff", borderRadius: 2, border: "1px solid #90CAF9" }}>OPEN &#8599;</a>}
        </div>
        {tab === "master" && <div>{renderNotes()}{renderVideoSection()}<div style={{ marginTop: 12 }} />{renderStillsSection()}{renderSchedule()}{renderFeedback()}</div>}
        {tab === "video" && <div>{renderNotes()}{renderVideoSection()}{renderSchedule()}{renderFeedback()}</div>}
        {tab === "stills" && <div>{renderNotes()}{renderStillsSection()}{renderSchedule()}{renderFeedback()}</div>}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", fontFamily: PP_F, fontSize: 9, letterSpacing: PP_LS, color: "#000", borderTop: "2px solid #000", paddingTop: 10 }}>
          <div><div style={{ fontWeight: 700 }}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700 }}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
        </div>
      </div>
    </div>
  );
});


/* ======= CASTING TABLE CONNIE ======= */

export default PostPolly;
