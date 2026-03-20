"use strict";

const start = document.querySelector(".start-button");
const reset = document.querySelectorAll(".reset-button");
const passageDisplay = document.querySelector("#passage-display");
const userInput = document.querySelector("#user-input");
const tryAgain = document.querySelector("#try-button");
const passageArea = document.querySelector("#passage-area");
const difficultySettings = document.querySelectorAll(
  ".difficulty-settings button",
);

const modeSettings = document.querySelectorAll(".mode-settings button");

let totalKeysPressed = 0;
let previousLength = 0;
let timerInterval = null;
const TOTAL_TIME = 60;
const personalBest = document.querySelector("#personal-best");
const hasCompletedBaseline = document.querySelector("#baseline-established");
const PERSONAL_BEST_KEY = "personalBest";
const HAS_COMPLETED_KEY = "hasCompletedBaseline";
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
  accuracy: 0, // accuracy as a percentage
  totalErrors: 0,
  normalizedTarget: "", // Store the normalized target text for strict comparison
  normalizedTypedText: "", // Store the normalized user input for comparison
  perIndexErrors: [], // Track indices that were ever wrong
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
  reset.forEach((btn) => {
    btn.addEventListener("click", () => {
      resetTest();
    });
  });
}
if (tryAgain) {
  tryAgain.addEventListener("click", () => {
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
// function setRemoveActiveStates(...stateNames) {
//   document
//     .querySelectorAll(".test-state")
//     .forEach((s) => s.classList.remove("active"));
//   stateNames.forEach((name) => {
//     const el = document.getElementById(name);
//     if (el) el.classList.add("active");
//   });
// }

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
  // document
  //   .querySelectorAll(".wpm")
  //   .forEach((el) => (el.textContent = calculateWpm(gameState.typedText)));
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

  //   After setActiveStates("test-setup", "test-active", "try-button"); changes classes/visibility, requestAnimationFrame(...) runs on the next paint frame, when those updates are applied.
  // Then this block runs:
  requestAnimationFrame(() => {
    applyPassageWrapping();
    if (passageDisplay) {
      passageDisplay.value =
        gameState.currentPassage || "No passage available.";
    }

    gameState.normalizedTarget = gameState.currentPassage
      ? normalizeForCompare(gameState.currentPassage).toLocaleLowerCase()
      : "";
  });

  if (userInput) {
    userInput.focus();
  }

  // Update WPM display in results section
  document.querySelectorAll("#personal-best").forEach((el) => {
    el.textContent = getPersonalBest();
  });

  if (gameState.mode === "timed") {
    startTimedMode();
  } else if (gameState.mode === "passage") {
    startPassageMode();
  }
  console.log("Test started with passage:", gameState.currentPassage); // ✅ Log normalized
  console.log("Passage length:", gameState.currentPassage.length); // ✅ Log length

  //Clear your per-index “ever wrong” structure for a brand-new session.

  //   Store a stable normalized target for this session
  // After selecting passage, normalize once for strict
  // comparison and save it in session state (separate from display-wrapped text).
  // Ensure the stable normalized target is captured after any wrapping/transforming
  // Capture a stable normalized target immediately (don't defer to rAF)
  // Capture a stable normalized target after wrapping has been applied.
  // Use requestAnimationFrame to ensure applyPassageWrapping() (which runs in rAF)
  // has finished updating gameState.currentPassage before we normalize it.

  // Reset input/session text state
  // Clear gameState.typedText and input field.
  // Reset line index and related per-line state.
  gameState.currentLineIndex = 0;
  gameState.typedText = "";
  gameState.totalErrors = 0;
  gameState.normalizedTypedText = "";
  gameState.accuracy = 0;
  totalKeysPressed = 0;
  gameState.perIndexErrors = [];
  document
    .querySelectorAll(".accuracy")
    .forEach((el) => (el.textContent = "0%"));
}

function endTest() {
  gameState.isTestActive = false;
  gameState.timerRunning = false;

  // Clear timer safely
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // if (userInput) {
  //   userInput.value = "";
  // }

  const finalWpm = calculateWpm(gameState.typedText);
  const previousBest = getPersonalBest();

  // Update WPM display in results section
  document.querySelectorAll(".wpm").forEach((el) => {
    el.textContent = finalWpm;
  });

  // Check if this is first test (baseline) or new high score
  if (previousBest === 0) {
    // First test - Baseline Established
    savePersonalBest(finalWpm);
    // document.getElementById("personal-best").textContent = finalWpm;
    document.querySelectorAll("#personal-best").forEach((el) => {
      el.textContent = finalWpm;
    });
    displayResultMessage(finalWpm, 0);
    setActiveStates("baseline-established");
  } else if (finalWpm > previousBest) {
    // New high score - High Score Smashed
    savePersonalBest(finalWpm);
    // document.getElementById("personal-best").textContent = finalWpm;
    document.querySelectorAll("#personal-best").forEach((el) => {
      el.textContent = finalWpm;
    });
    displayResultMessage(finalWpm, previousBest);
    setActiveStates("high-score-smashed");
  } else {
    // Normal completion
    displayResultMessage(finalWpm, previousBest);
    setActiveStates("test-results");
  }

  console.log("Test ended", gameState);

  // Snapshot final metrics (same model as live input)
  const liveTyped = gameState.typedText;
  const liveTarget = gameState.currentPassage;
  const liveDenominator = liveTyped.length;

  if (gameState.perIndexErrors.length < liveDenominator) {
    gameState.perIndexErrors.length = liveDenominator;
  }
  for (let i = 0; i < liveDenominator; i++) {
    const typedChar = liveTyped[i] || "";
    const targetChar = liveTarget[i] || "";
    if (typedChar !== targetChar) {
      gameState.perIndexErrors[i] = true; // never reset to false
    }
    if (targetChar === " ") {
      gameState.perIndexErrors[i] = true;
    }
  }

  const incorrectCount = gameState.perIndexErrors
    .slice(0, liveDenominator)
    .filter(Boolean).length;
  gameState.totalErrors = incorrectCount;
  const correctChars = liveDenominator - incorrectCount;
  gameState.accuracy =
    liveDenominator === 0
      ? 0
      : Math.round((liveCorrect / liveDenominator) * 100);

  // Update final result UI
  document.querySelectorAll(".result-Errors").forEach((e) => {
    e.textContent = `${correctChars} / ${incorrectCount} chars`;
  });

  document.querySelectorAll(".accuracy").forEach((el) => {
    el.textContent = `${gameState.accuracy}%`;
  });
}

function resetTest() {
  gameState.isTestActive = false;
  gameState.typedText = "";
  gameState.timeRemaining = 0;
  previousLength = 0;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameState.timerRunning = false;
  // gameState.currentLineIndex = 0;
  // clear all strict/session state related to typing and errors
  gameState.totalErrors = 0;
  gameState.accuracy = 0;
  gameState.normalizedTypedText = "";
  gameState.normalizedTarget = "";
  totalKeysPressed = 0;
  gameState.perIndexErrors = [];
  if (userInput) {
    userInput.value = "";
  }
  calculateWpm(""); // Reset WPM display to 0
  gameState.timerStartTime = null;
  // gameState.startTime = null;
  const timeDisplay = document.querySelector(".time");
  if (timeDisplay) {
    timeDisplay.textContent = `0:00`;
  }

  const wpmDisplays = document.querySelectorAll(".wpm");
  wpmDisplays.forEach((el) => (el.textContent = "0"));

  const accuracyDisplays = document.querySelectorAll(".accuracy");
  accuracyDisplays.forEach((el) => (el.textContent = "0%"));

  const personalBest = getPersonalBest();
  document.querySelectorAll("#personal-best").forEach((el) => {
    el.textContent = personalBest;
  });

  if (passageArea) {
    passageArea.style.display = "";
  }
  setActiveStates("test-setup", "passage-area");
  console.log("Test reset", gameState);

  document.querySelectorAll(".result-Errors").forEach((e) => {
    e.textContent = `0 / 0 chars`;
  });
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
  //  iterates e, x, t, r, a, o, r, d, i, n, a, r, y
  for (const char of word) {
    // candidate = "" + "e" = "e"
    const candidate = current + char;
    if (measureTextWidth(ctx, candidate) <= maxWidth || current.length === 0) {
      // if it fits, add char to current chunk
      current = candidate;
    } else {
      chunks.push(current);
      // start new chunk with current char
      current = char;
    }
  }
  // push any remaining text in current chunk
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
    // candidate = "" + "e" = "e" if line is empty, candidate is just the word, otherwise it's line + space + word
    const candidate = line.length ? `${line} ${word}` : word;
    // check if adding the word exceeds the max width
    if (measureTextWidth(ctx, candidate) <= maxWidth) {
      line = candidate;
      return;
    }
    // If the current line has content, push it before starting a new line
    if (line.length) {
      lines.push(line);
    }
    // If the word itself is too wide, break it into chunks
    if (measureTextWidth(ctx, word) > maxWidth) {
      // If the word is too long, break it into chunks
      const chunks = breakLongWord(ctx, word, maxWidth);
      // Push all chunks except the last one as separate lines
      lines.push(...chunks.slice(0, -1));
      // Start the new line with the last chunk
      line = chunks[chunks.length - 1] || "";
    } else {
      // Start a new line with the current word if it fits on its own
      line = word;
    }
  });

  // Push any remaining line content if it exists or
  // if there were no lines at all (to handle empty paragraphs)
  if (line.length || lines.length === 0) {
    lines.push(line);
  }

  return lines;
}

