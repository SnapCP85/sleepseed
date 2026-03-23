import { useEffect, useRef, useState } from 'react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400;1,9..144,600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#080C18;--night2:#0D1120;
  --amber:#E8972A;--amber2:#F5B84C;--amber3:#CC7818;
  --teal:#1D9E75;--teal2:#5DCAA5;--rose:#C85070;
  --cream:#F4EFE8;--parch:#F8F1E4;
  --ink:#1A1420;--ink2:#3A3048;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
.hp{background:var(--night);color:var(--cream);font-family:var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}

@keyframes twinkle{0%,100%{opacity:.08}50%{opacity:.65}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.6)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes rock{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}
@keyframes glow{0%,100%{filter:drop-shadow(0 0 12px rgba(245,184,76,.3))}50%{filter:drop-shadow(0 0 28px rgba(245,184,76,.6))}}
@keyframes shine{0%{left:-100%}100%{left:200%}}

.fu{opacity:0;transform:translateY(30px);transition:opacity .72s cubic-bezier(.22,1,.36,1),transform .72s cubic-bezier(.22,1,.36,1)}
.fu.vis{opacity:1;transform:none}
.fu.d1{transition-delay:.1s}.fu.d2{transition-delay:.2s}.fu.d3{transition-delay:.3s}.fu.d4{transition-delay:.4s}

/* nav */
.hp-nav{background:rgba(8,12,24,.97);backdrop-filter:blur(20px);border-bottom:1px solid rgba(232,151,42,.1);padding:0 6%;display:flex;align-items:center;justify-content:space-between;height:68px;position:sticky;top:0;z-index:100}
.hp-logo{font-family:var(--serif);font-size:20px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:10px;cursor:pointer;border:none;background:none}
.hp-logo-moon{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#F5C060,#C87020);flex-shrink:0}
.hp-nav-right{display:flex;align-items:center;gap:12px}
.hp-signin{font-size:13px;color:rgba(244,239,232,.5);cursor:pointer;background:none;border:none;font-family:var(--sans);transition:color .15s}
.hp-signin:hover{color:rgba(244,239,232,.85)}
.hp-cta-sm{background:var(--amber);color:var(--ink);padding:10px 24px;border-radius:50px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:var(--sans);transition:all .2s;white-space:nowrap}
.hp-cta-sm:hover{background:var(--amber2);transform:translateY(-1px)}

/* sticky mobile */
.hp-sticky{position:fixed;bottom:0;left:0;right:0;z-index:200;padding:12px 16px 20px;background:linear-gradient(to top,rgba(8,12,24,1) 70%,rgba(8,12,24,0));display:none;transform:translateY(100%);transition:transform .35s cubic-bezier(.22,1,.36,1)}
.hp-sticky.show{transform:translateY(0)}
.hp-sticky-btn{width:100%;background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink);padding:15px;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;border:none;font-family:var(--sans);text-align:center}
@media(max-width:768px){.hp-sticky{display:block}}

