import React, { useState, useRef } from "react";
import { PRINT_CLEANUP_CSS } from "../../utils/helpers";

const F = "'Avenir', 'Avenir Next', 'Nunito Sans', sans-serif";
const LS = 0.3;
const LS_HDR = 1.2;
const LINE_H = 1.55;

const DEFAULT_CV = {
  name: "EMILY LUCAS",
  title: "Executive Producer",
  contact: {
    phone: "+44 7766546348",
    email: "emily@onnaproduction.com",
    linkedin: "linkedin.com/in/emilylucas",
    website: "onna.world",
    location: "New York June - September 2026 · Tokyo from March 2026",
    citizenship: "US, UK, Japanese Citizen",
  },
  summary: [
    "Executive Producer with 8+ years making work for global luxury and lifestyle brands. Born in Tokyo with Japanese-US-UK heritage, I bring natural cultural fluency and a deep understanding of how to tell stories that land across markets.",
    "After building my production career at Net-a-Porter \u2014 rising from Picture Assistant to Lead Producer \u2014 I founded ONNA, a production house and creative consultancy working with brands like Aman, Nike, Vogue, and Stone Island. I\u2019m hands-on across the full process: scoping, bidding, crewing, and delivering multi-channel campaigns, working closely with agencies and in-house teams alike.",
  ],
  clients: "MR PORTER | NET-A-PORTER | NIKE | STONE ISLAND | LORO PIANA | LOUIS VUITTON | AMAN | VOGUE | MASTERCARD | BVLGARI | TIFFANY & CO | LOEWE | HARVEY NICHOLS | CHARLOTTE TILBURY | GUESS | COLUMBIA",
  experience: [
    {
      role: "Executive Producer & Founder",
      company: "ONNA",
      dates: "11/2024 - Present",
      bullets: [
        "Founded a production house and creative consultancy for global luxury brands (Aman, Nike, Vogue, Stone Island, Columbia). Grew average monthly revenue 108% within the first year.",
        "Global Production: Delivering campaigns across the Middle East, Japan, Europe, and the US \u2014 comfortable building crews and managing logistics in unfamiliar markets.",
        "Shifted the business from high-volume work to a consultancy-led model, lifting gross margins to a projected 45% through focused creative partnerships and lean operations.",
        "Led 360\u00B0 campaigns spanning OOH, digital, and multi-brand editorial for Vogue x New Balance, Bvlgari, and Tiffany & Co.",
        "Maintained a 25% profit margin in year one by running a tight, freelance-driven model built for flexibility and scale.",
      ],
    },
    {
      role: "Visuals Editor",
      company: "Vogue Arabia",
      dates: "12/2024 - 03/2025",
      bullets: [
        "Commissioned and produced visual content across print and digital, working directly with photographers, stylists, and art directors on editorial and commercial shoots.",
        "Managed shoot production from concept through delivery, balancing creative ambition with tight timelines and budgets.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Al Tayer Insignia - Harvey Nichols",
      dates: "06/2024 - 11/2024",
      bullets: [
        "Ran the end-to-end visual production portfolio for Harvey Nichols across seasonal campaigns, managing a high-volume content engine.",
        "Owned the annual content budget, allocating spend across 360\u00B0 advertising, activations, and multi-channel digital campaigns.",
        "Built a retainer partnership model for external vendors that cut variable costs by 20% while keeping quality at a luxury standard.",
        "Worked across Procurement, Marketing, and Creative to keep complex multi-stakeholder projects moving smoothly.",
      ],
    },
    {
      role: "Senior Producer",
      company: "Freelance",
      dates: "06/2020 - 11/2024",
      bullets: [
        "Produced large-scale experiential activations ($1m+) for Charlotte Tilbury x Disney Global, handling on-set operations and vendor coordination.",
        "Led end-to-end production in Abu Dhabi for the GUESS Global Ramadan Campaign with A-list talent.",
        "Delivered a multi-day Nike production across three locations, managing crew, talent, and logistics under tight turnarounds.",
      ],
    },
    {
      role: "Producer",
      company: "Net-a-Porter Group",
      dates: "06/2019 - 05/2024",
      bullets: [
        "Rose from Picture Assistant to Lead Producer in 4 years, consistently delivering beyond targets.",
        "Produced the \u2018MR PORTER In America\u2019 360\u00B0 campaign \u2014 a multi-brand activation that generated 2.65M views and a 75% lift in audience engagement.",
        "Built and ran a white-label production system and brand partnership framework generating $500k+ annually through collaborations with Loro Piana, Stone Island, and Brunello Cucinelli.",
        "Executive produced premium content featuring talent including Finneas, Stefon Diggs, and Greg Lauren, and prominent US-based brands.",
      ],
    },
  ],
  education: [
    { title: "Spanish Exchange Program", institution: "Universidad Del Salvador, Buenos Aires", result: "1st Class - 90%" },
    { title: "Spanish & Business Management BA (Hons)", institution: "The University of Manchester", result: "1st Class Honours - Bachelor Degree" },
  ],
  skills: [
    { name: "End-to-End Production", level: "Expert" },
    { name: "Budget & P&L Management", level: "Expert" },
    { name: "Global Vendor & Crew Negotiation", level: "Expert" },
    { name: "Talent & Stakeholder Management", level: "Expert" },
    { name: "360\u00B0 Campaign Delivery", level: "Expert" },
    { name: "Risk & Contingency Planning", level: "Expert" },
    { name: "Monday / Asana", level: "Expert" },
    { name: "Adobe Creative Suite", level: "Intermediate" },
    { name: "Microsoft 365 / Google Workspace", level: "Expert" },
    { name: "AI Production Tools", level: "Intermediate" },
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
        fontFamily: F, fontSize: 11, letterSpacing: LS, border: "none", outline: "none",
        background: "transparent", width: "100%", padding: "1px 2px", boxSizing: "border-box",
        lineHeight: LINE_H,
        resize: multiline ? "vertical" : "none",
        ...(multiline ? { minHeight: 36 } : {}),
        ...style,
      }}
    />
  );
};

