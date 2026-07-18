const study = require('./study');
const translations = require('./translations');

class AITeacher {
    constructor(database) {
        this.db = database;
    }

    teach(userId, query) {
        const user = this.db.getUser(userId);
        if (!user) {
            return 'Please start the bot with /start first!';
        }

        const language = user.language || 'English';
        const grade = user.grade || 8;
        const queryLower = query.toLowerCase();

        // Check for Afaan Oromo
        if (queryLower.includes('afaan') || queryLower.includes('oromo')) {
            return this.respondInAfaanOromo();
        }

        // Detect intent
        if (this.isQuestion(query)) {
            return this.explainTopic(query, grade, language);
        } else if (this.isMathProblem(query)) {
            return this.solveMath(query, language);
        } else if (this.isQuizRequest(query)) {
            return this.generateQuiz(query, grade, language);
        } else if (this.isSummaryRequest(query)) {
            return this.generateSummary(query, grade, language);
        } else if (this.isHelpRequest(query)) {
            return this.offerHelp(language);
        } else {
            return this.getGeneralResponse(language);
        }
    }

    isQuestion(text) {
        const words = ['what', 'how', 'why', 'when', 'where', 'who', 'explain', 'define', 'describe', 'tell me'];
        const textLower = text.toLowerCase();
        return words.some(word => textLower.includes(word)) || textLower.endsWith('?');
    }

    isMathProblem(text) {
        const textLower = text.toLowerCase();
        const patterns = [
            /[0-9]+[\+\-\*\/\^][0-9]+/,
            /[0-9]+\s*[+\-*/]\s*[0-9]+/,
            /[0-9]+\s*x\s*[+\-*/]\s*[0-9]+/,
            /solve/i,
            /calculate/i,
            /what is [0-9]+/
        ];
        return patterns.some(pattern => pattern.test(textLower));
    }

    isQuizRequest(text) {
        const words = ['quiz', 'test', 'questions', 'practice', 'exam', 'assessment'];
        const textLower = text.toLowerCase();
        return words.some(word => textLower.includes(word));
    }

    isSummaryRequest(text) {
        const words = ['summary', 'summarize', 'overview', 'review', 'recap', 'brief'];
        const textLower = text.toLowerCase();
        return words.some(word => textLower.includes(word));
    }

    isHelpRequest(text) {
        const words = ['help', 'confused', 'stuck', 'don\'t understand', 'not clear', 'struggling'];
        const textLower = text.toLowerCase();
        return words.some(word => textLower.includes(word));
    }

    explainTopic(query, grade, language) {
        // Find relevant topic from study data
        const allSubjects = study.getAllSubjects();
        let bestMatch = null;
        let bestScore = 0;

        for (const subject of allSubjects) {
            const lessons = study.getLessons(subject);
            for (const lesson of lessons) {
                const score = this.calculateRelevance(query, lesson.title + ' ' + lesson.content);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = { subject, lesson };
                }
            }
        }

        if (bestMatch && bestScore > 0.2) {
            return `
📖 **${bestMatch.subject}**
📚 Topic: ${bestMatch.lesson.title}

${bestMatch.lesson.content}

💡 *Based on your study materials. Want to dive deeper?*
`;
        }

