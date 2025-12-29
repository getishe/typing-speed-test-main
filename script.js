const easybutton = document.querySelector(".easy-button");
const mediumbutton = document.querySelector(".medium-button");
const hardbutton = document.querySelector(".hard-button");

const timemodebutton = document.querySelector(".Time-mode-button");
const passagemodebutton = document.querySelector(".passage-mode-button");

const start = document.querySelector(".start-button");
const reset = document.querySelector(".reset-button");

const textarea = document.querySelector(".text-input");
const teststate = document.querySelectorAll(".test-state");

const passageArea = document.getElementById("passage-area");
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

    gameState.difficulty = button.textContent.toLowerCase();
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
    console.log("Difficulty", gameState.mode);
  });
});

//Add click listener to start button → call a startTest() function

// ========== #3 EVENT LISTENERS - Reset Button ==========
if (reset) {
  reset.addEventListener("click", () => {
    resetTest();
  });
}

// ========== #2 EVENT LISTENERS - Start Button ==========
if (start) {
  start.addEventListener("click", () => {
    startTest();
    textarea.focus();
  });
}
// ========== #2 EVENT LISTENERS - Textarea Input (Map Version) ==========
// textarea.addEventListener("input", () => {
//   map.set("input", textarea.value);
//   console.log(textarea.value);
//   console.log(map.get("input"));
// });

// ========== #2 EVENT LISTENERS - Textarea Input ==========
if (textarea) {
  textarea.addEventListener("input", () => {
    gameState.typedText = textarea.value;
    console.log("Typed text:", gameState.typedText);
  });

  textarea.addEventListener("focus", () => {
    if (!gameState.isTestActive) {
      startTest();
    }
  });
}

// ========== #3 STATE MANAGEMENT - Show/Hide States ==========
function showState(stateName) {
  // Remove active from ALL test-state sections
  document.querySelectorAll(".test-state").forEach((state) => {
    state.classList.remove("active");
  });
  // Add active to ONLY the one we want
  document.getElementById(stateName).classList.remove("active");
}

function startTest() {
  gameState.isTestActive = true;
  textarea.value = ""; // Clear textarea
  // Show typing screen, hide others
  showState("test-active");
  showState("test-setup");
  showState("test-results");
  gameState.typedText = "";
  console.log("Test started", gameState);
  textarea.focus();
  // Show the typing section (adjust ID to match your HTML)
}

// ========== #3 STATE MANAGEMENT - Reset Test ==========
function resetTest() {
  gameState.isTestActive = false;
  // showState("test-setup");
  gameState.typedText = "";
  showState("passage-area");

  textarea.value = ""; // clear textarea
  console.log("Test reset");
}
