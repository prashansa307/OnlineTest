import englishTest1 from './english/test1.json';
import englishTest2 from './english/test2.json';
import englishTest3 from './english/test3.json';
import englishTest4 from './english/test4.json';
import englishTest5 from './english/test5.json';
import mathTest1 from './math/test1.json';
import mathTest2 from './math/test2.json';
import mathTest3 from './math/test3.json';
import reasoningTest1 from './reasoning/test1.json';
import reasoningTest2 from './reasoning/test2.json';
import reasoningTest3 from './reasoning/test3.json';
import gkTest1 from './gk/test1.json';
import gkTest2 from './gk/test2.json';
import gkTest3 from './gk/test3.json';
import allTest1 from './all/test1.json';
import allTest2 from './all/test2.json';
import allTest3 from './all/test3.json';

function createTest(categoryId, id, title, description, durationMinutes, questions) {
  return {
    id: `${categoryId}-${id}`,
    categoryId,
    name: title,
    description,
    totalMarks: questions.length,
    negativeMarking: 0.25,
    durationMinutes,
    passingMarks: Math.ceil(questions.length / 2),
    shuffleQuestions: false,
    shuffleOptions: false,
    showResultImmediately: true,
    status: 'active',
  };
}

function normalizeQuestions(categoryId, testId, questions) {
  return questions.map((question, index) => ({
    id: `${categoryId}-${testId}-${question.id ?? index + 1}`,
    categoryId,
    testId: `${categoryId}-${testId}`,
    question: question.question,
    options: [...question.options],
    correctAnswer: question.correctAnswer,
    marks: 1,
    negativeMarks: 0.25,
    image: question.image || '',
    explanation: question.explanation || '',
    passage: question.passage || '',
  }));
}

export const seedCategories = [
  {
    id: 'english',
    name: 'English Test',
    description: 'Grammar, vocabulary, and comprehension practice.',
    icon: 'Aa',
    active: true,
  },
  {
    id: 'math',
    name: 'Math Test',
    description: 'Arithmetic, percentages, and number skills.',
    icon: '123',
    active: true,
  },
  {
    id: 'reasoning',
    name: 'Reasoning Test',
    description: 'Series, patterns, and logical thinking.',
    icon: 'IQ',
    active: true,
  },
  {
    id: 'gk',
    name: 'GK Test',
    description: 'General awareness, India, and world facts.',
    icon: 'GK',
    active: true,
  },
  {
    id: 'all',
    name: 'All In One Test',
    description: 'A mixed set covering English, Math, Reasoning, and GK.',
    icon: 'A',
    active: true,
  },
];

export const seedDb = {
  categories: seedCategories,
  tests: [
    createTest('english', 'test1', 'Test 1', 'English fundamentals', 15, englishTest1),
    createTest('english', 'test2', 'Test 2', 'English practice set 2', 15, englishTest2),
    createTest('english', 'test3', 'Test 3', 'English practice set 3', 10, englishTest3),
    createTest('english', 'test4', 'Test 4', 'English practice set 4', 10, englishTest4),
    createTest('english', 'test5', 'Test 5', 'English practice set 5', 10, englishTest5),
    createTest('math', 'test1', 'Test 1', 'Math practice set 1', 15, mathTest1),
    createTest('math', 'test2', 'Test 2', 'Math practice set 2', 20, mathTest2),
    createTest('math', 'test3', 'Test 3', 'Math practice set 3', 8, mathTest3),
    createTest('reasoning', 'test1', 'Test 1', 'Reasoning practice set 1', 40, reasoningTest1),
    createTest('reasoning', 'test2', 'Test 2', 'Reasoning practice set 2', 30, reasoningTest2),
    createTest('reasoning', 'test3', 'Test 3', 'Reasoning practice set 3', 20, reasoningTest3),
    createTest('gk', 'test1', 'Test 1', 'GK practice set 1', 12, gkTest1),
    createTest('gk', 'test2', 'Test 2', 'GK practice set 2', 25, gkTest2),
    createTest('gk', 'test3', 'Test 3', 'GK practice set 3', 20, gkTest3),
    createTest('all', 'test1', 'Test 1', 'All-in-one practice set 1', 50, allTest1),
    createTest('all', 'test2', 'Test 2', 'All-in-one practice set 2', 50, allTest2),
    createTest('all', 'test3', 'Test 3', 'All-in-one practice set 3', 12, allTest3),
  ],
  questions: [
    ...normalizeQuestions('english', 'test1', englishTest1),
    ...normalizeQuestions('english', 'test2', englishTest2),
    ...normalizeQuestions('english', 'test3', englishTest3),
    ...normalizeQuestions('english', 'test4', englishTest4),
    ...normalizeQuestions('english', 'test5', englishTest5),
    ...normalizeQuestions('math', 'test1', mathTest1),
    ...normalizeQuestions('math', 'test2', mathTest2),
    ...normalizeQuestions('math', 'test3', mathTest3),
    ...normalizeQuestions('reasoning', 'test1', reasoningTest1),
    ...normalizeQuestions('reasoning', 'test2', reasoningTest2),
    ...normalizeQuestions('reasoning', 'test3', reasoningTest3),
    ...normalizeQuestions('gk', 'test1', gkTest1),
    ...normalizeQuestions('gk', 'test2', gkTest2),
    ...normalizeQuestions('gk', 'test3', gkTest3),
    ...normalizeQuestions('all', 'test1', allTest1),
    ...normalizeQuestions('all', 'test2', allTest2),
    ...normalizeQuestions('all', 'test3', allTest3),
  ],
  attempts: [],
  settings: {
    siteName: 'Online Test Portal',
  },
};
