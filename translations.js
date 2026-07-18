class Translations {
    constructor() {
        this.translations = {
            'English': {
                'welcome': 'Welcome to A+ Coach!',
                'study': 'Study',
                'exams': 'Exams',
                'settings': 'Settings',
                'progress': 'Progress',
                'leaderboard': 'Leaderboard',
                'daily_goal': 'Daily Goal',
                'library': 'Library',
                'ai_teacher': 'AI Teacher',
                'upload_book': 'Upload Book',
                'schedule': 'Schedule',
                'home': 'Home',
                'back': 'Back',
                'continue': 'Continue',
                'cancel': 'Cancel',
                'yes': 'Yes',
                'no': 'No',
                'good_morning': 'Good morning! Ready for today\'s lesson?',
                'good_afternoon': 'Good afternoon! Let\'s continue learning.',
                'good_evening': 'Good evening! Time to review what you learned today.',
                'exam_countdown': '⚠️ Your exam is in {days} days! Stay focused!',
                'streak_celebration': '🔥 {days} days streak! You\'re amazing!',
                'inactivity_alert': '⚠️ You haven\'t studied in {days} days. Let\'s get back on track!',
                'quiz_result': '📝 Quiz Results\nScore: {score}/{total} ({percentage}%)',
                'excellent': '🎉 Excellent work!',
                'keep_practicing': '💪 Keep practicing! You\'ll get there!',
                'level_up': '🎊 LEVEL UP! You\'re now level {level}!'
            },
            'Amharic': {
                'welcome': 'እንኳን ወደ A+ አሰልጣኝ በደህና መጡ!',
                'study': 'ጥናት',
                'exams': 'ፈተናዎች',
                'settings': 'ቅንብሮች',
                'progress': 'እድገት',
                'leaderboard': 'መሪ ሰንጠረዥ',
                'daily_goal': 'የዕለት ግብ',
                'library': 'ቤተ መጻሕፍት',
                'ai_teacher': 'AI አስተማሪ',
                'upload_book': 'መጽሐፍ ስቀል',
                'schedule': 'የጥናት መርሐግብር',
                'home': 'መነሻ',
                'back': 'ተመለስ',
                'continue': 'ቀጥል',
                'cancel': 'ሰርዝ',
                'yes': 'አዎ',
                'no': 'አይ',
                'good_morning': 'እንደምን አደርክ! ለዛሬ ትምህርት ዝግጁ ነህ?',
                'good_afternoon': 'እንደምን ዋልክ! መማርን እንቀጥል።',
                'good_evening': 'እንደምን አመሸህ! ዛሬ የተማርከውን እንገምግም።',
                'exam_countdown': '⚠️ ፈተናህ በ {days} ቀናት ውስጥ ነው! ትኩረትህን ጠብቅ!',
                'streak_celebration': '🔥 {days} ቀናት ተከታታይ ጥናት! እጅግ አስደናቂ ነህ!',
                'inactivity_alert': '⚠️ ለ {days} ቀናት አላጠናህም። እንደገና እንጀምር!',
                'quiz_result': '📝 የፈተና ውጤት\nውጤት: {score}/{total} ({percentage}%)',
                'excellent': '🎉 በጣም ጥሩ ስራ!',
                'keep_practicing': '💪 መለማመድህን ቀጥል! በእርግጠኝነት ትሳካለህ!',
                'level_up': '🎊 ደረጃ ጨመርክ! አሁን በደረጃ {level} ላይ ነህ!'
            },
            'Afaan Oromo': {
                'welcome': 'A+ Coach' + 'tti baga nagaan dhufte!',
                'study': 'Barumsaa',
                'exams': 'Qormaata',
                'settings': 'Qindaa\'ina',
                'progress': 'Finjina',
                'leaderboard': 'Gabaasa',
                'daily_goal': 'Kaayyoo Guyyaa',
                'library': 'Mana Kitaabaa',
                'ai_teacher': 'AI Barsiisaa',
                'upload_book': 'Kitaaba Fe\'i',
                'schedule': 'Sagantaa Barumsaa',
                'home': 'Mana',
                'back': 'Duuba',
                'continue': 'Itti fufi',
                'cancel': 'Haqi',
                'yes': 'Eeyyee',
                'no': 'Lakki',
                'good_morning': 'Bareedan bulte! Barumsaa har\'aatiif qophaa?',
                'good_afternoon': 'Baga guyyaa gaarii! Barumsaa itti fufna.',
                'good_evening': 'Baga galgala! Har\'a waan baratte irra deddeebi\'i.',
                'exam_countdown': '⚠️ Qormaatni kee {days} guyyaan booda! Xiyyeeffannaa qabadhu!',
                'streak_celebration': '🔥 {days} guyyaa walitti fufeen! Baay\'ee dinqisiifattuu!',
                'inactivity_alert': '⚠️ {days} guyyaa hin baranne. Deebinee haa eegallu!',
                'quiz_result': '📝 Bu\'aa Qormaataa\nBu\'aa: {score}/{total} ({percentage}%)',
                'excellent': '🎉 Hojii dinqii!',
                'keep_practicing': '💪 Barreessuu itti fufi! Dhugumatti ni milkoofta!',
                'level_up': '🎊 Sadarkaa ol ka\'e! Amma sadarkaa {level} irra jirta!'
            }
        };
    }

    get(key, language = 'English') {
        return this.translations[language]?.[key] || this.translations['English'][key] || key;
    }

    getWithParams(key, language, params) {
        let text = this.get(key, language);
        if (text && params) {
            Object.keys(params).forEach(param => {
                text = text.replace(`{${param}}`, params[param]);
            });
        }
        return text;
    }

    getMenu(language = 'English') {
        return {
            home: this.get('home', language),
            study: this.get('study', language),
            exams: this.get('exams', language),
            settings: this.get('settings', language),
            progress: this.get('progress', language),
            leaderboard: this.get('leaderboard', language),
            daily_goal: this.get('daily_goal', language),
            library: this.get('library', language),
            ai_teacher: this.get('ai_teacher', language),
            upload_book: this.get('upload_book', language),
            schedule: this.get('schedule', language)
        };
    }

    getWelcomeMessage(name, language = 'English') {
        const welcome = this.get('welcome', language);
        return `${welcome}\n\n👋 ${name}, ${this.get('good_morning', language)}`;
    }

    getExamCountdown(days, language = 'English') {
        return this.getWithParams('exam_countdown', language, { days });
    }

    getStreakCelebration(days, language = 'English') {
        return this.getWithParams('streak_celebration', language, { days });
    }

    getInactivityAlert(days, language = 'English') {
        return this.getWithParams('inactivity_alert', language, { days });
    }

    getQuizResult(score, total, percentage, language = 'English') {
        const result = this.getWithParams('quiz_result', language, { score, total, percentage });
        const feedback = percentage >= 80 ? this.get('excellent', language) : this.get('keep_practicing', language);
        return `${result}\n\n${feedback}`;
    }

    getLevelUp(level, language = 'English') {
        return this.getWithParams('level_up', language, { level });
    }

    // Time-based greetings
    getTimeGreeting(language = 'English') {
        const hour = new Date().getHours();
        if (hour < 12) return this.get('good_morning', language);
        if (hour < 17) return this.get('good_afternoon', language);
        return this.get('good_evening', language);
    }
}

module.exports = new Translations();
