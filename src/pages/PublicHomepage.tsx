import { useEffect, useRef, useState } from 'react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Kalam:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0B0B1A}::-webkit-scrollbar-thumb{background:#1E1E3A;border-radius:2px}

:root{
  --bg:#0B0B1A;
  --bg2:#0E0E22;
  --bg3:#12122A;
  --surface:#18183A;
  --rule:rgba(255,255,255,.06);
  --rule2:rgba(255,255,255,.12);
  --ink:#F0EDE8;
  --ink2:rgba(240,237,232,.72);
  --ink3:rgba(240,237,232,.45);
  --ink4:rgba(240,237,232,.25);
  --purple:#A855F7;
  --purple2:#7C3AED;
  --purple3:#C084FC;
  --purple-l:rgba(168,85,247,.12);
  --purple-s:rgba(168,85,247,.28);
  --purple-card:rgba(168,85,247,.08);
  --gold:rgba(251,191,36,.92);
  --gold2:rgba(251,191,36,.62);
  --gold3:rgba(251,191,36,.2);
  --gold4:rgba(251,191,36,.07);
  --gold-s:rgba(251,191,36,.25);
  --teal:#34D399;
  --blue:#60A5FA;
}
.hp{background:var(--bg);color:var(--ink);font-family:'DM Sans',sans-serif;min-height:100vh}

/* ── NAV ───────────────────────────────────────── */
.nav{display:flex;align-items:center;justify-content:space-between;padding:18px 64px;border-bottom:1px solid var(--rule);background:rgba(11,11,26,.97);position:sticky;top:0;z-index:30;backdrop-filter:blur(16px)}
.nav-logo{font-family:'Lora',serif;font-size:20px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:9px;letter-spacing:-.2px}
.nav-links{display:flex;gap:28px}
.nl{font-size:13px;color:var(--ink4);cursor:pointer;font-weight:400;transition:color .15s}.nl:hover{color:var(--ink2)}
.nl .badge{font-size:9px;background:var(--surface);color:var(--ink4);padding:1px 7px;border-radius:50px;margin-left:4px;font-family:'DM Mono',monospace}
.nav-right{display:flex;align-items:center;gap:14px}
.nav-in{font-size:13px;color:var(--ink3);cursor:pointer;font-weight:400}
.nav-cta{background:linear-gradient(135deg,#7C3AED,#A855F7);color:white;padding:9px 22px;border-radius:50px;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;border:none}
.nav-cta:hover{opacity:.9;transform:translateY(-1px);box-shadow:0 6px 20px rgba(124,58,237,.35)}

/* ── BEDTIME MATTERS — full scale opening ──────── */
.bm-section{background:var(--bg);position:relative;overflow:hidden;border-bottom:1px solid rgba(168,85,247,.1);min-height:320px;display:flex;align-items:center}
.bm-stars{position:absolute;inset:0;pointer-events:none}
.bm-star{position:absolute;background:white;border-radius:50%;animation:stw 4s ease-in-out infinite}
@keyframes stw{0%,100%{opacity:.07}50%{opacity:.44}}
.bm-glow{position:absolute;top:-100px;left:-80px;width:600px;height:500px;border-radius:50%;background:radial-gradient(ellipse,rgba(124,58,237,.05),transparent 65%);pointer-events:none}
.bm-glow2{position:absolute;bottom:-80px;right:-60px;width:500px;height:400px;border-radius:50%;background:radial-gradient(ellipse,rgba(168,85,247,.04),transparent 65%);pointer-events:none}
.bm-inner{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;width:100%;min-height:320px}
/* Left — Bedtime Matters alone */
.bm-left{padding:72px 64px;display:flex;align-items:center}
.bm-statement{font-family:'Lora',serif;font-size:68px;font-weight:700;color:var(--ink);letter-spacing:-1px;line-height:1.05}
.bm-period{color:var(--purple)}
/* Right — animated lines */
.bm-right{padding:72px 56px 72px 0;display:flex;flex-direction:column;justify-content:center;gap:0;border-left:1px solid rgba(168,85,247,.08)}
.bm-build{margin-top:28px;padding-top:24px;border-top:1px solid rgba(168,85,247,.12)}
.bm-build-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:'DM Mono',monospace;color:rgba(240,237,232,.28);margin-bottom:14px}
.bm-build-inp-row{display:flex;border:1px solid rgba(255,255,255,.12);border-radius:12px;overflow:hidden;background:rgba(255,255,255,.04);margin-bottom:12px}
.bm-build-inp{background:transparent;border:none;padding:13px 18px;font-size:14px;color:var(--ink);font-family:'DM Sans',sans-serif;flex:1;outline:none;font-weight:400}
.bm-build-inp::placeholder{color:rgba(240,237,232,.2);font-weight:300}
.bm-build-btn{background:linear-gradient(135deg,#7C3AED,#A855F7);color:white;padding:13px 20px;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif;border:none;transition:opacity .15s}
.bm-build-btn:hover{opacity:.9}
.bm-build-trust{display:flex;gap:14px;flex-wrap:wrap}
.bm-build-ti{font-size:11px;color:rgba(240,237,232,.22);display:flex;align-items:center;gap:4px;font-weight:400}
.bm-build-ck{font-size:9px;color:rgba(168,85,247,.45)}

.bm-line{font-family:'Lora',serif;font-size:38px;font-weight:400;color:rgba(240,237,232,.0);line-height:1.28;letter-spacing:-.4px;transform:translateY(18px);transition:color 1.1s cubic-bezier(.22,1,.36,1), transform 1.1s cubic-bezier(.22,1,.36,1), opacity 1.1s ease}
.bm-line.moment{font-size:34px;font-weight:300;font-style:normal;margin-top:18px;padding-top:18px;border-top:1px solid rgba(168,85,247,.0);transition:color 1.1s cubic-bezier(.22,1,.36,1), transform 1.1s cubic-bezier(.22,1,.36,1), border-color .9s ease}
.bm-line.vis{color:rgba(240,237,232,.82);transform:translateY(0)}
.bm-em-story{font-style:italic;color:var(--gold);font-weight:700;font-size:1.08em;letter-spacing:-.5px}
.bm-em-moment{font-weight:700;font-size:1.1em;color:var(--ink);letter-spacing:.5px}
.bm-em-cap{font-style:italic;color:var(--purple3);font-weight:400}
.bm-line.moment.vis{border-color:rgba(168,85,247,.2)}

/* ── OPENING — 2-col scene + copy ─────────────── */
.opening{background:var(--bg);border-bottom:1px solid var(--rule);position:relative;overflow:hidden}
.op-glow{position:absolute;top:10%;left:-80px;width:520px;height:480px;border-radius:50%;background:radial-gradient(ellipse,rgba(124,58,237,.05),transparent 65%);pointer-events:none}
.op-glow2{position:absolute;bottom:-60px;right:-60px;width:440px;height:440px;border-radius:50%;background:radial-gradient(ellipse,rgba(168,85,247,.04),transparent 65%);pointer-events:none}

/* Full-width copy band */
.op-copy{padding:72px 64px 80px;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start;position:relative;z-index:1}
.op-copy-left{}
.op-copy-right{padding-top:8px}

/* Scene band below */
.op-kicker{font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:'DM Mono',monospace;color:rgba(192,132,252,.75);margin-bottom:28px;display:flex;align-items:center;gap:12px}
.op-kicker-dot{width:5px;height:5px;border-radius:50%;background:rgba(192,132,252,.4);animation:kdot 2.2s ease-in-out infinite}
@keyframes kdot{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
.op-kicker-line{height:1px;width:32px;background:rgba(192,132,252,.14)}

.op-contrast{margin-bottom:0}
.op-c-row{display:flex;gap:12px;align-items:baseline;margin-bottom:8px}
.op-c-time{font-family:'DM Mono',monospace;font-size:12px;color:rgba(192,132,252,.85);letter-spacing:1px;flex-shrink:0;width:62px;font-weight:500}
.op-c-text{font-family:'DM Sans',sans-serif;font-size:15px;color:rgba(240,237,232,.45);font-weight:300;line-height:1.4}
.op-c-row.now .op-c-time{color:rgba(192,132,252,1)}
.op-c-row.now .op-c-text{color:rgba(240,237,232,.95);font-weight:500;font-size:17px}
.op-c-divider{height:1px;background:linear-gradient(90deg,rgba(168,85,247,.25),transparent);margin:16px 0}

.op-observe{margin-bottom:24px}
.op-observe-text{font-family:'Lora',serif;font-size:17px;font-style:italic;color:rgba(240,237,232,.62);line-height:1.82;font-weight:400}
.op-observe-text strong{font-style:normal;color:rgba(240,237,232,.85);font-weight:600}

.op-window{font-family:'Lora',serif;font-size:15px;color:rgba(240,237,232,.45);font-style:italic;margin-bottom:24px;padding-left:14px;border-left:2px solid rgba(168,85,247,.2)}

.op-statement{font-family:'DM Sans',sans-serif;font-size:15px;color:rgba(240,237,232,.72);line-height:1.78;margin-bottom:0;font-weight:400}
.op-statement strong{color:var(--ink);font-weight:600}
.op-statement em{font-style:italic;color:rgba(240,237,232,.92)}

.op-trust{display:none}
.op-ti{font-size:11.5px;color:var(--ink4);display:flex;align-items:center;gap:5px;font-weight:400}
.op-ck{font-size:10px;color:rgba(168,85,247,.55)}

/* Right — scene */

/* The declaration Polaroid — right column centrepiece */
/* Bedroom scene — now background atmosphere */
.op-bg-scene{width:100%;max-width:400px;opacity:.55;margin-bottom:-32px;pointer-events:none}

/* Declaration Polaroid — the featured element */
/* ── NIGHT CARD POLAROID — opening section ────────────── */
.nc-hero-pol{background:#F4EFE2;border-radius:4px;padding:12px 12px 26px;width:280px;box-shadow:0 32px 80px rgba(0,0,0,.78),0 8px 28px rgba(0,0,0,.55);position:relative;z-index:2;transform:rotate(-1.8deg)}
/* Photo — real image with warm vignette overlay */
.nc-hero-photo{width:100%;height:200px;border-radius:2px;overflow:hidden;position:relative;margin-bottom:0}
.nc-hero-img{width:100%;height:100%;object-fit:cover;object-position:center top;filter:saturate(1.08) brightness(.96)}
.nc-hero-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,transparent 40%,rgba(0,0,0,.22) 100%)}
.nc-hero-warm{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,180,80,.04) 0%,rgba(200,100,40,.12) 100%);mix-blend-mode:multiply}
.nc-hero-time{position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,.48);border-radius:3px;padding:3px 7px;font-size:7px;color:rgba(255,255,255,.6);font-family:'DM Mono',monospace;letter-spacing:.5px}
.nc-hero-story-lbl{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.42);border-radius:3px;padding:3px 7px;font-size:7px;color:rgba(255,255,255,.45);font-family:'DM Mono',monospace;font-style:italic}
/* Content — authentic Night Card responses */
.nc-hero-content{padding:13px 5px 2px;display:flex;flex-direction:column;gap:0}
.nc-hero-portrait{font-family:'Kalam',cursive;font-size:10px;color:#3A2800;line-height:1.7;padding-bottom:9px;border-bottom:1px solid rgba(58,40,0,.12);margin-bottom:9px}
.nc-hero-portrait em{font-style:italic;color:#6A4010}
.nc-hero-responses{display:flex;flex-direction:column;gap:7px}
.nc-hero-resp{border-radius:5px;padding:6px 9px}
.nc-hero-resp-q{font-size:7px;font-family:'DM Mono',monospace;letter-spacing:.4px;font-weight:500;opacity:.55;margin-bottom:3px;text-transform:uppercase}
.nc-hero-resp-a{font-family:'Kalam',cursive;font-size:10px;line-height:1.45}
.nc-hero-stamp{display:flex;align-items:center;justify-content:space-between;margin-top:9px;padding-top:7px;border-top:1px solid rgba(58,40,0,.08)}
.nc-hero-stamp-name{font-family:'Kalam',cursive;font-size:8.5px;color:rgba(58,40,0,.45)}
.nc-hero-stamp-logo{font-size:8px;color:rgba(58,40,0,.2);font-family:'DM Mono',monospace}

/* ── PULL QUOTE ─────────────────────────────────── */
.pq{padding:72px 64px;text-align:center;background:linear-gradient(180deg,var(--bg2),var(--bg));border-bottom:1px solid var(--rule);position:relative;overflow:hidden}
.pq::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:240px;border-radius:50%;background:radial-gradient(ellipse,rgba(124,58,237,.05),transparent 70%)}
.pq-inner{position:relative;z-index:1}
.pq-marks{font-family:'Lora',serif;font-size:80px;line-height:.55;color:rgba(168,85,247,.12);display:block;margin-bottom:12px}
.pq-text{font-family:'Lora',serif;font-size:26px;font-style:italic;color:rgba(240,237,232,.82);line-height:1.58;max-width:760px;margin:0 auto 22px}
.pq-text em{font-style:normal;color:var(--purple3);font-weight:600}
.pq-rule{width:40px;height:1px;background:var(--purple-s);margin:0 auto 14px}
.pq-attr{font-size:11.5px;color:var(--ink4);font-family:'DM Mono',monospace;letter-spacing:1.8px;text-transform:uppercase}

/* ── STEPS shared ───────────────────────────────── */
.step-grid{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--rule)}
.step-left{padding:64px 60px 64px 64px;display:flex;flex-direction:column;justify-content:center}
.step-right{display:flex;align-items:center;justify-content:center;padding:48px 40px;position:relative;overflow:hidden}
.step-num{font-size:9.5px;font-family:'DM Mono',monospace;letter-spacing:2.5px;text-transform:uppercase;color:var(--purple3);margin-bottom:14px;display:flex;align-items:center;gap:9px;opacity:.8}
.step-n{width:22px;height:22px;border-radius:50%;background:var(--purple-card);border:1px solid var(--purple-s);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--purple3);font-family:'DM Mono',monospace;flex-shrink:0}
.step-h{font-family:'Lora',serif;font-size:28px;font-weight:700;color:var(--ink);margin-bottom:14px;line-height:1.2;letter-spacing:-.3px}
.step-h em{font-style:italic;color:var(--gold)}
.step-body{font-size:15px;color:var(--ink3);line-height:1.78;margin-bottom:24px;font-weight:300}
.step-body strong{color:var(--ink2);font-weight:500}
.step-chips{display:flex;flex-wrap:wrap;gap:7px}
.step-chip{font-size:10.5px;padding:5px 14px;border-radius:50px;font-family:'DM Sans',sans-serif;font-weight:500}


