import React, { useState, useRef } from "react";
import { PRINT_CLEANUP_CSS } from "../../utils/helpers";

const F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
const LS = 0.3;
const LS_HDR = 1.2;

const DEFAULT_CV = {
  name: "EMILY LUCAS",
  title: "Executive Producer",
  contact: {
    phone: "+44 7766546348",
    email: "emily@onnaproduction.com",
    linkedin: "LinkedIn",
    website: "onna.world",
    location: "Tokyo, Japan - from March 2026",
    citizenship: "US, UK, Japanese Citizen",
  },
  summary: [
    "Executive Producer with over 8 years of experience leading comprehensive commercial production for global brands. Born in Tokyo, with Japanese-US-UK heritage, currently based in Dubai and moving to Tokyo in Mid March 2026. I bring unique cultural fluency and deep creative perspective to every production.",
    "After a career-defining tenure at Net-a-Porter delivering high-stakes production for global luxury brands, I founded ONNA to bridge the gap between global luxury brands and the rapid evolution of the GCC market. Select clients include Aman, Nike, Vogue, Mastercard, Columbia. Running my own production company has sharpened my skills in scoping, bidding, staffing, and executing multi-channel campaigns with internal and external stakeholders, including a wealth of experience partnering with global agencies including IMA, IPG, Noe&Associates, Free Practice.",
  ],
  clients: "MR PORTER | NET-A-PORTER | MASTERCARD | LOUIS VUITTON | AMAN | NIKE | JANU | ONE&ONLY | JUMEIRAH | CIPRIANI | LORO PIANA | LOEWE | BVLGARI | TIFFANY & CO | HARVEY NICHOLS DUBAI | EMIRATES | GUESS | CHARLOTTE TILBURY",
  experience: [
    {
      role: "Executive Producer & Founder",
      company: "ONNA",
      dates: "11/2024 - Present",
      bullets: [
        "Business Growth & Strategy: Founded a specialized production house and creative consultancy for global luxury institutions (Aman, Nike, Vogue, Columbia). Scaled operations to achieve a 108% increase in average monthly revenue within the first year.",
        "Operational Optimization: Strategically pivoted the business model from high-volume/low-margin projects to a consultancy-led approach, increasing gross profit margins to a projected 45% through high-value luxury storytelling and lean resource allocation.",
        "AI-Integrated Infrastructure: Pioneered the implementation of AI Agents and LLMs into production SOPs, automating client acquisition, accounting workflows, and administrative tasks to significantly reduce overhead and increase speed-to-market.",
        "Risk Mitigation: Engineered a standardized 10% contingency buffer for high-value projects, using controlled measures and acquired production experience to insulate the business against production volatility.",
        "360\u00B0 Campaign Leadership: Spearheaded ATL and BTL seasonal advertising campaigns, including OOH, digital storytelling, and multi-brand initiatives for Vogue x New Balance, Bvlgari, and Tiffany & Co.",
        "P&L Management: Maintained a 25% profit margin in the first year by architecting a lean, freelance-heavy operational model, ensuring maximum agility and scalability for global client needs.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Al Tayer Insignia",
      dates: "06/2024 - 11/2024",
      bullets: [
        "Portfolio Oversight: Orchestrated the end-to-end visual production portfolio for Harvey Nichols, managing a high-volume seasonal asset engine.",
        "Budgetary Leadership: Directed the strategic distribution of the annual content budget, optimizing spend across 360\u00B0 advertising, marketing activations, and multi-channel digital campaigns to ensure maximum ROI.",
        "Operational Transformation: Architected a Retainer Partnership Model for external vendors, cutting variable costs by 20% while maintaining premium luxury standards.",
        "Cross-Functional Synergy: Led a complex stakeholder matrix, aligning Procurement, Marketing, and Creative departments.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Freelance",
      dates: "06/2020 - 11/2024",
      bullets: [
        "Supported on high-stakes, large-scale experiential activations ($1m+) for Charlotte Tilbury x Disney Global Activation, ensuring seamless on-set operations and vendor management.",
        "Led end-to-end production in Abu Dhabi for GUESS Global Ramadan Campaign with A-list models, ensuring brand integrity and managing client expectations.",
      ],
    },
    {
      role: "Producer",
      company: "Net-a-Porter Group",
      dates: "06/2019 - 05/2024",
      bullets: [
        "Promotional Trajectory: Accelerated three levels of seniority from Picture Assistant to Lead Producer within 4 years, consistently exceeding performance KPIs.",
        "Flagship Campaign Leadership: Spearheaded the 'MR PORTER In America' 360-degree campaign, a high-stakes, multi-brand activation that generated 2.65M views and a 75% surge in audience engagement.",
        "Global Brand Partnerships: Led a white-label production system and brand partnership framework that generated $500k+ in incremental annual revenue through premium content collaborations with brands like Loro Piana, Stone Island, Brunello Cucinelli.",
        "High-Profile US Collaborations: Executive produced premium content featuring A-list talent (Finneas, Steffon Diggs, Greg Lauren) and prominent US-based brands.",
      ],
    },
  ],
  education: [
    { title: "Spanish Exchange Program", institution: "Universidad Del Salvador, Buenos Aires", result: "1st Class - 90%" },
    { title: "Spanish & Business Management BA (Hons)", institution: "The University of Manchester", result: "1st Class Honours - Bachelor Degree" },
  ],
  skills: [
    { name: "P&L and Financial Reporting", level: "Expert" },
    { name: "Global Vendor Negotiation", level: "Expert" },
    { name: "Risk Mitigation & Contingency Planning", level: "Expert" },
    { name: "Revenue Growth Strategy", level: "Expert" },
    { name: "AI Workflow Integration", level: "Expert" },
    { name: "Cross-Functional Stakeholder Management", level: "Expert" },
    { name: "Monday", level: "Expert" },
    { name: "Asana", level: "Expert" },
    { name: "Adobe Creative Suite", level: "Intermediate" },
    { name: "Midjourney", level: "Intermediate" },
    { name: "Microsoft 365", level: "Expert" },
    { name: "Zoho Books", level: "Expert" },
    { name: "AI Agentic Orchestration", level: "Expert" },
  ],
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Intermediate" },
    { name: "Japanese", level: "Intermediate" },
  ],
};

const InlineEdit = ({ value, onChange, style = {}, multiline }) => {
  const Tag = multiline ? "textarea" : "input";
  return (
    <Tag
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      style={{
        fontFamily: F, fontSize: 12, letterSpacing: LS, border: "none", outline: "none",
        background: "transparent", width: "100%", padding: "1px 2px", boxSizing: "border-box",
        resize: multiline ? "vertical" : "none",
        ...(multiline ? { minHeight: 36, lineHeight: 1.5 } : {}),
        ...style,
      }}
    />
  );
};

export { DEFAULT_CV };

export default function CVView({ cvData, onSet, projectName }) {
  const cv = cvData || DEFAULT_CV;
  const printRef = useRef(null);
  const [cvTab, setCvTab] = useState("cv");

  const set = (path, val) => {
    onSet(prev => {
      const next = JSON.parse(JSON.stringify(prev || DEFAULT_CV));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (obj[keys[i]] === undefined) obj[keys[i]] = isNaN(keys[i + 1]) ? {} : [];
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = val;
      return next;
    });
  };

  const addExperience = () => { onSet(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.experience = [...(n.experience || []), { role: "", company: "", dates: "", bullets: [""] }]; return n; }); };
  const removeExperience = (i) => { onSet(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.experience.splice(i, 1); return n; }); };
  const addBullet = (ei) => { onSet(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.experience[ei].bullets.push(""); return n; }); };
  const removeBullet = (ei, bi) => { onSet(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); if (n.experience[ei].bullets.length > 1) n.experience[ei].bullets.splice(bi, 1); return n; }); };
  const addEducation = () => { onSet(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.education = [...(n.education || []), { title: "", institution: "", result: "" }]; return n; }); };
  const removeEducation = (i) => { onSet(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.education.splice(i, 1); return n; }); };
  const addSkill = () => { onSet(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.skills = [...(n.skills || []), { name: "", level: "Intermediate" }]; return n; }); };
  const removeSkill = (i) => { onSet(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.skills.splice(i, 1); return n; }); };
  const addLanguage = () => { onSet(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.languages = [...(n.languages || []), { name: "", level: "" }]; return n; }); };
  const removeLanguage = (i) => { onSet(prev => { const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV)); n.languages.splice(i, 1); return n; }); };

  const doPrint = () => {
    const el = printRef.current; if (!el) return;
    const clone = el.cloneNode(true);
    clone.querySelectorAll("[data-noprint]").forEach(n => n.remove());
    clone.querySelectorAll("button").forEach(n => n.remove());
    clone.querySelectorAll("select").forEach(n => n.remove());
    clone.querySelectorAll("input, textarea").forEach(n => {
      const span = document.createElement("span");
      span.textContent = n.value;
      span.style.cssText = n.style.cssText;
      span.style.border = "none";
      span.style.background = "transparent";
      span.style.display = n.tagName === "TEXTAREA" ? "block" : "inline";
      span.style.whiteSpace = n.tagName === "TEXTAREA" ? "pre-wrap" : "normal";
      span.style.wordWrap = "break-word";
      span.style.overflowWrap = "break-word";
      n.replaceWith(span);
    });
    const docTitle = `CV - ${cv.name || "CV"}${projectName ? " | " + projectName : ""}`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const _d = iframe.contentDocument;
    _d.open();
    _d.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docTitle}</title><style>@import url("https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700&display=swap");*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:"Avenir","Nunito Sans",sans-serif;font-size:12px;color:#1a1a1a;padding:0;}@media print{@page{margin:18mm 20mm;size:A4;}}span{word-wrap:break-word;overflow-wrap:break-word;}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);
    _d.close();
    clone.style.padding = "0";
    _d.body.appendChild(_d.adoptNode(clone));
    const prevTitle = document.title;
    document.title = docTitle;
    const restoreTitle = () => { document.title = prevTitle; document.body.removeChild(iframe); window.removeEventListener("afterprint", restoreTitle); };
    window.addEventListener("afterprint", restoreTitle);
    setTimeout(() => {
      _d.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"]').forEach(el => el.remove());
      iframe.contentWindow.focus(); iframe.contentWindow.print();
    }, 300);
  };

  const TABS = [{ id: "cv", label: "CV" }];

  const sectionHdr = (label) => (
    <div style={{ marginTop: 22, marginBottom: 10 }}>
      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, letterSpacing: LS_HDR, textTransform: "uppercase", color: "#1a1a1a", marginBottom: 5 }}>{label}</div>
      <div style={{ borderBottom: "1px solid #ccc" }} />
    </div>
  );

  const BADGE_W = 88;
  const levelBadge = (level) => {
    const dark = level === "Expert" || level === "Native";
    return (
      <span style={{
        fontFamily: F, fontSize: 8, fontWeight: 700, letterSpacing: 0.8,
        padding: "3px 0", borderRadius: 3, textTransform: "uppercase",
        textAlign: "center", display: "inline-block", width: BADGE_W, flexShrink: 0,
        background: dark ? "#1a1a1a" : "#e8e8e8",
        color: dark ? "#fff" : "#444",
      }}>{level}</span>
    );
  };

  const contactFields = [
    { key: "phone" },
    { key: "email" },
    { key: "linkedin" },
    { key: "website" },
    { key: "location" },
    { key: "citizenship" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", background: "#fff", fontFamily: F, color: "#1a1a1a", minWidth: 700 }}>
      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "2px solid #000", overflowX: "auto" }}>
        {TABS.map(t => (
          <div key={t.id} onClick={() => setCvTab(t.id)} style={{
            fontFamily: F, fontSize: 9, fontWeight: cvTab === t.id ? 700 : 400, letterSpacing: LS,
            padding: "10px 16px", cursor: "pointer", whiteSpace: "nowrap",
            background: cvTab === t.id ? "#000" : "#f5f5f5", color: cvTab === t.id ? "#fff" : "#666",
            transition: "all .15s", textTransform: "uppercase", borderRight: "1px solid #ddd",
          }}>{t.label}</div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex" }}>
          <div onClick={doPrint} style={{
            fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, padding: "10px 16px",
            cursor: "pointer", whiteSpace: "nowrap", background: "#000", color: "#fff",
            textTransform: "uppercase", borderLeft: "1px solid #ddd",
          }} onMouseEnter={e => { e.target.style.background = "#333"; }} onMouseLeave={e => { e.target.style.background = "#000"; }}>EXPORT PDF</div>
        </div>
      </div>

      {/* Content */}
      <div ref={printRef} style={{ padding: "36px 36px" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 6 }}>
          {/* Left: Name + Title */}
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <InlineEdit value={cv.name} onChange={v => set("name", v)} style={{ fontSize: 28, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", lineHeight: 1.15 }} />
            <InlineEdit value={cv.title} onChange={v => set("title", v)} style={{ fontSize: 14, fontWeight: 400, color: "#555", letterSpacing: LS, marginTop: 2 }} />
          </div>
          {/* Right: Contact — right-aligned text */}
          <div style={{ flex: "0 0 auto", textAlign: "right" }}>
            {contactFields.map(({ key }) => (
              <div key={key} style={{ marginBottom: 1 }}>
                <InlineEdit value={cv.contact?.[key]} onChange={v => set(`contact.${key}`, v)} style={{ fontSize: 11, color: "#444", textAlign: "right" }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderBottom: "2.5px solid #000", marginBottom: 2 }} />

        {/* ── SUMMARY ── */}
        {sectionHdr("SUMMARY")}
        <div style={{ marginBottom: 6 }}>
          {(cv.summary || []).map((para, i) => (
            <div key={i} style={{ marginBottom: 5 }}>
              <InlineEdit multiline value={para} onChange={v => set(`summary.${i}`, v)} style={{ fontSize: 11, lineHeight: 1.55, color: "#333" }} />
            </div>
          ))}
        </div>
        {cv.clients && (
          <div style={{ marginBottom: 2 }}>
            <InlineEdit value={cv.clients} onChange={v => set("clients", v)} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: "#444", lineHeight: 1.6 }} />
          </div>
        )}

        {/* ── EXPERIENCE ── */}
        {sectionHdr("EXPERIENCE")}
        {(cv.experience || []).map((exp, ei) => (
          <div key={ei} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 0, flex: 1, minWidth: 0 }}>
                <InlineEdit value={exp.company} onChange={v => set(`experience.${ei}.company`, v)} style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", textTransform: "uppercase", width: "auto", flex: "0 1 auto" }} />
                <span style={{ fontFamily: F, fontSize: 12, fontWeight: 400, color: "#999", padding: "0 6px", flexShrink: 0 }}>|</span>
                <InlineEdit value={exp.role} onChange={v => set(`experience.${ei}.role`, v)} style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }} />
              </div>
              <InlineEdit value={exp.dates} onChange={v => set(`experience.${ei}.dates`, v)} style={{ fontSize: 11, color: "#888", textAlign: "right", width: 150, flexShrink: 0 }} />
            </div>
            <div style={{ borderBottom: "1px solid #eee", marginBottom: 4 }} />
            <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
              {(exp.bullets || []).map((b, bi) => (
                <li key={bi} style={{ fontFamily: F, fontSize: 11, letterSpacing: LS, color: "#333", lineHeight: 1.5, marginBottom: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                    <InlineEdit multiline value={b} onChange={v => set(`experience.${ei}.bullets.${bi}`, v)} style={{ fontSize: 11, lineHeight: 1.5, color: "#333", flex: 1, minHeight: 18 }} />
                    <button data-noprint onClick={() => removeBullet(ei, bi)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = "#ccc"}>&times;</button>
                  </div>
                </li>
              ))}
            </ul>
            <div data-noprint style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button onClick={() => addBullet(ei)} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "3px 8px", cursor: "pointer", color: "#888" }}>+ BULLET</button>
              <button onClick={() => removeExperience(ei)} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#fff5f5", border: "1px solid #fdd", borderRadius: 3, padding: "3px 8px", cursor: "pointer", color: "#c0392b" }}>REMOVE ROLE</button>
            </div>
          </div>
        ))}
        <button data-noprint onClick={addExperience} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#888", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>+ ADD EXPERIENCE</button>

        {/* ── EDUCATION ── */}
        {sectionHdr("EDUCATION")}
        {(cv.education || []).map((edu, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <InlineEdit value={edu.title} onChange={v => set(`education.${i}.title`, v)} style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <InlineEdit value={edu.institution} onChange={v => set(`education.${i}.institution`, v)} style={{ fontSize: 11, color: "#555", flex: 1 }} />
              <InlineEdit value={edu.result} onChange={v => set(`education.${i}.result`, v)} style={{ fontSize: 11, color: "#777", textAlign: "right", width: 240, flexShrink: 0 }} />
              <button data-noprint onClick={() => removeEducation(i)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = "#ccc"}>&times;</button>
            </div>
          </div>
        ))}
        <button data-noprint onClick={addEducation} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#888", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>+ ADD EDUCATION</button>

        {/* ── SKILLS ── */}
        {sectionHdr("SKILLS")}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6, tableLayout: "fixed" }}>
          <tbody>
            {Array.from({ length: Math.ceil((cv.skills || []).length / 2) }).map((_, row) => {
              const left = (cv.skills || [])[row * 2];
              const right = (cv.skills || [])[row * 2 + 1];
              return (
                <tr key={row}>
                  {[left, right].map((s, col) => {
                    const idx = row * 2 + col;
                    if (!s) return <td key={col} style={{ padding: "4px 0" }} />;
                    return (
                      <td key={col} style={{ padding: "4px 0", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle", paddingRight: col === 0 ? 16 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: F, fontSize: 11, color: "#333", flex: 1, letterSpacing: LS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <InlineEdit value={s.name} onChange={v => set(`skills.${idx}.name`, v)} style={{ fontSize: 11, color: "#333" }} />
                          </span>
                          <select data-noprint value={s.level} onChange={e => set(`skills.${idx}.level`, e.target.value)} style={{ fontFamily: F, fontSize: 9, letterSpacing: LS, border: "1px solid #eee", borderRadius: 3, padding: "2px 4px", background: "#fff", cursor: "pointer", outline: "none", flexShrink: 0 }}>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Expert">Expert</option>
                          </select>
                          {levelBadge(s.level)}
                          <button data-noprint onClick={() => removeSkill(idx)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = "#ccc"}>&times;</button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <button data-noprint onClick={addSkill} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#888", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>+ ADD SKILL</button>

        {/* ── LANGUAGES ── */}
        {sectionHdr("LANGUAGES")}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6, tableLayout: "fixed" }}>
          <tbody>
            {Array.from({ length: Math.ceil((cv.languages || []).length / 2) }).map((_, row) => {
              const left = (cv.languages || [])[row * 2];
              const right = (cv.languages || [])[row * 2 + 1];
              return (
                <tr key={row}>
                  {[left, right].map((l, col) => {
                    const idx = row * 2 + col;
                    if (!l) return <td key={col} style={{ padding: "4px 0" }} />;
                    return (
                      <td key={col} style={{ padding: "4px 0", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle", paddingRight: col === 0 ? 16 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: F, fontSize: 11, color: "#333", flex: 1, letterSpacing: LS }}>
                            <InlineEdit value={l.name} onChange={v => set(`languages.${idx}.name`, v)} style={{ fontSize: 11, color: "#333" }} />
                          </span>
                          <select data-noprint value={l.level} onChange={e => set(`languages.${idx}.level`, e.target.value)} style={{ fontFamily: F, fontSize: 9, letterSpacing: LS, border: "1px solid #eee", borderRadius: 3, padding: "2px 4px", background: "#fff", cursor: "pointer", outline: "none", flexShrink: 0 }}>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Native">Native</option>
                          </select>
                          {levelBadge(l.level)}
                          <button data-noprint onClick={() => removeLanguage(idx)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = "#ccc"}>&times;</button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <button data-noprint onClick={addLanguage} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#888", textTransform: "uppercase", fontWeight: 700 }}>+ ADD LANGUAGE</button>
      </div>
    </div>
  );
}
