import * as XLSX from "xlsx";
import { defaultSections, estRowTotal, estNum } from "./helpers";

const s2ab = (s) => {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
  return buf;
};

export const downloadAoaXlsx = (sheets, filename) => {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, data, cols }) => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    if (cols) ws["!cols"] = cols;
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  const out = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
  const blob = new Blob([s2ab(out)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

// ── Data generators (return { sheets: [{name, data, cols}], filename }) ──

export function genEstimate(estimateData) {
  const est = estimateData || {};
  const ts = est.ts || {};
  const sections = est.sections || defaultSections();
  const rows = [["REF", "DESCRIPTION", "NOTES", "DAYS", "QTY", "RATE", "TOTAL"]];
  sections.forEach(sec => {
    rows.push([]);
    rows.push([sec.num, sec.title, "", "", "", "", ""]);
    sec.rows.forEach(r => {
      rows.push([r.ref, r.desc, r.notes || "", estNum(r.days), estNum(r.qty), estNum(r.rate), estRowTotal(r)]);
    });
    const secTotal = sec.rows.reduce((s, r) => s + estRowTotal(r), 0);
    rows.push(["", "", "", "", "", "SUBTOTAL", Math.round(secTotal * 100) / 100]);
  });
  const gt = sections.reduce((s, sec) => s + sec.rows.reduce((t, r) => t + estRowTotal(r), 0), 0);
  rows.push([]);
  rows.push(["", "", "", "", "", "GRAND TOTAL", Math.round(gt * 100) / 100]);
  return { sheets: [{ name: "Estimate", data: rows, cols: [{ wch: 6 }, { wch: 35 }, { wch: 25 }, { wch: 8 }, { wch: 6 }, { wch: 12 }, { wch: 14 }] }], filename: "ONNA Production Estimate.xlsx" };
}

export function genBudgetTracker(estimateData, actualsData) {
  const est = estimateData || {};
  const sections = est.sections || defaultSections();
  const actSections = actualsData || [];
  const rows = [["REF", "DESCRIPTION", "NOTES", "DAYS", "QTY", "RATE", "ESTIMATE", "ACTUALS", "FINALS", "VARIANCE", "STATUS"]];
  sections.forEach((sec, si) => {
    const actSec = actSections[si];
    rows.push([]);
    rows.push([sec.num, sec.title, "", "", "", "", "", "", "", "", ""]);
    sec.rows.forEach((r, ri) => {
      const et = estRowTotal(r);
      const actRow = actSec?.rows?.[ri];
      const aa = actRow ? estNum(actRow.actualsAmount) : 0;
      const fa = actRow ? estNum(actRow.zohoAmount) : 0;
      rows.push([r.ref, r.desc, r.notes || "", estNum(r.days), estNum(r.qty), estNum(r.rate), et, aa, fa, Math.round((et - aa) * 100) / 100, actRow?.status || ""]);
    });
  });
  return { sheets: [{ name: "Budget Tracker", data: rows, cols: [{ wch: 6 }, { wch: 30 }, { wch: 20 }, { wch: 7 }, { wch: 5 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }] }], filename: "ONNA Budget Tracker.xlsx" };
}

export function genCallSheet(csData) {
  const cs = csData || {};
  const info = [["ONNA CALL SHEET"], [], ["Shoot Name", cs.shootName || ""], ["Date", cs.date || ""], ["Day Number", cs.dayNumber || ""], ["Passport Note", cs.passportNote || ""], [], ["VENUE INFORMATION"]];
  (cs.venueRows || []).forEach(v => info.push([v.label || "", v.value || ""]));
  info.push([], ["SCHEDULE"], ["TIME", "ACTIVITY", "NOTES"]);
  (cs.schedule || []).forEach(s => info.push([s.time || "", s.activity || "", s.notes || ""]));
  const crew = [["DEPARTMENT", "NAME", "ROLE", "MOBILE", "EMAIL", "CALL TIME"]];
  (cs.departments || []).forEach(dept => {
    crew.push([]);
    crew.push([dept.name || "", "", "", "", "", ""]);
    (dept.crew || []).forEach(c => crew.push(["", c.name || "", c.role || "", c.mobile || "", c.email || "", c.callTime || ""]));
  });
  return { sheets: [
    { name: "Call Sheet", data: info, cols: [{ wch: 20 }, { wch: 40 }, { wch: 30 }] },
    { name: "Crew", data: crew, cols: [{ wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 12 }] },
  ], filename: "ONNA Call Sheet.xlsx" };
}

export function genRiskAssessment(raData) {
  const ra = raData || {};
  const info = [["ONNA RISK ASSESSMENT"], [], ["Project", ra.projectName || ""], ["Client", ra.clientName || ""], ["Date", ra.date || ""], ["Location", ra.location || ""], ["Producer", ra.producer || ""], ["Director / Photographer", ra.director || ""]];
  const risks = [["HAZARD", "WHO AT RISK", "RISK LEVEL", "CONTROL MEASURES", "RESIDUAL RISK"]];
  (ra.risks || []).forEach(r => risks.push([r.hazard || "", r.whoAtRisk || "", r.riskLevel || "", r.controls || "", r.residualRisk || ""]));
  return { sheets: [
    { name: "Info", data: info, cols: [{ wch: 30 }, { wch: 40 }] },
    { name: "Risks", data: risks, cols: [{ wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 40 }, { wch: 14 }] },
  ], filename: "ONNA Risk Assessment.xlsx" };
}

export function genCastingTable(castingData) {
  const tables = castingData || [];
  const rows = [["ROLE", "NAME", "AGENCY", "RATE", "USAGE", "FIT DATE", "STATUS", "NOTES"]];
  if (tables.length > 0) {
    tables.forEach(t => (t.rows || []).forEach(r => rows.push([r.role || "", r.name || "", r.agency || "", r.rate || "", r.usage || "", r.fitDate || "", r.status || "", r.notes || ""])));
  }
  return { sheets: [{ name: "Casting", data: rows, cols: [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 30 }] }], filename: "ONNA Casting Table.xlsx" };
}

export function genLocationDeck(locData) {
  const versions = locData || [];
  const rows = [["LOCATION NAME", "ADDRESS", "TYPE", "CONTACT", "PHONE", "RATE", "NOTES"]];
  if (versions.length > 0) {
    const latest = versions[versions.length - 1];
    (latest.locations || []).forEach(loc => rows.push([loc.name || "", loc.address || "", loc.type || "", loc.contact || "", loc.phone || "", loc.rate || "", loc.notes || ""]));
  }
  return { sheets: [{ name: "Locations", data: rows, cols: [{ wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 30 }] }], filename: "ONNA Location Deck.xlsx" };
}

export function genTravelItinerary(tiData) {
  const ti = tiData || {};
  const flights = [["PASSENGER", "AIRLINE", "FLIGHT #", "FROM", "TO", "DEPART", "ARRIVE", "BOOKING REF", "STATUS"]];
  (ti.flights || []).forEach(f => flights.push([f.passenger || "", f.airline || "", f.flightNo || "", f.from || "", f.to || "", f.depart || "", f.arrive || "", f.ref || "", f.status || ""]));
  const hotels = [["GUEST", "HOTEL", "CHECK IN", "CHECK OUT", "ROOM TYPE", "BOOKING REF", "NOTES"]];
  (ti.hotels || []).forEach(h => hotels.push([h.guest || "", h.hotel || "", h.checkIn || "", h.checkOut || "", h.roomType || "", h.ref || "", h.notes || ""]));
  return { sheets: [
    { name: "Flights", data: flights, cols: [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }] },
    { name: "Hotels", data: hotels, cols: [{ wch: 20 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 15 }, { wch: 14 }, { wch: 25 }] },
  ], filename: "ONNA Travel Itinerary.xlsx" };
}

