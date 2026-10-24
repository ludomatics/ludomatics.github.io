# Ludomatics - Exámenes

Answer sheets for admission exams (universidad and bachillerato), hosted on GitHub Pages. Students fill in their
answers and get their score per section. There is no build step: everything is static files.

The interactive exams (student home, one question at a time, progress) live in [`interactive/`](interactive/README.md).

## 📁 Project Structure

```
├── index.html          # Exam list, rendered from exams/index.json
├── index.css           # Exam list styles
├── exam.css            # Answer sheet styles
├── 404.html            # Forwards old links (/exams/<exam-id>.html) to the answer sheet
├── exams/
│   ├── index.json      # Which exams appear on the list, by category and in order
│   ├── examen.html     # The answer sheet page: examen.html?id=<exam-id>
│   └── <exam-id>.json  # One file per exam: title, sections and answer key
└── src/                # Answer sheet code (loading, rendering, grading, results)
```

Each exam opens at `exams/examen.html?id=<exam-id>`, which loads `exams/<exam-id>.json`.

## ➕ Add an Exam

1. Create `exams/<exam-id>.json` (lowercase letters, digits and dashes, e.g. `universidad-ipn-2025`):

```json
{
    "title": "Universidad IPN 2025",
    "sections": [
        { "title": "Matemáticas", "start": 1, "end": 20 },
        { "title": "Física", "start": 21, "end": 40 }
    ],
    "numberOfOptions": 5,
    "correctAnswers": ["A", "B", "C", "D", "E", "..."]
}
```

- `correctAnswers` has one letter per question, in order; its length is the number of questions.
- `sections` give the first and last question number of each section.

2. Add it to its category in `exams/index.json`:

```json
{ "id": "universidad-ipn-2025", "title": "Universidad IPN 2025" }
```

To fix an answer, edit the exam's JSON and push; students get it on their next visit.

## 🔧 Testing Locally

The pages fetch JSON, so open them through a local server rather than as files:

```bash
python3 -m http.server 8000
# http://localhost:8000/
```
