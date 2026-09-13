import React, { useState, useMemo, useEffect } from 'react';
import { User, CompletedExam, Question, InstructionalArea, CustomTest } from '../types';
import {
  getClusterLeaderStudentSummaries,
  getCompletedExams,
  appendQuestionsToBank,
  saveCustomTest,
  getCustomTests,
  deleteStudent,
} from '../services/storage';
import { getCachedOrGeneratedPool, INSTRUCTIONAL_AREAS } from '../data/questionPool';
import { SmartQuestionUploader } from './SmartQuestionUploader';
import {
  Users,
  Award,
  BookOpen,
  Upload,
  PlusCircle,
  Search,
  CheckCircle2,
  FileText,
  AlertCircle,
  Download,
  Filter,
  Eye,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  X,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';

interface ClusterLeaderDashboardProps {
  currentUser: User;
  onViewExamDetails: (exam: CompletedExam) => void;
  activeView?: 'leader_roster' | 'question_bank' | 'create_tests';
  onTabChange?: (tab: 'leader_roster' | 'question_bank' | 'create_tests') => void;
}

export const ClusterLeaderDashboard: React.FC<ClusterLeaderDashboardProps> = ({
  currentUser,
  onViewExamDetails,
  activeView,
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'bank' | 'create_upload'>('roster');

  useEffect(() => {
    if (activeView === 'leader_roster') setActiveTab('roster');
    else if (activeView === 'question_bank') setActiveTab('bank');
    else if (activeView === 'create_tests') setActiveTab('create_upload');
  }, [activeView]);

  const switchTab = (tab: 'roster' | 'bank' | 'create_upload') => {
    setActiveTab(tab);
    if (tab === 'roster') onTabChange?.('leader_roster');
    else if (tab === 'bank') onTabChange?.('question_bank');
    else if (tab === 'create_upload') onTabChange?.('create_tests');
  };

  // Roster state
  const [studentSummaries, setStudentSummaries] = useState(getClusterLeaderStudentSummaries());
  const [selectedStudentExams, setSelectedStudentExams] = useState<{ studentName: string; exams: CompletedExam[] } | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [rosterNotification, setRosterNotification] = useState<string | null>(null);

  // Question bank state
  const [questionPool, setQuestionPool] = useState<Question[]>(() => getCachedOrGeneratedPool());
  const [bankSearch, setBankSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Upload state
  const [uploadText, setUploadText] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);

  // Single question form
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptA, setNewOptA] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newOptC, setNewOptC] = useState('');
  const [newOptD, setNewOptD] = useState('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState(0);
  const [newArea, setNewArea] = useState<InstructionalArea>('Entrepreneurship Concepts (EN)');
  const [newIndicator, setNewIndicator] = useState('EN:114 - Explain venture planning tools');
  const [newRationale, setNewRationale] = useState('');

  // Custom Test Creation
  const [customTestTitle, setCustomTestTitle] = useState('');
  const [customTestDescription, setCustomTestDescription] = useState('');
  const [customTimeLimit, setCustomTimeLimit] = useState(70);
  const [customQuestionCount, setCustomQuestionCount] = useState(100);
  const [customTestsList, setCustomTestsList] = useState<CustomTest[]>(getCustomTests());
  const [testCreatedMsg, setTestCreatedMsg] = useState<string | null>(null);

  const refreshRoster = () => {
    setStudentSummaries(getClusterLeaderStudentSummaries());
  };

  const handleConfirmDeleteStudent = () => {
    if (!studentToDelete) return;
    const studentName = studentToDelete.name;
    const ok = deleteStudent(studentToDelete.id);
    if (ok) {
      refreshRoster();
      setRosterNotification(`Removed "${studentName}" and their test records from the cluster roster.`);
      setTimeout(() => setRosterNotification(null), 4000);
    }
    setStudentToDelete(null);
  };

  // Filter question pool
  const filteredQuestions = useMemo(() => {
    return questionPool.filter(q => {
      const matchSearch =
        bankSearch.trim() === '' ||
        q.question.toLowerCase().includes(bankSearch.toLowerCase()) ||
        q.rationale.toLowerCase().includes(bankSearch.toLowerCase()) ||
        q.indicator.toLowerCase().includes(bankSearch.toLowerCase());

      const matchArea = selectedArea === 'all' || q.instructionalArea === selectedArea;
      const matchYear = selectedYear === 'all' || (q.year && q.year.toString() === selectedYear);

      return matchSearch && matchArea && matchYear;
    });
  }, [questionPool, bankSearch, selectedArea, selectedYear]);

  const totalPages = Math.ceil(filteredQuestions.length / pageSize);
  const paginatedQuestions = filteredQuestions.slice((page - 1) * pageSize, page * pageSize);

  // Handle single question add
  const handleAddSingleQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !newOptA.trim() || !newOptB.trim() || !newOptC.trim() || !newOptD.trim()) {
      setUploadErrorMsg('Please fill out the question text and all four options.');
      return;
    }

    const questionToAdd: Omit<Question, 'id'> = {
      question: newQuestionText.trim(),
      options: [newOptA.trim(), newOptB.trim(), newOptC.trim(), newOptD.trim()],
      correctAnswer: newCorrectAnswer,
      instructionalArea: newArea,
      indicator: newIndicator.trim(),
      rationale: newRationale.trim() || 'Official DECA criteria correct answer.',
      year: 2024,
      source: 'Cluster Leader Custom Addition',
    };

    const res = appendQuestionsToBank([questionToAdd]);
    setQuestionPool(getCachedOrGeneratedPool());
    setUploadSuccessMsg(`Added custom question successfully! Question pool updated to ${res.total} questions.`);
    setUploadErrorMsg(null);

    // Reset form
    setNewQuestionText('');
    setNewOptA('');
    setNewOptB('');
    setNewOptC('');
    setNewOptD('');
    setNewRationale('');
  };

  const handleSmartAppend = (newQuestions: Omit<Question, 'id'>[]) => {
    appendQuestionsToBank(newQuestions);
    setQuestionPool(getCachedOrGeneratedPool());
  };

  // Handle bulk JSON / CSV upload
  const handleBulkUpload = () => {
    setUploadErrorMsg(null);
    setUploadSuccessMsg(null);

    if (!uploadText.trim()) {
      setUploadErrorMsg('Please paste JSON or CSV text to upload.');
      return;
    }

    try {
      // First attempt JSON parse
      if (uploadText.trim().startsWith('[') || uploadText.trim().startsWith('{')) {
        const parsed = JSON.parse(uploadText);
        const list = Array.isArray(parsed) ? parsed : [parsed];

        const validQuestions: Omit<Question, 'id'>[] = list.map((item, idx) => {
          if (!item.question || !Array.isArray(item.options) || item.options.length !== 4) {
            throw new Error(`Item ${idx + 1} is missing required fields (question, 4 options).`);
          }
          return {
            question: String(item.question),
            options: [item.options[0], item.options[1], item.options[2], item.options[3]],
            correctAnswer: Number(item.correctAnswer ?? 0),
            instructionalArea: item.instructionalArea || 'Entrepreneurship Concepts (EN)',
            indicator: item.indicator || 'EN:001 - Entrepreneurship Performance Indicator',
            rationale: item.rationale || 'Correct DECA answer.',
            year: item.year || 2024,
            source: item.source || 'Uploaded Test by Cluster Leader',
          };
        });

        const res = appendQuestionsToBank(validQuestions);
        setQuestionPool(getCachedOrGeneratedPool());
        setUploadSuccessMsg(`Successfully imported ${validQuestions.length} questions into the pool! Total pool is now ${res.total} questions.`);
        setUploadText('');
        return;
      }

      // If CSV format (comma or tab separated)
      const lines = uploadText.trim().split('\n');
      const validQuestions: Omit<Question, 'id'>[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && line.toLowerCase().includes('question'))) continue; // skip header
        const parts = line.split('\t').length >= 6 ? line.split('\t') : line.split(',');
        if (parts.length >= 6) {
          validQuestions.push({
            question: parts[0].replace(/^"|"$/g, '').trim(),
            options: [
              parts[1].replace(/^"|"$/g, '').trim(),
              parts[2].replace(/^"|"$/g, '').trim(),
              parts[3].replace(/^"|"$/g, '').trim(),
              parts[4].replace(/^"|"$/g, '').trim(),
            ],
            correctAnswer: Math.max(0, Math.min(3, parseInt(parts[5].trim()) || 0)),
            instructionalArea: (parts[6]?.replace(/^"|"$/g, '').trim() as InstructionalArea) || 'Entrepreneurship Concepts (EN)',
            indicator: parts[7]?.replace(/^"|"$/g, '').trim() || 'EN:114',
            rationale: parts[8]?.replace(/^"|"$/g, '').trim() || 'Standard rationale.',
            year: 2024,
            source: 'CSV Upload by Cluster Leader',
          });
        }
      }

      if (validQuestions.length === 0) {
        throw new Error('Could not parse valid questions. Please check the template format.');
      }

      const res = appendQuestionsToBank(validQuestions);
      setQuestionPool(getCachedOrGeneratedPool());
      setUploadSuccessMsg(`Successfully imported ${validQuestions.length} CSV questions! Total pool: ${res.total} questions.`);
      setUploadText('');
    } catch (err: any) {
      setUploadErrorMsg(`Upload failed: ${err.message}`);
    }
  };

  const handleCreateCustomTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTestTitle.trim()) {
      setUploadErrorMsg('Please provide a test title.');
      return;
    }

    const pool = getCachedOrGeneratedPool();
    // Pick random questions from pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selectedIds = shuffled.slice(0, customQuestionCount).map(q => q.id);

    const newTest: CustomTest = {
      id: `test_${Date.now()}`,
      title: customTestTitle.trim(),
      description: customTestDescription.trim() || 'Custom written exam assignment by Cluster Leader.',
      createdByLeaderId: currentUser.id,
      createdByName: currentUser.name,
      createdAt: Date.now(),
      timeLimitMinutes: customTimeLimit,
      questionIds: selectedIds,
      assignedToAll: true,
    };

    saveCustomTest(newTest);
    setCustomTestsList(getCustomTests());
    setTestCreatedMsg(`Created "${newTest.title}" with ${newTest.questionIds.length} questions and a ${newTest.timeLimitMinutes}-minute timer.`);
    setCustomTestTitle('');
    setCustomTestDescription('');
    setTimeout(() => setTestCreatedMsg(null), 5000);
  };

  // Download sample JSON template
  const downloadSampleTemplate = () => {
    const sample = [
      {
        question: "Under the Fair Labor Standards Act (FLSA), which provision applies to young workers in entrepreneurial ventures?",
        options: [
          "Restrictions on hazardous work and maximum allowable hours during school weeks",
          "Mandatory ownership of 1% equity stock upon hiring",
          "Immunity from state income tax withholding",
          "Double pay for all shifts exceeding four hours"
        ],
        correctAnswer: 0,
        instructionalArea: "Business Law (BL)",
        indicator: "BL:135 - Comply with federal wage and child labor regulations",
        rationale: "The FLSA protects youth workers by limiting work hours and barring hazardous jobs.",
        year: 2024
      }
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deca_entrepreneurship_test_template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cluster stats
  const totalStudents = studentSummaries.length;
  const totalSharedExams = studentSummaries.reduce((acc, s) => acc + s.totalExams, 0);
  const clusterAverage =
    studentSummaries.filter(s => s.totalExams > 0).length > 0
      ? Math.round(
          studentSummaries.filter(s => s.totalExams > 0).reduce((acc, s) => acc + s.averageScore, 0) /
            studentSummaries.filter(s => s.totalExams > 0).length
        )
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Advisor Header */}
      <div className="bg-slate-900 rounded-3xl text-white p-6 sm:p-8 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>DECA Chapter Advisor & Cluster Leader Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Cluster Leader Administration
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Manage your DECA Entrepreneurship student roster, inspect shared student performance scores, explore the {questionPool.length.toLocaleString()}-question pool, and upload or publish custom written exams.
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex flex-wrap gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
          <button
            type="button"
            id="tab-btn-roster"
            onClick={() => {
              switchTab('roster');
              refreshRoster();
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'roster' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students & Scores</span>
          </button>

          <button
            type="button"
            id="tab-btn-bank"
            onClick={() => switchTab('bank')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'bank' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{questionPool.length.toLocaleString()}-Question Bank</span>
          </button>

          <button
            type="button"
            id="tab-btn-upload"
            onClick={() => switchTab('create_upload')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'create_upload' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Sift & Upload Questions</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ROSTER & SHARED STUDENT SCORES */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Cluster Students</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{totalStudents}</div>
              <div className="text-xs text-slate-500 mt-1">Enrolled DECA competitors</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Shared 100-Q Exams</span>
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{totalSharedExams}</div>
              <div className="text-xs text-slate-500 mt-1">Submitted for leader review</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Cluster Average</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {clusterAverage}
                <span className="text-sm font-normal text-slate-400">/100</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Across all shared practice exams</div>
            </div>
          </div>

          {/* Notification banner */}
          {rosterNotification && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{rosterNotification}</span>
              </div>
              <button onClick={() => setRosterNotification(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Student Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Student Performance Roster</h2>
                <p className="text-xs text-slate-500">
                  Scores shared directly by students from their 100-question Entrepreneurship exam simulations
                </p>
              </div>
              <button
                onClick={refreshRoster}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh Scores
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 font-semibold">
                    <th className="py-3.5 px-6">Student Name</th>
                    <th className="py-3.5 px-6">Shared Exams</th>
                    <th className="py-3.5 px-6">Average Score</th>
                    <th className="py-3.5 px-6">High Score</th>
                    <th className="py-3.5 px-6">Identified Weak Area</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {studentSummaries.map(s => {
                    const hasExams = s.totalExams > 0;
                    return (
                      <tr key={s.student.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{s.student.name}</div>
                          <div className="text-xs text-slate-500">@{s.student.username}</div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-semibold text-slate-800">{s.totalExams}</span>
                          <span className="text-xs text-slate-500 ml-1">tests</span>
                        </td>

                        <td className="py-4 px-6">
                          {hasExams ? (
                            <span
                              className={`font-black ${
                                s.averageScore >= 80
                                  ? 'text-emerald-600'
                                  : s.averageScore >= 70
                                  ? 'text-blue-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              {s.averageScore}/100
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">No exams yet</span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {hasExams ? (
                            <span className="font-bold text-slate-900">{s.highestScore}/100</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {s.weakestArea ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              {s.weakestArea}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Not enough data</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              disabled={!hasExams}
                              onClick={() =>
                                setSelectedStudentExams({
                                  studentName: s.student.name,
                                  exams: s.sharedExams,
                                })
                              }
                              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                hasExams
                                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                  : 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                              }`}
                            >
                              <span>View Tests ({s.totalExams})</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              id={`btn-delete-student-${s.student.id}`}
                              title={`Remove ${s.student.name} from roster`}
                              onClick={() => setStudentToDelete({ id: s.student.id, name: s.student.name })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Shared Exams Modal */}
          {selectedStudentExams && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {selectedStudentExams.studentName} — Shared Exam Submissions
                    </h3>
                    <p className="text-xs text-slate-500">
                      Detailed written exam scores and instructional area performance breakdown
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStudentExams(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                  {selectedStudentExams.exams.map(exam => (
                    <div
                      key={exam.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{exam.examTitle}</div>
                        <div className="text-xs text-slate-500">
                          Completed:{' '}
                          {new Date(exam.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          • Time: {Math.round(exam.timeSpentSeconds / 60)} min
                        </div>
                        {exam.studentNotes && (
                          <div className="text-xs text-slate-700 italic bg-white p-2 rounded border border-slate-200">
                            Student Note: "{exam.studentNotes}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xl font-black text-blue-600">
                            {exam.score}/100
                          </div>
                          <div className="text-[11px] text-slate-500">{exam.percentage}% accuracy</div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedStudentExams(null);
                            onViewExamDetails(exam);
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Exam</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Delete Student Confirmation Modal */}
          {studentToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200 space-y-4">
                <div className="flex items-center space-x-3 text-rose-600">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Remove Student</h3>
                    <p className="text-xs text-slate-500">Confirm cluster roster modification</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to remove <strong className="text-slate-900">{studentToDelete.name}</strong> from your cluster roster? This will delete their student account and any test scores they have submitted.
                </p>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStudentToDelete(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-delete-student"
                    onClick={handleConfirmDeleteStudent}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Remove Student</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 1,000-QUESTION BANK EXPLORER */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    DECA Entrepreneurship Question Pool
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {questionPool.length} Total Questions
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Curated pool of authentic DECA Entrepreneurship questions spanning 10 years of exams (2015–2024)
                </p>
              </div>

              {/* Keyword Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="search-question-bank"
                  type="text"
                  value={bankSearch}
                  onChange={e => {
                    setBankSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search questions, concepts, terms..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter selectors */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-600">Instructional Area:</span>
                <select
                  id="select-filter-area"
                  value={selectedArea}
                  onChange={e => {
                    setSelectedArea(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All 12 Instructional Areas</option>
                  {INSTRUCTIONAL_AREAS.map(area => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-600">Exam Year:</span>
                <select
                  id="select-filter-year"
                  value={selectedYear}
                  onChange={e => {
                    setSelectedYear(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All 10 Years (2015-2024)</option>
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map(y => (
                    <option key={y} value={y.toString()}>
                      {y} Exam Series
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-slate-500 self-center ml-auto">
                Showing {filteredQuestions.length} matches
              </span>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {paginatedQuestions.map(q => (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                      #{q.id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {q.instructionalArea}
                    </span>
                    {q.year && (
                      <span className="text-xs text-slate-500">{q.year} Exam</span>
                    )}
                  </div>
                  {q.indicator && (
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      {q.indicator}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-slate-900 leading-relaxed">
                  {q.question}
                </p>

                {/* 4 Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.correctAnswer;
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border flex items-start space-x-2 ${
                          isCorrect
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-950 font-medium'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
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

                {/* Rationale */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <strong className="text-slate-900">Official Rationale: </strong>
                  {q.rationale}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold disabled:opacity-40"
              >
                Previous Page
              </button>
              <span className="text-xs text-slate-600 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold disabled:opacity-40"
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREATE & UPLOAD TESTS */}
      {activeTab === 'create_upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Col: Upload Tests & Custom Assignment */}
          <div className="space-y-8">
            {/* Smart Question Sifter & Organizer */}
            <SmartQuestionUploader
              onAppendQuestions={handleSmartAppend}
              currentPoolCount={questionPool.length}
            />

            {/* Create Custom Test Assignment */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Create Custom Test Assignment
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Publish a designated test assignment for students with a custom timer and question count
              </p>

              {testCreatedMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{testCreatedMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateCustomTest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exam Assignment Title
                  </label>
                  <input
                    id="input-custom-title"
                    type="text"
                    required
                    value={customTestTitle}
                    onChange={e => setCustomTestTitle(e.target.value)}
                    placeholder="e.g. Official DECA State Qualifier Mock Exam #1"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instructions / Description
                  </label>
                  <input
                    id="input-custom-desc"
                    type="text"
                    value={customTestDescription}
                    onChange={e => setCustomTestDescription(e.target.value)}
                    placeholder="e.g. Please complete by Friday before our cluster review meeting."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Time Limit (Minutes)
                    </label>
                    <input
                      id="input-custom-time"
                      type="number"
                      min={10}
                      max={180}
                      value={customTimeLimit}
                      onChange={e => setCustomTimeLimit(parseInt(e.target.value) || 70)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Number of Questions
                    </label>
                    <select
                      id="select-custom-q-count"
                      value={customQuestionCount}
                      onChange={e => setCustomQuestionCount(parseInt(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={100}>100 Questions (Standard DECA)</option>
                      <option value={50}>50 Questions (Mid-term Check)</option>
                      <option value={25}>25 Questions (Sprint Quiz)</option>
                    </select>
                  </div>
                </div>

                <button
                  id="btn-publish-test"
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                >
                  Publish Custom Test Assignment
                </button>
              </form>
            </div>
          </div>

          {/* Right Col: Single Question Builder */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Add Individual Question
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Write a scenario-based question to add directly to the question bank
            </p>

            <form onSubmit={handleAddSingleQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  DECA Instructional Area
                </label>
                <select
                  id="select-new-q-area"
                  value={newArea}
                  onChange={e => setNewArea(e.target.value as InstructionalArea)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {INSTRUCTIONAL_AREAS.map(area => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Performance Indicator / Standard
                </label>
                <input
                  id="input-new-q-indicator"
                  type="text"
                  value={newIndicator}
                  onChange={e => setNewIndicator(e.target.value)}
                  placeholder="e.g. FI:092 - Calculate break-even point"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Scenario Text
                </label>
                <textarea
                  id="input-new-q-text"
                  rows={3}
                  required
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                  placeholder="Enter the scenario question prompt..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 4 Choices */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Four Answer Choices (Select Correct Choice Below)
                </label>

                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    A
                  </span>
                  <input
                    id="input-opt-a"
                    type="text"
                    required
                    value={newOptA}
                    onChange={e => setNewOptA(e.target.value)}
                    placeholder="Option A"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    B
                  </span>
                  <input
                    id="input-opt-b"
                    type="text"
                    required
                    value={newOptB}
                    onChange={e => setNewOptB(e.target.value)}
                    placeholder="Option B"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    C
                  </span>
                  <input
                    id="input-opt-c"
                    type="text"
                    required
                    value={newOptC}
                    onChange={e => setNewOptC(e.target.value)}
                    placeholder="Option C"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    D
                  </span>
                  <input
                    id="input-opt-d"
                    type="text"
                    required
                    value={newOptD}
                    onChange={e => setNewOptD(e.target.value)}
                    placeholder="Option D"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Correct choice picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designate Correct Answer Choice:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['A', 'B', 'C', 'D'].map((letter, idx) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setNewCorrectAnswer(idx)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                        newCorrectAnswer === idx
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {letter} is Correct
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Explanation & Rationale
                </label>
                <textarea
                  id="input-new-q-rationale"
                  rows={3}
                  value={newRationale}
                  onChange={e => setNewRationale(e.target.value)}
                  placeholder="Explain why the correct answer is right and why other options are incorrect..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                id="btn-add-single-q"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center justify-center space-x-2 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Save Question to Bank</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
