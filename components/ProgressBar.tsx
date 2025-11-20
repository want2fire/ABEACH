
import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
        style={{ 
            width: `${safeProgress}%`,
            background: 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)'
        }}
      ></div>
    </div>
  );
};

export default ProgressBar;
