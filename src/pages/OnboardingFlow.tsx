import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../AppContext';
import { uid } from '../lib/storage';
import { CREATURES, getCreature } from '../lib/creatures';
import type { Character, PersonalityTag, HatchedCreature } from '../lib/types';

// ── Result type ──────────────────────────────────────────────────────────────

export interface OnboardingResult {
  character: Character;
  creature: HatchedCreature;
  dreamAnswer: string;
  photoDataUrl?: string;
  firstStory?: { title: string; text: string; headline: string; quote: string; memoryLine: string };
}

export interface ChildProfile {
  childName: string;
  childAge: string;
  childPronouns: string;
  parentSecret: string;
}

interface OnboardingFlowProps {
  onComplete: (result: OnboardingResult) => void;
  childProfile?: ChildProfile | null;
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400;1,9..144,600;1,9..144,700&family=Baloo+2:wght@600;700;800&family=Nunito:wght@600;700;800&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

@keyframes obFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes obPulse{0%,100%{transform:scale(1);filter:drop-shadow(0 0 12px rgba(245,184,76,.3))}50%{transform:scale(1.06);filter:drop-shadow(0 0 28px rgba(245,184,76,.7))}}
@keyframes obFadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes obPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
@keyframes obTwk{0%,100%{opacity:.05}50%{opacity:.5}}
@keyframes obTwk2{0%,100%{opacity:.2}60%{opacity:.04}}
@keyframes obRock{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
@keyframes obGlow{0%,100%{box-shadow:0 0 20px rgba(245,184,76,.2)}50%{box-shadow:0 0 40px rgba(245,184,76,.5)}}
@keyframes obFlash{0%{opacity:1}100%{opacity:0}}
@keyframes obShimmer{0%,100%{opacity:.4}50%{opacity:1}}

.ob{position:fixed;inset:0;z-index:1000;background:radial-gradient(ellipse 130% 65% at 50% 0%,#0a1030 0%,#040818 50%,#020410 100%);font-family:'Nunito',sans-serif;color:#F4EFE8;overflow-y:auto;overflow-x:hidden;-webkit-font-smoothing:antialiased}
.ob-star{position:fixed;border-radius:50%;background:#EEE8FF;animation:obTwk var(--d,3s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.ob-star2{position:fixed;border-radius:50%;background:#C8C0B0;animation:obTwk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}

/* dots */
.ob-dots{display:flex;gap:6px;justify-content:center;padding:16px 0 8px;position:relative;z-index:10}
.ob-dot{width:8px;height:8px;border-radius:50%;transition:all .3s}
.ob-dot-done{background:rgba(245,184,76,.6)}
.ob-dot-cur{background:#F5B84C;transform:scale(1.4);box-shadow:0 0 8px rgba(245,184,76,.5)}
.ob-dot-future{background:rgba(255,255,255,.1)}

/* content area */
.ob-content{position:relative;z-index:5;max-width:420px;margin:0 auto;padding:0 24px 100px;min-height:calc(100vh - 50px)}
.ob-title{font-family:'Baloo 2',cursive;font-size:28px;font-weight:800;text-align:center;line-height:1.2;margin-bottom:8px}
.ob-sub{font-size:14px;color:rgba(244,239,232,.6);text-align:center;line-height:1.6;margin-bottom:20px;font-weight:600}
.ob-title-parent{font-family:'Fraunces',serif;font-size:24px;font-weight:700;font-style:italic;text-align:center;line-height:1.35;margin-bottom:8px;color:#F5B84C}
.ob-sub-parent{font-size:13px;color:rgba(244,239,232,.5);text-align:center;line-height:1.6;margin-bottom:18px;font-style:italic}

/* read-aloud badge */
.ob-read-badge{font-size:10px;color:rgba(245,184,76,.4);font-style:italic;margin-bottom:6px;text-align:center}

/* CTA button */
.ob-cta{display:block;width:100%;padding:16px 20px;border:none;border-radius:16px;font-family:'Baloo 2',cursive;font-size:18px;font-weight:800;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;margin-top:16px}
.ob-cta-amber{background:linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010);color:#080200;box-shadow:0 6px 24px rgba(200,130,20,.35)}
.ob-cta-teal{background:linear-gradient(135deg,#0a7a50,#14d890 50%,#0a7a50);color:#041a0c;box-shadow:0 6px 24px rgba(20,200,130,.3)}
.ob-cta:disabled{opacity:.3;cursor:default;transform:none}
.ob-cta:not(:disabled):hover{transform:translateY(-2px);filter:brightness(1.1)}
.ob-cta:not(:disabled):active{transform:scale(.97)}

/* input */
.ob-input{width:100%;padding:14px 16px;border-radius:14px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#F4EFE8;font-family:'Nunito',sans-serif;font-size:18px;font-weight:700;outline:none;transition:border-color .2s}
.ob-input:focus{border-color:rgba(245,184,76,.4)}
.ob-input::placeholder{color:rgba(255,255,255,.18)}
.ob-textarea{width:100%;padding:14px 16px;border-radius:14px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#F4EFE8;font-family:'Nunito',sans-serif;font-size:15px;font-weight:600;outline:none;resize:none;min-height:100px;transition:border-color .2s}
.ob-textarea:focus{border-color:rgba(245,184,76,.4)}
.ob-textarea::placeholder{color:rgba(255,255,255,.18)}

/* age pills */
.ob-ages{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:12px 0}
.ob-age{padding:10px 18px;border-radius:50px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(244,239,232,.5);font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'Nunito',sans-serif}
.ob-age.on{border-color:#F5B84C;background:rgba(245,184,76,.12);color:#F5B84C}

/* creature grid */
.ob-cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 16px}
.ob-ccard{border-radius:16px;padding:10px 4px 8px;text-align:center;cursor:pointer;border:2px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);transition:all .3s;position:relative;overflow:hidden}
.ob-ccard:hover{background:rgba(255,255,255,.06);transform:scale(1.03)}
.ob-ccard:active{transform:scale(.95)}
.ob-ccard.on{border-color:var(--cc,#F5B84C);background:rgba(245,184,76,.1);transform:scale(1.1);box-shadow:0 0 20px var(--cc,rgba(245,184,76,.25)),0 0 40px var(--cc,rgba(245,184,76,.08))}
.ob-ccard.on::before{content:'\\2726';position:absolute;top:2px;right:4px;font-size:8px;color:var(--cc,#F5B84C);animation:obCreatureSpark 1s ease-in-out infinite}
.ob-ccard.on::after{content:'';position:absolute;inset:0;border-radius:14px;background:radial-gradient(circle at 50% 30%,var(--cc,rgba(245,184,76,.12)),transparent 70%);pointer-events:none}
.ob-ccard-emoji{font-size:42px;line-height:1;margin-bottom:4px;transition:all .3s}
.ob-ccard.on .ob-ccard-emoji{animation:obCreatureBounce .5s ease-out,obFloat 3s ease-in-out .5s infinite;filter:drop-shadow(0 0 10px var(--cc,rgba(245,184,76,.4)))}
.ob-ccard-name{font-size:9px;font-weight:800;color:rgba(255,255,255,.55);line-height:1.2;transition:all .3s}
.ob-ccard.on .ob-ccard-name{color:var(--cc,#F5B84C)}
@keyframes obCreatureBounce{0%{transform:scale(1)}40%{transform:scale(1.35) rotate(-8deg)}70%{transform:scale(.9) rotate(4deg)}100%{transform:scale(1) rotate(0)}}
@keyframes obCreatureSpark{0%,100%{opacity:.3;transform:scale(.7) rotate(0)}50%{opacity:1;transform:scale(1) rotate(180deg)}}

/* preview bar */
.ob-preview{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:16px;background:rgba(255,255,255,.03);border:1.5px solid var(--cc,rgba(245,184,76,.2));margin-bottom:14px;animation:obPreviewIn .4s ease-out;position:relative;overflow:hidden;box-shadow:0 4px 20px var(--cc,rgba(245,184,76,.1))}
.ob-preview::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 50%,var(--cc,rgba(245,184,76,.06)),transparent 60%);pointer-events:none}
.ob-preview-emoji{font-size:44px;animation:obFloat 3s ease-in-out infinite;filter:drop-shadow(0 0 14px var(--cc,rgba(245,184,76,.35)));position:relative;z-index:1}
.ob-preview-info{flex:1;position:relative;z-index:1}
.ob-preview-name{font-family:'Baloo 2',cursive;font-size:17px;font-weight:800}
.ob-preview-desc{font-size:11px;color:rgba(255,255,255,.5);font-style:italic;margin-top:2px}
.ob-preview-sparkles{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.ob-preview-sparkle{position:absolute;font-size:10px;color:var(--cc,rgba(245,184,76,.4));animation:obPreviewSparkle 2s ease-in-out infinite}
@keyframes obPreviewIn{0%{opacity:0;transform:translateY(-10px) scale(.95)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes obPreviewSparkle{0%,100%{opacity:0;transform:translateY(0) scale(.5)}50%{opacity:.8;transform:translateY(-8px) scale(1)}}

/* this or that */
.ob-tot-pair{display:flex;gap:12px;margin:16px 0}
.ob-tot-btn{flex:1;padding:20px 12px;border-radius:18px;border:2px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);cursor:pointer;text-align:center;transition:all .3s;font-family:'Baloo 2',cursive;position:relative;overflow:hidden}
.ob-tot-btn:hover{background:rgba(255,255,255,.07);transform:scale(1.03)}
.ob-tot-btn:active{transform:scale(.93)}
.ob-tot-btn.on{border-color:#F5B84C;background:rgba(245,184,76,.12);box-shadow:0 0 24px rgba(245,184,76,.2),0 0 48px rgba(245,184,76,.06);transform:scale(1.06)}
.ob-tot-btn.on::before{content:'\\2726';position:absolute;top:6px;right:8px;font-size:10px;color:rgba(245,184,76,.6);animation:obCreatureSpark 1.2s ease-in-out infinite}
.ob-tot-btn.on::after{content:'';position:absolute;inset:0;border-radius:16px;background:radial-gradient(circle at 50% 30%,rgba(245,184,76,.1),transparent 65%);pointer-events:none}
.ob-tot-emoji{font-size:36px;margin-bottom:6px;transition:all .3s}
.ob-tot-btn.on .ob-tot-emoji{animation:obCreatureBounce .5s ease-out;filter:drop-shadow(0 0 12px rgba(245,184,76,.4))}
.ob-tot-label{font-size:16px;font-weight:800;color:rgba(244,239,232,.7);transition:all .3s}
.ob-tot-btn.on .ob-tot-label{color:#F5B84C;text-shadow:0 0 12px rgba(245,184,76,.25)}

/* chips */
.ob-chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.ob-chip{padding:8px 14px;border-radius:50px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(244,239,232,.5);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.ob-chip:hover{background:rgba(255,255,255,.08)}
.ob-chip.on{border-color:#F5B84C;background:rgba(245,184,76,.12);color:#F5B84C}

/* parent screen */
.ob-parent-bg{background:radial-gradient(ellipse 130% 65% at 50% 0%,#1a0e08 0%,#100806 50%,#080404 100%)}

/* story pages */
.ob-story-page{text-align:center;padding:20px 0;animation:obFadeIn .4s ease-out}
.ob-story-emoji{font-size:64px;margin-bottom:16px;animation:obFloat 3s ease-in-out infinite}
.ob-story-text{font-family:'Fraunces',serif;font-size:17px;font-style:italic;color:rgba(244,239,232,.7);line-height:1.65;margin-bottom:16px}

/* egg click burst ring */
@keyframes s0burstRing{0%{transform:scale(0);opacity:.8}100%{transform:scale(4);opacity:0}}

/* gift/present burst */
@keyframes obGiftShake{0%,100%{transform:rotate(0) scale(1)}15%{transform:rotate(-8deg) scale(1.05)}30%{transform:rotate(8deg) scale(1.08)}45%{transform:rotate(-10deg) scale(1.1)}60%{transform:rotate(10deg) scale(1.12)}75%{transform:rotate(-6deg) scale(1.08)}90%{transform:rotate(0) scale(1.15)}}
@keyframes obConfetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(120px) rotate(400deg);opacity:0}}
@keyframes obEggReveal{0%{transform:scale(0) rotate(-20deg);opacity:0}50%{transform:scale(1.3) rotate(5deg)}100%{transform:scale(1) rotate(0);opacity:1}}

/* cracking egg scene */
.ob-crack-scene{position:relative;width:160px;height:180px;margin:10px auto 20px;display:flex;align-items:center;justify-content:center}
.ob-crack-egg{font-size:88px;position:relative;z-index:3;animation:obCrackRock 1.2s ease-in-out infinite}
@keyframes obCrackRock{0%,100%{transform:rotate(0)}15%{transform:rotate(-6deg)}30%{transform:rotate(7deg)}45%{transform:rotate(-5deg)}60%{transform:rotate(4deg)}75%{transform:rotate(-2deg)}}
.ob-crack-glow{position:absolute;width:120px;height:120px;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1}
.ob-crack-glow-inner{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(245,184,76,.35),rgba(245,184,76,.08) 50%,transparent 70%);animation:obCrackPulse 1.5s ease-in-out infinite}
.ob-crack-glow-outer{position:absolute;inset:-20px;border-radius:50%;background:radial-gradient(circle,rgba(245,184,76,.1),transparent 60%);animation:obCrackPulse 2s ease-in-out .5s infinite}
@keyframes obCrackPulse{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1.15)}}
.ob-crack-line{position:absolute;background:linear-gradient(180deg,rgba(245,184,76,.8),rgba(245,184,76,.2));border-radius:1px;z-index:4;animation:obCrackAppear .3s ease-out forwards}
@keyframes obCrackAppear{0%{opacity:0;transform:scaleY(0)}100%{opacity:1;transform:scaleY(1)}}
.ob-crack-l1{width:2px;height:18px;top:28%;left:42%;transform:rotate(-15deg);animation-delay:.5s;opacity:0}
.ob-crack-l2{width:2px;height:14px;top:34%;left:44%;transform:rotate(25deg);animation-delay:.8s;opacity:0}
.ob-crack-l3{width:2px;height:20px;top:30%;right:40%;transform:rotate(10deg);animation-delay:1.2s;opacity:0}
.ob-crack-l4{width:1.5px;height:12px;top:42%;right:42%;transform:rotate(-20deg);animation-delay:1.6s;opacity:0}
.ob-crack-beam{position:absolute;z-index:2;border-radius:50%;filter:blur(6px)}
.ob-crack-beam1{width:30px;height:6px;background:rgba(245,184,76,.5);top:32%;left:38%;transform:rotate(-15deg);animation:obBeamFlicker 1s ease-in-out .6s infinite;opacity:0}
.ob-crack-beam2{width:25px;height:5px;background:rgba(245,184,76,.4);top:38%;right:36%;transform:rotate(12deg);animation:obBeamFlicker 1.2s ease-in-out 1.3s infinite;opacity:0}
.ob-crack-beam3{width:20px;height:4px;background:rgba(245,184,76,.35);top:44%;right:40%;transform:rotate(-8deg);animation:obBeamFlicker .9s ease-in-out 1.8s infinite;opacity:0}
@keyframes obBeamFlicker{0%{opacity:0}20%{opacity:.8}50%{opacity:.4}80%{opacity:.9}100%{opacity:0}}
.ob-crack-particle{position:absolute;width:4px;height:4px;border-radius:50%;background:#F5B84C;z-index:5;opacity:0}
@keyframes obParticleRise{0%{opacity:0;transform:translateY(0) scale(0)}30%{opacity:.8;transform:translateY(-10px) scale(1)}100%{opacity:0;transform:translateY(-50px) scale(.3)}}
.ob-crack-p1{bottom:30%;left:35%;animation:obParticleRise 2s ease-out 1s infinite}
.ob-crack-p2{bottom:28%;right:33%;animation:obParticleRise 1.8s ease-out 1.4s infinite;width:3px;height:3px}
.ob-crack-p3{bottom:32%;left:50%;animation:obParticleRise 2.2s ease-out 1.8s infinite;width:5px;height:5px;background:#fde68a}
.ob-crack-p4{bottom:35%;right:42%;animation:obParticleRise 1.6s ease-out 2.2s infinite;width:3px;height:3px;background:#e8972a}
.ob-crack-p5{bottom:30%;left:44%;animation:obParticleRise 2.4s ease-out .6s infinite;width:2px;height:2px}

/* hold to hatch */
.ob-hold-wrap{display:flex;flex-direction:column;align-items:center;gap:20px;padding:30px 0}
.ob-hold-ring{position:relative;width:160px;height:160px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.ob-hold-ring svg{position:absolute;inset:0;transform:rotate(-90deg)}
.ob-hold-ring-bg{fill:none;stroke:rgba(255,255,255,.06);stroke-width:4}
.ob-hold-ring-fill{fill:none;stroke:#F5B84C;stroke-width:4;stroke-linecap:round;stroke-dasharray:283;transition:stroke-dashoffset .1s linear}
.ob-hold-emoji{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:56px;animation:obPulse 2.5s ease-in-out infinite}
.ob-hold-label{font-size:13px;color:rgba(255,255,255,.3);font-weight:700;text-align:center}

/* photo */
.ob-viewfinder{position:relative;width:100%;aspect-ratio:3/4;border-radius:20px;overflow:hidden;background:#080410;border:2px solid rgba(255,255,255,.08);margin:8px 0 16px}
.ob-vf-silhouette{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:80px;color:rgba(255,255,255,.06)}
.ob-vf-creature{position:absolute;cursor:grab;z-index:5;user-select:none;-webkit-user-select:none;touch-action:none;filter:drop-shadow(0 4px 12px rgba(0,0,0,.5));line-height:1}
.ob-vf-flash{position:absolute;inset:0;background:#fff;z-index:10;animation:obFlash .4s ease-out forwards;pointer-events:none}
.ob-polaroid{background:#F4EFE8;border-radius:8px;padding:10px 10px 30px;box-shadow:0 8px 32px rgba(0,0,0,.4);transform:rotate(-2deg);margin:12px auto;max-width:280px}
.ob-polaroid-img{width:100%;aspect-ratio:3/4;border-radius:4px;background:#1a1030;display:flex;align-items:center;justify-content:center;font-size:60px;position:relative;overflow:hidden}
.ob-polaroid-caption{text-align:center;padding:8px 0 0;font-family:'Baloo 2',cursive;font-size:13px;color:#3a2810;font-weight:800}

/* mood chips */
.ob-moods{display:flex;gap:8px;justify-content:center;margin:12px 0}
.ob-mood{width:48px;height:48px;border-radius:50%;border:2px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;transition:all .2s}
.ob-mood.on{border-color:#F5B84C;background:rgba(245,184,76,.12);transform:scale(1.15)}

/* hatch celebration */
.ob-hatch-celeb{text-align:center;animation:obFadeIn .5s ease-out}
.ob-hatch-emoji{font-size:80px;animation:obPop .5s ease-out}
.ob-hatch-name{font-family:'Baloo 2',cursive;font-size:28px;font-weight:800;margin-top:12px}
`;

// ── Stars ────────────────────────────────────────────────────────────────────

const STARS = Array.from({length:24},(_,i)=>({
  id:i,x:Math.random()*100,y:Math.random()*50,
  size:Math.random()<.4?3:2,
  d:(2.5+Math.random()*2.5).toFixed(1)+'s',
  dl:(Math.random()*3).toFixed(1)+'s',
  t:Math.random()<.5?1:2,
}));

// ── This-or-that pairs ──────────────────────────────────────────────────────

const TOT_PAIRS: Array<[{emoji:string;label:string;tag:string},{emoji:string;label:string;tag:string}]> = [
  [{emoji:'🦁',label:'Brave',tag:'brave'},{emoji:'🌸',label:'Gentle',tag:'gentle'}],
  [{emoji:'🌙',label:'Dreamy',tag:'dreamy'},{emoji:'🚀',label:'Adventurous',tag:'adventurous'}],
  [{emoji:'🎨',label:'Creative',tag:'creative'},{emoji:'💛',label:'Kind',tag:'kind'}],
];

// ── Secret examples ─────────────────────────────────────────────────────────

const SECRET_EXAMPLES = [
  "She talks to her stuffed animals when she thinks nobody is listening",
  "He insists on checking under the bed for friendly monsters",
  "She makes up songs about everything, even breakfast",
  "He draws maps of imaginary places on every piece of paper",
];

// ── Loading messages for story generation ───────────────────────────────────

const LOADING_MESSAGES = [
  { emoji: '📝', text: 'is gathering ingredients...' },
  { emoji: '✨', text: 'is adding a pinch of silly...' },
  { emoji: '🌙', text: 'is stirring in some brave...' },
  { emoji: '🎨', text: 'is painting the setting...' },
  { emoji: '💫', text: 'is sprinkling in the magic...' },
  { emoji: '📖', text: 'is writing the first page...' },
  { emoji: '🌟', text: 'is polishing the adventure...' },
  { emoji: '🎁', text: 'is wrapping it all up...' },
];

// ── Component ────────────────────────────────────────────────────────────────

/*
  STEP MAP (15 steps, 0-14):
  0  — Intro ("Here's what's about to happen")
  1  — Egg arrives (tap)
  2  — Name/Age/Pronouns (skipped if parent setup done)
  3  — Pick creature
  4  — This-or-That personality (3 rounds)
  5  — Parent's secret (skipped if parent setup done)
  6  — Story begins (2 intro pages)
  7  — Hold to hatch
  8  — Name creature + dream question + mood (combined)
  9  — Story generating (enhanced loading)
  10 — Story reader (book cover + pages)
  11 — Photo
  12 — Egg surprise (merged: egg reveal + 7-night mechanic)
  13 — Night 1 complete summary
  14 — Complete (triggers onComplete)
*/

export default function OnboardingFlow({ onComplete, childProfile }: OnboardingFlowProps) {
  const { user } = useApp();

  const hasProfile = !!childProfile?.childName;
  const [step, setStep] = useState(0);

  // Step 1 (egg click)
  const [eggClicked, setEggClicked] = useState(false);

  // Step 2 — pre-populated from parent setup if available
  const [childName, setChildName] = useState(childProfile?.childName || '');
  const [childAge, setChildAge] = useState(childProfile?.childAge || '');
  const [childPronouns, setChildPronouns] = useState<'she/her'|'he/him'|'they/them'>((childProfile?.childPronouns as any) || 'she/her');

  // Step 3
  const [selectedCreatureId, setSelectedCreatureId] = useState('');

  // Step 4
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);
  const [totIdx, setTotIdx] = useState(0);

  // Step 5
  const [parentSecret, setParentSecret] = useState(childProfile?.parentSecret || '');

  // Step 6
  const [storyPage, setStoryPage] = useState(0);

  // Step 7
  const [holdProgress, setHoldProgress] = useState(0);
  const [hatched, setHatched] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setInterval>|null>(null);
  const [tapCount, setTapCount] = useState(0);
  const holdDecayTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  // Step 8 (combined name + dream)
  const [creatureName, setCreatureName] = useState('');
  const [dreamAnswer, setDreamAnswer] = useState('');
  const [mood, setMood] = useState('');

  // Step 9 — loading messages
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Step 10 — story reader
  const [generatedStory, setGeneratedStory] = useState<{title:string;text:string;headline:string;quote:string;memoryLine:string}|null>(null);
  const [storyGenerating, setStoryGenerating] = useState(false);
  const [storyError, setStoryError] = useState('');
  const [storyBookPage, setStoryBookPage] = useState(0);

  // Step 11 — photo
  const [photoTaken, setPhotoTaken] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [creaturePos, setCreaturePos] = useState({xPct:50,yPct:50});
  const photoDataUrl = useRef<string|undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [creatureScale, setCreatureScale] = useState(1);
  const viewfinderRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({x:0,y:0});
  const pinchStartDist = useRef<number|null>(null);
  const pinchStartScale = useRef(1);

  // Step 12 — egg surprise
  const [eggRevealed, setEggRevealed] = useState(false);

  const creature = selectedCreatureId ? getCreature(selectedCreatureId) : null;


  // Smart next — skips steps that are pre-filled from parent setup
  const next = useCallback(() => setStep(s => {
    let n = s + 1;
    if (n === 2 && hasProfile) n = 3;
    if (n === 5 && hasProfile && parentSecret) n = 6;
    return n;
  }), [hasProfile, parentSecret]);

  // Step 7: hold handlers
  const startHold = useCallback(() => {
    if (hatched) return;
    holdTimer.current = setInterval(() => {
      setHoldProgress(p => {
        if (p >= 100) {
          if (holdTimer.current) clearInterval(holdTimer.current);
          setHatched(true);
          return 100;
        }
        return p + 100/30;
      });
    }, 100);
  }, [hatched]);

  const stopHold = useCallback(() => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    if (!hatched) {
      if (holdDecayTimer.current) clearTimeout(holdDecayTimer.current);
      holdDecayTimer.current = setTimeout(() => { setHoldProgress(0); }, 1000);
    }
  }, [hatched]);

  const handleEggTap = useCallback(() => {
    if (hatched) return;
    setTapCount(c => {
      const next = c + 1;
      setHoldProgress(Math.min(100, (next / 7) * 100));
      if (next >= 7) { setHatched(true); return 0; }
      return next;
    });
  }, [hatched]);

  // Step 9: cycle loading messages
  useEffect(() => {
    if (step !== 9 || !storyGenerating) return;
    const t = setInterval(() => setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 2500);
    return () => clearInterval(t);
  }, [step, storyGenerating]);

  // Step 11: start camera
  useEffect(() => {
    if (step !== 11 || photoTaken) return;
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        setCameraReady(true);
      })
      .catch(() => { setCameraFailed(true); });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [step, photoTaken]);

  useEffect(() => {
    if (!cameraReady || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [cameraReady]);

  // Drag creature in viewfinder
  const onCreatureDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); e.preventDefault();
    setDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragOffset.current = { x: clientX, y: clientY };
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const rect = viewfinderRef.current?.getBoundingClientRect();
      if (!rect) return;
      if ('touches' in e && e.touches.length >= 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (pinchStartDist.current === null) { pinchStartDist.current = dist; pinchStartScale.current = creatureScale; }
        else { setCreatureScale(Math.max(0.3, pinchStartScale.current * (dist / pinchStartDist.current))); }
        return;
      }
      pinchStartDist.current = null;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setCreaturePos({ xPct: ((clientX - rect.left) / rect.width) * 100, yPct: ((clientY - rect.top) / rect.height) * 100 });
    };
    const onUp = () => { setDragging(false); pinchStartDist.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
  }, [dragging, creatureScale]);

  // Take photo
  const takePhoto = useCallback(() => {
    if (photoTaken) return;
    setShowFlash(true);
    if (videoRef.current && cameraReady) {
      try {
        const v = videoRef.current;
        const cw = v.videoWidth || 640; const ch = v.videoHeight || 480;
        const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save(); ctx.translate(cw, 0); ctx.scale(-1, 1); ctx.drawImage(v, 0, 0, cw, ch); ctx.restore();
          if (creature) {
            const fontSize = Math.round(48 * creatureScale * (cw / 400));
            ctx.font = `${fontSize}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(creature.emoji, (creaturePos.xPct / 100) * cw, (creaturePos.yPct / 100) * ch);
          }
          photoDataUrl.current = canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (_) {}
      streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
    }
    setTimeout(() => { setShowFlash(false); setPhotoTaken(true); }, 400);
  }, [photoTaken, creature, cameraReady, creatureScale, creaturePos]);

  // ── Generate first story when entering step 9 ──────────────────────────────
  useEffect(() => {
    if (step !== 9 || storyGenerating || generatedStory) return;
    setStoryGenerating(true);
    setStoryError('');

    const traits = personalityTags.join(', ');
    const prompt = `You are writing the very first bedtime story for a child who just met their creature companion tonight in SleepSeed.

CHILD: ${childName}, age ${childAge}
CREATURE: ${creatureName} the ${creature?.name || 'creature'} ${creature?.emoji || ''}
PERSONALITY: ${traits}
PARENT'S SECRET: ${parentSecret}
DREAM ANSWER: ${dreamAnswer}

Write a SHORT, silly, warm first-adventure story (250-350 words) about ${childName} and ${creatureName} meeting for the first time tonight and going on a small silly adventure together.

RULES:
- Title MUST be: "${childName} and ${creatureName}'s First Adventure"
- It's their FIRST night together -- ${creatureName} just hatched from an egg
- Make it silly and fun -- this should make a ${childAge}-year-old laugh
- Weave in at least one personality trait naturally (${traits})
- Subtly reference the parent's secret in a way that feels magical, not obvious
- ${creatureName} should have a personality that matches the creature type (${creature?.description || ''})
- End with them settling down for sleep, ready for more adventures tomorrow
- Keep vocabulary appropriate for age ${childAge}
- No morals, no lessons. Just a fun first night together.

Also generate Night Card data for this story.

Return ONLY valid JSON:
{
  "title": "${childName} and ${creatureName}'s First Adventure",
  "text": "The full story text here. Use paragraphs separated by \\n\\n.",
  "headline": "A short 3-6 word Night Card headline about tonight",
  "quote": "The most memorable line from the story that a parent would treasure -- 10-20 words",
  "memoryLine": "A warm memory line for the parent -- what this night meant -- 10-16 words"
}`;

    (async () => {
      try {
        const r = await fetch('/api/claude', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
        });
        const raw = await r.text();
        let d; try { d = JSON.parse(raw); } catch { throw new Error('Bad response'); }
        if (!r.ok) throw new Error(d.error?.message || 'API error');
        const text = d.content?.find((b: any) => b.type === 'text')?.text || '';
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        setGeneratedStory({
          title: parsed.title || `${childName} and ${creatureName}'s First Adventure`,
          text: parsed.text || '', headline: parsed.headline || 'The night it all began.',
          quote: parsed.quote || `${creatureName} smiled. "I've been waiting for you."`,
          memoryLine: parsed.memoryLine || `The night ${childName} met ${creatureName} for the very first time.`,
        });
      } catch (e: any) {
        console.error('First story generation failed:', e);
        setStoryError(e.message);
        setGeneratedStory({
          title: `${childName} and ${creatureName}'s First Adventure`,
          text: `${creatureName} tumbled out of the egg and looked up at ${childName} with big, bright eyes.\n\n"Well," said ${creatureName}, dusting off a tiny wing, "that was a tight fit."\n\n${childName} laughed -- the kind of laugh that made the stars outside the window flicker.\n\n"Where did you come from?" ${childName} asked.\n\n"From the egg, obviously," said ${creatureName}. "The real question is -- where are we going?"\n\nAnd so, on their very first night together, ${childName} and ${creatureName} crept to the window and looked out at the enormous sky. ${creatureName} pointed at a cloud shaped like a sandwich.\n\n"That one looks hungry," ${creatureName} whispered.\n\n${childName} pointed at one shaped like a hat. "That one looks cold."\n\nThey named every cloud they could see. The sleepy one. The show-off one. The one that looked exactly like ${childName}'s left shoe.\n\nBy the time they ran out of clouds, ${childName}'s eyes were heavy. ${creatureName} curled up at the foot of the bed -- small and warm and already snoring just a little.\n\n"Goodnight, ${creatureName}," ${childName} whispered.\n\n${creatureName}'s ear twitched. "See you tomorrow," ${creatureName} mumbled. "We have a lot of clouds left."`,
          headline: 'The night the clouds got names.', quote: `"The real question is -- where are we going?"`,
          memoryLine: `The night ${childName} met ${creatureName} -- and named every cloud in the sky.`,
        });
      }
      setStoryGenerating(false);
    })();
  }, [step]); // eslint-disable-line

  // Step 14: assemble and complete
  useEffect(() => {
    if (step !== 14 || !user || !creature) return;
    const charId = crypto.randomUUID?.() || uid();
    const character: Character = {
      id: charId, userId: user.id, name: childName, type: 'human',
      ageDescription: childAge, pronouns: childPronouns,
      personalityTags: personalityTags as PersonalityTag[],
      weirdDetail: parentSecret, currentSituation: '',
      photo: photoDataUrl.current, color: '#1E1640', emoji: '\u{1F9D2}',
      storyIds: [], isFamily: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const hatchedCreature: HatchedCreature = {
      id: crypto.randomUUID?.() || uid(), userId: user.id, characterId: character.id,
      name: creatureName, creatureType: creature.id, creatureEmoji: creature.emoji,
      color: creature.color, rarity: 'legendary', personalityTraits: personalityTags,
      dreamAnswer, parentSecret, photoUrl: photoDataUrl.current,
      weekNumber: 1, hatchedAt: new Date().toISOString(),
    };
    onComplete({ character, creature: hatchedCreature, dreamAnswer, photoDataUrl: photoDataUrl.current, firstStory: generatedStory || undefined });
  }, [step]); // eslint-disable-line

  // ── Render helpers ─────────────────────────────────────────────────────────

  const TOTAL_STEPS = 14;
  const dots = (
    <div style={{padding:'38px 24px 8px',position:'relative',zIndex:10}}>
      <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,.06)',overflow:'hidden'}}>
        <div style={{height:3,borderRadius:2,background:'linear-gradient(90deg,#a06010,#F5B84C)',width:`${Math.min(100,(step/TOTAL_STEPS)*100)}%`,transition:'width .4s ease'}}/>
      </div>
    </div>
  );

  const goBack = useCallback(() => {
    setStep(s => {
      let n = s - 1;
      // Skip back over steps that were skipped forward
      if (n === 5 && hasProfile && parentSecret) n = 4;
      if (n === 2 && hasProfile) n = 1;
      return Math.max(0, n);
    });
  }, [hasProfile, parentSecret]);

  const backBtn = step > 0 ? (
    <button onClick={goBack} style={{
      background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:12,
      cursor:'pointer',marginTop:12,padding:'4px 0',transition:'color .15s',width:'100%',textAlign:'center'
    }}
    onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,.45)')}
    onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,.2)')}>
      ← Back
    </button>
  ) : null;

  const starField = (
    <>
      {STARS.map(s => (
        <div key={s.id} className={s.t===1?'ob-star':'ob-star2'}
          style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
      ))}
    </>
  );

  // ── STEP 0 — Intro ────────────────────────────────────────────────────────
  if (step === 0) return (
    <div className="ob"><style>{CSS}</style>{starField}
      <div className="ob-content" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'85vh',textAlign:'center'}}>
        <div style={{display:'flex',gap:10,marginBottom:24}}>
          <div style={{fontSize:32,animation:'obFloat 3.5s ease-in-out infinite'}}>✨</div>
          <div style={{fontSize:32,animation:'obFloat 3s ease-in-out infinite',animationDelay:'-.5s'}}>🥚</div>
          <div style={{fontSize:32,animation:'obFloat 4s ease-in-out infinite',animationDelay:'-1s'}}>✨</div>
        </div>
        <div className="ob-title" style={{fontSize:24,marginBottom:12}}>Here's what's about to happen!</div>
        <div style={{display:'flex',flexDirection:'column',gap:14,width:'100%',maxWidth:320,marginBottom:16}}>
          {[{n:'1',t:'Discover what\'s inside the <strong style="color:var(--cream)">mysterious egg</strong> waiting for you'},
            {n:'2',t:'Create your <strong style="color:var(--cream)">first adventure story</strong> together'},
            {n:'3',t:'Discover <strong style="color:var(--cream)">Night Cards</strong> and capture your first memory'}
          ].map((item,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,textAlign:'left'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(245,184,76,.1)',border:'1.5px solid rgba(245,184,76,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,fontWeight:800,color:'#F5B84C',fontFamily:"'Baloo 2',cursive"}}>{item.n}</div>
              <div style={{fontSize:13,color:'rgba(244,239,232,.6)',lineHeight:1.5}} dangerouslySetInnerHTML={{__html:item.t}}/>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,.35)',textAlign:'center',lineHeight:1.6,marginBottom:16,maxWidth:300,fontStyle:'italic'}}>
          Along the way, we'll learn about your child to make every story feel like it was written just for them.
        </div>
        <button className="ob-cta ob-cta-amber" onClick={next}>Let's go! ✦</button>
      </div>
    </div>
  );

  // ── STEP 1 — Egg Arrives ──────────────────────────────────────────────────
  if (step === 1) return (
    <div className="ob"><style>{CSS}</style>{starField}{dots}
      <div className="ob-content" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'80vh'}}>
        <div className="ob-read-badge">Read aloud — your child taps!</div>
        <div style={{position:'relative',cursor:'pointer'}}
          onClick={() => { if (eggClicked) return; setEggClicked(true); setTimeout(() => { setEggClicked(false); next(); }, 1800); }}>
          <div style={{position:'absolute',inset:-30,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,184,76,.15),transparent 65%)',animation:'obPulse 3s ease-in-out infinite'}}/>
          <div style={{position:'absolute',inset:-50,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,184,76,.06),transparent 60%)',animation:'obPulse 4s ease-in-out .5s infinite'}}/>
          {eggClicked && (<>
            <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'2px solid rgba(245,184,76,.6)',animation:'s0burstRing .8s ease-out forwards',zIndex:5}}/>
            <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'1px solid rgba(20,216,144,.4)',animation:'s0burstRing 1s ease-out .1s forwards',zIndex:5}}/>
          </>)}
          <div style={{fontSize:130,animation:eggClicked?'obGiftShake 1s ease-in-out forwards':'obPulse 2.5s ease-in-out infinite,obRock 2.2s ease-in-out infinite',filter:eggClicked?'drop-shadow(0 0 40px rgba(245,184,76,.8))':'drop-shadow(0 0 20px rgba(245,184,76,.4))',position:'relative',zIndex:2}}>🥚</div>
          <div style={{position:'absolute',top:'5%',right:'-8%',fontSize:16,color:'rgba(245,184,76,.5)',animation:'obCreatureSpark 2s ease-in-out infinite',zIndex:3}}>✦</div>
          <div style={{position:'absolute',bottom:'10%',left:'-5%',fontSize:11,color:'rgba(245,184,76,.35)',animation:'obCreatureSpark 1.5s ease-in-out .6s infinite',zIndex:3}}>✧</div>
        </div>
        <div className="ob-title" style={{marginTop:24,fontSize:26}}>{eggClicked ? 'Something is waking up...' : 'Something has arrived...'}</div>
        <div className="ob-sub" style={{color:'rgba(244,239,232,.5)'}}>{eggClicked ? 'The egg is glowing brighter!' : 'A golden egg appeared tonight.'}</div>
        {!eggClicked && <div style={{marginTop:16,fontFamily:"'Baloo 2',cursive",fontSize:20,fontWeight:800,color:'#F5B84C',textAlign:'center',animation:'obPulse 2s ease-in-out infinite',textShadow:'0 0 20px rgba(245,184,76,.4)',cursor:'pointer'}} onClick={() => { if (eggClicked) return; setEggClicked(true); setTimeout(() => { setEggClicked(false); next(); }, 1800); }}>Tap the egg!</div>}
        {backBtn}
      </div>
    </div>
  );

  // ── STEP 2 — Name, Age, Pronouns ──────────────────────────────────────────
  if (step === 2) return (
    <div className="ob"><style>{CSS}</style>{starField}{dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div className="ob-title">Who is this egg for?</div>
        <div className="ob-sub">Tell us about the child who'll become the hero of every story.</div>
        <input className="ob-input" placeholder="Child's first name" value={childName} onChange={e => setChildName(e.target.value)} autoFocus />
        <div style={{display:'flex',gap:8,justifyContent:'center',margin:'12px 0'}}>
          {(['she/her','he/him','they/them'] as const).map(p => (
            <div key={p} className={`ob-age${childPronouns===p?' on':''}`} onClick={() => setChildPronouns(p)}>{p}</div>
          ))}
        </div>
        <div className="ob-ages">
          {['4-5','5-6','7-8','9-10','11+'].map(a => (
            <div key={a} className={`ob-age${childAge===a?' on':''}`} onClick={() => setChildAge(a)}>{a}</div>
          ))}
        </div>
        <button className="ob-cta ob-cta-amber" disabled={childName.length<2 || !childAge} onClick={next}>Next</button>
        {backBtn}
      </div>
    </div>
  );

  // ── STEP 3 — Pick Your Creature ───────────────────────────────────────────
  if (step === 3) return (
    <div className="ob"><style>{CSS}</style>{starField}{dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div className="ob-read-badge">Let your child pick!</div>
        <div className="ob-title">Tap one!</div>
        <div className="ob-sub">Pick a DreamKeeper to hatch. They'll join every story.</div>
        {creature && (
          <div className="ob-preview" style={{'--cc':creature.color+'30',borderColor:creature.color+'35'} as any}>
            <div className="ob-preview-sparkles">
              <div className="ob-preview-sparkle" style={{top:'15%',right:'12%',animationDelay:'0s'}}>✦</div>
              <div className="ob-preview-sparkle" style={{top:'60%',right:'8%',animationDelay:'.7s',fontSize:7}}>✧</div>
            </div>
            <div className="ob-preview-emoji" style={{'--cc':creature.color+'50'} as any}>{creature.emoji}</div>
            <div className="ob-preview-info">
              <div className="ob-preview-name" style={{color:creature.color}}>{creature.name}</div>
              <div className="ob-preview-desc">{creature.description}</div>
            </div>
          </div>
        )}
        <div className="ob-cgrid">
          {CREATURES.map(c => (
            <div key={c.id} className={`ob-ccard${selectedCreatureId===c.id?' on':''}`} style={{'--cc':c.color} as any} onClick={() => setSelectedCreatureId(c.id)}>
              <div className="ob-ccard-emoji">{c.emoji}</div>
              <div className="ob-ccard-name">{c.name}</div>
            </div>
          ))}
        </div>
        <button className="ob-cta ob-cta-amber" disabled={!selectedCreatureId} onClick={next}>This one!</button>
        {backBtn}
      </div>
    </div>
  );

  // ── STEP 4 — This or That ─────────────────────────────────────────────────
  if (step === 4) {
    const pair = TOT_PAIRS[totIdx];
    if (!pair) { setStep(hasProfile && parentSecret ? 6 : 5); return null; }
    return (
      <div className="ob"><style>{CSS}</style>{starField}{dots}
        <div className="ob-content" style={{paddingTop:20}}>
          <div className="ob-read-badge">Read aloud — your child picks!</div>
          <div className="ob-title">Is {childName} more...</div>
          <div className="ob-sub">Tap the one that fits. ({totIdx+1} of 3)</div>
          <div className="ob-tot-pair">
            {pair.map((opt,oi) => (
              <div key={oi} className="ob-tot-btn" onClick={() => {
                setPersonalityTags(prev => [...prev, opt.tag]);
                if (totIdx >= 2) setTimeout(() => setStep(hasProfile && parentSecret ? 6 : 5), 300);
                else setTotIdx(totIdx + 1);
              }}>
                <div className="ob-tot-emoji">{opt.emoji}</div>
                <div className="ob-tot-label">{opt.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 5 — Parent's Secret ──────────────────────────────────────────────
  if (step === 5) return (
    <div className="ob ob-parent-bg"><style>{CSS}</style>{starField}{dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div className="ob-title-parent">Now, a quiet question just for you.</div>
        <div className="ob-sub-parent">What's something about {childName} that only you know? The thing that makes you smile when they're not looking.</div>
        <textarea className="ob-textarea" placeholder="She talks to her stuffed animals when she thinks nobody is listening..." value={parentSecret} onChange={e => setParentSecret(e.target.value)} rows={4} />
        <div className="ob-chips">
          <div style={{fontSize:10,color:'rgba(255,255,255,.2)',marginBottom:4,fontStyle:'italic'}}>Not sure? Pick one:</div>
          {SECRET_EXAMPLES.map((ex,i) => (
            <div key={i} className="ob-chip" onClick={() => setParentSecret(ex)}>{ex.slice(0,40)}...</div>
          ))}
        </div>
        <div style={{fontSize:10,color:'rgba(255,255,255,.35)',textAlign:'center',marginTop:8,fontStyle:'italic'}}>This becomes part of the story DNA — it'll appear when you least expect it.</div>
        <button className="ob-cta ob-cta-amber" disabled={parentSecret.length<5} onClick={next}>Keep this safe</button>
        {backBtn}
      </div>
    </div>
  );

  // ── STEP 6 — Story Begins (2 pages) ───────────────────────────────────────
  if (step === 6) {
    const introPages = [
      {emoji:'🌙',text:`One quiet night, a small golden egg appeared at the foot of ${childName}'s bed. It was warm to the touch, and it hummed.`},
      {emoji:'🥚',text:`The egg rocked gently. A tiny crack appeared, glowing amber. Something inside was waking up...`},
    ];
    const pg = introPages[storyPage];
    return (
      <div className="ob"><style>{CSS}</style>{starField}{dots}
        <div className="ob-content" style={{paddingTop:20}}>
          <div className="ob-read-badge">Read aloud to your child!</div>
          <div className="ob-story-page" key={storyPage}>
            {storyPage === 0 ? (
              <div className="ob-story-emoji">{pg?.emoji}</div>
            ) : (
              <div className="ob-crack-scene">
                <div className="ob-crack-glow"><div className="ob-crack-glow-inner"/><div className="ob-crack-glow-outer"/></div>
                <div className="ob-crack-egg">🥚</div>
                <div className="ob-crack-line ob-crack-l1"/><div className="ob-crack-line ob-crack-l2"/>
                <div className="ob-crack-line ob-crack-l3"/><div className="ob-crack-line ob-crack-l4"/>
                <div className="ob-crack-beam ob-crack-beam1"/><div className="ob-crack-beam ob-crack-beam2"/><div className="ob-crack-beam ob-crack-beam3"/>
                <div className="ob-crack-particle ob-crack-p1"/><div className="ob-crack-particle ob-crack-p2"/>
                <div className="ob-crack-particle ob-crack-p3"/><div className="ob-crack-particle ob-crack-p4"/><div className="ob-crack-particle ob-crack-p5"/>
              </div>
            )}
            <div className="ob-story-text">{pg?.text}</div>
          </div>
          {storyPage < 1 ? (
            <button className="ob-cta ob-cta-amber" onClick={() => setStoryPage(1)}>Continue</button>
          ) : (
            <button className="ob-cta ob-cta-amber" onClick={()=>setStep(7)}>What's inside? →</button>
          )}
          {backBtn}
        </div>
      </div>
    );
  }

  // ── STEP 7 — Hold to Hatch ────────────────────────────────────────────────
  if (step === 7) {
    const dashoffset = 283 - (283 * holdProgress / 100);
    return (
      <div className="ob"><style>{CSS}</style>{starField}{dots}
        <div className="ob-content" style={{paddingTop:20}}>
          {!hatched ? (
            <>
              <div className="ob-read-badge">Your child holds the egg!</div>
              <div className="ob-title">Something is waking up...</div>
              <div className="ob-sub">Hold the egg and find out who's inside!</div>
              <div className="ob-hold-wrap">
                <div className="ob-hold-ring" onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold} onTouchStart={startHold} onTouchEnd={stopHold} onClick={handleEggTap}>
                  <svg viewBox="0 0 100 100">
                    <circle className="ob-hold-ring-bg" cx="50" cy="50" r="45"/>
                    <circle className="ob-hold-ring-fill" cx="50" cy="50" r="45" style={{strokeDashoffset:dashoffset}}/>
                  </svg>
                  <div className="ob-hold-emoji">🥚</div>
                </div>
                <div className="ob-hold-label">
                  {holdProgress > 0 && holdProgress < 50 ? 'Keep going...' :
                   holdProgress >= 50 && holdProgress < 90 ? 'Almost there...' :
                   holdProgress >= 90 ? 'It\'s cracking!!' : 'Hold or tap the egg!'}
                </div>
              </div>
            </>
          ) : (
            <div className="ob-hatch-celeb">
              <div style={{position:'relative',display:'inline-block',marginBottom:8}}>
                <div style={{position:'absolute',inset:-20,borderRadius:'50%',background:`radial-gradient(circle,${creature?.color||'#F5B84C'}20,transparent 70%)`,animation:'obPulse 2s ease-in-out infinite'}}/>
                <div className="ob-hatch-emoji" style={{animation:'obPop .5s ease-out,obFloat 3s ease-in-out .5s infinite',filter:`drop-shadow(0 0 20px ${creature?.color||'#F5B84C'}60)`}}>{creature?.emoji}</div>
              </div>
              <div className="ob-hatch-name" style={{color:creature?.color}}>It's a {creature?.name}!</div>
              <div className="ob-sub" style={{color:'rgba(244,239,232,.55)'}}>Your DreamKeeper is here. What will you call them?</div>
              <button className="ob-cta ob-cta-teal" onClick={next}>Name your DreamKeeper →</button>
            </div>
          )}
          {backBtn}
        </div>
      </div>
    );
  }

  // ── STEP 8 — Name + Dream + Mood (combined) ──────────────────────────────
  if (step === 8) return (
    <div className="ob"><style>{CSS}</style>{starField}{dots}
      <div className="ob-content" style={{paddingTop:20,display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div className="ob-read-badge">Your child names their DreamKeeper!</div>
        <div style={{position:'relative',marginBottom:12}}>
          <div style={{position:'absolute',inset:-20,borderRadius:'50%',background:`radial-gradient(circle,${creature?.color||'#F5B84C'}18,transparent 65%)`,animation:'obPulse 3s ease-in-out infinite'}}/>
          <div style={{fontSize:64,animation:'obFloat 3s ease-in-out infinite',filter:`drop-shadow(0 0 20px ${creature?.color||'#F5B84C'}55)`,position:'relative',zIndex:2}}>{creature?.emoji}</div>
        </div>
        <div className="ob-title" style={{fontSize:26,color:creature?.color||'#F5B84C'}}>What's their name?</div>
        <div className="ob-sub">{childName} gets to choose.</div>
        <input className="ob-input" style={{textAlign:'center',fontSize:22}} placeholder="Type a name..." value={creatureName} onChange={e => setCreatureName(e.target.value)} autoFocus />
        {creature && (
          <div className="ob-chips" style={{marginTop:8,justifyContent:'center'}}>
            {creature.nameSuggestions.map(n => (
              <div key={n} className={`ob-chip${creatureName===n?' on':''}`} onClick={() => setCreatureName(n)}>{n}</div>
            ))}
          </div>
        )}

        {/* Dream question - flows naturally after naming */}
        {creatureName.length >= 2 && (
          <div style={{width:'100%',marginTop:20,animation:'obFadeIn .4s ease-out'}}>
            <div style={{height:1,background:'rgba(255,255,255,.06)',margin:'0 0 18px'}}/>
            <div className="ob-title" style={{fontSize:18}}>What should {creatureName} dream about tonight?</div>
            <textarea className="ob-textarea" placeholder="Flying through cotton candy clouds..." value={dreamAnswer} onChange={e => setDreamAnswer(e.target.value)} rows={2} style={{textAlign:'center',fontStyle:'italic',minHeight:70}} />
            <div className="ob-chips" style={{justifyContent:'center',marginBottom:8}}>
              {['Flying through cotton candy clouds','Finding a secret door in the garden','Swimming with friendly whales','Building a treehouse on the moon'].map((d,i) => (
                <div key={i} className={`ob-chip${dreamAnswer===d?' on':''}`} onClick={() => setDreamAnswer(d)}>{d}</div>
              ))}
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.35)',textAlign:'center',marginTop:6,marginBottom:4,fontWeight:700}}>How does tonight feel?</div>
            <div className="ob-moods">
              {[{e:'🌙',l:'Calm'},{e:'😊',l:'Happy'},{e:'🥺',l:'Tender'},{e:'✨',l:'Magical'}].map(m => (
                <div key={m.e} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div className={`ob-mood${mood===m.e?' on':''}`} onClick={() => setMood(m.e)}>{m.e}</div>
                  <div style={{fontSize:9,color:mood===m.e?'rgba(245,184,76,.7)':'rgba(255,255,255,.2)',fontWeight:700}}>{m.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="ob-cta ob-cta-amber" disabled={creatureName.length<2 || dreamAnswer.length<3} onClick={next} style={{marginTop:16}}>
          Let's go on our first adventure! ✦
        </button>
        {backBtn}
      </div>
    </div>
  );

  // ── STEP 9 — Story Generating (enhanced loading) ──────────────────────────
  if (step === 9 && storyGenerating) {
    const msg = LOADING_MESSAGES[loadingMsgIdx];
    return (
      <div className="ob"><style>{CSS}</style>{starField}
        <div className="ob-content" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'70vh'}}>
          <div style={{fontSize:72,marginBottom:20,animation:'obPulse 2s ease-in-out infinite'}}>{creature?.emoji}</div>
          <div className="ob-title" style={{fontSize:20}}>{creatureName} is writing your story...</div>
          <div key={loadingMsgIdx} style={{display:'flex',alignItems:'center',gap:8,marginTop:12,animation:'obFadeIn .4s ease-out'}}>
            <span style={{fontSize:20}}>{msg.emoji}</span>
            <span style={{fontSize:14,color:'rgba(244,239,232,.5)',fontStyle:'italic',fontFamily:"'Fraunces',serif"}}>{creatureName} {msg.text}</span>
          </div>
          <div style={{display:'flex',gap:8,marginTop:20}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{width:8,height:8,borderRadius:'50%',background:'#F5B84C',animation:`obShimmer 1s ease-in-out ${i*0.2}s infinite`}}/>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 9 (continued) → auto-advance to 10 ──────────────────────────────
  if (step === 9 && generatedStory) { setStep(10); return null; }

  // ── STEP 10 — Story Reader ────────────────────────────────────────────────
  if (step === 10 && generatedStory) {
    const paragraphs = generatedStory.text.split('\n\n').filter(Boolean);
    const PAGES_PER_VIEW = 2;
    const totalTextPages = Math.ceil(paragraphs.length / PAGES_PER_VIEW);
    const isOnCover = storyBookPage === 0;
    const textPageIdx = storyBookPage - 1;
    const currentParagraphs = isOnCover ? [] : paragraphs.slice(textPageIdx * PAGES_PER_VIEW, (textPageIdx + 1) * PAGES_PER_VIEW);
    const isLastPage = !isOnCover && textPageIdx >= totalTextPages - 1;

    if (isOnCover) return (
      <div className="ob"><style>{CSS}</style>{starField}{dots}
        <div className="ob-content" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'70vh'}}>
          <div style={{background:'linear-gradient(160deg,#1a1408,#2a1a08 30%,#1a1408)',borderRadius:20,padding:'36px 28px',width:'100%',maxWidth:320,textAlign:'center',position:'relative',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.08)',border:'1px solid rgba(200,150,60,.15)'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,transparent,#C87020,#E8972A,#C87020,transparent)'}}/>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(200,150,60,.5)',letterSpacing:'.14em',textTransform:'uppercase',marginBottom:16}}>A SleepSeed Story · Night 1</div>
            <div style={{position:'relative',display:'inline-block',marginBottom:16}}>
              <div style={{position:'absolute',inset:-20,borderRadius:'50%',background:`radial-gradient(circle,${creature?.color||'#F5B84C'}25,transparent 65%)`,animation:'obPulse 3s ease-in-out infinite'}}/>
              <div style={{fontSize:72,animation:'obFloat 3.5s ease-in-out infinite',filter:`drop-shadow(0 0 20px ${creature?.color||'#F5B84C'}50)`,position:'relative',zIndex:2}}>{creature?.emoji}</div>
            </div>
            <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:22,fontWeight:700,color:'#F0D880',lineHeight:1.3,marginBottom:8}}>{generatedStory.title}</div>
            <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:12,color:'rgba(240,216,128,.45)',fontStyle:'italic'}}>starring {childName} & {creatureName}</div>
          </div>
          <button className="ob-cta ob-cta-amber" onClick={() => setStoryBookPage(1)} style={{marginTop:20}}>Start reading together ✦</button>
          {backBtn}
        </div>
      </div>
    );

    return (
      <div className="ob"><style>{CSS}</style>{starField}{dots}
        <div className="ob-content" style={{paddingTop:16,position:'relative'}}>
          <div style={{position:'absolute',top:8,right:8,fontSize:36,zIndex:10,animation:'obFloat 3.5s ease-in-out infinite',filter:`drop-shadow(0 0 14px ${creature?.color||'#F5B84C'}50)`,pointerEvents:'none'}}>{creature?.emoji}</div>
          <div style={{background:'linear-gradient(160deg,#fef8e8,#f5e4b8)',borderRadius:20,padding:'22px 20px 16px',textAlign:'left',boxShadow:'0 16px 48px rgba(0,0,0,.45)',position:'relative',overflow:'hidden',marginBottom:12}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#C87020,#E8972A,#C87020)'}}/>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#8a5a1a',marginBottom:8}}>{textPageIdx === 0 ? generatedStory.title : `Page ${textPageIdx + 1}`}</div>
            {currentParagraphs.map((p, i) => (
              <div key={textPageIdx+'-'+i} style={{fontFamily:"'Fraunces',serif",fontSize:17,color:'#261600',lineHeight:1.75,marginBottom:10}}>{p}</div>
            ))}
          </div>
          <div style={{textAlign:'center',fontSize:10,color:'rgba(255,255,255,.3)',marginBottom:8}}>Page {textPageIdx + 1} of {totalTextPages}</div>
          {!isLastPage ? (
            <button className="ob-cta ob-cta-amber" onClick={() => setStoryBookPage(p => p + 1)}>Keep reading →</button>
          ) : (
            <button className="ob-cta ob-cta-teal" onClick={next}>That was amazing! Continue ✦</button>
          )}
          {backBtn}
        </div>
      </div>
    );
  }

  // ── STEP 11 — Photo Together ──────────────────────────────────────────────
  if (step === 11) return (
    <div className="ob"><style>{CSS}</style>{starField}{dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div className="ob-title">Capture this moment!</div>
        <div className="ob-sub" style={{color:'rgba(244,239,232,.5)'}}>Take a photo with {creatureName} — it becomes your first Night Card memory.</div>
        {!photoTaken ? (
          <>
            <div className="ob-viewfinder" ref={viewfinderRef} onWheel={e=>{e.preventDefault();setCreatureScale(s=>Math.max(0.3,s-(e.deltaY*0.002)));}}>
              {cameraReady ? <video ref={videoRef} autoPlay playsInline muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)'}}/> : <div className="ob-vf-silhouette">{cameraFailed ? '📷' : '...'}</div>}
              <div className="ob-vf-creature" style={{left:`${creaturePos.xPct}%`,top:`${creaturePos.yPct}%`,transform:'translate(-50%,-50%)',fontSize:Math.round(48*creatureScale),cursor:dragging?'grabbing':'grab'}} onMouseDown={onCreatureDragStart} onTouchStart={onCreatureDragStart}>{creature?.emoji}</div>
              {showFlash && <div className="ob-vf-flash"/>}
              {cameraReady && !dragging && <div style={{position:'absolute',bottom:16,left:0,right:0,textAlign:'center',fontSize:11,color:'rgba(255,255,255,.4)',fontWeight:700,zIndex:6}}>Drag to position · pinch to resize</div>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,margin:'6px 0 10px',padding:'0 4px'}}>
              <span style={{fontSize:14}}>{creature?.emoji}</span>
              <input type="range" min="30" max="800" value={Math.round(creatureScale*100)} onChange={e=>setCreatureScale(Number(e.target.value)/100)} style={{flex:1,accentColor:'#F5B84C',height:4}}/>
              <span style={{fontSize:28}}>{creature?.emoji}</span>
            </div>
            <button className="ob-cta ob-cta-amber" onClick={takePhoto}>Take the photo</button>
            <button style={{background:'none',border:'none',color:'rgba(255,255,255,.25)',fontSize:12,cursor:'pointer',marginTop:12,padding:'6px 0',width:'100%',textAlign:'center'}} onClick={() => setPhotoTaken(true)}>Skip for now →</button>
          </>
        ) : (
          <>
            <div className="ob-polaroid" style={{animation:'obPop .6s cubic-bezier(.34,1.56,.64,1),obFloat 4s ease-in-out .6s infinite'}}>
              <div className="ob-polaroid-img" style={photoDataUrl.current?{}:{background:`linear-gradient(145deg,${creature?.color||'#F5B84C'}15,#0a0820)`,flexDirection:'column',gap:8}}>
                {photoDataUrl.current ? <img src={photoDataUrl.current} alt="Family photo" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <><div style={{fontSize:60,animation:'obFloat 3s ease-in-out infinite'}}>{creature?.emoji}</div><div style={{fontFamily:"'Baloo 2',cursive",fontSize:14,color:`${creature?.color||'#F5B84C'}cc`,fontWeight:800}}>{creatureName}</div></>}
              </div>
              <div className="ob-polaroid-caption">Night 1 with {creatureName} ✨</div>
            </div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontStyle:'italic',color:'rgba(244,239,232,.45)',textAlign:'center',marginTop:10,lineHeight:1.6,animation:'obFadeIn .5s ease-out .8s both',opacity:0}}>Your first Night Card — saved forever.</div>
            <button className="ob-cta ob-cta-teal" onClick={next} style={{marginTop:12,animation:'obFadeIn .5s ease-out 1.2s both',opacity:0}}>Beautiful! Continue →</button>
          </>
        )}
        {backBtn}
      </div>
    </div>
  );

  // ── STEP 12 — Egg Surprise (merged: reveal + 7-night mechanic) ────────────
  if (step === 12) return (
    <div className="ob" style={{background:'radial-gradient(ellipse 130% 65% at 50% 0%,#080620 0%,#030312 50%,#020210 100%)'}}><style>{CSS}</style>{starField}{dots}
      <div className="ob-content" style={{paddingTop:24,display:'flex',flexDirection:'column',alignItems:'center'}}>
        {!eggRevealed ? (
          <>
            <div style={{position:'relative',marginBottom:16}}>
              <div style={{position:'absolute',inset:-25,borderRadius:'50%',background:`radial-gradient(circle,${creature?.color||'#F5B84C'}20,transparent 65%)`,animation:'obPulse 3s ease-in-out infinite'}}/>
              <div style={{fontSize:64,animation:'obFloat 3s ease-in-out infinite',filter:`drop-shadow(0 0 18px ${creature?.color||'#F5B84C'}55)`,position:'relative',zIndex:2}}>{creature?.emoji}</div>
            </div>
            <div className="ob-title" style={{fontSize:22}}>Your new friend has a gift!</div>
            <div className="ob-sub" style={{maxWidth:280}}>{creatureName} brought something special just for you...</div>
            <button className="ob-cta ob-cta-amber" onClick={() => setEggRevealed(true)}>What is it?!</button>
          </>
        ) : (
          <>
            {/* Confetti burst */}
            <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',zIndex:20}}>
              {Array.from({length:18},(_,i)=>(
                <div key={i} style={{position:'absolute',left:`${15+Math.random()*70}%`,top:'25%',width:8,height:8,borderRadius:i%3===0?'50%':'2px',background:['#F5B84C','#E8972A','#14d890','#F4EFE8','#b48cff','#5DCAA5'][i%6],animation:`obConfetti ${1.2+Math.random()*.8}s ease-out ${Math.random()*.4}s forwards`,transform:`rotate(${Math.random()*360}deg)`}}/>
              ))}
            </div>
            {/* Egg */}
            <div style={{position:'relative',marginBottom:16}}>
              <div style={{fontSize:96,animation:'obEggReveal .6s ease-out,obRock 2.5s ease-in-out .6s infinite',filter:'drop-shadow(0 0 24px rgba(245,184,76,.4))',position:'relative',zIndex:2}}>🥚</div>
            </div>
            <div className="ob-title" style={{fontSize:24,animation:'obFadeIn .5s ease-out .4s both',opacity:0}}>Another egg!</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontStyle:'italic',color:'rgba(244,239,232,.55)',lineHeight:1.7,textAlign:'center',margin:'8px 0 16px',padding:'0 8px',animation:'obFadeIn .5s ease-out .7s both',opacity:0}}>
              Nobody knows what's inside yet... but here's the secret:
            </div>
            <div style={{background:'rgba(245,184,76,.05)',border:'1.5px solid rgba(245,184,76,.14)',borderRadius:18,padding:'14px 16px',marginBottom:14,textAlign:'center',width:'100%',animation:'obFadeIn .5s ease-out 1s both',opacity:0}}>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:14,color:'rgba(244,239,232,.65)',lineHeight:1.65,fontStyle:'italic'}}>
                Every night you come back for the bedtime ritual, the egg cracks a little more. After <strong style={{color:'#F5B84C'}}>7 nights</strong> — it hatches into a brand new friend!
              </div>
            </div>
            {/* 7-egg progress */}
            <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:6,animation:'obFadeIn .5s ease-out 1.3s both',opacity:0}}>
              {Array.from({length:7},(_,i) => (
                <div key={i} style={{width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:i===0?13:12,background:i===0?'rgba(245,184,76,.15)':'rgba(245,184,76,.04)',border:i===0?'2px solid #F5B84C':'1.5px dashed rgba(245,184,76,.2)',boxShadow:i===0?'0 0 12px rgba(245,184,76,.3)':'none'}}>{i===0?'⭐':'🥚'}</div>
              ))}
            </div>
            <div style={{textAlign:'center',fontSize:10,fontFamily:"'DM Mono',monospace",color:'rgba(245,184,76,.5)',letterSpacing:'.06em',marginBottom:14,animation:'obFadeIn .5s ease-out 1.5s both',opacity:0}}>Night 1 of 7 ✦</div>
            <button className="ob-cta ob-cta-teal" onClick={next} style={{animation:'obFadeIn .5s ease-out 1.8s both',opacity:0}}>I'll be back tomorrow!</button>
          </>
        )}
        {backBtn}
      </div>
    </div>
  );

  // ── STEP 13 — Night 1 Complete Summary ────────────────────────────────────
  if (step === 13) return (
    <div className="ob ob-parent-bg"><style>{CSS}</style>{starField}{dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div className="ob-title-parent">Night 1 complete. ✦</div>
        <div className="ob-sub-parent">What you created tonight:</div>
        <div className="ob-polaroid" style={{marginBottom:16}}>
          <div className="ob-polaroid-img">
            {photoDataUrl.current ? <img src={photoDataUrl.current} alt="Family photo" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:50,opacity:.15}}>👨‍👧</span>}
          </div>
          <div className="ob-polaroid-caption">{childName} & {creatureName} · Night 1</div>
        </div>
        <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',borderRadius:16,padding:'16px 18px',marginBottom:14,textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:6}}>{creature?.emoji}</div>
          <div style={{fontFamily:"'Baloo 2',cursive",fontSize:18,fontWeight:800,color:creature?.color||'#F5B84C'}}>{creatureName}</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',fontStyle:'italic',marginTop:4}}>{personalityTags.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' · ')} · {creature?.name}</div>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontStyle:'italic',color:'rgba(244,239,232,.55)',lineHeight:1.6,marginTop:10}}>{creatureName} already knows {childName}.<br/>Every story starts here.</div>
        </div>
        {generatedStory && (
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            <div style={{flex:1,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)',borderRadius:12,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontSize:20,marginBottom:3}}>📖</div>
              <div style={{fontSize:9,fontWeight:700,color:'rgba(244,239,232,.5)'}}>First Story</div>
              <div style={{fontSize:8,color:'rgba(255,255,255,.25)',marginTop:2,fontStyle:'italic'}}>{generatedStory.title}</div>
            </div>
            <div style={{flex:1,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)',borderRadius:12,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontSize:20,marginBottom:3}}>🌙</div>
              <div style={{fontSize:9,fontWeight:700,color:'rgba(244,239,232,.5)'}}>Night Card</div>
              <div style={{fontSize:8,color:'rgba(255,255,255,.25)',marginTop:2,fontStyle:'italic'}}>{generatedStory.headline}</div>
            </div>
          </div>
        )}
        <button className="ob-cta ob-cta-teal" onClick={next}>Take us to SleepSeed ✦</button>
        {backBtn}
      </div>
    </div>
  );

  // ── STEP 14 — Complete (triggers onComplete via useEffect) ────────────────
  return (
    <div className="ob"><style>{CSS}</style>{starField}
      <div className="ob-content" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:48,animation:'obPulse 2s ease-in-out infinite',marginBottom:12}}>✨</div>
          <div className="ob-title">Setting up your world...</div>
        </div>
      </div>
    </div>
  );
}
