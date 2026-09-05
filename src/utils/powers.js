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
  const entry = id && set?.powers ? set.powers[id] : null;
  return entry && entry.fx && entry.fx.length ? { id, ...entry } : null;
}

export function setHasPowers(set) {
  return !!(set && set.powers && Object.keys(set.powers).length);
}
