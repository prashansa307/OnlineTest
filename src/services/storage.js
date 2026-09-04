import { seedDb } from '../data/seedData.js';
import englishTest1Questions from '../data/english/test1.json';
import englishTest2Questions from '../data/english/test2.json';
import mathTest1Questions from '../data/math/test1.json';
import mathTest2Questions from '../data/math/test2.json';
import gkTest1Questions from '../data/gk/test1.json';
import gkTest2Questions from '../data/gk/test2.json';
import gkTest3Questions from '../data/gk/test3.json';
import allTest1Questions from '../data/all/test1.json';
import reasoningTest1Questions from '../data/reasoning/test1.json';
import reasoningTest2Questions from '../data/reasoning/test2.json';
import reasoningTest3Questions from '../data/reasoning/test3.json';

const DB_KEY = 'online-test-portal:db';
const ATTEMPTS_KEY = 'online-test-portal:attempts';
const RESULT_PREFIX = 'online-test-portal:result:';
const ATTEMPTS_CHANGED_EVENT = 'online-test-portal:attempts-changed';
const REMOTE_DEFAULT_TABLE = 'attempt_results';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return clone(fallback);
  }

  try {
    return JSON.parse(raw);
  } catch {
    return clone(fallback);
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function notifyAttemptsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ATTEMPTS_CHANGED_EVENT));
  }
}

function getRemoteConfig() {
  const baseUrl = import.meta.env.VITE_RESULTS_API_URL || import.meta.env.VITE_SUPABASE_URL || '';
  const apiKey = import.meta.env.VITE_RESULTS_API_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const table = import.meta.env.VITE_RESULTS_TABLE || REMOTE_DEFAULT_TABLE;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return {
    baseUrl: `${String(baseUrl).replace(/\/$/, '')}/rest/v1/${table}`,
    apiKey,
  };
}

export function isRemoteResultsEnabled() {
  return Boolean(getRemoteConfig());
}

function remoteHeaders(apiKey, extra = {}) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    ...extra,
  };
}

function toRemoteRow(attempt) {
  return {
    id: attempt.id,
    student_name: attempt.studentName || '',
    category_id: attempt.categoryId || '',
    category_name: attempt.categoryName || '',
    test_id: attempt.testId || '',
    test_name: attempt.testName || '',
    submitted_at: attempt.submittedAt || new Date().toISOString().slice(0, 10),
    payload: attempt,
  };
}

function fromRemoteRow(row) {
  if (!row) {
    return null;
  }

  if (row.payload && typeof row.payload === 'object') {
    return row.payload;
  }

  return {
    id: row.id,
    attemptId: row.id,
    studentName: row.student_name || 'Guest',
    categoryId: row.category_id || '',
    categoryName: row.category_name || '',
    testId: row.test_id || '',
    testName: row.test_name || '',
    submittedAt: row.submitted_at || '',
    startTime: row.start_time || '',
    endTime: row.end_time || '',
    durationTakenSeconds: Number(row.duration_taken_seconds || 0),
    durationTakenLabel: row.duration_taken_label || '',
    durationMinutes: Number(row.duration_minutes || 0),
    questions: Array.isArray(row.questions) ? row.questions : [],
    selectedAnswers: Array.isArray(row.selected_answers) ? row.selected_answers : [],
    summary: row.summary || null,
  };
}

function sortAttemptsDesc(attempts) {
  return [...attempts].sort((a, b) => {
    const left = new Date(b.submittedAt || b.endTime || 0).getTime();
    const right = new Date(a.submittedAt || a.endTime || 0).getTime();
    return left - right;
  });
}

function mergeAttempts(...sources) {
  const map = new Map();
  sources.flat().forEach((attempt) => {
    if (attempt?.id) {
      map.set(attempt.id, attempt);
    }
  });
  return sortAttemptsDesc(Array.from(map.values()));
}

function getTestSortKey(test) {
  const id = String(test?.id || '');
  const match = id.match(/^(.*-)?test(\d+)$/i);
  if (match) {
    return Number(match[2]);
  }

  return Number.MAX_SAFE_INTEGER;
}

