const start = document.querySelector(".start-button");
const reset = document.querySelector(".reset-button");
const passageDisplay = document.querySelector("#passage-display");
const userInput = document.querySelector("#user-input");
const tryAgain = document.querySelector("#try-button");
const passageArea = document.querySelector("#passage-area");
const difficultySettings = document.querySelectorAll(
  ".difficulty-settings button",
);

const modeSettings = document.querySelectorAll(".mode-settings button");
let previousLength = 0;
let timerInterval = null;
const TOTAL_TIME = 60;
// let userInput = null;
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
  passageLines: [],
  currentLineIndex: 0,
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

if (tryAgain) {
  tryAgain.addEventListener("click", () => {
    startTest();
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
  // Clear any existing timer
  if (timerInterval) {
    clearInterval(timerInterval);
    gameState.timerRunning = false;
    timerInterval = null;
  }
  gameState.isTestActive = true;
  gameState.typedText = "";

  document.querySelectorAll(".wpm").forEach((el) => (el.textContent = "0"));

  const passages = await loadData();
  const selectedPassage = getRandomSelection(passages, gameState.difficulty);

  if (!selectedPassage) {
    console.error("No passage available for the selected difficulty.");
    gameState.currentPassage = "";
  } else {
    // ✅ NORMALIZE passage when storing it
    gameState.currentPassage = normalizeText(selectedPassage);
  }
  gameState.currentLineIndex = 0;
  gameState.passageLines = gameState.currentPassage
    ? gameState.currentPassage.split("\n")
    : [];

  if (userInput) {
    userInput.value = "";
    previousLength = 0;
    userInput.focus();
  }

  if (passageArea) {
    passageArea.style.display = "none";
  }
  setActiveStates("test-setup", "test-active", "try-button");

  requestAnimationFrame(() => {
    applyPassageWrapping();
    if (passageDisplay) {
      passageDisplay.value =
        gameState.currentPassage || "No passage available.";
    }
  });

  if (userInput) {
    userInput.focus();
  }

  if (gameState.mode === "timed") {
    startTimedMode();
  } else if (gameState.mode === "passage") {
    startPassageMode();
  }
  console.log("Test started with passage:", gameState.currentPassage); // ✅ Log normalized
  console.log("Passage length:", gameState.currentPassage.length); // ✅ Log length
}

function endTest() {
  gameState.isTestActive = false;
  gameState.timerRunning = false;

  // Clear timer safely
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

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
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameState.timerRunning = false;
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
  if (gameState.timerRunning) {
    console.warn("Timer is already running.");
    return; // Prevent multiple timers
  }

  gameState.timeRemaining = TOTAL_TIME;
  gameState.timerRunning = true;
  gameState.timerStartTime = Date.now();
  // Update UI every 1 second

  //clear any existing interval
  if (timerInterval) {
    clearInterval(timerInterval);
  }
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

    gameState.timeRemaining = Math.max(0, TOTAL_TIME - elapsedSeconds);

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
  }, 100);
}

function startPassageMode() {
  if (gameState.timerRunning) {
    console.warn("Timer is already running.");
    return; // Prevent multiple timers
  }
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameState.timeRemaining = 0;
  gameState.timerStartTime = Date.now();
  gameState.timerRunning = true;

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

  // prevent multiple timers
  // if (timerInterval) {
  //   clearInterval(timerInterval);
  // }
}

// Helper function to normalize text (remove extra spaces and tabs)

// general cleanup for stored passage text (keeps words tight).
function normalizeText(text) {
  if (typeof text !== "string") return "";
  return text.replace(/[ \t]+/g, " ").trim();
}

// compare full passages even if line breaks or multiple spaces differ.
function normalizeForCompare(text) {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

// line‑by‑line comparison while preserving indentation/leading spaces.
function normalizeLine(text) {
  if (typeof text !== "string") return "";
  return text.replace(/[ \t]+/g, " ").trimEnd();
}

// Compare that width to  to decide if it fits.
function getTextareaContentWidth(textarea) {
  if (!textarea) return 0;
  const styles = window.getComputedStyle(textarea);
  const paddingLeft = parseFloat(styles.paddingLeft) || 0;
  const paddingRight = parseFloat(styles.paddingRight) || 0;
  return textarea.clientWidth - paddingLeft - paddingRight;
}

// applies the textarea font → accurate measurement.
function getTextMeasureContext(textarea) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const styles = window.getComputedStyle(textarea);
  ctx.font = [
    styles.fontStyle,
    styles.fontVariant,
    styles.fontWeight,
    styles.fontSize,
    styles.fontFamily,
  ].join(" ");
  return ctx;
}

