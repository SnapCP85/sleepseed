/**
 * storyScenes.tsx
 * 12 unique animated SVG scenes for SleepSeed story illustrations.
 * Each is a self-contained React component with inline CSS animations.
 * Selection: getSceneIndex(seed) → 0-11
 */

import React from 'react';

/* ─── Shared keyframes injected once ─── */
const SHARED_CSS = `
@keyframes ss-twinkle{0%,100%{opacity:.06;transform:scale(.5)}50%{opacity:1;transform:scale(1.3)}}
@keyframes ss-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes ss-bob2{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes ss-glow{0%,100%{opacity:.25}50%{opacity:.9}}
@keyframes ss-drift{0%{transform:translate(0,0)}33%{transform:translate(6px,-8px)}66%{transform:translate(-5px,-5px)}100%{transform:translate(0,0)}}
@keyframes ss-drift2{0%{transform:translate(0,0)}40%{transform:translate(-7px,-10px)}70%{transform:translate(5px,-6px)}100%{transform:translate(0,0)}}
@keyframes ss-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes ss-wave{0%,100%{d:path("M0 150 Q50 135 100 148 Q150 160 200 148 Q250 135 300 148 Q350 160 400 148 L400 190 L0 190Z")}50%{d:path("M0 148 Q50 160 100 148 Q150 135 200 148 Q250 160 300 148 Q350 135 400 148 L400 190 L0 190Z")}}
@keyframes ss-spark{0%,100%{opacity:0;transform:scale(0)}40%,60%{opacity:1;transform:scale(1)}}
@keyframes ss-smoke{0%{opacity:0;transform:translate(0,0) scale(.8)}50%{opacity:.35}100%{opacity:0;transform:translate(0,-16px) scale(2.5)}}
@keyframes ss-aurora{0%,100%{opacity:.18;transform:skewX(-5deg)}50%{opacity:.55;transform:skewX(5deg)}}
@keyframes ss-shoot{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(-120px,60px)}}
@keyframes ss-float-r{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}
@keyframes ss-pulse{0%,100%{r:4}50%{r:6.5}}
`;
let cssInjected = false;
function ensureCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.textContent = SHARED_CSS;
  document.head.appendChild(s);
  cssInjected = true;
}

/* ─── Scene 0: The Bedroom ─────────────────────────────────────
   Warm amber. Child reading, dragon, fairies, owl, bunny.       */
export const SceneBedroom: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s0-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#04091a"/><stop offset="100%" stopColor="#0c1830"/></linearGradient>
        <radialGradient id="s0-moon" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fef3c0"/><stop offset="100%" stopColor="#e2c050"/></radialGradient>
        <radialGradient id="s0-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#04091a" stopOpacity=".45"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s0-sky)"/>
      {[[12,9,1.3],[28,18,.7],[42,6,1],[55,14,1.3],[70,4,.8],[88,11,1],[105,7,1.3],[118,19,.7],[135,5,1],[152,13,1],[170,8,1.3],[188,16,.7],[205,4,1],[222,11,.8],[240,7,1.3],[258,14,1],[275,5,.8],[292,18,1],[310,9,1.3],[325,4,.7],[338,16,1],[352,8,1.3],[365,13,.7],[378,5,1],[390,18,.8]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill="white" style={{animation:`ss-twinkle ${(2+((i*73)%30)/10).toFixed(1)}s ease-in-out infinite ${-((i*47)%40)/10}s`}}/>
      ))}
      <circle cx="344" cy="26" r="38" fill="#fde68a" opacity=".07" style={{animation:'ss-glow 4s ease-in-out infinite'}}/>
      <circle cx="344" cy="26" r="17" fill="url(#s0-moon)"/>
      <circle cx="338" cy="21" r="3" fill="#f0de88" opacity=".4"/>
      <path d="M0 154 Q40 131 80 146 Q120 126 160 139 Q200 119 240 135 Q280 117 320 131 Q355 119 400 129 L400 190 L0 190Z" fill="#060d1c"/>
      <path d="M0 169 Q50 156 100 164 Q150 153 200 161 Q250 151 300 159 Q350 152 400 158 L400 190 L0 190Z" fill="#080f22"/>
      <rect x="20" y="52" width="46" height="72" rx="23" fill="#0b1833" stroke="#243258" strokeWidth="2.5"/>
      <line x1="43" y1="52" x2="43" y2="124" stroke="#243258" strokeWidth="1.5"/>
      <line x1="20" y1="90" x2="66" y2="90" stroke="#243258" strokeWidth="1.5"/>
      <path d="M15 47 Q20 72 15 127 Q27 111 26 87 Q28 66 22 49Z" fill="#1c2e6a" opacity=".88"/>
      <path d="M71 47 Q66 72 71 127 Q59 111 60 87 Q58 66 64 49Z" fill="#1c2e6a" opacity=".88"/>
      <rect x="137" y="100" width="11" height="78" rx="3" fill="#3e1e07"/>
      <rect x="252" y="100" width="11" height="78" rx="3" fill="#3e1e07"/>
      <circle cx="142" cy="99" r="7.5" fill="#4e2808"/>
      <circle cx="258" cy="99" r="7.5" fill="#4e2808"/>
      <rect x="148" y="107" width="104" height="40" rx="10" fill="#5c2c08"/>
      <rect x="135" y="141" width="130" height="34" rx="6" fill="#1c2c58"/>
      <path d="M135 147 Q200 141 265 147 L265 175 Q200 179 135 175Z" fill="#1a307a"/>
      <ellipse cx="200" cy="147" rx="37" ry="9" fill="#d8d2c0"/>
      <ellipse cx="200" cy="145" rx="35" ry="7" fill="#eeead8"/>
      <circle cx="200" cy="136" r="12" fill="#f0c898"/>
      <path d="M188 132 Q196 122 204 122 Q213 122 214 129 Q212 125 204 124 Q196 124 188 131Z" fill="#6a3608"/>
      <ellipse cx="196" cy="137" rx="2.2" ry="1.4" fill="#3a2010"/>
      <ellipse cx="204" cy="137" rx="2.2" ry="1.4" fill="#3a2010"/>
      <path d="M196.5 143 Q200 145.5 203.5 143" fill="none" stroke="#c07858" strokeWidth="1.3" strokeLinecap="round"/>
      <ellipse cx="200" cy="161" rx="22" ry="9" fill="#fef3c0" opacity=".2" style={{animation:'ss-glow 2.5s ease-in-out infinite .5s'}}/>
      <path d="M181 153 Q191 147 200 150 L200 166 Q191 163 181 167Z" fill="#fef5e0"/>
      <path d="M219 153 Q209 147 200 150 L200 166 Q209 163 219 167Z" fill="#f5e8ce"/>
      <line x1="200" y1="150" x2="200" y2="166" stroke="#c4a870" strokeWidth="2"/>
      <g style={{animation:'ss-bob 6.5s ease-in-out infinite'}}>
        <path d="M30 183 Q20 175 18 183 Q16 191 29 189 Q41 187 48 179" fill="none" stroke="#389058" strokeWidth="7" strokeLinecap="round"/>
        <ellipse cx="74" cy="173" rx="26" ry="15" fill="#3d9060"/>
        <ellipse cx="74" cy="176" rx="16" ry="9.5" fill="#78c898" opacity=".72"/>
        <ellipse cx="97" cy="153" rx="14" ry="11" fill="#3d9060"/>
        <circle cx="99" cy="149" r="4" fill="#fde068"/>
        <circle cx="99" cy="149" r="2.5" fill="#1a3a1a"/>
        <path d="M90 145 L87 138 L93 143Z" fill="#2d7048"/>
        <circle cx="116" cy="150" r="3.5" fill="#b8ccb8" style={{animation:'ss-smoke 2s ease-out infinite'}}/>
        <circle cx="120" cy="147" r="3" fill="#b8ccb8" style={{animation:'ss-smoke 2s ease-out infinite .6s'}}/>
      </g>
      <g style={{animation:'ss-bob 5s ease-in-out infinite 1.2s'}} transform="translate(258,90)">
        <ellipse cx="0" cy="5" rx="10" ry="12" fill="#8b5e28"/>
        <circle cx="0" cy="-8" r="10.5" fill="#8b5e28"/>
        <path d="M-7 -17 L-10 -24 L-3 -18Z" fill="#6b3e18"/>
        <path d="M7 -17 L10 -24 L3 -18Z" fill="#6b3e18"/>
        <circle cx="-3.5" cy="-8.5" r="5" fill="#fde068"/>
        <circle cx="3.5" cy="-8.5" r="5" fill="#fde068"/>
        <circle cx="-3.5" cy="-8.5" r="3.2" fill="#1a100a"/>
        <circle cx="3.5" cy="-8.5" r="3.2" fill="#1a100a"/>
        <circle cx="-2.4" cy="-9.5" r="1.1" fill="white"/>
        <circle cx="4.6" cy="-9.5" r="1.1" fill="white"/>
        <path d="M-1.5 -5.5 L0 -3.5 L1.5 -5.5 Q0 -4.5 -1.5 -5.5Z" fill="#d4a030"/>
      </g>
      <g style={{animation:'ss-drift 4.5s ease-in-out infinite'}} transform="translate(86,62)">
        <circle cx="0" cy="0" r="17" fill="#86efac" opacity=".2" style={{animation:'ss-glow 2.2s ease-in-out infinite'}}/>
        <ellipse cx="-12" cy="-4" rx="11" ry="5.5" fill="#bbf7d0" opacity=".58" transform="rotate(-28,-12,-4)"/>
        <ellipse cx="12" cy="-4" rx="11" ry="5.5" fill="#bbf7d0" opacity=".58" transform="rotate(28,12,-4)"/>
        <ellipse cx="0" cy="1" rx="3.5" ry="4.5" fill="#d1fae5"/>
        <circle cx="0" cy="-6.5" r="5.5" fill="#fcd7aa"/>
        <path d="M-5.5 -8.5 Q0 -15 5.5 -8.5 Q3 -12 0 -12 Q-3 -12 -5.5 -8.5Z" fill="#fde68a"/>
        <circle cx="-1.8" cy="-6.5" r="1.3" fill="#2a1808"/>
        <circle cx="1.8" cy="-6.5" r="1.3" fill="#2a1808"/>
        <line x1="4.5" y1="1" x2="17" y2="-12" stroke="#fde68a" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="17" cy="-12" r="3.5" fill="#fde068" style={{animation:'ss-spark 1.3s ease-in-out infinite'}}/>
      </g>
      <g style={{animation:'ss-bob 4.8s ease-in-out infinite .7s'}} transform="translate(330,162)">
        <ellipse cx="0" cy="0" rx="13" ry="11" fill="#e8e2da"/>
        <circle cx="11" cy="2" r="4.5" fill="white" opacity=".9"/>
        <circle cx="0" cy="-14" r="10.5" fill="#e8e2da"/>
        <ellipse cx="-7.5" cy="-26" rx="3.5" ry="9.5" fill="#e8e2da"/>
        <ellipse cx="3.5" cy="-27" rx="3.5" ry="10" fill="#e8e2da"/>
        <circle cx="-6" cy="-15" r="2.8" fill="#f08090"/>
        <circle cx="-6" cy="-15" r="1.7" fill="#2a0a0a"/>
        <circle cx="2" cy="-15" r="2.8" fill="#f08090"/>
        <circle cx="2" cy="-15" r="1.7" fill="#2a0a0a"/>
        <ellipse cx="-2" cy="-10.5" rx="1.6" ry="1.1" fill="#f080a0"/>
      </g>
      <rect width="400" height="190" fill="url(#s0-vig)"/>
    </svg>
  );
};

