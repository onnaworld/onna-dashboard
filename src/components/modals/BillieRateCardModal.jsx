import React from "react";

const CURRENCIES = ["AED","USD","GBP","EUR","SAR"];
const PER_OPTIONS = ["day","hour","flat"];

export function BillieRateCardModal({ T, BtnPrimary, BtnSecondary, isMobile, billieRateCards, setBillieRateCards, setShowBillieRates }) {
  const addRow = () => setBillieRateCards(prev => [...prev, { id: Date.now(), role: "", rate: "", currency: "AED", per: "day", notes: "" }]);
  const update = (id, field, val) => setBillieRateCards(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  const remove = (id) => setBillieRateCards(prev => prev.filter(r => r.id !== id));

  const inputStyle = { padding: "6px 8px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, fontFamily: "inherit", width: "100%" };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const thStyle = { fontSize: 11, fontWeight: 600, color: T.sub, textTransform: "uppercase", letterSpacing: "0.5px", padding: "6px 8px", textAlign: "left", whiteSpace: "nowrap" };

  return (
    <div className="modal-bg" onClick={() => setShowBillieRates(false)}>
      <div style={{ borderRadius: 20, padding: 26, width: isMobile ? "95vw" : 700, maxHeight: "80vh", overflow: "auto", background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Billie Rate Card</div>
          <button onClick={() => setShowBillieRates(false)} style={{ background: "#f5f5f7", border: "none", color: T.sub, width: 28, height: 28, borderRadius: "50%", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>Default rates Billie uses when populating estimates. These override market defaults.</div>

        {billieRateCards.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: T.muted, fontSize: 13 }}>No rates saved yet. Add your first rate below.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Role / Item</th>
                  <th style={{ ...thStyle, width: 90 }}>Rate</th>
                  <th style={{ ...thStyle, width: 80 }}>Currency</th>
                  <th style={{ ...thStyle, width: 80 }}>Per</th>
                  <th style={thStyle}>Notes</th>
                  <th style={{ ...thStyle, width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {billieRateCards.map(row => (
                  <tr key={row.id}>
                    <td style={{ padding: "3px 4px" }}><input style={inputStyle} value={row.role} onChange={e => update(row.id, "role", e.target.value)} placeholder="e.g. Child Model" /></td>
                    <td style={{ padding: "3px 4px" }}><input style={inputStyle} value={row.rate} onChange={e => update(row.id, "rate", e.target.value)} placeholder="2500" /></td>
                    <td style={{ padding: "3px 4px" }}>
                      <select style={selectStyle} value={row.currency} onChange={e => update(row.id, "currency", e.target.value)}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "3px 4px" }}>
                      <select style={selectStyle} value={row.per} onChange={e => update(row.id, "per", e.target.value)}>
                        {PER_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "3px 4px" }}><input style={inputStyle} value={row.notes} onChange={e => update(row.id, "notes", e.target.value)} placeholder="optional" /></td>
                    <td style={{ padding: "3px 4px", textAlign: "center" }}>
                      <button onClick={() => remove(row.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 15, padding: 2 }} title="Delete">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "space-between", alignItems: "center" }}>
          <BtnSecondary onClick={addRow}>+ Add Rate</BtnSecondary>
          <BtnPrimary onClick={() => setShowBillieRates(false)}>Done</BtnPrimary>
        </div>
      </div>
    </div>
  );
}
