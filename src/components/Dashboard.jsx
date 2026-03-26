import React, { Fragment, useState, useRef, useCallback } from "react";
import WidgetGrid from "./widgets/WidgetGrid";

export default function Dashboard({
  T, isMobile, gcalToken, gcalEvents, gcalLoading, gcalEventColors,
  calMonth, setCalMonth, calDayView, setCalDayView,
  outlookEvents, outlookLoading, outlookError, fetchOutlookCal,
  connectGCal, GCAL_CLIENT_ID, GCAL_COLORS,
  setGcalToken, setGcalEvents,
  todos, setTodos, newTodo, setNewTodo, todoFilter, setTodoFilter,
  selectedTodo, setSelectedTodo, projectTodos, setProjectTodos,
  dashNotesList, setDashNotesList, dashSelectedNoteId, setDashSelectedNoteId,
  activeProjects, allTodos, filteredTodos, todoTopFilter,
  allProjectsMerged, archivedTodos, setArchivedTodos,
  pushUndo, addTodoFromInput, archiveItem,
  setPendingDragToProject,
  buildPath, pushNav, setActiveTab, setSelectedProject, setProjectSection,
  DashNotes,
  activityLog, dashboardLayout, setDashboardLayout,
  localLeads, getProjRevenue,
}) {
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [mobileDayIdx, setMobileDayIdx] = useState(() => (new Date().getDay() + 6) % 7);
  const touchStartRef = useRef(null);
  const [customLists, setCustomLists] = useState(()=>{try{const s=localStorage.getItem('onna_todo_lists');return s?JSON.parse(s):[];}catch{return [];}});
  const saveCustomLists=(lists)=>{setCustomLists(lists);try{localStorage.setItem('onna_todo_lists',JSON.stringify(lists));}catch{}};
  const TODO_COLORS = [
    {label:"None",border:"transparent",bg:"transparent",dot:"transparent"},
    {label:"Red",border:"#c46050",bg:"#fdd8d0",dot:"#c46050"},
    {label:"Orange",border:"#c48520",bg:"#fde8c8",dot:"#c48520"},
    {label:"Yellow",border:"#d4aa20",bg:"#fef3c0",dot:"#d4aa20"},
    {label:"Green",border:"#5aaa72",bg:"#c8efd4",dot:"#5aaa72"},
    {label:"Blue",border:"#6a9eca",bg:"#d8eaf8",dot:"#6a9eca"},
    {label:"Lavender",border:"#9080b8",bg:"#e0d8f0",dot:"#9080b8"},
    {label:"Pink",border:"#c47090",bg:"#fdd8e0",dot:"#c47090"},
    {label:"Mint",border:"#4aaa88",bg:"#c8f0e0",dot:"#4aaa88"},
  ];
  return (
    <div>
      {(()=>{
        const MAIN_DEF=["calendar-projects","todos","notes"];
        const sectionMap = {
          "calendar-projects": (
      <div style={{marginBottom:isMobile?12:18,display:"grid",gridTemplateColumns:isMobile?"1fr":"340px 1fr",gap:18}}>

      {/* Active Projects — slim sidebar (left) */}
      <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafafa"}}>
            <span style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Projects</span>
            <span style={{fontSize:11,color:T.muted,fontWeight:500}}>{activeProjects.length}</span>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {activeProjects.map((p,i)=>{
              const sc = { Proposal: "#f57f17", Confirmed: "#1565c0", Active: "#147d50", Archived: T.muted };
              const sb = { Proposal: "#fff8e1", Confirmed: "#e3f2fd", Active: "#edfaf3", Archived: "#f5f5f7" };
              return (
              <a key={p.id} href={buildPath("Projects",p.id,null,null)} onClick={(e)=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();setActiveTab("Projects");setSelectedProject(p);setProjectSection("Home");pushNav("Projects",p,"Home",null);}} style={{padding:"9px 14px",borderBottom:i<activeProjects.length-1?`1px solid ${T.borderSub}`:"none",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"background 0.1s",textDecoration:"none",color:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{fontSize:12.5,fontWeight:500,color:T.text,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:999,background:sb[p.status]||"#f5f5f7",color:sc[p.status]||T.muted,fontWeight:600,letterSpacing:"0.03em",whiteSpace:"nowrap",flexShrink:0,marginLeft:8}}>{p.status||"—"}</span>
              </a>
              );
            })}
            {activeProjects.length===0&&<div style={{padding:"28px 14px",textAlign:"center",fontSize:12,color:T.muted}}>No projects.</div>}
          </div>
        </div>
      {/* ── Google Calendar Widget (right) ── */}
      <div style={{minWidth:0}}>
      {(()=>{
        const today = new Date();
        const yr = calMonth.getFullYear();
        const mo = calMonth.getMonth();
        const firstDay = new Date(yr, mo, 1);
        const lastDay  = new Date(yr, mo+1, 0);
        const startOffset = (firstDay.getDay() + 6) % 7;
        const totalCells  = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
        const cells = Array.from({length:totalCells}, (_,i) => { const d = i - startOffset + 1; return (d < 1 || d > lastDay.getDate()) ? null : new Date(yr, mo, d); });
        const seen0 = new Set();
        const allCalEvents0 = [...gcalEvents, ...outlookEvents].filter(ev => { const day=ev.start?.date||ev.start?.dateTime?.slice(0,10); const k=(ev.summary||"").trim().toLowerCase()+"|"+day; if(seen0.has(k))return false; seen0.add(k); return true; });
        const eventsByDay0 = {};
        allCalEvents0.forEach(ev => { const startStr=ev.start?.date||ev.start?.dateTime?.slice(0,10); if(!startStr)return; const endStr=ev.end?.date||ev.end?.dateTime?.slice(0,10)||startStr; const cursor=new Date(startStr+"T00:00:00"); const endD=new Date(endStr+"T00:00:00"); const startKey=cursor.toISOString().slice(0,10); let guard=0; while(cursor<endD||cursor.toISOString().slice(0,10)===startKey){const key=cursor.toISOString().slice(0,10);if(!eventsByDay0[key])eventsByDay0[key]=[];eventsByDay0[key].push(ev);cursor.setDate(cursor.getDate()+1);if(++guard>14)break;} });
        const DAY_LABELS0 = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
        const monthLabel = calMonth.toLocaleDateString("en-US",{month:"long",year:"numeric"});
        return (
          <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{padding:"13px 18px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafafa",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Calendar</span>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <button onClick={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"1px 7px",cursor:"pointer",fontSize:14,color:T.sub,lineHeight:1.5,fontFamily:"inherit"}}>‹</button>
                  <span style={{fontSize:13.5,fontWeight:600,color:T.text,minWidth:isMobile?106:120,textAlign:"center"}}>{monthLabel}</span>
                  <button onClick={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"1px 7px",cursor:"pointer",fontSize:14,color:T.sub,lineHeight:1.5,fontFamily:"inherit"}}>›</button>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:outlookLoading?"#f59e0b":outlookError?"#ef4444":outlookEvents.length>0?"#0078d4":"#d1d1d6",display:"inline-block",flexShrink:0}}/>
                  <span style={{fontSize:11,color:outlookError?"#ef4444":T.muted,fontWeight:500}} title={outlookError||undefined}>{outlookLoading?"Syncing…":outlookError?"Outlook error (↻ retry)":outlookEvents.length>0?`Outlook (${outlookEvents.length})`:"Outlook"}</span>
                  <button onClick={fetchOutlookCal} disabled={outlookLoading} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:10,padding:"0 2px",fontFamily:"inherit",textDecoration:"underline"}}>↻</button>
                </div>
                <div style={{width:1,height:12,background:T.border}}/>
                {gcalToken ? (
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block",flexShrink:0}}/>
                    <span style={{fontSize:11,color:T.muted,fontWeight:500}}>Google</span>
                    <button onClick={()=>{setGcalToken(null);setGcalEvents([]);try{localStorage.removeItem('onna_gcal_token');localStorage.removeItem('onna_gcal_exp');localStorage.removeItem('onna_gcal_connected');}catch{}}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:10,padding:"0 2px",fontFamily:"inherit",textDecoration:"underline"}}>Disconnect</button>
                  </div>
                ) : GCAL_CLIENT_ID ? (
                  <button onClick={connectGCal} style={{padding:"4px 10px",borderRadius:7,background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ Google Calendar</button>
                ) : null}
              </div>
            </div>
            <div style={{padding:isMobile?"8px 6px":"12px 14px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:3}}>
                {DAY_LABELS0.map(d=>(<div key={d} style={{textAlign:"center",fontSize:isMobile?9:10,fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",padding:"2px 0 5px"}}>{d}</div>))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:isMobile?2:3}}>
                {cells.map((date,i)=>{
                  if (!date) return <div key={`e${i}`} style={{minHeight:isMobile?44:66}}/>;
                  const key=date.toISOString().slice(0,10);
                  const isToday=key===today.toISOString().slice(0,10);
                  const isWeekend=date.getDay()===0||date.getDay()===6;
                  const dayEvs=eventsByDay0[key]||[];
                  const projBars=(allProjectsMerged||[]).filter(p=>p.startDate&&p.endDate&&p.client!=="TEMPLATE"&&key>=p.startDate&&key<=p.endDate);
                  return (
                    <div key={key} onClick={()=>setCalDayView(date)} style={{minHeight:isMobile?44:66,borderRadius:7,background:isToday?T.accent+"15":"transparent",border:isToday?`1.5px solid ${T.accent}44`:`1px solid ${T.borderSub}`,padding:isMobile?"3px":"4px 5px",display:"flex",flexDirection:"column",gap:2,overflow:"hidden",minWidth:0,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=isToday?T.accent+"25":"#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background=isToday?T.accent+"15":"transparent"}>
                      <span style={{fontSize:isMobile?10:11,fontWeight:isToday?700:400,color:isToday?T.accent:isWeekend?T.muted:T.text,lineHeight:1,alignSelf:"flex-start",flexShrink:0}}>{date.getDate()}</span>
                      {!isMobile&&projBars.slice(0,2).map(p=>{const sc={Proposal:"#f57f17",Confirmed:"#1565c0",Active:"#147d50",Archived:"#86868b"};const c=sc[p.status]||"#86868b";return <div key={p.id} title={p.name} style={{fontSize:9,background:c+"22",color:c,borderRadius:3,padding:"1px 4px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:600,lineHeight:1.5,minWidth:0,width:"100%",boxSizing:"border-box"}}>{p.name}</div>;})}
                      {isMobile?(dayEvs.length>0&&<div style={{display:"flex",gap:2,flexWrap:"wrap",marginTop:1}}>{dayEvs.slice(0,4).map((ev,ei)=>{const c=ev.colorId?(gcalEventColors[ev.colorId]?.background||GCAL_COLORS[ev.colorId]||T.accent):(ev.calendarColor||T.accent);return <span key={ei} style={{width:5,height:5,borderRadius:"50%",background:c,display:"inline-block"}}/>;})}{projBars.slice(0,2).map(p=>{const sc={Proposal:"#f57f17",Confirmed:"#1565c0",Active:"#147d50",Archived:"#86868b"};return <span key={`p${p.id}`} style={{width:5,height:5,borderRadius:"50%",background:sc[p.status]||"#86868b",display:"inline-block"}}/>;})}</div>):(
                        <div style={{display:"flex",flexDirection:"column",gap:2,flex:1,overflow:"hidden",minWidth:0}}>
                          {dayEvs.slice(0,3).map((ev,ei)=>{const col=ev.colorId?(gcalEventColors[ev.colorId]?.background||GCAL_COLORS[ev.colorId]||T.accent):(ev.calendarColor||T.accent);const title=ev.summary||"(no title)";const time=ev.start?.dateTime?new Date(ev.start.dateTime).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true}):null;return(<div key={ei} title={`${time?time+" ":""}${title}`} style={{fontSize:9.5,background:col+"22",color:col,borderRadius:3,padding:"1px 4px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:500,lineHeight:1.5,minWidth:0,width:"100%",boxSizing:"border-box"}}>{time?`${time} `:""}{title}</div>);})}
                          {dayEvs.length>3&&<div style={{fontSize:9,color:T.muted,lineHeight:1.4}}>+{dayEvs.length-3} more</div>}
                        </div>
                      )}
                    </div>
                  ); })}
              </div>
              {gcalLoading&&<div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:T.muted}}>Loading events…</div>}
              {!gcalToken&&!gcalLoading&&<div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:T.muted}}>Connect Google Calendar to see your events here</div>}
            </div>
          </div>
        ); })()}
      </div>
      </div>
          ),
          "todos": (
      <div style={{marginBottom:isMobile?12:18}}>
        <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",display:"flex",flexDirection:"column",minHeight:isMobile?"auto":320}}>
          {/* Title row */}
          <div style={{padding:"13px 16px 0",background:"#fafafa",borderBottom:`1px solid ${T.borderSub}`,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,flex:1}}>TO DO LIST</span>
              <span style={{fontSize:11,color:T.muted}}>{allTodos.filter(t=>!t.done).length} open</span>
            </div>
            <div style={{display:"flex",gap:0,borderRadius:8,background:"#ebebed",padding:2,marginBottom:10}}>
              {[["todo","ONNA"],["project","Projects"]].map(([val,label])=>(
                <button key={val} onClick={()=>{if(val==="todo")setTodoFilter("todo-week");else setTodoFilter(val);}}
                  onDragOver={e=>{e.preventDefault();e.currentTarget.style.outline="2px solid "+T.accent;}}
                  onDragLeave={e=>{e.currentTarget.style.outline="none";}}
                  onDrop={e=>{e.preventDefault();e.currentTarget.style.outline="none";const dragId=Number(e.dataTransfer.getData("text/plain"));if(!dragId)return;if(val==="project"){const task=todos.find(t=>t.id===dragId);if(task){pushUndo('move to project');setPendingDragToProject(task);};return;}pushUndo("move task");setTodos(prev=>prev.map(t=>t.id===dragId?{...t,tab:"onna",subType:undefined}:t));setTodoFilter("todo-week");}}
                  style={{flex:1,padding:"5px 0",borderRadius:6,fontSize:11.5,fontWeight:500,cursor:"pointer",border:"none",fontFamily:"inherit",background:todoTopFilter===val?"#fff":"transparent",color:todoTopFilter===val?T.text:T.muted,boxShadow:todoTopFilter===val?"0 1px 2px rgba(0,0,0,0.08)":"none",transition:"all 0.12s"}}>{label}</button>
              ))}
            </div>
            {todoTopFilter==="project"&&(
              <div style={{paddingBottom:10}}>
                <select value={todoFilter} onChange={e=>setTodoFilter(e.target.value)} style={{width:"100%",padding:"7px 28px 7px 11px",borderRadius:9,background:"#fff",border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit",cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aeaeb2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
                  <option value="project">All projects</option>
                  {allProjectsMerged.filter(p=>p.status==="Active"&&p.client!=="TEMPLATE").map(p=>(<option key={p.id} value={`project-${p.id}`}>{p.name}</option>))}
                </select>
              </div>
            )}
          </div>
          {/* Scrollable content */}
          <div style={{padding:"6px 12px",overflowY:"auto",flex:1,minHeight:0}}>
            {todoTopFilter==="todo"?(()=>{
              const days=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
              const dayLabels=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
              const todayDay=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][new Date().getDay()];
              const byDay={};days.forEach(d=>{byDay[d]=filteredTodos.filter(t=>t.subType===d);});
              const longterm=filteredTodos.filter(t=>t.subType==="longterm");
              const unassigned=filteredTodos.filter(t=>!t.subType||(!days.includes(t.subType)&&t.subType!=="longterm"&&!(t.subType||"").startsWith("list:")));
              const cycleColor=(t)=>{const ci=t.color?TODO_COLORS.findIndex(c=>c.dot===t.color):0;const next=TODO_COLORS[((ci<0?0:ci)+1)%TODO_COLORS.length];pushUndo("color");setTodos(prev=>prev.map(x=>x.id===t.id?{...x,color:next.dot==="transparent"?undefined:next.dot}:x));};
              const tc=(t)=>TODO_COLORS.find(c=>c.dot===t.color)||TODO_COLORS[0];
              const reorderDrop=(targetId,targetSubType,e)=>{
                e.preventDefault();e.stopPropagation();e.currentTarget.style.borderTopColor="transparent";
                const dragId=Number(e.dataTransfer.getData("text/plain"));
                if(!dragId||dragId===targetId)return;
                pushUndo("reorder");
                setTodos(prev=>{
                  const arr=[...prev];
                  const fromIdx=arr.findIndex(x=>x.id===dragId);
                  if(fromIdx<0)return prev;
                  const [item]=arr.splice(fromIdx,1);
                  item.subType=targetSubType;
                  const toIdx=arr.findIndex(x=>x.id===targetId);
                  if(toIdx<0){arr.push(item);}else{arr.splice(toIdx,0,item);}
                  return arr;
                });
              };
              const renderTask=(t,sectionSubType)=>{
                const c=tc(t);const hasBg=c.bg!=="transparent";
                return (
                <div key={t.id} className="todo-item" draggable="true" onDoubleClick={e=>{e.stopPropagation();pushUndo('edit task');setSelectedTodo(t);}} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 3px",borderBottom:`1px solid ${T.borderSub}`,cursor:"grab",fontSize:11,background:hasBg?c.bg+"88":"transparent",borderLeft:hasBg?`3px solid ${c.border}`:"3px solid transparent",borderRadius:hasBg?4:0,marginBottom:hasBg?2:0,borderTop:"2px solid transparent",transition:"border-top-color 0.1s"}}
                  onDragStart={e=>{e.dataTransfer.setData("text/plain",String(t.id));e.dataTransfer.effectAllowed="move";e.dataTransfer.setDragImage(e.currentTarget,0,0);}}
                  onDragOver={e=>{e.preventDefault();e.stopPropagation();e.currentTarget.style.borderTopColor=T.accent;}}
                  onDragLeave={e=>{e.currentTarget.style.borderTopColor="transparent";}}
                  onDrop={e=>reorderDrop(t.id,sectionSubType,e)}>
                  <button draggable="false" onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();pushUndo("toggle");setTodos(prev=>prev.map(x=>x.id===t.id?{...x,done:!x.done}:x));}} style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${t.done?T.muted:T.border}`,background:t.done?T.accent:"transparent",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {t.done&&<span style={{color:"#fff",fontSize:8,lineHeight:1,fontWeight:700}}>✓</span>}
                  </button>
                  {editingTodoId===t.id?(
                    <input autoFocus draggable="false" defaultValue={t.text} onBlur={e=>{const v=e.target.value.trim();if(v&&v!==t.text){pushUndo("edit");setTodos(prev=>prev.map(x=>x.id===t.id?{...x,text:v}:x));}setEditingTodoId(null);}} onKeyDown={e=>{if(e.key==="Enter")e.target.blur();if(e.key==="Escape"){setEditingTodoId(null);}}} onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} style={{flex:1,minWidth:0,fontSize:11,padding:"1px 3px",border:`1px solid ${T.accent}`,borderRadius:3,background:"#fff",color:T.text,fontFamily:"inherit",outline:"none"}}/>
                  ):(
                    <span draggable="false" onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();setEditingTodoId(t.id);}} style={{flex:1,minWidth:0,cursor:"text",color:t.done?T.muted:T.text,textDecoration:t.done?"line-through":"none",wordBreak:"break-word"}}>{t.text}</span>
                  )}
                  <button draggable="false" onMouseDown={e=>e.stopPropagation()} title="Cycle colour" onClick={e=>{e.stopPropagation();cycleColor(t);}} style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",flexShrink:0,lineHeight:1,fontSize:13,color:t.color||T.muted,opacity:t.color?1:0.5,transition:"opacity 0.12s"}}>★</button>
                  <button draggable="false" onMouseDown={e=>e.stopPropagation()} className="todo-del" onClick={e=>{e.stopPropagation();pushUndo("toggle");archiveItem('todos',t);setTodos(prev=>prev.filter(x=>x.id!==t.id));}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13,padding:"2px 4px",lineHeight:1,flexShrink:0}}>×</button>
                </div>);
              };
              const colDrop=(day)=>({
                onDragOver:e=>{e.preventDefault();e.currentTarget.style.background=T.accent+"15";},
                onDragLeave:e=>{e.currentTarget.style.background="transparent";},
                onDrop:e=>{e.preventDefault();e.currentTarget.style.background="transparent";const dragId=Number(e.dataTransfer.getData("text/plain"));if(!dragId)return;pushUndo("move task");setTodos(prev=>prev.map(t=>t.id===dragId?{...t,tab:"onna",subType:day}:t));}
              });
              const mobileLabels=["M","T","W","T","F","S","S"];
              return (<div>
                {isMobile ? (<>
                  {/* Day selector row */}
                  <div style={{display:"flex",gap:4,marginBottom:8,justifyContent:"center"}}>
                    {days.map((day,i)=>{
                      const isToday=day===todayDay;
                      const isActive=i===mobileDayIdx;
                      return (
                        <button key={day} onClick={()=>setMobileDayIdx(i)} style={{width:34,height:34,borderRadius:"50%",border:isToday&&!isActive?`2px solid ${T.accent}`:`2px solid transparent`,background:isActive?T.accent:"transparent",color:isActive?"#fff":isToday?T.accent:T.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>{mobileLabels[i]}</button>
                      );
                    })}
                  </div>
                  {/* Single day column with swipe */}
                  <div
                    {...colDrop(days[mobileDayIdx])}
                    onTouchStart={e=>{touchStartRef.current=e.touches[0].clientX;}}
                    onTouchEnd={e=>{if(touchStartRef.current===null)return;const dx=e.changedTouches[0].clientX-touchStartRef.current;touchStartRef.current=null;if(Math.abs(dx)>50){setMobileDayIdx(prev=>dx<0?(prev+1)%7:(prev+6)%7);}}}
                    style={{minHeight:80,padding:"4px 4px"}}
                  >
                    <div style={{fontSize:10,fontWeight:600,color:days[mobileDayIdx]===todayDay?T.accent:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4,textAlign:"center"}}>{dayLabels[mobileDayIdx]}</div>
                    {byDay[days[mobileDayIdx]].map(t=>renderTask(t,days[mobileDayIdx]))}
                    {byDay[days[mobileDayIdx]].length===0&&<div style={{fontSize:11,color:T.muted,padding:"12px 3px",opacity:0.5,textAlign:"center"}}>No tasks for {dayLabels[mobileDayIdx]}</div>}
                  </div>
                </>) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                  {days.map((day,i)=>{
                    const isToday=day===todayDay;
                    return (
                    <div key={day} {...colDrop(day)} style={{minHeight:80,borderRight:i<6?`1px solid ${T.borderSub}`:"none",padding:"4px 4px"}}>
                      <div style={{fontSize:10,fontWeight:600,color:isToday?T.accent:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4,textAlign:"center"}}>{dayLabels[i]}</div>
                      {byDay[day].map(t=>renderTask(t,day))}
                    </div>);
                  })}
                </div>)}
                <div style={{marginTop:8,padding:"4px 0",borderTop:`1px solid ${T.borderSub}`}} {...colDrop("longterm")}>
                  <div style={{fontSize:10,fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Long Term</div>
                  {longterm.map(t=>renderTask(t,"longterm"))}
                  {longterm.length===0&&<div style={{fontSize:11,color:T.muted,padding:"4px 3px",opacity:0.5}}>Drag tasks here or add below</div>}
                </div>
                {customLists.map(cl=>{
                  const listTasks=filteredTodos.filter(t=>t.subType===`list:${cl}`);
                  return (
                  <div key={cl} style={{marginTop:8,padding:"4px 0",borderTop:`1px solid ${T.borderSub}`}} {...colDrop(`list:${cl}`)}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                      <div style={{fontSize:10,fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em"}}>{cl}</div>
                      <button onClick={()=>{if(listTasks.length>0){if(!window.confirm(`Delete "${cl}" list? Tasks will move to Unassigned.`))return;setTodos(prev=>prev.map(t=>t.subType===`list:${cl}`?{...t,subType:undefined}:t));}saveCustomLists(customLists.filter(x=>x!==cl));}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13,padding:0,lineHeight:1,opacity:0.5}}>×</button>
                    </div>
                    {listTasks.map(t=>renderTask(t,`list:${cl}`))}
                  </div>);
                })}
                <button onClick={()=>{const name=window.prompt("List name:");if(!name||!name.trim())return;const n=name.trim();if(customLists.includes(n))return;saveCustomLists([...customLists,n]);}} style={{marginTop:8,background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:"4px 0",fontWeight:500,opacity:0.6}}>+ New List</button>
                {unassigned.length>0&&<div style={{marginTop:8,padding:"4px 0",borderTop:`1px solid ${T.borderSub}`}} {...colDrop(undefined)}>
                  <div style={{fontSize:10,fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Unassigned</div>
                  {unassigned.map(t=>renderTask(t,undefined))}
                </div>}
              </div>);
            })():<>
            {filteredTodos.map(t=>(
              <div key={t.id} className="todo-item" draggable={t._source==="general"} onDragStart={e=>{e.dataTransfer.setData("text/plain",String(t.id));e.dataTransfer.effectAllowed="move";}} style={{display:"flex",alignItems:"flex-start",gap:9,padding:"8px 6px",borderBottom:`1px solid ${T.borderSub}`,cursor:t._source==="general"?"grab":"default"}}>
                <button onClick={e=>{e.stopPropagation();pushUndo("toggle");(t._source==="project"?setProjectTodos(prev=>({...prev,[t.projectId]:(prev[t.projectId]||[]).map(x=>x.id===t.id?{...x,done:!x.done}:x)})):setTodos(prev=>prev.map(x=>x.id===t.id?{...x,done:!x.done}:x)));}} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${t.done?T.muted:T.border}`,background:t.done?T.accent:"transparent",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,transition:"all 0.12s"}}>
                  {t.done&&<span style={{color:"#fff",fontSize:9,lineHeight:1,fontWeight:700}}>✓</span>}
                </button>
                <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>{pushUndo('edit task');setSelectedTodo(t);}}>
                  {t._source==="project"&&<span style={{fontSize:10.5,fontWeight:600,color:T.muted,marginRight:5}}>{allProjectsMerged.find(p=>p.id===t.projectId)?.name||"Project"}</span>}
                  <span style={{fontSize:13,color:t.done?T.muted:T.text,textDecoration:t.done?"line-through":"none"}}>{t.text}</span>
                </div>
                <div className="todo-del" style={{display:"flex",gap:3}}>
                  <button onClick={e=>{e.stopPropagation();pushUndo('archive');setArchivedTodos(prev=>[...prev,t]);}} title="Archive" style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,padding:"2px 3px",borderRadius:4,fontFamily:"inherit",opacity:0.6}}>⊘</button>
                  <button onClick={e=>{e.stopPropagation();pushUndo("toggle");archiveItem('todos',t);(t._source==="project"?setProjectTodos(prev=>({...prev,[t.projectId]:(prev[t.projectId]||[]).filter(x=>x.id!==t.id)})):setTodos(prev=>prev.filter(x=>x.id!==t.id)));}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:0,lineHeight:1}}>×</button>
                </div>
              </div>
            ))}
            {(()=>{const emptyCount=Math.max(0,5-filteredTodos.length);return emptyCount>0?Array.from({length:emptyCount}).map((_,i)=>(<div key={`empty-${i}`} style={{padding:"4px 6px",borderBottom:`1px solid ${T.borderSub}`}}><input placeholder="New task…" onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){addTodoFromInput(e.target.value.trim());e.target.value="";}}} onBlur={e=>{if(e.target.value.trim()){addTodoFromInput(e.target.value.trim());e.target.value="";}}} style={{width:"100%",padding:"7px 11px",borderRadius:9,background:"transparent",border:"none",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none"}} /></div>)):null;})()}
            </>}
          </div>
          {/* Add input */}
          <div style={{padding:"10px 12px",borderTop:`1px solid ${T.borderSub}`,display:"flex",gap:7,background:"#fafafa",flexShrink:0}}>
            <input value={newTodo} onChange={e=>setNewTodo(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newTodo.trim()){addTodoFromInput(newTodo.trim());setNewTodo("");}}} placeholder={todoTopFilter==="project"?"Add project task…":"Add task…"} style={{flex:1,padding:"7px 11px",borderRadius:9,background:"#fff",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            <button onClick={()=>{if(newTodo.trim()){addTodoFromInput(newTodo.trim());setNewTodo("");}}} style={{padding:"7px 14px",borderRadius:9,background:T.accent,border:"none",color:"#fff",fontSize:16,cursor:"pointer",lineHeight:1,flexShrink:0}}>+</button>
          </div>
        </div>
      </div>
          ),
          "notes": (
      <div style={{marginBottom:isMobile?12:18}}>

      {/* ── Notes ── */}
      <DashNotes notes={dashNotesList} setNotes={setDashNotesList} selectedId={dashSelectedNoteId} setSelectedId={setDashSelectedNoteId} isMobile={isMobile} onArchive={archiveItem}/>
      </div>
          ),
        };
        const renderCalendarProjects = () => sectionMap["calendar-projects"];
        const renderTodos = () => sectionMap["todos"];
        const renderNotes = () => sectionMap["notes"];

        return <WidgetGrid
          T={T} isMobile={isMobile}
          layout={dashboardLayout} setLayout={setDashboardLayout}
          renderCalendarProjects={renderCalendarProjects}
          renderTodos={renderTodos}
          renderNotes={renderNotes}
          activityLog={activityLog}
          activeProjects={activeProjects}
          allProjectsMerged={allProjectsMerged}
          localLeads={localLeads}
          getProjRevenue={getProjRevenue}
        />;
      })()}

    </div>
  );
}
