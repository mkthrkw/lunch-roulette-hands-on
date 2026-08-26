import { describe, it, expect } from "vitest";
import {
  DEFAULT_CANDIDATES,
  MIN_CANDIDATES,
  addCandidate,
  canRemove,
  removeCandidate,
  pickRandomIndex,
  computeSpinRotation,
  getIndexAtRotation,
} from "../js/roulette-logic.js";

describe("pickRandomIndex (TC-1)", () => {
  it("常に候補の範囲内の整数インデックスを返す", () => {
    const candidates = DEFAULT_CANDIDATES;
    for (let i = 0; i < 200; i++) {
      const index = pickRandomIndex(candidates);
      expect(Number.isInteger(index)).toBe(true);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(candidates.length);
    }
  });
});

describe("addCandidate (TC-2)", () => {
  it("候補を1件追加した新しい配列を返し、元の配列を変更しない", () => {
    const original = ["🍜 ラーメン", "🍛 カレー"];
    const result = addCandidate(original, "🍕 ピザ");

    expect(result).toEqual(["🍜 ラーメン", "🍛 カレー", "🍕 ピザ"]);
    expect(original).toEqual(["🍜 ラーメン", "🍛 カレー"]);
  });
});

describe("removeCandidate (TC-3)", () => {
  it("候補が最低件数より多いとき、指定した候補を除いた配列を返す", () => {
    const candidates = ["🍜 ラーメン", "🍛 カレー", "🍣 寿司"];
    const result = removeCandidate(candidates, 1);

    expect(result).toEqual(["🍜 ラーメン", "🍣 寿司"]);
  });
});

describe("removeCandidate at minimum (TC-4)", () => {
  it("候補が2件のときは削除されず、件数が変わらない", () => {
    const candidates = ["🍜 ラーメン", "🍛 カレー"];
    expect(candidates.length).toBe(MIN_CANDIDATES);
    expect(canRemove(candidates)).toBe(false);

    const result = removeCandidate(candidates, 0);
    expect(result).toEqual(candidates);
  });
});

describe("computeSpinRotation / getIndexAtRotation の整合性 (TC-5)", () => {
  it("計算した回転角から逆算した候補が、選出した候補と常に一致する", () => {
    for (let count = 2; count <= 8; count++) {
      for (let targetIndex = 0; targetIndex < count; targetIndex++) {
        let currentRotation = 0;

        for (let spin = 0; spin < 3; spin++) {
          const rotation = computeSpinRotation(currentRotation, count, targetIndex);

          expect(rotation).toBeGreaterThan(currentRotation);
          expect(getIndexAtRotation(rotation, count)).toBe(targetIndex);

          currentRotation = rotation;
        }
      }
    }
  });
});
