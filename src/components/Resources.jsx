import React from "react";

export default function Resources({
  T, isMobile, api,
  // Vault state
  vaultLocked, setVaultLocked,
  vaultKey, setVaultKey,
  vaultPass, setVaultPass,
  vaultErr, setVaultErr,
  vaultLoading, setVaultLoading,
  vaultResources, setVaultResources,
  vaultView, setVaultView,
  vaultShowPw, setVaultShowPw,
  vaultCopied, setVaultCopied,
  vaultSaving, setVaultSaving,
  vaultAddPwOpen, setVaultAddPwOpen,
  vaultEditId, setVaultEditId,
  vaultNewPw, setVaultNewPw,
  vaultFileRef, setVaultFileRef,
  vaultFileName, setVaultFileName,
  vaultFileErr, setVaultFileErr,
  vaultPwSearch, setVaultPwSearch,
  vaultViewEntry, setVaultViewEntry,
  // Crypto helpers
  vaultDeriveKey, vaultEncrypt, vaultDecrypt,
  VAULT_SALT, VAULT_CHECK,
  // UI components
  Pill, TH, TD, BtnPrimary, BtnSecondary,
  // Utilities
  showAlert,
}) {
  // ── Vault functions ──
  const unlockVault = async () => {
    if (!vaultPass.trim()) return;
    setVaultLoading(true); setVaultErr("");
    try {
      const key = await vaultDeriveKey(vaultPass);
      const entries = await api.get("/api/resources");
      const meta = Array.isArray(entries) ? entries.find(e => e.type === "meta") : null;
      if (!meta) {
        const blob = await vaultEncrypt(key, VAULT_CHECK);
        await api.post("/api/resources", { type: "meta", blob });
        setVaultKey(key); setVaultResources([]); setVaultLocked(false);
      } else {
        const check = await vaultDecrypt(key, meta.blob);
        if (check !== VAULT_CHECK) { setVaultErr("Incorrect vault password"); setVaultLoading(false); return; }
        const decrypted = [];
        for (const e of (Array.isArray(entries) ? entries : []).filter(e => e.type !== "meta")) {
          try { decrypted.push({ ...e, ...(await vaultDecrypt(key, e.blob)) }); } catch {}
        }
        setVaultKey(key); setVaultResources(decrypted); setVaultLocked(false);
      }
    } catch { setVaultErr("Incorrect vault password"); }
    setVaultLoading(false);
  };

  const vaultCopyPw = (id, password) => {
    navigator.clipboard.writeText(password);
    setVaultCopied(id);
    setTimeout(() => setVaultCopied(null), 1800);
  };

  const addVaultPassword = async () => {
    if (!vaultNewPw.name.trim() || !vaultNewPw.password.trim()) return;
    setVaultSaving(true);
    const blob = await vaultEncrypt(vaultKey, { type: "password", ...vaultNewPw });
    const saved = await api.post("/api/resources", { type: "password", blob });
    if (saved.id) {
      setVaultResources(prev => [...prev, { id: saved.id, type: "password", ...vaultNewPw }]);
      setVaultNewPw({ name: "", url: "", username: "", password: "", notes: "" });
      setVaultAddPwOpen(false);
    }
    setVaultSaving(false);
  };

  const updateVaultPassword = async () => {
    if (!vaultNewPw.name.trim() || !vaultNewPw.password.trim()) return;
    setVaultSaving(true);
    const blob = await vaultEncrypt(vaultKey, { type: "password", ...vaultNewPw });
    const updated = await api.put(`/api/resources/${vaultEditId}`, { type: "password", blob });
    if (updated.id) {
      setVaultResources(prev => prev.map(r => r.id === vaultEditId ? { ...r, ...vaultNewPw } : r));
      setVaultEditId(null); setVaultAddPwOpen(false); setVaultNewPw({ name: "", url: "", username: "", password: "", notes: "" });
    }
    setVaultSaving(false);
  };

  const addVaultFile = async (file) => {
    if (!file) return;
    setVaultSaving(true); setVaultFileErr("");
    try {
      const raw = await new Promise(r => { const fr = new FileReader(); fr.onload = e => r(e.target.result.split(",")[1]); fr.readAsDataURL(file); });
      const payload = { type: "file", name: vaultFileName || file.name, filename: file.name, mimetype: file.type, size: file.size, data: raw };
      const blob = await vaultEncrypt(vaultKey, payload);
      const saved = await api.post("/api/resources", { type: "file", blob });
      if (saved.id) {
        setVaultResources(prev => [...prev, { id: saved.id, ...payload }]);
        setVaultFileName(""); setVaultFileRef(null); setVaultFileErr("");
      } else {
        setVaultFileErr(saved.error || "Upload failed. Try a smaller file.");
      }
    } catch (e) { setVaultFileErr(e.message || "Upload failed. Try a smaller file."); }
    setVaultSaving(false);
  };

  const downloadVaultFile = (entry) => {
    const bytes = Uint8Array.from(atob(entry.data), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: entry.mimetype || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = entry.filename || entry.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const deleteVaultEntry = async (id) => {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    await api.delete(`/api/resources/${id}`);
    setVaultResources(prev => prev.filter(r => r.id !== id));
  };

  return (
    <>
      <div>
        {vaultLocked ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <div style={{ width: 380, background: T.surface, borderRadius: 20, padding: "44px 40px", border: `1px solid ${T.border}`, boxShadow: "0 8px 40px rgba(0,0,0,0.07)", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1d1d1f", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>{"\ud83d\udd12"}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 6, letterSpacing: "-0.02em" }}>Vault</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7, marginBottom: 28 }}>Protected with AES-256-GCM encryption.<br />Your data is never stored unencrypted.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5 }}>Vault Password</div>
                  <input type="password" value={vaultPass} onChange={e => { setVaultPass(e.target.value); setVaultErr(""); }} onKeyDown={e => { if (e.key === "Enter") unlockVault(); }} placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"} autoFocus style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${vaultErr ? "#c0392b" : T.border}`, fontSize: 14, fontFamily: "inherit", color: T.text, background: "#fafafa", boxSizing: "border-box" }} />
                </div>
                {vaultErr && <div style={{ fontSize: 12, color: "#c0392b", textAlign: "center", fontWeight: 500 }}>{vaultErr}</div>}
                <button onClick={unlockVault} disabled={vaultLoading || !vaultPass.trim()} style={{ padding: "12px", borderRadius: 10, background: vaultLoading ? "#d2d2d7" : "#1d1d1f", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: vaultLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{vaultLoading ? "Unlocking\u2026" : "Unlock Vault"}</button>
              </div>
              <div style={{ marginTop: 22, fontSize: 11, color: T.muted, lineHeight: 1.8 }}>First time? Set a strong vault password.<br />It cannot be recovered if forgotten.</div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <Pill label="Passwords" active={vaultView === "passwords"} onClick={() => setVaultView("passwords")} />
              <Pill label="Documents" active={vaultView === "files"} onClick={() => setVaultView("files")} />
              <button onClick={() => { setVaultLocked(true); setVaultKey(null); setVaultPass(""); setVaultResources([]); }} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, background: "transparent", border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>{"\ud83d\udd12"} Lock vault</button>
            </div>

            {vaultView === "passwords" && (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button onClick={() => { setVaultEditId(null); setVaultAddPwOpen(true); setVaultNewPw({ name: "", url: "", username: "", password: "", notes: "" }); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>+ Add Password</button>
                  {vaultResources.filter(r => r.type === "password").length > 0 && (
                    <button onClick={() => {
                      const pws = vaultResources.filter(r => r.type === "password").sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                      const csv = "Name,URL,Username,Password,Notes\n" + pws.map(e =>
                        [e.name, e.url, e.username, e.password, e.notes].map(v => `"${(v || "").replace(/"/g, '""')}"`).join(",")
                      ).join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a"); a.href = url; a.download = `onna-passwords-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                      setTimeout(() => URL.revokeObjectURL(url), 10000);
                      showAlert("Exported! Delete the CSV after importing elsewhere — it contains plaintext passwords.");
                    }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>Export CSV</button>
                  )}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <input value={vaultPwSearch} onChange={e => setVaultPwSearch(e.target.value)} placeholder="Search passwords\u2026" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "inherit", color: T.text, background: T.surface, boxSizing: "border-box" }} />
                </div>
                <div className="mob-table-wrap" style={{ borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 14 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", background: T.surface, minWidth: isMobile ? 480 : "auto" }}>
                    <thead><tr>
                      <TH>Service / Name</TH><TH>URL</TH><TH>Username / Email</TH><TH>Password</TH>
                    </tr></thead>
                    <tbody>
                      {vaultResources.filter(r => r.type === "password" && (!vaultPwSearch || [r.name, r.username, r.url, r.notes].some(v => v && v.toLowerCase().includes(vaultPwSearch.toLowerCase())))).sort((a, b) => (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase())).map(e => (
                        <tr key={e.id} className="row" onClick={() => setVaultViewEntry(e)} style={{ cursor: "pointer" }}>
                          <TD bold>{e.name}</TD>
                          <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }}>{e.url ? <a href={e.url.startsWith("http") ? e.url : `https://${e.url}`} target="_blank" rel="noreferrer" onClick={ev => ev.stopPropagation()} style={{ fontSize: 12.5, color: T.link, textDecoration: "none" }}>{e.url}</a> : null}</td>
                          <TD muted>{e.username}</TD>
                          <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderSub}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 12.5, color: T.sub, fontFamily: "monospace", letterSpacing: "0.04em" }}>{vaultShowPw[e.id] ? e.password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}</span>
                              <button onClick={ev => { ev.stopPropagation(); setVaultShowPw(p => ({ ...p, [e.id]: !p[e.id] })); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "2px 4px", color: T.muted, borderRadius: 4 }}>{vaultShowPw[e.id] ? "\ud83d\ude48" : "\ud83d\udc41"}</button>
                              <button onClick={ev => { ev.stopPropagation(); vaultCopyPw(e.id, e.password); }} style={{ background: vaultCopied === e.id ? "#edfaf3" : "none", border: "none", cursor: "pointer", fontSize: 11, padding: "3px 8px", color: vaultCopied === e.id ? "#147d50" : T.muted, borderRadius: 5, fontFamily: "inherit", fontWeight: 500, transition: "all 0.15s" }}>{vaultCopied === e.id ? "Copied!" : "Copy"}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {vaultResources.filter(r => r.type === "password").length === 0 && <tr><td colSpan={4} style={{ padding: 36, textAlign: "center", color: T.muted, fontSize: 13 }}>No passwords saved yet.</td></tr>}
                      {vaultResources.filter(r => r.type === "password").length > 0 && vaultResources.filter(r => r.type === "password" && (!vaultPwSearch || [r.name, r.username, r.url, r.notes].some(v => v && v.toLowerCase().includes(vaultPwSearch.toLowerCase())))).length === 0 && <tr><td colSpan={4} style={{ padding: 36, textAlign: "center", color: T.muted, fontSize: 13 }}>No results for &quot;{vaultPwSearch}&quot;</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {vaultView === "files" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
                  {vaultResources.filter(r => r.type === "file").map(e => (
                    <div key={e.id} style={{ borderRadius: 16, padding: 20, background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 28, lineHeight: 1 }}>{"\ud83d\udcc4"}</div>
                        <button onClick={() => deleteVaultEntry(e.id)} style={{ background: "none", border: "none", color: T.muted, fontSize: 16, cursor: "pointer", padding: 0 }} onMouseOver={ev => ev.currentTarget.style.color = "#c0392b"} onMouseOut={ev => ev.currentTarget.style.color = T.muted}>{"\u00d7"}</button>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{e.filename} {"\u00b7"} {e.size ? (e.size / 1024).toFixed(0) + " KB" : ""}</div>
                      </div>
                      <button onClick={() => downloadVaultFile(e)} style={{ marginTop: "auto", padding: "8px 14px", borderRadius: 9, background: "#1d1d1f", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{"\u2b07"} Download</button>
                    </div>
                  ))}

                  <label style={{ borderRadius: 16, padding: 20, background: "#fafafa", border: `2px dashed ${T.border}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 140, transition: "border-color 0.15s" }} onMouseOver={e => e.currentTarget.style.borderColor = "#1d1d1f"} onMouseOut={e => e.currentTarget.style.borderColor = T.border}>
                    <div style={{ fontSize: 28, opacity: 0.3 }}>{"\u2b06"}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.sub, textAlign: "center" }}>
                      {vaultFileRef ? <span style={{ color: "#1d1d1f", fontWeight: 600 }}>{vaultFileRef.name}</span> : "Click to upload"}
                    </div>
                    {vaultFileRef && <div style={{ fontSize: 11, color: T.muted }}>{(vaultFileRef.size / 1024).toFixed(0)} KB</div>}
                    <input type="file" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) { if (e.target.files[0].size > 5 * 1024 * 1024) { showAlert("Max file size is 5MB"); return; } setVaultFileRef(e.target.files[0]); setVaultFileName(e.target.files[0].name); } }} />
                  </label>
                </div>

                {vaultFileRef && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "14px 18px", borderRadius: 12, background: T.surface, border: `1px solid ${vaultFileErr ? "#c0392b" : T.border}` }}>
                      <input value={vaultFileName} onChange={e => setVaultFileName(e.target.value)} placeholder="Display name (optional)" style={{ flex: 1, padding: "8px 12px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "inherit", color: T.text, background: "#fafafa" }} />
                      <BtnPrimary onClick={() => addVaultFile(vaultFileRef)} disabled={vaultSaving}>{vaultSaving ? "Encrypting\u2026" : "Encrypt & Save"}</BtnPrimary>
                      <BtnSecondary onClick={() => { setVaultFileRef(null); setVaultFileName(""); setVaultFileErr(""); }}>Cancel</BtnSecondary>
                    </div>
                    {vaultFileErr && <div style={{ fontSize: 12, color: "#c0392b", marginTop: 6, paddingLeft: 4, fontWeight: 500 }}>{vaultFileErr}</div>}
                  </div>
                )}

                {vaultResources.filter(r => r.type === "file").length === 0 && !vaultFileRef && (
                  <div style={{ borderRadius: 16, padding: 44, textAlign: "center", background: T.surface, border: `1px solid ${T.border}`, color: T.muted, fontSize: 13 }}>No documents yet. Upload trade license, contracts, and other sensitive files above.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── VAULT VIEW PASSWORD MODAL ── */}
      {vaultViewEntry && (
        <div className="modal-bg" onClick={() => setVaultViewEntry(null)}>
          <div style={{ borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "24px 20px" : 28, width: isMobile ? "100%" : 480, maxWidth: isMobile ? "100%" : "92vw", background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: T.text }}>{vaultViewEntry.name}</div>
              <button onClick={() => setVaultViewEntry(null)} style={{ background: "#f5f5f7", border: "none", color: T.sub, width: 28, height: 28, borderRadius: "50%", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{"\u00d7"}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {vaultViewEntry.url && <div><div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>URL</div><a href={vaultViewEntry.url.startsWith("http") ? vaultViewEntry.url : `https://${vaultViewEntry.url}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: T.link, textDecoration: "none" }}>{vaultViewEntry.url}</a></div>}
              {vaultViewEntry.username && <div><div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Username / Email</div><span style={{ fontSize: 13, color: T.text }}>{vaultViewEntry.username}</span></div>}
              <div>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Password</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: T.sub, fontFamily: "monospace", letterSpacing: "0.04em" }}>{vaultShowPw[vaultViewEntry.id] ? vaultViewEntry.password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}</span>
                  <button onClick={() => setVaultShowPw(p => ({ ...p, [vaultViewEntry.id]: !p[vaultViewEntry.id] }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "2px 4px", color: T.muted, borderRadius: 4 }}>{vaultShowPw[vaultViewEntry.id] ? "\ud83d\ude48" : "\ud83d\udc41"}</button>
                  <button onClick={() => vaultCopyPw(vaultViewEntry.id, vaultViewEntry.password)} style={{ background: vaultCopied === vaultViewEntry.id ? "#edfaf3" : "#f5f5f7", border: "none", cursor: "pointer", fontSize: 11, padding: "4px 10px", color: vaultCopied === vaultViewEntry.id ? "#147d50" : T.sub, borderRadius: 6, fontFamily: "inherit", fontWeight: 500, transition: "all 0.15s" }}>{vaultCopied === vaultViewEntry.id ? "Copied!" : "Copy"}</button>
                </div>
              </div>
              {vaultViewEntry.notes && <div><div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Notes</div><div style={{ fontSize: 13, color: T.text, whiteSpace: "pre-wrap", lineHeight: 1.6, background: "#fafafa", borderRadius: 9, padding: "10px 12px", border: `1px solid ${T.border}` }}>{vaultViewEntry.notes}</div></div>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
              <button onClick={async () => { if (!window.confirm(`Delete ${vaultViewEntry.name}?`)) return; await deleteVaultEntry(vaultViewEntry.id); setVaultViewEntry(null); }} style={{ background: "none", border: "none", color: "#c0392b", fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Delete</button>
              <div style={{ display: "flex", gap: 8 }}>
                <BtnSecondary onClick={() => setVaultViewEntry(null)}>Close</BtnSecondary>
                <BtnPrimary onClick={() => { setVaultEditId(vaultViewEntry.id); setVaultNewPw({ name: vaultViewEntry.name || "", url: vaultViewEntry.url || "", username: vaultViewEntry.username || "", password: vaultViewEntry.password || "", notes: vaultViewEntry.notes || "" }); setVaultAddPwOpen(true); setVaultViewEntry(null); }}>Edit</BtnPrimary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VAULT ADD / EDIT PASSWORD MODAL ── */}
      {vaultAddPwOpen && (
        <div className="modal-bg" onClick={() => { setVaultAddPwOpen(false); setVaultEditId(null); setVaultNewPw({ name: "", url: "", username: "", password: "", notes: "" }); }}>
          <div style={{ borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "24px 20px" : 28, width: isMobile ? "100%" : 520, maxWidth: isMobile ? "100%" : "92vw", background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: T.text }}>{vaultEditId ? "Edit Password" : "New Password"}</div>
              <button onClick={() => { setVaultAddPwOpen(false); setVaultEditId(null); setVaultNewPw({ name: "", url: "", username: "", password: "", notes: "" }); }} style={{ background: "#f5f5f7", border: "none", color: T.sub, width: 28, height: 28, borderRadius: "50%", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u00d7"}</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 16 }}>
              {[["name", "Service / Name *"], ["url", "URL"], ["username", "Username / Email"], ["password", "Password *"]].map(([k, lbl]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>{lbl}</div>
                  <input type={k === "password" ? "password" : "text"} value={vaultNewPw[k]} onChange={e => setVaultNewPw(p => ({ ...p, [k]: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "inherit", color: T.text, background: "#fafafa", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
              <textarea value={vaultNewPw.notes} onChange={e => setVaultNewPw(p => ({ ...p, notes: e.target.value }))} rows={4} placeholder="Add any notes here\u2026" style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "inherit", color: T.text, background: "#fafafa", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <BtnPrimary onClick={vaultEditId ? updateVaultPassword : addVaultPassword} disabled={vaultSaving || !vaultNewPw.name.trim() || !vaultNewPw.password.trim()}>{vaultSaving ? "Saving\u2026" : vaultEditId ? "Save Changes" : "Save"}</BtnPrimary>
              <BtnSecondary onClick={() => { setVaultAddPwOpen(false); setVaultEditId(null); setVaultNewPw({ name: "", url: "", username: "", password: "", notes: "" }); }}>Cancel</BtnSecondary>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
