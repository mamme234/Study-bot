require('dotenv').config();
const path = require('path');

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    BOT_NAME: 'A+ Coach',
    BOT_VERSION: '3.0',
    
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    
    DATA_DIR: path.join(__dirname, 'data'),
    USERS_FILE: path.join(__dirname, 'data', 'users.json'),
    SUBJECTS_FILE: path.join(__dirname, 'data', 'subjects.json'),
    EXAMS_FILE: path.join(__dirname, 'data', 'exams.json'),
    LIBRARY_FILE: path.join(__dirname, 'data', 'library.json'),
    LEADERBOARD_FILE: path.join(__dirname, 'data', 'leaderboard.json'),
    
    BOOKS_DIR: path.join(__dirname, 'data', 'books'),
    MAX_FILE_SIZE: 50 * 1024 * 1024,
    ALLOWED_EXTENSIONS: ['.pdf', '.txt', '.docx', '.epub', '.md'],
    
    CHUNK_SIZE: 2000,
    OVERLAP: 200,
    
    EXAM_DATES: {
        grade_8: '2026-06-15',
        grade_10: '2026-06-20',
        grade_12: '2026-06-25'
    },
    
    XP: {
        LESSON: 50,
        QUIZ: 20,
        BONUS: 10,
        STREAK: 5,
        BOOK_UPLOAD: 100,
        SCHEDULE_COMPLETE: 200,
        DAILY_GOAL: 50
    },
    
    SUBJECTS: {
        nursery: {
            name: 'Nursery',
            subjects: [
                'English', 'Amharic', 'Afaan Oromo', 'Numbers & Mathematics',
                'Environmental Awareness', 'Drawing & Art', 'Music',
                'Physical Education', 'Social Skills', 'Storytelling'
            ],
            emojis: {
                'English': '🇬🇧', 'Amharic': '🇪🇹', 'Afaan Oromo': '🌍',
                'Numbers & Mathematics': '🔢', 'Environmental Awareness': '🌿',
                'Drawing & Art': '🎨', 'Music': '🎵', 'Physical Education': '🏃',
                'Social Skills': '🤝', 'Storytelling': '📖'
            }
        },
        kg: {
            name: 'Kindergarten',
            subjects: [
                'English', 'Amharic', 'Afaan Oromo', 'Numbers & Mathematics',
                'Environmental Awareness', 'Drawing & Art', 'Music',
                'Physical Education', 'Social Skills', 'Storytelling'
            ],
            emojis: {
                'English': '🇬🇧', 'Amharic': '🇪🇹', 'Afaan Oromo': '🌍',
                'Numbers & Mathematics': '🔢', 'Environmental Awareness': '🌿',
                'Drawing & Art': '🎨', 'Music': '🎵', 'Physical Education': '🏃',
                'Social Skills': '🤝', 'Storytelling': '📖'
            }
        },
        '1-4': {
            name: 'Grades 1-4',
            subjects: [
                'Mathematics', 'English', 'Amharic', 'Afaan Oromo',
                'Environmental Science', 'General Science', 'Social Studies',
                'Moral & Civics', 'Art', 'Music', 'Physical Education'
            ],
            emojis: {
                'Mathematics': '📘', 'English': '📗', 'Amharic': '🇪🇹',
                'Afaan Oromo': '🌍', 'Environmental Science': '🌱',
                'General Science': '🔬', 'Social Studies': '🌍',
                'Moral & Civics': '⚖️', 'Art': '🎨', 'Music': '🎵',
                'Physical Education': '🏃'
            }
        },
        '5-8': {
            name: 'Grades 5-8',
            subjects: [
                'Mathematics', 'English', 'Amharic', 'Afaan Oromo',
                'Biology', 'Chemistry', 'Physics', 'General Science',
                'Geography', 'History', 'ICT', 'Civics & Ethics',
                'Physical Education', 'Art', 'Music'
            ],
            emojis: {
                'Mathematics': '📘', 'English': '📗', 'Amharic': '🇪🇹',
                'Afaan Oromo': '🌍', 'Biology': '🧬', 'Chemistry': '🧪',
                'Physics': '⚡', 'General Science': '🔬', 'Geography': '🌍',
                'History': '📜', 'ICT': '💻', 'Civics & Ethics': '⚖️',
                'Physical Education': '🏃', 'Art': '🎨', 'Music': '🎵'
            }
        },
        '9-10': {
            name: 'Grades 9-10',
            subjects: [
                'Mathematics', 'English', 'Amharic', 'Afaan Oromo',
                'Biology', 'Chemistry', 'Physics',
                'Geography', 'History', 'ICT', 'Civics', 'Physical Education'
            ],
            emojis: {
                'Mathematics': '📘', 'English': '📗', 'Amharic': '🇪🇹',
                'Afaan Oromo': '🌍', 'Biology': '🧬', 'Chemistry': '🧪',
                'Physics': '⚡', 'Geography': '🌍', 'History': '📜',
                'ICT': '💻', 'Civics': '⚖️', 'Physical Education': '🏃'
            }
        },
        '11-12_natural': {
            name: 'Grades 11-12 (Natural)',
            subjects: [
                'Mathematics', 'English', 'Physics', 'Chemistry',
                'Biology', 'ICT', 'Physical Education'
            ],
            emojis: {
                'Mathematics': '📘', 'English': '📗', 'Physics': '⚡',
                'Chemistry': '🧪', 'Biology': '🧬', 'ICT': '💻',
                'Physical Education': '🏃'
            }
        },
        '11-12_social': {
            name: 'Grades 11-12 (Social)',
            subjects: [
                'Mathematics', 'English', 'Economics', 'Geography',
                'History', 'Civics', 'ICT', 'Physical Education'
            ],
            emojis: {
                'Mathematics': '📘', 'English': '📗', 'Economics': '💹',
                'Geography': '🌍', 'History': '📜', 'Civics': '⚖️',
                'ICT': '💻', 'Physical Education': '🏃'
            }
        }
    },
    
    FEATURES: {
        lessons: '📖 Lessons',
        notes: '📝 Notes',
        textbooks: '📚 Textbooks',
        quizzes: '❓ Quizzes',
        videos: '🎥 Videos',
        audio: '🎧 Audio Lessons',
        ai_explain: '🧑‍🏫 Ask Mr. M',
        assignments: '📄 Assignments',
        practice_exams: '🧪 Practice Exams',
        important_questions: '⭐ Important Questions',
        progress: '📊 Progress Tracking',
        revision_plans: '🎯 Revision Plans',
        worksheet: '📄 Worksheet'
    }
};