// Main function to wrap text for the textarea
function wrapTextToTextarea(text, textarea) {
  if (!textarea || typeof text !== "string" || text.length === 0) return text;
  const contentWidth = getTextareaContentWidth(textarea);
  if (contentWidth <= 0) return text;
  const ctx = getTextMeasureContext(textarea);
  if (!ctx) return text;

  // Split the text into paragraphs and wrap each one separately to preserve line breaks
  const paragraphs = text.split("\n");
  const wrappedLines = [];

  // Wrap each paragraph and add a line break between them
  // loop through each paragraph, wrap it, and add the wrapped lines to the result.
  // If it's not the last paragraph,
  // add an empty line to preserve the original line break.
  paragraphs.forEach((paragraph, index) => {
    // Wrap the current paragraph and add the wrapped lines to the result
    const lines = wrapParagraph(ctx, paragraph, contentWidth);
    // Add the wrapped lines to the result array
    wrappedLines.push(...lines);
    //     paragraphs.length = 4
    // paragraphs.length - 1 = 3
    // Check: 2 < 3 -> true

    // paragraphs.length = 3
    // paragraphs.length - 1 = 2
    // Check: 2 < 2 -> false (this is the last paragraph)
    if (index < paragraphs.length - 1) {
      // Add an empty line to preserve the original line break between paragraphs
      wrappedLines.push("");
    }
  });
  // Join all the wrapped lines into a single string with line breaks and return it
  return wrappedLines.join("\n");
}