//  gives actual pixel width of text.
function measureTextWidth(ctx, text) {
  if (!ctx) return 0;
  return ctx.measureText(text).width;
}

// Use's if a word is too wide.
function breakLongWord(ctx, word, maxWidth) {
  const chunks = [];
  let current = "";
  for (const char of word) {
    const candidate = current + char;
    if (measureTextWidth(ctx, candidate) <= maxWidth || current.length === 0) {
      current = candidate;
    } else {
      chunks.push(current);
      current = char;
    }
  }
  if (current.length > 0) {
    chunks.push(current);
  }
  return chunks;
}

function wrapParagraph(ctx, paragraph, maxWidth) {
  if (paragraph.length === 0) return [""];
  const words = paragraph.split(" ").filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line.length ? `${line} ${word}` : word;
    if (measureTextWidth(ctx, candidate) <= maxWidth) {
      line = candidate;
      return;
    }

    if (line.length) {
      lines.push(line);
    }

    if (measureTextWidth(ctx, word) > maxWidth) {
      const chunks = breakLongWord(ctx, word, maxWidth);
      lines.push(...chunks.slice(0, -1));
      line = chunks[chunks.length - 1] || "";
    } else {
      line = word;
    }
  });

  if (line.length || lines.length === 0) {
    lines.push(line);
  }

  return lines;
}

function wrapTextToTextarea(text, textarea) {
  if (!textarea || typeof text !== "string" || text.length === 0) return text;
  const contentWidth = getTextareaContentWidth(textarea);
  if (contentWidth <= 0) return text;
  const ctx = getTextMeasureContext(textarea);
  if (!ctx) return text;

  const paragraphs = text.split("\n");
  const wrappedLines = [];

  paragraphs.forEach((paragraph, index) => {
    const lines = wrapParagraph(ctx, paragraph, contentWidth);
    wrappedLines.push(...lines);
    if (index < paragraphs.length - 1) {
      wrappedLines.push("");
    }
  });

  return wrappedLines.join("\n");
}

function applyPassageWrapping() {
  if (!passageDisplay || !gameState.currentPassage) {
    gameState.passageLines = gameState.currentPassage
      ? gameState.currentPassage.split("\n")
      : [];
    return;
  }

  const wrapped = wrapTextToTextarea(gameState.currentPassage, passageDisplay);
  gameState.currentPassage = wrapped;
  gameState.passageLines = wrapped.split("\n");
}

