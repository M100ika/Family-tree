/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  User, 
  LogOut, 
  Globe, 
  Mail, 
  Share2, 
  Book, 
  ChevronDown, 
  HelpCircle,
  Menu,
  X,
  Sparkles
} from "lucide-react";

import { Person, ArchiveRecord, SharedMemory } from "./types";
import { INITIAL_PEOPLE, INITIAL_RECORDS, INITIAL_MEMORIES } from "./seedData";

// Sub-components
import LandingPage from "./components/LandingPage";
import MyTree from "./components/MyTree";
import ArchivesPage from "./components/ArchivesPage";
import BiographyPage from "./components/BiographyPage";
import LoginPage from "./components/LoginPage";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedPersonId, setSelectedPersonId] = useState<string>("john-harrison");
  const [activeUserEmail, setActiveUserEmail] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Core application states loaded from localStorage or seeded
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [memories, setMemories] = useState<SharedMemory[]>([]);

  // 1. Initial State Loading from LocalStorage on mount
  useEffect(() => {
    const cachedPeople = localStorage.getItem("lineage_people");
    const cachedRecords = localStorage.getItem("lineage_records");
    const cachedMemories = localStorage.getItem("lineage_memories");
    const cachedUser = localStorage.getItem("lineage_user_email");

    if (cachedPeople) {
      setPeople(JSON.parse(cachedPeople));
    } else {
      setPeople(INITIAL_PEOPLE);
      localStorage.setItem("lineage_people", JSON.stringify(INITIAL_PEOPLE));
    }

    if (cachedRecords) {
      setRecords(JSON.parse(cachedRecords));
    } else {
      setRecords(INITIAL_RECORDS);
      localStorage.setItem("lineage_records", JSON.stringify(INITIAL_RECORDS));
    }

    if (cachedMemories) {
      setMemories(JSON.parse(cachedMemories));
    } else {
      setMemories(INITIAL_MEMORIES);
      localStorage.setItem("lineage_memories", JSON.stringify(INITIAL_MEMORIES));
    }

    if (cachedUser) {
      setActiveUserEmail(cachedUser);
    }
  }, []);

  // 2. Persisters
  const persistPeople = (updated: Person[]) => {
    setPeople(updated);
    localStorage.setItem("lineage_people", JSON.stringify(updated));
  };

  const persistRecords = (updated: ArchiveRecord[]) => {
    setRecords(updated);
    localStorage.setItem("lineage_records", JSON.stringify(updated));
  };

  const persistMemories = (updated: SharedMemory[]) => {
    setMemories(updated);
    localStorage.setItem("lineage_memories", JSON.stringify(updated));
  };

  // 3. Custom Addition handlings
  const handleAddPerson = (newPerson: Person) => {
    const updated = [...people, newPerson];
    persistPeople(updated);
  };

  const handleAddRecord = (newRecord: ArchiveRecord) => {
    const updated = [newRecord, ...records];
    persistRecords(updated);
  };

  const handleAddMemory = (newMemory: SharedMemory) => {
    const updated = [newMemory, ...memories];
    persistMemories(updated);
  };

  const handleAddTimelineEvent = (personId: string, event: any) => {
    const updated = people.map(p => {
      if (p.id === personId) {
        const currentTimeline = p.timeline || [];
        return {
          ...p,
          timeline: [...currentTimeline, event]
        };
      }
      return p;
    });
    persistPeople(updated);
  };

  const handleUpdateBioNote = (personId: string, newBio: string, newQuote: string) => {
    const updated = people.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          bio: newBio,
          quote: newQuote
        };
      }
      return p;
    });
    persistPeople(updated);
  };

  const handleLoginSuccess = (email: string) => {
    setActiveUserEmail(email);
    localStorage.setItem("lineage_user_email", email);
    setActiveTab("tree"); // Auto redirect to tree upon logging in
  };

  const handleLogout = () => {
    setActiveUserEmail("");
    localStorage.removeItem("lineage_user_email");
    setActiveTab("home");
  };

  // Header quick ancestry lookup matches
  const matchingAncestors = searchQuery.trim()
    ? people.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectTabWithPerson = (tab: string, personId?: string) => {
    if (personId) {
      setSelectedPersonId(personId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activePerson = people.find(p => p.id === selectedPersonId) || people[0];

  return (
    <div className="min-h-screen bg-[#fbf9f4] flex flex-col justify-between" id="app-root-shell">
      
      {/* ==========================================
          A. BRAND NAVIGATION INTEGRATED HEADER
          ========================================== */}
      <header className="bg-white border-b border-[#eae8e3] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-18 flex items-center justify-between">
          
          {/* Left Brand Area */}
          <div 
            onClick={() => handleSelectTabWithPerson("home")} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <BookOpen className="w-6 h-6 text-secondary transition-transform group-hover:rotate-3" />
            <span className="font-serif text-xl font-extrabold text-tertiary tracking-tight">Digital Lineage</span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6" id="desktop-nav">
            <button
              onClick={() => handleSelectTabWithPerson("home")}
              className={`py-1 text-sm font-bold transition-all border-b-2 ${
                activeTab === "home" 
                  ? "border-secondary text-[#506447]" 
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleSelectTabWithPerson("tree")}
              className={`py-1 text-sm font-bold transition-all border-b-2 ${
                activeTab === "tree" 
                  ? "border-secondary text-[#506447]" 
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              My Tree
            </button>
            <button
              onClick={() => handleSelectTabWithPerson("archives")}
              className={`py-1 text-sm font-bold transition-all border-b-2 ${
                activeTab === "archives" 
                  ? "border-secondary text-[#506447]" 
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Archives
            </button>
          </nav>

          {/* Right Controls (Instant Search Finder & Auth Button) */}
          <div className="hidden md:flex items-center gap-4 relative z-40">
            {/* Quick Ancestry Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Find relative..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9 pr-4 py-2 bg-stone-50 border border-gray-200 rounded-lg text-xs leading-none focus:outline-none focus:border-secondary w-44 focus:w-56 transition-all text-gray-700"
              />

              {/* Dynamic Droplist box */}
              {showDropdown && matchingAncestors.length > 0 && (
                <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-xl w-60 overflow-hidden divide-y divide-gray-50 animate-fade-in text-left">
                  <div className="p-2 text-[10px] uppercase tracking-wider text-gray-400 font-bold bg-[#fbf9f4]">
                    Matching Ancestor Search
                  </div>
                  {matchingAncestors.map(match => (
                    <div
                      key={match.id}
                      onClick={() => {
                        handleSelectTabWithPerson("bio", match.id);
                        setSearchQuery("");
                        setShowDropdown(false);
                      }}
                      className="p-2.5 hover:bg-stone-50 cursor-pointer flex items-center gap-2.5 transition"
                    >
                      <img className="w-7 h-7 rounded-full object-cover" src={match.avatarUrl} alt={match.firstName} referrerPolicy="no-referrer" />
                      <div>
                        <div className="text-xs font-bold text-gray-750">{match.firstName} {match.lastName}</div>
                        <div className="text-[9px] text-gray-400">{match.birthYear} &ndash; {match.deathYear || "Present"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Session Switch */}
            {activeUserEmail ? (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-xs ring-2 ring-secondary/20 uppercase" title={activeUserEmail}>
                  {activeUserEmail[0]}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleSelectTabWithPerson("login")}
                className="px-4.5 py-2 bg-[#006591] hover:bg-[#003751] text-white text-xs font-bold rounded-lg shadow transition active:scale-95 text-center"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex md:hidden items-center gap-2">
            {activeUserEmail && (
              <div className="w-7.5 h-7.5 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-xs">
                {activeUserEmail[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded text-gray-500"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown Tray */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white p-4 space-y-3 shadow-inner">
            <button
              onClick={() => { handleSelectTabWithPerson("home"); setMobileMenuOpen(false); }}
              className="block w-full py-2 text-left text-sm font-bold text-gray-700"
            >
              Home
            </button>
            <button
              onClick={() => { handleSelectTabWithPerson("tree"); setMobileMenuOpen(false); }}
              className="block w-full py-2 text-left text-sm font-bold text-gray-700"
            >
              My Tree
            </button>
            <button
              onClick={() => { handleSelectTabWithPerson("archives"); setMobileMenuOpen(false); }}
              className="block w-full py-2 text-left text-sm font-bold text-gray-700"
            >
              Archives
            </button>
            {activeUserEmail ? (
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="block w-full py-2 text-left text-sm font-bold text-red-600 flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({activeUserEmail})</span>
              </button>
            ) : (
              <button
                onClick={() => { handleSelectTabWithPerson("login"); setMobileMenuOpen(false); }}
                className="block w-full py-2 px-3 bg-primary text-white text-center rounded text-sm font-bold"
              >
                Sign In
              </button>
            )}
          </div>
        )}

      </header>

      {/* Close-on-click background for search results dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-30 pointer-events-auto" onClick={() => setShowDropdown(false)} />
      )}

      {/* ==========================================
          B. CENTRAL COMPONENT ROUTER PANEL
          ========================================== */}
      <main className="flex-1 w-full bg-[#fbf9f4] leading-normal min-h-[750px]">
        {activeTab === "home" && (
          <LandingPage 
            onStartTree={() => handleSelectTabWithPerson("tree")} 
            onNavigateToTab={(tab) => handleSelectTabWithPerson(tab)}
          />
        )}

        {activeTab === "tree" && (
          <MyTree 
            people={people} 
            records={records}
            selectedPersonId={selectedPersonId}
            onSelectPerson={(id) => setSelectedPersonId(id)}
            onAddPerson={handleAddPerson}
            onNavigateToTab={handleSelectTabWithPerson}
          />
        )}

        {activeTab === "archives" && (
          <ArchivesPage 
            records={records}
            people={people}
            onAddRecord={handleAddRecord}
            onNavigateToTab={handleSelectTabWithPerson}
          />
        )}

        {activeTab === "bio" && activePerson && (
          <BiographyPage 
            person={activePerson}
            people={people}
            memories={memories}
            onAddMemory={handleAddMemory}
            onSelectPerson={(id) => setSelectedPersonId(id)}
            onAddTimelineEvent={handleAddTimelineEvent}
            onUpdateBioNote={handleUpdateBioNote}
          />
        )}

        {activeTab === "login" && (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess} 
            onClose={() => handleSelectTabWithPerson("home")}
          />
        )}
      </main>

      {/* ==========================================
          C. PROFESSIONAL HERITAGE FOOTER (Screen 1)
          ========================================== */}
      <footer className="bg-[#1b1c19] text-[#e4e2dd] py-12 px-4 border-t border-[#30312e]" id="app-footer-bar">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          <div className="md:col-span-5 space-y-4 text-left">
            <div className="flex items-center gap-2 text-white">
              <BookOpen className="w-5.5 h-5.5 text-secondary-container" />
              <span className="font-serif text-lg font-bold tracking-tight">Digital Lineage</span>
            </div>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              We preserve, transcribe, and catalog the unique moral fibers of historic households. Secure collaborative networks mapping multi-generational continuity.
            </p>
            <p className="text-[10px] text-gray-500 font-mono">
              &copy; 2026 Digital Lineage Project. Preserving history for the next generation.
            </p>
          </div>

          <div className="md:col-span-3 text-left">
            <h4 className="font-serif text-sm font-bold text-white mb-3">The Project</h4>
            <div className="flex flex-col gap-2 text-xs text-gray-400 font-sans">
              <a href="#mission" className="hover:text-white transition">Family Heritage Mission</a>
              <a href="#about" className="hover:text-white transition">About Us / Archive Forum</a>
              <a href="#support" className="hover:text-white transition flex items-center gap-1">
                <span>Contact Heritage Support</span>
              </a>
            </div>
          </div>

          <div className="md:col-span-4 text-left">
            <h4 className="font-serif text-sm font-bold text-white mb-3">Legal & Encryptions</h4>
            <div className="flex flex-col gap-2 text-xs text-gray-400 font-sans">
              <a href="#privacy" className="hover:text-white transition">Privacy Policy (Vault Isolation)</a>
              <a href="#terms" className="hover:text-white transition">Terms of Service & Data Rights</a>
              
              <div className="flex items-center gap-3.5 pt-3 text-gray-500">
                <Globe className="w-4.5 h-4.5 hover:text-white transition cursor-pointer" />
                <Mail className="w-4.5 h-4.5 hover:text-white transition cursor-pointer" />
                <Share2 className="w-4.5 h-4.5 hover:text-white transition cursor-pointer" />
              </div>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
