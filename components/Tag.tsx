import React from 'react';
import { type TagColor } from '../types';

interface TagProps {
  children: React.ReactNode;
  color?: TagColor;
  className?: string;
}

const Tag: React.FC<TagProps> = ({ children, color = 'slate', className = '' }) => {
  const colorClasses: Record<TagColor, string> = {
    slate: 'bg-slate-100 text-slate-600',
    sky: 'bg-sky-100 text-sky-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    pink: 'bg-pink-100 text-pink-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  );
};

export default Tag;