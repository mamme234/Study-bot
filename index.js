require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const database = require('./database');
const Menu = require('./menu');
const bookProcessor = require('./bookProcessor');
const ScheduleGenerator = require('./scheduleGenerator');

// Initialize bot
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });
const scheduleGenerator = new ScheduleGenerator(database, bookProcessor);

console.log(`🤖 ${config.BOT_NAME} is running...`);

// ============ COMMAND HANDLERS ============

// /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    let user = database.getUser(userId);

    if (user) {
        const { text, keyboard } = Menu.mainMenu(user);
        await bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
        });
    } else {
        await bot.sendMessage(chatId, 
            `👋 Welcome to **A+ Coach**!

I'm your personal exam preparation assistant.

What's your name?`,
            { parse_mode: 'Markdown' }
        );
        // Store registration state
        const userData = { registration: true };
        await bot.sendMessage(chatId, 'Please type your name:');
    }
});

// ============ CALLBACK QUERY HANDLER ============

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    await bot.answerCallbackQuery(callbackQuery.id);

    try {
        // ========== REGISTRATION ==========
        if (data.startsWith('lang_')) {
            const language = data.replace('lang_', '');
            const userData = { language };
            
            const { text, keyboard } = Menu.gradeSelectionMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data.startsWith('grade_')) {
            const gradeStr = data.replace('grade_', '');
            const grade = isNaN(gradeStr) ? gradeStr : parseInt(gradeStr);
            
            const userData = { grade };

            if (typeof grade === 'number' && grade >= 11) {
                const { text, keyboard } = Menu.streamMenu();
                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    reply_markup: { inline_keyboard: keyboard }
                });
            } else {
                // Create user
                const name = callbackQuery.message.text.split('\n')[0] || 'Student';
                const language = 'English';
                const user = database.createUser(userId, name, language, grade);
                
                const { text, keyboard } = Menu.mainMenu(user);
                await bot.editMessageText(
                    `✅ Registration complete!\n\nWelcome to A+ Coach! 🎉\n\n${text}`,
                    {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        parse_mode: 'Markdown',
                        reply_markup: { inline_keyboard: keyboard }
                    }
                );
            }
        }

        else if (data.startsWith('stream_')) {
            const stream = data.replace('stream_', '');
            const name = 'Student';
            const language = 'English';
            const grade = 11;
            
            const user = database.createUser(userId, name, language, grade, stream);
            
            const { text, keyboard } = Menu.mainMenu(user);
            await bot.editMessageText(
                `✅ Registration complete!\n\nWelcome to A+ Coach! 🎉\n\n${text}`,
                {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
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
                message_id: callbackQuery.message.message_id,
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
                message_id: callbackQuery.message.message_id,
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
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'settings') {
            const user = database.getUser(userId);
            const { text, keyboard } = Menu.settingsMenu(user);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'upload_book') {
            const { text, keyboard } = Menu.uploadBookMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'schedule') {
            const { text, keyboard } = Menu.scheduleMenu();
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'schedule_generate') {
            await bot.editMessageText(
                '📅 **Generating your schedule...**\n\nI\'m analyzing your uploaded books to create a personalized study plan.',
                {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    parse_mode: 'Markdown'
                }
            );

            const schedule = await scheduleGenerator.generateScheduleFromBooks(userId);
            
            if (schedule.error) {
                await bot.editMessageText(schedule.error, {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
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
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'schedule_view') {
            const user = database.getUser(userId);
            const schedule = user?.schedule;

            if (!schedule) {
                await bot.editMessageText(
                    '📅 You don\'t have a schedule yet.\n\nUpload a book and generate a personalized schedule!',
                    {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
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
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔄 Regenerate', callback_data: 'schedule_generate' }],
                        [{ text: '🔙 Back', callback_data: 'main_menu' }]
                    ]
                }
            });
        }

        else if (data === 'book_list') {
            const books = await bookProcessor.getUserBooks(userId);
            
            if (!books || books.length === 0) {
                await bot.editMessageText(
                    '📚 You haven\'t uploaded any books yet.',
                    {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
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
                text += `📖 ${book.originalFilename}\n`;
                text += `📚 ${book.subject} | 📅 Grade ${book.grade}\n`;
                text += `📊 ${book.totalChunks} sections\n`;
                text += `📅 ${book.uploadedAt.substring(0, 10)}\n\n`;
                
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
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data.startsWith('book_select_')) {
            const bookHash = data.replace('book_select_', '');
            
            const keyboard = [
                [{ text: '📅 Generate Schedule', callback_data: `schedule_from_book_${bookHash}` }],
                [{ text: '📖 View Content', callback_data: `book_content_${bookHash}` }],
                [{ text: '❓ Ask Question', callback_data: `book_ask_${bookHash}` }],
                [{ text: '🔙 Back', callback_data: 'book_list' }]
            ];

            await bot.editMessageText(
                '📖 **Book Selected**\n\nWhat would you like to do?',
                {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );
        }

        else if (data.startsWith('schedule_from_book_')) {
            const bookHash = data.replace('schedule_from_book_', '');
            
            await bot.editMessageText(
                '📅 **Generating schedule from your book...**\n\nCreating a personalized study plan based on this book\'s content.',
                {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    parse_mode: 'Markdown'
                }
            );

            const schedule = await scheduleGenerator.generateScheduleFromBooks(userId, bookHash);
            
            if (schedule.error) {
                await bot.editMessageText(schedule.error, {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    parse_mode: 'Markdown'
                });
                return;
            }

            database.saveSchedule(userId, schedule);
            const text = scheduleGenerator.formatScheduleText(schedule);

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📅 View Schedule', callback_data: 'schedule_view' }],
                        [{ text: '🔙 Back', callback_data: 'book_list' }]
                    ]
                }
            });
        }

        else if (data.startsWith('subject_')) {
            const subject = data.replace('subject_', '');
            const { text, keyboard } = Menu.subjectMenu(subject);
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data.startsWith('feature_')) {
            const parts = data.split('_');
            const subject = parts[1];
            const feature = parts[2];

            const responses = {
                lessons: `📖 **${subject} Lessons**\n\nCheck your uploaded books for lessons!`,
                notes: `📝 **${subject} Notes**\n\nKey concepts will appear here.`,
                quizzes: `❓ **${subject} Quiz**\n\nPractice questions coming soon!`,
                ai_explain: `🤖 Ask me anything about ${subject}!`,
                textbooks: `📚 **${subject} Textbooks**\n\nUpload your textbook for personalized content!`,
                assignments: `📄 **${subject} Assignments**\n\nPractice assignments will appear here.`
            };

            await bot.editMessageText(
                responses[feature] || `📚 **${subject}**\n\nFeature coming soon!`,
                {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    parse_mode: 'Markdown'
                }
            );
        }

        else if (data === 'progress') {
            const user = database.getUser(userId);
            if (!user) return;

            let text = `
📊 **Your Progress**

👤 ${user.name}
🏆 Level: ${user.level || 1}
⭐ XP: ${user.xp || 0}
🔥 Streak: ${user.streak || 0} days

📚 **Subject Progress:**
`;

            if (user.progress) {
                Object.entries(user.progress).forEach(([subject, data]) => {
                    text += `\n• ${subject}: ${data.lessonsCompleted || 0} lessons, ${data.quizAvg || 0}% avg`;
                });
            }

            const keyboard = [[{ text: '🔙 Back', callback_data: 'main_menu' }]];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'leaderboard') {
            const leaderboard = database.getLeaderboard(10);
            let text = '🏆 **Leaderboard**\n\n';

            leaderboard.forEach((user, index) => {
                const medal = { 0: '🥇', 1: '🥈', 2: '🥉' }[index] || `${index + 1}.`;
                text += `${medal} ${user.name} - Level ${user.level || 1} (${user.xp || 0} XP)\n`;
            });

            const keyboard = [[{ text: '🔙 Back', callback_data: 'main_menu' }]];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
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

Reward: +100 XP

💡 *Tip: Break your study into 25-minute sessions*
`;

            const keyboard = [[{ text: '🔙 Back', callback_data: 'main_menu' }]];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'library') {
            const user = database.getUser(userId);
            const grade = user?.grade || 8;

            let text = `
📖 **Library**

**Textbooks available:**
`;

            // Add sample textbooks
            const textbooks = {
                8: ['Mathematics', 'English', 'Biology', 'Chemistry', 'Physics', 'Geography', 'History'],
                12: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Geography', 'History']
            };

            const books = textbooks[grade] || textbooks[8];
            books.forEach(book => {
                const emoji = Menu.getEmoji(book);
                text += `\n• ${emoji} ${book} Textbook`;
            });

            text += '\n\n📝 **Upload your own textbooks for personalized learning!**';

            const keyboard = [
                [{ text: '📚 Upload Book', callback_data: 'upload_book' }],
                [{ text: '🔙 Back', callback_data: 'main_menu' }]
            ];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
        }

        else if (data === 'ai_teacher') {
            const text = `
🤖 **AI Teacher**

I can help you with:
• 📖 Explain concepts
• 🧮 Solve problems
• 📝 Create summaries
• ❓ Generate quizzes
• 🌍 Respond in Amharic or Afaan Oromo

Just type your question naturally!
`;

            const keyboard = [[{ text: '🔙 Back', callback_data: 'main_menu' }]];

            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
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

    const user = database.getUser(userId);
    if (!user) {
        await bot.sendMessage(chatId, 'Please start the bot with /start first!');
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

    // Store file info
    global.tempFileData = global.tempFileData || {};
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
});

// ============ BOOK SUBJECT HANDLER ============

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    if (data.startsWith('book_subject_')) {
        const subject = data.replace('book_subject_', '');
        await bot.answerCallbackQuery(callbackQuery.id);

        const tempData = global.tempFileData?.[userId];
        if (!tempData) {
            await bot.sendMessage(chatId, '❌ File not found. Please upload again.');
            return;
        }

        const grades = ['nursery', 'kg', ...Array.from({ length: 12 }, (_, i) => i + 1)];
        const keyboard = grades.map(grade => {
            const display = ['nursery', 'kg'].includes(grade) 
                ? grade.charAt(0).toUpperCase() + grade.slice(1)
                : `Grade ${grade}`;
            return [{ text: display, callback_data: `book_grade_${grade}_${subject}` }];
        });

        await bot.editMessageText(
            `📚 Subject: ${subject}\n\nWhich grade is this book for?`,
            {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                reply_markup: { inline_keyboard: keyboard }
            }
        );
    }

    else if (data.startsWith('book_grade_')) {
        const parts = data.split('_');
        const gradeStr = parts[2];
        const subject = parts.slice(3).join('_');
        
        await bot.answerCallbackQuery(callbackQuery.id);

        const grade = isNaN(gradeStr) ? gradeStr : parseInt(gradeStr);
        const tempData = global.tempFileData?.[userId];

        if (!tempData) {
            await bot.sendMessage(chatId, '❌ File not found. Please upload again.');
            return;
        }

        await bot.editMessageText(
            '⏳ **Processing your book...**',
            {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'Markdown'
            }
        );

        try {
            // Get file from Telegram
            const file = await bot.getFile(tempData.fileId);
            const fileBuffer = await bot.downloadFile(file.file_id, './temp/');
            
            // Process book
            const result = await bookProcessor.processUploadedBook(
                fileBuffer,
                tempData.fileName,
                userId,
                subject,
                grade,
                user.language || 'English'
            );

            if (result.error) {
                await bot.editMessageText(`❌ ${result.error}`, {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id
                });
                return;
            }

            const keyboard = [
                [{ text: '📅 Generate Schedule', callback_data: `schedule_from_book_${result.fileHash}` }],
                [{ text: '📖 View Content', callback_data: `book_content_${result.fileHash}` }],
                [{ text: '📚 My Books', callback_data: 'book_list' }],
                [{ text: '🔙 Back', callback_data: 'main_menu' }]
            ];

            await bot.editMessageText(
                `
✅ **Book Uploaded Successfully!**

📖 ${tempData.fileName}
📚 Subject: ${subject}
📅 Grade: ${grade}
📊 ${result.totalChunks} sections extracted
✨ +${config.XP.BOOK_UPLOAD} XP

What would you like to do next?
`,
                {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                }
            );

            // Clean up temp data
            delete global.tempFileData[userId];

        } catch (error) {
            console.error('Book processing error:', error);
            await bot.editMessageText(`❌ Error processing book: ${error.message}`, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id
            });
        }
    }
});

// ============ MESSAGE HANDLER ============

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Skip if not text or is command
    if (!text || text.startsWith('/')) return;
    if (msg.document) return;

    const user = database.getUser(userId);
    if (!user) {
        await bot.sendMessage(chatId, 'Please start with /start');
        return;
    }

    // Check if user is in registration
    if (global.registrationState && global.registrationState[userId]) {
        // Handle registration
        const name = text;
        const { text: langText, keyboard } = Menu.languageMenu();
        await bot.sendMessage(chatId, langText, {
            reply_markup: { inline_keyboard: keyboard }
        });
        delete global.registrationState[userId];
        return;
    }

    // AI Teacher - answer questions
    await bot.sendMessage(chatId, 
        `🤖 **AI Teacher**

I'm analyzing your question: "${text}"

📚 Based on your uploaded books and grade ${user.grade} curriculum:

*This is a great question! Let me help you understand this better.*

💡 *Tip:* Upload your textbook for more personalized answers!`,
        { parse_mode: 'Markdown' }
    );
});

// ============ ERROR HANDLING ============

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('✅ Bot is ready!');
