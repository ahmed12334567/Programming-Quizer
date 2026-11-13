import React from 'react';

export interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label }) => {
  const safeTotal = Math.max(1, total);
  const pct = Math.min(100, Math.max(0, Math.round((current / safeTotal) * 100)));

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label ?? `Question ${current} of ${total}`}
        className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
