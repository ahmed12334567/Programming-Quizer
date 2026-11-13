import React, { useEffect } from 'react';
import { AppProviders } from './providers';
import { AppRouter } from './router';
import { useQuizStore } from '../features/quiz/store';

export const App: React.FC = () => {
  const initializeApp = useQuizStore((s) => s.initializeApp);

  useEffect(() => {
    void initializeApp();
  }, [initializeApp]);

  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};

export default App;