function moveToNextLine() {
  const lines = userInput.value.split("\n");

  // Prevent duplicate newlines

  if (lines.length - 1 === gameState.currentLineIndex) {
    userInput.value += "\n";
  }

  gameState.currentLineIndex++;

  // Move cursor to end
  userInput.selectionStart = userInput.selectionEnd = userInput.value.length;
}
document.addEventListener("DOMContentLoaded", () => {
  if (userInput) {
    userInput.addEventListener("input", () => {
      const currentLength = userInput.value.length;
      gameState.typedText = userInput.value;

      // Sync scroll position between both textareas
      passageDisplay.scrollTop = userInput.scrollTop;
      passageDisplay.scrollLeft = userInput.scrollLeft;

      if (
        gameState.isTestActive &&
        currentLength > previousLength &&
        (gameState.mode === "timed" || gameState.mode === "passage")
      ) {
        calculateWpm(gameState.typedText);
      }

      if (currentLength < previousLength) {
        // Handle backspace or deletion
        // Optionally, you can recalculate WPM here if desired
        calculateWpm(gameState.typedText);
      }

      previousLength = currentLength;
      console.log(gameState.typedText);

      // Only Normalize user input and passage for comparison
      const normalizedTyped = normalizeForCompare(userInput.value);
      const normalizedPassage = normalizeForCompare(gameState.currentPassage);

      console.log(
        `User typed (normalized): "${normalizedTyped}" (${normalizedTyped.length} chars)`,
      );
      console.log(
        `Passage (normalized): "${normalizedPassage}" (${normalizedPassage.length} chars)`,
      );
      // Compare the normalized texts
      if (
        normalizedTyped.length >= normalizedPassage.length &&
        gameState.isTestActive
      ) {
        endTest();
      }
      // Split into lines and
      const passageLines = gameState.passageLines;
      const typedLines = userInput.value.split("\n");
      // ) Determine current line and compare with the corresponding passage line
      const currentLine = passageLines[gameState.currentLineIndex] || "";
      const typedLine = typedLines[gameState.currentLineIndex] || "";

      // Normalize both lines for comparison
      const expectedLine = normalizeLine(currentLine);
      const typedLineNormalized = normalizeLine(typedLine);

      // Auto-advance when the line is fully matched
      if (
        expectedLine.length > 0 &&
        typedLineNormalized.length >= expectedLine.length
      ) {
        const isExactMatch =
          typedLineNormalized === expectedLine &&
          typedLineNormalized.length === expectedLine.length;
        //  Normalize current line for comparison
        if (typedLine.length > expectedLine.length) {
          const overflow = typedLine.slice(expectedLine.length);
          typedLines[gameState.currentLineIndex] = currentLine;
          if (gameState.currentLineIndex < gameState.passageLines.length - 1) {
            const nextIndex = gameState.currentLineIndex + 1;
            typedLines[nextIndex] = `${overflow}${typedLines[nextIndex] || ""}`;
          }
          userInput.value = typedLines.join("\n");
          gameState.typedText = userInput.value;
        }

        if (isExactMatch || typedLine.length >= expectedLine.length) {
          // Check if current line is last line
          if (gameState.currentLineIndex >= gameState.passageLines.length - 1) {
            endTest();
          } else {
            moveToNextLine();
          }
        }
      }

      // if user has typed spaces equal to the passage,
      // just move to the next line until to reach the end of the passage.
      // Spaces-only skip rule: if user fills the line with spaces exactly equal to expected length, treat line as completed.
      // const isOnlySpaces = typedLine.length > 0 && /^ +$/.test(typedLine);
      // const isSameLengthAsExpected = typedLine.length === expectedLine.length;

      // if (isOnlySpaces && isSameLengthAsExpected) {
      //   if (gameState.currentLineIndex >= gameState.passageLines.length - 1) {
      //     endTest();
      //   } else {
      //     moveToNextLine();
      //   }
      //   return;
      // }

      const hasTab = /\t/.test(typedLine);
      const isOnlySpaces = typedLine.length > 0 && /^ +$/.test(typedLine);
      const hasLettersOrDigits = /[A-Za-z0-9]/.test(typedLine);
      const hasSpace = / /.test(typedLine);
      const isMixedTextAndSpaces = hasLettersOrDigits && hasSpace;

      const isShorter = typedLine.length < expectedLine.length;
      const isExact = typedLine.length === expectedLine.length;
      const isLonger = typedLine.length > expectedLine.length;

      // 1) hard fail
      if (hasTab) {
        endTest();
        return;
      }

      // 2) spaces-only skip rule
      if (isOnlySpaces && isExact) {
        if (gameState.currentLineIndex >= gameState.passageLines.length - 1)
          endTest();
        else moveToNextLine();
        return;
      }

      // 3) optional rule for mixed text + spaces
      // if (isMixedTextAndSpaces && / {2,}/.test(typedLine)) {
      //   if (gameState.currentLineIndex >= gameState.passageLines.length - 1)
      //     endTest();
      //   else moveToNextLine();
      //   return;
      // }
      if (isMixedTextAndSpaces && isExact) {
        if (gameState.currentLineIndex >= gameState.passageLines.length - 1)
          endTest();
        else moveToNextLine();
        return;
      }

      // 4) normal length handling
      if (isShorter) {
        return; // keep typing current line
      }

      // if (isExact || isLonger) {
      //   if (gameState.currentLineIndex >= gameState.passageLines.length - 1)
      //     endTest();
      //   else moveToNextLine();
      //   return;
      // }
    });
  }
  // Set the first difficulty button as active by default
  const firstDifficultyButton = document.querySelector(
    ".difficulty-settings button",
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
    (Date.now() - gameState.timerStartTime) / 1000,
  );

  const displayWpm = document.querySelectorAll(".wpm");

  if (elapsedSeconds < 1) {
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

// Adding a Best Wpm calculation

/**
 * Updates the best words per minute (WPM) score displayed on the page.
 *
 * Retrieves all elements with the "best-wpm" class, finds the highest existing WPM value,
 * and updates all instances if the current WPM exceeds the previous best score.
 *
 * @param {number} currentWpm - The current words per minute score to compare against the best score
 * @returns {void}
 *
 * @example
 * updateBestWpm(95); // Updates all .best-wpm elements to 95 if it's higher than the current best
 */
function updateBestWpm(currentWpm) {
  const bestWpmDisplay = document.querySelectorAll(".best-wpm");
  let bestWpm = 0;
  bestWpmDisplay.forEach((el) => {
    const existingBest = parseInt(el.textContent, 10);
    if (!isNaN(existingBest) && existingBest > bestWpm) {
      bestWpm = existingBest;
    }
  });

  if (currentWpm > bestWpm) {
    bestWpmDisplay.forEach((el) => {
      el.textContent = currentWpm;
    });
  }
}
// needs some changes user typing area

// addind some animations
