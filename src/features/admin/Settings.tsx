import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import type { QuestionBank } from '../../types/quiz';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export interface SettingsProps {
  bank: QuestionBank;
  onSaveSettings: (updated: QuestionBank) => Promise<void> | void;
  isSaving?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  bank,
  onSaveSettings,
  isSaving = false,
}) => {
  const [title, setTitle] = useState(bank.title);
  const [passMark, setPassMark] = useState(bank.passMark);
  const [defaultTimer, setDefaultTimer] = useState(
    bank.defaultTimerPerQuestion ?? 60
  );
  const [savedNotice, setSavedNotice] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setErrorNotice(null);
    try {
      await onSaveSettings({
        ...bank,
        title: title.trim() || 'Programming Assessment',
        passMark: Math.min(100, Math.max(1, passMark)),
        defaultTimerPerQuestion: Math.min(600, Math.max(10, defaultTimer)),
      });
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  return (
    <Card padding="lg" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Course Quiz Configuration
        </h3>
        <p className="text-xs text-slate-500">
          Settings are saved to Firestore document <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">settings/quiz</code> and apply to all students immediately.
        </p>

        <div>
          <label className="block text-xs font-semibold mb-1">Quiz Title</label>
          <input
            type="text"
            value={title}
            disabled={isSaving}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">
              Pass Mark (%)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={passMark}
              disabled={isSaving}
              onChange={(e) => setPassMark(Number(e.target.value) || 60)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Default Per-Question Timer (seconds)
            </label>
            <input
              type="number"
              min={10}
              max={600}
              value={defaultTimer}
              disabled={isSaving}
              onChange={(e) => setDefaultTimer(Number(e.target.value) || 60)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            Question Count Mode (Dynamic)
          </label>
          <div className="flex items-center gap-2">
            <Badge variant="emerald">Dynamic Slider & Stepper</Badge>
            <Badge variant="indigo">Presets (10, 20, 30, 50, 75, 100)</Badge>
            <Badge variant="neutral">All Available Pool</Badge>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Students can choose any exact number of questions up to the total available in selected units.
          </span>
        </div>

        {errorNotice && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300">
            {errorNotice}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            leftIcon={
              isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )
            }
          >
            {isSaving ? 'Saving to Firestore...' : 'Save Settings to Firestore'}
          </Button>
          {savedNotice && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Saved directly to Firestore!
            </span>
          )}
        </div>
      </form>
    </Card>
  );
};
