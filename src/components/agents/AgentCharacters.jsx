import React from "react";

// ─── AGENT CHARACTERS ────────────────────────────────────────────────────────
export const _STAR = "M 43.5,18.1 Q 50.0,4.0 56.5,18.1 Q 62.9,32.2 78.3,34.0 Q 93.7,35.8 82.3,46.3 Q 70.9,56.8 74.0,72.0 Q 77.0,87.2 63.5,79.6 Q 50.0,72.0 36.5,79.6 Q 23.0,87.2 26.0,72.0 Q 29.1,56.8 17.7,46.3 Q 6.3,35.8 21.7,34.0 Q 37.1,32.2 43.5,18.1 Z";

export const _YELLOW="#F5D13A",_PINK="#F2A7BC",_BLUE="#A8CCEA",_PURPLE="#C9B3E8",_GREEN="#A8D8B0",_ORANGE="#F5A623",_TEAL="#7EC8C8",_CORAL="#F2877B",_SKY="#7BB8E8",_ROSE="#E8879B",_LAVENDER="#B8A9D4",_MINT="#6EC5A8",_PEACH="#F0A87C";

export function _DotEyes({y=42,spread=13,size=5,color="#1a1a1a"}){return<><circle cx={50-spread} cy={y} r={size} fill={color}/><circle cx={50+spread} cy={y} r={size} fill={color}/></>;}
export function _SquintEyes({y=43,spread=13}){return<><path d={`M ${50-spread-6} ${y} Q ${50-spread} ${y-7} ${50-spread+6} ${y}`} stroke="#1a1a1a" strokeWidth="3.2" fill="none" strokeLinecap="round"/><path d={`M ${50+spread-6} ${y} Q ${50+spread} ${y-7} ${50+spread+6} ${y}`} stroke="#1a1a1a" strokeWidth="3.2" fill="none" strokeLinecap="round"/></>;}
export function _OpenMouth({y=62}){return<><rect x="38" y={y} width="24" height="14" rx="7" fill="#1a1a1a"/><ellipse cx="50" cy={y+10} rx="9" ry="5" fill="#e8697a"/></>;}
export function _VMouth({y=63}){return<path d={`M ${50-6} ${y} Q 50 ${y+7} ${50+6} ${y}`} stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>;}
export function _Cheeks({color="rgba(240,120,100,0.25)"}){return<><ellipse cx="34" cy="54" rx="6" ry="4" fill={color}/><ellipse cx="66" cy="54" rx="6" ry="4" fill={color}/></>;}

