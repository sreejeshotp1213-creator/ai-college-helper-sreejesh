import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Lightbulb,
  X,
  BookOpen,
  Mic,
  MicOff,
  Compass,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { FeatureType, HistoryItem } from './types';
import { FEATURES, SUBJECT_PRESETS } from './data/features';
import { Header } from './components/Header';
import { FeatureSelector } from './components/FeatureSelector';
import { ResultDisplay } from './components/ResultDisplay';
import { RecentHistoryModal } from './components/RecentHistoryModal';

const HISTORY_STORAGE_KEY = 'college_study_history_v1';

export default function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureType>('ask');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingFollowUp, setLoadingFollowUp] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string>('');
  const [lastSubmittedFeature, setLastSubmittedFeature] = useState<FeatureType>('ask');
  const [error, setError] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Voice Input State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentFeature = FEATURES.find((f) => f.id === activeFeature) || FEATURES[0];

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // Ignore storage read error
    }

    // Check Speech Recognition support (Android Chrome, Desktop Chrome, Edge, Safari)
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

  // Save history to localStorage
  const saveToHistory = (newPrompt: string, newResult: string, feat: FeatureType) => {
    try {
      const newItem: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        prompt: newPrompt,
        result: newResult,
        feature: feat,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...history.filter((h) => h.prompt !== newPrompt)].slice(0, 25);
      setHistory(updated);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage write error
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setResult(item.result);
    setLastSubmittedPrompt(item.prompt);
    setLastSubmittedFeature(item.feature);
    setActiveFeature(item.feature);
    setError(null);
  };

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

  const toggleVoiceInput = async () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Handle browsers that do not support Web Speech API
    if (!SpeechRecognitionAPI) {
      setError('Voice input is not supported in this browser. Please try Google Chrome on Android or desktop, or type your question.');
      return;
    }

    // Prevent multiple instances: if already listening or instance exists, cleanly stop it
    if (isListening || recognitionRef.current) {
      stopVoiceInput();
      return;
    }

    // Request microphone permission explicitly first on supported devices
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (mediaErr: any) {
        if (mediaErr?.name === 'NotAllowedError' || mediaErr?.name === 'PermissionDeniedError') {
          setError('Microphone permission was denied. Please allow microphone access in your Android Chrome site settings or browser address bar.');
          return;
        }
      }
    }

    try {
      // 1. Instantiate browser Web Speech API
      const recognition = new SpeechRecognitionAPI();

      // 2. continuous = false (stops automatically after the phrase)
      recognition.continuous = false;

      // 3. interimResults = false (only emit final transcript, completely preventing duplicate word iterations)
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      // 4. When onresult fires, read ONLY the final recognized transcript from the current result event
      recognition.onresult = (event: any) => {
        let finalTranscript = '';

        if (event.results && event.results.length > 0) {
          // Read the transcript from the current result event
          const latestResult = event.results[event.resultIndex || 0];
          if (latestResult && latestResult[0]?.transcript) {
            finalTranscript = latestResult[0].transcript;
          }
        }

        const trimmed = finalTranscript.trim();
        if (trimmed) {
          // 5. Set the input value to that transcript directly. Do NOT append to previous input value.
          setPrompt(trimmed);
        }

        // 8. Stop recognition after the final result
        try {
          recognition.stop();
        } catch {
          // ignore
        }
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        recognitionRef.current = null;

        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          setError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
        } else if (event?.error === 'no-speech') {
          // User was quiet, finish gracefully without alarm
        } else if (event?.error !== 'aborted') {
          setError(`Microphone note: ${event.error}. You can also type your question.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      // Store active instance to ensure only one runs at a time
      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      recognitionRef.current = null;
      setError('Unable to activate microphone. Please check your browser microphone settings or type your question.');
    }
  };

  const handleFeatureSelect = (newFeature: FeatureType) => {
    setActiveFeature(newFeature);
    setError(null);
    textareaRef.current?.focus();
  };

  const handleUseSample = (sample: string, suggestedFeature?: FeatureType) => {
    setPrompt(sample);
    if (suggestedFeature) {
      setActiveFeature(suggestedFeature);
    }
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = async (overrideFeature?: FeatureType) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError('Please enter a question or topic first.');
      textareaRef.current?.focus();
      return;
    }

    const featureToUse = overrideFeature || activeFeature;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          feature: featureToUse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate response. Please try again.');
      }

      setResult(data.result);
      setLastSubmittedPrompt(trimmedPrompt);
      setLastSubmittedFeature(featureToUse);
      saveToHistory(trimmedPrompt, data.result, featureToUse);
    } catch (err: any) {
      setError(err.message || 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async (followUpText: string) => {
    if (!followUpText.trim() || !result) return;

    setLoadingFollowUp(true);
    setError(null);

    try {
      const response = await fetch('/api/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: followUpText,
          feature: lastSubmittedFeature,
          context: {
            previousPrompt: lastSubmittedPrompt,
            previousAnswer: result,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate follow-up answer.');
      }

      // Append follow-up neatly to current result view
      const combinedResult = `${result}\n\n---\n\n### 💬 Follow-up: *${followUpText}*\n\n${data.result}`;
      setResult(combinedResult);
      saveToHistory(lastSubmittedPrompt, combinedResult, lastSubmittedFeature);
    } catch (err: any) {
      setError(err.message || 'Failed to get follow-up. Please try again.');
    } finally {
      setLoadingFollowUp(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setPrompt('');
    setError(null);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      <Header
        onReset={handleReset}
        showReset={!!result}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      <main className="flex-1 w-full max-w-3xl mx-auto px-3.5 sm:px-6 py-3.5 sm:py-6 flex flex-col justify-start">
        {/* Results Screen */}
        {result ? (
          <ResultDisplay
            prompt={lastSubmittedPrompt}
            result={result}
            feature={lastSubmittedFeature}
            onNewQuestion={handleReset}
            onFollowUp={handleFollowUp}
            loadingFollowUp={loadingFollowUp}
          />
        ) : (
          /* Home Screen: Clean, responsive layout for Android & desktop */
          <div className="space-y-4 sm:space-y-5">
            {/* Friendly Greeting & Intro */}
            <div className="text-center py-1 sm:py-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-2 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5" />
                <span>College Academic Assistant</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                What are you studying today?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                Type any college topic, question, or code to get clear, step-by-step guidance.
              </p>
            </div>

            {/* Input Form Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs transition-shadow">
              {/* Active mode indicator */}
              <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Mode: {currentFeature.title}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 hidden sm:inline truncate max-w-xs">
                  {currentFeature.tagline}
                </span>
              </div>

              {/* Textarea with voice and clear actions */}
              <div className="relative">
                <textarea
                  id="question-input"
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  disabled={loading}
                  placeholder={currentFeature.placeholder}
                  rows={4}
                  className={`w-full text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-slate-50/50 rounded-xl p-3 sm:p-4 pr-16 sm:pr-20 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 focus:bg-white resize-none transition-all disabled:opacity-60 ${
                    isListening ? 'ring-2 ring-rose-400 border-rose-400 bg-rose-50/30' : ''
                  }`}
                  aria-label="Enter your college question or topic"
                />

                {/* Floating action controls (Voice dictation + clear button) */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                  <button
                    id="voice-dictate-btn"
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse shadow-xs ring-2 ring-rose-400'
                        : 'text-slate-500 hover:text-blue-600 bg-white/90 hover:bg-blue-50 border border-slate-200/80 shadow-2xs'
                    }`}
                    title={
                      !speechRecognitionSupported
                        ? 'Voice input not supported in this browser'
                        : isListening
                        ? 'Tap to stop recording'
                        : 'Voice input (Speak your question)'
                    }
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {prompt && !loading && !isListening && (
                    <button
                      id="clear-input-btn"
                      type="button"
                      onClick={() => {
                        setPrompt('');
                        textareaRef.current?.focus();
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 bg-white/80 rounded-lg hover:bg-slate-100 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center border border-slate-200/60"
                      title="Clear text"
                      aria-label="Clear text input"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Listening Voice Indicator */}
              {isListening && (
                <div
                  id="voice-recording-banner"
                  className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-700 font-medium"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                    <span>Listening... Speak your college question or topic now.</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopVoiceInput}
                    className="px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shrink-0 shadow-2xs"
                  >
                    Done Speaking
                  </button>
                </div>
              )}

              {/* Examples chips for current active feature */}
              <div className="mt-2.5 flex items-start gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 shrink-0 mt-1">
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                  Try:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {currentFeature.examples.map((eg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleUseSample(eg)}
                      className="text-left text-[11px] sm:text-xs text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100/80 px-2 py-1 rounded-lg transition-colors truncate max-w-full font-medium"
                    >
                      "{eg.replace(/\n.*/g, '').slice(0, 48)}..."
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Ask AI Button */}
              <div className="mt-4">
                <button
                  id="ask-ai-main-btn"
                  type="button"
                  disabled={loading || !prompt.trim()}
                  onClick={() => handleSubmit(activeFeature)}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 transition-all min-h-[48px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing & generating answer...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-blue-200" />
                      <span>{currentFeature.buttonText}</span>
                      <ArrowRight className="w-4 h-4 text-blue-200 ml-0.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Error Banner */}
              {error && (
                <div
                  id="error-banner"
                  className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{error}</p>
                    <p className="text-rose-600 mt-0.5">Please check your question or try rephrasing.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Subjects Explorer */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  Explore by College Subject
                </span>
                <span className="text-[11px] text-slate-400">1-Tap Prompts</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {SUBJECT_PRESETS.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => handleUseSample(subject.sampleQuery, subject.suggestedFeature)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-xs text-slate-700 font-medium whitespace-nowrap transition-colors touch-manipulation active:scale-[0.98]"
                  >
                    <span>{subject.icon}</span>
                    <span>{subject.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Five Feature Buttons Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
              <FeatureSelector
                activeFeature={activeFeature}
                onSelectFeature={handleFeatureSelect}
                disabled={loading}
              />
            </div>

            {/* About AI College Helper Section */}
            <section
              id="about-ai-college-helper"
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs text-left"
              aria-labelledby="about-section-heading"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <h3 id="about-section-heading" className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  About AI College Helper
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                AI College Helper is a student-focused AI assistant designed to help college students understand topics, create study notes, practice questions, and learn programming.
              </p>
            </section>

            {/* Academic Disclaimer */}
            <div
              id="academic-disclaimer"
              className="p-3 sm:p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-2.5 text-left text-amber-900 text-xs"
              role="note"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px] sm:text-xs text-amber-800">
                <span className="font-semibold text-amber-900">Disclaimer: </span>
                AI-generated answers may contain mistakes. Please verify important academic information with your textbook or teacher.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* History Drawer Modal */}
      <RecentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistory={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
