import { User, CompletedExam, CustomTest, Question, InstructionalArea, ClusterStudentSummary, CalendarNote } from '../types';
import { getCachedOrGeneratedPool, saveQuestionPool } from '../data/questionPool';

const CLUSTER_LEADER_PIN = '3781';

const STORAGE_KEYS = {
  USERS: 'deca_users_v1',
  CURRENT_USER: 'deca_current_user_v1',
  COMPLETED_EXAMS: 'deca_completed_exams_v1',
  CUSTOM_TESTS: 'deca_custom_tests_v1',
  CALENDAR_NOTES: 'deca_calendar_notes_v1',
};

// Clean storage initialization without mock or test users
function initializeStorage() {
  try {
    // Purge any legacy demo/mock records from past development
    const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (rawUsers) {
      const parsed: User[] = JSON.parse(rawUsers);
      const cleaned = parsed.filter(
        u => u.username !== 'jordan_lee' && u.username !== 'maya_patel' && u.id !== 'usr_student_1' && u.id !== 'usr_student_2'
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleaned));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }

    const rawExams = localStorage.getItem(STORAGE_KEYS.COMPLETED_EXAMS);
    if (rawExams) {
      const parsedExams: CompletedExam[] = JSON.parse(rawExams);
      const cleanedExams = parsedExams.filter(
        e => e.id !== 'exam_seed_1' && e.studentId !== 'usr_student_1' && e.studentName !== 'Jordan Lee'
      );
      if (cleanedExams.length !== parsedExams.length) {
        localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify(cleanedExams));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify([]));
    }

    const rawCurrent = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (rawCurrent) {
      const cur: User = JSON.parse(rawCurrent);
      if (cur.username === 'jordan_lee' || cur.id === 'usr_student_1' || cur.name === 'Jordan Lee') {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    }
  } catch {
    // ignore
  }
}

// Helper to calculate score breakdown by DECA Instructional Area
export function calculateAreaBreakdown(
  questions: Question[],
  answers: Record<number, number>
) {
  const map = new Map<InstructionalArea, { correct: number; total: number }>();

  questions.forEach(q => {
    const area = q.instructionalArea;
    if (!map.has(area)) {
      map.set(area, { correct: 0, total: 0 });
    }
    const current = map.get(area)!;
    current.total += 1;
    if (answers[q.id] === q.correctAnswer) {
      current.correct += 1;
    }
  });

  return Array.from(map.entries()).map(([area, stat]) => ({
    area,
    correct: stat.correct,
    total: stat.total,
    percentage: Math.round((stat.correct / stat.total) * 100),
  })).sort((a, b) => b.total - a.total);
}

// User methods
export function getAllUsers(): User[] {
  initializeStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getCurrentUser(): User | null {
  initializeStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function registerUser(params: {
  username: string;
  name: string;
  password?: string;
  role: 'student' | 'cluster_leader';
  pin?: string;
  email?: string;
}): { success: boolean; error?: string; user?: User } {
  initializeStorage();
  const trimmedUser = params.username.trim().toLowerCase();
  const trimmedName = params.name.trim();

  if (!trimmedUser || !trimmedName) {
    return { success: false, error: 'Please provide both username and full name.' };
  }

  if (params.role === 'cluster_leader') {
    if (params.pin !== CLUSTER_LEADER_PIN) {
      return { success: false, error: `Invalid Cluster Leader PIN. Access code required.` };
    }
  }

  const existingUsers = getAllUsers();
  if (existingUsers.some(u => u.username.toLowerCase() === trimmedUser)) {
    return { success: false, error: 'That username is already taken. Please choose another.' };
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: trimmedUser,
    name: trimmedName,
    role: params.role,
    email: params.email?.trim() || `${trimmedUser}@deca.club`,
    createdAt: Date.now(),
  };

  existingUsers.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(existingUsers));
  setCurrentUser(newUser);

  return { success: true, user: newUser };
}

export function deleteStudent(studentId: string): boolean {
  try {
    const users = getAllUsers();
    const updatedUsers = users.filter(u => u.id !== studentId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

    // Remove any completed exams associated with this student
    const exams = getCompletedExams();
    const updatedExams = exams.filter(e => e.studentId !== studentId);
    localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify(updatedExams));

    return true;
  } catch {
    return false;
  }
}

export function loginUser(username: string, role: 'student' | 'cluster_leader', pin?: string): {
  success: boolean;
  error?: string;
  user?: User;
} {
  initializeStorage();
  const trimmedUser = username.trim().toLowerCase();
  const users = getAllUsers();
  const found = users.find(u => u.username.toLowerCase() === trimmedUser);

  if (!found) {
    return { success: false, error: `Account "${username}" not found. Please create an account first.` };
  }

  if (found.role !== role) {
    return {
      success: false,
      error: `Account "${username}" is registered as a ${found.role === 'cluster_leader' ? 'Cluster Leader' : 'Student'}, not a ${role === 'cluster_leader' ? 'Cluster Leader' : 'Student'}.`,
    };
  }

  if (role === 'cluster_leader' && pin !== CLUSTER_LEADER_PIN) {
    return { success: false, error: `Incorrect Cluster Leader PIN. Expected cluster security code.` };
  }

  setCurrentUser(found);
  return { success: true, user: found };
}

// Exam history methods
export function getCompletedExams(): CompletedExam[] {
  initializeStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COMPLETED_EXAMS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCompletedExam(exam: CompletedExam): void {
  const exams = getCompletedExams();
  exams.unshift(exam);
  localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify(exams));
}

export function toggleShareExam(examId: string, shared: boolean, notes?: string): boolean {
  const exams = getCompletedExams();
  const idx = exams.findIndex(e => e.id === examId);
  if (idx !== -1) {
    exams[idx].sharedWithLeader = shared;
    if (shared) {
      exams[idx].sharedAt = Date.now();
    }
    if (notes !== undefined) {
      exams[idx].studentNotes = notes;
    }
    localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify(exams));
    return true;
  }
  return false;
}

