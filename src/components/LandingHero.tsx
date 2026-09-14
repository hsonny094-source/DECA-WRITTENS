import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ShieldCheck,
  UserCheck,
  Clock,
  Sparkles,
  Zap,
  Search,
  CheckCircle2,
  ChevronRight,
  Filter,
  Lock,
  Layers,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { InstructionalArea, Question } from '../types';
import { getCachedOrGeneratedPool, INSTRUCTIONAL_AREAS } from '../data/questionPool';

interface LandingHeroProps {
  onOpenLogin: (role?: 'student' | 'cluster_leader') => void;
  onStartOfficialExam: () => void;
  onStartRandomExam: () => void;
  onStartSprintExam: () => void;
  onOpenCalendar?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onOpenLogin,
  onStartOfficialExam,
  onStartRandomExam,
  onStartSprintExam,
  onOpenCalendar,
}) => {
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showQuestionBankPreview, setShowQuestionBankPreview] = useState<boolean>(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  const pool = useMemo(() => getCachedOrGeneratedPool(), []);

  // Filtered questions for the in-depth bank inspector
  const filteredQuestions = useMemo(() => {
    return pool.filter(q => {
      const matchesArea =
        selectedAreaFilter === 'all' || q.instructionalArea === selectedAreaFilter;
      const matchesQuery =
        !searchQuery.trim() ||
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.indicator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options.some(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesArea && matchesQuery;
    }).slice(0, 10);
  }, [pool, selectedAreaFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Station Header */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 sm:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-full bg-slate-800/90 text-blue-400 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DECA ENTREPRENEURSHIP TESTING TERMINAL</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-bold">{pool.length.toLocaleString()}-QUESTION BANK</span>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                id="btn-advisor-portal-access"
                onClick={() => onOpenLogin('cluster_leader')}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
                title="Advisor authorization required"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Advisor Portal</span>
              </button>

              <button
                id="btn-student-login-header"
                onClick={() => onOpenLogin('student')}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Student Sign In</span>
              </button>
            </div>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Entrepreneurship Written Exam
            </h1>
            <div className="inline-flex items-center flex-wrap gap-2 text-xs sm:text-sm text-blue-200 bg-blue-950/60 border border-blue-800/60 px-3.5 py-1.5 rounded-xl">
              <span className="text-slate-400 font-medium">Cluster Leaders:</span>
              <span className="font-semibold text-white">Ronnie Agarwal</span>
              <span className="text-blue-400">•</span>
              <span className="font-semibold text-white">Omar Ahmed</span>
              <span className="text-blue-400">•</span>
              <span className="font-semibold text-white">Omar Dowidar</span>
            </div>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Authentic classroom testing simulator for DECA Entrepreneurship written events. Practice with the official 100-question exam, randomized pulls from the {pool.length.toLocaleString()}-question bank, and realistic 70-minute competition timing.
            </p>

            {/* Quick access to Cluster Calendar & Google Slides */}
            {onOpenCalendar && (
              <div className="pt-2">
                <button
                  type="button"
                  id="btn-hero-open-calendar"
                  onClick={onOpenCalendar}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>View Cluster Calendar & Google Slides (2026 – Feb 2027)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Testing Modes (Action Tiles) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <span>Select Exam Format</span>
            </h2>
            <p className="text-xs text-slate-500">Standard DECA competition rules: 100 questions, 70 minutes, 1 point each.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Official Test 1327 */}
          <div className="bg-white rounded-3xl border-2 border-blue-600/40 hover:border-blue-600 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Official DECA Test
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>

              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Test 1327</span>
                <h3 className="text-xl font-black text-slate-900">Official Entrepreneurship Exam</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  The official DECA Entrepreneurship exam. Contains authentic questions, performance indicator benchmarks, and complete explanations.
                </p>
              </div>

              {/* Specs */}
              <div className="flex items-center space-x-3 text-xs font-mono font-semibold text-slate-600 py-2 border-y border-slate-100">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>100 Questions</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>70 Minutes</span>
                </span>
                <span>•</span>
                <span>Official DECA</span>
              </div>
            </div>

            <button
              id="btn-launch-official-1327"
              onClick={onStartOfficialExam}
              className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2"
            >
              <span>Launch Official Exam</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Randomized Simulation */}
          <div className="bg-white rounded-3xl border border-slate-200 hover:border-slate-400 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              {pool.length.toLocaleString()}-Question Pool
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Simulation</span>
                <h3 className="text-xl font-black text-slate-900">Randomized 100-Question Test</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Pulls 100 randomized questions from the 10-year DECA Entrepreneurship test bank. Evenly weighted across all 12 instructional areas to simulate competition day.
                </p>
              </div>

              {/* Specs */}
              <div className="flex items-center space-x-3 text-xs font-mono font-semibold text-slate-600 py-2 border-y border-slate-100">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>100 Random</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>70 Minutes</span>
                </span>
                <span>•</span>
                <span>2015–2025 Bank</span>
              </div>
            </div>

            <button
              id="btn-launch-random-sim"
              onClick={onStartRandomExam}
              className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2"
            >
              <span>Launch 100Q Simulation</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: 25-Question Quick Sprint */}
          <div className="bg-white rounded-3xl border border-slate-200 hover:border-slate-400 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Classroom Sprint
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>

              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Speed Drill</span>
                <h3 className="text-xl font-black text-slate-900">25-Question Rapid Sprint</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Fast diagnostic drill designed for classroom bell work, warmups, and rapid retention drills. Timed to match official per-question pacing (42 seconds/question).
                </p>
              </div>

              {/* Specs */}
              <div className="flex items-center space-x-3 text-xs font-mono font-semibold text-slate-600 py-2 border-y border-slate-100">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span>25 Questions</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>18 Minutes</span>
                </span>
                <span>•</span>
                <span>Fast Diagnostic</span>
              </div>
            </div>

            <button
              id="btn-launch-sprint-drill"
              onClick={onStartSprintExam}
              className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2"
            >
              <span>Start 25Q Sprint</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Question Bank Inspector */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Search className="w-4 h-4" />
              <span>Exam Content Verification</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Explore the {pool.length.toLocaleString()}-Question Exam Bank
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect authentic DECA Entrepreneurship test questions, Performance Indicators (PIs), and rationales.
            </p>
          </div>

          <button
            id="btn-toggle-bank-preview"
            onClick={() => setShowQuestionBankPreview(!showQuestionBankPreview)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition self-start md:self-auto"
          >
            {showQuestionBankPreview ? 'Hide Question Inspector' : 'Show Question Inspector'}
          </button>
        </div>

        {showQuestionBankPreview && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="bank-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search questions by concept (e.g., break-even, contract, LLC, touchpoint, cash flow)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="sm:w-72">
                <select
                  id="bank-area-select"
                  value={selectedAreaFilter}
                  onChange={e => setSelectedAreaFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700"
                >
                  <option value="all">All Instructional Areas ({pool.length} Questions)</option>
                  {INSTRUCTIONAL_AREAS.map(area => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3 pt-2">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No questions match your filter query. Try searching for "cash flow", "sole proprietorship", or "liability".
                </div>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isExpanded = expandedQuestionId === q.id;
                  return (
                    <div
                      key={q.id}
                      className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                              #{q.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-semibold">
                              {q.instructionalArea}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {q.indicator}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-900 leading-relaxed pt-1">
                            {q.question}
                          </p>
                        </div>

                        <button
                          onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                          className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded-lg hover:bg-blue-50 transition"
                        >
                          {isExpanded ? 'Hide Details' : 'View Answer'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-slate-200 space-y-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = optIdx === q.correctAnswer;
                              const letters = ['A', 'B', 'C', 'D'];
                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-xl border text-xs flex items-start space-x-2 ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {letters[optIdx]}
                                  </span>
                                  <span className="leading-snug">{opt}</span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950">
                            <span className="font-bold text-blue-900">Official Rationale: </span>
                            <span className="text-slate-700">{q.rationale}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* DECA Instructional Areas Tested */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-bold">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold">DECA Instructional Areas Tested</h3>
        </div>
        <p className="text-xs text-slate-600">
          Exam questions are drawn from 12 core business curriculum competency areas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs pt-1">
          {INSTRUCTIONAL_AREAS.map(area => (
            <div
              key={area}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center space-x-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold text-slate-800 text-xs truncate">{area}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
