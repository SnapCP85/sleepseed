import { useState } from 'react';
import { buildStoryPrompt } from '../sleepseed-prompts';

const GENRES = ['comedy','adventure','wonder','cosy','therapeutic','mystery'] as const;
const AGES = ['3','5','7','9'] as const;

const PRESETS: Record<string,{situation:string;protagonistName:string;protagonistAge:string;weirdDetail:string;setting:string;sensoryAnchor:string}> = {
  quick: {
    situation:'Can\'t sleep because tomorrow is the first day at a new school',
    protagonistName:'Mia', protagonistAge:'5',
    weirdDetail:'she counts every red thing she sees, always loses count at twelve',
    setting:'a small flat above a bakery where the walls are warm by 6am',
    sensoryAnchor:'the smell of proving dough that rises through the floorboards',
  },
  adventure: {
    situation:'Lost a beloved toy rabbit in the park and has to find it before dark',
    protagonistName:'Leo', protagonistAge:'7',
    weirdDetail:'he keeps a mental map of every crack in every pavement he\'s ever walked',
    setting:'a park that backs onto a canal, where the swans are territorial and the geese are worse',
    sensoryAnchor:'the specific crunch of autumn leaves that have been rained on once',
  },
  comedy: {
    situation:'Trying to bake a birthday cake for Dad but everything keeps going wrong',
    protagonistName:'Noor', protagonistAge:'6',
    weirdDetail:'she narrates everything she does in a nature documentary voice',
    setting:'a kitchen where the oven has a personality and the fridge hums off-key',
    sensoryAnchor:'the sound of an egg cracking wrong — that wet, crunchy, immediate regret sound',
  },
};

