const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

class Library {
    constructor() {
        this.libraryFile = config.LIBRARY_FILE;
        this.data = {};
        this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(this.libraryFile)) {
                this.data = fs.readJsonSync(this.libraryFile);
            } else {
                this.data = this.getDefaultData();
                this.saveData();
            }
        } catch (error) {
            console.error('Error loading library:', error);
            this.data = this.getDefaultData();
        }
    }

    saveData() {
        try {
            fs.ensureDirSync(path.dirname(this.libraryFile));
            fs.writeJsonSync(this.libraryFile, this.data, { spaces: 2 });
        } catch (error) {
            console.error('Error saving library:', error);
        }
    }

    getDefaultData() {
        return {
            textbooks: {
                '8': {
                    'Mathematics': 'Mathematics Textbook Grade 8',
                    'English': 'English Textbook Grade 8',
                    'Biology': 'Biology Textbook Grade 8',
                    'Chemistry': 'Chemistry Textbook Grade 8',
                    'Physics': 'Physics Textbook Grade 8',
                    'Geography': 'Geography Textbook Grade 8',
                    'History': 'History Textbook Grade 8',
                    'ICT': 'ICT Textbook Grade 8'
                },
                '12': {
                    'Mathematics': 'Mathematics Textbook Grade 12',
                    'English': 'English Textbook Grade 12',
                    'Physics': 'Physics Textbook Grade 12',
                    'Chemistry': 'Chemistry Textbook Grade 12',
                    'Biology': 'Biology Textbook Grade 12',
                    'Economics': 'Economics Textbook Grade 12',
                    'Geography': 'Geography Textbook Grade 12',
                    'History': 'History Textbook Grade 12',
                    'ICT': 'ICT Textbook Grade 12'
                }
            },
            formulaSheets: {
                'Mathematics': `📐 **Mathematics Formulas**

**Algebra:**
• Quadratic: x = (-b ± √(b² - 4ac)) / 2a
• Exponent: a^m × a^n = a^(m+n)
• Log: log(ab) = log(a) + log(b)

**Geometry:**
• Area of circle: πr²
• Area of triangle: ½ × base × height
• Volume of sphere: ⁴⁄₃πr³

**Trigonometry:**
• sin²θ + cos²θ = 1
• sin(2θ) = 2sinθcosθ
• cos(2θ) = cos²θ - sin²θ

**Calculus:**
• d/dx(x^n) = nx^(n-1)
• ∫x^n dx = x^(n+1)/(n+1) + C
• d/dx(sin x) = cos x`,
                'Physics': `⚡ **Physics Formulas**

**Mechanics:**
• F = ma (Newton's 2nd Law)
• v = u + at
• s = ut + ½at²
• KE = ½mv²
• PE = mgh
• P = F/A

**Optics:**
• 1/f = 1/u + 1/v
• n = c/v
• sin i / sin r = n

**Electricity:**
• V = IR (Ohm's Law)
• P = VI
• E = Pt
• F = kq₁q₂/r²

**Modern Physics:**
• E = mc²
• E = hf
• λ = h/p`,
                'Chemistry': `🧪 **Chemistry Formulas**

**Stoichiometry:**
• n = m/M (moles)
• n = V/22.4 (gas at STP)
• % yield = (actual/theoretical) × 100

**Gas Laws:**
• PV = nRT (Ideal Gas Law)
• P₁V₁ = P₂V₂ (Boyle's Law)
• V₁/T₁ = V₂/T₂ (Charles's Law)

**Solutions:**
• C = n/V (Concentration)
• pH = -log[H+]
• pOH = -log[OH-]
• pH + pOH = 14

**Thermodynamics:**
• ΔG = ΔH - TΔS
• q = mcΔT`,
                'Biology': `🧬 **Biology Key Concepts**

**Cell Biology:**
• Cell theory
• Organelles and their functions
• Cell membrane structure
• Mitosis and Meiosis

**Genetics:**
• DNA structure (double helix)
• RNA vs DNA
• Punnett squares
• Mendelian inheritance

**Human Body:**
• Circulatory system
• Respiratory system
• Digestive system
• Nervous system
• Endocrine system

**Ecology:**
• Food chains and webs
• Energy flow
• Nutrient cycles
• Biomes

**Evolution:**
• Natural selection
• Speciation
• Evidence for evolution`
            },
            revisionGuides: {
                'grade_8': `📚 **Grade 8 Revision Guide**

**Subjects:**
• Mathematics: Algebra, Geometry, Statistics
• English: Grammar, Comprehension, Writing
• Science: Biology, Chemistry, Physics basics
• Social Studies: Geography, History

**Study Tips:**
1. Review all topics weekly
2. Practice past exam questions
3. Create summary notes
4. Study with friends`,
                'grade_10': `📚 **Grade 10 Revision Guide**

**Subjects:**
• Mathematics: Advanced Algebra, Trigonometry
• English: Grammar, Essay Writing
• Biology: Cell biology, Genetics
• Chemistry: Chemical reactions, Periodic table
• Physics: Mechanics, Electricity
• Geography: Physical and human geography
• History: Ethiopian and world history

**Study Tips:**
1. Create a study schedule
2. Practice with past exams
3. Focus on weak areas
4. Use multiple resources`,
                'grade_12_natural': `📚 **Grade 12 Natural Revision Guide**

**Subjects:**
• Mathematics: Calculus, Matrices, Statistics
• English: Advanced grammar and writing
• Physics: Mechanics, Optics, Modern physics
• Chemistry: Organic, Inorganic, Physical
• Biology: Genetics, Ecology, Human body

**EUEE Preparation:**
1. Start early (at least 3 months before)
2. Practice full-length exams
3. Focus on weak subjects
4. Join study groups
5. Use official past papers`,
                'grade_12_social': `📚 **Grade 12 Social Revision Guide**

**Subjects:**
• Mathematics: Business math, Statistics
• English: Advanced grammar and writing
• Economics: Micro and Macroeconomics
• Geography: Human geography, Development
• History: Ethiopian and world history
• Civics: Constitution, Government

**EUEE Preparation:**
1. Start early (at least 3 months before)
2. Practice full-length exams
3. Focus on weak subjects
4. Join study groups
5. Use official past papers`
            },
            notes: {
                'Mathematics': 'Key concepts: Algebra, Functions, Trigonometry, Calculus, Statistics, Matrices',
                'Physics': 'Key concepts: Mechanics, Optics, Electricity, Magnetism, Modern Physics, Waves',
                'Chemistry': 'Key concepts: Atomic structure, Periodic table, Chemical bonding, Reactions, Organic chemistry',
                'Biology': 'Key concepts: Cell biology, Genetics, Ecology, Human anatomy, Physiology, Evolution',
                'English': 'Key concepts: Grammar, Vocabulary, Reading comprehension, Essay writing, Literature',
                'Geography': 'Key concepts: Physical geography, Climate, Population, Urbanization, Development',
                'History': 'Key concepts: Ethiopian history, African history, World wars, Independence movements',
                'Economics': 'Key concepts: Supply and demand, Markets, GDP, Inflation, International trade',
                'ICT': 'Key concepts: Computer hardware, Software, Networking, Programming, Digital literacy',
                'Civics': 'Key concepts: Constitution, Human rights, Government structure, Citizenship'
            }
        };
    }

    getTextbooks(grade, subject = null) {
        const gradeStr = String(grade);
        let textbooks = this.data.textbooks[gradeStr] || this.data.textbooks['8'];

        if (subject) {
            return textbooks[subject] || 'No textbook found for this subject.';
        }
        return textbooks;
    }

    getFormulaSheet(subject) {
        return this.data.formulaSheets[subject] || 'No formula sheet available for this subject.';
    }

    getRevisionGuide(grade, stream = null) {
        const gradeStr = String(grade);
        if (gradeStr === '8' || gradeStr === '10') {
            return this.data.revisionGuides[`grade_${gradeStr}`] || this.data.revisionGuides['grade_8'];
        } else if (gradeStr === '12') {
            if (stream && stream.toLowerCase() === 'social') {
                return this.data.revisionGuides['grade_12_social'];
            }
            return this.data.revisionGuides['grade_12_natural'];
        }
        return 'No revision guide available for your grade. Upload a book for personalized content!';
    }

    getNotes(subject) {
        return this.data.notes[subject] || 'No notes available for this subject.';
    }

    getAllSubjects() {
        return Object.keys(this.data.notes);
    }

    searchLibrary(query) {
        const results = [];
        const queryLower = query.toLowerCase();

        // Search textbooks
        for (const [grade, textbooks] of Object.entries(this.data.textbooks)) {
            for (const [subject, book] of Object.entries(textbooks)) {
                if (book.toLowerCase().includes(queryLower)) {
                    results.push({
                        type: 'textbook',
                        grade,
                        subject,
                        title: book
                    });
                }
            }
        }

        // Search formula sheets
        for (const [subject, formula] of Object.entries(this.data.formulaSheets)) {
            if (subject.toLowerCase().includes(queryLower) || 
                formula.toLowerCase().includes(queryLower)) {
                results.push({
                    type: 'formula_sheet',
                    subject,
                    content: formula.substring(0, 200) + '...'
                });
            }
        }

        return results;
    }

    getRecommendedResources(grade, subject) {
        const resources = {
            textbooks: this.getTextbooks(grade, subject),
            formulaSheet: this.getFormulaSheet(subject),
            notes: this.getNotes(subject)
        };

        return resources;
    }

    getStudyPlan(grade, days = 30) {
        const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'];
        const plan = [];

        for (let day = 1; day <= Math.min(days, 30); day++) {
            const subject = subjects[(day - 1) % subjects.length];
            const week = Math.ceil(day / 7);

            plan.push({
                day,
                week,
                subject,
                activity: `Study ${subject} - Review chapters and practice questions`,
                duration: '2 hours'
            });
        }

        return {
            plan,
            totalDays: days,
            subjects,
            tips: [
                'Study in 45-minute sessions with 10-minute breaks',
                'Review previous topics weekly',
                'Practice past exam questions',
                'Use the AI Teacher for difficult concepts'
            ]
        };
    }
}

module.exports = new Library();
