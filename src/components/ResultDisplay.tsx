import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Copy,
  Check,
  Sparkles,
  Lightbulb,
  FileText,
  GraduationCap,
  Code2,
  ArrowLeft,
  Volume2,
  VolumeX,
  Share2,
  Download,
  Send,
  Loader2,
  HelpCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { FeatureType } from '../types';
import { FEATURES } from '../data/features';

interface ResultDisplayProps {
  prompt: string;
  result: string;
  feature: FeatureType;
  onNewQuestion: () => void;
  onFollowUp: (followUpText: string) => Promise<void>;
  loadingFollowUp?: boolean;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  prompt,
  result,
  feature,
  onNewQuestion,
  onFollowUp,
  loadingFollowUp = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const [copiedCodeText, setCopiedCodeText] = useState<string | null>(null);

  const currentFeature = FEATURES.find((f) => f.id === feature) || FEATURES[0];

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
      // Prime voices
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Split text into chunks < 200 characters at sentence boundaries for Chrome/Safari safety
  const splitTextIntoSpeechChunks = (text: string): string[] => {
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted for audio. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~#>[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return [];

    const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if ((currentChunk + ' ' + trimmed).trim().length <= 180) {
        currentChunk = (currentChunk + ' ' + trimmed).trim();
      } else {
        if (currentChunk) chunks.push(currentChunk);
        if (trimmed.length > 180) {
          // split long sentence by comma or clause
          const subparts = trimmed.split(/,\s+/);
          let subChunk = '';
          for (const sp of subparts) {
            if ((subChunk + ', ' + sp).trim().length <= 180) {
              subChunk = (subChunk ? subChunk + ', ' : '') + sp;
            } else {
              if (subChunk) chunks.push(subChunk);
              subChunk = sp;
            }
          }
          if (subChunk) currentChunk = subChunk;
          else currentChunk = '';
        } else {
          currentChunk = trimmed;
        }
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = result;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = async (codeText: string) => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopiedCodeText(codeText);
      setTimeout(() => setCopiedCodeText(null), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = codeText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCodeText(codeText);
      setTimeout(() => setCopiedCodeText(null), 2000);
    }
  };

  const handleToggleSpeech = () => {
    if (!speechSupported || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const chunks = splitTextIntoSpeechChunks(result);
    if (chunks.length === 0) return;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex'))) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;

    let index = 0;
    setIsSpeaking(true);

    const speakNextChunk = () => {
      if (index >= chunks.length) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        index++;
        if (index < chunks.length) {
          speakNextChunk();
        } else {
          setIsSpeaking(false);
        }
      };

      utterance.onerror = (e) => {
        // If user cancelled, don't keep speaking
        if (e.error === 'canceled' || e.error === 'interrupted') {
          setIsSpeaking(false);
          return;
        }
        index++;
        if (index < chunks.length) {
          speakNextChunk();
        } else {
          setIsSpeaking(false);
        }
      };

      // Periodic resume trick to prevent Chromium GC freeze on long speech
      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    };

    speakNextChunk();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AI College Helper: ${prompt.slice(0, 40)}`,
          text: `Question: ${prompt}\n\nExplanation:\n${result}`,
        });
      } catch {
        // user dismissed or cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([`# ${prompt}\n\nMode: ${currentFeature.title}\nDate: ${new Date().toLocaleDateString()}\n\n---\n\n${result}`], {
      type: 'text/markdown;charset=utf-8',
    });
    element.href = URL.createObjectURL(file);
    const sanitizedTitle = prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
    element.download = `${sanitizedTitle || 'college_notes'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSendFollowUp = async (textToSend?: string) => {
    const text = (textToSend || followUpInput).trim();
    if (!text || loadingFollowUp) return;
    setFollowUpInput('');
    await onFollowUp(text);
  };

  const getBadgeIcon = () => {
    switch (feature) {
      case 'ask':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'explain':
        return <Lightbulb className="w-3.5 h-3.5" />;
      case 'notes':
        return <FileText className="w-3.5 h-3.5" />;
      case 'practice':
        return <GraduationCap className="w-3.5 h-3.5" />;
      case 'code':
        return <Code2 className="w-3.5 h-3.5" />;
    }
  };

  const quickFollowUps = [
    { label: '💡 Give an everyday analogy', query: 'Can you give an everyday real-world analogy to make this even easier to grasp?' },
    { label: '📝 3 Key Takeaways', query: 'Please summarize this into 3 high-yield bullet points for fast exam revision.' },
    { label: '❓ Test me on this', query: 'Ask me 2 quick follow-up questions to test if I really understood this concept.' },
    { label: '🔍 Common mistake to avoid', query: 'What is the #1 mistake or misconception college students make with this topic in exams?' },
  ];

  return (
    <div id="ai-result-section" className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          id="back-to-input-btn"
          type="button"
          onClick={onNewQuestion}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl min-h-[38px] shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>New Question</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white shadow-2xs">
            {getBadgeIcon()}
            {currentFeature.shortLabel}
          </span>

          {speechSupported && (
            <button
              id="speech-toggle-btn"
              type="button"
              onClick={handleToggleSpeech}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl min-h-[38px] border transition-all cursor-pointer shadow-2xs ${
                isSpeaking
                  ? 'bg-blue-600 text-white border-blue-600 animate-pulse'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title={isSpeaking ? 'Stop audio' : 'Listen to explanation (Text to Speech)'}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline">{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
            </button>
          )}

          <button
            id="share-result-btn"
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-xl min-h-[38px] shadow-2xs transition-all cursor-pointer"
            title="Share with study group"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            id="download-note-btn"
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-xl min-h-[38px] shadow-2xs transition-all cursor-pointer"
            title="Save as study note (.md)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export .md</span>
          </button>

          <button
            id="copy-result-btn"
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-xl min-h-[38px] shadow-2xs transition-all cursor-pointer"
            title="Copy answer to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Query Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Academic Inquiry
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Prompt Context</span>
        </div>
        <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed text-sm sm:text-base border-l-2 border-slate-300 pl-3 py-0.5">
          {prompt}
        </p>
      </div>

      {/* Formatted Answer Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="markdown-content text-slate-800 text-sm sm:text-base leading-relaxed space-y-3">
          <Markdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-5 mb-2.5 pb-1.5 border-b border-slate-200/90 tracking-tight">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2 flex items-center gap-2 tracking-tight">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm sm:text-base font-bold text-slate-800 mt-3 mb-1.5 tracking-tight">
                  {children}
                </h3>
              ),
              p: ({ children }) => <p className="mb-3 leading-relaxed text-slate-800">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1.5 mb-3 pl-1 sm:pl-2 text-slate-700">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1.5 mb-3 pl-1 sm:pl-2 text-slate-700">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-bold text-slate-900">{children}</strong>
              ),
              pre: ({ children }) => <>{children}</>,
              code: ({ children, className }) => {
                const codeString = String(children || '').replace(/\n$/, '');
                const isBlock = className || (typeof children === 'string' && children.includes('\n'));
                if (isBlock) {
                  return (
                    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-[#0d1117] text-slate-100 shadow-sm">
                      {/* Code Header Bar */}
                      <div className="flex items-center justify-between px-3.5 py-2 bg-[#161b22] border-b border-slate-800 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                          </div>
                          <span className="font-mono text-slate-300 font-medium pl-1">Code Block</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(codeString)}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-white px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer text-xs"
                        >
                          {copiedCodeText === codeString ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-4 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed">
                        <code>{children}</code>
                      </div>
                    </div>
                  );
                }
                return (
                  <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-blue-700 font-mono text-xs sm:text-sm border border-slate-200 font-medium">
                    {children}
                  </code>
                );
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-600 pl-4 py-2 my-3.5 bg-blue-50/40 rounded-r-xl text-slate-700 italic text-sm sm:text-base">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-3.5 border border-slate-200 rounded-xl shadow-2xs">
                  <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="bg-slate-100/90 px-3.5 py-2.5 text-left font-bold text-slate-800 text-xs uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-3.5 py-2.5 border-t border-slate-200 text-slate-700">
                  {children}
                </td>
              ),
            }}
          >
            {result}
          </Markdown>
        </div>
      </div>

      {/* Follow-Up Questions Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Need Clarification or More Practice?
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Follow-Up Clarifications</span>
        </div>

        {/* Quick follow up prompt chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickFollowUps.map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loadingFollowUp}
              onClick={() => handleSendFollowUp(item.query)}
              className="text-left text-xs font-medium text-slate-700 hover:text-blue-800 bg-slate-50 hover:bg-blue-50/70 p-2.5 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all disabled:opacity-50 touch-manipulation cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom follow up input */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="follow-up-input"
            type="text"
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendFollowUp();
              }
            }}
            disabled={loadingFollowUp}
            placeholder="Ask a follow-up question or request more details..."
            className="flex-1 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:bg-white transition-all disabled:opacity-60 text-slate-900 placeholder:text-slate-400"
          />
          <button
            id="send-followup-btn"
            type="button"
            disabled={loadingFollowUp || !followUpInput.trim()}
            onClick={() => handleSendFollowUp()}
            className="bg-slate-900 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px] shrink-0 cursor-pointer shadow-xs"
          >
            {loadingFollowUp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Academic Disclaimer */}
      <div
        id="result-academic-disclaimer"
        className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-left text-amber-900 text-xs"
        role="note"
      >
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px] sm:text-xs text-amber-800">
          <strong className="font-semibold text-amber-950">Academic Disclaimer: </strong>
          AI-generated responses are intended for study assistance and conceptual understanding. Please verify critical course material, formulas, and definitions with your official textbook or professor.
        </p>
      </div>
    </div>
  );
};
