import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DIMENSION → PARENT-FRIENDLY QUESTION MAP
// Each dimension maps to a question written in parent language (not craft-speak)
// and 4 options that map to a direction signal (positive = higher score, negative = lower).
// ─────────────────────────────────────────────────────────────────────────────

const DIMENSION_QUESTIONS = {
  specificity: {
    question: "How did the details feel?",
    positive: [
      { text: "Really vivid — I could picture everything",   signal: +1 },
      { text: "The character felt like a real specific person", signal: +1 },
    ],
    negative: [
      { text: "A bit generic — could be any story",           signal: -1 },
      { text: "The details felt a little vague",              signal: -1 },
    ],
  },
  sent_length: {
    question: "How did the pacing feel?",
    positive: [
      { text: "Just right — kept moving nicely",              signal: +1 },
      { text: "Perfect length for our bedtime",               signal: +1 },
    ],
    negative: [
      { text: "A bit slow in places",                         signal: -1 },
      { text: "Over a little too quickly",                    signal: +0.5 }, // too short → lean longer
    ],
  },
  narrator: {
    question: "How was the storytelling voice?",
    positive: [
      { text: "Really easy and fun to read aloud",            signal: +1 },
      { text: "Had real personality — felt like someone there", signal: +1 },
    ],
    negative: [
      { text: "A bit flat — hard to bring to life",           signal: -1 },
      { text: "Felt a little neutral",                        signal: -1 },
    ],
  },
  warmth: {
    question: "How did it feel emotionally?",
    positive: [
      { text: "Warm and comforting — just right",             signal: +1 },
      { text: "Had real heart without being too much",        signal: +1 },
    ],
    negative: [
      { text: "A little cold or distant",                     signal: -1 },
      { text: "A bit too sentimental",                        signal: -0.5 }, // too warm → dial back
    ],
  },
  vocabulary: {
    question: "How were the words?",
    positive: [
      { text: "Rich and interesting — fun to say aloud",      signal: +1 },
      { text: "Perfect level for this age",                   signal: 0 },  // no change, just confirm
    ],
    negative: [
      { text: "A little too complex for us",                  signal: -1 },
      { text: "Could have been more inventive",               signal: +1 },
    ],
  },
  rhythm: {
    question: "How did it sound reading aloud?",
    positive: [
      { text: "Really flowed — easy and musical",             signal: +1 },
      { text: "Had a lovely rhythm",                          signal: +1 },
    ],
    negative: [
      { text: "A bit clunky in places",                       signal: -1 },
      { text: "Hard to make sound natural",                   signal: -1 },
    ],
  },
  restraint: {
    question: "Did the story leave room for the imagination?",
    positive: [
      { text: "Left just enough to wonder about",             signal: +1 },
      { text: "Felt like it trusted us",                      signal: +1 },
    ],
    negative: [
      { text: "Over-explained — not much left to discover",   signal: -1 },
      { text: "Left us a little too uncertain",               signal: -0.5 },
    ],
  },
  quirk: {
    question: "How was the main character?",
    positive: [
      { text: "Really specific and memorable",                signal: +1 },
      { text: "Had real personality — felt like a real kid",  signal: +1 },
    ],
    negative: [
      { text: "Felt a bit generic",                           signal: -1 },
      { text: "Hard to connect with",                         signal: -1 },
    ],
  },
};

// Genre → which dimensions matter most (priority order for adaptive question)
const GENRE_DIMENSION_PRIORITY = {
  comedy:      ["rhythm", "quirk", "narrator", "specificity", "sent_length", "vocabulary", "warmth", "restraint"],
  adventure:   ["specificity", "restraint", "sent_length", "quirk", "rhythm", "narrator", "warmth", "vocabulary"],
  wonder:      ["restraint", "vocabulary", "specificity", "narrator", "rhythm", "warmth", "quirk", "sent_length"],
  cosy:        ["warmth", "sent_length", "specificity", "rhythm", "narrator", "vocabulary", "restraint", "quirk"],
  therapeutic: ["warmth", "restraint", "narrator", "specificity", "sent_length", "vocabulary", "rhythm", "quirk"],
};

