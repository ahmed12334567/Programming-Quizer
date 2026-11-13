import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Difficulty, Question, QuestionType } from '../../types/quiz';
import { QuestionSchema } from '../../lib/questionSchema';
import { Button } from '../../components/ui/Button';

export interface QuestionFormProps {
  initialQuestion?: Question | null;
  existingIds: string[];
  onSave: (question: Question) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  initialQuestion,
  existingIds,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const isEditing = Boolean(initialQuestion);
  const [id, setId] = useState(initialQuestion?.id ?? `q${existingIds.length + 1}`);
  const [type, setType] = useState<QuestionType>(initialQuestion?.type ?? 'mcq');
  const [questionText, setQuestionText] = useState(initialQuestion?.question ?? '');
  const [code, setCode] = useState(initialQuestion?.code ?? '');
  const [category, setCategory] = useState(initialQuestion?.category ?? 'JavaScript');
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initialQuestion?.difficulty ?? 'easy'
  );
  const [explanation, setExplanation] = useState(initialQuestion?.explanation ?? '');
  const [options, setOptions] = useState<string[]>(
    initialQuestion?.type === 'mcq'
      ? initialQuestion.options
      : ['Option A', 'Option B', 'Option C', 'Option D']
  );
  const [mcqAnswer, setMcqAnswer] = useState<number>(
    initialQuestion?.type === 'mcq' ? initialQuestion.answer : 0
  );
  const [tfAnswer, setTfAnswer] = useState<boolean>(
    initialQuestion?.type === 'true_false' ? initialQuestion.answer : true
  );
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, `Option ${String.fromCharCode(65 + options.length)}`]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) {
      setError('MCQ question must have at least 2 options.');
      return;
    }
    const next = options.filter((_, i) => i !== idx);
    setOptions(next);
    if (mcqAnswer === idx) {
      setMcqAnswer(0);
    } else if (mcqAnswer > idx) {
      setMcqAnswer(mcqAnswer - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setError(null);

    const trimmedId = id.trim();
    if (!trimmedId) {
      setError('Question ID cannot be empty.');
      return;
    }

    const duplicate = existingIds.some(
      (existing) => existing === trimmedId && existing !== initialQuestion?.id
    );
    if (duplicate) {
      setError(`Duplicate Question ID "${trimmedId}". Each question must have a unique ID.`);
      return;
    }

    if (!questionText.trim()) {
      setError('Question prompt is required.');
      return;
    }

    let candidate: unknown;

    if (type === 'mcq') {
      const cleanedOptions = options.map((o) => o.trim());
      if (cleanedOptions.length < 2) {
        setError('Multiple choice questions require at least 2 options.');
        return;
      }
      if (cleanedOptions.some((o) => !o)) {
        setError('All options must contain non-empty text.');
        return;
      }
      if (mcqAnswer < 0 || mcqAnswer >= cleanedOptions.length) {
        setError(`Please select a valid correct answer option (index 0..${cleanedOptions.length - 1}).`);
        return;
      }

      candidate = {
        id: trimmedId,
        type: 'mcq',
        question: questionText.trim(),
        code: code.trim() ? code : undefined,
        options: cleanedOptions,
        answer: mcqAnswer,
        explanation: explanation.trim() || undefined,
        category: category.trim() || undefined,
        difficulty,
      };
    } else {
      candidate = {
        id: trimmedId,
        type: 'true_false',
        question: questionText.trim(),
        code: code.trim() ? code : undefined,
        answer: tfAnswer,
        explanation: explanation.trim() || undefined,
        category: category.trim() || undefined,
        difficulty,
      };
    }

    const parsed = QuestionSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(' · '));
      return;
    }

    onSave(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1">Question ID</label>
          <input
            type="text"
            value={id}
            disabled={isEditing || isSaving}
            onChange={(e) => setId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Type</label>
          <select
            value={type}
            disabled={isSaving}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="mcq">Multiple Choice (MCQ)</option>
            <option value="true_false">True / False</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1">Category</label>
          <input
            type="text"
            value={category}
            disabled={isSaving}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Difficulty</label>
          <select
            value={difficulty}
            disabled={isSaving}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">
          Question Prompt (supports `inline code` & RTL)
        </label>
        <textarea
          rows={2}
          dir="auto"
          value={questionText}
          disabled={isSaving}
          onChange={(e) => setQuestionText(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">
          Code Snippet (Optional)
        </label>
        <textarea
          rows={3}
          dir="ltr"
          value={code}
          disabled={isSaving}
          onChange={(e) => setCode(e.target.value)}
          placeholder="console.log(typeof null);"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
        />
      </div>

      {type === 'mcq' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold">
              MCQ Options (select radio for correct answer)
            </label>
            {options.length < 6 && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleAddOption}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                + Add Option
              </button>
            )}
          </div>

          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name="mcq-correct"
                disabled={isSaving}
                checked={mcqAnswer === idx}
                onChange={() => setMcqAnswer(idx)}
                className="accent-indigo-600"
              />
              <input
                type="text"
                dir="auto"
                value={opt}
                disabled={isSaving}
                onChange={(e) => {
                  const next = [...options];
                  next[idx] = e.target.value;
                  setOptions(next);
                }}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleRemoveOption(idx)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-rose-600 rounded"
                  title="Remove option"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold mb-1">
            Correct True/False Answer
          </label>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                disabled={isSaving}
                checked={tfAnswer === true}
                onChange={() => setTfAnswer(true)}
                className="accent-indigo-600"
              />
              True
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                disabled={isSaving}
                checked={tfAnswer === false}
                onChange={() => setTfAnswer(false)}
                className="accent-indigo-600"
              />
              False
            </label>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold mb-1">
          Explanation (Optional)
        </label>
        <textarea
          rows={2}
          dir="auto"
          value={explanation}
          disabled={isSaving}
          onChange={(e) => setExplanation(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSaving}
          leftIcon={isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined}
        >
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Question'}
        </Button>
      </div>
    </form>
  );
};
