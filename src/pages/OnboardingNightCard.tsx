import { useState, useRef, useCallback } from 'react';
import { useApp } from '../AppContext';
import { saveNightCard } from '../lib/storage';

// ── helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

// ── Claude API call for Night 0 card ─────────────────────────────────────────
async function generateNight0Card(parentNote: string, mood: string): Promise<{
  headline: string; quote: string; memory_line: string; whisper: string; emoji: string;
}> {
  const prompt = `You are writing the very first Night Card for a parent who just joined SleepSeed — a bedtime ritual app that captures moments with their child through personalised stories and Night Cards.

The parent wrote: "${parentNote || 'Nothing specific — they just started.'}"
Their mood tonight: "${mood || 'not stated'}"

Write their Night 0 card — the "where it began" card. This is not about a story. It is about this parent, this moment, this decision to show up for their child differently.

Respond ONLY with valid JSON, no markdown:
{
  "headline": "A short, warm, memorable headline. 3–6 words. E.g. 'The night it began.' or 'Something started tonight.'",
  "quote": "A single sentence (12–20 words) that feels like it captures the parent's note or spirit of this moment. If they wrote nothing, make it universal and true. Use 'she' as the default pronoun.",
  "memory_line": "One sentence (10–16 words) that feels like a gift to their future self — something they'll feel when they read this card a year from now.",
  "whisper": "One line (8–14 words) the parent can whisper to themselves before closing their eyes tonight. Warm, intimate, true.",
  "emoji": "One emoji that feels right for this card. Prefer: 🌱 ✦ 🌙 🌟 💛 ✨"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map((b: any) => b.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      headline:    parsed.headline    || 'The night it began.',
      quote:       parsed.quote       || 'She found something worth returning to.',
      memory_line: parsed.memory_line || 'A small thing, planted on an ordinary night.',
      whisper:     parsed.whisper     || 'Something you started tonight will matter more than you know.',
      emoji:       parsed.emoji       || '🌱',
    };
  } catch (_) {
    return {
      headline:    'The night it began.',
      quote:       'She found something worth returning to, on an ordinary evening.',
      memory_line: 'A small seed, planted on a night she almost didn\'t start.',
      whisper:     'Something you started tonight will matter more than you know.',
      emoji:       '🌱',
    };
  }
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&family=Kalam:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--amber:#E8972A;--amber2:#F5B84C;--teal:#1D9E75;--teal2:#5DCAA5;--cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.nc0{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;position:relative;overflow:hidden}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.45}}
@keyframes twk2{0%,100%{opacity:.2}60%{opacity:.04}}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes star-pop{0%{transform:scale(0) rotate(-180deg);opacity:0}60%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes polaroid-in{0%{transform:rotate(-4deg) scale(.82);opacity:0}60%{transform:rotate(1.2deg) scale(1.03)}100%{transform:rotate(-1.5deg) scale(1);opacity:1}}
@keyframes confetti-fall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(120px) rotate(400deg);opacity:0}}
@keyframes moon-pulse{0%,100%{box-shadow:0 0 18px rgba(245,184,76,.2)}50%{box-shadow:0 0 32px rgba(245,184,76,.38)}}
@keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}
.nc0-star{position:fixed;border-radius:50%;background:#EEE8FF;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.nc0-star2{position:fixed;border-radius:50%;background:#C8C0B0;animation:twk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.nc0-sky{position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg,#030712 0%,#080C18 55%);z-index:0;pointer-events:none}

/* ── CREATION SCREEN ── */
.nc0-create{flex:1;overflow-y:auto;padding:24px 24px 96px;position:relative;z-index:5;max-width:480px;margin:0 auto;width:100%}
.nc0-create::-webkit-scrollbar{display:none}
.nc0-header{text-align:center;margin-bottom:22px}
.nc0-moon{width:46px;height:46px;border-radius:50%;background:var(--amber2);position:relative;overflow:hidden;margin:0 auto 14px;animation:moon-pulse 3s ease-in-out infinite}
.nc0-moon-sh{position:absolute;width:44px;height:44px;border-radius:50%;background:#030712;top:-6px;left:-9px}
.nc0-title{font-family:var(--serif);font-size:clamp(19px,4vw,24px);color:var(--cream);font-weight:700;margin-bottom:7px;line-height:1.35}
.nc0-title em{color:var(--amber2);font-style:italic}
.nc0-sub{font-size:12px;color:rgba(244,239,232,.72);line-height:1.65;max-width:320px;margin:0 auto;font-weight:300}
.nc0-input-card{background:rgba(10,14,28,.98);border:.5px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden;margin-bottom:14px}
.nc0-input-lbl{padding:10px 14px 0;font-size:8px;color:var(--muted);font-family:var(--mono);letter-spacing:.05em;text-transform:uppercase}
.nc0-textarea{width:100%;background:transparent;border:none;outline:none;padding:8px 14px 14px;color:var(--cream);font-size:13.5px;font-family:var(--sans);resize:none;line-height:1.75;min-height:88px}
.nc0-textarea::placeholder{color:rgba(200,191,176,.45);font-style:italic;font-size:12.5px;line-height:1.7}
.nc0-sec-lbl{font-size:8.5px;letter-spacing:.07em;color:rgba(255,255,255,.45);font-weight:600;text-transform:uppercase;font-family:var(--mono);margin-bottom:9px}
.nc0-moods{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.nc0-mood{border-radius:20px;padding:6px 12px;font-size:11px;cursor:pointer;transition:all .18s;border:.5px solid rgba(255,255,255,.07);background:rgba(8,12,24,.9);color:#5A6280;display:flex;align-items:center;gap:5px;font-family:var(--sans)}
.nc0-mood.on{border-color:var(--amber);background:rgba(232,151,42,.1);color:var(--amber2)}
.nc0-mood:hover:not(.on){border-color:rgba(232,151,42,.22);color:var(--dim)}
.nc0-mood-icon{font-size:13px;line-height:1}
.nc0-mood-word{font-size:10.5px;font-weight:500}
.nc0-photo-btn{width:100%;background:rgba(255,255,255,.017);border:.5px solid rgba(255,255,255,.06);border-radius:11px;padding:12px;font-size:12px;color:rgba(255,255,255,.28);cursor:pointer;font-family:var(--sans);display:flex;align-items:center;justify-content:center;gap:8px;transition:all .18s;margin-bottom:5px}
.nc0-photo-btn:hover{background:rgba(255,255,255,.04);color:rgba(255,255,255,.45)}
.nc0-photo-skip{font-size:10px;color:#2A3050;text-align:center;cursor:pointer;font-family:var(--sans);background:none;border:none;width:100%;padding:3px 0;transition:color .15s}
.nc0-photo-skip:hover{color:#4A5270}
.nc0-gen-btn-wrap{position:fixed;bottom:0;left:0;right:0;padding:12px 24px 18px;background:linear-gradient(0deg,#080C18 72%,transparent);z-index:20}
.nc0-gen-btn{width:100%;max-width:480px;margin:0 auto;display:flex;background:linear-gradient(135deg,#E8972A,#CC7818);border:none;border-radius:14px;padding:15px;font-size:14.5px;font-weight:600;color:#120800;cursor:pointer;font-family:var(--sans);align-items:center;justify-content:center;gap:7px;letter-spacing:.01em;transition:filter .2s,transform .15s}
.nc0-gen-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
.nc0-gen-btn:disabled{opacity:.45;cursor:default;transform:none;filter:none}

/* ── GENERATING SCREEN ── */
.nc0-generating{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;position:relative;z-index:5}
.nc0-gen-moon{width:52px;height:52px;border-radius:50%;background:var(--amber2);position:relative;overflow:hidden;margin:0 auto 16px;animation:moon-pulse 2s ease-in-out infinite}
.nc0-gen-moon-sh{position:absolute;width:50px;height:50px;border-radius:50%;background:#030712;top:-7px;left:-10px}
.nc0-gen-dots{display:flex;gap:8px;justify-content:center;margin-bottom:14px}
.nc0-gdot{width:7px;height:7px;border-radius:50%;background:var(--amber);animation:shimmer 1s ease-in-out infinite}
.nc0-gdot:nth-child(2){animation-delay:.2s}
.nc0-gdot:nth-child(3){animation-delay:.4s}
.nc0-gen-msg{font-family:var(--serif);font-size:16px;color:var(--dim);font-style:italic;margin-bottom:6px}
.nc0-gen-sub{font-size:10px;color:var(--muted);font-family:var(--mono)}

/* ── REVEAL SCREEN ── */
.nc0-reveal{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;position:relative;z-index:5;max-width:480px;margin:0 auto;width:100%;overflow-y:auto}
.nc0-reveal::-webkit-scrollbar{display:none}
.nc0-reveal-star{font-size:44px;color:#D4A028;display:block;text-align:center;margin-bottom:16px;animation:star-pop .65s cubic-bezier(.34,1.56,.64,1) .3s both}
.nc0-polaroid{background:#F4EFE2;border-radius:3px;padding:12px 12px 30px;box-shadow:0 14px 48px rgba(0,0,0,.75);animation:polaroid-in .65s cubic-bezier(.34,1.26,.64,1) .5s both;transform:rotate(-1.5deg);margin-bottom:18px;width:min(220px,80vw)}
.nc0-pol-img{width:100%;aspect-ratio:4/3;background:linear-gradient(135deg,#0A0D1A,#141030);border-radius:2px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.nc0-pol-img-moon{width:38px;height:38px;border-radius:50%;background:var(--amber2);position:relative;overflow:hidden}
.nc0-pol-img-moon-sh{position:absolute;width:36px;height:36px;border-radius:50%;background:#0A0D1A;top:-5px;left:-8px}
.nc0-pol-img-photo{width:100%;height:100%;object-fit:cover;display:block;border-radius:2px}
.nc0-pol-sparkle{position:absolute;font-size:10px;color:rgba(245,184,76,.6)}
.nc0-pol-body{padding:9px 4px 0}
.nc0-pol-origin{font-size:7.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(232,151,42,.7);margin-bottom:4px;display:flex;align-items:center;gap:4px}
.nc0-pol-origin-dot{width:4px;height:4px;border-radius:50%;background:rgba(232,151,42,.7)}
.nc0-pol-headline{font-family:Georgia,serif;font-size:12.5px;font-weight:700;color:#2A1A00;margin-bottom:4px;line-height:1.3}
.nc0-pol-quote{font-family:Georgia,serif;font-size:10px;color:#4A3000;font-style:italic;line-height:1.55;margin-bottom:6px}
.nc0-pol-memory{font-family:'Kalam',Georgia,serif;font-size:9.5px;color:#6A4800;font-style:italic;line-height:1.45;padding-top:6px;border-top:1px solid rgba(0,0,0,.08);margin-top:2px;margin-bottom:6px}
.nc0-pol-meta{display:flex;justify-content:space-between;font-family:monospace;font-size:7px;color:rgba(74,48,0,.45)}
.nc0-reveal-msg{font-family:var(--serif);font-size:14px;color:rgba(244,239,232,.6);font-style:italic;text-align:center;line-height:1.65;margin-bottom:16px;animation:fadein .5s ease-out 1.1s both;opacity:0}
.nc0-whisper-card{background:rgba(232,151,42,.05);border:.5px solid rgba(232,151,42,.18);border-radius:12px;padding:12px 16px;text-align:center;margin-bottom:18px;width:100%;animation:fadein .5s ease-out 1.3s both;opacity:0}
.nc0-whisper-lbl{font-size:7.5px;letter-spacing:.07em;color:rgba(232,151,42,.5);font-family:var(--mono);text-transform:uppercase;margin-bottom:5px}
.nc0-whisper-txt{font-family:var(--serif);font-size:13px;color:var(--cream);font-style:italic;line-height:1.65}
.nc0-done-btn{width:100%;background:rgba(29,158,117,.14);border:1px solid rgba(29,158,117,.28);border-radius:13px;padding:14px;font-size:13.5px;font-weight:600;color:var(--teal2);cursor:pointer;font-family:var(--sans);animation:fadein .5s ease-out 1.5s both;opacity:0;transition:filter .2s}
.nc0-done-btn:hover{filter:brightness(1.1)}

/* confetti */
.nc0-confetti{position:fixed;width:7px;height:7px;border-radius:1px;animation:confetti-fall var(--cd,1.5s) ease-out var(--cdl,0s) forwards;pointer-events:none;z-index:30}
`;

const MOODS = [
  { icon: '✨', word: 'hopeful'     },
  { icon: '😴', word: 'tired'       },
  { icon: '🦁', word: 'excited'     },
  { icon: '💛', word: 'grateful'    },
  { icon: '🌊', word: 'overwhelmed' },
  { icon: '🌙', word: 'peaceful'    },
];

const CONFETTI_COLORS = ['#F5B84C','#E8972A','#5DCAA5','#F4EFE8','#C8A028','#1D9E75'];

const STARS = Array.from({ length: 24 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 55,
  size: Math.random() < .4 ? 3 : 2,
  d: (2.5 + Math.random() * 2.5).toFixed(1) + 's',
  dl: (Math.random() * 3).toFixed(1) + 's',
  t: Math.random() < .5 ? 1 : 2,
}));

