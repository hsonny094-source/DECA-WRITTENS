import React, { useState } from 'react';
import { User, CompletedExam } from '../types';
import { getCompletedExams, toggleShareExam, shareAllExamsForStudent } from '../services/storage';
import {
  Trophy,
  Award,
  Clock,
  CheckCircle2,
  Share2,
  BookOpen,
  Eye,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
  onStartExam: () => void;
  onViewExamDetails: (exam: CompletedExam) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onStartExam,
  onViewExamDetails,
}) => {
  const [exams, setExams] = useState<CompletedExam[]>(() => {
    return getCompletedExams().filter(e => e.studentId === currentUser.id);
  });
  const [notification, setNotification] = useState<string | null>(null);

  const refreshExams = () => {
    setExams(getCompletedExams().filter(e => e.studentId === currentUser.id));
  };

  const handleToggleShare = (examId: string, currentStatus: boolean) => {
    toggleShareExam(examId, !currentStatus);
    refreshExams();
    showNotification(!currentStatus ? 'Exam shared with Cluster Leader!' : 'Exam unshared.');
  };

  const handleShareAll = () => {
    shareAllExamsForStudent(currentUser.id);
    refreshExams();
    showNotification('All your completed exams are now shared with your Cluster Leader!');
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Metrics
  const totalExams = exams.length;
  const scores = exams.map(e => e.score);
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const totalSeconds = exams.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  // Aggregated Area Breakdown
  const aggregatedAreas: Record<string, { correct: number; total: number }> = {};
  exams.forEach(exam => {
    exam.areaBreakdown.forEach(ab => {
      if (!aggregatedAreas[ab.area]) {
        aggregatedAreas[ab.area] = { correct: 0, total: 0 };
      }
      aggregatedAreas[ab.area].correct += ab.correct;
      aggregatedAreas[ab.area].total += ab.total;
    });
  });

  const areaList = Object.entries(aggregatedAreas)
    .map(([area, stat]) => ({
      area,
      correct: stat.correct,
      total: stat.total,
      percentage: Math.round((stat.correct / stat.total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>DECA Written Exam Candidate Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {currentUser.name}!
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Practice with the DECA Entrepreneurship exam pool, track performance metrics across all 12 instructional areas, and share your verified scores with your Cluster Leader.
          </p>
        </div>

        <button
          id="btn-start-exam-banner"
          onClick={onStartExam}
          className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-md flex items-center space-x-2 shrink-0"
        >
          <BookOpen className="w-5 h-5" />
          <span>Take 100-Question Exam (70 min)</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Exams Completed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Exams Taken</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalExams}</div>
          <div className="text-xs text-slate-500 mt-1">100-question attempts</div>
        </div>

        {/* Highest Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High Score</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">
            {highestScore}
            <span className="text-sm font-normal text-slate-400">/100</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {highestScore >= 85 ? 'ICDC Competitive Tier' : 'Best attempt score'}
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {averageScore}
            <span className="text-sm font-normal text-slate-400">/100</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalExams > 0 ? `${averageScore}% overall accuracy` : 'Take your first test'}
          </div>
        </div>

        {/* Practice Time */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Practice</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalHours}h</div>
          <div className="text-xs text-slate-500 mt-1">Timed simulation hours</div>
        </div>
      </div>

      {/* Main 2-Column: Performance Breakdown & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Exam History */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Completed Exam History</h2>
              <p className="text-xs text-slate-500">
                Track your progress, review past test answers, and manage scores shared with your cluster leader
              </p>
            </div>

            {totalExams > 0 && (
              <button
                id="btn-share-all-scores"
                onClick={handleShareAll}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share All with Leader</span>
              </button>
            )}
          </div>

          {exams.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base mb-1">No Completed Exams Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                Ready to prepare for DECA? Start a 70-minute, 100-question randomized simulation from our question pool.
              </p>
              <button
                onClick={onStartExam}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-xs"
              >
                Start Your First Exam
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map(exam => {
                const isPassing = exam.score >= 70;
                const isHigh = exam.score >= 85;

                return (
                  <div
                    key={exam.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {exam.examTitle}
                        </span>
                        {exam.sharedWithLeader ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
                            <span>Shared with Leader</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            Private
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span>{formatDate(exam.completedAt)}</span>
                        <span>•</span>
                        <span>Time: {Math.round(exam.timeSpentSeconds / 60)} min</span>
                        <span>•</span>
                        <span>{exam.totalQuestions} Questions</span>
                      </div>

                      {exam.studentNotes && (
                        <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200 max-w-md">
                          "{exam.studentNotes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 shrink-0 justify-between sm:justify-end">
                      {/* Score Box */}
                      <div className="text-right">
                        <div
                          className={`text-2xl font-black ${
                            isHigh
                              ? 'text-amber-600'
                              : isPassing
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {exam.score}
                          <span className="text-xs text-slate-400 font-normal">/100</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {exam.percentage}% accuracy
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleShare(exam.id, exam.sharedWithLeader)}
                          title={exam.sharedWithLeader ? 'Unshare with Cluster Leader' : 'Share with Cluster Leader'}
                          className={`p-2 rounded-lg border text-xs font-semibold transition ${
                            exam.sharedWithLeader
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onViewExamDetails(exam)}
                          className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Aggregate Instructional Area Mastery */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Instructional Area Mastery
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Aggregated across all completed 100-question practice tests
            </p>

            {areaList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Complete an exam to see your breakdown across Business Law, Financial Analysis, Marketing, Economics, etc.
              </p>
            ) : (
              <div className="space-y-4">
                {areaList.map((item, idx) => {
                  const isHigh = item.percentage >= 80;
                  const isLow = item.percentage < 65;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                          {item.area}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {item.correct}/{item.total}
                          </span>
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                              isHigh
                                ? 'bg-emerald-100 text-emerald-800'
                                : isLow
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.percentage}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHigh ? 'bg-emerald-500' : isLow ? 'bg-rose-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
            <h4 className="text-xs font-bold text-blue-950 mb-1 flex items-center space-x-1">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Study Tip for DECA Competitors</span>
            </h4>
            <p className="text-xs text-blue-900/80 leading-relaxed">
              Financial Analysis and Business Law typically represent over 35% of the DECA Entrepreneurship exam. Aim for 85%+ in both areas to guarantee competitive conference standing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
