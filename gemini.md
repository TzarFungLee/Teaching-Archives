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
* All quizzes share one engine: `/assets/js/quiz-engine.js` (rendering, checking, scoring, progress, reset).
* Each quiz HTML file in `/Quizzes` contains ONLY its data: a `questionBank` array of `{ question, options, correct, explanation }`, or a `buildQuestions()` function returning 12 ready questions (see `Second Conditional - Quiz.html`), followed by the engine `<script src>` tag.
* **CRITICAL**: Fix engine bugs once in `quiz-engine.js` — never re-embed engine logic in individual quiz files. New quizzes = question data + engine script tag only.

### 2. Design & Aesthetics
* Maintain a premium, modern, cohesive look. Use glassmorphic elements (`backdrop-filter`), CSS variables for themes, clean typography, and smooth transitions.
* The entire design system ("Stealth & Ice" theme) lives in `/assets/css/main.css`, linked from `_layouts/default.html`. Do NOT add `<style>` blocks to the layout; add shared styles to the stylesheet.
* Ensure cards, grid items, and lists are responsive, center-balanced, and highly legible.

### 3. File Organization & URLs
* **Grammar lessons** go under `/Grammar` as raw HTML pages.
* **Interactive quizzes** go under `/Quizzes` as `*- Quiz.html`.
* **Reading/Listening/Writing/Speaking resources** go under their respective directories.
* Every page declares a kebab-case `permalink:` (`/grammar/first-conditional/`) and a `redirect_from:` for its legacy `.html` path (served by `jekyll-redirect-from`). New pages must follow the same pattern; internal links always use the permalink form.
* **`_data/curriculum.yml` is the single source of truth for units, lesson order and lesson↔quiz pairing.** The home portal renders category overlays as unit sections from it (via `/assets/js/curriculum.json`), and `main.js` builds prev/next lesson navigation from it. Adding a lesson = one line under its unit. Pages missing from it still appear in a "More resources" fallback section (fail-soft) — but always register new pages properly.
* The per-page `order:` front matter is legacy; curriculum.yml order wins wherever both exist.
* Each quiz links back to its lesson ("Review the Lesson") and each lesson links to its quiz.
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

## 🗺️ Content Roadmap (owner's plan)
* **Grammar**: up to ~20 more lessons (max ~40 total). Single-level by design — no `level:` field for grammar. Slot new lessons into existing units in `_data/curriculum.yml`, or add a unit when a topic cluster reaches 3+ lessons.
* **Unit structure principle (owner's explicit preference): uniformity across categories beats minimal chrome.** Skill categories mirror the same unit pattern (e.g. "Core Techniques/Strategies" + "Vocabulary Bank"), even when a unit holds a single lesson. Keep unit names and icons parallel between categories.
* **Writing**: will become **multi-level** (e.g. P4/P5/DSE). When that work starts, add a `level:` field to writing lesson entries in `curriculum.yml` and a level filter in the portal overlay — the data structure already anticipates this.

## 📝 Persistent Session Notes
*Use this section to store notes, preferences, or variables that need to persist across sessions.*

* **Current State**: Second Conditional song player fully implemented and audited. July 2026 refactor: quiz engine centralized in `/assets/js/quiz-engine.js`, layout CSS extracted to `/assets/css/main.css`, Lunr.js removed (search is strict title-substring by design), home-page category tiles are real `<button>` elements with a 2-column mobile grid.
* **Preferences**: 
  - Excluded `gemini.md`, `scratch/`, `README.md` from Jekyll builds in `_config.yml`.
  - One-off migration scripts live in `/scratch` and must never be re-run against converted pages.

## 🎙️ Teacher Tools (not linked from the student portal)
* **J Dictation** — classroom dictation conductor at `/tools/j-dictation/` (hidden URL, no category). Papers live in `_data/dictations.yml` (one block per paper: partA–D). Settings and Part B shuffle order persist in localStorage; v2 slot: items may carry `audio:` MP3 URLs to override TTS.
