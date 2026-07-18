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

// ============ ENSURE DIRECTORIES ============
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

// ============ INITIALIZE BOT ============
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });
const scheduleGenerator = new ScheduleGenerator(database, bookProcessor);
const gamification = new Gamification(database);
const aiTeacher = new AITeacher(database);
const proactiveCoach = new ProactiveCoach(database);

console.log(`🧑‍🏫 Mr. M - ${config.BOT_NAME} v${config.BOT_VERSION} is running...`);

// ============ GLOBAL STORAGE ============
global.tempFileData = {};
global.activeQuiz = {};
global.activeAsk = {};
global.registrationState = {};
global.waitingForHours = {};
global.testSessions = {};

// ============ COMMAND HANDLERS ============

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        let user = database.getUser(userId);

        if (user) {
            await bot.sendMessage(chatId, 
                `🧑‍🏫 **Hello ${user.name}!**\n\nI'm **Mr. M**, your personal AI Teacher.\n\nLet's continue learning! 📚✨`,
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

🇪🇹 I'm here to help Ethiopian students excel.

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

bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const helpText = `
🧑‍🏫 **Mr. M's Help Guide**

**Commands:**
• /start - Start the bot
• /help - Show this guide
• /menu - Show main menu
• /test - Start a practice test
• /quiz - Quick quiz
• /cancel - Cancel current operation

**What I Can Do:**
• 📚 Teach any subject
• 📝 Create custom tests
• 📖 Learn from uploaded books
• 📅 Generate study schedules
• 📊 Track your progress
• 🏆 Help you earn XP!

**Quick Tips:**
• Upload your textbook
• Type "test me on [subject]"
• Type "explain [topic]"
• Type "quiz me on [subject]"

💡 *Just type your questions naturally!*
`;
    await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
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

        // ========== REGISTRATION ==========
        if (data.startsWith('lang_')) {
            const language = data.replace('lang_', '');
            global.registrationState[userId].language = language;
            
            const { text, keyboard } = Menu.gradeSelectionMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data.startsWith('grade_')) {
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

✅ Profile created for Grade ${grade}

Let's start learning! 🚀`,
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
            return;
        }

        // ========== STREAM SELECTION (FIXED) ==========
        if (data.startsWith('stream_')) {
            const stream = data.replace('stream_', '');
            const name = global.registrationState[userId]?.name || 'Student';
            const language = global.registrationState[userId]?.language || 'English';
            const grade = global.registrationState[userId]?.grade || 11;
            
            console.log(`📝 Creating user: ${name}, Grade: ${grade}, Stream: ${stream}`);
            
            try {
                const user = database.createUser(userId, name, language, grade, stream);
                delete global.registrationState[userId];

                await bot.sendMessage(chatId,
                    `🧑‍🏫 **Welcome ${name}!**

✅ Profile Created:
• Grade: ${grade} (${stream} Stream)
• Language: ${language}

Let's start learning! 🚀`,
                    { parse_mode: 'Markdown' }
                );

                const { text, keyboard } = Menu.mainMenu(user);
                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                });
            } catch (error) {
                console.error('Stream creation error:', error);
                await bot.editMessageText(
                    `❌ Error creating profile. Please try again with /start`,
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown'
                    }
                );
            }
            return;
        }

        // ========== MAIN MENU ==========
        if (data === 'main_menu' || data === 'home') {
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
            return;
        }

        if (data === 'study') {
            const user = database.getUser(userId);
            const subjects = user?.subjects || [];
            const { text, keyboard } = Menu.studyMenu(subjects);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'exams') {
            const user = database.getUser(userId);
            const grade = user?.grade || 8;
            const { text, keyboard } = Menu.examsMenu(grade);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'settings') {
            const user = database.getUser(userId);
            const { text, keyboard } = Menu.settingsMenu(user);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'upload_book') {
            const { text, keyboard } = Menu.uploadBookMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'schedule') {
            const { text, keyboard } = Menu.scheduleMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'ai_teacher') {
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
            return;
        }

        if (data === 'library') {
            const user = database.getUser(userId);
            const grade = user?.grade || 8;
            const textbooks = library.getTextbooks(grade);
            
            let text = `📖 **Mr. M's Library**\n\n📚 **Textbooks for Grade ${grade}:**\n`;
            for (const [subject, book] of Object.entries(textbooks)) {
                const emoji = Menu.getEmoji(subject);
                text += `\n• ${emoji} ${subject}: ${book}`;
            }
            text += '\n\n💡 *Upload your own textbooks for personalized learning!*';

            const keyboard = [
                [{ text: '📤 Upload Book', callback_data: 'upload_book' }],
                [{ text: '🔙 Back', callback_data: 'main_menu' }]
            ];
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'progress') {
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
📝 Quiz Average: ${progress.quizAverage}%

📚 **Subject Progress:**
`;
            for (const [subject, data] of Object.entries(progress.progress)) {
                const emoji = Menu.getEmoji(subject);
                text += `\n• ${emoji} ${subject}: ${data.lessonsCompleted} lessons`;
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
            return;
        }

        if (data === 'leaderboard') {
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
            return;
        }

        if (data === 'daily_goal') {
            const user = database.getUser(userId);
            const goal = user?.dailyGoal || { lessons: 2, quiz: 15, hours: 1 };
            const text = `
🎯 **Today's Goal**

✅ Read ${goal.lessons} lessons
⬜ Complete ${goal.quiz} quiz questions
⬜ Study for ${goal.hours} hour(s)

Reward: +${config.XP.DAILY_GOAL} XP
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
            return;
        }

        if (data === 'complete_goal') {
            const result = gamification.completeDailyGoal(userId);
            await bot.editMessageText(result, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔙 Back', callback_data: 'main_menu' }]]
                }
            });
            return;
        }

        if (data === 'schedule_generate') {
            await bot.editMessageText(
                '📅 **Mr. M is creating your schedule...**',
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
                [{ text: '🔙 Back', callback_data: 'main_menu' }]
            ];
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'schedule_view') {
            const user = database.getUser(userId);
            const schedule = user?.schedule;
            if (!schedule) {
                await bot.editMessageText(
                    '📅 No schedule yet. Upload a book and generate one!',
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
                        [{ text: '🔙 Back', callback_data: 'main_menu' }]
                    ]
                }
            });
            return;
        }

        if (data === 'book_list') {
            const books = await bookProcessor.getUserBooks(userId);
            if (!books || books.length === 0) {
                await bot.editMessageText(
                    '📚 No books uploaded yet.',
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
            let text = '📚 **Your Books**\n\n';
            const keyboard = [];
            for (const book of books.slice(-5)) {
                text += `📖 ${book.originalFilename}\n📚 ${book.subject}\n\n`;
                keyboard.push([
                    { text: `📖 ${book.originalFilename.substring(0, 20)}`, callback_data: `book_select_${book.fileHash}` }
                ]);
            }
            keyboard.push([{ text: '🔙 Back', callback_data: 'main_menu' }]);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        // ========== SUBJECT HANDLERS ==========
        if (data.startsWith('subject_')) {
            const subject = data.replace('subject_', '');
            const { text, keyboard } = Menu.subjectMenu(subject);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data.startsWith('feature_')) {
            const parts = data.split('_');
            const subject = parts[1];
            const feature = parts.slice(2).join('_');

            let text = '';
            const keyboard = [[{ text: '🔙 Back', callback_data: `subject_${subject}` }]];

            switch(feature) {
                case 'lessons':
                    const lessons = study.getLessons(subject);
                    text = `📖 **${subject} Lessons**\n\n`;
                    if (lessons.length === 0) {
                        text += 'No lessons available. Upload a textbook!';
                    } else {
                        lessons.forEach((lesson, i) => {
                            text += `**${i + 1}. ${lesson.title}**\n${lesson.content.substring(0, 150)}...\n\n`;
                        });
                    }
                    break;
                case 'notes':
                    text = `📝 **${subject} Notes**\n\n${study.getNotes(subject)}`;
                    break;
                case 'quizzes':
                    text = `❓ **${subject} Quiz**\n\nType "quiz me on ${subject}"`;
                    break;
                case 'worksheet':
                    text = aiTeacher.generateWorksheet(subject, user?.grade || 8);
                    break;
                case 'ai_explain':
                    text = `🧑‍🏫 **Ask Mr. M about ${subject}**\n\nJust type your question!`;
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
            return;
        }

        // ========== EXAM HANDLERS ==========
        if (data.startsWith('exam_')) {
            const examType = data.replace('exam_', '');
            const user = database.getUser(userId);
            const grade = user?.grade || 8;

            let text = '';
            const keyboard = [[{ text: '🔙 Back', callback_data: 'exams' }]];

            switch(examType) {
                case 'worksheets':
                    text = '📝 **Worksheets**\n\nType "worksheet [subject]" to get one!';
                    break;
                case 'tests':
                    text = '📋 **Tests**\n\nType "test me on [subject]" to start!';
                    break;
                case 'midterm':
                    const midterm = exams.getMidterm(grade);
                    text = midterm ? `📊 **Midterm**\n\nSubjects: ${midterm.subjects.join(', ')}\nDuration: ${midterm.duration}` : 'No midterm available';
                    break;
                case 'final':
                    const final = exams.getFinal(grade);
                    text = final ? `📈 **Final Exam**\n\nSubjects: ${final.subjects.join(', ')}\nDuration: ${final.duration}` : 'No final available';
                    break;
                case 'ministry':
                    const ministry = exams.getMinistry(grade);
                    text = ministry ? `🏛️ **Ministry Exam**\n\n${ministry.name}\nYear: ${ministry.year}` : 'No ministry exam available';
                    break;
                case 'entrance':
                    const entrance = exams.getEntrance(grade);
                    text = entrance ? `🎓 **Entrance Exam**\n\n${entrance.name}\nDuration: ${entrance.duration}` : 'No entrance exam available';
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
            return;
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
            await bot.sendMessage(chatId, `❌ File too large! Max: ${config.MAX_FILE_SIZE / (1024 * 1024)}MB`);
            return;
        }

        const fileName = document.file_name || 'unnamed';
        const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
        
        if (!config.ALLOWED_EXTENSIONS.includes(ext)) {
            await bot.sendMessage(chatId, `❌ Unsupported format: ${ext}`);
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
            `📚 **Upload: ${fileName}**\n\nWhich subject?`,
            {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            }
        );

    } catch (error) {
        console.error('Document error:', error);
        await bot.sendMessage(chatId, '❌ Error processing document.');
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

        // Registration
        if (global.registrationState[userId]?.step === 'name') {
            global.registrationState[userId].name = text;
            global.registrationState[userId].step = 'complete';
            const { text: langText, keyboard } = Menu.languageMenu();
            await bot.sendMessage(chatId, langText, {
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        // AI Teacher
        if (user) {
            const response = aiTeacher.teach(userId, text);
            await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        } else {
            await bot.sendMessage(chatId, 'Please start with /start first!');
        }

    } catch (error) {
        console.error('Message error:', error);
        await bot.sendMessage(chatId, '❌ An error occurred.');
    }
});

// ============ BOOK SUBJECT HANDLER ============

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;

    if (data.startsWith('book_subject_')) {
        const subject = data.replace('book_subject_', '');
        await bot.answerCallbackQuery(callbackQuery.id);

        const tempData = global.tempFileData[userId];
        if (!tempData) {
            await bot.sendMessage(chatId, '❌ File not found. Upload again.');
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
            `📚 Subject: ${subject}\n\nWhich grade?`,
            {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: keyboard }
            }
        );
        return;
    }

    if (data.startsWith('book_grade_')) {
        const gradeStr = data.replace('book_grade_', '');
        const grade = isNaN(gradeStr) ? gradeStr : parseInt(gradeStr);
        await bot.answerCallbackQuery(callbackQuery.id);

        const tempData = global.tempFileData[userId];
        if (!tempData) {
            await bot.sendMessage(chatId, '❌ File not found.');
            return;
        }

        await bot.editMessageText(
            '⏳ Processing...',
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
                    message_id: messageId
                });
                return;
            }

            gamification.uploadBook(userId);

            const keyboard = [
                [{ text: '📅 Generate Schedule', callback_data: `schedule_from_book_${result.fileHash}` }],
                [{ text: '📚 My Books', callback_data: 'book_list' }],
                [{ text: '🔙 Back', callback_data: 'main_menu' }]
            ];

            await bot.editMessageText(
                `
✅ **Book Uploaded!**

📖 ${tempData.fileName}
📚 ${tempData.subject} | Grade ${grade}
📊 ${result.totalChunks} sections

✨ +${config.XP.BOOK_UPLOAD} XP
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
            console.error('Book error:', error);
            await bot.editMessageText(`❌ Error: ${error.message}`, {
                chat_id: chatId,
                message_id: messageId
            });
        }
        return;
    }

    if (data.startsWith('schedule_from_book_')) {
        const bookHash = data.replace('schedule_from_book_', '');
        await bot.answerCallbackQuery(callbackQuery.id);
        
        await bot.editMessageText(
            '📅 Generating schedule...',
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
        return;
    }

    if (data.startsWith('book_select_')) {
        const bookHash = data.replace('book_select_', '');
        await bot.answerCallbackQuery(callbackQuery.id);
        
        const keyboard = [
            [{ text: '📅 Generate Schedule', callback_data: `schedule_from_book_${bookHash}` }],
            [{ text: '❓ Ask Question', callback_data: `book_ask_${bookHash}` }],
            [{ text: '🔙 Back', callback_data: 'book_list' }]
        ];

        await bot.editMessageText(
            '📖 **Book Selected**\n\nWhat would you like to do?',
            {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            }
        );
        return;
    }

    if (data.startsWith('book_ask_')) {
        const bookHash = data.replace('book_ask_', '');
        await bot.answerCallbackQuery(callbackQuery.id);
        
        global.activeAsk[userId] = { bookHash };
        await bot.editMessageText(
            `💬 **Ask a question about your book**

Type your question naturally.`,
            {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown'
            }
        );
        return;
    }

    // ========== CHANGE SETTINGS ==========
    if (data === 'change_grade') {
        const { text, keyboard } = Menu.gradeSelectionMenu();
        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: keyboard }
        });
        return;
    }

    if (data === 'change_language') {
        const { text, keyboard } = Menu.languageMenu();
        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: keyboard }
        });
        return;
    }

    if (data === 'change_stream') {
        const { text, keyboard } = Menu.streamMenu();
        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: keyboard }
        });
        return;
    }

    if (data === 'notifications') {
        const user = database.getUser(userId);
        if (!user) return;
        const current = user.settings?.notifications !== false;
        const newSetting = !current;
        database.updateUser(userId, {
            settings: { ...(user.settings || {}), notifications: newSetting }
        });
        await bot.editMessageText(
            `🔔 Notifications: ${newSetting ? '✅ On' : '❌ Off'}`,
            {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [[{ text: '🔙 Back', callback_data: 'settings' }]]
                }
            }
        );
        return;
    }

    if (data === 'schedule_hours') {
        await bot.editMessageText(
            `⏰ **Set Study Hours**\n\nHow many hours per day? (1-8)`,
            {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown'
            }
        );
        global.waitingForHours[userId] = true;
        return;
    }
});

// ============ HTTP SERVER ============

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🧑‍🏫 Mr. M - A+ Coach Bot is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ HTTP server on port ${PORT}`);
});

// ============ ERROR HANDLERS ============

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('🧑‍🏫 Mr. M is ready to teach!');
