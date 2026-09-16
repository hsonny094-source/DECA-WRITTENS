import { User, CompletedExam, CustomTest, Question, InstructionalArea, ClusterStudentSummary, CalendarNote, RankedSharedExam, ExamLiveRankInfo, DecaResource } from '../types';
import { getCachedOrGeneratedPool, saveQuestionPool } from '../data/questionPool';

const CLUSTER_LEADER_PIN = '3781';

const STORAGE_KEYS = {
  USERS: 'deca_users_v1',
  CURRENT_USER: 'deca_current_user_v1',
  COMPLETED_EXAMS: 'deca_completed_exams_v1',
  CUSTOM_TESTS: 'deca_custom_tests_v1',
  CALENDAR_NOTES: 'deca_calendar_notes_v1',
  RESOURCES: 'deca_resources_v1',
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

export function deleteCompletedExam(examId: string): boolean {
  try {
    const exams = getCompletedExams();
    const updated = exams.filter(e => e.id !== examId);
    localStorage.setItem(STORAGE_KEYS.COMPLETED_EXAMS, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
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

// Cluster Leader aggregated analytics - Ranked highest score to lowest
export function getClusterLeaderStudentSummaries(): ClusterStudentSummary[] {
  const users = getAllUsers().filter(u => u.role === 'student');
  const allExams = getCompletedExams();

  const summaries: ClusterStudentSummary[] = users.map(student => {
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

  // Partition students who took/shared exams from those with no exams yet
  // Rank strictly by highest score descending, then average score descending
  const withExams = summaries
    .filter(s => s.totalExams > 0)
    .sort((a, b) => {
      if (b.highestScore !== a.highestScore) return b.highestScore - a.highestScore;
      if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
      return (b.lastExamDate || 0) - (a.lastExamDate || 0);
    });

  const withoutExams = summaries
    .filter(s => s.totalExams === 0)
    .sort((a, b) => a.student.name.localeCompare(b.student.name));

  // Assign 1-indexed sequential rank to each student
  withExams.forEach((s, idx) => {
    s.rank = idx + 1;
    s.rankOrdinal = getOrdinal(idx + 1);
  });

  return [...withExams, ...withoutExams];
}

export function getOrdinal(n: number): string {
  if (n <= 0) return `${n}`;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Returns all shared exams ranked from highest score to lowest score.
 * Numbered so each entry has a distinct rank (#1, #2, #3, ... #8, etc.)
 */
export function getRankedSharedExams(examTitleFilter?: string): RankedSharedExam[] {
  const all = getCompletedExams().filter(e => e.sharedWithLeader);

  const filtered = (examTitleFilter && examTitleFilter !== 'all')
    ? all.filter(e => e.examTitle === examTitleFilter)
    : all;

  const sorted = [...filtered].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.timeSpentSeconds !== b.timeSpentSeconds) {
      return a.timeSpentSeconds - b.timeSpentSeconds;
    }
    return a.completedAt - b.completedAt;
  });

  return sorted.map((exam, idx) => {
    const rank = idx + 1;
    const rankOrdinal = getOrdinal(rank);
    return {
      rank,
      rankOrdinal,
      rankLabel: `${rankOrdinal} Highest`,
      exam,
    };
  });
}

/**
 * Live dynamic rank calculator for an exam.
 * Re-reads storage so if other students score higher, the rank automatically shifts lower.
 */
export function getExamLiveRank(exam: CompletedExam): ExamLiveRankInfo {
  const allExams = getCompletedExams();

  // Find all shared exams for the same exam title (or same question count / format)
  let pool = allExams.filter(
    e => e.sharedWithLeader && (e.examTitle === exam.examTitle || e.totalQuestions === exam.totalQuestions)
  );

  // If this exam is shared and not yet in pool, add it
  const exists = pool.some(e => e.id === exam.id);
  if (!exists) {
    pool = [...pool, { ...exam, sharedWithLeader: true }];
  } else {
    // Replace in pool to make sure current score/time is latest
    pool = pool.map(e => (e.id === exam.id ? { ...exam, sharedWithLeader: true } : e));
  }

  // Sort highest score first, then faster time, then earlier date
  const sorted = [...pool].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.timeSpentSeconds !== b.timeSpentSeconds) {
      return a.timeSpentSeconds - b.timeSpentSeconds;
    }
    return a.completedAt - b.completedAt;
  });

  const index = sorted.findIndex(e => e.id === exam.id);
  const rank = index >= 0 ? index + 1 : sorted.length;
  const rankOrdinal = getOrdinal(rank);
  const higherScoresCount = rank - 1;
  const topScore = sorted.length > 0 ? sorted[0].score : exam.score;
  const sameScoreCount = sorted.filter(e => e.score === exam.score).length;

  const allRankedExams: RankedSharedExam[] = sorted.map((e, idx) => ({
    rank: idx + 1,
    rankOrdinal: getOrdinal(idx + 1),
    rankLabel: `${getOrdinal(idx + 1)} Highest`,
    exam: e,
  }));

  return {
    rank,
    totalCount: sorted.length,
    rankOrdinal,
    rankLabel: `${rankOrdinal} Highest`,
    higherScoresCount,
    isTopRank: rank === 1,
    isTop3: rank <= 3,
    topScore,
    sameScoreCount,
    allRankedExams,
  };
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

// DECA Chapter Study Resources
const DEFAULT_RESOURCES: DecaResource[] = [
  {
    id: 'res_blueprint_1',
    title: 'Official DECA Entrepreneurship Exam Blueprint & Weightings',
    description: 'Instructional area weightings, question counts, and core competencies tested on the 100-question written exam.',
    category: 'exam_blueprint',
    tags: ['Blueprint', 'Exam Format', 'Weightings', 'DECA Official'],
    authorName: 'Cluster Advisors',
    authorId: 'advisor_system',
    createdAt: Date.now() - 86400000 * 5,
    isPinned: true,
    notes: `### DECA Entrepreneurship Cluster Exam Blueprint

Total Questions: **100 Multiple Choice**
Testing Window: **70 Minutes** (~42 seconds per question)

#### Instructional Area Question Distribution:
1. **Financial Analysis (FI)**: ~14 Questions
   - Accounting fundamentals, financial statements, break-even analysis, cash flow management.
2. **Business Law (BL)**: ~11 Questions
   - Contracts, UCC regulations, agency laws, business structures (LLC vs C-Corp vs S-Corp).
3. **Marketing & Research (MK)**: ~12 Questions
   - Market segmentation, 4 Ps of marketing, SWOT analysis, customer journey.
4. **Economics (EC)**: ~10 Questions
   - Supply & demand curves, inflation, interest rates, economic systems, GDP.
5. **Operations & Logistics (OP)**: ~10 Questions
   - Quality control, supply chain, inventory management, workplace safety regulations.
6. **Entrepreneurship Concepts (EN)**: ~10 Questions
   - Ideation, risk mitigation, feasibility analysis, lean startup methodology.
7. **Strategic Management (SM)**: ~8 Questions
   - Goal setting, mission & vision, competitive positioning, corporate governance.
8. **Information Management (NF)**: ~7 Questions
   - Data analytics, MIS, cybersecurity protocols, intellectual property protection.
9. **Human Resources (HR)**: ~6 Questions
   - Staffing, EEOC compliance, performance appraisal, organizational culture.
10. **Emotional Intelligence (EI)**: ~5 Questions
    - Leadership ethics, active listening, negotiation, conflict resolution.
11. **Risk Management (RM)**: ~4 Questions
    - Insurance policies, liability hedging, business continuity planning.
12. **Professional Development (PD)**: ~3 Questions
    - Career progression, professional ethics, trade associations, lifelong learning.`,
  },
  {
    id: 'res_formulas_2',
    title: 'Essential Business & Financial Math Formulas Cheat Sheet',
    description: 'Every formula you must memorize for break-even, profitability, return on investment, liquidity, and markup questions.',
    category: 'formula_sheet',
    tags: ['Math', 'Formulas', 'Finance', 'Calculations', 'Accounting'],
    authorName: 'Omar Ahmed (Cluster Leader)',
    authorId: 'leader_system',
    createdAt: Date.now() - 86400000 * 4,
    isPinned: true,
    notes: `### Essential DECA Business Math & Financial Formulas

#### 1. Profitability & Margins
- **Gross Profit**: Gross Profit = Net Sales - Cost of Goods Sold (COGS)
- **Gross Profit Margin (%)**: (Gross Profit / Net Sales) * 100
- **Net Profit**: Net Profit = Gross Profit - Operating Expenses - Taxes
- **Net Profit Margin (%)**: (Net Profit / Total Revenue) * 100

#### 2. Return on Investment (ROI)
- ROI = [(Net Gain from Investment - Cost of Investment) / Cost of Investment] * 100

#### 3. Break-Even Analysis
- **Contribution Margin per Unit**: Unit Selling Price - Variable Cost per Unit
- **Contribution Margin Ratio**: Contribution Margin per Unit / Unit Selling Price
- **Break-Even Point (Units)**: Fixed Costs / (Unit Selling Price - Variable Cost per Unit)
- **Break-Even Point (Sales Dollars)**: Fixed Costs / Contribution Margin Ratio

#### 4. Liquidity & Solvency Ratios
- **Current Ratio**: Current Assets / Current Liabilities (Target: > 1.5 - 2.0)
- **Quick Ratio (Acid-Test)**: (Cash + Marketable Securities + Accounts Receivable) / Current Liabilities
- **Debt-to-Equity Ratio**: Total Liabilities / Total Stockholders' Equity

#### 5. Retail & Pricing Math
- **Markup on Cost (%)**: [(Selling Price - Cost) / Cost] * 100
- **Markup on Retail (%)**: [(Selling Price - Cost) / Selling Price] * 100
- **Markdown Amount**: Original Price * Markdown %
- **Inventory Turnover**: Cost of Goods Sold / Average Inventory at Cost`,
  },
  {
    id: 'res_vocab_3',
    title: 'Top 40 Most-Tested DECA Business Law & Contracts Vocabulary',
    description: 'Key legal terms frequently tested in District, State, and ICDC cluster exams.',
    category: 'vocab_quizlet',
    tags: ['Law', 'Contracts', 'Vocab', 'UCC', 'Legal'],
    authorName: 'Ronnie Agarwal (Cluster Leader)',
    authorId: 'leader_system',
    createdAt: Date.now() - 86400000 * 3,
    isPinned: false,
    notes: `### Top 40 DECA Business Law & Contracts Vocabulary

1. **Uniform Commercial Code (UCC)**: Uniform state laws governing commercial transactions, primarily sales of tangible goods.
2. **Consideration**: Something of legal value exchanged by both parties (money, service, promise) necessary for a binding contract.
3. **Statute of Frauds**: Requirement that specific contracts (e.g., real estate, goods > $500, contracts lasting > 1 year) must be in writing to be enforceable.
4. **Bilateral vs. Unilateral Contract**: Bilateral is a promise for a promise; unilateral is a promise in exchange for an act (e.g., reward poster).
5. **Tort Law**: Civil wrong causing harm or loss to another party resulting in legal liability (distinguished from criminal law).
6. **Strict Liability**: Legal responsibility for damages or injury even without fault or negligence (common in product liability or hazardous activities).
7. **Fiduciary Duty**: High legal duty of loyalty and care owed by corporate directors, partners, or trustees to the organization/beneficiaries.
8. **Intellectual Property Types**:
   - **Patent**: Exclusive rights to inventions/processes (generally 20 years).
   - **Trademark**: Word, name, or symbol identifying goods/services (renewable indefinitely).
   - **Copyright**: Protection for original works of authorship (life + 70 years).
   - **Trade Secret**: Confidential formula, practice, or process providing a competitive edge.
9. **Sole Proprietorship**: Single owner, unlimited personal liability for business debts.
10. **General Partnership vs. Limited Partnership (LP)**: General partners share unlimited liability and management; limited partners risk only their invested capital.
11. **Limited Liability Company (LLC)**: Shields owners from personal liability while allowing pass-through taxation.
12. **C-Corporation vs. S-Corporation**: C-Corp faces double taxation; S-Corp has pass-through taxation but limited to 100 shareholders (US citizens/residents).`,
  },
  {
    id: 'res_strategy_4',
    title: '70-Minute Exam Pacing & Distractor Elimination Masterclass',
    description: 'How to pace 100 questions in 70 minutes using the 3-Pass Method to gain 8-12 extra points.',
    category: 'tips_strategy',
    tags: ['Strategy', 'Exam Tips', 'Pacing', 'Distractor Elimination'],
    authorName: 'Omar Dowidar (Cluster Leader)',
    authorId: 'leader_system',
    createdAt: Date.now() - 86400000 * 2,
    isPinned: false,
    notes: `### The 70-Minute DECA Exam Execution Masterclass

Winning scores at States and ICDC are won not just by knowing the content, but by master-level test strategy.

#### 1. The 3-Pass Method
- **Pass 1 (0 – 35 Minutes): Speed & Confidence (Target: 60 questions)**
  - Answer questions you know immediately (under 25 seconds).
  - Mark tricky questions for later review. Do NOT get stuck on question 14 when question 89 is an easy point!
- **Pass 2 (35 – 55 Minutes): Calculations & Scenario Analysis (Target: 30 questions)**
  - Take your time on math calculations (break-even, margins, ratios).
  - Read scenarios carefully to identify the exact Performance Indicator tested.
- **Pass 3 (55 – 70 Minutes): Hard Eliminator & Final Review (Target: 10 questions)**
  - Spend remaining minutes eliminating distractors on questions you flagged.
  - Never leave a question blank—DECA has NO penalty for guessing!

#### 2. Spotting DECA Distractors
- **The Absolute Word Trap**: Words like *Always, Never, Solely, Exclusively, Every* are almost always incorrect in business multiple choice.
- **The Partially True Trick**: Half of the option is factually true, but the second half is inaccurate or answers a different prompt.
- **Opposite Pairs**: Often, two choices are exact opposites (e.g., *increase price vs. decrease price*). One of them is almost always the correct answer!`,
  },
];

export function getResources(): DecaResource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESOURCES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(DEFAULT_RESOURCES));
      return DEFAULT_RESOURCES;
    }
    const parsed: DecaResource[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(DEFAULT_RESOURCES));
      return DEFAULT_RESOURCES;
    }
    return parsed;
  } catch {
    return DEFAULT_RESOURCES;
  }
}

export function saveResource(resource: DecaResource): void {
  const list = getResources();
  const existingIdx = list.findIndex(r => r.id === resource.id);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...resource, updatedAt: Date.now() };
  } else {
    list.unshift(resource);
  }
  localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(list));
}

export function deleteResource(id: string): void {
  const list = getResources();
  const filtered = list.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(filtered));
}
