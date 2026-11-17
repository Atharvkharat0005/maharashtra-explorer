import React, { useEffect, useState } from 'react';
import {
  Crosshair,
  MessageSquare,
  Send,
  Sparkles,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiClient } from '../services/apiClient';

interface MahatripChatDrawerProps {
  activeItinerary: any | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const QUICK_PROMPTS = [
  'What should I visit next?',
  'Find authentic restaurants nearby',
  'Find nearest hospital & police station',
  'Give a rain-safe alternative for today',
  'Modify tomorrow for a relaxed pace',
  'Calculate extra expense if we add a guide'
];

export const MahatripChatDrawer: React.FC<MahatripChatDrawerProps> = ({ activeItinerary }) => {
  const { language: siteLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Marathi'>(
    siteLang === 'mr' ? 'Marathi' : siteLang === 'hi' ? 'Hindi' : 'English'
  );

  useEffect(() => {
    if (siteLang === 'mr') setLanguage('Marathi');
    else if (siteLang === 'hi') setLanguage('Hindi');
    else setLanguage('English');
  }, [siteLang]);
  const [shareGps, setShareGps] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Namaskar! I am MAHATRIP AI, your Maharashtra live travel assistant. Ask me what to visit next, rain-safe alternatives, nearby hospitals, local food, or itinerary adjustments in English, Hindi, or Marathi.'
    }
  ]);

  const toggleGps = () => {
    if (shareGps) {
      setShareGps(false);
      setCoords(null);
      return;
    }
    if (!navigator.geolocation) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Browser geolocation is unavailable. Mention your current town or taluka in your message instead.'
        }
      ]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setShareGps(true);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setShareGps(false);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'Location permission declined. Just tell me which town, fort, or district you are in.'
          }
        ]);
      },
      { timeout: 8000 }
    );
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const updatedHistory: ChatMessage[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.chatMahatrip({
        message: trimmed,
        language,
        tripContext: activeItinerary || undefined,
        userLat: coords?.lat,
        userLng: coords?.lng,
        history: updatedHistory.slice(-8)
      });
      const reply = res?.data?.reply || res?.reply || 'No response received from MAHATRIP AI.';
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `MAHATRIP AI error: ${err?.message || 'Unable to reach assistant service right now.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open MAHATRIP AI Assistant"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#ff6b1a] to-[#ff8c38] text-white font-semibold text-sm shadow-2xl hover:brightness-110 transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>MAHATRIP AI Help</span>
        </button>
      )}

      {/* Drawer Panel */}
      {open && (
        <aside
          aria-label="MAHATRIP AI During-Trip Assistant"
          className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[560px] max-h-[82vh] bg-[#14100d] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#1d1712] border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-orange-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">MAHATRIP AI Assistant</h3>
                <p className="text-[11px] text-stone-400 truncate">
                  {activeItinerary?.title
                    ? `Active Trip: ${activeItinerary.title}`
                    : 'Live Maharashtra Guide'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close MAHATRIP AI Assistant"
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Language & GPS Bar */}
          <div className="px-4 py-2 bg-[#110d0a] border-b border-white/10 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              {(['English', 'Hindi', 'Marathi'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    language === lang
                      ? 'bg-orange-500 text-white'
                      : 'text-stone-400 hover:text-white bg-white/5'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <button
              onClick={toggleGps}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                shareGps
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-stone-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3 h-3" />
              {shareGps ? 'GPS On' : 'Share GPS'}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm ${
                    m.role === 'user'
                      ? 'bg-orange-500 text-white rounded-br-sm'
                      : 'bg-[#1f1914] text-stone-200 border border-white/10 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-stone-400 italic">MAHATRIP AI is checking routes & places...</div>
            )}
          </div>

          {/* Quick Action Suggestions */}
          <div className="px-3 py-2 border-t border-white/10 bg-[#110d0a] flex gap-1.5 overflow-x-auto">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 text-[11px] text-stone-300 transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 bg-[#18130f] border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask MAHATRIP AI (${language})...`}
              className="flex-1 bg-[#110d0a] border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-stone-400 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
};
