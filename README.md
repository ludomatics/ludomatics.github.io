# AnSheet V3 - Simple Exam Generation System

A clean and simple exam generation system that creates individual HTML files for each exam from JSON configuration files.

## 🚀 Features

- **Simple Build System**: Pure shell script, no Node.js required
- **Multiple Exams**: Generate individual HTML files for each exam
- **No Code Duplication**: Shared JavaScript files in `src/`
- **Easy Maintenance**: Add new exams by creating JSON files
- **Direct Access**: Each exam has its own URL

## 📁 Project Structure

```
ansheetV3/
├── index.html              # Auto-generated landing page
├── exams/                   # JSON exam files
│   ├── examen-universidad-unam-2025.json
│   ├── universidad-unam-2024.json
│   └── practice-2025.json
├── templates/               # HTML templates
│   ├── exam-template.html  # Exam template
│   └── landing-template.html # Landing page template
├── src/                     # Shared JavaScript files
│   ├── config.js           # Configuration
│   ├── utils.js            # Utilities
│   ├── examService.js      # Exam service
│   ├── questionGenerator.js # Question generation
│   ├── resultsRenderer.js  # Results display
│   ├── inputListeners.js   # Event handlers
│   └── gradingService.js   # Grading logic
├── build-exam.sh           # Build script
└── style.css               # Stylesheet
```

## 🛠️ Usage

### 1. **Build All Exams**

Generate HTML files for all exams in the `exams/` directory:

```bash
./build-exam.sh
```

This will:
- Read all JSON files from `exams/` directory
- Generate individual HTML files in the `exams/` directory
- Each HTML file calls `generateExamSheet('exam-name')` with the correct parameter
- Add auto-generated comments to prevent manual modifications
- Generate a landing page (`index.html`) with all available exams organized by category

### 2. **Add New Exams**

1. Create a new JSON file in `exams/` directory:
   ```json
   {
       "title": "Examen Universidad IPN 2025",
       "sections": [
           {
               "title": "Matemáticas",
               "start": 1,
               "end": 20
           }
       ],
       "numberOfOptions": 5,
       "correctAnswers": ["A", "B", "C", "D", "E", ...]
   }
   ```

2. Run the build script:
   ```bash
   ./build-exam.sh
   ```

3. Access the exam:
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

## 🎯 Benefits

1. **Simplicity**: Pure shell scripting, no complex build tools
2. **Performance**: Static HTML files load instantly
3. **Maintainability**: Shared codebase, no duplication
4. **Scalability**: Add unlimited exams without code changes
5. **Flexibility**: Works with any hosting provider

## 📝 License

MIT License - feel free to use and modify as needed. 
