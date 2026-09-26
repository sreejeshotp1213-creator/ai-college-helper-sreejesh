import React from 'react';
import { History, ChevronRight } from 'lucide-react';
import { HistoryItem } from '../types';

interface RecentConversationsControlProps {
  history: HistoryItem[];
  onOpenHistory: () => void;
}

export const RecentConversationsControl: React.FC<RecentConversationsControlProps> = ({
  history,
  onOpenHistory,
}) => {
  const latest = history && history.length > 0 ? history[0] : null;

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const nowD = new Date(now);
    const itemD = new Date(timestamp);

    const isToday =
      nowD.getDate() === itemD.getDate() &&
      nowD.getMonth() === itemD.getMonth() &&
      nowD.getFullYear() === itemD.getFullYear();

    if (isToday) return 'Today';

    const yesterdayD = new Date(now);
    yesterdayD.setDate(yesterdayD.getDate() - 1);
    const isYesterday =
      yesterdayD.getDate() === itemD.getDate() &&
      yesterdayD.getMonth() === itemD.getMonth() &&
      yesterdayD.getFullYear() === itemD.getFullYear();

    if (isYesterday) return 'Yesterday';

    return itemD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getCleanTitle = (text: string) => {
    if (!text) return 'Conversation';
    const singleLine = text.replace(/[\n\r]+/g, ' ').trim();
    if (singleLine.length <= 24) return singleLine;
    return singleLine.slice(0, 22) + '…';
  };

  return (
    <button
      id="recent-conversations-control"
      type="button"
      onClick={onOpenHistory}
      className="group inline-flex items-center gap-2 text-left py-1.5 px-2 -ml-1 rounded-xl hover:bg-slate-200/60 active:bg-slate-200 transition-all cursor-pointer touch-manipulation max-w-full"
      title={latest ? `Open recent chat: ${latest.prompt}` : 'Open conversation history'}
      aria-label="Recent Conversations"
    >
      <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors border border-slate-200/80">
        <History className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col min-w-0 leading-tight">
        <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-700 tracking-tight">
          Recent Conversations
        </span>
        <span className="text-xs font-medium text-slate-800 group-hover:text-blue-700 truncate max-w-[200px] xs:max-w-[240px] sm:max-w-xs transition-colors">
          {latest
            ? `${getCleanTitle(latest.prompt)} • ${formatRelativeTime(latest.timestamp)}`
            : 'No recent chats'}
        </span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0 opacity-60 group-hover:opacity-100 ml-0.5" />
    </button>
  );
};
