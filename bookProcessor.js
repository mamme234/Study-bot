const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

class BookProcessor {
    constructor() {
        this.booksDir = config.BOOKS_DIR;
        this.processedDir = path.join(this.booksDir, 'processed');
        this.chunksDir = path.join(this.booksDir, 'chunks');
        
        fs.ensureDirSync(this.booksDir);
        fs.ensureDirSync(this.processedDir);
        fs.ensureDirSync(this.chunksDir);
    }

    async processUploadedBook(fileBuffer, filename, userId, subject, grade, language = 'English') {
        const ext = path.extname(filename).toLowerCase();
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const savedFilename = `${userId}_${fileHash}${ext}`;
        const filePath = path.join(this.booksDir, savedFilename);
        
        // Save file
        await fs.writeFile(filePath, fileBuffer);

        // Extract text based on file type
        let text = '';
        try {
            if (ext === '.pdf') {
                text = await this.extractPDF(filePath);
            } else if (ext === '.docx') {
                text = await this.extractDOCX(filePath);
            } else if (ext === '.txt') {
                text = await this.extractTXT(filePath);
            } else if (ext === '.epub') {
                text = await this.extractEPUB(filePath);
            } else if (ext === '.md') {
                text = await this.extractMD(filePath);
            } else {
                return { error: `Unsupported file format: ${ext}` };
            }
        } catch (error) {
            return { error: `Error extracting text: ${error.message}` };
        }

        if (!text || text.length < 100) {
            return { error: 'Could not extract sufficient text from the book' };
        }

        // Chunk text
        const chunks = this.chunkText(text);

        // Save chunks
        const chunksPath = path.join(this.chunksDir, `${userId}_${fileHash}_chunks.json`);
        await fs.writeJson(chunksPath, chunks, { spaces: 2 });

        // Create metadata
        const metadata = {
            userId,
            fileHash,
            originalFilename: filename,
            subject,
            grade,
            language,
            uploadedAt: new Date().toISOString(),
            filePath,
            chunksPath,
            totalChunks: chunks.length,
            totalChars: text.length,
            processed: true
        };

        // Save metadata
        await this.saveBookMetadata(userId, metadata);

        return {
            success: true,
            message: `✅ Book '${filename}' processed successfully!`,
            totalChunks: chunks.length,
            totalChars: text.length,
            fileHash,
            metadata
        };
    }

    async extractPDF(filePath) {
        try {
            const pdfParse = require('pdf-parse');
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } catch (error) {
            console.error('PDF extraction error:', error);
            return '';
        }
    }

    async extractDOCX(filePath) {
        try {
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } catch (error) {
            console.error('DOCX extraction error:', error);
            return '';
        }
    }

    async extractTXT(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            console.error('TXT extraction error:', error);
            return '';
        }
    }

    async extractEPUB(filePath) {
        try {
            const epub = require('epub-parser');
            const data = await fs.readFile(filePath);
            const book = epub.parse(data);
            let text = '';
            
            if (book.sections) {
                book.sections.forEach(section => {
                    if (section.content) {
                        text += section.content.replace(/<[^>]+>/g, ' ') + '\n\n';
                    }
                });
            }
            return text;
        } catch (error) {
            console.error('EPUB extraction error:', error);
            return '';
        }
    }

    async extractMD(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf-8');
            // Remove markdown formatting
            content = content.replace(/#{1,6}\s+/g, '');
            content = content.replace(/\*\*([^*]+)\*\*/g, '$1');
            content = content.replace(/\*([^*]+)\*/g, '$1');
            content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
            return content;
        } catch (error) {
            console.error('MD extraction error:', error);
            return '';
        }
    }

    chunkText(text, chunkSize = 2000, overlap = 200) {
        const chunks = [];
        const paragraphs = text.split('\n\n');
        let currentChunk = '';

        for (const para of paragraphs) {
            const trimmed = para.trim();
            if (!trimmed) continue;

            if (currentChunk.length + trimmed.length > chunkSize) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = trimmed;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        // If no chunks or very few, split by sentences
        if (chunks.length < 3) {
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
            chunks.length = 0;
            let current = '';

            for (const sentence of sentences) {
                if (current.length + sentence.length > chunkSize) {
                    if (current) chunks.push(current.trim());
                    current = sentence;
                } else {
                    current += (current ? ' ' : '') + sentence;
                }
            }

            if (current) chunks.push(current.trim());
        }

        return chunks;
    }

    async saveBookMetadata(userId, metadata) {
        const bookDataPath = path.join(this.processedDir, `${userId}_books.json`);
        let books = [];

        if (await fs.pathExists(bookDataPath)) {
            books = await fs.readJson(bookDataPath);
        }

        books.push(metadata);
        await fs.writeJson(bookDataPath, books, { spaces: 2 });
    }

    async getUserBooks(userId) {
        const bookDataPath = path.join(this.processedDir, `${userId}_books.json`);
        
        if (await fs.pathExists(bookDataPath)) {
            return await fs.readJson(bookDataPath);
        }
        return [];
    }

    async getBookChunks(userId, fileHash) {
        const chunksPath = path.join(this.chunksDir, `${userId}_${fileHash}_chunks.json`);
        
        if (await fs.pathExists(chunksPath)) {
            return await fs.readJson(chunksPath);
        }
        return [];
    }

    async getBookByHash(userId, fileHash) {
        const books = await this.getUserBooks(userId);
        return books.find(book => book.fileHash === fileHash) || null;
    }
}

module.exports = new BookProcessor();
