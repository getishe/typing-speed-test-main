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
  });
});

modeSettings.forEach((buttons) => {
  buttons.addEventListener("click", () => {
    // remove active from all
    modeSettings.forEach((s) => s.classList.remove("active"));
    // add active to the clicked one
    buttons.classList.add("active");
  });
});

//Add click listener to start button → call a startTest() function

function startTest() {
  console.log(" Test statred");
}
if (start) {
  start.addEventListener("click", () => {
    startTest();
    textarea.focus();
  });
}
function resetTest() {
  console.log("restart");
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

// const timemodebutton = document
// function showState(stateName) {
//   document.querySelectorAll('.test-state').forEach(state => {
//     state.classList.remove('active');
//   });
//   document.getElementById(stateName).classList.add('active');
// }

// // Usage:
// showState('test-active');    // Show typing screen
// showState('test-results');   // Show results
// showState('test-setup');     // Back to initial
