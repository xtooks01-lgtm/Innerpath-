
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, AppState, AppTab, Goal, TimetableSlot, QuestRecord } from './types';
import { BADGES, ICONS } from './constants';
import Onboarding from './components/Onboarding';
import Quest from './components/Quest';
import GoalEntry from './components/GoalEntry';
import GoalBreakdown from './components/GoalBreakdown';
import Mentor from './components/Mentor';
import ProfileTab from './components/ProfileTab';
import StatsTab from './components/StatsTab';
import Tutorial from './components/Tutorial';
import VoiceHub from './components/VoiceHub';
import Summary from './components/Summary';
import { playTTS } from './services/audioService';

const STORAGE_KEY = 'innerpath_master_data_v4';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.ONBOARDING);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.QUEST);
  const [user, setUser] = useState<UserProfile>({
    name: '',
    xp: 0,
    streak: 0,
    lastActive: null,
    badges: [],
    level: 1,
    recoveryNeeded: false,
    totalFocusMinutes: 0
  });
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [history, setHistory] = useState<QuestRecord[]>([]);

  // OFFLINE CACHE LAYER & XP DECAY
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const savedUser = parsed.user || user;
      
      // Calculate XP Decay for inactivity (simplified: -5 XP per day of inactivity)
      if (savedUser.lastActive) {
        const lastDate = new Date(savedUser.lastActive).getTime();
        const daysDiff = Math.floor((Date.now() - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 2) {
          const decay = daysDiff * 5;
          savedUser.xp = Math.max(0, savedUser.xp - decay);
          console.log(`XP Decay applied: -${decay} XP for ${daysDiff} days of inactivity.`);
        }
      }

      setUser(savedUser);
      setTimetable(parsed.timetable || []);
      setHistory(parsed.history || []);
      
      // SESSION RECOVERY: If an active goal was interrupted
      if (parsed.activeGoal && parsed.activeGoal.status === 'active') {
        setActiveGoal(parsed.activeGoal);
        setAppState(AppState.GOAL_BREAKDOWN);
      } else {
        setAppState(AppState.MAIN);
      }
    }
  }, []);

  useEffect(() => {
    if (user.name) {
      const updatedUser = { ...user, lastActive: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updatedUser, timetable, history, activeGoal }));
    }
  }, [user, timetable, history, activeGoal]);

  const addXP = useCallback((amount: number, record?: Omit<QuestRecord, 'xpChange'>) => {
    setUser(prev => {
      // Adaptive XP scaling: Level up makes it harder, streaks give bonus
      const streakBonus = Math.floor(prev.streak / 5) * 5;
      const finalAmount = amount + streakBonus;
      const newXP = prev.xp + finalAmount;
      const newLevel = Math.floor(newXP / 500) + 1;
      let newBadges = [...prev.badges];
      if (newLevel >= 10 && !newBadges.includes('b10')) newBadges.push('b10');
      if (newXP >= 500 && !newBadges.includes('b5')) newBadges.push('b5');
      return { ...prev, xp: newXP, level: newLevel, badges: newBadges, recoveryNeeded: false };
    });
    if (record) {
      setHistory(prev => [...prev, { ...record, xpChange: amount }]);
    }
  }, []);

  const deductXP = useCallback((amount: number, record?: Omit<QuestRecord, 'xpChange'>) => {
    setUser(prev => ({ ...prev, xp: Math.max(0, prev.xp - amount), recoveryNeeded: true }));
    if (record) {
      setHistory(prev => [...prev, { ...record, xpChange: -amount }]);
    }
  }, []);

  const handleGoalFinish = () => {
    setAppState(AppState.SUMMARY);
  };

  const renderMainTab = () => {
    switch (activeTab) {
      case AppTab.QUEST:
        return (
          <Quest 
            user={user} 
            onNewGoal={() => setAppState(AppState.GOAL_ENTRY)}
            onOpenVoice={() => setAppState(AppState.VOICE_HUB)}
            onOpenMentor={() => setActiveTab(AppTab.MENTOR)}
            timetable={timetable}
            setTimetable={setTimetable}
            onTaskDone={(xp, record) => addXP(xp, record)}
            onTaskMissed={(xp, record) => deductXP(xp, record)}
          />
        );
      case AppTab.MENTOR:
        return <Mentor user={user} />;
      case AppTab.STATS:
        return <StatsTab history={history} user={user} />;
      case AppTab.PROFILE:
        return <ProfileTab user={user} onUpdateUser={setUser} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.ONBOARDING:
        return <Onboarding onComplete={(name) => { setUser(p => ({ ...p, name })); setAppState(AppState.TUTORIAL); }} />;
      case AppState.TUTORIAL:
        return <Tutorial onComplete={() => setAppState(AppState.MAIN)} />;
      case AppState.GOAL_ENTRY:
        return <GoalEntry onBack={() => setAppState(AppState.MAIN)} onGoalBreakdown={(g) => { setActiveGoal(g); setAppState(AppState.GOAL_BREAKDOWN); }} />;
      case AppState.GOAL_BREAKDOWN:
        return (
          <GoalBreakdown 
            goal={activeGoal!} 
            onUpdateGoal={setActiveGoal}
            onCompleteTask={(xp) => addXP(xp)} 
            onFailTask={(xp) => deductXP(xp)} 
            onFinish={handleGoalFinish} 
          />
        );
      case AppState.SUMMARY:
        return <Summary goal={activeGoal!} onDone={() => { setActiveGoal(null); setAppState(AppState.MAIN); }} />;
      case AppState.VOICE_HUB:
        return <VoiceHub onBack={() => setAppState(AppState.MAIN)} />;
      case AppState.MAIN:
      default:
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
              {renderMainTab()}
            </div>
            
            <nav className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-2xl border-t border-white/5 px-4 py-4 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-2xl">
              <button 
                onClick={() => setActiveTab(AppTab.QUEST)}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === AppTab.QUEST ? 'text-indigo-400' : 'text-slate-600'}`}
              >
                <div className={`p-2 rounded-xl ${activeTab === AppTab.QUEST ? 'bg-indigo-500/20' : ''}`}><ICONS.Award /></div>
                <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
              </button>
              
              <button 
                onClick={() => setActiveTab(AppTab.MENTOR)}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === AppTab.MENTOR ? 'text-indigo-400' : 'text-slate-600'}`}
              >
                <div className={`p-2 rounded-xl ${activeTab === AppTab.MENTOR ? 'bg-indigo-500/20' : ''}`}><ICONS.Mic /></div>
                <span className="text-[8px] font-black uppercase tracking-widest">Mentor</span>
              </button>

              <button 
                onClick={() => setActiveTab(AppTab.STATS)}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === AppTab.STATS ? 'text-indigo-400' : 'text-slate-600'}`}
              >
                <div className={`p-2 rounded-xl ${activeTab === AppTab.STATS ? 'bg-indigo-500/20' : ''}`}><ICONS.Clock /></div>
                <span className="text-[8px] font-black uppercase tracking-widest">Stats</span>
              </button>

              <button 
                onClick={() => setActiveTab(AppTab.PROFILE)}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === AppTab.PROFILE ? 'text-indigo-400' : 'text-slate-600'}`}
              >
                <div className={`p-2 rounded-xl ${activeTab === AppTab.PROFILE ? 'bg-indigo-500/20' : ''}`}><ICONS.Star /></div>
                <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
              </button>
            </nav>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col items-center selection:bg-indigo-500/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full" />
      </div>
      <div className="relative w-full max-w-xl h-screen flex flex-col px-4">{renderContent()}</div>
    </div>
  );
};

export default App;
