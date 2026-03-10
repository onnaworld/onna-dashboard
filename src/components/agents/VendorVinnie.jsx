import React, { useState } from "react";


/**
 * handleVinnieIntent - handles all Vendor Vinnie intent detection in sendMessage.
 * Returns true if the intent was handled (caller should return), false otherwise.
 */
export async function handleVinnieIntent({
  input, history, agent,
  setMsgs, setInput, setLoading, setMood,
  setPendingConv, setPendingDuplicate, setPending,
  showEntry, buildQuestions, startConv, _dupMsg,
  searchViaExt, _stripOwn,
  findVendorOrLead, findAllSimilar, parseQuickEntry, detectFieldKey,
  lastSearchRef, api,
  allVendors, allLeads,
  onUpdateVendor, onUpdateLead,
}) {
  if (agent.id !== "logistical") return false;
    console.log('[VINNIE-DEBUG] handleVinnieIntent entered, input:', input.trim().substring(0, 50));

    // ── Vinnie: bare "new" / "create" / "add" with no type → ask which type ──
    const _vinInput=input.trim().replace(/\s+/g," ").replace(/^(?:hey|hi|hello|yo)?\s*(?:vinnie|vin)\s*[,.]?\s*/i,"");
    if(/^(?:create|add|new|make|start)\s*(?:a\s+)?(?:new\s*)?(?:entry|one|record)?[.!?]?\s*$/i.test(_vinInput)){
      setMsgs(history);setInput("");
      setPendingConv({_awaitingTypeChoice:true,entry:null,type:null,questions:[],idx:0});
      setMsgs([...history,{role:"assistant",content:"What would you like to create?\n\n1. Vendor\n2. Lead\n3. Outreach Tracker (lead + outreach)\n\nReply 1, 2, or 3."}]);
      return true;
    }
    // ── Vinnie: bare "update" / "edit" / "open" with no name → ask who ──
    if(/^(?:update|edit|modify|open|pull\s*up|show)\s*(?:a\s+)?(?:record|entry|contact|someone|one)?[.!?]?\s*$/i.test(_vinInput)){
      setMsgs(history);setInput("");
      setPendingConv({_awaitingUpdateName:true,entry:null,type:null,questions:[],idx:0});
      setMsgs([...history,{role:"assistant",content:"Who do you want to update? Type their name (e.g. 'Nancy' or 'Acme Corp')."}]);
      return true;
    }
    // ── "update [Name]" / "open [Name]" — find existing and open card (BEFORE vendor/lead intent) ──
    {
      const _upInput=_vinInput||input.trim();
      const upM=_upInput.match(/^(?:update|edit|modify|change|open|pull\s*up|show)\s+(?:the\s+)?(?:(vendor|supplier|lead|contact)\s+)?(.+?)(?:\s+(?:record|entry|details?|info|card))?[.!?]?\s*$/i)
        ||input.match(/\b(?:update|edit|modify|change|open|pull\s*up|show)\s+(?:the\s+)?(?:(vendor|supplier|lead|contact)\s+)?(.+?)(?:\s+(?:record|entry|details?|info|card))?[.!?]?\s*$/i);
      if(upM&&upM[2]&&upM[2].trim().length>=2&&!/\b(email|phone|name|role|company|website|category|location|notes|status|source|date|value|rate\s*card)\b/i.test(upM[2])&&!/^(vendor|supplier|lead|contact)$/i.test(upM[2].trim())){
        const upTypeHint=upM[1]?(/vendor|supplier/i.test(upM[1])?"vendor":"lead"):null;
        const upName=upM[2].trim();
        setMsgs(history);setInput("");setLoading(true);setMood("thinking");
        const found=findVendorOrLead(upName,allVendors,allLeads);
        const lastS=lastSearchRef.current;
        const hasRecent=lastS&&(Date.now()-lastS._ts<300000)&&(lastS.contact||lastS.name||"").toLowerCase().includes(upName.split(" ")[0].toLowerCase());
        if(found){
          const {record,type}=found;
          const displayName=type==="vendor"?record.name:(record.contact||record.company);
          const merged={...record};
          if(hasRecent){
            const scrape=lastS;
            if(type==="vendor"){
              if(!merged.email&&scrape.email)merged.email=scrape.email;
              if(!merged.phone&&scrape.phone)merged.phone=scrape.phone;
              if(!merged.website&&scrape.website)merged.website=scrape.website;
              if(!merged.notes&&scrape.role)merged.notes=scrape.role;
            }else{
              if(!merged.email&&scrape.email)merged.email=scrape.email;
              if(!merged.phone&&scrape.phone)merged.phone=scrape.phone;
              if(!merged.company&&scrape.company)merged.company=scrape.company;
              if(!merged.role&&scrape.role)merged.role=scrape.role;
            }
          }
          showEntry(merged,type,record.id,false);
          const missingEmail=!merged.email;const missingPhone=!merged.phone;
          const optList=[];
          if(missingEmail)optList.push("Search Outlook for email");
          if(missingPhone)optList.push("Search WhatsApp for phone");
          optList.push("Add a secondary contact");
          const opts="\n\n"+optList.map((o,i)=>`${i+1}. ${o}`).join("\n");
          setPendingConv({_awaitingUpdateAction:true,_updateRecord:merged,_updateType:type,_updateId:record.id,_updateName:displayName,_actionOptions:optList,entry:null,type:null,questions:[],idx:0});
          setMsgs([...history,{role:"assistant",content:`Found ${displayName} (${type}). ${hasRecent?"Merged Outlook data. ":""}Edit below and save.${opts}`}]);
        }else{
          const upType=upTypeHint||"vendor";
          const newEntry={_type:upType,...(upType==="vendor"?{name:upName,company:"",category:"",email:"",phone:"",website:"",location:"Dubai, UAE",notes:"",rateCard:""}:{contact:upName,company:"",email:"",phone:"",role:"",value:"",category:"",location:"Dubai, UAE",date:new Date().toISOString().split("T")[0],status:"not_contacted",notes:""})};
          if(hasRecent){const scrape=lastS;if(upType==="vendor"){if(scrape.email)newEntry.email=scrape.email;if(scrape.phone)newEntry.phone=scrape.phone;}else{if(scrape.email)newEntry.email=scrape.email;if(scrape.phone)newEntry.phone=scrape.phone;if(scrape.company)newEntry.company=scrape.company;}}
          const fq=startConv(newEntry,upType,false,null);
          setMsgs([...history,{role:"assistant",content:`No existing record for "${upName}" — creating new ${upType}. ${hasRecent?"Using Outlook data. ":""}${fq?"\n\n"+fq+" (or 'x' to skip)":"\nReview and save below."}`}]);
        }
        setLoading(false);setMood("idle");return true;
      }
    }
    // ── Vinnie: add vendor/supplier ─────────────────────────────────────────
    const _isVendorIntent=agent.id==="logistical"&&/\b(vendor|supplier|add\s+(?:new\s+)?(?:vendor|supplier)|new\s+vendor|new\s+supplier|create\s+vendor|save\s+vendor)\b/i.test(_vinInput)&&!/outreach|tracker|pipeline/i.test(_vinInput)&&!/\b(?:update|edit|modify|change)\s+(?:the\s+)?(?:vendor|supplier|lead|contact)\b/i.test(_vinInput)&&!/\b(?:search|find|look\s+up|fetch|get)\b.{0,80}\b(?:outlook|whatsapp|inbox|emails?|chats?)\b/i.test(_vinInput)&&!/\b(?:search|find|look\s+up|fetch|get)\s.+?[A-Z][a-z]+\s+[A-Z][a-z]+\b.+?\b(?:and\s+(?:create|add|make|save|start))\b/i.test(_vinInput);
    if(_isVendorIntent){
      console.log('[VINNIE-DEBUG] _isVendorIntent matched, _vinInput:', _vinInput);
      setMsgs(history);setInput("");setLoading(true);setMood("thinking");
      // Bare "create new vendor" / "new vendor" with no data → start blank Q&A from name
      if(/^(?:create|add|new|make|save)?\s*(?:a\s+)?(?:new\s+)?(?:vendor|supplier)\s*[.!?]?\s*$/i.test(_vinInput)){
        const entry={_type:"vendor",name:"",company:"",category:"",email:"",phone:"",website:"",location:"Dubai, UAE",notes:"",rateCard:""};
        const firstQ=startConv(entry,"vendor",false,null);
        setMsgs([...history,{role:"assistant",content:`New vendor — let's fill in the details. ('x' to skip)\n\n${firstQ}`}]);
        setLoading(false);setMood("idle");return true;
      }
      // Show blank card immediately, then fill via AI parse in background
      const _blankVendor={_type:"vendor",name:"",company:"",category:"",email:"",phone:"",website:"",location:"Dubai, UAE",notes:"",rateCard:""};
      const _blankVQs=buildQuestions(_blankVendor,"vendor");
      setPendingConv({entry:_blankVendor,type:"vendor",saveAsOutreach:false,updateId:null,questions:_blankVQs,idx:0});
      setMsgs([...history,{role:"assistant",content:`New vendor — parsing your details...\n\n${_blankVQs[0]?.q||"Vendor name?"}`}]);
      setLoading(false);setMood("idle");
      // AI parse in background → update card with extracted data
      (async()=>{try{
        const sys=`You are an expert at parsing natural language vendor/supplier descriptions into structured data. Extract ALL info you can infer and return ONLY a raw JSON object (no markdown, no array).

Rules:
- Names: anything that looks like a person name → "name"
- Company: anything that looks like a company/business/org name → "company"
- Emails: anything with @ → "email". Infer name from domain if no name given
- Phone numbers: digits with +/spaces/dashes → "phone"
- Website: domain only (no https://)
- Category: fuzzy match to closest from: Locations, Hair and Makeup, Stylists, Casting, Catering, Set Design, Equipment, Crew, Production. E.g. "photographer" → "Crew", "MUA" → "Hair and Makeup", "location scout" → "Locations"
- Location: any city/country mentioned, default "Dubai, UAE"

Fields: {"name":"","company":"","category":"","email":"","phone":"","website":"","location":"City, Country","notes":"","rateCard":""}.`;
        const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:600,system:sys,messages:[{role:"user",content:input.trim()}]});
        const parsed=JSON.parse((data?.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
        const entry={...parsed,_type:"vendor",company:parsed.company||"",location:parsed.location||"Dubai, UAE"};
        const vname=entry.name||"this vendor";
        const vMatches=[...findAllSimilar(vname,allVendors,allLeads),...(entry.company?findAllSimilar(entry.company,allVendors,allLeads):[])];
        const seenV=new Set();const vDedup=vMatches.filter(m=>{const k=m.type+"_"+m.record.id;if(seenV.has(k))return false;seenV.add(k);return true;});
        if(vDedup.length>0){
          setPendingConv(null);
          setPendingDuplicate({entry,matches:vDedup,saveAsOutreach:false});
          setMsgs(prev=>[...prev.filter(m=>m.role!=="assistant"||!m.content?.includes("parsing your details")),{role:"assistant",content:`Got it — ${vname}.\n\n${_dupMsg(vDedup,vname)}`}]);
        }else{
          // Merge parsed data into card, preserving any fields the user already typed
          setPendingConv(prev=>{
            if(!prev)return prev;
            const merged={...prev.entry};
            for(const k of Object.keys(entry)){if(k!=="_type"&&entry[k]&&!merged[k])merged[k]=entry[k];}
            const newQs=buildQuestions(merged,"vendor");
            const newIdx=Math.min(prev.idx,newQs.length?newQs.length-1:0);
            const msg=newQs.length>0
              ?`Got it — ${vname} pulled. Let me fill in the gaps. ('x' to skip)\n\n${newQs[newIdx].q}`
              :`Got it — review details for ${vname} and hit Save.`;
            setMsgs(p=>[...p.slice(0,-1),{role:"assistant",content:msg}]);
            if(newQs.length===0){setTimeout(()=>{setPendingConv(null);showEntry(merged,"vendor",null,false);},0);return prev;}
            return {...prev,entry:merged,questions:newQs,idx:newIdx};
          });
        }
      }catch(e){
        setMsgs(prev=>[...prev.slice(0,-1),{role:"assistant",content:"Hmm, I had trouble parsing that. Answer the fields one by one, or 'x' to skip."}]);
      }})();
      return true;
    }

    // ── Vinnie: add to outreach tracker / lead ───────────────────────────────
    if(!/\b(vendor|supplier)\b/i.test(input.trim())&&!/\b(?:search|find|look\s+up|fetch|get)\b.{0,80}\b(?:outlook|whatsapp|inbox|emails?|chats?)\b/i.test(_vinInput)&&/outreach|pipeline|tracker|add.*lead|add.*contact|log.*contact|new.*lead|(just|today|yesterday|this morning|this week).{0,20}(contact|spoke|met|call|email|speak|reach)|(contact|spoke|met|called|emailed|reached).{0,30}(today|yesterday|them|him|her)|i.{0,15}(contacted|spoke|met|called|emailed)|just.{0,20}(contact|spoke|met|call|email)/i.test(input.trim())){
      console.log('[VINNIE-DEBUG] lead/outreach intent matched, _vinInput:', _vinInput);
      setMsgs(history);setInput("");setLoading(true);setMood("thinking");
      const today=new Date().toISOString().slice(0,10);
      // Bare "create new lead" / "new lead" / "new outreach tracker" with no data → start blank Q&A
      if(/^(?:create|add|new|make|save)?\s*(?:a\s+)?(?:new\s+)?(?:lead|contact|outreach(?:\s+tracker)?)\s*[.!?]?\s*$/i.test(_vinInput)){
        const entry={_type:"lead",contact:"",company:"",email:"",phone:"",role:"",value:"",category:"",location:"Dubai, UAE",date:today,source:"Direct",notes:"",status:"not_contacted"};
        const isOutreach=/outreach|tracker/i.test(input.trim());
        const firstQ=startConv(entry,"lead",isOutreach,null);
        setMsgs([...history,{role:"assistant",content:`New ${isOutreach?"outreach entry":"lead"} — let's fill in the details. ('x' to skip)\n\n${firstQ}`}]);
        setLoading(false);setMood("idle");return true;
      }
      // Show blank card immediately, then fill via AI parse in background
      const _isOutreachImmediate=/outreach|tracker/i.test(input.trim());
      const _blankLead={_type:"lead",contact:"",company:"",email:"",phone:"",role:"",value:"",category:"",location:"Dubai, UAE",date:today,source:"Direct",notes:"",status:"not_contacted"};
      const _blankLQs=buildQuestions(_blankLead,"lead");
      setPendingConv({entry:_blankLead,type:"lead",saveAsOutreach:_isOutreachImmediate,updateId:null,questions:_blankLQs,idx:0});
      setMsgs([...history,{role:"assistant",content:`New ${_isOutreachImmediate?"outreach entry":"lead"} — parsing your details...\n\n${_blankLQs[0]?.q||"Contact name?"}`}]);
      setLoading(false);setMood("idle");
      // AI parse in background → update card with extracted data
      (async()=>{try{
        const sys=`You are an expert at parsing natural language contact descriptions into structured data. Extract ALL info you can infer and return ONLY a raw JSON object (no markdown, no array).

Rules:
- Names: anything that looks like a person's name → "contact"
- Emails: anything with @ → "email". Infer company from domain (e.g. emily@mrporter.com → company:"Mr Porter")
- Phone numbers: digits with +/spaces/dashes → "phone"
- Category: fuzzy match to the closest from this list: Production Companies, Creative Agencies, Beauty & Fragrance, Jewellery & Watches, Fashion, Editorial, Sports, Hospitality, Market Research, Commercial. E.g. "Production Company" → "Production Companies", "Beauty" → "Beauty & Fragrance", "Fashion brand" → "Fashion"
- Location: any city/country mentioned → "location", default "Dubai, UAE"
- Date: use today (${today}) unless explicitly stated
- Status: default "not_contacted" unless user says warm/open/cold

Fields: {"company":"","contact":"","role":"","email":"","phone":"","value":"","date":"YYYY-MM-DD","category":"","location":"Dubai, UAE","source":"Direct","notes":"","status":"not_contacted"}.`;
        const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:600,system:sys,messages:[{role:"user",content:input.trim()}]});
        const parsed=JSON.parse((data?.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
        const entry={...parsed,_type:"lead",date:parsed.date||today,status:parsed.status||"not_contacted"};
        const isOutreach=/outreach|tracker/i.test(input.trim());
        const name=entry.contact||entry.company||"this contact";
        // Merge parsed data into card, preserving any fields the user already typed
        setPendingConv(prev=>{
          if(!prev)return prev;
          const merged={...prev.entry};
          for(const k of Object.keys(entry)){if(k!=="_type"&&entry[k]&&!merged[k])merged[k]=entry[k];}
          const newQs=buildQuestions(merged,"lead");
          const newIdx=Math.min(prev.idx,newQs.length?newQs.length-1:0);
          const msg=newQs.length>0
            ?`Got it — ${name} pulled. Let me fill in the gaps. ('x' to skip)\n\n${newQs[newIdx].q}`
            :`Got it — review details for ${name} and hit Save.`;
          setMsgs(p=>[...p.slice(0,-1),{role:"assistant",content:msg}]);
          if(newQs.length===0){setTimeout(()=>{setPendingConv(null);showEntry(merged,"lead",null,isOutreach);},0);return prev;}
          return {...prev,entry:merged,questions:newQs,idx:newIdx,saveAsOutreach:isOutreach};
        });
      }catch(e){
        setMsgs(prev=>[...prev.slice(0,-1),{role:"assistant",content:"Hmm, I had trouble parsing that. Answer the fields one by one, or 'x' to skip."}]);
      }})();
      setLoading(false);setMood("idle");
      return true;
    }

    // ── Intent detection (Vinnie only) ────────────────────────────────────────
    let findQuery=null;
    let findSource="auto";
    {
      const m=input.match(/\b(?:find|search|look\s+up|get|fetch)\s+(?:me\s+)?(?:the\s+)?(?:for\s+)?(?:(?:my\s+)?(?:outlook|whatsapp|emails?|inbox|chats?)\s+(?:for\s+)?)?(?:(?:contact|email)(?:\s+(?:details?|email|info|contact))?\s+(?:for|of)\s+)?([A-Za-z][A-Za-z\s]{1,35})(?:'s\b|\s+(?:contact|details|info|email|number|lead|and)|(?:\s+in\s+(?:my\s+)?(?:outlook|whatsapp|emails?|inbox|chats?))|[.!?]?\s*$)/i);
      if(m?.[1]){findQuery=m[1].trim().replace(/\s+in\s+(?:my\s+)?(?:outlook|whatsapp|emails?|inbox|chats?)$/i,"").replace(/\s+(?:contact|details|info|email|number|lead|please|and\s+(?:save|create|add|make|start).*)$/i,"").trim();if(findQuery.split(" ").length>4||/^(a|the|an|my|this)$/i.test(findQuery))findQuery=null;}
      if(findQuery){
        if(/\bwhatsapp\b/i.test(input))findSource="whatsapp";
        else if(/\b(?:outlook|emails?|inbox)\b/i.test(input))findSource="outlook";
      }
    }
    const quickEntry=(!findQuery)?parseQuickEntry(input.trim()):null;
    setMsgs(history);setInput("");setLoading(true);setMood("thinking");

    if(findQuery){
      const wantsVendor=/\b(vendor|supplier)\b/i.test(input);
      const wantsCreate=/\b(?:create|add|new|save|make)\b/i.test(input);
      const wantsUpdate=/\b(?:update|edit|modify|change)\b/i.test(input);
      const findType=wantsVendor?"vendor":"lead";
      const sourceLabel=findSource==="whatsapp"?"WhatsApp":findSource==="outlook"?"emails":"contacts";
      setMsgs([...history,{role:"assistant",content:`Searching your ${sourceLabel} for "${findQuery}"…`}]);
      const result=await searchViaExt(findQuery,findSource);
      if(result.ok&&result.lead){
        const l=_stripOwn(result.lead);
        if(wantsVendor&&!l.name)l.name=l.contact||findQuery;
        lastSearchRef.current={...l,_type:findType,_query:findQuery,_ts:Date.now()};
        // If user explicitly said "update" → find existing record and merge scraped data
        if(wantsUpdate){
          const found=findVendorOrLead(findQuery,allVendors,allLeads);
          if(found){
            const {record,type}=found;
            const displayName=type==="vendor"?record.name:(record.contact||record.company);
            const merged={...record};
            if(type==="vendor"){
              if(!merged.email&&l.email)merged.email=l.email;
              if(!merged.phone&&l.phone)merged.phone=l.phone;
              if(!merged.website&&l.website)merged.website=l.website;
              if(!merged.notes&&l.role)merged.notes=l.role;
            }else{
              if(!merged.email&&l.email)merged.email=l.email;
              if(!merged.phone&&l.phone)merged.phone=l.phone;
              if(!merged.company&&l.company)merged.company=l.company;
              if(!merged.role&&l.role)merged.role=l.role;
            }
            const fqu=startConv(merged,type,false,record.id);
            setMsgs([...history,{role:"assistant",content:`Found ${l.contact||l.name||findQuery} and matched to existing ${type} "${displayName}". Merged scraped data.\n📧 ${merged.email||"—"}  📱 ${merged.phone||"—"}\n🏢 ${merged.company||l.company||"—"}  💼 ${merged.role||l.role||"—"}${fqu?"\n\n"+fqu+" (or 'x' to skip)":"\n\nReview and update below."}`}]);
          }else{
            // No existing record found — create new with scraped data
            const foundEntry={...l,_type:findType};
            const fqf=startConv(foundEntry,findType,false,null);
            setMsgs([...history,{role:"assistant",content:`No existing ${findType} "${findQuery}" found — creating new with scraped data.\n📧 ${l.email||"—"}  📱 ${l.phone||"—"}\n🏢 ${l.company||"—"}  💼 ${l.role||"—"}${fqf?"\n\n"+fqf+" (or 'x' to skip)":"\n\nReview and save below."}`}]);
          }
        // If user explicitly said "create/add/new" → skip duplicate check, go straight to new entry
        }else if(wantsCreate){
          const foundEntry={...l,_type:findType};
          const fqf=startConv(foundEntry,findType,false,null);
          setMsgs([...history,{role:"assistant",content:`Found ${l.contact||l.name||findQuery}!\n📧 ${l.email||"—"}  📱 ${l.phone||"—"}\n🏢 ${l.company||"—"}  💼 ${l.role||"—"}${fqf?"\n\n"+fqf+" (or 'x' to skip)":"\n\nReview and save below."}`}]);
        // Default — check for duplicates (name then company)
        }else{
          const searchDupM=[...findAllSimilar(l.contact||l.name||"",allVendors,allLeads),...(l.company?findAllSimilar(l.company,allVendors,allLeads):[])];
          const seenS=new Set();const searchDedup=searchDupM.filter(m=>{const k=m.type+"_"+m.record.id;if(seenS.has(k))return false;seenS.add(k);return true;});
          if(searchDedup.length>0){
            const qn=l.contact||l.name||findQuery;
            setPendingDuplicate({entry:{...l,_type:findType},matches:searchDedup,saveAsOutreach:false});
            setMsgs([...history,{role:"assistant",content:`Found info for ${qn}.\n\n${_dupMsg(searchDedup,qn)}`}]);
          }else{
            const foundEntry={...l,_type:findType};
            const fqf=startConv(foundEntry,findType,false,null);
            setMsgs([...history,{role:"assistant",content:`Found ${l.contact||l.name||findQuery}!\n📧 ${l.email||"—"}  📱 ${l.phone||"—"}\n🏢 ${l.company||"—"}  💼 ${l.role||"—"}${fqf?"\n\n"+fqf+" (or 'x' to skip)":"\n\nReview and save below."}`}]);
          }
        }
      }else{
        setMsgs([...history,{role:"assistant",content:`Couldn't find "${findQuery}" automatically.\n\n${result.error||""}\n\nTip: make sure Outlook is open in another tab and the extension is installed.`}]);
      }
      setLoading(false);setMood("idle");return true;
    }

    if(quickEntry){
      const qname=quickEntry._type==="vendor"?quickEntry.name:quickEntry.contact;
      const qcompany=quickEntry.company||"";
      const qkMatches=[...findAllSimilar(qname,allVendors,allLeads),...(qcompany?findAllSimilar(qcompany,allVendors,allLeads):[])];
      const seenQ=new Set();const qkDedup=qkMatches.filter(m=>{const k=m.type+"_"+m.record.id;if(seenQ.has(k))return false;seenQ.add(k);return true;});
      if(qkDedup.length>0){
        setPendingDuplicate({entry:quickEntry,matches:qkDedup,saveAsOutreach:false});
        setMsgs([...history,{role:"assistant",content:_dupMsg(qkDedup,qname||qcompany)}]);
      }else{
        const fqn=startConv(quickEntry,quickEntry._type,false,null);
        setMsgs([...history,{role:"assistant",content:fqn?`Got it!\n\n${fqn} (or 'x' to skip)`:`Got it. Review and save below.`}]);
      }
      setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
    }

    // "add [value/descriptor] to [name]" — or "add this [field] to [name] [value]"
    {
      const addM=input.match(/^add\s+(.+?)\s+to\s+([A-Za-z].+?)\.?\s*$/i);
      if(addM){
        const [,rawField,rawNameAndMaybeVal]=addM;
        // Case 1: field value comes first — "add +971xxx to Abeer Ghani"
        const directKey=detectFieldKey(rawField.trim());
        // Case 2: value trails after name — "add this number to Abeer Ghani +971xxx"
        const phoneAtEnd=rawNameAndMaybeVal.match(/([\+]?\d[\d\s\-().]{5,})\s*$/);
        const emailAtEnd=rawNameAndMaybeVal.match(/([\w.+-]+@[\w.-]+\.[a-z]{2,})\s*$/i);
        const urlAtEnd=rawNameAndMaybeVal.match(/((?:https?:\/\/)?[\w-]+(\.[\w.-]+)+\/?\S*)\s*$/i);
        const trailingVal=(emailAtEnd?.[1]||phoneAtEnd?.[1]||urlAtEnd?.[1]||"").trim();
        let fieldValue=null,targetNameStr=null;
        if(directKey!=="notes"){
          fieldValue=rawField.trim();
          targetNameStr=rawNameAndMaybeVal.trim().replace(/\b(vendor|lead|contact|supplier)\b\s*/gi,"").trim();
        }else if(trailingVal){
          fieldValue=trailingVal;
          targetNameStr=rawNameAndMaybeVal.replace(trailingVal,"").trim().replace(/\b(vendor|lead|contact|supplier)\b\s*/gi,"").trim();
        }
        if(fieldValue&&targetNameStr){
          const found=findVendorOrLead(targetNameStr,allVendors,allLeads);
          if(found){
            const {record,type}=found;
            const fieldKey=detectFieldKey(fieldValue);
            const displayName=type==="vendor"?record.name:(record.contact||record.company);
            try{
              const updated={...record,[fieldKey]:fieldValue};
              const {id,...fields}=updated;
              if(type==="vendor"){await api.put(`/api/vendors/${id}`,fields);onUpdateVendor?.(id,{...fields});}
              else{await api.put(`/api/leads/${id}`,{...fields,value:Number(fields.value)||0});onUpdateLead?.(id,{...fields});}
              setMsgs([...history,{role:"assistant",content:`✓ ${displayName}'s ${fieldKey} updated to ${fieldValue}.`}]);
            }catch(e){setMsgs([...history,{role:"assistant",content:`⚠️ Save failed: ${e.message}`}]);}
            setLoading(false);setMood("idle");return true;
          }else{
            setMsgs([...history,{role:"assistant",content:`I couldn't find "${targetNameStr}" in your vendors or leads.`}]);
            setLoading(false);setMood("idle");return true;
          }
        }
      }
    }

    // Email paste — non-streaming extraction
    // Default to "lead" unless message explicitly says vendor/supplier
    if(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(input)){
      const isVendorMsg=/\b(vendor|supplier|equipment|studio|hire|rental|crew|freelancer|photographer|videographer)\b/i.test(input);
      const today=new Date().toISOString().slice(0,10);
      try{
        const extractSys=isVendorMsg
          ?`Extract vendor/supplier info and return ONLY raw JSON object (no markdown): {"_type":"vendor","name":"","company":"","category":"","email":"","phone":"","website":"domain only","location":"City, Country","notes":"","rateCard":""}. If nothing extractable return {"_type":"none"}.`
          :`Extract contact info for outreach and return ONLY raw JSON object (no markdown): {"_type":"lead","company":"","contact":"","email":"","phone":"","role":"","value":"","category":"","location":"Dubai, UAE","date":"${today}","status":"not_contacted","notes":""}. For category pick from: Production Companies, Creative Agencies, Beauty & Fragrance, Jewellery & Watches, Fashion, Editorial, Sports, Hospitality, Market Research, Commercial. If nothing extractable return {"_type":"none"}.`;
        const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:500,system:extractSys,messages:[{role:"user",content:input.trim().substring(0,4000)}]});
        const raw=(data?.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
        const parsed=JSON.parse(raw);
        if(parsed._type&&parsed._type!=="none"){
          const type=parsed._type;
          const ename=type==="vendor"?parsed.name:(parsed.contact||parsed.company);
          const ecompany=parsed.company||"";
          const epMatches=[...findAllSimilar(ename||"",allVendors,allLeads),...(ecompany?findAllSimilar(ecompany,allVendors,allLeads):[])];
          const seenE=new Set();const epDedup=epMatches.filter(m=>{const k=m.type+"_"+m.record.id;if(seenE.has(k))return false;seenE.add(k);return true;});
          if(epDedup.length>0){
            setPendingDuplicate({entry:parsed,matches:epDedup,saveAsOutreach:false});
            setMsgs([...history,{role:"assistant",content:`Extracted contact: ${ename}.\n\n${_dupMsg(epDedup,ename||ecompany)}`}]);
          }else{
            const fqp=startConv(parsed,type,false,null);
            setMsgs([...history,{role:"assistant",content:`Extracted ${ename||"a contact"}!\n📧 ${parsed.email||"—"}  📱 ${parsed.phone||"—"}\n${type==="vendor"?`🏭 ${parsed.category||"—"}`:`🏢 ${parsed.company||"—"}  💼 ${parsed.role||"—"}`}${fqp?"\n\n"+fqp+" (or 'x' to skip)":"\n\nReview and save below."}`}]);
          }
          setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
        }
      }catch{}
    }

  console.log('[VINNIE-DEBUG] handleVinnieIntent - NO INTENT MATCHED, falling through');
  return false;
}

export function useVinnieCard({ agent, isMobile, pendingConv, pendingLead, pendingType, pendingId, leadEdit, getXContacts }) {
  const isVinnie = agent.id === "logistical";
  const hasVinnieCard = isVinnie && !isMobile && ((pendingConv && !pendingConv._awaitingTypeChoice && !pendingConv._awaitingUpdateName && !pendingConv._awaitingUpdateAction) || !!pendingLead);
  if(isVinnie) console.log('[VINNIE-DEBUG] useVinnieCard:', { isVinnie, isMobile, hasPendingConv: !!pendingConv, pendingConvKeys: pendingConv ? Object.keys(pendingConv) : null, awaitType: pendingConv?._awaitingTypeChoice, awaitName: pendingConv?._awaitingUpdateName, awaitAction: pendingConv?._awaitingUpdateAction, pendingLead: !!pendingLead, hasVinnieCard });
  return { isVinnie, hasVinnieCard };
}

export default function VendorVinnieCard({
  agent, isMobile,
  pendingConv, setPendingConv, pendingLead, pendingType, pendingId,
  leadEdit, setLeadEdit, setPending, showEntry, saveLead, savingLead,
  setMsgs, getXContacts,
  _VENDOR_CATS, _LEAD_CATS, _SOURCES,
}) {
  const [_vinnieAddContact, _setVinnieAddContact] = useState(null);
  console.log('[VINNIE-DEBUG] VendorVinnieCard rendered:', { hasPendingConv: !!pendingConv, pendingConvEntry: !!pendingConv?.entry, pendingLead: !!pendingLead, leadEdit: !!leadEdit });

  const _isXContactMode = pendingConv && pendingConv._saveAsXContact;
  const _cardEntry = _isXContactMode
    ? (() => { const xc = pendingConv._saveAsXContact; const e = pendingConv.entry; const existing = getXContacts(xc.type, xc.id); const inProgress = { name: e.contact || e.name || "", role: e.role || "", email: e.email || "", phone: e.phone || "", _inProgress: true }; return { ...xc.record, _xContacts: [...existing, inProgress] }; })()
    : (pendingConv && pendingConv.entry) ? pendingConv.entry : (pendingLead ? leadEdit : null);
  const _cardType = _isXContactMode ? pendingConv._saveAsXContact.type : ((pendingConv && pendingConv.entry) ? pendingConv.type : pendingType);
  const _cardIsEditable = !!pendingLead && !pendingConv;
  const _cardIsNew = pendingConv ? !pendingConv.updateId : !pendingId;
  const _isOutreach = pendingConv?.saveAsOutreach;
  const _cardTitle = _isXContactMode ? `Adding Contact to ${pendingConv._saveAsXContact.existName}` : (_cardIsNew ? (_cardType === "vendor" ? "New Vendor" : (_isOutreach ? "New Outreach Entry" : "New Lead")) : (_cardType === "vendor" ? "Update Vendor" : "Update Lead"));

  const _cf = (label, key, wide = false, opts = null, inputType = "text") => {
    const val = _cardEntry?.[key] || "";
    const isCurrentQ = pendingConv && pendingConv.questions[pendingConv.idx]?.key === key;
    const onChange = (v) => {
      if (pendingConv) { setPendingConv(prev => ({ ...prev, entry: { ...prev.entry, [key]: v } })); }
      else { setLeadEdit(p => ({ ...p, [key]: v })); }
    };
    return (
      <div key={key} style={{ gridColumn: wide ? "1/-1" : "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: isCurrentQ ? "#007aff" : "#86868b", textTransform: "uppercase", letterSpacing: "0.05em", transition: "color 0.2s" }}>{label}</label>
        {opts ? (
          <select value={val} onChange={e => onChange(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: isCurrentQ ? "1.5px solid #007aff" : "1px solid #e5e5ea", fontSize: 13, fontFamily: "inherit", color: "#1d1d1f", background: isCurrentQ ? "#f0f7ff" : "#f5f5f7", outline: "none", transition: "all 0.2s" }}>
            <option value="">—</option>
            {opts.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : wide ? (
          <textarea value={val} onChange={e => onChange(e.target.value)} rows={2} style={{ padding: "7px 10px", borderRadius: 8, border: isCurrentQ ? "1.5px solid #007aff" : "1px solid #e5e5ea", fontSize: 13, fontFamily: "inherit", color: val ? "#1d1d1f" : "#c7c7cc", background: isCurrentQ ? "#f0f7ff" : "#f5f5f7", outline: "none", resize: "vertical", transition: "all 0.2s" }} />
        ) : (
          <input type={inputType} value={val} onChange={e => onChange(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: isCurrentQ ? "1.5px solid #007aff" : "1px solid #e5e5ea", fontSize: 13, fontFamily: "inherit", color: val ? "#1d1d1f" : "#c7c7cc", background: isCurrentQ ? "#f0f7ff" : "#f5f5f7", outline: "none", transition: "all 0.2s" }} />
        )}
      </div>
    );
  };

  if (!_cardEntry) return null;
  const _statusOpts = [{ value: "not_contacted", label: "Not Contacted" }, { value: "cold", label: "Cold" }, { value: "warm", label: "Warm" }, { value: "open", label: "Open" }];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #e5e5ea" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: _cardType === "vendor" ? "#f0f0f5" : (_isOutreach ? "#fff8e1" : "#edf7ed"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{_cardType === "vendor" ? "🏢" : (_isOutreach ? "📋" : "👤")}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1d1d1f" }}>{_cardTitle}</div>
            <div style={{ fontSize: 11.5, color: "#86868b", marginTop: 1 }}>{pendingConv ? "Answer in chat or edit directly" : "Edit fields and save"}</div>
          </div>
          <button onClick={() => { setPending(null); setPendingConv(null); }} style={{ background: "none", border: "none", fontSize: 20, color: "#aeaeb2", cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", marginBottom: _cardIsEditable ? 20 : 0 }}>
          {_cardType === "vendor" ? <>
            {_cf("Name", "name")}
            {_cf("Company", "company")}
            {_cf("Category", "category", false, _VENDOR_CATS)}
            {_cf("Email", "email", false, null, "email")}
            {_cf("Phone", "phone", false, null, "tel")}
            {_cf("Website", "website")}
            {_cf("Rate Card", "rateCard")}
            {_cf("Location", "location")}
            {_cf("Notes", "notes", true)}
          </> : <>
            {_cf("Contact Name", "contact")}
            {_cf("Company", "company")}
            {_cf("Role / Title", "role")}
            {_cf("Email", "email", false, null, "email")}
            {_cf("Phone", "phone", false, null, "tel")}
            {_cf("Category", "category", false, _LEAD_CATS)}
            {_cf("Status", "status", false, _statusOpts)}
            {_cf("Est. Value (AED)", "value", false, null, "number")}
            {_cf("Date", "date", false, null, "date")}
            {_cf("Location", "location")}
            {_cf("Source", "source", false, _SOURCES)}
            {_cf("Notes", "notes", true)}
          </>}
        </div>
        {/* ── Additional Contacts ── */}
        <div style={{ marginBottom: 16, marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#86868b", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Additional Contacts</div>
            {_isXContactMode
              ? <span style={{ fontSize: 11, color: "#007aff", fontWeight: 600 }}>Filling in via chat...</span>
              : <button onClick={() => _setVinnieAddContact({ name: "", email: "", phone: "", role: "" })} style={{ fontSize: 11, color: "#d4aa20", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, padding: 0 }}>+ Add Contact</button>}
          </div>
          {(_cardEntry?._xContacts || []).map((c, i) => {
            const _xUpdate = (field, val) => {
              const updated = (_cardEntry._xContacts || []).map((x, j) => j === i ? { ...x, [field]: val } : x);
              if (_isXContactMode) {
                const xc = pendingConv._saveAsXContact;
                const real = updated.filter(x => !x._inProgress);
                const ip = updated.find(x => x._inProgress);
                if (ip) { setPendingConv(prev => ({ ...prev, entry: { ...prev.entry, [field]: val } })); }
              } else if (pendingConv) {
                setPendingConv(prev => ({ ...prev, entry: { ...prev.entry, _xContacts: updated } }));
              } else {
                setLeadEdit(p => ({ ...p, _xContacts: updated }));
              }
            };
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8, padding: "8px 10px", borderRadius: 9, background: c._inProgress ? "#f0f7ff" : "#f5f5f7", border: c._inProgress ? "1.5px solid #007aff" : "1px solid #e5e5ea", position: "relative" }}>
                {[["Name", "name"], ["Role", "role"], ["Email", "email"], ["Phone", "phone"]].map(([lbl, k]) => (
                  <div key={k}><div style={{ fontSize: 9, color: "#86868b", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{lbl}</div>
                    <input value={c[k] || ""} onChange={e => _xUpdate(k, e.target.value)} style={{ width: "100%", padding: "4px 7px", borderRadius: 6, border: "1px solid #e5e5ea", fontSize: 12, color: "#1d1d1f", fontFamily: "inherit", background: c._inProgress ? "#f0f7ff" : "#fff", outline: "none" }} /></div>
                ))}
                <button onClick={() => {
                  const updated = (_cardEntry._xContacts || []).filter((_, j) => j !== i);
                  if (pendingConv) { setPendingConv(prev => ({ ...prev, entry: { ...prev.entry, _xContacts: updated } })); }
                  else { setLeadEdit(p => ({ ...p, _xContacts: updated })); }
                }} style={{ position: "absolute", top: 4, right: 8, background: "none", border: "none", color: "#86868b", cursor: "pointer", fontSize: 15, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            );
          })}
          {_vinnieAddContact && (
            <div style={{ padding: "10px 12px", borderRadius: 9, background: "white", border: "1.5px solid #F5D13A", marginTop: 4 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                {[["Name", "name"], ["Role", "role"], ["Email", "email"], ["Phone", "phone"]].map(([lbl, k]) => (
                  <div key={k}><div style={{ fontSize: 9, color: "#86868b", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{lbl}</div>
                    <input value={_vinnieAddContact[k] || ""} onChange={e => _setVinnieAddContact(p => ({ ...p, [k]: e.target.value }))} style={{ width: "100%", padding: "6px 9px", borderRadius: 7, background: "#f5f5f7", border: "1px solid #e5e5ea", color: "#1d1d1f", fontSize: 12, fontFamily: "inherit" }} /></div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => _setVinnieAddContact(null)} style={{ padding: "5px 14px", borderRadius: 8, background: "none", border: "1px solid #e5e5ea", color: "#86868b", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={() => {
                  const nc = { name: _vinnieAddContact.name, email: _vinnieAddContact.email, phone: _vinnieAddContact.phone, role: _vinnieAddContact.role };
                  if (pendingConv) { setPendingConv(prev => ({ ...prev, entry: { ...prev.entry, _xContacts: [...(prev.entry._xContacts || []), nc] } })); }
                  else { setLeadEdit(p => ({ ...p, _xContacts: [...(p._xContacts || []), nc] })); }
                  _setVinnieAddContact(null);
                }} style={{ padding: "5px 14px", borderRadius: 8, background: "#F5D13A", border: "none", color: "#3d2800", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
              </div>
            </div>
          )}
        </div>
        {_cardIsEditable ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPending(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#f5f5f7", border: "1px solid #e5e5ea", fontSize: 13, fontWeight: 600, color: "#6e6e73", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={saveLead} disabled={savingLead} style={{ flex: 2, padding: "11px", borderRadius: 10, background: "#1d1d1f", border: "none", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>{savingLead ? "Saving\u2026" : pendingId ? "\u2713 Save Changes" : _cardType === "vendor" ? "\u2713 Save Vendor" : "\u2713 Save to Pipeline"}</button>
          </div>
        ) : pendingConv && !_isXContactMode ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setPendingConv(null); setPending(null); setMsgs(p => [...p, { role: "assistant", content: "Cancelled." }]); }} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#f5f5f7", border: "1px solid #e5e5ea", fontSize: 13, fontWeight: 600, color: "#6e6e73", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={() => { const e = pendingConv.entry; const t = pendingConv.type; const uid = pendingConv.updateId; const ao = pendingConv.saveAsOutreach; setPendingConv(null); showEntry(e, t, uid, ao); setMsgs(p => [...p, { role: "assistant", content: "Review and save below." }]); }} style={{ flex: 2, padding: "11px", borderRadius: 10, background: "#1d1d1f", border: "none", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>{"\u2713"} Save Now</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
