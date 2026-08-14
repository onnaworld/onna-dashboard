import React, { useState } from "react";
import { CSLogoSlot } from "../ui/DocHelpers";
import { estFmt, estNum, exportToPDF, api } from "../../utils/helpers";

const F = "'Avenir','Avenir Next','Nunito Sans',sans-serif";
const LS = 0.5;

const ONNA_FROM = {
  name: "ONNA FILM, TV & RADIO PRODUCTION SERVICES LLC",
  address: "OFFICE NO. F1-022,\nPROPERTY INVESTMENT OFFICE 4-F1\nDUBAI, UNITED ARAB EMIRATES",
  email: "accounts@onnaproduction.com",
  trn: "105161036600003",
};

const CURRENCIES = ["AED", "USD", "GBP", "EUR", "SAR"];
const STATUSES = ["Draft", "Sent", "Paid", "Overdue"];
const STATUS_BG = { Draft: "#f0f0f0", Sent: "#e8f4fd", Paid: "#edfaf3", Overdue: "#fdecea" };
const STATUS_COLOR = { Draft: "#666", Sent: "#0066cc", Paid: "#147d50", Overdue: "#c0392b" };

const pad4 = (n) => String(n).padStart(4, "0");
const nextInvoiceNumber = (store) => {
  const nums = (store || []).map((inv) => { const m = (inv.number || "").match(/(\d+)$/); return m ? parseInt(m[1]) : 0; });
  const max = nums.length ? Math.max(...nums) : 0;
  return `INV-${pad4(max + 1)}`;
};

const blankInvoice = (store) => ({
  id: Date.now(),
  number: nextInvoiceNumber(store),
  status: "Draft",
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  currency: "AED",
  logo: null,
  from: { ...ONNA_FROM },
  clientId: null,
  billTo: { company: "", name: "", email: "", address: "" },
  items: [{ id: 1, desc: "", qty: "1", rate: "0" }],
  taxPct: 5,
  notes: "",
  paymentTerms: "NET 30 days",
  sourceEstimate: null, // {projectId, projectName, versionLabel}
});

const invRowTotal = (r) => (estNum(r.qty) || 0) * estNum(r.rate);
const invCalcTotals = (inv) => {
  const subtotal = (inv.items || []).reduce((s, r) => s + invRowTotal(r), 0);
  const taxPct = inv.taxPct !== undefined ? estNum(inv.taxPct) : 0;
  const tax = subtotal * (taxPct / 100);
  return { subtotal, tax, total: subtotal + tax };
};

const escHTML = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const buildInvoiceHTML = (inv) => {
  const totals = invCalcTotals(inv);
  const bt = inv.billTo || {};
  const itemsRows = (inv.items || []).map((r) => `<tr><td>${escHTML(r.desc)}</td><td class="right">${escHTML(r.qty)}</td><td class="right">${inv.currency} ${estFmt(estNum(r.rate))}</td><td class="right">${inv.currency} ${estFmt(invRowTotal(r))}</td></tr>`).join("");
  return `
    <div class="meta">
      <div class="ml"><label>Bill To</label>${escHTML(bt.company)}${bt.name ? "<br>" + escHTML(bt.name) : ""}${bt.email ? "<br>" + escHTML(bt.email) : ""}${bt.address ? "<br>" + escHTML(bt.address).replace(/\n/g, "<br>") : ""}</div>
      <div class="ml"><label>Invoice #</label>${escHTML(inv.number)}</div>
      <div class="ml"><label>Date</label>${escHTML(inv.date)}</div>
      <div class="ml"><label>Due Date</label>${escHTML(inv.dueDate || "—")}</div>
    </div>
    <table>
      <thead><tr><th>Description</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
      <tbody>${itemsRows}</tbody>
      <tbody>
        <tr class="sub"><td colspan="3" class="right">Subtotal</td><td class="right">${inv.currency} ${estFmt(totals.subtotal)}</td></tr>
        <tr class="vat"><td colspan="3" class="right">Tax (${escHTML(inv.taxPct || 0)}%)</td><td class="right">${inv.currency} ${estFmt(totals.tax)}</td></tr>
        <tr class="grand"><td colspan="3" class="right">Total Due</td><td class="right">${inv.currency} ${estFmt(totals.total)}</td></tr>
      </tbody>
    </table>
    ${inv.paymentTerms ? `<div class="sec">Payment Terms</div><p>${escHTML(inv.paymentTerms)}</p>` : ""}
    ${inv.notes ? `<div class="sec">Notes</div><p style="white-space:pre-line">${escHTML(inv.notes)}</p>` : ""}
  `;
};

