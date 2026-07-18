require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const http = require('http');

// ============ IMPORTS ============
const config = require('./config');
const database = require('./database');
const Menu = require('./menu');
const study = require('./study');
const exams = require('./exams');
const library = require('./library');
const bookProcessor = require('./bookProcessor');
const ScheduleGenerator = require('./scheduleGenerator');
const AITeacher = require('./aiTeacher');
const Gamification = require('./gamification');
const ProactiveCoach = require('./proactive');
const translations = require('./translations');

// ============ INITIALIZATION ============

// Ensure directories exist
const ensureDirectories = async () => {
    const dirs = [
        './temp',
        './data',
        './data/books',
        './data/books/processed',
        './data/books/chunks'
    ];
    
    for (const dir of dirs) {
        try {
            await fs.ensureDir(dir);
            console.log(`✅ Directory ensured: ${dir}`);
        } catch (error) {
            console.error(`❌ Error creating directory ${dir}:`, error);
        }
    }
};

ensureDirectories();

// Initialize bot
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// Initialize modules
const scheduleGenerator = new ScheduleGenerator(database, bookProcessor);
const gamification = new Gamification(database);
const aiTeacher = new AITeacher(database);
const proactiveCoach = new ProactiveCoach(database);

console.log(`🤖 ${config.BOT_NAME} v${config.BOT_VERSION} is running...`);
console.log(`📁 Data directory: ${config.DATA_DIR}`);
console.log(`📚 Books directory: ${config.BOOKS_DIR}`);

// Global storage
global.tempFileData = {};
global.activeQuiz = {};
global.activeAsk = {};
global.registrationState = {};
global.waitingForHours = {};
global.testSessions = {};

// ============ COMMAND HANDLERS ============

// /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        let user = database.getUser(userId);

        if (user) {
            // Send welcome from Mr. M
            await bot.sendMessage(chatId, 
                `🧑‍🏫 **Hello ${user.name}!**\n\nI'm **Mr. M**, your personal AI Teacher and Exam Coach.\n\nI'm here to help you master every subject and ace your exams! 📚✨\n\nLet's get started!`,
                { parse_mode: 'Markdown' }
            );
            
            const { text, keyboard } = Menu.mainMenu(user);
            await bot.sendMessage(chatId, text, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        } else {
            await bot.sendMessage(chatId,
                `🧑‍🏫 **Welcome to A+ Coach!**

I'm **Mr. M**, your personal AI Teacher.

🇪🇹 I'm here to help Ethiopian students excel in their studies.

What's your name?`,
                { parse_mode: 'Markdown' }
            );
            global.registrationState[userId] = { step: 'name' };
        }
    } catch (error) {
        console.error('Start error:', error);
        await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
    }
});

// /help command
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    const helpText = `
🧑‍🏫 **Mr. M's Help Guide**

**Commands:**
• /start - Start or restart
• /help - Show this guide
• /menu - Show main menu
• /test - Start a practice test
• /quiz - Quick quiz
• /cancel - Cancel current operation

**What I Can Do:**
• 📚 Teach any subject (Grade 1-12)
• 📝 Create custom tests and quizzes
• 📖 Learn from your uploaded books
• 📅 Generate study schedules
• 📊 Track your progress
• 🏆 Help you earn XP and level up!

**Quick Tips:**
• Upload your textbook for personalized learning
• Type "test me on [subject]" for a test
• Ask me anything about your subjects

💡 *Just type your questions naturally!*
`;

    await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
});

// /test command - Start a test
bot.onText(/\/test/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = database.getUser(userId);

    if (!user) {
        await bot.sendMessage(chatId, 'Please start with /start first!');
        return;
    }

    const subjects = user.subjects || ['Mathematics', 'English'];
    const keyboard = subjects.map(subject => {
        const emoji = Menu.getEmoji(subject);
        return [{ text: `${emoji} ${subject}`, callback_data: `test_subject_${subject}` }];
    });
    keyboard.push([{ text: '🔙 Back', callback_data: 'main_menu' }]);

    await bot.sendMessage(chatId,
        `🧑‍🏫 **Mr. M's Test Generator**

Choose a subject for your test:

📝 I'll create a personalized test with:
• Multiple choice questions
• Short answer questions
• Problems to solve

*Based on your grade level and uploaded books!*`,
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
        }
    );
});

// /quiz command
bot.onText(/\/quiz/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = database.getUser(userId);

    if (!user) {
        await bot.sendMessage(chatId, 'Please start with /start first!');
        return;
    }

    const subjects = user.subjects || ['Mathematics', 'English'];
    const keyboard = subjects.map(subject => {
        const emoji = Menu.getEmoji(subject);
        return [{ text: `${emoji} ${subject}`, callback_data: `quiz_subject_${subject}` }];
    });
    keyboard.push([{ text: '🔙 Back', callback_data: 'main_menu' }]);

    await bot.sendMessage(chatId,
        `🧑‍🏫 **Mr. M's Quick Quiz**

Choose a subject for a 5-question quiz:

⚡ Quick questions to test your knowledge!
📊 Get instant feedback and XP!`,
        {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
        }
    );
});

// /menu command
bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const user = database.getUser(userId);
    if (user) {
        const { text, keyboard } = Menu.mainMenu(user);
        await bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
        });
    } else {
        await bot.sendMessage(chatId, 'Please start with /start first!');
    }
});

// /cancel command
bot.onText(/\/cancel/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    delete global.tempFileData[userId];
    delete global.registrationState[userId];
    delete global.testSessions[userId];

    const user = database.getUser(userId);
    if (user) {
        await bot.sendMessage(chatId, '✅ Operation cancelled.', {
            parse_mode: 'Markdown'
        });
        const { text, keyboard } = Menu.mainMenu(user);
        await bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
        });
    } else {
        await bot.sendMessage(chatId, '✅ Operation cancelled. Use /start to begin.');
    }
});

