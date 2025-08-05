# Build Scripts

This directory contains the individual build scripts for AnSheet V3. Each script has a single responsibility and can be run independently or as part of the main build process.

## Scripts Overview

### `build-html-exams.sh`
**Purpose**: Converts YAML exam files to JSON and generates HTML exam files.

**What it does**:
- Converts YAML files from `source/` directory to JSON in `exams/` directory
- Uses `templates/exam-template.html` as the base template
- Replaces the `examName` variable in each HTML file with the correct exam filename
- Each HTML file dynamically loads exam data from its corresponding JSON file via ExamService
- Generates HTML files in `exams/` directory

**Dependencies**:
- `source/` directory with YAML files
- `templates/exam-template.html`
- `bin/yaml_to_json.py` (converts YAML to JSON)
- `bin/embed_exam_data.py` (replaces examName variable in HTML)

**Usage**:
```bash
./bin/build-html-exams.sh
```

### `build-landing-page.sh`
**Purpose**: Generates the main landing page (`index.html`) with categorized exam cards.

**What it does**:
- Reads JSON files from `exams/` directory
- Categorizes exams by type (Universidad, Bachillerato, Others)
- Uses `templates/landing-template.html` as the base template
- Generates exam cards with links to individual exam pages
- Creates the main `index.html` file

**Dependencies**:
- `exams/` directory with JSON files (run `build-html-exams.sh` first)
- `templates/landing-template.html`

**Usage**:
```bash
./bin/build-landing-page.sh
```

## Main Build Script

The main build script is located in the root directory:

### `build` (in project root)
**Purpose**: Orchestrates the complete build process.

**What it does**:
- Runs `build-html-exams.sh` to generate HTML exam files
- Runs `build-landing-page.sh` to generate the landing page
- Provides a unified interface for the entire build process

**Usage**:
```bash
./build
```

## Workflow

1. **Full Build**: Run `./build` from the project root
2. **Individual Steps**: Run specific scripts as needed:
   - `./bin/build-html-exams.sh` - Only generate exam HTML files
   - `./bin/build-landing-page.sh` - Only regenerate the landing page

## Benefits of This Structure

- **Single Responsibility**: Each script has one clear purpose
- **Modularity**: Scripts can be run independently
- **Maintainability**: Easier to debug and modify individual components
- **Flexibility**: Can rebuild specific parts without running the entire process
- **Reusability**: Scripts can be called from other automation tools

## Dynamic Variable Replacement

The `embed_exam_data.py` script performs dynamic variable replacement in the HTML template:

- **Template Variable**: `const examName = "exam-template.json";`
- **Replacement**: `const examName = "actual-exam-name.json";`
- **Process**: Extracts exam name from JSON filename and replaces the placeholder in the HTML template
- **Result**: Each generated HTML file loads the correct exam data dynamically

## Error Handling

All scripts use `set -e` to exit immediately on any error, ensuring that build failures are caught early and don't leave the system in an inconsistent state. 
