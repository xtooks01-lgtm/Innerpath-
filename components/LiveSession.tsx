
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ICONS } from '../constants';
import { getAudioContext, createBlob, decodeAudioData, decode } from '../services/audioService';
import { UserProfile } from '../types';

interface LiveSessionProps {
  onBack: () => void;
  user: UserProfile;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onBack, user }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Opening our connection...');
  const [transcription, setTranscription] = useState('');
  
  const sessionRef = useRef<any>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;
    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = getAudioContext(24000);
        
        setStatus('Connecting with Rudh-h...');
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              if (!active) return;
              setIsActive(true);
              setStatus('We are connected');
              
              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                const base64 = message.serverContent.modelTurn.parts[0].inlineData.data;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                
                const buffer = await decodeAudioData(decode(base64), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(outputCtx.destination);
                source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                audioSourcesRef.current.add(source);
              }

              if (message.serverContent?.outputTranscription) {
                setTranscription(prev => (prev + ' ' + message.serverContent?.outputTranscription?.text).slice(-150));
              }

              if (message.serverContent?.interrupted) {
                audioSourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
                });
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onerror: (e) => {
              console.error('Live error', e);
              setStatus('Something went wrong');
            },
            onclose: () => {
              setIsActive(false);
              setStatus('Conversation ended');
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: `You are Rudh-h, a warm, supportive mentor for ${user.name}. Use a friendly, caring, and encouraging voice. Help them with their day and goals. Keep your turns brief and natural.`
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error(err);
        setStatus('Trouble connecting');
      }
    };

    startSession();

    return () => {
      active = false;
      if (sessionRef.current && sessionRef.current.close) {
        sessionRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [user.name]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12 animate-in zoom-in duration-500">
      <div className="relative">
        <div className={`absolute -inset-16 bg-indigo-500/20 rounded-full blur-3xl transition-all duration-1000 ${isActive ? 'scale-125 opacity-100' : 'scale-50 opacity-0'}`} />
        <div className="relative w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl border-4 border-white/5">
          <div className={`text-4xl transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-90'}`}>
            <ICONS.Mic />
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black uppercase text-white">Talk to Rudh-h</h2>
        <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.4em]">{status}</p>
      </div>

      <div className="w-full max-w-sm p-8 bg-white/5 border border-white/10 rounded-[2.5rem] min-h-[140px] flex flex-col items-center justify-center text-center">
        {transcription ? (
          <p className="text-sm text-slate-300 italic leading-relaxed">"{transcription}..."</p>
        ) : (
          <div className="space-y-3">
             <div className="flex gap-1 justify-center">
               <div className="w-1 h-1 bg-slate-700 rounded-full animate-bounce" />
               <div className="w-1 h-1 bg-slate-700 rounded-full animate-bounce [animation-delay:0.2s]" />
               <div className="w-1 h-1 bg-slate-700 rounded-full animate-bounce [animation-delay:0.4s]" />
             </div>
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">I'm listening...</p>
          </div>
        )}
      </div>

      <button 
        onClick={onBack}
        className="w-full max-w-xs py-5 bg-white/5 border border-white/10 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all text-slate-500"
      >
        End Conversation
      </button>
    </div>
  );
};

export default LiveSession;
