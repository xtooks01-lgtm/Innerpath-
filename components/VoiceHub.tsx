
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { getSearchGroundedInfo } from '../services/geminiService';
import { playTTS } from '../services/audioService';

interface VoiceHubProps {
  onBack: () => void;
}

const VoiceHub: React.FC<VoiceHubProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    setResponse('');
    setSources([]);
    try {
      const result = await getSearchGroundedInfo(query);
      setResponse(result.text);
      setSources(result.sources);
      playTTS(result.text);
    } catch (err) {
      setResponse("I'm having a little trouble finding that right now. Let's try another question or focus on your current goal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6 animate-in zoom-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
          <ICONS.X />
        </button>
        <h1 className="text-2xl font-bold">Ask Rudh-h</h1>
      </div>

      <div className="p-6 bg-indigo-600/10 border border-indigo-500/30 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse">
            <ICONS.Mic />
          </div>
          <span className="text-indigo-400 font-bold">Real-world Wisdom</span>
        </div>
        <p className="text-sm text-slate-400">Ask me anything about your goals, recent news, or just for a bit of motivation.</p>
        
        <div className="relative">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 pr-16 min-h-[120px] focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button 
            onClick={handleAsk}
            disabled={loading}
            className="absolute bottom-4 right-4 p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ICONS.Star />}
          </button>
        </div>
      </div>

      {response && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top duration-700">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">My Thoughts</h3>
            <p className="text-slate-200 leading-relaxed">{response}</p>
          </div>

          {sources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-indigo-400">Where I found this</h4>
              <div className="flex flex-wrap gap-2">
                {sources.map((s, i) => (
                  <a 
                    key={i} 
                    href={s.web?.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-all truncate max-w-[150px]"
                  >
                    {s.web?.title || 'Interesting Link'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceHub;
