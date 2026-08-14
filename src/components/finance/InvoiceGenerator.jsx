import React, { useState, useRef } from "react";
import { CSLogoSlot } from "../ui/DocHelpers";
import { estFmt, estNum, api, PRINT_CLEANUP_CSS } from "../../utils/helpers";

const F = "'Avenir','Avenir Next','Nunito Sans',sans-serif";
const LS = 0.5;

const blankBank = () => ({ bankName: "", accountName: "", accountNumber: "", iban: "", swift: "", otherDetails: "" });

const ONNA_FROM = {
  name: "ONNA FILM, TV & RADIO PRODUCTION SERVICES LLC",
  address: "OFFICE NO. F1-022,\nPROPERTY INVESTMENT OFFICE 4-F1\nDUBAI, UNITED ARAB EMIRATES",
  email: "accounts@onnaproduction.com",
  phone: "",
  bank: blankBank(),
};

const BANK_FIELDS = [["Bank Name", "bankName"], ["Account Name", "accountName"], ["Account Number", "accountNumber"], ["IBAN", "iban"], ["SWIFT / BIC", "swift"]];

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
  from: { ...ONNA_FROM, bank: blankBank() },
  clientId: null,
  billTo: { company: "", name: "", email: "", phone: "", address: "" },
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
      {value || <span data-noprint="1" style={{ color: "#bbb" }}>{placeholder || ""}</span>}
    </div>
  );
}

const blankNewClient = () => ({ company: "", name: "", email: "", phone: "", billingAddress: "" });
const blankNewSender = (seed) => ({ nickname: "", name: seed?.name || "", address: seed?.address || "", email: seed?.email || "", phone: seed?.phone || "", bank: { ...blankBank(), ...(seed?.bank || {}) } });

