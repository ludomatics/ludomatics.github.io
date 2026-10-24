// Exam Service - handles loading and managing exam data
export class ExamService {
    constructor() {
        this.examData = null;
    }

    /**
     * Load exam data from a JSON file
     * @param {string} examPath - The exam's JSON file, relative to the page (e.g. "universidad-unam-2020-3.json")
     * @returns {Promise<Object>} The exam data
     */
    async loadExamData(examPath) {
        try {
            const response = await fetch(examPath);
            if (!response.ok) {
                throw new Error(`Failed to load exam data: ${response.statusText}`);
            }
            this.examData = await response.json();
            return this.examData;
        } catch (error) {
            console.error('Error loading exam data:', error);
            throw error;
        }
    }

    /**
     * Validate exam data structure
     * @param {Object} data - The exam data to validate
     * @returns {boolean} True if valid, false otherwise
     */
    validateExamData(data) {
        const requiredFields = ['title', 'numberOfOptions', 'correctAnswers'];
        
        for (const field of requiredFields) {
            if (!data.hasOwnProperty(field)) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
        }

        if (!Array.isArray(data.correctAnswers)) {
            console.error('correctAnswers must be an array');
            return false;
        }

        // Calculate numberOfQuestions from correctAnswers length
        const calculatedNumberOfQuestions = data.correctAnswers.length;
        
        // If numberOfQuestions is provided, validate it matches the calculated value
        if (data.hasOwnProperty('numberOfQuestions') && data.numberOfQuestions !== calculatedNumberOfQuestions) {
            console.error('Provided numberOfQuestions does not match correctAnswers length');
            return false;
        }

        return true;
    }
}

// Create a singleton instance
export const examService = new ExamService(); 
