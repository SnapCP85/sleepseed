import { useApp } from '../AppContext';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--amber:#E8972A;--amber2:#F5B84C;--teal:#1D9E75;--teal2:#5DCAA5;--cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.hf{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.45}}
@keyframes flt{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.hf-star{position:fixed;border-radius:50%;background:#EEE8FF;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.hf-sky{position:fixed;top:0;left:0;right:0;height:260px;background:linear-gradient(180deg,#050916 0%,#080C18 100%);z-index:0;pointer-events:none}
.hf-moon-pos{position:fixed;top:68px;right:28px;z-index:2;pointer-events:none}
.hf-moon-glow{position:absolute;width:50px;height:50px;border-radius:50%;background:rgba(245,184,76,.07);top:-9px;left:-9px}
.hf-moon{width:30px;height:30px;border-radius:50%;background:#F5B84C;position:relative;overflow:hidden}
.hf-moon-sh{position:absolute;width:29px;height:29px;border-radius:50%;background:#050916;top:-5px;left:-7px}
.hf-nav{display:flex;align-items:center;justify-content:space-between;padding:0 6%;height:56px;border-bottom:1px solid rgba(232,151,42,.07);background:rgba(8,12,24,.97);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
.hf-back{background:transparent;border:none;color:rgba(244,239,232,.35);font-size:13px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;gap:6px;transition:color .15s;padding:0}
.hf-back:hover{color:rgba(244,239,232,.7)}
.hf-badge{background:rgba(20,26,50,.9);border:.5px solid rgba(255,255,255,.07);border-radius:20px;padding:4px 12px;font-size:9.5px;color:var(--amber);display:flex;align-items:center;gap:5px;font-family:var(--mono)}
.hf-dot{width:4px;height:4px;border-radius:50%;background:var(--amber);animation:twk 2s ease-in-out infinite}
.hf-inner{max-width:520px;margin:0 auto;padding:24px 6% 48px;position:relative;z-index:5}
.hf-seed-card{background:rgba(10,14,28,.98);border:.5px solid rgba(255,255,255,.07);border-radius:14px;padding:13px 16px;margin-bottom:12px;display:flex;align-items:flex-start;gap:10px}
.hf-seed-icon{font-size:14px;flex-shrink:0;margin-top:1px}
.hf-seed-lbl{font-size:8px;letter-spacing:.07em;color:var(--amber);font-weight:600;text-transform:uppercase;font-family:var(--mono);margin-bottom:4px}
.hf-seed-txt{font-size:12px;color:var(--dim);line-height:1.65;font-style:italic}
.hf-divider{display:flex;align-items:center;gap:10px;margin:6px 0 12px}
.hf-dline{flex:1;height:.5px;background:rgba(255,255,255,.05)}
.hf-dlbl{font-size:8.5px;color:rgba(255,255,255,.18);font-family:var(--mono);white-space:nowrap}
.hf-path{border-radius:18px;padding:18px 20px;margin-bottom:10px;position:relative;overflow:hidden;cursor:pointer;transition:filter .2s}
.hf-path:hover{filter:brightness(1.06)}
.hf-path:active{transform:scale(.99)}
.hf-path-amber{background:rgba(10,15,34,.98);border:1.5px solid var(--amber);animation:flt 4s ease-in-out infinite}
.hf-path-amber::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,151,42,.4),transparent)}
.hf-path-purple{background:rgba(14,10,28,.98);border:1.5px solid rgba(120,80,240,.4)}
.hf-path-tag{font-size:8px;letter-spacing:.07em;font-weight:600;text-transform:uppercase;font-family:var(--mono);margin-bottom:6px;display:flex;align-items:center;gap:5px}
.hf-tag-dot{width:4px;height:4px;border-radius:50%;flex-shrink:0}
.hf-path-title{font-family:var(--serif);font-size:17px;color:var(--cream);line-height:1.35;margin-bottom:4px;font-weight:700}
.hf-path-sub{font-size:11px;color:var(--muted);line-height:1.6;margin-bottom:12px}
.hf-path-btn{border:none;border-radius:12px;padding:12px 18px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:var(--sans);width:100%;letter-spacing:.01em;transition:filter .15s}
.hf-path-btn:active{transform:scale(.98)}
.hf-btn-amber{background:linear-gradient(135deg,#E8972A,#CC7818);color:#120800}
.hf-btn-purple{background:rgba(120,80,240,.18);border:1px solid rgba(160,120,255,.28);color:rgba(190,160,255,.9)}
.hf-note{text-align:center;font-size:10px;color:#2A3050;margin-top:8px;line-height:1.5}
.hf-note em{color:#3A4060}
`;

const STARS = Array.from({ length: 18 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 32,
  size: Math.random() < .4 ? 3 : 2,
  d: (2.5 + Math.random() * 2.5).toFixed(1) + 's',
  dl: (Math.random() * 3).toFixed(1) + 's',
}));

export default function StoryHandoff() {
  const { setView, ritualSeed, selectedCharacters } = useApp();
  const primary = selectedCharacters[0] ?? null;
  const nightLabel = primary ? `${primary.name} · tonight` : 'tonight';

  const seedPreview = ritualSeed.length > 120
    ? ritualSeed.slice(0, 120).trimEnd() + '…'
    : ritualSeed;

  return (
    <div className="hf">
      <style>{CSS}</style>
      <div className="hf-sky" />
      {STARS.map(s => (
        <div key={s.id} className="hf-star"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, '--d': s.d, '--dl': s.dl } as any} />
      ))}
      <div className="hf-moon-pos">
        <div className="hf-moon-glow" />
        <div className="hf-moon"><div className="hf-moon-sh" /></div>
      </div>

      <nav className="hf-nav">
        <button className="hf-back" onClick={() => setView('ritual-starter')}>← back</button>
        <div className="hf-badge"><div className="hf-dot" />{nightLabel}</div>
      </nav>

      <div className="hf-inner">
        {/* diary entry confirmation */}
        {ritualSeed && (
          <div className="hf-seed-card">
            <div className="hf-seed-icon">📝</div>
            <div style={{ flex: 1 }}>
              <div className="hf-seed-lbl">tonight's diary entry ✦</div>
              <div className="hf-seed-txt">"{seedPreview}"</div>
            </div>
          </div>
        )}

        <div className="hf-divider">
          <div className="hf-dline" />
          <div className="hf-dlbl">now choose tonight's story</div>
          <div className="hf-dline" />
        </div>

        {/* path A — ritual story */}
        <div className="hf-path hf-path-amber" onClick={() => setView('story-configure')}>
          <div className="hf-path-tag" style={{ color: 'var(--amber)' }}>
            <div className="hf-tag-dot" style={{ background: 'var(--amber)', animation: 'twk 2s ease-in-out infinite' }} />
            tonight's ritual story
          </div>
          <div className="hf-path-title">Weave today into the story</div>
          <div className="hf-path-sub">
            {primary ? `${primary.name} stars` : 'Your child stars'} in a story built from their day — what they told you tonight becomes the adventure
          </div>
          <button
            className="hf-path-btn hf-btn-amber"
            onClick={e => { e.stopPropagation(); setView('story-configure'); }}>
            Create ritual story ✦
          </button>
        </div>

        {/* path B — free story */}
        <div className="hf-path hf-path-purple" onClick={() => setView('story-configure')}>
          <div className="hf-path-tag" style={{ color: 'rgba(160,120,255,.85)' }}>
            <div className="hf-tag-dot" style={{ background: 'rgba(160,120,255,.85)' }} />
            create together
          </div>
          <div className="hf-path-title">Build a fun story instead</div>
          <div className="hf-path-sub">
            Diary entry saved — now invent something new together tonight
          </div>
          <button
            className="hf-path-btn hf-btn-purple"
            onClick={e => { e.stopPropagation(); setView('story-configure'); }}>
            Choose our adventure →
          </button>
        </div>

        <div className="hf-note">Either way, tonight's diary entry is <em>saved to the Night Card forever ✦</em></div>
      </div>
    </div>
  );
}
