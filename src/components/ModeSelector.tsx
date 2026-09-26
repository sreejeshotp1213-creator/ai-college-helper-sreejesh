import React from 'react';
import { Sparkles, Lightbulb, FileText, GraduationCap, Code2 } from 'lucide-react';
import { FeatureType } from '../types';

interface ModeSelectorProps {
  activeMode: FeatureType;
  onSelectMode: (mode: FeatureType) => void;
  disabled?: boolean;
}

interface ModeItem {
  id: FeatureType;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
}

const MODES: ModeItem[] = [
  {
    id: 'ask',
    label: 'Ask Question',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    activeClass: 'bg-blue-600 text-white shadow-xs border-blue-600',
  },
  {
    id: 'explain',
    label: 'Explain Topic',
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    activeClass: 'bg-amber-600 text-white shadow-xs border-amber-600',
  },
  {
    id: 'notes',
    label: 'Study Notes',
    icon: <FileText className="w-3.5 h-3.5" />,
    activeClass: 'bg-emerald-600 text-white shadow-xs border-emerald-600',
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: <GraduationCap className="w-3.5 h-3.5" />,
    activeClass: 'bg-purple-600 text-white shadow-xs border-purple-600',
  },
  {
    id: 'code',
    label: 'Explain Code',
    icon: <Code2 className="w-3.5 h-3.5" />,
    activeClass: 'bg-indigo-600 text-white shadow-xs border-indigo-600',
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeMode,
  onSelectMode,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      {/* Compact Horizontal Buttons / Chips */}
      <div 
        className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none touch-pan-x"
        role="tablist"
        aria-label="AI Study Assistant Modes"
      >
        {MODES.map((mode) => {
          const isActive = mode.id === activeMode;
          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => onSelectMode(mode.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border shrink-0 ${
                isActive
                  ? mode.activeClass
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/90 shadow-2xs'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className={isActive ? 'text-white' : 'text-slate-500'}>
                {mode.icon}
              </span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
