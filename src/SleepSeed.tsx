import { useState, useRef, useCallback, useEffect } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400;1,9..144,600&family=Nunito:wght@400;600;700&family=Kalam:wght@400;700&display=swap');`;

const CSS = `
${FONTS}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#060b18;--gold:#d4a030;--gold2:#f0cc60;--gold3:#fae9a8;
  --cream:#fdf5e0;--parch:#f5e8c0;--ink:#261600;--ink2:#5a380a;--ink3:#8a5a1a;
  --ui:#c4d0f0;--dim:#6070a0;--dimmer:#3a4878;--green2:#4cc890;
}
body{background:var(--night);font-family:'Nunito',sans-serif;color:var(--cream);min-height:100vh;overflow-x:hidden}
.stars{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.star{position:absolute;border-radius:50%;background:#fff;animation:twinkle var(--d) ease-in-out infinite var(--dl)}
@keyframes twinkle{0%,100%{opacity:var(--lo)}50%{opacity:var(--hi);transform:scale(1.4)}}
.moon{position:fixed;top:40px;right:56px;z-index:1;width:68px;height:68px;border-radius:50%;
  background:radial-gradient(circle at 34% 32%,#fdf0c0,#e2c050,#b07818);
  box-shadow:0 0 40px 12px rgba(210,170,50,.2);animation:mfloat 9s ease-in-out infinite}
@keyframes mfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.app{position:relative;z-index:2;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px}
.screen{width:100%;max-width:540px;animation:fup .5s cubic-bezier(.16,1,.3,1) both}
@keyframes fup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.card{background:linear-gradient(150deg,rgba(22,32,84,.72),rgba(11,18,42,.88));
  border:1px solid rgba(212,160,48,.15);border-radius:22px;padding:26px;
  backdrop-filter:blur(20px);box-shadow:0 20px 64px rgba(0,0,0,.55)}
.btn{width:100%;padding:15px;border:none;border-radius:14px;cursor:pointer;
  background:linear-gradient(135deg,#a87818,#d4a030,#b88820);color:#180e00;
  font-family:'Fraunces',serif;font-size:18px;font-weight:700;
  box-shadow:0 4px 22px rgba(170,130,30,.35);transition:all .2s}
.btn:hover:not(:disabled){transform:translateY(-2px)}
.btn:disabled{opacity:.35;cursor:not-allowed}
.btn-ghost{background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.14);color:var(--dim);
  padding:9px 16px;border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s}
.btn-ghost:hover{border-color:rgba(255,255,255,.28);color:var(--cream)}
.btn-danger{background:rgba(192,64,48,.12);border:1px solid rgba(192,64,48,.28);color:#f09080;
  padding:5px 10px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer}
.finput,.fselect{width:100%;padding:12px 16px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);
  border-radius:12px;color:var(--cream);font-family:'Nunito',sans-serif;font-size:14px;outline:none;transition:all .2s;-webkit-appearance:none}
.finput:focus,.fselect:focus{border-color:rgba(212,160,48,.55);background:rgba(212,160,48,.05)}
.finput::placeholder{color:rgba(90,110,170,.4)}
.fselect option,.fselect optgroup{background:#19286a}
.ftarea{width:100%;padding:11px 14px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);
  border-radius:12px;color:var(--cream);font-family:'Nunito',sans-serif;font-size:13px;outline:none;
  transition:all .2s;resize:vertical;min-height:76px;line-height:1.6}
.ftarea::placeholder{color:rgba(90,110,170,.38)}
.ftarea:focus{border-color:rgba(212,160,48,.55)}
.hero-input{font-size:22px;font-family:'Fraunces',serif;font-weight:600;padding:16px 20px;text-align:center;border-radius:16px}
.hero-input::placeholder{font-size:18px;font-style:italic}
.section-label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-bottom:8px}
.divider{height:1px;background:rgba(255,255,255,.07);border-radius:99px}
.gender-row{display:flex;gap:8px;justify-content:center;margin-bottom:18px}
.gender-pill{padding:8px 20px;border-radius:99px;font-size:13px;font-weight:700;cursor:pointer;
  border:1.5px solid rgba(255,255,255,.13);color:var(--dim);background:transparent;font-family:'Nunito',sans-serif;transition:all .2s}
.gender-pill.sel-any{background:rgba(212,160,48,.12);border-color:var(--gold2);color:var(--gold2)}
.gender-pill.sel-girl{background:rgba(220,100,160,.15);border-color:rgba(220,100,160,.55);color:#f4b8d4}
.gender-pill.sel-boy{background:rgba(80,140,220,.15);border-color:rgba(80,140,220,.55);color:#b8d0f8}
.theme-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}
.theme-btn{padding:12px 6px;border-radius:14px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;
  border:2px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);transition:all .2s;font-family:'Nunito',sans-serif}
.theme-btn:hover{background:rgba(255,255,255,.09)}
.theme-btn.sel{background:rgba(212,160,48,.14);border-color:var(--gold2)}
.theme-emoji{font-size:26px;line-height:1}
.theme-label{font-size:9px;font-weight:700;color:var(--dim);text-align:center;line-height:1.3}
.theme-btn.sel .theme-label{color:var(--gold2)}
.cust-toggle{
  display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;
  padding:14px 18px;border-radius:16px;user-select:none;position:relative;
  background:linear-gradient(135deg,rgba(120,60,220,.18),rgba(180,80,200,.14),rgba(212,160,48,.12));
  border:1.5px solid transparent;
  background-clip:padding-box;
  box-shadow:0 0 0 1.5px rgba(160,80,240,.35),0 4px 24px rgba(120,40,200,.18);
  transition:all .25s}
.cust-toggle::before{content:'';position:absolute;inset:-1.5px;border-radius:17px;z-index:-1;
  background:linear-gradient(135deg,rgba(160,80,255,.7),rgba(220,100,220,.5),rgba(212,160,48,.6));
  animation:magicBorder 3s ease-in-out infinite}
@keyframes magicBorder{
  0%,100%{opacity:.6;background:linear-gradient(135deg,rgba(160,80,255,.7),rgba(212,160,48,.5))}
  50%{opacity:1;background:linear-gradient(135deg,rgba(212,160,48,.8),rgba(160,80,255,.7))}}
.cust-toggle:hover{
  background:linear-gradient(135deg,rgba(140,70,240,.24),rgba(200,90,210,.2),rgba(212,160,48,.16));
  box-shadow:0 0 0 1.5px rgba(180,100,255,.55),0 6px 32px rgba(140,50,220,.28);
  transform:translateY(-1px)}
.cust-toggle.open{
  background:linear-gradient(135deg,rgba(140,70,240,.28),rgba(180,80,200,.22),rgba(212,160,48,.18));
  box-shadow:0 0 0 1.5px rgba(212,160,48,.6),0 4px 28px rgba(180,100,60,.2)}
.cust-toggle.open::before{
  animation:magicBorderOpen 3s ease-in-out infinite}
@keyframes magicBorderOpen{
  0%,100%{background:linear-gradient(135deg,rgba(212,160,48,.8),rgba(240,200,80,.6))}
  50%{background:linear-gradient(135deg,rgba(240,180,60,.9),rgba(160,80,255,.5))}}
.cust-label{font-size:14px;font-weight:800;letter-spacing:.01em;
  background:linear-gradient(90deg,#e8b8ff,#f0cc60,#c8a8ff);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.cust-chevron{font-size:13px;color:rgba(212,160,48,.8);transition:transform .28s;flex-shrink:0}
.cust-toggle.open .cust-chevron{transform:rotate(180deg)}
.cust-body{display:flex;flex-direction:column;gap:14px;padding:16px;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;margin-bottom:14px}
.pill-row{display:flex;gap:6px;flex-wrap:wrap}
.pill{padding:6px 13px;border-radius:99px;font-size:12px;font-weight:700;cursor:pointer;
  border:1.5px solid rgba(255,255,255,.12);color:var(--dim);background:transparent;font-family:'Nunito',sans-serif;transition:all .2s}
.pill:hover{border-color:rgba(255,255,255,.25);color:var(--cream)}
.pill.on{background:rgba(212,160,48,.14);border-color:var(--gold2);color:var(--gold2)}
.tog-row{display:flex;align-items:center;justify-content:space-between}
.tog-label{font-size:13px;font-weight:700;color:var(--cream)}
.tog-sub{font-size:11px;color:var(--dim);margin-top:2px}
.tog{position:relative;width:44px;height:24px;flex-shrink:0;cursor:pointer}
.tog input{opacity:0;width:0;height:0;position:absolute}
.tog-track{position:absolute;inset:0;background:rgba(255,255,255,.12);border-radius:99px;transition:background .25s}
.tog input:checked + .tog-track{background:var(--gold)}
.tog-thumb{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:white;
  box-shadow:0 1px 4px rgba(0,0,0,.3);transition:transform .25s;pointer-events:none}
.tog input:checked ~ .tog-thumb{transform:translateX(20px)}
.char-list{display:flex;flex-direction:column;gap:8px}
.char-card{background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.09);border-radius:13px;overflow:hidden}
.char-top{display:flex;align-items:center;gap:8px;padding:9px 10px}
.char-photo{width:38px;height:38px;border-radius:8px;overflow:hidden;background:rgba(255,255,255,.08);
  cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;position:relative}
.char-photo img{width:100%;height:100%;object-fit:cover}
.char-photo:hover{background:rgba(212,160,48,.1)}
.char-name-in{flex:1;padding:8px 11px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
  border-radius:9px;color:var(--cream);font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;outline:none}
.char-name-in::placeholder{color:rgba(90,110,170,.4);font-weight:400}
.char-name-in:focus{border-color:rgba(212,160,48,.45)}
.char-type-sel{padding:7px 8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
  border-radius:9px;color:var(--cream);font-family:'Nunito',sans-serif;font-size:11px;outline:none;-webkit-appearance:none;cursor:pointer}
.char-type-sel option{background:#19286a}
.char-details{display:flex;align-items:center;gap:6px;padding:7px 10px 9px;border-top:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02)}
.char-cls-sel{flex:1;padding:6px 9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);
  border-radius:8px;color:var(--cream);font-family:'Nunito',sans-serif;font-size:11px;outline:none;-webkit-appearance:none}
.char-cls-sel option,.char-cls-sel optgroup{background:#19286a}
.mini-gpills{display:flex;gap:4px}
.mgp{padding:4px 9px;border-radius:99px;font-size:10px;font-weight:700;cursor:pointer;
  border:1px solid rgba(255,255,255,.1);color:var(--dimmer);background:transparent;font-family:'Nunito',sans-serif;transition:all .15s}
.mgp:hover{color:var(--cream)}
.mgp.on{border-color:rgba(212,160,48,.5);color:var(--gold2);background:rgba(212,160,48,.1)}
.btn-add-char{padding:9px;border-radius:10px;border:1.5px dashed rgba(76,200,144,.35);
  background:rgba(76,200,144,.06);color:#80d8a8;font-size:13px;font-weight:700;cursor:pointer;
  width:100%;text-align:center;transition:all .2s;font-family:'Nunito',sans-serif}
.btn-add-char:hover{background:rgba(76,200,144,.13)}
.occ-pills{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:4px}
.occ-pill{padding:8px 13px;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;
  border:1.5px solid rgba(255,255,255,.11);color:var(--dim);background:rgba(255,255,255,.04);
  font-family:'Nunito',sans-serif;transition:all .18s;display:flex;align-items:center;gap:5px;line-height:1.2}
.occ-pill:hover{border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.08)}
.occ-pill.on{background:rgba(240,180,50,.13);border-color:var(--gold2);color:var(--gold2)}
.les-pills{display:flex;gap:7px;flex-wrap:wrap}
.les-pill{padding:8px 13px;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;
  border:1.5px solid rgba(255,255,255,.11);color:var(--dim);background:rgba(255,255,255,.04);
  font-family:'Nunito',sans-serif;transition:all .18s}
.les-pill:hover{border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.08)}
.les-pill.on{background:rgba(76,200,144,.12);border-color:rgba(76,200,144,.5);color:#80d8a8}
.char-simple-list{display:flex;flex-direction:column;gap:7px}
.char-simple-row{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.05);
  border:1.5px solid rgba(255,255,255,.09);border-radius:12px;padding:8px 10px}
.char-type-strip{display:flex;gap:6px;flex-wrap:wrap}
.guidance-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.guidance-chip{padding:5px 11px;border-radius:99px;font-size:11px;font-weight:700;cursor:pointer;
  border:1.5px solid rgba(255,255,255,.1);color:var(--dim);background:transparent;
  font-family:'Nunito',sans-serif;transition:all .18s}
.guidance-chip:hover{border-color:rgba(212,160,48,.4);color:var(--gold2);background:rgba(212,160,48,.06)}
.magic-hint{display:flex;align-items:center;gap:5px;font-size:11px;color:rgba(200,160,255,.7);margin-top:3px}
.magic-hint-badge{background:rgba(160,80,255,.1);border:1px solid rgba(160,80,255,.25);
  border-radius:7px;padding:2px 8px;font-size:10px;font-weight:700;color:rgba(210,170,255,.85)}
.quick-go{background:rgba(212,160,48,.07);border:1.5px dashed rgba(212,160,48,.25);
  border-radius:14px;padding:12px;text-align:center;margin-bottom:10px}
.quick-go-label{font-size:11px;color:var(--dim);margin-bottom:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.age-pills{display:flex;gap:7px;flex-wrap:wrap}
.age-pill{padding:9px 13px;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;
  border:1.5px solid rgba(255,255,255,.11);color:var(--dim);background:rgba(255,255,255,.04);
  font-family:'Nunito',sans-serif;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:64px;text-align:center}
.age-pill:hover{border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.08)}
.age-pill.on{background:rgba(100,160,255,.13);border-color:rgba(100,160,255,.5);color:#a8c8ff}
.age-pill-grade{font-size:9px;font-weight:700;opacity:.6;text-transform:uppercase;letter-spacing:.05em}
.char-add-pill{display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:12px;cursor:pointer;
  border:1.5px solid rgba(255,255,255,.11);color:var(--dim);background:rgba(255,255,255,.04);
  font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;transition:all .18s}
.char-add-pill:hover{border-color:rgba(76,200,144,.4);background:rgba(76,200,144,.07);color:#80d8a8}
.char-add-pill-icon{font-size:20px;line-height:1}
.gen-wrap{text-align:center;padding:32px 24px}
.gen-orb{width:76px;height:76px;border-radius:50%;margin:0 auto 18px;
  background:radial-gradient(circle at 35% 35%,#3a5ccc,#1a2870);
  box-shadow:0 0 40px 12px rgba(60,100,220,.3);animation:orbPulse 2s ease-in-out infinite}
@keyframes orbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.gen-title{font-family:'Fraunces',serif;font-size:21px;font-weight:700;color:var(--cream);margin-bottom:7px}
.gen-sub{font-size:13px;color:var(--dim);line-height:1.7;margin-bottom:20px}
.pbar{height:6px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;margin-bottom:5px}
.pfill{height:100%;background:linear-gradient(90deg,var(--gold),var(--gold2));border-radius:99px;transition:width .6s ease}
.plabel{font-size:11px;color:var(--dim);font-weight:700;text-align:right;margin-bottom:14px}
.pstep{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--dimmer);padding:3px 0;transition:color .3s}
.pstep.active{color:var(--gold2);font-weight:700}
.pstep.done{color:var(--green2)}
.pstep-dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex-shrink:0}
.img-dot{width:26px;height:26px;border-radius:7px;border:1.5px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;font-size:11px;transition:all .4s}
.img-dot.busy{border-color:rgba(212,160,48,.4);animation:dotPulse .8s ease-in-out infinite}
.img-dot.done{border-color:rgba(76,200,144,.6);background:rgba(76,200,144,.12)}
@keyframes dotPulse{0%,100%{opacity:.5}50%{opacity:1}}
.err-box{background:rgba(192,64,48,.14);border:1px solid rgba(192,64,48,.28);border-radius:10px;padding:10px 14px;font-size:13px;color:#f09080;margin-bottom:14px}
.book-shell{width:100%;max-width:500px;animation:fup .4s cubic-bezier(.16,1,.3,1) both}
.book-3d{border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.7);
  height:480px;position:relative;background:#0e1428;cursor:pointer}
.bpage{position:absolute;inset:0;width:100%;height:100%;animation:pageFade .3s ease both}
@keyframes pageFade{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
.pinset{position:absolute;inset:10px;border:1px solid rgba(212,160,48,.1);border-radius:8px;pointer-events:none;z-index:2}
.cover-bg{background:linear-gradient(160deg,#0a0f28,#14204a,#0e1830)}
.cover-lay{height:100%;display:flex;flex-direction:column}
.cover-art{flex:1;position:relative;overflow:hidden}
.cover-bot{padding:14px 20px 18px;background:linear-gradient(0deg,rgba(8,12,28,.98),rgba(8,12,28,.6));position:relative;z-index:3}
.c-stars{font-size:10px;color:rgba(212,160,48,.45);letter-spacing:8px;text-align:center;margin-bottom:5px}
.c-title{font-family:'Fraunces',serif;font-size:clamp(15px,4vw,22px);font-weight:700;font-style:italic;
  color:var(--gold3);text-align:center;line-height:1.25;margin-bottom:4px}
.c-for{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);text-align:center;margin-bottom:6px}
.c-brand{font-family:'Fraunces',serif;font-size:12px;color:rgba(212,160,48,.5);text-align:center}
.cast-bg{background:linear-gradient(160deg,#fef8e8,#f5e8c0);color:var(--ink)}
.cast-lay{height:100%;display:flex;flex-direction:column;padding:22px 20px}
.cast-title{font-family:'Fraunces',serif;font-size:18px;font-weight:700;font-style:italic;color:var(--ink2);margin-bottom:2px}
.cast-sub{font-family:'Kalam',cursive;font-size:12px;color:var(--ink3);margin-bottom:14px}
.cast-grid{display:flex;flex-wrap:wrap;gap:12px;flex:1;align-content:flex-start}
.cast-char{display:flex;flex-direction:column;align-items:center;gap:4px}
.cast-av{width:52px;height:52px;border-radius:12px;overflow:hidden;background:var(--parch);
  border:2px solid rgba(90,56,10,.15);display:flex;align-items:center;justify-content:center;font-size:24px}
.cast-av img{width:100%;height:100%;object-fit:cover}
.cast-name{font-family:'Fraunces',serif;font-size:12px;font-weight:600;color:var(--ink2);text-align:center;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cast-role{font-size:9px;color:var(--ink3);font-weight:700;text-transform:uppercase;text-align:center;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.story-bg{background:linear-gradient(160deg,#fef8e8,#f5e4b8)}
.story-lay{height:100%;display:flex;flex-direction:column}
.story-illo{flex:0 0 42%;position:relative;overflow:hidden;background:linear-gradient(160deg,#e8ddb0,#d4c890)}
.story-txt-col{flex:1;min-height:0;padding:14px 18px 10px;display:flex;flex-direction:column;
  background:linear-gradient(160deg,#fef8e8,#f5e8c0);overflow-y:auto}
.story-txt-col::-webkit-scrollbar{width:3px}
.story-txt-col::-webkit-scrollbar-thumb{background:rgba(90,56,10,.15);border-radius:99px}
.s-pgnum{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3);margin-bottom:7px;flex-shrink:0}
.s-text{font-family:'Fraunces',serif;font-size:clamp(13px,2.7vw,15.5px);color:var(--ink);line-height:1.9;font-style:italic;flex:1}
.s-foot{display:flex;align-items:center;justify-content:space-between;margin-top:8px;flex-shrink:0}
.orn{font-size:9px;color:rgba(90,56,10,.28);letter-spacing:4px}
.orn-num{font-family:'Kalam',cursive;font-size:15px;color:rgba(90,56,10,.22)}
.s-refrain{font-family:'Kalam',cursive;font-size:10px;color:rgba(90,56,10,.38);text-align:center;
  font-style:italic;letter-spacing:.04em;padding:5px 8px;margin-top:4px;
  border-top:1px solid rgba(90,56,10,.08);line-height:1.5;flex-shrink:0}
.choice-bg{background:linear-gradient(160deg,#0a1030,#14204a)}
.choice-lay{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 18px;gap:14px}
.choice-star{font-size:28px;animation:orbPulse 3s ease-in-out infinite}
.choice-q{font-family:'Fraunces',serif;font-size:clamp(14px,3.2vw,17px);font-weight:700;font-style:italic;color:var(--gold3);text-align:center;line-height:1.4}
.choice-opts{display:flex;flex-direction:column;gap:10px;width:100%}
.choice-btn{padding:13px 16px;border-radius:12px;cursor:pointer;text-align:left;
  font-family:'Fraunces',serif;font-size:clamp(12px,2.6vw,14px);font-style:italic;line-height:1.4;border:2px solid;transition:all .2s}
.choice-btn.a{background:rgba(60,100,220,.14);border-color:rgba(60,100,220,.44);color:#c0d4ff}
.choice-btn.b{background:rgba(180,80,180,.11);border-color:rgba(180,80,180,.38);color:#e8c0f8}
.choice-btn.a:hover{background:rgba(60,100,220,.26)}
.choice-btn.b:hover{background:rgba(180,80,180,.22)}
.choice-tag{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;display:block;margin-bottom:3px;opacity:.65}
.choice-hint{font-size:10px;color:var(--dimmer);text-align:center}
.end-bg{background:linear-gradient(160deg,#060b18,#0b1428)}
.end-lay{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:28px}
.end-moon{font-size:48px;animation:mfloat 6s ease-in-out infinite}
.end-title{font-family:'Fraunces',serif;font-size:30px;font-weight:700;font-style:italic;color:var(--gold3)}
.end-msg{font-family:'Kalam',cursive;font-size:14px;color:var(--ui);text-align:center;line-height:1.9}
.illo-slot{position:absolute;inset:0}
.shimmer{position:absolute;inset:0;background:linear-gradient(110deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.09) 50%,rgba(255,255,255,.04) 75%);
  background-size:200% 100%;animation:shimmerMove 1.6s ease-in-out infinite}
@keyframes shimmerMove{0%{background-position:200% 0}100%{background-position:-200% 0}}
.illo-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .7s}
.illo-fb{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(10,15,40,.5)}
.illo-fb-e{font-size:24px;animation:orbPulse 2s ease-in-out infinite}
.illo-fb-t{font-size:10px;font-weight:700;color:var(--dim)}
.spark-ring{position:absolute;pointer-events:none;z-index:20;transform:translate(-50%,-50%)}
.spark{position:absolute;width:10px;height:10px;border-radius:50%;animation:sparkOut .65s ease-out both}
@keyframes sparkOut{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(0)}}
.book-nav{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
.nav-btn{background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.12);color:var(--cream);
  padding:8px 18px;border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s}
.nav-btn:hover:not(:disabled){background:rgba(255,255,255,.13)}
.nav-btn:disabled{opacity:.28;cursor:not-allowed}
.dots{display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:180px}
.dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.18);cursor:pointer;transition:all .2s;flex-shrink:0}
.dot.on{background:var(--gold2);transform:scale(1.35)}
.auto-bar{height:3px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden;margin-top:6px;transition:opacity .3s}
.auto-fill{height:100%;background:var(--gold2);border-radius:99px;transition:width .12s linear}
.ctrl-bar{display:flex;gap:8px;justify-content:center;margin-top:8px;flex-wrap:wrap}
.ctrl-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;cursor:pointer;
  font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;transition:all .2s;border:1.5px solid}
.ctrl-btn.read{background:rgba(212,160,48,.1);border-color:rgba(212,160,48,.28);color:var(--gold2)}
.ctrl-btn.read.active{background:rgba(212,160,48,.24);border-color:var(--gold2)}
.ctrl-btn.auto{background:rgba(76,200,144,.07);border-color:rgba(76,200,144,.26);color:var(--green2)}
.ctrl-btn.auto.active{background:rgba(76,200,144,.2);border-color:var(--green2)}
.ctrl-btn.save{background:rgba(100,130,220,.07);border-color:rgba(100,130,220,.24);color:var(--ui)}
.ctrl-btn.fresh{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.11);color:var(--dim)}
.ctrl-btn:hover{opacity:.85}
.snd-bar{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;flex-wrap:wrap}
.snd-tog{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;cursor:pointer;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);font-family:'Nunito',sans-serif;
  font-size:11px;font-weight:700;color:var(--dim);transition:all .18s;user-select:none}
.snd-tog:hover{background:rgba(255,255,255,.09);color:var(--cream)}
.snd-tog.on{background:rgba(100,180,255,.1);border-color:rgba(100,180,255,.3);color:#a8d8ff}
.snd-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0}
.snd-gear{font-size:12px;cursor:pointer;color:var(--dim);padding:4px 7px;border-radius:7px;
  border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);transition:all .18s}
.snd-gear:hover{color:var(--cream);background:rgba(255,255,255,.07)}
.vc-badge{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:7px;font-size:11px;
  font-weight:700;cursor:pointer;border:1.5px solid rgba(240,100,120,.4);
  background:rgba(240,100,120,.1);color:#f8a0b0;font-family:'Nunito',sans-serif;transition:all .18s}
.vc-badge:hover{background:rgba(240,100,120,.2)}
.vc-badge.active{border-color:rgba(240,100,120,.7);background:rgba(240,100,120,.18);animation:vcPulse 2s ease-in-out infinite}
@keyframes vcPulse{0%,100%{box-shadow:0 0 0 0 rgba(240,100,120,.0)}50%{box-shadow:0 0 8px 2px rgba(240,100,120,.25)}}
.vc-modal{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;
  background:rgba(4,9,24,.88);padding:16px}
.vc-card{background:linear-gradient(150deg,rgba(22,32,84,.96),rgba(11,18,42,.98));
  border:1.5px solid rgba(240,100,120,.3);border-radius:22px;padding:24px;width:100%;max-width:420px;
  box-shadow:0 24px 80px rgba(0,0,0,.7)}
.vc-title{font-family:'Fraunces',serif;font-size:20px;font-weight:700;color:var(--cream);margin-bottom:4px}
.vc-sub{font-size:12px;color:var(--dim);margin-bottom:18px;line-height:1.6}
.vc-script{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;
  padding:14px 16px;font-family:'Kalam',cursive;font-size:14px;color:var(--cream);
  line-height:1.9;margin-bottom:18px}
.vc-script-label{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:var(--dim);margin-bottom:8px}
.vc-record-btn{width:72px;height:72px;border-radius:50%;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 14px;
  background:linear-gradient(135deg,#c0203a,#e04060);
  box-shadow:0 4px 24px rgba(200,40,60,.45);transition:all .2s}
.vc-record-btn:hover{transform:scale(1.06)}
.vc-record-btn.recording{animation:vcRecPulse 1s ease-in-out infinite;background:linear-gradient(135deg,#e03050,#ff6080)}
@keyframes vcRecPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,50,80,.5)}50%{box-shadow:0 0 0 16px rgba(220,50,80,.0)}}
.vc-status{text-align:center;font-size:13px;font-weight:700;color:var(--dim);margin-bottom:14px;min-height:20px}
.vc-timer{font-family:'Kalam',cursive;font-size:22px;color:#f8a0b0;text-align:center;margin-bottom:6px}
.vc-progress{height:4px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;margin-bottom:16px}
.vc-progress-fill{height:100%;background:linear-gradient(90deg,#c0203a,#f8a0b0);border-radius:99px;transition:width .3s}
.vc-actions{display:flex;gap:8px}
.mem-list{display:flex;flex-direction:column;gap:9px;margin-bottom:14px;max-height:380px;overflow-y:auto}
.mem-card{background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.08);border-radius:12px;
  padding:13px 15px;display:flex;align-items:center;gap:11px;cursor:pointer;transition:all .2s}
.mem-card:hover{border-color:rgba(212,160,48,.25);background:rgba(255,255,255,.07)}
.mem-info{flex:1;min-width:0}
.mem-title{font-family:'Fraunces',serif;font-size:13px;font-weight:700;color:var(--cream);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
.mem-meta{font-size:11px;color:var(--dim)}
.brand-row{display:flex;align-items:center;gap:9px;margin-bottom:6px}
.brand-gem{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#1a2870,#2840b0);
  border:1.5px solid rgba(212,160,48,.4);display:flex;align-items:center;justify-content:center;font-size:18px}
.brand-name{font-family:'Fraunces',serif;font-size:22px;font-weight:700;
  background:linear-gradient(135deg,var(--gold3),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.brand-tag{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--dimmer)}
`;

