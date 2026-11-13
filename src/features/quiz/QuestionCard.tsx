import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flag, CheckCircle2 } from 'lucide-react';
import type { PreparedQuestion, UserAnswer } from '../../types/quiz';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { FormattedText } from '../../components/ui/FormattedText';

export interface QuestionCardProps {
  item: PreparedQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: UserAnswer | undefined;
  isFlagged: boolean;
  onSelectAnswer: (answer: UserAnswer) => void;
  onToggleFlag: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const QuestionCard: React.FC<QuestionCardProps> = ({
  item,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isFlagged,
  onSelectAnswer,
  onToggleFlag,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { question, optionOrder } = item;

  const difficultyVariant =
    question.difficulty === 'hard'
      ? 'rose'
      : question.difficulty === 'medium'
      ? 'amber'
      : 'emerald';

  return (
    <motion.div
      key={question.id}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <Card padding="lg" className="shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="indigo">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            {question.unit && (
              <Badge variant="indigo">{question.unit}</Badge>
            )}
            {question.category && question.category !== question.unit && (
              <Badge variant="neutral">{question.category}</Badge>
            )}
            {question.difficulty && (
              <Badge variant={difficultyVariant}>
                {question.difficulty.toUpperCase()}
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={isFlagged}
            className={[
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              isFlagged
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800',
            ].join(' ')}
          >
            <Flag
              className={`w-3.5 h-3.5 ${
                isFlagged ? 'fill-amber-500 text-amber-500' : ''
              }`}
            />
            <span>{isFlagged ? 'Flagged for Review' : 'Flag for Review'}</span>
          </button>
        </div>

        <h2
          dir="auto"
          className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 leading-relaxed mb-4"
        >
          <FormattedText text={question.question} />
        </h2>

        {question.code && <CodeBlock code={question.code} language="tsx" />}

        <div className="mt-6">
          {question.type === 'mcq' ? (
            <div
              role="radiogroup"
              aria-label={`Options for question ${questionNumber}`}
              className="space-y-3"
            >
              {optionOrder.map((originalIndex, displayIdx) => {
                const optionText = question.options[originalIndex] ?? '';
                const isSelected = selectedAnswer === originalIndex;
                const letter = OPTION_LETTERS[displayIdx] ?? String(displayIdx + 1);

                return (
                  <motion.button
                    key={originalIndex}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectAnswer(originalIndex)}
                    whileHover={{ scale: 1.008, x: 2 }}
                    whileTap={{ scale: 0.995 }}
                    transition={{ duration: 0.12 }}
                    className={[
                      'w-full text-left p-4 rounded-2xl border-2 transition-colors duration-150 flex items-start gap-3.5 group',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 transition-colors',
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-slate-700',
                      ].join(' ')}
                    >
                      {letter}
                    </span>
                    <div
                      dir="auto"
                      className="flex-1 text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed"
                    >
                      <FormattedText text={optionText} />
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-label={`True or False for question ${questionNumber}`}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {[
                { value: true, label: 'True', shortcut: 'T' },
                { value: false, label: 'False', shortcut: 'F' },
              ].map((opt) => {
                const isSelected = selectedAnswer === opt.value;
                return (
                  <motion.button
                    key={opt.label}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectAnswer(opt.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className={[
                      'p-5 rounded-2xl border-2 transition-colors duration-150 flex items-center justify-between',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          'w-9 h-9 rounded-xl flex items-center justify-center font-mono text-sm font-bold transition-colors',
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
                        ].join(' ')}
                      >
                        {opt.shortcut}
                      </span>
                      <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {opt.label}
                      </span>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Keyboard:{' '}
            {question.type === 'mcq'
              ? '1-4 or A-D to select'
              : 'T / F to select'}{' '}
            · ← / → prev/next · Enter next
          </span>
        </div>
      </Card>
    </motion.div>
  );
};
