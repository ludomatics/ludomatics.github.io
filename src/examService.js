// Exam Service - handles loading and managing exam data
export class ExamService {
    constructor() {
        this.examData = null;
    }

    /**
     * Load exam data from a JSON file
     * @param {string} examName - The name of the exam file (without extension)
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
     * Set exam data directly (for embedded data)
     * @param {Object} data - The exam data object
     */
    setExamData(data) {
        this.examData = data;
        return this.examData;
    }

    /**
     * Get the current exam data
     * @returns {Object|null} The current exam data
     */
    getExamData() {
        return this.examData;
    }

    /**
     * Get exam data from embedded script or load from JSON
     * @param {string} examName - The name of the exam file (without extension)
     * @returns {Promise<Object>} The exam data
     */
    async getExamDataFromEmbeddedOrFile(examName) {
        // First try to get embedded data from the current page
        const embeddedData = this.getEmbeddedExamData();
        if (embeddedData) {
            this.setExamData(embeddedData);
            return embeddedData;
        }

        // If no embedded data, try to load from JSON file
        return await this.loadExamData(examName);
    }

    /**
     * Extract embedded exam data from the current page
     * @returns {Object|null} The embedded exam data or null if not found
     */
    getEmbeddedExamData() {
        // Look for embedded exam data in script tags
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const content = script.textContent || script.innerHTML;
            if (content.includes('examData') && content.includes('correctAnswers')) {
                try {
                    // Extract the examData object from the script
                    const match = content.match(/const examData = ({[\s\S]*?});/);
                    if (match) {
                        const examDataString = match[1];
                        return JSON.parse(examDataString);
                    }
                } catch (error) {
                    console.warn('Could not parse embedded exam data:', error);
                }
            }
        }
        return null;
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
