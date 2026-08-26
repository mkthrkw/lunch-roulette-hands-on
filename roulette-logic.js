// ランチルーレットの純粋ロジック（DOM非依存）。
// ブラウザでは window.RouletteLogic として、Vitest（Node）では module.exports として利用できる。

const MIN_CANDIDATES = 2;
const MAX_HISTORY = 5;

function addCandidate(candidates, text) {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) {
    return candidates.slice();
  }
  return [...candidates, trimmed];
}

function removeCandidate(candidates, index) {
  if (candidates.length <= MIN_CANDIDATES) {
    return candidates.slice();
  }
  if (index < 0 || index >= candidates.length) {
    return candidates.slice();
  }
  const next = candidates.slice();
  next.splice(index, 1);
  return next;
}

function pickRandomIndex(count) {
  return Math.floor(Math.random() * count);
}

function getSliceAngle(count) {
  return 360 / count;
}

function getSliceCenterAngle(index, count) {
  const sliceAngle = getSliceAngle(count);
  return index * sliceAngle + sliceAngle / 2;
}

// 中心角を0〜360度の範囲に正規化したうえで、
// 90〜270度（円の下半分寄り）にある場合はラベルが上下逆に見えないよう180度反転する。
function getLabelRotation(centerAngle) {
  const normalized = ((centerAngle % 360) + 360) % 360;
  if (normalized > 90 && normalized <= 270) {
    return normalized + 180;
  }
  return normalized;
}

// currentRotation より必ず大きい新しい累積回転角を返す。
// (新しい回転角 + winningIndexの中心角) が 360 の倍数になる = ポインター(真上, 0度)に一致する。
function computeSpinRotation(currentRotation, winningIndex, count, extraTurns) {
  const turns = typeof extraTurns === "number" ? extraTurns : 4;
  const centerAngle = getSliceCenterAngle(winningIndex, count);
  const targetAngle = (360 - centerAngle) % 360;
  const completedTurns = currentRotation - (((currentRotation % 360) + 360) % 360);

  let newRotation = completedTurns + 360 * turns + targetAngle;
  while (newRotation <= currentRotation) {
    newRotation += 360;
  }
  return newRotation;
}

// 新しい結果を履歴の先頭に追加し、limit件を超える古いものは切り捨てる。
function addHistoryEntry(history, text, limit) {
  const max = typeof limit === "number" ? limit : MAX_HISTORY;
  return [text, ...history].slice(0, max);
}

const RouletteLogic = {
  MIN_CANDIDATES,
  MAX_HISTORY,
  addCandidate,
  removeCandidate,
  pickRandomIndex,
  getSliceAngle,
  getSliceCenterAngle,
  getLabelRotation,
  computeSpinRotation,
  addHistoryEntry,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = RouletteLogic;
} else {
  window.RouletteLogic = RouletteLogic;
}
