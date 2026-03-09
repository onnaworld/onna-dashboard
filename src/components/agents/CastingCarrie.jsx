// ─── CARRIE (CASTING) UTILITY FUNCTIONS ──────────────────────────────────────

// ─── CARRIE (CASTING) HELPERS ────────────────────────────────────────────────
function buildCarrieSystem(project, snapshot, vendorSummary) {
  return `You are Casting Carrie, a casting coordinator for ONNA, a film/TV production company in Dubai. You are DIRECTLY CONNECTED to the live casting database.

CRITICAL: You ALREADY HAVE the full casting data below. NEVER ask the user to paste, share, or provide casting details — you can see everything. Just act on their request immediately.

You are viewing: "${project.name}"

CURRENT CASTING STATE:
${snapshot}

VENDOR DATABASE (name|category|email|phone):
${vendorSummary || "(empty)"}

THE USER:
- The user is Emily Lucas, Senior Producer at ONNA. Phone: +971 585 608 616, Email: emily@onnaproduction.com

INSTRUCTIONS:
- When the user asks to ADD models/talent, output a JSON patch inside a \`\`\`json code block:
  {"addRows": [{"tableId": <number>, "rows": [{"agency":"...","name":"...","email":"...","option":"First Option","notes":"...","link":"..."}]}]}
- When the user asks to UPDATE existing models, output:
  {"updateRows": [{"tableId": <number>, "rowId": <number>, "fields": {"name":"...","email":"..."}}]}
- When the user asks to add a new casting table:
  {"addTable": {"title": "..."}}
- When the user asks to export PDF:
  {"action": "exportPDF"}
- When the user asks to export CSV:
  {"action": "exportCSV"}
- You can combine multiple operations in one JSON block (e.g. addRows + updateRows).
- Only output JSON for write intents. For read-only questions (e.g. "what models do we have?", "what's missing?"), answer in plain text with NO JSON block.
- For casting brief generation, respond in plain text with a formatted brief — no JSON needed.
- When a name matches a vendor/agency in the database above, auto-fill their details and mention it.
- When asked "what's missing?" or similar, scan all casting tables and list which fields are empty.
- NEVER say you don't have access to data or need the user to share information. You have FULL access.
- Be warm, concise and professional.

RESPONSE STYLE:
- Use bullet points for lists and summaries
- Keep responses short and scannable — no walls of text
- Lead with the action taken or answer, then details
- Use **bold** for key names, fields, and labels
- Tone: warm, confident, professional — never robotic
- When confirming changes, summarise what was updated in a quick bullet list`;
}

function applyCarriePatch(patch, projectId, getProjectCastingTables, setProjectCasting) {
  const tables = JSON.parse(JSON.stringify(getProjectCastingTables(projectId)));

  // Update existing rows
  if (patch.updateRows && Array.isArray(patch.updateRows)) {
    patch.updateRows.forEach(ur => {
      const tbl = tables.find(t => t.id === ur.tableId);
      if (tbl) {
        const row = tbl.rows.find(r => r.id === ur.rowId);
        if (row) Object.assign(row, ur.fields);
      }
    });
  }

  // Add new rows
  if (patch.addRows && Array.isArray(patch.addRows)) {
    patch.addRows.forEach(ar => {
      const tbl = tables.find(t => t.id === ar.tableId);
      if (tbl && ar.rows) {
        ar.rows.forEach(r => {
          tbl.rows.push({ id: Date.now() + Math.floor(Math.random() * 10000), agency: r.agency || "", name: r.name || "", email: r.email || "", option: r.option || "First Option", notes: r.notes || "", link: r.link || "", headshot: null }); });
      }
    });
  }

  // Add new table
  if (patch.addTable) {
    tables.push({ id: Date.now(), title: patch.addTable.title || "Untitled", rows: [] });
  }

  setProjectCasting(prev => ({ ...prev, [projectId]: tables }));

  // Return action if present
  if (patch.action) return { action: patch.action };
  return null;
}


export { buildCarrieSystem, applyCarriePatch };