/* ─── Scene 1: Enchanted Forest ────────────────────────────────
   Deep emerald. Glowing trees, fireflies, fox, giant mushrooms.  */
export const SceneForest: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s1-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#030a10"/><stop offset="100%" stopColor="#061420"/></linearGradient>
        <radialGradient id="s1-treeglow" cx="50%" cy="0%" r="80%"><stop offset="0%" stopColor="#22c55e" stopOpacity=".18"/><stop offset="100%" stopColor="#22c55e" stopOpacity="0"/></radialGradient>
        <radialGradient id="s1-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#030a10" stopOpacity=".6"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s1-sky)"/>
      {[[30,12,1.1],[80,6,.8],[140,10,1.3],[200,5,.9],[260,8,1.1],[320,12,.7],[370,6,1],[50,25,.7],[170,20,1],[290,18,.8],[360,22,1.2]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill="white" style={{animation:`ss-twinkle ${(2.5+i*.3).toFixed(1)}s ease-in-out infinite ${-(i*.4).toFixed(1)}s`}}/>
      ))}
      <circle cx="60" cy="22" r="12" fill="#e2f0c8"/>
      <circle cx="53" cy="18" r="10" fill="#07110c"/>
      <rect width="400" height="190" fill="url(#s1-treeglow)"/>
      {/* Far trees */}
      {[20,70,130,200,270,330,380].map((x,i)=>(
        <g key={i}>
          <rect x={x-4} y={80+i%2*10} width="8" height={90-i%2*10} fill="#1a3a1a"/>
          <ellipse cx={x} cy={75+i%2*8} rx={22-i%3*4} ry={30-i%3*5} fill={i%2===0?"#1a4a1a":"#153812"}/>
          <ellipse cx={x} cy={65+i%2*8} rx={18-i%3*3} ry={25-i%3*4} fill={i%2===0?"#204520":"#1a4020"}/>
          <ellipse cx={x} cy={52+i%2*6} rx={14-i%3*2} ry={20-i%3*3} fill="#245022"/>
          {/* Glow on tree top */}
          <circle cx={x} cy={55+i%2*6} r="8" fill="#4ade80" opacity=".06" style={{animation:`ss-glow ${(3+i*.5).toFixed(1)}s ease-in-out infinite ${-(i*.7).toFixed(1)}s`}}/>
        </g>
      ))}
      {/* Ground */}
      <path d="M0 168 Q50 160 100 166 Q150 158 200 165 Q250 157 300 164 Q350 158 400 163 L400 190 L0 190Z" fill="#0a1f0a"/>
      <path d="M0 178 Q80 173 160 177 Q240 172 320 176 Q360 173 400 175 L400 190 L0 190Z" fill="#06120a"/>
      {/* Giant glowing mushrooms */}
      {[[60,170,16,18,"#86efac","#22c55e"],[115,175,11,13,"#bbf7d0","#4ade80"],[340,168,14,17,"#86efac","#22c55e"]].map(([x,y,rx,ry,c1,c2],i)=>(
        <g key={i}>
          <rect x={+x-3} y={+y-+ry} width="6" height={+ry} fill="#d4c0a0"/>
          <ellipse cx={+x} cy={+y-+ry} rx={+rx} ry={+ry*.55} fill={c2 as string} style={{animation:`ss-glow ${(2+i*.7).toFixed(1)}s ease-in-out infinite`}}/>
          <ellipse cx={+x} cy={+y-+ry-.5} rx={+rx*.8} ry={+ry*.38} fill={c1 as string} opacity=".7"/>
          {[-.6,0,.6].map((dx,j)=><circle key={j} cx={+x+dx*+rx*.5} cy={+y-+ry-.3} r={+rx*.1} fill="white" opacity=".7"/>)}
        </g>
      ))}
      {/* Fireflies */}
      {[[100,90],[150,75],[200,100],[250,85],[300,95],[160,110],[240,70]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="2.2" fill="#fde68a" style={{animation:`ss-spark ${(1.5+i*.3).toFixed(1)}s ease-in-out infinite ${-(i*.5).toFixed(1)}s`}}/>
      ))}
      {/* Fox */}
      <g style={{animation:'ss-bob 5s ease-in-out infinite .8s'}} transform="translate(200,165)">
        <ellipse cx="0" cy="0" rx="16" ry="10" fill="#c2440c"/>
        <ellipse cx="0" cy="1" rx="9" ry="6" fill="#fde68a" opacity=".6"/>
        <path d="M14 -4 Q22 -14 18 -3" fill="#c2440c"/>
        <path d="M-14 -4 Q-22 -14 -18 -3" fill="#c2440c"/>
        <circle cx="0" cy="-12" r="8.5" fill="#c2440c"/>
        <ellipse cx="0" cy="-10" rx="5" ry="4" fill="#fde68a" opacity=".55"/>
        <circle cx="-3" cy="-13.5" r="1.8" fill="#1a0a00"/>
        <circle cx="3" cy="-13.5" r="1.8" fill="#1a0a00"/>
        <ellipse cx="0" cy="-10" rx="1.5" ry="1" fill="#c06030"/>
        <path d="M18 5 Q25 2 28 8 Q22 9 18 6Z" fill="white" opacity=".85"/>
      </g>
      <rect width="400" height="190" fill="url(#s1-vig)"/>
    </svg>
  );
};

/* ─── Scene 2: Moonlit Ocean ───────────────────────────────────
   Deep teal. Waves, lighthouse beam, friendly whale, starfish.   */
export const SceneOcean: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s2-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#020810"/><stop offset="100%" stopColor="#041828"/></linearGradient>
        <linearGradient id="s2-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#064e63"/><stop offset="100%" stopColor="#023040"/></linearGradient>
        <radialGradient id="s2-beam" cx="50%" cy="0%" r="100%"><stop offset="0%" stopColor="#fef3c0" stopOpacity=".35"/><stop offset="100%" stopColor="#fef3c0" stopOpacity="0"/></radialGradient>
        <radialGradient id="s2-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#020810" stopOpacity=".55"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s2-sky)"/>
      {[[20,8,.9],[55,15,1.2],[90,5,.7],[130,12,1],[175,7,.8],[220,13,1.3],[270,6,.9],[310,11,.7],[355,8,1.1],[385,16,.8],[40,28,.7],[160,24,1],[300,26,.8]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill="white" style={{animation:`ss-twinkle ${(2+i*.28).toFixed(1)}s ease-in-out infinite ${-(i*.45).toFixed(1)}s`}}/>
      ))}
      <circle cx="320" cy="28" r="15" fill="#fef3c0"/>
      <circle cx="313" cy="23" r="12.5" fill="#030e1e"/>
      {/* Moon reflection on sea */}
      <ellipse cx="320" cy="118" rx="12" ry="30" fill="#fef3c0" opacity=".08" style={{animation:'ss-glow 3s ease-in-out infinite'}}/>
      {/* Lighthouse */}
      <rect x="18" y="70" width="14" height="60" fill="#1e3a5a"/>
      <rect x="16" y="65" width="18" height="10" rx="2" fill="#2a5080"/>
      <rect x="22" y="58" width="6" height="12" fill="#e8c840"/>
      <rect x="20" y="56" width="10" height="5" rx="1" fill="#c8a830"/>
      <circle cx="25" cy="60" r="5" fill="#fef3c0" opacity=".9" style={{animation:'ss-glow 1.8s ease-in-out infinite'}}/>
      {/* Lighthouse beam */}
      <polygon points="25,60 80,40 90,80" fill="url(#s2-beam)" style={{animation:'ss-glow 2s ease-in-out infinite .5s',transformOrigin:'25px 60px'}}/>
      {/* Island */}
      <ellipse cx="25" cy="132" rx="30" ry="8" fill="#1a4a2a"/>
      <path d="M15 132 Q25 115 35 132Z" fill="#2a6a3a"/>
      {/* Sea */}
      <rect x="0" y="115" width="400" height="75" fill="url(#s2-sea)"/>
      {/* Waves */}
      <path d="M0 120 Q50 113 100 120 Q150 127 200 120 Q250 113 300 120 Q350 127 400 120" fill="none" stroke="#0891b2" strokeWidth="1.5" opacity=".5" style={{animation:'ss-float-r 3s ease-in-out infinite'}}/>
      <path d="M0 130 Q60 123 120 130 Q180 137 240 130 Q300 123 360 130 Q380 133 400 130" fill="none" stroke="#0891b2" strokeWidth="1" opacity=".35" style={{animation:'ss-float-r 4s ease-in-out infinite .8s'}}/>
      {/* Whale */}
      <g style={{animation:'ss-bob2 7s ease-in-out infinite'}}>
        <path d="M130 135 Q180 122 230 130 Q240 132 245 138 Q240 145 230 142 Q180 148 130 138Z" fill="#1e6080"/>
        <ellipse cx="165" cy="133" rx="35" ry="14" fill="#236e90"/>
        <path d="M130 137 Q120 128 115 135 Q118 143 130 140Z" fill="#1e6080"/>
        <circle cx="158" cy="131" r="3.5" fill="#0c2a40"/>
        <circle cx="158" cy="131" r="1.5" fill="white"/>
        <ellipse cx="175" cy="126" rx="8" ry="4" fill="#1e6080"/>
        {/* Whale spout */}
        <ellipse cx="163" cy="120" rx="3" ry="8" fill="#a0d4e8" opacity=".5" style={{animation:'ss-smoke 2.2s ease-out infinite'}}/>
      </g>
      {/* Sea foam sparkles */}
      {[[80,118],[180,125],[290,120],[350,128]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1.5" fill="white" opacity=".6" style={{animation:`ss-spark ${(2+i*.4).toFixed(1)}s ease-in-out infinite ${-(i*.6).toFixed(1)}s`}}/>
      ))}
      {/* Stars on water surface */}
      {[[110,138],[270,140],[360,135]].map(([x,y],i)=>(
        <text key={i} x={x} y={y} fontSize="8" fill="#86efac" opacity=".7" textAnchor="middle" style={{animation:`ss-spark ${(2.5+i*.5).toFixed(1)}s ease-in-out infinite ${-(i*.8).toFixed(1)}s`}}>✦</text>
      ))}
      <rect width="400" height="190" fill="url(#s2-vig)"/>
    </svg>
  );
};