// ============ CALLBACK QUERY HANDLER ============

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;

    await bot.answerCallbackQuery(callbackQuery.id);

    try {
        const user = database.getUser(userId);

        // ========== REGISTRATION CALLBACKS ==========
        if (data.startsWith('lang_')) {
            const language = data.replace('lang_', '');
            global.registrationState[userId] = { language };
            
            const { text, keyboard } = Menu.gradeSelectionMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data.startsWith('grade_')) {
            const gradeStr = data.replace('grade_', '');
            const grade = isNaN(gradeStr) ? gradeStr : parseInt(gradeStr);
            
            const name = global.registrationState[userId]?.name || 'Student';
            const language = global.registrationState[userId]?.language || 'English';

            if (typeof grade === 'number' && grade >= 11) {
                global.registrationState[userId].grade = grade;
                const { text, keyboard } = Menu.streamMenu();
                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: { inline_keyboard: keyboard }
                });
            } else {
                const user = database.createUser(userId, name, language, grade);
                delete global.registrationState[userId];

                await bot.sendMessage(chatId,
                    `🧑‍🏫 **Welcome ${name}!**

I'm **Mr. M**, your personal AI Teacher.

I've created your profile for Grade ${grade}. Let's start learning! 🚀`,
                    { parse_mode: 'Markdown' }
                );

                const { text, keyboard } = Menu.mainMenu(user);
                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                });
            }
        }

        else if (data.startsWith('stream_')) {
            const stream = data.replace('stream_', '');
            const name = global.registrationState[userId]?.name || 'Student';
            const language = global.registrationState[userId]?.language || 'English';
            const grade = global.registrationState[userId]?.grade || 11;
            
            const user = database.createUser(userId, name, language, grade, stream);
            delete global.registrationState[userId];

            await bot.sendMessage(chatId,
                `🧑‍🏫 **Welcome ${name}!**

I'm **Mr. M**, your personal AI Teacher.

I've created your profile for Grade ${grade} (${stream} Stream). Let's start learning! 🚀`,
                { parse_mode: 'Markdown' }
            );

            const { text, keyboard } = Menu.mainMenu(user);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        // ========== TEST CALLBACKS ==========
        else if (data.startsWith('test_subject_')) {
            const subject = data.replace('test_subject_', '');
            const user = database.getUser(userId);
            const grade = user?.grade || 8;

            await bot.editMessageText(
                `🧑‍🏫 **Mr. M is generating your test...**

📚 Subject: ${subject}
📅 Grade: ${grade}

⏳ Please wait...`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );

            // Generate test from AI Teacher
            const testData = aiTeacher.generateTest(subject, grade, userId);
            
            if (testData.error) {
                await bot.editMessageText(`❌ ${testData.error}`, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });
                return;
            }

            // Store test session
            global.testSessions[userId] = {
                subject,
                questions: testData.questions,
                currentQuestion: 0,
                answers: [],
                score: 0,
                total: testData.questions.length
            };

            // Send first question
            const q = testData.questions[0];
            const optionsText = q.options.map((opt, i) => 
                `${String.fromCharCode(65 + i)}. ${opt}`
            ).join('\n');

            const keyboard = q.options.map((opt, i) => {
                return [{ text: `${String.fromCharCode(65 + i)}. ${opt.substring(0, 30)}`, callback_data: `test_answer_${i}` }];
            });

            await bot.editMessageText(
                `🧑‍🏫 **${subject} Test - Question 1/${testData.questions.length}**

${q.question}

${optionsText}

*Select your answer below:*`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
        }

        else if (data.startsWith('test_answer_')) {
            const answerIndex = parseInt(data.replace('test_answer_', ''));
            const session = global.testSessions[userId];

            if (!session) {
                await bot.editMessageText('❌ Test session not found. Start a new test with /test.', {
                    chat_id: chatId,
                    message_id: messageId
                });
                return;
            }

            const currentQ = session.currentQuestion;
            const question = session.questions[currentQ];
            
            // Check answer
            const isCorrect = answerIndex === question.correct;
            if (isCorrect) session.score++;
            
            session.answers.push({
                question: question.question,
                selected: answerIndex,
                correct: question.correct,
                isCorrect
            });

            session.currentQuestion++;

            // Check if test is complete
            if (session.currentQuestion >= session.total) {
                // Test complete - show results
                const percentage = Math.round((session.score / session.total) * 100);
                const xpEarned = percentage >= 70 ? config.XP.QUIZ + config.XP.BONUS : config.XP.QUIZ;
                
                // Add XP
                gamification.addXP(userId, xpEarned, 'test');

                let resultText = `
🧑‍🏫 **Test Complete!**

📚 Subject: ${session.subject}
✅ Score: ${session.score}/${session.total} (${percentage}%)

${percentage >= 80 ? '🎉 Excellent work! You\'re mastering this subject!' :
  percentage >= 60 ? '💪 Good job! Keep practicing to improve.' :
  '📚 Keep studying! Review your notes and try again.'}

✨ +${xpEarned} XP earned!
`;

                // Show detailed results
                resultText += '\n📝 **Detailed Results:**\n';
                session.answers.forEach((a, i) => {
                    const emoji = a.isCorrect ? '✅' : '❌';
                    resultText += `\n${i+1}. ${emoji} ${a.question.substring(0, 40)}...`;
                });

                const keyboard = [
                    [{ text: '🔄 Retake Test', callback_data: `test_subject_${session.subject}` }],
                    [{ text: '📊 View Progress', callback_data: 'progress' }],
                    [{ text: '🔙 Back', callback_data: 'main_menu' }]
                ];

                await bot.editMessageText(resultText, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                });

                delete global.testSessions[userId];
                return;
            }

            // Send next question
            const q = session.questions[session.currentQuestion];
            const optionsText = q.options.map((opt, i) => 
                `${String.fromCharCode(65 + i)}. ${opt}`
            ).join('\n');

            const keyboard = q.options.map((opt, i) => {
                return [{ text: `${String.fromCharCode(65 + i)}. ${opt.substring(0, 30)}`, callback_data: `test_answer_${i}` }];
            });

            await bot.editMessageText(
                `🧑‍🏫 **${session.subject} Test - Question ${session.currentQuestion + 1}/${session.total}**

${q.question}

${optionsText}

*Select your answer below:*`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
        }

        // ========== QUIZ CALLBACKS ==========
        else if (data.startsWith('quiz_subject_')) {
            const subject = data.replace('quiz_subject_', '');
            const user = database.getUser(userId);
            const grade = user?.grade || 8;

            await bot.editMessageText(
                `🧑‍🏫 **Mr. M is generating your quiz...**

⚡ Quick Quiz: ${subject}
📅 Grade: ${grade}

⏳ Please wait...`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );

            const quizData = aiTeacher.generateQuiz(subject, grade, userId);
            
            if (quizData.error) {
                await bot.editMessageText(`❌ ${quizData.error}`, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });
                return;
            }

            // Store quiz session
            global.testSessions[userId] = {
                subject,
                questions: quizData.questions,
                currentQuestion: 0,
                answers: [],
                score: 0,
                total: quizData.questions.length,
                isQuiz: true
            };

            // Send first question
            const q = quizData.questions[0];
            const optionsText = q.options.map((opt, i) => 
                `${String.fromCharCode(65 + i)}. ${opt}`
            ).join('\n');

            const keyboard = q.options.map((opt, i) => {
                return [{ text: `${String.fromCharCode(65 + i)}. ${opt.substring(0, 30)}`, callback_data: `quiz_answer_${i}` }];
            });

            await bot.editMessageText(
                `⚡ **Quick Quiz - Question 1/${quizData.questions.length}**

${q.question}

${optionsText}

*Select your answer:*`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
        }

        else if (data.startsWith('quiz_answer_')) {
            const answerIndex = parseInt(data.replace('quiz_answer_', ''));
            const session = global.testSessions[userId];

            if (!session || !session.isQuiz) {
                await bot.editMessageText('❌ Quiz session not found. Start a new quiz with /quiz.', {
                    chat_id: chatId,
                    message_id: messageId
                });
                return;
            }

            const currentQ = session.currentQuestion;
            const question = session.questions[currentQ];
            
            const isCorrect = answerIndex === question.correct;
            if (isCorrect) session.score++;
            
            session.answers.push({
                question: question.question,
                selected: answerIndex,
                correct: question.correct,
                isCorrect
            });

            session.currentQuestion++;

            if (session.currentQuestion >= session.total) {
                // Quiz complete
                const percentage = Math.round((session.score / session.total) * 100);
                const xpEarned = percentage >= 70 ? config.XP.QUIZ + config.XP.BONUS : config.XP.QUIZ;
                
                gamification.addXP(userId, xpEarned, 'quiz');

                let resultText = `
⚡ **Quiz Complete!**

📚 Subject: ${session.subject}
✅ Score: ${session.score}/${session.total} (${percentage}%)

${percentage >= 80 ? '🎉 Excellent! You\'re a star!' :
  percentage >= 60 ? '💪 Good work! Keep going!' :
  '📚 Review your notes and try again!'}

✨ +${xpEarned} XP earned!
`;

                const keyboard = [
                    [{ text: '🔄 New Quiz', callback_data: `quiz_subject_${session.subject}` }],
                    [{ text: '📊 Progress', callback_data: 'progress' }],
                    [{ text: '🔙 Back', callback_data: 'main_menu' }]
                ];

                await bot.editMessageText(resultText, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                });

                delete global.testSessions[userId];
                return;
            }

            // Send next question
            const q = session.questions[session.currentQuestion];
            const optionsText = q.options.map((opt, i) => 
                `${String.fromCharCode(65 + i)}. ${opt}`
            ).join('\n');

            const keyboard = q.options.map((opt, i) => {
                return [{ text: `${String.fromCharCode(65 + i)}. ${opt.substring(0, 30)}`, callback_data: `quiz_answer_${i}` }];
            });

            await bot.editMessageText(
                `⚡ **Quick Quiz - Question ${session.currentQuestion + 1}/${session.total}**

${q.question}

${optionsText}

*Select your answer:*`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
        }

        // ========== MAIN MENU NAVIGATION ==========
        else if (data === 'main_menu') {
            const user = database.getUser(userId);
            if (!user) {
                await bot.sendMessage(chatId, 'Please start with /start');
                return;
            }
            const { text, keyboard } = Menu.mainMenu(user);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'study') {
            const user = database.getUser(userId);
            const subjects = user?.subjects || [];
            const { text, keyboard } = Menu.studyMenu(subjects);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'exams') {
            const user = database.getUser(userId);
            const grade = user?.grade || 8;
            const { text, keyboard } = Menu.examsMenu(grade);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'settings') {
            const user = database.getUser(userId);
            const { text, keyboard } = Menu.settingsMenu(user);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'upload_book') {
            const { text, keyboard } = Menu.uploadBookMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'schedule') {
            const { text, keyboard } = Menu.scheduleMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'schedule_generate') {
            await bot.editMessageText(
                '📅 **Mr. M is creating your schedule...**\n\nI\'m analyzing your uploaded books to create a personalized study plan.',
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );

            const schedule = await scheduleGenerator.generateScheduleFromBooks(userId);
            
            if (schedule.error) {
                await bot.editMessageText(schedule.error, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });
                return;
            }

            database.saveSchedule(userId, schedule);
            const text = scheduleGenerator.formatScheduleText(schedule);
            
            const keyboard = [
                [{ text: '📅 View Schedule', callback_data: 'schedule_view' }],
                [{ text: '📚 Upload More Books', callback_data: 'upload_book' }],
                [{ text: '🔙 Back', callback_data: 'main_menu' }]
            ];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'schedule_view') {
            const user = database.getUser(userId);
            const schedule = user?.schedule;

            if (!schedule) {
                await bot.editMessageText(
                    '📅 You don\'t have a schedule yet.\n\nUpload a book and I\'ll create one for you!',
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: { 
                            inline_keyboard: [
                                [{ text: '📚 Upload Book', callback_data: 'upload_book' }],
                                [{ text: '🔙 Back', callback_data: 'main_menu' }]
                            ]
                        }
                    }
                );
                return;
            }

            const text = scheduleGenerator.formatScheduleText(schedule);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔄 Regenerate', callback_data: 'schedule_generate' }],
                        [{ text: '📚 Upload More Books', callback_data: 'upload_book' }],
                        [{ text: '🔙 Back', callback_data: 'main_menu' }]
                    ]
                }
            });
        }

        else if (data === 'book_list') {
            const books = await bookProcessor.getUserBooks(userId);
            
            if (!books || books.length === 0) {
                await bot.editMessageText(
                    '📚 You haven\'t uploaded any books yet.\n\nUpload your textbook for personalized learning!',
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '📤 Upload Book', callback_data: 'upload_book' }],
                                [{ text: '🔙 Back', callback_data: 'main_menu' }]
                            ]
                        }
                    }
                );
                return;
            }

            let text = '📚 **Your Book Library**\n\n';
            const keyboard = [];

            for (const book of books.slice(-5)) {
                text += `📖 **${book.originalFilename}**\n`;
                text += `📚 ${book.subject} | 📅 Grade ${book.grade}\n`;
                text += `📊 ${book.totalChunks} sections\n\n`;
                
                keyboard.push([
                    { 
                        text: `📖 ${book.originalFilename.substring(0, 20)}`, 
                        callback_data: `book_select_${book.fileHash}` 
                    }
                ]);
            }

            keyboard.push([{ text: '🔙 Back', callback_data: 'main_menu' }]);

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data.startsWith('book_select_')) {
            const bookHash = data.replace('book_select_', '');
            const book = await bookProcessor.getBookByHash(userId, bookHash);
            
            if (!book) {
                await bot.editMessageText('❌ Book not found.', {
                    chat_id: chatId,
                    message_id: messageId
                });
                return;
            }

            const text = `
📖 **${book.originalFilename}**
📚 Subject: ${book.subject}
📅 Grade: ${book.grade}
📊 Sections: ${book.totalChunks}

What would you like to do?
`;

            const keyboard = [
                [{ text: '📅 Generate Schedule', callback_data: `schedule_from_book_${bookHash}` }],
                [{ text: '❓ Ask Question', callback_data: `book_ask_${bookHash}` }],
                [{ text: '📖 View Preview', callback_data: `book_preview_${bookHash}` }],
                [{ text: '🔙 Back', callback_data: 'book_list' }]
            ];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data.startsWith('schedule_from_book_')) {
            const bookHash = data.replace('schedule_from_book_', '');
            
            await bot.editMessageText(
                '📅 **Generating schedule from your book...**',
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );

            const schedule = await scheduleGenerator.generateScheduleFromBooks(userId, bookHash);
            
            if (schedule.error) {
                await bot.editMessageText(schedule.error, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });
                return;
            }

            database.saveSchedule(userId, schedule);
            const text = scheduleGenerator.formatScheduleText(schedule);

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📅 View Schedule', callback_data: 'schedule_view' }],
                        [{ text: '🔙 Back', callback_data: 'book_list' }]
                    ]
                }
            });
        }

        else if (data.startsWith('book_preview_')) {
            const bookHash = data.replace('book_preview_', '');
            const chunks = await bookProcessor.getBookChunks(userId, bookHash);
            
            if (!chunks || chunks.length === 0) {
                await bot.editMessageText('No content preview available.', {
                    chat_id: chatId,
                    message_id: messageId
                });
                return;
            }

            const preview = chunks.slice(0, 3).join('\n\n');
            const text = `
📖 **Content Preview**

${preview.substring(0, 1500)}${preview.length > 1500 ? '...' : ''}

📊 Total sections: ${chunks.length}
`;

            const keyboard = [
                [{ text: '📅 Generate Schedule', callback_data: `schedule_from_book_${bookHash}` }],
                [{ text: '❓ Ask Question', callback_data: `book_ask_${bookHash}` }],
                [{ text: '🔙 Back', callback_data: `book_select_${bookHash}` }]
            ];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data.startsWith('book_ask_')) {
            const bookHash = data.replace('book_ask_', '');
            const book = await bookProcessor.getBookByHash(userId, bookHash);
            global.activeAsk[userId] = { bookHash };
            
            await bot.editMessageText(
                `💬 **Ask Mr. M a question about your book**

Type your question naturally, for example:
• "What is photosynthesis?"
• "Explain Chapter 3"
• "What are the key formulas?"
• "Define 'equilibrium'"

📚 *Book: ${book?.originalFilename || 'Unknown'}*`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );
        }

        else if (data === 'library') {
            const user = database.getUser(userId);
            const grade = user?.grade || 8;

            const textbooks = library.getTextbooks(grade);
            let text = `
📖 **Mr. M's Library**

📚 **Textbooks for Grade ${grade}:**
`;

            for (const [subject, book] of Object.entries(textbooks)) {
                const emoji = Menu.getEmoji(subject);
                text += `\n• ${emoji} ${subject}: ${book}`;
            }

            text += '\n\n📝 **Available Resources:**\n';
            text += '• 📐 Formula Sheets\n';
            text += '• 📚 Revision Guides\n';
            text += '• 📝 Subject Notes\n\n';

            text += '💡 *Upload your own textbooks for personalized learning!*';

            const keyboard = [
                [{ text: '📤 Upload Book', callback_data: 'upload_book' }],
                [{ text: '📐 Formula Sheets', callback_data: 'library_formulas' }],
                [{ text: '📚 Revision Guides', callback_data: 'library_revision' }],
                [{ text: '🔙 Back', callback_data: 'main_menu' }]
            ];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'library_formulas') {
            const subjects = library.getAllSubjects();
            let text = '📐 **Formula Sheets**\n\n';

            for (const subject of subjects.slice(0, 5)) {
                const formula = library.getFormulaSheet(subject);
                text += `**${subject}:**\n${formula.substring(0, 100)}...\n\n`;
            }

            text += '\n💡 *Type "formula [subject]" to get full formulas!*';

            const keyboard = [[{ text: '🔙 Back', callback_data: 'library' }]];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'library_revision') {
            const user = database.getUser(userId);
            const grade = user?.grade || 8;
            const stream = user?.stream || null;

            const guide = library.getRevisionGuide(grade, stream);
            let text = `📚 **Revision Guide**\n\n${guide}`;

            const keyboard = [[{ text: '🔙 Back', callback_data: 'library' }]];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'ai_teacher') {
            const text = `
🧑‍🏫 **Mr. M - AI Teacher**

I can help you with:
• 📖 Explain any concept
• 🧮 Solve math problems
• 📝 Create summaries
• ❓ Generate quizzes and tests
• 🌍 Respond in Amharic or Afaan Oromo

**Just type your question naturally!**

💡 *Upload your textbook for personalized answers!*
`;

            const keyboard = [[{ text: '🔙 Back', callback_data: 'main_menu' }]];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'progress') {
            const progress = gamification.getProgress(userId);
            if (!progress) {
                await bot.sendMessage(chatId, '❌ User not found');
                return;
            }

            let text = `
📊 **Your Progress**

👤 ${progress.name}
🏆 Level: ${progress.level}
⭐ XP: ${progress.xp}
🔥 Streak: ${progress.streak} days
📖 Total Lessons: ${progress.totalLessons}
📝 Quiz Average: ${progress.quizAverage}%

📚 **Subject Progress:**
`;

            for (const [subject, data] of Object.entries(progress.progress)) {
                const emoji = Menu.getEmoji(subject);
                text += `\n• ${emoji} ${subject}: ${data.lessonsCompleted} lessons, ${data.quizAvg}% avg`;
            }

            text += `\n\n💪 **Strongest:** ${progress.strongest}`;
            text += `\n📝 **Needs Practice:** ${progress.weakest}`;

            const keyboard = [[{ text: '🔙 Back', callback_data: 'main_menu' }]];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'leaderboard') {
            const result = gamification.getLeaderboard(userId);
            let text = '🏆 **Leaderboard**\n\n';

            for (const entry of result.leaderboard) {
                const medal = { 1: '🥇', 2: '🥈', 3: '🥉' }[entry.rank] || `${entry.rank}.`;
                text += `${medal} ${entry.name} - Level ${entry.level} (${entry.xp} XP)\n`;
            }

            if (result.userRank) {
                text += `\n📊 **Your Rank:** #${result.userRank}`;
            }

            const keyboard = [[{ text: '🔙 Back', callback_data: 'main_menu' }]];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'daily_goal') {
            const user = database.getUser(userId);
            const goal = user?.dailyGoal || { lessons: 2, quiz: 15, hours: 1 };

            const text = `
🎯 **Today's Goal**

✅ Read ${goal.lessons} lessons
⬜ Complete ${goal.quiz} quiz questions
⬜ Study for ${goal.hours} hour(s)

Reward: +${config.XP.DAILY_GOAL} XP

💡 *Tip: Break your study into 25-minute sessions*

📊 **Current Progress:**
• Lessons: 0/${goal.lessons}
• Quizzes: 0/${goal.quiz}
• Hours: 0/${goal.hours}
`;

            const keyboard = [
                [{ text: '✅ Complete Goal', callback_data: 'complete_goal' }],
                [{ text: '🔙 Back', callback_data: 'main_menu' }]
            ];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'complete_goal') {
            const result = gamification.completeDailyGoal(userId);
            await bot.editMessageText(result, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔙 Back', callback_data: 'main_menu' }]]
                }
            });
        }

        // ========== EXAM CALLBACKS ==========
        else if (data.startsWith('exam_')) {
            const examType = data.replace('exam_', '');
            const user = database.getUser(userId);
            const grade = user?.grade || 8;

            let text = '';
            let keyboard = [[{ text: '🔙 Back', callback_data: 'exams' }]];

            switch(examType) {
                case 'worksheets':
                    text = `📝 **Worksheets**\n\nType "worksheet [subject]" to get a worksheet!`;
                    break;

                case 'tests':
                    text = `📋 **Tests**\n\nType "test me on [subject]" to start a test!`;
                    break;

                case 'midterm':
                    const midterm = exams.getMidterm(grade);
                    if (midterm) {
                        text = `📊 **Midterm Exam**\n\n`;
                        text += `📚 Subjects: ${midterm.subjects.join(', ')}\n`;
                        text += `⏱️ Duration: ${midterm.duration}\n`;
                        text += `📝 Total Marks: ${midterm.totalMarks}\n\n`;
                        text += `💡 *Type "test me on all subjects" to practice!*`;
                    } else {
                        text = 'No midterm exam available for this grade.';
                    }
                    break;

                case 'final':
                    const final = exams.getFinal(grade);
                    if (final) {
                        text = `📈 **Final (Model) Exam**\n\n`;
                        text += `📚 Subjects: ${final.subjects.join(', ')}\n`;
                        text += `⏱️ Duration: ${final.duration}\n`;
                        text += `📝 Total Marks: ${final.totalMarks}\n\n`;
                        text += `📊 **Structure:**\n`;
                        for (const [part, details] of Object.entries(final.structure)) {
                            text += `• ${part}: ${details.type} (${details.questions} questions)\n`;
                        }
                    } else {
                        text = 'No final exam available for this grade.';
                    }
                    break;

                case 'ministry':
                    const ministry = exams.getMinistry(grade);
                    if (ministry) {
                        text = `🏛️ **Ministry Exam**\n\n`;
                        text += `📚 ${ministry.name}\n`;
                        text += `📅 Year: ${ministry.year}\n`;
                        text += `⏱️ Duration: ${ministry.duration}\n`;
                        text += `📝 Total Marks: ${ministry.totalMarks}\n\n`;
                        text += `📚 **Subjects:** ${ministry.subjects.join(', ')}\n\n`;
                        text += `💡 **Preparation Tips:**\n`;
                        ministry.preparationTips.forEach(tip => {
                            text += `• ${tip}\n`;
                        });
                    } else {
                        text = 'No ministry exam available for this grade.';
                    }
                    break;

                case 'entrance':
                    const entrance = exams.getEntrance(grade);
                    if (entrance) {
                        text = `🎓 **Entrance Exam**\n\n`;
                        text += `📚 ${entrance.name}\n`;
                        text += `⏱️ Duration: ${entrance.duration}\n`;
                        text += `📝 Total Marks: ${entrance.totalMarks}\n\n`;
                        text += `📊 **Sections:**\n`;
                        for (const [subject, details] of Object.entries(entrance.sections)) {
                            text += `• ${subject}: ${details.marks} marks (${details.questions} questions)\n`;
                        }
                        text += `\n📈 **Scoring Guide:**\n`;
                        for (const [range, description] of Object.entries(entrance.scoring)) {
                            text += `• ${range}: ${description}\n`;
                        }
                    } else {
                        text = 'No entrance exam available for this grade.';
                    }
                    break;

                default:
                    text = 'Invalid exam type.';
            }

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        // ========== SUBJECT CALLBACKS ==========
        else if (data.startsWith('subject_')) {
            const subject = data.replace('subject_', '');
            const { text, keyboard } = Menu.subjectMenu(subject);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data.startsWith('feature_')) {
            const parts = data.split('_');
            const subject = parts[1];
            const feature = parts.slice(2).join('_');

            let text = '';
            let keyboard = [[{ text: '🔙 Back', callback_data: `subject_${subject}` }]];

            switch(feature) {
                case 'lessons':
                    const lessons = study.getLessons(subject);
                    text = `📖 **${subject} Lessons**\n\n`;
                    if (lessons.length === 0) {
                        text += 'No lessons available. Upload a textbook for personalized lessons!';
                    } else {
                        lessons.forEach((lesson, i) => {
                            text += `**${i + 1}. ${lesson.title}**\n`;
                            text += `${lesson.content.substring(0, 200)}${lesson.content.length > 200 ? '...' : ''}\n\n`;
                        });
                    }
                    break;

                case 'notes':
                    const notes = study.getNotes(subject);
                    text = `📝 **${subject} Notes**\n\n${notes}`;
                    break;

                case 'textbooks':
                    const user = database.getUser(userId);
                    const textbooks = library.getTextbooks(user?.grade || 8, subject);
                    text = `📚 **${subject} Textbooks**\n\n`;
                    if (typeof textbooks === 'string') {
                        text += textbooks;
                    } else {
                        for (const [grade, book] of Object.entries(textbooks)) {
                            text += `• Grade ${grade}: ${book}\n`;
                        }
                    }
                    text += '\n💡 *Upload your own textbook for personalized learning!*';
                    break;

                case 'quizzes':
                    text = `❓ **${subject} Quiz**\n\nType "quiz me on ${subject}" or click /quiz to start!`;
                    break;

                case 'videos':
                    const videos = study.getVideos(subject);
                    text = `🎥 **${subject} Videos**\n\n`;
                    if (videos.length === 0) {
                        text += 'No videos available for this subject.';
                    } else {
                        videos.forEach((video, i) => {
                            text += `${i + 1}. ${video}\n`;
                        });
                    }
                    break;

                case 'ai_explain':
                    text = `🧑‍🏫 **Mr. M - ${subject} Teacher**\n\nType any question about ${subject} and I'll explain it!`;
                    break;

                default:
                    text = `📚 **${subject}**\n\nFeature coming soon!`;
            }

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        // ========== BOOK UPLOAD SUBJECT CALLBACKS ==========
        else if (data.startsWith('book_subject_')) {
            const subject = data.replace('book_subject_', '');
            
            const tempData = global.tempFileData[userId];
            if (!tempData) {
                await bot.sendMessage(chatId, '❌ File not found. Please upload again.');
                return;
            }

            global.tempFileData[userId].subject = subject;

            const gradeOptions = ['nursery', 'kg', ...Array.from({ length: 12 }, (_, i) => i + 1)];
            const keyboard = gradeOptions.map(grade => {
                const display = ['nursery', 'kg'].includes(String(grade)) 
                    ? String(grade).charAt(0).toUpperCase() + String(grade).slice(1)
                    : `Grade ${grade}`;
                return [{ text: display, callback_data: `book_grade_${grade}` }];
            });

            await bot.editMessageText(
                `📚 Subject: ${subject}\n\nWhich grade is this book for?`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
        }

        else if (data.startsWith('book_grade_')) {
            const gradeStr = data.replace('book_grade_', '');
            const grade = isNaN(gradeStr) ? gradeStr : parseInt(gradeStr);
            
            const tempData = global.tempFileData[userId];
            if (!tempData) {
                await bot.sendMessage(chatId, '❌ File not found. Please upload again.');
                return;
            }

            await bot.editMessageText(
                '⏳ **Processing your book...**\n\nThis may take a moment for large books.',
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );

            try {
                const file = await bot.getFile(tempData.fileId);
                const fileBuffer = await bot.downloadFile(file.file_id, './temp/');
                
                const result = await bookProcessor.processUploadedBook(
                    fileBuffer,
                    tempData.fileName,
                    userId,
                    tempData.subject,
                    grade,
                    user?.language || 'English'
                );

                if (result.error) {
                    await bot.editMessageText(`❌ ${result.error}`, {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown'
                    });
                    return;
                }

                const xpResult = gamification.uploadBook(userId);

                const keyboard = [
                    [{ text: '📅 Generate Schedule', callback_data: `schedule_from_book_${result.fileHash}` }],
                    [{ text: '📖 View Content', callback_data: `book_preview_${result.fileHash}` }],
                    [{ text: '❓ Ask Question', callback_data: `book_ask_${result.fileHash}` }],
                    [{ text: '📚 My Books', callback_data: 'book_list' }],
                    [{ text: '🔙 Back', callback_data: 'main_menu' }]
                ];

                await bot.editMessageText(
                    `
✅ **Book Uploaded Successfully!**

📖 ${tempData.fileName}
📚 Subject: ${tempData.subject}
📅 Grade: ${grade}
📊 ${result.totalChunks} sections extracted
✨ +${config.XP.BOOK_UPLOAD} XP

${xpResult}

What would you like to do next?
`,
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: { inline_keyboard: keyboard }
                    }
                );

                delete global.tempFileData[userId];

            } catch (error) {
                console.error('Book processing error:', error);
                await bot.editMessageText(`❌ Error processing book: ${error.message}`, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });
            }
        }

        // ========== SETTINGS CALLBACKS ==========
        else if (data === 'change_grade') {
            const { text, keyboard } = Menu.gradeSelectionMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'change_language') {
            const { text, keyboard } = Menu.languageMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'change_stream') {
            const { text, keyboard } = Menu.streamMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'notifications') {
            const user = database.getUser(userId);
            if (!user) return;

            const current = user.settings?.notifications !== false;
            const newSetting = !current;
            database.updateUser(userId, {
                settings: { ...(user.settings || {}), notifications: newSetting }
            });

            await bot.editMessageText(
                `🔔 **Notifications: ${newSetting ? '✅ On' : '❌ Off'}**`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔙 Back', callback_data: 'settings' }]
                        ]
                    }
                }
            );
        }

        else if (data === 'schedule_hours') {
            await bot.editMessageText(
                `⏰ **Set Study Hours**

How many hours do you want to study per day?

Please type a number between 1 and 8.`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );
            global.waitingForHours[userId] = true;
        }

    } catch (error) {
        console.error('Callback error:', error);
        await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
    }
});

