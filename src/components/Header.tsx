import React from 'react';
import { GraduationCap, RotateCcw, History } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  showReset?: boolean;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  showReset = false,
  onOpenHistory,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 py-2.5 sm:px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              AI College Helper
            </h1>
            <p className="text-[11px] sm:text-xs text-blue-600 font-semibold tracking-tight">
              Built by Sreejesh • BCA Student
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="header-history-btn"
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 bg-slate-100/80 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors min-h-[36px] sm:min-h-[40px]"
            title="Saved study history"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="bg-blue-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>

          {showReset && (
            <button
              id="header-reset-btn"
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-100/80 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors min-h-[36px] sm:min-h-[40px]"
              title="Start new question"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

