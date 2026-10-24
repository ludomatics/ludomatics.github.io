# Exámenes interactivos

Static, self-contained quiz pages for GitHub Pages. They do not use the YAML sources, the build scripts or `src/`
from the answer-sheet site.

Students use two places:

- `/interactive/` is their home. The first visit asks three things (level, name and goal) and remembers them on
  that device. After that the page has three sections:
  - **Exámenes pendientes**: their level's exams in progress first, then the ones not started. A graded exam leaves
    this list ("Nuevo intento" brings it back).
  - **Historial**: one card per graded attempt, newest first (5, then "Ver todo"). A card opens that attempt's
    results and review, with "Nuevo intento".
  - **Tu progreso**: totals, the latest and best result against the goal (editable there), a chart of every result
    over time and accuracy per subject.

  Exams open at `/interactive/examen.html?id=<exam-id>`; a history card at `examen.html?id=<exam-id>&intento=<finishedAt>`.
- `/invitado/` is guest mode for a shared device: it asks level and name every time, saves nothing after the tab
  closes, and never reads or changes the owner's profile, history or attempts. Nothing in the site links to it;
  teachers share the address only when a device is shared.

"Tu progreso" is built from the history of graded exams. Accuracy per subject is summed across exams by `subject`;
a subject is marked "Necesita atención" once the student answered at least 10 of its questions and their accuracy
is below their goal percentage (60% without a goal).

"Nuevo intento" never replaces a score: every graded attempt stays in the history, and only the current answers are
cleared. Opened from an older result while another attempt is in progress, it offers to continue that one instead.

Rules in personal mode:

- Students only see and open exams of their level. An exam of the other level opened by direct link shows
  "Este examen es de …" instead. An exam link opened before onboarding goes through onboarding (with that exam's
  level preset) and then back to the exam.
- The level can change in "Editar perfil" until the student has answered 10 questions (any exam) or graded any
  exam; after that it is locked so progress never mixes levels. Name and goal can always change.
- "Empezar de nuevo" (in "Editar perfil", double confirmation) deletes the profile, history, attempts and saved
  passwords on that device and restarts onboarding.

`/universidad/` and `/bachillerato/` (and their `examen.html`) are old addresses that redirect to `/interactive/`;
on a first visit they preset the level and skip that question.

```
interactive/
├── index.html          # student home (pending exams, history, progress) + onboarding
├── examen.html         # quiz page: examen.html?id=<exam-id>
├── quiz.css            # styles (same look as the answer sheets, light only)
├── js/
│   ├── home.js         # onboarding, home sections, profile and goal editors (also guest mode)
│   ├── catalog.js      # exam list and cards
│   ├── quiz.js         # quiz UI: questions, timer, map, finish dialog, results, review
│   ├── exam.js         # loads, decrypts and validates an exam; grading
│   ├── profile.js      # profile (level, name, goal), history, remembered passwords
│   ├── storage.js      # localStorage (personal) or sessionStorage (guest)
│   ├── scorecard.js    # downloadable results image
│   ├── stats.js        # progress numbers: per-subject accuracy, goal status, score series
│   └── dashboard.js    # the "Historial" and "Tu progreso" sections
└── exams/
    ├── index.json          # which exams appear in the lists
    └── <exam-id>.enc.json  # one encrypted file per exam (questions, answers and images)
invitado/               # guest mode: index.html + examen.html, same engine
exams-private/          # NOT in git (.gitignore): readable sources, keep a backup elsewhere
├── <exam-id>.json      # the exam you edit
└── <exam-id>/          # its figures (q03.png, ...)
tools/encrypt-exam.mjs  # turns exams-private/<exam-id>.json into interactive/exams/<exam-id>.enc.json
```

## Password protection

Every exam is published encrypted (AES-256-GCM, key derived from the password with PBKDF2-SHA256, 600,000
iterations). The site and the git repository only contain `<exam-id>.enc.json`; without the password nobody can read
the questions, the answers or the figures. Students type the password once per browser tab.

- One password per exam, shared by everyone who takes it. Anyone who knows it can pass it on.
- To change a password, encrypt again with the new one and publish. Students who already started keep their saved
  answers (progress is stored by exam id), but need the new password to continue.
- Use long passwords (four words and a number). A short one can be guessed offline from the published file.
- Never commit `exams-private/`. If a readable exam reaches GitHub, it stays in the history.

## Adding an exam

