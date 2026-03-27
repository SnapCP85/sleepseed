import { useEffect, useRef, useState } from 'react';

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#080C18;--night2:#0D1120;--warm:#12100a;
  --amber:#E8972A;--amber2:#F5B84C;--teal:#1D9E75;--teal2:#5DCAA5;
  --cream:#F4EFE8;--ink:#1A1420;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
body{background:var(--night)}
.hp{background:var(--night);color:var(--cream);font-family:var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}

/* animations */
@keyframes twk{0%,100%{opacity:.1}50%{opacity:.7}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes rock{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}
@keyframes glow{0%,100%{filter:drop-shadow(0 0 10px rgba(245,184,76,.25))}50%{filter:drop-shadow(0 0 26px rgba(245,184,76,.6))}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes cardIn{from{opacity:0;transform:rotate(-4deg) scale(.88) translateY(16px)}to{opacity:1;transform:rotate(-1.5deg) scale(1) translateY(0)}}

/* scroll reveal */
.fu{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
.fu.vis{opacity:1;transform:none}
.fu.d1{transition-delay:.1s}.fu.d2{transition-delay:.2s}.fu.d3{transition-delay:.3s}.fu.d4{transition-delay:.4s}

/* =============================================
   NAV
============================================= */
.hp-nav{background:rgba(8,12,24,.97);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06);padding:0 6%;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:100}
.hp-logo{font-family:var(--serif);font-size:19px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:9px;cursor:pointer;border:none;background:none}
.hp-logo-moon{width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#F5C060,#C87020);flex-shrink:0}
.hp-nav-r{display:flex;align-items:center;gap:10px}
.hp-signin{font-size:13px;color:rgba(244,239,232,.55);cursor:pointer;background:none;border:none;font-family:var(--sans);transition:color .15s}
.hp-signin:hover{color:var(--cream)}
.hp-nav-cta{background:var(--amber);color:var(--ink);padding:9px 22px;border-radius:50px;font-size:12px;font-weight:600;cursor:pointer;border:none;font-family:var(--sans);transition:all .2s;white-space:nowrap}
.hp-nav-cta:hover{background:var(--amber2);transform:translateY(-1px)}

/* mobile sticky */
.hp-sticky{position:fixed;bottom:0;left:0;right:0;z-index:200;padding:10px 16px 18px;background:linear-gradient(to top,rgba(8,12,24,1) 70%,rgba(8,12,24,0));display:none;transform:translateY(100%);transition:transform .35s ease}
.hp-sticky.show{transform:translateY(0)}
.hp-sticky-btn{width:100%;background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink);padding:14px;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;border:none;font-family:var(--sans);text-align:center}
@media(max-width:768px){.hp-sticky{display:block}}

/* =============================================
   SECTION 1: THE HOOK
============================================= */
.s1{min-height:92vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 6% 80px;position:relative;overflow:hidden;background:radial-gradient(ellipse 100% 55% at 50% -5%,rgba(232,151,42,.07),transparent),var(--night)}
.s1-stars{position:absolute;inset:0;pointer-events:none}
.s1-star{position:absolute;border-radius:50%;background:#fff;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite}
.s1-creatures{display:flex;gap:16px;margin-bottom:28px;position:relative;z-index:2}
.s1-c{font-size:42px;animation:float var(--d,3.5s) ease-in-out infinite var(--dl,0s);filter:drop-shadow(0 4px 14px rgba(0,0,0,.3));opacity:.85}
.s1-egg{font-size:40px;animation:rock 2.5s ease-in-out infinite,glow 3s ease-in-out infinite;opacity:.95}
.s1-h{font-family:var(--serif);font-size:clamp(34px,5.5vw,64px);font-weight:900;line-height:1.08;letter-spacing:-.03em;margin-bottom:18px;position:relative;z-index:2}
.s1-h em{font-style:italic;color:var(--amber2)}
.s1-sub{font-size:clamp(15px,1.7vw,17px);color:rgba(244,239,232,.65);font-weight:300;line-height:1.8;max-width:540px;margin:0 auto 28px;position:relative;z-index:2}
.s1-sub strong{color:rgba(244,239,232,.9);font-weight:500}
.s1-cta{background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink);padding:17px 40px;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;border:none;font-family:var(--sans);transition:all .2s;position:relative;z-index:2;margin-bottom:14px}
.s1-cta:hover{filter:brightness(1.1);transform:translateY(-2px)}
.s1-proof{max-width:400px;margin:20px auto 0;position:relative;z-index:2}
.s1-stars-row{display:flex;align-items:center;justify-content:center;gap:5px;margin-bottom:8px}
.s1-quote{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px 16px}
.s1-quote-text{font-family:var(--serif);font-size:13.5px;font-style:italic;color:rgba(244,239,232,.65);line-height:1.6;margin-bottom:5px}
.s1-quote-who{font-size:10px;color:rgba(244,239,232,.4);font-family:var(--mono)}

/* =============================================
   SECTION 2: PROBLEM + SOLUTION (side by side)
============================================= */
.s2{padding:80px 6%;background:linear-gradient(180deg,var(--night),var(--night2))}
.s2-grid{max-width:1060px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
@media(max-width:800px){.s2-grid{grid-template-columns:1fr;gap:40px}}

/* problem side */
.s2-kicker{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-family:var(--mono);font-weight:700;margin-bottom:18px}
.s2-q-row{display:flex;justify-content:space-between;align-items:baseline;padding:12px 0;border-bottom:.5px solid rgba(255,255,255,.06)}
.s2-q-row:last-child{border-bottom:none}
.s2-q{font-family:var(--serif);font-size:16px;font-style:italic;color:rgba(244,239,232,.72)}
.s2-a{font-family:var(--mono);font-size:14px;color:rgba(244,239,232,.42)}
.s2-punch{font-family:var(--serif);font-size:clamp(20px,2.8vw,30px);font-weight:700;color:var(--cream);line-height:1.3;margin-top:20px}
.s2-punch em{font-style:italic;color:var(--amber2)}

/* solution side */
.s2-sol-h{font-family:var(--serif);font-size:clamp(20px,2.8vw,30px);font-weight:700;color:var(--cream);line-height:1.25;margin-bottom:20px}
.s2-sol-h em{font-style:italic;color:var(--amber2)}
.s2-features{display:flex;flex-direction:column;gap:16px}
.s2-feat{display:flex;align-items:flex-start;gap:14px}
.s2-feat-ico{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.s2-feat-title{font-size:14px;font-weight:700;color:var(--cream);margin-bottom:2px}
.s2-feat-desc{font-size:13px;color:rgba(244,239,232,.62);line-height:1.6}

/* =============================================
   HOW IT WORKS (compact 3-step)
============================================= */
.hw{padding:56px 6% 64px;background:var(--night2);border-top:1px solid rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.04)}
.hw-inner{max-width:800px;margin:0 auto}
.hw-label{text-align:center;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-family:var(--mono);color:rgba(232,151,42,.5);font-weight:700;margin-bottom:28px}
.hw-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;position:relative}
@media(max-width:600px){.hw-steps{grid-template-columns:1fr;gap:12px}}
.hw-step{text-align:center;padding:20px 16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:16px}
.hw-step-ico{font-size:28px;margin-bottom:8px;display:inline-block}
.hw-step-title{font-size:13px;font-weight:700;color:var(--cream);margin-bottom:4px}
.hw-step-desc{font-size:12px;color:rgba(244,239,232,.55);line-height:1.5}
.hw-age{text-align:center;margin-top:18px;font-size:11px;color:rgba(244,239,232,.48);font-family:var(--mono)}
.hw-arrow{display:none;position:absolute;top:50%;font-size:14px;color:rgba(255,255,255,.12)}
@media(min-width:601px){.hw-arrow{display:block}}

/* =============================================
   SECTION 3: THE EXPERIENCE (cinematic demo + story peek)
============================================= */
.s3{padding:80px 6%;background:var(--night)}
.s3-inner{max-width:800px;margin:0 auto}
.s3-stage{min-height:320px;position:relative;border:1px solid rgba(245,184,76,.08);border-radius:24px;background:radial-gradient(ellipse 120% 70% at 50% 40%,rgba(245,184,76,.03),transparent);padding:20px;margin-bottom:16px;overflow:hidden}
.s3-scene{position:absolute;inset:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transform:translateY(14px);transition:opacity .8s ease,transform .8s ease;pointer-events:none}
.s3-scene.on{opacity:1;transform:translateY(0);pointer-events:auto}
.s3-dots{display:flex;gap:10px;justify-content:center}
.s3-dot-w{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer}
.s3-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.08);transition:all .3s}
.s3-dot.on{background:var(--amber2);transform:scale(1.3);box-shadow:0 0 8px rgba(245,184,76,.4)}
.s3-dot-lbl{font-size:9px;color:rgba(255,255,255,.25);font-family:var(--mono);transition:color .3s}
.s3-dot-w:hover .s3-dot-lbl{color:rgba(255,255,255,.35)}