// ── Small inline-editable cell (click to edit, blur/Enter to commit) ──
function Cell({ value, onChange, align, placeholder, style, textarea }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value || "");
  const baseStyle = { fontFamily: F, fontSize: 11, letterSpacing: LS, padding: "5px 6px", textAlign: align || "left", width: "100%", boxSizing: "border-box", ...style };
  if (editing) {
    const Tag = textarea ? "textarea" : "input";
    return (
      <Tag
        autoFocus
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={() => { setEditing(false); onChange(temp); }}
        onKeyDown={(e) => { if (!textarea && e.key === "Enter") e.target.blur(); }}
        rows={textarea ? 3 : undefined}
        style={{ ...baseStyle, border: "1px solid #E0D9A8", background: "#FFFDE7", outline: "none", resize: textarea ? "vertical" : "none" }}
      />
    );
  }
  return (
    <div onClick={() => { setTemp(value || ""); setEditing(true); }} style={{ ...baseStyle, cursor: "text", minHeight: 20, whiteSpace: textarea ? "pre-wrap" : "nowrap", overflow: "hidden", textOverflow: "ellipsis", border: "1px solid transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#eee")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}>
      {value || <span style={{ color: "#bbb" }}>{placeholder || ""}</span>}
    </div>
  );
}

const blankNewClient = () => ({ company: "", name: "", email: "", phone: "", billingAddress: "" });

