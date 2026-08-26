// ブラウザでは file:// から直接開いても動くように、ES Modules (import/export) を
// 使わない通常の<script>として読み込み、公開APIはglobalThis.RouletteLogicにまとめる。
// Vitestからは `import "../js/roulette-logic.js"` で副作用として読み込み、
// globalThis.RouletteLogic経由で同じ関数を直接テストする。
(function (global) {
  const DEFAULT_CANDIDATES = [
    "🍜 ラーメン",
    "🍛 カレー",
    "🍣 寿司",
    "🍝 パスタ",
    "🍱 定食",
    "🍲 うどん",
  ];

  const MIN_CANDIDATES = 2;
  const EXTRA_SPIN_TURNS = 5;

  function addCandidate(candidates, name) {
    return [...candidates, name];
  }

  function canRemove(candidates) {
    return candidates.length > MIN_CANDIDATES;
  }

  function removeCandidate(candidates, index) {
    if (!canRemove(candidates)) {
      return candidates;
    }
    return candidates.filter((_, i) => i !== index);
  }

  function pickRandomIndex(candidates) {
    return Math.floor(Math.random() * candidates.length);
  }

  function getSegmentAngle(count) {
    return 360 / count;
  }

  function normalizeAngle(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function getIndexAtRotation(rotation, count) {
    const segAngle = getSegmentAngle(count);
    const topAngle = normalizeAngle(360 - normalizeAngle(rotation));
    const index = Math.floor(topAngle / segAngle);
    return Math.min(index, count - 1);
  }

  function computeSpinRotation(currentRotation, count, targetIndex, extraSpins = EXTRA_SPIN_TURNS) {
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

  global.RouletteLogic = {
    DEFAULT_CANDIDATES,
    MIN_CANDIDATES,
    EXTRA_SPIN_TURNS,
    addCandidate,
    canRemove,
    removeCandidate,
    pickRandomIndex,
    getSegmentAngle,
    computeSpinRotation,
    getIndexAtRotation,
  };
})(globalThis);
