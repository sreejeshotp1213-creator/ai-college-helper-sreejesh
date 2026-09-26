import React from 'react';
import { GraduationCap, Plus, History } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  showReset?: boolean;
  onOpenHistory: () => void;
  sessionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  showReset = false,
  onOpenHistory,
  sessionCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-6 py-2.5 shadow-2xs">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2.5 text-left cursor-pointer group transition-all"
          title="New Chat"
          aria-label="AI College Helper Home"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:bg-amber-500 transition-colors">
            <GraduationCap className="w-4 h-4 text-amber-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
              AI College Helper
            </h1>
            <span className="text-[11px] text-slate-500 font-normal mt-0.5">
              AI Study Assistant
            </span>
          </div>
        </button>

        {/* Right action controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="header-history-btn"
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 px-2.5 py-1.5 rounded-lg transition-all shadow-2xs touch-manipulation cursor-pointer"
            title="Open chat history"
            aria-label="Open chat history"
          >
            <History className="w-3.5 h-3.5 text-slate-600" />
            <span>History</span>
            {sessionCount > 0 && (
              <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full text-[10px] min-w-[18px] text-center border border-slate-200/60">
                {sessionCount}
              </span>
            )}
          </button>

          {showReset && (
            <button
              id="header-reset-btn"
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 px-2.5 py-1.5 rounded-lg transition-all shadow-2xs touch-manipulation cursor-pointer"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden xs:inline">New Chat</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
