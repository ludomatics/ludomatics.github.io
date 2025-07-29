import { CONFIG } from './config.js';

export class ExamService {
    /**
     * Creates a new ExamService instance
     * @param {string} examFileName - Name of the exam JSON file
     */
    constructor(examFileName) {
        this.examFilePath = examFileName
    }

    /**
     * Fetches exam data from the JSON configuration file
     * @returns {Promise<Object>} Exam data object
     * @throws {Error} When fetch fails or JSON is invalid
     */
    async fetchExamData() {
        try {
            // Fetch the JSON file
            const response = await fetch(this.examFilePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const examData = await response.json();
            
            // Calculate number of questions from correctAnswers array
            const numberOfQuestions = examData.correctAnswers.length;
            
            return {
                numberOfQuestions: numberOfQuestions,
                numberOfOptions: examData.numberOfOptions || CONFIG.DEFAULT_OPTIONS,
                examSheetName: examData.title,
                correctAnswers: examData.correctAnswers,
                sections: examData.sections
            };
        } catch (error) {
            console.error('Error fetching exam data:', error);
            throw error; // Let the caller handle the error
        }
    }
} 
