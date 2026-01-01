const start = document.querySelector(".start-button");
const reset = document.querySelector(".reset-button");

const textarea = document.querySelector(".text-input");
const teststate = document.querySelectorAll(".test-state");

const tryAgain = document.querySelector("#try-button");
const passageArea = document.querySelector("#passage-area");
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

if (start) {
  start.addEventListener("click", () => {
    startTest();

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

function setActiveStates(...stateNames) {
  document
    .querySelectorAll(".test-state")
    .forEach((s) => s.classList.remove("active"));
  stateNames.forEach((name) => {
    const el = document.getElementById(name);
    if (el) el.classList.add("active");
  });
}
setActiveStates("test-setup");
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
  setActiveStates("test-setup", "test-active", "try-button");

  console.log("Test started");

  // Show the typing section (adjust ID to match your HTML)
}

function endTest() {
  gameState.isTestActive = false;
  if (textarea) {
    textarea.value = ""; // Clear textarea
  }
  setActiveStates("test-results");
  console.log("Test ended", gameState);
  // Show the test complete section (adjust ID to match your HTML)
}

function resetTest() {
  gameState.isTestActive = false;
  gameState.typedText = "";
  if (textarea) {
    textarea.value = ""; // Clear textarea
  }
  console.log("Test reset", gameState);
  setActiveStates("test-setup");

  // Show setup section
}

if (tryAgain) {
  tryAgain.addEventListener("click", () => {
    startTest();
  });
}
