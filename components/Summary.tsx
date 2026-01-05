
import React, { useEffect, useState } from 'react';
import { Goal } from '../types';
import { ICONS } from '../constants';
import { playTTS } from '../services/audioService';

interface SummaryProps {
  goal: Goal;
  onDone: () => void;
}

const Summary: React.FC<SummaryProps> = ({ goal, onDone }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      playTTS(`Great work on finishing ${goal.title}. I'm so proud of your progress!`);
    }, 2000);
    return () => clearTimeout(timer);
  }, [goal]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="w-12 h-12 border-b-2 border-indigo-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Looking back on your journey...</p>
      </div>
    );
  }

  return (
    <div className="py-10 space-y-12 animate-in fade-in zoom-in h-full flex flex-col items-center">
      <div className="text-center space-y-2">
        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Goal Reached</div>
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full" />
          <h1 className="text-5xl font-black text-white leading-tight uppercase tracking-tighter">You<br/>Did It!</h1>
        </div>
        <p className="text-slate-500 font-bold text-sm mt-4">{goal.title}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full px-4">
        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl text-center space-y-1">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Focus Level</p>
          <p className="text-3xl font-black text-white">High</p>
        </div>
        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl text-center space-y-1">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Experience</p>
          <p className="text-3xl font-black text-indigo-400">+100</p>
        </div>
      </div>

      <div className="flex-1 w-full px-4">
        <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ICONS.Star /> Rudh-h's Celebration
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed italic">
            "You've shown such wonderful focus today. By taking it one step at a time, 
            you've made real progress in ${goal.category}. I'm excited to see where you go from here!"
          </p>
        </div>
      </div>

      <div className="w-full px-4 pt-6">
        <button 
          onClick={onDone}
          className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 rounded-[2rem] font-black text-xl uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/20"
        >
          Back to My Journey
        </button>
      </div>
    </div>
  );
};

export default Summary;
