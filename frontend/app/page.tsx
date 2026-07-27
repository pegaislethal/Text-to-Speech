'use client';

import Link from 'next/link';
import { useAuth } from '../context/authContext';
import { 
  Sparkles, ShieldCheck, Cpu, ArrowRight, Activity, Zap, Play, Pause,
  Volume2, CheckCircle2, MessageSquare, Download, Layers, Shield, RefreshCw
} from 'lucide-react';
import React from 'react';

import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';
import { getApiUrl } from '../services/api';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Interactive Playground States
  const [previewText, setPreviewText] = React.useState("Welcome to the 21st Tech Speech Studio. Ready to transform text into soundwaves?");
  const [selectedVoice, setSelectedVoice] = React.useState("en-US-ChristopherNeural");
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewPlaying, setPreviewPlaying] = React.useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = React.useState("/demo.mp3");
  const [playgroundError, setPlaygroundError] = React.useState<string | null>(null);

  const playgroundAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const BACKEND_URL = getApiUrl();

  React.useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  const handlePlaygroundPreview = async () => {
    if (previewPlaying) {
      playgroundAudioRef.current?.pause();
      setPreviewPlaying(false);
      return;
    }

    // If audio is already synthesized and not loading, play it
    if (previewAudioUrl && !previewLoading) {
      playgroundAudioRef.current?.play().catch(e => console.error(e));
      setPreviewPlaying(true);
      return;
    }

    generatePreview();
  };

  const generatePreview = async () => {
    if (!previewText.trim()) return;
    setPreviewLoading(true);
    setPlaygroundError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tts/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voiceId: selectedVoice,
          text: previewText.substring(0, 150),
          speed: 1.0,
          pitch: 0,
          tone: 'neutral',
          depth: 0
        })
      });
      const data = await res.json();
      if (data.success && data.audioUrl) {
        let fullUrl = data.audioUrl;
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
          const baseUrl = BACKEND_URL.replace(/\/+$/, '');
          const cleanPath = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
          fullUrl = `${baseUrl}${cleanPath}`;
        }
        setPreviewAudioUrl(fullUrl);
        setPreviewPlaying(false);
        
        setTimeout(() => {
          if (playgroundAudioRef.current) {
            playgroundAudioRef.current.load();
            playgroundAudioRef.current.play()
              .then(() => setPreviewPlaying(true))
              .catch(e => console.error(e));
          }
        }, 100);
      } else {
        throw new Error(data.message || 'Failed to generate preview');
      }
    } catch (err: any) {
      console.error(err);
      setPlaygroundError('Generation failed. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-indigo-500 selection:text-white overflow-x-hidden relative transition-colors duration-200">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-900/5 blur-[140px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-input bg-background/80 px-6 md:px-12 py-4 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-black overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all duration-300">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 bg-clip-text text-transparent group-hover:text-foreground transition duration-200">
            21st Tech Company
          </span>
        </div>
        
        <nav className="flex items-center gap-4 sm:gap-6">
          <ThemeToggle />
          <a href="#features" className="hidden sm:inline-block text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-foreground transition">
            Features
          </a>
          <a href="#how-it-works" className="hidden sm:inline-block text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-foreground transition">
            How It Works
          </a>
          
          {user ? (
            <Link
              href={user.role === 'admin' ? '/admin' : '/dashboard'}
              className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold hover:bg-neutral-850 hover:border-neutral-700 text-neutral-200 transition duration-200 flex items-center gap-2"
            >
              Go to Studio <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition duration-200 shadow-md shadow-indigo-500/10 flex items-center gap-2"
            >
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/5 text-[11px] text-indigo-400 font-bold tracking-wide uppercase mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> Edge Neural Voice Technology
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-8 text-white">
          Synthetic Speech with <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-500 bg-clip-text text-transparent">
            Human-Grade Realism
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-neutral-400 text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-12 font-medium">
          Experience highly expressive AI voice generation. Build, preview, and export high-fidelity audio workflows in seconds. Formulated for high availability and low latency.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto justify-center">
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 font-bold text-sm text-white shadow-lg shadow-indigo-500/15 flex items-center gap-2 w-full sm:w-auto justify-center active:scale-98"
          >
            Launch Speech Studio <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="px-8 py-4 rounded-xl bg-neutral-950 border border-neutral-900 text-neutral-350 hover:bg-neutral-900 hover:text-white transition-all duration-300 font-bold text-sm w-full sm:w-auto text-center border-neutral-800"
          >
            Explore Platform
          </a>
        </div>

        {/* Interactive Preview Playground */}
        <div className="mt-16 w-full max-w-4xl p-1.5 rounded-2xl bg-neutral-900/35 border border-neutral-900/60 backdrop-blur-md shadow-2xl relative">
          <div className="absolute -inset-px bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 rounded-2xl -z-10" />
          
          <div className="p-6 md:p-8 rounded-xl bg-[#09090b]/80 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-neutral-900/80 pb-4">
              <div className="flex items-center gap-2 text-left w-full md:w-auto">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Live Synth Playground</span>
                  <span className="text-xs text-neutral-500">Synthesize text to preview our neural engine in real-time</span>
                </div>
              </div>

              {/* Voice select buttons */}
              <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
                {[
                  { id: 'en-US-ChristopherNeural', label: 'Christopher (US)' },
                  { id: 'en-GB-RyanNeural', label: 'Ryan (UK)' },
                  { id: 'en-US-AvaNeural', label: 'Ava (US)' },
                  { id: 'en-US-EmmaNeural', label: 'Emma (US)' }
                ].map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => {
                      setSelectedVoice(voice.id);
                      setPreviewAudioUrl(""); // Force regeneration
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                      selectedVoice === voice.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:border-neutral-750'
                    }`}
                  >
                    {voice.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch gap-4">
              {/* Text Input */}
              <div className="flex-1 flex flex-col gap-1.5 text-left">
                <textarea
                  value={previewText}
                  onChange={(e) => {
                    setPreviewText(e.target.value.substring(0, 150));
                    setPreviewAudioUrl(""); // Force regeneration
                    setPlaygroundError(null);
                  }}
                  placeholder="Type anything here to preview the AI voice..."
                  maxLength={150}
                  rows={2}
                  className="w-full bg-[#0d0d11] border border-neutral-900 rounded-xl p-3.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500/50 resize-none font-medium leading-relaxed"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-semibold px-1">
                  {playgroundError ? (
                    <span className="text-red-500">{playgroundError}</span>
                  ) : (
                    <span>Try changing the text or selecting another voice character!</span>
                  )}
                  <span>{150 - previewText.length} chars left</span>
                </div>
              </div>

              {/* Generate/Play Trigger */}
              <div className="flex items-center justify-center shrink-0">
                <button 
                  onClick={handlePlaygroundPreview}
                  disabled={previewLoading || !previewText.trim()}
                  className="px-6 py-4 md:py-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md shadow-indigo-500/10 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-55 w-full md:w-auto h-full shrink-0"
                >
                  {previewLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : previewPlaying ? (
                    <>
                      <Activity className="w-4 h-4 animate-pulse text-indigo-200" />
                      <span>Pause Preview</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                      <span>Synthesize & Play</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <audio 
            ref={playgroundAudioRef} 
            src={previewAudioUrl || undefined} 
            className="hidden" 
            onEnded={() => setPreviewPlaying(false)}
            onPause={() => setPreviewPlaying(false)}
            onPlay={() => setPreviewPlaying(true)}
          />
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-neutral-900/60 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
        
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-white">Engineered for Creative Speed</h2>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed font-medium">
            Discover a clean, unified workspace containing advanced speech synthesis tools, custom permission limits, and secure analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-950/20 hover:border-indigo-500/20 hover:bg-neutral-900/10 transition-all duration-300 flex flex-col items-start text-left relative group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-105 transition-transform duration-300">
              <Cpu className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold mb-2.5 text-neutral-100">Edge Voice Synthesis</h3>
            <p className="text-neutral-400 text-xs leading-relaxed font-medium">
              Utilize highly natural speech models with distinct emotions, pronunciations, and accents, mimicking human conversation flow.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-950/20 hover:border-indigo-500/20 hover:bg-neutral-900/10 transition-all duration-300 flex flex-col items-start text-left relative group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-105 transition-transform duration-300">
              <Layers className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold mb-2.5 text-neutral-100">Flexible Credit Quotas</h3>
            <p className="text-neutral-400 text-xs leading-relaxed font-medium">
              Keep utilization optimal with a credit-based limit. Characters are automatically mapped to credits, so short text scripts use less resources.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-950/20 hover:border-indigo-500/20 hover:bg-neutral-900/10 transition-all duration-300 flex flex-col items-start text-left relative group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold mb-2.5 text-neutral-100">Granular Admin Dashboard</h3>
            <p className="text-neutral-400 text-xs leading-relaxed font-medium">
              Monitor active users, toggle database records, update default limits, manage premium voices, and audit system statistics.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto border-t border-neutral-900/60 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-white">How It Works</h2>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed font-medium">
            Synthesize professional voiceovers in three simple phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="flex flex-col items-center text-center group">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-indigo-400 flex items-center justify-center font-bold text-xs mb-6 group-hover:border-indigo-500/30 transition-colors duration-300">1</div>
            <h4 className="text-base font-bold mb-2 text-neutral-100">Draft Your Script</h4>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-xs font-medium">Type or paste your text content directly into our dark-themed editor workspace.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-indigo-400 flex items-center justify-center font-bold text-xs mb-6 group-hover:border-indigo-500/30 transition-colors duration-300">2</div>
            <h4 className="text-base font-bold mb-2 text-neutral-100">Choose a Neural Model</h4>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-xs font-medium">Select from standard and premium voices featuring distinct genders and accents.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-indigo-400 flex items-center justify-center font-bold text-xs mb-6 group-hover:border-indigo-500/30 transition-colors duration-300">3</div>
            <h4 className="text-base font-bold mb-2 text-neutral-100">Synthesize & Download</h4>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-xs font-medium">Preview files inside our built-in waveform player or export stems directly in MP3 format.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative py-28 px-6 border-t border-[var(--border-app)] bg-gradient-to-b from-[var(--bg-app)] to-[var(--bg-card)] flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
        
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">Start Converting Text Today</h2>
        <p className="text-[var(--text-secondary)] max-w-lg mb-10 text-xs sm:text-sm font-medium leading-relaxed">
          Provide your team with instant high-quality voiceover generation. Unified onboarding allows instant access for sandbox profiles.
        </p>
        <Link
          href="/login"
          className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 font-bold text-sm text-white shadow-xl shadow-indigo-500/20 flex items-center gap-2 active:scale-98 cursor-pointer"
        >
          Sign In Instantly <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[var(--border-app)]/60 text-center text-[var(--text-muted)] text-[11px] font-medium bg-background">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} 21st Tech Company. All rights reserved.</span>
          <div className="flex gap-4 text-[var(--text-muted)]">
            <span className="hover:text-[var(--text-secondary)] transition cursor-pointer">Terms of Service</span>
            <span>&bull;</span>
            <span className="hover:text-[var(--text-secondary)] transition cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