/* ── Data ── */
const THEMES = [
  {label:"Enchanted Forest",emoji:"🌲",value:`WORLD: An enchanted forest where the trees talk in big, rumbling, friendly voices and every animal knows your name. The mushrooms glow like little orange nightlights. Fireflies zigzag like tiny flying torches. The biggest tree — so wide you couldn't hug it — only wakes up when a child knocks three times and asks a really good question. The moss is soft as carpet, and a stream goes "tinkle tinkle tinkle" through the dark.

STORY HOOKS — use one or blend several:
• The biggest tree only answers THREE questions. What if the hero has already used two? What does the third question turn out to be?
• The fireflies are writing a message in the dark. What does it say? Who is it for?
• Every animal in the forest knows the hero's name — except one. Why? That mystery drives the whole story.
• Something in the forest is lost and needs to get home. The hero is the only one who can help.
• A Rule of Three: the hero asks three animals for help. Two get it hilariously wrong. The third gets it exactly right — in the most unexpected way.`},

  {label:"Cloud Kingdom",emoji:"☁️",value:`WORLD: A kingdom made of clouds you can actually walk on — squashy and cool, like the world's softest pillow. The castles make a gentle "BOING!" when you bump into a wall. Rain falls upward here, in silver droplets that tickle your nose. Friendly cloud-creatures with floppy ears leave pawprints in the frost. At bedtime the sky turns pink and gold, and a small bell rings that can be heard all the way down on Earth.

STORY HOOKS — use one or blend several:
• The bell only rings when everyone in the Cloud Kingdom is safe and happy. Tonight it isn't ringing. Why?
• One of the cloud-creatures has lost something important — it's fallen all the way down to Earth. Someone needs to go and fetch it.
• The upward rain is going the wrong way tonight — it's falling DOWN. The whole kingdom is very confused. Only the hero knows how to fix it.
• A new cloud-creature has just arrived and doesn't know ANY of the rules. The hero must teach them three things. Guess which three things turn out to matter most.
• The cloud castle has a door that nobody has ever opened. Tonight it opens by itself.`},

  {label:"Ocean World",emoji:"🌊",value:`WORLD: A warm, sparkling world under the waves where water glows green and gold. The coral palaces are pink and orange and purple, with fish in party colours zipping in and out of every window. Sea-turtles carry books on their shells and will read to you if you ask nicely. The seafloor lights up at night — hundreds of tiny creatures going blink, blink, blink, like a city full of fairy lights.

STORY HOOKS — use one or blend several:
• The blink-blink-blink lights are going out one by one. The hero must find out why before the whole seafloor goes dark.
• A sea-turtle has lost the most important page of the most important book. It fluttered away in the current. The whole ocean is looking for it.
• There is a shipwreck nobody is allowed to go near. Everybody says it's dangerous. The hero goes anyway — and finds something wonderful inside.
• Three sea creatures each claim they found the same magical shell. The hero must figure out who it really belongs to.
• The biggest fish in the ocean is scared of something tiny. The hero is the only one brave enough to ask what.`},

  {label:"Magic Bakery",emoji:"🍰",value:`WORLD: A bakery at the end of a lane where everything smells wonderful — warm cinnamon, melted chocolate, fresh bread. The gingerbread biscuits hop off the tray and scuttle about. The bread loaves breathe in and out while they sleep. Cakes grant one wish each, but ONLY if you ask very politely. The baker is a very old cat in a floury apron who has been making cakes since before anyone can remember.

STORY HOOKS — use one or blend several:
• A cake has granted the wrong wish — it misheard completely. Now something very strange is happening and it must be fixed before midnight.
• The gingerbread biscuits have gone on strike. They refuse to be eaten. The hero must negotiate with them.
• Someone used their one wish on something silly. They want it back. But the bakery's rules are very clear: one wish only. Or ARE they?
• A mysterious customer comes in and orders something that isn't on the menu. The cat baker says it's impossible. The hero isn't sure.
• Three different magical cakes, each with a different power. The hero can only choose one. This is a very difficult decision.`},

  {label:"Dragon Mountain",emoji:"🐉",value:`WORLD: A tall warm mountain full of friendly dragons who love visitors and are excellent at toasting marshmallows. Inside each cave it's cosy and orange-glowing. Dragon snoring sounds exactly like a very happy thunderstorm. The dragons collect kind things — a giggle caught in a jar, a drawing someone made for them, a song they've been humming for fifty years. The oldest dragon has silver scales and knows every child's name.

STORY HOOKS — use one or blend several:
• The oldest dragon has lost her voice — and with it, she's forgotten every child's name. The hero must help her remember.
• One dragon's special treasure — a giggle caught in a jar — has escaped. It's been spreading mischief all over the mountain. Someone has to catch it.
• A small dragon is too scared to breathe fire for the first time. Everyone is watching. The hero knows exactly how that feels.
• The mountain has a cave that every dragon says leads nowhere. The hero knows it leads SOMEWHERE. They're right.
• Three dragons give three different answers to the same question. Only one is telling the truth. The hero figures out which one — and why the other two were wrong in such funny ways.`},

  {label:"Fairy Garden",emoji:"🌸",value:`WORLD: A garden that saves its best magic for night-time. The flowers open wide and breathe out the most beautiful smell — sweet, warm, and a little fizzy on your tongue. The fairies are no bigger than a thumb, their wings making a sound like the highest note on a piano. They hang lanterns on spiderwebs and use fireflies as fairy lights for their festivals. Every tiny fairy footprint glows on the path.

STORY HOOKS — use one or blend several:
• The festival lanterns have all gone out and the fairy queen's grand party is about to begin. Three fairies try to fix it. Each attempt makes things funnier. The hero finds the real solution.
• A fairy has accidentally made something grow SO enormously, ridiculously big that it's blocking the whole garden path. It keeps growing. Every page it's bigger.
• The tiniest fairy in the whole garden can do the biggest magic — but she doesn't know it yet. The hero sees it before she does.
• Someone has been leaving mysterious footprints in the garden. They're far too big to be a fairy. Everyone is very worried. The truth is much sillier than anyone expected.
• The fairies have lost their most important song — nobody can remember how it goes. The hero hears a few notes coming from somewhere unexpected.`},

  {label:"Toy Town",emoji:"🪆",value:`WORLD: A little town that wakes the moment the last bedroom light goes off. Toy soldiers march in wobbly lines. Stuffed animals swap stories. Clockwork birds sing one cheerful note over and over. Everything smells of warm wood, old cloth, and something that feels like being small and safe and loved. Every toy here remembers the child who first held them, and thinks about them every night.

STORY HOOKS — use one or blend several:
• One toy has never been played with. Not even once. The whole town knows it, but nobody talks about it. Tonight that changes.
• The clockwork birds have all learned the wrong tune and now they can't stop playing it. EVERYWHERE. The whole town is going slightly mad.
• A toy soldier is convinced there's a monster living under the big toy box. Three times they set a trap. Three times something goes wrong in a new and funnier way.
• Something has gone missing from the toy town square. Everyone has a different theory. They're all wrong. The hero finds it somewhere obvious that everyone was too busy arguing to check.
• The toys have decided to put on a play. It's a disaster in the best possible way. The hero ends up being the star, completely by accident.`},

  {label:"The Moon",emoji:"🌙",value:`WORLD: The moon up close is warm and softly glowing, covered in meadows of white flowers that sway with no wind. Astronaut rabbits in round spacesuits hop about tending craters and planting starseeds. Everything is bouncier — one jump floats you up, up, up before you drift gently down. From the moon you can see the whole Earth, round and blue, hanging like a giant night-light. One small warm window — that's home, waiting.

STORY HOOKS — use one or blend several:
• The moon is slightly less bright tonight. The astronaut rabbits are very worried. Three of them have three different theories about why. Only one is right — and it leads to an adventure nobody expected.
• A starseed has been planted in the wrong spot. Now something extraordinary is growing and nobody knows what it will be.
• One of the astronaut rabbits floated too high on a big jump and can't get back down. The hero must figure out how to help — without floating away themselves.
• The hero can see their house from the moon. They can see a light is still on. They know exactly who left it on — and they know why. That knowledge becomes the heart of the story.
• Something small and lost has drifted all the way up from Earth and landed on the moon. It belongs to someone. The hero knows who. Getting it home is the whole adventure.`},
];
const CHAR_TYPES = [
  {value:"friend",label:"Friend",icon:"👫"},
  {value:"sibling",label:"Sibling",icon:"👶"},
  {value:"parent",label:"Parent",icon:"🧑‍🍼"},
  {value:"pet",label:"Pet",icon:"🐾"},
  {value:"toy",label:"Toy",icon:"🧸"},
];
const CLASSIFY_GROUPS = [
  {group:"Family",opts:[
    {v:"mother",l:"Mother"},{v:"father",l:"Father"},{v:"grandma",l:"Grandma"},{v:"grandpa",l:"Grandpa"},
    {v:"older brother",l:"Older Brother"},{v:"older sister",l:"Older Sister"},
    {v:"younger brother",l:"Younger Brother"},{v:"younger sister",l:"Younger Sister"},
    {v:"baby",l:"Baby"},{v:"aunt",l:"Aunt"},{v:"uncle",l:"Uncle"},{v:"cousin",l:"Cousin"},
  ]},
  {group:"Story Roles",opts:[
    {v:"wizard",l:"Wizard"},{v:"witch",l:"Witch"},{v:"fairy godmother",l:"Fairy Godmother"},
    {v:"knight",l:"Knight"},{v:"princess",l:"Princess"},{v:"prince",l:"Prince"},
    {v:"teacher",l:"Teacher"},{v:"shopkeeper",l:"Shopkeeper"},
  ]},
  {group:"Animals",opts:[
    {v:"bear",l:"Bear 🐻"},{v:"bunny",l:"Bunny 🐰"},{v:"cat",l:"Cat 🐱"},{v:"dog",l:"Dog 🐶"},
    {v:"dragon",l:"Dragon 🐉"},{v:"elephant",l:"Elephant 🐘"},{v:"fox",l:"Fox 🦊"},{v:"frog",l:"Frog 🐸"},
    {v:"lion",l:"Lion 🦁"},{v:"monkey",l:"Monkey 🐒"},{v:"owl",l:"Owl 🦉"},{v:"penguin",l:"Penguin 🐧"},
    {v:"rabbit",l:"Rabbit 🐰"},{v:"tiger",l:"Tiger 🐯"},{v:"turtle",l:"Turtle 🐢"},
    {v:"unicorn",l:"Unicorn 🦄"},{v:"wolf",l:"Wolf 🐺"},
  ]},
];
const OCCASIONS = [
  {value:"",label:"— None —"},
  {value:"birthday — this is the child's special day; weave in one magical gift, one moment of being truly seen and celebrated, and a sense that the whole world quietly knew it was their day",label:"🎂 Birthday"},
  {value:"first day of school — the child is brave but their tummy feels like butterflies; the story should transform that fluttery feeling into excitement, and end with the world feeling a little more familiar and safe",label:"🎒 First Day of School"},
  {value:"new baby sibling — mixed feelings are real and valid; the story should acknowledge the bigness of change while revealing that love doesn't divide, it multiplies",label:"👶 New Baby Sibling"},
  {value:"moving to a new home — everything familiar has shifted; the story should gently show that home is not a place but the people and love you carry with you, and that new places hold new wonders waiting to be found",label:"📦 Moving Day"},
  {value:"recovering from being sick — the child has been through something hard; the story should feel like warm soup and a soft blanket — gentle, restorative, full of quiet gratitude for feeling better",label:"🌡️ Getting Better"},
  {value:"other",label:"✏️ Other (type your own)"},
];
const LESSONS = [
  {value:"",label:"— None —"},
  {value:"sharing and generosity — shown through a moment where giving something away turns out to fill the giver's heart more than keeping it ever could",label:"🤝 Sharing"},
  {value:"bravery and facing fears — shown through a moment where the hero walks toward the scary thing and discovers it only looked frightening from far away",label:"⚔️ Bravery"},
  {value:"kindness to others — shown through one small, specific act of noticing someone who needed to be seen, and choosing to see them",label:"💛 Kindness"},
  {value:"being a good friend — shown through listening carefully and showing up exactly when it matters, without being asked",label:"👫 Friendship"},
  {value:"never giving up — shown through a moment of almost-quitting where something small and true gives the hero just enough to try once more",label:"🔥 Perseverance"},
];
const LENGTHS = [
  {value:"short",   label:"Quick Story",   target:8,  advSetup:4, advRes:3, desc:"~3 min"},
  {value:"standard",label:"Bedtime Book",  target:12, advSetup:6, advRes:5, desc:"~5 min"},
  {value:"long",    label:"Full Adventure",target:16, advSetup:8, advRes:7, desc:"~8 min"},
];
const AGES = [
  {value:"age3",label:"Age 3–4",grade:"Pre-K",prompt:`READER AGE: 3–4 years old (Pre-K).

VOCABULARY: Use ONLY the simplest words a toddler knows. Sentences of 3–6 words maximum. If a word might confuse a 3-year-old, replace it.

STRUCTURE — write like Eric Carle (Brown Bear) or Mem Fox (Time for Bed):
• Heavy repetition — the same phrase or pattern returns every 2 pages, getting funnier or warmer each time
• One sentence per page is perfect. Two is fine. Three is the maximum.
• Clap-along rhythm — every page should have a natural beat when read aloud
• The refrain must appear at least 3 times
• Aim for ~8 pages. Write more if the story truly needs it.

TONE: Very silly. Very safe. LOTS of sound words — SPLAT, BOING, WHOOSH, KERPLUNK. Characters say "Oh no!" and "Uh oh!" and "Wow wow WOW!" Things fall over. Things go wrong in funny ways. Everything ends up fine.`},

  {value:"age5",label:"Age 5–6",grade:"Kindergarten",prompt:`READER AGE: 5–6 years old (Kindergarten).

VOCABULARY: Simple everyday words. Sentences of 6–10 words. It's fine to use one or two fun new words if the meaning is obvious from context.

STRUCTURE — write like Julia Donaldson (The Gruffalo) or Mo Willems (Pigeon):
• Use a Rule of Three: the hero tries something three times. First attempt fails funny. Second attempt fails differently. Third attempt succeeds — but not the way anyone expected.
• OR use a Running Joke: something silly happens on page 1. It keeps happening throughout. On the last page it happens one final time with a twist.
• Dialogue drives the story — characters say the wrong thing, the funny thing, the brave thing. Every page should have at least one line of dialogue.
• Aim for ~10 pages. Write more if the story needs it.

TONE: Warm and funny. Characters are confidently wrong about things. Someone always has a terrible plan that sort of works anyway. Sound words on at least 3 pages.`},

  {value:"age7",label:"Age 7–8",grade:"1st–2nd Grade",prompt:`READER AGE: 7–8 years old (1st–2nd Grade).

VOCABULARY: Can handle sentences of 8–14 words and a few interesting new words — but always clear from context. One "delicious word" per page that sounds good when read aloud.

STRUCTURE — write like Roald Dahl's shorter books (The Enormous Crocodile) or Arnold Lobel (Frog and Toad):
• Give the story a real twist — something revealed at the end that recontextualises page 1. The child goes "OH!" and wants to read it again.
• Include a Running Joke that builds and pays off big on the final pages.
• The hero must be underestimated by someone — and prove them spectacularly wrong.
• Characters have contradictions: brave but secretly nervous, clever but makes silly mistakes.
• Aim for ~12 pages. Write more if the story needs it.

TONE: Wry and warm. Some Dahl-style exaggeration — things aren't just big, they're SO ENORMOUSLY, RIDICULOUSLY big. The ending should be surprising AND satisfying.`},

  {value:"age9",label:"Age 9–10",grade:"3rd–4th Grade",prompt:`READER AGE: 9–10 years old (3rd–4th Grade).

VOCABULARY: Richer, more varied vocabulary is welcome. Sentences can be longer and more complex. Introduce 1–2 genuinely interesting words per page — the kind children will use the next day to impress someone.

STRUCTURE — write like Roald Dahl (Fantastic Mr Fox) or A.A. Milne (Winnie-the-Pooh):
• Real emotional depth: a challenge that genuinely matters, a moment of real doubt, a resolution that feels earned
• A twist ending that recontextualises the whole story — not just a surprise, but a revelation
• Characters have real contradictions and growth: someone starts wrong and learns something true
• A subplot or secondary character whose story intersects with the hero's in an unexpected way
• Aim for ~14 pages. Write more if the story needs it.

TONE: Intelligent, funny, and emotionally honest. Not condescending. Children this age can handle bittersweet moments as long as the ending is warm. The best moment in the story should make both the child AND the parent feel something.`},
];
const CHAR_ICONS = {hero:"⭐",friend:"👫",sibling:"👶",parent:"🧑‍🍼",pet:"🐾",toy:"🧸"};
const SPARK_COLORS = ["#fde68a","#fbbf24","#f0cc60","#fdf5e0","#fff"];
const STARS_DATA = Array.from({length:70},(_,i) => ({
  id:i,top:Math.random()*100,left:Math.random()*100,size:Math.random()*2.2+0.5,
  d:`${Math.random()*3+2}s`,dl:`-${Math.random()*4}s`,
  lo:(Math.random()*.18+.04).toFixed(2),hi:(Math.random()*.45+.25).toFixed(2),
}));