/* ─── Scene 3: Arctic Aurora ───────────────────────────────────
   Ice blue + purple. Northern lights, polar bear, icy landscape. */
export const SceneArctic: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s3-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#020614"/><stop offset="100%" stopColor="#060e24"/></linearGradient>
        <linearGradient id="s3-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a8d8f0"/><stop offset="100%" stopColor="#7ac0e0"/></linearGradient>
        <radialGradient id="s3-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#020614" stopOpacity=".5"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s3-sky)"/>
      {[[15,10,1],[50,18,.8],[95,8,1.2],[145,14,.7],[195,6,1],[245,12,.9],[295,9,1.1],[345,15,.7],[385,7,.9],[35,30,.7],[180,26,1],[330,28,.8]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill="white" style={{animation:`ss-twinkle ${(2.2+i*.32).toFixed(1)}s ease-in-out infinite ${-(i*.5).toFixed(1)}s`}}/>
      ))}
      {/* Aurora bands */}
      {[
        {y:30,h:45,c:"#22d3ee",op:.22,delay:'0s'},
        {y:45,h:55,c:"#818cf8",op:.18,delay:'.8s'},
        {y:55,h:50,c:"#4ade80",op:.15,delay:'1.5s'},
        {y:25,h:40,c:"#f472b6",op:.12,delay:'2.2s'},
      ].map((a,i)=>(
        <rect key={i} x="0" y={a.y} width="400" height={a.h} fill={a.c} opacity={a.op}
          style={{animation:`ss-aurora ${(3.5+i*.6).toFixed(1)}s ease-in-out infinite ${a.delay}`,transformOrigin:'200px 50px'}}/>
      ))}
      {/* Stars through aurora */}
      <circle cx="200" cy="18" r="1.5" fill="white" opacity=".8"/>
      <circle cx="100" cy="22" r="1" fill="white" opacity=".6"/>
      {/* Ice mountains */}
      <path d="M0 130 L40 90 L80 115 L120 75 L160 105 L200 65 L240 100 L280 78 L320 108 L360 82 L400 110 L400 190 L0 190Z" fill="#0c2a45"/>
      <path d="M0 130 L40 90 L80 115" fill="none" stroke="#a8d8f0" strokeWidth=".8" opacity=".4"/>
      <path d="M120 75 L160 105 L200 65" fill="none" stroke="#a8d8f0" strokeWidth=".8" opacity=".4"/>
      <path d="M240 100 L280 78 L320 108" fill="none" stroke="#a8d8f0" strokeWidth=".8" opacity=".4"/>
      {/* Snow ground */}
      <path d="M0 155 Q50 148 100 155 Q150 162 200 155 Q250 148 300 155 Q350 162 400 155 L400 190 L0 190Z" fill="url(#s3-snow)"/>
      <path d="M0 167 Q80 162 160 167 Q240 172 320 167 Q360 163 400 166 L400 190 L0 190Z" fill="white" opacity=".7"/>
      {/* Ice crystals */}
      {[[50,152],[150,156],[280,153],[370,157]].map(([x,y],i)=>(
        <g key={i}>
          <line x1={x} y1={y-8} x2={x} y2={y+8} stroke="#a0d8f0" strokeWidth="1.5" opacity=".8"/>
          <line x1={x-7} y1={y-4} x2={x+7} y2={y+4} stroke="#a0d8f0" strokeWidth="1.5" opacity=".8"/>
          <line x1={x+7} y1={y-4} x2={x-7} y2={y+4} stroke="#a0d8f0" strokeWidth="1.5" opacity=".8"/>
        </g>
      ))}
      {/* Polar bear */}
      <g style={{animation:'ss-bob 6s ease-in-out infinite 1s'}}>
        <ellipse cx="200" cy="165" rx="22" ry="14" fill="#e8f4fc"/>
        <ellipse cx="200" cy="167" rx="14" ry="9" fill="white" opacity=".6"/>
        <circle cx="200" cy="151" r="13" fill="#e8f4fc"/>
        <ellipse cx="192" cy="142" rx="4" ry="6" fill="#e8f4fc"/>
        <ellipse cx="208" cy="142" rx="4" ry="6" fill="#e8f4fc"/>
        <circle cx="196" cy="151.5" r="2.5" fill="#1a100a"/>
        <circle cx="204" cy="151.5" r="2.5" fill="#1a100a"/>
        <ellipse cx="200" cy="155" rx="2.5" ry="1.5" fill="#1a100a"/>
        <path d="M196 158 Q200 160.5 204 158" fill="none" stroke="#8a6050" strokeWidth="1.2" strokeLinecap="round"/>
      </g>
      {/* Penguin */}
      <g style={{animation:'ss-bob 4.5s ease-in-out infinite .3s'}} transform="translate(310,162)">
        <ellipse cx="0" cy="0" rx="8" ry="12" fill="#1a1a2a"/>
        <ellipse cx="0" cy="2" rx="5" ry="8" fill="white"/>
        <circle cx="0" cy="-10" r="7" fill="#1a1a2a"/>
        <ellipse cx="-3.5" cy="-10" r="3" fill="#1a1a2a"/>
        <ellipse cx="3.5" cy="-10" r="3" fill="#1a1a2a"/>
        <circle cx="-2" cy="-10.5" r="2" fill="#fde68a"/>
        <circle cx="2" cy="-10.5" r="2" fill="#fde68a"/>
        <circle cx="-2" cy="-11" r="1.2" fill="#1a1a2a"/>
        <circle cx="2" cy="-11" r="1.2" fill="#1a1a2a"/>
        <path d="M-1.5 -8 L0 -6.5 L1.5 -8" fill="#fde68a"/>
        <path d="M-8 -3 Q-14 1 -12 6" stroke="#1a1a2a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M8 -3 Q14 1 12 6" stroke="#1a1a2a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </g>
      <rect width="400" height="190" fill="url(#s3-vig)"/>
    </svg>
  );
};

/* ─── Scene 4: Desert Night ────────────────────────────────────
   Warm amber/purple. Shooting stars, camel, dunes, oasis palm.  */
