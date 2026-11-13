import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, AlertCircle } from 'lucide-react';
import { useQuizStore } from './store';
import { useQuizKeyboardShortcuts } from './hooks';
import { Timer } from './Timer';
import { QuestionCard } from './QuestionCard';
import { Navigator } from './Navigator';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const activeSession = useQuizStore((s) => s.activeSession);
  const selectAnswer = useQuizStore((s) => s.selectAnswer);
  const toggleFlag = useQuizStore((s) => s.toggleFlag);
  const goToQuestion = useQuizStore((s) => s.goToQuestion);
  const nextQuestion = useQuizStore((s) => s.nextQuestion);
  const prevQuestion = useQuizStore((s) => s.prevQuestion);
  const submitQuiz = useQuizStore((s) => s.submitQuiz);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!activeSession && !isSubmittingRef.current) {
      navigate('/', { replace: true });
    }
  }, [activeSession, navigate]);

  // Warn before closing/reloading tab during active quiz
  useEffect(() => {
    if (!activeSession) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeSession]);

  const handleFinalSubmit = useCallback(() => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setConfirmOpen(false);
    const result = submitQuiz();
    if (result) {
      navigate('/results', { replace: true });
    }
  }, [submitQuiz, navigate]);

  useQuizKeyboardShortcuts({
    session: activeSession,
    disabled: confirmOpen,
    onSelectAnswer: selectAnswer,
    onNext: nextQuestion,
    onPrev: prevQuestion,
  });

  if (!activeSession) {
    return null;
  }

  const currentItem = activeSession.items[activeSession.currentIndex];
  if (!currentItem) return null;

  const totalQuestions = activeSession.items.length;
  const answeredCount = Object.keys(activeSession.answers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const totalAllocatedSeconds = Math.max(
    1,
    Math.round((activeSession.endTimestamp - activeSession.startedAt) / 1000)
  );

  const isFlagged = activeSession.flaggedIds.includes(currentItem.question.id);
  const selectedAnswer = activeSession.answers[currentItem.question.id];

  return (
    <div className="pb-20 lg:pb-10">
      {/* Sticky Top Quiz Header */}
      <div className="sticky top-16 z-30 bg-bg-primary/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 py-3 mb-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {activeSession.quizTitle}
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                Question {activeSession.currentIndex + 1} / {totalQuestions}
              </span>
            </div>
            <ProgressBar
              current={activeSession.currentIndex + 1}
              total={totalQuestions}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Timer
              endTimestamp={activeSession.endTimestamp}
              totalSeconds={totalAllocatedSeconds}
              onExpire={handleFinalSubmit}
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={() => setConfirmOpen(true)}
            >
              Submit Quiz
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content + Sidebar Navigator */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <QuestionCard
            item={currentItem}
            questionNumber={activeSession.currentIndex + 1}
            totalQuestions={totalQuestions}
            selectedAnswer={selectedAnswer}
            isFlagged={isFlagged}
            onSelectAnswer={(ans) => selectAnswer(currentItem.question.id, ans)}
            onToggleFlag={() => toggleFlag(currentItem.question.id)}
          />

          {/* Bottom Prev / Next Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="secondary"
              disabled={activeSession.currentIndex === 0}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
              onClick={prevQuestion}
            >
              Previous
            </Button>

            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {answeredCount} of {totalQuestions} answered
            </div>

            {activeSession.currentIndex < totalQuestions - 1 ? (
              <Button
                variant="primary"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={nextQuestion}
              >
                Next Question
              </Button>
            ) : (
              <Button
                variant="primary"
                leftIcon={<Send className="w-4 h-4" />}
                onClick={() => setConfirmOpen(true)}
              >
                Finish & Submit
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <Navigator
            items={activeSession.items}
            answers={activeSession.answers}
            flaggedIds={activeSession.flaggedIds}
            currentIndex={activeSession.currentIndex}
            onSelectIndex={goToQuestion}
          />
        </div>
      </div>

      {/* Confirm Submit Modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit Quiz Attempt?"
      >
        <div className="space-y-4">
          {unansweredCount > 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-200">
                <p className="font-semibold">
                  You still have {unansweredCount} unanswered question
                  {unansweredCount === 1 ? '' : 's'}.
                </p>
                <p className="mt-1 text-xs opacity-90">
                  Unanswered questions will be marked incorrect when graded.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              You have answered all {totalQuestions} questions. Ready to lock in
              your answers and view your detailed score breakdown?
            </p>
          )}

          {activeSession.flaggedIds.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Note: You have {activeSession.flaggedIds.length} question
              {activeSession.flaggedIds.length === 1 ? '' : 's'} flagged for
              review.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Keep Reviewing
            </Button>
            <Button variant="primary" onClick={handleFinalSubmit}>
              Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
