import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../AppContext';
import { saveCharacter, uid } from '../../lib/storage';
import type { Character, CharacterType, Pronoun, PersonalityTag, ParentRole } from '../../lib/types';

const CHAR_TYPES: { v: CharacterType; label: string; emoji: string; desc: string }[] = [
  { v: 'human',    label: 'Child',    emoji: '🧒', desc: 'A child who stars in stories' },
  { v: 'parent',   label: 'Parent',   emoji: '🧑‍🍼', desc: 'Mom, Dad, Grandma, Grandpa' },
  { v: 'animal',   label: 'Animal',   emoji: '🐶', desc: 'A pet, wild animal, or creature' },
  { v: 'stuffy',   label: 'Stuffy',   emoji: '🧸', desc: 'A beloved stuffed animal or toy' },
  { v: 'creature', label: 'DreamKeeper', emoji: '🐉', desc: 'A dragon, monster, or fantastical being' },
  { v: 'other',    label: 'Other',    emoji: '✨', desc: 'Something entirely their own' },
];
const PARENT_ROLES: { v: ParentRole; label: string; emoji: string }[] = [
  { v: 'mom',     label: 'Mom',     emoji: '👩' },
  { v: 'dad',     label: 'Dad',     emoji: '👨' },
  { v: 'grandma', label: 'Grandma', emoji: '👵' },
  { v: 'grandpa', label: 'Grandpa', emoji: '👴' },
];
const PRONOUNS: Pronoun[] = ['she/her', 'he/him', 'they/them', 'it/its', 'other'];
const PERSONALITY: { v: PersonalityTag; emoji: string }[] = [
  {v:'brave',emoji:'🦁'},{v:'shy',emoji:'🌸'},{v:'curious',emoji:'🔍'},{v:'silly',emoji:'🤪'},
  {v:'kind',emoji:'💛'},{v:'stubborn',emoji:'🐂'},{v:'creative',emoji:'🎨'},{v:'loud',emoji:'📢'},
  {v:'gentle',emoji:'🕊️'},{v:'adventurous',emoji:'🗺️'},{v:'clever',emoji:'💡'},{v:'sensitive',emoji:'🌊'},
  {v:'funny',emoji:'😂'},{v:'caring',emoji:'🤗'},{v:'determined',emoji:'🎯'},{v:'dreamy',emoji:'☁️'},
];
const AVATAR_COLORS = ['#1E1640','#1A2E40','#2A1A30','#1A2E1A','#2E1A10','#1A1A2E','#2E2010','#1A2A2E'];
const WEIRD_EXAMPLES = [
  "Keeps a list of every dog they've ever met, in order of how much they seemed to understand them",
  "Believes the moon follows them specifically, and waves at it every night",
  "Always sneezes in threes — never two, never four",
  "Has named every single cloud they've ever seen",
  "Can't sleep unless their stuffed animals are arranged by height",
  "Eats all their food in alphabetical order when nervous",
];

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#0D1018;--night2:#131828;--amber:#E8972A;--amber2:#F5B84C;--ink:#1A1420;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace;}
.cb{min-height:100vh;background:var(--night);font-family:var(--sans);color:#F4EFE8;padding-bottom:100px;-webkit-font-smoothing:antialiased}
.cb-nav{display:flex;align-items:center;gap:14px;padding:0 6%;height:64px;border-bottom:1px solid rgba(232,151,42,.1);background:rgba(13,16,24,.97);position:sticky;top:0;z-index:10;backdrop-filter:blur(16px)}
.cb-back{background:transparent;border:none;color:rgba(244,239,232,.4);font-size:13px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;gap:6px;transition:color .15s}
.cb-back:hover{color:rgba(244,239,232,.75)}
.cb-nav-title{font-family:var(--serif);font-size:17px;font-weight:700;color:#F4EFE8}
.cb-inner{max-width:580px;margin:0 auto;padding:36px 24px}
.cb-sec{margin-bottom:28px}
.cb-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:var(--mono);color:rgba(232,151,42,.55);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.cb-label-dot{width:5px;height:5px;border-radius:50%;background:rgba(232,151,42,.5)}
.cb-opt{font-size:10px;color:rgba(244,239,232,.25);letter-spacing:.5px;font-style:normal;margin-left:6px}
.cb-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:14px 16px;font-size:15px;color:#F4EFE8;font-family:var(--sans);outline:none;transition:all .2s}
.cb-input:focus{border-color:rgba(232,151,42,.4);background:rgba(232,151,42,.02)}
.cb-input::placeholder{color:rgba(244,239,232,.18);font-weight:300;font-style:italic}
.cb-textarea{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:14px 16px;font-size:14px;color:#F4EFE8;font-family:var(--sans);outline:none;transition:all .2s;resize:vertical;min-height:86px;line-height:1.65}
.cb-textarea:focus{border-color:rgba(232,151,42,.4)}
.cb-textarea::placeholder{color:rgba(244,239,232,.18);font-weight:300;font-style:italic}
.cb-hint{font-size:11.5px;color:rgba(244,239,232,.28);margin-top:9px;line-height:1.65;font-style:italic}
.cb-av-row{display:flex;gap:16px;align-items:center;margin-bottom:18px}
.cb-av-preview{width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;border:2px solid rgba(232,151,42,.2);flex-shrink:0;overflow:hidden}
.cb-colors{display:flex;gap:8px;flex-wrap:wrap}
.cb-color{width:26px;height:26px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all .2s}
.cb-color.sel{border-color:rgba(244,239,232,.85);transform:scale(1.18)}
.cb-photo-btn{background:rgba(232,151,42,.07);border:1px solid rgba(232,151,42,.18);border-radius:9px;padding:8px 14px;color:rgba(232,151,42,.7);font-size:12px;font-weight:500;cursor:pointer;font-family:var(--sans);transition:all .2s;margin-top:10px}
.cb-photo-btn:hover{background:rgba(232,151,42,.12)}

/* ── isFamily toggle ── */
.cb-family-card{border-radius:14px;padding:14px 16px;margin-bottom:6px;cursor:pointer;transition:all .22s;position:relative;overflow:hidden}
.cb-family-card.on{background:rgba(232,151,42,.06);border:1.5px solid rgba(232,151,42,.35)}
.cb-family-card:not(.on){background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08)}
.cb-family-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,151,42,.3),transparent);opacity:0;transition:opacity .22s}
.cb-family-card.on::before{opacity:1}
.cb-family-row{display:flex;align-items:center;justify-content:space-between}
.cb-family-text{}
.cb-family-tag{font-size:8px;letter-spacing:.07em;color:rgba(232,151,42,.6);font-weight:600;text-transform:uppercase;font-family:var(--mono);margin-bottom:4px}
.cb-family-title{font-size:13px;font-weight:600;color:#F4EFE8}
.cb-family-sub{font-size:10.5px;color:rgba(244,239,232,.35);margin-top:2px}
.cb-toggle{width:40px;height:23px;border-radius:12px;flex-shrink:0;position:relative;cursor:pointer;transition:background .22s}
.cb-toggle.on{background:var(--amber)}
.cb-toggle:not(.on){background:rgba(255,255,255,.1)}
.cb-toggle-knob{width:19px;height:19px;border-radius:50%;background:white;position:absolute;top:2px;transition:left .22s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.cb-toggle.on .cb-toggle-knob{left:19px}
.cb-toggle:not(.on) .cb-toggle-knob{left:2px}

/* ── type grid ── */
.cb-type-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.cb-type-btn{border-radius:14px;padding:14px 6px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);transition:all .2s}
.cb-type-btn:hover{background:rgba(255,255,255,.07)}
.cb-type-btn.sel{background:rgba(232,151,42,.1);border-color:rgba(232,151,42,.35)}
.cb-type-emoji{font-size:24px;line-height:1}
.cb-type-label{font-size:9px;font-weight:600;color:rgba(244,239,232,.38);text-transform:uppercase;letter-spacing:.5px}
.cb-type-btn.sel .cb-type-label{color:rgba(232,151,42,.85)}

/* ── parent role ── */
.cb-parent-sub{background:rgba(10,14,28,.98);border:.5px solid rgba(255,255,255,.07);border-radius:12px;padding:12px 14px;margin-top:8px}
.cb-ps-lbl{font-size:8px;color:rgba(244,239,232,.28);font-family:var(--mono);letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px;font-weight:600}
.cb-ps-row{display:flex;gap:8px;flex-wrap:wrap}
.cb-ps-pill{border-radius:20px;padding:7px 14px;font-size:12px;cursor:pointer;font-family:var(--sans);transition:all .15s;border:.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(255,255,255,.38);display:flex;align-items:center;gap:5px}
.cb-ps-pill.on{border-color:var(--amber);background:rgba(232,151,42,.1);color:var(--amber2)}

.cb-pronoun-row{display:flex;gap:8px;flex-wrap:wrap}
.cb-pronoun{padding:8px 16px;border-radius:50px;cursor:pointer;border:1px solid rgba(255,255,255,.09);color:rgba(244,239,232,.4);background:transparent;font-size:12px;font-weight:500;font-family:var(--sans);transition:all .2s}
.cb-pronoun.sel{background:rgba(232,151,42,.12);border-color:rgba(232,151,42,.38);color:var(--amber2)}
.cb-tags{display:flex;flex-wrap:wrap;gap:8px}
.cb-tag{padding:7px 14px;border-radius:50px;cursor:pointer;border:1px solid rgba(255,255,255,.08);color:rgba(244,239,232,.4);background:rgba(255,255,255,.03);font-size:12px;font-weight:500;font-family:var(--sans);transition:all .2s;display:flex;align-items:center;gap:5px}
.cb-tag:hover{background:rgba(255,255,255,.07)}
.cb-tag.sel{background:rgba(232,151,42,.12);border-color:rgba(232,151,42,.35);color:var(--amber2)}
.cb-example-btn{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:8px 14px;color:rgba(244,239,232,.35);font-size:12px;cursor:pointer;font-family:var(--sans);margin-top:9px;transition:all .2s;width:100%;text-align:left}
.cb-example-btn:hover{background:rgba(255,255,255,.06);color:rgba(244,239,232,.6)}
.cb-save-bar{position:fixed;bottom:0;left:0;right:0;padding:16px 24px;background:rgba(13,16,24,.97);border-top:1px solid rgba(255,255,255,.06);display:flex;gap:12px;justify-content:center;backdrop-filter:blur(16px)}
.cb-save-bar-inner{display:flex;gap:12px;width:100%;max-width:580px}
.cb-cancel{padding:14px 22px;background:transparent;border:1px solid rgba(255,255,255,.09);border-radius:13px;color:rgba(244,239,232,.4);font-size:14px;cursor:pointer;font-family:var(--sans);transition:all .2s}
.cb-cancel:hover{border-color:rgba(255,255,255,.18);color:rgba(244,239,232,.7)}
.cb-save{flex:1;padding:14px;background:var(--amber);color:var(--ink);border:none;border-radius:13px;font-size:15px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .2s}
.cb-save:hover{background:var(--amber2);transform:translateY(-1px)}
.cb-save:disabled{opacity:.35;cursor:not-allowed;transform:none}

/* ── Character reveal ceremony ── */
.cb-reveal{position:fixed;inset:0;z-index:100;background:var(--night);display:flex;flex-direction:column;align-items:center;justify-content:center;animation:cbRevealIn .6s ease both}
@keyframes cbRevealIn{from{opacity:0}to{opacity:1}}
.cb-reveal-avatar{width:100px;height:100px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:44px;border:3px solid rgba(232,151,42,.3);overflow:hidden;animation:cbAvPop .5s cubic-bezier(.16,1,.3,1) .2s both;box-shadow:0 0 40px rgba(232,151,42,.15)}
@keyframes cbAvPop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
.cb-reveal-sparkle{position:absolute;border-radius:50%;animation:cbSparkle 1.8s ease-in-out infinite}
@keyframes cbSparkle{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.3)}}
.cb-reveal-name{font-family:var(--serif);font-size:26px;font-weight:700;color:#F4EFE8;margin-top:20px;animation:cbTextUp .5s ease .4s both;text-align:center}
@keyframes cbTextUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.cb-reveal-sub{font-size:14px;color:rgba(232,151,42,.7);margin-top:6px;animation:cbTextUp .5s ease .55s both;font-family:var(--serif);font-style:italic}
.cb-reveal-tags{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:18px;animation:cbTextUp .5s ease .7s both}
.cb-reveal-tag{padding:6px 14px;border-radius:50px;background:rgba(232,151,42,.08);border:1px solid rgba(232,151,42,.2);color:rgba(232,151,42,.8);font-size:12px;font-weight:500;font-family:var(--sans)}
`;

interface Props { onSaved: () => void; onCancel: () => void; initialCharacter?: Character | null; userId: string; }

export default function CharacterBuilder({ onSaved, onCancel, initialCharacter, userId }: Props) {
  const exRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name,       setName]       = useState(initialCharacter?.name || '');
  const [type,       setType]       = useState<CharacterType>(initialCharacter?.type || 'human');
  const [parentRole, setParentRole] = useState<ParentRole | undefined>(initialCharacter?.parentRole);
  const [isFamily,   setIsFamily]   = useState<boolean>(initialCharacter?.isFamily ?? (initialCharacter?.type === 'human' ? false : false));
  const [ageDesc,    setAgeDesc]    = useState(initialCharacter?.ageDescription || '');
  const [birthDate,  setBirthDate]  = useState(initialCharacter?.birthDate || '');
  const [pronouns,   setPronouns]   = useState<Pronoun>(initialCharacter?.pronouns || 'she/her');
  const [tags,       setTags]       = useState<PersonalityTag[]>(initialCharacter?.personalityTags || []);
  const [weirdDetail,setWeirdDetail]= useState(initialCharacter?.weirdDetail || '');
  const [situation,  setSituation]  = useState(initialCharacter?.currentSituation || '');
  const [photo,      setPhoto]      = useState<string | undefined>(initialCharacter?.photo);
  const [color,      setColor]      = useState(initialCharacter?.color || AVATAR_COLORS[0]);
  const [saved,      setSaved]      = useState(false);

  const toggleTag = (t: PersonalityTag) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : prev.length < 5 ? [...prev, t] : prev);
  const cycleExample = () => { setWeirdDetail(WEIRD_EXAMPLES[exRef.current % WEIRD_EXAMPLES.length]); exRef.current++; };
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setPhoto(ev.target?.result as string); r.readAsDataURL(f);
  };

  function handleTypeChange(t: CharacterType) {
    setType(t);
    if (t === 'parent') { setIsFamily(false); setParentRole(undefined); }
    else if (t === 'human') { /* keep isFamily as-is */ }
    else { setIsFamily(false); }
  }

  const handleSave = () => {
    if (!name.trim()) return;
    const typeEmoji = type === 'parent'
      ? (PARENT_ROLES.find(p => p.v === parentRole)?.emoji ?? '🧑‍🍼')
      : (CHAR_TYPES.find(t => t.v === type)?.emoji || '✨');
    saveCharacter({
      id: initialCharacter?.id || uid(), userId,
      name: name.trim(), type, ageDescription: ageDesc.trim(),
      pronouns, personalityTags: tags, weirdDetail: weirdDetail.trim(),
      currentSituation: situation.trim(), photo, color, emoji: typeEmoji,
      storyIds: initialCharacter?.storyIds || [],
      createdAt: initialCharacter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFamily: isFamily || undefined,
      parentRole: type === 'parent' ? parentRole : undefined,
      birthDate: birthDate || undefined,
    });
    if (initialCharacter) { onSaved(); return; }
    setSaved(true);
  };

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => onSaved(), 2800);
    return () => clearTimeout(t);
  }, [saved, onSaved]);

  const ct = CHAR_TYPES.find(t => t.v === type);

  if (saved) {
    const SPARKLES = Array.from({length:12},(_,i) => ({
      x: 50 + 40*Math.cos(i*Math.PI/6), y: 50 + 40*Math.sin(i*Math.PI/6),
      s: 3+Math.random()*4, d: `${1.5+Math.random()}s`, dl: `${Math.random()*.8}s`,
      c: i%2===0 ? 'rgba(232,151,42,.6)' : 'rgba(245,184,76,.4)',
    }));
    return (
      <div className="cb">
        <style>{CSS}</style>
        <div className="cb-reveal">
          <div style={{position:'relative'}}>
            {SPARKLES.map((s,i) => (
              <div key={i} className="cb-reveal-sparkle" style={{
                left:`${s.x}%`,top:`${s.y}%`,width:s.s,height:s.s,
                background:s.c,animationDuration:s.d,animationDelay:s.dl,
              }} />
            ))}
            <div className="cb-reveal-avatar" style={{background:color}}>
              {photo ? <img src={photo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : ct?.emoji}
            </div>
          </div>
          <div className="cb-reveal-name">{name.trim()}</div>
          <div className="cb-reveal-sub">
            {isFamily ? 'is ready for their first story ✦' : type === 'parent' ? 'has joined the family ✦' : 'is ready for adventure ✦'}
          </div>
          {tags.length > 0 && (
            <div className="cb-reveal-tags">
              {tags.map(t => {
                const p = PERSONALITY.find(p => p.v === t);
                return <div key={t} className="cb-reveal-tag">{p?.emoji} {t}</div>;
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="cb">
      <style>{CSS}</style>
      <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={onPhoto} />
      <nav className="cb-nav">
        <button className="cb-back" onClick={onCancel}>← Back</button>
        <div className="cb-nav-title">{initialCharacter ? 'Edit character' : 'New character'}</div>
      </nav>
      <div className="cb-inner">

        {/* ── isFamily toggle — shown for non-parent types ── */}
        {type !== 'parent' && (
          <div className="cb-sec">
            <div className="cb-label"><div className="cb-label-dot" />Who is this?</div>
            <div className={`cb-family-card${isFamily ? ' on' : ''}`} onClick={() => setIsFamily(p => !p)}>
              <div className="cb-family-row">
                <div className="cb-family-text">
                  <div className="cb-family-tag">{isFamily ? 'my child · story hero ✦' : 'supporting character'}</div>
                  <div className="cb-family-title">{isFamily ? 'This is one of my children' : 'This is a supporting character'}</div>
                  <div className="cb-family-sub">{isFamily ? 'Appears in the ritual dashboard' : 'Appears in stories, not the ritual'}</div>
                </div>
                <div className={`cb-toggle${isFamily ? ' on' : ''}`} onClick={e => { e.stopPropagation(); setIsFamily(p => !p); }}>
                  <div className="cb-toggle-knob" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Avatar */}
        <div className="cb-sec">
          <div className="cb-av-row">
            <div className="cb-av-preview" style={{ background: color }}>
              {photo ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : ct?.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div className="cb-colors">
                {AVATAR_COLORS.map(c => <div key={c} className={`cb-color${color === c ? ' sel' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />)}
              </div>
              <button className="cb-photo-btn" onClick={() => fileRef.current?.click()}>
                {photo ? '📷 Change photo' : '📷 Add photo (optional)'}
              </button>
              {photo && <button className="cb-photo-btn" style={{ marginLeft: 8, borderColor: 'rgba(200,80,80,.2)', color: 'rgba(255,160,160,.7)' }} onClick={() => setPhoto(undefined)}>Remove</button>}
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="cb-sec">
          <div className="cb-label"><div className="cb-label-dot" />Name</div>
          <input className="cb-input" placeholder="What are they called?" value={name} onChange={e => setName(e.target.value)} maxLength={30} autoFocus />
        </div>

        {/* Type */}
        <div className="cb-sec">
          <div className="cb-label"><div className="cb-label-dot" />Type</div>
          <div className="cb-type-grid">
            {CHAR_TYPES.map(t => (
              <button key={t.v} className={`cb-type-btn${type === t.v ? ' sel' : ''}`} onClick={() => handleTypeChange(t.v)}>
                <span className="cb-type-emoji">{t.emoji}</span>
                <span className="cb-type-label">{t.label}</span>
              </button>
            ))}
          </div>
          {ct && type !== 'parent' && <div className="cb-hint">{ct.desc}</div>}

          {/* Parent role sub-selector */}
          {type === 'parent' && (
            <div className="cb-parent-sub">
              <div className="cb-ps-lbl">Who is this?</div>
              <div className="cb-ps-row">
                {PARENT_ROLES.map(p => (
                  <button key={p.v} className={`cb-ps-pill${parentRole === p.v ? ' on' : ''}`} onClick={() => setParentRole(p.v)}>
                    <span>{p.emoji}</span>{p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Age */}
        <div className="cb-sec">
          <div className="cb-label"><div className="cb-label-dot" />Age or description<span className="cb-opt">optional</span></div>
          <input className="cb-input"
            placeholder={type === 'human' ? '5 years old' : type === 'parent' ? 'e.g. Emma\'s grandma, loves to bake' : type === 'animal' ? 'a fluffy orange cat, about 3' : type === 'stuffy' ? 'a well-loved bear, very old' : 'ancient and wise, very tall'}
            value={ageDesc} onChange={e => setAgeDesc(e.target.value)} maxLength={80} />
        </div>

        {/* Birthday — only for human/family characters */}
        {(type === 'human') && (
          <div className="cb-sec">
            <div className="cb-label"><div className="cb-label-dot" />Birthday<span className="cb-opt">optional</span></div>
            <input className="cb-input" type="date"
              value={birthDate} onChange={e => setBirthDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{ colorScheme: 'dark' }}
            />
            <div className="cb-hint">Used to show your child's exact age on Night Cards. Makes memories more precious over time.</div>
          </div>
        )}

        {/* Pronouns */}
        <div className="cb-sec">
          <div className="cb-label"><div className="cb-label-dot" />Pronouns</div>
          <div className="cb-pronoun-row">
            {PRONOUNS.map(p => <button key={p} className={`cb-pronoun${pronouns === p ? ' sel' : ''}`} onClick={() => setPronouns(p)}>{p}</button>)}
          </div>
        </div>

        {/* Personality */}
        <div className="cb-sec">
          <div className="cb-label"><div className="cb-label-dot" />Personality<span className="cb-opt">pick up to 5</span></div>
          <div className="cb-tags">
            {PERSONALITY.map(t => (
              <button key={t.v} className={`cb-tag${tags.includes(t.v) ? ' sel' : ''}`} onClick={() => toggleTag(t.v)}>
                <span>{t.emoji}</span>{t.v}
              </button>
            ))}
          </div>
        </div>

        {/* Weird detail */}
        <div className="cb-sec">
          <div className="cb-label"><div className="cb-label-dot" />One weird detail</div>
          <textarea className="cb-textarea" placeholder="The one specific thing that makes them completely, uniquely themselves…" value={weirdDetail} onChange={e => setWeirdDetail(e.target.value)} maxLength={200} rows={3} />
          <button className="cb-example-btn" onClick={cycleExample}>✨ Show me an example</button>
          <div className="cb-hint">This is the most important field. The weirder and more specific, the better the story.</div>
        </div>

        {/* Situation */}
        <div className="cb-sec">
          <div className="cb-label"><div className="cb-label-dot" />Current situation<span className="cb-opt">optional</span></div>
          <textarea className="cb-textarea" placeholder="What's going on in their life right now? New school, nervous about something, a new sibling…" value={situation} onChange={e => setSituation(e.target.value)} maxLength={200} rows={3} />
          <div className="cb-hint">Gets woven into stories when it's relevant. Update it whenever something changes.</div>
        </div>
        <div style={{ height: 80 }} />
      </div>
      <div className="cb-save-bar">
        <div className="cb-save-bar-inner">
          <button className="cb-cancel" onClick={onCancel}>Cancel</button>
          <button className="cb-save" disabled={!name.trim()} onClick={handleSave}>
            {initialCharacter ? 'Save changes' : 'Save character'} ✓
          </button>
        </div>
      </div>
    </div>
  );
}
