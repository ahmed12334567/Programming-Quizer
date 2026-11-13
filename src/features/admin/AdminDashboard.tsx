import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  FileJson,
  Settings as SettingsIcon,
  BarChart3,
  LogOut,
  RefreshCw,
  AlertCircle,
  Cloud,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import type { Question, QuestionBank } from '../../types/quiz';
import { useQuizStore } from '../quiz/store';
import { authService } from './authService';
import { QuestionTable } from './QuestionTable';
import { QuestionForm } from './QuestionForm';
import { ImportExport } from './ImportExport';
import { Settings } from './Settings';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatDuration } from '../../lib/scoring';
import { validateQuestionBankJson } from '../../lib/questionSchema';

type AdminTab = 'questions' | 'import_export' | 'settings' | 'stats';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const bank = useQuizStore((s) => s.bank);
  const isSavingBank = useQuizStore((s) => s.isSavingBank);
  const saveError = useQuizStore((s) => s.saveError);
  const saveSuccessNotice = useQuizStore((s) => s.saveSuccessNotice);
  const clearSaveNotice = useQuizStore((s) => s.clearSaveNotice);
  const saveQuestion = useQuizStore((s) => s.saveQuestion);
  const deleteQuestion = useQuizStore((s) => s.deleteQuestion);
  const saveSettings = useQuizStore((s) => s.saveSettings);
  const updateBank = useQuizStore((s) => s.updateBank);
  const initializeApp = useQuizStore((s) => s.initializeApp);
  const attemptHistory = useQuizStore((s) => s.attemptHistory);

  const [tab, setTab] = useState<AdminTab>('questions');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'quiz-8c17a';
  const firestoreConsoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore`;

  const handleLogout = async () => {
    await authService.logout();
    navigate('/admin/login', { replace: true });
  };

  const handleManualSync = async () => {
    setIsRefreshing(true);
    setActionError(null);
    try {
      await initializeApp(true);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to reload questions from Firestore.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSeedDefaultQuestions = async () => {
    setSeedingLoading(true);
    setActionError(null);
    try {
      const baseUrl = import.meta.env.BASE_URL || './';
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const res = await fetch(`${normalizedBase}questions.json`);
      if (!res.ok) {
        throw new Error(`Failed to fetch default questions.json (HTTP ${res.status})`);
      }
      const rawText = await res.text();
      const validation = validateQuestionBankJson(rawText);
      if (!validation.ok) {
        throw new Error(validation.summary);
      }
      await updateBank(validation.data);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to seed default questions.'
      );
    } finally {
      setSeedingLoading(false);
    }
  };

  const handleSaveQuestion = async (q: Question) => {
    setActionError(null);
    try {
      await saveQuestion(q);
      setModalOpen(false);
      setEditingQuestion(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to save question to Firestore.'
      );
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    setActionError(null);
    try {
      await deleteQuestion(id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to delete question from Firestore.'
      );
    }
  };

  const handleSaveSettings = async (updatedBank: QuestionBank) => {
    setActionError(null);
    try {
      await saveSettings({
        title: updatedBank.title,
        passMark: updatedBank.passMark,
        defaultTimerPerQuestion: updatedBank.defaultTimerPerQuestion ?? 60,
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to save settings to Firestore.'
      );
      throw err;
    }
  };

  const avgScore =
    attemptHistory.length > 0
      ? Math.round(
          attemptHistory.reduce((acc, a) => acc + a.scorePercentage, 0) /
            attemptHistory.length
        )
      : 0;

  if (!bank) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Instructor Admin Portal
          </h1>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={() => void handleLogout()}
          >
            Logout
          </Button>
        </div>

        <Card padding="lg" className="text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No Question Bank Loaded
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Cloud Firestore collection <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">questions</code> has no questions or is not yet initialized.
            </p>
          </div>

          {(actionError || saveError) && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300">
              {actionError || saveError}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              disabled={seedingLoading || isSavingBank}
              leftIcon={
                seedingLoading || isSavingBank ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )
              }
              onClick={() => void handleSeedDefaultQuestions()}
            >
              {seedingLoading || isSavingBank
                ? 'Writing to Firestore...'
                : 'Seed Firestore from questions.json'}
            </Button>
            <Button
              variant="secondary"
              disabled={isRefreshing}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
              onClick={() => void handleManualSync()}
            >
              Retry Connection
            </Button>
          </div>
        </Card>

        <div className="max-w-xl mx-auto">
          <ImportExport
            bank={null}
            onImportBank={updateBank}
            isSaving={isSavingBank}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Instructor Admin Portal
            </h1>
            <Badge variant="emerald" className="hidden sm:inline-flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              <span>Firestore Connected</span>
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            {bank.title} · {bank.questions.length} total questions in Firestore · Pass mark: {bank.passMark}%
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing || isSavingBank}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={() => void handleManualSync()}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh from Firestore'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={() => void handleLogout()}
          >
            Logout
          </Button>
        </div>
      </div>

      {(actionError || saveError) && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 max-w-3xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <div>{actionError || saveError}</div>
              {(actionError || saveError)?.includes('permission') && (
                <div className="text-[11px] text-amber-800 dark:text-amber-300">
                  Make sure you are logged in with an account having the <code>admin: true</code> custom claim or UID allowlist, and that your security rules are deployed.
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={firestoreConsoleUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 font-semibold text-xs hover:bg-amber-300 transition-colors"
            >
              <span>Firebase Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                clearSaveNotice();
              }}
              aria-label="Dismiss notice"
              className="p-1 rounded-md hover:bg-amber-200/60 dark:hover:bg-amber-900/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {saveSuccessNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{saveSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={clearSaveNotice}
            aria-label="Dismiss notice"
            className="p-1 rounded-md hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          {
            id: 'questions' as const,
            label: `Question Bank (${bank.questions.length})`,
            icon: <Database className="w-4 h-4" />,
          },
          {
            id: 'import_export' as const,
            label: 'Import / Export JSON',
            icon: <FileJson className="w-4 h-4" />,
          },
          {
            id: 'settings' as const,
            label: 'Quiz Settings',
            icon: <SettingsIcon className="w-4 h-4" />,
          },
          {
            id: 'stats' as const,
            label: `Local Browser Stats (${attemptHistory.length})`,
            icon: <BarChart3 className="w-4 h-4" />,
          },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === item.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {tab === 'questions' && (
        <QuestionTable
          questions={bank.questions}
          isActionLoading={isSavingBank}
          onAddClick={() => {
            setEditingQuestion(null);
            setModalOpen(true);
          }}
          onEditClick={(q) => {
            setEditingQuestion(q);
            setModalOpen(true);
          }}
          onDeleteClick={(id) => handleDeleteQuestion(id)}
        />
      )}

      {tab === 'import_export' && (
        <ImportExport
          bank={bank}
          onImportBank={updateBank}
          isSaving={isSavingBank}
        />
      )}

      {tab === 'settings' && (
        <Settings
          bank={bank}
          onSaveSettings={handleSaveSettings}
          isSaving={isSavingBank}
        />
      )}

      {tab === 'stats' && (
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Local Browser Attempt Statistics
              </h3>
              <p className="text-xs text-slate-500">
                Attempts stored on this browser device only (via localStorage).
              </p>
            </div>
            <Badge variant="indigo">Avg Score: {avgScore}%</Badge>
          </div>

          {attemptHistory.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No quiz attempts recorded on this browser yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {attemptHistory.map((a) => (
                <div
                  key={a.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-semibold">
                      {a.studentName || 'Anonymous Student'}
                    </span>{' '}
                    · {a.scorePercentage}% ({a.correctCount}/{a.totalQuestions})
                    <div className="text-xs text-slate-500">
                      {new Date(a.completedAt).toLocaleString()} ·{' '}
                      {formatDuration(a.timeTakenSeconds)}
                    </div>
                  </div>
                  <Badge variant={a.passed ? 'emerald' : 'rose'}>
                    {a.passed ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuestion ? `Edit Question ${editingQuestion.id}` : 'Add New Question'}
        maxWidthClass="max-w-2xl"
      >
        <QuestionForm
          initialQuestion={editingQuestion}
          existingIds={bank.questions.map((q) => q.id)}
          onSave={(q) => void handleSaveQuestion(q)}
          onCancel={() => setModalOpen(false)}
          isSaving={isSavingBank}
        />
      </Modal>
    </div>
  );
};