export const SceneDesert: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s4-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#080310"/><stop offset="100%" stopColor="#180830"/></linearGradient>
        <linearGradient id="s4-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c2780a"/><stop offset="100%" stopColor="#8a4a05"/></linearGradient>
        <radialGradient id="s4-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#080310" stopOpacity=".55"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s4-sky)"/>
      {[[10,8,1.2],[35,22,.8],[68,10,1],[110,5,.9],[155,18,1.3],[205,8,.7],[250,14,1],[295,6,.8],[340,20,1.1],[375,11,.9],[55,35,.7],[200,30,.8],[310,33,1]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill="#fde68a" style={{animation:`ss-twinkle ${(2+i*.31).toFixed(1)}s ease-in-out infinite ${-(i*.42).toFixed(1)}s`}}/>
      ))}
      {/* Big moon */}
      <circle cx="280" cy="30" r="18" fill="#fef3c0"/>
      <circle cx="274" cy="25" r="14" fill="#0e0520"/>
      {/* Shooting stars */}
      <line x1="350" y1="15" x2="280" y2="45" stroke="#fde68a" strokeWidth="1.5" opacity=".8" style={{animation:'ss-shoot 4s ease-in-out infinite'}}/>
      <line x1="300" y1="8" x2="240" y2="35" stroke="#fde68a" strokeWidth="1" opacity=".6" style={{animation:'ss-shoot 6s ease-in-out infinite 2s'}}/>
      {/* Sand dunes */}
      <path d="M0 120 Q60 90 130 115 Q200 140 280 105 Q340 85 400 110 L400 190 L0 190Z" fill="#8a4a05"/>
      <path d="M0 135 Q50 120 110 130 Q170 142 230 128 Q290 115 350 130 Q375 137 400 130 L400 190 L0 190Z" fill="url(#s4-sand)"/>
      <path d="M0 150 Q60 145 120 150 Q180 155 240 148 Q300 142 360 150 Q385 154 400 150 L400 190 L0 190Z" fill="#c8800a"/>
      <path d="M0 165 Q80 162 160 166 Q240 170 320 165 Q370 163 400 165 L400 190 L0 190Z" fill="#d4900e"/>
      {/* Oasis */}
      <ellipse cx="80" cy="158" rx="25" ry="8" fill="#0a4a18"/>
      <rect x="78" y="105" width="4" height="55" fill="#6b3a0a"/>
      {[[-18,-15,-30],[0,-35,-5],[18,-15,30],[-8,-25,20],[8,-25,-15]].map(([dx,dy,rot],i)=>(
        <ellipse key={i} cx={80+dx} cy={115+dy} rx="14" ry="6" fill="#16a34a" transform={`rotate(${rot},${80+dx},${115+dy})`}/>
      ))}
      {/* Camel */}
      <g style={{animation:'ss-bob 7s ease-in-out infinite .5s'}}>
        <ellipse cx="240" cy="148" rx="30" ry="18" fill="#b87020"/>
        <ellipse cx="240" cy="145" rx="20" ry="12" fill="#c87828"/>
        <path d="M225 132 Q223 115 228 112 Q233 115 233 130Z" fill="#c87828"/>
        <path d="M250 130 Q248 113 253 110 Q258 113 258 128Z" fill="#c87828"/>
        <circle cx="228" cy="110" r="8" fill="#c87828"/>
        <circle cx="235" cy="104" r="5" fill="#c87828"/>
        <circle cx="225" cy="109" r="2" fill="#1a0a00"/>
        <ellipse cx="235" cy="106" rx="2.5" ry="1.5" fill="#1a0a00"/>
        <rect x="210" y="162" width="5" height="20" rx="2" fill="#a05a10"/>
        <rect x="220" y="162" width="5" height="22" rx="2" fill="#a05a10"/>
        <rect x="252" y="162" width="5" height="22" rx="2" fill="#a05a10"/>
        <rect x="262" y="162" width="5" height="20" rx="2" fill="#a05a10"/>
      </g>
      {/* Distant pyramids */}
      <path d="M330 125 L355 90 L380 125Z" fill="#6a3a05" opacity=".6"/>
      <path d="M355 125 L375 98 L395 125Z" fill="#6a3a05" opacity=".5"/>
      <rect width="400" height="190" fill="url(s4-vig)"/>
    </svg>
  );
};

/* ─── Scene 5: Treehouse Village ───────────────────────────────
   Earthy warm. Giant oak, rope ladder, lanterns, friendly owl.   */
export const SceneTreehouse: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s5-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#050c14"/><stop offset="100%" stopColor="#0a1a24"/></linearGradient>
        <radialGradient id="s5-lantern" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fde68a" stopOpacity=".5"/><stop offset="100%" stopColor="#fde68a" stopOpacity="0"/></radialGradient>
        <radialGradient id="s5-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#050c14" stopOpacity=".5"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s5-sky)"/>
      {[[20,12,.9],[55,7,1.1],[100,15,.7],[150,9,1],[210,13,.8],[265,6,1.2],[315,11,.7],[365,9,1],[45,25,.7],[195,22,.9],[345,28,.8]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill="white" style={{animation:`ss-twinkle ${(2.3+i*.29).toFixed(1)}s ease-in-out infinite ${-(i*.4).toFixed(1)}s`}}/>
      ))}
      <circle cx="340" cy="22" r="13" fill="#fef3c0"/>
      <circle cx="335" cy="18" r="10.5" fill="#060e18"/>
      {/* Ground */}
      <path d="M0 165 Q50 158 100 164 Q150 170 200 163 Q250 157 300 164 Q350 170 400 163 L400 190 L0 190Z" fill="#1a3a0a"/>
      <path d="M0 175 Q80 170 160 175 Q240 180 320 174 Q370 171 400 174 L400 190 L0 190Z" fill="#0f2206"/>
      {/* Great oak trunk */}
      <rect x="175" y="80" width="50" height="110" rx="8" fill="#5c3008"/>
      {/* Roots */}
      <path d="M175 180 Q160 185 150 190" stroke="#4a2505" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M225 180 Q240 185 250 190" stroke="#4a2505" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M190 185 Q185 190 180 190" stroke="#4a2505" strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Canopy layers */}
      <ellipse cx="200" cy="75" rx="90" ry="55" fill="#1a5010"/>
      <ellipse cx="200" cy="60" rx="75" ry="48" fill="#206015"/>
      <ellipse cx="200" cy="45" rx="60" ry="40" fill="#256818"/>
      <ellipse cx="200" cy="32" rx="44" ry="30" fill="#2a7020"/>
      {/* Glow inside canopy */}
      <ellipse cx="200" cy="65" rx="55" ry="38" fill="#fde68a" opacity=".04" style={{animation:'ss-glow 3.5s ease-in-out infinite'}}/>
      {/* Treehouse platform */}
      <rect x="140" y="100" width="120" height="10" rx="3" fill="#7c4010"/>
      {/* Treehouse walls */}
      <rect x="148" y="72" width="104" height="30" rx="4" fill="#6a350c"/>
      <path d="M140 72 L200 50 L260 72Z" fill="#8a4510"/>
      {/* Windows */}
      <rect x="157" y="78" width="20" height="16" rx="2" fill="#fde68a" opacity=".7" style={{animation:'ss-glow 2s ease-in-out infinite'}}/>
      <rect x="223" y="78" width="20" height="16" rx="2" fill="#fde68a" opacity=".7" style={{animation:'ss-glow 2s ease-in-out infinite .8s'}}/>
      <line x1="167" y1="78" x2="167" y2="94" stroke="#c87820" strokeWidth=".8"/>
      <line x1="157" y1="86" x2="177" y2="86" stroke="#c87820" strokeWidth=".8"/>
      {/* Door */}
      <rect x="190" y="82" width="20" height="20" rx="2" fill="#5a2808"/>
      <circle cx="208" cy="92" r="1.5" fill="#fde68a"/>
      {/* Rope ladder */}
      <line x1="165" y1="110" x2="160" y2="165" stroke="#a07030" strokeWidth="2"/>
      <line x1="185" y1="110" x2="180" y2="165" stroke="#a07030" strokeWidth="2"/>
      {[120,130,140,150,160].map((y,i)=>(
        <line key={i} x1={165-i*.5} y1={y} x2={185-i*.5} y2={y} stroke="#a07030" strokeWidth="1.5"/>
      ))}
      {/* Hanging lanterns */}
      {[[150,115],[252,115],[200,115]].map(([x,y],i)=>(
        <g key={i}>
          <line x1={x} y1={y-10} x2={x} y2={y} stroke="#8a5018" strokeWidth="1"/>
          <rect x={x-6} y={y} width="12" height="16" rx="3" fill="#fde68a" opacity=".85" style={{animation:`ss-glow ${(2+i*.5).toFixed(1)}s ease-in-out infinite ${-(i*.7).toFixed(1)}s`}}/>
          <ellipse cx={x} cy={y+16} rx="4" ry="2" fill="#c87820"/>
          <circle cx={x} cy={y+8} r="12" fill="url(#s5-lantern)"/>
        </g>
      ))}
      {/* Owl on branch */}
      <line x1="255" y1="95" x2="300" y2="108" stroke="#5c3008" strokeWidth="6" strokeLinecap="round"/>
      <g style={{animation:'ss-bob 5s ease-in-out infinite 1s'}} transform="translate(285,98)">
        <ellipse cx="0" cy="4" rx="9" ry="11" fill="#7a5020"/>
        <circle cx="0" cy="-7" r="9" fill="#7a5020"/>
        <path d="M-6 -15 L-9 -21 L-2 -16Z" fill="#5a3010"/>
        <path d="M6 -15 L9 -21 L2 -16Z" fill="#5a3010"/>
        <circle cx="-3" cy="-7.5" r="4.5" fill="#fde068"/>
        <circle cx="3" cy="-7.5" r="4.5" fill="#fde068"/>
        <circle cx="-3" cy="-7.5" r="2.8" fill="#1a0a00"/>
        <circle cx="3" cy="-7.5" r="2.8" fill="#1a0a00"/>
        <circle cx="-2" cy="-8.5" r="1" fill="white"/>
        <circle cx="4" cy="-8.5" r="1" fill="white"/>
        <path d="M-1 -4 L0 -2.5 L1 -4" fill="#d4a030"/>
      </g>
      <rect width="400" height="190" fill="url(#s5-vig)"/>
    </svg>
  );
};

/* ─── Scene 6: Space Adventure ─────────────────────────────────
   Deep space. Friendly planet, rocket, constellation animals.    */
