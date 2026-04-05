import { useState, useRef, useCallback, useEffect } from 'react';

/*
  ReadAloudText — word-highlighting read-aloud for kids.
  Uses 11Labs TTS when voiceId is set, falls back to browser speechSynthesis.
*/

const CSS = `
.ra-word{transition:background .1s,color .1s;border-radius:4px;padding:1px 2px}
.ra-word.on{background:rgba(245,184,76,.32);color:#F5B84C;box-shadow:0 0 12px rgba(245,184,76,.2);text-shadow:0 0 4px rgba(245,184,76,.15)}
.ra-controls{display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap}
.ra-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 16px;border-radius:50px;font-size:12px;font-weight:700;cursor:pointer;transition:all .18s;font-family:inherit;border:none}
.ra-btn-play{background:rgba(245,184,76,.12);border:1.5px solid rgba(245,184,76,.25);color:#F5B84C}
.ra-btn-play:hover{background:rgba(245,184,76,.2);transform:translateY(-1px)}
.ra-btn-play.active{background:rgba(245,184,76,.2);border-color:rgba(245,184,76,.4)}
.ra-btn-stop{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:rgba(244,239,232,.4)}
.ra-btn-stop:hover{background:rgba(255,255,255,.1);color:rgba(244,239,232,.7)}
.ra-speed{display:flex;align-items:center;gap:4px;font-size:10px;color:rgba(244,239,232,.3);font-family:monospace}
.ra-speed-btn{width:24px;height:24px;border-radius:50%;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(244,239,232,.4);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.ra-speed-btn:hover{background:rgba(255,255,255,.08);color:rgba(244,239,232,.7)}
.ra-light .ra-word.on{background:rgba(200,112,32,.28);color:#8A4A00;box-shadow:0 0 10px rgba(200,112,32,.12);text-shadow:none}
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
  theme?: 'dark' | 'light';
  style?: React.CSSProperties;
  className?: string;
  hideControls?: boolean;
  onFinish?: () => void;
  autoPlay?: boolean;
  voiceId?: string;
}

export default function ReadAloudText({ text, theme = 'dark', style, className, hideControls, onFinish, autoPlay, voiceId }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [rate, setRate] = useState(0.85);
  const [loading, setLoading] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordTimerRef = useRef<number | null>(null);
  const wordsRef = useRef<{ word: string; startChar: number; endChar: number }[]>([]);
  const playingRef = useRef(false);

  // Build word map
  useEffect(() => {
    const words: { word: string; startChar: number; endChar: number }[] = [];
    const regex = /\S+/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      words.push({ word: match[0], startChar: match.index, endChar: match.index + match[0].length });
    }
    wordsRef.current = words;
  }, [text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    };
  }, []);

  const findWordAtChar = useCallback((charIndex: number): number => {
    const words = wordsRef.current;
    for (let i = 0; i < words.length; i++) {
      if (charIndex >= words[i].startChar && charIndex < words[i].endChar) return i;
      if (charIndex < words[i].startChar) return i;
    }
    return -1;
  }, []);

  // ── Stop everything ──
  const stopAll = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (wordTimerRef.current) { clearTimeout(wordTimerRef.current); wordTimerRef.current = null; }
    utterRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setActiveWordIdx(-1);
    playingRef.current = false;
  }, []);

  // ── Browser speech ──
  const playWithBrowserSpeech = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = 1.0;

    utter.onboundary = (e) => {
      if (e.name === 'word') setActiveWordIdx(findWordAtChar(e.charIndex));
    };
    utter.onend = () => { stopAll(); onFinish?.(); };
    utter.onerror = () => { stopAll(); };

    utterRef.current = utter;
    setIsPlaying(true);
    setActiveWordIdx(-1);
    playingRef.current = true;
    window.speechSynthesis.speak(utter);
  }, [text, rate, findWordAtChar, onFinish, stopAll]);

  // ── 11Labs TTS ──
  const playWith11Labs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId, speed: rate }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      if (blob.size < 100) throw new Error('Empty audio');
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        const words = wordsRef.current;
        if (words.length === 0) return;
        const msPerWord = (audio.duration * 1000) / words.length;
        let i = 0;
        const tick = () => {
          if (i < words.length && playingRef.current) {
            setActiveWordIdx(i);
            i++;
            wordTimerRef.current = window.setTimeout(tick, msPerWord);
          }
        };
        tick();
      };

      audio.onended = () => {
        if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
        URL.revokeObjectURL(url);
        stopAll();
        onFinish?.();
      };

      audio.onerror = () => {
        if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
        URL.revokeObjectURL(url);
        stopAll();
      };

      setLoading(false);
      setIsPlaying(true);
      playingRef.current = true;
      audio.play();
    } catch {
      setLoading(false);
      // Fallback to browser speech
      playWithBrowserSpeech();
    }
  }, [text, voiceId, rate, onFinish, stopAll, playWithBrowserSpeech]);

  // ── Main play function ──
  const play = useCallback(() => {
    if (loading) return;

    // Resume paused browser speech
    if (isPaused && utterRef.current) {
      window.speechSynthesis?.resume();
      setIsPaused(false);
      setIsPlaying(true);
      playingRef.current = true;
      return;
    }

    stopAll();
    if (voiceId) playWith11Labs();
    else playWithBrowserSpeech();
  }, [loading, isPaused, voiceId, stopAll, playWith11Labs, playWithBrowserSpeech]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    } else {
      window.speechSynthesis?.pause();
    }
    setIsPaused(true);
    setIsPlaying(false);
    playingRef.current = false;
  }, []);

  const adjustRate = useCallback((delta: number) => {
    stopAll();
    setRate(r => Math.max(0.5, Math.min(1.5, +(r + delta).toFixed(2))));
  }, [stopAll]);

  // Auto-play
  useEffect(() => {
    if (autoPlay && !isPlaying && !isPaused && !loading) {
      play();
    }
  }, [autoPlay]); // eslint-disable-line

  // Render words
  const renderWords = () => {
    const words = wordsRef.current;
    if (words.length === 0) return text;
    const parts: React.ReactNode[] = [];
    let lastEnd = 0;
    words.forEach((w, i) => {
      if (w.startChar > lastEnd) parts.push(text.slice(lastEnd, w.startChar));
      parts.push(<span key={i} className={`ra-word${i === activeWordIdx ? ' on' : ''}`}>{w.word}</span>);
      lastEnd = w.endChar;
    });
    if (lastEnd < text.length) parts.push(text.slice(lastEnd));
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
            <button className={`ra-btn ra-btn-play${isPaused ? ' active' : ''}`} onClick={play} disabled={loading}>
              {loading ? '\u23F3 Loading...' : isPaused ? '\u25B6 Resume' : '\u{1F50A} Read Aloud'}
            </button>
          ) : (
            <button className="ra-btn ra-btn-play active" onClick={pause}>
              \u23F8 Pause
            </button>
          )}
          {(isPlaying || isPaused) && (
            <button className="ra-btn ra-btn-stop" onClick={stopAll}>Stop</button>
          )}
          <div className="ra-speed">
            <button className="ra-speed-btn" onClick={() => adjustRate(-0.1)}>{'\u2212'}</button>
            <span>{rateLabel}</span>
            <button className="ra-speed-btn" onClick={() => adjustRate(0.1)}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}
