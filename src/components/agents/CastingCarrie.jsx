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



// ─── CARRIE INTENT HANDLER ──────────────────────────────────────────────────
export async function handleCarrieIntent({
  input, history, intro, agent,
  setMsgs, setLoading, setMood,
  carrieCtx, setCarrieCtx,
  projectCasting, setProjectCasting, getProjectCastingTables,
  buildCarrieSystem, applyCarriePatch,
  exportCastingPDF, downloadCSV,
  vendorsProp, fuzzyMatchProject, localProjects,
}) {
  if (agent.id !== "carrie" || !projectCasting || !setProjectCasting) return false;


      if(!carrieCtx){
        if(!localProjects?.length){
          setMsgs([...history,{role:"assistant",content:"No projects found. Create a project first, then come back to me!"}]);
          setLoading(false);setMood("idle");return true;
        }
        const project = fuzzyMatchProject(localProjects,input);
        if(!project){
          const list=localProjects.map((p,i)=>`${i+1}. ${p.name}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`Which project's casting should I work on?\n\n${list}\n\nTell me the project name to get started!`}]);
          setLoading(false);setMood("idle");return true;
        }
        setCarrieCtx({projectId:project.id});
        setMsgs([...history,{role:"assistant",content:`Got it — I'm now working on casting for **${project.name}**. I can see all your casting data. What would you like to do?`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      const lower=input.toLowerCase();
      if(/\b(switch|change|different|new)\s+(project|casting)\b/i.test(input)){
        setCarrieCtx(null);
        const list=localProjects.map((p,i)=>`${i+1}. ${p.name}`).join("\n");
        setMsgs([...history,{role:"assistant",content:`Sure! Which project's casting should I work on?\n\n${list}`}]);
        setLoading(false);setMood("idle");return true;
      }
      const switchProject=fuzzyMatchProject(localProjects,input,carrieCtx.projectId);
      if(switchProject){
        setCarrieCtx({projectId:switchProject.id});
        setMsgs([...history,{role:"assistant",content:`Switched to **${switchProject.name}**. I can see all the casting data. What would you like to do?`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      const {projectId}=carrieCtx;
      let project=localProjects?.find(p=>p.id===projectId);
      if(!project){setCarrieCtx(null);setMsgs([...history,{role:"assistant",content:"That project no longer exists. Let's start over — which project?"}]);setLoading(false);setMood("idle");return true;}

      const castingTables = getProjectCastingTables(projectId);
      let snap = `Project: ${project.name}\nCasting Tables:\n`;
      castingTables.forEach(t => {
        snap += `  [tableId:${t.id}] "${t.title}" — ${t.rows.length} model(s)\n`;
        t.rows.forEach(r => {
          snap += `    [rowId:${r.id}] agency:${r.agency||"(empty)"} | name:${r.name||"(empty)"} | email:${r.email||"(empty)"} | option:${r.option||"(empty)"} | notes:${r.notes||"(empty)"} | link:${r.link||"(empty)"}\n`;
        }); });

      let vendorSummary = "";
      if (vendorsProp && vendorsProp.length > 0) {
        vendorSummary = vendorsProp.map(v => `${v.name||""}|${v.category||""}|${v.email||""}|${v.phone||""}`).join("\n");
      }

      const carrieSystem = buildCarrieSystem(project, snap, vendorSummary);
      const castCols = [{key:"agency",label:"Agency"},{key:"name",label:"Name"},{key:"email",label:"Email"},{key:"option",label:"Option"},{key:"notes",label:"Notes"},{key:"link",label:"Link"}];

      try{
        const carrieIntro = intro;
        const apiMessages=history.map((m,mi)=>{
          if(m.role==="assistant"){
            if(mi===0) return{role:m.role,content:carrieIntro};
            return{role:m.role,content:typeof m.content==="string"?m.content:""};
          }
          return{role:m.role,content:m.content};
        });
        const res=await fetch(`/api/agents/${agent.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:carrieSystem,messages:apiMessages})});
        if(!res.ok){const e=await res.json().catch(()=>({error:`HTTP ${res.status}`}));setMsgs(p=>[...p,{role:"assistant",content:`Error: ${e.error||"Unknown"}`}]);setLoading(false);setMood("idle");return true;}
        const reader=res.body.getReader();const decoder=new TextDecoder();let fullText="";let buffer="";
        while(true){const{done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.startsWith("data: "))continue;const raw=line.slice(6).trim();if(!raw||raw==="[DONE]")continue;try{const ev=JSON.parse(raw);if(ev.type==="content_block_delta"&&ev.delta?.type==="text_delta"){fullText+=ev.delta.text;setMsgs([...history,{role:"assistant",content:fullText}]);}}catch{}}}

        const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
        if(jsonMatch){
          try{
            const patch = JSON.parse(jsonMatch[1].trim());
            const result = applyCarriePatch(patch, projectId, getProjectCastingTables, setProjectCasting);
            const cleanText = fullText.replace(/```json[\s\S]*?```/g,"").trim();

            if (result && result.action === "exportPDF") {
              const updatedTables = getProjectCastingTables(projectId);
              exportCastingPDF(updatedTables, castCols, "Casting");
              setMsgs([...history,{role:"assistant",content:(cleanText?cleanText+"\n\n":"")+"✓ Casting PDF exported."}]);
            } else if (result && result.action === "exportCSV") {
              const updatedTables = getProjectCastingTables(projectId);
              const allRows = updatedTables.flatMap(t=>t.rows.map(r=>({...r,table:t.title})));
              const cols = [{key:"table",label:"Table"},...castCols];
              downloadCSV(allRows, cols, "Casting.csv");
              setMsgs([...history,{role:"assistant",content:(cleanText?cleanText+"\n\n":"")+"✓ Casting CSV exported."}]);
            } else {
              setMsgs([...history,{role:"assistant",content:(cleanText?cleanText+"\n\n":"")+"✓ Casting table updated."}]);
            }
          }catch(pe){
            setMsgs([...history,{role:"assistant",content:fullText+"\n\n⚠️ Could not parse patch: "+pe.message}]);
          }
        }else{
          setMsgs([...history,{role:"assistant",content:fullText||"Hmm, something went wrong!"}]);
        }
        setMood("excited");setTimeout(()=>setMood("idle"),2500);
      }catch(err){setMsgs(p=>[...p,{role:"assistant",content:`Oops! ${err.message}`}]);setMood("idle");}
      setLoading(false);return true;
}

export { buildCarrieSystem, applyCarriePatch };
