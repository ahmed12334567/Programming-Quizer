import React from 'react';
import { Clock, Shuffle } from 'lucide-react';
import type { TimerMode } from '../../types/quiz';

export interface TimerSettingsProps {
  timerMode: TimerMode;
  totalMinutes: number;
  perQuestionSeconds: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  onChangeTimerMode: (mode: TimerMode) => void;
  onChangeTotalMinutes: (minutes: number) => void;
  onChangePerQuestionSeconds: (seconds: number) => void;
  onToggleShuffleQuestions: () => void;
  onToggleShuffleOptions: () => void;
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({
  timerMode,
  totalMinutes,
  perQuestionSeconds,
  shuffleQuestions,
  shuffleOptions,
  onChangeTimerMode,
  onChangeTotalMinutes,
  onChangePerQuestionSeconds,
  onToggleShuffleQuestions,
  onToggleShuffleOptions,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Timer Mode Configuration */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>Timer Mode</span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => onChangeTimerMode('total')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              timerMode === 'total'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Total Time
          </button>
          <button
            type="button"
            onClick={() => onChangeTimerMode('per_question')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              timerMode === 'per_question'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Per Question
          </button>
        </div>

        {timerMode === 'total' ? (
          <div>
            <label
              htmlFor="total-minutes-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Total Duration (minutes)
            </label>
            <input
              id="total-minutes-input"
              type="number"
              min={1}
              max={300}
              value={totalMinutes}
              onChange={(e) =>
                onChangeTotalMinutes(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ) : (
          <div>
            <label
              htmlFor="per-question-seconds-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Seconds per Question
            </label>
            <input
              id="per-question-seconds-input"
              type="number"
              min={10}
              max={600}
              value={perQuestionSeconds}
              onChange={(e) =>
                onChangePerQuestionSeconds(
                  Math.max(10, Number(e.target.value) || 60)
                )
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Randomization Toggles */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Shuffle className="w-4 h-4 text-indigo-500" />
          <span>Randomization (Fisher-Yates)</span>
        </div>

        <label className="flex items-center justify-between cursor-pointer py-1.5">
          <div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Shuffle Questions
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Randomize question order on start
            </div>
          </div>
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={onToggleShuffleQuestions}
            className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer py-1.5 border-t border-slate-200/60 dark:border-slate-800">
          <div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Shuffle MCQ Options
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Randomize A/B/C/D choices per attempt
            </div>
          </div>
          <input
            type="checkbox"
            checked={shuffleOptions}
            onChange={onToggleShuffleOptions}
            className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
