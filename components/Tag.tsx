
import React from 'react';
import { type TagColor } from '../types';

interface TagProps {
  children: React.ReactNode;
  color?: TagColor;
  className?: string;
}

const Tag: React.FC<TagProps> = ({ children, color = 'slate', className = '' }) => {
  // Sunny Beach Color Palette (Light Mode)
  // bg: pastel/light, border: subtle, text: dark & readable
  const colorClasses: Record<TagColor, string> = {
    slate:  'bg-stone-100 border-stone-200 text-stone-600',
    sky:    'bg-sky-50 border-sky-200 text-sky-700',
    green:  'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber:  'bg-amber-50 border-amber-200 text-amber-700',
    red:    'bg-red-50 border-red-200 text-red-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    pink:   'bg-rose-50 border-rose-200 text-rose-700',
    purple: 'bg-violet-50 border-violet-200 text-violet-700',
  };

  return (
    <span className={`inline-flex items-center justify-center px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  );
};

export default Tag;
