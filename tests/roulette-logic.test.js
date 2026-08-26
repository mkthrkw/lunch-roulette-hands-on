import { describe, test, expect } from "vitest";
import RouletteLogic from "../roulette-logic.js";

const {
  MIN_CANDIDATES,
  MAX_HISTORY,
  addCandidate,
  removeCandidate,
  pickRandomIndex,
  getSliceCenterAngle,
  computeSpinRotation,
  addHistoryEntry,
} = RouletteLogic;

const INITIAL_CANDIDATES = ["🍜 ラーメン", "🍛 カレー", "🍣 寿司", "🍝 パスタ", "🍱 定食", "🍲 うどん"];

describe("pickRandomIndex", () => {
  test("常に 0 以上 count 未満の整数を返す", () => {
    const count = 6;
    for (let i = 0; i < 500; i++) {
      const index = pickRandomIndex(count);
      expect(Number.isInteger(index)).toBe(true);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(count);
    }
  });
});

describe("addCandidate", () => {
  test("候補が1件追加される", () => {
    const next = addCandidate(INITIAL_CANDIDATES, "🍔 ハンバーガー");
    expect(next).toHaveLength(INITIAL_CANDIDATES.length + 1);
    expect(next[next.length - 1]).toBe("🍔 ハンバーガー");
  });

  test("前後の空白を除去して追加する", () => {
    const next = addCandidate(INITIAL_CANDIDATES, "  🍕 ピザ  ");
    expect(next[next.length - 1]).toBe("🍕 ピザ");
  });

  test("空文字・空白のみは追加しない", () => {
    expect(addCandidate(INITIAL_CANDIDATES, "")).toHaveLength(INITIAL_CANDIDATES.length);
    expect(addCandidate(INITIAL_CANDIDATES, "   ")).toHaveLength(INITIAL_CANDIDATES.length);
  });

  test("元の配列を変更しない", () => {
    const original = [...INITIAL_CANDIDATES];
    addCandidate(INITIAL_CANDIDATES, "🍔 ハンバーガー");
    expect(INITIAL_CANDIDATES).toEqual(original);
  });
});

describe("removeCandidate", () => {
  test("指定した候補が1件削除される", () => {
    const next = removeCandidate(INITIAL_CANDIDATES, 0);
    expect(next).toHaveLength(INITIAL_CANDIDATES.length - 1);
    expect(next).not.toContain("🍜 ラーメン");
  });

  test("候補が2件のときは削除できない（no-op）", () => {
    const twoCandidates = ["🍜 ラーメン", "🍛 カレー"];
    const next = removeCandidate(twoCandidates, 0);
    expect(next).toHaveLength(MIN_CANDIDATES);
    expect(next).toEqual(twoCandidates);
  });

  test("元の配列を変更しない", () => {
    const original = [...INITIAL_CANDIDATES];
    removeCandidate(INITIAL_CANDIDATES, 0);
    expect(INITIAL_CANDIDATES).toEqual(original);
  });
});

describe("computeSpinRotation", () => {
  test("選ばれた候補の中心角がポインター（真上・0度）に一致する", () => {
    const cases = [
      { count: 2, winningIndex: 0 },
      { count: 2, winningIndex: 1 },
      { count: 6, winningIndex: 3 },
      { count: 7, winningIndex: 5 },
    ];

    for (const { count, winningIndex } of cases) {
      const rotation = computeSpinRotation(0, winningIndex, count, 4);
      const centerAngle = getSliceCenterAngle(winningIndex, count);
      const normalized = (((rotation + centerAngle) % 360) + 360) % 360;
      expect(normalized).toBeCloseTo(0, 6);
    }
  });

  test("常に現在の回転角より大きい値を返す（逆回転しない）", () => {
    let rotation = 0;
    for (let i = 0; i < 10; i++) {
      const winningIndex = pickRandomIndex(6);
      const next = computeSpinRotation(rotation, winningIndex, 6, 4);
      expect(next).toBeGreaterThan(rotation);
      rotation = next;
    }
  });
});

describe("addHistoryEntry", () => {
  test("新しい結果が先頭に追加される", () => {
    const next = addHistoryEntry(["🍣 寿司"], "🍜 ラーメン", MAX_HISTORY);
    expect(next).toEqual(["🍜 ラーメン", "🍣 寿司"]);
  });

  test("最大件数（5件）を超えた古い結果は切り捨てられる", () => {
    let history = [];
    const spins = ["1回目", "2回目", "3回目", "4回目", "5回目", "6回目"];
    for (const text of spins) {
      history = addHistoryEntry(history, text, MAX_HISTORY);
    }
    expect(history).toHaveLength(MAX_HISTORY);
    expect(history).toEqual(["6回目", "5回目", "4回目", "3回目", "2回目"]);
    expect(history).not.toContain("1回目");
  });

  test("元の配列を変更しない", () => {
    const original = ["🍣 寿司"];
    const originalCopy = [...original];
    addHistoryEntry(original, "🍜 ラーメン", MAX_HISTORY);
    expect(original).toEqual(originalCopy);
  });
});
