/**
 * QuestionsRepository - Abstract interface for quiz questions data
 * Defines the contract that all repository implementations must follow
 */
class QuestionsRepository {
    constructor() {
        if (this.constructor === QuestionsRepository) {
            throw new Error('QuestionsRepository is abstract and cannot be instantiated directly');
        }
    }

    /**
     * Get quiz data including title and questions
     * @returns {Promise<Object>} Object with title and questions array
     */
    async getQuizData() {
        throw new Error('getQuizData() method must be implemented by subclass');
    }
}

/**
 * MockQuestionsRepository - Implementation using mock data
 */
class MockQuestionsRepository extends QuestionsRepository {
    constructor() {
        super();
    }

    async getQuizData() {
        // Simulate async operation
        return new Promise((resolve) => {
            setTimeout(() => {
                const mathQuestions = [
                    {
                        id: 1,
                        question: "¿Cuánto es 15 + 27?",
                        options: ["40", "42", "43", "41"],
                        correctAnswer: 1
                    },
                    {
                        id: 2,
                        question: "¿Cuál es el resultado de 8 × 6?",
                        options: ["46", "48", "50", "52"],
                        correctAnswer: 1
                    },
                    {
                        id: 3,
                        question: "¿Cuánto es 100 ÷ 4?",
                        options: ["20", "25", "30", "35"],
                        correctAnswer: 1
                    }
                ];

                const spanishQuestions = [
                    {
                        id: 1,
                        question: "¿Cuál es la capital de España?",
                        options: ["Madrid", "Barcelona", "Valencia", "Sevilla"],
                        correctAnswer: 1
                    },
                    {
                        id: 2,
                        question: "¿Cuál es la capital de Argentina?",
                        options: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza"],
                        correctAnswer: 1
                    },
                    {
                        id: 3,
                        question: "¿Cuál es la capital de Chile?",
                        options: ["Santiago", "Valparaíso", "Antofagasta", "Arica"],
                        correctAnswer: 1
                    }
                ];

                // Flatten and add subject info
                const allQuestions = [];
                mathQuestions.forEach(q => {
                    allQuestions.push({ ...q, subject: "Matemáticas" });
                });
                spanishQuestions.forEach(q => {
                    allQuestions.push({ ...q, subject: "Español" });
                });

                // Return comprehensive quiz data
                resolve({
                    title: "Examen simulacion 1",
                    questions: allQuestions
                });
            }, 100); // Small delay to simulate real async operation
        });
    }
}

/**
 * Repository Factory - Creates the appropriate repository instance
 */
class QuestionsRepositoryFactory {
    static create(type) {
        if (type === 'mock') {
            return new MockQuestionsRepository();
        }
        throw new Error(`Unknown repository type: ${type}`);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QuestionsRepository,
        MockQuestionsRepository,
        QuestionsRepositoryFactory
    };
}
