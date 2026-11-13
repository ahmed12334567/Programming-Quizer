import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  RotateCcw,
  Trash2,
  History,
  Filter,
  User,
  Award,
  BookOpen,
} from 'lucide-react';
import type { AllowedQuestionCount, Difficulty, TimerMode } from '../../types/quiz';
import { useQuizStore } from '../quiz/store';
import { CountSelector } from './CountSelector';
import { TimerSettings } from './TimerSettings';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDuration } from '../../lib/scoring';

export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const bank = useQuizStore((s) => s.bank);
  const studentName = useQuizStore((s) => s.studentName);
  const setStudentName = useQuizStore((s) => s.setStudentName);
  const activeSession = useQuizStore((s) => s.activeSession);
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const discardActiveQuiz = useQuizStore((s) => s.discardActiveQuiz);
  const attemptHistory = useQuizStore((s) => s.attemptHistory);
  const clearHistory = useQuizStore((s) => s.clearHistory);

  const [count, setCount] = useState<AllowedQuestionCount>(50);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<'all' | Difficulty>('all');
  const [timerMode, setTimerMode] = useState<TimerMode>('total');
  const [totalMinutes, setTotalMinutes] = useState<number>(50);
  const [perQuestionSeconds, setPerQuestionSeconds] = useState<number>(
    bank?.defaultTimerPerQuestion ?? 60
  );
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);

  const units = useMemo(() => {
    if (!bank) return [];
    const set = new Set<string>();
    bank.questions.forEach((q) => {
      if (q.unit) set.add(q.unit);
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [bank]);

  const isAllUnits = selectedUnits.length === 0 || selectedUnits.length === units.length;

  const isUnitSelected = (u: string) => {
    if (selectedUnits.length === 0) return true;
    return selectedUnits.includes(u);
  };

  const toggleUnit = (u: string) => {
    setSelectedUnits((prev) => {
      if (prev.length === 0) {
        // If transitioning from "all", deselect the clicked unit (keep all others)
        return units.filter((item) => item !== u);
      }
      if (prev.includes(u)) {
        const next = prev.filter((item) => item !== u);
        return next;
      }
      return [...prev, u];
    });
    setCategory('all');
  };

  const selectAllUnits = () => {
    setSelectedUnits([]);
    setCategory('all');
  };

  const categories = useMemo(() => {
    if (!bank) return [];
    const set = new Set<string>();
    bank.questions.forEach((q) => {
      const matchUnit = selectedUnits.length === 0 || (Boolean(q.unit) && selectedUnits.includes(q.unit!));
      if (matchUnit && q.category) {
        set.add(q.category);
      }
    });
    return Array.from(set);
  }, [bank, selectedUnits]);

  const hasDifficulties = useMemo(() => {
    if (!bank) return false;
    return bank.questions.some((q) => Boolean(q.difficulty));
  }, [bank]);

  const filteredPool = useMemo(() => {
    if (!bank) return [];
    return bank.questions.filter((q) => {
      const unitOk =
        selectedUnits.length === 0 ||
        (Boolean(q.unit) && selectedUnits.includes(q.unit!));
      const catOk = category === 'all' || q.category === category;
      const diffOk = difficulty === 'all' || q.difficulty === difficulty;
      return unitOk && catOk && diffOk;
    });
  }, [bank, selectedUnits, category, difficulty]);

  // Adjust count if current count exceeds available pool
  useEffect(() => {
    if (filteredPool.length > 0 && count > filteredPool.length) {
      setCount(filteredPool.length);
    }
  }, [filteredPool.length, count]);

  // Keep preset minutes synced when count changes
  useEffect(() => {
    setTotalMinutes(Math.max(1, count));
  }, [count]);

  if (!bank) return null;

  const canStart = filteredPool.length > 0 && count >= 1 && count <= filteredPool.length;
  const totalSecondsDisplay =
    timerMode === 'total'
      ? totalMinutes * 60
      : count * perQuestionSeconds;

  const handleStart = () => {
    if (!canStart) return;
    const effectiveUnits = selectedUnits.length > 0 ? selectedUnits : undefined;
    const unitSummary =
      selectedUnits.length === 1
        ? selectedUnits[0]
        : selectedUnits.length > 1
        ? `${selectedUnits.length} Units`
        : 'all';

    startQuiz({
      studentName,
      count,
      selectedUnits: effectiveUnits,
      unit: unitSummary,
      category,
      difficulty,
      timerMode,
      totalMinutes,
      perQuestionSeconds,
      shuffleQuestions,
      shuffleOptions,
    });
    navigate('/quiz');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Resume in-progress attempt banner */}
      {activeSession && (
        <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="indigo">In-Progress Quiz Found</Badge>
              <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300">
                {Object.keys(activeSession.answers).length} /{' '}
                {activeSession.items.length} answered
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
              You have an unfinished quiz session saved in this browser.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={discardActiveQuiz}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => navigate('/quiz')}
            >
              Resume Quiz
            </Button>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="indigo">Student Assessment</Badge>
          <Badge variant="neutral">{bank.questions.length} Questions in Bank</Badge>
          <Badge variant="emerald">Pass Mark: {bank.passMark}%</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {bank.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Configure your practice session below. No account required—your progress
          and attempt history are saved automatically in your browser.
        </p>
      </div>

      {/* Main Setup Card */}
      <Card padding="lg" className="space-y-6 shadow-md">
        {/* Optional Student Display Name */}
        <div>
          <label
            htmlFor="student-name"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2"
          >
            <User className="w-4 h-4 text-indigo-500" />
            <span>Display Name (Optional)</span>
          </label>
          <input
            id="student-name"
            type="text"
            dir="auto"
            placeholder="e.g., Sara Ahmed (shown on your results certificate)"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Multi-Select Units */}
        {units.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Select Units</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllUnits}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    isAllUnits
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                  }`}
                >
                  All Units ({bank.questions.length})
                </button>
                {!isAllUnits && (
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {selectedUnits.length} selected ({filteredPool.length} questions)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {units.map((u) => {
                const isSelected = isUnitSelected(u);
                const uCount = bank.questions.filter((q) => q.unit === u).length;

                return (
                  <motion.button
                    key={u}
                    type="button"
                    onClick={() => toggleUnit(u)}
                    whileHover={{ scale: 1.012, y: -1 }}
                    whileTap={{ scale: 0.988 }}
                    transition={{ duration: 0.12 }}
                    className={`p-3 rounded-xl border-2 text-left transition-colors flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-400 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && '✓'}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold truncate">
                        {u}
                      </span>
                    </div>
                    <Badge variant={isSelected ? 'indigo' : 'neutral'} className="shrink-0 text-[11px]">
                      {uCount} Qs
                    </Badge>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional Category & Difficulty Filters */}
        {(categories.length > 0 || hasDifficulties) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {categories.length > 0 && (
              <div>
                <label
                  htmlFor="filter-category"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Category Filter</span>
                </label>
                <select
                  id="filter-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">
                    All Categories ({bank.questions.length})
                  </option>
                  {categories.map((cat) => {
                    const catCount = bank.questions.filter(
                      (q) => q.category === cat
                    ).length;
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({catCount})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {hasDifficulties && (
              <div>
                <label
                  htmlFor="filter-difficulty"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Difficulty Filter</span>
                </label>
                <select
                  id="filter-difficulty"
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as 'all' | Difficulty)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Fixed 50 / 75 / 100 Selector Cards */}
        <CountSelector
          selectedCount={count}
          availablePoolCount={filteredPool.length}
          onSelectCount={setCount}
        />

        {/* Timer & Shuffle Toggles */}
        <TimerSettings
          timerMode={timerMode}
          totalMinutes={totalMinutes}
          perQuestionSeconds={perQuestionSeconds}
          shuffleQuestions={shuffleQuestions}
          shuffleOptions={shuffleOptions}
          onChangeTimerMode={setTimerMode}
          onChangeTotalMinutes={setTotalMinutes}
          onChangePerQuestionSeconds={setPerQuestionSeconds}
          onToggleShuffleQuestions={() => setShuffleQuestions((v) => !v)}
          onToggleShuffleOptions={() => setShuffleOptions((v) => !v)}
        />

        {/* Live Summary + Start Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
            <span className="text-xs uppercase tracking-wider text-slate-400 block mb-0.5">
              Live Session Summary
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {count} questions
            </span>{' '}
            ·{' '}
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              {formatDuration(totalSecondsDisplay)}
            </span>{' '}
            ·{' '}
            <span>
              {shuffleQuestions || shuffleOptions ? 'Shuffled' : 'Fixed Order'}
            </span>
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={!canStart}
            leftIcon={<Play className="w-5 h-5 fill-current" />}
            onClick={handleStart}
            className="w-full sm:w-auto min-w-[210px]"
          >
            Start Quiz
          </Button>
        </div>
      </Card>

      {/* Previous Attempts History */}
      {attemptHistory.length > 0 && (
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              <span>Your Previous Attempts</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={clearHistory}>
              Clear History
            </Button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {attemptHistory.slice(0, 8).map((attempt) => (
              <div
                key={attempt.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>
                      {attempt.scorePercentage}% ({attempt.correctCount}/
                      {attempt.totalQuestions})
                    </span>
                    <Badge variant={attempt.passed ? 'emerald' : 'rose'}>
                      {attempt.passed ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(attempt.completedAt).toLocaleString()} · Time:{' '}
                    {formatDuration(attempt.timeTakenSeconds)}
                    {attempt.studentName ? ` · ${attempt.studentName}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
