import React from 'react';
import { GraduationCap, ArrowUpRight, History, MessageSquare, Clock } from 'lucide-react';
import { ChatSession } from '../types';

interface EmptyChatProps {
  onSelectPrompt: (promptText: string) => void;
  recentSessions?: ChatSession[];
  onSelectSession?: (session: ChatSession) => void;
  onOpenHistory?: () => void;
}

const ACADEMIC_EXAMPLES = [
  {
    title: 'Binary Search Trees',
    subtitle: 'Definition, operations & time complexity',
    query: 'Explain Binary Search Tree (BST) operations, properties, and time complexity with a brief diagram.',
  },
  {
    title: 'OOP Polymorphism',
    subtitle: '5-mark exam-ready answer with code',
    query: 'Provide a 5-mark college exam answer on Polymorphism in Object-Oriented Programming with clean code examples.',
  },
  {
    title: 'Find 2nd Highest Salary',
    subtitle: 'SQL query with DENSE_RANK and subquery',
    query: 'Write the SQL query to find the 2nd highest salary from an Employee table using both DENSE_RANK() and a subquery, and explain how it works.',
  },
  {
    title: 'TCP vs UDP Comparison',
    subtitle: 'Structured university comparison table',
    query: 'Compare TCP vs UDP protocols in a structured college exam comparison table across key networking parameters.',
  },
];

export const EmptyChat: React.FC<EmptyChatProps> = ({
  onSelectPrompt,
  recentSessions = [],
  onSelectSession,
  onOpenHistory,
}) => {
  const displaySessions = recentSessions.slice(0, 2);

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 sm:py-14 max-w-2xl mx-auto w-full animate-in fade-in duration-200">
      {/* Subtle Academic Icon */}
      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs mb-3.5">
        <GraduationCap className="w-6 h-6 text-amber-400" />
      </div>

      {/* Simple Welcome Message */}
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
        How can I help you study?
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
        Ask any college question, paste code, or attach textbook notes and exam papers.
      </p>

      {/* Recent Sessions Quick Resume (if user has saved history) */}
      {displaySessions.length > 0 && onSelectSession && (
        <div className="w-full mt-6 text-left">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3 h-3 text-slate-400" />
              Recent Conversations
            </span>
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                View all ({recentSessions.length})
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {displaySessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session)}
                className="group p-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-3 h-3" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate leading-snug">
                      {session.title}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRelativeTime(session.updatedAt || session.createdAt)}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Academic Example Prompts Grid */}
      <div className="w-full mt-6 text-left">
        {displaySessions.length > 0 && (
          <div className="px-1 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Explore Topics
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
          {ACADEMIC_EXAMPLES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(item.query)}
              className="group p-3 sm:p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition-all cursor-pointer shadow-2xs flex items-start justify-between gap-2"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors leading-snug truncate">
                  {item.title}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {item.subtitle}
                </span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
