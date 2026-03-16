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
.guidance-chip.on{background:rgba(76,200,144,.12);border-color:rgba(76,200,144,.5);color:#80d8a8}
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
.ctrl-btn.save{background:rgba(100,130,220,.07);border-color:rgba(100,130,220,.24);color:var(--ui)}
.ctrl-btn.fresh{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.11);color:var(--dim)}
.ctrl-btn.dl{background:rgba(100,180,255,.07);border-color:rgba(100,180,255,.28);color:rgba(140,200,255,.9)}
.ctrl-btn.dl:hover{background:rgba(100,180,255,.15)}
.ctrl-btn.vc-btn{background:rgba(240,100,120,.07);border-color:rgba(240,100,120,.32);color:rgba(240,140,150,.9)}
.ctrl-btn.vc-btn:hover{background:rgba(240,100,120,.18)}
.ctrl-btn.vc-btn.active{background:rgba(240,100,120,.2);border-color:rgba(240,100,120,.7)}
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
.path-row{display:flex;gap:10px;margin-bottom:10px}
.path-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;flex:1;
  padding:20px 12px;border-radius:18px;cursor:pointer;border:1.5px solid;text-align:center;
  transition:all .2s;position:relative;overflow:hidden;min-height:110px}
.path-btn:disabled{opacity:.4;cursor:not-allowed}
.path-btn.quick{background:rgba(212,160,48,.08);border-color:rgba(212,160,48,.3);color:var(--gold2)}
.path-btn.quick:not(:disabled):hover{background:rgba(212,160,48,.18);border-color:var(--gold2);transform:translateY(-2px)}
.path-btn.build{background:rgba(120,80,220,.08);border-color:rgba(160,100,255,.3);color:rgba(180,140,255,.9)}
.path-btn.build:not(:disabled):hover{background:rgba(120,80,220,.18);border-color:rgba(160,100,255,.7);transform:translateY(-2px)}
.path-icon{font-size:32px;line-height:1}
.path-title{font-family:'Fraunces',serif;font-size:15px;font-weight:700;line-height:1.2}
.path-sub{font-size:10px;opacity:.7;font-weight:400;line-height:1.4}
.brand-row{display:flex;align-items:center;gap:9px;margin-bottom:6px}
.brand-gem{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#1a2870,#2840b0);
  border:1.5px solid rgba(212,160,48,.4);display:flex;align-items:center;justify-content:center;font-size:18px}
