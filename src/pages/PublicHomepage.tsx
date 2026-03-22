import { useEffect, useRef, useState } from 'react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#080C18;--night2:#0D1120;--night3:#131828;
  --amber:#E8972A;--amber2:#F5B84C;--amber3:#CC7818;
  --teal:#1D9E75;--teal2:#5DCAA5;--rose:#C85070;
  --cream:#F4EFE8;--parch:#F8F1E4;
  --ink:#1A1420;--ink2:#3A3048;--ink3:#7A6888;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
.hp{background:var(--night);color:var(--cream);font-family:var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}

/* ── ANIMATIONS ── */
@keyframes twinkle{0%,100%{opacity:.06}50%{opacity:.55}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.6)}}
@keyframes moon-glow{0%,100%{box-shadow:0 0 20px rgba(245,184,76,.2),0 0 50px rgba(245,184,76,.06)}50%{box-shadow:0 0 38px rgba(245,184,76,.4),0 0 80px rgba(245,184,76,.15)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes waveL{0%,100%{height:6px}25%{height:18px}50%{height:10px}75%{height:22px}}
@keyframes waveM{0%,100%{height:10px}30%{height:28px}60%{height:16px}80%{height:32px}}
@keyframes waveS{0%,100%{height:4px}35%{height:14px}65%{height:8px}}

/* ── FADE UP ── */
.fu{opacity:0;transform:translateY(30px);transition:opacity .72s cubic-bezier(.22,1,.36,1),transform .72s cubic-bezier(.22,1,.36,1)}
.fu.vis{opacity:1;transform:none}
.fu.d1{transition-delay:.1s}.fu.d2{transition-delay:.2s}.fu.d3{transition-delay:.3s}.fu.d4{transition-delay:.4s}

/* ── NAV ── */
.hp-nav{background:rgba(8,12,24,.97);backdrop-filter:blur(20px);border-bottom:1px solid rgba(232,151,42,.1);padding:0 6%;display:flex;align-items:center;justify-content:space-between;height:68px;position:sticky;top:0;z-index:100}
.hp-logo{font-family:var(--serif);font-size:20px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:10px;cursor:pointer;border:none;background:none}
.hp-logo-moon{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#F5C060,#C87020);flex-shrink:0}
.hp-nav-links{display:flex;gap:28px}
.hp-nl{font-size:13px;color:rgba(244,239,232,.45);cursor:pointer;font-weight:400;transition:color .15s;background:none;border:none;font-family:var(--sans)}
.hp-nl:hover{color:rgba(244,239,232,.85)}
.hp-nav-right{display:flex;align-items:center;gap:12px}
.hp-signin{font-size:13px;color:rgba(244,239,232,.5);cursor:pointer;background:none;border:none;font-family:var(--sans);transition:color .15s}
.hp-signin:hover{color:rgba(244,239,232,.85)}
.hp-cta-sm{background:var(--amber);color:var(--ink);padding:10px 24px;border-radius:50px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:var(--sans);transition:all .2s;white-space:nowrap}
.hp-cta-sm:hover{background:var(--amber2);transform:translateY(-1px)}

/* ── STICKY MOBILE CTA ── */
.hp-sticky-cta{position:fixed;bottom:0;left:0;right:0;z-index:200;padding:12px 16px 20px;background:linear-gradient(to top,rgba(8,12,24,1) 70%,rgba(8,12,24,0));display:none;flex-direction:column;align-items:stretch;transform:translateY(100%);transition:transform .35s cubic-bezier(.22,1,.36,1)}
.hp-sticky-cta.show{transform:translateY(0)}
.hp-sticky-btn{background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink);padding:15px;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;border:none;font-family:var(--sans);text-align:center}
.hp-sticky-note{font-size:9.5px;color:rgba(255,255,255,.3);font-family:var(--mono);text-align:center;margin-top:5px}
@media(max-width:768px){.hp-sticky-cta{display:flex}}

/* ── HERO ── */
.hero{background:radial-gradient(ellipse 90% 55% at 50% -5%,rgba(232,151,42,.09),transparent),var(--night);display:grid;grid-template-columns:1fr 340px;align-items:center;gap:56px;padding:96px 6% 96px;position:relative;overflow:hidden}
@media(max-width:960px){.hero{grid-template-columns:1fr;padding:80px 6% 90px}}
.hero-stars{position:absolute;inset:0;pointer-events:none;z-index:0}
.hero-star{position:absolute;border-radius:50%;background:#FFF8E8;animation:twinkle var(--d,4s) var(--dl,0s) ease-in-out infinite}
.hero-glow-orb{position:absolute;bottom:-180px;left:40%;width:700px;height:380px;border-radius:50%;background:radial-gradient(ellipse,rgba(232,151,42,.07),transparent 65%);pointer-events:none}
.hero-left{position:relative;z-index:2}
.hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(232,151,42,.1);border:1px solid rgba(232,151,42,.22);border-radius:50px;padding:7px 18px;font-size:10.5px;font-family:var(--mono);color:var(--amber2);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:32px}
.hero-eyebrow-dot{width:6px;height:6px;border-radius:50%;background:var(--amber);animation:pulse 2.5s ease-in-out infinite;flex-shrink:0}
.hero-h{font-family:var(--serif);font-size:clamp(40px,5.5vw,70px);font-weight:900;line-height:1.07;letter-spacing:-.03em;color:var(--cream);margin-bottom:22px}
.hero-h em{font-style:italic;color:var(--amber2)}
.hero-h .dim{color:rgba(244,239,232,.52);font-style:normal;font-weight:700}
.hero-sub{font-size:clamp(15px,1.7vw,17px);color:rgba(244,239,232,.6);font-weight:300;line-height:1.82;margin-bottom:28px;max-width:520px}
.hero-sub strong{color:rgba(244,239,232,.88);font-weight:500}
.hero-age-label{font-size:10.5px;color:rgba(244,239,232,.32);font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px}
.hero-age-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}
.hero-age-pill{border-radius:20px;padding:5px 12px;font-size:12px;cursor:pointer;font-family:var(--sans);transition:all .15s;border:.5px solid rgba(255,255,255,.09);background:rgba(255,255,255,.03);color:rgba(244,239,232,.38)}
.hero-age-pill.sel{border-color:rgba(232,151,42,.35);background:rgba(232,151,42,.08);color:rgba(232,151,42,.85)}
.hero-age-note{font-size:11px;color:rgba(244,239,232,.35);font-style:italic;min-height:14px;margin-bottom:18px;font-weight:300}
.hero-name-row{display:flex;background:rgba(255,255,255,.06);border:1.5px solid rgba(232,151,42,.28);border-radius:14px;overflow:hidden;margin-bottom:14px;max-width:500px;transition:border-color .2s,box-shadow .2s}
.hero-name-row:focus-within{border-color:var(--amber);box-shadow:0 0 0 4px rgba(232,151,42,.08)}
.hero-name-input{flex:1;background:none;border:none;padding:15px 20px;font-size:15px;color:var(--cream);font-family:var(--sans);outline:none;min-width:0}
.hero-name-input::placeholder{color:rgba(244,239,232,.2);font-style:italic}
.hero-cta-primary{background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink);padding:15px 26px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:var(--sans);white-space:nowrap;flex-shrink:0;transition:filter .2s}
.hero-cta-primary:hover{filter:brightness(1.1)}
.hero-cta-ghost{background:rgba(255,255,255,.05);color:rgba(244,239,232,.65);padding:13px 24px;border-radius:13px;font-size:14px;font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,.1);font-family:var(--sans);transition:all .2s;margin-bottom:22px}
.hero-cta-ghost:hover{background:rgba(255,255,255,.09)}
.hero-trust{display:flex;gap:20px;flex-wrap:wrap}
.hero-trust-item{font-size:11.5px;color:rgba(244,239,232,.35);display:flex;align-items:center;gap:5px;font-family:var(--mono)}
.hero-trust-item::before{content:'✓';color:var(--teal2);font-weight:700}

