import React, { useState } from 'react';
import { Grid, ChevronUp, ChevronDown, Flag } from 'lucide-react';
import type { PreparedQuestion, UserAnswer } from '../../types/quiz';

export interface NavigatorProps {
  items: PreparedQuestion[];
  answers: Record<string, UserAnswer>;
  flaggedIds: string[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export const Navigator: React.FC<NavigatorProps> = ({
  items,
  answers,
  flaggedIds,
  currentIndex,
  onSelectIndex,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const flaggedSet = new Set(flaggedIds);

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = items.length - answeredCount;

  const renderGrid = (closeOnSelect: boolean) => (
    <div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mb-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
          Answered ({answeredCount})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
          Unanswered ({unansweredCount})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          Flagged ({flaggedIds.length})
        </span>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-1.5 max-h-72 overflow-y-auto pr-1">
        {items.map((item, idx) => {
          const qId = item.question.id;
          const isCurrent = idx === currentIndex;
          const isAnswered = answers[qId] !== undefined;
          const isFlagged = flaggedSet.has(qId);

          let cellClass =
            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400';
          if (isAnswered) {
            cellClass =
              'bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-semibold';
          }
          if (isFlagged) {
            cellClass =
              'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-400 dark:border-amber-700 font-semibold';
          }
          if (isCurrent) {
            cellClass +=
              ' ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-1 dark:ring-offset-slate-900';
          }

          return (
            <button
              key={qId}
              type="button"
              onClick={() => {
                onSelectIndex(idx);
                if (closeOnSelect) setMobileOpen(false);
              }}
              aria-label={`Go to question ${idx + 1}${
                isAnswered ? ', answered' : ', unanswered'
              }${isFlagged ? ', flagged' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
              className={`relative h-9 rounded-lg border text-xs font-mono transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${cellClass}`}
            >
              <span>{idx + 1}</span>
              {isFlagged && (
                <Flag className="w-2.5 h-2.5 text-amber-500 fill-amber-500 absolute top-0.5 right-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar card */}
      <div className="hidden lg:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs sticky top-24">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Grid className="w-4 h-4 text-indigo-500" />
            <span>Question Navigator</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {answeredCount}/{items.length}
          </span>
        </div>
        {renderGrid(false)}
      </div>

      {/* Mobile collapsible bottom sheet */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200"
        >
          <span className="inline-flex items-center gap-2">
            <Grid className="w-4 h-4 text-indigo-500" />
            <span>
              Question Navigator ({answeredCount}/{items.length} answered
              {flaggedIds.length > 0 ? ` · ${flaggedIds.length} flagged` : ''})
            </span>
          </span>
          {mobileOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
        {mobileOpen && (
          <div className="px-4 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {renderGrid(true)}
          </div>
        )}
      </div>
    </>
  );
};
