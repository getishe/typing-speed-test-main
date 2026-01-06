const start = document.querySelector(".start-button");
const reset = document.querySelector(".reset-button");

// const textarea = document.querySelector("textarea");
const teststate = document.querySelectorAll(".test-state");
const passageDisplay = document.querySelector(".passage-display");
const tryAgain = document.querySelector("#try-button");
const passageArea = document.querySelector("#passage-area");
const difficultySettings = document.querySelectorAll(
  ".difficulty-settings button"
);

const modeSettings = document.querySelectorAll(".mode-settings button");

let timerInterval = null;
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
  timeRemaining: 60,
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
    passageDisplay.focus();
  });
}
if (reset) {
  reset.addEventListener("click", () => {
    resetTest();
  });
}

if (passageDisplay) {
  passageDisplay.addEventListener("input", () => {
    // map.set("input", textarea.value);
    // console.log(textarea.value);
    // console.log(map.get("input"));
    gameState.typedText = passageDisplay.value;
    console.log(gameState.typedText);
  });

  passageDisplay.addEventListener("focus", () => {
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

async function startTest() {
  gameState.isTestActive = true;
  gameState.typedText = "";

  //call fetch function to load passages
  const passages = await loadData();

  // call random selection function with current difficulty
  const selectedPassage = getRandomSelection(passages, gameState.difficulty);

  // store selected passage in gameState state
  gameState.currentPassage = selectedPassage;

  // find the .passage-display element selected passage
  // const passageDisplay = document.querySelector("textarea.passage-display");

  if (passageDisplay) {
    passageDisplay.textContent = selectedPassage || "No passage available.";
    passageDisplay.focus();
  }

  if (passageArea) {
    passageArea.style.display = "none";
  }
  setActiveStates("test-setup", "test-active", "try-button");

  // Show the typing section (adjust ID to match your HTML)

  // Decide which timer to use

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

  if (passageDisplay) {
    passageDisplay.value = ""; // Clear textarea
  }
  setActiveStates("test-results");
  console.log("Test ended", gameState);
  // Show the test complete section (adjust ID to match your HTML)
}

function resetTest() {
  gameState.isTestActive = false;
  gameState.typedText = "";
  clearInterval(timerInterval);
  if (passageDisplay) {
    passageDisplay.value = ""; // Clear textarea
  }

  setActiveStates("test-setup");
  console.log("Test reset", gameState);
  // Show setup section
}

if (tryAgain) {
  tryAgain.addEventListener("click", (event) => {
    startTest();
    event.preventDefault();
  });
}

// loadData data.json
async function loadData() {
  try {
    const response = await fetch("./data.json");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

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
  // Access the correct difficulty array
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
  return randomPassage.text;
}

// Timer mode (60 seconds)
function startTimedMode() {
  if (gameState.timerRunning) return; // Prevent multiple timers

  gameState.timeRemaining = 60;
  gameState.timerRunning = true;
  // Update UI every 1 second

  //update display immediately
  const timeDisplay = document.querySelector(".time");
  if (timeDisplay) {
    timeDisplay.textContent = `1:00`;
  }
  timerInterval = setInterval(() => {
    gameState.timeRemaining--;

    // Update timer display in HTML
    const timeDisplay = document.querySelector(".time");

    if (timeDisplay) {
      const minutes = Math.floor(gameState.timeRemaining / 60);
      const seconds = gameState.timeRemaining % 60;
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
