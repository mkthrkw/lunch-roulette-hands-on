export const DEFAULT_CANDIDATES = [
  "🍜 ラーメン",
  "🍛 カレー",
  "🍣 寿司",
  "🍝 パスタ",
  "🍱 定食",
  "🍲 うどん",
];

export const MIN_CANDIDATES = 2;
export const EXTRA_SPIN_TURNS = 5;

export function addCandidate(candidates, name) {
  return [...candidates, name];
}

export function canRemove(candidates) {
  return candidates.length > MIN_CANDIDATES;
}

export function removeCandidate(candidates, index) {
  if (!canRemove(candidates)) {
    return candidates;
  }
  return candidates.filter((_, i) => i !== index);
}

export function pickRandomIndex(candidates) {
  return Math.floor(Math.random() * candidates.length);
}

export function getSegmentAngle(count) {
  return 360 / count;
}

function normalizeAngle(deg) {
  return ((deg % 360) + 360) % 360;
}

export function getIndexAtRotation(rotation, count) {
  const segAngle = getSegmentAngle(count);
  const topAngle = normalizeAngle(360 - normalizeAngle(rotation));
  const index = Math.floor(topAngle / segAngle);
  return Math.min(index, count - 1);
}

export function computeSpinRotation(
  currentRotation,
  count,
  targetIndex,
  extraSpins = EXTRA_SPIN_TURNS
) {
  const segAngle = getSegmentAngle(count);
  const targetCenter = targetIndex * segAngle + segAngle / 2;
  const requiredMod = normalizeAngle(360 - targetCenter);
  const currentMod = normalizeAngle(currentRotation);

  let base = currentRotation - currentMod + requiredMod;
  if (base <= currentRotation) {
    base += 360;
  }

  return base + extraSpins * 360;
}
