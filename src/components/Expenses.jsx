import React, { useState, useEffect, useRef, useCallback } from "react";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const parseCSVLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
};

const detectColumns = (headers) => {
  const lower = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const find = (...keywords) => lower.findIndex(h => keywords.some(k => h.includes(k)));
  return {
    date: find("date", "posted", "transactiondate", "valuedate"),
    description: find("description", "narrative", "details", "memo", "particulars", "reference"),
    amount: find("amount", "value", "sum"),
    debit: find("debit", "withdrawal", "dr"),
    credit: find("credit", "deposit", "cr"),
    balance: find("balance", "runningbalance"),
    category: find("category", "type"),
    reference: find("reference", "ref", "cheque"),
  };
};

export default function Expenses({
  T, isMobile,
  SearchBar, Pill,
  setUndoToastMsg,
}) {
  const [expenses, setExpenses] = useState(() => {
    try { const s = localStorage.getItem("onna_expenses"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem("onna_expenses", JSON.stringify(expenses)); } catch {} }, [expenses]);

  const [selectedMonth, setSelectedMonth] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const fileRef = useRef();
  const receiptRef = useRef();

  const showToast = msg => { if (setUndoToastMsg) { setUndoToastMsg(msg); setTimeout(() => setUndoToastMsg(""), 3000); } };

  const parseNum = (v) => parseFloat(String(v).replace(/[^0-9.\-]/g, "")) || 0;
  const fmtAmt = (n) => {
    if (!n && n !== 0) return "—";
    const abs = Math.abs(n);
    return (n < 0 ? "-" : "") + "AED " + abs.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /* ── CSV Import ── */
  const handleCSV = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { showToast("CSV file is empty or has no data rows"); return; }

      const headers = parseCSVLine(lines[0]);
      const cols = detectColumns(headers);

      if (cols.date < 0 && cols.description < 0) {
        showToast("Could not detect date or description columns");
        return;
      }

      const newExpenses = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length < 2) continue;

        const dateRaw = cols.date >= 0 ? row[cols.date] : "";
        const desc = cols.description >= 0 ? row[cols.description] : row.slice(1).join(" ");
        const cat = cols.category >= 0 ? row[cols.category] : "";
        const ref = cols.reference >= 0 ? row[cols.reference] : "";

        let amount = 0;
        if (cols.amount >= 0) {
          amount = parseNum(row[cols.amount]);
        } else if (cols.debit >= 0 || cols.credit >= 0) {
          const debit = cols.debit >= 0 ? parseNum(row[cols.debit]) : 0;
          const credit = cols.credit >= 0 ? parseNum(row[cols.credit]) : 0;
          amount = credit > 0 ? credit : -debit;
        }

        const balance = cols.balance >= 0 ? parseNum(row[cols.balance]) : null;

        // Parse date
        let parsedDate = "";
        if (dateRaw) {
          const d = new Date(dateRaw);
          if (!isNaN(d.getTime())) {
            parsedDate = d.toISOString().split("T")[0];
          } else {
            // Try DD/MM/YYYY
            const parts = dateRaw.split(/[/\-.]/);
            if (parts.length === 3) {
              const [a, b, c] = parts;
              const tryDate = new Date(`${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`);
              if (!isNaN(tryDate.getTime())) parsedDate = tryDate.toISOString().split("T")[0];
            }
          }
        }

        if (!desc && !amount) continue;

        newExpenses.push({
          id: Date.now() + i,
          date: parsedDate,
          description: desc,
          amount,
          balance,
          category: cat,
          reference: ref,
          receipt: null,
          notes: "",
        });
      }

      if (newExpenses.length === 0) { showToast("No valid rows found in CSV"); return; }

      setExpenses(prev => [...prev, ...newExpenses]);
      showToast(`Imported ${newExpenses.length} transactions`);
    };
    reader.readAsText(file);
  }, []);

  /* ── Receipt upload ── */
  const handleReceiptUpload = (expenseId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setExpenses(prev => prev.map(ex =>
        ex.id === expenseId ? { ...ex, receipt: { name: file.name, type: file.type, data: e.target.result } } : ex
      ));
      showToast("Receipt uploaded");
    };
    reader.readAsDataURL(file);
  };

  /* ── Filtering ── */
  const months = ["All", ...MONTH_LABELS];
  const sq = search.toLowerCase();
  const filtered = expenses.filter(ex => {
    if (selectedMonth !== "All") {
      if (!ex.date) return false;
      const m = new Date(ex.date).getMonth();
      if (MONTH_LABELS[m] !== selectedMonth) return false;
    }
    if (sq) {
      return [ex.description, ex.category, ex.reference, ex.notes, ex.date].some(v => v && v.toLowerCase().includes(sq));
    }
    return true;
  }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const totalDebit = filtered.filter(e => e.amount < 0).reduce((s, e) => s + e.amount, 0);
  const totalCredit = filtered.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0);

  /* ── Styles ── */
  const thS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, padding: "10px 14px", borderBottom: `2px solid ${T.border}`, textAlign: "left" };
  const tdS = { fontSize: 12.5, padding: "11px 14px", borderBottom: `1px solid ${T.borderSub || T.border}`, color: T.text };
  const tdR = { ...tdS, textAlign: "right", fontVariantNumeric: "tabular-nums" };

  return (
    <div>
      {/* ── Month pills ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {months.map(m => (
          <Pill key={m} label={m} active={selectedMonth === m} onClick={() => setSelectedMonth(m)} />
        ))}
      </div>

      {/* ── Controls ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search expenses..." />
        <span style={{ fontSize: 12, color: T.muted }}>{filtered.length} transactions</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: "7px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1px solid ${T.accent}`, background: T.accent, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
            Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => { handleCSV(e.target.files[0]); e.target.value = ""; }} />
          {expenses.length > 0 && (
            <button onClick={() => { if (window.confirm("Clear all expenses?")) { setExpenses([]); showToast("All expenses cleared"); } }}
              style={{ padding: "7px 16px", borderRadius: 999, fontSize: 12, fontWeight: 500, border: "1px solid #d1d1d6", background: "#e8e8ed", color: T.sub, cursor: "pointer", fontFamily: "inherit" }}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Total Outgoing", value: fmtAmt(totalDebit), color: "#b0271d" },
          { label: "Total Incoming", value: fmtAmt(totalCredit), color: "#1a6e3e" },
          { label: "Net", value: fmtAmt(totalDebit + totalCredit), color: (totalDebit + totalCredit) >= 0 ? "#1a6e3e" : "#b0271d" },
        ].map((s, i) => (
          <div key={i} style={{ borderRadius: 16, padding: "20px 22px", background: T.surface, border: "1px solid " + T.border, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10, color: T.muted }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="mob-table-wrap" style={{ borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: T.surface, minWidth: isMobile ? 700 : "auto" }}>
          <thead><tr>
            <th style={thS}>Date</th>
            <th style={thS}>Description</th>
            <th style={thS}>Category</th>
            <th style={thS}>Reference</th>
            <th style={{ ...thS, textAlign: "right" }}>Amount</th>
            <th style={{ ...thS, textAlign: "center", width: 70 }}>Receipt</th>
            <th style={{ ...thS, width: 40 }}></th>
          </tr></thead>
          <tbody>
            {filtered.map(ex => (
              <tr key={ex.id} className="row" style={{ cursor: "default" }}>
                <td style={{ ...tdS, whiteSpace: "nowrap", fontSize: 12, color: T.sub }}>{ex.date || "—"}</td>
                <td style={{ ...tdS, fontWeight: 500, maxWidth: 300 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.description || "—"}</div>
                </td>
                <td style={tdS}>
                  <input value={ex.category || ""} onChange={e => setExpenses(prev => prev.map(x => x.id === ex.id ? { ...x, category: e.target.value } : x))}
                    placeholder="—" style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: T.sub, fontFamily: "inherit", width: "100%" }}
                    onFocus={e => e.target.style.background = "#f0f5ff"} onBlur={e => e.target.style.background = "transparent"} />
                </td>
                <td style={{ ...tdS, color: T.muted, fontSize: 12 }}>{ex.reference || "—"}</td>
                <td style={{ ...tdR, fontWeight: 600, color: ex.amount < 0 ? "#b0271d" : ex.amount > 0 ? "#1a6e3e" : T.text }}>
                  {fmtAmt(ex.amount)}
                </td>
                <td style={{ ...tdS, textAlign: "center" }}>
                  {ex.receipt ? (
                    <button onClick={() => setSelectedExpense(ex)}
                      style={{ background: "#e8f5e9", border: "none", color: "#2e7d32", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
                      View
                    </button>
                  ) : (
                    <button onClick={() => {
                      const inp = document.createElement("input");
                      inp.type = "file";
                      inp.accept = ".pdf,.jpg,.jpeg,.png,.webp";
                      inp.onchange = (e) => handleReceiptUpload(ex.id, e.target.files[0]);
                      inp.click();
                    }}
                      style={{ background: "#f5f5f7", border: "none", color: T.muted, fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}
                      onMouseEnter={e => { e.target.style.background = "#e8e8ed"; e.target.style.color = T.text; }}
                      onMouseLeave={e => { e.target.style.background = "#f5f5f7"; e.target.style.color = T.muted; }}>
                      + Add
                    </button>
                  )}
                </td>
                <td style={{ ...tdS, textAlign: "center" }}>
                  <button onClick={() => { setExpenses(prev => prev.filter(x => x.id !== ex.id)); showToast("Expense deleted"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14, padding: 0 }}
                    onMouseEnter={e => e.target.style.color = "#b0271d"} onMouseLeave={e => e.target.style.color = "#ccc"}>×</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 44, textAlign: "center", color: T.muted, fontSize: 13 }}>
                {expenses.length === 0 ? "No expenses yet. Upload a CSV bank statement to get started." : "No matching expenses found."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Receipt modal ── */}
      {selectedExpense && (
        <div className="modal-bg" onClick={() => setSelectedExpense(null)}>
          <div style={{ borderRadius: 20, padding: 28, width: 520, maxWidth: "92vw", maxHeight: "85vh", background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.15)", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{selectedExpense.description}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{selectedExpense.date} &middot; {fmtAmt(selectedExpense.amount)}</div>
              </div>
              <button onClick={() => setSelectedExpense(null)} style={{ background: "#f5f5f7", border: "none", color: T.sub, width: 28, height: 28, borderRadius: "50%", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>Notes</div>
              <textarea value={selectedExpense.notes || ""} onChange={e => { const v = e.target.value; setExpenses(prev => prev.map(x => x.id === selectedExpense.id ? { ...x, notes: v } : x)); setSelectedExpense(prev => ({ ...prev, notes: v })); }}
                rows={2} placeholder="Add notes..."
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, background: "#fafafa", border: `1px solid ${T.border}`, color: T.text, fontSize: 13, fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} />
            </div>

            {/* Receipt */}
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>Receipt</div>
            {selectedExpense.receipt ? (
              <div>
                {selectedExpense.receipt.type && selectedExpense.receipt.type.startsWith("image/") ? (
                  <img src={selectedExpense.receipt.data} alt="Receipt" style={{ maxWidth: "100%", borderRadius: 8, border: `1px solid ${T.border}` }} />
                ) : (
                  <div style={{ padding: 16, borderRadius: 8, background: "#f5f5f7", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>📄</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{selectedExpense.receipt.name}</div>
                      <a href={selectedExpense.receipt.data} download={selectedExpense.receipt.name} style={{ fontSize: 11, color: T.accent }}>Download</a>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => {
                    const inp = document.createElement("input");
                    inp.type = "file";
                    inp.accept = ".pdf,.jpg,.jpeg,.png,.webp";
                    inp.onchange = (ev) => {
                      handleReceiptUpload(selectedExpense.id, ev.target.files[0]);
                      setSelectedExpense(prev => ({ ...prev, receipt: null })); // will refresh on re-open
                    };
                    inp.click();
                  }}
                    style={{ fontSize: 11, fontWeight: 500, color: T.accent, background: "none", border: `1px solid ${T.accent}`, padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Replace</button>
                  <button onClick={() => { setExpenses(prev => prev.map(x => x.id === selectedExpense.id ? { ...x, receipt: null } : x)); setSelectedExpense(prev => ({ ...prev, receipt: null })); showToast("Receipt removed"); }}
                    style={{ fontSize: 11, fontWeight: 500, color: "#b0271d", background: "none", border: "1px solid #e0c0c0", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                </div>
              </div>
            ) : (
              <button onClick={() => {
                const inp = document.createElement("input");
                inp.type = "file";
                inp.accept = ".pdf,.jpg,.jpeg,.png,.webp";
                inp.onchange = (ev) => handleReceiptUpload(selectedExpense.id, ev.target.files[0]);
                inp.click();
              }}
                style={{ width: "100%", padding: 20, borderRadius: 10, border: `2px dashed ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}
                onMouseEnter={e => { e.target.style.borderColor = T.accent; e.target.style.color = T.accent; }}
                onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.muted; }}>
                Click to upload receipt (PDF, JPG, PNG)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
