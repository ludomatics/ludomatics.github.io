// Initialize questions repository (using factory pattern)
const questionsRepository = QuestionsRepositoryFactory.create('mock');

// Questions data (will be populated from repository)
let allQuestions = [];

// User answers storage
let userAnswers = [];
let currentQuestionIndex = 0;

// DOM elements
const examTitle = document.querySelector('.exam-title');
const subjectElement = document.querySelector('.subject');
const questionText = document.querySelector('.question-text');
const optionsList = document.querySelector('.options-list');
const btnPrevious = document.querySelector('.btn-previous');
const btnNext = document.querySelector('.btn-next');

// Initialize the quiz
async function initQuiz() {
    try {
        // Load quiz data from repository
        const quizData = await questionsRepository.getQuizData();
        
        // Extract title and questions
        quizTitle = quizData.title;
        allQuestions = quizData.questions;
        
        // Set exam title
        examTitle.textContent = quizTitle;
        
        // Initialize user answers array
        userAnswers = new Array(allQuestions.length).fill(null);
        
        // Display first question
        displayQuestion(currentQuestionIndex);
        updateNavigationButtons();
        
        console.log(`Loaded "${quizTitle}" with ${allQuestions.length} questions from repository`);
    } catch (error) {
        console.error('Error initializing quiz:', error);
        // Show error message to user
        questionText.textContent = 'Error loading questions. Please refresh the page.';
    }
}

// Display a specific question
function displayQuestion(index) {
    const question = allQuestions[index];
    
    // Update subject header
    subjectElement.textContent = question.subject;
    
    // Use sequential question number (index + 1) instead of question.id
    questionText.textContent = `${index + 1}. ${question.question}`;
    
    // Clear and recreate options
    optionsList.innerHTML = '';
    question.options.forEach((option, optionIndex) => {
        const label = document.createElement('label');
        label.className = 'option-item';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `question${index + 1}`;
        radio.value = optionIndex;
        
        // Check if user previously answered this question
        if (userAnswers[index] === optionIndex) {
            radio.checked = true;
        }
        
        // Add change event to save answer
        radio.addEventListener('change', () => {
            userAnswers[index] = optionIndex;
        });
        
        const optionText = document.createElement('span');
        optionText.className = 'option-text';
        optionText.textContent = option;
        
        label.appendChild(radio);
        label.appendChild(optionText);
        optionsList.appendChild(label);
    });
}

// Update navigation buttons
function updateNavigationButtons() {
    // Previous button styling
    if (currentQuestionIndex === 0) {
        btnPrevious.disabled = true;
        btnPrevious.className = 'btn btn-previous';
    } else {
        btnPrevious.disabled = false;
        btnPrevious.className = 'btn btn-next';
    }
    
    // Next button styling and text
    if (currentQuestionIndex === allQuestions.length - 1) {
        btnNext.textContent = 'Terminar';
        btnNext.className = 'btn btn-finish';
    } else {
        btnNext.textContent = 'Siguiente';
        btnNext.className = 'btn btn-next';
    }
}

// Navigation event listeners
btnPrevious.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion(currentQuestionIndex);
        updateNavigationButtons();
    }
});

btnNext.addEventListener('click', () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
        updateNavigationButtons();
    } else {
        // Last question - show completion alert
        alert('¡Examen completado! Estamos trabajando en la calificación del examen.');
    }
});

// Initialize the quiz when page loads
document.addEventListener('DOMContentLoaded', initQuiz);