1. Create `exams-private/<exam-id>.json` (lowercase letters, digits and dashes only), with its figures in
   `exams-private/<exam-id>/`:

```json
{
  "id": "unam-2021-area-1",
  "title": "UNAM 2021 · Área 1",
  "category": "Universidad",
  "durationMinutes": 180,
  "numberOfOptions": 4,
  "sections": [
    {
      "title": "Física",
      "subject": "fisica",
      "questions": [
        {
          "text": "Un cuerpo acelera a $2\\,\\text{m/s}^2$ ...",
          "options": ["...", "...", "...", "..."],
          "answer": "B",
          "image": "exams/unam-2021-area-1/q03.png"
        }
      ]
    }
  ]
}
```

- `category` (`Universidad` or `Bachillerato`) decides which students see it.
- Each section has a `subject` (e.g. `fisica`, `historia-mexico`): the same key across exams lets the progress
  dashboard add up a subject over every exam. Keys in use: `fisica`, `quimica`, `biologia`, `matematicas`,
  `espanol`, `literatura`, `geografia`, `historia`, `historia-universal`, `historia-mexico`, `formacion-civica`,
  `habilidad-verbal`, `habilidad-matematica`.
- `durationMinutes` sets the timer (default 180). It starts at "Comenzar", pauses while the page is closed,
  can be hidden by the student, and turns red and counts overtime when it runs out (grading stays manual).
- Questions are numbered automatically in order, across sections.
- `answer` sits next to its question, so the key can't drift out of sync.
- `image` is optional and written as `exams/<exam-id>/q03.png`; the encryption step embeds the file.
- Math goes between `$...$` (LaTeX, rendered with MathJax). In JSON, backslashes are doubled: `\\frac`.
- `text` may contain simple HTML such as `<blockquote>` or `<em>`.
  Handy classes: `<blockquote class="passage">` (non-italic quoted text), `<span class="cite">` (right-aligned author),
  `<p class="eq">` (an equation on its own line), `<ol class="roman">` (I, II, III… lists).
- Long chemical equations read better as text with `<sub>` than as `$...$`, because text wraps on phones and formulas don't.
- A reading shared by several questions goes once in a top-level `passages` object and each question points to it:

```json
"passages": {
  "metamorfosis": { "intro": "Lee el siguiente texto y contesta de la pregunta 74 a la 78.", "title": "Metamorfosis", "html": "<p>...</p>" }
},
...
{ "text": "Selecciona el enunciado que sintetiza la idea principal del texto.", "passage": "metamorfosis", ... }
```

2. Add it to `interactive/exams/index.json`:

```json
{ "id": "unam-2021-area-1", "title": "UNAM 2021 · Área 1", "category": "Universidad", "questionCount": 120 }
```

`category` decides which students see it. Add `"hidden": true` to keep it out of every list; it still opens with its
direct link, e.g. `/interactive/examen.html?id=<exam-id>` (hidden is not secret: use a password for that).

3. Encrypt it (needs Node 18 or newer; it asks for the password twice):

```bash
node tools/encrypt-exam.mjs exams-private/<exam-id>.json
```

It checks the exam, embeds the images, writes `interactive/exams/<exam-id>.enc.json` and sets `questionCount` and
`"protected": true` in `index.json`. Run it again after every edit to the source.

The encryption step refuses an exam where a question has the wrong number of options, an invalid answer letter or a
missing image, and says which question is wrong.

## Testing locally

The pages fetch JSON, so open them through a local server, not as files:

```bash
python3 -m http.server 8000
# http://localhost:8000/interactive/
```

Use `localhost`, not your computer's network address (`http://192.168…`): browsers only allow the decryption on
`https://` pages and on `localhost`.

## What is saved on the device

Personal mode keeps everything in the browser's localStorage, on that device only (no accounts, no server):

| Key | Contents |
|---|---|
| `ludomatics.profile` | level, name, goal (`{ correct, total }`) |
| `ludomatics.history` | one record per graded attempt: exam, date, score, goal, time, answers, per-section (with `subject`) |
| `ludomatics.quiz.<exam-id>` | the current attempt of that exam (resumes after reloads) |
| `ludomatics.password.<exam-id>` | the password of a protected exam, so it is not asked again |

Guest mode uses the same names under `ludomatics.guest.` in sessionStorage, which the browser deletes when the tab
closes ("Salir del modo invitado" deletes it right away). "Nuevo intento" clears only that exam's current attempt;
the history keeps every graded result. Safari may delete a site's data after 7 days without visiting it.