/* ── STORY POWER SECTION ──────────────────────────────────────────────── */
.story-sec{padding:72px 64px;background:linear-gradient(180deg,var(--bg2) 0%,var(--bg) 100%);border-bottom:1px solid var(--rule);position:relative;overflow:hidden}
.story-sec::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(168,85,247,.2),transparent)}
.story-glow-l{position:absolute;top:-80px;left:-80px;width:500px;height:400px;border-radius:50%;background:radial-gradient(ellipse,rgba(124,58,237,.05),transparent 65%);pointer-events:none}
.story-glow-r{position:absolute;bottom:-80px;right:-80px;width:500px;height:400px;border-radius:50%;background:radial-gradient(ellipse,rgba(168,85,247,.04),transparent 65%);pointer-events:none}
.story-inner{position:relative;z-index:1}

/* Opening statement */
.story-opening{max-width:800px;margin-bottom:72px}
.story-lede{font-family:'Lora',serif;font-size:22px;font-style:italic;color:rgba(240,237,232,.62);line-height:1.72;margin-bottom:24px;font-weight:400}
.story-lede strong{font-style:normal;color:rgba(240,237,232,.88);font-weight:600}

/* The four pillars */
.story-pillars{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.05);border-radius:20px;overflow:hidden;margin-bottom:72px}
.story-pillar{background:var(--bg);padding:36px 28px 32px;position:relative;overflow:hidden;transition:background .25s}
.story-pillar:hover{background:var(--bg3)}
.story-pillar::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.sp-adventure::before{background:linear-gradient(90deg,rgba(249,115,22,.6),transparent)}
.sp-understanding::before{background:linear-gradient(90deg,rgba(96,165,250,.6),transparent)}
.sp-healing::before{background:linear-gradient(90deg,rgba(52,211,153,.6),transparent)}
.sp-courage::before{background:linear-gradient(90deg,rgba(192,132,252,.6),transparent)}
.story-pillar-scene{height:80px;margin-bottom:20px;position:relative}
.story-pillar-word{font-family:'Lora',serif;font-size:26px;font-weight:700;color:var(--ink);margin-bottom:10px;letter-spacing:-.3px}
.sp-adventure .story-pillar-word{color:rgba(251,146,60,.9)}
.sp-understanding .story-pillar-word{color:rgba(96,165,250,.9)}
.sp-healing .story-pillar-word{color:rgba(52,211,153,.9)}
.sp-courage .story-pillar-word{color:rgba(192,132,252,.9)}
.story-pillar-desc{font-size:13px;color:rgba(240,237,232,.42);line-height:1.65;font-weight:300;font-family:'DM Sans',sans-serif}

/* Personalisation pivot */
.story-pivot{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;margin-bottom:64px}
.story-pivot-left{}
.story-pivot-h{font-family:'Lora',serif;font-size:22px;font-style:italic;color:rgba(240,237,232,.62);line-height:1.72;margin-bottom:24px;font-weight:400}
.story-pivot-h strong{font-style:normal;color:rgba(240,237,232,.88);font-weight:600}
.story-example{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:24px;position:relative;overflow:hidden}
.story-example::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(168,85,247,.2),transparent)}
.story-ex-lbl{font-size:8px;color:rgba(168,85,247,.45);font-family:'DM Mono',monospace;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px}
.story-ex-details{display:flex;flex-direction:column;gap:10px;margin-bottom:18px}
.story-ex-row{display:flex;gap:12px;align-items:flex-start}
.story-ex-key{font-size:10px;color:rgba(240,237,232,.28);font-family:'DM Mono',monospace;letter-spacing:.8px;text-transform:uppercase;min-width:72px;padding-top:1px;flex-shrink:0}
.story-ex-val{font-size:13.5px;color:rgba(240,237,232,.75);font-family:'Lora',serif;font-style:italic;line-height:1.5}
.story-ex-val em{font-style:normal;color:rgba(240,237,232,.92);font-weight:600}
.story-ex-rule{height:1px;background:rgba(255,255,255,.06);margin-bottom:18px}
.story-ex-result{font-family:'Lora',serif;font-size:13px;font-style:italic;color:rgba(240,237,232,.55);line-height:1.72}
.story-ex-result em{font-style:normal;color:rgba(192,132,252,.8);font-weight:600}

/* The closing declaration */
.story-declaration{text-align:center;padding:0 64px}
.story-decl-pre{font-family:'DM Sans',sans-serif;font-size:13px;color:rgba(168,85,247,.5);letter-spacing:3px;text-transform:uppercase;font-family:'DM Mono',monospace;margin-bottom:20px}
.story-decl-h{font-family:'Lora',serif;font-size:46px;font-weight:700;color:var(--ink);line-height:1.12;letter-spacing:-.5px;margin-bottom:6px}
.story-decl-h em{font-style:italic;color:var(--purple)}
.story-decl-sub{font-size:16px;color:rgba(240,237,232,.42);font-family:'DM Sans',sans-serif;font-weight:300;margin-top:20px;line-height:1.65}
.story-decl-sub em{font-style:italic;color:rgba(240,237,232,.62)}

