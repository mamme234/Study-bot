const config = require('./config');

class Menu {
    static getEmoji(subject) {
        return config.EMOJIS[subject] || '📚';
    }

    static mainMenu(user) {
        const keyboard = [
            [{ text: '📚 Study', callback_data: 'study' }],
            [{ text: '📝 Exams', callback_data: 'exams' }],
            [{ text: '🧑‍🏫 Ask Mr. M', callback_data: 'ai' }],
            [{ text: '📖 Library', callback_data: 'library' }],
            [{ text: '📚 Upload Book', callback_data: 'upload' }],
            [{ text: '📅 Schedule', callback_data: 'schedule' }],
            [{ text: '✅ Daily Tasks', callback_data: 'dailytasks' }],
            [{ text: '🎯 Daily Goal', callback_data: 'goal' }],
            [{ text: '📊 Progress', callback_data: 'progress' }],
            [{ text: '🏆 Leaderboard', callback_data: 'leaderboard' }],
            [{ text: '🔔 Reminders', callback_data: 'reminders' }],
            [{ text: '🔄 Reset', callback_data: 'reset' }],
            [{ text: '⚙️ Settings', callback_data: 'settings' }]
        ];

        const streak = user?.streak || 0;
        const xp = user?.xp || 0;
        const level = user?.level || 1;

        const text = `
🧑‍🏫 **Mr. M - Your AI Teacher**

👋 Welcome back, ${user?.name || 'Student'}!
📚 ${user?.grade ? `Grade ${user.grade}` : 'Not set'}
🔥 Streak: ${streak} days
⭐ XP: ${xp} | 🏆 Level: ${level}

*What would you like to do today?*
`;
        return { text, keyboard };
    }

    static studyMenu(subjects) {
        const keyboard = subjects.map(s => 
            [{ text: `${this.getEmoji(s)} ${s}`, callback_data: `subject_${s}` }]
        );
        keyboard.push([{ text: '🔙 Back', callback_data: 'menu' }]);
        return { text: '📚 **Subjects**\n\nChoose a subject:', keyboard };
    }

    static subjectMenu(subject) {
        const keyboard = [
            [{ text: '📖 Lessons', callback_data: `lesson_${subject}` }],
            [{ text: '📝 Notes', callback_data: `notes_${subject}` }],
            [{ text: '❓ Quiz', callback_data: `quiz_${subject}` }],
            [{ text: '📄 Worksheet', callback_data: `worksheet_${subject}` }],
            [{ text: '🧑‍🏫 Ask Mr. M', callback_data: `ask_${subject}` }],
            [{ text: '🔙 Back', callback_data: 'study' }]
        ];
        return { 
            text: `${this.getEmoji(subject)} **${subject}**\n\nWhat would you like to do?`,
            keyboard 
        };
    }

    static examsMenu(grade) {
        const keyboard = [
            [{ text: '📝 Worksheets', callback_data: 'exam_worksheets' }],
            [{ text: '📋 Tests', callback_data: 'exam_tests' }],
            [{ text: '📊 Midterm', callback_data: 'exam_midterm' }],
            [{ text: '📈 Final', callback_data: 'exam_final' }]
        ];
        if ([8, 10, 12].includes(grade)) {
            keyboard.push([{ text: '🏛️ Ministry', callback_data: 'exam_ministry' }]);
        }
        if (grade === 12) {
            keyboard.push([{ text: '🎓 Entrance', callback_data: 'exam_entrance' }]);
        }
        keyboard.push([{ text: '🔙 Back', callback_data: 'menu' }]);
        return { text: '📝 **Exam Center**', keyboard };
    }

    static settingsMenu(user) {
        const keyboard = [
            [{ text: '👤 Change Grade', callback_data: 'set_grade' }],
            [{ text: '🌐 Change Language', callback_data: 'set_lang' }],
            [{ text: '📚 Change Stream', callback_data: 'set_stream' }],
            [{ text: '📅 Set Exam Date', callback_data: 'set_exam' }],
            [{ text: '🔔 Notifications', callback_data: 'set_notify' }],
            [{ text: '🔄 Reset All Data', callback_data: 'reset_confirm' }],
            [{ text: '🔙 Back', callback_data: 'menu' }]
        ];
        const text = `
⚙️ **Settings**

• Grade: ${user?.grade || 'Not set'}
• Stream: ${user?.stream || 'Not set'}
• Language: ${user?.language || 'English'}
• Exam Date: ${user?.examDate || 'Not set'}
• Notifications: ${user?.settings?.notifications !== false ? 'On' : 'Off'}
`;
        return { text, keyboard };
    }

