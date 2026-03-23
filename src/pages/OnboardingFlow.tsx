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
}

interface OnboardingFlowProps {
  onComplete: (result: OnboardingResult) => void;
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
@keyframes obRingFill{from{stroke-dashoffset:283}to{stroke-dashoffset:0}}
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
.ob-sub{font-size:14px;color:rgba(244,239,232,.45);text-align:center;line-height:1.6;margin-bottom:20px;font-weight:600}
.ob-title-parent{font-family:'Fraunces',serif;font-size:24px;font-weight:700;font-style:italic;text-align:center;line-height:1.35;margin-bottom:8px;color:#F5B84C}
.ob-sub-parent{font-size:13px;color:rgba(244,239,232,.35);text-align:center;line-height:1.6;margin-bottom:18px;font-style:italic}

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
.ob-cgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0 16px}
.ob-ccard{border-radius:16px;padding:10px 4px 8px;text-align:center;cursor:pointer;border:2px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);transition:all .25s}
.ob-ccard:hover{background:rgba(255,255,255,.06)}
.ob-ccard.on{border-color:var(--cc,#F5B84C);background:rgba(245,184,76,.08);transform:scale(1.06)}
.ob-ccard-emoji{font-size:32px;line-height:1;margin-bottom:4px}
.ob-ccard-name{font-size:9px;font-weight:800;color:rgba(255,255,255,.45);line-height:1.2}
.ob-ccard.on .ob-ccard-name{color:var(--cc,#F5B84C)}

/* preview bar */
.ob-preview{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);margin-bottom:12px;animation:obFadeIn .3s ease-out}
.ob-preview-emoji{font-size:36px;animation:obFloat 3s ease-in-out infinite}
.ob-preview-info{flex:1}
.ob-preview-name{font-family:'Baloo 2',cursive;font-size:15px;font-weight:800}
.ob-preview-desc{font-size:11px;color:rgba(255,255,255,.35);font-style:italic}

/* this or that */
.ob-tot-pair{display:flex;gap:12px;margin:16px 0}
.ob-tot-btn{flex:1;padding:20px 12px;border-radius:18px;border:2px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);cursor:pointer;text-align:center;transition:all .25s;font-family:'Baloo 2',cursive}
.ob-tot-btn:hover{background:rgba(255,255,255,.07)}
.ob-tot-btn:active{transform:scale(.95)}
.ob-tot-btn.on{border-color:#F5B84C;background:rgba(245,184,76,.1)}
.ob-tot-emoji{font-size:36px;margin-bottom:6px}
.ob-tot-label{font-size:16px;font-weight:800;color:rgba(244,239,232,.7)}
.ob-tot-btn.on .ob-tot-label{color:#F5B84C}

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
.ob-story-tap{font-size:11px;color:rgba(255,255,255,.2);font-weight:700}

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
.ob-polaroid-creature{position:absolute;z-index:2;line-height:1}
.ob-polaroid-caption{text-align:center;padding:8px 0 0;font-family:'Baloo 2',cursive;font-size:13px;color:#3a2810;font-weight:800}

/* dna card */
.ob-dna{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:14px 16px;margin:12px 0}
.ob-dna-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}
.ob-dna-row:last-child{margin-bottom:0}
.ob-dna-ico{font-size:18px;flex-shrink:0;margin-top:2px}
.ob-dna-label{font-size:9px;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:.06em;font-family:'DM Mono',monospace;margin-bottom:2px}
.ob-dna-val{font-size:13px;color:rgba(244,239,232,.6);line-height:1.5;font-style:italic}

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

// ── Story pages ─────────────────────────────────────────────────────────────

function storyPages(creatureEmoji:string, creatureName:string, childName:string) {
  return [
    {emoji:'🌙',text:`One quiet night, a small golden egg appeared at the foot of ${childName}'s bed. It was warm to the touch, and it hummed.`},
    {emoji:'🥚',text:`The egg rocked gently. A tiny crack appeared, glowing amber. Something inside was waking up.`},
    {emoji:creatureEmoji,text:`And then — a nose. Two bright eyes. A ${creatureName} tumbled out, looked straight at ${childName}, and smiled.`,tap:true},
    {emoji:'✨',text:`"I've been waiting for you," the ${creatureName} said. "Every night you tell a story, I grow a little stronger. Shall we begin?"`},
  ];
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useApp();
  const [step, setStep] = useState(0);

  // Step 1
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');

  // Step 2
  const [selectedCreatureId, setSelectedCreatureId] = useState('');

  // Step 3
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);
  const [totIdx, setTotIdx] = useState(0);

  // Step 4
  const [parentSecret, setParentSecret] = useState('');

  // Step 5
  const [storyPage, setStoryPage] = useState(0);

  // Step 6
  const [dreamAnswer, setDreamAnswer] = useState('');
  const [mood, setMood] = useState('');

  // Step 7
  const [holdProgress, setHoldProgress] = useState(0);
  const [hatched, setHatched] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setInterval>|null>(null);

  // Step 8
  const [photoTaken, setPhotoTaken] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [creatureName, setCreatureName] = useState('');
  const [creaturePos, setCreaturePos] = useState({xPct:50,yPct:50}); // percentage of viewfinder
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

  const creature = selectedCreatureId ? getCreature(selectedCreatureId) : null;

  const next = useCallback(() => setStep(s => s + 1), []);

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
        return p + 100/30; // 3 seconds at ~10ms intervals = 30 steps
      });
    }, 100);
  }, [hatched]);

  const stopHold = useCallback(() => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    if (!hatched) setHoldProgress(0);
  }, [hatched]);

  // Step 9: start camera — store stream, then setCameraReady triggers video render,
  // then a second effect hooks the stream to the <video> element once it exists.
  useEffect(() => {
    if (step !== 9 || photoTaken) return;
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

  // Step 8: once video element is rendered and stream is ready, hook them together
  useEffect(() => {
    if (!cameraReady || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [cameraReady]);

  // Step 8: drag creature in viewfinder
  const onCreatureDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragging(true);
    const rect = viewfinderRef.current?.getBoundingClientRect();
    if (!rect) return;
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

      // Pinch-to-resize with two fingers
      if ('touches' in e && e.touches.length >= 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (pinchStartDist.current === null) {
          pinchStartDist.current = dist;
          pinchStartScale.current = creatureScale;
        } else {
          const newScale = Math.max(0.3, pinchStartScale.current * (dist / pinchStartDist.current));
          setCreatureScale(newScale);
        }
        return;
      }

      pinchStartDist.current = null;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const xPct = ((clientX - rect.left) / rect.width) * 100;
      const yPct = ((clientY - rect.top) / rect.height) * 100;
      setCreaturePos({ xPct, yPct });
    };
    const onUp = () => { setDragging(false); pinchStartDist.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, creatureScale]);

  // Step 8: take photo — bakes creature emoji into the image at user's chosen position/scale
  const takePhoto = useCallback(() => {
    if (photoTaken) return;
    setShowFlash(true);

    if (videoRef.current && cameraReady) {
      try {
        const v = videoRef.current;
        const cw = v.videoWidth || 640;
        const ch = v.videoHeight || 480;
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw mirrored video frame (front camera is mirrored in the viewfinder)
          ctx.save();
          ctx.translate(cw, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(v, 0, 0, cw, ch);
          ctx.restore();

          // Draw creature emoji at user's chosen position and scale
          if (creature) {
            const fontSize = Math.round(48 * creatureScale * (cw / 400)); // scale relative to canvas
            ctx.font = `${fontSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Convert percentage position to canvas pixels
            const cx = (creaturePos.xPct / 100) * cw;
            const cy = (creaturePos.yPct / 100) * ch;
            ctx.fillText(creature.emoji, cx, cy);
          }

          photoDataUrl.current = canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (_) {}
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    setTimeout(() => {
      setShowFlash(false);
      setPhotoTaken(true);
      if (creature) {
        setCreatureName(creature.nameSuggestions[0] || 'Luna');
      }
    }, 400);
  }, [photoTaken, creature, cameraReady, creatureScale, creaturePos]);

  // Step 13: assemble and complete (fires after step 12 CTA)
  useEffect(() => {
    if (step !== 13 || !user || !creature) return;

    const charId = crypto.randomUUID?.() || uid();
    const character: Character = {
      id: charId,
      userId: user.id,
      name: childName,
      type: 'human',
      ageDescription: childAge,
      pronouns: 'she/her',
      personalityTags: personalityTags as PersonalityTag[],
      weirdDetail: parentSecret,
      currentSituation: '',
      photo: photoDataUrl.current,
      color: '#1E1640',
      emoji: '\u{1F9D2}',
      storyIds: [],
      isFamily: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const hatchedCreature: HatchedCreature = {
      id: crypto.randomUUID?.() || uid(),
      userId: user.id,
      characterId: character.id,
      name: creatureName,
      creatureType: creature.id,
      creatureEmoji: creature.emoji,
      color: creature.color,
      rarity: 'legendary',
      personalityTraits: personalityTags,
      dreamAnswer,
      parentSecret,
      photoUrl: photoDataUrl.current,
      weekNumber: 1,
      hatchedAt: new Date().toISOString(),
    };

    onComplete({ character, creature: hatchedCreature, dreamAnswer, photoDataUrl: photoDataUrl.current });
  }, [step]); // eslint-disable-line

  // ── Render helpers ─────────────────────────────────────────────────────────

  const dots = (
    <div className="ob-dots">
      {Array.from({length:13},(_,i) => (
        <div key={i} className={`ob-dot ${i<step?'ob-dot-done':i===step?'ob-dot-cur':'ob-dot-future'}`}/>
      ))}
    </div>
  );

  const starField = (
    <>
      {STARS.map(s => (
        <div key={s.id} className={s.t===1?'ob-star':'ob-star2'}
          style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':s.d,'--dl':s.dl} as any}/>
      ))}
    </>
  );

  // ── Steps ──────────────────────────────────────────────────────────────────

  // Step 0 — Egg Arrives
  if (step === 0) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      {dots}
      <div className="ob-content" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'70vh'}}>
        <div style={{fontSize:100,animation:'obPulse 2.5s ease-in-out infinite,obRock 2.2s ease-in-out infinite',marginBottom:20,cursor:'pointer'}}
          onClick={next}>
          🥚
        </div>
        <div className="ob-title">Something has arrived...</div>
        <div className="ob-sub">A golden egg appeared tonight. It's warm, and it's humming.</div>
        <button className="ob-cta ob-cta-amber" onClick={next}>
          Touch the egg
        </button>
      </div>
    </div>
  );

  // Step 1 — Your Name
  if (step === 1) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      {dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div className="ob-title">Who is this egg for?</div>
        <div className="ob-sub">Tell us about the child who'll become the hero of every story.</div>
        <input className="ob-input" placeholder="Child's first name" value={childName}
          onChange={e => setChildName(e.target.value)} autoFocus />
        <div className="ob-ages">
          {['4-5','5-6','7-8','9-10','11+'].map(a => (
            <div key={a} className={`ob-age${childAge===a?' on':''}`}
              onClick={() => setChildAge(a)}>{a}</div>
          ))}
        </div>
        <button className="ob-cta ob-cta-amber" disabled={childName.length<2}
          onClick={next}>
          Next
        </button>
      </div>
    </div>
  );

  // Step 2 — Pick Your Animal
  if (step === 2) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      {dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div className="ob-title">Who's inside the egg?</div>
        <div className="ob-sub">Pick a creature to hatch. Choose the one that feels right.</div>
        {creature && (
          <div className="ob-preview">
            <div className="ob-preview-emoji">{creature.emoji}</div>
            <div className="ob-preview-info">
              <div className="ob-preview-name" style={{color:creature.color}}>{creature.name}</div>
              <div className="ob-preview-desc">{creature.description}</div>
            </div>
          </div>
        )}
        <div className="ob-cgrid">
          {CREATURES.map(c => (
            <div key={c.id} className={`ob-ccard${selectedCreatureId===c.id?' on':''}`}
              style={{'--cc':c.color} as any}
              onClick={() => setSelectedCreatureId(c.id)}>
              <div className="ob-ccard-emoji">{c.emoji}</div>
              <div className="ob-ccard-name">{c.name}</div>
            </div>
          ))}
        </div>
        <button className="ob-cta ob-cta-amber" disabled={!selectedCreatureId}
          onClick={next}>
          This one!
        </button>
      </div>
    </div>
  );

  // Step 3 — This or That
  if (step === 3) {
    const pair = TOT_PAIRS[totIdx];
    if (!pair) { setStep(4); return null; }
    return (
      <div className="ob">
        <style>{CSS}</style>
        {starField}
        {dots}
        <div className="ob-content" style={{paddingTop:20}}>
          <div className="ob-title">
            {childName} is more...
          </div>
          <div className="ob-sub">Tap the one that fits best. ({totIdx+1} of 3)</div>
          <div className="ob-tot-pair">
            {pair.map((opt,oi) => (
              <div key={oi} className="ob-tot-btn" onClick={() => {
                setPersonalityTags(prev => [...prev, opt.tag]);
                if (totIdx >= 2) {
                  setTimeout(() => setStep(4), 300);
                } else {
                  setTotIdx(totIdx + 1);
                }
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

  // Step 4 — Parent's Secret
  if (step === 4) return (
    <div className="ob ob-parent-bg">
      <style>{CSS}</style>
      {starField}
      {dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div className="ob-title-parent">Now, a quiet question just for you.</div>
        <div className="ob-sub-parent">
          What's something about {childName} that only you know? The thing that makes you smile when they're not looking.
        </div>
        <textarea className="ob-textarea" placeholder="She talks to her stuffed animals when she thinks nobody is listening..."
          value={parentSecret} onChange={e => setParentSecret(e.target.value)} rows={4} />
        <div className="ob-chips">
          {SECRET_EXAMPLES.map((ex,i) => (
            <div key={i} className="ob-chip" onClick={() => setParentSecret(ex)}>{ex.slice(0,40)}...</div>
          ))}
        </div>
        <button className="ob-cta ob-cta-amber" disabled={parentSecret.length<5}
          onClick={next}>
          Keep this safe
        </button>
      </div>
    </div>
  );

  // Step 5 — The Story
  if (step === 5) {
    const pages = storyPages(creature?.emoji||'🥚', creature?.name||'creature', childName);
    const pg = pages[storyPage];
    return (
      <div className="ob">
        <style>{CSS}</style>
        {starField}
        {dots}
        <div className="ob-content" style={{paddingTop:20}}>
          <div className="ob-story-page" key={storyPage}>
            <div className="ob-story-emoji" onClick={() => {
              if (pg?.tap) {
                // egg tap interaction on page 3
              }
            }}>{pg?.emoji}</div>
            <div className="ob-story-text">{pg?.text}</div>
            <div className="ob-story-tap">
              {storyPage < pages.length - 1 ? 'tap to continue' : ''}
            </div>
          </div>
          {storyPage < pages.length - 1 ? (
            <button className="ob-cta ob-cta-amber" onClick={() => setStoryPage(storyPage+1)}>
              Continue
            </button>
          ) : (
            <button className="ob-cta ob-cta-amber" onClick={next}>
              What happens next?
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 6 — Night Card
  if (step === 6) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      {dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div className="ob-title">
          The first night card
        </div>
        <div className="ob-sub">
          What do you think {creature?.name || 'your creature'} dreams about on their very first night?
        </div>
        <textarea className="ob-textarea" placeholder={`${creature?.name || 'They'} dream about...`}
          value={dreamAnswer} onChange={e => setDreamAnswer(e.target.value)} rows={3} />
        <div style={{fontSize:12,color:'rgba(255,255,255,.3)',textAlign:'center',marginTop:14,marginBottom:4,fontWeight:700}}>How does tonight feel?</div>
        <div className="ob-moods">
          {[{e:'🌙',l:'Calm'},{e:'😊',l:'Happy'},{e:'🥺',l:'Tender'},{e:'✨',l:'Magical'}].map(m => (
            <div key={m.e} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div className={`ob-mood${mood===m.e?' on':''}`}
                onClick={() => setMood(m.e)}>{m.e}</div>
              <div style={{fontSize:9,color:mood===m.e?'rgba(245,184,76,.7)':'rgba(255,255,255,.2)',fontWeight:700}}>{m.l}</div>
            </div>
          ))}
        </div>
        <button className="ob-cta ob-cta-amber" disabled={dreamAnswer.length<3}
          onClick={next}>
          Save this memory
        </button>
      </div>
    </div>
  );

  // Step 7 — Hold to Hatch
  if (step === 7) {
    const dashoffset = 283 - (283 * holdProgress / 100);
    return (
      <div className="ob">
        <style>{CSS}</style>
        {starField}
        {dots}
        <div className="ob-content" style={{paddingTop:20}}>
          {!hatched ? (
            <>
              <div className="ob-title">Time to hatch</div>
              <div className="ob-sub">Hold the egg until it cracks open.</div>
              <div className="ob-hold-wrap">
                <div className="ob-hold-ring"
                  onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold}
                  onTouchStart={startHold} onTouchEnd={stopHold}>
                  <svg viewBox="0 0 100 100">
                    <circle className="ob-hold-ring-bg" cx="50" cy="50" r="45"/>
                    <circle className="ob-hold-ring-fill" cx="50" cy="50" r="45"
                      style={{strokeDashoffset:dashoffset}}/>
                  </svg>
                  <div className="ob-hold-emoji">🥚</div>
                </div>
                <div className="ob-hold-label">Hold to hatch...</div>
              </div>
            </>
          ) : (
            <div className="ob-hatch-celeb">
              <div className="ob-hatch-emoji">{creature?.emoji}</div>
              <div className="ob-hatch-name" style={{color:creature?.color}}>
                {creature?.name} has arrived!
              </div>
              <div className="ob-sub">Your creature is here. What will you call them?</div>
              <button className="ob-cta ob-cta-teal" onClick={next}>
                Name your creature
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── STEP 8 — Naming ──────────────────────────────────────────────────────
  if (step === 8) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      {dots}
      <div className="ob-content" style={{paddingTop:20,display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div style={{fontSize:80,animation:'obFloat 3s ease-in-out infinite',filter:`drop-shadow(0 6px 24px ${creature?.color||'#F5B84C'}50)`,marginBottom:16}}>
          {creature?.emoji}
        </div>
        <div className="ob-title" style={{fontSize:30,color:'#F5B84C'}}>What's their name?</div>
        <div className="ob-sub">{childName} gets to choose.</div>
        <input className="ob-input" style={{textAlign:'center',fontSize:22}} placeholder="Type a name..."
          value={creatureName} onChange={e => setCreatureName(e.target.value)} autoFocus />
        {creature && (
          <div className="ob-chips" style={{marginTop:10,justifyContent:'center'}}>
            {creature.nameSuggestions.map(n => (
              <div key={n} className={`ob-chip${creatureName===n?' on':''}`}
                onClick={() => setCreatureName(n)}>{n}</div>
            ))}
          </div>
        )}
        <button className="ob-cta ob-cta-amber" disabled={creatureName.length<2}
          onClick={next} style={{marginTop:20}}>
          That's their name! →
        </button>
      </div>
    </div>
  );

  // ── STEP 9 — Photo Together ────────────────────────────────────────────────
  if (step === 9) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      {dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div className="ob-title">Photo with {creatureName}!</div>
        <div className="ob-sub">Position {creatureName} in the frame, then take the photo.</div>

        {!photoTaken ? (
          <>
          <div className="ob-viewfinder" ref={viewfinderRef}
            onWheel={e=>{e.preventDefault();setCreatureScale(s=>Math.max(0.3,s-(e.deltaY*0.002)));}}>
            {cameraReady ? (
              <video ref={videoRef} autoPlay playsInline muted
                style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)'}}/>
            ) : (
              <div className="ob-vf-silhouette">{cameraFailed ? '📷' : '...'}</div>
            )}
            <div className="ob-vf-creature"
              style={{left:`${creaturePos.xPct}%`,top:`${creaturePos.yPct}%`,transform:'translate(-50%,-50%)',fontSize:Math.round(48*creatureScale),cursor:dragging?'grabbing':'grab'}}
              onMouseDown={onCreatureDragStart}
              onTouchStart={onCreatureDragStart}>
              {creature?.emoji}
            </div>
            {showFlash && <div className="ob-vf-flash"/>}
            {cameraReady && !dragging && (
              <div style={{position:'absolute',bottom:16,left:0,right:0,textAlign:'center',fontSize:11,color:'rgba(255,255,255,.4)',fontWeight:700,zIndex:6}}>
                Drag to position · pinch or slider to resize
              </div>
            )}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,margin:'6px 0 10px',padding:'0 4px'}}>
            <span style={{fontSize:14}}>{creature?.emoji}</span>
            <input type="range" min="30" max="800" value={Math.round(creatureScale*100)}
              onChange={e=>setCreatureScale(Number(e.target.value)/100)}
              style={{flex:1,accentColor:'#F5B84C',height:4}}/>
            <span style={{fontSize:28}}>{creature?.emoji}</span>
          </div>
          <button className="ob-cta ob-cta-amber" onClick={takePhoto}>
            📸 Take the photo
          </button>
          </>
        ) : (
          <>
            <div className="ob-polaroid">
              <div className="ob-polaroid-img">
                {photoDataUrl.current ? (
                  <img src={photoDataUrl.current} alt="Family photo"
                    style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                ) : (
                  <span style={{fontSize:50,opacity:.15}}>👨‍👧</span>
                )}
              </div>
              <div className="ob-polaroid-caption">Night 1 with {creatureName} ✨</div>
            </div>
            <button className="ob-cta ob-cta-teal" onClick={next} style={{marginTop:12}}>
              Beautiful! Continue →
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ── STEP 10 — The Ritual Explained ─────────────────────────────────────────
  if (step === 10) return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      {dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div style={{textAlign:'center',marginBottom:16}}>
          <div style={{fontSize:64,animation:'obFloat 3s ease-in-out infinite',filter:`drop-shadow(0 4px 18px ${creature?.color||'#F5B84C'}45)`,display:'inline-block'}}>
            {creature?.emoji}
          </div>
        </div>

        {/* speech bubble */}
        <div style={{background:'rgba(255,255,255,.04)',border:'1.5px solid rgba(255,255,255,.08)',borderRadius:18,padding:'16px 18px',marginBottom:20,position:'relative'}}>
          <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",letterSpacing:'.08em',textTransform:'uppercase',color:'rgba(245,184,76,.5)',marginBottom:8}}>
            {creatureName} says:
          </div>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontStyle:'italic',color:'rgba(244,239,232,.75)',lineHeight:1.65}}>
            "Come back every night and I'll find you a new friend. Each time you do the ritual, the egg cracks a little more. Seven nights… and something new hatches. 🥚"
          </div>
        </div>

        {/* egg progress row */}
        <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:8}}>
          {Array.from({length:7},(_,i) => (
            <div key={i} style={{
              width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,
              background:i===0?'rgba(245,184,76,.15)':'rgba(255,255,255,.03)',
              border:i===0?'2px solid #F5B84C':'1.5px solid rgba(255,255,255,.06)',
              boxShadow:i===0?'0 0 12px rgba(245,184,76,.3)':'none',
              opacity:i===0?1:.25,
            }}>
              {i===0?'⭐':'🥚'}
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',fontSize:10,fontFamily:"'DM Mono',monospace",color:'rgba(245,184,76,.5)',letterSpacing:'.06em',marginBottom:16}}>
          Night 1 of 7 ✦
        </div>

        <div style={{textAlign:'center',fontFamily:"'Fraunces',serif",fontSize:14,fontStyle:'italic',color:'rgba(244,239,232,.35)',lineHeight:1.6,marginBottom:8}}>
          Every night you come back, the egg remembers.
        </div>

        <button className="ob-cta ob-cta-amber" onClick={next}>
          Show me the new egg! →
        </button>
      </div>
    </div>
  );

  // ── STEP 11 — Week 2 Egg Reveal ───────────────────────────────────────────
  if (step === 11) return (
    <div className="ob" style={{background:'radial-gradient(ellipse 130% 65% at 50% 0%,#080620 0%,#030312 50%,#020210 100%)'}}>
      <style>{CSS}</style>
      {starField}
      {dots}
      <div className="ob-content" style={{paddingTop:24,display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(245,184,76,.6)',marginBottom:16}}>
          ✦ a new egg appeared
        </div>

        {/* egg with sparkles */}
        <div style={{position:'relative',marginBottom:20}}>
          {/* sparkle particles — CSS only */}
          {[{t:12,l:20,s:4,d:'2.2s',dl:'0s'},{t:8,l:75,s:3,d:'2.8s',dl:'.4s'},{t:45,l:10,s:3,d:'2.5s',dl:'.8s'},{t:40,l:85,s:4,d:'3s',dl:'.2s'},{t:65,l:30,s:3,d:'2.4s',dl:'1.2s'},{t:60,l:70,s:3,d:'2.7s',dl:'.6s'}].map((p,i) => (
            <div key={i} style={{position:'absolute',top:`${p.t}%`,left:`${p.l}%`,width:p.s,height:p.s,borderRadius:'50%',background:'#F5B84C',animation:`obTwk ${p.d} ${p.dl} ease-in-out infinite`,pointerEvents:'none'}}/>
          ))}
          <div style={{fontSize:88,animation:'obRock 2.5s ease-in-out infinite',filter:'drop-shadow(0 0 20px rgba(245,184,76,.35))',position:'relative',zIndex:2}}>
            🥚
          </div>
        </div>

        <div className="ob-title" style={{fontSize:28}}>Something is already waiting inside…</div>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontStyle:'italic',color:'rgba(244,239,232,.4)',lineHeight:1.65,textAlign:'center',margin:'8px 0 20px',padding:'0 12px'}}>
          It appeared the moment {creatureName} hatched.<br/>Come back tomorrow night to crack it further.
        </div>

        {/* mystery silhouette — CSS only */}
        <div style={{position:'relative',width:100,height:100,margin:'0 auto 16px'}}>
          <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(circle,rgba(180,140,255,.12),rgba(100,80,200,.04),transparent 70%)',filter:'blur(12px)'}}/>
          <div style={{position:'absolute',inset:'15%',borderRadius:'50%',background:'radial-gradient(circle,rgba(245,184,76,.08),transparent 70%)',filter:'blur(8px)',animation:'obPulse 4s ease-in-out infinite'}}/>
        </div>
        <div style={{fontSize:12,color:'rgba(255,255,255,.2)',fontStyle:'italic',marginBottom:16}}>What could it be…?</div>

        <button className="ob-cta ob-cta-teal" onClick={next}>
          I'll be back tomorrow 🌙
        </button>
      </div>
    </div>
  );

  // ── STEP 12 — Parent's Quiet Moment ────────────────────────────────────────
  if (step === 12) return (
    <div className="ob ob-parent-bg">
      <style>{CSS}</style>
      {starField}
      {dots}
      <div className="ob-content" style={{paddingTop:20}}>
        <div className="ob-title-parent">A quiet moment, just for you.</div>
        <div className="ob-sub-parent">
          Here's what tonight created.
        </div>

        <div className="ob-polaroid" style={{marginBottom:16}}>
          <div className="ob-polaroid-img">
            {photoDataUrl.current ? (
              <img src={photoDataUrl.current} alt="Family photo"
                style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            ) : (
              <span style={{fontSize:50,opacity:.15}}>👨‍👧</span>
            )}
          </div>
          <div className="ob-polaroid-caption">{childName} & {creatureName}</div>
        </div>

        <div className="ob-dna">
          <div className="ob-dna-row">
            <div className="ob-dna-ico">💭</div>
            <div>
              <div className="ob-dna-label">First dream</div>
              <div className="ob-dna-val">"{dreamAnswer}"</div>
            </div>
          </div>
          <div className="ob-dna-row">
            <div className="ob-dna-ico">✨</div>
            <div>
              <div className="ob-dna-label">Personality</div>
              <div className="ob-dna-val">{personalityTags.join(', ')}</div>
            </div>
          </div>
          <div className="ob-dna-row">
            <div className="ob-dna-ico">🤫</div>
            <div>
              <div className="ob-dna-label">Parent's secret</div>
              <div className="ob-dna-val">"{parentSecret}"</div>
            </div>
          </div>
        </div>

        <div style={{textAlign:'center',margin:'16px 0 8px'}}>
          <div style={{fontSize:11,color:'rgba(245,184,76,.4)',fontFamily:"'DM Mono',monospace",letterSpacing:'.08em',textTransform:'uppercase',marginBottom:4}}>
            Night card quote
          </div>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:15,fontStyle:'italic',color:'rgba(244,239,232,.5)',lineHeight:1.6}}>
            "{dreamAnswer}"
          </div>
        </div>

        <button className="ob-cta ob-cta-amber" onClick={next}>
          Take us to SleepSeed
        </button>
      </div>
    </div>
  );

  // ── STEP 13 — triggers onComplete via useEffect ────────────────────────────
  return (
    <div className="ob">
      <style>{CSS}</style>
      {starField}
      <div className="ob-content" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:48,animation:'obPulse 2s ease-in-out infinite',marginBottom:12}}>✨</div>
          <div className="ob-title">Setting up your world...</div>
        </div>
      </div>
    </div>
  );
}
