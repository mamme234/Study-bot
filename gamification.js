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

        const updates = {
            xp: newXP,
            level: newLevel,
            streak: streak,
            lastActive: now.toISOString()
        };

        this.db.updateUser(userId, updates);

        const levelUp = newLevel > currentLevel;

        return {
            xp: newXP,
            level: newLevel,
            streak: streak,
            levelUp: levelUp,
            xpGained: xpAmount
        };
    }

    completeDailyGoal(userId) {
        const result = this.addXP(userId, config.XP.DAILY_GOAL, 'daily_goal');
        if (!result) return '❌ User not found';

        let message = `
🎯 **Daily Goal Completed!**

✨ +${config.XP.DAILY_GOAL} XP
🔥 Streak: ${result.streak} days
🏆 Level: ${result.level}
`;

        if (result.levelUp) {
            message += `\n🎉 **LEVEL UP!** You're now level ${result.level}!`;
        }

        return message;
    }
}

module.exports = new Gamification(database);