/* phone mock */
.hero-right{position:relative;z-index:2;display:flex;justify-content:center}
@media(max-width:960px){.hero-right{display:none}}
.phone-mock{width:250px;background:#080C18;border-radius:36px;border:4px solid #0A0A1E;box-shadow:0 0 0 1.5px #1E1E3A,0 28px 72px rgba(0,0,0,.72),0 0 60px rgba(232,151,42,.06);animation:float 5s ease-in-out infinite}
.phone-notch{width:64px;height:13px;background:#0A0A1E;border-radius:0 0 8px 8px;margin:0 auto}
.phone-screen{background:linear-gradient(180deg,#030810 0%,#080C18 60%);padding:10px 9px 16px;min-height:440px;border-radius:0 0 30px 30px;position:relative;overflow:hidden}
.pnav{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;position:relative;z-index:2}
.pnav-logo{font-family:var(--serif);font-size:9px;font-weight:700;color:var(--cream)}
.pnav-badge{background:rgba(20,26,50,.9);border:.5px solid rgba(255,255,255,.07);border-radius:20px;padding:2px 7px;font-size:6.5px;color:var(--amber);font-family:monospace}
.p-ritual{background:rgba(10,15,34,.98);border:1.5px solid var(--amber);border-radius:10px;padding:9px 10px;margin-bottom:7px;position:relative;z-index:2}
.p-ritual-lbl{font-size:6px;letter-spacing:.08em;color:var(--amber);font-weight:700;text-transform:uppercase;font-family:monospace;margin-bottom:3px}
.p-ritual-q{font-family:var(--serif);font-size:9.5px;color:var(--cream);line-height:1.35;margin-bottom:6px}
.p-ritual-q em{color:var(--amber2);font-style:italic}
.p-ritual-btn{width:100%;background:linear-gradient(135deg,#E8972A,#CC7818);border:none;border-radius:6px;padding:6px;font-size:8.5px;font-weight:700;color:#120800;font-family:var(--sans)}
.p-cards{display:flex;gap:4px;margin-bottom:7px;position:relative;z-index:2}
.p-card{flex:1;border-radius:7px;padding:6px 5px;display:flex;flex-direction:column;align-items:flex-start;min-height:50px}
.p-card.create{background:linear-gradient(145deg,rgba(232,151,42,.14),rgba(200,110,18,.07));border:1px solid rgba(232,151,42,.22)}
.p-card.lib{background:linear-gradient(145deg,rgba(90,120,220,.12),rgba(60,80,180,.06));border:1px solid rgba(100,130,255,.17)}
.p-card.nc{background:linear-gradient(145deg,rgba(150,90,240,.12),rgba(110,60,200,.06));border:1px solid rgba(160,110,255,.17)}
.p-card-icon{font-size:11px;line-height:1;margin-bottom:3px}
.p-card-title{font-size:7px;font-weight:600;color:var(--cream);line-height:1.2}
.p-card-stat{font-size:6px;color:rgba(244,239,232,.3);font-family:monospace}
.p-glow{background:rgba(255,255,255,.016);border:1px solid rgba(255,255,255,.045);border-radius:8px;padding:7px 9px;position:relative;z-index:2}
.p-glow-name{font-size:6.5px;color:rgba(90,72,32,.85);font-style:italic;font-family:var(--serif);margin-bottom:3px}
.p-stars{display:flex;gap:2px;align-items:center}
.p-star{font-size:7px;color:#B07808}
.p-star.dim{color:#0E1220}

/* ── PROBLEM ── */
.problem-sec{padding:120px 6%;background:var(--night)}
.problem-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
@media(max-width:900px){.problem-inner{grid-template-columns:1fr;gap:48px}}
.sec-kicker{font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-family:var(--mono);color:rgba(232,151,42,.65);font-weight:700;margin-bottom:18px;display:block}
.p-timeline{display:flex;flex-direction:column}
.p-row{display:flex;align-items:baseline;gap:18px;padding:14px 0;border-bottom:.5px solid rgba(255,255,255,.05)}
.p-row:last-child{border-bottom:none}
.p-time{font-family:var(--mono);font-size:12px;color:rgba(255,255,255,.22);width:40px;flex-shrink:0}
.p-text{font-size:15px;color:rgba(244,239,232,.42);line-height:1.6;font-weight:300}
.p-row.now .p-time{color:var(--amber2)}
.p-row.now .p-text{color:var(--cream);font-weight:500}
.p-row.now{border-bottom:none;padding-top:22px;margin-top:6px}
.p-now-label{font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-family:var(--mono);color:rgba(232,151,42,.5);margin-left:58px;margin-bottom:-8px;display:block}
.problem-copy h2{font-family:var(--serif);font-size:clamp(28px,3.5vw,46px);font-weight:700;color:var(--cream);line-height:1.18;letter-spacing:-.02em;margin-bottom:22px}
.problem-copy h2 em{font-style:italic;color:var(--amber2)}
.problem-copy p{font-size:16px;color:rgba(244,239,232,.55);line-height:1.88;font-weight:300;margin-bottom:18px}
.problem-copy p strong{color:rgba(244,239,232,.82);font-weight:500}
.problem-link{display:inline-flex;align-items:center;gap:8px;background:rgba(232,151,42,.08);border:1px solid rgba(232,151,42,.2);border-radius:50px;padding:10px 22px;font-size:12.5px;color:var(--amber2);cursor:pointer;font-family:var(--sans);font-weight:500;transition:all .2s;margin-top:4px}
.problem-link:hover{background:rgba(232,151,42,.16)}

/* ── DIFF STATEMENT ── */
.diff-sec{padding:64px 6%;background:var(--night)}
.diff-inner{max-width:820px;margin:0 auto;text-align:center}
.diff-divider{width:56px;height:1.5px;background:linear-gradient(90deg,transparent,rgba(232,151,42,.4),transparent);margin:20px auto}
.diff-line{font-family:var(--serif);font-size:clamp(19px,2.8vw,30px);color:rgba(244,239,232,.7);line-height:1.65;font-weight:400;font-style:italic}
.diff-line em{color:var(--amber2)}
.diff-line strong{color:var(--cream);font-style:normal;font-weight:700}

/* ── RITUAL ── */
.ritual-sec{padding:120px 6%;background:linear-gradient(180deg,var(--night) 0%,var(--night2) 50%,var(--night) 100%)}
.ritual-inner{max-width:1100px;margin:0 auto}
.sec-header{text-align:center;margin-bottom:72px}
.sec-header h2{font-family:var(--serif);font-size:clamp(32px,4.5vw,58px);font-weight:700;color:var(--cream);line-height:1.1;letter-spacing:-.03em;margin-bottom:16px}
.sec-header h2 em{font-style:italic;color:var(--amber2)}
.sec-header p{font-size:17px;color:rgba(244,239,232,.5);font-weight:300;line-height:1.75;max-width:500px;margin:0 auto}
.ritual-loop{display:grid;grid-template-columns:1fr 1fr 1.5fr 1.5fr;gap:2px;margin-bottom:52px}
@media(max-width:900px){.ritual-loop{grid-template-columns:1fr 1fr;gap:8px}}
@media(max-width:500px){.ritual-loop{grid-template-columns:1fr}}
.ls{background:rgba(255,255,255,.024);border:1px solid rgba(255,255,255,.06);padding:30px 24px;position:relative;transition:background .2s}
.ls:hover{background:rgba(255,255,255,.04)}
.ls:first-child{border-radius:16px 0 0 16px}
.ls:last-child{border-radius:0 16px 16px 0}
@media(max-width:900px){.ls{border-radius:12px !important}}
.ls::after{content:'→';position:absolute;right:-13px;top:50%;transform:translateY(-50%);font-size:14px;color:rgba(255,255,255,.13);z-index:1}
.ls:last-child::after{content:none}
@media(max-width:900px){.ls::after{display:none}}
.ls.prep{opacity:.85}
.ls.peak{background:rgba(232,151,42,.04);border-color:rgba(232,151,42,.14)}
.ls-num{font-family:var(--mono);font-size:9px;color:rgba(232,151,42,.38);letter-spacing:.1em;margin-bottom:12px}
.ls-icon{font-size:24px;margin-bottom:12px;display:block;line-height:1;transition:transform .2s}
.ls:hover .ls-icon{transform:scale(1.1)}
.ls.peak .ls-icon{font-size:28px}
.ls-peak-note{font-size:8.5px;color:rgba(232,151,42,.5);font-family:var(--mono);letter-spacing:.07em;text-transform:uppercase;display:block;margin-bottom:6px}
.ls-title{font-family:var(--serif);font-weight:700;color:var(--cream);margin-bottom:7px;line-height:1.3;font-size:15px}
.ls.peak .ls-title{font-size:17px;color:var(--amber2)}
.ls-desc{font-size:13px;color:rgba(244,239,232,.42);line-height:1.75;font-weight:300}
.ritual-arc{background:rgba(232,151,42,.04);border:1px solid rgba(232,151,42,.12);border-radius:18px;padding:32px 40px;display:flex;align-items:center;justify-content:space-between;gap:28px;flex-wrap:wrap}
.arc-left h3{font-family:var(--serif);font-size:20px;font-weight:700;color:var(--cream);margin-bottom:8px}
.arc-left p{font-size:14.5px;color:rgba(244,239,232,.5);line-height:1.75;max-width:480px;font-weight:300}
.arc-stats{display:flex;gap:48px;flex-wrap:wrap;justify-content:center}
.arc-num{font-family:var(--serif);font-size:52px;font-weight:900;color:var(--amber2);line-height:1;display:block}
.arc-lbl{font-size:10.5px;color:rgba(244,239,232,.38);font-family:var(--mono);letter-spacing:.08em;text-transform:uppercase;margin-top:5px;display:block}

/* ── ARCHIVE ── */
.archive-sec{padding:120px 6%;background:var(--night2)}
.archive-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
@media(max-width:900px){.archive-inner{grid-template-columns:1fr;gap:56px}}
.archive-copy h2{font-family:var(--serif);font-size:clamp(30px,3.8vw,50px);font-weight:700;color:var(--cream);line-height:1.15;letter-spacing:-.02em;margin-bottom:22px}
.archive-copy h2 em{font-style:italic;color:var(--amber2)}
.archive-copy p{font-size:16px;color:rgba(244,239,232,.55);line-height:1.85;font-weight:300;margin-bottom:16px}
.archive-copy p strong{color:rgba(244,239,232,.82);font-weight:500}
.milestones{display:flex;flex-direction:column;gap:10px;margin-top:28px}
.milestone{display:flex;align-items:center;gap:16px;padding:12px 16px;background:rgba(255,255,255,.024);border-radius:12px;border:.5px solid rgba(255,255,255,.07)}
.milestone-num{font-family:var(--serif);font-size:24px;font-weight:700;color:var(--amber2);min-width:46px}
.milestone-text{font-size:13px;color:rgba(244,239,232,.52);line-height:1.55;font-weight:300}
.milestone-text strong{color:rgba(244,239,232,.82);font-weight:500}
/* live night card */
.nc-live-wrap{position:relative}
.nc-live-lbl{font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-family:var(--mono);color:rgba(232,151,42,.5);margin-bottom:14px;display:flex;align-items:center;gap:6px}
.nc-live-dot{width:5px;height:5px;border-radius:50%;background:var(--amber);animation:pulse 2s ease-in-out infinite}
.nc-card{background:#F4EFE2;border-radius:4px;box-shadow:0 18px 56px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.05);overflow:hidden;max-width:330px;transform:rotate(-1.5deg);transition:transform .3s}
.nc-card:hover{transform:rotate(0deg) scale(1.02)}
.nc-img{aspect-ratio:4/5;position:relative;overflow:hidden;background:linear-gradient(135deg,#080A14,#0E0A20);display:flex;align-items:center;justify-content:center}
.nc-img img{width:100%;height:100%;object-fit:cover;object-position:center center;display:block}
.nc-img-overlay{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.48) 0%,transparent 55%);pointer-events:none}
.nc-img-moon{width:50px;height:50px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden;animation:moon-glow 3.5s ease-in-out infinite}
.nc-img-moon-sh{position:absolute;width:48px;height:48px;border-radius:50%;background:#06080E;top:-7px;left:-11px}
.nc-img-title{position:absolute;bottom:9px;left:0;right:0;text-align:center;font-family:Georgia,serif;font-size:10px;font-style:italic;color:rgba(255,215,130,.75);z-index:1}
.nc-body{padding:13px 14px 20px}
.nc-origin-badge{font-size:7px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(232,151,42,.7);margin-bottom:6px;font-family:monospace;display:block}
.nc-quote{font-family:Georgia,serif;font-size:14px;font-style:italic;color:#2A1600;line-height:1.55;margin-bottom:10px;font-weight:700}
.nc-chips{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.nc-chip{border-radius:6px;padding:7px 10px;background:rgba(180,120,20,.06);border:1px solid rgba(180,120,20,.12)}
.nc-chip-q{font-size:7.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#7A5010;margin-bottom:2px;font-family:monospace}
.nc-chip-a{font-size:11.5px;color:#3A2000;line-height:1.45;font-style:italic;font-family:Georgia,serif}
.nc-meta{display:flex;align-items:center;justify-content:space-between;font-family:monospace;font-size:7px;color:rgba(74,48,0,.4);border-top:1px solid rgba(0,0,0,.06);padding-top:8px}

/* ── STORY ── */
.story-sec{padding:120px 6%;background:var(--night)}
.story-inner{max-width:900px;margin:0 auto;text-align:center}
.story-sec-h{font-family:var(--serif);font-size:clamp(28px,3.8vw,48px);font-weight:700;color:var(--cream);letter-spacing:-.02em;line-height:1.15;margin-bottom:12px}
.story-sec-h em{font-style:italic;color:var(--amber2)}
.story-sec-sub{font-size:16px;color:rgba(244,239,232,.5);font-weight:300;line-height:1.75;max-width:480px;margin:0 auto 52px}
.book{background:linear-gradient(145deg,#F9F1E2,#F0E8D4);border-radius:20px;padding:48px 52px;text-align:left;box-shadow:0 28px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.8);position:relative;overflow:hidden}
.book::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#C87020,#E8972A,#C87020)}
@media(max-width:700px){.book{padding:32px 28px}}
.book-kicker{font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-family:var(--mono);color:#8A6830;margin-bottom:18px}
.book-title{font-family:var(--serif);font-size:clamp(20px,2.8vw,30px);font-weight:700;color:#2A1A00;margin-bottom:6px;line-height:1.2}
.book-hero-name{color:#C87020;font-style:italic}
.book-tags{display:flex;gap:8px;margin-bottom:28px;flex-wrap:wrap}
.book-tag{font-size:10px;padding:3px 10px;border-radius:20px;font-family:var(--mono);background:rgba(200,112,32,.1);color:#8A5010;border:1px solid rgba(200,112,32,.2)}
.book-p{font-family:var(--serif);font-size:clamp(16px,1.8vw,18.5px);color:#3A2800;line-height:1.9;margin-bottom:20px}
.book-p .cn{color:#C87020;font-weight:700}
.book-p em{font-style:italic;color:#5A3800}
.book-refrain{background:rgba(200,112,32,.08);border-left:3px solid rgba(200,112,32,.38);border-radius:0 8px 8px 0;padding:13px 20px;font-family:var(--serif);font-size:15.5px;color:#5A3800;font-style:italic;line-height:1.68;margin-top:22px;margin-bottom:24px}
.audio-player{display:flex;align-items:center;gap:16px;background:rgba(200,112,32,.07);border:1px solid rgba(200,112,32,.18);border-radius:14px;padding:14px 18px}
.audio-play-btn{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#E8972A,#CC7818);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:16px;color:#120800;transition:filter .2s,transform .15s}
.audio-play-btn:hover{filter:brightness(1.1);transform:scale(1.06)}
.audio-info{flex:1;min-width:0}
.audio-label{font-size:9.5px;color:#8A6830;font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
.audio-title-line{font-family:var(--serif);font-size:13px;color:#3A2800;font-style:italic}
.audio-note{font-size:10px;color:#7A5830;font-family:var(--mono);margin-top:2px}
.audio-waves{display:flex;align-items:center;gap:3px;height:36px;flex-shrink:0}
.wave-bar{width:3px;background:rgba(200,112,32,.3);border-radius:2px;height:6px}
.wave-bar.playing{animation-duration:.8s;animation-iteration-count:infinite;animation-timing-function:ease-in-out}
.wave-bar:nth-child(1){animation-name:waveS;animation-delay:0s}
.wave-bar:nth-child(2){animation-name:waveM;animation-delay:.1s}
.wave-bar:nth-child(3){animation-name:waveL;animation-delay:.2s}
.wave-bar:nth-child(4){animation-name:waveM;animation-delay:.05s}
.wave-bar:nth-child(5){animation-name:waveS;animation-delay:.15s}
.wave-bar:nth-child(6){animation-name:waveL;animation-delay:.25s}
.wave-bar:nth-child(7){animation-name:waveM;animation-delay:.1s}
.book-footer{display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid rgba(200,112,32,.14);font-size:11px;font-family:var(--mono);color:rgba(90,56,0,.38)}

/* ── PEAK QUOTE ── */
.peak-sec{padding:80px 6%;background:var(--night)}
.peak-inner{max-width:740px;margin:0 auto;text-align:center}
.peak-who{font-size:11px;color:rgba(244,239,232,.24);font-family:var(--mono);letter-spacing:.1em;text-transform:uppercase;margin-bottom:20px}
.peak-quote{font-family:var(--serif);font-size:clamp(18px,2.8vw,32px);font-style:italic;color:rgba(244,239,232,.72);line-height:1.62;margin-bottom:22px}
.peak-quote em{color:var(--cream);font-style:italic;font-weight:700}
.peak-nc{display:inline-flex;align-items:center;gap:8px;background:rgba(29,158,117,.07);border:1px solid rgba(29,158,117,.18);border-radius:12px;padding:10px 18px;font-size:12.5px;font-style:italic;font-family:var(--serif);color:rgba(93,202,165,.82)}
.peak-nc-lbl{font-size:7.5px;font-family:var(--mono);color:rgba(93,202,165,.5);text-transform:uppercase;letter-spacing:.07em;margin-right:2px;font-style:normal}

/* ── PROOF ── */
.proof-sec{padding:120px 6%;background:linear-gradient(180deg,var(--night) 0%,var(--night2) 100%)}
.proof-inner{max-width:1100px;margin:0 auto}
.proof-sec .sec-header h2{color:var(--cream)}
.proof-sec .sec-header p{color:rgba(244,239,232,.48)}
.testimonials{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
@media(max-width:900px){.testimonials{grid-template-columns:1fr}}
.tcard{background:#FFFDF7;border-radius:18px;padding:28px;border:1px solid rgba(26,20,32,.06);position:relative;overflow:hidden;transition:transform .22s,box-shadow .22s}
.tcard:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(26,20,32,.1)}
.tcard::before{content:'';position:absolute;top:0;left:0;right:0;height:3.5px;border-radius:3px 3px 0 0}
.tcard.amber::before{background:linear-gradient(90deg,#E8972A,rgba(232,151,42,.08))}
.tcard.teal::before{background:linear-gradient(90deg,#1D9E75,rgba(29,158,117,.08))}
.tcard.rose::before{background:linear-gradient(90deg,#C85070,rgba(200,80,112,.08))}
.tcard-streak{display:inline-flex;align-items:center;gap:5px;border-radius:20px;padding:3px 10px;font-size:10px;font-family:var(--mono);margin-bottom:14px;border:1px solid transparent}
.tcard-streak::before{content:'✦';font-size:9px}
.tcard-streak.amber{background:rgba(232,151,42,.08);border-color:rgba(232,151,42,.16);color:#B07018}
.tcard-streak.teal{background:rgba(29,158,117,.07);border-color:rgba(29,158,117,.16);color:#1A7A58}
.tcard-streak.rose{background:rgba(200,80,112,.07);border-color:rgba(200,80,112,.16);color:#9A3050}
.tcard-quote{font-family:var(--serif);font-size:14.5px;font-style:italic;color:#3A3048;line-height:1.82;margin-bottom:18px}
.tcard-nc{background:#FAF4E8;border-radius:9px;padding:10px 13px;margin-bottom:18px;font-size:11px;font-family:var(--mono);color:#6A5030;line-height:1.6;border-left:2px solid rgba(200,112,32,.28)}
.tcard-nc-lbl{font-size:7.5px;text-transform:uppercase;letter-spacing:1px;color:#9A7848;margin-bottom:4px;font-weight:700}
.tcard-meta{display:flex;align-items:center;gap:10px}
.tcard-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:700;font-family:var(--mono);flex-shrink:0}
.tcard-name{font-size:13.5px;font-weight:600;color:#2A2038}
.tcard-role{font-size:11px;color:#8A7888;margin-top:1px}

/* ── PRICING ── */
.price-sec{padding:120px 6%;background:var(--night2)}
.price-inner{max-width:860px;margin:0 auto}
.price-sec .sec-header h2{color:var(--cream)}
.price-sec .sec-header p{color:rgba(244,239,232,.48);margin:0 auto}
.price-cards{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:56px}
@media(max-width:700px){.price-cards{grid-template-columns:1fr}}
.pcard{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:36px;position:relative;overflow:hidden}
.pcard.featured{background:linear-gradient(145deg,rgba(232,151,42,.07),rgba(200,112,32,.03));border-color:rgba(232,151,42,.3)}
.pcard-badge{position:absolute;top:18px;right:18px;background:var(--amber);color:var(--ink);border-radius:50px;padding:4px 12px;font-size:9.5px;font-weight:700;font-family:var(--mono);letter-spacing:.08em;text-transform:uppercase}
.pcard-tier{font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-family:var(--mono);color:rgba(232,151,42,.55);margin-bottom:14px;font-weight:700}
.pcard-price{font-family:var(--serif);font-size:48px;font-weight:900;color:var(--cream);line-height:1;margin-bottom:4px;display:flex;align-items:flex-start;gap:4px}
.pcard-price sup{font-size:20px;margin-top:9px}
.pcard-price sub{font-size:15px;color:rgba(244,239,232,.42);margin-bottom:5px;align-self:flex-end}
.pcard-annual{font-size:12px;color:rgba(244,239,232,.38);font-family:var(--mono);margin-bottom:5px}
.pcard-annual strong{color:rgba(232,151,42,.65)}
.pcard-note{font-size:11.5px;color:rgba(244,239,232,.32);margin-bottom:28px;font-family:var(--mono)}
.pcard-btn{width:100%;border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .2s;margin-bottom:24px}
.pcard-btn.outline{background:rgba(255,255,255,.05);color:rgba(244,239,232,.65);border:1px solid rgba(255,255,255,.1)}
.pcard-btn.outline:hover{background:rgba(255,255,255,.09)}
.pcard-btn.solid{background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink)}
.pcard-btn.solid:hover{filter:brightness(1.08);transform:translateY(-1px)}
.pcard-feats{display:flex;flex-direction:column;gap:9px}
.pcard-feat{font-size:13px;color:rgba(244,239,232,.52);display:flex;align-items:flex-start;gap:9px;line-height:1.45}
.pcard-feat::before{content:'✓';color:var(--teal2);font-weight:700;flex-shrink:0;margin-top:1px}
.pcard-feat.hl{color:rgba(244,239,232,.82);font-weight:500}
.price-note{background:rgba(232,151,42,.05);border:1px solid rgba(232,151,42,.14);border-radius:14px;padding:22px 30px;margin-top:28px;text-align:center}
.price-note p{font-family:var(--serif);font-size:16px;color:rgba(244,239,232,.65);font-style:italic;line-height:1.72}
.price-note p em{color:var(--amber2)}

/* ── FINAL CTA ── */
.cta-sec{padding:140px 6%;background:var(--night);text-align:center;position:relative;overflow:hidden}
.cta-sec::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;height:450px;border-radius:50%;background:radial-gradient(ellipse,rgba(232,151,42,.06),transparent 62%);pointer-events:none}
.cta-moon{width:64px;height:64px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden;margin:0 auto 32px;animation:moon-glow 3s ease-in-out infinite}
.cta-moon-sh{position:absolute;width:62px;height:62px;border-radius:50%;background:var(--night);top:-9px;left:-13px}
.cta-sec h2{font-family:var(--serif);font-size:clamp(38px,5.5vw,68px);font-weight:900;color:var(--cream);line-height:1.08;letter-spacing:-.03em;margin-bottom:22px;position:relative;z-index:1}
.cta-sec h2 em{font-style:italic;color:var(--amber2)}
.cta-sec p{font-size:17px;color:rgba(244,239,232,.52);font-weight:300;line-height:1.82;max-width:500px;margin:0 auto 44px;position:relative;z-index:1}
.cta-sec p strong{color:rgba(244,239,232,.82);font-weight:500}
.cta-btn{background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink);padding:20px 56px;border-radius:18px;font-size:17px;font-weight:600;cursor:pointer;border:none;font-family:var(--sans);transition:filter .2s,transform .15s;letter-spacing:.01em;position:relative;z-index:1;margin-bottom:16px}
.cta-btn:hover{filter:brightness(1.1);transform:translateY(-2px)}
.cta-note{font-size:12px;color:rgba(244,239,232,.26);margin-bottom:32px;font-family:var(--mono);position:relative;z-index:1}
.cta-note strong{color:rgba(244,239,232,.42)}
.cta-trust{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;position:relative;z-index:1}
.cta-trust-item{font-size:12px;color:rgba(244,239,232,.34);display:flex;align-items:center;gap:6px;font-family:var(--mono)}
.cta-trust-item::before{content:'✓';color:var(--teal2)}

/* ── FOOTER ── */
.footer-cta-band{background:rgba(232,151,42,.04);border-top:1px solid rgba(232,151,42,.1);border-bottom:1px solid rgba(232,151,42,.07);padding:32px 6%;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.footer-cta-copy{font-family:var(--serif);font-size:17px;color:rgba(244,239,232,.7);font-style:italic}
.footer-cta-copy em{color:var(--amber2)}
.footer-cta-btn{background:linear-gradient(135deg,#E8972A,#CC7818);color:var(--ink);padding:12px 28px;border-radius:50px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:var(--sans);white-space:nowrap;transition:filter .2s}
.footer-cta-btn:hover{filter:brightness(1.08)}
.hp-footer{background:var(--night);padding:28px 6%;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;border-top:1px solid rgba(255,255,255,.05)}
.hp-footer-logo{font-family:var(--serif);font-size:16px;font-weight:700;color:rgba(244,239,232,.55);display:flex;align-items:center;gap:8px}
.hp-footer-tagline{font-size:11px;color:rgba(244,239,232,.2);font-style:italic;font-family:var(--serif);margin-top:3px}
.hp-footer-links{display:flex;gap:20px}
.hp-footer-link{font-size:12px;color:rgba(244,239,232,.25);background:none;border:none;cursor:pointer;font-family:var(--sans);transition:color .15s}
.hp-footer-link:hover{color:rgba(244,239,232,.6)}
.hp-footer-copy{font-size:11px;color:rgba(244,239,232,.18);font-family:var(--mono)}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  .ritual-arc{flex-direction:column;gap:24px}
  .problem-inner,.archive-inner{grid-template-columns:1fr;gap:52px}
  .testimonials{grid-template-columns:1fr}
  .price-cards{grid-template-columns:1fr}
}
@media(max-width:640px){
  .hero,.problem-sec,.diff-sec,.ritual-sec,.archive-sec,.story-sec,.peak-sec,.proof-sec,.price-sec,.cta-sec{padding-left:5%;padding-right:5%}
  .hero{padding-top:80px;padding-bottom:90px}
  .problem-sec,.ritual-sec,.archive-sec,.story-sec,.peak-sec,.proof-sec,.price-sec,.cta-sec{padding-top:80px;padding-bottom:80px}
  .book{padding:32px 28px}
  .ritual-loop{grid-template-columns:1fr}
  .hp-nav-links{display:none}
  .hp-footer{flex-direction:column;text-align:center}
  .hp-footer-links{justify-content:center}
  .footer-cta-band{flex-direction:column;text-align:center}
}
`;

const LOOP_STEPS = [
  { n:'01', icon:'📝', prep:true, title:'Capture their day', desc:'Write or speak what happened — the test they were nervous about, the thing they said at dinner, the one detail that made today theirs.' },
  { n:'02', icon:'✨', prep:true, title:'Their story appears', desc:'In 30 seconds, a story starring them — built from their actual day, written at their reading level, in the mood you choose.' },
  { n:'03', icon:'🌙', prep:false, note:'the moment', title:'Read it together', desc:'Their name on every page. Their dog, their fear, their small victory woven into the adventure. Watch them light up when they hear themselves.' },
  { n:'04', icon:'💛', prep:false, note:'the keepsake', title:'Capture the night', desc:'A bonding question. The best three seconds. A photo. Your Night Card saves what they said — the exact words, the exact moment, forever.' },
];

const AGE_NOTES: Record<string, string> = {
  'age3-5': 'Stories use simple words, gentle themes, short sentences — perfect for little listeners.',
  'age6-8': 'Stories adapt to their reading level, attention span and emotional age.',
  'age9-11': 'Stories grow with them — richer language, longer arcs, bigger feelings handled honestly.',
};

interface Props {
  onCreateStory: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onNightCards: () => void;
  onLibrary: () => void;
}

export default function PublicHomepage({ onCreateStory, onSignIn, onSignUp, onNightCards, onLibrary }: Props) {
  const starsRef = useRef<HTMLDivElement>(null);
  const heroRef  = useRef<HTMLElement>(null);
  const [childName,    setChildName]    = useState('');
  const [selectedAge,  setSelectedAge]  = useState('age6-8');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [stickyShow,   setStickyShow]   = useState(false);
  const audioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Stars
    const c = starsRef.current;
    if (c) {
      for (let i = 0; i < 80; i++) {
        const s = document.createElement('div');
        s.className = 'hero-star';
        const sz = Math.random() < .3 ? 2.5 : Math.random() < .6 ? 1.5 : 1;
        s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${(3+Math.random()*4).toFixed(1)}s;--dl:${(Math.random()*5).toFixed(1)}s`;
        c.appendChild(s);
      }
    }
    // Scroll reveal
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    document.querySelectorAll('.fu').forEach(el => obs.observe(el));
    // Sticky mobile CTA
    const heroObs = new IntersectionObserver(entries => {
      setStickyShow(!entries[0].isIntersecting);
    }, { threshold: 0 });
    if (heroRef.current) heroObs.observe(heroRef.current);
    return () => { obs.disconnect(); heroObs.disconnect(); };
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const ctaLabel = childName.trim()
    ? `Begin ${childName.trim()}'s ritual tonight ✦`
    : 'Begin tonight\'s ritual — free ✦';
  const navCtaLabel = childName.trim()
    ? `Begin ${childName.trim()}'s ritual — free`
    : 'Begin tonight — free';

  const toggleAudio = () => {
    if (audioTimer.current) clearTimeout(audioTimer.current);
    if (!audioPlaying) {
      setAudioPlaying(true);
      audioTimer.current = setTimeout(() => setAudioPlaying(false), 8000);
    } else {
      setAudioPlaying(false);
    }
  };

  return (
    <div className="hp">
      <style>{CSS}</style>

      {/* STICKY MOBILE CTA */}
      <div className={`hp-sticky-cta${stickyShow ? ' show' : ''}`}>
        <button className="hp-sticky-btn" onClick={onSignUp}>{ctaLabel}</button>
        <div className="hp-sticky-note">3 rituals free · no card needed</div>
      </div>

      {/* NAV */}
      <nav className="hp-nav">
        <button className="hp-logo">
          <div className="hp-logo-moon" />
          SleepSeed
        </button>
        <div className="hp-nav-links">
          <button className="hp-nl" onClick={() => scrollTo('about')}>About</button>
          <button className="hp-nl" onClick={() => scrollTo('pricing')}>Pricing</button>
        </div>
        <div className="hp-nav-right">
          <button className="hp-signin" onClick={onSignIn}>Sign in</button>
          <button className="hp-cta-sm" onClick={onSignUp}>{navCtaLabel}</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef} id="hero">
        <div className="hero-stars" ref={starsRef} />
        <div className="hero-glow-orb" />

        <div className="hero-left">
          <div className="hero-eyebrow fu">
            <div className="hero-eyebrow-dot" />
            The ritual that changes bedtime
          </div>
          <h1 className="hero-h fu d1">
            The 20 minutes before sleep<br />
            are the <em>most important</em><br />
            <span className="dim">of the day.</span>
          </h1>
          <p className="hero-sub fu d2">
            Every night your child goes to sleep holding something they haven't said yet.{' '}
            <strong>SleepSeed is the ritual that opens them up</strong> — a story that stars them,
            a question that reaches them, a Night Card that keeps what they said.
          </p>

          <div className="fu d2">
            <div className="hero-age-label">My child is:</div>
            <div className="hero-age-row">
              {['age3-5','age6-8','age9-11'].map(age => (
                <button key={age} className={`hero-age-pill${selectedAge===age?' sel':''}`} onClick={() => setSelectedAge(age)}>
                  {age === 'age3-5' ? 'Ages 3–5' : age === 'age6-8' ? 'Ages 6–8' : 'Ages 9–11'}
                </button>
              ))}
            </div>
            <div className="hero-age-note">{AGE_NOTES[selectedAge]}</div>
          </div>

          <div className="hero-name-row fu d3">
            <input
              className="hero-name-input"
              type="text"
              placeholder="Your child's name…"
              value={childName}
              onChange={e => setChildName(e.target.value)}
              maxLength={30}
            />
            <button className="hero-cta-primary" onClick={onSignUp}>{ctaLabel}</button>
          </div>

          <button className="hero-cta-ghost fu d3" onClick={() => scrollTo('ritual')}>See how it works →</button>

          <div className="hero-trust fu d4">
            <span className="hero-trust-item">3 rituals free</span>
            <span className="hero-trust-item">No credit card</span>
            <span className="hero-trust-item">Ready in 60 seconds</span>
            <span className="hero-trust-item">No ads, ever</span>
          </div>
        </div>

        {/* PHONE VISUAL */}
        <div className="hero-right fu d2">
          <div className="phone-mock">
            <div className="phone-notch"></div>
            <div className="phone-screen">
              <div className="pnav">
                <div className="pnav-logo">🌙 SleepSeed</div>
                <div className="pnav-badge">night 13 · Adina</div>
              </div>
              <div className="p-ritual">
                <div className="p-ritual-lbl">✦ tonight's ritual</div>
                <div className="p-ritual-q">What happened in <em>Adina's</em> world today?</div>
                <button className="p-ritual-btn">Begin tonight's ritual ✦</button>
              </div>
              <div className="p-cards">
                <div className="p-card create"><div className="p-card-icon">✨</div><div className="p-card-title">Create</div><div className="p-card-stat">any time</div></div>
                <div className="p-card lib"><div className="p-card-icon">📚</div><div className="p-card-title">Library</div><div className="p-card-stat">12 saved</div></div>
                <div className="p-card nc"><div className="p-card-icon">🌙</div><div className="p-card-title">Night Cards</div><div className="p-card-stat">47 cards</div></div>
              </div>
              <div className="p-glow">
                <div className="p-glow-name">✦ the little fox · week 2</div>
                <div className="p-stars">
                  {[1,2,3,4,5].map(i => <span key={i} className="p-star">★</span>)}
                  {[6,7].map(i => <span key={i} className="p-star dim">☆</span>)}
                  <span style={{fontFamily:'var(--serif)',fontSize:14,color:'var(--amber2)',marginLeft:'auto',lineHeight:1}}>5</span>
                </div>
                <div style={{height:2,background:'rgba(255,255,255,.05)',borderRadius:2,overflow:'hidden',marginTop:4}}>
                  <div style={{height:2,background:'linear-gradient(90deg,#E8972A,#F5B84C)',borderRadius:2,width:'71%'}}></div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:6,color:'rgba(255,255,255,.16)',fontFamily:'monospace',marginTop:3}}>
                  <span>5 of 7 this week</span><span>2 to ✦</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="problem-sec" id="about">
        <div className="problem-inner">
          <div className="fu">
            <span className="sec-kicker">Every night</span>
            <div className="p-timeline">
              <div className="p-row"><span className="p-time">5:30</span><span className="p-text">Homework. Screen time. "One more minute."</span></div>
              <div className="p-row"><span className="p-time">6:45</span><span className="p-text">Dinner. Argument about dinner. More screens.</span></div>
              <div className="p-row"><span className="p-time">7:30</span><span className="p-text">Bath. Teeth. Pyjamas. One more glass of water.</span></div>
              <div className="p-row"><span className="p-time">8:00</span><span className="p-text">One more hug. One more question. Two minutes of stalling.</span></div>
              <span className="p-now-label">Then:</span>
              <div className="p-row now"><span className="p-time">8:20</span><span className="p-text">The noise stops. The room gets quiet. Just you. Just them. Just now.</span></div>
            </div>
          </div>
          <div className="fu d2">
            <span className="sec-kicker">The window</span>
            <div className="problem-copy">
              <h2>Something shifts when<br />the day finally <em>stops.</em></h2>
              <p>Children don't open up at dinner. They don't tell you the real thing at pickup or in the car. They tell you in the dark, right before sleep, when their guard is finally down.</p>
              <p>This window — about twenty minutes — is the most emotionally available your child will be all day. <strong>Most parents rush through it. SleepSeed gives you a reason to stay.</strong></p>
              <p>A story built from their day. A question that opens them up. A Night Card that keeps what they said. Every night, a new one.</p>
              <button className="problem-link" onClick={() => scrollTo('ritual')}>See the ritual →</button>
            </div>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATION */}
      <section className="diff-sec">
        <div className="diff-inner fu">
          <div className="diff-divider" />
          <p className="diff-line">
            SleepSeed is <strong>not a story app.</strong><br />
            It's a <em>bedtime ritual platform.</em><br />
            The stories are how it starts.<br />
            <em>The Night Cards are why you stay.</em>
          </p>
          <div className="diff-divider" />
        </div>
      </section>

      {/* RITUAL LOOP */}
      <section className="ritual-sec" id="ritual">
        <div className="ritual-inner">
          <div className="sec-header">
            <div className="fu"><span className="sec-kicker">How it works</span></div>
            <h2 className="fu d1">Not an app. <em>A ritual.</em></h2>
            <p className="fu d2">Four steps. Twenty minutes. Every night. The more nights you do it, the more it becomes the best part of the day.</p>
          </div>

          <div className="ritual-loop">
            {LOOP_STEPS.map((s, i) => (
              <div key={i} className={`ls${s.prep ? ' prep' : ' peak'} fu d${i+1}`}>
                <div className="ls-num">{s.n}</div>
                <span className="ls-icon">{s.icon}</span>
                {!s.prep && s.note && <span className="ls-peak-note">{s.note}</span>}
                <div className="ls-title">{s.title}</div>
                <div className="ls-desc">{s.desc}</div>
              </div>
            ))}
          </div>

          <div className="ritual-arc fu">
            <div className="arc-left">
              <h3>It builds into something irreplaceable.</h3>
              <p>After 30 nights you have 30 Night Cards. After a year, 365. A record of exactly who your child was at this age — what they were afraid of, what made them laugh, what they said the night before everything changed. By the time they leave home, you'll have years of them.</p>
            </div>
            <div className="arc-stats">
              <div style={{textAlign:'center'}}><span className="arc-num">20</span><span className="arc-lbl">min · every night</span></div>
              <div style={{textAlign:'center'}}><span className="arc-num">365</span><span className="arc-lbl">cards · every year</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHIVE + LIVE NIGHT CARD */}
      <section className="archive-sec">
        <div className="archive-inner">
          <div className="archive-copy fu">
            <span className="sec-kicker">Night Cards</span>
            <h2>A record of childhood<br />you can <em>hold.</em></h2>
            <p>Every ritual night creates a Night Card — a keepsake of the moment. Their quote. The best three seconds. A photo. AI-written, human-felt.</p>
            <p><strong>In ten years, most of this will be gone.</strong> Not because anything bad happened — just because that's how time works. Night Cards are the reason it isn't.</p>
            <div className="milestones">
              {[
                {n:'7',   t:'nights in', d:'your first constellation glows. The ritual is taking hold.'},
                {n:'30',  t:'nights in', d:'your child asks for it before you suggest it. Bedtime is different now.'},
                {n:'365', t:'nights in', d:'SleepSeed shows you what they said on this night last year.'},
              ].map((m,i) => (
                <div key={i} className="milestone">
                  <div className="milestone-num">{m.n}</div>
                  <div className="milestone-text"><strong>{m.t}</strong> — {m.d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE NIGHT CARD */}
          <div className="nc-live-wrap fu d1">
            <div className="nc-live-lbl"><div className="nc-live-dot" />A real Night Card — Night 47</div>
            <div className="nc-card">
              <div className="nc-img">
                <img src="/nightcard-hero.jpg" alt="Bedtime moment" />
                <div className="nc-img-overlay" />
                <div className="nc-img-title">The Spelling Test Dragon</div>
              </div>
              <div className="nc-body">
                <span className="nc-origin-badge">🌙 Night Card · 47 nights strong</span>
                <div className="nc-quote">"I was brave like the dragon. Even though my tummy was full of tangled string."</div>
                <div className="nc-chips">
                  <div className="nc-chip">
                    <div className="nc-chip-q">Best three seconds today</div>
                    <div className="nc-chip-a">When you carried me to bed even though I'm not little anymore.</div>
                  </div>
                  <div className="nc-chip" style={{background:'rgba(80,90,160,.06)',border:'1px solid rgba(80,90,160,.12)'}}>
                    <div className="nc-chip-q" style={{color:'#3A4080'}}>What makes you, you?</div>
                    <div className="nc-chip-a" style={{color:'#2A3060'}}>I remember every dog I've ever met. In order of how much they understood me.</div>
                  </div>
                </div>
                <div className="nc-meta"><span>🌙 SleepSeed · Adina · Age 6</span><span>Mar 21 2026</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORY + AUDIO */}
      <section className="story-sec">
        <div className="story-inner">
          <span className="sec-kicker fu" style={{display:'block'}}>A story — just for her, just for tonight</span>
          <h2 className="story-sec-h fu d1">Not a template. <em>Her story.</em></h2>
          <p className="story-sec-sub fu d2">Written in seconds from what she told you tonight. Her name. Her dog. The spelling test she was terrified about. Her world.</p>
          <div className="book fu d2">
            <div className="book-kicker">Tonight's story · Age 6 · Brave &amp; warm · ~4 minutes aloud</div>
            <div className="book-title">The <span className="book-hero-name">Adina</span> Who Faced the Dragon</div>
            <div className="book-tags">
              <span className="book-tag">⚡ Brave</span>
              <span className="book-tag">💛 Warm</span>
              <span className="book-tag">🌙 Bedtime</span>
            </div>
            <p className="book-p">
              <span className="cn">Adina</span>'s tummy felt like it was full of tangled string. Tomorrow was the spelling test. She had studied seventeen times. She had written every word three times each. But still — what if her brain forgot everything the moment she sat down?
            </p>
            <p className="book-p">
              She pulled her pencil case toward her. Inside it: a rubber eraser shaped like a small dragon, which she'd named <em>Biscuit</em>, which she'd carried to every hard thing since she was four. Biscuit had been there for the wobbly tooth. Biscuit had been there for the big swim.
            </p>
            <div className="book-refrain">
              "You already know the words," said Biscuit, in a voice like very small thunder.<br />
              "You just need to remember you know them."
            </div>
            {/* AUDIO PLAYER */}
            <div className="audio-player">
              <button className="audio-play-btn" onClick={toggleAudio}>
                {audioPlaying ? '⏸' : '▶'}
              </button>
              <div className="audio-info">
                <div className="audio-label">Read aloud by SleepSeed</div>
                <div className="audio-title-line">The Adina Who Faced the Dragon</div>
                <div className="audio-note">
                  {audioPlaying ? 'Playing — The Adina Who Faced the Dragon ✦' : 'Tap to hear Adina\'s story ✦'}
                </div>
              </div>
              <div className="audio-waves">
                {[1,2,3,4,5,6,7].map(i => (
                  <div key={i} className={`wave-bar${audioPlaying ? ' playing' : ''}`} />
                ))}
              </div>
            </div>
            <div className="book-footer">
              <span>SleepSeed · Adina · Mar 21 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* EMOTIONAL PEAK */}
      <section className="peak-sec">
        <div className="peak-inner fu">
          <div className="peak-who">James K. · Dad of one · Age 8 · Night 18</div>
          <p className="peak-quote">
            "My son has anxiety about school. I've learned more<br />
            about what's actually scaring him from Night Cards<br />
            than from a year of asking <em>'how was your day.'</em>"
          </p>
          <div className="peak-nc">
            <span className="peak-nc-lbl">His Night Card:</span>
            "I'm afraid nobody will sit with me. But in the story I wasn't afraid."
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="proof-sec">
        <div className="proof-inner">
          <div className="sec-header">
            <span className="sec-kicker fu">What families say</span>
            <h2 className="fu d1">47 nights in a row.<br /><em>Zero arguments about bedtime.</em></h2>
            <p className="fu d2">The ritual doesn't just change the story. It changes what bedtime feels like.</p>
          </div>
          <div className="testimonials">
            <div className="tcard amber fu">
              <div className="tcard-streak amber">122 nights · still going</div>
              <p className="tcard-quote">"We've done it every single night for four months. My daughter asks for it before I even suggest it. Bedtime went from something I dreaded to the part of the day we both look forward to most."</p>
              <div className="tcard-nc"><div className="tcard-nc-lbl">Her Night Card, night 34</div>"The best three seconds was when you carried me to bed."</div>
              <div className="tcard-meta"><div className="tcard-av" style={{background:'linear-gradient(135deg,#D4A060,#B07020)'}}>S</div><div><div className="tcard-name">Sarah M.</div><div className="tcard-role">Mum of two · ages 4 &amp; 7</div></div></div>
            </div>
            <div className="tcard teal fu d1">
              <div className="tcard-streak teal">47 nights · unbroken</div>
              <p className="tcard-quote">"My son has anxiety about school. The stories let him work through things he couldn't say directly. I've learned more about what's actually scaring him from Night Cards than from a year of asking 'how was your day.'"</p>
              <div className="tcard-nc"><div className="tcard-nc-lbl">His Night Card, night 18</div>"I'm afraid nobody will sit with me. But in the story I wasn't afraid."</div>
              <div className="tcard-meta"><div className="tcard-av" style={{background:'linear-gradient(135deg,#2AB89A,#1A8A70)'}}>J</div><div><div className="tcard-name">James K.</div><div className="tcard-role">Dad of one · age 8</div></div></div>
            </div>
            <div className="tcard rose fu d2">
              <div className="tcard-streak rose">Child therapist · recommends</div>
              <p className="tcard-quote">"As a child therapist I recommended it to a family navigating a new sibling. The mum called two weeks later — the older child was asking for bedtime for the first time in months."</p>
              <div className="tcard-nc"><div className="tcard-nc-lbl">Story used</div>New sibling transition · calm genre · age 5</div>
              <div className="tcard-meta"><div className="tcard-av" style={{background:'linear-gradient(135deg,#C85070,#9A3050)'}}>L</div><div><div className="tcard-name">Dr. Lisa R.</div><div className="tcard-role">Child &amp; Family Therapist</div></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="price-sec" id="pricing">
        <div className="price-inner">
          <div className="sec-header">
            <span className="sec-kicker fu">Pricing</span>
            <h2 className="fu d1">A record of childhood.<br /><em>For less than a coffee a month.</em></h2>
            <p className="fu d2">Start free with 3 rituals. Keep every night with Family — unlimited stories, unlimited Night Cards, your growing archive.</p>
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
                <div className="pcard-feat">All 6 story vibes</div>
                <div className="pcard-feat">Voice narration</div>
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
                <div className="pcard-feat hl">Your growing archive of childhood</div>
                <div className="pcard-feat">"On this night last year" memories</div>
                <div className="pcard-feat">Saved characters</div>
                <div className="pcard-feat">Voice narration</div>
                <div className="pcard-feat">Annual printed book (coming soon)</div>
              </div>
            </div>
          </div>
          <div className="price-note fu d2">
            <p>For <em>$6.58 a month</em> on the annual plan, you get an archive of every night you showed up. Every story. Every Night Card. Every thing your child said before they fell asleep. <em>Years of it.</em></p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-sec">
        <div className="cta-moon"><div className="cta-moon-sh" /></div>
        <h2 className="fu">These nights are<br />happening <em>right now.</em></h2>
        <p className="fu d1">Your child will say something true tonight. Something they've been holding all day. <strong>Be there for it.</strong> The ritual takes twenty minutes. The Night Card lasts forever.</p>
        <button className="cta-btn fu d2" onClick={onSignUp}>{ctaLabel}</button>
        <div className="cta-note fu d3">Then <strong>$9.99/month</strong> or <strong>$79/year</strong>. Cancel any time.</div>
        <div className="cta-trust fu d3">
          <span className="cta-trust-item">3 rituals free</span>
          <span className="cta-trust-item">No credit card</span>
          <span className="cta-trust-item">Night Cards included</span>
          <span className="cta-trust-item">No ads, ever</span>
          <span className="cta-trust-item">Cancel any time</span>
        </div>
      </section>

      {/* FOOTER */}
      <div className="footer-cta-band">
        <div className="footer-cta-copy">Every night that passes is a night you can't get back.<br /><em>Start the ritual tonight.</em></div>
        <button className="footer-cta-btn" onClick={onSignUp}>Begin free ✦</button>
      </div>
      <footer className="hp-footer">
        <div>
          <div className="hp-footer-logo"><div className="hp-logo-moon" style={{width:17,height:17}} />SleepSeed</div>
          <div className="hp-footer-tagline">Bedtime, but better. Every night.</div>
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
