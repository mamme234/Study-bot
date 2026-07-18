require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const cron = require('node-cron');

const config = require('./config');
const database = require('./database');
const Menu = require('./menu');
const AITeacher = require('./aiTeacher');
const ProactiveCoach = require('./proactive');
const gamification = require('./gamification');
const scheduleGenerator = require('./scheduleGenerator');
const bookProcessor = require('./bookProcessor');

// ============ INITIALIZE ============
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });
const aiTeacher = new AITeacher();
const proactive = new ProactiveCoach(database);

// Ensure directories
['./data', './data/books', './data/books/processed', './data/books/chunks', './temp'].forEach(async dir => {
    await fs.ensureDir(dir);
});

console.log(`🧑‍🏫 Mr. M v${config.VERSION} is running...`);

// ============ GLOBAL STATE ============
global.regState = {};
global.tempFiles = {};
global.waitingHours = {};
global.waitingReminder = {};
global.quizSessions = {};
global.waitingExamDate = {};

// ============ COMMAND HANDLERS ============

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        let user = database.getUser(userId);

        if (user) {
            await bot.sendMessage(chatId, `🧑‍🏫 **Welcome back, ${user.name}!**\n\nLet's continue learning! 📚`, { parse_mode: 'Markdown' });
            const { text, keyboard } = Menu.mainMenu(user);
            await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
        } else {
            await bot.sendMessage(chatId, 
                `🧑‍🏫 **Hello! I'm Mr. M - Your AI Teacher!**

I help Ethiopian students excel in their studies.

What's your name?`,
                { parse_mode: 'Markdown' }
            );
            global.regState[userId] = { step: 'name' };
        }
    } catch (e) {
        console.error('Start error:', e);
        await bot.sendMessage(chatId, '❌ Error. Try again.');
    }
});

bot.onText(/\/reset/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    database.resetUser(userId);
    delete global.regState[userId];
    delete global.tempFiles[userId];
    delete global.quizSessions[userId];
    delete global.waitingHours[userId];
    delete global.waitingReminder[userId];

    await bot.sendMessage(chatId, 
        `🔄 **All your data has been reset.**

You can start fresh with /start

🧑‍🏫 *Mr. M is ready to help!*`,
        { parse_mode: 'Markdown' }
    );
});

bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, `
🧑‍🏫 **Mr. M - Help Guide**

**Commands:**
/start - Start the bot
/reset - Reset all your data
/help - Show this guide
/cancel - Cancel current operation

**Features:**
📚 Study any subject
📝 Practice exams
📄 Generate worksheets
❓ Take quizzes
📚 Upload textbooks
📅 Get study schedule
✅ Daily tasks
🔔 Set reminders

**Quick Examples:**
"Explain photosynthesis"
"Quiz me on Math"
"Worksheet on Biology"
"Test me on Physics"

💡 *Just type naturally!*`,
        { parse_mode: 'Markdown' }
    );
});

