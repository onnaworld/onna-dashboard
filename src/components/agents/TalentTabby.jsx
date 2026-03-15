import { stripThinking } from "../../utils/helpers";

// ─── TALENT TABBY UTILITY & INTENT HANDLER ──────────────────────────────────

// ─── TABBY INTENT HANDLER ───────────────────────────────────────────────────
export async function handleTabbyIntent({
  input, history, intro, system, agent,
  setMsgs, setInput, setLoading, setMood,
  tabbyCtx, setTabbyCtx,
  castingDeckStore, setCastingDeckStore,
  fittingStore, setFittingStore,
  castingTableStore, setCastingTableStore,
  localProjects, fuzzyMatchProject, projectInfoRef,
}) {
  if (agent.id !== "tabby") return false;

  const _daCtx = tabbyCtx, _daSetCtx = setTabbyCtx;
  const _daStores = { casting_decks: castingDeckStore, fittings: fittingStore, casting_tables: castingTableStore };

  if (!_daCtx) {
    if (!localProjects?.length) { setMsgs([...history,{role:"assistant",content:"No projects found. Create a project first, then come back to me!"}]); setLoading(false); setMood("idle"); return true; }
    const num = parseInt(input.trim(), 10); let project = null;
    if (num >= 1 && num <= localProjects.length) project = localProjects[num - 1]; else project = fuzzyMatchProject(localProjects, input);
    if (!project) { const list = localProjects.map((p,i) => `${i+1}. ${p.name}`).join("\n"); setMsgs([...history,{role:"assistant",content:`Which project should I work on?\n\n${list}\n\nPick a number or name.`}]); setLoading(false); setMood("idle"); return true; }
    _daSetCtx({ projectId: project.id }); setMsgs([...history,{role:"assistant",content:`Got it \u2014 working on **${project.name}**. What would you like to do?`}]); setLoading(false); setMood("excited"); setTimeout(() => setMood("idle"), 2500); return true;
  }

  const project = localProjects?.find(p => p.id === _daCtx.projectId);
  if (!project) { _daSetCtx(null); setMsgs([...history,{role:"assistant",content:"Project not found. Which project should I work on?"}]); setLoading(false); setMood("idle"); return true; }
  if (/\b(switch|change|different|another)\s+project\b/i.test(input)) { _daSetCtx(null); const list = localProjects.map((p,i) => `${i+1}. ${p.name}`).join("\n"); setMsgs([...history,{role:"assistant",content:`Sure! Which project should I work on?\n\n${list}`}]); setLoading(false); setMood("idle"); return true; }

  let docSnap = `Project: ${project.name} (${project.client || ""})\n\n`;
  const _sl = { casting_decks: "Casting Decks", fittings: "Fittings", casting_tables: "Casting Tables" };
  const stripImg = (o) => { if (!o || typeof o !== "object") return o; if (Array.isArray(o)) return o.map(stripImg); const r = {}; for (const [k,v] of Object.entries(o)) { if (typeof v === "string" && (v.startsWith("data:image") || v.startsWith("blob:"))) r[k] = "[image]"; else if (k === "image" && v && typeof v === "string" && v.length > 100) r[k] = "[image]"; else r[k] = stripImg(v); } return r; };
  Object.entries(_daStores).forEach(([key, store]) => { if (!store) return; const versions = store[project.id] || []; docSnap += `=== ${_sl[key] || key} (${versions.length} version${versions.length !== 1 ? "s" : ""}) ===\n`; if (versions.length === 0) { docSnap += "(none created yet)\n\n"; return; } versions.forEach((ver, vi) => { const label = ver.label || ver.project?.name || `Version ${vi + 1}`; docSnap += `--- [vIdx:${vi}] ${label} ---\n`; docSnap += JSON.stringify(stripImg(JSON.parse(JSON.stringify(ver))), null, 1).substring(0, 3000) + "\n\n"; }); });

  const _piData = (projectInfoRef?.current || {})[project.id];
  const enhancedSystem = `${system}\n\nCURRENT PROJECT CONTEXT:\n${docSnap}\nProject Info: ${JSON.stringify(_piData || {}, null, 1).substring(0, 500)}\n\nINSTRUCTIONS:\n- You are viewing LIVE data for "${project.name}". Reference specific details from the snapshot above.\n- When the user asks to add, update, or change data, respond with a JSON patch in a \`\`\`json code block.\n- Patch format: { "store": "<store_key>", "versionIndex": <number>, "updates": { <fields to merge> } }\n- For new versions: { "store": "<store_key>", "action": "create", "data": { <full version object> } }\n- Valid store keys: ${Object.keys(_daStores).join(", ")}\n- NEVER say you can't access data. You have FULL live access.`;

  setMsgs(history);setInput("");setLoading(true);setMood("thinking");
  try {
    const apiMessages = history.map((m, mi) => { if (m.role === "assistant") { if (mi === 0) return { role: m.role, content: intro }; return { role: m.role, content: typeof m.content === "string" ? m.content : "" }; } return { role: m.role, content: m.content }; });
    const res = await fetch(`/api/agents/${agent.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system: enhancedSystem, messages: apiMessages }) });
    if (!res.ok) { const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` })); setMsgs(p => [...p, { role: "assistant", content: `Error: ${e.error || "Unknown"}` }]); setLoading(false); setMood("idle"); return true; }
    const reader = res.body.getReader(); const decoder = new TextDecoder(); let fullText = ""; let buffer = "";
    while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() || ""; for (const line of lines) { if (!line.startsWith("data: ")) continue; const raw = line.slice(6).trim(); if (!raw || raw === "[DONE]") continue; try { const ev = JSON.parse(raw); if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") { fullText += ev.delta.text; setMsgs([...history, { role: "assistant", content: stripThinking(fullText) }]); } } catch {} } }
    fullText=stripThinking(fullText);
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const patch = JSON.parse(jsonMatch[1].trim());
        const storeSetMap = { casting_decks: setCastingDeckStore, fittings: setFittingStore, casting_tables: setCastingTableStore };
        const setter = storeSetMap[patch.store];
        if (setter && _daStores[patch.store] !== undefined) {
          if (patch.action === "create") { setter(prev => { const s = JSON.parse(JSON.stringify(prev)); if (!s[project.id]) s[project.id] = []; s[project.id].push({ id: Date.now(), ...patch.data }); return s; }); }
          else if (patch.updates && typeof patch.versionIndex === "number") { setter(prev => { const s = JSON.parse(JSON.stringify(prev)); const vs = s[project.id] || []; const vi = Math.min(patch.versionIndex, vs.length - 1); if (vi >= 0 && vs[vi]) { const dm = (a, b) => { if (!b || typeof b !== "object" || Array.isArray(b)) return b; const o = { ...a }; for (const [k, v] of Object.entries(b)) { if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) o[k] = dm(a[k], v); else o[k] = v; } return o; }; vs[vi] = dm(vs[vi], patch.updates); } return s; }); }
          const cleanText = fullText.replace(/```json[\s\S]*?```/g, "").trim();
          setMsgs([...history, { role: "assistant", content: (cleanText ? cleanText + "\n\n" : "") + "\u2713 Updated." }]);
        } else { setMsgs([...history, { role: "assistant", content: fullText || "Done!" }]); }
      } catch (pe) { setMsgs([...history, { role: "assistant", content: fullText + "\n\n\u26a0\ufe0f Could not parse patch: " + pe.message }]); }
    } else { setMsgs([...history, { role: "assistant", content: fullText || "Hmm, something went wrong!" }]); }
    setMood("excited"); setTimeout(() => setMood("idle"), 2500);
  } catch (err) { setMsgs(p => [...p, { role: "assistant", content: `Oops! ${err.message}` }]); setMood("idle"); }
  setLoading(false); return true;
}
