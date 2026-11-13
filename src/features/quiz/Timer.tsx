import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatDuration } from '../../lib/scoring';
import { useDriftFreeTimer } from './hooks';

export interface TimerProps {
  endTimestamp: number;
  totalSeconds: number;
  onExpire: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  endTimestamp,
  totalSeconds,
  onExpire,
}) => {
  const { secondsLeft, status, announcement } = useDriftFreeTimer(
    endTimestamp,
    totalSeconds,
    onExpire
  );

  const badgeStyle =
    status === 'critical'
      ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
      : status === 'warning'
      ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';

  return (
    <div className="inline-flex items-center">
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-sm font-semibold transition-colors ${badgeStyle}`}
        title="Remaining quiz time"
      >
        {status === 'critical' ? (
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
        ) : (
          <Clock className="w-4 h-4 shrink-0 opacity-75" />
        )}
        <span>{formatDuration(secondsLeft)}</span>
      </div>
      <span
        className="sr-only"
        role="status"
        aria-live={status === 'critical' ? 'assertive' : 'polite'}
      >
        {announcement}
      </span>
    </div>
  );
};
