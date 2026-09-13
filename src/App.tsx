import React, { useState, useEffect } from 'react';
import { User, CompletedExam, CustomTest, Question } from './types';
import {
  getCurrentUser,
  setCurrentUser as persistCurrentUser,
  saveCompletedExam,
  loginUser,
} from './services/storage';
import {
  getRandom100Questions,
  getCachedOrGeneratedPool,
  getOfficialExam1327Questions,
  getQuickSprintQuestions,
} from './data/questionPool';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LandingHero } from './components/LandingHero';
import { TakeExamLanding } from './components/TakeExamLanding';
import { ExamRunner } from './components/ExamRunner';
import { ExamResults } from './components/ExamResults';
import { StudentDashboard } from './components/StudentDashboard';
import { ClusterLeaderDashboard } from './components/ClusterLeaderDashboard';
import { QuestionBankView } from './components/QuestionBankView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<'student' | 'cluster_leader'>('student');

  // Navigation views
  const [activeView, setActiveView] = useState<
    'take_exam' | 'student_dashboard' | 'leader_roster' | 'question_bank' | 'create_tests'
  >(() => (currentUser?.role === 'cluster_leader' ? 'leader_roster' : 'take_exam'));

  // Active Exam state
  const [isExamActive, setIsExamActive] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activeExamTitle, setActiveExamTitle] = useState('DECA Entrepreneurship Written Exam (100 Qs)');
  const [activeExamTimeLimit, setActiveExamTimeLimit] = useState(70);

  // Completed Exam result view
  const [viewingResult, setViewingResult] = useState<CompletedExam | null>(null);

  // Sync role view when user logs in or out
  useEffect(() => {
    if (currentUser?.role === 'cluster_leader') {
      if (activeView === 'student_dashboard') {
        setActiveView('leader_roster');
      }
    } else if (currentUser?.role === 'student') {
      if (activeView === 'leader_roster' || activeView === 'create_tests') {
        setActiveView('take_exam');
      }
    }
  }, [currentUser]);

  const handleOpenAuth = (role: 'student' | 'cluster_leader' = 'student') => {
    setAuthDefaultRole(role);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    persistCurrentUser(user);
    if (user.role === 'cluster_leader') {
      setActiveView('leader_roster');
    } else {
      setActiveView('take_exam');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    persistCurrentUser(null);
    setIsExamActive(false);
    setViewingResult(null);
    setActiveView('take_exam');
  };

  const handleQuickDemo = (role: 'student' | 'cluster_leader') => {
    if (role === 'student') {
      const res = loginUser('jordan_lee', 'student');
      if (res.success && res.user) {
        handleLoginSuccess(res.user);
      }
    }
  };

  // Helper to ensure an active student session before starting an exam
  const ensureStudentSession = (): User => {
    if (currentUser) return currentUser;
    const res = loginUser('jordan_lee', 'student');
    if (res.success && res.user) {
      persistCurrentUser(res.user);
      setCurrentUser(res.user);
      return res.user;
    }
    const fallbackUser: User = {
      id: 'guest_student',
      username: 'student_guest',
      name: 'Student Competitor',
      role: 'student',
      createdAt: Date.now(),
    };
    persistCurrentUser(fallbackUser);
    setCurrentUser(fallbackUser);
    return fallbackUser;
  };

  // Launch Official Test 1327 (100 Questions, 70 min)
  const handleStartOfficialExam = () => {
    ensureStudentSession();
    const official100 = getOfficialExam1327Questions();
    setActiveQuestions(official100);
    setActiveExamTitle('DECA Official Entrepreneurship Written Exam (Test 1327)');
    setActiveExamTimeLimit(70);
    setViewingResult(null);
    setIsExamActive(true);
  };

  // Launch a standard 100-Question Exam with 70 min timer from 1000 pool
  const handleStartStandardExam = () => {
    ensureStudentSession();
    const questions100 = getRandom100Questions();
    setActiveQuestions(questions100);
    setActiveExamTitle('DECA Entrepreneurship Written Exam (100-Question Simulation)');
    setActiveExamTimeLimit(70);
    setViewingResult(null);
    setIsExamActive(true);
  };

  // Launch 25-Question Quick Diagnostic Sprint (18 min)
  const handleStartSprintExam = () => {
    ensureStudentSession();
    const sprintQuestions = getQuickSprintQuestions(25);
    setActiveQuestions(sprintQuestions);
    setActiveExamTitle('DECA Entrepreneurship Diagnostic Sprint (25 Questions)');
    setActiveExamTimeLimit(18);
    setViewingResult(null);
    setIsExamActive(true);
  };

  // Launch a custom assigned exam
  const handleStartCustomExam = (test: CustomTest) => {
    ensureStudentSession();
    const pool = getCachedOrGeneratedPool();
    const idSet = new Set(test.questionIds);
    let selected = pool.filter(q => idSet.has(q.id));
    if (selected.length === 0) {
      selected = getRandom100Questions().slice(0, 50);
    }

    setActiveQuestions(selected);
    setActiveExamTitle(test.title);
    setActiveExamTimeLimit(test.timeLimitMinutes || 70);
    setViewingResult(null);
    setIsExamActive(true);
  };

  // When student finishes and submits exam
  const handleCompleteExam = (completed: CompletedExam) => {
    saveCompletedExam(completed);
    setIsExamActive(false);
    setViewingResult(completed);
  };

  const currentPool = getCachedOrGeneratedPool();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onSelectView={view => {
          setViewingResult(null);
          setActiveView(view);
        }}
        onOpenAuth={role => handleOpenAuth(role || 'student')}
        onLogout={handleLogout}
        onStartExam={handleStartStandardExam}
        isExamActive={isExamActive}
        totalQuestions={currentPool.length}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {/* If Active Exam is underway */}
        {isExamActive ? (
          <ExamRunner
            questions={activeQuestions}
            currentUser={
              currentUser || {
                id: 'guest_user',
                username: 'guest',
                name: 'Guest Student',
                role: 'student',
                createdAt: Date.now(),
              }
            }
            totalTimeMinutes={activeExamTimeLimit}
            examTitle={activeExamTitle}
            onCompleteExam={handleCompleteExam}
            onExitExam={() => setIsExamActive(false)}
          />
        ) : viewingResult ? (
          /* Viewing Exam Results & Rationales */
          <ExamResults
            exam={viewingResult}
            onGoToDashboard={() => {
              setViewingResult(null);
              if (currentUser?.role === 'cluster_leader') {
                setActiveView('leader_roster');
              } else if (currentUser?.role === 'student') {
                setActiveView('student_dashboard');
              } else {
                setActiveView('take_exam');
              }
            }}
            onRetakeExam={handleStartStandardExam}
          />
        ) : activeView === 'question_bank' ? (
          /* Dedicated Question Bank Explorer - Accessible to all */
          <QuestionBankView
            questions={currentPool}
            onStartStandardExam={handleStartStandardExam}
            onStartAreaPractice={area => {
              const areaQuestions = currentPool.filter(q => q.instructionalArea === area);
              if (areaQuestions.length > 0) {
                setActiveQuestions(areaQuestions.slice(0, Math.min(25, areaQuestions.length)));
                setActiveExamTitle(`${area} Practice Drill`);
                setActiveExamTimeLimit(20);
                setViewingResult(null);
                setIsExamActive(true);
              }
            }}
            isAdmin={currentUser?.role === 'cluster_leader'}
          />
        ) : currentUser?.role === 'cluster_leader' ? (
          /* Cluster Leader Views */
          <div>
            {activeView === 'take_exam' ? (
              <TakeExamLanding
                currentUser={currentUser}
                onStartStandardExam={handleStartStandardExam}
                onStartOfficialExam={handleStartOfficialExam}
                onStartCustomExam={handleStartCustomExam}
              />
            ) : (
              <ClusterLeaderDashboard
                currentUser={currentUser}
                activeView={activeView}
                onTabChange={tab => setActiveView(tab)}
                onViewExamDetails={exam => setViewingResult(exam)}
              />
            )}
          </div>
        ) : currentUser?.role === 'student' ? (
          /* Student Views */
          <div>
            {activeView === 'take_exam' && (
              <TakeExamLanding
                currentUser={currentUser}
                onStartStandardExam={handleStartStandardExam}
                onStartOfficialExam={handleStartOfficialExam}
                onStartCustomExam={handleStartCustomExam}
              />
            )}

            {activeView === 'student_dashboard' && (
              <StudentDashboard
                currentUser={currentUser}
                onStartExam={handleStartStandardExam}
                onViewExamDetails={exam => setViewingResult(exam)}
              />
            )}
          </div>
        ) : (
          /* Guest / Public Landing View */
          <div>
            {activeView === 'take_exam' ? (
              <LandingHero
                onOpenLogin={handleOpenAuth}
                onQuickDemo={handleQuickDemo}
                onStartOfficialExam={handleStartOfficialExam}
                onStartRandomExam={handleStartStandardExam}
                onStartSprintExam={handleStartSprintExam}
              />
            ) : (
              <LandingHero
                onOpenLogin={handleOpenAuth}
                onQuickDemo={handleQuickDemo}
                onStartOfficialExam={handleStartOfficialExam}
                onStartRandomExam={handleStartStandardExam}
                onStartSprintExam={handleStartSprintExam}
              />
            )}
          </div>
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
        defaultRole={authDefaultRole}
      />

      {/* Subtle Educational Footer */}
      {!isExamActive && (
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white">DECA Entrepreneurship Written Exam Terminal</span>
              <span>•</span>
              <span>Official MBA Research Exam & {currentPool.length.toLocaleString()}-Question Bank</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-500">
              <span>Standard 70-Minute Competition Timer</span>
              <span>•</span>
              <span>100 Questions • 1 pt each</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
