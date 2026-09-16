import React, { useState, useMemo } from 'react';
import { User, DecaResource, ResourceCategory } from '../types';
import { getResources, saveResource, deleteResource } from '../services/storage';
import {
  BookOpen,
  Search,
  Plus,
  ExternalLink,
  FileText,
  Pin,
  Tag,
  Trash2,
  Edit2,
  X,
  Check,
  Copy,
  Lightbulb,
  Calculator,
  Compass,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ResourcesViewProps {
  currentUser: User | null;
  onOpenAuthModal?: () => void;
  onStartPracticeExam?: () => void;
}

const CATEGORY_META: Record<
  ResourceCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  exam_blueprint: {
    label: 'Exam Blueprint',
    icon: Compass,
    color: 'bg-purple-100 text-purple-900 border-purple-200',
  },
  formula_sheet: {
    label: 'Formula Sheet',
    icon: Calculator,
    color: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
  vocab_quizlet: {
    label: 'Vocab & Terms',
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-900 border-blue-200',
  },
  tips_strategy: {
    label: 'Tips & Strategy',
    icon: Lightbulb,
    color: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  study_guide: {
    label: 'Study Guide',
    icon: FileText,
    color: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  },
  official_deca: {
    label: 'Official DECA',
    icon: Award,
    color: 'bg-rose-100 text-rose-900 border-rose-200',
  },
  other: {
    label: 'General',
    icon: Layers,
    color: 'bg-slate-100 text-slate-900 border-slate-200',
  },
};

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  currentUser,
  onOpenAuthModal,
  onStartPracticeExam,
}) => {
  const [resources, setResources] = useState<DecaResource[]>(() => getResources());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeReadingResource, setActiveReadingResource] = useState<DecaResource | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<DecaResource | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<ResourceCategory>('study_guide');
  const [formUrl, setFormUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);

  const isLeader = currentUser?.role === 'cluster_leader';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingResource(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('study_guide');
    setFormUrl('');
    setFormNotes('');
    setFormTags('Entrepreneurship, Exam Prep');
    setFormIsPinned(false);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (res: DecaResource) => {
    setEditingResource(res);
    setFormTitle(res.title);
    setFormDescription(res.description);
    setFormCategory(res.category);
    setFormUrl(res.url || '');
    setFormNotes(res.notes || '');
    setFormTags(res.tags.join(', '));
    setFormIsPinned(!!res.isPinned);
    setIsFormModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Please provide at least a Title and Description.');
      return;
    }

    const tagList = formTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const resourceData: DecaResource = {
      id: editingResource ? editingResource.id : `res_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      url: formUrl.trim() || undefined,
      notes: formNotes.trim() || undefined,
      tags: tagList.length > 0 ? tagList : ['DECA'],
      authorName: currentUser ? currentUser.name : 'Chapter Advisor',
      authorId: currentUser ? currentUser.id : 'advisor_guest',
      createdAt: editingResource ? editingResource.createdAt : Date.now(),
      isPinned: formIsPinned,
    };

    saveResource(resourceData);
    setResources(getResources());
    setIsFormModalOpen(false);
    showToast(editingResource ? 'Resource updated successfully!' : 'Resource added to chapter hub!');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this resource?')) {
      deleteResource(id);
      setResources(getResources());
      if (activeReadingResource?.id === id) {
        setActiveReadingResource(null);
      }
      showToast('Resource removed.');
    }
  };

  const handleCopyNotes = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered and sorted resources (pinned first, then date)
  const filteredResources = useMemo(() => {
    return resources
      .filter(res => {
        if (selectedCategory !== 'all' && res.category !== selectedCategory) {
          return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          res.title.toLowerCase().includes(q) ||
          res.description.toLowerCase().includes(q) ||
          res.tags.some(t => t.toLowerCase().includes(q)) ||
          (res.notes && res.notes.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [resources, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: resources.length };
    resources.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [resources]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Chapter Study Library</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              DECA Study Resources & Reference Hub
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Official exam blueprints, essential business math formulas, contracts vocabulary, and high-scoring test strategies to master written exams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-add-resource"
              onClick={handleOpenAdd}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>

            {onStartPracticeExam && (
              <button
                id="btn-resources-practice"
                onClick={onStartPracticeExam}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Take Practice Exam</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total Resources</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{resources.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[11px] font-bold text-emerald-700 uppercase">Formulas & Math</div>
            <div className="text-xl font-black text-emerald-900 mt-0.5">
              {categoryCounts['formula_sheet'] || 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
            <div className="text-[11px] font-bold text-purple-700 uppercase">Blueprints & PI</div>
            <div className="text-xl font-black text-purple-900 mt-0.5">
              {categoryCounts['exam_blueprint'] || 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-[11px] font-bold text-blue-700 uppercase">Vocab & Terms</div>
            <div className="text-xl font-black text-blue-900 mt-0.5">
              {categoryCounts['vocab_quizlet'] || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-resources"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search formulas, law terms, blueprints, or tags..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick status counter */}
          <div className="text-xs text-slate-500 font-medium self-center">
            Showing <strong className="text-slate-800">{filteredResources.length}</strong> of{' '}
            {resources.length} resources
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Resources ({categoryCounts['all'] || 0})
          </button>

          {(
            [
              'exam_blueprint',
              'formula_sheet',
              'vocab_quizlet',
              'tips_strategy',
              'study_guide',
              'official_deca',
            ] as ResourceCategory[]
          ).map(catKey => {
            const meta = CATEGORY_META[catKey];
            const Icon = meta.icon;
            const count = categoryCounts[catKey] || 0;
            const isSelected = selectedCategory === catKey;

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{meta.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-300">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">No Resources Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {searchQuery
              ? `No resources matched "${searchQuery}". Try clearing your search filter.`
              : 'No resources have been added in this category yet.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              Add First Resource
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredResources.map(res => {
            const meta = CATEGORY_META[res.category] || CATEGORY_META.other;
            const Icon = meta.icon;
            const canManage = isLeader || (currentUser && res.authorId === currentUser.id);

            return (
              <div
                key={res.id}
                className={`bg-white rounded-3xl border transition flex flex-col justify-between p-6 sm:p-7 ${
                  res.isPinned
                    ? 'border-amber-300/80 shadow-xs bg-gradient-to-b from-amber-50/20 to-white'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div>
                  {/* Top Bar: Category Pill & Pin */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${meta.color}`}
                    >
                      <Icon className="w-3 h-3 inline mr-0.5 shrink-0" />
                      <span>{meta.label}</span>
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {res.isPinned && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                          <Pin className="w-3 h-3 text-amber-700" />
                          <span>Pinned</span>
                        </span>
                      )}

                      {canManage && (
                        <div className="flex items-center space-x-1 ml-1">
                          <button
                            onClick={() => handleOpenEdit(res)}
                            title="Edit Resource"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(res.id)}
                            title="Delete Resource"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight mb-2">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {res.description}
                  </p>

                  {/* Tags */}
                  {res.tags && res.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {res.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 flex items-center space-x-1"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400 mr-0.5" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions & Metadata */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    <span>By {res.authorName}</span>
                    <span className="mx-1.5">•</span>
                    <span>{new Date(res.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {res.notes && (
                      <button
                        onClick={() => setActiveReadingResource(res)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Read Cheat Sheet</span>
                      </button>
                    )}

                    {res.url && (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center space-x-1.5 transition"
                      >
                        <span>Open Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reader Modal (For Study Notes & Formulas Cheat Sheets) */}
      {activeReadingResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      CATEGORY_META[activeReadingResource.category]?.color
                    }`}
                  >
                    {CATEGORY_META[activeReadingResource.category]?.label}
                  </span>
                  {activeReadingResource.isPinned && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      Pinned Resource
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {activeReadingResource.title}
                </h2>
                <p className="text-xs text-slate-500">{activeReadingResource.description}</p>
              </div>

              <button
                onClick={() => setActiveReadingResource(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Study Notes */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1 font-sans text-sm text-slate-800 leading-relaxed">
              {activeReadingResource.notes ? (
                <div className="whitespace-pre-wrap font-sans bg-slate-50/60 p-5 rounded-2xl border border-slate-200 text-xs sm:text-sm leading-relaxed text-slate-800 font-normal">
                  {activeReadingResource.notes}
                </div>
              ) : (
                <p className="text-slate-400 italic text-xs">No direct text notes attached.</p>
              )}

              {activeReadingResource.url && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-blue-900">
                    External Resource Link Available
                  </span>
                  <a
                    href={activeReadingResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <span>Visit Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Created by {activeReadingResource.authorName}
              </span>

              <div className="flex items-center space-x-2">
                {activeReadingResource.notes && (
                  <button
                    onClick={() =>
                      handleCopyNotes(
                        activeReadingResource.notes || '',
                        activeReadingResource.id
                      )
                    }
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    {copiedId === activeReadingResource.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Cheat Sheet</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setActiveReadingResource(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingResource ? 'Edit Study Resource' : 'Add Chapter Study Resource'}
                </h2>
                <p className="text-xs text-slate-500">
                  Share study guides, formula sheets, vocab lists, or helpful links with students
                </p>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Break-Even & Profitability Formulas Cheat Sheet"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category & Pinned */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as ResourceCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="study_guide">Study Guide</option>
                    <option value="formula_sheet">Formula Sheet</option>
                    <option value="vocab_quizlet">Vocab & Terms</option>
                    <option value="exam_blueprint">Exam Blueprint</option>
                    <option value="tips_strategy">Tips & Strategy</option>
                    <option value="official_deca">Official DECA Document</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-pin-resource"
                    checked={formIsPinned}
                    onChange={e => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="chk-pin-resource" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Pin to Top of Library
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Short Description *
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Brief 1-2 sentence overview of what this resource teaches"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* External URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  External URL (Optional)
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={e => setFormUrl(e.target.value)}
                  placeholder="https://deca.org/... or https://quizlet.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Direct Study Notes / Cheat Sheet content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Study Notes / Cheat Sheet Content (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400">Directly readable in-app</span>
                </div>
                <textarea
                  rows={6}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Type or paste formulas, vocab terms, key takeaways, or concepts here..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  placeholder="Finance, ROI, Math, Law, Contracts"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-xs"
                >
                  {editingResource ? 'Save Changes' : 'Publish Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