/* ── Utils ── */
const uid = () => Math.random().toString(36).slice(2);
const capitalize = (s) => s ? s.charAt(0).toUpperCase()+s.slice(1) : s;
const pronouns = (g) => g==="girl" ? "she/her" : g==="boy" ? "he/him" : "";

const strHash = (s) => {
  let h=5381;
  for(let i=0;i<s.length;i++) h=(h*33)^s.charCodeAt(i);
  return (h>>>0).toString(36);
};

const photoFP = (b64) => b64 ? strHash(b64.slice(0,120)) : null;

const makeStorySeed = (heroName,theme,chars,occasion,occasionCustom,lesson,adventure,len,gender,classify,guidance) => {
  const occ = occasion==="other" ? occasionCustom : occasion;
  const sig = `${heroName.toLowerCase()}|${theme.value}|${chars.map(c=>`${c.type}:${c.name}:${c.classify||""}:${c.gender||""}`).join(",")}|${occ}|${lesson}|${adventure}|${len}|${gender}|${classify}|${guidance.slice(0,60)}`;
  return (parseInt(strHash(sig),36)%88888)+11111;
};

const compressImage = (file) => new Promise((res,rej) => {
  const r = new FileReader();
  r.onerror = rej;
  r.onload = (e) => {
    const img = new Image();
    img.onerror = rej;
    img.onload = () => {
      const s = Math.min(512/img.width, 512/img.height, 1);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width*s);
      c.height = Math.round(img.height*s);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      const preview = c.toDataURL("image/jpeg",.82);
      res({b64:preview.split(",")[1],preview});
    };
    img.src = e.target.result;
  };
  r.readAsDataURL(file);
});

const illoUrl = (prompt,seed,w=400,h=200) => {
  const style = "children's picture book illustration, soft watercolor, gouache, warm pastel, cozy bedtime, no text";
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt}, ${style}`)}?width=${w}&height=${h}&nologo=true&model=turbo&seed=${seed}&nofeed=true`;
};

const extractJSON = (text) => {
  let s = text.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
  try { return JSON.parse(s); } catch(_) {}
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if(start===-1||end<=start) throw new Error("No JSON found in response");
  const block = s.slice(start,end+1);
  try { return JSON.parse(block); } catch(_) {}
  const fixed = block.replace(/,(\s*[}\]])/g,"$1");
  return JSON.parse(fixed);
};

/* ── Storage ── */
const S_PFX = "ss9_";
const sGet = async (k) => { try { const v=localStorage.getItem(S_PFX+k); return v?JSON.parse(v):null; } catch { return null; } };
const sSet = async (k,v) => { try { localStorage.setItem(S_PFX+k,JSON.stringify(v)); } catch {} };
const sDel = async (k) => { try { localStorage.removeItem(S_PFX+k); } catch {} };

/* ── Preload cache ── */
const _imgCache = new Map();
const preloadImg = (url,onLoad,onErr) => {
  if(_imgCache.has(url)){
    const img=_imgCache.get(url);
    if(img.complete&&img.naturalWidth>0) onLoad?.();
    return img;
  }
  const img = new window.Image();
  img.onload = () => onLoad?.();
  img.onerror = () => onErr?.();
  img.src = url;
  _imgCache.set(url,img);
  return img;
};


/* ══════════════════════════════════════════════════════════════
   SLEEP AUDIO ENGINE  —  all Web Audio, zero file downloads
══════════════════════════════════════════════════════════════ */
const SleepAudio = (() => {
  let _ctx = null;
  let _ambient = null;       // { gainNode, lfo, nodes[] }
  let _ambientVol = 0.18;    // current target volume
  let _sessionActive = false;
  let _sfxEnabled = true;
  let _ambientEnabled = true;
  let _fadeTimer = null;

  // ── AudioContext ──────────────────────────────────────────────
  const ctx = () => {
    if(!_ctx) _ctx = new (window.AudioContext||window.webkitAudioContext)();
    if(_ctx.state==="suspended") _ctx.resume();
    return _ctx;
  };

  // ── Envelope helper ──────────────────────────────────────────
  const env = (gainNode, vol, attackT, decayT, now) => {
    const g = gainNode.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(0, now);
    g.linearRampToValueAtTime(vol, now+attackT);
    g.linearRampToValueAtTime(0, now+attackT+decayT);
  };

  // ── Noise buffer (2 s white noise, reusable) ─────────────────
  let _noiseBuf = null;
  const noiseBuf = () => {
    if(_noiseBuf) return _noiseBuf;
    const c = ctx();
    const buf = c.createBuffer(1, c.sampleRate*2, c.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
    _noiseBuf = buf;
    return buf;
  };

  const makeNoise = (dest) => {
    const c = ctx();
    const src = c.createBufferSource();
    src.buffer = noiseBuf();
    src.loop = true;
    const filt = c.createBiquadFilter();
    filt.type = "bandpass";
    const g = c.createGain();
    src.connect(filt); filt.connect(g); g.connect(dest);
    src.start();
    return {src, filt, g};
  };

  const makeOsc = (dest, freq, type="sine", vol=0.12) => {
    const c = ctx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = vol;
    osc.connect(g); g.connect(dest);
    osc.start();
    return {osc, g};
  };

  const makeLFO = (target, rate, depth, centre) => {
    const c = ctx();
    const lfo = c.createOscillator();
    const lfoG = c.createGain();
    lfo.frequency.value = rate;
    lfoG.gain.value = depth;
    target.setValueAtTime(centre, c.currentTime);
    lfo.connect(lfoG); lfoG.connect(target);
    lfo.start();
    return {lfo, lfoG};
  };

  // ── Bell / chime synthesis ────────────────────────────────────
  const playBell = (freq, vol=0.18, dur=1.8) => {
    const c = ctx(); const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine"; osc.frequency.value = freq;
    env(g, vol, 0.005, dur, now);
    osc.connect(g); g.connect(c.destination);
    osc.start(now); osc.stop(now+dur+0.05);
    // add shimmer partials
    [2.756, 5.404].forEach(ratio => {
      const o2 = c.createOscillator();
      const g2 = c.createGain();
      o2.type = "sine"; o2.frequency.value = freq*ratio;
      env(g2, vol*0.25, 0.005, dur*0.5, now);
      o2.connect(g2); g2.connect(c.destination);
      o2.start(now); o2.stop(now+dur*0.5+0.05);
    });
  };

  // ── Lullaby melody ────────────────────────────────────────────
  // Pentatonic: C4 E4 G4 A4 C5
  const NOTES = [261.63, 329.63, 392, 440, 523.25];
  const INTRO_SEQ  = [2, 4, 3, 1, 0, 2, 4]; // indices into NOTES
  const OUTRO_SEQ  = [4, 3, 2, 0, 1, 2, 0]; // reversed, slower

  const playMelody = (seq, spacing=0.38, vol=0.13, dur=1.0, cb) => {
    const c = ctx(); let t = c.currentTime + 0.05;
    seq.forEach((ni, i) => {
      const freq = NOTES[ni];
      const osc = c.createOscillator();
      const g = c.createGain();
      const rev = c.createBiquadFilter();
      rev.type = "lowpass"; rev.frequency.value = 2800;
      osc.type = "sine"; osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t+0.04);
      g.gain.linearRampToValueAtTime(0, t+dur);
      osc.connect(g); g.connect(rev); rev.connect(c.destination);
      osc.start(t); osc.stop(t+dur+0.05);
      t += spacing;
    });
    if(cb) setTimeout(cb, (t - c.currentTime)*1000 + 100);
  };

  // ── Page turn sound ───────────────────────────────────────────
  const playPageTurn = () => {
    if(!_ambientEnabled&&!_sfxEnabled) return;
    const c = ctx(); const now = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate*0.12, c.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = "bandpass"; filt.frequency.value = 2400; filt.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = 0.22;
    src.connect(filt); filt.connect(g); g.connect(c.destination);
    src.start(now);
  };

  // ── Keyword SFX bank ─────────────────────────────────────────
  const SFX = {
    thunder: () => {
      const c = ctx(); const now = c.currentTime;
      [40,55,70].forEach((f,i) => {
        const o = c.createOscillator(); const g = c.createGain();
        o.type="sawtooth"; o.frequency.value=f;
        g.gain.setValueAtTime(0,now+i*0.04);
        g.gain.linearRampToValueAtTime(0.18,now+i*0.04+0.08);
        g.gain.linearRampToValueAtTime(0,now+i*0.04+0.7);
        o.connect(g); g.connect(c.destination);
        o.start(now+i*0.04); o.stop(now+1.2);
      });
    },
    rain: () => {
      const c = ctx(); const now = c.currentTime;
      const n = makeNoise(c.destination);
      n.filt.type="bandpass"; n.filt.frequency.value=1200; n.filt.Q.value=0.5;
      n.g.gain.setValueAtTime(0,now);
      n.g.gain.linearRampToValueAtTime(0.14,now+0.3);
      n.g.gain.linearRampToValueAtTime(0,now+2.5);
      setTimeout(()=>{ try{n.src.stop();}catch(_){} },3000);
    },
    wind: () => {
      const c = ctx(); const now = c.currentTime;
      const n = makeNoise(c.destination);
      n.filt.type="lowpass"; n.filt.frequency.value=400;
      n.g.gain.setValueAtTime(0,now);
      n.g.gain.linearRampToValueAtTime(0.12,now+0.5);
      n.g.gain.linearRampToValueAtTime(0,now+2.2);
      setTimeout(()=>{ try{n.src.stop();}catch(_){} },3000);
    },
    giggle: () => {
      const c = ctx();
      [880,1046,1318].forEach((f,i) => {
        setTimeout(()=>playBell(f,0.09,0.3),i*110);
      });
    },
    roar: () => {
      const c = ctx(); const now = c.currentTime;
      const o = c.createOscillator(); const g = c.createGain();
      const dist = c.createWaveShaper();
      const curve = new Float32Array(256);
      for(let i=0;i<256;i++) curve[i]=((i*2/256-1)*3)/(1+Math.abs((i*2/256-1)*3));
      dist.curve=curve;
      o.type="sawtooth"; o.frequency.value=80;
      o.frequency.linearRampToValueAtTime(55,now+0.8);
      g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(0.3,now+0.1);
      g.gain.linearRampToValueAtTime(0,now+0.9);
      o.connect(dist); dist.connect(g); g.connect(c.destination);
      o.start(now); o.stop(now+1.0);
    },
    twinkle: () => {
      const c = ctx();
      [1318,1568,1760,2093].forEach((f,i)=>setTimeout(()=>playBell(f,0.11,0.8),i*80));
    },
    splash: () => {
      const c = ctx(); const now = c.currentTime;
      const n = makeNoise(c.destination);
      n.filt.type="highpass"; n.filt.frequency.value=800;
      n.g.gain.setValueAtTime(0,now);
      n.g.gain.linearRampToValueAtTime(0.2,now+0.02);
      n.g.gain.exponentialRampToValueAtTime(0.001,now+0.4);
      setTimeout(()=>{ try{n.src.stop();}catch(_){} },600);
    },
    whoosh: () => {
      const c = ctx(); const now = c.currentTime;
      const n = makeNoise(c.destination);
      n.filt.type="bandpass";
      n.filt.frequency.setValueAtTime(400,now);
      n.filt.frequency.linearRampToValueAtTime(2400,now+0.6);
      n.g.gain.setValueAtTime(0,now);
      n.g.gain.linearRampToValueAtTime(0.15,now+0.1);
      n.g.gain.linearRampToValueAtTime(0,now+0.65);
      setTimeout(()=>{ try{n.src.stop();}catch(_){} },800);
    },
    yawn: () => {
      const c = ctx(); const now = c.currentTime;
      const o = c.createOscillator(); const g = c.createGain();
      o.type="sine";
      o.frequency.setValueAtTime(440,now);
      o.frequency.linearRampToValueAtTime(220,now+1.0);
      o.frequency.linearRampToValueAtTime(280,now+1.5);
      g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(0.08,now+0.2);
      g.gain.linearRampToValueAtTime(0,now+1.6);
      o.connect(g); g.connect(c.destination);
      o.start(now); o.stop(now+1.7);
    },
    bells: () => {
      [523.25,659.25,783.99].forEach((f,i)=>setTimeout(()=>playBell(f,0.15,1.4),i*200));
    },
    creak: () => {
      const c = ctx(); const now = c.currentTime;
      const o = c.createOscillator(); const g = c.createGain();
      o.type="sawtooth";
      o.frequency.setValueAtTime(180,now);
      o.frequency.linearRampToValueAtTime(120,now+0.25);
      g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(0.06,now+0.02);
      g.gain.linearRampToValueAtTime(0,now+0.28);
      o.connect(g); g.connect(c.destination);
      o.start(now); o.stop(now+0.32);
    },
  };

  const KEYWORD_MAP = [
    [/\b(thunder|thundered|thunderclap)\b/i, "thunder"],
    [/\b(rain|raining|raindrops?|drizzle|pitter.?patter)\b/i, "rain"],
    [/\b(wind|windy|breeze|gust|whooshed?|whoooosh)\b/i, "wind"],
    [/\b(giggl|laugh|haha|tee.?hee|chuckl)\w*/i, "giggle"],
    [/\b(roar|roared|growl|grumbled)\b/i, "roar"],
    [/\b(twinkl|sparkl|shimmer|glitter|fizzing|glimmer)\w*/i, "twinkle"],
    [/\b(splash|splashed|plop|drip|ripple|bubble)\w*/i, "splash"],
    [/\b(whoosh|whooshed|flew|fluttered|swooped|zoomed)\b/i, "whoosh"],
    [/\b(yawn|snore|sleepy|drowsy|drooping|dozed?)\w*/i, "yawn"],
    [/\b(bell|bells|chime|chimed|ding|ring|rang)\b/i, "bells"],
    [/\b(creak|creaked|groan|crack|snap)\b/i, "creak"],
  ];

  const scanSFX = (text) => {
    const hits = [];
    KEYWORD_MAP.forEach(([re,name]) => { if(re.test(text)) hits.push(name); });
    return [...new Set(hits)].slice(0,2); // max 2 sfx per page
  };

  // ── World ambient beds ────────────────────────────────────────
  const AMBIENT_DEFS = {
    "Enchanted Forest": (dest) => {
      const c = ctx();
      const nodes = [];
      // Low hum
      const drone = makeOsc(dest,55,"sine",0.04); nodes.push(drone);
      // Cricket chorus: noise + fast tremolo
      const cricket = makeNoise(dest);
      cricket.filt.type="bandpass"; cricket.filt.frequency.value=3200; cricket.filt.Q.value=8;
      cricket.g.gain.value=0.0;
      const cLFO = makeLFO(cricket.g.gain, 14, 0.07, 0.07); nodes.push(cricket,cLFO);
      // Wind layer
      const wind = makeNoise(dest);
      wind.filt.type="lowpass"; wind.filt.frequency.value=280;
      wind.g.gain.value=0.06;
      const wLFO = makeLFO(wind.filt.frequency, 0.08, 80, 280); nodes.push(wind,wLFO);
      return nodes;
    },
    "Cloud Kingdom": (dest) => {
      const c = ctx(); const nodes = [];
      const pad1 = makeOsc(dest,523.25,"sine",0.05); nodes.push(pad1);
      const pad2 = makeOsc(dest,659.25,"sine",0.03); nodes.push(pad2);
      const wind = makeNoise(dest);
      wind.filt.type="lowpass"; wind.filt.frequency.value=200; wind.g.gain.value=0.05;
      const wLFO = makeLFO(wind.g.gain,0.06,0.03,0.05); nodes.push(wind,wLFO);
      const shimmer = makeNoise(dest);
      shimmer.filt.type="highpass"; shimmer.filt.frequency.value=3000; shimmer.g.gain.value=0.02;
      nodes.push(shimmer);
      return nodes;
    },
    "Ocean World": (dest) => {
      const c = ctx(); const nodes = [];
      const wave = makeOsc(dest,55,"sine",0.08); nodes.push(wave);
      const waveLFO = makeLFO(wave.g.gain,0.22,0.06,0.08); nodes.push(waveLFO);
      const surge = makeNoise(dest);
      surge.filt.type="lowpass"; surge.filt.frequency.value=180; surge.g.gain.value=0.09;
      const sLFO = makeLFO(surge.filt.frequency,0.18,60,180); nodes.push(surge,sLFO);
      return nodes;
    },
    "Magic Bakery": (dest) => {
      const c = ctx(); const nodes = [];
      const hum = makeOsc(dest,220,"sine",0.05); nodes.push(hum);
      const hum2 = makeOsc(dest,330,"sine",0.03); nodes.push(hum2);
      const warmth = makeNoise(dest);
      warmth.filt.type="lowpass"; warmth.filt.frequency.value=300; warmth.g.gain.value=0.04;
      nodes.push(warmth);
      return nodes;
    },
    "Dragon Mountain": (dest) => {
      const c = ctx(); const nodes = [];
      const cave = makeOsc(dest,40,"sine",0.08); nodes.push(cave);
      const cave2 = makeOsc(dest,80,"sine",0.05); nodes.push(cave2);
      const rumble = makeNoise(dest);
      rumble.filt.type="lowpass"; rumble.filt.frequency.value=120; rumble.g.gain.value=0.07;
      const rLFO = makeLFO(rumble.g.gain,0.12,0.04,0.07); nodes.push(rumble,rLFO);
      return nodes;
    },
    "Fairy Garden": (dest) => {
      const c = ctx(); const nodes = [];
      const shimmer = makeOsc(dest,880,"sine",0.03);
      const shLFO = makeLFO(shimmer.g.gain,4,0.02,0.03); nodes.push(shimmer,shLFO);
      const shimmer2 = makeOsc(dest,1047,"sine",0.02); nodes.push(shimmer2);
      const cricket = makeNoise(dest);
      cricket.filt.type="bandpass"; cricket.filt.frequency.value=3400; cricket.filt.Q.value=10;
      cricket.g.gain.value=0.0;
      const cLFO = makeLFO(cricket.g.gain,16,0.06,0.06); nodes.push(cricket,cLFO);
      const breeze = makeNoise(dest);
      breeze.filt.type="lowpass"; breeze.filt.frequency.value=240; breeze.g.gain.value=0.04;
      nodes.push(breeze);
      return nodes;
    },
    "Toy Town": (dest) => {
      const c = ctx(); const nodes = [];
      const tick = makeNoise(dest);
      tick.filt.type="bandpass"; tick.filt.frequency.value=1800; tick.filt.Q.value=5;
      tick.g.gain.value=0.0;
      const tLFO = makeLFO(tick.g.gain,4,0.05,0.05); nodes.push(tick,tLFO);
      const warmth = makeOsc(dest,220,"sine",0.03); nodes.push(warmth);
      const warmth2 = makeOsc(dest,440,"triangle",0.02); nodes.push(warmth2);
      return nodes;
    },
    "The Moon": (dest) => {
      const c = ctx(); const nodes = [];
      const drone = makeOsc(dest,432,"sine",0.06); nodes.push(drone);
      const dLFO = makeLFO(drone.g.gain,0.04,0.02,0.06); nodes.push(dLFO);
      const upper = makeOsc(dest,864,"sine",0.02); nodes.push(upper);
      const shimmer = makeNoise(dest);
      shimmer.filt.type="highpass"; shimmer.filt.frequency.value=4000; shimmer.g.gain.value=0.01;
      nodes.push(shimmer);
      return nodes;
    },
  };

  const DEFAULT_AMBIENT = AMBIENT_DEFS["Enchanted Forest"];

  // ── Ambient control ───────────────────────────────────────────
  const stopAmbient = () => {
    if(!_ambient) return;
    try {
      _ambient.masterGain.gain.setValueAtTime(_ambient.masterGain.gain.value, ctx().currentTime);
      _ambient.masterGain.gain.linearRampToValueAtTime(0, ctx().currentTime+1.5);
      setTimeout(() => {
        try {
          _ambient.nodes.forEach(n => {
            if(n.osc) n.osc.stop();
            if(n.src) n.src.stop();
            if(n.lfo) n.lfo.stop();
          });
          _ambient.masterGain.disconnect();
        } catch(_) {}
        _ambient = null;
      }, 1800);
    } catch(_) { _ambient = null; }
  };

  const startAmbient = (themeLabel) => {
    if(!_ambientEnabled || _ambient) return;
    const c = ctx();
    const masterGain = c.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(c.destination);
    const builder = AMBIENT_DEFS[themeLabel] || DEFAULT_AMBIENT;
    const nodes = builder(masterGain);
    _ambient = { masterGain, nodes };
    // Fade in
    masterGain.gain.linearRampToValueAtTime(_ambientVol, c.currentTime+2.0);
  };

  const duckAmbient = () => {
    if(!_ambient) return;
    const c = ctx();
    _ambient.masterGain.gain.cancelScheduledValues(c.currentTime);
    _ambient.masterGain.gain.setValueAtTime(_ambient.masterGain.gain.value, c.currentTime);
    _ambient.masterGain.gain.linearRampToValueAtTime(0.04, c.currentTime+0.3);
  };

  const unduckAmbient = (targetVol) => {
    if(!_ambient) return;
    const c = ctx();
    const v = targetVol ?? _ambientVol;
    _ambient.masterGain.gain.cancelScheduledValues(c.currentTime);
    _ambient.masterGain.gain.setValueAtTime(_ambient.masterGain.gain.value, c.currentTime);
    _ambient.masterGain.gain.linearRampToValueAtTime(v, c.currentTime+0.8);
  };

  // ── Public API ────────────────────────────────────────────────
  return {
    // Called when Read Aloud session begins
    startSession(themeLabel, onReady) {
      _sessionActive = true;
      ctx(); // create context on user gesture
      startAmbient(themeLabel);
      // Intro ceremony: chime → 0.5s pause → speak
      playMelody(INTRO_SEQ, 0.36, 0.13, 0.9, () => {
        setTimeout(onReady, 400);
      });
    },

    // Called when session ends (pause or final page done)
    endSession(isFinal) {
      _sessionActive = false;
      if(isFinal) {
        // Outro melody then fade ambient
        playMelody(OUTRO_SEQ, 0.48, 0.10, 1.2, () => {
          unduckAmbient(0);
          setTimeout(() => stopAmbient(), 5000);
        });
      } else {
        stopAmbient();
      }
    },

    // Called just before speech starts on a page
    onSpeechStart(text, pageProgress) {
      // Sleepification: lower ambient on last 2 pages
      _ambientVol = pageProgress > 0.8 ? 0.09 : pageProgress > 0.65 ? 0.13 : 0.18;
      duckAmbient();
      // Schedule SFX at 1.5s into speech
      if(_sfxEnabled) {
        const hits = scanSFX(text);
        hits.forEach((name, i) => {
          setTimeout(() => { if(SFX[name]) SFX[name](); }, 1500 + i*2200);
        });
      }
      // Refrain chime check
      return scanSFX(text); // returns sfx list (used for debug)
    },

    // Called when a page finishes being spoken
    onSpeechEnd(isLastPage, isSecondToLast) {
      unduckAmbient(_ambientVol);
      playPageTurn();
    },

    // Check if refrain is in text
    checkRefrain(text, refrain) {
      if(!refrain||!text) return false;
      return text.toLowerCase().includes(refrain.slice(0,20).toLowerCase());
    },

    playRefrainChime() {
      if(!_sfxEnabled) return;
      setTimeout(() => {
        playBell(659.25, 0.12, 1.0);
        setTimeout(() => playBell(783.99, 0.10, 1.2), 280);
      }, 200);
    },

    // Speech rate — slower on final pages
    getSpeechRate(pageProgress) {
      if(pageProgress > 0.82) return 0.60;
      if(pageProgress > 0.65) return 0.66;
      return 0.72;
    },

    // Post-page pause — longer near end
    getPostPagePause(pageProgress) {
      if(pageProgress > 0.82) return 2200;
      if(pageProgress > 0.65) return 1400;
      return 850;
    },

    // Settings
    setAmbient(on) { _ambientEnabled = on; if(!on) stopAmbient(); },
    setSFX(on) { _sfxEnabled = on; },
    isSession() { return _sessionActive; },
  };
})();


