import React, { useState, useMemo } from 'react';
import { User, CalendarNote, CalendarTag } from '../types';
import { getCalendarNotes, saveCalendarNote, deleteCalendarNote } from '../services/storage';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  ExternalLink,
  Presentation,
  Users,
  Award,
  Clock,
  Trash2,
  Edit3,
  Search,
  BookOpen,
  Sparkles,
  Link as LinkIcon,
  CalendarCheck,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Share2,
} from 'lucide-react';

interface ClusterCalendarViewProps {
  currentUser: User | null;
  onOpenAuthModal?: () => void;
  onStartPracticeExam?: () => void;
}

// 14 valid months: Jan 2026 to Feb 2027
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface YearMonth {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
}

const VALID_MONTHS: YearMonth[] = [
  ...Array.from({ length: 12 }, (_, i) => ({ year: 2026, month: i })),
  { year: 2027, month: 0 }, // Jan 2027
  { year: 2027, month: 1 }, // Feb 2027
];

const TAG_CONFIG: Record<CalendarTag, { label: string; bg: string; text: string; border: string; icon: React.ElementType }> = {
  slides: {
    label: 'Google Slides',
    bg: 'bg-amber-50 text-amber-900',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Presentation,
  },
  meeting: {
    label: 'Cluster Meeting',
    bg: 'bg-blue-50 text-blue-900',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Users,
  },
  exam: {
    label: 'Exam Prep',
    bg: 'bg-emerald-50 text-emerald-900',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: Award,
  },
  deadline: {
    label: 'Competition Deadline',
    bg: 'bg-rose-50 text-rose-900',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: Clock,
  },
  notes: {
    label: 'Study Notes',
    bg: 'bg-purple-50 text-purple-900',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: FileText,
  },
  resource: {
    label: 'Resource Link',
    bg: 'bg-indigo-50 text-indigo-900',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: LinkIcon,
  },
};

