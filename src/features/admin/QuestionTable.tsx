import React, { useMemo, useState } from 'react';
import { Search, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import type { Question } from '../../types/quiz';
import { TableContainer } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FormattedText } from '../../components/ui/FormattedText';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export interface QuestionTableProps {
  questions: Question[];
  onAddClick: () => void;
  onEditClick: (question: Question) => void;
  onDeleteClick: (questionId: string) => Promise<void> | void;
  isActionLoading?: boolean;
}

const PAGE_SIZE = 15;

export const QuestionTable: React.FC<QuestionTableProps> = ({
  questions,
  onAddClick,
  onEditClick,
  onDeleteClick,
  isActionLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState<Question | null>(null);

  const units = useMemo(() => {
    const s = new Set<string>();
    questions.forEach((q) => {
      if (q.unit) s.add(q.unit);
    });
    return Array.from(s).sort();
  }, [questions]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    questions.forEach((q) => {
      if (q.category) s.add(q.category);
    });
    return Array.from(s).sort();
  }, [questions]);

  const filtered = useMemo(() => {
    const qLower = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (unitFilter !== 'all' && q.unit !== unitFilter) return false;
      if (typeFilter !== 'all' && q.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter)
        return false;
      if (qLower) {
        return (
          q.id.toLowerCase().includes(qLower) ||
          q.question.toLowerCase().includes(qLower) ||
          (q.unit?.toLowerCase().includes(qLower) ?? false) ||
          (q.category?.toLowerCase().includes(qLower) ?? false)
        );
      }
      return true;
    });
  }, [questions, search, unitFilter, typeFilter, categoryFilter, difficultyFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleDeletePrompt = (q: Question) => {
    if (deletingId || isActionLoading) return;
    setPendingDeleteQuestion(q);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteQuestion || deletingId || isActionLoading) return;
    setDeletingId(pendingDeleteQuestion.id);
    try {
      await onDeleteClick(pendingDeleteQuestion.id);
      setPendingDeleteQuestion(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, prompt, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {units.length > 0 && (
            <select
              value={unitFilter}
              onChange={(e) => {
                setUnitFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by unit"
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
            >
              <option value="all">All Units ({questions.length})</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          )}

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by question type"
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="all">All Types</option>
            <option value="mcq">MCQ</option>
            <option value="true_false">True/False</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by category"
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by difficulty"
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            disabled={isActionLoading || Boolean(deletingId)}
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onAddClick}
          >
            Add Question
          </Button>
        </div>
      </div>

      <TableContainer>
        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
          <tr>
            <th className="py-3 px-4">ID</th>
            <th className="py-3 px-4">Question</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Difficulty</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {slice.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                {questions.length === 0
                  ? 'No questions found in Firestore. Click "Add Question" or use Import to add questions.'
                  : 'No questions match your current search and filter criteria.'}
              </td>
            </tr>
          ) : (
            slice.map((q) => (
              <tr
                key={q.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {q.id}
                </td>
                <td className="py-3 px-4 max-w-md">
                  <div dir="auto" className="line-clamp-2 text-xs sm:text-sm">
                    <FormattedText text={q.question} />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge variant={q.type === 'mcq' ? 'indigo' : 'neutral'}>
                    {q.type === 'mcq' ? 'MCQ' : 'T/F'}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                  <div className="font-medium text-slate-800 dark:text-slate-200">{q.unit ?? q.category ?? '—'}</div>
                </td>
                <td className="py-3 px-4">
                  {q.difficulty ? (
                    <Badge
                      variant={
                        q.difficulty === 'hard'
                          ? 'rose'
                          : q.difficulty === 'medium'
                          ? 'amber'
                          : 'emerald'
                      }
                    >
                      {q.difficulty}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isActionLoading || Boolean(deletingId)}
                      onClick={() => onEditClick(q)}
                      aria-label={`Edit question ${q.id}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isActionLoading || Boolean(deletingId)}
                      onClick={() => handleDeletePrompt(q)}
                      aria-label={`Delete question ${q.id}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      {deletingId === q.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableContainer>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {slice.length} of {filtered.length} matching questions ({questions.length} total in Firestore)
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span className="font-mono">
            {safePage} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
      <ConfirmModal
        isOpen={Boolean(pendingDeleteQuestion)}
        onClose={() => setPendingDeleteQuestion(null)}
        onConfirm={() => void handleConfirmDelete()}
        isLoading={Boolean(deletingId)}
        variant="danger"
        title="Delete Question from Firestore"
        message="Are you sure you want to delete this question? It will be permanently removed from your Cloud Firestore database."
        itemPreview={
          pendingDeleteQuestion
            ? {
                id: pendingDeleteQuestion.id,
                text: pendingDeleteQuestion.question,
                badge: pendingDeleteQuestion.unit || pendingDeleteQuestion.category,
              }
            : undefined
        }
        confirmText="Yes, Delete Permanently"
        cancelText="Cancel"
      />
    </div>
  );
};
