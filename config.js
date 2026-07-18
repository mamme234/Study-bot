require('dotenv').config();
const path = require('path');

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    BOT_NAME: 'Mr. M',
    VERSION: '4.0',
    
    DATA_DIR: path.join(__dirname, 'data'),
    USERS_FILE: path.join(__dirname, 'data', 'users.json'),
    BOOKS_DIR: path.join(__dirname, 'data', 'books'),
    
    MAX_FILE_SIZE: 50 * 1024 * 1024,
    ALLOWED_EXTENSIONS: ['.pdf', '.txt', '.docx', '.epub', '.md'],
    
    XP: {
        LESSON: 50,
        QUIZ: 20,
        BONUS: 10,
        BOOK_UPLOAD: 100,
        DAILY_GOAL: 50,
        SCHEDULE_COMPLETE: 200
    },
    
    SUBJECTS: {
        'nursery': ['English', 'Amharic', 'Afaan Oromo', 'Numbers', 'Drawing', 'Music'],
        'kg': ['English', 'Amharic', 'Afaan Oromo', 'Numbers', 'Drawing', 'Music'],
        '1-4': ['Mathematics', 'English', 'Amharic', 'Afaan Oromo', 'Science', 'Social Studies'],
        '5-8': ['Mathematics', 'English', 'Amharic', 'Afaan Oromo', 'Biology', 'Chemistry', 'Physics', 'Geography', 'History', 'ICT'],
        '9-10': ['Mathematics', 'English', 'Amharic', 'Afaan Oromo', 'Biology', 'Chemistry', 'Physics', 'Geography', 'History', 'ICT'],
        '11-12_natural': ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'ICT'],
        '11-12_social': ['Mathematics', 'English', 'Economics', 'Geography', 'History', 'Civics']
    },
    
    EMOJIS: {
        'Mathematics': '📘', 'English': '📗', 'Amharic': '🇪🇹',
        'Afaan Oromo': '🌍', 'Biology': '🧬', 'Chemistry': '🧪',
        'Physics': '⚡', 'Geography': '🌍', 'History': '📜',
        'ICT': '💻', 'Economics': '💹', 'Civics': '⚖️',
        'Science': '🔬', 'Social Studies': '🌍', 'Numbers': '🔢',
        'Drawing': '🎨', 'Music': '🎵'
    },
    
    // Daily schedule template
    DAILY_SCHEDULE: {
        morning: {
            time: '6:00 - 8:00',
            activities: ['Wake up & Morning Review', 'Study hardest subject', 'Practice questions']
        },
        midday: {
            time: '10:00 - 12:00',
            activities: ['Study second hardest subject', 'Take notes', 'Review flashcards']
        },
        afternoon: {
            time: '14:00 - 16:00',
            activities: ['Practice exams', 'Solve problems', 'Group study']
        },
        evening: {
            time: '19:00 - 21:00',
            activities: ['Review what you learned', 'Plan next day', 'Light revision']
        }
    }
};
