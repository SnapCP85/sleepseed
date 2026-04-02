# DreamKeeper Onboarding Integration

**Implemented:** 2026-03-31
**Scope:** V1 DreamKeeper selection flow + story prompt injection

---

## What was added

### New files
- `src/lib/dreamkeepers.ts` — 10 V1 DreamKeeper definitions, 6 feelings, Elder data (data-only), matching logic
- `src/pages/DreamKeeperOnboarding.tsx` — 6-step onboarding flow (intro, feelings, reveal, meet, browse, confirm)
- `src/components/DreamKeeperReveal.tsx` — 8.5-second timed reveal animation
- `public/dreamkeepers/*.jpg` — 10 DreamKeeper character images
- `public/elder/elder.jpg` — Elder reference image (not rendered in V1)

### Modified files
- `src/App.tsx` — New `handleDreamKeeperComplete` handler + `view === 'onboarding'` routes to DreamKeeperOnboarding
- `src/SleepSeedCore.tsx` — DreamKeeper context injected into story generation prompt (additive, conditional)

### Untouched (preserved as-is)
- `src/pages/OnboardingFlow.tsx` — Old onboarding, kept as fallback and test mode target
- `src/lib/creatures.ts` — All 20 creatures unchanged
- `src/AppContext.tsx` — No state shape changes
- `src/sleepseed-prompts.js` — No prompt builder changes

---

## How it hooks into the app

```
ParentSetup
  → setView('onboarding')
    → DreamKeeperOnboarding.tsx renders (6 steps)
      → onComplete fires with { dreamKeeper, feeling, childName }
        → handleDreamKeeperComplete in App.tsx:
            1. Saves Character (from parentSetupData)
            2. Saves HatchedCreature (from DreamKeeper selection)
            3. Creates Egg
            4. Sets companionCreature in AppContext
            5. Marks onboarding done (localStorage flag)
            6. Routes to ritual-starter
              → StoryCreator (ritual mode)
                → SleepSeedCore generates story
                  → DreamKeeper context injected into prompt
                  → Creature appears in story as subtle presence
```

## Creature type mapping

| DreamKeeper | creatures.ts ID | creatureType stored |
|---|---|---|
| Owl, Bear, Fox, Bunny, Dragon, Cat, Turtle | Same ID exists | Uses real ID |
| Sloth, Seal, Dog | No match | `'spirit'` (fallback) |

`getCreature('spirit')` gracefully falls back to `CREATURES[0]` in Hatchery — cosmetic only.

## Rollback

Revert the `view === 'onboarding'` block in App.tsx to render `<OnboardingFlow>` instead of `<DreamKeeperOnboarding>`. One block change, instant rollback.
