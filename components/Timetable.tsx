
import React, { useState } from 'react';
import { TimetableSlot } from '../types';
import { ICONS } from '../constants';

interface TimetableProps {
  slots: TimetableSlot[];
  setSlots: React.Dispatch<React.SetStateAction<TimetableSlot[]>>;
  onBack: () => void;
  onTaskDone: () => void;
}

const Timetable: React.FC<TimetableProps> = ({ slots, setSlots, onBack, onTaskDone }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ start: '09:00', end: '10:00', name: '' });

  const addSlot = () => {
    if (!newTask.name) return;
    const slot: TimetableSlot = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: newTask.start,
      endTime: newTask.end,
      taskName: newTask.name,
      isCompleted: false
    };
    setSlots([...slots, slot].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setNewTask({ start: '09:00', end: '10:00', name: '' });
    setIsAdding(false);
  };

  const toggleComplete = (id: string) => {
    setSlots(slots.map(s => {
      if (s.id === id && !s.isCompleted) {
        onTaskDone();
        return { ...s, isCompleted: true };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-6 py-6 animate-in slide-in-from-right duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
            <ICONS.X />
          </button>
          <h1 className="text-2xl font-bold">Daily Timetable</h1>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold"
        >
          Add Task
        </button>
      </div>

      <div className="space-y-4">
        {slots.length === 0 && !isAdding && (
          <div className="text-center py-20 text-slate-500 italic">
            Your schedule is empty. Plan your day.
          </div>
        )}

        {isAdding && (
          <div className="p-6 bg-white/5 border border-indigo-500/50 rounded-2xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="time" 
                value={newTask.start} 
                onChange={e => setNewTask({...newTask, start: e.target.value})}
                className="bg-white/5 border border-white/10 p-3 rounded-lg text-sm"
              />
              <input 
                type="time" 
                value={newTask.end} 
                onChange={e => setNewTask({...newTask, end: e.target.value})}
                className="bg-white/5 border border-white/10 p-3 rounded-lg text-sm"
              />
            </div>
            <input 
              type="text" 
              placeholder="Task name..."
              value={newTask.name}
              onChange={e => setNewTask({...newTask, name: e.target.value})}
              className="w-full bg-white/5 border border-white/10 p-3 rounded-lg"
            />
            <div className="flex gap-2">
              <button onClick={addSlot} className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold">Save</button>
              <button onClick={() => setIsAdding(false)} className="px-4 py-3 bg-white/5 rounded-xl">Cancel</button>
            </div>
          </div>
        )}

        {slots.map(slot => (
          <div 
            key={slot.id}
            className={`p-5 rounded-2xl flex items-center justify-between border transition-all ${
              slot.isCompleted ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-xs font-mono text-slate-400">
                {slot.startTime} <br/> - <br/> {slot.endTime}
              </div>
              <div>
                <h3 className={`font-bold ${slot.isCompleted ? 'line-through text-slate-500' : ''}`}>{slot.taskName}</h3>
                <span className="text-[10px] text-indigo-400 uppercase font-black">Scheduled</span>
              </div>
            </div>
            {!slot.isCompleted ? (
              <button 
                onClick={() => toggleComplete(slot.id)}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10"
              >
                <ICONS.Check />
              </button>
            ) : (
              <div className="text-green-500">
                <ICONS.Check />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timetable;
