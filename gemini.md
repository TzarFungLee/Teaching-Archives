# Gemini Workspace Instructions & Memory

This file serves as persistent memory and instructions for Gemini (Antigravity) when working on the **LTF Teaching Archives** project.

---

## 🎯 Project Overview
* **Name**: LTF Teaching Archives
* **Tech Stack**: Jekyll (Ruby), HTML5, Vanilla CSS, Vanilla JavaScript, Lunr.js (client-side search).
* **Purpose**: A curated resource hub storing teaching materials, grammar lessons, reading/listening/writing guides, and interactive quizzes for students.

---

## 🛠️ Key Coding & Design Guidelines

### 1. Interactivity & Quizzes
* All quiz HTML files in `/Quizzes` use embedded script tags for interactive grading, feedback, and scoring.
* **CRITICAL**: When modifying quiz files, preserve the original interactive script logic unless explicitly asked to upgrade the quiz engine.

### 2. Design & Aesthetics
* Maintain a premium, modern, cohesive look. Use glassmorphic elements (`backdrop-filter`), CSS variables for themes (defined in `/assets/css/main.css`), clean typography, and smooth transitions.
* Ensure cards, grid items, and lists are responsive, center-balanced, and highly legible.

### 3. File Organization
* **Grammar lessons** go under `/Grammar` as raw HTML pages.
* **Interactive quizzes** go under `/Quizzes` as `*- Quiz.html`.
* **Reading/Listening/Writing/Speaking resources** go under their respective directories.
* Do not place any temporary build files or scratchpads in production folders.

### 4. Interactive Songs & Synchronized Lyrics Player
When implementing or modifying interactive teaching songs with synchronized lyrics, follow these strict rules:
* **Visual Styling:**
  - Split the view into a responsive split grid (e.g. Left column: Slides card, Right column: Song card).
  - Use a hidden glassmorphic drawer (`songContainer`) that toggles visibility on click.
  - Wrap the lyrics block in a dark, semi-transparent container with a scrollbar (`max-height`, `overflow-y: auto`, `scroll-behavior: smooth`).
  - **Lyric Lines & Opacity**: Inactive lyric lines fade to muted text (`color: rgba(...)`), but the `<strong>` grammar structures remain partially visible (`opacity: 0.65` or keeping a translucent color: Cyan for If-clauses, Yellow/Orange for Result-clauses) to allow structural pre-scanning. Active lines display full-brightness white text (`#ffffff`).
  - **Grammar Targets (`<strong>`)**: Bolding (`<strong>`) must be the sole formatting marker for target grammar structures. Do not use blocky background highlights or bubble containers.
  - **Active Grammar Animation**: When active, the `<strong>` targets must:
    - Scale up slightly (`1.08x` scale transform) to catch the eye.
    - Glow with a strong multi-layered neon text-shadow matching the clause theme (Cyan or Yellow/Orange).
    - Display an expanding, glowing horizontal underline (`::after` pseudo-element with `transform: scaleX(...)` transition from center outwards).
  - Delete all bracketed metadata comments `[]` and parenthesized instructions `()` from public lyric lines.
* **Lyric Timing & Sync:**
  - Wrap each lyric line in a span featuring custom `data-start` and `data-end` attributes representing the starting/ending positions.
  - **CRITICAL:** Always specify timestamps in **raw seconds** (e.g. `data-start="63.5"` instead of minute-seconds `103.5` or `1:03.5`), as the HTML5 `<audio>` tag's `currentTime` is in seconds.
  - Timings must correspond exactly to the first syllable of the spoken/sung entry.
  - Ensure adjacent line timestamps transition continuously (e.g. Line 1: `14.45` to `21.0`; Line 2: `21.1` to `29.0`) to prevent overlapping highlights.
  - Use smooth auto-scrolling (`scrollTo` with `behavior: 'smooth'`) to keep the active line centered in the lyrics container view.
* **Audio Processing & Audits:**
  - When matching timings, convert the song to `.m4a` format using `afconvert` and use `view_file` to load and listen to it directly. Do not rely on automated volume envelopes (which are fooled by beat drops and instrumentation).
  - Always clean up the temporary `.m4a` file after timing extraction is complete.

---

## 📝 Persistent Session Notes
*Use this section to store notes, preferences, or variables that need to persist across sessions.*

* **Current State**: Second Conditional song player fully implemented and audited.
* **Preferences**: 
  - Excluded `gemini.md` from Jekyll builds in `_config.yml`.
