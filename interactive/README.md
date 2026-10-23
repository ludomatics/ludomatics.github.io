# Exámenes interactivos

Static, self-contained quiz pages served from GitHub Pages at `/interactive/`.
They do not use the YAML sources, the build scripts or `src/` from the answer-sheet site.

```
interactive/
├── index.html          # list of exams (reads exams/index.json)
├── exam.html           # quiz page: exam.html?id=<exam-id>
├── quiz.css            # styles (same look as the answer sheets, light only)
├── js/
│   ├── list.js         # renders the list page
│   ├── quiz.js         # quiz UI: questions, map, finish dialog, results, review
│   ├── exam.js         # loads + validates an exam JSON, grading
│   └── storage.js      # localStorage autosave (one attempt per exam per browser)
└── exams/
    ├── index.json      # which exams appear on the list page
    ├── <exam-id>.json  # one file per exam
    └── <exam-id>/      # figures for that exam (q03.png, ...)
```

## Adding an exam

1. Create `exams/<exam-id>.json` (lowercase letters, digits and dashes only):

```json
{
  "id": "unam-2021-area-1",
  "title": "UNAM 2021 · Área 1",
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

- Questions are numbered automatically in order, across sections.
- `answer` sits next to its question, so the key can't drift out of sync.
- `image` is optional; paths are relative to `exam.html`.
- Math goes between `$...$` (LaTeX, rendered with MathJax). In JSON, backslashes are doubled: `\\frac`.
- `text` may contain simple HTML such as `<blockquote>` or `<em>`.

2. Add it to `exams/index.json`:

```json
{ "id": "unam-2021-area-1", "title": "UNAM 2021 · Área 1", "category": "Universidad", "questionCount": 120 }
```

If an exam file has a question with the wrong number of options or an invalid answer letter,
the exam page shows which question is wrong instead of loading.

## Testing locally

The pages fetch JSON, so open them through a local server, not as files:

```bash
python3 -m http.server 8000
# http://localhost:8000/interactive/
```

## Saved progress

Each exam saves one attempt in the browser's localStorage under `ludomatics.quiz.<exam-id>`.
Reloading resumes on the same question. "Nuevo intento" clears it, name included, for shared devices.
