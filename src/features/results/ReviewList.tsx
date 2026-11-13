import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, Flag } from 'lucide-react';
import type { QuestionReviewItem } from '../../types/quiz';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { FormattedText } from '../../components/ui/FormattedText';

export interface ReviewListProps {
  reviews: QuestionReviewItem[];
}

type FilterTab = 'all' | 'wrong' | 'flagged';
const PAGE_SIZE = 20;

export const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  const [tab, setTab] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (tab === 'wrong') return !r.isCorrect;
      if (tab === 'flagged') return r.isFlagged;
      return true;
    });
  }, [reviews, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleTabChange = (nextTab: FilterTab) => {
    setTab(nextTab);
    setPage(1);
  };

  const wrongCount = reviews.filter((r) => !r.isCorrect).length;
  const flaggedCount = reviews.filter((r) => r.isFlagged).length;

  const formatAnswerText = (item: QuestionReviewItem, ans: number | boolean | undefined): string => {
    if (ans === undefined) return 'Unanswered';
    if (item.question.type === 'true_false') {
      return ans === true ? 'True' : 'False';
    }
    if (typeof ans === 'number') {
      return item.question.options[ans] ?? `Option ${ans + 1}`;
    }
    return String(ans);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Detailed Question Review
        </h2>

        <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {[
            { id: 'all' as const, label: `All (${reviews.length})` },
            { id: 'wrong' as const, label: `Wrong / Unanswered (${wrongCount})` },
            { id: 'flagged' as const, label: `Flagged (${flaggedCount})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabChange(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {pageItems.length === 0 ? (
        <Card padding="lg" className="text-center text-sm text-slate-500">
          No questions match the selected filter.
        </Card>
      ) : (
        <div className="space-y-4">
          {pageItems.map((item, idx) => {
            const globalIndex = (safePage - 1) * PAGE_SIZE + idx + 1;
            const { question, userAnswer, isCorrect, isAnswered, isFlagged } = item;

            return (
              <Card key={question.id} padding="md" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      #{globalIndex} ({question.id})
                    </span>
                    {question.category && (
                      <Badge variant="neutral">{question.category}</Badge>
                    )}
                    {isFlagged && (
                      <Badge variant="amber">
                        <Flag className="w-3 h-3 fill-current" /> Flagged
                      </Badge>
                    )}
                  </div>

                  {isCorrect ? (
                    <Badge variant="emerald">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                    </Badge>
                  ) : !isAnswered ? (
                    <Badge variant="amber">
                      <MinusCircle className="w-3.5 h-3.5" /> Unanswered
                    </Badge>
                  ) : (
                    <Badge variant="rose">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect
                    </Badge>
                  )}
                </div>

                <h3
                  dir="auto"
                  className="text-base font-semibold text-slate-900 dark:text-slate-100"
                >
                  <FormattedText text={question.question} />
                </h3>

                {question.code && (
                  <CodeBlock code={question.code} language="tsx" />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm">
                  <div
                    className={`p-3 rounded-xl border ${
                      isCorrect
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/70 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-wider font-bold opacity-75 mb-0.5">
                      Your Answer
                    </div>
                    <div dir="auto" className="font-semibold">
                      <FormattedText text={formatAnswerText(item, userAnswer)} />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200">
                    <div className="text-[11px] uppercase tracking-wider font-bold opacity-75 mb-0.5">
                      Correct Answer
                    </div>
                    <div dir="auto" className="font-semibold">
                      <FormattedText
                        text={formatAnswerText(item, question.answer)}
                      />
                    </div>
                  </div>
                </div>

                {question.explanation && (
                  <div
                    dir="auto"
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                  >
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Explanation:{' '}
                    </span>
                    <FormattedText text={question.explanation} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination (20 per page) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous Page
          </Button>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
            Page {safePage} of {totalPages} ({filtered.length} questions)
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next Page
          </Button>
        </div>
      )}
    </div>
  );
};
