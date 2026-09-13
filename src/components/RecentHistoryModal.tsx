import React from 'react';
import { History, X, Trash2, ArrowUpRight, Sparkles, Lightbulb, FileText, GraduationCap, Code2 } from 'lucide-react';
import { HistoryItem, FeatureType } from '../types';

interface RecentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

const getFeatureBadge = (feature: FeatureType) => {
  switch (feature) {
    case 'ask':
      return { label: 'Ask AI', icon: <Sparkles className="w-3 h-3 text-blue-600" />, bg: 'bg-blue-50 text-blue-700' };
    case 'explain':
      return { label: 'Explain Topic', icon: <Lightbulb className="w-3 h-3 text-amber-600" />, bg: 'bg-amber-50 text-amber-700' };
    case 'notes':
      return { label: 'Make Notes', icon: <FileText className="w-3 h-3 text-emerald-600" />, bg: 'bg-emerald-50 text-emerald-700' };
    case 'practice':
      return { label: 'Practice Questions', icon: <GraduationCap className="w-3 h-3 text-purple-600" />, bg: 'bg-purple-50 text-purple-700' };
    case 'code':
      return { label: 'Code Explainer', icon: <Code2 className="w-3 h-3 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-700' };
  }
};

export const RecentHistoryModal: React.FC<RecentHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistory,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Study History</h3>
            <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                title="Clear all history"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-slate-600">No saved questions yet</p>
              <p className="text-xs mt-1 text-slate-400">
                Questions you ask will appear here so you can review notes anytime.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const badge = getFeatureBadge(item.feature);
              const timeString = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectHistory(item);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/40 transition-all flex flex-col gap-1.5 shadow-2xs group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${badge.bg}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      {timeString}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                    {item.prompt}
                  </p>

                  <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                    {item.result.replace(/[#*`_]/g, '')}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center text-[11px] text-slate-400">
          Saved locally on your device for fast review
        </div>
      </div>
    </div>
  );
};
