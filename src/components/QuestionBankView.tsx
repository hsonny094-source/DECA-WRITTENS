import React, { useState, useMemo } from 'react';
import { Search, Filter, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Layers, Zap } from 'lucide-react';
import { Question, InstructionalArea } from '../types';
import { INSTRUCTIONAL_AREAS } from '../data/questionPool';

interface QuestionBankViewProps {
  questions: Question[];
  onStartAreaPractice?: (area: InstructionalArea) => void;
  onStartStandardExam?: () => void;
  isAdmin?: boolean;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questions,
  onStartAreaPractice,
  onStartStandardExam,
  isAdmin = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const pageSize = 15;

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesArea = selectedArea === 'all' || q.instructionalArea === selectedArea;
      const matchesYear = selectedYear === 'all' || (q.year && q.year.toString() === selectedYear);
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        q.question.toLowerCase().includes(query) ||
        (q.indicator && q.indicator.toLowerCase().includes(query)) ||
        q.options.some(opt => opt.toLowerCase().includes(query)) ||
        (q.rationale && q.rationale.toLowerCase().includes(query));

      return matchesArea && matchesYear && matchesSearch;
    });
  }, [questions, selectedArea, selectedYear, searchQuery]);

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;

  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl text-white p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-semibold px-3 py-1 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
            <Layers className="w-3.5 h-3.5" />
            <span>EXAM QUESTION BANK</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-bold">{questions.length.toLocaleString()} QUESTIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Question Bank Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Browse, search, and study authentic DECA Entrepreneurship exam questions with full 4-choice options, Performance Indicators, and official rationales.
          </p>
        </div>

        {onStartStandardExam && (
          <button
            id="btn-bank-start-sim"
            onClick={onStartStandardExam}
            className="shrink-0 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Launch Timed Exam</span>
          </button>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-bank-search"
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by keyword, concept, formula (e.g., break-even, LLC, current ratio, marketing)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              id="select-bank-area"
              value={selectedArea}
              onChange={e => {
                setSelectedArea(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">All Instructional Areas ({questions.length})</option>
              {INSTRUCTIONAL_AREAS.map(area => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            <select
              id="select-bank-year"
              value={selectedYear}
              onChange={e => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">All Exam Years</option>
              {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map(y => (
                <option key={y} value={y.toString()}>
                  {y} Series
                </option>
              ))}
            </select>

            {onStartAreaPractice && selectedArea !== 'all' && (
              <button
                id="btn-drill-selected-area"
                onClick={() => onStartAreaPractice(selectedArea as InstructionalArea)}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Drill This Area</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong>{filteredQuestions.length}</strong> matching questions (Page {currentPage} of {totalPages})
          </span>
          {(searchQuery || selectedArea !== 'all' || selectedYear !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedArea('all');
                setSelectedYear('all');
                setCurrentPage(1);
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {paginatedQuestions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs space-y-2">
            <p className="font-semibold text-slate-600 text-sm">No questions matched your search criteria.</p>
            <p>Try clearing your keyword filter or switching to "All Instructional Areas".</p>
          </div>
        ) : (
          paginatedQuestions.map(q => {
            const isExpanded = expandedId === q.id;
            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                      #{q.id}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                      {q.instructionalArea}
                    </span>
                    {q.year && (
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {q.year} Exam
                      </span>
                    )}
                    {q.indicator && (
                      <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                        {q.indicator}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition"
                  >
                    {isExpanded ? 'Collapse Answer' : 'Show Answer & Rationale'}
                  </button>
                </div>

                <p className="text-sm font-semibold text-slate-900 leading-relaxed pt-1">
                  {q.question}
                </p>

                {/* 4 Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.correctAnswer;
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border flex items-start space-x-2 transition ${
                          isCorrect
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-medium'
                            : 'border-slate-200 bg-slate-50/70 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Rationale & indicator */}
                {isExpanded && (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1 animate-in fade-in duration-150">
                    <div>
                      <strong className="text-blue-900">Official Rationale: </strong>
                      <span className="text-slate-800">{q.rationale}</span>
                    </div>
                    {q.indicator && (
                      <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-blue-200/60">
                        Performance Indicator: {q.indicator}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-semibold text-slate-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
