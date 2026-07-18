require('dotenv').config();
const path = require('path');

module.exports = {
    // Bot Settings
    BOT_TOKEN: process.env.BOT_TOKEN,
    BOT_NAME: 'A+ Coach',
    BOT_VERSION: '3.0',
    
    // API Keys
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    
    // Database - Use absolute paths
    DATA_DIR: path.join(__dirname, 'data'),
    USERS_FILE: path.join(__dirname, 'data', 'users.json'),
    SUBJECTS_FILE: path.join(__dirname, 'data', 'subjects.json'),
    EXAMS_FILE: path.join(__dirname, 'data', 'exams.json'),
    LIBRARY_FILE: path.join(__dirname, 'data', 'library.json'),
    LEADERBOARD_FILE: path.join(__dirname, 'data', 'leaderboard.json'),
    
    // Book Upload Settings
    BOOKS_DIR: path.join(__dirname, 'data', 'books'),
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_EXTENSIONS: ['.pdf', '.txt', '.docx', '.epub', '.md'],
    
    // AI Settings
    CHUNK_SIZE: 2000,
    OVERLAP: 200,
    
    // Exam Dates (Ethiopian Calendar)
    EXAM_DATES: {
        grade_8: '2026-06-15',
        grade_10: '2026-06-20',
        grade_12: '2026-06-25'
    },
    
    // XP Settings
    XP: {
        LESSON: 50,
        QUIZ: 20,
        BONUS: 10,
        STREAK: 5,
        BOOK_UPLOAD: 100,
        SCHEDULE_COMPLETE: 200,
        DAILY_GOAL: 50
    },
    
    // ============ COMPLETE SUBJECTS BY GRADE ============
    SUBJECTS: {
        // ... (keep existing SUBJECTS config)
    },
    
    // ============ FEATURES PER SUBJECT ============
    FEATURES: {
        // ... (keep existing FEATURES config)
    }
};