/* hero */
.hero{background:radial-gradient(ellipse 100% 60% at 50% -5%,rgba(232,151,42,.08),transparent),var(--night);padding:80px 6% 100px;position:relative;overflow:hidden;text-align:center}
.hero-stars{position:absolute;inset:0;pointer-events:none;z-index:0}
.hero-star{position:absolute;border-radius:50%;background:#fff;animation:twinkle var(--d,4s) var(--dl,0s) ease-in-out infinite}
.hero-creatures{display:flex;justify-content:center;gap:16px;margin-bottom:28px;position:relative;z-index:2}
.hero-creature{font-size:52px;animation:float var(--d,3.5s) ease-in-out infinite var(--dl,0s);filter:drop-shadow(0 4px 16px rgba(0,0,0,.3))}
.hero-egg{font-size:48px;animation:rock 2.5s ease-in-out infinite,glow 3s ease-in-out infinite}
.hero-h{font-family:var(--serif);font-size:clamp(36px,5.5vw,68px);font-weight:900;line-height:1.08;letter-spacing:-.03em;color:var(--cream);margin-bottom:20px;position:relative;z-index:2}
.hero-h em{font-style:italic;color:var(--amber2)}
.hero-sub{font-size:clamp(15px,1.7vw,17px);color:rgba(244,239,232,.55);font-weight:300;line-height:1.82;margin:0 auto 32px;max-width:560px;position:relative;z-index:2}
.hero-sub strong{color:rgba(244,239,232,.85);font-weight:500}
.hero-cta-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;position:relative;z-index:2}
.hero-cta{background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink);padding:16px 36px;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;border:none;font-family:var(--sans);transition:all .2s}
.hero-cta:hover{filter:brightness(1.1);transform:translateY(-2px)}
.hero-ghost{background:rgba(255,255,255,.05);color:rgba(244,239,232,.6);padding:16px 28px;border-radius:14px;font-size:15px;font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,.1);font-family:var(--sans);transition:all .2s}
.hero-ghost:hover{background:rgba(255,255,255,.09)}
.hero-trust{display:flex;gap:20px;flex-wrap:wrap;justify-content:center;position:relative;z-index:2}
.hero-trust-item{font-size:11px;color:rgba(244,239,232,.32);display:flex;align-items:center;gap:5px;font-family:var(--mono)}
.hero-trust-item::before{content:'✓';color:var(--teal2);font-weight:700}

/* section helpers */
.sec-kicker{font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-family:var(--mono);color:rgba(232,151,42,.6);font-weight:700;margin-bottom:18px;display:block}
.sec-header{text-align:center;margin-bottom:64px}
.sec-header h2{font-family:var(--serif);font-size:clamp(30px,4.5vw,56px);font-weight:700;color:var(--cream);line-height:1.1;letter-spacing:-.03em;margin-bottom:16px}
.sec-header h2 em{font-style:italic;color:var(--amber2)}
.sec-header p{font-size:16px;color:rgba(244,239,232,.48);font-weight:300;line-height:1.75;max-width:520px;margin:0 auto}

/* how magic works */
.magic-sec{padding:100px 6%;background:linear-gradient(180deg,var(--night),var(--night2))}
.magic-inner{max-width:1000px;margin:0 auto}
.magic-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
@media(max-width:768px){.magic-grid{grid-template-columns:1fr}}
.magic-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:32px 24px;text-align:center;position:relative;overflow:hidden;transition:all .22s}
.magic-card:hover{background:rgba(255,255,255,.04);transform:translateY(-3px)}
.magic-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.magic-card.amber::before{background:linear-gradient(90deg,transparent,rgba(232,151,42,.5),transparent)}
.magic-card.teal::before{background:linear-gradient(90deg,transparent,rgba(93,202,165,.5),transparent)}
.magic-card.purple::before{background:linear-gradient(90deg,transparent,rgba(180,140,255,.5),transparent)}
.magic-ico{font-size:48px;margin-bottom:14px;display:inline-block}
.magic-num{font-size:9px;font-family:var(--mono);color:rgba(255,255,255,.2);letter-spacing:.1em;margin-bottom:8px}
.magic-title{font-family:var(--serif);font-size:18px;font-weight:700;color:var(--cream);margin-bottom:8px}
.magic-desc{font-size:13.5px;color:rgba(244,239,232,.45);line-height:1.72;font-weight:300}

