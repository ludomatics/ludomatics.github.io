import { CONFIG } from './config.js';
import { DOMUtils } from './utils.js';

// Results renderer - handles all UI updates when showing results
export class ResultsRenderer {
    constructor(gradingService) {
        this.gradingService = gradingService;
    }
    
    showResults(answers, results, correctCount, sectionsBreakdown) {
        this._disableFormElements();
        this._updateActionButton();
        this._addQuestionFeedback(results);
        this._showTotalScore(correctCount, answers.length);
        this._showSectionsSummary(sectionsBreakdown);
        this._updateSectionTitles(sectionsBreakdown);
    }
    
    _disableFormElements() {
        // Disable radio buttons
        const radios = document.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => radio.disabled = true);
        
        // Disable student name input
        DOMUtils.disableElement(CONFIG.ELEMENTS.STUDENT_NAME);
    }
    
    _updateActionButton() {
        const actionButton = DOMUtils.getElement(CONFIG.ELEMENTS.ACTION_BUTTON);
        if (actionButton) {
            actionButton.textContent = CONFIG.MESSAGES.RETURN;
            
            // Replace button to remove previous listeners
            const newButton = actionButton.cloneNode(true);
            actionButton.parentNode.replaceChild(newButton, actionButton);
            newButton.addEventListener('click', () => window.location.reload());
        }
    }
    
    _addQuestionFeedback(results) {
        const questionDivs = document.querySelectorAll('.questions ol > li > div');
        
        for (let i = 0; i < questionDivs.length; i++) {
            // Remove previous feedback
            const oldFeedback = questionDivs[i].querySelector(`.${CONFIG.CLASSES.FEEDBACK}`);
            if (oldFeedback) oldFeedback.remove();
            
            // Create new feedback
            const feedback = DOMUtils.createElement('span', CONFIG.CLASSES.FEEDBACK);
            feedback.style.marginLeft = '1em';
            
            if (results[i]) {
                feedback.style.color = 'green';
                feedback.textContent = '✔';
            } else {
                feedback.style.color = 'red';
                feedback.textContent = `✘(${this.gradingService.correctAnswers[i]})`;
            }
            
            questionDivs[i].appendChild(feedback);
        }
    }
    
    _showTotalScore(correctCount, totalQuestions) {
        let totalDiv = DOMUtils.getElement(CONFIG.CLASSES.TOTAL_CORRECT);
        if (!totalDiv) {
            totalDiv = DOMUtils.createDiv('', CONFIG.CLASSES.TOTAL_CORRECT);
            totalDiv.style.marginTop = '1em';
        }
        
        totalDiv.innerHTML = `<strong>${CONFIG.MESSAGES.SCORE_TOTAL} ${correctCount} de ${totalQuestions}</strong>`;
        
        // Insert after student name input
        const studentNameInput = DOMUtils.getElement(CONFIG.ELEMENTS.STUDENT_NAME);
        if (studentNameInput && studentNameInput.parentNode) {
            studentNameInput.parentNode.insertAdjacentElement('afterend', totalDiv);
        }
    }
    
    _showSectionsSummary(sectionsBreakdown) {
        let sectionsSummaryDiv = DOMUtils.getElement(CONFIG.CLASSES.SECTIONS_SUMMARY);
        if (!sectionsSummaryDiv) {
            sectionsSummaryDiv = DOMUtils.createDiv('', CONFIG.CLASSES.SECTIONS_SUMMARY);
            sectionsSummaryDiv.style.marginTop = '1em';
        }
        
        let sectionsSummaryHTML = `<strong>${CONFIG.MESSAGES.SCORE_BY_SUBJECT}</strong><br>`;
        
        if (sectionsBreakdown && sectionsBreakdown.length > 0) {
            sectionsSummaryHTML += '<ul style="margin: 0.5em 0; padding-left: 1.5em;">';
            sectionsBreakdown.forEach((section, idx) => {
                const totalQuestions = this.gradingService.getSectionTotalQuestions(idx);
                sectionsSummaryHTML += `<li>${section.title}: ${section.correctCount}/${totalQuestions}</li>`;
            });
            sectionsSummaryHTML += '</ul>';
        }
        
        sectionsSummaryDiv.innerHTML = sectionsSummaryHTML;
        
        // Insert after total-correct div
        const totalDiv = DOMUtils.getElement(CONFIG.CLASSES.TOTAL_CORRECT);
        if (totalDiv && totalDiv.parentNode) {
            totalDiv.insertAdjacentElement('afterend', sectionsSummaryDiv);
        }
    }
    
    _updateSectionTitles(sectionsBreakdown) {
        const questionsContainer = DOMUtils.getElement(CONFIG.ELEMENTS.QUESTIONS_CONTAINER);
        const sectionTitles = questionsContainer.querySelectorAll('h3');
        
        sectionTitles.forEach((h3, idx) => {
            if (sectionsBreakdown && sectionsBreakdown[idx]) {
                const sectionText = h3.textContent.replace(/\s*\d+\/\d+$/, '');
                const totalQuestions = this.gradingService.getSectionTotalQuestions(idx);
                h3.textContent = `${sectionText.trim()} ${sectionsBreakdown[idx].correctCount}/${totalQuestions}`;
            }
        });
    }
} 
