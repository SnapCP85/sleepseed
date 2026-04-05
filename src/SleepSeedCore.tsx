import React, { useState, useRef, useCallback, useEffect } from "react";
import SleepSeedLibrary from "./sleepseed-library";
import { buildStoryPrompt } from "./sleepseed-prompts";
import { StoryFeedback, RereadCheck } from "./StoryFeedback";
import NightCardComponent from "./features/nightcards/NightCard";
import NightCardShareSheet from "./components/NightCardShareSheet";
import { saveStory as dbSaveStory, saveNightCard as dbSaveNightCard, ensureRefCode } from "./lib/storage";
import { BASE_URL } from "./lib/config";
import { supabase } from "./lib/supabase";
import { getSceneByVibe } from "./lib/storyScenes";
import type { HatchedCreature } from "./lib/types";
import { getDreamKeeperById, V1_DREAMKEEPERS } from "./lib/dreamkeepers";
import StoryCard from "./components/StoryCard";
import { shareStoryCardForInstagram } from "./lib/shareUtils";

const FONTS = ``; // fonts loaded via index.html <link>

const CSS = `
${FONTS}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --night:#060912;--night-mid:#0D1120;--night-card:#0f1525;--night-raised:#141a2e;
  --amber:#F5B84C;--amber-deep:#E8972A;--amber-glow:rgba(245,184,76,0.18);--amber-glow2:rgba(245,184,76,0.08);
  --cream:#F4EFE8;--cream-dim:rgba(244,239,232,0.60);--cream-faint:rgba(244,239,232,0.25);--cream-ghost:rgba(244,239,232,0.10);
  --teal:#14d890;--purple:#9482ff;
  --serif:'Fraunces',Georgia,serif;--sans:'Nunito',system-ui,sans-serif;
  --hand:'Patrick Hand',cursive;--kalam:'Kalam',cursive;--cta:'Baloo 2',system-ui,sans-serif;
  --gold:#d4a030;--gold2:#f0cc60;--gold3:#fae9a8;
  --parch:#f5e8c0;--ink:#261600;--ink2:#5a380a;--ink3:#8a5a1a;
  --dim:#6070a0;--dimmer:#3a4878;--green2:#4cc890;
}
body{background:var(--night);font-family:var(--sans);color:var(--cream);min-height:100vh;overflow-x:hidden}
.stars{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.star{position:absolute;border-radius:50%;background:#fff;animation:twinkle var(--d) ease-in-out infinite var(--dl)}
@keyframes twinkle{0%,100%{opacity:var(--lo)}50%{opacity:var(--hi);transform:scale(1.4)}}
.moon{position:fixed;top:40px;right:56px;z-index:1;width:68px;height:68px;border-radius:50%;
  background:radial-gradient(circle at 34% 32%,#fdf0c0,#e2c050,#b07818);
  box-shadow:0 0 40px 12px rgba(210,170,50,.2);animation:mfloat 9s ease-in-out infinite}
@keyframes mfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.app{position:relative;z-index:2;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:16px 16px 20px;max-width:640px;margin:0 auto}
.screen{width:100%;max-width:640px;animation:fup .5s cubic-bezier(.16,1,.3,1) both}
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
.pbar{height:6px;background:rgba(244,239,232,.08);border-radius:99px;overflow:hidden;margin-bottom:5px}
.pfill{height:100%;background:linear-gradient(90deg,#E8972A,#F5B84C);border-radius:99px;transition:width .6s ease}
.plabel{font-size:11px;color:var(--dim);font-weight:700;text-align:right;margin-bottom:14px}
.pstep{display:flex;align-items:center;gap:9px;font-size:13px;color:rgba(244,239,232,.35);padding:3px 0;transition:color .3s;font-family:'Fraunces',serif}
.pstep.active{color:#F5B84C;font-weight:700}
.pstep.done{color:#14d890}
.pstep-dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex-shrink:0}
.img-dot{width:26px;height:26px;border-radius:7px;border:1.5px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;font-size:11px;transition:all .4s}
.img-dot.busy{border-color:rgba(212,160,48,.4);animation:dotPulse .8s ease-in-out infinite}
.img-dot.done{border-color:rgba(76,200,144,.6);background:rgba(76,200,144,.12)}
@keyframes dotPulse{0%,100%{opacity:.5}50%{opacity:1}}
.err-box{background:rgba(192,64,48,.14);border:1px solid rgba(192,64,48,.28);border-radius:10px;padding:10px 14px;font-size:13px;color:#f09080;margin-bottom:14px}
.book-shell{width:100%;max-width:500px;position:relative;animation:fup .4s cubic-bezier(.16,1,.3,1) both}
.book-3d{border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.7);
  height:calc(var(--vh,1vh) * 58);max-height:520px;position:relative;background:#0e1428;cursor:pointer}
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
/* ── Story toolbar ── */
.rd-toolbar{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:8px;position:relative}
.rd-audio-btn{height:40px;padding:0 16px;border-radius:20px;border:1.5px solid rgba(212,160,48,.35);background:rgba(212,160,48,.1);color:var(--gold2);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;backdrop-filter:blur(10px);transition:all .2s;font-family:'Nunito',sans-serif}
.rd-audio-btn:hover{background:rgba(212,160,48,.18);border-color:rgba(212,160,48,.5)}
.rd-audio-btn.active{background:rgba(212,160,48,.22);border-color:var(--gold2);box-shadow:0 0 12px rgba(212,160,48,.2)}
.rd-menu-btn{height:40px;padding:0 16px;border-radius:20px;border:1.5px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:rgba(255,255,255,.6);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;backdrop-filter:blur(10px);transition:all .2s;font-family:'Nunito',sans-serif}
.rd-menu-btn:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.25);color:var(--cream)}
.rd-menu-btn.open{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25);color:var(--cream)}
.rd-expanded{position:absolute;bottom:48px;right:0;background:rgba(6,11,24,.97);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:8px;display:flex;flex-direction:column;gap:4px;min-width:180px;backdrop-filter:blur(16px);animation:fup .2s ease;box-shadow:0 12px 40px rgba(0,0,0,.6);z-index:20}
.rd-exp-btn{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:8px;border:none;background:transparent;color:rgba(244,239,232,.6);font-size:12px;font-weight:600;cursor:pointer;font-family:'Nunito',sans-serif;transition:all .15s;white-space:nowrap}
.rd-exp-btn:hover{background:rgba(255,255,255,.06);color:var(--cream)}
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

/* ── NO SCREEN BEDTIME MODE ── */
.no-screen-overlay{position:fixed;inset:0;z-index:50;background:linear-gradient(160deg,#020408,#030610);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;cursor:pointer;animation:fup .5s ease}
.no-screen-moon{font-size:52px;animation:mfloat 5s ease-in-out infinite,gAGen 5s ease-in-out infinite}
.no-screen-title{font-family:'Fraunces',serif;font-size:14px;font-style:italic;color:rgba(245,184,76,.65);text-align:center;line-height:1.6}
.no-screen-dots{display:flex;gap:8px;align-items:center}
.no-screen-dot{width:6px;height:6px;border-radius:50%;background:rgba(245,184,76,.35);animation:nsDotPulse 1.8s ease-in-out infinite}
.no-screen-dot:nth-child(2){animation-delay:.3s}
.no-screen-dot:nth-child(3){animation-delay:.6s}
@keyframes nsDotPulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
.no-screen-tap{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.2);text-align:center;margin-top:8px}

/* ── GENERATION SCREEN MAGIC ── */
@keyframes genAuAmber{0%,100%{opacity:.06;transform:translateX(-50%) scale(1)}50%{opacity:.2;transform:translateX(-50%) scale(1.1)}}
@keyframes genAuGreen{0%,100%{opacity:.08;transform:translateX(-50%) scale(1)}50%{opacity:.22;transform:translateX(-50%) scale(1.12)}}
@keyframes genGlowAmber{0%,100%{filter:drop-shadow(0 0 12px rgba(245,184,76,.5))}50%{filter:drop-shadow(0 0 36px rgba(245,184,76,.95))}}
@keyframes genGlowGreen{0%,100%{filter:drop-shadow(0 0 14px rgba(20,216,144,.5))}50%{filter:drop-shadow(0 0 42px rgba(20,216,144,.9))}}
@keyframes genGlowTeal{0%,100%{filter:drop-shadow(0 0 14px rgba(20,216,144,.5))}50%{filter:drop-shadow(0 0 44px rgba(20,216,144,.95))}}
@keyframes genFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes genReadyExcite{0%,100%{filter:drop-shadow(0 0 20px rgba(20,216,144,.7));transform:translateY(0) scale(1)}30%{transform:translateY(-12px) scale(1.08)}50%{filter:drop-shadow(0 0 60px rgba(20,216,144,1));transform:translateY(-14px) scale(1.1)}}
@keyframes genBubbleIn{0%{opacity:0;transform:scale(.88) translateY(4px)}60%{transform:scale(1.04)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes genReactionIn{0%{opacity:0;transform:scale(.85)}60%{transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}
@keyframes genThoughtIn{0%{opacity:0;transform:translateX(-10px) scale(.95)}100%{opacity:1;transform:translateX(0) scale(1)}}
@keyframes genThinkDot{0%,80%,100%{opacity:.3;transform:scale(.7)}40%{opacity:1;transform:scale(1.2)}}
@keyframes genPortalPulse{0%,100%{box-shadow:0 0 0 2px rgba(245,184,76,.18),0 0 28px rgba(245,184,76,.07)}50%{box-shadow:0 0 0 2px rgba(245,184,76,.38),0 0 48px rgba(245,184,76,.16)}}
@keyframes genPortalPulseTeal{0%,100%{box-shadow:0 0 0 2.5px rgba(20,216,144,.28),0 0 40px rgba(20,216,144,.12)}50%{box-shadow:0 0 0 2.5px rgba(20,216,144,.5),0 0 60px rgba(20,216,144,.22)}}
@keyframes genRingRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes genRingRev{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
@keyframes genMoonBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes genCloudDrift{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}
@keyframes genCreatureWalk{0%{transform:translateX(-48px) scaleX(1)}49%{transform:translateX(48px) scaleX(1)}50%{transform:translateX(48px) scaleX(-1)}99%{transform:translateX(-48px) scaleX(-1)}100%{transform:translateX(-48px) scaleX(1)}}
@keyframes genGrassWave{0%,100%{transform:scaleY(1) rotate(0deg)}50%{transform:scaleY(.82) rotate(2deg)}}
@keyframes genPortalStarTw{0%,100%{opacity:.15}50%{opacity:.85}}
@keyframes genAutoAdvance{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:translateY(0)}}
.gen-cz{display:flex;flex-direction:column;align-items:center;position:relative;z-index:5;margin-bottom:4px}
.gen-aura{position:absolute;width:160px;height:160px;border-radius:50%;top:-36px;left:50%;pointer-events:none}
.gen-aura.amber{background:radial-gradient(circle,rgba(245,184,76,.08),transparent 70%);animation:genAuAmber 6s ease-in-out infinite}
.gen-aura.green{background:radial-gradient(circle,rgba(20,216,144,.1),transparent 70%);animation:genAuGreen 6s ease-in-out infinite}
.gen-aura.teal{background:radial-gradient(circle,rgba(20,216,144,.12),transparent 70%);animation:genAuGreen 5s ease-in-out infinite}
.gen-creature-emo{display:inline-block;position:relative;z-index:2;font-size:58px;animation:genFloat 5s ease-in-out infinite,genGlowAmber 5s ease-in-out infinite}
.gen-creature-emo.react{animation:genFloat 5s ease-in-out infinite,genGlowGreen 5s ease-in-out infinite}
.gen-creature-emo.ready{animation:genReadyExcite 2s ease-in-out 3,genFloat 5s ease-in-out 6s infinite,genGlowTeal 5s ease-in-out 6s infinite}
.gen-creature-nm{font-family:'Fraunces',serif;font-size:12px;font-weight:700;letter-spacing:.02em;position:relative;z-index:2;margin-top:2px}
.gen-creature-nm.amber{color:rgba(245,184,76,.78)}
.gen-creature-nm.react{color:rgba(20,216,144,.78)}
.gen-creature-nm.ready{color:rgba(20,216,144,.8)}
.gen-bub{background:rgba(12,18,48,.92);border:1px solid rgba(245,184,76,.2);border-radius:18px 18px 18px 4px;padding:8px 13px;max-width:230px;position:relative;z-index:5;margin-bottom:8px;animation:genBubbleIn .35s cubic-bezier(.16,1,.3,1) both}
.gen-bub::before{content:'';position:absolute;bottom:-7px;left:14px;width:12px;height:7px;background:rgba(12,18,48,.92);clip-path:polygon(0 0,100% 0,0 100%);border-left:1px solid rgba(245,184,76,.2)}
.gen-bub-txt{font-family:'Fraunces',serif;font-size:11.5px;font-style:italic;color:rgba(245,184,76,.9);line-height:1.6;text-align:center}
.gen-bub-txt em{color:#f5e8c8;font-style:normal;font-weight:700}
.gen-bub.react{border-color:rgba(20,216,144,.28);background:rgba(8,14,28,.92);animation:genReactionIn .38s cubic-bezier(.16,1,.3,1) both}
.gen-bub.react::before{background:rgba(8,14,28,.92);border-left-color:rgba(20,216,144,.28)}
.gen-bub.react .gen-bub-txt{color:rgba(20,216,144,.85)}
.gen-bub.ready{border-color:rgba(20,216,144,.35);background:rgba(6,12,24,.92);animation:genReactionIn .38s cubic-bezier(.16,1,.3,1) both}
.gen-bub.ready .gen-bub-txt{color:rgba(20,216,144,.88)}
.gen-portal-wrap{position:relative;z-index:5;display:flex;flex-direction:column;align-items:center;margin-bottom:6px}
.gen-portal-eyebrow{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.12em;text-transform:uppercase;color:rgba(245,184,76,.35);margin-bottom:5px;display:flex;align-items:center;gap:6px;width:180px}
.gen-portal-eyebrow::before,.gen-portal-eyebrow::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(245,184,76,.2),transparent)}
.gen-portal-eyebrow.teal{color:rgba(20,216,144,.45)}
.gen-portal{width:148px;height:148px;border-radius:50%;overflow:hidden;position:relative;background:radial-gradient(circle at 42% 35%,#0e1530 0%,#090e1e 45%,#060912 100%);animation:genPortalPulse 4.5s ease-in-out infinite;flex-shrink:0}
.gen-portal.ready{animation:genPortalPulseTeal 2.8s ease-in-out infinite}
.gen-portal-ring{position:absolute;inset:-2.5px;border-radius:50%;border:1.5px solid transparent;border-top-color:rgba(245,184,76,.55);border-right-color:rgba(245,184,76,.18);animation:genRingRotate 7s linear infinite;pointer-events:none;z-index:12}
.gen-portal-ring.teal{border-top-color:rgba(20,216,144,.55);border-right-color:rgba(20,216,144,.18);animation-duration:5s}
.gen-portal-ring2{position:absolute;inset:-5px;border-radius:50%;border:1px solid transparent;border-bottom-color:rgba(245,184,76,.2);border-left-color:rgba(245,184,76,.08);animation:genRingRev 12s linear infinite;pointer-events:none;z-index:12}
.gen-portal-ring2.teal{border-bottom-color:rgba(20,216,144,.2);border-left-color:rgba(20,216,144,.08)}
.gen-portal-sky{position:absolute;inset:0;overflow:hidden;border-radius:50%}
.gen-portal-moon{position:absolute;border-radius:50%;background:radial-gradient(circle at 36% 34%,#F5B84C,#E8972A);box-shadow:0 0 14px rgba(245,184,76,.55),0 0 30px rgba(245,184,76,.2);width:24px;height:24px;top:16px;right:28px;animation:genMoonBob 5s ease-in-out infinite}
.gen-portal-moon::after{content:'';position:absolute;border-radius:50%;background:#090e1e;top:-20%;left:-22%;width:88%;height:88%}
.gen-portal-ground{position:absolute;bottom:0;left:0;right:0;height:46px;background:linear-gradient(0deg,#0a0e1c 0%,#0f1628 40%,rgba(245,184,76,.08) 100%);border-radius:0 0 50% 50%}
.gen-portal-grass{position:absolute;bottom:44px;left:0;right:0;display:flex;justify-content:space-around;padding:0 12px}
.gen-gblade{width:2px;border-radius:2px 2px 0 0;background:linear-gradient(0deg,rgba(245,184,76,.15),rgba(245,184,76,.5));transform-origin:bottom center;animation:genGrassWave var(--gd) var(--gl) ease-in-out infinite}
.gen-portal-creature{position:absolute;bottom:46px;z-index:4;line-height:1;animation:genCreatureWalk 7s linear infinite;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))}
.gen-portal-cloud{position:absolute;opacity:.22;line-height:1;color:rgba(244,239,232,.6);animation:genCloudDrift var(--cd) var(--cdl) ease-in-out infinite alternate}
.gen-portal-vignette{position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 40px rgba(6,9,18,.8);pointer-events:none;z-index:10}
.gen-portal-title{position:absolute;bottom:5px;left:0;right:0;font-family:'Fraunces',serif;font-style:italic;color:rgba(245,184,76,.58);text-align:center;z-index:8;text-shadow:0 1px 6px rgba(0,0,0,.7);line-height:1;font-size:8px}
.gen-portal-title.teal{color:rgba(20,216,144,.58)}
.gen-thoughts{width:100%;display:flex;flex-direction:column;gap:5px;position:relative;z-index:5;margin-bottom:8px}
.gen-thought{display:flex;align-items:flex-start;gap:7px;padding:7px 10px;border-radius:11px;background:rgba(244,239,232,.03);border:1px solid rgba(244,239,232,.07);position:relative;overflow:hidden;animation:genThoughtIn var(--ti) var(--td) cubic-bezier(.16,1,.3,1) both}
.gen-thought.active{border-color:rgba(245,184,76,.18);background:rgba(245,184,76,.05)}
.gen-thought-ico{font-size:13px;flex-shrink:0;margin-top:1px;line-height:1}
.gen-thought-txt{font-family:'Fraunces',serif;font-size:10.5px;font-style:italic;color:rgba(244,239,232,.4);line-height:1.55;flex:1}
.gen-thought-txt em{color:rgba(245,184,76,.8);font-style:normal;font-weight:700}
.gen-thought-txt .done{color:rgba(20,216,144,.7);font-style:normal}
.gen-thought.active .gen-thought-txt{color:rgba(244,239,232,.65)}
.gen-think-dots{display:flex;gap:3px;align-items:center;margin-top:4px}
.gen-think-dot{width:4px;height:4px;border-radius:50%;background:rgba(245,184,76,.4)}
.gen-think-dot:nth-child(1){animation:genThinkDot 1.4s 0s ease-in-out infinite}
.gen-think-dot:nth-child(2){animation:genThinkDot 1.4s .22s ease-in-out infinite}
.gen-think-dot:nth-child(3){animation:genThinkDot 1.4s .44s ease-in-out infinite}
.gen-auto-advance{font-family:'Kalam',cursive;font-size:12px;color:rgba(20,216,144,.55);text-align:center;position:relative;z-index:5;animation:genAutoAdvance .6s ease .3s both}

/* ── FULL SCREEN BOOK ── */
.book-cover-full{position:relative;height:100%;overflow:hidden;cursor:pointer;background:#0a0f24}
.book-cover-gradient{position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(0deg,rgba(4,7,20,.98) 0%,rgba(4,7,20,.82) 40%,transparent 100%);z-index:2}
.book-cover-text{position:absolute;bottom:0;left:0;right:0;padding:22px 20px 28px;z-index:3;text-align:center}
.book-cover-btns{display:flex;gap:8px;margin-top:14px;margin-bottom:6px}
.book-cover-btn-read{flex:1;padding:13px 8px;border-radius:14px;border:none;background:linear-gradient(145deg,#7a4808,#F5B84C 48%,#7a4808);color:#050100;font-family:'Fraunces',serif;font-size:13px;font-weight:700;font-style:italic;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;box-shadow:0 6px 24px rgba(200,130,20,.45)}
.book-cover-btn-listen{flex:1;padding:13px 8px;border-radius:14px;border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.09);color:rgba(255,255,255,.85);font-family:'Fraunces',serif;font-size:13px;font-weight:700;font-style:italic;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;backdrop-filter:blur(8px)}
.book-cover-btn-ico{font-size:18px;line-height:1}
.book-menu-pill{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:20px;font-family:'DM Mono',monospace;font-size:8.5px;font-weight:700;letter-spacing:.04em;cursor:pointer;transition:all .2s}
.book-menu-pill.dark{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);color:rgba(255,255,255,.72)}
.book-menu-pill.dark:hover{background:rgba(255,255,255,.18);color:rgba(255,255,255,.9)}
.book-menu-pill.parch{background:rgba(90,56,10,.08);border:1px solid rgba(90,56,10,.22);color:rgba(90,56,10,.55)}
.book-menu-pill.parch:hover{background:rgba(90,56,10,.14);color:rgba(90,56,10,.8)}
.book-menu-pill-ico{font-size:11px;line-height:1}

/* ── STORY PAGE FULL ── */
.story-page-full{position:absolute;inset:0;width:100%;height:100%;max-height:700px;display:flex;flex-direction:column;overflow:hidden;animation:pageFade .3s ease both}
.story-page-full.warm{filter:sepia(38%) saturate(.8) hue-rotate(-18deg) brightness(.86)}
.story-illo-area{flex:0 0 55%;position:relative;overflow:hidden;background:linear-gradient(160deg,#e8ddb0,#d4c890)}
.story-illo-content{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.story-illo-fade{position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(0deg,#fef4e0,transparent)}
.story-text-area{flex:1;min-height:0;display:flex;flex-direction:column;padding:14px 18px 36px;background:linear-gradient(160deg,#fef8e8,#f5e8c0);overflow:hidden;position:relative}
.page-num-kalam{font-family:'Kalam',cursive;font-size:10px;color:rgba(90,56,10,.32);text-align:center;margin-bottom:8px;letter-spacing:.08em;flex-shrink:0}
.story-text-main{font-family:'Patrick Hand',cursive;font-size:clamp(19px,4vw,22px);color:var(--ink);line-height:1.85;flex:1;min-height:0;overflow:hidden}
.story-refrain-cg{font-family:'Cormorant Garamond',serif;font-size:12px;font-style:italic;font-weight:500;color:rgba(90,56,10,.45);text-align:center;padding:7px 0 0;border-top:1px solid rgba(90,56,10,.08);margin-top:8px;line-height:1.6;flex-shrink:0}
.page-nav-corners{position:absolute;bottom:10px;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:0 14px;pointer-events:none;z-index:8}
.page-nav-corner{font-family:'Kalam',cursive;font-size:11px;color:rgba(90,56,10,.32);display:flex;align-items:center;gap:3px}
.page-nav-corner-arr{font-size:13px}
.book-read-pill{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);z-index:15;display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:99px;background:rgba(245,184,76,.12);border:1.5px solid rgba(245,184,76,.3);cursor:pointer;backdrop-filter:blur(8px);white-space:nowrap;transition:all .2s;font-family:'Fraunces',serif;font-size:12px;font-style:italic;color:rgba(245,184,76,.9);font-weight:700}
.book-read-pill:hover{background:rgba(245,184,76,.2);border-color:rgba(245,184,76,.55)}
.book-read-pill.playing{background:rgba(245,184,76,.22);border-color:rgba(245,184,76,.65)}
.book-read-pill-ico{font-size:14px;line-height:1}
.book-reading-bar{position:absolute;top:0;left:0;right:0;height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;background:linear-gradient(180deg,rgba(250,240,210,.5) 0%,transparent 100%);z-index:10}
.book-page-info{font-family:'Kalam',cursive;font-size:10px;color:rgba(90,56,10,.4);font-style:italic}
.book-dots-row{display:flex;gap:4px;align-items:center}
.book-dot{width:5px;height:5px;border-radius:50%;background:rgba(90,56,10,.18);cursor:pointer;transition:all .2s;flex-shrink:0}
.book-dot.on{background:rgba(90,56,10,.45);transform:scale(1.35)}
.book-ctrl-sheet{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(175deg,#080b20,#06091a);border-radius:18px 18px 0 0;border-top:1px solid rgba(245,184,76,.14);padding:12px 16px 24px;z-index:20;animation:sheetUp .22s cubic-bezier(.22,.68,0,1.2)}
.book-ctrl-handle{width:30px;height:3px;border-radius:2px;background:rgba(255,255,255,.14);margin:0 auto 12px}
.book-ctrl-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}
.book-ctrl-btn{display:flex;align-items:center;gap:5px;padding:8px 12px;border-radius:10px;font-family:'Nunito',sans-serif;font-size:11.5px;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .2s;flex-shrink:0}
.bctrl-warm{background:rgba(255,140,60,.08);border-color:rgba(255,140,60,.22);color:rgba(255,180,100,.85)}
.bctrl-warm.on{background:rgba(255,140,60,.2);border-color:rgba(255,140,60,.55)}
.bctrl-noscreen{background:rgba(20,216,144,.07);border-color:rgba(20,216,144,.2);color:rgba(20,216,144,.85)}
.bctrl-new{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1);color:rgba(255,255,255,.4)}

/* ── END CEREMONY ── */
.end-ceremony{min-height:100%;background:radial-gradient(ellipse 100% 60% at 50% 10%,#0d1840 0%,#050a18 45%,#020508 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 22px;position:relative;overflow:hidden}
.end-cover-ghost{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:200px;opacity:.04;pointer-events:none}
.end-moon-big{font-size:52px;animation:mfloat 6s ease-in-out infinite,gAGen 6s ease-in-out infinite;margin-bottom:16px}
.end-the-end{font-family:'Fraunces',serif;font-size:36px;font-weight:900;font-style:italic;color:#fae9a8;animation:endFadeIn .8s ease both;margin-bottom:4px;text-shadow:0 0 40px rgba(245,184,76,.3)}
@keyframes endFadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
.end-sweet-dreams{font-family:'Kalam',cursive;font-size:15px;color:rgba(245,184,76,.65);animation:endFadeIn .8s ease .6s both;margin-bottom:18px}
.end-refrain-quote{font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;font-weight:500;color:rgba(240,220,160,.72);line-height:1.75;text-align:center;max-width:280px;animation:endFadeIn .8s ease 1.2s both;border-top:1px solid rgba(245,184,76,.12);border-bottom:1px solid rgba(245,184,76,.12);padding:12px 0;margin-bottom:28px}
.end-nc-cta{width:100%;max-width:280px;padding:16px;border:none;border-radius:18px;background:linear-gradient(145deg,#7a4808,#F5B84C 48%,#7a4808);color:#050100;font-family:'Fraunces',serif;font-size:16px;font-weight:700;font-style:italic;cursor:pointer;position:relative;overflow:hidden;box-shadow:0 10px 40px rgba(200,130,20,.45);animation:endFadeIn .8s ease 1.8s both}
.end-nc-cta::after{content:'';position:absolute;top:0;left:-130%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.15),transparent);animation:shimmerMove 3.5s ease-in-out infinite}
.end-skip-lnk{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.2);margin-top:12px;cursor:pointer;animation:endFadeIn .8s ease 2.2s both}

/* ── NIGHT CARD SINGLE PAGE ── */
.nc-single-page{min-height:100vh;max-height:700px;display:flex;flex-direction:column;background:linear-gradient(160deg,#080c24,#060918,#040714);padding:22px 18px 24px;position:relative;overflow:hidden}
.nc-creature-corner{position:absolute;top:16px;right:16px;font-size:28px;opacity:.6;animation:mfloat 5s ease-in-out infinite,gAGen 5s ease-in-out infinite}
.nc-single-label{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,184,76,.45);margin-bottom:14px;display:flex;align-items:center;gap:6px}
.nc-single-label::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(245,184,76,.2),transparent)}
.nc-single-q{font-family:'Fraunces',serif;font-size:22px;font-weight:700;font-style:italic;color:#f5e8c8;line-height:1.3;margin-bottom:6px}
.nc-single-who{font-family:'Kalam',cursive;font-size:12px;color:rgba(245,184,76,.55);margin-bottom:18px}
.nc-single-input{width:100%;padding:12px 14px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);border-radius:13px;color:#f5e8c8;font-family:'Kalam',cursive;font-size:15px;outline:none;transition:border-color .2s;resize:none;min-height:52px;line-height:1.6}
.nc-single-input::placeholder{color:rgba(245,184,76,.3)}
.nc-single-input:focus{border-color:rgba(245,184,76,.4)}
.nc-photo-choices{display:flex;gap:8px;margin-top:14px;margin-bottom:20px}
.nc-photo-choice{flex:1;padding:12px 10px;border-radius:13px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);transition:all .2s}
.nc-photo-choice:hover{border-color:rgba(245,184,76,.3);background:rgba(245,184,76,.05)}
.nc-photo-choice-ico{font-size:22px}
.nc-photo-choice-lbl{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.3)}
.nc-single-btn{width:100%;padding:15px;border:none;border-radius:16px;background:linear-gradient(145deg,#7a4808,#F5B84C 48%,#7a4808);color:#050100;font-family:'Fraunces',serif;font-size:16px;font-weight:700;font-style:italic;cursor:pointer;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(200,130,20,.4)}
.nc-single-btn::after{content:'';position:absolute;top:0;left:-130%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.15),transparent);animation:shimmerMove 3.5s ease-in-out infinite}
.nc-single-skip{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.18);text-align:center;margin-top:12px;cursor:pointer}

/* ── NIGHT CARD REVEAL ── */
.nc-reveal-card{background:linear-gradient(148deg,#0d1030,#12183c);border:1px solid rgba(245,184,76,.22);border-radius:20px;overflow:hidden;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.7),0 0 0 1px rgba(245,184,76,.08);animation:cardReveal .55s cubic-bezier(.16,1,.3,1) .1s both;margin-bottom:12px}
@keyframes cardReveal{from{opacity:0;transform:scale(.94) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
.nc-reveal-shimmer{position:absolute;inset:0;background:linear-gradient(105deg,transparent 0%,rgba(255,244,200,.04) 50%,transparent 100%);width:60%;animation:shimmerMove 4s ease-in-out infinite;pointer-events:none}
.nc-reveal-photo{height:145px;background:linear-gradient(160deg,#1a1240,#120c2c);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;border-bottom:1px solid rgba(245,184,76,.1)}
.nc-reveal-photo-overlay{position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,10,28,.6) 0%,transparent 50%)}
.nc-reveal-photo-date{position:absolute;bottom:8px;right:10px;font-family:'Kalam',cursive;font-size:9px;color:rgba(245,184,76,.5)}
.nc-reveal-body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:8px}
.nc-reveal-eyebrow{font-family:'DM Mono',monospace;font-size:7.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,184,76,.4);display:flex;align-items:center;gap:6px}
.nc-reveal-eyebrow::after{content:'';flex:1;height:1px;background:rgba(245,184,76,.1)}
.nc-reveal-headline{font-family:'Fraunces',serif;font-size:20px;font-weight:700;font-style:italic;color:#fae9a8;line-height:1.25}
.nc-reveal-rule{width:32px;height:1.5px;background:linear-gradient(90deg,rgba(245,184,76,.4),transparent);margin:2px 0}
.nc-reveal-quote{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;font-weight:500;color:rgba(240,210,160,.8);line-height:1.7}
.nc-reveal-memory{font-family:'Kalam',cursive;font-size:12px;color:rgba(200,180,255,.7);line-height:1.5}
.nc-reveal-reflect{background:rgba(160,120,255,.07);border:1px solid rgba(160,120,255,.18);border-radius:10px;padding:8px 10px}
.nc-reveal-reflect-lbl{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.1em;text-transform:uppercase;color:rgba(160,120,255,.5);margin-bottom:3px}
.nc-reveal-reflect-q{font-family:'Kalam',cursive;font-size:11px;color:rgba(200,180,255,.75);line-height:1.5}
.nc-reveal-footer{display:flex;align-items:center;justify-content:space-between;padding-top:6px}
.nc-reveal-brand{font-family:'Fraunces',serif;font-size:9px;color:rgba(245,184,76,.3)}
.nc-reveal-memnum{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.2)}
.nc-action-row{display:flex;gap:6px;margin-bottom:10px}
.nc-action-btn{flex:1;padding:11px 8px;border-radius:13px;font-family:'Fraunces',serif;font-size:11px;font-style:italic;font-weight:700;cursor:pointer;border:1.5px solid;text-align:center;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:3px}
.nc-action-btn:hover{transform:translateY(-1px)}
.nc-btn-share{background:rgba(245,184,76,.08);border-color:rgba(245,184,76,.22);color:rgba(245,184,76,.82)}
.nc-btn-done{background:rgba(20,216,144,.08);border-color:rgba(20,216,144,.22);color:rgba(20,216,144,.82)}
.nc-rating-strip{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px}
.nc-rating-lbl{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.2)}
.nc-stars-row{display:flex;gap:4px}
.nc-star-btn{font-size:18px;cursor:pointer;opacity:.28;transition:opacity .15s,transform .15s;background:none;border:none;color:var(--gold2)}
.nc-star-btn.lit{opacity:1}
.nc-star-btn:hover{transform:scale(1.15)}
.nc-library-row{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 13px}
.nc-library-txt{font-family:'Fraunces',serif;font-size:11px;font-style:italic;color:rgba(255,255,255,.45);line-height:1.4}
.nc-toggle{width:36px;height:20px;border-radius:99px;background:rgba(255,255,255,.1);border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
.nc-toggle.on{background:rgba(20,216,144,.3)}
.nc-toggle-thumb{position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:white;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .2s;pointer-events:none}
.nc-toggle.on .nc-toggle-thumb{left:19px}

/* ════════════════════════════════════════════════════════
   NEW READER DESIGN SYSTEM
   ════════════════════════════════════════════════════════ */
@keyframes ssSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes ssFadeIn{from{opacity:0}to{opacity:1}}
@keyframes ssFloat{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-10px) rotate(5deg)}}
@keyframes ssSparkle{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(0)}}
@keyframes ssDotPop{0%{transform:scale(0.7)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes ssStepIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes ssStepOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-20px)}}
@keyframes ssOrbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes ssCardReveal{from{opacity:0;transform:scale(0.72) rotate(-3deg)}to{opacity:1;transform:scale(1) rotate(0deg)}}
@keyframes ssBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}

/* Reader shell */
.ss-reader{position:fixed;inset:0;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;overflow:hidden;z-index:50}
.ss-pbar{position:absolute;top:0;left:0;height:3px;z-index:30;background:linear-gradient(90deg,#E8972A,#F5B84C);transition:width 0.5s cubic-bezier(0.4,0,0.2,1);border-radius:0 2px 2px 0}
.ss-top{display:none}
.ss-top>*{pointer-events:auto}
.ss-top-logo{font-family:var(--serif);font-size:14px;font-weight:700;color:var(--cream);display:flex;align-items:center;gap:6px;cursor:pointer;opacity:.8}
.ss-top-moon{width:13px;height:13px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#F5C060,#C87020)}
.ss-top-btn{width:36px;height:36px;border-radius:50%;border:1px solid rgba(244,239,232,.14);background:rgba(6,9,18,.5);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cream-faint);font-size:16px;transition:all .18s;-webkit-tap-highlight-color:transparent}
.ss-bot{position:absolute;bottom:0;left:0;right:0;z-index:25;padding:10px 20px max(20px,env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:space-between;gap:12px;pointer-events:none}
.ss-bot>*{pointer-events:auto}
.ss-arrow{width:44px;height:44px;border-radius:50%;border:1px solid rgba(244,239,232,.13);background:rgba(6,9,18,.5);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cream);font-size:18px;transition:all .18s;flex-shrink:0;-webkit-tap-highlight-color:transparent}
.ss-arrow:disabled{opacity:.18;cursor:default}
.ss-dots-wrap{display:flex;gap:6px;align-items:center;justify-content:center;flex:1;min-width:0;overflow:hidden}
.ss-dot2{width:6px;height:6px;border-radius:50%;background:var(--cream-faint);cursor:pointer;transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);flex-shrink:0}
.ss-dot2.active{width:18px;border-radius:9px;background:var(--amber);animation:ssDotPop .3s ease}
.ss-track{display:flex;height:100%;transition:transform 0.42s cubic-bezier(0.4,0,0.2,1);will-change:transform}
.ss-page{width:100%;height:100dvh;flex-shrink:0;overflow:hidden;position:relative}
.ss-tap{position:absolute;z-index:5;top:70px;bottom:80px}
.ss-tap-l{left:0;width:30%}
.ss-tap-r{right:0;width:30%}
.ss-sparkle{position:absolute;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:40;animation:ssSparkle 0.7s ease-out forwards}

/* Cover */
.ss-cover{display:flex;flex-direction:column;height:100dvh;overflow:hidden;background:var(--night)}
.ss-cover-scene{position:absolute;inset:0;z-index:0}
.ss-cover-vig{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 30%,rgba(6,9,18,0.6));z-index:1}
.ss-cover-grad{position:absolute;bottom:0;left:0;right:0;height:65%;background:linear-gradient(to top,#060912 35%,transparent);z-index:2}
.ss-cover-text{position:absolute;bottom:0;left:0;right:0;z-index:3;padding:0 28px 108px;text-align:center}
.ss-cover-stars{font-size:10px;color:var(--amber);letter-spacing:10px;margin-bottom:10px;opacity:.7}
.ss-cover-title{font-family:var(--serif);font-weight:700;font-size:clamp(26px,7.5vw,38px);color:var(--cream);line-height:1.15;margin-bottom:10px}
.ss-cover-for{font-family:var(--sans);font-size:14px;color:var(--cream-dim)}
.ss-cover-for b{color:var(--amber);font-weight:700}
.ss-cover-brand{font-family:var(--serif);font-size:10px;color:var(--cream-faint);text-transform:uppercase;letter-spacing:.15em;margin-top:14px}

/* Cast */
.ss-cast{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100dvh;overflow:hidden;background:var(--night-mid);padding:40px 28px}
.ss-cast-eyebrow{font-family:var(--sans);font-size:10px;font-weight:800;color:var(--amber);letter-spacing:.18em;text-transform:uppercase;margin-bottom:14px}
.ss-cast-h{font-family:var(--serif);font-size:clamp(20px,5vw,26px);font-weight:600;text-align:center;line-height:1.35;margin-bottom:32px}
.ss-cast-grid{display:flex;flex-wrap:wrap;gap:32px;justify-content:center}
.ss-cast-char{display:flex;flex-direction:column;align-items:center;gap:8px}
.ss-cast-av{width:76px;height:76px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:32px;border:2px solid rgba(244,239,232,.12);background:var(--night-raised)}
.ss-cast-av.hero{border-color:var(--amber);box-shadow:0 0 24px rgba(245,184,76,.2)}
.ss-cast-av img{width:100%;height:100%;object-fit:cover}
.ss-cast-name{font-family:var(--serif);font-size:16px;font-weight:600;color:var(--cream);text-align:center;max-width:90px}
.ss-cast-role{font-family:var(--sans);font-size:9px;font-weight:800;text-transform:uppercase;color:var(--cream-faint);letter-spacing:.08em}
.ss-cast-type{font-family:var(--sans);font-size:11px;color:var(--cream-faint)}

/* Story page */
.ss-sp{display:flex;flex-direction:column;height:100dvh;overflow:hidden}
.ss-sp.warm{filter:sepia(38%) saturate(.8) hue-rotate(-18deg) brightness(.86)}
.ss-sp-scene{width:100%;aspect-ratio:400/190;max-height:42%;flex-shrink:0;position:relative;overflow:hidden}
.ss-sp-fade{position:absolute;bottom:0;left:0;right:0;height:56px;background:linear-gradient(to top,var(--night),transparent);z-index:1}
.ss-sp-body{flex:1;display:flex;flex-direction:column;padding:16px 28px 0;overflow:hidden}
.ss-sp-pgnum{font-family:var(--kalam);font-weight:300;font-size:12px;color:rgba(245,184,76,.55);text-align:center;margin-bottom:12px;flex-shrink:0}
.ss-sp-text{font-family:var(--hand);font-size:clamp(17px,4.5vw,21px);line-height:1.75;color:var(--cream);flex:1;overflow:hidden}
.ss-sp-refrain{font-family:var(--kalam);font-weight:300;font-size:14px;font-style:italic;color:rgba(245,184,76,.7);text-align:center;padding-top:14px;border-top:1px solid rgba(245,184,76,.12);flex-shrink:0;margin-top:14px}

/* End page */
.ss-end{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100dvh;background:var(--night);padding:60px 32px max(120px,calc(env(safe-area-inset-bottom) + 90px));text-align:center;overflow:hidden}
.ss-end-moon{font-size:54px;animation:ssFloat 5s ease-in-out infinite;filter:drop-shadow(0 0 20px rgba(245,184,76,.3));margin-bottom:20px}
.ss-end-title{font-family:var(--serif);font-weight:400;font-style:italic;font-size:34px;color:var(--amber);margin-bottom:16px}
.ss-end-refrain{font-family:var(--kalam);font-weight:300;font-size:15px;font-style:italic;color:var(--cream-dim);line-height:1.7;max-width:280px;margin-bottom:16px}
.ss-end-msg{font-family:var(--sans);font-size:15px;color:var(--cream-dim);line-height:1.75;margin-bottom:28px}
.ss-end-btns{display:flex;flex-direction:column;gap:12px;width:100%;max-width:290px}
.ss-amber-btn{width:100%;padding:16px;border:none;border-radius:16px;background:linear-gradient(145deg,#7a4808,#F5B84C 48%,#7a4808);color:#050100;font-family:var(--serif);font-size:16px;font-weight:700;font-style:italic;cursor:pointer;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(200,130,20,.4);transition:all .18s}
.ss-amber-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.ss-ghost-btn{padding:13px 20px;border-radius:14px;border:1.5px solid rgba(244,239,232,.14);background:rgba(244,239,232,.04);color:var(--cream-dim);font-family:var(--sans);font-size:14px;font-weight:600;cursor:pointer;transition:all .18s;text-align:center;width:100%}
.ss-ghost-btn:hover{border-color:rgba(244,239,232,.25);color:var(--cream)}

/* Controls sheet */
.ss-sheet-bg{position:fixed;inset:0;background:rgba(6,9,18,.72);backdrop-filter:blur(4px);z-index:100;animation:ssFadeIn .15s ease}
.ss-sheet{position:fixed;bottom:0;left:0;right:0;z-index:101;background:var(--night-card);border-radius:26px 26px 0 0;max-height:88dvh;display:flex;flex-direction:column;animation:ssSlideUp .25s cubic-bezier(0.22,0.68,0,1.2)}
.ss-sheet-handle{width:38px;height:4px;border-radius:2px;background:rgba(244,239,232,.18);margin:14px auto}
.ss-sheet-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 0 max(28px,env(safe-area-inset-bottom))}
.ss-sheet-section{padding:6px 0}
.ss-sheet-sep{height:6px;background:rgba(244,239,232,.04)}
.ss-sheet-row{display:flex;align-items:center;gap:14px;padding:10px 20px;cursor:pointer;transition:background .12s;-webkit-tap-highlight-color:transparent}
.ss-sheet-row:active{background:rgba(244,239,232,.04)}
.ss-sheet-ico{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.ss-sheet-body{flex:1;min-width:0}
.ss-sheet-label{font-family:var(--sans);font-size:14px;font-weight:700;color:var(--cream)}
.ss-sheet-sub{font-family:var(--sans);font-size:11px;color:var(--cream-dim);margin-top:1px}
.ss-sheet-toggle{width:46px;height:27px;border-radius:14px;background:rgba(244,239,232,.14);border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
.ss-sheet-toggle.on{background:var(--amber)}
.ss-sheet-knob{position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,.25);transition:left 0.25s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none}
.ss-sheet-toggle.on .ss-sheet-knob{left:22px}
.ss-sheet-chevron{color:var(--cream-faint);font-size:16px;flex-shrink:0}

/* Night card overlay */
.ss-nc{position:fixed;inset:0;z-index:200;background:var(--night);overflow:hidden}
.ss-nc-star{position:absolute;border-radius:50%;background:white;animation:twinkle var(--d) ease-in-out infinite var(--dl)}
.ss-nc-dots{position:absolute;top:max(22px,env(safe-area-inset-top));left:0;right:0;z-index:5;display:flex;gap:8px;justify-content:center}
.ss-nc-dot{width:6px;height:6px;border-radius:50%;background:rgba(244,239,232,.2);transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1)}
.ss-nc-dot.done{background:var(--amber)}
.ss-nc-dot.cur{width:18px;border-radius:9px;background:var(--amber)}
.ss-nc-step{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 28px max(40px,env(safe-area-inset-bottom));animation:ssStepIn .4s ease both;z-index:3}
.ss-nc-eyebrow{font-family:var(--sans);font-size:10px;font-weight:800;color:var(--amber);letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px}
.ss-nc-q{font-family:var(--serif);font-size:clamp(21px,5.5vw,28px);font-weight:600;text-align:center;line-height:1.35;margin-bottom:24px}
.ss-nc-ta{width:100%;max-width:380px;padding:14px 16px;border-radius:18px;border:1.5px solid rgba(244,239,232,.1);background:var(--night-raised);color:var(--cream);font-family:var(--hand);font-size:17px;outline:none;resize:none;min-height:100px;line-height:1.65;transition:border-color .2s}
.ss-nc-ta:focus{border-color:var(--amber)}
.ss-nc-ta::placeholder{color:var(--cream-faint)}
.ss-nc-cta{width:100%;max-width:380px;padding:16px;border:none;border-radius:16px;background:linear-gradient(145deg,#7a4808,#F5B84C 48%,#7a4808);color:#050100;font-family:var(--serif);font-size:16px;font-weight:700;font-style:italic;cursor:pointer;box-shadow:0 8px 32px rgba(200,130,20,.4);margin-top:20px;transition:all .18s}
.ss-nc-cta:hover{filter:brightness(1.1);transform:translateY(-1px)}
.ss-nc-skip{background:none;border:none;color:var(--cream-faint);font-size:12px;cursor:pointer;margin-top:14px;font-family:var(--sans)}
.ss-nc-photo-zone{width:150px;height:150px;border-radius:22px;border:2px dashed rgba(245,184,76,.35);background:var(--night-raised);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;margin:0 auto 20px;transition:border-color .18s}
.ss-nc-photo-zone:hover{border-color:var(--amber)}
.ss-nc-orb{width:100px;height:100px;border-radius:50%;background:radial-gradient(circle at 40% 40%,rgba(245,184,76,.3),rgba(148,130,255,.2));border:2px solid rgba(245,184,76,.25);display:flex;align-items:center;justify-content:center;font-size:44px;animation:ssOrbPulse 2s ease-in-out infinite;margin-bottom:16px}
.ss-nc-bounce-dots{display:flex;gap:6px;margin-top:12px}
.ss-nc-bounce-dot{width:6px;height:6px;border-radius:50%;background:var(--amber)}
.ss-nc-bounce-dot:nth-child(1){animation:ssBounce 1.4s 0s ease-in-out infinite}
.ss-nc-bounce-dot:nth-child(2){animation:ssBounce 1.4s .2s ease-in-out infinite}
.ss-nc-bounce-dot:nth-child(3){animation:ssBounce 1.4s .4s ease-in-out infinite}
.ss-nc-reveal{animation:ssCardReveal 0.9s cubic-bezier(0.34,1.56,0.64,1) both;margin-bottom:20px}
.ss-nc-row{display:flex;gap:10px;width:100%;max-width:380px}
.ss-nc-row .ss-ghost-btn{flex:1}

/* No-screen overlay */
.ss-noscreen{position:fixed;inset:0;z-index:60;background:rgba(6,9,18,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;cursor:pointer;animation:ssFadeIn .3s ease}
.ss-noscreen-moon{font-size:52px;animation:ssFloat 5s ease-in-out infinite;filter:drop-shadow(0 0 20px rgba(245,184,76,.3))}
.ss-noscreen-title{font-family:var(--sans);font-size:14px;color:var(--cream-dim);text-align:center;line-height:1.6}
.ss-noscreen-title em{font-family:var(--serif);font-size:17px;font-weight:700;color:rgba(245,184,76,.7);font-style:italic;display:block;margin-top:4px}
.ss-noscreen-tap{font-size:11px;color:var(--cream-faint);margin-top:20px}
@keyframes nc-fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes nc-fadeIn{from{opacity:0}to{opacity:1}}
@keyframes nc-shimmer{0%{transform:translateX(-130%)}100%{transform:translateX(230%)}}
@keyframes nc-floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes nc-writingDot{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
@keyframes nc-cardReveal{from{transform:translateY(40px) scale(.94);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
@keyframes nc-polaroid{0%{filter:brightness(2.5) saturate(0) contrast(.6);opacity:.3}30%{filter:brightness(1.6) saturate(.3) contrast(.8);opacity:.7}70%{filter:brightness(1.1) saturate(.8) contrast(.95);opacity:.95}100%{filter:brightness(1) saturate(1) contrast(1);opacity:1}}
@keyframes nc-micPulse{0%,100%{box-shadow:0 0 0 0 rgba(245,184,76,.45)}50%{box-shadow:0 0 0 8px rgba(245,184,76,0)}}
@keyframes v8r-moonPulse{0%,100%{box-shadow:0 0 4px rgba(245,184,76,.3)}50%{box-shadow:0 0 12px rgba(245,184,76,.7)}}
@keyframes v8r-edgePulse{0%,100%{opacity:0}50%{opacity:1}}
@keyframes v8r-hintFade{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(8px)}}
@keyframes v8r-shareReveal{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
@keyframes v8r-wordGlow{0%{background:rgba(245,184,76,.5);color:#F5B84C}100%{background:rgba(245,184,76,.11);color:rgba(245,184,76,.92)}}
@keyframes v8r-textIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes v8r-cBounce{0%,100%{transform:translateY(0) rotate(-2deg)}30%{transform:translateY(-14px) rotate(4deg) scale(1.15)}65%{transform:translateY(-5px) rotate(-1deg)}}
@keyframes v8r-cWiggle{0%,100%{transform:rotate(-2deg)}25%{transform:rotate(7deg) scale(1.08)}75%{transform:rotate(-7deg) scale(1.08)}}
@keyframes v8r-seedAppear{0%{transform:scale(0) rotate(-15deg);opacity:0}60%{transform:scale(1.2) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes v8r-seedGlow{0%,100%{box-shadow:0 0 8px rgba(245,184,76,.25)}50%{box-shadow:0 0 28px rgba(245,184,76,.7)}}
@keyframes v8r-soundPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes v8r-nudgePulse{0%,100%{opacity:0}50%{opacity:1}}
.v8r-mw{display:inline;cursor:pointer;color:rgba(245,184,76,.92);background:rgba(245,184,76,.11);border-radius:5px;padding:1px 4px;border-bottom:1.5px solid rgba(245,184,76,.38);transition:background .18s}
.v8r-mw:active{background:rgba(245,184,76,.22)}
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
// Luna's creative thought lines per generation step
const GEN_THOUGHTS = [
  [{ico:'\uD83C\uDF19',done:true,text:(n:string,a:string)=>a?`${a.split(' ').slice(0,3).join(' ')}. That goes in first.`:`Setting: somewhere ${n} knows well.`}],
  [{ico:'\u2728',done:true,text:(n:string)=>`The story belongs to ${n}. Everything else orbits that.`},{ico:'\uD83D\uDCAD',done:false,text:()=>`The ending needs to carry them to sleep\u2026`}],
  [{ico:'\uD83C\uDF19',done:true,text:(n:string,a:string)=>a?`${a.split(' ').slice(0,4).join(' ')}. That's the heart.`:`${n}'s story is finding its shape.`},{ico:'\u2728',done:true,text:(n:string)=>`${n} is at the centre. The world bends toward her.`},{ico:'\uD83C\uDF19',done:true,text:()=>`The ending is quiet. The right kind of quiet.`}],
];
const GEN_REACTIONS = [
  (a:string)=>`${a.split(' ').slice(0,3).join(' ')}. That's going in. \u2726`,
  ()=>`That's the heart of tonight's story. \u2726`,
  ()=>`Perfect. The story already knows. \u2726`,
  ()=>`That belongs in the book. \u2726`,
  ()=>`Noted. That matters. \u2726`,
];
function pickReaction(answer:string):string{return GEN_REACTIONS[Math.floor(Math.random()*GEN_REACTIONS.length)](answer);}

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

