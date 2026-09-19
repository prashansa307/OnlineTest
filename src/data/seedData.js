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
import allTest4 from './all/test4.json';
import allTest5 from './all/test5.json';
import allTest6 from './all/test6.json';
import allTest7 from './all/test7.json';
import allTest8 from './all/test8.json';
import allTest9 from './all/test9.json';
import allTest10 from './all/test10.json';
import allTest11 from './all/test11.json';
import allTest12 from './all/test12.json';
import allTest13 from './all/test13.json';
import allTest14 from './all/test14.json';
import allTest15 from './all/test15.json';

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
    createTest('all', 'test3', 'Test 3', 'All-in-one practice set 3', 45, allTest3),
    createTest('all', 'test4', 'Test 4', 'All-in-one practice set 4', 50, allTest4),
    createTest('all', 'test5', 'Test 5', 'All-in-one practice set 5', 50, allTest5),
    createTest('all', 'test6', 'Test 6', 'All-in-one practice set 6', 50, allTest6),
    createTest('all', 'test7', 'Test 7', 'All-in-one practice set 7', 50, allTest7),
    createTest('all', 'test8', 'Test 8', 'All-in-one practice set 8', 50, allTest8),
    createTest('all', 'test9', 'Test 9', 'All-in-one practice set 9', 50, allTest9),
    createTest('all', 'test10', 'Test 10', 'All-in-one practice set 10', 50, allTest10),
    createTest('all', 'test11', 'Test 11', 'All-in-one practice set 11', 50, allTest11),
    createTest('all', 'test12', 'Test 12', 'All-in-one practice set 12', 50, allTest12),
    createTest('all', 'test13', 'Test 13', 'All-in-one practice set 13', 50, allTest13),
    createTest('all', 'test14', 'Test 14', 'All-in-one practice set 14', 50, allTest14),
    createTest('all', 'test15', 'Test 15', 'All-in-one practice set 15', 50, allTest15),
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
    ...normalizeQuestions('all', 'test4', allTest4),
    ...normalizeQuestions('all', 'test5', allTest5),
    ...normalizeQuestions('all', 'test6', allTest6),
    ...normalizeQuestions('all', 'test7', allTest7),
    ...normalizeQuestions('all', 'test8', allTest8),
    ...normalizeQuestions('all', 'test9', allTest9),
    ...normalizeQuestions('all', 'test10', allTest10),
    ...normalizeQuestions('all', 'test11', allTest11),
    ...normalizeQuestions('all', 'test12', allTest12),
    ...normalizeQuestions('all', 'test13', allTest13),
    ...normalizeQuestions('all', 'test14', allTest14),
    ...normalizeQuestions('all', 'test15', allTest15),
  ],
  attempts: [],
  settings: {
    siteName: 'Online Test Portal',
  },
};
