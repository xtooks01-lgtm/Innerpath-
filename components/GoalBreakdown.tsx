
import React, { useState, useEffect, useCallback } from 'react';
import { Goal, SubTask } from '../types';
import { ICONS } from '../constants';
import { breakdownGoalWithAI } from '../services/geminiService';
import { playTTS } from '../services/audioService';
import VideoModal from './VideoModal';

interface GoalBreakdownProps {
  goal: Goal;
  onUpdateGoal: React.Dispatch<React.SetStateAction<Goal | null>>;
  onCompleteTask: (xp: number) => void;
  onFailTask: (xp: number) => void;
  onFinish: () => void;
}

const GoalBreakdown: React.FC<GoalBreakdownProps> = ({ goal, onUpdateGoal, onCompleteTask, onFailTask, onFinish }) => {
  const [loading, setLoading] = useState(!goal.subTasks.length);
  const [activeTaskIndex, setActiveTaskIndex] = useState(goal.lastCheckpointIndex || 0);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(goal.subTasks[0]?.id || null);
  const [isPaused, setIsPaused] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const initAI = useCallback(async () => {
    if (goal.subTasks.length) return;
    try {
      setLoading(true);
      const result = await breakdownGoalWithAI(goal.title, goal.category, goal.topic, goal.notes);
      const formattedTasks: SubTask[] = result.subTasks.map((t: any, i: number) => ({
        id: `task-${i}`,
        title: t.title,
        description: t.description,
        detailedExplanation: t.detailedExplanation,
        completed: false,
        timerStartedAt: null,
        duration: t.durationMinutes * 60,
        timeLeft: t.durationMinutes * 60,
        status: 'pending'
      }));
      onUpdateGoal(prev => prev ? ({ ...prev, subTasks: formattedTasks }) : null);
      setExpandedTaskId(formattedTasks[0].id);
      playTTS(`Your plan is ready for "${goal.title}". Let's start with step 1.`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [goal.title, goal.category, goal.topic, goal.notes, goal.subTasks.length, onUpdateGoal]);

  useEffect(() => {
    initAI();
  }, [initAI]);

  useEffect(() => {
    let timer: any;
    const activeTask = goal.subTasks[activeTaskIndex];
    if (activeTask?.status === 'active' && !isPaused && activeTask.timeLeft > 0) {
      timer = setInterval(() => {
        onUpdateGoal(prevGoal => {
          if (!prevGoal) return null;
          const updatedTasks = prevGoal.subTasks.map((t, idx) => 
            idx === activeTaskIndex ? { ...t, timeLeft: Math.max(0, t.timeLeft - 1) } : t
          );
          return { ...prevGoal, subTasks: updatedTasks };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTaskIndex, isPaused, onUpdateGoal]);

  useEffect(() => {
    const activeTask = goal.subTasks[activeTaskIndex];
    if (activeTask?.status === 'active' && activeTask.timeLeft <= 0) {
      onUpdateGoal(prevGoal => {
        if (!prevGoal) return null;
        const updatedTasks = prevGoal.subTasks.map((t, idx) => 
          idx === activeTaskIndex ? { ...t, status: 'failed' } : t
        );
        return { ...prevGoal, subTasks: updatedTasks };
      });
      onFailTask(10);
      setIsFocusMode(false);
      playTTS(`Looks like time ran out for step ${activeTaskIndex + 1}. Don't worry, let's just try again or move forward when you're ready.`);
    }
  }, [goal.subTasks, activeTaskIndex, onFailTask, onUpdateGoal]);

  const startTask = (index: number) => {
    onUpdateGoal(prevGoal => {
      if (!prevGoal) return null;
      const updatedTasks = prevGoal.subTasks.map((t, idx) => 
        idx === index ? { ...t, status: 'active', timerStartedAt: Date.now() } : t
      );
      return { ...prevGoal, subTasks: updatedTasks, lastCheckpointIndex: index };
    });
    setIsPaused(false);
  };

  const completeTask = (index: number) => {
    onUpdateGoal(prevGoal => {
      if (!prevGoal) return null;
      const updatedTasks = prevGoal.subTasks.map((t, idx) => 
        idx === index ? { ...t, status: 'completed', completed: true } : t
      );
      const nextIndex = index < updatedTasks.length - 1 ? index + 1 : index;
      if (index < updatedTasks.length - 1) {
        setActiveTaskIndex(nextIndex);
        setExpandedTaskId(updatedTasks[nextIndex].id);
      }
      return { ...prevGoal, subTasks: updatedTasks, lastCheckpointIndex: nextIndex };
    });
    onCompleteTask(20);
    setIsFocusMode(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] animate-pulse">Breaking things down for you...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 py-6 h-full flex flex-col max-w-lg mx-auto w-full transition-all duration-700`}>
      {isFocusMode && goal.subTasks[activeTaskIndex] && (
        <div className="fixed inset-0 z-[60] bg-[#0f172a] flex flex-col items-center justify-center p-8 space-y-12 animate-in fade-in zoom-in">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${(goal.subTasks[activeTaskIndex].timeLeft / goal.subTasks[activeTaskIndex].duration) * 100}%` }} />
          </div>
          <div className="text-center space-y-4">
            <h3 className="text-3xl font-black uppercase text-white">{goal.subTasks[activeTaskIndex].title}</h3>
            <p className="text-slate-500 text-sm italic">"{goal.subTasks[activeTaskIndex].description}"</p>
          </div>
          <div className="text-[100px] font-black tracking-tighter text-indigo-400 font-mono">
            {formatTime(goal.subTasks[activeTaskIndex].timeLeft)}
          </div>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button onClick={() => completeTask(activeTaskIndex)} className="w-full py-6 bg-green-600 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl">Done</button>
            <button onClick={() => setIsFocusMode(false)} className="py-4 text-slate-500 font-black text-xs uppercase tracking-widest">Exit Deep Focus</button>
          </div>
        </div>
      )}

      <header className="flex justify-between items-start px-2">
        <div className="max-w-[70%]">
          <h2 className="text-2xl font-black uppercase text-white truncate">{goal.title}</h2>
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">{goal.topic}</span>
        </div>
        <div className="flex gap-2">
           <button 
                onClick={() => setShowVideoModal(true)}
                className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl hover:bg-indigo-500/20 transition-all"
              >
                <ICONS.Star />
            </button>
        </div>
      </header>

      <div className="px-4 flex items-center justify-between mb-2">
        {goal.subTasks.map((_, i) => (
          <React.Fragment key={i}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              i < activeTaskIndex ? 'bg-green-500 border-green-500 text-white' : 
              i === activeTaskIndex ? 'bg-indigo-600 border-indigo-500 text-white animate-pulse' : 
              'bg-white/5 border-white/10 text-slate-700'
            }`}>
              <span className="text-[10px] font-black">{i + 1}</span>
            </div>
            {i < goal.subTasks.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${i < activeTaskIndex ? 'bg-green-500' : 'bg-white/5'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-hide">
        {goal.subTasks.map((task, idx) => {
          const isActive = idx === activeTaskIndex;
          const isExpanded = expandedTaskId === task.id;
          return (
            <div 
              key={task.id}
              className={`group overflow-hidden rounded-[2rem] border transition-all duration-500 ${
                isActive ? 'bg-indigo-600/10 border-indigo-500' : 
                task.completed ? 'bg-green-500/5 border-green-500/20 opacity-60' : 'bg-white/5 border-white/5 opacity-40'
              }`}
            >
              <div onClick={() => setExpandedTaskId(isExpanded ? null : task.id)} className="p-6 cursor-pointer flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-200">{task.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase text-slate-500">Duration: {task.duration / 60}m</span>
                    {task.status === 'active' && <span className="text-[9px] font-black uppercase text-indigo-400 animate-pulse">In Progress</span>}
                  </div>
                </div>
                {task.status === 'active' ? (
                   <span className="font-mono font-black text-indigo-400">{formatTime(task.timeLeft)}</span>
                ) : (
                  <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="m6 9 6 6 6-6"/></svg></div>
                )}
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4">
                  <p className="text-sm text-slate-400 leading-relaxed italic">"{task.description}"</p>
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-[9px] font-black text-indigo-400 uppercase mb-2">Tips for Success</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{task.detailedExplanation}</p>
                  </div>
                  {isActive && !task.completed && (
                    <div className="flex gap-2">
                      {task.status === 'pending' || task.status === 'failed' ? (
                        <button onClick={() => startTask(idx)} className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest">{task.status === 'failed' ? 'Restart Step' : 'Start Step'}</button>
                      ) : (
                        <>
                          <button onClick={() => setIsFocusMode(true)} className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black text-sm uppercase">Deep Focus</button>
                          <button onClick={() => completeTask(idx)} className="flex-1 py-4 bg-green-600 rounded-2xl font-black text-sm uppercase">Done!</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 flex flex-col gap-3">
        <button 
          onClick={() => {
            const incompleteCount = goal.subTasks.filter(t => !t.completed).length;
            if (incompleteCount > 0) {
              if (confirm(`You still have ${incompleteCount} steps left. Finish this goal for now?`)) {
                onFinish();
              }
            } else {
              onFinish();
            }
          }}
          className="w-full py-6 bg-indigo-600 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all"
        >
          Complete Goal
        </button>
      </div>

      {showVideoModal && <VideoModal goalTitle={goal.title} category={goal.category} onClose={() => setShowVideoModal(false)} />}
    </div>
  );
};

export default GoalBreakdown;
