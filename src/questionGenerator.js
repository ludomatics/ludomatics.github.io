import { CONFIG } from './config.js';
import { DOMUtils, DataUtils, MessageUtils } from './utils.js';



// Exam data state
let examState = {
    correctAnswers: [],
    sections: []
};

async function generateExamSheet(examData) {
    // Show loading, hide questions
    DOMUtils.setDisplay(CONFIG.ELEMENTS.LOADING, 'block');
    DOMUtils.setDisplay(CONFIG.ELEMENTS.QUESTIONS_CONTAINER, 'none');

    try {
        // Extract exam data from the passed object
        const { numberOfQuestions, numberOfOptions, title, correctAnswers, sections } = examData;
        
        // Update exam state
        examState.correctAnswers = correctAnswers;
        examState.sections = sections;

        // Hide loading, show questions
        DOMUtils.setDisplay(CONFIG.ELEMENTS.LOADING, 'none');
        DOMUtils.setDisplay(CONFIG.ELEMENTS.QUESTIONS_CONTAINER, 'block');

        // Clear previous content if any
        const questionsContainer = DOMUtils.getElement(CONFIG.ELEMENTS.QUESTIONS_CONTAINER);
        questionsContainer.innerHTML = '';

        // Create exam header
        const headerTitleHTML = DOMUtils.createElement('h2');
        headerTitleHTML.innerHTML = title;
        questionsContainer.appendChild(headerTitleHTML);

        // Add input for student name below the title
        const studentNameDiv = DOMUtils.createDiv();
        studentNameDiv.innerHTML = '<input type="text" id="studentName" name="studentName" placeholder="Ingresa tu nombre" />';
        questionsContainer.appendChild(studentNameDiv);

        // Create questions
        const listOfOptions = DOMUtils.createDiv(CONFIG.CLASSES.QUESTIONS);
        listOfOptions.innerHTML = _generateQuestions(numberOfQuestions, numberOfOptions, sections);
        questionsContainer.appendChild(listOfOptions);

        // Create action button
        const footerHTML = DOMUtils.createDiv();
        footerHTML.innerHTML = `<button type="button" id="${CONFIG.ELEMENTS.ACTION_BUTTON}">${CONFIG.MESSAGES.GRADE}</button>`;
        questionsContainer.appendChild(footerHTML);
    } catch (error) {
        // Hide loading
        DOMUtils.setDisplay(CONFIG.ELEMENTS.LOADING, 'none');
        DOMUtils.setDisplay(CONFIG.ELEMENTS.QUESTIONS_CONTAINER, 'block');

        // Clear previous content and show error message
        const questionsContainer = DOMUtils.getElement(CONFIG.ELEMENTS.QUESTIONS_CONTAINER);
        questionsContainer.innerHTML = '';

        // Create and display error message
        const errorDiv = MessageUtils.createExamLoadErrorMessage(error);
        questionsContainer.appendChild(errorDiv);
    }
}

function _generateQuestions(numberOfQuestions, numberOfOptions, sections) {
    let listOfQuestionsHTML = '';
    let currentSectionIndex = 0;
    let questionIndex = 1;
    
    while (questionIndex <= numberOfQuestions) {
        // Check if we need to render a new section title
        if (
            typeof sections !== 'undefined' &&
            currentSectionIndex < sections.length &&
            questionIndex === sections[currentSectionIndex].start
        ) {
            listOfQuestionsHTML += `<h3>${sections[currentSectionIndex].title}</h3>`;
        }
        
        // Render the question
        const template = `
        <ol start="${questionIndex}">
            <li>
                <div>
                    ${_generateQuestionOptions(questionIndex, numberOfOptions)}
                </div>
            </li>
        </ol>
        `;
        listOfQuestionsHTML += template;
        
        // Check if we need to move to the next section
        if (
            typeof sections !== 'undefined' &&
            currentSectionIndex < sections.length &&
            questionIndex === sections[currentSectionIndex].end
        ) {
            currentSectionIndex++;
        }
        questionIndex++;
    }
    return listOfQuestionsHTML;
}

function _generateQuestionOptions(questionNumber, numOfOptions) {
    const optionsInLetter = DataUtils.makeLetterOptions(numOfOptions);
    
    let listOfOptionsHTML = '';
    for (let index = 0; index < numOfOptions; index++) {
        const template = `
        <label for="question${questionNumber}Option${optionsInLetter[index]}">${optionsInLetter[index]}</label>
        <input type="radio" name="question${questionNumber}" value="${optionsInLetter[index]}" />
        `;
        listOfOptionsHTML += template;
    }

    return listOfOptionsHTML;
}

// Export exam state for other modules
export { generateExamSheet, examState };