/* ── ElevenLabs TTS — calls /api/tts (Vercel proxy, key stays server-side) ── */
// NARRATOR_VOICE_ID is your cloned voice from elevenlabs.io
// Set it in Vercel env vars as ELEVENLABS_VOICE_ID — or paste directly here for local dev
const NARRATOR_VOICE_ID = typeof __NARRATOR_VOICE_ID__ !== "undefined" ? __NARRATOR_VOICE_ID__ : "";

const elTTS = async (text, voiceId, speed=1.0) => {
  const elSpeed = Math.max(0.7, Math.min(1.0, speed / 0.72));
  const resp = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId, speed: elSpeed }),
  });
  if(!resp.ok) throw new Error(`TTS error ${resp.status}`);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
};

/* ── API ── */
const callClaude = async (messages, system="", maxTokens=4000) => {
  const body = {model:"claude-sonnet-4-6",max_tokens:maxTokens,messages};
  if(system) body.system = system;
  const r = await fetch("/api/claude",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body),
  });
  const d = await r.json();
  if(!r.ok) throw new Error(d.error?.message||`API error ${r.status}`);
  const text = d.content?.find(b=>b.type==="text")?.text||"";
  if(!text) throw new Error("Empty response from API");
  return text;
};

/* ── Shared sub-components (defined outside main to avoid transpiler issues) ── */
const Illo = ({url,loaded}) => (
  <div className="illo-slot">
    <div className="shimmer" style={{opacity:loaded?0:1,transition:"opacity .8s"}} />
    {url && <img src={url} className="illo-img" style={{opacity:loaded?1:0}} alt="" />}
    {!loaded && (
      <div className="illo-fb">
        <div className="illo-fb-e">✨</div>
        <div className="illo-fb-t">Painting…</div>
      </div>
    )}
  </div>
);


/* ── Dream Illustration (static animated scene, used on all pages until personal illustrations are ready) ── */
const DG_STARS = [
  [12,9,1.3],[28,18,0.7],[42,6,1],[55,14,1.3],[70,4,0.8],[88,11,1],[105,7,1.3],
  [118,19,0.7],[135,5,1],[152,13,1],[170,8,1.3],[188,16,0.7],[205,4,1],[222,11,0.8],
  [240,7,1.3],[258,14,1],[275,5,0.8],[292,18,1],[310,9,1.3],[325,4,0.7],
  [338,16,1],[352,8,1.3],[365,13,0.7],[378,5,1],[390,18,0.8],
  [8,32,0.7],[48,28,1],[92,34,1.3],[140,24,0.8],[185,30,1],
  [235,26,1.3],[280,33,0.7],[330,27,1],[375,31,0.8],[22,44,1],
  [68,38,1.3],[115,48,0.7],[162,36,1],[210,42,0.8],[255,39,1],
  [300,45,1.3],[345,40,0.7],[380,48,1],
];
const DG_SPARKS = [
  [140,50,"#fde68a",2,"2.1s","0s"],[170,35,"#86efac",1.5,"2.8s","-0.8s"],
  [245,28,"#fde68a",1.5,"3.1s","-0.3s"],[275,55,"#f5d0fe",2,"2.4s","-1.2s"],
  [130,75,"#86efac",1.2,"1.9s","-0.5s"],[355,60,"#fde68a",1.5,"2.6s","-0.9s"],
  [380,38,"#f5d0fe",1.2,"2.2s","-0.2s"],[95,45,"#fde68a",1.8,"3s","-1.4s"],
  [220,65,"#86efac",1.2,"2.3s","-0.7s"],[156,88,"#fde68a",1,"1.8s","-1.1s"],
];

