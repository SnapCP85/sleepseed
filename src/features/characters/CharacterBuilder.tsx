import { useState, useRef } from 'react';
import { useApp } from '../../AppContext';
import { saveCharacter, uid } from '../../lib/storage';
import type { Character, CharacterType, Pronoun, PersonalityTag } from '../../lib/types';

const CHAR_TYPES: { v: CharacterType; label: string; emoji: string; desc: string }[] = [
  { v: 'human',   label: 'Person',   emoji: '🧒', desc: 'A child, grown-up, or any human' },
  { v: 'animal',  label: 'Animal',   emoji: '🐶', desc: 'A pet, wild animal, or creature' },
  { v: 'stuffy',  label: 'Stuffy',   emoji: '🧸', desc: 'A beloved stuffed animal or toy' },
  { v: 'creature',label: 'Creature', emoji: '🐉', desc: 'A dragon, monster, or fantastical being' },
  { v: 'other',   label: 'Other',    emoji: '✨', desc: 'Something entirely their own' },
];

const PRONOUNS: Pronoun[] = ['she/her', 'he/him', 'they/them', 'it/its', 'other'];

const PERSONALITY: { v: PersonalityTag; emoji: string }[] = [
  { v: 'brave',        emoji: '🦁' }, { v: 'shy',        emoji: '🌸' },
  { v: 'curious',      emoji: '🔍' }, { v: 'silly',      emoji: '🤪' },
  { v: 'kind',         emoji: '💛' }, { v: 'stubborn',   emoji: '🐂' },
  { v: 'creative',     emoji: '🎨' }, { v: 'loud',       emoji: '📢' },
  { v: 'gentle',       emoji: '🕊️' }, { v: 'adventurous',emoji: '🗺️' },
  { v: 'clever',       emoji: '💡' }, { v: 'sensitive',  emoji: '🌊' },
  { v: 'funny',        emoji: '😂' }, { v: 'caring',     emoji: '🤗' },
  { v: 'determined',   emoji: '🎯' }, { v: 'dreamy',     emoji: '☁️' },
];

