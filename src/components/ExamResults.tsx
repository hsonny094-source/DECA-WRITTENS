import React, { useState, useEffect } from 'react';
import { CompletedExam } from '../types';
import { toggleShareExam, getExamLiveRank } from '../services/storage';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Filter,
  HelpCircle,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Flame,
  Gauge,
  Timer,
  Zap,
  Activity,
} from 'lucide-react';

interface ExamResultsProps {
  exam: CompletedExam;
  onGoToDashboard: () => void;
  onRetakeExam: () => void;
  onRetestMissed?: (exam: CompletedExam) => void;
  onRetestWeakArea?: (area: string) => void;
  onOpenResources?: () => void;
}

export const ExamResults: React.FC<ExamResultsProps> = ({
  exam,
  onGoToDashboard,
  onRetakeExam,
  onRetestMissed,
  onRetestWeakArea,
  onOpenResources,
}) => {
  const [isShared, setIsShared] = useState(exam.sharedWithLeader);
  const [studentNotes, setStudentNotes] = useState(exam.studentNotes || '');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct'>('all');
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  const rankInfo = getExamLiveRank({ ...exam, sharedWithLeader: isShared });

  // Missed questions
  const missedQuestions = exam.questions.filter(q => exam.answers[q.id] !== q.correctAnswer);

  // Lowest instructional area
  const lowestArea = exam.areaBreakdown && exam.areaBreakdown.length > 0
    ? [...exam.areaBreakdown].sort((a, b) => a.percentage - b.percentage)[0]
    : null;

  // Pacing Velocity Diagnostics
  const totalQuestionsCount = exam.totalQuestions || exam.questions.length || 100;
  const avgPace = exam.pacingMetrics?.averageSecondsPerQuestion || Math.round(exam.timeSpentSeconds / totalQuestionsCount);
  const targetPace = exam.pacingMetrics?.targetSecondsPerQuestion || 42;
  const pacingRating = exam.pacingMetrics?.pacingRating || (avgPace < targetPace - 5 ? 'Ahead of Pace' : avgPace > targetPace + 4 ? 'Overtime Risk' : 'Optimal Cadence');
  const bufferMinutes = exam.pacingMetrics?.projectedBufferMinutes ?? Math.round((4200 - exam.timeSpentSeconds) / 60);

  const dwellRecords = exam.pacingMetrics?.questionTimeSeconds || {};
  const dwellValues = Object.values(dwellRecords) as number[];
  const lingeringQuestionsCount = dwellValues.filter(sec => sec >= 60).length;
  const rapidQuestionsCount = dwellValues.filter(sec => sec > 0 && sec < 30).length;

  useEffect(() => {
    if (exam.score >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.log('Confetti failed gracefully', err);
      }
    }
  }, [exam.score]);

  const handleToggleShare = () => {
    const nextShared = !isShared;
    setIsShared(nextShared);
    toggleShareExam(exam.id, nextShared, studentNotes);
    if (nextShared) {
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 4000);
    }
  };

  const handleSaveNotes = () => {
    toggleShareExam(exam.id, isShared, studentNotes);
    setShowShareSuccess(true);
    setTimeout(() => setShowShareSuccess(false), 3000);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  // Determine DECA Tier
  let tierTitle = 'Needs Practice';
  let tierBadge = 'bg-rose-100 text-rose-800 border-rose-300';
  let tierDesc = 'Continue studying core instructional areas, specifically business law and financial calculations.';

  if (exam.score >= 90) {
    tierTitle = 'ICDC Qualifier Tier (Top 5%)';
    tierBadge = 'bg-amber-100 text-amber-900 border-amber-400';
    tierDesc = 'Outstanding score! Competitive for International Career Development Conference honors.';
  } else if (exam.score >= 80) {
    tierTitle = 'State Finalist Tier';
    tierBadge = 'bg-blue-100 text-blue-900 border-blue-300';
    tierDesc = 'Strong performance! Well above the standard state written exam qualification threshold.';
  } else if (exam.score >= 70) {
    tierTitle = 'District Benchmark Achieved';
    tierBadge = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    tierDesc = 'Passing competency benchmark reached. Refine weak instructional areas to reach state honors.';
  }

  const filteredQuestions = exam.questions.filter(q => {
    const isCorrect = exam.answers[q.id] === q.correctAnswer;
    if (reviewFilter === 'incorrect') return !isCorrect;
    if (reviewFilter === 'correct') return isCorrect;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Official Written Exam Complete</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Exam Performance Report
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {exam.examTitle} • Completed in {formatTime(exam.timeSpentSeconds)} (70 min max)
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              id="btn-results-dashboard"
              onClick={onGoToDashboard}
              className="flex-1 md:flex-initial px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition"
            >
              Back to Dashboard
            </button>
            <button
              id="btn-results-retake"
              onClick={onRetakeExam}
              className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>New 100-Q Exam</span>
            </button>
          </div>
        </div>

        {/* Score & Tier Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          {/* Main Score Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-md">
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
              Raw DECA Score
            </div>
            <div className="text-5xl sm:text-6xl font-black tracking-tight text-white mb-1">
              {exam.score}
              <span className="text-2xl sm:text-3xl text-slate-400 font-normal">/100</span>
            </div>
            <div className="text-sm font-medium text-emerald-400">
              {exam.percentage}% Correct
            </div>
          </div>

          {/* Performance Tier */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-center">
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">
              Competitive Standing
            </div>
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mb-2 self-start ${tierBadge}`}>
              {tierTitle}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">{tierDesc}</p>
          </div>

          {/* Time & Pacing Velocity */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-around">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-xs text-slate-500 flex items-center space-x-1">
                <Gauge className="w-3.5 h-3.5 text-blue-600" />
                <span>Pacing Velocity:</span>
              </span>
              <div className="text-right">
                <strong className="text-xs font-mono text-slate-900 block">
                  {avgPace}s / question
                </strong>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                    pacingRating === 'Ahead of Pace'
                      ? 'bg-emerald-100 text-emerald-800'
                      : pacingRating === 'Overtime Risk'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {pacingRating}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-xs text-slate-500 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time Spent:</span>
              </span>
              <strong className="text-xs text-slate-800 font-mono">
                {formatTime(exam.timeSpentSeconds)} / 70m
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Accuracy:</span>
              </span>
              <strong className="text-xs text-emerald-700 font-bold">
                {exam.score} / {totalQuestionsCount} ({exam.percentage}%)
              </strong>
            </div>
          </div>
        </div>

        {/* Live Cluster Leaderboard Standing & Dynamic Rank Card */}
        <div className="mt-6 p-6 rounded-3xl bg-gradient-to-br from-amber-50/70 via-slate-50 to-blue-50/40 border-2 border-amber-300/70 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  rankInfo.rank === 1
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-200'
                    : rankInfo.rank === 2
                    ? 'bg-gradient-to-br from-slate-400 to-slate-600 text-white'
                    : rankInfo.rank === 3
                    ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                }`}
              >
                <Trophy className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Live Cluster Rank
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {rankInfo.totalCount} Shared Student Submission{rankInfo.totalCount === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-2.5">
                  <span>Rank: {rankInfo.rankLabel}</span>
                  <span className="text-sm font-bold text-slate-500">
                    (#{rankInfo.rank} of {rankInfo.totalCount})
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {rankInfo.rank === 1 ? (
                    <span className="font-semibold text-amber-900">
                      🥇 Outstanding! You currently hold the <strong>1st Highest</strong> score in the entire cluster!
                    </span>
                  ) : rankInfo.rank === 2 ? (
                    <span className="font-semibold text-slate-800">
                      🥈 Superb standing! You hold the <strong>2nd Highest</strong> score in the cluster — only 1 student scored higher.
                    </span>
                  ) : rankInfo.rank === 3 ? (
                    <span className="font-semibold text-amber-900">
                      🥉 Excellent performance! You hold the <strong>3rd Highest</strong> podium score in the cluster.
                    </span>
                  ) : (
                    <span>
                      You are currently ranked <strong className="text-slate-900 font-black">{rankInfo.rankLabel}</strong> ({rankInfo.higherScoresCount} student{rankInfo.higherScoresCount === 1 ? '' : 's'} scored higher than your {exam.score}/100).
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic real-time update note */}
          <div className="mt-4 pt-3 border-t border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-1.5 text-amber-900">
              <TrendingUp className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>
                <strong>Dynamic live updates:</strong> If other students take this exam and score higher than your {exam.score}/100, your rank will adjust lower automatically.
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono shrink-0">
              Top Score on Test: <strong className="text-slate-900">{rankInfo.topScore}/100</strong>
            </div>
          </div>
        </div>

        {/* Pacing Velocity & Time Cadence Diagnostic */}
        <div className="mt-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  pacingRating === 'Ahead of Pace'
                    ? 'bg-emerald-100 text-emerald-700'
                    : pacingRating === 'Overtime Risk'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Pacing Velocity & Cadence Diagnostic
                </h3>
                <p className="text-xs text-slate-500">
                  DECA Competition Benchmark: 42 seconds / question (70 min for 100 questions)
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                pacingRating === 'Ahead of Pace'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : pacingRating === 'Overtime Risk'
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {pacingRating === 'Ahead of Pace'
                ? `⚡ Ahead of Pace (+${bufferMinutes}m buffer)`
                : pacingRating === 'Overtime Risk'
                ? `⚠️ Overtime Risk (${bufferMinutes}m deficit)`
                : '🎯 Optimal Competition Cadence'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Speedometer stat */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Average Speed
              </span>
              <div className="text-3xl font-black font-mono text-slate-900">
                {avgPace}
                <span className="text-sm font-medium text-slate-500 ml-1">s/Q</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Target: {targetPace}s / question
              </span>
            </div>

            {/* Buffer / Review window */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Review Buffer
              </span>
              <div
                className={`text-3xl font-black font-mono ${
                  bufferMinutes >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {bufferMinutes >= 0 ? `+${bufferMinutes}m` : `${bufferMinutes}m`}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {bufferMinutes >= 0 ? 'Spare time left to review' : 'Time deficit vs 70-min limit'}
              </span>
            </div>

            {/* Lingering Questions */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Lingering Questions (&gt;60s)
              </span>
              <div
                className={`text-3xl font-black font-mono ${
                  lingeringQuestionsCount > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {lingeringQuestionsCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {lingeringQuestionsCount > 0
                  ? 'Questions where you got stuck'
                  : 'Great flow — no severe stalls'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2.5">
            <Timer className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>DECA Strategy Tip:</strong> At ICDC and State, top scorers maintain a steady 35–42s pace so they have 5 to 10 minutes at the end to revisit flagged calculation or legal questions without rushing.
            </p>
          </div>
        </div>

        {/* Share with Cluster Leader Action Card */}
        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Share Performance with Cluster Leader
                </h3>
                {isShared && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Shared with Advisor
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Allows your advisor / cluster leader to see your score, instructional area breakdown, and practice history.
              </p>
            </div>
          </div>

          <button
            id="btn-share-with-leader"
            onClick={handleToggleShare}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2 shrink-0 ${
              isShared
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
            }`}
          >
            {isShared ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Shared with Leader (Click to Unshare)</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share Score with Cluster Leader</span>
              </>
            )}
          </button>
        </div>

        {/* Student reflection note */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>Note to Cluster Leader / Self-Reflection (Optional)</span>
          </div>
          <div className="flex gap-2">
            <input
              id="input-student-notes"
              type="text"
              value={studentNotes}
              onChange={e => setStudentNotes(e.target.value)}
              placeholder="e.g. Need help reviewing UCC contracts and break-even calculations..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              id="btn-save-reflection"
              onClick={handleSaveNotes}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Save Note
            </button>
          </div>
          {showShareSuccess && (
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              ✓ Successfully synced to your Cluster Leader dashboard!
            </p>
          )}
        </div>
      </div>

      {/* Targeted Mastery & Weak Area Re-Test Section */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/60 pb-5 mb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Targeted Retention • Post-Exam Drills</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Target Your Weak Areas
            </h2>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl">
              Don't spend another 70 minutes retaking questions you already know. Retest the exact concepts you missed to turn weak spots into podium points.
            </p>
          </div>

          {onOpenResources && (
            <button
              onClick={onOpenResources}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition self-start sm:self-auto"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Study Resources & Formulas</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Action 1: Retest Missed Questions */}
          {missedQuestions.length > 0 ? (
            <div className="p-5 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between hover:bg-white/15 transition">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center space-x-1.5">
                    <XCircle className="w-4 h-4" />
                    <span>Missed Questions Drill</span>
                  </span>
                  <span className="text-xs font-mono bg-rose-500/20 text-rose-200 px-2.5 py-0.5 rounded-full border border-rose-400/30 font-bold">
                    {missedQuestions.length} Questions Missed
                  </span>
                </div>
                <h3 className="font-black text-white text-base mb-1">
                  Retest Only Missed Questions
                </h3>
                <p className="text-xs text-indigo-200 leading-relaxed mb-4">
                  Take a rapid sprint test containing solely the {missedQuestions.length} questions you missed on this exam to solidify the correct concepts.
                </p>
              </div>

              <button
                id="btn-retest-missed-results"
                onClick={() => onRetestMissed && onRetestMissed(exam)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition shadow-md"
              >
                <span>Launch Missed Questions Drill ({missedQuestions.length} Qs)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center space-x-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Flawless 100/100 Accuracy</span>
                </span>
                <h3 className="font-black text-white text-base mb-1">
                  All Questions Answered Correctly!
                </h3>
                <p className="text-xs text-emerald-200">
                  Incredible performance! You got every single question right on this official simulation.
                </p>
              </div>
            </div>
          )}

          {/* Action 2: Drill Lowest Instructional Area */}
          {lowestArea && (
            <div className="p-5 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between hover:bg-white/15 transition">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Lowest Scoring Area</span>
                  </span>
                  <span className="text-xs font-mono bg-amber-500/20 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400/30 font-bold">
                    {lowestArea.percentage}% Accuracy
                  </span>
                </div>
                <h3 className="font-black text-white text-base mb-1 truncate" title={lowestArea.area}>
                  Drill {lowestArea.area}
                </h3>
                <p className="text-xs text-indigo-200 leading-relaxed mb-4">
                  Target your lowest-scoring competency area with a focused 15-question sprint to boost your score where it counts.
                </p>
              </div>

              <button
                id="btn-drill-weakest-area"
                onClick={() => onRetestWeakArea && onRetestWeakArea(lowestArea.area)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md"
              >
                <span>Drill {lowestArea.area.split(' ')[0]} ({Math.min(15, lowestArea.total)} Qs)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructional Area Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Performance by DECA Instructional Area
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          DECA Entrepreneurship Written Exam breakdown across all tested competency areas
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exam.areaBreakdown.map((ab, idx) => {
            const isHigh = ab.percentage >= 80;
            const isLow = ab.percentage < 65;

            return (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                      {ab.area}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">
                        {ab.correct}/{ab.total}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isHigh
                            ? 'bg-emerald-100 text-emerald-800'
                            : isLow
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ab.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? 'bg-emerald-500' : isLow ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${ab.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-400">
                    {isLow ? '⚠️ Priority focus' : isHigh ? '✓ Mastered' : 'Moderate'}
                  </span>
                  {onRetestWeakArea && (
                    <button
                      onClick={() => onRetestWeakArea(ab.area)}
                      className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
                    >
                      Drill Area →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full 100-Question Review Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Comprehensive Exam Review</h2>
            <p className="text-xs text-slate-500">
              Review all questions, correct answers, and official DECA rationales
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setReviewFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                reviewFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All (100)
            </button>
            <button
              onClick={() => setReviewFilter('incorrect')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                reviewFilter === 'incorrect'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              Incorrect ({100 - exam.score})
            </button>
            <button
              onClick={() => setReviewFilter('correct')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                reviewFilter === 'correct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Correct ({exam.score})
            </button>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {filteredQuestions.map((q, idx) => {
            const studentChoice = exam.answers[q.id];
            const isCorrect = studentChoice === q.correctAnswer;
            const originalIndex = exam.questions.findIndex(item => item.id === q.id) + 1;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border transition ${
                  isCorrect
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                      #{originalIndex}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {q.instructionalArea}
                    </span>
                    {q.year && (
                      <span className="text-[11px] text-slate-400">
                        {q.year} DECA Exam
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                        <span>Correct (+1)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 inline mr-1" />
                        <span>Incorrect (0)</span>
                      </>
                    )}
                  </span>
                </div>

                {q.indicator && (
                  <div className="text-[11px] font-mono text-slate-500 mb-2">
                    Indicator: {q.indicator}
                  </div>
                )}

                <p className="text-sm sm:text-base font-medium text-slate-900 mb-4">
                  {q.question}
                </p>

                {/* 4 Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const isOptionCorrect = optIdx === q.correctAnswer;
                    const isStudentPick = optIdx === studentChoice;
                    const letter = String.fromCharCode(65 + optIdx);

                    let cardStyle = 'border-slate-200 bg-white text-slate-700';
                    if (isOptionCorrect) {
                      cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium ring-1 ring-emerald-500';
                    } else if (isStudentPick && !isOptionCorrect) {
                      cardStyle = 'border-rose-400 bg-rose-50 text-rose-950 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start space-x-2.5 ${cardStyle}`}
                      >
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                            isOptionCorrect
                              ? 'bg-emerald-600 text-white'
                              : isStudentPick
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Official Rationale */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Official DECA Rationale:</span>
                  </div>
                  <p className="leading-relaxed">{q.rationale}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