export function _Logan({mood="idle",bob=0}){
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_YELLOW}/>
    {mood==="excited"?<><_Cheeks color="rgba(240,120,100,0.32)"/><_SquintEyes/><_OpenMouth y={61}/></>
    :mood==="thinking"?<><_DotEyes/><_VMouth y={64}/></>
    :mood==="talking"?<><_Cheeks color="rgba(240,120,100,0.22)"/><_DotEyes/><_OpenMouth y={62}/></>
    :<><_Cheeks color="rgba(240,120,100,0.22)"/><_DotEyes/><_VMouth y={63}/></>}
    <circle cx="84" cy="17" r="12" fill="rgba(210,238,255,0.75)" stroke="#1a1a1a" strokeWidth="2.2"/>
    <circle cx="84" cy="17" r="8" fill="rgba(230,247,255,0.9)"/>
    <line x1="92" y1="25" x2="100" y2="33" stroke="#1a1a1a" strokeWidth="2.8" strokeLinecap="round"/>
    <path d="M 77 42 Q 81 30 82 23" stroke={_YELLOW} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 77 42 Q 81 30 82 23" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>;
}
export function _Rex({mood="idle",bob=0}){
  const frown=mood==="serious"||mood==="thinking";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_PINK}/>
    <_Cheeks color="rgba(240,120,140,0.25)"/>
    {mood==="talking"?<><_DotEyes y={46}/><_OpenMouth y={62}/></>
    :frown?<><_DotEyes y={46}/><path d="M 34 65 Q 50 57 66 65" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/></>
    :<><_DotEyes y={46}/><_VMouth y={64}/></>}
    <rect x="72" y="6" width="21" height="27" rx="3" fill="white" stroke="#1a1a1a" strokeWidth="2.2"/>
    <rect x="78" y="4" width="9" height="7" rx="3.5" fill="#1a1a1a"/>
    <line x1="75.5" y1="17" x2="90.5" y2="17" stroke="#c06070" strokeWidth="2"/>
    <line x1="75.5" y1="21" x2="90.5" y2="21" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="75.5" y1="25" x2="86" y2="25" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="75.5" y1="29" x2="90.5" y2="29" stroke="#aaa" strokeWidth="1.3"/>
    <path d="M 76 43 Q 80 29 81 20" stroke={_PINK} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 76 43 Q 80 29 81 20" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {mood==="thinking"&&<ellipse cx="17" cy="32" rx="4" ry="6" fill="rgba(140,200,255,0.65)"/>}
  </svg>;
}
export function _Nova({mood="idle",bob=0}){
  const excited=mood==="excited";
  const mouth=excited?"M 42 62 Q 50 68 58 62":mood==="thinking"?"M 43 61 Q 50 57 57 61":"M 43 62 Q 50 67 57 62";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_BLUE}/>
    <_Cheeks color="rgba(100,150,220,0.22)"/>
    <circle cx="37" cy="43" r="10" fill="rgba(255,255,255,0.3)" stroke="#1a1a1a" strokeWidth="2.5"/>
    <circle cx="63" cy="43" r="10" fill="rgba(255,255,255,0.3)" stroke="#1a1a1a" strokeWidth="2.5"/>
    <line x1="47" y1="43" x2="53" y2="43" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="27" y1="41" x2="21" y2="39" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="73" y1="41" x2="79" y2="39" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round"/>
    {excited?<><path d="M 31 45 Q 37 40 43 45" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 57 45 Q 63 40 69 45" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><circle cx="37" cy="44" r="4" fill="#1a1a1a"/><circle cx="63" cy="44" r="4" fill="#1a1a1a"/></>}
    {mood==="talking"?<><rect x="38" y="62" width="24" height="14" rx="7" fill="#1a1a1a"/><ellipse cx="50" cy="72" rx="9" ry="5" fill="#e8697a"/></>:<path d={mouth} stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>}
  </svg>;
}
export function _Billie({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_GREEN}/>
    <_Cheeks color="rgba(60,160,90,0.20)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Calculator accessory */}
    <rect x="71" y="5" width="22" height="27" rx="3.5" fill="white" stroke="#1a1a1a" strokeWidth="2.1"/>
    <rect x="73" y="8" width="18" height="7" rx="2" fill="#c8efd4"/>
    <text x="82" y="14.5" fontSize="5" fill="#2a7a3a" textAnchor="middle" fontWeight="700" fontFamily="monospace">AED</text>
    {/* Calc button grid */}
    {[[74,18],[79,18],[84,18],[89,18],[74,23],[79,23],[84,23],[89,23]].map(([x,y],i)=>(
      <rect key={i} x={x} y={y} width="3.5" height="3.5" rx="0.8" fill={i===3||i===7?"#3a9a5a":_GREEN} opacity="0.85"/>
    ))}
    <path d="M 73 46 Q 77 32 78 15" stroke={_GREEN} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 15" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Coin stack */}
    <ellipse cx="19" cy="34" rx="7" ry="3" fill="#F5D13A" stroke="#1a1a1a" strokeWidth="1.5"/>
    <ellipse cx="19" cy="31" rx="7" ry="3" fill="#F5D13A" stroke="#1a1a1a" strokeWidth="1.5"/>
    <ellipse cx="19" cy="28" rx="7" ry="3" fill="#ffe066" stroke="#1a1a1a" strokeWidth="1.5"/>
  </svg>;
}
export function _Cody({mood="idle",bob=0}){
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_ORANGE}/>
    <_Cheeks color="rgba(245,166,35,0.22)"/>
    {mood==="talking"?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :mood==="thinking"?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :mood==="excited"?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Contract/document accessory */}
    <rect x="70" y="5" width="22" height="28" rx="3" fill="white" stroke="#1a1a1a" strokeWidth="2.1"/>
    <line x1="74" y1="12" x2="88" y2="12" stroke={_ORANGE} strokeWidth="2"/>
    <line x1="74" y1="17" x2="88" y2="17" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="74" y1="22" x2="84" y2="22" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="74" y1="27" x2="88" y2="27" stroke="#aaa" strokeWidth="1.3"/>
    {/* Signature scribble */}
    <path d="M 76 25 Q 79 23 82 25 Q 85 27 88 25" stroke={_ORANGE} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 15" stroke={_ORANGE} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 15" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Pen accessory */}
    <line x1="16" y1="22" x2="26" y2="38" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
    <line x1="16" y1="22" x2="26" y2="38" stroke={_ORANGE} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="15" cy="20" r="2" fill="#1a1a1a"/>
  </svg>;
}
export function _Finn({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_TEAL}/>
    <_Cheeks color="rgba(60,160,160,0.20)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Receipt/clipboard accessory */}
    <rect x="70" y="5" width="22" height="28" rx="3" fill="white" stroke="#1a1a1a" strokeWidth="2.1"/>
    <rect x="77" y="3" width="8" height="5" rx="2.5" fill="#1a1a1a"/>
    <line x1="74" y1="13" x2="88" y2="13" stroke={_TEAL} strokeWidth="2"/>
    <line x1="74" y1="17" x2="88" y2="17" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="74" y1="21" x2="84" y2="21" stroke="#aaa" strokeWidth="1.3"/>
    <line x1="74" y1="25" x2="88" y2="25" stroke="#aaa" strokeWidth="1.3"/>
    <text x="86" y="26" fontSize="5" fill="#5aA8A8" fontWeight="700" fontFamily="monospace">$</text>
    <path d="M 73 46 Q 77 32 78 15" stroke={_TEAL} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 15" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Coin accessory */}
    <ellipse cx="19" cy="32" rx="7" ry="3" fill="#F5D13A" stroke="#1a1a1a" strokeWidth="1.5"/>
    <ellipse cx="19" cy="29" rx="7" ry="3" fill="#ffe066" stroke="#1a1a1a" strokeWidth="1.5"/>
    {thinking&&<ellipse cx="17" cy="22" rx="4" ry="6" fill="rgba(100,200,200,0.55)"/>}
  </svg>;
}
export function _Carrie({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_CORAL}/>
    <_Cheeks color="rgba(240,130,120,0.25)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Clapperboard accessory */}
    <rect x="69" y="8" width="24" height="20" rx="2" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
    <rect x="69" y="4" width="24" height="8" rx="2" fill="#1a1a1a"/>
    <line x1="73" y1="4" x2="77" y2="12" stroke="white" strokeWidth="1.5"/>
    <line x1="79" y1="4" x2="83" y2="12" stroke="white" strokeWidth="1.5"/>
    <line x1="85" y1="4" x2="89" y2="12" stroke="white" strokeWidth="1.5"/>
    <line x1="72" y1="18" x2="90" y2="18" stroke={_CORAL} strokeWidth="2"/>
    <line x1="72" y1="22" x2="86" y2="22" stroke="#aaa" strokeWidth="1.3"/>
    <path d="M 74 44 Q 78 30 79 18" stroke={_CORAL} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 74 44 Q 78 30 79 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {thinking&&<ellipse cx="17" cy="32" rx="4" ry="6" fill="rgba(240,130,120,0.55)"/>}
  </svg>;
}
export function _Tina({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_SKY}/>
    <_Cheeks color="rgba(100,160,230,0.22)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Suitcase accessory */}
    <rect x="69" y="10" width="24" height="18" rx="3" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
    <rect x="76" y="6" width="10" height="7" rx="3" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
    <line x1="69" y1="18" x2="93" y2="18" stroke={_SKY} strokeWidth="2"/>
    <circle cx="77" cy="23" r="1.5" fill="#1a1a1a"/>
    <circle cx="85" cy="23" r="1.5" fill="#1a1a1a"/>
    <path d="M 73 46 Q 77 32 78 18" stroke={_SKY} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Globe */}
    <circle cx="19" cy="30" r="8" fill="none" stroke={_SKY} strokeWidth="1.8"/>
    <ellipse cx="19" cy="30" rx="4" ry="8" fill="none" stroke="#1a1a1a" strokeWidth="1.2"/>
    <line x1="11" y1="30" x2="27" y2="30" stroke="#1a1a1a" strokeWidth="1"/>
    {thinking&&<ellipse cx="19" cy="22" rx="4" ry="5" fill="rgba(100,160,230,0.55)"/>}
  </svg>;
}
export function _Tabby({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_ROSE}/>
    <_Cheeks color="rgba(230,130,150,0.25)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Hanger accessory */}
    <path d="M 73 8 L 81 8 L 93 18 L 69 18 Z" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round"/>
    <line x1="81" y1="4" x2="81" y2="8" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="81" cy="3" r="2" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    <rect x="72" y="18" width="18" height="12" rx="2" fill="white" stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="75" y1="22" x2="87" y2="22" stroke={_ROSE} strokeWidth="1.5"/>
    <line x1="75" y1="25" x2="84" y2="25" stroke="#aaa" strokeWidth="1"/>
    <path d="M 73 46 Q 77 32 78 18" stroke={_ROSE} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 73 46 Q 77 32 78 18" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Scissors */}
    <circle cx="16" cy="28" r="4" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    <circle cx="22" cy="34" r="4" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="19" y1="25" x2="25" y2="37" stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="13" y1="31" x2="25" y2="31" stroke="#1a1a1a" strokeWidth="1.5"/>
    {thinking&&<ellipse cx="17" cy="20" rx="4" ry="5" fill="rgba(230,130,150,0.55)"/>}
  </svg>;
}
export function _Polly({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_LAVENDER}/>
    <_Cheeks color="rgba(160,140,210,0.22)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Megaphone/director accessory */}
    <polygon points="70,10 93,5 93,25 70,20" fill="white" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round"/>
    <rect x="66" y="11" width="5" height="8" rx="2" fill={_LAVENDER} stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="75" y1="13" x2="88" y2="11" stroke={_LAVENDER} strokeWidth="1.5"/>
    <line x1="75" y1="17" x2="88" y2="19" stroke="#aaa" strokeWidth="1"/>
    <path d="M 72 44 Q 76 30 70 16" stroke={_LAVENDER} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 72 44 Q 76 30 70 16" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Checklist */}
    <rect x="12" y="22" width="16" height="18" rx="2" fill="white" stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="17" y1="27" x2="25" y2="27" stroke={_LAVENDER} strokeWidth="1.5"/>
    <line x1="17" y1="31" x2="25" y2="31" stroke="#aaa" strokeWidth="1"/>
    <line x1="17" y1="35" x2="23" y2="35" stroke="#aaa" strokeWidth="1"/>
    <path d="M 14 27 L 15.5 28.5 L 17 26" stroke={_LAVENDER} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M 14 31 L 15.5 32.5 L 17 30" stroke={_LAVENDER} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    {thinking&&<ellipse cx="19" cy="18" rx="4" ry="5" fill="rgba(160,140,210,0.55)"/>}
  </svg>;
}
export function _Lillie({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_MINT}/>
    <_Cheeks color="rgba(90,190,160,0.22)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Map pin accessory */}
    <path d="M 81 6 C 88 6 93 11 93 17 C 93 24 81 32 81 32 C 81 32 69 24 69 17 C 69 11 74 6 81 6 Z" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
    <circle cx="81" cy="16" r="4" fill={_MINT} stroke="#1a1a1a" strokeWidth="1.5"/>
    <path d="M 74 44 Q 78 32 79 25" stroke={_MINT} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 74 44 Q 78 32 79 25" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Camera */}
    <rect x="12" y="26" width="16" height="11" rx="2" fill="white" stroke="#1a1a1a" strokeWidth="1.5"/>
    <circle cx="20" cy="32" r="3.5" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    <circle cx="20" cy="32" r="1.5" fill={_MINT}/>
    <rect x="17" y="24" width="6" height="3" rx="1" fill="#1a1a1a"/>
    {thinking&&<ellipse cx="20" cy="20" rx="4" ry="5" fill="rgba(90,190,160,0.55)"/>}
  </svg>;
}
export function _Perry({mood="idle",bob=0}){
  const talking=mood==="talking";const thinking=mood==="thinking";const excited=mood==="excited";
  return<svg viewBox="0 0 100 100" width={120} height={120} style={{overflow:"visible",transform:`translateY(${bob}px)`,transition:"transform 0.05s"}}>
    <path d={_STAR} fill={_PEACH}/>
    <_Cheeks color="rgba(240,168,124,0.22)"/>
    {talking?<><_DotEyes y={44}/><_OpenMouth y={61}/></>
    :excited?<><_SquintEyes y={43}/><_OpenMouth y={62}/></>
    :thinking?<><_DotEyes y={44}/><_VMouth y={63}/></>
    :<><_DotEyes y={44}/><_VMouth y={63}/></>}
    {/* Film reel accessory */}
    <circle cx="81" cy="15" r="12" fill="white" stroke="#1a1a1a" strokeWidth="2"/>
    <circle cx="81" cy="15" r="4" fill={_PEACH} stroke="#1a1a1a" strokeWidth="1.5"/>
    <circle cx="81" cy="6" r="2" fill="#1a1a1a"/>
    <circle cx="81" cy="24" r="2" fill="#1a1a1a"/>
    <circle cx="72" cy="15" r="2" fill="#1a1a1a"/>
    <circle cx="90" cy="15" r="2" fill="#1a1a1a"/>
    <path d="M 74 44 Q 78 32 77 22" stroke={_PEACH} strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 74 44 Q 78 32 77 22" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Play button */}
    <rect x="12" y="24" width="16" height="12" rx="2" fill="white" stroke="#1a1a1a" strokeWidth="1.5"/>
    <polygon points="18,27 18,33 24,30" fill={_PEACH} stroke="#1a1a1a" strokeWidth="1"/>
    {thinking&&<ellipse cx="20" cy="20" rx="4" ry="5" fill="rgba(240,168,124,0.55)"/>}
  </svg>;
}