.brand-name{font-family:'Fraunces',serif;font-size:22px;font-weight:700;
  background:linear-gradient(135deg,var(--gold3),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.brand-tag{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--dimmer)}
`;

/* ── Data ── */
const THEMES = [
  {label:"The Bedroom",emoji:"🌙",value:`SETTING: The child's very own bedroom — but tonight something magical is different. The toys on the shelf are whispering. The shadows on the wall are friendly shapes. The wardrobe door opens just a crack and something small and curious peeks out. The glow-in-the-dark stars have rearranged into a secret message.

This setting's magic is SECRETS — things that have always been true but only become visible at night, in the dark, when the house is quiet and the adults are asleep.

STORY HOOKS — use one or blend several:
• The toys have been waiting all day for bedtime so they can hold their nightly meeting. Tonight the child secretly watches.
• Something under the bed is NOT a monster — it's something much funnier and more unexpected.
• The child's favourite stuffed animal has been trying to tell them something important for weeks. Tonight they finally understand.
• Three things in the bedroom are not what they appear to be. The hero figures out all three.
• The bedroom ceiling turns into a real sky, with stars that can actually be visited.`},

  {label:"The Backyard",emoji:"🌳",value:`SETTING: The back garden — ordinary by day, completely extraordinary tonight. The grass hums. The shed has a light on that nobody left on. The neighbourhood cats are holding a very important meeting by the fence. Every flower has an opinion and is not shy about sharing it.

This setting's magic is PARALLEL CIVILIZATION — the garden runs its own society entirely separate from the human world, with jobs, disputes, laws, and urgent ongoing business that has nothing to do with people.

STORY HOOKS — use one or blend several:
• The garden creatures have a whole society — with rules, disagreements, and one very dramatic dispute the hero must resolve.
• Something has gone missing from the garden and all the plants have a different theory.
• There is a door in the garden wall that wasn't there yesterday.
• The neighbourhood cats have chosen the hero for a secret mission. They are extremely serious about this.
• A tiny creature has just moved in and doesn't know a single rule yet. The hero shows them around.`},

  {label:"A Road Trip",emoji:"🚗",value:`SETTING: A car journey — windows fogged, the world going past in the dark. Service stations glow like little planets. The sat-nav keeps giving slightly wrong and increasingly ridiculous directions. Every bend in the road might lead somewhere extraordinary.

This setting's magic is TRANSITION — things only exist here because the car is moving. The magic lives in the in-between. Every stop reveals something; every departure leaves something behind.

STORY HOOKS — use one or blend several:
• The sat-nav has become sentient and is directing them somewhere much more interesting than planned.
• Every time the car stops, the hero notices something strange and wonderful that nobody else sees.
• Another car keeps appearing alongside them — its passengers clearly on the same adventure from the other direction.
• Something small and alive has stowed away in the boot and is causing polite havoc.
• A motorway service station is secretly the most interesting place in the country, if you know where to look.`},

  {label:"School",emoji:"🏫",value:`SETTING: School — familiar by day, completely different after the bell. The classroom chairs push themselves into rows. The whiteboard writes messages nobody put there. The corridor that always feels too long goes somewhere tonight that it definitely doesn't go during school hours.

This setting's magic is HIDDEN KNOWLEDGE — the school knows far more than it teaches, and the objects and spaces hold the accumulated learning of every child who has ever passed through.

STORY HOOKS — use one or blend several:
• After everyone leaves, the classroom objects hold their own lessons — far more interesting than normal school.
• The school library's books have been wandering into each other's stories and getting muddled. Someone must sort it out.
• There is a door in the school that is always locked. Tonight it isn't.
• The school pet (or a stray that's moved in) is in charge of everything after 4pm and takes this very seriously.
• Three things the hero thought they knew about school turn out to be completely different from what they believed.`},

  {label:"The Supermarket",emoji:"🛒",value:`SETTING: A supermarket — bright and familiar, but tonight the hero is still inside after closing. The food items have personalities and long-running disagreements. The cereals consider themselves the aristocracy. The vegetables are unionised. The biscuit aisle is chaotic and proud of it.

This setting's magic is CATEGORISATION — everything has a shelf, a section, a place it belongs. The drama comes from things that don't fit, things that have been put in the wrong aisle, things that refuse to stay where they have been put.

STORY HOOKS — use one or blend several:
• The food holds a late-night gathering and the hero has accidentally been invited.
• There is a disagreement between two food sections that has been running for years. The hero must help.
• Something has gone missing from its shelf and every item has a different suspect.
• The hero finds an aisle that definitely wasn't there before, selling things that definitely don't exist.
• One very old item — at the back of the shelf — has been waiting a very long time for someone to notice it.`},

  {label:"Grandma's House",emoji:"👵",value:`SETTING: A grandparent's house — warm, slightly cluttered, smelling of biscuits and something floral. Every drawer holds something interesting. The garden has been growing for decades. The old photographs on the wall show people who lean forward slightly when nobody's watching.

This setting's magic is DEEP TIME — everything here has been here a long time and remembers it. The magic is slow, patient, and comes from things that stayed while everything else changed.

STORY HOOKS — use one or blend several:
• The objects in the house have long memories and will share them if asked nicely.
• Grandma or Grandpa has a secret room, a secret skill, or a secret talent about to be discovered.
• Something that's been in the family forever turns out to be the most important magical object imaginable.
• An old friend of Grandma's arrives — not entirely ordinary, not at all.
• The garden holds a secret that only shows itself to children.`},

  {label:"The Park",emoji:"🏖️",value:`SETTING: A local park or playground — somewhere the hero knows well, but today feels different. The old oak tree has seen everything. The ducks on the pond have strong opinions. The ice cream van is in a slightly different spot than last time, as always, and nobody has ever mentioned this.

This setting's magic is THRESHOLDS — the park has edges, hidden corners, and overlooked spots that everyone knows about and no one has ever entered. The magic lives in the places people walk past every single day.

STORY HOOKS — use one or blend several:
• The park has a secret that only appears at a particular time of day — the hero arrives at exactly that moment.
• The ducks are running a very important operation and the hero keeps accidentally interfering.
• The ice cream van goes to places it absolutely should not be able to go.
• There is a corner of the park that everyone walks past but nobody enters. Today the hero goes in.
• Something has been left on a bench. Finding who it belongs to becomes the whole adventure.`},

  {label:"The Kitchen",emoji:"🍳",value:`SETTING: The kitchen — the warmest room in the house, and after bedtime the most surprising one. The fridge hums a tune. The mugs have a strict hierarchy. The wooden spoon has been in this family longer than anyone and knows things it absolutely should not know.

This setting's magic is MEMORY — the kitchen holds the history of every meal, every celebration, every ordinary act of care that has ever happened in this house. The oldest objects are the wisest.

STORY HOOKS — use one or blend several:
• The kitchen holds a late-night gathering once everyone is asleep. Tonight the hero sneaks down and is welcomed.
• Something is baking — but nobody baked it. It rose by itself and appears to be trying to say something.
• The cutlery drawer is very, very organised. There is a reason for this.
• The oldest thing in the kitchen — the battered pot, the chipped mug, the wooden board — has the best story.
• An ingredient has gone missing and every kitchen object has a completely different theory.`},
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
// Lesson categories
const LESSONS_CHARACTER = [
  {value:"sharing and generosity — shown through a moment where giving something away turns out to fill the giver's heart more than keeping it ever could",label:"🤝 Sharing"},
  {value:"bravery and facing fears — shown through a moment where the hero walks toward the scary thing and discovers it only looked frightening from far away",label:"⚔️ Bravery"},
  {value:"kindness to others — shown through one small, specific act of noticing someone who needed to be seen, and choosing to see them",label:"💛 Kindness"},
  {value:"being a good friend — shown through listening carefully and showing up exactly when it matters, without being asked",label:"👫 Friendship"},
  {value:"never giving up — shown through a moment of almost-quitting where something small and true gives the hero just enough to try once more",label:"🔥 Perseverance"},
  {value:"honesty and trust — shown through a moment where telling the truth felt scary but turned out to be the bravest and kindest thing to do",label:"🌟 Honesty"},
];
const LESSONS_EMOTIONAL = [
  {value:"managing worries and anxiety — shown through a moment where the hero's big worried feeling becomes smaller when they name it, breathe through it, or share it with someone they trust",label:"🌀 Managing Worries"},
  {value:"handling frustration and big feelings — shown through a moment where everything goes wrong and the hero finds a way to pause, feel it, and keep going anyway",label:"😤 Handling Frustration"},
  {value:"building confidence and self-belief — shown through a moment where the hero doubts themselves completely and then discovers something wonderful they could do all along",label:"💪 Building Confidence"},
  {value:"navigating friendship challenges — shown through a moment of falling out, misunderstanding, or feeling left out, and finding a gentle way back to connection",label:"🌈 Friendship Challenges"},
  {value:"school challenges and new beginnings — shown through the feeling of something new and scary becoming something manageable and even exciting",label:"🎒 School Challenges"},
];
const LESSONS = [
  {value:"",label:"— None —"},
  ...LESSONS_CHARACTER,
  ...LESSONS_EMOTIONAL,
];
const LENGTHS = [
  {value:"short",   label:"Quick Story",   target:8,  advSetup:4, advRes:3, desc:"~3 min"},
  {value:"standard",label:"Bedtime Book",  target:12, advSetup:6, advRes:5, desc:"~5 min"},
  {value:"long",    label:"Full Adventure",target:16, advSetup:8, advRes:7, desc:"~8 min"},
];
const AGES = [
  {value:"age3",label:"Age 3\u20134",grade:"Pre-K",prompt:`READER AGE: 3\u20134 years old (Pre-K).

VOCABULARY: ONLY the simplest words a toddler knows. Sentences of 3\u20135 words maximum. If a word might confuse a 3-year-old, cut it.

STRUCTURE \u2014 model: Eric Carle, Mem Fox, Dr Seuss:
\u2022 The ENTIRE story is built on ONE repeated pattern. Same rhythm, every 2 pages. Gets funnier or warmer each time.
\u2022 One sentence per page. Two maximum. Three is too many.
\u2022 Every page has a natural clapping beat when read aloud.
\u2022 The refrain MUST appear three times: page 2 (introduction), the middle page (a variation \u2014 different character says it, or it goes slightly wrong), and the LAST page (warm, closing).
\u2022 Page count: follow the chosen story length (short=8, standard=8, long=10). At this age shorter is ALWAYS better \u2014 never exceed 10 pages regardless of length setting.

HERO AGENCY: Even at 3\u20134, ${name} must DO something \u2014 not watch. They press the button. They say the magic word. They share the thing. One tiny action by ${name} changes everything.

ONE TRUE THING: Include one tiny moment a 3-year-old would recognise from their own life \u2014 losing something and finding it, not wanting to share and then doing it anyway, being scared of something small. Never name it as a lesson. Just let it happen.

TONE: Extremely silly. Extremely safe. SPLAT. BOING. WHOOSH. Characters say "Oh no!" and "Uh oh!" and things fall over in funny ways. The ending must feel like a warm hug.`},

  {value:"age5",label:"Age 5\u20136",grade:"Kindergarten",prompt:`READER AGE: 5\u20136 years old (Kindergarten).

VOCABULARY: Simple everyday words plus 1\u20132 fun new words that are obviously explained by context. Sentences of 6\u201310 words. Short sentences for big moments. Longer for travelling or calm.

STRUCTURE \u2014 model: Julia Donaldson (The Gruffalo), Mo Willems (Pigeon series):
\u2022 RULE OF THREE (preferred): ${name} tries something on page 3, page 5, and page 7. Attempt 1 fails hilariously. Attempt 2 fails differently and even more hilariously. Attempt 3 succeeds \u2014 but not how anyone expected.
\u2022 OR RUNNING JOKE: A silly thing happens on page 1 and keeps happening. On the last page it happens one final time with a twist.
\u2022 Every page must have at least one line of dialogue. Characters say the WRONG thing, the BRAVE thing, the FUNNY thing.
\u2022 Page count: follow the chosen story length (short=8, standard=10, long=12). Fit the Rule of Three to whatever page count is chosen: attempt 1 at ~30% through, attempt 2 at ~55%, attempt 3 at ~75%. Last page is always sleep.

HERO AGENCY (critical): ${name} must make ONE decision that changes everything. Not "helped" \u2014 decided. PASSIVE (bad): "${name} watched as the dragon flew away." ACTIVE (good): "${name} knew exactly what to do. She climbed up. She knocked three times. And she asked the question nobody else had thought to ask."

ONE TRUE THING: One moment of genuine emotional recognition \u2014 the flutter of nerves before something new, the warm feeling of being the one who fixed it, the sting of being left out and then included. It lives in what happens, never in what is said.

TONE: Warm and funny. Someone always has a terrible plan. It sort of works anyway. Sound words on at least 3 pages.`},

  {value:"age7",label:"Age 7\u20138",grade:"1st\u20132nd Grade",prompt:`READER AGE: 7\u20138 years old (1st\u20132nd Grade).

VOCABULARY: Sentences of 8\u201314 words. One genuinely interesting word per page \u2014 sounds good read aloud (e.g. "preposterous", "magnificent", "thunderous"). Always clear from context.

STRUCTURE \u2014 model: Roald Dahl (The Enormous Crocodile), Arnold Lobel (Frog and Toad):
\u2022 PLANT AND PAYOFF: On page 1 or 2, introduce something small \u2014 an object, a word, a detail \u2014 that seems unimportant. On the last two pages, it turns out to be the most important thing in the story. The child goes "OH!" and wants to read it again immediately.
\u2022 The hero must be underestimated by at least one other character \u2014 and prove them spectacularly, satisfyingly wrong.
\u2022 Running joke: one funny thing escalates across 3\u20134 pages and pays off just before the ending.
\u2022 Characters have contradictions: brave but secretly nervous, bossy but genuinely kind underneath.
\u2022 Page count: follow the chosen story length (short=8, standard=12, long=16). Plant seed by page 2. Twist lands on the penultimate page. Final page is always the sleep landing.

HERO AGENCY (critical): ${name} must make one decision under pressure that only THEY could make \u2014 using something specific about who they are. Not luck. Not help from others. Them.

ONE TRUE THING: One moment must contain genuine emotional honesty \u2014 real doubt, real disappointment, real courage, or real joy. Not performed. Felt. This is the moment a parent will remember long after the story ends.

TONE: Wry and warm. Not "big" but "SO ENORMOUSLY, RIDICULOUSLY big that three families of sparrows had moved into its left ear". The ending is surprising AND deeply satisfying.`},

  {value:"age9",label:"Age 9\u201310",grade:"3rd\u20134th Grade",prompt:`READER AGE: 9\u201310 years old (3rd\u20134th Grade).

VOCABULARY: Rich vocabulary welcomed. 1\u20132 genuinely interesting words per page \u2014 the kind children will use tomorrow to impress someone. Sentences can be complex. Paragraphs of 3\u20134 sentences are fine on journey pages.

STRUCTURE \u2014 model: Roald Dahl (Fantastic Mr Fox), A.A. Milne (Winnie-the-Pooh), E.B. White (Charlotte's Web):
\u2022 REVELATION ENDING: The twist must recontextualise the entire story \u2014 not just surprise, but make the reader see everything differently. Plant the clue no later than page 3.
\u2022 EMOTIONAL TURN: At least one moment where something genuinely difficult happens \u2014 real doubt, a mistake with consequences, something that matters. Then a resolution that feels earned, not given.
\u2022 SECONDARY CHARACTER ARC: One supporting character has their own small journey that intersects with ${name}'s at the climax in an unexpected way.
\u2022 Characters have genuine contradictions AND growth: someone starts wrong about something important and ends changed.
\u2022 Page count: follow the chosen story length (short=8, standard=12, long=16). Clue in first 25% of pages. Emotional turn at 65\u201375% through. Revelation on penultimate page. Final page is always the sleep landing.

HERO AGENCY (critical): ${name} must face a moment where the easy path is genuinely tempting \u2014 and choose the harder, right thing instead. The reader must feel the weight of that choice.

ONE TRUE THING: One moment should feel so emotionally true that it could only have been written for THIS child on THIS night. The feeling of being small in a big world and discovering you are braver than you thought.

TONE: Intelligent, funny, and emotionally honest. Not condescending. The best moment should make both the child AND the parent feel something real.`},
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
  const occ = occasionCustom || occasion;
  const sig = `${heroName.toLowerCase()}|${chars.map(c=>`${c.type}:${c.name}:${c.classify||""}:${c.gender||""}`).join(",")}|${occ}|${lesson}|${adventure}|${len}|${gender}|${classify}|${guidance.slice(0,60)}`;
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
const SleepUtils = {
  getSpeechRate(p) {
    if(p > 0.82) return 0.60;
    if(p > 0.65) return 0.66;
    return 0.72;
  },
  getPostPagePause(p) {
    if(p > 0.82) return 2200;
    if(p > 0.65) return 1400;
    return 850;
  },
};

/* ── ElevenLabs helpers ── */
const elTTS = async (text, voiceId, speed=1.0) => {
  const resp = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId, speed }),
  });
  if(!resp.ok) throw new Error(`TTS error ${resp.status}`);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
};

