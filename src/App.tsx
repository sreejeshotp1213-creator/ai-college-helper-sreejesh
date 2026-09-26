import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { AttachedImage, AttachedFile, ChatMessage, ChatSession } from './types';
import { Header } from './components/Header';
import { Composer } from './components/Composer';
import { ConversationView } from './components/ConversationView';
import { EmptyChat } from './components/EmptyChat';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { HistoryModal } from './components/HistoryModal';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Chat History / Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem('ai_college_chat_sessions_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load chat history from localStorage', e);
    }
    return [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Attachments
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name?: string } | null>(null);

  // Voice Input State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Streaming abort controller (for ChatGPT-style stop button)
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check Speech Recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechRecognitionSupported(!!SpeechRecognitionAPI);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Auto scroll to bottom smoothly
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || loading || isStreaming) {
      scrollToBottom();
    }
  }, [messages, loading, isStreaming, scrollToBottom]);

  // Stop generating (ChatGPT-style stop button)
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setLoading(false);
  };

  // Helper to persist/update a chat session in history
  const saveSession = useCallback((sessionId: string, currentMessages: ChatMessage[], initialTitle?: string) => {
    if (!currentMessages || currentMessages.length === 0) return;

    setSessions((prevSessions) => {
      const now = Date.now();
      const existingIndex = prevSessions.findIndex((s) => s.id === sessionId);

      let title = initialTitle;
      if (!title) {
        const firstUserMsg = currentMessages.find((m) => m.role === 'user');
        title = firstUserMsg?.content?.trim() || 'Study Session';
      }
      if (title.length > 50) {
        title = title.slice(0, 48) + '…';
      }

      let updatedList: ChatSession[];
      if (existingIndex >= 0) {
        const existing = prevSessions[existingIndex];
        const updated: ChatSession = {
          ...existing,
          title: existing.title || title,
          messages: currentMessages,
          updatedAt: now,
        };
        updatedList = [updated, ...prevSessions.filter((s) => s.id !== sessionId)];
      } else {
        const newSession: ChatSession = {
          id: sessionId,
          title,
          messages: currentMessages,
          createdAt: now,
          updatedAt: now,
        };
        updatedList = [newSession, ...prevSessions];
      }

      try {
        localStorage.setItem('ai_college_chat_sessions_v1', JSON.stringify(updatedList));
      } catch (e) {
        console.error('Failed to persist chat sessions to localStorage', e);
      }

      return updatedList;
    });
  }, []);

  const handleSelectSession = (session: ChatSession) => {
    if (loading || isStreaming) {
      handleStopGenerating();
    }
    setActiveSessionId(session.id);
    setMessages(session.messages || []);
    setPrompt('');
    setAttachedImage(null);
    setAttachedFile(null);
    setError(null);
    setIsHistoryOpen(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      try {
        localStorage.setItem('ai_college_chat_sessions_v1', JSON.stringify(filtered));
      } catch (e) {
        console.error('Failed to delete chat session from localStorage', e);
      }
      return filtered;
    });

    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const handleClearAllHistory = () => {
    setSessions([]);
    try {
      localStorage.removeItem('ai_college_chat_sessions_v1');
    } catch (e) {
      console.error('Failed to clear chat sessions from localStorage', e);
    }
    setActiveSessionId(null);
    setMessages([]);
    setIsHistoryOpen(false);
  };

  // Submit query with full multi-turn conversational history like ChatGPT
  const handleSubmit = async (overridePrompt?: string) => {
    const textToSubmit = (overridePrompt !== undefined ? overridePrompt : prompt).trim();

    if (!textToSubmit && !attachedImage && !attachedFile) {
      setError('Please type your question, attach a study photo, or upload a document.');
      return;
    }

    const currentImg = attachedImage;
    const currentFile = attachedFile;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: textToSubmit,
      feature: 'ask',
      image: currentImg ? { previewUrl: currentImg.previewUrl, name: currentImg.name } : undefined,
      file: currentFile ? { name: currentFile.name, size: currentFile.size, mimeType: currentFile.mimeType } : undefined,
      timestamp: Date.now(),
    };

    // Determine session ID and append user message immediately
    const sessionId = activeSessionId || `session_${Date.now()}`;
    if (!activeSessionId) {
      setActiveSessionId(sessionId);
    }

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveSession(sessionId, updatedMessages, textToSubmit);

    setPrompt('');
    setAttachedImage(null);
    setAttachedFile(null);
    setLoading(true);
    setIsStreaming(false);
    setError(null);

    // Multi-turn history: send all previous turns so AI has full context memory like ChatGPT
    const history = messages
      .filter((m) => m.content && m.content.trim())
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const payload = {
      prompt: textToSubmit,
      history,
      image: currentImg
        ? {
            data: currentImg.data,
            mimeType: currentImg.mimeType,
            name: currentImg.name,
          }
        : undefined,
      file: currentFile
        ? {
            data: currentFile.data,
            text: currentFile.text,
            mimeType: currentFile.mimeType,
            name: currentFile.name,
          }
        : undefined,
    };

    const assistantMsgId = `a-${Date.now()}`;
    let assistantMessageCreated = false;

    // Create abort controller for stop generating capability
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 1. SSE Streaming for instant ChatGPT-like streaming experience
      const response = await fetch('/api/assist-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                if (data.chunk) {
                  accumulatedContent += data.chunk;
                  if (!assistantMessageCreated) {
                    assistantMessageCreated = true;
                    setIsStreaming(true);
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: assistantMsgId,
                        role: 'assistant',
                        content: accumulatedContent,
                        feature: 'ask',
                        timestamp: Date.now(),
                      },
                    ]);
                  } else {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMsgId ? { ...msg, content: accumulatedContent } : msg
                      )
                    );
                  }
                } else if (data.done) {
                  if (data.fullText && !assistantMessageCreated) {
                    accumulatedContent = data.fullText;
                    assistantMessageCreated = true;
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: assistantMsgId,
                        role: 'assistant',
                        content: accumulatedContent,
                        feature: 'ask',
                        timestamp: Date.now(),
                      },
                    ]);
                  }
                } else if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e: any) {
                if (e.message && e.message !== 'Unexpected end of JSON input') {
                  throw e;
                }
              }
            }
          }
        }

        if (accumulatedContent.trim().length > 0) {
          const finalAssistantMsg: ChatMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: accumulatedContent,
            feature: 'ask',
            timestamp: Date.now(),
          };
          saveSession(sessionId, [...updatedMessages, finalAssistantMsg]);
          setIsStreaming(false);
          setLoading(false);
          abortControllerRef.current = null;
          return;
        }
      }

      // 2. Fallback to standard endpoint if streaming body was unavailable
      const fallbackRes = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const fallbackData = await fallbackRes.json();
      if (!fallbackRes.ok) {
        throw new Error(fallbackData.error || 'Failed to generate answer.');
      }

      const finalAssistantContent = fallbackData.result || '';
      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: finalAssistantContent,
        feature: 'ask',
        timestamp: Date.now(),
      };

      if (!assistantMessageCreated) {
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: finalAssistantContent } : msg
          )
        );
      }
      saveSession(sessionId, [...updatedMessages, assistantMessage]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User clicked stop generating, perfectly normal
        console.log('Stream stopped by user');
      } else {
        console.error(err);
        setError(err.message || 'Network error. Please check your connection and try again.');
      }
    } finally {
      setIsStreaming(false);
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response (ChatGPT-style)
  const handleRegenerate = async () => {
    if (loading || isStreaming) return;

    // Find the last assistant message and previous user message
    const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user');
    if (lastUserIndex === -1) return;

    const sessionId = activeSessionId || `session_${Date.now()}`;
    if (!activeSessionId) setActiveSessionId(sessionId);

    const lastUserMessage = messages[lastUserIndex];
    // Remove the latest assistant message from state
    const trimmedMessages = messages.slice(0, lastUserIndex + 1);
    setMessages(trimmedMessages);
    setLoading(true);
    setIsStreaming(false);
    setError(null);

    // Prepare conversational history before this question
    const history = messages
      .slice(0, lastUserIndex)
      .filter((m) => m.content && m.content.trim())
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const payload = {
      prompt: lastUserMessage.content,
      history,
    };

    const assistantMsgId = `a-${Date.now()}`;
    let assistantMessageCreated = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/assist-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                if (data.chunk) {
                  accumulatedContent += data.chunk;
                  if (!assistantMessageCreated) {
                    assistantMessageCreated = true;
                    setIsStreaming(true);
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: assistantMsgId,
                        role: 'assistant',
                        content: accumulatedContent,
                        feature: 'ask',
                        timestamp: Date.now(),
                      },
                    ]);
                  } else {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMsgId ? { ...msg, content: accumulatedContent } : msg
                      )
                    );
                  }
                }
              } catch {
                // ignore json error
              }
            }
          }
        }

        if (accumulatedContent.trim().length > 0) {
          const finalRegenMsg: ChatMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: accumulatedContent,
            feature: 'ask',
            timestamp: Date.now(),
          };
          saveSession(sessionId, [...trimmedMessages, finalRegenMsg]);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to regenerate response.');
      }
    } finally {
      setIsStreaming(false);
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Voice Input (Speech Recognition) Logic
  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleVoiceInput = () => {
    // If already listening, stop current session
    if (isListening) {
      stopVoiceInput();
      return;
    }

    if (typeof window === 'undefined') return;

    // 1. Use the browser Web Speech API: SpeechRecognition or webkitSpeechRecognition
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // 10. If speech recognition is unsupported, show a friendly message
    if (!SpeechRecognitionAPI) {
      setError('Voice speech recognition is not supported in this browser. Please try Google Chrome, Microsoft Edge, or Apple Safari.');
      return;
    }

    // 7. Prevent multiple SpeechRecognition instances from running at the same time
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognitionAPI();

      // 2. Set continuous = false
      recognition.continuous = false;

      // 3. Set interimResults = false
      recognition.interimResults = false;

      recognition.maxAlternatives = 1;
      recognition.lang = navigator?.language || 'en-US';

      // 9. The microphone button should show a listening state while listening
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      // 6. Each microphone session must produce the sentence only once
      let hasProcessedResult = false;

      // 4. When onresult fires, read ONLY the final recognized transcript from the current result event
      recognition.onresult = (event: any) => {
        if (hasProcessedResult) return;

        let finalTranscript = '';
        if (event.results && event.results.length > 0) {
          const lastResult = event.results[event.results.length - 1];
          if (lastResult && lastResult[0] && typeof lastResult[0].transcript === 'string') {
            finalTranscript = lastResult[0].transcript.trim();
          }
        }

        if (finalTranscript) {
          hasProcessedResult = true;
          // 5. Set the input value to that transcript using the React state setter. Do NOT append the transcript to the previous input value.
          setPrompt(finalTranscript);
        }

        // 8. Stop recognition after the final result
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone access was denied. Please allow microphone permissions in your browser settings.');
        } else if (event.error === 'no-speech') {
          // User did not speak; stop cleanly without alerting an error
        } else if (event.error !== 'aborted') {
          setError(`Speech recognition encountered an issue (${event.error}). Please try again.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      recognitionRef.current = null;
      setError('Could not access microphone for voice input. Please check microphone permissions.');
    }
  };

  // Reset conversation to start fresh
  const handleResetChat = () => {
    if (loading || isStreaming) {
      handleStopGenerating();
    }
    setActiveSessionId(null);
    setMessages([]);
    setPrompt('');
    setAttachedImage(null);
    setAttachedFile(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white sm:bg-slate-50/50 text-slate-900 flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header with branding & reset action */}
      <Header
        onReset={handleResetChat}
        showReset={messages.length > 0}
        onOpenHistory={() => setIsHistoryOpen(true)}
        sessionCount={sessions.length}
      />

      {/* 2. Chat / Conversation Area (The Main Focus) */}
      <main className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Error Notification Banner */}
        {error && (
          <div className="w-full max-w-3xl mx-auto px-3.5 sm:px-6 pt-2">
            <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-start gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-semibold text-rose-900 mr-1.5">Notice:</span>
                  <span className="text-rose-700 leading-relaxed break-words">{error}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      handleRegenerate();
                    }}
                    className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-500 hover:text-rose-800 p-1 rounded-md hover:bg-rose-100 shrink-0 cursor-pointer"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Conversation Viewport */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto flex flex-col">
          {messages.length === 0 && !loading ? (
            /* Empty Screen: Simple, Spacious Welcome with Example Prompts & Recent Sessions */
            <EmptyChat
              onSelectPrompt={(promptText) => handleSubmit(promptText)}
              recentSessions={sessions}
              onSelectSession={handleSelectSession}
              onOpenHistory={() => setIsHistoryOpen(true)}
            />
          ) : (
            /* Active Conversation Thread */
            <>
              <ConversationView
                messages={messages}
                loading={loading}
                isStreaming={isStreaming}
                onViewImage={(url, name) => setPreviewImage({ url, name })}
                onRegenerate={handleRegenerate}
              />
              <div ref={messagesEndRef} className="h-4" />
            </>
          )}
        </div>

        {/* 3. Bottom Pinned Chat Input Area */}
        <div className="sticky bottom-0 z-20 pb-3 pt-2 px-3 sm:px-6 bg-gradient-to-t from-white via-white/95 to-transparent sm:from-slate-50/95 sm:via-slate-50/80">
          <Composer
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={() => handleSubmit()}
            onStop={handleStopGenerating}
            loading={loading || isStreaming}
            attachedImage={attachedImage}
            setAttachedImage={setAttachedImage}
            attachedFile={attachedFile}
            setAttachedFile={setAttachedFile}
            onOpenCamera={() => setIsCameraOpen(true)}
            isListening={isListening}
            toggleVoiceInput={toggleVoiceInput}
            speechRecognitionSupported={speechRecognitionSupported}
            onClearError={() => setError(null)}
            onError={(msg) => setError(msg)}
          />
        </div>
      </main>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(captured) => {
          setAttachedImage(captured);
          setError(null);
        }}
      />

      {/* Image Fullscreen Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImage?.url || null}
        imageName={previewImage?.name}
        onClose={() => setPreviewImage(null)}
      />

      {/* Chat History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllHistory}
        onNewChat={handleResetChat}
      />
    </div>
  );
}
