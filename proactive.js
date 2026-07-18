class ProactiveCoach {
    constructor(database) {
        this.db = database;
    }

    // Add a reminder for a user
    addReminder(userId, time, message) {
        const user = this.db.getUser(userId);
        if (!user) return false;

        if (!user.reminders) user.reminders = [];
        user.reminders.push({ time, message, active: true, createdAt: new Date().toISOString() });
        this.db.updateUser(userId, { reminders: user.reminders });
        return true;
    }

    // Get all active reminders for a user
    getReminders(userId) {
        const user = this.db.getUser(userId);
        if (!user) return [];
        return (user.reminders || []).filter(r => r.active !== false);
    }

    // Clear all reminders for a user
    clearReminders(userId) {
        const user = this.db.getUser(userId);
        if (!user) return false;
        this.db.updateUser(userId, { reminders: [] });
        return true;
    }

    // Remove a specific reminder
    removeReminder(userId, index) {
        const user = this.db.getUser(userId);
        if (!user || !user.reminders) return false;
        if (index >= 0 && index < user.reminders.length) {
            user.reminders.splice(index, 1);
            this.db.updateUser(userId, { reminders: user.reminders });
            return true;
        }
        return false;
    }

    // ===== CHECK REMINDERS (CRON JOB) =====
    checkReminders() {
        try {
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                               now.getMinutes().toString().padStart(2, '0');
            
            const dueUsers = [];
            const users = this.db.getAllUsers();

            for (const [userId, user] of Object.entries(users)) {
                if (!user.reminders || user.reminders.length === 0) continue;
                
                const activeReminders = user.reminders.filter(r => r.active !== false);
                for (const reminder of activeReminders) {
                    if (reminder.time === currentTime) {
                        dueUsers.push({
                            userId,
                            name: user.name || 'Student',
                            message: reminder.message,
                            reminder: reminder
                        });
                    }
                }
            }
            return dueUsers;
        } catch (error) {
            console.error('checkReminders error:', error);
            return [];
        }
    }

    // Generate reminder message text
    formatReminderMessage(userId, reminder) {
        const user = this.db.getUser(userId);
        const name = user?.name || 'Student';
        return `
🔔 **Reminder for ${name}**

${reminder.message}

💡 *Time to study! You've got this!*
`;
    }

    // Get inactivity alert
    getInactivityMessage(user) {
        const name = user?.name || 'Student';
        const days = user?.inactiveDays || 2;
        return `
⚠️ **Hey ${name}!**

You haven't studied in ${days} days.

Let's get back on track! 🚀

💡 *Even 15 minutes of study makes a difference!*
`;
    }

    // Get exam countdown
    getExamCountdown(user) {
        const examDate = user?.examDate;
        if (!examDate) return null;

        try {
            const now = new Date();
            const exam = new Date(examDate);
            const daysLeft = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));

            if (daysLeft <= 0) {
                return `📅 **Exam Day!** Good luck, ${user.name}! 🍀`;
            }

            if (daysLeft <= 30) {
                return `
⏰ **Exam Countdown: ${daysLeft} days left!**

📚 Here's today's plan:
1. Review your weakest subject
2. Practice exam questions
3. Stay confident!

💪 *You've got this, ${user.name}!*
`;
            }
            return null;
        } catch (error) {
            console.error('Exam countdown error:', error);
            return null;
        }
    }
}

module.exports = ProactiveCoach;
