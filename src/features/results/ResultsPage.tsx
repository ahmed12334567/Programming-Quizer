import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RotateCcw, PlusCircle, Clock, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { useQuizStore } from '../quiz/store';
import { ScoreRing } from './ScoreRing';
import { ReviewList } from './ReviewList';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDuration } from '../../lib/scoring';

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const lastResult = useQuizStore((s) => s.lastResult);
  const attemptHistory = useQuizStore((s) => s.attemptHistory);
  const startQuiz = useQuizStore((s) => s.startQuiz);

  const result = lastResult ?? attemptHistory[0] ?? null;

  if (!result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          No Quiz Results Found
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Complete a quiz session first to see your score breakdown and question
          explanations.
        </p>
        <Link to="/">
          <Button variant="primary">Go to Quiz Setup</Button>
        </Link>
      </div>
    );
  }

  const wrongQuestions = result.reviews
    .filter((r) => !r.isCorrect)
    .map((r) => r.question);

  const handleRetakeWrongOnly = () => {
    if (wrongQuestions.length === 0) return;
    startQuiz(result.config, wrongQuestions);
    navigate('/quiz');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <Card padding="lg" className="shadow-md">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreRing
            percentage={result.scorePercentage}
            passed={result.passed}
          />

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge variant={result.passed ? 'emerald' : 'rose'}>
                {result.passed
                  ? `PASSED (Pass Mark ${result.passMark}%)`
                  : `BELOW PASS MARK (${result.passMark}%)`}
              </Badge>
              {result.config.unit && result.config.unit !== 'all' && (
                <Badge variant="indigo">{result.config.unit}</Badge>
              )}
              <span className="text-xs text-slate-500">
                {new Date(result.completedAt).toLocaleString()}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {result.studentName
                ? `${result.studentName}'s Assessment Results`
                : result.quizTitle}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                </div>
                <div className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-200 mt-0.5">
                  {result.correctCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/60">
                <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                  <XCircle className="w-3.5 h-3.5" /> Wrong
                </div>
                <div className="text-xl font-bold font-mono text-rose-800 dark:text-rose-200 mt-0.5">
                  {result.wrongCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                  <HelpCircle className="w-3.5 h-3.5" /> Unanswered
                </div>
                <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-0.5">
                  {result.unansweredCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> Time Taken
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                  {formatDuration(result.timeTakenSeconds)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
              {wrongQuestions.length > 0 && (
                <Button
                  variant="primary"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  onClick={handleRetakeWrongOnly}
                >
                  Retake Wrong Questions Only ({wrongQuestions.length})
                </Button>
              )}
              <Button
                variant="secondary"
                leftIcon={<PlusCircle className="w-4 h-4" />}
                onClick={() => navigate('/')}
              >
                New Quiz
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <ReviewList reviews={result.reviews} />
    </div>
  );
};
