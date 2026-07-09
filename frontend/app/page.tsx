'use client';

import Link from 'next/link';
import { useAuth } from '../context/authContext';
import { Sparkles, AudioLines, ShieldCheck, Cpu, ArrowRight, Activity, Zap } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-50 selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-neutral-900 bg-neutral-950/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <AudioLines className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-neutral-50 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
            21st Tech Company
          </span>
        </div>
        <nav className="flex items-center gap-4">
          {user ? (
            <Link
              href={user.role === 'admin' ? '/admin/users' : '/dashboard'}
              className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-medium hover:bg-neutral-850 transition duration-200 flex items-center gap-2"
            >
              Go to Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium hover:bg-indigo-500 transition duration-200 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[250px] h-[250px] rounded-full bg-purple-500/10 blur-[100px] -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-xs text-indigo-400 font-semibold tracking-wide uppercase mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI TTS Engine
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight mb-8">
          Natural Voices, <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Synthesized Instantly
          </span>
        </h1>

        <p className="text-neutral-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-12">
          Experience highly natural speech synthesis built for modern SaaS products. Replace generic voices with high-fidelity Edge models, completely free.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/login"
            className="px-8 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold text-base shadow-xl shadow-indigo-500/20 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            Launch Speech Studio <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#features"
            className="px-8 py-4 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-850 hover:text-white transition font-medium text-base w-full sm:w-auto text-center"
          >
            Explore Capabilities
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-neutral-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Engineered for Quality</h2>
          <p className="text-neutral-400 max-w-xl mx-auto text-base">
            Our platform provides clean outputs, flexible voice maps, and high availability without massive premium costs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-950 hover:border-indigo-500/20 hover:bg-neutral-900/50 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
              <Cpu className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Edge Neural Voices</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Utilize highly natural speech models with distinct emotions, pronunciations, and accents, mimicking human conversation.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-950 hover:border-indigo-500/20 hover:bg-neutral-900/50 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Credit-Based Limits</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Track utilization with a fair allocation limit. Short texts consume fewer credits than long texts for optimum efficiency.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-950 hover:border-indigo-500/20 hover:bg-neutral-900/50 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Admin Controls</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Monitor active users, toggle database records, update defaults, and grant premium rights in real time.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-neutral-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
          <p className="text-neutral-400 max-w-xl mx-auto text-base">
            Get from text to mp3 in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-indigo-400 flex items-center justify-center font-bold text-sm mb-6">1</div>
            <h4 className="text-lg font-semibold mb-2">Write Text</h4>
            <p className="text-neutral-400 text-sm">Enter the script or text you want to synthesize into the editor workspace.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-indigo-400 flex items-center justify-center font-bold text-sm mb-6">2</div>
            <h4 className="text-lg font-semibold mb-2">Select Voice</h4>
            <p className="text-neutral-400 text-sm">Choose from high-quality neural models (Male/Female, US/UK accents).</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-indigo-400 flex items-center justify-center font-bold text-sm mb-6">3</div>
            <h4 className="text-lg font-semibold mb-2">Listen & Download</h4>
            <p className="text-neutral-400 text-sm">Listen directly in our premium web player or download the file as an MP3.</p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative py-24 px-6 border-t border-neutral-900 bg-gradient-to-b from-neutral-950 to-neutral-900 flex flex-col items-center text-center">
        <h2 className="text-4xl font-bold tracking-tight mb-4">Start Converting Speech Today</h2>
        <p className="text-neutral-400 max-w-lg mb-10">
          Equip your team with instant high-quality voiceover generation. Free allocations included for all internal accounts.
        </p>
        <Link
          href="/login"
          className="px-8 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold text-base shadow-xl shadow-indigo-500/20 flex items-center gap-2"
        >
          Sign In Now <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <footer className="py-8 px-6 border-t border-neutral-900 text-center text-neutral-500 text-xs bg-neutral-950">
        &copy; {new Date().getFullYear()} 21st Tech Company. All rights reserved. Built for production-ready performance.
      </footer>
    </div>
  );
}
