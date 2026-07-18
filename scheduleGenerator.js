const config = require('./config');

class ScheduleGenerator {
    constructor(database, bookProcessor) {
        this.db = database;
        this.bookProcessor = bookProcessor;
    }

    async generateScheduleFromBooks(userId, bookHash = null, studyHoursPerDay = 2) {
        const user = this.db.getUser(userId);
        if (!user) {
            return { error: 'User not found' };
        }

        let books = [];
        if (bookHash) {
            const book = await this.bookProcessor.getBookByHash(userId, bookHash);
            if (book) books = [book];
        } else {
            books = await this.bookProcessor.getUserBooks(userId);
        }

        if (!books || books.length === 0) {
            return {
                error: '📚 No books found. Please upload your textbook first!',
                needsBooks: true
            };
        }

        let allTopics = [];
        for (const book of books) {
            const chunks = await this.bookProcessor.getBookChunks(userId, book.fileHash);
            if (chunks && chunks.length > 0) {
                const topics = this.extractTopicsFromChunks(chunks, book);
                allTopics = allTopics.concat(topics);
            }
        }

        if (!allTopics || allTopics.length === 0) {
            return {
                error: '⚠️ Could not extract topics from your books.',
                needsBooks: true
            };
        }

        const schedule = this.createScheduleWithTasks(user, allTopics, studyHoursPerDay, books);
        return schedule;
    }