export const SceneSpace: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s6-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#01010a"/><stop offset="100%" stopColor="#04021a"/></linearGradient>
        <radialGradient id="s6-planet" cx="35%" cy="30%" r="70%"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#4c1d95"/></radialGradient>
        <radialGradient id="s6-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#01010a" stopOpacity=".6"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s6-sky)"/>
      {/* Dense star field */}
      {[...Array(50)].map((_,i)=>{
        const x=(i*97+13)%400,y=(i*67+7)%90,r=i%5===0?1.4:i%3===0?.9:.5;
        return <circle key={i} cx={x} cy={y} r={r} fill={i%7===0?"#fde68a":i%5===0?"#a78bfa":"white"} style={{animation:`ss-twinkle ${(1.8+i*.11).toFixed(1)}s ease-in-out infinite ${-(i*.22).toFixed(1)}s`}}/>;
      })}
      {/* Nebula wisps */}
      <ellipse cx="100" cy="55" rx="80" ry="30" fill="#7c3aed" opacity=".06" style={{animation:'ss-glow 5s ease-in-out infinite'}}/>
      <ellipse cx="320" cy="40" rx="70" ry="25" fill="#0891b2" opacity=".07" style={{animation:'ss-glow 6s ease-in-out infinite 1.5s'}}/>
      {/* Big friendly planet */}
      <circle cx="300" cy="75" r="55" fill="url(#s6-planet)"/>
      <ellipse cx="300" cy="75" rx="72" ry="18" fill="none" stroke="#a78bfa" strokeWidth="4" opacity=".55" transform="rotate(-20,300,75)"/>
      <ellipse cx="300" cy="75" rx="68" ry="14" fill="none" stroke="#c4b5fd" strokeWidth="2" opacity=".35" transform="rotate(-20,300,75)"/>
      <ellipse cx="292" cy="62" rx="12" ry="8" fill="#6d28d9" opacity=".5" transform="rotate(-10,292,62)"/>
      <ellipse cx="315" cy="80" rx="8" ry="5" fill="#4c1d95" opacity=".6"/>
      <circle cx="280" cy="50" r="5" fill="#7c3aed" opacity=".4"/>
      {/* Rocket */}
      <g style={{animation:'ss-drift 6s ease-in-out infinite'}}>
        <path d="M120 100 Q130 60 140 40 Q150 60 160 100Z" fill="#e2e8f0"/>
        <path d="M140 40 Q145 30 152 25 Q155 35 150 45Z" fill="#f87171"/>
        <rect x="126" y="90" width="28" height="15" rx="3" fill="#94a3b8"/>
        <ellipse cx="140" cy="72" rx="8" ry="10" fill="#7dd3fc" opacity=".8"/>
        <path d="M126 105 Q118 112 115 120 L126 115Z" fill="#f97316"/>
        <path d="M154 105 Q162 112 165 120 L154 115Z" fill="#f97316"/>
        <ellipse cx="140" cy="118" rx="6" ry="10" fill="#fbbf24" opacity=".7" style={{animation:'ss-glow 1.2s ease-in-out infinite'}}/>
        <ellipse cx="140" cy="125" rx="4" ry="8" fill="#f97316" opacity=".5" style={{animation:'ss-smoke 1s ease-out infinite'}}/>
      </g>
      {/* Asteroid field */}
      {[[50,130,8,6],[350,150,10,7],[30,80,6,5],[380,60,7,5]].map(([x,y,rx,ry],i)=>(
        <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#374151" style={{animation:`ss-float-r ${(4+i).toFixed(0)}s ease-in-out infinite ${-(i).toFixed(0)}s`}}/>
      ))}
      {/* Distant rocket trail */}
      <line x1="200" y1="20" x2="250" y2="70" stroke="#7dd3fc" strokeWidth=".8" opacity=".3"/>
      {/* Constellation */}
      {[[30,140],[55,125],[75,140],[55,155],[40,165]].map(([x,y],i,arr)=>(
        <g key={i}>
          <circle cx={x} cy={y} r="2" fill="#fde68a" style={{animation:`ss-spark ${(2+i*.4).toFixed(1)}s ease-in-out infinite ${-(i*.5).toFixed(1)}s`}}/>
          {i>0 && <line x1={arr[i-1][0]} y1={arr[i-1][1]} x2={x} y2={y} stroke="#fde68a" strokeWidth=".6" opacity=".35"/>}
        </g>
      ))}
      <rect width="400" height="190" fill="url(#s6-vig)"/>
    </svg>
  );
};

/* ─── Scene 7: Candy Dreamland ─────────────────────────────────
   Pink+purple. Lollipops, gumdrop hills, cotton candy clouds.    */
export const SceneCandy: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s7-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a0428"/><stop offset="100%" stopColor="#300840"/></linearGradient>
        <linearGradient id="s7-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d946ef"/><stop offset="100%" stopColor="#a21caf"/></linearGradient>
        <radialGradient id="s7-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#1a0428" stopOpacity=".55"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s7-sky)"/>
      {[[20,10,1],[60,20,.8],[110,8,1.1],[165,15,.7],[220,6,1],[275,18,.9],[325,10,1.2],[375,14,.8],[45,30,.7],[200,28,.9],[350,32,.8]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill="#fde68a" style={{animation:`ss-twinkle ${(2+i*.32).toFixed(1)}s ease-in-out infinite ${-(i*.44).toFixed(1)}s`}}/>
      ))}
      {/* Cotton candy clouds */}
      {[[60,45,35,18,"#f9a8d4"],[200,35,45,22,"#c084fc"],[340,48,38,20,"#f0abfc"]].map(([x,y,rx,ry,c],i)=>(
        <g key={i} style={{animation:`ss-float-r ${(4+i).toFixed(0)}s ease-in-out infinite ${-(i*1.2).toFixed(1)}s`}}>
          <ellipse cx={+x} cy={+y} rx={+rx} ry={+ry} fill={c as string} opacity=".8"/>
          <ellipse cx={+x-15} cy={+y+5} rx={+rx*.7} ry={+ry*.8} fill={c as string} opacity=".7"/>
          <ellipse cx={+x+18} cy={+y+3} rx={+rx*.65} ry={+ry*.7} fill={c as string} opacity=".7"/>
        </g>
      ))}
      {/* Gumdrop hills */}
      <ellipse cx="80" cy="155" rx="75" ry="45" fill="#be185d"/>
      <ellipse cx="80" cy="148" rx="60" ry="32" fill="#db2777"/>
      <ellipse cx="240" cy="160" rx="90" ry="42" fill="#7e22ce"/>
      <ellipse cx="240" cy="153" rx="75" ry="30" fill="#9333ea"/>
      <ellipse cx="370" cy="158" rx="60" ry="38" fill="#c026d3"/>
      {/* Ground */}
      <path d="M0 170 Q80 162 160 170 Q240 178 320 170 Q360 166 400 170 L400 190 L0 190Z" fill="url(#s7-ground)"/>
      <path d="M0 180 Q80 176 160 180 Q240 184 320 180 Q360 178 400 180 L400 190 L0 190Z" fill="#f0abfc" opacity=".4"/>
      {/* Lollipops */}
      {[[50,140,"#ef4444","#fca5a5"],[140,128,"#3b82f6","#93c5fd"],[200,135,"#22c55e","#86efac"],[300,130,"#f59e0b","#fcd34d"],[360,142,"#ec4899","#fbcfe8"]].map(([x,y,c1,c2],i)=>(
        <g key={i}>
          <line x1={+x} y1={+y+10} x2={+x} y2={+y+35} stroke="#d4b896" strokeWidth="3" strokeLinecap="round"/>
          <circle cx={+x} cy={+y} r="13" fill={c1 as string}/>
          <path d={`M${+x} ${+y-13} A13 13 0 0 1 ${+x+13} ${+y}`} fill={c2 as string} opacity=".7"/>
          <path d={`M${+x} ${+y+13} A13 13 0 0 1 ${+x-13} ${+y}`} fill={c2 as string} opacity=".7"/>
        </g>
      ))}
      {/* Candy canes */}
      {[[250,140],[100,148]].map(([x,y],i)=>(
        <g key={i}>
          <path d={`M${x} ${y+30} L${x} ${y+10} Q${x} ${y-8} ${x+10} ${y-8} Q${x+20} ${y-8} ${x+20} ${y+5}`} fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"/>
          <path d={`M${x} ${y+30} L${x} ${y+10} Q${x} ${y-8} ${x+10} ${y-8} Q${x+20} ${y-8} ${x+20} ${y+5}`} fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" strokeDasharray="6 6"/>
        </g>
      ))}
      {/* Sprinkle sparkles */}
      {[[75,132],[165,120],[290,125],[340,118]].map(([x,y],i)=>(
        <text key={i} x={x} y={y} fontSize="10" fill={["#fde68a","#86efac","#f9a8d4","#c4b5fd"][i]} style={{animation:`ss-spark ${(2+i*.4).toFixed(1)}s ease-in-out infinite ${-(i*.5).toFixed(1)}s`}}>✦</text>
      ))}
      <rect width="400" height="190" fill="url(#s7-vig)"/>
    </svg>
  );
};

/* ─── Scene 8: Magic Library ────────────────────────────────────
   Deep indigo. Flying books, candles, wise owl librarian.        */
