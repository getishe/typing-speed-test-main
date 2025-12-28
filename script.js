const easybutton = document.querySelector(".easy-button");
const mediumbutton = document.querySelector(".medium-button");
const hardbutton = document.querySelector(".hard-button");

const timemodebutton = document.querySelector(".Time-mode-button");
const passagemodebutton = document.querySelector(".passage-mode-button");

const start = document.querySelector(".start-button");
const reset = document.querySelector(".reset-button");

const textarea = document.querySelector(".text-input");
const teststate = document.querySelectorAll(".test-state");

const difficultySettings = document.querySelectorAll(
  ".difficulty-settings button"
);

const modeSettings = document.querySelectorAll(".mode-settings button");

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
    console.log("Difficulty", gameState.mode);
  });
});

//Add click listener to start button → call a startTest() function

function startTest() {
  console.log(" Test statred");
}

function resetTest() {
  console.log("restart");
}
if (start) {
  start.addEventListener("click", () => {
    startTest();

    textarea.focus();
  });
}
reset.addEventListener("click", () => {
  resetTest();
});

textarea.addEventListener("input", () => {
  map.set("input", textarea.value);
  console.log(textarea.value);
  console.log(map.get("input"));
});

textarea.addEventListener("focus", () => {
  startTest();
});

const gameState = {
  difficulty: "easy",
  mode: "timed",
  isTestActive: false,
  typedText: "",
};

function showState(stateName) {
  document.querySelectorAll(".test-state").forEach((state) => {
    state.classList.add("active");
  });
  document.getElementById(stateName).classList.add("active");
}

function startTest() {
  gameState.isTestActive = true;
  textarea.value = ""; // Clear textarea
  showState("test-active");
  console.log("Test started");
  textarea.focus();
  // Show the typing section (adjust ID to match your HTML)
}
// // Usage:
// showState('test-active');    // Show typing screen
// showState('test-results');   // Show results
// showState('test-setup');     // Back to initial

function resetTest() {
  gameState.isTestActive = false;
  textarea.value = ""; // Clear textarea
  // Show setup section

  showState("test-setup");
  console.log("Test reset");
}
