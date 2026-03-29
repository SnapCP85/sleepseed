import { useEffect, useState, useRef } from 'react';
import { useApp } from '../../AppContext';
import { resolveNextCreature } from '../../lib/creature-helpers';
import { getHatchedCreatures, saveHatchedCreature } from '../../lib/hatchery';
import { getCharacters } from '../../lib/storage';
import { getAllHatchedCreatures } from '../../lib/hatchery';
import type { Character, HatchedCreature } from '../../lib/types';

type Phase = 'loading' | 'stitching' | 'book_revealed' | 'hatching' | 'naming' | 'complete' | 'error';

interface CompletionResult {
  finalBookId: string;
  finalTitle: string;
  dedicationLine: string;
  seriesHooks: string[];
  journeySummaryId: string | null;
}

interface PendingCreature {
  creatureType: string;
  suggestedName: string;
  nameSuggestions: string[];
  creatureEmoji: string;
  color: string;
  rarity: 'common' | 'rare' | 'legendary';
  personalityTraits: string[];
  virtue: string;
}

export default function BookComplete() {
  const {
    user, selectedCharacter, selectedCharacters, companionCreature,
    activeJourneyId, setView, setActiveJourneyId,
    setSelectedCharacter, setCompanionCreature,
    setActiveCompletedBookId,
  } = useApp();
  const [phase, setPhase] = useState<Phase>('loading');
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [pendingCreature, setPendingCreature] = useState<PendingCreature | null>(null);
  const [creatureName, setCreatureName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resolvedChar, setResolvedChar] = useState<Character | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!activeJourneyId || !user || hasRun.current) return;
    const char = selectedCharacter || selectedCharacters?.[0] || null;
    const creature = companionCreature || null;

    if (char && creature) {
      setResolvedChar(char);
      hasRun.current = true;
      setPhase('stitching');
      runCompletion(char, creature);
      return;
    }

    Promise.all([
      char ? Promise.resolve([char]) : getCharacters(user.id),
      creature ? Promise.resolve([creature]) : getAllHatchedCreatures(user.id),
    ]).then(([chars, creatures]) => {
      const family = chars.filter(c => c.isFamily === true || (c.isFamily === undefined && c.type === 'human'));
      const primary = char || family[0] || chars[0] || null;
      const comp = creature || (creatures.length > 0 ? creatures[0] : null);
      if (primary) { setResolvedChar(primary); setSelectedCharacter(primary); }
      if (comp) setCompanionCreature(comp);
      if (!primary) { setErrorMsg('No character found'); setPhase('error'); return; }
      hasRun.current = true;
      setPhase('stitching');
      runCompletion(primary, comp);
    }).catch(e => { setErrorMsg(e.message); setPhase('error'); });
  }, [activeJourneyId, user?.id]); // eslint-disable-line

  const runCompletion = async (char: Character, creature: HatchedCreature | null) => {
    if (!activeJourneyId || !user) return;
    try {
      const hatchedCreatures = await getHatchedCreatures(user.id, char.id);
      const hatchedTypes = hatchedCreatures.map(h => h.creatureType);
      const nextCreatureData = resolveNextCreature(creature?.creatureType || '', hatchedTypes);

      setPendingCreature({
        creatureType: nextCreatureData.creatureType,
        suggestedName: nextCreatureData.nameSuggestions?.[0] || nextCreatureData.name,
        nameSuggestions: nextCreatureData.nameSuggestions || [nextCreatureData.name],
        creatureEmoji: nextCreatureData.creatureEmoji,
        color: nextCreatureData.color,
        rarity: nextCreatureData.rarity,
        personalityTraits: nextCreatureData.personalityTraits,
        virtue: nextCreatureData.virtue,
      });
      setCreatureName(nextCreatureData.nameSuggestions?.[0] || nextCreatureData.name);

      const res = await fetch(`/api/story-journeys/${activeJourneyId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, characterId: char.id, heroName: char.name,
          newCreatureData: {
            creatureType: nextCreatureData.creatureType,
            creatureEmoji: nextCreatureData.creatureEmoji,
            color: nextCreatureData.color,
            rarity: nextCreatureData.rarity,
            virtue: nextCreatureData.virtue,
          },
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || `API error ${res.status}`); }
      const data = await res.json();
      setResult(data);
      setTimeout(() => setPhase('book_revealed'), 300);
    } catch (e: unknown) {
      console.error('[BookComplete]', e);
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong');
      setPhase('error');
    }
  };

  const handleStartHatching = () => { setPhase('hatching'); setTimeout(() => setPhase('naming'), 2000); };

  const handleNameCreature = async () => {
    if (!pendingCreature || !user || !resolvedChar) return;
    const finalName = creatureName.trim() || pendingCreature.suggestedName;
    await saveHatchedCreature({
      id: `${resolvedChar.id}-${pendingCreature.creatureType}-${Date.now()}`,
      userId: user.id, characterId: resolvedChar.id, name: finalName,
      creatureType: pendingCreature.creatureType, creatureEmoji: pendingCreature.creatureEmoji,
      color: pendingCreature.color, rarity: pendingCreature.rarity,
      personalityTraits: pendingCreature.personalityTraits,
      dreamAnswer: '', parentSecret: '', hatchedAt: new Date().toISOString(), weekNumber: 1,
    });
    setPhase('complete');
  };

  const cs: React.CSSProperties = {
    padding: 32, textAlign: 'center', maxWidth: 480, margin: '0 auto',
    minHeight: '100vh', background: '#060912', color: '#faf6ee',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  };

  if (phase === 'error') return (
    <div style={cs}>
      <p style={{ color: 'rgba(244,239,232,.5)' }}>Something went wrong finishing the book.</p>
      <p style={{ fontSize: 13, color: 'rgba(244,239,232,.3)', marginTop: 8 }}>{errorMsg}</p>
      <button onClick={() => setView('dashboard')} style={{ marginTop: 24, padding: '12px 24px', background: '#F5B84C', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#1a0f08' }}>Back to dashboard</button>
    </div>
  );

  if (phase === 'loading' || phase === 'stitching') return (
    <div style={cs}>
      <div style={{ fontSize: 48, marginBottom: 24 }}>📖</div>
      <p style={{ fontSize: 18, fontFamily: "'Fraunces',Georgia,serif" }}>Finishing your book...</p>
      <p style={{ fontSize: 14, color: 'rgba(244,239,232,.4)', marginTop: 8 }}>Weaving all 7 chapters together — this takes about a minute</p>
    </div>
  );

  if (phase === 'book_revealed') return (
    <div style={cs}>
      <div style={{ marginBottom: 8, fontSize: 11, color: '#F5B84C', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'DM Mono',monospace" }}>Book Complete</div>
      <h1 style={{ fontSize: 28, margin: '0 0 16px', fontFamily: "'Fraunces',Georgia,serif", lineHeight: 1.2 }}>{result?.finalTitle || 'Your Book'}</h1>
      {result?.dedicationLine && <p style={{ fontStyle: 'italic', color: 'rgba(244,239,232,.5)', fontSize: 15, margin: '0 0 32px', fontFamily: "'Fraunces',Georgia,serif" }}>{result.dedicationLine}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
        {[1,2,3,4,5,6,7].map(n => <div key={n} style={{ width: 14, height: 14, borderRadius: '50%', background: '#F5B84C', boxShadow: '0 0 8px rgba(245,184,76,0.5)' }} />)}
      </div>
      <p style={{ fontSize: 16, marginBottom: 8 }}>And something has been waiting...</p>
      <p style={{ color: 'rgba(244,239,232,.4)', fontSize: 14, marginBottom: 32 }}>Your companion creature's egg is ready to hatch.</p>
      <button onClick={handleStartHatching} style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#E8972A,#F5B84C)', color: '#1a0f08', border: 'none', borderRadius: 12, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>Hatch the egg ✨</button>
    </div>
  );

  if (phase === 'hatching') return (
    <div style={cs}>
      <div style={{ fontSize: 96, animation: 'eggShake 0.3s ease-in-out infinite', display: 'inline-block' }}>🥚</div>
      <style>{`@keyframes eggShake { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }`}</style>
      <p style={{ marginTop: 24, color: 'rgba(244,239,232,.5)' }}>Something is hatching...</p>
    </div>
  );

  if (phase === 'naming') return (
    <div style={cs}>
      <div style={{ fontSize: 96, marginBottom: 16 }}>{pendingCreature?.creatureEmoji || '🌟'}</div>
      <h2 style={{ margin: '0 0 8px', fontFamily: "'Fraunces',Georgia,serif" }}>A new DreamKeeper has hatched!</h2>
      <p style={{ color: 'rgba(244,239,232,.5)', fontSize: 14, marginBottom: 4 }}>Virtue: {pendingCreature?.virtue}</p>
      <p style={{ color: 'rgba(244,239,232,.4)', fontSize: 15, marginBottom: 24 }}>What will you name them?</p>

      {/* Name suggestion pills */}
      {pendingCreature?.nameSuggestions && pendingCreature.nameSuggestions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {pendingCreature.nameSuggestions.map(s => (
            <button key={s} onClick={() => setCreatureName(s)} style={{
              padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 15, transition: 'all 0.15s',
              background: creatureName === s ? 'rgba(245,184,76,.25)' : 'rgba(255,255,255,.06)',
              border: `2px solid ${creatureName === s ? 'rgba(245,184,76,.6)' : 'rgba(255,255,255,.12)'}`,
              color: creatureName === s ? '#F5B84C' : 'rgba(244,239,232,.6)',
              fontWeight: creatureName === s ? 600 : 400,
            }}>{s}</button>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: 'rgba(244,239,232,.3)', marginBottom: 8 }}>or choose your own name</p>
      <input value={creatureName} onChange={e => setCreatureName(e.target.value)}
        placeholder="Type a name..." maxLength={24} autoFocus
        onKeyDown={e => e.key === 'Enter' && handleNameCreature()}
        style={{ width: '100%', padding: '12px 16px', fontSize: 16, textAlign: 'center', border: '2px solid rgba(255,255,255,.12)', borderRadius: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 16, background: 'rgba(255,255,255,.06)', color: '#faf6ee', fontFamily: "'Fraunces',Georgia,serif" }} />
      <button onClick={handleNameCreature} style={{ padding: '14px 32px', background: '#F5B84C', border: 'none', borderRadius: 12, fontSize: 16, cursor: 'pointer', fontWeight: 600, width: '100%', color: '#1a0f08' }}>
        {creatureName.trim() ? `This is ${creatureName.trim()}` : 'Name them later'}
      </button>
    </div>
  );

  // phase === 'complete'
  return (
    <div style={cs}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>{pendingCreature?.creatureEmoji || '🌟'}</div>
      <h2 style={{ margin: '0 0 4px', fontFamily: "'Fraunces',Georgia,serif" }}>{creatureName.trim() || pendingCreature?.suggestedName || 'Your new companion'}</h2>
      <p style={{ color: 'rgba(244,239,232,.4)', fontSize: 14, marginBottom: 32 }}>joins your story world</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        <button onClick={() => {
          if (result?.finalBookId) { setActiveCompletedBookId(result.finalBookId); setView('completed-book-reader'); }
        }} style={{ padding: '14px 20px', background: '#F5B84C', border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontWeight: 600, color: '#1a0f08' }}>
          Read our finished book 📖
        </button>
        <button onClick={async () => {
          const title = result?.finalTitle || 'Our Book';
          const creature = pendingCreature;
          const text = `We just finished "${title}" — a 7-night bedtime book! ${creature?.creatureEmoji || '✨'} ${creatureName.trim() || creature?.suggestedName || 'A new companion'} hatched tonight.\n\nsleepseed.vercel.app`;
          try { await navigator.share?.({title, text, url: 'https://sleepseed.vercel.app'}); }
          catch(_) { navigator.clipboard?.writeText(text); }
        }} style={{ padding: '14px 20px', background: 'rgba(245,184,76,.15)', border: '1px solid rgba(245,184,76,.3)', color: '#F5B84C', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontWeight: 600 }}>
          Share our book ✨
        </button>
        <button onClick={() => setView('memory-reel')} style={{ padding: '14px 20px', background: 'rgba(154,127,212,.25)', border: '1px solid rgba(154,127,212,.4)', color: '#c8b8ff', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontWeight: 600 }}>
          View our Memory Reel
        </button>
        <button onClick={() => { setActiveJourneyId(null); setView('series-creator'); }} style={{ padding: '14px 20px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, fontSize: 15, cursor: 'pointer', color: '#faf6ee' }}>
          Continue this world
        </button>
        <button onClick={() => { setActiveJourneyId(null); setView('journey-setup'); }} style={{ padding: '14px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, fontSize: 15, cursor: 'pointer', color: 'rgba(244,239,232,.4)' }}>
          Begin a new book
        </button>
      </div>
    </div>
  );
}
