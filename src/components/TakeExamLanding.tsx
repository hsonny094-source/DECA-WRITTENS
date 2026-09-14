import React, { useState } from 'react';
import { User, CustomTest } from '../types';
import { getCustomTests } from '../services/storage';
import { getCachedOrGeneratedPool } from '../data/questionPool';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  HelpCircle,
  FileQuestion
} from 'lucide-react';

interface TakeExamLandingProps {
  currentUser: User;
  onStartStandardExam: () => void;
  onStartOfficialExam?: () => void;
  onStartCustomExam: (test: CustomTest) => void;
}

export const TakeExamLanding: React.FC<TakeExamLandingProps> = ({
  currentUser,
  onStartStandardExam,
  onStartOfficialExam,
  onStartCustomExam,
}) => {
  const [customTests] = useState<CustomTest[]>(getCustomTests());
  const pool = getCachedOrGeneratedPool();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Primary Exam Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official DECA Entrepreneurship Simulation</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            DECA Entrepreneurship Written Exam
          </h1>
          <div className="inline-flex items-center flex-wrap gap-1.5 text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg mb-3">
            <span className="font-medium text-slate-500">Cluster Leaders:</span>
            <span className="font-semibold text-slate-900">Ronnie Agarwal</span>
            <span className="text-slate-400">•</span>
            <span className="font-semibold text-slate-900">Omar Ahmed</span>
            <span className="text-slate-400">•</span>
            <span className="font-semibold text-slate-900">Omar Dowidar</span>
          </div>
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed mb-8">
            Simulate the true DECA competition environment. Your test will draw <strong className="text-slate-900">100 random multiple-choice questions</strong> from our extensive <strong className="text-blue-700">{pool.length.toLocaleString()}-question pool</strong> spanning 10 years of DECA Entrepreneurship exams (2015–2024).
          </p>

          {/* Test Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <FileQuestion className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold">Total Questions</span>
              </div>
              <div className="text-2xl font-black text-slate-900">100</div>
              <div className="text-[11px] text-slate-500">Randomly selected</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold">Time Limit</span>
              </div>
              <div className="text-2xl font-black text-slate-900">70:00</div>
              <div className="text-[11px] text-slate-500">Official DECA rules</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold">Question Pool</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{pool.length.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500">Current active pool</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold">Benchmark</span>
              </div>
              <div className="text-2xl font-black text-slate-900">70-85+</div>
              <div className="text-[11px] text-slate-500">State / ICDC target</div>
            </div>
          </div>

          {/* Guidelines checklist */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 mb-8 space-y-2 text-xs text-blue-950">
            <div className="font-bold flex items-center space-x-1.5 text-blue-900">
              <HelpCircle className="w-4 h-4 text-blue-700" />
              <span>Exam Rules & Strategy:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>Each question has exactly one correct answer (A, B, C, or D).</li>
              <li>You can flag questions and navigate using the 100-question matrix drawer at any time.</li>
              <li>There is no penalty for guessing; ensure you answer all 100 questions before time expires.</li>
              <li>Upon completion, you will instantly receive your graded score and can share it with your Cluster Leader.</li>
            </ul>
          </div>

          {/* Launch Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {onStartOfficialExam && (
              <button
                id="btn-launch-official-exam"
                onClick={onStartOfficialExam}
                className="flex-1 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-sm hover:shadow flex items-center justify-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Launch Official Exam (Test 1327)</span>
              </button>
            )}

            <button
              id="btn-launch-100-q-exam"
              onClick={onStartStandardExam}
              className="flex-1 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition shadow-sm hover:shadow flex items-center justify-center space-x-2"
            >
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Launch Randomized 100Q Simulation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cluster Leader Custom Test Assignments (if any) */}
      {customTests.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center space-x-2 mb-1">
            <Award className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Cluster Leader Assigned Tests
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Custom exams created or uploaded specifically by your DECA Cluster Leader
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customTests.map(ct => (
              <div
                key={ct.id}
                className="p-5 rounded-2xl border border-purple-200 bg-purple-50/30 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{ct.title}</h3>
                  <p className="text-xs text-slate-600 mb-3">{ct.description}</p>
                  <div className="flex items-center space-x-3 text-xs text-purple-800 font-semibold mb-4">
                    <span>{ct.questionIds.length} Questions</span>
                    <span>•</span>
                    <span>{ct.timeLimitMinutes} Minutes</span>
                    <span>•</span>
                    <span>By {ct.createdByName}</span>
                  </div>
                </div>

                <button
                  onClick={() => onStartCustomExam(ct)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
                >
                  Start Custom Exam
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