/* story preview */
.story-sec{padding:100px 6%;background:var(--night2)}
.story-inner{max-width:800px;margin:0 auto}
.book{background:linear-gradient(145deg,#F9F1E2,#F0E8D4);border-radius:20px;padding:44px 48px;text-align:left;box-shadow:0 28px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.8);position:relative;overflow:hidden}
.book::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#C87020,#E8972A,#C87020)}
@media(max-width:700px){.book{padding:28px 24px}}
.book-kicker{font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-family:var(--mono);color:#8A6830;margin-bottom:16px}
.book-title{font-family:var(--serif);font-size:clamp(18px,2.5vw,28px);font-weight:700;color:#2A1A00;margin-bottom:16px;line-height:1.25}
.book-title .cn{color:#C87020;font-style:italic}
.book-p{font-family:var(--serif);font-size:clamp(15px,1.6vw,17.5px);color:#3A2800;line-height:1.9;margin-bottom:18px}
.book-p .cn{color:#C87020;font-weight:700}
.book-p em{font-style:italic;color:#5A3800}
.book-refrain{background:rgba(200,112,32,.08);border-left:3px solid rgba(200,112,32,.38);border-radius:0 8px 8px 0;padding:14px 20px;font-family:var(--serif);font-size:15px;color:#5A3800;font-style:italic;line-height:1.68;margin-bottom:20px}
.book-footer{display:flex;align-items:center;justify-content:space-between;padding-top:14px;border-top:1px solid rgba(200,112,32,.14);font-size:10px;font-family:var(--mono);color:rgba(90,56,0,.35)}

/* night card fan */
.nc-sec{padding:100px 6%;background:var(--night)}
.nc-inner{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
@media(max-width:900px){.nc-inner{grid-template-columns:1fr;gap:40px}}
.nc-copy h2{font-family:var(--serif);font-size:clamp(28px,3.5vw,46px);font-weight:700;color:var(--cream);line-height:1.15;margin-bottom:20px}
.nc-copy h2 em{font-style:italic;color:var(--amber2)}
.nc-copy p{font-size:15px;color:rgba(244,239,232,.5);line-height:1.82;font-weight:300;margin-bottom:14px}
.nc-copy p strong{color:rgba(244,239,232,.82);font-weight:500}
.nc-fan{display:flex;gap:-10px;justify-content:center;position:relative}
.nc-mini{background:#F4EFE2;border-radius:12px;width:185px;box-shadow:0 14px 44px rgba(0,0,0,.55);transition:transform .3s;flex-shrink:0;overflow:hidden}
.nc-mini:nth-child(1){transform:rotate(-6deg) translateY(8px)}
.nc-mini:nth-child(2){transform:rotate(0deg);z-index:2;width:200px}
.nc-mini:nth-child(3){transform:rotate(5deg) translateY(12px)}
.nc-mini:hover{transform:rotate(0deg) translateY(-4px) scale(1.04);z-index:3}
.nc-mini-img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
.nc-mini-body{padding:12px 14px 14px}
.nc-mini-badge{font-size:7px;font-family:var(--mono);color:#8A6830;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
.nc-mini-quote{font-family:Georgia,serif;font-size:11.5px;font-style:italic;color:#2A1600;line-height:1.55;margin-bottom:8px}
.nc-mini-meta{font-size:8px;font-family:var(--mono);color:rgba(90,56,0,.35);display:flex;justify-content:space-between}

/* testimonials */
.proof-sec{padding:100px 6%;background:var(--night2)}
.proof-inner{max-width:1000px;margin:0 auto}
.testimonials{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
@media(max-width:900px){.testimonials{grid-template-columns:1fr}}
.tcard{background:#FFFDF7;border-radius:18px;padding:26px;border:1px solid rgba(26,20,32,.06);position:relative;overflow:hidden;transition:transform .22s}
.tcard:hover{transform:translateY(-3px)}
.tcard::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:3px 3px 0 0}
.tcard.amber::before{background:linear-gradient(90deg,#E8972A,rgba(232,151,42,.08))}
.tcard.teal::before{background:linear-gradient(90deg,#1D9E75,rgba(29,158,117,.08))}
.tcard.purple::before{background:linear-gradient(90deg,#b48cff,rgba(180,140,255,.08))}
.tcard-streak{display:inline-flex;align-items:center;gap:5px;border-radius:20px;padding:3px 10px;font-size:10px;font-family:var(--mono);margin-bottom:12px;border:1px solid transparent}
.tcard-streak::before{content:'✦';font-size:9px}
.tcard-streak.amber{background:rgba(232,151,42,.08);border-color:rgba(232,151,42,.16);color:#B07018}
.tcard-streak.teal{background:rgba(29,158,117,.07);border-color:rgba(29,158,117,.16);color:#1A7A58}
.tcard-streak.purple{background:rgba(180,140,255,.07);border-color:rgba(180,140,255,.16);color:#6A4AAA}
.tcard-quote{font-family:var(--serif);font-size:14px;font-style:italic;color:#3A3048;line-height:1.8;margin-bottom:14px}
.tcard-meta{display:flex;align-items:center;gap:10px}
.tcard-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;font-weight:700;font-family:var(--mono);flex-shrink:0}
.tcard-name{font-size:13px;font-weight:600;color:#2A2038}
.tcard-role{font-size:10px;color:#8A7888;margin-top:1px}

/* pricing */
.price-sec{padding:100px 6%;background:var(--night)}
.price-inner{max-width:800px;margin:0 auto}
.price-cards{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:48px}
@media(max-width:700px){.price-cards{grid-template-columns:1fr}}
.pcard{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px;position:relative;overflow:hidden}
.pcard.featured{background:linear-gradient(145deg,rgba(232,151,42,.06),rgba(200,112,32,.02));border-color:rgba(232,151,42,.28)}
.pcard-badge{position:absolute;top:16px;right:16px;background:var(--amber);color:var(--ink);border-radius:50px;padding:4px 12px;font-size:9px;font-weight:700;font-family:var(--mono);letter-spacing:.08em;text-transform:uppercase}
.pcard-tier{font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-family:var(--mono);color:rgba(232,151,42,.5);margin-bottom:12px;font-weight:700}
.pcard-price{font-family:var(--serif);font-size:46px;font-weight:900;color:var(--cream);line-height:1;margin-bottom:4px;display:flex;align-items:flex-start;gap:4px}
.pcard-price sup{font-size:20px;margin-top:8px}
.pcard-price sub{font-size:14px;color:rgba(244,239,232,.4);margin-bottom:4px;align-self:flex-end}
.pcard-annual{font-size:11px;color:rgba(244,239,232,.35);font-family:var(--mono);margin-bottom:4px}
.pcard-annual strong{color:rgba(232,151,42,.6)}
.pcard-note{font-size:11px;color:rgba(244,239,232,.3);margin-bottom:24px;font-family:var(--mono)}
.pcard-btn{width:100%;border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .2s;margin-bottom:22px}
.pcard-btn.outline{background:rgba(255,255,255,.05);color:rgba(244,239,232,.6);border:1px solid rgba(255,255,255,.1)}
.pcard-btn.outline:hover{background:rgba(255,255,255,.09)}
.pcard-btn.solid{background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink)}
.pcard-btn.solid:hover{filter:brightness(1.08);transform:translateY(-1px)}
.pcard-feats{display:flex;flex-direction:column;gap:8px}
.pcard-feat{font-size:13px;color:rgba(244,239,232,.48);display:flex;align-items:flex-start;gap:8px;line-height:1.45}
.pcard-feat::before{content:'✓';color:var(--teal2);font-weight:700;flex-shrink:0}
.pcard-feat.hl{color:rgba(244,239,232,.8);font-weight:500}

/* final cta */
.cta-sec{padding:120px 6%;background:var(--night);text-align:center;position:relative;overflow:hidden}
.cta-sec::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;height:400px;border-radius:50%;background:radial-gradient(ellipse,rgba(232,151,42,.06),transparent 60%);pointer-events:none}
.cta-sec h2{font-family:var(--serif);font-size:clamp(34px,5vw,62px);font-weight:900;color:var(--cream);line-height:1.1;letter-spacing:-.03em;margin-bottom:20px;position:relative;z-index:1}
.cta-sec h2 em{font-style:italic;color:var(--amber2)}
.cta-sec p{font-size:16px;color:rgba(244,239,232,.48);font-weight:300;line-height:1.82;max-width:480px;margin:0 auto 36px;position:relative;z-index:1}
.cta-sec p strong{color:rgba(244,239,232,.8);font-weight:500}
.cta-btn{background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink);padding:18px 48px;border-radius:16px;font-size:16px;font-weight:700;cursor:pointer;border:none;font-family:var(--sans);transition:all .2s;position:relative;z-index:1;margin-bottom:14px}
.cta-btn:hover{filter:brightness(1.1);transform:translateY(-2px)}
.cta-note{font-size:11px;color:rgba(244,239,232,.25);margin-bottom:28px;font-family:var(--mono);position:relative;z-index:1}

/* footer */
.hp-footer{background:var(--night);padding:28px 6%;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;border-top:1px solid rgba(255,255,255,.05)}
.hp-footer-logo{font-family:var(--serif);font-size:16px;font-weight:700;color:rgba(244,239,232,.5);display:flex;align-items:center;gap:8px}
.hp-footer-tagline{font-size:11px;color:rgba(244,239,232,.2);font-style:italic;font-family:var(--serif);margin-top:3px}
.hp-footer-links{display:flex;gap:20px}
.hp-footer-link{font-size:12px;color:rgba(244,239,232,.25);background:none;border:none;cursor:pointer;font-family:var(--sans);transition:color .15s}
.hp-footer-link:hover{color:rgba(244,239,232,.6)}
.hp-footer-copy{font-size:11px;color:rgba(244,239,232,.15);font-family:var(--mono)}

@media(max-width:900px){.nc-inner{grid-template-columns:1fr}.testimonials{grid-template-columns:1fr}.price-cards{grid-template-columns:1fr}}
@media(max-width:640px){.hero,.magic-sec,.story-sec,.nc-sec,.proof-sec,.price-sec,.cta-sec{padding-left:5%;padding-right:5%}.hp-footer{flex-direction:column;text-align:center}.hp-footer-links{justify-content:center}}
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

  useEffect(() => {
    const c = starsRef.current;
    if (c) {
      for (let i = 0; i < 60; i++) {
        const s = document.createElement('div');
        s.className = 'hero-star';
        const sz = Math.random() < .25 ? 3 : Math.random() < .6 ? 2 : 1.2;
        s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${(2.5+Math.random()*4).toFixed(1)}s;--dl:${(Math.random()*5).toFixed(1)}s`;
        c.appendChild(s);
      }
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    document.querySelectorAll('.fu').forEach(el => obs.observe(el));
    const heroObs = new IntersectionObserver(entries => {
      setStickyShow(!entries[0].isIntersecting);
    }, { threshold: 0 });
    if (heroRef.current) heroObs.observe(heroRef.current);
    return () => { obs.disconnect(); heroObs.disconnect(); };
  }, []);

  return (
    <div className="hp">
      <style>{CSS}</style>

      {/* STICKY MOBILE */}
      <div className={`hp-sticky${stickyShow ? ' show' : ''}`}>
        <button className="hp-sticky-btn" onClick={onSignUp}>Start tonight — free ✦</button>
      </div>

      {/* NAV */}
      <nav className="hp-nav">
        <button className="hp-logo"><div className="hp-logo-moon" />SleepSeed</button>
        <div className="hp-nav-right">
          <button className="hp-signin" onClick={onSignIn}>Sign in</button>
          <button className="hp-cta-sm" onClick={onSignUp}>Start free ✦</button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO — creatures + egg visual
      ══════════════════════════════════════════════════════ */}
      <section className="hero" ref={heroRef}>
        <div className="hero-stars" ref={starsRef} />

        <div className="hero-creatures fu">
          <div className="hero-creature" style={{'--d':'3.5s','--dl':'0s'} as any}>🐰</div>
          <div className="hero-creature" style={{'--d':'4s','--dl':'-.8s'} as any}>🦊</div>
          <div className="hero-egg">🥚</div>
          <div className="hero-creature" style={{'--d':'3.8s','--dl':'-1.4s'} as any}>🐉</div>
          <div className="hero-creature" style={{'--d':'4.2s','--dl':'-.4s'} as any}>🦉</div>
        </div>

        <h1 className="hero-h fu d1">
          The 20 minutes before sleep<br />
          are the <em>most important</em><br />
          of the day.
        </h1>

        <p className="hero-sub fu d2">
          Every night, a story starring your child. A creature companion that grows with them.
          A Night Card that captures what they said before sleep.{' '}
          <strong>SleepSeed turns bedtime into the moment they look forward to most.</strong>
        </p>

        <div className="hero-cta-row fu d3">
          <button className="hero-cta" onClick={onSignUp}>Start tonight — it's free ✦</button>
          <button className="hero-ghost" onClick={onSignIn}>Sign in</button>
        </div>

        <div className="hero-trust fu d4">
          <span className="hero-trust-item">3 rituals free</span>
          <span className="hero-trust-item">No credit card</span>
          <span className="hero-trust-item">Ages 3–11</span>
          <span className="hero-trust-item">No ads, ever</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW THE MAGIC WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="magic-sec">
        <div className="magic-inner">
          <div className="sec-header">
            <span className="sec-kicker fu">How the magic works</span>
            <h2 className="fu d1">Stories. Creatures. <em>Memories.</em></h2>
            <p className="fu d2">Every night builds something real — a story from their day, a creature that grows, a memory that lasts.</p>
          </div>
          <div className="magic-grid">
            <div className="magic-card amber fu">
              <div className="magic-ico" style={{animation:'float 3.5s ease-in-out infinite'}}>🌙</div>
              <div className="magic-num">EVERY NIGHT</div>
              <div className="magic-title">Tell tonight's story</div>
              <div className="magic-desc">Share what happened today. In 30 seconds, a personalised story appears — starring your child, built from their real day, at their reading level.</div>
            </div>
            <div className="magic-card teal fu d1">
              <div className="magic-ico" style={{animation:'rock 2.5s ease-in-out infinite,glow 3s ease-in-out infinite'}}>🥚</div>
              <div className="magic-num">EVERY 7 NIGHTS</div>
              <div className="magic-title">Watch the egg crack</div>
              <div className="magic-desc">Every bedtime ritual cracks the egg a little more. After 7 nights, it hatches into a new creature companion. Name it. Photograph it. Collect them all.</div>
            </div>
            <div className="magic-card purple fu d2">
              <div className="magic-ico" style={{animation:'float 4s ease-in-out infinite',animationDelay:'-.8s'}}>🐰</div>
              <div className="magic-num">FOREVER</div>
              <div className="magic-title">Your Night Card library</div>
              <div className="magic-desc">Every night creates a Night Card — what they said, how they felt, the question that opened them up. A record of childhood you'll treasure forever.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CREATURE STORY PREVIEW
      ══════════════════════════════════════════════════════ */}
      <section className="story-sec">
        <div className="story-inner">
          <div className="sec-header">
            <span className="sec-kicker fu">Tonight's story</span>
            <h2 className="fu d1">Not a template. <em>Her story.</em></h2>
            <p className="fu d2">Every story features your child AND their creature companion — woven into the adventure naturally.</p>
          </div>
          <div className="book fu d1">
            <div className="book-kicker">Tonight's story · Built from these choices:</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
              {[
                {ico:'🧒',label:'Adina, age 4'},
                {ico:'🦉',label:'Moonlight the Owl'},
                {ico:'💛',label:'Kind & gentle'},
                {ico:'🌙',label:'Calm & cosy'},
                {ico:'📝',label:'"She was shy at school today"'},
              ].map((c,i)=>(
                <span key={i} style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:10,padding:'4px 10px',borderRadius:20,background:'rgba(200,112,32,.08)',border:'1px solid rgba(200,112,32,.16)',color:'#8A5010',fontFamily:'var(--mono)',whiteSpace:'nowrap'}}>
                  {c.ico} {c.label}
                </span>
              ))}
            </div>
            <div className="book-title"><span className="cn">Adina</span> and the Shy Cloud</div>
            <p className="book-p">
              Up in the sky, all the clouds were making shapes. One made a bunny. One made a boat. But there was one little cloud hiding behind the moon. It didn't want to make anything at all.
            </p>
            <p className="book-p">
              "Look," said <span className="cn">Moonlight</span>, pointing with her wing. <span className="cn">Moonlight</span> always spotted things first because owls have <em>very</em> big eyes. "That cloud looks sad."
            </p>
            <p className="book-p">
              <span className="cn">Adina</span> climbed onto <span className="cn">Moonlight</span>'s back — very carefully, holding tight to her soft feathers — and together they flew all the way up. The little cloud was shaking. "Everyone else knows what shape to be," it said. "I don't know what I am yet."
            </p>
            <div className="book-refrain">
              <span className="cn">Adina</span> gave the cloud a gentle pat. "That's okay," she said. "You don't have to be a shape. You can just be you." <span className="cn">Moonlight</span> nodded her big owl head. The cloud stopped shaking. Then — very slowly — it made the most beautiful shape of all. It made a heart.
            </div>
            <div className="book-footer">
              <span>SleepSeed · Adina &amp; Moonlight · Night 23</span>
              <span>🦉 Moonlight joined the adventure</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          NIGHT CARDS
      ══════════════════════════════════════════════════════ */}
      <section className="nc-sec">
        <div className="nc-inner">
          <div className="nc-copy fu">
            <span className="sec-kicker">Night Cards</span>
            <h2>A record of childhood<br />you can <em>hold.</em></h2>
            <p>Every ritual night creates a Night Card — a keepsake of the moment. Their quote. The question that opened them up. The feeling in the room.</p>
            <p><strong>In ten years, most of this will be gone.</strong> Not because anything bad happened — just because that's how time works. Night Cards are the reason it isn't.</p>
          </div>
          <div className="nc-fan fu d1">
            <div className="nc-mini">
              <img className="nc-mini-img" src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop&crop=faces" alt="Happy child at home" />
              <div className="nc-mini-body">
                <div className="nc-mini-badge">🌙 Night 12</div>
                <div className="nc-mini-quote">"I was brave like the dragon. Even though my tummy was full of tangled string."</div>
                <div className="nc-mini-meta"><span>Adina · Age 6</span><span>⭐</span></div>
              </div>
            </div>
            <div className="nc-mini">
              <img className="nc-mini-img" src="/nightcard-hero.jpg" alt="Family bedtime moment" />
              <div className="nc-mini-body">
                <div className="nc-mini-badge">🌙 Night 34</div>
                <div className="nc-mini-quote">"The best three seconds was when you carried me to bed even though I'm not little anymore."</div>
                <div className="nc-mini-meta"><span>Adina · Age 6</span><span>⭐</span></div>
              </div>
            </div>
            <div className="nc-mini">
              <img className="nc-mini-img" src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=300&fit=crop&crop=faces" alt="Child sleeping" />
              <div className="nc-mini-body">
                <div className="nc-mini-badge">🌙 Night 47</div>
                <div className="nc-mini-quote">"I remember every dog I've ever met. In order of how much they understood me."</div>
                <div className="nc-mini-meta"><span>Adina · Age 6</span><span>⭐</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section className="proof-sec">
        <div className="proof-inner">
          <div className="sec-header">
            <span className="sec-kicker fu">What families say</span>
            <h2 className="fu d1">She won't go to bed<br />without checking on <em>her egg.</em></h2>
            <p className="fu d2">The ritual doesn't just change bedtime. It changes what bedtime feels like.</p>
          </div>
          <div className="testimonials">
            <div className="tcard amber fu">
              <div className="tcard-streak amber">122 nights · 17 creatures hatched</div>
              <p className="tcard-quote">"My daughter won't go to bed without checking on her egg first. She's hatched 17 creatures and named every single one. Bedtime went from something I dreaded to the part of the day we both look forward to most."</p>
              <div className="tcard-meta"><div className="tcard-av" style={{background:'linear-gradient(135deg,#D4A060,#B07020)'}}>S</div><div><div className="tcard-name">Sarah M.</div><div className="tcard-role">Mum of two · ages 4 &amp; 7</div></div></div>
            </div>
            <div className="tcard teal fu d1">
              <div className="tcard-streak teal">47 nights · Ember is his best friend</div>
              <p className="tcard-quote">"My son has anxiety about school. The stories let him work through things he couldn't say directly — and Ember, his Fox, makes him feel brave. I've learned more about what's actually scaring him than from a year of asking 'how was your day.'"</p>
              <div className="tcard-meta"><div className="tcard-av" style={{background:'linear-gradient(135deg,#2AB89A,#1A8A70)'}}>J</div><div><div className="tcard-name">James K.</div><div className="tcard-role">Dad of one · age 8</div></div></div>
            </div>
            <div className="tcard purple fu d2">
              <div className="tcard-streak purple">Child therapist · recommends</div>
              <p className="tcard-quote">"The creature companion creates an emotional anchor — children project onto it in ways that open real conversations. The egg mechanic is brilliant for building consistent bedtime habits. I recommend it to every family I work with."</p>
              <div className="tcard-meta"><div className="tcard-av" style={{background:'linear-gradient(135deg,#b48cff,#7040d0)'}}>L</div><div><div className="tcard-name">Dr. Lisa R.</div><div className="tcard-role">Child &amp; Family Therapist</div></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════ */}
      <section className="price-sec" id="pricing">
        <div className="price-inner">
          <div className="sec-header">
            <span className="sec-kicker fu">Pricing</span>
            <h2 className="fu d1">A record of childhood.<br /><em>For less than a coffee a month.</em></h2>
            <p className="fu d2">Start free. Keep every night with Family — unlimited stories, creatures, and Night Cards.</p>
          </div>
          <div className="price-cards">
            <div className="pcard fu">
              <div className="pcard-tier">Free</div>
              <div className="pcard-price"><sup>$</sup>0</div>
              <div className="pcard-note">3 rituals to try · no card needed</div>
              <button className="pcard-btn outline" onClick={onSignUp}>Begin tonight — free</button>
              <div className="pcard-feats">
                <div className="pcard-feat">3 personalised stories</div>
                <div className="pcard-feat">3 Night Cards</div>
                <div className="pcard-feat">Hatch your first creature</div>
                <div className="pcard-feat">All story vibes &amp; voice narration</div>
              </div>
            </div>
            <div className="pcard featured fu d1">
              <div className="pcard-badge">MOST POPULAR</div>
              <div className="pcard-tier">Family</div>
              <div className="pcard-price"><sup>$</sup>6<sub>.58/mo</sub></div>
              <div className="pcard-annual">Billed as <strong>$79/year</strong> — save 34%</div>
              <div className="pcard-note">or $9.99 month-to-month</div>
              <button className="pcard-btn solid" onClick={onSignUp}>Start tonight ✦</button>
              <div className="pcard-feats">
                <div className="pcard-feat hl">Unlimited rituals, every night</div>
                <div className="pcard-feat hl">Unlimited Night Cards — forever</div>
                <div className="pcard-feat hl">Unlimited creature companions</div>
                <div className="pcard-feat">Full Hatchery &amp; creature collection</div>
                <div className="pcard-feat">"On this night last year" memories</div>
                <div className="pcard-feat">Multiple children profiles</div>
                <div className="pcard-feat">Voice narration &amp; all story vibes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════ */}
      <section className="cta-sec">
        <div style={{fontSize:72,marginBottom:20,animation:'rock 2.5s ease-in-out infinite,glow 3s ease-in-out infinite',display:'inline-block',position:'relative',zIndex:1}}>🥚</div>
        <h2 className="fu">Their creature is<br /><em>waiting.</em></h2>
        <p className="fu d1">Tonight your child will say something true. Something they've been holding all day.{' '}<strong>Be there for it.</strong> The ritual takes twenty minutes. The Night Card lasts forever. And something inside the egg is starting to crack.</p>
        <button className="cta-btn fu d2" onClick={onSignUp}>Start tonight — it's free ✦</button>
        <div className="cta-note fu d3">3 rituals free · then $9.99/month or $79/year · cancel any time</div>
      </section>

      {/* FOOTER */}
      <footer className="hp-footer">
        <div>
          <div className="hp-footer-logo"><div className="hp-logo-moon" style={{width:17,height:17}} />SleepSeed</div>
          <div className="hp-footer-tagline">Bedtime, but magical. Every night.</div>
        </div>
        <div className="hp-footer-links">
          <button className="hp-footer-link">Privacy</button>
          <button className="hp-footer-link">Terms</button>
          <button className="hp-footer-link">hello@sleepseed.app</button>
        </div>
        <div className="hp-footer-copy">© 2026 SleepSeed. All rights reserved.</div>
      </footer>
    </div>
  );
}
