const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

class Database {
    constructor() {
        this.usersFile = config.USERS_FILE;
        this.users = {};
        this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(this.usersFile)) {
                this.users = fs.readJsonSync(this.usersFile);
            } else {
                this.users = {};
                this.saveData();
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = {};
        }
    }

    saveData() {
        try {
            fs.ensureDirSync(path.dirname(this.usersFile));
            fs.writeJsonSync(this.usersFile, this.users, { spaces: 2 });
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    getSubjects(grade, stream = null) {
        const gradeStr = String(grade).toLowerCase();
        
        if (['nursery', 'kg'].includes(gradeStr)) {
            return config.SUBJECTS.nursery.subjects;
        } else if (grade <= 4) {
            return config.SUBJECTS['1-4'].subjects;
        } else if (grade <= 8) {
            return config.SUBJECTS['5-8'].subjects;
        } else if (grade <= 10) {
            return config.SUBJECTS['9-10'].subjects;
        } else {
            if (stream && stream.toLowerCase() === 'social') {
                return config.SUBJECTS['11-12_social'].subjects;
            } else {
                return config.SUBJECTS['11-12_natural'].subjects;
            }
        }
    }

    getGradeType(grade) {
        if (['nursery', 'kg'].includes(grade)) return 'early';
        if (grade <= 4) return 'primary';
        if (grade <= 8) return 'middle';
        if (grade <= 10) return 'secondary';
        return 'high';
    }

    getSubjectEmoji(grade, subject) {
        const gradeStr = String(grade).toLowerCase();
        let emojis = {};
        
        if (['nursery', 'kg'].includes(gradeStr)) {
            emojis = config.SUBJECTS.nursery.emojis;
        } else if (grade <= 4) {
            emojis = config.SUBJECTS['1-4'].emojis;
        } else if (grade <= 8) {
            emojis = config.SUBJECTS['5-8'].emojis;
        } else if (grade <= 10) {
            emojis = config.SUBJECTS['9-10'].emojis;
        } else {
            if (config.SUBJECTS['11-12_natural'].subjects.includes(subject)) {
                emojis = config.SUBJECTS['11-12_natural'].emojis;
            } else {
                emojis = config.SUBJECTS['11-12_social'].emojis;
            }
        }
        
        return emojis[subject] || '📚';
    }

    createUser(userId, name, language, grade, stream = null, goal = null) {
        const subjects = this.getSubjects(grade, stream);
        const user = {
            name,
            language,
            grade,
            gradeType: this.getGradeType(grade),
            stream,
            subjects,
            goal,
            xp: 0,
            level: 1,
            streak: 0,
            lastActive: new Date().toISOString(),
            completedLessons: [],
            quizScores: [],
            dailyGoal: { lessons: 2, quiz: 15, hours: 1 },
            progress: {},
            books: [],
            schedule: null,
            settings: {
                notifications: true,
                language,
                reminderTime: '16:00'
            }
        };

        // Initialize progress for each subject
        subjects.forEach(subject => {
            user.progress[subject] = {
                lessonsCompleted: 0,
                quizAvg: 0,
                xpEarned: 0
            };
        });

        this.users[String(userId)] = user;
        this.saveData();
        return user;
    }

    getUser(userId) {
        return this.users[String(userId)] || null;
    }

    updateUser(userId, data) {
        const id = String(userId);
        if (this.users[id]) {
            this.users[id] = { ...this.users[id], ...data };
            this.saveData();
            return true;
        }
        return false;
    }

    getLeaderboard(limit = 10) {
        return Object.entries(this.users)
            .map(([id, user]) => ({ id, ...user }))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, limit);
    }

    saveSchedule(userId, schedule) {
        const id = String(userId);
        if (this.users[id]) {
            this.users[id].schedule = schedule;
            this.saveData();
            return true;
        }
        return false;
    }

    getSchedule(userId) {
        const user = this.getUser(userId);
        return user ? user.schedule : null;
    }

    addBookToUser(userId, bookData) {
        const id = String(userId);
        if (this.users[id]) {
            this.users[id].books.push(bookData);
            this.saveData();
            return true;
        }
        return false;
    }

    getBooks(userId) {
        const user = this.getUser(userId);
        return user ? user.books : [];
    }
}

module.exports = new Database();
