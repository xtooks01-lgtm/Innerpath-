
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { ICONS } from '../constants';
import { GoogleGenAI, Chat } from "@google/genai";
import { playTTS } from '../services/audioService';
import { SYSTEM_PERSONA } from '../services/geminiService';
import LiveSession from './LiveSession';

interface MentorProps {
  user: UserProfile;
}

const Mentor: React.FC<MentorProps> = ({ user }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>(() => {
    const saved = localStorage.getItem('innerpath_mentor_history');
    return saved ? JSON.parse(saved) : [{ role: 'ai', text: `Greetings, ${user.name}. I am Rudh-h. How can I facilitate your growth today?` }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Convert local state to Gemini chat history format
    const historyContext = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    })).slice(-10); // Last 10 messages for context

    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: historyContext,
      config: {
        systemInstruction: SYSTEM_PERSONA + " Remember recent context to provide cohesive, human-like guidance. Be warm and encouraging.",
        thinkingConfig: { thinkingBudget: 0 }
      },
    });
  }, [user.name]);

  useEffect(() => {
    localStorage.setItem('innerpath_mentor_history', JSON.stringify(messages.slice(-20)));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !chatRef.current) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      const aiText = response.text || "I'm focusing on your next step. Take a breath and let's move forward.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      playTTS(aiText);
    } catch (err) {
      const fallback = "I had a momentary glitch, but I'm here now. Every small step matters.";
      setMessages(prev => [...prev, { role: 'ai', text: fallback }]);
      playTTS(fallback);
    } finally {
      setLoading(false);
    }
  };

  if (isLive) {
    return <LiveSession onBack={() => setIsLive(false)} user={user} />;
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <header className="py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ICONS.Mic />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight uppercase">RUDH-H</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Active Connection</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsLive(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/30"
        >
          <ICONS.Star /> Live Sync
        </button>
      </header>

      <div className="flex-1 overflow-y-auto py-6 space-y-6 scroll-smooth px-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed border transition-all ${
              m.role === 'user' 
              ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none' 
              : 'bg-[#1e293b]/50 border-white/10 text-slate-200 rounded-tl-none backdrop-blur-sm shadow-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <div className="w-1 h-3 bg-indigo-500 rounded-full animate-pulse" />
              <div className="w-1 h-3 bg-indigo-500 rounded-full animate-pulse [animation-delay:0.2s]" />
              <div className="w-1 h-3 bg-indigo-500 rounded-full animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="py-6 pt-2">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
          <div className="relative flex gap-2">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Talk to Rudh-h..."
              className="flex-1 bg-[#1e293b] border border-white/10 rounded-2xl p-4 outline-none focus:border-indigo-500 transition-all text-sm placeholder:text-slate-600"
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="bg-indigo-600 px-6 rounded-2xl hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              <ICONS.Star />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-center text-slate-600 mt-4 font-bold uppercase tracking-widest">Shared Wisdom Journey</p>
      </div>
    </div>
  );
};

export default Mentor;