bot.onText(/\/cancel/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    delete global.regState[userId];
    delete global.tempFiles[userId];
    delete global.quizSessions[userId];
    delete global.waitingHours[userId];
    delete global.waitingReminder[userId];

    await bot.sendMessage(chatId, '✅ Cancelled. Use /start to begin again.');
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

        // ===== REGISTRATION =====
        if (data.startsWith('lang_')) {
            const lang = data.replace('lang_', '');
            if (!global.regState[userId]) global.regState[userId] = {};
            global.regState[userId].language = lang;

            const { text, keyboard } = Menu.gradeMenu();
            await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: keyboard } });
            return;
        }

        if (data.startsWith('grade_')) {
            const gradeStr = data.replace('grade_', '');
            const grade = isNaN(gradeStr) ? gradeStr : parseInt(gradeStr);

            if (!global.regState[userId]) global.regState[userId] = {};
            global.regState[userId].grade = grade;

            if (typeof grade === 'number' && grade >= 11) {
                const { text, keyboard } = Menu.streamMenu();
                await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: keyboard } });
            } else {
                const name = global.regState[userId]?.name || 'Student';
                const lang = global.regState[userId]?.language || 'English';
                const newUser = database.createUser(userId, name, lang, grade);
                delete global.regState[userId];

                await bot.sendMessage(chatId, `🧑‍🏫 **Welcome ${name}!**\n\n✅ Profile created for Grade ${grade}\n\nLet's start learning! 🚀`, { parse_mode: 'Markdown' });
                const { text, keyboard } = Menu.mainMenu(newUser);
                await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
            }
            return;
        }

        if (data.startsWith('stream_')) {
            const stream = data.replace('stream_', '');
            const name = global.regState[userId]?.name || 'Student';
            const lang = global.regState[userId]?.language || 'English';
            const grade = global.regState[userId]?.grade || 11;

            const newUser = database.createUser(userId, name, lang, grade, stream);
            delete global.regState[userId];

            await bot.sendMessage(chatId, `🧑‍🏫 **Welcome ${name}!**\n\n✅ Profile: Grade ${grade} (${stream} Stream)\n\nLet's start learning! 🚀`, { parse_mode: 'Markdown' });
            const { text, keyboard } = Menu.mainMenu(newUser);
            await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
            return;
        }

        // ===== MAIN MENU =====
        if (data === 'menu' || data === 'home') {
            const user = database.getUser(userId);
            const { text, keyboard } = Menu.mainMenu(user);
            await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
            return;
        }

        if (data === 'study') {
            const user = database.getUser(userId);
            const subjects = user?.subjects || ['Mathematics', 'English'];
            const { text, keyboard } = Menu.studyMenu(subjects);
            await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
            return;
        }

        if (data === 'exams') {
            const user = database.getUser(userId);
            const grade = user?.grade || 8;
            const { text, keyboard } = Menu.examsMenu(grade);
            await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
            return;
        }

        if (data === 'settings') {
            const user = database.getUser(userId);
            const { text, keyboard } = Menu.settingsMenu(user);
            await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
            return;
        }

        if (data === 'reminders') {
            const user = database.getUser(userId);
            const { text, keyboard } = Menu.reminderMenu(user);
            await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
            return;
        }

        if (data === 'dailytasks') {
            const user = database.getUser(userId);
            const { text, keyboard } = Menu.dailyTasksMenu(user);
            await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
            return;
        }

        if (data === 'schedule') {
            const { text, keyboard } = Menu.scheduleMenu();
            await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
            return;
        }

        // ===== REMINDERS =====
        if (data === 'reminder_add') {
            global.waitingReminder[userId] = true;
            await bot.editMessageText(
                `⏰ **Add Reminder**

Send me the time and message like this:

\`16:00 Study Math\`

I'll remind you daily at that time!

Examples:
• \`07:00 Morning review\`
• \`14:30 Practice Physics\`
• \`20:00 Summary notes\``,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );
            return;
        }

        if (data === 'reminder_view') {
            const user = database.getUser(userId);
            const reminders = user?.reminders || [];
            
            if (reminders.length === 0) {
                await bot.editMessageText(
                    '🔔 **No reminders set.**\n\nUse "Add Reminder" to create one!',
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '➕ Add Reminder', callback_data: 'reminder_add' }],
                                [{ text: '🔙 Back', callback_data: 'reminders' }]
                            ]
                        }
                    }
                );
                return;
            }

            let text = '🔔 **Your Reminders**\n\n';
            reminders.forEach((r, i) => {
                text += `${i + 1}. ⏰ ${r.time} - ${r.message}\n`;
            });

            const keyboard = [
                [{ text: '➕ Add', callback_data: 'reminder_add' }],
                [{ text: '🗑️ Clear All', callback_data: 'reminder_clear' }],
                [{ text: '🔙 Back', callback_data: 'reminders' }]
            ];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'reminder_clear') {
            const user = database.getUser(userId);
            if (user) {
                database.updateUser(userId, { reminders: [] });
                await bot.editMessageText(
                    '🗑️ **All reminders cleared!**',
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{ text: '🔙 Back', callback_data: 'reminders' }]]
                        }
                    }
                );
            }
            return;
        }

        // ===== DAILY TASKS =====
        if (data === 'task_add') {
            await bot.editMessageText(
                `✅ **Add Daily Task**

Send me your task like this:

\`Study Math Chapter 3\`

I'll add it to your daily tasks!`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );
            global.waitingTask = global.waitingTask || {};
            global.waitingTask[userId] = true;
            return;
        }

        if (data === 'task_complete') {
            const user = database.getUser(userId);
            const tasks = user?.dailyTasks || [];
            const todayTasks = tasks.filter(t => 
                new Date(t.date).toDateString() === new Date().toDateString() && !t.completed
            );

            if (todayTasks.length === 0) {
                await bot.editMessageText(
                    '✅ **No incomplete tasks for today!**\n\nAll tasks completed! 🎉',
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{ text: '🔙 Back', callback_data: 'dailytasks' }]]
                        }
                    }
                );
                return;
            }

            let text = '✅ **Complete a Task**\n\nChoose which task you completed:\n\n';
            const keyboard = [];
            todayTasks.forEach((t, i) => {
                const globalIndex = tasks.indexOf(t);
                text += `${i + 1}. ${t.task}\n`;
                keyboard.push([{ text: `✅ ${t.task.substring(0, 30)}`, callback_data: `task_done_${globalIndex}` }]);
            });
            keyboard.push([{ text: '🔙 Back', callback_data: 'dailytasks' }]);

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data.startsWith('task_done_')) {
            const index = parseInt(data.replace('task_done_', ''));
            const user = database.getUser(userId);
            
            if (user && user.dailyTasks && user.dailyTasks[index]) {
                const task = user.dailyTasks[index];
                if (!task.completed) {
                    database.completeDailyTask(userId, index);
                    
                    // Add XP
                    gamification.addXP(userId, 20, 'task_complete');
                    
                    await bot.editMessageText(
                        `✅ **Task completed!**\n\n📝 ${task.task}\n✨ +20 XP`,
                        {
                            chat_id: chatId,
                            message_id: messageId,
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: '📋 View Tasks', callback_data: 'dailytasks' }],
                                    [{ text: '🔙 Back', callback_data: 'menu' }]
                                ]
                            }
                        }
                    );
                    return;
                }
            }
            
            await bot.editMessageText(
                '❌ Task not found or already completed.',
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🔙 Back', callback_data: 'dailytasks' }]]
                    }
                }
            );
            return;
        }

        if (data === 'task_view') {
            const user = database.getUser(userId);
            const tasks = user?.dailyTasks || [];
            
            if (tasks.length === 0) {
                await bot.editMessageText(
                    '📋 **No tasks found.**\n\nAdd some tasks to track your progress!',
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '➕ Add Task', callback_data: 'task_add' }],
                                [{ text: '🔙 Back', callback_data: 'dailytasks' }]
                            ]
                        }
                    }
                );
                return;
            }

            let text = '📋 **All Your Tasks**\n\n';
            const grouped = {};
            tasks.forEach((t, i) => {
                const date = new Date(t.date).toDateString();
                if (!grouped[date]) grouped[date] = [];
                grouped[date].push({ index: i, ...t });
            });

            for (const [date, items] of Object.entries(grouped)) {
                text += `📅 ${date}\n`;
                items.forEach(t => {
                    const status = t.completed ? '✅' : '⬜';
                    text += `${status} ${t.task}\n`;
                });
                text += '\n';
            }

            const keyboard = [
                [{ text: '➕ Add Task', callback_data: 'task_add' }],
                [{ text: '🔙 Back', callback_data: 'dailytasks' }]
            ];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        // ===== SCHEDULE =====
        if (data === 'schedule_generate') {
            await bot.editMessageText(
                '📅 **Generating your schedule...**\n\nI\'m analyzing your uploaded books...',
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

            database.updateUser(userId, { schedule });
            
            // Add XP
            gamification.addXP(userId, config.XP.SCHEDULE_COMPLETE, 'schedule');

            const text = scheduleGenerator.formatScheduleText(schedule);
            
            const keyboard = [
                [{ text: '📖 View Schedule', callback_data: 'schedule_view' }],
                [{ text: '✅ Daily Tasks', callback_data: 'dailytasks' }],
                [{ text: '🔙 Back', callback_data: 'menu' }]
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
                    '📅 **No schedule yet.**\n\nUpload a book and generate one!',
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '📚 Upload Book', callback_data: 'upload' }],
                                [{ text: '🔙 Back', callback_data: 'menu' }]
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
                        [{ text: '✅ Daily Tasks', callback_data: 'dailytasks' }],
                        [{ text: '🔙 Back', callback_data: 'menu' }]
                    ]
                }
            });
            return;
        }

        // ===== RESET =====
        if (data === 'reset') {
            const keyboard = [
                [{ text: '✅ Yes, Reset Everything', callback_data: 'reset_confirm' }],
                [{ text: '❌ Cancel', callback_data: 'menu' }]
            ];
            await bot.editMessageText(
                `🔄 **Are you sure?**

This will delete ALL your data:
• Progress & XP
• Books uploaded
• Schedule
• Reminders
• Tasks
• Settings

*This cannot be undone!*`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
            return;
        }

        if (data === 'reset_confirm') {
            database.resetUser(userId);
            delete global.regState[userId];
            delete global.tempFiles[userId];
            delete global.quizSessions[userId];
            delete global.waitingHours[userId];
            delete global.waitingReminder[userId];

            await bot.editMessageText(
                `🔄 **All your data has been reset.**

You can start fresh with /start

🧑‍🏫 *Mr. M is ready to help!*`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );
            return;
        }

        // ===== SETTINGS =====
        if (data === 'set_grade') {
            const { text, keyboard } = Menu.gradeMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'set_lang') {
            const { text, keyboard } = Menu.languageMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'set_stream') {
            const { text, keyboard } = Menu.streamMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'set_exam') {
            await bot.editMessageText(
                `📅 **Set Exam Date**

Send me your exam date in this format:

\`2026-06-15\`

I'll count down the days for you!`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );
            global.waitingExamDate[userId] = true;
            return;
        }

        if (data === 'set_notify') {
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
                        inline_keyboard: [[{ text: '🔙 Back', callback_data: 'settings' }]]
                    }
                }
            );
            return;
        }

        // ===== SUBJECT HANDLERS =====
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

        if (data.startsWith('lesson_')) {
            const subject = data.replace('lesson_', '');
            const lessons = ['Introduction', 'Key Concepts', 'Practice Problems', 'Summary'];
            let text = `📖 **${subject} Lessons**\n\n`;
            lessons.forEach((l, i) => {
                text += `${i + 1}. ${l}\n`;
            });
            text += '\n💡 *Upload a textbook for more lessons!*';
            const keyboard = [[{ text: '🔙 Back', callback_data: `subject_${subject}` }]];
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data.startsWith('notes_')) {
            const subject = data.replace('notes_', '');
            const text = `📝 **${subject} Notes**\n\nKey concepts will appear here.\n\n💡 *Upload a textbook for personalized notes!*`;
            const keyboard = [[{ text: '🔙 Back', callback_data: `subject_${subject}` }]];
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data.startsWith('quiz_')) {
            const subject = data.replace('quiz_', '');
            const user = database.getUser(userId);
            const grade = user?.grade || 8;

            await bot.editMessageText(
                `⏳ **Generating quiz...**`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );

            const quizData = await aiTeacher.generateQuiz(subject, grade, 5);
            
            if (!quizData || quizData.length === 0) {
                await bot.editMessageText('❌ Could not generate quiz. Try again.', {
                    chat_id: chatId,
                    message_id: messageId
                });
                return;
            }

            global.quizSessions[userId] = {
                subject,
                questions: quizData,
                current: 0,
                score: 0
            };

            const q = quizData[0];
            const optionsText = q.options.map((opt, i) => 
                `${String.fromCharCode(65 + i)}. ${opt}`
            ).join('\n');

            const keyboard = q.options.map((_, i) => {
                return [{ text: `${String.fromCharCode(65 + i)}`, callback_data: `quiz_answer_${i}` }];
            });

            await bot.editMessageText(
                `❓ **${subject} Quiz - Question 1/${quizData.length}**\n\n${q.question}\n\n${optionsText}`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
            return;
        }

        if (data.startsWith('quiz_answer_')) {
            const answerIndex = parseInt(data.replace('quiz_answer_', ''));
            const session = global.quizSessions[userId];

            if (!session) {
                await bot.editMessageText('❌ Quiz session expired. Start a new quiz.', {
                    chat_id: chatId,
                    message_id: messageId
                });
                return;
            }

            const currentQ = session.current;
            const question = session.questions[currentQ];
            
            if (answerIndex === question.correct) {
                session.score++;
            }

            session.current++;

            if (session.current >= session.questions.length) {
                const percentage = Math.round((session.score / session.questions.length) * 100);
                const xpEarned = percentage >= 70 ? 30 : 15;
                gamification.addXP(userId, xpEarned, 'quiz');

                await bot.editMessageText(
                    `📊 **Quiz Complete!**\n\n📚 ${session.subject}\n✅ Score: ${session.score}/${session.questions.length} (${percentage}%)\n✨ +${xpEarned} XP\n\n${percentage >= 80 ? '🎉 Excellent!' : percentage >= 60 ? '💪 Good job!' : '📚 Keep practicing!'}`,
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '🔄 Retry Quiz', callback_data: `quiz_${session.subject}` }],
                                [{ text: '🔙 Back', callback_data: 'menu' }]
                            ]
                        }
                    }
                );
                delete global.quizSessions[userId];
                return;
            }

            const q = session.questions[session.current];
            const optionsText = q.options.map((opt, i) => 
                `${String.fromCharCode(65 + i)}. ${opt}`
            ).join('\n');

            const keyboard = q.options.map((_, i) => {
                return [{ text: `${String.fromCharCode(65 + i)}`, callback_data: `quiz_answer_${i}` }];
            });

            await bot.editMessageText(
                `❓ **${session.subject} Quiz - Question ${session.current + 1}/${session.questions.length}**\n\n${q.question}\n\n${optionsText}`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
            return;
        }

        if (data.startsWith('worksheet_')) {
            const subject = data.replace('worksheet_', '');
            const user = database.getUser(userId);
            const grade = user?.grade || 8;

            await bot.editMessageText(
                `⏳ **Generating worksheet...**`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );

            const worksheet = await aiTeacher.generateWorksheet(subject, grade);
            
            await bot.editMessageText(
                `📄 **${subject} Worksheet - Grade ${grade}**\n\n${worksheet}`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🔙 Back', callback_data: `subject_${subject}` }]]
                    }
                }
            );
            return;
        }

        if (data.startsWith('ask_')) {
            const subject = data.replace('ask_', '');
            await bot.editMessageText(
                `🧑‍🏫 **Ask Mr. M about ${subject}**\n\nType your question naturally!`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );
            return;
        }

        // ===== EXAMS =====
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
                    text = `📊 **Midterm Exam - Grade ${grade}**\n\n• Subjects: All core subjects\n• Duration: 2 hours\n• Total: 100 marks\n\n💡 *Practice with quizzes!*`;
                    break;
                case 'final':
                    text = `📈 **Final Exam - Grade ${grade}**\n\n• Subjects: All core subjects\n• Duration: 3 hours\n• Total: 150 marks\n\n💡 *Practice with quizzes!*`;
                    break;
                case 'ministry':
                    text = `🏛️ **Ministry Exam - Grade ${grade}**\n\n• National Exam\n• All subjects\n• Duration: 3 hours\n\n💡 *Start preparing early!*`;
                    break;
                case 'entrance':
                    text = `🎓 **Entrance Exam**\n\n• University Entrance\n• 4 hours\n• 250 marks\n\n💡 *Practice daily!*`;
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

        // ===== AI =====
        if (data === 'ai') {
            await bot.editMessageText(
                `🧑‍🏫 **Ask Mr. M Anything!**

I can help with:
• 📖 Explaining concepts
• 🧮 Solving problems
• 📝 Creating summaries
• ❓ Answering questions

Just type your question!`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🔙 Back', callback_data: 'menu' }]]
                    }
                }
            );
            return;
        }

        // ===== LIBRARY =====
        if (data === 'library') {
            const user = database.getUser(userId);
            const grade = user?.grade || 8;
            const subjects = user?.subjects || ['Mathematics', 'English'];
            
            let text = `📖 **Mr. M's Library**\n\n📚 **Textbooks for Grade ${grade}:**\n`;
            subjects.forEach(s => {
                text += `\n• ${Menu.getEmoji(s)} ${s} Textbook`;
            });
            text += '\n\n💡 *Upload your own textbooks for personalized learning!*';

            const keyboard = [
                [{ text: '📤 Upload Book', callback_data: 'upload' }],
                [{ text: '🔙 Back', callback_data: 'menu' }]
            ];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        // ===== UPLOAD =====
        if (data === 'upload') {
            const keyboard = [
                [{ text: '📚 Upload Book', callback_data: 'upload' }],
                [{ text: '📖 My Books', callback_data: 'mybooks' }],
                [{ text: '🔙 Back', callback_data: 'menu' }]
            ];

            await bot.editMessageText(
                `📚 **Upload Your Textbook**

Send me your book file and I'll:
• 📖 Extract lessons
• ❓ Create quizzes
• 📅 Generate schedule
• 📝 Make worksheets

*Supported: PDF, DOCX, TXT, EPUB, MD*
*Max: 50MB*

Just send the file!`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
            return;
        }

        if (data === 'mybooks') {
            const books = await bookProcessor.getUserBooks(userId);
            
            if (!books || books.length === 0) {
                await bot.editMessageText(
                    '📚 **No books uploaded yet.**\n\nUpload your textbook to get started!',
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '📤 Upload Book', callback_data: 'upload' }],
                                [{ text: '🔙 Back', callback_data: 'menu' }]
                            ]
                        }
                    }
                );
                return;
            }

            let text = '📚 **Your Books**\n\n';
            books.forEach((book, i) => {
                text += `${i + 1}. 📖 ${book.originalFilename}\n`;
                text += `   📚 ${book.subject} | Grade ${book.grade}\n`;
                text += `   📊 ${book.totalChunks} sections\n\n`;
            });

            const keyboard = [
                [{ text: '📤 Upload More', callback_data: 'upload' }],
                [{ text: '📅 Generate Schedule', callback_data: 'schedule_generate' }],
                [{ text: '🔙 Back', callback_data: 'menu' }]
            ];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        // ===== PROGRESS =====
        if (data === 'progress') {
            const user = database.getUser(userId);
            if (!user) return;

            const totalQuizzes = user.quizScores?.length || 0;
            const avgScore = totalQuizzes > 0 
                ? Math.round(user.quizScores.reduce((a, b) => a + b, 0) / totalQuizzes)
                : 0;

            let text = `
📊 **Your Progress**

👤 ${user.name}
🏆 Level: ${user.level || 1}
⭐ XP: ${user.xp || 0}
🔥 Streak: ${user.streak || 0} days
📝 Quizzes: ${totalQuizzes}
📊 Avg Quiz Score: ${avgScore}%

📚 **Subject Progress:**
`;

            if (user.progress) {
                Object.entries(user.progress).forEach(([subject, data]) => {
                    const emoji = Menu.getEmoji(subject);
                    text += `\n• ${emoji} ${subject}: ${data.lessons || 0} lessons`;
                });
            }

            const keyboard = [[{ text: '🔙 Back', callback_data: 'menu' }]];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        // ===== GOAL =====
        if (data === 'goal') {
            const user = database.getUser(userId);
            const goal = user?.dailyGoal || { lessons: 2, quiz: 10, hours: 1 };

            const text = `
🎯 **Daily Goal**

✅ Read ${goal.lessons} lessons
⬜ Complete ${goal.quiz} quiz questions
⬜ Study for ${goal.hours} hour(s)

Reward: +${config.XP.DAILY_GOAL} XP

💡 *Complete all for bonus XP!*
`;

            const keyboard = [
                [{ text: '✅ Complete Goal', callback_data: 'complete_goal' }],
                [{ text: '🔙 Back', callback_data: 'menu' }]
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
                    inline_keyboard: [[{ text: '🔙 Back', callback_data: 'menu' }]]
                }
            });
            return;
        }

        // ===== LEADERBOARD =====
        if (data === 'leaderboard') {
            const leaderboard = database.getLeaderboard(10);
            let text = '🏆 **Leaderboard**\n\n';

            leaderboard.forEach((user, index) => {
                const medal = { 0: '🥇', 1: '🥈', 2: '🥉' }[index] || `${index + 1}.`;
                text += `${medal} ${user.name} - Level ${user.level || 1} (${user.xp || 0} XP)\n`;
            });

            // Find user rank
            const allUsers = Object.values(database.getAllUsers());
            const userRank = allUsers
                .sort((a, b) => (b.xp || 0) - (a.xp || 0))
                .findIndex(u => u.id === String(userId)) + 1;
            
            if (userRank > 0) {
                text += `\n📊 **Your Rank:** #${userRank}`;
            }

            const keyboard = [[{ text: '🔙 Back', callback_data: 'menu' }]];

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

        global.tempFiles[userId] = {
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

// ============ BOOK SUBJECT HANDLER ============

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;

    if (data.startsWith('book_subject_')) {
        const subject = data.replace('book_subject_', '');
        await bot.answerCallbackQuery(callbackQuery.id);

        const tempData = global.tempFiles[userId];
        if (!tempData) {
            await bot.sendMessage(chatId, '❌ File not found. Upload again.');
            return;
        }

        global.tempFiles[userId].subject = subject;

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

        const tempData = global.tempFiles[userId];
        if (!tempData) {
            await bot.sendMessage(chatId, '❌ File not found.');
            return;
        }

        await bot.editMessageText(
            '⏳ **Processing...**',
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

            gamification.addXP(userId, config.XP.BOOK_UPLOAD, 'book_upload');

            const keyboard = [
                [{ text: '📅 Generate Schedule', callback_data: 'schedule_generate' }],
                [{ text: '📚 My Books', callback_data: 'mybooks' }],
                [{ text: '🔙 Back', callback_data: 'menu' }]
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

            delete global.tempFiles[userId];

        } catch (error) {
            console.error('Book error:', error);
            await bot.editMessageText(`❌ Error: ${error.message}`, {
                chat_id: chatId,
                message_id: messageId
            });
        }
        return;
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

        // ===== REGISTRATION =====
        if (global.regState[userId]?.step === 'name') {
            global.regState[userId].name = text;
            global.regState[userId].step = 'complete';
            const { text: langText, keyboard } = Menu.languageMenu();
            await bot.sendMessage(chatId, langText, {
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        // ===== REMINDER SETUP =====
        if (global.waitingReminder && global.waitingReminder[userId]) {
            const match = text.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
            if (match) {
                const hours = parseInt(match[1]);
                const minutes = parseInt(match[2]);
                const message = match[3];

                if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    const user = database.getUser(userId);
                    
                    if (user) {
                        const reminders = user.reminders || [];
                        reminders.push({ time: timeStr, message, active: true });
                        database.updateUser(userId, { reminders });
                        
                        delete global.waitingReminder[userId];
                        
                        await bot.sendMessage(chatId, 
                            `✅ **Reminder set!**\n\n⏰ ${timeStr} - ${message}\n\nI'll remind you daily!`,
                            { parse_mode: 'Markdown' }
                        );
                        
                        const { text: menuText, keyboard } = Menu.mainMenu(user);
                        await bot.sendMessage(chatId, menuText, {
                            parse_mode: 'Markdown',
                            reply_markup: { inline_keyboard: keyboard }
                        });
                        return;
                    }
                } else {
                    await bot.sendMessage(chatId, 
                        '❌ **Invalid time!**\n\nUse format: `16:00 Study Math`\n\nExample: `09:30 Review Biology`',
                        { parse_mode: 'Markdown' }
                    );
                    return;
                }
            } else {
                await bot.sendMessage(chatId, 
                    '❌ **Invalid format!**\n\nUse: `16:00 Study Math`\n\nExample: `09:30 Review Biology`',
                    { parse_mode: 'Markdown' }
                );
                return;
            }
        }

        // ===== DAILY TASK SETUP =====
        if (global.waitingTask && global.waitingTask[userId]) {
            const user = database.getUser(userId);
            if (user) {
                database.addDailyTask(userId, text);
                delete global.waitingTask[userId];
                
                await bot.sendMessage(chatId, 
                    `✅ **Task added!**\n\n📝 ${text}\n\nKeep going! 💪`,
                    { parse_mode: 'Markdown' }
                );
                
                const { text: menuText, keyboard } = Menu.mainMenu(user);
                await bot.sendMessage(chatId, menuText, {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                });
                return;
            }
        }

        // ===== EXAM DATE SETUP =====
        if (global.waitingExamDate && global.waitingExamDate[userId]) {
            const dateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (dateMatch) {
                const year = parseInt(dateMatch[1]);
                const month = parseInt(dateMatch[2]) - 1;
                const day = parseInt(dateMatch[3]);
                const examDate = new Date(year, month, day);

                if (!isNaN(examDate) && examDate > new Date()) {
                    database.updateUser(userId, { examDate: examDate.toISOString() });
                    delete global.waitingExamDate[userId];
                    
                    const days = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24));
                    await bot.sendMessage(chatId, 
                        `📅 **Exam date set!**\n\n📅 ${text}\n⏰ ${days} days left!\n\n💪 You've got this!`,
                        { parse_mode: 'Markdown' }
                    );
                    
                    const user = database.getUser(userId);
                    const { text: menuText, keyboard } = Menu.mainMenu(user);
                    await bot.sendMessage(chatId, menuText, {
                        parse_mode: 'Markdown',
                        reply_markup: { inline_keyboard: keyboard }
                    });
                    return;
                } else {
                    await bot.sendMessage(chatId, 
                        '❌ **Invalid date!**\n\nUse future date: `2026-06-15`',
                        { parse_mode: 'Markdown' }
                    );
                    return;
                }
            } else {
                await bot.sendMessage(chatId, 
                    '❌ **Invalid format!**\n\nUse: `2026-06-15`',
                    { parse_mode: 'Markdown' }
                );
                return;
            }
        }

        // ===== AI TEACHER =====
        if (user) {
            const response = await aiTeacher.ask(userId, text, user);
            await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        } else {
            await bot.sendMessage(chatId, 'Please start with /start first!');
        }

    } catch (error) {
        console.error('Message error:', error);
        await bot.sendMessage(chatId, '❌ An error occurred.');
    }
});

// ============ REMINDER CRON JOB ============
cron.schedule('* * * * *', async () => {
    try {
        const dueReminders = proactive.checkReminders();
        
        for (const reminder of dueReminders) {
            try {
                const message = proactive.formatReminderMessage(reminder.userId, reminder);
                await bot.sendMessage(reminder.userId, message, { parse_mode: 'Markdown' });
                console.log(`📨 Sent reminder to ${reminder.name}`);
            } catch (e) {
                console.error('Reminder send error:', e);
            }
        }
    } catch (e) {
        console.error('Cron error:', e);
    }
});

// Inactivity check daily at 9 AM
cron.schedule('0 9 * * *', async () => {
    try {
        const users = database.getAllUsers();
        for (const [userId, user] of Object.entries(users)) {
            const days = Math.floor((Date.now() - new Date(user.lastActive)) / (1000 * 60 * 60 * 24));
            if (days >= 2) {
                const msg = proactive.getInactivityMessage({ ...user, inactiveDays: days });
                await bot.sendMessage(userId, msg, { parse_mode: 'Markdown' });
                console.log(`📨 Sent inactivity alert to ${user.name}`);
            }
        }
    } catch (e) {
        console.error('Inactivity check error:', e);
    }
});

// Exam countdown daily at 8 AM
cron.schedule('0 8 * * *', async () => {
    try {
        const users = database.getAllUsers();
        for (const [userId, user] of Object.entries(users)) {
            const msg = proactive.getExamCountdown(user);
            if (msg) {
                await bot.sendMessage(userId, msg, { parse_mode: 'Markdown' });
                console.log(`📨 Sent exam countdown to ${user.name}`);
            }
        }
    } catch (e) {
        console.error('Exam countdown error:', e);
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

console.log('🧑‍🏫 Mr. M is ready to teach! 🚀');
