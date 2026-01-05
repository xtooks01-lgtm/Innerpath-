
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile, TimetableSlot, QuestRecord } from '../types';
import { ICONS } from '../constants';
import { getDailyBriefing, findNearbyResources } from '../services/geminiService';
import { playTTS } from '../services/audioService';

interface QuestProps {
  user: UserProfile;
  onNewGoal: () => void;
  onOpenVoice: () => void;
  timetable: TimetableSlot[];
  setTimetable: React.Dispatch<React.SetStateAction<TimetableSlot[]>>;
  onTaskDone: (xp: number, record: Omit<QuestRecord, 'xpChange'>) => void;
  onTaskMissed: (xp: number, record: Omit<QuestRecord, 'xpChange'>) => void;
  onOpenMentor: () => void;
}

const Quest: React.FC<QuestProps> = ({ 
  user, onNewGoal, onOpenVoice, timetable, setTimetable, onTaskDone, onTaskMissed, onOpenMentor 
}) => {
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ start: '09:00', end: '10:00', name: '' });
  const [briefing, setBriefing] = useState<string>('');
  const [loadingBriefing, setLoadingBriefing] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [nearbyInfo, setNearbyInfo] = useState<{text: string, locations: any[]} | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // SMART REMINDER ENGINE
  useEffect(() => {
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    timetable.forEach(slot => {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const startTotal = sh * 60 + sm;
      
      // Remind 5 minutes before start
      if (!slot.reminderSent && !slot.isCompleted && nowMins === startTotal - 5) {
        const msg = `Hey ${user.name}, your activity "${slot.taskName}" is starting in 5 minutes. Take a breath and get ready!`;
        playTTS(msg);
        setTimetable(prev => prev.map(s => s.id === slot.id ? { ...s, reminderSent: true } : s));
      }
      
      // Urgent reminder if live and not completed
      if (nowMins === startTotal && !slot.isCompleted) {
         playTTS(`It's time for "${slot.taskName}". Let's get started!`);
      }
    });
  }, [currentTime, timetable, user.name, setTimetable]);

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const text = await getDailyBriefing(user.name, user.xp);
        setBriefing(text);
      } catch {
        setBriefing("Focus on the next step. Every little bit counts.");
      } finally {
        setLoadingBriefing(false);
      }
    };
    fetchBriefing();
  }, [user.name, user.xp]);

  const handleDiscover = () => {
    setDiscovering(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const result = await findNearbyResources('learning and focus', pos.coords.latitude, pos.coords.longitude);
        setNearbyInfo(result);
      } catch (err) {
        console.error(err);
      } finally {
        setDiscovering(false);
      }
    }, () => {
      setDiscovering(false);
      alert("I'll need your location to find some good spots nearby.");
    });
  };

  const processedSlots = useMemo(() => {
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    return timetable.map(slot => {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      let status: 'upcoming' | 'live' | 'expired' = 'upcoming';
      let remainingSeconds = 0;
      if (nowMins < start) status = 'upcoming';
      else if (nowMins < end) {
        status = 'live';
        remainingSeconds = (end * 60) - (nowMins * 60 + currentTime.getSeconds());
      } else status = 'expired';
      return { ...slot, status, remainingSeconds, plannedDuration: end - start };
    });
  }, [timetable, currentTime]);

  useEffect(() => {
    processedSlots.forEach(slot => {
      if (slot.status === 'expired' && !slot.isCompleted && !slot.xpDeducted) {
        onTaskMissed(30, { id: slot.id, taskName: slot.taskName, timestamp: Date.now(), plannedDuration: slot.plannedDuration, status: 'missed' });
        setTimetable(prev => prev.map(s => s.id === slot.id ? { ...s, xpDeducted: true } : s));
      }
    });
  }, [processedSlots, onTaskMissed, setTimetable]);

  const addSlot = () => {
    if (!newSlot.name) return;
    const slot: TimetableSlot = { id: Math.random().toString(36).substr(2, 9), startTime: newSlot.start, endTime: newSlot.end, taskName: newSlot.name, isCompleted: false };
    setTimetable(prev => [...prev, slot].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setNewSlot({ start: '09:00', end: '10:00', name: '' });
    setIsAddingSlot(false);
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Your browser doesn't seem to support voice input yet.");
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onstart = () => setIsVoiceActive(true);
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewSlot(prev => ({ ...prev, name: transcript }));
      setIsVoiceActive(false);
    };
    recognitionRef.current.onerror = () => setIsVoiceActive(false);
    recognitionRef.current.start();
  };

  const toggleSlot = (id: string) => {
    const slot = processedSlots.find(s => s.id === id);
    if (!slot || slot.isCompleted) return;
    if (slot.status === 'live') {
      onTaskDone(50, { id: slot.id, taskName: slot.taskName, timestamp: Date.now(), plannedDuration: slot.plannedDuration, status: 'completed' });
      setTimetable(prev => prev.map(s => s.id === id ? { ...s, isCompleted: true } : s));
    } else if (slot.status === 'expired') {
      onTaskDone(0, { id: slot.id, taskName: slot.taskName, timestamp: Date.now(), plannedDuration: slot.plannedDuration, status: 'late' });
      setTimetable(prev => prev.map(s => s.id === id ? { ...s, isCompleted: true } : s));
    }
  };

  const formatCountdown = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500">
      <header className="flex justify-between items-end px-1">
        <div>
          <h1 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Your Journey</h1>
          <h2 className="text-3xl font-black tracking-tight">Today's Plan</h2>
        </div>
        <div className="bg-indigo-600/10 border border-indigo-500/20 px-4 py-2 rounded-2xl">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progress Hub</p>
          <p className="text-xl font-black text-white">{user.xp}</p>
        </div>
      </header>

      <div className="p-6 bg-[#1e293b]/40 border border-white/5 rounded-[2rem] backdrop-blur-md relative overflow-hidden group">
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Rudh-h's Thoughts
        </h3>
        {loadingBriefing ? <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" /> : <p className="text-sm text-slate-300 leading-relaxed italic">"{briefing}"</p>}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Your Schedule</h3>
          <button onClick={() => setIsAddingSlot(true)} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">+ New Activity</button>
        </div>
        
        {isAddingSlot && (
          <div className="p-6 bg-[#1e293b]/80 border border-indigo-500/50 rounded-3xl space-y-4 animate-in slide-in-from-top backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-4">
              <input type="time" value={newSlot.start} onChange={e => setNewSlot({...newSlot, start: e.target.value})} className="bg-black/40 border border-white/10 p-4 rounded-2xl text-sm" />
              <input type="time" value={newSlot.end} onChange={e => setNewSlot({...newSlot, end: e.target.value})} className="bg-black/40 border border-white/10 p-4 rounded-2xl text-sm" />
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="What are we doing?" 
                value={newSlot.name} 
                onChange={e => setNewSlot({...newSlot, name: e.target.value})} 
                className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none text-sm pr-14" 
              />
              <button 
                onClick={startVoiceInput} 
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isVoiceActive ? 'bg-red-500 animate-pulse' : 'bg-white/5 text-slate-400'}`}
              >
                <ICONS.Mic />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={addSlot} className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest">Add to Schedule</button>
              <button onClick={() => setIsAddingSlot(false)} className="px-6 py-4 bg-white/5 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {processedSlots.length === 0 && !isAddingSlot && (
            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem] text-slate-600">
              <p className="text-xs font-black uppercase tracking-widest">Your schedule is clear. Let's add something!</p>
            </div>
          )}
          {processedSlots.map(slot => (
            <div key={slot.id} className={`group relative p-5 rounded-3xl flex items-center justify-between border transition-all duration-500 ${slot.isCompleted ? 'bg-green-500/5 border-green-500/20' : slot.status === 'live' ? 'bg-indigo-600/10 border-indigo-500 shadow-xl' : slot.status === 'expired' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
              <div className="flex items-center gap-6">
                <div className="text-[9px] font-mono text-slate-500 border-r border-white/10 pr-4">{slot.startTime}<br/>{slot.endTime}</div>
                <div>
                  <h4 className={`font-black text-sm ${slot.isCompleted ? 'line-through text-slate-600' : 'text-slate-200'}`}>{slot.taskName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {slot.status === 'live' && !slot.isCompleted && <><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" /><span className="text-[8px] font-black uppercase text-indigo-400">Happening Now: {formatCountdown(slot.remainingSeconds)}</span></>}
                    {slot.status === 'expired' && !slot.isCompleted && <span className="text-[8px] font-black uppercase text-red-500">Time's Up</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => toggleSlot(slot.id)} disabled={slot.isCompleted || slot.status === 'upcoming'} className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${slot.isCompleted ? 'bg-green-500/10 border-green-500 text-green-500' : slot.status === 'live' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-700'}`}>
                <ICONS.Check />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] px-1">Cozy Spots Nearby</h3>
        <button 
          onClick={handleDiscover}
          disabled={discovering}
          className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
              <ICONS.Calendar />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black text-slate-200">Local Spot Finder</h4>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Find a peaceful place to focus</p>
            </div>
          </div>
          {discovering ? <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <ICONS.Star />}
        </button>

        {nearbyInfo && (
          <div className="p-6 bg-blue-600/5 border border-blue-500/20 rounded-3xl space-y-4 animate-in fade-in">
            <p className="text-xs text-slate-300 leading-relaxed italic">"{nearbyInfo.text}"</p>
            <div className="flex flex-wrap gap-2">
              {nearbyInfo.locations.map((loc, i) => (
                <a 
                  key={i} 
                  href={loc.maps?.uri} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/30 rounded-xl text-[9px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-600/20 transition-all flex items-center gap-2"
                >
                  📍 {loc.maps?.title || 'Location'}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={onNewGoal} className="w-full py-8 rounded-[2rem] bg-indigo-600 font-black text-lg uppercase tracking-widest shadow-2xl shadow-indigo-600/20 hover:scale-[1.01] transition-all">Start a New Goal</button>
    </div>
  );
};

export default Quest;
