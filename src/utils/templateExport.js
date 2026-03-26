import * as XLSX from "xlsx";
import { defaultSections, estRowTotal, estNum } from "./helpers";

const s2ab = (s) => {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
  return buf;
};

const downloadXlsx = (wb, filename) => {
  const out = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
  const blob = new Blob([s2ab(out)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

// ── Production Estimate ──
export function exportEstimateXlsx(estimateData) {
  const wb = XLSX.utils.book_new();
  const est = estimateData || {};
  const ts = est.ts || {};
  const sections = est.sections || defaultSections();

  // Header info sheet
  const headerRows = [
    ["ONNA PRODUCTION ESTIMATE"],
    [],
    ["Version", ts.version || ""],
    ["Date", ts.date || ""],
    ["Client", ts.client || ""],
    ["Project", ts.project || ""],
    ["Attention", ts.attention || ""],
    ["Photographer / Director", ts.photographer || ""],
    ["Deliverables", ts.deliverables || ""],
    ["Deadlines", ts.deadlines || ""],
    ["Usage", ts.usage || ""],
    ["Shoot Date", ts.shootDate || ""],
    ["Shoot Days", ts.shootDays || ""],
    ["Shoot Hours", ts.shootHours || ""],
    ["Location", ts.location || ""],
    ["Payment Terms", ts.payment || ""],
  ];
  const headerWs = XLSX.utils.aoa_to_sheet(headerRows);
  headerWs["!cols"] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, headerWs, "Project Info");

  // Main estimate sheet
  const rows = [["REF", "DESCRIPTION", "NOTES", "DAYS", "QTY", "RATE", "TOTAL"]];
  sections.forEach(sec => {
    rows.push([]);
    rows.push([sec.num, sec.title, "", "", "", "", ""]);
    sec.rows.forEach(r => {
      const total = estRowTotal(r);
      rows.push([r.ref, r.desc, r.notes || "", estNum(r.days), estNum(r.qty), estNum(r.rate), total]);
    });
    const secTotal = sec.rows.reduce((s, r) => s + estRowTotal(r), 0);
    rows.push(["", "", "", "", "", "SUBTOTAL", Math.round(secTotal * 100) / 100]);
  });
  const grandTotal = sections.reduce((s, sec) => s + sec.rows.reduce((t, r) => t + estRowTotal(r), 0), 0);
  rows.push([]);
  rows.push(["", "", "", "", "", "GRAND TOTAL", Math.round(grandTotal * 100) / 100]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 6 }, { wch: 35 }, { wch: 30 }, { wch: 8 }, { wch: 6 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, "Estimate");

  downloadXlsx(wb, "ONNA Production Estimate Template.xlsx");
}

// ── Budget Tracker ──
export function exportBudgetTrackerXlsx(estimateData, actualsData) {
  const wb = XLSX.utils.book_new();
  const est = estimateData || {};
  const sections = est.sections || defaultSections();
  const actSections = actualsData || [];

  const rows = [["REF", "DESCRIPTION", "NOTES", "DAYS", "QTY", "RATE", "ESTIMATE", "ACTUALS", "FINALS", "VARIANCE", "STATUS"]];

  sections.forEach((sec, si) => {
    const actSec = actSections[si];
    rows.push([]);
    rows.push([sec.num, sec.title, "", "", "", "", "", "", "", "", ""]);
    sec.rows.forEach((r, ri) => {
      const estTotal = estRowTotal(r);
      const actRow = actSec?.rows?.[ri];
      const actAmt = actRow ? estNum(actRow.actualsAmount) : 0;
      const finAmt = actRow ? estNum(actRow.zohoAmount) : 0;
      const variance = estTotal - actAmt;
      const status = actRow?.status || "";
      rows.push([r.ref, r.desc, r.notes || "", estNum(r.days), estNum(r.qty), estNum(r.rate), estTotal, actAmt, finAmt, Math.round(variance * 100) / 100, status]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 6 }, { wch: 35 }, { wch: 25 }, { wch: 8 }, { wch: 6 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, "Budget Tracker");

  downloadXlsx(wb, "ONNA Budget Tracker Template.xlsx");
}

// ── Call Sheet ──
export function exportCallSheetXlsx(csData) {
  const wb = XLSX.utils.book_new();
  const cs = csData || {};

  // Info sheet
  const infoRows = [
    ["ONNA CALL SHEET"],
    [],
    ["Shoot Name", cs.shootName || ""],
    ["Date", cs.date || ""],
    ["Day Number", cs.dayNumber || ""],
    ["Passport Note", cs.passportNote || ""],
    [],
    ["VENUE INFORMATION"],
  ];
  (cs.venueRows || []).forEach(v => infoRows.push([v.label || "", v.value || ""]));
  infoRows.push([], ["SCHEDULE"]);
  infoRows.push(["TIME", "ACTIVITY", "NOTES"]);
  (cs.schedule || []).forEach(s => infoRows.push([s.time || "", s.activity || "", s.notes || ""]));

  const infoWs = XLSX.utils.aoa_to_sheet(infoRows);
  infoWs["!cols"] = [{ wch: 20 }, { wch: 40 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, infoWs, "Call Sheet");

  // Crew sheet
  const crewRows = [["DEPARTMENT", "NAME", "ROLE", "MOBILE", "EMAIL", "CALL TIME"]];
  (cs.departments || []).forEach(dept => {
    crewRows.push([]);
    crewRows.push([dept.name || "", "", "", "", "", ""]);
    (dept.crew || []).forEach(c => {
      crewRows.push(["", c.name || "", c.role || "", c.mobile || "", c.email || "", c.callTime || ""]);
    });
  });

  const crewWs = XLSX.utils.aoa_to_sheet(crewRows);
  crewWs["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, crewWs, "Crew");

  downloadXlsx(wb, "ONNA Call Sheet Template.xlsx");
}

// ── Casting Table ──
export function exportCastingTableXlsx(castingData) {
  const wb = XLSX.utils.book_new();
  const tables = castingData || [];

  if (tables.length === 0) {
    const rows = [["ONNA CASTING TABLE"], [], ["ROLE", "NAME", "AGENCY", "RATE", "USAGE", "FIT DATE", "STATUS", "NOTES"]];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, "Casting");
  } else {
    tables.forEach((table, ti) => {
      const rows = [["ROLE", "NAME", "AGENCY", "RATE", "USAGE", "FIT DATE", "STATUS", "NOTES"]];
      (table.rows || []).forEach(r => {
        rows.push([r.role || "", r.name || "", r.agency || "", r.rate || "", r.usage || "", r.fitDate || "", r.status || "", r.notes || ""]);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws, table.label || `Table ${ti + 1}`);
    });
  }

  downloadXlsx(wb, "ONNA Casting Table Template.xlsx");
}

// ── Location Deck ──
export function exportLocationDeckXlsx(locData) {
  const wb = XLSX.utils.book_new();
  const versions = locData || [];

  const rows = [["ONNA LOCATION DECK"], [], ["LOCATION NAME", "ADDRESS", "TYPE", "CONTACT", "PHONE", "RATE", "NOTES"]];
  if (versions.length > 0) {
    const latest = versions[versions.length - 1];
    (latest.locations || []).forEach(loc => {
      rows.push([loc.name || "", loc.address || "", loc.type || "", loc.contact || "", loc.phone || "", loc.rate || "", loc.notes || ""]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, "Locations");

  downloadXlsx(wb, "ONNA Location Deck Template.xlsx");
}

// ── Risk Assessment ──
export function exportRiskAssessmentXlsx(raData) {
  const wb = XLSX.utils.book_new();
  const ra = raData || {};

  const infoRows = [
    ["ONNA RISK ASSESSMENT"],
    [],
    ["Project", ra.projectName || ""],
    ["Client", ra.clientName || ""],
    ["Date", ra.date || ""],
    ["Location", ra.location || ""],
    ["Producer", ra.producer || ""],
    ["Director / Photographer", ra.director || ""],
  ];
  const infoWs = XLSX.utils.aoa_to_sheet(infoRows);
  infoWs["!cols"] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, infoWs, "Info");

  const riskRows = [["HAZARD", "WHO AT RISK", "RISK LEVEL", "CONTROL MEASURES", "RESIDUAL RISK"]];
  (ra.risks || []).forEach(r => {
    riskRows.push([r.hazard || "", r.whoAtRisk || "", r.riskLevel || "", r.controls || "", r.residualRisk || ""]);
  });
  const riskWs = XLSX.utils.aoa_to_sheet(riskRows);
  riskWs["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 40 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, riskWs, "Risks");

  downloadXlsx(wb, "ONNA Risk Assessment Template.xlsx");
}

// ── Travel Itinerary ──
export function exportTravelItineraryXlsx(tiData) {
  const wb = XLSX.utils.book_new();
  const ti = tiData || {};

  // Flights
  const flightRows = [["ONNA TRAVEL ITINERARY — FLIGHTS"], [], ["PASSENGER", "AIRLINE", "FLIGHT #", "FROM", "TO", "DEPART", "ARRIVE", "BOOKING REF", "STATUS"]];
  (ti.flights || []).forEach(f => {
    flightRows.push([f.passenger || "", f.airline || "", f.flightNo || "", f.from || "", f.to || "", f.depart || "", f.arrive || "", f.ref || "", f.status || ""]);
  });
  const flightWs = XLSX.utils.aoa_to_sheet(flightRows);
  flightWs["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, flightWs, "Flights");

  // Hotels
  const hotelRows = [["GUEST", "HOTEL", "CHECK IN", "CHECK OUT", "ROOM TYPE", "BOOKING REF", "NOTES"]];
  (ti.hotels || []).forEach(h => {
    hotelRows.push([h.guest || "", h.hotel || "", h.checkIn || "", h.checkOut || "", h.roomType || "", h.ref || "", h.notes || ""]);
  });
  const hotelWs = XLSX.utils.aoa_to_sheet(hotelRows);
  hotelWs["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 15 }, { wch: 14 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, hotelWs, "Hotels");

  downloadXlsx(wb, "ONNA Travel Itinerary Template.xlsx");
}

// ── Master list of all template docs ──
export const TEMPLATE_DOCS = [
  { key: "estimate", label: "Production Estimate", icon: "📋", desc: "Full estimate with all 18 sections" },
  { key: "budget", label: "Budget Tracker", icon: "💰", desc: "Estimate vs actuals vs finals tracker" },
  { key: "callsheet", label: "Call Sheet", icon: "📞", desc: "Crew contacts, schedule & venue info" },
  { key: "risk", label: "Risk Assessment", icon: "⚠️", desc: "Hazards, controls & risk levels" },
  { key: "casting", label: "Casting Table", icon: "🎭", desc: "Talent roles, agencies & rates" },
  { key: "locations", label: "Location Deck", icon: "📍", desc: "Location details & contacts" },
  { key: "travel", label: "Travel Itinerary", icon: "✈️", desc: "Flights, hotels & logistics" },
];