const AVATAR_COLORS = ['#2D1B69','#1E3A5F','#4A1942','#1A3A4A','#3B1F0A','#1A1A2E','#1A2E1A','#2E1A3E'];
const WEIRD_DETAIL_EXAMPLES = [
  'Keeps a list of every dog they\'ve ever met, in order of how much they seemed to understand them',
  'Believes the moon follows them specifically, and waves at it every night',
  'Always sneezes in threes — never two, never four',
  'Has named every single cloud they\'ve ever seen',
  'Eats all their food in alphabetical order',
  'Can\'t sleep unless their stuffed animals are arranged by height',
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.cb-wrap{min-height:100vh;background:#0B0B1A;font-family:'DM Sans',sans-serif;color:#F0EDE8;padding:0 0 80px}
.cb-nav{display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(11,11,26,.97);position:sticky;top:0;z-index:10;backdrop-filter:blur(12px)}
.cb-back{background:transparent;border:none;color:rgba(240,237,232,.45);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:6px;transition:color .2s}
.cb-back:hover{color:rgba(240,237,232,.8)}
.cb-nav-title{font-family:'Lora',serif;font-size:17px;font-weight:700;color:#F0EDE8}
.cb-inner{max-width:560px;margin:0 auto;padding:32px 24px}
.cb-section{margin-bottom:28px}
.cb-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:'DM Mono',monospace;color:rgba(168,85,247,.65);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.cb-label-dot{width:5px;height:5px;border-radius:50%;background:rgba(168,85,247,.65)}
.cb-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:13px 16px;font-size:15px;color:#F0EDE8;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s}
.cb-input:focus{border-color:rgba(168,85,247,.5)}
.cb-input::placeholder{color:rgba(240,237,232,.2);font-weight:300}
.cb-textarea{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:13px 16px;font-size:14px;color:#F0EDE8;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s;resize:vertical;min-height:80px;line-height:1.6}
.cb-textarea:focus{border-color:rgba(168,85,247,.5)}
.cb-textarea::placeholder{color:rgba(240,237,232,.2);font-weight:300;font-style:italic}
.cb-type-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.cb-type-btn{border-radius:14px;padding:14px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);transition:all .2s}
.cb-type-btn:hover{background:rgba(255,255,255,.07)}
.cb-type-btn.sel{background:rgba(168,85,247,.12);border-color:rgba(168,85,247,.4)}
.cb-type-emoji{font-size:24px;line-height:1}
.cb-type-label{font-size:9px;font-weight:600;color:rgba(240,237,232,.45);text-transform:uppercase;letter-spacing:.5px}
.cb-type-btn.sel .cb-type-label{color:#C084FC}
.cb-pronoun-row{display:flex;gap:8px;flex-wrap:wrap}
.cb-pronoun{padding:8px 16px;border-radius:50px;cursor:pointer;border:1px solid rgba(255,255,255,.1);color:rgba(240,237,232,.45);background:transparent;font-size:12px;font-weight:500;font-family:'DM Sans',sans-serif;transition:all .2s}
.cb-pronoun.sel{background:rgba(168,85,247,.15);border-color:rgba(168,85,247,.45);color:#C084FC}
.cb-tags{display:flex;flex-wrap:wrap;gap:8px}
.cb-tag{padding:7px 14px;border-radius:50px;cursor:pointer;border:1px solid rgba(255,255,255,.08);color:rgba(240,237,232,.45);background:rgba(255,255,255,.03);font-size:12px;font-weight:500;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;gap:5px}
.cb-tag:hover{background:rgba(255,255,255,.07)}
.cb-tag.sel{background:rgba(168,85,247,.15);border-color:rgba(168,85,247,.4);color:#C084FC}
.cb-hint{font-size:11px;color:rgba(240,237,232,.3);margin-top:8px;line-height:1.6;font-style:italic}
.cb-avatar-row{display:flex;gap:8px;align-items:center;margin-bottom:16px}
.cb-avatar-preview{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;border:2px solid rgba(168,85,247,.3);flex-shrink:0}
.cb-colors{display:flex;gap:8px;flex-wrap:wrap}
.cb-color{width:28px;height:28px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all .2s}
.cb-color.sel{border-color:rgba(240,237,232,.8);transform:scale(1.15)}
.cb-photo-btn{background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);border-radius:10px;padding:9px 16px;color:rgba(192,132,252,.8);font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.cb-photo-btn:hover{background:rgba(168,85,247,.14)}
.cb-example-btn{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:7px 12px;color:rgba(240,237,232,.35);font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;margin-top:8px;transition:all .2s;width:100%;text-align:left}
.cb-example-btn:hover{background:rgba(255,255,255,.06);color:rgba(240,237,232,.6)}
.cb-save-bar{position:fixed;bottom:0;left:0;right:0;padding:16px 24px;background:rgba(11,11,26,.97);border-top:1px solid rgba(255,255,255,.07);display:flex;gap:12px;max-width:560px;margin:0 auto}
.cb-save-btn{flex:1;padding:14px;background:linear-gradient(135deg,#7C3AED,#A855F7);color:white;border:none;border-radius:12px;font-size:15px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.cb-save-btn:hover{opacity:.9;transform:translateY(-1px)}
.cb-save-btn:disabled{opacity:.35;cursor:not-allowed;transform:none}
.cb-cancel-btn{padding:14px 20px;background:transparent;border:1px solid rgba(255,255,255,.1);border-radius:12px;color:rgba(240,237,232,.45);font-size:14px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.cb-cancel-btn:hover{border-color:rgba(255,255,255,.2);color:rgba(240,237,232,.7)}
.cb-optional{font-size:10px;color:rgba(240,237,232,.25);letter-spacing:.5px;margin-left:8px;font-style:normal}
`;

interface Props {
  onSaved: () => void;
  onCancel: () => void;
  initialCharacter?: Character | null;
  userId: string;
}

export default function CharacterBuilder({ onSaved, onCancel, initialCharacter, userId }: Props) {
  const exampleIdx = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialCharacter?.name || '');
  const [type, setType] = useState<CharacterType>(initialCharacter?.type || 'human');
  const [ageDesc, setAgeDesc] = useState(initialCharacter?.ageDescription || '');
  const [pronouns, setPronouns] = useState<Pronoun>(initialCharacter?.pronouns || 'she/her');
  const [tags, setTags] = useState<PersonalityTag[]>(initialCharacter?.personalityTags || []);
  const [weirdDetail, setWeirdDetail] = useState(initialCharacter?.weirdDetail || '');
  const [situation, setSituation] = useState(initialCharacter?.currentSituation || '');
  const [photo, setPhoto] = useState<string | undefined>(initialCharacter?.photo);
  const [color, setColor] = useState(initialCharacter?.color || AVATAR_COLORS[0]);
  const [emoji, setEmoji] = useState(initialCharacter?.emoji || CHAR_TYPES[0].emoji);

  const toggleTag = (t: PersonalityTag) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : prev.length < 5 ? [...prev, t] : prev);

  const cycleExample = () => {
    setWeirdDetail(WEIRD_DETAIL_EXAMPLES[exampleIdx.current % WEIRD_DETAIL_EXAMPLES.length]);
    exampleIdx.current++;
  };

  const pickPhoto = () => fileRef.current?.click();
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const typeEmoji = CHAR_TYPES.find(t => t.v === type)?.emoji || '✨';
    const char: Character = {
      id: initialCharacter?.id || uid(),
      userId,
      name: name.trim(),
      type,
      ageDescription: ageDesc.trim(),
      pronouns,
      personalityTags: tags,
      weirdDetail: weirdDetail.trim(),
      currentSituation: situation.trim(),
      photo,
      color,
      emoji: typeEmoji,
      storyIds: initialCharacter?.storyIds || [],
      createdAt: initialCharacter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveCharacter(char);
    onSaved();
  };

  const currentType = CHAR_TYPES.find(t => t.v === type);

  return (
    <div className="cb-wrap">
      <style>{CSS}</style>
      <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={onPhoto} />

      <nav className="cb-nav">
        <button className="cb-back" onClick={onCancel}>← Back</button>
        <div className="cb-nav-title">{initialCharacter ? 'Edit character' : 'New character'}</div>
      </nav>

      <div className="cb-inner">

        {/* Avatar preview */}
        <div className="cb-section">
          <div className="cb-avatar-row">
            <div className="cb-avatar-preview" style={{ background: color }}>
              {photo ? <img src={photo} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                : <span>{currentType?.emoji}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div className="cb-colors">
                {AVATAR_COLORS.map(c => (
                  <div key={c} className={`cb-color${color === c ? ' sel' : ''}`}
                    style={{ background: c }} onClick={() => setColor(c)} />
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <button className="cb-photo-btn" onClick={pickPhoto}>
                  {photo ? '📷 Change photo' : '📷 Add photo (optional)'}
                </button>
                {photo && <button className="cb-photo-btn" style={{ marginLeft: 8, background: 'rgba(239,68,68,.06)', borderColor: 'rgba(239,68,68,.2)', color: 'rgba(252,165,165,.8)' }} onClick={() => setPhoto(undefined)}>Remove</button>}
              </div>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="cb-section">
          <div className="cb-label"><div className="cb-label-dot" />Name</div>
          <input className="cb-input" placeholder="What are they called?" value={name}
            onChange={e => setName(e.target.value)} maxLength={30} />
        </div>

        {/* Type */}
        <div className="cb-section">
          <div className="cb-label"><div className="cb-label-dot" />Type</div>
          <div className="cb-type-grid">
            {CHAR_TYPES.map(t => (
              <button key={t.v} className={`cb-type-btn${type === t.v ? ' sel' : ''}`}
                onClick={() => setType(t.v)}>
                <span className="cb-type-emoji">{t.emoji}</span>
                <span className="cb-type-label">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="cb-hint">{currentType?.desc}</div>
        </div>

        {/* Age / description */}
        <div className="cb-section">
          <div className="cb-label"><div className="cb-label-dot" />Age or description<span className="cb-optional">optional</span></div>
          <input className="cb-input"
            placeholder={type === 'human' ? '5 years old' : type === 'animal' ? 'a fluffy orange cat, about 3' : type === 'stuffy' ? 'a well-loved bear, very old' : 'ancient and wise, very tall'}
            value={ageDesc} onChange={e => setAgeDesc(e.target.value)} maxLength={80} />
        </div>

        {/* Pronouns */}
        <div className="cb-section">
          <div className="cb-label"><div className="cb-label-dot" />Pronouns</div>
          <div className="cb-pronoun-row">
            {PRONOUNS.map(p => (
              <button key={p} className={`cb-pronoun${pronouns === p ? ' sel' : ''}`}
                onClick={() => setPronouns(p)}>{p}</button>
            ))}
          </div>
        </div>

        {/* Personality */}
        <div className="cb-section">
          <div className="cb-label"><div className="cb-label-dot" />Personality<span className="cb-optional">pick up to 5</span></div>
          <div className="cb-tags">
            {PERSONALITY.map(t => (
              <button key={t.v} className={`cb-tag${tags.includes(t.v) ? ' sel' : ''}`}
                onClick={() => toggleTag(t.v)}>
                <span>{t.emoji}</span>{t.v}
              </button>
            ))}
          </div>
        </div>

        {/* One weird detail */}
        <div className="cb-section">
          <div className="cb-label"><div className="cb-label-dot" />One weird detail</div>
          <textarea className="cb-textarea"
            placeholder="The one specific thing that makes them completely, uniquely themselves…"
            value={weirdDetail} onChange={e => setWeirdDetail(e.target.value)}
            maxLength={200} rows={3} />
          <button className="cb-example-btn" onClick={cycleExample}>
            ✨ Show me an example
          </button>
          <div className="cb-hint">This is the most important field. The weirder and more specific, the better the story.</div>
        </div>

        {/* Current situation */}
        <div className="cb-section">
          <div className="cb-label"><div className="cb-label-dot" />Current situation<span className="cb-optional">optional</span></div>
          <textarea className="cb-textarea"
            placeholder="What's going on in their life right now? Starting a new school, nervous about something, a new sibling…"
            value={situation} onChange={e => setSituation(e.target.value)}
            maxLength={200} rows={3} />
          <div className="cb-hint">This gets woven into stories when it's relevant. Update it whenever something changes.</div>
        </div>

        <div style={{ height: 80 }} />
      </div>

      <div className="cb-save-bar">
        <button className="cb-cancel-btn" onClick={onCancel}>Cancel</button>
        <button className="cb-save-btn" disabled={!name.trim()} onClick={handleSave}>
          {initialCharacter ? 'Save changes' : 'Save character'} ✓
        </button>
      </div>
    </div>
  );
}
