// ─── TRAVEL TINA UTILITY CONSTANTS ───────────────────────────────────────────

// ─── TRAVEL ITINERARY (TI) HELPERS ──────────────────────────────────────────
const TI_FLIGHT_COLS = [
  {key:"name",label:"NAME / ROLE",flex:1.2},{key:"dateOut",label:"DATE (OUT)",flex:0.7},{key:"routeOut",label:"ROUTE (OUTBOUND)",flex:2},{key:"timeOut",label:"TIME",flex:0.8},
  {key:"dateReturn",label:"DATE (RET)",flex:0.7},{key:"routeReturn",label:"ROUTE (RETURN)",flex:2},{key:"timeReturn",label:"TIME",flex:0.8},
  {key:"airline",label:"AIRLINE",flex:0.7},{key:"flightNo",label:"FLIGHT NO.",flex:0.7},{key:"bookingRef",label:"BOOKING REF",flex:0.7},
];
const TI_CAR_COLS = [
  {key:"name",label:"NAME",flex:1.2},{key:"date",label:"DATE",flex:0.7},{key:"flightTime",label:"FLIGHT TIME",flex:0.8},{key:"collectionTime",label:"COLLECTION",flex:0.6},
  {key:"flightNo",label:"FLIGHT NO.",flex:0.7},{key:"pickUp",label:"PICK UP ADDRESS",flex:2},{key:"dropOff",label:"DROP OFF ADDRESS",flex:2},
  {key:"vehicleType",label:"VEHICLE",flex:0.7},{key:"bookingRef",label:"BOOKING REF",flex:0.8},
];
const TI_HOTEL_COLS = [
  {key:"name",label:"NAME / ROLE",flex:1.2},{key:"hotel",label:"HOTEL",flex:1.5},{key:"address",label:"ADDRESS",flex:2},
  {key:"checkIn",label:"CHECK IN",flex:0.7},{key:"checkOut",label:"CHECK OUT",flex:0.7},{key:"roomType",label:"ROOM TYPE",flex:0.7},
  {key:"bookingRef",label:"BOOKING REF",flex:0.7},{key:"notes",label:"NOTES",flex:1},
];
const TI_ROOMING_COLS = [
  {key:"passportName",label:"PASSPORT NAME",flex:1.5},{key:"hotel",label:"HOTEL / PROPERTY",flex:1.3},
  {key:"roomType",label:"ROOM TYPE",flex:0.7},{key:"sharingWith",label:"SHARING WITH",flex:1},
  {key:"checkIn",label:"CHECK IN",flex:0.6},{key:"checkOut",label:"CHECK OUT",flex:0.6},
  {key:"confirmNo",label:"CONF. NO.",flex:0.7},{key:"requests",label:"SPECIAL REQUESTS",flex:1.2},
];
const TI_MOVEMENT_COLS = [
  {key:"time",label:"TIME",width:55},{key:"activity",label:"ACTIVITY",flex:2},{key:"location",label:"LOCATION",flex:1.2},
  {key:"transport",label:"TRANSPORT",flex:0.7},{key:"who",label:"WHO",flex:0.8},{key:"notes",label:"NOTES",flex:1},
];
const tiMkMove = () => ({id:"mv"+Date.now()+Math.random(),time:"",activity:"",location:"",transport:"",who:"",notes:""});
const tiMkDay = () => ({id:"dy"+Date.now()+Math.random(),date:"",title:"",moves:[tiMkMove(),tiMkMove(),tiMkMove()]});
const TRAVEL_ITINERARY_INIT = {
  project:{name:"[Project Name]",client:"[Client Name]",date:"[Date]",producer:"[Producer]",destination:"[Destination]"},
  sections:[
    {id:"flights",type:"flights",title:"FLIGHT SCHEDULE",subtitle:"",data:[{id:1,name:"[Name / Role]",dateOut:"[Date]",routeOut:"[City (Code) > City (Code)]",timeOut:"[00:00 > 00:00]",dateReturn:"[Date]",routeReturn:"[City (Code) > City (Code)]",timeReturn:"[00:00 > 00:00]",airline:"[Airline]",flightNo:"[XX 000]",bookingRef:"[Ref]"}]},
    {id:"cars",type:"cars",title:"AIRPORT TRANSFERS",subtitle:"All passengers will receive a text with driver details and live tracking link.",data:[{id:1,name:"[Name]",date:"[Date]",flightTime:"[00:00 > 00:00]",collectionTime:"[00:00]",flightNo:"[XX 000]",pickUp:"[Airport / Hotel / Full Address]",dropOff:"[Hotel / Location / Full Address]",vehicleType:"[Sedan]",bookingRef:"[Ref]"}]},
    {id:"hotels",type:"hotels",title:"HOTEL ACCOMMODATION",subtitle:"",data:[{id:1,name:"[Name / Role]",hotel:"[Hotel Name]",address:"[Full Address]",checkIn:"[Date]",checkOut:"[Date]",roomType:"[Standard]",bookingRef:"[Ref]",notes:""}]},
  ],
  rooming:[
    {id:"rm1",passportName:"",hotel:"",roomType:"",sharingWith:"",checkIn:"",checkOut:"",confirmNo:"",requests:""},
    {id:"rm2",passportName:"",hotel:"",roomType:"",sharingWith:"",checkIn:"",checkOut:"",confirmNo:"",requests:""},
    {id:"rm3",passportName:"",hotel:"",roomType:"",sharingWith:"",checkIn:"",checkOut:"",confirmNo:"",requests:""},
  ],
  moveDays:null,
  travelTab:"itinerary",
  notes:"This itinerary, its commission, contents and subject are all strictly confidential. We ask that you do not cite or reference in any way or manner, designers, shoot details, models, partners or suppliers without their and the client\u2019s prior express permission, until release of the subject photographs/film/recordings into the public domain.",
};

export { TI_FLIGHT_COLS, TI_CAR_COLS, TI_HOTEL_COLS, TI_ROOMING_COLS, TI_MOVEMENT_COLS, tiMkMove, tiMkDay, TRAVEL_ITINERARY_INIT };
