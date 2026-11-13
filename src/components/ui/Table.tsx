import React from 'react';

export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const TableContainer: React.FC<TableProps> = ({ children, className = '' }) => (
  <div
    className={[
      'w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
      className,
    ].join(' ')}
  >
    <table className="w-full text-left border-collapse text-sm">{children}</table>
  </div>
);