export default function DevStoryTest() {
  const [genre, setGenre] = useState<string>('comedy');
  const [age, setAge] = useState<string>('5');
  const [situation, setSituation] = useState(PRESETS.quick.situation);
  const [name, setName] = useState(PRESETS.quick.protagonistName);
  const [weirdDetail, setWeirdDetail] = useState(PRESETS.quick.weirdDetail);
  const [setting, setSetting] = useState(PRESETS.quick.setting);
  const [sensoryAnchor, setSensoryAnchor] = useState(PRESETS.quick.sensoryAnchor);
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [promptPreview, setPromptPreview] = useState<{system:string;user:string}|null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  function loadPreset(key: string) {
    const p = PRESETS[key];
    if (!p) return;
    setSituation(p.situation);
    setName(p.protagonistName);
    setAge(p.protagonistAge);
    setWeirdDetail(p.weirdDetail);
    setSetting(p.setting);
    setSensoryAnchor(p.sensoryAnchor);
  }

  function buildBrief() {
    return {
      genre,
      situation,
      protagonistName: name,
      protagonistAge: age,
      weirdDetail,
      setting,
      sensoryAnchor,
      timeOfDay: 'evening, just before bed',
      targetFeeling: 'safe and slightly awed',
      finalLineApproach: 'image',
    };
  }

  function previewPrompt() {
    const brief = buildBrief();
    const { system, user } = buildStoryPrompt(brief);
    setPromptPreview({ system, user });
    setShowPrompt(true);
  }

  async function generate() {
    setLoading(true);
    setStory('');
    setElapsed(0);
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 500);

    try {
      const brief = buildBrief();
      const { system, user } = buildStoryPrompt(brief);
      setPromptPreview({ system, user });

      const r = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      });
      const raw = await r.text();
      let d: any;
      try { d = JSON.parse(raw); } catch {
        throw new Error(`Bad response (${r.status}): ${raw.slice(0, 300)}`);
      }
      if (!r.ok) throw new Error(d.error?.message || `API error ${r.status}: ${JSON.stringify(d).slice(0,300)}`);
      const text = d.content?.find((b: any) => b.type === 'text')?.text || 'No text in response';
      setStory(text);
    } catch (e: any) {
      setStory(`Error: ${e.message}`);
    } finally {
      clearInterval(timer);
      setElapsed(Math.round((Date.now() - Date.now()) / 1000) || elapsed);
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#080C18', color:'#F4EFE8', padding:'20px',
      fontFamily:'system-ui, sans-serif', maxWidth:800, margin:'0 auto',
    }}>
      <h1 style={{fontSize:20,fontWeight:800,marginBottom:4,color:'#F5B84C'}}>Story Engine Test Bench</h1>
      <p style={{fontSize:12,color:'rgba(255,255,255,.4)',marginBottom:20}}>
        Test the updated SleepSeed prompt system. No login required.
      </p>

      {/* Presets */}
      <div style={{display:'flex',gap:6,marginBottom:16}}>
        <span style={{fontSize:11,color:'rgba(255,255,255,.4)',alignSelf:'center',marginRight:4}}>Presets:</span>
        {Object.keys(PRESETS).map(k => (
          <button key={k} onClick={() => loadPreset(k)} style={{
            padding:'4px 12px',borderRadius:50,fontSize:11,fontWeight:700,cursor:'pointer',
            background:'rgba(245,184,76,.1)',border:'1px solid rgba(245,184,76,.25)',color:'#F5B84C',
          }}>{k}</button>
        ))}
      </div>

      {/* Genre + Age row */}
      <div style={{display:'flex',gap:12,marginBottom:12}}>
        <div style={{flex:1}}>
          <label style={lbl}>Genre</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {GENRES.map(g => (
              <button key={g} onClick={() => setGenre(g)} style={{
                padding:'5px 12px',borderRadius:50,fontSize:11,fontWeight:700,cursor:'pointer',
                background:genre===g?'rgba(29,158,117,.2)':'rgba(255,255,255,.04)',
                border:genre===g?'1px solid rgba(29,158,117,.5)':'1px solid rgba(255,255,255,.08)',
                color:genre===g?'#5DCAA5':'rgba(255,255,255,.5)',
              }}>{g}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={lbl}>Age</label>
          <div style={{display:'flex',gap:4}}>
            {AGES.map(a => (
              <button key={a} onClick={() => setAge(a)} style={{
                padding:'5px 12px',borderRadius:50,fontSize:11,fontWeight:700,cursor:'pointer',
                background:age===a?'rgba(29,158,117,.2)':'rgba(255,255,255,.04)',
                border:age===a?'1px solid rgba(29,158,117,.5)':'1px solid rgba(255,255,255,.08)',
                color:age===a?'#5DCAA5':'rgba(255,255,255,.5)',
              }}>{a}-{parseInt(a)+1}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Fields */}
      <div style={{display:'grid',gap:10,marginBottom:16}}>
        <Field label="Child's name" value={name} onChange={setName} />
        <Field label="Situation" value={situation} onChange={setSituation} multiline />
        <Field label="Weird detail" value={weirdDetail} onChange={setWeirdDetail} />
        <Field label="Setting" value={setting} onChange={setSetting} />
        <Field label="Sensory anchor" value={sensoryAnchor} onChange={setSensoryAnchor} />
      </div>

      {/* Actions */}
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        <button onClick={generate} disabled={loading} style={{
          padding:'10px 28px',borderRadius:50,fontSize:14,fontWeight:800,cursor:'pointer',
          background:loading?'rgba(255,255,255,.05)':'linear-gradient(145deg,#a06010,#F5B84C 48%,#a06010)',
          border:'none',color:loading?'rgba(255,255,255,.3)':'#080200',
        }}>
          {loading ? `Generating... ${elapsed}s` : 'Generate Story'}
        </button>
        <button onClick={previewPrompt} style={{
          padding:'10px 20px',borderRadius:50,fontSize:12,fontWeight:700,cursor:'pointer',
          background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',
          color:'rgba(255,255,255,.5)',
        }}>
          {showPrompt ? 'Hide' : 'View'} Prompt
        </button>
      </div>

      {/* Prompt preview */}
      {showPrompt && promptPreview && (
        <div style={{marginBottom:20}}>
          <div style={{marginBottom:10}}>
            <div style={sectionLbl}>SYSTEM PROMPT ({promptPreview.system.length} chars)</div>
            <pre style={preStyle}>{promptPreview.system}</pre>
          </div>
          <div>
            <div style={sectionLbl}>USER PROMPT ({promptPreview.user.length} chars)</div>
            <pre style={preStyle}>{promptPreview.user}</pre>
          </div>
        </div>
      )}

      {/* Story output */}
      {story && (
        <div style={{
          background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',
          borderRadius:16,padding:'24px 20px',
        }}>
          <div style={sectionLbl}>GENERATED STORY</div>
          <div style={{
            fontFamily:'Georgia, serif',fontSize:16,lineHeight:1.8,color:'#F4EFE8',
            whiteSpace:'pre-wrap',
          }}>{story}</div>
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = {fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'rgba(255,255,255,.35)',marginBottom:4,display:'block'};
const sectionLbl: React.CSSProperties = {fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'rgba(245,184,76,.5)',marginBottom:8};
const preStyle: React.CSSProperties = {
  background:'rgba(0,0,0,.3)',border:'1px solid rgba(255,255,255,.06)',borderRadius:10,
  padding:14,fontSize:11,lineHeight:1.6,color:'rgba(255,255,255,.6)',
  whiteSpace:'pre-wrap',wordBreak:'break-word',maxHeight:400,overflow:'auto',
};

function Field({label,value,onChange,multiline}:{label:string;value:string;onChange:(v:string)=>void;multiline?:boolean}) {
  const shared: React.CSSProperties = {
    width:'100%',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',
    borderRadius:10,padding:'8px 12px',fontSize:13,color:'#F4EFE8',
    fontFamily:'system-ui',outline:'none',resize:'none',
  };
  return (
    <div>
      <label style={lbl}>{label}</label>
      {multiline ? (
        <textarea rows={2} value={value} onChange={e=>onChange(e.target.value)} style={shared}/>
      ) : (
        <input value={value} onChange={e=>onChange(e.target.value)} style={shared}/>
      )}
    </div>
  );
}
