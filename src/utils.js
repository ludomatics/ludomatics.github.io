import { CONFIG } from './config.js';

// DOM utility functions
export class DOMUtils {
    static getElement(id) {
        return document.getElementById(id);
    }
    
    static createElement(tag, className = '', id = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (id) element.id = id;
        return element;
    }
    
    static createDiv(className = '', id = '') {
        return this.createElement('div', className, id);
    }
    
    static insertAfter(newElement, referenceElement) {
        if (referenceElement && referenceElement.parentNode) {
            referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
        }
    }
    
    static disableElement(id) {
        const element = this.getElement(id);
        if (element) element.disabled = true;
    }
    
    static setDisplay(id, display) {
        const element = this.getElement(id);
        if (element) element.style.display = display;
    }
}

// Validation utilities
export class ValidationUtils {
    static isStudentNameValid() {
        const studentNameInput = DOMUtils.getElement(CONFIG.ELEMENTS.STUDENT_NAME);
        return studentNameInput && studentNameInput.value.trim() !== '';
    }
    
    static areAllQuestionsAnswered() {
        const questionRadios = document.querySelectorAll('input[type="radio"]');
        const questionNames = new Set();
        questionRadios.forEach(radio => questionNames.add(radio.name));
        
        for (const name of questionNames) {
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            if (!checked) return false;
        }
        return true;
    }
}

// Data processing utilities
export class DataUtils {
    static getSelectedAnswers() {
        const questionRadios = document.querySelectorAll('input[type="radio"]');
        const questionNames = Array.from(new Set(Array.from(questionRadios).map(radio => radio.name)));
        
        // Sort by question number
        questionNames.sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ''));
            const numB = parseInt(b.replace(/\D/g, ''));
            return numA - numB;
        });
        
        return questionNames.map(name => {
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            return checked ? checked.value : null;
        });
    }
    
    static makeLetterOptions(numOfOptions) {
        const optionInLetter = ['A', 'B', 'C', 'D', 'E'];
        return optionInLetter.slice(0, numOfOptions);
    }
}

// UI message utilities
export class MessageUtils {
    /**
     * Creates an error message element for display
     * @param {string} title - Error title
     * @param {string} message - Error message
     * @param {string} details - Technical details (optional)
     * @param {string} actionText - Action button text (optional)
     * @param {Function} actionCallback - Action button callback (optional)
     * @returns {HTMLElement} Error message div element
     */
    static createErrorMessage(title, message, details = '', actionText = '', actionCallback = null) {
        const errorDiv = DOMUtils.createDiv();
        errorDiv.style.cssText = 'text-align: center; color: #d32f2f; padding: 20px; background-color: #ffebee; border: 1px solid #f44336; border-radius: 4px; margin: 20px 0;';
        
        let actionButton = '';
        if (actionText && actionCallback) {
            actionButton = `
                <button type="button" onclick="${actionCallback}" style="background-color: #2196f3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    ${actionText}
                </button>
            `;
        }
        
        errorDiv.innerHTML = `
            <h3>${title}</h3>
            <p>${message}</p>
            ${details ? `<p><strong>Detalles del error:</strong> ${details}</p>` : ''}
            ${actionButton}
        `;
        
        return errorDiv;
    }
    
    /**
     * Creates a standard exam loading error message
     * @param {Error} error - The error object
     * @returns {HTMLElement} Error message div element
     */
    static createExamLoadErrorMessage(error) {
        return this.createErrorMessage(
            'Error al cargar el examen',
            'No se pudo cargar la información del examen. Por favor, verifica que el archivo de configuración esté disponible e intenta nuevamente.',
            error.message,
            'Reintentar',
            'location.reload()'
        );
    }
} 
