import React, { useState } from 'react';
import { ICONS } from '../constants';
import { generateMotivationalVideo } from '../services/geminiService';

interface VideoModalProps {
  goalTitle: string;
  category: string;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ goalTitle, category, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    try {
      // Fixed: Added await to hasSelectedApiKey() check as per guidelines
      if (!(await (window as any).aistudio?.hasSelectedApiKey())) {
        await (window as any).aistudio?.openSelectKey();
      }
      setLoading(true);
      setStatus('Creating a little inspiration for you...');
      const url = await generateMotivationalVideo(goalTitle, category);
      setVideoUrl(url);
    } catch (err) {
      console.error(err);
      // Fixed: Changed to double quotes to avoid issues with the single quote in "Let's"
      setStatus("Something went wrong. Let's try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="max-w-md w-full space-y-8">
        {!videoUrl && !loading && (
          <div className="space-y-6 animate-in zoom-in">
            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/40">
              <ICONS.Star />
            </div>
            <h2 className="text-3xl font-black tracking-tight">See Your Success</h2>
            <p className="text-slate-400 text-sm">Visualize what it feels like to reach your goal. I'll create an inspiring video just for: <br/><span className="text-white font-bold">{goalTitle}</span></p>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Note: This uses a special video engine. Visit <a href="https://ai.google.dev/gemini-api/docs/billing" className="text-indigo-400 underline" target="_blank">billing docs</a> if you need to set up a key.
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleGenerate}
                className="w-full py-5 bg-indigo-600 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
              >
                Create Motivation
              </button>
              <button onClick={onClose} className="py-4 text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Go Back</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-6 animate-in zoom-in">
            <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black">{status}</h3>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.5em] animate-pulse">Creating Magic...</p>
            </div>
            <p className="text-slate-500 text-xs italic">"Focus on the feeling of achievement. It's almost ready."</p>
          </div>
        )}

        {videoUrl && (
          <div className="space-y-6 animate-in zoom-in h-full">
            <div className="relative rounded-[2rem] overflow-hidden bg-black aspect-[9/16] shadow-2xl border border-white/10">
              <video src={videoUrl} autoPlay loop controls className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400"
            >
              Back to My Journey
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoModal;