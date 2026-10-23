# Exámenes interactivos

Static, self-contained quiz pages for GitHub Pages. They do not use the YAML sources, the build scripts or `src/`
from the answer-sheet site.

Students only ever see two places:

- `/universidad/` lists exams whose `category` is `Universidad`; exams open at `/universidad/examen.html?id=<exam-id>`
- `/bachillerato/` lists exams whose `category` is `Bachillerato`; exams open at `/bachillerato/examen.html?id=<exam-id>`

This folder (`/interactive/`) is the shared engine and has no pages of its own. Each `examen.html` loads it with
`<base href="../interactive/">`, so every relative URL on that page (code, styles, `exams/<id>.json`, question
images) resolves here. Fix something once and both catalogs get it.

Each catalog card shows what this browser has saved for that exam: in progress (answered count, name) or graded (score).

```
bachillerato/
├── index.html          # catalog: exams with category "Bachillerato"
└── examen.html         # quiz page: examen.html?id=<exam-id> (loads the engine below)
universidad/
├── index.html          # catalog: exams with category "Universidad"
└── examen.html         # quiz page
interactive/            # shared engine, no pages
├── quiz.css            # styles (same look as the answer sheets, light only)
├── js/
│   ├── list.js         # renders a catalog
│   ├── quiz.js         # quiz UI: questions, timer, map, finish dialog, results, review
│   ├── exam.js         # loads + validates an exam JSON, grading
│   └── storage.js      # localStorage autosave (one attempt per exam per browser)
└── exams/
    ├── index.json          # which exams appear in the catalogs
    └── <exam-id>.enc.json  # one encrypted file per exam (questions, answers and images)
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

- `category` sends the "← Exámenes" link back to `/universidad/` or `/bachillerato/`.
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

`category` decides which catalog shows it. Add `"hidden": true` to keep it out of the catalogs; it still opens with its direct
link, e.g. `/universidad/examen.html?id=<exam-id>` (hidden is not secret: use a password for that).

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
# http://localhost:8000/universidad/
```

Use `localhost`, not your computer's network address (`http://192.168…`): browsers only allow the decryption on
`https://` pages and on `localhost`.

## Saved progress

Each exam saves one attempt in the browser's localStorage under `ludomatics.quiz.<exam-id>`.
Reloading resumes on the same question. "Nuevo intento" clears it, name included, for shared devices.