    static gradeMenu() {
        const grades = ['nursery', 'kg', ...Array.from({length: 12}, (_, i) => i + 1)];
        const keyboard = grades.map(g => {
            const label = ['nursery', 'kg'].includes(String(g)) ? g : `Grade ${g}`;
            return [{ text: label, callback_data: `grade_${g}` }];
        });
        return { text: '📚 **Choose your grade:**', keyboard };
    }

    static languageMenu() {
        return {
            text: '🌐 **Choose your language:**',
            keyboard: [
                [{ text: '🇬🇧 English', callback_data: 'lang_English' }],
                [{ text: '🇪🇹 አማርኛ', callback_data: 'lang_Amharic' }],
                [{ text: '🌍 Afaan Oromo', callback_data: 'lang_Afaan Oromo' }]
            ]
        };
    }

    static streamMenu() {
        return {
            text: '📚 **Choose your stream:**',
            keyboard: [
                [{ text: '🔬 Natural', callback_data: 'stream_Natural' }],
                [{ text: '📖 Social', callback_data: 'stream_Social' }]
            ]
        };
    }

    static reminderMenu(user) {
        const reminders = user?.reminders || [];
        const keyboard = [
            [{ text: '⏰ Add Reminder', callback_data: 'reminder_add' }],
            [{ text: '📋 View Reminders', callback_data: 'reminder_view' }],
            [{ text: '🗑️ Clear All', callback_data: 'reminder_clear' }],
            [{ text: '🔙 Back', callback_data: 'menu' }]
        ];
        let text = '🔔 **Reminders**\n\n';
        if (reminders.length === 0) {
            text += 'No reminders set. Add one!';
        } else {
            reminders.forEach((r, i) => {
                text += `${i + 1}. ⏰ ${r.time} - ${r.message}\n`;
            });
        }
        return { text, keyboard };
    }

    static dailyTasksMenu(user) {
        const tasks = user?.dailyTasks || [];
        const todayTasks = tasks.filter(t => 
            new Date(t.date).toDateString() === new Date().toDateString()
        );

        const keyboard = [
            [{ text: '➕ Add Task', callback_data: 'task_add' }],
            [{ text: '✅ Complete Task', callback_data: 'task_complete' }],
            [{ text: '📋 View All', callback_data: 'task_view' }],
            [{ text: '🔙 Back', callback_data: 'menu' }]
        ];

        let text = '✅ **Today\'s Tasks**\n\n';
        if (todayTasks.length === 0) {
            text += 'No tasks for today. Add one!';
        } else {
            todayTasks.forEach((t, i) => {
                const status = t.completed ? '✅' : '⬜';
                text += `${status} ${i + 1}. ${t.task}\n`;
            });
        }

        text += '\n📅 **Daily Study Schedule**\n\n';
        text += '🌅 **Morning (6:00 - 8:00)**\n';
        text += '• 🌅 Wake up & Morning Review\n';
        text += '• 📚 Study hardest subject\n';
        text += '• ✍️ Practice questions\n\n';

        text += '📚 **Midday (10:00 - 12:00)**\n';
        text += '• 📖 Study second hardest subject\n';
        text += '• 📝 Take notes\n';
        text += '• 🔄 Review flashcards\n\n';

        text += '🌤️ **Afternoon (14:00 - 16:00)**\n';
        text += '• 📝 Practice exams\n';
        text += '• 🧮 Solve problems\n';
        text += '• 👥 Group study\n\n';

        text += '🌙 **Evening (19:00 - 21:00)**\n';
        text += '• 📖 Review what you learned\n';
        text += '• 📅 Plan next day\n';
        text += '• 📝 Light revision\n\n';

        text += '💡 *Complete your tasks to earn XP!*';

        return { text, keyboard };
    }

    static scheduleMenu() {
        const keyboard = [
            [{ text: '📅 Generate Schedule', callback_data: 'schedule_generate' }],
            [{ text: '📖 View My Schedule', callback_data: 'schedule_view' }],
            [{ text: '✅ Daily Tasks', callback_data: 'dailytasks' }],
            [{ text: '🔙 Back', callback_data: 'menu' }]
        ];

        const text = `
📅 **Study Schedule**

I'll create a personalized schedule based on:
• Your uploaded books
• Your grade level
• Your study goals

You'll get:
• 📚 Daily study plan
• ✅ Specific tasks to complete
• ⏰ Time blocks for each subject
• 🎯 Progress tracking

*Upload a book first for the best schedule!*
`;
        return { text, keyboard };
    }
}

module.exports = Menu;
