import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, Plus, Minus, Zap, Sparkles } from 'lucide-react';
import type { AllowedQuestionCount } from '../../types/quiz';

export interface CountSelectorProps {
  selectedCount: AllowedQuestionCount;
  availablePoolCount: number;
  onSelectCount: (count: AllowedQuestionCount) => void;
}

export const CountSelector: React.FC<CountSelectorProps> = ({
  selectedCount,
  availablePoolCount,
  onSelectCount,
}) => {
  const minCount = Math.min(5, Math.max(1, availablePoolCount));
  const maxCount = Math.max(1, availablePoolCount);
  const safeCount = Math.min(maxCount, Math.max(1, selectedCount));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      onSelectCount(Math.min(maxCount, Math.max(1, val)));
    }
  };

  const handleIncrement = (delta: number) => {
    const next = Math.min(maxCount, Math.max(1, safeCount + delta));
    onSelectCount(next);
  };

  // Dynamic presets that fit within available questions
  const presetCandidates = [10, 20, 30, 50, 75, 100];
  const presets = presetCandidates.filter((p) => p < availablePoolCount);

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Number of Questions</span>
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose any number of questions from 1 up to {availablePoolCount} available questions
          </p>
        </div>

        {/* Counter Display & Stepper */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safeCount <= 1}
            onClick={() => handleIncrement(-5)}
            className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            aria-label="Decrease by 5"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <input
              type="number"
              min={1}
              max={maxCount}
              value={safeCount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  onSelectCount(Math.min(maxCount, Math.max(1, val)));
                }
              }}
              className="w-20 px-2 py-1.5 text-center font-mono text-lg font-black text-indigo-600 dark:text-indigo-400 rounded-xl border-2 border-indigo-500/40 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            disabled={safeCount >= maxCount}
            onClick={() => handleIncrement(5)}
            className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            aria-label="Increase by 5"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Range Slider */}
      <div className="space-y-1.5 pt-1">
        <input
          type="range"
          min={minCount}
          max={maxCount}
          value={safeCount}
          onChange={handleSliderChange}
          className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>{minCount} min</span>
          <span>{safeCount} questions selected ({Math.round((safeCount / maxCount) * 100)}%)</span>
          <span>{maxCount} max</span>
        </div>
      </div>

      {/* Quick Presets & All Questions Button */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" /> Presets:
        </span>

        {presets.map((preset) => {
          const isSelected = safeCount === preset;
          return (
            <motion.button
              key={preset}
              type="button"
              onClick={() => onSelectCount(preset)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
              }`}
            >
              {preset} Qs
            </motion.button>
          );
        })}

        {/* All Available Preset */}
        <motion.button
          type="button"
          onClick={() => onSelectCount(availablePoolCount)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-3.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            safeCount === availablePoolCount
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>All Questions ({availablePoolCount})</span>
        </motion.button>
      </div>
    </div>
  );
};
