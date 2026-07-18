const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

class ExamManager {
    constructor() {
        this.examsFile = config.EXAMS_FILE;
        this.data = {};
        this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(this.examsFile)) {
                this.data = fs.readJsonSync(this.examsFile);
            } else {
                this.data = this.getDefaultData();
                this.saveData();
            }
        } catch (error) {
            console.error('Error loading exams:', error);
            this.data = this.getDefaultData();
        }
    }

    saveData() {
        try {
            fs.ensureDirSync(path.dirname(this.examsFile));
            fs.writeJsonSync(this.examsFile, this.data, { spaces: 2 });
        } catch (error) {
            console.error('Error saving exams:', error);
        }
    }

    getDefaultData() {
        return {
            '6': {
                worksheets: this.generateWorksheets(6),
                tests: this.generateTests(6),
                midterm: this.generateMidterm(6),
                final: this.generateFinal(6)
            },
            '8': {
                worksheets: this.generateWorksheets(8),
                tests: this.generateTests(8),
                midterm: this.generateMidterm(8),
                final: this.generateFinal(8),
                ministry: this.generateMinistry(8)
            },
            '10': {
                worksheets: this.generateWorksheets(10),
                tests: this.generateTests(10),
                midterm: this.generateMidterm(10),
                final: this.generateFinal(10),
                ministry: this.generateMinistry(10)
            },
            '12': {
                worksheets: this.generateWorksheets(12),
                tests: this.generateTests(12),
                midterm: this.generateMidterm(12),
                final: this.generateFinal(12),
                ministry: this.generateMinistry(12),
                entrance: this.generateEntrance()
            }
        };
    }

    generateWorksheets(grade) {
        const worksheets = {
            'Mathematics': [
                { title: `Grade ${grade} Worksheet 1`, questions: this.generateQuestions(grade, 'Math', 5) },
                { title: `Grade ${grade} Worksheet 2`, questions: this.generateQuestions(grade, 'Math', 5) }
            ],
            'English': [
                { title: `Grade ${grade} Worksheet 1`, questions: this.generateQuestions(grade, 'English', 5) }
            ]
        };

        if (grade >= 8) {
            worksheets['Physics'] = [
                { title: `Grade ${grade} Worksheet 1`, questions: this.generateQuestions(grade, 'Physics', 5) }
            ];
            worksheets['Chemistry'] = [
                { title: `Grade ${grade} Worksheet 1`, questions: this.generateQuestions(grade, 'Chemistry', 5) }
            ];
            worksheets['Biology'] = [
                { title: `Grade ${grade} Worksheet 1`, questions: this.generateQuestions(grade, 'Biology', 5) }
            ];
        }

        if (grade >= 10) {
            worksheets['Geography'] = [
                { title: `Grade ${grade} Worksheet 1`, questions: this.generateQuestions(grade, 'Geography', 5) }
            ];
            worksheets['History'] = [
                { title: `Grade ${grade} Worksheet 1`, questions: this.generateQuestions(grade, 'History', 5) }
            ];
        }

        return worksheets;
    }

    generateQuestions(grade, subject, count) {
        const questions = [];
        for (let i = 0; i < count; i++) {
            questions.push({
                q: `${subject} Question ${i + 1} for Grade ${grade}`,
                a: `Answer for ${subject} Question ${i + 1}`
            });
        }
        return questions;
    }

    generateTests(grade) {
        const tests = {
            'Mathematics': [
                { title: `Grade ${grade} Math Test 1`, questions: this.generateQuestions(grade, 'Math', 10) }
            ],
            'English': [
                { title: `Grade ${grade} English Test 1`, questions: this.generateQuestions(grade, 'English', 10) }
            ]
        };

        if (grade >= 8) {
            tests['Physics'] = [{ title: `Grade ${grade} Physics Test 1`, questions: this.generateQuestions(grade, 'Physics', 10) }];
            tests['Chemistry'] = [{ title: `Grade ${grade} Chemistry Test 1`, questions: this.generateQuestions(grade, 'Chemistry', 10) }];
            tests['Biology'] = [{ title: `Grade ${grade} Biology Test 1`, questions: this.generateQuestions(grade, 'Biology', 10) }];
        }

        return tests;
    }

    generateMidterm(grade) {
        const subjects = ['Mathematics', 'English'];
        if (grade >= 8) subjects.push('Physics', 'Chemistry', 'Biology');
        if (grade >= 10) subjects.push('Geography', 'History');

        return {
            name: `Grade ${grade} Midterm Exam`,
            subjects,
            duration: grade >= 10 ? '3 hours' : '2 hours',
            totalMarks: grade >= 10 ? 100 : 75,
            questions: this.generateQuestions(grade, 'All Subjects', 10)
        };
    }

    generateFinal(grade) {
        const subjects = ['Mathematics', 'English'];
        if (grade >= 8) subjects.push('Physics', 'Chemistry', 'Biology');
        if (grade >= 10) subjects.push('Geography', 'History');

        return {
            name: `Grade ${grade} Final Exam (Model)`,
            subjects,
            duration: grade >= 10 ? '3 hours' : '2.5 hours',
            totalMarks: grade >= 10 ? 150 : 100,
            structure: {
                'Part I': { type: 'Multiple Choice', questions: grade >= 10 ? 50 : 30 },
                'Part II': { type: 'Short Answer', questions: grade >= 10 ? 20 : 15 },
                'Part III': { type: 'Problem Solving', questions: grade >= 10 ? 10 : 5 }
            },
            questions: this.generateQuestions(grade, 'All Subjects', 20)
        };
    }

    generateMinistry(grade) {
        return {
            name: `Grade ${grade} Ministry Exam`,
            year: '2016 E.C',
            duration: grade === 12 ? '4 hours' : '3 hours',
            totalMarks: grade === 12 ? 250 : 100,
            subjects: grade === 12 
                ? ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology']
                : ['Mathematics', 'English', 'Science', 'Social Studies'],
            sampleQuestions: this.generateQuestions(grade, 'All Subjects', 5),
            preparationTips: [
                'Focus on all subjects equally',
                'Practice past exams',
                'Review key formulas and definitions',
                'Manage your time during the exam',
                'Read questions carefully'
            ]
        };
    }

    generateEntrance() {
        return {
            name: 'University Entrance Practice Exam',
            format: 'Computer-based testing (CBT)',
            duration: '4 hours',
            totalMarks: 250,
            sections: {
                'Mathematics': { marks: 50, questions: 25 },
                'English': { marks: 50, questions: 25 },
                'Biology': { marks: 50, questions: 25 },
                'Chemistry': { marks: 50, questions: 25 },
                'Physics': { marks: 50, questions: 25 }
            },
            scoring: {
                '90%+': 'Excellent - University of your choice',
                '80-89%': 'Very Good - Top universities',
                '70-79%': 'Good - Most universities',
                '60-69%': 'Satisfactory - Some universities',
                '<60%': 'Needs improvement - Consider repeating'
            }
        };
    }

    getExamsForGrade(grade) {
        const gradeStr = String(grade);
        return this.data[gradeStr] || null;
    }

    getWorksheets(grade, subject) {
        const gradeData = this.getExamsForGrade(grade);
        return gradeData?.worksheets?.[subject] || [];
    }

    getTests(grade, subject) {
        const gradeData = this.getExamsForGrade(grade);
        return gradeData?.tests?.[subject] || [];
    }

    getMidterm(grade) {
        const gradeData = this.getExamsForGrade(grade);
        return gradeData?.midterm || null;
    }

    getFinal(grade) {
        const gradeData = this.getExamsForGrade(grade);
        return gradeData?.final || null;
    }

    getMinistry(grade) {
        const gradeData = this.getExamsForGrade(grade);
        return gradeData?.ministry || null;
    }

    getEntrance(grade) {
        if (grade === 12) {
            return this.data['12']?.entrance || null;
        }
        return null;
    }

    getExamCountdown(grade) {
        const examDate = config.EXAM_DATES[`grade_${grade}`];
        if (examDate) {
            const examDateObj = new Date(examDate);
            const now = new Date();
            const daysLeft = Math.ceil((examDateObj - now) / (1000 * 60 * 60 * 24));
            return daysLeft;
        }
        return null;
    }
}

module.exports = new ExamManager();
