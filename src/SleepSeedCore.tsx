import { useState, useRef, useCallback, useEffect } from "react";
import SleepSeedLibrary from "./sleepseed-library";
import { buildStoryPrompt } from "./sleepseed-prompts";
import { StoryFeedback, RereadCheck } from "./StoryFeedback";
import { getCharacters, saveCharacter as saveCharToStorage } from "./lib/storage";
import type { Character } from "./lib/types";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400;1,9..144,600&family=Kalam:wght@400;700&display=swap');`;

const CSS = `
${FONTS}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#060b18;--gold:#d4a030;--gold2:#f0cc60;--gold3:#fae9a8;
  --cream:#fdf5e0;--parch:#f5e8c0;--ink:#261600;--ink2:#5a380a;--ink3:#8a5a1a;
  --ui:#c4d0f0;--dim:#6070a0;--dimmer:#3a4878;--green2:#4cc890;
  --amber:#E8972A;--amber2:#F5B84C;--amber-glow:rgba(232,151,42,.15);
  --serif2:'Playfair Display',Georgia,serif;
  --sans2:'Plus Jakarta Sans',system-ui,sans-serif;
  --mono2:'DM Mono',monospace;
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
.occ-pill.on{background:rgba(212,160,48,.13);border-color:var(--gold2);color:var(--gold2)}
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
.s-text{font-family:'Fraunces',Georgia,serif;font-size:clamp(14px,3vw,16px);color:var(--ink);line-height:1.72;flex:1;min-height:0;overflow-y:auto}
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
/* ── NEW THEME — story builder screens ── */
.nb-nav{display:flex;align-items:center;gap:10px;padding:16px 20px 14px;border-bottom:1px solid rgba(232,151,42,.1);background:rgba(6,11,24,.98);position:sticky;top:0;z-index:50;backdrop-filter:blur(16px)}
.nb-back{background:transparent;border:none;color:rgba(244,239,232,.5);font-size:13px;cursor:pointer;font-family:var(--sans2);display:flex;align-items:center;gap:5px;transition:color .15s}
.nb-back:hover{color:rgba(244,239,232,.85)}
.nb-logo{font-family:var(--serif2);font-size:16px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:8px;margin:0 auto}
.nb-moon{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);flex-shrink:0}
.nb-body{padding:22px 20px;font-family:var(--sans2);position:relative}
.nb-body-bg{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden;background:linear-gradient(180deg,#0D1018 0%,#141830 100%)}
.nb-body>*{position:relative;z-index:1}
.nb-ambient{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:420px;height:420px;border-radius:50%;pointer-events:none;z-index:0;transition:background 1.2s ease}
.nb-star{position:absolute;border-radius:50%;background:#FFF8EC;animation:nb-tw var(--d,3s) var(--dl,0s) ease-in-out infinite}
@keyframes nb-tw{0%,100%{opacity:.05}50%{opacity:.45}}
.nb-label{font-size:11px;font-family:var(--mono2);letter-spacing:1.5px;text-transform:uppercase;color:rgba(232,151,42,.75);margin-bottom:11px;display:flex;align-items:center;gap:7px}
.nb-label::before{content:'';width:16px;height:1px;background:rgba(232,151,42,.45);flex-shrink:0}
.nb-divider{height:1px;background:rgba(255,255,255,.06);margin:18px 0}
.nb-hero-input{width:100%;background:rgba(255,255,255,.08);border:1.5px solid rgba(232,151,42,.35);border-radius:14px;padding:16px 18px;font-size:20px;color:var(--cream);font-family:var(--serif2);font-style:italic;font-weight:700;outline:none;text-align:center;letter-spacing:-.02em;transition:all .2s}
.nb-hero-input:focus{border-color:var(--amber);box-shadow:0 0 0 4px rgba(232,151,42,.1);background:rgba(232,151,42,.06)}
.nb-hero-input::placeholder{color:rgba(244,239,232,.28);font-weight:400;font-style:italic;font-size:15px}
.nb-pronoun-row{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin-top:10px}
.nb-pronoun{padding:8px 16px;border-radius:50px;cursor:pointer;border:1px solid rgba(255,255,255,.13);color:rgba(244,239,232,.6);background:rgba(255,255,255,.04);font-size:13px;font-weight:500;font-family:var(--sans2);transition:all .2s}
.nb-pronoun:hover{border-color:rgba(255,255,255,.25);color:var(--cream);background:rgba(255,255,255,.08)}
.nb-pronoun.sel{background:rgba(232,151,42,.15);border-color:rgba(232,151,42,.5);color:var(--amber2)}
.nb-char-strip{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:0}
.nb-char-chip{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;transition:transform .15s}
.nb-char-chip:hover{transform:translateY(-3px)}
.nb-char-av{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid rgba(232,151,42,.15);transition:all .2s;overflow:hidden}
.nb-char-av.sel{border-color:var(--amber2);box-shadow:0 0 0 3px rgba(232,151,42,.18)}
.nb-char-av-add{background:rgba(232,151,42,.07);border:1.5px dashed rgba(232,151,42,.3)!important}
.nb-char-nm{font-size:10px;color:rgba(244,239,232,.55);font-weight:500;font-family:var(--mono2);text-align:center;max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-char-nm.sel{color:var(--amber2)}
.nb-char-detail{background:rgba(232,151,42,.06);border:1px solid rgba(232,151,42,.16);border-radius:11px;padding:10px 13px;margin-top:11px;animation:fup .3s cubic-bezier(.16,1,.3,1)}
.nb-prefill-tag{font-size:9.5px;color:rgba(76,200,144,.8);font-family:var(--mono2);margin-top:5px}
.nb-cta{width:100%;padding:16px;background:var(--amber);color:#1A1420;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;font-family:var(--sans2);transition:all .2s;letter-spacing:-.01em}
.nb-cta:hover{background:var(--amber2);transform:translateY(-1px);box-shadow:0 8px 28px rgba(232,151,42,.3)}
.nb-cta:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none}
.nb-customise{text-align:center;font-size:11.5px;color:rgba(232,151,42,.5);cursor:pointer;padding:10px 0;font-weight:500;font-family:var(--mono2);letter-spacing:.5px;transition:color .2s}
.nb-customise:hover{color:rgba(232,151,42,.8)}
.nb-preview{background:rgba(232,151,42,.07);border:1px solid rgba(232,151,42,.2);border-radius:13px;padding:13px 15px;margin-bottom:16px;animation:fup .35s cubic-bezier(.16,1,.3,1)}
.nb-preview-label{font-size:9px;font-family:var(--mono2);color:rgba(232,151,42,.6);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px}
.nb-preview-text{font-family:var(--serif2);font-size:13px;font-style:italic;color:rgba(244,239,232,.8);line-height:1.72}
.nb-about-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:11px}
.nb-about-pill{padding:12px 12px;border-radius:13px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(244,239,232,.82);font-size:14px;font-weight:500;cursor:pointer;text-align:left;font-family:var(--sans2);transition:all .2s;display:flex;align-items:center;gap:8px;line-height:1.3}
.nb-about-pill:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22);transform:translateY(-1px)}
.nb-about-pill.sel{background:rgba(232,151,42,.15);border-color:rgba(232,151,42,.5);color:var(--amber2);box-shadow:0 0 0 3px rgba(232,151,42,.08)}
.nb-mood-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:0}
.nb-mood-pill{padding:12px 12px;border-radius:13px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(244,239,232,.82);font-size:14px;font-weight:500;cursor:pointer;text-align:left;font-family:var(--sans2);transition:all .2s;display:flex;align-items:center;gap:8px;line-height:1.3}
.nb-mood-pill:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22);transform:translateY(-1px)}
.nb-mood-pill.sel{background:rgba(232,151,42,.15);border-color:rgba(232,151,42,.5);color:var(--amber2);box-shadow:0 0 0 3px rgba(232,151,42,.08)}
.nb-textarea{width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:12px 14px;font-size:14px;color:var(--cream);font-family:var(--sans2);outline:none;resize:none;min-height:68px;line-height:1.65;transition:all .2s;margin-top:9px}
.nb-textarea:focus{border-color:rgba(232,151,42,.5);background:rgba(232,151,42,.05)}
.nb-textarea::placeholder{color:rgba(244,239,232,.3)}
.nb-lesson-group-label{font-size:9.5px;font-family:var(--mono2);color:rgba(244,239,232,.45);letter-spacing:1px;text-transform:uppercase;margin-bottom:7px;font-weight:600}
.nb-lesson-pills{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:11px}
.nb-lesson-pill{padding:7px 15px;border-radius:50px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(244,239,232,.78);font-size:13px;font-weight:500;cursor:pointer;font-family:var(--sans2);transition:all .2s}
.nb-lesson-pill:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22)}
.nb-lesson-pill.sel{background:rgba(232,151,42,.15);border-color:rgba(232,151,42,.5);color:var(--amber2)}
.nb-age-row{display:flex;gap:7px}
.nb-age-pill{flex:1;padding:10px 5px;border-radius:11px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(244,239,232,.75);font-size:12px;font-weight:600;cursor:pointer;text-align:center;font-family:var(--mono2);transition:all .2s}
.nb-age-pill:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22)}
.nb-age-pill.sel{background:rgba(232,151,42,.15);border-color:rgba(232,151,42,.5);color:var(--amber2)}
.nb-age-pill-sub{font-size:8px;font-weight:400;color:rgba(244,239,232,.38);margin-top:2px}
.nb-age-pill.sel .nb-age-pill-sub{color:rgba(245,184,76,.65)}
.nb-setting-chips{display:flex;gap:7px;flex-wrap:wrap}
.nb-setting-chip{padding:8px 15px;border-radius:50px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(244,239,232,.72);font-size:12px;font-weight:500;cursor:pointer;font-family:var(--mono2);transition:all .2s}
.nb-setting-chip:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22)}
.nb-setting-chip.sel{background:rgba(232,151,42,.15);border-color:rgba(232,151,42,.5);color:var(--amber2)}
.nb-input-sm{width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:12px;padding:12px 15px;font-size:14px;color:var(--cream);font-family:var(--sans2);outline:none;transition:all .2s}
.nb-input-sm:focus{border-color:rgba(232,151,42,.5);background:rgba(232,151,42,.05)}
.nb-input-sm::placeholder{color:rgba(244,239,232,.3)}
/* ── Option D: sticky bar + expandable drawer ── */
.nb-sticky-bar{background:rgba(6,11,24,.98);border-top:2px solid rgba(232,151,42,.3);padding:0 20px 0;cursor:pointer;transition:border-color .3s;position:relative;z-index:40}
.nb-sticky-bar.has-info{border-top-color:var(--amber)}
.nb-sticky-bar:hover .nb-sticky-handle{background:rgba(232,151,42,.3)}
.nb-sticky-handle{width:36px;height:3px;border-radius:2px;background:rgba(255,255,255,.15);margin:10px auto 8px;transition:background .2s}
.nb-sticky-inner{display:flex;align-items:center;gap:11px;padding-bottom:14px}
.nb-sticky-av{width:38px;height:38px;border-radius:50%;background:#1E1640;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;border:2px solid rgba(232,151,42,.25);overflow:hidden;transition:border-color .2s}
.nb-sticky-bar.has-info .nb-sticky-av{border-color:rgba(232,151,42,.55)}
.nb-sticky-info{flex:1;min-width:0}
.nb-sticky-name{font-size:13px;font-weight:600;color:var(--cream);font-family:var(--serif2)}
.nb-sticky-sub{font-size:9.5px;color:rgba(244,239,232,.42);font-family:var(--mono2);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nb-sticky-hint{font-size:9px;color:rgba(232,151,42,.5);font-family:var(--mono2);margin-top:2px;display:flex;align-items:center;gap:4px}
.nb-sticky-btn{background:var(--amber);color:#1A1420;border:none;border-radius:11px;padding:11px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--sans2);white-space:nowrap;flex-shrink:0;transition:all .2s}
.nb-sticky-btn:hover{background:var(--amber2)}
.nb-sticky-btn:disabled{opacity:.35;cursor:not-allowed}
.nb-ready-label{font-size:8px;font-family:var(--mono2);color:rgba(232,151,42,.55);letter-spacing:1.5px;text-transform:uppercase;text-align:center;padding:8px 0 0}
/* ── Drawer overlay ── */
.nb-drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;animation:nb-fade-in .2s ease;backdrop-filter:blur(6px)}
@keyframes nb-fade-in{from{opacity:0}to{opacity:1}}
.nb-drawer{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:540px;background:#0D1018;border-radius:24px 24px 0 0;border-top:2px solid var(--amber);padding:0 22px 40px;z-index:101;animation:nb-slide-up .3s cubic-bezier(.22,1,.36,1)}
@keyframes nb-slide-up{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}
.nb-drawer-handle{width:40px;height:4px;border-radius:2px;background:rgba(255,255,255,.2);margin:14px auto 18px}
.nb-drawer-title{font-family:var(--serif2);font-size:20px;font-weight:700;font-style:italic;color:var(--cream);margin-bottom:4px;line-height:1.2}
.nb-drawer-sub{font-size:12px;color:rgba(244,239,232,.42);font-weight:300;margin-bottom:18px;line-height:1.5}
.nb-drawer-preview{font-family:var(--serif2);font-size:14px;font-style:italic;color:rgba(244,239,232,.78);line-height:1.72;background:rgba(232,151,42,.07);border:1px solid rgba(232,151,42,.2);border-radius:13px;padding:13px 15px;margin-bottom:14px}
.nb-drawer-rows{display:flex;flex-direction:column;gap:0;margin-bottom:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden}
.nb-drawer-row{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.05);font-size:13px}
.nb-drawer-row:last-child{border-bottom:none}
.nb-drawer-row-lbl{font-size:9px;font-family:var(--mono2);color:rgba(232,151,42,.55);width:64px;flex-shrink:0;letter-spacing:.5px;margin-top:2px;text-transform:uppercase}
.nb-drawer-row-val{color:rgba(244,239,232,.85);font-family:var(--sans2);font-weight:500;line-height:1.5}
.nb-drawer-disclaimer{font-size:11px;color:rgba(244,239,232,.38);font-style:italic;text-align:center;margin-bottom:14px;line-height:1.6;font-family:var(--sans2)}
.nb-drawer-cta{width:100%;padding:16px;background:var(--amber);color:#1A1420;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;font-family:var(--sans2);transition:all .2s}
.nb-drawer-cta:hover{background:var(--amber2);transform:translateY(-1px);box-shadow:0 8px 28px rgba(232,151,42,.3)}
.nb-drawer-cta:disabled{opacity:.35;cursor:not-allowed;transform:none}
.nb-drawer-edit{width:100%;padding:12px;background:transparent;border:1px solid rgba(255,255,255,.1);border-radius:12px;color:rgba(244,239,232,.45);font-size:13px;cursor:pointer;font-family:var(--sans2);margin-top:8px;transition:all .2s}
.nb-drawer-edit:hover{border-color:rgba(255,255,255,.2);color:rgba(244,239,232,.75)}
.nb-gen-body{padding:22px 20px;font-family:var(--sans2);display:flex;flex-direction:column;align-items:center}
.nb-gen-progress{height:3px;background:rgba(255,255,255,.07);border-radius:2px;margin-bottom:24px;overflow:hidden;width:100%}
.nb-gen-fill{height:100%;background:var(--amber);border-radius:2px}
.nb-gen-dots{display:flex;gap:6px;justify-content:center;margin-bottom:20px}
.nb-gen-dot{height:3px;border-radius:2px;background:rgba(255,255,255,.1)}
.nb-gen-dot.done{background:var(--amber)}
.nb-gen-dot.active{background:rgba(232,151,42,.5)}
.nb-gen-moon{width:68px;height:68px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020);margin:0 auto 8px;box-shadow:0 0 40px 8px rgba(232,151,42,.12)}
.nb-gen-title{font-family:var(--serif2);font-size:20px;font-weight:700;color:var(--cream);text-align:center;margin-bottom:4px;font-style:italic}
.nb-gen-sub{font-size:11px;color:rgba(244,239,232,.38);font-family:var(--mono2);text-align:center;margin-bottom:22px}
.nb-bq-card{background:rgba(255,255,255,.04);border:1px solid rgba(232,151,42,.14);border-radius:16px;padding:18px;width:100%;margin-bottom:14px}
.nb-bq-while{font-size:8.5px;font-family:var(--mono2);color:rgba(232,151,42,.48);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px}
.nb-bq-q{font-family:var(--serif2);font-size:17px;font-style:italic;color:rgba(244,239,232,.82);line-height:1.5;margin-bottom:14px}
.nb-bq-answer{width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:11px;padding:12px 14px;font-size:14px;color:var(--cream);font-family:var(--serif2);font-style:italic;outline:none;resize:none;min-height:70px;line-height:1.6;margin-bottom:10px}
.nb-bq-answer::placeholder{color:rgba(244,239,232,.25);font-size:12px;font-style:normal}
.nb-bq-save{width:100%;padding:11px;background:rgba(76,200,144,.1);border:1px solid rgba(76,200,144,.2);border-radius:10px;color:rgba(76,200,144,.85);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--sans2);transition:all .2s}
.nb-bq-save:hover{background:rgba(76,200,144,.16)}
.nb-step-list{display:flex;flex-direction:column;gap:5px;width:100%;margin-top:2px}
.nb-step-item{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:10px;font-size:12px;font-family:var(--sans2)}
.nb-step-item.done{background:rgba(76,200,144,.05);border:1px solid rgba(76,200,144,.12);color:rgba(76,200,144,.8)}
.nb-step-item.active{background:rgba(232,151,42,.06);border:1px solid rgba(232,151,42,.14);color:rgba(232,151,42,.85);font-weight:600}
.nb-step-item.pending{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);color:rgba(244,239,232,.28)}
.nb-step-icon{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nb-step-icon.done{background:rgba(76,200,144,.18)}
.nb-step-icon.active{background:rgba(232,151,42,.14)}
.nb-step-icon.pending{background:rgba(255,255,255,.04)}
.nb-step-pulse{width:8px;height:8px;border-radius:50%;background:var(--amber);animation:nb-pulse 1s ease-in-out infinite}
@keyframes nb-pulse{0%,100%{opacity:.5;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}}
.char-chips{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:12px}
.char-chip{display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:50px;cursor:pointer;
  border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);transition:all .2s;
  font-family:'Nunito',sans-serif;font-size:13px;font-weight:500;color:rgba(240,237,232,.55)}
.char-chip:hover{border-color:rgba(212,160,48,.35);color:var(--cream);background:rgba(212,160,48,.06)}
.char-chip.on{border-color:var(--gold2);color:var(--gold2);background:rgba(212,160,48,.14)}
.char-chip-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:14px;flex-shrink:0}
.char-chip-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px}
.char-chip-add{border-style:dashed;border-color:rgba(212,160,48,.25);color:rgba(212,160,48,.6)}
.char-chip-add:hover{border-color:rgba(212,160,48,.5);color:rgba(212,160,48,.9);background:rgba(212,160,48,.08)}
.new-char-form{background:rgba(212,160,48,.05);border:1px solid rgba(212,160,48,.15);border-radius:14px;
  padding:16px;margin-bottom:12px;display:flex;flex-direction:column;gap:10px;animation:fup .3s ease}
.new-char-row{display:flex;gap:8px}
.new-char-row .finput{flex:1}
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
.ctrl-btn.dl{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.11);color:var(--dim)}
.rd-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:0 2px}
.rd-logo{font-family:'Fraunces',serif;font-size:15px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:7px;cursor:pointer}
.rd-progress{font-size:10px;font-family:'DM Mono',monospace;color:rgba(244,239,232,.32);text-align:center;padding:0 4px;flex:1}
.rd-ctrl{display:flex;gap:7px;justify-content:center;margin-top:8px;flex-wrap:wrap}
.rd-btn-primary{display:flex;align-items:center;gap:6px;padding:9px 18px;border-radius:50px;border:none;background:var(--amber,#E8972A);color:#1A1420;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s}
.rd-btn-primary:hover{background:#F5B84C;transform:translateY(-1px)}
.rd-btn-secondary{display:flex;align-items:center;gap:5px;padding:8px 13px;border-radius:50px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(244,239,232,.55);font-family:'Nunito',sans-serif;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s}
.rd-btn-secondary:hover{border-color:rgba(255,255,255,.2);color:var(--cream)}
.rd-btn-secondary.on{background:rgba(212,160,48,.12);border-color:rgba(212,160,48,.35);color:var(--gold2)}
.rd-status{font-size:10px;color:rgba(76,200,144,.7);font-family:'DM Mono',monospace;display:flex;align-items:center;gap:4px}
.share-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:200;display:flex;align-items:flex-end;justify-content:center;padding:0;backdrop-filter:blur(8px);animation:smBgIn .2s ease}
@keyframes smBgIn{from{opacity:0}to{opacity:1}}
.share-modal{background:#0D1018;border-radius:24px 24px 0 0;padding:24px 20px 36px;width:100%;max-width:500px;border-top:1px solid rgba(232,151,42,.2);animation:smIn .3s cubic-bezier(.22,1,.36,1)}
@keyframes smIn{from{transform:translateY(100%)}to{transform:translateY(0)}}
.share-modal-title{font-family:'Fraunces',serif;font-size:18px;font-weight:700;color:var(--cream);margin-bottom:4px;text-align:center}
.share-modal-sub{font-size:12px;color:rgba(244,239,232,.38);text-align:center;margin-bottom:20px;font-weight:300}
.share-option{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;cursor:pointer;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);margin-bottom:9px;transition:all .2s;width:100%}
.share-option:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12)}
.share-option-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.share-option-info{flex:1;text-align:left}
.share-option-h{font-size:13px;font-weight:700;color:var(--cream);margin-bottom:2px;font-family:'Nunito',sans-serif}
.share-option-sub{font-size:11px;color:rgba(244,239,232,.38);font-weight:300}
.share-link-row{display:flex;gap:8px;margin-top:6px;margin-bottom:12px}
.share-link-input{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;font-size:11px;color:rgba(244,239,232,.6);font-family:'DM Mono',monospace;outline:none;min-width:0}
.share-link-copy{background:var(--amber,#E8972A);color:#1A1420;border:none;border-radius:10px;padding:10px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;white-space:nowrap;transition:all .2s;flex-shrink:0}
.share-link-copy:hover{background:#F5B84C}
.share-link-copy.copied{background:rgba(76,200,144,.2);color:rgba(76,200,144,.9);border:1px solid rgba(76,200,144,.3)}
.share-dismiss{width:100%;padding:12px;background:transparent;border:1px solid rgba(255,255,255,.09);border-radius:12px;color:rgba(244,239,232,.4);font-size:13px;cursor:pointer;font-family:'Nunito',sans-serif;margin-top:4px;transition:all .2s}
.share-dismiss:hover{border-color:rgba(255,255,255,.18);color:rgba(244,239,232,.7)}
.share-section-label{font-size:9px;font-family:'DM Mono',monospace;color:rgba(244,239,232,.3);letter-spacing:1.5px;text-transform:uppercase;margin:14px 0 8px;display:flex;align-items:center;gap:10px}
.share-section-label::before,.share-section-label::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.06)}
.share-sm-row{display:flex;gap:8px;margin-bottom:4px}
.share-sm-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;border-radius:14px;cursor:pointer;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.03);transition:all .2s;font-family:'Nunito',sans-serif}
.share-sm-btn:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.16);transform:translateY(-1px)}
.share-sm-icon{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.share-sm-label{font-size:11px;font-weight:700;color:rgba(244,239,232,.7)}
.share-sm-fb{background:rgba(24,119,242,.15);border:1px solid rgba(24,119,242,.25)}
.share-sm-x{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15)}
.share-sm-ig{background:rgba(225,48,108,.12);border:1px solid rgba(225,48,108,.22)}
.share-ig-sheet{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;margin-top:6px;display:none}
.share-ig-sheet.vis{display:block}
.share-ig-title{font-size:12px;font-weight:700;color:rgba(244,239,232,.75);margin-bottom:5px;font-family:'Nunito',sans-serif}
.share-ig-sub{font-size:11px;color:rgba(244,239,232,.38);line-height:1.6;margin-bottom:10px;font-weight:300}
.share-ig-btns{display:flex;gap:8px}
.share-ig-copy{flex:1;padding:9px;background:rgba(232,151,42,.12);border:1px solid rgba(232,151,42,.25);border-radius:10px;color:rgba(232,151,42,.85);font-size:12px;font-weight:600;cursor:pointer;font-family:'Nunito',sans-serif;transition:all .2s}
.share-ig-copy:hover{background:rgba(232,151,42,.2)}
.share-ig-dl{flex:1;padding:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:rgba(244,239,232,.55);font-size:12px;font-weight:600;cursor:pointer;font-family:'Nunito',sans-serif;transition:all .2s}
.share-ig-dl:hover{background:rgba(255,255,255,.1);color:rgba(244,239,232,.85)}
.end-parent-note{width:100%;background:rgba(232,151,42,.07);border:1px solid rgba(232,151,42,.18);border-radius:14px;padding:14px 16px;margin-top:2px}
.end-note-label{font-size:8.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(232,151,42,.6);margin-bottom:6px;font-family:'DM Mono',monospace}
.end-note-text{font-size:12px;color:var(--cream);line-height:1.72;font-family:'Nunito',sans-serif}
.end-refrain-block{font-family:'Fraunces',serif;font-size:clamp(14px,3.5vw,18px);font-style:italic;color:rgba(240,204,96,.72);line-height:1.7;max-width:300px;text-align:center;padding:0 8px}
.end-nc-cta{width:100%;padding:15px;background:var(--amber,#E8972A);color:#1A1420;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;transition:all .2s;letter-spacing:-.01em}
.end-nc-cta:hover{background:#F5B84C;transform:translateY(-1px)}
.end-ghost-row{display:flex;gap:8px;width:100%}
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
const CHAR_ICONS = {hero:"⭐",friend:"👫",sibling:"👶",parent:"🧑‍🍼",pet:"🐾",toy:"🧸"} as Record<string,string>;
const FUN_ICONS = ["🧒","👧","👦","🧒🏽","👧🏾","👦🏻","🐶","🐱","🐰","🐻","🦁","🐸","🦊","🐧","🦄","🐲","🧸","🤖","👸","🤴","🧙","🧚","🦸","🌟","✨","💫"];
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
// Helper to get user-scoped storage key (falls back to shared if no userId)
const userKey = (k: string, uid?: string) => uid ? `ss2_u${uid}_${k}` : S_PFX + k;
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
interface SleepSeedCoreProps {
  userId?: string;
  isGuest?: boolean;
  preloadedCharacter?: any;
  preloadedBook?: any;
  ritualSeed?: string;
  ritualMood?: string;
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBuilderDrawer, setShowBuilderDrawer] = useState(false);
  const [shareLink,      setShareLink]      = useState("");
  const [shareCopied,    setShareCopied]    = useState(false);
  const [shareIncludeNC, setShareIncludeNC] = useState(true);
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
  const [savedChars,       setSavedChars]       = useState<Character[]>([]); // user's saved characters
  const [selectedCharId,   setSelectedCharId]   = useState<string|null>(null); // selected character chip
  const [showNewCharForm,  setShowNewCharForm]  = useState(false);     // inline new character form
  const [newCharName,      setNewCharName]      = useState("");
  const [newCharPronouns,  setNewCharPronouns]  = useState<string>("they/them");
  const [newCharAge,       setNewCharAge]       = useState("");
  const [newCharDetail,    setNewCharDetail]    = useState("");

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
  const ncFileRef        = useRef<HTMLInputElement>(null);

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
    sGet("nightcards").then(s => { if(s?.items) setNightCards(s.items); });
    sGet("style_dna").then(s => { if(s) setStyleDna(s); });
    // Load saved characters from v2 storage
    if(userId) { try { setSavedChars(getCharacters(userId)); } catch(_) {} }
    sGet("voice_id").then(s => { if(s?.id) setVoiceId(s.id); });
    sGet("onboarded").then(s => { if(s?.v) setHasSeenOnboard(true); });

  },[]);

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

  // Load a preloaded book (from story library re-read)
  useEffect(() => {
    if (!preloadedBook) return;
    setBook(preloadedBook);
    setPageIdx(0);
    setChosenPath(null);
    setFromCache(true);
    setStage("book");
  }, [preloadedBook]);

  // Select a saved character and populate hero fields
  const selectCharacter = useCallback((c: Character) => {
    setSelectedCharId(c.id);
    setHeroName(c.name);
    if (c.pronouns === 'she/her') setHeroGender('girl');
    else if (c.pronouns === 'he/him') setHeroGender('boy');
    else setHeroGender('');
    if (c.ageDescription) setHeroClassify(c.ageDescription);
    if (c.currentSituation) setStoryContext(c.currentSituation);
    if (c.weirdDetail) setStoryGuidance(c.weirdDetail);
    if (c.personalityTags?.length) setHeroTraits(c.personalityTags);
    setHasSeenOnboard(true);
    sSet("onboarded",{v:true});
    setShowNewCharForm(false);
  }, []);

  // Create and save a new character from the inline form
  const createAndSelectNewChar = useCallback(() => {
    if (!newCharName.trim()) return;
    const newChar: Character = {
      id: Math.random().toString(36).slice(2),
      userId: userId || 'guest',
      name: newCharName.trim(),
      type: 'human',
      ageDescription: newCharAge.trim(),
      pronouns: newCharPronouns as any,
      personalityTags: [],
      weirdDetail: newCharDetail.trim(),
      currentSituation: '',
      color: ['#7C3AED','#A855F7','#C084FC','#60A5FA','#34D399','#F472B6','#FBBF24'][Math.floor(Math.random()*7)],
      emoji: ['🌟','✨','🌙','⭐','💫','🦁','🐻','🦊'][Math.floor(Math.random()*8)],
      storyIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try { saveCharToStorage(newChar); } catch(_) {}
    setSavedChars(prev => [newChar, ...prev]);
    selectCharacter(newChar);
    setNewCharName(""); setNewCharAge(""); setNewCharDetail(""); setNewCharPronouns("they/them");
  }, [newCharName, newCharAge, newCharDetail, newCharPronouns, userId, selectCharacter]);


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

  // ── Generate share link for grandma / anyone ───────────────────────────
  const generateShareLink = (includeNC = true) => {
    if (!book) return "";
    const storyData: any = {
      t: book.title,
      n: book.heroName,
      r: book.refrain || "",
      p: (book.pages || []).map((pg: any) => ({ t: pg.text || "" })),
      pn: book.parentNote || "",
      v: voiceId || selectedVoiceId || "",
      d: new Date().toISOString().split("T")[0],
    };
    if (includeNC && book.nightCard) {
      storyData.nc = {
        h: book.nightCard.headline || "",
        q: book.nightCard.quote || "",
        m: book.nightCard.memory_line || "",
        e: book.nightCard.emoji || "",
        ph: book.nightCard.photo || "",
        ba: book.nightCard.bondingA || "",
        bq: book.nightCard.bondingQ || "",
        gr: book.nightCard.gratitude || "",
        ex: book.nightCard.extra || "",
      };
    }
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(storyData)));
      return `${window.location.origin}?s=${encoded}`;
    } catch {
      return window.location.origin;
    }
  };

  // ── Open share modal ───────────────────────────────────────────────────
  const shareStory = async () => {
    if (!book) return;
    setShareIncludeNC(!!book.nightCard);
    const link = generateShareLink(!!book.nightCard);
    setShareLink(link);
    setShareCopied(false);
    setShowShareModal(true);
  };

  // ── Copy grandma link to clipboard ────────────────────────────────────
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      const input = document.getElementById("share-link-input") as HTMLInputElement;
      input?.select();
    }
  };

  // ── Social share card (9:16 Instagram Stories format) ─────────────────
  const shareSocialCard = async () => {
    if (!book) return;
    try {
      const W = 1080; const H = 1920;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

      ctx.fillStyle = "#0B0B1A";
      ctx.fillRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(W/2, 0, 0, W/2, 0, 900);
      glow.addColorStop(0, "rgba(232,151,42,.07)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(255,255,248,.5)";
      const starPositions = [
        [120,200],[280,100],[580,160],[820,90],[950,280],[100,480],[750,350],
        [400,80],[200,600],[860,500],[600,250],[300,350],[700,600],[450,430],
        [150,750],[900,400],[500,700],[250,900],[800,750],[60,320],
      ];
      starPositions.forEach(([x,y]) => {
        const r = 1 + Math.random() * 2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
      });

      ctx.fillStyle = "rgba(232,151,42,.55)";
      ctx.font = "600 38px 'Georgia', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🌙  SleepSeed", W/2, 160);

      const cardX = 80; const cardY = 240;
      const cardW = W - 160; const cardH = 780;
      ctx.fillStyle = "#0E1428";
      ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 32); ctx.fill();
      ctx.strokeStyle = "rgba(232,151,42,.2)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 32); ctx.stroke();

      ctx.fillStyle = "#C87020";
      ctx.beginPath(); ctx.arc(W/2, cardY + 200, 80, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#0E1428";
      ctx.beginPath(); ctx.arc(W/2 - 28, cardY + 180, 68, 0, Math.PI*2); ctx.fill();

      ctx.fillStyle = "rgba(212,160,48,.5)";
      ctx.font = "32px serif";
      ctx.textAlign = "center";
      ctx.fillText("✦  ★  ✦", W/2, cardY + 330);

      ctx.fillStyle = "#FAE9A8";
      ctx.font = "bold 68px Georgia, serif";
      ctx.textAlign = "center";
      const titleWords = book.title.split(" ");
      const titleLines: string[] = [];
      let line = "";
      for (const w of titleWords) {
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width > cardW - 80) { titleLines.push(line); line = w; }
        else line = test;
      }
      if (line) titleLines.push(line);
      const titleStartY = cardY + 400;
      titleLines.forEach((l, i) => ctx.fillText(l, W/2, titleStartY + i * 82));

      ctx.fillStyle = "rgba(212,160,48,.55)";
      ctx.font = "500 32px 'Georgia', sans-serif";
      ctx.textAlign = "center";
      const afterTitle = titleStartY + titleLines.length * 82 + 36;
      ctx.fillText(`A story for ${book.heroName}`, W/2, afterTitle);

      if (book.refrain) {
        const refrainY = cardY + cardH + 80;
        ctx.fillStyle = "rgba(240,204,96,.22)";
        ctx.font = "bold 80px Georgia, serif";
        ctx.textAlign = "left";
        ctx.fillText("\u201C", cardX, refrainY);

        ctx.fillStyle = "rgba(240,204,96,.82)";
        ctx.font = "italic 46px Georgia, serif";
        ctx.textAlign = "center";
        const maxW = W - 160;
        const reWords = book.refrain.split(" ");
        const reLines: string[] = [];
        let rl = "";
        for (const w of reWords) {
          const t = rl ? rl + " " + w : w;
          if (ctx.measureText(t).width > maxW) { reLines.push(rl); rl = w; }
          else rl = t;
        }
        if (rl) reLines.push(rl);
        reLines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W/2, refrainY + 60 + i * 60));

        ctx.fillStyle = "rgba(240,204,96,.22)";
        ctx.font = "bold 80px Georgia, serif";
        ctx.textAlign = "right";
        ctx.fillText("\u201D", W - cardX, refrainY + 60 + reLines.slice(0, 3).length * 60 + 20);
      }

      const footerY = H - 260;
      ctx.fillStyle = "rgba(232,151,42,.12)";
      ctx.fillRect(0, footerY - 20, W, 200);
      ctx.fillStyle = "#F4EFE8";
      ctx.font = "600 38px 'Georgia', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Create your child's story tonight", W/2, footerY + 50);
      ctx.fillStyle = "rgba(232,151,42,.75)";
      ctx.font = "500 32px sans-serif";
      ctx.fillText("sleepseed.app  \u00B7  Free to start", W/2, footerY + 105);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${book.title.replace(/[^a-z0-9]/gi, "_")}_story.png`, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: book.title, text: `${book.heroName}'s bedtime story — made with SleepSeed` });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
      }, "image/png");
    } catch (err) {
      console.error("Social card error:", err);
    }
  };

  // ── PDF Download ──────────────────────────────────────────────────────
  const downloadStory = async () => {
    if (!book) return;
    try {
      const { jsPDF } = await import("jspdf");
      const W = 148, H = 210;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [W, H] });
      const NAVY: [number,number,number] = [11,15,36];
      const GOLD: [number,number,number] = [212,160,48];
      const AMBER: [number,number,number] = [232,151,42];
      const WHITE: [number,number,number] = [255,255,255];
      const CREAM: [number,number,number] = [254,248,232];
      const PARCH: [number,number,number] = [253,246,232];
      const INK: [number,number,number] = [26,16,0];
      const INK2: [number,number,number] = [90,58,18];
      const INK3: [number,number,number] = [160,137,106];
      const RULE: [number,number,number] = [220,205,180];
      const REFRAIN: [number,number,number] = [107,58,16];
      const MX = 16, MY = 18, TW = W - MX * 2;

      const hRule = (y: number) => { doc.setDrawColor(RULE[0],RULE[1],RULE[2]); doc.setLineWidth(0.25); doc.line(MX,y,W-MX,y); };
      const drawMoon = (cx: number, cy: number, r: number) => { doc.setFillColor(...GOLD); doc.circle(cx,cy,r,"F"); doc.setFillColor(...NAVY); doc.circle(cx-r*0.38,cy-r*0.1,r*0.82,"F"); };
      const drawStars = (count: number, seed: number) => {
        doc.setFillColor(255,248,232);
        const pos = [[0.15,0.08],[0.72,0.12],[0.40,0.06],[0.58,0.10],[0.85,0.07],[0.22,0.18],[0.91,0.20],[0.08,0.28],[0.65,0.22],[0.33,0.30],[0.78,0.15],[0.50,0.25]];
        for (let i=0;i<Math.min(count,pos.length);i++) { const [px,py]=pos[(i+seed)%pos.length]; doc.circle(px*W,py*H,0.35+(i%3)*0.25,"F"); }
      };

      // COVER
      doc.setFillColor(...NAVY); doc.rect(0,0,W,H,"F"); drawStars(10,0); drawMoon(W/2,62,11);
      doc.setFont("times","normal"); doc.setFontSize(9); doc.setTextColor(...GOLD); doc.text("✦  ★  ✦",W/2,82,{align:"center"});
      doc.setFont("times","bold"); doc.setFontSize(11); doc.setTextColor(212,160,48); doc.text("SleepSeed",W/2,92,{align:"center"});
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.3); doc.line(W/2-24,96,W/2+24,96);
      doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...INK3); doc.text("A BEDTIME STORY FOR",W/2,106,{align:"center"});
      doc.setFont("times","bold"); doc.setFontSize(36); doc.setTextColor(...WHITE); doc.text(book.heroName,W/2,124,{align:"center"});
      doc.setFont("times","italic"); doc.setFontSize(13); doc.setTextColor(...GOLD);
      const titleLines = doc.splitTextToSize(book.title,TW); doc.text(titleLines,W/2,138,{align:"center"});
      const ruleY = 138+titleLines.length*7+4;
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.2); doc.line(W/2-20,ruleY,W/2+20,ruleY);
      const storyDate = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
      doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(...INK3); doc.text(storyDate,W/2,ruleY+9,{align:"center"});
      doc.setFontSize(6); doc.setTextColor(60,70,100); doc.text("sleepseed.app",W/2,H-10,{align:"center"});

      // STORY PAGES
      const allPages = book.isAdventure ? [...(book.setup_pages||[]),...(book.path_a||[]),...(book.path_b||[])] : (book.pages||[]);
      allPages.forEach((pg: any, i: number) => {
        doc.addPage(); const isEven = i%2===1;
        doc.setFillColor(...(isEven?PARCH:CREAM)); doc.rect(0,0,W,H,"F");
        doc.setDrawColor(...AMBER); doc.setLineWidth(0.4); doc.line(0,0,W,0);
        doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(...INK3); doc.text(`Page ${i+1}`,MX,MY-4);
        doc.setFont("times","italic"); doc.setFontSize(13); doc.setTextColor(...INK);
        const lines = doc.splitTextToSize(pg.text||"",TW); doc.text(lines,MX,MY+6);
        if (book.refrain && i%2===1) { const refrainY=H-26; hRule(refrainY-4); doc.setFont("times","italic"); doc.setFontSize(9); doc.setTextColor(...REFRAIN); const rL=doc.splitTextToSize(`"${book.refrain}"`,TW); doc.text(rL,W/2,refrainY+3,{align:"center"}); }
        hRule(H-MY+2); doc.setFont("times","italic"); doc.setFontSize(6.5); doc.setTextColor(...INK3); doc.text(String(i+1),MX,H-MY+7);
        doc.setFont("helvetica","normal"); doc.setFontSize(6); doc.text("sleepseed.app",W-MX,H-MY+7,{align:"right"});
        doc.setFont("times","normal"); doc.setFontSize(8); doc.setTextColor(...GOLD); doc.text("✦",W/2,H-MY+7,{align:"center"});
      });

      // NIGHT CARD PAGE
      const nc = book.nightCard;
      if (nc) {
        doc.addPage(); const photoH=Math.round(H*0.42);
        doc.setFillColor(18,21,42); doc.rect(0,0,W,photoH,"F"); drawStars(8,3);
        const ncDate = nc.date||storyDate;
        doc.setFont("helvetica","normal"); doc.setFontSize(5.5); doc.setTextColor(200,195,220);
        doc.setFillColor(0,0,0); doc.rect(MX,9,60,5,"F"); doc.text(`🌙  ${ncDate}`,MX+3,13);
        if (nc.photo) { const imgW=72,imgH=64,imgX=(W-imgW)/2,imgY=(photoH-imgH)/2; try { doc.addImage(nc.photo,"JPEG",imgX,imgY,imgW,imgH,undefined,"FAST"); doc.setDrawColor(...AMBER); doc.setLineWidth(0.3); doc.rect(imgX,imgY,imgW,imgH); } catch(_) { drawMoon(W/2,photoH/2,12); } }
        else { drawMoon(W/2,photoH/2,12); doc.setFont("times","italic"); doc.setFontSize(8); doc.setTextColor(...GOLD); doc.text(nc.heroName||book.heroName,W/2,photoH/2+20,{align:"center"}); }
        doc.setDrawColor(...AMBER); doc.setLineWidth(0.5); doc.line(0,0,W,0);
        doc.setDrawColor(...AMBER); doc.setLineWidth(0.4); doc.line(0,photoH,W,photoH);
        doc.setFillColor(...PARCH); doc.rect(0,photoH,W,H-photoH,"F");
        let y=photoH+12;
        doc.setFont("times","bold"); doc.setFontSize(18); doc.setTextColor(...INK); doc.text(nc.heroName||book.heroName,MX,y);
        doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(...INK3); doc.text(ncDate,W-MX,y,{align:"right"});
        y+=7;
        if (nc.memory_line) { doc.setFillColor(...AMBER); doc.rect(MX,y,1.5,16,"F"); doc.setFont("times","italic"); doc.setFontSize(9); doc.setTextColor(...INK2); const pL=doc.splitTextToSize(`"${nc.memory_line}"`,TW-6); doc.text(pL,MX+5,y+5); y+=Math.max(16,pL.length*5)+5; }
        const chips: {q:string;a:string;bg:[number,number,number];bdr:[number,number,number];tc:[number,number,number]}[] = [];
        if (nc.bondingQ&&nc.bondingA) chips.push({q:nc.bondingQ,a:nc.bondingA,bg:[255,248,230],bdr:[220,190,130],tc:[90,55,10]});
        if (nc.gratitude) chips.push({q:"Best three seconds",a:nc.gratitude,bg:[230,235,255],bdr:[160,170,220],tc:[40,50,120]});
        if (nc.extra) chips.push({q:"Tonight I want to remember",a:nc.extra,bg:[228,248,238],bdr:[140,200,170],tc:[20,80,50]});
        chips.forEach(chip => { if(y>H-22) return; const chipH=14; doc.setFillColor(...chip.bg); doc.setDrawColor(...chip.bdr); doc.setLineWidth(0.2); doc.rect(MX,y,TW,chipH,"FD"); doc.setFont("helvetica","bold"); doc.setFontSize(5.5); doc.setTextColor(...chip.tc); doc.text(chip.q.toUpperCase(),MX+4,y+4.5); doc.setFont("times","italic"); doc.setFontSize(8.5); const aL=doc.splitTextToSize(chip.a,TW-8); doc.text(aL[0]||chip.a,MX+4,y+10); y+=chipH+3; });
        hRule(H-12); doc.setFont("helvetica","normal"); doc.setFontSize(6); doc.setTextColor(...INK3); doc.text("🌙  SleepSeed Night Card",MX,H-7); doc.text(book.title,W-MX,H-7,{align:"right"});
      }

      // END PAGE
      doc.addPage(); doc.setFillColor(...NAVY); doc.rect(0,0,W,H,"F"); drawStars(9,5); drawMoon(W/2,52,10);
      doc.setFont("times","bold"); doc.setFontSize(32); doc.setTextColor(...WHITE); doc.text("The End.",W/2,78,{align:"center"});
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.3); doc.line(W/2-22,83,W/2+22,83);
      doc.setFont("times","italic"); doc.setFontSize(10); doc.setTextColor(...INK3); doc.text(`Sweet dreams, ${book.heroName}.`,W/2,93,{align:"center"}); doc.text("Tomorrow night, another adventure awaits.",W/2,101,{align:"center"});
      if (book.refrain) { doc.setFont("times","italic"); doc.setFontSize(9); doc.setTextColor(...GOLD); const eRL=doc.splitTextToSize(`"${book.refrain}"`,TW-16); doc.text(eRL,W/2,116,{align:"center"}); }
      const mktY=H-60; doc.setFillColor(20,28,58); doc.setDrawColor(...AMBER); doc.setLineWidth(0.3); doc.rect(MX,mktY,TW,48,"FD");
      doc.setFont("times","bold"); doc.setFontSize(10); doc.setTextColor(...GOLD); doc.text("Create your own story tonight.",W/2,mktY+10,{align:"center"});
      doc.setFont("times","italic"); doc.setFontSize(8.5); doc.setTextColor(200,195,220); const mktL=doc.splitTextToSize("Personalised bedtime stories starring your child — written in 60 seconds. Every night a new one. Then a Night Card to keep forever.",TW-10); doc.text(mktL,W/2,mktY+18,{align:"center"});
      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...GOLD); doc.text("sleepseed.app  ·  Free to start",W/2,mktY+38,{align:"center"});

      doc.save(`${book.title.replace(/[^a-z0-9]/gi,"_").toLowerCase()}_sleepseed.pdf`);
    } catch (err) { console.error("PDF error:",err); alert("Could not generate PDF — please try again."); }
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
    // Collect all character IDs: preloaded hero + extra chars matched to saved chars
    const allCharIds: string[] = [];
    if (preloadedCharacter?.id) allCharIds.push(preloadedCharacter.id);
    if (selectedCharId) { if (!allCharIds.includes(selectedCharId)) allCharIds.push(selectedCharId); }
    // Match extra chars by name to saved chars
    if (userId) {
      try {
        const raw = localStorage.getItem(`ss2_chars_${userId}`);
        const saved = raw ? JSON.parse(raw) : [];
        extraChars.forEach(ec => {
          const match = saved.find((sc: any) => sc.name === ec.name);
          if (match && !allCharIds.includes(match.id)) allCharIds.push(match.id);
        });
      } catch(_) {}
    }
    const entry = {id:uid(),title:bookData.title,heroName:bookData.heroName,
      date:new Date().toISOString().split("T")[0],occasion:occ,bookData,
      characterIds: allCharIds,
      refrain: bookData.refrain || ""};
    const next = [entry,...memories];
    setMemories(next);
    await sSet("memories",{items:next});
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
      } catch(_) {}
    }
  },[memories,occasion,occasionCustom,userId,preloadedCharacter]);

  const deleteMemory = useCallback(async (id) => {
    const next = memories.filter(m => m.id!==id);
    setMemories(next);
    await sSet("memories",{items:next});
  },[memories]);

  const saveNightCard = useCallback(async (cardData) => {
    const entry = {id:uid(),...cardData,date:new Date().toISOString().split("T")[0]};
    const next = [entry,...nightCards];
    setNightCards(next);
    await sSet("nightcards",{items:next});
    // Mirror to v2 user-scoped storage
    if (userId) {
      try {
        const v2Key = `ss2_nightcards_${userId}`;
        const existing = JSON.parse(localStorage.getItem(v2Key) || "[]");
        const v2Entry = {
          id: entry.id, userId,
          heroName: entry.heroName || cardData.heroName || "",
          storyTitle: entry.storyTitle || "",
          characterIds: (() => { const ids: string[] = []; if(preloadedCharacter?.id) ids.push(preloadedCharacter.id); if(selectedCharId && !ids.includes(selectedCharId)) ids.push(selectedCharId); return ids; })(),
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
      } catch(_) {}
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
        '{"text":"[page text]","illustration_prompt":"[warm playful scene under 20 words]"}'
      )).join(",");

      const simpleSchema = `{"title":"3-6 word title","cover_prompt":"wide warm magical scene, all characters visible","pages":[${pgSchema(totalN)}],"refrain":"4-8 word refrain from the story"}`;
      const advSchema = `{"title":"3-6 word title","cover_prompt":"wide warm magical scene, all characters visible","setup_pages":[${pgSchema(setupN)}],"choice":{"question":"exciting choice question for ${name}","option_a_label":"4-7 words","option_b_label":"4-7 words"},"path_a":[${pgSchema(resN)}],"path_b":[${pgSchema(resN)}],"refrain":"4-8 word refrain from the story"}`;

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

    // ── The End page ──
    return (
      <div className="bpage end-bg" style={{overflowY:"auto"}}>
        <div className="pinset" />
        <div className="end-lay" style={{gap:12,paddingTop:18,paddingBottom:18}}>
          <div className="end-moon">🌙</div>
          <div className="end-title">The End</div>
          {book.refrain && (<div className="end-refrain-block">"{book.refrain}"</div>)}
          {book.parentNote && (
            <div className="end-parent-note">
              <div className="end-note-label">A note for you 👋</div>
              <div className="end-note-text">{book.parentNote}</div>
            </div>
          )}
          {!book.nightCard ? (
            <button className="end-nc-cta"
              onClick={()=>{
                setNcStep(0); setNcBondingA(ncBondingA||""); setNcGratitude(""); setNcExtra(ritualSeed||"");
                setNcPhoto(null); setNcCountdown(0); setNcGenerating(false);
                setNcResult(null); setNcRevealed(false);
                window.speechSynthesis?.cancel();
                if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current=null; }
                autoReadRef.current = false; setIsReading(false);
                setStage("nightcard");
              }}>
              🌙 Capture tonight's Night Card
            </button>
          ) : (
            <div style={{width:"100%",background:"rgba(212,160,48,.06)",border:"1px solid rgba(212,160,48,.18)",borderRadius:16,padding:"16px",textAlign:"center"}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(212,160,48,.55)",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>Tonight's Night Card</div>
              {book.nightCard.photo && (<div style={{width:100,margin:"0 auto 10px",borderRadius:4,overflow:"hidden",background:"#faf8f2",padding:"4px 4px 8px",boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}><img src={book.nightCard.photo} alt="" style={{width:"100%",borderRadius:2}}/></div>)}
              <div style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,fontStyle:"italic",color:"var(--gold3)",marginBottom:4}}>{book.nightCard.headline}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:12,fontStyle:"italic",color:"rgba(240,220,160,.8)",lineHeight:1.6}}>"{book.nightCard.quote}"</div>
            </div>
          )}
          <div className="end-ghost-row">
            <button className="btn-ghost" style={{flex:1,fontSize:12,padding:"9px 12px"}} onClick={shareStory}>✨ Send story</button>
            <button className="btn-ghost" style={{flex:1,fontSize:12,padding:"9px 12px"}} onClick={async()=>{window.speechSynthesis?.cancel();if(elAudioRef.current){elAudioRef.current.pause();elAudioRef.current=null;}autoReadRef.current=false;setIsReading(false);setStage("home");}}>🏠 Home</button>
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
        {stage==="home" && (() => {
          const savedCharsHome: any[] = (() => {
            try {
              if (!userId) return [];
              const raw = localStorage.getItem(`ss2_chars_${userId}`);
              return raw ? JSON.parse(raw) : [];
            } catch { return []; }
          })();

          return (
          <div className="screen" style={{padding:0}}>
            {/* Nav */}
            <div className="nb-nav">
              <div className="nb-logo">
                <div className="nb-moon" />
                SleepSeed
              </div>
            </div>

            <div className="nb-body">
              {/* Re-read check */}
              {styleDna?.pendingRereadChecks?.[0] && (
                <RereadCheck
                  pendingCheck={styleDna.pendingRereadChecks[0]}
                  styleDna={styleDna}
                  onAnswer={(updatedDna) => { setStyleDna(updatedDna); sSet("style_dna", updatedDna).catch(()=>{}); }}
                  onDismiss={() => { const updated={...styleDna,pendingRereadChecks:(styleDna.pendingRereadChecks||[]).slice(1)}; setStyleDna(updated); sSet("style_dna",updated).catch(()=>{}); }}
                />
              )}

              {/* Hero — name input */}
              <div style={{textAlign:"center",marginBottom:22}}>
                <div style={{fontSize:9,fontFamily:"var(--mono2)",color:"rgba(232,151,42,.5)",letterSpacing:"2px",textTransform:"uppercase",marginBottom:10}}>
                  Tonight's story is for
                </div>
                <input
                  className="nb-hero-input"
                  placeholder="Your child's name…"
                  value={heroName}
                  maxLength={20}
                  onChange={e => {
                    setHeroName(e.target.value);
                    if (!hasSeenOnboard && e.target.value.trim().length >= 1) {
                      setHasSeenOnboard(true);
                      sSet("onboarded",{v:true});
                    }
                  }}
                />
                <div className="nb-pronoun-row">
                  {[{v:"",l:"Any"},{v:"girl",l:"She / her"},{v:"boy",l:"He / him"}].map(o => (
                    <button key={o.v} className={`nb-pronoun${heroGender===o.v?" sel":""}`}
                      onClick={() => setHeroGender(o.v)}>{o.l}</button>
                  ))}
                </div>
              </div>

              {/* Saved characters */}
              {savedCharsHome.length > 0 && (
                <>
                  <div className="nb-divider" />
                  <div style={{marginBottom:18}}>
                    <div className="nb-label">Saved characters</div>
                    <div className="nb-char-strip">
                      {savedCharsHome.slice(0, 6).map((c: any) => (
                        <div key={c.id} className="nb-char-chip"
                          onClick={() => {
                            setHeroName(c.name);
                            if (c.pronouns === "she/her") setHeroGender("girl");
                            else if (c.pronouns === "he/him") setHeroGender("boy");
                            else setHeroGender("");
                            if (c.currentSituation) setStoryContext(c.currentSituation);
                            if (c.weirdDetail) setStoryGuidance(c.weirdDetail);
                          }}>
                          <div className={`nb-char-av${heroName===c.name?" sel":""}`} style={{background:c.color||"#1E1640"}}>
                            {c.photo
                              ? <img src={c.photo} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} alt="" />
                              : <span style={{fontSize:18}}>{c.emoji||"🧒"}</span>}
                          </div>
                          <div className={`nb-char-nm${heroName===c.name?" sel":""}`}>{c.name}</div>
                        </div>
                      ))}
                      <div className="nb-char-chip" onClick={() => { /* navigate to characters — TODO */ }}>
                        <div className="nb-char-av nb-char-av-add">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 3v10M3 8h10" stroke="rgba(232,151,42,.55)" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div className="nb-char-nm">New</div>
                      </div>
                    </div>
                    {heroName.trim().length >= 2 && savedCharsHome.find((c: any) => c.name === heroName) && (() => {
                      const matched = savedCharsHome.find((c: any) => c.name === heroName);
                      return matched ? (
                        <div className="nb-char-detail">
                          <div style={{fontSize:9.5,fontFamily:"var(--mono2)",color:"rgba(232,151,42,.55)",marginBottom:4}}>
                            {matched.name}{matched.ageDescription ? ` · ${matched.ageDescription}` : ""}{matched.pronouns ? ` · ${matched.pronouns}` : ""}
                          </div>
                          {matched.weirdDetail && (
                            <div style={{fontFamily:"var(--serif2)",fontSize:11.5,fontStyle:"italic",color:"rgba(244,239,232,.58)",lineHeight:1.62}}>
                              "{matched.weirdDetail}"
                            </div>
                          )}
                          <div className="nb-prefill-tag">✓ Fields pre-filled from saved profile</div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </>
              )}

              {error && <div className="err-box" style={{marginBottom:10}}>⚠️ {error}</div>}

              <div className="nb-divider" />

              {/* Single CTA */}
              <div style={{paddingTop:4,paddingBottom:6}}>
                <button
                  className="nb-cta"
                  disabled={heroName.trim().length < 2}
                  onClick={() => { if (heroName.trim().length < 2) return; setStage("builder"); }}>
                  Build tonight's story →
                </button>
                <div className="nb-customise" onClick={() => setStage("library")} style={{opacity: heroName.trim().length < 2 ? 0.3 : 1}}>
                  Or browse the story library ↓
                </div>
              </div>

              {/* Demo strip */}
              <div className="nb-divider" />
              <div
                onClick={() => { setBook({...DEMO_BOOK}); setPageIdx(0); setStage("book"); setFromCache(false); }}
                style={{borderRadius:14,overflow:"hidden",border:"1px solid rgba(212,160,48,.2)",cursor:"pointer",transition:"transform .15s",background:"rgba(13,21,53,.7)"}}
                onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-1px)")}
                onMouseLeave={e=>(e.currentTarget.style.transform="none")}>
                <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:11}}>
                  <div style={{fontSize:22,flexShrink:0}}>🌙</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:8,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(232,151,42,.6)",marginBottom:3,fontFamily:"var(--mono2)"}}>Example story — tap to read</div>
                    <div style={{fontFamily:"var(--serif2)",fontSize:13,fontWeight:700,color:"var(--cream)",lineHeight:1.3}}>The Stone in Her Pocket</div>
                  </div>
                  <div style={{fontSize:11,color:"rgba(232,151,42,.5)"}}>›</div>
                </div>
                <div style={{background:"rgba(232,151,42,.04)",padding:"8px 14px",borderTop:"1px solid rgba(232,151,42,.1)",fontFamily:"var(--serif2)",fontSize:11,fontStyle:"italic",color:"rgba(240,210,130,.75)",lineHeight:1.6}}>
                  "Adina yawned the kind of yawn that means everything is okay now."
                </div>
              </div>

            </div>
          </div>
          );
        })()}

        {/* QUICK STORY — redirects to builder */}
        {stage==="quick" && (() => { setStage("builder"); return null; })()}

        {/* BUILDER */}
        {stage==="builder" && (() => {
          const savedCharsBuilder: any[] = (() => {
            try {
              if (!userId) return [];
              const raw = localStorage.getItem(`ss2_chars_${userId}`);
              return raw ? JSON.parse(raw) : [];
            } catch { return []; }
          })();

          const buildPreview = () => {
            if (!heroName.trim()) return "";
            const matched = savedCharsBuilder.find((c: any) => c.name === heroName);
            const moodMap: Record<string,string> = {
              "calm and cosy, drifting toward sleep": "calm",
              "warm and funny, with lots of laughs": "warm & funny",
              "exciting and full of surprises": "exciting",
              "heartfelt and emotionally true": "heartfelt",
              "completely silly from start to finish": "silly",
              "mysterious with a satisfying ending": "mysterious",
            };
            const moodLabel = moodMap[storyBrief2] || (storyBrief2 ? storyBrief2.slice(0,20) : "");
            const brief = storyBrief1 || storyContext;
            const detail = matched?.weirdDetail || storyGuidance;
            const charNames = extraChars.filter(c => c.name.trim()).map(c => c.name.trim());
            let line = `A${moodLabel ? ` ${moodLabel}` : ""} story about ${heroName}`;
            if (detail) line += ` — the ${heroName} who ${detail.toLowerCase().replace(/^[^a-z]/,"")}`;
            if (brief && !detail) line += `. ${brief}`;
            if (charNames.length) line += `. Featuring ${charNames.join(" and ")}.`;
            else line += ".";
            return line;
          };

          const preview = buildPreview();

          const stickyLabel = (() => {
            const parts: string[] = [];
            if (storyBrief2) {
              const short: Record<string,string> = {
                "calm and cosy, drifting toward sleep":"Calm",
                "warm and funny, with lots of laughs":"Funny",
                "exciting and full of surprises":"Exciting",
                "heartfelt and emotionally true":"Heartfelt",
                "completely silly from start to finish":"Silly",
                "mysterious with a satisfying ending":"Mystery",
              };
              parts.push(short[storyBrief2] || "Story");
            }
            if (storyBrief1) parts.push(storyBrief1.slice(0,24)+(storyBrief1.length>24?"…":""));
            const charNames = extraChars.filter(c=>c.name.trim()).map(c=>c.name);
            if (charNames.length) parts.push(`with ${charNames.join(", ")}`);
            return parts.length ? parts.join(" · ") : "Set up your story above";
          })();

          const canGenerate = heroName.trim().length >= 2;
          const hasGoodInfo = canGenerate && (storyBrief1 || storyBrief2 || storyContext || storyGuidance);
          const matchedChar = savedCharsBuilder.find((c: any) => c.name === heroName);

          const glowColour = (() => {
            const mk = {
              "calm and cosy, drifting toward sleep": "rgba(60,100,220,.07)",
              "warm and funny, with lots of laughs": "rgba(255,170,50,.07)",
              "exciting and full of surprises": "rgba(232,80,30,.08)",
              "heartfelt and emotionally true": "rgba(200,70,170,.06)",
              "completely silly from start to finish": "rgba(220,200,40,.05)",
              "mysterious with a satisfying ending": "rgba(80,60,220,.07)",
            } as Record<string,string>;
            return mk[storyBrief2] || "rgba(232,151,42,.04)";
          })();

          const drawerSummary = (() => {
            const moodShort: Record<string,string> = {
              "calm and cosy, drifting toward sleep": "Calm & cosy",
              "warm and funny, with lots of laughs": "Warm & funny",
              "exciting and full of surprises": "Exciting",
              "heartfelt and emotionally true": "Heartfelt",
              "completely silly from start to finish": "Completely silly",
              "mysterious with a satisfying ending": "Mysterious",
            };
            const cast = [heroName, ...extraChars.filter(c=>c.name.trim()).map(c=>c.name.trim())].filter(Boolean);
            const lessonShort = lessons.map((l: string) => l.split("—")[0].replace(/^[^a-z]+/i,"").trim().split(" ").slice(0,3).join(" ")).join(", ");
            return {
              mood: moodShort[storyBrief2] || (storyBrief2 ? storyBrief2 : "Any mood"),
              about: storyBrief1 ? storyBrief1.slice(0,60) : (storyContext ? storyContext.slice(0,60) : "Open story"),
              cast: cast.join(", ") || heroName,
              weird: storyGuidance || ((matchedChar as any)?.weirdDetail || "None added"),
              lesson: lessonShort || "None",
              occasion: occasionCustom || "None",
              age: AGES.find(a => a.value === ageGroup)?.label || ageGroup,
              length: LENGTHS.find(l => l.value === storyLen)?.desc || storyLen,
              style: storyStyle || "Standard",
            };
          })();

          return (
          <div className="screen" style={{padding:0,paddingBottom:0}}>
            <div className="nb-nav">
              <button className="nb-back" onClick={() => setStage("home")}>← Back</button>
              <div className="nb-logo" style={{transform:"translateX(-20px)"}}>
                <div className="nb-moon" />
                {heroName ? `${heroName}'s Story` : "Story Builder"}
              </div>
            </div>

            <div className="nb-body" style={{paddingBottom:0}}>
              <div className="nb-body-bg" />
              <div className="nb-ambient" style={{background:`radial-gradient(ellipse,${glowColour},transparent 65%)`}} />
              {Array.from({length:40},(_,i)=>(
                <div key={i} className="nb-star" style={{
                  width:`${0.4+(i%3)*0.5}px`,height:`${0.4+(i%3)*0.5}px`,
                  left:`${(i*17.3+7)%100}%`,top:`${(i*13.7+11)%100}%`,
                  '--d':`${3+(i%2)}s`,'--dl':`${(i*0.4)%4}s`,
                } as any} />
              ))}

              {preview && (
                <div className="nb-preview">
                  <div className="nb-preview-label">Story preview</div>
                  <div className="nb-preview-text">{preview}</div>
                </div>
              )}

              <div style={{marginBottom:16}}>
                <div className="nb-label">What's tonight about?</div>
                <div className="nb-about-grid">
                  {[
                    {v:"going through something real from today", l:"Something real", e:"💛"},
                    {v:"about to go on a completely made-up adventure", l:"Made-up adventure", e:"🗺️"},
                    {v:"feeling a big emotion tonight", l:"Big feelings", e:"🌊"},
                    {v:"on a silly quest with friends", l:"Silly quest", e:"🤪"},
                  ].map(o => (
                    <button key={o.v} className={`nb-about-pill${storyBrief1===o.v?" sel":""}`}
                      onClick={() => setStoryBrief1(o.v)}>
                      <span style={{fontSize:15,width:20,textAlign:"center"}}>{o.e}</span>{o.l}
                    </button>
                  ))}
                </div>
                <textarea className="nb-textarea"
                  placeholder={`Or describe in your own words… e.g. "${heroName} is nervous about swimming tomorrow"`}
                  value={storyBrief1.startsWith("about")||storyBrief1.startsWith("on ")||storyBrief1.startsWith("feeling")||storyBrief1.startsWith("going")?"":(storyBrief1||"")}
                  onChange={e => setStoryBrief1(e.target.value)} rows={2} />
              </div>

              <div className="nb-divider" />

              <div style={{marginBottom:16}}>
                <div className="nb-label">The story should feel…</div>
                <div className="nb-mood-grid">
                  {[
                    {v:"calm and cosy, drifting toward sleep", l:"Calm & cosy", e:"🌙"},
                    {v:"warm and funny, with lots of laughs", l:"Warm & funny", e:"😄"},
                    {v:"exciting and full of surprises", l:"Exciting", e:"⚡"},
                    {v:"heartfelt and emotionally true", l:"Heartfelt", e:"💛"},
                    {v:"completely silly from start to finish", l:"Completely silly", e:"🤪"},
                    {v:"mysterious with a satisfying ending", l:"Mysterious", e:"🔍"},
                  ].map(o => (
                    <button key={o.v} className={`nb-mood-pill${storyBrief2===o.v?" sel":""}`}
                      onClick={() => setStoryBrief2(o.v)}>
                      <span style={{fontSize:15,width:20,textAlign:"center"}}>{o.e}</span>{o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="nb-divider" />

              <div style={{marginBottom:16}}>
                <div className="nb-label">Who else is in the story?</div>

                {/* Saved characters as toggleable chips */}
                {savedCharsBuilder.filter((c: any) => c.name !== heroName).length > 0 && (
                  <div className="nb-char-strip" style={{marginBottom:10}}>
                    {savedCharsBuilder.filter((c: any) => c.name !== heroName).slice(0,5).map((c: any) => {
                      const isIn = extraChars.some(ec => ec.name === c.name);
                      return (
                        <div key={c.id} className="nb-char-chip"
                          onClick={() => {
                            if (isIn) setExtraChars(cs => cs.filter(ec => ec.name !== c.name));
                            else if (extraChars.length < 4) setExtraChars(cs => [...cs, {id:uid(), type:"friend", name:c.name, photo:c.photo||null, classify:"", gender:c.pronouns||"", note:c.weirdDetail||""}]);
                          }}>
                          <div className={`nb-char-av${isIn?" sel":""}`} style={{background:c.color||"#1E1640"}}>
                            {c.photo ? <img src={c.photo} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} alt=""/> : <span style={{fontSize:18}}>{c.emoji||"🧒"}</span>}
                          </div>
                          <div className={`nb-char-nm${isIn?" sel":""}`}>{c.name}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline-added characters (editable rows) */}
                {extraChars.filter(c => !savedCharsBuilder.some((sc: any) => sc.name === c.name)).length > 0 && (
                  <div className="char-simple-list" style={{marginBottom:10}}>
                    {extraChars.filter(c => !savedCharsBuilder.some((sc: any) => sc.name === c.name)).map(c => (
                      <div key={c.id}>
                        <div className="char-simple-row">
                          <div className="char-photo" style={{width:38,height:38,fontSize:18,borderRadius:10,flexShrink:0,cursor:"pointer"}} onClick={()=>pickPhoto(c.id)}>
                            {c.photo ? <img src={c.photo.preview} alt={c.name} /> : <span>{(c as any).emoji || CHAR_ICONS[c.type]||"👫"}</span>}
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
                            <input className="char-name-in" placeholder="Character name…"
                              value={c.name} maxLength={16} onChange={e=>updateExtraChar(c.id,{name:e.target.value})} />
                            <input className="char-name-in" placeholder={`Tell me about ${c.name||"them"}…`}
                              value={c.note||""} maxLength={80} style={{fontSize:10,opacity:.85}}
                              onChange={e=>updateExtraChar(c.id,{note:e.target.value})} />
                          </div>
                          <button className="btn-danger" style={{flexShrink:0,alignSelf:"flex-start"}} onClick={()=>removeExtraChar(c.id)}>✕</button>
                        </div>
                        {!c.photo && (
                          <div style={{display:"flex",gap:4,flexWrap:"wrap",padding:"6px 0 4px",marginLeft:48}}>
                            {FUN_ICONS.slice(0,14).map(e => (
                              <div key={e} onClick={()=>updateExtraChar(c.id,{emoji:e} as any)}
                                style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",
                                  fontSize:15,cursor:"pointer",transition:"all .15s",
                                  border:(c as any).emoji===e?"1.5px solid rgba(212,160,48,.5)":"1px solid rgba(255,255,255,.06)",
                                  background:(c as any).emoji===e?"rgba(212,160,48,.1)":"rgba(255,255,255,.03)"}}>
                                {e}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add character button — always shown if under limit */}
                {extraChars.length < 4 && (
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:extraChars.length > 0 || savedCharsBuilder.filter((c: any) => c.name !== heroName).length > 0 ? 0 : 4}}>
                    {CHAR_TYPES.map(t => (
                      <button key={t.value} className="char-add-pill"
                        onClick={()=>setExtraChars(cs=>[...cs,{id:uid(),type:t.value,name:"",photo:null,classify:"",gender:"",note:""}])}>
                        <span className="char-add-pill-icon">{t.icon}</span><span>+ {t.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="nb-divider" />

              <div style={{marginBottom:16}}>
                <div className="nb-label">Sneak in a lesson? <span style={{color:"rgba(244,239,232,.25)",fontSize:"8px",fontStyle:"italic",textTransform:"none",letterSpacing:0,marginLeft:4}}>optional</span></div>
                <div>
                  <div className="nb-lesson-group-label">Emotional</div>
                  <div className="nb-lesson-pills">
                    {LESSONS_EMOTIONAL.map(l => (
                      <button key={l.value} className={`nb-lesson-pill${lessons.includes(l.value)?" sel":""}`}
                        onClick={()=>setLessons(ls=>ls.includes(l.value)?ls.filter(x=>x!==l.value):[...ls,l.value])}>
                        {l.label.replace(/^[^ ]+ /,"")}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginTop:8}}>
                  <div className="nb-lesson-group-label">Character</div>
                  <div className="nb-lesson-pills">
                    {LESSONS_CHARACTER.map(l => (
                      <button key={l.value} className={`nb-lesson-pill${lessons.includes(l.value)?" sel":""}`}
                        onClick={()=>setLessons(ls=>ls.includes(l.value)?ls.filter(x=>x!==l.value):[...ls,l.value])}>
                        {l.label.replace(/^[^ ]+ /,"")}
                      </button>
                    ))}
                  </div>
                </div>
                {lessons.length > 0 && (
                  <textarea className="nb-textarea"
                    placeholder={`What's ${heroName} experiencing?`}
                    value={lessonContext} onChange={e=>setLessonContext(e.target.value)}
                    maxLength={200} rows={2} style={{marginTop:8}} />
                )}
              </div>

              <div className="nb-divider" />

              <div style={{marginBottom:16}}>
                <div className="nb-label">Settings</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div>
                    <div style={{fontSize:8.5,fontFamily:"var(--mono2)",color:"rgba(244,239,232,.28)",marginBottom:6,textTransform:"uppercase",letterSpacing:"1px"}}>Reading Level</div>
                    <div className="nb-age-row">
                      {AGES.map(a => (
                        <button key={a.value} className={`nb-age-pill${ageGroup===a.value?" sel":""}`}
                          onClick={()=>setAgeGroup(a.value)}>
                          <div>{a.label}</div><div className="nb-age-pill-sub">{a.grade}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:8.5,fontFamily:"var(--mono2)",color:"rgba(244,239,232,.28)",marginBottom:6,textTransform:"uppercase",letterSpacing:"1px"}}>Length</div>
                    <div className="nb-setting-chips">
                      {LENGTHS.map(l => (
                        <button key={l.value} className={`nb-setting-chip${storyLen===l.value?" sel":""}`}
                          onClick={()=>setStoryLen(l.value)}>{l.label} · {l.desc}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:8.5,fontFamily:"var(--mono2)",color:"rgba(244,239,232,.28)",marginBottom:6,textTransform:"uppercase",letterSpacing:"1px"}}>Style</div>
                    <div className="nb-setting-chips">
                      {[{v:"standard",l:"Standard"},{v:"rhyming",l:"Rhyming"},{v:"mystery",l:"Mystery"}].map(o => (
                        <button key={o.v} className={`nb-setting-chip${storyStyle===o.v?" sel":""}`}
                          onClick={()=>setStoryStyle(o.v)}>{o.l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginTop:4}}>
                    <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"10px 12px",
                      borderRadius:11,border:`1px solid ${storyStyle==="adventure"?"rgba(232,151,42,.32)":"rgba(255,255,255,.08)"}`,
                      background:storyStyle==="adventure"?"rgba(232,151,42,.09)":"rgba(255,255,255,.03)",transition:"all .2s"}}
                      onClick={()=>setStoryStyle(storyStyle==="adventure"?"standard":"adventure")}>
                      <div style={{width:18,height:18,borderRadius:4,border:`1.5px solid ${storyStyle==="adventure"?"var(--amber)":"rgba(255,255,255,.2)"}`,
                        background:storyStyle==="adventure"?"var(--amber)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",
                        flexShrink:0,marginTop:1,transition:"all .2s"}}>
                        {storyStyle==="adventure" && <span style={{color:"#1A1420",fontSize:12,fontWeight:700}}>✓</span>}
                      </div>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:storyStyle==="adventure"?"var(--amber2)":"rgba(244,239,232,.55)",
                          fontFamily:"var(--sans2)",marginBottom:2}}>🔀 Choose-Your-Path</div>
                        <div style={{fontSize:10,color:"rgba(244,239,232,.3)",fontFamily:"var(--sans2)",lineHeight:1.5}}>
                          Your child gets to choose options within the story — two paths, both end in sleep.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="nb-divider" />

              <div style={{marginBottom:16}}>
                <div className="nb-label">Special occasion? <span style={{color:"rgba(244,239,232,.25)",fontSize:"8px",fontStyle:"italic",textTransform:"none",letterSpacing:0,marginLeft:4}}>optional</span></div>
                <input className="nb-input-sm" placeholder="e.g. Birthday, first day, lost a tooth…"
                  value={occasionCustom} onChange={e=>setOccasionCustom(e.target.value)} maxLength={120} />
              </div>

              <div style={{marginBottom:16}}>
                <div className="nb-label">One interesting, quirky, or special detail about {heroName || "them"} <span style={{color:"rgba(244,239,232,.25)",fontSize:"8px",fontStyle:"italic",textTransform:"none",letterSpacing:0,marginLeft:4}}>optional but powerful</span></div>
                <textarea className="nb-textarea"
                  placeholder={`Something that makes ${heroName||"them"} uniquely themselves… e.g. "keeps a list of every dog she's met in order of how much they understood her"`}
                  value={storyGuidance} onChange={e=>setStoryGuidance(e.target.value)}
                  maxLength={200} rows={2} />
              </div>

              {error && <div className="err-box" style={{marginBottom:10}}>⚠️ {error}</div>}
              <div style={{height:90}} />
            </div>

            <div
              className={`nb-sticky-bar${hasGoodInfo ? " has-info" : ""}`}
              onClick={e => {
                if ((e.target as HTMLElement).closest(".nb-sticky-btn")) return;
                if (canGenerate) setShowBuilderDrawer(d => !d);
              }}>
              {hasGoodInfo && <div className="nb-ready-label">✦ Story is ready — tap to review</div>}
              <div className="nb-sticky-handle" />
              <div className="nb-sticky-inner">
                <div className="nb-sticky-av">
                  {matchedChar?.photo ? <img src={matchedChar.photo} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} alt="" /> : <span style={{fontSize:19}}>{matchedChar?.emoji || "🌙"}</span>}
                </div>
                <div className="nb-sticky-info">
                  <div className="nb-sticky-name">{heroName || "Your story"}</div>
                  <div className="nb-sticky-sub">{stickyLabel}</div>
                  {hasGoodInfo && <div className="nb-sticky-hint">▲ Tap to review full summary</div>}
                </div>
                <button className="nb-sticky-btn" disabled={!canGenerate}
                  onClick={e => { e.stopPropagation(); generate({storyBrief1, storyBrief2, realLifeCtx}); }}>
                  Create →
                </button>
              </div>
            </div>

            {showBuilderDrawer && (
              <>
                <div className="nb-drawer-overlay" onClick={() => setShowBuilderDrawer(false)} />
                <div className="nb-drawer">
                  <div className="nb-drawer-handle" />
                  <div className="nb-drawer-title">{heroName ? `${heroName}'s Story Tonight` : "Tonight's Story"}</div>
                  <div className="nb-drawer-sub">Review your story before generating</div>
                  {preview && <div className="nb-drawer-preview">{preview}</div>}
                  <div className="nb-drawer-rows">
                    <div className="nb-drawer-row"><span className="nb-drawer-row-lbl">Mood</span><span className="nb-drawer-row-val">{drawerSummary.mood}</span></div>
                    <div className="nb-drawer-row"><span className="nb-drawer-row-lbl">About</span><span className="nb-drawer-row-val">{drawerSummary.about}</span></div>
                    <div className="nb-drawer-row"><span className="nb-drawer-row-lbl">Cast</span><span className="nb-drawer-row-val">{drawerSummary.cast}</span></div>
                    {drawerSummary.weird !== "None added" && <div className="nb-drawer-row"><span className="nb-drawer-row-lbl">Detail</span><span className="nb-drawer-row-val">{drawerSummary.weird}</span></div>}
                    {drawerSummary.lesson !== "None" && <div className="nb-drawer-row"><span className="nb-drawer-row-lbl">Lesson</span><span className="nb-drawer-row-val">{drawerSummary.lesson}</span></div>}
                    {drawerSummary.occasion !== "None" && <div className="nb-drawer-row"><span className="nb-drawer-row-lbl">Occasion</span><span className="nb-drawer-row-val">{drawerSummary.occasion}</span></div>}
                    <div className="nb-drawer-row"><span className="nb-drawer-row-lbl">Age</span><span className="nb-drawer-row-val">{drawerSummary.age}</span></div>
                    <div className="nb-drawer-row"><span className="nb-drawer-row-lbl">Length</span><span className="nb-drawer-row-val">{drawerSummary.length}</span></div>
                    <div className="nb-drawer-row"><span className="nb-drawer-row-lbl">Style</span><span className="nb-drawer-row-val">{drawerSummary.style}</span></div>
                  </div>
                  <div className="nb-drawer-disclaimer">Please confirm this all looks right before generating</div>
                  <button className="nb-drawer-cta" disabled={!canGenerate}
                    onClick={() => { setShowBuilderDrawer(false); generate({storyBrief1, storyBrief2, realLifeCtx}); }}>
                    Create {heroName ? `${heroName}'s` : "tonight's"} story ✨
                  </button>
                  <button className="nb-drawer-edit" onClick={() => setShowBuilderDrawer(false)}>← Keep editing</button>
                </div>
              </>
            )}
          </div>
          );
        })()}

        {/* GENERATING */}
        {stage==="generating" && (
          <div className="screen" style={{maxWidth:420,padding:0}}>
            <div className="nb-nav">
              <div className="nb-logo"><div className="nb-moon" />SleepSeed</div>
            </div>
            <div className="nb-gen-body">
              <div className="nb-gen-progress">
                <div className="nb-gen-fill" style={{width:`${gen.progress}%`,transition:"width .5s ease"}} />
              </div>
              <div className="nb-gen-dots">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`nb-gen-dot${i<gen.stepIdx?" done":i===gen.stepIdx?" active":""}`}
                    style={{width: i===gen.stepIdx ? 22 : i<gen.stepIdx ? 18 : 14}} />
                ))}
              </div>
              <div className="nb-gen-moon" />
              <div className="nb-gen-title">Writing {heroName}'s story…</div>
              <div className="nb-gen-sub">
                A one-of-a-kind bedtime story.{adventure && " Choose-Your-Adventure mode."}<br/>About no one else on earth.
              </div>

              {gen.stepIdx <= 2 && ncBondingQ && (
                <div className="nb-bq-card">
                  <div className="nb-bq-while">While you wait — ask {heroName}:</div>
                  <div className="nb-bq-q">"{ncBondingQ}"</div>
                  {ncBondingSaved ? (
                    <div style={{background:"rgba(76,200,144,.08)",border:"1px solid rgba(76,200,144,.18)",borderRadius:10,padding:"10px 13px"}}>
                      <div style={{fontSize:8.5,fontFamily:"var(--mono2)",color:"rgba(76,200,144,.6)",marginBottom:4,textTransform:"uppercase",letterSpacing:"1px"}}>✓ Saved for Night Card</div>
                      <div style={{fontFamily:"var(--serif2)",fontSize:13,fontStyle:"italic",color:"var(--cream)",lineHeight:1.6}}>"{ncBondingA}"</div>
                    </div>
                  ) : (
                    <>
                      <textarea className="nb-bq-answer"
                        placeholder={`What did ${heroName} say?\nTheir answer gets saved to tonight's Night Card…`}
                        value={ncBondingA} onChange={e => setNcBondingA(e.target.value)} rows={3} />
                      <button className="nb-bq-save" disabled={!ncBondingA.trim()}
                        onClick={() => { if (ncBondingA.trim()) setNcBondingSaved(true); }}>
                        {ncBondingA.trim() ? "Save for tonight's Night Card ✓" : "Type their answer above…"}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="nb-step-list">
                {["Setting the scene…","Writing the story…","Painting illustrations…","Book is ready!"].map((s,i) => {
                  const state = i < gen.stepIdx ? "done" : i === gen.stepIdx ? "active" : "pending";
                  return (
                    <div key={i} className={`nb-step-item ${state}`}>
                      <div className={`nb-step-icon ${state}`}>
                        {state === "done" ? (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : state === "active" ? (
                          <div className="nb-step-pulse" />
                        ) : null}
                      </div>
                      <span>{state === "done" ? "✓ " : ""}{s}</span>
                    </div>
                  );
                })}
              </div>

              {gen.dots.length > 0 && (
                <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center",marginTop:10}}>
                  {gen.dots.map((s,i) => (
                    <div key={i} className={`img-dot ${s==="p"?"busy":"done"}`}>{s==="d"?"✓":"…"}</div>
                  ))}
                </div>
              )}
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
                setStage(lastErrStage||"builder");
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
            <div className="rd-nav">
              <div className="rd-logo" onClick={() => { window.speechSynthesis?.cancel(); if(elAudioRef.current){elAudioRef.current.pause();elAudioRef.current=null;} autoReadRef.current=false;setIsReading(false);setStage("home"); }}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"radial-gradient(circle at 38% 38%,#F5C060,#C87020)",flexShrink:0}} /> SleepSeed
              </div>
              <div className="rd-progress">{isLastPage?`${book.heroName}'s story · The End`:`Page ${pageIdx} of ${totalPages-1} · ~${Math.max(1,Math.ceil((totalPages-1-pageIdx)*0.4))} min`}</div>
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                {fromCache && <div style={{fontSize:9,background:"rgba(76,200,144,.12)",border:"1px solid rgba(76,200,144,.28)",borderRadius:5,padding:"3px 7px",color:"var(--green2)",fontWeight:700}}>Saved</div>}
                {voiceId && <div style={{fontSize:9,background:"rgba(240,100,120,.12)",border:"1px solid rgba(240,100,120,.28)",borderRadius:5,padding:"3px 7px",color:"#f8a0b0",fontWeight:700}}>Your Voice</div>}
              </div>
            </div>
            <div className="book-3d" onClick={addSparkle}>{renderPage()}{sparkles.map(sp=>(<div key={sp.id} className="spark-ring" style={{left:sp.x,top:sp.y}}>{Array.from({length:8},(_,i)=>{const angle=(i/8)*Math.PI*2;const dist=30+Math.random()*25;return(<div key={i} className="spark" style={{background:SPARK_COLORS[i%SPARK_COLORS.length],"--sx":`${Math.cos(angle)*dist}px`,"--sy":`${Math.sin(angle)*dist}px`,animationDelay:`${i*30}ms`,left:0,top:0}}/>);})}</div>))}</div>
            <div className="book-nav" style={{marginTop:8}}>
              <button className="nav-btn" disabled={pageIdx===0} onClick={()=>goPage(-1)}>← Back</button>
              <div className="dots">{Array.from({length:totalPages}).map((_,i)=>(<div key={i} className={`dot${i===pageIdx?" on":""}`} onClick={()=>{if(i<=pageIdx||(i===choicePgIdx+1&&chosenPath))setPageIdx(i);}}/>))}</div>
              <button className="nav-btn" disabled={isLastPage||(onChoicePg&&!chosenPath)} onClick={()=>goPage(1)}>{onChoicePg&&!chosenPath?"Choose!":"Next →"}</button>
            </div>
            <div className="rd-ctrl">
              <button className={`rd-btn-secondary${isReading?" on":""}`} onClick={()=>{const prog=totalPages>1?pageIdx/(totalPages-1):0.5;toggleRead(pageIdx===0?`${book.title}. A bedtime story for ${book.heroName}.`:getCurrentPageText(),prog);}}>{isReading?"⏸ Pause":(selectedVoiceId||voiceId)?`🔊 ${(PRESET_VOICES.find(v=>v.id===selectedVoiceId)||{name:voiceId?"My Voice":"Read"}).name}`:"🔊 Read aloud"}</button>
              <button className={`rd-btn-secondary${(selectedVoiceId||voiceId)?" on":""}`} onClick={()=>setShowVoicePicker(true)}>🎤 {selectedVoiceId?(PRESET_VOICES.find(v=>v.id===selectedVoiceId)?.name||"Voice"):voiceId?"My Voice":"Voice"}</button>
              <button className="rd-btn-secondary" onClick={shareStory}>✨ Send story</button>
              <button className="rd-btn-secondary" onClick={downloadStory}>📄 PDF</button>
              <button className="rd-btn-secondary" onClick={async()=>{try{const s=makeStorySeed(heroName,theme,extraChars,occasion,occasionCustom,lesson,adventure,storyLen,heroGender,heroClassify,storyGuidance);await sDel(`book_${s}`);}catch(_){}window.speechSynthesis?.cancel();if(elAudioRef.current){elAudioRef.current.pause();elAudioRef.current=null;}autoReadRef.current=false;setStoryContext("");setLessonContext("");setTodayPrompt("");setStoryBrief1("");setStoryBrief2("");setRealLifeChip("");setRealLifeCtx("");setBriefStep1Open(true);setBriefStep2Open(false);setStage("home");setBook(null);setChosenPath(null);setIsReading(false);}}>🔄 New</button>
              <div className="rd-status">✓ Auto-saved</div>
            </div>
            {showVoicePicker&&(<div className="vc-modal" onClick={e=>{if(e.target===e.currentTarget)setShowVoicePicker(false);}}><div className="vc-card" style={{maxHeight:"80vh",overflowY:"auto"}}><div className="vc-title">🎤 Choose a Voice</div><div className="vc-sub">Who reads tonight's story?</div><div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--dimmer)",marginBottom:8}}>Narrators</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>{PRESET_VOICES.map(v=>(<button key={v.id} style={{padding:"10px",borderRadius:11,cursor:"pointer",textAlign:"left",border:`1.5px solid ${selectedVoiceId===v.id?"rgba(212,160,48,.7)":"rgba(255,255,255,.1)"}`,background:selectedVoiceId===v.id?"rgba(212,160,48,.1)":"rgba(255,255,255,.04)",transition:"all .15s"}} onClick={()=>{setSelectedVoiceId(selectedVoiceId===v.id?null:v.id);}}><div style={{fontSize:16,marginBottom:3}}>{v.emoji}</div><div style={{fontSize:12,fontWeight:700,color:selectedVoiceId===v.id?"var(--gold2)":"var(--cream)"}}>{v.name}</div><div style={{fontSize:9,color:"var(--dimmer)",marginTop:1}}>{v.desc}</div></button>))}</div><div style={{height:1,background:"rgba(255,255,255,.08)",marginBottom:14}}/><div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--dimmer)",marginBottom:8}}>Your Own Voice</div><button style={{width:"100%",padding:"12px 14px",borderRadius:11,cursor:"pointer",textAlign:"left",border:`1.5px solid ${voiceId?"rgba(76,200,144,.5)":"rgba(255,255,255,.1)"}`,background:voiceId?"rgba(76,200,144,.08)":"rgba(255,255,255,.04)",marginBottom:14}} onClick={()=>{setShowVoicePicker(false);setVcStage(voiceId?"ready":"idle");setShowVcModal(true);}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>🎙️</span><div><div style={{fontSize:12,fontWeight:700,color:voiceId?"#80d8a8":"var(--cream)"}}>{voiceId?"My Voice ✓":"Record My Voice"}</div><div style={{fontSize:9,color:"var(--dimmer)",marginTop:1}}>{voiceId?"Tap to manage":"Clone your voice in 45 seconds"}</div></div></div></button><div style={{display:"flex",gap:8}}>{(selectedVoiceId||voiceId)&&(<button className="btn-ghost" style={{flex:1,fontSize:12,padding:10}} onClick={()=>{setSelectedVoiceId(null);}}>🔇 No Voice</button>)}<button className="btn" style={{flex:2,padding:11,fontSize:14}} onClick={()=>setShowVoicePicker(false)}>Done ✓</button></div></div></div>)}
            {showVcModal&&(<div className="vc-modal" onClick={e=>{if(e.target===e.currentTarget){cancelRecording();setShowVcModal(false);} }}><div className="vc-card"><div className="vc-title">🎤 Use Your Voice</div><div className="vc-sub">Read the script below — SleepSeed learns your voice. ✨</div>{(vcStage==="idle"||vcStage==="error"||vcStage==="recording")&&(<><div className="vc-script-label">{vcStage==="recording"?"🔴 Recording — calm, warm pace:":"Read this aloud — warmly and clearly:"}</div><div className="vc-script">Once upon a time, in a land where the stars came out to play, a little child looked up at the sky and smiled. "Good evening," said the moon. "Are you ready for tonight's adventure?" And the child, heart full of wonder, whispered: "I'm always ready." So together they set off into the most magical night imaginable, where every shadow hid a friendly surprise, and every sound was the beginning of a brand new story.</div>{vcStage==="recording"?(<div style={{marginBottom:8}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}><div style={{fontSize:11,color:"var(--dim)"}}>{vcSeconds<15?"Keep going — aim for 30 seconds":vcSeconds<30?"Great! A little more…":"✓ Ready to stop"}</div><div style={{fontSize:22,fontFamily:"monospace",fontWeight:700,color:"var(--gold2)",letterSpacing:1}}>{String(Math.floor(vcSeconds/60)).padStart(2,"0")}:{String(vcSeconds%60).padStart(2,"0")}</div></div><div style={{height:4,background:"rgba(255,255,255,.08)",borderRadius:99,marginBottom:14,overflow:"hidden"}}><div style={{height:"100%",borderRadius:99,background:"var(--gold2)",width:`${Math.min(100,(vcSeconds/60)*100)}%`,transition:"width 1s linear"}}/></div><button className="btn" style={{marginBottom:8}} onClick={stopRecording}>⏹ Stop &amp; Use This Recording</button><button className="btn-ghost" style={{width:"100%",fontSize:12}} onClick={cancelRecording}>Cancel</button></div>):(<><div style={{fontSize:11,color:"var(--dim)",marginBottom:14,lineHeight:1.6}}>🎧 <strong style={{color:"var(--cream)"}}>Tips:</strong> Quiet room · calm bedtime pace · 30–60 seconds</div>{vcError&&<div style={{fontSize:11,color:"#f09080",marginBottom:10,lineHeight:1.5}}>{vcError}</div>}<button className="btn" style={{marginBottom:8}} onClick={startRecording}>🔴 Start Recording</button>{voiceId&&(<button className="btn-ghost" style={{width:"100%",fontSize:12,marginBottom:8}} onClick={resetVoice}>🗑 Remove current voice</button>)}<button className="btn-ghost" style={{width:"100%",fontSize:12}} onClick={()=>setShowVcModal(false)}>Close</button></>)}</>)}{vcStage==="uploading"&&(<div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:36,marginBottom:12}}>✨</div><div className="vc-status">Learning your voice…</div><div style={{fontSize:11,color:"var(--dimmer)",marginTop:6}}>This takes about 15 seconds</div></div>)}{vcStage==="ready"&&(<><div style={{textAlign:"center",padding:"16px 0 12px"}}><div style={{fontSize:40,marginBottom:8}}>🎉</div><div className="vc-status" style={{color:"var(--green2)"}}>Your voice is ready!</div><div style={{fontSize:11,color:"var(--dim)",marginTop:6}}>Every story will now be narrated in your voice.</div></div><div style={{display:"flex",gap:8}}><button className="btn" style={{flex:1,padding:11,fontSize:14}} onClick={()=>setShowVcModal(false)}>Done ✓</button><button className="btn-ghost" style={{flex:1,padding:11,fontSize:13}} onClick={()=>{setVcStage("idle");setVcSeconds(0);}}>Re-record</button></div><button className="btn-ghost" style={{width:"100%",fontSize:12,marginTop:8}} onClick={resetVoice}>🗑 Remove voice</button></>)}</div></div>)}
            {showShareModal&&(
              <div className="share-modal-bg" onClick={e=>{if(e.target===e.currentTarget)setShowShareModal(false);}}>
                <div className="share-modal">
                  <div className="share-modal-title">Share tonight's story</div>
                  <div className="share-modal-sub">Send it to anyone — no account needed.</div>

                  {/* Night Card toggle */}
                  {book.nightCard && (
                    <label style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",marginBottom:14,
                      borderRadius:12,cursor:"pointer",transition:"all .2s",
                      border:`1px solid ${shareIncludeNC?"rgba(232,151,42,.3)":"rgba(255,255,255,.08)"}`,
                      background:shareIncludeNC?"rgba(232,151,42,.06)":"rgba(255,255,255,.02)"}}
                      onClick={()=>{
                        const next = !shareIncludeNC;
                        setShareIncludeNC(next);
                        setShareLink(generateShareLink(next));
                        setShareCopied(false);
                      }}>
                      <div style={{width:20,height:20,borderRadius:5,flexShrink:0,
                        border:`1.5px solid ${shareIncludeNC?"var(--amber,#E8972A)":"rgba(255,255,255,.2)"}`,
                        background:shareIncludeNC?"var(--amber,#E8972A)":"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
                        {shareIncludeNC && <span style={{color:"#1A1420",fontSize:13,fontWeight:700}}>✓</span>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:shareIncludeNC?"var(--cream)":"rgba(244,239,232,.5)"}}>🌙 Include tonight's Night Card</div>
                        <div style={{fontSize:10,color:"rgba(244,239,232,.3)",marginTop:1}}>Share the bonding moment, photo, and answers alongside the story</div>
                      </div>
                    </label>
                  )}

                  {/* Send to anyone */}
                  <div style={{marginBottom:4}}>
                    <div className="share-option" style={{cursor:"default"}}>
                      <div className="share-option-icon" style={{background:"rgba(232,151,42,.1)"}}>👵</div>
                      <div className="share-option-info">
                        <div className="share-option-h">Send to anyone</div>
                        <div className="share-option-sub">{(voiceId||selectedVoiceId)?"They can read and listen in your voice — no account needed":"Share the full story — they can read it on any device"}</div>
                      </div>
                    </div>
                    <div className="share-link-row">
                      <input id="share-link-input" className="share-link-input" readOnly value={shareLink} onClick={e=>(e.target as HTMLInputElement).select()}/>
                      <button className={`share-link-copy${shareCopied?" copied":""}`} onClick={copyShareLink}>{shareCopied?"✓ Copied!":"Copy link"}</button>
                    </div>
                  </div>

                  {/* Social media */}
                  <div className="share-section-label">Social Media</div>
                  <div className="share-sm-row">
                    <button className="share-sm-btn" onClick={()=>{
                      const url=encodeURIComponent(shareLink);
                      const txt=encodeURIComponent(`${book?.heroName}'s personalised bedtime story — "${book?.title}" — made with SleepSeed ✨`);
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${txt}`,"_blank","width=600,height=500");
                    }}>
                      <div className="share-sm-icon share-sm-fb"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" fill="rgba(24,119,242,.9)"/></svg></div>
                      <div className="share-sm-label">Facebook</div>
                    </button>
                    <button className="share-sm-btn" onClick={()=>{
                      const url=encodeURIComponent(shareLink);
                      const txt=encodeURIComponent(`${book?.heroName}'s personalised bedtime story — "${book?.title}" ✨ Made with SleepSeed`);
                      window.open(`https://twitter.com/intent/tweet?text=${txt}&url=${url}`,"_blank","width=600,height=500");
                    }}>
                      <div className="share-sm-icon share-sm-x"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="rgba(255,255,255,.8)"/></svg></div>
                      <div className="share-sm-label">X</div>
                    </button>
                    <button className="share-sm-btn" onClick={()=>{const el=document.getElementById("ig-sheet");if(el)el.classList.toggle("vis");}}>
                      <div className="share-sm-icon share-sm-ig"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="rgba(225,48,108,.85)" strokeWidth="1.8"/><circle cx="12" cy="12" r="4.5" stroke="rgba(225,48,108,.85)" strokeWidth="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="rgba(225,48,108,.85)"/></svg></div>
                      <div className="share-sm-label">Instagram</div>
                    </button>
                  </div>
                  <div id="ig-sheet" className="share-ig-sheet">
                    <div className="share-ig-title">Share to Instagram</div>
                    <div className="share-ig-sub">Instagram doesn't support direct sharing from web apps. Copy the link to paste in your caption, or download the story card image to post to Stories.</div>
                    <div className="share-ig-btns">
                      <button className="share-ig-copy" onClick={copyShareLink}>{shareCopied?"✓ Link copied!":"Copy link"}</button>
                      <button className="share-ig-dl" onClick={()=>{setShowShareModal(false);shareSocialCard();}}>Download card</button>
                    </div>
                  </div>

                  {/* Download PDF */}
                  <div className="share-section-label">Save</div>
                  <button className="share-option" onClick={()=>{setShowShareModal(false);downloadStory();}}>
                    <div className="share-option-icon" style={{background:"rgba(76,200,144,.07)"}}>📄</div>
                    <div className="share-option-info">
                      <div className="share-option-h">Download as PDF</div>
                      <div className="share-option-sub">A beautifully laid out printable book{book?.nightCard?" — includes your Night Card":""}</div>
                    </div>
                    <div style={{fontSize:11,color:"rgba(244,239,232,.25)"}}>›</div>
                  </button>

                  <button className="share-dismiss" onClick={()=>setShowShareModal(false)}>Close</button>
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

            {/* Step 3: Photo — camera or upload */}
            {ncStep===3 && (
              <div className="nc-step-card" key="s3">
                <input ref={ncFileRef} type="file" accept="image/*" style={{display:"none"}}
                  onChange={e=>{
                    const file = e.target.files?.[0]; if(!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const img = new window.Image();
                      img.onload = () => {
                        const canvas = document.createElement("canvas");
                        const s = Math.min(640/img.width, 640/img.height, 1);
                        canvas.width = Math.round(img.width*s);
                        canvas.height = Math.round(img.height*s);
                        canvas.getContext("2d")?.drawImage(img,0,0,canvas.width,canvas.height);
                        setNcPhoto(canvas.toDataURL("image/jpeg",0.82));
                        ncStreamRef.current?.getTracks().forEach(t=>t.stop());
                        ncStreamRef.current=null;
                      };
                      img.src = ev.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }} />

                {!ncPhoto ? (
                  <>
                    <div className="nc-step-icon">📸</div>
                    <div className="nc-step-title">Add a photo</div>
                    <div className="nc-step-sub">Snap a selfie right now, or upload a favourite memory from today.</div>

                    {/* Camera preview */}
                    <div className="nc-camera">
                      <video ref={ncVideoRef} autoPlay playsInline muted
                        style={{display:"block"}}
                        onLoadedMetadata={()=>{}} />
                      {ncCountdown > 0 && (
                        <div className="nc-countdown" key={ncCountdown}>{ncCountdown}</div>
                      )}
                    </div>
                    {/* Camera started via effect */}

                    {/* Two primary actions side by side */}
                    <div style={{display:"flex",gap:8,marginBottom:8}}>
                      <button className="btn" style={{flex:1,padding:12,fontSize:13}} disabled={ncCountdown>0}
                        onClick={()=>{
                          setNcCountdown(3);
                          let c = 3;
                          const iv = setInterval(()=>{
                            c--;
                            if(c > 0) { setNcCountdown(c); }
                            else {
                              clearInterval(iv); setNcCountdown(0);
                              const video = ncVideoRef.current;
                              if(video && video.videoWidth) {
                                const canvas = document.createElement("canvas");
                                const s = Math.min(480/video.videoWidth, 480/video.videoHeight, 1);
                                canvas.width = Math.round(video.videoWidth*s);
                                canvas.height = Math.round(video.videoHeight*s);
                                const ctx = canvas.getContext("2d");
                                ctx.translate(canvas.width,0); ctx.scale(-1,1);
                                ctx.drawImage(video,0,0,canvas.width,canvas.height);
                                setNcPhoto(canvas.toDataURL("image/jpeg",0.82));
                                ncStreamRef.current?.getTracks().forEach(t=>t.stop());
                                ncStreamRef.current=null;
                              } else { setNcStep(4); }
                            }
                          },1000);
                        }}>
                        📸 {ncCountdown > 0 ? ncCountdown : "Take selfie"}
                      </button>
                      <button className="btn-ghost" style={{flex:1,padding:12,fontSize:13,
                        borderColor:"rgba(212,160,48,.3)",color:"var(--gold2)"}}
                        onClick={()=>ncFileRef.current?.click()}>
                        🖼️ Upload memory
                      </button>
                    </div>

                    <div style={{display:"flex",gap:8}}>
                      <button className="btn-ghost" style={{flex:1,fontSize:11}} onClick={()=>{
                        ncStreamRef.current?.getTracks().forEach(t=>t.stop());
                        ncStreamRef.current=null;
                        setNcStep(2);
                      }}>← Back</button>
                      <button className="btn-ghost" style={{flex:1,fontSize:11}}
                        onClick={()=>{
                          ncStreamRef.current?.getTracks().forEach(t=>t.stop());
                          ncStreamRef.current=null;
                          setNcStep(4);
                        }}>
                        Skip photo →
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="nc-step-icon">✨</div>
                    <div className="nc-step-title">Perfect</div>
                    <div className="nc-camera" style={{borderRadius:12,border:"2px solid rgba(212,160,48,.25)"}}>
                      <img src={ncPhoto} alt="Tonight's memory" />
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="btn-ghost" style={{flex:1}} onClick={()=>{
                        setNcPhoto(null);
                        navigator.mediaDevices?.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}}})
                          .then(stream => {
                            ncStreamRef.current = stream;
                            if(ncVideoRef.current) ncVideoRef.current.srcObject = stream;
                          }).catch(()=>{});
                      }}>📸 Retake</button>
                      <button className="btn-ghost" style={{flex:1}} onClick={()=>{
                        setNcPhoto(null);
                        ncFileRef.current?.click();
                      }}>🖼️ Different photo</button>
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
                          border:`1px solid ${m.occasion?"rgba(212,160,48,.25)":"rgba(160,120,255,.2)"}`,
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
