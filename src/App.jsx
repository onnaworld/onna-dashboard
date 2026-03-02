import { useState, useMemo, useEffect } from "react";

// ─── API ──────────────────────────────────────────────────────────────────────
const API = "https://onna-backend-v2.vercel.app";
const API_SECRET = import.meta.env.VITE_API_SECRET || "";
const getToken = () => localStorage.getItem("onna_token") || "";
const _h = (extra={}) => ({"X-API-Secret":API_SECRET,"Authorization":`Bearer ${getToken()}`,...extra});
const _guard = r => { if(r.status===401){localStorage.removeItem("onna_token");window.location.reload();} return r.json(); };
const api = {
  get:    (path)       => fetch(`${API}${path}`,{headers:_h()}).then(_guard),
  post:   (path, body) => fetch(`${API}${path}`,{method:"POST",  headers:_h({"Content-Type":"application/json"}),body:JSON.stringify(body)}).then(_guard),
  put:    (path, body) => fetch(`${API}${path}`,{method:"PUT",   headers:_h({"Content-Type":"application/json"}),body:JSON.stringify(body)}).then(_guard),
  delete: (path)       => fetch(`${API}${path}`,{method:"DELETE",headers:_h()}).then(_guard),
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const LEAD_CATEGORIES = ["All","Production Companies","Creative Agencies","Beauty & Fragrance","Jewellery & Watches","Fashion","Editorial","Sports","Hospitality","Market Research","Commercial"];
const VENDORS_CATEGORIES = ["Locations","Hair and Makeup","Stylists","Casting","Catering","Set Design","Equipment","Crew","Production"];
const BB_LOCATIONS = ["All","Dubai, UAE","London, UK","New York, US","Los Angeles, US"];
const OUTREACH_STATUSES = ["not_contacted","cold","warm","open","client"];
const OUTREACH_STATUS_LABELS = {not_contacted:"Not Contacted",cold:"Cold",warm:"Warm",open:"Open",client:"Client"};
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PROJECT_SECTIONS = ["Home","Finances","Creative Brief","Estimates","Contracts","Quotes","Locations","Casting","Permits","Styling","Call Sheet","Risk Assessment","Workbook"];
const CONTRACT_TYPES = ["Commissioning Agreement – Self Employed","Commissioning Agreement – Via PSC","Talent Agreement","Talent Agreement – Via PSC"];

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:       "#f5f5f7",
  surface:  "#ffffff",
  border:   "#d2d2d7",
  borderSub:"#e8e8ed",
  text:     "#1d1d1f",
  sub:      "#6e6e73",
  muted:    "#aeaeb2",
  accent:   "#1d1d1f",
  link:     "#0066cc",
  inBg:     "#f0faf4", inColor:"#1a7f37",
  outBg:    "#fff3f0", outColor:"#c0392b",
};