/* story peek */
.s3-bridge{text-align:center;margin:40px auto 20px;max-width:480px}
.s3-bridge-line{font-family:var(--serif);font-size:clamp(18px,2.4vw,24px);font-weight:700;color:var(--cream);line-height:1.3;margin-bottom:6px}
.s3-bridge-line em{font-style:italic;color:var(--amber2)}
.s3-bridge-sub{font-size:13px;color:rgba(244,239,232,.58);line-height:1.6}
.s3-peek{max-width:700px;margin:20px auto 0;padding-top:28px;border-top:1px solid rgba(255,255,255,.04)}
.s3-book{background:linear-gradient(145deg,#F9F1E2,#F0E8D4);border-radius:18px;padding:36px 40px;text-align:left;box-shadow:0 20px 64px rgba(0,0,0,.5);position:relative;overflow:hidden}
.s3-book::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#C87020,#E8972A,#C87020)}
@media(max-width:600px){.s3-book{padding:24px 20px}}
.s3-book-k{font-size:8px;letter-spacing:.1em;text-transform:uppercase;font-family:var(--mono);color:#8A6830;margin-bottom:12px}
.s3-book-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:14px}
.s3-book-chip{display:inline-flex;align-items:center;gap:4px;font-size:9px;padding:3px 9px;border-radius:20px;background:rgba(200,112,32,.08);border:1px solid rgba(200,112,32,.15);color:#8A5010;font-family:var(--mono)}
.s3-book-title{font-family:var(--serif);font-size:clamp(17px,2.2vw,24px);font-weight:700;color:#2A1A00;margin-bottom:14px;line-height:1.25}
.s3-book-title .cn{color:#C87020;font-style:italic}
.s3-book-p{font-family:var(--serif);font-size:clamp(14px,1.5vw,16.5px);color:#3A2800;line-height:1.9;margin-bottom:14px}
.s3-book-p .cn{color:#C87020;font-weight:700}
.s3-book-p em{font-style:italic;color:#5A3800}
.s3-book-ref{background:rgba(200,112,32,.07);border-left:3px solid rgba(200,112,32,.35);border-radius:0 8px 8px 0;padding:12px 18px;font-family:var(--serif);font-size:14.5px;color:#5A3800;font-style:italic;line-height:1.7;margin-bottom:14px}
.s3-book-foot{font-size:9px;font-family:var(--mono);color:rgba(90,56,0,.3);padding-top:10px;border-top:1px solid rgba(200,112,32,.12);display:flex;justify-content:space-between}

/* =============================================
   SECTION 4: THE PROOF
============================================= */
.s4{padding:80px 6%;background:linear-gradient(180deg,var(--night2),var(--night))}
.s4-inner{max-width:1000px;margin:0 auto}

/* founder — warm personal moment */
.s4-founder{text-align:center;margin-bottom:52px;padding:36px 28px;background:radial-gradient(ellipse 100% 100% at 50% 50%,rgba(232,151,42,.04),transparent);border:1px solid rgba(232,151,42,.08);border-radius:20px;max-width:640px;margin-left:auto;margin-right:auto}
.s4-founder-q{font-family:var(--serif);font-size:clamp(17px,2.2vw,22px);font-style:italic;color:rgba(244,239,232,.68);line-height:1.7;max-width:540px;margin:0 auto 10px}
.s4-founder-who{font-size:11px;color:rgba(244,239,232,.4);font-family:var(--mono)}

.s4-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px}
@media(max-width:800px){.s4-cards{grid-template-columns:1fr}}
.s4-card{background:#FFFDF7;border-radius:16px;padding:22px;position:relative;overflow:hidden;transition:transform .2s}
.s4-card:hover{transform:translateY(-2px)}
.s4-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:3px 3px 0 0}
.s4-card.a::before{background:linear-gradient(90deg,#E8972A,rgba(232,151,42,.08))}
.s4-card.b::before{background:linear-gradient(90deg,#1D9E75,rgba(29,158,117,.08))}
.s4-card.c::before{background:linear-gradient(90deg,#b48cff,rgba(180,140,255,.08))}
.s4-streak{display:inline-flex;align-items:center;gap:4px;border-radius:20px;padding:3px 10px;font-size:9px;font-family:var(--mono);margin-bottom:10px}
.s4-streak.a{background:rgba(232,151,42,.08);color:#B07018}
.s4-streak.b{background:rgba(29,158,117,.07);color:#1A7A58}
.s4-streak.c{background:rgba(180,140,255,.07);color:#6A4AAA}
.s4-quote{font-family:var(--serif);font-size:13.5px;font-style:italic;color:#3A3048;line-height:1.75;margin-bottom:12px}
.s4-who{display:flex;align-items:center;gap:8px}
.s4-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700;flex-shrink:0}
.s4-name{font-size:12px;font-weight:600;color:#2A2038}
.s4-role{font-size:10px;color:#8A7888;margin-top:1px}

/* night card fan */
.s4-fan-wrap{margin-bottom:32px;overflow:hidden}
.s4-fan{display:flex;gap:0;justify-content:center;position:relative}
@media(max-width:520px){.s4-fan{overflow-x:auto;-webkit-overflow-scrolling:touch;justify-content:flex-start;padding:0 20px;gap:12px;scroll-snap-type:x mandatory}.s4-nc{scroll-snap-align:center;transform:none!important;min-width:200px;width:200px;margin:0!important}}
.s4-nc{background:#F4EFE2;border-radius:10px;width:175px;box-shadow:0 10px 36px rgba(0,0,0,.45);overflow:hidden;flex-shrink:0;transition:transform .3s}
.s4-nc:nth-child(1){transform:rotate(-5deg) translateY(6px)}
.s4-nc:nth-child(2){transform:rotate(0deg);z-index:2;width:190px;margin:0 -8px}
.s4-nc:nth-child(3){transform:rotate(4deg) translateY(10px)}
.s4-nc:hover{transform:rotate(0deg) translateY(-3px) scale(1.03);z-index:3}
.s4-nc-img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
.s4-nc-body{padding:10px 12px 12px}
.s4-nc-badge{font-size:6.5px;font-family:var(--mono);color:#8A6830;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
.s4-nc-q{font-family:Georgia,serif;font-size:11px;font-style:italic;color:#2A1600;line-height:1.5;margin-bottom:6px}
.s4-nc-meta{font-size:7px;font-family:var(--mono);color:rgba(90,56,0,.3);display:flex;justify-content:space-between}

/* trust */
.s4-trust{display:flex;gap:20px;justify-content:center;flex-wrap:wrap}
.s4-trust-item{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(244,239,232,.5)}

/* =============================================
   SECTION 5: THE CLOSE
============================================= */
.s5{padding:100px 6%;background:var(--night);text-align:center;position:relative;overflow:hidden}
.s5::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:380px;border-radius:50%;background:radial-gradient(ellipse,rgba(232,151,42,.05),transparent 60%);pointer-events:none}
.s5-h{font-family:var(--serif);font-size:clamp(30px,4.5vw,56px);font-weight:900;color:var(--cream);line-height:1.1;letter-spacing:-.03em;margin-bottom:18px;position:relative;z-index:1}
.s5-h em{font-style:italic;color:var(--amber2)}
.s5-sub{font-size:15px;color:rgba(244,239,232,.58);font-weight:300;line-height:1.8;max-width:460px;margin:0 auto 32px;position:relative;z-index:1}
.s5-sub strong{color:rgba(244,239,232,.85);font-weight:500}
.s5-cta{background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink);padding:17px 44px;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;border:none;font-family:var(--sans);transition:all .2s;position:relative;z-index:1;margin-bottom:12px}
.s5-cta:hover{filter:brightness(1.1);transform:translateY(-2px)}
.s5-note{font-size:11px;color:rgba(244,239,232,.42);font-family:var(--mono);position:relative;z-index:1;margin-bottom:28px}
.s5-pricing{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;max-width:560px;margin:0 auto 16px;position:relative;z-index:1}
.s5-plan{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:20px 24px;flex:1;min-width:200px;text-align:center}
.s5-plan.pop{border-color:rgba(232,151,42,.25);background:rgba(232,151,42,.04)}
.s5-plan-name{font-size:9px;font-family:var(--mono);color:rgba(232,151,42,.5);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;font-weight:700}
.s5-plan-price{font-family:var(--serif);font-size:32px;font-weight:900;color:var(--cream);line-height:1}
.s5-plan-price sup{font-size:16px}
.s5-plan-price sub{font-size:12px;color:rgba(244,239,232,.4)}
.s5-plan-detail{font-size:11px;color:rgba(244,239,232,.55);margin-top:6px;line-height:1.5}
.s5-plan-note{font-size:10px;color:rgba(244,239,232,.42);font-family:var(--mono);margin-top:6px}

/* footer */
.hp-footer{background:var(--night);padding:24px 6%;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;border-top:1px solid rgba(255,255,255,.04)}
.hp-footer-logo{font-family:var(--serif);font-size:15px;font-weight:700;color:rgba(244,239,232,.45);display:flex;align-items:center;gap:7px}
.hp-footer-tag{font-size:10px;color:rgba(244,239,232,.22);font-style:italic;font-family:var(--serif);margin-top:2px}
.hp-footer-links{display:flex;gap:16px}
.hp-footer-link{font-size:11px;color:rgba(244,239,232,.28);background:none;border:none;cursor:pointer;font-family:var(--sans);transition:color .15s}
.hp-footer-link:hover{color:rgba(244,239,232,.55)}
.hp-footer-copy{font-size:10px;color:rgba(244,239,232,.15);font-family:var(--mono)}

@media(max-width:800px){.s2-grid{grid-template-columns:1fr;gap:36px}.s4-cards{grid-template-columns:1fr}.s5-pricing{flex-direction:column}}
@media(max-width:640px){.s1,.s2,.s3,.s4,.s5,.hw{padding-left:5%;padding-right:5%}.hp-footer{flex-direction:column;text-align:center}.hp-footer-links{justify-content:center}.s3-book{padding:22px 18px}}
`;

interface Props {
  onCreateStory: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onNightCards: () => void;
  onLibrary: () => void;
}

export default function PublicHomepage({ onCreateStory, onSignIn, onSignUp }: Props) {
  const starsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [stickyShow, setStickyShow] = useState(false);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    // Stars
    const c = starsRef.current;
    if (c) {
      for (let i = 0; i < 50; i++) {
        const s = document.createElement('div');
        s.className = 's1-star';
        const sz = Math.random() < .2 ? 3 : Math.random() < .5 ? 2 : 1.2;
        s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${(2+Math.random()*4).toFixed(1)}s;--dl:${(Math.random()*5).toFixed(1)}s`;
        c.appendChild(s);
      }
    }
    // Scroll reveal
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    document.querySelectorAll('.fu').forEach(el => obs.observe(el));
    // Sticky CTA
    const heroObs = new IntersectionObserver(entries => { setStickyShow(!entries[0].isIntersecting); }, { threshold: 0 });
    if (heroRef.current) heroObs.observe(heroRef.current);
    return () => { obs.disconnect(); heroObs.disconnect(); };
  }, []);

  // Demo scene auto-cycle
  useEffect(() => {
    const durations = [4500, 5500, 5500, 5000];
    const t = setTimeout(() => setScene(s => (s + 1) % 4), durations[scene]);
    return () => clearTimeout(t);
  }, [scene]);

  return (
    <div className="hp">
      <style>{CSS}</style>

      <div className={`hp-sticky${stickyShow ? ' show' : ''}`}>
        <button className="hp-sticky-btn" onClick={onSignUp}>Start tonight — free ✦</button>
      </div>

      <nav className="hp-nav">
        <button className="hp-logo"><div className="hp-logo-moon" />SleepSeed</button>
        <div className="hp-nav-r">
          <button className="hp-signin" onClick={onSignIn}>Sign in</button>
          <button className="hp-nav-cta" onClick={onSignUp}>Start free ✦</button>
        </div>
      </nav>

      {/* =============================================
          1. THE HOOK
      ============================================= */}
      <section className="s1" ref={heroRef}>
        <div className="s1-stars" ref={starsRef} />

        <div className="s1-creatures fu">
          {[{e:'🐰',d:'3.5s',dl:'0s'},{e:'🦊',d:'4s',dl:'-.7s'},{e:'🐉',d:'3.8s',dl:'-1.3s'},{e:'🦉',d:'4.2s',dl:'-.4s'}].map((c,i)=>(
            <div key={i} className="s1-c" style={{'--d':c.d,'--dl':c.dl} as any}>{c.e}</div>
          ))}
          <div className="s1-egg">🥚</div>
        </div>

        <h1 className="s1-h fu d1">Your child will say<br/>something <em>true</em> tonight.</h1>

        <p className="s1-sub fu d2">
          Every night before sleep, there's a window where they'll tell you what they'd never say at dinner.{' '}
          <strong>SleepSeed opens it.</strong>
        </p>

        <button className="s1-cta fu d3" onClick={onSignUp}>Start tonight — free ✦</button>

        <div className="s1-proof fu d4">
          <div className="s1-stars-row">
            <span style={{color:'#F5B84C',fontSize:13,letterSpacing:2}}>★★★★★</span>
            <span style={{fontSize:10,color:'rgba(244,239,232,.4)',fontFamily:'var(--mono)'}}>Loved by families</span>
          </div>
          <div className="s1-quote">
            <div className="s1-quote-text">"Bedtime went from something I dreaded to the part of the day we both look forward to most."</div>
            <div className="s1-quote-who">Sarah M. · Mum of two · 122 nights</div>
          </div>
        </div>
      </section>

      {/* =============================================
          2. PROBLEM + SOLUTION
      ============================================= */}
      <section className="s2">
        <div className="s2-grid">
          {/* Problem */}
          <div className="fu">
            <div className="s2-kicker" style={{color:'rgba(232,151,42,.5)'}}>Every night</div>
            <div>
              {[{q:'"How was your day?"',a:'"Fine."'},{q:'"Are you nervous about school?"',a:'[shrug]'},{q:'"What are you thinking about?"',a:'"Nothing."'}].map((r,i)=>(
                <div key={i} className="s2-q-row">
                  <span className="s2-q">{r.q}</span>
                  <span className="s2-a">{r.a}</span>
                </div>
              ))}
            </div>
            <div className="s2-punch">Children don't open up <em>on command.</em></div>
          </div>

          {/* Solution */}
          <div className="fu d2">
            <div className="s2-kicker" style={{color:'rgba(232,151,42,.5)'}}>SleepSeed</div>
            <div className="s2-sol-h">They open up to a <em>trusted friend</em>, in a story where they're the hero.</div>
            <div className="s2-features">
              <div className="s2-feat">
                <div className="s2-feat-ico" style={{background:'rgba(245,184,76,.08)',border:'1px solid rgba(245,184,76,.15)'}}>🐰</div>
                <div>
                  <div className="s2-feat-title">A companion who asks what you can't</div>
                  <div className="s2-feat-desc">Your child's DreamKeeper joins every story — and your child tells it things they won't tell you directly.</div>
                </div>
              </div>
              <div className="s2-feat">
                <div className="s2-feat-ico" style={{background:'rgba(96,232,176,.06)',border:'1px solid rgba(96,232,176,.12)'}}>✨</div>
                <div>
                  <div className="s2-feat-title">A story built from their real day</div>
                  <div className="s2-feat-desc">Personalised in seconds. Their name, their fears, their small victories — woven into the adventure.</div>
                </div>
              </div>
              <div className="s2-feat">
                <div className="s2-feat-ico" style={{background:'rgba(180,140,255,.06)',border:'1px solid rgba(180,140,255,.12)'}}>🌙</div>
                <div>
                  <div className="s2-feat-title">A Night Card that captures the moment</div>
                  <div className="s2-feat-desc">What they said tonight. Saved forever. In ten years, you'll still have this.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          HOW IT WORKS (compact 3-step)
      ============================================= */}
      <section className="hw">
        <div className="hw-inner">
          <div className="hw-label fu">How it works</div>
          <div className="hw-steps">
            <div className="hw-step fu">
              <div className="hw-step-ico">📝</div>
              <div className="hw-step-title">Share their day</div>
              <div className="hw-step-desc">Type what happened today — a worry, a win, a funny moment.</div>
            </div>
            <div className="hw-arrow" style={{left:'33%',transform:'translate(-50%,-50%)'}}>→</div>
            <div className="hw-step fu d1">
              <div className="hw-step-ico">✨</div>
              <div className="hw-step-title">Story appears</div>
              <div className="hw-step-desc">A personalised bedtime story starring them and their DreamKeeper companion.</div>
            </div>
            <div className="hw-arrow" style={{left:'66%',transform:'translate(-50%,-50%)'}}>→</div>
            <div className="hw-step fu d2">
              <div className="hw-step-ico">🌙</div>
              <div className="hw-step-title">Night Card saved</div>
              <div className="hw-step-desc">What they said before sleep — captured as a keepsake, saved forever.</div>
            </div>
          </div>
          <div className="hw-age fu d3">Ages 3–11 · Works on any device · Ready in 60 seconds</div>
        </div>
      </section>

      {/* =============================================
          3. THE EXPERIENCE
      ============================================= */}
      <section className="s3">
        <div className="s3-inner">
          {/* Cinematic demo */}
          <div className="s3-stage fu">
            {/* Scene 1: The window */}
            <div className={`s3-scene${scene===0?' on':''}`}>
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:14,color:'rgba(245,184,76,.45)',letterSpacing:'.12em',marginBottom:22}}>8:17 PM</div>
                <div style={{fontFamily:'var(--serif)',fontSize:'clamp(22px,3.2vw,34px)',fontWeight:700,color:'var(--cream)',lineHeight:1.35,marginBottom:14}}>The day is finally quiet.</div>
                <div style={{fontFamily:'var(--serif)',fontSize:'clamp(15px,1.8vw,18px)',fontStyle:'italic',color:'rgba(244,239,232,.5)',lineHeight:1.65}}>Just you. Just them. Just now.<br/><span style={{color:'rgba(244,239,232,.35)'}}>This window lasts about twenty minutes.</span></div>
              </div>
            </div>
            {/* Scene 2: The transformation */}
            <div className={`s3-scene${scene===1?' on':''}`}>
              <div style={{textAlign:'center',maxWidth:460}}>
                <div style={{fontFamily:'var(--serif)',fontSize:'clamp(14px,1.6vw,16px)',color:'rgba(244,239,232,.5)',lineHeight:1.7,marginBottom:18}}>You told us she was nervous about a spelling test.</div>
                <div style={{fontFamily:'var(--serif)',fontSize:'clamp(17px,2.3vw,24px)',fontWeight:700,color:'var(--cream)',lineHeight:1.4,marginBottom:14,animation:scene===1?'slideUp .7s ease-out .2s both':'none',opacity:0}}>Thirty seconds later, she heard her own name in a story about a brave little cloud.</div>
                <div style={{fontFamily:'var(--serif)',fontSize:'clamp(15px,1.8vw,18px)',fontStyle:'italic',color:'rgba(245,184,76,.6)',animation:scene===1?'slideUp .6s ease-out .7s both':'none',opacity:0}}>She leaned in. She forgot she was nervous.</div>
              </div>
            </div>
            {/* Scene 3: What she said */}
            <div className={`s3-scene${scene===2?' on':''}`}>
              <div style={{textAlign:'center',maxWidth:480}}>
                <div style={{fontFamily:'var(--serif)',fontSize:'clamp(20px,3.2vw,32px)',fontStyle:'italic',fontWeight:700,color:'var(--cream)',lineHeight:1.45,marginBottom:18,animation:scene===2?'slideUp .7s ease-out':'none'}}>"I was brave like the dragon.<br/>Even though my tummy was<br/>full of tangled string."</div>
                <div style={{fontSize:14,color:'rgba(244,239,232,.45)',lineHeight:1.6,animation:scene===2?'slideUp .5s ease-out .5s both':'none',opacity:0}}>She said this right before sleep.<br/><strong style={{color:'rgba(244,239,232,.62)'}}>Without tonight's ritual, it would already be gone.</strong></div>
              </div>
            </div>
            {/* Scene 4: Saved forever */}
            <div className={`s3-scene${scene===3?' on':''}`}>
              <div style={{textAlign:'center',maxWidth:360}}>
                <div style={{background:'#F4EFE2',borderRadius:10,overflow:'hidden',boxShadow:'0 12px 40px rgba(0,0,0,.4)',animation:scene===3?'cardIn .7s ease-out':'none',transform:'rotate(-1.5deg)',marginBottom:14}}>
                  <img src="/nightcard-hero.jpg" alt="Night Card" style={{width:'100%',height:140,objectFit:'cover',objectPosition:'center 35%',display:'block'}}/>
                  <div style={{padding:'8px 12px 10px'}}>
                    <div style={{fontFamily:'Georgia,serif',fontSize:13,fontStyle:'italic',color:'#2A1600',lineHeight:1.5}}>"I was brave like the dragon."</div>
                    <div style={{fontSize:7,color:'rgba(74,48,0,.35)',fontFamily:'monospace',marginTop:4}}>Night 23 · Adina · Age 6 · Saved forever ✦</div>
                  </div>
                </div>
                <div style={{fontFamily:'var(--serif)',fontSize:'clamp(14px,1.7vw,17px)',fontStyle:'italic',color:'rgba(244,239,232,.5)',lineHeight:1.6,animation:scene===3?'slideUp .5s ease-out .4s both':'none',opacity:0}}>One day she'll be 16 and you'll open this card.<br/><span style={{color:'rgba(244,239,232,.62)'}}>You'll remember exactly how her voice sounded.</span></div>
              </div>
            </div>
          </div>

          <div className="s3-dots">
            {['The window','The story','What she said','Saved forever'].map((l,i)=>(
              <div key={i} className="s3-dot-w" onClick={()=>setScene(i)}>
                <div className={`s3-dot${scene===i?' on':''}`}/>
                <div className="s3-dot-lbl" style={{color:scene===i?'rgba(245,184,76,.55)':'rgba(255,255,255,.15)'}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Bridge into story peek */}
          <div className="s3-bridge fu">
            <div className="s3-bridge-line">Here's what tonight's story <em>actually looks like.</em></div>
            <div className="s3-bridge-sub">Every story is built from your child's real day, starring them and their DreamKeeper.</div>
          </div>

          {/* Story peek */}
          <div className="s3-peek fu">
            <div className="s3-book">
              <div className="s3-book-k">Built from these choices:</div>
              <div className="s3-book-chips">
                {[{i:'🧒',l:'Adina, age 4'},{i:'🦉',l:'Moonlight the Owl'},{i:'💛',l:'Kind & gentle'},{i:'🌙',l:'Calm & cosy'},{i:'📝',l:'"She was shy at school"'}].map((c,j)=>(
                  <span key={j} className="s3-book-chip">{c.i} {c.l}</span>
                ))}
              </div>
              <div className="s3-book-title"><span className="cn">Adina</span> and the Shy Cloud</div>
              <p className="s3-book-p">Up in the sky, all the clouds were making shapes. One made a bunny. One made a boat. But there was one little cloud hiding behind the moon. It didn't want to make anything at all.</p>
              <p className="s3-book-p">"Look," said <span className="cn">Moonlight</span>, pointing with her wing. <span className="cn">Moonlight</span> always spotted things first because owls have <em>very</em> big eyes. "That cloud looks sad."</p>
              <div className="s3-book-ref">
                <span className="cn">Adina</span> gave the cloud a gentle pat. "That's okay," she said. "You don't have to be a shape. You can just be you." <span className="cn">Moonlight</span> nodded her big owl head. The cloud stopped shaking. Then — very slowly — it made the most beautiful shape of all. It made a heart.
              </div>
              <div className="s3-book-foot">
                <span>SleepSeed · Adina &amp; Moonlight · Night 23</span>
                <span>🦉 Moonlight joined the adventure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          4. THE PROOF
      ============================================= */}
      <section className="s4">
        <div className="s4-inner">
          {/* Founder */}
          <div className="s4-founder fu">
            <div style={{fontSize:28,marginBottom:12}}>🌙</div>
            <div className="s4-founder-q">"I built SleepSeed because I was watching unrepeatable moments disappear. The things my daughters said at bedtime — I couldn't remember them by morning."</div>
            <div className="s4-founder-who">Greg Edelman · Father of two · Founder</div>
          </div>

          {/* Testimonials */}
          <div className="s4-cards">
            <div className="s4-card a fu">
              <div className="s4-streak a">✦ 122 nights · 17 companions</div>
              <p className="s4-quote">"My daughter won't go to bed without checking on her egg first. She's hatched 17 companions and named every single one. Bedtime is now the best part of our day."</p>
              <div className="s4-who"><div className="s4-av" style={{background:'linear-gradient(135deg,#D4A060,#B07020)'}}>S</div><div><div className="s4-name">Sarah M.</div><div className="s4-role">Mum of two · ages 4 &amp; 7</div></div></div>
            </div>
            <div className="s4-card b fu d1">
              <div className="s4-streak b">✦ 47 nights · Ember is his best friend</div>
              <p className="s4-quote">"My son has anxiety about school. The stories let him work through things he couldn't say directly — and Ember makes him feel brave. I've learned more from Night Cards than a year of asking 'how was your day.'"</p>
              <div className="s4-who"><div className="s4-av" style={{background:'linear-gradient(135deg,#2AB89A,#1A8A70)'}}>J</div><div><div className="s4-name">James K.</div><div className="s4-role">Dad of one · age 8</div></div></div>
            </div>
            <div className="s4-card c fu d2">
              <div className="s4-streak c">✦ Child therapist · recommends</div>
              <p className="s4-quote">"The companion creates an emotional anchor — children project onto it in ways that open real conversations. The egg mechanic is brilliant for building bedtime habits. I recommend it to every family."</p>
              <div className="s4-who"><div className="s4-av" style={{background:'linear-gradient(135deg,#b48cff,#7040d0)'}}>L</div><div><div className="s4-name">Dr. Lisa R.</div><div className="s4-role">Child &amp; Family Therapist</div></div></div>
            </div>
          </div>

          {/* Night Card fan */}
          <div className="s4-fan-wrap">
            <div className="s4-fan fu">
              <div className="s4-nc">
                <img className="s4-nc-img" src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop&crop=faces" alt="" />
                <div className="s4-nc-body">
                  <div className="s4-nc-badge">🌙 Night 8 · 🦊 Ember</div>
                  <div className="s4-nc-q">"Ember told me it's okay to be scared as long as you still try."</div>
                  <div className="s4-nc-meta"><span>Leo · Age 5</span><span>⭐</span></div>
                </div>
              </div>
              <div className="s4-nc">
                <img className="s4-nc-img" src="/nightcard-hero.jpg" alt="" />
                <div className="s4-nc-body">
                  <div className="s4-nc-badge">🌙 Night 34 · 🦉 Moonlight</div>
                  <div className="s4-nc-q">"The best three seconds was when you carried me to bed even though I'm not little anymore."</div>
                  <div className="s4-nc-meta"><span>Adina · Age 6</span><span>⭐</span></div>
                </div>
              </div>
              <div className="s4-nc">
                <img className="s4-nc-img" src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=300&fit=crop&crop=faces" alt="" />
                <div className="s4-nc-body">
                  <div className="s4-nc-badge">🌙 Night 19 · 🐉 Sparks</div>
                  <div className="s4-nc-q">"I remember every dog I've ever met. In order of how much they understood me."</div>
                  <div className="s4-nc-meta"><span>Maya · Age 9</span><span>⭐</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust */}
          <div className="s4-trust fu">
            <div className="s4-trust-item"><span style={{fontSize:15}}>📵</span> Replaces screen time</div>
            <div className="s4-trust-item"><span style={{fontSize:15}}>🔒</span> Data stays private</div>
            <div className="s4-trust-item"><span style={{fontSize:15}}>🧠</span> Pediatrician-informed</div>
            <div className="s4-trust-item"><span style={{fontSize:15}}>📱</span> Works on any device</div>
          </div>
        </div>
      </section>

      {/* =============================================
          5. THE CLOSE
      ============================================= */}
      <section className="s5">
        <div style={{fontSize:60,marginBottom:16,animation:'rock 2.5s ease-in-out infinite,glow 3s ease-in-out infinite',display:'inline-block',position:'relative',zIndex:1}}>🥚</div>
        <h2 className="s5-h fu">These nights are<br/>happening <em>right now.</em></h2>
        <p className="s5-sub fu d1">Your child will say something true tonight.{' '}<strong>SleepSeed is how you hear it — and how you keep it forever.</strong></p>
        <button className="s5-cta fu d2" onClick={onSignUp}>Start tonight — free ✦</button>
        <div className="s5-note fu d3">No credit card required · Cancel any time</div>

        <div className="s5-pricing fu d4">
          <div className="s5-plan">
            <div className="s5-plan-name">Free</div>
            <div className="s5-plan-price"><sup>$</sup>0</div>
            <div className="s5-plan-detail">3 stories · 3 Night Cards<br/>Hatch your first DreamKeeper</div>
          </div>
          <div className="s5-plan pop">
            <div className="s5-plan-name">Family</div>
            <div className="s5-plan-price"><sup>$</sup>6<sub>.58/mo</sub></div>
            <div className="s5-plan-detail">Unlimited stories &amp; Night Cards<br/>Unlimited DreamKeepers · Multiple children</div>
            <div className="s5-plan-note">$79/year · save 34%</div>
          </div>
        </div>
      </section>

      <footer className="hp-footer">
        <div>
          <div className="hp-footer-logo"><div className="hp-logo-moon" style={{width:16,height:16}}/>SleepSeed</div>
          <div className="hp-footer-tag">Bedtime, but magical. Every night.</div>
        </div>
        <div className="hp-footer-links">
          <button className="hp-footer-link">Privacy</button>
          <button className="hp-footer-link">Terms</button>
        </div>
        <div className="hp-footer-copy">© 2026 SleepSeed</div>
      </footer>
    </div>
  );
}