    extractTopicsFromChunks(chunks, book) {
        const topics = [];
        let chapterCount = 0;
        const chapterPatterns = [
            /(?:Chapter|CHAPTER|Ch\.|ch\.)\s+(\d+)[\s:.-]+(.+)/,
            /(?:Unit|UNIT|U\.)\s+(\d+)[\s:.-]+(.+)/,
            /^([A-Z][A-Z\s]{2,20})$/,
            /^(\d+\.\s+[A-Z][a-z\s]+)/
        ];

        let currentChapter = null;

        for (const chunk of chunks) {
            const lines = chunk.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.length < 5) continue;

                let matched = false;
                for (const pattern of chapterPatterns) {
                    const match = trimmed.match(pattern);
                    if (match) {
                        let chapterTitle;
                        if (match.length >= 3) {
                            chapterTitle = match[2].trim();
                        } else if (match.length >= 2) {
                            chapterTitle = match[1].trim();
                        } else {
                            chapterTitle = match[0];
                        }

                        currentChapter = {
                            number: chapterCount + 1,
                            title: chapterTitle.substring(0, 100),
                            content: chunk.substring(0, 500) + (chunk.length > 500 ? '...' : ''),
                            difficulty: this.estimateDifficulty(chunk),
                            estimatedTime: Math.max(15, Math.floor(chunk.split(' ').length / 200))
                        };
                        topics.push(currentChapter);
                        chapterCount++;
                        matched = true;
                        break;
                    }
                }

                if (!matched && currentChapter && trimmed.length > 30) {
                    topics.push({
                        number: chapterCount + 1,
                        title: trimmed.substring(0, 80) + (trimmed.length > 80 ? '...' : ''),
                        content: chunk.substring(0, 300) + (chunk.length > 300 ? '...' : ''),
                        difficulty: this.estimateDifficulty(chunk),
                        estimatedTime: Math.max(10, Math.floor(chunk.split(' ').length / 300))
                    });
                }
            }
        }

        if (topics.length === 0) {
            for (let i = 0; i < Math.min(15, chunks.length); i++) {
                const chunk = chunks[i];
                topics.push({
                    number: i + 1,
                    title: `Section ${i + 1}`,
                    content: chunk.substring(0, 400) + (chunk.length > 400 ? '...' : ''),
                    difficulty: 'Medium',
                    estimatedTime: Math.max(15, Math.floor(chunk.split(' ').length / 300))
                });
            }
        }

        return topics;
    }

    estimateDifficulty(text) {
        const words = text.split(' ');
        if (!words || words.length === 0) return 'Medium';
        const avgWordLen = words.reduce((sum, w) => sum + w.length, 0) / words.length;
        const sentences = text.match(/[.!?]+/g) || [];
        const avgSentenceLen = words.length / Math.max(sentences.length, 1);

        let score = 0;
        if (avgWordLen > 7) score++;
        if (avgSentenceLen > 20) score++;
        if (words.length > 1000) score++;

        if (score <= 1) return 'Easy';
        if (score === 2) return 'Medium';
        return 'Hard';
    }

    createScheduleWithTasks(user, topics, studyHoursPerDay, books) {
        const difficultyOrder = { Hard: 0, Medium: 1, Easy: 2 };
        topics.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);

        const weeks = [];
        const topicsPerWeek = Math.max(1, Math.ceil(topics.length / 6));
        const dailyTasks = [];

        for (let week = 0; week < Math.min(8, Math.ceil(topics.length / topicsPerWeek)); week++) {
            const weekTopics = topics.slice(week * topicsPerWeek, (week + 1) * topicsPerWeek);
            if (!weekTopics || weekTopics.length === 0) break;

            const days = [];
            for (let day = 0; day < 7; day++) {
                if (day < weekTopics.length) {
                    const topic = weekTopics[day];
                    const tasks = [
                        `📖 Read: ${topic.title}`,
                        '📝 Take notes on key concepts',
                        '❓ Answer practice questions',
                        '🔄 Review and summarize'
                    ];
                    
                    dailyTasks.push({
                        day: `Week ${week + 1}, Day ${day + 1}`,
                        topic: topic.title,
                        tasks: tasks
                    });

                    days.push({
                        day: `Week ${week + 1}, Day ${day + 1}`,
                        topic: topic.title,
                        difficulty: topic.difficulty || 'Medium',
                        time: `${topic.estimatedTime || 30} minutes`,
                        tasks: tasks
                    });
                } else {
                    days.push({
                        day: `Week ${week + 1}, Day ${day + 1}`,
                        topic: '📝 Review Day',
                        difficulty: 'Easy',
                        time: '30 minutes',
                        tasks: [
                            '🔄 Review all topics from this week',
                            '❓ Take a practice quiz',
                            '📝 Create summary notes'
                        ]
                    });
                }
            }

            weeks.push({
                week: week + 1,
                focus: weekTopics[0]?.title?.substring(0, 50) + (weekTopics[0]?.title?.length > 50 ? '...' : '') || 'Review',
                days
            });
        }

        if (dailyTasks.length > 0) {
            const userTasks = user.dailyTasks || [];
            const today = new Date().toDateString();
            const existingToday = userTasks.filter(t => 
                new Date(t.date).toDateString() === today
            );
            
            if (existingToday.length === 0) {
                const firstTasks = dailyTasks.slice(0, 5);
                for (const task of firstTasks) {
                    this.db.addDailyTask(user.id, 
                        `${task.day}: ${task.topic} - ${task.tasks[0]}`
                    );
                }
            }
        }

        return {
            userName: user.name || 'Student',
            grade: user.grade,
            subject: books[0]?.subject || 'General',
            totalTopics: topics.length,
            studyHoursPerDay,
            weeks,
            dailyTasks: dailyTasks.slice(0, 7),
            booksUsed: books.map(b => b.originalFilename || 'Unknown'),
            generatedFromBooks: true,
            generatedAt: new Date().toISOString()
        };
    }

    formatScheduleText(schedule) {
        if (schedule.error) return schedule.error;

        let text = `
📅 **Personalized Study Schedule**
👤 ${schedule.userName}
📚 Grade: ${schedule.grade}
📖 Subject: ${schedule.subject}
⏰ Study Time: ${schedule.studyHoursPerDay} hours/day
📚 Total Topics: ${schedule.totalTopics}

📖 **Books Used:**
`;

        schedule.booksUsed.forEach(book => {
            text += `• ${book}\n`;
        });

        text += '\n' + '='.repeat(50) + '\n\n';

        text += '✅ **What You Must Do Each Day**\n\n';

        if (schedule.dailyTasks && schedule.dailyTasks.length > 0) {
            schedule.dailyTasks.forEach((task, index) => {
                text += `📌 **${task.day}**\n`;
                text += `📖 Topic: ${task.topic}\n`;
                text += `📝 Tasks:\n`;
                task.tasks.forEach(t => {
                    text += `   • ${t}\n`;
                });
                text += '\n';
            });
        }

        text += '='.repeat(50) + '\n\n';

        for (const week of schedule.weeks) {
            text += `
📌 **Week ${week.week}**
🎯 Focus: ${week.focus}
${'─'.repeat(40)}
`;

            for (const day of week.days) {
                text += `
${day.day}
📖 Topic: ${day.topic}
📊 Difficulty: ${day.difficulty}
⏱️ Time: ${day.time}
📝 Tasks:
`;
                for (const task of day.tasks) {
                    text += `   • ${task}\n`;
                }
                text += '\n';
            }
        }

        text += `
💡 **Daily Study Tips:**
• 🌅 Morning: Study your hardest subject first
• 📚 Midday: Take notes and review
• 🌤️ Afternoon: Practice problems
• 🌙 Evening: Review and plan next day
• ⏰ Study in 45-minute sessions with 10-minute breaks
• 📝 Complete all daily tasks for bonus XP!
• 🔄 Review previous topics weekly

📅 *This schedule is generated from your uploaded book.*
`;

        return text;
    }
}

module.exports = ScheduleGenerator;
