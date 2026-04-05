import { useState, useRef, useCallback, useEffect } from 'react';
import type { TranslatedSentence } from '../lib/translate';

/*
  InterlinearText — sentence-by-sentence bilingual display with read-aloud.

  Shows foreign text (big) with English translation below (small).
  Read-aloud highlights words in the foreign text AND the corresponding
  English sentence simultaneously.
*/

const CSS = `
.il-sentence{margin-bottom:16px;padding:6px 8px;border-radius:10px;margin-left:-8px;margin-right:-8px;transition:background .2s}
.il-foreign{margin-bottom:4px}
.il-english{font-size:0.92em;font-style:italic;line-height:1.55;color:rgba(244,239,232,.85);margin-top:2px}
.il-word{transition:background .1s,color .1s;border-radius:4px;padding:1px 2px}
.il-word.on{background:rgba(245,184,76,.32);color:#F5B84C;box-shadow:0 0 12px rgba(245,184,76,.2)}
.il-light .il-word.on{background:rgba(200,112,32,.25);color:#8A4A00;box-shadow:0 0 10px rgba(200,112,32,.12)}
.il-light .il-english{color:rgba(58,40,0,.75)}
.il-controls{display:flex;align-items:center;gap:8px;margin-top:12px}
.il-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 16px;border-radius:50px;font-size:12px;font-weight:700;cursor:pointer;transition:all .18s;font-family:inherit;border:none}
.il-btn-play{background:rgba(245,184,76,.12);border:1.5px solid rgba(245,184,76,.25);color:#F5B84C}
.il-btn-play:hover{background:rgba(245,184,76,.2);transform:translateY(-1px)}
.il-btn-play.active{background:rgba(245,184,76,.2);border-color:rgba(245,184,76,.4)}
.il-btn-stop{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:rgba(244,239,232,.4)}
.il-btn-stop:hover{background:rgba(255,255,255,.1);color:rgba(244,239,232,.7)}
.il-speed{display:flex;align-items:center;gap:4px;font-size:10px;color:rgba(244,239,232,.3);font-family:monospace}
.il-speed-btn{width:24px;height:24px;border-radius:50%;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(244,239,232,.4);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.il-speed-btn:hover{background:rgba(255,255,255,.08);color:rgba(244,239,232,.7)}
.il-light .il-btn-play{background:rgba(200,112,32,.1);border-color:rgba(200,112,32,.2);color:#8A4A00}
.il-light .il-btn-play:hover{background:rgba(200,112,32,.18)}
.il-light .il-btn-play.active{background:rgba(200,112,32,.18);border-color:rgba(200,112,32,.35)}
.il-light .il-btn-stop{background:rgba(0,0,0,.04);border-color:rgba(0,0,0,.08);color:rgba(0,0,0,.35)}
.il-light .il-speed{color:rgba(0,0,0,.3)}
.il-light .il-speed-btn{border-color:rgba(0,0,0,.1);background:rgba(0,0,0,.03);color:rgba(0,0,0,.35)}
`;

interface Props {
  sentences: TranslatedSentence[];
  theme?: 'dark' | 'light';
  foreignStyle?: React.CSSProperties;
  englishStyle?: React.CSSProperties;
  className?: string;
  onFinish?: () => void;
  autoPlay?: boolean;
}

