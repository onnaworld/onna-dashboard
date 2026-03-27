import React, { useState, useRef, useCallback, useEffect } from "react";

const CS_FONT = "'Avenir','Avenir Next','Nunito Sans',sans-serif";

const makeBrief = (projectId) => ({
  id: Date.now() + Math.random(),
  projectId,
  title: "PRODUCTION BRIEF",
  prodLogo: null,
  clientLogo: null,
  sectionTitles: { 1: "PROJECT OVERVIEW", 2: "CREATIVE DIRECTION", 3: "CREW", 4: "SCHEDULE", 5: "QUOTE", 6: "ONNA" },
  onnaContent: "",
  projectFields: [
    { id: Date.now()+0.01, label: "PROJECT NAME", value: "" },
    { id: Date.now()+0.02, label: "CLIENT", value: "" },
    { id: Date.now()+0.03, label: "PRODUCTION", value: "" },
    { id: Date.now()+0.04, label: "PHOTOGRAPHER / DIRECTOR", value: "" },
    { id: Date.now()+0.05, label: "SHOOT DATES", value: "" },
  ],
  overviewFields: [
    { id: Date.now()+0.06, label: "NUMBER OF TRAVEL DAYS", value: "" },
    { id: Date.now()+0.07, label: "NUMBER OF RECCE DAYS", value: "" },
    { id: Date.now()+0.08, label: "NUMBER OF SHOOT DAYS", value: "" },
    { id: Date.now()+0.09, label: "NUMBER OF INTERNATIONAL CREW", value: "" },
    { id: Date.now()+0.10, label: "TOTAL CREW", value: "" },
  ],
  creativeFields: [
    { id: Date.now()+0.15, label: "DESCRIPTION", value: "", type: "textarea" },
    { id: Date.now()+0.16, label: "REFERENCES", value: "", type: "textarea" },
    { id: Date.now()+0.17, label: "VISUAL NOTES", value: "", type: "textarea" },
  ],
  crew: {
    client: [{ id: Date.now()+0.1, role: "", name: "" }],
    production: [{ id: Date.now()+0.2, role: "", name: "" }],
    video: [{ id: Date.now()+0.3, role: "", name: "" }],
    photo: [{ id: Date.now()+0.4, role: "", name: "" }],
    wardrobe: [{ id: Date.now()+0.5, role: "", name: "" }],
    hairMakeup: [{ id: Date.now()+0.6, role: "", name: "" }],
    casting: [{ id: Date.now()+0.7, role: "", name: "" }],
    miscellaneous: [{ id: Date.now()+0.8, role: "", name: "" }],
  },
  localCrewCategories: [
    { id: Date.now()+0.9, label: "FIXERS", members: [{ id: Date.now()+0.91, role: "", name: "" }] },
    { id: Date.now()+0.11, label: "DRIVERS", members: [{ id: Date.now()+0.111, role: "", name: "" }] },
    { id: Date.now()+0.12, label: "SECURITY", members: [{ id: Date.now()+0.121, role: "", name: "" }] },
    { id: Date.now()+0.13, label: "EXTRAS", members: [{ id: Date.now()+0.131, role: "", name: "" }] },
    { id: Date.now()+0.14, label: "MISCELLANEOUS", members: [{ id: Date.now()+0.141, role: "", name: "" }] },
  ],
  scheduleFields: [
    { id: Date.now()+0.18, label: "STRUCTURE", value: "", type: "textarea" },
    { id: Date.now()+0.19, label: "KEY MOMENTS", value: "", type: "textarea" },
  ],
  quote: [
    { id: Date.now()+0.21, heading: "CREW", lines: [{ id: Date.now()+0.211, label: "", value: "" }] },
    { id: Date.now()+0.22, heading: "TRANSPORT", lines: [{ id: Date.now()+0.221, label: "", value: "" }] },
    { id: Date.now()+0.23, heading: "CATERING", lines: [{ id: Date.now()+0.231, label: "", value: "" }] },
    { id: Date.now()+0.24, heading: "ACCOMMODATION", lines: [{ id: Date.now()+0.241, label: "", value: "" }] },
    { id: Date.now()+0.25, heading: "LOCATION", lines: [{ id: Date.now()+0.251, label: "", value: "" }] },
    { id: Date.now()+0.26, heading: "PERMITS", lines: [{ id: Date.now()+0.261, label: "", value: "" }] },
  ],
  extraSections: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const PRINT_CLEANUP_CSS = '[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]{display:none!important;}';

// Strip HTML tags from old contentEditable values
// contentEditable input — supports formatting toolbar, same as PBTextarea but inline-sized
const PBInp = ({ value, onChange, placeholder, style: s = {}, onFocusEditor }) => {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.innerHTML = value || ""; }, []);
  const handleInput = () => { if (ref.current) onChange(ref.current.innerHTML); };
  const handleFocus = () => { if (onFocusEditor) onFocusEditor(ref.current); };
  const isEmpty = !value || value === "<br>" || value === "<div><br></div>";
  return (
    <div style={{ position: "relative", ...s }}>
      {isEmpty && !ref.current?.innerHTML?.replace(/<br>/g, "").trim() && (
        <div data-hide="1" style={{ position: "absolute", top: 3, left: 6, fontFamily: CS_FONT, fontSize: 9, color: "#999", pointerEvents: "none", letterSpacing: 0.5 }}>{placeholder}</div>
      )}
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={handleInput} onFocus={handleFocus}
        style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, border: "none", outline: "none", padding: "3px 6px",
          background: "transparent", boxSizing: "border-box", width: "100%", color: "#000",
          lineHeight: 1.5, minHeight: 20 }} />
    </div>
  );
};

