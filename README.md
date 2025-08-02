# AnSheet V3 - Simple Exam Generation System

A clean and simple exam generation system that creates individual HTML files for each exam from JSON configuration files.

## 🚀 Features

- **Simple Build System**: Pure shell script, no Node.js required
- **Multiple Exams**: Generate individual HTML files for each exam
- **No Code Duplication**: Shared JavaScript files in `src/`
- **Easy Maintenance**: Add new exams by creating YAML files
- **User-Friendly Format**: YAML format for non-technical users (JSON supported for legacy)
- **Direct Access**: Each exam has its own URL
- **Embedded Data**: Exam data embedded directly in HTML files (no external JSON dependencies)

## 📁 Project Structure

```
ansheetV3/
├── index.html              # Auto-generated landing page
├── exams/                   # Exam files (YAML format)
│   ├── universidad-unam-2025.yaml
│   ├── universidad-ipn-2025.yaml
│   ├── universidad-uam-2025.yaml
│   └── bachillerato-comipems-2025.yaml
├── templates/               # HTML templates
│   ├── exam-template.html  # Exam template
│   ├── exam-template.yaml  # YAML template
│   └── landing-template.html # Landing page template
├── src/                     # Shared JavaScript files
│   ├── config.js           # Configuration
│   ├── utils.js            # Utilities
│   ├── questionGenerator.js # Question generation
│   ├── resultsRenderer.js  # Results display
│   ├── inputListeners.js   # Event handlers
│   └── gradingService.js   # Grading logic
├── build-exam.sh           # Build script
├── yaml_to_json.py         # YAML to JSON converter
└── style.css               # Stylesheet
```

## 🛠️ Usage

### 1. **Build All Exams**

Generate HTML files for all exams in the `exams/` directory:

```bash
./build-exam.sh
```

This will:
- Convert YAML files to JSON (temporary)
- Embed exam data directly in HTML files
- Generate individual HTML files in the `exams/` directory
- Each HTML file contains all exam data and calls `generateExamSheet(examData)`
- Add auto-generated comments to prevent manual modifications
- Generate a landing page (`index.html`) with all available exams organized by category
- Clean up intermediate JSON files (converted from YAML)

### 2. **Add New Exams**

You can create exam files in two formats:

#### Option A: YAML Format (Recommended for non-technical users)

Create a `.yaml` file in `exams/` directory:

```yaml
# Exam Configuration
title: Examen Universidad IPN 2025

# Number of answer options
numberOfOptions: 5

# Exam sections
sections:
  - title: Matemáticas
    start: 1
    end: 20
  - title: Física
    start: 21
    end: 40

# Correct answers for each question
correctAnswers:
  1: A
  2: B
  3: C
  4: D
  5: E
  6: A
  7: B
  # ... continue for all questions
```

#### Option B: JSON Format (Legacy support)

The system also supports JSON files for backward compatibility, but YAML is recommended for new exams.

### 3. **Run the Build Script**

```bash
./build-exam.sh
```

### 4. **Access the Exam**

```
http://yourserver.com/exams/examen-universidad-ipn-2025.html
```

## 🌐 URL Structure

After building, you'll have:

```
yourserver.com/
├── exams/
│   ├── examen-universidad-unam-2025.html
│   ├── universidad-unam-2024.html
│   ├── practice-2025.html
│   └── ... (other exam files)
└── ... (other project files)
```

## 📋 Exam File Naming Convention

Follow this pattern for exam JSON files:

```
{nivel}-{institucion}-{año}.json
```

### Examples:
- `universidad-unam-2025.json`
- `universidad-uam-2025.json`
- `universidad-ipn-2025.json`
- `bachillerato-comipems-2025.json`

## 🔧 Development

### Prerequisites
- Bash shell
- Web server (for testing)

### Testing
```bash
# Build all exams
./build-exam.sh

# Serve locally for testing
python3 -m http.server 8000
```

### How It Works

1. **Template**: `templates/exam-template.html` contains the base HTML with embedded JavaScript
2. **Build Process**: 
   - Copy template to new HTML file
   - Replace `generateExamSheet()` with `generateExamSheet('exam-name')`
3. **Result**: Each HTML file loads the correct exam automatically
