import EggHatchCeremony from './EggHatchCeremony';

/**
 * Dev-only page to preview the egg hatch ceremony.
 * Access via: set view to 'dev-hatch-test' or route directly.
 */
export default function DevHatchTest() {
  return (
    <EggHatchCeremony
      childName="Adina"
      characterId="test-char-id"
      creatureData={{
        creatureType: 'fox',
        name: 'Ember',
        nameSuggestions: ['Ember', 'Russet', 'Maple', 'Blaze'],
        creatureEmoji: '🦊',
        color: '#FF8264',
        rarity: 'common',
        personalityTraits: ['quick-witted', 'playful', 'resourceful'],
        virtue: 'Cleverness',
      }}
      onComplete={(creature) => {
        console.log('[DevHatchTest] Ceremony complete:', creature);
        alert(`Hatched: ${creature.name} (${creature.creatureEmoji})\n\nIn production this returns to dashboard.`);
      }}
    />
  );
}