export function shareAllExamsForStudent(studentId: string): void {
  const exams = getCompletedExams();
  exams.forEach(e => {
    if (e.studentId === studentId) {
      e.sharedWithLeader = true;
      e.sharedAt = e.sharedAt || Date.now();
    }
  });
  localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify(exams));
}

// Custom Tests methods for Cluster Leaders
export function getCustomTests(): CustomTest[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TESTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCustomTest(test: CustomTest): void {
  const tests = getCustomTests();
  tests.unshift(test);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_TESTS, JSON.stringify(tests));
}

// Cluster Leader aggregated analytics
export function getClusterLeaderStudentSummaries(): ClusterStudentSummary[] {
  const users = getAllUsers().filter(u => u.role === 'student');
  const allExams = getCompletedExams();

  return users.map(student => {
    const studentExams = allExams.filter(e => e.studentId === student.id && e.sharedWithLeader);
    const totalExams = studentExams.length;
    const scores = studentExams.map(e => e.score);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const lastExamDate = studentExams.length > 0 ? studentExams[0].completedAt : undefined;

    // Calculate area strengths & weaknesses
    const areaStats: Record<string, { correct: number; total: number }> = {};
    studentExams.forEach(e => {
      e.areaBreakdown.forEach(ab => {
        if (!areaStats[ab.area]) areaStats[ab.area] = { correct: 0, total: 0 };
        areaStats[ab.area].correct += ab.correct;
        areaStats[ab.area].total += ab.total;
      });
    });

    const evaluatedAreas = Object.entries(areaStats)
      .filter(([_, stat]) => stat.total >= 5)
      .map(([area, stat]) => ({ area, rate: stat.correct / stat.total }))
      .sort((a, b) => b.rate - a.rate);

    return {
      student,
      totalExams,
      highestScore,
      averageScore,
      lastExamDate,
      sharedExams: studentExams,
      strongestArea: evaluatedAreas.length > 0 ? evaluatedAreas[0].area : undefined,
      weakestArea: evaluatedAreas.length > 0 ? evaluatedAreas[evaluatedAreas.length - 1].area : undefined,
    };
  });
}

// Cluster Leader Question Upload & Bank Management
export function appendQuestionsToBank(newQuestions: Omit<Question, 'id'>[]): { added: number; total: number } {
  const pool = getCachedOrGeneratedPool();
  let nextId = Math.max(...pool.map(q => q.id), 1000) + 1;

  const formattedQuestions: Question[] = newQuestions.map(q => ({
    ...q,
    id: nextId++,
  }));

  const updatedPool = [...pool, ...formattedQuestions];
  saveQuestionPool(updatedPool);
  return { added: formattedQuestions.length, total: updatedPool.length };
}

// Cluster Calendar Notes (2026 - February 2027) - Clean initial state with no test slideshows
const DEFAULT_CALENDAR_NOTES: CalendarNote[] = [];

export function getCalendarNotes(): CalendarNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CALENDAR_NOTES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CALENDAR_NOTES, JSON.stringify([]));
      return [];
    }
    const parsed: CalendarNote[] = JSON.parse(raw);
    // Purge any lingering demo/test slideshows or initial dummy notes from previous runs
    const cleaned = parsed.filter(n => !n.id.startsWith('note_init_') && !n.linkUrl?.includes('demo-deca-'));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.CALENDAR_NOTES, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveCalendarNote(note: CalendarNote): void {
  const notes = getCalendarNotes();
  const existingIdx = notes.findIndex(n => n.id === note.id);
  if (existingIdx >= 0) {
    notes[existingIdx] = { ...note, updatedAt: Date.now() };
  } else {
    notes.unshift(note);
  }
  localStorage.setItem(STORAGE_KEYS.CALENDAR_NOTES, JSON.stringify(notes));
}

export function deleteCalendarNote(id: string): void {
  const notes = getCalendarNotes();
  const filtered = notes.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEYS.CALENDAR_NOTES, JSON.stringify(filtered));
}