export { DEFAULT_CV };

// Helpers to make a URL from contact value
const makeHref = (key, val) => {
  if (!val) return null;
  if (key === "email") return `mailto:${val}`;
  if (key === "website") return val.startsWith("http") ? val : `https://${val}`;
  if (key === "linkedin") return val.startsWith("http") ? val : `https://${val}`;
  return null;
};

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

  // Move experience up/down
  const moveExperience = (from, to) => {
    if (to < 0 || to >= (cv.experience || []).length) return;
    onSet(prev => {
      const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV));
      const [moved] = n.experience.splice(from, 1);
      n.experience.splice(to, 0, moved);
      return n;
    });
  };

  // Move bullet up/down
  const moveBullet = (ei, from, to) => {
    onSet(prev => {
      const n = JSON.parse(JSON.stringify(prev || DEFAULT_CV));
      const bullets = n.experience[ei].bullets;
      if (to < 0 || to >= bullets.length) return n;
      const [moved] = bullets.splice(from, 1);
      bullets.splice(to, 0, moved);
      return n;
    });
  };

  // Drag state for experience reorder
  const dragRef = useRef(null);
  const [dropTarget, setDropTarget] = useState(null);
  // Drag state for bullet reorder
  const bulletDragRef = useRef(null);
  const [bulletDropTarget, setBulletDropTarget] = useState(null);

  // Build clean HTML for print
  const doPrint = () => {
    const c = cv;
    const ct = c.contact || {};
    const S = `font-size:11px;line-height:${LINE_H};color:#1a1a1a;`;

    let html = `<div style="font-family:'Avenir','Nunito Sans',sans-serif;color:#1a1a1a;font-size:11px;line-height:${LINE_H};">`;

    // Header — name + title
    html += `<div style="margin-bottom:10px;">`;
    html += `<div style="font-size:30px;font-weight:700;letter-spacing:2px;text-transform:uppercase;line-height:1.15;color:#1a1a1a;">${esc(c.name)}</div>`;
    html += `<div style="font-size:14px;color:#1a1a1a;letter-spacing:0.3px;margin-top:3px;line-height:${LINE_H};">${esc(c.title)}</div>`;
    html += `</div>`;

    // Contact — centred, horizontal with links
    const dot = ' <span style="color:#ccc;padding:0 6px;">\u2022</span> ';
    const contactParts = [];
    if (ct.phone) contactParts.push(`<a href="tel:${esc(ct.phone.replace(/\s/g,''))}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.phone)}</a>`);
    if (ct.email) contactParts.push(`<a href="mailto:${esc(ct.email)}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.email)}</a>`);
    if (ct.linkedin) { const url = ct.linkedin.startsWith("http") ? ct.linkedin : `https://${ct.linkedin}`; contactParts.push(`<a href="${esc(url)}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.linkedin)}</a>`); }
    if (ct.website) { const url = ct.website.startsWith("http") ? ct.website : `https://${ct.website}`; contactParts.push(`<a href="${esc(url)}" style="color:#1a1a1a;text-decoration:none;">${esc(ct.website)}</a>`); }
    if (contactParts.length > 0) {
      html += `<div style="font-size:10.5px;font-weight:700;color:#1a1a1a;line-height:${LINE_H};margin-bottom:3px;text-align:center;">${contactParts.join(dot)}</div>`;
    }
    const locationParts = [];
    if (ct.location) locationParts.push(esc(ct.location));
    if (ct.citizenship) locationParts.push(esc(ct.citizenship));
    if (locationParts.length > 0) {
      html += `<div style="font-size:10.5px;font-weight:700;color:#1a1a1a;line-height:${LINE_H};margin-bottom:3px;text-align:center;">${locationParts.join(dot)}</div>`;
    }

    // Thick rule
    html += `<div style="border-bottom:2.5px solid #000;margin:8px 0 4px 0;"></div>`;

    // Summary
    html += secHdr("SUMMARY");
    (c.summary || []).forEach(p => { html += `<div style="${S}margin-bottom:6px;">${esc(p)}</div>`; });
    if (c.clients) html += `<div style="font-size:9.5px;font-weight:700;letter-spacing:0.4px;color:#1a1a1a;line-height:${LINE_H};margin-top:4px;text-align:center;">${esc(c.clients)}</div>`;

    // Experience
    html += secHdr("EXPERIENCE");
    (c.experience || []).forEach(exp => {
      html += `<div style="margin-bottom:14px;">`;
      html += `<table style="width:100%;border-collapse:collapse;"><tr>`;
      html += `<td style="padding:0;font-size:12px;font-weight:700;color:#1a1a1a;line-height:${LINE_H};">${esc(exp.company)} <span style="font-weight:400;color:#bbb;padding:0 3px;">|</span> ${esc(exp.role)}</td>`;
      html += `<td style="padding:0;font-size:11px;color:#1a1a1a;text-align:right;white-space:nowrap;line-height:${LINE_H};">${esc(exp.dates)}</td>`;
      html += `</tr></table>`;
      html += `<div style="border-bottom:1px solid #eee;margin:2px 0 5px 0;"></div>`;
      html += `<ul style="margin:0;padding-left:18px;list-style:disc;">`;
      (exp.bullets || []).forEach(b => {
        html += `<li style="${S}margin-bottom:2px;">${esc(b)}</li>`;
      });
      html += `</ul></div>`;
    });

    // Education
    html += secHdr("EDUCATION");
    (c.education || []).forEach(edu => {
      html += `<div style="margin-bottom:8px;">`;
      html += `<div style="font-size:12px;font-weight:700;color:#1a1a1a;line-height:${LINE_H};">${esc(edu.title)}</div>`;
      html += `<table style="width:100%;border-collapse:collapse;"><tr>`;
      html += `<td style="padding:0;font-size:11px;color:#1a1a1a;line-height:${LINE_H};">${esc(edu.institution)}</td>`;
      html += `<td style="padding:0;font-size:11px;color:#1a1a1a;text-align:right;line-height:${LINE_H};">${esc(edu.result)}</td>`;
      html += `</tr></table></div>`;
    });

    // Skills
    html += secHdr("SKILLS");
    html += `<table style="width:100%;border-collapse:collapse;table-layout:fixed;">`;
    const skillRows = Math.ceil((c.skills || []).length / 2);
    for (let r = 0; r < skillRows; r++) {
      html += `<tr>`;
      for (let col = 0; col < 2; col++) {
        const s = (c.skills || [])[r * 2 + col];
        if (!s) { html += `<td style="padding:5px 0;"></td>`; continue; }
        html += `<td style="padding:5px ${col === 0 ? '12px' : '0'} 5px 0;border-bottom:1px solid #f0f0f0;vertical-align:middle;">`;
        html += `<table style="width:100%;border-collapse:collapse;"><tr>`;
        html += `<td style="padding:0;font-size:11px;color:#1a1a1a;line-height:${LINE_H};">${esc(s.name)}</td>`;
        html += `<td style="padding:0;text-align:right;width:88px;">${badgeHtml(s.level)}</td>`;
        html += `</tr></table></td>`;
      }
      html += `</tr>`;
    }
    html += `</table>`;

    // Languages
    html += secHdr("LANGUAGES");
    html += `<table style="width:100%;border-collapse:collapse;table-layout:fixed;">`;
    const langRows = Math.ceil((c.languages || []).length / 2);
    for (let r = 0; r < langRows; r++) {
      html += `<tr>`;
      for (let col = 0; col < 2; col++) {
        const l = (c.languages || [])[r * 2 + col];
        if (!l) { html += `<td style="padding:5px 0;"></td>`; continue; }
        html += `<td style="padding:5px ${col === 0 ? '12px' : '0'} 5px 0;border-bottom:1px solid #f0f0f0;vertical-align:middle;">`;
        html += `<table style="width:100%;border-collapse:collapse;"><tr>`;
        html += `<td style="padding:0;font-size:11px;color:#1a1a1a;line-height:${LINE_H};">${esc(l.name)}</td>`;
        html += `<td style="padding:0;text-align:right;width:88px;">${badgeHtml(l.level)}</td>`;
        html += `</tr></table></td>`;
      }
      html += `</tr>`;
    }
    html += `</table>`;

    html += `</div>`;

    const docTitle = `CV - ${c.name || "CV"}${projectName ? " | " + projectName : ""}`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const _d = iframe.contentDocument;
    _d.open();
    _d.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docTitle}</title><style>@import url("https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700&display=swap");*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:"Avenir","Nunito Sans",sans-serif;font-size:11px;color:#1a1a1a;padding:10mm 12mm;}a{color:#1a1a1a;text-decoration:none;}@media print{@page{margin:0;size:A4;}}</style></head><body>${html}</body></html>`);
    _d.close();
    const prevTitle = document.title;
    document.title = docTitle;
    const restoreTitle = () => { document.title = prevTitle; document.body.removeChild(iframe); window.removeEventListener("afterprint", restoreTitle); };
    window.addEventListener("afterprint", restoreTitle);
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); }, 250);
  };

  const TABS = [{ id: "cv", label: "CV" }];

  const sectionHdr = (label) => (
    <div style={{ marginTop: 20, marginBottom: 8 }}>
      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, letterSpacing: LS_HDR, textTransform: "uppercase", color: "#1a1a1a", lineHeight: LINE_H, marginBottom: 5 }}>{label}</div>
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

  const contactFields = ["phone", "email", "linkedin", "website", "location", "citizenship"];

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

      {/* ── Live editor ── */}
      <div ref={printRef} style={{ padding: "36px 36px" }}>

        {/* Header */}
        <div style={{ marginBottom: 10 }}>
          <InlineEdit value={cv.name} onChange={v => set("name", v)} style={{ fontSize: 28, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", lineHeight: 1.15 }} />
          <InlineEdit value={cv.title} onChange={v => set("title", v)} style={{ fontSize: 14, fontWeight: 400, color: "#1a1a1a", letterSpacing: LS, marginTop: 2 }} />
        </div>

        {/* Contact — centred, bold, horizontal with dot separators */}
        <div style={{ textAlign: "center", marginBottom: 3, lineHeight: LINE_H }}>
          {["phone", "email", "linkedin", "website"].map((key, i) => {
            const val = cv.contact?.[key];
            if (!val) return null;
            const href = makeHref(key, val);
            return (
              <span key={key} style={{ display: "inline", verticalAlign: "baseline" }}>
                {i > 0 && <span style={{ color: "#ccc", padding: "0 8px", fontSize: 8 }}>{"\u2022"}</span>}
                {href ? (
                  <a href={href} target={key === "email" ? undefined : "_blank"} rel="noopener noreferrer" style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #ddd" }}>
                    <InlineEdit value={val} onChange={v => set(`contact.${key}`, v)} style={{ fontSize: 11, color: "#1a1a1a", width: "auto", display: "inline", fontWeight: 700 }} />
                  </a>
                ) : (
                  <InlineEdit value={val} onChange={v => set(`contact.${key}`, v)} style={{ fontSize: 11, color: "#1a1a1a", width: "auto", display: "inline", fontWeight: 700 }} />
                )}
              </span>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginBottom: 3, lineHeight: LINE_H }}>
          {["location", "citizenship"].map((key, i) => {
            const val = cv.contact?.[key];
            if (!val) return null;
            return (
              <span key={key} style={{ display: "inline", verticalAlign: "baseline" }}>
                {i > 0 && <span style={{ color: "#ccc", padding: "0 8px", fontSize: 8 }}>{"\u2022"}</span>}
                <InlineEdit value={val} onChange={v => set(`contact.${key}`, v)} style={{ fontSize: 11, color: "#1a1a1a", width: "auto", display: "inline", fontWeight: 700 }} />
              </span>
            );
          })}
        </div>

        <div style={{ borderBottom: "2.5px solid #000", margin: "8px 0 2px 0" }} />

        {/* Summary */}
        {sectionHdr("SUMMARY")}
        {(cv.summary || []).map((para, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <InlineEdit multiline value={para} onChange={v => set(`summary.${i}`, v)} style={{ fontSize: 11, lineHeight: LINE_H, color: "#1a1a1a" }} />
          </div>
        ))}
        {cv.clients && (
          <div style={{ marginTop: 4, textAlign: "center" }}>
            <InlineEdit value={cv.clients} onChange={v => set("clients", v)} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, color: "#1a1a1a", lineHeight: LINE_H, textAlign: "center" }} />
          </div>
        )}

        {/* Experience */}
        {sectionHdr("EXPERIENCE")}
        {(cv.experience || []).map((exp, ei) => (
          <div
            key={ei}
            draggable
            onDragStart={() => { dragRef.current = ei; }}
            onDragOver={e => { e.preventDefault(); setDropTarget(ei); }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={e => { e.preventDefault(); if (dragRef.current !== null && dragRef.current !== ei) moveExperience(dragRef.current, ei); dragRef.current = null; setDropTarget(null); }}
            onDragEnd={() => { dragRef.current = null; setDropTarget(null); }}
            style={{ marginBottom: 14, borderTop: dropTarget === ei ? "2px solid #1976D2" : "2px solid transparent", transition: "border-color 0.1s" }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody><tr>
                <td data-noprint style={{ padding: 0, width: 24, verticalAlign: "middle", cursor: "grab" }}>
                  <span style={{ fontSize: 11, color: "#ccc", userSelect: "none" }}>{"\u2630"}</span>
                </td>
                <td style={{ padding: 0, fontSize: 12, fontWeight: 700, color: "#1a1a1a", lineHeight: LINE_H }}>
                  <span style={{ display: "inline-flex", alignItems: "baseline", gap: 0 }}>
                    <InlineEdit value={exp.company} onChange={v => set(`experience.${ei}.company`, v)} style={{ fontSize: 12, fontWeight: 700, width: "auto" }} />
                    <span style={{ color: "#bbb", fontWeight: 400, padding: "0 5px" }}>|</span>
                    <InlineEdit value={exp.role} onChange={v => set(`experience.${ei}.role`, v)} style={{ fontSize: 12, fontWeight: 700, width: "auto" }} />
                  </span>
                </td>
                <td style={{ padding: 0, fontSize: 11, color: "#1a1a1a", textAlign: "right", whiteSpace: "nowrap", width: 140, lineHeight: LINE_H }}>
                  <InlineEdit value={exp.dates} onChange={v => set(`experience.${ei}.dates`, v)} style={{ fontSize: 11, color: "#1a1a1a", textAlign: "right" }} />
                </td>
              </tr></tbody>
            </table>
            <div style={{ borderBottom: "1px solid #eee", margin: "2px 0 5px 0" }} />
            <ul style={{ margin: 0, paddingLeft: 18, listStyle: "none" }}>
              {(exp.bullets || []).map((b, bi) => (
                <li
                  key={bi}
                  draggable
                  onDragStart={e => { e.stopPropagation(); bulletDragRef.current = { ei, bi }; }}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); setBulletDropTarget({ ei, bi }); }}
                  onDragLeave={() => setBulletDropTarget(null)}
                  onDrop={e => { e.preventDefault(); e.stopPropagation(); if (bulletDragRef.current && bulletDragRef.current.ei === ei && bulletDragRef.current.bi !== bi) moveBullet(ei, bulletDragRef.current.bi, bi); bulletDragRef.current = null; setBulletDropTarget(null); }}
                  onDragEnd={() => { bulletDragRef.current = null; setBulletDropTarget(null); }}
                  style={{ fontFamily: F, fontSize: 11, letterSpacing: LS, color: "#1a1a1a", lineHeight: LINE_H, marginBottom: 2, borderTop: bulletDropTarget?.ei === ei && bulletDropTarget?.bi === bi ? "2px solid #1976D2" : "2px solid transparent", transition: "border-color 0.1s" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                    <span data-noprint style={{ cursor: "grab", color: "#ccc", fontSize: 9, userSelect: "none", flexShrink: 0, marginTop: 3 }}>{"\u2630"}</span>
                    <span style={{ color: "#1a1a1a", flexShrink: 0, marginRight: 2 }}>{"\u2022"}</span>
                    <InlineEdit multiline value={b} onChange={v => set(`experience.${ei}.bullets.${bi}`, v)} style={{ fontSize: 11, lineHeight: LINE_H, color: "#1a1a1a", flex: 1, minHeight: 18 }} />
                    <button data-noprint onClick={() => removeBullet(ei, bi)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = "#ccc"}>&times;</button>
                  </div>
                </li>
              ))}
            </ul>
            <div data-noprint style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
              <button onClick={() => moveExperience(ei, ei - 1)} disabled={ei === 0} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "3px 8px", cursor: ei === 0 ? "default" : "pointer", color: ei === 0 ? "#ddd" : "#888", opacity: ei === 0 ? 0.5 : 1 }}>{"\u2191"} MOVE UP</button>
              <button onClick={() => moveExperience(ei, ei + 1)} disabled={ei === (cv.experience || []).length - 1} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "3px 8px", cursor: ei === (cv.experience || []).length - 1 ? "default" : "pointer", color: ei === (cv.experience || []).length - 1 ? "#ddd" : "#888", opacity: ei === (cv.experience || []).length - 1 ? 0.5 : 1 }}>{"\u2193"} MOVE DOWN</button>
              <button onClick={() => addBullet(ei)} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "3px 8px", cursor: "pointer", color: "#1a1a1a" }}>+ BULLET</button>
              <button onClick={() => removeExperience(ei)} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#fff5f5", border: "1px solid #fdd", borderRadius: 3, padding: "3px 8px", cursor: "pointer", color: "#c0392b" }}>REMOVE ROLE</button>
            </div>
          </div>
        ))}
        <button data-noprint onClick={addExperience} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#1a1a1a", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>+ ADD EXPERIENCE</button>

        {/* Education */}
        {sectionHdr("EDUCATION")}
        {(cv.education || []).map((edu, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <InlineEdit value={edu.title} onChange={v => set(`education.${i}.title`, v)} style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", lineHeight: LINE_H }} />
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody><tr>
                <td style={{ padding: 0 }}>
                  <InlineEdit value={edu.institution} onChange={v => set(`education.${i}.institution`, v)} style={{ fontSize: 11, color: "#1a1a1a", lineHeight: LINE_H }} />
                </td>
                <td style={{ padding: 0, textAlign: "right" }}>
                  <InlineEdit value={edu.result} onChange={v => set(`education.${i}.result`, v)} style={{ fontSize: 11, color: "#1a1a1a", textAlign: "right", lineHeight: LINE_H }} />
                </td>
                <td style={{ padding: 0, width: 20 }}>
                  <button data-noprint onClick={() => removeEducation(i)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1 }} onMouseOver={e => e.currentTarget.style.color = "#c0392b"} onMouseOut={e => e.currentTarget.style.color = "#ccc"}>&times;</button>
                </td>
              </tr></tbody>
            </table>
          </div>
        ))}
        <button data-noprint onClick={addEducation} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#1a1a1a", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>+ ADD EDUCATION</button>

        {/* Skills */}
        {sectionHdr("SKILLS")}
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginBottom: 6 }}>
          <tbody>
            {Array.from({ length: Math.ceil((cv.skills || []).length / 2) }).map((_, row) => (
              <tr key={row}>
                {[0, 1].map(col => {
                  const idx = row * 2 + col;
                  const s = (cv.skills || [])[idx];
                  if (!s) return <td key={col} style={{ padding: "5px 0" }} />;
                  return (
                    <td key={col} style={{ padding: "5px 0", paddingRight: col === 0 ? 16 : 0, borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <InlineEdit value={s.name} onChange={v => set(`skills.${idx}.name`, v)} style={{ fontSize: 11, color: "#1a1a1a", flex: 1, lineHeight: LINE_H }} />
                        <select data-noprint value={s.level} onChange={e => set(`skills.${idx}.level`, e.target.value)} style={{ fontFamily: F, fontSize: 9, border: "1px solid #eee", borderRadius: 3, padding: "2px 4px", background: "#fff", cursor: "pointer", outline: "none", flexShrink: 0 }}>
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
            ))}
          </tbody>
        </table>
        <button data-noprint onClick={addSkill} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#1a1a1a", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>+ ADD SKILL</button>

        {/* Languages */}
        {sectionHdr("LANGUAGES")}
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginBottom: 6 }}>
          <tbody>
            {Array.from({ length: Math.ceil((cv.languages || []).length / 2) }).map((_, row) => (
              <tr key={row}>
                {[0, 1].map(col => {
                  const idx = row * 2 + col;
                  const l = (cv.languages || [])[idx];
                  if (!l) return <td key={col} style={{ padding: "5px 0" }} />;
                  return (
                    <td key={col} style={{ padding: "5px 0", paddingRight: col === 0 ? 16 : 0, borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <InlineEdit value={l.name} onChange={v => set(`languages.${idx}.name`, v)} style={{ fontSize: 11, color: "#1a1a1a", flex: 1, lineHeight: LINE_H }} />
                        <select data-noprint value={l.level} onChange={e => set(`languages.${idx}.level`, e.target.value)} style={{ fontFamily: F, fontSize: 9, border: "1px solid #eee", borderRadius: 3, padding: "2px 4px", background: "#fff", cursor: "pointer", outline: "none", flexShrink: 0 }}>
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
            ))}
          </tbody>
        </table>
        <button data-noprint onClick={addLanguage} style={{ fontFamily: F, fontSize: 8, letterSpacing: LS, background: "#f5f5f5", border: "1px solid #eee", borderRadius: 3, padding: "5px 12px", cursor: "pointer", color: "#1a1a1a", textTransform: "uppercase", fontWeight: 700 }}>+ ADD LANGUAGE</button>
      </div>
    </div>
  );
}

// ── Print helpers ──
function esc(str) { return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function secHdr(label) { return `<div style="margin-top:20px;margin-bottom:8px;"><div style="font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#1a1a1a;line-height:1.55;margin-bottom:5px;">${label}</div><div style="border-bottom:1px solid #ccc;"></div></div>`; }
function badgeHtml(level) {
  const dark = level === "Expert" || level === "Native";
  return `<span style="font-family:'Avenir','Nunito Sans',sans-serif;font-size:8px;font-weight:700;letter-spacing:0.8px;padding:3px 0;border-radius:3px;text-transform:uppercase;text-align:center;display:inline-block;width:88px;background:${dark ? '#1a1a1a' : '#e8e8e8'};color:${dark ? '#fff' : '#444'};">${level}</span>`;
}