const DreamIllo = () => (
  <div style={{position:"absolute",inset:0,overflow:"hidden",background:"#04091a"}}>
    <svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg"
         preserveAspectRatio="xMidYMid slice"
         style={{width:"100%",height:"100%",display:"block"}}>
      <defs>
        <style>{`
          .dg-st{animation:dgTwinkle var(--d,2s) ease-in-out infinite var(--dl,0s)}
          .dg-gw{animation:dgGlow var(--d,3s) ease-in-out infinite var(--dl,0s)}
          .dg-bb{animation:dgBob var(--d,5s) ease-in-out infinite var(--dl,0s)}
          .dg-f1{animation:dgFF1 4.5s ease-in-out infinite}
          .dg-f2{animation:dgFF2 5.5s ease-in-out infinite}
          .dg-sp{animation:dgSP var(--d,2s) ease-in-out infinite var(--dl,0s)}
          .dg-sm{animation:dgSmk 2s ease-out infinite var(--dl,0s)}
          @keyframes dgTwinkle{0%,100%{opacity:.06;transform:scale(.55)}50%{opacity:1;transform:scale(1.3)}}
          @keyframes dgGlow{0%,100%{opacity:.28}50%{opacity:.92}}
          @keyframes dgBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
          @keyframes dgFF1{0%,100%{transform:translate(0,0)}30%{transform:translate(5px,-9px)}70%{transform:translate(-4px,-5px)}}
          @keyframes dgFF2{0%,100%{transform:translate(0,0)}33%{transform:translate(-6px,-8px)}66%{transform:translate(4px,-11px)}}
          @keyframes dgSP{0%,100%{opacity:0;transform:scale(0)}40%,60%{opacity:1;transform:scale(1)}}
          @keyframes dgSmk{0%{opacity:0;transform:translate(0,0) scale(.8)}45%{opacity:.4}100%{opacity:0;transform:translate(0,-14px) scale(2.2)}}
        `}</style>
        <linearGradient id="dg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04091a"/><stop offset="100%" stopColor="#0c1830"/>
        </linearGradient>
        <radialGradient id="dg-fg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#86efac" stopOpacity=".65"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="dg-fg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e879f9" stopOpacity=".55"/>
          <stop offset="100%" stopColor="#e879f9" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="dg-vig" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent"/>
          <stop offset="100%" stopColor="#04091a" stopOpacity=".48"/>
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="400" height="190" fill="url(#dg-sky)"/>

      {/* Stars */}
      {DG_STARS.map(([x,y,r],i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="white" className="dg-st"
          style={{"--d":`${(2+((i*73)%30)/10).toFixed(1)}s`,"--dl":`-${((i*47)%40)/10}s`}}/>
      ))}

      {/* Moon glow halos */}
      <circle cx="344" cy="26" r="38" fill="#fde68a" opacity="0.07" className="dg-gw" style={{"--d":"4s","--dl":"0s"}}/>
      <circle cx="344" cy="26" r="25" fill="#fde68a" opacity="0.1" className="dg-gw" style={{"--d":"4s","--dl":"1s"}}/>
      {/* Moon */}
      <circle cx="344" cy="26" r="17" fill="#fef3c0"/>
      <circle cx="338" cy="21" r="3" fill="#f0de88" opacity="0.4"/>
      <circle cx="349" cy="30" r="2" fill="#f0de88" opacity="0.3"/>
      <circle cx="342" cy="31" r="1.5" fill="#f0de88" opacity="0.28"/>

      {/* Far hills */}
      <path d="M0 154 Q40 131 80 146 Q120 126 160 139 Q200 119 240 135 Q280 117 320 131 Q355 119 400 129 L400 190 L0 190Z" fill="#060d1c"/>
      {/* Near ground */}
      <path d="M0 169 Q50 156 100 164 Q150 153 200 161 Q250 151 300 159 Q350 152 400 158 L400 190 L0 190Z" fill="#080f22"/>

      {/* Window */}
      <rect x="20" y="52" width="46" height="72" rx="23" fill="#0b1833" stroke="#243258" strokeWidth="2.5"/>
      <line x1="43" y1="52" x2="43" y2="124" stroke="#243258" strokeWidth="1.5"/>
      <line x1="20" y1="90" x2="66" y2="90" stroke="#243258" strokeWidth="1.5"/>
      <rect x="21" y="53" width="44" height="70" rx="22" fill="#fde68a" opacity="0.033"/>
      {/* Curtains */}
      <path d="M15 47 Q20 72 15 127 Q27 111 26 87 Q28 66 22 49Z" fill="#1c2e6a" opacity="0.88"/>
      <path d="M71 47 Q66 72 71 127 Q59 111 60 87 Q58 66 64 49Z" fill="#1c2e6a" opacity="0.88"/>
      <ellipse cx="23" cy="88" rx="4" ry="6" fill="#28388a" opacity="0.7"/>
      <ellipse cx="63" cy="88" rx="4" ry="6" fill="#28388a" opacity="0.7"/>

      {/* Floor shadow */}
      <rect x="0" y="174" width="400" height="16" fill="#050b18" opacity="0.6"/>

      {/* === BED === */}
      {/* Posts */}
      <rect x="137" y="100" width="11" height="78" rx="3" fill="#3e1e07"/>
      <rect x="252" y="100" width="11" height="78" rx="3" fill="#3e1e07"/>
      <circle cx="142" cy="99" r="7.5" fill="#4e2808"/>
      <circle cx="258" cy="99" r="7.5" fill="#4e2808"/>
      {/* Headboard */}
      <rect x="148" y="107" width="104" height="40" rx="10" fill="#5c2c08"/>
      <rect x="153" y="111" width="94" height="32" rx="7" fill="#6e3810"/>
      <path d="M155 111 Q200 102 245 111" fill="none" stroke="#7e4418" strokeWidth="2"/>
      {/* Foot legs */}
      <rect x="137" y="156" width="11" height="32" rx="3" fill="#3e1e07"/>
      <rect x="252" y="156" width="11" height="32" rx="3" fill="#3e1e07"/>
      {/* Mattress */}
      <rect x="135" y="141" width="130" height="34" rx="6" fill="#1c2c58"/>
      {/* Blanket */}
      <path d="M135 147 Q200 141 265 147 L265 175 Q200 179 135 175Z" fill="#1a307a"/>
      {/* Quilt vertical lines */}
      {[152,165,178,191,204,217,230,243,256].map((x,i) => (
        <line key={`ql${i}`} x1={x} y1={148} x2={x} y2={175} stroke="#233990" strokeWidth="1" opacity="0.5"/>
      ))}
      {/* Quilt horizontal lines */}
      {[155,163,170].map((y,i) => (
        <path key={`qh${i}`} d={`M135 ${y} Q200 ${y-2} 265 ${y}`} fill="none" stroke="#233990" strokeWidth="1" opacity="0.5"/>
      ))}
      {/* Quilt star motifs */}
      {[[157,157],[181,166],[205,157],[229,166],[250,159]].map(([x,y],i) => (
        <text key={`qs${i}`} x={x} y={y} fontSize="7" fill="#2d4ca0" opacity="0.65" textAnchor="middle">✦</text>
      ))}
      {/* Pillow */}
      <ellipse cx="200" cy="147" rx="37" ry="9" fill="#d8d2c0"/>
      <ellipse cx="200" cy="145" rx="35" ry="7" fill="#eeead8"/>
      <line x1="177" y1="145" x2="223" y2="145" stroke="#d0c8b4" strokeWidth="1" opacity="0.48"/>

      {/* === CHILD READING === */}
      {/* Arms */}
      <path d="M188 145 Q183 152 180 158" stroke="#e8b878" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M212 145 Q217 152 220 158" stroke="#e8b878" strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Head */}
      <circle cx="200" cy="136" r="12" fill="#f0c898"/>
      {/* Hair */}
      <path d="M188 132 Q196 122 204 122 Q213 122 214 129 Q212 125 204 124 Q196 124 188 131Z" fill="#6a3608"/>
      <path d="M188 130 Q190 125 196 124" fill="none" stroke="#5a2808" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Ears */}
      <circle cx="188" cy="136" r="4.5" fill="#e8a868"/>
      <circle cx="212" cy="136" r="4.5" fill="#e8a868"/>
      <circle cx="188" cy="136" r="3" fill="#f0c898"/>
      <circle cx="212" cy="136" r="3" fill="#f0c898"/>
      {/* Eyes looking down at book */}
      <ellipse cx="196" cy="137" rx="2.2" ry="1.4" fill="#3a2010"/>
      <ellipse cx="204" cy="137" rx="2.2" ry="1.4" fill="#3a2010"/>
      <path d="M193.5 135.5 Q196 134.5 198.5 135.5" fill="none" stroke="#3a2010" strokeWidth="0.8"/>
      <path d="M201.5 135.5 Q204 134.5 206.5 135.5" fill="none" stroke="#3a2010" strokeWidth="0.8"/>
      {/* Nose */}
      <path d="M199 140.5 Q200 142 201 140.5" fill="none" stroke="#c8886a" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Smile */}
      <path d="M196.5 143 Q200 145.5 203.5 143" fill="none" stroke="#c07858" strokeWidth="1.3" strokeLinecap="round"/>
      {/* Cheek blush */}
      <circle cx="192" cy="140" r="3.5" fill="#f0a0a0" opacity="0.3"/>
      <circle cx="208" cy="140" r="3.5" fill="#f0a0a0" opacity="0.3"/>

      {/* === GLOWING BOOK === */}
      <ellipse cx="200" cy="162" rx="34" ry="15" fill="#fef3c0" opacity="0.16" className="dg-gw" style={{"--d":"2.5s","--dl":"0s"}}/>
      <ellipse cx="200" cy="161" rx="22" ry="9" fill="#fef3c0" opacity="0.2" className="dg-gw" style={{"--d":"2.5s","--dl":"0.5s"}}/>
      {/* Pages */}
      <path d="M181 153 Q191 147 200 150 L200 166 Q191 163 181 167Z" fill="#fef5e0"/>
      <path d="M219 153 Q209 147 200 150 L200 166 Q209 163 219 167Z" fill="#f5e8ce"/>
      {/* Page text lines */}
      {[154,158,162].map((y,i) => (
        <line key={`pl${i}`} x1={183+i} y1={y} x2={197} y2={y-0.5} stroke="#d4c4a0" strokeWidth="0.8" opacity="0.62"/>
      ))}
      {[154,158,162].map((y,i) => (
        <line key={`pr${i}`} x1={217-i} y1={y} x2={203} y2={y-0.5} stroke="#c4b490" strokeWidth="0.8" opacity="0.62"/>
      ))}
      {/* Spine */}
      <line x1="200" y1="150" x2="200" y2="166" stroke="#c4a870" strokeWidth="2"/>
      {/* Light rays from book */}
      <line x1="200" y1="147" x2="200" y2="137" stroke="#fde68a" strokeWidth="1.2" opacity="0.2"/>
      <line x1="190" y1="149" x2="184" y2="139" stroke="#fde68a" strokeWidth="0.9" opacity="0.14"/>
      <line x1="210" y1="149" x2="216" y2="139" stroke="#fde68a" strokeWidth="0.9" opacity="0.14"/>

      {/* === DRAGON (left floor, curled, bobbing) === */}
      <g className="dg-bb" style={{"--d":"6.5s","--dl":"0s"}}>
        {/* Tail */}
        <path d="M30 183 Q20 175 18 183 Q16 191 29 189 Q41 187 48 179" fill="none" stroke="#389058" strokeWidth="7" strokeLinecap="round"/>
        <path d="M48 179 Q53 172 57 177 Q55 183 48 181Z" fill="#28784a"/>
        {/* Body */}
        <ellipse cx="74" cy="173" rx="26" ry="15" fill="#3d9060"/>
        {/* Belly */}
        <ellipse cx="74" cy="176" rx="16" ry="9.5" fill="#78c898" opacity="0.72"/>
        {/* Back spines */}
        {[0,1,2,3].map(i => (
          <path key={`ds${i}`} d={`M${60+i*8} ${167-i*0.5} L${59+i*8} ${159-i*2} L${63+i*8} ${165-i*0.5}Z`} fill="#28784a"/>
        ))}
        {/* Wing */}
        <path d="M58 161 Q43 147 50 159 Q55 165 60 168Z" fill="#2d7048" opacity="0.82"/>
        <path d="M58 161 Q63 147 65 158 Q63 164 61 168Z" fill="#2d7048" opacity="0.55"/>
        {/* Neck */}
        <ellipse cx="88" cy="162" rx="11" ry="9" fill="#3d9060"/>
        {/* Head */}
        <ellipse cx="97" cy="153" rx="14" ry="11" fill="#3d9060"/>
        {/* Snout */}
        <ellipse cx="108" cy="155" rx="6.5" ry="5.5" fill="#4aaa70"/>
        <ellipse cx="111" cy="153.5" rx="1.3" ry="1" fill="#2d6845"/>
        {/* Eye */}
        <circle cx="99" cy="149" r="4" fill="#fde068"/>
        <circle cx="99" cy="149" r="2.5" fill="#1a3a1a"/>
        <circle cx="99.8" cy="148.2" r="0.9" fill="white"/>
        <ellipse cx="99" cy="149" rx="0.7" ry="2.3" fill="#0d200d"/>
        {/* Horns */}
        <path d="M90 145 L87 138 L93 143Z" fill="#2d7048"/>
        <path d="M98 144 L97 137 L101 142Z" fill="#2d7048"/>
        {/* Smoke puffs */}
        <circle cx="116" cy="150" r="3.5" fill="#b8ccb8" className="dg-sm" style={{"--dl":"0s"}}/>
        <circle cx="120" cy="147" r="3" fill="#b8ccb8" className="dg-sm" style={{"--dl":"0.6s"}}/>
        <circle cx="124" cy="145" r="2.5" fill="#b8ccb8" className="dg-sm" style={{"--dl":"1.2s"}}/>
      </g>

      {/* === OWL (right bedpost, bobbing) === */}
      <g className="dg-bb" style={{"--d":"5s","--dl":"1.2s"}} transform="translate(258, 90)">
        {/* Wings */}
        <path d="M-11 -1 Q-17 6 -13 13 Q-6 7 -9 2Z" fill="#6b3e18"/>
        <path d="M11 -1 Q17 6 13 13 Q6 7 9 2Z" fill="#6b3e18"/>
        {/* Body */}
        <ellipse cx="0" cy="5" rx="10" ry="12" fill="#8b5e28"/>
        {/* Belly */}
        <ellipse cx="0" cy="9" rx="6" ry="8" fill="#d4a840"/>
        {[-2,0,2,4,6].map((y,i) => (
          <path key={`ob${i}`} d={`M-4.5 ${y+9} Q0 ${y+10} 4.5 ${y+9}`} fill="none" stroke="#b88820" strokeWidth="0.9" opacity="0.45"/>
        ))}
        {/* Head */}
        <circle cx="0" cy="-8" r="10.5" fill="#8b5e28"/>
        <ellipse cx="0" cy="-7" rx="8" ry="7.5" fill="#c49038" opacity="0.33"/>
        {/* Ear tufts */}
        <path d="M-7 -17 L-10 -24 L-3 -18Z" fill="#6b3e18"/>
        <path d="M7 -17 L10 -24 L3 -18Z" fill="#6b3e18"/>
        {/* Eyes */}
        <circle cx="-3.5" cy="-8.5" r="5" fill="#fde068"/>
        <circle cx="3.5" cy="-8.5" r="5" fill="#fde068"/>
        <circle cx="-3.5" cy="-8.5" r="3.2" fill="#1a100a"/>
        <circle cx="3.5" cy="-8.5" r="3.2" fill="#1a100a"/>
        <circle cx="-2.4" cy="-9.5" r="1.1" fill="white"/>
        <circle cx="4.6" cy="-9.5" r="1.1" fill="white"/>
        {/* Beak */}
        <path d="M-1.5 -5.5 L0 -3.5 L1.5 -5.5 Q0 -4.5 -1.5 -5.5Z" fill="#d4a030"/>
        {/* Feet on post */}
        <path d="M-5 18 L-7 25 M-2 18 L-2 26 M2 18 L4 25 M5 18 L7 25" stroke="#d4a030" strokeWidth="1.8" strokeLinecap="round"/>
      </g>

      {/* === FAIRY 1 (left, green-gold, floating) === */}
      <g className="dg-f1">
        <g transform="translate(86, 62)">
          <circle cx="0" cy="0" r="17" fill="url(#dg-fg1)" className="dg-gw" style={{"--d":"2.2s","--dl":"0s"}}/>
          {/* Wings */}
          <ellipse cx="-12" cy="-4" rx="11" ry="5.5" fill="#bbf7d0" opacity="0.58" transform="rotate(-28,-12,-4)"/>
          <ellipse cx="12" cy="-4" rx="11" ry="5.5" fill="#bbf7d0" opacity="0.58" transform="rotate(28,12,-4)"/>
          <ellipse cx="-9" cy="5" rx="8" ry="4.5" fill="#bbf7d0" opacity="0.44" transform="rotate(22,-9,5)"/>
          <ellipse cx="9" cy="5" rx="8" ry="4.5" fill="#bbf7d0" opacity="0.44" transform="rotate(-22,9,5)"/>
          <path d="M0 -2 Q-7 -5 -12 -4" fill="none" stroke="#86efac" strokeWidth="0.7" opacity="0.5"/>
          <path d="M0 -2 Q7 -5 12 -4" fill="none" stroke="#86efac" strokeWidth="0.7" opacity="0.5"/>
          {/* Dress */}
          <path d="M-3.5 2 Q0 9 3.5 2 Q2 12 0 14 Q-2 12 -3.5 2Z" fill="#a7f3d0"/>
          <ellipse cx="0" cy="1" rx="3.5" ry="4.5" fill="#d1fae5"/>
          {/* Head */}
          <circle cx="0" cy="-6.5" r="5.5" fill="#fcd7aa"/>
          {/* Hair */}
          <path d="M-5.5 -8.5 Q0 -15 5.5 -8.5 Q3 -12 0 -12 Q-3 -12 -5.5 -8.5Z" fill="#fde68a"/>
          <path d="M-5.5 -9 Q-7 -5 -5 -1" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Eyes */}
          <circle cx="-1.8" cy="-6.5" r="1.3" fill="#2a1808"/>
          <circle cx="1.8" cy="-6.5" r="1.3" fill="#2a1808"/>
          <circle cx="-1.3" cy="-7" r="0.4" fill="white"/>
          <circle cx="2.3" cy="-7" r="0.4" fill="white"/>
          {/* Smile */}
          <path d="M-1.5 -4.5 Q0 -3 1.5 -4.5" fill="none" stroke="#c07858" strokeWidth="0.8" strokeLinecap="round"/>
          {/* Wand */}
          <line x1="4.5" y1="1" x2="17" y2="-12" stroke="#fde68a" strokeWidth="1.3" strokeLinecap="round"/>
          <circle cx="17" cy="-12" r="3.5" fill="#fde068" className="dg-sp" style={{"--d":"1.3s","--dl":"0s"}}/>
          <path d="M14.5 -14.5 L17 -9 L19.5 -14.5 L17 -17Z" fill="#fde068" opacity="0.7"/>
          {/* Sparkle trail */}
          <circle cx="24" cy="-17" r="2" fill="#86efac" className="dg-sp" style={{"--d":"1.6s","--dl":"0.2s"}}/>
          <circle cx="29" cy="-11" r="1.5" fill="#fde068" className="dg-sp" style={{"--d":"1.6s","--dl":"0.55s"}}/>
          <circle cx="26" cy="-4" r="1.2" fill="#86efac" className="dg-sp" style={{"--d":"1.6s","--dl":"0.9s"}}/>
          <circle cx="20" cy="-2" r="1" fill="#fde068" className="dg-sp" style={{"--d":"1.6s","--dl":"1.2s"}}/>
        </g>
      </g>

      {/* === FAIRY 2 (right, purple, floating) === */}
      <g className="dg-f2">
        <g transform="translate(309, 44)">
          <circle cx="0" cy="0" r="15" fill="url(#dg-fg2)" className="dg-gw" style={{"--d":"2.5s","--dl":"0.9s"}}/>
          {/* Wings */}
          <ellipse cx="-11" cy="-4" rx="10" ry="5" fill="#f5d0fe" opacity="0.58" transform="rotate(-22,-11,-4)"/>
          <ellipse cx="11" cy="-4" rx="10" ry="5" fill="#f5d0fe" opacity="0.58" transform="rotate(22,11,-4)"/>
          <ellipse cx="-8.5" cy="4.5" rx="7.5" ry="4" fill="#f5d0fe" opacity="0.44" transform="rotate(22,-8.5,4.5)"/>
          <ellipse cx="8.5" cy="4.5" rx="7.5" ry="4" fill="#f5d0fe" opacity="0.44" transform="rotate(-22,8.5,4.5)"/>
          {/* Dress */}
          <path d="M-3 2.5 Q0 9 3 2.5 Q1.5 12 0 13 Q-1.5 12 -3 2.5Z" fill="#e879f9" opacity="0.8"/>
          <ellipse cx="0" cy="1.5" rx="3.2" ry="4.2" fill="#fae8ff"/>
          {/* Head */}
          <circle cx="0" cy="-6" r="5" fill="#fcd7aa"/>
          {/* Hair */}
          <path d="M-5 -8 Q0 -13 5 -8 Q3 -11 0 -11 Q-3 -11 -5 -8Z" fill="#8b1a8b"/>
          <path d="M-5 -8.5 Q-7.5 -4 -5.5 0" fill="none" stroke="#7a1570" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Eyes */}
          <circle cx="-1.8" cy="-6" r="1.2" fill="#2a1808"/>
          <circle cx="1.8" cy="-6" r="1.2" fill="#2a1808"/>
          {/* Wand pointing left */}
          <line x1="-4.5" y1="1.5" x2="-17" y2="-9" stroke="#fde68a" strokeWidth="1.3" strokeLinecap="round"/>
          <circle cx="-17" cy="-9" r="3.5" fill="#e879f9" className="dg-sp" style={{"--d":"1.4s","--dl":"0.35s"}}/>
          <path d="M-14.5 -11.5 L-17 -6 L-19.5 -11.5 L-17 -14Z" fill="#e879f9" opacity="0.7"/>
          {/* Sparkle trail */}
          <circle cx="-24" cy="-7" r="1.8" fill="#f5d0fe" className="dg-sp" style={{"--d":"1.6s","--dl":"0.65s"}}/>
          <circle cx="-22" cy="-15" r="1.3" fill="#e879f9" className="dg-sp" style={{"--d":"1.6s","--dl":"1s"}}/>
          <circle cx="-28" cy="-13" r="1" fill="#f5d0fe" className="dg-sp" style={{"--d":"1.6s","--dl":"1.35s"}}/>
        </g>
      </g>

      {/* === BUNNY (right of bed, bobbing) === */}
      <g className="dg-bb" style={{"--d":"4.8s","--dl":"0.7s"}} transform="translate(330, 162)">
        {/* Body */}
        <ellipse cx="0" cy="0" rx="13" ry="11" fill="#e8e2da"/>
        {/* Cotton tail */}
        <circle cx="11" cy="2" r="4.5" fill="white" opacity="0.9"/>
        {/* Belly */}
        <ellipse cx="-1" cy="3" rx="8" ry="7" fill="#f5f0ec"/>
        {/* Head */}
        <circle cx="-2" cy="-14" r="10.5" fill="#e8e2da"/>
        {/* Ears */}
        <ellipse cx="-7.5" cy="-26" rx="3.5" ry="9.5" fill="#e8e2da"/>
        <ellipse cx="-7.5" cy="-26" rx="1.8" ry="7.5" fill="#f8c0cc" opacity="0.65"/>
        <ellipse cx="3.5" cy="-27" rx="3.5" ry="10" fill="#e8e2da"/>
        <ellipse cx="3.5" cy="-27" rx="1.8" ry="8" fill="#f8c0cc" opacity="0.65"/>
        {/* Eyes */}
        <circle cx="-6" cy="-15" r="2.8" fill="#f08090"/>
        <circle cx="-6" cy="-15" r="1.7" fill="#2a0a0a"/>
        <circle cx="-5.2" cy="-15.7" r="0.6" fill="white"/>
        <circle cx="2" cy="-15" r="2.8" fill="#f08090"/>
        <circle cx="2" cy="-15" r="1.7" fill="#2a0a0a"/>
        <circle cx="2.8" cy="-15.7" r="0.6" fill="white"/>
        {/* Nose */}
        <ellipse cx="-2" cy="-10.5" rx="1.6" ry="1.1" fill="#f080a0"/>
        {/* Mouth */}
        <path d="M-2 -9.5 Q-4.5 -7.5 -5.5 -8.5" fill="none" stroke="#c87898" strokeWidth="0.9" strokeLinecap="round"/>
        <path d="M-2 -9.5 Q0.5 -7.5 1.5 -8.5" fill="none" stroke="#c87898" strokeWidth="0.9" strokeLinecap="round"/>
        {/* Whiskers */}
        <line x1="-10" y1="-12" x2="-4" y2="-11.5" stroke="#c0b0a8" strokeWidth="0.8" opacity="0.65"/>
        <line x1="-10" y1="-10.5" x2="-4" y2="-10.5" stroke="#c0b0a8" strokeWidth="0.8" opacity="0.65"/>
        <line x1="2" y1="-11.5" x2="8" y2="-12" stroke="#c0b0a8" strokeWidth="0.8" opacity="0.65"/>
        <line x1="2" y1="-10.5" x2="8" y2="-10" stroke="#c0b0a8" strokeWidth="0.8" opacity="0.65"/>
        {/* Paws */}
        <ellipse cx="-8" cy="9" rx="5.5" ry="3.5" fill="#e8e2da"/>
        <ellipse cx="7" cy="9.5" rx="5.5" ry="3.5" fill="#e8e2da"/>
      </g>

      {/* === MUSHROOMS (left ground) === */}
      <g transform="translate(107, 171)">
        <rect x="-3" y="-9" width="6" height="11" rx="1.5" fill="#d4c0a0"/>
        <ellipse cx="0" cy="-10" rx="11" ry="5.5" fill="#c03030"/>
        <circle cx="-4.5" cy="-11" r="2" fill="white" opacity="0.8"/>
        <circle cx="1" cy="-13" r="1.5" fill="white" opacity="0.8"/>
        <circle cx="5.5" cy="-11" r="1.8" fill="white" opacity="0.8"/>
      </g>
      <g transform="translate(122, 175)">
        <rect x="-2" y="-7" width="4" height="9" rx="1" fill="#c8b090"/>
        <ellipse cx="0" cy="-7.5" rx="7" ry="4" fill="#e04040"/>
        <circle cx="-3" cy="-8.5" r="1.3" fill="white" opacity="0.75"/>
        <circle cx="2" cy="-9.5" r="1" fill="white" opacity="0.75"/>
      </g>

      {/* === FLOATING SPARKLES throughout scene === */}
      {DG_SPARKS.map(([x,y,c,r,d,dl],i) => (
        <circle key={`sp${i}`} cx={x} cy={y} r={r} fill={c} className="dg-sp" style={{"--d":d,"--dl":dl}}/>
      ))}

      {/* Vignette */}
      <rect width="400" height="190" fill="url(#dg-vig)"/>
    </svg>
  </div>
);

