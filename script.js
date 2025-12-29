const start = document.querySelector(".start-button");
const reset = document.querySelector(".reset-button");

const textarea = document.querySelector(".text-input");
const teststate = document.querySelectorAll(".test-state");

const passageArea = document.querySelector(".passage-area");
const difficultySettings = document.querySelectorAll(
  ".difficulty-settings button"
);

const modeSettings = document.querySelectorAll(".mode-settings button");

const gameState = {
  difficulty: "easy",
  mode: "timed",
  isTestActive: false,
  typedText: "",
};

difficultySettings.forEach((button) => {
  button.addEventListener("click", () => {
    // remove active from all
    difficultySettings.forEach((d) => d.classList.remove("active"));
    // add active to the clicked one
    button.classList.add("active");

    gameState.difficulty = button.textContent.toLocaleLowerCase();
    console.log("Difficulty", gameState.difficulty);
  });
});

modeSettings.forEach((buttons) => {
  buttons.addEventListener("click", () => {
    // remove active from all
    modeSettings.forEach((s) => s.classList.remove("active"));
    // add active to the clicked one
    buttons.classList.add("active");
    gameState.mode = buttons.textContent.includes("Timed")
      ? "timed"
      : "passage";
    console.log("Mode", gameState.mode);
  });
});

//Add click listener to start button → call a startTest() function

function startTest() {
  console.log("Test started");
}

function resetTest() {
  console.log("restart");
}
if (start) {
  start.addEventListener("click", () => {
    startTest();
    // passageArea.remove();
    textarea.focus();
  });
}
if (reset) {
  reset.addEventListener("click", () => {
    resetTest();
  });
}

if (textarea) {
  textarea.addEventListener("input", () => {
    // map.set("input", textarea.value);
    // console.log(textarea.value);
    // console.log(map.get("input"));
    gameState.typedText = textarea.value;
    console.log(gameState.typedText);
  });

  textarea.addEventListener("focus", () => {
    if (!gameState.isTestActive) {
      startTest();
    }
  });
}

function showState(stateName) {
  document.querySelectorAll(".test-state").forEach((state) => {
    state.classList.add("active");
  });
  document.getElementById(stateName).classList.add("active");
}

function removeState(stateName) {
  document.querySelectorAll(".test-state").forEach((state) => {
    state.classList.add("active");
  });
  document.getElementById(stateName).classList.remove("active");
}

function clearStates() {
  gameState.isTestActive = false;
  document.querySelectorAll(".test-state").forEach((state) => {
    state.classList.remove("active");
  });
}

function startTest() {
  gameState.isTestActive = true;
  gameState.typedText = "";
  if (textarea) {
    textarea.value = ""; // Clear textarea
    textarea.focus();
  }
  if (passageArea) {
    passageArea.style.display = "none";
  }
  showState("test-active");
  removeState("test-results");
  console.log("Test started");

  if (passageArea) {
    passageArea.style.display = "none";
  }
  // Show the typing section (adjust ID to match your HTML)
}
// // Usage:
// showState('test-active');    // Show typing screen
// showState('test-results');   // Show results
// showState('test-setup');     // Back to initial

function resetTest() {
  gameState.isTestActive = false;
  gameState.typedText = "";
  if (textarea) {
    textarea.value = ""; // Clear textarea
  }
  // Show setup section
  if (passageArea) {
    passageArea.style.display = "block";
  }
  showState("test-setup");
  console.log("Test reset", gameState);
}
