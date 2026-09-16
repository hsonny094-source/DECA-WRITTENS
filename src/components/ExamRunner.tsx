import React, { useState, useEffect, useMemo } from 'react';
import { Question, CompletedExam, User } from '../types';
import { calculateAreaBreakdown } from '../services/storage';
import { PacingMeter } from './PacingMeter';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Pause,
  Play,
  Grid,
  HelpCircle,
  X,
  Timer
} from 'lucide-react';

interface ExamRunnerProps {
  questions: Question[];
  currentUser: User;
  onCompleteExam: (exam: CompletedExam) => void;
  onExitExam: () => void;
  examTitle?: string;
  totalTimeMinutes?: number; // default 70
}

export const ExamRunner: React.FC<ExamRunnerProps> = ({
  questions,
  currentUser,
  onCompleteExam,
  onExitExam,
  examTitle = 'DECA Entrepreneurship Written Exam (100 Questions)',
  totalTimeMinutes = 70,
}) => {
  const totalSeconds = totalTimeMinutes * 60; // 4200 seconds for 70 min
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [showGridDrawer, setShowGridDrawer] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unanswered' | 'flagged'>('all');
  const [questionDwellSeconds, setQuestionDwellSeconds] = useState<Record<number, number>>({});

  // Countdown timer & question dwell timer
  useEffect(() => {
    if (isPaused || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(); // auto submit on time expiration
          return 0;
        }
        return prev - 1;
      });

      // Track dwell time for active question
      const currentQId = questions[currentIndex]?.id;
      if (currentQId !== undefined) {
        setQuestionDwellSeconds(prev => ({
          ...prev,
          [currentQId]: (prev[currentQId] || 0) + 1,
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, secondsRemaining, currentIndex, questions]);

  // Keyboard navigation for A, B, C, D and arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || isPaused) return;

      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      if (e.key === 'a' || e.key === 'A' || e.key === '1') {
        selectAnswer(currentQ.id, 0);
      } else if (e.key === 'b' || e.key === 'B' || e.key === '2') {
        selectAnswer(currentQ.id, 1);
      } else if (e.key === 'c' || e.key === 'C' || e.key === '3') {
        selectAnswer(currentQ.id, 2);
      } else if (e.key === 'd' || e.key === 'D' || e.key === '4') {
        selectAnswer(currentQ.id, 3);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFlag(currentQ.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions, showSubmitModal, isPaused]);

  const selectAnswer = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const toggleFlag = (questionId: number) => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = flagged.size;

  const handleSubmitExam = () => {
    const timeSpent = totalSeconds - secondsRemaining;
    const score = questions.filter(q => answers[q.id] === q.correctAnswer).length;
    const percentage = Math.round((score / questions.length) * 100);
    const areaBreakdown = calculateAreaBreakdown(questions, answers);

    const answeredCount = Object.keys(answers).length;
    const targetPace = Math.round(totalSeconds / questions.length);
    const avgPace = answeredCount > 0 ? Math.round(timeSpent / answeredCount) : targetPace;
    const pacingRating: 'Ahead of Pace' | 'Optimal Cadence' | 'Overtime Risk' =
      avgPace < targetPace - 5
        ? 'Ahead of Pace'
        : avgPace > targetPace + 4
        ? 'Overtime Risk'
        : 'Optimal Cadence';
    const projectedBufferMinutes = Math.round((totalSeconds - avgPace * questions.length) / 60);

    const completed: CompletedExam = {
      id: `exam_${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      examTitle,
      testType: 'standard_100',
      completedAt: Date.now(),
      timeSpentSeconds: timeSpent,
      totalQuestions: questions.length,
      score,
      percentage,
      answers,
      questions,
      areaBreakdown,
      sharedWithLeader: true,
      pacingMetrics: {
        averageSecondsPerQuestion: avgPace,
        targetSecondsPerQuestion: targetPace,
        pacingRating,
        questionTimeSeconds: questionDwellSeconds,
        projectedBufferMinutes,
      },
    };

    onCompleteExam(completed);
  };

  const currentQ = questions[currentIndex];

  // Timer styling
  const isTimeCritical = secondsRemaining < 300; // < 5 mins
  const isTimeWarning = secondsRemaining < 900 && !isTimeCritical; // < 15 mins

  const filteredGridIndices = useMemo(() => {
    return questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => {
        if (filterType === 'unanswered') return answers[q.id] === undefined;
        if (filterType === 'flagged') return flagged.has(q.id);
        return true;
      });
  }, [questions, answers, flagged, filterType]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex flex-col justify-between select-none">
      {/* Top Exam Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Test info & Progress */}
          <div className="flex items-center space-x-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  DECA Entrepreneurship Exam
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                  {questions.length} Questions
                </span>
              </div>
              <div className="text-xs text-slate-500 hidden sm:block">
                Answered: <strong className="text-slate-700">{answeredCount}</strong>/{questions.length} •{' '}
                Remaining: <strong className="text-slate-700">{unansweredCount}</strong>
              </div>
            </div>
          </div>

          {/* Center: Live Pacing Velocity Meter */}
          <div className="flex items-center">
            <PacingMeter
              elapsedSeconds={totalSeconds - secondsRemaining}
              secondsRemaining={secondsRemaining}
              totalSeconds={totalSeconds}
              totalQuestions={questions.length}
              currentIndex={currentIndex}
              answeredCount={answeredCount}
              currentQuestionDwellSeconds={questionDwellSeconds[currentQ?.id] || 0}
            />
          </div>

          {/* Right: Timer & Actions */}
          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-sm sm:text-base font-mono font-bold tracking-wider transition ${
                isTimeCritical
                  ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                  : isTimeWarning
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-900 text-emerald-400 border-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            <button
              id="btn-pause-exam"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume Exam' : 'Pause Exam'}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-600" /> : <Pause className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              id="btn-open-grid"
              onClick={() => setShowGridDrawer(!showGridDrawer)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              <Grid className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Review Matrix</span>
              <span className="sm:hidden">Grid</span>
            </button>

            <button
              id="btn-submit-exam-open"
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit</span>
            </button>
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Display or Pause Screen */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {isPaused ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-auto">
            <Pause className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-1">Exam Paused</h3>
            <p className="text-sm text-slate-600 mb-6">
              Timer is currently stopped. Question content is hidden while paused.
            </p>
            <button
              id="btn-resume-exam"
              onClick={() => setIsPaused(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition cursor-pointer"
            >
              Resume 70-Minute Exam
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between relative">
            {/* Top metadata row */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                  {currentQ.instructionalArea}
                </span>
                {/* Live Question Dwell Telemetry */}
                <span
                  className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                    (questionDwellSeconds[currentQ.id] || 0) >= 60
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                  title="Time spent on this specific question (Target: 42s)"
                >
                  <Timer className={`w-3 h-3 ${(questionDwellSeconds[currentQ.id] || 0) >= 60 ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>{questionDwellSeconds[currentQ.id] || 0}s dwell</span>
                </span>
                {currentQ.year && (
                  <span className="text-xs font-medium text-slate-500 hidden md:inline">
                    {currentQ.year} Series
                  </span>
                )}
              </div>

              {/* Flag button */}
              <button
                id="btn-flag-question"
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  flagged.has(currentQ.id)
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${flagged.has(currentQ.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{flagged.has(currentQ.id) ? 'Flagged for Review' : 'Flag Question (F)'}</span>
              </button>
            </div>

            {/* Performance Indicator hint */}
            {currentQ.indicator && (
              <div className="text-xs font-mono text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center space-x-2">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Standard: {currentQ.indicator}</span>
              </div>
            )}

            {/* Lingering Pacing Alert Banner if question dwell >= 60s */}
            {(questionDwellSeconds[currentQ.id] || 0) >= 60 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Pacing Alert ({questionDwellSeconds[currentQ.id]}s):</strong> You are lingering past the 42s benchmark. In DECA testing, make your best educated guess, flag (F), and keep your forward pace!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFlag(currentQ.id)}
                  className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[11px] self-start sm:self-auto shrink-0 transition cursor-pointer"
                >
                  {flagged.has(currentQ.id) ? 'Flagged ✓' : 'Flag Question'}
                </button>
              </div>
            )}

            {/* Question Text */}
            <h2 className="text-lg sm:text-xl font-medium text-slate-900 leading-relaxed mb-6">
              {currentQ.question}
            </h2>

            {/* Options List */}
            <div className="space-y-3 mb-6">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = answers[currentQ.id] === optIdx;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <button
                    key={optIdx}
                    id={`opt-q${currentQ.id}-${letter}`}
                    type="button"
                    onClick={() => selectAnswer(currentQ.id, optIdx)}
                    className={`w-full text-left p-4 rounded-xl border transition flex items-start space-x-3.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-600/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs transition ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm sm:text-base leading-snug pt-0.5">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation bottom row */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                id="btn-prev-question"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
                  currentIndex === 0
                    ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-xs text-slate-400 hidden sm:block">
                Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-mono">A</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-mono">B</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-mono">C</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-mono">D</kbd> to select
              </div>

              {currentIndex < questions.length - 1 ? (
                <button
                  id="btn-next-question"
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-sm"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="btn-finish-last-question"
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-sm"
                >
                  <span>Review & Finish</span>
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 100-Question Review Matrix Drawer */}
      {showGridDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">100-Question Matrix</h3>
                <p className="text-xs text-slate-500">
                  Answered: {answeredCount} | Flagged: {flaggedCount} | Remaining: {unansweredCount}
                </p>
              </div>
              <button
                id="btn-close-grid-drawer"
                onClick={() => setShowGridDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex p-2 gap-1 border-b border-slate-200 bg-white">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                  filterType === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All (100)
              </button>
              <button
                onClick={() => setFilterType('unanswered')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                  filterType === 'unanswered' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Unanswered ({unansweredCount})
              </button>
              <button
                onClick={() => setFilterType('flagged')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                  filterType === 'flagged' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Flagged ({flaggedCount})
              </button>
            </div>

            {/* Question matrix grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {filteredGridIndices.map(({ q, idx }) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isFlagged = flagged.has(q.id);
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowGridDrawer(false);
                      }}
                      className={`relative h-11 rounded-lg font-mono text-xs font-bold transition flex flex-col items-center justify-center border ${
                        isCurrent
                          ? 'border-blue-600 ring-2 ring-blue-600 bg-blue-50 text-blue-900'
                          : isAnswered
                          ? 'bg-slate-900 text-white border-slate-800'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1" />
                      )}
                      {isAnswered && (
                        <span className="text-[9px] text-slate-400 font-normal">
                          {String.fromCharCode(65 + answers[q.id])}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowGridDrawer(false);
                  setShowSubmitModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition"
              >
                Submit Exam Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Ready to Submit Exam?</h3>
            <p className="text-sm text-center text-slate-600 mb-6">
              You will receive your score, instructional area breakdown, and complete rationales immediately.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2 text-sm border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Total Questions:</span>
                <strong className="text-slate-900">{questions.length}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Answered:</span>
                <strong className="text-emerald-600">{answeredCount}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Unanswered:</span>
                <strong className={unansweredCount > 0 ? 'text-amber-600' : 'text-slate-600'}>
                  {unansweredCount}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Time Remaining:</span>
                <strong className="text-blue-600 font-mono">{formatTime(secondsRemaining)}</strong>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2 mb-6">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  You still have {unansweredCount} unanswered questions. Unanswered questions will be scored as incorrect.
                </span>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                id="btn-modal-cancel-submit"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition"
              >
                Continue Test
              </button>
              <button
                id="btn-modal-confirm-submit"
                onClick={handleSubmitExam}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-sm"
              >
                Submit & Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
