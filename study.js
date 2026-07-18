const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

class StudyManager {
    constructor() {
        this.subjectsFile = config.SUBJECTS_FILE || path.join(__dirname, 'data', 'subjects.json');
        this.data = {};
        this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(this.subjectsFile)) {
                this.data = fs.readJsonSync(this.subjectsFile);
            } else {
                this.data = this.getDefaultData();
                this.saveData();
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
            this.data = this.getDefaultData();
        }
    }

    saveData() {
        try {
            const dir = path.dirname(this.subjectsFile);
            fs.ensureDirSync(dir);
            fs.writeJsonSync(this.subjectsFile, this.data, { spaces: 2 });
        } catch (error) {
            console.error('Error saving subjects:', error);
        }
    }

    getDefaultData() {
        return {
            'Mathematics': {
                lessons: [
                    { title: 'Algebra Basics', content: 'Algebra uses variables to represent numbers.' },
                    { title: 'Linear Equations', content: 'A linear equation is ax + b = 0.' }
                ],
                notes: '📐 Key Formulas: Quadratic formula, Derivative rules',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Mathematics Textbook']
            },
            'Physics': {
                lessons: [
                    { title: 'Mechanics', content: 'Study of motion, forces, and energy.' },
                    { title: 'Optics', content: 'Study of light and its properties.' }
                ],
                notes: '⚡ Key Formulas: F=ma, V=IR',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Physics Textbook']
            },
            'Chemistry': {
                lessons: [
                    { title: 'Atomic Structure', content: 'Atoms consist of protons, neutrons, and electrons.' },
                    { title: 'Periodic Table', content: 'Elements organized by atomic number.' }
                ],
                notes: '🧪 Key Formulas: n=m/M, PV=nRT',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Chemistry Textbook']
            },
            'Biology': {
                lessons: [
                    { title: 'Cell Structure', content: 'Cells are the basic unit of life.' },
                    { title: 'Genetics', content: 'Study of heredity and variation.' }
                ],
                notes: '🧬 Key Topics: Mitosis, Meiosis, DNA Structure',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Biology Textbook']
            },
            'English': {
                lessons: [
                    { title: 'Grammar', content: 'Study of sentence structure and parts of speech.' },
                    { title: 'Essay Writing', content: 'Structure of essays: introduction, body, conclusion.' }
                ],
                notes: '📖 Key Topics: Tenses, Active vs Passive Voice',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['English Textbook']
            }
        };
    }

    getLessons(subject) {
        return this.data[subject]?.lessons || [];
    }

    getNotes(subject) {
        return this.data[subject]?.notes || '📝 No notes available.';
    }

    getVideos(subject) {
        return this.data[subject]?.videos || [];
    }

    getBooks(subject) {
        return this.data[subject]?.books || [];
    }

    getQuiz(subject) {
        const quizzes = {
            'Mathematics': [
                { question: 'What is 2x + 3 = 7?', options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'], correct: 0 },
                { question: 'What is the area of a circle?', options: ['πr²', '2πr', 'πd', 'πr'], correct: 0 }
            ],
            'Physics': [
                { question: 'What is Newton\'s First Law?', options: ['Inertia', 'F=ma', 'Action-Reaction', 'Energy'], correct: 0 },
                { question: 'What is the unit of force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'], correct: 0 }
            ],
            'Biology': [
                { question: 'What is the powerhouse of the cell?', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi'], correct: 0 },
                { question: 'What is DNA?', options: ['Genetic material', 'Protein', 'Sugar', 'Lipid'], correct: 0 }
            ]
        };
        return quizzes[subject] || quizzes['Mathematics'];
    }

    getAllSubjects() {
        return Object.keys(this.data);
    }
}

module.exports = new StudyManager();