function sortTestsById(a, b) {
  const left = getTestSortKey(a);
  const right = getTestSortKey(b);
  if (left !== right) {
    return left - right;
  }

  return String(a?.id || '').localeCompare(String(b?.id || ''));
}

function cacheAttempts(attempts) {
  saveJson(ATTEMPTS_KEY, attempts);
  attempts.forEach((attempt) => {
    saveJson(`${RESULT_PREFIX}${attempt.id}`, attempt);
  });
}

async function syncAttemptToRemote(attempt) {
  const config = getRemoteConfig();
  if (!config) {
    return false;
  }

  const response = await fetch(`${config.baseUrl}?on_conflict=id`, {
    method: 'POST',
    headers: remoteHeaders(config.apiKey, {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify([toRemoteRow(attempt)]),
  });

  return response.ok;
}

async function deleteAttemptFromRemote(attemptId) {
  const config = getRemoteConfig();
  if (!config) {
    return false;
  }

  const response = await fetch(`${config.baseUrl}?id=eq.${encodeURIComponent(attemptId)}`, {
    method: 'DELETE',
    headers: remoteHeaders(config.apiKey),
  });

  return response.ok;
}

export async function refreshAttemptsFromRemote() {
  const config = getRemoteConfig();
  if (!config) {
    return getAttempts();
  }

  try {
    const response = await fetch(`${config.baseUrl}?select=*&order=submitted_at.desc`, {
      headers: remoteHeaders(config.apiKey),
    });

    if (!response.ok) {
      return getAttempts();
    }

    const rows = await response.json();
    const remoteAttempts = Array.isArray(rows) ? rows.map(fromRemoteRow).filter(Boolean) : [];
    const merged = mergeAttempts(loadJson(ATTEMPTS_KEY, []), remoteAttempts);
    cacheAttempts(merged);
    notifyAttemptsChanged();
    return merged;
  } catch {
    return getAttempts();
  }
}

export async function getAttemptByIdRemote(attemptId) {
  const cached = getAttemptById(attemptId);
  if (cached) {
    return cached;
  }

  const config = getRemoteConfig();
  if (!config) {
    return null;
  }

  try {
    const response = await fetch(`${config.baseUrl}?select=*&id=eq.${encodeURIComponent(attemptId)}&limit=1`, {
      headers: remoteHeaders(config.apiKey),
    });

    if (!response.ok) {
      return null;
    }

    const rows = await response.json();
    const attempt = fromRemoteRow(rows?.[0]);
    if (attempt) {
      saveJson(`${RESULT_PREFIX}${attempt.id}`, attempt);
    }
    return attempt;
  } catch {
    return null;
  }
}

function normalizeQuestions(categoryId, testId, questions) {
  return questions.map((question, index) => ({
    id: `${categoryId}-${testId}-${question.id ?? index + 1}`,
    categoryId,
    testId: `${categoryId}-${testId}`,
    question: question.question,
    options: [...(question.options || [])].slice(0, 4),
    correctAnswer: Number(question.correctAnswer ?? 0),
    marks: Number(question.marks ?? 1),
    negativeMarks: Number(question.negativeMarks ?? 0.25),
    image: question.image || '',
    explanation: question.explanation || '',
    passage: question.passage || '',
  }));
}

function migrateReasoningTest1(db) {
  const seededTest = seedDb.tests.find((test) => test.id === 'reasoning-test1');
  if (!seededTest) {
    return db;
  }

  db.tests = db.tests.map((test) => (test.id === seededTest.id ? { ...seededTest } : test));
  const migratedQuestions = normalizeQuestions('reasoning', 'test1', reasoningTest1Questions);
  db.questions = [
    ...db.questions.filter((question) => question.testId !== 'reasoning-test1'),
    ...migratedQuestions,
  ];
  return db;
}

function ensureSeedTest(db, categoryId, testId, questions) {
  const seededTest = seedDb.tests.find((test) => test.id === `${categoryId}-${testId}`);
  if (!seededTest) {
    return db;
  }

  const testIndex = db.tests.findIndex((test) => test.id === seededTest.id);
  if (testIndex >= 0) {
    db.tests[testIndex] = { ...seededTest };
  } else {
    db.tests.push({ ...seededTest });
  }

  const normalizedQuestions = normalizeQuestions(categoryId, testId, questions);
  const questionIds = new Set(normalizedQuestions.map((question) => question.id));
  db.questions = [
    ...db.questions.filter((question) => question.testId !== `${categoryId}-${testId}` || !questionIds.has(question.id)),
    ...normalizedQuestions,
  ];

  return db;
}

function migrateReasoningTest2(db) {
  const seededTest = seedDb.tests.find((test) => test.id === 'reasoning-test2');
  if (!seededTest) {
    return db;
  }

  const tests = db.tests.filter((test) => test.id !== seededTest.id);
  tests.push({ ...seededTest });
  db.tests = tests;
  const migratedQuestions = normalizeQuestions('reasoning', 'test2', reasoningTest2Questions);
  db.questions = [
    ...db.questions.filter((question) => question.testId !== 'reasoning-test2'),
    ...migratedQuestions,
  ];
  return db;
}

function migrateMathTest2(db) {
  const seededTest = seedDb.tests.find((test) => test.id === 'math-test2');
  if (!seededTest) {
    return db;
  }

  const testIndex = db.tests.findIndex((test) => test.id === seededTest.id);
  if (testIndex >= 0) {
    db.tests[testIndex] = { ...seededTest };
  } else {
    db.tests.push({ ...seededTest });
  }

  const normalizedQuestions = normalizeQuestions('math', 'test2', mathTest2Questions);
  const questionIds = new Set(normalizedQuestions.map((question) => question.id));
  db.questions = [
    ...db.questions.filter((question) => question.testId !== 'math-test2' || !questionIds.has(question.id)),
    ...normalizedQuestions,
  ];

  return db;
}

function migrateGkTest1(db) {
  const seededTest = seedDb.tests.find((test) => test.id === 'gk-test1');
  if (!seededTest) {
    return db;
  }

  const testIndex = db.tests.findIndex((test) => test.id === seededTest.id);
  if (testIndex >= 0) {
    db.tests[testIndex] = { ...seededTest };
  } else {
    db.tests.push({ ...seededTest });
  }

  const normalizedQuestions = normalizeQuestions('gk', 'test1', gkTest1Questions);
  const questionIds = new Set(normalizedQuestions.map((question) => question.id));
  db.questions = [
    ...db.questions.filter((question) => question.testId !== 'gk-test1' || !questionIds.has(question.id)),
    ...normalizedQuestions,
  ];

  return db;
}

function migrateGkTest2(db) {
  const seededTest = seedDb.tests.find((test) => test.id === 'gk-test2');
  if (!seededTest) {
    return db;
  }

  const testIndex = db.tests.findIndex((test) => test.id === seededTest.id);
  if (testIndex >= 0) {
    db.tests[testIndex] = { ...seededTest };
  } else {
    db.tests.push({ ...seededTest });
  }

  const normalizedQuestions = normalizeQuestions('gk', 'test2', gkTest2Questions);
  const questionIds = new Set(normalizedQuestions.map((question) => question.id));
  db.questions = [
    ...db.questions.filter((question) => question.testId !== 'gk-test2' || !questionIds.has(question.id)),
    ...normalizedQuestions,
  ];

  return db;
}

function migrateGkTest3(db) {
  const seededTest = seedDb.tests.find((test) => test.id === 'gk-test3');
  if (!seededTest) {
    return db;
  }

  const testIndex = db.tests.findIndex((test) => test.id === seededTest.id);
  if (testIndex >= 0) {
    db.tests[testIndex] = { ...seededTest };
  } else {
    db.tests.push({ ...seededTest });
  }

  const normalizedQuestions = normalizeQuestions('gk', 'test3', gkTest3Questions);
  const questionIds = new Set(normalizedQuestions.map((question) => question.id));
  db.questions = [
    ...db.questions.filter((question) => question.testId !== 'gk-test3' || !questionIds.has(question.id)),
    ...normalizedQuestions,
  ];

  return db;
}

function migrateAllTest1(db) {
  const seededTest = seedDb.tests.find((test) => test.id === 'all-test1');
  if (!seededTest) {
    return db;
  }

  const testIndex = db.tests.findIndex((test) => test.id === seededTest.id);
  if (testIndex >= 0) {
    db.tests[testIndex] = { ...seededTest };
  } else {
    db.tests.push({ ...seededTest });
  }

  const normalizedQuestions = normalizeQuestions('all', 'test1', allTest1Questions);
  db.questions = [
    ...db.questions.filter((question) => question.testId !== 'all-test1'),
    ...normalizedQuestions,
  ];

  return db;
}

function migrateReasoningTest3(db) {
  const seededTest = seedDb.tests.find((test) => test.id === 'reasoning-test3');
  if (!seededTest) {
    return db;
  }

  const testIndex = db.tests.findIndex((test) => test.id === seededTest.id);
  if (testIndex >= 0) {
    db.tests[testIndex] = { ...seededTest };
  } else {
    db.tests.push({ ...seededTest });
  }

  const normalizedQuestions = normalizeQuestions('reasoning', 'test3', reasoningTest3Questions);
  const questionIds = new Set(normalizedQuestions.map((question) => question.id));
  db.questions = [
    ...db.questions.filter((question) => question.testId !== 'reasoning-test3' || !questionIds.has(question.id)),
    ...normalizedQuestions,
  ];

  return db;
}

export function ensureDb() {
  const existing = loadJson(DB_KEY, null);
  if (existing?.categories && existing?.tests && existing?.questions) {
    const migratedEnglish = ensureSeedTest(existing, 'english', 'test1', englishTest1Questions);
    const migratedEnglishTest2 = ensureSeedTest(migratedEnglish, 'english', 'test2', englishTest2Questions);
    const migratedMath = ensureSeedTest(migratedEnglishTest2, 'math', 'test1', mathTest1Questions);
    const migratedMathTest2 = migrateMathTest2(migratedMath);
    const migratedGkTest1 = migrateGkTest1(migratedMathTest2);
    const migratedGkTest2 = migrateGkTest2(migratedGkTest1);
    const migratedGkTest3 = migrateGkTest3(migratedGkTest2);
    const migratedAllTest1 = migrateAllTest1(migratedGkTest3);
    const migrated = migrateReasoningTest1(migratedAllTest1);
    const migratedReasoning2 = migrateReasoningTest2(migrated);
    const migratedReasoning3 = migrateReasoningTest3(migratedReasoning2);
    saveJson(DB_KEY, migratedReasoning3);
    return migratedReasoning3;
  }

  saveJson(DB_KEY, seedDb);
  if (!localStorage.getItem(ATTEMPTS_KEY)) {
    saveJson(ATTEMPTS_KEY, []);
  }
  return clone(seedDb);
}

export function getDb() {
  return ensureDb();
}

export function saveDb(nextDb) {
  saveJson(DB_KEY, nextDb);
}

export function resetDb() {
  saveJson(DB_KEY, seedDb);
  saveJson(ATTEMPTS_KEY, []);
  Object.keys(localStorage)
    .filter((key) => key.startsWith(RESULT_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}

export function getCategories() {
  return getDb().categories;
}

export function getActiveCategories() {
  return getCategories().filter((category) => category.active !== false);
}

export function getCategoryById(categoryId) {
  return getCategories().find((category) => category.id === categoryId);
}

export function getTests() {
  return getDb().tests;
}

export function getTestsByCategory(categoryId) {
  const tests = getTests().filter((test) => test.categoryId === categoryId);
  const testIds = new Set(tests.map((test) => test.id));
  seedDb.tests.forEach((test) => {
    if (test.categoryId === categoryId && !testIds.has(test.id)) {
      tests.push({ ...test });
    }
  });

  return tests
    .sort(sortTestsById);
}

export function getTestById(testId) {
  return getTests().find((test) => test.id === testId) || seedDb.tests.find((test) => test.id === testId);
}

export function getQuestions() {
  return getDb().questions;
}

export function getQuestionsByTest(testId) {
  const questions = getQuestions().filter((question) => question.testId === testId);
  if (questions.length > 0) {
    return questions;
  }

  return normalizeQuestions(
    testId.split('-')[0] || '',
    testId.split('-').slice(1).join('-'),
    seedDb.questions.filter((question) => question.testId === testId),
  );
}

export function getActiveTestForStudent(categoryId, testId) {
  const test = getTestById(testId);
  if (!test || test.categoryId !== categoryId || test.status === 'inactive') {
    return null;
  }
  const questions = getQuestionsByTest(test.id);
  return { ...test, questions };
}

export function upsertCategory(category) {
  const db = getDb();
  const index = db.categories.findIndex((item) => item.id === category.id);
  if (index >= 0) {
    db.categories[index] = category;
  } else {
    db.categories.push(category);
  }
  saveDb(db);
  return category;
}

export function deleteCategory(categoryId) {
  const db = getDb();
  db.categories = db.categories.filter((category) => category.id !== categoryId);
  const testIds = db.tests.filter((test) => test.categoryId === categoryId).map((test) => test.id);
  db.tests = db.tests.filter((test) => test.categoryId !== categoryId);
  db.questions = db.questions.filter((question) => !testIds.includes(question.testId));
  saveDb(db);
}

export function upsertTest(test) {
  const db = getDb();
  const index = db.tests.findIndex((item) => item.id === test.id);
  if (index >= 0) {
    db.tests[index] = test;
  } else {
    db.tests.push(test);
  }
  saveDb(db);
  return test;
}

export function deleteTest(testId) {
  const db = getDb();
  db.tests = db.tests.filter((test) => test.id !== testId);
  db.questions = db.questions.filter((question) => question.testId !== testId);
  saveDb(db);
}

export function upsertQuestion(question) {
  const db = getDb();
  const index = db.questions.findIndex((item) => item.id === question.id);
  if (index >= 0) {
    db.questions[index] = question;
  } else {
    db.questions.push(question);
  }
  saveDb(db);
  return question;
}

export function deleteQuestion(questionId) {
  const db = getDb();
  db.questions = db.questions.filter((question) => question.id !== questionId);
  saveDb(db);
}

export function bulkUpsertQuestions(questions) {
  const db = getDb();
  const map = new Map(db.questions.map((question) => [question.id, question]));
  questions.forEach((question) => map.set(question.id, question));
  db.questions = Array.from(map.values());
  saveDb(db);
}

export function saveAttempt(attempt) {
  const attempts = loadJson(ATTEMPTS_KEY, []);
  const index = attempts.findIndex((item) => item.id === attempt.id);
  if (index >= 0) {
    attempts[index] = attempt;
  } else {
    attempts.unshift(attempt);
  }
  saveJson(ATTEMPTS_KEY, attempts);
  saveJson(`${RESULT_PREFIX}${attempt.id}`, attempt);
  void syncAttemptToRemote(attempt);
  notifyAttemptsChanged();
  return attempt;
}

export function getAttempts() {
  return loadJson(ATTEMPTS_KEY, []);
}

export function deleteAttempt(attemptId) {
  const attempts = loadJson(ATTEMPTS_KEY, []).filter((attempt) => attempt.id !== attemptId);
  saveJson(ATTEMPTS_KEY, attempts);
  localStorage.removeItem(`${RESULT_PREFIX}${attemptId}`);
  void deleteAttemptFromRemote(attemptId);
  notifyAttemptsChanged();
}

export function getAttemptById(attemptId) {
  return loadJson(`${RESULT_PREFIX}${attemptId}`, null);
}

export function saveSettings(settings) {
  const db = getDb();
  db.settings = { ...db.settings, ...settings };
  saveDb(db);
  window.dispatchEvent(new Event('online-test-portal:settings-changed'));
}

export function getSettings() {
  return getDb().settings || {};
}
