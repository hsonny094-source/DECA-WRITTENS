import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileText,
  HelpCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { siftAndOrganizeQuestions, ParsedQuestionDraft } from '../utils/questionParser';
import { InstructionalArea, Question } from '../types';
import { INSTRUCTIONAL_AREAS } from '../data/questionPool';

interface SmartQuestionUploaderProps {
  onAppendQuestions: (questions: Omit<Question, 'id'>[]) => void;
  currentPoolCount: number;
}

export const SmartQuestionUploader: React.FC<SmartQuestionUploaderProps> = ({
  onAppendQuestions,
  currentPoolCount,
}) => {
  const [rawInput, setRawInput] = useState('');
  const [parsedDrafts, setParsedDrafts] = useState<ParsedQuestionDraft[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Re-parse whenever input changes
  const handleInputChange = (text: string) => {
    setRawInput(text);
    setSuccessMsg(null);
    setErrorMsg(null);
    if (!text.trim()) {
      setParsedDrafts([]);
      return;
    }
    const drafts = siftAndOrganizeQuestions(text);
    setParsedDrafts(drafts);
  };

  // Allow manual toggling of correct answer for a draft
  const handleSetCorrectAnswer = (draftId: string, optionIdx: number) => {
    setParsedDrafts(prev =>
      prev.map(d => (d.idTemp === draftId ? { ...d, correctAnswer: optionIdx, isAmbiguousAnswer: false } : d))
    );
  };

  // Allow manual change of instructional area
  const handleSetArea = (draftId: string, area: InstructionalArea) => {
    setParsedDrafts(prev =>
      prev.map(d => (d.idTemp === draftId ? { ...d, instructionalArea: area } : d))
    );
  };

  // Remove a draft before committing
  const handleRemoveDraft = (draftId: string) => {
    setParsedDrafts(prev => prev.filter(d => d.idTemp !== draftId));
  };

  // Insert sample text to demonstrate how easy it is
  const handleInsertSample = () => {
    const sample = `1. Which business ownership structure offers personal liability protection for its members while preventing corporate double taxation?
A. General Partnership
B. Sole Proprietorship
C. Limited Liability Company (LLC)
D. C Corporation
Answer: C
Rationale: An LLC shields owners from personal liability while earnings pass through to personal tax returns, avoiding double taxation.

2. A startup has $60,000 in fixed monthly expenses and a contribution margin ratio of 40%. What is its monthly break-even sales volume?
A. $24,000
B. $84,000
C. $100,000
D. $150,000
Answer: D
Rationale: Break-even Sales = Fixed Costs / Contribution Margin Ratio = $60,000 / 0.40 = $150,000.

3. Under federal guidelines, what primary protection does a patent grant to an entrepreneurial inventor?
A. Permanent trademark protection on corporate logos
B. The exclusive right to exclude others from making, using, or selling the invention for a set period
C. Automatic exemption from state sales and franchise taxes
D. Guaranteed government subsidies for prototype manufacturing
Answer: B
Rationale: Utility patents grant exclusive commercial rights to inventors for up to 20 years.`;
    handleInputChange(sample);
  };

  // Commit and add to bank
  const handleConfirmUpload = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (parsedDrafts.length === 0) {
      setErrorMsg('No valid questions detected. Paste questions text into the box above.');
      return;
    }

    const formatted: Omit<Question, 'id'>[] = parsedDrafts.map(d => ({
      question: d.question,
      options: d.options,
      correctAnswer: d.correctAnswer,
      instructionalArea: d.instructionalArea,
      indicator: d.indicator,
      rationale: d.rationale,
      year: d.year || 2024,
      source: 'Classroom Exam Sifter',
    }));

    onAppendQuestions(formatted);
    setSuccessMsg(`Successfully organized and added ${formatted.length} question${formatted.length === 1 ? '' : 's'} to the question bank!`);
    setRawInput('');
    setParsedDrafts([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Smart Question Sifter & Organizer</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Input Questions in Any Format
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste questions copied from any DECA exam, Word document, PDF, or text file. The code sifts through the text and organizes questions, choices, answers, and instructional areas automatically.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              id="btn-insert-sample-questions"
              onClick={handleInsertSample}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Try Sample Text</span>
            </button>
            {rawInput && (
              <button
                type="button"
                onClick={() => handleInputChange('')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-semibold transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Feedback notices */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="font-semibold">{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="font-semibold">{errorMsg}</div>
          </div>
        )}

        {/* Text Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <label htmlFor="textarea-smart-input">
              Paste or type questions here:
            </label>
            <span className="text-slate-400 font-normal">
              Accepts: 1. Question... A. B. C. D. Answer: X, or JSON / CSV
            </span>
          </div>

          <textarea
            id="textarea-smart-input"
            rows={9}
            value={rawInput}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Paste multiple questions here, for example:

1. What is the break-even point for a business?
A. The point where total revenue equals total costs
B. The point of maximum net profit
C. When inventory equals accounts payable
D. When cash equals total equity
Answer: A
Rationale: Break-even is where total revenue matches total fixed and variable expenses.

2. Which marketing term describes dividing a broad market into distinct subsets?
A. Mass marketing
B. Market segmentation
C. Product differentiation
D. Channel distribution
Answer: B"
            className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-slate-900 leading-relaxed"
          />
        </div>

        {/* Detection Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                parsedDrafts.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <span className="text-xs font-bold text-slate-800">
              {parsedDrafts.length === 0
                ? 'Waiting for questions input...'
                : `✨ Organised ${parsedDrafts.length} Question${parsedDrafts.length === 1 ? '' : 's'} Ready to Add`}
            </span>
            <span className="text-xs text-slate-400">• Current Bank: {currentPoolCount.toLocaleString()} Questions</span>
          </div>

          {parsedDrafts.length > 0 && (
            <button
              id="btn-confirm-smart-add"
              type="button"
              onClick={handleConfirmUpload}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Add {parsedDrafts.length} Question{parsedDrafts.length === 1 ? '' : 's'} to Bank</span>
            </button>
          )}
        </div>

        {/* Live Sifted Preview List */}
        {parsedDrafts.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Organized Question Preview ({parsedDrafts.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Click any option letter (A, B, C, D) to set the correct answer
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {parsedDrafts.map((draft, idx) => (
                <div
                  key={draft.idTemp}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold">
                        Q{idx + 1}
                      </span>
                      <select
                        value={draft.instructionalArea}
                        onChange={e => handleSetArea(draft.idTemp, e.target.value as InstructionalArea)}
                        className="px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-800 focus:outline-none"
                      >
                        {INSTRUCTIONAL_AREAS.map(area => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                      {draft.isAmbiguousAnswer && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-semibold">
                          Verify Correct Answer
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDraft(draft.idTemp)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove question from import"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-slate-900 leading-snug">
                    {draft.question}
                  </p>

                  {/* 4 Choices */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {draft.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === draft.correctAnswer;
                      const letters = ['A', 'B', 'C', 'D'];
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSetCorrectAnswer(draft.idTemp, optIdx)}
                          className={`p-2 rounded-xl border text-left flex items-start space-x-2 transition ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium ring-1 ring-emerald-500'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {letters[optIdx]}
                          </span>
                          <span className="text-[11px] leading-tight">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {draft.rationale && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong className="text-slate-800">Rationale: </strong>
                      <span>{draft.rationale}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
