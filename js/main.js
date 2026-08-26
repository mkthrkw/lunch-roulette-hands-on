import {
  DEFAULT_CANDIDATES,
  addCandidate,
  canRemove,
  removeCandidate,
  pickRandomIndex,
  getSegmentAngle,
  computeSpinRotation,
} from "./roulette-logic.js";

const PALETTE = [
  "#ffd3b6",
  "#ffaaa6",
  "#ff8c94",
  "#a0e7e5",
  "#b4f8c8",
  "#fbe7c6",
  "#d5aaff",
  "#aee1e1",
];

const addForm = document.getElementById("add-form");
const addInput = document.getElementById("add-input");
const candidateListEl = document.getElementById("candidate-list");
const wheelEl = document.getElementById("wheel");
const spinButton = document.getElementById("spin-button");
const resultEl = document.getElementById("result");

let candidates = [...DEFAULT_CANDIDATES];
let currentRotation = 0;
let isSpinning = false;

function renderCandidateList() {
  candidateListEl.innerHTML = "";
  const removable = canRemove(candidates);

  candidates.forEach((candidate, index) => {
    const li = document.createElement("li");
    li.className = "candidate-item";

    const label = document.createElement("span");
    label.textContent = candidate;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-button";
    removeButton.textContent = "✕";
    removeButton.disabled = !removable || isSpinning;
    removeButton.addEventListener("click", () => handleRemove(index));

    li.appendChild(label);
    li.appendChild(removeButton);
    candidateListEl.appendChild(li);
  });
}

function renderWheel() {
  const segAngle = getSegmentAngle(candidates.length);

  const stops = candidates.map((_, index) => {
    const color = PALETTE[index % PALETTE.length];
    const start = index * segAngle;
    const end = start + segAngle;
    return `${color} ${start}deg ${end}deg`;
  });
  wheelEl.style.background = `conic-gradient(from 0deg, ${stops.join(", ")})`;

  wheelEl.innerHTML = "";
  candidates.forEach((candidate, index) => {
    const centerAngle = index * segAngle + segAngle / 2;

    const labelWrap = document.createElement("div");
    labelWrap.className = "wheel-label";
    labelWrap.style.transform = `rotate(${centerAngle}deg)`;

    const labelText = document.createElement("span");
    labelText.className = "wheel-label-text";
    labelText.textContent = candidate;
    labelText.style.transform = `rotate(${-centerAngle}deg)`;

    labelWrap.appendChild(labelText);
    wheelEl.appendChild(labelWrap);
  });
}

function render() {
  renderCandidateList();
  renderWheel();
  spinButton.disabled = isSpinning;
  addInput.disabled = isSpinning;
}

function handleRemove(index) {
  if (isSpinning || !canRemove(candidates)) {
    return;
  }
  candidates = removeCandidate(candidates, index);
  render();
}

function handleAddSubmit(event) {
  event.preventDefault();
  if (isSpinning) {
    return;
  }
  const name = addInput.value.trim();
  if (!name) {
    return;
  }
  candidates = addCandidate(candidates, name);
  addInput.value = "";
  render();
}

function showResult(candidate) {
  resultEl.textContent = `🎉 今日のランチは\n${candidate}！`;
  resultEl.classList.remove("show");
  // reflow to restart the animation even if the same result is picked twice in a row
  void resultEl.offsetWidth;
  resultEl.classList.add("show");
}

function handleSpin() {
  if (isSpinning || candidates.length < 2) {
    return;
  }

  const targetIndex = pickRandomIndex(candidates);
  const nextRotation = computeSpinRotation(currentRotation, candidates.length, targetIndex);

  isSpinning = true;
  render();

  const onTransitionEnd = () => {
    wheelEl.removeEventListener("transitionend", onTransitionEnd);
    currentRotation = nextRotation;
    isSpinning = false;
    render();
    showResult(candidates[targetIndex]);
  };
  wheelEl.addEventListener("transitionend", onTransitionEnd);

  wheelEl.style.transform = `rotate(${nextRotation}deg)`;
}

addForm.addEventListener("submit", handleAddSubmit);
spinButton.addEventListener("click", handleSpin);

render();
