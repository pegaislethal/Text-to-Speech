'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getHistory, deleteHistoryItemApi, clearHistoryApi, getApiUrl } from '../../../services/api';
import { Play, Pause, Download, Music, Calendar, Volume2, Clock, FileText, Search, Trash2 } from 'lucide-react';

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
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeClip, setActiveClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const BACKEND_URL = getApiUrl();

  const getFullAudioUrl = (urlPath: string) => {
    if (!urlPath) return '';
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
    const baseUrl = BACKEND_URL.replace(/\/+$/, '');
    const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  useEffect(() => {
    fetchHistoryList();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(
        history.filter(item => 
          item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.voice.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, history]);

  const fetchHistoryList = async () => {
    try {
      const res = await getHistory();
      if (res.success) {
        setHistory(res.history);
        setFilteredHistory(res.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteHistoryItemApi(id);
      if (res.success) {
        const updated = history.filter(item => item._id !== id);
        setHistory(updated);
        setFilteredHistory(updated);
        if (activeClip === id) {
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
          setActiveClip(null);
        }
      }
    } catch (err: any) {
      alert('Failed to delete history item: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your entire audio history?')) return;
    setClearing(true);
    try {
      const res = await clearHistoryApi();
      if (res.success) {
        setHistory([]);
        setFilteredHistory([]);
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        setActiveClip(null);
      }
    } catch (err: any) {
      alert('Failed to clear audio history: ' + (err.message || 'Unknown error'));
    } finally {
      setClearing(false);
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
      audioRef.current.src = getFullAudioUrl(url);
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

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
            Generation History
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">Review and manage your converted neural audio assets.</p>
        </div>

        {/* Header Actions */}
        {history.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by voice or text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-neutral-900/40 border border-neutral-800 rounded-xl focus:outline-none focus:border-indigo-500/50 text-neutral-200 placeholder-neutral-500 transition duration-200"
              />
            </div>

            <button
              onClick={handleClearAllHistory}
              disabled={clearing}
              className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl bg-red-950/30 border border-red-900/40 hover:bg-red-900/40 text-red-400 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearing ? 'Clearing...' : 'Clear All'}</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <span className="text-xs text-neutral-500">Retrieving generation logs...</span>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl p-8 sm:p-16 text-center flex flex-col items-center justify-center gap-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-950/10 border border-indigo-900/20 flex items-center justify-center text-indigo-400">
            <Music className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <span className="text-xs sm:text-sm font-semibold text-neutral-200">
              {searchTerm ? 'No results match your search' : 'No generated clips found'}
            </span>
            <p className="text-xs text-neutral-500 leading-normal">
              {searchTerm 
                ? 'Try adjusting your search keywords to find your audio clip.' 
                : 'Convert text into natural speech inside the Studio workspace to populate your history log.'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredHistory.map((item) => (
            <div 
              key={item._id}
              className={`p-4 sm:p-5 rounded-2xl border bg-neutral-950/30 backdrop-blur-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-all duration-300 ${
                activeClip === item._id && isPlaying 
                  ? 'border-indigo-500/30 bg-indigo-950/10 shadow-lg shadow-indigo-500/5' 
                  : 'border-neutral-900 hover:border-neutral-850 hover:bg-neutral-900/10'
              }`}
            >
              {/* Play & Text Details */}
              <div className="flex gap-3.5 sm:gap-4 items-start w-full md:max-w-3xl">
                <button
                  onClick={() => handlePlayClip(item._id, item.audioUrl)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 active:scale-95 shadow-md ${
                    activeClip === item._id && isPlaying
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                      : 'bg-neutral-900 text-neutral-350 border border-neutral-800 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  {activeClip === item._id && isPlaying 
                    ? <Pause className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-white" /> 
                    : <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current ml-0.5" />
                  }
                </button>
                <div className="flex flex-col min-w-0 pt-0.5">
                  <p className="text-xs sm:text-sm font-medium text-neutral-200 leading-relaxed break-words line-clamp-3 md:line-clamp-2">
                    "{item.text}"
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1.5 mt-2.5 text-[10px] sm:text-[10.5px] text-neutral-500 font-semibold tracking-wide">
                    <span className="flex items-center gap-1 bg-neutral-900/60 px-2 py-0.5 rounded-md border border-neutral-850 truncate">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {item.voice}
                    </span>
                    <span className="flex items-center gap-1 bg-neutral-900/60 px-2 py-0.5 rounded-md border border-neutral-850">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {item.characterCount} chars
                    </span>
                    <span className="flex items-center gap-1 bg-neutral-900/60 px-2 py-0.5 rounded-md border border-neutral-850">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1 bg-neutral-900/60 px-2 py-0.5 rounded-md border border-neutral-850">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {new Date(item.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full md:w-auto self-stretch md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-900/60">
                <a
                  href={getFullAudioUrl(item.audioUrl)}
                  download
                  className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white transition flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Download MP3
                </a>
                <button
                  onClick={() => handleDeleteItem(item._id)}
                  disabled={deletingId === item._id}
                  className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:bg-neutral-850 transition"
                  title="Delete audio entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        className="hidden"
        onPause={handleAudioPause}
        onEnded={handleAudioEnded}
      />
    </div>
  );
}