        // Fallback response
        return `
🤔 **Let me explain that for you!**

This is a Grade ${grade} topic. Here's what I know:

📚 The key concepts are:
1. Understand the basics first
2. Practice with examples
3. Apply to real situations

💡 *Upload your textbook for more personalized explanations!*
`;
    }

    calculateRelevance(query, text) {
        const queryWords = query.toLowerCase().split(' ');
        const textWords = text.toLowerCase().split(' ');
        const common = queryWords.filter(word => textWords.includes(word));
        return common.length / queryWords.length;
    }

    solveMath(query, language) {
        // Extract numbers and operation
        const numbers = query.match(/\d+/g);
        const operations = query.match(/[\+\-\*\/]/g);

        if (numbers && numbers.length >= 2) {
            const num1 = parseInt(numbers[0]);
            const num2 = parseInt(numbers[1]);
            const op = operations?.[0] || '+';

            let result;
            switch (op) {
                case '+': result = num1 + num2; break;
                case '-': result = num1 - num2; break;
                case '*': result = num1 * num2; break;
                case '/': result = num2 !== 0 ? num1 / num2 : 'Cannot divide by zero'; break;
                default: result = num1 + num2;
            }

            return `
🧮 **Math Problem Solved**

${num1} ${op} ${num2} = ${result}

💡 *Want more practice? Try another problem!*
`;
        }

        return `
🧮 **Math Helper**

I can solve basic math problems. Try:
• "What is 2 + 3?"
• "Calculate 5 * 4"
• "Solve 10 - 3"

*Upload your math textbook for more advanced problems!*
`;
    }

    generateQuiz(query, grade, language) {
        // Find subject from query
        const allSubjects = study.getAllSubjects();
        let subject = null;
        for (const s of allSubjects) {
            if (query.toLowerCase().includes(s.toLowerCase())) {
                subject = s;
                break;
            }
        }

        if (!subject) {
            subject = allSubjects[0] || 'Mathematics';
        }

        const questions = study.getQuiz(subject);
        const quizQuestions = questions.slice(0, 5);

        let text = `
❓ **${subject} Quiz** (Grade ${grade})

Answer these questions:
`;

        quizQuestions.forEach((q, i) => {
            text += `\n${i + 1}. ${q.question}`;
            q.options.forEach((opt, j) => {
                text += `\n   ${String.fromCharCode(97 + j)}) ${opt}`;
            });
        });

        text += `\n\n💡 *Type "answers" to see the correct answers!*`;

        // Store quiz for answer checking
        global.activeQuiz = global.activeQuiz || {};
        global.activeQuiz[grade] = quizQuestions;

        return text;
    }

    getQuizAnswers(grade) {
        const quiz = global.activeQuiz?.[grade];
        if (!quiz) return 'No active quiz. Generate a quiz first!';

        let text = '📝 **Quiz Answers**\n\n';
        quiz.forEach((q, i) => {
            text += `${i + 1}. ${q.options[q.answer]}\n`;
        });

        return text;
    }

    generateSummary(query, grade, language) {
        // Find subject from query
        const allSubjects = study.getAllSubjects();
        let subject = null;
        for (const s of allSubjects) {
            if (query.toLowerCase().includes(s.toLowerCase())) {
                subject = s;
                break;
            }
        }

        if (!subject) {
            subject = allSubjects[0] || 'Mathematics';
        }

        const lessons = study.getLessons(subject);
        const notes = study.getNotes(subject);

        let text = `
📚 **${subject} Summary** (Grade ${grade})

📖 **Key Lessons:**
`;

        lessons.slice(0, 3).forEach((lesson, i) => {
            text += `\n${i + 1}. ${lesson.title}`;
        });

        text += `\n\n📝 **Key Notes:**
${notes}

💡 *Want a detailed summary? Upload your textbook!*
`;

        return text;
    }

    offerHelp(language) {
        return `
😊 **Don't worry, we'll figure this out together!**

Here's what we can do:
1. 📖 **Break it down** - Start with the basics
2. ✍️ **Practice together** - Step-by-step problems
3. 📚 **Use examples** - Real-world applications
4. 🧠 **Take a break** - Come back with fresh eyes

💡 *Remember: Every expert was once a beginner. You've got this!*

What topic is confusing you? Let's tackle it together.
`;
    }

    getGeneralResponse(language) {
        const responses = [
            "🤔 That's an interesting question! Let me think about that...",
            "💡 Great question! Here's what I know...",
            "📚 That's a good topic to explore. Let's dive in!",
            "🔍 Let me find the best explanation for you..."
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];

        return `${response}

💡 *Tip: Try asking about specific topics like "What is photosynthesis?" or "Explain derivatives"*

*Or upload your textbook for personalized answers!*
`;
    }

    respondInAfaanOromo() {
        return `
📚 **Afaan Oromoon Deebii**

Gaaffii keessan Afaan Oromoon gaafatte. Ani Afaan Oromoon ibsuu nan danda'a.

Maal baruu barbaaddu?
• 📖 Herrega (Math)
• ⚡ Fiziksii (Physics)
• 🧪 Keemistirii (Chemistry)
• 🧬 Baayoloojii (Biology)
• 📗 Afaan Ingilizii (English)
• 🌍 Geography
• 📜 History

Gaaffii keessan barreessa, deebii nan kenne!

💡 *Kitaaba keessan fe'ii barumsa haaraa argachuu dandeesan!*
`;
    }

    getMotivationalMessage(name, language) {
        const messages = {
            'English': [
                "💪 You've got this! Every step forward counts.",
                "🌟 Keep going! Progress is progress, no matter how small.",
                "🔥 You're building something great. Stay consistent!",
                "🎯 Focus on your goal. You're closer than you think.",
                "📚 Knowledge is power. You're getting stronger every day!"
            ],
            'Amharic': [
                "💪 ይችላሉ! እያንዳንዱ እርምጃ ጠቃሚ ነው።",
                "🌟 ቀጥል! ትንሽ ቢሆንም እድገት እድገት ነው።",
                "🔥 ታላቅ ነገር እየሰራህ ነው። ቀጥል!",
                "🎯 ግብህን አትርሳ። ከምታስበው የበለጠ ቀርበሃል።",
                "📚 እውቀት ኃይል ነው። በየቀኑ እየጠነከርክ ነው!"
            ],
            'Afaan Oromo': [
                "💪 Dandaata! Tarkaanfiin hunda ni barbaachisa.",
                "🌟 Itti fufi! Xiqqoo ta'ullee, finjiini finjiina.",
                "🔥 Waa'ee guddaa ijaarta. Itti fufi!",
                "🎯 Kaayyoo kee yaadadhu. Waan yaaddu irra dhihaatte.",
                "📚 Beekumsi humna. Guyyaa guyyaan cimaa ta'aa jirta!"
            ]
        };

        const msgList = messages[language] || messages['English'];
        return msgList[Math.floor(Math.random() * msgList.length)];
    }
}

module.exports = AITeacher;
