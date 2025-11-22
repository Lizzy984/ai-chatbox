import React, { useState, useRef, useCallback } from 'react';
import { ConnectionState, TranscriptItem, ResourceItem } from './types';
import { GeminiLiveService } from './services/geminiLiveService';
import { ResourceCard } from './components/ResourceCard';
import { Visualizer } from './components/Visualizer';
import { ChatInterface } from './components/ChatInterface';

// Static Resources Data
const RESOURCES: ResourceItem[] = [
  {
    title: "Digital Privacy Checkup",
    description: "Learn how to secure your social media accounts, lock down privacy settings, and turn off location tracking.",
    icon: "🔒",
    link: "https://safety.google/security/privacy/"
  },
  {
    title: "Identifying Cyberstalking",
    description: "Understand the signs of online monitoring and what to do if you suspect your device is being tracked.",
    icon: "👁️",
    link: "https://www.techsafety.org/resources"
  },
  {
    title: "Safe Browsing Habits",
    description: "Tips on using Incognito mode, clearing history, and avoiding phishing attempts.",
    icon: "🌐",
    link: "https://staysafeonline.org/"
  }
];

const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Service reference
  const liveServiceRef = useRef<GeminiLiveService | null>(null);

  const handleStart = useCallback(async () => {
    if (!liveServiceRef.current) {
      liveServiceRef.current = new GeminiLiveService();
    }
    
    setError(null);
    await liveServiceRef.current.connect({
      onStateChange: setConnectionState,
      onTranscript: (item) => {
        setTranscripts(prev => [...prev, item]);
      },
      onError: (err) => {
        setError(err);
      }
    });
  }, []);

  const handleStop = useCallback(() => {
    if (liveServiceRef.current) {
      liveServiceRef.current.disconnect();
      setConnectionState(ConnectionState.DISCONNECTED);
    }
  }, []);

  // Quick Exit feature for safety
  const handleQuickExit = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">SafeSpace</h1>
          </div>
          
          <button 
            onClick={handleQuickExit}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
            title="Leave this site immediately"
          >
            <span>🚪</span> Quick Exit
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col max-w-5xl mx-auto w-full px-4 py-6 gap-6">
        
        {/* Intro Hero */}
        <div className="text-center py-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
            Digital Safety & Support
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Your private, compassionate AI companion for navigating digital literacy and safety. 
            Talk to us about online security, privacy, or finding support resources.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] min-h-[500px]">
          
          {/* Left Column: Voice Interface */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col relative">
            {/* Status Bar */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-white to-transparent">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connectionState === ConnectionState.CONNECTED ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {connectionState === ConnectionState.CONNECTED ? 'Live Audio' : 'Ready to connect'}
                </span>
              </div>
            </div>

            {/* Visualizer Area */}
            <div className="flex-grow bg-gradient-to-b from-brand-50/50 to-white flex flex-col items-center justify-center relative">
               {error && (
                 <div className="absolute top-16 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm border border-red-100">
                   {error}
                 </div>
               )}
               <Visualizer state={connectionState} />
            </div>

            {/* Controls */}
            <div className="p-6 bg-white border-t border-slate-100 flex flex-col items-center gap-3 z-20">
              {connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR ? (
                 <button
                   onClick={handleStart}
                   className="bg-brand-600 hover:bg-brand-700 text-white text-lg font-semibold py-3 px-8 rounded-full shadow-lg shadow-brand-200 transition-all transform hover:scale-105 flex items-center gap-2"
                 >
                   <span>🎙️</span> Start Conversation
                 </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-lg font-semibold py-3 px-8 rounded-full shadow-lg transition-all flex items-center gap-2"
                >
                  <span>⏹️</span> End Session
                </button>
              )}
              <p className="text-xs text-slate-400">
                Using Gemini 2.5 Live API. Microphone required.
              </p>
            </div>
          </div>

          {/* Right Column: Transcript */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-semibold text-slate-700">Transcript</h3>
             </div>
             <div className="flex-grow overflow-hidden relative">
               <ChatInterface transcripts={transcripts} />
             </div>
          </div>
        </div>

        {/* Resources Section */}
        <div className="py-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span>📚</span> Essential Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {RESOURCES.map((r, i) => (
              <ResourceCard key={i} resource={r} />
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 mb-2">
            SafeSpace is an AI-powered educational tool. It is not a replacement for professional counseling or emergency services.
          </p>
          <p className="text-sm font-bold text-brand-700">
            If you are in immediate danger, please call your local emergency number (e.g., 911) immediately.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
