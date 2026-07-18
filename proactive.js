class ProactiveCoach {
    constructor(database) {
        this.db = database;
    }

    // Add a reminder
    addReminder(userId, time, message) {
        const user = this.db.getUser(userId);
        if (!user) return false;
        if (!user.reminders) user.reminders = [];
        user.reminders.push({ time, message, active: true });
        this.db.updateUser(userId, { reminders: user.reminders });
        return true;
    }

    // Get reminders
    getReminders(userId) {
        const user = this.db.getUser(userId);
        return user?.reminders || [];
    }

    // Clear reminders
    clearReminders(userId) {
        this.db.updateUser(userId, { reminders: [] });
        return true;
    }

    // ===== CHECK REMINDERS (Called by cron) =====
    checkReminders() {
        try {
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                               now.getMinutes().toString().padStart(2, '0');
            
            const dueUsers = [];
            const users = this.db.getAllUsers();

            for (const [userId, user] of Object.entries(users)) {
                if (!user.reminders) continue;
                for (const reminder of user.reminders) {
                    if (reminder.time === currentTime && reminder.active !== false) {
                        dueUsers.push({
                            userId,
                            name: user.name || 'Student',
                            message: reminder.message
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

    // Format reminder message
    formatReminderMessage(userId, reminder) {
        const user = this.db.getUser(userId);
        const name = user?.name || 'Student';
        return `🔔 **Reminder for ${name}**\n\n${reminder.message}\n\n💡 Time to study!`;
    }

    // Inactivity alert
    getInactivityMessage(user) {
        const name = user?.name || 'Student';
        const days = user?.inactiveDays || 2;
        return `⚠️ Hey ${name}!\n\nYou haven't studied in ${days} days.\n\nLet's get back on track! 🚀`;
    }

    // Exam countdown
    getExamCountdown(user) {
        if (!user?.examDate) return null;
        try {
            const days = Math.ceil((new Date(user.examDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (days <= 0) return `📅 Exam Day! Good luck! 🍀`;
            if (days <= 30) {
                return `⏰ **${days} days until exam!**\n\n📚 Review your weakest subject today!`;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}

module.exports = ProactiveCoach;
