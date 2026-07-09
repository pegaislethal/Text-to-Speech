'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext';
import { generateSpeech } from '../../services/api';
import { 
  Play, Pause, Download, Volume2, Sparkles, AlertCircle, RefreshCw, AudioLines, 
  HelpCircle, CheckCircle, Info 
} from 'lucide-react';

const VOICES = [
  { id: 'en-US-AvaNeural', name: 'Ava (US)', lang: 'en-US', gender: 'Female', premium: false },
  { id: 'en-US-AndrewNeural', name: 'Andrew (US)', lang: 'en-US', gender: 'Male', premium: false },
  { id: 'en-US-EmmaNeural', name: 'Emma (US)', lang: 'en-US', gender: 'Female', premium: false },
  { id: 'en-US-BrianNeural', name: 'Brian (US)', lang: 'en-US', gender: 'Male', premium: false },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (UK) - Premium', lang: 'en-GB', gender: 'Female', premium: true },
  { id: 'en-GB-RyanNeural', name: 'Ryan (UK) - Premium', lang: 'en-GB', gender: 'Male', premium: true }
];

export default function SpeechStudio() {
  const { user, refreshUser } = useAuth();
  const [text, setText] = useState<string>('');
  const [voice, setVoice] = useState<string>('en-US-AvaNeural');
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // Calculate required credits
  const characterCount = text.length;
  const creditsRequired = Math.max(1, Math.ceil(characterCount / 50));

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = `${BACKEND_URL}${audioUrl}`;
      audioRef.current.load();
    }
  }, [audioUrl, BACKEND_URL]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setGenerating(true);
    setError(null);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      // Find if voice is premium and user doesn't have premium access
      const selectedVoiceObj = VOICES.find(v => v.id === voice);
      if (selectedVoiceObj?.premium && user && !user.premiumAccess) {
        throw new Error('This is a Premium Voice. Upgrade your account or select a free voice.');
      }

      const res = await generateSpeech(text, voice);
      if (res.success) {
        setAudioUrl(res.audioUrl);
        await refreshUser();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error(e));
    }
  };

  const handleAudioPlay = () => setIsPlaying(true);
  const handleAudioPause = () => setIsPlaying(false);
  const handleAudioEnded = () => setIsPlaying(false);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
          Speech Studio
        </h1>
        <p className="text-neutral-400 text-sm mt-1">Convert your text to realistic AI neural voices instantly.</p>
      </div>

      {/* Editor & Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left column - Text Area & Control */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative rounded-2xl border border-neutral-900 bg-neutral-950 p-4 shadow-xl">
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Paste or write your text script here..."
              maxLength={2000}
              className="w-full min-h-[300px] bg-transparent text-neutral-250 placeholder-neutral-600 focus:outline-none resize-none text-base leading-relaxed"
            />
            {/* TextArea footer metadata */}
            <div className="flex items-center justify-between border-t border-neutral-900/60 pt-4 mt-2">
              <span className="text-xs text-neutral-500 font-semibold">
                {characterCount} / 2000 chars
              </span>
              <span className="text-xs text-neutral-500 font-semibold flex items-center gap-1">
                Cost: <span className={creditsRequired > 0 ? "text-indigo-400 font-bold" : "text-neutral-500"}>
                  {creditsRequired} credits
                </span>
              </span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !text.trim() || !!error}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-bold text-sm text-white shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Synthesizing voice waveforms...
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" /> Synthesize Text-to-Speech
              </>
            )}
          </button>
        </div>

        {/* Right column - Selection & Configs */}
        <div className="flex flex-col gap-6">
          {/* Voice Select Card */}
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-neutral-300">Voice Configuration</h3>

            <div className="flex flex-col gap-3">
              {VOICES.map((v) => {
                const isPremiumLocked = v.premium && user && !user.premiumAccess;
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVoice(v.id);
                      setError(null);
                    }}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition group relative ${
                      voice === v.id
                        ? 'border-indigo-600 bg-indigo-950/20'
                        : 'border-neutral-900 bg-neutral-950 hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-200">{v.name}</span>
                      <span className="text-[10px] text-neutral-500 mt-0.5">{v.lang} ({v.gender})</span>
                    </div>

                    {v.premium && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isPremiumLocked 
                          ? 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {isPremiumLocked ? 'Locked' : 'Premium'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credits Summary Card */}
          {user && !user.premiumAccess && (
            <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-5 shadow-xl flex flex-col gap-2">
              <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Plan Status</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-neutral-100">
                  {user.freeCredits - user.usedCredits}
                </span>
                <span className="text-xs text-neutral-500">credits left</span>
              </div>
              <div className="w-full bg-neutral-850 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (user.usedCredits / user.freeCredits) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audio Player Card (renders when audio exists) */}
      {audioUrl && (
        <div className="p-6 rounded-2xl border border-indigo-950 bg-indigo-950/10 shadow-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-200">Audio Synthesized successfully</span>
              <span className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Saved to local history cache
              </span>
            </div>
          </div>
          <a
            href={`${BACKEND_URL}${audioUrl}`}
            download
            className="p-3 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-850 hover:text-white transition flex items-center gap-2 text-sm font-semibold"
          >
            <Download className="w-4 h-4" /> Download MP3
          </a>
          <audio
            ref={audioRef}
            className="hidden"
            onPlay={handleAudioPlay}
            onPause={handleAudioPause}
            onEnded={handleAudioEnded}
          />
        </div>
      )}

      {/* Error alert wrapper */}
      {error && (
        <div className="p-5 rounded-2xl border border-red-950 bg-red-950/10 flex gap-3.5 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">Synthesize Operation Blocked</span>
            <p className="text-xs leading-normal text-red-300/80">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