function applyPassageWrapping() {
  if (!passageDisplay || !gameState.currentPassage) {
    gameState.passageLines = gameState.currentPassage
      ? gameState.currentPassage.split("\n")
      : [];
    console.log(
      "passageLines length:",
      gameState.passageLines.length,
      gameState.passageLines,
    );
    return;
  }

  const wrapped = wrapTextToTextarea(gameState.currentPassage, passageDisplay);
  gameState.currentPassage = wrapped;
  gameState.passageLines = wrapped.split("\n");
}

function moveToNextLine() {
  const lines = userInput.value.split("\n");

  // Prevent duplicate newlines
  // When user types the last character of the current line,
  // we want to move to the next line.
  if (lines.length - 1 === gameState.currentLineIndex) {
    // console.log("Moving to next line");
    userInput.value += "\n";
  }
  // Increment the current line index to move to the next line
  gameState.currentLineIndex++;

  // Move cursor to end
  userInput.selectionStart = userInput.selectionEnd = userInput.value.length;
}
document.addEventListener("DOMContentLoaded", () => {
  // ✅ INITIALIZE LOCALSTORAGE ON PAGE LOAD
  const storedBest = localStorage.getItem(PERSONAL_BEST_KEY);
  if (storedBest) {
    document.getElementById("personal-best").textContent = storedBest;
  } else {
    localStorage.setItem(PERSONAL_BEST_KEY, "0");
    document.getElementById("personal-best").textContent = "0";
  }

  // ✅ NOW set up the input listener
  if (userInput) {
    userInput.addEventListener("input", () => {
      const currentLength = userInput.value.length;
      gameState.typedText = userInput.value;

      gameState.normalizedTypedText = normalizeForCompare(
        userInput.value,
      ).toLocaleLowerCase();

      // Live scoring uses raw input to preserve line breaks.
      const liveTyped = userInput.value;
      const liveTarget = gameState.currentPassage;
      const liveDenominator = liveTyped.length;

      if (gameState.perIndexErrors.length < liveDenominator) {
        gameState.perIndexErrors.length = liveDenominator;
      }
      for (let i = 0; i < liveDenominator; i++) {
        const typedChar = liveTyped[i] || "";
        const targetChar = liveTarget[i] || "";
        if (typedChar !== targetChar) {
          gameState.perIndexErrors[i] = true; // never reset to false
        }
        // Mark space characters as errors to prevent padding-based exploits
        if (typedchar === " " || ) {
          gameState.perIndexErrors[i] = true;
        }
      }

      const incorrectCount = gameState.perIndexErrors
        .slice(0, liveDenominator)
        .filter(Boolean).length;
      gameState.totalErrors = incorrectCount;
      const correctChars = liveDenominator - incorrectCount;

      gameState.accuracy =
        liveDenominator === 0
          ? 0
          : Math.round((correctChars / liveDenominator) * 100);
      document.querySelectorAll(".accuracy").forEach((el) => {
        el.textContent = `${gameState.accuracy}%`; // Display the calculated accuracy percentage
      });
      document.querySelectorAll(".result-Errors").forEach((e) => {
        e.textContent = `${correctChars} / ${incorrectCount} chars`;
      });

      document.querySelectorAll(".wpm").forEach((el) => {
        el.textContent = calculateWpm(gameState.typedText);
      });

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
      // document
      //   .querySelectorAll(".wpm")
      //   .forEach((el) => (el.textContent = calculateWpm(gameState.typedText)));
      // document
      //   .querySelectorAll(".accuracy")
      //   .forEach(
      //     (e) => (e.textContent = accuracyCalculate(gameState.typedText)),
      //   );
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
      }

      const hasTab = /\t/.test(typedLine);
      const isOnlySpaces = typedLine.length > 0 && /^ +$/.test(typedLine);
      const hasLettersOrDigits = /[A-Za-z0-9]/.test(typedLine);
      const hasSpace = / /.test(typedLine);
      const isMixedTextAndSpaces = hasLettersOrDigits && hasSpace;

      const isShorter = typedLine.length < expectedLine.length;
      const isExact = typedLine.length === expectedLine.length;
      const isLonger = typedLine.length > expectedLine.length;
      const isLineLengthReached = typedLine.length === expectedLine.length; // strict
      const isLineExact = typedLineNormalized === expectedLine;
      const isFullPassageTyped =
        gameState.isTestActive && normalizedTyped === normalizedPassage;

      const typedAllSpaces =
        userInput.value.length > 0 && /^[ ]+$/.test(userInput.value);
      const fullLengthMatch =
        userInput.value.length === gameState.currentPassage.length;

      const finishOrAdvance = ({ allowEndWithoutExact = false } = {}) => {
        const isLastLine =
          gameState.currentLineIndex >= gameState.passageLines.length - 1;

        if (isLastLine) {
          if (isFullPassageTyped || allowEndWithoutExact) endTest();
          return;
        }

        moveToNextLine();
      };

      if (isLineExact) {
        finishOrAdvance();
        return;
      }

      if (isOnlySpaces && isLineLengthReached) {
        finishOrAdvance({ allowEndWithoutExact: true });
        return;
      }

      if (isMixedTextAndSpaces && isLineLengthReached) {
        finishOrAdvance({ allowEndWithoutExact: true });
        return;
      }

      // Keep one strict error metric source
    });

    // userInput.addEventListener("keydown", (e) => {
    //   if (!gameState.isTestActive) return;

    //   const isCountedKey =
    //     e.key.length === 1 || // Regular character keys
    //     e.key === "Backspace" ||
    //     e.key === "Enter" ||
    //     e.key === "Tab";

    //   if (isCountedKey) totalKeysPressed++;
    // });

    // userInput.addEventListener("keydown", (e) => {
    //   totalKeysPressed++;

    //   //Compare current Compare current key to the expected character in the source
    //   if (gameState.isTestActive && gameState.currentPassage !== e.key) {
    //     totalErrors++;
    //   }
    // });
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
  if (typeof typedText !== "string") {
    return 0; // Handle non-string input gracefully
  }

  if (!gameState.timerStartTime) {
    return 0; // Timer guard If gameState.timerStartTime is missing, return 0.
  }
  const elapsedSeconds = Math.floor(
    (Date.now() - gameState.timerStartTime) / 1000,
  );

  if (elapsedSeconds < 1) {
    // document.querySelectorAll(".wpm").forEach((el) => {
    //   el.textContent = "0";
    // });
    return 0;
  }

  const charsTyped = typedText.length;
  const words = charsTyped / 5;
  const elapsedMinutes = elapsedSeconds / 60;
  const wpm = words / elapsedMinutes;

  // displayWpm.forEach((element) => {
  //   element.textContent = Math.floor(wpm);
  // });

  return Math.floor(wpm);
}

// Adding a Best Wpm calculation

/**
 * Updates the best words per minute (WPM) score displayed on the page.
 *
 * Retrieves all elements with the "best-wpm" class, finds the highest existing WPM value,
 * and updates all instances if the current WPM exceeds the previous best score.
 *
 * current words per minute score to compare against the best score
 
 * updateBestWpm(95); // Updates all .best-wpm elements to 95 if it's higher than the current best
 */
// update
// Create Helper Functions
// function getPersonalBest() {
//   const personalBest = localStorage.getItem(PERSONAL_BEST_KEY);
//   if (personalBest === null) {
//     return 0;
//   }
//   return parseInt(personalBest, 10);
// }

// what if localStorage is disabled? Add try/catch blocks
function getPersonalBest() {
  try {
    const personalBest = localStorage.getItem(PERSONAL_BEST_KEY);
    return personalBest === null ? 0 : parseInt(personalBest, 10);
  } catch (error) {
    console.warn("Error accessing localStorage:", error);
    return 0;
  }
}

// localStorage.removeItem(PERSONAL_BEST_KEY); // Clear personal best for testing purposes

// function savePersonalBest(wpm) {
//   localStorage.setItem(PERSONAL_BEST_KEY, wpm.toString());
// }

// what if localStorage is disabled? Add try/catch blocks

function savePersonalBest(wpm) {
  try {
    localStorage.setItem(PERSONAL_BEST_KEY, wpm.toString());
  } catch (error) {
    console.warn("Error saving to localStorage:", error);
  }
}

function displayResultMessage(currentWpm, previousBest) {
  let resultSection;
  let title, message;

  if (previousBest === 0) {
    // First test - Baseline Established
    resultSection = document.querySelector("#baseline-established");
    title = "Baseline Established!";
    message =
      "Your baseline WPM has been set. Try again to beat your personal best!";
  } else if (currentWpm > previousBest) {
    // New high score
    resultSection = document.querySelector("#high-score-smashed");
    title = "High Score Smashed!";
    message =
      "Incredible work! You've beaten your personal best. Can you do it again?";
    // confetti({
    //   particleCount: 150,
    //   spread: 100,
    //   angle: 90,
    // });

    // setTimeout(() => {
    //   confetti({
    //     particleCount: 150,
    //     spread: 100,
    //     angle: 90,
    //   });
    // }, 300);
  } else {
    // Normal completion
    resultSection = document.querySelector("#test-results");
    title = "Test Complete!";
    message = "Solid run. Keep pushing to beat your high score.";
  }

  // Update the h2 and p within the selected section
  if (resultSection) {
    const resultTitle = resultSection.querySelector(".test-complete h2");
    const resultMessage = resultSection.querySelector(".test-complete p");
    if (resultTitle) resultTitle.textContent = title;
    if (resultMessage) resultMessage.textContent = message;
  }
}

// Implement accuracy calculation** - Count correct vs incorrect characters
// Accuracy Calculation
// function accuracyCalculate(typedText) {
//   const normalizedTyped = normalizeForCompare(typedText).toLocaleLowerCase();
//   const normalizedPassage = normalizeForCompare(
//     gameState.currentPassage,
//   ).toLocaleLowerCase();

//   // mode does penalize extra and missing.
//   const denominator = Math.max(
//     normalizedTyped.length,
//     normalizedPassage.length,
//   );
//   //Confirm denominator rule: passage length vs max(passage, typed).
//   if (denominator === 0) {
//     return 0; // Guard against divide-by-zero if both are empty
//   }

//   let correct = 0;
// Loop through each character up to the length of the longer string
// for (let i = 0; i < denominator; i++) {
//   const typedChar = normalizedTyped[i] || ""; // If user typed fewer chars, treat missing chars as incorrect
//   const passageChar = normalizedPassage[i] || ""; // If passage has fewer chars, treat missing chars as incorrect

//   if (typedChar === passageChar) {
//     correct++;
//   }

// console.log(
//   `Char ${i}: Incorrect (typed: "missing", expected: "${passageChar}")`,
// );
// }

// Account for missing and extra characters based on the chosen denominator rule
// If penalizing both missing and extra chars, errors already accounts for all discrepancies.
// If penalizing only what the user typed, we can infer incorrect = denominator - correct.

// more to do with this function
//   return denominator > 0 ? Math.round((correct / denominator) * 100) : 0;
// }

// Based on Implement accuracy calculation** — Count correct vs. incorrect characters,
// Could you review my code and, without giving me the actual code,
// guide me on how to fix which code  incorrect the logic

// Keep your normalization (normalizedTyped, normalizedPassage) and lowercasing — don’t change that.

// Choose denominator:
// Penalize both missing and extra chars → denominator = max(normalizedTyped.length, normalizedPassage.length)
// Penalize only what the user typed → denominator = normalizedTyped.length

// Set loopLength = denominator and iterate i from 0 to loopLength-1 (inclusive start, exclusive end).

// For each i read typedChar = normalizedTyped[i] || "" and expectedChar = normalizedPassage[i] || "" and compare:
// if equal → increment correctCount
// else → increment incorrectCount (or infer incorrect = denominator - correct after loop)

// Guard divide-by-zero: if denominator === 0 return 0.

// Compute accuracy = (correctCount / denominator) * 100, round as desired, and return that value.

// Optional: decide case sensitivity/whitespace policy and add tests for typed shorter, typed longer, exact match.
