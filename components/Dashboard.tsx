
import React from 'react';
import { UserProfile } from '../types';
import { BADGES, ICONS } from '../constants';

interface DashboardProps {
  user: UserProfile;
  onNewGoal: () => void;
  onOpenTimetable: () => void;
  onOpenVoice: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, onNewGoal, onOpenTimetable, onOpenVoice, soundEnabled, setSoundEnabled 
}) => {
  return (
    <div className="space-y-8 py-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">InnerPath</h1>
          <p className="text-slate-400">Welcome back, {user.name}</p>
        </div>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
        >
          {soundEnabled ? <ICONS.Volume2 /> : <ICONS.VolumeX />}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
          <span className="text-sm text-slate-400 uppercase tracking-widest font-semibold">XP Level {user.level}</span>
          <span className="text-4xl font-black mt-1">{user.xp}</span>
          <div className="w-full bg-white/10 h-1.5 mt-4 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-1000" 
              style={{ width: `${(user.xp % 100)}%` }}
            />
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
          <span className="text-sm text-slate-400 uppercase tracking-widest font-semibold">Streak</span>
          <span className="text-4xl font-black mt-1 flex items-center gap-2">
            {user.streak} <ICONS.Star />
          </span>
          <span className="text-xs text-indigo-400 mt-4">Keep it up!</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={onNewGoal}
          className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20"
        >
          <ICONS.Award /> Start New Goal
        </button>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onOpenTimetable}
            className="py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold flex items-center justify-center gap-2"
          >
            <ICONS.Calendar /> Timetable
          </button>
          <button 
            onClick={onOpenVoice}
            className="py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold flex items-center justify-center gap-2"
          >
            <ICONS.Mic /> Voice AI
          </button>
        </div>
      </div>

      {/* Badges Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ICONS.Award /> Achievements
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {BADGES.map((badge) => (
            <div 
              key={badge.id}
              className={`flex-shrink-0 w-24 h-32 rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${
                user.badges.includes(badge.id) 
                ? 'bg-indigo-500/10 border-indigo-500/30' 
                : 'bg-white/5 border-white/10 grayscale opacity-50'
              }`}
            >
              <span className="text-3xl mb-1">{badge.icon}</span>
              <span className="text-[10px] font-bold leading-tight">{badge.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
