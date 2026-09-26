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
      return { label: 'Ask AI', icon: <Sparkles className="w-3 h-3 text-blue-600" />, bg: 'bg-blue-50 text-blue-700 border-blue-200/80' };
    case 'explain':
      return { label: 'Explain Topic', icon: <Lightbulb className="w-3 h-3 text-amber-600" />, bg: 'bg-amber-50 text-amber-700 border-amber-200/80' };
    case 'notes':
      return { label: 'Make Notes', icon: <FileText className="w-3 h-3 text-emerald-600" />, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' };
    case 'practice':
      return { label: 'Practice Questions', icon: <GraduationCap className="w-3 h-3 text-purple-600" />, bg: 'bg-purple-50 text-purple-700 border-purple-200/80' };
    case 'code':
      return { label: 'Code Explainer', icon: <Code2 className="w-3 h-3 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80' };
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <History className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Study History</h3>
              <p className="text-[11px] text-slate-500">Saved sessions in browser cache</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer font-medium"
                title="Clear all saved history"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close history dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 bg-slate-50/50">
          {history.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2.5 opacity-30" />
              <p className="text-sm font-semibold text-slate-700">No saved sessions yet</p>
              <p className="text-xs mt-1 text-slate-500 max-w-xs mx-auto">
                Questions, study notes, and code explanations you generate will be recorded here for instant review.
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
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all flex flex-col gap-1.5 shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.bg}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      {timeString}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
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
        <div className="px-5 py-3 border-t border-slate-100 bg-white text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span>Encrypted in local browser storage</span>
          <span className="font-medium text-slate-700">AI College Helper</span>
        </div>
      </div>
    </div>
  );
};