// ============ DOCUMENT HANDLER ============

bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const document = msg.document;

    try {
        const user = database.getUser(userId);
        if (!user) {
            await bot.sendMessage(chatId, 'Please start with /start first!');
            return;
        }

        const fileSize = document.file_size || 0;
        if (fileSize > config.MAX_FILE_SIZE) {
            await bot.sendMessage(chatId, `❌ File too large! Max size: ${config.MAX_FILE_SIZE / (1024 * 1024)}MB`);
            return;
        }

        const fileName = document.file_name || 'unnamed';
        const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
        
        if (!config.ALLOWED_EXTENSIONS.includes(ext)) {
            await bot.sendMessage(chatId, `❌ Unsupported format: ${ext}\nSupported: ${config.ALLOWED_EXTENSIONS.join(', ')}`);
            return;
        }

        const subjects = user.subjects || ['Mathematics', 'English'];
        const keyboard = subjects.map(subject => {
            const emoji = Menu.getEmoji(subject);
            return [{ text: `${emoji} ${subject}`, callback_data: `book_subject_${subject}` }];
        });

        global.tempFileData[userId] = {
            fileId: document.file_id,
            fileName: fileName
        };

        await bot.sendMessage(chatId, 
            `📚 **Book Upload: ${fileName}**\n\nWhich subject is this book for?`,
            {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            }
        );

    } catch (error) {
        console.error('Document handler error:', error);
        await bot.sendMessage(chatId, '❌ An error occurred processing your document.');
    }
});

