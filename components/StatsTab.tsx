
import React, { useMemo } from 'react';
import { UserProfile, QuestRecord } from '../types';
import { ICONS } from '../constants';

interface StatsTabProps {
  history: QuestRecord[];
  user: UserProfile;
}

const StatsTab: React.FC<StatsTabProps> = ({ history, user }) => {
  const stats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const weekHistory = history.filter(h => h.timestamp > weekAgo);

    const plannedTime = history.reduce((acc, h) => acc + h.plannedDuration, 0);
    const completedTime = history.filter(h => h.status === 'completed').reduce((acc, h) => acc + h.plannedDuration, 0);
    const xpEarned = history.filter(h => h.xpChange > 0).reduce((acc, h) => acc + h.xpChange, 0);
    const xpLost = Math.abs(history.filter(h => h.xpChange < 0).reduce((acc, h) => acc + h.xpChange, 0));
    
    const completionRate = history.length > 0 
      ? Math.round((history.filter(h => h.status === 'completed').length / history.length) * 100) 
      : 0;

    const consistencyScore = history.length > 10 
      ? Math.min(100, Math.round((completedTime / plannedTime) * 100))
      : 0;

    return { plannedTime, completedTime, xpEarned, xpLost, completionRate, consistencyScore, weekHistory };
  }, [history]);

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500">
      <header className="px-1">
        <h1 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Growth Tracker</h1>
        <h2 className="text-3xl font-black tracking-tight">Your Progress</h2>
      </header>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Completion Rate</p>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-black text-white">{stats.completionRate}</span>
            <span className="text-sm font-bold text-indigo-400 mb-1.5">%</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${stats.completionRate}%` }} />
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Consistency</p>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-black text-white">{stats.consistencyScore}</span>
            <span className="text-sm font-bold text-amber-500 mb-1.5">/100</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${stats.consistencyScore}%` }} />
          </div>
        </div>
      </div>

      {/* XP Analysis */}
      <div className="p-6 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/20 space-y-6">
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
          <ICONS.Star /> Progress Points (XP)
        </h3>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gained</p>
            <p className="text-2xl font-black text-green-400">+{stats.xpEarned}</p>
          </div>
          <div className="h-10 w-px bg-white/5" />
          <div className="space-y-1 text-right">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lost</p>
            <p className="text-2xl font-black text-red-400">-{stats.xpLost}</p>
          </div>
        </div>
        <div className="flex gap-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-green-500" style={{ width: `${(stats.xpEarned / (stats.xpEarned + stats.xpLost + 1)) * 100}%` }} />
          <div className="h-full bg-red-500" style={{ width: `${(stats.xpLost / (stats.xpEarned + stats.xpLost + 1)) * 100}%` }} />
        </div>
      </div>

      {/* Time Intelligence */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] px-1">Time Spent</h3>
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Planned</p>
            <p className="text-xl font-black text-white">{Math.round(stats.plannedTime / 60)} <span className="text-xs text-slate-500">HRS</span></p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Focused Time</p>
            <p className="text-xl font-black text-indigo-400">{Math.round(stats.completedTime / 60)} <span className="text-xs text-slate-500">HRS</span></p>
          </div>
        </div>
      </div>

      {/* Weekly Report Card */}
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 space-y-4 shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-black tracking-tight text-white">Weekly Reflection</h4>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Your 7-Day Summary</p>
          </div>
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
            <ICONS.Calendar />
          </div>
        </div>
        
        {stats.weekHistory.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4">No data yet for this week. Let's start a new goal together!</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="p-3 bg-white/5 rounded-2xl">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Active Hours</p>
                <p className="text-sm font-black text-slate-200">{(stats.weekHistory.reduce((a,c) => a+c.plannedDuration, 0) / 60).toFixed(1)}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Goals</p>
                <p className="text-sm font-black text-slate-200">{stats.weekHistory.length}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Growth Insight: Your streak is {user.streak > 5 ? 'going strong!' : 'just getting started.'} 
              {stats.xpLost > stats.xpEarned ? " It's okay to have off days. Tomorrow is a new chance." : ' You are trending towards great focus patterns!'}
            </p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center text-slate-700 font-bold uppercase tracking-[0.4em] py-4">Every effort counts</p>
    </div>
  );
};

export default StatsTab;