export const ClusterCalendarView: React.FC<ClusterCalendarViewProps> = ({
  currentUser,
  onOpenAuthModal,
  onStartPracticeExam,
}) => {
  const isLeader = currentUser?.role === 'cluster_leader';

  // State for all notes
  const [notes, setNotes] = useState<CalendarNote[]>(() => getCalendarNotes());

  // Default to September 2026 (or active school year kickoff)
  const [currentYM, setCurrentYM] = useState<YearMonth>({ year: 2026, month: 8 }); // 8 = September 2026
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-14');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('all');

  // Modal State for Adding/Editing Note
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<string>('2026-09-14');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formTag, setFormTag] = useState<CalendarTag>('slides');
  const [formLinkUrl, setFormLinkUrl] = useState<string>('');
  const [formLinkTitle, setFormLinkTitle] = useState<string>('');
  const [formAuthorName, setFormAuthorName] = useState<string>(currentUser?.name || 'Ronnie Agarwal');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Month index helpers
  const currentYMIndex = useMemo(() => {
    return VALID_MONTHS.findIndex(
      m => m.year === currentYM.year && m.month === currentYM.month
    );
  }, [currentYM]);

  const canGoPrev = currentYMIndex > 0;
  const canGoNext = currentYMIndex < VALID_MONTHS.length - 1;

  const handlePrevMonth = () => {
    if (canGoPrev) {
      setCurrentYM(VALID_MONTHS[currentYMIndex - 1]);
    }
  };

  const handleNextMonth = () => {
    if (canGoNext) {
      setCurrentYM(VALID_MONTHS[currentYMIndex + 1]);
    }
  };

  // Days in selected month
  const calendarDays = useMemo(() => {
    const year = currentYM.year;
    const month = currentYM.month;
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Preceding empty/overflow days
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevMonthTotalDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: prevDay, isCurrentMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Trailing days to round up to complete weeks (multiple of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({ dateStr, dayNum: i, isCurrentMonth: false });
      }
    }

    return days;
  }, [currentYM]);

  // Notes mapped by date string for quick lookup
  const notesByDate = useMemo(() => {
    const map = new Map<string, CalendarNote[]>();
    notes.forEach(note => {
      if (!map.has(note.date)) {
        map.set(note.date, []);
      }
      map.get(note.date)!.push(note);
    });
    return map;
  }, [notes]);

  // Filtered notes for agenda view
  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => {
        // Must be within 2026-01-01 and 2027-02-28
        if (n.date < '2026-01-01' || n.date > '2027-02-28') return false;

        // Tag filter
        if (activeTagFilter !== 'all' && n.tag !== activeTagFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchDesc = n.description.toLowerCase().includes(q);
          const matchAuthor = n.authorName.toLowerCase().includes(q);
          const matchLink = n.linkTitle?.toLowerCase().includes(q) || n.linkUrl?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchAuthor && !matchLink) return false;
        }

        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [notes, activeTagFilter, searchQuery]);

  // Notes on the currently clicked/selected date
  const selectedDateNotes = useMemo(() => {
    return notesByDate.get(selectedDate) || [];
  }, [notesByDate, selectedDate]);

  // Open note modal for a specific date
  const handleOpenNewNoteModal = (dateStr?: string) => {
    const targetDate = dateStr || selectedDate || '2026-09-14';
    setEditingNoteId(null);
    setFormDate(targetDate);
    setFormTitle('');
    setFormDescription('');
    setFormTag('slides');
    setFormLinkUrl('');
    setFormLinkTitle('');
    setFormAuthorName(currentUser?.name || 'Ronnie Agarwal');
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: CalendarNote) => {
    setEditingNoteId(note.id);
    setFormDate(note.date);
    setFormTitle(note.title);
    setFormDescription(note.description);
    setFormTag(note.tag);
    setFormLinkUrl(note.linkUrl || '');
    setFormLinkTitle(note.linkTitle || '');
    setFormAuthorName(note.authorName);
    setIsEditorOpen(true);
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('Are you sure you want to delete this calendar note?')) {
      deleteCalendarNote(id);
      setNotes(getCalendarNotes());
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    // Validate date bounds (2026-01-01 to 2027-02-28)
    let validatedDate = formDate;
    if (validatedDate < '2026-01-01') validatedDate = '2026-01-01';
    if (validatedDate > '2027-02-28') validatedDate = '2027-02-28';

    const noteToSave: CalendarNote = {
      id: editingNoteId || `note_${Date.now()}`,
      date: validatedDate,
      title: formTitle.trim(),
      description: formDescription.trim(),
      tag: formTag,
      linkUrl: formLinkUrl.trim() || undefined,
      linkTitle: formLinkTitle.trim() || (formLinkUrl.trim() ? (formTag === 'slides' ? 'Google Slides Presentation' : 'Open Link') : undefined),
      authorId: currentUser?.id || 'cluster_leader_auto',
      authorName: formAuthorName.trim() || 'Ronnie Agarwal',
      createdAt: editingNoteId ? (notes.find(n => n.id === editingNoteId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
    };

    saveCalendarNote(noteToSave);
    setNotes(getCalendarNotes());
    setSelectedDate(validatedDate);
    setIsEditorOpen(false);
  };

  const handleCopyLink = (note: CalendarNote) => {
    if (note.linkUrl) {
      navigator.clipboard.writeText(note.linkUrl);
      setCopiedNoteId(note.id);
      setTimeout(() => setCopiedNoteId(null), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Official 2026 – February 2027 DECA Competition Timeline</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Cluster Calendar & Study Hub
            </h1>
            <div className="inline-flex items-center flex-wrap gap-2 text-xs sm:text-sm text-blue-200 bg-blue-950/60 border border-blue-800/60 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400 font-medium">Cluster Leaders:</span>
              <span className="font-semibold text-white">Ronnie Agarwal</span>
              <span className="text-blue-400">•</span>
              <span className="font-semibold text-white">Omar Ahmed</span>
              <span className="text-blue-400">•</span>
              <span className="font-semibold text-white">Omar Dowidar</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Find meeting notes, Google Slides presentation decks, study resources, and key deadlines for DECA Entrepreneurship 2026 through the February 2027 State Conference.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isLeader ? (
              <button
                type="button"
                id="btn-add-calendar-note"
                onClick={() => handleOpenNewNoteModal(selectedDate)}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Note / Google Slides</span>
              </button>
            ) : !currentUser ? (
              <button
                type="button"
                id="btn-calendar-leader-login"
                onClick={onOpenAuthModal}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-400/30 flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Leader Sign In (To Post)</span>
              </button>
            ) : null}

            {onStartPracticeExam && (
              <button
                type="button"
                id="btn-calendar-practice-now"
                onClick={onStartPracticeExam}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Take Practice Exam</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-calendar"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes, Google Slides, meetings, or topics..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tag Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setActiveTagFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTagFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items ({notes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTagFilter('slides')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 transition whitespace-nowrap cursor-pointer ${
              activeTagFilter === 'slides'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Google Slides ({notes.filter(n => n.tag === 'slides').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTagFilter('meeting')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 transition whitespace-nowrap cursor-pointer ${
              activeTagFilter === 'meeting'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Meetings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTagFilter('deadline')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 transition whitespace-nowrap cursor-pointer ${
              activeTagFilter === 'deadline'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Deadlines</span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
          <button
            type="button"
            id="btn-view-grid"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Month Grid</span>
          </button>
          <button
            type="button"
            id="btn-view-agenda"
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              viewMode === 'agenda'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Timeline List</span>
          </button>
        </div>
      </div>

      {/* Main Calendar View Area */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Calendar Grid (2 Cols on lg) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6">
            {/* Month Navigation & Year Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {MONTH_NAMES[currentYM.month]} {currentYM.year}
                  </h2>
                </div>
              </div>

              {/* Month Selector Dropdown & Nav Buttons */}
              <div className="flex items-center space-x-2">
                <select
                  id="select-calendar-month"
                  value={`${currentYM.year}-${currentYM.month}`}
                  onChange={e => {
                    const [y, m] = e.target.value.split('-').map(Number);
                    setCurrentYM({ year: y, month: m });
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {VALID_MONTHS.map(ym => (
                    <option key={`${ym.year}-${ym.month}`} value={`${ym.year}-${ym.month}`}>
                      {MONTH_NAMES[ym.month]} {ym.year}
                    </option>
                  ))}
                </select>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    id="btn-prev-month"
                    onClick={handlePrevMonth}
                    disabled={!canGoPrev}
                    title="Previous Month"
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    id="btn-next-month"
                    onClick={handleNextMonth}
                    disabled={!canGoNext}
                    title="Next Month"
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase tracking-wider">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((day, idx) => {
                const dayNotes = notesByDate.get(day.dateStr) || [];
                const isSelected = day.dateStr === selectedDate;
                const hasNotes = dayNotes.length > 0;
                const hasSlides = dayNotes.some(n => n.tag === 'slides');
                const hasExam = dayNotes.some(n => n.tag === 'exam');
                const hasDeadline = dayNotes.some(n => n.tag === 'deadline');

                return (
                  <button
                    key={`${day.dateStr}-${idx}`}
                    type="button"
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`min-h-[76px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-2xl flex flex-col justify-between text-left transition relative border cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-500/20'
                        : hasNotes
                        ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        : day.isCurrentMonth
                        ? 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/80'
                        : 'border-transparent bg-slate-50/20 text-slate-300 opacity-40 hover:opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : day.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {day.dayNum}
                      </span>

                      {hasSlides && (
                        <span title="Google Slides Attached">
                          <Presentation className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      )}
                    </div>

                    {/* Note tags previews inside calendar cell */}
                    {hasNotes && (
                      <div className="space-y-1 mt-1 w-full overflow-hidden">
                        {dayNotes.slice(0, 2).map(n => {
                          const conf = TAG_CONFIG[n.tag] || TAG_CONFIG.notes;
                          return (
                            <div
                              key={n.id}
                              className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium border ${conf.bg} ${conf.border}`}
                              title={n.title}
                            >
                              {n.title}
                            </div>
                          );
                        })}
                        {dayNotes.length > 2 && (
                          <div className="text-[9px] text-slate-500 font-bold px-1">
                            +{dayNotes.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail Drawer / Notes Panel (1 Col on lg) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                  Selected Date
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>

              {isLeader && (
                <button
                  type="button"
                  id="btn-add-note-on-day"
                  onClick={() => handleOpenNewNoteModal(selectedDate)}
                  className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition cursor-pointer"
                  title="Add Note or Slides for this day"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedDateNotes.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-700">No notes posted for this date</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isLeader
                      ? 'Click "+ Add Note" to post meeting details or Google Slides for your students.'
                      : 'Check other dates or switch to the Timeline List view above.'}
                  </p>
                </div>
                {isLeader && (
                  <button
                    type="button"
                    onClick={() => handleOpenNewNoteModal(selectedDate)}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition"
                  >
                    + Write Note for This Day
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {selectedDateNotes.map(note => {
                  const conf = TAG_CONFIG[note.tag] || TAG_CONFIG.notes;
                  const Icon = conf.icon;

                  return (
                    <div
                      key={note.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-3 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.bg} ${conf.border}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{conf.label}</span>
                        </span>

                        {isLeader && (
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleEditNote(note)}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Edit note"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {note.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <span>Posted by</span>
                          <span className="font-semibold text-slate-700">{note.authorName}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {note.description}
                      </p>

                      {/* Google Slides or Resource Link Attachment */}
                      {note.linkUrl && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                          <a
                            href={note.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition"
                          >
                            {note.tag === 'slides' ? (
                              <Presentation className="w-3.5 h-3.5" />
                            ) : (
                              <ExternalLink className="w-3.5 h-3.5" />
                            )}
                            <span>{note.linkTitle || 'Open Attached Resource'}</span>
                            <ExternalLink className="w-3 h-3 text-slate-800 ml-0.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(note)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 text-[11px] flex items-center space-x-1"
                            title="Copy link to clipboard"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>{copiedNoteId === note.id ? 'Copied!' : 'Copy Link'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Agenda / Timeline List View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Timeline & Schedule (2026 – February 2027)
              </h2>
              <p className="text-xs text-slate-500">
                Showing {filteredNotes.length} scheduled items and presentation decks
              </p>
            </div>

            {isLeader && (
              <button
                type="button"
                onClick={() => handleOpenNewNoteModal()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Note / Slides</span>
              </button>
            )}
          </div>

          {filteredNotes.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No scheduled items match your filter</p>
              <p className="text-xs text-slate-500">Try clearing the search query or tag filters above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map(note => {
                const conf = TAG_CONFIG[note.tag] || TAG_CONFIG.notes;
                const Icon = conf.icon;
                const dateObj = new Date(note.date + 'T00:00:00');

                return (
                  <div
                    key={note.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white shadow-2xs hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Date Badge + Content */}
                    <div className="flex items-start space-x-4">
                      {/* Date Badge */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 border border-slate-800 shadow-inner">
                        <span className="text-[10px] uppercase font-bold text-blue-400">
                          {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-xl font-black leading-none">
                          {dateObj.getDate()}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {dateObj.getFullYear()}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span
                            className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.bg} ${conf.border}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{conf.label}</span>
                          </span>
                          <span className="text-[11px] text-slate-500">
                            By <strong className="text-slate-700">{note.authorName}</strong>
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">
                          {note.title}
                        </h3>

                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed whitespace-pre-line">
                          {note.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions / Links */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {note.linkUrl ? (
                        <a
                          href={note.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs flex items-center space-x-1.5 transition"
                        >
                          {note.tag === 'slides' ? (
                            <Presentation className="w-3.5 h-3.5" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                          <span>{note.linkTitle || 'Open Slides Deck'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-800" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No link attached</span>
                      )}

                      {isLeader && (
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleEditNote(note)}
                            className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-xs text-rose-600 hover:underline flex items-center space-x-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Note Composer / Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingNoteId ? 'Edit Cluster Note / Resource' : 'Post Note or Google Slides Deck'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Visible to all DECA students on the calendar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNote} className="p-6 space-y-4">
              {/* Date selection (2026-01-01 to 2027-02-28) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date (2026 – Feb 2027) *
                  </label>
                  <input
                    id="input-note-date"
                    type="date"
                    required
                    min="2026-01-01"
                    max="2027-02-28"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">Allowed: Jan 2026 to Feb 2027</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Tag *
                  </label>
                  <select
                    id="select-note-tag"
                    value={formTag}
                    onChange={e => setFormTag(e.target.value as CalendarTag)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="slides">📊 Google Slides Deck</option>
                    <option value="meeting">👥 Cluster Meeting</option>
                    <option value="exam">📝 Exam Practice Drill</option>
                    <option value="deadline">⏰ Competition / Deadline</option>
                    <option value="notes">💡 Study Notes & Tips</option>
                    <option value="resource">🔗 General Resource Link</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  id="input-note-title"
                  type="text"
                  required
                  placeholder="e.g., Financial Analysis Review & Google Slides"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Google Slides / Link URL */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                  <Presentation className="w-4 h-4 text-amber-600" />
                  <span>Attach Google Slides or Link (Optional)</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Paste the link to your Google Slides presentation deck, Google Docs, or Zoom meeting. Students can click to open it directly.
                </p>

                <div className="space-y-2 pt-1">
                  <input
                    id="input-note-link-url"
                    type="url"
                    placeholder="https://docs.google.com/presentation/d/... or any URL"
                    value={formLinkUrl}
                    onChange={e => setFormLinkUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />

                  <input
                    id="input-note-link-title"
                    type="text"
                    placeholder="Link Button Label (e.g., Open Presentation Slides, View Rubric)"
                    value={formLinkTitle}
                    onChange={e => setFormLinkTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Detailed Description / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Notes & Instructions for Students
                </label>
                <textarea
                  id="textarea-note-description"
                  rows={3}
                  placeholder="Enter meeting agendas, study instructions, key performance indicators, or homework reading..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Author selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Posted As (Leader Attribution)
                </label>
                <select
                  id="select-note-author"
                  value={formAuthorName}
                  onChange={e => setFormAuthorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="Ronnie Agarwal">Ronnie Agarwal (Cluster Leader)</option>
                  <option value="Omar Ahmed">Omar Ahmed (Cluster Leader)</option>
                  <option value="Omar Dowidar">Omar Dowidar (Cluster Leader)</option>
                  {currentUser?.name && !['Ronnie Agarwal', 'Omar Ahmed', 'Omar Dowidar'].includes(currentUser.name) && (
                    <option value={currentUser.name}>{currentUser.name}</option>
                  )}
                </select>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-calendar-note"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition"
                >
                  {editingNoteId ? 'Update Note' : 'Publish Note to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