export const SceneLibrary: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s8-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#030618"/><stop offset="100%" stopColor="#080c28"/></linearGradient>
        <radialGradient id="s8-glow" cx="50%" cy="30%" r="60%"><stop offset="0%" stopColor="#fde68a" stopOpacity=".12"/><stop offset="100%" stopColor="#fde68a" stopOpacity="0"/></radialGradient>
        <radialGradient id="s8-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#030618" stopOpacity=".5"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s8-bg)"/>
      <rect width="400" height="190" fill="url(#s8-glow)"/>
      {/* Tall bookshelves */}
      {[0,30,60,90,120,150,180,210,240,270,300,330,360].map((x,i)=>(
        <g key={i}>
          <rect x={x} y={30+i%3*5} width="28" height={160-i%3*5} fill={["#1e1040","#1a0e38","#221244"][i%3]}/>
          {[0,1,2,3,4].map(j=>(
            <rect key={j} x={x+2} y={35+i%3*5+j*25} width="24" height={22-j%2*3} rx="1"
              fill={["#ef4444","#f59e0b","#3b82f6","#22c55e","#a855f7","#ec4899","#06b6d4"][((i+j)*3)%7]}
              opacity=".8"/>
          ))}
          {/* Shelf lines */}
          <rect x={x} y={55+i%3*5} width="28" height="2" fill="#2a1660" opacity=".8"/>
          <rect x={x} y={80+i%3*5} width="28" height="2" fill="#2a1660" opacity=".8"/>
          <rect x={x} y={105+i%3*5} width="28" height="2" fill="#2a1660" opacity=".8"/>
          <rect x={x} y={130+i%3*5} width="28" height="2" fill="#2a1660" opacity=".8"/>
          <rect x={x} y={155+i%3*5} width="28" height="2" fill="#2a1660" opacity=".8"/>
        </g>
      ))}
      {/* Reading area: warm rug */}
      <ellipse cx="200" cy="175" rx="80" ry="14" fill="#7c2d12" opacity=".7"/>
      <ellipse cx="200" cy="175" rx="65" ry="10" fill="#9a3412" opacity=".6"/>
      {/* Candles on floating shelves */}
      {[[80,70,"#fde68a"],[200,55,"#fef3c0"],[320,65,"#fde68a"]].map(([x,y,c],i)=>(
        <g key={i}>
          <rect x={+x-3} y={+y} width="6" height="18" rx="1" fill="#e8e0d0"/>
          <ellipse cx={+x} cy={+y-2} rx="4" ry="2.5" fill="#fde68a" style={{animation:`ss-glow ${(1.8+i*.4).toFixed(1)}s ease-in-out infinite`}}/>
          <ellipse cx={+x} cy={+y+18} rx="4" ry="2" fill="#c8a870" opacity=".5"/>
          <line x1={+x} y1={+y-2} x2={+x} y2={+y-8} stroke="#fde68a" strokeWidth="1.5" opacity=".7" style={{animation:`ss-glow ${(1.5+i*.3).toFixed(1)}s ease-in-out infinite`}}/>
          <circle cx={+x} cy={+y-12} r="18" fill="#fde68a" opacity=".07" style={{animation:`ss-glow ${(2+i*.4).toFixed(1)}s ease-in-out infinite`}}/>
        </g>
      ))}
      {/* Flying books */}
      {[
        {x:100,y:55,rot:-15,c:"#ef4444",d:'ss-drift'},
        {x:260,y:45,rot:20,c:"#3b82f6",d:'ss-drift2'},
        {x:150,y:75,rot:-8,c:"#f59e0b",d:'ss-drift'},
        {x:300,y:70,rot:12,c:"#22c55e",d:'ss-drift2'},
      ].map((b,i)=>(
        <g key={i} style={{animation:`${b.d} ${(4+i).toFixed(0)}s ease-in-out infinite`}}>
          <g transform={`rotate(${b.rot},${b.x},${b.y})`}>
            <rect x={b.x-12} y={b.y-8} width="24" height="16" rx="2" fill={b.c}/>
            <rect x={b.x-12} y={b.y-8} width="4" height="16" fill={b.c} opacity=".6"/>
            <line x1={b.x-6} y1={b.y-5} x2={b.x+10} y2={b.y-5} stroke="white" strokeWidth=".8" opacity=".4"/>
            <line x1={b.x-6} y1={b.y-2} x2={b.x+10} y2={b.y-2} stroke="white" strokeWidth=".8" opacity=".4"/>
            <line x1={b.x-6} y1={b.y+1} x2={b.x+8} y2={b.y+1} stroke="white" strokeWidth=".8" opacity=".4"/>
            {/* Open pages */}
            <path d={`M${b.x-8} ${b.y-8} Q${b.x} ${b.y-16} ${b.x+8} ${b.y-8}`} fill="#fef5e0" opacity=".8"/>
          </g>
        </g>
      ))}
      {/* Grand owl librarian */}
      <g style={{animation:'ss-bob 5s ease-in-out infinite 1.2s'}} transform="translate(200,148)">
        <ellipse cx="0" cy="5" rx="14" ry="18" fill="#4a2e08"/>
        <ellipse cx="0" cy="6" rx="9" ry="13" fill="#c49038" opacity=".5"/>
        <circle cx="0" cy="-12" r="15" fill="#4a2e08"/>
        <circle cx="0" cy="-11" rx="12" ry="11" fill="#7c5020" opacity=".3"/>
        <path d="M-10 -25 L-14 -34 L-4 -26Z" fill="#3a1e05"/>
        <path d="M10 -25 L14 -34 L4 -26Z" fill="#3a1e05"/>
        <circle cx="-5" cy="-13" r="7" fill="#fde068"/>
        <circle cx="5" cy="-13" r="7" fill="#fde068"/>
        <circle cx="-5" cy="-13" r="4.5" fill="#1a0a00"/>
        <circle cx="5" cy="-13" r="4.5" fill="#1a0a00"/>
        <circle cx="-3.5" cy="-14.5" r="1.5" fill="white"/>
        <circle cx="6.5" cy="-14.5" r="1.5" fill="white"/>
        <path d="M-2 -8 L0 -6 L2 -8" fill="#d4a030"/>
        {/* Reading glasses */}
        <ellipse cx="-5" cy="-13" rx="7.5" ry="7" fill="none" stroke="#c4a030" strokeWidth="1.2" opacity=".7"/>
        <ellipse cx="5" cy="-13" rx="7.5" ry="7" fill="none" stroke="#c4a030" strokeWidth="1.2" opacity=".7"/>
        <line x1="-2.5" y1="-13" x2="2.5" y2="-13" stroke="#c4a030" strokeWidth="1.2"/>
        {/* Open book */}
        <path d="M-15 18 Q0 14 15 18 Q0 22 -15 18Z" fill="#fef5e0"/>
        <line x1="0" y1="14" x2="0" y2="22" stroke="#d4c090" strokeWidth="1"/>
      </g>
      {/* Floating letter glows */}
      {[["A",130,110],["Z",270,105],["✦",185,90],["∞",220,85]].map(([c,x,y],i)=>(
        <text key={i} x={+x} y={+y} fontSize="14" fill="#fde68a" opacity=".5" textAnchor="middle"
          style={{animation:`ss-drift ${(4+i).toFixed(0)}s ease-in-out infinite ${-(i*.8).toFixed(1)}s`}}>{c}</text>
      ))}
      <rect width="400" height="190" fill="url(#s8-vig)"/>
    </svg>
  );
};

/* ─── Scene 9: Underwater Kingdom ──────────────────────────────
   Deep blue. Coral, jellyfish, seahorse, treasure chest.         */
export const SceneUnderwater: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s9-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#042040"/><stop offset="100%" stopColor="#010e22"/></linearGradient>
        <radialGradient id="s9-sun" cx="70%" cy="0%" r="60%"><stop offset="0%" stopColor="#38bdf8" stopOpacity=".25"/><stop offset="100%" stopColor="#38bdf8" stopOpacity="0"/></radialGradient>
        <radialGradient id="s9-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#010e22" stopOpacity=".6"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s9-sea)"/>
      <rect width="400" height="190" fill="url(#s9-sun)"/>
      {/* Light rays from surface */}
      {[[50,0],[120,0],[200,0],[280,0],[350,0]].map(([x,y],i)=>(
        <polygon key={i} points={`${x} ${y} ${x-15} 190 ${x+15} 190`} fill="#38bdf8" opacity=".03"
          style={{animation:`ss-glow ${(3+i*.4).toFixed(1)}s ease-in-out infinite ${-(i*.5).toFixed(1)}s`}}/>
      ))}
      {/* Bubbles */}
      {[[40,150],[80,120],[160,160],[220,130],[300,155],[360,120],[130,80],[250,90]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={2+i%3} fill="none" stroke="#7dd3fc" strokeWidth=".8" opacity=".5"
          style={{animation:`ss-bob ${(2.5+i*.4).toFixed(1)}s ease-in-out infinite ${-(i*.5).toFixed(1)}s`}}/>
      ))}
      {/* Sand floor */}
      <path d="M0 165 Q50 158 100 164 Q150 170 200 163 Q250 158 300 164 Q350 170 400 163 L400 190 L0 190Z" fill="#1a3a5a"/>
      <path d="M0 174 Q80 170 160 174 Q240 178 320 173 Q370 171 400 173 L400 190 L0 190Z" fill="#0f2840"/>
      {/* Coral */}
      {[
        {x:50,y:165,c:"#f97316",h:30,branches:3},
        {x:100,y:168,c:"#ec4899",h:22,branches:2},
        {x:160,y:162,c:"#a855f7",h:35,branches:4},
        {x:310,y:164,c:"#ef4444",h:28,branches:3},
        {x:360,y:167,c:"#22d3ee",h:24,branches:2},
      ].map((co,ci)=>(
        <g key={ci}>
          <rect x={co.x-3} y={co.y-co.h} width="6" height={co.h} rx="2" fill={co.c}/>
          {[...Array(co.branches)].map((_,i)=>{
            const angle=-50+i*(100/(co.branches-1||1));
            const rad=angle*Math.PI/180;
            const len=co.h*.55;
            return <line key={i} x1={co.x} y1={co.y-co.h*.5} x2={co.x+Math.sin(rad)*len} y2={co.y-co.h*.5-Math.abs(Math.cos(rad)*len)} stroke={co.c} strokeWidth="4" strokeLinecap="round"/>;
          })}
        </g>
      ))}
      {/* Seaweed */}
      {[[250,190],[280,190],[330,190]].map(([x,y],i)=>(
        <path key={i} d={`M${x} ${y} Q${x-10} ${y-20} ${x} ${y-30} Q${x+10} ${y-40} ${x} ${y-55} Q${x-8} ${y-65} ${x} ${y-75}`}
          fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round"
          style={{animation:`ss-float-r ${(3+i*.5).toFixed(1)}s ease-in-out infinite ${-(i*.7).toFixed(1)}s`}}/>
      ))}
      {/* Jellyfish */}
      {[
        {x:110,y:70,c:"#c084fc",d:'ss-bob'},
        {x:220,y:55,c:"#f9a8d4",d:'ss-bob2'},
        {x:350,y:80,c:"#7dd3fc",d:'ss-bob'},
      ].map((j,ji)=>(
        <g key={ji} style={{animation:`${j.d} ${(3.5+ji*.8).toFixed(1)}s ease-in-out infinite ${-(ji*.6).toFixed(1)}s`}}>
          <ellipse cx={j.x} cy={j.y} rx="18" ry="14" fill={j.c} opacity=".7"/>
          <ellipse cx={j.x} cy={j.y+5} rx="13" ry="8" fill={j.c} opacity=".4"/>
          {[-10,-5,0,5,10].map((dx,i)=>(
            <line key={i} x1={j.x+dx} y1={j.y+14} x2={j.x+dx+(i-2)*2} y2={j.y+30} stroke={j.c} strokeWidth="1.5" opacity=".6" strokeLinecap="round"/>
          ))}
        </g>
      ))}
      {/* Seahorse */}
      <g style={{animation:'ss-float-r 5s ease-in-out infinite .5s'}} transform="translate(200,115)">
        <path d="M0 -30 Q8 -25 8 -15 Q10 -5 5 5 Q2 15 0 20 Q-3 28 0 35" fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round"/>
        <circle cx="3" cy="-33" r="9" fill="#f59e0b"/>
        <circle cx="3" cy="-33" r="5" fill="#fde68a"/>
        <path d="M-3 -40 Q0 -46 6 -42" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <circle cx="1" cy="-34" r="2" fill="#1a0a00"/>
        <ellipse cx="12" cy="-18" rx="8" ry="5" fill="#f59e0b" opacity=".5" transform="rotate(-20,12,-18)" style={{animation:'ss-bob 2s ease-in-out infinite'}}/>
      </g>
      {/* Treasure chest */}
      <g transform="translate(270,165)">
        <rect x="-18" y="-14" width="36" height="20" rx="3" fill="#92400e"/>
        <rect x="-18" y="-14" width="36" height="7" rx="3" fill="#b45309"/>
        <rect x="-18" y="-7" width="36" height="1" fill="#78350f"/>
        {[-8,-4,0,4,8].map((x,i)=><rect key={i} x={x-1} y={-14} width="2" height="20" fill="#78350f" opacity=".4"/>)}
        <rect x="-5" y="-10" width="10" height="8" rx="1" fill="#fbbf24"/>
        <circle cx="0" cy="-6" r="2.5" fill="#f59e0b"/>
        {/* Gold spilling out */}
        {[-12,-6,0,6,12].map((x,i)=>(
          <circle key={i} cx={x} cy={6+i%2*3} r="2.5" fill="#fde68a" opacity=".8"/>
        ))}
      </g>
      {/* Sparkly fish */}
      {[[80,140],[150,100],[320,120],[370,145]].map(([x,y],i)=>(
        <g key={i} style={{animation:`ss-float-r ${(3+i).toFixed(0)}s ease-in-out infinite ${-(i*.8).toFixed(1)}s`}}>
          <ellipse cx={x} cy={y} rx="8" ry="5" fill={["#f97316","#22c55e","#3b82f6","#a855f7"][i]}/>
          <path d={`M${x+8} ${y-4} L${x+15} ${y-8} L${x+15} ${y+8} Z`} fill={["#f97316","#22c55e","#3b82f6","#a855f7"][i]}/>
          <circle cx={x-3} cy={y-1} r="1.5" fill="white" opacity=".8"/>
        </g>
      ))}
      <rect width="400" height="190" fill="url(#s9-vig)"/>
    </svg>
  );
};

