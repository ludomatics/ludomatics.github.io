# AnSheet V3 - Simple Exam Generation System

A clean and simple exam generation system that creates individual HTML files for each exam from YAML configuration files.

## 🚀 Features

- **Simple Build System**: Pure shell script, no Node.js required
- **Multiple Exams**: Generate individual HTML files for each exam
- **No Code Duplication**: Shared JavaScript files in `src/`
- **Easy Maintenance**: Add new exams by creating YAML files
- **User-Friendly Format**: YAML format for non-technical users
- **Direct Access**: Each exam has its own URL
- **Flexible Data Loading**: Exam data loaded from JSON files via ExamService
- **Clean Architecture**: Separated source files from generated files
- **Backward Compatibility**: Supports both embedded and external JSON data

## 📁 Project Structure

```
ansheetV3/
├── index.html              # Auto-generated landing page
├── source/                 # Source YAML files (from Firestore)
│   ├── comipems-*.yaml     # COMIPEMS exam files
│   └── universidad-*.yaml  # University exam files
├── exams/                  # Generated HTML files
├── templates/              # HTML templates + template YAML
│   ├── exam-template.html  # Exam template
│   ├── landing-template.html # Landing page template
│   └── exam-template.yaml  # Template YAML for testing
├── src/                    # Shared JavaScript files
│   ├── config.js           # Configuration
│   ├── utils.js            # Utilities
│   ├── questionGenerator.js # Question generation
│   ├── resultsRenderer.js  # Results display
│   ├── inputListeners.js   # Event handlers
│   ├── gradingService.js   # Grading logic
│   └── examService.js      # Exam data loading and management

├── build                   # Main build script (orchestrates the process)
├── bin/                    # Build tools and scripts
│   ├── build-html-exams.sh # HTML exam file generator
│   ├── build-landing-page.sh # Landing page generator
│   ├── yaml_to_json.py     # YAML to JSON converter
│   └── embed_exam_data.py  # Exam data embedder
├── index.css               # Stylesheet
└── exam.css                # Exam-specific stylesheet
```

## 🛠️ Usage

### 1. **Build All Exams**

Generate HTML files for all exams in the `exams/` directory:

```bash
./build
```

**Note:** The build process processes all YAML files from the `source/` directory and converts them to JSON files.

This will:
- Convert YAML files to JSON (permanent assets)
- Generate individual HTML files in the `exams/` directory
- Each HTML file dynamically loads data from corresponding JSON files via ExamService
- Replace the `examName` variable in each HTML file with the correct exam filename
- Add auto-generated comments to prevent manual modifications
- Generate a landing page (`index.html`) with all available exams organized by category
- Keep JSON files as permanent assets for flexible data management

### 2. **Add New Exams**

You can create exam files in YAML format:

Create a `.yaml` file in `source/` directory:

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

### 3. **Run the Build Script**

```bash
./build
```

**Individual Build Steps:**
- `./bin/build-html-exams.sh` - Generate only HTML exam files
- `./bin/build-landing-page.sh` - Generate only the landing page

### 4. **Access the Exam**

```
http://yourserver.com/exams/universidad-ipn-2025.html
```

## 🌐 URL Structure

After building, you'll have:

```
yourserver.com/
├── exams/
│   ├── universidad-unam-2025.html
│   ├── universidad-uam-2025.html
│   ├── universidad-ipn-2025.html
│   └── bachillerato-comipems-2025.html
└── ... (other project files)
```

## 📋 Exam File Naming Convention

Follow this pattern for exam YAML files:

```
{nivel}-{institucion}-{año}.yaml
```

### Examples:
- `universidad-unam-2025.yaml`
- `universidad-uam-2025.yaml`
- `universidad-ipn-2025.yaml`
- `bachillerato-comipems-2025.yaml`

## 🔧 Development

### Build Architecture

The build system is organized into modular components:

- **Main Build Script** (`./build`): Orchestrates the complete build process
- **HTML Exam Generator** (`./bin/build-html-exams.sh`): Converts YAML to JSON and generates HTML files
- **Landing Page Generator** (`./bin/build-landing-page.sh`): Creates the main landing page
- **YAML to JSON Converter** (`./bin/yaml_to_json.py`): Converts YAML exam files to JSON format
- **Variable Replacer** (`./bin/embed_exam_data.py`): Replaces `examName` variable in HTML templates

### Prerequisites
- Bash shell
- Web server (for testing)

### Testing
```bash
# Build all exams
./build

# Serve locally for testing
python3 -m http.server 8000
```

### How It Works

1. **Template**: `templates/exam-template.html` contains the base HTML with embedded JavaScript and a placeholder `examName` variable
2. **Build Process**: 
   - Convert YAML files to JSON (permanent assets)
   - Copy template to new HTML file
   - Replace the `examName` variable with the correct exam filename
   - Each HTML file dynamically loads exam data from its corresponding JSON file via ExamService
3. **Result**: Each HTML file loads exam data dynamically and can be accessed directly via URL