TONE: Always safe. Always warm. The ending must feel like a hug. The DEFAULT tone is very silly — SPLAT. BOING. WHOOSH. Characters say "Oh no!" and "Uh oh!" and things fall over hilariously. BUT: if the story premise is tender or emotional (missing someone, first day of something, a worried feeling), lead with warmth and gentleness instead. Silly and safe are not the same thing — a story can be entirely gentle without a sound word and still be perfect for this age.

DIALOGUE AT THIS AGE sounds like: "Again!" / "My turn!" / "Uh oh!" / "No! Mine!" / "Where go?" / "More more more!" Children this age speak in bursts of 2–4 words. They repeat. They demand. They narrate what they're doing as they do it.

WEIRD DETAIL AT THIS AGE is physical and immediate: "she always had to touch every fence post on the way home" or "he said goodnight to each shoe before bed — left shoe first, always." NOT abstract traits like "she was thoughtful" — a 3-year-old's weirdness lives in their body, not their mind.

COMEDY AT THIS AGE is physical, repetitive, and loud. Slapstick: things fall over, characters bump into things, sounds are enormous (SPLAT! BONK! WHOOOOSH!). Repetition IS the joke — the same thing happens three times, the third time sillier. Forbidden territory: mess, mud, food on faces, silly noises. The child laughs because they SAW IT COMING and it happened ANYWAY.

ECHO PATTERN: A literal refrain of 3–5 words, appearing exactly three times: once to introduce, once in the middle (varied — different character says it, or it goes slightly wrong), once at the end (warm, closing). Simple enough that a 3-year-old will say it out loud.`},

  {value:"age5",label:"Age 5\u20136",grade:"Kindergarten",prompt:`READER AGE: 5\u20136 years old (Kindergarten).

VOCABULARY: Simple everyday words plus 1\u20132 fun new words that are obviously explained by context. Sentences of 6\u201310 words. Short sentences for big moments. Longer for travelling or calm.

STRUCTURE \u2014 model: Julia Donaldson (The Gruffalo), Mo Willems (Pigeon series):
\u2022 RULE OF THREE (preferred): ${name} tries something on page 3, page 5, and page 7. Attempt 1 fails hilariously. Attempt 2 fails differently and even more hilariously. Attempt 3 succeeds \u2014 but not how anyone expected.
\u2022 OR RUNNING JOKE: A silly thing happens on page 1 and keeps happening. On the last page it happens one final time with a twist.
\u2022 Every page must have at least one line of dialogue. Characters say the WRONG thing, the BRAVE thing, the FUNNY thing.
\u2022 Page count: follow the chosen story length (short=8, standard=10, long=12). Fit the Rule of Three to whatever page count is chosen: attempt 1 at ~30% through, attempt 2 at ~55%, attempt 3 at ~75%. Last page is the emotional payoff — end on whatever the story earns.

HERO AGENCY (critical): ${name} must make ONE decision that changes everything. Not "helped" \u2014 decided. PASSIVE (bad): "${name} watched as the dragon flew away." ACTIVE (good): "${name} knew exactly what to do. She climbed up. She knocked three times. And she asked the question nobody else had thought to ask."

ONE TRUE THING: One moment of genuine emotional recognition \u2014 the flutter of nerves before something new, the warm feeling of being the one who fixed it, the sting of being left out and then included. It lives in what happens, never in what is said.

TONE: Warm and funny. Someone always has a terrible plan. It sort of works anyway. Sound words on at least 3 pages.

DIALOGUE AT THIS AGE sounds like: "But WHY though?" / "That's not even fair!" / "Wait wait wait wait wait" / "I TOLD you!" / "Okay fine but only because I want to." Children this age argue, negotiate, and have OPINIONS. They use "actually" and "literally" wrong but with total confidence.

WEIRD DETAIL AT THIS AGE is behavioural — a ritual, a habit, a rule they invented: "she always ate sandwiches from the middle out" or "he had to wave goodbye to the moon every night or it might forget to come back." The detail should be something another child would find interesting, not just cute.

COMEDY AT THIS AGE is subverted expectations + forbidden territory. The setup promises one thing, the punchline delivers another. Anything involving bottoms, burps, or things you're not supposed to say is inherently hilarious. Characters who are ABSOLUTELY CERTAIN they are right and are SPECTACULARLY wrong. The gap between confidence and reality is where 5-year-olds laugh.

