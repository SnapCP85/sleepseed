import { useState, useEffect } from 'react';
import { LANGUAGES, getSavedLanguage, saveLanguage } from '../lib/translate';

const CSS = `
.lp-trigger{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:50px;font-size:11px;font-weight:700;cursor:pointer;transition:all .18s;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(244,239,232,.55);font-family:inherit}
.lp-trigger:hover{border-color:rgba(255,255,255,.2);color:rgba(244,239,232,.8)}
.lp-trigger.active{border-color:rgba(245,184,76,.3);background:rgba(245,184,76,.08);color:#F5B84C}
.lp-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px)}
.lp-modal{background:rgba(10,8,24,.98);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:24px;max-width:360px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.7)}
.lp-modal-title{font-size:16px;font-weight:700;margin-bottom:4px;text-align:center}
.lp-modal-sub{font-size:12px;color:rgba(244,239,232,.4);text-align:center;margin-bottom:16px}
.lp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:16px}
.lp-lang{padding:10px 8px;border-radius:12px;border:1.5px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);cursor:pointer;text-align:center;transition:all .18s}
.lp-lang:hover{background:rgba(255,255,255,.06)}
.lp-lang.on{border-color:rgba(245,184,76,.4);background:rgba(245,184,76,.1)}
.lp-lang-flag{font-size:20px;margin-bottom:3px}
.lp-lang-label{font-size:10px;font-weight:700;color:rgba(244,239,232,.6)}
.lp-lang.on .lp-lang-label{color:#F5B84C}
.lp-learn{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);margin-bottom:16px}
.lp-learn-text{font-size:13px;font-weight:600;color:rgba(244,239,232,.7)}
.lp-learn-sub{font-size:10px;color:rgba(244,239,232,.35);margin-top:2px}
.lp-toggle{width:44px;height:24px;border-radius:12px;cursor:pointer;transition:all .2s;position:relative;border:none;flex-shrink:0}
.lp-toggle.off{background:rgba(255,255,255,.1)}
.lp-toggle.on{background:rgba(245,184,76,.4)}
.lp-toggle-dot{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s}
.lp-toggle.off .lp-toggle-dot{left:3px}
.lp-toggle.on .lp-toggle-dot{left:23px}
.lp-done{width:100%;padding:12px;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;background:linear-gradient(135deg,#a06010,#F5B84C);color:#080200}
.lp-done:hover{filter:brightness(1.1);transform:translateY(-1px)}

/* light theme variant */
.lp-light .lp-trigger{border-color:rgba(0,0,0,.1);background:rgba(0,0,0,.04);color:rgba(58,40,0,.6)}
.lp-light .lp-trigger:hover{border-color:rgba(0,0,0,.2);color:rgba(58,40,0,.8)}
.lp-light .lp-trigger.active{border-color:rgba(200,112,32,.3);background:rgba(200,112,32,.08);color:#8A4A00}
`;

interface Props {
  language: string;
  learningMode: boolean;
  onChange: (language: string, learningMode: boolean) => void;
  theme?: 'dark' | 'light';
  /** When true, open the modal without showing the trigger button */
  externalOpen?: boolean;
  onClose?: () => void;
  /** Hide the trigger button (used when opened from a menu) */
  hideTrigger?: boolean;
}

export default function LanguagePicker({ language, learningMode, onChange, theme = 'dark', externalOpen, onClose, hideTrigger }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = (v: boolean) => { setInternalOpen(v); if (!v && onClose) onClose(); };
  const [tempLang, setTempLang] = useState(language);
  const [tempLearn, setTempLearn] = useState(learningMode);

  // Sync temp state when opened externally
  useEffect(() => {
    if (externalOpen) { setTempLang(language); setTempLearn(learningMode); }
  }, [externalOpen]); // eslint-disable-line

  const currentLang = LANGUAGES.find(l => l.code === language);
  const isTranslated = language !== 'en';

  const handleOpen = () => {
    setTempLang(language);
    setTempLearn(learningMode);
    setOpen(true);
  };

  const handleDone = () => {
    saveLanguage(tempLang, tempLearn);
    onChange(tempLang, tempLang === 'en' ? false : tempLearn);
    setOpen(false);
  };

  return (
    <div className={theme === 'light' ? 'lp-light' : ''}>
      <style>{CSS}</style>
      {!hideTrigger && (
        <button className={`lp-trigger${isTranslated ? ' active' : ''}`} onClick={handleOpen}>
          {currentLang?.flag || '🌐'} {isTranslated ? currentLang?.label : 'Language'}
          {learningMode && isTranslated && ' · Learning'}
        </button>
      )}

      {open && (
        <div className="lp-modal-bg" onClick={() => setOpen(false)}>
          <div className="lp-modal" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-title">Story Language</div>
            <div className="lp-modal-sub">Choose a language for this story</div>
            <div className="lp-grid">
              {LANGUAGES.map(l => (
                <div key={l.code} className={`lp-lang${tempLang === l.code ? ' on' : ''}`}
                  onClick={() => setTempLang(l.code)}>
                  <div className="lp-lang-flag">{l.flag}</div>
                  <div className="lp-lang-label">{l.label}</div>
                </div>
              ))}
            </div>

            {tempLang !== 'en' && (
              <div className="lp-learn">
                <div>
                  <div className="lp-learn-text">Learning Mode</div>
                  <div className="lp-learn-sub">Show English translations below each sentence</div>
                </div>
                <button className={`lp-toggle ${tempLearn ? 'on' : 'off'}`}
                  onClick={() => setTempLearn(!tempLearn)}>
                  <div className="lp-toggle-dot" />
                </button>
              </div>
            )}

            <button className="lp-done" onClick={handleDone}>
              {tempLang === 'en' ? 'Use English' : tempLearn ? `Learn in ${LANGUAGES.find(l=>l.code===tempLang)?.label}` : `Read in ${LANGUAGES.find(l=>l.code===tempLang)?.label}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