const ClassifySelect = ({value,onChange,className,style}) => (
  <select className={className||"char-cls-sel"} style={style} value={value} onChange={onChange}>
    <option value="">— Species / role —</option>
    {CLASSIFY_GROUPS.map(g => (
      <optgroup key={g.group} label={g.group}>
        {g.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </optgroup>
    ))}
  </select>
);

const MiniGenderPills = ({value,onChange}) => (
  <div className="mini-gpills">
    {[{v:"",l:"Any"},{v:"girl",l:"👧 Girl"},{v:"boy",l:"👦 Boy"}].map(o => (
      <button key={o.v} className={`mgp${value===o.v?" on":""}`} onClick={()=>onChange(o.v)}>{o.l}</button>
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function SleepSeed() {
  const [stage,          setStage]          = useState("home");
  const [heroName,       setHeroName]       = useState("");
  const [heroGender,     setHeroGender]     = useState("");
  const [heroClassify,   setHeroClassify]   = useState("");
  const [theme,          setTheme]          = useState(THEMES[0]);
  const [extraChars,     setExtraChars]     = useState([]);
  const [occasion,       setOccasion]       = useState("");
  const [occasionCustom, setOccasionCustom] = useState("");
  const [lesson,         setLesson]         = useState("");
  const [adventure,      setAdventure]      = useState(false);
  const [storyLen,       setStoryLen]       = useState("standard");
  const [ageGroup,       setAgeGroup]       = useState("age5");
  const [storyGuidance,  setStoryGuidance]  = useState("");
  const [customize,      setCustomize]      = useState(false);
  const [error,          setError]          = useState("");
  const [book,           setBook]           = useState(null);
  const [pageIdx,        setPageIdx]        = useState(0);
  const [chosenPath,     setChosenPath]     = useState(null);
  const [fromCache,      setFromCache]      = useState(false);
  const [gen,            setGen]            = useState({stepIdx:0,progress:0,label:"",dots:[]});
  const [isReading,      setIsReading]      = useState(false);
  const [autoOn,         setAutoOn]         = useState(false);
  const [autoPct,        setAutoPct]        = useState(0);
  const [sparkles,       setSparkles]       = useState([]);
  const [cachedChars,    setCachedChars]    = useState({});
  const [imgLoaded,      setImgLoaded]      = useState({});
  const [memories,       setMemories]       = useState([]);
  const [ambientOn,      setAmbientOn]      = useState(true);
  const [sfxOn,          setSfxOn]          = useState(true);
  const [showSoundCtrl,  setShowSoundCtrl]  = useState(false);
  const [voiceId,        setVoiceId]        = useState(NARRATOR_VOICE_ID||null); // EL voice
  const [vcStage,        setVcStage]        = useState("idle"); // idle|recording|uploading|ready|error
  const [vcError,        setVcError]        = useState("");
  const [showVcModal,    setShowVcModal]    = useState(false);

  const autoTimer     = useRef(null);
  const autoStart     = useRef(null);
  const totalPagesRef = useRef(0);
  const fileRefs      = useRef({});
  const autoReadRef   = useRef(false);
  const goPageRef     = useRef(null);
  const audioSessionRef = useRef(false);  // tracks active read-aloud session
  const pageTotalRef    = useRef(1);      // updated per render for SleepAudio
  const elAudioRef      = useRef(null);   // current ElevenLabs Audio element
  const AUTO_MS       = 10000;

  const imgReady = (url) => !!imgLoaded[strHash(url)];

  const preload = useCallback((url) => {
    if(!url) return;
    const h = strHash(url);
    preloadImg(url,
      () => setImgLoaded(p => ({...p,[h]:true})),
      () => setImgLoaded(p => ({...p,[h]:"e"})),
    );
  },[]);

  useEffect(() => {
    sGet("memories").then(s => { if(s?.items) setMemories(s.items); });
    sGet("voice_id").then(s => { if(s?.id) setVoiceId(s.id); else if(NARRATOR_VOICE_ID) setVoiceId(NARRATOR_VOICE_ID); });
  },[]);

  useEffect(() => { SleepAudio.setAmbient(ambientOn); },[ambientOn]);
  useEffect(() => { SleepAudio.setSFX(sfxOn); },[sfxOn]);

  useEffect(() => {
    if("speechSynthesis" in window) window.speechSynthesis.cancel();
    if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current = null; }
    if(autoReadRef.current && isStoryPage) {
      const total = pageTotalRef.current || 1;
      const progress = total > 1 ? pageIdx / (total-1) : 0.5;
      if(voiceId) {
        speakTextEL(getCurrentPageText(), progress);
      } else {
        speakText(getCurrentPageText(), progress);
      }
    } else {
      autoReadRef.current = false;
      setIsReading(false);
    }
  },[pageIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearInterval(autoTimer.current);
    if(!autoOn){ setAutoPct(0); return; }
    autoStart.current = Date.now();
    autoTimer.current = setInterval(() => {
      const pct = Math.min(100,((Date.now()-autoStart.current)/AUTO_MS)*100);
      setAutoPct(pct);
      if(pct>=100){
        autoStart.current = Date.now();
        setAutoPct(0);
        setPageIdx(p => {
          if(p>=totalPagesRef.current-1){ setAutoOn(false); return p; }
          return p+1;
        });
      }
    },120);
    return () => clearInterval(autoTimer.current);
  },[autoOn]);

  const speakText = useCallback((text, pageProgress=0.5) => {
    if(!("speechSynthesis" in window)||!text) return;
    window.speechSynthesis.cancel();

    const CALMING_VOICES = [
      "Samantha","Ava","Allison","Victoria","Karen","Moira","Tessa","Fiona",
      "Aria","Jenny","Michelle","Elizabeth","Clara","Zira",
      "Google UK English Female","Google US English",
    ];

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      for(const name of CALMING_VOICES){
        const v = voices.find(v => v.name.includes(name));
        if(v) return v;
      }
      return voices.find(v => v.lang.startsWith("en") && /female|woman|girl/i.test(v.name))
        || voices.find(v => v.lang.startsWith("en"))
        || null;
    };

    const speak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      // Sleepification: speech slows on final pages
      utt.rate   = SleepAudio.getSpeechRate(pageProgress);
      utt.pitch  = 0.95;
      utt.volume = 1.0;
      const voice = pickVoice();
      if(voice) utt.voice = voice;

      // Notify audio engine: duck ambient + schedule SFX
      SleepAudio.onSpeechStart(text, pageProgress);

      // Refrain chime — play just before speech
      if(book?.refrain && SleepAudio.checkRefrain(text, book.refrain)) {
        SleepAudio.playRefrainChime();
      }

      utt.onend = () => {
        const isLast = pageProgress >= 0.98;
        const pause = SleepAudio.getPostPagePause(pageProgress);
        SleepAudio.onSpeechEnd(isLast, pageProgress > 0.65);

        if(autoReadRef.current) {
          if(isLast) {
            // Final page — play outro then end
            SleepAudio.endSession(true);
            audioSessionRef.current = false;
            autoReadRef.current = false;
            setIsReading(false);
          } else {
            // Post-page pause before turning
            setTimeout(() => goPageRef.current?.(1), pause);
          }
        } else {
          setIsReading(false);
        }
      };
      utt.onerror = () => {
        autoReadRef.current = false;
        audioSessionRef.current = false;
        setIsReading(false);
      };
      setIsReading(true);
      window.speechSynthesis.speak(utt);
    };

    const voices = window.speechSynthesis.getVoices();
    if(voices.length > 0) {
      speak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speak();
      };
    }
  },[book]);

  // ── ElevenLabs-powered speakText (falls back to Web Speech if no voiceId) ─
  const speakTextEL = useCallback(async (text, pageProgress=0.5) => {
    if(!text) return;
    // Stop any playing EL audio
    if(elAudioRef.current) { elAudioRef.current.pause(); elAudioRef.current = null; }

    const rate = SleepAudio.getSpeechRate(pageProgress);
    SleepAudio.onSpeechStart(text, pageProgress);
    if(book?.refrain && SleepAudio.checkRefrain(text, book.refrain)) SleepAudio.playRefrainChime();

    const onEnd = () => {
      const isLast = pageProgress >= 0.98;
      const pause  = SleepAudio.getPostPagePause(pageProgress);
      SleepAudio.onSpeechEnd(isLast, pageProgress > 0.65);
      if(autoReadRef.current) {
        if(isLast) {
          SleepAudio.endSession(true);
          audioSessionRef.current = false;
          autoReadRef.current = false;
          setIsReading(false);
        } else {
          setTimeout(() => goPageRef.current?.(1), pause);
        }
      } else {
        setIsReading(false);
      }
    };

    setIsReading(true);
    try {
      const url = await elTTS(text, voiceId, rate);
      const audio = new Audio(url);
      elAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); elAudioRef.current = null; onEnd(); };
      audio.onerror = () => { URL.revokeObjectURL(url); elAudioRef.current = null; onEnd(); };
      await audio.play();
    } catch(err) {
      console.error("EL TTS error:", err);
      // Fall back to Web Speech
      onEnd();
    }
  }, [voiceId, book]);

  const toggleRead = useCallback((text, pageProgress=0.5) => {
    if(isReading){
      window.speechSynthesis.cancel();
      if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current = null; }
      autoReadRef.current = false;
      audioSessionRef.current = false;
      SleepAudio.endSession(false);
      setIsReading(false);
    } else {
      autoReadRef.current = true;
      audioSessionRef.current = true;
      // Story-start ceremony: intro chime → brief pause → speak
      SleepAudio.startSession(theme?.label || "", () => {
        if(voiceId) {
          speakTextEL(text, pageProgress);
        } else {
          speakText(text, pageProgress);
        }
      });
    }
  },[isReading, speakText, speakTextEL, voiceId, theme]);

  // ── Voice Clone: paste Voice ID from elevenlabs.io ─────────────────────
  const [vcIdInput, setVcIdInput] = useState("");

  const saveVoiceId = async () => {
    const id = vcIdInput.trim();
    if(!id) { setVcError("Please paste your Voice ID first."); return; }
    setVoiceId(id);
    await sSet("voice_id", { id });
    setVcStage("ready");
    setVcError("");
  };

  const resetVoice = async () => {
    await sDel("voice_id");
    setVoiceId(null);
    setVcIdInput("");
    setVcStage("idle");
    setVcError("");
  };

  const addSparkle = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = uid();
    setSparkles(s => [...s,{id,x:e.clientX-rect.left,y:e.clientY-rect.top}]);
    setTimeout(() => setSparkles(s => s.filter(sp => sp.id!==id)),700);
  },[]);

  const newChar = () => ({id:uid(),type:"friend",name:"",photo:null,classify:"",gender:""});
  const addExtraChar    = () => setExtraChars(cs => cs.length<4 ? [...cs,newChar()] : cs);
  const removeExtraChar = (id) => setExtraChars(cs => cs.filter(c => c.id!==id));
  const updateExtraChar = (id,patch) => setExtraChars(cs => cs.map(c => c.id===id ? {...c,...patch} : c));

  const pickPhoto = (charId) => {
    if(!fileRefs.current[charId]) fileRefs.current[charId] = document.createElement("input");
    const inp = fileRefs.current[charId];
    inp.type = "file"; inp.accept = "image/*";
    inp.onchange = async (e) => {
      const file = e.target.files[0]; if(!file) return;
      try { const photo = await compressImage(file); updateExtraChar(charId,{photo}); } catch(_) {}
    };
    inp.click();
  };

  const saveMemory = useCallback(async (bookData) => {
    const occ = occasion==="other" ? occasionCustom : occasion;
    const entry = {id:uid(),title:bookData.title,heroName:bookData.heroName,
      date:new Date().toISOString().split("T")[0],occasion:occ,bookData};
    const next = [entry,...memories];
    setMemories(next);
    await sSet("memories",{items:next});
  },[memories,occasion,occasionCustom]);

  const deleteMemory = useCallback(async (id) => {
    const next = memories.filter(m => m.id!==id);
    setMemories(next);
    await sSet("memories",{items:next});
  },[memories]);

  /* ══ GENERATE ══ */
  const generate = async () => {
    setError(""); setStage("generating"); setFromCache(false); setChosenPath(null);
    const name = heroName.trim();
    const seed = makeStorySeed(name,theme,extraChars,occasion,occasionCustom,lesson,adventure,storyLen,heroGender,heroClassify,storyGuidance);
    const bKey = `book_${seed}`;
    const mk = (n,st="p") => Array.from({length:n},()=>st);

    setGen({stepIdx:0,progress:6,label:"Checking story memory…",dots:[]});

    try {
      const cached = await sGet(bKey);
      if(cached?.title){
        setGen(g => ({...g,stepIdx:3,progress:88,label:"Opening your book…"}));
        const pages = cached.pages||[...(cached.setup_pages||[]),...(cached.path_a||[]),...(cached.path_b||[])];
        const allUrls = [cached.coverUrl,...pages.map(p=>p.imgUrl)];
        const dots = mk(allUrls.length,"p");
        setGen(g => ({...g,dots:[...dots]}));
        allUrls.forEach((url,i) => preloadImg(url,
          () => { dots[i]="d"; setGen(g=>({...g,dots:[...dots]})); setImgLoaded(p=>({...p,[strHash(url)]:true})); },
          () => { dots[i]="d"; setGen(g=>({...g,dots:[...dots]})); }
        ));
        setBook(cached); setPageIdx(0); setFromCache(true);
        await new Promise(r => setTimeout(r,180));
        setStage("book");
        return;
      }

      const allChars = [
        {id:"hero",name,type:"hero",photo:null,classify:heroClassify,gender:heroGender},
        ...extraChars,
      ];

      const visualDescs = {};
      for(const c of allChars.filter(c => c.photo)){
        const fp = photoFP(c.photo.b64);
        const hit = cachedChars[fp] || await sGet(`char_${fp}`);
        if(hit){ visualDescs[c.id]=hit.description; continue; }
        try {
          const raw = await callClaude([{role:"user",content:[
            {type:"text",text:`Describe this character for a children's picture book in one sentence. Return ONLY: {"desc":"..."}`},
            {type:"image",source:{type:"base64",media_type:"image/jpeg",data:c.photo.b64}},
          ]}],"",300);
          const parsed = extractJSON(raw);
          const desc = parsed.desc||"";
          visualDescs[c.id] = desc;
          if(fp){ await sSet(`char_${fp}`,{description:desc}); setCachedChars(p=>({...p,[fp]:{description:desc}})); }
        } catch(_) {}
      }

      // Per-classify voice/behaviour seeds so the model writes distinct characters
      const classifyVoice = {
        // Family — written at child-register, warm and recognisable
        mother:"gives warm cuddles and says things like 'I knew you could do it!' — always the safest person in the room",
        father:"does silly voices, laughs at his own jokes, and is surprisingly good in a tricky situation",
        grandma:"always has biscuits, hums little songs, and says wise things that sound like magic",
        grandpa:"tells stories with sound effects, falls asleep in his chair, and wakes up at exactly the right moment",
        "older brother":"acts like everything is fine but secretly makes sure the little one is okay",
        "older sister":"knows all the best hiding spots and has a plan for absolutely everything",
        "younger brother":"asks 'why?' every five seconds and accidentally saves the day",
        "younger sister":"small but very, very loud, and always the first to try something brave",
        baby:"says one word at a time but always the funniest possible word",
        aunt:"brings the most exciting presents and says yes to almost everything",
        uncle:"slightly ridiculous, very lovable, always in the middle of some project that probably won't work",
        cousin:"best adventure partner; terrible at keeping secrets; excellent at having fun",
        // Roles
        wizard:"says things backwards by mistake and has a hat that's slightly too big",
        witch:"cackles when happy; her spells always work but never quite the way she planned",
        "fairy godmother":"very cheerful, a little bit clumsy, absolutely certain everything will work out beautifully",
        knight:"very polite, very brave, very confused by anything that isn't a dragon",
        princess:"doesn't wait to be rescued — she's too busy solving the problem herself",
        prince:"tries extremely hard, gets things slightly wrong, and has a lovely time anyway",
        teacher:"turns everything into an interesting question and gets excited when someone finds the answer",
        shopkeeper:"knows where everything is, remembers everyone's favourite things, and gives good advice",
        // Animals — funny, warm, child-level personality
        bear:"big and slow and cuddly; loves honey; gives the best hugs in the forest",
        bunny:"very fast, very fluffy, slightly worried about everything, incredibly brave when it matters",
        cat:"absolutely certain she is in charge; possibly right; extremely soft",
        dog:"SO HAPPY to be here; tail wagging so hard the whole room shakes",
        dragon:"big and warm like a fireplace; sneezes glitter; thinks naps are the most important thing",
        elephant:"remembers everything, never gets lost, and is very good at carrying things (and friends)",
        fox:"quick and clever and kind; always has a good idea; never shows off about it",
        frog:"says 'RIBBIT' at important moments; jumps first and asks questions later; surprisingly wise",
        lion:"very dignified; pretends not to be pleased when you scratch behind his ears; always pleased",
        monkey:"bouncing off everything; talks very fast; somehow makes everything better by accident",
        owl:"says 'Hm' a lot; knows the answer before anyone asks; pretends this is normal",
        penguin:"very smart, very formal, falls over on the ice, gets right back up with enormous dignity",
        rabbit:"wiggly nose, long ears, gentle voice, and unexpectedly very good at solving problems",
        tiger:"prowls around looking impressive; secretly just wants someone to play with",
        turtle:"slowest in the race but always has the best snacks and the best stories",
        unicorn:"leaves little sparkling hoofprints; very modest about being magical; excellent at compliments",
        wolf:"howls at good news not just the moon; fluffiest tail; fiercely loyal to friends",
      };

      const charCtx = allChars.map(c => {
        const desc = visualDescs[c.id] ? ` — appearance: ${visualDescs[c.id]}` : "";
        const cls = c.classify ? `, a ${c.classify}` : "";
        const pro = pronouns(c.gender);
        const proStr = pro ? ` (${pro})` : "";
        const voice = c.classify && classifyVoice[c.classify] ? `\n  Voice/manner: ${classifyVoice[c.classify]}` : "";
        const typeLabel = c.type==="hero" ? "the hero — the child this story belongs to"
          : c.type==="parent" ? "parent/family member"
          : c.type==="pet" ? "beloved pet"
          : c.type==="toy" ? "beloved toy that comes alive in this world"
          : "friend and companion";
        return `• ${c.name||capitalize(c.type)}: ${typeLabel}${cls}${proStr}${desc}${voice}`;
      }).join("\n");

      const charVisual = allChars.map(c =>
        `${c.name||c.type}${visualDescs[c.id]?`(${visualDescs[c.id]})`:c.classify?`(${c.classify})`:""}`
      ).join(", ");

      const occasionFinal = occasion==="other" ? occasionCustom.trim() : (occasion||"");
      const occLine  = occasionFinal ? `\nSPECIAL OCCASION: ${occasionFinal}` : "";
      const lesLine  = lesson ? `\nLESSON (show through action only, never state as moral): ${lesson}` : "";
      const guidanceSafe = storyGuidance.trim().slice(0, 300).replace(/[\u201C\u201D""]/g, '"');
      const guidLine = guidanceSafe ? `\nSTORY GUIDANCE — highest priority, incorporate naturally:\n${guidanceSafe}` : "";
      const ageCfg = AGES.find(a=>a.value===ageGroup)||AGES[1];
      const ageLine = ageCfg.prompt;

      setGen(g => ({...g,stepIdx:1,progress:26,label:"Writing tonight's story…"}));

      const lenCfg = LENGTHS.find(l=>l.value===storyLen)||LENGTHS[1];
      // For adventure mode: split target into setup/resolution
      const setupN = lenCfg.advSetup;
      const resN   = lenCfg.advRes;
      const totalN = lenCfg.target;

      // ── Story arc guidance ────────────────────────────────────────────────
      const buildArc = (n) => {
        return `STORY STRUCTURE GUIDANCE (target ~${n} pages — write more if the story needs it):

This is not a rigid page-by-page script. It is a shape to aim for. The story is always the priority.

OPENING (pages 1–2): Drop ${name} into something surprising, funny, or wonderful IMMEDIATELY. No setup. No describing the world. Something HAPPENS. Use a sound word. End page 1 with something that makes it impossible not to turn the page.

EARLY PAGES: Establish the problem, mystery, or adventure. Characters reveal their personalities through what they SAY and DO — especially through funny mistakes, wrong guesses, and terrible plans that almost work. The refrain appears naturally for the first time.

MIDDLE PAGES: The adventure deepens. Use your chosen structure — Rule of Three, Running Joke, Cumulative Build, or Small Hero Wins. Each page should feel different in energy from the last. At least one character should say something hilarious, brave, or unexpectedly wise. ${name} makes real choices. Sound words on at least 3 pages.

NEAR THE END: The big moment. The twist, the payoff, the surprise that recontextualises everything. If you've been building a running joke — this is where it pays off gloriously. If you've been using Rule of Three — this is the third attempt that succeeds in an unexpected way. The refrain returns.

FINAL PAGES (last 2–3): The world gets quieter and softer. Characters yawn. Lights dim. Voices drop to whispers. The last page echoes something from page 1 — a word, an image, a sound — making the story feel beautifully circular and complete. End with a long, slow, warm sentence that carries ${name} all the way to sleep.`;
      };

      // ── JSON schema ────────────────────────────────────────────────────────
      // Page schema: allow variable-weight pages for real picture-book feel
      const pgSchema = (n) => Array.from({length:n},()=>(
        '{"text":"Write the RIGHT amount for this page — not a fixed word count. Big moment pages can be 1-2 SHORT punchy sentences. Journey pages can be 3-5 sentences. Dialogue pages can be almost entirely speech. Quiet sleep pages should be slow and drifting. Every page must feel distinct in rhythm and energy from the pages before and after it. Prioritise storytelling over length targets.","illustration_prompt":"one warm playful moment under 30 words, name every visible character, bright cosy mood"}'
      )).join(",");

      const simpleSchema = `{"title":"A brilliant 3-6 word title a child would beg to hear again — specific, funny, or intriguing (e.g. 'The Dragon Who Sneezed Stars' or '${name} and the Very Wobbly Cake')","cover_prompt":"wide warm magical scene, all characters visible, bright cosy colours, child-friendly and full of energy","refrain":"a short bouncy phrase (4-8 words) that will recur 2-3 times and that a child will whisper along to on the third reading","pages":[${pgSchema(totalN)}]}`;
      const advSchema    = `{"title":"A brilliant 3-6 word title a child would beg to hear again — specific, funny, or intriguing (e.g. 'The Dragon Who Sneezed Stars' or '${name} and the Very Wobbly Cake')","cover_prompt":"wide warm magical scene, all characters visible, bright cosy colours, child-friendly and full of energy","refrain":"a short bouncy phrase (4-8 words) that will recur 2-3 times and that a child will whisper along to on the third reading","setup_pages":[${pgSchema(setupN)}],"choice":{"question":"What does ${name} do next?","option_a_label":"4-7 fun exciting words","option_b_label":"4-7 fun exciting words"},"path_a":[${pgSchema(resN)}],"path_b":[${pgSchema(resN)}]}`;

      // ── Master story prompt ───────────────────────────────────────────────
      const storyPrompt = `You are writing a children's picture book that will be read aloud at bedtime. Your models are Roald Dahl, Julia Donaldson, Mo Willems, Eric Carle, and A.A. Milne. Every page must feel like it belongs in a book a child could buy at a bookstore and memorise by the third reading.

THE PRIME DIRECTIVE: The story is ALWAYS the priority. Page count is a target, not a ceiling. Write as many pages as the story needs to be truly wonderful. All other rules exist to serve the story — if breaking a rule makes the story better, break it. The only rule that cannot be broken is writing at the correct age level.

━━━ READER AGE ━━━
${ageLine}

━━━ WHAT GREAT PICTURE BOOK WRITING LOOKS AND SOUNDS LIKE ━━━

GOOD (this is the target — notice the short punchy lines, the sound word, the silly dialogue, the page-turn hook):
${name} knocked on the biggest tree in the forest.
KNOCK. KNOCK. KNOCK.
Nothing happened.
"Hmm," said ${name}.
Then the tree sneezed so hard that seventeen birds flew out of its branches.

BAD (do NOT write like this — adult prose with a child's name in it):
"${name} pressed both palms against the ancient bark, rough as weathered stone. Deep within the roots, something stirred with the slow patience of centuries."

The difference: SHORT lines. SOUND WORDS. SILLY unexpected things. A reason to turn the page. Characters who say funny things.

━━━ THE SIX TECHNIQUES THAT MAKE CHILDREN MEMORISE BOOKS ━━━

1. REPETITION: A phrase, image, or pattern that recurs — and gets funnier or warmer each time.
   Example: "Oh no," said the dragon. / "Oh no," said ${name}. / "Oh no," said EVERYONE.

2. SOUND WORDS: At least 3 per story. WHOOSH. SPLAT. BOING. KERPLUNK. CRASH. SQUELCH.
   These are what children repeat to each other the next day.

3. EXAGGERATION: Not "it was big" — "it was SO ENORMOUSLY, RIDICULOUSLY big that a family of hedgehogs had moved into its left nostril."

4. DIALOGUE CARRIES THE STORY: Characters say the wrong thing, the funny thing, the brave thing. Minimum one line of dialogue per page. Let characters argue, misunderstand, and be confidently wrong about things.

5. THE SURPRISE / TWIST: The ending recontextualises something from page 1. The child goes "OH!" and immediately asks to read it again. Plant the seed early; deliver the payoff at the end.

6. CHARACTERS ARE WRONG: The best children's book characters are confidently, hilariously wrong about something important. That wrongness drives the plot. The moment they realise they're wrong — or succeed despite being wrong — is the heart of the story.

━━━ CHARACTERS ━━━
${charCtx}

━━━ WORLD, OCCASION, AND CONTEXT ━━━
Build the story FROM this world — use its specific details, characters, and story hooks. The world is not a backdrop; it is where the story lives.
${theme.value}${occLine}${lesLine}${guidLine}

━━━ STORY CRAFT ━━━

PAGE RHYTHM — vary this on EVERY page:
• Explosive pages: 1–2 very short punchy lines. Something just happened.
• Journey pages: 3–5 sentences. The adventure unfolds.
• Dialogue pages: Almost entirely speech. Characters reveal themselves.
• Quiet pages: Near the end only. One slow, drifting sentence.
• Never write two pages in a row with the same rhythm or energy.

THE REFRAIN: A 4-8 word bouncy phrase that recurs naturally 2–3 times. It should feel like a song the child will sing along to. Write it as the "refrain" field in the JSON.

THE CIRCULAR ENDING: The last page must echo something specific from page 1 — a word, an image, a sound — so the story feels complete and round. After the last page, the child should feel deeply safe and ready for sleep.

SLEEPING DOWN: On the last 2-3 pages, the world must grow gradually quieter — yawns appear, lights soften, voices drop to whispers, movement slows. This is not an afterthought; it is the most important part of a bedtime story.

WHAT TO NEVER DO:
• Never use adult literary language or metaphors
• Never state a lesson — let it live only in what happens
• Never use a word the target age child wouldn't know
• Never write two consecutive sentences the same length
• Never make the story feel dark, ominous, or unsafe
• Never make ${name} a passive observer — they drive the story

━━━ STORY ARC ━━━
${adventure
  ? `CHOOSE-YOUR-ADVENTURE FORMAT:\nWrite ${setupN} setup pages, then a choice moment, then ${resN} resolution pages per path. Both paths end with ${name} safely, warmly asleep.\n\n${buildArc(setupN)}`
  : buildArc(totalN)}

━━━ OUTPUT ━━━
Return ONLY this exact JSON object. No extra text, no markdown, no explanation:
${adventure ? advSchema : simpleSchema}`;

      const raw = await callClaude(
        [{role:"user",content:storyPrompt}],
        "You are writing a children's picture book in the tradition of Roald Dahl, Julia Donaldson, and Mo Willems. The story is ALWAYS the priority — write as many pages as needed. Return ONLY a valid JSON object with no markdown, no explanation, no text outside the JSON. The story must feel like it could be published and sold in a children's bookstore.",
        12000
      );

      const story = extractJSON(raw);

      if(!story.title) throw new Error("Response missing title");
      if(!adventure && (!Array.isArray(story.pages)||story.pages.length===0)) throw new Error("Response missing pages array");
      if(adventure && (!Array.isArray(story.setup_pages)||!Array.isArray(story.path_a)||!Array.isArray(story.path_b))) throw new Error("Response missing adventure paths");

      setGen(g => ({...g,stepIdx:2,progress:65,label:"Painting the illustrations…"}));

      const coverUrl = illoUrl(`${story.cover_prompt}, characters: ${charVisual}`,seed,520,220);
      let bookData, allUrls;

      if(adventure && story.setup_pages){
        const sU = story.setup_pages.map((p,i) => illoUrl(`${p.illustration_prompt}, ${charVisual}`,seed+i+1,400,190));
        const aU = story.path_a.map((p,i) => illoUrl(`${p.illustration_prompt}, ${charVisual}`,seed+100+i,400,190));
        const bU = story.path_b.map((p,i) => illoUrl(`${p.illustration_prompt}, ${charVisual}`,seed+200+i,400,190));
        allUrls = [coverUrl,...sU,...aU,...bU];
        bookData = {
          title:story.title,heroName:name,coverUrl,allChars,isAdventure:true,
          refrain:story.refrain||"",
          setup_pages:story.setup_pages.map((p,i) => ({text:p.text,imgUrl:sU[i]})),
          choice:story.choice,
          path_a:story.path_a.map((p,i) => ({text:p.text,imgUrl:aU[i]})),
          path_b:story.path_b.map((p,i) => ({text:p.text,imgUrl:bU[i]})),
        };
      } else {
        const pU = story.pages.map((p,i) => illoUrl(`${p.illustration_prompt}, ${charVisual}`,seed+i+1,400,190));
        allUrls = [coverUrl,...pU];
        bookData = {
          title:story.title,heroName:name,coverUrl,allChars,
          refrain:story.refrain||"",
          pages:story.pages.map((p,i) => ({text:p.text,imgUrl:pU[i]})),
        };
      }

      const dots = mk(allUrls.length,"p");
      setGen(g => ({...g,progress:80,label:"Story ready! Illustrations loading…",dots:[...dots]}));
      allUrls.forEach((url,i) => {
        preloadImg(url,
          () => { dots[i]="d"; setGen(g=>({...g,dots:[...dots]})); setImgLoaded(p=>({...p,[strHash(url)]:true})); },
          () => { dots[i]="d"; setGen(g=>({...g,dots:[...dots]})); }
        );
      });

      setBook(bookData); setPageIdx(0);
      setGen(g => ({...g,stepIdx:3,progress:94,label:"Enjoy your story!",dots:[...dots]}));
      await new Promise(r => setTimeout(r,200));
      setStage("book");
      sSet(bKey,bookData).catch(()=>{});

    } catch(e) {
      console.error("SleepSeed error:",e);
      const msg = e.message||"Something went wrong";
      const isParseErr = msg.toLowerCase().includes("json")||msg.toLowerCase().includes("parse")||msg.toLowerCase().includes("missing");
      const userMsg = isParseErr
        ? "The story response was incomplete. Try a shorter story length or simplify your story guidance, then try again."
        : `Could not write the story: ${msg}. Please try again.`;
      setGen(g => ({...g,label:`Error: ${msg}`}));
      setError(userMsg);
      await new Promise(r => setTimeout(r,2500));
      setStage("home");
    }
  };

  /* ── Book derived state ── */
  const isAdv       = book?.isAdventure;
  const setupLen    = isAdv ? (book?.setup_pages?.length||0) : 0;
  const choicePgIdx = isAdv ? 2+setupLen : -1;
  const onChoicePg  = pageIdx===choicePgIdx;
  const resPages    = isAdv&&chosenPath ? (chosenPath==="a" ? book.path_a : book.path_b) : [];
  const totalPages  = !book ? 0
    : isAdv ? 2+setupLen+1+(chosenPath?resPages.length+1:0)
    : 2+(book.pages?.length||0)+1;

  totalPagesRef.current = totalPages;
  pageTotalRef.current  = totalPages;

  const goPage = (dir) => {
    if(dir>0&&onChoicePg&&!chosenPath) return;
    setPageIdx(p => Math.max(0,Math.min(totalPages-1,p+dir)));
  };
  goPageRef.current = goPage;

  const handleChoice = (path) => { setChosenPath(path); setPageIdx(choicePgIdx+1); };

  const getCurrentPageText = () => {
    if(!book) return "";
    if(pageIdx===0) return book.title;
    if(pageIdx===1) return "Meet the characters in tonight's story.";
    if(isAdv&&pageIdx>=2&&pageIdx<2+setupLen) return book.setup_pages[pageIdx-2]?.text||"";
    if(isAdv&&onChoicePg) return book.choice?.question||"";
    if(isAdv&&pageIdx>choicePgIdx&&chosenPath){
      const ri = pageIdx-(choicePgIdx+1);
      return resPages[ri]?.text||"";
    }
    if(!isAdv&&pageIdx>=2&&pageIdx<=1+(book.pages?.length||0)) return book.pages[pageIdx-2]?.text||"";
    return `Sweet dreams, ${book.heroName}.`;
  };

  const isLastPage  = pageIdx===totalPages-1;
  const isStoryPage = book&&pageIdx>=2&&!onChoicePg&&!isLastPage;

  /* ── Story page ── */
  const StoryPage = ({pg,pgNum,refrain}) => (
    <div className="bpage story-bg">
      <div className="pinset" />
      <div className="story-lay">
        <div className="story-illo">
          <DreamIllo />
        </div>
        <div className="story-txt-col">
          <div className="s-pgnum">Page {pgNum}</div>
          <div className="s-text">{pg.text}</div>
          <div className="s-foot">
            <div className="orn">✦ ✦ ✦</div>
            <div className="orn-num">{pgNum}</div>
          </div>
          {refrain && <div className="s-refrain">✦ {refrain} ✦</div>}
        </div>
      </div>
    </div>
  );

  /* ── Page switch ── */
  const renderPage = () => {
    if(!book) return null;

    if(pageIdx===0) return (
      <div className="bpage cover-bg">
        <div className="pinset" style={{borderColor:"rgba(212,160,48,.15)"}} />
        <div className="cover-lay">
          <div className="cover-art">
            <DreamIllo />
          </div>
          <div className="cover-bot">
            <div className="c-stars">✦ ★ ✦</div>
            <div className="c-title">{book.title}</div>
            <div className="c-for">A bedtime story for {book.heroName}</div>
            <div className="c-brand">🌙 SleepSeed</div>
          </div>
        </div>
      </div>
    );

    if(pageIdx===1) return (
      <div className="bpage cast-bg">
        <div className="pinset" />
        <div className="cast-lay">
          <div className="cast-title">Meet the Characters</div>
          <div className="cast-sub">in tonight's story…</div>
          <div className="cast-grid">
            {book.allChars.map(c => (
              <div className="cast-char" key={c.id}>
                <div className="cast-av">
                  {c.photo
                    ? <img src={c.photo.preview} alt={c.name} />
                    : <span>{CHAR_ICONS[c.type]||"⭐"}</span>
                  }
                </div>
                <div className="cast-name">{c.name||capitalize(c.type)}</div>
                <div className="cast-role">{c.classify||c.type}</div>
              </div>
            ))}
          </div>
          <div style={{fontFamily:"'Kalam',cursive",fontSize:10,color:"var(--ink3)",textAlign:"right",marginTop:"auto"}}>✦</div>
        </div>
      </div>
    );

    if(isAdv && pageIdx>=2 && pageIdx<2+setupLen) {
      return <StoryPage pg={book.setup_pages[pageIdx-2]} pgNum={pageIdx-1} refrain={book.refrain} />;
    }

    if(isAdv && onChoicePg) return (
      <div className="bpage choice-bg">
        <div className="pinset" style={{borderColor:"rgba(212,160,48,.15)"}} />
        <div className="choice-lay">
          <div className="choice-star">⭐</div>
          <div className="choice-q">{book.choice?.question}</div>
          {!chosenPath ? (
            <div className="choice-opts">
              <button className="choice-btn a" onClick={()=>handleChoice("a")}>
                <span className="choice-tag">Option A</span>
                {book.choice?.option_a_label}
              </button>
              <button className="choice-btn b" onClick={()=>handleChoice("b")}>
                <span className="choice-tag">Option B</span>
                {book.choice?.option_b_label}
              </button>
            </div>
          ) : (
            <div style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
              <div style={{fontSize:14,fontFamily:"'Fraunces',serif",fontStyle:"italic",color:chosenPath==="a"?"#c0d4ff":"#e8c0f8",fontWeight:700}}>
                {chosenPath==="a" ? book.choice?.option_a_label : book.choice?.option_b_label}
              </div>
              <button className="btn-ghost" style={{fontSize:12,padding:"7px 16px"}} onClick={()=>goPage(1)}>Continue →</button>
            </div>
          )}
          {!chosenPath && <div className="choice-hint">Tap a path to continue</div>}
        </div>
      </div>
    );

    if(isAdv && pageIdx>choicePgIdx && chosenPath){
      const ri = pageIdx-(choicePgIdx+1);
      if(ri<resPages.length) return <StoryPage pg={resPages[ri]} pgNum={setupLen+ri+1} refrain={book.refrain} />;
    }

    if(!isAdv && pageIdx>=2 && pageIdx<=1+(book.pages?.length||0)) {
      return <StoryPage pg={book.pages[pageIdx-2]} pgNum={pageIdx-1} refrain={book.refrain} />;
    }

    return (
      <div className="bpage end-bg">
        <div className="pinset" />
        <div className="end-lay">
          <div className="end-moon">🌙</div>
          <div className="end-title">The End</div>
          <div className="end-msg">
            Sweet dreams, {book.heroName}.<br />
            Tomorrow night, another adventure awaits…
          </div>
        </div>
      </div>
    );
  };

  /* ══ RENDER ══ */
  return (
    <>
      <style>{CSS}</style>
      <div className="stars">
        {STARS_DATA.map(s => (
          <div key={s.id} className="star" style={{top:`${s.top}%`,left:`${s.left}%`,width:s.size,height:s.size,"--d":s.d,"--dl":s.dl,"--lo":s.lo,"--hi":s.hi}} />
        ))}
      </div>
      <div className="moon" />
      <div className="app">

        {/* HOME */}
        {stage==="home" && (
          <div className="screen">
            <div className="brand-row">
              <div className="brand-gem">🌙</div>
              <div>
                <div className="brand-name">SleepSeed</div>
                <div className="brand-tag">personalized bedtime books</div>
              </div>
              {memories.length>0 && (
                <button className="btn-ghost" style={{marginLeft:"auto",fontSize:12,padding:"6px 12px"}} onClick={()=>setStage("memories")}>
                  📚 {memories.length}
                </button>
              )}
            </div>
            <div style={{height:14}} />

            {/* ── STEP 1: Who is tonight's story for? ── */}
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,color:"var(--cream)",marginBottom:12,textAlign:"center",fontStyle:"italic"}}>
                Tonight's story is for…
              </div>
              <input className="finput hero-input" placeholder="Your child's name…"
                value={heroName} onChange={e=>setHeroName(e.target.value)} maxLength={20}
                style={{marginBottom:10,textAlign:"center"}} />
              <div className="gender-row" style={{marginBottom:0}}>
                {[{v:"",l:"✨ Any",cls:"sel-any"},{v:"girl",l:"👧 Girl",cls:"sel-girl"},{v:"boy",l:"👦 Boy",cls:"sel-boy"}].map(o => (
                  <button key={o.v} className={`gender-pill${heroGender===o.v?" "+o.cls:""}`} onClick={()=>setHeroGender(o.v)}>{o.l}</button>
                ))}
              </div>
            </div>

            {/* ── STEP 2: Pick a world ── */}
            <div className="card" style={{marginBottom:10}}>
              <div className="section-label" style={{marginBottom:10}}>🌍 Pick a world</div>
              <div className="theme-grid">
                {THEMES.map(t => (
                  <button key={t.label} className={`theme-btn${theme.label===t.label?" sel":""}`} onClick={()=>setTheme(t)}>
                    <div className="theme-emoji">{t.emoji}</div>
                    <div className="theme-label">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── GENERATE — always visible ── */}
            <div style={{marginBottom:10}}>
              {error && <div className="err-box" style={{marginBottom:8}}>⚠️ {error}</div>}
              <button className="btn" disabled={heroName.trim().length<2} onClick={generate}>
                {heroName.trim().length>=2 ? `✨ Make ${heroName.trim()}'s story!` : "Enter a name to begin ↑"}
              </button>
            </div>

            {/* ── STEP 3: Make it extra special (optional) ── */}
            <div style={{background:"linear-gradient(150deg,rgba(22,32,84,.72),rgba(11,18,42,.88))",border:"1px solid rgba(212,160,48,.1)",borderRadius:22,padding:16,backdropFilter:"blur(20px)",boxShadow:"0 20px 64px rgba(0,0,0,.55)"}}>
              <div className={`cust-toggle${customize?" open":""}`} onClick={()=>setCustomize(o=>!o)} style={{marginBottom:0}}>
                <div>
                  <div className="cust-label">✨ Make it extra special</div>
                  {!customize && (
                    <div className="magic-hint" style={{marginTop:3}}>
                      <span className="magic-hint-badge">Characters</span>
                      <span className="magic-hint-badge">Occasion</span>
                      <span className="magic-hint-badge">Story ideas</span>
                    </div>
                  )}
                </div>
                <span className="cust-chevron">▼</span>
              </div>

              {customize && (
                <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:14}}>

                  {/* Who's in the story */}
                  <div>
                    <div className="section-label" style={{marginBottom:8}}>👥 Who's in the story?</div>
                    <div className="char-simple-list">
                      {extraChars.map(c => (
                        <div className="char-simple-row" key={c.id}>
                          <div className="char-photo" style={{width:34,height:34,fontSize:16,borderRadius:8,flexShrink:0}} onClick={()=>pickPhoto(c.id)}>
                            {c.photo ? <img src={c.photo.preview} alt={c.name} /> : <span>{CHAR_ICONS[c.type]||"👫"}</span>}
                          </div>
                          <input className="char-name-in" placeholder={`${CHAR_TYPES.find(t=>t.value===c.type)?.label||"Friend"}'s name…`}
                            value={c.name} maxLength={16} style={{flex:1}}
                            onChange={e=>updateExtraChar(c.id,{name:e.target.value})} />
                          <ClassifySelect value={c.classify} onChange={e=>updateExtraChar(c.id,{classify:e.target.value})}
                            className="char-cls-sel" style={{width:90,fontSize:10}} />
                          <button className="btn-danger" style={{flexShrink:0}} onClick={()=>removeExtraChar(c.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                    {extraChars.length<4 && (
                      <div style={{marginTop:10}}>
                        <div className="section-label" style={{marginBottom:8}}>Add a character:</div>
                        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                          {CHAR_TYPES.map(t => (
                            <button key={t.value} className="char-add-pill"
                              onClick={()=>setExtraChars(cs=>[...cs,{...newChar(),type:t.value}])}>
                              <span className="char-add-pill-icon">{t.icon}</span>
                              <span>{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="divider" />

                  {/* Is tonight special? */}
                  <div>
                    <div className="section-label" style={{marginBottom:8}}>🎉 Is tonight a special night?</div>
                    <div className="occ-pills">
                      {OCCASIONS.filter(o=>o.value).map(o => (
                        <button key={o.value} className={`occ-pill${occasion===o.value?" on":""}`}
                          onClick={()=>{ setOccasion(occasion===o.value?"":o.value); setOccasionCustom(""); }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                    {occasion==="other" && (
                      <input className="finput" style={{marginTop:8,fontSize:13}}
                        placeholder="What's the occasion? e.g. lost a tooth, first haircut…"
                        value={occasionCustom} onChange={e=>setOccasionCustom(e.target.value)} maxLength={100} />
                    )}
                  </div>

                  <div className="divider" />

                  {/* Sneak in a lesson */}
                  <div>
                    <div className="section-label" style={{marginBottom:8}}>💛 Sneak in a lesson? <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--dimmer)",fontSize:10}}>(optional)</span></div>
                    <div className="les-pills">
                      {LESSONS.filter(l=>l.value).map(l => (
                        <button key={l.value} className={`les-pill${lesson===l.value?" on":""}`}
                          onClick={()=>setLesson(lesson===l.value?"":l.value)}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divider" />

                  {/* Guide the story */}
                  <div>
                    <div className="section-label" style={{marginBottom:4}}>📖 Tell me what happens</div>
                    <div style={{fontSize:11,color:"var(--dimmer)",marginBottom:8,lineHeight:1.5}}>
                      Describe a moment, a character, anything — the more specific, the more magical.
                    </div>
                    <textarea className="ftarea" rows={2}
                      placeholder="e.g. Lily finds a tiny lost dragon hiding under her bed…"
                      value={storyGuidance} onChange={e=>setStoryGuidance(e.target.value)} maxLength={500} />
                    <div className="guidance-chips">
                      {["🐉 Add a dragon","😂 Make it funny","🎵 Include a song","🌙 Very sleepy ending","🐾 A talking animal","🍪 Something delicious","🔮 A surprise twist"].map(chip => (
                        <button key={chip} className="guidance-chip"
                          onClick={()=>setStoryGuidance(g=>(g?g+", ":"")+chip.replace(/^\S+ /,""))}>
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divider" />

                  {/* Age / grade level */}
                  <div>
                    <div className="section-label" style={{marginBottom:8}}>🎓 How old is {heroName||"your child"}?</div>
                    <div className="age-pills">
                      {AGES.map(a => (
                        <button key={a.value} className={`age-pill${ageGroup===a.value?" on":""}`}
                          onClick={()=>setAgeGroup(a.value)}>
                          <span>{a.label}</span>
                          <span className="age-pill-grade">{a.grade}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divider" />

                  {/* Length + Adventure in one row */}
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div>
                      <div className="section-label" style={{marginBottom:6}}>⏱ Story length</div>
                      <div className="pill-row">
                        {LENGTHS.map(l => (
                          <button key={l.value} className={`pill${storyLen===l.value?" on":""}`} onClick={()=>setStoryLen(l.value)}>
                            {l.label} <span style={{opacity:.6,fontWeight:400}}>({l.desc})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="tog-row">
                      <div>
                        <div className="tog-label">🔀 Choose Your Adventure</div>
                        <div className="tog-sub">Your child picks the story's path</div>
                      </div>
                      <label className="tog">
                        <input type="checkbox" checked={adventure} onChange={e=>setAdventure(e.target.checked)} />
                        <div className="tog-track" /><div className="tog-thumb" />
                      </label>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* GENERATING */}
        {stage==="generating" && (
          <div className="screen" style={{maxWidth:420}}>
            <div className="card gen-wrap">
              <div className="gen-orb" />
              <div className="gen-title">{gen.label||"Creating your story…"}</div>
              <div className="gen-sub">
                A one-of-a-kind picture book for{" "}
                <strong style={{color:"var(--gold2)"}}>{heroName}</strong>
                {adventure && <span style={{display:"block",fontSize:12,color:"var(--gold)",marginTop:3}}>🔀 Choose-Your-Adventure mode</span>}
              </div>
              <div className="pbar">
                <div className="pfill" style={{width:`${gen.progress}%`}} />
              </div>
              <div className="plabel" style={{marginBottom:14}}>{gen.progress}%</div>
              {gen.dots.length>0 && (
                <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center",marginBottom:12}}>
                  {gen.dots.map((s,i) => (
                    <div key={i} className={`img-dot ${s==="p"?"busy":"done"}`}>{s==="d"?"✓":"…"}</div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {["Checking story memory…","Writing the story…","Painting illustrations…","Book is ready!"].map((s,i) => (
                  <div key={i} className={`pstep ${i===gen.stepIdx?"active":i<gen.stepIdx?"done":""}`}>
                    <div className="pstep-dot" />
                    <span>{i<gen.stepIdx?"✓ ":""}{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BOOK */}
        {stage==="book" && book && (
          <div className="book-shell">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div className="brand-gem" style={{width:30,height:30,fontSize:15,borderRadius:9}}>🌙</div>
                <span className="brand-name" style={{fontSize:16}}>SleepSeed</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {fromCache && <div style={{fontSize:10,background:"rgba(76,200,144,.12)",border:"1px solid rgba(76,200,144,.28)",borderRadius:6,padding:"3px 7px",color:"var(--green2)",fontWeight:700}}>⚡ Saved</div>}
                {voiceId && <div style={{fontSize:10,background:"rgba(240,100,120,.12)",border:"1px solid rgba(240,100,120,.28)",borderRadius:6,padding:"3px 7px",color:"#f8a0b0",fontWeight:700}}>🎤 Your Voice</div>}
                {isAdv&&chosenPath && <div style={{fontSize:10,background:"rgba(112,80,192,.12)",border:"1px solid rgba(112,80,192,.28)",borderRadius:6,padding:"3px 7px",color:"#c0a8ff",fontWeight:700}}>Path {chosenPath.toUpperCase()}</div>}
                <div style={{fontSize:11,color:"var(--dim)",fontFamily:"'Kalam',cursive",fontStyle:"italic"}}>{book.heroName}'s story</div>
              </div>
            </div>

            <div className="book-3d" onClick={addSparkle}>
              {renderPage()}
              {sparkles.map(sp => (
                <div key={sp.id} className="spark-ring" style={{left:sp.x,top:sp.y}}>
                  {Array.from({length:8},(_,i) => {
                    const angle = (i/8)*Math.PI*2;
                    const dist  = 30+Math.random()*25;
                    return (
                      <div key={i} className="spark" style={{
                        background:SPARK_COLORS[i%SPARK_COLORS.length],
                        "--sx":`${Math.cos(angle)*dist}px`,
                        "--sy":`${Math.sin(angle)*dist}px`,
                        animationDelay:`${i*30}ms`,
                        left:0,top:0,
                      }} />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="auto-bar" style={{opacity:autoOn?1:0}}>
              <div className="auto-fill" style={{width:`${autoPct}%`}} />
            </div>

            <div className="book-nav" style={{marginTop:8}}>
              <button className="nav-btn" disabled={pageIdx===0} onClick={()=>goPage(-1)}>← Back</button>
              <div className="dots">
                {Array.from({length:totalPages}).map((_,i) => (
                  <div key={i} className={`dot${i===pageIdx?" on":""}`}
                    onClick={()=>{ if(i<=pageIdx||(i===choicePgIdx+1&&chosenPath)) setPageIdx(i); }} />
                ))}
              </div>
              <button className="nav-btn" disabled={isLastPage||(onChoicePg&&!chosenPath)} onClick={()=>goPage(1)}>
                {onChoicePg&&!chosenPath ? "Choose!" : "Next →"}
              </button>
            </div>

            <div className="ctrl-bar">
              {isStoryPage && (
                <button className={`ctrl-btn read${isReading?" active":""}`} onClick={()=>{ const prog=totalPages>1?pageIdx/(totalPages-1):0.5; toggleRead(getCurrentPageText(),prog); }}>
                  {isReading ? "⏸ Pause" : voiceId ? "🎤 Read aloud" : "🔊 Read aloud"}
                </button>
              )}
              <button className={`ctrl-btn auto${autoOn?" active":""}`} onClick={()=>setAutoOn(o=>!o)}>
                {autoOn ? "⏹ Stop" : "▶ Auto"}
              </button>
              <button className="ctrl-btn save" onClick={async()=>{ await saveMemory(book); setStage("memories"); }}>
                💾 Save
              </button>
              <button className="ctrl-btn fresh" onClick={async()=>{
                const s = makeStorySeed(heroName,theme,extraChars,occasion,occasionCustom,lesson,adventure,storyLen,heroGender,heroClassify,storyGuidance);
                await sDel(`book_${s}`);
                setStage("home"); setBook(null); setChosenPath(null); setAutoOn(false);
                if(audioSessionRef.current){ SleepAudio.endSession(false); audioSessionRef.current=false; }
              }}>🔄 New</button>
              <button className="snd-gear" onClick={()=>setShowSoundCtrl(o=>!o)} title="Sound settings">🔧</button>
            </div>
            {showSoundCtrl && (
              <div className="snd-bar">
                <button className={`snd-tog${ambientOn?" on":""}`} onClick={()=>setAmbientOn(o=>!o)}>
                  <span className="snd-dot" />
                  🎵 Ambient {ambientOn?"On":"Off"}
                </button>
                <button className={`snd-tog${sfxOn?" on":""}`} onClick={()=>setSfxOn(o=>!o)}>
                  <span className="snd-dot" />
                  ✨ Sound FX {sfxOn?"On":"Off"}
                </button>
                <button className={`vc-badge${voiceId?" active":""}`} onClick={()=>{ setVcStage(voiceId?"ready":"idle"); setShowVcModal(true); }}>
                  🎤 {voiceId ? "Your Voice ✓" : "Clone Voice"}
                </button>
              </div>
            )}

            {/* ── Voice Clone Modal ── */}
            {showVcModal && (
              <div className="vc-modal" onClick={e=>{ if(e.target===e.currentTarget) setShowVcModal(false); }}>
                <div className="vc-card">
                  <div className="vc-title">🎤 Use Your Voice</div>
                  <div className="vc-sub">
                    Create a voice clone on ElevenLabs, then paste your Voice ID here.
                    SleepSeed will narrate every story in your voice. ✨
                  </div>

                  <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"12px 14px",marginBottom:16,fontSize:12,color:"var(--cream)",lineHeight:2.1}}>
                    <div style={{fontWeight:700,fontSize:10,color:"var(--dim)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>How to get your Voice ID:</div>
                    <div>1️⃣ Go to <strong>elevenlabs.io</strong> → sign in</div>
                    <div>2️⃣ <strong>Voices</strong> → <strong>Add a new voice</strong> → <strong>Instant Voice Clone</strong></div>
                    <div>3️⃣ Upload a 30–60 sec clear recording of your voice</div>
                    <div>4️⃣ Save it, then click the voice → copy the <strong>Voice ID</strong></div>
                    <div>5️⃣ Paste it below 👇</div>
                  </div>

                  {(vcStage==="idle"||vcStage==="error") && (
                    <>
                      <div className="vc-script-label">Your ElevenLabs Voice ID:</div>
                      <input
                        className="finput"
                        style={{marginBottom:10,fontSize:12,fontFamily:"monospace",letterSpacing:".03em"}}
                        placeholder="Paste Voice ID here…"
                        value={vcIdInput}
                        onChange={e=>setVcIdInput(e.target.value)}
                        onKeyDown={e=>{ if(e.key==="Enter") saveVoiceId(); }}
                      />
                      {vcError && <div style={{fontSize:11,color:"#f09080",marginBottom:10,lineHeight:1.5}}>{vcError}</div>}
                      <button className="btn" style={{marginBottom:8}} onClick={saveVoiceId} disabled={!vcIdInput.trim()}>
                        ✓ Connect My Voice
                      </button>
                      {voiceId && (
                        <button className="btn-ghost" style={{width:"100%",fontSize:12,marginBottom:8}} onClick={resetVoice}>
                          🗑 Remove current voice
                        </button>
                      )}
                      <button className="btn-ghost" style={{width:"100%",fontSize:12}} onClick={()=>setShowVcModal(false)}>
                        Close
                      </button>
                    </>
                  )}

                  {vcStage==="ready" && (
                    <>
                      <div style={{textAlign:"center",padding:"8px 0 12px"}}>
                        <div style={{fontSize:40,marginBottom:8}}>🎉</div>
                        <div className="vc-status" style={{color:"var(--green2)"}}>Voice connected!</div>
                        <div style={{fontSize:10,color:"var(--dimmer)",marginTop:6,fontFamily:"monospace",wordBreak:"break-all",padding:"0 8px"}}>{voiceId}</div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button className="btn" style={{flex:1,padding:11,fontSize:14}} onClick={()=>setShowVcModal(false)}>
                          Done ✓
                        </button>
                        <button className="btn-ghost" style={{flex:1,padding:11,fontSize:13}} onClick={()=>{ setVcStage("idle"); setVcIdInput(""); }}>
                          Change
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MEMORIES */}
        {stage==="memories" && (
          <div className="screen">
            <div className="brand-row">
              <div className="brand-gem">🌙</div>
              <div>
                <div className="brand-name">SleepSeed</div>
                <div className="brand-tag">saved stories</div>
              </div>
            </div>
            <div style={{height:16}} />
            <div className="card">
              <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,color:"var(--cream)",marginBottom:5}}>📚 Story Library</div>
              <div style={{fontSize:13,color:"var(--dim)",marginBottom:16,lineHeight:1.6}}>Tap any story to re-read it.</div>
              {memories.length===0 ? (
                <div style={{textAlign:"center",padding:"36px 16px",color:"var(--dimmer)"}}>
                  <div style={{fontSize:38,marginBottom:10}}>🌙</div>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--dim)",marginBottom:5}}>No stories saved yet</div>
                  <div style={{fontSize:12}}>Generate a story and tap 💾 Save to start your library.</div>
                </div>
              ) : (
                <div className="mem-list">
                  {memories.map(m => (
                    <div className="mem-card" key={m.id}
                      onClick={()=>{ setBook(m.bookData); setPageIdx(0); setChosenPath(null); setFromCache(true); setStage("book"); }}>
                      <div style={{fontSize:22,flexShrink:0,width:36,textAlign:"center"}}>{m.occasion?"🎉":"📖"}</div>
                      <div className="mem-info">
                        <div className="mem-title">{m.title}</div>
                        <div className="mem-meta">{m.heroName} · {m.date}</div>
                      </div>
                      <button className="btn-danger" style={{flexShrink:0}}
                        onClick={e=>{ e.stopPropagation(); deleteMemory(m.id); }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:10}}>
                <button className="btn-ghost" onClick={()=>setStage("home")}>🏠 Home</button>
                <button className="btn-ghost" onClick={()=>setStage("home")}>📖 New Story</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
