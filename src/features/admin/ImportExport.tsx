import React, { useState } from 'react';
import { Upload, Download, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import type { QuestionBank, ValidationIssueDetail } from '../../types/quiz';
import { validateQuestionBankJson } from '../../lib/questionSchema';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export interface ImportExportProps {
  bank: QuestionBank | null;
  onImportBank: (newBank: QuestionBank) => Promise<void> | void;
  isSaving?: boolean;
}

export const ImportExport: React.FC<ImportExportProps> = ({
  bank,
  onImportBank,
  isSaving = false,
}) => {
  const [importErrors, setImportErrors] = useState<ValidationIssueDetail[]>([]);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [pendingBank, setPendingBank] = useState<QuestionBank | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = validateQuestionBankJson(text);
      if (res.ok) {
        setImportErrors([]);
        setImportSummary(
          `Valid JSON format! Found ${res.data.questions.length} questions in "${res.data.title}". Click "Apply & Batch Write to Firestore" below to import.`
        );
        setPendingBank(res.data);
      } else {
        setPendingBank(null);
        setImportSummary(res.summary);
        setImportErrors(res.issues);
      }
    } catch (err) {
      setPendingBank(null);
      setImportSummary('Unable to read uploaded file.');
      setImportErrors([
        {
          questionIndex: null,
          questionId: null,
          field: 'file',
          message: err instanceof Error ? err.message : 'Unknown file error',
        },
      ]);
    }
  };

  const handleApply = async () => {
    if (!pendingBank || isSaving) return;
    try {
      await onImportBank(pendingBank);
      setImportSummary(
        `Successfully imported ${pendingBank.questions.length} questions to Cloud Firestore!`
      );
      setPendingBank(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save to Firestore';
      setImportSummary(`Firestore import failed: ${msg}`);
    }
  };

  const handleDownloadJson = () => {
    if (!bank) return;

    // Export in exact same shape as original questions.json
    const exportPayload: QuestionBank = {
      title: bank.title,
      passMark: bank.passMark,
      ...(bank.defaultTimerPerQuestion ? { defaultTimerPerQuestion: bank.defaultTimerPerQuestion } : {}),
      questions: bank.questions.map((q) => {
        if (q.type === 'mcq') {
          return {
            id: q.id,
            type: 'mcq' as const,
            question: q.question,
            ...(q.code ? { code: q.code } : {}),
            options: q.options,
            answer: q.answer,
            ...(q.explanation ? { explanation: q.explanation } : {}),
            ...(q.category ? { category: q.category } : {}),
            ...(q.difficulty ? { difficulty: q.difficulty } : {}),
          };
        }
        return {
          id: q.id,
          type: 'true_false' as const,
          question: q.question,
          ...(q.code ? { code: q.code } : {}),
          answer: q.answer,
          ...(q.explanation ? { explanation: q.explanation } : {}),
          ...(q.category ? { category: q.category } : {}),
          ...(q.difficulty ? { difficulty: q.difficulty } : {}),
        };
      }),
    };

    const formatted = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([formatted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questions.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
          <Upload className="w-4 h-4 text-indigo-500" />
          <span>Import & Bulk-Load to Firestore</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Upload a JSON question bank to validate against the strict Zod schema. Writes in batches of max 500 docs directly to the <code className="font-mono">questions</code> collection and updates quiz settings. Re-importing updates existing IDs in-place without duplicating.
        </p>

        <input
          type="file"
          accept=".json,application/json"
          disabled={isSaving}
          onChange={handleFileUpload}
          className="block w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950/70 dark:file:text-indigo-300 disabled:opacity-50"
        />

        {importSummary && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-2 ${
              pendingBank
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="font-semibold flex items-center gap-1.5">
              {pendingBank ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{importSummary}</span>
            </div>

            {importErrors.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-y-auto font-mono">
                {importErrors.map((err, i) => (
                  <li key={i}>
                    {err.questionIndex !== null
                      ? `Question #${err.questionIndex + 1} (${
                          err.questionId ?? 'no-id'
                        }) [${err.field}]: `
                      : `[${err.field}]: `}
                    {err.message}
                  </li>
                ))}
              </ul>
            )}

            {pendingBank && (
              <Button
                variant="primary"
                size="sm"
                disabled={isSaving}
                leftIcon={isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
                onClick={handleApply}
              >
                {isSaving ? 'Writing Batches to Firestore...' : 'Apply & Batch Write to Firestore'}
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
          <Download className="w-4 h-4 text-indigo-500" />
          <span>Export Question Bank JSON</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Download all questions from Cloud Firestore in the exact same JSON format as the original file, including title, pass mark, categories, and explanations.
        </p>

        <Button
          variant="primary"
          leftIcon={<Download className="w-4 h-4" />}
          disabled={!bank || bank.questions.length === 0 || isSaving}
          onClick={handleDownloadJson}
        >
          Download JSON ({bank?.questions.length ?? 0} Questions)
        </Button>
      </Card>
    </div>
  );
};
