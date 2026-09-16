import React, { useState } from 'react';
import {
  Gauge,
  Clock,
  AlertTriangle,
  Zap,
  CheckCircle2,
  TrendingUp,
  Info,
  X,
  Activity,
  Timer,
  ChevronDown,
} from 'lucide-react';

interface PacingMeterProps {
  elapsedSeconds: number;
  secondsRemaining: number;
  totalSeconds: number;
  totalQuestions: number;
  currentIndex: number;
  answeredCount: number;
  currentQuestionDwellSeconds: number;
}

export const PacingMeter: React.FC<PacingMeterProps> = ({
  elapsedSeconds,
  secondsRemaining,
  totalSeconds,
  totalQuestions,
  currentIndex,
  answeredCount,
  currentQuestionDwellSeconds,
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Target seconds per question (official DECA written standard: 70 min / 100 Q = 42s)
  const targetSeconds = Math.round(totalSeconds / totalQuestions);

  // Calculate actual velocity based on answered questions or progress
  const sampleCount = Math.max(answeredCount, 1);
  const actualAvgSeconds = elapsedSeconds > 10 ? Math.round(elapsedSeconds / sampleCount) : targetSeconds;

  // Pacing status logic
  const isEarly = elapsedSeconds < 45 && answeredCount <= 1;
  const isAhead = !isEarly && actualAvgSeconds < targetSeconds - 5;
  const isBehind = !isEarly && actualAvgSeconds > targetSeconds + 4;
  const isOnTrack = !isEarly && !isAhead && !isBehind;

  // Projected buffer (positive = extra review minutes at end; negative = risk of running out of time)
  const projectedTotalSeconds = actualAvgSeconds * totalQuestions;
  const projectedBufferMinutes = Math.round((totalSeconds - projectedTotalSeconds) / 60);

  // Lingering alert on active question
  const isLingering = currentQuestionDwellSeconds >= 60;

  // Gauge percentage calculation (30s = 0%, 42s = 50%, 60s = 100%)
  const gaugePercent = Math.min(100, Math.max(0, ((actualAvgSeconds - 25) / (65 - 25)) * 100));

  return (
    <>
      {/* Compact Interactive Header Pill */}
      <button
        type="button"
        id="btn-pacing-velocity-meter"
        onClick={() => setShowDetailsModal(true)}
        title="Click to view full Pacing Velocity Diagnostics"
        className={`group flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-2xs ${
          isBehind
            ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
            : isAhead
            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
            : isEarly
            ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
            : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
        }`}
      >
        <div className="flex items-center space-x-1.5">
          <Gauge
            className={`w-3.5 h-3.5 transition-transform group-hover:rotate-12 ${
              isBehind ? 'text-rose-600' : isAhead ? 'text-emerald-600' : 'text-blue-600'
            }`}
          />
          <span className="font-mono font-bold">
            {isEarly ? `${targetSeconds}s/Q` : `${actualAvgSeconds}s/Q`}
          </span>
        </div>

        <span className="text-slate-300">•</span>

        <div className="flex items-center space-x-1">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
              isBehind
                ? 'bg-rose-200 text-rose-800'
                : isAhead
                ? 'bg-emerald-200 text-emerald-800'
                : isEarly
                ? 'bg-slate-200 text-slate-700'
                : 'bg-blue-200 text-blue-800'
            }`}
          >
            {isEarly
              ? 'Pacing'
              : isBehind
              ? `Deficit ${projectedBufferMinutes}m`
              : isAhead
              ? `+${projectedBufferMinutes}m Buffer`
              : 'On Track'}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition" />
        </div>
      </button>

      {/* Detailed Pacing Telemetry Modal */}
      {showDetailsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isBehind
                      ? 'bg-rose-100 text-rose-700'
                      : isAhead
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Pacing Velocity Telemetry
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official DECA Standard: 70 Minutes for 100 Questions
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-close-pacing-modal"
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Tachometer Velocity Metric */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Current Average Pace
              </div>

              <div className="flex items-baseline justify-center space-x-2">
                <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900 tracking-tight">
                  {actualAvgSeconds}
                </span>
                <span className="text-sm font-semibold text-slate-500">seconds / question</span>
              </div>

              <div className="mt-3 flex items-center justify-center space-x-2">
                <span className="text-xs text-slate-500">Official Benchmark:</span>
                <span className="text-xs font-bold text-slate-800 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  {targetSeconds}s / question
                </span>
              </div>

              {/* Gauge Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                  <div className="w-1/3 bg-emerald-400 h-full" title="Fast (<37s)" />
                  <div className="w-1/3 bg-blue-500 h-full" title="Ideal (38s-46s)" />
                  <div className="w-1/3 bg-rose-400 h-full" title="Slow (>47s)" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Fast (25s)</span>
                  <span className="font-bold text-slate-700">Target (42s)</span>
                  <span>Behind (60s+)</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Question Dwell */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
                  <Timer className="w-3.5 h-3.5 text-blue-500" />
                  <span>Time on Current Q</span>
                </div>
                <div
                  className={`text-xl font-black font-mono ${
                    isLingering ? 'text-amber-600 animate-pulse' : 'text-slate-900'
                  }`}
                >
                  {currentQuestionDwellSeconds}s
                </div>
                <div className="text-[10px] text-slate-500">
                  {isLingering ? 'Lingering (>60s)' : 'Within target range'}
                </div>
              </div>

              {/* Projected Buffer */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Projected Finish Buffer</span>
                </div>
                <div
                  className={`text-xl font-black font-mono ${
                    projectedBufferMinutes >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {projectedBufferMinutes >= 0 ? `+${projectedBufferMinutes} min` : `${projectedBufferMinutes} min`}
                </div>
                <div className="text-[10px] text-slate-500">
                  {projectedBufferMinutes >= 0 ? 'Buffer for review at end' : 'Risk of unfinished questions'}
                </div>
              </div>
            </div>

            {/* Status explanation & DECA competition advice */}
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                isBehind
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : isAhead
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-blue-50/70 border-blue-200 text-blue-950'
              }`}
            >
              <div className="font-bold mb-1 flex items-center space-x-1.5">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  {isBehind
                    ? 'Pacing Recommendation: Speed Up'
                    : isAhead
                    ? 'Pacing Recommendation: Great Cadence'
                    : 'Pacing Recommendation: Right on Schedule'}
                </span>
              </div>
              <p className="text-[11px] opacity-90">
                {isBehind
                  ? 'You are currently averaging over 46 seconds per question. On the real DECA exam, lingering on difficult questions causes competitors to leave easy questions blank at the end. Flag difficult questions, make an educated guess, and return to them during your final review buffer.'
                  : isAhead
                  ? 'You are progressing comfortably ahead of the 42-second benchmark. This gives you extra minutes at the end to open the Review Matrix and double-check your flagged questions.'
                  : 'Your speed matches the optimal 42-second DECA pace. Maintain this rhythm to comfortably answer all 100 questions before the 70-minute mark.'}
              </p>
            </div>

            {/* Footer action */}
            <button
              type="button"
              id="btn-dismiss-pacing-modal"
              onClick={() => setShowDetailsModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
            >
              Return to Exam
            </button>
          </div>
        </div>
      )}
    </>
  );
};
