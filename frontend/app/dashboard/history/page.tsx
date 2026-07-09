'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getHistory } from '../../../services/api';
import { Play, Pause, Download, History, Calendar, Volume2, Music, RefreshCw } from 'lucide-react';

interface HistoryItem {
  _id: string;
  text: string;
  voice: string;
  audioUrl: string;
  characterCount: number;
  createdAt: string;
}

export default function AudioHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeClip, setActiveClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchHistoryList();
  }, []);

  const fetchHistoryList = async () => {
    try {
      const res = await getHistory();
      if (res.success) {
        setHistory(res.history);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayClip = (clipId: string, url: string) => {
    if (!audioRef.current) return;

    if (activeClip === clipId) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(err => console.error(err));
        setIsPlaying(true);
      }
    } else {
      audioRef.current.src = `${BACKEND_URL}${url}`;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          setActiveClip(clipId);
          setIsPlaying(true);
        })
        .catch(err => console.error(err));
    }
  };

  const handleAudioPause = () => setIsPlaying(false);
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setActiveClip(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
            Audio History
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Review and download previously generated speech clips.</p>
        </div>
      </div>

      {/* History Grid */}
      {history.length === 0 ? (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
            <Music className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-neutral-300">No Speech Clips Found</span>
            <p className="text-xs text-neutral-500 max-w-xs leading-normal">
              You haven't converted any text to speech yet. Head over to the Speech Studio to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map((item) => (
            <div 
              key={item._id}
              className={`p-5 rounded-2xl border bg-neutral-950/65 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition ${
                activeClip === item._id && isPlaying 
                  ? 'border-indigo-600/35 bg-indigo-950/5' 
                  : 'border-neutral-900 hover:border-neutral-800'
              }`}
            >
              {/* Left details */}
              <div className="flex gap-4 items-start md:items-center w-full md:max-w-2xl">
                <button
                  onClick={() => handlePlayClip(item._id, item.audioUrl)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition active:scale-95 ${
                    activeClip === item._id && isPlaying
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-900 text-neutral-350 border border-neutral-800 hover:bg-neutral-800'
                  }`}
                >
                  {activeClip === item._id && isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-medium text-neutral-250 truncate md:whitespace-normal line-clamp-2 md:line-clamp-1 leading-relaxed">
                    "{item.text}"
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-neutral-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-neutral-500" /> {item.voice}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-neutral-800" />
                    <span>{item.characterCount} characters</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-800" />
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" /> {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Download Link */}
              <a
                href={`${BACKEND_URL}${item.audioUrl}`}
                download
                className="px-4 py-2.5 rounded-xl border border-neutral-900 bg-neutral-950 text-neutral-350 hover:bg-neutral-900 hover:text-white transition flex items-center gap-2 text-xs font-semibold self-stretch md:self-auto justify-center"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        className="hidden"
        onPause={handleAudioPause}
        onEnded={handleAudioEnded}
      />
    </div>
  );
}
