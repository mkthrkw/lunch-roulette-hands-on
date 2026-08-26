// DOM描画・イベント処理。ロジックは roulette-logic.js (window.RouletteLogic) に委譲する。
(function () {
  const logic = window.RouletteLogic;

  const PALETTE = [
    "#FFD3B6",
    "#FFAAA5",
    "#FF8C94",
    "#A8E6CE",
    "#DCEDC2",
    "#B5EAEA",
    "#FFF5BA",
    "#D5AAFF",
  ];
  const EXTRA_TURNS = 4;
  const WHEEL_SIZE = 300;
  const SPIN_DURATION_MS = 2600;

  let candidates = ["🍜 ラーメン", "🍛 カレー", "🍣 寿司", "🍝 パスタ", "🍱 定食", "🍲 うどん"];
  let rotation = 0;
  let isSpinning = false;
  let history = [];

  const listEl = document.getElementById("candidate-list");
  const formEl = document.getElementById("add-form");
  const inputEl = document.getElementById("candidate-input");
  const wheelEl = document.getElementById("wheel");
  const spinButton = document.getElementById("spin-button");
  const resultEl = document.getElementById("result-display");
  const historyListEl = document.getElementById("history-list");

  function escapeXml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function polarToCartesian(cx, cy, radius, angleDeg) {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + radius * Math.sin(angleRad),
      y: cy - radius * Math.cos(angleRad),
    };
  }

  function describeSlice(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      "Z",
    ].join(" ");
  }

  function render() {
    renderList();
    renderWheel();
    renderHistory();
    formEl.querySelector("button[type=submit]").disabled = isSpinning;
  }

  function renderHistory() {
    historyListEl.innerHTML = "";
    history.forEach((text) => {
      const li = document.createElement("li");
      li.className = "history-item";
      li.textContent = text;
      historyListEl.appendChild(li);
    });
  }

  function renderList() {
    listEl.innerHTML = "";
    candidates.forEach((text, index) => {
      const li = document.createElement("li");
      li.className = "candidate-item";

      const label = document.createElement("span");
      label.className = "candidate-text";
      label.textContent = text;
      li.appendChild(label);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-button";
      removeBtn.textContent = "×";
      removeBtn.setAttribute("aria-label", `${text} を削除`);
      removeBtn.disabled = candidates.length <= logic.MIN_CANDIDATES || isSpinning;
      removeBtn.addEventListener("click", () => {
        if (isSpinning) {
          return;
        }
        candidates = logic.removeCandidate(candidates, index);
        render();
      });
      li.appendChild(removeBtn);

      listEl.appendChild(li);
    });
  }

  function renderWheel() {
    const count = candidates.length;
    const cx = WHEEL_SIZE / 2;
    const cy = WHEEL_SIZE / 2;
    const r = WHEEL_SIZE / 2 - 4;
    const sliceAngle = logic.getSliceAngle(count);
    const labelRadius = r * 0.65;
    // ホイール自体が既に回転済み(スピン後)の場合、ラベルの向き補正は
    // 「回転後に画面上でどの角度に見えるか」を基準に計算する必要がある。
    const rotationMod = ((rotation % 360) + 360) % 360;

    let svg = `<svg viewBox="0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}" id="wheel-svg" class="wheel-svg">`;

    candidates.forEach((text, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const path = describeSlice(cx, cy, r, startAngle, endAngle);
      const color = PALETTE[index % PALETTE.length];
      svg += `<path d="${path}" fill="${color}" stroke="#ffffff" stroke-width="2"></path>`;
    });

    candidates.forEach((text, index) => {
      const centerAngle = logic.getSliceCenterAngle(index, count);
      const point = polarToCartesian(cx, cy, labelRadius, centerAngle);
      const labelRotation = getDisplayLabelRotation(centerAngle, rotationMod);
      svg += `<text id="wheel-label-${index}" x="${point.x}" y="${point.y}" text-anchor="middle" dominant-baseline="central" class="wheel-label" style="transform-origin:${point.x}px ${point.y}px; transform: rotate(${labelRotation}deg);">${escapeXml(
        text
      )}</text>`;
    });

    svg += "</svg>";
    wheelEl.innerHTML = svg;

    const svgEl = wheelEl.querySelector("#wheel-svg");
    svgEl.style.transform = `rotate(${rotation}deg)`;

    fitLabelsToSlices(count, sliceAngle, labelRadius, rotationMod);
  }

  // ラベルの向き補正(180度反転の要否)は、実際に画面上でどの角度に表示されるか
  // (区画の中心角 + ホイール自体の現在の回転角)を基準に判定する。
  // ホイールの回転はラベルの親要素(svg)にも及ぶため、この基準を使わないと
  // スピン後に文字の向きが崩れる。
  function getDisplayLabelRotation(centerAngle, rotationMod) {
    return logic.getLabelRotation(centerAngle + rotationMod) - rotationMod;
  }

  // 実際に描画された文字幅を測定し、区画の弦の長さに収まるよう縮小する。
  // 候補数やテキストの長さによらず、ラベルが隣の区画へはみ出さないようにするため。
  function fitLabelsToSlices(count, sliceAngle, labelRadius, rotationMod) {
    const sliceAngleRad = (sliceAngle * Math.PI) / 180;
    const availableWidth = 2 * labelRadius * Math.sin(sliceAngleRad / 2) * 0.85;

    candidates.forEach((text, index) => {
      const centerAngle = logic.getSliceCenterAngle(index, count);
      const labelRotation = getDisplayLabelRotation(centerAngle, rotationMod);
      const textEl = wheelEl.querySelector(`#wheel-label-${index}`);
      const width = textEl.getBBox().width;
      const scale = width > 0 ? Math.min(1, availableWidth / width) : 1;
      textEl.style.transform = `rotate(${labelRotation}deg) scale(${scale})`;
    });
  }

  function showResult(text) {
    resultEl.innerHTML = "";

    const line1 = document.createElement("div");
    line1.className = "result-line1";
    line1.textContent = "🎉 今日のランチは";

    const line2 = document.createElement("div");
    line2.className = "result-line2";
    line2.textContent = `${text}！`;

    resultEl.appendChild(line1);
    resultEl.appendChild(line2);

    resultEl.classList.remove("visible");
    void resultEl.offsetWidth; // アニメーション再生のための強制リフロー
    resultEl.classList.add("visible");
  }

  function handleSpin() {
    if (isSpinning) {
      return;
    }
    isSpinning = true;
    spinButton.disabled = true;
    // スピン中は候補の追加・削除を止める（アニメーション中のホイールが
    // 再描画で破棄され、停止イベントが発火しなくなるのを防ぐため）。
    renderList();
    formEl.querySelector("button[type=submit]").disabled = true;

    const winningIndex = logic.pickRandomIndex(candidates.length);
    rotation = logic.computeSpinRotation(rotation, winningIndex, candidates.length, EXTRA_TURNS);

    const svgEl = wheelEl.querySelector("#wheel-svg");
    svgEl.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.15, 0.85, 0.25, 1)`;
    svgEl.style.transform = `rotate(${rotation}deg)`;

    const handleTransitionEnd = (event) => {
      if (event.propertyName !== "transform") {
        return;
      }
      svgEl.removeEventListener("transitionend", handleTransitionEnd);
      isSpinning = false;
      history = logic.addHistoryEntry(history, candidates[winningIndex], logic.MAX_HISTORY);
      // スピン後の回転角を基準にラベルの向きを再計算するため再描画する。
      // ジオメトリは同一なので見た目の飛びは発生しない。
      render();
      spinButton.disabled = false;
      showResult(candidates[winningIndex]);
    };
    svgEl.addEventListener("transitionend", handleTransitionEnd);
  }

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isSpinning) {
      return;
    }
    const next = logic.addCandidate(candidates, inputEl.value);
    if (next.length !== candidates.length) {
      candidates = next;
      inputEl.value = "";
      render();
    }
  });

  spinButton.addEventListener("click", handleSpin);

  render();
})();
