import { useEffect, useRef } from 'react';
import { useApp } from '../AppContext';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#0D1018;--night2:#131828;
  --amber:#E8972A;--amber2:#F5B84C;
  --rose:#C85070;--cream:#FEF9F2;--parch:#F8F1E4;
  --ink:#1A1420;--ink2:#4A4058;--ink3:#8A7898;
  --serif:'Playfair Display',Georgia,serif;
  --sans:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono:'DM Mono',monospace;
}
.hp{background:var(--night);color:#F4EFE8;font-family:var(--sans);-webkit-font-smoothing:antialiased}
.fade-up{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
.fade-up.vis{opacity:1;transform:translateY(0)}
.fade-up:nth-child(2){transition-delay:.1s}
.fade-up:nth-child(3){transition-delay:.2s}
.fade-up:nth-child(4){transition-delay:.3s}

.hp-nav{background:rgba(13,16,24,.97);backdrop-filter:blur(16px);border-bottom:1px solid rgba(232,151,42,.12);padding:0 6%;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:100}
.hp-logo{font-family:var(--serif);font-size:20px;font-weight:700;color:#F4EFE8;display:flex;align-items:center;gap:9px;cursor:pointer;border:none;background:none}
.hp-logo-moon{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);flex-shrink:0}
.hp-nav-links{display:flex;gap:28px}
.hp-nl{font-size:13px;color:rgba(244,239,232,.45);cursor:pointer;font-weight:400;transition:color .15s;background:none;border:none;font-family:var(--sans)}
.hp-nl:hover{color:rgba(244,239,232,.85)}
.hp-nav-right{display:flex;align-items:center;gap:12px}
.hp-signin{font-size:13px;color:rgba(244,239,232,.5);cursor:pointer;font-weight:400;background:none;border:none;font-family:var(--sans);transition:color .15s}
.hp-signin:hover{color:rgba(244,239,232,.85)}
.hp-cta-sm{background:var(--amber);color:var(--ink);padding:9px 22px;border-radius:50px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:var(--sans);transition:all .2s}
.hp-cta-sm:hover{background:var(--amber2);transform:translateY(-1px)}

.hero{min-height:100vh;background:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(232,151,42,.08),transparent),var(--night);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 6% 100px;text-align:center;position:relative;overflow:hidden}
.hero-stars{position:absolute;inset:0;pointer-events:none}
.hero-star{position:absolute;border-radius:50%;background:#FFF8E8;animation:twinkle var(--d,4s) var(--dl,0s) ease-in-out infinite}
@keyframes twinkle{0%,100%{opacity:.06}50%{opacity:.5}}
.hero-glow{position:absolute;bottom:-120px;left:50%;transform:translateX(-50%);width:700px;height:350px;border-radius:50%;background:radial-gradient(ellipse,rgba(232,151,42,.07),transparent 65%);pointer-events:none}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(232,151,42,.1);border:1px solid rgba(232,151,42,.25);border-radius:50px;padding:7px 18px;font-size:11px;font-family:var(--mono);color:var(--amber2);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:32px}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--amber);animation:pulse 2s ease-in-out infinite;flex-shrink:0}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.7)}}
.hero-h{font-family:var(--serif);font-size:clamp(42px,6.5vw,80px);font-weight:900;line-height:1.06;letter-spacing:-.03em;color:#F4EFE8;margin-bottom:22px;max-width:900px;position:relative;z-index:1}
.hero-h em{font-style:italic;color:var(--amber2)}
.hero-sub{font-size:clamp(15px,1.8vw,18px);color:rgba(244,239,232,.58);font-weight:300;line-height:1.78;max-width:540px;margin:0 auto 48px;position:relative;z-index:1}
.hero-sub strong{color:rgba(244,239,232,.82);font-weight:500}
.hero-form{width:100%;max-width:500px;margin:0 auto 24px;position:relative;z-index:1}
.hero-input-row{display:flex;background:rgba(255,255,255,.06);border:1.5px solid rgba(232,151,42,.3);border-radius:16px;overflow:hidden;transition:border-color .2s}
.hero-input-row:focus-within{border-color:var(--amber);box-shadow:0 0 0 4px rgba(232,151,42,.08)}
.hero-input{flex:1;background:none;border:none;padding:17px 22px;font-size:16px;color:#F4EFE8;font-family:var(--sans);outline:none;font-weight:400;min-width:0}
.hero-input::placeholder{color:rgba(244,239,232,.25)}
.hero-submit{background:var(--amber);color:var(--ink);border:none;padding:17px 26px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--sans);white-space:nowrap;transition:background .2s;flex-shrink:0}
.hero-submit:hover{background:var(--amber2)}
.hero-trust{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;position:relative;z-index:1}
.hero-trust-item{font-size:12px;color:rgba(244,239,232,.35);display:flex;align-items:center;gap:7px}
.hero-ck{width:16px;height:16px;border-radius:50%;background:rgba(232,151,42,.12);border:1px solid rgba(232,151,42,.28);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.hero-scene{position:absolute;bottom:0;right:4%;width:340px;height:300px;pointer-events:none;opacity:.3}

.window-sec{background:var(--night2);padding:90px 6%;border-top:1px solid rgba(232,151,42,.06);border-bottom:1px solid rgba(232,151,42,.06)}
.window-inner{max-width:900px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}
.window-kicker{font-size:10px;font-family:var(--mono);letter-spacing:2.5px;text-transform:uppercase;color:rgba(232,151,42,.5);margin-bottom:22px;display:flex;align-items:center;gap:10px}
.window-kicker::after{content:'';flex:1;height:1px;background:rgba(232,151,42,.12)}
.w-row{display:flex;gap:16px;align-items:baseline;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.w-row:last-child{border-bottom:none}
.w-time{font-family:var(--mono);font-size:11px;color:rgba(244,239,232,.28);width:54px;flex-shrink:0}
.w-text{font-size:14px;color:rgba(244,239,232,.32);font-weight:300;line-height:1.5}
.w-row.now .w-time{color:var(--amber);font-weight:500;font-size:12px}
.w-row.now .w-text{color:rgba(244,239,232,.92);font-weight:500;font-size:17px;line-height:1.45}
.window-quote{font-family:var(--serif);font-size:clamp(17px,2.5vw,23px);font-style:italic;color:rgba(244,239,232,.7);line-height:1.75;margin-bottom:22px}
.window-quote strong{font-style:normal;color:rgba(244,239,232,.92);font-weight:700}
.window-statement{font-size:14px;color:rgba(244,239,232,.48);line-height:1.78;font-weight:300}
.window-statement strong{color:rgba(232,151,42,.88);font-weight:600}

.how-sec{background:var(--cream);padding:110px 6%}
.how-inner{max-width:1060px;margin:0 auto}
.sec-label{font-size:10px;font-family:var(--mono);letter-spacing:2.5px;text-transform:uppercase;color:var(--ink3);margin-bottom:14px;display:flex;align-items:center;gap:10px}
.sec-label::before{content:'';width:24px;height:1px;background:var(--ink3);flex-shrink:0}
.sec-h{font-family:var(--serif);font-size:clamp(32px,4.5vw,54px);font-weight:700;color:var(--ink);line-height:1.1;letter-spacing:-.03em;margin-bottom:12px}
.sec-sub{font-size:16px;color:var(--ink2);font-weight:300;line-height:1.68;max-width:520px;margin-bottom:68px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.step{background:#fff;border-radius:22px;overflow:hidden;border:1px solid rgba(26,20,32,.07);transition:transform .25s,box-shadow .25s}
.step:hover{transform:translateY(-5px);box-shadow:0 20px 50px rgba(26,20,32,.1)}
.step-num{width:34px;height:34px;border-radius:50%;background:var(--amber);color:var(--ink);font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:var(--mono);flex-shrink:0}
.step-body{padding:30px}
.step-header{display:flex;align-items:center;gap:13px;margin-bottom:14px}
.step-title{font-family:var(--serif);font-size:19px;font-weight:700;color:var(--ink)}
.step-desc{font-size:13.5px;color:var(--ink2);line-height:1.72;font-weight:300;margin-bottom:18px}
.step-tags{display:flex;flex-wrap:wrap;gap:7px}
.step-tag{font-size:10px;font-weight:500;padding:4px 12px;border-radius:50px;background:#F0EAD8;color:var(--ink2);font-family:var(--mono)}
.story-card{background:linear-gradient(160deg,#FDF8EE,#F7EDDA);border-radius:14px;padding:22px;border:1px solid rgba(180,140,60,.12);margin:0 28px 28px}
.sc-genre{display:inline-flex;align-items:center;gap:5px;background:rgba(52,180,130,.1);border:1px solid rgba(52,180,130,.25);border-radius:50px;padding:3px 11px;font-size:9px;font-family:var(--mono);color:#1A7A56;margin-bottom:12px;font-weight:600;letter-spacing:.3px}
.sc-title{font-family:var(--serif);font-size:15px;font-weight:700;color:#2E1E08;margin-bottom:10px}
.sc-text{font-family:var(--serif);font-size:12px;color:#6B4A18;line-height:1.85;font-style:italic}
.sc-name{color:#B87010;font-style:normal;font-weight:700}
.nc-preview{background:linear-gradient(160deg,#F5F0E8,#EDE5D8);border-radius:4px;padding:12px 12px 28px;margin:0 28px 28px;box-shadow:0 6px 24px rgba(0,0,0,.1)}
.nc-photo-box{width:100%;aspect-ratio:1;background:linear-gradient(145deg,#1A1C2A,#221830);border-radius:3px;margin-bottom:12px;display:flex;align-items:flex-end;justify-content:center;position:relative;overflow:hidden;padding-bottom:14px}
.nc-warm{position:absolute;bottom:0;left:0;right:0;height:55%;background:radial-gradient(ellipse at 50% 120%,rgba(200,120,40,.2),transparent 65%)}
.nc-ts{position:absolute;top:7px;left:8px;font-size:7px;font-family:var(--mono);color:rgba(255,255,255,.42);background:rgba(0,0,0,.4);padding:2px 6px;border-radius:3px}
.nc-sil{display:flex;align-items:flex-end;gap:9px;position:relative;z-index:1}
.nc-sil-p{width:28px;height:60px;background:rgba(0,0,0,.55);border-radius:14px 14px 3px 3px;position:relative}
.nc-sil-p::before{content:'';position:absolute;top:-12px;left:50%;transform:translateX(-50%);width:19px;height:19px;border-radius:50%;background:rgba(0,0,0,.55)}
.nc-sil-c{width:19px;height:42px;background:rgba(0,0,0,.48);border-radius:9px 9px 3px 3px;position:relative}
.nc-sil-c::before{content:'';position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:14px;height:14px;border-radius:50%;background:rgba(0,0,0,.48)}
.nc-name-line{font-family:Georgia,serif;font-size:11px;color:#3A2600;text-align:center;font-style:italic;line-height:1.45}
.nc-resp{border-radius:5px;padding:6px 9px;margin-top:7px}
.nc-resp-q{font-size:7.5px;font-family:var(--mono);opacity:.5;margin-bottom:3px;text-transform:uppercase;letter-spacing:.3px;font-weight:600}
.nc-resp-a{font-family:Georgia,serif;font-size:10px;line-height:1.4;font-style:italic}

.nc-sec{background:var(--night2);padding:110px 6%}
.nc-inner{max-width:1060px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.nc-left .sec-label{color:rgba(232,151,42,.55)}
.nc-left .sec-label::before{background:rgba(232,151,42,.3)}
.nc-left .sec-h{color:#F4EFE8}
.nc-left .sec-sub{color:rgba(244,239,232,.48);margin-bottom:36px}
.nc-features{display:flex;flex-direction:column;gap:18px}
.nc-feat{display:flex;gap:15px;align-items:flex-start}
.nc-feat-num{width:28px;height:28px;border-radius:50%;border:1px solid rgba(232,151,42,.35);color:rgba(232,151,42,.8);font-size:11px;font-family:var(--mono);display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(232,151,42,.05)}
.nc-feat-h{font-size:14px;font-weight:600;color:#F4EFE8;margin-bottom:4px}
.nc-feat-d{font-size:12.5px;color:rgba(244,239,232,.42);line-height:1.62;font-weight:300}
.nc-right{display:flex;justify-content:center;align-items:center}
.nc-pol-large{background:#F4EFE2;border-radius:4px;padding:15px 15px 38px;width:280px;box-shadow:0 36px 90px rgba(0,0,0,.75),0 8px 28px rgba(0,0,0,.5);transform:rotate(-1.8deg)}
.nc-pol-photo{width:100%;aspect-ratio:1;border-radius:3px;overflow:hidden;background:linear-gradient(160deg,#161828,#201830);position:relative;display:flex;align-items:flex-end;justify-content:center;padding-bottom:20px}
.nc-pol-photo::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 110%,rgba(200,120,40,.18),transparent 65%)}
.nc-pol-ts{position:absolute;top:8px;left:9px;font-size:7px;font-family:var(--mono);color:rgba(255,255,255,.38);background:rgba(0,0,0,.42);padding:2px 6px;border-radius:3px;z-index:2}
.nc-pol-sil{display:flex;align-items:flex-end;gap:9px;position:relative;z-index:1}
.nc-pol-sil-p{width:30px;height:66px;background:rgba(0,0,0,.55);border-radius:15px 15px 3px 3px;position:relative}
.nc-pol-sil-p::before{content:'';position:absolute;top:-13px;left:50%;transform:translateX(-50%);width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,.55)}
.nc-pol-sil-c{width:20px;height:46px;background:rgba(0,0,0,.48);border-radius:10px 10px 3px 3px;position:relative}
.nc-pol-sil-c::before{content:'';position:absolute;top:-11px;left:50%;transform:translateX(-50%);width:15px;height:15px;border-radius:50%;background:rgba(0,0,0,.48)}
.nc-pol-content{padding:11px 5px 0}
.nc-portrait{font-family:Georgia,serif;font-size:10.5px;font-style:italic;color:#3A2000;line-height:1.68;border-bottom:1px solid rgba(58,32,0,.1);padding-bottom:9px;margin-bottom:9px}
.nc-chips{display:flex;flex-direction:column;gap:5px}
.nc-chip{border-radius:4px;padding:6px 8px}
.nc-chipq{font-size:7.5px;font-family:var(--mono);letter-spacing:.3px;opacity:.52;margin-bottom:3px;font-weight:600;text-transform:uppercase}
.nc-chipa{font-family:Georgia,serif;font-size:10px;font-style:italic;line-height:1.45}
.nc-stamp{font-size:8px;color:rgba(58,32,0,.2);font-family:var(--mono);text-align:right;margin-top:7px;padding-top:5px;border-top:1px solid rgba(58,32,0,.07)}

.proof-sec{background:var(--parch);padding:110px 6%}
.proof-inner{max-width:1060px;margin:0 auto}
.proof-sec .sec-h{color:var(--ink)}
.proof-sec .sec-sub{color:var(--ink2)}
.testimonials{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.tcard{background:#fff;border-radius:20px;padding:30px;border:1px solid rgba(26,20,32,.06);position:relative;overflow:hidden;transition:transform .2s,box-shadow .2s}
.tcard:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(26,20,32,.08)}
.tcard::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:3px 3px 0 0}
.tcard.amber::before{background:linear-gradient(90deg,#E8972A,rgba(232,151,42,.05))}
.tcard.rose::before{background:linear-gradient(90deg,#C85070,rgba(200,80,112,.05))}
.tcard.teal::before{background:linear-gradient(90deg,#2AB89A,rgba(42,184,154,.05))}
.tcard-quote{font-family:var(--serif);font-size:14px;font-style:italic;color:var(--ink2);line-height:1.8;margin-bottom:20px}
.tcard-moment{background:#FAF4E8;border-radius:9px;padding:11px 13px;margin-bottom:20px;font-size:11.5px;font-family:var(--mono);color:var(--ink2);line-height:1.6}
.tcard-moment-label{font-size:8px;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-bottom:5px;font-weight:600}
.tcard-meta{display:flex;align-items:center;gap:11px}
.tcard-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#D4A060,#B07020);display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:700;font-family:var(--mono);flex-shrink:0}
.tcard-name{font-size:13px;font-weight:600;color:var(--ink)}
.tcard-role{font-size:11px;color:var(--ink3);margin-top:2px}

.price-sec{background:var(--night);padding:110px 6%}
.price-inner{max-width:840px;margin:0 auto;text-align:center}
.price-sec .sec-label{justify-content:center}
.price-sec .sec-label::before{display:none}
.price-sec .sec-h{color:#F4EFE8}
.price-sec .sec-sub{margin:0 auto 60px;color:rgba(244,239,232,.48)}
.price-cards{display:grid;grid-template-columns:1fr 1fr;gap:22px;text-align:left;max-width:620px;margin:0 auto}
.pcard{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:30px}
.pcard.featured{background:rgba(232,151,42,.07);border-color:rgba(232,151,42,.3);position:relative;overflow:hidden}
.pcard.featured::after{content:'Most popular';position:absolute;top:16px;right:16px;background:var(--amber);color:var(--ink);font-size:9px;font-weight:700;padding:3px 11px;border-radius:50px;font-family:var(--mono);letter-spacing:.5px}
.pcard-tier{font-size:10px;font-family:var(--mono);letter-spacing:1.5px;text-transform:uppercase;color:rgba(244,239,232,.3);margin-bottom:16px}
.pcard.featured .pcard-tier{color:rgba(232,151,42,.65)}
.pcard-price{font-family:var(--serif);font-size:46px;font-weight:700;color:#F4EFE8;line-height:1;margin-bottom:6px;display:flex;align-items:flex-start;gap:2px}
.pcard-price sup{font-size:21px;font-weight:400;font-family:var(--sans);margin-top:10px}
.pcard-price sub{font-size:14px;font-weight:300;font-family:var(--sans);color:rgba(244,239,232,.45);align-self:flex-end;margin-bottom:6px}
.pcard-note{font-size:11px;color:rgba(244,239,232,.3);margin-bottom:24px;font-family:var(--mono)}
.pcard-btn{width:100%;padding:13px;border-radius:13px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--sans);border:none;transition:all .2s}
.pcard-btn.outline{background:transparent;border:1.5px solid rgba(255,255,255,.14);color:rgba(244,239,232,.6)}
.pcard-btn.outline:hover{border-color:rgba(255,255,255,.28);color:#F4EFE8}
.pcard-btn.solid{background:var(--amber);color:var(--ink)}
.pcard-btn.solid:hover{background:var(--amber2);transform:translateY(-1px)}
.pcard-features{margin-top:22px;display:flex;flex-direction:column;gap:10px}
.pcard-feat{font-size:12.5px;color:rgba(244,239,232,.52);display:flex;align-items:center;gap:9px;font-weight:300}
.pcard-feat::before{content:'';width:16px;height:16px;border-radius:50%;background:rgba(232,151,42,.1);border:1px solid rgba(232,151,42,.22);flex-shrink:0;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3.5 8l3 3 6-6' stroke='rgba(232,151,42,.75)' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-size:contain}

.cta-sec{background:radial-gradient(ellipse 60% 50% at 50% 100%,rgba(232,151,42,.07),transparent),var(--night2);padding:130px 6%;text-align:center;border-top:1px solid rgba(232,151,42,.06)}
.cta-moon{width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);margin:0 auto 32px;box-shadow:0 0 50px 10px rgba(232,151,42,.12)}
.cta-h{font-family:var(--serif);font-size:clamp(38px,6vw,68px);font-weight:700;color:#F4EFE8;line-height:1.08;letter-spacing:-.03em;margin-bottom:18px}
.cta-h em{font-style:italic;color:var(--amber2)}
.cta-sub{font-size:18px;color:rgba(244,239,232,.48);font-weight:300;line-height:1.78;max-width:500px;margin:0 auto 48px}
.cta-btn-large{background:var(--amber);color:var(--ink);padding:20px 60px;border-radius:50px;font-size:17px;font-weight:700;cursor:pointer;border:none;font-family:var(--sans);transition:all .25s}
.cta-btn-large:hover{background:var(--amber2);transform:translateY(-3px);box-shadow:0 20px 50px rgba(232,151,42,.28)}
.cta-note{font-size:12px;color:rgba(244,239,232,.28);margin-top:18px;font-family:var(--mono)}
.cta-note strong{color:rgba(244,239,232,.48);font-weight:500}
.cta-trust2{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;margin-top:32px}
.cta-trust2 span{font-size:12px;color:rgba(244,239,232,.28);display:flex;align-items:center;gap:6px;font-family:var(--mono)}

.hp-footer{background:var(--night);border-top:1px solid rgba(255,255,255,.05);padding:36px 6%;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
.hp-footer-logo{font-family:var(--serif);font-size:16px;font-weight:700;color:rgba(244,239,232,.45);display:flex;align-items:center;gap:8px}
.hp-footer-links{display:flex;gap:22px}
.hp-footer-link{font-size:12px;color:rgba(244,239,232,.22);text-decoration:none;transition:color .15s;background:none;border:none;cursor:pointer;font-family:var(--sans)}
.hp-footer-link:hover{color:rgba(244,239,232,.5)}
.hp-footer-copy{font-size:11px;color:rgba(244,239,232,.18);font-family:var(--mono)}

@media(max-width:900px){
  .window-inner,.nc-inner{grid-template-columns:1fr;gap:44px}
  .steps,.testimonials,.price-cards{grid-template-columns:1fr}
  .hero-scene{display:none}
}
@media(max-width:640px){
  .hp-nav-links{display:none}
  .hero{padding:60px 5% 80px;min-height:auto}
  .hp-footer{flex-direction:column;text-align:center}
  .hp-footer-links{justify-content:center}
}
`;

interface Props {
  onCreateStory: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onNightCards: () => void;
  onLibrary: () => void;
}

export default function PublicHomepage({ onCreateStory, onSignIn, onSignUp, onNightCards, onLibrary }: Props) {
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Build stars
    const container = starsRef.current;
    if (container) {
      for (let i = 0; i < 70; i++) {
        const s = document.createElement('div');
        s.className = 'hero-star';
        const sz = Math.random() * 1.9 + 0.3;
        s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${3+Math.random()*3.5}s;--dl:${Math.random()*4.5}s`;
        container.appendChild(s);
      }
    }
    // Scroll-triggered fade-ups
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const Check = () => (
    <div className="hero-ck">
      <svg viewBox="0 0 8 8" fill="none" style={{width:8,height:8}}>
        <path d="M1.5 4l2 2 3-3" stroke="#E8972A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );

  return (
    <div className="hp">
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="hp-nav">
        <button className="hp-logo">
          <div className="hp-logo-moon" />
          SleepSeed
        </button>
        <div className="hp-nav-links">
          <button className="hp-nl" onClick={() => { const el = document.getElementById('about'); el?.scrollIntoView({behavior:'smooth'}); }}>About</button>
          <button className="hp-nl">Pricing</button>
        </div>
        <div className="hp-nav-right">
          <button className="hp-signin" onClick={onSignIn}>Sign in</button>
          <button className="hp-cta-sm" onClick={onSignUp}>Start free</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-stars" ref={starsRef} />
        <div className="hero-glow" />
        <div className="hero-badge"><div className="hero-badge-dot" />Free to start — no card needed</div>
        <h1 className="hero-h fade-up">
          A bedtime story written<br />
          <em>for your child.</em><br />
          <span style={{fontStyle:'normal',color:'rgba(244,239,232,.88)'}}>Tonight. In 60 seconds.</span>
        </h1>
        <p className="hero-sub fade-up">
          Type their name. SleepSeed writes a personalised story starring <strong>them</strong> — their dog, their fear about tomorrow, their world. Then captures what they say when it ends.
        </p>
        <div className="hero-form fade-up">
          <div className="hero-input-row">
            <input className="hero-input" type="text" placeholder="Your child's name…" />
            <button className="hero-submit" onClick={onSignUp}>Build their story →</button>
          </div>
        </div>
        <div className="hero-trust fade-up">
          <div className="hero-trust-item"><Check />3 stories free</div>
          <div className="hero-trust-item"><Check />No credit card</div>
          <div className="hero-trust-item"><Check />Ready in 60 seconds</div>
          <div className="hero-trust-item"><Check />Night Cards included</div>
        </div>
        <svg className="hero-scene" viewBox="0 0 340 300" fill="none">
          <ellipse cx="230" cy="70" rx="90" ry="55" fill="rgba(232,151,42,.05)"/>
          <rect x="222" y="65" width="9" height="76" fill="rgba(232,151,42,.14)"/>
          <ellipse cx="227" cy="61" rx="25" ry="13" fill="rgba(232,151,42,.18)" stroke="rgba(232,151,42,.28)" strokeWidth="1"/>
          <rect x="65" y="190" width="210" height="65" rx="6" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
          <rect x="65" y="168" width="210" height="26" rx="5" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
          <circle cx="120" cy="174" r="14" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.07)" strokeWidth="1"/>
          <circle cx="238" cy="168" r="13" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.07)" strokeWidth="1"/>
          <rect x="218" y="163" width="22" height="15" rx="2" fill="rgba(232,151,42,.13)" stroke="rgba(232,151,42,.22)" strokeWidth="1"/>
          {[[170,130,1.3,'rgba(232,151,42,.4)'],[200,115,1,'rgba(232,151,42,.3)'],[145,140,.9,'rgba(232,151,42,.35)'],[185,100,1.2,'rgba(255,255,255,.28)'],[125,108,.8,'rgba(255,255,255,.22)'],[260,95,1.3,'rgba(255,255,255,.28)'],[85,118,.8,'rgba(255,255,255,.18)']].map(([x,y,r,f],i)=>(
            <circle key={i} cx={x as number} cy={y as number} r={r as number} fill={f as string}/>
          ))}
          <ellipse cx="170" cy="278" rx="130" ry="9" fill="rgba(0,0,0,.18)"/>
        </svg>
      </section>

      {/* THE WINDOW */}
      <section className="window-sec">
        <div className="window-inner">
          <div className="fade-up">
            <div className="window-kicker">Every night</div>
            <div className="w-row"><span className="w-time">6:00</span><span className="w-text">Homework, dinner, screens, bath, argument.</span></div>
            <div className="w-row"><span className="w-time">7:30</span><span className="w-text">Teeth. Pyjamas. One more glass of water.</span></div>
            <div className="w-row now"><span className="w-time">8:47</span><span className="w-text">Just you. Just them. Just now.</span></div>
          </div>
          <div className="fade-up">
            <p className="window-quote">
              Something shifts when the noise of the day fades. Children stop performing. They ask the questions they've been holding all day. <strong>They say the things they only say in the dark.</strong>
            </p>
            <p className="window-statement">
              There's a window every night, about twenty minutes long.<br /><br />
              <strong>SleepSeed creates the space. It delivers the moment. Then it captures it</strong> — so that at the end of every day, what actually mattered is what you remember.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-sec">
        <div className="how-inner">
          <div className="sec-label fade-up">How it works</div>
          <h2 className="sec-h fade-up">From name to story<br />in three steps.</h2>
          <p className="sec-sub fade-up">No templates. No generic plots. Every story is built around this child, tonight.</p>
          <div className="steps">
            <div className="step fade-up">
              <div className="step-body">
                <div className="step-header"><div className="step-num">1</div><div className="step-title">Build their story</div></div>
                <p className="step-desc">Enter their name, what's happening tonight, and one detail that makes them specifically them. That's it.</p>
                <div className="step-tags"><span className="step-tag">Name + situation</span><span className="step-tag">One weird detail</span><span className="step-tag">5 genres</span></div>
              </div>
              <div className="story-card">
                <div className="sc-genre">💛 Calm</div>
                <div className="sc-title">The Night Before New</div>
                <div className="sc-text">Tonight, <span className="sc-name">Mia</span>'s tummy felt like it was full of tangled string. She opened her notebook to page twelve. <em>Thirty-one dogs, in order of how much they seemed to understand her.</em></div>
              </div>
            </div>
            <div className="step fade-up">
              <div className="step-body">
                <div className="step-header"><div className="step-num">2</div><div className="step-title">Read it together</div></div>
                <p className="step-desc">A warm, book-style format built for reading aloud. Their name wherever it matters. About four minutes at bedtime pace.</p>
                <div className="step-tags"><span className="step-tag">~4 min aloud</span><span className="step-tag">Therapist-informed</span><span className="step-tag">Auto-saved</span></div>
              </div>
              <div style={{padding:'0 28px 28px',display:'flex',flexDirection:'column',gap:9}}>
                <div style={{background:'#F7F1E6',borderRadius:11,padding:'13px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontFamily:'Georgia,serif',fontSize:13.5,color:'#3A2800',fontStyle:'italic'}}>The Night Before New</span>
                  <span style={{fontSize:10,fontFamily:'var(--mono)',color:'#8A6A30'}}>4 min</span>
                </div>
                <div style={{background:'#FAF6ED',borderRadius:9,padding:'11px 16px'}}>
                  <div style={{display:'flex',gap:5,marginBottom:9}}>
                    {[1,2].map(i=><div key={i} style={{width:9,height:9,borderRadius:'50%',background:'#E8A030',opacity:.55}}/>)}
                    {[1,2,3].map(i=><div key={i} style={{width:9,height:9,borderRadius:'50%',background:'rgba(58,40,0,.14)'}}/>)}
                  </div>
                  <span style={{fontSize:10.5,color:'#8A6A30',fontFamily:'var(--mono)'}}>2 min remaining</span>
                </div>
              </div>
            </div>
            <div className="step fade-up">
              <div className="step-body">
                <div className="step-header"><div className="step-num">3</div><div className="step-title">Capture the night</div></div>
                <p className="step-desc">When the story ends, two minutes captures it forever — their words, the best moment of the day, a photo of the room.</p>
                <div className="step-tags"><span className="step-tag">Bonding question</span><span className="step-tag">Gratitude moment</span><span className="step-tag">Night Card</span></div>
              </div>
              <div className="nc-preview">
                <div className="nc-photo-box">
                  <div className="nc-warm"/><div className="nc-ts">Tue 11 Feb · 8:47pm</div>
                  <div className="nc-sil"><div className="nc-sil-p"/><div className="nc-sil-c"/></div>
                </div>
                <div className="nc-name-line" style={{marginTop:9}}>Mia — The Night Before New</div>
                <div style={{marginTop:9,display:'flex',flexDirection:'column',gap:7}}>
                  <div className="nc-resp" style={{background:'rgba(180,120,20,.07)',border:'1px solid rgba(180,120,20,.13)'}}><div className="nc-resp-q" style={{color:'#7A5010'}}>Best three seconds</div><div className="nc-resp-a" style={{color:'#4A3000'}}>When the dog knocked over the laundry basket</div></div>
                  <div className="nc-resp" style={{background:'rgba(80,90,160,.06)',border:'1px solid rgba(80,90,160,.12)'}}><div className="nc-resp-q" style={{color:'#3A4080'}}>What makes you, you?</div><div className="nc-resp-a" style={{color:'#2A3060'}}>I'm really good at remembering things.</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NIGHT CARDS */}
      <section className="nc-sec">
        <div className="nc-inner">
          <div className="nc-left">
            <div className="sec-label fade-up">Night Cards</div>
            <h2 className="sec-h fade-up">The story ends.<br /><em>The memory begins.</em></h2>
            <p className="sec-sub fade-up">Every story creates a Night Card — a permanent keepsake of what your child said, felt, and was on this specific night.</p>
            <div className="nc-features">
              {[
                {n:'1',h:'The Bonding Question',d:"Asked while the story loads — what they actually said, verbatim, captured for the card."},
                {n:'2',h:'The Gratitude Weave',d:'"What was the best three seconds of today?" One question. Fifteen seconds. Saved forever.'},
                {n:'3',h:'The Photo',d:'Everyone in the room at 8:47pm. That image, in ten years, is everything.'},
                {n:'4',h:'Your library grows',d:'After a year, you have 300+ Night Cards. By the time they leave home, there\'s a shelf.'},
              ].map(f => (
                <div key={f.n} className="nc-feat fade-up">
                  <div className="nc-feat-num">{f.n}</div>
                  <div><div className="nc-feat-h">{f.h}</div><div className="nc-feat-d">{f.d}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="nc-right fade-up">
            <div className="nc-pol-large">
              <div className="nc-pol-photo">
                <div className="nc-pol-ts">Tue 11 Feb · 8:47 pm</div>
                <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 110%,rgba(200,120,40,.18),transparent 65%)'}}/>
                <div className="nc-pol-sil" style={{position:'relative',zIndex:1}}>
                  <div className="nc-pol-sil-p"/><div className="nc-pol-sil-c"/>
                </div>
                <div style={{position:'absolute',bottom:44,left:0,right:0,textAlign:'center',fontFamily:'Georgia,serif',fontSize:9.5,fontStyle:'italic',color:'rgba(255,220,130,.6)',zIndex:1}}>The Night Before New</div>
              </div>
              <div className="nc-pol-content">
                <div className="nc-portrait">Mia was here tonight, exactly as herself — <em>the girl who keeps a list of every dog she's ever met, in order of how much they seemed to understand her.</em></div>
                <div className="nc-chips">
                  <div className="nc-chip" style={{background:'rgba(180,120,20,.07)',border:'1px solid rgba(180,120,20,.13)'}}><div className="nc-chipq" style={{color:'#7A5010'}}>What makes you, you?</div><div className="nc-chipa" style={{color:'#4A3000'}}>I'm really good at remembering things.</div></div>
                  <div className="nc-chip" style={{background:'rgba(80,90,160,.06)',border:'1px solid rgba(80,90,160,.12)'}}><div className="nc-chipq" style={{color:'#3A4080'}}>Best three seconds</div><div className="nc-chipa" style={{color:'#2A3060'}}>When the dog knocked over the laundry basket</div></div>
                  <div className="nc-chip" style={{background:'rgba(20,100,60,.06)',border:'1px solid rgba(20,100,60,.12)'}}><div className="nc-chipq" style={{color:'#0A5030'}}>Tonight I want to remember</div><div className="nc-chipa" style={{color:'#083820'}}>She held Grandma's hand the whole way through.</div></div>
                </div>
                <div className="nc-stamp">🌙 SleepSeed · Mia · Age 5 · 11 Feb 2025</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="proof-sec">
        <div className="proof-inner">
          <div className="sec-label fade-up">What families say</div>
          <h2 className="sec-h fade-up">"Daddy, that's <em style={{fontFamily:'var(--serif)',color:'#C85070'}}>MY</em> name."</h2>
          <p className="sec-sub fade-up">The moment every parent describes from the very first story.</p>
          <div className="testimonials">
            <div className="tcard amber fade-up">
              <p className="tcard-quote">"We've done it every single night for four months. My daughter asks for it before I even suggest it. Bedtime went from something I dreaded to the part of the day we both look forward to most."</p>
              <div className="tcard-moment"><div className="tcard-moment-label">Her Night Card</div>"The best three seconds was when you carried me to bed."</div>
              <div className="tcard-meta"><div className="tcard-av">S</div><div><div className="tcard-name">Sarah M.</div><div className="tcard-role">Mum of two · ages 4 &amp; 7</div></div></div>
            </div>
            <div className="tcard teal fade-up">
              <p className="tcard-quote">"My daughter heard her name in the first story and stopped everything. She sat up and said 'that's about me.' She asked to hear it again before I'd even finished."</p>
              <div className="tcard-moment"><div className="tcard-moment-label">Her Night Card</div>"The best three seconds was right now."</div>
              <div className="tcard-meta"><div className="tcard-av" style={{background:'linear-gradient(135deg,#2AB89A,#1A8A70)'}}>M</div><div><div className="tcard-name">Marcus D.</div><div className="tcard-role">Dad of one · age 6</div></div></div>
            </div>
            <div className="tcard rose fade-up">
              <p className="tcard-quote">"As a child therapist I recommended it to a family navigating a new sibling. The mum called two weeks later — the older child was asking for bedtime stories for the first time in months."</p>
              <div className="tcard-moment"><div className="tcard-moment-label">Story used</div>Calm genre · handling a big life transition</div>
              <div className="tcard-meta"><div className="tcard-av" style={{background:'linear-gradient(135deg,#C85070,#9A3050)'}}>L</div><div><div className="tcard-name">Dr. Lisa R.</div><div className="tcard-role">Child &amp; Family Therapist</div></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="price-sec">
        <div className="price-inner">
          <div className="sec-label fade-up">Pricing</div>
          <h2 className="sec-h fade-up">Start free. Stay forever.</h2>
          <p className="sec-sub fade-up">Three stories free, no card needed. Upgrade when you're ready to keep every night.</p>
          <div className="price-cards">
            <div className="pcard fade-up">
              <div className="pcard-tier">Free</div>
              <div className="pcard-price"><sup>$</sup>0</div>
              <div className="pcard-note">3 stories to try</div>
              <button className="pcard-btn outline" onClick={onSignUp}>Start free tonight</button>
              <div className="pcard-features">
                <div className="pcard-feat">3 personalised stories</div>
                <div className="pcard-feat">Night Cards included</div>
                <div className="pcard-feat">5 story genres</div>
              </div>
            </div>
            <div className="pcard featured fade-up">
              <div className="pcard-tier">Family</div>
              <div className="pcard-price"><sup>$</sup>9<sub>.99/mo</sub></div>
              <div className="pcard-note">or $79/year — save 34%</div>
              <button className="pcard-btn solid" onClick={onSignUp}>Get started</button>
              <div className="pcard-features">
                <div className="pcard-feat">Unlimited stories</div>
                <div className="pcard-feat">Unlimited Night Cards</div>
                <div className="pcard-feat">Memories library</div>
                <div className="pcard-feat">Saved characters</div>
                <div className="pcard-feat">Voice narration</div>
                <div className="pcard-feat">Annual Book (coming soon)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-sec">
        <div className="cta-moon" />
        <h2 className="cta-h fade-up">Tonight happened.<br /><em>Keep it.</em></h2>
        <p className="cta-sub fade-up">Your child will say something true tonight. Build their story in 60 seconds and capture the night when it ends.</p>
        <button className="cta-btn-large fade-up" onClick={onSignUp}>Build tonight's story — free</button>
        <div className="cta-note">Then <strong>$9.99/month</strong> or <strong>$79/year</strong>. Cancel any time.</div>
        <div className="cta-trust2">
          <span>✓ 3 stories free</span>
          <span>✓ No card needed</span>
          <span>✓ Night Cards included</span>
          <span>✓ No ads, ever</span>
          <span>✓ Photos stay on your device</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="hp-footer">
        <div className="hp-footer-logo"><div className="hp-logo-moon" style={{width:17,height:17}}/>SleepSeed</div>
        <div className="hp-footer-links">
          <button className="hp-footer-link">Privacy</button>
          <button className="hp-footer-link">Terms</button>
          <button className="hp-footer-link">hello@sleepseed.app</button>
        </div>
        <div className="hp-footer-copy">© 2025 SleepSeed. All rights reserved.</div>
      </footer>
    </div>
  );
}
