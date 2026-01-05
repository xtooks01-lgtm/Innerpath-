
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12 animate-in fade-in duration-1000">
      <div className="text-center space-y-2">
        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Let's Get Started</div>
        <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          INNERPATH
        </h1>
        <p className="text-slate-500 font-medium">Your Personal Guide to Growth</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">What's your name?</label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name / Nickname"
            className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-center text-2xl font-black focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
            autoFocus
            required
          />
        </div>
        <button 
          type="submit"
          className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 rounded-3xl font-black text-xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          Begin My Journey
        </button>
      </form>
    </div>
  );
};

export default Onboarding;