// contentEditable textarea with label — supports formatting toolbar
const PBTextarea = ({ label, value, onChange, placeholder, style: s = {}, onFocusEditor }) => {
  const ref = useRef(null);
  const DEFAULT_BULLET = "<ul><li><br></li></ul>";
  // Only set innerHTML on mount — never touch it again to preserve cursor
  useEffect(() => { if (ref.current) ref.current.innerHTML = value || DEFAULT_BULLET; }, []);
  const handleInput = () => { if (ref.current) onChange(ref.current.innerHTML); };
  const handleFocus = () => { if (onFocusEditor) onFocusEditor(ref.current); };
  const isEmpty = !value || value === "<br>" || value === "<div><br></div>" || value === DEFAULT_BULLET || value === "<ul><li><br></li></ul>";
  return (
    <div style={{ flex: 1, minWidth: 140, position: "relative", ...s }}>
      {label && <div style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", marginBottom: 2 }}>{label}</div>}
      {isEmpty && !ref.current?.innerHTML?.replace(/<ul><li><br><\/li><\/ul>/g, "").trim() && (
        <div data-hide="1" style={{ position: "absolute", top: label ? 18 : 0, left: 28, fontFamily: CS_FONT, fontSize: 9, color: "#999", pointerEvents: "none", letterSpacing: 0.5 }}>{placeholder}</div>
      )}
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={handleInput} onFocus={handleFocus}
        style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, border: "1px solid #eee", outline: "none", width: "100%",
          padding: "6px 8px", color: "#000", minHeight: 22, boxSizing: "border-box", lineHeight: 1.5,
          borderRadius: 2, background: isEmpty ? "#FFFDE7" : "#fff" }} />
    </div>
  );
};

// Editable label — shows as text, becomes input on double-click
const EditableLabel = ({ value, onChange, style: s = {}, minWidth = 60, gray }) => {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);
  const grayStyle = gray ? GRAY_BOX : {};
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  if (editing) {
    return (
      <input ref={ref} value={value || ""} onChange={e => onChange(e.target.value)}
        onBlur={() => setEditing(false)} onKeyDown={e => { if (e.key === "Enter") setEditing(false); }}
        style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000",
          border: "1px solid #ccc", outline: "none", background: "#FFFDE7", padding: "1px 4px",
          textTransform: "uppercase", minWidth, ...grayStyle, ...s }} />
    );
  }
  return (
    <span onDoubleClick={() => setEditing(true)}
      style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000",
        whiteSpace: "nowrap", minWidth, cursor: "default", ...(gray ? { display: "block" } : {}), ...grayStyle, ...s }}
      title="Double-click to edit">{value || "LABEL"}</span>
  );
};

// Section title — editable on double-click, with hide-from-export toggle
const SectionTitle = ({ title, num, onEdit, hidden, onToggleHidden }) => {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  if (editing && onEdit) {
    return (
      <div style={{ marginBottom: 6, borderBottom: "1px solid #eee", paddingBottom: 3 }}>
        <input ref={ref} value={title} onChange={e => onEdit(e.target.value)}
          onBlur={() => setEditing(false)} onKeyDown={e => { if (e.key === "Enter") setEditing(false); }}
          style={{ fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#000",
            border: "1px solid #ccc", outline: "none", background: "#FFFDE7", padding: "1px 4px",
            textTransform: "uppercase", width: "80%" }} />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 14, marginBottom: 10, borderBottom: "1px solid #eee", paddingBottom: 4 }}>
      <div onDoubleClick={() => onEdit && setEditing(true)} title={onEdit ? "Double-click to edit" : undefined}
        style={{ fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: hidden ? "#bbb" : "#000",
          cursor: onEdit ? "default" : undefined, flex: 1, textDecoration: hidden ? "line-through" : "none" }}>
        {num ? `${num}. ` : ""}{title}
      </div>
      {onToggleHidden && (
        <button data-hide="1" onClick={onToggleHidden} title={hidden ? "Show in export" : "Hide from export"}
          style={{ background: "none", border: "1px solid #ddd", borderRadius: 4, padding: "2px 8px", cursor: "pointer",
            fontFamily: CS_FONT, fontSize: 7, fontWeight: 600, letterSpacing: 0.3, color: hidden ? "#c0392b" : "#999",
            flexShrink: 0 }}>
          {hidden ? "HIDDEN" : "HIDE"}
        </button>
      )}
    </div>
  );
};

const CREW_CATEGORIES = [
  ["client", "CLIENT"], ["production", "PRODUCTION"], ["video", "VIDEO"],
  ["photo", "PHOTO"], ["wardrobe", "WARDROBE"], ["hairMakeup", "HAIR & MAKEUP"],
  ["casting", "CASTING"], ["miscellaneous", "MISCELLANEOUS"],
];
const GRAY_BOX = { background: "#f2f2f2", padding: "3px 8px", borderRadius: 2 };

// × button — hidden until parent .pb-row:hover
const DelBtn = ({ onClick }) => (
  <button data-hide="1" onClick={onClick} className="pb-action"
    style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 11, fontFamily: CS_FONT, padding: "0 4px", lineHeight: 1, flexShrink: 0, opacity: 0, transition: "opacity 0.15s" }}>×</button>
);
// + button — hidden until parent .pb-row:hover
const AddBtn = ({ onClick, label = "+" }) => (
  <div data-hide="1" onClick={onClick} className="pb-action"
    style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", cursor: "pointer", padding: "1px 6px", border: "1px dashed #ccc", borderRadius: 2, letterSpacing: 0.5, display: "inline-block", opacity: 0, transition: "opacity 0.15s" }}>{label}</div>
);

// Stable contentEditable
const ExtraEditor = ({ id, content, editorRefs, focusedSection, setFocusedSection, updateExtraContent, onFocusEditor }) => {
  const ref = useRef(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (ref.current && !mounted.current) {
      ref.current.innerHTML = content || "";
      mounted.current = true;
    }
  }, []);
  useEffect(() => { editorRefs.current[id] = ref.current; }, [id, editorRefs]);
  const focused = focusedSection === id;
  return (
    <div ref={ref} contentEditable suppressContentEditableWarning
      onFocus={() => { setFocusedSection(id); if (onFocusEditor) onFocusEditor(ref.current); }} onBlur={() => setFocusedSection(null)}
      onInput={() => updateExtraContent(id)}
      style={{ fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, lineHeight: 1.6,
        border: `1px solid ${focused ? "#000" : "#eee"}`,
        outline: "none", width: "100%", padding: "6px 8px", color: "#333",
        minHeight: 40, boxSizing: "border-box", borderRadius: 2,
        background: (ref.current?.innerHTML) ? "#fff" : "#FFFDE7", transition: "border-color 0.15s" }} />
  );
};