export default function InvoiceGenerator({ T, isMobile, invoiceStore, setInvoiceStore, localClients, setLocalClients, senderProfiles, setSenderProfiles, projectEstimates, allProjectsMerged }) {
  const [activeId, setActiveId] = useState(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [convertModal, setConvertModal] = useState(false);
  const [convertProjectId, setConvertProjectId] = useState("");
  const [convertVersionIdx, setConvertVersionIdx] = useState(0);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [newClientModal, setNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState(blankNewClient());
  const [newClientSaving, setNewClientSaving] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [senderPickerOpen, setSenderPickerOpen] = useState(false);
  const [senderSearch, setSenderSearch] = useState("");
  const [newSenderModal, setNewSenderModal] = useState(false);
  const [newSenderForm, setNewSenderForm] = useState(blankNewSender());
  const printRef = useRef(null);

  const store = invoiceStore || [];
  const active = store.find((i) => i.id === activeId) || null;

  const updateActive = (fn) => {
    setInvoiceStore((prev) => (prev || []).map((inv) => (inv.id === activeId ? fn(JSON.parse(JSON.stringify(inv))) : inv)));
  };
  const setField = (path, val) => updateActive((inv) => {
    const keys = path.split(".");
    let o = inv;
    for (let i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null) o[keys[i]] = {};
      o = o[keys[i]];
    }
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

  // Editing Bill To fields while a client is linked also updates that client's saved record
  const updateLinkedClientField = (clientField, val) => {
    if (!active?.clientId) return;
    const patch = { [clientField]: val };
    setLocalClients?.((prev) => (prev || []).map((c) => (c.id === active.clientId ? { ...c, ...patch } : c)));
    api.put(`/api/clients/${active.clientId}`, patch).catch(() => {});
  };

  const applyClient = (c) => updateActive((inv) => {
    inv.clientId = c.id;
    inv.billTo = { company: c.company || "", name: c.name || "", email: c.email || "", phone: c.phone || "", address: c.billingAddress || c.country || "" };
    return inv;
  });

  const openNewClientModal = () => { setEditingClientId(null); setNewClientForm(blankNewClient()); setNewClientModal(true); };
  const openEditClientModal = (c) => {
    setEditingClientId(c.id);
    setNewClientForm({ company: c.company || "", name: c.name || "", email: c.email || "", phone: c.phone || "", billingAddress: c.billingAddress || c.country || "" });
    setNewClientModal(true);
  };

  const saveNewClient = async () => {
    const company = newClientForm.company.trim();
    if (!company) return;
    setNewClientSaving(true);
    const nc = { company, name: newClientForm.name.trim(), email: newClientForm.email.trim(), phone: newClientForm.phone.trim(), billingAddress: newClientForm.billingAddress.trim() };
    try {
      if (editingClientId) {
        await api.put(`/api/clients/${editingClientId}`, nc);
        const withId = { ...nc, id: editingClientId };
        setLocalClients?.((prev) => (prev || []).map((c) => (c.id === editingClientId ? { ...c, ...nc } : c)));
        if (active?.clientId === editingClientId) applyClient(withId);
      } else {
        const saved = await api.post("/api/clients", { ...nc, category: "Client", status: "client", source: "Invoice" });
        const withId = { ...nc, id: saved?.id ?? Date.now() };
        setLocalClients?.((prev) => [...(prev || []), withId]);
        applyClient(withId);
      }
      setNewClientModal(false);
      setClientPickerOpen(false);
      setEditingClientId(null);
      setNewClientForm(blankNewClient());
    } catch {
      window.alert("Could not save the client — please try again.");
    } finally {
      setNewClientSaving(false);
    }
  };

  const applySender = (s) => updateActive((inv) => {
    inv.fromSenderId = s.id;
    inv.from = { name: s.name || "", address: s.address || "", email: s.email || "", phone: s.phone || "", bank: { ...blankBank(), ...(s.bank || {}) } };
    return inv;
  });

  const saveNewSender = () => {
    const nickname = newSenderForm.nickname.trim();
    if (!nickname) return;
    const profile = {
      id: Date.now(),
      nickname,
      name: newSenderForm.name.trim(),
      address: newSenderForm.address.trim(),
      email: newSenderForm.email.trim(),
      phone: newSenderForm.phone.trim(),
      bank: {
        bankName: newSenderForm.bank.bankName.trim(),
        accountName: newSenderForm.bank.accountName.trim(),
        accountNumber: newSenderForm.bank.accountNumber.trim(),
        iban: newSenderForm.bank.iban.trim(),
        swift: newSenderForm.bank.swift.trim(),
        otherDetails: newSenderForm.bank.otherDetails.trim(),
      },
    };
    setSenderProfiles?.((prev) => [...(prev || []), profile]);
    applySender(profile);
    setNewSenderModal(false);
    setSenderPickerOpen(false);
    setNewSenderForm(blankNewSender());
  };

  const deleteSenderProfile = (id) => {
    if (!window.confirm("Delete this saved sender? This cannot be undone.")) return;
    setSenderProfiles?.((prev) => (prev || []).filter((s) => s.id !== id));
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
    inv.billTo = { company: proj.client || "", name: "", email: "", phone: "", address: "" };
    inv.items = items.length ? items : inv.items;
    inv.currency = est.currency || "AED";
    inv.taxPct = est.vatPct !== undefined ? est.vatPct : 5;
    inv.sourceEstimate = { projectId: proj.id, projectName: proj.name, versionLabel: est.ts?.version || "" };
    setInvoiceStore((prev) => [...(prev || []), inv]);
    setActiveId(inv.id);
    setConvertModal(false); setConvertProjectId(""); setConvertVersionIdx(0); setCreateMenuOpen(false);
  };

  // ── Export exactly what's on screen: clone the live document DOM, strip editing chrome, print ──
  const doPrint = () => {
    const el = printRef.current;
    if (!el || !active) return;
    const clone = el.cloneNode(true);
    // cloneNode() does NOT carry over the live value of React-controlled form
    // fields — their current value/selectedIndex is a JS property, not an
    // HTML attribute, so the clone would silently revert to whatever was
    // there at mount (e.g. Currency reverting to the first option). Copy the
    // live values across, in DOM order, before doing anything else.
    const origInputs = el.querySelectorAll('input');
    const cloneInputs = clone.querySelectorAll('input');
    origInputs.forEach((o, i) => { if (cloneInputs[i]) cloneInputs[i].value = o.value; });
    const origSelects = el.querySelectorAll('select');
    const cloneSelects = clone.querySelectorAll('select');
    origSelects.forEach((o, i) => { if (cloneSelects[i]) cloneSelects[i].selectedIndex = o.selectedIndex; });
    clone.querySelectorAll('[data-noprint]').forEach((n) => n.remove());
    clone.querySelectorAll('[data-cs-placeholder]').forEach((n) => n.remove());
    clone.querySelectorAll('textarea').forEach((n) => n.remove());
    clone.querySelectorAll('button').forEach((n) => n.remove());
    clone.querySelectorAll('input[type=file]').forEach((n) => n.remove());
    clone.querySelectorAll('input').forEach((inp) => {
      const sp = document.createElement('span');
      sp.textContent = inp.value || "";
      sp.style.cssText = inp.style.cssText;
      sp.style.border = "none"; sp.style.outline = "none"; sp.style.background = "transparent"; sp.style.padding = "0";
      inp.parentNode.replaceChild(sp, inp);
    });
    clone.querySelectorAll('select').forEach((sel) => {
      const sp = document.createElement('span');
      sp.textContent = sel.options[sel.selectedIndex]?.text || sel.value || "";
      sp.style.cssText = sel.style.cssText;
      sp.style.border = "none"; sp.style.outline = "none"; sp.style.background = "transparent"; sp.style.padding = "0";
      sel.parentNode.replaceChild(sp, sel);
    });
    clone.style.margin = "0"; clone.style.maxWidth = "none"; clone.style.width = "100%"; clone.style.minWidth = "0"; clone.style.border = "none"; clone.style.borderRadius = "0";
    const docTitle = `Invoice ${active.number}`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";
    document.body.appendChild(iframe);
    const _d = iframe.contentDocument;
    _d.open();
    _d.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docTitle}</title><style>@import url("https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;700&display=swap");*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:${F};font-size:11px;color:#1a1a1a;margin:0;padding:0;}@page{size:A4;margin:10mm 12mm;}@media print{*{overflow:visible!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);
    _d.close();
    _d.body.appendChild(_d.adoptNode(clone));
    const prevTitle = document.title;
    document.title = docTitle;
    const restoreTitle = () => { document.title = prevTitle; try { document.body.removeChild(iframe); } catch {} window.removeEventListener("afterprint", restoreTitle); };
    window.addEventListener("afterprint", restoreTitle);
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); }, 300);
  };
  const exportPDF = () => doPrint();

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
  const hasAnyBankInfo = BANK_FIELDS.some(([, key]) => active.from.bank?.[key]) || active.from.bank?.otherDetails;
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

      <div ref={printRef} style={{ maxWidth: 900, margin: "0 auto", background: "#fff", fontFamily: F, color: "#1a1a1a", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
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
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={lbl}>From</div>
                <div style={{ position: "relative" }} data-noprint="1">
                  <button onClick={() => { setSenderPickerOpen((v) => !v); setSenderSearch(""); }} style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, fontSize: 9, color: "#666", cursor: "pointer", fontFamily: "inherit", padding: "2px 8px" }}>Pick Sender ▾</button>
                  {senderPickerOpen && <div onClick={() => setSenderPickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />}
                  {senderPickerOpen && (() => {
                    const q = senderSearch.trim().toLowerCase();
                    const filtered = (senderProfiles || []).filter((s) => !q || [s.nickname, s.name].some((v) => (v || "").toLowerCase().includes(q)));
                    return (
                      <div style={{ position: "absolute", top: 24, right: 0, zIndex: 9999, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 240, maxHeight: 320, display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: 8, borderBottom: "1px solid #eee", flexShrink: 0 }}>
                          <input autoFocus value={senderSearch} onChange={(e) => setSenderSearch(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Search senders…" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                        </div>
                        <div style={{ overflowY: "auto", maxHeight: 260 }}>
                          {filtered.length === 0 && <div style={{ padding: "10px 14px", fontSize: 11, color: "#999" }}>{q ? "No matching senders." : "No saved senders yet."}</div>}
                          {filtered.map((s) => (
                            <div key={s.id} style={{ display: "flex", alignItems: "center", padding: "8px 14px", borderBottom: "1px solid #f5f5f5" }}>
                              <div onClick={() => { applySender(s); setSenderPickerOpen(false); }} style={{ flex: 1, cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.parentElement.style.background = "#f5f5f7")} onMouseLeave={(e) => (e.currentTarget.parentElement.style.background = "transparent")}>
                                <div style={{ fontWeight: 600, fontSize: 11.5 }}>{s.nickname}</div>
                                {s.name && <div style={{ color: "#999", fontSize: 10 }}>{s.name}</div>}
                              </div>
                              <span onClick={() => deleteSenderProfile(s.id)} style={{ cursor: "pointer", fontSize: 12, color: "#ccc", padding: "0 2px" }} onMouseEnter={(e) => (e.target.style.color = "#f44")} onMouseLeave={(e) => (e.target.style.color = "#ccc")}>{"×"}</span>
                            </div>
                          ))}
                        </div>
                        <div onClick={() => { setNewSenderForm(blankNewSender(active.from)); setNewSenderModal(true); }} style={{ padding: "9px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", color: T.accent, borderTop: "1px solid #eee", flexShrink: 0 }} onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>+ Add New Sender</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <Cell value={active.from.name} onChange={(v) => setField("from.name", v)} style={{ fontWeight: 700 }} />
              <Cell value={active.from.email} onChange={(v) => setField("from.email", v)} placeholder="Email" style={{ color: "#666" }} />
              <Cell value={active.from.phone} onChange={(v) => setField("from.phone", v)} placeholder="Phone" style={{ color: "#666" }} />
              <Cell value={active.from.address} onChange={(v) => setField("from.address", v)} textarea placeholder="Address" style={{ color: "#666" }} />
            </div>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={lbl}>Bill To</div>
                <div style={{ position: "relative" }} data-noprint="1">
                  <button onClick={() => { setClientPickerOpen((v) => !v); setClientSearch(""); }} style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, fontSize: 9, color: "#666", cursor: "pointer", fontFamily: "inherit", padding: "2px 8px" }}>Pick Client ▾</button>
                  {clientPickerOpen && <div onClick={() => setClientPickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />}
                  {clientPickerOpen && (() => {
                    const q = clientSearch.trim().toLowerCase();
                    const filtered = (localClients || []).filter((c) => !q || [c.company, c.name, c.email].some((v) => (v || "").toLowerCase().includes(q)));
                    return (
                      <div style={{ position: "absolute", top: 24, right: 0, zIndex: 9999, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 240, maxHeight: 320, display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: 8, borderBottom: "1px solid #eee", flexShrink: 0 }}>
                          <input autoFocus value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Search clients…" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                        </div>
                        <div style={{ overflowY: "auto", maxHeight: 260 }}>
                          {filtered.length === 0 && <div style={{ padding: "10px 14px", fontSize: 11, color: "#999" }}>{q ? "No matching clients." : "No clients found."}</div>}
                          {filtered.map((c) => (
                            <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "8px 14px", borderBottom: "1px solid #f5f5f5" }}>
                              <div onClick={() => { applyClient(c); setClientPickerOpen(false); }} style={{ flex: 1, cursor: "pointer", fontSize: 11.5 }} onMouseEnter={(e) => (e.currentTarget.parentElement.style.background = "#f5f5f7")} onMouseLeave={(e) => (e.currentTarget.parentElement.style.background = "transparent")}>
                                <div style={{ fontWeight: 600 }}>{c.company || c.name}</div>
                                {c.name && c.company && <div style={{ color: "#999", fontSize: 10 }}>{c.name}</div>}
                              </div>
                              <span onClick={() => openEditClientModal(c)} title="Edit client" style={{ cursor: "pointer", fontSize: 11, color: "#bbb", padding: "0 4px" }} onMouseEnter={(e) => (e.target.style.color = "#666")} onMouseLeave={(e) => (e.target.style.color = "#bbb")}>{"✎"}</span>
                            </div>
                          ))}
                        </div>
                        <div onClick={() => { openNewClientModal(); setNewClientForm((f) => ({ ...f, company: clientSearch.trim() && filtered.length === 0 ? clientSearch.trim() : "" })); }} style={{ padding: "9px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", color: T.accent, borderTop: "1px solid #eee", flexShrink: 0 }} onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>+ Add New Client</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <Cell value={active.billTo.company} onChange={(v) => { setField("billTo.company", v); updateLinkedClientField("company", v); }} placeholder="Client / Company" style={{ fontWeight: 700 }} />
              <Cell value={active.billTo.name} onChange={(v) => { setField("billTo.name", v); updateLinkedClientField("name", v); }} placeholder="Contact name" style={{ color: "#666" }} />
              <Cell value={active.billTo.email} onChange={(v) => { setField("billTo.email", v); updateLinkedClientField("email", v); }} placeholder="Email" style={{ color: "#666" }} />
              <Cell value={active.billTo.phone} onChange={(v) => { setField("billTo.phone", v); updateLinkedClientField("phone", v); }} placeholder="Phone" style={{ color: "#666" }} />
              <Cell value={active.billTo.address} onChange={(v) => { setField("billTo.address", v); updateLinkedClientField("billingAddress", v); }} textarea placeholder="Billing address" style={{ color: "#666" }} />
              {active.clientId && <div style={{ fontSize: 9, color: "#bbb", marginTop: 2 }} data-noprint="1">Synced with saved client</div>}
            </div>
          </div>

          <div style={{ marginBottom: 24 }} data-noprint={hasAnyBankInfo ? undefined : "1"}>
            <div style={lbl}>Bank Details</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "2px 24px", background: "#fafafa", borderRadius: 8, padding: "10px 14px" }}>
              {BANK_FIELDS.map(([label, key]) => (
                <div key={key} data-noprint={active.from.bank?.[key] ? undefined : "1"}>
                  <div style={{ ...lbl, marginBottom: 2 }}>{label}</div>
                  <Cell value={active.from.bank?.[key]} onChange={(v) => setField(`from.bank.${key}`, v)} />
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1" }} data-noprint={active.from.bank?.otherDetails ? undefined : "1"}>
                <div style={{ ...lbl, marginBottom: 2 }}>Other Details</div>
                <Cell value={active.from.bank?.otherDetails} onChange={(v) => setField("from.bank.otherDetails", v)} textarea placeholder="details" />
              </div>
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
                    <span data-noprint="1" onClick={() => removeItem(i)} style={{ cursor: "pointer", fontSize: 12, color: "#ccc" }} onMouseEnter={(e) => (e.target.style.color = "#f44")} onMouseLeave={(e) => (e.target.style.color = "#ccc")}>{"×"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div data-noprint="1" onClick={addItem} style={{ fontFamily: F, fontSize: 10, color: "#999", cursor: "pointer", letterSpacing: LS, marginBottom: 20 }}>+ Add Line</div>

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
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#1a1a1a" }}>{editingClientId ? "Edit Client" : "Add New Client"}</div>
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
              <button onClick={() => { setNewClientModal(false); setEditingClientId(null); }} disabled={newClientSaving} style={{ padding: "8px 16px", borderRadius: 8, background: "#f0f0f0", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={saveNewClient} disabled={!newClientForm.company.trim() || newClientSaving} style={{ padding: "8px 16px", borderRadius: 8, background: newClientForm.company.trim() ? T.accent : "#ccc", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: newClientForm.company.trim() ? "pointer" : "default", fontFamily: "inherit" }}>{newClientSaving ? "Saving…" : editingClientId ? "Save Changes" : "Save Client"}</button>
            </div>
          </div>
        </div>
      )}

      {newSenderModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setNewSenderModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 24, width: 460, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#1a1a1a" }}>Add New Sender</div>
            <div style={{ marginBottom: 10 }}>
              <div style={lbl}>Billing Nickname *</div>
              <input value={newSenderForm.nickname} onChange={(e) => setNewSenderForm((f) => ({ ...f, nickname: e.target.value }))} placeholder="e.g. ONNA (AED — Emirates NBD)" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, fontFamily: "inherit" }} />
            </div>
            {[["Name", "name"], ["Email", "email"], ["Phone", "phone"]].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={lbl}>{label}</div>
                <input value={newSenderForm[key]} onChange={(e) => setNewSenderForm((f) => ({ ...f, [key]: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, fontFamily: "inherit" }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <div style={lbl}>Address</div>
              <textarea value={newSenderForm.address} onChange={(e) => setNewSenderForm((f) => ({ ...f, address: e.target.value }))} rows={3} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: LS, textTransform: "uppercase", color: "#666", marginBottom: 10, borderTop: "1px solid #eee", paddingTop: 14 }}>Bank Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {BANK_FIELDS.map(([label, key]) => (
                <div key={key}>
                  <div style={lbl}>{label}</div>
                  <input value={newSenderForm.bank[key]} onChange={(e) => setNewSenderForm((f) => ({ ...f, bank: { ...f.bank, [key]: e.target.value } }))} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, fontFamily: "inherit" }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={lbl}>Other Bank Details</div>
              <textarea value={newSenderForm.bank.otherDetails} onChange={(e) => setNewSenderForm((f) => ({ ...f, bank: { ...f.bank, otherDetails: e.target.value } }))} rows={2} placeholder="Branch, routing number, notes…" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setNewSenderModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f0f0f0", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={saveNewSender} disabled={!newSenderForm.nickname.trim()} style={{ padding: "8px 16px", borderRadius: 8, background: newSenderForm.nickname.trim() ? T.accent : "#ccc", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: newSenderForm.nickname.trim() ? "pointer" : "default", fontFamily: "inherit" }}>Save Sender</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