// ─────────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSOR
// Takes feedback and updates the Style DNA profile for the given genre.
// This is the function that makes every story a calibration event.
// ─────────────────────────────────────────────────────────────────────────────

export function processFeedbackSignal({ feedback, genre, styleDna, storyMeta }) {
  // feedback shape:
  // {
  //   overallRating: 'loved' | 'good' | 'not_right',
  //   dimensionId: string,       // which dimension was asked
  //   dimensionSignal: number,   // -1, -0.5, 0, +0.5, +1
  //   rereadSignal: boolean | null,  // null = not yet known
  //   storyId: string,
  //   genre: string,
  //   ts: number,
  // }

  const updated = JSON.parse(JSON.stringify(styleDna)); // deep clone
  const genreProfile = updated.profiles?.[genre] || {};
  const masterProfile = updated.profiles?.master || {};

  // ── Overall rating signal ─────────────────────────────────────────────────
  // Maps overall rating to a general quality signal spread across all dimensions
  // with small adjustments. This is a weak signal — just nudges confidence.
  const overallWeight = {
    loved:     +0.8,
    good:      +0.2,
    not_right: -0.6,
  }[feedback.overallRating] ?? 0;

  // Apply weak nudge to all dimensions for this genre
  const priority = GENRE_DIMENSION_PRIORITY[genre] || Object.keys(DIMENSION_QUESTIONS);
  priority.forEach((dimId, idx) => {
    const weight = overallWeight * (1 - idx * 0.08); // diminishing effect down the priority list
    if (Math.abs(weight) < 0.1) return;
    const cur = genreProfile[dimId] || { score: masterProfile[dimId]?.score || 50, decisions: 0 };
    genreProfile[dimId] = {
      score: Math.max(5, Math.min(95, cur.score + weight)),
      decisions: cur.decisions + 0.2, // fractional — overall rating is a weak signal
    };
  });

  // ── Dimension-specific signal (the adaptive question answer) ──────────────
  // This is the strong signal. It targets exactly one dimension with a real decision.
  if (feedback.dimensionId && feedback.dimensionSignal !== null) {
    const dimId = feedback.dimensionId;
    const signal = feedback.dimensionSignal;
    const cur = genreProfile[dimId] || { score: masterProfile[dimId]?.score || 50, decisions: 0 };
    const delta = signal * 2.5; // each real user answer is worth 2.5 points

    genreProfile[dimId] = {
      score: Math.max(5, Math.min(95, cur.score + delta)),
      decisions: cur.decisions + 1,
    };

    // Ripple a weaker nudge to master (cross-genre learning)
    if (masterProfile[dimId]) {
      masterProfile[dimId] = {
        score: Math.max(5, Math.min(95, masterProfile[dimId].score + delta * 0.3)),
        decisions: masterProfile[dimId].decisions, // don't inflate master decision count
      };
    }
  }

  // ── Re-read signal (the gold signal) ─────────────────────────────────────
  // Highest weight signal in the system. A re-read means the story was genuinely good.
  // Not-reread is a softer negative — maybe they just didn't get to it.
  if (feedback.rereadSignal !== null) {
    const rereadWeight = feedback.rereadSignal ? +3.5 : -1.2;
    const topDims = priority.slice(0, 4); // most impactful dimensions for this genre
    topDims.forEach((dimId, idx) => {
      const w = rereadWeight * (1 - idx * 0.15);
      const cur = genreProfile[dimId] || { score: 50, decisions: 0 };
      genreProfile[dimId] = {
        score: Math.max(5, Math.min(95, cur.score + w)),
        decisions: cur.decisions + (feedback.rereadSignal ? 1.5 : 0.5), // re-read = stronger signal
      };
    });
  }

  // Write back
  if (!updated.profiles) updated.profiles = {};
  updated.profiles[genre] = genreProfile;
  updated.profiles.master = masterProfile;

  // Track feedback history
  if (!updated.feedbackHistory) updated.feedbackHistory = [];
  updated.feedbackHistory = [
    { ...feedback, processedAt: Date.now() },
    ...updated.feedbackHistory,
  ].slice(0, 200);

  // Track pending re-read checks
  if (feedback.rereadSignal === null && storyMeta) {
    if (!updated.pendingRereadChecks) updated.pendingRereadChecks = [];
    updated.pendingRereadChecks = [
      {
        storyId:    storyMeta.storyId,
        storyTitle: storyMeta.title,
        childName:  storyMeta.childName,
        genre:      feedback.genre,
        dimensionId: feedback.dimensionId,
        ts:         Date.now(),
      },
      ...updated.pendingRereadChecks,
    ].slice(0, 10); // keep last 10 pending
  }

  // Resolve pending re-read if this is one
  if (feedback.rereadSignal !== null && feedback.storyId) {
    updated.pendingRereadChecks = (updated.pendingRereadChecks || [])
      .filter(p => p.storyId !== feedback.storyId);
  }

  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE QUESTION SELECTOR
// Picks the most valuable question to ask given the current DNA state.
// ─────────────────────────────────────────────────────────────────────────────

export function selectAdaptiveQuestion(genre, styleDna) {
  const genreProfile = styleDna?.profiles?.[genre] || {};
  const masterProfile = styleDna?.profiles?.master || {};
  const priority = GENRE_DIMENSION_PRIORITY[genre] || Object.keys(DIMENSION_QUESTIONS);
  const recentDims = (styleDna?.feedbackHistory || [])
    .slice(0, 5)
    .map(f => f.dimensionId)
    .filter(Boolean);

  // Score each dimension: lower confidence = higher priority
  // Recently asked = lower priority (avoid asking same thing twice)
  const scored = priority.map((dimId, idx) => {
    const profile = genreProfile[dimId] || masterProfile[dimId];
    const decisions = profile?.decisions || 0;
    const confidenceScore = Math.min(decisions / 20, 1); // 0 = no data, 1 = fully confident
    const recencyPenalty  = recentDims.includes(dimId) ? 0.4 : 0;
    const priorityBonus   = (priority.length - idx) / priority.length * 0.3;
    const value = (1 - confidenceScore) + priorityBonus - recencyPenalty;
    return { dimId, value };
  });

  const best = scored.sort((a, b) => b.value - a.value)[0];
  return {
    dimId: best.dimId,
    ...DIMENSION_QUESTIONS[best.dimId],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

.sf-overlay {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(0,0,0,0); pointer-events: none;
  transition: background 0.4s ease;
}
.sf-overlay.visible {
  background: rgba(0,0,0,0.55); pointer-events: all;
}
.sf-sheet {
  width: 100%; max-width: 520px;
  background: #141210;
  border: 1px solid #292524;
  border-bottom: none;
  border-radius: 20px 20px 0 0;
  padding: 32px 32px 40px;
  transform: translateY(100%);
  transition: transform 0.45s cubic-bezier(0.34, 1.26, 0.64, 1);
  font-family: 'DM Sans', sans-serif;
}
.sf-sheet.visible {
  transform: translateY(0);
}
.sf-handle {
  width: 36px; height: 3px;
  background: #292524; border-radius: 2px;
  margin: 0 auto 28px;
}
.sf-phase { animation: sfIn 0.3s ease; }
@keyframes sfIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

.sf-story-title {
  font-family: 'Lora', serif; font-size: 13px; font-style: italic;
  color: #57534E; margin-bottom: 20px; text-align: center;
}
.sf-question {
  font-family: 'Lora', serif; font-size: 19px; font-weight: 600;
  color: #F5F5F4; text-align: center; line-height: 1.4; margin-bottom: 24px;
}
.sf-question em { font-style: italic; color: #D97706; }

/* Phase 1 — Emoji rating */
.sf-emoji-row {
  display: flex; gap: 12px; justify-content: center; margin-bottom: 8px;
}
.sf-emoji-btn {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: #1C1917; border: 1.5px solid #292524; border-radius: 14px;
  padding: 18px 20px; cursor: pointer; transition: all 0.2s;
  flex: 1; max-width: 140px;
}
.sf-emoji-btn:hover { border-color: #44403C; transform: translateY(-2px); }
.sf-emoji-btn.selected { border-color: #D97706; background: rgba(217,119,6,0.1); }
.sf-emoji { font-size: 32px; line-height: 1; }
.sf-emoji-label {
  font-size: 11.5px; font-weight: 500; color: #78716C;
  font-family: 'DM Sans', sans-serif; text-align: center;
}
.sf-emoji-btn.selected .sf-emoji-label { color: #D97706; }

/* Phase 2 — Adaptive question */
.sf-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.sf-option-btn {
  background: #1C1917; border: 1.5px solid #292524; border-radius: 11px;
  padding: 14px 18px; cursor: pointer; text-align: left;
  font-size: 13.5px; font-weight: 400; color: #A8A29E;
  font-family: 'DM Sans', sans-serif; transition: all 0.2s; line-height: 1.45;
}
.sf-option-btn:hover { border-color: #44403C; color: #E7E5E4; }
.sf-option-btn.selected { border-color: #D97706; background: rgba(217,119,6,0.08); color: #F5F5F4; }
.sf-skip {
  background: none; border: none; color: #44403C; font-size: 12px;
  cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 8px 0;
  display: block; margin: 4px auto 0; transition: color 0.15s;
}
.sf-skip:hover { color: #78716C; }

/* Phase 3 — Confirmation */
.sf-confirm-icon { font-size: 40px; text-align: center; margin-bottom: 12px; }
.sf-confirm-title {
  font-family: 'Lora', serif; font-size: 18px; font-weight: 700;
  color: #F5F5F4; text-align: center; margin-bottom: 8px;
}
.sf-confirm-sub {
  font-size: 12.5px; color: #57534E; text-align: center; line-height: 1.6;
  max-width: 320px; margin: 0 auto 24px;
}
.sf-reread-note {
  background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.2);
  border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;
}
.sf-reread-note-text {
  font-size: 12px; color: #78716C; line-height: 1.6;
}
.sf-reread-note-text strong { color: #D97706; font-weight: 600; }
.sf-btn-close {
  width: 100%; background: #1C1917; border: 1px solid #292524;
  color: #78716C; font-size: 13px; font-weight: 500; padding: 13px;
  border-radius: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
}
.sf-btn-close:hover { border-color: #44403C; color: #A8A29E; }

/* Re-read check widget */
.rr-card {
  background: #141210; border: 1px solid #292524; border-radius: 14px;
  padding: 22px 24px; margin-bottom: 20px;
  font-family: 'DM Sans', sans-serif;
  animation: sfIn 0.35s ease;
}
.rr-label {
  font-size: 9.5px; font-weight: 600; color: #44403C;
  text-transform: uppercase; letter-spacing: 1.2px;
  font-family: 'DM Mono', monospace; margin-bottom: 10px;
}
.rr-question {
  font-family: 'Lora', serif; font-size: 16px; font-weight: 600;
  color: #F5F5F4; line-height: 1.45; margin-bottom: 18px;
}
.rr-question em { font-style: italic; color: #D97706; }
.rr-story-title {
  font-size: 11.5px; font-style: italic; color: #57534E;
  margin-bottom: 16px; font-family: 'Lora', serif;
}
.rr-btn-row { display: flex; gap: 8px; }
.rr-btn {
  flex: 1; padding: 12px; border-radius: 9px; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  border: 1.5px solid;
}
.rr-btn.yes {
  background: rgba(22,163,74,0.1); border-color: rgba(22,163,74,0.35);
  color: #16A34A;
}
.rr-btn.yes:hover { background: rgba(22,163,74,0.2); }
.rr-btn.no {
  background: #1C1917; border-color: #292524; color: #57534E;
}
.rr-btn.no:hover { border-color: #44403C; color: #78716C; }
.rr-dismiss {
  background: none; border: none; color: #2C2A28; font-size: 11px;
  cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 6px 0;
  display: block; margin: 10px auto 0; transition: color 0.15s;
}
.rr-dismiss:hover { color: #44403C; }

/* Insight toast */
.sf-insight {
  background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.2);
  border-radius: 8px; padding: 10px 14px; margin-top: 12px;
  font-size: 11.5px; color: #78716C; line-height: 1.55; text-align: center;
}
.sf-insight strong { color: #D97706; font-weight: 500; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: StoryFeedback
//
// Props:
//   storyMeta       { storyId, title, genre, childName }
//   styleDna        current DNA state (from storage)
//   onFeedback      (updatedDna, rawFeedback) => void  — called when feedback is complete
//   onClose         () => void
//   visible         boolean
// ─────────────────────────────────────────────────────────────────────────────

export function StoryFeedback({ storyMeta, styleDna, onFeedback, onClose, visible }) {
  const [phase, setPhase]               = useState(1); // 1=rating, 2=adaptive, 3=confirm
  const [overallRating, setOverallRating] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [adaptiveQ, setAdaptiveQ]       = useState(null);
  const [insight, setInsight]           = useState(null);
  const sheetRef = useRef(null);

  // Pick adaptive question when component mounts
  useEffect(() => {
    if (storyMeta?.genre && styleDna) {
      setAdaptiveQ(selectAdaptiveQuestion(storyMeta.genre, styleDna));
    }
  }, [storyMeta?.genre, styleDna]);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setPhase(1);
      setOverallRating(null);
      setSelectedOption(null);
      setInsight(null);
    }
  }, [visible]);

  const handleOverallRating = (rating) => {
    setOverallRating(rating);
    // Brief pause before advancing
    setTimeout(() => setPhase(2), 320);
  };

  const handleDimensionChoice = useCallback((option) => {
    setSelectedOption(option);

    // Generate insight string
    const genreLabel = storyMeta?.genre?.charAt(0).toUpperCase() + storyMeta?.genre?.slice(1);
    const dimName = adaptiveQ?.dimId?.replace(/_/g, ' ');
    if (option.signal > 0) {
      setInsight(`Got it — keeping <strong>${dimName}</strong> high for ${genreLabel} stories.`);
    } else if (option.signal < 0) {
      setInsight(`Noted — adjusting <strong>${dimName}</strong> for next time.`);
    }

    // Process feedback
    const rawFeedback = {
      storyId:         storyMeta?.storyId,
      genre:           storyMeta?.genre,
      overallRating,
      dimensionId:     adaptiveQ?.dimId,
      dimensionSignal: option.signal,
      rereadSignal:    null, // pending — collected next session
      ts:              Date.now(),
    };

    const updatedDna = processFeedbackSignal({
      feedback: rawFeedback,
      genre: storyMeta?.genre,
      styleDna,
      storyMeta,
    });

    onFeedback?.(updatedDna, rawFeedback);

    setTimeout(() => setPhase(3), 400);
  }, [overallRating, adaptiveQ, storyMeta, styleDna, onFeedback]);

  const handleSkipDimension = useCallback(() => {
    const rawFeedback = {
      storyId:         storyMeta?.storyId,
      genre:           storyMeta?.genre,
      overallRating,
      dimensionId:     null,
      dimensionSignal: null,
      rereadSignal:    null,
      ts:              Date.now(),
    };
    const updatedDna = processFeedbackSignal({
      feedback: rawFeedback,
      genre: storyMeta?.genre,
      styleDna,
      storyMeta,
    });
    onFeedback?.(updatedDna, rawFeedback);
    setPhase(3);
  }, [overallRating, storyMeta, styleDna, onFeedback]);

  // Shuffle positive + negative options and mix them
  const shuffledOptions = adaptiveQ ? [
    ...adaptiveQ.positive,
    ...adaptiveQ.negative,
  ].sort(() => Math.random() - 0.5) : [];

  const RATINGS = [
    { id: "loved",     emoji: "❤️",  label: "Loved it"      },
    { id: "good",      emoji: "😊",  label: "It was good"   },
    { id: "not_right", emoji: "😐",  label: "Not quite"     },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className={`sf-overlay ${visible ? "visible" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
        <div className={`sf-sheet ${visible ? "visible" : ""}`} ref={sheetRef}>
          <div className="sf-handle" />

          {/* ── Phase 1: Overall Rating ── */}
          {phase === 1 && (
            <div className="sf-phase">
              <div className="sf-story-title">"{storyMeta?.title}"</div>
              <div className="sf-question">How was that story?</div>
              <div className="sf-emoji-row">
                {RATINGS.map(r => (
                  <button
                    key={r.id}
                    className={`sf-emoji-btn ${overallRating === r.id ? "selected" : ""}`}
                    onClick={() => handleOverallRating(r.id)}
                  >
                    <span className="sf-emoji">{r.emoji}</span>
                    <span className="sf-emoji-label">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Phase 2: Adaptive Question ── */}
          {phase === 2 && adaptiveQ && (
            <div className="sf-phase">
              <div className="sf-story-title">One quick thing…</div>
              <div className="sf-question">{adaptiveQ.question}</div>
              <div className="sf-options">
                {shuffledOptions.map((opt, i) => (
                  <button
                    key={i}
                    className={`sf-option-btn ${selectedOption === opt ? "selected" : ""}`}
                    onClick={() => handleDimensionChoice(opt)}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
              {insight && (
                <div className="sf-insight" dangerouslySetInnerHTML={{ __html: insight }} />
              )}
              <button className="sf-skip" onClick={handleSkipDimension}>Skip →</button>
            </div>
          )}

          {/* ── Phase 3: Confirmation ── */}
          {phase === 3 && (
            <div className="sf-phase">
              <div className="sf-confirm-icon">
                {overallRating === "loved" ? "🌟" : overallRating === "good" ? "✨" : "📝"}
              </div>
              <div className="sf-confirm-title">
                {overallRating === "loved" ? "So glad to hear it." :
                 overallRating === "good"  ? "Thanks for letting us know." :
                 "Thanks — we'll use that."}
              </div>
              <div className="sf-confirm-sub">
                Every answer helps SleepSeed write better stories for{" "}
                {storyMeta?.childName ? <strong>{storyMeta.childName}</strong> : "your child"}.
              </div>
              <div className="sf-reread-note">
                <div className="sf-reread-note-text">
                  <strong>One more thing</strong> — next time you open SleepSeed, we'll ask if{" "}
                  {storyMeta?.childName || "your child"} asked to hear this one again.{" "}
                  Re-reads are the best signal we have. ✨
                </div>
              </div>
              <button className="sf-btn-close" onClick={onClose}>
                Good night 🌙
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RE-READ CHECK COMPONENT
// Shown at the START of the next session, before the user generates a new story.
// This is the gold signal — highest weight in the calibration system.
// ─────────────────────────────────────────────────────────────────────────────

export function RereadCheck({ pendingCheck, styleDna, onAnswer, onDismiss }) {
  // pendingCheck: { storyId, storyTitle, childName, genre, dimensionId }
  if (!pendingCheck) return null;

  const handleAnswer = (reread) => {
    const rawFeedback = {
      storyId:         pendingCheck.storyId,
      genre:           pendingCheck.genre,
      overallRating:   null, // not re-asked
      dimensionId:     pendingCheck.dimensionId,
      dimensionSignal: null, // not re-asked
      rereadSignal:    reread,
      ts:              Date.now(),
    };

    const updatedDna = processFeedbackSignal({
      feedback: rawFeedback,
      genre: pendingCheck.genre,
      styleDna,
      storyMeta: pendingCheck,
    });

    onAnswer?.(updatedDna, rawFeedback, reread);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="rr-card">
        <div className="rr-label">⭐ Re-read Check</div>
        <div className="rr-story-title">"{pendingCheck.storyTitle}"</div>
        <div className="rr-question">
          Did <em>{pendingCheck.childName || "your child"}</em> ask to hear that story again?
        </div>
        <div className="rr-btn-row">
          <button className="rr-btn yes" onClick={() => handleAnswer(true)}>
            ✓ Yes, they did
          </button>
          <button className="rr-btn no" onClick={() => handleAnswer(false)}>
            Not this time
          </button>
        </div>
        <button className="rr-dismiss" onClick={onDismiss}>
          Can't remember — skip
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO / PREVIEW
// Self-contained interactive demo of the full feedback flow.
// Remove this export when integrating into production.
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_DNA = {
  profiles: {
    master:      Object.fromEntries(Object.keys(DIMENSION_QUESTIONS).map(k => [k, { score: 50, decisions: 0 }])),
    comedy:      Object.fromEntries(Object.keys(DIMENSION_QUESTIONS).map(k => [k, { score: 50, decisions: 0 }])),
    adventure:   Object.fromEntries(Object.keys(DIMENSION_QUESTIONS).map(k => [k, { score: 50, decisions: 0 }])),
    wonder:      Object.fromEntries(Object.keys(DIMENSION_QUESTIONS).map(k => [k, { score: 50, decisions: 0 }])),
    cosy:        Object.fromEntries(Object.keys(DIMENSION_QUESTIONS).map(k => [k, { score: 50, decisions: 0 }])),
    therapeutic: Object.fromEntries(Object.keys(DIMENSION_QUESTIONS).map(k => [k, { score: 50, decisions: 0 }])),
  },
  feedbackHistory: [],
  pendingRereadChecks: [],
};

const DEMO_STORIES = [
  { storyId: "s1", title: "The Night the Stars Listened",    genre: "therapeutic", childName: "Mia" },
  { storyId: "s2", title: "Milo's Extremely Loud Sneezes",   genre: "comedy",      childName: "Leo" },
  { storyId: "s3", title: "The Garden with No Explanation",  genre: "wonder",      childName: "Pip" },
];

export default function StoryFeedbackDemo() {
  const [dna, setDna] = useState(DEMO_DNA);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);
  const [feedbackLog, setFeedbackLog] = useState([]);
  const [showReread, setShowReread] = useState(false);

  const pending = dna.pendingRereadChecks?.[0] || null;

  const handleStoryEnd = (story) => {
    setCurrentStory(story);
    setFeedbackVisible(true);
  };

  const handleFeedback = (updatedDna, rawFeedback) => {
    setDna(updatedDna);
    setFeedbackLog(prev => [rawFeedback, ...prev].slice(0, 20));
  };

  const handleRereadAnswer = (updatedDna, rawFeedback, reread) => {
    setDna(updatedDna);
    setFeedbackLog(prev => [rawFeedback, ...prev].slice(0, 20));
    setShowReread(false);
  };

  const genreColor = {
    therapeutic: "#0D9488", comedy: "#EAB308",
    adventure: "#F97316", wonder: "#8B5CF6", cosy: "#10B981",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0C0B0A", color: "#E7E5E4",
      fontFamily: "'DM Sans', sans-serif", padding: "40px 24px",
    }}>
      <style>{CSS}</style>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0C0B0A}::-webkit-scrollbar-thumb{background:#1C1917;border-radius:2px}
      `}</style>

      <div style={{ maxWidth: 540, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "'Lora', serif", fontSize: 13, color: "#44403C", marginBottom: 6 }}>🌙 SleepSeed</div>
          <div style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 700, color: "#F5F5F4", marginBottom: 6 }}>
            Story Feedback System
          </div>
          <div style={{ fontSize: 12.5, color: "#57534E", lineHeight: 1.6 }}>
            Every story is a calibration event. Tap "Story Ended" to see the feedback flow, then check the DNA updates below.
          </div>
        </div>

        {/* Pending re-read check */}
        {(pending || showReread) && (
          <RereadCheck
            pendingCheck={pending || { storyId:"s0", storyTitle:"The Night the Stars Listened", childName:"Mia", genre:"therapeutic", dimensionId:"warmth" }}
            styleDna={dna}
            onAnswer={handleRereadAnswer}
            onDismiss={() => setShowReread(false)}
          />
        )}

        {/* Story tiles */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9.5, color: "#44403C", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>
            Simulate story ending
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEMO_STORIES.map(story => (
              <div key={story.storyId} style={{
                background: "#141210", border: "1px solid #1C1917", borderRadius: 12,
                padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontFamily: "'Lora', serif", fontSize: 14, fontStyle: "italic", color: "#C4B5A0", marginBottom: 4 }}>
                    "{story.title}"
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", padding: "2px 8px", borderRadius: 50, background: `${genreColor[story.genre]}18`, color: genreColor[story.genre], border: `1px solid ${genreColor[story.genre]}44` }}>
                      {story.genre}
                    </span>
                    <span style={{ fontSize: 10, color: "#44403C" }}>for {story.childName}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleStoryEnd(story)}
                  style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.3)", color: "#D97706", fontSize: 11.5, fontWeight: 600, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}
                >
                  Story ended →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Show re-read check */}
        <button
          onClick={() => setShowReread(true)}
          style={{ width: "100%", background: "rgba(217,119,6,0.06)", border: "1px dashed rgba(217,119,6,0.25)", color: "#78716C", fontSize: 12, padding: "11px", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 28 }}
        >
          ⭐ Simulate next-session re-read check
        </button>

        {/* Live DNA readout */}
        <div style={{ background: "#141210", border: "1px solid #1C1917", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 9.5, color: "#44403C", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>
            Live DNA — Comedy Profile
          </div>
          {Object.entries(dna.profiles.comedy).map(([dimId, v]) => {
            const score = v?.score ?? 50;
            const dec   = v?.decisions ?? 0;
            const q     = DIMENSION_QUESTIONS[dimId];
            if (!q) return null;
            return (
              <div key={dimId} style={{ marginBottom: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#78716C" }}>{dimId.replace(/_/g, " ")}</span>
                  <span style={{ fontSize: 10, color: dec > 0 ? "#D97706" : "#2C2A28", fontFamily: "'DM Mono', monospace" }}>
                    {score.toFixed(1)} · {dec.toFixed(1)} decisions
                  </span>
                </div>
                <div style={{ height: 2.5, background: "#1C1917", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${score}%`, background: "linear-gradient(90deg, #1C1917, #EAB308)", borderRadius: 2, transition: "width 0.6s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback log */}
        {feedbackLog.length > 0 && (
          <div style={{ background: "#141210", border: "1px solid #1C1917", borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ fontSize: 9.5, color: "#44403C", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>
              Feedback Log
            </div>
            {feedbackLog.map((f, i) => (
              <div key={i} style={{ borderBottom: i < feedbackLog.length - 1 ? "1px solid #1C1917" : "none", paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "#57534E", fontFamily: "'DM Mono', monospace" }}>{f.genre}</span>
                  {f.overallRating && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 50, background: "#1C1917", color: "#78716C" }}>{f.overallRating}</span>}
                  {f.dimensionId && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 50, background: "rgba(217,119,6,0.1)", color: "#D97706" }}>{f.dimensionId}: {f.dimensionSignal > 0 ? "+" : ""}{f.dimensionSignal}</span>}
                  {f.rereadSignal !== null && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 50, background: f.rereadSignal ? "rgba(22,163,74,0.1)" : "#1C1917", color: f.rereadSignal ? "#16A34A" : "#57534E" }}>re-read: {f.rereadSignal ? "yes ⭐" : "no"}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback sheet */}
      <StoryFeedback
        storyMeta={currentStory}
        styleDna={dna}
        onFeedback={handleFeedback}
        onClose={() => setFeedbackVisible(false)}
        visible={feedbackVisible}
      />
    </div>
  );
}
