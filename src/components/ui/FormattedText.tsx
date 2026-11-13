import React from 'react';

export interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text with inline `backtick` code spans and automatic RTL/LTR direction (`dir="auto"`).
 */
export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  className = '',
}) => {
  const parts = text.split(/(`[^`]+`)/g);

  return (
    <span dir="auto" className={className}>
      {parts.map((part, idx) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
          const inner = part.slice(1, -1);
          return (
            <code
              key={idx}
              dir="ltr"
              className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[0.9em] bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-slate-200/80 dark:border-slate-700"
            >
              {inner}
            </code>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
};
