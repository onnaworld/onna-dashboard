import * as XLSX from "xlsx";
import { defaultSections, estRowTotal, estNum, getEstPhases, flattenPhaseSections, flattenPhaseSectionsForActuals } from "./helpers";

const s2ab = (s) => {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
  return buf;
};

const _downloadBlob = (blob, filename) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

const _toArgb = (hex) => "FF" + String(hex || "000000").replace("#", "").toUpperCase().padStart(6, "0");
const _thinBorder = { style: "thin", color: { argb: "FFE0E0E0" } };
const HL_FILL = { pending: "FFFFF8E8", confirmed: "FFE8F4FD", paid: "FFEDFAF3" };

// Single-sheet export with real cell styling (black section header bars, table
// borders, etc) — the plain `xlsx` package (community edition) cannot write cell
// fills/fonts/borders at all, so this uses exceljs to visually match the app/PDF.
export const downloadStyledXlsx = async (blocks, filename, opts = {}) => {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(opts.sheetName || "Sheet1", {
    pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0, orientation: opts.orientation || "landscape", margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0, footer: 0 } },
    views: [{ showGridLines: false }],
  });
  const maxCols = Math.max(1, ...blocks.map(b => (b.columns || []).length));

  // Auto-size columns from actual header/value content, since different blocks
  // reuse the same column indices for different data (mirrors PDF column widths).
  const colWidths = new Array(maxCols).fill(9);
  blocks.forEach(block => {
    (block.columns || []).forEach((c, ci) => { colWidths[ci] = Math.max(colWidths[ci], String(c.label || "").length + 2); });
    (block.rows || []).forEach(row => {
      if (row.isNote) return;
      (block.columns || []).forEach((c, ci) => { colWidths[ci] = Math.max(colWidths[ci], Math.min(String(row[c.key] ?? "").length + 2, 45)); });
    });
  });

  let r = 1;
  if (opts.title) {
    ws.mergeCells(r, 1, r, maxCols);
    const cell = ws.getRow(r).getCell(1);
    cell.value = opts.title;
    cell.font = { bold: true, size: 13, color: { argb: "FF1A1A1A" } };
    ws.getRow(r).height = 22;
    r += 2;
  }
  blocks.forEach(block => {
    const cols = block.columns || [];
    const hdrColor = _toArgb(block.headerColor || "#000000");
    const titleRow = ws.getRow(r);
    ws.mergeCells(r, 1, r, maxCols);
    const titleCell = titleRow.getCell(1);
    titleCell.value = (block.title || "").toUpperCase();
    titleCell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { vertical: "middle" };
    titleRow.height = 20;
    for (let c = 1; c <= maxCols; c++) titleRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: hdrColor } };
    r++;
    if (block.subtitle) {
      ws.mergeCells(r, 1, r, maxCols);
      const subCell = ws.getRow(r).getCell(1);
      subCell.value = block.subtitle;
      subCell.font = { italic: true, size: 8, color: { argb: "FF888888" } };
      r++;
    }
    if (cols.length > 1) {
      const hdrRow = ws.getRow(r);
      cols.forEach((c, ci) => {
        const cell = hdrRow.getCell(ci + 1);
        cell.value = c.label;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F4F4" } };
        cell.font = { bold: true, size: 9, color: { argb: "FF999999" } };
        cell.border = { top: _thinBorder, left: _thinBorder, right: _thinBorder, bottom: { style: "thin", color: { argb: "FFCCCCCC" } } };
        if (c.align) cell.alignment = { horizontal: c.align };
      });
      r++;
    }
    (block.rows || []).forEach(row => {
      const dataRow = ws.getRow(r);
      if (row.isNote) {
        ws.mergeCells(r, 1, r, maxCols);
        const cell = dataRow.getCell(1);
        cell.value = `NOTE: ${row.text || ""}`;
        cell.font = { italic: true, size: 9, color: { argb: "FFC0392B" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDECEA" } };
      } else if (cols.length <= 1) {
        ws.mergeCells(r, 1, r, maxCols);
        const cell = dataRow.getCell(1);
        cell.value = cols.length ? (row[cols[0].key] || "") : "";
        cell.alignment = { wrapText: true, vertical: "top" };
      } else {
        const rowFill = row.hl && HL_FILL[row.hl];
        cols.forEach((c, ci) => {
          const cell = dataRow.getCell(ci + 1);
          cell.value = row[c.key] || "";
          cell.border = { top: _thinBorder, left: _thinBorder, right: _thinBorder, bottom: _thinBorder };
          if (c.align) cell.alignment = { horizontal: c.align };
          if (rowFill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowFill } };
        });
      }
      r++;
    });
    r++;
  });
  colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = Math.min(Math.max(w, 10), 45); });
  const buf = await wb.xlsx.writeBuffer();
  _downloadBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
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
  const sections = flattenPhaseSections(getEstPhases(est)).filter(s => !s.hidden);
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
  const sections = flattenPhaseSectionsForActuals(getEstPhases(est));
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
  // Support multi-CV format: extract active CV data
  let cv = cvData || {};
  if (cv._multi) {
    const active = cv.cvList?.find(c => c.id === cv.activeCvId) || cv.cvList?.[0];
    cv = active?.data || {};
  }
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
