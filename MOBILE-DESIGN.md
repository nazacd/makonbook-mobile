# MakonBook design

The design source of truth for the app. Read it before any UI change; update it when a decision changes. Token values live in `src/global.css` and `src/design/colors.ts`; this file says why.

## App read

SAT study companion and class tool for **students 16–20** (exam-focused, on their phones between classes), **teachers** (attendance and progress on the go) and **parents** (read-only, Uzbek or Russian). Android first-class, iOS first-class, web best-effort. One brand look on both platforms with native navigation underneath.

**Feel: calm.** One fact, one form. Quiet when things are fine; only problems get a signal. Icons and symbols over explanatory text.

Dials: expression 5 · motion 4 · density 4. One signature move per screen.

## Principles

- **One fact, one form.** A number, a bar or a sentence, never two of them for the same thing. Never repeat a fact on one screen (the time inside a group's name and again in its schedule).
- **Quiet when fine.** Attendance at 90 % and above is just a green bar; nothing else calls for attention.
- **Content first.** HolliHop group names are working labels, never titles. `lib/groups.ts` turns "MR SARVAR FOUND MATH 17:00 TTS" into "Foundation Math" + "Mr Sarvar"; days and time come from the schedule. Names in normal case ("Diyora Adilova").
- **No AI tells.** No greeting header, no uppercase letter-spaced overlines, no grey explanatory paragraphs inside cards, no screen that is just "big title + stack of identical rounded cards", no generic initials circle, no stock or generated images.
- **Each screen its own layout.** Classes is built around the next lesson, with each class as type on the page (no cards). Today (teacher) is a timeline of the day. Profile leads with the avatar.

## Palette and tokens

From the avatar set: navy `#122D47`, off-white `#EDE2CC`, terracotta `#B65D3C`, mustard `#CB9725`, sage `#7D9B81`, sky `#97C1D5`, violet `#7A4590` (the logo colour, used as the accent, not the identity). Light theme first; dark is a navy night, not black.

| token | light | dark | use |
|---|---|---|---|
| `brand` | `#f5efe3` | `#0b1a2a` | background |
| `surface` / `surface-2` | `#fffcf6` / `#ede2cc` | `#122438` / `#1a2f46` | lifted steps, pressed states, segmented track |
| `ink` / `ink-2` / `ink-3` | `#122d47` / `#4f606f` / `#66737f` | `#f2eada` / `#c2baa9` / `#9a9487` | text (all AA) |
| `primary` / `on-primary` | navy / off-white | off-white / navy | buttons |
| `accent` / `on-accent` | `#7a4590` / white | `#c391d8` / navy | selection, links, the Scan button |
| `good` `watch` `bad` | `#4a6b50` `#86600e` `#9e4527` | `#9dbda2` `#e0b24e` `#e58d6b` | state text (darkened for AA in light) |
| `track`, `fill-good/watch/bad` | `#ede2cc`, `#2f7444` `#a87810` `#9e4527` | `#24384e`, `#7fc28e` `#e0b24e` `#e58d6b` | attendance bar (fills ≥ 3:1 on track) |
| subject objects | Math `#122d47` + `#3d6f86`; English `#b65d3c` + `#9e4527` | Math `#97c1d5` + `#6f93ad`; English `#e58d6b` + `#c66f4e` | two tones per subject |

The QR code is always navy on white. Question images sit on white tiles in both themes.

## Type

Bitter (slab, Latin + Cyrillic + Uzbek ʻ) for titles and big numbers; the system font for reading. Scale in `src/design/typography.ts`; text follows the phone's font size, capped at 1.4× (1.2× for display sizes); the timed test screens are fixed. Tabular figures for times, scores and codes.

## Shape, space, motion

- Radius 10 (chips) · 14 (buttons, inputs, groups) · 20 (panels) · full (avatars, Scan button). Hairlines, not shadows; only the Scan button and the calculator float.
- Screen gutter 20 dp; 4/8 spacing; classes on Classes separated by 64 dp; touch targets ≥ 44 dp.
- Springs from `src/design/motion.ts`; press feedback on press-in; haptics only for success, error and selection. Everything decorative stops under Reduce Motion.

## Components

- `Icon`: Lucide, 1.75 stroke. Tabs: calendar · book-open · layers · user, with the student's raised violet Scan button (scan-line).
- `Avatar`: students get one of 20 illustrations (`assets/avatars`) by the first letter of their first name (A → 01 … T → 20, then U → 01). Choosing your own avatar is deferred. Teachers: initials on a palette colour from their ID, photo-ready.
- `AttendanceBar`: "Attendance" label over a horizontal 64 × 6 dp bar at the class's bottom right; fill length = rate; colour terracotta < 70 %, mustard 70–89 %, green ≥ 90 %; no number, no icon; one ≥ 44 dp target to the class screen (where the percentage, absences and history live); hidden before the first lesson.
- `SubjectSpill`: the subject's objects spill in from the screen's right edge behind a class: densest at the edge, fading inward, kept clear of the measured text and the bar, cut only by the screen edge, never between blocks. Seeded from the group ID. Math: digits, − ÷ (fewer + ×) at Foundation; + √ π triangle graph paper at Pre-SAT; + ∑ ∫ parabola compass protractor at Advanced. English: outlined serif letters (never Bitter), quotation marks, ? ! at Foundation; + & ; « bookmark at Pre-SAT; + nib, handwriting, ¶ § at Advanced. Private lessons spill like Foundation and show "1:1". The same sets carry to Practice and Words later.
- `SegmentedControl`, `Skeleton`, `EmptyState`, `ErrorState`, `Button` (primary / secondary / plain / destructive), `TextField`, `ListRow`, `Notice`.

## Decisions and risks

- **Violet as accent, not identity** (user decision, round two): the logo's purple marks what you tap; the palette's warm neutrals and navy carry the app.
- **Light theme first**, dark as a navy night; Appearance setting in Profile.
- **No textbook covers** (tried in round two, dropped in round three) and **no tinted cards** (round three, dropped in round four): classes are type on the page.
- **Font scaling on** (capped): risks the Honor text-clipping bug right after the phone's font size changes while the app is open; a screen re-render fixes it.

Preview of the direction: `.design/specimen.html` (git-ignored; published as a private artifact).