/* ─── Scene 10: Snowy Castle ────────────────────────────────────
   Icy blue. Castle turrets, falling snow, friendly knight.       */
export const SceneCastle: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s10-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#04081a"/><stop offset="100%" stopColor="#081828"/></linearGradient>
        <linearGradient id="s10-castle" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0f2040"/></linearGradient>
        <radialGradient id="s10-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#04081a" stopOpacity=".55"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s10-sky)"/>
      {[[15,8,1],[50,16,.8],[90,7,1.1],[140,12,.7],[190,5,.9],[240,10,1.2],[285,7,.8],[325,14,1],[370,9,.7],[45,25,.7],[195,22,.9],[345,26,.8]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill="white" style={{animation:`ss-twinkle ${(2+i*.3).toFixed(1)}s ease-in-out infinite ${-(i*.4).toFixed(1)}s`}}/>
      ))}
      <circle cx="80" cy="25" r="14" fill="#e0e8ff"/>
      <circle cx="74" cy="20" r="11" fill="#050c1a"/>
      {/* Castle */}
      <rect x="100" y="60" width="200" height="130" fill="url(#s10-castle)"/>
      {/* Battlements */}
      {[100,118,136,154,172,190,208,226,244,262,280].map((x,i)=>(
        <rect key={i} x={x} y={50} width="12" height="14" fill="#1e3a5f"/>
      ))}
      <rect x="100" y="60" width="200" height="4" fill="#162e4a"/>
      {/* Towers */}
      <rect x="60" y="30" width="55" height="160" fill="#1e3a5f"/>
      <rect x="285" y="30" width="55" height="160" fill="#1e3a5f"/>
      {/* Tower battlements */}
      {[60,72,84,96].map((x,i)=><rect key={i} x={x} y={20} width="10" height="14" fill="#1e3a5f"/>)}
      {[285,297,309,321].map((x,i)=><rect key={i} x={x} y={20} width="10" height="14" fill="#1e3a5f"/>)}
      <rect x="60" y="30" width="55" height="4" fill="#162e4a"/>
      <rect x="285" y="30" width="55" height="4" fill="#162e4a"/>
      {/* Tower tops (cones) */}
      <path d="M60 30 L87.5 2 L115 30Z" fill="#0f2040"/>
      <path d="M285 30 L312.5 2 L340 30Z" fill="#0f2040"/>
      {/* Flags */}
      <line x1="87.5" y1="2" x2="87.5" y2="-5" stroke="#c0a030" strokeWidth="1.5"/>
      <path d="M87.5 -5 L100 0 L87.5 5Z" fill="#f59e0b"/>
      <line x1="312.5" y1="2" x2="312.5" y2="-5" stroke="#c0a030" strokeWidth="1.5"/>
      <path d="M312.5 -5 L325 0 L312.5 5Z" fill="#f59e0b"/>
      {/* Windows */}
      {[[150,80],[200,80],[250,80],[150,115],[200,115],[250,115]].map(([x,y],i)=>(
        <path key={i} d={`M${x-6} ${y} A6 8 0 0 1 ${x+6} ${y} L${x+6} ${y+12} L${x-6} ${y+12}Z`}
          fill="#fde68a" opacity={.6+i%2*.2} style={{animation:`ss-glow ${(2+i*.3).toFixed(1)}s ease-in-out infinite ${-(i*.4).toFixed(1)}s`}}/>
      ))}
      {/* Gatehouse */}
      <rect x="168" y="120" width="64" height="70" fill="#162e4a"/>
      <path d="M168 150 A32 32 0 0 1 232 150 L232 120 L168 120Z" fill="#0f2040"/>
      <path d="M178 150 A22 22 0 0 1 222 150 L222 125 L178 125Z" fill="#080c18"/>
      {/* Portcullis bars */}
      {[178,188,198,208,218].map((x,i)=><line key={i} x1={x} y1={125} x2={x} y2={150} stroke="#2a4060" strokeWidth="2"/>)}
      <line x1="178" y1="135" x2="222" y2="135" stroke="#2a4060" strokeWidth="2"/>
      <line x1="178" y1="144" x2="222" y2="144" stroke="#2a4060" strokeWidth="2"/>
      {/* Drawbridge */}
      <rect x="168" y="150" width="64" height="40" fill="#3a2010"/>
      {/* Moat ice */}
      <ellipse cx="200" cy="190" rx="120" ry="14" fill="#a8d4e8" opacity=".4"/>
      {/* Snow on battlements */}
      <path d="M100 64 Q115 58 130 64 Q145 58 160 64 Q175 58 190 64 Q205 58 220 64 Q235 58 250 64 Q265 58 280 64 Q295 58 300 64" fill="white" opacity=".6"/>
      <path d="M60 34 Q75 28 90 34 Q97 28 115 34" fill="white" opacity=".6"/>
      <path d="M285 34 Q302 28 312 34 Q320 28 340 34" fill="white" opacity=".6"/>
      {/* Snowflakes */}
      {[[50,80],[130,45],[200,35],[310,60],[370,80],[90,150],[350,130]].map(([x,y],i)=>(
        <text key={i} x={x} y={y} fontSize="10" fill="white" opacity={.4+i%3*.15} textAnchor="middle"
          style={{animation:`ss-bob ${(3+i*.4).toFixed(1)}s ease-in-out infinite ${-(i*.6).toFixed(1)}s`}}>❄</text>
      ))}
      {/* Knight */}
      <g style={{animation:'ss-bob 5s ease-in-out infinite 1s'}} transform="translate(340,150)">
        <rect x="-10" y="-20" width="20" height="25" rx="2" fill="#4a6080"/>
        <rect x="-8" y="-30" width="16" height="14" rx="3" fill="#5a7090"/>
        <ellipse cx="0" cy="-32" rx="10" ry="8" fill="#6a80a0"/>
        <path d="M-10 -38 L0 -46 L10 -38" fill="#5a7090"/>
        <path d="M0 -46 L0 -52 L6 -48" fill="#f59e0b"/>
        <circle cx="-3" cy="-31" r="2.5" fill="#0a1520"/>
        <circle cx="3" cy="-31" r="2.5" fill="#0a1520"/>
        <line x1="0" y1="-30" x2="0" y2="-27" stroke="#8090a0" strokeWidth="1"/>
        <rect x="-12" y="-22" width="4" height="20" rx="1" fill="#3a5070"/>
        <rect x="8" y="-22" width="4" height="20" rx="1" fill="#3a5070"/>
        <rect x="-9" y="5" width="8" height="18" rx="2" fill="#3a5070"/>
        <rect x="1" y="5" width="8" height="18" rx="2" fill="#3a5070"/>
        <line x1="22" y1="-40" x2="22" y2="20" stroke="#8090a0" strokeWidth="3" strokeLinecap="round"/>
        <path d="M18 -42 L22 -50 L26 -42 L24 -40 L20 -40Z" fill="#c0d0e0"/>
      </g>
      <rect width="400" height="190" fill="url(#s10-vig)"/>
    </svg>
  );
};

