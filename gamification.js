const config = require('./config');

class Gamification {
    constructor(database) {
        this.db = database;
    }

    addXP(userId, xpAmount, actionType) {
        const user = this.db.getUser(userId);
        if (!user) return null;

        const currentXP = user.xp || 0;
        const newXP = currentXP + xpAmount;
        const currentLevel = user.level || 1;
        const newLevel = Math.floor(newXP / 500) + 1;

        // Update streak
        let streak = user.streak || 0;
        const lastActive = user.lastActive ? new Date(user.lastActive) : null;
        const now = new Date();

        if (lastActive) {
            const daysDiff = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
                streak += 1;
            } else if (daysDiff > 1) {
                streak = 0;
            }
        } else {
            streak = 1;
        }

        // Update user
        const updates = {
            xp: newXP,
            level: newLevel,
            streak: streak,
            lastActive: now.toISOString()
        };

        // Update progress for action type
        if (actionType === 'lesson') {
            updates.lastLesson = now.toISOString();
        } else if (actionType === 'quiz') {
            updates.lastQuiz = now.toISOString();
        }

        this.db.updateUser(userId, updates);

        // Check for level up
        const levelUp = newLevel > currentLevel;

        return {
            xp: newXP,
            level: newLevel,
            streak: streak,
            levelUp: levelUp,
            xpGained: xpAmount
        };
    }

    completeLesson(userId, subject) {
        const result = this.addXP(userId, config.XP.LESSON, 'lesson');
        if (!result) return '❌ User not found';

        // Update subject progress
        const user = this.db.getUser(userId);
        if (user && user.progress && user.progress[subject]) {
            user.progress[subject].lessonsCompleted = (user.progress[subject].lessonsCompleted || 0) + 1;
            user.progress[subject].xpEarned = (user.progress[subject].xpEarned || 0) + config.XP.LESSON;
            this.db.updateUser(userId, { progress: user.progress });
        }

        let message = `
✅ **Lesson Completed!**

📚 Subject: ${subject}
✨ +${config.XP.LESSON} XP
🔥 Streak: ${result.streak} days
🏆 Level: ${result.level}
`;

        if (result.levelUp) {
            message += `\n🎉 **LEVEL UP!** You're now level ${result.level}!`;
        }

        return message;
    }

    completeQuiz(userId, score, total) {
        const percentage = Math.round((score / total) * 100);
        let xp = config.XP.QUIZ;
        if (percentage >= 80) xp += config.XP.BONUS;
        if (percentage >= 90) xp += config.XP.BONUS;

        const result = this.addXP(userId, xp, 'quiz');
        if (!result) return '❌ User not found';

        // Update quiz scores
        const user = this.db.getUser(userId);
        if (user) {
            const quizScores = user.quizScores || [];
            quizScores.push(percentage);
            this.db.updateUser(userId, { quizScores });
        }

        let message = `
📝 **Quiz Results**

Score: ${score}/${total} (${percentage}%)
✨ +${xp} XP
🔥 Streak: ${result.streak} days
`;

        if (percentage >= 80) {
            message += '\n🎉 **Excellent work!** Keep it up!';
        } else if (percentage >= 60) {
            message += '\n💪 **Good effort!** Practice more to improve.';
        } else {
            message += '\n📚 **Keep practicing!** Review your notes and try again.';
        }

        if (result.levelUp) {
            message += `\n\n🎊 **LEVEL UP!** You're now level ${result.level}!`;
        }

        return message;
    }

    completeDailyGoal(userId) {
        const result = this.addXP(userId, config.XP.DAILY_GOAL, 'daily_goal');
        if (!result) return '❌ User not found';

        return `
🎯 **Daily Goal Completed!**

✨ +${config.XP.DAILY_GOAL} XP
🔥 Streak: ${result.streak} days
🏆 Level: ${result.level}

${result.levelUp ? `\n🎉 **LEVEL UP!** You're now level ${result.level}!` : '🌟 Amazing progress! Keep going!'}
`;
    }

    uploadBook(userId) {
        const result = this.addXP(userId, config.XP.BOOK_UPLOAD, 'book_upload');
        if (!result) return '❌ User not found';

        return `
📚 **Book Upload Reward!**

✨ +${config.XP.BOOK_UPLOAD} XP
🔥 Streak: ${result.streak} days
🏆 Level: ${result.level}

${result.levelUp ? `\n🎉 **LEVEL UP!** You're now level ${result.level}!` : '📖 Keep uploading books to earn more XP!'}
`;
    }

    getProgress(userId) {
        const user = this.db.getUser(userId);
        if (!user) return null;

        const subjects = user.subjects || [];
        const progress = {};

        for (const subject of subjects) {
            progress[subject] = user.progress?.[subject] || {
                lessonsCompleted: 0,
                quizAvg: 0,
                xpEarned: 0
            };
        }

        // Calculate quiz averages
        const quizScores = user.quizScores || [];
        const avgQuizScore = quizScores.length > 0 
            ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
            : 0;

        // Find strongest and weakest
        const subjectsWithAvg = subjects.map(subject => ({
            subject,
            avg: progress[subject]?.quizAvg || 0,
            lessons: progress[subject]?.lessonsCompleted || 0
        }));

        const sorted = [...subjectsWithAvg].sort((a, b) => b.avg - a.avg);
        const strongest = sorted[0]?.subject || 'None';
        const weakest = sorted[sorted.length - 1]?.subject || 'None';

        return {
            name: user.name,
            level: user.level || 1,
            xp: user.xp || 0,
            streak: user.streak || 0,
            totalLessons: user.completedLessons?.length || 0,
            quizAverage: avgQuizScore,
            progress,
            strongest,
            weakest,
            subjects
        };
    }

    getStats(userId) {
        const user = this.db.getUser(userId);
        if (!user) return null;

        const totalXP = user.xp || 0;
        const level = user.level || 1;
        const xpToNextLevel = (level * 500) - totalXP;

        return {
            name: user.name,
            level,
            xp: totalXP,
            xpToNextLevel,
            streak: user.streak || 0,
            totalQuizzes: user.quizScores?.length || 0,
            avgQuizScore: user.quizScores?.length > 0 
                ? Math.round(user.quizScores.reduce((a, b) => a + b, 0) / user.quizScores.length)
                : 0
        };
    }

    getLeaderboard(userId, limit = 10) {
        const leaderboard = this.db.getLeaderboard(limit);
        const userRank = this.db.getLeaderboard(100)
            .findIndex(u => u.id === String(userId));

        return {
            leaderboard: leaderboard.map((user, index) => ({
                rank: index + 1,
                name: user.name,
                level: user.level || 1,
                xp: user.xp || 0,
                streak: user.streak || 0
            })),
            userRank: userRank >= 0 ? userRank + 1 : null
        };
    }
}

module.exports = Gamification;
