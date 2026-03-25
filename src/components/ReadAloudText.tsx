import { useState, useRef, useCallback, useEffect } from 'react';

/*
  ReadAloudText — word-highlighting read-aloud for kids learning to read.

  Uses the browser speechSynthesis API with `boundary` events to track
  which word is being spoken and highlight it in real time.

  Usage:
    <ReadAloudText text="Once upon a time..." style={{fontSize:18}} />
*/

const CSS = `
.ra-word{transition:background .08s,color .08s;border-radius:3px;padding:0 1px}
.ra-word.on{background:rgba(245,184,76,.25);color:#F5B84C;box-shadow:0 0 8px rgba(245,184,76,.15)}
.ra-controls{display:flex;align-items:center;gap:8px;margin-top:10px}
.ra-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 16px;border-radius:50px;font-size:12px;font-weight:700;cursor:pointer;transition:all .18s;font-family:inherit;border:none}
.ra-btn-play{background:rgba(245,184,76,.12);border:1.5px solid rgba(245,184,76,.25);color:#F5B84C}
.ra-btn-play:hover{background:rgba(245,184,76,.2);transform:translateY(-1px)}
.ra-btn-play.active{background:rgba(245,184,76,.2);border-color:rgba(245,184,76,.4)}
.ra-btn-stop{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:rgba(244,239,232,.4)}
.ra-btn-stop:hover{background:rgba(255,255,255,.1);color:rgba(244,239,232,.7)}
.ra-speed{display:flex;align-items:center;gap:4px;font-size:10px;color:rgba(244,239,232,.3);font-family:monospace}
.ra-speed-btn{width:24px;height:24px;border-radius:50%;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(244,239,232,.4);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.ra-speed-btn:hover{background:rgba(255,255,255,.08);color:rgba(244,239,232,.7)}

/* light theme variant (for parchment book backgrounds) */
.ra-light .ra-word.on{background:rgba(200,112,32,.2);color:#8A4A00;box-shadow:0 0 8px rgba(200,112,32,.1)}
.ra-light .ra-btn-play{background:rgba(200,112,32,.1);border-color:rgba(200,112,32,.2);color:#8A4A00}
.ra-light .ra-btn-play:hover{background:rgba(200,112,32,.18)}
.ra-light .ra-btn-play.active{background:rgba(200,112,32,.18);border-color:rgba(200,112,32,.35)}
.ra-light .ra-btn-stop{background:rgba(0,0,0,.04);border-color:rgba(0,0,0,.08);color:rgba(0,0,0,.35)}
.ra-light .ra-btn-stop:hover{background:rgba(0,0,0,.08);color:rgba(0,0,0,.5)}
.ra-light .ra-speed{color:rgba(0,0,0,.3)}
.ra-light .ra-speed-btn{border-color:rgba(0,0,0,.1);background:rgba(0,0,0,.03);color:rgba(0,0,0,.35)}
.ra-light .ra-speed-btn:hover{background:rgba(0,0,0,.08);color:rgba(0,0,0,.5)}
`;

interface Props {
  text: string;
  /** 'dark' (default, for dark bg) or 'light' (for parchment/cream bg) */
  theme?: 'dark' | 'light';
  /** Style applied to the text container */
  style?: React.CSSProperties;
  /** Class applied to the text container */
  className?: string;
  /** Hide controls (just render highlighted text, control externally) */
  hideControls?: boolean;
  /** Called when reading finishes */
  onFinish?: () => void;
}

export default function ReadAloudText({ text, theme = 'dark', style, className, hideControls, onFinish }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [rate, setRate] = useState(0.85);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<{ word: string; startChar: number; endChar: number }[]>([]);

  // Build word map with character offsets
  useEffect(() => {
    const words: { word: string; startChar: number; endChar: number }[] = [];
    let pos = 0;
    // Split preserving whitespace positions
    const regex = /\S+/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      words.push({ word: match[0], startChar: match.index, endChar: match.index + match[0].length });
    }
    wordsRef.current = words;
  }, [text]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const findWordAtChar = useCallback((charIndex: number): number => {
    const words = wordsRef.current;
    for (let i = 0; i < words.length; i++) {
      if (charIndex >= words[i].startChar && charIndex < words[i].endChar) return i;
      // If between words, snap to next word
      if (charIndex < words[i].startChar) return i;
    }
    return -1;
  }, []);

  const play = useCallback(() => {
    if (!('speechSynthesis' in window)) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = 1.0;

    utter.onboundary = (e) => {
      if (e.name === 'word') {
        const idx = findWordAtChar(e.charIndex);
        setActiveWordIdx(idx);
      }
    };

    utter.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setActiveWordIdx(-1);
      onFinish?.();
    };

    utter.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setActiveWordIdx(-1);
    };

    utterRef.current = utter;
    setIsPlaying(true);
    setActiveWordIdx(-1);
    window.speechSynthesis.speak(utter);
  }, [text, rate, isPaused, findWordAtChar, onFinish]);

  const pause = useCallback(() => {
    window.speechSynthesis?.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveWordIdx(-1);
  }, []);

  const adjustRate = useCallback((delta: number) => {
    setRate(r => {
      const next = Math.max(0.5, Math.min(1.5, +(r + delta).toFixed(2)));
      // If currently playing, restart with new rate
      if (isPlaying || isPaused) {
        window.speechSynthesis?.cancel();
        setIsPlaying(false);
        setIsPaused(false);
        setActiveWordIdx(-1);
      }
      return next;
    });
  }, [isPlaying, isPaused]);

  // Render words as spans
  const renderWords = () => {
    const words = wordsRef.current;
    if (words.length === 0) return text;

    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    words.forEach((w, i) => {
      // Add any whitespace/chars between words
      if (w.startChar > lastEnd) {
        parts.push(text.slice(lastEnd, w.startChar));
      }
      parts.push(
        <span key={i} className={`ra-word${i === activeWordIdx ? ' on' : ''}`}>
          {w.word}
        </span>
      );
      lastEnd = w.endChar;
    });

    // Trailing whitespace
    if (lastEnd < text.length) {
      parts.push(text.slice(lastEnd));
    }

    return parts;
  };

  const rateLabel = rate <= 0.6 ? 'Slow' : rate <= 0.8 ? 'Easy' : rate <= 1.0 ? 'Normal' : 'Fast';

  return (
    <div className={theme === 'light' ? 'ra-light' : ''}>
      <style>{CSS}</style>
      <div className={className} style={style}>
        {renderWords()}
      </div>
      {!hideControls && (
        <div className="ra-controls">
          {!isPlaying ? (
            <button className={`ra-btn ra-btn-play${isPaused ? ' active' : ''}`} onClick={play}>
              {isPaused ? '▶ Resume' : '🔊 Read Aloud'}
            </button>
          ) : (
            <button className="ra-btn ra-btn-play active" onClick={pause}>
              ⏸ Pause
            </button>
          )}
          {(isPlaying || isPaused) && (
            <button className="ra-btn ra-btn-stop" onClick={stop}>Stop</button>
          )}
          <div className="ra-speed">
            <button className="ra-speed-btn" onClick={() => adjustRate(-0.1)}>−</button>
            <span>{rateLabel}</span>
            <button className="ra-speed-btn" onClick={() => adjustRate(0.1)}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}
