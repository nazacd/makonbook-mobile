# SAT MAKON — Placement Test App: Build Spec

## Mission

You are building the first version of **SAT MAKON**, a mobile SAT practice app (Expo + React Native + NativeWind) aimed at students who don't have access to a laptop, giving them a realistic, Bluebook-inspired testing environment on their phone.

**This build covers ONE feature only: the Level Check (Placement) Test.** It is administered in person, at a physical test center, by a staff member who assesses a prospective student's level and decides which class (Foundation / Pre-SAT / Advanced) to place them in. Everything else — accounts, Hollihop-based auth, a backend, full adaptive SAT practice tests — comes in a later phase and should NOT be built now. Where noted below, keep the data shape compatible with that future direction, but do not build the future features themselves.

## Explicitly Out of Scope (do not build)

- Authentication / login of any kind (no Hollihop integration yet)
- Any backend, API, or database — this is a fully static, offline app
- Student name/identity capture — the test is anonymous; the administrator already knows who's testing
- A combined Math+English composite score — each subject is tested and scored independently
- Full adaptive SAT-style practice tests (module 1 / module 2 easy / module 2 hard) — that's a documented future direction only (see "Future Direction" below), not part of this build
- Per-tier score breakdown shown on screen (e.g. "13/17 Foundation") — the engine uses this internally but the UI never displays it
- Skill/content-domain tagging (Algebra vs. Grammar, etc.)

## Tech Stack

- Expo (React Native)
- NativeWind (Tailwind CSS for RN) — pin an exact version pairing compatible with the Expo SDK you scaffold with
- Expo Router — file-based routing, used for all screens below
- `@react-native-async-storage/async-storage` — used only for local resilience (resuming an interrupted test), not as a database
- No other network/backend libraries needed

## Screens & Flow

### 1. Home

Simple branded landing screen. Two large tappable cards: **Math** and **English**. Tapping one starts the Level Check flow for that subject. No login, no name entry.

### 2. Instructions (pre-test)

A short static screen before the timer starts — mirrors Bluebook's per-section directions. States: 50 questions, 60 minutes, one attempt, and a "Begin" button that starts the timer and enters the Test Runner.

### 3. Test Runner

The core test-taking screen. One question at a time.

- **Timer, fixed at the top**, counting down from 60:00. Compute remaining time from a stored start timestamp (`duration - (now - startTimestamp)`) on every tick — never a naive `setInterval` decrement — so it survives backgrounding or screen lock without drifting. Default: the timer keeps running in the background (does not pause), matching a proctored in-person session.
- Question content: prompt text, optional passage/stimulus text, optional image.
- Answer input: 4-choice multiple choice (A–D) for most questions, or numeric text entry for grid-in math questions (`options: null`, see Data Model).
- **Mark for review** toggle per question.
- **Answer eliminator**: strike through an option to visually rule it out without it counting as the selected answer.
- **Fixed footer navigation**: Back / Next, plus a "Question X of 50" control opening a **question navigator overlay** — a grid of all 50 numbers, state-coded (current / answered / unanswered / marked), tap to jump directly to any question.
- **Review-before-submit screen**: after question 50, show the same navigator grid full-screen with an answered/unanswered/marked summary and a "Submit Test" button.
- **Persistence**: on every answer change, save progress (answers, marked set, start timestamp) to AsyncStorage under an in-progress test ID. If the app is closed and reopened before submission, resume exactly where it left off, timer continuing from real elapsed time. Clear this entry on submit.

### 4. Results

Shown immediately after submission.

- **Hero: "Recommended Starting Level"** — the output of the level-estimation engine, the primary large element on screen. No raw score, no percentage, no per-tier breakdown is shown here.
- **Question grid**: all 50 numbers, color-coded correct / incorrect / skipped. Tapping a number opens that question in the Question Review screen.

### 5. Question Review

- Shows the question again (prompt, stimulus, image, options), with the student's chosen answer and the correct answer both visible.
- Explanation is **hidden by default**, behind a "Show Explanation" toggle.
- **Top-left back button** returns to Results.
- **Fixed bottom navigation**: Previous/Next flips through all 50 questions in review mode sequentially, without returning to the grid each time.

## Data Model

Each subject's placement question bank is a single local JSON file, bundled with the app (not fetched remotely). One flat array per subject — no modules, no adaptivity for this test format.

```json
{
  "math": [
    {
      "id": 1,
      "level": "easy",
      "question": "Which value of x satisfies the equation?",
      "content": {
        "text": "3x + 5 = 20",
        "image": null
      },
      "options": {
        "A": "3",
        "B": "5",
        "C": "10",
        "D": "15"
      },
      "correct": "B",
      "explanation": "Subtract 5 from both sides, then divide by 3: x = 5."
    },
    {
      "id": 2,
      "level": "hard",
      "question": "What is the value of a?",
      "content": {
        "text": null,
        "image": "ma_002_diagram"
      },
      "options": null,
      "correct": 0.5,
      "explanation": "..."
    }
  ],
  "english": [ /* same shape, 50 items */ ]
}
```

