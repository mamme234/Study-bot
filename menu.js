const config = require('./config');

class Menu {
    static getEmoji(subject) {
        const emojis = {
            'English': '🇬🇧', 'Amharic': '🇪🇹', 'Afaan Oromo': '🌍',
            'Numbers & Mathematics': '🔢', 'Environmental Awareness': '🌿',
            'Drawing & Art': '🎨', 'Music': '🎵', 'Physical Education': '🏃',
            'Social Skills': '🤝', 'Storytelling': '📖', 'Mathematics': '📘',
            'Environmental Science': '🌱', 'General Science': '🔬',
            'Social Studies': '🌍', 'Moral & Civics': '⚖️', 'Art': '🎨',
            'Civics': '⚖️', 'Biology': '🧬', 'Chemistry': '🧪',
            'Physics': '⚡', 'Geography': '🌍', 'History': '📜',
            'ICT': '💻', 'Civics & Ethics': '⚖️', 'Economics': '💹'
        };
        return emojis[subject] || '📚';
    }

    static getGradeDisplay(grade) {
        if (['nursery', 'kg'].includes(grade)) {
            return grade.charAt(0).toUpperCase() + grade.slice(1);
        }
        return `Grade ${grade}`;
    }

    static mainMenu(user) {
        const name = user?.name || 'Student';
        const streak = user?.streak || 0;
        const gradeDisplay = this.getGradeDisplay(user?.grade);

        const keyboard = [
            [{ text: '🏠 Home', callback_data: 'home' }],
            [{ text: '📚 Study', callback_data: 'study' }],
            [{ text: '📝 Exams', callback_data: 'exams' }],
            [{ text: '🧑‍🏫 Mr. M - AI Teacher', callback_data: 'ai_teacher' }],
            [{ text: '📖 Library', callback_data: 'library' }],
            [{ text: '📚 Upload Book', callback_data: 'upload_book' }],
            [{ text: '📅 Schedule', callback_data: 'schedule' }],
            [{ text: '🎯 Daily Goal', callback_data: 'daily_goal' }],
            [{ text: '📊 Progress', callback_data: 'progress' }],
            [{ text: '🏆 Leaderboard', callback_data: 'leaderboard' }],
            [{ text: '⚙️ Settings', callback_data: 'settings' }]
        ];

        const text = `
🧑‍🏫 **Mr. M - Your AI Teacher**

👋 Welcome back, ${name}!
📚 ${gradeDisplay} Student
🔥 Streak: ${streak} days

*What would you like to do today?*
`;

        return { text, keyboard };
    }

    static studyMenu(subjects) {
        const keyboard = subjects.map(subject => {
            const emoji = this.getEmoji(subject);
            return [{ text: `${emoji} ${subject}`, callback_data: `subject_${subject}` }];
        });

        keyboard.push([{ text: '🔙 Back', callback_data: 'main_menu' }]);

        const text = `
📚 **Study**

Select a subject to continue:
`;

        return { text, keyboard };
    }

    static subjectMenu(subject) {
        const keyboard = [
            [{ text: '📖 Lessons', callback_data: `feature_${subject}_lessons` }],
            [{ text: '📝 Notes', callback_data: `feature_${subject}_notes` }],
            [{ text: '📚 Textbooks', callback_data: `feature_${subject}_textbooks` }],
            [{ text: '❓ Quiz', callback_data: `feature_${subject}_quizzes` }],
            [{ text: '🧑‍🏫 Ask Mr. M', callback_data: `feature_${subject}_ai_explain` }],
            [{ text: '📄 Worksheet', callback_data: `feature_${subject}_worksheet` }],
            [{ text: '📚 Upload Book', callback_data: `upload_for_subject_${subject}` }],
            [{ text: '🔙 Back', callback_data: 'study' }]
        ];

        const emoji = this.getEmoji(subject);
        const text = `
${emoji} **${subject}**

What would you like to do?

*Tip: Upload your textbook for personalized learning!*
`;

        return { text, keyboard };
    }

