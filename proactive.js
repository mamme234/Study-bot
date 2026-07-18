const config = require('./config');

class ProactiveCoach {
    constructor(database) {
        this.db = database;
    }

    checkInactiveUsers() {
        const users = this.db.users;
        const inactiveUsers = [];
        const now = new Date();

        for (const [userId, user] of Object.entries(users)) {
            const lastActive = user.lastActive ? new Date(user.lastActive) : null;
            if (lastActive) {
                const daysOff = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
                if (daysOff >= 2) {
                    inactiveUsers.push({
                        userId,
                        name: user.name || 'Student',
                        daysOff
                    });
                }
            }
        }

        return inactiveUsers;
    }

    getExamCountdown(grade) {
        const examDate = config.EXAM_DATES[`grade_${grade}`];
        if (examDate) {
            const examDateObj = new Date(examDate);
            const now = new Date();
            const daysLeft = Math.ceil((examDateObj - now) / (1000 * 60 * 60 * 24));
            return daysLeft;
        }
        return null;
    }

    getMorningMessage(user) {
        const name = user.name || 'Student';
        const streak = user.streak || 0;
        const hour = new Date().getHours();

        let greeting = '';
        if (hour < 12) greeting = '🌅 Good morning!';
        else if (hour < 17) greeting = '☀️ Good afternoon!';
        else greeting = '🌙 Good evening!';

        let message = `${greeting} ${name}!`;

        if (streak > 0) {
            message += `\n🔥 ${streak} days streak! You're amazing!`;
        }

        // Check exam countdown
        const grade = user.grade;
        if (grade && [8, 10, 12].includes(grade)) {
            const daysLeft = this.getExamCountdown(grade);
            if (daysLeft !== null && daysLeft <= 60) {
                message += `\n\n⏰ **Exam Countdown:** ${daysLeft} days left!`;
                message += `\n📚 Today's revision plan: Review your weakest subject.`;
            }
        }

        message += `\n\n💪 Ready for today's lesson?`;

        return message;
    }

    getInactivityMessage(user, daysOff) {
        const name = user.name || 'Student';

        const messages = [
            `⚠️ Hey ${name}, you haven't studied in ${daysOff} days. Let's get back on track!`,
            `🔔 ${name}! It's been ${daysOff} days. Ready to continue your journey?`,
            `📚 ${name}, missing you! Come back and let's study together.`,
            `💪 ${name}, every day counts! Let's make today a study day!`
        ];

        return messages[Math.floor(Math.random() * messages.length)];
    }

    getExamCountdownMessage(user) {
        const grade = user.grade;
        const daysLeft = this.getExamCountdown(grade);

        if (daysLeft !== null && daysLeft <= 60) {
            let message = `
⏰ **Exam Countdown: ${daysLeft} days left!**

Here's today's revision plan:
1. 📖 Review your weakest subject
2. 📝 Practice exam questions
3. 🔄 Check past mistakes
4. 💪 Stay confident!

💡 *Remember: Consistent practice is key to success!*
`;
            return message;
        }
        return null;
    }

    getCelebrationMessage(user, score) {
        const name = user.name || 'Student';

        const messages = [
            `🎉 Amazing, ${name}! ${score}% is incredible!`,
            `🌟 ${name}, you're on fire! ${score}% is top tier!`,
            `🏆 Wow ${name}, ${score}%! Keep this energy for exam day!`,
            `💪 ${name}, ${score}% shows your hard work is paying off!`
        ];

        return messages[Math.floor(Math.random() * messages.length)];
    }

    getReminderMessage(user) {
        const name = user.name || 'Student';

        const messages = [
            `⏰ It's study time, ${name}! Your daily goal awaits.`,
            `📚 ${name}, remember: small steps lead to big results. Time to study!`,
            `🎯 ${name}, let's crush today's study goal!`,
            `💪 ${name}, consistency is key. Let's study!`,
            `🌟 ${name}, your future self will thank you. Study time!`
        ];

        return messages[Math.floor(Math.random() * messages.length)];
    }

    getWeekendMotivation(user) {
        const name = user.name || 'Student';

        return `
🌟 **Weekend Study Motivation, ${name}!**

Weekends are a great time to:
• 📖 Review what you learned this week
• 📝 Practice with quizzes
• 🔄 Fill in knowledge gaps
• 🎯 Plan for next week

💡 *Even 30 minutes of study on weekends makes a difference!*

Stay consistent, ${name}! 🚀
`;
    }

    getNewWeekGreeting(user) {
        const name = user.name || 'Student';

        return `
📅 **New Week, New Opportunities, ${name}!**

This week's focus:
1. 🎯 Set specific study goals
2. 📚 Review your weakest subjects
3. 📝 Practice daily
4. 💪 Stay consistent

🌟 *Make this week your best study week yet!*
`;
    }

    getStudyTip(user) {
        const tips = [
            '💡 Study Tip: Study in 45-minute sessions with 10-minute breaks.',
            '💡 Study Tip: Teach someone else to reinforce your learning.',
            '💡 Study Tip: Use active recall instead of passive reading.',
            '💡 Study Tip: Create mind maps to connect concepts.',
            '💡 Study Tip: Review your notes before going to sleep.',
            '💡 Study Tip: Practice past exam questions regularly.',
            '💡 Study Tip: Stay hydrated and take short walks.',
            '💡 Study Tip: Use the Pomodoro Technique for focus.'
        ];

        return tips[Math.floor(Math.random() * tips.length)];
    }

    getProgressReport(user) {
        const name = user.name || 'Student';
        const xp = user.xp || 0;
        const level = user.level || 1;
        const streak = user.streak || 0;
        const quizScores = user.quizScores || [];
        const avgScore = quizScores.length > 0 
            ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
            : 0;

        let message = `
📊 **Weekly Progress Report - ${name}**

📈 Stats:
• Level: ${level}
• XP: ${xp}
• Streak: ${streak} days
• Avg Quiz Score: ${avgScore}%
• Total Quizzes: ${quizScores.length}

`;

        if (streak >= 7) {
            message += '🔥 **7+ Day Streak!** You\'re on fire! Keep going!\n';
        }

        if (avgScore >= 80) {
            message += '🌟 **Excellent Quiz Performance!** You\'re mastering the material!\n';
        } else if (avgScore >= 60) {
            message += '💪 **Good Progress!** Keep practicing to improve further.\n';
        } else {
            message += '📚 **Keep Going!** Review your notes and try more quizzes.\n';
        }

        message += '\n💡 *Upload more books and practice daily for best results!*';

        return message;
    }
}

module.exports = ProactiveCoach;
