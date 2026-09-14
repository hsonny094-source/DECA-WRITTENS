export type UserRole = 'student' | 'cluster_leader';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: number;
  email?: string;
  clusterId?: string;
}

export type InstructionalArea =
  | 'Business Law (BL)'
  | 'Economics (EC)'
  | 'Emotional Intelligence (EI)'
  | 'Entrepreneurship Concepts (EN)'
  | 'Financial Analysis (FI)'
  | 'Marketing & Research (MK)'
  | 'Operations & Logistics (OP)'
  | 'Strategic Management (SM)'
  | 'Information Management (NF)'
  | 'Human Resources (HR)'
  | 'Risk Management (RM)'
  | 'Professional Development (PD)';

export interface Question {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctAnswer: number; // 0 for A, 1 for B, 2 for C, 3 for D
  instructionalArea: InstructionalArea;
  indicator: string;
  rationale: string;
  year: number; // 2015 - 2024
  source?: string;
}

export interface AreaPerformance {
  area: InstructionalArea;
  correct: number;
  total: number;
  percentage: number;
}

export interface CompletedExam {
  id: string;
  studentId: string;
  studentName: string;
  examTitle: string;
  testType: 'standard_100' | 'custom';
  completedAt: number;
  timeSpentSeconds: number;
  totalQuestions: number;
  score: number; // Raw score (number correct)
  percentage: number;
  answers: Record<number, number>; // question id -> selected option (0..3)
  questions: Question[]; // Snapshot of questions used
  areaBreakdown: AreaPerformance[];
  sharedWithLeader: boolean;
  sharedAt?: number;
  studentNotes?: string;
}

export interface CustomTest {
  id: string;
  title: string;
  description: string;
  createdByLeaderId: string;
  createdByName: string;
  createdAt: number;
  timeLimitMinutes: number;
  questionIds: number[];
  assignedToAll: boolean;
}

export interface ClusterStudentSummary {
  student: User;
  totalExams: number;
  highestScore: number;
  averageScore: number;
  lastExamDate?: number;
  sharedExams: CompletedExam[];
  weakestArea?: string;
  strongestArea?: string;
}

export type CalendarTag = 'slides' | 'meeting' | 'exam' | 'deadline' | 'notes' | 'resource';

export interface CalendarNote {
  id: string;
  date: string; // YYYY-MM-DD (2026-01-01 to 2027-02-28)
  title: string;
  description: string;
  tag: CalendarTag;
  linkUrl?: string;
  linkTitle?: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  updatedAt?: number;
}