/* Step 1 right — builder */
.s1-right{background:linear-gradient(160deg,#060B18,#0A1126,#0D1432);border-left:1px solid rgba(255,255,255,.05)}
.s1-right::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(1px 1px at 14% 18%,rgba(255,255,255,.55) 0%,transparent 100%),radial-gradient(1px 1px at 38% 10%,rgba(255,255,255,.45) 0%,transparent 100%),radial-gradient(1.5px 1.5px at 66% 28%,rgba(255,255,255,.5) 0%,transparent 100%),radial-gradient(1px 1px at 82% 65%,rgba(255,255,255,.38) 0%,transparent 100%),radial-gradient(2px 2px at 52% 6%,rgba(192,132,252,.4) 0%,transparent 100%),radial-gradient(1px 1px at 24% 72%,rgba(255,255,255,.3) 0%,transparent 100%)}
.s1-right::after{content:'';position:absolute;bottom:-40px;left:50%;transform:translateX(-50%);width:280px;height:160px;border-radius:50%;background:radial-gradient(ellipse,rgba(124,58,237,.12),transparent 70%);pointer-events:none}
.b-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.b-brand{display:flex;align-items:center;gap:7px}
.b-moon-ico{width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 40% 40%,rgba(192,132,252,.2),rgba(192,132,252,.04) 70%);border:1px solid rgba(192,132,252,.22);display:flex;align-items:center;justify-content:center;font-size:14px}
.b-nm{font-family:'Lora',serif;font-size:14px;font-weight:700;color:rgba(192,132,252,.75)}
.b-tg{font-size:8.5px;font-family:'DM Mono',monospace;color:rgba(192,132,252,.32);letter-spacing:1px;background:rgba(192,132,252,.06);padding:2px 8px;border-radius:50px;border:1px solid rgba(192,132,252,.14)}
.b-hero-box{background:linear-gradient(135deg,rgba(192,132,252,.07),rgba(124,58,237,.04));border:1px solid rgba(192,132,252,.16);border-radius:14px;padding:15px 18px;margin-bottom:12px;position:relative;overflow:hidden}
.b-hero-box::before{content:'';position:absolute;top:-18px;right:-18px;width:72px;height:72px;border-radius:50%;background:radial-gradient(circle,rgba(192,132,252,.08),transparent 70%)}
.b-hlbl{font-size:8px;color:rgba(192,132,252,.38);font-family:'DM Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px}
.b-hval{font-family:'Lora',serif;font-size:22px;font-weight:700;color:rgba(240,237,232,.95);letter-spacing:-.3px;line-height:1}
.b-hsub{font-size:11px;color:rgba(255,255,255,.25);font-family:'DM Sans',sans-serif;margin-top:4px;font-weight:300}
.b-sit{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 14px;margin-bottom:12px}
.b-slbl{font-size:8px;color:rgba(255,255,255,.2);font-family:'DM Mono',monospace;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:5px}
.b-sval{font-size:13px;color:rgba(255,255,255,.68);font-family:'DM Sans',sans-serif;font-weight:400;line-height:1.4}
.b-sdet{font-size:11px;color:rgba(192,132,252,.42);font-family:'DM Sans',sans-serif;font-style:italic;margin-top:3px;font-weight:300}
.b-glbl{font-size:8px;color:rgba(255,255,255,.2);font-family:'DM Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:7px}
.b-ggrid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:12px}
.b-gt{border-radius:10px;padding:9px 5px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;border:1px solid rgba(255,255,255,.06)}
.b-ge{font-size:17px;line-height:1}.b-gn{font-size:8.5px;font-family:'DM Sans',sans-serif;font-weight:500;text-align:center}
.gtc{background:rgba(52,211,153,.08);border-color:rgba(52,211,153,.2)}.gtc.on{background:rgba(52,211,153,.17);border-color:rgba(52,211,153,.48)}.gtc .b-gn{color:#34D399}
.gtw{background:rgba(139,92,246,.1);border-color:rgba(139,92,246,.22)}.gtw .b-gn{color:#A78BFA}
.gts{background:rgba(250,204,21,.07);border-color:rgba(250,204,21,.18)}.gts .b-gn{color:#FDE047}
.gta{background:rgba(249,115,22,.08);border-color:rgba(249,115,22,.2)}.gta .b-gn{color:#FB923C}
.gtco{background:rgba(20,184,166,.07);border-color:rgba(20,184,166,.18)}.gtco .b-gn{color:#2DD4BF}
.b-gen{background:linear-gradient(135deg,rgba(124,58,237,.12),rgba(168,85,247,.07));border:1px solid rgba(168,85,247,.22);border-radius:11px;padding:12px 15px;display:flex;align-items:center;gap:11px;position:relative;overflow:hidden}
.b-gen::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(168,85,247,.05),transparent);animation:sweep 2s ease-in-out infinite}
@keyframes sweep{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.b-gi{font-size:20px;flex-shrink:0;animation:spin 4s linear infinite}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
.b-gt2{font-size:13px;color:rgba(192,132,252,.9);font-family:'DM Sans',sans-serif;font-weight:500}
.b-gs{font-size:10px;color:rgba(192,132,252,.38);font-family:'DM Mono',monospace;margin-top:3px}
.b-dots{display:flex;gap:3px;margin-top:5px}
.b-dot{width:4px;height:4px;border-radius:50%;background:rgba(168,85,247,.7);animation:blink 1.1s ease-in-out infinite}
.b-dot:nth-child(2){animation-delay:.18s}.b-dot:nth-child(3){animation-delay:.36s}
@keyframes blink{0%,100%{opacity:.2;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}

/* Step 2 right — warm parchment (the visual break) */
.s2-left{background:var(--bg)}
.s2-right{background:linear-gradient(160deg,#F5EDD8,#EDE0C4);border-left:1px solid rgba(0,0,0,.06)}
.s2-right::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 60% 40%,rgba(255,220,140,.12),transparent 65%);pointer-events:none}
.story-page{background:linear-gradient(160deg,#FDF8EE,#F8EDD4);border-radius:14px;padding:28px 26px;position:relative;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.14),0 4px 16px rgba(0,0,0,.1);max-width:292px;border:1px solid rgba(180,140,60,.1)}
.sp-moon{position:absolute;top:12px;right:14px;font-size:14px;opacity:.18}
.sp-genre-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.22);border-radius:50px;padding:3px 10px;font-size:9px;font-family:'DM Sans',sans-serif;font-weight:500;color:#2A9B73;margin-bottom:14px}
.sp-title{font-family:'Lora',serif;font-size:16px;font-weight:700;color:#2E2000;margin-bottom:13px;line-height:1.3}
.sp-text{font-family:'Lora',serif;font-size:12px;color:#6B4E1A;line-height:1.88;font-style:italic}
.sp-text em{color:#2E2000;font-style:normal;font-weight:600}
.sp-name{color:#B87010;font-style:normal}
.sp-rule{height:1px;background:rgba(74,48,0,.1);margin:13px 0}
.sp-progress{display:flex;align-items:center;justify-content:space-between;margin-top:13px}
.sp-pdots{display:flex;gap:5px}
.sp-pdot{width:6px;height:6px;border-radius:50%;background:rgba(74,48,0,.15)}.sp-pdot.on{background:rgba(74,48,0,.38)}
.sp-timer{font-size:9px;color:rgba(74,48,0,.38);font-family:'DM Mono',monospace}

/* ── NIGHT CARD — full-width cinematic ──────────── */
.nc-full{border-bottom:1px solid var(--rule);background:linear-gradient(180deg,#09070F,#0D0B1E);padding:80px 64px;position:relative;overflow:hidden}
.nc-full-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:400px;border-radius:50%;background:radial-gradient(ellipse,rgba(124,58,237,.08),transparent 70%);pointer-events:none}
.nc-full-glow2{position:absolute;bottom:-80px;left:50%;transform:translateX(-50%);width:400px;height:200px;border-radius:50%;background:radial-gradient(ellipse,rgba(168,85,247,.05),transparent 70%);pointer-events:none}
.nc-full-inner{position:relative;z-index:1}
.nc-full-header{text-align:center;margin-bottom:56px}
.nc-full-step{font-size:9.5px;font-family:'DM Mono',monospace;letter-spacing:2.5px;text-transform:uppercase;color:rgba(168,85,247,.7);margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:9px}
.nc-full-sn{width:22px;height:22px;border-radius:50%;background:var(--purple-card);border:1px solid var(--purple-s);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:rgba(168,85,247,.85);font-family:'DM Mono',monospace}
.nc-full-h{font-family:'Lora',serif;font-size:44px;font-weight:700;color:var(--ink);line-height:1.08;letter-spacing:-.5px;margin-bottom:4px}
.nc-full-h2{font-family:'Lora',serif;font-size:44px;font-weight:700;font-style:italic;color:var(--purple3);line-height:1.08;letter-spacing:-.5px}
.nc-full-sub{font-size:16px;color:var(--ink3);line-height:1.75;max-width:560px;margin:20px auto 0;font-weight:300}
.nc-full-sub strong{color:var(--ink2);font-weight:500}
.nc-pol-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:56px}
.nc-pol{background:#F5F0E8;border-radius:4px;padding:12px 12px 34px;width:300px;box-shadow:0 32px 80px rgba(0,0,0,.7),0 8px 24px rgba(0,0,0,.5)}
.nc-pol-photo{width:100%;aspect-ratio:1;border-radius:2px;overflow:hidden;position:relative}
.nc-pol-img{width:100%;height:100%;background:linear-gradient(160deg,#1A1C2E,#22203A);display:flex;align-items:center;justify-content:center;position:relative}
.nc-pol-stars{position:absolute;inset:0}
.nc-pol-star{position:absolute;background:rgba(255,255,255,.5);border-radius:50%}
.nc-pol-moon{position:absolute;top:10px;right:14px;font-size:12px;opacity:.28}
.nc-pol-warm{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 110%,rgba(200,130,60,.18),transparent 65%)}
.nc-pol-sils{display:flex;align-items:flex-end;justify-content:center;gap:10px;position:relative;z-index:1;padding-bottom:22px}
.nc-pol-sp{width:34px;height:74px;background:rgba(0,0,0,.55);border-radius:17px 17px 4px 4px;position:relative}.nc-pol-sp::before{content:'';position:absolute;top:-14px;left:50%;transform:translateX(-50%);width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.55)}
.nc-pol-sc{width:24px;height:52px;background:rgba(0,0,0,.5);border-radius:12px 12px 4px 4px;position:relative}.nc-pol-sc::before{content:'';position:absolute;top:-12px;left:50%;transform:translateX(-50%);width:16px;height:16px;border-radius:50%;background:rgba(0,0,0,.5)}
.nc-pol-time{position:absolute;top:8px;left:8px;background:rgba(0,0,0,.45);border-radius:3px;padding:3px 7px;font-size:7px;color:rgba(255,255,255,.5);font-family:'DM Mono',monospace}
.nc-pol-story{position:absolute;bottom:66px;left:0;right:0;text-align:center;font-family:'Lora',serif;font-size:9.5px;font-style:italic;color:rgba(192,132,252,.65);text-shadow:0 1px 5px rgba(0,0,0,.9);padding:0 10px}
.nc-pol-content{padding:11px 5px 0;display:flex;flex-direction:column;gap:8px}
.nc-pol-portrait{font-family:'Kalam',cursive;font-size:10px;color:#4A3000;line-height:1.65;border-bottom:1px solid rgba(74,48,0,.1);padding-bottom:8px}
.nc-pol-portrait em{font-style:italic;color:#7A5010}
.nc-pol-chips{display:flex;flex-direction:column;gap:4px}
.nc-chip{border-radius:5px;padding:5px 9px}
.nc-chipq{font-size:7.5px;font-family:'DM Mono',monospace;letter-spacing:.3px;font-weight:500;opacity:.6;margin-bottom:2px}
.nc-chipa{font-family:'Kalam',cursive;font-size:9.5px;line-height:1.4}
.nc-pol-refrain{font-family:'Kalam',cursive;font-size:8px;color:rgba(74,48,0,.32);font-style:italic;text-align:center;padding-top:3px}
.nc-pol-stamp{font-size:7.5px;color:rgba(74,48,0,.14);font-family:'DM Mono',monospace;text-align:right;padding-top:2px}
.nc-pol-date{font-size:11px;color:var(--ink4);font-family:'DM Mono',monospace}
.nc-anns{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.nc-ann{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:20px}
.nc-ann-n{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;font-family:'DM Mono',monospace;margin-bottom:12px}
.nc-ann-h{font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:6px;font-family:'Lora',serif}
.nc-ann-d{font-size:12.5px;color:var(--ink3);line-height:1.62;font-weight:300}
.nc-ann-q{font-family:'Kalam',cursive;font-size:11.5px;color:var(--ink3);margin-top:8px;font-style:italic;line-height:1.5;opacity:.65}

/* ── GALLERY ────────────────────────────────────── */
.gallery-sec{padding:56px 64px;border-bottom:1px solid var(--rule);background:var(--bg3)}
.gallery-hdr{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px}
.gallery-ey{font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-family:'DM Mono',monospace;color:rgba(168,85,247,.6);margin-bottom:6px;display:flex;align-items:center;gap:7px}
.gallery-ey-dot{width:5px;height:5px;border-radius:50%;background:rgba(168,85,247,.6)}
.gallery-h{font-family:'Lora',serif;font-size:22px;font-weight:700;color:var(--ink)}
.gallery-count{font-size:11.5px;color:var(--ink4);font-family:'DM Mono',monospace}
.cork{display:flex;gap:8px;flex-wrap:wrap;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.04);border-radius:16px;padding:24px 20px;justify-content:center}
.nc-mini{background:#F5F0E8;border-radius:3px;padding:6px 6px 17px;width:86px;flex-shrink:0;box-shadow:0 4px 18px rgba(0,0,0,.55);transition:transform .22s}
.nc-mini:hover{transform:scale(1.07) rotate(0deg) !important}
.nc-mini-p{width:100%;aspect-ratio:1;border-radius:1px;display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:5px}
.nc-mini-t{font-family:'Kalam',cursive;font-size:7px;color:#3A2800;text-align:center;line-height:1.35}
.nc-mini-d{font-family:'DM Mono',monospace;font-size:6px;color:rgba(58,40,0,.38);text-align:center;margin-top:2px}

/* ── SHELF MOMENT ───────────────────────────────── */
.shelf{padding:72px 64px;text-align:center;background:linear-gradient(180deg,var(--bg),#080614);border-bottom:1px solid rgba(124,58,237,.08);position:relative;overflow:hidden}
.shelf::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;height:300px;border-radius:50%;background:radial-gradient(ellipse,rgba(124,58,237,.06),transparent 70%);pointer-events:none}
.shelf-inner{position:relative;z-index:1}
.shelf-ey{font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:'DM Mono',monospace;color:rgba(168,85,247,.35);margin-bottom:28px;display:flex;align-items:center;justify-content:center;gap:14px}
.shelf-ey-line{height:1px;width:40px;background:rgba(168,85,247,.15)}
.shelf-h{font-family:'Lora',serif;font-size:46px;font-weight:700;color:var(--ink);line-height:1.1;letter-spacing:-.5px;margin-bottom:0}
.shelf-h em{font-style:italic;color:var(--gold)}
.shelf-rule{width:48px;height:1px;background:var(--purple-s);margin:28px auto}
.shelf-sub{font-size:16px;color:var(--ink3);line-height:1.75;max-width:520px;margin:0 auto 40px;font-weight:300}
.shelf-sub em{font-style:italic;color:var(--ink2)}
.shelf-books{display:flex;align-items:flex-end;justify-content:center;gap:0}
.shelf-bk{position:relative;border-radius:0 4px 4px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;border:1px solid rgba(192,132,252,.1)}
.shelf-bk-spine{position:absolute;left:0;top:0;bottom:0;width:14px;background:linear-gradient(180deg,#2D1B69,#1A0E3E)}
.shelf-bk-title{font-family:'Kalam',cursive;color:rgba(192,132,252,.45);text-align:center;line-height:1.4}
.shelf-bk-year{font-family:'DM Mono',monospace;color:rgba(192,132,252,.25);letter-spacing:1.5px}
.shelf-note{font-size:14px;color:var(--ink4);font-family:'Lora',serif;font-style:italic;line-height:1.65;margin-top:36px}

/* ── PROOF ──────────────────────────────────────── */
.proof-sec{padding:60px 64px;border-bottom:1px solid var(--rule);background:var(--bg2)}
.proof-ey{font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-family:'DM Mono',monospace;color:rgba(168,85,247,.6);margin-bottom:8px;display:flex;align-items:center;gap:7px}
.proof-ey-dot{width:5px;height:5px;border-radius:50%;background:rgba(168,85,247,.6)}
.proof-h{font-family:'Lora',serif;font-size:28px;font-weight:700;color:var(--ink);margin-bottom:8px;letter-spacing:-.3px}
.proof-sub{font-size:15px;color:var(--ink3);font-weight:300;margin-bottom:36px}
.proof-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.pcard{border-radius:20px;padding:24px;position:relative;overflow:hidden;transition:transform .22s,box-shadow .22s;border:1px solid rgba(255,255,255,.07);cursor:pointer}
.pcard:hover{transform:translateY(-4px)}
.pcard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;border-radius:2px 2px 0 0}
.pcard.amber{background:linear-gradient(160deg,#1E1400,#2A1E08)}.pcard.amber::before{background:linear-gradient(90deg,rgba(251,191,36,.5),transparent)}
.pcard.teal{background:linear-gradient(160deg,#0A1E18,#0E2820)}.pcard.teal::before{background:linear-gradient(90deg,rgba(52,211,153,.5),transparent)}
.pcard.purple{background:linear-gradient(160deg,#120D2A,#1A1238)}.pcard.purple::before{background:linear-gradient(90deg,rgba(168,85,247,.5),transparent)}
.pcard-q{font-family:'Lora',serif;font-size:14.5px;font-style:italic;color:rgba(240,237,232,.8);line-height:1.72;margin-bottom:16px}
.pcard-nc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:10px 12px;margin-bottom:16px}
.pcard-nc-lbl{font-size:8px;color:var(--ink4);font-family:'DM Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px}
.pcard-nc-text{font-family:'Kalam',cursive;font-size:12px;color:rgba(240,237,232,.58);line-height:1.5}
.pcard-meta{display:flex;align-items:center;gap:10px}
.pcard-av{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.pcard-name{font-size:12px;font-weight:500;color:var(--ink2)}.pcard-det{font-size:11px;color:var(--ink4);margin-top:1px;font-weight:300}

/* ── SHARING ─────────────────────────────────────── */
.share-sec{padding:56px 64px;border-bottom:1px solid var(--rule);background:var(--bg)}
.share-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:36px}
.scard{border-radius:20px;padding:24px;transition:transform .22s;cursor:pointer;border:1px solid rgba(255,255,255,.07);background:var(--bg3)}
.scard:hover{transform:translateY(-4px)}
.scard-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:14px}
.scard-h{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:6px;font-family:'Lora',serif}
.scard-d{font-size:13px;color:var(--ink3);line-height:1.62;font-weight:300}

/* ── LIBRARY ─────────────────────────────────────── */
.lib-sec{background:var(--bg2);padding:56px 64px;border-bottom:1px solid var(--rule)}
.lib-top{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px}
.lib-notify{background:var(--purple-card);border:1px solid var(--purple-s);color:var(--purple3);padding:10px 22px;border-radius:50px;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s}
.lib-notify:hover{background:rgba(168,85,247,.15)}
.lib-books{display:flex;gap:14px}
.lib-book{border-radius:20px;overflow:hidden;flex-shrink:0;width:162px;opacity:.65;transition:all .22s;cursor:pointer;border:1px solid rgba(255,255,255,.07)}
.lib-book:hover{opacity:.92;transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.3)}
.lib-book-art{height:90px;display:flex;align-items:center;justify-content:center;font-size:38px}
.lib-book-body{padding:12px 13px}
.lib-book-badge{font-size:8.5px;padding:3px 9px;border-radius:50px;font-family:'DM Mono',monospace;display:inline-block;margin-bottom:7px;font-weight:500}
.lib-book-title{font-family:'Lora',serif;font-size:12px;font-weight:600;color:rgba(240,237,232,.65);line-height:1.35;margin-bottom:3px}
.lib-book-age{font-size:9px;color:var(--ink4);font-family:'DM Mono',monospace}
.lib-soon{display:flex;flex-direction:column;align-items:center;justify-content:center;width:162px;border:1px dashed rgba(168,85,247,.15);border-radius:20px;padding:16px;gap:6px}
.lib-soon-txt{font-size:10px;color:var(--ink4);font-family:'DM Mono',monospace;text-align:center;line-height:1.5}

/* ── CTA ─────────────────────────────────────────── */
.cta{padding:72px 64px;text-align:center;background:linear-gradient(180deg,var(--bg),#060412);position:relative;overflow:hidden}
.cta::before{content:'';position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);width:700px;height:350px;border-radius:50%;background:radial-gradient(ellipse,rgba(124,58,237,.07),transparent 70%);pointer-events:none}
.cta-inner{position:relative;z-index:1}
.cta-moon{font-size:36px;display:block;margin-bottom:28px;opacity:.8}
.cta-h{font-family:'Lora',serif;font-size:44px;font-weight:700;color:var(--ink);margin-bottom:14px;letter-spacing:-.5px;line-height:1.1}
.cta-h em{font-style:italic;color:var(--gold)}
.cta-sub{font-size:17px;color:var(--ink3);margin-bottom:44px;font-weight:300;line-height:1.75;max-width:500px;margin-left:auto;margin-right:auto}
.cta-btn{display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:white;padding:18px 52px;border-radius:50px;font-size:16px;font-weight:500;cursor:pointer;transition:all .22s;font-family:'DM Sans',sans-serif;border:none}
.cta-btn:hover{transform:translateY(-3px);box-shadow:0 18px 44px rgba(124,58,237,.4)}
.cta-note{font-size:13px;color:var(--ink4);margin-top:18px;font-weight:300}
.cta-note strong{color:var(--ink3);font-weight:500}
.cta-trust{display:flex;gap:22px;justify-content:center;flex-wrap:wrap;margin-top:32px}
.cta-ti{font-size:12px;color:var(--ink4);display:flex;align-items:center;gap:5px;font-weight:400}
.cta-ck{font-size:10px;color:rgba(168,85,247,.5)}

/* ── RESPONSIVE ─────────────────────────────────── */
@media(max-width:1024px){
  .nav{padding:16px 28px}
  .nav-links{gap:18px}
  .bm-left{padding:48px 32px}
  .bm-statement{font-size:56px}
  .bm-right{padding:48px 28px 48px 0}
  .bm-line{font-size:28px}
  .bm-line.moment{font-size:26px}
  .op-copy{padding:48px 32px 56px;gap:48px}
  .story-sec{padding:64px 32px}
  .story-pillars{grid-template-columns:repeat(2,1fr)}
  .story-pivot{gap:40px}
  .story-decl-h{font-size:40px}
  .step-left{padding:40px 28px}
  .step-right{padding:32px 24px}
  .step-h{font-size:24px}
  .nc-full{padding:56px 32px}
  .nc-full-h,.nc-full-h2{font-size:38px}
  .nc-anns{grid-template-columns:repeat(2,1fr)}
  .gallery-sec{padding:40px 32px}
  .shelf{padding:64px 32px}
  .shelf-h{font-size:40px}
  .proof-sec{padding:40px 32px}
  .proof-grid{grid-template-columns:1fr 1fr}
  .share-sec{padding:40px 32px}
  .share-grid{grid-template-columns:1fr 1fr}
  .lib-sec{padding:40px 32px}
  .cta{padding:72px 32px}
  .cta-h{font-size:40px}
  .pq{padding:48px 32px}
  .pq-text{font-size:22px}
}
@media(max-width:768px){
  .nav{padding:14px 18px;gap:10px}
  .nav-links{display:none}
  .nav-logo{font-size:17px}
  .bm-inner{grid-template-columns:1fr;min-height:auto}
  .bm-left{padding:40px 24px 16px;justify-content:flex-start}
  .bm-statement{font-size:42px}
  .bm-right{padding:0 24px 36px;border-left:none;border-top:1px solid rgba(168,85,247,.08)}
  .bm-line{font-size:22px}
  .bm-line.moment{font-size:20px;margin-top:12px;padding-top:12px}
  .bm-build{margin-top:20px;padding-top:18px}
  .bm-section{min-height:auto}
  .op-copy{grid-template-columns:1fr;padding:36px 24px 40px;gap:28px}
  .op-kicker{margin-bottom:18px}
  .nc-hero-pol{width:220px;margin:0 auto}
  .nc-hero-photo{height:150px}
  .story-sec{padding:40px 24px}
  .story-opening{margin-bottom:40px}
  .story-lede{font-size:18px}
  .story-pillars{grid-template-columns:1fr;margin-bottom:40px}
  .story-pillar{padding:24px 20px}
  .story-pivot{grid-template-columns:1fr;gap:24px;margin-bottom:40px}
  .story-pivot-h{font-size:18px}
  .story-declaration{padding:0 12px}
  .story-decl-h{font-size:30px}
  .story-decl-sub{font-size:14px}
  .step-grid{grid-template-columns:1fr}
  .step-left{padding:28px 24px}
  .step-right{padding:24px;min-height:280px}
  .step-h{font-size:22px}
  .step-body{font-size:14px;margin-bottom:16px}
  .nc-full{padding:40px 24px}
  .nc-full-h,.nc-full-h2{font-size:28px}
  .nc-full-sub{font-size:14px}
  .nc-anns{grid-template-columns:1fr 1fr;gap:10px}
  .nc-ann{padding:14px}
  .gallery-sec{padding:32px 24px}
  .gallery-h{font-size:18px}
  .cork{padding:16px 14px;gap:6px}
  .nc-mini{width:72px;padding:5px 5px 14px}
  .nc-mini-p{font-size:20px}
  .shelf{padding:48px 24px}
  .shelf-h{font-size:30px}
  .shelf-sub{font-size:14px}
  .shelf-rule{margin:20px auto}
  .proof-sec{padding:32px 24px}
  .proof-h{font-size:22px}
  .proof-grid{grid-template-columns:1fr}
  .share-sec{padding:32px 24px}
  .share-grid{grid-template-columns:1fr}
  .lib-sec{padding:32px 24px}
  .lib-books{flex-wrap:wrap;gap:10px}
  .lib-book{width:140px}
  .cta{padding:48px 24px}
  .cta-h{font-size:30px}
  .cta-sub{font-size:14px}
  .cta-btn{padding:15px 36px;font-size:14px}
  .pq{padding:36px 24px}
  .pq-marks{font-size:52px}
  .pq-text{font-size:18px}
  .b-ggrid{grid-template-columns:repeat(3,1fr)}
}
@media(max-width:420px){
  .bm-statement{font-size:34px}
  .bm-line{font-size:18px}
  .bm-line.moment{font-size:17px}
  .story-decl-h{font-size:24px}
  .nc-full-h,.nc-full-h2{font-size:24px}
  .shelf-h{font-size:24px}
  .cta-h{font-size:24px}
  .nc-anns{grid-template-columns:1fr}
  .nc-hero-pol{width:200px}
  .b-ggrid{grid-template-columns:repeat(3,1fr)}
}
`;

const MINI = [
  {bg:'#2D1B69',e:'🌟',t:'The Night Before New',d:'11 Feb',r:-2.5},
  {bg:'#1A3A4A',e:'💛',t:"Milo's New Room",d:'8 Feb',r:1.8},
  {bg:'#3B1F0A',e:'⚔️',t:'The Lost Key',d:'5 Feb',r:-1.2},
  {bg:'#1E2A4A',e:'🌌',t:'Something in the Garden',d:'3 Feb',r:2.4},
  {bg:'#1A2E1A',e:'🧸',t:'The Warm Corner',d:'1 Feb',r:-1.8},
  {bg:'#4A1942',e:'😄',t:"Leo's Big Sneezes",d:'29 Jan',r:1.2},
  {bg:'#1A1A2E',e:'🌟',t:'Stars Again',d:'27 Jan',r:-2},
  {bg:'#2E1A3E',e:'☁️',t:'The Worry Cloud',d:'25 Jan',r:0.8},
];

const BOOKS = [
  {e:'🌟',a:'linear-gradient(135deg,#1E0D4E,#2D1B69)',b:'#18103A',bt:'rgba(192,132,252,.6)',bb:'rgba(192,132,252,.18)',bc:'rgba(192,132,252,.08)',bg:'✓ Therapist',t:'The Night the Stars Listened',ag:'3–7'},
  {e:'🦁',a:'linear-gradient(135deg,#2A1400,#3B1F0A)',b:'#1E1000',bt:'rgba(251,191,36,.6)',bb:'rgba(251,191,36,.18)',bc:'rgba(251,191,36,.07)',bg:'✓ Educator',t:"Leo's Loud Heart",ag:'4–8'},
  {e:'🐇',a:'linear-gradient(135deg,#0A1E10,#1A2E1A)',b:'#080E08',bt:'rgba(52,211,153,.6)',bb:'rgba(52,211,153,.18)',bc:'rgba(52,211,153,.07)',bg:'✓ Therapist',t:'Goodbye, Sweet Clover',ag:'4–9'},
  {e:'☁️',a:'linear-gradient(135deg,#0E1A3A,#1E2A4A)',b:'#0A1228',bt:'rgba(96,165,250,.6)',bb:'rgba(96,165,250,.18)',bc:'rgba(96,165,250,.07)',bg:'✓ Therapist',t:'The Worry Cloud',ag:'3–7'},
  {e:'🌙',a:'linear-gradient(135deg,#3A1040,#4A1942)',b:'#280B2E',bt:'rgba(244,114,182,.6)',bb:'rgba(244,114,182,.18)',bc:'rgba(244,114,182,.07)',bg:'✓ Educator',t:'Two Moons, One Family',ag:'4–8'},
];

interface Props {
  onCreateStory: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onNightCards: () => void;
  onLibrary: () => void;
}

export default function PublicHomepage({ onCreateStory, onSignIn, onSignUp, onNightCards, onLibrary }: Props) {
  const starsRef   = useRef(null);
  const polStarsRef = useRef(null);
  const bmLines = [
    { parts: [{ text: 'Your child.' }],                                                                                       moment: false },
    { parts: [{ text: 'Their world.' }],                                                                                      moment: false },
    { parts: [{ text: 'Their ' }, { text: 'Story.', cls: 'bm-em-story' }],                                                   moment: false },
    { parts: [{ text: 'Your ' }, { text: 'MOMENT', cls: 'bm-em-moment' }, { text: ', ' }, { text: 'Captured.', cls: 'bm-em-cap' }], moment: true  },
  ];
  const [bmVisible, setBmVisible] = useState(bmLines.map(() => false));

  useEffect(() => {
    // Stagger the line reveals
    bmLines.forEach((_, i) => {
      setTimeout(() => {
        setBmVisible(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 900 + i * 1100);
    });

    if (starsRef.current) {
      starsRef.current.innerHTML = '';
      for (let i = 0; i < 70; i++) {
        const s = document.createElement('div');
        s.className = 'bm-star';
        const sz = Math.random() * 1.8 + 0.3;
        s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;opacity:${Math.random()*.38+.06};animation-delay:${Math.random()*4}s;animation-duration:${Math.random()*2+3}s;position:absolute`;
        starsRef.current.appendChild(s);
      }
    }
    if (polStarsRef.current) {
      polStarsRef.current.innerHTML = '';
      for (let i = 0; i < 18; i++) {
        const s = document.createElement('div');
        s.className = 'nc-pol-star';
        const sz = Math.random() * 1.4 + 0.4;
        s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*70}%;position:absolute`;
        polStarsRef.current.appendChild(s);
      }
    }

  }, []);

  return (
    <div className="hp">
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">🌙 SleepSeed</div>
        <div className="nav-links">
          <span className="nl" onClick={onCreateStory}>Create a Story</span>
          <span className="nl" onClick={onNightCards}>Night Cards</span>
          <span className="nl" onClick={onLibrary}>My Library</span>
          <span className="nl">Pricing</span>
        </div>
        <div className="nav-right">
          <span className="nav-in" onClick={onSignIn}>Sign in</span>
          <div className="nav-cta" onClick={onSignUp}>Start free tonight ✨</div>
        </div>
      </nav>

      {/* ── BEDTIME MATTERS — split: statement left, animated lines right ── */}
      <div className="bm-section">
        <div className="bm-stars" ref={starsRef} />
        <div className="bm-glow" /><div className="bm-glow2" />
        <div className="bm-inner">
          <div className="bm-left">
            <div className="bm-statement">
              Bedtime<br />Matters<span className="bm-period">.</span>
            </div>
          </div>
          <div className="bm-right">
            {bmLines.map((line, i) => (
              <div
                key={i}
                className={['bm-line', line.moment ? 'moment' : '', bmVisible[i] ? 'vis' : ''].filter(Boolean).join(' ')}
              >
                {line.parts.map((p, j) => (
                  p.cls
                    ? <span key={j} className={p.cls}>{p.text}</span>
                    : <span key={j}>{p.text}</span>
                ))}
              </div>
            ))}
            <div className="bm-build">
              <div className="bm-build-label">Build tonight's story</div>
              <div className="bm-build-inp-row">
                <input className="bm-build-inp" placeholder="Your child's name…" />
                <div className="bm-build-btn" onClick={onSignUp}>Build their story →</div>
              </div>
              <div className="bm-build-trust">
                <div className="bm-build-ti"><span className="bm-build-ck">✓</span>3 stories free — no card</div>
                <div className="bm-build-ti"><span className="bm-build-ck">✓</span>60 seconds</div>
                <div className="bm-build-ti"><span className="bm-build-ck">✓</span>Night Cards included</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── OPENING — full-width copy, then scene below ── */}
      <div className="opening">
        <div className="op-glow" /><div className="op-glow2" />

        {/* Split copy — left: time contrast / right: observation + statement */}
        <div className="op-copy">

          {/* Left — bright, spare */}
          <div className="op-copy-left">
            <div className="op-kicker">
              <div className="op-kicker-dot" /><div className="op-kicker-line" />
              8:47pm · Tuesday · Nothing special happened today
            </div>
            <div className="op-contrast">
              <div className="op-c-row">
                <div className="op-c-time">6pm</div>
                <div className="op-c-text">Homework, dinner, screens, bath, argument.</div>
              </div>
              <div className="op-c-divider" />
              <div className="op-c-row now">
                <div className="op-c-time">8:47pm</div>
                <div className="op-c-text">Just you. Just them. Just now.</div>
              </div>
            </div>
          </div>

          {/* Right — observation, window, statement */}
          <div className="op-copy-right">
            <div className="op-observe">
              <div className="op-observe-text">
                Something shifts when the noise of the day finally fades. Children stop performing.
                They ask the questions they've been holding all day.{' '}
                <strong>They say the things they only say in the dark.</strong>
              </div>
            </div>
            <div className="op-window">
              There's a window, every night, about twenty minutes long.
            </div>
            <div className="op-statement">
              SleepSeed creates the space. It delivers the moment. Then it captures it —{' '}
              <em>so that at the end of every day, what actually mattered is what you remember.</em>
            </div>
          </div>

        </div>


      </div>

      {/* ── THE STORY SECTION — the missing bridge ── */}
      <div className="story-sec">
        <div className="story-glow-l" /><div className="story-glow-r" />
        <div className="story-inner">

          {/* Opening statement */}
          <div className="story-opening">
            <div className="story-lede">
              Stories have always been how children make sense of their world.{' '}
              <strong>Adventure. Understanding. Healing. Courage.</strong>{' '}
              Story is how all of it gets processed.
            </div>
          </div>

          {/* The four pillars */}
          <div className="story-pillars">
            <div className="story-pillar sp-adventure">
              <div className="story-pillar-scene">
                <svg viewBox="0 0 120 80" fill="none" style={{width:'100%',height:'100%'}}>
                  <circle cx="60" cy="20" r="12" fill="rgba(249,115,22,.08)" stroke="rgba(249,115,22,.2)" strokeWidth="1"/>
                  <path d="M52 18 Q52 11 60 11 Q68 11 68 18" fill="rgba(249,115,22,.15)"/>
                  <circle cx="57" cy="19" r="1.5" fill="rgba(249,115,22,.6)"/>
                  <circle cx="63" cy="19" r="1.5" fill="rgba(249,115,22,.6)"/>
                  <path d="M56 23 Q60 26 64 23" stroke="rgba(249,115,22,.5)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  <rect x="56" y="32" width="8" height="22" rx="4" fill="rgba(249,115,22,.12)" stroke="rgba(249,115,22,.2)" strokeWidth="1"/>
                  <path d="M45 48 Q60 38 75 48" stroke="rgba(249,115,22,.15)" strokeWidth="1" fill="none"/>
                  <path d="M20 60 Q40 30 60 45 Q80 60 100 35" stroke="rgba(249,115,22,.12)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="3 4"/>
                  {[[18,55],[38,32],[72,28],[96,50],[55,65],[85,65]].map(([x,y],i)=>(
                    <circle key={i} cx={x} cy={y} r=".8" fill="rgba(249,115,22,.3)" opacity={.4+i*.1}/>
                  ))}
                </svg>
              </div>
              <div className="story-pillar-word">Adventure</div>
              <div className="story-pillar-desc">Takes a child somewhere they've never been — and shows them they can navigate it.</div>
            </div>

            <div className="story-pillar sp-understanding">
              <div className="story-pillar-scene">
                <svg viewBox="0 0 120 80" fill="none" style={{width:'100%',height:'100%'}}>
                  <circle cx="38" cy="22" r="11" fill="rgba(96,165,250,.08)" stroke="rgba(96,165,250,.2)" strokeWidth="1"/>
                  <path d="M31 20 Q31 14 38 14 Q45 14 45 20" fill="rgba(96,165,250,.14)"/>
                  <circle cx="35.5" cy="21" r="1.4" fill="rgba(96,165,250,.6)"/>
                  <circle cx="40.5" cy="21" r="1.4" fill="rgba(96,165,250,.6)"/>
                  <circle cx="82" cy="24" r="12" fill="rgba(96,165,250,.06)" stroke="rgba(96,165,250,.15)" strokeWidth="1"/>
                  <path d="M75 22 Q75 15 82 15 Q89 15 89 22" fill="rgba(96,165,250,.1)"/>
                  <circle cx="79.5" cy="23" r="1.4" fill="rgba(96,165,250,.5)"/>
                  <circle cx="84.5" cy="23" r="1.4" fill="rgba(96,165,250,.5)"/>
                  <path d="M56 35 Q60 28 64 35" stroke="rgba(96,165,250,.25)" strokeWidth="1" fill="none"/>
                  <path d="M38 36 Q60 52 82 38" stroke="rgba(96,165,250,.18)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  <circle cx="60" cy="48" r="5" fill="rgba(96,165,250,.06)" stroke="rgba(96,165,250,.15)" strokeWidth="1"/>
                  {[[25,58],[50,63],[72,60],[95,55]].map(([x,y],i)=>(
                    <circle key={i} cx={x} cy={y} r=".8" fill="rgba(96,165,250,.25)"/>
                  ))}
                </svg>
              </div>
              <div className="story-pillar-word">Understanding</div>
              <div className="story-pillar-desc">A child who can't name a feeling can live alongside a character who has it — and find their way through.</div>
            </div>

            <div className="story-pillar sp-healing">
              <div className="story-pillar-scene">
                <svg viewBox="0 0 120 80" fill="none" style={{width:'100%',height:'100%'}}>
                  <circle cx="60" cy="24" r="13" fill="rgba(52,211,153,.07)" stroke="rgba(52,211,153,.18)" strokeWidth="1"/>
                  <path d="M52 22 Q52 14 60 14 Q68 14 68 22" fill="rgba(52,211,153,.12)"/>
                  <circle cx="56.5" cy="22" r="1.5" fill="rgba(52,211,153,.55)"/>
                  <circle cx="63.5" cy="22" r="1.5" fill="rgba(52,211,153,.55)"/>
                  <path d="M56 27 Q60 31 64 27" stroke="rgba(52,211,153,.5)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  <path d="M45 42 Q52 36 60 38 Q68 36 75 42" stroke="rgba(52,211,153,.2)" strokeWidth="1" fill="none"/>
                  <path d="M30 65 Q45 45 60 52 Q75 45 90 65" fill="rgba(52,211,153,.06)" stroke="rgba(52,211,153,.12)" strokeWidth="1"/>
                  {[[20,60],[40,50],[60,55],[80,50],[100,58]].map(([x,y],i)=>(
                    <circle key={i} cx={x} cy={y} r="1" fill="rgba(52,211,153,.2)" opacity={.5+i*.08}/>
                  ))}
                  <path d="M55 16 Q60 10 65 16" stroke="rgba(52,211,153,.3)" strokeWidth="1" fill="none"/>
                </svg>
              </div>
              <div className="story-pillar-word">Healing</div>
              <div className="story-pillar-desc">Story gives the hard thing a container. A name. A shape that makes it smaller than it felt.</div>
            </div>

            <div className="story-pillar sp-courage">
              <div className="story-pillar-scene">
                <svg viewBox="0 0 120 80" fill="none" style={{width:'100%',height:'100%'}}>
                  <circle cx="60" cy="22" r="12" fill="rgba(192,132,252,.08)" stroke="rgba(192,132,252,.2)" strokeWidth="1"/>
                  <path d="M52 20 Q52 13 60 13 Q68 13 68 20" fill="rgba(192,132,252,.15)"/>
                  <circle cx="57" cy="21" r="1.5" fill="rgba(192,132,252,.6)"/>
                  <circle cx="63" cy="21" r="1.5" fill="rgba(192,132,252,.6)"/>
                  <path d="M55 25 Q60 29 65 25" stroke="rgba(192,132,252,.5)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  <rect x="56" y="34" width="8" height="18" rx="4" fill="rgba(192,132,252,.1)" stroke="rgba(192,132,252,.18)" strokeWidth="1"/>
                  <path d="M40 68 L60 35 L80 68" stroke="rgba(192,132,252,.12)" strokeWidth="1.5" fill="rgba(192,132,252,.04)" strokeLinecap="round" strokeLinejoin="round"/>
                  {[[28,55],[45,38],[75,38],[92,55]].map(([x,y],i)=>(
                    <path key={i} d={`M${x-3} ${y} L${x} ${y-5} L${x+3} ${y} L${x} ${y+2}Z`} fill="rgba(192,132,252,.2)"/>
                  ))}
                </svg>
              </div>
              <div className="story-pillar-word">Courage</div>
              <div className="story-pillar-desc">A child who hears themselves face something scary — and come through — carries that with them.</div>
            </div>
          </div>

          {/* Personalisation pivot */}
          <div className="story-pivot">
            <div className="story-pivot-left">
              <div className="story-pivot-h">
                The most powerful version of that is the story where{' '}
                <strong>they are the hero</strong> — where their name is in it,
                their dog is in it, their fear about tomorrow is in it.
              </div>
              <div className="story-pivot-h" style={{marginBottom:0}}>
                This is how SleepSeed creates the space.{' '}
                <strong>Not with a generic story.</strong>
              </div>
            </div>
            <div>
              <div className="story-example">
                <div className="story-ex-lbl">Tonight's story is built around</div>
                <div className="story-ex-details">
                  <div className="story-ex-row">
                    <div className="story-ex-key">Name</div>
                    <div className="story-ex-val"><em>Mia</em> — age 5</div>
                  </div>
                  <div className="story-ex-row">
                    <div className="story-ex-key">Tonight</div>
                    <div className="story-ex-val">Starting at a new school tomorrow</div>
                  </div>
                  <div className="story-ex-row">
                    <div className="story-ex-key">Her thing</div>
                    <div className="story-ex-val"><em>Keeps a list of every dog she's ever met — in order of how much they seemed to understand her</em></div>
                  </div>
                </div>
                <div className="story-ex-rule"/>
                <div className="story-ex-result">
                  Tonight, Mia's tummy felt like it was full of tangled string.
                  She opened her notebook to page twelve.{' '}
                  <em>Thirty-one dogs, in order of how much they seemed to understand her.</em>{' '}
                  "Your tummy knows something big is coming," Grandma said quietly.
                  "That makes sense to me."
                </div>
              </div>
            </div>
          </div>

          {/* The closing declaration */}
          <div className="story-declaration">
            <div className="story-decl-pre">The story SleepSeed writes</div>
            <div className="story-decl-h">
              Your child.<br />
              Their world.<br />
              Their words.<br />
              Their <em>Story.</em>
            </div>
            <div className="story-decl-sub">
              Built in 60 seconds. <em>About no one else on earth.</em>
            </div>
          </div>

        </div>
      </div>

      {/* STEP 1 — Build */}
      <div className="step-grid" style={{background:'var(--bg)'}}>
        <div className="step-left">
          <div className="step-num"><div className="step-n">1</div>Build their story</div>
          <div className="step-h">Their world.<br /><em>In 60 seconds.</em></div>
          <div className="step-body">
            Enter their name, tonight's situation, and one thing that makes them <strong>specifically them</strong> — the dog they love, the fear they're carrying, the thing they said at dinner. The story that appears could only be about this child, on this night. Nowhere else exists a story like it.
          </div>
          <div className="step-chips">
            {["Name + situation","One weird detail","5 story genres","Therapist-informed arc"].map((t,i)=>(
              <div key={i} className="step-chip" style={{background:'var(--purple-card)',border:'1px solid var(--purple-s)',color:'var(--purple3)'}}>{t}</div>
            ))}
          </div>
        </div>
        <div className="step-right s1-right">
          <div style={{width:'100%',maxWidth:360,position:'relative',zIndex:1}}>
            <div className="b-bar">
              <div className="b-brand"><div className="b-moon-ico">🌙</div><div className="b-nm">SleepSeed</div></div>
              <div className="b-tg">Story Builder</div>
            </div>
            <div className="b-hero-box">
              <div className="b-hlbl">Tonight's story is for</div>
              <div className="b-hval">Mia ✨</div>
              <div className="b-hsub">Age 5 · Starting at a new school tomorrow</div>
            </div>
            <div className="b-sit">
              <div className="b-slbl">Her special detail</div>
              <div className="b-sval">Keeps a list of every dog she's ever met</div>
              <div className="b-sdet">in order of how much they seemed to understand her</div>
            </div>
            <div className="b-glbl">Choose the kind of story</div>
            <div className="b-ggrid">
              <div className="b-gt gtc on"><div className="b-ge">💛</div><div className="b-gn">Calm</div></div>
              <div className="b-gt gtw"><div className="b-ge">🌌</div><div className="b-gn">Wonder</div></div>
              <div className="b-gt gts"><div className="b-ge">😄</div><div className="b-gn">Silly</div></div>
              <div className="b-gt gta"><div className="b-ge">⚔️</div><div className="b-gn">Adventure</div></div>
              <div className="b-gt gtco"><div className="b-ge">🧸</div><div className="b-gn">Cosy</div></div>
            </div>
            <div className="b-gen">
              <div className="b-gi">✨</div>
              <div>
                <div className="b-gt2">Writing Mia's story…</div>
                <div className="b-gs">Calm · ~700 words · 4 min read aloud</div>
                <div className="b-dots"><div className="b-dot"/><div className="b-dot"/><div className="b-dot"/></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2 — Read (warm break) */}
      <div className="step-grid" style={{borderBottom:'1px solid var(--rule)'}}>
        <div className="step-left s2-left">
          <div className="step-num"><div className="step-n" style={{background:'rgba(251,191,36,.08)',border:'1px solid rgba(251,191,36,.25)',color:'rgba(251,191,36,.8)'}}>2</div>Read it together</div>
          <div className="step-h">Not just <em>any</em> story.<br />This exact one.</div>
          <div className="step-body">
            Mia's list of thirty-one dogs, in order of how much they seemed to understand her — that's <strong>in the story</strong>. The specific thing you entered is woven through it. Their name wherever it matters. Warm, book-style format built for reading aloud. About 4 minutes. Stories that help with the hard nights, not just fill time.
          </div>
          <div className="step-chips">
            {['~4 min read aloud','Therapist-informed arc','5 genres','Saves automatically'].map((t,i)=>(
              <div key={i} className="step-chip" style={{background:'rgba(251,191,36,.07)',border:'1px solid rgba(251,191,36,.18)',color:'rgba(251,191,36,.75)'}}>{t}</div>
            ))}
          </div>
        </div>
        <div className="step-right s2-right">
          <div style={{position:'relative',zIndex:1}}>
            <div className="story-page">
              <div className="sp-moon">🌙</div>
              <div className="sp-genre-badge">💛 Calm</div>
              <div className="sp-title">The Night Before New</div>
              <div className="sp-text">
                Tonight, <span className="sp-name">Mia</span>'s tummy felt like it was full of tangled string. She opened her notebook to page twelve.{' '}
                <em>Thirty-one dogs, in order of how much they seemed to understand her.</em>
              </div>
              <div className="sp-rule" />
              <div className="sp-text">
                "Your tummy knows something big is coming," Grandma said quietly.{' '}
                <em>"That makes sense to me."</em>
                <br /><br />
                The stone fit exactly in <span className="sp-name">Mia</span>'s palm. The stars kept watch. And the house held her, gently, <em>while she slept.</em>
              </div>
              <div className="sp-progress">
                <div className="sp-pdots">
                  <div className="sp-pdot on"/><div className="sp-pdot on"/><div className="sp-pdot"/><div className="sp-pdot"/><div className="sp-pdot"/>
                </div>
                <div className="sp-timer">2 min remaining</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3 — Night Card, full-width cinematic */}
      <div className="nc-full">
        <div className="nc-full-glow" /><div className="nc-full-glow2" />
        <div className="nc-full-inner">
          <div className="nc-full-header">
            <div className="nc-full-step"><div className="nc-full-sn">3</div>Capture the night</div>
            <div className="nc-full-h">The story ends.</div>
            <div className="nc-full-h2">The memory begins.</div>
            <div className="nc-full-sub">
              When "The End" appears, two minutes captures what just happened — their exact words, the best moment of the day, a photo of everyone in the room.{' '}
              <strong>The ordinary Tuesday when nothing happened except the dog knocked over the laundry basket. Those nights vanish. Night Cards keep them.</strong>
            </div>
          </div>

          <div className="nc-pol-wrap">
            <div className="nc-pol">
              <div className="nc-pol-photo">
                <div className="nc-pol-img">
                  <div className="nc-pol-stars" ref={polStarsRef} />
                  <div className="nc-pol-moon">🌙</div>
                  <div className="nc-pol-warm" />
                  <div className="nc-pol-sils"><div className="nc-pol-sp"/><div className="nc-pol-sc"/></div>
                  <div className="nc-pol-time">Tue 11 Feb · 8:47 pm</div>
                </div>
                <div className="nc-pol-story">The Night Before New</div>
              </div>
              <div className="nc-pol-content">
                <div className="nc-pol-portrait">
                  Mia was here tonight, exactly as herself. The best three seconds of the day:{' '}
                  <em>when the dog knocked over the laundry basket and everyone laughed.</em>{' '}
                  When asked what makes her herself, she said quietly:{' '}
                  <em>"I'm really good at remembering things."</em>
                </div>
                <div className="nc-pol-chips">
                  <div className="nc-chip" style={{background:'rgba(180,120,20,.07)',border:'1px solid rgba(180,120,20,.15)'}}>
                    <div className="nc-chipq" style={{color:'#7A5010'}}>Bonding question</div>
                    <div className="nc-chipa" style={{color:'#5A3A00'}}>I'm really good at remembering things.</div>
                  </div>
                  <div className="nc-chip" style={{background:'rgba(80,90,160,.06)',border:'1px solid rgba(80,90,160,.14)'}}>
                    <div className="nc-chipq" style={{color:'#3A4080'}}>Best three seconds</div>
                    <div className="nc-chipa" style={{color:'#2A3060'}}>When the dog knocked over the laundry basket</div>
                  </div>
                  <div className="nc-chip" style={{background:'rgba(20,100,60,.06)',border:'1px solid rgba(20,100,60,.14)'}}>
                    <div className="nc-chipq" style={{color:'#0A5030'}}>Tonight I want to remember</div>
                    <div className="nc-chipa" style={{color:'#083A20'}}>Mia held Grandma's hand the whole way through.</div>
                  </div>
                </div>
                <div className="nc-pol-refrain">Tomorrow is just today, in a different place.</div>
                <div className="nc-pol-stamp">🌙 SleepSeed</div>
              </div>
            </div>
            <div className="nc-pol-date">Mia · Age 5 · 11 Feb 2025</div>
          </div>

          <div className="nc-anns">
            {[
              {n:'1',bc:'rgba(251,191,36,.22)',tc:'rgba(251,191,36,.8)',bg:'rgba(251,191,36,.06)',h:'The Bonding Question',d:'Asked while the story loads. The Night Card captures what they actually said — verbatim, in their own words.',q:'"What\'s the best thing about being you?"'},
              {n:'2',bc:'rgba(96,165,250,.22)',tc:'rgba(96,165,250,.8)',bg:'rgba(96,165,250,.05)',h:'The Gratitude Weave',d:'"What was the best three seconds of today?" One question. Fifteen seconds. The Tuesday in February, preserved forever.',q:null},
              {n:'3',bc:'rgba(52,211,153,.22)',tc:'rgba(52,211,153,.8)',bg:'rgba(52,211,153,.05)',h:'The AI Portrait',d:'2–3 sentences written about this specific child on this specific night, using their actual answers. Could only be about tonight.',q:'"Mia was here tonight, exactly as herself…"'},
              {n:'4',bc:'rgba(168,85,247,.22)',tc:'rgba(168,85,247,.8)',bg:'rgba(168,85,247,.05)',h:'The Photo',d:'Everyone in the room — the tired parent in pyjamas at 8:47pm on a Wednesday. That image, in ten years, is everything.',q:null},
            ].map((a,i)=>(
              <div key={i} className="nc-ann">
                <div className="nc-ann-n" style={{border:`1px solid ${a.bc}`,color:a.tc,background:a.bg}}>{a.n}</div>
                <div className="nc-ann-h">{a.h}</div>
                <div className="nc-ann-d">{a.d}</div>
                {a.q && <div className="nc-ann-q">{a.q}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GALLERY */}
      <div className="gallery-sec">
        <div className="gallery-hdr">
          <div>
            <div className="gallery-ey"><div className="gallery-ey-dot"/>Memories Library</div>
            <div className="gallery-h">After a year, you have 300+ cards.</div>
          </div>
          <div className="gallery-count">Mia · 47 nights captured</div>
        </div>
        <div className="cork">
          {MINI.map((c,i)=>(
            <div key={i} className="nc-mini" style={{transform:`rotate(${c.r}deg)`}}>
              <div className="nc-mini-p" style={{background:`linear-gradient(135deg,${c.bg},${c.bg}cc)`}}>{c.e}</div>
              <div className="nc-mini-t">{c.t}</div>
              <div className="nc-mini-d">{c.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SHELF MOMENT */}
      <div className="shelf">
        <div className="shelf-inner">
          <div className="shelf-ey"><div className="shelf-ey-line"/>The Annual Book<div className="shelf-ey-line"/></div>
          <div className="shelf-h">By the time they<br />leave home,<br /><em>there's a shelf.</em></div>
          <div className="shelf-rule" />
          <div className="shelf-sub">
            Every January, SleepSeed creates a printed hardcover — the year's most significant Night Cards, beautifully laid out, mailed to your door.{' '}
            <em>When they have children of their own, they read from them.</em>
          </div>
          <div className="shelf-books">
            {[{w:148,h:220,t:"Mia's Year\nin Bedtime",y:'2025',op:1,bg:'linear-gradient(150deg,#1E1C38,#2A2848)'},{w:138,h:206,t:"Mia · 2024",y:'2024',op:.52,bg:'linear-gradient(150deg,#1A1830,#242240)'},{w:128,h:192,t:"Mia · 2023",y:'2023',op:.28,bg:'linear-gradient(150deg,#161428,#1E1C38)'}].map((b,i)=>(
              <div key={i} className="shelf-bk" style={{width:b.w,height:b.h,background:b.bg,opacity:b.op,marginLeft:i>0?-18:0,zIndex:3-i}}>
                <div className="shelf-bk-spine" />
                <div style={{marginLeft:20,display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                  <div style={{fontSize:30+i*2,opacity:.4}}>🌙</div>
                  <div className="shelf-bk-title" style={{fontSize:9}}>{b.t}</div>
                  <div className="shelf-bk-year" style={{fontSize:7}}>{b.y}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="shelf-note">
            Three years. Three Annual Books. The child is 8 now.<br/>She knows which night she asked if the stars could see her.
          </div>
        </div>
      </div>

      {/* PULL QUOTE */}
      <div className="pq">
        <div className="pq-inner">
          <span className="pq-marks">"</span>
          <div className="pq-text">
            I went back and read what my son said three months ago. He said the best three seconds of the day was when I tickled him.{' '}
            <em>I'd completely forgotten.</em>{' '}
            Night Cards gave it back to me.
          </div>
          <div className="pq-rule" />
          <div className="pq-attr">James T. · Dad of one, age 5</div>
        </div>
      </div>


      {/* SOCIAL PROOF */}
      <div className="proof-sec">
        <div className="proof-ey"><div className="proof-ey-dot"/>What families say</div>
        <div className="proof-h">The reaction on the first night.</div>
        <div className="proof-sub">"Daddy, that's MY name!" — what parents hear when the first story begins.</div>
        <div className="proof-grid">
          {[
            {cls:'amber',e:'👩',q:"We've done it every single night for four months. My daughter asks for it before I even suggest it. Bedtime went from something I dreaded to the part of the day we both look forward to most.",nc:"Her Night Card from Week 1: 'The best three seconds was when you carried me to bed.'",n:'Sarah M.',d:'Mum of two · ages 4 & 7'},
            {cls:'teal',e:'👩',q:"As a child therapist I recommended it to a family navigating a new sibling. The mum called me two weeks later. The older child was asking for bedtime stories for the first time in months.",nc:"Story used: 'Calm' genre · handling a big life transition",n:'Dr. Lisa R.',d:'Child & Family Therapist'},
            {cls:'purple',e:'👨',q:"My daughter heard her name in the first story and stopped everything. She sat up, looked at me and said 'that's about me.' She asked to hear it again before I'd even finished.",nc:"Her Night Card answer: 'The best three seconds was right now.'",n:'Marcus D.',d:'Dad of one · age 6'},
          ].map((r,i)=>(
            <div key={i} className={`pcard ${r.cls}`}>
              <div className="pcard-q">"{r.q}"</div>
              <div className="pcard-nc">
                <div className="pcard-nc-lbl">Their Night Card</div>
                <div className="pcard-nc-text">{r.nc}</div>
              </div>
              <div className="pcard-meta">
                <div className="pcard-av">{r.e}</div>
                <div><div className="pcard-name">{r.n}</div><div className="pcard-det">{r.d}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SHARING */}
      <div className="share-sec">
        <div className="proof-ey"><div className="proof-ey-dot"/>Share the night</div>
        <div className="proof-h">The moments that <span style={{fontFamily:"'Lora',serif",fontStyle:'italic',color:'var(--gold)'}}>spread themselves.</span></div>
        <div className="proof-sub">Night Cards are built to be shared. One tap. The Polaroid. Their exact words. Zero friction.</div>
        <div className="share-grid">
          {[
            {icon:'📱',bg:'rgba(251,191,36,.07)',border:'rgba(251,191,36,.14)',h:"Share tonight's Night Card",d:"One tap sends the Polaroid to Instagram Stories — the child's words, the story title, the hashtag. A parent who posts a Night Card is your best marketing."},
            {icon:'👴',bg:'rgba(52,211,153,.06)',border:'rgba(52,211,153,.12)',h:'Read together with Grandma',d:"One link. Grandparents open the same story on their device — no account needed. Ends with: 'Want to create stories for Mia any time?' Your most underused acquisition channel."},
            {icon:'🎁',bg:'rgba(168,85,247,.07)',border:'rgba(168,85,247,.14)',h:'Gift a month to another family',d:'A parent who receives their first personalised story as a gift becomes a subscriber within the week. The Night Card they create that night seals it.'},
          ].map((s,i)=>(
            <div key={i} className="scard" style={{border:`1px solid ${s.border}`}}>
              <div className="scard-icon" style={{background:s.bg}}>{s.icon}</div>
              <div className="scard-h">{s.h}</div>
              <div className="scard-d">{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LIBRARY */}
      <div className="lib-sec">
        <div className="lib-top">
          <div>
            <div className="proof-ey" style={{color:'rgba(192,132,252,.5)',marginBottom:8}}>
              <div className="proof-ey-dot" style={{background:'rgba(192,132,252,.4)'}}/>📚 Coming soon
            </div>
            <div style={{fontFamily:"'Lora',serif",fontSize:24,fontWeight:700,color:'var(--ink)',marginBottom:6,letterSpacing:'-.3px'}}>The SleepSeed Library</div>
            <div style={{fontSize:14.5,color:'var(--ink3)',fontWeight:300}}>200+ expert-reviewed stories. Therapist approved. Educator endorsed. Always free to browse.</div>
          </div>
          <div className="lib-notify" onClick={onLibrary}>Join the waitlist →</div>
        </div>
        <div className="lib-books">
          {BOOKS.map((b,i)=>(
            <div key={i} className="lib-book">
              <div className="lib-book-art" style={{background:b.a}}>{b.e}</div>
              <div className="lib-book-body" style={{background:b.b}}>
                <div className="lib-book-badge" style={{background:b.bc,color:b.bt,border:`1px solid ${b.bb}`}}>{b.bg}</div>
                <div className="lib-book-title">{b.t}</div>
                <div className="lib-book-age">Ages {b.ag}</div>
              </div>
            </div>
          ))}
          <div className="lib-soon"><div style={{fontSize:22,opacity:.15}}>📚</div><div className="lib-soon-txt">195 more<br/>coming soon</div></div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta">
        <div className="cta-inner">
          <span className="cta-moon">🌙</span>
          <div className="cta-h">Tonight happened.<br /><em>Keep it.</em></div>
          <div className="cta-sub">
            Your child will say something true tonight. Build their story in 60 seconds and capture the night when it ends. Start free — no credit card, no friction.
          </div>
          <div className="cta-btn" onClick={onSignUp}>Build tonight's story — free ✨</div>
          <div className="cta-note">Then <strong>$9.99/month</strong> or <strong>$79/year</strong> (save 34%). Cancel any time.</div>
          <div className="cta-trust">
            {['3 stories free','No card needed','Night Cards included','No ads, ever','Photos stay on your device'].map((t,i)=>(
              <div key={i} className="cta-ti"><span className="cta-ck">✓</span>{t}</div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
