const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

class StudyManager {
    constructor() {
        this.subjectsFile = config.SUBJECTS_FILE;
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
            fs.ensureDirSync(path.dirname(this.subjectsFile));
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
                    { title: 'Quadratic Equations', content: 'ax² + bx + c = 0. Solve using factoring, quadratic formula, or completing the square.' },
                    { title: 'Calculus Introduction', content: 'Derivatives measure rates of change. Integrals measure accumulation.' },
                    { title: 'Statistics', content: 'Mean, median, mode, range, and probability.' }
                ],
                notes: '📐 **Key Formulas:**\n• Quadratic: x = (-b ± √(b² - 4ac)) / 2a\n• Derivative: d/dx(x^n) = nx^(n-1)\n• Integral: ∫x^n dx = x^(n+1)/(n+1) + C\n• Pythagorean: a² + b² = c²',
                videos: ['https://youtube.com/watch?v=...', 'https://youtube.com/watch?v=...'],
                books: ['Mathematics Textbook', 'Calculus Made Easy', 'Algebra Workbook']
            },
            'Physics': {
                lessons: [
                    { title: 'Mechanics', content: 'Study of motion, forces, and energy. Key concepts: velocity, acceleration, force, work, energy.' },
                    { title: 'Optics', content: 'Study of light and its properties. Key concepts: reflection, refraction, lenses, mirrors.' },
                    { title: 'Electricity', content: 'Study of electric charge, current, voltage, resistance. Ohm\'s Law: V = IR.' },
                    { title: 'Magnetism', content: 'Study of magnetic fields and forces. Key concepts: electromagnetism, induction.' },
                    { title: 'Modern Physics', content: 'Quantum mechanics, relativity, photoelectric effect.' }
                ],
                notes: '⚡ **Key Formulas:**\n• F = ma (Newton\'s 2nd Law)\n• v = u + at\n• KE = ½mv²\n• V = IR (Ohm\'s Law)\n• E = mc²',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Physics Textbook', 'Mechanics Workbook']
            },
            'Chemistry': {
                lessons: [
                    { title: 'Atomic Structure', content: 'Atoms consist of protons, neutrons, and electrons. Key concepts: atomic number, mass number, isotopes.' },
                    { title: 'Periodic Table', content: 'Elements organized by atomic number, groups, and periods.' },
                    { title: 'Chemical Bonding', content: 'Types of bonds: ionic, covalent, metallic. Key concepts: valence electrons, Lewis structures.' },
                    { title: 'Stoichiometry', content: 'Study of quantitative relationships in chemical reactions.' },
                    { title: 'Organic Chemistry', content: 'Study of carbon-containing compounds. Key concepts: functional groups, isomers.' }
                ],
                notes: '🧪 **Key Formulas:**\n• n = m/M (moles)\n• PV = nRT (Ideal Gas Law)\n• pH = -log[H+]\n• ΔG = ΔH - TΔS',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Chemistry Textbook', 'Organic Chemistry Guide']
            },
            'Biology': {
                lessons: [
                    { title: 'Cell Structure', content: 'Cells are the basic unit of life. Key organelles: nucleus, mitochondria, ribosomes, cell membrane.' },
                    { title: 'Genetics', content: 'Study of heredity and variation. Key concepts: DNA, genes, chromosomes, inheritance.' },
                    { title: 'Human Body Systems', content: 'Study of organ systems: circulatory, respiratory, digestive, nervous, etc.' },
                    { title: 'Ecology', content: 'Study of relationships between organisms and their environment.' },
                    { title: 'Evolution', content: 'Study of how species change over time. Key concepts: natural selection, adaptation.' }
                ],
                notes: '🧬 **Key Topics:**\n• Mitosis vs Meiosis\n• DNA Structure\n• Photosynthesis & Respiration\n• Homeostasis\n• Biodiversity',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Biology Textbook', 'Human Anatomy Guide']
            },
            'English': {
                lessons: [
                    { title: 'Grammar', content: 'Study of sentence structure, parts of speech, tenses, and punctuation.' },
                    { title: 'Vocabulary', content: 'Building word knowledge for reading comprehension and writing.' },
                    { title: 'Essay Writing', content: 'Structure of essays: introduction, body, conclusion. Key concepts: thesis, evidence, analysis.' },
                    { title: 'Reading Comprehension', content: 'Strategies for understanding and analyzing texts.' },
                    { title: 'Literature', content: 'Study of literary works, genres, and techniques.' }
                ],
                notes: '📖 **Key Topics:**\n• Tenses (Past, Present, Future)\n• Active vs Passive Voice\n• Reported Speech\n• Essay Structure\n• Literary Devices',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['English Textbook', 'Grammar Workbook']
            },
            'Geography': {
                lessons: [
                    { title: 'Physical Geography', content: 'Study of Earth\'s physical features: landforms, water bodies, climate, and weather.' },
                    { title: 'Human Geography', content: 'Study of human populations, cultures, and economic activities.' },
                    { title: 'Ethiopian Geography', content: 'Study of Ethiopia\'s physical and human geography.' },
                    { title: 'Climate and Weather', content: 'Study of atmospheric patterns and climate change.' },
                    { title: 'Natural Resources', content: 'Study of Earth\'s resources and their management.' }
                ],
                notes: '🌍 **Key Topics:**\n• Map Reading\n• Ethiopian Regions\n• Climate Zones\n• Population Distribution\n• Natural Resources',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Geography Textbook']
            },
            'History': {
                lessons: [
                    { title: 'Ethiopian History', content: 'Study of Ethiopia\'s ancient kingdoms, empires, and modern history.' },
                    { title: 'World History', content: 'Study of major world civilizations, empires, and global events.' },
                    { title: 'African History', content: 'Study of Africa\'s rich history and civilizations.' }
                ],
                notes: '📜 **Key Topics:**\n• Ancient Ethiopia\n• The Aksumite Empire\n• The Solomonic Dynasty\n• Modern Ethiopia\n• World Wars',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['History Textbook']
            },
            'ICT': {
                lessons: [
                    { title: 'Computer Basics', content: 'Introduction to hardware, software, and operating systems.' },
                    { title: 'Internet and Networking', content: 'How computers communicate and share information.' },
                    { title: 'Programming Basics', content: 'Introduction to coding concepts and languages.' },
                    { title: 'Digital Literacy', content: 'Using technology safely and effectively.' }
                ],
                notes: '💻 **Key Topics:**\n• Hardware Components\n• Software Types\n• Network Topologies\n• Programming Concepts\n• Online Safety',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['ICT Textbook']
            },
            'Economics': {
                lessons: [
                    { title: 'Microeconomics', content: 'Study of individual economic decisions and markets.' },
                    { title: 'Macroeconomics', content: 'Study of national and global economies.' },
                    { title: 'Development Economics', content: 'Study of economic growth and development.' }
                ],
                notes: '💹 **Key Topics:**\n• Supply and Demand\n• Market Structures\n• GDP and Growth\n• Inflation\n• International Trade',
                videos: ['https://youtube.com/watch?v=...'],
                books: ['Economics Textbook']
            }
        };
    }

    getLessons(subject) {
        return this.data[subject]?.lessons || [];
    }

    getNotes(subject) {
        return this.data[subject]?.notes || '📝 No notes available for this subject. Upload a book for more content!';
    }

    getVideos(subject) {
        return this.data[subject]?.videos || [];
    }

    getBooks(subject) {
        return this.data[subject]?.books || [];
    }

    getQuiz(subject, grade = 8) {
        // Generate sample quiz questions based on subject and grade
        const quizzes = {
            'Mathematics': [
                { question: 'What is 2x + 3 = 7? Solve for x.', options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'], answer: 0 },
                { question: 'What is the area of a circle with radius r?', options: ['πr²', '2πr', 'πd', 'πr'], answer: 0 },
                { question: 'What is the derivative of x²?', options: ['2x', 'x²', '2', 'x'], answer: 0 },
                { question: 'What is the Pythagorean theorem?', options: ['a² + b² = c²', 'a + b = c', 'a² - b² = c²', 'a × b = c'], answer: 0 },
                { question: 'What is the slope of y = 2x + 3?', options: ['2', '3', '1', '0'], answer: 0 }
            ],
            'Physics': [
                { question: 'What is Newton\'s First Law?', options: ['Inertia', 'F = ma', 'Action-Reaction', 'Energy Conservation'], answer: 0 },
                { question: 'What is the unit of force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'], answer: 0 },
                { question: 'What is the speed of light?', options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s'], answer: 0 },
                { question: 'What is Ohm\'s Law?', options: ['V = IR', 'V = IR²', 'V = I/R', 'V = R/I'], answer: 0 },
                { question: 'What is the formula for kinetic energy?', options: ['½mv²', 'mv²', 'mgh', '½mgh'], answer: 0 }
            ],
            'Chemistry': [
                { question: 'What is the chemical formula for water?', options: ['H₂O', 'CO₂', 'NaCl', 'HCl'], answer: 0 },
                { question: 'What is the atomic number of Carbon?', options: ['6', '12', '14', '8'], answer: 0 },
                { question: 'What is the pH of pure water?', options: ['7', '0', '14', '1'], answer: 0 },
                { question: 'What is the ideal gas law?', options: ['PV = nRT', 'PV = nT', 'P = nRT/V', 'V = nRT/P'], answer: 0 },
                { question: 'What type of bond is NaCl?', options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], answer: 0 }
            ],
            'Biology': [
                { question: 'What is the powerhouse of the cell?', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi'], answer: 0 },
                { question: 'What is the genetic material?', options: ['DNA', 'RNA', 'Protein', 'Lipid'], answer: 0 },
                { question: 'What is photosynthesis?', options: ['Making food with sunlight', 'Cell division', 'Protein synthesis', 'Cellular respiration'], answer: 0 },
                { question: 'What are the 4 bases in DNA?', options: ['ATGC', 'AUGC', 'ATCG', 'AUCG'], answer: 0 },
                { question: 'What is the largest organ in the body?', options: ['Skin', 'Liver', 'Brain', 'Heart'], answer: 0 }
            ],
            'English': [
                { question: 'What is the past tense of "go"?', options: ['went', 'gone', 'goes', 'going'], answer: 0 },
                { question: 'What is a noun?', options: ['A person, place, or thing', 'An action', 'A description', 'A position'], answer: 0 },
                { question: 'What is the correct sentence?', options: ['I am happy', 'I is happy', 'I are happy', 'I be happy'], answer: 0 },
                { question: 'What is the plural of "child"?', options: ['children', 'childs', 'childrens', 'child'], answer: 0 },
                { question: 'What is an adjective?', options: ['A word that describes', 'A word that shows action', 'A word that names', 'A word that joins'], answer: 0 }
            ]
        };

        return quizzes[subject] || [
            { question: 'What is the meaning of this subject?', options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 0 }
        ];
    }

    addLesson(subject, title, content) {
        if (!this.data[subject]) {
            this.data[subject] = { lessons: [], notes: '', videos: [], books: [] };
        }
        this.data[subject].lessons.push({ title, content });
        this.saveData();
        return true;
    }

    updateNotes(subject, notes) {
        if (this.data[subject]) {
            this.data[subject].notes = notes;
            this.saveData();
            return true;
        }
        return false;
    }

    addVideo(subject, videoUrl) {
        if (this.data[subject]) {
            this.data[subject].videos.push(videoUrl);
            this.saveData();
            return true;
        }
        return false;
    }

    addBook(subject, bookTitle) {
        if (this.data[subject]) {
            this.data[subject].books.push(bookTitle);
            this.saveData();
            return true;
        }
        return false;
    }

    getAllSubjects() {
        return Object.keys(this.data);
    }

    searchLessons(query) {
        const results = [];
        for (const [subject, data] of Object.entries(this.data)) {
            const lessons = data.lessons || [];
            for (const lesson of lessons) {
                if (lesson.title.toLowerCase().includes(query.toLowerCase()) ||
                    lesson.content.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ subject, lesson });
                }
            }
        }
        return results;
    }
}

module.exports = new StudyManager();
