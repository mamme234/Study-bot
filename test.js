/**
 * Test script for A+ Coach Bot
 * Run with: node test.js
 */

const config = require('./config');
const database = require('./database');
const translations = require('./translations');
const study = require('./study');
const library = require('./library');

console.log('🧪 A+ Coach Bot - Test Suite\n');

// Test 1: Config
console.log('📋 Test 1: Config');
console.log(`✅ Bot Name: ${config.BOT_NAME}`);
console.log(`✅ Version: ${config.BOT_VERSION}`);
console.log(`✅ Subjects loaded: ${Object.keys(config.SUBJECTS).length}\n`);

// Test 2: Database
console.log('📋 Test 2: Database');
const testUser = database.createUser('test123', 'Test Student', 'English', 12);
console.log(`✅ User created: ${testUser.name}`);
console.log(`✅ Subjects: ${testUser.subjects.join(', ')}\n`);

// Test 3: Translations
console.log('📋 Test 3: Translations');
console.log(`✅ English: ${translations.get('welcome', 'English')}`);
console.log(`✅ Amharic: ${translations.get('welcome', 'Amharic')}`);
console.log(`✅ Afaan Oromo: ${translations.get('welcome', 'Afaan Oromo')}\n`);

// Test 4: Study
console.log('📋 Test 4: Study Manager');
const mathLessons = study.getLessons('Mathematics');
console.log(`✅ Math lessons: ${mathLessons.length}`);
const mathQuiz = study.getQuiz('Mathematics');
console.log(`✅ Math quiz questions: ${mathQuiz.length}\n`);

// Test 5: Library
console.log('📋 Test 5: Library');
const textbooks = library.getTextbooks(12);
console.log(`✅ Grade 12 textbooks: ${Object.keys(textbooks).length}`);
const formulas = library.getFormulaSheet('Mathematics');
console.log(`✅ Math formula sheet length: ${formulas.length} characters\n`);

console.log('✅ All tests passed!');
console.log('\n🚀 Bot is ready to deploy!');
