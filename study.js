const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

class StudyManager {
    constructor() {
        // Use config or fallback
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
            this.saveData();
        }
    }

    saveData() {
        try {
            // Ensure directory exists
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
                    { title: 'Algebra Basics', content: 'Algebra uses variables to represent numbers. Key concepts: variables, expressions, equations.' },
                    { title: 'Linear Equations', content: 'A linear equation is ax + b = 0. To solve: isolate x.' },
                    { title: 'Quadratic Equations', content: 'ax² + bx + c = 0. Solve using factoring, quadratic formula, or completing the square.' }
                ],
                notes: '📐 **Key Formulas:**\n• Quadratic: x = (-b ± √(b² - 4ac)) / 2a\n• Derivative: d/dx(x^n) = nx^(n-1)\n• Pythagorean: a² + b² = c²',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Mathematics Textbook']
            },
            'Physics': {
                lessons: [
                    { title: 'Mechanics', content: 'Study of motion, forces, and energy.' },
                    { title: 'Optics', content: 'Study of light and its properties.' }
                ],
                notes: '⚡ **Key Formulas:**\n• F = ma\n• v = u + at\n• KE = ½mv²\n• V = IR',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Physics Textbook']
            },
            'Chemistry': {
                lessons: [
                    { title: 'Atomic Structure', content: 'Atoms consist of protons, neutrons, and electrons.' },
                    { title: 'Periodic Table', content: 'Elements organized by atomic number.' }
                ],
                notes: '🧪 **Key Formulas:**\n• n = m/M\n• PV = nRT\n• pH = -log[H+]',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Chemistry Textbook']
            },
            'Biology': {
                lessons: [
                    { title: 'Cell Structure', content: 'Cells are the basic unit of life.' },
                    { title: 'Genetics', content: 'Study of heredity and variation.' }
                ],
                notes: '🧬 **Key Topics:**\n• Mitosis vs Meiosis\n• DNA Structure\n• Photosynthesis',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Biology Textbook']
            },
            'English': {
                lessons: [
                    { title: 'Grammar', content: 'Study of sentence structure and parts of speech.' },
                    { title: 'Essay Writing', content: 'Structure of essays: introduction, body, conclusion.' }
                ],
                notes: '📖 **Key Topics:**\n• Tenses\n• Active vs Passive Voice\n• Essay Structure',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['English Textbook']
            },
            'Geography': {
                lessons: [
                    { title: 'Physical Geography', content: 'Study of Earth\'s physical features.' },
                    { title: 'Human Geography', content: 'Study of human populations and cultures.' }
                ],
                notes: '🌍 **Key Topics:**\n• Map Reading\n• Ethiopian Regions\n• Climate Zones',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Geography Textbook']
            },
            'History': {
                lessons: [
                    { title: 'Ethiopian History', content: 'Study of Ethiopia\'s ancient kingdoms.' },
                    { title: 'World History', content: 'Study of major world civilizations.' }
                ],
                notes: '📜 **Key Topics:**\n• Ancient Ethiopia\n• Aksumite Empire\n• Modern Ethiopia',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['History Textbook']
            },
            'ICT': {
                lessons: [
                    { title: 'Computer Basics', content: 'Introduction to hardware and software.' },
                    { title: 'Internet and Networking', content: 'How computers communicate.' }
                ],
                notes: '💻 **Key Topics:**\n• Hardware Components\n• Software Types\n• Network Topologies',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['ICT Textbook']
            },
            'Economics': {
                lessons: [
                    { title: 'Microeconomics', content: 'Study of individual economic decisions.' },
                    { title: 'Macroeconomics', content: 'Study of national and global economies.' }
                ],
                notes: '💹 **Key Topics:**\n• Supply and Demand\n• Market Structures\n• GDP and Growth',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Economics Textbook']
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
                { question: 'What is the area of a circle?', options: ['πr²', '2πr', 'πd', 'πr'], correct: 0 },
                { question: 'What is the derivative of x²?', options: ['2x', 'x²', '2', 'x'], correct: 0 }
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
