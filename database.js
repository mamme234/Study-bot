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
            }
        } catch (e) {
            this.users = {};
        }
        this.saveData();
    }

    saveData() {
        try {
            fs.ensureDirSync(path.dirname(this.usersFile));
            fs.writeJsonSync(this.usersFile, this.users, { spaces: 2 });
        } catch (e) {
            console.error('Save error:', e);
        }
    }

    getSubjects(grade, stream) {
        const key = grade <= 4 ? '1-4' : grade <= 8 ? '5-8' : grade <= 10 ? '9-10' : 
                    stream === 'Social' ? '11-12_social' : '11-12_natural';
        return config.SUBJECTS[key] || config.SUBJECTS['5-8'];
    }

    createUser(userId, name, language, grade, stream) {
        const id = String(userId);
        if (this.users[id]) return this.users[id];

        const subjects = this.getSubjects(grade, stream);
        const progress = {};
        subjects.forEach(s => { progress[s] = { lessons: 0, quizAvg: 0, xp: 0 }; });

        this.users[id] = {
            name: name || 'Student',
            language: language || 'English',
            grade: grade || 8,
            stream: stream || null,
            subjects,
            progress,
            xp: 0,
            level: 1,
            streak: 0,
            lastActive: new Date().toISOString(),
            quizScores: [],
            books: [],
            schedule: null,
            dailyGoal: { lessons: 2, quiz: 10, hours: 1 },
            settings: { notifications: true, reminderTime: '16:00' },
            reminders: [],
            dailyTasks: [],
            examDate: null
        };
        this.saveData();
        return this.users[id];
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

    resetUser(userId) {
        const id = String(userId);
        if (this.users[id]) {
            delete this.users[id];
            this.saveData();
            return true;
        }
        return false;
    }

    getAllUsers() {
        return this.users;
    }

    getLeaderboard(limit = 10) {
        return Object.values(this.users)
            .sort((a, b) => (b.xp || 0) - (a.xp || 0))
            .slice(0, limit);
    }

    addDailyTask(userId, task) {
        const user = this.getUser(userId);
        if (!user) return false;
        if (!user.dailyTasks) user.dailyTasks = [];
        user.dailyTasks.push({ task, completed: false, date: new Date().toISOString() });
        this.saveData();
        return true;
    }

    completeDailyTask(userId, index) {
        const user = this.getUser(userId);
        if (!user || !user.dailyTasks) return false;
        if (index >= 0 && index < user.dailyTasks.length) {
            user.dailyTasks[index].completed = true;
            user.dailyTasks[index].completedAt = new Date().toISOString();
            this.saveData();
            return true;
        }
        return false;
    }

    getTodayTasks(userId) {
        const user = this.getUser(userId);
        if (!user) return [];
        const today = new Date().toDateString();
        return (user.dailyTasks || []).filter(t => 
            new Date(t.date).toDateString() === today
        );
    }
}

module.exports = new Database();