// ============ MESSAGE HANDLER ============

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return;
    if (msg.document) return;

    try {
        const user = database.getUser(userId);

        // ========== REGISTRATION ==========
        if (global.registrationState[userId]?.step === 'name') {
            global.registrationState[userId].name = text;
            global.registrationState[userId].step = 'complete';
            
            const { text: langText, keyboard } = Menu.languageMenu();
            await bot.sendMessage(chatId, langText, {
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        // ========== SET STUDY HOURS ==========
        if (global.waitingForHours && global.waitingForHours[userId]) {
            const hours = parseInt(text);
            if (hours >= 1 && hours <= 8) {
                delete global.waitingForHours[userId];
                await bot.sendMessage(chatId, `✅ Study hours set to ${hours} hours per day!`);
                
                const schedule = await scheduleGenerator.generateScheduleFromBooks(userId, null, hours);
                if (!schedule.error) {
                    database.saveSchedule(userId, schedule);
                    const scheduleText = scheduleGenerator.formatScheduleText(schedule);
                    await bot.sendMessage(chatId, scheduleText, { parse_mode: 'Markdown' });
                }
            } else {
                await bot.sendMessage(chatId, '❌ Please enter a number between 1 and 8.');
            }
            return;
        }

        // ========== TEST REQUESTS ==========
        if (text.match(/test me on/i)) {
            const subject = text.replace(/test me on/i, '').trim();
            const user = database.getUser(userId);
            const grade = user?.grade || 8;

            await bot.sendMessage(chatId, 
                `🧑‍🏫 **Mr. M is generating a test...**

📚 Subject: ${subject}
📅 Grade: ${grade}

⏳ Please wait...`,
                { parse_mode: 'Markdown' }
            );

            const testData = aiTeacher.generateTest(subject, grade, userId);
            
            if (testData.error) {
                await bot.sendMessage(chatId, `❌ ${testData.error}`, { parse_mode: 'Markdown' });
                return;
            }

            global.testSessions[userId] = {
                subject,
                questions: testData.questions,
                currentQuestion: 0,
                answers: [],
                score: 0,
                total: testData.questions.length
            };

            const q = testData.questions[0];
            const optionsText = q.options.map((opt, i) => 
                `${String.fromCharCode(65 + i)}. ${opt}`
            ).join('\n');

            const keyboard = q.options.map((opt, i) => {
                return [{ text: `${String.fromCharCode(65 + i)}. ${opt.substring(0, 30)}`, callback_data: `test_answer_${i}` }];
            });

            await bot.sendMessage(chatId,
                `🧑‍🏫 **${subject} Test - Question 1/${testData.questions.length}**

${q.question}

${optionsText}

*Select your answer below:*`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
            return;
        }

        // ========== QUIZ REQUESTS ==========
        if (text.match(/quiz me on/i)) {
            const subject = text.replace(/quiz me on/i, '').trim();
            const user = database.getUser(userId);
            const grade = user?.grade || 8;

            await bot.sendMessage(chatId, 
                `⚡ **Mr. M is generating a quiz...**

📚 Subject: ${subject}
📅 Grade: ${grade}

⏳ Please wait...`,
                { parse_mode: 'Markdown' }
            );

            const quizData = aiTeacher.generateQuiz(subject, grade, userId);
            
            if (quizData.error) {
                await bot.sendMessage(chatId, `❌ ${quizData.error}`, { parse_mode: 'Markdown' });
                return;
            }

            global.testSessions[userId] = {
                subject,
                questions: quizData.questions,
                currentQuestion: 0,
                answers: [],
                score: 0,
                total: quizData.questions.length,
                isQuiz: true
            };

            const q = quizData.questions[0];
            const optionsText = q.options.map((opt, i) => 
                `${String.fromCharCode(65 + i)}. ${opt}`
            ).join('\n');

            const keyboard = q.options.map((opt, i) => {
                return [{ text: `${String.fromCharCode(65 + i)}. ${opt.substring(0, 30)}`, callback_data: `quiz_answer_${i}` }];
            });

            await bot.sendMessage(chatId,
                `⚡ **Quick Quiz - Question 1/${quizData.questions.length}**

${q.question}

${optionsText}

*Select your answer:*`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
            return;
        }

        // ========== FORMULA REQUESTS ==========
        if (text.toLowerCase().startsWith('formula ')) {
            const subject = text.replace(/formula /i, '').trim();
            const formula = library.getFormulaSheet(subject);
            await bot.sendMessage(chatId, `📐 **${subject} Formulas**\n\n${formula}`, { parse_mode: 'Markdown' });
            return;
        }

        // ========== NOTES REQUESTS ==========
        if (text.toLowerCase().startsWith('notes ')) {
            const subject = text.replace(/notes /i, '').trim();
            const notes = library.getNotes(subject);
            await bot.sendMessage(chatId, `📝 **${subject} Notes**\n\n${notes}`, { parse_mode: 'Markdown' });
            return;
        }

        // ========== WORKSHEET REQUESTS ==========
        if (text.toLowerCase().startsWith('worksheet ')) {
            const subject = text.replace(/worksheet /i, '').trim();
            const user = database.getUser(userId);
            const grade = user?.grade || 8;
            
            const worksheet = aiTeacher.generateWorksheet(subject, grade);
            await bot.sendMessage(chatId, worksheet, { parse_mode: 'Markdown' });
            return;
        }

        // ========== EXPLAIN REQUESTS ==========
        if (text.match(/explain/i) || text.match(/what is/i) || text.match(/how does/i)) {
            const user = database.getUser(userId);
            const response = aiTeacher.teach(userId, text);
            await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
            return;
        }

        // ========== BOOK QUESTIONS ==========
        if (global.activeAsk && global.activeAsk[userId]) {
            const { bookHash } = global.activeAsk[userId];
            const chunks = await bookProcessor.getBookChunks(userId, bookHash);
            
            if (chunks && chunks.length > 0) {
                let answer = null;
                for (const chunk of chunks) {
                    if (chunk.toLowerCase().includes(text.toLowerCase())) {
                        answer = chunk;
                        break;
                    }
                }

                if (answer) {
                    await bot.sendMessage(chatId, 
                        `📖 **Answer from your book:**\n\n${answer.substring(0, 1500)}${answer.length > 1500 ? '...' : ''}`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    await bot.sendMessage(chatId, 
                        `🤔 I couldn't find an exact answer to "${text}" in your book.\n\n💡 Try rephrasing your question or ask about a specific topic.`,
                        { parse_mode: 'Markdown' }
                    );
                }
                return;
            }
        }

        // ========== AI TEACHER (Default) ==========
        if (user) {
            const response = aiTeacher.teach(userId, text);
            await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        } else {
            await bot.sendMessage(chatId, 'Please start with /start first!');
        }

    } catch (error) {
        console.error('Message handler error:', error);
        await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
    }
});

// ============ ERROR HANDLERS ============

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

bot.on('error', (error) => {
    console.error('Bot error:', error);
});

// ============ PROACTIVE COACH ============

try {
    const cron = require('node-cron');
    cron.schedule('0 9 * * *', async () => {
        console.log('🔄 Running proactive checks...');
        
        const inactiveUsers = proactiveCoach.checkInactiveUsers();
        for (const user of inactiveUsers) {
            try {
                const message = proactiveCoach.getInactivityMessage(user, user.daysOff);
                await bot.sendMessage(user.userId, message, { parse_mode: 'Markdown' });
                console.log(`📨 Sent inactivity message to ${user.name}`);
            } catch (error) {
                console.error('Error sending proactive message:', error);
            }
        }

        const users = database.users;
        for (const [userId, user] of Object.entries(users)) {
            try {
                const countdown = proactiveCoach.getExamCountdownMessage(user);
                if (countdown) {
                    await bot.sendMessage(userId, countdown, { parse_mode: 'Markdown' });
                    console.log(`📨 Sent exam countdown to ${user.name}`);
                }
            } catch (error) {
                console.error('Error sending exam countdown:', error);
            }
        }
    });
} catch (e) {
    console.log('⚠️ Proactive features disabled');
}

// ============ HTTP SERVER FOR RENDER ============

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🤖 A+ Coach Bot with Mr. M is running!');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`✅ HTTP server running on port ${PORT}`);
    console.log(`🤖 ${config.BOT_NAME} v${config.BOT_VERSION} is running...`);
    console.log(`📁 Data directory: ${config.DATA_DIR}`);
    console.log(`📚 Books directory: ${config.BOOKS_DIR}`);
});

console.log('✅ All handlers registered. Mr. M is ready to teach! 🧑‍🏫');
