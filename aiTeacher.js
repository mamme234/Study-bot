const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

class AITeacher {
    constructor() {
        this.genAI = config.GEMINI_API_KEY ? new GoogleGenerativeAI(config.GEMINI_API_KEY) : null;
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: 'gemini-pro' }) : null;
    }

    async ask(userId, query, user, bookContext = '') {
        try {
            let context = `You are Mr. M, a friendly AI teacher for Ethiopian students.
Student: ${user?.name || 'Student'}
Grade: ${user?.grade || 'Not set'}

`;

            if (bookContext) {
                context += `Book Context: ${bookContext.substring(0, 2000)}\n\n`;
            }

            context += `Question: ${query}\n\nAnswer:`;

            if (this.model) {
                try {
                    const result = await this.model.generateContent(context);
                    const response = await result.response;
                    return response.text();
                } catch (e) {
                    console.error('Gemini error:', e);
                }
            }

            return this.getFallbackResponse(query, user);
        } catch (error) {
            console.error('AI error:', error);
            return this.getFallbackResponse(query, user);
        }
    }

    getFallbackResponse(query, user) {
        const q = query.toLowerCase();
        const grade = user?.grade || 8;

        if (q.includes('math') || q.includes('algebra')) {
            return `
📐 **Math Help**

Let me explain this step by step:

1. Identify what you're solving for
2. Write down the equation
3. Apply the rules
4. Check your answer

💡 *Want a specific problem solved? Send it to me!*
`;
        }

        if (q.includes('science') || q.includes('biology') || q.includes('chemistry') || q.includes('physics')) {
            return `
🔬 **Science Help**

Great question! Here's what you need to know:

• Understand the core concept first
• Learn the key terms and definitions
• Practice with examples
• Apply to real situations

💡 *I can explain any topic in detail!*
`;
        }

        if (q.includes('exam') || q.includes('test')) {
            return `
📝 **Exam Tips**

1. Start preparing early
2. Practice past questions
3. Focus on weak areas
4. Manage your time well
5. Get enough sleep before exam

💡 *Would you like a practice test?*
`;
        }

        return `
🧑‍🏫 **Mr. M's Response**

That's a great question! Here's what I think:

📚 Let me break this down for you:
1. Understand the basics
2. Practice with examples
3. Apply what you learn

💡 *Want a deeper explanation? Ask me more!*
`;
    }

    async generateQuiz(subject, grade, count = 5) {
        if (this.model) {
            try {
                const prompt = `Generate ${count} multiple choice questions for Grade ${grade} ${subject}.`;
                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                return this.parseQuizQuestions(text, subject);
            } catch (e) {
                console.error('Quiz generation error:', e);
            }
        }
        return this.getFallbackQuiz(subject, grade, count);
    }

    parseQuizQuestions(text, subject) {
        const questions = [];
        const lines = text.split('\n');
        let current = {};

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.match(/^\d+[\.\)]\s/)) {
                if (current.question) questions.push(current);
                current = { question: trimmed, options: [], correct: 0 };
            } else if (trimmed.match(/^[A-Da-d][\.\)]\s/)) {
                current.options.push(trimmed);
                if (trimmed.includes('*') || trimmed.includes('correct')) {
                    current.correct = current.options.length - 1;
                }
            }
        }
        if (current.question) questions.push(current);

        if (questions.length === 0) {
            return this.getFallbackQuiz(subject, 8, 5);
        }
        return questions;
    }

    getFallbackQuiz(subject, grade, count) {
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
        const qs = quizzes[subject] || quizzes['Mathematics'];
        return qs.slice(0, count);
    }

    async generateWorksheet(subject, grade) {
        if (this.model) {
            try {
                const prompt = `Create a worksheet for Grade ${grade} ${subject} with 10 practice questions.`;
                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (e) {
                console.error('Worksheet generation error:', e);
            }
        }
        return this.getFallbackWorksheet(subject, grade);
    }

    getFallbackWorksheet(subject, grade) {
        return `
📄 **${subject} Worksheet - Grade ${grade}**

**Part A: Multiple Choice**
1. What is the main concept of ${subject}?
   a) Option A
   b) Option B
   c) Option C
   d) Option D

**Part B: Short Answer**
2. Explain the importance of ${subject}.
3. Give three examples of ${subject} in daily life.

**Part C: Problem Solving**
4. Solve the following ${subject} problem.

---
💡 *Answers: 1-c, 2-[Your answer], 3-[Your examples], 4-[Your solution]*
`;
    }
}

module.exports = AITeacher;
