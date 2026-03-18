import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { debouncedGlobalSave } from "../utils/helpers";

const TodoContext = createContext(null);

export const useTodo = () => {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodo must be used within TodoProvider");
  return ctx;
};

export function TodoProvider({ children }) {
  // ── Core todo state ──
  const [todos,setTodos] = useState(()=>{try{const s=localStorage.getItem('onna_todos');const arr=s?JSON.parse(s):[];const archIds=(()=>{try{return new Set(JSON.parse(localStorage.getItem('onna_archive')||'[]').filter(e=>e.table==='todos').map(e=>e.item?.id).filter(Boolean));}catch{return new Set();}})();return arr.filter(t=>!archIds.has(t.id)).map(t=>t.tab==="personal"?{...t,tab:"onna"}:t.tab?t:{...t,tab:"onna"})}catch(e){return []}});
  const [projectTodos,setProjectTodos] = useState(()=>{try{const s=localStorage.getItem('onna_ptodos');const raw=s?JSON.parse(s):{};const archIds=(()=>{try{return new Set(JSON.parse(localStorage.getItem('onna_archive')||'[]').filter(e=>e.table==='todos').map(e=>e.item?.id).filter(Boolean));}catch{return new Set();}})();const filtered={};for(const[pid,tasks]of Object.entries(raw)){filtered[pid]=(tasks||[]).filter(t=>!archIds.has(t.id));}return filtered;}catch(e){return {}}});
  const [archivedTodos,setArchivedTodos] = useState([]);
  const [newTodo,setNewTodo] = useState("");
  const [todoFilter,setTodoFilter] = useState("todo-week");
  const [selectedTodo,setSelectedTodo] = useState(null);
  const [todoDragId,setTodoDragId] = useState(null);
  const [pendingProjectTask,setPendingProjectTask] = useState(null);
  const [pendingDragToProject,setPendingDragToProject] = useState(null);

  // ── Dash notes (live alongside todos in dashboard) ──
  const [dashNotesList,setDashNotesList] = useState(()=>{try{const s=localStorage.getItem('onna_notes_list');return s?JSON.parse(s):[]}catch{return []}});
  const [dashSelectedNoteId,setDashSelectedNoteId] = useState(null);

  // ── Active projects injected from outside (needed for computed values) ──
  const [activeProjects,setActiveProjects] = useState([]);

  // ── Hydration gate (internal) ──
  const hydratedRef = useRef(false);

  // ── Get archived todo IDs to exclude during hydration ──
  const getArchivedTodoIds = () => {
    try {
      const raw = JSON.parse(localStorage.getItem('onna_archive') || '[]');
      return new Set(raw.filter(e => e.table === 'todos').map(e => e.item?.id).filter(Boolean));
    } catch { return new Set(); }
  };

  // ── Hydration functions (called by App.jsx after /api/global-data) ──
  const hydrateTodos = (backendTodos) => {
    setTodos(prev => {
      const archivedIds = getArchivedTodoIds();
      const backendFiltered = backendTodos.map(t => t.tab==="personal"?{...t,tab:"onna"}:t.tab?t:{...t,tab:"onna"}).filter(t => !archivedIds.has(t.id));
      if (!prev.length) return backendFiltered;
      // Local wins — preserves live edits (color, drag, etc.)
      const merged = [...prev];
      const localIds = new Set(merged.map(t => t.id));
      for (const bt of backendFiltered) { if (!localIds.has(bt.id)) merged.push(bt); }
      return merged;
    });
  };

  const hydrateProjectTodos = (backendPtodos) => {
    setProjectTodos(prev => {
      const archivedIds = getArchivedTodoIds();
      if (!Object.keys(prev).length) {
        const filtered = {};
        for (const [pid, tasks] of Object.entries(backendPtodos)) {
          filtered[pid] = (tasks || []).filter(t => !archivedIds.has(t.id));
        }
        return filtered;
      }
      // Local wins — start with prev, append backend-only items
      const merged = {};
      for (const [pid, tasks] of Object.entries(prev)) {
        merged[pid] = (tasks || []).filter(t => !archivedIds.has(t.id));
      }
      for (const [pid, tasks] of Object.entries(backendPtodos)) {
        const backendFiltered = (tasks || []).filter(t => !archivedIds.has(t.id));
        if (!merged[pid]) { merged[pid] = backendFiltered; continue; }
        const localIds = new Set(merged[pid].map(t => t.id));
        for (const bt of backendFiltered) { if (!localIds.has(bt.id)) merged[pid].push(bt); }
      }
      return merged;
    });
  };

  const hydrateDashNotes = (backendNotes) => {
    setDashNotesList(prev => {
      if (!prev.length) return backendNotes;
      const localIds = new Set(prev.map(n => n.id));
      const merged = [...prev];
      for (const tn of backendNotes) {
        if (!localIds.has(tn.id)) merged.push(tn);
        else {
          const li = merged.findIndex(n => n.id === tn.id);
          if (li !== -1 && tn.updatedAt && merged[li].updatedAt && tn.updatedAt > merged[li].updatedAt) merged[li] = tn;
        }
      }
      return merged;
    });
  };

  const markHydrated = () => {
    hydratedRef.current = true;
    // Force persistence effects to fire so any localStorage-only data gets pushed to Turso
    setTodos(prev => [...prev]);
    setProjectTodos(prev => ({...prev}));
    setDashNotesList(prev => [...prev]);
  };

  // ── Persistence effects ──
  useEffect(()=>{if(!hydratedRef.current&&todos.length===0)return;try{localStorage.setItem('onna_todos',JSON.stringify(todos))}catch(e){} if(hydratedRef.current) debouncedGlobalSave('todos',todos);},[todos]);
  useEffect(()=>{if(!hydratedRef.current&&!Object.keys(projectTodos).length)return;try{localStorage.setItem('onna_ptodos',JSON.stringify(projectTodos))}catch(e){} if(hydratedRef.current) debouncedGlobalSave('ptodos',projectTodos);},[projectTodos]);
  useEffect(()=>{if(!hydratedRef.current&&dashNotesList.length===0)return;try{localStorage.setItem('onna_notes_list',JSON.stringify(dashNotesList))}catch{} if(hydratedRef.current) debouncedGlobalSave('notes_list',dashNotesList);},[dashNotesList]);

  // ── Computed values ──
  const activeProjectIds = useMemo(()=>new Set(activeProjects.map(p=>p.id)),[activeProjects]);

  const allProjectTodosFlat = useMemo(()=>Object.entries(projectTodos).flatMap(([pid,tlist])=>
    activeProjectIds.has(Number(pid)) ? (tlist||[]).map(t=>({...t,_source:"project",projectId:Number(pid)})) : []
  ),[projectTodos,activeProjectIds]);

  const generalTodos = useMemo(()=>todos.filter(t=>!archivedTodos.find(a=>a.id===t.id)).map(t=>({...t,_source:"general"})),[todos,archivedTodos]);

  const projectTodosFlat = useMemo(()=>allProjectTodosFlat.filter(t=>!archivedTodos.find(a=>a.id===t.id)),[allProjectTodosFlat,archivedTodos]);

  const allTodos = useMemo(()=>[...generalTodos,...projectTodosFlat],[generalTodos,projectTodosFlat]);

  const filteredTodos = useMemo(()=>allTodos.filter(t=>{
    if (todoFilter==="todo") return t._source==="general" && t.tab==="onna";
    if (todoFilter==="todo-mon") return t._source==="general" && t.tab==="onna" && t.subType==="monday";
    if (todoFilter==="todo-tue") return t._source==="general" && t.tab==="onna" && t.subType==="tuesday";
    if (todoFilter==="todo-wed") return t._source==="general" && t.tab==="onna" && t.subType==="wednesday";
    if (todoFilter==="todo-thu") return t._source==="general" && t.tab==="onna" && t.subType==="thursday";
    if (todoFilter==="todo-fri") return t._source==="general" && t.tab==="onna" && t.subType==="friday";
    if (todoFilter==="todo-sat") return t._source==="general" && t.tab==="onna" && t.subType==="saturday";
    if (todoFilter==="todo-sun") return t._source==="general" && t.tab==="onna" && t.subType==="sunday";
    if (todoFilter==="todo-longterm") return t._source==="general" && t.tab==="onna" && t.subType==="longterm";
    if (todoFilter==="todo-week") return t._source==="general" && t.tab==="onna";
    if (todoFilter==="project") return t._source==="project";
    if (todoFilter.startsWith("project-")) return t._source==="project" && t.projectId===Number(todoFilter.replace("project-","")); return true;
  }),[allTodos,todoFilter]);

  const todoTopFilter = useMemo(()=>["todo","todo-mon","todo-tue","todo-wed","todo-thu","todo-fri","todo-sat","todo-sun","todo-longterm","todo-week"].includes(todoFilter)?"todo":todoFilter.startsWith("project")||todoFilter==="project"?"project":"todo",[todoFilter]);

  const value = {
    todos, setTodos, projectTodos, setProjectTodos, archivedTodos, setArchivedTodos,
    newTodo, setNewTodo, todoFilter, setTodoFilter, selectedTodo, setSelectedTodo,
    todoDragId, setTodoDragId, pendingProjectTask, setPendingProjectTask,
    pendingDragToProject, setPendingDragToProject,
    dashNotesList, setDashNotesList, dashSelectedNoteId, setDashSelectedNoteId,
    setActiveProjects,
    // Hydration
    hydrateTodos, hydrateProjectTodos, hydrateDashNotes, markHydrated,
    // Computed
    generalTodos, projectTodosFlat, allProjectTodosFlat, allTodos, filteredTodos, todoTopFilter,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}
