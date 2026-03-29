import { useState, useEffect } from 'react';
import { useApp } from '../../AppContext';
import { getTonightsSecretPrompt } from '../../sleepseed-prompts';
import { resolveCreatureForRead } from '../../lib/creature-helpers';
import { journeyService } from '../../lib/journey-service';
import { getCharacters } from '../../lib/storage';
import { getAllHatchedCreatures } from '../../lib/hatchery';
import type { StoryJourney, Character, HatchedCreature } from '../../lib/types';

const EMOTIONAL_GOALS = ['calm', 'confidence', 'comfort', 'courage', 'fun', 'connection', 'wonder'];

export default function NightlyCheckIn() {
  const {
    user, selectedCharacter, selectedCharacters, companionCreature,
    activeJourneyId, setView, setActiveChapterOutput,
    setSelectedCharacter, setCompanionCreature,
  } = useApp();
  const [need, setNeed] = useState('calm');
  const [todayMemory, setTodayMemory] = useState('');
  const [specificDetail, setSpecificDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [journey, setJourney] = useState<StoryJourney | null>(null);
  const [resolvedChar, setResolvedChar] = useState<Character | null>(null);
  const [resolvedCreature, setResolvedCreature] = useState<HatchedCreature | null>(null);
  const [initLoading, setInitLoading] = useState(true);

  // Load journey + resolve character/creature
  useEffect(() => {
    const char = selectedCharacter || selectedCharacters?.[0] || null;
    const creature = companionCreature || null;

    if (char) setResolvedChar(char);
    if (creature) setResolvedCreature(creature);

    const promises: Promise<void>[] = [];

    // Load journey
    if (activeJourneyId) {
      promises.push(
        journeyService.getJourneyWithChapters(activeJourneyId)
          .then(j => { setJourney(j); })
      );
    }

    // Load char/creature from DB if missing
    if ((!char || !creature) && user?.id) {
      promises.push(
        Promise.all([
          char ? Promise.resolve([char]) : getCharacters(user.id),
          creature ? Promise.resolve([creature]) : getAllHatchedCreatures(user.id),
        ]).then(([chars, creatures]) => {
          if (!char) {
            const family = chars.filter(c => c.isFamily === true || (c.isFamily === undefined && c.type === 'human'));
            const primary = family[0] || chars[0] || null;
            if (primary) { setResolvedChar(primary); setSelectedCharacter(primary); }
          }
          if (!creature && creatures.length > 0) {
            setResolvedCreature(creatures[0]);
            setCompanionCreature(creatures[0]);
          }
        })
      );
    }

    Promise.all(promises)
      .catch(console.error)
      .finally(() => setInitLoading(false));
  }, [activeJourneyId, user?.id]); // eslint-disable-line

  const readNumber = journey?.readNumber ?? 1;
  const childName = resolvedChar?.name || 'your child';

  const handleGenerate = async (useLast = false) => {
    if (!activeJourneyId || !user || !resolvedChar) {
      console.error('[NightlyCheckIn] Missing:', { activeJourneyId, userId: user?.id, char: resolvedChar?.name });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resolvedCreatureData = resolvedCreature?.creatureType
        ? resolveCreatureForRead(resolvedCreature.creatureType, readNumber)
        : { name: resolvedCreature?.name || '', virtue: '', storyPersonality: '', lessonBeat: '' };

      const body = useLast ? {
        need: 'calm',
        child: { name: resolvedChar.name },
        creature: {
          name: resolvedCreatureData.name,
          virtue: resolvedCreatureData.virtue,
          storyPersonality: resolvedCreatureData.storyPersonality,
          lessonBeat: resolvedCreatureData.lessonBeat,
        },
      } : {
        need, todayMemory, specificDetail,
        child: {
          name: resolvedChar.name,
          ageBand: resolvedChar.ageDescription,
          pronouns: resolvedChar.pronouns,
          traits: resolvedChar.personalityTags,
          weirdDetail: specificDetail || resolvedChar.weirdDetail,
          currentSituation: resolvedChar.currentSituation,
        },
        creature: {
          name: resolvedCreature?.name || resolvedCreatureData.name,
          virtue: resolvedCreatureData.virtue,
          storyPersonality: resolvedCreatureData.storyPersonality,
          lessonBeat: resolvedCreatureData.lessonBeat,
        },
      };

      const res = await fetch(`/api/story-journeys/${activeJourneyId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setLoading(false);

      if (data.error) {
        console.error('[NightlyCheckIn] API error:', data.error);
        setError(data.error);
        return;
      }

      if (data.chapter) {
        setActiveChapterOutput(data.chapter);
        setView('chapter-handoff');
      }
    } catch (e) {
      setLoading(false);
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setError(msg);
      console.error(e);
    }
  };

  if (initLoading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh', background: '#060912', color: '#faf6ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(244,239,232,.4)' }}>Loading...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh', background: '#060912', color: '#faf6ee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 24 }}>📖</div>
        <p style={{ fontSize: 18, fontFamily: "'Fraunces',Georgia,serif" }}>Creating tonight's chapter...</p>
        <p style={{ fontSize: 14, color: 'rgba(244,239,232,.4)', marginTop: 8 }}>This takes about 15 seconds</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#060912', color: '#faf6ee' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button onClick={() => setView('dashboard')}
          style={{ background: 'none', border: 'none', color: 'rgba(244,239,232,.4)', cursor: 'pointer', fontSize: 14 }}>
          ← Dashboard
        </button>
        {journey && (
          <div style={{ fontSize: 11, color: '#F5B84C', fontFamily: "'DM Mono',monospace" }}>
            Read {readNumber} of 7
          </div>
        )}
      </div>

      {journey && (
        <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, marginBottom: 20 }}>
          {journey.workingTitle}
        </h2>
      )}

      <h3 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, marginBottom: 16 }}>Tonight's check-in</h3>
      <p style={{ color: 'rgba(244,239,232,.6)', marginBottom: 16 }}>What does {childName} need tonight?</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {EMOTIONAL_GOALS.map(g => (
          <button key={g} onClick={() => setNeed(g)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              textTransform: 'capitalize', fontSize: 13,
              background: need === g ? 'rgba(245,184,76,.2)' : 'rgba(255,255,255,.06)',
              color: need === g ? '#F5B84C' : 'rgba(244,239,232,.6)',
              fontWeight: need === g ? 600 : 400,
            }}>
            {g}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'rgba(244,239,232,.35)', fontStyle: 'italic', marginBottom: 16 }}>
        {getTonightsSecretPrompt(childName, readNumber)}
      </p>

      <textarea placeholder="What happened today? (optional)"
        value={todayMemory} onChange={e => setTodayMemory(e.target.value)}
        style={{ width: '100%', padding: 12, marginBottom: 10, minHeight: 80, borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.06)', color: '#faf6ee', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />

      <input placeholder="One specific detail to tuck in (optional)"
        value={specificDetail} onChange={e => setSpecificDetail(e.target.value)}
        style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.06)', color: '#faf6ee', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />

      {error && (
        <div style={{ padding: 12, marginBottom: 16, background: 'rgba(192,64,48,.12)', border: '1px solid rgba(192,64,48,.28)', borderRadius: 8, fontSize: 13, color: '#f09080' }}>
          {error}
        </div>
      )}

      <button onClick={() => handleGenerate(false)}
        style={{ padding: '14px 32px', display: 'block', width: '100%', marginBottom: 10, background: 'linear-gradient(135deg,#E8972A,#F5B84C)', color: '#1a0f08', border: 'none', borderRadius: 12, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>
        Create tonight's chapter ✦
      </button>
      <button onClick={() => handleGenerate(true)}
        style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, cursor: 'pointer', width: '100%', color: 'rgba(244,239,232,.4)', fontSize: 13 }}>
        Same as last night
      </button>
    </div>
  );
}