// ─── STATIC SEED DATA (used as fallback until API loads) ─────────────────────
const SEED_LEADS = []; // populated from DB on load
const SEED_CLIENTS = [
];
const SEED_PROJECTS = [
  {id:1, client:"Columbia / IMA", name:"Ramadan Activation 2026", revenue:196507, cost:160000, status:"Active",    year:2026},
  {id:2, client:"Pulse Fitness",  name:"Social Media Campaign",   revenue:9400,   cost:4100,   status:"Active",    year:2026},
  {id:3, client:"Meridian Group", name:"Website Redesign",        revenue:31000,  cost:17500,  status:"Completed", year:2025},
  {id:4, client:"Apex Media",     name:"SEO Strategy",            revenue:8500,   cost:3200,   status:"Active",    year:2026},
  {id:5, client:"Ironclad Legal", name:"Content Suite",           revenue:18500,  cost:7400,   status:"In Review", year:2025},
  {id:6, client:"GreenPath",      name:"Launch Campaign",         revenue:3100,   cost:1800,   status:"Active",    year:2025},
  {id:7, client:"Meridian Group", name:"Brand Strategy",          revenue:14000,  cost:6200,   status:"Completed", year:2024},
  {id:8, client:"Nova Tech",      name:"Ad Campaign Q4",          revenue:11000,  cost:4800,   status:"Completed", year:2024},
];
const initVendors = [{"id":1,"name":"Alva East/West/Coachworks","category":"Locations","email":"info@alvastudios.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":2,"name":"Big Sky","category":"Locations","email":"them@bigskylondon.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":3,"name":"Black Island","category":"Locations","email":"info@islandstudios.net","phone":"44 020 8956 5600","website":"islandstudios.net/black-island","location":"London, UK","notes":"","rateCard":""},{"id":4,"name":"Malcolm Ryan","category":"Locations","email":"info@mrstudios.co.uk","phone":"44 020 8947 4766","website":"mrstudios.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":5,"name":"Park Royal","category":"Locations","email":"info@parkroyalstudios.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":6,"name":"Lock Studios","category":"Locations","email":"","phone":"","website":"www.lockstudios.co.uk/studios","location":"London, UK","notes":"","rateCard":""},{"id":7,"name":"Gas Works Studio","category":"Locations","email":"studio@gasph.com","phone":"","website":"gasph.com/studio_1","location":"London, UK","notes":"","rateCard":""},{"id":8,"name":"Jet Studios","category":"Locations","email":"zoe@jetstudios.co.uk","phone":"44 020 7731 1111","website":"www.jetstudios.co.uk/studio-1","location":"London, UK","notes":"","rateCard":""},{"id":9,"name":"The Yards Studio","category":"Locations","email":"BOOKINGS@THEYARDS.STUDIO","phone":"","website":"www.theyards.studio","location":"London, UK","notes":"","rateCard":""},{"id":10,"name":"Park Village","category":"Locations","email":"hello@parkvillage.co.uk","phone":"44 (0) 207 387 8077","website":"parkvillage.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":11,"name":"The Vale Studios","category":"Locations","email":"info@thevalestudios.com","phone":"","website":"thevalestudios.com","location":"London, UK","notes":"","rateCard":""},{"id":12,"name":"Spring Studios","category":"Locations","email":"londonstudios@springstudios.com","phone":"","website":"","location":"London, UK","notes":"EQ Prolighting / Catering Noco","rateCard":""},{"id":13,"name":"3 Mills","category":"Locations","email":"bookings@3mills.com","phone":"","website":"3mills.com","location":"London, UK","notes":"","rateCard":""},{"id":14,"name":"London Film Studios","category":"Locations","email":"bookings@londonfilmstudios.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":15,"name":"MR Studios","category":"Locations","email":"info@mrstudios.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":16,"name":"Shannon Studios","category":"Locations","email":"raph@shannonstudios.co.uk","phone":"","website":"www.shannonstudios.co.uk","location":"London, UK","notes":"Offers Equipment. Book Online, no insurance or account","rateCard":""},{"id":17,"name":"AW Studios","category":"Locations","email":"info@assistingwork.com","phone":"","website":"assistingwork.com/studio","location":"London, UK","notes":"","rateCard":""},{"id":18,"name":"Studio Monde","category":"Locations","email":"","phone":"44 020 8956 5600","website":"","location":"London, UK","notes":"","rateCard":""},{"id":19,"name":"South56 Studio","category":"Locations","email":"south56studio@gmail.com","phone":"44 020 8947 4766","website":"","location":"London, UK","notes":"300 editorial / 550 commercial - 10hr","rateCard":""},{"id":20,"name":"Silvertown","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":21,"name":"Mars Volume","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":22,"name":"Garden Studio","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":23,"name":"Arii","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":24,"name":"Pintsized Studios","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":25,"name":"Dneg","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":26,"name":"LC Locations","category":"Locations","email":"Hello@LClocations.co.uk","phone":"","website":"www.instagram.com/lclocations_","location":"London, UK","notes":"","rateCard":""},{"id":27,"name":"The Location Guys","category":"Locations","email":"hello@thelocationguys.co.uk","phone":"0207 099 8000","website":"www.thelocationguys.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":28,"name":"Location Partnership","category":"Locations","email":"info@locationpartnership.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":29,"name":"Location Works","category":"Locations","email":"sian@locationworks.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":30,"name":"1st Option","category":"Locations","email":"naomi@1st-option.com","phone":"020 7284 2345","website":"www.1st-option.com","location":"London, UK","notes":"","rateCard":""},{"id":31,"name":"JJ Media","category":"Locations","email":"cate@jjmedia.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":32,"name":"Fresh Locations","category":"Locations","email":"vicky@freshlocations.com","phone":"","website":"www.freshlocations.com","location":"London, UK","notes":"","rateCard":""},{"id":33,"name":"Airspace Locations","category":"Locations","email":"Sam Mosedale <sam@airspacelocations.co.uk>","phone":"0207 607 2202","website":"www.airspacelocations.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":34,"name":"Shoot Factory","category":"Locations","email":"info@shootfactory.co.uk","phone":"0207 252 3900","website":"www.shootfactory.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":35,"name":"Amazing Space","category":"Locations","email":"","phone":"020 7251 6661","website":"","location":"London, UK","notes":"","rateCard":""},{"id":36,"name":"Location HQ","category":"Locations","email":"Info <info@locationhq.co.uk>","phone":"","website":"www.locationhq.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":37,"name":"Lavish Locations","category":"Locations","email":"support@lavishlocations.zendesk.com","phone":"03337 007 007","website":"lavishlocations.com","location":"London, UK","notes":"","rateCard":""},{"id":38,"name":"Enso Studios","category":"Locations","email":"bookings@ensostudios.ae","phone":"","website":"www.ensostudios.ae","location":"Dubai, UAE","notes":"Daylight and rig","rateCard":""},{"id":39,"name":"Action Filmz","category":"Locations","email":"hello@actionfilmz.com","phone":"","website":"actionfilmz.com/studio","location":"Dubai, UAE","notes":"","rateCard":""},{"id":40,"name":"Hot Cold Studios","category":"Locations","email":"info@hotcoldstudio.com","phone":"","website":"hotcoldrental.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":41,"name":"ABOC Studios","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":42,"name":"Lighthouse Studios","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":43,"name":"Stellar Studios","category":"Locations","email":"info@thestellarstudios.com","phone":"","website":"thestellarstudios.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":44,"name":"Mulan Studio","category":"Locations","email":"","phone":"","website":"www.instagram.com/mulan.studio","location":"Dubai, UAE","notes":"","rateCard":""},{"id":45,"name":"Bickiboss studios","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":46,"name":"Heenat Salma, Qatar","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":47,"name":"E","category":"Locations","email":"michael@goshaburo.com / hello@goshaburo.com","phone":"","website":"www.instagram.com/skooni_/?hl=en","location":"Dubai, UAE","notes":"","rateCard":""},{"id":48,"name":"Siro Hotel","category":"Locations","email":"ivan.raykov@sirohotels.com / Patricia","phone":"","website":"","location":"Dubai, UAE","notes":"Camilia Ali Mourad Majdoub","rateCard":""},{"id":49,"name":"One & Only Zaabeel","category":"Locations","email":"camilia.majdoub@oneandonlyonezaabeel.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":50,"name":"Leila Heller Art Gallery","category":"Locations","email":"shanti@leilahellergallery.com","phone":"","website":"","location":"Dubai, UAE","notes":"AlSerkal Avenue, Al Quoz Ind Area 1, Dubai - UAE","rateCard":""},{"id":51,"name":"The Third Line","category":"Locations","email":"gabby@thethirdline.com","phone":"","website":"www.thethirdline.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":52,"name":"Custot Gallery Dubai","category":"Locations","email":"rayan@custot.ae","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":53,"name":"Collectional","category":"Locations","email":"Iman.n@thecollectional.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":54,"name":"Volte Art Projects","category":"Locations","email":"ea@volte.art","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":55,"name":"H Residence by Huna","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":56,"name":"Banyan Tree Blue waters","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":57,"name":"House of Wisdom","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":58,"name":"Koa Canvas","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":59,"name":"The Green Planet Dubai","category":"Locations","email":"info@thegreenplanetdubai.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":60,"name":"The Shadow House Abu Dhabi","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":61,"name":"The Farm, Albarari","category":"Locations","email":"events@thefarmdubai.ae","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":62,"name":"Emirates Palace MO, Abu Dhabi","category":"Locations","email":"moauh-reservations@mohg.com / XLi1@mohg.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":63,"name":"Emerald Palace Kempinski, Raffles, Palm Jumeirah, Dubai","category":"Locations","email":"Giuliana.GIARDINA@raffles.com","phone":"","website":"","location":"Dubai, UAE","notes":"GIARDINA Giuliana","rateCard":""},{"id":64,"name":"Burj Al Arab, Dubai","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":65,"name":"Melia Desert Palm, Dubai","category":"Locations","email":"sales.dp@melia.com / rochana.ndlovu@melia.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":66,"name":"Al Faya Lodge by Misk","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":67,"name":"Al Serkal","category":"Locations","email":"gautami@alserkal.online","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":68,"name":"Kite Beach Center UAQ","category":"Locations","email":"hello@kitesurfbeachcenter.ae","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":69,"name":"Bab Al Shams Resort, Dubai","category":"Locations","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":70,"name":"Flamingo Beach Resort","category":"Locations","email":"ali@flamingoresortuae.com","phone":"","website":"","location":"Dubai, UAE","notes":"Ali Salamah","rateCard":""},{"id":71,"name":"Nikki Beach","category":"Locations","email":"elmra.gazizova@nikkibeachhotels.com","phone":"971 52 678 7145","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":72,"name":"Aura Sky Pool","category":"Locations","email":"auraevents@auraskypool.com","phone":"971 52 755 4994","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":73,"name":"Filming Locations","category":"Locations","email":"","phone":"971 52 921 2184","website":"filminglocations.io","location":"Dubai, UAE","notes":"","rateCard":""},{"id":74,"name":"Go Studios","category":"Locations","email":"info@go-studios.com","phone":"212 290 1120","website":"gostudios.nyc","location":"London, UK","notes":"New York","rateCard":""},{"id":75,"name":"Quixote","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":76,"name":"Milk Studios","category":"Locations","email":"","phone":"","website":"","location":"London, UK","notes":"New York / LA","rateCard":""},{"id":77,"name":"Location Department","category":"Locations","email":"John Householder <john@locationdepartment.net>","phone":"212 463 7218","website":"www.locationdepartment.net","location":"London, UK","notes":"New York","rateCard":""},{"id":78,"name":"Natalie Shafii","category":"Hair and Makeup","email":"natalieshafii@gmail.com","phone":"","website":"","location":"London, UK","notes":"Unsigned · Hair","rateCard":""},{"id":79,"name":"Lou Box","category":"Hair and Makeup","email":"lou@loubox.co.uk","phone":"","website":"","location":"London, UK","notes":"MUA","rateCard":""},{"id":80,"name":"Rachel Singer Clark","category":"Hair and Makeup","email":"","phone":"","website":"","location":"London, UK","notes":"The Only Agency · MUA","rateCard":""},{"id":81,"name":"Chad Maxwell","category":"Hair and Makeup","email":"cmaxwellhair@gmail.com","phone":"","website":"","location":"London, UK","notes":"Stella Creative Artists · Hair","rateCard":""},{"id":82,"name":"Jaz Lanyero","category":"Hair and Makeup","email":"abitofjaz@gmail.com","phone":"","website":"","location":"London, UK","notes":"Unsigned · Hair","rateCard":""},{"id":83,"name":"Lydia Ward Smith","category":"Hair and Makeup","email":"info@lydiawardsmith.com","phone":"","website":"","location":"London, UK","notes":"Unsigned · MUA","rateCard":""},{"id":84,"name":"Vic Bond","category":"Hair and Makeup","email":"victoria_bond@live.co.uk","phone":"","website":"","location":"London, UK","notes":"Unsigned · MUA","rateCard":""},{"id":85,"name":"Randolph Gray","category":"Hair and Makeup","email":"Gary Lathrope <gary@garyrepresents.com>","phone":"","website":"","location":"London, UK","notes":"Gary Represents · Hair - Afro","rateCard":""},{"id":86,"name":"Sarah Jo Palmer","category":"Hair and Makeup","email":"lucy@maworldgroup.com","phone":"","website":"","location":"London, UK","notes":"Hair","rateCard":""},{"id":87,"name":"Siddharta Simone","category":"Hair and Makeup","email":"charlotte@streeters.com","phone":"","website":"","location":"London, UK","notes":"MUA","rateCard":""},{"id":88,"name":"A-frame agency","category":"Hair and Makeup","email":"shanti@a-framagency.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":89,"name":"Caren Agency","category":"Hair and Makeup","email":"caren@caren.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":90,"name":"Helena Narra","category":"Hair and Makeup","email":"","phone":"","website":"www.instagram.com/helenanarra","location":"Dubai, UAE","notes":"","rateCard":""},{"id":91,"name":"Kasia Domanska","category":"Hair and Makeup","email":"","phone":"","website":"www.instagram.com/kasia.domanska.makeup","location":"Dubai, UAE","notes":"","rateCard":""},{"id":92,"name":"Ivan Kuz","category":"Hair and Makeup","email":"kyzipe@gmail.com","phone":"971 50 505 1811","website":"www.instagram.com/lvan_kuz","location":"Dubai, UAE","notes":"2k · Hair but does both","rateCard":""},{"id":93,"name":"Mauro D. Hernan repped by MMG","category":"Hair and Makeup","email":"nouna@mmgartists.com","phone":"971 58 954 4698","website":"www.instagram.com/maurodhernanmakeup","location":"Dubai, UAE","notes":"2.5k · Makeup but does both","rateCard":""},{"id":94,"name":"Julia Rada","category":"Hair and Makeup","email":"juliaradaart@gmail.com","phone":"971 58 596 4807","website":"","location":"Dubai, UAE","notes":"3k · Make Up (3k Campaign Only)","rateCard":""},{"id":95,"name":"Sophie Leach","category":"Hair and Makeup","email":"sophie@sophieleach.com","phone":"","website":"www.sophieleach.com","location":"Dubai, UAE","notes":"Make Up or both (BAU / Campaign via Michelle Hay)","rateCard":""},{"id":96,"name":"Kavya Rajpowell","category":"Hair and Makeup","email":"contact@kavyarajpowell.com","phone":"","website":"","location":"Dubai, UAE","notes":"MUAH","rateCard":""},{"id":97,"name":"Mabys","category":"Hair and Makeup","email":"mabs.khakwani@gmail.com","phone":"","website":"","location":"Dubai, UAE","notes":"@mabys_art · MUA","rateCard":""},{"id":98,"name":"Manu Iosada","category":"Hair and Makeup","email":"","phone":"971 50 105 1959","website":"","location":"Dubai, UAE","notes":"expensive - 6k","rateCard":""},{"id":99,"name":"Betty Bee","category":"Hair and Makeup","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":100,"name":"Jessica Ortiz","category":"Hair and Makeup","email":"Katie Ward <katie@kalpana.us>","phone":"","website":"","location":"London, UK","notes":"Kalpana · MUA - New York","rateCard":""},{"id":101,"name":"Levi Monarch","category":"Hair and Makeup","email":"Leslie Kramer <info@kramerkramer.com>","phone":"","website":"","location":"London, UK","notes":"Kramer + Kramer · Hair - New York","rateCard":""},{"id":102,"name":"Marco Castro","category":"Hair and Makeup","email":"alec@born-artists.com","phone":"917 972 9800","website":"","location":"London, UK","notes":"Born Artists · MUA - New York","rateCard":""},{"id":103,"name":"Matthew Sky","category":"Hair and Makeup","email":"Melinda Barnes <melindab@nextmodels.com>","phone":"","website":"","location":"London, UK","notes":"Next Management · Grooming - LA","rateCard":""},{"id":104,"name":"Harris Elliott","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":105,"name":"Sophie Watson","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":106,"name":"Otter Hatchett","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":107,"name":"Oli Arnold","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":108,"name":"Charlie Schneider","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":109,"name":"Sofia Lazzari","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":110,"name":"Anisa Aour","category":"Stylists","email":"emily@chapmanburrell.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":111,"name":"Mac Heulster","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":112,"name":"Fernando Pichardo","category":"Stylists","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":113,"name":"Jade Chilton","category":"Stylists","email":"JadeLchilton@gmail.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":114,"name":"Jennifer Kolombo","category":"Stylists","email":"","phone":"","website":"www.instagram.com/bambikoko/?hl=en","location":"Dubai, UAE","notes":"","rateCard":""},{"id":115,"name":"Kate Hazell","category":"Stylists","email":"","phone":"","website":"www.kate-hazell.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":116,"name":"Marilla Rizzi","category":"Stylists","email":"visual@marillarizzi.com","phone":"","website":"www.marillarizzi.com","location":"Dubai, UAE","notes":"https://www.instagram.com/marilla_meryl/","rateCard":""},{"id":117,"name":"Vasil Bhozilov","category":"Stylists","email":"vasilbozhilov@gmail.com","phone":"","website":"www.instagram.com/vasilbozhilov","location":"Dubai, UAE","notes":"","rateCard":""},{"id":118,"name":"Gorkaya Natasha","category":"Stylists","email":"gogorkaya.n@gmail.com","phone":"","website":"www.instagram.com/vasilbozhilov","location":"Dubai, UAE","notes":"","rateCard":""},{"id":119,"name":"Charlotte White","category":"Stylists","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":120,"name":"Laura Jane Brown","category":"Stylists","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":121,"name":"Bellal Hassan","category":"Stylists","email":"","phone":"","website":"www.instagram.com/bbelalbebo/?hl=en","location":"London, UK","notes":"Cairo, Egypt","rateCard":""},{"id":122,"name":"IMG","category":"Casting","email":"Andrew.Garratt@img.com","phone":"44 (0) 7540 704276","website":"","location":"London, UK","notes":"","rateCard":""},{"id":123,"name":"PRM","category":"Casting","email":"sophie@prm-agency.com","phone":"44 (0) 7444 214 470","website":"","location":"London, UK","notes":"","rateCard":""},{"id":124,"name":"W Model","category":"Casting","email":"charlotte@wmodel.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":125,"name":"Whilhelmina","category":"Casting","email":"whitney.harrison@wilhelmina.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":126,"name":"Anti Agency","category":"Casting","email":"charlotte@antiagency.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":127,"name":"Evolve Model","category":"Casting","email":"elizabeth@evolvemodel.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":128,"name":"Models 1","category":"Casting","email":"alice@models1.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":129,"name":"Supa","category":"Casting","email":"ro@supamodelmanagement.com","phone":"44 (0) 207 4904 441","website":"","location":"London, UK","notes":"","rateCard":""},{"id":130,"name":"Body London","category":"Casting","email":"gemmah@bodylondon.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":131,"name":"Elite","category":"Casting","email":"s.delbanco@elitemodel.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":132,"name":"Select","category":"Casting","email":"nina@selectmodel.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":133,"name":"Storm","category":"Casting","email":"Charlotte@stormmanagement.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":134,"name":"Milk","category":"Casting","email":"kitty@milkmanagement.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":135,"name":"Premier","category":"Casting","email":"patrick@premiermodelmanagement.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":136,"name":"The Squad","category":"Casting","email":"Adam@thesquadmanagement.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":137,"name":"Next","category":"Casting","email":"Sarahv@nextmodels.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":138,"name":"Riches MGMT","category":"Casting","email":"philip@richesmgmt.com","phone":"31 (0) 616 763 544","website":"","location":"London, UK","notes":"","rateCard":""},{"id":139,"name":"Chapter MGMT","category":"Casting","email":"katies@chaptermgmt.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":140,"name":"Linden Staub","category":"Casting","email":"Becki Wilson <becki@lindenstaub.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":141,"name":"Boss","category":"Casting","email":"russell@Bossmodels.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":142,"name":"Established","category":"Casting","email":"emily@establishedmodels.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":143,"name":"Perspective","category":"Casting","email":"billie@perspectivemanagement.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":144,"name":"Menace Models","category":"Casting","email":"assistant@menacemodels.co.uk","phone":"","website":"www.menacemodels.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":145,"name":"Viva London","category":"Casting","email":"natalie.hand@viva-london.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":146,"name":"Nevs","category":"Casting","email":"shaun@nevsnation.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":147,"name":"Sandra Reynolds","category":"Casting","email":"jemimamason@sandrareynolds.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":148,"name":"Nevs - Steven","category":"Casting","email":"steven@nevs.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":149,"name":"Models 1 - New Face","category":"Casting","email":"Georgia Lia - g.lia@models1.co.uk / Milena - milena@models1.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":150,"name":"Models 1 - Image","category":"Casting","email":"jordan@models1.co.uk / gemma@models1.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":151,"name":"IMG London","category":"Casting","email":"Anna Masters <anna.masters@img.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":152,"name":"Supa","category":"Casting","email":"Tim@supamodelmanagement.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":153,"name":"FORD Models","category":"Casting","email":"crucker@fordmodels.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":154,"name":"VISION LA - Womens","category":"Casting","email":"Rhiannon Webb <rhiannon@VisionLosAngeles.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":155,"name":"VISION LA - Mens","category":"Casting","email":"Marco Servetti <marco@VisionLosAngeles.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":156,"name":"The Society NYC","category":"Casting","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":157,"name":"Photogenics","category":"Casting","email":"Alexis Renson <Alexis@photogenicsmedia.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":158,"name":"The Dragonfly Agency","category":"Casting","email":"Stasia Langford <stasia@thedragonflyagency.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":159,"name":"Whilhelmina","category":"Casting","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":160,"name":"Whilhelmina - NYC - Womens","category":"Casting","email":"jason.sobe@wilhelmina.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":161,"name":"Motion MGMT","category":"Casting","email":"alyona@motion-models.com and maria@motion-models.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":162,"name":"Michelle Hay Management","category":"Casting","email":"hello@michellehaymanagement.com","phone":"","website":"www.michellehaymanagement.com","location":"Dubai, UAE","notes":"Will cast for INTL models","rateCard":""},{"id":163,"name":"Fashion League UAE","category":"Casting","email":"leila@fashionleague.ae","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":164,"name":"MMG","category":"Casting","email":"faith@mmgmodels.com / shivangi@mmgmodels.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":165,"name":"JEEL Management","category":"Casting","email":"BOOKER - JEEL MGMT <booker@jeelmanagement.com>","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":166,"name":"MLN Model","category":"Casting","email":"info@mlnmodel.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":167,"name":"TAL Cmm","category":"Casting","email":"ingrid@talcmm.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":168,"name":"Nondescript Studios","category":"Casting","email":"bookings@nondescriptstudios.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":169,"name":"ANT Management","category":"Casting","email":"anita@antmgmt.com / Petrenne@antmgmt.com","phone":"","website":"www.antmgmt.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":170,"name":"Art Factory Studio","category":"Casting","email":"booking@artfactorystudio.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":171,"name":"Bareface Agency","category":"Casting","email":"hello@bareface.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":172,"name":"NDS Models","category":"Casting","email":"bookings@ndsmodels.com\nkim@ndsmodels.com\nleila@ndsmodels.com","phone":"","website":"ndsmodels.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":173,"name":"AVANT Agency ME","category":"Casting","email":"Liza Gorevalova <liza.g@avantmodels.agency>","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":174,"name":"Le Management","category":"Casting","email":"info@lemanagement.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":175,"name":"Nelson Model","category":"Casting","email":"leonard@nelsonmodel.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":176,"name":"Citizen","category":"Casting","email":"diego@city-models.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":177,"name":"Uno","category":"Casting","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":178,"name":"City Models","category":"Casting","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":179,"name":"Viva Models","category":"Casting","email":"Anna Masters <anna.masters@img.com>","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":180,"name":"Pique food","category":"Catering","email":"orders@piquefood.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":181,"name":"N5 Kitchen","category":"Catering","email":"suzie@n5kitchen.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":182,"name":"Zaras Kitchen","category":"Catering","email":"zara@zaraskitchen.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":183,"name":"Kate The Cook","category":"Catering","email":"kate@katethecook.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":184,"name":"Grays Inn Kitchen","category":"Catering","email":"graysinnkitchen@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":185,"name":"Tart London","category":"Catering","email":"jemima@tart-london.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":186,"name":"Clove London","category":"Catering","email":"feedme@clovelondon.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":187,"name":"Eden Caterers","category":"Catering","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":188,"name":"Pear drop london","category":"Catering","email":"lisa@peardroplondon.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":189,"name":"Bread and Honey","category":"Catering","email":"bookings@breadandhoney.net","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":190,"name":"Wolf & Lamb","category":"Catering","email":"hello@wolfandlamb.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":191,"name":"Marmelo Kitchen","category":"Catering","email":"catering@marmelokitchen.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":192,"name":"Luluz Catering","category":"Catering","email":"info@luluzcatering.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":193,"name":"Elevate Cater","category":"Catering","email":"jessey@elevatecaternyc.com","phone":"","website":"","location":"London, UK","notes":"New York","rateCard":""},{"id":194,"name":"The Chefs Agency","category":"Catering","email":"contact@thechefsagency.com","phone":"","website":"","location":"London, UK","notes":"New York","rateCard":""},{"id":195,"name":"Dishful Catering","category":"Catering","email":"info@dishfulcatering.com","phone":"","website":"","location":"London, UK","notes":"New York","rateCard":""},{"id":196,"name":"Haute Chefs","category":"Catering","email":"","phone":"","website":"hautechefsla.com","location":"London, UK","notes":"LA","rateCard":""},{"id":197,"name":"Kitchen Mouse","category":"Catering","email":"catering@kitchenmousela.com","phone":"","website":"www.kitchenmousela.com","location":"London, UK","notes":"LA","rateCard":""},{"id":198,"name":"One Life","category":"Catering","email":"","phone":"","website":"www.onelifedxb.com/catering/light-lunch","location":"Dubai, UAE","notes":"","rateCard":""},{"id":199,"name":"Taste Studio Catering","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"130 pp","rateCard":""},{"id":200,"name":"Ghon Catering","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":201,"name":"Cafe Nero","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":202,"name":"Elements Catering","category":"Catering","email":"","phone":"","website":"www.elements.catering","location":"Dubai, UAE","notes":"","rateCard":""},{"id":203,"name":"Pinch Catering","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":204,"name":"Blended Catering","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":205,"name":"Ogart Catering","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":206,"name":"Avec Events","category":"Catering","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":207,"name":"Relish Catering","category":"Catering","email":"Calvin Pinto <calvin@convoy-films.com>","phone":"","website":"","location":"Dubai, UAE","notes":"135 pp","rateCard":""},{"id":208,"name":"Zan Morley","category":"Set Design","email":"zanmorleystylist@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":209,"name":"Scott Kennedy","category":"Set Design","email":"sc0ttkennedy@hotmail.co.uk","phone":"44 (0) 7909 878 119","website":"","location":"London, UK","notes":"","rateCard":""},{"id":210,"name":"Johanna Currie","category":"Set Design","email":"johanna.currie@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":211,"name":"Bryony Edwards","category":"Set Design","email":"bryony@bryonyedwards.com","phone":"44 (0) 7800 796 051","website":"www.bryonyedwards.com","location":"London, UK","notes":"","rateCard":""},{"id":212,"name":"Sarianne Plaisant","category":"Set Design","email":"sarianneplaisant@gmail.com","phone":"44 (0) 7854 413305","website":"sarianneplaisant.com","location":"London, UK","notes":"","rateCard":""},{"id":213,"name":"Lizzie Jeffries","category":"Set Design","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":214,"name":"Laura Timmons","category":"Set Design","email":"laura.timmons@icloud.com","phone":"44 (0) 7716237772","website":"","location":"London, UK","notes":"","rateCard":""},{"id":215,"name":"Grace Becker Burnett","category":"Set Design","email":"gracebeckerburn@gmail.com","phone":"44 (0) 7393323469","website":"","location":"London, UK","notes":"","rateCard":""},{"id":216,"name":"Libby Keizer","category":"Set Design","email":"keizershalom@gmail.com","phone":"7565542036","website":"","location":"London, UK","notes":"","rateCard":""},{"id":217,"name":"Katia Hall","category":"Set Design","email":"katia@bryonyedwards.com","phone":"07789 936 486","website":"","location":"London, UK","notes":"","rateCard":""},{"id":218,"name":"Granger Hertzog","category":"Set Design","email":"harriet@grangerhertzog.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":219,"name":"Modern Classic Prop Hire","category":"Set Design","email":"modern@classicprophire.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":220,"name":"Classic Prop Hire","category":"Set Design","email":"tommy.hurton@classicprophire.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":221,"name":"Theme Traders","category":"Set Design","email":"tommy.hurton@classicprophire.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":222,"name":"Hapaca","category":"Set Design","email":"office@hapacastudio.com","phone":"44 (0) 203 397 2757","website":"hapacastudio.com/rental-backdrops","location":"London, UK","notes":"To Rent","rateCard":""},{"id":223,"name":"AJ's","category":"Set Design","email":"info@aj-s.co.uk","phone":"44 (0) 1749 813 044","website":"aj-s.co.uk/collections/backgrounds","location":"London, UK","notes":"To Buy","rateCard":""},{"id":224,"name":"Hapaca","category":"Set Design","email":"office@hapacastudio.com","phone":"44 (0) 203 397 2757","website":"hapacastudio.com/rental-backdrops","location":"London, UK","notes":"To Rent","rateCard":""},{"id":225,"name":"AJ's","category":"Set Design","email":"info@aj-s.co.uk","phone":"44 (0) 1749 813 044","website":"aj-s.co.uk/collections/backgrounds","location":"London, UK","notes":"To Buy","rateCard":""},{"id":226,"name":"Bryan Porter / BG Porter","category":"Set Design","email":"porter@owlandtheelephant.com","phone":"","website":"www.porterhandmade.com/contact","location":"London, UK","notes":"LA","rateCard":""},{"id":227,"name":"WANENMACHER Studios","category":"Set Design","email":"tamara@aterliermanagement.com","phone":"","website":"","location":"London, UK","notes":"LA - rep by Atelier MGMT","rateCard":""},{"id":228,"name":"Oliphant","category":"Set Design","email":"rentals@ostudio.com","phone":"","website":"oliphantstudio.com","location":"London, UK","notes":"New York / LA","rateCard":""},{"id":229,"name":"Katrine Hanna Set Designer","category":"Set Design","email":"katrine@katrinehanna.com","phone":"44 7951 051 558","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":230,"name":"KITAVIN Studio - Dmitri","category":"Set Design","email":"info@kitavin.com","phone":"","website":"www.instagram.com/kitavin.studio","location":"Dubai, UAE","notes":"","rateCard":""},{"id":231,"name":"The Creativ Club - Ximena sabatini","category":"Set Design","email":"ximena@thecreativclub.com","phone":"","website":"www.instagram.com/thecreativclub","location":"Dubai, UAE","notes":"2.5 AED full day onset styling\n1.8 AED half day onset styling\n2 AED prep full day \n1.5 AED prep half day","rateCard":""},{"id":232,"name":"Yehia Bedeir","category":"Set Design","email":"y.bedier@live.com","phone":"","website":"www.instagram.com/yehiabedier","location":"Dubai, UAE","notes":"","rateCard":""},{"id":233,"name":"Nour Choukeir","category":"Set Design","email":"nourchoukeir0@gmail.com","phone":"971 58 505 2640","website":"","location":"Dubai, UAE","notes":"Set Designer: AED 3,000 (prep) / AED 7,000 (shoot day)\nProps Master: AED 1,500 (prep) / AED 1,800 (shoot day)\nArt Assistant: AED 500 (prep) / AED 800 (shoot day)\nOn-Set Helper: AED 500 (shoot day)\nTruck Rental: AED 800 per day","rateCard":""},{"id":234,"name":"Duette - Fuad Ali","category":"Set Design","email":"info@duettestudio.com","phone":"971 52 849 1994","website":"","location":"Dubai, UAE","notes":"duette_studio","rateCard":""},{"id":235,"name":"Ayesha Riaz","category":"Set Design","email":"ayesha@cash--bar.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":236,"name":"Lauren Haslam","category":"Set Design","email":"lauren@laurenhaslam.com","phone":"971 50 456 6351","website":"","location":"Dubai, UAE","notes":"3000 AED prep/shoot","rateCard":""},{"id":237,"name":"Gosha","category":"Set Design","email":"","phone":"","website":"goshaflowers.com","location":"Dubai, UAE","notes":"Flowers","rateCard":""},{"id":238,"name":"Airwerks Studio","category":"Set Design","email":"","phone":"","website":"airwerksstudios.com","location":"Dubai, UAE","notes":"Vintage Cars","rateCard":""},{"id":239,"name":"Gas","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":240,"name":"Pro Lighting","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":241,"name":"Direct Digital","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":242,"name":"Hawk","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":243,"name":"Civilised","category":"Equipment","email":"operations@londoncarhire.com","phone":"44 (0) 207 738 7788","website":"londoncarhire.com","location":"London, UK","notes":"","rateCard":""},{"id":244,"name":"Driver - Sacha - Civilised","category":"Equipment","email":"sachaobodai@live.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":245,"name":"Milk Studios","category":"Equipment","email":"equipment-ny@milkstudios.com","phone":"212 645 2797","website":"www.milkstudios.com","location":"London, UK","notes":"New York","rateCard":""},{"id":246,"name":"Vivid Kid","category":"Equipment","email":"mjdidyoung@me.com","phone":"205 886 6656","website":"www.vividkid.com","location":"London, UK","notes":"New York","rateCard":""},{"id":247,"name":"Quixote","category":"Equipment","email":"NYPS@Quixote.com","phone":"347 448 8414","website":"quixote.com","location":"London, UK","notes":"New York","rateCard":""},{"id":248,"name":"Blacklane","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":249,"name":"Lightspeed","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":250,"name":"Blacklane","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":251,"name":"Lightspeed","category":"Equipment","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":252,"name":"Dubai Film","category":"Equipment","email":"contact@dubaifilm.ae","phone":"971 50 481 4509","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":253,"name":"Hot Cold Studio","category":"Equipment","email":"frankie@hotcoldstudio.com","phone":"","website":"www.hotcoldstudio.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":254,"name":"Pro Angles Media","category":"Equipment","email":"info@proanglesmedia.com","phone":"971 526 722 009","website":"www.proanglesmedia.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":255,"name":"Action Filmz","category":"Equipment","email":"","phone":"971 56 403 2761","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":256,"name":"Al Walid Equipment Rental","category":"Equipment","email":"walidequipment@gmail.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":257,"name":"Cinegear","category":"Equipment","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":258,"name":"The Global Limo","category":"Equipment","email":"info@thegloballimo.com","phone":"971 50 547 0868","website":"","location":"Dubai, UAE","notes":"Good for airport pick ups, luxury cars","rateCard":""},{"id":259,"name":"Fajr Al Noor Tourism","category":"Equipment","email":"info@busrentalindubai.com","phone":"971 55 451 9169","website":"","location":"Dubai, UAE","notes":"Good for cheap van 700 / 10 hours","rateCard":""},{"id":260,"name":"Wajid","category":"Equipment","email":"","phone":"971 55 948 0546","website":"","location":"Dubai, UAE","notes":"Good driver, 1500 aed for 10 hours 15 seater / 1600 aed for 10 hours 10 seater","rateCard":""},{"id":261,"name":"High End Films","category":"Equipment","email":"","phone":"966 55 450 3574","website":"www.highendfilms.com","location":"London, UK","notes":"Saudi","rateCard":""},{"id":262,"name":"Millimeter Productions","category":"Equipment","email":"fadi@millimeter.sa","phone":"","website":"","location":"London, UK","notes":"Saudi","rateCard":""},{"id":263,"name":"One Take Drones","category":"Equipment","email":"info@onetakedrones.com","phone":"","website":"","location":"London, UK","notes":"Saudi - Drone Hire","rateCard":""},{"id":264,"name":"James Cox","category":"Crew","email":"james@blackdotsvideo.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":265,"name":"James Cooke","category":"Crew","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":266,"name":"Adrian Cook","category":"Crew","email":"adrianvcook@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":267,"name":"Simon Plunkett","category":"Crew","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":268,"name":"Ben Kyle","category":"Crew","email":"info@ben-kyle.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":269,"name":"Jear Velasquez","category":"Crew","email":"studio@jearvelasquez.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":270,"name":"Christiaan Ellis","category":"Crew","email":"christiaanellis.vid@gmail.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":271,"name":"Elvira","category":"Crew","email":"","phone":"","website":"www.instagram.com/elviragabitova_?igsh=bnFhM3d0NWMxejlz","location":"Dubai, UAE","notes":"","rateCard":""},{"id":272,"name":"Bassem","category":"Crew","email":"","phone":"","website":"www.instagram.com/bassem_eldabour?igsh=MjF3emljOTg0Z2Q3&utm_source=qr -","location":"Dubai, UAE","notes":"","rateCard":""},{"id":273,"name":"Mattia Holme","category":"Crew","email":"nouna@mmgartists.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":274,"name":"Alastair Jerome-Ball","category":"Crew","email":"Alastair_jb@hotmail.co.uk","phone":"","website":"","location":"Dubai, UAE","notes":"Digi Opp","rateCard":""},{"id":275,"name":"Tony Ibrahim","category":"Crew","email":"focuspuller435@gmail.com","phone":"971 56 411 8207","website":"","location":"Dubai, UAE","notes":"1st AC - 2500 SHOOT / 1250 GC","rateCard":""},{"id":276,"name":"Sabrine El Basi","category":"Crew","email":"sabrine.elbasri95@gmail.com","phone":"212 695 898585","website":"","location":"Dubai, UAE","notes":"2nd AC - 1500 SHOOT / 750 GC","rateCard":""},{"id":277,"name":"Simon Charles","category":"Crew","email":"hi@soundindubai.com","phone":"971 52 877 7508","website":"","location":"Dubai, UAE","notes":"Soundie - 2850","rateCard":""},{"id":278,"name":"Jakub Plesniarski","category":"Crew","email":"jakub.plesniarski@gmail.com","phone":"","website":"mmgartists.com/en/artist/jakub-artist-1064/fashion","location":"Dubai, UAE","notes":"https://www.dropbox.com/scl/fi/d7m4w395wjzgeuj2trmi1/PORTFOLIO_Jakub_Plesniarski_MMG.pdf?rlkey=g7qbgs6h3w1ekgx1vz5zt5p1h&e=1&dl=0","rateCard":""},{"id":279,"name":"Lesha Lich","category":"Crew","email":"","phone":"","website":"www.instagram.com/leshalich","location":"Dubai, UAE","notes":"","rateCard":""},{"id":280,"name":"Moez Achour","category":"Crew","email":"","phone":"","website":"www.instagram.com/moezachourstudio/?hl=en","location":"Dubai, UAE","notes":"","rateCard":""},{"id":281,"name":"Mousslam Rabat","category":"Crew","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":282,"name":"Yassine Taha","category":"Crew","email":"","phone":"","website":"www.instagram.com/airplanemodev1/?hl=en","location":"Dubai, UAE","notes":"still life","rateCard":""},{"id":283,"name":"Amer Mohamad","category":"Crew","email":"","phone":"","website":"www.instagram.com/shootmeamer/?hl=en","location":"Dubai, UAE","notes":"","rateCard":""},{"id":284,"name":"Mazen Abusrour","category":"Crew","email":"","phone":"","website":"www.instagram.com/mazenabusrour","location":"Dubai, UAE","notes":"","rateCard":""},{"id":285,"name":"Cameron Bensley","category":"Crew","email":"cbensley70@gmail.com","phone":"","website":"www.instagram.com/cameron.bensleyy","location":"Dubai, UAE","notes":"still life","rateCard":""},{"id":286,"name":"Stef Galea","category":"Crew","email":"studio@stefgalea.com","phone":"","website":"","location":"Dubai, UAE","notes":"Fashion","rateCard":""},{"id":287,"name":"Sam Rawadi","category":"Crew","email":"booker@jeelmanagement.com","phone":"","website":"www.instagram.com/samrawadi","location":"Dubai, UAE","notes":"Fashion","rateCard":""},{"id":288,"name":"Daniel Asater","category":"Crew","email":"","phone":"","website":"www.instagram.com/daniel.asater","location":"Dubai, UAE","notes":"","rateCard":""},{"id":289,"name":"Fouad Tadros","category":"Crew","email":"info@fouadtadros.com","phone":"","website":"www.instagram.com/fouadtadros","location":"Dubai, UAE","notes":"","rateCard":""},{"id":290,"name":"Giuseppe Vitariello","category":"Crew","email":"","phone":"","website":"www.giuseppevitariello.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":291,"name":"Michel Takla","category":"Crew","email":"Michelltakla@gmail.com","phone":"","website":"www.micheltakla.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":292,"name":"Mox Santos","category":"Crew","email":"mox@nondescriptstudios.com","phone":"","website":"www.moxsantos.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":293,"name":"Amina Zaher","category":"Crew","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":294,"name":"Daron Bandeira","category":"Crew","email":"info@daronbandeira.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":295,"name":"Vladimir Marti","category":"Crew","email":"","phone":"","website":"www.vladimirmartistudio.com / https://www.instagram.com/vladimirmarti","location":"Dubai, UAE","notes":"","rateCard":""},{"id":296,"name":"Greg Adamski","category":"Crew","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":297,"name":"Things By People","category":"Crew","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":298,"name":"MMG","category":"Crew","email":"nouna@mmgartists.com","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":299,"name":"LMC Worldwide","category":"Crew","email":"","phone":"","website":"www.lmc.world","location":"Dubai, UAE","notes":"","rateCard":""},{"id":300,"name":"D&D Management","category":"Crew","email":"ddmgmt@capitaldgroup.com","phone":"","website":"www.dd-management.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":301,"name":"Natasha Yonan Kazandjian","category":"Crew","email":"","phone":"","website":"www.instagram.com/namayoka","location":"London, UK","notes":"Cairo, Egypt","rateCard":""},{"id":302,"name":"Mohhamed Sherif","category":"Crew","email":"","phone":"","website":"www.instagram.com/mohhamed_sherif","location":"London, UK","notes":"Cairo, Egypt","rateCard":""},{"id":303,"name":"Mariam Al Gendy","category":"Crew","email":"","phone":"","website":"www.instagram.com/mgendy_","location":"London, UK","notes":"","rateCard":""},{"id":304,"name":"Kolby Knight","category":"Crew","email":"","phone":"","website":"www.kolbyknight.com","location":"London, UK","notes":"New York","rateCard":""},{"id":305,"name":"Nicolas Kuttler","category":"Crew","email":"nicolas.kuttler@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":306,"name":"Lee Holmes","category":"Crew","email":"lee.m.holmes1@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":307,"name":"James Cook","category":"Crew","email":"me@jamestcook.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":308,"name":"Okay - Alex","category":"Crew","email":"athene@okaystudio.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":309,"name":"Cheat","category":"Crew","email":"dom@cheatit.co","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":310,"name":"Sølv","category":"Crew","email":"solvofficial@gmail.com","phone":"","website":"www.solvofficial.com","location":"London, UK","notes":"","rateCard":""},{"id":311,"name":"Tom Tripp","category":"Crew","email":"tomtrippmusic@gmail.com","phone":"44 (0) 7943 337295","website":"","location":"London, UK","notes":"","rateCard":""},{"id":312,"name":"Excellent Talent","category":"Crew","email":"info@excellenttalent.com","phone":"44 (0) 3452 100 111","website":"excellenttalent.com","location":"London, UK","notes":"","rateCard":""},{"id":313,"name":"Bring Digital","category":"Crew","email":"info@bringdigital.co.uk","phone":"44 (0) 0161 441 0895","website":"www.bringdigital.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":314,"name":"Voicebank London","category":"Crew","email":"voices@voicebanklondon.co.uk","phone":"44 (0) 20 3326 5430","website":"www.voicebanklondon.co.uk","location":"London, UK","notes":"","rateCard":""},{"id":315,"name":"Another Tongue","category":"Crew","email":"Marcus Furlong <Marcus@anothertongue.com>","phone":"","website":"","location":"London, UK","notes":"£4k","rateCard":""},{"id":316,"name":"Sue Terry Voices","category":"Crew","email":"sue@sueterryvoices.com","phone":"44 (0) 20 7434 2040","website":"www.sueterryvoices.com","location":"London, UK","notes":"£1k per scripts + £250 recording fee","rateCard":""},{"id":317,"name":"Meet the Jones","category":"Crew","email":"Laura Milne <laura@meetthejoneses.co.uk>","phone":"","website":"","location":"London, UK","notes":"£5k for social","rateCard":""},{"id":318,"name":"Paul Drozdowski","category":"Crew","email":"maxxie3@hotmail.co.uk","phone":"","website":"","location":"London, UK","notes":"130 per image","rateCard":""},{"id":319,"name":"Paulina Teller","category":"Crew","email":"paulina@ptretouch.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":320,"name":"KK Retouch / Kushtrim Kunushevci","category":"Crew","email":"kushtrim.kunushevci@gmail.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":321,"name":"SoftSpot","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":322,"name":"Tiagi Production","category":"Production","email":"Iman@tiagi.com / Zim@tiagiproduction.com","phone":"","website":"","location":"London, UK","notes":"Iman / Zim","rateCard":""},{"id":323,"name":"Curated. Co","category":"Production","email":"katie@the-curated.co / curator@the-curated.co","phone":"","website":"","location":"London, UK","notes":"Katie Holmes / Giorgio","rateCard":""},{"id":324,"name":"Pavilion Works","category":"Production","email":"hello@pavilionworks.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":325,"name":"Danson Productions","category":"Production","email":"kerry@dansonproductions.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":326,"name":"Raw Productions","category":"Production","email":"info@raw-production.co.uk","phone":"","website":"","location":"London, UK","notes":"Jeska","rateCard":""},{"id":327,"name":"Un-Produced","category":"Production","email":"hello@un-produced.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":328,"name":"Town Production","category":"Production","email":"info@townprod.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":329,"name":"Rosco Production","category":"Production","email":"london@roscoproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":330,"name":"Ragi Production","category":"Production","email":"office@ragiproductions.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":331,"name":"NM Production","category":"Production","email":"london@nm-productions.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":332,"name":"Mayor Production","category":"Production","email":"info@mayor.productions","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":333,"name":"MAD Production","category":"Production","email":"office@mad.global","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":334,"name":"January Production","category":"Production","email":"leonardpetit@gmail.com","phone":"","website":"","location":"London, UK","notes":"Leonard Petit","rateCard":""},{"id":335,"name":"JN Production","category":"Production","email":"info@jnproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":336,"name":"Fresh Base","category":"Production","email":"info@fresh-base.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":337,"name":"Cebe Studio","category":"Production","email":"careers@cebe.studio","phone":"","website":"","location":"London, UK","notes":"London / Events & Stills","rateCard":""},{"id":338,"name":"Noir Production","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":339,"name":"Creative Blood Agency","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":340,"name":"Chebabo & Co","category":"Production","email":"anthony@chebabo.com","phone":"","website":"","location":"London, UK","notes":"Anthony Chebabo","rateCard":""},{"id":341,"name":"Ice Studios","category":"Production","email":"jess@icestudios.co","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":342,"name":"Aalto Production","category":"Production","email":"alex.aalto@yahoo.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":343,"name":"Somesuch & Co","category":"Production","email":"resume@somesuch.co","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":344,"name":"Lola Production","category":"Production","email":"london@lolaproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":345,"name":"Farago Projects","category":"Production","email":"info@farago-projects.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":346,"name":"Pulse Films","category":"Production","email":"cv@pulsefilms.co.uk","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":347,"name":"Partner Films","category":"Production","email":"info@partnerfilms.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":348,"name":"Honor Hellon","category":"Production","email":"honor@honorhellonproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":349,"name":"We are by Association","category":"Production","email":"hello@wearebyassociation.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":350,"name":"Sonder","category":"Production","email":"hello@sonder.london","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":351,"name":"Hyperion","category":"Production","email":"hello@hyperionla.com","phone":"","website":"hyperionla.com","location":"London, UK","notes":"","rateCard":""},{"id":352,"name":"Division.Global","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":353,"name":"JNproduction","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":354,"name":"Left Productions","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":355,"name":"Blank Square Productions","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":356,"name":"The Morrison Group","category":"Production","email":"info@themorrisongrp.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":357,"name":"Virgin Soil","category":"Production","email":"contact@virginsoilpictures.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":358,"name":"Lola Production","category":"Production","email":"newyork@lolaproduction.com / losangeles@lolaproduction.com","phone":"","website":"","location":"London, UK","notes":"NYC / LA / LDN / EUROPE","rateCard":""},{"id":359,"name":"Partner Films","category":"Production","email":"info@partnerfilms.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":360,"name":"North of Now","category":"Production","email":"hi@northofnow.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":361,"name":"Crawford & Co","category":"Production","email":"zach@crawfordandcoproductions.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":362,"name":"Wilson Projects","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":363,"name":"Early Morning Riot","category":"Production","email":"jennifer@earlymorningriot.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":364,"name":"Oui Productions","category":"Production","email":"gabrielle@oui-productions.com","phone":"","website":"","location":"London, UK","notes":"Gabi","rateCard":""},{"id":365,"name":"YY Production","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"Asli","rateCard":""},{"id":366,"name":"Partner Films","category":"Production","email":"info@partnerfilms.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":367,"name":"Rosco Production","category":"Production","email":"newyork@roscoproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":368,"name":"Honor Hellon","category":"Production","email":"honor@honorhellonproduction.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":369,"name":"We are By Association","category":"Production","email":"hello@wearebyassociation.com","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":370,"name":"Camp Productions","category":"Production","email":"fran@camp.productions","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":371,"name":"Public.Space","category":"Production","email":"contact@publicspace.studio","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":372,"name":"Goma Studios","category":"Production","email":"rudah@goma.co","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":373,"name":"Viewfinders","category":"Production","email":"dana@viewfinders.us","phone":"","website":"","location":"London, UK","notes":"","rateCard":""},{"id":374,"name":"1505 Studio","category":"Production","email":"hello@1505.studio","phone":"","website":"www.1505.Studio","location":"Dubai, UAE","notes":"Beirut/Dubai","rateCard":""},{"id":375,"name":"NM Productions","category":"Production","email":"enquiries@nm-productions.com","phone":"","website":"www.nm-productions.com","location":"Dubai, UAE","notes":"London/Dubai/US","rateCard":""},{"id":376,"name":"MMG Art Production","category":"Production","email":"Ignacio@mmgartproduction.com","phone":"","website":"","location":"Dubai, UAE","notes":"Dubai","rateCard":""},{"id":377,"name":"WMI","category":"Production","email":"Jorge Agut Rosell <jorge@wmi-global.com>","phone":"","website":"","location":"Dubai, UAE","notes":"Dubai/London/NYC","rateCard":""},{"id":378,"name":"JWI","category":"Production","email":"hello@jwi-global.com","phone":"","website":"jwi-global.com","location":"Dubai, UAE","notes":"Dubai","rateCard":""},{"id":379,"name":"Dejavu Dubai","category":"Production","email":"","phone":"","website":"www.dejavu.ae","location":"Dubai, UAE","notes":"Dubai","rateCard":""},{"id":380,"name":"The Collective (Events)","category":"Production","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"Heather -","rateCard":""},{"id":381,"name":"Filmworks Group","category":"Production","email":"","phone":"","website":"filmworksgroup.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":382,"name":"AStudio","category":"Production","email":"","phone":"","website":"www.astudio.ae/creative-digital-agency","location":"Dubai, UAE","notes":"","rateCard":""},{"id":383,"name":"arabianEye","category":"Production","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":384,"name":"Nomad","category":"Production","email":"","phone":"","website":"filmsbynomad.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":385,"name":"Toast Films","category":"Production","email":"","phone":"","website":"www.toast-films.com","location":"Dubai, UAE","notes":"Abu Dhabi/Dubai","rateCard":""},{"id":386,"name":"Meraki","category":"Production","email":"","phone":"","website":"www.merakiproduction.com","location":"Dubai, UAE","notes":"London/Dubai","rateCard":""},{"id":387,"name":"Magnet","category":"Production","email":"","phone":"","website":"www.magnetconnect.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":388,"name":"Electriclime","category":"Production","email":"<layal@electriclimefilms.com> <michael@electriclimefilms.com>","phone":"","website":"electriclimefilms.com","location":"Dubai, UAE","notes":"Singapore/Dubai/Sydney","rateCard":""},{"id":389,"name":"Twofour54","category":"Production","email":"","phone":"","website":"www.twofour54.com","location":"Dubai, UAE","notes":"","rateCard":""},{"id":390,"name":"Good Stills","category":"Production","email":"jolianne@goodstills.com","phone":"","website":"www.goodstills.com","location":"Dubai, UAE","notes":"Dubai/Saudi/Bahrain","rateCard":""},{"id":391,"name":"everyone.film","category":"Production","email":"","phone":"","website":"","location":"Dubai, UAE","notes":"","rateCard":""},{"id":392,"name":"Apex","category":"Production","email":"k.shurbaji@apexprodsmea.com","phone":"","website":"","location":"Dubai, UAE","notes":"Saudi","rateCard":""},{"id":393,"name":"Nashta Production","category":"Production","email":"contact@nashtaproduction.com","phone":"","website":"","location":"London, UK","notes":"Morrocco","rateCard":""},{"id":394,"name":"Kitten Production","category":"Production","email":"romain@kittenproduction.com","phone":"","website":"","location":"London, UK","notes":"Paris","rateCard":""},{"id":395,"name":"Company Paris","category":"Production","email":"contact@company.paris","phone":"","website":"","location":"London, UK","notes":"Paris","rateCard":""},{"id":396,"name":"Snap14 Production","category":"Production","email":"nadia@snap-14.com","phone":"","website":"www.snap14.com","location":"London, UK","notes":"Egypt","rateCard":""},{"id":397,"name":"Nakama Film","category":"Production","email":"Kenji Sato <kenji@nakamfilm.tv>","phone":"","website":"nakamafilm.tv","location":"London, UK","notes":"Japan","rateCard":""},{"id":398,"name":"Tokyo Colours","category":"Production","email":"Naoko Naoko@tokyo-colours.co.jp","phone":"","website":"","location":"London, UK","notes":"Japan","rateCard":""},{"id":399,"name":"Monky","category":"Production","email":"Håvard Schei <hs@monky.no>","phone":"","website":"www.monky.no","location":"London, UK","notes":"Norway","rateCard":""},{"id":400,"name":"Mercenaire Productions","category":"Production","email":"Salomé Jouan <salome@mercenaire.com>","phone":"","website":"","location":"London, UK","notes":"France","rateCard":""},{"id":401,"name":"Take Productions","category":"Production","email":"Take Production_Valie <valie@take.rocks>","phone":"","website":"","location":"London, UK","notes":"Bologna","rateCard":""},{"id":402,"name":"Juan Pina (Fixer)","category":"Production","email":"J.Pizitrone@gmail.com","phone":"","website":"","location":"London, UK","notes":"Mallorca","rateCard":""},{"id":403,"name":"Bibi Lacroix (Fixer)","category":"Production","email":"","phone":"","website":"www.wearestudiob.com","location":"London, UK","notes":"Mallorca","rateCard":""},{"id":404,"name":"Virtual Films","category":"Production","email":"info@virtualfilms.tv","phone":"","website":"virtualfilms.tv","location":"London, UK","notes":"Spain/Portugal - Barcelona","rateCard":""},{"id":405,"name":"Purple Brain","category":"Production","email":"mohammed@purplebrain.co","phone":"","website":"","location":"London, UK","notes":"Saudi Arabia","rateCard":""},{"id":406,"name":"Dora Joker","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"Barcelona","rateCard":""},{"id":407,"name":"Lettergray","category":"Production","email":"","phone":"","website":"","location":"London, UK","notes":"Saudi Arabia","rateCard":""},{"id":408,"name":"Lindsay Nelson","category":"Production","email":"lindsaynelson106@gmail.com","phone":"","website":"www.lindsayjnelson.com","location":"Los Angeles, US","notes":"New York","rateCard":""},{"id":409,"name":"Sam Rockman","category":"Production","email":"sam@rockmanpro.com","phone":"","website":"www.rockmanpro.com","location":"Los Angeles, US","notes":"LA","rateCard":""},{"id":410,"name":"Helena Martel Sewards","category":"Production","email":"helena@lollywould.com","phone":"","website":"www.lollywould.com/about","location":"Los Angeles, US","notes":"LA","rateCard":""},{"id":411,"name":"Wei-Li Wang","category":"Production","email":"weili@hudsonhillproduction.com","phone":"","website":"","location":"Los Angeles, US","notes":"New York","rateCard":""},{"id":412,"name":"Louay Nasser","category":"Production","email":"","phone":"","website":"www.instagram.com/louay_nasser/?hl=en","location":"Los Angeles, US","notes":"Egypt","rateCard":""},{"id":413,"name":"Monique","category":"Production","email":"","phone":"","website":"","location":"Los Angeles, US","notes":"Egpyt","rateCard":""},{"id":414,"name":"Yazid","category":"Production","email":"Yazid@somnii.co.uk","phone":"","website":"","location":"Los Angeles, US","notes":"Marakesch Morroco","rateCard":""},{"id":415,"name":"FREELANCE Pas","category":"Production","email":"","phone":"","website":"","location":"Los Angeles, US","notes":"","rateCard":""},{"id":416,"name":"Rafael Aguilar","category":"Production","email":"rafaelaguilar.097@gmail.com","phone":"","website":"","location":"Los Angeles, US","notes":"New York","rateCard":""},{"id":417,"name":"Dan Coleman","category":"Production","email":"daniel.coleman723@gmail.com","phone":"","website":"","location":"Los Angeles, US","notes":"New York","rateCard":""},{"id":418,"name":"Roman Caesar","category":"Production","email":"r.caesar2288@gmail.com","phone":"","website":"","location":"Los Angeles, US","notes":"New York","rateCard":""},{"id":419,"name":"Shelton Lawrence","category":"Production","email":"sheltoncreator@gmail.com","phone":"","website":"","location":"Los Angeles, US","notes":"New York","rateCard":""}];
const initOutreach = []; // populated from DB on load
const savedCallSheets = {"Columbia / IMA — Ramadan Activation 2026":"SHOOT NAME: Columbia Ramadan Activation 2026"};
const savedRiskAssessments = {"Columbia / IMA — Ramadan Activation 2026":"SHOOT NAME: Columbia Ramadan Activation 2026"};
const initColumbiaEstimate = {
  version:"V1", date:"18/02/2026", client:"IMA", project:"COLUMBIA RAMADAN 2026 ACTIVATION",
  attention:"Freya Morris <freya.morris@ima.global>", photographer:"NATHAN EVANS / FRNDZ STUDIO",
  deliverables:"VIDEOS & STILLS", deadlines:"25TH FEB / MARCH 12",
  usageTerms:"12 months, global, digital, and social. Plus retail POS and OOH in Dubai.",
  agreedRounds:"2 ROUNDS OF FEEDBACK", shootDate:"21ST FEBRUARY / 7TH MARCH",
  shootDays:"2 SHOOT DAYS", shootHours:"BASED ON A 10 HOUR SHOOT DAY [3PM - 1AM]",
  shootLocation:"RAS AL KAIMAH", paymentTerms:"75% ADVANCE, 25% UPON COMPLETION (30 DAYS FROM INVOICE)",
  lineItems:[
    {cat:"1", name:"Photography Fees",       aed:25200},
    {cat:"2", name:"Photography Equipment",  aed:7500},
    {cat:"3", name:"Stills Post Production", aed:8000},
    {cat:"4", name:"Video Crew",             aed:51000},
    {cat:"5", name:"Video Equipment",        aed:13200},
    {cat:"6", name:"Video Post-Production",  aed:28000},
    {cat:"7", name:"Styling",                aed:0},
    {cat:"8", name:"Hair & Makeup",          aed:0},
    {cat:"9", name:"Talent",                 aed:0},
    {cat:"10",name:"Props & Set",            aed:0},
    {cat:"11",name:"Production",             aed:21000},
    {cat:"12",name:"Production Expenses",    aed:9000},
    {cat:"13",name:"Catering",               aed:5000},
    {cat:"14",name:"Vehicles",               aed:6000},
    {cat:"15",name:"Locations",              aed:0},
    {cat:"16",name:"Permits",                aed:0},
    {cat:"17",name:"Travel",                 aed:0},
    {cat:"18",name:"Production Fees",        aed:22607},
  ],
  notes:"SHOOT HOURS ARE BASED ON A 10 HOUR SHOOT DAY UNLESS OTHERWISE AGREED.\nEXCHANGE RATE CALCULATED AT 1 AED = 0.27 USD",
};

const TABS = [
  {id:"Dashboard", label:"DASHBOARD"},
  {id:"Vendors",  label:"VENDORS"},
  {id:"Sales",      label:"SALES"},
  {id:"Projects",   label:"PROJECTS"},
];

const StarIcon = ({size=11,color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill={color} xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0,display:"block"}}>
    <path d="M6 0.5l1.39 2.82L10.5 3.8l-2.25 2.19.53 3.09L6 7.63l-2.78 1.45.53-3.09L1.5 3.8l3.11-.48L6 0.5z"/>
  </svg>
);

// ─── PDF EXPORT via Blob URL ──────────────────────────────────────────────────
const exportToPDF = (content, title) => {
  const date = new Date().toLocaleDateString("en-GB", {day:"2-digit", month:"short", year:"numeric"});
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10.5pt;color:#111;background:#fff;padding:22mm 18mm;line-height:1.65;}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding-bottom:14px;border-bottom:1.5px solid #111;}
  .logo{font-size:22pt;font-weight:700;letter-spacing:-0.02em;}
  .doc-label{font-size:8pt;text-transform:uppercase;letter-spacing:0.1em;color:#666;margin-top:4px;}
  .co{text-align:right;font-size:8.5pt;color:#666;line-height:1.7;}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:5px 18px;margin-bottom:18px;padding:13px 15px;background:#f7f7f7;border-radius:5px;font-size:9pt;}
  .ml label{font-weight:600;font-size:7.5pt;text-transform:uppercase;letter-spacing:0.07em;color:#888;display:block;margin-bottom:2px;}
  table{width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:9.5pt;}
  th{background:#111;color:#fff;padding:7px 11px;text-align:left;font-size:7.5pt;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;}
  td{padding:7px 11px;border-bottom:1px solid #eee;vertical-align:top;}
  tr:nth-child(even) td{background:#fafafa;}
  .sub td{font-weight:600;border-top:1px solid #bbb;}
  .vat td{color:#666;}
  .grand td{font-weight:700;font-size:11pt;background:#111!important;color:#fff;}
  .adv td{color:#666;background:#f5f5f5!important;}
  .right{text-align:right;}
  .sec{font-weight:700;text-transform:uppercase;letter-spacing:0.09em;font-size:8.5pt;color:#333;margin:16px 0 7px;border-bottom:1px solid #e0e0e0;padding-bottom:4px;}
  .bul{padding-left:14px;margin-bottom:4px;font-size:9.5pt;}
  p{margin-bottom:8px;font-size:9.5pt;}
  .sigs{margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:28px;}
  .sig{border-top:1px solid #111;padding-top:5px;font-size:8.5pt;color:#555;}
  .sig2{margin-top:22px;border-top:1px solid #bbb;padding-top:5px;font-size:8pt;color:#888;}
  .note{margin-top:14px;padding:10px 13px;background:#f5f5f5;border-left:2px solid #bbb;font-size:9pt;color:#555;white-space:pre-line;}
  .ftr{margin-top:36px;padding-top:10px;border-top:1px solid #e0e0e0;font-size:7.5pt;color:#aaa;display:flex;justify-content:space-between;}
  @media print{body{padding:15mm 12mm;}@page{margin:0;size:A4;}}
</style>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</head><body>
<div class="hdr">
  <div><div class="logo">onna</div><div class="doc-label">${title}</div></div>
  <div class="co">ONNA FILM TV RADIO PRODUCTION SERVICES LLC<br>Office F1-022, Dubai, UAE<br>hello@onnaproduction.com</div>
</div>
${content}
<div class="ftr"><span>ONNA FILM TV RADIO PRODUCTION SERVICES LLC · DUBAI &amp; LONDON</span><span>Generated ${date}</span></div>
</body></html>`;

  // Use Blob URL — avoids document.write cross-origin issues
  const blob = new Blob([html], {type:"text/html"});
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (!win) {
    // Fallback: trigger download as .html file the user can print
    const a = document.createElement("a");
    a.href = url; a.download = `${title}.html`; a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

// ─── TABLE EXPORT HELPERS ──────────────────────────────────────────────────────
const downloadCSV = (rows, columns, filename) => {
  const header = columns.map(c=>`"${c.label}"`).join(",");
  const body = rows.map(r=>columns.map(c=>`"${String(r[c.key]??'').replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([header+"\n"+body],{type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),10000);
};

const exportTablePDF = (rows, columns, title) => {
  const thead = `<tr>${columns.map(c=>`<th>${c.label}</th>`).join("")}</tr>`;
  const tbody = rows.map(r=>`<tr>${columns.map(c=>`<td>${r[c.key]??''}</td>`).join("")}</tr>`).join("");
  exportToPDF(`<div class="sec">${title}</div><table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`, title);
};

const buildEstimateHTML = (est) => {
  const sub  = est.lineItems.filter(l=>l.cat!=="18").reduce((a,b)=>a+Number(b.aed),0);
  const fees = est.lineItems.filter(l=>l.cat==="18").reduce((a,b)=>a+Number(b.aed),0);
  const total = sub+fees; const vat=total*0.05; const grand=total+vat; const advance=grand*0.5;
  const metaRows=[["Date",est.date],["Client",est.client],["Project",est.project],["Attention",est.attention],["Photographer / Director",est.photographer],["Deliverables",est.deliverables],["Deadlines",est.deadlines],["Shoot Date",est.shootDate],["Shoot Location",est.shootLocation],["Usage Terms",est.usageTerms],["Payment Terms",est.paymentTerms]].filter(([,v])=>v);
  return `<div class="meta">${metaRows.map(([k,v])=>`<div class="ml"><label>${k}</label>${v}</div>`).join("")}</div>
<table><thead><tr><th style="width:38px">#</th><th>Category</th><th class="right">AED</th><th class="right">USD</th></tr></thead><tbody>
${est.lineItems.map(li=>`<tr><td style="color:#999">${li.cat}</td><td><strong>${li.name}</strong></td><td class="right">${Number(li.aed)>0?"AED "+Number(li.aed).toLocaleString():"—"}</td><td class="right" style="color:#888">${Number(li.aed)>0?"$"+(Number(li.aed)*0.27).toLocaleString(undefined,{maximumFractionDigits:2}):"—"}</td></tr>`).join("")}
<tr class="sub"><td colspan="2"><strong>SUBTOTAL</strong></td><td class="right"><strong>AED ${total.toLocaleString()}</strong></td><td class="right" style="color:#888">$${(total*0.27).toLocaleString(undefined,{maximumFractionDigits:0})}</td></tr>
<tr class="vat"><td colspan="2">VAT (5%)</td><td class="right">AED ${vat.toLocaleString(undefined,{maximumFractionDigits:2})}</td><td></td></tr>
<tr class="grand"><td colspan="2">GRAND TOTAL</td><td class="right">AED ${grand.toLocaleString(undefined,{maximumFractionDigits:2})}</td><td class="right">$${(grand*0.27).toLocaleString(undefined,{maximumFractionDigits:0})}</td></tr>
<tr class="adv"><td colspan="2">50% ADVANCE PAYMENT</td><td class="right">AED ${advance.toLocaleString(undefined,{maximumFractionDigits:2})}</td><td></td></tr>
</tbody></table>
${est.notes?`<div class="note">${est.notes}</div>`:""}
<div class="sigs"><div><div class="sig">Signed for and on behalf of ONNA</div><div class="sig2">Print Name &amp; Date</div></div><div><div class="sig">Signed for and on behalf of ${est.client||"Client"}</div><div class="sig2">Print Name &amp; Date</div></div></div>`;
};

const buildDocHTML = (text) => {
  if (!text) return "<p>No content generated.</p>";
  const lines=text.split("\n"); let html=""; let i=0;
  while (i<lines.length) {
    const line=lines[i].trim();
    if (line.includes("|")&&lines[i+1]&&lines[i+1].replace(/[-|:\s]/g,"")==="") {
      const hdrs=line.split("|").map(c=>c.trim()).filter(Boolean); const rows=[]; i+=2;
      while(i<lines.length&&lines[i].includes("|")){rows.push(lines[i].trim().split("|").map(c=>c.trim()).filter(Boolean));i++;}
      html+=`<table><thead><tr>${hdrs.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      continue;
    }
    if(line&&((line===line.toUpperCase()&&line.length>3&&!line.includes("|"))||/^\d+\./.test(line))) html+=`<div class="sec">${line}</div>`;
    else if(line.startsWith("•")||line.startsWith("-")) html+=`<div class="bul">${line}</div>`;
    else if(line) html+=`<p>${line}</p>`;
    i++;
  }
  return html;
};

const buildContractHTML = (text) => {
  if (!text) return "<p>No contract generated.</p>";
  let html="";
  text.split("\n").forEach(line=>{
    const t=line.trim(); if(!t){html+="<br>";return;}
    if(t===t.toUpperCase()&&t.length>4&&!t.includes("(")) html+=`<div class="sec">${t}</div>`;
    else if(t.startsWith("•")||t.startsWith("-")) html+=`<div class="bul">${t}</div>`;
    else html+=`<p>${t}</p>`;
  });
  return `<div>${html}</div><div class="sigs"><div><div class="sig">Signed for and on behalf of ONNA</div><div class="sig2">Print Name &amp; Date</div></div><div><div class="sig">Signed by Commissionee / Supplier</div><div class="sig2">Print Name &amp; Date</div></div></div>`;
};

const generateEstimateText = (est, sub, fees, total, vat, grand, advance) => {
  const lines = [`PRODUCTION ESTIMATE ${est.version}  DATE: ${est.date}`,`CLIENT: ${est.client}  PROJECT: ${est.project}`,`ATTENTION: ${est.attention}`,`PHOTOGRAPHER/DIRECTOR: ${est.photographer}`,`DELIVERABLES: ${est.deliverables}`,`DEADLINES: ${est.deadlines}`,`USAGE TERMS: ${est.usageTerms}`,`SHOOT DATE: ${est.shootDate}`,`SHOOT LOCATION: ${est.shootLocation}`,`PAYMENT TERMS: ${est.paymentTerms}`,``];
  (est.lineItems||[]).forEach(li=>lines.push(`${li.cat}  ${li.name}  AED ${Number(li.aed).toLocaleString()}  $${(Number(li.aed)*0.27).toFixed(2)}`));
  lines.push(``,`SUB TOTAL  AED ${sub.toLocaleString()}`,`VAT (5%)  AED ${vat.toFixed(2)}`,`GRAND TOTAL  AED ${grand.toFixed(2)}`,`50% ADVANCE  AED ${advance.toFixed(2)}`,``,`NOTES:`,est.notes||"");
  return lines.join("\n");
};

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const Badge = ({status}) => {
  const map = {"Not Contacted":["#fff3e0","#c0392b"],"New Lead":["#f0f0f5",T.sub],"Responded":["#e8f0ff","#1a56db"],"Meeting Arranged":["#fff8e8","#92680a"],"Converted to Client":["#edfaf3","#147d50"]};
  const [bg,tc] = map[status]||["#f5f5f7",T.muted];
  return <span style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"3px 9px",borderRadius:999,background:bg,color:tc,fontSize:11,fontWeight:500}}><span style={{width:5,height:5,borderRadius:"50%",background:tc,flexShrink:0}}/>{status}</span>;
};

const Pill = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:"5px 14px",borderRadius:999,fontSize:12,fontWeight:500,cursor:"pointer",border:"1px solid",fontFamily:"inherit",transition:"all 0.12s",background:active?T.accent:"#e8e8ed",borderColor:active?T.accent:"#d1d1d6",color:active?"#fff":T.sub,whiteSpace:"nowrap"}}>{label}</button>
);

const StatCard = ({label,value,sub}) => (
  <div style={{borderRadius:16,padding:"20px 22px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
    <div style={{fontSize:11,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase",color:T.muted,marginBottom:10}}>{label}</div>
    <div style={{fontSize:28,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:sub?4:0}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:T.sub}}>{sub}</div>}
  </div>
);

const TH = ({children}) => <th style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:`1px solid ${T.borderSub}`,background:"#fafafa"}}>{children}</th>;
const TD = ({children,bold,muted}) => <td style={{padding:"11px 14px",fontSize:12.5,color:bold?T.text:muted?T.muted:T.sub,borderBottom:`1px solid ${T.borderSub}`,verticalAlign:"middle"}}>{children}</td>;

const SearchBar = ({value,onChange,placeholder}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 13px",minWidth:220,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke={T.muted} strokeWidth="1.4"/><path d="M8.5 8.5L11 11" stroke={T.muted} strokeWidth="1.4" strokeLinecap="round"/></svg>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Search…"} style={{border:"none",background:"transparent",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none",width:"100%"}}/>
    {value&&<button onClick={()=>onChange("")} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>}
  </div>
);

const Sel = ({value,onChange,options,minWidth}) => (
  <select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"8px 30px 8px 12px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit",cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aeaeb2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",minWidth:minWidth||140,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
    {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
  </select>
);

const OutreachBadge = ({status,onClick}) => {
  const s = {not_contacted:{bg:"#fff3e0",c:"#c0392b",label:"Not Contacted"},cold:{bg:"#f5f5f7",c:T.sub,label:"Cold"},warm:{bg:"#eef4ff",c:"#1a56db",label:"Warm"},open:{bg:"#edfaf3",c:"#147d50",label:"Open"},client:{bg:"#f3e8ff",c:"#7c3aed",label:"Client"}}[status]||{bg:"#fff3e0",c:"#c0392b",label:"Not Contacted"};
  return <span onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:999,background:s.bg,color:s.c,fontSize:11,fontWeight:500,cursor:onClick?"pointer":"default"}}><span style={{width:5,height:5,borderRadius:"50%",background:s.c,flexShrink:0}}/>{s.label}</span>;
};

const _parseDate = (str) => {
  if (!str) return null;
  // Strip ordinal suffixes: "2nd February" → "2 February 2026"
  const clean = str.replace(/(\d+)(st|nd|rd|th)\b/i, "$1");
  // If no year present, append 2026
  const withYear = /\d{4}/.test(clean) ? clean : `${clean} 2026`;
  const d = new Date(withYear);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (str) => {
  if (!str) return "";
  const d = _parseDate(str);
  if (!d) return str;
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(2)}`;
};

const getMonthLabel = (str) => {
  if (!str) return "";
  const d = _parseDate(str);
  if (!d) return "";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const THFilter = ({label,value,onChange,options}) => (
  <th style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:`1px solid ${T.borderSub}`,background:"#fafafa"}}>
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <span>{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)} onClick={e=>e.stopPropagation()} style={{fontSize:10,color:value==="All"?T.muted:"#1a56db",background:"transparent",border:"none",outline:"none",cursor:"pointer",padding:0,fontFamily:"inherit",fontWeight:600,appearance:"none",maxWidth:140,letterSpacing:"0.04em"}}>
        {options.map(o=>{const val=o.value!==undefined?o.value:o;const lbl=o.label||o;return <option key={val} value={val}>{lbl}</option>;})}
      </select>
    </div>
  </th>
);

const SectionBtn = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:"6px 13px",borderRadius:9,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${active?T.accent:T.border}`,fontFamily:"inherit",transition:"all 0.12s",background:active?T.accent:"transparent",color:active?"#fff":T.sub,whiteSpace:"nowrap"}}>{label}</button>
);

const UploadZone = ({label,files,onAdd}) => {
  const handleDrop = e => {e.preventDefault();onAdd(Array.from(e.dataTransfer.files));};
  return (
    <div>
      <label onDrop={handleDrop} onDragOver={e=>e.preventDefault()} style={{display:"block",border:`1.5px dashed ${T.border}`,borderRadius:14,padding:36,textAlign:"center",cursor:"pointer",background:"#fafafa",transition:"border-color 0.15s"}}>
        <div style={{fontSize:26,marginBottom:8,opacity:0.35}}>⬆</div>
        <div style={{fontSize:13,color:T.sub,marginBottom:4,fontWeight:500}}>{label}</div>
        <div style={{fontSize:12,color:T.muted}}>Drag & drop or click to upload</div>
        <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>onAdd(Array.from(e.target.files))}/>
      </label>
      {files.length>0&&(
        <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
          {files.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`}}>
              <span style={{fontSize:15}}>📄</span>
              <span style={{fontSize:12.5,color:T.sub,flex:1}}>{f.name}</span>
              <span style={{fontSize:11,color:T.muted}}>{(f.size/1024).toFixed(0)} KB</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Button primitives
const BtnPrimary = ({children,onClick,disabled,small}) => (
  <button onClick={onClick} disabled={disabled} style={{padding:small?"5px 13px":"8px 18px",borderRadius:9,background:disabled?"#e8e8ed":T.accent,color:disabled?T.muted:"#fff",border:"none",fontSize:small?11:12.5,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.01em",opacity:disabled?0.6:1,transition:"opacity 0.12s"}}>{children}</button>
);
const BtnSecondary = ({children,onClick,small}) => (
  <button onClick={onClick} style={{padding:small?"5px 13px":"8px 18px",borderRadius:9,background:T.surface,color:T.sub,border:`1px solid ${T.border}`,fontSize:small?11:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>
);
const BtnExport = ({children,onClick}) => (
  <button onClick={onClick} style={{padding:"5px 13px",borderRadius:8,background:"#1d1d1f",color:"#fff",border:"none",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:5}}>⬇ {children}</button>
);

// ─── AI DOC PANEL ─────────────────────────────────────────────────────────────
const AIDocPanel = ({project, docType, systemPrompt, savedDocs}) => {
  const key = `${project.client} — ${project.name}`;
  const [prompt,setPrompt] = useState("");
  const [output,setOutput] = useState(savedDocs[key]||"");
  const [loading,setLoading] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setOutput("");
    try {
      const data = await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:1500,system:systemPrompt,messages:[{role:"user",content:`Project: ${project.client} — ${project.name}\n\n${prompt}`}]});
      setOutput(data?.content?.[0]?.text||"");
    } catch {}
    setLoading(false);
  };

  const renderOutput = text => {
    if (!text) return null;
    const lines=text.split("\n"); const els=[]; let i=0;
    while (i<lines.length) {
      const line=lines[i].trim();
      if (line.includes("|")&&lines[i+1]&&lines[i+1].replace(/[-|:\s]/g,"")==="") {
        const hdrs=line.split("|").map(c=>c.trim()).filter(Boolean); const rows=[]; i+=2;
        while(i<lines.length&&lines[i].includes("|")){rows.push(lines[i].trim().split("|").map(c=>c.trim()).filter(Boolean));i++;}
        els.push(<div key={els.length} style={{overflowX:"auto",margin:"10px 0 14px"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:"#fafafa"}}>{hdrs.map((h,hi)=><th key={hi} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",borderBottom:`1px solid ${T.borderSub}`}}>{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr key={ri}>{row.map((cell,ci)=><td key={ci} style={{padding:"9px 12px",color:ci===0?T.text:T.sub,borderBottom:`1px solid ${T.borderSub}`}}>{cell}</td>)}</tr>)}</tbody></table></div>);
        continue;
      }
      if(line&&((line===line.toUpperCase()&&line.length>3&&!line.includes("|"))||/^\d+\./.test(line))) els.push(<div key={els.length} style={{marginTop:16,marginBottom:5,fontSize:10,fontWeight:700,letterSpacing:"0.09em",color:T.sub,borderBottom:`1px solid ${T.border}`,paddingBottom:4,textTransform:"uppercase"}}>{line}</div>);
      else if(line.startsWith("•")||line.startsWith("-")) els.push(<div key={els.length} style={{fontSize:13,color:T.sub,paddingLeft:10,lineHeight:"1.7"}}>{line}</div>);
      else if(line) els.push(<div key={els.length} style={{fontSize:13,color:T.sub,lineHeight:"1.7"}}>{line}</div>);
      i++;
    }
    return els;
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"11px 16px",borderBottom:`1px solid ${T.borderSub}`,fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",background:"#fafafa",fontWeight:600}}>AI Generator — {docType}</div>
        <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe shoot, crew, location, timing…" rows={3} style={{width:"100%",background:"#fafafa",border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:"1.6"}}/>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <BtnPrimary onClick={generate} disabled={loading||!prompt.trim()}>{loading?"Generating…":`Generate ${docType}`}</BtnPrimary>
          </div>
        </div>
      </div>
      {(output||loading)&&(
        <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{padding:"11px 16px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafafa"}}>
            <span style={{fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",fontWeight:600}}>Generated {docType}</span>
            {output&&<div style={{display:"flex",gap:6}}>
              <BtnSecondary small onClick={()=>navigator.clipboard.writeText(output)}>Copy</BtnSecondary>
              <BtnExport onClick={()=>exportToPDF(buildDocHTML(output),`${docType} — ${project.name}`)}>Export PDF</BtnExport>
            </div>}
          </div>
          <div style={{padding:20,maxHeight:560,overflowY:"auto"}}>
            {loading?<div style={{display:"flex",alignItems:"center",gap:9,color:T.muted,fontSize:13}}><span style={{display:"inline-block",width:14,height:14,borderRadius:"50%",border:"2px solid #e0e0e5",borderTopColor:T.text,animation:"spin 0.8s linear infinite"}}/>Generating…</div>:renderOutput(output)}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// ─── PROJECT TODO LIST COMPONENT ────────────────────────────────────────────
const ProjectTodoList = ({projectId,projectTodos,setProjectTodos,archivedTodos,setArchivedTodos}) => {
  const [newText,setNewText] = useState("");
  const todos = (projectTodos[projectId]||[]).filter(t=>!archivedTodos.find(a=>a.id===t.id));
  const addTodo = () => {
    if (!newText.trim()) return;
    setProjectTodos(prev=>({...prev,[projectId]:[...(prev[projectId]||[]),{id:Date.now(),text:newText.trim(),done:false,details:""}]}));
    setNewText("");
  };
  return (
    <div style={{padding:"0 0 4px"}}>
      {todos.length===0&&<div style={{padding:"14px 18px",fontSize:13,color:T.muted}}>No tasks yet — add one below.</div>}
      {todos.map((t,i)=>(
        <div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:9,padding:"9px 18px",borderBottom:i<todos.length-1?`1px solid ${T.borderSub}`:"none",transition:"background 0.1s"}}>
          <button onClick={()=>setProjectTodos(prev=>({...prev,[projectId]:(prev[projectId]||[]).map(x=>x.id===t.id?{...x,done:!x.done}:x)}))} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${t.done?T.muted:T.border}`,background:t.done?T.accent:"transparent",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,transition:"all 0.12s"}}>
            {t.done&&<span style={{color:"#fff",fontSize:9,lineHeight:1,fontWeight:700}}>✓</span>}
          </button>
          <span style={{flex:1,fontSize:13,color:t.done?T.muted:T.text,textDecoration:t.done?"line-through":"none",lineHeight:"1.5"}}>{t.text}</span>
          <div style={{display:"flex",gap:3,opacity:0,transition:"opacity 0.12s"}} className="todo-del">
            <button onClick={()=>setArchivedTodos(prev=>[...prev,{...t,projectId}])} title="Archive" style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,padding:"2px 4px",borderRadius:4,fontFamily:"inherit"}}>⊘</button>
            <button onClick={()=>setProjectTodos(prev=>({...prev,[projectId]:(prev[projectId]||[]).filter(x=>x.id!==t.id)}))} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>
          </div>
        </div>
      ))}
      <div style={{display:"flex",gap:8,padding:"10px 14px 10px"}}>
        <input value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTodo();}} placeholder="Add a task…" style={{flex:1,padding:"7px 11px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
        <button onClick={addTodo} style={{padding:"7px 13px",borderRadius:9,background:T.accent,border:"none",color:"#fff",fontSize:16,cursor:"pointer",lineHeight:1}}>+</button>
      </div>
    </div>
  );
};

// ─── LOGIN PAGE PRIMITIVES — must live at module level so React never remounts them ──
const _LG_CARD = {width:380,background:"#fff",borderRadius:20,padding:"44px 40px 40px",boxShadow:"0 8px 40px rgba(0,0,0,0.1)",border:"1px solid rgba(0,0,0,0.07)"};
const _LG_WRAP = {minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f5f7",fontFamily:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif"};
const LgLogo = () => <div style={{marginBottom:32,textAlign:"center"}}><img src="/logo.png" alt="ONNA" style={{height:36,width:"auto"}}/></div>;
const LgIn = ({label,id,type="text",value,onChange,onEnter,placeholder,autoFocus,hasErr}) => (
  <div>
    <div style={{fontSize:11,fontWeight:600,color:"#6e6e73",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
    <input id={id} type={type} value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&onEnter)onEnter();}} placeholder={placeholder} autoFocus={autoFocus} style={{width:"100%",padding:"11px 14px",borderRadius:11,border:`1.5px solid ${hasErr?"#c0392b":"#d2d2d7"}`,fontSize:14,fontFamily:"inherit",color:"#1d1d1f",background:"#fafafa",boxSizing:"border-box"}}/>
  </div>
);
const LgBtn = ({onClick,disabled,children}) => (
  <button onClick={onClick} disabled={disabled} style={{marginTop:4,padding:"13px",borderRadius:11,background:disabled?"#d2d2d7":"#1d1d1f",color:"#fff",border:"none",fontSize:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.01em"}}>{children}</button>
);
const LgLink = ({onClick,children}) => (
  <button onClick={onClick} style={{background:"none",border:"none",color:"#6e6e73",fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"center",marginTop:2}}>{children}</button>
);

export default function OnnaDashboard() {
  const _urlReset = new URLSearchParams(window.location.search).get("reset") || "";

  const [authed,setAuthed]         = useState(()=>!!localStorage.getItem("onna_token") && !_urlReset);
  const [lgUser,setLgUser]         = useState("");
  const [lgPass,setLgPass]         = useState("");
  const [lgErr,setLgErr]           = useState("");
  const [lgLoading,setLgLoading]   = useState(false);
  const [lgStep,setLgStep]         = useState(_urlReset ? "reset" : "login");
  const [lgEmail,setLgEmail]       = useState("");
  const [lgNewPass,setLgNewPass]   = useState("");
  const [lgNewPass2,setLgNewPass2] = useState("");

  const doLogin = async () => {
    if (!lgUser.trim()||!lgPass.trim()) return;
    setLgLoading(true); setLgErr("");
    try {
      const data = await fetch(`${API}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Secret":API_SECRET},body:JSON.stringify({username:lgUser,password:lgPass})}).then(r=>r.json());
      if (data.token) { localStorage.setItem("onna_token",data.token); setAuthed(true); }
      else setLgErr("Incorrect username or password");
    } catch { setLgErr("Could not connect. Please try again."); }
    setLgLoading(false);
  };

  const doResetRequest = async () => {
    setLgLoading(true);
    try {
      const data = await fetch(`${API}/api/auth/reset-request`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Secret":API_SECRET},body:JSON.stringify({email:lgEmail})}).then(r=>r.json());
      if (data.reset_url) { window.location.href=data.reset_url; return; } // SMTP not configured
    } catch {}
    setLgStep("forgot-sent"); setLgLoading(false);
  };

  const doResetConfirm = async () => {
    if (!lgNewPass||lgNewPass.length<8){setLgErr("Password must be at least 8 characters");return;}
    if (lgNewPass!==lgNewPass2){setLgErr("Passwords do not match");return;}
    setLgLoading(true); setLgErr("");
    try {
      const data = await fetch(`${API}/api/auth/reset-confirm`,{method:"POST",headers:{"Content-Type":"application/json","X-API-Secret":API_SECRET},body:JSON.stringify({token:_urlReset,password:lgNewPass})}).then(r=>r.json());
      if (data.ok) setLgStep("reset-done");
      else setLgErr(data.error||"Reset failed. Link may have expired.");
    } catch { setLgErr("Could not connect. Please try again."); }
    setLgLoading(false);
  };

  if (!authed) return (
    <div style={_LG_WRAP}>
      <div style={_LG_CARD}>
        {lgStep==="login"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <LgLogo/>
            <LgIn label="Username" autoFocus value={lgUser} onChange={v=>{setLgUser(v);setLgErr("");}} onEnter={()=>document.getElementById("lg-p").focus()} placeholder="Username" hasErr={!!lgErr}/>
            <LgIn label="Password" id="lg-p" type="password" value={lgPass} onChange={v=>{setLgPass(v);setLgErr("");}} onEnter={doLogin} placeholder="••••••••••" hasErr={!!lgErr}/>
            {lgErr&&<div style={{fontSize:12,color:"#c0392b",textAlign:"center",fontWeight:500}}>{lgErr}</div>}
            <LgBtn onClick={doLogin} disabled={lgLoading||!lgUser.trim()||!lgPass.trim()}>{lgLoading?"Signing in…":"Sign In"}</LgBtn>
            <LgLink onClick={()=>{setLgStep("forgot");setLgErr("");}}>Forgot password?</LgLink>
          </div>
        )}
        {lgStep==="forgot"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <LgLogo/>
            <div style={{fontSize:13,color:"#6e6e73",textAlign:"center",marginTop:-14,marginBottom:6}}>Enter your email to receive a reset link</div>
            <LgIn label="Email Address" type="email" autoFocus value={lgEmail} onChange={v=>{setLgEmail(v);setLgErr("");}} onEnter={doResetRequest} placeholder="Your email address" hasErr={!!lgErr}/>
            <LgBtn onClick={doResetRequest} disabled={lgLoading||!lgEmail.trim()}>{lgLoading?"Sending…":"Send Reset Link"}</LgBtn>
            <LgLink onClick={()=>{setLgStep("login");setLgErr("");}}>‹ Back to sign in</LgLink>
          </div>
        )}
        {lgStep==="forgot-sent"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:16}}>📧</div>
            <div style={{fontSize:18,fontWeight:700,color:"#1d1d1f",marginBottom:8}}>Check your inbox</div>
            <div style={{fontSize:13,color:"#6e6e73",lineHeight:1.7,marginBottom:24}}>If that email is registered, a reset link has been sent.<br/>It expires in 1 hour.</div>
            <button onClick={()=>{setLgStep("login");setLgEmail("");}} style={{padding:"11px 28px",borderRadius:11,background:"#1d1d1f",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Back to sign in</button>
          </div>
        )}
        {lgStep==="reset"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <LgLogo/>
            <div style={{fontSize:13,color:"#6e6e73",textAlign:"center",marginTop:-14,marginBottom:6}}>Choose a new password</div>
            <LgIn label="New Password" type="password" autoFocus value={lgNewPass} onChange={v=>{setLgNewPass(v);setLgErr("");}} onEnter={()=>document.getElementById("lg-p2").focus()} placeholder="At least 8 characters" hasErr={!!lgErr}/>
            <LgIn label="Confirm Password" id="lg-p2" type="password" value={lgNewPass2} onChange={v=>{setLgNewPass2(v);setLgErr("");}} onEnter={doResetConfirm} placeholder="Repeat password" hasErr={!!lgErr}/>
            {lgErr&&<div style={{fontSize:12,color:"#c0392b",textAlign:"center",fontWeight:500}}>{lgErr}</div>}
            <LgBtn onClick={doResetConfirm} disabled={lgLoading||!lgNewPass||!lgNewPass2}>{lgLoading?"Saving…":"Set New Password"}</LgBtn>
          </div>
        )}
        {lgStep==="reset-done"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:16}}>✓</div>
            <div style={{fontSize:18,fontWeight:700,color:"#1d1d1f",marginBottom:8}}>Password updated</div>
            <div style={{fontSize:13,color:"#6e6e73",marginBottom:24}}>Sign in with your new password.</div>
            <button onClick={()=>{setLgStep("login");setLgNewPass("");setLgNewPass2("");window.history.replaceState({},"","/");}} style={{padding:"11px 28px",borderRadius:11,background:"#1d1d1f",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Sign In</button>
          </div>
        )}
      </div>
    </div>
  );

  const [activeTab,setActiveTab]                         = useState("Dashboard");
  const [searches,setSearches]                           = useState({});
  const setSearch = (tab,val) => setSearches(p=>({...p,[tab]:val}));
  const getSearch = tab => searches[tab]||"";

  const [leadCat,setLeadCat]                             = useState("All");
  const [leadStatus,setLeadStatus]                       = useState("All");
  const [leadMonth,setLeadMonth]                         = useState("All");
  const [selectedLead,setSelectedLead]                   = useState(null);
  const [selectedOutreach,setSelectedOutreach]           = useState(null);
  const [leadsView,setLeadsView]                         = useState("dashboard");
  const [outreach,setOutreach]                           = useState(initOutreach);
  const [outreachMsg,setOutreachMsg]                     = useState("");
  const [outreachLoading,setOutreachLoading]             = useState(false);
  const [leadMsg,setLeadMsg]                             = useState("");
  const [leadAiLoading,setLeadAiLoading]                 = useState(false);
  const [clientMsg,setClientMsg]                         = useState("");
  const [clientAiLoading,setClientAiLoading]             = useState(false);
  const [outreachCatFilter,setOutreachCatFilter]         = useState("All");
  const [outreachStatusFilter,setOutreachStatusFilter]   = useState("All");
  const [outreachMonthFilter,setOutreachMonthFilter]     = useState("All");

  const [vendors,setVendors]                         = useState(initVendors);
  const [bbCat,setBbCat]                                 = useState("All");
  const [bbLocation,setBbLocation]                       = useState("All");
  const [showRateModal,setShowRateModal]                 = useState(null);
  const [rateInput,setRateInput]                         = useState("");
  const [editVendor,setEditVendor]                       = useState(null);

  const [projectYear,setProjectYear]                     = useState(2026);
  const [selectedProject,setSelectedProject]             = useState(null);
  const [projectSection,setProjectSection]               = useState("Home");
  const [projectEntries,setProjectEntries]               = useState({});
  const [aiMsg,setAiMsg]                                 = useState("");
  const [aiLoading,setAiLoading]                         = useState(false);
  const [attachedFile,setAttachedFile]                   = useState(null);
  const [projectFiles,setProjectFiles]                   = useState({});
  const [projectCasting,setProjectCasting]               = useState({});
  const [projectLocLinks,setProjectLocLinks]             = useState({});
  const [projectContracts,setProjectContracts]           = useState({});
  const [projectEstimates,setProjectEstimates]           = useState({1:[{...initColumbiaEstimate,id:1,version:"V1"}]});
  const [projectNotes,setProjectNotes]                   = useState({});
  const [editingEstimate,setEditingEstimate]             = useState(null);
  const [contractType,setContractType]                   = useState(CONTRACT_TYPES[0]);
  const [contractFields,setContractFields]               = useState({commissionee:"",individual:"",role:"",fee:"",shootDate:"",deliverables:"",usageRights:"",paymentTerms:"NET 30 days",deadline:"",projectRef:""});
  const [generatedContract,setGeneratedContract]         = useState("");
  const [contractLoading,setContractLoading]             = useState(false);

  const [showAddProject,setShowAddProject]   = useState(false);
  const [showAddLead,setShowAddLead]         = useState(false);
  const [showAddVendor,setShowAddVendor]     = useState(false);
  const [showArchive,setShowArchive]         = useState(false);
  const [archive,setArchive]                 = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_archive')||'[]')}catch{return []}});
  const [newProject,setNewProject]           = useState({client:"",name:"",revenue:"",cost:"",status:"Active",year:2026});
  const [newLead,setNewLead]                 = useState({company:"",contact:"",email:"",phone:"",role:"",date:"",source:"Referral",status:"not_contacted",value:"",category:"Production Companies",location:"Dubai, UAE"});
  const [newVendor,setNewVendor]             = useState({name:"",category:"Locations",email:"",phone:"",website:"",location:"Dubai, UAE",notes:"",rateCard:""});
  const [localProjects,setLocalProjects]     = useState(SEED_PROJECTS);
  const [localLeads,setLocalLeads]           = useState(SEED_LEADS);
  const [localClients,setLocalClients]       = useState(SEED_CLIENTS);
  const [apiLoading,setApiLoading]           = useState(true);
  const [apiError,setApiError]               = useState(null);
  const [leadStatusOverrides,setLeadStatusOverrides] = useState({});
  const [customLeadLocs,setCustomLeadLocs]   = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_lead_locs')||'[]')}catch{return []}});
  const [customLeadCats,setCustomLeadCats]   = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_lead_cats')||'[]')}catch{return []}});
  const [customVendorCats,setCustomVendorCats] = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_vendor_cats')||'[]')}catch{return []}});
  const [customVendorLocs,setCustomVendorLocs] = useState(()=>{try{return JSON.parse(localStorage.getItem('onna_vendor_locs')||'[]')}catch{return []}});
  const [projectTodos,setProjectTodos] = useState(()=>{try{const s=localStorage.getItem('onna_ptodos');return s?JSON.parse(s):{}}catch(e){return {}}});
  const [archivedProjects,setArchivedProjects] = useState([]);
  const [archivedTodos,setArchivedTodos]     = useState([]);
  const [todoDropdownOpen,setTodoDropdownOpen] = useState(false);
  const [todoDropdownProject,setTodoDropdownProject] = useState(null);

  const [todos,setTodos] = useState(()=>{try{const s=localStorage.getItem('onna_todos');return s?JSON.parse(s):[]}catch(e){return []}});
  const [newTodo,setNewTodo]         = useState("");
  const [todoFilter,setTodoFilter]   = useState("all");
  const [selectedTodo,setSelectedTodo] = useState(null);
  useEffect(()=>{try{localStorage.setItem('onna_todos',JSON.stringify(todos))}catch(e){}},[todos]);
  useEffect(()=>{try{localStorage.setItem('onna_ptodos',JSON.stringify(projectTodos))}catch(e){}},[projectTodos]);

  // ── Load all data from backend ───────────────────────────────────────────
  useEffect(()=>{
    let cancelled = false;
    Promise.all([
      api.get("/api/projects"),
      api.get("/api/leads"),
      api.get("/api/clients"),
      api.get("/api/vendors"),
      api.get("/api/outreach"),
    ]).then(async ([projects, leads, clients, vendors, outreach])=>{
      if (cancelled) return;
      if (Array.isArray(projects) && projects.length > 0) setLocalProjects(projects);
      if (Array.isArray(leads)    && leads.length > 0)    setLocalLeads(leads);
      if (Array.isArray(vendors)  && vendors.length > 0)  setVendors(vendors);
      if (Array.isArray(outreach) && outreach.length > 0) setOutreach(outreach);

      // Retroactive sync: find any leads/outreach with status="client" that have no client record yet
      const existingClients = Array.isArray(clients) ? clients : [];
      const knownCompanies  = new Set(existingClients.map(c=>(c.company||"").trim().toLowerCase()));
      const allEntities     = [
        ...(Array.isArray(outreach)?outreach:[]).map(o=>({company:o.company,name:o.clientName||"",email:o.email||"",phone:o.phone||"",country:o.location||"",notes:o.notes||"",status:o.status})),
        ...(Array.isArray(leads)?leads:[]).map(l=>({company:l.company,name:l.contact||"",email:l.email||"",phone:l.phone||"",country:l.location||"",notes:l.notes||"",status:l.status})),
      ];
      const toCreate = allEntities.filter(e=>e.status==="client"&&e.company&&!knownCompanies.has(e.company.trim().toLowerCase()));
      // Dedupe by company within toCreate
      const seen = new Set();
      const unique = toCreate.filter(e=>{const k=e.company.trim().toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
      const newlyCreated = (await Promise.all(unique.map(e=>api.post("/api/clients",{company:e.company,name:e.name,email:e.email,phone:e.phone,country:e.country,notes:e.notes})))).filter(r=>r.id);
      setLocalClients([...existingClients,...newlyCreated]);

      setApiLoading(false);
    }).catch(()=>setApiLoading(false));
    return ()=>{ cancelled=true; };
  },[]);

  const projStatusColor = {Active:"#147d50","In Review":"#92680a",Completed:T.muted};
  const projStatusBg    = {Active:"#edfaf3","In Review":"#fff8e8",Completed:"#f5f5f7"};

  const allProjectsMerged = localProjects.filter(p=>!archivedProjects.find(a=>a.id===p.id));
  const projects2026  = allProjectsMerged.filter(p=>p.year===2026);
  const rev2026       = projects2026.reduce((a,b)=>a+b.revenue,0);
  const profit2026    = projects2026.reduce((a,b)=>a+(b.revenue-b.cost),0);
  const totalPipeline = localLeads.reduce((a,b)=>a+b.value,0);
  const newCount      = localLeads.filter(l=>l.status==="not_contacted"||l.status==="cold").length;
  const activeProjects= allProjectsMerged.filter(p=>p.status==="Active");
  const projects      = allProjectsMerged.filter(p=>p.year===projectYear);
  const projRev       = projects.reduce((a,b)=>a+b.revenue,0);
  const projProfit    = projects.reduce((a,b)=>a+(b.revenue-b.cost),0);
  const projMargin    = projRev>0?Math.round((projProfit/projRev)*100):0;

  const allLeadsMerged = localLeads.map(l=>leadStatusOverrides[l.id]?{...l,status:leadStatusOverrides[l.id]}:l);
  // Merge outreach into leads, deduplicating by company name so nothing appears twice
  const _outreachKeys = new Set(outreach.map(o=>o.company.trim().toLowerCase()));
  const _pureLeads    = allLeadsMerged.filter(l=>!_outreachKeys.has(l.company.trim().toLowerCase()));
  const _outreachAsLeads = outreach.map(o=>({id:o.id,_fromOutreach:true,company:o.company,contact:o.clientName,role:o.role,email:o.email,category:o.category,status:o.status,date:o.date,value:o.value,location:o.location,notes:o.notes,phone:o.phone}));
  const allLeadsCombined = [..._pureLeads,..._outreachAsLeads];
  const leadMonths = ["All",...Array.from(new Set(allLeadsCombined.map(l=>getMonthLabel(l.date)).filter(Boolean)))];
  const filteredLeads = useMemo(()=>{
    const q=getSearch("Leads").toLowerCase();
    return allLeadsCombined.filter(l=>(!q||l.company.toLowerCase().includes(q)||(l.contact||"").toLowerCase().includes(q)||(l.role||"").toLowerCase().includes(q)||(l.email||"").toLowerCase().includes(q))&&(leadCat==="All"||l.category===leadCat)&&(leadStatus==="All"||l.status===leadStatus)&&(leadMonth==="All"||getMonthLabel(l.date)===leadMonth));
  },[searches,leadCat,leadStatus,leadMonth,localLeads,outreach]);

  const filteredBB = vendors.filter(b=>(bbCat==="All"||b.category===bbCat)&&(bbLocation==="All"||b.location===bbLocation)&&(!getSearch("Vendors")||b.name.toLowerCase().includes(getSearch("Vendors").toLowerCase())));

  const outreachCategories = ["All",...Array.from(new Set(outreach.map(o=>o.category).filter(Boolean)))];
  const outreachMonths     = ["All",...Array.from(new Set(outreach.map(o=>getMonthLabel(o.date)).filter(Boolean)))];
  const filteredOutreach   = outreach.filter(o=>{
    const q=getSearch("Outreach").toLowerCase();
    return (!q||o.company.toLowerCase().includes(q)||o.clientName.toLowerCase().includes(q))&&(outreachCatFilter==="All"||o.category===outreachCatFilter)&&(outreachStatusFilter==="All"||o.status===outreachStatusFilter)&&(outreachMonthFilter==="All"||getMonthLabel(o.date)===outreachMonthFilter);
  });

  // Merge all project todos into a flat list for master view
  const allProjectTodosFlat = Object.entries(projectTodos).flatMap(([pid,tlist])=>
    (tlist||[]).map(t=>({...t,type:"project",projectId:Number(pid)}))
  );
  const allTodos = [
    ...todos.filter(t=>!archivedTodos.find(a=>a.id===t.id)),
    ...allProjectTodosFlat.filter(t=>!archivedTodos.find(a=>a.id===t.id))
  ];
  const filteredTodos = allTodos.filter(t=>{
    if (todoFilter==="all") return true;
    if (todoFilter==="general") return t.type!=="project";
    if (todoFilter==="general-now") return t.type!=="project" && t.subType==="now";
    if (todoFilter==="general-later") return t.type!=="project" && t.subType==="later";
    if (todoFilter==="general-longterm") return t.type!=="project" && t.subType==="longterm";
    if (todoFilter==="project") return t.type==="project";
    if (todoFilter.startsWith("project-")) return t.projectId===Number(todoFilter.replace("project-",""));
    return true;
  });
  const todoTopFilter = todoFilter.startsWith("general")||todoFilter==="general"?"general":todoFilter.startsWith("project")||todoFilter==="project"?"project":"all";

  const getProjectFiles    = (id,key) => (projectFiles[id]||{})[key]||[];
  const addProjectFiles    = (id,key,newFiles) => setProjectFiles(prev=>({...prev,[id]:{...(prev[id]||{}),[key]:[...getProjectFiles(id,key),...newFiles]}}));
  const getProjectCasting  = id => projectCasting[id]||[];
  const addCastingRow      = id => setProjectCasting(prev=>({...prev,[id]:[...(prev[id]||[]),{id:Date.now(),agency:"",name:"",email:"",option:"First Option"}]}));
  const updateCastingRow   = (id,rowId,field,val) => setProjectCasting(prev=>({...prev,[id]:(prev[id]||[]).map(r=>r.id===rowId?{...r,[field]:val}:r)}));
  const removeCastingRow   = (id,rowId) => setProjectCasting(prev=>({...prev,[id]:(prev[id]||[]).filter(r=>r.id!==rowId)}));

  const _aiSystem = `Extract contact info and return ONLY a raw JSON array with no markdown. Each item: {"company":"","clientName":"","role":"","email":"","phone":"","date":"YYYY-MM-DD","category":"","location":"","source":"Cold Outreach","notes":""}. Use location format like "Dubai, UAE" or "London, UK". If no date, use today's date.`;

  const processOutreach = async () => {
    if (!outreachMsg.trim()) return;
    setOutreachLoading(true);
    try {
      const data = await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:800,system:_aiSystem,messages:[{role:"user",content:outreachMsg}]});
      const parsed = JSON.parse((data?.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
      const entries = (Array.isArray(parsed)?parsed:[parsed]).map(e=>({...e,status:"not_contacted",value:0}));
      const saved = await Promise.all(entries.map(e=>api.post("/api/outreach",e)));
      const newOutreach = saved.filter(e=>e.id);
      setOutreach(prev=>[...prev,...newOutreach]);
      setOutreachMsg("");
    } catch {}
    setOutreachLoading(false);
  };

  const processLeadAI = async () => {
    if (!leadMsg.trim()) return;
    setLeadAiLoading(true);
    try {
      const data = await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:800,system:_aiSystem,messages:[{role:"user",content:leadMsg}]});
      const parsed = JSON.parse((data?.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
      const entries = (Array.isArray(parsed)?parsed:[parsed]).map(e=>({...e,status:"not_contacted",value:0}));
      const saved = await Promise.all(entries.map(e=>api.post("/api/outreach",e)));
      const newOutreach = saved.filter(e=>e.id);
      setOutreach(prev=>[...prev,...newOutreach]);
      setLeadMsg("");
    } catch {}
    setLeadAiLoading(false);
  };

  // Promote a lead/outreach entry to a client record when status → "client"
  const promoteToClient = async (entity) => {
    const company = (entity.company||"").trim();
    if (!company) return;
    if (localClients.some(c=>(c.company||"").toLowerCase()===company.toLowerCase())) return;
    const newClient = {
      company,
      name: entity.contact||entity.clientName||"",
      email: entity.email||"",
      phone: entity.phone||"",
      country: entity.location||"",
      notes: entity.notes||"",
    };
    const saved = await api.post("/api/clients", newClient);
    if (saved.id) setLocalClients(prev=>[...prev,saved]);
  };

  const processClientAI = async () => {
    if (!clientMsg.trim()) return;
    setClientAiLoading(true);
    try {
      const sys = `Extract client info and return ONLY a raw JSON array with no markdown. Each item: {"company":"","name":"","email":"","phone":"","country":"","notes":""}. country = location like "Dubai, UAE".`;
      const data = await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:600,system:sys,messages:[{role:"user",content:clientMsg}]});
      const parsed = JSON.parse((data?.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
      const entries = Array.isArray(parsed)?parsed:[parsed];
      const saved = await Promise.all(entries.map(e=>api.post("/api/clients",e)));
      saved.filter(e=>e.id).forEach(e=>setLocalClients(prev=>[...prev,e]));
      setClientMsg("");
    } catch {}
    setClientAiLoading(false);
  };

  const processProjectAI = async p => {
    if (!aiMsg.trim()&&!attachedFile) return;
    setAiLoading(true);
    let fileData=null;
    if (attachedFile) fileData = await new Promise(resolve=>{const r=new FileReader();r.onload=e=>resolve(e.target.result.split(",")[1]);r.readAsDataURL(attachedFile);});
    const messages=[{role:"user",content:attachedFile?[{type:"image",source:{type:"base64",media_type:attachedFile.type,data:fileData}},{type:"text",text:`${aiMsg}\n\nExtract all financial info and return ONLY a JSON array, no markdown.`}]:aiMsg}];
    try {
      const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:1200,system:"Extract expense/income entries for ONNA. Return ONLY a raw JSON array. Each entry: supplier, category, subCategory, invoiceNumber, receiptLink, datePaid, amount (number only), direction (in/out), notes.",messages});
      const parsed=JSON.parse((data?.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
      setProjectEntries(prev=>({...prev,[p.id]:[...(prev[p.id]||[]),...(Array.isArray(parsed)?parsed:[parsed]).map((e,i)=>({...e,id:Date.now()+i}))]}));
      setAiMsg(""); setAttachedFile(null);
    } catch {}
    setAiLoading(false);
  };

  const generateContract = async p => {
    setContractLoading(true); setGeneratedContract("");
    const templates = {
      "Commissioning Agreement – Self Employed":`You are generating a COMMISSIONING AGREEMENT for ONNA. Fill in ALL fields with the provided details and output a complete, professional agreement. Structure:\n\nONNA\nCOMMISSIONING AGREEMENT\n\nCOMMERCIAL TERMS\nCommencement Date: [date]\nCommissioner: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nCommissionee: [commissionee name]\nRole/Services: [role]\nProject: [project]\nDeadline: [deadline]\nFee: [fee]\nPayment Terms: [payment terms]\nDeliverables: [deliverables]\nUsage Rights: [usage rights]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by Commissionee: _______________  Date: ______\n\nGENERAL TERMS\n[Include all standard ONNA general terms: IP assignment, confidentiality, warranties, indemnity, termination, force majeure, governing law — Dubai courts]`,
      "Commissioning Agreement – Via PSC":`Generate a COMMISSIONING AGREEMENT VIA PSC for ONNA. Commercial terms:\n\nONNA\nCOMMISSIONING AGREEMENT – VIA PSC\n\nCOMMERCIAL TERMS\nCommencement Date: [date]\nCommissioner: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nCommissionee (PSC): [commissionee name]\nIndividual: [individual name]\nRole/Services: [role]\nProject: [project]\nDeadline: [deadline]\nFee: [fee]\nPayment Terms: [payment terms]\nDeliverables: [deliverables]\nUsage Rights: [usage rights]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by PSC: _______________  Date: ______\n\nGENERAL TERMS\n[Include all standard PSC terms: IP assignment by PSC and Individual jointly, confidentiality, warranties, joint indemnity, termination, governing law — Dubai]`,
      "Talent Agreement":`Generate a TALENT AGREEMENT for ONNA. Structure:\n\nONNA\nTALENT AGREEMENT – COMMERCIAL TERMS\n\nCommencement Date: [date]\nAgency: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nClient/Brand: [project client]\nTalent Name: [commissionee]\nRole/Services: [role]\nShoot Date: [shoot date]\nFee: [fee]\nPayment Terms: NET 60 days from invoice\nDeliverables/Usage: [usage rights]\nDeadline: [deadline]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by Talent/Agent: _______________  Date: ______\n\nGENERAL TERMS\n[Include: commencement, supply of services, warranties, image waiver, IP assignment, charges/payment, termination, governing law — Dubai/UK]`,
      "Talent Agreement – Via PSC":`Generate a TALENT AGREEMENT VIA PSC for ONNA. Structure:\n\nONNA\nTALENT AGREEMENT VIA PSC – COMMERCIAL TERMS\n\nCommencement Date: [date]\nAgency: ONNA FILM TV RADIO PRODUCTION SERVICES LLC\nClient/Brand: [project client]\nPSC Name: [commissionee]\nTalent Name: [individual]\nRole/Services: [role]\nShoot Date: [shoot date]\nFee: [fee]\nDeliverables/Usage: [usage rights]\n\nSIGNATURE\nSigned for ONNA: _______________  Date: ______\nSigned by PSC: _______________  Date: ______\n\nGENERAL TERMS\n[Include PSC-specific terms: PSC procures talent compliance, joint IP assignment, image waiver, indemnity, payment via PSC, governing law — Dubai/UK]`,
    };
    try {
      const data=await api.post("/api/ai",{model:"claude-sonnet-4-6",max_tokens:2000,system:templates[contractType]||templates["Commissioning Agreement – Self Employed"],messages:[{role:"user",content:`Generate the contract with these details:\nProject: ${p.client} — ${p.name}\nCommissionee: ${contractFields.commissionee}\nIndividual: ${contractFields.individual}\nRole: ${contractFields.role}\nFee: ${contractFields.fee}\nShoot Date: ${contractFields.shootDate}\nDeliverables: ${contractFields.deliverables}\nUsage Rights: ${contractFields.usageRights}\nPayment Terms: ${contractFields.paymentTerms}\nDeadline: ${contractFields.deadline}\nProject Ref: ${contractFields.projectRef}`}]});
      setGeneratedContract(data?.content?.[0]?.text || data?.error || "No output received.");
    } catch(e) { setGeneratedContract("Error: " + e.message); }
    setContractLoading(false);
  };

  const riskSystemPrompt = `You are a production coordinator for ONNA (Dubai & London). Generate a Risk Assessment using markdown tables.\n\nFormat:\nRISK ASSESSMENT\nSHOOT NAME: [name]\nSHOOT DATE: [date]\nLOCATION: [location]\nCREW ON SET: [number]\nTIMING: [times]\n\n1. ENVIRONMENTAL & TERRAIN RISKS\n| Hazard | Risk Level | Who is at Risk | Mitigation Strategy |\n|--------|------------|----------------|---------------------|\n\n2. [SHOOT-SPECIFIC SECTION]\n| Hazard | Risk Level | Who is at Risk | Mitigation Strategy |\n|--------|------------|----------------|---------------------|\n\n3. TECHNICAL EQUIPMENT RISKS\n| Hazard | Risk Level | Who is at Risk | Mitigation Strategy |\n|--------|------------|----------------|---------------------|\n\n4. BRAND & PRIVACY\n| Hazard | Risk Level | Who is at Risk | Control Measures |\n|--------|------------|----------------|------------------|\n\n5. PROFESSIONAL CODE OF CONDUCT\n• Client Relations, Anti-Harassment (Zero Tolerance), General Conduct\n\n6. LIABILITY WAIVER\n• Transport, Health, Safety Gear\n\nEMERGENCY RESPONSE PLAN\n| Contact | Details |\n|---------|---------|\n| Emergency | 999 / 998 / 997 |\n| Production Lead (Emily) | +971 585 608 616 |\n\n@ONNAPRODUCTION | DUBAI & LONDON`;

  const callSheetSystemPrompt = `You are a production coordinator for ONNA. Generate a Call Sheet using markdown tables.\n\nCALL SHEET\n**ALL CREW MUST BRING VALID EMIRATES ID TO SET**\n\nSHOOT NAME: [name]\nSHOOT DATE: [date]\nSHOOT ADDRESS: [address]\n\nPRODUCTION ON SET: EMILY LUCAS +971 585 608 616\n\nSCHEDULE\n| Time | Activity |\n|------|-----------|\n\nCREW\n| Role | Name | Mobile | Email | Call Time |\n|------|------|--------|-------|-----------|\n| PRODUCER | EMILY LUCAS | +971 585 608 616 | EMILY@ONNAPRODUCTION.COM | [time] |\n\nINVOICING\n| | |\n|-|-|\n| Payment Terms | NET 30 days |\n| Send To | accounts@onnaproduction.com |\n| Billing | ONNA FILM, TV & RADIO PRODUCTION SERVICES LLC., OFFICE F1-022, DUBAI |\n\nEMERGENCY SERVICES\n| Service | Contact |\n|---------|---------|\n| Police/Ambulance/Fire | 999 / 998 / 997 |\n\n@ONNAPRODUCTION | DUBAI & LONDON`;

  const changeTab = tab => { setActiveTab(tab); setSelectedProject(null); setProjectSection("Home"); };

  // ── Add-new helper for dynamic dropdowns ──────────────────────────────────
  const addNewOption = (currentList, setter, storageKey, prompt_label) => {
    const val = window.prompt(prompt_label);
    if (!val || !val.trim()) return null;
    const trimmed = val.trim();
    if (currentList.includes(trimmed)) return trimmed;
    const updated = [...currentList, trimmed];
    setter(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
    return trimmed;
  };

  // Remove custom options that are no longer used by any item
  const pruneCustom = (items, fieldName, customList, setter, storageKey) => {
    const used = new Set(items.map(i=>i[fieldName]).filter(Boolean));
    const pruned = customList.filter(opt=>used.has(opt));
    if (pruned.length !== customList.length) {
      setter(pruned);
      try { localStorage.setItem(storageKey, JSON.stringify(pruned)); } catch {}
    }
  };

  // ── Archive helpers ──────────────────────────────────────────────────────────
  const archiveItem = (table, item) => {
    const entry = {id:Date.now(), table, item, deletedAt:new Date().toISOString()};
    setArchive(prev=>{
      const updated=[entry,...prev];
      try{localStorage.setItem('onna_archive',JSON.stringify(updated));}catch{}
      return updated;
    });
  };

  const restoreItem = async (entry) => {
    const {id:archiveId, table, item} = entry;
    const {id:_origId, ...fields} = item;
    const saved = await api.post(`/api/${table}`, fields);
    if (saved.id) {
      if (table==='leads') setLocalLeads(prev=>[...prev,saved]);
      else if (table==='vendors') setVendors(prev=>[...prev,saved]);
      else if (table==='outreach') setOutreach(prev=>[...prev,saved]);
    }
    setArchive(prev=>{
      const updated=prev.filter(e=>e.id!==archiveId);
      try{localStorage.setItem('onna_archive',JSON.stringify(updated));}catch{}
      return updated;
    });
  };

  const permanentlyDelete = (archiveId) => {
    setArchive(prev=>{
      const updated=prev.filter(e=>e.id!==archiveId);
      try{localStorage.setItem('onna_archive',JSON.stringify(updated));}catch{}
      return updated;
    });
  };

  const allLeadLocs  = ["All","London, UK","Dubai, UAE","New York, USA","Los Angeles, USA",...customLeadLocs,"＋ Add location"];
  const allLeadCats  = [...LEAD_CATEGORIES,...customLeadCats,"＋ Add category"];
  const allVendorCats = ["All",...VENDORS_CATEGORIES,...customVendorCats,"＋ Add category"];
  const allVendorLocs = [...BB_LOCATIONS,...customVendorLocs,"＋ Add location"];

  // ─── PROJECT SECTION RENDERER ──────────────────────────────────────────────
  const renderProjectSection = p => {
    const entries    = projectEntries[p.id]||[];
    const quotes     = getProjectFiles(p.id,"quotes");
    const allEntries = [...entries,...quotes.map((f,i)=>({id:`q_${i}`,supplier:f.name,category:"Quote",subCategory:"",invoiceNumber:"",receiptLink:"",datePaid:"",amount:"",direction:"out",notes:"Uploaded quote"}))];
    const totalIn    = entries.filter(e=>e.direction==="in").reduce((a,b)=>a+Number(b.amount),0);
    const totalOut   = entries.filter(e=>e.direction==="out").reduce((a,b)=>a+Number(b.amount),0);
    const profit     = totalIn-totalOut;
    const margin     = totalIn>0?Math.round((profit/totalIn)*100):0;

    const SECTION_META = {
      "Finances":       {emoji:"💰",count:`${entries.length} transactions`},
      "Creative Brief": {emoji:"🎨",count:`${getProjectFiles(p.id,"briefs").length} files`},
      "Estimates":      {emoji:"📋",count:`${(projectEstimates[p.id]||[]).length} version(s)`},
      "Contracts":      {emoji:"📝",count:"Generate contract"},
      "Quotes":         {emoji:"💬",count:`${quotes.length} quote(s)`},
      "Locations":      {emoji:"📍",count:"Add folder link"},
      "Casting":        {emoji:"🎭",count:`${getProjectCasting(p.id).length} models`},
      "Permits":        {emoji:"📜",count:`${getProjectFiles(p.id,"permits").length} files`},
      "Styling":        {emoji:"👗",count:`${getProjectFiles(p.id,"styling").length} files`},
      "Call Sheet":     {emoji:"📞",count:"Generate call sheet"},
      "Risk Assessment":{emoji:"⚠️",count:"Generate risk assessment"},
      "Workbook":       {emoji:"📒",count:"Notes & links"},
    };

    // mini stat card used in project sections
    const MiniStat = ({label,value}) => (
      <div style={{borderRadius:14,padding:"18px 20px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6,fontWeight:500}}>{label}</div>
        <div style={{fontSize:22,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>{value}</div>
      </div>
    );

    if (projectSection==="Home") return (
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:28}}>
          {[["Total Revenue",`AED ${totalIn.toLocaleString()}`,"income"],["Total Expenses",`AED ${totalOut.toLocaleString()}`,"outgoings"],["Net Profit",`AED ${profit.toLocaleString()}`,"revenue − expenses"],["Margin",`${margin}%`,"net / revenue"]].map(([l,v,s])=>(
            <div key={l} style={{borderRadius:16,padding:"20px 22px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8,fontWeight:500}}>{l}</div>
              <div style={{fontSize:24,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:3}}>{v}</div>
              <div style={{fontSize:11,color:T.muted}}>{s}</div>
            </div>
          ))}
        </div>
        {/* Project To-Do List */}
        <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:24,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",gap:8,background:"#fafafa"}}>
            <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,flex:1}}>Project To-Do</span>
            <span style={{fontSize:11,color:T.muted}}>{(projectTodos[p.id]||[]).filter(t=>!archivedTodos.find(a=>a.id===t.id)&&!t.done).length} open</span>
          </div>
          <ProjectTodoList projectId={p.id} projectTodos={projectTodos} setProjectTodos={setProjectTodos} archivedTodos={archivedTodos} setArchivedTodos={setArchivedTodos}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {PROJECT_SECTIONS.filter(s=>s!=="Home").map(sec=>{
            const meta=SECTION_META[sec]||{emoji:"📁",count:"Click to open"};
            return (
              <div key={sec} onClick={()=>setProjectSection(sec)} className="proj-card" style={{borderRadius:14,padding:"16px 18px",background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <span style={{fontSize:20,flexShrink:0}}>{meta.emoji}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:500,color:T.text,marginBottom:2}}>{sec}</div>
                  <div style={{fontSize:11,color:T.muted}}>{meta.count}</div>
                </div>
                <span style={{marginLeft:"auto",color:T.muted,fontSize:14,flexShrink:0}}>›</span>
              </div>
            );
          })}
        </div>
      </div>
    );

    if (projectSection==="Finances") return (
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
          <MiniStat label="Total Revenue"   value={`AED ${totalIn.toLocaleString()}`}/>
          <MiniStat label="Total Expenses"  value={`AED ${totalOut.toLocaleString()}`}/>
          <MiniStat label="Net Profit"      value={`AED ${profit.toLocaleString()}`}/>
          <MiniStat label="Margin"          value={`${margin}%`}/>
        </div>
        <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.borderSub}`,fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",background:"#fafafa",fontWeight:600}}>Add Entry — describe a transaction or attach a receipt</div>
          <div style={{padding:"13px 16px"}}>
            <textarea value={aiMsg} onChange={e=>setAiMsg(e.target.value)} rows={2} placeholder={`e.g. "Paid Frndz Studio AED 8,500 for camera crew 15 Feb, invoice FRNDZ-042"`} style={{width:"100%",background:"#fafafa",border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 13px",color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",marginBottom:10,lineHeight:"1.6"}}/>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <label style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.sub,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                📎 {attachedFile?attachedFile.name:"Attach receipt"}<input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>setAttachedFile(e.target.files[0]||null)}/>
              </label>
              {attachedFile&&<button onClick={()=>setAttachedFile(null)} style={{background:"none",border:"none",color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>× remove</button>}
              <BtnPrimary onClick={()=>processProjectAI(p)} disabled={aiLoading||(!aiMsg.trim()&&!attachedFile)}>{aiLoading?"Processing…":"Add to table"}</BtnPrimary>
            </div>
          </div>
        </div>
        <div style={{marginBottom:12}}><SearchBar value={getSearch("Finance")} onChange={v=>setSearch("Finance",v)} placeholder="Search transactions…"/></div>
        <div style={{borderRadius:14,overflow:"hidden",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Supplier","Category","Sub Category","Invoice No.","Receipt","Date Paid","Amount","In/Out","Notes",""].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
            <tbody>
              {allEntries.filter(e=>!getSearch("Finance")||e.supplier?.toLowerCase().includes(getSearch("Finance").toLowerCase())).length===0
                ?<tr><td colSpan={10} style={{padding:44,textAlign:"center",color:T.muted,fontSize:13}}>No entries yet — describe a transaction above.</td></tr>
                :allEntries.filter(e=>!getSearch("Finance")||e.supplier?.toLowerCase().includes(getSearch("Finance").toLowerCase())).map((e,i)=>(
                  <tr key={e.id} style={{background:i%2===0?"transparent":"#fafafa"}}>
                    <TD bold>{e.supplier||"—"}</TD><TD>{e.category||"—"}</TD><TD muted>{e.subCategory||"—"}</TD><TD muted>{e.invoiceNumber||"—"}</TD>
                    <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}>{e.receiptLink?<a href={e.receiptLink} target="_blank" rel="noreferrer" style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>View ↗</a>:<span style={{color:T.muted,fontSize:12.5}}>—</span>}</td>
                    <TD muted>{e.datePaid||"—"}</TD>
                    <TD bold>{e.amount?`AED ${Number(e.amount).toLocaleString()}`:"—"}</TD>
                    <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}><span style={{fontSize:11,padding:"2px 8px",borderRadius:999,fontWeight:500,background:e.direction==="in"?T.inBg:T.outBg,color:e.direction==="in"?T.inColor:T.outColor}}>{e.direction==="in"?"IN":"OUT"}</span></td>
                    <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,maxWidth:160}}><span style={{fontSize:12.5,color:T.muted,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.notes||"—"}</span></td>
                    <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}>{!String(e.id).startsWith("q_")&&<button onClick={()=>setProjectEntries(prev=>({...prev,[p.id]:(prev[p.id]||[]).filter(x=>x.id!==e.id)}))} style={{background:"none",border:"none",color:T.muted,fontSize:15,cursor:"pointer",padding:0}}>×</button>}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    if (projectSection==="Creative Brief") return (
      <div><p style={{fontSize:13,color:T.sub,marginBottom:18}}>Upload mood boards, creative briefs, references and creative documents for this project.</p>
      <UploadZone label="Upload briefs & mood boards (PDF, images)" files={getProjectFiles(p.id,"briefs")} onAdd={f=>addProjectFiles(p.id,"briefs",f)}/></div>
    );

    if (projectSection==="Estimates") {
      const estimates    = projectEstimates[p.id]||[];
      const versionLabels= ["V1","V2","V3","V4","V5"];
      if (editingEstimate) {
        const est      = editingEstimate;
        const subtotal = est.lineItems.filter(l=>l.cat!=="18").reduce((a,b)=>a+Number(b.aed),0);
        const fees     = est.lineItems.filter(l=>l.cat==="18").reduce((a,b)=>a+Number(b.aed),0);
        const total    = subtotal+fees; const vat=total*0.05; const grand=total+vat; const advance=grand*0.5;
        return (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
              <button onClick={()=>setEditingEstimate(null)} style={{background:"none",border:"none",color:T.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,display:"flex",alignItems:"center",gap:4,fontWeight:500}}>‹ Back</button>
              <span style={{fontSize:12,color:T.muted}}>Editing {est.version}</span>
              <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                <BtnSecondary onClick={()=>navigator.clipboard.writeText(generateEstimateText(est,subtotal,fees,total,vat,grand,advance))}>Copy</BtnSecondary>
                <BtnExport onClick={()=>exportToPDF(buildEstimateHTML(est),`Production Estimate ${est.version} — ${est.project||p.name}`)}>Export PDF</BtnExport>
                <BtnPrimary onClick={()=>{const id=Date.now();const nextV=versionLabels[estimates.length]||`V${estimates.length+1}`;setProjectEstimates(prev=>({...prev,[p.id]:[...(prev[p.id]||[]),{...est,id,version:nextV}]}));setEditingEstimate(null);}}>Save as {versionLabels[estimates.length]||`V${estimates.length+1}`}</BtnPrimary>
              </div>
            </div>
            <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,padding:20,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[["Date","date"],["Client","client"],["Project","project"],["Attention","attention"],["Photographer / Director","photographer"],["Deliverables","deliverables"],["Deadlines","deadlines"],["Usage Terms","usageTerms"],["Shoot Date","shootDate"],["Shoot Location","shootLocation"],["Payment Terms","paymentTerms"]].map(([label,key])=>(
                  <div key={key}>
                    <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5,fontWeight:500}}>{label}</div>
                    <input value={est[key]||""} onChange={e=>setEditingEstimate(prev=>({...prev,[key]:e.target.value}))} style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                  </div>
                ))}
              </div>
            </div>
            <div style={{borderRadius:14,overflow:"hidden",background:T.surface,border:`1px solid ${T.border}`,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><TH>#</TH><TH>Category</TH><TH>AED</TH><TH>USD (×0.27)</TH></tr></thead>
                <tbody>
                  {est.lineItems.map((li,idx)=>(
                    <tr key={li.cat} style={{background:idx%2===0?"transparent":"#fafafa"}}>
                      <TD muted>{li.cat}</TD><TD bold>{li.name}</TD>
                      <td style={{padding:"9px 14px",borderBottom:`1px solid ${T.borderSub}`}}>
                        <input type="number" value={li.aed} onChange={e=>setEditingEstimate(prev=>({...prev,lineItems:prev.lineItems.map((l,i)=>i===idx?{...l,aed:Number(e.target.value)}:l)}))} style={{width:120,padding:"6px 9px",borderRadius:8,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit"}}/>
                      </td>
                      <TD muted>{li.aed?(li.aed*0.27).toLocaleString(undefined,{maximumFractionDigits:2}):"—"}</TD>
                    </tr>
                  ))}
                  <tr style={{background:"#f5f5f7"}}><td colSpan={2} style={{padding:"11px 14px",fontSize:12.5,fontWeight:600,color:T.text,borderTop:`1px solid ${T.border}`}}>SUBTOTAL</td><TD bold>AED ${total.toLocaleString()}</TD><TD muted>${(total*0.27).toLocaleString(undefined,{maximumFractionDigits:0})}</TD></tr>
                  <tr><td colSpan={2} style={{padding:"11px 14px",fontSize:12.5,color:T.sub}}>VAT (5%)</td><TD muted>AED ${vat.toLocaleString(undefined,{maximumFractionDigits:2})}</TD><TD muted/></tr>
                  <tr style={{background:T.accent}}><td colSpan={2} style={{padding:"11px 14px",fontSize:13,fontWeight:700,color:"#fff"}}>GRAND TOTAL</td><td style={{padding:"11px 14px",fontSize:13,fontWeight:700,color:"#fff"}}>AED ${grand.toLocaleString(undefined,{maximumFractionDigits:2})}</td><td style={{padding:"11px 14px",fontSize:12,color:"rgba(255,255,255,0.7)"}}>${(grand*0.27).toLocaleString(undefined,{maximumFractionDigits:0})}</td></tr>
                  <tr style={{background:"#f5f5f7"}}><td colSpan={2} style={{padding:"11px 14px",fontSize:12.5,color:T.sub}}>50% ADVANCE</td><TD muted>AED ${advance.toLocaleString(undefined,{maximumFractionDigits:2})}</TD><TD muted/></tr>
                </tbody>
              </table>
            </div>
            <div>
              <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6,fontWeight:500}}>Notes</div>
              <textarea value={est.notes||""} onChange={e=>setEditingEstimate(prev=>({...prev,notes:e.target.value}))} rows={3} style={{width:"100%",padding:"10px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none"}}/>
            </div>
          </div>
        );
      }
      return (
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}>
            <BtnPrimary onClick={()=>setEditingEstimate({...initColumbiaEstimate,id:null,version:versionLabels[estimates.length]||`V${estimates.length+1}`,client:p.client,project:p.name})}>+ New Estimate</BtnPrimary>
          </div>
          {estimates.length===0?<div style={{padding:52,textAlign:"center",color:T.muted,fontSize:13,borderRadius:14,background:T.surface,border:`1px solid ${T.border}`}}>No estimates yet — click above to create one.</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {estimates.map(est=>{
                const sub=est.lineItems?.reduce((a,b)=>a+Number(b.aed),0)||0; const vat=sub*0.05; const grand=sub+vat;
                return (
                  <div key={est.id} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:"#f5f5f7",color:T.sub,border:`1px solid ${T.border}`}}>{est.version}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13.5,fontWeight:500,color:T.text}}>{est.project||p.name}</div>
                      <div style={{fontSize:11.5,color:T.muted,marginTop:2}}>{est.date} · AED ${grand.toLocaleString(undefined,{maximumFractionDigits:0})} inc. VAT</div>
                    </div>
                    <BtnSecondary small onClick={()=>setEditingEstimate({...est})}>Edit</BtnSecondary>
                    <BtnSecondary small onClick={()=>navigator.clipboard.writeText(generateEstimateText(est,sub,0,sub,vat,grand,grand*0.5))}>Copy</BtnSecondary>
                    <BtnExport onClick={()=>exportToPDF(buildEstimateHTML(est),`Production Estimate ${est.version} — ${est.project||p.name}`)}>PDF</BtnExport>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (projectSection==="Contracts") return (
      <div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,color:T.muted,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Agreement Type</div>
          <Sel value={contractType} onChange={setContractType} options={CONTRACT_TYPES} minWidth={320}/>
        </div>
        <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,padding:20,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{fontSize:10,color:T.muted,marginBottom:16,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Supplier Details</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["Commissionee / Supplier Name","commissionee"],["Individual (for PSC agreements)","individual"],["Role / Services","role"],["Fee (incl. currency)","fee"],["Shoot / Service Date","shootDate"],["Payment Terms","paymentTerms"],["Deliverables","deliverables"],["Usage Rights","usageRights"],["Deadline","deadline"],["Project Reference","projectRef"]].map(([label,key])=>(
              <div key={key}>
                <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5,fontWeight:500}}>{label}</div>
                <input value={contractFields[key]||""} onChange={e=>setContractFields(prev=>({...prev,[key]:e.target.value}))} style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
              </div>
            ))}
          </div>
          <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}>
            <BtnPrimary onClick={()=>generateContract(p)} disabled={contractLoading}>{contractLoading?"Generating…":"Generate Contract"}</BtnPrimary>
          </div>
        </div>
        {generatedContract&&(
          <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{padding:"11px 16px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafafa"}}>
              <span style={{fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",fontWeight:600}}>Generated Contract — {contractType}</span>
              <div style={{display:"flex",gap:6}}>
                <BtnSecondary small onClick={()=>navigator.clipboard.writeText(generatedContract)}>Copy</BtnSecondary>
                <BtnExport onClick={()=>exportToPDF(buildContractHTML(generatedContract),`${contractType} — ${p.name}`)}>Export PDF</BtnExport>
              </div>
            </div>
            <div style={{padding:22,maxHeight:500,overflowY:"auto"}}>
              <pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:13,lineHeight:"1.8",color:T.sub,margin:0}}>{generatedContract}</pre>
            </div>
          </div>
        )}
        <div style={{marginTop:18}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Saved Contracts</div>
          {(projectContracts[p.id]||[]).length===0?<div style={{fontSize:13,color:T.muted}}>No saved contracts yet.</div>:(projectContracts[p.id]||[]).map((c,i)=>(
            <div key={i} style={{padding:"10px 14px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`,marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:12.5,color:T.sub,flex:1}}>{c.type} — {c.name}</span>
              <span style={{fontSize:11,color:T.muted}}>{c.date}</span>
            </div>
          ))}
        </div>
      </div>
    );

    if (projectSection==="Quotes") return (
      <div><p style={{fontSize:13,color:T.sub,marginBottom:16}}>Upload supplier quotes here. They will also appear in the Finances table under the "Quote" category.</p>
      <UploadZone label="Upload supplier quotes (PDF, images)" files={quotes} onAdd={f=>addProjectFiles(p.id,"quotes",f)}/></div>
    );

    if (projectSection==="Locations") return (
      <div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:T.muted,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Dropbox / Drive Folder Link</div>
          <div style={{display:"flex",gap:10}}>
            <input value={projectLocLinks[p.id]||""} onChange={e=>setProjectLocLinks(prev=>({...prev,[p.id]:e.target.value}))} placeholder="https://www.dropbox.com/sh/..." style={{flex:1,padding:"9px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
            {projectLocLinks[p.id]&&<a href={projectLocLinks[p.id]} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",padding:"9px 18px",borderRadius:10,background:T.accent,color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}>Open Folder ↗</a>}
          </div>
        </div>
        {!projectLocLinks[p.id]&&<div style={{borderRadius:14,background:"#fafafa",border:`1.5px dashed ${T.border}`,padding:44,textAlign:"center"}}><div style={{fontSize:28,opacity:0.3,marginBottom:8}}>📁</div><div style={{fontSize:13,color:T.muted}}>Paste a Dropbox or Google Drive folder link above.</div></div>}
      </div>
    );

    if (projectSection==="Casting") {
      const castingRows = getProjectCasting(p.id);
      return (
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
            <BtnPrimary onClick={()=>addCastingRow(p.id)}>+ Add Model</BtnPrimary>
          </div>
          <div style={{borderRadius:14,overflow:"hidden",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><TH>Agency</TH><TH>Name of Model</TH><TH>Email</TH><TH>Option</TH><TH/></tr></thead>
              <tbody>
                {castingRows.length===0?<tr><td colSpan={5} style={{padding:40,textAlign:"center",color:T.muted,fontSize:13}}>No models added yet.</td></tr>
                :castingRows.map(row=>(
                  <tr key={row.id}>
                    {["agency","name","email"].map(field=>(
                      <td key={field} style={{padding:"8px 14px",borderBottom:`1px solid ${T.borderSub}`}}>
                        <input value={row[field]} onChange={e=>updateCastingRow(p.id,row.id,field,e.target.value)} style={{width:"100%",padding:"6px 9px",borderRadius:8,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit"}}/>
                      </td>
                    ))}
                    <td style={{padding:"8px 14px",borderBottom:`1px solid ${T.borderSub}`}}>
                      <select value={row.option} onChange={e=>updateCastingRow(p.id,row.id,"option",e.target.value)} style={{padding:"6px 9px",borderRadius:8,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit"}}>
                        <option>First Option</option><option>Second Option</option><option>Confirmed</option><option>Released</option>
                      </select>
                    </td>
                    <td style={{padding:"8px 14px",borderBottom:`1px solid ${T.borderSub}`}}><button onClick={()=>removeCastingRow(p.id,row.id)} style={{background:"none",border:"none",color:T.muted,fontSize:16,cursor:"pointer",padding:0}}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (projectSection==="Permits") return <UploadZone label="Upload permit paperwork (PDF, images)" files={getProjectFiles(p.id,"permits")} onAdd={f=>addProjectFiles(p.id,"permits",f)}/>;
    if (projectSection==="Styling") return <UploadZone label="Upload styling documents (PDF, images)" files={getProjectFiles(p.id,"styling")} onAdd={f=>addProjectFiles(p.id,"styling",f)}/>;
    if (projectSection==="Call Sheet")     return <AIDocPanel project={p} docType="Call Sheet"      systemPrompt={callSheetSystemPrompt} savedDocs={savedCallSheets}/>;
    if (projectSection==="Risk Assessment") return <AIDocPanel project={p} docType="Risk Assessment" systemPrompt={riskSystemPrompt}      savedDocs={savedRiskAssessments}/>;
    if (projectSection==="Workbook") return (
      <div>
        <p style={{fontSize:13,color:T.sub,marginBottom:12}}>General project notes, timelines, links and references.</p>
        <textarea value={projectNotes[p.id]||""} onChange={e=>setProjectNotes(prev=>({...prev,[p.id]:e.target.value}))} rows={18} placeholder="Add your notes, timelines, links, contacts…" style={{width:"100%",padding:16,borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,color:T.text,fontSize:13.5,fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:"1.7",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}/>
      </div>
    );
    return null;
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  const currentTab = TABS.find(t=>t.id===activeTab)||TABS[0];

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Arial,sans-serif",color:T.text,display:"flex"}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg);}}
        *{box-sizing:border-box;}
        ::placeholder{color:#aeaeb2;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-thumb{background:#d1d1d6;border-radius:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        .nav-btn{width:100%;text-align:left;padding:8px 11px;border-radius:10px;border:none;background:transparent;color:#6e6e73;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.12s;display:flex;align-items:center;gap:9px;letter-spacing:0.04em;}
        .nav-btn:hover{color:#1d1d1f;background:rgba(0,0,0,0.05);}
        .nav-btn.active{background:rgba(0,0,0,0.08);color:#1d1d1f;}
        .row:hover{background:#f5f5f7!important;cursor:pointer;}
        .proj-card:hover{border-color:#c7c7cc!important;box-shadow:0 6px 20px rgba(0,0,0,0.08)!important;transform:translateY(-1px);}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.2);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:50;display:flex;align-items:center;justify-content:center;}
        input:focus,textarea:focus,select:focus{outline:none;border-color:#6e6e73!important;box-shadow:0 0 0 3px rgba(0,0,0,0.06)!important;}
        .todo-item:hover .todo-del{opacity:1;} .todo-del{opacity:0;transition:opacity 0.12s;}
        .todo-item:hover{background:#f5f5f7;border-radius:8px;}
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{width:220,flexShrink:0,background:"rgba(255,255,255,0.82)",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
        <div style={{padding:"20px 18px 16px",display:"flex",alignItems:"center"}}>
          <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAoAKADASIAAhEBAxEB/8QAGgABAAMBAQEAAAAAAAAAAAAAAAYICQUHA//EAEIQAAEDAwIDBQIKBQ0AAAAAAAECAwQABREGBwgSIRMUMUFRCTIVFiIjQlJhcXSzFzY4gZEYM0NUVmJygoOUocPT/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALl0pUD343Jt21W3UvVM1kSX+YR4MXm5e8SFAlKc+QAClE+iT54oJy860y0p15xDbaBlS1qACR6kmufB1DYJz5jwr5bJTwOC2zLQtQ/cDms6IkffDiZ1A8sSHrhDjODn7R0R7dC5vABPhnHoFLI8c+NSa68GO6kO3KkxLppi4SEJyYzMt1C1H0SVtpT/ABKaDQSlZ47P75bjbNa6Gk9wHLnKs7DyY8+3z1Fx+EnyWyoknABBCQSlQ8PEGtCoz7MmO1JjuodZdQFtrQcpUkjIIPmCKD6UqkXtJJEhnV2kAy+62DAfyELIz84n0rscD+/JkCNtfrGaS8PkWOa8vqsf1ZRPn9Qnx936oIXFpVc/aFPvMbFRFMPONFV9jpJQojI7J446fcK7HAo447w6WlbrilqMyX1Ucn+eVQe6UrlawJGkbyQcEQH+v+mqsrtq9x9S7d61hans0x1xxg8r8d1wluS0febWPQ48fIgEdRQazUqMbXa5sW4ui4WqdPP9pFkpw42ojtI7o95pY8lJP8RgjIINUl0hLlL9oA+0uS8pv40zk8pcJGAHcDHpQaA0pUA4gtfs7abU3jU5WjvqW+725tX9JJXkNjHmB1WR6JNBP6VkIU6qctTmrS7c1QhOEdc/tVY7ypJcCebPvYBVWmvDhuG3uZtNadRLcSbihPdbmgfRktgBRx5BQKVgeixQejUpSgVUT2lnevi1ovkJ7p3yV2vpz8jfJ/xz1buoFv3ttA3V24maXlvCNJ5hIgSSM9hISDyqI80kEpP2KOOuKCO8GybMnh00v8C9jgtOGXyY5jI7RXac/nnPr9Hl8sV6/Wadpu29nDPqOTFMR6BEkPfONSWC9b5xT4KQroM480qSrGAceFS+88aO5Uu2KjQLJpy3SVpKTKQy64pB9UJWspB/xBQoOx7SZdkOtNKIi9j8Mpgv995cc/Y86ex5v39tirYbCiSnZDQ4mBQeFghBQV447BGM/bjFUn2S2Q17vPrlOstfpuLNkefEidOnAodngY+baBweUgBPMAEpHh1AFaFMNNMMNsMtpbabSEIQkYCUgYAA9KCkPtKv1v0f+AkfmJqI8QWx7+mNDaZ3R0ey4i2SrZCdubLOQYUhTSD2ycdQhSj1+qo+hAEu9pUD8btHnHTuEj8xNW026gxbhs9pu3XCM1JiyLBFZfYdQFIcQqOkKSoHxBBIxQUc3P3xTuZwyw9O6gfA1ZarxGLqj078wGnkh4f3gSAsepBHjgWZ4D/2cbR+Ml/nKqo3FVsrL2n1d3m3Nuv6VuTilW985UWVeJYWfrDyJ95PXxCsW54D/wBnG0fjJf5yqD2LWX6oXn8A/wDlqrOjhP20tG6t01bpq5q7B8WXtoEsDKoz4eQErx5jqQR5gnwOCNF9YgnSN5AGSYD/AOWqqR+zcB/SjqQ46fAn/e3QQ3Z3Xeq+HDd6dYNTRXxbVPBi8QQchSfoSGvIkA8wP0knHTII6O2lyg3njvbu1rlNy4MzUkx+O+2cpcbUl0pUPvBq0PFnsjH3U0r8J2hptrVlsaJhudE96b8THWft6lJPgo+QUapnwpRpELiZ0nDlsOR5LFwdbdacSUrbWlpwFJB6ggjGKDT2s/8Aj+3G+Mu47Gire/zW3ToIf5T8lyWsDn+/kThP2Erq5m9+uY+3O1961Y8EreiscsRtXg7IX8ltP3cxBP2AmqJcL2zat8NU3+6aouNyYtkYdrJlx1JDz8t1RUBlaVDwC1K6eafWg9Jt2ruHpvheO1T2skJuD0TvLsn4JlkC4n5Ycz2XUBYCM+aBioZwGbj/ABT3QVpO4P8AJatShLKOY/Jblpz2R/zZKPtKkele2/yKNtP7Sau/3Ef/AMa8C4qtj29l7jYbxpe43STapZKRJkrSXY8pB5gOZCUgApwU9M5Qqg0bpUB4fdftblbUWfU+UiatvsLghIxySW+jnTyB6KA9FCp9QKUpQfOSwxJZUzJZbeaV7yHEhST94NciHpDScKZ32HpeyRpWebtmoDSF59eYJzmlKDt0pSgUpSgUpSgUpSgUpSgUpSgUpSgUpSg//9k=" alt="ONNA" style={{height:24,width:"auto",display:"block"}}/>
        </div>

        <nav style={{flex:1,padding:"4px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>changeTab(t.id)} className={`nav-btn${activeTab===t.id?" active":""}`}>
              <StarIcon size={11} color="currentColor"/>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={()=>setShowArchive(true)} style={{margin:"4px 10px 2px",padding:"9px 14px",borderRadius:10,background:"none",border:`1px solid ${T.border}`,color:T.muted,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:7,textAlign:"left"}}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="10" height="3" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 4v5.5a1 1 0 001 1h7a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.2"/><path d="M4.5 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Archive{archive.length>0&&<span style={{marginLeft:"auto",background:T.borderSub,borderRadius:999,padding:"1px 7px",fontSize:10.5,color:T.sub}}>{archive.length}</span>}
        </button>
        <div style={{margin:10,padding:"12px 14px",borderRadius:12,background:"rgba(0,0,0,0.04)",border:`1px solid rgba(0,0,0,0.07)`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>E</div>
            <button onClick={()=>{localStorage.removeItem("onna_token");setAuthed(false);}} title="Sign out" style={{background:"none",border:"none",color:T.muted,fontSize:12,cursor:"pointer",padding:"3px 6px",borderRadius:6,fontFamily:"inherit",fontWeight:500,lineHeight:1}} onMouseOver={e=>e.currentTarget.style.color="#c0392b"} onMouseOut={e=>e.currentTarget.style.color=T.muted}>Sign out</button>
          </div>
          <div style={{fontSize:13,fontWeight:600,color:T.text}}>Emily</div>
          <div style={{fontSize:11,color:T.muted}}>Admin · onna</div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{padding:"0 28px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:"rgba(255,255,255,0.8)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{currentTab.label}</span>
            {selectedProject&&<><span style={{color:T.muted,fontSize:16,fontWeight:300}}>›</span><span style={{fontSize:14,color:T.sub,fontWeight:500}}>{selectedProject.name}</span>{projectSection!=="Home"&&<><span style={{color:T.muted,fontSize:16}}>›</span><span style={{fontSize:13,color:T.muted}}>{projectSection}</span></>}</>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {apiLoading&&<span style={{fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:"#92680a",display:"inline-block",animation:"pulse 1.2s ease-in-out infinite"}}/>Syncing…</span>}
            {apiError&&!apiLoading&&<span title={`API: ${apiError}`} style={{fontSize:11,color:"#c0392b",cursor:"default"}}>● Offline</span>}
            {!apiLoading&&!apiError&&<span style={{fontSize:11,color:"#147d50",display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:"#147d50",display:"inline-block"}}/>Live</span>}
            {activeTab==="Projects"&&!selectedProject&&<BtnPrimary onClick={()=>setShowAddProject(true)}>+ New Project</BtnPrimary>}
            {activeTab==="Vendors"&&<BtnPrimary onClick={()=>setShowAddVendor(true)}>+ New Vendor</BtnPrimary>}
          </div>
        </div>

        {/* Scroll area */}
        <div style={{flex:1,overflowY:"auto",padding:"28px 28px 44px"}}>

          {/* ══ DASHBOARD ══ */}
          {activeTab==="Dashboard"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
                <StatCard label="Projects 2026"  value={projects2026.length} sub={`${projects2026.filter(p=>p.status==="Active").length} active`}/>
                <StatCard label="Revenue 2026"   value={`AED ${(rev2026/1000).toFixed(0)}k`} sub="all projects this year"/>
                <StatCard label="Profit 2026"    value={`AED ${(profit2026/1000).toFixed(0)}k`} sub={`${Math.round((profit2026/rev2026)*100)}% margin`}/>
                <StatCard label="Pipeline"       value={`AED ${(totalPipeline/1000).toFixed(0)}k`} sub={`${newCount} new leads`}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                {/* Active Projects */}
                <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafafa"}}>
                    <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Active Projects</span>
                    <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{activeProjects.length}</span>
                  </div>
                  {activeProjects.map((p,i)=>(
                    <div key={p.id} style={{padding:"13px 18px",borderBottom:i<activeProjects.length-1?`1px solid ${T.borderSub}`:"none",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2,fontWeight:500}}>{p.client}</div>
                        <div style={{fontSize:13.5,fontWeight:500,color:T.text}}>{p.name}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:15,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>AED {p.revenue.toLocaleString()}</div>
                        <div style={{fontSize:10,color:T.muted,marginTop:2}}>{p.year}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* To-Do */}
                <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",display:"flex",flexDirection:"column"}}>
                  {/* Title row */}
                  <div style={{padding:"13px 16px 0",background:"#fafafa",borderBottom:`1px solid ${T.borderSub}`}}>
                    <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
                      <span style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,flex:1}}>To-Do</span>
                      <span style={{fontSize:11,color:T.muted}}>{allTodos.filter(t=>!t.done).length} open</span>
                    </div>
                    {/* Top-level filter tabs */}
                    <div style={{display:"flex",gap:0,borderRadius:8,background:"#ebebed",padding:2,marginBottom:10}}>
                      {[["all","All"],["general","General"],["project","Project"]].map(([val,label])=>(
                        <button key={val} onClick={()=>setTodoFilter(val)} style={{flex:1,padding:"5px 0",borderRadius:6,fontSize:11.5,fontWeight:500,cursor:"pointer",border:"none",fontFamily:"inherit",background:todoTopFilter===val?"#fff":"transparent",color:todoTopFilter===val?T.text:T.muted,boxShadow:todoTopFilter===val?"0 1px 2px rgba(0,0,0,0.08)":"none",transition:"all 0.12s"}}>{label}</button>
                      ))}
                    </div>
                    {/* Sub-filter row */}
                    {todoTopFilter==="general"&&(
                      <div style={{display:"flex",gap:5,paddingBottom:10}}>
                        {[["general","All"],["general-now","Now"],["general-later","Later"],["general-longterm","Long Term"]].map(([val,label])=>(
                          <button key={val} onClick={()=>setTodoFilter(val)} style={{padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:500,cursor:"pointer",border:`1px solid ${todoFilter===val?T.accent:T.borderSub}`,fontFamily:"inherit",background:todoFilter===val?T.accent:"transparent",color:todoFilter===val?"#fff":T.sub,transition:"all 0.12s"}}>{label}</button>
                        ))}
                      </div>
                    )}
                    {todoTopFilter==="project"&&(
                      <div style={{paddingBottom:10}}>
                        <select
                          value={todoFilter}
                          onChange={e=>setTodoFilter(e.target.value)}
                          style={{width:"100%",padding:"7px 28px 7px 11px",borderRadius:9,background:"#fff",border:`1px solid ${T.border}`,color:T.text,fontSize:12.5,fontFamily:"inherit",cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aeaeb2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}
                        >
                          <option value="project">All projects</option>
                          {allProjectsMerged.map(p=>(
                            <option key={p.id} value={`project-${p.id}`}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  {/* Task list */}
                  <div style={{padding:"6px 12px",flex:1,overflowY:"auto",maxHeight:320}}>
                    {filteredTodos.map(t=>(
                      <div key={t.id} className="todo-item" style={{display:"flex",alignItems:"flex-start",gap:9,padding:"8px 6px",borderBottom:`1px solid ${T.borderSub}`}}>
                        <button onClick={e=>{e.stopPropagation();(t.projectId?setProjectTodos(prev=>({...prev,[t.projectId]:(prev[t.projectId]||[]).map(x=>x.id===t.id?{...x,done:!x.done}:x)})):setTodos(prev=>prev.map(x=>x.id===t.id?{...x,done:!x.done}:x)));}} style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${t.done?T.muted:T.border}`,background:t.done?T.accent:"transparent",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,transition:"all 0.12s"}}>
                          {t.done&&<span style={{color:"#fff",fontSize:9,lineHeight:1,fontWeight:700}}>✓</span>}
                        </button>
                        <div style={{flex:1,minWidth:0}}>
                          <span style={{fontSize:13,color:t.done?T.muted:T.text,textDecoration:t.done?"line-through":"none"}}>{t.text}</span>
                          {t.projectId&&<div style={{fontSize:10.5,color:T.muted,marginTop:1}}>{allProjectsMerged.find(p=>p.id===t.projectId)?.name||"Project"}</div>}
                          {!t.projectId&&t.type==="project"&&t.project&&<div style={{fontSize:10.5,color:T.muted,marginTop:1}}>{t.project}</div>}
                          {t.subType&&!t.projectId&&<div style={{fontSize:10,color:T.muted,marginTop:1,textTransform:"capitalize"}}>{t.subType}</div>}
                        </div>
                        <div className="todo-del" style={{display:"flex",gap:3}}>
                          <button onClick={e=>{e.stopPropagation();setArchivedTodos(prev=>[...prev,t]);}} title="Archive" style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,padding:"2px 3px",borderRadius:4,fontFamily:"inherit",opacity:0.6}}>⊘</button>
                          <button onClick={e=>{e.stopPropagation();(t.projectId?setProjectTodos(prev=>({...prev,[t.projectId]:(prev[t.projectId]||[]).filter(x=>x.id!==t.id)})):setTodos(prev=>prev.filter(x=>x.id!==t.id)));}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15,padding:0,lineHeight:1}}>×</button>
                        </div>
                      </div>
                    ))}
                    {filteredTodos.length===0&&<div style={{padding:"20px 0",textAlign:"center",fontSize:13,color:T.muted}}>No tasks.</div>}
                  </div>
                  {/* Add input — no project dropdown, just clean input */}
                  <div style={{padding:"10px 12px",borderTop:`1px solid ${T.borderSub}`,display:"flex",gap:7,background:"#fafafa"}}>
                    <input value={newTodo} onChange={e=>setNewTodo(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newTodo.trim()){const subType=todoFilter==="general-personal"?"personal":todoFilter==="general-work"?"work":undefined;if(todoFilter.startsWith("project-")){const pid=Number(todoFilter.replace("project-",""));setProjectTodos(prev=>({...prev,[pid]:[...(prev[pid]||[]),{id:Date.now(),text:newTodo.trim(),done:false,details:""}]}));}else if(todoFilter==="project"){setTodos(prev=>[...prev,{id:Date.now(),text:newTodo.trim(),done:false,type:"project",project:"",details:""}]);}else{setTodos(prev=>[...prev,{id:Date.now(),text:newTodo.trim(),done:false,type:"general",subType,details:""}]);}setNewTodo("");}}} placeholder={todoTopFilter==="project"?"Add project task…":todoFilter==="general-personal"?"Add personal task…":todoFilter==="general-work"?"Add work task…":"Add task…"} style={{flex:1,padding:"7px 11px",borderRadius:9,background:"#fff",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                    <button onClick={()=>{if(newTodo.trim()){const subType=todoFilter==="general-personal"?"personal":todoFilter==="general-work"?"work":undefined;if(todoFilter.startsWith("project-")){const pid=Number(todoFilter.replace("project-",""));setProjectTodos(prev=>({...prev,[pid]:[...(prev[pid]||[]),{id:Date.now(),text:newTodo.trim(),done:false,details:""}]}));}else if(todoFilter==="project"){setTodos(prev=>[...prev,{id:Date.now(),text:newTodo.trim(),done:false,type:"project",project:"",details:""}]);}else{setTodos(prev=>[...prev,{id:Date.now(),text:newTodo.trim(),done:false,type:"general",subType,details:""}]);}setNewTodo("");}}} style={{padding:"7px 14px",borderRadius:9,background:T.accent,border:"none",color:"#fff",fontSize:16,cursor:"pointer",lineHeight:1,flexShrink:0}}>+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ VENDORS ══ */}
          {activeTab==="Vendors"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                <SearchBar value={getSearch("Vendors")} onChange={v=>setSearch("Vendors",v)} placeholder="Search contacts…"/>
                <Sel value={bbCat} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customVendorCats,setCustomVendorCats,'onna_vendor_cats',"New category name:");if(n){setBbCat(n);setBbLocation("All");}}else{setBbCat(v);setBbLocation("All");}}} options={allVendorCats} minWidth={170}/>
                <Sel value={bbLocation} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customVendorLocs,setCustomVendorLocs,'onna_vendor_locs',"New location name:");if(n)setBbLocation(n);}else setBbLocation(v);}} options={["All",...allVendorLocs]} minWidth={170}/>
                <span style={{fontSize:12,color:T.muted}}>{filteredBB.length} contacts</span>
                <button onClick={()=>downloadCSV(filteredBB,[{key:"name",label:"Name"},{key:"category",label:"Category"},{key:"location",label:"Location"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"website",label:"Website"},{key:"rateCard",label:"Rate Card"},{key:"notes",label:"Notes"}],"vendors.csv")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>CSV</button>
                <button onClick={()=>exportTablePDF(filteredBB,[{key:"name",label:"Name"},{key:"category",label:"Category"},{key:"location",label:"Location"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"website",label:"Website"}],"Vendors")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>PDF</button>
              </div>
              <div style={{borderRadius:16,overflow:"hidden",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr><TH>Name</TH><TH>Email</TH><TH>Phone</TH><TH>Website</TH><TH>Location</TH></tr></thead>
                  <tbody>
                    {filteredBB.map(b=>(
                      <tr key={b.id} className="row" onClick={()=>setEditVendor({...b})} style={{cursor:"pointer"}}>
                        <TD bold>{b.name}</TD>
                        <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}><a href={`mailto:${b.email}`} onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{b.email||"—"}</a></td>
                        <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`,whiteSpace:"nowrap",fontSize:12.5,color:T.sub}}>{b.phone||"—"}</td>
                        <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}>{b.website?<a href={`https://${b.website}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{b.website}</a>:<span style={{color:T.muted,fontSize:12.5}}>—</span>}</td>
                        <TD muted>{b.location||"—"}</TD>
                      </tr>
                    ))}
                    {filteredBB.length===0&&<tr><td colSpan={5} style={{padding:44,textAlign:"center",color:T.muted,fontSize:13}}>No contacts found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ SALES ══ */}
          {activeTab==="Sales"&&(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:22}}>
                <Pill label="Overview"         active={leadsView==="dashboard"} onClick={()=>setLeadsView("dashboard")}/>
                <Pill label="Leads"            active={leadsView==="leads"}     onClick={()=>setLeadsView("leads")}/>
                <Pill label="Clients"          active={leadsView==="clients"}   onClick={()=>setLeadsView("clients")}/>
                <Pill label="Outreach Tracker" active={leadsView==="outreach"}  onClick={()=>setLeadsView("outreach")}/>
              </div>

              {leadsView==="dashboard"&&(()=>{
                const STATUSES = ["not_contacted","cold","warm","open","client"];
                const COLORS   = {not_contacted:"#c0392b",cold:"#6e6e73",warm:"#1a56db",open:"#147d50",client:"#7c3aed"};
                const STATUS_LABELS = OUTREACH_STATUS_LABELS;
                const counts   = STATUSES.map(s=>allLeadsCombined.filter(l=>l.status===s).length);
                const values   = STATUSES.map(s=>allLeadsCombined.filter(l=>l.status===s).reduce((a,b)=>a+(b.value||0),0));
                const total    = counts.reduce((a,b)=>a+b,0)||1;

                // Palette for category / location charts
                const PAL = ["#6366f1","#f59e0b","#10b981","#3b82f6","#f43f5e","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4","#84cc16","#a78bfa"];

                const stageGroups = STATUSES.map((s,i)=>({label:STATUS_LABELS[s],count:counts[i],color:COLORS[s]})).filter(g=>g.count>0);

                const _catMap={};allLeadsCombined.forEach(l=>{if(l.category)_catMap[l.category]=(_catMap[l.category]||0)+1;});
                const catGroups = Object.entries(_catMap).sort((a,b)=>b[1]-a[1]).map(([label,count],i)=>({label,count,color:PAL[i%PAL.length]}));

                const _locMap={};allLeadsCombined.forEach(l=>{if(l.location){const k=l.location.split(",")[0].trim();_locMap[k]=(_locMap[k]||0)+1;}});
                const locGroups = Object.entries(_locMap).sort((a,b)=>b[1]-a[1]).map(([label,count],i)=>({label,count,color:PAL[i%PAL.length]}));

                // Reusable donut renderer
                const Donut = ({title,groups})=>{
                  const R=58,CIR=2*Math.PI*R,gt=groups.reduce((a,g)=>a+g.count,0)||1;
                  let o=0;
                  const sg=groups.map(g=>{const d=(g.count/gt)*CIR,s={...g,d,o};o+=d;return s;});
                  return (
                    <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",padding:"22px 24px"}}>
                      <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,marginBottom:16}}>{title}</div>
                      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
                        <svg width={156} height={156} viewBox="0 0 156 156">
                          <circle cx={78} cy={78} r={R} fill="none" stroke={T.borderSub} strokeWidth={22}/>
                          {sg.filter(g=>g.count>0).map((g,i)=>(
                            <circle key={i} cx={78} cy={78} r={R} fill="none" stroke={g.color} strokeWidth={22}
                              strokeDasharray={`${g.d} ${CIR-g.d}`} strokeDashoffset={-(g.o-(CIR/4))}/>
                          ))}
                          <text x={78} y={74} textAnchor="middle" style={{fontSize:22,fontWeight:700,fill:T.text,fontFamily:"inherit"}}>{gt}</text>
                          <text x={78} y={89} textAnchor="middle" style={{fontSize:10,fill:T.muted,fontFamily:"inherit"}}>total</text>
                        </svg>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {sg.map((g,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:7}}>
                            <span style={{width:8,height:8,borderRadius:2,background:g.color,flexShrink:0}}/>
                            <span style={{fontSize:11.5,color:T.sub,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.label}</span>
                            <span style={{fontSize:12,fontWeight:600,color:T.text}}>{g.count}</span>
                            <span style={{fontSize:11,color:T.muted,minWidth:28,textAlign:"right"}}>{Math.round((g.count/gt)*100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                };

                // Daily reminders logic
                const today = new Date();
                const oneMonthAgo = new Date(today); oneMonthAgo.setMonth(oneMonthAgo.getMonth()-1);
                const openLead = l => l._fromOutreach ? setSelectedOutreach(outreach.find(o=>o.id===l.id)||{...l,clientName:l.contact}) : setSelectedLead(l);
                const toContact = allLeadsCombined.filter(l=>l.status==="not_contacted").slice(0,5);
                const toFollowUp = allLeadsCombined.filter(l=>{
                  if(l.status==="not_contacted"||l.status==="client") return false;
                  const d=_parseDate(l.date); return d&&d<oneMonthAgo;
                }).slice(0,5);

                const ReminderCard = ({lead,showDate})=>(
                  <div onClick={()=>openLead(lead)} className="row" style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,border:`1px solid ${T.border}`,background:T.surface,cursor:"pointer",marginBottom:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.company}</div>
                      <div style={{fontSize:11.5,color:T.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.contact||"—"}{lead.category?` · ${lead.category}`:""}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                      <OutreachBadge status={lead.status}/>
                      {showDate&&lead.date&&<span style={{fontSize:10.5,color:T.muted}}>{formatDate(lead.date)}</span>}
                    </div>
                    {lead.email&&<a href={`mailto:${lead.email}`} onClick={e=>e.stopPropagation()} style={{fontSize:11,color:T.link,textDecoration:"none",background:"#f0f4ff",padding:"4px 9px",borderRadius:7,whiteSpace:"nowrap",flexShrink:0}}>Email</a>}
                  </div>
                );

                return (
                  <div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:22}}>
                      {STATUSES.map((s,i)=>(
                        <div key={s} style={{borderRadius:16,padding:"18px 20px",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                            <span style={{width:8,height:8,borderRadius:"50%",background:COLORS[s],flexShrink:0}}/>
                            <span style={{fontSize:10,color:T.muted,letterSpacing:"0.05em",textTransform:"uppercase",fontWeight:600,lineHeight:1.3}}>{STATUS_LABELS[s]}</span>
                          </div>
                          <div style={{fontSize:30,fontWeight:700,color:T.text,letterSpacing:"-0.03em",lineHeight:1,marginBottom:4}}>{counts[i]}</div>
                          <div style={{fontSize:12,color:T.muted,marginBottom:10}}>AED {values[i].toLocaleString()}</div>
                          <div style={{height:3,borderRadius:999,background:T.borderSub}}>
                            <div style={{width:`${Math.round((counts[i]/total)*100)}%`,height:"100%",borderRadius:999,background:COLORS[s]}}/>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18,marginBottom:22}}>
                      <Donut title="Conversion" groups={stageGroups}/>
                      <Donut title="By Category" groups={catGroups}/>
                      <Donut title="By Location" groups={locGroups}/>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                      <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",padding:"22px 24px"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                          <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Contact Today</div>
                          <span style={{fontSize:11,color:"#c0392b",background:"#fff3e0",padding:"2px 8px",borderRadius:999,fontWeight:500}}>Not yet reached out</span>
                        </div>
                        {toContact.length===0
                          ? <div style={{fontSize:13,color:T.muted,textAlign:"center",padding:"24px 0"}}>All leads contacted!</div>
                          : toContact.map(l=><ReminderCard key={l.id} lead={l} showDate={false}/>)
                        }
                      </div>
                      <div style={{borderRadius:16,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",padding:"22px 24px"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                          <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600}}>Follow Up</div>
                          <span style={{fontSize:11,color:"#92680a",background:"#fff8e8",padding:"2px 8px",borderRadius:999,fontWeight:500}}>1+ month since contact</span>
                        </div>
                        {toFollowUp.length===0
                          ? <div style={{fontSize:13,color:T.muted,textAlign:"center",padding:"24px 0"}}>No follow-ups due yet.</div>
                          : toFollowUp.map(l=><ReminderCard key={l.id} lead={l} showDate={true}/>)
                        }
                      </div>
                    </div>
                  </div>
                );
              })()}

              {leadsView==="leads"&&(
                <div>
                  <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.borderSub}`,fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",background:"#fafafa",fontWeight:600}}>Add Lead via AI</div>
                    <div style={{padding:"13px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
                      <textarea value={leadMsg} onChange={e=>setLeadMsg(e.target.value)} rows={2} placeholder={`e.g. "Nike - Sarah Johnson | Brand Director sarah@nike.com, 1 Mar 2026, Sports, Dubai, UAE"`} style={{flex:1,background:"#fafafa",border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 13px",color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none"}}/>
                      <BtnPrimary onClick={processLeadAI} disabled={leadAiLoading||!leadMsg.trim()}>{leadAiLoading?"Adding…":"Add"}</BtnPrimary>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                    <SearchBar value={getSearch("Leads")} onChange={v=>setSearch("Leads",v)} placeholder="Search company or contact…"/>
                    <span style={{fontSize:12,color:T.muted}}>{filteredLeads.length} leads</span>
                    <button onClick={()=>downloadCSV(filteredLeads,[{key:"company",label:"Company"},{key:"contact",label:"Contact"},{key:"role",label:"Role"},{key:"email",label:"Email"},{key:"category",label:"Category"},{key:"status",label:"Status"},{key:"date",label:"Date Contacted"},{key:"value",label:"Value (AED)"},{key:"location",label:"Location"},{key:"notes",label:"Notes"}],"leads.csv")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>CSV</button>
                    <button onClick={()=>exportTablePDF(filteredLeads,[{key:"company",label:"Company"},{key:"contact",label:"Contact"},{key:"role",label:"Role"},{key:"email",label:"Email"},{key:"category",label:"Category"},{key:"status",label:"Status"},{key:"date",label:"Date Contacted"}],"Leads Pipeline")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>PDF</button>
                  </div>
                  <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
                    {[["not_contacted","Not yet reached out","#c0392b","#fff3e0"],["cold","No response",T.sub,"#f5f5f7"],["warm","Responded","#1a56db","#eef4ff"],["open","Meeting arranged","#147d50","#edfaf3"],["client","Converted to client","#7c3aed","#f3e8ff"]].map(([s,l,c,bg])=>(
                      <div key={s} style={{display:"flex",alignItems:"center",gap:6,fontSize:11.5}}><span style={{width:7,height:7,borderRadius:"50%",background:bg,border:`1.5px solid ${c}`}}/><span style={{color:c,fontWeight:600}}>{OUTREACH_STATUS_LABELS[s]}</span><span style={{color:T.muted}}>— {l}</span></div>
                    ))}
                    <span style={{fontSize:11.5,color:T.muted,marginLeft:"auto"}}>Click badge to cycle</span>
                  </div>
                  <div style={{borderRadius:16,overflow:"hidden",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr>
                        <TH>Company</TH><TH>Contact</TH><TH>Role</TH><TH>Email</TH>
                        <THFilter label="Category" value={leadCat} onChange={setLeadCat} options={[...LEAD_CATEGORIES,...customLeadCats]}/>
                        <THFilter label="Status" value={leadStatus} onChange={setLeadStatus} options={[{value:"All",label:"All"},...OUTREACH_STATUSES.map(s=>({value:s,label:OUTREACH_STATUS_LABELS[s]}))]}/>
                        <THFilter label="Date Contacted" value={leadMonth} onChange={setLeadMonth} options={leadMonths}/>
                      </tr></thead>
                      <tbody>
                        {filteredLeads.map(l=>(
                          <tr key={`${l._fromOutreach?"o":"l"}_${l.id}`} className="row" onClick={()=>l._fromOutreach?setSelectedOutreach(outreach.find(o=>o.id===l.id)||{...l,clientName:l.contact}):setSelectedLead(l)}>
                            <TD bold>{l.company}</TD><TD>{l.contact}</TD><TD muted>{l.role||""}</TD>
                            <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}><a href={`mailto:${l.email}`} onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{l.email}</a></td>
                            <TD muted>{l.category}</TD>
                            <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}} onClick={e=>e.stopPropagation()}><OutreachBadge status={l.status} onClick={async()=>{const next=OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(l.status)+1)%OUTREACH_STATUSES.length];if(l._fromOutreach){await api.put(`/api/outreach/${l.id}`,{status:next});setOutreach(prev=>prev.map(x=>x.id===l.id?{...x,status:next}:x));}else{await api.put(`/api/leads/${l.id}`,{status:next});setLocalLeads(prev=>prev.map(x=>x.id===l.id?{...x,status:next}:x));}if(next==="client")promoteToClient(l);}}/></td>
                            <TD muted>{formatDate(l.date)}</TD>
                          </tr>
                        ))}
                        {filteredLeads.length===0&&<tr><td colSpan={7} style={{padding:44,textAlign:"center",color:T.muted,fontSize:13}}>No leads found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {leadsView==="clients"&&(
                <div>
                  <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.borderSub}`,fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",background:"#fafafa",fontWeight:600}}>Add Client via AI</div>
                    <div style={{padding:"13px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
                      <textarea value={clientMsg} onChange={e=>setClientMsg(e.target.value)} rows={2} placeholder={`e.g. "Nike - Sarah Johnson | Brand Director sarah@nike.com +971501234567, Dubai, UAE"`} style={{flex:1,background:"#fafafa",border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 13px",color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none"}}/>
                      <BtnPrimary onClick={processClientAI} disabled={clientAiLoading||!clientMsg.trim()}>{clientAiLoading?"Adding…":"Add"}</BtnPrimary>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                    <SearchBar value={getSearch("Clients")} onChange={v=>setSearch("Clients",v)} placeholder="Search clients…"/>
                    <span style={{fontSize:12,color:T.muted}}>{localClients.filter(c=>!getSearch("Clients")||c.company.toLowerCase().includes(getSearch("Clients").toLowerCase())).length} clients</span>
                  </div>
                  {localClients.filter(c=>!getSearch("Clients")||c.company.toLowerCase().includes(getSearch("Clients").toLowerCase())).length===0
                    ? <div style={{borderRadius:16,padding:44,textAlign:"center",background:T.surface,border:`1px solid ${T.border}`,color:T.muted,fontSize:13}}>No clients yet. Leads marked as "Client" will appear here automatically.</div>
                    : <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                        {localClients.filter(c=>!getSearch("Clients")||c.company.toLowerCase().includes(getSearch("Clients").toLowerCase())).map(c=>{
                          const cKey = (c.company||"").trim().toLowerCase();
                          const cProjects = localProjects.filter(p=>(p.client||"").trim().toLowerCase()===cKey);
                          const cRevenue  = cProjects.reduce((a,p)=>a+(p.revenue||0),0);
                          return (
                            <div key={c.id} className="proj-card" style={{borderRadius:16,padding:22,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                                <div style={{fontSize:15,fontWeight:600,color:T.text,letterSpacing:"-0.01em",lineHeight:1.3}}>{c.company}</div>
                                <div style={{display:"flex",alignItems:"center",gap:6}}>
                                  <span style={{fontSize:10,padding:"3px 9px",borderRadius:999,background:"#f3e8ff",color:"#7c3aed",fontWeight:500,flexShrink:0}}>Client</span>
                                  <button onClick={async()=>{if(!confirm(`Delete ${c.company}?`))return;await api.delete(`/api/clients/${c.id}`);setLocalClients(prev=>prev.filter(x=>x.id!==c.id));}} title="Delete client" style={{background:"none",border:"none",color:T.muted,fontSize:15,cursor:"pointer",padding:"1px 4px",borderRadius:5,lineHeight:1,flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#c0392b"} onMouseOut={e=>e.currentTarget.style.color=T.muted}>×</button>
                                </div>
                              </div>
                              {c.name&&<div style={{fontSize:12.5,color:T.sub,marginBottom:2,fontWeight:500}}>{c.name}</div>}
                              {c.country&&<div style={{fontSize:12,color:T.muted,marginBottom:12}}>{c.country}</div>}
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12,padding:"10px 12px",background:"#fafafa",borderRadius:10}}>
                                <div>
                                  <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:3}}>Revenue</div>
                                  <div style={{fontSize:17,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>AED {cRevenue.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:3}}>Projects</div>
                                  <div style={{fontSize:17,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>{cProjects.length}</div>
                                </div>
                              </div>
                              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                                {c.email&&<a href={`mailto:${c.email}`} style={{fontSize:12,color:T.link,textDecoration:"none"}}>{c.email}</a>}
                                {c.phone&&<div style={{fontSize:12,color:T.muted}}>{c.phone}</div>}
                                {c.notes&&<div style={{fontSize:11.5,color:T.muted,marginTop:4,fontStyle:"italic"}}>{c.notes}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                  }
                </div>
              )}

              {leadsView==="outreach"&&(
                <div>
                  <div style={{borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.borderSub}`,fontSize:10,color:T.muted,letterSpacing:"0.07em",textTransform:"uppercase",background:"#fafafa",fontWeight:600}}>Add Outreach Contact via AI</div>
                    <div style={{padding:"13px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
                      <textarea value={outreachMsg} onChange={e=>setOutreachMsg(e.target.value)} rows={2} placeholder={`e.g. "Rimowa - Priya Singh | Head of Marketing priya@rimowa.com, 27 Feb 2026, Fashion, Dubai, UAE"`} style={{flex:1,background:"#fafafa",border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 13px",color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none"}}/>
                      <BtnPrimary onClick={processOutreach} disabled={outreachLoading||!outreachMsg.trim()}>{outreachLoading?"Adding…":"Add"}</BtnPrimary>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                    <SearchBar value={getSearch("Outreach")} onChange={v=>setSearch("Outreach",v)} placeholder="Search outreach…"/>
                    <span style={{fontSize:12,color:T.muted}}>{filteredOutreach.length} contacts</span>
                    <button onClick={()=>downloadCSV(filteredOutreach,[{key:"company",label:"Company"},{key:"clientName",label:"Contact"},{key:"role",label:"Role"},{key:"email",label:"Email"},{key:"category",label:"Category"},{key:"status",label:"Status"},{key:"date",label:"Date Contacted"},{key:"value",label:"Value (AED)"},{key:"location",label:"Location"},{key:"notes",label:"Notes"}],"outreach.csv")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>CSV</button>
                    <button onClick={()=>exportTablePDF(filteredOutreach,[{key:"company",label:"Company"},{key:"clientName",label:"Contact"},{key:"role",label:"Role"},{key:"email",label:"Email"},{key:"category",label:"Category"},{key:"status",label:"Status"},{key:"date",label:"Date Contacted"}],"Outreach Tracker")} style={{background:"#f5f5f7",border:"none",color:T.sub,padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>PDF</button>
                  </div>
                  <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
                    {[["not_contacted","Not yet reached out","#c0392b","#fff3e0"],["cold","No response",T.sub,"#f5f5f7"],["warm","Responded","#1a56db","#eef4ff"],["open","Meeting arranged","#147d50","#edfaf3"],["client","Converted to client","#7c3aed","#f3e8ff"]].map(([s,l,c,bg])=>(
                      <div key={s} style={{display:"flex",alignItems:"center",gap:6,fontSize:11.5}}><span style={{width:7,height:7,borderRadius:"50%",background:bg,border:`1.5px solid ${c}`}}/><span style={{color:c,fontWeight:600}}>{OUTREACH_STATUS_LABELS[s]}</span><span style={{color:T.muted}}>— {l}</span></div>
                    ))}
                    <span style={{fontSize:11.5,color:T.muted,marginLeft:"auto"}}>Click badge to cycle</span>
                  </div>
                  <div style={{borderRadius:16,overflow:"hidden",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr>
                        <TH>Company</TH><TH>Contact</TH><TH>Role</TH><TH>Email</TH>
                        <THFilter label="Category" value={outreachCatFilter} onChange={setOutreachCatFilter} options={outreachCategories}/>
                        <THFilter label="Status" value={outreachStatusFilter} onChange={setOutreachStatusFilter} options={[{value:"All",label:"All"},...OUTREACH_STATUSES.map(s=>({value:s,label:OUTREACH_STATUS_LABELS[s]}))]}/>
                        <THFilter label="Date Contacted" value={outreachMonthFilter} onChange={setOutreachMonthFilter} options={outreachMonths}/>
                        <TH/>
                      </tr></thead>
                      <tbody>
                        {filteredOutreach.map(o=>(
                          <tr key={o.id} className="row" onClick={()=>setSelectedOutreach({...o})}>
                            <TD bold>{o.company}</TD><TD>{o.clientName}</TD><TD muted>{o.role}</TD>
                            <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}}><a href={`mailto:${o.email}`} onClick={e=>e.stopPropagation()} style={{fontSize:12.5,color:T.link,textDecoration:"none"}}>{o.email}</a></td>
                            <TD muted>{o.category}</TD>
                            <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}} onClick={e=>e.stopPropagation()}><OutreachBadge status={o.status} onClick={async()=>{const next=OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(o.status)+1)%OUTREACH_STATUSES.length];await api.put(`/api/outreach/${o.id}`,{status:next});setOutreach(prev=>prev.map(x=>x.id===o.id?{...x,status:next}:x));if(next==="client")promoteToClient({...o,contact:o.clientName});}}/></td>
                            <TD muted>{formatDate(o.date)}</TD>
                            <td style={{padding:"11px 14px",borderBottom:`1px solid ${T.borderSub}`}} onClick={e=>e.stopPropagation()}><button onClick={async()=>{archiveItem('outreach',o);await api.delete(`/api/outreach/${o.id}`);setOutreach(prev=>prev.filter(x=>x.id!==o.id));}} style={{background:"none",border:"none",color:T.muted,fontSize:16,cursor:"pointer",padding:0}}>×</button></td>
                          </tr>
                        ))}
                        {filteredOutreach.length===0&&<tr><td colSpan={8} style={{padding:44,textAlign:"center",color:T.muted,fontSize:13}}>No outreach contacts found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PROJECTS ══ */}
          {activeTab==="Projects"&&(()=>{
            if (selectedProject) return (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:22}}>
                  <button onClick={()=>{setSelectedProject(null);setProjectSection("Home");setEditingEstimate(null);setGeneratedContract("");}} style={{background:"none",border:"none",color:T.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0,display:"flex",alignItems:"center",gap:4,fontWeight:500}}>‹ Projects</button>
                  {projectSection!=="Home"&&<><span style={{color:T.muted}}>›</span><button onClick={()=>{setProjectSection("Home");setEditingEstimate(null);}} style={{background:"none",border:"none",color:T.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:0}}>{selectedProject.name}</button></>}
                </div>
                {projectSection!=="Home"&&(
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
                    <select value={projectSection} onChange={e=>{setProjectSection(e.target.value);setEditingEstimate(null);}} style={{padding:"8px 30px 8px 13px",borderRadius:10,background:"#fff",border:"1px solid #d2d2d7",color:"#1d1d1f",fontSize:13,fontFamily:"inherit",cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aeaeb2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 11px center",fontWeight:500,boxShadow:"0 1px 2px rgba(0,0,0,0.05)",minWidth:200}}>
                      {PROJECT_SECTIONS.filter(s=>s!=="Home").map(sec=>(
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                )}
                {renderProjectSection(selectedProject)}
              </div>
            );
            return (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                  <SearchBar value={getSearch("Projects")} onChange={v=>setSearch("Projects",v)} placeholder="Search projects…"/>
                  <div style={{display:"flex",gap:6}}>{[2024,2025,2026].map(y=><Pill key={y} label={String(y)} active={projectYear===y} onClick={()=>setProjectYear(y)}/>)}</div>
                  <span style={{marginLeft:"auto",fontSize:12,color:T.muted}}>{projects.length} projects</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
                  <StatCard label="Total Revenue" value={`AED ${(projRev/1000).toFixed(0)}k`}/>
                  <StatCard label="Total Profit"  value={`AED ${(projProfit/1000).toFixed(0)}k`}/>
                  <StatCard label="Avg Margin"    value={`${projMargin}%`}/>
                </div>
                {/* Archive drop zone — shown while dragging */}
                <div
                  id="archive-drop-zone"
                  onDragOver={e=>{e.preventDefault();document.getElementById("archive-drop-zone").style.borderColor="#1d1d1f";document.getElementById("archive-drop-zone").style.background="#f0f0f2";}}
                  onDragLeave={e=>{document.getElementById("archive-drop-zone").style.borderColor="#d2d2d7";document.getElementById("archive-drop-zone").style.background="transparent";}}
                  onDrop={e=>{
                    e.preventDefault();
                    const id=Number(e.dataTransfer.getData("projectId"));
                    const proj=projects.find(p=>p.id===id);
                    if(proj){setArchivedProjects(prev=>[...prev,proj]);}
                    document.getElementById("archive-drop-zone").style.borderColor="#d2d2d7";
                    document.getElementById("archive-drop-zone").style.background="transparent";
                  }}
                  style={{border:"2px dashed #d2d2d7",borderRadius:14,padding:"18px 24px",marginBottom:16,display:"flex",alignItems:"center",gap:12,transition:"all 0.15s",background:"transparent",cursor:"default"}}
                >
                  <span style={{fontSize:18,opacity:0.4}}>⊘</span>
                  <div>
                    <div style={{fontSize:12.5,fontWeight:600,color:T.sub}}>Archive zone</div>
                    <div style={{fontSize:11.5,color:T.muted}}>Drag a project card here to archive it</div>
                  </div>
                  {archivedProjects.length>0&&<button onClick={()=>setShowArchive(v=>!v)} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${T.border}`,background:showArchive?"#1d1d1f":"transparent",color:showArchive?"#fff":T.sub,fontFamily:"inherit",transition:"all 0.12s"}}>{showArchive?"Hide archive":"View archive"} ({archivedProjects.length})</button>}
                </div>

                {showArchive&&archivedProjects.length>0&&(
                  <div style={{marginBottom:20}}>
                    <div style={{fontSize:11,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>Archived Projects</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                      {archivedProjects.map(p=>{
                        const profit=p.revenue-p.cost; const margin=Math.round((profit/p.revenue)*100);
                        return (
                          <div key={p.id} style={{borderRadius:14,padding:16,background:"#fafafa",border:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:10,opacity:0.75}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                              <div>
                                <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{p.client}</div>
                                <div style={{fontSize:13,fontWeight:600,color:T.sub}}>{p.name}</div>
                              </div>
                              <button onClick={()=>setArchivedProjects(prev=>prev.filter(a=>a.id!==p.id))} style={{fontSize:11,color:T.link,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:500,whiteSpace:"nowrap"}}>Restore</button>
                            </div>
                            <div style={{display:"flex",gap:14}}>
                              <div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",marginBottom:2}}>Revenue</div><div style={{fontSize:14,fontWeight:700,color:T.sub}}>AED {p.revenue.toLocaleString()}</div></div>
                              <div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",marginBottom:2}}>Margin</div><div style={{fontSize:14,fontWeight:700,color:T.sub}}>{margin}%</div></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                  {projects.filter(p=>!getSearch("Projects")||`${p.client} ${p.name}`.toLowerCase().includes(getSearch("Projects").toLowerCase())).map(p=>{
                    const profit=p.revenue-p.cost; const margin=Math.round((profit/p.revenue)*100);
                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={e=>{e.dataTransfer.setData("projectId",String(p.id));e.currentTarget.style.opacity="0.5";}}
                        onDragEnd={e=>{e.currentTarget.style.opacity="1";}}
                        className="proj-card"
                        style={{borderRadius:16,padding:20,background:T.surface,border:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:14,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",cursor:"grab"}}
                      >
                        <div onClick={()=>{setSelectedProject(p);setProjectSection("Home");}} style={{display:"flex",flexDirection:"column",gap:14,cursor:"pointer"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                            <div>
                              <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3,fontWeight:500}}>{p.client}</div>
                              <div style={{fontSize:14,fontWeight:600,color:T.text,letterSpacing:"-0.01em"}}>{p.name}</div>
                            </div>
                            <span style={{fontSize:10,padding:"3px 9px",borderRadius:999,background:projStatusBg[p.status]||"#f5f5f7",color:projStatusColor[p.status]||T.muted,fontWeight:500,whiteSpace:"nowrap"}}>{p.status}</span>
                          </div>
                          <div style={{borderTop:`1px solid ${T.borderSub}`}}/>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                            <div>
                              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase"}}>Revenue</div>
                              <div style={{fontSize:20,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>AED {p.revenue.toLocaleString()}</div>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase"}}>Profit</div>
                              <div style={{fontSize:20,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>AED {profit.toLocaleString()}</div>
                            </div>
                          </div>
                          <div>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11.5,color:T.muted}}>Margin</span><span style={{fontSize:11.5,fontWeight:600,color:T.text}}>{margin}%</span></div>
                            <div style={{height:3,borderRadius:999,background:T.borderSub}}><div style={{width:`${margin}%`,height:"100%",borderRadius:999,background:T.accent}}/></div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8,marginTop:-4}}>
                          <button
                            onClick={e=>{e.stopPropagation();setArchivedProjects(prev=>[...prev,p]);}}
                            style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"7px",borderRadius:9,background:"transparent",border:`1px solid ${T.borderSub}`,color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:500,transition:"all 0.12s"}}
                            onMouseOver={e=>{e.currentTarget.style.background="#f5f5f7";e.currentTarget.style.color=T.sub;}}
                            onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.muted;}}
                          >
                            <span style={{fontSize:13}}>⊘</span> Archive
                          </button>
                          <button
                            onClick={async e=>{e.stopPropagation();if(!confirm(`Delete "${p.name}"? This cannot be undone.`))return;await api.delete(`/api/projects/${p.id}`);setLocalProjects(prev=>prev.filter(x=>x.id!==p.id));}}
                            style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"7px 11px",borderRadius:9,background:"transparent",border:`1px solid ${T.borderSub}`,color:T.muted,fontSize:13,cursor:"pointer",transition:"all 0.12s"}}
                            onMouseOver={e=>{e.currentTarget.style.background="#fff0f0";e.currentTarget.style.borderColor="#fdc5c5";e.currentTarget.style.color="#c0392b";}}
                            onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=T.borderSub;e.currentTarget.style.color=T.muted;}}
                            title="Delete project"
                          >×</button>
                        </div>
                      </div>
                    );
                  })}
                  {projects.length===0&&<div style={{gridColumn:"span 3",padding:52,textAlign:"center",color:T.muted,fontSize:13,borderRadius:16,background:T.surface,border:`1px solid ${T.border}`}}>No projects for {projectYear}.</div>}
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* ── LEAD MODAL ── */}
      {selectedLead&&(
        <div className="modal-bg" onClick={()=>setSelectedLead(null)}>
          <div style={{borderRadius:20,padding:28,width:520,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{selectedLead.company}</div>
                <div style={{fontSize:12,color:T.muted,marginTop:3}}>{selectedLead.category} · {selectedLead.location}</div>
              </div>
              <button onClick={()=>setSelectedLead(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {[["company","Company"],["contact","Contact"],["role","Role"],["email","Email"],["phone","Phone"],["date","Date Contacted"],["value","Deal Value"]].map(([field,label])=>(
                <div key={field}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</div>
                  <input value={selectedLead[field]||""} onChange={e=>setSelectedLead(p=>({...p,[field]:e.target.value}))}
                    style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Category</div>
                <Sel value={selectedLead.category||""} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customLeadCats,setCustomLeadCats,'onna_lead_cats',"New category name:");if(n)setSelectedLead(p=>({...p,category:n}));}else setSelectedLead(p=>({...p,category:v}));}} options={allLeadCats.filter(c=>c!=="All")} minWidth="100%"/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Source</div>
                <Sel value={selectedLead.source||""} onChange={v=>setSelectedLead(p=>({...p,source:v}))} options={["Referral","LinkedIn","Website","Cold Outreach","Event","Other"]} minWidth="100%"/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Status</div>
                <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:4}}>
                  <OutreachBadge status={selectedLead.status} onClick={()=>{const next=OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(selectedLead.status)+1)%OUTREACH_STATUSES.length];setSelectedLead(p=>({...p,status:next}));if(next==="client")promoteToClient(selectedLead);}}/>
                  <span style={{fontSize:11,color:T.muted}}>click to cycle</span>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Location</div>
                <Sel value={selectedLead.location||""} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customLeadLocs,setCustomLeadLocs,'onna_lead_locs',"New location name:");if(n)setSelectedLead(p=>({...p,location:n}));}else setSelectedLead(p=>({...p,location:v}));}} options={allLeadLocs.filter(l=>l!=="All")} minWidth="100%"/>
              </div>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Notes</div>
              <textarea value={selectedLead.notes||""} onChange={e=>setSelectedLead(p=>({...p,notes:e.target.value}))} rows={3}
                placeholder="Comments, next steps, context…"
                style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={async()=>{
                if(!window.confirm(`Delete ${selectedLead.company}?`)) return;
                const snap = {...selectedLead};
                // Archive, close modal, and update list immediately — don't wait for API
                archiveItem('leads', snap);
                setSelectedLead(null);
                setLocalLeads(prev=>prev.filter(l=>l.id!==snap.id));
                // Prune and API call are non-blocking cleanup
                setTimeout(()=>{
                  setLocalLeads(prev=>{
                    pruneCustom(prev,'category',customLeadCats,setCustomLeadCats,'onna_lead_cats');
                    pruneCustom(prev,'location',customLeadLocs,setCustomLeadLocs,'onna_lead_locs');
                    return prev;
                  });
                },50);
                try{await api.delete(`/api/leads/${snap.id}`);}catch{}
              }} style={{background:"none",border:"none",color:"#c0392b",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",padding:0}}>Delete lead</button>
              <div style={{display:"flex",gap:8}}>
                <BtnSecondary onClick={()=>setSelectedLead(null)}>Cancel</BtnSecondary>
                <BtnPrimary onClick={async()=>{
                  const {id,...fields} = selectedLead;
                  await api.put(`/api/leads/${id}`,{...fields,value:Number(fields.value)||0});
                  setLocalLeads(prev=>prev.map(l=>l.id===id?selectedLead:l));
                  setLeadStatusOverrides(prev=>{const n={...prev};delete n[id];return n;});
                  if(selectedLead.status==="client") promoteToClient(selectedLead);
                  setSelectedLead(null);
                }}>Save Changes</BtnPrimary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OUTREACH MODAL ── */}
      {selectedOutreach&&(
        <div className="modal-bg" onClick={()=>setSelectedOutreach(null)}>
          <div style={{borderRadius:20,padding:28,width:520,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{selectedOutreach.company}</div>
                <div style={{fontSize:12,color:T.muted,marginTop:3}}>{selectedOutreach.category} · {selectedOutreach.location}</div>
              </div>
              <button onClick={()=>setSelectedOutreach(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {[["company","Company"],["clientName","Contact"],["role","Role"],["email","Email"],["phone","Phone"],["date","Date Contacted"],["value","Deal Value (AED)"]].map(([field,label])=>(
                <div key={field}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</div>
                  <input value={selectedOutreach[field]||""} onChange={e=>setSelectedOutreach(p=>({...p,[field]:e.target.value}))}
                    style={{width:"100%",padding:"8px 11px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Category</div>
                <Sel value={selectedOutreach.category||""} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customLeadCats,setCustomLeadCats,'onna_lead_cats',"New category name:");if(n)setSelectedOutreach(p=>({...p,category:n}));}else setSelectedOutreach(p=>({...p,category:v}));}} options={allLeadCats.filter(c=>c!=="All")} minWidth="100%"/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Source</div>
                <Sel value={selectedOutreach.source||"Cold Outreach"} onChange={v=>setSelectedOutreach(p=>({...p,source:v}))} options={["Referral","LinkedIn","Website","Cold Outreach","Event","Other"]} minWidth="100%"/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Status</div>
                <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:4}}>
                  <OutreachBadge status={selectedOutreach.status} onClick={()=>{const next=OUTREACH_STATUSES[(OUTREACH_STATUSES.indexOf(selectedOutreach.status)+1)%OUTREACH_STATUSES.length];setSelectedOutreach(p=>({...p,status:next}));if(next==="client")promoteToClient({...selectedOutreach,contact:selectedOutreach.clientName});}}/>
                  <span style={{fontSize:11,color:T.muted}}>click to cycle</span>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Location</div>
                <Sel value={selectedOutreach.location||""} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customLeadLocs,setCustomLeadLocs,'onna_lead_locs',"New location name:");if(n)setSelectedOutreach(p=>({...p,location:n}));}else setSelectedOutreach(p=>({...p,location:v}));}} options={allLeadLocs.filter(l=>l!=="All")} minWidth="100%"/>
              </div>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase"}}>Notes</div>
              <textarea value={selectedOutreach.notes||""} onChange={e=>setSelectedOutreach(p=>({...p,notes:e.target.value}))} rows={3}
                placeholder="Context, next steps, meeting notes…"
                style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={async()=>{
                if(!window.confirm(`Delete ${selectedOutreach.company}?`)) return;
                archiveItem('outreach', selectedOutreach);
                await api.delete(`/api/outreach/${selectedOutreach.id}`);
                setOutreach(prev=>prev.filter(x=>x.id!==selectedOutreach.id));
                setSelectedOutreach(null);
              }} style={{background:"none",border:"none",color:"#c0392b",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",padding:0}}>Delete</button>
              <div style={{display:"flex",gap:8}}>
                <BtnSecondary onClick={()=>setSelectedOutreach(null)}>Cancel</BtnSecondary>
                <BtnPrimary onClick={async()=>{
                  const {id,...fields}=selectedOutreach;
                  await api.put(`/api/outreach/${id}`,{...fields,value:Number(fields.value)||0});
                  setOutreach(prev=>prev.map(x=>x.id===id?{...selectedOutreach,value:Number(fields.value)||0}:x));
                  if(selectedOutreach.status==="client") promoteToClient({...selectedOutreach,contact:selectedOutreach.clientName});
                  setSelectedOutreach(null);
                }}>Save Changes</BtnPrimary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TODO MODAL ── */}
      {selectedTodo&&(
        <div className="modal-bg" onClick={()=>setSelectedTodo(null)}>
          <div style={{borderRadius:20,padding:28,width:500,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Task Details</div>
              <button onClick={()=>setSelectedTodo(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Task</div>
              <input value={selectedTodo.text} onChange={e=>{const u={...selectedTodo,text:e.target.value};setSelectedTodo(u);setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}} style={{width:"100%",padding:"10px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:14,fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Type</div>
                <Sel value={selectedTodo.type||"general"} onChange={v=>{const u={...selectedTodo,type:v};setSelectedTodo(u);setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}} options={["general","project"]}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Linked Project</div>
                <Sel value={selectedTodo.project||""} onChange={v=>{const u={...selectedTodo,project:v};setSelectedTodo(u);setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}} options={[{value:"",label:"None"},...allProjectsMerged.map(p=>({value:`${p.client} — ${p.name}`,label:`${p.client} — ${p.name}`}))]} minWidth={200}/>
              </div>
            </div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Additional Notes</div>
              <textarea value={selectedTodo.details||""} onChange={e=>{const u={...selectedTodo,details:e.target.value};setSelectedTodo(u);setTodos(prev=>prev.map(t=>t.id===u.id?u:t));}} rows={4} placeholder="Add notes, links, context…" style={{width:"100%",padding:"10px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <button onClick={()=>{setTodos(prev=>prev.filter(t=>t.id!==selectedTodo.id));setSelectedTodo(null);}} style={{padding:"8px 16px",borderRadius:10,background:"#fff0f0",border:"1px solid #ffd0d0",color:"#c0392b",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>Delete task</button>
              <BtnPrimary onClick={()=>setSelectedTodo(null)}>Done</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD PROJECT MODAL ── */}
      {showAddProject&&(
        <div className="modal-bg" onClick={()=>setShowAddProject(false)}>
          <div style={{borderRadius:20,padding:28,width:480,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Project</div>
              <button onClick={()=>setShowAddProject(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
              {[["Client","client"],["Project Name","name"],["Revenue (AED)","revenue"],["Cost (AED)","cost"]].map(([label,key])=>(
                <div key={key}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
                  <input value={newProject[key]} onChange={e=>setNewProject(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Status</div>
                <Sel value={newProject.status} onChange={v=>setNewProject(p=>({...p,status:v}))} options={["Active","In Review","Completed"]}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Year</div>
                <Sel value={String(newProject.year)} onChange={v=>setNewProject(p=>({...p,year:Number(v)}))} options={["2024","2025","2026"]}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <BtnSecondary onClick={()=>setShowAddProject(false)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={async()=>{if(!newProject.client||!newProject.name)return;const saved=await api.post("/api/projects",{...newProject,revenue:Number(newProject.revenue)||0,cost:Number(newProject.cost)||0});if(saved.id)setLocalProjects(prev=>[...prev,saved]);setNewProject({client:"",name:"",revenue:"",cost:"",status:"Active",year:2026});setShowAddProject(false);}}>Save Project</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD LEAD MODAL ── */}
      {showAddLead&&(
        <div className="modal-bg" onClick={()=>setShowAddLead(false)}>
          <div style={{borderRadius:20,padding:28,width:520,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Lead</div>
              <button onClick={()=>setShowAddLead(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
              {[["Company","company"],["Contact Name","contact"],["Role","role"],["Email","email"],["Phone","phone"],["Date Contacted","date"],["Value (AED)","value"]].map(([label,key])=>(
                <div key={key}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
                  <input value={newLead[key]} onChange={e=>setNewLead(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Category</div>
                <Sel value={newLead.category} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customLeadCats,setCustomLeadCats,'onna_lead_cats',"New category name:");if(n)setNewLead(p=>({...p,category:n}));}else setNewLead(p=>({...p,category:v}));}} options={allLeadCats.filter(c=>c!=="All")} minWidth={200}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Location</div>
                <Sel value={newLead.location} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customLeadLocs,setCustomLeadLocs,'onna_lead_locs',"New location name:");if(n)setNewLead(p=>({...p,location:n}));}else setNewLead(p=>({...p,location:v}));}} options={allLeadLocs.filter(l=>l!=="All")} minWidth={200}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Source</div>
                <Sel value={newLead.source} onChange={v=>setNewLead(p=>({...p,source:v}))} options={["Referral","LinkedIn","Website","Cold Outreach","Event","Other"]} minWidth={200}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Status</div>
                <Sel value={newLead.status} onChange={v=>setNewLead(p=>({...p,status:v}))} options={OUTREACH_STATUSES.map(s=>({value:s,label:OUTREACH_STATUS_LABELS[s]}))} minWidth={200}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <BtnSecondary onClick={()=>setShowAddLead(false)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={async()=>{if(!newLead.company)return;const saved=await api.post("/api/leads",{...newLead,value:Number(newLead.value)||0});if(saved.id)setLocalLeads(prev=>[...prev,saved]);setNewLead({company:"",contact:"",email:"",phone:"",role:"",date:"",source:"Referral",status:"not_contacted",value:"",category:"Production Companies",location:"Dubai, UAE"});setShowAddLead(false);}}>Save Lead</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD VENDOR MODAL ── */}
      {showAddVendor&&(
        <div className="modal-bg" onClick={()=>setShowAddVendor(false)}>
          <div style={{borderRadius:20,padding:28,width:520,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>New Vendor</div>
              <button onClick={()=>setShowAddVendor(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
              {[["Name","name"],["Email","email"],["Phone","phone"],["Website","website"],["Rate Card","rateCard"],["Notes","notes"]].map(([label,key])=>(
                <div key={key} style={{gridColumn:key==="notes"?"span 2":"auto"}}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>{label}</div>
                  <input value={newVendor[key]} onChange={e=>setNewVendor(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Category</div>
                <Sel value={newVendor.category} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customVendorCats,setCustomVendorCats,'onna_vendor_cats',"New category name:");if(n)setNewVendor(p=>({...p,category:n}));}else setNewVendor(p=>({...p,category:v}));}} options={allVendorCats.filter(c=>c!=="All")} minWidth={200}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500}}>Location</div>
                <Sel value={newVendor.location} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customVendorLocs,setCustomVendorLocs,'onna_vendor_locs',"New location name:");if(n)setNewVendor(p=>({...p,location:n}));}else setNewVendor(p=>({...p,location:v}));}} options={allVendorLocs} minWidth={200}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <BtnSecondary onClick={()=>setShowAddVendor(false)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={async()=>{if(!newVendor.name)return;const saved=await api.post("/api/vendors",newVendor);if(saved.id)setVendors(prev=>[...prev,saved]);setNewVendor({name:"",category:"Locations",email:"",phone:"",website:"",location:"Dubai, UAE",notes:"",rateCard:""});setShowAddVendor(false);}}>Save Vendor</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── RATE CARD MODAL ── */}
      {showRateModal&&(
        <div className="modal-bg" onClick={()=>setShowRateModal(null)}>
          <div style={{borderRadius:20,padding:26,width:380,background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:700,color:T.text}}>Add Rate Card</div>
              <button onClick={()=>setShowRateModal(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{fontSize:12.5,color:T.muted,marginBottom:14}}>{showRateModal.name}</div>
            <input type="text" placeholder="e.g. AED 1,500/day" value={rateInput} onChange={e=>setRateInput(e.target.value)} style={{width:"100%",padding:"10px 13px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.border}`,color:T.text,fontSize:13.5,fontFamily:"inherit",marginBottom:16}}/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <BtnSecondary onClick={()=>setShowRateModal(null)}>Cancel</BtnSecondary>
              <BtnPrimary onClick={async()=>{await api.put(`/api/vendors/${showRateModal.id}`,{rateCard:rateInput});setVendors(prev=>prev.map(b=>b.id===showRateModal.id?{...b,rateCard:rateInput}:b));setShowRateModal(null);}}>Save</BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT VENDOR MODAL ── */}
      {editVendor&&(
        <div className="modal-bg" onClick={()=>setEditVendor(null)}>
          <div style={{borderRadius:20,padding:28,width:580,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
              <div>
                <div style={{fontSize:20,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>{editVendor.name||"Vendor"}</div>
                <div style={{fontSize:12,color:T.muted,marginTop:3}}>{editVendor.category} · {editVendor.location}</div>
              </div>
              <button onClick={()=>setEditVendor(null)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
            </div>

            {/* Contact details */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              {[["Name","name"],["Email","email"],["Phone","phone"],["Website","website"]].map(([label,key])=>(
                <div key={key}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</div>
                  <input value={editVendor[key]||""} onChange={e=>setEditVendor(p=>({...p,[key]:e.target.value}))}
                    style={{width:"100%",padding:"9px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit"}}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Category</div>
                <Sel value={editVendor.category||""} onChange={v=>{if(v==="＋ Add category"){const n=addNewOption(customVendorCats,setCustomVendorCats,'onna_vendor_cats',"New category name:");if(n)setEditVendor(p=>({...p,category:n}));}else setEditVendor(p=>({...p,category:v}));}} options={allVendorCats.filter(c=>c!=="All")} minWidth="100%"/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Location</div>
                <Sel value={editVendor.location||""} onChange={v=>{if(v==="＋ Add location"){const n=addNewOption(customVendorLocs,setCustomVendorLocs,'onna_vendor_locs',"New location name:");if(n)setEditVendor(p=>({...p,location:n}));}else setEditVendor(p=>({...p,location:v}));}} options={allVendorLocs} minWidth="100%"/>
              </div>
            </div>

            {/* Rate card */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Rate Card</div>
              <textarea value={editVendor.rateCard||""} onChange={e=>setEditVendor(p=>({...p,rateCard:e.target.value}))} rows={3}
                placeholder="e.g. AED 1,500/half day · AED 2,800/full day · overtime at AED 300/hr"
                style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
            </div>

            {/* Notes */}
            <div style={{marginBottom:22}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>Notes</div>
              <textarea value={editVendor.notes||""} onChange={e=>setEditVendor(p=>({...p,notes:e.target.value}))} rows={4}
                placeholder="Parking, access, contacts on set, booking lead time…"
                style={{width:"100%",padding:"10px 12px",borderRadius:9,background:"#f5f5f7",border:`1px solid ${T.border}`,color:T.text,fontSize:13,fontFamily:"inherit",resize:"vertical",lineHeight:"1.6"}}/>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={async()=>{
                if(!window.confirm(`Delete ${editVendor.name}?`)) return;
                archiveItem('vendors', editVendor);
                await api.delete(`/api/vendors/${editVendor.id}`);
                const updatedVendors = vendors.filter(v=>v.id!==editVendor.id);
                setVendors(updatedVendors);
                pruneCustom(updatedVendors,'category',customVendorCats,setCustomVendorCats,'onna_vendor_cats');
                pruneCustom(updatedVendors,'location',customVendorLocs,setCustomVendorLocs,'onna_vendor_locs');
                setEditVendor(null);
              }} style={{background:"none",border:"none",color:"#c0392b",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",padding:0}}>Delete vendor</button>
              <div style={{display:"flex",gap:8}}>
                <BtnSecondary onClick={()=>setEditVendor(null)}>Cancel</BtnSecondary>
                <BtnPrimary onClick={async()=>{
                  const {id,...fields}=editVendor;
                  await api.put(`/api/vendors/${id}`,fields);
                  setVendors(prev=>prev.map(v=>v.id===id?editVendor:v));
                  setEditVendor(null);
                }}>Save Changes</BtnPrimary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ARCHIVE MODAL ── */}
      {showArchive&&(
        <div className="modal-bg" onClick={()=>setShowArchive(false)}>
          <div style={{borderRadius:20,padding:28,width:680,maxWidth:"94vw",background:T.surface,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.15)",maxHeight:"85vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexShrink:0}}>
              <div>
                <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em",color:T.text}}>Archive</div>
                <div style={{fontSize:12,color:T.muted,marginTop:2}}>Deleted items — restore or remove permanently</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {archive.length>0&&<button onClick={()=>{if(window.confirm("Clear entire archive permanently?"))setArchive(()=>{try{localStorage.removeItem('onna_archive');}catch{}return [];});}} style={{background:"none",border:"none",color:T.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:0}}>Clear all</button>}
                <button onClick={()=>setShowArchive(false)} style={{background:"#f5f5f7",border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {archive.length===0?(
                <div style={{padding:"48px 0",textAlign:"center",color:T.muted,fontSize:13}}>Archive is empty.</div>
              ):(
                ["leads","vendors","outreach"].map(table=>{
                  const entries = archive.filter(e=>e.table===table);
                  if (!entries.length) return null;
                  const label = table.charAt(0).toUpperCase()+table.slice(1);
                  return (
                    <div key={table} style={{marginBottom:24}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>{label} ({entries.length})</div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {entries.map(entry=>{
                          const it = entry.item;
                          const name = it.company||it.name||"—";
                          const sub = it.contact||it.clientName||it.category||"";
                          const deleted = new Date(entry.deletedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
                          return (
                            <div key={entry.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background:"#fafafa",border:`1px solid ${T.borderSub}`}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                                {sub&&<div style={{fontSize:11.5,color:T.muted,marginTop:1}}>{sub}</div>}
                              </div>
                              <div style={{fontSize:11,color:T.muted,flexShrink:0}}>Deleted {deleted}</div>
                              <button onClick={()=>restoreItem(entry)} style={{background:"#edfaf3",border:"none",color:"#147d50",padding:"5px 12px",borderRadius:7,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Restore</button>
                              <button onClick={()=>{if(window.confirm(`Permanently delete ${name}?`))permanentlyDelete(entry.id);}} style={{background:"none",border:"none",color:T.muted,fontSize:16,cursor:"pointer",padding:0,flexShrink:0}}>×</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