export default function InvoiceGenerator({ T, isMobile, invoiceStore, setInvoiceStore, localClients, setLocalClients, projectEstimates, allProjectsMerged }) {
  const [activeId, setActiveId] = useState(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [convertModal, setConvertModal] = useState(false);
  const [convertProjectId, setConvertProjectId] = useState("");
  const [convertVersionIdx, setConvertVersionIdx] = useState(0);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [newClientModal, setNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState(blankNewClient());
  const [newClientSaving, setNewClientSaving] = useState(false);

  const store = invoiceStore || [];
  const active = store.find((i) => i.id === activeId) || null;

  const updateActive = (fn) => {
    setInvoiceStore((prev) => (prev || []).map((inv) => (inv.id === activeId ? fn(JSON.parse(JSON.stringify(inv))) : inv)));
  };
  const setField = (path, val) => updateActive((inv) => {
    const keys = path.split(".");
    let o = inv;
    for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
    o[keys[keys.length - 1]] = val;
    return inv;
  });

  const addBlank = () => {
    const inv = blankInvoice(store);
    setInvoiceStore((prev) => [...(prev || []), inv]);
    setActiveId(inv.id);
    setCreateMenuOpen(false);
  };

  const deleteInvoice = (id) => {
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    setInvoiceStore((prev) => (prev || []).filter((i) => i.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const addItem = () => updateActive((inv) => { inv.items.push({ id: Date.now(), desc: "", qty: "1", rate: "0" }); return inv; });
  const removeItem = (idx) => updateActive((inv) => { if (inv.items.length > 1) inv.items.splice(idx, 1); return inv; });
  const setItemField = (idx, field, val) => updateActive((inv) => { inv.items[idx][field] = val; return inv; });

  const applyClient = (c) => updateActive((inv) => {
    inv.clientId = c.id;
    inv.billTo = { company: c.company || "", name: c.name || "", email: c.email || "", address: c.billingAddress || c.country || "" };
    return inv;
  });

  const saveNewClient = async () => {
    const company = newClientForm.company.trim();
    if (!company) return;
    setNewClientSaving(true);
    const nc = { company, name: newClientForm.name.trim(), email: newClientForm.email.trim(), phone: newClientForm.phone.trim(), billingAddress: newClientForm.billingAddress.trim(), category: "Client", status: "client", source: "Invoice" };
    try {
      const saved = await api.post("/api/clients", nc);
      const withId = { ...nc, id: saved?.id ?? Date.now() };
      setLocalClients?.((prev) => [...(prev || []), withId]);
      applyClient(withId);
      setNewClientModal(false);
      setClientPickerOpen(false);
      setNewClientForm(blankNewClient());
    } catch {
      window.alert("Could not save the new client — please try again.");
    } finally {
      setNewClientSaving(false);
    }
  };

  // ── Convert from estimate ──
  const estimateProjects = (allProjectsMerged || []).filter((p) => (projectEstimates || {})[p.id]?.length);
  const versionsForProject = convertProjectId ? (projectEstimates[convertProjectId] || []) : [];

  const doConvert = () => {
    const proj = (allProjectsMerged || []).find((p) => String(p.id) === String(convertProjectId));
    const est = versionsForProject[convertVersionIdx];
    if (!proj || !est) return;
    const items = [];
    (est.sections || []).forEach((sec) => {
      (sec.rows || []).forEach((row) => {
        const days = estNum(row.days) || 1, qty = estNum(row.qty) || 1, rate = estNum(row.rate);
        const desc = [row.desc, row.notes].filter(Boolean).join(" — ") || sec.title;
        if (!row.desc && !rate) return;
        items.push({ id: Date.now() + Math.random(), desc, qty: String(days * qty), rate: String(rate) });
      });
    });
    const inv = blankInvoice(store);
    inv.billTo = { company: proj.client || "", name: "", email: "", address: "" };
    inv.items = items.length ? items : inv.items;
    inv.currency = est.currency || "AED";
    inv.taxPct = est.vatPct !== undefined ? est.vatPct : 5;
    inv.sourceEstimate = { projectId: proj.id, projectName: proj.name, versionLabel: est.ts?.version || "" };
    setInvoiceStore((prev) => [...(prev || []), inv]);
    setActiveId(inv.id);
    setConvertModal(false); setConvertProjectId(""); setConvertVersionIdx(0); setCreateMenuOpen(false);
  };

  const exportPDF = () => {
    if (!active) return;
    exportToPDF(buildInvoiceHTML(active), `Invoice ${active.number}`);
  };

  const lbl = { fontFamily: F, fontSize: 9, fontWeight: 700, letterSpacing: LS, color: "#999", textTransform: "uppercase", marginBottom: 4 };
  const th = { fontFamily: F, fontSize: 9, fontWeight: 800, letterSpacing: LS, color: "#555", textTransform: "uppercase", padding: "6px 6px", background: "#f4f4f4", borderBottom: "1px solid #ddd" };

  // ── List view ──
  if (!active) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Invoices</div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setCreateMenuOpen((v) => !v)} style={{ padding: "7px 16px", borderRadius: 9, background: T.accent, color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ New Invoice ▾</button>
            {createMenuOpen && <div onClick={() => setCreateMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />}
            {createMenuOpen && (
              <div style={{ position: "absolute", top: 36, right: 0, zIndex: 9999, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 200, overflow: "hidden" }}>
                <div onClick={addBlank} style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#1d1d1f", fontFamily: "inherit", borderBottom: "1px solid #f0f0f0" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>+ New Blank</div>
                <div onClick={() => { setConvertModal(true); setCreateMenuOpen(false); }} style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#1d1d1f", fontFamily: "inherit" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>Convert from Estimate</div>
              </div>
            )}
          </div>
        </div>

        {store.length === 0 && <div style={{ borderRadius: 14, background: "#fafafa", border: `1.5px dashed ${T.border}`, padding: 44, textAlign: "center" }}><div style={{ fontSize: 13, color: T.muted }}>No invoices yet. Click "+ New Invoice" to get started.</div></div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {store.slice().reverse().map((inv) => {
            const totals = invCalcTotals(inv);
            return (
              <div key={inv.id} onClick={() => setActiveId(inv.id)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "border-color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.accent)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: STATUS_BG[inv.status] || "#eee", color: STATUS_COLOR[inv.status] || "#555", padding: "2px 8px", borderRadius: 4 }}>{inv.status}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{inv.number}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{inv.billTo?.company || "No client set"}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{inv.date || "No date"}{inv.dueDate ? ` · Due ${inv.dueDate}` : ""}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{inv.currency} {estFmt(totals.total)}</div>
                <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => deleteInvoice(inv.id)} style={{ padding: "4px 10px", borderRadius: 7, background: "#fff5f5", color: "#c0392b", border: "1px solid #f5c6cb", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>

        {convertModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConvertModal(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 24, width: 420, maxWidth: "90vw" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#1a1a1a" }}>Convert Estimate to Invoice</div>
              {estimateProjects.length === 0 ? (
                <div style={{ fontSize: 12, color: "#999", marginBottom: 14 }}>No projects with estimates found.</div>
              ) : (
                <>
                  <div style={{ ...lbl, marginTop: 0 }}>Project</div>
                  <select value={convertProjectId} onChange={(e) => { setConvertProjectId(e.target.value); setConvertVersionIdx(0); }} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, fontFamily: "inherit", marginBottom: 12 }}>
                    <option value="">Select a project…</option>
                    {estimateProjects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.client ? ` (${p.client})` : ""}</option>)}
                  </select>
                  {convertProjectId && (
                    <>
                      <div style={lbl}>Estimate Version</div>
                      <select value={convertVersionIdx} onChange={(e) => setConvertVersionIdx(Number(e.target.value))} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, fontFamily: "inherit", marginBottom: 16 }}>
                        {versionsForProject.map((v, i) => <option key={v.id || i} value={i}>{v.label || v.ts?.version || `Version ${i + 1}`}</option>)}
                      </select>
                    </>
                  )}
                </>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={() => setConvertModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f0f0f0", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={doConvert} disabled={!convertProjectId} style={{ padding: "8px 16px", borderRadius: 8, background: convertProjectId ? T.accent : "#ccc", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: convertProjectId ? "pointer" : "default", fontFamily: "inherit" }}>Create Invoice</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Detail / editor view ──
  const totals = invCalcTotals(active);
  return (
    <div>
      <button onClick={() => setActiveId(null)} style={{ background: "none", border: "none", color: T.link, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>‹ Back to Invoices</button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select value={active.status} onChange={(e) => setField("status", e.target.value)} style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid #ddd", fontSize: 11, fontWeight: 700, fontFamily: "inherit", background: STATUS_BG[active.status], color: STATUS_COLOR[active.status], cursor: "pointer" }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportPDF} style={{ padding: "7px 16px", borderRadius: 9, background: "#000", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Export PDF</button>
          <button onClick={() => deleteInvoice(active.id)} style={{ padding: "7px 16px", borderRadius: 9, background: "#fff5f5", color: "#c0392b", border: "1px solid #f5c6cb", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", background: "#fff", fontFamily: F, color: "#1a1a1a", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "40px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <CSLogoSlot label="Production Logo" image={active.logo} onUpload={(v) => setField("logo", v)} onRemove={() => setField("logo", null)} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>Invoice</div>
              <Cell value={active.number} onChange={(v) => setField("number", v)} align="right" style={{ fontSize: 11, color: "#999" }} />
            </div>
          </div>
          <div style={{ borderBottom: "2.5px solid #000", marginBottom: 16 }} />

          {active.sourceEstimate && (
            <div style={{ fontSize: 10, color: "#999", marginBottom: 14, fontStyle: "italic" }}>
              Converted from estimate "{active.sourceEstimate.versionLabel}" — {active.sourceEstimate.projectName}
            </div>
          )}

          <div style={{ display: "flex", gap: 30, marginBottom: 24, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={lbl}>From</div>
              <Cell value={active.from.name} onChange={(v) => setField("from.name", v)} style={{ fontWeight: 700 }} />
              <Cell value={active.from.address} onChange={(v) => setField("from.address", v)} textarea style={{ color: "#666" }} />
              <Cell value={active.from.email} onChange={(v) => setField("from.email", v)} style={{ color: "#666" }} />
            </div>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={lbl}>Bill To</div>
                <div style={{ position: "relative" }}>
                  <button onClick={() => setClientPickerOpen((v) => !v)} style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, fontSize: 9, color: "#666", cursor: "pointer", fontFamily: "inherit", padding: "2px 8px" }}>Pick Client ▾</button>
                  {clientPickerOpen && <div onClick={() => setClientPickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />}
                  {clientPickerOpen && (
                    <div style={{ position: "absolute", top: 24, right: 0, zIndex: 9999, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 220, maxHeight: 300, display: "flex", flexDirection: "column" }}>
                      <div style={{ overflowY: "auto", maxHeight: 260 }}>
                        {(localClients || []).length === 0 && <div style={{ padding: "10px 14px", fontSize: 11, color: "#999" }}>No clients found.</div>}
                        {(localClients || []).map((c) => (
                          <div key={c.id} onClick={() => { applyClient(c); setClientPickerOpen(false); }} style={{ padding: "8px 14px", fontSize: 11.5, cursor: "pointer", borderBottom: "1px solid #f5f5f5" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                            <div style={{ fontWeight: 600 }}>{c.company || c.name}</div>
                            {c.name && c.company && <div style={{ color: "#999", fontSize: 10 }}>{c.name}</div>}
                          </div>
                        ))}
                      </div>
                      <div onClick={() => { setNewClientForm(blankNewClient()); setNewClientModal(true); }} style={{ padding: "9px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", color: T.accent, borderTop: "1px solid #eee", flexShrink: 0 }} onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>+ Add New Client</div>
                    </div>
                  )}
                </div>
              </div>
              <Cell value={active.billTo.company} onChange={(v) => setField("billTo.company", v)} placeholder="Client / Company" style={{ fontWeight: 700 }} />
              <Cell value={active.billTo.name} onChange={(v) => setField("billTo.name", v)} placeholder="Contact name" style={{ color: "#666" }} />
              <Cell value={active.billTo.email} onChange={(v) => setField("billTo.email", v)} placeholder="Email" style={{ color: "#666" }} />
              <Cell value={active.billTo.address} onChange={(v) => setField("billTo.address", v)} textarea placeholder="Billing address" style={{ color: "#666" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
            <div>
              <div style={lbl}>Date</div>
              <input type="date" value={active.date} onChange={(e) => setField("date", e.target.value)} style={{ fontFamily: F, fontSize: 11, border: "1px solid #eee", borderRadius: 4, padding: "5px 8px" }} />
            </div>
            <div>
              <div style={lbl}>Due Date</div>
              <input type="date" value={active.dueDate} onChange={(e) => setField("dueDate", e.target.value)} style={{ fontFamily: F, fontSize: 11, border: "1px solid #eee", borderRadius: 4, padding: "5px 8px" }} />
            </div>
            <div>
              <div style={lbl}>Currency</div>
              <select value={active.currency} onChange={(e) => setField("currency", e.target.value)} style={{ fontFamily: F, fontSize: 11, border: "1px solid #eee", borderRadius: 4, padding: "5px 8px" }}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={lbl}>Tax %</div>
              <input type="text" value={active.taxPct} onChange={(e) => setField("taxPct", e.target.value)} style={{ fontFamily: F, fontSize: 11, border: "1px solid #eee", borderRadius: 4, padding: "5px 8px", width: 50, textAlign: "center" }} />
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
            <thead>
              <tr>
                <td style={{ ...th, width: "auto" }}>Description</td>
                <td style={{ ...th, width: 70, textAlign: "center" }}>Qty</td>
                <td style={{ ...th, width: 100, textAlign: "right" }}>Rate</td>
                <td style={{ ...th, width: 100, textAlign: "right" }}>Amount</td>
                <td style={{ ...th, width: 24 }}></td>
              </tr>
            </thead>
            <tbody>
              {active.items.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td><Cell value={row.desc} onChange={(v) => setItemField(i, "desc", v)} placeholder="Item description" /></td>
                  <td><Cell value={row.qty} onChange={(v) => setItemField(i, "qty", v)} align="center" /></td>
                  <td><Cell value={row.rate} onChange={(v) => setItemField(i, "rate", v)} align="right" /></td>
                  <td style={{ padding: "5px 6px", fontFamily: F, fontSize: 11, textAlign: "right" }}>{estFmt(invRowTotal(row))}</td>
                  <td style={{ textAlign: "center" }}>
                    <span onClick={() => removeItem(i)} style={{ cursor: "pointer", fontSize: 12, color: "#ccc" }} onMouseEnter={(e) => (e.target.style.color = "#f44")} onMouseLeave={(e) => (e.target.style.color = "#ccc")}>{"×"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div onClick={addItem} style={{ fontFamily: F, fontSize: 10, color: "#999", cursor: "pointer", letterSpacing: LS, marginBottom: 20 }}>+ Add Line</div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 260 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontFamily: F, fontSize: 11 }}><span>Subtotal</span><span>{active.currency} {estFmt(totals.subtotal)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontFamily: F, fontSize: 11, borderTop: "1px solid #eee" }}><span>Tax ({active.taxPct || 0}%)</span><span>{active.currency} {estFmt(totals.tax)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontFamily: F, fontSize: 12, fontWeight: 700, borderTop: "2px solid #000" }}><span>Total Due</span><span>{active.currency} {estFmt(totals.total)}</span></div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={lbl}>Payment Terms</div>
            <Cell value={active.paymentTerms} onChange={(v) => setField("paymentTerms", v)} placeholder="e.g. NET 30 days" />
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={lbl}>Notes</div>
            <Cell value={active.notes} onChange={(v) => setField("notes", v)} textarea placeholder="Any additional notes…" />
          </div>
        </div>
      </div>

      {newClientModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => !newClientSaving && setNewClientModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 24, width: 420, maxWidth: "90vw" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#1a1a1a" }}>Add New Client</div>
            {[["Company *", "company"], ["Contact Name", "name"], ["Email", "email"], ["Phone", "phone"]].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={lbl}>{label}</div>
                <input value={newClientForm[key]} onChange={(e) => setNewClientForm((f) => ({ ...f, [key]: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, fontFamily: "inherit" }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <div style={lbl}>Billing Address</div>
              <textarea value={newClientForm.billingAddress} onChange={(e) => setNewClientForm((f) => ({ ...f, billingAddress: e.target.value }))} rows={3} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setNewClientModal(false)} disabled={newClientSaving} style={{ padding: "8px 16px", borderRadius: 8, background: "#f0f0f0", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={saveNewClient} disabled={!newClientForm.company.trim() || newClientSaving} style={{ padding: "8px 16px", borderRadius: 8, background: newClientForm.company.trim() ? T.accent : "#ccc", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: newClientForm.company.trim() ? "pointer" : "default", fontFamily: "inherit" }}>{newClientSaving ? "Saving…" : "Save Client"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
