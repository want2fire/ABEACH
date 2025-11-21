
import React from 'react';
import { type TagColor } from '../types';

interface TagProps {
  children: React.ReactNode;
  color?: TagColor;
  className?: string;
  onClick?: () => void;
}

const Tag: React.FC<TagProps> = ({ children, color = 'slate', className = '', onClick }) => {
  // Predefined Sunny Beach Color Palette (Light Mode)
  const predefinedColors: Record<string, string> = {
    slate:  'bg-stone-100 border-stone-200 text-stone-600',
    sky:    'bg-sky-50 border-sky-200 text-sky-700',
    green:  'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber:  'bg-amber-50 border-amber-200 text-amber-700',
    red:    'bg-red-50 border-red-200 text-red-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    pink:   'bg-rose-50 border-rose-200 text-rose-700',
    purple: 'bg-violet-50 border-violet-200 text-violet-700',
  };

  const isPredefined = Object.keys(predefinedColors).includes(color);
  
  // Increased font size from text-[10px] to text-xs
  const baseClasses = `inline-flex items-center justify-center px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border transition-transform ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`;

  if (isPredefined) {
    return (
      <span onClick={onClick} className={`${baseClasses} ${predefinedColors[color]}`}>
        {children}
      </span>
    );
  }

  // Handle custom color strings (Hex, HSL, etc.)
  // We use white text with a shadow for readability on custom solid backgrounds
  return (
    <span 
        onClick={onClick} 
        className={`${baseClasses} border-transparent text-white`}
        style={{ 
            backgroundColor: color,
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}
    >
      {children}
    </span>
  );
};

export default Tag;
