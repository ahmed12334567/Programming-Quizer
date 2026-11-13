import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Sun,
  Moon,
  Shield,
  AlertOctagon,
  RefreshCw,
  FileText,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useTheme } from './providers';
import { useQuizStore } from '../features/quiz/store';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Layout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isLoadingBank = useQuizStore((s) => s.isLoadingBank);
  const isFallbackMode = useQuizStore((s) => s.isFallbackMode);
  const validationSummary = useQuizStore((s) => s.validationSummary);
  const validationIssues = useQuizStore((s) => s.validationIssues);
  const initializeApp = useQuizStore((s) => s.initializeApp);
  const loadFallbackQuestions = useQuizStore((s) => s.loadFallbackQuestions);

  const [dismissTopBanner, setDismissTopBanner] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-40 h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group"
          >
            <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </span>
            <span className="tracking-tight">Programming Quizer</span>
          </Link>

          <div className="flex items-center gap-2">
            {!location.pathname.startsWith('/quiz') && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Admin</span>
              </Link>
            )}

            <motion.button
              type="button"
              onClick={toggleTheme}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="relative w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ y: -14, opacity: 0, rotate: -90, scale: 0.7 }}
                    animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ y: 14, opacity: 0, rotate: 90, scale: 0.7 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="flex items-center justify-center"
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ y: -14, opacity: 0, rotate: 90, scale: 0.7 }}
                    animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ y: 14, opacity: 0, rotate: -90, scale: 0.7 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="flex items-center justify-center"
                  >
                    <Moon className="w-4 h-4 text-slate-700" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Dismissible indicator when running in offline fallback mode */}
      {isFallbackMode && !dismissTopBanner && !location.pathname.startsWith('/quiz') && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex-1 flex items-center justify-center gap-2 text-center">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Cloud Firestore <code>questions</code> collection is not reachable. Running from baseline questions.json.
            </span>
            <Link
              to="/admin"
              className="underline font-semibold hover:text-amber-800 dark:hover:text-amber-200 ml-1"
            >
              Admin Seed
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setDismissTopBanner(true)}
            aria-label="Dismiss banner"
            className="p-1 rounded-md hover:bg-amber-500/20 transition-colors text-amber-700 dark:text-amber-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1">
        {isLoadingBank ? (
          <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-medium">
              Loading quiz...
            </p>
          </div>
        ) : validationSummary ? (
          <div className="max-w-3xl mx-auto px-4 py-12">
            <Card padding="lg" className="border-rose-300 dark:border-rose-800 space-y-4">
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Failed to Load Question Bank
                  </h1>
                  <p className="text-sm text-rose-600 dark:text-rose-400 mt-0.5">
                    {validationSummary}
                  </p>
                </div>
              </div>

              {validationIssues.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs space-y-1.5 max-h-80 overflow-y-auto">
                  {validationIssues.map((issue, idx) => (
                    <div key={idx} className="text-rose-300">
                      •{' '}
                      {issue.questionIndex !== null
                        ? `Question index [${issue.questionIndex}] (id: "${
                            issue.questionId ?? 'unknown'
                          }") -> field "${issue.field}": `
                        : `Field "${issue.field}": `}
                      <span className="text-white">{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => void initializeApp(true)}
                >
                  Retry Firestore
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<FileText className="w-4 h-4" />}
                  onClick={() => void loadFallbackQuestions()}
                >
                  Load Fallback (public/questions.json)
                </Button>
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    Go to Admin to Seed Quiz
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};
