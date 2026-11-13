import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { authService } from '../features/admin/authService';
import type { AdminSession } from '../types/quiz';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<AdminSession | null | undefined>(
    undefined
  );

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((currentSession) => {
      setSession(currentSession);
    });
    return () => unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Checking admin session...</p>
      </div>
    );
  }

  // Not signed in at all -> redirect to login
  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  // Signed in, but missing server-verifiable admin privilege
  if (!session.isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card padding="lg" className="text-center space-y-4 border-rose-200 dark:border-rose-900 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Access Denied: Admin Privileges Required
            </h2>
            <p className="text-xs text-slate-500">
              Signed in as <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{session.email}</span>.
            </p>
          </div>
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl">
            This account does not have the custom claim <code>admin: true</code> or UID allowlist configuration required to access the instructor portal.
          </p>
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={() => void authService.logout()}
            >
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
