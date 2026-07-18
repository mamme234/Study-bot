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

        // Extract topics from all books
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
                error: '⚠️ Could not extract topics from your books. Try uploading a different book.',
                needsBooks: true
            };
        }

        const schedule = this.createSchedule(user, allTopics, studyHoursPerDay, books);
        return schedule;
    }

    extractTopicsFromChunks(chunks, book) {
        const topics = [];
        let chapterCount = 0;

        const chapterPatterns = [
            /(?:Chapter|CHAPTER|Ch\.|ch\.)\s+(\d+)[\s:.-]+(.+)/,
            /(?:Unit|UNIT|U\.)\s+(\d+)[\s:.-]+(.+)/,
            /(?:Module|MODULE)\s+(\d+)[\s:.-]+(.+)/,
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

        // If no topics found, create from chunks
