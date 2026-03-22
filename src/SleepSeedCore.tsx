import { useState, useRef, useCallback, useEffect } from "react";
import SleepSeedLibrary from "./sleepseed-library";
import { buildStoryPrompt } from "./sleepseed-prompts";
import { StoryFeedback, RereadCheck } from "./StoryFeedback";
import { saveStory as dbSaveStory, saveNightCard as dbSaveNightCard } from "./lib/storage";
import { getSceneByVibe } from "./lib/storyScenes";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400;1,9..144,600&family=Cormorant+Garamond:ital,wght@1,600&family=Patrick+Hand&family=Nunito:wght@400;600;700&family=Kalam:wght@400;700&display=swap');`;

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
@keyframes fadeUp{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
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
.ftarea::placeholder{color:rgba(175,185,225,.7)}
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
  height:520px;position:relative;background:#0e1428;cursor:pointer}
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
.story-illo{flex:0 0 36%;position:relative;overflow:hidden;background:linear-gradient(160deg,#e8ddb0,#d4c890)}
.story-txt-col{flex:1;min-height:0;padding:14px 18px 10px;display:flex;flex-direction:column;
  background:linear-gradient(160deg,#fef8e8,#f5e8c0);overflow-y:auto}
.story-txt-col::-webkit-scrollbar{width:3px}
.story-txt-col::-webkit-scrollbar-thumb{background:rgba(90,56,10,.15);border-radius:99px}
.s-pgnum{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3);margin-bottom:7px;flex-shrink:0}
.s-text{font-family:'Patrick Hand',cursive;font-size:clamp(18px,3.8vw,20px);color:var(--ink);line-height:1.75;flex:1;min-height:0;overflow-y:auto}
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
.nc-bg{background:linear-gradient(160deg,#0a0e24,#101838,#0c1430)}
.nc-lay{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:28px 24px;text-align:center}
.nc-emoji{font-size:42px;animation:mfloat 5s ease-in-out infinite}
.nc-label{font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(212,160,48,.6)}
.nc-headline{font-family:'Fraunces',serif;font-size:clamp(18px,4.5vw,24px);font-weight:700;font-style:italic;
  color:var(--gold3);line-height:1.3;max-width:300px}
.nc-divider{width:40px;height:2px;background:linear-gradient(90deg,transparent,rgba(212,160,48,.45),transparent);margin:4px 0}
.nc-quote{font-family:'Cormorant Garamond',serif;font-size:clamp(14px,3.2vw,17px);font-style:italic;font-weight:600;
  color:rgba(240,220,160,.85);line-height:1.7;max-width:320px}
.nc-hero{font-size:11px;color:var(--dimmer);font-weight:700;font-style:italic}
.nc-reflect{background:rgba(160,120,255,.08);border:1px solid rgba(160,120,255,.2);border-radius:12px;
  padding:10px 14px;margin-top:4px;width:100%;max-width:320px}
.nc-reflect-label{font-size:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:rgba(160,120,255,.6);margin-bottom:5px}
.nc-reflect-q{font-family:'Kalam',cursive;font-size:13px;color:rgba(200,180,255,.85);line-height:1.6}
.nc-date{font-size:10px;color:var(--dimmer);margin-top:4px}
.nc-brand{font-family:'Fraunces',serif;font-size:11px;color:rgba(212,160,48,.35);margin-top:2px}
.mem-tabs{display:flex;gap:4px;margin-bottom:14px;background:rgba(255,255,255,.04);border-radius:12px;padding:3px;
  border:1px solid rgba(255,255,255,.07)}
.mem-tab{flex:1;padding:9px 12px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;
  text-align:center;color:var(--dim);background:transparent;border:none;font-family:'Nunito',sans-serif;transition:all .2s}
.mem-tab.on{background:rgba(212,160,48,.12);color:var(--gold2)}
.mem-tab:hover:not(.on){color:var(--cream);background:rgba(255,255,255,.05)}
.nc-flow{width:100%;max-width:420px;animation:fup .5s cubic-bezier(.16,1,.3,1) both}
.nc-step-dots{display:flex;gap:6px;justify-content:center;margin-bottom:18px}
.nc-sdot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.15);transition:all .3s}
.nc-sdot.active{background:var(--gold2);transform:scale(1.3)}
.nc-sdot.done{background:var(--green2)}
.nc-step-card{background:linear-gradient(150deg,rgba(22,32,84,.72),rgba(11,18,42,.88));
  border:1px solid rgba(212,160,48,.15);border-radius:22px;padding:26px;
  backdrop-filter:blur(20px);box-shadow:0 20px 64px rgba(0,0,0,.55);animation:fup .4s ease both}
.nc-step-icon{font-size:36px;text-align:center;margin-bottom:8px}
.nc-step-title{font-family:'Fraunces',serif;font-size:18px;font-weight:700;color:var(--cream);
  text-align:center;margin-bottom:4px}
.nc-step-sub{font-size:12px;color:var(--dim);text-align:center;line-height:1.7;margin-bottom:16px}
.nc-step-q{font-family:'Fraunces',serif;font-size:14px;font-style:italic;color:var(--gold3);
  text-align:center;line-height:1.6;margin-bottom:14px;padding:0 8px}
.nc-camera{width:100%;aspect-ratio:4/3;border-radius:14px;overflow:hidden;background:#0a0e24;
  position:relative;margin-bottom:14px}
.nc-camera video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
.nc-camera img{width:100%;height:100%;object-fit:cover}
.nc-countdown{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.5);font-family:'Fraunces',serif;font-size:72px;font-weight:700;
  color:var(--gold3);animation:countPop .4s ease}
@keyframes countPop{from{transform:scale(1.8);opacity:0}to{transform:scale(1);opacity:1}}
.polaroid{background:#faf8f2;border-radius:4px;padding:14px 14px 28px;
  box-shadow:0 8px 40px rgba(0,0,0,.5);transform:rotate(-2deg);
  max-width:320px;margin:0 auto;animation:polaroidIn 1.2s cubic-bezier(.16,1,.3,1) both}
@keyframes polaroidIn{from{opacity:0;transform:scale(.75) rotate(-10deg)}to{opacity:1;transform:scale(1) rotate(-2deg)}}
.polaroid-photo{width:100%;aspect-ratio:4/3;border-radius:2px;overflow:hidden;
  background:linear-gradient(135deg,#1a1428,#2a1f3d);margin-bottom:14px}
.polaroid-photo img{width:100%;height:100%;object-fit:cover}
.polaroid-emoji{display:flex;align-items:center;justify-content:center;font-size:48px;
  width:100%;height:100%;background:linear-gradient(135deg,#0a0e24,#14204a)}
.polaroid-body{text-align:center}
.polaroid-headline{font-family:'Fraunces',serif;font-size:16px;font-weight:700;font-style:italic;
  color:#2a1f0a;margin-bottom:4px;animation:fadeUp .5s ease .5s both}
.polaroid-quote{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;
  color:#5a4a2a;line-height:1.6;margin-bottom:6px;animation:fadeUp .5s ease .8s both}
.polaroid-memory{font-family:'Kalam',cursive;font-size:12px;color:#7a5a2a;line-height:1.5;
  margin-bottom:8px;animation:fadeUp .5s ease 1.1s both}
.polaroid-meta{font-size:9px;color:#a08a5a;animation:fadeUp .5s ease 1.4s both}
.polaroid-brand{font-family:'Fraunces',serif;font-size:10px;color:#c0a870;margin-top:4px;
  animation:fadeUp .5s ease 1.6s both}
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
const DEMO_BOOK = {
  title:"The Stone in Her Pocket",
  heroName:"Adina",
  coverUrl:"https://image.pollinations.ai/prompt/a%20small%20girl%20walking%20home%20from%20school%20holding%20a%20smooth%20grey%20stone%2C%20autumn%20afternoon%2C%20warm%20golden%20light%20through%20the%20trees%2C%20children%27s%20picture%20book%20watercolor%2C%20cosy%20and%20warm?width=520&height=220&nologo=true&model=turbo&seed=42&nofeed=true",
  refrain:"That wasn\u2019t you, Adina.",
  parentNote:"Tonight\u2019s story sat quietly with the feeling of carrying words that hurt. The stone in Adina\u2019s pocket is something she already understands in her body, even if she can\u2019t say it yet. Tomorrow, if she seems to be still carrying something, you could try: \u201CHey. Want to put any stones on the windowsill tonight?\u201D She\u2019ll know what you mean.",
  allChars:[
    {id:"h1",name:"Adina",type:"hero",gender:"girl",classify:""},
    {id:"c1",name:"Rabbit",type:"toy",gender:"",classify:"rabbit"},
  ],
  pages:[
    {text:"At lunch today, Mia said something.\n\nIt wasn\u2019t a nice something.\n\nOn the way home, Adina found a stone on the path.\n\nSmooth and grey and heavy.\n\nShe put it in her pocket. It seemed right.", imgUrl:"https://image.pollinations.ai/prompt/a%20small%20girl%20picking%20up%20a%20smooth%20grey%20stone%20from%20a%20path%2C%20school%20bag%20on%20her%20back%2C%20autumn%20leaves%2C%20golden%20afternoon%20light%2C%20children%27s%20watercolor?width=400&height=190&nologo=true&model=turbo&seed=43&nofeed=true"},
    {text:"That night, Adina sat on her bed.\n\nShe didn\u2019t say anything.\n\nRabbit looked at the stone on the pillow.\n\nRabbit looked at Adina.\n\n\u201CThat wasn\u2019t you,\u201D said Rabbit.\n\nAdina looked up.\n\n\u201CWhatever Mia said. That wasn\u2019t you, Adina.\u201D", imgUrl:"https://image.pollinations.ai/prompt/a%20small%20girl%20sitting%20on%20her%20bed%20holding%20a%20grey%20stone%2C%20a%20stuffed%20rabbit%20beside%20her%2C%20warm%20lamplight%2C%20cosy%20bedroom%2C%20watercolor?width=400&height=190&nologo=true&model=turbo&seed=44&nofeed=true"},
    {text:"Adina held the stone.\n\nIt was still heavy.\n\n\u201CBut what IS me?\u201D she asked.\n\n\u201CThis morning,\u201D said Rabbit, \u201Cyou saved a worm from the puddle.\u201D\n\n\u201CI didn\u2019t want it to drown,\u201D said Adina.\n\n\u201CI know,\u201D said Rabbit. \u201CThat\u2019s the point.\u201D", imgUrl:"https://image.pollinations.ai/prompt/a%20child%20rescuing%20a%20worm%20from%20a%20puddle%20in%20the%20morning%2C%20school%20uniform%2C%20gentle%20concentration%2C%20children%27s%20book%20watercolor%2C%20warm?width=400&height=190&nologo=true&model=turbo&seed=45&nofeed=true"},
    {text:"The stone felt a tiny bit lighter.\n\nJust a tiny bit.\n\n\u201CWhat else?\u201D said Adina.\n\n\u201CYou let the new boy sit with you. He looked like he didn\u2019t know where to go.\u201D\n\n\u201CTHAT,\u201D said Rabbit, very firmly, \u201Cwas very much you.\u201D", imgUrl:"https://image.pollinations.ai/prompt/two%20children%20sitting%20together%20at%20lunch%2C%20one%20welcoming%20the%20other%2C%20school%20canteen%2C%20warm%20light%2C%20cheerful%20children%27s%20book%20watercolor?width=400&height=190&nologo=true&model=turbo&seed=46&nofeed=true"},
    {text:"\u201CWhat about the thing Mia said?\u201D asked Adina. \u201CShe said it right in front of everyone.\u201D\n\nRabbit was quiet for a moment.\n\n\u201CThat must have felt awful,\u201D said Rabbit.\n\n\u201CIt did,\u201D said Adina, very quietly.\n\n\u201CBut her words are her stone. Not yours. You don\u2019t have to carry it.\u201D\n\nThat wasn\u2019t you, Adina.", imgUrl:"https://image.pollinations.ai/prompt/a%20small%20girl%20and%20stuffed%20rabbit%20having%20a%20serious%20conversation%20on%20a%20bed%2C%20warm%20bedroom%2C%20moonlight%20beginning%2C%20tender%20children%27s%20watercolor?width=400&height=190&nologo=true&model=turbo&seed=47&nofeed=true"},
    {text:"Adina looked at the stone in her hand.\n\nShe walked to the window.\n\nThe moon was out.\n\nShe put the stone on the windowsill, right in the moonlight.\n\nShe didn\u2019t put it back in her pocket.\n\nShe left it there.", imgUrl:"https://image.pollinations.ai/prompt/a%20child%20placing%20a%20stone%20on%20a%20moonlit%20windowsill%2C%20peaceful%20expression%2C%20night%20sky%20visible%2C%20warm%20bedroom%20glow%2C%20children%27s%20watercolor?width=400&height=190&nologo=true&model=turbo&seed=48&nofeed=true"},
    {text:"She got back into bed.\n\nHer shoulders felt different. Lower. Softer.\n\nLike something had been put down.\n\n\u201CRabbit?\u201D\n\n\u201CYes?\u201D\n\n\u201CThat wasn\u2019t me, was it.\u201D\n\nIt was not a question anymore.\n\n\u201CNo,\u201D said Rabbit. \u201CIt really, truly wasn\u2019t.\u201D", imgUrl:"https://image.pollinations.ai/prompt/a%20small%20girl%20back%20in%20bed%20looking%20relaxed%2C%20stuffed%20rabbit%20beside%20her%2C%20stone%20visible%20on%20windowsill%20in%20moonlight%2C%20children%27s%20watercolor?width=400&height=190&nologo=true&model=turbo&seed=49&nofeed=true"},
    {text:"The room was very quiet.\n\nThe moon shone on the stone.\n\nAdina\u2019s pocket was empty now.\n\nThat was a good feeling.\n\nA light feeling.\n\nExactly the right feeling.", imgUrl:"https://image.pollinations.ai/prompt/a%20cosy%20bedroom%20at%20night%2C%20moonlight%20on%20a%20stone%20on%20a%20windowsill%2C%20child%20sleepy%20in%20bed%2C%20warm%20and%20peaceful%2C%20children%27s%20watercolor?width=400&height=190&nologo=true&model=turbo&seed=50&nofeed=true"},
    {text:"That wasn\u2019t you, Adina.\n\nShe pulled the covers all the way up to her chin.\n\nThe stone glowed softly in the moonlight, right where she had left it.\n\nAnd Adina \u2014 all the brave, kind, worm-saving, lonely-boy-noticing parts of Adina \u2014 closed her eyes, and let go, and drifted into the deepest, warmest, most entirely-herself sleep she had had in a very long time.", imgUrl:"https://image.pollinations.ai/prompt/a%20child%20asleep%20in%20a%20cosy%20bed%2C%20stuffed%20rabbit%20tucked%20in%20beside%20her%2C%20stone%20glowing%20on%20windowsill%20in%20moonlight%2C%20final%20page%20watercolor%2C%20peaceful?width=400&height=190&nologo=true&model=turbo&seed=51&nofeed=true"},
  ],
};

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
  {value:"short",   label:"Short Story",   target:8,  advSetup:4, advRes:3, desc:"~3 min"},
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
\u2022 The refrain MUST appear three times: page 2 (introduction), the middle page (a variation \u2014 different character says it, or it goes slightly wrong), and the LAST page (warm, closing). The refrain at this age must be 3\u20135 words. No more. Simple enough that a 3-year-old can say it out loud.
\u2022 Page count: follow the chosen story length (short=8, standard=8, long=10). At this age shorter is ALWAYS better \u2014 never exceed 10 pages regardless of length setting.

HERO AGENCY: Even at 3\u20134, ${name} must DO something \u2014 not watch. They press the button. They say the magic word. They share the thing. One tiny action by ${name} changes everything.

ONE TRUE THING: Include one tiny moment a 3-year-old would recognise from their own life \u2014 losing something and finding it, not wanting to share and then doing it anyway, being scared of something small. Never name it as a lesson. Just let it happen.

TONE: Always safe. Always warm. The ending must feel like a hug. The DEFAULT tone is very silly — SPLAT. BOING. WHOOSH. Characters say "Oh no!" and "Uh oh!" and things fall over hilariously. BUT: if the story premise is tender or emotional (missing someone, first day of something, a worried feeling), lead with warmth and gentleness instead. Silly and safe are not the same thing — a story can be entirely gentle without a sound word and still be perfect for this age.`},

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

VOCABULARY: Rich vocabulary welcomed. 1\u20132 genuinely interesting words per page \u2014 the kind children will use tomorrow to impress someone. Sentences of 10\u201320 words on journey pages. Short punchy sentences (5\u20137 words) for high-tension moments \u2014 contrast is everything. Paragraphs of 3\u20134 sentences are fine on journey pages, but vary length deliberately: a long winding sentence followed by a short one. Never three consecutive sentences the same length.

STRUCTURE \u2014 model: Roald Dahl (Fantastic Mr Fox), A.A. Milne (Winnie-the-Pooh), E.B. White (Charlotte's Web):
\u2022 REVELATION ENDING: The twist must recontextualise the entire story \u2014 not just surprise, but make the reader see everything differently. Plant the clue no later than page 3.
\u2022 EMOTIONAL TURN: At least one moment where something genuinely difficult happens \u2014 real doubt, a mistake with consequences, something that matters. Then a resolution that feels earned, not given.
\u2022 SECONDARY CHARACTER ARC: One supporting character has their own small journey that intersects with ${name}'s at the climax in an unexpected way.
\u2022 Characters have genuine contradictions AND growth: someone starts wrong about something important and ends changed.
\u2022 Page count: follow the chosen story length (short=8, standard=12, long=16). Clue in first 25% of pages. Emotional turn at 65\u201375% through. Revelation on penultimate page. Final page is always the sleep landing.

HERO AGENCY (critical): ${name} must face a moment where the easy path is genuinely tempting \u2014 and choose the harder, right thing instead. The reader must feel the weight of that choice.

ONE TRUE THING: One moment should feel so emotionally true that it could only have been written for THIS child on THIS night. The feeling of being small in a big world and discovering you are braver than you thought.

TONE: Intelligent, funny, and emotionally honest. Not condescending. The best moment should make both the child AND the parent feel something real.

BEDTIME GUARD: No matter how sophisticated the structure, this is still a bedtime story. The emotional complexity earns its place only if it resolves completely and lands in warmth and sleep. A 9-year-old reading this at 9pm should feel satisfied, seen, and sleepy — not stimulated or unsettled.`},
];
const CHAR_ICONS = {hero:"⭐",friend:"👫",sibling:"👶",parent:"🧑‍🍼",pet:"🐾",toy:"🧸"};
const BONDING_QUESTIONS = [
  "If you could be any animal for one day, what would you be?",
  "What's the silliest dream you can remember?",
  "If you had a superpower, what would it be and why?",
  "What made you smile today?",
  "If you could go anywhere in the world tonight, where would you go?",
  "What's something you're really good at that not many people know?",
  "If your toys could talk, what would they say about you?",
  "What's the best thing about being you?",
  "If you could have dinner with anyone — real or made-up — who would it be?",
  "What's one thing you wish grown-ups understood better?",
  "If you built a secret hideout, what would be inside it?",
  "What's the nicest thing someone did for you recently?",
];
const PRESET_VOICES = [
  {id:"iCrDUkL56s3C8sCRl7wb", name:"Hope",          emoji:"🎙️", desc:"Warm & clear"},
  {id:"NOpBlnGInO9m6vDvFkFC", name:"Spuds Oxley",   emoji:"🎭", desc:"Rich & deep"},
  {id:"4YYIPFl9wE5c4L2eu2Gb", name:"Burt Reynolds", emoji:"🤠", desc:"Smooth & warm"},
  {id:"Atp5cNFg1Wj5gyKD7HWV", name:"Natasha",       emoji:"✨", desc:"Clear & bright"},
  {id:"eadgjmk4R4uojdsheG9t", name:"Chadwich",      emoji:"🎙️", desc:"Bold & rich"},
  {id:"bIQlQ61Q7WgbyZAL7IWj", name:"Faith",         emoji:"🌸", desc:"Warm & gentle"},
];
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

const ILLO_STYLE = "Micha Archer style picture book illustration. Vibrant layered folk-art textures, bold patterned fabrics, rich warm earthy palette, glowing soft light, collage-like painterly depth, whimsical and heartfelt, award-winning children's book quality. Fill the full image area. No text, no borders, no watermarks.";

const CHILD_GIRL = "young girl, warm brown skin, curly dark hair in soft ponytail with colorful ribbon, big expressive eyes, gentle smile, cozy patterned nightgown";
const CHILD_BOY  = "young boy, warm brown skin, short curly dark hair, big expressive eyes, gentle smile, cozy striped pyjamas";

// Model fallback chain — best quality first. If a model returns a server error
// (500/503), the next model is tried automatically.
const ILLO_MODELS = ["flux-pro", "flux", "turbo"];

const _illoBaseUrl = (prompt, seed, w, h, model) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&model=${model}&seed=${seed}&nofeed=true`;

const illoUrl = (prompt, seed, w=480, h=220, gender="") => {
  const child = gender === "boy" ? CHILD_BOY : CHILD_GIRL;
  const full  = `${prompt}. Child character: ${child}. ${ILLO_STYLE}`;
  // Return the best-model URL; fallback happens in preloadImgWithFallback below
  return _illoBaseUrl(full, seed, w, h, ILLO_MODELS[0]);
};

// Store the resolved full prompt per URL so fallback can rebuild with next model
const _illoPromptCache = new Map<string, {prompt:string,seed:number,w:number,h:number}>();

const illoUrlTracked = (prompt, seed, w=480, h=220, gender="") => {
  const child = gender === "boy" ? CHILD_BOY : CHILD_GIRL;
  const full  = `${prompt}. Child character: ${child}. ${ILLO_STYLE}`;
  const url   = _illoBaseUrl(full, seed, w, h, ILLO_MODELS[0]);
  _illoPromptCache.set(url, {prompt:full, seed, w, h});
  return url;
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
// User-scoped key — prevents data leaking between users on the same device
const userKey = (k: string, uid?: string) => uid ? `ss9_u_${uid}_${k}` : S_PFX + k;
const sGet = async (k, uid?) => { try { const v=localStorage.getItem(userKey(k,uid)); return v?JSON.parse(v):null; } catch { return null; } };
const sSet = async (k,v,uid?) => { try { localStorage.setItem(userKey(k,uid),JSON.stringify(v)); } catch {} };
const sDel = async (k,uid?) => { try { localStorage.removeItem(userKey(k,uid)); } catch {} };

/* ── Preload cache ── */
const _imgCache = new Map();
const preloadImg = (url, onLoad, onErr) => {
  // Resolve which model fallback to try
  const meta = _illoPromptCache.get(url);

  const tryModel = (modelIdx: number, currentUrl: string) => {
    if(_imgCache.has(currentUrl)){
      const img=_imgCache.get(currentUrl);
      if(img.complete && img.naturalWidth>0){ onLoad?.(currentUrl); return img; }
      const prevLoad = img.onload;
      const prevErr  = img.onerror;
      img.onload  = () => { prevLoad?.(); onLoad?.(currentUrl); };
      img.onerror = () => {
        prevErr?.();
        // Try next model in chain
        if(meta && modelIdx + 1 < ILLO_MODELS.length){
          const nextUrl = _illoBaseUrl(meta.prompt, meta.seed, meta.w, meta.h, ILLO_MODELS[modelIdx+1]);
          _illoPromptCache.set(nextUrl, meta);
          tryModel(modelIdx+1, nextUrl);
        } else {
          onErr?.(currentUrl);
        }
      };
      return img;
    }

    const img = new window.Image();
    img.onload  = () => { onLoad?.(currentUrl); };
    img.onerror = () => {
      if(meta && modelIdx + 1 < ILLO_MODELS.length){
        const nextUrl = _illoBaseUrl(meta.prompt, meta.seed, meta.w, meta.h, ILLO_MODELS[modelIdx+1]);
        _illoPromptCache.set(nextUrl, meta);
        tryModel(modelIdx+1, nextUrl);
      } else {
        onErr?.(currentUrl);
      }
    };
    img.src = currentUrl;
    _imgCache.set(currentUrl, img);
    return img;
  };

  const startModelIdx = meta ? 0 : 0;
  return tryModel(startModelIdx, url);
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
const Illo = ({url,loaded}) => {
  const [resolvedSrc, setResolvedSrc] = React.useState(url);
  const [selfLoaded,  setSelfLoaded]  = React.useState(false);

  React.useEffect(() => {
    if(!url) return;
    setSelfLoaded(false);
    setResolvedSrc(url);
    // Check if a fallback model already resolved a different URL for this slot
    const cached = _imgCache.get(url);
    if(cached && cached.complete && cached.naturalWidth > 0 && cached.src !== url){
      setResolvedSrc(cached.src);
    }
  }, [url]);

  const show = loaded || selfLoaded;
  return (
    <div className="illo-slot">
      <div className="shimmer" style={{opacity:show?0:1,transition:"opacity .8s"}} />
      {resolvedSrc && (
        <img
          src={resolvedSrc}
          className="illo-img"
          style={{opacity:show?1:0}}
          alt=""
          onLoad={() => setSelfLoaded(true)}
          onError={(e) => {
            // If primary src fails, check if preloadImg resolved a fallback
            const cached = _imgCache.get(url);
            if(cached && cached.src !== resolvedSrc){
              setResolvedSrc(cached.src);
            } else {
              setSelfLoaded(true); // give up gracefully — hide spinner
            }
          }}
        />
      )}
      {!show && (
        <div className="illo-fb">
          <div className="illo-fb-e">✨</div>
          <div className="illo-fb-t">Painting…</div>
        </div>
      )}
    </div>
  );
};


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
interface SleepSeedCoreProps {
  userId?: string;
  isGuest?: boolean;
  preloadedCharacter?: any;
  preloadedBook?: any;
  ritualSeed?: string;
  ritualMood?: string;
  builderChoices?: import('./lib/types').BuilderChoices | null;
  onCharacterSavePrompt?: (charData: any) => void;
  onStoryReady?: (storyData: any) => void;
}

export default function SleepSeed({
  userId,
  isGuest = false,
  preloadedCharacter,
  preloadedBook,
  ritualSeed,
  ritualMood,
  builderChoices,
  onCharacterSavePrompt,
  onStoryReady,
}: SleepSeedCoreProps = {}) {
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
  const [storyContext,   setStoryContext]   = useState(""); // "what happened today"
  const [lessonContext,  setLessonContext]  = useState(""); // "why tonight" for selected lesson
  const [todayPrompt,    setTodayPrompt]    = useState(""); // focused placeholder from chip
  const [customize,      setCustomize]      = useState(false);
  const [builderMode,    setBuilderMode]    = useState(false);
  const [storyMood,      setStoryMood]      = useState("");        // calm|silly|exciting|heartfelt
  const [storyPace,      setStoryPace]      = useState("normal");  // normal|sleepy|snappy
  const [storyStyle,     setStoryStyle]     = useState("standard");// standard|rhyming|adventure|mystery
  const [heroTraits,     setHeroTraits]     = useState<string[]>([]);
  const [moreOpen,       setMoreOpen]       = useState(false);
  const [briefStep1Open, setBriefStep1Open] = useState(true);
  const [briefStep2Open, setBriefStep2Open] = useState(false);
  const [storyBrief1,    setStoryBrief1]    = useState(""); // "Tonight, [name] is..."
  const [realLifeCtx,   setRealLifeCtx]   = useState(""); // optional detail for real-life chip
  const [realLifeChip,  setRealLifeChip]  = useState(""); // which real-life chip is active
  const [storyBrief2,    setStoryBrief2]    = useState(""); // "The story should feel..."
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
  const [selectedVoiceId,setSelectedVoiceId]= useState("iCrDUkL56s3C8sCRl7wb"); // chosen preset or cloned voice — defaults to Hope
  const [showVoicePicker,setShowVoicePicker]= useState(false); // voice picker modal
  const [vcStage,        setVcStage]        = useState("idle"); // idle|recording|uploading|ready|error
  const [vcError,        setVcError]        = useState("");
  const [showVcModal,    setShowVcModal]    = useState(false);
  const [saveToast,      setSaveToast]      = useState(false);
  const [isListening,    setIsListening]    = useState(false);
  const [hasSeenOnboard, setHasSeenOnboard] = useState(false);
  const [lastErrStage,   setLastErrStage]   = useState<string|null>(null);
  const [nightCards,     setNightCards]     = useState([]);
  const [memoriesTab,    setMemoriesTab]    = useState<"stories"|"nightcards">("stories");
  const [ncStep,         setNcStep]         = useState(0);          // 0-4 for 5 Night Card steps
  const [ncBondingQ,     setNcBondingQ]     = useState("");         // bonding question from generation
  const [ncBondingA,     setNcBondingA]     = useState("");         // child's answer
  const [ncGratitude,    setNcGratitude]    = useState("");         // "best three seconds"
  const [ncExtra,        setNcExtra]        = useState("");         // optional extra note
  const [ncPhoto,        setNcPhoto]        = useState<string|null>(null); // base64 data URL
  const [ncCountdown,    setNcCountdown]    = useState(0);          // 3-2-1 countdown
  const [ncGenerating,   setNcGenerating]   = useState(false);      // Claude generating
  const [ncResult,       setNcResult]       = useState<any>(null);  // final Night Card
  const [ncRevealed,     setNcRevealed]     = useState(false);      // polaroid reveal done
  const [ncBondingSaved, setNcBondingSaved] = useState(false);      // bonding answer submitted during loading
  const [viewingNightCard, setViewingNightCard] = useState<any>(null); // Night Card detail view
  const [styleDna,         setStyleDna]         = useState<any>(null); // Style DNA for feedback
  const [showFeedback,     setShowFeedback]     = useState(false);     // StoryFeedback sheet visible

  const totalPagesRef = useRef(0);
  const fileRefs      = useRef({});
  const autoReadRef   = useRef(false);
  const goPageRef     = useRef(null);
  const elAudioRef      = useRef(null);   // current ElevenLabs Audio element
  const selectedVoiceRef = useRef<string|null>(null); // always-current voice ID
  const voiceIdRef       = useRef<string|null>(null); // always-current cloned voice ID
  const speakELRef       = useRef<any>(null);          // always-current speakTextEL fn
  const speakTextRef     = useRef<any>(null);          // always-current speakText fn
  const ncVideoRef       = useRef<HTMLVideoElement>(null);
  const ncStreamRef      = useRef<MediaStream|null>(null);

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
    // Use user-scoped keys for memories and nightcards to prevent cross-user data leakage
    sGet("memories", userId).then(s => { if(s?.items) setMemories(s.items); });
    sGet("nightcards", userId).then(s => { if(s?.items) setNightCards(s.items); });
    sGet("style_dna").then(s => { if(s) setStyleDna(s); });
    sGet("voice_id").then(s => { if(s?.id) setVoiceId(s.id); });
    sGet("onboarded").then(s => { if(s?.v) setHasSeenOnboard(true); });
  },[userId]);

  // Open directly to book stage when a saved story is passed in
  const hasLoadedBookRef = useRef(false);
  useEffect(() => {
    if (!preloadedBook || hasLoadedBookRef.current) return;
    hasLoadedBookRef.current = true;
    setBook(preloadedBook);
    setPageIdx(0);
    setFromCache(true);
    setStage("book");
  }, [preloadedBook]);

  // Pre-populate from a saved character when passed in from the dashboard
  useEffect(() => {
    if (!preloadedCharacter) return;
    const c = preloadedCharacter;
    if (c.name)          setHeroName(c.name);
    if (c.pronouns) {
      if (c.pronouns === 'she/her')  setHeroGender('girl');
      else if (c.pronouns === 'he/him') setHeroGender('boy');
      else setHeroGender('');
    }
    if (c.ageDescription) setHeroClassify(c.ageDescription);
    if (c.currentSituation) setStoryContext(c.currentSituation);
    if (c.weirdDetail) setStoryGuidance(c.weirdDetail);
  }, [preloadedCharacter]);

  // Pre-populate ritual seed and mood from the ritual starter screen
  useEffect(() => {
    if (ritualSeed) setStoryContext(ritualSeed);
  }, [ritualSeed]);

  useEffect(() => {
    if (ritualMood) {
      const moodMap: Record<string, string> = {
        '😊': 'calm', '🥺': 'heartfelt', '😂': 'silly', '🦁': 'exciting', '😴': 'calm'
      };
      const mapped = moodMap[ritualMood];
      if (mapped) setStoryMood(mapped);
    }
  }, [ritualMood]);

  // ── Auto-generate from StoryBuilderPage choices ──────────────────────────────
  // Fires once heroName is populated (from preloadedCharacter effect) AND
  // builderChoices are present — then calls generate() with all mapped overrides.
  const hasAutoGenRef = useRef(false);

  useEffect(() => {
    if (!builderChoices || !heroName.trim() || hasAutoGenRef.current) return;
    hasAutoGenRef.current = true;

    const vibeToFeel: Record<string, string> = {
      'warm-funny':  'warm and funny, with lots of laughs',
      'calm-cosy':   'calm and cosy, drifting toward sleep',
      'exciting':    'exciting and full of surprises',
      'heartfelt':   'heartfelt and emotionally true',
      'silly':       'completely silly from start to finish',
      'mysterious':  'mysterious with a satisfying ending',
    };

    const vibeToAction: Record<string, string> = {
      'warm-funny':  'about to go on a warm and funny adventure',
      'calm-cosy':   'about to discover something magical and cosy',
      'exciting':    'about to go on a completely made-up adventure',
      'heartfelt':   'on a journey that fills the heart',
      'silly':       'on a silly quest with friends',
      'mysterious':  'about to discover something magical and mysterious',
    };

    const feel   = vibeToFeel[builderChoices.vibe]   || builderChoices.vibe;
    const action = vibeToAction[builderChoices.vibe]  || 'going on an adventure';

    const isRitual   = builderChoices.path === 'ritual';
    const storyCtx   = isRitual ? (ritualSeed || '') : '';
    const brief1     = isRitual ? '' : (builderChoices.brief.trim() || action);
    const isAdventure = builderChoices.style === 'adventure';

    generate({
      ageGroup:       builderChoices.level    || 'age5',
      storyLen:       builderChoices.length   || 'standard',
      storyBrief1:    brief1,
      storyBrief2:    feel,
      storyContext:   storyCtx,
      storyGuidance:  '',
      realLifeCtx:    '',
      lessonContext:  '',
      storyMood:      feel,
      storyPace:      builderChoices.pace  || 'normal',
      storyStyle:     builderChoices.style || 'standard',
      adventure:      isAdventure,
      extraChars:     builderChoices.chars  || [],
      lessons:        builderChoices.lessons || [],
      occasion:       builderChoices.occasion || '',
      occasionCustom: builderChoices.occasionCustom || '',
      heroTraits:     [],
    });
  }, [builderChoices, heroName]); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    if("speechSynthesis" in window) window.speechSynthesis.cancel();
    if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current = null; }
    if(autoReadRef.current) {
      const total = totalPagesRef.current || 1;
      const progress = total > 1 ? pageIdx / (total-1) : 0.5;
      // Use refs so we always get the current voice and functions, never stale closures
      if(selectedVoiceRef.current || voiceIdRef.current) {
        speakELRef.current?.(getCurrentPageText(), progress);
      } else {
        speakTextRef.current?.(getCurrentPageText(), progress);
      }
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
    // Brief pause so rapid page turns don't fire overlapping EL requests
    await new Promise(r => setTimeout(r, 80));
    if(!autoReadRef.current && !text) return; // cancelled during pause

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
      const url  = await elTTS(text, selectedVoiceId||voiceId, rate);
      const audio = new Audio(url);
      elAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); elAudioRef.current=null; onEnd(); };
      audio.onerror = () => { URL.revokeObjectURL(url); elAudioRef.current=null; onEnd(); };
      await audio.play();
    } catch(err) {
      console.error("EL TTS error:", err);
      // Do not fall back to browser voice — just stop cleanly
      setIsReading(false);
      autoReadRef.current = false;
    }
  }, [voiceId, selectedVoiceId, pageIdx, speakText]);

  // Keep refs current so pageIdx effect never goes stale
  useEffect(() => { selectedVoiceRef.current = selectedVoiceId; }, [selectedVoiceId]);
  useEffect(() => { voiceIdRef.current = voiceId; }, [voiceId]);

  // ── Toggle read aloud ──────────────────────────────────────────────────
  // Keep function refs current
  speakELRef.current   = speakTextEL;
  speakTextRef.current = speakText;

  const toggleRead = useCallback((text, pageProgress=0.5) => {
    if(isReading) {
      window.speechSynthesis.cancel();
      if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current=null; }
      autoReadRef.current = false;
      setIsReading(false);
    } else {
      autoReadRef.current = true;
      if(selectedVoiceId||voiceId) speakTextEL(text, pageProgress);
      else speakText(text, pageProgress);
    }
  },[isReading, speakText, speakTextEL, voiceId, selectedVoiceId]);

  // ── Voice input for story guidance ──────────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if(!SR) { alert("Voice input isn't supported in this browser. Try Chrome or Safari."); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onerror  = () => setIsListening(false);
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r:any) => r[0].transcript).join(" ");
      setStoryGuidance(g => (g ? g + " " : "") + transcript);
      setIsListening(false);
    };
    rec.start();
  }, []);

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

  // ── Share Story Card ──────────────────────────────────────────────────
  const shareStory = async () => {
    if(!book) return;
    try {
      const canvas = document.createElement("canvas");
      const SIZE = 1080;
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

      // Background
      ctx.fillStyle = "#060b18";
      ctx.fillRect(0,0,SIZE,SIZE);

      // Subtle star dots
      ctx.fillStyle = "rgba(255,255,255,.4)";
      const stars = [[120,80],[300,200],[700,100],[900,300],[200,700],[800,800],[500,50],[150,500],[920,600],[600,900]];
      stars.forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x,y,1.5,0,Math.PI*2); ctx.fill(); });

      // Gold border
      ctx.strokeStyle = "rgba(212,160,48,.35)";
      ctx.lineWidth = 3;
      ctx.strokeRect(28,28,SIZE-56,SIZE-56);

      // Moon
      ctx.fillStyle = "#d4a030";
      ctx.beginPath(); ctx.arc(SIZE/2,260,52,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "#0a0f28";
      ctx.beginPath(); ctx.arc(SIZE/2-18,250,44,0,Math.PI*2); ctx.fill();

      // SleepSeed label
      ctx.fillStyle = "rgba(212,160,48,.55)";
      ctx.font = "500 26px sans-serif";
      ctx.textAlign = "center";
      ctx.letterSpacing = "4px";
      ctx.fillText("SLEEPSEED", SIZE/2, 370);

      // Title
      ctx.fillStyle = "#fdf5e0";
      ctx.font = "bold 62px Georgia, serif";
      ctx.textAlign = "center";
      const titleWords = book.title.split(" ");
      const titleLines:string[] = [];
      let line = "";
      for(const w of titleWords) {
        const test = line ? line+" "+w : w;
        if(ctx.measureText(test).width > SIZE-160) { titleLines.push(line); line=w; }
        else line = test;
      }
      if(line) titleLines.push(line);
      const titleY = titleLines.length > 2 ? 470 : 490;
      titleLines.forEach((l,i) => ctx.fillText(l, SIZE/2, titleY + i*76));

      // Gold rule
      const ruleY = titleY + titleLines.length*76 + 28;
      const grad = ctx.createLinearGradient(SIZE/2-120,0,SIZE/2+120,0);
      grad.addColorStop(0,"rgba(212,160,48,0)");
      grad.addColorStop(0.5,"rgba(212,160,48,.6)");
      grad.addColorStop(1,"rgba(212,160,48,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(SIZE/2-120, ruleY, 240, 2);

      // Refrain / quote
      if(book.refrain) {
        ctx.fillStyle = "rgba(240,204,96,.82)";
        ctx.font = "italic 34px Georgia, serif";
        ctx.textAlign = "center";
        const refrainY = ruleY + 52;
        const maxW = SIZE - 200;
        const words = `"${book.refrain}"`.split(" ");
        const rLines:string[] = [];
        let rl = "";
        for(const w of words) {
          const t = rl ? rl+" "+w : w;
          if(ctx.measureText(t).width > maxW) { rLines.push(rl); rl=w; }
          else rl = t;
        }
        if(rl) rLines.push(rl);
        rLines.slice(0,2).forEach((l,i) => ctx.fillText(l, SIZE/2, refrainY + i*46));
      }

      // Footer
      ctx.fillStyle = "rgba(212,160,48,.35)";
      ctx.font = "500 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`A story for ${book.heroName}  ·  sleepseed.app`, SIZE/2, SIZE-52);

      // Export
      canvas.toBlob(async (blob) => {
        if(!blob) return;
        const file = new File([blob], `${book.title.replace(/[^a-z0-9]/gi,"_")}_card.png`, {type:"image/png"});
        if(navigator.canShare?.({files:[file]})) {
          await navigator.share({files:[file], title:book.title, text:`A bedtime story for ${book.heroName} — made with SleepSeed`});
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href=url; a.download=file.name; a.click();
          setTimeout(()=>URL.revokeObjectURL(url),2000);
        }
      },"image/png");
    } catch(err) {
      console.error("Share error:",err);
    }
  };

  // ── PDF Download ──────────────────────────────────────────────────────
  const downloadStory = async () => {
    if(!book) return;
    try {
      const { jsPDF } = await import("jspdf");
      // A4 landscape: 297 × 210 mm
      const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
      const W = 297, H = 210;

      // Colours
      const NAVY:  [number,number,number] = [13,  21,  53];
      const GOLD:  [number,number,number] = [212, 160, 48];
      const WHITE: [number,number,number] = [255, 255, 255];
      const CREAM_BG:[number,number,number] = [253, 248, 242];
      const INK:   [number,number,number] = [26,  20,  16];
      const RULE:  [number,number,number] = [228, 220, 216];
      const PG_NUM:[number,number,number] = [184, 168, 152];
      const URL_C: [number,number,number] = [200, 189, 176];
      const REFRAIN:[number,number,number]= [74,  56,  128];
      const FOR_LBL:[number,number,number]= [176, 160, 144];

      // Moon crescent helper (drawn with two circles)
      const drawMoon = (cx:number, cy:number, r:number) => {
        doc.setFillColor(...GOLD);
        doc.circle(cx, cy, r, "F");
        doc.setFillColor(...NAVY);
        doc.circle(cx - r*0.35, cy - r*0.1, r*0.82, "F");
      };

      // Thin rule line helper
      const rule = (x:number, y:number, w:number) => {
        doc.setDrawColor(...RULE); doc.setLineWidth(0.3);
        doc.line(x, y, x+w, y);
      };

      // ── SHEET 1: COVER ────────────────────────────────────────────────
      // Left brand panel
      const LP = 108; // left panel width mm
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, LP, H, "F");

      // Moon centred in left panel, upper third
      drawMoon(LP/2, 68, 8);

      // SleepSeed wordmark
      doc.setFont("times", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...WHITE);
      doc.text("SleepSeed", LP/2, 85, { align:"center" });

      // Tagline
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(212, 160, 48);
      doc.text("BEDTIME STORIES", LP/2, 93, { align:"center" });

      // URL at bottom of brand panel
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255, 0.18 as any);
      doc.setTextColor(100, 100, 130);
      doc.text("sleepseed.app", LP/2, H-12, { align:"center" });

      // Right title panel
      doc.setFillColor(...WHITE);
      doc.rect(LP, 0, W-LP, H, "F");

      const RX = LP + 24; // text left margin in right panel
      const RW = W - LP - 48; // text width

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...FOR_LBL);
      doc.text("A BEDTIME STORY FOR", RX, 62);

      doc.setFont("times", "bold");
      doc.setFontSize(34);
      doc.setTextColor(...INK);
      doc.text(book.heroName, RX, 80);

      doc.setFont("times", "normal");
      doc.setFontSize(15);
      doc.setTextColor(...INK);
      const titleLines = doc.splitTextToSize(book.title, RW);
      doc.text(titleLines, RX, 96);

      rule(RX, 96 + titleLines.length*7 + 4, RW);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...FOR_LBL);
      doc.text("Written just for tonight", RX, 96 + titleLines.length*7 + 12);
      doc.text("sleepseed.app", RX, 96 + titleLines.length*7 + 19);

      // ── STORY PAGES: 2 per sheet ──────────────────────────────────────
      const allPages = book.isAdventure
        ? [...(book.setup_pages||[]), ...(book.path_a||[]), ...(book.path_b||[])]
        : (book.pages||[]);

      const PW = W / 2; // each panel = 148.5mm
      const PAD_X = 18;  // horizontal padding inside each panel
      const PAD_TOP = 20;
      const PAD_BOT = 18;
      const TEXT_W = PW - PAD_X*2;
      const TEXT_H = H - PAD_TOP - PAD_BOT - 14; // reserve footer

      const drawStoryPage = (
        pgIndex: number,    // 0-based index in allPages
        side: "left"|"right"
      ) => {
        const pg = allPages[pgIndex];
        if(!pg) return;
        const X0 = side === "left" ? 0 : PW;
        const isEven = pgIndex % 2 === 1; // alternate tint
        const bgColor = isEven ? CREAM_BG : WHITE;

        doc.setFillColor(...bgColor);
        doc.rect(X0, 0, PW, H, "F");

        // Divider between panels (only draw on left side to avoid double)
        if(side === "left") {
          doc.setDrawColor(...RULE); doc.setLineWidth(0.3);
          doc.line(PW, 8, PW, H-8);
        }

        // Page text
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...INK);
        const lines = doc.splitTextToSize(pg.text||"", TEXT_W);
        doc.text(lines, X0+PAD_X, PAD_TOP);

        // Refrain — show on every even-index page (right-side feel)
        const hasRefrain = book.refrain && pgIndex % 2 === 1;
        if(hasRefrain) {
          const refrainY = H - PAD_BOT - 14;
          rule(X0+PAD_X, refrainY - 3, TEXT_W);
          doc.setFont("times", "italic");
          doc.setFontSize(9.5);
          doc.setTextColor(...REFRAIN);
          const rLines = doc.splitTextToSize(`"${book.refrain}"`, TEXT_W);
          doc.text(rLines, X0+PAD_X, refrainY + 4);
        }

        // Footer rule
        rule(X0+PAD_X, H - PAD_BOT + 1, TEXT_W);

        // Page number
        doc.setFont("times", "italic");
        doc.setFontSize(7);
        doc.setTextColor(...PG_NUM);
        doc.text(String(pgIndex+1), X0+PAD_X, H - PAD_BOT + 7);

        // URL
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(...URL_C);
        doc.text("sleepseed.app", X0+PW-PAD_X, H - PAD_BOT + 7, { align:"right" });
      };

      // Pair pages onto sheets
      for(let i=0; i<allPages.length; i+=2) {
        doc.addPage();
        drawStoryPage(i, "left");
        drawStoryPage(i+1, "right");
      }

      // ── FINAL SHEET: The End ──────────────────────────────────────────
      doc.addPage();
      // Left: brand panel (matching cover)
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, LP, H, "F");
      drawMoon(LP/2, 68, 8);
      doc.setFont("times", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...WHITE);
      doc.text("SleepSeed", LP/2, 85, { align:"center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...GOLD);
      doc.text("BEDTIME STORIES", LP/2, 93, { align:"center" });
      doc.setFontSize(6.5);
      doc.setTextColor(100, 100, 130);
      doc.text("sleepseed.app", LP/2, H-12, { align:"center" });

      // Right: The End
      doc.setFillColor(...WHITE);
      doc.rect(LP, 0, W-LP, H, "F");
      doc.setFont("times", "bold");
      doc.setFontSize(28);
      doc.setTextColor(...INK);
      doc.text("The End.", RX, H/2 - 8);
      rule(RX, H/2 - 2, RW);
      doc.setFont("times", "italic");
      doc.setFontSize(10);
      doc.setTextColor(...FOR_LBL);
      doc.text(`Sweet dreams, ${book.heroName}.`, RX, H/2 + 7);
      doc.text("Tomorrow night, another adventure awaits.", RX, H/2 + 15);

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

  // ── Night Card camera effect ──
  useEffect(() => {
    if(stage!=="nightcard" || ncStep!==3 || ncPhoto) return;
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}}})
      .then(stream => {
        if(cancelled){ stream.getTracks().forEach(t=>t.stop()); return; }
        ncStreamRef.current = stream;
        if(ncVideoRef.current) ncVideoRef.current.srcObject = stream;
      })
      .catch(() => { if(!cancelled) setNcStep(4); });
    return () => { cancelled = true; ncStreamRef.current?.getTracks().forEach(t=>t.stop()); ncStreamRef.current=null; };
  },[stage,ncStep,ncPhoto]);

  // ── Night Card generation effect ──
  useEffect(() => {
    if(stage!=="nightcard" || ncStep!==4 || ncGenerating || ncResult) return;
    setNcGenerating(true);
    const name = book?.heroName||"";
    // Build bonding context — only include fields that have content
    const bondingParts = [];
    if(ncBondingQ && ncBondingA.trim()) bondingParts.push(`Asked "${ncBondingQ}" — ${name} said: "${ncBondingA.trim()}"`);
    if(ncGratitude.trim()) bondingParts.push(`Best moment: "${ncGratitude.trim()}"`);
    if(ncExtra.trim()) bondingParts.push(`Note: "${ncExtra.trim()}"`);
    const bondingCtx = bondingParts.length ? `\nTonight: ${bondingParts.join(". ")}` : "";

    const ncPrompt = `Night Card for ${name} after "${book?.title||""}". Refrain: "${book?.refrain||""}"${bondingCtx}

Return ONLY JSON: {"headline":"3-6 words capturing tonight's feeling (not the title)","quote":"best line from the story refrain, 8-15 words","memory_line":"one warm sentence weaving the child's real words into a keepsake, under 20 words${ncBondingA.trim() ? ` — must include something ${name} actually said` : ""}","reflection":"whispered bedtime question, under 12 words","emoji":"one emoji"}`;
    const fallback = {
      headline:`A night with ${name}`,quote:book?.refrain||book?.title||"",
      memory_line:ncGratitude.trim()||ncBondingA.trim()||`A story just for ${name}.`,
      reflection:"What will you dream about tonight?",emoji:"🌙",
    };
    callClaude([{role:"user",content:ncPrompt}],
      "Write Night Card keepsakes. Weave real bonding moments — the child's actual words — into warm, specific mementos. Be concise. Return only JSON.", 300
    ).then(raw => { try { setNcResult(extractJSON(raw)); } catch(_) { setNcResult(fallback); } })
     .catch(() => setNcResult(fallback));
  },[stage,ncStep,ncGenerating,ncResult]);

  const newChar = () => ({id:uid(),type:"friend",name:"",photo:null,classify:"",gender:"",note:""});
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
      date:new Date().toISOString().split("T")[0],occasion:occ,bookData,
      characterIds: preloadedCharacter ? [preloadedCharacter.id] : [],
      refrain: bookData.refrain || ""};
    const next = [entry,...memories];
    setMemories(next);
    await sSet("memories",{items:next},userId);
    // Also mirror to v2 user-scoped storage so UserDashboard can read it
    if (userId) {
      try {
        const v2Key = `ss2_stories_${userId}`;
        const existing = JSON.parse(localStorage.getItem(v2Key) || "[]");
        const v2Entry = {
          id: entry.id, userId, title: entry.title,
          heroName: entry.heroName, characterIds: entry.characterIds,
          refrain: entry.refrain, date: entry.date,
          occasion: occ, bookData
        };
        localStorage.setItem(v2Key, JSON.stringify([v2Entry, ...existing]));
        // ── Save to Supabase so dashboard reads it ──
        await dbSaveStory({
          id: entry.id, userId, title: entry.title,
          heroName: entry.heroName, characterIds: entry.characterIds,
          refrain: entry.refrain, date: entry.date,
          occasion: occ, bookData
        });
      } catch(e) { console.error('SleepSeedCore dbSaveStory:', e); }
    }
  },[memories,occasion,occasionCustom,userId,preloadedCharacter]);

  const deleteMemory = useCallback(async (id) => {
    const next = memories.filter(m => m.id!==id);
    setMemories(next);
    await sSet("memories",{items:next},userId);
  },[memories,userId]);

  const saveNightCard = useCallback(async (cardData) => {
    const entry = {id:uid(),...cardData,date:new Date().toISOString().split("T")[0]};
    const next = [entry,...nightCards];
    setNightCards(next);
    await sSet("nightcards",{items:next},userId);
    // Mirror to v2 user-scoped storage
    if (userId) {
      try {
        const v2Key = `ss2_nightcards_${userId}`;
        const existing = JSON.parse(localStorage.getItem(v2Key) || "[]");
        const v2Entry = {
          id: entry.id, userId,
          heroName: entry.heroName || cardData.heroName || "",
          storyTitle: entry.storyTitle || "",
          characterIds: preloadedCharacter ? [preloadedCharacter.id] : [],
          headline: entry.headline || "",
          quote: entry.quote || cardData.bondingA || "",
          memory_line: entry.memory_line || "",
          bondingQuestion: entry.bondingQ || "",
          bondingAnswer: entry.bondingA || "",
          gratitude: entry.gratitudeA || "",
          extra: entry.extraA || "",
          photo: entry.photo || null,
          emoji: entry.emoji || "🌙",
          date: entry.date
        };
        localStorage.setItem(v2Key, JSON.stringify([v2Entry, ...existing]));
        // ── Save to Supabase so dashboard reads it ──
        await dbSaveNightCard({
          id: entry.id, userId,
          heroName: entry.heroName || cardData.heroName || "",
          storyTitle: entry.storyTitle || entry.storyTitle || "",
          characterIds: preloadedCharacter ? [preloadedCharacter.id] : [],
          headline: entry.headline || "",
          quote: entry.quote || cardData.bondingA || "",
          memory_line: entry.memory_line || undefined,
          bondingQuestion: entry.bondingQ || undefined,
          bondingAnswer: entry.bondingA || undefined,
          gratitude: entry.gratitudeA || undefined,
          extra: entry.extraA || undefined,
          photo: entry.photo || undefined,
          emoji: entry.emoji || "🌙",
          date: entry.date,
        });
      } catch(e) { console.error('SleepSeedCore dbSaveNightCard:', e); }
    }
    return entry;
  },[nightCards,userId,preloadedCharacter]);

  const deleteNightCard = useCallback(async (id) => {
    const next = nightCards.filter(c => c.id!==id);
    setNightCards(next);
    await sSet("nightcards",{items:next});
  },[nightCards]);

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
    const resolvedBrief1  = overrides.storyBrief1   ?? storyBrief1;
    const resolvedBrief2  = overrides.storyBrief2   ?? storyBrief2;
    const resolvedContext = overrides.storyContext  ?? storyContext;
    const resolvedLesCtx  = overrides.lessonContext ?? lessonContext;
    const resolvedMood    = overrides.storyMood     ?? storyMood;
    const resolvedPace    = overrides.storyPace     ?? storyPace;
    const resolvedStyle   = overrides.storyStyle    ?? storyStyle;
    const resolvedTraits  = overrides.heroTraits    ?? heroTraits;
    setError(""); setStage("generating"); setFromCache(false); setChosenPath(null);
    // Pick and store bonding question for Night Card flow
    const bondingIdx = Math.floor(Date.now()/1000) % BONDING_QUESTIONS.length;
    setNcBondingQ(BONDING_QUESTIONS[bondingIdx]);
    setNcBondingSaved(false); setNcBondingA("");
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
        allUrls.forEach((url,i) => setTimeout(() => preloadImg(url,
          () => { dots[i]="d"; setGen(g=>({...g,dots:[...dots]})); setImgLoaded(p=>({...p,[strHash(url)]:true})); },
          () => { dots[i]="e"; setGen(g=>({...g,dots:[...dots]})); setImgLoaded(p=>({...p,[strHash(url)]:"e"})); }
        ), i * 800));
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
        const noteStr = c.note ? `\n  Story context: ${c.note}` : "";
        return `• ${c.name||capitalize(c.type)}: ${typeLabel}${cls}${proStr}${desc}${voice}${noteStr}`;
      }).join("\n");

      const charVisual = allChars.map(c =>
        `${c.name||c.type}${visualDescs[c.id]?`(${visualDescs[c.id]})`:c.classify?`(${c.classify})`:""}`
      ).join(", ");

      const occasionFinal = resolvedOccCust.trim() || resolvedOcc;
      const occLine  = occasionFinal ? `\nSPECIAL OCCASION: ${occasionFinal}` : "";
      const lesArr = Array.isArray(resolvedLesson) ? resolvedLesson : (resolvedLesson ? [resolvedLesson] : []);
      const lesLine  = lesArr.length ? `\nLESSONS (weave these in through action only — never state as a moral): ${lesArr.length > 1 ? "You have been given multiple lessons. Choose ONE — the single one that fits most naturally into this specific story. A story that genuinely embodies one lesson is ten times more powerful than a story that forces two. The others are not wrong; they just don't belong in this story tonight. Pick the one and commit. " : ""}${lesArr.map(l=>"• "+l).join("\n")}` : "";
      const guidanceSafe = resolvedGuidance.trim().slice(0, 300).replace(/[\u201C\u201D""]/g, '"');
      const contextSafe  = resolvedContext.trim().slice(0, 300).replace(/[\u201C\u201D""]/g, '"');
      const lesCtxSafe   = resolvedLesCtx.trim().slice(0, 200).replace(/[\u201C\u201D""]/g, '"');
      const resolvedRealCtx = overrides.realLifeCtx ?? realLifeCtx;
      const realCtxSafe  = resolvedRealCtx.trim().slice(0,200).replace(/[\u201C\u201D""]/g,'"');
      const brief1Safe = resolvedBrief1.trim().slice(0,200).replace(/[\u201C\u201D""]/g,'"');
      const brief2Safe = resolvedBrief2.trim().slice(0,150).replace(/[\u201C\u201D""]/g,'"');
      const guidLine = [
        brief1Safe   ? `TONIGHT'S STORY PREMISE (highest priority — this defines what the story is fundamentally about):\n${name} is ${brief1Safe}${realCtxSafe ? ". Specific context: " + realCtxSafe : ""}` : "",
        brief2Safe   ? `STORY TONE: The story should feel ${brief2Safe}` : "",
        contextSafe  ? `ADDITIONAL CONTEXT (incorporate naturally):\n${contextSafe}` : "",
        guidanceSafe ? `ADDITIONAL GUIDANCE (incorporate naturally):\n${guidanceSafe}` : "",
        lesCtxSafe   ? `WHY THIS LESSON TONIGHT (weave this specific situation in naturally):\n${lesCtxSafe}` : "",
      ].filter(Boolean).map(s => "\n" + s).join("");

      // World: AI picks based on context, or random if no inputs
      const lesArrCheck = Array.isArray(resolvedLesson) ? resolvedLesson : (resolvedLesson ? [resolvedLesson] : []);
      const hasContext = !!(resolvedOcc || lesArrCheck.length || guidanceSafe || contextSafe || brief1Safe || realCtxSafe || resolvedChars.length > 0);
      const autoTheme = hasContext
        ? null  // let AI pick
        : THEMES[Math.floor(Math.random() * THEMES.length)];
      const worldLine = autoTheme
        ? `SETTING:\n${autoTheme.value}\n\nSet the entire story in this real-world place. Ground it in what a child knows — then make it delightfully surprising. The setting is active: things in it talk, move, have opinions, and cause problems. It is not a backdrop.`
        : `SETTING SELECTION: Based on the characters, occasion, lessons, and story guidance provided, choose the single most fitting setting from the real-world options below. Pick the one where this specific story will feel most vivid, surprising, and natural. The chosen setting must be active — not a backdrop but a participant with its own personality.\n\nAVAILABLE SETTINGS:\n${THEMES.map((t,i)=>{ const lines=t.value.split("\n"); const mechanism=lines.find(l=>l.includes("magic is ")||l.includes("This setting")); return `${i+1}. ${t.label}: ${lines[0]}${mechanism?" | "+mechanism.trim():""}`;}).join("\n")}`;
      const moodLine  = resolvedMood ? `\nSTORY MOOD: ${resolvedMood==="calm"?"Calm and cosy — warm, gentle, soothing throughout. Every page should feel like a soft blanket. This is a flavour instruction only: age vocabulary and sentence structure rules still apply fully.":resolvedMood==="silly"?"Silly and funny — lean into humour and absurdity. At least one thing per page should make a child laugh. This is a flavour instruction only: age vocabulary rules still apply fully.":resolvedMood==="exciting"?"Exciting and adventurous — high energy and wonder through the story. Final 2-3 pages MUST still wind down gently and land in sleep. This is a flavour instruction only: age vocabulary rules still apply fully.":resolvedMood==="heartfelt"?"Warm and heartfelt — emotionally resonant and tender. Prioritise genuine feeling over plot twists. This is a flavour instruction only: age vocabulary rules still apply fully.":""}` : "";
      const paceLine  = resolvedPace && resolvedPace!=="normal" ? `\nNARRATION PACE: ${resolvedPace==="sleepy"?"Extra sleepy — from the first page the world is soft and quiet. Short gentle sentences. Long pauses. Characters move slowly. The whole story drifts toward sleep.":"Quick and snappy — punchy sentences and fast energy through the adventure pages. The final 2-3 pages MUST still slow down, grow quiet, and land the child in sleep. Snappy applies to the adventure, never the ending."}` : "";
      const styleLine = resolvedStyle && resolvedStyle!=="standard" && resolvedStyle!=="adventure" ? `\nSTORY STYLE: ${resolvedStyle==="rhyming"?"Rhyming — the ENTIRE story must rhyme with a consistent scheme that scans naturally when read aloud (AABB, ABCB, or AABBA all work — choose whichever fits the story best). Every line must feel musical and effortless, never forced. Rhymes must serve the story, not the other way around. The sleep landing must still rhyme warmly. Adventure/choice-path format is automatically disabled for rhyming stories.":resolvedStyle==="mystery"?"Mystery — structure as a gentle child-friendly mystery. Something is missing or unexplained on page 1. Clues discovered naturally across the middle pages. The solution is revealed on the penultimate page — surprising but obvious in hindsight. The final page is always the warm sleep landing, NOT more mystery.":""}` : "";
      const traitLine = resolvedTraits.length ? `\nHERO PERSONALITY: ${heroName||name} is ${resolvedTraits.join(", ")}. Let these traits shape every decision they make and every line of dialogue they speak.` : "";
      const ageCfg = AGES.find(a=>a.value===resolvedAge)||AGES[1];
      const ageLine = ageCfg.prompt;

      setGen(g => ({...g,stepIdx:1,progress:26,label:"Writing tonight's story…"}));

      const lenCfg = LENGTHS.find(l=>l.value===resolvedLen)||LENGTHS[1];
      const setupN = lenCfg.advSetup;
      const resN   = lenCfg.advRes;
      const totalN = lenCfg.target;

      // ── Map SleepSeed fields to StoryBrief for sleepseed-prompts ────────
      const genreFromMood = resolvedMood === "silly" ? "comedy"
        : resolvedMood === "exciting" || resolvedAdv ? "adventure"
        : resolvedMood === "heartfelt" ? "therapeutic"
        : resolvedMood === "calm" ? "cosy"
        : resolvedStyle === "mystery" ? "adventure"
        : "cosy";

      const situationParts = [
        brief1Safe ? `${name} is ${brief1Safe}` : "",
        realCtxSafe ? `Context: ${realCtxSafe}` : "",
        contextSafe || "",
        lesArr.length ? `Theme: ${lesArr.map(l=>l.split("—")[0].trim()).join(", ")}` : "",
        occasionFinal ? `Occasion: ${occasionFinal}` : "",
      ].filter(Boolean);
      const situation = situationParts.length > 0
        ? situationParts.join(". ")
        : `A bedtime story for ${name} in a ${(autoTheme || THEMES[0]).label.toLowerCase()} setting`;

      const heroChar = allChars.find(c => c.type === "hero");
      const supportChar = allChars.find(c => c.type !== "hero");

      const storyBrief = {
        genre: genreFromMood,
        situation,
        protagonistName: name,
        protagonistAge: ageCfg.label.replace("Age ","").split("–")[0],
        weirdDetail: resolvedTraits.length ? `${name} is ${resolvedTraits.join(", ")}` : undefined,
        want: brief1Safe ? `${name} is ${brief1Safe}` : undefined,
        supportingName: supportChar?.name || (supportChar ? capitalize(supportChar.type) : undefined),
        supportingDetail: supportChar?.classify ? classifyVoice[supportChar.classify] : undefined,
        targetFeeling: "safe and sleepy — carried gently into sleep",
        finalLineApproach: "sensation",
        asChunks: false,
      };

      // Build system + user from the new prompts module
      const { system: promptSystem, user: promptUser } = buildStoryPrompt(storyBrief);

      // ── JSON output schema (app needs structured pages) ─────────────────
      const pgSchema = (n) => Array.from({length:n},()=>(
        '{"text":"[page text]","illustration_prompt":"[15-20 words: vivid scene, setting and action, no character names, Micha Archer folk-art paintable]"}'
      )).join(",");

      const simpleSchema = `{"title":"3-6 word title","cover_prompt":"[15-20 words: wide magical bedtime scene establishing the story world, cozy glowing folk-art atmosphere]","pages":[${pgSchema(totalN)}],"refrain":"4-8 word refrain from the story"}`;
      const advSchema = `{"title":"3-6 word title","cover_prompt":"[15-20 words: wide magical bedtime scene establishing the story world, cozy glowing folk-art atmosphere]","setup_pages":[${pgSchema(setupN)}],"choice":{"question":"exciting choice question for ${name}","option_a_label":"4-7 words","option_b_label":"4-7 words"},"path_a":[${pgSchema(resN)}],"path_b":[${pgSchema(resN)}],"refrain":"4-8 word refrain from the story"}`;

      // ── Assemble final prompt with characters + age + JSON output ───────
      const storyPrompt = `${promptUser}

━━━ READER AGE ━━━
${ageLine}

━━━ CHARACTERS ━━━
${charCtx}

━━━ SETTING, OCCASION, AND CONTEXT ━━━
${worldLine}${guidLine}${occLine}${lesLine}${moodLine}${paceLine}${styleLine}${traitLine}

${resolvedAdv
  ? `CHOOSE-YOUR-ADVENTURE FORMAT:\nWrite ${setupN} setup pages, then a choice moment, then ${resN} resolution pages per path. Both paths end with ${name} safely, warmly asleep.`
  : `STORY SHAPE: Target ~${totalN} pages.`}

━━━ OUTPUT ━━━
Return ONLY this exact JSON object. No extra text, no markdown, no explanation:
${resolvedAdv ? advSchema : simpleSchema}`;

      const raw = await callClaude(
        [{role:"user",content:storyPrompt}],
        promptSystem,
        6000
      );

      const story = extractJSON(raw);

      if(!story.title) throw new Error("Response missing title");
      if(!resolvedAdv && (!Array.isArray(story.pages)||story.pages.length===0)) throw new Error("Response missing pages array");
      if(resolvedAdv && (!Array.isArray(story.setup_pages)||!Array.isArray(story.path_a)||!Array.isArray(story.path_b))) throw new Error("Response missing adventure paths");

      setGen(g => ({...g,stepIdx:2,progress:65,label:"Painting the illustrations…"}));

      const g = heroGender || "girl";
      const coverUrl = illoUrlTracked(story.cover_prompt, seed, 640, 280, g);
      let bookData, allUrls;

      if(resolvedAdv && story.setup_pages){
        const sU = story.setup_pages.map((p,i) => illoUrlTracked(p.illustration_prompt, seed+i+1, 480, 220, g));
        const aU = story.path_a.map((p,i) => illoUrlTracked(p.illustration_prompt, seed+100+i, 480, 220, g));
        const bU = story.path_b.map((p,i) => illoUrlTracked(p.illustration_prompt, seed+200+i, 480, 220, g));
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
        const pU = story.pages.map((p,i) => illoUrlTracked(p.illustration_prompt, seed+i+1, 480, 220, g));
        allUrls = [coverUrl,...pU];
        bookData = {
          title:story.title,heroName:name,coverUrl,allChars,
          refrain:story.refrain||"",
          pages:story.pages.map((p,i) => ({text:p.text,imgUrl:pU[i]})),
        };
      }

      const dots = mk(allUrls.length,"p");
      setGen(g => ({...g,progress:80,label:"Story ready! Illustrations loading…",dots:[...dots]}));
      // Stagger requests by 800ms each — flux-pro on the free tier rate-limits
      // simultaneous requests, causing silent failures. Sequential loading means
      // images appear one by one rather than all failing at once.
      allUrls.forEach((url,i) => {
        setTimeout(() => {
          preloadImg(url,
            (_resolvedUrl) => { dots[i]="d"; setGen(g=>({...g,dots:[...dots]})); setImgLoaded(p=>({...p,[strHash(url)]:true})); },
            (_resolvedUrl) => { dots[i]="e"; setGen(g=>({...g,dots:[...dots]})); setImgLoaded(p=>({...p,[strHash(url)]:"e"})); }
          );
        }, i * 800);
      });

      // ── Generate parent note ──────────────────────────────────────────
      let parentNote = "";
      try {
        const lessonSummary = lesArr.length ? lesArr.map(l=>l.split("—")[0].trim()).join(", ") : "";
        const notePrompt = `A child named ${name} just heard a personalised bedtime story called "${story.title}". ${lessonSummary ? `The story gently explored: ${lessonSummary}.` : ""} ${brief1Safe ? `Tonight's story was about: ${name} ${brief1Safe}.` : ""}

Write a warm 2-sentence note addressed to the parent (not the child). Sentence 1: name the emotional theme the story carried tonight in plain, warm language — what ${name} experienced emotionally through the story. Sentence 2: one gentle, practical suggestion for a brief real-world conversation or bedtime ritual that builds on what the story explored. Keep it under 40 words total. Warm but not clinical. Never use the word "lesson". Return only the note text, no labels, no quotes.`;
        const noteRaw = await callClaude([{role:"user",content:notePrompt}], "You write brief, warm, practical notes to parents after their child's personalised bedtime story. You are a trusted friend who understands child development, not a therapist. Keep it human and brief.", 200);
        parentNote = noteRaw.trim().replace(/^["“”]|["“”]$/g,"");
      } catch(_) {}
      bookData.parentNote = parentNote;

      setBook(bookData); setPageIdx(0);
      setGen(g => ({...g,stepIdx:3,progress:94,label:"Enjoy your story!",dots:[...dots]}));
      await new Promise(r => setTimeout(r,200));
      setStage("book");
      sSet(bKey,bookData).catch(()=>{});

      // ── Auto-save story to library ────────────────────────────────────
      try { await saveMemory(bookData); } catch(_) {}

    } catch(e) {
      console.error("SleepSeed error:",e);
      const msg = e.message||"Something went wrong";
      const isParseErr = msg.toLowerCase().includes("json")||msg.toLowerCase().includes("parse")||msg.toLowerCase().includes("missing");
      const userMsg = isParseErr
        ? "The story response was incomplete — your settings are saved. Tap Try Again."
        : msg.includes("ANTHROPIC_KEY")
          ? "API key not set — check your Vercel environment variables."
          : "Something went wrong — your settings are saved. Tap Try Again.";
      setError(userMsg);
      setLastErrStage(stage==="builder" ? "builder" : "quick");
      setStage("error");
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

  /* ── Dynamic scene: pick once per book, based on seed + vibe ── */
  const storySceneSeed = book ? (parseInt(strHash(book.title + (book.heroName||'')), 36) || 0) : 0;
  const storyVibe = storyMood || (storyBrief2 ? storyBrief2.split(' ')[0].toLowerCase() : '');
  const StoryScene = book ? getSceneByVibe(storySceneSeed, storyVibe) : null;

  /* ── Story page ── */
  const StoryPage = ({pg,pgNum,refrain}) => (
    <div className="bpage story-bg">
      <div className="pinset" />
      <div className="story-lay">
        <div className="story-illo">
          {pg?.imgUrl
            ? <Illo url={pg.imgUrl} loaded={imgReady(pg.imgUrl)} />
            : StoryScene ? <StoryScene /> : null
          }
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
            {book.coverUrl
              ? <Illo url={book.coverUrl} loaded={imgReady(book.coverUrl)} />
              : StoryScene ? <StoryScene /> : null
            }
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

    // ── The End page ──
    return (
      <div className="bpage end-bg" style={{overflowY:"auto"}}>
        <div className="pinset" />
        <div className="end-lay" style={{gap:14,paddingTop:20,paddingBottom:20}}>
          <div className="end-moon">🌙</div>
          <div className="end-title">The End</div>
          <div className="end-msg">
            Sweet dreams, {book.heroName}.<br />
            Tomorrow night, another adventure awaits…
          </div>

          {book.parentNote && (
            <div style={{width:"100%",background:"rgba(212,160,48,.08)",border:"1px solid rgba(212,160,48,.2)",
              borderRadius:14,padding:"12px 16px",marginTop:4}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",
                color:"rgba(212,160,48,.7)",marginBottom:6}}>A note for you 👋</div>
              <div style={{fontSize:12,color:"var(--cream)",lineHeight:1.7,fontFamily:"'Nunito',sans-serif"}}>
                {book.parentNote}
              </div>
            </div>
          )}

          {book.nightCard ? (
            /* Show existing Night Card inline */
            <div style={{width:"100%",marginTop:8,background:"rgba(212,160,48,.06)",
              border:"1px solid rgba(212,160,48,.18)",borderRadius:16,padding:"16px",textAlign:"center"}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",
                color:"rgba(212,160,48,.55)",marginBottom:8}}>Tonight's Night Card</div>
              {book.nightCard.photo && (
                <div style={{width:100,margin:"0 auto 10px",borderRadius:4,overflow:"hidden",
                  background:"#faf8f2",padding:"4px 4px 8px",boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}>
                  <img src={book.nightCard.photo} alt="" style={{width:"100%",borderRadius:2}} />
                </div>
              )}
              <div style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,fontStyle:"italic",
                color:"var(--gold3)",marginBottom:4}}>{book.nightCard.headline}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:12,fontStyle:"italic",
                color:"rgba(240,220,160,.8)",lineHeight:1.6}}>"{book.nightCard.quote}"</div>
              {book.nightCard.memory_line && (
                <div style={{fontFamily:"'Kalam',cursive",fontSize:11,color:"rgba(200,180,255,.7)",
                  lineHeight:1.5,marginTop:4}}>{book.nightCard.memory_line}</div>
              )}
              {/* Q&A sections */}
              {(book.nightCard.bondingA || book.nightCard.gratitude || book.nightCard.extra) && (
                <div style={{textAlign:"left",marginTop:10,paddingTop:10,
                  borderTop:"1px solid rgba(212,160,48,.12)",display:"flex",flexDirection:"column",gap:8}}>
                  {book.nightCard.bondingQ && book.nightCard.bondingA && (
                    <div>
                      <div style={{fontSize:8,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",
                        color:"rgba(160,120,255,.5)",marginBottom:2}}>Asked: "{book.nightCard.bondingQ}"</div>
                      <div style={{fontFamily:"'Kalam',cursive",fontSize:12,color:"var(--cream)",lineHeight:1.5}}>
                        {book.nightCard.bondingA}
                      </div>
                    </div>
                  )}
                  {book.nightCard.gratitude && (
                    <div>
                      <div style={{fontSize:8,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",
                        color:"rgba(212,160,48,.5)",marginBottom:2}}>Best three seconds</div>
                      <div style={{fontFamily:"'Kalam',cursive",fontSize:12,color:"var(--cream)",lineHeight:1.5}}>
                        {book.nightCard.gratitude}
                      </div>
                    </div>
                  )}
                  {book.nightCard.extra && (
                    <div>
                      <div style={{fontSize:8,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",
                        color:"rgba(76,200,144,.5)",marginBottom:2}}>Extra note</div>
                      <div style={{fontFamily:"'Kalam',cursive",fontSize:12,color:"var(--cream)",lineHeight:1.5}}>
                        {book.nightCard.extra}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button className="btn" style={{width:"100%",marginTop:8,fontSize:15,padding:"14px 20px"}}
              onClick={()=>{
                setNcStep(0); setNcBondingA(ncBondingA||""); setNcGratitude(""); setNcExtra("");
                setNcPhoto(null); setNcCountdown(0); setNcGenerating(false);
                setNcResult(null); setNcRevealed(false);
                window.speechSynthesis?.cancel();
                if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current=null; }
                autoReadRef.current = false; setIsReading(false);
                setStage("nightcard");
              }}>
              🌙 Make Tonight's Night Card
            </button>
          )}

          <div style={{display:"flex",gap:8,width:"100%",marginTop:4}}>
            <button className="btn-ghost" style={{flex:1,fontSize:12,padding:"10px 14px"}}
              onClick={downloadStory}>
              📄 Download
            </button>
            <button className="btn-ghost" style={{flex:1,fontSize:12,padding:"10px 14px"}}
              onClick={()=>{
                window.speechSynthesis?.cancel();
                if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current=null; }
                autoReadRef.current = false; setIsReading(false);
                setStage("home");
              }}>
              🏠 Home
            </button>
          </div>

          <button className="btn-ghost" style={{width:"100%",marginTop:6,fontSize:12,padding:"10px 14px",
            borderColor:"rgba(217,119,6,.3)",color:"rgba(217,119,6,.8)"}}
            onClick={()=>setShowFeedback(true)}>
            ⭐ How was this story?
          </button>
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
              <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                <button className="btn-ghost" style={{fontSize:11,padding:"6px 11px"}} onClick={()=>setStage("memories")}>
                  📚 Memories
                </button>
                <button className="btn-ghost" style={{fontSize:11,padding:"6px 11px",
                  borderColor:"rgba(160,120,255,.25)",color:"rgba(160,120,255,.8)"}}
                  onClick={()=>setStage("library")}>
                  📖 Library
                </button>
              </div>
            </div>
            <div style={{height:10}} />

            {/* ── Re-read check (from StoryFeedback) ── */}
            {styleDna?.pendingRereadChecks?.[0] && (
              <RereadCheck
                pendingCheck={styleDna.pendingRereadChecks[0]}
                styleDna={styleDna}
                onAnswer={(updatedDna) => {
                  setStyleDna(updatedDna);
                  sSet("style_dna", updatedDna).catch(()=>{});
                }}
                onDismiss={() => {
                  const updated = {...styleDna, pendingRereadChecks: (styleDna.pendingRereadChecks||[]).slice(1)};
                  setStyleDna(updated);
                  sSet("style_dna", updated).catch(()=>{});
                }}
              />
            )}

            {/* ── Demo story strip ── */}
            <div onClick={()=>{ setBook({...DEMO_BOOK}); setPageIdx(0); setStage("book"); setFromCache(false); }}
              style={{borderRadius:14,overflow:"hidden",
                border:"1.5px solid rgba(212,160,48,.5)",
                boxShadow:"0 0 0 3px rgba(212,160,48,.06)",
                cursor:"pointer",marginBottom:18,transition:"transform .15s",
                background:"rgba(13,21,53,.95)"}}
              onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-1px)")}
              onMouseLeave={e=>(e.currentTarget.style.transform="none")}>
              <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:11}}>
                <div style={{fontSize:26,flexShrink:0}}>🌙</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:8,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",
                    color:"rgba(212,160,48,.7)",marginBottom:3}}>Example story</div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:13,fontWeight:700,
                    color:"var(--cream)",lineHeight:1.3,marginBottom:2}}>The Stone in Her Pocket</div>
                  <div style={{fontSize:9,color:"rgba(140,100,220,.9)",fontWeight:700}}>Tap to read →</div>
                </div>
              </div>
              <div style={{background:"rgba(212,160,48,.05)",padding:"8px 14px",
                borderTop:"1px solid rgba(212,160,48,.12)",
                fontFamily:"'Fraunces',serif",fontSize:11,fontStyle:"italic",
                color:"rgba(240,210,130,.85)",lineHeight:1.6}}>
                "Adina yawned the kind of yawn that means everything is okay now."
              </div>
            </div>

            <div className="card" style={{marginBottom:10}}>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:17,fontWeight:700,color:"var(--cream)",marginBottom:12,textAlign:"center",fontStyle:"italic"}}>
                ✨ Tonight's story is for…
              </div>
              {heroName.trim().length<1 && (
                <div style={{textAlign:"center",marginBottom:8}}>
                  <div style={{fontSize:10,color:"rgba(212,160,48,.7)",
                    fontStyle:"italic",fontFamily:"'Fraunces',serif",marginBottom:3}}>
                    Start here. Type your child's name.
                  </div>
                  <div style={{fontSize:14,color:"rgba(212,160,48,.6)"}}>↓</div>
                </div>
              )}
              <input className="finput hero-input" placeholder="Your child's name…"
                value={heroName} onChange={e=>{
                  setHeroName(e.target.value);
                  if(!hasSeenOnboard && e.target.value.trim().length >= 1) {
                    setHasSeenOnboard(true);
                    sSet("onboarded",{v:true});
                  }
                }} maxLength={20}
                style={{marginBottom:heroName.trim().length<2?6:10,textAlign:"center",
                  borderColor:heroName.trim().length<2?"rgba(212,160,48,.35)":"rgba(255,255,255,.1)",
                  transition:"border-color .3s"}} />
              {heroName.trim().length<2 && (
                <div style={{textAlign:"center",fontSize:11,color:"rgba(212,160,48,.85)",
                  marginBottom:10,fontWeight:700,letterSpacing:".02em",animation:"fadeUp .4s ease"}}>
                  ✦ Type a name to unlock your story ✦
                </div>
              )}
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


                        {/* ── About section ── */}
            <div style={{marginTop:32,paddingTop:22}}>

              {/* Divider 5 — centred stack */}
              <div style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4,marginBottom:16}}>
                <span style={{fontSize:16,filter:"opacity(.55)"}}>🌙</span>
                <span style={{fontSize:8.5,fontWeight:700,letterSpacing:".13em",textTransform:"uppercase",color:"rgba(212,160,48,.5)"}}>About SleepSeed</span>
                <div style={{width:26,height:1,background:"rgba(212,160,48,.3)",marginTop:1}} />
              </div>

              {/* Headline */}
              <div style={{textAlign:"center",marginBottom:14}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,
                  color:"var(--gold2)",marginBottom:8,fontStyle:"italic",lineHeight:1.15,
                  letterSpacing:".01em"}}>
                  Bedtime, but better.
                </div>
                <div style={{width:36,height:2,background:"linear-gradient(90deg,transparent,rgba(212,160,48,.55),transparent)",
                  margin:"0 auto 12px"}} />
                <div style={{fontFamily:"'Fraunces',serif",fontSize:12,fontStyle:"italic",
                  color:"rgba(212,160,48,.78)",lineHeight:1.85,maxWidth:300,margin:"0 auto",padding:"0 4px"}}>
                  A bedtime story written{" "}
                  <span style={{color:"var(--gold2)",fontStyle:"italic"}}>just for your child, in seconds</span>
                  {" "}— about their day, their feelings, or the wildest adventure their imagination can dream up.{" "}
                  Every night. Always different. Always theirs.
                </div>
              </div>

              {/* Three compact cards */}
              <div style={{display:"flex",gap:6,marginBottom:16}}>
                {[
                  {icon:"🌟", title:"Their world", body:"Real life or pure fantasy", accent:"rgba(212,160,48,.15)", border:"rgba(212,160,48,.2)"},
                  {icon:"💛", title:"Real bonding", body:"Connection every night",    accent:"rgba(76,200,144,.1)",  border:"rgba(76,200,144,.2)"},
                  {icon:"📄", title:"Keep forever", body:"A real printed book",       accent:"rgba(160,120,255,.1)", border:"rgba(160,120,255,.2)"},
                ].map(({icon,title,body,accent,border}) => (
                  <div key={title} style={{flex:1,background:accent,border:`1px solid ${border}`,
                    borderRadius:11,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{fontSize:18,marginBottom:5}}>{icon}</div>
                    <div style={{fontSize:10,fontWeight:700,color:"var(--cream)",marginBottom:3,lineHeight:1.3}}>{title}</div>
                    <div style={{fontSize:9,color:"rgba(190,200,240,.6)",lineHeight:1.4}}>{body}</div>
                  </div>
                ))}
              </div>

              {/* Quote */}
              <div style={{padding:"14px 16px",
                background:"linear-gradient(135deg,rgba(212,160,48,.07),rgba(180,130,30,.03))",
                border:"1px solid rgba(212,160,48,.2)",borderRadius:13,marginBottom:14}}>
                <div style={{fontSize:26,color:"rgba(212,160,48,.22)",fontFamily:"Georgia,serif",
                  lineHeight:1,marginBottom:5,fontWeight:700}}>"</div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:12,fontStyle:"italic",
                  color:"var(--gold3)",lineHeight:1.85,textAlign:"center"}}>
                  Children don't remember the nights they fell asleep quickly.
                  They remember the nights someone made something just for them.
                </div>
                <div style={{fontSize:26,color:"rgba(212,160,48,.22)",fontFamily:"Georgia,serif",
                  lineHeight:1,marginTop:4,fontWeight:700,textAlign:"right"}}>"</div>
              </div>

              <div style={{textAlign:"center",paddingBottom:6}}>
                <div style={{fontSize:9,color:"rgba(212,160,48,.4)",letterSpacing:".12em",textTransform:"uppercase",fontWeight:700}}>
                  Made with love · sleepseed.app
                </div>
              </div>

            </div>

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

                {/* Story Length */}
                <div>
                  <div className="section-label" style={{marginBottom:8}}>📖 Story Length</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {LENGTHS.map(l => (
                      <button key={l.value}
                        style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:11,cursor:"pointer",
                          border:`1.5px solid ${storyLen===l.value?"rgba(212,160,48,.7)":"rgba(255,255,255,.1)"}`,
                          background:storyLen===l.value?"rgba(212,160,48,.1)":"rgba(255,255,255,.04)",
                          transition:"all .2s"}}
                        onClick={()=>setStoryLen(l.value)}>
                        <span style={{fontSize:13,fontWeight:700,color:storyLen===l.value?"var(--gold2)":"var(--cream)"}}>{l.label}</span>
                        <span style={{fontSize:11,color:"var(--dimmer)"}}>{l.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divider" />

                {/* Open prompt */}
                <div>
                  <div className="section-label" style={{marginBottom:8}}>
                    ✏️ Make it yours <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--dimmer)",fontSize:9}}>(optional)</span>
                  </div>
                  <div style={{display:"flex",gap:6,marginBottom:9}}>
                    {["Who","What","Where"].map(w => (
                      <div key={w} style={{padding:"3px 9px",borderRadius:99,fontSize:9,fontWeight:700,letterSpacing:".04em",
                        border:"1px solid rgba(255,255,255,.12)",color:"rgba(190,200,240,.6)",background:"rgba(255,255,255,.04)"}}>
                        {w}
                      </div>
                    ))}
                  </div>
                  <div style={{position:"relative"}}>
                    <textarea className="ftarea"
                      style={{fontSize:12,border:"1.5px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.07)",
                        minHeight:78,paddingRight:40,"--placeholder-color":"rgba(175,185,225,.7)" as any}}
                      placeholder={`e.g. '${heroName} and her dog Biscuit find a dragon who is scared of the dark' or 'something funny happens at bedtime involving a very grumpy sock'…`}
                      value={storyGuidance} onChange={e=>setStoryGuidance(e.target.value)} maxLength={300} />
                    <button
                      onClick={startListening}
                      title="Hold to speak"
                      style={{position:"absolute",right:8,bottom:8,width:28,height:28,borderRadius:"50%",
                        border:`1.5px solid ${isListening?"rgba(240,80,80,.6)":"rgba(212,160,48,.4)"}`,
                        background:isListening?"rgba(240,80,80,.15)":"rgba(212,160,48,.08)",
                        color:isListening?"#f08080":"rgba(212,160,48,.8)",
                        fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                        transition:"all .2s",flexShrink:0}}>
                      {isListening ? "⏹" : "🎤"}
                    </button>
                  </div>
                  <div style={{fontSize:10,color:"rgba(190,200,240,.7)",marginTop:5,textAlign:"center",lineHeight:1.5}}>
                    {isListening
                      ? <span style={{color:"rgba(240,80,80,.85)",fontWeight:700}}>Listening… speak now</span>
                      : <span>Tap 🎤 to speak · For more control, use <span style={{color:"rgba(160,120,255,.85)",fontWeight:700}}>Build My Story →</span></span>
                    }
                  </div>
                </div>

              </div>
            </div>

            {error && <div className="err-box" style={{marginBottom:8}}>⚠️ {error}</div>}
            <button className="btn" style={{marginBottom:10}} onClick={()=>{
              generate({extraChars:[], occasion:"", occasionCustom:"", lessons:[], adventure:false, storyMood:"", storyPace:"normal", storyStyle:"standard", heroTraits:[]});
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

                {/* ── Story Brief Builder ── */}
                <div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,color:"var(--cream)",marginBottom:4}}>
                    What's tonight's story about?
                  </div>
                  <div style={{fontSize:11,color:"var(--dimmer)",marginBottom:10}}>Two steps build your brief — or just type anything</div>

                  {/* Live preview */}
                  {(storyBrief1||storyBrief2) && (
                    <div style={{background:"rgba(212,160,48,.07)",border:"1px solid rgba(212,160,48,.2)",borderRadius:10,padding:"10px 13px",fontSize:12,lineHeight:1.7,marginBottom:10,color:"var(--cream)"}}>
                      {storyBrief1 && <span style={{color:"var(--gold2)",fontWeight:700}}>{heroName} is {storyBrief1}.</span>}
                      {storyBrief1 && storyBrief2 && " "}
                      {storyBrief2 && <span>The story should feel <span style={{color:"var(--gold2)",fontWeight:700}}>{storyBrief2}</span>.</span>}
                    </div>
                  )}

                  {/* Step 1 */}
                  <div style={{border:"1px solid rgba(255,255,255,.1)",borderRadius:10,overflow:"hidden",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer",background:"rgba(255,255,255,.03)"}}
                      onClick={()=>setBriefStep1Open(o=>!o)}>
                      <div style={{width:18,height:18,borderRadius:"50%",background:storyBrief1?"rgba(76,200,144,.2)":"rgba(100,160,255,.2)",color:storyBrief1?"#80d8a8":"#a8c8ff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                      <div style={{fontSize:11,fontWeight:700,color:"var(--dim)",flex:1}}>Tonight, {heroName} is…</div>
                      {storyBrief1 && <div style={{fontSize:10,color:"#a8c8ff",maxWidth:150,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{storyBrief1}</div>}
                    </div>
                    {briefStep1Open && (
                      <div style={{padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,.07)"}}>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"var(--dimmer)",marginBottom:5}}>Real life</div>
                        <div className="guidance-chips" style={{marginBottom:realLifeChip?6:8}}>
                          {[
                            {l:"something real today",    v:"going through something real from today",   p:`What happened? e.g. '${heroName} had a falling out with her best friend' or 'he tried really hard at something and didn't quite get there'…`},
                            {l:"feeling something big",   v:"feeling a big emotion tonight",             p:`What's ${heroName} feeling? e.g. 'she's been really anxious about something' or 'he's upset but not sure why'…`},
                            {l:"a tricky situation",      v:"dealing with a tricky situation",           p:`What's the situation? e.g. 'there's been tension with a sibling all day' or 'she said something she wishes she hadn't'…`},
                            {l:"celebrating something",   v:"celebrating something that happened",       p:`What happened? e.g. 'she got the main part in the school play' or 'he finally learned to ride his bike today'…`},
                          ].map(o => (
                            <button key={o.v} className={`guidance-chip${storyBrief1===o.v?" on":""}`}
                              onClick={()=>{ setStoryBrief1(o.v); setRealLifeChip(o.p); setRealLifeCtx(""); }}>
                              {o.l}
                            </button>
                          ))}
                        </div>
                        {realLifeChip && (
                          <div style={{marginBottom:8,animation:"fadeUp .2s ease"}}>
                            <div style={{fontSize:10,color:"rgba(76,200,144,.8)",marginBottom:4,fontWeight:700}}>
                              Tell us more <span style={{fontWeight:400,color:"var(--dimmer)"}}>— optional, but makes the story much more personal</span>
                            </div>
                            <div style={{position:"relative"}}>
                              <textarea className="ftarea" rows={2} style={{minHeight:52,fontSize:12,paddingRight:38}}
                                placeholder={realLifeChip}
                                value={realLifeCtx}
                                onChange={e=>setRealLifeCtx(e.target.value)}
                                maxLength={200} />
                              <button onClick={()=>{
                                const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
                                if(!SR){alert("Voice input isn't supported in this browser. Try Chrome or Safari.");return;}
                                const rec=new SR(); rec.lang="en-US"; rec.continuous=false; rec.interimResults=false;
                                rec.onstart=()=>setIsListening(true);
                                rec.onend=()=>setIsListening(false);
                                rec.onerror=()=>setIsListening(false);
                                rec.onresult=(e)=>{ const t=Array.from(e.results).map((r:any)=>r[0].transcript).join(" "); setRealLifeCtx(g=>g?g+' '+t:t); setIsListening(false); };
                                rec.start();
                              }}
                              title="Tap to speak"
                              style={{position:"absolute",right:8,bottom:8,width:26,height:26,borderRadius:"50%",
                                border:`1.5px solid ${isListening?"rgba(240,80,80,.6)":"rgba(212,160,48,.35)"}`,
                                background:isListening?"rgba(240,80,80,.12)":"rgba(212,160,48,.06)",
                                color:isListening?"#f08080":"rgba(212,160,48,.7)",
                                fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                                transition:"all .2s",flexShrink:0}}>
                              {isListening ? "⏹" : "🎤"}
                            </button>
                            </div>
                            <div style={{fontSize:10,color:"rgba(190,200,240,.7)",marginTop:5,textAlign:"center",lineHeight:1.5}}>
                              {isListening
                                ? <span style={{color:"rgba(240,80,80,.85)",fontWeight:700}}>Listening… speak now</span>
                                : <span>Tap 🎤 to speak</span>
                              }
                            </div>
                            <button style={{fontSize:10,color:"var(--dimmer)",background:"none",border:"none",cursor:"pointer",padding:"2px 0",textDecoration:"underline"}}
                              onClick={()=>{ setBriefStep1Open(false); setBriefStep2Open(true); }}>
                              {realLifeCtx.trim() ? "Done — continue to step 2 →" : "Skip — continue to step 2 →"}
                            </button>
                          </div>
                        )}
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"var(--dimmer)",marginBottom:5}}>Fun &amp; fantasy</div>
                        <div className="guidance-chips" style={{marginBottom:8}}>
                          {[
                            {l:"a made-up adventure",     v:"about to go on a completely made-up adventure"},
                            {l:"discovering magic",       v:"about to discover something magical"},
                            {l:"a silly quest",           v:"on a silly quest with friends"},
                            {l:"a funny world",           v:"in a world where everything goes hilariously wrong"},
                          ].map(o => (
                            <button key={o.v}
                              style={{padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:700,cursor:"pointer",
                                border:`1px solid ${storyBrief1===o.v?"rgba(240,180,50,.6)":"rgba(240,180,50,.25)"}`,
                                background:storyBrief1===o.v?"rgba(240,180,50,.12)":"transparent",
                                color:storyBrief1===o.v?"#f0cc60":"rgba(240,200,80,.85)",fontFamily:"'Nunito',sans-serif",
                                transition:"all .15s"}}
                              onClick={()=>{ setStoryBrief1(o.v); setRealLifeChip(""); setRealLifeCtx(""); setBriefStep1Open(false); setBriefStep2Open(true); }}>
                              {o.l}
                            </button>
                          ))}
                        </div>
                        <div style={{borderTop:"1px dashed rgba(255,255,255,.12)",margin:"10px 0 10px",paddingTop:10}}>
                          <div style={{fontSize:11,fontWeight:700,color:"var(--cream)",marginBottom:5}}>
                            ✏️ Or just write anything you want
                          </div>
                          <div style={{fontSize:10,color:"rgba(190,200,240,.7)",marginBottom:7,lineHeight:1.5}}>
                            Skip the chips entirely — describe the story in your own words
                          </div>
                          <div style={{position:"relative"}}>
                            <textarea className="ftarea" rows={3} style={{minHeight:68,fontSize:12,border:"1.5px solid rgba(255,255,255,.18)",background:"rgba(255,255,255,.07)",paddingRight:40}}
                              placeholder="e.g. 'Lily is nervous about starting at her new school next week' or 'a dragon who is scared of fire goes on a quest to find someone who can help' or 'something silly and funny involving bedtime and a talking sock'…"
                              value={storyBrief1.startsWith("about")||storyBrief1.startsWith("on ")||storyBrief1.startsWith("in ")||storyBrief1.startsWith("going")||storyBrief1.startsWith("feeling")||storyBrief1.startsWith("dealing")||storyBrief1.startsWith("celebrating")? "":(storyBrief1||"")}
                              onChange={e=>{ setStoryBrief1(e.target.value); }} />
                            <button onClick={()=>{
                                const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
                                if(!SR){alert("Voice input isn't supported in this browser. Try Chrome or Safari.");return;}
                                const rec=new SR(); rec.lang="en-US"; rec.continuous=false; rec.interimResults=false;
                                rec.onstart=()=>setIsListening(true);
                                rec.onend=()=>setIsListening(false);
                                rec.onerror=()=>setIsListening(false);
                                rec.onresult=(e)=>{
                                  const t=Array.from(e.results).map((r:any)=>r[0].transcript).join(" ");
                                  setStoryBrief1(g=>(g&&!["about","on ","in ","going","feeling","dealing","celebrating"].some(p=>g.startsWith(p))?g+" ":"")+t);
                                  setIsListening(false);
                                };
                                rec.start();
                              }}
                              title="Tap to speak"
                              style={{position:"absolute",right:8,bottom:8,width:28,height:28,borderRadius:"50%",
                                border:`1.5px solid ${isListening?"rgba(240,80,80,.6)":"rgba(212,160,48,.4)"}`,
                                background:isListening?"rgba(240,80,80,.15)":"rgba(212,160,48,.08)",
                                color:isListening?"#f08080":"rgba(212,160,48,.8)",
                                fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                                transition:"all .2s"}}>
                              {isListening ? "⏹" : "🎤"}
                            </button>
                          </div>
                          <div style={{fontSize:10,color:"rgba(190,200,240,.7)",marginTop:5,textAlign:"center",lineHeight:1.5}}>
                            {isListening
                              ? <span style={{color:"rgba(240,80,80,.85)",fontWeight:700}}>Listening… speak now</span>
                              : <span>Tap 🎤 to speak</span>
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2 */}
                  <div style={{border:"1px solid rgba(255,255,255,.1)",borderRadius:10,overflow:"hidden"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer",background:"rgba(255,255,255,.03)"}}
                      onClick={()=>setBriefStep2Open(o=>!o)}>
                      <div style={{width:18,height:18,borderRadius:"50%",background:storyBrief2?"rgba(76,200,144,.2)":"rgba(100,160,255,.2)",color:storyBrief2?"#80d8a8":"#a8c8ff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                      <div style={{fontSize:11,fontWeight:700,color:"var(--dim)",flex:1}}>The story should feel…</div>
                      {storyBrief2 && <div style={{fontSize:10,color:"#a8c8ff",maxWidth:150,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{storyBrief2}</div>}
                    </div>
                    {briefStep2Open && (
                      <div style={{padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,.07)"}}>
                        <div className="guidance-chips" style={{marginBottom:8}}>
                          {[
                            {l:"😂 Warm & funny",     v:"warm and funny, with lots of laughs"},
                            {l:"🌙 Calm & cosy",      v:"calm and cosy, drifting toward sleep"},
                            {l:"⚡ Exciting",          v:"exciting and full of surprises"},
                            {l:"💛 Heartfelt",        v:"heartfelt and emotionally true"},
                            {l:"🤪 Completely silly", v:"completely silly from start to finish"},
                            {l:"🔍 Mysterious",       v:"mysterious with a satisfying ending"},
                          ].map(o => (
                            <button key={o.v} className={`guidance-chip${storyBrief2===o.v?" on":""}`}
                              onClick={()=>{ setStoryBrief2(o.v); setBriefStep2Open(false); }}>
                              {o.l}
                            </button>
                          ))}
                        </div>
                        <div style={{fontSize:9,color:"var(--dimmer)",marginBottom:4}}>or describe it yourself:</div>
                        <div style={{position:"relative"}}>
                          <textarea className="ftarea" rows={1} style={{minHeight:38,fontSize:12,paddingRight:38}}
                            placeholder="e.g. gentle and slow, action-packed, the funniest story ever told…"
                            value={["warm and funny, with lots of laughs","calm and cosy, drifting toward sleep","exciting and full of surprises","heartfelt and emotionally true","completely silly from start to finish","mysterious with a satisfying ending"].includes(storyBrief2)?"":storyBrief2}
                            onChange={e=>setStoryBrief2(e.target.value)} />
                          <button onClick={()=>{
                                const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
                                if(!SR){alert("Voice input isn't supported in this browser. Try Chrome or Safari.");return;}
                                const rec=new SR(); rec.lang="en-US"; rec.continuous=false; rec.interimResults=false;
                                rec.onstart=()=>setIsListening(true);
                                rec.onend=()=>setIsListening(false);
                                rec.onerror=()=>setIsListening(false);
                                rec.onresult=(e)=>{ const t=Array.from(e.results).map((r:any)=>r[0].transcript).join(" "); setStoryBrief2(g=>g?g+' '+t:t); setIsListening(false); };
                                rec.start();
                              }}
                              title="Tap to speak"
                              style={{position:"absolute",right:8,bottom:8,width:26,height:26,borderRadius:"50%",
                                border:`1.5px solid ${isListening?"rgba(240,80,80,.6)":"rgba(212,160,48,.35)"}`,
                                background:isListening?"rgba(240,80,80,.12)":"rgba(212,160,48,.06)",
                                color:isListening?"#f08080":"rgba(212,160,48,.7)",
                                fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                                transition:"all .2s",flexShrink:0}}>
                              {isListening ? "⏹" : "🎤"}
                            </button>
                        </div>
                        <div style={{fontSize:10,color:"rgba(190,200,240,.7)",marginTop:5,textAlign:"center",lineHeight:1.5}}>
                          {isListening
                            ? <span style={{color:"rgba(240,80,80,.85)",fontWeight:700}}>Listening… speak now</span>
                            : <span>Tap 🎤 to speak</span>
                          }
                        </div>
                      </div>
                    )}
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
                          <div style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
                            <input className="char-name-in"
                              placeholder={`${CHAR_TYPES.find(t=>t.value===c.type)?.label||"Friend"}'s name…`}
                              value={c.name} maxLength={16}
                              onChange={e=>updateExtraChar(c.id,{name:e.target.value})} />
                            <input className="char-name-in"
                              placeholder={`Tell me about ${c.name||"them"}… e.g. 'best friend she argued with' or 'funny little brother'`}
                              value={c.note||""} maxLength={80}
                              style={{fontSize:10,opacity:.85}}
                              onChange={e=>updateExtraChar(c.id,{note:e.target.value})} />
                          </div>
                          <button className="btn-danger" style={{flexShrink:0,alignSelf:"flex-start"}} onClick={()=>removeExtraChar(c.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="divider" />

                {/* ── Lessons ── */}
                <div>
                  <div className="section-label" style={{marginBottom:8}}>💛 Sneak in a lesson? <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--dimmer)",fontSize:10}}>(optional)</span></div>
                  <div className="les-pills">
                    {[...LESSONS_CHARACTER,...LESSONS_EMOTIONAL].map(l => (
                      <button key={l.value} className={`les-pill${lessons.includes(l.value)?" on":""}`}
                        onClick={()=>setLessons(ls=>ls.includes(l.value)?ls.filter(x=>x!==l.value):[...ls,l.value])}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                  {lessons.length>0 && (
                    <div style={{marginTop:8}}>
                      <div style={{fontSize:10,color:"rgba(190,200,240,.65)",marginBottom:4}}>
                        What's {heroName} experiencing? <span style={{opacity:.7}}>(makes it feel real, not preachy)</span>
                      </div>
                      <div style={{position:"relative"}}>
                        <textarea className="ftarea" rows={1} style={{minHeight:40,fontSize:12,paddingRight:38}}
                          placeholder={`e.g. '${heroName} has been scared about swimming lessons tomorrow' or 'gets very frustrated when things don't go her way'…`}
                          value={lessonContext} onChange={e=>setLessonContext(e.target.value)} maxLength={200} />
                        <button onClick={()=>{
                                const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
                                if(!SR){alert("Voice input isn't supported in this browser. Try Chrome or Safari.");return;}
                                const rec=new SR(); rec.lang="en-US"; rec.continuous=false; rec.interimResults=false;
                                rec.onstart=()=>setIsListening(true);
                                rec.onend=()=>setIsListening(false);
                                rec.onerror=()=>setIsListening(false);
                                rec.onresult=(e)=>{ const t=Array.from(e.results).map((r:any)=>r[0].transcript).join(" "); setLessonContext(g=>g?g+' '+t:t); setIsListening(false); };
                                rec.start();
                              }}
                              title="Tap to speak"
                              style={{position:"absolute",right:8,bottom:8,width:26,height:26,borderRadius:"50%",
                                border:`1.5px solid ${isListening?"rgba(240,80,80,.6)":"rgba(212,160,48,.35)"}`,
                                background:isListening?"rgba(240,80,80,.12)":"rgba(212,160,48,.06)",
                                color:isListening?"#f08080":"rgba(212,160,48,.7)",
                                fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                                transition:"all .2s",flexShrink:0}}>
                              {isListening ? "⏹" : "🎤"}
                            </button>
                      </div>
                      <div style={{fontSize:10,color:"rgba(190,200,240,.7)",marginTop:5,textAlign:"center",lineHeight:1.5}}>
                        {isListening
                          ? <span style={{color:"rgba(240,80,80,.85)",fontWeight:700}}>Listening… speak now</span>
                          : <span>Tap 🎤 to speak</span>
                        }
                      </div>
                    </div>
                  )}
                </div>

                <div className="divider" />

                {/* ── Settings ── */}
                <div>
                  <div className="section-label" style={{marginBottom:8}}>📖 Story settings</div>
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:10,color:"rgba(190,200,240,.65)",marginBottom:5}}>Age group</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {AGES.map(a => (
                        <button key={a.value}
                          style={{padding:"9px 10px",borderRadius:11,cursor:"pointer",textAlign:"center",
                            border:`1.5px solid ${ageGroup===a.value?"rgba(100,160,255,.7)":"rgba(255,255,255,.1)"}`,
                            background:ageGroup===a.value?"rgba(100,160,255,.13)":"rgba(255,255,255,.04)",
                            transition:"all .2s"}}
                          onClick={()=>setAgeGroup(a.value)}>
                          <div style={{fontSize:12,fontWeight:700,color:ageGroup===a.value?"#a8c8ff":"var(--cream)"}}>{a.label}</div>
                          <div style={{fontSize:9,color:"var(--dimmer)",marginTop:1,textTransform:"uppercase",letterSpacing:".05em"}}>{a.grade}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"rgba(190,200,240,.65)",marginBottom:5}}>Story length</div>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {LENGTHS.map(l => (
                        <button key={l.value}
                          style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 13px",borderRadius:11,cursor:"pointer",textAlign:"left",
                            border:`1.5px solid ${storyLen===l.value?"rgba(212,160,48,.7)":"rgba(255,255,255,.1)"}`,
                            background:storyLen===l.value?"rgba(212,160,48,.1)":"rgba(255,255,255,.04)",
                            transition:"all .2s"}}
                          onClick={()=>setStoryLen(l.value)}>
                          <span style={{fontSize:12,fontWeight:700,color:storyLen===l.value?"var(--gold2)":"var(--cream)"}}>{l.label}</span>
                          <span style={{fontSize:10,color:"var(--dimmer)"}}>{l.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="divider" />

                {/* ── More options ── */}
                <div>
                  <button style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:12,
                    padding:"10px 14px",cursor:"pointer"}}
                    onClick={()=>setMoreOpen(o=>!o)}>
                    <div style={{textAlign:"left"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--cream)"}}>✨ More options</div>
                      <div style={{fontSize:10,fontWeight:400,color:"var(--dimmer)",marginTop:2}}>Special night · pace · style · {heroName}'s personality</div>
                    </div>
                    <span style={{fontSize:12,color:"var(--dim)",transition:"transform .25s",transform:moreOpen?"rotate(180deg)":"none"}}>▼</span>
                  </button>

                  {moreOpen && (
                    <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:14}}>

                      <div>
                        <div className="section-label" style={{marginBottom:6}}>🎉 Is tonight a special night? <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"rgba(190,200,240,.65)",fontSize:10}}>(optional)</span></div>
                        <input className="finput" style={{fontSize:13}}
                          placeholder="e.g. Birthday, 1st day of school tomorrow, lost a tooth, new baby…"
                          value={occasionCustom} onChange={e=>setOccasionCustom(e.target.value)} maxLength={120} />
                      </div>

                      <div className="divider" />

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
            <button className="btn" style={{marginBottom:16}} onClick={()=>generate({storyBrief1,storyBrief2,realLifeCtx})}>
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
              <div className="gen-title">{gen.label||"Writing the story…"}</div>
              <div className="gen-sub">
                A one-of-a-kind picture book for{" "}
                <strong style={{color:"var(--gold2)"}}>{heroName}</strong>
                {adventure && <span style={{display:"block",fontSize:12,color:"var(--gold)",marginTop:3}}>🔀 Choose-Your-Adventure mode</span>}
              </div>
              <div className="pbar">
                <div className="pfill" style={{width:`${gen.progress}%`}} />
              </div>
              <div className="plabel" style={{marginBottom:12}}>{gen.progress}%</div>

              {/* Bonding question card — visible during writing step */}
              {gen.stepIdx <= 2 && ncBondingQ && (
                <div style={{background:"rgba(160,120,255,.06)",border:"1px solid rgba(160,120,255,.18)",
                  borderRadius:14,padding:"13px 15px",marginBottom:12}}>
                  <div style={{fontSize:8,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",
                    color:"rgba(160,120,255,.55)",marginBottom:6}}>While you wait…</div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:12,fontStyle:"italic",
                    color:"rgba(210,200,245,.88)",lineHeight:1.75,marginBottom:10}}>
                    Snuggle in close and ask{" "}
                    <span style={{color:"var(--gold2)",fontWeight:700}}>{heroName}</span>:{" "}
                    <span style={{color:"#c0a8ff"}}>"{ncBondingQ}"</span>
                  </div>
                  {ncBondingSaved ? (
                    <div style={{background:"rgba(76,200,144,.08)",border:"1px solid rgba(76,200,144,.2)",
                      borderRadius:10,padding:"10px 12px"}}>
                      <div style={{fontSize:8,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",
                        color:"rgba(76,200,144,.6)",marginBottom:4}}>✓ Saved for Night Card</div>
                      <div style={{fontFamily:"'Kalam',cursive",fontSize:13,color:"var(--cream)",lineHeight:1.6}}>
                        "{ncBondingA}"
                      </div>
                    </div>
                  ) : (
                    <>
                      <textarea
                        className="ftarea"
                        placeholder={`What did ${heroName} say?`}
                        value={ncBondingA}
                        onChange={e=>setNcBondingA(e.target.value)}
                        style={{minHeight:48,fontSize:13,background:"rgba(255,255,255,.04)",
                          border:"1px solid rgba(160,120,255,.15)",borderRadius:10,
                          padding:"10px 12px",color:"var(--cream)",
                          fontFamily:"'Kalam',cursive",lineHeight:1.6,resize:"none",marginBottom:8}}
                      />
                      <button
                        className="btn-ghost"
                        disabled={!ncBondingA.trim()}
                        style={{width:"100%",fontSize:12,padding:"8px 12px",
                          ...(ncBondingA.trim() ? {borderColor:"rgba(76,200,144,.4)",color:"#80d8a8",background:"rgba(76,200,144,.06)"} : {})}}
                        onClick={()=>{ if(ncBondingA.trim()) setNcBondingSaved(true); }}>
                        {ncBondingA.trim() ? "✓ Save answer for Night Card" : "Type an answer above"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {gen.dots.length>0 && (
                <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center",marginBottom:10}}>
                  {gen.dots.map((s,i) => (
                    <div key={i} className={`img-dot ${s==="p"?"busy":"done"}`}>{s==="d"?"✓":"…"}</div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {["Setting the scene…","Writing the story…","Painting illustrations…","Book is ready!"].map((s,i) => (
                  <div key={i} className={`pstep ${i===gen.stepIdx?"active":i<gen.stepIdx?"done":""}`}>
                    <div className="pstep-dot" />
                    <span>{i<gen.stepIdx?"✓ ":""}{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ERROR RECOVERY */}
        {stage==="error" && (
          <div className="screen" style={{maxWidth:420}}>
            <div className="card" style={{textAlign:"center",padding:24}}>
              <div style={{fontSize:36,marginBottom:12}}>😔</div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,color:"var(--cream)",marginBottom:8}}>Something went wrong</div>
              <div style={{fontSize:12,color:"var(--dim)",marginBottom:6,lineHeight:1.7}}>{error}</div>
              <div style={{fontSize:11,color:"var(--dimmer)",marginBottom:20,lineHeight:1.6}}>
                Don't worry — all your story settings are saved.
              </div>
              <button className="btn" style={{marginBottom:10}} onClick={()=>{
                setError("");
                setStage(lastErrStage||"quick");
              }}>
                ✨ Try again
              </button>
              <button className="btn-ghost" style={{width:"100%",fontSize:12}} onClick={()=>{
                setError(""); setStage("home");
              }}>
                ← Back to home
              </button>
            </div>
          </div>
        )}

        {/* BOOK */}
        {stage==="book" && book && (
          <div className="book-shell">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}}
                onClick={()=>{
                  window.speechSynthesis?.cancel();
                  if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current=null; }
                  autoReadRef.current = false; setIsReading(false);
                  setStage("home");
                }}>
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
              <button className={`ctrl-btn read${isReading?" active":""}`}
                onClick={()=>{ const prog=totalPages>1?pageIdx/(totalPages-1):0.5; toggleRead(pageIdx===0?`${book.title}. A bedtime story for ${book.heroName}.`:getCurrentPageText(),prog); }}>
                {isReading ? "⏸ Pause" : (selectedVoiceId||voiceId) ? `🔊 ${(PRESET_VOICES.find(v=>v.id===selectedVoiceId)||{name:voiceId?"My Voice":"Read"}).name}` : "🔊 Read aloud"}
              </button>
              <div className="ctrl-btn" style={{cursor:"default",background:"rgba(76,200,144,.08)",borderColor:"rgba(76,200,144,.25)",color:"var(--green2)",fontSize:11}}>
                ✓ Auto-saved
              </div>
              <button className="ctrl-btn fresh" onClick={async()=>{
                try {
                  const s = makeStorySeed(heroName,theme,extraChars,occasion,occasionCustom,lesson,adventure,storyLen,heroGender,heroClassify,storyGuidance);
                  await sDel(`book_${s}`);
                } catch(_) {}
                window.speechSynthesis?.cancel();
                if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current=null; }
                autoReadRef.current = false;
                setStoryContext(""); setLessonContext(""); setTodayPrompt(""); setStoryBrief1(""); setStoryBrief2(""); setRealLifeChip(""); setRealLifeCtx(""); setBriefStep1Open(true); setBriefStep2Open(false);
                setStage("home"); setBook(null); setChosenPath(null); setIsReading(false);
              }}>🔄 New</button>
              <button className="ctrl-btn dl" onClick={downloadStory}>📄 Download</button>
              <button className="ctrl-btn" style={{background:"rgba(100,160,255,.1)",borderColor:"rgba(100,160,255,.25)",color:"#a8c8ff"}}
                onClick={shareStory}>📤 Share</button>
              <button className={`ctrl-btn vc-btn${(selectedVoiceId||voiceId)?" active":""}`}
                onClick={()=>setShowVoicePicker(true)}>
                🎤 {selectedVoiceId ? (PRESET_VOICES.find(v=>v.id===selectedVoiceId)?.name||"Voice") : voiceId ? "My Voice ✓" : "Choose Voice"}
              </button>
            </div>

            {/* ── Voice Picker Modal ── */}
            {showVoicePicker && (
              <div className="vc-modal" onClick={e=>{ if(e.target===e.currentTarget) setShowVoicePicker(false); }}>
                <div className="vc-card" style={{maxHeight:"80vh",overflowY:"auto"}}>
                  <div className="vc-title">🎤 Choose a Voice</div>
                  <div className="vc-sub">Who reads tonight's story?</div>

                  {/* Preset voices */}
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--dimmer)",marginBottom:8}}>Narrators</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
                    {PRESET_VOICES.map(v => (
                      <button key={v.id}
                        style={{padding:"10px 10px",borderRadius:11,cursor:"pointer",textAlign:"left",
                          border:`1.5px solid ${selectedVoiceId===v.id?"rgba(212,160,48,.7)":"rgba(255,255,255,.1)"}`,
                          background:selectedVoiceId===v.id?"rgba(212,160,48,.1)":"rgba(255,255,255,.04)",
                          transition:"all .15s"}}
                        onClick={()=>{ setSelectedVoiceId(selectedVoiceId===v.id?null:v.id); }}>
                        <div style={{fontSize:16,marginBottom:3}}>{v.emoji}</div>
                        <div style={{fontSize:12,fontWeight:700,color:selectedVoiceId===v.id?"var(--gold2)":"var(--cream)"}}>{v.name}</div>
                        <div style={{fontSize:9,color:"var(--dimmer)",marginTop:1}}>{v.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div style={{height:1,background:"rgba(255,255,255,.08)",marginBottom:14}} />

                  {/* Clone voice option */}
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--dimmer)",marginBottom:8}}>Your Own Voice</div>
                  <button style={{width:"100%",padding:"12px 14px",borderRadius:11,cursor:"pointer",textAlign:"left",
                    border:`1.5px solid ${voiceId?"rgba(76,200,144,.5)":"rgba(255,255,255,.1)"}`,
                    background:voiceId?"rgba(76,200,144,.08)":"rgba(255,255,255,.04)",marginBottom:14}}
                    onClick={()=>{ setShowVoicePicker(false); setVcStage(voiceId?"ready":"idle"); setShowVcModal(true); }}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:22}}>🎙️</span>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:voiceId?"#80d8a8":"var(--cream)"}}>{voiceId?"My Voice ✓":"Record My Voice"}</div>
                        <div style={{fontSize:9,color:"var(--dimmer)",marginTop:1}}>
                          {voiceId?"Your cloned voice is active — tap to manage":"Clone your voice in 45 seconds"}
                        </div>
                      </div>
                    </div>
                  </button>

                  <div style={{display:"flex",gap:8}}>
                    {(selectedVoiceId||voiceId) && (
                      <button className="btn-ghost" style={{flex:1,fontSize:12,padding:10}}
                        onClick={()=>{ setSelectedVoiceId(null); }}>
                        🔇 No Voice
                      </button>
                    )}
                    <button className="btn" style={{flex:2,padding:11,fontSize:14}}
                      onClick={()=>setShowVoicePicker(false)}>
                      Done ✓
                    </button>
                  </div>
                </div>
              </div>
            )}

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

        {/* NIGHT CARD FLOW */}
        {stage==="nightcard" && book && (
          <div className="nc-flow">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div className="brand-gem" style={{width:30,height:30,fontSize:15,borderRadius:9}}>🌙</div>
                <span className="brand-name" style={{fontSize:16}}>Night Card</span>
              </div>
              <button className="btn-ghost" style={{fontSize:11,padding:"5px 10px"}}
                onClick={()=>{
                  ncStreamRef.current?.getTracks().forEach(t=>t.stop());
                  setStage("book"); setPageIdx(totalPages-1);
                }}>✕ Skip</button>
            </div>

            {/* Step dots */}
            <div className="nc-step-dots">
              {[0,1,2,3,4].map(i => (
                <div key={i} className={`nc-sdot${ncStep===i?" active":""}${ncStep>i?" done":""}`} />
              ))}
            </div>

            {/* Step 0: Bonding Question */}
            {ncStep===0 && (
              <div className="nc-step-card" key="s0">
                <div className="nc-step-icon">💬</div>
                <div className="nc-step-title">Bonding moment</div>
                <div className="nc-step-sub">During the story, you asked {book.heroName}:</div>
                <div className="nc-step-q">"{ncBondingQ || "What made you smile today?"}"</div>
                <textarea className="ftarea" placeholder={`What did ${book.heroName} say?`}
                  value={ncBondingA} onChange={e=>setNcBondingA(e.target.value)}
                  style={{marginBottom:14,minHeight:60}} />
                <button className="btn" onClick={()=>setNcStep(1)}>
                  {ncBondingA.trim() ? "Next →" : "Skip →"}
                </button>
              </div>
            )}

            {/* Step 1: Gratitude Weave */}
            {ncStep===1 && (
              <div className="nc-step-card" key="s1">
                <div className="nc-step-icon">✨</div>
                <div className="nc-step-title">Best three seconds</div>
                <div className="nc-step-sub">What was the best tiny moment of tonight?<br />A laugh, a look, a whisper — anything.</div>
                <textarea className="ftarea" placeholder="The best three seconds were…"
                  value={ncGratitude} onChange={e=>setNcGratitude(e.target.value)}
                  style={{marginBottom:14,minHeight:60}} />
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-ghost" style={{flex:1}} onClick={()=>setNcStep(0)}>← Back</button>
                  <button className="btn" style={{flex:2}} onClick={()=>setNcStep(2)}>
                    {ncGratitude.trim() ? "Next →" : "Skip →"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Optional Extra */}
            {ncStep===2 && (
              <div className="nc-step-card" key="s2">
                <div className="nc-step-icon">📝</div>
                <div className="nc-step-title">Anything else?</div>
                <div className="nc-step-sub">Anything else to remember about tonight?<br/>
                  <span style={{color:"var(--dimmer)",fontSize:10}}>Totally optional.</span>
                </div>
                <textarea className="ftarea" placeholder="A note for future you…"
                  value={ncExtra} onChange={e=>setNcExtra(e.target.value)}
                  style={{marginBottom:14,minHeight:60}} />
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-ghost" style={{flex:1}} onClick={()=>setNcStep(1)}>← Back</button>
                  <button className="btn" style={{flex:2}} onClick={()=>setNcStep(3)}>
                    {ncExtra.trim() ? "Next →" : "Skip →"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Photo */}
            {ncStep===3 && (
              <div className="nc-step-card" key="s3">
                <div className="nc-step-icon">📸</div>
                <div className="nc-step-title">Capture this moment</div>
                <div className="nc-step-sub">Take a quick photo for your Night Card.</div>

                {!ncPhoto ? (
                  <>
                    <div className="nc-camera">
                      <video ref={ncVideoRef} autoPlay playsInline muted
                        style={{display:"block"}}
                        onLoadedMetadata={()=>{}} />
                      {ncCountdown > 0 && (
                        <div className="nc-countdown" key={ncCountdown}>{ncCountdown}</div>
                      )}
                    </div>
                    {/* Camera started via effect below */}
                    <div style={{display:"flex",gap:8}}>
                      <button className="btn-ghost" style={{flex:1}} onClick={()=>{
                        ncStreamRef.current?.getTracks().forEach(t=>t.stop());
                        ncStreamRef.current=null;
                        setNcStep(2);
                      }}>← Back</button>
                      <button className="btn" style={{flex:2}} disabled={ncCountdown>0}
                        onClick={()=>{
                          // 3-second countdown then capture
                          setNcCountdown(3);
                          let c = 3;
                          const iv = setInterval(()=>{
                            c--;
                            if(c > 0) { setNcCountdown(c); }
                            else {
                              clearInterval(iv);
                              setNcCountdown(0);
                              // Capture frame
                              const video = ncVideoRef.current;
                              if(video && video.videoWidth) {
                                const canvas = document.createElement("canvas");
                                const scale = Math.min(480/video.videoWidth, 480/video.videoHeight, 1);
                                canvas.width = Math.round(video.videoWidth * scale);
                                canvas.height = Math.round(video.videoHeight * scale);
                                const ctx = canvas.getContext("2d");
                                ctx.translate(canvas.width, 0);
                                ctx.scale(-1, 1); // mirror
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
                                setNcPhoto(dataUrl);
                                ncStreamRef.current?.getTracks().forEach(t=>t.stop());
                                ncStreamRef.current = null;
                              } else {
                                setNcStep(4); // fallback
                              }
                            }
                          }, 1000);
                        }}>
                        📸 {ncCountdown > 0 ? ncCountdown : "Capture"}
                      </button>
                    </div>
                    <button className="btn-ghost" style={{width:"100%",marginTop:8,fontSize:11}}
                      onClick={()=>{
                        ncStreamRef.current?.getTracks().forEach(t=>t.stop());
                        ncStreamRef.current=null;
                        setNcStep(4);
                      }}>
                      Skip photo →
                    </button>
                  </>
                ) : (
                  <>
                    <div className="nc-camera">
                      <img src={ncPhoto} alt="Captured" />
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="btn-ghost" style={{flex:1}} onClick={()=>{
                        setNcPhoto(null);
                        // Restart camera
                        navigator.mediaDevices?.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}}})
                          .then(stream => {
                            ncStreamRef.current = stream;
                            if(ncVideoRef.current) ncVideoRef.current.srcObject = stream;
                          }).catch(()=>{});
                      }}>🔄 Retake</button>
                      <button className="btn" style={{flex:2}} onClick={()=>setNcStep(4)}>
                        Use this →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Generating → Polaroid Reveal */}
            {ncStep===4 && (
              <div className="nc-step-card" key="s4">
                {!ncResult ? (
                  <>
                    <div style={{textAlign:"center",padding:"20px 0"}}>
                      <div className="gen-orb" style={{width:60,height:60,marginBottom:14}} />
                      <div className="nc-step-title">Creating your Night Card…</div>
                      <div className="nc-step-sub">Weaving tonight's moments together</div>
                    </div>
                    {/* Generation triggered via effect below */}
                  </>
                ) : (
                  <>
                    {/* Polaroid Reveal */}
                    <div className="polaroid">
                      <div className="polaroid-photo">
                        {ncPhoto ? (
                          <img src={ncPhoto} alt="Tonight" />
                        ) : (
                          <div className="polaroid-emoji">{ncResult.emoji||"🌙"}</div>
                        )}
                      </div>
                      <div className="polaroid-body">
                        <div className="polaroid-headline">{ncResult.headline}</div>
                        <div className="polaroid-quote">"{ncResult.quote}"</div>
                        {ncResult.memory_line && (
                          <div className="polaroid-memory">{ncResult.memory_line}</div>
                        )}

                        {/* Q&A sections inside the card */}
                        {(ncBondingA.trim() || ncGratitude.trim() || ncExtra.trim()) && (
                          <div style={{borderTop:"1px solid rgba(0,0,0,.08)",marginTop:8,paddingTop:8,
                            textAlign:"left",display:"flex",flexDirection:"column",gap:6}}>
                            {ncBondingQ && ncBondingA.trim() && (
                              <div>
                                <div style={{fontSize:8,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",
                                  color:"#a08a6a",marginBottom:1}}>Asked: "{ncBondingQ}"</div>
                                <div style={{fontFamily:"'Kalam',cursive",fontSize:11,color:"#4a3a1a",lineHeight:1.4}}>
                                  {ncBondingA}
                                </div>
                              </div>
                            )}
                            {ncGratitude.trim() && (
                              <div>
                                <div style={{fontSize:8,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",
                                  color:"#a08a6a",marginBottom:1}}>Best three seconds</div>
                                <div style={{fontFamily:"'Kalam',cursive",fontSize:11,color:"#4a3a1a",lineHeight:1.4}}>
                                  {ncGratitude}
                                </div>
                              </div>
                            )}
                            {ncExtra.trim() && (
                              <div>
                                <div style={{fontSize:8,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",
                                  color:"#a08a6a",marginBottom:1}}>Extra note</div>
                                <div style={{fontFamily:"'Kalam',cursive",fontSize:11,color:"#4a3a1a",lineHeight:1.4}}>
                                  {ncExtra}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="polaroid-meta" style={{marginTop:8}}>
                          {book.heroName} · {book.title} · {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                        </div>
                        <div className="polaroid-brand">🌙 SleepSeed</div>
                      </div>
                    </div>

                    {ncResult.reflection && (
                      <div style={{textAlign:"center",marginTop:14,fontFamily:"'Kalam',cursive",
                        fontSize:13,color:"rgba(200,180,255,.8)",fontStyle:"italic"}}>
                        Whisper: "{ncResult.reflection}"
                      </div>
                    )}

                    <div style={{display:"flex",gap:8,marginTop:16}}>
                      <button className="btn" style={{flex:1}} onClick={async()=>{
                        const ncData = {
                          heroName:book.heroName, storyTitle:book.title,
                          refrain:book.refrain||"",
                          bondingQ:ncBondingQ, bondingA:ncBondingA,
                          gratitude:ncGratitude, extra:ncExtra,
                          photo:ncPhoto,
                          ...ncResult,
                        };
                        try { await saveNightCard(ncData); } catch(_) {}
                        // Attach Night Card to book and re-save story
                        const updatedBook = {...book, nightCard:ncData};
                        setBook(updatedBook);
                        // Update in memories
                        const updatedMemories = memories.map(m =>
                          m.bookData?.title===book.title && m.heroName===book.heroName
                            ? {...m, bookData:updatedBook} : m
                        );
                        setMemories(updatedMemories);
                        try { await sSet("memories",{items:updatedMemories}); } catch(_) {}
                        // Update cache
                        try {
                          const s = makeStorySeed(book.heroName,theme,extraChars,occasion,occasionCustom,
                            Array.isArray(lessons)?lessons.join("|"):lessons,adventure,storyLen,heroGender,heroClassify,storyGuidance);
                          sSet(`book_${s}`,updatedBook).catch(()=>{});
                        } catch(_) {}
                        setStage("book"); setPageIdx(totalPages-1);
                      }}>
                        ✓ Save &amp; Done
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* MEMORIES LIBRARY */}
        {stage==="memories" && (
          <div className="screen">
            <div className="brand-row">
              <div className="brand-gem">🌙</div>
              <div>
                <div className="brand-name">SleepSeed</div>
                <div className="brand-tag">memories library</div>
              </div>
              <button className="btn-ghost" style={{marginLeft:"auto",fontSize:12,padding:"6px 12px"}}
                onClick={()=>setStage("home")}>🏠 Home</button>
            </div>
            <div style={{height:12}} />

            {/* ── Tabs ── */}
            <div className="mem-tabs">
              <button className={`mem-tab${memoriesTab==="stories"?" on":""}`}
                onClick={()=>setMemoriesTab("stories")}>
                📚 Stories {memories.length>0 && <span style={{opacity:.6}}>({memories.length})</span>}
              </button>
              <button className={`mem-tab${memoriesTab==="nightcards"?" on":""}`}
                onClick={()=>setMemoriesTab("nightcards")}>
                🌙 Night Cards {nightCards.length>0 && <span style={{opacity:.6}}>({nightCards.length})</span>}
              </button>
            </div>

            {/* ── Stories Tab ── */}
            {memoriesTab==="stories" && (
              <>
                <div style={{fontSize:11,color:"var(--dimmer)",marginBottom:14}}>
                  {memories.length===0 ? "Your library is empty — stories are saved automatically after each book." : `${memories.length} saved ${memories.length===1?"story":"stories"} — tap any to re-read tonight.`}
                </div>
                {memories.length===0 ? (
                  <div className="card" style={{textAlign:"center",padding:"32px 16px"}}>
                    <div style={{fontSize:38,marginBottom:10}}>🌙</div>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--dim)",marginBottom:6,fontFamily:"'Fraunces',serif"}}>No stories yet</div>
                    <div style={{fontSize:12,color:"var(--dimmer)",marginBottom:16,lineHeight:1.6}}>Generate your first story — it'll be saved here automatically.</div>
                    <button className="btn" onClick={()=>setStage("home")}>✨ Make a story</button>
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {memories.map(m => (
                      <div key={m.id}
                        style={{borderRadius:13,overflow:"hidden",
                          border:`1px solid ${m.occasion?"rgba(240,180,50,.25)":"rgba(160,120,255,.2)"}`,
                          cursor:"pointer",transition:"transform .15s"}}
                        onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-1px)")}
                        onMouseLeave={e=>(e.currentTarget.style.transform="none")}
                        onClick={()=>{ setBook(m.bookData); setPageIdx(0); setChosenPath(null); setFromCache(true); setStage("book"); }}>
                        <div style={{background:`linear-gradient(135deg,rgba(13,21,53,.97),rgba(${m.occasion?"60,40,20":"40,20,80"},.85))`,
                          padding:"11px 13px",display:"flex",alignItems:"center",gap:11}}>
                          <div style={{fontSize:24,flexShrink:0}}>{m.occasion?"🎉":"🌙"}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:"'Fraunces',serif",fontSize:13,fontWeight:700,
                              color:"var(--cream)",lineHeight:1.3,marginBottom:2,
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title}</div>
                            <div style={{fontSize:9,color:"var(--dimmer)"}}>{m.heroName} · {m.date}</div>
                          </div>
                          <button className="btn-danger" style={{flexShrink:0,alignSelf:"flex-start"}}
                            onClick={e=>{ e.stopPropagation(); deleteMemory(m.id); }}>✕</button>
                        </div>
                        {m.bookData?.refrain && (
                          <div style={{background:`rgba(${m.occasion?"212,160,48":"160,120,255"},.05)`,
                            padding:"7px 13px",
                            borderTop:`1px solid rgba(${m.occasion?"212,160,48":"160,120,255"},.1)`,
                            fontFamily:"'Fraunces',serif",fontSize:10,fontStyle:"italic",
                            color:`rgba(${m.occasion?"240,210,130":"200,180,255"},.75)`,
                            lineHeight:1.5}}>
                            "{m.bookData.refrain}"
                          </div>
                        )}
                      </div>
                    ))}
                    <button className="btn-ghost" style={{marginTop:4,fontSize:12}} onClick={()=>setStage("home")}>
                      ✨ Make a new story
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Night Cards Tab ── */}
            {memoriesTab==="nightcards" && (
              <>
                <div style={{fontSize:11,color:"var(--dimmer)",marginBottom:14}}>
                  {nightCards.length===0 ? "Night Cards are created automatically at the end of each story." : `${nightCards.length} night ${nightCards.length===1?"card":"cards"} — each one a keepsake from bedtime.`}
                </div>
                {nightCards.length===0 ? (
                  <div className="card" style={{textAlign:"center",padding:"32px 16px"}}>
                    <div style={{fontSize:38,marginBottom:10}}>🌙</div>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--dim)",marginBottom:6,fontFamily:"'Fraunces',serif"}}>No Night Cards yet</div>
                    <div style={{fontSize:12,color:"var(--dimmer)",marginBottom:16,lineHeight:1.6}}>After each story, a Night Card is created — a little keepsake from tonight.</div>
                    <button className="btn" onClick={()=>setStage("home")}>✨ Make a story</button>
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {nightCards.map(nc => (
                      <div key={nc.id}
                        style={{borderRadius:13,overflow:"hidden",cursor:"pointer",
                          border:"1px solid rgba(212,160,48,.2)",
                          background:"linear-gradient(135deg,rgba(13,21,53,.97),rgba(20,15,40,.9))",
                          transition:"transform .15s"}}
                        onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-1px)")}
                        onMouseLeave={e=>(e.currentTarget.style.transform="none")}
                        onClick={()=>setViewingNightCard(nc)}>
                        <div style={{display:"flex",gap:0,alignItems:"stretch"}}>
                          {/* Photo / emoji thumbnail — Polaroid mini */}
                          <div style={{width:nc.photo?100:56,flexShrink:0,
                            background:nc.photo?"#faf8f2":"linear-gradient(135deg,rgba(212,160,48,.08),rgba(20,15,40,.6))",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            padding:nc.photo?"6px 6px 10px 6px":"0"}}>
                            {nc.photo ? (
                              <img src={nc.photo} alt="" style={{width:"100%",borderRadius:2,
                                boxShadow:"0 1px 4px rgba(0,0,0,.15)"}} />
                            ) : (
                              <div style={{fontSize:32,lineHeight:1}}>{nc.emoji||"🌙"}</div>
                            )}
                          </div>
                          {/* Card text */}
                          <div style={{flex:1,minWidth:0,padding:"12px 13px 12px 14px",display:"flex",flexDirection:"column",gap:3}}>
                            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                              <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:700,fontStyle:"italic",
                                color:"var(--gold3)",lineHeight:1.3}}>{nc.headline}</div>
                              <button className="btn-danger" style={{flexShrink:0,marginTop:1}}
                                onClick={e=>{ e.stopPropagation(); deleteNightCard(nc.id); }}>✕</button>
                            </div>
                            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:12,fontStyle:"italic",
                              color:"rgba(240,220,160,.75)",lineHeight:1.5}}>
                              "{nc.quote}"
                            </div>
                            {nc.memory_line && (
                              <div style={{fontFamily:"'Kalam',cursive",fontSize:11,
                                color:"rgba(200,180,255,.65)",lineHeight:1.4}}>
                                {nc.memory_line}
                              </div>
                            )}
                            <div style={{fontSize:9,color:"var(--dimmer)",marginTop:1}}>
                              {nc.heroName} · <span style={{textDecoration:"underline",color:"rgba(160,140,255,.6)"}}
                                onClick={e=>{
                                  e.stopPropagation();
                                  const match = memories.find(m => m.bookData?.title===nc.storyTitle && m.heroName===nc.heroName);
                                  if(match){ setBook(match.bookData); setPageIdx(0); setChosenPath(null); setFromCache(true); setStage("book"); }
                                }}>{nc.storyTitle}</span> · {nc.date}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="btn-ghost" style={{marginTop:4,fontSize:12}} onClick={()=>setStage("home")}>
                      ✨ Make a new story
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* STORY LIBRARY */}
        {stage==="library" && (
          <div style={{width:"100%",maxWidth:"100vw",marginLeft:-16,marginRight:-16}}>
            <div style={{position:"sticky",top:0,zIndex:200,padding:"10px 16px",
              background:"rgba(6,11,24,.9)",backdropFilter:"blur(12px)",
              display:"flex",alignItems:"center",gap:8}}>
              <button className="btn-ghost" style={{fontSize:12,padding:"6px 12px"}}
                onClick={()=>setStage("home")}>← Home</button>
            </div>
            <SleepSeedLibrary />
          </div>
        )}

      </div>

      {/* ── Night Card Detail View (modal) ── */}
      {viewingNightCard && (
        <div className="vc-modal" onClick={e=>{ if(e.target===e.currentTarget) setViewingNightCard(null); }}>
          <div style={{width:"100%",maxWidth:380,maxHeight:"90vh",overflowY:"auto",animation:"fup .4s ease both"}}>
            {/* Close */}
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
              <button className="btn-ghost" style={{fontSize:11,padding:"5px 10px"}}
                onClick={()=>setViewingNightCard(null)}>✕ Close</button>
            </div>

            {/* Full Polaroid */}
            <div className="polaroid" style={{transform:"rotate(0deg)",maxWidth:"100%"}}>
              <div className="polaroid-photo">
                {viewingNightCard.photo ? (
                  <img src={viewingNightCard.photo} alt="Tonight" />
                ) : (
                  <div className="polaroid-emoji">{viewingNightCard.emoji||"🌙"}</div>
                )}
              </div>
              <div className="polaroid-body">
                <div className="polaroid-headline" style={{animation:"none",fontSize:18}}>{viewingNightCard.headline}</div>
                <div className="polaroid-quote" style={{animation:"none",fontSize:14}}>"{viewingNightCard.quote}"</div>
                {viewingNightCard.memory_line && (
                  <div className="polaroid-memory" style={{animation:"none",fontSize:13}}>{viewingNightCard.memory_line}</div>
                )}
                <div className="polaroid-meta" style={{animation:"none",fontSize:10}}>
                  {viewingNightCard.heroName} · {viewingNightCard.date}
                </div>
                <div className="polaroid-brand" style={{animation:"none"}}>🌙 SleepSeed</div>
              </div>
            </div>

            {/* Bonding answers */}
            {(viewingNightCard.bondingA || viewingNightCard.gratitude || viewingNightCard.extra) && (
              <div style={{marginTop:16,background:"rgba(160,120,255,.06)",border:"1px solid rgba(160,120,255,.15)",
                borderRadius:14,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
                {viewingNightCard.bondingQ && viewingNightCard.bondingA && (
                  <div>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",
                      color:"rgba(160,120,255,.5)",marginBottom:3}}>Asked</div>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:12,fontStyle:"italic",
                      color:"rgba(210,200,245,.8)",marginBottom:2}}>"{viewingNightCard.bondingQ}"</div>
                    <div style={{fontFamily:"'Kalam',cursive",fontSize:13,color:"var(--cream)",lineHeight:1.5}}>
                      {viewingNightCard.bondingA}
                    </div>
                  </div>
                )}
                {viewingNightCard.gratitude && (
                  <div>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",
                      color:"rgba(212,160,48,.5)",marginBottom:3}}>Best three seconds</div>
                    <div style={{fontFamily:"'Kalam',cursive",fontSize:13,color:"var(--cream)",lineHeight:1.5}}>
                      {viewingNightCard.gratitude}
                    </div>
                  </div>
                )}
                {viewingNightCard.extra && (
                  <div>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",
                      color:"rgba(76,200,144,.5)",marginBottom:3}}>Extra note</div>
                    <div style={{fontFamily:"'Kalam',cursive",fontSize:13,color:"var(--cream)",lineHeight:1.5}}>
                      {viewingNightCard.extra}
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewingNightCard.reflection && (
              <div style={{textAlign:"center",marginTop:14,fontFamily:"'Kalam',cursive",
                fontSize:13,color:"rgba(200,180,255,.7)",fontStyle:"italic"}}>
                Whisper: "{viewingNightCard.reflection}"
              </div>
            )}

            {/* Link to story */}
            <button className="btn-ghost" style={{width:"100%",marginTop:14,fontSize:12,padding:"10px 14px"}}
              onClick={()=>{
                const match = memories.find(m => m.bookData?.title===viewingNightCard.storyTitle && m.heroName===viewingNightCard.heroName);
                if(match){
                  setViewingNightCard(null);
                  setBook(match.bookData); setPageIdx(0); setChosenPath(null); setFromCache(true); setStage("book");
                }
              }}>
              📚 Read "{viewingNightCard.storyTitle}"
            </button>
          </div>
        </div>
      )}

      {/* ── Story Feedback Sheet ── */}
      <StoryFeedback
        storyMeta={book ? {
          storyId: `story_${strHash(book.title+book.heroName)}`,
          title: book.title,
          genre: book.nightCard?.genre || (storyMood === "silly" ? "comedy" : storyMood === "exciting" || adventure ? "adventure" : storyMood === "heartfelt" ? "therapeutic" : "cosy"),
          childName: book.heroName,
        } : null}
        styleDna={styleDna}
        onFeedback={(updatedDna) => {
          setStyleDna(updatedDna);
          sSet("style_dna", updatedDna).catch(()=>{});
        }}
        onClose={() => setShowFeedback(false)}
        visible={showFeedback}
      />
    </>
  );
}