/* ─── Scene 11: Jungle Night ────────────────────────────────────
   Lush deep green. Fireflies, toucan, glowing flowers, mist.    */
export const SceneJungle: React.FC = () => {
  ensureCSS();
  return (
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{width:'100%',height:'100%',display:'block'}}>
      <defs>
        <linearGradient id="s11-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#010a05"/><stop offset="100%" stopColor="#02160a"/></linearGradient>
        <linearGradient id="s11-mist" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#a8f0c8" stopOpacity=".15"/><stop offset="100%" stopColor="#a8f0c8" stopOpacity="0"/></linearGradient>
        <radialGradient id="s11-vig" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#010a05" stopOpacity=".65"/></radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#s11-sky)"/>
      {[[25,6,.8],[70,14,1],[120,8,.9],[175,12,.7],[235,5,1.1],[290,10,.8],[340,7,1],[380,15,.9]].map(([x,y,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill="white" style={{animation:`ss-twinkle ${(2.2+i*.35).toFixed(1)}s ease-in-out infinite ${-(i*.5).toFixed(1)}s`}}/>
      ))}
      <circle cx="320" cy="20" r="11" fill="#c8e8b0"/>
      <circle cx="315" cy="16" r="9" fill="#010a05"/>
      {/* Dense foliage backdrop */}
      {[-30,0,40,90,140,190,240,290,340,380,420].map((x,i)=>(
        <ellipse key={i} cx={x} cy={60+i%3*15} rx={55+i%4*15} ry={50+i%3*12}
          fill={["#064e20","#053d18","#075e28"][i%3]} opacity=".95"/>
      ))}
      {/* Second canopy layer */}
      {[-20,50,130,210,290,370].map((x,i)=>(
        <ellipse key={i} cx={x} cy={40+i%2*10} rx={50+i%3*10} ry={42+i%2*8}
          fill={["#0a6628","#087030","#0c5e24"][i%3]} opacity=".9"/>
      ))}
      {/* Ground / path */}
      <path d="M0 155 Q60 145 120 155 Q180 165 240 153 Q300 142 360 155 Q380 160 400 155 L400 190 L0 190Z" fill="#042010"/>
      <path d="M0 168 Q80 163 160 168 Q240 173 320 167 Q370 165 400 167 L400 190 L0 190Z" fill="#021208"/>
      {/* Mist layer */}
      <rect x="0" y="150" width="400" height="40" fill="url(#s11-mist)"/>
      {/* Giant tropical leaves */}
      {[
        {x:0,y:130,c:"#166534",angle:30,w:70,h:25},
        {x:380,y:135,c:"#14532d",angle:-35,w:65,h:22},
        {x:150,y:120,c:"#15803d",angle:15,w:55,h:20},
        {x:260,y:125,c:"#166534",angle:-20,w:60,h:22},
      ].map((l,i)=>(
        <g key={i}>
          <ellipse cx={l.x} cy={l.y} rx={l.w} ry={l.h} fill={l.c} transform={`rotate(${l.angle},${l.x},${l.y})`}/>
          <line x1={l.x} y1={l.y} x2={l.x+Math.cos(l.angle*Math.PI/180)*l.w} y2={l.y+Math.sin(l.angle*Math.PI/180)*l.w}
            stroke="#1a7a3a" strokeWidth="1.5" opacity=".6"/>
        </g>
      ))}
      {/* Glowing flowers */}
      {[[80,145,"#fb923c"],[200,138,"#f472b6"],[310,142,"#facc15"],[155,148,"#a78bfa"]].map(([x,y,c],i)=>(
        <g key={i}>
          {[0,60,120,180,240,300].map(a=>(
            <ellipse key={a} cx={+x+Math.cos(a*Math.PI/180)*6} cy={+y+Math.sin(a*Math.PI/180)*6} rx="4.5" ry="3"
              fill={c as string} transform={`rotate(${a},${+x+Math.cos(a*Math.PI/180)*6},${+y+Math.sin(a*Math.PI/180)*6})`}/>
          ))}
          <circle cx={+x} cy={+y} r="4" fill="#fde68a"/>
          <circle cx={+x} cy={+y} r="18" fill={c as string} opacity=".07" style={{animation:`ss-glow ${(2+i*.4).toFixed(1)}s ease-in-out infinite`}}/>
        </g>
      ))}
      {/* Fireflies */}
      {[[50,100],[100,80],[170,90],[240,75],[300,95],[350,85],[130,120],[270,110]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="2.2" fill="#86efac" style={{animation:`ss-spark ${(1.8+i*.25).toFixed(1)}s ease-in-out infinite ${-(i*.4).toFixed(1)}s`}}/>
      ))}
      {/* Toucan on branch */}
      <line x1="130" y1="100" x2="200" y2="112" stroke="#2d4a18" strokeWidth="7" strokeLinecap="round"/>
      <g style={{animation:'ss-bob 4s ease-in-out infinite .6s'}} transform="translate(165,92)">
        <ellipse cx="0" cy="4" rx="11" ry="14" fill="#0a0a0a"/>
        <ellipse cx="0" cy="5" rx="7" ry="9" fill="white"/>
        <circle cx="0" cy="-10" r="10" fill="#0a0a0a"/>
        <path d="M-4 -12 Q0 -18 4 -12" fill="#0a0a0a"/>
        {/* Beak */}
        <path d="M-2 -8 Q8 -10 14 -6 Q12 -1 2 -4Z" fill="#f97316"/>
        <path d="M-2 -8 Q8 -10 14 -6 Q12 -7 4 -7Z" fill="#eab308" opacity=".7"/>
        <circle cx="-1" cy="-10" r="2.5" fill="#1a1a1a"/>
        <circle cx="-.5" cy="-10.5" r=".8" fill="white"/>
        <circle cx="8" cy="-4" r="2" fill="#22c55e"/>
        {/* Chest */}
        <ellipse cx="0" cy="4" rx="5" ry="7" fill="#fbbf24" opacity=".8"/>
        <ellipse cx="0" cy="10" rx="4" ry="5" fill="#f97316" opacity=".6"/>
      </g>
      {/* Vines */}
      {[[40,0],[340,0]].map(([x,_y],i)=>(
        <path key={i} d={`M${x} 0 Q${x+20*(i?-1:1)} 30 ${x+10*(i?-1:1)} 60 Q${x+30*(i?-1:1)} 90 ${x+15*(i?-1:1)} 120 Q${x+35*(i?-1:1)} 150 ${x+20*(i?-1:1)} 180`}
          fill="none" stroke="#2d6a20" strokeWidth="2.5" strokeLinecap="round"
          style={{animation:`ss-float-r ${(5+i*2).toFixed(0)}s ease-in-out infinite`}}/>
      ))}
      <rect width="400" height="190" fill="url(#s11-vig)"/>
    </svg>
  );
};

/* ─── Export: scene array + selection ─── */
export const ALL_SCENES = [
  SceneBedroom,    // 0  warm amber      — cosy/standard
  SceneForest,     // 1  deep green      — magical/adventure
  SceneOcean,      // 2  teal/blue       — calm/mystery
  SceneArctic,     // 3  ice blue/purple — quiet/wonder
  SceneDesert,     // 4  warm/purple     — funny/silly
  SceneTreehouse,  // 5  earthy warm     — cosy/friendship
  SceneSpace,      // 6  deep space      — exciting/adventure
  SceneCandy,      // 7  pink/purple     — silly/funny
  SceneLibrary,    // 8  indigo          — heartfelt/calm
  SceneUnderwater, // 9  deep blue       — magical/mystery
  SceneCastle,     // 10 icy blue        — adventure/brave
  SceneJungle,     // 11 deep green      — exciting/wonder
];

/**
 * Pick a scene deterministically from the story seed.
 * Same seed → always same scene. Different seeds → spread across all 12.
 */
export function getSceneIndex(seed: number): number {
  // Mix the seed bits to spread evenly
  const h = ((seed ^ (seed >>> 16)) * 0x45d9f3b) >>> 0;
  return h % ALL_SCENES.length;
}

/**
 * Get the scene component for a given seed.
 */
export function getSceneComponent(seed: number): React.FC {
  return ALL_SCENES[getSceneIndex(seed)];
}

/**
 * Vibe → preferred scene indices (used to bias selection by story mood).
 * When mood is known, pick from the matching list; otherwise use seed purely.
 */
export const VIBE_SCENES: Record<string, number[]> = {
  calm:      [0, 3, 5, 8],       // bedroom, arctic, treehouse, library
  cosy:      [0, 5, 8, 10],      // bedroom, treehouse, library, castle
  silly:     [4, 7, 5, 1],       // desert, candy, treehouse, forest
  funny:     [7, 4, 6, 11],      // candy, desert, space, jungle
  exciting:  [6, 10, 1, 11],     // space, castle, forest, jungle
  adventure: [6, 10, 1, 9],      // space, castle, forest, underwater
  heartfelt: [0, 8, 3, 5],       // bedroom, library, arctic, treehouse
  mysterious:[9, 8, 2, 3],       // underwater, library, ocean, arctic
};

export function getSceneByVibe(seed: number, vibe?: string): React.FC {
  if (vibe && VIBE_SCENES[vibe]) {
    const pool = VIBE_SCENES[vibe];
    const idx = pool[seed % pool.length];
    return ALL_SCENES[idx];
  }
  return getSceneComponent(seed);
}