export default function InterlinearText({ sentences, theme = 'dark', foreignStyle, englishStyle, className, onFinish, autoPlay }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(-1);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [rate, setRate] = useState(0.7); // Slower default for learning
  const playingRef = useRef(false);
  const cancelRef = useRef(false);

  // Build word list for a sentence
  const getWords = (text: string) => {
    const words: { word: string; start: number; end: number }[] = [];
    const regex = /\S+/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      words.push({ word: match[0], start: match.index, end: match.index + match[0].length });
    }
    return words;
  };

  useEffect(() => {
    return () => { cancelRef.current = true; window.speechSynthesis?.cancel(); };
  }, []);

  // Auto-play when triggered externally
  useEffect(() => {
    if (autoPlay && !isPlaying && !isPaused) playAll();
  }, [autoPlay]); // eslint-disable-line

  const speakSentence = useCallback((text: string, sentIdx: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || cancelRef.current) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = rate;
      utter.pitch = 1.0;

      const words = getWords(text);

      utter.onboundary = (e) => {
        if (e.name === 'word') {
          for (let i = 0; i < words.length; i++) {
            if (e.charIndex >= words[i].start && e.charIndex < words[i].end) {
              setActiveWordIdx(i);
              break;
            }
            if (e.charIndex < words[i].start) { setActiveWordIdx(i); break; }
          }
        }
      };

      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    });
  }, [rate]);

  const playAll = useCallback(async () => {
    cancelRef.current = false;
    playingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);

    for (let i = 0; i < sentences.length; i++) {
      if (cancelRef.current) break;
      setActiveSentenceIdx(i);
      setActiveWordIdx(-1);
      await speakSentence(sentences[i].foreign, i);
      // Brief pause between sentences
      if (!cancelRef.current) await new Promise(r => setTimeout(r, 400));
    }

    playingRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSentenceIdx(-1);
    setActiveWordIdx(-1);
    if (!cancelRef.current) onFinish?.();
  }, [sentences, speakSentence, onFinish]);

  const pause = useCallback(() => {
    window.speechSynthesis?.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis?.resume();
    setIsPaused(false);
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    cancelRef.current = true;
    window.speechSynthesis?.cancel();
    playingRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSentenceIdx(-1);
    setActiveWordIdx(-1);
  }, []);

  const adjustRate = useCallback((delta: number) => {
    stop();
    setRate(r => Math.max(0.4, Math.min(1.3, +(r + delta).toFixed(2))));
  }, [stop]);

  const renderForeignWords = (text: string, sentIdx: number) => {
    const words = getWords(text);
    if (words.length === 0) return text;
    const parts: React.ReactNode[] = [];
    let lastEnd = 0;
    words.forEach((w, i) => {
      if (w.start > lastEnd) parts.push(text.slice(lastEnd, w.start));
      const isActive = sentIdx === activeSentenceIdx && i === activeWordIdx;
      parts.push(<span key={i} className={`il-word${isActive ? ' on' : ''}`}>{w.word}</span>);
      lastEnd = w.end;
    });
    if (lastEnd < text.length) parts.push(text.slice(lastEnd));
    return parts;
  };

  const rateLabel = rate <= 0.5 ? 'Slow' : rate <= 0.75 ? 'Easy' : rate <= 1.0 ? 'Normal' : 'Fast';

  return (
    <div className={`${theme === 'light' ? 'il-light' : ''} ${className || ''}`}>
      <style>{CSS}</style>
      {sentences.map((s, i) => (
        <div key={i} className="il-sentence" style={i === activeSentenceIdx ? { background: theme === 'light' ? 'rgba(200,112,32,.1)' : 'rgba(245,184,76,.08)', border: theme === 'light' ? '1px solid rgba(200,112,32,.12)' : '1px solid rgba(245,184,76,.15)' } : undefined}>
          <div className="il-foreign" style={foreignStyle}>
            {renderForeignWords(s.foreign, i)}
          </div>
          <div className="il-english" style={englishStyle}>
            {s.english}
          </div>
        </div>
      ))}
      <div className="il-controls">
        {!isPlaying ? (
          <button className={`il-btn il-btn-play${isPaused ? ' active' : ''}`} onClick={isPaused ? resume : playAll}>
            {isPaused ? '▶ Resume' : '🔊 Read Aloud'}
          </button>
        ) : (
          <button className="il-btn il-btn-play active" onClick={pause}>
            ⏸ Pause
          </button>
        )}
        {(isPlaying || isPaused) && (
          <button className="il-btn il-btn-stop" onClick={stop}>Stop</button>
        )}
        <div className="il-speed">
          <button className="il-speed-btn" onClick={() => adjustRate(-0.1)}>-</button>
          <span>{rateLabel}</span>
          <button className="il-speed-btn" onClick={() => adjustRate(0.1)}>+</button>
        </div>
      </div>
    </div>
  );
}
