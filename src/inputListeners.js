import { CONFIG } from './config.js';
import { DOMUtils, ValidationUtils, DataUtils } from './utils.js';
import { GradingService } from './gradingService.js';
import { ResultsRenderer } from './resultsRenderer.js';
import { examState } from './questionGenerator.js';

function inputListeners() {
    const actionButton = DOMUtils.getElement(CONFIG.ELEMENTS.ACTION_BUTTON);
    if (actionButton) {
        actionButton.addEventListener('click', handleGradeClick);
    }
}

function handleGradeClick() {
    // Validate student name input
    if (!ValidationUtils.isStudentNameValid()) {
        alert(CONFIG.MESSAGES.ENTER_NAME);
        return;
    }
    
    if (!ValidationUtils.areAllQuestionsAnswered()) {
        alert(CONFIG.MESSAGES.ANSWER_ALL);
        return;
    }
    
    // Proceed with grading logic
    const answers = DataUtils.getSelectedAnswers();
    const gradingService = new GradingService(examState.correctAnswers, examState.sections);
    const { correctCount, results, sectionsBreakdown } = gradingService.gradeAnswers(answers);
    
    const resultsRenderer = new ResultsRenderer(gradingService);
    resultsRenderer.showResults(answers, results, correctCount, sectionsBreakdown);
}

export { inputListeners };
