// Power ids in unlock order; dragons.js lists each dragon's five skills in the same order, so
// skill index -> power id. The art set's manifest carries the generated effect frames per id.
export const POWER_IDS = ['spark', 'puff', 'breath', 'shield', 'blast'];

export function powerIdFor(dragon, skill) {
  const i = (dragon?.skills || []).findIndex(s => s.name === skill?.name);
  return i >= 0 ? POWER_IDS[i] : null;
}

// The effect sequence for a skill from the active art set, or null when the set has none.
export function powerFxFor(set, dragon, skill) {
  const id = powerIdFor(dragon, skill);
  if (!id || !set?.powers) return null;
  const entry = set.powers[id];
  if (entry && entry.fx && entry.fx.length) return { id, ...entry };
  // the ULTIMATE has no clip of its own (generation kept inventing a ghost second dragon inside the
  // explosion): it replays the fire-breath performance, bigger and brighter.
  if (id === 'blast' && set.powers.breath?.fx?.length) return { id, ...set.powers.breath, big: true };
  return null;
}

export function setHasPowers(set) {
  return !!(set && set.powers && Object.keys(set.powers).length);
}
