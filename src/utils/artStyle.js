// Which dragon art set the game shows (Ryan 9/5: let Iona test the styles in the deployed app).
// Persisted per device; falls back to the first style a dragon actually has art for.
export const ART_STYLES = [
  { id: 'graphic-novel', label: 'Comic' },
  { id: 'realistic', label: 'Realistic' },
  { id: 'painterly', label: 'Painted' },
];

const KEY = 'dragonMath.artStyle';

export function getArtStyle() {
  try {
    const v = localStorage.getItem(KEY);
    if (v && ART_STYLES.some(s => s.id === v)) return v;
  } catch (e) { /* storage unavailable */ }
  return ART_STYLES[0].id;
}

export function setArtStyle(id) {
  try { localStorage.setItem(KEY, id); } catch (e) { /* ignore */ }
  window.dispatchEvent(new CustomEvent('artstylechange', { detail: id }));
}
