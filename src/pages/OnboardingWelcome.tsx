import { useApp } from '../AppContext';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--night:#080C18;--amber:#E8972A;--amber2:#F5B84C;--cream:#F4EFE8;--dim:#C8BFB0;--muted:#3A4270;--serif:'Playfair Display',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'DM Mono',monospace}
.ow{min-height:100vh;background:var(--night);font-family:var(--sans);color:var(--cream);-webkit-font-smoothing:antialiased;display:flex;flex-direction:column}
@keyframes twk{0%,100%{opacity:.05}50%{opacity:.55}}
@keyframes twk2{0%,100%{opacity:.22}60%{opacity:.04}}
@keyframes moon-glow{0%,100%{box-shadow:0 0 20px rgba(245,184,76,.2),0 0 40px rgba(245,184,76,.08)}50%{box-shadow:0 0 32px rgba(245,184,76,.38),0 0 64px rgba(245,184,76,.16)}}
@keyframes pulse-ring{0%,100%{box-shadow:0 0 0 0 rgba(245,184,76,.4)}50%{box-shadow:0 0 0 12px rgba(245,184,76,0)}}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.ow-star{position:fixed;border-radius:50%;background:#EEE8FF;animation:twk var(--d,3s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.ow-star2{position:fixed;border-radius:50%;background:#C8C0B0;animation:twk2 var(--d,4.5s) var(--dl,0s) ease-in-out infinite;pointer-events:none;z-index:0}
.ow-sky{position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg,#030712 0%,#080C18 55%);z-index:0;pointer-events:none}
.ow-content{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 28px 28px;position:relative;z-index:5;text-align:center;max-width:480px;margin:0 auto;width:100%}
.ow-moon-wrap{position:relative;margin-bottom:22px}
.ow-moon{width:60px;height:60px;border-radius:50%;background:var(--amber2);position:relative;overflow:hidden;margin:0 auto;animation:moon-glow 3s ease-in-out infinite}
.ow-moon-sh{position:absolute;width:58px;height:58px;border-radius:50%;background:#030712;top:-9px;left:-12px}
.ow-moon-ring{position:absolute;width:84px;height:84px;border-radius:50%;border:1px solid rgba(245,184,76,.12);top:-12px;left:-12px;animation:pulse-ring 3s ease-in-out infinite}
.ow-moon-ring2{position:absolute;width:104px;height:104px;border-radius:50%;border:1px solid rgba(245,184,76,.06);top:-22px;left:-22px;animation:pulse-ring 3s ease-in-out infinite;animation-delay:.5s}
.ow-eyebrow{font-size:9px;letter-spacing:.1em;color:rgba(232,151,42,.65);font-weight:600;text-transform:uppercase;font-family:var(--mono);margin-bottom:14px;animation:rise .6s ease-out .1s both}
.ow-title{font-family:var(--serif);font-size:clamp(26px,5vw,36px);color:var(--cream);line-height:1.28;margin-bottom:18px;font-weight:700;letter-spacing:-.02em;animation:rise .6s ease-out .25s both}
.ow-title em{font-style:italic;color:var(--amber2)}
.ow-body{font-size:14px;color:rgba(244,239,232,.75);line-height:1.85;margin-bottom:20px;animation:rise .6s ease-out .4s both;font-weight:300}
.ow-body strong{color:rgba(244,239,232,.92);font-weight:500}
.ow-card{background:rgba(232,151,42,.05);border:.5px solid rgba(232,151,42,.18);border-radius:16px;padding:14px 18px;margin-bottom:24px;animation:rise .6s ease-out .55s both}
.ow-card-text{font-family:var(--serif);font-size:14px;color:rgba(244,239,232,.68);font-style:italic;line-height:1.75}
.ow-card-text em{color:var(--amber2);font-style:italic}
.ow-cta{background:linear-gradient(135deg,#E8972A,#CC7818);border:none;border-radius:14px;padding:16px 28px;font-size:14.5px;font-weight:600;color:#120800;cursor:pointer;font-family:var(--sans);width:100%;letter-spacing:.01em;animation:rise .6s ease-out .7s both;transition:filter .2s,transform .15s;margin-bottom:12px}
.ow-cta:hover{filter:brightness(1.08);transform:translateY(-1px)}
.ow-skip{font-size:11px;color:rgba(255,255,255,.18);cursor:pointer;background:none;border:none;font-family:var(--sans);width:100%;text-align:center;transition:color .15s;animation:rise .6s ease-out .85s both;padding:4px 0}
.ow-skip:hover{color:rgba(255,255,255,.4)}
`;

const STARS = Array.from({ length: 30 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() < .4 ? 3 : 2,
  d: (2.5 + Math.random() * 3).toFixed(1) + 's',
  dl: (Math.random() * 4).toFixed(1) + 's',
  t: Math.random() < .5 ? 1 : 2,
}));

export default function OnboardingWelcome() {
  const { setView } = useApp();

  return (
    <div className="ow">
      <style>{CSS}</style>
      <div className="ow-sky" />
      {STARS.map(s => (
        <div key={s.id} className={s.t === 1 ? 'ow-star' : 'ow-star2'}
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, '--d': s.d, '--dl': s.dl } as any} />
      ))}

      <div className="ow-content">
        <div className="ow-moon-wrap">
          <div className="ow-moon"><div className="ow-moon-sh" /></div>
          <div className="ow-moon-ring" />
          <div className="ow-moon-ring2" />
        </div>

        <div className="ow-eyebrow">Welcome to SleepSeed</div>

        <div className="ow-title">
          The 20 minutes<br />before sleep are<br /><em>the most important</em><br />of the day.
        </div>

        <div className="ow-body">
          As your child drifts off, their mind opens. The things they felt but
          couldn't say. The questions they had but didn't ask. The moments
          still sitting in their chest.<br /><br />
          <strong>They come out right here, in the quiet before sleep.</strong>{' '}
          And in ten years, most of it will be gone. Not because anything
          bad happened. Just because that's how time works.
        </div>

        <div className="ow-card">
          <div className="ow-card-text">
            SleepSeed is how you show up for that window — with a story that
            makes them feel seen, and a Night Card that{' '}
            <em>keeps what they said.</em>
          </div>
        </div>

        <button className="ow-cta" onClick={() => setView('onboarding-tour')}>
          Begin ✦
        </button>

        <button className="ow-skip" onClick={() => setView('onboarding-night0')}>
          I know — skip to setup →
        </button>
      </div>
    </div>
  );
}
