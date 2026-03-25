/*
  Translation service for SleepSeed language learning mode.

  Translates full story text via Claude API, returns sentence-by-sentence
  pairs (foreign + English) for interlinear display. Caches in memory.
*/

export interface TranslatedSentence {
  foreign: string;
  english: string;
}

export interface TranslatedPage {
  sentences: TranslatedSentence[];
}

export interface TranslationResult {
  language: string;
  pages: TranslatedPage[];
}

// In-memory cache keyed by "storyId:language"
const cache = new Map<string, TranslationResult>();

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'he', label: 'Hebrew', flag: '🇮🇱' },
];

export function getLanguageLabel(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.label || code;
}

export function getLanguageFlag(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.flag || '';
}

/** Get sticky language preference */
export function getSavedLanguage(): { code: string; learningMode: boolean } {
  try {
    const stored = localStorage.getItem('sleepseed_lang');
    if (stored) return JSON.parse(stored);
  } catch {}
  return { code: 'en', learningMode: false };
}

/** Save sticky language preference */
export function saveLanguage(code: string, learningMode: boolean): void {
  try { localStorage.setItem('sleepseed_lang', JSON.stringify({ code, learningMode })); } catch {}
}

/**
 * Translate an array of page texts into the target language.
 * Returns sentence-by-sentence pairs for interlinear display.
 */
export async function translateStory(
  pageTexts: string[],
  targetLanguage: string,
  cacheKey?: string,
): Promise<TranslationResult> {
  const key = cacheKey ? `${cacheKey}:${targetLanguage}` : `${pageTexts.join('|||').slice(0,100)}:${targetLanguage}`;

  // Check cache
  const cached = cache.get(key);
  if (cached) return cached;

  const langName = getLanguageLabel(targetLanguage);

  const prompt = `Translate this children's bedtime story into ${langName}.

The text is divided into pages separated by "|||PAGE|||". For each page, split into sentences and provide both the ${langName} translation and the original English.

RULES:
- Keep character names unchanged (don't translate proper nouns)
- Use simple, age-appropriate vocabulary in ${langName}
- Maintain the warm, storytelling tone
- Each sentence pair must align — the foreign sentence should correspond to exactly one English sentence

Return ONLY valid JSON in this format:
{
  "pages": [
    {
      "sentences": [
        { "foreign": "translated sentence in ${langName}", "english": "original English sentence" },
        ...
      ]
    },
    ...
  ]
}

TEXT TO TRANSLATE:
${pageTexts.join('\n|||PAGE|||\n')}`;

  try {
    const r = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const raw = await r.text();
    let d;
    try { d = JSON.parse(raw); } catch { throw new Error('Bad response'); }
    if (!r.ok) throw new Error(d.error?.message || 'API error');
    const text = d.content?.find((b: any) => b.type === 'text')?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    const result: TranslationResult = {
      language: targetLanguage,
      pages: (parsed.pages || []).map((p: any) => ({
        sentences: (p.sentences || []).map((s: any) => ({
          foreign: s.foreign || '',
          english: s.english || '',
        })),
      })),
    };

    cache.set(key, result);
    return result;
  } catch (e: any) {
    console.error('[translate] Failed:', e);
    throw e;
  }
}
