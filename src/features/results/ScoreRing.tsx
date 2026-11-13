import React from 'react';

export interface ScoreRingProps {
  percentage: number;
  passed: boolean;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ percentage, passed }) => {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const strokeColor = passed
    ? 'stroke-emerald-500 dark:stroke-emerald-400'
    : 'stroke-rose-500 dark:stroke-rose-400';

  return (
    <div className="relative inline-flex items-center justify-center w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="transparent"
          strokeWidth="12"
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="transparent"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${strokeColor} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
          {clamped}%
        </span>
        <span
          className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${
            passed
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {passed ? 'Passed' : 'Failed'}
        </span>
      </div>
    </div>
  );
};
