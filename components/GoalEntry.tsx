
import React, { useState, useRef } from 'react';
import { ICONS } from '../constants';
import { Goal } from '../types';
import { analyzeImageForGoal } from '../services/geminiService';

interface GoalEntryProps {
  onBack: () => void;
  onGoalBreakdown: (goal: Goal) => void;
}

const CATEGORIES = ['learning', 'projects', 'fitness', 'creativity', 'wellbeing'];

const GoalEntry: React.FC<GoalEntryProps> = ({ onBack, onGoalBreakdown }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('learning');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !topic) return;

    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      category,
      topic,
      notes,
      subTasks: [],
      createdAt: Date.now(),
      status: 'active'
    };
    onGoalBreakdown(newGoal);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await analyzeImageForGoal(base64);
        if (result.title) setTitle(result.title);
        if (result.topic) setTopic(result.topic);
        if (result.category && CATEGORIES.includes(result.category.toLowerCase())) {
          setCategory(result.category.toLowerCase());
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Scan failed", err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-8 py-6 animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
            <ICONS.X />
          </button>
          <h1 className="text-2xl font-bold">Set a New Goal</h1>
        </div>
        
        {/* Visual Scan Button */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/20 transition-all"
        >
          {scanning ? (
            <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <ICONS.Star />
          )}
          {scanning ? 'Looking...' : 'Get Inspiration'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          capture="environment"
          onChange={handleImageUpload} 
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-400">What's the goal?</label>
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Master the guitar"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-400">Type of Journey</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full border text-sm capitalize transition-all ${
                  category === cat ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-400">Specific Area / Topic</label>
          <input 
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Learning jazz scales"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-400">Any extra thoughts?</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="I want to focus on hand coordination..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32"
          />
        </div>

        <button 
          type="submit"
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          Create My Steps
        </button>
      </form>
    </div>
  );
};

export default GoalEntry;