ECHO PATTERN: A repeated phrase that CHANGES meaning each time it appears. First time: establishes the phrase and its obvious meaning. Second time: the situation has changed — same words, different feeling. Third time: the phrase now means something the reader didn't expect when they first heard it. At this age, the child should recognise the phrase returning and feel clever for noticing.`},

  {value:"age7",label:"Age 7\u20138",grade:"1st\u20132nd Grade",prompt:`READER AGE: 7\u20138 years old (1st\u20132nd Grade).

VOCABULARY: Sentences of 8\u201314 words. One genuinely interesting word per page \u2014 sounds good read aloud (e.g. "preposterous", "magnificent", "thunderous"). Always clear from context.

STRUCTURE \u2014 model: Roald Dahl (The Enormous Crocodile), Arnold Lobel (Frog and Toad):
\u2022 PLANT AND PAYOFF: On page 1 or 2, introduce something small \u2014 an object, a word, a detail \u2014 that seems unimportant. On the last two pages, it turns out to be the most important thing in the story. The child goes "OH!" and wants to read it again immediately.
\u2022 The hero must be underestimated by at least one other character \u2014 and prove them spectacularly, satisfyingly wrong.
\u2022 Running joke: one funny thing escalates across 3\u20134 pages and pays off just before the ending.
\u2022 Characters have contradictions: brave but secretly nervous, bossy but genuinely kind underneath.
\u2022 Page count: follow the chosen story length (short=8, standard=12, long=16). Plant seed by page 2. Twist lands on the penultimate page. Final page is the emotional payoff — end on whatever the story earns.

HERO AGENCY (critical): ${name} must make one decision under pressure that only THEY could make \u2014 using something specific about who they are. Not luck. Not help from others. Them.

ONE TRUE THING: One moment must contain genuine emotional honesty \u2014 real doubt, real disappointment, real courage, or real joy. Not performed. Felt. This is the moment a parent will remember long after the story ends.

TONE: Wry and warm. Not "big" but "SO ENORMOUSLY, RIDICULOUSLY big that three families of sparrows had moved into its left ear". The ending is surprising AND deeply satisfying.

DIALOGUE AT THIS AGE sounds like: "Actually, I have a better idea." / "Wait. What if we just..." / "You're not going to believe this." / "I mean, technically..." / "Okay but that's the OPPOSITE of what I said." Children this age try on adult phrasing but with their own logic underneath. They qualify, they hedge, they build arguments.

WEIRD DETAIL AT THIS AGE is internal and contradictory: "he kept a ranked list of his fears, updated weekly" or "she could only think clearly when she was upside down" or "he was brave about everything except the specific shade of green on the school bathroom walls." The contradiction makes the character feel real — brave AND afraid, smart AND silly.

COMEDY AT THIS AGE is irony + absurd escalation. Characters who are oblivious to things the reader sees clearly. Situations that get worse in ways that are technically logical but practically insane. Understatement: "There was, it must be said, rather a lot of fire." The reader feels clever for getting the joke. Wordplay starts landing.

ECHO PATTERN: A planted line or image that returns in the final pages with NEW WEIGHT. First appearance: unremarkable, part of the world. Final appearance: the same words, but the reader now understands what they really mean. The child goes "OH!" The echo should make them want to re-read the beginning.`},

  {value:"age9",label:"Age 9\u201310",grade:"3rd\u20134th Grade",prompt:`READER AGE: 9\u201310 years old (3rd\u20134th Grade).

VOCABULARY: Rich vocabulary welcomed. 1\u20132 genuinely interesting words per page \u2014 the kind children will use tomorrow to impress someone. Sentences of 10\u201320 words on journey pages. Short punchy sentences (5\u20137 words) for high-tension moments \u2014 contrast is everything. Paragraphs of 3\u20134 sentences are fine on journey pages, but vary length deliberately: a long winding sentence followed by a short one. Never three consecutive sentences the same length.

STRUCTURE \u2014 model: Roald Dahl (Fantastic Mr Fox), A.A. Milne (Winnie-the-Pooh), E.B. White (Charlotte's Web):
\u2022 REVELATION ENDING: The twist must recontextualise the entire story \u2014 not just surprise, but make the reader see everything differently. Plant the clue no later than page 3.
\u2022 EMOTIONAL TURN: At least one moment where something genuinely difficult happens \u2014 real doubt, a mistake with consequences, something that matters. Then a resolution that feels earned, not given.
\u2022 SECONDARY CHARACTER ARC: One supporting character has their own small journey that intersects with ${name}'s at the climax in an unexpected way.
\u2022 Characters have genuine contradictions AND growth: someone starts wrong about something important and ends changed.
\u2022 Page count: follow the chosen story length (short=8, standard=12, long=16). Clue in first 25% of pages. Emotional turn at 65\u201375% through. Revelation on penultimate page. Final page is the emotional payoff — end on whatever the story earns.

HERO AGENCY (critical): ${name} must face a moment where the easy path is genuinely tempting \u2014 and choose the harder, right thing instead. The reader must feel the weight of that choice.

ONE TRUE THING: One moment should feel so emotionally true that it could only have been written for THIS child on THIS night. The feeling of being small in a big world and discovering you are braver than you thought.

TONE: Intelligent, funny, and emotionally honest. Not condescending. The best moment should make both the child AND the parent feel something real.

STORY GUARD: The emotional complexity earns its place only if it resolves completely. A child reading this should feel satisfied and seen — not confused or unsettled. The story earns whatever ending fits it best.

DIALOGUE AT THIS AGE sounds like: "Okay but hear me out." / "That's... actually kind of brilliant." / "I wasn't scared. I just didn't want to go first." / "Can I ask you something weird?" / "Never mind. Actually no, wait." Children this age are self-aware. They try to sound casual about things that matter. They use humour to approach hard topics sideways.

WEIRD DETAIL AT THIS AGE is self-aware and layered: "she kept a notebook of things that were beautiful but nobody else seemed to notice — a certain kind of shadow, the sound of a spoon in an empty mug" or "he'd figured out that if you count to seven before answering a question, people think you're wise, even when you're just confused." The detail reveals how the child SEES THEMSELVES, not just what they do.

COMEDY AT THIS AGE is wit + self-awareness. Characters who know they're being ridiculous and do it anyway. Meta-humour: awareness of story conventions ("This is the part where I'm supposed to say something brave, isn't it?"). Sophisticated irony. The humour earns the child's respect because it treats them as intelligent. Nothing patronising.

ECHO PATTERN: A structural callback — an image, phrase, or detail from the opening that returns TRANSFORMED at the end. The first appearance sets up one meaning. The return reveals a deeper meaning the reader couldn't have understood at the start. This is the "re-read" moment — the child immediately wants to go back to the beginning and see it differently. At this age, the echo can be subtle. Trust the reader to find it.`},
];
const CHAR_ICONS = {hero:"⭐",friend:"👫",sibling:"👶",parent:"🧑‍🍼",pet:"🐾",toy:"🧸"};
const BONDING_QUESTIONS = [
  "What was the best part of today?",
  "What made you laugh today?",
  "Did anything surprise you today?",
  "What's something kind you did — or someone did for you?",
  "What are you thinking about right now?",
  "What's something you want to do tomorrow?",
  "What made you feel brave today?",
  "If you could tell your DreamKeeper one thing about today, what would it be?",
  "What's something silly that happened?",
  "What are you most proud of today?",
  "What did you imagine or pretend today?",
  "What made you feel cozy or safe?",
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
  // Strategy 1: direct parse
  try { return JSON.parse(s); } catch(_) {}
  // Strategy 2: extract { ... } block
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if(start===-1||end<=start) throw new Error("No JSON found in response");
  let block = s.slice(start,end+1);
  try { return JSON.parse(block); } catch(_) {}
  // Strategy 3: fix trailing commas
  let fixed = block.replace(/,(\s*[}\]])/g,"$1");
  try { return JSON.parse(fixed); } catch(_) {}
  // Strategy 4: fix unescaped newlines in string values
  fixed = fixed.replace(/(?<="[^"]*)\n(?=[^"]*")/g,"\\n");
  try { return JSON.parse(fixed); } catch(_) {}
  // Strategy 5: fix smart quotes and curly apostrophes
  fixed = fixed.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g,'\\"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g,"'");
  try { return JSON.parse(fixed); } catch(_) {}
  // Strategy 6: fix unescaped quotes inside string values
  fixed = fixed.replace(/:(\s*)"((?:[^"\\]|\\.)*)"/g, (match,ws,content) => {
    const safeContent = content.replace(/(?<!\\)"/g,'\\"');
    return `:${ws}"${safeContent}"`;
  });
  try { return JSON.parse(fixed); } catch(_) {}
  // Strategy 7: aggressive — strip control chars, fix common issues
  fixed = block.replace(/[\x00-\x1F\x7F]/g,' ')
    .replace(/,(\s*[}\]])/g,"$1")
    .replace(/([{,]\s*)(\w+)\s*:/g,'$1"$2":')
    .replace(/:\s*'([^']*)'/g,':"$1"');
  try { return JSON.parse(fixed); } catch(e) {
    console.error("All JSON parse strategies failed. Raw text:", text.slice(0,500));
    throw new Error("Could not parse story response — tap Try Again");
  }
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
const elTTS = async (text, voiceId, speed=1.0, attempt=0): Promise<string> => {
  console.log('[elTTS] Requesting voice:', voiceId, 'text length:', text?.length, attempt > 0 ? `(retry ${attempt})` : '');
  const resp = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId, speed }),
  });
  // Retry on rate limit (429)
  if(resp.status === 429 && attempt < 2) {
    const wait = (attempt + 1) * 1500;
    console.warn(`[elTTS] Rate limited, retrying in ${wait}ms`);
    await new Promise(r => setTimeout(r, wait));
    return elTTS(text, voiceId, speed, attempt + 1);
  }
  if(!resp.ok) {
    const errText = await resp.text().catch(()=>'');
    console.error('[elTTS] API error:', resp.status, errText.slice(0,200));
    throw new Error(`TTS error ${resp.status}: ${errText.slice(0,100)}`);
  }
  const ct = resp.headers.get('content-type') || '';
  if(!ct.includes('audio')) {
    console.error('[elTTS] Unexpected content-type:', ct);
    throw new Error(`TTS returned ${ct} instead of audio`);
  }
  const blob = await resp.blob();
  console.log('[elTTS] Got audio blob:', blob.size, 'bytes');
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
const callClaude = async (messages, system="", maxTokens=4000, retries=2) => {
  const body: any = {model:"claude-sonnet-4-6",max_tokens:maxTokens,messages};
  if(system) body.system = system;

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Client-side timeout: 90s (Vercel function has 120s max)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      let r;
      try {
      r = await fetch("/api/claude",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body),
        signal: controller.signal,
      });
      } catch(fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') throw new Error("Story generation timed out — tap Try Again (it usually works on the second attempt).");
        throw new Error(`Network error: ${fetchErr.message || 'Could not reach server'}`);
      }
      clearTimeout(timeoutId);
      const raw = await r.text();
      let d;
      try { d = JSON.parse(raw); } catch(_) {
        throw new Error(`Server error (${r.status}): ${raw.slice(0,120)}`);
      }
      // Retry on overloaded/server errors
      if (r.status === 529 || r.status === 503 || r.status === 500) {
        throw new Error(d.error?.message || `API error ${r.status}`);
      }
      if(!r.ok) throw new Error(d.error?.message||`API error ${r.status}`);
      const text = d.content?.find(b=>b.type==="text")?.text||"";
      if(!text) throw new Error("Empty response from API");
      return text;
    } catch(e) {
      lastErr = e;
      if (attempt < retries) {
        const delay = 1500 * (attempt + 1); // 1.5s, 3s
        console.warn(`[callClaude] Attempt ${attempt+1} failed: ${e.message}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
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
  companionCreature?: HatchedCreature | null;
  onCharacterSavePrompt?: (charData: any) => void;
  onStoryReady?: (storyData: any) => void;
  onGenerateError?: () => void;
  onHome?: () => void;
}

export default function SleepSeed({
  userId,
  isGuest = false,
  preloadedCharacter,
  preloadedBook,
  ritualSeed,
  ritualMood,
  builderChoices,
  companionCreature,
  onCharacterSavePrompt,
  onStoryReady,
  onGenerateError,
  onHome,
}: SleepSeedCoreProps = {}) {
  // Resolve DreamKeeper image — but NOT for the pre-hatch egg (spirit/🥚)
  const isPreHatchEgg = !companionCreature || companionCreature.creatureType === 'spirit' || companionCreature.creatureEmoji === '\uD83E\uDD5A';
  const companionDk = (!isPreHatchEgg && companionCreature)
    ? (getDreamKeeperById(companionCreature.creatureType)
       || V1_DREAMKEEPERS.find(dk => dk.emoji === companionCreature.creatureEmoji)
       || null)
    : null;
  const companionImageSrc = companionDk?.imageSrc;

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
  const lastSavedStoryIdRef = useRef<string>('');
  const [pageIdx,        setPageIdx]        = useState(0);
  const [chosenPath,     setChosenPath]     = useState(null);
  const [storyFeedback,  setStoryFeedback]  = useState<'loved'|'good'|'retry'|null>(null);
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
  const [ncStep,         setNcStep]         = useState(0);          // -1=bridge, 0=bonding, 1=gratitude, 2=whisper, 3=generating, 4=reveal
  const [ncGenTextIdx,   setNcGenTextIdx]   = useState(0);
  const [ncGenPct,       setNcGenPct]       = useState(0);
  const [ncBondingQ,     setNcBondingQ]     = useState("");         // bonding question from generation
  const [ncBondingA,     setNcBondingA]     = useState("");         // child's answer
  const [ncGratitude,    setNcGratitude]    = useState("");         // "best three seconds"
  const [ncExtra,        setNcExtra]        = useState("");         // optional extra note
  const [ncPhoto,        setNcPhoto]        = useState<string|null>(null); // base64 data URL
  const [ncCountdown,    setNcCountdown]    = useState(0);          // 3-2-1 countdown
  const [ncCameraOpen,   setNcCameraOpen]   = useState(false);       // live camera view
  const [ncFacing,       setNcFacing]       = useState<'user'|'environment'>('user');
  const ncCamVideoRef  = useRef<HTMLVideoElement>(null);
  const ncCamStreamRef = useRef<MediaStream|null>(null);
  const ncSrRef        = useRef<any>(null);                          // speech recognition instance
  const [ncListening,    setNcListening]    = useState(false);       // mic active for Night Card
  const [ncChildMood,    setNcChildMood]    = useState("");          // emoji mood picked by child
  const [ncAudioBlob,    setNcAudioBlob]    = useState<Blob|null>(null); // voice recording blob
  const [ncAudioUrl,     setNcAudioUrl]     = useState<string|null>(null); // voice playback URL
  const [ncRecording,    setNcRecording]    = useState(false);       // currently recording voice
  const [ncDrawing,      setNcDrawing]      = useState<string|null>(null); // child drawing data URL
  const [ncDrawingOpen,  setNcDrawingOpen]  = useState(false);       // drawing canvas open
  const [ncDrawColor,   setNcDrawColor]    = useState('#2a1a0e');    // drawing pen color
  const ncDrawCanvasRef  = useRef<HTMLCanvasElement>(null);
  const ncDrawingRef     = useRef(false);                             // is finger/mouse down
  const ncMediaRecRef    = useRef<MediaRecorder|null>(null);
  const [ncGenerating,   setNcGenerating]   = useState(false);      // Claude generating
  const [ncResult,       setNcResult]       = useState<any>(null);  // final Night Card
  const [ncRevealed,     setNcRevealed]     = useState(false);      // polaroid reveal done
  const [ncBondingSaved, setNcBondingSaved] = useState(false);      // bonding answer submitted during loading
  const [viewingNightCard, setViewingNightCard] = useState<any>(null); // Night Card detail view
  const [ncDetailFlipped,  setNcDetailFlipped]  = useState(false);     // flip state for detail modal
  const [ncShareSheetOpen, setNcShareSheetOpen] = useState(false);     // premium share sheet
  const [ncSaving, setNcSaving] = useState(false);                     // save in progress
  const [ncShareUrl, setNcShareUrl] = useState('');
  const [styleDna,         setStyleDna]         = useState<any>(null); // Style DNA for feedback
  const [showFeedback,     setShowFeedback]     = useState(false);     // StoryFeedback sheet visible
  const [libSubmitState,   setLibSubmitState]   = useState<'idle'|'confirming'|'submitting'|'done'>('idle');
  const [libSubmitSlug,    setLibSubmitSlug]    = useState('');
  const [libSubmitAge,     setLibSubmitAge]     = useState('');
  const [libSubmitMood,    setLibSubmitMood]    = useState('');
  const [showToolbar,      setShowToolbar]      = useState(false);     // collapsed toolbar expanded
  const [warmMode,         setWarmMode]         = useState(false);     // warm sepia filter on story pages
  const [noScreenMode,     setNoScreenMode]     = useState(false);     // near-black overlay, listen only
  const [ambientOn,        setAmbientOn]        = useState(false);     // cozy night ambient sound
  const [ncPhotoMode,      setNcPhotoMode]      = useState<'idle'|'camera'|'upload'>('idle');
  const [shareToLibrary,   setShareToLibrary]   = useState(false);
  const [storyRating,      setStoryRating]      = useState<number|null>(null);
  const [bondingAnswered,  setBondingAnswered]   = useState(false);
  const [bondingReaction,  setBondingReaction]   = useState('');

  // v8r: story reader upgrade state
  const [v8rTrayOpen,      setV8rTrayOpen]      = useState(false);
  const [v8rShareOpen,     setV8rShareOpen]     = useState(false);
  const [v8rLinkCopied,    setV8rLinkCopied]    = useState(false);
  const [v8rShareIncludeNightCard, setV8rShareIncludeNightCard] = useState(false);
  const [v8rShareMessage, setV8rShareMessage] = useState('');
  const [v8rWordMagic,     setV8rWordMagic]     = useState(false);
  const [v8rAmbientOn,     setV8rAmbientOn]     = useState(false);
  const [v8rCreatureAnim,  setV8rCreatureAnim]  = useState<'idle'|'bounce'|'wiggle'|'sparkle'>('idle');
  const [v8rGoldenSeed,    setV8rGoldenSeed]    = useState(false);
  const [v8rIdleTimer,     setV8rIdleTimer]     = useState<ReturnType<typeof setTimeout>|null>(null);
  const v8rAudioCtxRef     = useRef<AudioContext|null>(null);
  const v8rAmbientNodesRef = useRef<{osc?:OscillatorNode;gain?:GainNode;intervals?:ReturnType<typeof setInterval>[]}>({});

  const totalPagesRef = useRef(0);
  const fileRefs      = useRef({});
  const autoReadRef   = useRef(false);
  const goPageRef     = useRef(null);
  const elAudioRef      = useRef(null);   // current ElevenLabs Audio element
  const selectedVoiceRef = useRef<string|null>(null); // always-current voice ID
  const voiceIdRef       = useRef<string|null>(null); // always-current cloned voice ID
  const speakELRef       = useRef<any>(null);          // always-current speakTextEL fn
  const speakTextRef     = useRef<any>(null);          // always-current speakText fn
  const ambientCtxRef    = useRef<AudioContext|null>(null);
  const ambientGainRef   = useRef<GainNode|null>(null);
  const ambientSrcRef    = useRef<AudioBufferSourceNode|null>(null);
  const ncVideoRef       = useRef<HTMLVideoElement>(null);
  const ncStreamRef      = useRef<MediaStream|null>(null);
  const ssReaderRef      = useRef<HTMLDivElement>(null);
  const ssTouchStartX    = useRef(0);
  const ssChromeFadeRef  = useRef<ReturnType<typeof setTimeout>|null>(null);
  const [ssChromeVis,    setSsChromeVis]    = useState(true);
  const [ssSheetOpen,    setSsSheetOpen]    = useState(false);

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
  const lastPreloadedRef = useRef<any>(null);
  useEffect(() => {
    if (!preloadedBook) return;
    // Skip if this is the same preloadedBook we already loaded
    if (preloadedBook === lastPreloadedRef.current) return;
    lastPreloadedRef.current = preloadedBook;
    setBook(preloadedBook);
    setPageIdx(0);
    setChosenPath(null);
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

  // Pre-populate companion creature from the hatchery
  useEffect(() => {
    if (!companionCreature) return;
    const companionChar = {
      id:       companionCreature.id,
      type:     'creature' as const,
      name:     companionCreature.name,
      photo:    null,
      classify: companionCreature.creatureType,
      gender:   '',
      note:     companionCreature.dreamAnswer
                ? `${companionCreature.name} dreams about ${companionCreature.dreamAnswer}`
                : `${companionCreature.name} is the child's magical companion`,
    };
    setExtraChars(prev => {
      if (prev.some(c => c.id === companionChar.id)) return prev;
      return [companionChar, ...prev];
    });
  }, [companionCreature]); // eslint-disable-line

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

  // ── Warn before leaving during generation ────────────────────────────────────
  useEffect(() => {
    if (stage !== 'generating') return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; return ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'generating') return;
    window.history.pushState(null, '', window.location.href);
    const handler = () => {
      if (!window.confirm('Your story is still being created. Leave anyway?')) {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [stage]);

  // ── Auto-generate from StoryBuilderPage choices ──────────────────────────────
  // Fires once heroName is populated (from preloadedCharacter effect) AND
  // builderChoices are present — then calls generate() with all mapped overrides.
  const hasAutoGenRef = useRef(false);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (!builderChoices || hasAutoGenRef.current) return;
    const name = heroName.trim() || builderChoices.heroName || builderChoices.chars?.[0]?.name || 'dreamer';
    hasAutoGenRef.current = true;
    // Set hero state for display purposes
    if (builderChoices.heroName && !heroName.trim()) {
      setHeroName(builderChoices.heroName);
      if (builderChoices.heroGender) setHeroGender(builderChoices.heroGender);
    }
    // Pass name directly as override — don't depend on state being flushed
    doAutoGenerate(builderChoices, name);
  }, [builderChoices, heroName]); // eslint-disable-line react-hooks/exhaustive-deps

  const doAutoGenerate = (bc: NonNullable<typeof builderChoices>, heroNameOverride?: string) => {
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

    const feel   = vibeToFeel[bc.vibe]   || bc.vibe;
    const action = vibeToAction[bc.vibe]  || 'going on an adventure';

    const isRitual   = bc.path === 'ritual';
    const storyCtx   = isRitual ? (bc.brief.trim() || ritualSeed || '') : '';
    const brief1     = isRitual ? '' : (bc.brief.trim() || action);
    const isAdventure = bc.style === 'adventure';

    generate({
      ageGroup:       bc.level    || 'age5',
      storyLen:       bc.length   || 'standard',
      storyBrief1:    brief1,
      storyBrief2:    feel,
      storyContext:   storyCtx || storyContext,
      storyGuidance:  storyGuidance,
      realLifeCtx:    '',
      lessonContext:  '',
      storyMood:      bc.vibe || '',
      storyPace:      bc.pace  || 'normal',
      storyStyle:     bc.style || 'standard',
      adventure:      isAdventure,
      extraChars:     bc.chars  || [],
      lessons:        bc.lessons || [],
      occasion:       bc.occasion || '',
      occasionCustom: bc.occasionCustom || '',
      heroTraits:     preloadedCharacter?.personalityTags || [],
      heroNameOverride: heroNameOverride,
    });
  };


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
  // Cache the picked voice so it stays consistent across all pages
  const cachedVoiceRef = useRef<SpeechSynthesisVoice|null>(null);

  const speakText = useCallback((text, pageProgress=0.5) => {
    if(!("speechSynthesis" in window)||!text) return;
    window.speechSynthesis.cancel();
    // Also stop any ElevenLabs audio to prevent overlap
    if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current = null; }

    const CALMING_VOICES = [
      "Samantha","Ava","Allison","Victoria","Karen","Moira","Tessa","Fiona",
      "Aria","Jenny","Michelle","Elizabeth","Clara","Zira",
      "Google UK English Female","Google US English",
    ];
    const pickVoice = () => {
      // Return cached voice if we already picked one
      if(cachedVoiceRef.current) return cachedVoiceRef.current;
      const vs = window.speechSynthesis.getVoices();
      for(const n of CALMING_VOICES){ const v=vs.find(v=>v.name.includes(n)); if(v){ cachedVoiceRef.current=v; return v; } }
      const fallback = vs.find(v=>v.lang.startsWith("en")&&/female|woman|girl/i.test(v.name))||vs.find(v=>v.lang.startsWith("en"))||null;
      if(fallback) cachedVoiceRef.current = fallback;
      return fallback;
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
    if(!text) { console.log('[speakEL] No text, skipping'); return; }
    console.log('[speakEL] Starting, voice:', selectedVoiceId||voiceId, 'text:', text.slice(0,40));
    // Cancel ALL audio before starting new ElevenLabs playback
    if("speechSynthesis" in window) window.speechSynthesis.cancel();
    if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current = null; }
    // Brief pause so rapid page turns don't fire overlapping EL requests
    await new Promise(r => setTimeout(r, 80));
    if(!autoReadRef.current) { console.log('[speakEL] Cancelled during pause'); return; }

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
      const vid = selectedVoiceId||voiceId;
      if(!vid) { console.warn('[speakEL] No voice ID, falling back'); throw new Error('No voice ID'); }
      const url  = await elTTS(text, vid, rate);
      const audio = new Audio(url);
      elAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); elAudioRef.current=null; onEnd(); };
      audio.onerror = (e) => { console.error('[speakEL] Audio playback error:', e); URL.revokeObjectURL(url); elAudioRef.current=null; onEnd(); };
      await audio.play();
      console.log('[speakEL] Playing audio');
    } catch(err) {
      console.error("[speakEL] Failed, falling back to browser speech:", err);
      // Only fall back if still in auto-read mode (user didn't cancel during fetch)
      if(autoReadRef.current) speakText(text, pageProgress);
      else setIsReading(false);
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
    console.log('[toggleRead] isReading:', isReading, 'selectedVoiceId:', selectedVoiceId, 'voiceId:', voiceId);
    if(isReading) {
      window.speechSynthesis.cancel();
      if(elAudioRef.current){ elAudioRef.current.pause(); elAudioRef.current=null; }
      autoReadRef.current = false;
      setIsReading(false);
    } else {
      autoReadRef.current = true;
      if(selectedVoiceId||voiceId) {
        console.log('[toggleRead] Using ElevenLabs voice:', selectedVoiceId||voiceId);
        speakTextEL(text, pageProgress);
      } else {
        console.log('[toggleRead] Using browser speech (no voice ID)');
        speakText(text, pageProgress);
      }
    }
  },[isReading, speakText, speakTextEL, voiceId, selectedVoiceId]);

  // ── Ambient sound (cozy night) ──────────────────────────────────────
  const toggleAmbient = useCallback(() => {
    if(ambientOn) {
      if(ambientGainRef.current) {
        const g = ambientGainRef.current;
        g.gain.setTargetAtTime(0, g.context.currentTime, 0.5);
        setTimeout(() => {
          ambientSrcRef.current?.stop(); ambientSrcRef.current=null;
          ambientCtxRef.current?.close(); ambientCtxRef.current=null;
          ambientGainRef.current=null;
        }, 1500);
      }
      setAmbientOn(false);
      return;
    }
    try {
      const ctx = new AudioContext();
      // Resume context on mobile (browsers suspend until user gesture)
      if (ctx.state === 'suspended') ctx.resume();
      ambientCtxRef.current = ctx;
      const len = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for(let ch=0; ch<2; ch++) {
        const data = buf.getChannelData(ch);
        let last = 0;
        for(let i=0; i<len; i++) { const white = Math.random()*2-1; last=(last+(0.02*white))/1.02; data[i]=last*3.5; }
      }
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.8);
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 400;
      src.connect(lpf).connect(gain).connect(ctx.destination);
      src.start();
      ambientSrcRef.current = src;
      ambientGainRef.current = gain;
      setAmbientOn(true);
    } catch(e) { console.error("Ambient sound error:", e); }
  }, [ambientOn]);

  // Stop ambient when leaving the book
  useEffect(() => {
    if(stage !== 'book' && ambientOn) {
      ambientSrcRef.current?.stop(); ambientSrcRef.current=null;
      ambientCtxRef.current?.close(); ambientCtxRef.current=null;
      ambientGainRef.current=null;
      setAmbientOn(false);
    }
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setSelectedVoiceId(newId); // Auto-select the cloned voice
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
      ctx.fillText(`A story for ${book.heroName}  ·  sleepseed.vercel.app`, SIZE/2, SIZE-52);
      // Build private share link for the image share
      let imgShareUrl = BASE_URL;
      try {
        const payload = { t: book.title, n: book.heroName, r: book.refrain || '', p: (book.pages || []).map((pg: any) => pg.text || '') };
        imgShareUrl = `${BASE_URL}/?s=${btoa(encodeURIComponent(JSON.stringify(payload)))}`;
      } catch {}

      // Export
      canvas.toBlob(async (blob) => {
        if(!blob) return;
        const file = new File([blob], `${book.title.replace(/[^a-z0-9]/gi,"_")}_card.png`, {type:"image/png"});
        if(navigator.canShare?.({files:[file]})) {
          await navigator.share({files:[file], title:book.title, text:`A bedtime story for ${book.heroName} — made with SleepSeed\n\n${imgShareUrl}`, url:imgShareUrl});
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

  // ── PDF Download — Keepsake-quality portrait storybook ──────────────
  const downloadStory = async () => {
    if(!book) return;
    try {
      const { jsPDF } = await import("jspdf");
      // A5 portrait — natural storybook feel
      const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a5" });
      const W = 148, H = 210;

      // Colours
      const NAVY:  [number,number,number] = [13,  21,  53];
      const GOLD:  [number,number,number] = [212, 160, 48];
      const WHITE: [number,number,number] = [255, 255, 255];
      const CREAM_BG:[number,number,number] = [253, 248, 242];
      const INK:   [number,number,number] = [26,  20,  16];
      const RULE:  [number,number,number] = [228, 220, 216];
      const PG_NUM:[number,number,number] = [184, 168, 152];
      const REFRAIN_C:[number,number,number]= [74,  56,  128];
      const FOR_LBL:[number,number,number]= [176, 160, 144];
      const PAD = 18;
      const TW = W - PAD*2; // text width

      // Moon crescent helper
      const drawMoon = (cx:number, cy:number, r:number) => {
        doc.setFillColor(...GOLD);
        doc.circle(cx, cy, r, "F");
        doc.setFillColor(...NAVY);
        doc.circle(cx - r*0.35, cy - r*0.1, r*0.82, "F");
      };

      const rule = (x:number, y:number, w:number) => {
        doc.setDrawColor(...RULE); doc.setLineWidth(0.3);
        doc.line(x, y, x+w, y);
      };

      // ── COVER PAGE ────────────────────────────────────────────────────
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, W, H, "F");

      // Stars
      for(let i=0;i<20;i++){
        const sx=((i*37+13)%130)+9, sy=((i*53+7)%100)+10;
        doc.setFillColor(238,232,255); doc.setGState(new (doc as any).GState({opacity:0.15+((i%5)*0.04)}));
        doc.circle(sx,sy,0.5,"F");
      }
      doc.setGState(new (doc as any).GState({opacity:1}));

      // Moon
      drawMoon(W/2, 50, 10);

      // SleepSeed
      doc.setFont("times", "bold"); doc.setFontSize(12);
      doc.setTextColor(...WHITE);
      doc.text("SleepSeed", W/2, 68, { align:"center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(6);
      doc.setTextColor(...GOLD);
      doc.text("BEDTIME STORIES", W/2, 74, { align:"center" });

      // Gold rule
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
      doc.line(W/2-30, 82, W/2+30, 82);

      // "A bedtime story for"
      doc.setFont("helvetica", "normal"); doc.setFontSize(7);
      doc.setTextColor(...FOR_LBL);
      doc.text("A bedtime story for", W/2, 94, { align:"center" });

      // Hero name
      doc.setFont("times", "bold"); doc.setFontSize(22);
      doc.setTextColor(...WHITE);
      doc.text(book.heroName, W/2, 106, { align:"center" });

      // Title
      doc.setFont("times", "normal"); doc.setFontSize(13);
      doc.setTextColor(250, 233, 168);
      const coverTitleLines = doc.splitTextToSize(book.title, TW);
      doc.text(coverTitleLines, W/2, 120, { align:"center" });

      // Creature
      if (companionCreature?.creatureEmoji) {
        doc.setFontSize(28);
        doc.text(companionCreature.creatureEmoji, W/2, 160, { align:"center" });
      }

      // Footer
      doc.setFont("helvetica", "normal"); doc.setFontSize(5.5);
      doc.setTextColor(100, 100, 130);
      doc.text("sleepseed.vercel.app", W/2, H-10, { align:"center" });

      // ── STORY PAGES (one per page) ────────────────────────────────────
      const allPages = book.isAdventure
        ? [...(book.setup_pages||[]), ...(book.path_a||[]), ...(book.path_b||[])]
        : (book.pages||[]);

      allPages.forEach((pg: any, i: number) => {
        doc.addPage();
        const isEven = i % 2 === 0;
        doc.setFillColor(...(isEven ? CREAM_BG : WHITE));
        doc.rect(0, 0, W, H, "F");

        // Page text
        doc.setFont("times", "normal"); doc.setFontSize(11);
        doc.setTextColor(...INK);
        const lines = doc.splitTextToSize(pg.text||"", TW);
        doc.text(lines, PAD, 24);

        // Refrain on even pages
        if(book.refrain && i % 2 === 1) {
          rule(PAD, H - 36, TW);
          doc.setFont("times", "italic"); doc.setFontSize(8.5);
          doc.setTextColor(...REFRAIN_C);
          const rLines = doc.splitTextToSize(`"${book.refrain}"`, TW);
          doc.text(rLines, PAD, H - 30);
        }

        // Footer
        rule(PAD, H - 16, TW);
        doc.setFont("times", "italic"); doc.setFontSize(6.5);
        doc.setTextColor(...PG_NUM);
        doc.text(String(i+1), PAD, H - 11);
        doc.setFont("helvetica", "normal"); doc.setFontSize(5.5);
        doc.text("sleepseed.vercel.app", W - PAD, H - 11, { align:"right" });
      });

      // ── THE END PAGE ──────────────────────────────────────────────────
      doc.addPage();
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, W, H, "F");

      drawMoon(W/2, 55, 8);

      doc.setFont("times", "bold"); doc.setFontSize(22);
      doc.setTextColor(...WHITE);
      doc.text("The End", W/2, 78, { align:"center" });

      doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
      doc.line(W/2-25, 84, W/2+25, 84);

      // Refrain prominently
      if(book.refrain) {
        doc.setFont("times", "italic"); doc.setFontSize(10);
        doc.setTextColor(250, 233, 168);
        const rLines = doc.splitTextToSize(`"${book.refrain}"`, TW - 10);
        doc.text(rLines, W/2, 98, { align:"center" });
      }

      doc.setFont("times", "italic"); doc.setFontSize(9);
      doc.setTextColor(...FOR_LBL);
      doc.text(`Sweet dreams, ${book.heroName}.`, W/2, 130, { align:"center" });
      doc.setFontSize(8);
      doc.text("Tomorrow night, another adventure awaits.", W/2, 139, { align:"center" });

      // ── NIGHT CARD PAGE (optional) ────────────────────────────────────
      if (book.nightCard && v8rShareIncludeNightCard) {
        const nc = book.nightCard;
        doc.addPage();
        doc.setFillColor(...CREAM_BG);
        doc.rect(0, 0, W, H, "F");

        doc.setFont("helvetica", "normal"); doc.setFontSize(7);
        doc.setTextColor(...FOR_LBL);
        doc.text("TONIGHT'S NIGHT CARD", W/2, 20, { align:"center" });

        doc.setFont("times", "bold"); doc.setFontSize(14);
        doc.setTextColor(...INK);
        const hlLines = doc.splitTextToSize(nc.headline||nc.storyTitle||'', TW);
        doc.text(hlLines, W/2, 38, { align:"center" });

        rule(PAD, 38 + hlLines.length*6 + 6, TW);

        doc.setFont("times", "italic"); doc.setFontSize(11);
        doc.setTextColor(74, 56, 40);
        const qLines = doc.splitTextToSize(`"${nc.quote||''}"`, TW - 10);
        doc.text(qLines, W/2, 58, { align:"center" });

        if (nc.memory_line) {
          doc.setFont("times", "normal"); doc.setFontSize(9);
          doc.setTextColor(...FOR_LBL);
          const mLines = doc.splitTextToSize(nc.memory_line, TW);
          doc.text(mLines, W/2, 58 + qLines.length*6 + 14, { align:"center" });
        }

        // Footer
        doc.setFont("helvetica", "normal"); doc.setFontSize(7);
        doc.setTextColor(...PG_NUM);
        doc.text(`${nc.heroName}  ·  ${nc.date}`, W/2, H - 20, { align:"center" });
        doc.setFontSize(6); doc.setTextColor(200, 189, 176);
        doc.text("Night Card — SleepSeed", W/2, H - 13, { align:"center" });
      }

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

  // ── Pin viewport height for mobile address bar resilience ──
  useEffect(()=>{
    const setVh=()=>{document.documentElement.style.setProperty('--vh',`${window.innerHeight*0.01}px`);};
    setVh();window.addEventListener('resize',setVh,{passive:true});
    return()=>window.removeEventListener('resize',setVh);
  },[]);

  // ── Scroll to top on stage change ──
  useEffect(()=>{
    window.scrollTo({top:0,behavior:'instant'});
  },[stage]);

  // ── Portal stars for generation screen ──
  useEffect(()=>{
    if(stage!=='generating')return;
    const container=document.getElementById('gen-portal-stars');if(!container)return;
    container.innerHTML='';
    const colours=['#F5B84C','#F4EFE8','#E8972A','#F5B84C','#F4EFE8','#9482ff'];
    for(let i=0;i<28;i++){const s=document.createElement('div');const sz=Math.random()<.3?2.2:Math.random()<.5?1.5:1;
      s.style.cssText=`position:absolute;border-radius:50%;width:${sz}px;height:${sz}px;left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*60).toFixed(1)}%;background:${colours[i%colours.length]};opacity:${(.3+Math.random()*.5).toFixed(2)};animation:genPortalStarTw ${(1.8+Math.random()*2.2).toFixed(1)}s ${(Math.random()*3).toFixed(1)}s ease-in-out infinite`;
      container.appendChild(s);}
  },[stage]);

  // ── Night Card camera effect ──
  useEffect(() => {
    if(ncPhotoMode !== 'camera' || ncPhoto) return;
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}}})
      .then(stream => {
        if(cancelled){ stream.getTracks().forEach(t=>t.stop()); return; }
        ncStreamRef.current = stream;
        if(ncVideoRef.current) ncVideoRef.current.srcObject = stream;
      })
      .catch(() => { if(!cancelled) setNcStep(2); });
    return () => { cancelled = true; ncStreamRef.current?.getTracks().forEach(t=>t.stop()); ncStreamRef.current=null; };
  },[stage,ncStep,ncPhoto]);

  // ── Night Card generation animation effect ──
  useEffect(() => {
    if (stage === 'nightcard' && ncStep === 1) {
      setNcGenTextIdx(0);
      setNcGenPct(0);
      const iv = setInterval(() => {
        setNcGenTextIdx(i => Math.min(i + 1, 3));
        setNcGenPct(p => Math.min(p + 18 + Math.random() * 8, 97));
      }, 700);
      return () => clearInterval(iv);
    }
  }, [stage, ncStep]);

  // ── Night Card bridge auto-advance ──
  useEffect(() => {
    if (stage === 'nightcard' && ncStep === -1) {
      const t = setTimeout(() => setNcStep(0), 2000);
      return () => clearTimeout(t);
    }
  }, [stage, ncStep]);

  // ── Night Card generation effect ──
  useEffect(() => {
    if(stage!=="nightcard" || ncStep!==1 || ncGenerating || ncResult) return;
    setNcGenerating(true);
    const name = book?.heroName||"";
    const bondingParts: string[] = [];
    if(ncBondingQ && ncBondingA.trim()) bondingParts.push(`Asked "${ncBondingQ}" — ${name} said: "${ncBondingA.trim()}"`);
    if(ncGratitude.trim()) bondingParts.push(`Best moment: "${ncGratitude.trim()}"`);
    if(ncExtra.trim()) bondingParts.push(`Note: "${ncExtra.trim()}"`);
    const bondingCtx = bondingParts.length ? `\nTonight: ${bondingParts.join(". ")}` : "";

    const moodCtx = ncChildMood ? `\nChild's mood tonight: ${ncChildMood}` : "";
    const ncPrompt = `You are writing a Night Card — a permanent emotional keepsake for a parent and child. This card will be reread months and years from now.

CHILD: ${name}
STORY: "${book?.title||""}"
REFRAIN: "${book?.refrain||""}"${bondingCtx}${moodCtx}

RULES:
1. HEADLINE: 3-6 words capturing the EMOTIONAL TRUTH of tonight — NOT the story title. It should make sense without knowing the story. Examples: "The night she chose brave." / "He couldn't stop laughing." / "Quiet, and so content."
2. QUOTE: Weave the child's actual words or the parent's observation into one poetic sentence (8-15 words). Feel like a scrapbook entry.
3. MEMORY_LINE: A warm, SPECIFIC sentence grounding this night in reality — reference what actually happened. Under 20 words.${ncBondingA.trim() ? ` MUST include something ${name} actually said or did.` : ""}
4. REFLECTION: A tender whisper from the parent to their future self. Private, specific. Under 12 words.
5. NEVER repeat the story title as the headline.
6. NEVER use generic phrases like "A magical night" or "Sweet dreams" or "A night to remember."

Return ONLY JSON: {"headline":"...","quote":"...","memory_line":"...","reflection":"...","emoji":"one emoji","tags":["theme1","theme2"]}`;
    const fallback = {
      headline:`A night with ${name}`,quote:book?.refrain||book?.title||"",
      memory_line:ncGratitude.trim()||ncBondingA.trim()||`A story just for ${name}.`,
      reflection:"What will you dream about tonight?",emoji:"🌙",tags:[] as string[],
    };
    callClaude([{role:"user",content:ncPrompt}],
      "Write Night Card keepsakes. The child's actual words and real moments are the most important input — prioritize them over story content. Be specific and personal, never generic. Return only JSON.", 400
    ).then(raw => {
      try {
        const parsed = extractJSON(raw);
        // Validate: headline must not be the story title
        if (parsed.headline && book?.title && parsed.headline.toLowerCase().replace(/[^a-z0-9]/g,'') === book.title.toLowerCase().replace(/[^a-z0-9]/g,'')) {
          parsed.headline = ncBondingA.trim() ? `The night ${name} said it all` : `A quiet night with ${name}`;
        }
        // Validate: memory_line must not duplicate headline
        if (parsed.memory_line && parsed.headline && parsed.memory_line === parsed.headline) {
          parsed.memory_line = ncGratitude.trim() || ncBondingA.trim() || undefined;
        }
        setNcResult(parsed);
      } catch(_) { setNcResult(fallback); }
      setNcGenPct(100);
      setTimeout(() => setNcStep(2), 400);
    }).catch(() => {
      setNcResult(fallback);
      setNcGenPct(100);
      setTimeout(() => setNcStep(2), 400);
    });
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
      try { const photo = await compressImage(file); updateExtraChar(charId,{photo}); } catch(e) { console.error('[Char] Photo compress failed:', e); }
    };
    inp.click();
  };

  const saveMemory = useCallback(async (bookData) => {
    const occ = occasionCustom || occasion;
    const storyId = uid();
    lastSavedStoryIdRef.current = storyId;
    const entry = {id:storyId,title:bookData.title,heroName:bookData.heroName,
      date:new Date().toISOString(),occasion:occ,bookData,
      characterIds: preloadedCharacter ? [preloadedCharacter.id] : [],
      refrain: bookData.refrain || ""};
    const next = [entry,...memories];
    setMemories(next);
    await sSet("memories",{items:next},userId);
    // Mirror to v2 user-scoped storage so UserDashboard can read it
    const uid2 = userId || 'guest';
    try {
      const v2Key = `ss2_stories_${uid2}`;
      const existing = JSON.parse(localStorage.getItem(v2Key) || "[]");
      const v2Entry = {
        id: entry.id, userId: uid2, title: entry.title,
        heroName: entry.heroName, characterIds: entry.characterIds,
        refrain: entry.refrain, date: entry.date,
        occasion: occ, bookData
      };
      localStorage.setItem(v2Key, JSON.stringify([v2Entry, ...existing]));
    } catch(e) { console.error('[Story] v2 localStorage save failed:', e); }
    // Save to Supabase so dashboard reads it
    if (userId) {
      try {
        await dbSaveStory({
          id: entry.id, userId, title: entry.title,
          heroName: entry.heroName, characterIds: entry.characterIds,
          refrain: entry.refrain, date: entry.date,
          occasion: occ, bookData,
          ageGroup: ageGroup || undefined,
          vibe: storyMood || storyBrief2?.split(' ')[0]?.toLowerCase() || undefined,
          theme: theme?.label || undefined,
          mood: storyMood || undefined,
          storyStyle: storyStyle || undefined,
          storyLength: storyLen || undefined,
          lessons: Array.isArray(lessons) && lessons.length > 0 ? lessons : undefined,
        });
        console.log('[Story] Saved to Supabase:', entry.id);
      } catch(e) { console.error('[Story] dbSaveStory failed:', e); }
    }
  },[memories,occasion,occasionCustom,userId,preloadedCharacter,ageGroup,storyMood,storyBrief2,theme,storyStyle,storyLen,lessons]);

  const deleteMemory = useCallback(async (id) => {
    const next = memories.filter(m => m.id!==id);
    setMemories(next);
    await sSet("memories",{items:next},userId);
  },[memories,userId]);

  const saveNightCard = useCallback(async (cardData) => {
    console.log('[NC] saveNightCard called with:', Object.keys(cardData));
    // Milestone + origin detection
    const totalAfter = nightCards.length + 1;
    const milestoneHit = [10,25,50,100,200,365].find(t => t === totalAfter);
    const isFirstCard = nightCards.length === 0;
    const entry = {id:uid(),...cardData,date:new Date().toISOString().split("T")[0],
      ...(milestoneHit ? {milestone:milestoneHit} : {}),
      ...(isFirstCard ? {isOrigin:true} : {})};
    // Ensure headline is never empty
    if (!entry.headline) entry.headline = entry.storyTitle || `A night with ${entry.heroName || 'friend'}`;
    const next = [entry,...nightCards];
    setNightCards(next);
    await sSet("nightcards",{items:next},userId);

    // Compute streak + night number for new fields
    const charCards = nightCards.filter(c => preloadedCharacter && c.characterIds?.includes(preloadedCharacter.id));
    const nightNum = Math.min((charCards.length + 1), 7); // current night in 7-night arc
    const occasionVal = (occasionCustom || occasion || "").trim();

    // Calculate current streak
    let streakVal = 1;
    const sortedDates = [...new Set(nightCards.map(c => c.date?.split?.("T")?.[0]).filter(Boolean))].sort().reverse();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      streakVal = 1;
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const cur = new Date(sortedDates[i]);
        const prev = new Date(sortedDates[i + 1]);
        const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
        if (diff <= 1) streakVal++;
        else break;
      }
    }

    // Mirror to v2 user-scoped storage
    const ncUid = userId || 'guest';
    try {
      const v2Key = `ss2_nightcards_${ncUid}`;
      const existing = JSON.parse(localStorage.getItem(v2Key) || "[]");
      const v2Entry = {
        id: entry.id, userId: ncUid,
        heroName: entry.heroName || cardData.heroName || "",
        storyTitle: entry.storyTitle || "",
        characterIds: preloadedCharacter ? [preloadedCharacter.id] : [],
        headline: entry.headline || "",
        quote: entry.quote || entry.bondingA || "",
        memory_line: entry.memory_line || "",
        bondingQuestion: entry.bondingQ || "",
        bondingAnswer: entry.bondingA || "",
        gratitude: entry.gratitude || "",
        extra: entry.extra || "",
        photo: entry.photo || null,
        emoji: entry.emoji || "🌙",
        date: entry.date,
        childMood: entry.childMood || undefined,
        childAge: entry.childAge || undefined,
        bedtimeActual: entry.bedtimeActual || undefined,
        tags: entry.tags || undefined,
        milestone: entry.milestone || undefined,
        whisper: entry.whisper || undefined,
        audioClip: entry.audioClip || undefined,
        childDrawing: entry.childDrawing || undefined,
      };
      localStorage.setItem(v2Key, JSON.stringify([v2Entry, ...existing]));
    } catch(e) { console.error('SleepSeedCore v2 localStorage save failed:', e); }
    // Detect journey chapter context from book metadata (set by App.tsx chapterToBookData)
    const bookAny = book as Record<string, unknown> | null;
    const isJourneyChapter = !!(bookAny?._isJourneyChapter);
    const journeyReadNumber = bookAny?._readNumber as number | undefined;

    // Save to Supabase
    if (userId) {
      try {
        const dbCard = {
          id: entry.id, userId,
          storyId: lastSavedStoryIdRef.current || undefined,
          heroName: entry.heroName || cardData.heroName || "",
          storyTitle: entry.storyTitle || "",
          characterIds: preloadedCharacter ? [preloadedCharacter.id] : [],
          headline: entry.headline || "",
          quote: entry.quote || entry.bondingAnswer || entry.bondingA || "",
          memory_line: entry.memory_line || undefined,
          whisper: entry.whisper || undefined,
          bondingQuestion: entry.bondingQuestion || entry.bondingQ || undefined,
          bondingAnswer: entry.bondingAnswer || entry.bondingA || undefined,
          gratitude: entry.gratitude || undefined,
          extra: entry.extra || undefined,
          photo: entry.photo || undefined,
          emoji: entry.emoji || "🌙",
          date: entry.date,
          isOrigin: entry.isOrigin || undefined,
          occasion: occasionVal || undefined,
          streakCount: streakVal,
          nightNumber: isJourneyChapter && journeyReadNumber ? journeyReadNumber : nightNum,
          creatureEmoji: companionCreature?.creatureEmoji || entry.emoji || "🌙",
          creatureColor: companionCreature?.color || undefined,
          ...(isJourneyChapter && journeyReadNumber ? { lessonTheme: `Read ${journeyReadNumber} of 7` } : {}),
          // Phase 1 enrichment fields
          childMood: entry.childMood || undefined,
          childAge: entry.childAge || undefined,
          parentReflection: entry.parentReflection || undefined,
          bedtimeActual: entry.bedtimeActual || undefined,
          tags: entry.tags || undefined,
          milestone: entry.milestone || undefined,
          audioClip: entry.audioClip || undefined,
          childDrawing: entry.childDrawing || undefined,
        };
        console.log('[NC] Saving to Supabase:', dbCard.id, dbCard.headline);
        await dbSaveNightCard(dbCard);
        console.log('[NC] Supabase save complete');
      } catch(e) { console.error('[NC] dbSaveNightCard FAILED:', e); }
    } else {
      console.warn('[NC] No userId — skipping Supabase save');
    }
    return entry;
  },[nightCards,userId,preloadedCharacter,companionCreature,occasion,occasionCustom]);

  // ── Night card camera helpers ──
  const ncOpenCamera = async (mode?: 'user' | 'environment') => {
    const facing = mode || ncFacing;
    if (ncCamStreamRef.current) ncCamStreamRef.current.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
      ncCamStreamRef.current = stream;
      setNcFacing(facing);
      setNcCameraOpen(true);
      setTimeout(() => { if (ncCamVideoRef.current) { ncCamVideoRef.current.srcObject = stream; ncCamVideoRef.current.play(); } }, 50);
    } catch {
      // Camera unavailable — fall back to file picker
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = (e: any) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setNcPhoto(ev.target?.result as string); reader.readAsDataURL(file); };
      input.click();
    }
  };
  const ncCapturePhoto = () => {
    if (!ncCamVideoRef.current) return;
    const video = ncCamVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    if (ncCamStreamRef.current) { ncCamStreamRef.current.getTracks().forEach(t => t.stop()); ncCamStreamRef.current = null; }
    setNcCameraOpen(false);
    setNcPhoto(dataUrl);
  };
  const ncCloseCamera = () => {
    if (ncCamStreamRef.current) { ncCamStreamRef.current.getTracks().forEach(t => t.stop()); ncCamStreamRef.current = null; }
    setNcCameraOpen(false);
  };
  const ncFlipCamera = () => ncOpenCamera(ncFacing === 'user' ? 'environment' : 'user');
  // Clean up camera on unmount
  useEffect(() => () => { if (ncCamStreamRef.current) ncCamStreamRef.current.getTracks().forEach(t => t.stop()); }, []);

  const deleteNightCard = useCallback(async (id) => {
    const next = nightCards.filter(c => c.id!==id);
    setNightCards(next);
    await sSet("nightcards",{items:next});
  },[nightCards]);

  /* ══ GENERATE ══ */
  const generate = async (overrides:any={}) => {
    if (generatingRef.current) return;
    generatingRef.current = true;

    // ── Demo mode: instant hardcoded story ──
    const isDemo = (() => { try { return sessionStorage.getItem('sleepseed_demo') === '1'; } catch { return false; } })();
    if (isDemo) {
      try {
        const { DEMO_STORY } = await import('./lib/demo-story');
        const name = overrides.heroNameOverride || heroName.trim() || 'Adina';
        setGen({stepIdx:0,progress:10,label:'Writing tonight\'s story…',error:null});
        await new Promise(r => setTimeout(r, 800));
        setGen(g => ({...g,stepIdx:1,progress:50,label:'Adding the magic…'}));
        await new Promise(r => setTimeout(r, 600));
        setGen(g => ({...g,stepIdx:2,progress:80,label:'Your book is ready!'}));
        await new Promise(r => setTimeout(r, 400));
        const bookData = {
          title: DEMO_STORY.title,
          heroName: name,
          allChars: [
            {id:'hero',name,type:'hero',photo:null,classify:'',gender:''},
            ...(companionCreature ? [{id:companionCreature.id,name:companionCreature.name,type:'creature',photo:null,classify:companionCreature.creatureType,gender:''}] : []),
          ],
          refrain: DEMO_STORY.refrain,
          pages: DEMO_STORY.pages.map(p => ({text:p.text})),
        };
        setBook(bookData); setPageIdx(0);
        setGen(g => ({...g,stepIdx:4,progress:100,label:'Your story is ready!'}));
        await new Promise(r => setTimeout(r, 800));
        setStage('book');
        generatingRef.current = false;
        return;
      } catch(e) { console.error('[Demo] Fallback to live generation:', e); }
    }
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
    setNcBondingSaved(false); setNcBondingA(""); setBondingAnswered(false); setBondingReaction('');
    setNcChildMood(""); setNcGratitude(""); setNcExtra(""); setNcPhoto(null); setNcResult(null); setNcGenerating(false);
    const name = overrides.heroNameOverride || heroName.trim();
    const seed = makeStorySeed(name,resolvedTheme,resolvedChars,resolvedOcc,resolvedOccCust,Array.isArray(resolvedLesson)?resolvedLesson.join("|"):resolvedLesson,resolvedAdv,resolvedLen,heroGender,heroClassify,resolvedGuidance);
    const bKey = `book_${seed}`;
    const mk = (n,st="p") => Array.from({length:n},()=>st);

    // Clear cached story so a fresh one is always generated
    try { await sDel(bKey); } catch(_) {}

    setGen({stepIdx:0,progress:6,label:"Writing a brand new story…",dots:[]});

    try {
      // Cache disabled — always generate fresh stories
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
        } catch(e) { console.error('[Gen] Character description failed:', e); }
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

      const noChildHeroEarly = builderChoices?.path === 'free' && builderChoices?.childIsHero === false;
      const bcCreatureNamesEarly = new Set((builderChoices?.chars || []).filter(c => c.type === 'creature').map(c => c.name));
      const charsForCtx = allChars.filter(c => {
        if (noChildHeroEarly && c.type === 'hero') return false;
        if (c.type === 'creature' && c.name && !bcCreatureNamesEarly.has(c.name)) return false;
        return true;
      });
      const charCtx = charsForCtx.map(c => {
        const desc = visualDescs[c.id] ? ` — appearance: ${visualDescs[c.id]}` : "";
        const cls = c.classify ? `, a ${c.classify}` : "";
        const pro = pronouns(c.gender);
        const proStr = pro ? ` (${pro})` : "";
        const voice = c.classify && classifyVoice[c.classify] ? `\n  Voice/manner: ${classifyVoice[c.classify]}` : "";
        const isFreeHero = builderChoices?.path === 'free' && c.type === 'hero';
        const typeLabel = c.type==="hero" ? (isFreeHero ? "the main character and hero of the story" : "the hero — the child this story belongs to")
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
      const occasionNarrative: Record<string, string> = {
        'hard_day': `This child had a hard day. The story should: acknowledge difficulty honestly (Mirror), validate the feeling without minimizing (Validate), offer a small shift — not a fix (Move), and land on "you are not alone" not "everything is fine" (Rest). The supporting figure listens before speaking. Never say "don't worry" or "it will be fine."`,
        'birthday': `It's the child's birthday. The world should notice they are special today. Small magic, warmth, celebration. The story should feel like a gift — not a party, but a quiet recognition that today matters.`,
        'missing_someone': `The child is missing someone. Acknowledge the absence honestly. The creature or a detail in the story carries something that belongs to the missing person. Memory as comfort — not replacement, not "they're always with you" platitudes.`,
        'big_win': `The child achieved something today. The world should reflect pride back — not loudly, but genuinely. The creature witnessed the achievement. The story lands on earned rest after effort.`,
        'proud_moment': `Something made the child proud today. The story should mirror that feeling — quiet internal pride, not external celebration. The protagonist discovers something about themselves.`,
        'first_day': `The child faced something new today. The unfamiliar made navigable. The creature serves as an anchor in strangeness. New places revealing friendly details one at a time.`,
        'feeling_sick': `The child isn't feeling well. Smallness and comfort. The world comes to the child — they don't have to go anywhere. Gentleness at maximum. Warm, soft, held.`,
        'new_home': `The child is adjusting to a new home. The unfamiliar slowly revealing friendly details. The creature exploring alongside — discovering together that new can become ours.`,
      };
      const occNarr = occasionFinal ? (occasionNarrative[occasionFinal] || '') : '';
      const occLine = occasionFinal
        ? `\nSPECIAL OCCASION: ${occasionFinal}${occNarr ? `\n${occNarr}` : ''}`
        : "";
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
        ? `Name: ${autoTheme.label}\nEssence: ${autoTheme.value.split("\n")[0].replace(/^SETTING:\s*/,"")}\nEmotional core: ${autoTheme.value.includes("magic is SECRETS") ? "wonder and discovery" : autoTheme.value.includes("magic is PARALLEL") ? "belonging and curiosity" : autoTheme.value.includes("magic is TRANSITION") ? "possibility and change" : autoTheme.value.includes("magic is SCALE") ? "courage and perspective" : autoTheme.value.includes("magic is HIDDEN ORDER") ? "patience and attention" : autoTheme.value.includes("magic is TRANSFORMATION") ? "creativity and play" : "safety and warmth"}\nRules: The world is a character — it has personality, agency, and opinions. It responds to the protagonist.\n\nFull setting detail:\n${autoTheme.value}\n\nSet the entire story in this real-world place. Ground it in what a child knows — then make it delightfully surprising. The setting is active: things in it talk, move, have opinions, and cause problems. It is not a backdrop.`
        : `SETTING SELECTION: Based on the characters, occasion, lessons, and story guidance provided, choose the single most fitting setting from the real-world options below. Pick the one where this specific story will feel most vivid, surprising, and natural. The chosen setting must be a character — not a backdrop but a participant with its own personality, rules, and agency.\n\nFor the chosen setting, treat it as:\n- Name: [setting name]\n- Essence: [what makes it specific]\n- Emotional core: [the feeling it carries]\n- Rules: what works differently here, what it notices, how it responds to the protagonist\n\nAVAILABLE SETTINGS:\n${THEMES.map((t,i)=>{ const lines=t.value.split("\n"); const mechanism=lines.find(l=>l.includes("magic is ")||l.includes("This setting")); return `${i+1}. ${t.label}: ${lines[0]}${mechanism?" | "+mechanism.trim():""}`;}).join("\n")}`;
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
      // resolvedMood can be a vibe key (warm-funny, calm-cosy, etc.) or a short keyword (calm, silly, etc.)
      const moodGenreMap: Record<string, string> = {
        'silly': 'comedy', 'warm-funny': 'comedy',
        'exciting': 'adventure',
        'heartfelt': 'therapeutic',
        'calm': 'cosy', 'calm-cosy': 'cosy',
        'mysterious': 'wonder',
      };
      const genreFromMood = moodGenreMap[resolvedMood]
        || (resolvedAdv ? "adventure" : null)
        || (resolvedStyle === "mystery" ? "mystery" : null)
        || "cosy";

      // ── Build situation from brief (mode-aware, no mangling) ─────────────
      const isFreePath = builderChoices?.path === 'free';
      const situationParts = [
        brief1Safe
          ? (isFreePath
              ? `STORY DIRECTIVE: "${brief1Safe}"`
              : `${name} is ${brief1Safe}`)
          : "",
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
      const noChildHero = isFreePath && builderChoices?.childIsHero === false;

      const storyBrief = {
        genre: genreFromMood,
        situation: noChildHero
          ? `STORY DIRECTIVE (the child is NOT a character — follow the user's vision): "${brief1Safe || 'a bedtime story'}"`
          : situation,
        protagonistName: noChildHero ? undefined : name,
        protagonistAge: noChildHero ? undefined : ageCfg.label.replace("Age ","").split("–")[0],
        weirdDetail: noChildHero ? undefined : (resolvedTraits.length ? `${name} is ${resolvedTraits.join(", ")}` : undefined),
        want: noChildHero ? undefined : (brief1Safe
          ? (isFreePath ? brief1Safe : `${name} is ${brief1Safe}`)
          : undefined),
        supportingName: supportChar?.name || (supportChar ? capitalize(supportChar.type) : undefined),
        supportingDetail: supportChar?.classify ? classifyVoice[supportChar.classify] : undefined,
        targetFeeling: ({
          'comedy': 'warm and delighted — the reader should be grinning at the last line',
          'adventure': 'satisfied and brave — the journey earned, the protagonist changed',
          'wonder': 'wonderstruck — one beautiful question the reader carries with them',
          'cosy': 'safe, held, and exactly where they belong',
          'therapeutic': 'deeply seen, gently held, and not alone — feeling is survivable',
          'mystery': 'the click of understanding — the last piece falls into place',
        } as Record<string, string>)[genreFromMood] || 'emotionally complete — the story earned its ending',
        finalLineApproach: ({
          'comedy': 'moment', 'adventure': 'image', 'wonder': 'image',
          'cosy': 'sensation', 'therapeutic': 'sensation', 'mystery': 'image',
        } as Record<string, string>)[genreFromMood] || 'sensation',
        asChunks: false,
      };

      // ── Creature selection check (from BuilderChoices) ─────────────────
      const bcCreatureNames = new Set((builderChoices?.chars || []).filter(c => c.type === 'creature').map(c => c.name));

      // ── DreamKeeper data (needed by blueprint + prompt) ────────────────
      const dkVirtue = companionDk?.virtue || '';
      const dkVirtueDesc = companionDk?.virtueDescription || '';
      const dkPersonality = companionDk?.personalityTraits?.join(', ') || '';

      // ── Micro-blueprint: quick planning step before prose generation ────
      let blueprintCtx = '';
      try {
        const bpPrompt = `You are a bedtime story architect. Given tonight's story seed and context, create a micro-blueprint. You are NOT writing the story — you are planning structural bones so the storyteller writes a better story.

${noChildHero ? `STORY DIRECTIVE: "${brief1Safe}"` : `CHILD: ${name}, age ${ageCfg.label.replace("Age ","")}`}
${!noChildHero && brief1Safe ? `TONIGHT'S SEED: "${brief1Safe}"` : ''}
GENRE: ${genreFromMood}
${guidanceSafe ? `CHILD'S UNIQUE DETAIL: ${guidanceSafe}` : ''}
${resolvedTraits.length ? `PERSONALITY: ${resolvedTraits.join(', ')}` : ''}
${contextSafe ? `CURRENT SITUATION: ${contextSafe}` : ''}
${companionCreature?.name && dkVirtue ? `DREAMKEEPER: ${companionCreature.name} (${dkVirtue})` : ''}

VARIATION SEED: ${Math.random().toString(36).slice(2, 8)} (use this to ensure uniqueness)
CRITICAL: This story must feel COMPLETELY different from any other story. Different world logic, different opening, different emotional texture, different planted detail. Even if the prompt is similar to a previous one, the blueprint must produce a distinct story. Vary the opening — sometimes mid-action, sometimes dialogue, sometimes sensory, sometimes a question. NEVER use "[Name] had a rule" or "[Name] was the kind of..." or "There was a..." patterns.

Return ONLY this JSON — no explanation, no markdown:
{"planted_detail":"one small specific object or detail established early that solves/pays off at the end","flaw":"one lovable weakness (flip side of a strength) that creates tension","emotional_arc":"3 beats in under 15 words: start → middle → end","sensory_anchor":"one specific sensory detail that grounds this world","final_image":"the exact image or sensation the story should end on","opening_approach":"one of: mid-action, dialogue, sensory-detail, question, narrator-observation, world-description"}`;

        const bpRaw = await callClaude(
          [{role:"user",content:bpPrompt}],
          "You are a story architect. Return only valid JSON. Be wildly specific — not generic. Every detail must feel like it belongs to THIS story and no other. If two stories have the same prompt, they should have completely different worlds, planted details, and emotional textures.",
          500
        );
        const bp = extractJSON(bpRaw);
        if (bp?.planted_detail) {
          const parts = [
            bp.planted_detail ? `Planted detail (establish early, pay off at end): ${bp.planted_detail}` : '',
            bp.flaw && !noChildHero ? `${name}'s lovable flaw tonight: ${bp.flaw}` : '',
            bp.emotional_arc ? `Emotional arc: ${bp.emotional_arc}` : '',
            bp.sensory_anchor ? `Sensory anchor for this world: ${bp.sensory_anchor}` : '',
            bp.final_image ? `Final image (the story should end HERE): ${bp.final_image}` : '',
            bp.opening_approach ? `Opening approach: Start this story with a ${bp.opening_approach} — NOT with a character description or rule statement` : '',
          ].filter(Boolean);
          blueprintCtx = `\n━━━ STORY BLUEPRINT ━━━\n${parts.join('\n')}\nThese are structural guides — follow them but write freely within them.\n`;
        }
      } catch (e) {
        console.error('[Gen] Blueprint generation failed (continuing without):', e);
      }

      // Build system + user from the new prompts module
      const { system: promptSystem, user: promptUser } = buildStoryPrompt(storyBrief);

      // ── JSON output schema (app needs structured pages) ─────────────────
      const pgSchema = (n) => Array.from({length:n},()=>(
        '{"text":"[page text]","illustration_prompt":"[15-20 words: vivid scene, setting and action, no character names, Micha Archer folk-art paintable]"}'
      )).join(",");

      const simpleSchema = `{"title":"3-6 word title","cover_prompt":"[15-20 words: wide magical bedtime scene establishing the story world, cozy glowing folk-art atmosphere]","pages":[${pgSchema(totalN)}],"refrain":"4-8 word refrain from the story"}`;
      const advChoiceTarget = noChildHero ? 'the reader' : name;
      const advSchema = `{"title":"3-6 word title","cover_prompt":"[15-20 words: wide magical bedtime scene establishing the story world, cozy glowing folk-art atmosphere]","setup_pages":[${pgSchema(setupN)}],"choice":{"question":"exciting choice question for ${advChoiceTarget}","option_a_label":"4-7 words","option_b_label":"4-7 words"},"path_a":[${pgSchema(resN)}],"path_b":[${pgSchema(resN)}],"refrain":"4-8 word refrain from the story"}`;

      // ── DreamKeeper context (only if creature was selected by user) ────
      const creatureInCast = bcCreatureNames.size > 0;
      const dreamKeeperCtx = (companionCreature?.name && creatureInCast)
        ? `\n━━━ DREAMKEEPER COMPANION ━━━
Name: ${companionCreature.name} (a ${companionCreature.creatureType !== 'spirit' ? companionCreature.creatureType : 'magical creature'})${dkVirtue ? `\nVirtue: ${dkVirtue} — shown through ACTION, never named or explained` : ''}${dkVirtueDesc ? `\nHow the virtue looks: ${dkVirtueDesc}` : ''}${dkPersonality ? `\nPersonality in stories: ${dkPersonality}` : ''}${companionCreature.dreamAnswer ? `\nDreams about: ${companionCreature.dreamAnswer}` : ''}
Role: The DreamKeeper is ${name}'s companion. It should feel like a real relationship — not a mascot.
Rules: Show the virtue through specific actions. Never name the virtue. Never lecture. The creature has its own wants and quirks. It is warm but not perfect.\n`
        : '';

      // ── Assemble final prompt with characters + age + JSON output ───────
      const storyPrompt = `${promptUser}

━━━ READER AGE ━━━
${ageLine}

━━━ CHARACTERS ━━━
${charCtx}
${dreamKeeperCtx}${blueprintCtx}
━━━ WORLD ━━━
${worldLine}

━━━ OCCASION AND CONTEXT ━━━${guidLine}${occLine}${lesLine}${moodLine}${paceLine}${styleLine}${traitLine}

${resolvedAdv
  ? `CHOOSE-YOUR-ADVENTURE FORMAT:\nWrite ${setupN} setup pages, then a choice moment, then ${resN} resolution pages per path. Both paths must reach a satisfying, emotionally complete ending.`
  : `STORY SHAPE: Write EXACTLY ${totalN} pages. Not ${totalN-1}, not ${totalN+1}. Exactly ${totalN}.`}

━━━ OUTPUT ━━━
Return ONLY this exact JSON object. No extra text, no markdown, no explanation. Title must be 3-6 words. Each illustration_prompt must be 10-15 words (visual details added automatically by the system).
${resolvedAdv ? advSchema : simpleSchema}`;

      // Simulate smooth progress during API call (26% -> ~72%)
      const progTimer = setInterval(() => {
        setGen(g => {
          if (g.progress >= 72) { clearInterval(progTimer); return g; }
          return {...g, progress: Math.min(72, g.progress + 1.2)};
        });
      }, 1800);
      let raw;
      try {
        raw = await callClaude(
          [{role:"user",content:storyPrompt}],
          promptSystem,
          4096
        );
      } finally { clearInterval(progTimer); }

      const story = extractJSON(raw);

      // ── Validate response structure before rendering ──
      const validPages = (arr: any) => Array.isArray(arr) && arr.length > 0 &&
        arr.every((p: any) => p && typeof (typeof p === 'string' ? p : p.text) === 'string' && (typeof p === 'string' ? p : p.text).trim().length > 0);
      const normPages = (arr: any[]) => arr.map((p: any) => typeof p === 'string' ? { text: p } : p);

      if (!story || typeof story !== 'object') throw new Error("Response was not a valid story object");
      if (!story.title || typeof story.title !== 'string') throw new Error("Response missing title");
      if (resolvedAdv) {
        if (!validPages(story.setup_pages)) throw new Error("Response missing adventure setup pages");
        if (!validPages(story.path_a)) throw new Error("Response missing adventure path A");
        if (!validPages(story.path_b)) throw new Error("Response missing adventure path B");
        story.setup_pages = normPages(story.setup_pages);
        story.path_a = normPages(story.path_a);
        story.path_b = normPages(story.path_b);
      } else {
        if (!validPages(story.pages)) throw new Error("Response missing pages — the story was incomplete");
        story.pages = normPages(story.pages);
      }

      // ── Quality gate: structural auto-fail check ──────────────────────
      try {
        const storyText = resolvedAdv
          ? [...(story.setup_pages||[]), ...(story.path_a||[])].map(p => p.text).join('\n')
          : (story.pages||[]).map((p:any) => p.text).join('\n');
        const qcPrompt = `Review this bedtime story against these structural criteria. Score each 0 or 1. Return ONLY JSON.

STORY:
"""
${storyText.slice(0, 3000)}
"""

{"protagonist_solves":1_or_0,"no_named_lesson":1_or_0,"earned_ending":1_or_0,"structural_pass":true_or_false}

Rules:
- protagonist_solves: The protagonist (or story's main character) solves their own problem — NOT an adult who arrives and fixes it. Score 1 if yes.
- no_named_lesson: The ending is an image, sensation, or moment — NOT a stated moral like "and they learned that..." Score 1 if yes.
- earned_ending: The emotional weight of the ending matches what the story earned — not happier or sadder than warranted. Score 1 if yes.
- structural_pass: true if ALL three scores are 1, false if ANY is 0.`;

        const qcRaw = await callClaude(
          [{role:"user",content:qcPrompt}],
          "You are a story quality reviewer. Return only valid JSON. Be strict.",
          300
        );
        const qc = extractJSON(qcRaw);

        if (qc && qc.structural_pass === false) {
          console.warn('[Gen] Quality check failed, regenerating:', qc);
          setGen(g => ({...g, progress: 75, label: "Polishing the story..."}));
          const failReasons = [
            qc.protagonist_solves === 0 ? 'The protagonist must solve their own problem — no adult rescue.' : '',
            qc.no_named_lesson === 0 ? 'End on an image or sensation, not a stated moral.' : '',
            qc.earned_ending === 0 ? 'The ending emotional weight must match what the story earned.' : '',
          ].filter(Boolean).join(' ');

          const retryRaw = await callClaude(
            [{role:"user",content:`${storyPrompt}\n\n━━━ REVISION REQUIRED ━━━\nThe previous attempt had these issues: ${failReasons}\nFix ONLY these problems. Keep everything else. Return the corrected JSON.`}],
            promptSystem,
            4096
          );
          const retryStory = extractJSON(retryRaw);
          if (retryStory && retryStory.title) {
            if (resolvedAdv) {
              if (validPages(retryStory.setup_pages)) story.setup_pages = normPages(retryStory.setup_pages);
              if (validPages(retryStory.path_a)) story.path_a = normPages(retryStory.path_a);
              if (validPages(retryStory.path_b)) story.path_b = normPages(retryStory.path_b);
            } else if (validPages(retryStory.pages)) {
              story.pages = normPages(retryStory.pages);
            }
            story.title = retryStory.title || story.title;
            story.refrain = retryStory.refrain || story.refrain;
          }
        }
      } catch (e) {
        console.error('[Gen] Quality check failed (continuing with original):', e);
      }

      setGen(g => ({...g,stepIdx:2,progress:80,label:"Your book is ready!"}));

      // Build book data — SVG scenes provide illustrations (no Pollinations calls)
      // Filter cast for display: respect childIsHero and creature toggles
      const displayChars = allChars.filter(c => {
        if (noChildHero && c.type === 'hero') return false;
        if (c.type === 'creature' && c.name && !bcCreatureNames.has(c.name)) return false;
        return true;
      });
      let bookData;

      if(resolvedAdv && story.setup_pages){
        bookData = {
          title:story.title,heroName:name,allChars:displayChars,isAdventure:true,
          refrain:story.refrain||"",
          setup_pages:story.setup_pages.map(p => ({text:p.text})),
          choice:story.choice,
          path_a:story.path_a.map(p => ({text:p.text})),
          path_b:story.path_b.map(p => ({text:p.text})),
        };
      } else {
        bookData = {
          title:story.title,heroName:name,allChars:displayChars,
          refrain:story.refrain||"",
          pages:story.pages.map(p => ({text:p.text})),
        };
      }

      // Book data ready — show "ready" state on gen screen, then auto-advance
      setBook(bookData); setPageIdx(0);
      setGen(g => ({...g,stepIdx:4,progress:100,label:"Your story is ready!"}));
      // Auto-advance to book after 1.2s — no button needed
      await new Promise(r => setTimeout(r,1200));
      setStage("book");
      sSet(bKey,bookData).catch(()=>{});

      // ── Auto-save story to library ────────────────────────────────────
      try { await saveMemory(bookData); } catch(e) { console.error('[Story] saveMemory failed:', e); }

    } catch(e) {
      console.error("SleepSeed error:",e);

      // ── Ritual fallback: silently use a pre-written story instead of showing error ──
      if (builderChoices?.path === 'ritual') {
        const name = heroName || builderChoices?.heroName || 'dreamer';
        const creatureName = companionCreature?.name || 'the DreamKeeper';
        const creatureEmoji = companionCreature?.creatureEmoji || '\uD83E\uDD5A';
        const fallbackBooks: Record<string, any> = {
          night1: {
            title: `The Night ${name} Was Chosen`,
            heroName: name, creatureName, creatureEmoji,
            pages: [
              { text: `Long before ${name} was born, the DreamKeepers watched over the sleeping world. They waited in the spaces between stars \u2014 patient, quiet, listening.` },
              { text: `Each DreamKeeper chooses only one child. Not the loudest, or the bravest, or the cleverest. The one whose dreams sound like music they\u2019ve been waiting to hear.` },
              { text: `And tonight \u2014 after all that waiting \u2014 one of them heard ${name}. Something ${name} said. Something small and true. And the egg began to glow.` },
              { text: `${creatureName} nodded slowly. \u201cThis is the one,\u201d it whispered. \u201cI\u2019ve been listening for a very long time. And now I\u2019ve found you.\u201d` },
              { text: `This is the night it all began. The night ${name} was chosen. And ${creatureName} will never forget it.` },
            ],
          },
          night2: {
            title: `The Night the Dreamlight Burned Brighter`,
            heroName: name, creatureName, creatureEmoji,
            pages: [
              { text: `Deep beneath the dreaming world, there\u2019s a light. Not a candle, not a star \u2014 something older. They call it the Dreamlight.` },
              { text: `It keeps the dreams of every sleeping child warm. It\u2019s been burning for a thousand years. But tonight, it\u2019s flickering.` },
              { text: `The Dreamlight goes out when children forget the gifts inside them. The things that make them who they are. The things only they can do.` },
              { text: `But ${name} hasn\u2019t forgotten. ${name} shared something tonight \u2014 something real and true. And that gift is exactly what the Dreamlight needs.` },
              { text: `${name} stood before the Dreamlight and shared the gift. And the flame burned brighter than it had in years. Something inside the egg heard \u2014 and began to wake up.` },
            ],
          },
        };
        // Determine which ritual night we're on based on the ritual seed content
        const isNight2 = builderChoices.brief?.includes('really good at') || builderChoices.brief?.includes('Dreamlight');
        const fb = isNight2 ? fallbackBooks.night2 : fallbackBooks.night1;
        console.warn('[SleepSeed] Using ritual fallback story due to generation error');
        setBook(fb);
        setPageIdx(0);
        setFromCache(true);
        setGen(g => ({...g, stepIdx: 4, progress: 100, label: 'Your story is ready!'}));
        await new Promise(r => setTimeout(r, 800));
        setStage('book');
        try { await saveMemory(fb); } catch {}
        return; // skip the normal error flow
      }

      const msg = e.message||"Something went wrong";
      const isParseErr = msg.toLowerCase().includes("json")||msg.toLowerCase().includes("parse")||msg.toLowerCase().includes("missing");
      const isTimeout = msg.toLowerCase().includes("server error")||msg.toLowerCase().includes("timed out")||msg.toLowerCase().includes("timeout")||msg.toLowerCase().includes("502")||msg.toLowerCase().includes("504");
      const isNetwork = msg.toLowerCase().includes("network error")||msg.toLowerCase().includes("failed to fetch")||msg.toLowerCase().includes("could not reach");
      const isOverloaded = msg.includes("529")||msg.includes("503")||msg.toLowerCase().includes("overloaded");
      const userMsg = msg.includes("ANTHROPIC_KEY")
        ? "API key not set — check your Vercel environment variables."
        : isOverloaded
          ? "The AI is busy right now — please wait a moment and try again."
          : isNetwork
            ? "Could not connect to the server — check your internet and tap Try Again."
          : isTimeout
            ? "The story took too long to generate — tap Try Again (it usually works on the second attempt)."
          : isParseErr
            ? "The story response was incomplete — your settings are saved. Tap Try Again."
          : "Something went wrong — your settings are saved. Tap Try Again.";
      setError(userMsg);
      setLastErrStage(stage==="builder" ? "builder" : "quick");
      setStage("error");
    } finally {
      generatingRef.current = false;
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
    window.scrollTo({top:0,behavior:'instant'});
    navigator.vibrate?.(5);
  };

  // ── Sparkle emitter (appends to reader container) ──
  const SPARKLE_COLORS_SS = ['#F5B84C','#9482ff','#14d890','#F5B84C','#9482ff','#14d890','#F5B84C','#9482ff'];
  const emitSparklesSS = useCallback(() => {
    const el = ssReaderRef.current;
    if (!el) return;
    const cx = el.offsetWidth / 2;
    const cy = el.offsetHeight / 2;
    for (let i = 0; i < 8; i++) {
      const spark = document.createElement('div');
      spark.className = 'ss-sparkle';
      const angle = (i / 8) * Math.PI * 2;
      const dist = 30 + Math.random() * 30;
      spark.style.cssText = `left:${cx}px;top:${cy}px;background:${SPARKLE_COLORS_SS[i]};--sx:${Math.cos(angle)*dist}px;--sy:${Math.sin(angle)*dist}px`;
      el.appendChild(spark);
      setTimeout(() => spark.remove(), 700);
    }
  }, []);

  // Emit sparkles on page change
  useEffect(() => { if (stage === 'book' && pageIdx > 0) emitSparklesSS(); }, [pageIdx, stage]); // eslint-disable-line

  // ── Chrome auto-fade on story pages ──
  const resetSSChromeFade = useCallback(() => {
    setSsChromeVis(true);
    if (ssChromeFadeRef.current) clearTimeout(ssChromeFadeRef.current);
    ssChromeFadeRef.current = setTimeout(() => setSsChromeVis(false), 3500);
  }, []);

  // ── Swipe gesture on reader ──
  useEffect(() => {
    const el = ssReaderRef.current;
    if (!el || stage !== 'book') return;
    const onTS = (e: TouchEvent) => { ssTouchStartX.current = e.touches[0].clientX; resetSSChromeFade(); };
    const onTE = (e: TouchEvent) => {
      const delta = e.changedTouches[0].clientX - ssTouchStartX.current;
      if (Math.abs(delta) > 45) { if (delta < 0) goPage(1); else goPage(-1); }
    };
    el.addEventListener('touchstart', onTS, { passive: true });
    el.addEventListener('touchend', onTE);
    return () => { el.removeEventListener('touchstart', onTS); el.removeEventListener('touchend', onTE); };
  }, [stage, goPage, resetSSChromeFade]);

  // v8r: idle nudge on page change
  useEffect(() => {
    if (v8rIdleTimer) clearTimeout(v8rIdleTimer);
    const el = document.getElementById('v8rIdleNudge');
    if (el) el.style.animation = 'none';
    const t = setTimeout(() => {
      const nudge = document.getElementById('v8rIdleNudge');
      if (nudge) nudge.style.animation = 'v8r-nudgePulse 1.2s ease-in-out 2';
    }, 5000);
    setV8rIdleTimer(t);
    return () => clearTimeout(t);
  }, [pageIdx]);

  // v8r: creature reacts to story content
  useEffect(() => {
    if (!book?.pages) return;
    const page = book.pages[pageIdx - 2];
    if (!page?.text) return;
    const t = page.text.toLowerCase();
    if (/roar|crash|burst|leap|fly|shout|race|explode|sudden|gasp|wow|amazing/i.test(t)) {
      setV8rCreatureAnim('bounce');
      setTimeout(() => setV8rCreatureAnim('idle'), 1200);
    } else if (/sparkle|glow|shine|magic|wish|star|shimmer|light|golden/i.test(t)) {
      setV8rCreatureAnim('sparkle');
      setTimeout(() => setV8rCreatureAnim('idle'), 1000);
    } else if (/warm|soft|gentle|quiet|still|sleep|dream|hush|curl|safe|snug/i.test(t)) {
      setV8rCreatureAnim('wiggle');
      setTimeout(() => setV8rCreatureAnim('idle'), 900);
    } else {
      setV8rCreatureAnim('idle');
    }
  }, [pageIdx, book]);

  // v8r: ambient sound functions
  const v8rStartAmbient = () => {
    try {
      if (!v8rAudioCtxRef.current) v8rAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = v8rAudioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const master = ctx.createGain();
      master.gain.setValueAtTime(.055, ctx.currentTime);
      master.connect(ctx.destination);
      const drone = ctx.createOscillator();
      drone.type = 'sine'; drone.frequency.value = 55;
      const dGain = ctx.createGain(); dGain.gain.value = .3;
      drone.connect(dGain); dGain.connect(master); drone.start();
      const pingIv = setInterval(() => {
        if (!v8rAmbientNodesRef.current.gain) return;
        const ping = ctx.createOscillator(); ping.type = 'sine';
        ping.frequency.value = [523, 659, 784, 1047][Math.floor(Math.random() * 4)];
        const pGain = ctx.createGain();
        pGain.gain.setValueAtTime(0, ctx.currentTime);
        pGain.gain.linearRampToValueAtTime(.038, ctx.currentTime + .06);
        pGain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 2.5);
        ping.connect(pGain); pGain.connect(master); ping.start(); ping.stop(ctx.currentTime + 2.5);
      }, 4000 + Math.random() * 5000);
      v8rAmbientNodesRef.current = { osc: drone, gain: master, intervals: [pingIv] };
    } catch {}
  };

  const v8rStopAmbient = () => {
    const n = v8rAmbientNodesRef.current;
    n.intervals?.forEach(clearInterval);
    try { n.osc?.stop(); } catch {}
    n.gain?.disconnect();
    v8rAmbientNodesRef.current = {};
    try { v8rAudioCtxRef.current?.suspend(); } catch {}
  };

  // v8r: start/stop ambient
  useEffect(() => {
    if (v8rAmbientOn) v8rStartAmbient();
    else v8rStopAmbient();
    return v8rStopAmbient;
  }, [v8rAmbientOn]); // eslint-disable-line

  // v8r: stop ambient on unmount
  useEffect(() => {
    return () => v8rStopAmbient();
  }, []); // eslint-disable-line

  // v8r: golden seed on end page
  useEffect(() => {
    if (pageIdx === totalPages - 1 && !v8rGoldenSeed) {
      setV8rGoldenSeed(true);
      navigator.vibrate?.([10, 50, 20]);
    }
  }, [pageIdx, totalPages, v8rGoldenSeed]);

  // Helper functions for night card actions
  async function shareNightCard(includeStory = false) {
    if(!ncResult) return;
    // Use the last saved night card ID for the share link
    const ncId = lastSavedStoryIdRef.current || '';
    const shareUrl = ncId ? `${BASE_URL}/?nc=${ncId}` : BASE_URL;
    const storyLine = includeStory && book?.title ? `\nFrom "${book.title}" — a story for ${book.heroName}` : '';
    const shareText = `"${ncResult.headline}"\n${ncResult.quote}${storyLine}`;
    try { await navigator.share?.({title:`${book?.heroName}'s Night Card`,text:shareText,url:shareUrl}); }
    catch(_) { navigator.clipboard?.writeText(`${shareText}\n\n${shareUrl}`).then(()=>{}).catch(()=>{}); }
  }
  function saveAndExitNc() {
    setStage('home'); setBook(null);
    setNcStep(0); setNcResult(null); setNcPhoto(null);
    setNcBondingA(''); setNcGratitude(''); setNcExtra('');
    setShareToLibrary(false); setStoryRating(null); setNcPhotoMode('idle');
  }
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

  // v8r: nightfall progress
  const v8rNightProgress = totalPages <= 2 ? 0 : Math.min((pageIdx - 1) / (totalPages - 2), 1);
  const v8rTextBg = `rgb(${Math.round(6 - v8rNightProgress * 3)},${Math.round(9 - v8rNightProgress * 3)},${Math.round(18 - v8rNightProgress * 2)})`;
  const v8rStarOpacity = v8rNightProgress * 0.35;

  const isLastPage  = pageIdx===totalPages-1;
  const isStoryPage = book&&pageIdx>=2&&!onChoicePg&&!isLastPage;

  /* ── Dynamic scene: pick once per book, based on seed + vibe ── */
  const storySceneSeed = book ? (parseInt(strHash(book.title + (book.heroName||'')), 36) || 0) : 0;
  const storyVibe = storyMood || (storyBrief2 ? storyBrief2.split(' ')[0].toLowerCase() : '');
  const StoryScene = book ? getSceneByVibe(storySceneSeed, storyVibe) : null;

  /* ── Story page — inline helper (not a component) to avoid remount flicker ── */
  const renderSSStoryPage = (pg: any, pgNum: number, refrain: string|undefined) => (
    <div className={`ss-page ss-sp${warmMode?' warm':''}`} key={`sp-${pgNum}`}>
      <div className="ss-sp-scene">
        {StoryScene ? <StoryScene /> : <div style={{fontSize:'clamp(72px,14vw,110px)',lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>{'\u2728'}</div>}
        {renderV8rCreature()}
        <div className="ss-sp-fade" />
      </div>
      <div className="ss-sp-body" style={{background:v8rTextBg,position:'relative'}}>
        {renderV8rNightfallStars()}
        {renderV8rMoonDots()}
        {renderV8rStoryText(pg.text)}
        {refrain && (pgNum % 2 === 0 || pgNum === (book?.pages?.length || 0)) && (
          <div className="ss-sp-refrain">{'\u201C'}{refrain}{'\u201D'}</div>
        )}
      </div>
      <div className="ss-tap ss-tap-l" onClick={()=>goPage(-1)} onTouchEnd={e=>{e.stopPropagation();goPage(-1);}} />
      <div className="ss-tap ss-tap-r" onClick={()=>{if(onChoicePg&&!chosenPath)return;goPage(1);}} onTouchEnd={e=>{e.stopPropagation();if(onChoicePg&&!chosenPath)return;goPage(1);}} />
      {renderV8rTopBar()}{renderV8rEdges()}{renderV8rHint()}{renderV8rTray()}{renderV8rShareModal()}
    </div>
  );

  /* ── Build all carousel pages ── */
  const buildSSCoverPage = () => (
    <div className="ss-page ss-cover" key="cover">
      <div className="ss-cover-scene">{StoryScene && <StoryScene />}</div>
      <div className="ss-cover-vig" />
      <div className="ss-cover-grad" />
      <div className="ss-cover-text">
        <div className="ss-cover-stars">{'\u2726'} {'\u00B7'} {'\u2726'} {'\u00B7'} {'\u2726'}</div>
        <div className="ss-cover-title">{book.title}</div>
        <div className="ss-cover-for">A story for <b>{book.heroName}</b></div>
        <div className="ss-cover-brand">SleepSeed {'\u00B7'} Made tonight</div>
      </div>
      {renderV8rTopBar()}{renderV8rTray()}{renderV8rShareModal()}
    </div>
  );

  const buildSSCastPage = () => {
    const castChars = book.allChars || [];
    const hasChars = castChars.length > 0;
    const storyForLabel = hasChars
      ? (book.heroName ? `Meet the characters in ${book.heroName}'s story\u2026` : 'Tonight\u2019s characters\u2026')
      : (book.title || 'Tonight\u2019s story');
    return (
      <div className="ss-page ss-cast" key="cast">
        <div className="ss-cast-eyebrow">Tonight's adventure</div>
        <div className="ss-cast-h">{storyForLabel}</div>
        {hasChars ? (
          <div className="ss-cast-grid">
            {castChars.map((c: any) => (
              <div className="ss-cast-char" key={c.id}>
                <div className={`ss-cast-av${c.type==='hero'?' hero':''}`}>
                  {c.photo ? <img src={c.photo.preview} alt={c.name} /> : <span>{CHAR_ICONS[c.type]||'\u2B50'}</span>}
                </div>
                <div className="ss-cast-name">{c.name||capitalize(c.type)}</div>
                <div className="ss-cast-role">{c.classify||c.type}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{marginTop:32,textAlign:'center',fontFamily:"'Lora',serif",fontStyle:'italic',fontSize:14,color:'rgba(244,239,232,.35)',lineHeight:1.6}}>
            A story about to begin{'\u2026'}
          </div>
        )}
      </div>
    );
  };

  const buildSSChoicePage = () => (
    <div className="ss-page" key="choice" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100dvh',background:'var(--night-mid)',padding:'40px 28px'}}>
      <div style={{fontSize:36,marginBottom:16}}>{'\u2B50'}</div>
      <div style={{fontFamily:'var(--serif)',fontSize:'clamp(18px,5vw,24px)',fontWeight:700,fontStyle:'italic',color:'var(--cream)',textAlign:'center',lineHeight:1.35,marginBottom:24}}>{book.choice?.question}</div>
      {!chosenPath ? (
        <div style={{display:'flex',flexDirection:'column',gap:12,width:'100%',maxWidth:320}}>
          <button className="ss-amber-btn" onClick={()=>handleChoice("a")}>{book.choice?.option_a_label}</button>
          <button className="ss-ghost-btn" onClick={()=>handleChoice("b")}>{book.choice?.option_b_label}</button>
          <div style={{fontSize:11,color:'var(--cream-faint)',textAlign:'center',marginTop:4}}>Tap a path to continue</div>
        </div>
      ) : (
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'var(--serif)',fontSize:14,fontStyle:'italic',color:'var(--amber)',fontWeight:700,marginBottom:12}}>
            {chosenPath==='a' ? book.choice?.option_a_label : book.choice?.option_b_label}
          </div>
          <button className="ss-ghost-btn" style={{maxWidth:200}} onClick={()=>goPage(1)}>Continue {'\u2192'}</button>
        </div>
      )}
    </div>
  );

  // v8r: magic word set
  const v8rMagicWords = new Set(['sparkle','shimmer','glow','gleam','glimmer','golden','amber','silver','crystal','jewel','magic','magical','spell','enchant','wish','wonder','dream','dreaming','dreamed','shadow','whisper','whispered','lantern','flame','fire','light','bright','moon','star','stars','constellation','sky','forest','hollow','path','river','bridge','leap','soar','fly','dance','spin','tumble','creature','spirit','ancient','secret','hidden','brave','courage','gentle','kind','bold','silence','still','quiet','hush','soft']);

  const v8rParseText = (text: string): string => {
    if (!v8rWordMagic) return text;
    return text.replace(/\b([A-Za-z']+)\b/g, (word) => {
      if (!v8rMagicWords.has(word.toLowerCase())) return word;
      return `<span class="v8r-mw" onclick="navigator.vibrate?.(6);this.style.animation='v8r-wordGlow .65s ease both';setTimeout(()=>this.style.animation='',700)">${word}</span>`;
    });
  };

  const renderV8rStoryText = (text: string) => {
    const baseStyle: React.CSSProperties = {
      fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 22,
      lineHeight: 1.78, letterSpacing: '.012em', color: 'rgba(244,239,232,.97)',
    };
    if (v8rWordMagic) {
      return <div style={baseStyle} dangerouslySetInnerHTML={{ __html: v8rParseText(text) }} />;
    }
    return <div style={baseStyle}>{text}</div>;
  };

  // v8r: moon phase dots
  const renderV8rMoonDots = () => {
    const total = Math.min(totalPages, 7);
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'9px 0 11px'}}>
        {[...Array(total)].map((_,i) => {
          const done = i < pageIdx - 1;
          const cur = i === pageIdx - 1;
          return <div key={i} style={{width:9,height:9,borderRadius:'50%',border:'1px solid rgba(245,184,76,.3)',background:done?'#F5B84C':cur?'rgba(245,184,76,.32)':'transparent',transition:'all .5s cubic-bezier(.2,.8,.3,1)',animation:cur?'v8r-moonPulse 2.5s ease-in-out infinite':'none',boxShadow:done?'0 0 6px rgba(245,184,76,.4)':'none'}}/>;
        })}
      </div>
    );
  };

  // v8r: creature companion
  const renderV8rCreature = () => {
    const animMap: Record<string,string> = {idle:'ssFloat 4s ease-in-out infinite',bounce:'v8r-cBounce 1.2s ease both',wiggle:'v8r-cWiggle .9s ease both',sparkle:'v8r-cBounce .8s ease both'};
    return (
      <div style={{position:'absolute',bottom:14,right:16,zIndex:15,pointerEvents:'none'}}>
        <div style={{fontSize:22,lineHeight:1,opacity:.76,animation:animMap[v8rCreatureAnim],transformOrigin:'bottom center',filter:v8rCreatureAnim==='sparkle'?'drop-shadow(0 0 8px rgba(245,184,76,.8))':'none',transition:'filter .3s'}}>
          {companionCreature?.creatureEmoji??'🌙'}
        </div>
        {v8rCreatureAnim==='sparkle'&&<div style={{position:'absolute',top:-4,right:-2,fontSize:10,pointerEvents:'none',animation:'v8r-seedAppear .7s ease both'}}>✦</div>}
      </div>
    );
  };

  const renderV8rNightfallStars = () => v8rStarOpacity < .01 ? null : (
    <svg style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,opacity:v8rStarOpacity}} viewBox="0 0 345 400" width="345" height="400">
      {[...Array(14)].map((_,i) => <circle key={i} cx={(i*31+12)%330} cy={(i*47+8)%380} r={i%3===0?.9:.5} fill={`rgba(255,255,255,${.4+(i%3)*.2})`}/>)}
    </svg>
  );

  const renderV8rEdges = () => (
    <>
      {pageIdx>0&&<div style={{position:'absolute',top:0,bottom:0,left:0,width:44,zIndex:25,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(to right,rgba(255,255,255,.022),transparent)'}}><svg viewBox="0 0 20 36" width="10" height="18" fill="none" stroke="rgba(234,242,255,.3)" strokeWidth="2" strokeLinecap="round" style={{opacity:.28}}><path d="m14 4-8 14 8 14"/></svg></div>}
      <div style={{position:'absolute',top:0,bottom:0,right:0,width:44,zIndex:25,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(to left,rgba(255,255,255,.022),transparent)'}}><svg viewBox="0 0 20 36" width="10" height="18" fill="none" stroke="rgba(234,242,255,.3)" strokeWidth="2" strokeLinecap="round" style={{opacity:.28}}><path d="m6 4 8 14-8 14"/></svg></div>
      <div id="v8rIdleNudge" style={{position:'absolute',right:0,top:0,bottom:0,width:3,zIndex:28,background:'linear-gradient(to bottom,transparent 20%,rgba(245,184,76,.48) 50%,transparent 80%)',opacity:0,pointerEvents:'none'}}/>
    </>
  );

  const renderV8rHint = () => pageIdx!==1?null:(
    <div style={{position:'absolute',bottom:108,left:0,right:0,zIndex:35,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:7,animation:'v8r-hintFade 1s 3.5s ease both'}}>
      <div style={{display:'flex',gap:10}}>
        {['← prev','next →'].map(l=><div key={l} style={{padding:'6px 11px',background:'rgba(0,0,0,.55)',border:'1px solid rgba(255,255,255,.1)',borderRadius:18}}><span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.5)',letterSpacing:'.3px'}}>{l}</span></div>)}
      </div>
    </div>
  );

  // v8r: golden seed card
  const renderV8rGoldenSeed = () => (
    <div style={{width:'100%',padding:'12px 14px',background:'rgba(245,184,76,.08)',border:'1px solid rgba(245,184,76,.2)',borderRadius:16,marginBottom:14,display:'flex',alignItems:'center',gap:12}}>
      <div style={{width:40,height:40,borderRadius:'50%',background:'rgba(245,184,76,.15)',border:'1.5px solid rgba(245,184,76,.35)',display:'flex',alignItems:'center',justifyContent:'center',animation:'v8r-seedGlow 2.5s ease-in-out infinite',flexShrink:0}}>
        <span style={{fontSize:20,lineHeight:1,display:'block',animation:'v8r-seedAppear .7s .2s ease both'}}>✦</span>
      </div>
      <div>
        <div style={{fontSize:12,fontWeight:700,color:'rgba(245,184,76,.9)',fontFamily:"'Nunito',sans-serif"}}>Golden Seed collected</div>
        <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.34)',letterSpacing:'.3px',marginTop:2}}>Tonight added a glow to your egg ✦</div>
      </div>
    </div>
  );

  const renderV8rTopBar = () => null;

  const renderV8rTray = () => (
    <>
      <div onClick={()=>setV8rTrayOpen(false)} style={{position:'absolute',inset:0,zIndex:58,background:v8rTrayOpen?'rgba(0,0,0,.52)':'rgba(0,0,0,0)',pointerEvents:v8rTrayOpen?'all':'none',transition:'background .28s'}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:60,transform:v8rTrayOpen?'translateY(0)':'translateY(100%)',transition:'transform .36s cubic-bezier(.22,.8,.3,1)'}}>
        <div style={{background:'rgba(7,12,36,.97)',borderTop:'.5px solid rgba(255,255,255,.09)',borderRadius:'22px 22px 0 0',backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',padding:'12px 18px 28px'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:14}}><div style={{width:36,height:4,borderRadius:2,background:'rgba(255,255,255,.14)'}}/></div>
          <div style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.26)',letterSpacing:'.9px',margin:'0 0 8px',paddingLeft:2}}>LISTEN</div>
          <div style={{display:'flex',gap:7,marginBottom:10}}>
            <button onClick={()=>{speakText(book?.pages?.[pageIdx-2]?.text??'');setV8rTrayOpen(false);}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:isReading?'rgba(245,184,76,.1)':'rgba(255,255,255,.04)',cursor:'pointer'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:isReading?'rgba(245,184,76,.8)':'rgba(234,242,255,.48)',letterSpacing:'.2px',textAlign:'center',lineHeight:1.3}}>Read Aloud</span>
            </button>
            <button onClick={()=>{setShowVoicePicker(true);setV8rTrayOpen(false);}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.48)',letterSpacing:'.2px',textAlign:'center',lineHeight:1.3}}>Parent Voice</span>
            </button>
          </div>
          <div onClick={()=>{setV8rAmbientOn(p=>!p);setV8rTrayOpen(false);}} style={{padding:'10px 14px',borderRadius:14,border:v8rAmbientOn?'1px solid rgba(245,184,76,.22)':'1px solid rgba(255,255,255,.07)',background:v8rAmbientOn?'rgba(245,184,76,.08)':'rgba(255,255,255,.04)',display:'flex',alignItems:'center',gap:10,cursor:'pointer',marginBottom:10,transition:'all .2s'}}>
            <div style={{fontSize:18,lineHeight:1,animation:v8rAmbientOn?'v8r-soundPulse 2s ease-in-out infinite':'none'}}>🌙</div>
            <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:v8rAmbientOn?'rgba(245,184,76,.9)':'rgba(234,242,255,.6)',fontFamily:"'Nunito',sans-serif"}}>Night Sounds</div><div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.3)',letterSpacing:'.2px',marginTop:1}}>{v8rAmbientOn?'Soft chimes playing…':'Crickets, chimes, soft wind'}</div></div>
            <div style={{width:34,height:20,borderRadius:10,background:v8rAmbientOn?'#F5B84C':'rgba(255,255,255,.08)',position:'relative',transition:'background .2s',flexShrink:0}}><div style={{position:'absolute',top:3,left:v8rAmbientOn?17:3,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/></div>
          </div>
          {/* DISPLAY */}
          <div style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.26)',letterSpacing:'.9px',margin:'12px 0 8px',paddingLeft:2}}>DISPLAY</div>
          <div onClick={()=>{setWarmMode(w=>!w);setV8rTrayOpen(false);}} style={{padding:'10px 14px',borderRadius:14,border:warmMode?'1px solid rgba(245,184,76,.22)':'1px solid rgba(255,255,255,.07)',background:warmMode?'rgba(245,184,76,.08)':'rgba(255,255,255,.04)',display:'flex',alignItems:'center',gap:10,cursor:'pointer',marginBottom:8,transition:'all .2s'}}>
            <div style={{fontSize:18,lineHeight:1}}>🌅</div>
            <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:warmMode?'rgba(245,184,76,.9)':'rgba(234,242,255,.6)',fontFamily:"'Nunito',sans-serif"}}>Night Mode</div><div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.3)',letterSpacing:'.2px',marginTop:1}}>{warmMode?'Warm sepia active':'Warm tones for bedtime'}</div></div>
            <div style={{width:34,height:20,borderRadius:10,background:warmMode?'#F5B84C':'rgba(255,255,255,.08)',position:'relative',transition:'background .2s',flexShrink:0}}><div style={{position:'absolute',top:3,left:warmMode?17:3,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/></div>
          </div>

          {/* LEARN */}
          <div style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.26)',letterSpacing:'.9px',margin:'12px 0 8px',paddingLeft:2}}>LEARN</div>
          <div style={{display:'flex',gap:7,marginBottom:8}}>
            <button onClick={()=>{setV8rWordMagic(p=>!p);setV8rTrayOpen(false);navigator.vibrate?.(8);}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:v8rWordMagic?'rgba(245,184,76,.1)':'rgba(255,255,255,.04)',cursor:'pointer',position:'relative'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:v8rWordMagic?'rgba(245,184,76,.8)':'rgba(234,242,255,.48)',letterSpacing:'.2px',textAlign:'center',lineHeight:1.3}}>Word Magic</span>
              {v8rWordMagic&&<div style={{position:'absolute',top:7,right:7,width:6,height:6,borderRadius:'50%',background:'#14d890'}}/>}
            </button>
            <button onClick={()=>{setSsSheetOpen(true);setV8rTrayOpen(false);}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.48)',letterSpacing:'.2px',textAlign:'center',lineHeight:1.3}}>Language</span>
            </button>
          </div>

          <div style={{fontSize:8,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.26)',letterSpacing:'.9px',margin:'4px 0 8px',paddingLeft:2}}>SHARE & EXIT</div>
          <div style={{display:'flex',gap:7}}>
            <button onClick={()=>{setV8rTrayOpen(false);setV8rShareOpen(true);}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.48)',letterSpacing:'.2px'}}>Share</span>
            </button>
            <button onClick={()=>{setV8rTrayOpen(false);exitToHome();}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.07)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(234,242,255,.68)" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.48)',letterSpacing:'.2px'}}>Exit</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderV8rShareModal = () => {
    if (!v8rShareOpen) return null;
    // Build a self-contained share link (no public library needed)
    const storyUrl = (() => {
      if (!book) return BASE_URL;
      try {
        const payload = { t: book.title, n: book.heroName, r: book.refrain || '', p: (book.pages || []).map((pg: any) => pg.text || '') };
        return `${BASE_URL}/?s=${btoa(encodeURIComponent(JSON.stringify(payload)))}`;
      } catch { return BASE_URL; }
    })();
    const shareBtn = (icon: React.ReactNode, label: string, onClick: ()=>void, accent?: string) => (
      <div onClick={onClick} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'11px 8px',borderRadius:16,border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.04)',cursor:'pointer'}}>
        {icon}
        <span style={{fontSize:8.5,fontFamily:"'DM Mono',monospace",color:accent||'rgba(234,242,255,.5)'}}>{label}</span>
      </div>
    );
    return (
      <>
        <div onClick={()=>{setV8rShareOpen(false);setV8rLinkCopied(false);setV8rShareMessage('');}} style={{position:'absolute',inset:0,zIndex:85,background:'rgba(0,0,0,.72)',animation:'v8r-shareReveal .2s ease both'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:88,background:'#0C1840',borderTop:'1px solid rgba(255,255,255,.09)',borderRadius:'24px 24px 0 0',animation:'v8r-shareReveal .36s cubic-bezier(.22,.8,.3,1) both'}}>
          <div style={{display:'flex',justifyContent:'center',padding:'14px 0 4px'}}><div style={{width:36,height:4,borderRadius:2,background:'rgba(255,255,255,.15)'}}/></div>
          <div style={{padding:'10px 22px 14px',borderBottom:'.5px solid rgba(255,255,255,.07)'}}>
            <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(154,127,212,.6)',letterSpacing:'.8px',marginBottom:4}}>SHARE</div>
            <div style={{fontSize:18,fontWeight:900,color:'#F4EFE8',fontFamily:"'Fraunces',serif",letterSpacing:'-.3px',lineHeight:1.2}}>{book?.title??'Tonight\'s story'}</div>
            <div style={{fontSize:10,color:'rgba(234,242,255,.36)',fontFamily:"'Nunito',sans-serif",marginTop:3}}>A story for {book?.heroName}</div>
          </div>
          <div style={{padding:'16px 22px 24px'}}>
            {/* Night Card toggle — only show if story has a night card */}
            {book?.nightCard && (
              <label style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',marginBottom:14,borderRadius:14,border:'1px solid rgba(245,184,76,.15)',background:'rgba(245,184,76,.06)',cursor:'pointer'}}>
                <input type="checkbox" checked={v8rShareIncludeNightCard??false} onChange={e=>{(setV8rShareIncludeNightCard as any)?.(e.target.checked)}} style={{accentColor:'#F5B84C',width:16,height:16}} />
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:'rgba(244,239,232,.7)',fontFamily:"'Nunito',sans-serif"}}>Include Night Card</div>
                  <div style={{fontSize:9,color:'rgba(244,239,232,.35)',fontFamily:"'DM Mono',monospace"}}>Attach tonight's memory (private fields hidden)</div>
                </div>
              </label>
            )}
            {/* Optional message */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(234,242,255,.3)',letterSpacing:'.5px',marginBottom:6}}>Add a message (optional)</div>
              <input type="text" value={v8rShareMessage} onChange={e=>setV8rShareMessage(e.target.value)} placeholder="Look at what we made tonight..." style={{width:'100%',padding:'10px 14px',borderRadius:12,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',color:'#F4EFE8',fontSize:13,fontFamily:"'Nunito',sans-serif",outline:'none',transition:'border-color .15s'}} onFocus={e=>{e.currentTarget.style.borderColor='rgba(245,184,76,.3)';}} onBlur={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.1)';}} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginBottom:14}}>
              {shareBtn(
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="rgba(245,184,76,.85)" strokeWidth="1.8" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
                v8rLinkCopied?'Copied!':'Copy link',
                ()=>{const text=v8rShareMessage?`${v8rShareMessage}\n\n${storyUrl}`:storyUrl;navigator.clipboard.writeText(text).catch(()=>{});setV8rLinkCopied(true);navigator.vibrate?.(6);}
              )}
              {shareBtn(
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="rgba(232,100,200,.8)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="18" cy="6" r="1.5" fill="rgba(232,100,200,.8)"/></svg>,
                'Instagram',
                ()=>{shareStoryCardForInstagram({title:book?.title??'',heroName:book?.heroName??'',refrain:book?.refrain,creatureEmoji:companionCreature?.creatureEmoji,creatureName:companionCreature?.name,vibe:book?.vibe});setV8rShareOpen(false);}
              )}
              {shareBtn(
                <svg viewBox="0 0 24 24" width="22" height="22" fill="rgba(37,211,102,.8)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
                'WhatsApp',
                ()=>{const msg=v8rShareMessage?`${v8rShareMessage}\n\n`:'';window.open('https://wa.me/?text='+encodeURIComponent(`${msg}${book?.title} — a bedtime story for ${book?.heroName}\n\n${storyUrl}`),'_blank');}
              )}
              {shareBtn(
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="rgba(20,216,144,.85)" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
                'PDF',
                ()=>{downloadStory();setV8rShareOpen(false);}
              )}
              {shareBtn(
                <svg viewBox="0 0 24 24" width="22" height="22" fill="rgba(234,242,255,.55)"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,
                'More',
                ()=>{const msg=v8rShareMessage?`${v8rShareMessage}\n\n`:'';if(navigator.share){navigator.share({title:book?.title,text:`${msg}A bedtime story for ${book?.heroName}`,url:storyUrl}).catch(()=>{});}else{navigator.clipboard.writeText(`${msg}${storyUrl}`).catch(()=>{});setV8rLinkCopied(true);}}
              )}
            </div>
            {v8rLinkCopied&&<div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(20,216,144,.8)',textAlign:'center',marginBottom:8}}>✓ Link copied to clipboard</div>}
          </div>
        </div>
      </>
    );
  };

  const enterNightCardFlow = () => {
    setNcStep(-1);setNcBondingA(ncBondingA||"");setNcGratitude("");setNcExtra("");
    setNcPhoto(null);setNcCountdown(0);setNcGenerating(false);
    setNcResult(null);setNcRevealed(false);setNcPhotoMode('idle');
    setNcChildMood("");setNcGenPct(0);setNcGenTextIdx(0);
    setNcAudioBlob(null);setNcAudioUrl(null);setNcRecording(false);
    setNcDrawing(null);setNcDrawingOpen(false);setNcDrawColor('#2a1a0e');setNcSaving(false);
    setNcGenTextIdx(0);setNcGenPct(0);ncSrRef.current?.stop();setNcListening(false);
    window.speechSynthesis?.cancel();
    if(elAudioRef.current){elAudioRef.current.pause();elAudioRef.current=null;}
    autoReadRef.current=false;setIsReading(false);
    setStage("nightcard");
  };

  const exitToHome = () => {
    // Kill all audio before leaving
    window.speechSynthesis?.cancel();
    if(elAudioRef.current){elAudioRef.current.pause();elAudioRef.current=null;}
    autoReadRef.current=false;setIsReading(false);
    onHome?onHome():setStage("home");
  };

  const buildSSEndPage = () => (
    <div className="ss-page" key="end" style={{position:'relative',minHeight:'100%',background:'#060912',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Atmosphere */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse at 50% 30%,rgba(60,30,120,.4),transparent 65%),radial-gradient(ellipse at 30% 80%,rgba(20,30,100,.25),transparent 50%)'}}/>
      <div style={{position:'relative',zIndex:1,flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px 28px',textAlign:'center',maxWidth:420,margin:'0 auto',width:'100%'}}>
        {/* Ornament */}
        <div style={{marginBottom:12,animation:'nc-fadeIn .8s ease both'}}>
          <svg viewBox="0 0 80 24" width="60" height="18" fill="none">
            <line x1="0" y1="12" x2="28" y2="12" stroke="rgba(245,184,76,.3)" strokeWidth=".8"/>
            <circle cx="40" cy="12" r="4" fill="rgba(245,184,76,.5)"/>
            <circle cx="40" cy="12" r="2" fill="#F5B84C"/>
            <line x1="52" y1="12" x2="80" y2="12" stroke="rgba(245,184,76,.3)" strokeWidth=".8"/>
          </svg>
        </div>
        <div style={{fontSize:10,color:'rgba(234,242,255,.35)',fontFamily:"'DM Mono',monospace",letterSpacing:'2.5px',marginBottom:6,animation:'nc-fadeUp .5s .1s ease both'}}>THE END</div>
        <div style={{fontSize:'clamp(20px,5vw,28px)',fontWeight:900,color:'#F4EFE8',fontFamily:"'Fraunces',serif",lineHeight:1.15,letterSpacing:'-.5px',marginBottom:3,animation:'nc-fadeUp .5s .15s ease both'}}>{book?.title??'Tonight\'s Story'}</div>
        <div style={{fontSize:12,color:'rgba(234,242,255,.3)',fontFamily:"'Nunito',sans-serif",fontStyle:'italic',marginBottom:16,animation:'nc-fadeUp .5s .2s ease both'}}>A story for {book?.heroName??heroName}</div>

        {/* Golden Seed collected */}
        <div style={{
          width:'100%',padding:'12px 16px',
          background:'linear-gradient(135deg,rgba(245,184,76,.08),rgba(200,140,20,.04))',
          border:'1px solid rgba(245,184,76,.22)',borderRadius:14,
          marginBottom:16,animation:'nc-fadeUp .5s .25s ease both',
          display:'flex',alignItems:'center',gap:12,
        }}>
          <div style={{
            width:36,height:36,borderRadius:'50%',flexShrink:0,
            background:'radial-gradient(circle at 40% 35%,#F5C060,#C87020)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 0 12px rgba(245,184,76,.3)',fontSize:16,
          }}>{'\u2726'}</div>
          <div style={{textAlign:'left'}}>
            <div style={{fontSize:11,fontWeight:700,color:'rgba(245,184,76,.85)',fontFamily:"'Nunito',sans-serif"}}>Golden Seed collected</div>
            <div style={{fontSize:9,color:'rgba(245,184,76,.4)',fontFamily:"'DM Mono',monospace",letterSpacing:'.3px',marginTop:1}}>Tonight added a glow to your egg</div>
          </div>
        </div>

        {/* Story feedback */}
        {!storyFeedback ? (
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:14,animation:'nc-fadeUp .5s .3s ease both'}}>
            {([
              {key:'loved' as const, emoji:'\u2764\uFE0F', label:'Loved it'},
              {key:'good' as const, emoji:'\uD83D\uDC4D', label:'Good'},
              {key:'retry' as const, emoji:'\uD83D\uDD04', label:'Try again'},
            ]).map(fb => (
              <button key={fb.key} onClick={() => {
                setStoryFeedback(fb.key);
                if (fb.key === 'retry') {
                  setStoryFeedback(null);setChosenPath(null);
                  setGen({stepIdx:0,progress:0,label:'Starting over...',error:null});
                  setTimeout(() => { if (builderChoices) doAutoGenerate(builderChoices); }, 300);
                  return;
                }
                try {
                  const entry = { rating: fb.key, title: book?.title, genre: storyMood, date: new Date().toISOString() };
                  const prev = JSON.parse(localStorage.getItem(`ss_story_feedback_${userId}`) || '[]');
                  prev.push(entry);if (prev.length > 50) prev.shift();
                  localStorage.setItem(`ss_story_feedback_${userId}`, JSON.stringify(prev));
                } catch {}
              }} style={{
                padding:'8px 14px',borderRadius:12,cursor:'pointer',
                border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.03)',
                color:'rgba(244,239,232,.55)',fontSize:11,fontWeight:600,
                fontFamily:"'Nunito',sans-serif",display:'flex',alignItems:'center',gap:5,
                transition:'background .15s,border-color .15s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.08)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.03)';}}
              >
                <span style={{fontSize:14}}>{fb.emoji}</span>{fb.label}
              </button>
            ))}
          </div>
        ) : storyFeedback !== 'retry' ? (
          <div style={{fontSize:10,color:'rgba(245,184,76,.5)',fontFamily:"'DM Mono',monospace",marginBottom:14,animation:'nc-fadeUp .3s ease both'}}>
            {storyFeedback === 'loved' ? 'We\u2019ll remember what worked \u2728' : 'Thanks for the feedback'}
          </div>
        ) : null}

        {/* CTAs */}
        <div style={{width:'100%',display:'flex',flexDirection:'column',gap:8,animation:'nc-fadeUp .5s .35s ease both'}}>
          {!book?.nightCard ? (
            <>
              <button onClick={builderChoices?.path === 'ritual' ? exitToHome : enterNightCardFlow} style={{position:'relative',width:'100%',padding:'16px 20px',borderRadius:16,border:'none',cursor:'pointer',overflow:'hidden',background:'#F5B84C',color:'#172200',fontSize:15,fontWeight:700,fontFamily:"'Fraunces',serif",boxShadow:'0 6px 20px rgba(245,184,76,.3)'}}>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(108deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%)',animation:'nc-shimmer 5.5s infinite',pointerEvents:'none'}}/>
                <span style={{position:'relative',zIndex:1}}>{builderChoices?.path === 'ritual' ? 'Continue tonight\u2019s ritual \u2192' : 'Save tonight\u2019s memory \u2192'}</span>
              </button>
              <div style={{display:'flex',gap:8}}>
                <button onClick={shareStory} style={{flex:1,padding:'12px',borderRadius:14,border:'1px solid rgba(244,239,232,.12)',background:'rgba(244,239,232,.04)',color:'rgba(234,242,255,.5)',fontSize:12,fontWeight:600,fontFamily:"'Nunito',sans-serif",cursor:'pointer'}}>Share story</button>
                {builderChoices?.path !== 'ritual' && (
                  <button onClick={exitToHome} style={{flex:1,padding:'12px',borderRadius:14,border:'1px solid rgba(255,255,255,.06)',background:'transparent',color:'rgba(234,242,255,.25)',fontSize:12,fontFamily:"'Nunito',sans-serif",cursor:'pointer'}}>Skip for now</button>
                )}
              </div>
            </>
          ) : (
            <div style={{display:'flex',gap:8}}>
              <button onClick={exitToHome} style={{flex:2,position:'relative',padding:'16px 20px',borderRadius:16,border:'none',cursor:'pointer',overflow:'hidden',background:'#F5B84C',color:'#172200',fontSize:15,fontWeight:700,fontFamily:"'Fraunces',serif"}}>Home</button>
              <button onClick={shareStory} style={{flex:1,padding:'12px',borderRadius:14,border:'1px solid rgba(244,239,232,.12)',background:'rgba(244,239,232,.04)',color:'rgba(234,242,255,.5)',fontSize:12,fontWeight:600,fontFamily:"'Nunito',sans-serif",cursor:'pointer'}}>Share</button>
            </div>
          )}
        </div>
      </div>
      {renderV8rTopBar()}{renderV8rTray()}{renderV8rShareModal()}
    </div>
  );

  // Build all pages for the carousel track
  const buildAllPages = () => {
    if (!book) return [];
    const allPagesArr: React.ReactNode[] = [buildSSCoverPage(), buildSSCastPage()];
    if (isAdv) {
      (book.setup_pages||[]).forEach((p: any, i: number) => allPagesArr.push(renderSSStoryPage(p, i+1, book.refrain)));
      allPagesArr.push(buildSSChoicePage());
      if (chosenPath) {
        resPages.forEach((p: any, i: number) => allPagesArr.push(renderSSStoryPage(p, setupLen+i+1, book.refrain)));
      }
    } else {
      (book.pages||[]).forEach((p: any, i: number) => allPagesArr.push(renderSSStoryPage(p, i+1, book.refrain)));
    }
    allPagesArr.push(buildSSEndPage());
    return allPagesArr;
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

        {/* HOME/QUICK/BUILDER stages removed — handled by StoryWizard */}
        {/* GENERATING */}
        {/* GENERATING */}
        {stage==="generating" && (()=>{
          const isReady=gen.stepIdx>=4;const isReacted=bondingAnswered&&!isReady;
          const auraClass=isReady?'teal':isReacted?'green':'amber';
          const emoClass=isReady?'ready':isReacted?'react':'';
          const nameClass=isReady?'ready':isReacted?'react':'amber';
          const bubClass=isReady?'ready':isReacted?'react':'';
          return(
          <div className="screen" style={{maxWidth:400,width:'100%',overflow:'hidden'}}>
            <div className="card" style={{textAlign:'center',padding:'28px 20px 24px',display:'flex',flexDirection:'column',alignItems:'center',position:'relative',zIndex:2,gap:8,overflow:'hidden',maxWidth:'100%'}}>

              {/* CREATURE — kept as the calm anchor, uses DreamKeeper image when available */}
              <div className="gen-cz">
                <div className={`gen-aura ${auraClass}`}/>
                {companionImageSrc ? (
                  <div className={`gen-creature-emo ${emoClass}`} style={{fontSize:'unset',width:100,height:120,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <img src={companionImageSrc} alt={companionCreature?.name||''} style={{width:'100%',height:'100%',objectFit:'contain',filter:'drop-shadow(0 0 18px rgba(246,197,111,.35))'}}/>
                  </div>
                ) : (
                  <div className={`gen-creature-emo ${emoClass}`}>{companionCreature?.creatureEmoji??'\uD83E\uDD5A'}</div>
                )}
                <div className={`gen-creature-nm ${nameClass}`}>{companionCreature?.name??'Your creature'}</div>
              </div>

              {/* SPEECH BUBBLE — single calm message */}
              <div className={`gen-bub ${bubClass}`}>
                <div className="gen-bub-txt">
                  {isReady?<>{heroName}'s story is <em>ready</em> &#10022;</>
                   :isReacted&&bondingReaction?<>{bondingReaction}</>
                   :gen.stepIdx<=1?<>Writing <em>{heroName}</em>'s story&#8230; &#10022;</>
                   :<>{heroName}'s story is <em>almost</em> ready&#8230; &#10022;</>}
                </div>
              </div>

              {/* BONDING QUESTION — the meaningful interaction during the wait */}
              {gen.stepIdx<=2&&ncBondingQ&&!bondingAnswered&&(
                <div style={{background:'rgba(160,120,255,.06)',border:'1px solid rgba(160,120,255,.18)',borderRadius:14,padding:'11px 13px',width:'100%',maxWidth:280,animation:'fup .5s ease .8s both'}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'7.5px',letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(160,120,255,.55)',marginBottom:4}}>{companionCreature?.name??'Luna'} wants to know</div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:'12.5px',fontStyle:'italic',color:'rgba(200,180,255,.85)',lineHeight:1.5,marginBottom:8}}>"{ncBondingQ}"</div>
                  <textarea className="ftarea" placeholder={`${heroName} said\u2026`} value={ncBondingA} onChange={e=>setNcBondingA(e.target.value)}
                    onBlur={()=>{if(ncBondingA?.trim()&&!bondingAnswered){setBondingAnswered(true);setBondingReaction(pickReaction(ncBondingA.trim()));}}}
                    style={{marginBottom:0,minHeight:44,fontSize:13}} rows={2}/>
                </div>
              )}

              {/* PROGRESS — simple bar only, no step labels */}
              <div style={{width:'100%',maxWidth:280,marginTop:12}}>
                <div className="pbar"><div className="pfill" style={{width:`${gen.progress}%`}}/></div>
              </div>

              {/* AUTO-ADVANCE */}
              {isReady&&<div className="gen-auto-advance">Opening your story&#8230;</div>}
            </div>
          </div>);
        })()}

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
                if (onGenerateError) { onGenerateError(); return; }
                setStage(lastErrStage||"quick");
              }}>
                ✨ Try again
              </button>
              <button className="btn-ghost" style={{width:"100%",fontSize:12}} onClick={()=>{
                setError("");
                if (onGenerateError) { onGenerateError(); return; }
                onHome ? onHome() : setStage("home");
              }}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* BOOK — new carousel reader */}
        {stage==="book" && book && (
          <div className="ss-reader" ref={ssReaderRef}>
            <div className="ss-pbar" style={{width:`${totalPages>1?((pageIdx/(totalPages-1))*100):0}%`}} />
            {/* Back + Menu buttons */}
            <div style={{position:'absolute',top:0,left:0,right:0,zIndex:70,padding:'max(14px,env(safe-area-inset-top)) 14px 0',display:'flex',alignItems:'center',justifyContent:'space-between',pointerEvents:'none'}}>
              <button onClick={exitToHome} style={{width:44,height:44,borderRadius:'50%',background:'rgba(0,0,0,.5)',border:'1.5px solid rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',pointerEvents:'all',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)'}}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(234,242,255,.8)" strokeWidth="2.2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button onClick={()=>{setV8rTrayOpen(true);setV8rShareOpen(false);}} style={{width:44,height:44,borderRadius:'50%',background:'rgba(0,0,0,.5)',border:'1.5px solid rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',pointerEvents:'all',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)'}}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(234,242,255,.8)" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            </div>
            {/* Tray + Share modal */}
            {renderV8rTray()}
            {renderV8rShareModal()}
            {/* Old top chrome (hidden via CSS) */}
            <div className="ss-top" style={{opacity:isStoryPage?(ssChromeVis?1:0.25):1}}>
              <div className="ss-top-logo" onClick={()=>{onHome?onHome():setStage("home");}}>
                <div className="ss-top-moon" /> SleepSeed
              </div>
              <button className="ss-top-btn" onClick={()=>setSsSheetOpen(true)}>{'\u22EF'}</button>
            </div>
            <div className="ss-bot" style={{opacity:isStoryPage?(ssChromeVis?1:0.25):1}}>
              <button className="ss-arrow" disabled={pageIdx===0} onClick={()=>goPage(-1)}>{'\u2039'}</button>
              <div className="ss-dots-wrap">
                {Array.from({length:totalPages}).map((_,i)=>(
                  <div key={i} className={`ss-dot2${i===pageIdx?' active':''}`}
                    onClick={()=>{if(i<=pageIdx||(isAdv&&i===choicePgIdx+1&&chosenPath))setPageIdx(i);}} />
                ))}
              </div>
              <button className="ss-arrow" disabled={isLastPage||(onChoicePg&&!chosenPath)} onClick={()=>goPage(1)}>
                {'\u203A'}
              </button>
            </div>
            <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
              <div className="ss-track" style={{transform:`translateX(${-pageIdx*100}%)`}}>
                {buildAllPages()}
              </div>
            </div>

            {/* ── Floating Audio Bar (visible when reading aloud) ── */}
            {isReading && !noScreenMode && !ssSheetOpen && (
              <div style={{
                position:'absolute',bottom:56,left:'50%',transform:'translateX(-50%)',zIndex:75,
                display:'flex',alignItems:'center',gap:10,
                padding:'8px 14px 8px 16px',borderRadius:20,
                background:'rgba(6,9,18,.88)',border:'1px solid rgba(245,184,76,.25)',
                backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',
                boxShadow:'0 8px 24px rgba(0,0,0,.5)',
                animation:'nc-fadeUp .25s ease both',
                pointerEvents:'all',
              }}>
                <div style={{
                  width:8,height:8,borderRadius:'50%',background:'#F5B84C',
                  animation:'ms-glowPulse 1.5s ease-in-out infinite',flexShrink:0,
                }}/>
                <span style={{
                  fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,184,76,.7)',
                  letterSpacing:'.4px',whiteSpace:'nowrap',
                }}>
                  {PRESET_VOICES.find(v=>v.id===selectedVoiceId)?.name||(voiceId===selectedVoiceId?'Your voice':'Reading...')}
                </span>
                <button onClick={()=>{
                  window.speechSynthesis.cancel();
                  if(elAudioRef.current){elAudioRef.current.pause();elAudioRef.current=null;}
                  autoReadRef.current=false;setIsReading(false);
                }} style={{
                  padding:'5px 12px',borderRadius:12,border:'none',
                  background:'rgba(255,255,255,.1)',color:'rgba(244,239,232,.7)',
                  fontSize:10,fontWeight:600,fontFamily:"'Nunito',sans-serif",
                  cursor:'pointer',
                }}>Stop</button>
              </div>
            )}

            {/* No Screen Mode */}
            {noScreenMode && (
              <div className="ss-noscreen" onClick={()=>setNoScreenMode(false)}>
                <div className="ss-noscreen-moon">{'\uD83C\uDF19'}</div>
                <div className="ss-noscreen-title">Listening to<br/><em>{book.heroName}'s story</em></div>
                <div className="ss-noscreen-tap">tap anywhere to return</div>
              </div>
            )}

            {/* Controls sheet */}
            {ssSheetOpen && (
              <>
                <div className="ss-sheet-bg" onClick={()=>setSsSheetOpen(false)} />
                <div className="ss-sheet">
                  <div className="ss-sheet-handle" />
                  <div className="ss-sheet-scroll">
                    <div className="ss-sheet-section">
                      <div className="ss-sheet-row" onClick={()=>{const prog=totalPages>1?pageIdx/(totalPages-1):0.5;toggleRead(getCurrentPageText(),prog);}}>
                        <div className="ss-sheet-ico" style={{background:isReading?'rgba(255,80,80,.12)':'rgba(245,184,76,.12)'}}>{isReading?'\u23F9':'\uD83D\uDD0A'}</div>
                        <div className="ss-sheet-body">
                          <div className="ss-sheet-label">{isReading?'Stop Reading':'Read Aloud'}</div>
                          <div className="ss-sheet-sub">{voiceId===selectedVoiceId?'Your voice':PRESET_VOICES.find(v=>v.id===selectedVoiceId)?.name||'Hope'}</div>
                        </div>
                        <button className={`ss-sheet-toggle${isReading?' on':''}`} onClick={e=>{e.stopPropagation();const prog=totalPages>1?pageIdx/(totalPages-1):0.5;toggleRead(getCurrentPageText(),prog);}}>
                          <div className="ss-sheet-knob" />
                        </button>
                      </div>
                      <div className="ss-sheet-row" onClick={()=>{setSsSheetOpen(false);setShowVoicePicker(true);}}>
                        <div className="ss-sheet-ico" style={{background:'rgba(148,130,255,.12)'}}>{'\uD83C\uDFA4\uFE0F'}</div>
                        <div className="ss-sheet-body">
                          <div className="ss-sheet-label">Choose Voice</div>
                          <div className="ss-sheet-sub">{voiceId?'6 narrators \u00B7 your voice \u00B7 or no voice':'6 narrators \u00B7 or record your own'}</div>
                        </div>
                        <div className="ss-sheet-chevron">{'\u203A'}</div>
                      </div>
                    </div>
                    <div className="ss-sheet-sep" />
                    <div className="ss-sheet-section">
                      <div className="ss-sheet-row" onClick={toggleAmbient}>
                        <div className="ss-sheet-ico" style={{background:'rgba(20,216,144,.12)'}}>{'\uD83C\uDF27'}</div>
                        <div className="ss-sheet-body">
                          <div className="ss-sheet-label">Ambient Sounds</div>
                          <div className="ss-sheet-sub">Gentle brown noise</div>
                        </div>
                        <button className={`ss-sheet-toggle${ambientOn?' on':''}`} onClick={e=>{e.stopPropagation();toggleAmbient();}}>
                          <div className="ss-sheet-knob" />
                        </button>
                      </div>
                      <div className="ss-sheet-row" onClick={()=>{setNoScreenMode(true);setSsSheetOpen(false);}}>
                        <div className="ss-sheet-ico" style={{background:'rgba(148,130,255,.12)'}}>{'\uD83C\uDF19'}</div>
                        <div className="ss-sheet-body">
                          <div className="ss-sheet-label">Listen-Only Mode</div>
                          <div className="ss-sheet-sub">Screen dims {'\u00B7'} narration continues</div>
                        </div>
                        <div className="ss-sheet-chevron">{'\u203A'}</div>
                      </div>
                      <div className="ss-sheet-row" onClick={()=>setWarmMode(w=>!w)}>
                        <div className="ss-sheet-ico" style={{background:'rgba(245,184,76,.12)'}}>{'\uD83C\uDF05'}</div>
                        <div className="ss-sheet-body">
                          <div className="ss-sheet-label">Warm Mode</div>
                          <div className="ss-sheet-sub">Soft sepia filter</div>
                        </div>
                        <button className={`ss-sheet-toggle${warmMode?' on':''}`} onClick={e=>{e.stopPropagation();setWarmMode(w=>!w);}}>
                          <div className="ss-sheet-knob" />
                        </button>
                      </div>
                    </div>
                    <div className="ss-sheet-sep" />
                    <div className="ss-sheet-section">
                      <div className="ss-sheet-row" onClick={()=>{setSsSheetOpen(false);shareStory();}}>
                        <div className="ss-sheet-ico" style={{background:'rgba(244,239,232,.06)'}}>{'\uD83D\uDCE4'}</div>
                        <div className="ss-sheet-body"><div className="ss-sheet-label">Share Story</div></div>
                      </div>
                      <div className="ss-sheet-row" onClick={()=>{setSsSheetOpen(false);downloadStory();}}>
                        <div className="ss-sheet-ico" style={{background:'rgba(244,239,232,.06)'}}>{'\uD83D\uDCC4'}</div>
                        <div className="ss-sheet-body"><div className="ss-sheet-label">Download PDF</div></div>
                      </div>
                      <div className="ss-sheet-row" onClick={()=>{
                        window.speechSynthesis?.cancel();
                        if(elAudioRef.current){elAudioRef.current.pause();elAudioRef.current=null;}
                        autoReadRef.current=false;setIsReading(false);setSsSheetOpen(false);
                        onHome?onHome():setStage("home");setBook(null);setChosenPath(null);
                      }}>
                        <div className="ss-sheet-ico" style={{background:'rgba(244,239,232,.06)'}}>{'\uD83D\uDD04'}</div>
                        <div className="ss-sheet-body"><div className="ss-sheet-label">New Story</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Voice Picker Modal — keep existing */}
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

        {/* ═══ NIGHT CARD FLOW — redesigned 5-screen ritual ═══ */}
        {stage==="nightcard" && book && (
          <>
            {/* Bridge — brief emotional pause before Night Card flow */}
            {ncStep===-1 && (
              <div style={{minHeight:'100dvh',background:'#060912',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
                <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse at 50% 40%,rgba(154,127,212,.12),transparent 60%)'}}/>
                <div style={{position:'relative',zIndex:1,textAlign:'center',padding:'0 32px',animation:'nc-fadeUp .6s ease both'}}>
                  <div style={{fontSize:40,marginBottom:16}}>{companionCreature?.creatureEmoji??'\uD83C\uDF19'}</div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:300,fontStyle:'italic',color:'rgba(244,239,232,.7)',lineHeight:1.35,letterSpacing:'-0.3px',marginBottom:10}}>
                    Let's hold onto<br/>this moment.
                  </div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(244,239,232,.25)',letterSpacing:'.5px'}}>
                    TONIGHT'S MEMORY
                  </div>
                </div>
              </div>
            )}
            {/* Screen 1 — Combined: Bonding + Mood (merged steps 0+1) */}
            {ncStep===0 && (
              <div style={{minHeight:'100dvh',background:'#060912',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
                <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse at 50% 20%,rgba(154,127,212,.18),transparent 60%)'}}/>
                <div style={{position:'relative',zIndex:1,flex:1,display:'flex',flexDirection:'column',padding:'48px 24px 24px',overflowY:'auto',scrollbarWidth:'none' as any}}>
                  {/* Progress pills (2 steps now) */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:12,flexShrink:0}}>
                    {[0,1].map(i=><div key={i} style={{height:8,borderRadius:4,transition:'all .3s',background:i===0?'#F5B84C':'rgba(234,242,255,.15)',width:i===0?24:8}}/>)}
                  </div>
                  {/* Creature + speech bubble */}
                  <div style={{display:'flex',alignItems:'flex-end',gap:12,marginBottom:18,animation:'nc-fadeUp .35s ease both',flexShrink:0}}>
                    <div style={{flexShrink:0,animation:'nc-floatY 4.5s ease-in-out infinite'}}>
                      <div style={{fontSize:40,lineHeight:1}}>{companionCreature?.creatureEmoji??'\uD83D\uDC30'}</div>
                    </div>
                    <div style={{flex:1,background:'rgba(154,127,212,.12)',border:'1px solid rgba(154,127,212,.28)',borderRadius:'16px 16px 16px 4px',padding:'11px 14px'}}>
                      <div style={{fontSize:8,color:'rgba(180,155,240,.6)',fontFamily:"'DM Mono',monospace",letterSpacing:'.6px',marginBottom:4,textTransform:'uppercase'}}>{companionCreature?.name??'Moon Bunny'} asks</div>
                      <div style={{fontSize:13,fontWeight:700,color:'#F4EFE8',fontFamily:"'Fraunces',serif",lineHeight:1.4}}>{ncBondingQ||'What was the best part of today?'}</div>
                    </div>
                  </div>
                  {/* Bonding answer input */}
                  <div style={{marginBottom:16,animation:'nc-fadeUp .35s .1s ease both',flexShrink:0}}>
                    <div style={{position:'relative'}}>
                      <textarea value={ncBondingA} onChange={e=>setNcBondingA(e.target.value)} placeholder="Type what they said..." style={{width:'100%',minHeight:60,padding:'12px 44px 12px 14px',borderRadius:14,border:`1px solid ${ncListening?'rgba(245,184,76,.55)':'rgba(154,127,212,.25)'}`,background:ncListening?'rgba(245,184,76,.08)':'rgba(154,127,212,.06)',color:'rgba(234,242,255,.82)',fontSize:13,fontFamily:"'Nunito',sans-serif",resize:'none',outline:'none',lineHeight:1.5}}/>
                      {typeof window!=='undefined'&&!!((window as any).SpeechRecognition||(window as any).webkitSpeechRecognition)&&(
                        <button onClick={()=>{
                          const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR)return;
                          if(ncListening){ncSrRef.current?.stop();setNcListening(false);return;}
                          const sr=new SR();sr.continuous=false;sr.interimResults=false;sr.lang='en-US';
                          sr.onresult=(e:any)=>{const t=e.results[0]?.[0]?.transcript||'';setNcBondingA(prev=>prev?(prev.trimEnd()+' '+t):t);setNcListening(false);};
                          sr.onerror=()=>setNcListening(false);sr.onend=()=>setNcListening(false);
                          sr.start();ncSrRef.current=sr;setNcListening(true);
                        }} style={{position:'absolute',right:6,top:6,width:30,height:30,borderRadius:'50%',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:ncListening?'rgba(245,184,76,.92)':'rgba(154,127,212,.15)',transition:'all .2s',animation:ncListening?'nc-micPulse 1.2s ease-in-out infinite':'none'}} aria-label="Voice input">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ncListening?'#172200':'rgba(234,242,255,.6)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="1" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Mood picker (compact) */}
                  <div style={{marginBottom:16,animation:'nc-fadeUp .35s .15s ease both',flexShrink:0}}>
                    <div style={{fontSize:9,color:'rgba(244,239,232,.3)',fontFamily:"'DM Mono',monospace",letterSpacing:'.5px',marginBottom:8}}>HOW DOES {(book?.heroName??heroName).toUpperCase()} FEEL?</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {[
                        {emoji:'\uD83D\uDE0A',label:'happy'},{emoji:'\uD83D\uDE34',label:'sleepy'},{emoji:'\uD83E\uDD17',label:'cozy'},
                        {emoji:'\uD83D\uDE0C',label:'calm'},{emoji:'\uD83E\uDD70',label:'loved'},{emoji:'\uD83D\uDE06',label:'silly'},
                      ].map(m=>(
                        <div key={m.emoji} onClick={()=>setNcChildMood(ncChildMood===m.emoji?'':m.emoji)} style={{
                          display:'flex',flexDirection:'column',alignItems:'center',gap:2,
                          padding:'6px 8px',borderRadius:12,cursor:'pointer',transition:'all .2s',
                          background:ncChildMood===m.emoji?'rgba(245,184,76,.12)':'rgba(255,255,255,.03)',
                          border:`1.5px solid ${ncChildMood===m.emoji?'rgba(245,184,76,.4)':'rgba(255,255,255,.06)'}`,
                          minWidth:46,
                        }}>
                          <span style={{fontSize:20}}>{m.emoji}</span>
                          <span style={{fontSize:8,color:ncChildMood===m.emoji?'rgba(245,184,76,.8)':'rgba(234,242,255,.3)',fontFamily:"'Nunito',sans-serif",fontWeight:600}}>{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Best moment chips */}
                  <div style={{marginBottom:16,animation:'nc-fadeUp .35s .2s ease both',flexShrink:0}}>
                    <div style={{fontSize:9,color:'rgba(20,216,144,.5)',fontFamily:"'DM Mono',monospace",letterSpacing:'.5px',marginBottom:8}}>BEST MOMENT TONIGHT</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                      {['When we laughed','A hug','Being silly','Feeling cozy'].map(chip=>(
                        <div key={chip} onClick={()=>setNcGratitude(ncGratitude===chip?'':chip)} style={{padding:'6px 11px',borderRadius:18,border:`1px solid ${ncGratitude===chip?'rgba(20,216,144,.4)':'rgba(20,216,144,.15)'}`,background:ncGratitude===chip?'rgba(20,216,144,.12)':'rgba(20,216,144,.05)',fontSize:10,color:'rgba(20,216,144,.7)',fontFamily:"'Nunito',sans-serif",cursor:'pointer',transition:'all .2s'}}>{chip}</div>
                      ))}
                    </div>
                  </div>
                  {/* CTA */}
                  <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:8,flexShrink:0,animation:'nc-fadeUp .35s .25s ease both'}}>
                    <button onClick={()=>setNcStep(1)} style={{position:'relative',width:'100%',padding:'15px 20px',borderRadius:16,border:'none',cursor:'pointer',overflow:'hidden',background:'#F5B84C',color:'#172200',fontSize:15,fontWeight:700,fontFamily:"'Fraunces',serif",boxShadow:'0 6px 20px rgba(245,184,76,.28)'}}>
                      <div style={{position:'absolute',inset:0,background:'linear-gradient(108deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%)',animation:'nc-shimmer 5.5s infinite',pointerEvents:'none'}}/>
                      <span style={{position:'relative',zIndex:1}}>Create memory {'\u2192'}</span>
                    </button>
                    <button onClick={()=>setNcStep(1)} style={{background:'none',border:'none',color:'rgba(234,242,255,.2)',fontSize:10,fontFamily:"'DM Mono',monospace",cursor:'pointer',padding:'3px 0'}}>skip</button>
                  </div>
                </div>
              </div>
            )}

            {/* Screen 2 — Generating Ceremony (was step 3, now step 1) */}
            {ncStep===1 && (
              <div style={{minHeight:'100dvh',background:'#060912',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 28px',textAlign:'center',position:'relative'}}>
                <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse at 50% 40%,rgba(60,30,120,.35),transparent 65%),radial-gradient(ellipse at 20% 80%,rgba(20,100,80,.2),transparent 50%)'}}/>
                <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div style={{marginBottom:28,animation:'nc-floatY 3s ease-in-out infinite'}}>
                    <div style={{fontSize:72,lineHeight:1}}>{companionCreature?.creatureEmoji??'🐰'}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:20}}>
                    {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:'#F5B84C',opacity:.8,animation:`nc-writingDot 1.4s ${i*.2}s ease-in-out infinite`}}/>)}
                  </div>
                  <div style={{fontSize:22,fontWeight:900,color:'#F4EFE8',fontFamily:"'Fraunces',serif",lineHeight:1.2,letterSpacing:'-.4px',marginBottom:10}}>{companionCreature?.name??'Moon Bunny'} is<br/>preserving this night</div>
                  <div style={{fontSize:13,color:'rgba(234,242,255,.4)',fontFamily:"'Nunito',sans-serif",fontStyle:'italic',lineHeight:1.7,maxWidth:260,minHeight:44}}>
                    {['Weaving tonight\'s memories…',`Listening to ${book?.heroName??'their'} answer…`,'Finding the right words…','Sealing the memory…'][ncGenTextIdx]}
                  </div>
                  <div style={{width:200,height:3,background:'rgba(255,255,255,.08)',borderRadius:2,overflow:'hidden',marginTop:32}}>
                    <div style={{height:'100%',width:`${ncGenPct}%`,background:'linear-gradient(90deg,rgba(245,184,76,.4),#F5B84C)',borderRadius:2,transition:'width .4s ease'}}/>
                  </div>
                </div>
              </div>
            )}

            {/* Screen 3 — Card Reveal + Whisper + Media + Save (was step 4, now step 2) */}
            {ncStep===2 && ncResult && (
              <div style={{height:'100dvh',maxHeight:'100dvh',background:'#060912',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
                <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse at 50% 30%,rgba(20,100,60,.3),transparent 65%)'}}/>
                <div style={{position:'relative',zIndex:1,flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'40px 20px 20px',overflowY:'auto',scrollbarWidth:'none' as any,WebkitOverflowScrolling:'touch' as any}}>
                  <style>{`.nc-reveal-scroll::-webkit-scrollbar{display:none}`}</style>
                  <div className="nc-reveal-scroll" style={{width:'100%',maxWidth:300,display:'flex',flexDirection:'column',alignItems:'center'}}>
                    <div style={{fontSize:8.5,color:'rgba(20,216,144,.6)',fontFamily:"'DM Mono',monospace",letterSpacing:'1.2px',marginBottom:12,animation:'nc-fadeUp .4s ease both'}}>NIGHT CARD</div>
                    <div style={{width:'100%',animation:'nc-cardReveal .6s .1s cubic-bezier(.2,.8,.3,1) both',boxShadow:'0 24px 60px rgba(0,0,0,.55),0 8px 20px rgba(0,0,0,.35)',marginBottom:14}}>
                      <NightCardComponent card={{
                        id:'preview',userId:'',heroName:book.heroName,storyTitle:book.title,
                        characterIds:[],headline:ncResult.headline,quote:ncResult.quote,
                        memory_line:ncResult.memory_line,photo:ncPhoto||undefined,
                        emoji:ncResult.emoji,date:new Date().toISOString(),
                        creatureEmoji:companionCreature?.creatureEmoji,
                      } as any} size="full" />
                    </div>
                    {/* ── Compact action row: Photo · Voice · Drawing ── */}
                    <div style={{width:'100%',display:'flex',gap:8,marginBottom:10,animation:'nc-fadeUp .4s .4s ease both',opacity:0}}>
                      {/* Photo: Take or Upload */}
                      {!ncPhoto ? (
                        <div style={{flex:1,display:'flex',gap:6}}>
                          <button onClick={()=>{
                            const input=document.createElement('input');
                            input.type='file';input.accept='image/*';input.setAttribute('capture','environment');
                            input.onchange=(e:any)=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=(ev)=>setNcPhoto(ev.target?.result as string);reader.readAsDataURL(file);};
                            input.click();
                          }} style={{flex:1,padding:'10px 8px',borderRadius:12,border:'1.5px dashed rgba(246,197,111,.2)',background:'rgba(246,197,111,.05)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                            <span style={{fontSize:18}}>📸</span>
                            <span style={{fontSize:8,color:'rgba(246,197,111,.6)',fontFamily:"'DM Mono',monospace"}}>Take</span>
                          </button>
                          <button onClick={()=>{
                            const input=document.createElement('input');
                            input.type='file';input.accept='image/*';
                            input.onchange=(e:any)=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=(ev)=>setNcPhoto(ev.target?.result as string);reader.readAsDataURL(file);};
                            input.click();
                          }} style={{flex:1,padding:'10px 8px',borderRadius:12,border:'1.5px dashed rgba(246,197,111,.2)',background:'rgba(246,197,111,.05)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                            <span style={{fontSize:18}}>🖼</span>
                            <span style={{fontSize:8,color:'rgba(246,197,111,.6)',fontFamily:"'DM Mono',monospace"}}>Upload</span>
                          </button>
                        </div>
                      ) : (
                        <div style={{flex:2,borderRadius:12,overflow:'hidden',border:'1px solid rgba(246,197,111,.2)',position:'relative'}}>
                          <img src={ncPhoto} alt="Tonight" style={{width:'100%',height:64,objectFit:'cover',display:'block'}}/>
                          <button onClick={()=>setNcPhoto(null)} style={{position:'absolute',top:4,right:4,width:20,height:20,borderRadius:'50%',background:'rgba(0,0,0,.6)',border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                        </div>
                      )}
                      {/* Voice */}
                      {!ncAudioUrl ? (
                        <button onClick={async()=>{
                          if(ncRecording){ncMediaRecRef.current?.stop();setNcRecording(false);return;}
                          try{
                            const stream=await navigator.mediaDevices.getUserMedia({audio:true});
                            const recorder=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':'audio/mp4'});
                            const chunks:Blob[]=[];
                            recorder.ondataavailable=(e)=>{if(e.data.size>0)chunks.push(e.data);};
                            recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:recorder.mimeType});setNcAudioBlob(blob);setNcAudioUrl(URL.createObjectURL(blob));};
                            ncMediaRecRef.current=recorder;recorder.start();setNcRecording(true);
                            setTimeout(()=>{if(recorder.state==='recording'){recorder.stop();setNcRecording(false);}},10000);
                          }catch(e){console.error('[NC] Voice recording failed:',e);}
                        }} style={{flex:1,padding:'10px 8px',borderRadius:12,border:`1.5px dashed ${ncRecording?'rgba(255,80,80,.3)':'rgba(154,127,212,.2)'}`,background:ncRecording?'rgba(255,80,80,.08)':'rgba(154,127,212,.05)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <span style={{fontSize:18}}>{ncRecording?'⏹':'🎙'}</span>
                          <span style={{fontSize:8,color:ncRecording?'rgba(255,120,120,.7)':'rgba(154,127,212,.6)',fontFamily:"'DM Mono',monospace"}}>{ncRecording?'Stop':'Voice'}</span>
                        </button>
                      ) : (
                        <div style={{flex:1,padding:'6px 8px',borderRadius:12,border:'1px solid rgba(154,127,212,.2)',background:'rgba(154,127,212,.05)',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                          <audio src={ncAudioUrl} controls style={{width:'100%',height:24,opacity:.8}} />
                          <button onClick={()=>{setNcAudioBlob(null);setNcAudioUrl(null);}} style={{background:'none',border:'none',color:'rgba(255,140,130,.4)',fontSize:8,cursor:'pointer'}}>Remove</button>
                        </div>
                      )}
                      {/* Drawing */}
                      {!ncDrawing ? (
                        <button onClick={()=>setNcDrawingOpen(true)} style={{flex:1,padding:'10px 8px',borderRadius:12,border:'1.5px dashed rgba(20,216,144,.2)',background:'rgba(20,216,144,.05)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <span style={{fontSize:18}}>{'\u270F\uFE0F'}</span>
                          <span style={{fontSize:8,color:'rgba(20,216,144,.6)',fontFamily:"'DM Mono',monospace"}}>Draw</span>
                        </button>
                      ) : (
                        <div style={{flex:1,borderRadius:12,overflow:'hidden',border:'1px solid rgba(20,216,144,.15)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(20,216,144,.04)'}}>
                          <img src={ncDrawing} alt="Drawing" style={{maxWidth:'100%',maxHeight:64,borderRadius:8}}/>
                          <button onClick={()=>{setNcDrawing(null);}} style={{position:'absolute',top:4,right:4,width:20,height:20,borderRadius:'50%',background:'rgba(0,0,0,.6)',border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                        </div>
                      )}
                    </div>

                    {/* ── Drawing Board Modal (full-screen overlay) ── */}
                    {ncDrawingOpen && !ncDrawing && (
                      <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(6,9,18,.95)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,animation:'nc-fadeUp .2s ease both'}}>
                        <div style={{width:'100%',maxWidth:340,display:'flex',flexDirection:'column',alignItems:'center'}}>
                          <div style={{fontSize:11,color:'rgba(20,216,144,.6)',fontFamily:"'DM Mono',monospace",letterSpacing:'1px',marginBottom:12}}>{(book?.heroName||heroName).toUpperCase()}{'\u2019'}S DRAWING</div>
                          {/* Color palette */}
                          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:12,flexWrap:'wrap'}}>
                            {['#2a1a0e','#e74c3c','#e67e22','#f1c40f','#27ae60','#2980b9','#8e44ad','#ecf0f1'].map(color=>(
                              <button key={color} onClick={()=>setNcDrawColor(color)} style={{
                                width:30,height:30,borderRadius:'50%',border:ncDrawColor===color?'3px solid rgba(20,216,144,.8)':'2px solid rgba(255,255,255,.15)',
                                background:color,cursor:'pointer',padding:0,
                                boxShadow:ncDrawColor===color?`0 0 10px ${color}40`:'none',
                                transition:'transform .15s, box-shadow .15s',
                                transform:ncDrawColor===color?'scale(1.15)':'scale(1)',
                              }}/>
                            ))}
                          </div>
                          <canvas ref={ncDrawCanvasRef} width={320} height={240} style={{
                            width:'100%',maxWidth:320,height:240,borderRadius:14,
                            background:'rgba(255,255,255,.95)',cursor:'crosshair',touchAction:'none',
                            boxShadow:'0 8px 32px rgba(0,0,0,.4)',
                          }}
                            onPointerDown={e=>{
                              ncDrawingRef.current=true;
                              const c=ncDrawCanvasRef.current;if(!c)return;
                              const ctx=c.getContext('2d');if(!ctx)return;
                              const r=c.getBoundingClientRect();
                              ctx.strokeStyle=ncDrawColor;ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
                              ctx.beginPath();ctx.moveTo((e.clientX-r.left)*(c.width/r.width),(e.clientY-r.top)*(c.height/r.height));
                            }}
                            onPointerMove={e=>{
                              if(!ncDrawingRef.current)return;
                              const c=ncDrawCanvasRef.current;if(!c)return;
                              const ctx=c.getContext('2d');if(!ctx)return;
                              const r=c.getBoundingClientRect();
                              ctx.lineTo((e.clientX-r.left)*(c.width/r.width),(e.clientY-r.top)*(c.height/r.height));
                              ctx.stroke();
                            }}
                            onPointerUp={()=>{ncDrawingRef.current=false;}}
                            onPointerLeave={()=>{ncDrawingRef.current=false;}}
                          />
                          <div style={{display:'flex',gap:10,marginTop:14,width:'100%',maxWidth:320}}>
                            <button onClick={()=>{const c=ncDrawCanvasRef.current;if(!c)return;const ctx=c.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,c.width,c.height);}} style={{flex:1,padding:'10px',borderRadius:12,border:'1px solid rgba(20,216,144,.15)',background:'transparent',color:'rgba(20,216,144,.6)',fontSize:12,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>Clear</button>
                            <button onClick={()=>{const c=ncDrawCanvasRef.current;if(!c)return;setNcDrawing(c.toDataURL('image/png'));setNcDrawingOpen(false);}} style={{flex:2,padding:'10px',borderRadius:12,border:'none',background:'rgba(20,216,144,.2)',color:'rgba(20,216,144,.9)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>Save Drawing</button>
                            <button onClick={()=>setNcDrawingOpen(false)} style={{flex:1,padding:'10px',borderRadius:12,border:'1px solid rgba(255,255,255,.08)',background:'transparent',color:'rgba(234,242,255,.35)',fontSize:12,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>Cancel</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Parent whisper (moved here from separate screen) */}
                    <div style={{width:'100%',marginBottom:10,animation:'nc-fadeUp .4s .25s ease both'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                        <span style={{fontSize:10}}>{'\uD83E\uDD2B'}</span>
                        <span style={{fontSize:8,color:'rgba(154,127,212,.6)',fontFamily:"'DM Mono',monospace",letterSpacing:'.5px'}}>PARENT{'\u2019'}S WHISPER {'\u00B7'} PRIVATE</span>
                      </div>
                      <textarea value={ncExtra} onChange={e=>setNcExtra(e.target.value)} placeholder="A note to your future self about tonight..." style={{width:'100%',minHeight:48,padding:'10px 14px',borderRadius:12,border:'1px solid rgba(154,127,212,.18)',background:'rgba(154,127,212,.05)',color:'rgba(234,242,255,.75)',fontSize:12,fontFamily:"'Nunito',sans-serif",resize:'none',outline:'none',lineHeight:1.5}} maxLength={280}/>
                    </div>

                    {/* Save + actions */}
                    <div style={{width:'100%',display:'flex',flexDirection:'column',gap:8,animation:'nc-fadeUp .4s .3s ease both'}}>
                      <button disabled={ncSaving} onClick={async()=>{
                        if(ncSaving)return;
                        setNcSaving(true);
                        console.log('[NC] Save button clicked, ncResult:', !!ncResult, 'book:', !!book);
                        try{
                        const ncId = crypto.randomUUID?.() || `nc_${Date.now()}`;
                        // Calculate child age from birthDate if available
                        const childAgeStr = (() => {
                          const bd = preloadedCharacter?.birthDate;
                          if (!bd) return preloadedCharacter?.ageDescription || undefined;
                          const born = new Date(bd);
                          const now = new Date();
                          const years = now.getFullYear() - born.getFullYear();
                          const months = now.getMonth() - born.getMonth() + (now.getDate() < born.getDate() ? -1 : 0);
                          const adjYears = months < 0 ? years - 1 : years;
                          const adjMonths = months < 0 ? months + 12 : months;
                          return adjMonths > 0 ? `${adjYears} years, ${adjMonths} months` : `${adjYears} years`;
                        })();
                        const bedtime = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true});
                        // Upload audio clip if recorded
                        let audioClipUrl: string|undefined;
                        if(ncAudioBlob && userId){
                          try{
                            const ext=ncAudioBlob.type.includes('webm')?'webm':'m4a';
                            const path=`${userId}/voice_${ncId}.${ext}`;
                            const{error:upErr}=await supabase.storage.from('photos').upload(path,ncAudioBlob,{contentType:ncAudioBlob.type,upsert:true});
                            if(!upErr){const{data:urlData}=supabase.storage.from('photos').getPublicUrl(path);audioClipUrl=urlData?.publicUrl;}
                          }catch(e){console.error('[NC] Audio upload failed:',e);}
                        }
                        const ncData={id:ncId,userId:userId||'',heroName:book.heroName,storyTitle:book.title,refrain:book.refrain||"",
                          characterIds:preloadedCharacter?[preloadedCharacter.id]:[],
                          bondingQuestion:ncBondingQ,bondingAnswer:ncBondingA,gratitude:ncGratitude,
                          extra:undefined,whisper:ncExtra||undefined,photo:ncPhoto,
                          date:new Date().toISOString().split('T')[0],
                          creatureEmoji:companionCreature?.creatureEmoji,creatureColor:companionCreature?.color,
                          childMood:ncChildMood||undefined,childAge:childAgeStr,
                          bedtimeActual:bedtime,tags:ncResult?.tags||undefined,
                          audioClip:audioClipUrl||undefined,
                          childDrawing:ncDrawing||undefined,
                          ...ncResult};
                        lastSavedStoryIdRef.current = ncId;
                        console.log('[NC] Built ncData, calling saveNightCard...');
                        try{await saveNightCard(ncData);}catch(err){console.error('[NC] saveNightCard failed:',err);}
                        const updatedBook={...book,nightCard:ncData};setBook(updatedBook);
                        const updatedMemories=memories.map(m=>m.bookData?.title===book.title&&m.heroName===book.heroName?{...m,bookData:updatedBook}:m);
                        setMemories(updatedMemories);try{await sSet("memories",{items:updatedMemories});}catch(err){console.error('[NC] sSet failed:',err);}
                        console.log('[NC] Night card saved successfully, going home');
                        setNcSaving(false);
                        onHome?onHome():setStage("home");
                        }catch(err:any){console.error('[NC] CRITICAL save error:',err);alert('Night card save error: '+(err?.message||err));setNcSaving(false);}
                      }} style={{position:'relative',width:'100%',padding:'15px 20px',borderRadius:18,border:'none',cursor:ncSaving?'wait':'pointer',overflow:'hidden',background:ncSaving?'rgba(245,184,76,.5)':'#F5B84C',color:'#172200',fontSize:15,fontWeight:700,fontFamily:"'Fraunces',serif",boxShadow:'0 8px 24px rgba(245,184,76,.28)',transition:'background .2s'}}>
                        <div style={{position:'absolute',inset:0,background:'linear-gradient(108deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%)',animation:'nc-shimmer 5.5s infinite',pointerEvents:'none'}}/>
                        <span style={{position:'relative',zIndex:1}}>{ncSaving ? 'Saving...' : 'Save & go home'}</span>
                      </button>
                      <button onClick={async ()=>{
                        setNcShareSheetOpen(true);
                        // Generate share token for the night card
                        const ncId = lastSavedStoryIdRef.current;
                        if (ncId && userId) {
                          try {
                            const token = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                            await supabase.from('night_card_shares').upsert({ card_id: ncId, share_token: token, created_at: new Date().toISOString() });
                            setNcShareUrl(`${BASE_URL}/?nc=${token}`);
                          } catch(e) { console.error('[Share] token generation failed:', e); }
                        }
                      }} style={{width:'100%',padding:'11px 8px',borderRadius:14,border:'1px solid rgba(255,255,255,.12)',background:'rgba(255,255,255,.04)',color:'rgba(234,242,255,.55)',fontSize:11,fontFamily:"'DM Mono',monospace",cursor:'pointer',letterSpacing:'.2px',textAlign:'center'}}>Share this card</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Night Card Share Sheet ── */}
        {ncShareSheetOpen && ncResult && book && (
          <NightCardShareSheet
            card={{
              childName: book.heroName || heroName,
              dreamKeeperName: companionCreature?.name || 'DreamKeeper',
              dreamKeeperEmoji: companionCreature?.creatureEmoji || '🌙',
              dreamKeeperColor: companionCreature?.color || '#9A7FD4',
              nightNumber: undefined, // will be computed by saveNightCard
              date: new Date().toISOString(),
              storyLine: ncResult.headline || '',
              quote: ncResult.quote || '',
              isOrigin: false,
              storyTitle: book.title,
              heroName: book.heroName,
            }}
            shareUrl={ncShareUrl}
            onClose={() => { setNcShareSheetOpen(false); setNcShareUrl(''); }}
            onViewLibrary={() => { setNcShareSheetOpen(false); setNcShareUrl(''); onHome ? onHome() : setStage('home'); }}
          />
        )}

        {/* Old nightcard flow removed — see git history if needed */}
        {false && (<div className="nc-flow-old-removed">
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
            {ncStep===1 && (
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
                                setNcStep(2); // fallback
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
                        setNcStep(2);
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
                      <button className="btn" style={{flex:2}} onClick={()=>setNcStep(2)}>
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
                        try { await saveNightCard(ncData); } catch(e) { console.error('[NC-old] saveNightCard failed:', e); }
                        // Attach Night Card to book and re-save story
                        const updatedBook = {...book, nightCard:ncData};
                        setBook(updatedBook);
                        // Update in memories
                        const updatedMemories = memories.map(m =>
                          m.bookData?.title===book.title && m.heroName===book.heroName
                            ? {...m, bookData:updatedBook} : m
                        );
                        setMemories(updatedMemories);
                        try { await sSet("memories",{items:updatedMemories}); } catch(e) { console.error('[NC-old] sSet memories failed:', e); }
                        // Update cache
                        try {
                          const s = makeStorySeed(book.heroName,theme,extraChars,occasion,occasionCustom,
                            Array.isArray(lessons)?lessons.join("|"):lessons,adventure,storyLen,heroGender,heroClassify,storyGuidance);
                          sSet(`book_${s}`,updatedBook).catch(()=>{});
                        } catch(e) { console.error('[NC-old] cache update failed:', e); }
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
                onClick={()=>onHome ? onHome() : setStage("home")}>🏠 Home</button>
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
                    <button className="btn" onClick={()=>onHome ? onHome() : setStage("home")}>✨ Make a story</button>
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
                    <button className="btn-ghost" style={{marginTop:4,fontSize:12}} onClick={()=>onHome ? onHome() : setStage("home")}>
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
                    <button className="btn" onClick={()=>onHome ? onHome() : setStage("home")}>✨ Make a story</button>
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
                    <button className="btn-ghost" style={{marginTop:4,fontSize:12}} onClick={()=>onHome ? onHome() : setStage("home")}>
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
                onClick={()=>onHome ? onHome() : setStage("home")}>← Home</button>
            </div>
            <SleepSeedLibrary />
          </div>
        )}

      </div>

      {/* ── Night Card Detail View (modal) — uses full NightCard component ── */}
      {viewingNightCard && (
        <div className="vc-modal" onClick={e=>{ if(e.target===e.currentTarget) setViewingNightCard(null); }}
          style={{display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',padding:20}}>
          <div style={{width:"100%",maxWidth:320,animation:"fup .4s ease both",position:'relative'}}>
            {/* Glow */}
            <div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(154,127,212,.12),transparent 70%)',pointerEvents:'none'}}/>
            {/* Card */}
            <div style={{position:'relative',zIndex:1}}>
              <NightCardComponent card={viewingNightCard} size="full"
                flipped={ncDetailFlipped} onFlip={()=>setNcDetailFlipped(!ncDetailFlipped)} />
            </div>
            {/* Context strip */}
            {(viewingNightCard.storyTitle || viewingNightCard.childAge || viewingNightCard.bedtimeActual) && (
              <div style={{marginTop:10,padding:'8px 12px',borderRadius:10,background:'rgba(255,255,255,.03)',
                border:'1px solid rgba(255,255,255,.06)',display:'flex',flexWrap:'wrap',gap:'3px 8px',justifyContent:'center',
                fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(234,242,255,.28)'}}>
                {viewingNightCard.storyTitle && <span>📖 {viewingNightCard.storyTitle}</span>}
                {viewingNightCard.bedtimeActual && <span>🕐 {viewingNightCard.bedtimeActual}</span>}
                {viewingNightCard.childAge && <span>{viewingNightCard.heroName}, age {viewingNightCard.childAge}</span>}
              </div>
            )}
            {/* Flip hint */}
            <div style={{textAlign:'center',marginTop:6,fontSize:9,color:'rgba(234,242,255,.18)',fontFamily:"'DM Mono',monospace"}}>
              {ncDetailFlipped ? 'tap card to see front' : 'tap card to flip'}
            </div>
            {/* Actions */}
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button className="btn-ghost" style={{flex:1,fontSize:11,padding:'10px 8px'}}
                onClick={()=>{setViewingNightCard(null);setNcDetailFlipped(false);}}>Close</button>
              <button className="btn-ghost" style={{flex:1,fontSize:11,padding:'10px 8px'}}
                onClick={()=>{
                  const match = memories.find(m => m.bookData?.title===viewingNightCard.storyTitle && m.heroName===viewingNightCard.heroName);
                  if(match){ setViewingNightCard(null);setNcDetailFlipped(false); setBook(match.bookData); setPageIdx(0); setChosenPath(null); setFromCache(true); setStage("book"); }
                }}>📚 Story</button>
            </div>
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