    static examsMenu(grade) {
        const keyboard = [
            [{ text: '📝 Worksheets', callback_data: 'exam_worksheets' }],
            [{ text: '📋 Tests', callback_data: 'exam_tests' }],
            [{ text: '📊 Midterm', callback_data: 'exam_midterm' }],
            [{ text: '📈 Final (Model)', callback_data: 'exam_final' }]
        ];

        if ([8, 10, 12].includes(grade)) {
            keyboard.push([{ text: '🏛️ Ministry Exam', callback_data: 'exam_ministry' }]);
        }

        if (grade === 12) {
            keyboard.push([{ text: '🎓 Entrance Exam', callback_data: 'exam_entrance' }]);
        }

        keyboard.push([{ text: '🔙 Back', callback_data: 'main_menu' }]);

        const text = `
📝 **Exam Center**

Select exam type:
`;

        return { text, keyboard };
    }

    static settingsMenu(user) {
        const keyboard = [
            [{ text: '👤 Change Grade', callback_data: 'change_grade' }],
            [{ text: '🌐 Change Language', callback_data: 'change_language' }],
            [{ text: '📚 Change Stream', callback_data: 'change_stream' }],
            [{ text: '🔔 Notifications', callback_data: 'notifications' }],
            [{ text: '🔙 Back', callback_data: 'main_menu' }]
        ];

        const text = `
⚙️ **Settings**

Current Settings:
• Grade: ${this.getGradeDisplay(user?.grade)}
• Stream: ${user?.stream || 'Not set'}
• Language: ${user?.language || 'English'}
• Notifications: ${user?.settings?.notifications !== false ? 'On' : 'Off'}
`;

        return { text, keyboard };
    }

    static uploadBookMenu() {
        const keyboard = [
            [{ text: '📚 Upload Book', callback_data: 'upload_book' }],
            [{ text: '📖 My Books', callback_data: 'book_list' }],
            [{ text: '🔙 Back', callback_data: 'main_menu' }]
        ];

        const text = `
📚 **Book Upload**

Upload your textbooks to:
• 📖 Generate lessons from your book
• ❓ Create custom quizzes
• 💬 Ask questions about your book
• 📝 Get summaries and notes
• 📅 Create personalized study schedule

*Supported formats:* PDF, DOCX, TXT, EPUB, MD
*Max size:* 50MB

Just send me your book file!
`;

        return { text, keyboard };
    }

    static scheduleMenu() {
        const keyboard = [
            [{ text: '📅 Generate Schedule', callback_data: 'schedule_generate' }],
            [{ text: '📖 View My Schedule', callback_data: 'schedule_view' }],
            [{ text: '📚 From Uploaded Book', callback_data: 'schedule_from_book' }],
            [{ text: '⏰ Set Study Hours', callback_data: 'schedule_hours' }],
            [{ text: '🔙 Back', callback_data: 'main_menu' }]
        ];

        const text = `
📅 **Study Schedule**

I can create a personalized study schedule from your uploaded books!

Features:
• 📚 Based on your textbook content
• 📅 Daily and weekly plans
• ⏰ Study time recommendations
• 🎯 Topic prioritization
• 📊 Progress tracking

*Upload a book first for the best schedule!*
`;

        return { text, keyboard };
    }

    static gradeSelectionMenu() {
        const grades = ['nursery', 'kg', ...Array.from({ length: 12 }, (_, i) => i + 1)];
        const keyboard = grades.map(grade => {
            const display = ['nursery', 'kg'].includes(grade) 
                ? grade.charAt(0).toUpperCase() + grade.slice(1)
                : `Grade ${grade}`;
            return [{ text: display, callback_data: `grade_${grade}` }];
        });

        return { text: '📚 Choose your grade:', keyboard };
    }

    static languageMenu() {
        const keyboard = [
            [{ text: '🇬🇧 English', callback_data: 'lang_English' }],
            [{ text: '🇪🇹 አማርኛ', callback_data: 'lang_Amharic' }],
            [{ text: '🌍 Afaan Oromo', callback_data: 'lang_Afaan Oromo' }]
        ];

        return { text: '🌐 Choose your language:', keyboard };
    }

    static streamMenu() {
        const keyboard = [
            [{ text: '🔬 Natural', callback_data: 'stream_Natural' }],
            [{ text: '📖 Social', callback_data: 'stream_Social' }]
        ];

        return { text: '📚 Choose your stream:', keyboard };
    }

    static buildKeyboard(keyboard) {
        return { reply_markup: { inline_keyboard: keyboard } };
    }
}

module.exports = Menu;