type Phase = 'create' | 'generating' | 'reveal';

export default function OnboardingNightCard() {
  const { user, setView } = useApp();

  const [phase,      setPhase]      = useState<Phase>('create');
  const [note,       setNote]       = useState('');
  const [mood,       setMood]       = useState('');
  const [photo,      setPhoto]      = useState<string | null>(null);
  const [card,       setCard]       = useState<{
    headline: string; quote: string; memory_line: string; whisper: string; emoji: string;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 50);
    } catch {
      // Camera not available — fall back to file input with capture
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'user';
      inp.onchange = (e: any) => {
        const f = e.target?.files?.[0]; if (!f) return;
        const r = new FileReader(); r.onload = ev => setPhoto(ev.target?.result as string); r.readAsDataURL(f);
      };
      inp.click();
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    const scale = Math.min(640 / video.videoWidth, 640 / video.videoHeight, 1);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, canvas.width, canvas.height); }
    setPhoto(canvas.toDataURL('image/jpeg', 0.82));
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  function spawnConfetti() {
    const container = document.getElementById('nc0-confetti-root');
    if (!container) return;
    for (let i = 0; i < 22; i++) {
      const el = document.createElement('div');
      el.className = 'nc0-confetti';
      el.style.cssText = `background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};left:${20 + Math.random() * 60}%;top:20%;--cd:${1.2 + Math.random() * .8}s;--cdl:${Math.random() * .5}s;transform:rotate(${Math.random() * 360}deg)`;
      container.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }
  }

  async function handleCreate() {
    if (!user) return;
    setPhase('generating');

    const result = await generateNight0Card(note, mood);
    setCard(result);

    // Save to database
    const cardId = uid();
    try {
      await saveNightCard({
        id: cardId,
        userId: user.id,
        heroName: user.displayName || 'You',
        storyTitle: 'Night 0',
        characterIds: [],
        headline: result.headline,
        quote: result.quote,
        memory_line: result.memory_line,
        bondingQuestion: 'What was happening in your world tonight?',
        bondingAnswer: note || '',
        extra: mood ? `Feeling: ${mood}` : undefined,
        photo: photo || undefined,
        emoji: result.emoji,
        date: new Date().toISOString(),
        isOrigin: true,
        whisper: result.whisper,
      });
    } catch (e) {
      console.error('Failed to save Night 0 card:', e);
    }

    setPhase('reveal');
    setTimeout(spawnConfetti, 600);
  }

  function handleDone() {
    // Mark onboarding complete with user-scoped key
    if (user?.id) {
      localStorage.setItem(`sleepseed_onboarding_${user.id}`, '1');
    } else {
      localStorage.setItem('sleepseed_onboarding_v1', '1');
    }
    setView('dashboard');
  }

  function handlePhotoInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="nc0">
      <style>{CSS}</style>
      <div className="nc0-sky" />
      <div id="nc0-confetti-root" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 30 }} ref={confettiRef} />
      {STARS.map(s => (
        <div key={s.id} className={s.t === 1 ? 'nc0-star' : 'nc0-star2'}
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, '--d': s.d, '--dl': s.dl } as any} />
      ))}

      {/* ── CREATION PHASE ── */}
      {phase === 'create' && (
        <>
          <div className="nc0-create">
            <div className="nc0-header">
              <div className="nc0-moon"><div className="nc0-moon-sh" /></div>
              <div className="nc0-title">
                Before your first story,<br />let's capture <em>this moment.</em>
              </div>
              <div className="nc0-sub">
                You found SleepSeed tonight. That's the beginning of something.
                Let's mark it — just for you.
              </div>
            </div>

            <div className="nc0-input-card">
              <div className="nc0-input-lbl">what was happening in your world tonight?</div>
              <textarea
                className="nc0-textarea"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={"e.g. We just moved and bedtime has been chaos…\nor the kids are going through a big phase…\nor honestly I just wanted something that mattered more than screens.\n\nLeave this blank if you'd rather not say."}
                rows={4}
              />
            </div>

            <div className="nc0-sec-lbl">how are you feeling tonight</div>
            <div className="nc0-moods">
              {MOODS.map(m => (
                <div key={m.word}
                  className={`nc0-mood${mood === m.word ? ' on' : ''}`}
                  onClick={() => setMood(mood === m.word ? '' : m.word)}>
                  <span className="nc0-mood-icon">{m.icon}</span>
                  <span className="nc0-mood-word">{m.word}</span>
                </div>
              ))}
            </div>

            <div className="nc0-sec-lbl">a photo of tonight <span style={{ color: '#2A3050', fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
            {photo ? (
              <div style={{ marginBottom: 12 }}>
                <img src={photo} alt="Tonight" style={{ width: '100%', borderRadius: 11, objectFit: 'cover', maxHeight: 180 }} />
                <button className="nc0-photo-skip" onClick={() => setPhoto(null)}>remove photo ×</button>
              </div>
            ) : (
              <>
                {cameraOpen ? (
                  <div style={{borderRadius:12,overflow:'hidden',marginBottom:8}}>
                    <video ref={videoRef} autoPlay playsInline muted style={{width:'100%',display:'block',borderRadius:12,transform:'scaleX(-1)'}} />
                    <div style={{display:'flex',gap:8,marginTop:8}}>
                      <button className="nc0-photo-btn" style={{flex:1}} onClick={capturePhoto}>📸 Capture</button>
                      <button className="nc0-photo-btn" style={{flex:1,background:'rgba(255,255,255,.03)'}} onClick={() => {
                        streamRef.current?.getTracks().forEach(t => t.stop());
                        streamRef.current = null; setCameraOpen(false);
                      }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button className="nc0-photo-btn" onClick={openCamera}>
                      📸 Take a selfie
                    </button>
                    <button className="nc0-photo-btn" style={{marginTop:6,background:'rgba(255,255,255,.03)'}} onClick={() => fileRef.current?.click()}>
                      🖼️ Upload a photo from today
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoInput} />
                    <button className="nc0-photo-skip" onClick={() => {}}>skip photo →</button>
                  </>
                )}
              </>
            )}
          </div>

          <div className="nc0-gen-btn-wrap">
            <button className="nc0-gen-btn" onClick={handleCreate}>
              Create my Night Card ✦
            </button>
          </div>
        </>
      )}

      {/* ── GENERATING PHASE ── */}
      {phase === 'generating' && (
        <div className="nc0-generating">
          <div className="nc0-gen-moon"><div className="nc0-gen-moon-sh" /></div>
          <div className="nc0-gen-dots">
            <div className="nc0-gdot" /><div className="nc0-gdot" /><div className="nc0-gdot" />
          </div>
          <div className="nc0-gen-msg">Writing your Night Card…</div>
          <div className="nc0-gen-sub">capturing this moment forever</div>
        </div>
      )}

      {/* ── REVEAL PHASE ── */}
      {phase === 'reveal' && card && (
        <div className="nc0-reveal">
          <div className="nc0-reveal-star">★</div>

          <div className="nc0-polaroid">
            <div className="nc0-pol-img">
              {photo
                ? <img src={photo} className="nc0-pol-img-photo" alt="Tonight" />
                : <>
                    <div className="nc0-pol-img-moon"><div className="nc0-pol-img-moon-sh" /></div>
                    <div className="nc0-pol-sparkle" style={{ top: 12, right: 18 }}>✦</div>
                    <div className="nc0-pol-sparkle" style={{ bottom: 16, left: 14, fontSize: 8 }}>✧</div>
                    <div className="nc0-pol-sparkle" style={{ top: 22, left: 22, fontSize: 7, color: 'rgba(245,184,76,.35)' }}>✦</div>
                  </>
              }
            </div>
            <div className="nc0-pol-body">
              <div className="nc0-pol-origin">
                <div className="nc0-pol-origin-dot" />
                where it began ✦
              </div>
              <div className="nc0-pol-headline">{card.headline}</div>
              <div className="nc0-pol-quote">"{card.quote}"</div>
              <div className="nc0-pol-memory">{card.memory_line}</div>
              <div className="nc0-pol-meta">
                <span>Night 0 · {today}</span>
                <span>SleepSeed ✦</span>
              </div>
            </div>
          </div>

          <div className="nc0-reveal-msg">
            This card lives in your archive forever — the night it all began.
          </div>

          {card.whisper && (
            <div className="nc0-whisper-card">
              <div className="nc0-whisper-lbl">before you close your eyes tonight</div>
              <div className="nc0-whisper-txt">"{card.whisper}"</div>
            </div>
          )}

          <button className="nc0-done-btn" onClick={handleDone}>
            Take me to SleepSeed ✦
          </button>
        </div>
      )}
    </div>
  );
}
