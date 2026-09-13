import React, { useState } from 'react';
import { User } from '../types';
import {
  Award,
  BookOpen,
  ShieldCheck,
  UserCheck,
  LogOut,
  FileText,
  BarChart2,
  Menu,
  X,
  Upload,
  Layers,
  Lock
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeView: 'take_exam' | 'student_dashboard' | 'leader_roster' | 'question_bank' | 'create_tests';
  onSelectView: (view: 'take_exam' | 'student_dashboard' | 'leader_roster' | 'question_bank' | 'create_tests') => void;
  onOpenAuth: (role?: 'student' | 'cluster_leader') => void;
  onLogout: () => void;
  onStartExam: () => void;
  isExamActive: boolean;
  totalQuestions: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  onSelectView,
  onOpenAuth,
  onLogout,
  onStartExam,
  isExamActive,
  totalQuestions,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: 'take_exam' | 'student_dashboard' | 'leader_roster' | 'question_bank' | 'create_tests') => {
    setMobileMenuOpen(false);
    onSelectView(view);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding - Always Clickable */}
          <button
            type="button"
            id="nav-logo-btn"
            onClick={() => !isExamActive && handleNavClick(currentUser?.role === 'cluster_leader' ? 'leader_roster' : 'take_exam')}
            className="flex items-center space-x-3 text-left focus:outline-none group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-400 flex items-center justify-center font-black text-xl tracking-wider text-white shadow-inner group-hover:bg-blue-500 transition">
              D
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-blue-300 transition">
                  DECA
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Entrepreneurship Exam
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {totalQuestions.toLocaleString()} Questions • 70-Min Timed Practice
              </p>
            </div>
          </button>

          {/* Desktop Nav links */}
          {!isExamActive && (
            <nav className="hidden md:flex items-center space-x-1.5">
              {/* Take Exam Button */}
              <button
                type="button"
                id="nav-take-exam-btn"
                onClick={() => handleNavClick('take_exam')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeView === 'take_exam'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Take Exam</span>
              </button>

              {/* Question Bank Button - Accessible to all */}
              <button
                type="button"
                id="nav-question-bank-btn"
                onClick={() => handleNavClick('question_bank')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeView === 'question_bank'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Question Bank</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {totalQuestions.toLocaleString()}
                </span>
              </button>

              {/* Student specific link */}
              {currentUser?.role === 'student' && (
                <button
                  type="button"
                  id="nav-student-perf-btn"
                  onClick={() => handleNavClick('student_dashboard')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeView === 'student_dashboard'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart2 className="w-4 h-4 text-blue-400" />
                  <span>My Performance</span>
                </button>
              )}

              {/* Cluster Leader specific links */}
              {currentUser?.role === 'cluster_leader' && (
                <>
                  <button
                    type="button"
                    id="nav-leader-roster-btn"
                    onClick={() => handleNavClick('leader_roster')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      activeView === 'leader_roster'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Students & Scores</span>
                  </button>

                  <button
                    type="button"
                    id="nav-create-tests-btn"
                    onClick={() => handleNavClick('create_tests')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      activeView === 'create_tests'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>Sift & Upload Questions</span>
                  </button>
                </>
              )}

              {/* Guest links */}
              {!currentUser && (
                <button
                  type="button"
                  id="nav-advisor-portal-btn"
                  onClick={() => onOpenAuth('cluster_leader')}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Advisor Portal</span>
                </button>
              )}
            </nav>
          )}

          {/* User badge, Auth actions & Mobile Toggle */}
          <div className="flex items-center space-x-2.5">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-bold text-white flex items-center justify-end space-x-1">
                    <span>{currentUser.name}</span>
                    {currentUser.role === 'cluster_leader' && (
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400 inline" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentUser.role === 'cluster_leader' ? 'Cluster Leader' : 'DECA Competitor'}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>

                {!isExamActive && (
                  <button
                    type="button"
                    id="btn-logout"
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="btn-nav-sign-in"
                  onClick={() => onOpenAuth('student')}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* Mobile menu hamburger toggle */}
            {!isExamActive && (
              <button
                type="button"
                id="btn-mobile-nav-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      {mobileMenuOpen && !isExamActive && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            id="mobile-nav-take-exam"
            onClick={() => handleNavClick('take_exam')}
            className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
              activeView === 'take_exam' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Take Exam (Test Modes)</span>
          </button>

          <button
            type="button"
            id="mobile-nav-question-bank"
            onClick={() => handleNavClick('question_bank')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
              activeView === 'question_bank' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Question Bank Explorer</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
              {totalQuestions.toLocaleString()}
            </span>
          </button>

          {currentUser?.role === 'student' && (
            <button
              type="button"
              id="mobile-nav-perf"
              onClick={() => handleNavClick('student_dashboard')}
              className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
                activeView === 'student_dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <span>My Performance & Scores</span>
            </button>
          )}

          {currentUser?.role === 'cluster_leader' && (
            <>
              <button
                type="button"
                id="mobile-nav-roster"
                onClick={() => handleNavClick('leader_roster')}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
                  activeView === 'leader_roster' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Student Roster & Scores</span>
              </button>

              <button
                type="button"
                id="mobile-nav-create-tests"
                onClick={() => handleNavClick('create_tests')}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
                  activeView === 'create_tests' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Sift & Upload Questions</span>
              </button>
            </>
          )}

          {!currentUser && (
            <button
              type="button"
              id="mobile-nav-advisor"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth('cluster_leader');
              }}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Advisor Portal (Authorization)</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
