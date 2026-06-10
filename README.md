# Frontend Mentor - Typing Speed Test solution

This is a solution to the [Typing Speed Test challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/typing-speed-test). Frontend Mentor challenges help you improve your coding skills by building realistic projects.

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
  - [Useful resources](#useful-resources)
- [Author](#author)
- [Acknowledgments](#acknowledgments)

## Overview

This project is a fully-featured, responsive, and interactive **Typing Speed Test** application. It is designed to evaluate a user's typing speed (WPM) and accuracy in real-time under different settings and conditions. Built as part of a Frontend Mentor challenge, the app provides a highly polished typing interface with immediate visual feedback, progress calculations, and persistent personal high scores to encourage users to continuously improve.

### The challenge

Users should be able to:

- View the optimal layout for the interface depending on their device's screen size
- See hover and focus states for all interactive elements on the page
- Start a test by clicking the start button or by clicking the passage and typing
- Select a difficulty level (Easy, Medium, Hard) for passages of varying complexity from a local `data.json` file
- Switch between "Timed (60s)" mode and "Passage" mode (timer counts up, no limit)
- Restart at any time to get a new random passage from the selected difficulty
- See real-time WPM, accuracy, and time stats while typing
- See visual feedback showing correct characters (green), errors (red/underlined), and cursor position
- Correct mistakes with backspace (original errors still count against accuracy)
- View results showing WPM, accuracy, and characters (correct/incorrect) after completing a test
- See a "Baseline Established!" message on their first test, setting their personal best
- See a "High Score Smashed!" celebration with confetti when beating their personal best
- Have their personal best persist across sessions via localStorage

### Screenshot

![Typing Speed Test Solution Screenshot](./screenshot.jpg)

### Links

- Solution URL: [Frontend Mentor Solution](https://www.frontendmentor.io/solutions/typing-speed-test-solution-built-with-vanilla-js-and-css-custom-properties-2Yc8v_1oF)
- Live Site URL: [Live Deployment on GitHub Pages](https://getishe.github.io/typing-speed-test-main/)

## My process

My development process followed a structured, mobile-first methodology. I began by analyzing the design mockups to map out a semantic HTML structure and CSS variables. Next, I engineered the core typing engine in JavaScript, focusing on handling complex keyboard event listeners, real-time string alignment, and accuracy calculation. Finally, I integrated interactive features like state management, modal popups, local storage, and confetti burst animations to polish the final user experience.

### Built with

- Semantic HTML5 markup
- CSS custom properties
- Flexbox
- CSS Grid
- Mobile-first workflow
- Vanilla JavaScript (ES6+)
- Canvas-Confetti library
- LocalStorage API

### What I learned

During this project, I gained experience in building a real-time text validation and analysis engine. Highlighting letters dynamically while handling edge cases like tab, space, and backspaces required a precise DOM rendering strategy.

I'm proud of the custom WPM calculation function which accounts for character count division to simulate typical word length relative to elapsed seconds:

```js
function calculateWpm(typedText) {
  if (typeof typedText !== "string") {
    return 0;
  }

  if (!gameState.timerStartTime) {
    return 0;
  }
  const elapsedSeconds = Math.floor(
    (Date.now() - gameState.timerStartTime) / 1000,
  );

  if (elapsedSeconds < 1) {
    return 0;
  }

  const charsTyped = typedText.length;
  const words = charsTyped / 5;
  const elapsedMinutes = elapsedSeconds / 60;
  const wpm = words / elapsedMinutes;

  return Math.floor(wpm);
}
```

I also built a rendering function `buildVisualFeedback()` to dynamically assign visual styles to correct/incorrect characters and display the cursor:

```js
function buildVisualFeedback() {
  const visualFeedback = document.querySelector("#visual-feedback");
  if (!visualFeedback) return;

  const liveTyped = userInput.value || "";
  const liveTarget = gameState.currentPassage || "";
  const cursorIndex = liveTyped.length;

  let html = "";

  for (let i = 0; i < liveTarget.length; i++) {
    const targetChar = liveTarget[i];

    if (targetChar === "\n") {
      html += `<br>`;
      continue;
    }

    let classes = [];

    if (i < liveTyped.length) {
      classes.push(gameState.perIndexErrors[i] ? "incorrect" : "correct");
    } else {
      classes.push("untyped");
    }

    if (i === cursorIndex) {
      classes.push("current");
    }

    let displayChar = targetChar;
    if (targetChar === "<") {
      displayChar = "<";
    } else if (targetChar === ">") {
      displayChar = ">";
    } else if (targetChar === "&") {
      displayChar = "&";
    }

    html += `<span class="${classes.join(" ")}" style="white-space: pre-wrap;">${displayChar}</span>`;
  }
  visualFeedback.innerHTML = html;
}
```

On the styling side, defining fluid typography and structured CSS variables allowed for highly responsive states on mobile and desktop layout variations:

```css
:root {
  --neutral-green: hsl(140, 63%, 57%);
  --neutral-red: hsl(354, 63%, 57%);
  --neutral-900: hsl(0, 0%, 7%);
  --neutral-800: hsl(0, 0%, 15%);
  --neutral-700: hsl(240, 2%, 25%);
  --neutral-500: hsl(240, 3%, 46%);

  --font-family: "Sora", sans-serif;
  --font-size-body: 16px;
}
```

### Continued development

In future projects, I plan to focus on:

- **Declarative Frameworks**: Migrating projects like this to React or Svelte to handle complex state transitions and component rendering more cleanly.
- **Enhanced Accessibility**: Standardizing ARIA attributes to better announce ongoing typing accuracy and speed metrics live to screen-reader users.
- **Detailed Key Statistics**: Implementing analytics tracking such as keystroke latency (heatmaps for slowest keys) to help users optimize speed.

### Useful resources

- [MDN Web Docs - KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) - This was essential for finding keys, handling specific behaviors (like Space or Backspace), and managing default browser event preventions.
- [Canvas Confetti GitHub Repo](https://github.com/catdad/canvas-confetti) - A very useful and lightweight package to trigger confetti animations when users beat their personal best.

## Author

- Website - [Getahun Alemayhu](https://github.com/getishe)
- Frontend Mentor - [@getishe](https://www.frontendmentor.io/profile/getishe)

## Acknowledgments

Thanks to Frontend Mentor for providing the clean assets and professional mockups that made developing this typing speed app a rewarding challenge.
