/**
 * Client-side story personalization utilities.
 *
 * Tier 1: quickPersonalise() — instant word-boundary-aware string replacement.
 * Used for live preview in the remix block. Not perfect (no pronoun handling),
 * but much better than the naive split().join() approach.
 *
 * Tier 2: Server-side AI personalization via /api/remix.
 * Uses buildPersonalisationPrompt() for surgical, context-aware substitution.
 */

import type { StoryRole } from './types';

/**
 * Word-boundary-aware name replacement.
 * Handles possessives ("Mia's" → "Sophie's") and avoids
 * partial matches ("Mia" in "Miami" stays "Miami").
 */
export function quickPersonalise(
  text: string,
  nameMap: Record<string, string>,
): string {
  let result = text;
  for (const [orig, replacement] of Object.entries(nameMap)) {
    if (!replacement || replacement === orig) continue;
    const escaped = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match whole word (with optional possessive)
    const regex = new RegExp(`\\b${escaped}(?='s\\b|\\b)`, 'g');
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Build a nameMap from story roles + user inputs.
 * Only substitutes roles marked as isSubstitutable.
 */
export function buildNameMap(
  roles: StoryRole[],
  inputs: Record<string, string>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const role of roles) {
    if (!role.isSubstitutable) continue;
    const newName = inputs[role.role]?.trim();
    if (newName && newName !== role.originalName) {
      map[role.originalName] = newName;
    }
  }
  return map;
}

/**
 * Apply quickPersonalise to all pages of a book.
 */
export function personaliseBook(
  bookData: any,
  nameMap: Record<string, string>,
): any {
  if (!bookData) return bookData;
  const result = { ...bookData };

  if (result.title) result.title = quickPersonalise(result.title, nameMap);
  if (result.refrain) result.refrain = quickPersonalise(result.refrain, nameMap);
  if (result.heroName) {
    const heroEntry = Object.entries(nameMap).find(([orig]) => orig === result.heroName);
    if (heroEntry) result.heroName = heroEntry[1];
  }

  if (Array.isArray(result.pages)) {
    result.pages = result.pages.map((p: any) => ({
      ...p,
      text: quickPersonalise(p.text || '', nameMap),
    }));
  }

  return result;
}
