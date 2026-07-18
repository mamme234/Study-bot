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
            console.log('✅ Users saved successfully');
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
        try {
            const userIdStr = String(userId);
            
            // Check if user already exists
            if (this.users[userIdStr]) {
                console.log(`User ${userIdStr} already exists, updating...`);
                return this.users[userIdStr];
            }

            const subjects = this.getSubjects(grade, stream);
            
            // Initialize progress object
            const progress = {};
            subjects.forEach(subject => {
                progress[subject] = {
                    lessonsCompleted: 0,
                    quizAvg: 0,
                    xpEarned: 0
                };
            });

            const user = {
                name: name || 'Student',
                language: language || 'English',
                grade: grade,
                gradeType: this.getGradeType(grade),
                stream: stream || null,
                subjects: subjects,
                goal: goal || 'Pass exams',
                xp: 0,
                level: 1,
                streak: 0,
                lastActive: new Date().toISOString(),
                completedLessons: [],
                quizScores: [],
                dailyGoal: { lessons: 2, quiz: 15, hours: 1 },
                progress: progress,
                books: [],
                schedule: null,
                settings: {
                    notifications: true,
                    language: language || 'English',
                    reminderTime: '16:00'
                }
            };

            this.users[userIdStr] = user;
            this.saveData();
            console.log(`✅ User created: ${name} (${userIdStr})`);
            return user;

        } catch (error) {
            console.error('Error creating user:', error);
            // Return a default user to prevent crashes
            return {
                name: name || 'Student',
                language: language || 'English',
                grade: grade || 8,
                stream: stream || null,
                subjects: ['Mathematics', 'English'],
                xp: 0,
                level: 1,
                streak: 0,
                progress: {},
                settings: { notifications: true, language: 'English', reminderTime: '16:00' }
            };
        }
    }

    getUser(userId) {
        try {
            const userIdStr = String(userId);
            return this.users[userIdStr] || null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    updateUser(userId, data) {
        try {
            const id = String(userId);
            if (this.users[id]) {
                this.users[id] = { ...this.users[id], ...data };
                this.saveData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    }

    getLeaderboard(limit = 10) {
        try {
            return Object.entries(this.users)
                .map(([id, user]) => ({ id, ...user }))
                .sort((a, b) => (b.xp || 0) - (a.xp || 0))
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    saveSchedule(userId, schedule) {
        try {
            const id = String(userId);
            if (this.users[id]) {
                this.users[id].schedule = schedule;
                this.saveData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error saving schedule:', error);
            return false;
        }
    }

    getSchedule(userId) {
        try {
            const user = this.getUser(userId);
            return user ? user.schedule : null;
        } catch (error) {
            console.error('Error getting schedule:', error);
            return null;
        }
    }

    addBookToUser(userId, bookData) {
        try {
            const id = String(userId);
            if (this.users[id]) {
                if (!this.users[id].books) {
                    this.users[id].books = [];
                }
                this.users[id].books.push(bookData);
                this.saveData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error adding book:', error);
            return false;
        }
    }

    getBooks(userId) {
        try {
            const user = this.getUser(userId);
            return user ? user.books || [] : [];
        } catch (error) {
            console.error('Error getting books:', error);
            return [];
        }
    }

    // Reset user (for testing)
    resetUser(userId) {
        try {
            const id = String(userId);
            if (this.users[id]) {
                delete this.users[id];
                this.saveData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error resetting user:', error);
            return false;
        }
    }

    // Get all users (for admin)
    getAllUsers() {
        return this.users;
    }
}

module.exports = new Database();