Field notes:

- `id`: integer, unique within each subject's array (1–50).
- `level`: `"easy" | "medium" | "hard"` — internal difficulty tag used by the level-estimation engine, mapped to Foundation / Pre-SAT / Advanced for display (see engine section).
- `content.text`: nullable stimulus/passage text.
- `content.image`: nullable. This is a **lookup key**, not a URL or file path — see below.
- `options`: object with keys `A`–`D` for multiple choice, or `null` for a grid-in numeric question.
- `correct`: a letter string for multiple choice, or a number for grid-in.
- `explanation`: single string, shown in full when revealed on the Question Review screen.

### Local image assets

React Native/Metro can't resolve a dynamic string into a bundled image — `<Image source={{ uri: someVariable }} />` will not work for local assets. Maintain a static asset map instead:

```ts
// assetMap.ts
export const placementImages: Record<string, any> = {
  ma_002_diagram: require("../assets/images/placement/ma_002_diagram.png"),
  // ...
};
```

Each question's `content.image` value is a key into this map; the renderer does `placementImages[question.content.image]` to resolve the actual source. Missing keys should render nothing gracefully rather than crash.

## Scoring & Level-Estimation Engine

### Grading

- **Multiple choice**: exact match against `correct`.
- **Grid-in (numeric)**: never do a plain string/number equality check. Parse the student's raw text input, supporting both decimal (`"0.5"`) and fraction (`"1/2"`) syntax, into a float. Compare against `correct` (also treated as a float) with a small tolerance (e.g. `Math.abs(a - b) < 0.001`) to absorb rounding. This makes `0.5`, `.5`, and `1/2` all grade as correct for the same question.

### Level-estimation algorithm (staircase / mastery threshold)

For each subject, independently:

1. Compute percent correct within each tier: `easyPct`, `mediumPct`, `hardPct`.
2. Apply a threshold, default **75%**, defined as a single named constant so it's trivial to tune later:
   - If `easyPct < THRESHOLD` → recommend **Foundation**
   - Else if `mediumPct < THRESHOLD` → recommend **Pre-SAT**
   - Else → recommend **Advanced**
3. Display the recommendation using the real class names (Foundation / Pre-SAT / Advanced), mapped from the internal `easy/medium/hard` tags at the display layer — never show the raw tag names to the user.

This logic intentionally biases toward shoring up fundamentals: a student who's shaky on `easy` but strong on `hard` is still placed at Foundation. That's a deliberate design choice for a placement test, not a bug.

### Content-authoring guidance

For the per-tier percentages to be meaningful, each subject's 50 questions should be split roughly evenly across tiers — a good starting default is **17 easy / 17 medium / 16 hard** per subject. This is a content-authoring guideline, not something enforced in code.

## Suggested Project Structure

```
/app
  index.tsx                                    → Home
  placement/[subject]/instructions.tsx         → Pre-test instructions
  placement/[subject]/test.tsx                 → Test Runner
  placement/[subject]/results.tsx              → Results (level recommendation + grid)
  placement/[subject]/review/[questionId].tsx  → Question Review
/data
  placement/math.json
  placement/english.json
  assetMap.ts
/lib
  scoring.ts         → level-estimation engine
  gradeAnswer.ts     → MC + grid-in grading logic
  timer.ts           → elapsed-time-based countdown hook
  storage.ts         → AsyncStorage helpers for resume-in-progress
/components
  QuestionCard.tsx
  AnswerChoice.tsx
  Timer.tsx
  QuestionNavigatorGrid.tsx
  BottomNavBar.tsx
```

## Future Direction (context only — do not build yet)

General SAT **practice tests** (distinct from this placement test) will eventually use a different, adaptive format: a single JSON per test containing `module_1`, `module_2_easy`, and `module_2_hard` for each subject, downloaded in full (including images) so students can practice offline, with the module 2 branch chosen locally based on module 1 performance. That format is intentionally different from the placement schema above (modular vs. flat, remote-downloadable vs. bundled) — no need to unify them now, just avoid building anything today that would make that harder later.

## Assumptions Flagged for Quick Review

- Level recommendation displays the real class names (Foundation/Pre-SAT/Advanced) rather than the internal "Easy/Medium/Hard" tags.
- Mastery threshold defaults to 75% — a single constant, easy to retune.
- Tier split defaults to ~17/17/16 per subject — a content guideline, not enforced in code.
- Timer keeps running through app backgrounding rather than pausing.
- A short Instructions screen was added before the timer starts, for Bluebook parity — remove it if you'd rather jump straight from Home into the test.