export function genCV(cvData) {
  const cv = cvData || {};
  const contact = cv.contact || {};
  const info = [
    [cv.name || ""], [cv.title || ""], [],
    ["Phone", contact.phone || ""], ["Email", contact.email || ""], ["LinkedIn", contact.linkedin || ""],
    ["Website", contact.website || ""], ["Location", contact.location || ""], ["Citizenship", contact.citizenship || ""],
    [], ["SUMMARY"],
  ];
  (cv.summary || []).forEach(p => info.push([p]));
  if (cv.clients) { info.push([]); info.push([cv.clients]); }
  info.push([], ["EXPERIENCE"]);
  (cv.experience || []).forEach(exp => {
    info.push([]);
    info.push([exp.role || "", exp.dates || ""]);
    info.push([exp.company || ""]);
    (exp.bullets || []).forEach(b => info.push(["  \u2022 " + b]));
  });
  info.push([], ["EDUCATION"]);
  (cv.education || []).forEach(edu => {
    info.push([edu.title || ""]);
    info.push([edu.institution || "", edu.result || ""]);
  });
  const skills = [["SKILL", "LEVEL"]];
  (cv.skills || []).forEach(s => skills.push([s.name || "", s.level || ""]));
  skills.push([]);
  skills.push(["LANGUAGES"]);
  (cv.languages || []).forEach(l => skills.push([l.name || "", l.level || ""]));
  return { sheets: [
    { name: "CV", data: info, cols: [{ wch: 60 }, { wch: 30 }] },
    { name: "Skills & Languages", data: skills, cols: [{ wch: 35 }, { wch: 15 }] },
  ], filename: "ONNA CV.xlsx" };
}

// ── Master list ──
export const TEMPLATE_DOCS = [
  { key: "estimate", label: "Production Estimate", icon: "📋", desc: "Full estimate with all 18 sections", gen: "genEstimate" },
  { key: "budget", label: "Budget Tracker", icon: "💰", desc: "Estimate vs actuals vs finals tracker", gen: "genBudgetTracker" },
  { key: "callsheet", label: "Call Sheet", icon: "📞", desc: "Crew contacts, schedule & venue info", gen: "genCallSheet" },
  { key: "risk", label: "Risk Assessment", icon: "⚠️", desc: "Hazards, controls & risk levels", gen: "genRiskAssessment" },
  { key: "casting", label: "Casting Table", icon: "🎭", desc: "Talent roles, agencies & rates", gen: "genCastingTable" },
  { key: "locations", label: "Location Deck", icon: "📍", desc: "Location details & contacts", gen: "genLocationDeck" },
  { key: "travel", label: "Travel Itinerary", icon: "✈️", desc: "Flights, hotels & logistics", gen: "genTravelItinerary" },
  { key: "cv", label: "CV", icon: "👤", desc: "Professional CV with experience & skills", gen: "genCV" },
];
