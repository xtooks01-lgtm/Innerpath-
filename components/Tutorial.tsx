
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface TutorialProps {
  onComplete: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to InnerPath",
      desc: "I am your AI mentor. I help you break complex goals into 5 actionable steps.",
      icon: "✨"
    },
    {
      title: "XP & Timers",
      desc: "Complete tasks before the timer ends to earn XP. Miss them, and your progress takes a hit.",
      icon: "⏳"
    },
    {
      title: "Daily Timetable",
      desc: "Plan your entire day. Disciplined schedules lead to mastery.",
      icon: "📅"
    },
    {
      title: "Recovery Mode",
      desc: "Having a bad day? I'll adjust your plan to protect your streaks and minimize XP loss.",
      icon: "🛡️"
    }
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 space-y-8 animate-in zoom-in duration-500">
      <div className="w-24 h-24 bg-indigo-600/20 rounded-full flex items-center justify-center text-5xl mb-4 border border-indigo-500/30">
        {steps[step].icon}
      </div>
      
      <div className="text-center space-y-4 max-w-xs">
        <h2 className="text-3xl font-black">{steps[step].title}</h2>
        <p className="text-slate-400 text-lg">{steps[step].desc}</p>
      </div>

      <div className="flex gap-4 w-full max-w-xs">
        {step < steps.length - 1 ? (
          <>
            <button onClick={onComplete} className="flex-1 py-4 text-slate-500 font-bold">Skip</button>
            <button 
              onClick={() => setStep(step + 1)} 
              className="flex-1 py-4 bg-indigo-600 rounded-2xl font-bold"
            >
              Next
            </button>
          </>
        ) : (
          <button 
            onClick={onComplete} 
            className="w-full py-4 bg-indigo-600 rounded-2xl font-bold text-lg"
          >
            Get Started
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {steps.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'w-6 bg-indigo-500' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
};

export default Tutorial;
