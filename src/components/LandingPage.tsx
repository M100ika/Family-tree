/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Users, 
  Scan, 
  UserPlus, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  Network 
} from "lucide-react";

interface LandingPageProps {
  onStartTree: () => void;
  onNavigateToTab: (tab: string) => void;
}

export default function LandingPage({ onStartTree, onNavigateToTab }: LandingPageProps) {
  return (
    <div className="space-y-16 pb-12" id="landing-page-root">
      
      {/* 1. HERO SECTION */}
      <section className="grid md:grid-cols-12 gap-8 items-center max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <div className="md:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/15 rounded-full text-secondary text-xs font-semibold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5" />
            <span>Reserving Family Legacies Together</span>
          </div>
          
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-tertiary leading-[1.08]">
            Every ancestor has a story waiting to be told.
          </h1>
          
          <p className="font-sans text-[#54684b] text-base md:text-lg leading-relaxed max-w-xl">
            Connect the branches of your family tree with our modern archival platform. Secure, collaborative, and powered by intelligent document scanning.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartTree}
              className="px-6 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm"
              id="hero-start-btn"
            >
              <span>Start Your Tree</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const stepSec = document.getElementById("steps-section");
                if (stepSec) stepSec.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-3.5 bg-white hover:bg-gray-50 text-tertiary font-bold rounded-lg border-2 border-[#eae8e3] transition-all text-sm"
            >
              How It Works
            </button>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <div className="flex -space-x-2">
              <img className="w-8 h-8 rounded-full border-2 border-[#fbf9f4]" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=72" alt="Avatar" referrerPolicy="no-referrer" />
              <img className="w-8 h-8 rounded-full border-2 border-[#fbf9f4]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=72" alt="Avatar" referrerPolicy="no-referrer" />
              <img className="w-8 h-8 rounded-full border-2 border-[#fbf9f4]" src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=72" alt="Avatar" referrerPolicy="no-referrer" />
            </div>
            <p className="text-xs text-[#6b5b50]/80 font-medium">
              Join <span className="font-bold text-tertiary">+10,000 families</span> mapping roots this year.
            </p>
          </div>
        </div>

        <div className="md:col-span-5 relative">
          <div className="aspect-square bg-surface-container rounded-2xl overflow-hidden shadow-xl border border-white/40">
            <img
              src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800"
              alt="Warm outdoor multigenerational family gathering"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-[#eae8e3] flex items-center gap-3 max-w-[210px] hidden sm:flex">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold">
              98%
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-tertiary">Accuracy Rate</h4>
              <p className="text-[10px] text-gray-500">AI handwritten cursive deciphering engine.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE STEPS */}
      <section className="bg-surface-container py-16 px-4" id="steps-section">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-tertiary">
            Three steps to your legacy
          </h2>
          <p className="text-[#6b5b50]/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Our streamlined process makes it easy for anyone to begin mapping their family history.
          </p>
          
          <div className="grid sm:grid-cols-3 gap-8 pt-8 max-w-5xl mx-auto text-left">
            <div className="bg-[#fbf9f4] p-6 rounded-xl border border-[#eae8e3] space-y-4">
              <div className="w-12 h-12 rounded-lg bg-secondary text-white flex items-center justify-center shadow-sm">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-tertiary">Add Relatives</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Start with yourself and branch out to parents, siblings, and grandparents effortlessly with intuitive quick-inputs.
              </p>
            </div>

            <div className="bg-[#fbf9f4] p-6 rounded-xl border border-[#eae8e3] space-y-4">
              <div className="w-12 h-12 rounded-lg bg-[#006591] text-white flex items-center justify-center shadow-sm">
                <Scan className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-tertiary">Scan Records</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Use our AI record tool to transcribe old birth certificates, war letters, census entries, and diaries in seconds.
              </p>
            </div>

            <div className="bg-[#fbf9f4] p-6 rounded-xl border border-[#eae8e3] space-y-4">
              <div className="w-12 h-12 rounded-lg bg-[#ab988b] text-white flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-tertiary">Invite Family</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Collaborate in real-time with cousins and aunts to fill in missing timeline events and solve ancestral puzzles together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE VALUES & FEATURE BOX GRIDS */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold tracking-widest text-[#006591] uppercase">Key Features</div>
          <h2 className="font-serif text-3xl font-extrabold text-tertiary">Designed for Preservation</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Card: Privacy First */}
          <div className="bg-white p-8 rounded-2xl border border-[#eae8e3] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-green-100 rounded text-green-800 text-xs font-bold uppercase tracking-wider">
                  Privacy First
                </span>
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-tertiary">Your history is yours alone.</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Unlike public indexing platforms, your records, notes, and family structures default to secure end-to-end encrypted spaces. Only share what you lock into your public registry branch.
              </p>
            </div>
            <div className="flex items-center gap-2 p-3.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 border border-[#eae8e3]">
              <CheckCircle2 className="w-4 h-4 text-[#006591]" />
              <span>Full compliance with digital lineage protection laws.</span>
            </div>
          </div>

          {/* Card: AI Document Insight */}
          <div className="bg-[#003751] text-white p-8 rounded-2xl flex flex-col justify-between space-y-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-44 h-44 bg-primary/20 blur-2xl rounded-full" />
            
            <div className="space-y-4 relative z-10">
              <span className="px-2.5 py-0.5 bg-[#006591] rounded text-white text-xs font-bold uppercase tracking-wider inline-block">
                AI Record Scanning
              </span>
              <h3 className="font-serif text-2xl font-bold text-amber-50">AI Document Insight</h3>
              <p className="text-xs text-blue-100 leading-relaxed">
                Turn blurry, 19th-century cursive or faded census letters into clean, search-indexed digital text utilizing our proprietary server-side transcript OCR engine.
              </p>
            </div>

            {/* Visual cursive snippet representing handwritten letter */}
            <div className="mt-4 p-4 bg-[#fbf9f4] text-gray-700 font-serif text-[11px] font-medium leading-relaxed italic border-l-4 border-amber-400 rounded-r-lg max-w-sm relative z-10 shadow-md">
              <p className="opacity-70 font-serif italic text-gray-800">
                "... Arthur married Mary Eleanor on Skegness Beach June 4th ... our lineage was secure under the oak and stone ..."
              </p>
              <div className="text-[9px] mt-2 text-[#006591] font-sans font-bold uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                <span>Transcript Deciphered by Gemini Client</span>
              </div>
            </div>
          </div>

          {/* Card: Collective Memory */}
          <div className="bg-white p-8 rounded-2xl border border-[#eae8e3] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-blue-100 rounded text-blue-800 text-xs font-bold uppercase tracking-wider">
                  Real-time Collab
                </span>
                <Network className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-tertiary">Collective Memory</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Connect and merge branches with verified relatives to solve historical genealogical mysteries in shared, real-time vaults. Combine pictures and verify discrepancies smoothly.
              </p>
            </div>
            <button 
              onClick={() => onNavigateToTab("archives")} 
              className="text-[#006591] text-xs font-bold flex items-center gap-1 hover:underline text-left mt-2"
            >
              Learn about Archives Explorer &rarr;
            </button>
          </div>

          {/* Card: Connections Mini-Map */}
          <div className="bg-stone-50 p-6 rounded-2xl border border-[#eae8e3] flex items-center justify-center">
            <div className="w-full max-w-sm bg-white p-5 rounded-xl border border-gray-100 shadow-md space-y-4">
              <div className="text-center font-serif text-xs font-bold text-gray-400">SAMPLE HOUSEHOLD CONNECTIONS</div>
              
              <div className="flex items-center justify-between">
                <div className="p-3 border rounded-lg bg-surface flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-300">
                    <img className="w-8 h-8 rounded-full" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=72" alt="Arthur" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <div className="text-xs font-serif font-bold">Arthur Thorne</div>
                    <div className="text-[10px] text-gray-400">1892 – 1964</div>
                  </div>
                </div>

                <div className="w-10 border-t-2 border-dotted border-tertiary" />

                <div className="p-3 border-2 border-primary rounded-lg bg-primary/5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#ab988b]">
                    <img className="w-8 h-8 rounded-full" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=72" alt="Eleanor" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <div className="text-xs font-serif font-bold text-primary">Elena Thorne</div>
                    <div className="text-[10px] text-gray-400">1895 – 1982</div>
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-400 font-sans">
                Double-bordered cards denote selected focus branches.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. PRE-FOOTER */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-[#506447] text-white rounded-2xl p-8 md:p-14 text-center space-y-6 relative overflow-hidden">
          {/* Subtle nature backplate leaf/forest design aspect */}
          <div className="absolute inset-0 bg-cover bg-center mix-blend-multiply opacity-20" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1200')` }} />
          
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-white">Ready to discover your roots?</h2>
            <p className="text-xs md:text-sm text-green-100 leading-relaxed">
              Create an account today and start tracing your lineage back for centuries with our powerful family mapping and document scanner elements.
            </p>
            <div className="pt-4">
              <button
                onClick={onStartTree}
                className="px-8 py-4 bg-[#fbf9f4] hover:bg-white text-secondary font-extrabold text-sm rounded-lg shadow-md transition-all active:scale-[0.98]"
              >
                Create Free Account
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
