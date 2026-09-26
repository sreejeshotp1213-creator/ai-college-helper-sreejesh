import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  X,
  Trash2,
  Search,
  MessageSquare,
  Plus,
  Clock,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { ChatSession } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
  onNewChat: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAll,
  onNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset confirmation state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmClear(false);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter sessions by search term
  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sessions;

    return sessions.filter((session) => {
      if (!session) return false;
      const title = session.title || '';
      if (title.toLowerCase().includes(query)) return true;
      return (session.messages || []).some((msg) =>
        msg && typeof msg.content === 'string' && msg.content.toLowerCase().includes(query)
      );
    });
  }, [sessions, searchQuery]);

  // Group filtered sessions by timeframe
  const groupedSessions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfLastWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const last7Days: ChatSession[] = [];
    const older: ChatSession[] = [];

    filteredSessions.forEach((s) => {
      if (!s) return;
      const time = s.updatedAt || s.createdAt || 0;
      if (time >= startOfToday) {
        today.push(s);
      } else if (time >= startOfYesterday) {
        yesterday.push(s);
      } else if (time >= startOfLastWeek) {
        last7Days.push(s);
      } else {
        older.push(s);
      }
    });

    const groups: { label: string; items: ChatSession[] }[] = [];
    if (today.length > 0) groups.push({ label: 'Today', items: today });
    if (yesterday.length > 0) groups.push({ label: 'Yesterday', items: yesterday });
    if (last7Days.length > 0) groups.push({ label: 'Previous 7 Days', items: last7Days });
    if (older.length > 0) groups.push({ label: 'Older Conversations', items: older });

    return groups;
  }, [filteredSessions]);

  const formatTime = (timestamp?: number) => {
    if (!timestamp || isNaN(timestamp)) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const cleanPreview = (text?: string) => {
    if (!text || typeof text !== 'string') return 'No messages yet';
    return text.replace(/[#*`_~>\-[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[88vh] sm:max-h-[82vh] overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <History className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 id="history-dialog-title" className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Chat History
              </h3>
              <p className="text-[11px] text-slate-500">
                {sessions.length === 1 ? '1 saved session' : `${sessions.length} saved sessions`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">New Chat</span>
            </button>

            {sessions.length > 0 && (
              <>
                {confirmClear ? (
                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClearAll();
                        setConfirmClear(false);
                      }}
                      className="text-[11px] font-semibold text-rose-700 hover:bg-rose-100 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      Confirm Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="text-[11px] text-slate-500 hover:bg-slate-100 px-1.5 py-1 rounded transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Clear all chat history"
                    aria-label="Clear all chat history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input Bar (only shown if sessions exist or search query active) */}
        {sessions.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history by topic or question..."
                className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-8.5 pr-8 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* History List Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 bg-slate-50/40">
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6 opacity-60" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No chat history yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Your study conversations, code explanations, and practice questions will automatically appear here.
              </p>
              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start a conversation</span>
              </button>
            </div>
          ) : groupedSessions.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-700">No matching conversations found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different term</p>
            </div>
          ) : (
            groupedSessions.map((group) => (
              <div key={group.label} className="space-y-1.5">
                <div className="px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.label}
                </div>
                <div className="space-y-1.5">
                  {group.items.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const lastMessage = session.messages[session.messages.length - 1];
                    const hasImage = session.messages.some((m) => !!m.image);
                    const hasFile = session.messages.some((m) => !!m.file);

                    return (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        className={`group relative w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer shadow-2xs ${
                          isActive
                            ? 'bg-blue-50/70 border-blue-200 ring-1 ring-blue-300/60'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-800'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-700 truncate leading-snug">
                                {session.title}
                              </span>
                              {isActive && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded-md shrink-0">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Active
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                              {lastMessage ? cleanPreview(lastMessage.content) : 'Empty session'}
                            </p>

                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formatTime(session.updatedAt || session.createdAt)}
                              </span>
                              <span>•</span>
                              <span>
                                {session.messages.length} {session.messages.length === 1 ? 'message' : 'messages'}
                              </span>
                              {(hasImage || hasFile) && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                                    {hasImage && <ImageIcon className="w-2.5 h-2.5" />}
                                    {hasFile && <FileText className="w-2.5 h-2.5" />}
                                    Attachment
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                            title="Delete this chat"
                            aria-label={`Delete chat: ${session.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors opacity-60 group-hover:opacity-100" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-white text-[11px] text-slate-500 flex items-center justify-between">
          <span>Saved locally in your browser</span>
          <span className="font-medium text-slate-700">AI College Helper</span>
        </div>
      </div>
    </div>
  );
};