const elCloneVoice = async (audioFile) => {
  const form = new FormData();
  form.append("name", `SleepSeed Voice ${Date.now()}`);
  form.append("description", "Parent voice for SleepSeed bedtime stories");
  form.append("files", audioFile, audioFile.name || "voice_sample.m4a");
  const resp = await fetch("/api/clone", { method: "POST", body: form });
  const data = await resp.json();
  if(!resp.ok) throw new Error(data.error?.message || data.error || `Clone failed (${resp.status})`);
  return data.voice_id;
};

const elDeleteVoice = async (vid) => {
  try { await fetch(`/api/clone?voice_id=${vid}`, { method: "DELETE" }); } catch(_) {}
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
  // Safely parse — Vercel may return a plain-text error page on timeout/crash
  const raw = await r.text();
  let d;
  try { d = JSON.parse(raw); } catch(_) {
    throw new Error(`Server error (${r.status}): ${raw.slice(0,120)}`);
  }
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
  const [lessons,        setLessons]        = useState<string[]>([]);
  const [adventure,      setAdventure]      = useState(false);
  const [storyLen,       setStoryLen]       = useState("standard");
  const [ageGroup,       setAgeGroup]       = useState("age5");
  const [storyGuidance,  setStoryGuidance]  = useState("");
  const [customize,      setCustomize]      = useState(false);
  const [builderMode,    setBuilderMode]    = useState(false);
  const [storyMood,      setStoryMood]      = useState("");        // calm|silly|exciting|heartfelt
  const [storyPace,      setStoryPace]      = useState("normal");  // normal|sleepy|snappy
  const [storyStyle,     setStoryStyle]     = useState("standard");// standard|rhyming|adventure|mystery
  const [heroTraits,     setHeroTraits]     = useState<string[]>([]);
  const [moreOpen,       setMoreOpen]       = useState(false);
  const [quickChars,     setQuickChars]     = useState<string[]>([]);
  const [error,          setError]          = useState("");
  const [book,           setBook]           = useState(null);
  const [pageIdx,        setPageIdx]        = useState(0);
  const [chosenPath,     setChosenPath]     = useState(null);
  const [fromCache,      setFromCache]      = useState(false);
  const [gen,            setGen]            = useState({stepIdx:0,progress:0,label:"",dots:[]});
  const [isReading,      setIsReading]      = useState(false);
  const [sparkles,       setSparkles]       = useState([]);
  const [cachedChars,    setCachedChars]    = useState({});
  const [imgLoaded,      setImgLoaded]      = useState({});
  const [memories,       setMemories]       = useState([]);
  const [voiceId,        setVoiceId]        = useState(null); // EL cloned voice
  const [vcStage,        setVcStage]        = useState("idle"); // idle|recording|uploading|ready|error
  const [vcError,        setVcError]        = useState("");
  const [showVcModal,    setShowVcModal]    = useState(false);

  const totalPagesRef = useRef(0);
  const fileRefs      = useRef({});
  const autoReadRef   = useRef(false);
  const goPageRef     = useRef(null);
  const elAudioRef      = useRef(null);   // current ElevenLabs Audio element

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
    sGet("voice_id").then(s => { if(s?.id) setVoiceId(s.id); });
  },[]);


  useEffect(() => {
    if("speechSynthesis" in window) window.speechSynthesis.cancel();
    if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current = null; }
    if(autoReadRef.current) {
      const total = totalPagesRef.current || 1;
      const progress = total > 1 ? pageIdx / (total-1) : 0.5;
      if(voiceId) speakTextEL(getCurrentPageText(), progress);
      else speakText(getCurrentPageText(), progress);
    } else {
      setIsReading(false);
    }
  },[pageIdx]); // eslint-disable-line react-hooks/exhaustive-deps


  // ── Web Speech narration ───────────────────────────────────────────────
  const speakText = useCallback((text, pageProgress=0.5) => {
    if(!("speechSynthesis" in window)||!text) return;
    window.speechSynthesis.cancel();

    const CALMING_VOICES = [
      "Samantha","Ava","Allison","Victoria","Karen","Moira","Tessa","Fiona",
      "Aria","Jenny","Michelle","Elizabeth","Clara","Zira",
      "Google UK English Female","Google US English",
    ];
    const pickVoice = () => {
      const vs = window.speechSynthesis.getVoices();
      for(const n of CALMING_VOICES){ const v=vs.find(v=>v.name.includes(n)); if(v) return v; }
      return vs.find(v=>v.lang.startsWith("en")&&/female|woman|girl/i.test(v.name))||vs.find(v=>v.lang.startsWith("en"))||null;
    };

    const speak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate   = SleepUtils.getSpeechRate(pageProgress);
      utt.pitch  = 0.95;
      utt.volume = 1.0;
      const voice = pickVoice();
      if(voice) utt.voice = voice;

      utt.onend = () => {
        const isLast = pageIdx >= totalPagesRef.current - 1;
        const pause  = SleepUtils.getPostPagePause(pageProgress);
        if(autoReadRef.current) {
          if(isLast) { autoReadRef.current = false; setIsReading(false); }
          else setTimeout(() => goPageRef.current?.(1), pause);
        } else { setIsReading(false); }
      };
      utt.onerror = () => { autoReadRef.current = false; setIsReading(false); };
      setIsReading(true);
      window.speechSynthesis.speak(utt);
    };

    const voices = window.speechSynthesis.getVoices();
    if(voices.length > 0) speak();
    else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged=null; speak(); }; }
  },[book, pageIdx]);

  // ── ElevenLabs narration ───────────────────────────────────────────────
  const speakTextEL = useCallback(async (text, pageProgress=0.5) => {
    if(!text) return;
    if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current = null; }

    const onEnd = () => {
      const isLast = pageIdx >= totalPagesRef.current - 1;
      const pause  = SleepUtils.getPostPagePause(pageProgress);
      if(autoReadRef.current) {
        if(isLast) { autoReadRef.current = false; setIsReading(false); }
        else setTimeout(() => goPageRef.current?.(1), pause);
      } else { setIsReading(false); }
    };

    setIsReading(true);
    try {
      const rate = SleepUtils.getSpeechRate(pageProgress);
      const url  = await elTTS(text, voiceId, rate);
      const audio = new Audio(url);
      elAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); elAudioRef.current=null; onEnd(); };
      audio.onerror = () => { URL.revokeObjectURL(url); elAudioRef.current=null; onEnd(); };
      await audio.play();
    } catch(err) {
      console.error("EL TTS error:", err);
      // Fall back to Web Speech
      speakText(text, pageProgress);
    }
  }, [voiceId, pageIdx, speakText]);

  // ── Toggle read aloud ──────────────────────────────────────────────────
  const toggleRead = useCallback((text, pageProgress=0.5) => {
    if(isReading) {
      window.speechSynthesis.cancel();
      if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current=null; }
      autoReadRef.current = false;
      setIsReading(false);
    } else {
      autoReadRef.current = true;
      if(voiceId) speakTextEL(text, pageProgress);
      else speakText(text, pageProgress);
    }
  },[isReading, speakText, speakTextEL, voiceId]);

  // ── Voice clone: microphone recording ────────────────────────────────
  const [vcSeconds, setVcSeconds] = useState(0);
  const mediaRecRef   = useRef(null);
  const audioChunksRef = useRef([]);
  const vcTimerRef    = useRef(null);

  const startRecording = async () => {
    setVcError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = (e) => { if(e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start(200);
      mediaRecRef.current = mr;
      setVcSeconds(0);
      setVcStage("recording");
      vcTimerRef.current = setInterval(() => setVcSeconds(s => s + 1), 1000);
    } catch(err) {
      setVcError("Microphone access denied. Please allow microphone access in your browser settings.");
      setVcStage("error");
    }
  };

  const stopRecording = () => {
    clearInterval(vcTimerRef.current);
    const mr = mediaRecRef.current;
    if(!mr) return;
    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
    setVcStage("uploading");
    mr.onstop = async () => {
      try {
        const mimeType = audioChunksRef.current[0]?.type || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const file = new File([blob], "voice_recording.webm", { type: mimeType });
        if(voiceId) await elDeleteVoice(voiceId);
        const newId = await elCloneVoice(file);
        setVoiceId(newId);
        await sSet("voice_id", { id: newId });
        setVcStage("ready");
      } catch(err) {
        setVcError((err as any).message || "Upload failed. Please try again.");
        setVcStage("error");
      }
    };
  };

  const cancelRecording = () => {
    clearInterval(vcTimerRef.current);
    if(mediaRecRef.current) {
      try { mediaRecRef.current.stop(); mediaRecRef.current.stream.getTracks().forEach(t => t.stop()); } catch(_) {}
    }
    setVcStage("idle");
    setVcSeconds(0);
  };

  const resetVoice = async () => {
    clearInterval(vcTimerRef.current);
    if(mediaRecRef.current) {
      try { mediaRecRef.current.stop(); mediaRecRef.current.stream.getTracks().forEach(t => t.stop()); } catch(_) {}
    }
    if(voiceId) await elDeleteVoice(voiceId);
    await sDel("voice_id");
    setVoiceId(null);
    setVcStage("idle");
    setVcSeconds(0);
    setVcError("");
  };

  // ── PDF Download ──────────────────────────────────────────────────────
  const downloadStory = async () => {
    if(!book) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a5" });
      const W = 148, H = 210;
      const BG:[number,number,number]  = [8,12,28];
      const GOLD:[number,number,number] = [212,160,48];
      const CREAM:[number,number,number] = [235,225,200];
      const DIM:[number,number,number]  = [140,130,160];

      const darkPage = () => {
        doc.setFillColor(...BG); doc.rect(0,0,W,H,"F");
        doc.setDrawColor(50,45,80); doc.setLineWidth(0.4); doc.rect(4,4,W-8,H-8);
      };

      const loadImg = (url:string):Promise<string|null> => new Promise(res => {
        const img = new Image(); img.crossOrigin="anonymous";
        img.onload = () => {
          const c=document.createElement("canvas"); c.width=img.width; c.height=img.height;
          (c.getContext("2d") as any).drawImage(img,0,0);
          res(c.toDataURL("image/jpeg",0.7));
        };
        img.onerror=()=>res(null); img.src=url;
      });

      // ── COVER ──────────────────────────────────────────────────────────
      darkPage();
      doc.setTextColor(...GOLD); doc.setFontSize(11); doc.setFont("helvetica","normal");
      doc.text("✦  ★  ✦", W/2, 20, {align:"center"});
      if(book.coverUrl) {
        const d=await loadImg(book.coverUrl); if(d) doc.addImage(d,"JPEG",12,26,W-24,60,undefined,"FAST");
      }
      doc.setFontSize(18); doc.setFont("helvetica","bold"); doc.setTextColor(...CREAM);
      const tLines = doc.splitTextToSize(book.title, W-24);
      doc.text(tLines, W/2, 100, {align:"center"});
      doc.setFontSize(10); doc.setFont("helvetica","italic"); doc.setTextColor(...DIM);
      doc.text(`A bedtime story for ${book.heroName}`, W/2, 100+tLines.length*8, {align:"center"});
      doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(...GOLD);
      doc.text("🌙 SleepSeed", W/2, H-14, {align:"center"});
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...DIM);
      doc.text("sleepseed.app", W/2, H-9, {align:"center"});

      // ── CHARACTERS ─────────────────────────────────────────────────────
      doc.addPage(); darkPage();
      doc.setFontSize(16); doc.setFont("helvetica","bold"); doc.setTextColor(...CREAM);
      doc.text("Meet the Characters", W/2, 28, {align:"center"});
      doc.setFontSize(10); doc.setFont("helvetica","italic"); doc.setTextColor(...DIM);
      doc.text("in tonight's story…", W/2, 36, {align:"center"});
      let cy=50;
      for(const c of book.allChars) {
        const icon = (CHAR_ICONS as any)[c.type]||"⭐";
        doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...CREAM);
        doc.text(`${icon}  ${c.name||capitalize(c.type)}`, 16, cy);
        doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(...DIM);
        doc.text(c.classify||c.type||"", 16, cy+5); cy+=16;
      }
      doc.setFontSize(7); doc.setTextColor(...DIM);
      doc.text("sleepseed.app", W/2, H-9, {align:"center"});

      // ── STORY PAGES ────────────────────────────────────────────────────
      const pages = book.isAdventure
        ? [...(book.setup_pages||[]), ...(book.path_a||[]), ...(book.path_b||[])]
        : (book.pages||[]);
      for(let i=0;i<pages.length;i++) {
        const pg = pages[i];
        doc.addPage(); darkPage();
        let pgY = 14;
        if(pg.imgUrl) {
          const d=await loadImg(pg.imgUrl);
          if(d){ doc.addImage(d,"JPEG",10,8,W-20,52,undefined,"FAST"); pgY=68; }
        }
        doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...DIM);
        doc.text(`Page ${i+1}`, 12, pgY);
        doc.setFontSize(11); doc.setTextColor(...CREAM);
        const lines = doc.splitTextToSize(pg.text||"", W-24);
        doc.text(lines, 12, pgY+7);
        if(book.refrain && (pg.text||"").toLowerCase().includes((book.refrain||"").slice(0,15).toLowerCase())) {
          const ry = pgY+7+lines.length*4.8+6;
          doc.setFontSize(9); doc.setFont("helvetica","italic"); doc.setTextColor(...GOLD);
          doc.text(`✦ ${book.refrain} ✦`, W/2, ry, {align:"center"});
        }
        doc.setFontSize(8); doc.setTextColor(...GOLD);
        doc.text("✦ ✦ ✦", W/2, H-14, {align:"center"});
        doc.setFontSize(7); doc.setTextColor(...DIM);
        doc.text("sleepseed.app", W/2, H-9, {align:"center"});
      }

      // ── END PAGE ───────────────────────────────────────────────────────
      doc.addPage(); darkPage();
      doc.setFontSize(24); doc.setFont("helvetica","bold"); doc.setTextColor(...CREAM);
      doc.text("The End", W/2, H/2-18, {align:"center"});
      doc.setFontSize(11); doc.setFont("helvetica","italic"); doc.setTextColor(...DIM);
      doc.text(`Sweet dreams, ${book.heroName}.`, W/2, H/2, {align:"center"});
      doc.text("Tomorrow night, another adventure awaits…", W/2, H/2+10, {align:"center"});
      doc.setFontSize(8); doc.setTextColor(...GOLD);
      doc.text("🌙 SleepSeed · sleepseed.app", W/2, H-14, {align:"center"});

      doc.save(`${book.title.replace(/[^a-z0-9]/gi,"_").toLowerCase()}.pdf`);
    } catch(err) {
      console.error("PDF error:", err);
      alert("Could not generate PDF — please try again.");
    }
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
    const occ = occasionCustom || occasion;
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
  const generate = async (overrides:any={}) => {
    const resolvedTheme   = overrides.theme         ?? theme;
    const resolvedChars   = overrides.extraChars    ?? extraChars;
    const resolvedOcc     = overrides.occasion      ?? occasion;
    const resolvedOccCust = overrides.occasionCustom ?? occasionCustom;
    const resolvedLesson  = overrides.lessons       ?? lessons;
    const resolvedAdv     = (overrides.storyStyle ?? storyStyle) === "adventure" || (overrides.adventure ?? adventure);
    const resolvedLen     = overrides.storyLen      ?? storyLen;
    const resolvedAge    = overrides.ageGroup      ?? ageGroup;
    const resolvedGuidance= overrides.storyGuidance ?? storyGuidance;
    const resolvedMood    = overrides.storyMood     ?? storyMood;
    const resolvedPace    = overrides.storyPace     ?? storyPace;
    const resolvedStyle   = overrides.storyStyle    ?? storyStyle;
    const resolvedTraits  = overrides.heroTraits    ?? heroTraits;
    setError(""); setStage("generating"); setFromCache(false); setChosenPath(null);
    const name = heroName.trim();
    const seed = makeStorySeed(name,resolvedTheme,resolvedChars,resolvedOcc,resolvedOccCust,Array.isArray(resolvedLesson)?resolvedLesson.join("|"):resolvedLesson,resolvedAdv,resolvedLen,heroGender,heroClassify,resolvedGuidance);
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
        ...resolvedChars,
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

      const occasionFinal = resolvedOccCust.trim() || resolvedOcc;
      const occLine  = occasionFinal ? `\nSPECIAL OCCASION: ${occasionFinal}` : "";
      const lesArr = Array.isArray(resolvedLesson) ? resolvedLesson : (resolvedLesson ? [resolvedLesson] : []);
      const lesLine  = lesArr.length ? `\nLESSONS (weave these in through action only — never state as a moral): ${lesArr.length > 2 ? "You have been given multiple lessons. Prioritise the one or two that fit most naturally into the story. A story that gently embodies one lesson is far more powerful than a story that forces three. Choose wisely. " : ""}${lesArr.map(l=>"• "+l).join("\n")}` : "";
      const guidanceSafe = resolvedGuidance.trim().slice(0, 300).replace(/[\u201C\u201D""]/g, '"');
      const guidLine = guidanceSafe ? `\nSTORY GUIDANCE — highest priority, incorporate naturally:\n${guidanceSafe}` : "";

      // World: AI picks based on context, or random if no inputs
      const lesArrCheck = Array.isArray(resolvedLesson) ? resolvedLesson : (resolvedLesson ? [resolvedLesson] : []);
      const hasContext = !!(resolvedOcc || lesArrCheck.length || guidanceSafe || resolvedChars.length > 0);
      const autoTheme = hasContext
        ? null  // let AI pick
        : THEMES[Math.floor(Math.random() * THEMES.length)];
      const worldLine = autoTheme
        ? `SETTING:\n${autoTheme.value}\n\nSet the entire story in this real-world place. Ground it in what a child knows — then make it delightfully surprising. The setting is active: things in it talk, move, have opinions, and cause problems. It is not a backdrop.`
        : `SETTING SELECTION: Based on the characters, occasion, lessons, and story guidance provided, choose the single most fitting setting from the real-world options below. Pick the one where the story context will feel most vivid, funny, and natural. The chosen setting must be active — not a backdrop but a participant. Things in it have personalities and opinions.\n\nAVAILABLE SETTINGS:\n${THEMES.map((t,i)=>`${i+1}. ${t.label}: ${t.value.split("\n")[0]}`).join("\n")}`;
      const moodLine  = resolvedMood ? `\nSTORY MOOD: ${resolvedMood==="calm"?"Calm and cosy — warm, gentle, soothing throughout. Every page should feel like a soft blanket.":resolvedMood==="silly"?"Silly and funny — lean into humour and absurdity on every page. At least one thing per page should make a child laugh.":resolvedMood==="exciting"?"Exciting and adventurous — high energy and wonder throughout the adventure pages. The final 2-3 pages still wind down gently and land safely in sleep.":resolvedMood==="heartfelt"?"Warm and heartfelt — emotionally resonant and tender. Prioritise genuine feeling over plot twists.":""} This mood shapes the story flavour but never overrides age-appropriate vocabulary, the sleep landing, or the story's fundamental safety.` : "";
      const paceLine  = resolvedPace && resolvedPace!=="normal" ? `\nNARRATION PACE: ${resolvedPace==="sleepy"?"Extra sleepy — from the first page the world is soft and quiet. Short gentle sentences. Long pauses. Characters move slowly. The whole story drifts toward sleep.":"Quick and snappy — punchy sentences and fast energy through the adventure pages. The final 2-3 pages MUST still slow down, grow quiet, and land the child in sleep. Snappy applies to the adventure, never the ending."}` : "";
      const styleLine = resolvedStyle && resolvedStyle!=="standard" && resolvedStyle!=="adventure" ? `\nSTORY STYLE: ${resolvedStyle==="rhyming"?"Rhyming — the ENTIRE story must rhyme with a consistent scheme that scans naturally when read aloud (AABB, ABCB, or AABBA all work — choose whichever fits the story best). Every line must feel musical and effortless, never forced. Rhymes must serve the story, not the other way around. The sleep landing must still rhyme warmly. Adventure/choice-path format is automatically disabled for rhyming stories.":resolvedStyle==="mystery"?"Mystery — structure as a gentle child-friendly mystery. Something is missing or unexplained on page 1. Clues discovered naturally across the middle pages. The solution is revealed on the penultimate page — surprising but obvious in hindsight. The final page is always the warm sleep landing, NOT more mystery.":""}` : "";
      const traitLine = resolvedTraits.length ? `\nHERO PERSONALITY: ${heroName||name} is ${resolvedTraits.join(", ")}. Let these traits shape every decision they make and every line of dialogue they speak.` : "";
      const ageCfg = AGES.find(a=>a.value===resolvedAge)||AGES[1];
      const ageLine = ageCfg.prompt;

      setGen(g => ({...g,stepIdx:1,progress:26,label:"Writing tonight's story…"}));

      const lenCfg = LENGTHS.find(l=>l.value===resolvedLen)||LENGTHS[1];
      // For adventure mode: split target into setup/resolution
      const setupN = lenCfg.advSetup;
      const resN   = lenCfg.advRes;
      const totalN = lenCfg.target;

      // ── Story arc guidance ────────────────────────────────────────────
      const buildArc = (n) => {
        return `STORY STRUCTURE GUIDANCE (target ~${n} pages — write more if the story genuinely needs it):

This is not a rigid script. It is a shape. The story is always the priority.

PAGE WEIGHT GUIDE: Vary the feel of every page. Some pages: 1-2 short punchy sentences (action moment). Some: 3-5 sentences (adventure unfolding). Some: mostly dialogue (characters revealing themselves). Final pages: slow, warm, drifting (sleep arriving). Never write two consecutive pages with the same rhythm or energy.

OPENING (pages 1–2): Drop ${name} into something surprising, funny, or urgent IMMEDIATELY. No scene-setting. No describing the world. Something HAPPENS on page 1. A sound word. An action. End page 1 with a reason it is impossible not to turn the page.

EARLY PAGES: The problem or adventure establishes itself. Characters reveal their personalities through what they SAY and DO — especially through funny mistakes, wrong guesses, and terrible plans that almost work. The REFRAIN appears naturally for the first time around page 2. Write it so a child wants to say it along with you.

MIDDLE PAGES: The adventure deepens. Use Rule of Three, Running Joke, or Cumulative Build. Each page must feel different in rhythm and energy from the one before. ${name} makes REAL CHOICES — not observations. The refrain returns in the middle with a small variation: said by a different character, or going slightly wrong in a funny way. At least one character says something hilarious, brave, or unexpectedly wise. Sound words on at least 3 pages.

THE HERO'S MOMENT: ${name} must make one decision that only THEY could make — using something specific about who they are. Not luck. Not rescue. A choice. The resolution must come FROM ${name}, not happen TO ${name}.

THE ONE TRUE THING: Somewhere in the story — not the ending, not a lesson, just a moment — something emotionally true must happen. A small, specific thing a child would recognise from their own life. The warmth of being seen by exactly the right person. The relief when the scary thing turns out to be okay. The flutter before something new. Never state it. Just let it happen. This is what children remember.

PENULTIMATE PAGE: The world begins to wind down. A yawn appears. Lights get softer. Voices drop. Movement slows. This is the beginning of sleep, not a separate chapter.

FINAL PAGE — THE MOST IMPORTANT PAGE IN THE STORY:
• Echo something specific from page 1: the same word, the same image, the same sound. The story must feel circular and complete.
• The refrain returns here — for the last time — as the emotional close. Quieter. Warmer. Final.
• No new information. No new characters. No new events. Only warmth and resolution.
• The final sentence must be the longest, slowest, warmest sentence in the entire story. It should carry ${name} all the way to sleep.
• Weak final page: "And everyone went to sleep. The end."
• Strong final page: "${name} closed both eyes, and listened to the quiet, and thought: yes. This is exactly where I am supposed to be. [REFRAIN — whispered]. Goodnight."`;
      };
      // ── JSON schema ────────────────────────────────────────────────────────
      // Page schema: allow variable-weight pages for real picture-book feel
      const pgSchema = (n) => Array.from({length:n},()=>(
        '{"text":"Write the RIGHT amount for this page — not a fixed word count. Big moment pages can be 1-2 SHORT punchy sentences. Journey pages can be 3-5 sentences. Dialogue pages can be almost entirely speech. Quiet sleep pages should be slow and drifting. Every page must feel distinct in rhythm and energy from the pages before and after it. Prioritise storytelling over length targets.","illustration_prompt":"one warm playful moment under 30 words, name every visible character, bright cosy mood"}'
      )).join(",");

      const simpleSchema = `{"title":"A brilliant 3-6 word title a child would beg to hear again — specific, funny, or intriguing (e.g. 'The Dragon Who Sneezed Stars' or '${name} and the Very Wobbly Cake')","cover_prompt":"wide warm magical scene, all characters visible, bright cosy colours, child-friendly and full of energy","refrain":"A 4-8 word phrase rooted in this story's central image or action — NOT generic (never: Off we go! / Here we come! / Let's do this!). SPECIFIC to this story only (e.g. for a mug-with-opinions story: That is NOT how you make tea. — for a sock-in-wrong-drawer story: One sock. Wrong drawer. Not good.). Appears on page 2, varies in the middle, closes the final page. A child must say it before you do by the third reading.","pages":[${pgSchema(totalN)}]}`;
      const advSchema    = `{"title":"A brilliant 3-6 word title a child would beg to hear again — specific, funny, or intriguing (e.g. 'The Dragon Who Sneezed Stars' or '${name} and the Very Wobbly Cake')","cover_prompt":"wide warm magical scene, all characters visible, bright cosy colours, child-friendly and full of energy","refrain":"A 4-8 word phrase rooted in this story's central image or action — NOT generic (never: Off we go! / Here we come! / Let's do this!). SPECIFIC to this story only (e.g. for a mug-with-opinions story: That is NOT how you make tea. — for a sock-in-wrong-drawer story: One sock. Wrong drawer. Not good.). Appears on page 2, varies in the middle, closes the final page. A child must say it before you do by the third reading.","setup_pages":[${pgSchema(setupN)}],"choice":{"question":"Write a short, exciting, specific choice question for ${name} — not generic. It must follow directly from what just happened on the last setup page. Make it feel urgent. Two paths must feel genuinely different.","option_a_label":"4-7 fun exciting words","option_b_label":"4-7 fun exciting words"},"path_a":[${pgSchema(resN)}],"path_b":[${pgSchema(resN)}]}`;

      // ── Master story prompt ───────────────────────────────────────────────
      const storyPrompt = `You are writing a children's picture book that will be read aloud at bedtime. Your models are Roald Dahl, Julia Donaldson, Mo Willems, Eric Carle, and A.A. Milne. Every page must feel like it belongs in a book a child could buy at a bookstore and memorise by the third reading.

THE PRIME DIRECTIVE: The story is ALWAYS the priority. Page count is a target, not a ceiling. All rules exist to serve the story.

FOUR THINGS EVERY STORY MUST HAVE — these cannot be skipped:
1. A hero who makes one real decision that changes everything (not watches, not helps — decides)
2. A refrain that appears three times: introduced, varied, and closed
3. One moment of genuine emotional truth a child would recognise from their own life
4. A final page that echoes page 1 and ends with the longest, warmest sentence in the story

The only other unbreakable rule: write at the correct age level.

━━━ BEFORE YOU WRITE A SINGLE WORD ━━━

Commit to ONE specific, irreplaceable story concept. Not a setting. Not a theme. A concept.

A concept is the single weird, specific, delightful idea that makes THIS story different from every other bedtime story ever written. It must be concrete enough to write on a Post-it note.

STRONG concept (specific, surprising, rooted in the child's world):
"The oldest mug in the kitchen has watched seventeen families and has very strong opinions about who makes tea correctly."
"Something has been living under ${name}'s bed — not a monster, but something far more embarrassing."
"The school whiteboard has been writing the same message for three days and nobody notices because they keep erasing it."

WEAK concept (vague, generic, could be any story):
"The hero goes on an adventure and learns about bravery." — this is a theme, not a concept.
"The toys come alive and have fun." — this is a category, not a story.

Once you have your concept, COMMIT to it. Every page, every line of dialogue, every joke must serve this one specific idea. A story with a strange clear premise will always beat a technically accomplished story with a vague one.

━━━ READER AGE ━━━
${ageLine}

━━━ WHAT GREAT PICTURE BOOK WRITING LOOKS AND SOUNDS LIKE ━━━

GOOD (target — real-world setting, short punchy lines, sound word, silly dialogue, turn-the-page hook):
${name} opened the fridge.
The egg at the back had been there for a very long time.
It cleared its throat.
"AHEM," said the egg. "I have been waiting to speak to someone."
${name} looked at the egg.
The egg looked at ${name}.
"There is," said the egg, "a PROBLEM."

GOOD (the refrain in action — same four words, three times, each one different):
"This," said the spoon, "is NOT how we do things."
Later: "This," said the spoon again, somewhat louder, "is STILL not how we do things."
At the end: "This," whispered the spoon, very quietly, "is exactly how we do things."

BAD (adult prose with a child's name dropped in — never write this):
"${name} surveyed the kitchen, its familiar geometry rendered strange by the lateness of the hour. The refrigerator emitted a low, sonorous hum."

The difference: SHORT lines. CONCRETE objects with OPINIONS. DIALOGUE that reveals character instantly. A reason — every single page — to turn to the next one.

━━━ THE TECHNIQUES THAT MAKE CHILDREN MEMORISE BOOKS ━━━

1. REPETITION WITH VARIATION: A phrase, image, or pattern that recurs — and gets funnier or warmer each time. The first appearance sets it up. The second makes them laugh. The third makes them feel it.
   Example: "Oh no," said the dragon. / "Oh no," said ${name}. / "Oh no," said ABSOLUTELY EVERYONE.

2. SOUND WORDS: At least 3 per story. WHOOSH. SPLAT. BOING. KERPLUNK. CRASH. SQUELCH. THWUMP.
   These are what children shout at each other the next day. Put them on their own line. In capitals.

3. EXAGGERATION: Not "it was big" — "it was SO ENORMOUSLY, RIDICULOUSLY big that a family of hedgehogs had moved into its left nostril and were very happy there."

4. DIALOGUE DRIVES EVERYTHING: Characters say the wrong thing, the funny thing, the brave thing. One line of dialogue minimum per page. Let characters argue, misunderstand, and be confidently wrong. Dialogue is where personality lives.

5. PLANT AND PAYOFF: Something small on page 1 or 2 — an object, a word, a detail that seems like nothing — becomes the most important thing in the story by the end. The child goes "OH!" and immediately asks to read it again. This is the difference between a story that is forgotten and one that is remembered.

6. CHARACTERS ARE WRONG: The best children's book characters are confidently, hilariously wrong about something important. That wrongness drives the plot. The moment they realise they're wrong — or succeed despite being wrong — is the heart of the story.

7. THE TURN-THE-PAGE HOOK: Every single page must end with a reason to turn to the next one. A question. A sound. A cliffhanger. An impossibility. A character saying exactly the wrong thing at exactly the wrong moment. Never let a page end with resolution — save that for the last page only.

━━━ CHARACTERS ━━━
${charCtx}

CHARACTER DEPLOYMENT RULE: Every named supporting character must either CAUSE the central problem or be ESSENTIAL to solving it. A character who is present, follows the hero around, and says supportive things is a wasted character. For each character ask: if removed, does the plot collapse? If yes, they earn their place. If no, give them a role that makes them necessary, or keep them as a brief warm presence rather than a named player.

━━━ SETTING, OCCASION, AND CONTEXT ━━━
${worldLine}${guidLine}${occLine}${lesLine}${moodLine}${paceLine}${styleLine}${traitLine}

━━━ STORY CRAFT ━━━

HOLD THIS IN MIND BEFORE YOU WRITE PAGE 1: The final page is the whole reason this story exists. It is what the parent reads slowly and warmly to a drowsy child. Write the entire story so that every joke, every image, every page-turn hook is quietly moving toward that one sentence. Know what your last line is before you write your first.

PAGE RHYTHM — vary on EVERY page without exception:
• Explosive pages: 1–2 very short punchy lines. Something just happened.
• Journey pages: 3–5 sentences. The adventure moves forward.
• Dialogue pages: Almost entirely speech. Characters reveal themselves.
• Quiet pages: Near the end only. One slow, warm, drifting sentence.
• Never write two pages in a row with the same rhythm or energy. Ever.

THE REFRAIN — three appearances, each distinct:
• Page 2 (introduction): the refrain arrives naturally, as if it was always there.
• Middle of story (variation): the same phrase, but something is slightly different — a different character says it, it goes slightly wrong, or it gets funnier. This is what makes children laugh the second time.
• Final page (close): the refrain returns one last time, quieter and warmer than before. This is the emotional landing of the whole story. The child should feel it like a hug.
The refrain must feel like a song. 4–8 words. Write it so a child will say it before you do on the third reading.

HERO AGENCY — the most important craft rule:
${name} must make one decision in the story that only THEY could make — using something specific about who they are. The resolution must come FROM ${name}, not happen TO ${name}.
PASSIVE (never write this): "${name} watched as the problem was solved."
ACTIVE (always write this): "${name} had one idea. It was a bit silly. But it was exactly right."

THE ONE TRUE THING:
Somewhere in the story — not the ending, not named as a lesson — one small emotionally true moment must happen. Something a child would recognise from their own life without being told to. The relief when the scary thing is fine. The warmth of being seen. The flutter before something new. Never explain it. Just let it happen quietly. This is what children remember for years.

THE ENDING — the most important pages in the story:
PENULTIMATE PAGE: The world begins to slow. A yawn appears somewhere. Light gets softer. Voices drop. Movement stills. This is not an afterthought — it is the transition into sleep beginning.
FINAL PAGE: Echo one specific thing from page 1 — a word, a sound, an image — so the story feels perfectly circular. The refrain returns, whispered. No new information. No new events. Only resolution and warmth. The final sentence must be the longest, slowest, most comforting sentence in the entire story. It should carry ${name} all the way to sleep.

WHAT TO NEVER DO:
• Never open with description — the first word should be action, dialogue, or a sound word
• Never state a lesson — if a reader can name what the child learned, it has been done wrong
• Never use a word the target age would not know; when in doubt, cut it
• Never make ${name} a passive observer — they decide, they act, they change the outcome
• Never write a supporting character who is simply present — they must cause something or resolve something
• Never write a generic refrain — if it could appear in any other story, it is wrong
• Never end the final page with new information — it closes, it does not add
• Never make the story feel dark, unresolved, or unsafe before sleep

━━━ STORY ARC ━━━
${resolvedAdv
  ? `CHOOSE-YOUR-ADVENTURE FORMAT:\nWrite ${setupN} setup pages, then a choice moment, then ${resN} resolution pages per path. Both paths end with ${name} safely, warmly asleep.\n\n${buildArc(setupN)}`
  : buildArc(totalN)}

━━━ OUTPUT ━━━
Return ONLY this exact JSON object. No extra text, no markdown, no explanation:
${resolvedAdv ? advSchema : simpleSchema}`;

      const raw = await callClaude(
        [{role:"user",content:storyPrompt}],
        "You are a master children's picture book author. Before writing, commit to one specific irreplaceable story concept — the single weird idea that makes this story unlike any other. Write at the exact age level specified. Every story must have: a premise-driven title that names the odd specific thing at the heart of the story, a refrain rooted in this story's central image appearing three times with variation, a hero who makes one real decision that changes the outcome, one moment of genuine emotional truth a child would recognise from their own life, and a final page that echoes page 1 with the longest warmest sentence in the story. If rhyming is requested every line scans naturally. The story always ends with the child safely asleep. Return ONLY a valid JSON object — no markdown, no text outside the JSON.",
        4000
      );

      const story = extractJSON(raw);

      if(!story.title) throw new Error("Response missing title");
      if(!resolvedAdv && (!Array.isArray(story.pages)||story.pages.length===0)) throw new Error("Response missing pages array");
      if(resolvedAdv && (!Array.isArray(story.setup_pages)||!Array.isArray(story.path_a)||!Array.isArray(story.path_b))) throw new Error("Response missing adventure paths");

      setGen(g => ({...g,stepIdx:2,progress:65,label:"Painting the illustrations…"}));

      const coverUrl = illoUrl(`${story.cover_prompt}, characters: ${charVisual}`,seed,520,220);
      let bookData, allUrls;

      if(resolvedAdv && story.setup_pages){
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
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,color:"var(--cream)",marginBottom:12,textAlign:"center",fontStyle:"italic"}}>
                ✨ Tonight's story is for…
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
            {error && <div className="err-box" style={{marginBottom:8}}>⚠️ {error}</div>}
            <div className="path-row">
              <button className="path-btn quick" disabled={heroName.trim().length<2}
                onClick={()=>{ if(heroName.trim().length<2) return; setStage("quick"); }}>
                <div className="path-icon">⚡</div>
                <div className="path-title">Quick Story</div>
                <div className="path-sub">3 questions,<br/>then generate</div>
              </button>
              <button className="path-btn build" disabled={heroName.trim().length<2}
                onClick={()=>{ if(heroName.trim().length<2) return; setStage("builder"); }}>
                <div className="path-icon">🎨</div>
                <div className="path-title">Build My Story</div>
                <div className="path-sub">Full customise,<br/>more control</div>
              </button>
            </div>
            {heroName.trim().length<2 && (
              <div style={{textAlign:"center",fontSize:12,color:"var(--dimmer)",marginTop:4}}>Enter a name to begin ↑</div>
            )}
          </div>
        )}

        {/* QUICK STORY */}
        {stage==="quick" && (
          <div className="screen">
            <div className="brand-row">
              <button className="btn-ghost" style={{fontSize:12,padding:"6px 12px",marginRight:8}} onClick={()=>setStage("home")}>← Back</button>
              <div className="brand-gem">⚡</div>
              <div>
                <div className="brand-name" style={{fontSize:16}}>Quick Story</div>
                <div className="brand-tag">for {heroName}</div>
              </div>
            </div>
            <div style={{height:10}} />
            <div className="card" style={{marginBottom:10}}>
              <div style={{display:"flex",flexDirection:"column",gap:18}}>

                {/* Age */}
                <div>
                  <div className="section-label" style={{marginBottom:8}}>🎓 How old is {heroName}?</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                    {AGES.map(a => (
                      <button key={a.value}
                        style={{padding:"10px 8px",borderRadius:12,cursor:"pointer",textAlign:"center",
                          border:`1.5px solid ${ageGroup===a.value?"rgba(100,160,255,.7)":"rgba(255,255,255,.1)"}`,
                          background:ageGroup===a.value?"rgba(100,160,255,.13)":"rgba(255,255,255,.04)",
                          transition:"all .2s"}}
                        onClick={()=>setAgeGroup(a.value)}>
                        <div style={{fontSize:13,fontWeight:700,color:ageGroup===a.value?"#a8c8ff":"var(--cream)"}}>{a.label}</div>
                        <div style={{fontSize:9,color:"var(--dimmer)",marginTop:2,textTransform:"uppercase",letterSpacing:".06em"}}>{a.grade}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divider" />

                {/* Length */}
                <div>
                  <div className="section-label" style={{marginBottom:8}}>⏱ How long tonight?</div>
                  <div className="pill-row">
                    {LENGTHS.map(l => (
                      <button key={l.value} className={`pill${storyLen===l.value?" on":""}`} onClick={()=>setStoryLen(l.value)}>
                        {l.label} <span style={{opacity:.6,fontWeight:400}}>({l.desc})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divider" />

                {/* Characters */}
                <div>
                  <div className="section-label" style={{marginBottom:8}}>👥 Anyone else in it? <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--dimmer)",fontSize:10}}>(optional)</span></div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {CHAR_TYPES.map(t => (
                      <button key={t.value}
                        style={{display:"flex",alignItems:"center",gap:6,padding:"8px 13px",borderRadius:11,cursor:"pointer",fontSize:12,fontWeight:700,
                          border:`1.5px solid ${quickChars.includes(t.value)?"rgba(76,200,144,.5)":"rgba(255,255,255,.12)"}`,
                          background:quickChars.includes(t.value)?"rgba(76,200,144,.12)":"rgba(255,255,255,.04)",
                          color:quickChars.includes(t.value)?"#80d8a8":"var(--dim)",transition:"all .18s"}}
                        onClick={()=>setQuickChars(qs=>qs.includes(t.value)?qs.filter(q=>q!==t.value):[...qs,t.value])}>
                        <span style={{fontSize:18}}>{t.icon}</span> {t.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {error && <div className="err-box" style={{marginBottom:8}}>⚠️ {error}</div>}
            <button className="btn" style={{marginBottom:10}} onClick={()=>{
              const chars = quickChars.map(v => ({...newChar(), type:v}));
              generate({extraChars:chars, occasion:"", occasionCustom:"", lessons:[], adventure:false, storyGuidance:"", storyMood:"", storyPace:"normal", storyStyle:"standard", heroTraits:[]});
            }}>
              ✨ Make {heroName}'s story!
            </button>
            <div style={{textAlign:"center",fontSize:12,color:"var(--dimmer)",cursor:"pointer"}}
              onClick={()=>setStage("builder")}>
              Want more control? → Build My Story
            </div>
          </div>
        )}
        {/* BUILDER */}
        {stage==="builder" && (
          <div className="screen">
            <div className="brand-row">
              <button className="btn-ghost" style={{fontSize:12,padding:"6px 12px",marginRight:8}} onClick={()=>setStage("home")}>← Back</button>
              <div className="brand-gem">🌙</div>
              <div>
                <div className="brand-name" style={{fontSize:16}}>{heroName}'s Story</div>
                <div className="brand-tag">Build your adventure</div>
              </div>
            </div>
            <div style={{height:10}} />

            <div className="card" style={{marginBottom:10}}>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* ── Main prompt ── */}
                <div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,color:"var(--cream)",marginBottom:8}}>
                    What should be in tonight's story?
                  </div>
                  <textarea className="ftarea" rows={3}
                    placeholder="e.g. 'Lily had a rough day at school' or 'add a talking dog' or 'something funny happens at bedtime'…"
                    value={storyGuidance} onChange={e=>setStoryGuidance(e.target.value)} maxLength={500} />

                  <div style={{fontSize:10,color:"rgba(190,200,240,.75)",margin:"8px 0 4px",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>Today's moments</div>
                  <div className="guidance-chips" style={{marginBottom:8}}>
                    {["😟 Hard day","🆕 Tried something new","👋 Made a new friend","😬 Feeling nervous","🎉 Something exciting","😤 Had a disagreement"].map(chip => (
                      <button key={chip} className="guidance-chip"
                        onClick={()=>setStoryGuidance(g=>(g?g+", ":"")+chip.replace(/^\S+ /,""))}>
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div style={{fontSize:10,color:"rgba(190,200,240,.75)",margin:"4px 0 4px",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>Story ingredients</div>
                  <div className="guidance-chips" style={{marginBottom:8}}>
                    {["😂 Make it funny","🐾 Talking animal","🌙 Sleepy ending","🔮 Surprise twist","🐉 Add a dragon","🎲 Surprise me"].map(chip => (
                      <button key={chip} className="guidance-chip"
                        onClick={()=>setStoryGuidance(g=>(g?g+", ":"")+chip.replace(/^\S+ /,""))}>
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div style={{fontSize:10,color:"rgba(190,200,240,.75)",margin:"4px 0 4px",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>Sneak in a lesson</div>
                  <div className="guidance-chips">
                    {[...LESSONS_CHARACTER,...LESSONS_EMOTIONAL].map(l => (
                      <button key={l.value} className={`guidance-chip${lessons.includes(l.value)?" on":""}`}
                        onClick={()=>setLessons(ls=>ls.includes(l.value)?ls.filter(x=>x!==l.value):[...ls,l.value])}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divider" />

                {/* ── Characters ── */}
                <div>
                  <div className="section-label" style={{marginBottom:8}}>👥 Who's in the story with {heroName}?</div>
                  {extraChars.length<4 && (
                    <div style={{marginBottom:extraChars.length?10:0}}>
                      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                        {CHAR_TYPES.map(t => (
                          <button key={t.value} className="char-add-pill"
                            onClick={()=>setExtraChars(cs=>[...cs,{...newChar(),type:t.value}])}>
                            <span className="char-add-pill-icon">{t.icon}</span>
                            <span>+ {t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {extraChars.length>0 && (
                    <div className="char-simple-list">
                      {extraChars.map(c => (
                        <div className="char-simple-row" key={c.id}>
                          <div className="char-photo" style={{width:34,height:34,fontSize:16,borderRadius:8,flexShrink:0}} onClick={()=>pickPhoto(c.id)}>
                            {c.photo ? <img src={c.photo.preview} alt={c.name} /> : <span>{CHAR_ICONS[c.type]||"👫"}</span>}
                          </div>
                          <input className="char-name-in" placeholder={`${CHAR_TYPES.find(t=>t.value===c.type)?.label||"Friend"}'s name…`}
                            value={c.name} maxLength={16} style={{flex:1}}
                            onChange={e=>updateExtraChar(c.id,{name:e.target.value})} />
                          <button className="btn-danger" style={{flexShrink:0}} onClick={()=>removeExtraChar(c.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="divider" />

                {/* ── Settings strip ── */}
                <div>
                  <div className="section-label" style={{marginBottom:8}}>📖 Story settings</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {AGES.map(a => (
                      <button key={a.value} className={`pill${ageGroup===a.value?" on":""}`} onClick={()=>setAgeGroup(a.value)}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <div className="pill-row" style={{marginTop:8}}>
                    {LENGTHS.map(l => (
                      <button key={l.value} className={`pill${storyLen===l.value?" on":""}`} onClick={()=>setStoryLen(l.value)}>
                        {l.label} <span style={{opacity:.6,fontWeight:400}}>({l.desc})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divider" />

                {/* ── More options toggle ── */}
                <div>
                  <button style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:12,
                    padding:"10px 14px",cursor:"pointer",color:"var(--dim)",fontSize:13,fontWeight:700}}
                    onClick={()=>setMoreOpen(o=>!o)}>
                    <div style={{textAlign:"left"}}>
                      <div style={{color:"var(--cream)"}}>✨ More options</div>
                      <div style={{fontSize:10,fontWeight:400,color:"var(--dimmer)",marginTop:2}}>Special night · mood · style · {heroName}'s personality</div>
                    </div>
                    <span style={{fontSize:12,transition:"transform .25s",transform:moreOpen?"rotate(180deg)":"none"}}>▼</span>
                  </button>

                  {moreOpen && (
                    <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:14}}>

                      {/* Special night */}
                      <div>
                        <div className="section-label" style={{marginBottom:6}}>🎉 Is tonight a special night? <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"rgba(190,200,240,.65)",fontSize:10}}>(optional)</span></div>
                        <input className="finput" style={{fontSize:13}}
                          placeholder="e.g. Birthday, 1st day of school tomorrow, lost a tooth, new baby…"
                          value={occasionCustom} onChange={e=>setOccasionCustom(e.target.value)} maxLength={120} />
                      </div>

                      <div className="divider" />

                      {/* Mood */}
                      <div>
                        <div className="section-label" style={{marginBottom:8}}>🌡️ Tonight's mood</div>
                        <div className="les-pills">
                          {[{v:"calm",l:"🌙 Calm & cosy"},{v:"silly",l:"😂 Silly & funny"},{v:"exciting",l:"⚡ Exciting"},{v:"heartfelt",l:"💛 Warm & heartfelt"}].map(o => (
                            <button key={o.v} className={`les-pill${storyMood===o.v?" on":""}`}
                              onClick={()=>setStoryMood(storyMood===o.v?"":o.v)}>{o.l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="divider" />

                      {/* Pace */}
                      <div>
                        <div className="section-label" style={{marginBottom:8}}>💤 Narration pace</div>
                        <div className="les-pills">
                          {[{v:"normal",l:"Normal"},{v:"sleepy",l:"😴 Extra sleepy"},{v:"snappy",l:"⚡ Quick & snappy"}].map(o => (
                            <button key={o.v} className={`les-pill${storyPace===o.v?" on":""}`}
                              onClick={()=>setStoryPace(o.v)}>{o.l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="divider" />

                      {/* Story style */}
                      <div>
                        <div className="section-label" style={{marginBottom:8}}>📚 Story style</div>
                        <div className="les-pills">
                          {[{v:"standard",l:"Standard"},{v:"rhyming",l:"🎵 Rhyming"},{v:"adventure",l:"🔀 Choose-your-adventure"},{v:"mystery",l:"🔍 Mystery"}].map(o => (
                            <button key={o.v} className={`les-pill${storyStyle===o.v?" on":""}`}
                              onClick={()=>setStoryStyle(o.v)}>{o.l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="divider" />

                      {/* Hero personality */}
                      <div>
                        <div className="section-label" style={{marginBottom:8}}>✨ {heroName} is… <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--dimmer)",fontSize:10}}>(optional)</span></div>
                        <div className="les-pills">
                          {["Brave","Silly","Curious","Kind","Adventurous","Shy","Clever","Caring"].map(t => (
                            <button key={t} className={`les-pill${heroTraits.includes(t)?" on":""}`}
                              onClick={()=>setHeroTraits(ts=>ts.includes(t)?ts.filter(x=>x!==t):[...ts,t])}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            </div>

            {error && <div className="err-box" style={{marginBottom:8}}>⚠️ {error}</div>}
            <button className="btn" style={{marginBottom:16}} onClick={()=>generate()}>
              ✨ Make {heroName}'s story!
            </button>
          </div>
        )}
        {/* GENERATING */}
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
              {pageIdx >= 1 && (
                <button className={`ctrl-btn read${isReading?" active":""}`}
                  onClick={()=>{ const prog=totalPages>1?pageIdx/(totalPages-1):0.5; toggleRead(getCurrentPageText(),prog); }}>
                  {isReading ? "⏸ Pause" : voiceId ? "🎤 Read aloud" : "🔊 Read aloud"}
                </button>
              )}
              <button className="ctrl-btn save" onClick={async()=>{ await saveMemory(book); setStage("memories"); }}>
                💾 Save
              </button>
              <button className="ctrl-btn fresh" onClick={async()=>{
                const s = makeStorySeed(heroName,theme,extraChars,occasion,occasionCustom,lesson,adventure,storyLen,heroGender,heroClassify,storyGuidance);
                await sDel(`book_${s}`);
                window.speechSynthesis?.cancel();
                if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current=null; }
                autoReadRef.current = false;
                setStage("home"); setBook(null); setChosenPath(null); setIsReading(false);
              }}>🔄 New</button>
              <button className="ctrl-btn dl" onClick={downloadStory}>📄 Download</button>
              <button className={`ctrl-btn vc-btn${voiceId?" active":""}`}
                onClick={()=>{ setVcStage(voiceId?"ready":"idle"); setShowVcModal(true); }}>
                🎤 {voiceId ? "Voice ✓" : "My Voice"}
              </button>
            </div>

            {/* ── Voice Clone Modal ── */}
            {showVcModal && (
              <div className="vc-modal" onClick={e=>{ if(e.target===e.currentTarget){ cancelRecording(); setShowVcModal(false); } }}>
                <div className="vc-card">
                  <div className="vc-title">🎤 Use Your Voice</div>
                  <div className="vc-sub">
                    Read the script below into your microphone — SleepSeed will learn your voice and narrate every story. ✨
                  </div>

                  {/* Script always visible in idle, error, and recording states */}
                  {(vcStage==="idle"||vcStage==="error"||vcStage==="recording") && (
                    <>
                      <div className="vc-script-label">
                        {vcStage==="recording" ? "🔴 Recording — keep reading at a calm, warm pace:" : "Read this aloud — warmly and clearly:"}
                      </div>
                      <div className="vc-script" style={{opacity:vcStage==="recording"?1:1,transition:"opacity .3s"}}>
                        Once upon a time, in a land where the stars came out to play, a little child looked up at the sky and smiled. "Good evening," said the moon. "Are you ready for tonight's adventure?" And the child, heart full of wonder, whispered: "I'm always ready." So together they set off into the most magical night imaginable, where every shadow hid a friendly surprise, and every sound was the beginning of a brand new story. The trees whispered secrets. The fireflies wrote messages in the dark. And somewhere, not too far away, something wonderful was waiting — just for them.
                      </div>

                      {vcStage==="recording" ? (
                        <div style={{marginBottom:8}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                            <div style={{fontSize:11,color:"var(--dim)"}}>
                              {vcSeconds < 15 ? "Keep going — aim for 30 seconds" : vcSeconds < 30 ? "Great! A little more…" : "✓ Ready to stop"}
                            </div>
                            <div style={{fontSize:22,fontFamily:"monospace",fontWeight:700,color:"var(--gold2)",letterSpacing:1}}>
                              {String(Math.floor(vcSeconds/60)).padStart(2,"0")}:{String(vcSeconds%60).padStart(2,"0")}
                            </div>
                          </div>
                          <div style={{height:4,background:"rgba(255,255,255,.08)",borderRadius:99,marginBottom:14,overflow:"hidden"}}>
                            <div style={{height:"100%",borderRadius:99,background:"var(--gold2)",width:`${Math.min(100,(vcSeconds/60)*100)}%`,transition:"width 1s linear"}} />
                          </div>
                          <button className="btn" style={{marginBottom:8}} onClick={stopRecording}>
                            ⏹ Stop &amp; Use This Recording
                          </button>
                          <button className="btn-ghost" style={{width:"100%",fontSize:12}} onClick={cancelRecording}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{fontSize:11,color:"var(--dim)",marginBottom:14,lineHeight:1.6}}>
                            🎧 <strong style={{color:"var(--cream)"}}>Tips:</strong> Quiet room · calm bedtime pace · aim for 30–60 seconds
                          </div>
                          {vcError && <div style={{fontSize:11,color:"#f09080",marginBottom:10,lineHeight:1.5}}>{vcError}</div>}
                          <button className="btn" style={{marginBottom:8}} onClick={startRecording}>
                            🔴 Start Recording
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
                    </>
                  )}

                  {vcStage==="uploading" && (
                    <div style={{textAlign:"center",padding:"24px 0"}}>
                      <div style={{fontSize:36,marginBottom:12}}>✨</div>
                      <div className="vc-status">Learning your voice…</div>
                      <div style={{fontSize:11,color:"var(--dimmer)",marginTop:6}}>This takes about 15 seconds</div>
                    </div>
                  )}

                  {vcStage==="ready" && (
                    <>
                      <div style={{textAlign:"center",padding:"16px 0 12px"}}>
                        <div style={{fontSize:40,marginBottom:8}}>🎉</div>
                        <div className="vc-status" style={{color:"var(--green2)"}}>Your voice is ready!</div>
                        <div style={{fontSize:11,color:"var(--dim)",marginTop:6}}>Every story will now be read in your voice.</div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button className="btn" style={{flex:1,padding:11,fontSize:14}} onClick={()=>setShowVcModal(false)}>
                          Done ✓
                        </button>
                        <button className="btn-ghost" style={{flex:1,padding:11,fontSize:13}} onClick={()=>{ setVcStage("idle"); setVcSeconds(0); }}>
                          Re-record
                        </button>
                      </div>
                      <button className="btn-ghost" style={{width:"100%",fontSize:12,marginTop:8}} onClick={resetVoice}>
                        🗑 Remove voice
                      </button>
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
