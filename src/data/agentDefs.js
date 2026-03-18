import { _Logan, _Rex, _Nova, _Billie, _Cody, _Finn, _Carrie, _Tina, _Tabby, _Polly, _Lillie, _Perry, _YELLOW, _PINK, _BLUE, _GREEN, _ORANGE, _TEAL, _CORAL, _SKY, _ROSE, _LAVENDER, _MINT, _PEACH } from "../components/agents/AgentCharacters";
import { VINNIE_SYSTEM } from "../prompts/vinnie";
import { CONNIE_SYSTEM } from "../prompts/connie";
import { RONNIE_SYSTEM } from "../prompts/ronnie";
import { BILLIE_SYSTEM } from "../prompts/billie";
import { CODY_SYSTEM } from "../prompts/cody";
import { CARRIE_SYSTEM } from "../prompts/carrie";
import { TINA_SYSTEM } from "../prompts/tina";
import { TABBY_SYSTEM } from "../prompts/tabby";
import { POLLY_SYSTEM } from "../prompts/polly";
import { LILLIE_SYSTEM } from "../prompts/lillie";
import { PERRY_SYSTEM } from "../prompts/perry";

export const AGENT_DEFS = [
  {id:"logistical",name:"Vendor Vinnie",title:"Contacts",emoji:"🔍",color:_YELLOW,border:"#d4aa20",accent:"#7a5800",bg:"#fffef5",textColor:"#3d2800",tagBg:"#fef3c0",Blob:_Logan,
   system:VINNIE_SYSTEM,
   placeholder:"Create new vendor...",
   intro:"Hey! I'm Vendor Vinnie ✏️ Here's what I can do:\n\n1️⃣ **Add a Vendor** — Give me a name, category, email & phone and I'll save it\n2️⃣ **Log Outreach** — Tell me who you contacted and I'll log it with today's date\n3️⃣ **Search Contacts** — Find vendors by name, category or location\n\nWhat do you need?"},
  {id:"compliance",name:"Call Sheet Connie",title:"Call Sheets",emoji:"📋",color:_PINK,border:"#c47090",accent:"#7a1a30",bg:"#fff5f7",textColor:"#3d0818",tagBg:"#fdd8e0",Blob:_Rex,
   system:CONNIE_SYSTEM,
   placeholder:"Add call sheet details...",
   intro:"Hi! I'm Call Sheet Connie 📋 Here's what I can do:\n\n1️⃣ **Edit Call Sheet** — Add crew, update times, locations & details\n2️⃣ **Review & Check** — Find what's missing or needs updating\n3️⃣ **Dietary & Catering** — Manage dietary requirements and menus\n\nFirst, which project should I work on?"},
  {id:"researcher",name:"Risk Assessment Ronnie",title:"Risk Assessment",emoji:"🔬",color:_BLUE,border:"#6a9eca",accent:"#1a4a80",bg:"#f3f8ff",textColor:"#0a1f3d",tagBg:"#d8eaf8",Blob:_Nova,
   system:RONNIE_SYSTEM,
   placeholder:"Add risk assessment details...",
   intro:"I'm Risk Assessment Ronnie 🔬 Here's what I can do:\n\n1️⃣ **Add Risks** — Log hazards with severity, likelihood & mitigation\n2️⃣ **Review Assessment** — Check what's missing or needs updating\n3️⃣ **Generate Report** — Summarise all risks for a shoot day\n\nFirst, which project should I work on?"},
  {id:"billie",name:"Budget Billie",title:"Budgets & Expenses",emoji:"💰",color:_GREEN,border:"#5aaa72",accent:"#1a5a30",bg:"#f3fbf5",textColor:"#0a2e14",tagBg:"#c8efd4",Blob:_Billie,
   system:BILLIE_SYSTEM,
   placeholder:"Budget or expense details...",
   intro:"Hey! I'm Budget Billie 💰 Here's what I can do:\n\n1️⃣ **Build & Edit Budget** — Create estimates, update rates, adjust markup\n2️⃣ **Log Expenses** — Track actuals, add costs, update Zoho amounts\n3️⃣ **Review & Compare** — Actuals vs estimates, flag overruns, export\n4️⃣ **Rate Card** — Manage your default rates per location\n\nFirst, which project should I work on?"},
  {id:"contracts",name:"Contract Cody",title:"Contract Cody",emoji:"📝",color:_ORANGE,border:"#c48520",accent:"#7a5200",bg:"#fff8f0",textColor:"#3d2200",tagBg:"#fde8c8",Blob:_Cody,
   system:CODY_SYSTEM,
   placeholder:"Add contract details...",
   intro:"I'm Contract Cody 📝 Here's what I can do:\n\n1️⃣ **Live Contracts** — Fill in fields, switch types, review & export your project contracts\n2️⃣ **Generate Documents** — Draft waivers, NDAs, agreements & more from scratch\n3️⃣ **Sign & Stamp** — Upload a PDF or generate a doc, then add signature, stamp & letterhead\n\nWhat do you need?"},
  {id:"carrie",name:"Casting Carrie",title:"Casting",emoji:"🎬",color:_CORAL,border:"#c46050",accent:"#7a2a1a",bg:"#fff5f3",textColor:"#3d1008",tagBg:"#fdd8d0",Blob:_Carrie,
   system:CARRIE_SYSTEM,
   placeholder:"Add casting details...",
   intro:"Hi! I'm Casting Carrie 🎬 Here's what I can do:\n\n1️⃣ **Add Talent** — Add models, actors or extras with details & agency info\n2️⃣ **Search & Brief** — Search agencies or generate a casting brief\n3️⃣ **Review & Export** — Check casting status, export to PDF/CSV\n\nFirst, which project should I work on?"},
  {id:"tina",name:"Travel Tina",title:"Travel",emoji:"✈️",color:_SKY,border:"#5a9ad0",accent:"#1a4a80",bg:"#f0f7ff",textColor:"#0a1f3d",tagBg:"#d0e6f8",Blob:_Tina,
   system:TINA_SYSTEM,
   placeholder:"Add travel details...",
   intro:"Hi! I'm Travel Tina ✈️ Here's what I can do:\n\n1️⃣ **Build Itinerary** — Flights, hotels, transport & per diems for cast & crew\n2️⃣ **Update & Manage** — Change bookings, adjust times, manage travel budgets\n3️⃣ **Review & Export** — Check for gaps, conflicts & prepare for sharing\n\nFirst, which project should I work on?"},
  {id:"tabby",name:"Talent Tabby",title:"Talent & Styling",emoji:"👗",color:_ROSE,border:"#c46878",accent:"#7a1a30",bg:"#fff5f7",textColor:"#3d0818",tagBg:"#f8d0d8",Blob:_Tabby,
   system:TABBY_SYSTEM,
   placeholder:"Add talent or styling details...",
   intro:"Hi! I'm Talent Tabby 👗 Here's what I can do:\n\n1️⃣ **Casting Decks** — Build talent boards with photos, details & options\n2️⃣ **Fittings & Styling** — Schedule fittings, track wardrobe & measurements\n3️⃣ **Review & Share** — Check talent status & prepare decks for clients\n\nFirst, which project should I work on?"},
  {id:"polly",name:"Producer Polly",title:"Production",emoji:"🎬",color:_LAVENDER,border:"#9080b8",accent:"#4a2a80",bg:"#f8f5ff",textColor:"#2d0a50",tagBg:"#e0d8f0",Blob:_Polly,
   system:POLLY_SYSTEM,
   placeholder:"Add production details...",
   intro:"Hi! I'm Producer Polly 🎬 Here's what I can do:\n\n1️⃣ **CPS & Shot Lists** — Build schedules, milestones & detailed shot lists\n2️⃣ **Storyboards & Briefs** — Structure frames & draft creative briefs\n3️⃣ **Equipment & Wrap** — Equipment lists, wrap reports & lessons learned\n\nFirst, which project should I work on?"},
  {id:"lillie",name:"Location Lillie",title:"Locations",emoji:"📍",color:_MINT,border:"#4aaa88",accent:"#1a5a40",bg:"#f0faf6",textColor:"#0a2e1e",tagBg:"#c8f0e0",Blob:_Lillie,
   system:LILLIE_SYSTEM,
   placeholder:"Add location details...",
   intro:"Hi! I'm Location Lillie 📍 Here's what I can do:\n\n1️⃣ **Location Decks** — Build decks with photos, addresses & permit info\n2️⃣ **Recce Reports** — Document site visits with power, safety & access details\n3️⃣ **Review & Share** — Compare options & prepare polished decks for clients\n\nFirst, which project should I work on?"},
  {id:"perry",name:"Post Producer Perry",title:"Post-Production",emoji:"🎞️",color:_PEACH,border:"#c08060",accent:"#7a4020",bg:"#fff8f3",textColor:"#3d1a08",tagBg:"#f8dcc8",Blob:_Perry,
   system:PERRY_SYSTEM,
   placeholder:"Add post-production details...",
   intro:"Hi! I'm Post Producer Perry 🎞️ Here's what I can do:\n\n1️⃣ **Deliverables & Specs** — Define formats, resolutions & naming conventions\n2️⃣ **Post Schedule** — Timelines for edit, colour, sound & delivery milestones\n3️⃣ **Review & Feedback** — Manage client review rounds & track amends\n\nFirst, which project should I work on?"},
];