export default function ProductionBrief({
  T, isMobile, p,
  productionBriefStore, setProductionBriefStore,
  setCreativeSubSection, pushNav, showAlert, buildPath,
  CSLogoSlot,
}) {
  const brief = productionBriefStore[p.id] || null;
  const editorRefs = useRef({});
  const [focusedSection, setFocusedSection] = useState(null);
  const migrationDone = useRef(false);

  useEffect(() => {
    if (migrationDone.current) return;
    if (!brief) {
      // Don't auto-create — user creates briefs from Budget section
      migrationDone.current = true;
      return;
    } else if (brief && !brief.projectFields) {
      // Migrate old-format data to new dynamic fields format
      const pr = brief.project || {};
      const ov = brief.overview || {};
      const cr = brief.creative || {};
      const sc = brief.schedule || {};
      const migrated = {
        ...brief,
        sectionTitles: brief.sectionTitles || { 1: "PROJECT OVERVIEW", 2: "CREATIVE DIRECTION", 3: "CREW", 4: "SCHEDULE", 5: "QUOTE" },
        projectFields: [
          { id: Date.now()+0.01, label: "PROJECT NAME", value: pr.name || "" },
          { id: Date.now()+0.02, label: "CLIENT", value: pr.client || "" },
          { id: Date.now()+0.03, label: "PRODUCTION", value: pr.producer || "" },
          { id: Date.now()+0.04, label: "PHOTOGRAPHER / DIRECTOR", value: pr.director || "" },
          { id: Date.now()+0.05, label: "SHOOT DATES", value: pr.date || "" },
        ],
        overviewFields: [
          { id: Date.now()+0.06, label: "NUMBER OF TRAVEL DAYS", value: sc.travelDays || "" },
          { id: Date.now()+0.07, label: "NUMBER OF RECCE DAYS", value: sc.recceDays || "" },
          { id: Date.now()+0.08, label: "NUMBER OF SHOOT DAYS", value: sc.shootDays || "" },
          { id: Date.now()+0.09, label: "NUMBER OF INTERNATIONAL CREW", value: ov.crewCount || "" },
          { id: Date.now()+0.10, label: "TOTAL CREW", value: ov.totalCrew || "" },
        ],
        creativeFields: [
          { id: Date.now()+0.15, label: "DESCRIPTION", value: cr.direction || "", type: "textarea" },
          { id: Date.now()+0.16, label: "REFERENCES", value: cr.references || "" },
          { id: Date.now()+0.17, label: "VISUAL NOTES", value: cr.tone || "" },
        ],
        scheduleFields: [
          { id: Date.now()+0.18, label: "STRUCTURE", value: sc.structure || "", type: "textarea" },
          { id: Date.now()+0.19, label: "KEY MOMENTS", value: sc.keyMoments || "", type: "textarea" },
        ],
        localCrewCategories: brief.localCrewCategories || (() => {
          const lcl = brief.localCrewList || {};
          return [
            { id: Date.now()+0.9, label: "FIXERS", members: lcl.fixers || [{ id: Date.now()+0.91, role: "", name: "" }] },
            { id: Date.now()+0.11, label: "DRIVERS", members: lcl.drivers || [{ id: Date.now()+0.111, role: "", name: "" }] },
            { id: Date.now()+0.12, label: "SECURITY", members: lcl.security || [{ id: Date.now()+0.121, role: "", name: "" }] },
            { id: Date.now()+0.13, label: "EXTRAS", members: lcl.extras || [{ id: Date.now()+0.131, role: "", name: "" }] },
            { id: Date.now()+0.14, label: "MISCELLANEOUS", members: lcl.miscellaneous || [{ id: Date.now()+0.141, role: "", name: "" }] },
          ];
        })(),
        quote: brief.quote || makeBrief(p.id).quote,
        updatedAt: Date.now(),
      };
      setProductionBriefStore(prev => ({ ...prev, [p.id]: migrated }));
      migrationDone.current = true;
    } else if (brief && brief.projectFields && brief._v !== 4) {
      // One-time repair pass (v4) — runs once then sets _v flag
      const patched = { ...brief, _v: 4 };

      if (!patched.localCrewCategories) {
        const lcl = brief.localCrewList || {};
        patched.localCrewCategories = [
          { id: Date.now()+0.9, label: "FIXERS", members: lcl.fixers || [{ id: Date.now()+0.91, role: "", name: "" }] },
          { id: Date.now()+0.11, label: "DRIVERS", members: lcl.drivers || [{ id: Date.now()+0.111, role: "", name: "" }] },
          { id: Date.now()+0.12, label: "SECURITY", members: lcl.security || [{ id: Date.now()+0.121, role: "", name: "" }] },
          { id: Date.now()+0.13, label: "EXTRAS", members: lcl.extras || [{ id: Date.now()+0.131, role: "", name: "" }] },
          { id: Date.now()+0.14, label: "MISCELLANEOUS", members: lcl.miscellaneous || [{ id: Date.now()+0.141, role: "", name: "" }] },
        ];
      }

      // Fill in missing labels on projectFields
      const pfDefaults = ["PROJECT NAME", "CLIENT", "PRODUCTION", "PHOTOGRAPHER / DIRECTOR", "SHOOT DATES"];
      while (patched.projectFields.length < 5) patched.projectFields.push({ id: Date.now() + Math.random(), label: "", value: "" });
      patched.projectFields.forEach((f, i) => { if (!f.label && pfDefaults[i]) f.label = pfDefaults[i]; });

      // Fill in missing labels on overviewFields
      const ofDefaults = ["NUMBER OF TRAVEL DAYS", "NUMBER OF RECCE DAYS", "NUMBER OF SHOOT DAYS", "NUMBER OF INTERNATIONAL CREW", "TOTAL CREW"];
      while (patched.overviewFields.length < 5) patched.overviewFields.push({ id: Date.now() + Math.random(), label: "", value: "" });
      patched.overviewFields.forEach((f, i) => { if (!f.label && ofDefaults[i]) f.label = ofDefaults[i]; });

      // Ensure creativeFields have defaults
      if (!patched.creativeFields || patched.creativeFields.length === 0) {
        patched.creativeFields = [
          { id: Date.now()+0.15, label: "DESCRIPTION", value: "", type: "textarea" },
          { id: Date.now()+0.16, label: "REFERENCES", value: "", type: "textarea" },
          { id: Date.now()+0.17, label: "VISUAL NOTES", value: "", type: "textarea" },
        ];
      } else {
        // Ensure at least DESCRIPTION/REFERENCES/VISUAL NOTES exist
        ["DESCRIPTION", "REFERENCES", "VISUAL NOTES"].forEach(lbl => {
          if (!patched.creativeFields.some(f => f.label === lbl)) {
            patched.creativeFields.push({ id: Date.now() + Math.random(), label: lbl, value: "", type: "textarea" });
          }
        });
      }

      // Ensure scheduleFields have defaults
      if (!patched.scheduleFields || patched.scheduleFields.length === 0) {
        patched.scheduleFields = [
          { id: Date.now()+0.18, label: "STRUCTURE", value: "", type: "textarea" },
          { id: Date.now()+0.19, label: "KEY MOMENTS", value: "", type: "textarea" },
        ];
      }

      // Ensure quote sections exist
      if (!patched.quote || patched.quote.length === 0) {
        patched.quote = makeBrief(p.id).quote;
      }

      if (!patched.sectionTitles) patched.sectionTitles = { 1: "PROJECT OVERVIEW", 2: "CREATIVE DIRECTION", 3: "CREW", 4: "SCHEDULE", 5: "QUOTE", 6: "ONNA" };

      patched.updatedAt = Date.now();
      setProductionBriefStore(prev => ({ ...prev, [p.id]: patched }));
      migrationDone.current = true;
    } else {
      // Brief exists, has projectFields, and _v === 4 — no migration needed
      migrationDone.current = true;
    }
  }, [p.id, brief, setProductionBriefStore]);

  const update = useCallback((fn) => {
    setProductionBriefStore(prev => {
      const b = prev[p.id];
      if (!b) return prev;
      return { ...prev, [p.id]: { ...fn(b), updatedAt: Date.now() } };
    });
  }, [p.id, setProductionBriefStore]);

  // Section title editor
  const setSectionTitle = useCallback((num, val) => {
    update(b => ({ ...b, sectionTitles: { ...(b.sectionTitles || {}), [num]: val } }));
  }, [update]);

  // Dynamic field helpers for projectFields, overviewFields, creativeFields, scheduleFields
  const addField = useCallback((arrKey, type) => {
    update(b => ({ ...b, [arrKey]: [...(b[arrKey] || []), { id: Date.now() + Math.random(), label: "", value: "", type: type || undefined }] }));
  }, [update]);
  const removeField = useCallback((arrKey, id) => {
    update(b => ({ ...b, [arrKey]: (b[arrKey] || []).filter(f => f.id !== id) }));
  }, [update]);
  const updateField = useCallback((arrKey, id, key, val) => {
    update(b => ({ ...b, [arrKey]: (b[arrKey] || []).map(f => f.id === id ? { ...f, [key]: val } : f) }));
  }, [update]);

  // Crew member helpers
  const addCrewMember = useCallback((catKey) => {
    update(b => ({ ...b, crew: { ...b.crew, [catKey]: [...(b.crew[catKey] || []), { id: Date.now() + Math.random(), role: "", name: "" }] } }));
  }, [update]);
  const removeCrewMember = useCallback((catKey, memberId) => {
    update(b => ({ ...b, crew: { ...b.crew, [catKey]: (b.crew[catKey] || []).filter(m => m.id !== memberId) } }));
  }, [update]);
  const updateCrewMember = useCallback((catKey, memberId, field, val) => {
    update(b => ({ ...b, crew: { ...b.crew, [catKey]: (b.crew[catKey] || []).map(m => m.id === memberId ? { ...m, [field]: val } : m) } }));
  }, [update]);

  // Local crew dynamic category helpers
  const addLocalCategory = useCallback(() => {
    update(b => ({ ...b, localCrewCategories: [...(b.localCrewCategories || []), { id: Date.now() + Math.random(), label: "", members: [{ id: Date.now() + Math.random(), role: "", name: "" }] }] }));
  }, [update]);
  const removeLocalCategory = useCallback((catId) => {
    update(b => ({ ...b, localCrewCategories: (b.localCrewCategories || []).filter(c => c.id !== catId) }));
  }, [update]);
  const updateLocalCategoryLabel = useCallback((catId, label) => {
    update(b => ({ ...b, localCrewCategories: (b.localCrewCategories || []).map(c => c.id === catId ? { ...c, label } : c) }));
  }, [update]);
  const addLocalCrewMember = useCallback((catId) => {
    update(b => ({ ...b, localCrewCategories: (b.localCrewCategories || []).map(c => c.id === catId ? { ...c, members: [...(c.members || []), { id: Date.now() + Math.random(), role: "", name: "" }] } : c) }));
  }, [update]);
  const removeLocalCrewMember = useCallback((catId, memberId) => {
    update(b => ({ ...b, localCrewCategories: (b.localCrewCategories || []).map(c => c.id === catId ? { ...c, members: (c.members || []).filter(m => m.id !== memberId) } : c) }));
  }, [update]);
  const updateLocalCrewMember = useCallback((catId, memberId, field, val) => {
    update(b => ({ ...b, localCrewCategories: (b.localCrewCategories || []).map(c => c.id === catId ? { ...c, members: (c.members || []).map(m => m.id === memberId ? { ...m, [field]: val } : m) } : c) }));
  }, [update]);

  // Quote section helpers
  const addQuoteSection = useCallback(() => {
    update(b => ({ ...b, quote: [...(b.quote || []), { id: Date.now() + Math.random(), heading: "", lines: [{ id: Date.now() + Math.random(), label: "", value: "" }] }] }));
  }, [update]);
  const removeQuoteSection = useCallback((id) => {
    update(b => ({ ...b, quote: (b.quote || []).filter(q => q.id !== id) }));
  }, [update]);
  const updateQuoteHeading = useCallback((id, heading) => {
    update(b => ({ ...b, quote: (b.quote || []).map(q => q.id === id ? { ...q, heading } : q) }));
  }, [update]);
  const addQuoteLine = useCallback((sectionId) => {
    update(b => ({ ...b, quote: (b.quote || []).map(q => q.id === sectionId ? { ...q, lines: [...(q.lines || []), { id: Date.now() + Math.random(), label: "", value: "" }] } : q) }));
  }, [update]);
  const removeQuoteLine = useCallback((sectionId, lineId) => {
    update(b => ({ ...b, quote: (b.quote || []).map(q => q.id === sectionId ? { ...q, lines: (q.lines || []).filter(l => l.id !== lineId) } : q) }));
  }, [update]);
  const updateQuoteLine = useCallback((sectionId, lineId, field, val) => {
    update(b => ({ ...b, quote: (b.quote || []).map(q => q.id === sectionId ? { ...q, lines: (q.lines || []).map(l => l.id === lineId ? { ...l, [field]: val } : l) } : q) }));
  }, [update]);

  // Section visibility for export
  const hiddenSections = brief?.hiddenSections || [];
  const toggleSectionHidden = useCallback((num) => {
    update(b => {
      const hs = b.hiddenSections || [];
      return { ...b, hiddenSections: hs.includes(num) ? hs.filter(n => n !== num) : [...hs, num] };
    });
  }, [update]);

  const lastFocusedEditor = useRef(null);
  const savedRange = useRef(null);

  // Save selection whenever it changes inside a contentEditable
  useEffect(() => {
    const saveSelection = () => {
      const sel = window.getSelection();
      if (sel.rangeCount > 0 && lastFocusedEditor.current && lastFocusedEditor.current.contains(sel.anchorNode)) {
        savedRange.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener("selectionchange", saveSelection);
    return () => document.removeEventListener("selectionchange", saveSelection);
  }, []);

  const fmt = (cmd, val) => {
    const editor = lastFocusedEditor.current;
    if (!editor) return;
    // Ensure editor has focus
    editor.focus();
    // Restore saved selection range
    if (savedRange.current) {
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange.current);
      } catch (e) { /* range may be invalid */ }
    }
    // For color/highlight, use span wrapping as fallback if execCommand fails
    const sel = window.getSelection();
    if ((cmd === "foreColor" || cmd === "hiliteColor") && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      if (cmd === "foreColor") span.style.color = val;
      else if (cmd === "hiliteColor") span.style.backgroundColor = val === "transparent" ? "" : val;
      try { range.surroundContents(span); } catch (e) {
        // If surroundContents fails (crosses element boundaries), use execCommand
        document.execCommand(cmd, false, val || null);
      }
    } else {
      document.execCommand(cmd, false, val || null);
    }
    // Save the new range after formatting
    const sel2 = window.getSelection();
    if (sel2.rangeCount > 0) savedRange.current = sel2.getRangeAt(0).cloneRange();
    // Trigger input event to save changes
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  };

  // Extra freeform sections
  const addExtra = useCallback(() => {
    update(b => ({ ...b, extraSections: [...(b.extraSections || []), { id: Date.now() + Math.random(), heading: "", content: "" }] }));
  }, [update]);
  const removeExtra = useCallback((id) => {
    update(b => ({ ...b, extraSections: (b.extraSections || []).filter(s => s.id !== id) }));
  }, [update]);
  const updateExtraHeading = useCallback((id, heading) => {
    update(b => ({ ...b, extraSections: (b.extraSections || []).map(s => s.id === id ? { ...s, heading } : s) }));
  }, [update]);
  const updateExtraContent = useCallback((id) => {
    const el = editorRefs.current[id];
    if (!el) return;
    update(b => ({ ...b, extraSections: (b.extraSections || []).map(s => s.id === id ? { ...s, content: el.innerHTML } : s) }));
  }, [update]);

  // PDF export
  const exportPDF = useCallback(() => {
    const el = document.getElementById("onna-prodbr-print");
    if (!el) return;
    const clone = el.cloneNode(true);
    // Remove hidden sections
    const hs = brief?.hiddenSections || [];
    clone.querySelectorAll("[data-section]").forEach(sec => {
      if (hs.includes(parseInt(sec.dataset.section))) sec.remove();
    });
    clone.querySelectorAll("[data-hide]").forEach(n => n.remove());
    clone.querySelectorAll("input, textarea").forEach(inp => {
      if (!inp.value || !inp.value.trim()) {
        // Hide just this empty input, not the whole row
        inp.style.display = "none";
      } else {
        const s = document.createElement("span"); s.textContent = inp.value; s.style.cssText = inp.style.cssText; s.style.border = "none"; s.style.background = "none"; inp.replaceWith(s);
      }
    });
    // Hide rows where ALL inputs/textareas/contentEditables are empty
    clone.querySelectorAll(".pb-row").forEach(row => {
      const hasContent = [...row.querySelectorAll("span, [contenteditable]")].some(el => (el.textContent || "").trim());
      if (!hasContent) row.style.display = "none";
    });
    clone.querySelectorAll("[contenteditable]").forEach(el => {
      el.removeAttribute("contenteditable");
      el.style.border = "none";
      el.style.borderBottom = "none";
      el.style.background = "none";
      // Hide empty contentEditable areas
      const text = el.textContent || "";
      if (!text.trim()) {
        // Hide parent wrapper too if it has a border
        if (el.parentElement) el.parentElement.style.borderBottom = "none";
        el.style.display = "none";
      }
      // Also strip border from parent wrapper
      if (el.parentElement) el.parentElement.style.borderBottom = "none";
    });
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    doc.open();
    const pbTitle = `Production Brief | ${p?.name||""}`;
    doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${pbTitle}</title><style>*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{margin:0;padding:10mm 12mm;background:#fff;font-family:'Avenir','Avenir Next','Nunito Sans',sans-serif;font-size:10px;color:#1a1a1a;line-height:1.6}ul,ol{margin:4px 0;padding-left:20px;list-style-position:outside}ul{list-style-type:disc}ol{list-style-type:decimal}li{margin:3px 0;display:list-item}div{display:block}p{margin:2px 0}[contenteditable] div,[contenteditable] p{margin:0;min-height:1.2em}@media print{@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);
    doc.close();
    doc.body.appendChild(doc.adoptNode(clone));
    const prevTitle=document.title;document.title=pbTitle;const restoreTitle=()=>{document.title=prevTitle;try{document.body.removeChild(iframe);}catch{}window.removeEventListener("afterprint",restoreTitle);};window.addEventListener("afterprint",restoreTitle);
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); }, 300);
  }, [brief]);

  if (!brief) return null;

  const st = brief.sectionTitles || {};
  const pf = brief.projectFields || [];
  const of_ = brief.overviewFields || [];
  const cf = brief.creativeFields || [];
  const sf = brief.scheduleFields || [];
  const cw = brief.crew || {};
  const extras = brief.extraSections || [];

  const TBtnStyle = { height: 22, minWidth: 22, borderRadius: 2, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 11, fontFamily: CS_FONT, padding: "0 4px", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" };

  const trackEditor = (el) => { lastFocusedEditor.current = el; };

  // Render a dynamic field row — inline function (NOT a component) to avoid remount on re-render
  const renderFieldRow = (field, arrKey) => (
    <div key={field.id} className="pb-row" style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 1 }}>
      <EditableLabel value={field.label} onChange={v => updateField(arrKey, field.id, "label", v)} minWidth={arrKey === "overviewFields" ? 180 : 140} style={{ flexShrink: 0 }} />
      {field.type === "textarea" ? (
        <PBTextarea value={field.value} onChange={v => updateField(arrKey, field.id, "value", v)} placeholder="..." style={{ flex: 1, minWidth: 0 }} onFocusEditor={trackEditor} />
      ) : (
        <PBInp value={field.value} onChange={v => updateField(arrKey, field.id, "value", v)} placeholder="..." style={{ flex: 1, borderBottom: "1px solid #eee", minWidth: arrKey === "overviewFields" ? 100 : 0 }} onFocusEditor={trackEditor} />
      )}
      <DelBtn onClick={() => removeField(arrKey, field.id)} />
      <AddBtn onClick={() => addField(arrKey, field.type)} />
    </div>
  );

  return (
    <div>
      <style>{`.pb-row:hover .pb-action { opacity: 1 !important; }`}</style>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={() => { setCreativeSubSection(null); window.history.back(); }} style={{ background: "none", border: "none", color: T.link, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>‹ Back to Creative</button>
        <div style={{ flex: 1 }} />
        <button onClick={exportPDF} style={{ padding: "6px 16px", borderRadius: 8, background: "#1d1d1f", color: "#fff", border: "none", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Export PDF</button>
      </div>

      {/* Formatting toolbar — fixed floating bar */}
      <div data-hide="1" onMouseDown={e => e.preventDefault()} style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 3, background: "rgba(250,250,250,0.97)", flexWrap: "wrap", borderRadius: 8, border: "1px solid #ddd", boxShadow: "0 2px 12px rgba(0,0,0,0.10)", position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1000, maxWidth: 680 }}>
        <button onMouseDown={e => { e.preventDefault(); fmt("bold"); }} style={{ ...TBtnStyle, fontWeight: 700 }}>B</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("italic"); }} style={{ ...TBtnStyle, fontStyle: "italic" }}>I</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("underline"); }} style={{ ...TBtnStyle, textDecoration: "underline" }}>U</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("strikeThrough"); }} style={{ ...TBtnStyle, textDecoration: "line-through" }}>S</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("insertUnorderedList"); }} title="Bullet list" style={{ ...TBtnStyle, fontSize: 12 }}>•≡</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("insertOrderedList"); }} title="Numbered list" style={{ ...TBtnStyle, fontSize: 10 }}>1≡</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("indent"); }} title="Indent" style={TBtnStyle}>→</button>
        <button onMouseDown={e => { e.preventDefault(); fmt("outdent"); }} title="Outdent" style={TBtnStyle}>←</button>
        <div style={{ width: 1, height: 16, background: "#ddd", margin: "0 2px" }} />
        <select onMouseDown={e => e.stopPropagation()} onChange={e => { fmt("fontName", e.target.value); }} defaultValue="" style={{ ...TBtnStyle, minWidth: 80, padding: "0 4px", fontSize: 10 }}>
          <option value="">Font</option>
          <option value="Arial, sans-serif">Sans-serif</option>
          <option value="Georgia, serif">Serif</option>
          <option value="monospace">Mono</option>
          <option value="'Trebuchet MS'">Trebuchet</option>
          <option value="'Courier New'">Courier</option>
        </select>
        <select onMouseDown={e => e.stopPropagation()} onChange={e => { fmt("fontSize", e.target.value); }} defaultValue="" style={{ ...TBtnStyle, width: 44, padding: "0 4px", fontSize: 10 }}>
          <option value="">Size</option>
          <option value="1">XS</option>
          <option value="2">S</option>
          <option value="3">M</option>
          <option value="4">L</option>
          <option value="5">XL</option>
          <option value="6">XXL</option>
        </select>
        <div style={{ width: 1, height: 16, background: "#ddd", margin: "0 2px" }} />
        {["#1d1d1f", "#c0392b", "#1a56db", "#147d50", "#8e24aa", "#e67e22"].map(c => (
          <button key={c} onMouseDown={e => { e.preventDefault(); fmt("foreColor", c); }} title={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: "1.5px solid rgba(0,0,0,0.18)", cursor: "pointer", padding: 0, flexShrink: 0 }} />
        ))}
        <div style={{ width: 1, height: 16, background: "#ddd", margin: "0 2px" }} />
        {[["#fff176", "Yellow"], ["#b3f0d4", "Green"], ["#b3d4f5", "Blue"], ["#ffd6d6", "Red"]].map(([bg, lbl]) => (
          <button key={bg} onMouseDown={e => { e.preventDefault(); fmt("hiliteColor", bg); }} title={`Highlight ${lbl}`} style={{ width: 14, height: 14, borderRadius: 2, background: bg, border: "1.5px solid rgba(0,0,0,0.12)", cursor: "pointer", padding: 0, flexShrink: 0 }} />
        ))}
        <button onMouseDown={e => { e.preventDefault(); fmt("hiliteColor", "transparent"); }} title="Clear highlight" style={{ ...TBtnStyle, fontSize: 9, color: "#999", minWidth: 14, width: 14, padding: 0 }}>✕</button>
      </div>

      {/* ── Print container ── */}
      <div id="onna-prodbr-print" style={{ background: "transparent", padding: 0, fontFamily: CS_FONT, borderRadius: 0 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", background: "#fff", border: "1px solid #eee", borderRadius: 4 }}>

          {/* Logo header */}
          <div style={{ padding: "20px 16px 0" }}>
            <img src="/onna-default-logo.png" alt="ONNA" style={{ maxHeight: 30, maxWidth: 120, objectFit: "contain" }} />
            <div style={{ borderBottom: "2.5px solid #000", marginBottom: 12, marginTop: 4 }} />
            <div style={{ fontFamily: CS_FONT, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>PRODUCTION BRIEF</div>
          </div>

          {/* ── 1. PROJECT OVERVIEW ── */}
          <div data-section="1">
          <div style={{ padding: "0 16px" }}>
            <SectionTitle title={st[1] || "PROJECT OVERVIEW"} num={1} onEdit={v => setSectionTitle(1, v)} hidden={hiddenSections.includes(1)} onToggleHidden={() => toggleSectionHidden(1)} />
          </div>
          <div style={{ padding: "0 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: isMobile ? "wrap" : "nowrap" }}>
              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
                {pf.map(f => renderFieldRow(f, "projectFields"))}
                {pf.length === 0 && <AddBtn onClick={() => addField("projectFields")} label="+ ROW" />}
              </div>
              {/* Right column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 280, flex: 0 }}>
                {of_.map(f => renderFieldRow(f, "overviewFields"))}
                {of_.length === 0 && <AddBtn onClick={() => addField("overviewFields")} label="+ ROW" />}
              </div>
            </div>
          </div>
          </div>

          <div style={{ padding: "0 16px" }}>

            {/* ── 2. CREATIVE DIRECTION ── */}
            <div data-section="2">
            <SectionTitle title={st[2] || "CREATIVE DIRECTION"} num={2} onEdit={v => setSectionTitle(2, v)} hidden={hiddenSections.includes(2)} onToggleHidden={() => toggleSectionHidden(2)} />
            {cf.map(f => (
              <div key={f.id} className="pb-row" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <EditableLabel value={f.label} onChange={v => updateField("creativeFields", f.id, "label", v)} />
                  <DelBtn onClick={() => removeField("creativeFields", f.id)} />
                  <AddBtn onClick={() => addField("creativeFields", "textarea")} />
                </div>
                <PBTextarea value={f.value} onChange={v => updateField("creativeFields", f.id, "value", v)} placeholder="..." style={{ minWidth: "100%" }} onFocusEditor={trackEditor} />
              </div>
            ))}
            {cf.length === 0 && <AddBtn onClick={() => addField("creativeFields", "textarea")} label="+ ROW" />}
            </div>

            {/* ── 3. CREW ── */}
            <div data-section="3">
            <SectionTitle title={st[3] || "CREW"} num={3} onEdit={v => setSectionTitle(3, v)} hidden={hiddenSections.includes(3)} onToggleHidden={() => toggleSectionHidden(3)} />

            {/* International Crew + Local Crew side by side */}
            <div style={{ display: "flex", gap: 24, flexWrap: isMobile ? "wrap" : "nowrap" }}>
              {/* International Crew */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: CS_FONT, fontSize: 7.5, fontWeight: 700, letterSpacing: 0.5, color: "#000", marginBottom: 8, marginTop: 4, ...GRAY_BOX, padding: "5px 10px" }}>INTERNATIONAL CREW</div>
                {(() => {
                  let globalIdx = 0;
                  return CREW_CATEGORIES.map(([catKey, catLabel]) => {
                    const members = (cw[catKey] || []);
                    return (
                      <div key={catKey} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <div style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000" }}>{catLabel}</div>
                          <AddBtn onClick={() => addCrewMember(catKey)} />
                        </div>
                        {members.map((m) => {
                          globalIdx++;
                          return (
                            <div key={m.id} className="pb-row" style={{ display: "flex", gap: 6, marginBottom: 3, alignItems: "center" }}>
                              <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", minWidth: 16, textAlign: "right", flexShrink: 0 }}>{globalIdx}.</span>
                              <input value={m.role || ""} onChange={e => updateCrewMember(catKey, m.id, "role", e.target.value)} placeholder="ROLE"
                                style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", border: "none", outline: "none", background: "transparent", width: 140, padding: 0, textTransform: "uppercase", flexShrink: 0 }} />
                              <PBInp value={m.name} onChange={v => updateCrewMember(catKey, m.id, "name", v)} placeholder="Name" style={{ flex: 1, borderBottom: "1px solid #eee" }} onFocusEditor={trackEditor} />
                              <DelBtn onClick={() => removeCrewMember(catKey, m.id)} />
                              <AddBtn onClick={() => addCrewMember(catKey)} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Local Crew */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: CS_FONT, fontSize: 7.5, fontWeight: 700, letterSpacing: 0.5, color: "#000", marginBottom: 8, marginTop: 4, ...GRAY_BOX, padding: "5px 10px" }}>LOCAL CREW</div>
                {(() => {
                  let localIdx = 0;
                  const cats = brief.localCrewCategories || [];
                  return cats.map((cat) => {
                    const members = cat.members || [];
                    return (
                      <div key={cat.id} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <input value={cat.label || ""} onChange={e => updateLocalCategoryLabel(cat.id, e.target.value)} placeholder="CATEGORY"
                            style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", border: "none", outline: "none", background: "transparent", textTransform: "uppercase", padding: 0 }} />
                          <DelBtn onClick={() => removeLocalCategory(cat.id)} />
                          <AddBtn onClick={() => addLocalCrewMember(cat.id)} />
                        </div>
                        {members.map((m) => {
                          localIdx++;
                          return (
                            <div key={m.id} className="pb-row" style={{ display: "flex", gap: 6, marginBottom: 3, alignItems: "center" }}>
                              <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", minWidth: 16, textAlign: "right", flexShrink: 0 }}>{localIdx}.</span>
                              <input value={m.role || ""} onChange={e => updateLocalCrewMember(cat.id, m.id, "role", e.target.value)} placeholder="ROLE"
                                style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", border: "none", outline: "none", background: "transparent", width: 140, padding: 0, textTransform: "uppercase", flexShrink: 0 }} />
                              <PBInp value={m.name} onChange={v => updateLocalCrewMember(cat.id, m.id, "name", v)} placeholder="Name" style={{ flex: 1, borderBottom: "1px solid #eee" }} onFocusEditor={trackEditor} />
                              <DelBtn onClick={() => removeLocalCrewMember(cat.id, m.id)} />
                              <AddBtn onClick={() => addLocalCrewMember(cat.id)} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()}
                <div data-hide="1" style={{ marginTop: 4 }}><AddBtn onClick={addLocalCategory} label="+ CATEGORY" /></div>
              </div>
            </div>
            </div>

            {/* ── 4. SCHEDULE ── */}
            <div data-section="4">
            <SectionTitle title={st[4] || "SCHEDULE"} num={4} onEdit={v => setSectionTitle(4, v)} hidden={hiddenSections.includes(4)} onToggleHidden={() => toggleSectionHidden(4)} />
            <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
              {sf.map(f => (
                <div key={f.id} className="pb-row" style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }}>
                  <div style={{ marginBottom: 2 }}>
                    <EditableLabel value={f.label} onChange={v => updateField("scheduleFields", f.id, "label", v)} gray style={{ display: "block", width: "100%" }} />
                  </div>
                  <PBTextarea value={f.value} onChange={v => updateField("scheduleFields", f.id, "value", v)} placeholder="..." onFocusEditor={trackEditor} />
                  <div data-hide="1" style={{ display: "flex", gap: 4, marginTop: 2 }}>
                    <DelBtn onClick={() => removeField("scheduleFields", f.id)} />
                    <AddBtn onClick={() => addField("scheduleFields", "textarea")} />
                  </div>
                </div>
              ))}
              {sf.length === 0 && <AddBtn onClick={() => addField("scheduleFields", "textarea")} label="+ BOX" />}
            </div>
            </div>

            {/* ── 5. QUOTE ── */}
            <div data-section="5">
            <SectionTitle title={st[5] || "QUOTE"} num={5} onEdit={v => setSectionTitle(5, v)} hidden={hiddenSections.includes(5)} onToggleHidden={() => toggleSectionHidden(5)} />
            {(brief.quote || []).map((q, qi) => (
              <div key={q.id} style={{ marginBottom: 14 }}>
                <div className="pb-row" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", minWidth: 16, flexShrink: 0 }}>{qi + 1}.</span>
                  <input value={q.heading || ""} onChange={e => updateQuoteHeading(q.id, e.target.value)} placeholder="SECTION TITLE"
                    style={{ flex: 1, fontFamily: CS_FONT, fontSize: 7.5, fontWeight: 700, letterSpacing: 0.5, color: "#000", border: "none", outline: "none", ...GRAY_BOX, textTransform: "uppercase" }} />
                  <DelBtn onClick={() => removeQuoteSection(q.id)} />
                  <AddBtn onClick={addQuoteSection} />
                </div>
                {(q.lines || []).map((line, li) => (
                  <div key={line.id} className="pb-row" style={{ marginBottom: 8, paddingLeft: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, color: "#000", flexShrink: 0 }}>{qi + 1}.{li + 1}</span>
                      <input value={line.label || ""} onChange={e => updateQuoteLine(q.id, line.id, "label", e.target.value)} placeholder="LABEL"
                        style={{ flex: 1, fontFamily: CS_FONT, fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: "#000", border: "none", outline: "none", background: "transparent", padding: 0, textTransform: "uppercase" }} />
                      <DelBtn onClick={() => removeQuoteLine(q.id, line.id)} />
                      <AddBtn onClick={() => addQuoteLine(q.id)} />
                    </div>
                    <PBTextarea value={line.value} onChange={v => updateQuoteLine(q.id, line.id, "value", v)} placeholder="..." style={{ minWidth: "100%" }} onFocusEditor={trackEditor} />
                  </div>
                ))}
                {(q.lines || []).length === 0 && <div style={{ paddingLeft: 22 }}><AddBtn onClick={() => addQuoteLine(q.id)} label="+ LINE" /></div>}
              </div>
            ))}
            {(brief.quote || []).length === 0 && <AddBtn onClick={addQuoteSection} label="+ SECTION" />}
            </div>

            {/* ── 6. ONNA ── */}
            <div data-section="6">
            <SectionTitle title={st[6] || "ONNA"} num={6} onEdit={v => setSectionTitle(6, v)} hidden={hiddenSections.includes(6)} onToggleHidden={() => toggleSectionHidden(6)} />
            <PBTextarea value={brief.onnaContent || ""} onChange={v => update(b => ({ ...b, onnaContent: v }))} placeholder="Notes, additional information..." style={{ minWidth: "100%", marginBottom: 12 }} onFocusEditor={trackEditor} />
            </div>

            {/* ── EXTRA FREEFORM SECTIONS ── */}
            {extras.map((s) => (
              <div key={s.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: 3, marginBottom: 6 }}>
                  <input value={s.heading} onChange={e => updateExtraHeading(s.id, e.target.value)} placeholder="SECTION TITLE"
                    style={{ flex: 1, fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#000", border: "none", outline: "none", background: "transparent", padding: 0, textTransform: "uppercase" }} />
                  <DelBtn onClick={() => removeExtra(s.id)} />
                </div>
                <ExtraEditor id={s.id} content={s.content} editorRefs={editorRefs}
                  focusedSection={focusedSection} setFocusedSection={setFocusedSection}
                  updateExtraContent={updateExtraContent} onFocusEditor={trackEditor} />
              </div>
            ))}

            {/* Add section */}
            <div data-hide="1" style={{ marginBottom: 16 }}>
              <div onClick={addExtra} style={{ fontFamily: CS_FONT, fontSize: 8, fontWeight: 700, letterSpacing: 0.5, padding: "5px 12px", cursor: "pointer", borderRadius: 2, border: "1px dashed #ccc", color: "#999", display: "inline-block" }}>+ ADD SECTION</div>
            </div>

          </div>

          {/* ONNA footer */}
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", fontFamily: CS_FONT, fontSize: 9, letterSpacing: 0.5, color: "#000", borderTop: "2px solid #000", paddingTop: 10 }}>
              <div><div style={{ fontWeight: 700 }}>@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700 }}>WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
