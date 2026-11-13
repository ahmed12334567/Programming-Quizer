import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  itemPreview?: {
    id: string;
    text?: string;
    badge?: string;
  };
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemPreview,
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  useEffect(() => {
    if (!isOpen || isLoading) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !isLoading && onClose()}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  variant === 'danger'
                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 ring-8 ring-rose-50 dark:ring-rose-950/30'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 ring-8 ring-amber-50 dark:ring-amber-950/30'
                }`}
              >
                {variant === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1 pt-1 min-w-0 flex-1">
                <h3
                  id="confirm-dialog-title"
                  className="text-lg font-bold text-slate-900 dark:text-slate-100"
                >
                  {title}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {message}
                </div>
              </div>
            </div>

            {itemPreview && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    ID: {itemPreview.id}
                  </span>
                  {itemPreview.badge && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                      {itemPreview.badge}
                    </span>
                  )}
                </div>
                {itemPreview.text && (
                  <p className="line-clamp-2 text-slate-700 dark:text-slate-300 font-medium">
                    {itemPreview.text}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                disabled={isLoading}
                onClick={onClose}
              >
                {cancelText}
              </Button>
              <Button
                variant="danger"
                disabled={isLoading}
                leftIcon={
                  isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )
                }
                onClick={onConfirm}
              >
                {isLoading ? 'Deleting...' : confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

