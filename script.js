const start = document.querySelector(".start-button");
const reset = document.querySelector(".reset-button");
const passageDisplay = document.querySelector("#passage-display");
const tryAgain = document.querySelector("#try-button");
const passageArea = document.querySelector("#passage-area");
const difficultySettings = document.querySelectorAll(
  ".difficulty-settings button"
);

const modeSettings = document.querySelectorAll(".mode-settings button");
let previousLength = 0;
let timerInterval = null;
const TOTAL_TIME = 60;
let userInput = null;
const gameState = {
  difficulty: "easy",
  mode: "timed",
  isTestActive: false,
  typedText: "",
  currentPassage: "", // Added to store the current passage
  passages: {
    easy: [],
    medium: [],
    hard: [],
  },
  timeRemaining: TOTAL_TIME,
  timeElapsed: 0,
  timerStartTime: null,
  timerRunning: false,
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
    // passageDisplay.focus();
  });
}
if (reset) {
  reset.addEventListener("click", () => {
    resetTest();
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

// when the reset button is clicked, reset the game state and clear the passage display
function setRemoveActiveStates(...stateNames) {
  document
    .querySelectorAll(".test-state")
    .forEach((s) => s.classList.remove("active"));
  stateNames.forEach((name) => {
    const el = document.getElementById(name);
    if (el) el.classList.remove("active");
  });
}

async function startTest() {
  gameState.isTestActive = true;
  gameState.typedText = "";

  document.querySelectorAll(".wpm").forEach((el) => (el.textContent = "0"));

  const passages = await loadData();
  const selectedPassage = getRandomSelection(passages, gameState.difficulty);
  gameState.currentPassage = selectedPassage;

  if (passageDisplay) {
    passageDisplay.value = selectedPassage || "No passage available.";
  }

  if (userInput) {
    userInput.value = "";
    previousLength = 0;
    userInput.focus();
  }

  if (passageArea) {
    passageArea.style.display = "none";
  }
  setActiveStates("test-setup", "test-active", "try-button");

  // focus on use input
  if (userInput) {
    userInput.focus();
  }
  
  if (gameState.mode === "timed") {
    startTimedMode();
  } else if (gameState.mode === "passage") {
    startPassageMode();
  }
  console.log("Test started with passage:", selectedPassage);
}

function endTest() {
  gameState.isTestActive = false;
  clearInterval(timerInterval);

  if (userInput) {
    userInput.value = "";
  }
  setActiveStates("test-results");
  calculateWpm(gameState.typedText);
  console.log("Test ended", gameState);
}

function resetTest() {
  gameState.isTestActive = false;
  gameState.typedText = "";
  previousLength = 0;
  clearInterval(timerInterval);
  if (userInput) {
    userInput.value = "";
  }
  setActiveStates("test-setup", "passage-area");
  console.log("Test reset", gameState);
}

// loadData data.json
async function loadData() {
  try {
    const response = await fetch("./data.json");

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed Error fetching data:", error);
    return null;
  } finally {
    console.log("Fetch attempt finished.");
  }
}

function getRandomSelection(passages, difficulty) {
  if (!passages || !passages[difficulty]) {
    console.error("Invalid passages data or difficulty level.");
    return null;
  }
  // Access the correct difficulty area
  const difficultyArea = passages[difficulty];
  //safety check
  if (!difficultyArea || difficultyArea.length === 0) {
    return null;
  }
  //  Pick random index
  const index = Math.floor(Math.random() * difficultyArea.length);
  // Get random passage object
  const randomPassage = difficultyArea[index];
  // Return passage text
  // Handle multiple possible data formats
  if (typeof randomPassage === "string") {
    return randomPassage; // If it's just a string
  }
  return randomPassage.text || randomPassage.passage || null; // If it's an object
}

// Timer mode (60 seconds)
function startTimedMode() {
  if (gameState.timerRunning) return; // Prevent multiple timers

  gameState.timeRemaining = TOTAL_TIME;
  gameState.timerRunning = true;
  gameState.timerStartTime = Date.now();
  // Update UI every 1 second

  //update display immediately
  const timeDisplay = document.querySelector(".time");
  if (timeDisplay) {
    timeDisplay.textContent = `1:00`;
  }
  timerInterval = setInterval(() => {
    // gameState.timeRemaining--;

    // Update timer display in HTML
    // const timeDisplay = document.querySelector(".time");
    const elapsed = Date.now() - gameState.timerStartTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);

    gameState.timeRemaining = TOTAL_TIME - elapsedSeconds;

    // Convert timeRemaining to minutes and seconds
    if (timeDisplay) {
      const minutes = Math.max(0, Math.floor(gameState.timeRemaining / 60));
      const seconds = Math.max(0, gameState.timeRemaining % 60);

      timeDisplay.textContent = `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    // Stop when time runs out
    if (gameState.timeRemaining <= 0) {
      clearInterval(timerInterval);
      gameState.timerRunning = false;
      timerInterval = null;
      endTest();
    }
  }, 1000);
}

function startPassageMode() {
  gameState.timeRemaining = 0;
  gameState.timerStartTime = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - gameState.timerStartTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);

    gameState.timeRemaining = elapsedSeconds;

    const timeDisplay = document.querySelector(".time");
    if (timeDisplay) {
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      timeDisplay.textContent = `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  userInput = document.querySelector("#user-input");

  if (userInput) {
    userInput.addEventListener("input", () => {
      const currentLength = userInput.value.length;
      gameState.typedText = userInput.value;

      // Sync scroll position between both textareas
      passageDisplay.scrollTop = userInput.scrollTop;
      passageDisplay.scrollLeft = userInput.scrollLeft;

      if (gameState.isTestActive && currentLength > previousLength) {
        calculateWpm(gameState.typedText);
      }

      previousLength = currentLength;
      console.log(gameState.typedText);
    });

    userInput.addEventListener("focus", () => {
      if (!gameState.isTestActive) {
        startTest();
      }
    });
  }
  // Set the first difficulty button as active by default
  const firstDifficultyButton = document.querySelector(
    ".difficulty-settings button"
  );
  if (firstDifficultyButton) {
    firstDifficultyButton.classList.add("active");
    gameState.difficulty =
      firstDifficultyButton.textContent.toLocaleLowerCase();
  }

  // Set the first mode button as active by default
  const firstModeButton = document.querySelector(".mode-settings button");
  if (firstModeButton) {
    firstModeButton.classList.add("active");
    gameState.mode = firstModeButton.textContent.includes("Timed")
      ? "timed"
      : "passage";
  }
});

// Simplified WPM calculation
function calculateWpm(typedText) {
  const elapsedSeconds = Math.floor(
    (Date.now() - gameState.timerStartTime) / 1000
  );

  const displayWpm = document.querySelectorAll(".wpm");

  if (elapsedSeconds < 3) {
    displayWpm.forEach((el) => {
      el.textContent = "0";
    });
    return 0;
  }

  const charsTyped = typedText.length;
  const words = charsTyped / 5;
  const elapsedMinutes = elapsedSeconds / 60;
  const wpm = words / elapsedMinutes;

  displayWpm.forEach((element) => {
    element.textContent = Math.floor(wpm);
  });

  return Math.floor(wpm);
}
