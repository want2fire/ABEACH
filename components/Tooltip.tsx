
import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 z-50 font-bold tracking-wide shadow-lg">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-stone-800"></span>
      </span>
    </div>
  );
};

export default Tooltip;
