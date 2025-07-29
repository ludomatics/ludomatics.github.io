// Grading service - handles all grading-related business logic
export class GradingService {
    constructor(correctAnswers, sections) {
        this.correctAnswers = correctAnswers;
        this.sections = sections;
    }
    
    gradeAnswers(answers) {
        let correctCount = 0;
        let results = [];
        let sectionsBreakdown = this._initializeSectionsBreakdown();
        
        for (let i = 0; i < answers.length; i++) {
            const isCorrect = answers[i] === this.correctAnswers[i];
            results.push(isCorrect);
            
            if (isCorrect) {
                correctCount++;
                this._updateSectionBreakdown(i, sectionsBreakdown);
            }
        }
        
        return {
            correctCount,
            results,
            sectionsBreakdown
        };
    }
    
    _initializeSectionsBreakdown() {
        if (!this.sections || !Array.isArray(this.sections)) {
            return [];
        }
        
        return this.sections.map(section => ({
            title: section.title,
            correctCount: 0
        }));
    }
    
    _updateSectionBreakdown(questionIndex, sectionsBreakdown) {
        if (!this.sections || !Array.isArray(this.sections)) {
            return;
        }
        
        for (let s = 0; s < this.sections.length; s++) {
            if (questionIndex + 1 >= this.sections[s].start && 
                questionIndex + 1 <= this.sections[s].end) {
                sectionsBreakdown[s].correctCount++;
                break;
            }
        }
    }
    
    getSectionTotalQuestions(sectionIndex) {
        if (!this.sections || !this.sections[sectionIndex]) {
            return 0;
        }
        
        const section = this.sections[sectionIndex];
        return section.end - section.start + 1;
    }
} 
