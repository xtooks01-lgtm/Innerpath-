
import React from 'react';
import { UserProfile } from '../types';
import { BADGES, ICONS } from '../constants';

interface ProfileTabProps {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, onUpdateUser }) => {
  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-indigo-600 border-4 border-white/10 flex items-center justify-center text-4xl font-black shadow-2xl">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-white">{user.name}</h2>
          <div className="flex items-center gap-2 justify-center mt-1">
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase text-indigo-400 tracking-widest">
              Level {user.level} Master
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-1">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Rank</p>
          <p className="text-2xl font-black text-white">#4,201</p>
        </div>
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-1">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Streak</p>
          <p className="text-2xl font-black text-white flex items-center gap-2">
            {user.streak} <ICONS.Star />
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
          <ICONS.Award /> Hall of Mastery
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map(badge => {
            const isUnlocked = user.badges.includes(badge.id);
            return (
              <div key={badge.id} className={`p-4 rounded-3xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${isUnlocked ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5 grayscale opacity-20'}`}>
                <span className="text-3xl">{badge.icon}</span>
                <span className="text-[8px] font-black uppercase leading-tight text-slate-300">{badge.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
