/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Heart, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  Plus, 
  Cpu, 
  Sparkles, 
  ChevronRight, 
  UserPlus, 
  Image as ImageIcon, 
  FileText, 
  Clock, 
  Award,
  PenTool,
  Quote,
  AlertCircle,
  X
} from "lucide-react";
import { Person, SharedMemory, TimelineEvent } from "../types";

interface BiographyPageProps {
  person: Person;
  people: Person[];
  memories: SharedMemory[];
  onAddMemory: (newMemory: SharedMemory) => void;
  onSelectPerson: (id: string) => void;
  onAddTimelineEvent: (personId: string, event: TimelineEvent) => void;
  onUpdateBioNote: (personId: string, newBio: string, newQuote: string) => void;
}

export default function BiographyPage({
  person,
  people,
  memories,
  onAddMemory,
  onSelectPerson,
  onAddTimelineEvent,
  onUpdateBioNote
}: BiographyPageProps) {
  // Comment Form States
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  
  // AI assist states
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishError, setPolishError] = useState("");

  // Timeline insertion states
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [timeYear, setTimeYear] = useState("");
  const [timeTitle, setTimeTitle] = useState("");
  const [timeDesc, setTimeDesc] = useState("");
  const [timeType, setTimeType] = useState<"birth" | "marriage" | "child" | "death" | "other">("other");

  // Get comments associated with this person
  const personMemories = memories.filter(m => m.personId === person.id);

  // Get relatives nodes
  const father = people.find(p => p.id === person.fatherId);
  const mother = people.find(p => p.id === person.motherId);
  const spouse = people.find(p => p.id === person.spouseId);
  
  // Find immediate children
  const children = people.filter(p => p.fatherId === person.id || p.motherId === person.id);

  // Invoke AI Biography Generator in server.ts
  const handleAIBiographyPolish = async () => {
    setIsPolishing(true);
    setPolishError("");

    try {
      const res = await fetch("/api/generate-bio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: `${person.firstName} ${person.lastName}`,
          birthYear: person.birthYear,
          deathYear: person.deathYear,
          birthPlace: person.birthPlace,
          highlights: [
            person.gender === "female" ? "her agricultural botanic gardens" : "his master landscape designs",
            "archival mapping preservation",
            "inspiring future lineage descendants"
          ]
        })
      });

      const data = await res.json();
      if (res.ok) {
        onUpdateBioNote(person.id, data.story, data.quote);
      } else {
        throw new Error(data.error || "Biography helper failed.");
      }
    } catch (err: any) {
      console.error(err);
      setPolishError(err.message || "An error occurred calling the Gemini AI Storyteller.");
    } finally {
      setIsPolishing(false);
    }
  };

  const handlePostMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAuthor || !commentText) return;

    const initials = commentAuthor
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "JD";

    const created: SharedMemory = {
      id: `mem-${Date.now()}`,
      personId: person.id,
      authorName: commentAuthor,
      authorInitials: initials,
      text: commentText,
      dateStr: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    };

    onAddMemory(created);
    setCommentAuthor("");
    setCommentText("");
  };

  const handleTimelineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeYear || !timeTitle) return;

    const created: TimelineEvent = {
      id: `t-evt-${Date.now()}`,
      year: timeYear,
      monthAndYear: `${timeYear.toUpperCase()}`,
      title: timeTitle,
      description: timeDesc || "Historical occurrence recorded.",
      type: timeType
    };

    onAddTimelineEvent(person.id, created);
    setIsAddingTimeline(false);
    setTimeYear("");
    setTimeTitle("");
    setTimeDesc("");
  };

  // Preset default photos for Eleanor / standard profile for visual gallery
  const defaultGallery = [
    "https://images.unsplash.com/photo-1507208773393-40090c24c79f?auto=format&fit=crop&q=80&w=400", // Vintage countryside daughters field
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=400", // Vintage map / letter paper
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=400"  // Historic tree icon
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-8" id="bio-screener-view">
      
      {/* 1. BIOGRAPHY HEADER SUMMARY BAR */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#eae8e3] flex flex-col md:flex-row items-center gap-6 md:gap-8 justify-between">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          {/* Avatar frame */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden shadow-lg border-4 border-white ring-4 ring-[#eae8e3] bg-stone-100">
              <img 
                src={person.avatarUrl} 
                alt={person.firstName} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Interactive Edit marker */}
            <div className="absolute bottom-1 right-1 bg-secondary text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-secondary/90 transition">
              <PenTool className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-tertiary">
                {person.firstName} {person.lastName}
              </h1>
              {person.maidenName && (
                <span className="font-serif text-lg text-secondary italic">
                  (née {person.maidenName})
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>LIFESPAN: {person.birthYear} – {person.deathYear || "Present"}</span>
              </span>
              {person.birthPlace && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-[#006591]" />
                  <span className="truncate max-w-[200px]">{person.birthPlace}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Bio storyteller button (AI integration) */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <button
            onClick={handleAIBiographyPolish}
            disabled={isPolishing}
            className="px-4 py-2.5 bg-secondary text-white hover:bg-secondary/95 text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            id="ai-polish-btn"
          >
            <Sparkles className={`w-4 h-4 text-amber-300 ${isPolishing ? "animate-spin" : ""}`} />
            <span>{isPolishing ? "Rewriting Story..." : "AI Story Teller Maker"}</span>
          </button>
          <span className="text-[9px] text-gray-400 font-sans">Leveraging gemini-3.5-flash server-side API.</span>
        </div>
      </div>

      {polishError && (
        <div className="p-3 bg-red-50 text-red-700 rounded text-xs flex items-center gap-1.5 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{polishError}</span>
        </div>
      )}

      {/* 2. MAIN SPLIT COLUMNS WRAPPER */}
      <div className="grid md:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Biography textual body & Comment Feed (70%) */}
        <div className="md:col-span-8 space-y-8">
          
          {/* A. Bio detail box */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#eae8e3] space-y-6">
            <h3 className="font-serif text-xl font-bold text-tertiary pb-3 border-b border-gray-100">
              Biography & Chronicles
            </h3>

            {/* Quote container */}
            {person.quote && (
              <div className="p-5 bg-stone-50 rounded-xl border-l-4 border-[#506447] italic text-xs leading-relaxed text-gray-700 font-serif relative">
                <Quote className="absolute top-2.5 right-3 w-8 h-8 text-secondary/15 select-none pointer-events-none" />
                <p className="relative z-10 font-serif">
                  {person.quote}
                </p>
                <p className="text-[10px] text-[#506447] font-sans font-bold mt-2 uppercase tracking-wide">
                  &mdash; Attributed life philosophy
                </p>
              </div>
            )}

            <div className="font-sans text-sm text-gray-600 leading-loose whitespace-pre-line space-y-4">
              {person.bio || "No biography narrative generated yet. Tap the AI Story Teller Maker button above to dynamically render an elegant story!"}
            </div>
          </div>

          {/* B. Vintage Photographic Gallery (Screen 4 gallery) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#eae8e3] space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-serif text-lg font-bold text-tertiary">Historical Photo Inventory (3)</h3>
              <a href="#view-gallery" className="text-xs text-[#006591] font-bold hover:underline">
                View All Records &rarr;
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {defaultGallery.map((img, idx) => (
                <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-50 border shadow-inner">
                  <img src={img} alt="Historical memory" className="w-full h-full object-cover hover:scale-105 duration-300" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>

          {/* C. Comment Feed & Story Board */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#eae8e3] space-y-6" id="memories-section">
            <h3 className="font-serif text-lg font-bold text-tertiary pb-3 border-b border-gray-100">
              Family Story Board ({personMemories.length})
            </h3>

            {/* Comments List */}
            {personMemories.length > 0 ? (
              <div className="space-y-4">
                {personMemories.map(m => (
                  <div key={m.id} className="p-4 bg-stone-50 rounded-xl border border-gray-100 flex gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#ab988b] text-white flex-shrink-0 flex items-center justify-center font-bold text-xs" id={`init-${m.id}`}>
                      {m.authorInitials || "JD"}
                    </div>
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-tertiary">{m.authorName}</span>
                        <span className="text-[10px] text-gray-400">{m.dateStr}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-sans mt-1">
                        {m.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-stone-50 text-center rounded-xl border border-dashed border-gray-250">
                <p className="text-xs text-gray-400 italic">No custom stories posted yet. Be the first to share a reflection!</p>
              </div>
            )}

            {/* Posting Addition Form */}
            <form onSubmit={handlePostMemorySubmit} className="space-y-3.5 pt-2 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-700">Add your memory:</div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Your Name (e.g., Margaret Davenport)"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbf9f4] border border-[#eae8e3] rounded text-xs text-gray-800 focus:outline-[#506447]"
                />

                <textarea
                  rows={3}
                  required
                  placeholder="Share a story, quote, or personal memory about Eleanor..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full p-3 bg-[#fbf9f4] border border-[#eae8e3] rounded text-xs text-gray-800 focus:outline-[#506447] resize-none"
                />

                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
                >
                  Post Memory Call Note
                </button>
              </div>
            </form>

          </div>

        </div>

        {/* RIGHT COLUMN: Life Timeline Steps and Immediate Family List (30%) */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Timeline Node Roadmap */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#eae8e3] space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-serif text-lg font-bold text-tertiary">Life Timeline</h3>
              <button
                type="button"
                onClick={() => setIsAddingTimeline(true)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-gray-500 transition-all active:scale-90"
                title="Add Life Milestone"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Timeline Vertical Track */}
            {person.timeline && person.timeline.length > 0 ? (
              <div className="relative border-l border-gray-200 pl-4 ml-2.5 py-2 space-y-5">
                {person.timeline.map(evt => (
                  <div key={evt.id} className="relative">
                    {/* Circle Dot bullet */}
                    <div className="absolute top-1 -left-[22.5px] w-3 h-3 bg-secondary rounded-full border-2 border-white ring-2 ring-secondary/25" />
                    
                    <div className="text-[9px] font-bold text-secondary uppercase tracking-widest leading-none">
                      {evt.monthAndYear || evt.year}
                    </div>
                    <div className="text-xs font-bold text-tertiary mt-1">
                      {evt.title}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {evt.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-stone-50 text-center rounded border border-dashed text-[11px] text-gray-400">
                No life steps listed. Add milestone above!
              </div>
            )}
          </div>

          {/* Immediate Family Cards list (Screen 4 Right list) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#eae8e3] space-y-4">
            <h3 className="font-serif text-lg font-bold text-tertiary pb-2 border-b border-gray-150">
              Immediate Family
            </h3>

            <div className="space-y-2">
              
              {father && (
                <div 
                  onClick={() => onSelectPerson(father.id)}
                  className="p-2.5 rounded-lg border border-gray-100 hover:bg-[#fbf9f4] cursor-pointer flex items-center justify-between transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <img className="w-8 h-8 rounded-full object-cover" src={father.avatarUrl} alt={father.firstName} referrerPolicy="no-referrer" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-700">{father.firstName} {father.lastName}</div>
                      <div className="text-[10px] text-gray-400">Father • {father.birthYear}–{father.deathYear || "Pres."}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              )}

              {mother && (
                <div 
                  onClick={() => onSelectPerson(mother.id)}
                  className="p-2.5 rounded-lg border border-gray-100 hover:bg-[#fbf9f4] cursor-pointer flex items-center justify-between transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <img className="w-8 h-8 rounded-full object-cover" src={mother.avatarUrl} alt={mother.firstName} referrerPolicy="no-referrer" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-700">{mother.firstName} {mother.lastName}</div>
                      <div className="text-[10px] text-gray-400">Mother • {mother.birthYear}–{mother.deathYear || "Pres."}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              )}

              {spouse && (
                <div 
                  onClick={() => onSelectPerson(spouse.id)}
                  className="p-2.5 rounded-lg border border-gray-100 hover:bg-[#fbf9f4] cursor-pointer flex items-center justify-between transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <img className="w-8 h-8 rounded-full object-cover" src={spouse.avatarUrl} alt={spouse.firstName} referrerPolicy="no-referrer" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-700">{spouse.firstName} {spouse.lastName}</div>
                      <div className="text-[10px] text-gray-400">Spouse • {spouse.birthYear}–{spouse.deathYear || "Pres."}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              )}

              {children.map(child => (
                <div 
                  key={child.id}
                  onClick={() => onSelectPerson(child.id)}
                  className="p-2.5 rounded-lg border border-gray-100 hover:bg-[#fbf9f4] cursor-pointer flex items-center justify-between transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <img className="w-8 h-8 rounded-full object-cover" src={child.avatarUrl} alt={child.firstName} referrerPolicy="no-referrer" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-700">{child.firstName} {child.lastName}</div>
                      <div className="text-[10px] text-gray-400">Child • {child.birthYear}–{child.deathYear || "Pres."}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              ))}

              <div className="border border-dashed border-[#bec8d2] hover:border-secondary hover:bg-stone-50 cursor-pointer p-2 rounded text-center transition flex justify-center items-center gap-1.5 text-xs font-bold text-stone-500">
                <UserPlus className="w-4 h-4 text-gray-450" />
                <span>+ Link Relative Branch</span>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* MODAL 3: ADD TIMELINE MILESTONE */}
      {isAddingTimeline && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden animate-zoom-in">
            
            <div className="bg-[#ab988b] text-white p-4 justify-between flex items-center">
              <h3 className="font-serif font-bold">Add Life Milestone</h3>
              <button onClick={() => setIsAddingTimeline(false)} className="text-white hover:text-white/80">&times;</button>
            </div>

            <form onSubmit={handleTimelineSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Year</label>
                <input
                  type="text"
                  required
                  value={timeYear}
                  onChange={(e) => setTimeYear(e.target.value)}
                  placeholder="e.g. 1912"
                  className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-250 rounded text-xs focus:outline-[#ab988b]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={timeTitle}
                  onChange={(e) => setTimeTitle(e.target.value)}
                  placeholder="e.g., Graduated Cambridge"
                  className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-250 rounded text-xs focus:outline-[#ab988b]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Select Category</label>
                <select
                  value={timeType}
                  onChange={(e: any) => setTimeType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-250 rounded text-xs focus:outline-[#ab988b]"
                >
                  <option value="birth">Birth Event</option>
                  <option value="marriage">Marriage Ceremony</option>
                  <option value="child">Birth of Child</option>
                  <option value="death">Passing</option>
                  <option value="other">Other Event</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  value={timeDesc}
                  onChange={(e) => setTimeDesc(e.target.value)}
                  placeholder="e.g. St. Luke's hospital, with honours..."
                  className="w-full p-2.5 bg-[#fbf9f4] border border-gray-250 rounded text-xs focus:outline-[#ab988b] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddingTimeline(false)}
                  className="px-3 py-2 text-xs text-gray-500 hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ab988b] hover:bg-[#ab988b]/95 text-white text-xs font-bold rounded"
                >
                  Add Event Milestone
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
