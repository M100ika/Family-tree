/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Search,
  LogOut,
  Globe,
  Mail,
  Share2,
  Menu,
  X,
} from "lucide-react";

import { Person, ArchiveRecord, SharedMemory } from "./types";
import { useAuth } from "./context/AuthContext";
import {
  fetchPeople,
  fetchRecords,
  fetchAllMemories,
  insertPerson,
  updatePerson,
  deletePerson,
  insertRecord,
  insertMemory,
  insertTimelineEvent,
  updatePersonBio,
} from "./lib/db";

import LandingPage    from "./components/LandingPage";
import MyTree         from "./components/MyTree";
import ArchivesPage   from "./components/ArchivesPage";
import BiographyPage  from "./components/BiographyPage";
import LoginPage      from "./components/LoginPage";

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  const [activeTab, setActiveTab]               = useState<string>("home");
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [searchQuery, setSearchQuery]           = useState<string>("");
  const [showDropdown, setShowDropdown]         = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen]     = useState<boolean>(false);
  const [dataLoading, setDataLoading]           = useState<boolean>(false);

  const [people, setPeople]     = useState<Person[]>([]);
  const [records, setRecords]   = useState<ArchiveRecord[]>([]);
  const [memories, setMemories] = useState<SharedMemory[]>([]);

  const prevUserId = useRef<string | undefined>(undefined);

  // Load / clear data when auth state changes
  useEffect(() => {
    if (!user) {
      if (prevUserId.current) {
        // User just logged out
        setPeople([]);
        setRecords([]);
        setMemories([]);
        setSelectedPersonId("");
        setActiveTab("home");
      }
      prevUserId.current = undefined;
      return;
    }

    if (prevUserId.current === user.id) return; // Same session, no reload needed
    prevUserId.current = user.id;

    setDataLoading(true);
    Promise.all([
      fetchPeople(user.id),
      fetchRecords(user.id),
      fetchAllMemories(user.id),
    ])
      .then(([p, r, m]) => {
        setPeople(p);
        setRecords(r);
        setMemories(m);
        if (p.length > 0) setSelectedPersonId(p[0].id);
        setActiveTab("tree");
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [user]);

  // ----------------------------------------------------------------
  // Mutation handlers
  // ----------------------------------------------------------------

  const handleAddPerson = async (newPerson: Person) => {
    if (!user) return;
    try {
      const saved = await insertPerson({ ...newPerson, userId: user.id });
      setPeople(prev => [...prev, saved]);
      setSelectedPersonId(saved.id);
    } catch (err) {
      console.error("Failed to add person:", err);
    }
  };

  const handleUpdatePerson = async (id: string, updates: Partial<Person>) => {
    try {
      await updatePerson(id, updates);
      setPeople(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err) {
      console.error("Failed to update person:", err);
    }
  };

  const handleDeletePerson = async (id: string) => {
    try {
      await deletePerson(id);
      setPeople(prev => {
        const next = prev.filter(p => p.id !== id);
        if (selectedPersonId === id) setSelectedPersonId(next[0]?.id ?? "");
        return next;
      });
    } catch (err) {
      console.error("Failed to delete person:", err);
    }
  };

  const handleAddRecord = async (newRecord: ArchiveRecord) => {
    if (!user) return;
    try {
      const saved = await insertRecord(newRecord, user.id);
      setRecords(prev => [saved, ...prev]);
    } catch (err) {
      console.error("Failed to add record:", err);
    }
  };

  const handleAddMemory = async (newMemory: SharedMemory) => {
    if (!user) return;
    try {
      const saved = await insertMemory(newMemory, user.id);
      setMemories(prev => [saved, ...prev]);
    } catch (err) {
      console.error("Failed to add memory:", err);
    }
  };

  const handleAddTimelineEvent = async (personId: string, event: any) => {
    try {
      const saved = await insertTimelineEvent(personId, event);
      setPeople(prev =>
        prev.map(p =>
          p.id === personId
            ? { ...p, timeline: [...(p.timeline || []), saved] }
            : p
        )
      );
    } catch (err) {
      console.error("Failed to add timeline event:", err);
    }
  };

  const handleUpdateBioNote = async (personId: string, newBio: string, newQuote: string) => {
    try {
      await updatePersonBio(personId, newBio, newQuote);
      setPeople(prev =>
        prev.map(p =>
          p.id === personId ? { ...p, bio: newBio, quote: newQuote } : p
        )
      );
    } catch (err) {
      console.error("Failed to update bio:", err);
    }
  };

  // ----------------------------------------------------------------
  // Navigation helpers
  // ----------------------------------------------------------------

  const handleSelectTabWithPerson = (tab: string, personId?: string) => {
    if (personId) setSelectedPersonId(personId);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Search
  const matchingAncestors = searchQuery.trim()
    ? people.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const activePerson = people.find(p => p.id === selectedPersonId) || people[0];

  // ----------------------------------------------------------------
  // Loading screen
  // ----------------------------------------------------------------

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fbf9f4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-serif">Loading your lineage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f4] flex flex-col justify-between" id="app-root-shell">

      {/* ==========================================
          A. NAVIGATION HEADER
          ========================================== */}
      <header className="bg-white border-b border-[#eae8e3] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-18 flex items-center justify-between">

          {/* Brand */}
          <div
            onClick={() => handleSelectTabWithPerson("home")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <BookOpen className="w-6 h-6 text-secondary transition-transform group-hover:rotate-3" />
            <span className="font-serif text-xl font-extrabold text-tertiary tracking-tight">Digital Lineage</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6" id="desktop-nav">
            {["home", "tree", "archives"].map(tab => (
              <button
                key={tab}
                onClick={() => handleSelectTabWithPerson(tab)}
                className={`py-1 text-sm font-bold transition-all border-b-2 capitalize ${
                  activeTab === tab
                    ? "border-secondary text-[#506447]"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab === "tree" ? "My Tree" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-4 relative z-40">
            {/* Ancestor Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Find relative..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9 pr-4 py-2 bg-stone-50 border border-gray-200 rounded-lg text-xs leading-none focus:outline-none focus:border-secondary w-44 focus:w-56 transition-all text-gray-700"
              />
              {showDropdown && matchingAncestors.length > 0 && (
                <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-xl w-60 overflow-hidden divide-y divide-gray-50 text-left">
                  <div className="p-2 text-[10px] uppercase tracking-wider text-gray-400 font-bold bg-[#fbf9f4]">
                    Matching Ancestors
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
                        <div className="text-[9px] text-gray-400">{match.birthYear} – {match.deathYear || "Present"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Auth button */}
            {user ? (
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-xs ring-2 ring-secondary/20 uppercase"
                  title={user.email}
                >
                  {user.email?.[0] ?? "U"}
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-400 hover:text-red-600 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleSelectTabWithPerson("login")}
                className="px-4.5 py-2 bg-[#006591] hover:bg-[#003751] text-white text-xs font-bold rounded-lg shadow transition active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <div className="w-7.5 h-7.5 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-xs">
                {user.email?.[0]?.toUpperCase() ?? "U"}
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

        {/* Mobile menu tray */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white p-4 space-y-3 shadow-inner">
            {["home", "tree", "archives"].map(tab => (
              <button
                key={tab}
                onClick={() => { handleSelectTabWithPerson(tab); setMobileMenuOpen(false); }}
                className="block w-full py-2 text-left text-sm font-bold text-gray-700 capitalize"
              >
                {tab === "tree" ? "My Tree" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
            {user ? (
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="block w-full py-2 text-left text-sm font-bold text-red-600 flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({user.email})</span>
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

      {/* Close search dropdown on outside click */}
      {showDropdown && (
        <div className="fixed inset-0 z-30 pointer-events-auto" onClick={() => setShowDropdown(false)} />
      )}

      {/* ==========================================
          B. MAIN CONTENT ROUTER
          ========================================== */}
      <main className="flex-1 w-full bg-[#fbf9f4] leading-normal min-h-[750px]">

        {/* Data loading overlay */}
        {dataLoading && (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <span className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-serif">Loading your tree...</p>
            </div>
          </div>
        )}

        {!dataLoading && (
          <>
            {activeTab === "home" && (
              <LandingPage
                onStartTree={() => handleSelectTabWithPerson(user ? "tree" : "login")}
                onNavigateToTab={(tab) => handleSelectTabWithPerson(tab)}
              />
            )}

            {activeTab === "tree" && (
              user ? (
                <MyTree
                  people={people}
                  records={records}
                  selectedPersonId={selectedPersonId}
                  onSelectPerson={(id) => setSelectedPersonId(id)}
                  onAddPerson={handleAddPerson}
                  onUpdatePerson={handleUpdatePerson}
                  onDeletePerson={handleDeletePerson}
                  onNavigateToTab={handleSelectTabWithPerson}
                />
              ) : (
                <LoginPage onClose={() => handleSelectTabWithPerson("home")} />
              )
            )}

            {activeTab === "archives" && (
              user ? (
                <ArchivesPage
                  records={records}
                  people={people}
                  onAddRecord={handleAddRecord}
                  onNavigateToTab={handleSelectTabWithPerson}
                />
              ) : (
                <LoginPage onClose={() => handleSelectTabWithPerson("home")} />
              )
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
              <LoginPage onClose={() => handleSelectTabWithPerson("home")} />
            )}
          </>
        )}
      </main>

      {/* ==========================================
          C. FOOTER
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
              <a href="#support" className="hover:text-white transition">Contact Heritage Support</a>
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
