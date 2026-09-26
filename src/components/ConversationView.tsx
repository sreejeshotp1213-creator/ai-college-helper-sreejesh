import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  GraduationCap,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Download,
  RotateCcw,
  CheckCircle2,
  FileText,
  FileCode,
  Loader2,
  ZoomIn,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ConversationViewProps {
  messages: ChatMessage[];
  loading: boolean;
  isStreaming?: boolean;
  onViewImage: (url: string, name?: string) => void;
  onRegenerate?: () => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  messages,
  loading,
  isStreaming = false,
  onViewImage,
  onRegenerate,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeText, setCopiedCodeText] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
      window.speechSynthesis.getVoices();
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyCode = async (codeText: string) => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopiedCodeText(codeText);
      setTimeout(() => setCopiedCodeText(null), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = codeText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedCodeText(codeText);
      setTimeout(() => setCopiedCodeText(null), 2000);
    }
  };

  const handleToggleSpeech = (messageId: string, text: string) => {
    if (!speechSupported || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~#>[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 1500));
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadNote = (message: ChatMessage) => {
    const markdownContent = `# AI College Helper Answer\n\nDate: ${new Date(message.timestamp).toLocaleString()}\n\n---\n\n${message.content}`;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `study_answer_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (messages.length === 0 && !loading) {
    return null;
  }

  // Find the last assistant message index for showing the regenerate action button
  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  return (
    <div className="w-full max-w-3xl mx-auto px-3.5 sm:px-6 py-4 space-y-6">
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const isLastAssistant = index === lastAssistantIndex;

        if (isUser) {
          return (
            <div key={message.id} className="flex justify-end w-full pl-6 sm:pl-16 animate-in fade-in duration-150">
              {/* User Message Bubble in Pale Blue */}
              <div className="bg-[#e8f0fe] border border-[#d2e3fc] text-slate-900 rounded-2xl rounded-br-xs px-4 py-3 shadow-2xs max-w-[88%] sm:max-w-[80%] flex flex-col gap-2">
                {/* Attached Image */}
                {message.image && (
                  <div className="relative rounded-xl overflow-hidden border border-blue-200/80 bg-white/70 max-w-xs">
                    <img
                      src={message.image.previewUrl}
                      alt={message.image.name || 'Attached study image'}
                      className="max-h-48 w-auto object-cover rounded-lg cursor-pointer"
                      onClick={() => onViewImage(message.image!.previewUrl, message.image!.name)}
                    />
                    <button
                      type="button"
                      onClick={() => onViewImage(message.image!.previewUrl, message.image!.name)}
                      className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white p-1 rounded text-[10px] flex items-center gap-1 px-1.5 cursor-pointer hover:bg-blue-600 transition-colors"
                      title="View full image"
                    >
                      <ZoomIn className="w-3 h-3" />
                      <span>Expand</span>
                    </button>
                  </div>
                )}

                {/* Attached File */}
                {message.file && (
                  <div className="flex items-center gap-2 bg-white/90 border border-blue-200 rounded-xl p-2 text-left max-w-xs">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      {message.file.mimeType.includes('pdf') ? (
                        <FileText className="w-3.5 h-3.5" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {message.file.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatFileSize(message.file.size)} • {message.file.mimeType.includes('pdf') ? 'PDF' : 'Code'}
                      </span>
                    </div>
                  </div>
                )}

                {/* User Prompt Text */}
                {message.content && (
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words text-slate-900">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          );
        }

        // Assistant Message (ChatGPT style spacious response)
        const isSpeaking = speakingMessageId === message.id;
        const isCopied = copiedId === message.id;
        const isActivelyStreaming = isStreaming && isLastAssistant;

        return (
          <div key={message.id} className="flex justify-start w-full pr-2 sm:pr-8 animate-in fade-in duration-150">
            <div className="w-full space-y-2">
              {/* Header / Assistant Identity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    AI College Helper
                  </span>
                </div>
              </div>

              {/* Clean Markdown Content Area */}
              <div className="pl-0 sm:pl-8 text-slate-800 text-sm sm:text-base leading-relaxed space-y-3">
                <Markdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200 tracking-tight">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-3.5 mb-1.5 tracking-tight">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-2.5 mb-1 tracking-tight">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-2.5 leading-relaxed text-slate-800">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-outside space-y-1 mb-3 pl-5 text-slate-800">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-outside space-y-1 mb-3 pl-5 text-slate-800">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-slate-900">{children}</strong>
                    ),
                    table: ({ children }) => (
                      <div className="my-3 overflow-x-auto rounded-xl border border-slate-200">
                        <table className="min-w-full text-left text-xs sm:text-sm divide-y divide-slate-200">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-slate-50 text-slate-700 font-semibold">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-slate-800 border-t border-slate-100">{children}</td>
                    ),
                    tr: ({ children }) => (
                      <tr className="hover:bg-slate-50/70 transition-colors">{children}</tr>
                    ),
                    pre: ({ children }) => <>{children}</>,
                    code: ({ children, className }) => {
                      const codeString = String(children || '').replace(/\n$/, '');
                      const isBlock = className || (typeof children === 'string' && children.includes('\n'));
                      if (isBlock) {
                        return (
                          <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-[#0d1117] text-slate-100 shadow-xs">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-slate-800 text-[11px] text-slate-400">
                              <span className="font-mono text-slate-300 text-[11px]">
                                {className?.replace('language-', '') || 'code'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(codeString)}
                                className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer text-[11px]"
                              >
                                {copiedCodeText === codeString ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400 font-medium">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="p-3.5 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed">
                              <code>{children}</code>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-xs border border-slate-200/80">
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </Markdown>

                {/* ChatGPT-style streaming cursor indicator */}
                {isActivelyStreaming && (
                  <span className="inline-block w-2 h-4 ml-0.5 bg-slate-800 animate-pulse align-middle rounded-xs" />
                )}
              </div>

              {/* Bottom Action Toolbar (ChatGPT-style) */}
              <div className="pl-0 sm:pl-8 pt-1 flex items-center gap-1 text-slate-400">
                {/* Copy response */}
                <button
                  type="button"
                  onClick={() => handleCopyMessage(message.id, message.content)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  title="Copy answer"
                  aria-label="Copy answer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] text-emerald-600 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>

                {/* Regenerate button (ChatGPT-style) on the latest response */}
                {isLastAssistant && !loading && onRegenerate && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                    title="Regenerate response"
                    aria-label="Regenerate response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Regenerate</span>
                  </button>
                )}

                {/* Read aloud audio */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => handleToggleSpeech(message.id, message.content)}
                    className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs ${
                      isSpeaking ? 'text-blue-600 bg-blue-50' : ''
                    }`}
                    title={isSpeaking ? 'Stop audio' : 'Listen'}
                    aria-label="Listen to answer"
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-blue-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{isSpeaking ? 'Stop' : 'Read'}</span>
                  </button>
                )}

                {/* Download note */}
                <button
                  type="button"
                  onClick={() => handleDownloadNote(message)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  title="Export markdown"
                  aria-label="Export markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Export</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Immediate small loading/thinking indicator */}
      {loading && !isStreaming && (
        <div className="flex items-center gap-2.5 py-2 pl-0 sm:pl-8 animate-in fade-in duration-150">
          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span className="text-xs font-medium text-slate-600">
              Thinking...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
