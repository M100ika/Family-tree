/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Minus, 
  Maximize2, 
  Map, 
  Search, 
  FileText, 
  Award, 
  Mail, 
  Compass, 
  ChevronRight, 
  Share2, 
  CheckCircle,
  HelpCircle,
  TrendingDown,
  X,
  Sparkles
} from "lucide-react";
import { Person, ArchiveRecord } from "../types";

interface MyTreeProps {
  people: Person[];
  records: ArchiveRecord[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
  onAddPerson: (newPerson: Person) => void;
  onNavigateToTab: (tab: string, personId?: string) => void;
}

export default function MyTree({ 
  people, 
  records, 
  selectedPersonId, 
  onSelectPerson, 
  onAddPerson,
  onNavigateToTab 
}: MyTreeProps) {
  const [branch, setBranch] = useState<"harrison" | "vance">("harrison");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Form states for adding member
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newBirthYear, setNewBirthYear] = useState("");
  const [newDeathYear, setNewDeathYear] = useState("");
  const [newBirthPlace, setNewBirthPlace] = useState("");
  const [newGender, setNewGender] = useState<"male" | "female" | "other">("male");
  const [newRelationship, setNewRelationship] = useState<"child" | "spouse" | "parent">("child");

  const selectedPerson = people.find(p => p.id === selectedPersonId) || people[0];

  // Map people relationships based on selected branch
  // Harrison branch focused, Vance branch focused
  const getSubTreePeople = () => {
    if (branch === "harrison") {
      return people.filter(p => ["john-harrison", "robert-harrison", "alice-harrison", "sarah-harrison", "james-harrison"].includes(p.id) || p.fatherId === "robert-harrison" || p.fatherId === "john-harrison");
    } else {
      return people.filter(p => ["eleanor-vance", "arthur-vance", "margaret-vance", "edward-vance"].includes(p.id) || p.motherId === "eleanor-vance" || p.fatherId === "arthur-vance");
    }
  };

  const filteredSubTree = getSubTreePeople();

  // Highlight search filter matches
  const isHighlighted = (p: Person) => {
    if (!searchQuery) return false;
    const nameStr = `${p.firstName} ${p.lastName}`.toLowerCase();
    return nameStr.includes(searchQuery.toLowerCase());
  };

  const handleShare = () => {
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
    // Copy URL to clipboard
    navigator.clipboard.writeText(window.location.href);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newLastName) return;

    const newId = `${newFirstName.toLowerCase()}-${newLastName.toLowerCase()}-${Math.floor(Math.random() * 1000)}`;
    const added: Person = {
      id: newId,
      firstName: newFirstName,
      lastName: newLastName,
      birthYear: newBirthYear || "1980",
      deathYear: newDeathYear || undefined,
      isAlive: !newDeathYear,
      birthPlace: newBirthPlace || "United States",
      avatarUrl: newGender === "male" 
        ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
        : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
      gender: newGender,
      bio: `${newFirstName} ${newLastName} is newly added to the lineage. Born in ${newBirthPlace || "Unknown"}.`,
    };

    // Rigging appropriate parent/children relative connections
    if (newRelationship === "child") {
      if (selectedPerson.gender === "male") {
        added.fatherId = selectedPerson.id;
      } else {
        added.motherId = selectedPerson.id;
      }
    } else if (newRelationship === "spouse") {
      added.spouseId = selectedPerson.id;
    } else if (newRelationship === "parent") {
      if (selectedPerson.gender === "male") {
        // Person acts as child
        selectedPerson.fatherId = added.id;
      } else {
        selectedPerson.motherId = added.id;
      }
    }

    onAddPerson(added);
    onSelectPerson(added.id);
    setIsAddingMember(false);
    
    // Reset inputs
    setNewFirstName("");
    setNewLastName("");
    setNewBirthYear("");
    setNewDeathYear("");
    setNewBirthPlace("");
  };

  // Get records annotated for currently selected person
  const personRecords = records.filter(r => 
    r.relatedPersonIds?.includes(selectedPerson?.id) || 
    (selectedPerson?.recordsFound?.includes(r.id))
  );

  return (
    <div className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 md:px-8 py-4 " id="tree-root-container">
      
      {/* LEFT: Active Family Tree Mapping Canvas */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        
        {/* Sub-header Options & Filter Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#eae8e3] flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBranch("harrison")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                branch === "harrison"
                  ? "bg-secondary text-white shadow-sm"
                  : "bg-surface-container text-gray-500 hover:text-gray-700"
              }`}
            >
              Harrison Lineage
            </button>
            <button
              onClick={() => setBranch("vance")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                branch === "vance"
                  ? "bg-secondary text-white shadow-sm"
                  : "bg-surface-container text-gray-500 hover:text-gray-700"
              }`}
            >
              Vance Lineage
            </button>
          </div>

          {/* Search Box inside tree workspace */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Find ancestor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface-container border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-secondary"
            />
          </div>
        </div>

        {/* Dynamic Map Workspace Area */}
        <div 
          className="relative bg-[#f6f4ee] rounded-2xl h-[560px] overflow-hidden border border-[#eae8e3] shadow-inner select-none transition-all"
          style={{ backgroundImage: "radial-gradient(#ab988b 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        >
          {/* Legend indicator */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-400 z-10">
            {branch === "harrison" ? "Focus: John Harrison Ancestry" : "Focus: Eleanor & Arthur Vance Line"}
          </div>

          {/* Core Tree Graph Wrapper containing coordinates mapping */}
          <div 
            className="absolute inset-0 p-8 flex flex-col justify-between items-center transition-transform duration-300 origin-center"
            style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
          >
            {branch === "harrison" ? (
              // ==========================================
              // HARRISON TREE GRAPH LAYOUT
              // ==========================================
              <div className="w-full h-full flex flex-col justify-between py-6 relative">
                
                {/* Connecting Lines for Harrison Branch */}
                {/* Generation 1 -> Generation 2 Connectors */}
                <div className="absolute top-[140px] left-1/2 -translate-x-1/2 w-[340px] h-[130px] pointer-events-none">
                  {/* Horizontal Bar */}
                  <div className="absolute top-0 left-0 w-full tree-line-horizontal" />
                  {/* Left Descender */}
                  <div className="absolute top-0 left-0 h-full tree-line-vertical" />
                  {/* Right Descender */}
                  <div className="absolute top-0 right-0 h-full tree-line-vertical" />
                  {/* Center Linker upward */}
                  <div className="absolute top-[-40px] left-1/2 h-[40px] tree-line-vertical" />
                </div>

                {/* Generation 2 -> Generation 3 Connector */}
                <div className="absolute top-[370px] left-1/4 translate-x-12 w-[190px] h-[80px] pointer-events-none">
                  <div className="absolute top-0 left-0 w-full tree-line-horizontal" />
                  <div className="absolute top-0 left-[95px] h-full tree-line-vertical" />
                </div>

                {/* Generation 1: John Harrison & Eleanor Vance (Spouses) */}
                <div className="flex justify-center gap-12 relative z-10">
                  <div 
                    onClick={() => onSelectPerson("john-harrison")}
                    className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition shadow-md hover:-translate-y-1 w-52 flex gap-3 items-center ${
                      selectedPersonId === "john-harrison" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-secondary"
                    } ${isHighlighted(people.find(p => p.id === "john-harrison")!) ? "ring-4 ring-amber-400" : ""}`}
                  >
                    <img className="w-10 h-10 rounded-full object-cover shadow" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=72" alt="John" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-xs font-bold text-tertiary">John Harrison</div>
                      <div className="text-[10px] text-gray-500">1892 – 1965</div>
                      <span className="text-[9px] px-2 py-0.5 mt-1 inline-block bg-[#006591] text-white rounded font-mono uppercase">Patriarch</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => onSelectPerson("eleanor-vance")}
                    className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition shadow-md hover:-translate-y-1 w-52 flex gap-3 items-center ${
                      selectedPersonId === "eleanor-vance" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-secondary"
                    }`}
                  >
                    <img className="w-10 h-10 rounded-full object-cover shadow" src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=72" alt="Eleanor" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-xs font-bold text-tertiary">Eleanor Vance</div>
                      <div className="text-[10px] text-gray-500">1892 – 1974</div>
                    </div>
                  </div>
                </div>

                {/* Generation 2: Children & Spouses */}
                <div className="flex justify-around items-center relative z-10 w-full mt-6">
                  {/* Robert Harrison & Sarah */}
                  <div className="flex gap-2 bg-stone-100/90 backdrop-blur p-2 rounded-xl border border-[#eae8e3] shadow-sm">
                    <div 
                      onClick={() => onSelectPerson("robert-harrison")}
                      className={`p-3 bg-white rounded-lg border cursor-pointer transition w-40 flex gap-2 items-center ${
                        selectedPersonId === "robert-harrison" ? "border-primary bg-primary/5 shadow-sm" : "border-gray-200"
                      }`}
                    >
                      <img className="w-8 h-8 rounded-full object-cover" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=72" alt="Robert" referrerPolicy="no-referrer" />
                      <div>
                        <div className="text-xs font-bold text-tertiary truncate">Robert Harrison</div>
                        <div className="text-[9px] text-gray-500">1924 – 2005</div>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => onSelectPerson("sarah-harrison")}
                      className={`p-3 bg-white rounded-lg border cursor-pointer transition w-40 flex gap-2 items-center ${
                        selectedPersonId === "sarah-harrison" ? "border-primary bg-primary/5 shadow-sm" : "border-gray-200"
                      }`}
                    >
                      <img className="w-8 h-8 rounded-full object-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=72" alt="Sarah" referrerPolicy="no-referrer" />
                      <div>
                        <div className="text-xs font-bold text-tertiary truncate">Sarah Harrison</div>
                        <div className="text-[9px] text-gray-500">1952 – Pres.</div>
                      </div>
                    </div>
                  </div>

                  {/* Alice Harrison */}
                  <div 
                    onClick={() => onSelectPerson("alice-harrison")}
                    className={`p-4 bg-white rounded-xl border cursor-pointer transition shadow hover:-translate-y-1 w-48 flex gap-3 items-center ${
                      selectedPersonId === "alice-harrison" ? "border-primary bg-primary/5" : "border-gray-200"
                    }`}
                  >
                    <img className="w-9 h-9 rounded-full object-cover" src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=72" alt="Alice" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-xs font-bold text-tertiary">Alice Harrison</div>
                      <div className="text-[10px] text-gray-500">1921 – 1998</div>
                    </div>
                  </div>
                </div>

                {/* Generation 3: Grandchildren */}
                <div className="flex justify-start pl-20 relative z-10 mt-6">
                  <div 
                    onClick={() => onSelectPerson("james-harrison")}
                    className={`p-4 bg-white rounded-xl border cursor-pointer transition shadow hover:-translate-y-1 w-48 flex gap-3 items-center ${
                      selectedPersonId === "james-harrison" ? "border-primary bg-primary/5" : "border-gray-200"
                    }`}
                  >
                    <img className="w-9 h-9 rounded-full object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=72" alt="James" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-xs font-bold text-tertiary">James Harrison</div>
                      <div className="text-[10px] text-gray-500">1955 – Pres.</div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              // ==========================================
              // VANCE TREE GRAPH LAYOUT
              // ==========================================
              <div className="w-full h-full flex flex-col justify-between py-8 relative">
                
                {/* Connections */}
                <div className="absolute top-[160px] left-1/2 -translate-x-1/2 w-[340px] h-[160px] pointer-events-none">
                  <div className="absolute top-0 left-0 w-full tree-line-horizontal" />
                  <div className="absolute top-0 left-0 h-full tree-line-vertical" />
                  <div className="absolute top-0 right-0 h-full tree-line-vertical" />
                  <div className="absolute top-[-50px] left-1/2 h-[50px] tree-line-vertical" />
                </div>

                {/* Gen 1: Arthur Vance & Eleanor Vance */}
                <div className="flex justify-center gap-12 relative z-10">
                  <div 
                    onClick={() => onSelectPerson("arthur-vance")}
                    className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition shadow hover:-translate-y-1 w-52 flex gap-3 items-center ${
                      selectedPersonId === "arthur-vance" ? "border-primary bg-primary/5" : "border-gray-200"
                    }`}
                  >
                    <img className="w-10 h-10 rounded-full object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=72" alt="Arthur" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-xs font-bold text-tertiary">Arthur Vance</div>
                      <div className="text-[10px] text-gray-500">1890 – 1968</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => onSelectPerson("eleanor-vance")}
                    className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition shadow hover:-translate-y-1 w-52 flex gap-3 items-center ${
                      selectedPersonId === "eleanor-vance" ? "border-primary bg-primary/5" : "border-gray-200"
                    }`}
                  >
                    <img className="w-10 h-10 rounded-full object-cover" src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=72" alt="Eleanor" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-xs font-bold text-tertiary">Eleanor Vance</div>
                      <div className="text-[10px] text-gray-500">1892 – 1974</div>
                    </div>
                  </div>
                </div>

                {/* Gen 2: Children */}
                <div className="flex justify-around relative z-10 w-full mt-10">
                  <div 
                    onClick={() => onSelectPerson("margaret-vance")}
                    className={`p-4 bg-white rounded-xl border cursor-pointer transition shadow hover:-translate-y-1 w-52 flex gap-3 items-center ${
                      selectedPersonId === "margaret-vance" ? "border-primary bg-primary/5" : "border-gray-200"
                    }`}
                  >
                    <img className="w-10 h-10 rounded-full object-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=72" alt="Margaret" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-xs font-bold text-tertiary">Margaret Vance</div>
                      <div className="text-[10px] text-gray-500">1922 – 2005</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => onSelectPerson("edward-vance")}
                    className={`p-4 bg-white rounded-xl border cursor-pointer transition shadow hover:-translate-y-1 w-52 flex gap-3 items-center ${
                      selectedPersonId === "edward-vance" ? "border-primary bg-primary/5" : "border-gray-200"
                    }`}
                  >
                    <img className="w-10 h-10 rounded-full object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=72" alt="Edward" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-xs font-bold text-tertiary">Edward Vance</div>
                      <div className="text-[10px] text-gray-500">1925 – 1999</div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Canvas Floating Control Overlay */}
          <div className="absolute bottom-4 left-4 bg-white p-1.5 rounded-xl shadow-lg border border-gray-200 flex gap-1 z-15">
            <button 
              onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.6))} 
              className="p-1.5 hover:bg-stone-100 rounded text-gray-600 transition"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.65))} 
              className="p-1.5 hover:bg-stone-100 rounded text-gray-600 transition"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} 
              className="p-1.5 hover:bg-stone-100 rounded text-gray-600 transition"
              title="Center View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive CAMERA-NAVIGATOR (Screen 2 feature) */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-200 hidden sm:block w-44 z-15">
            <div className="text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <Map className="w-3 h-3 text-[#506447]" />
              <span>Canvas Navigator</span>
            </div>
            
            {/* Miniature Map Representation */}
            <div className="relative h-14 bg-gray-50 rounded border border-gray-100 overflow-hidden flex items-center justify-center">
              {/* Fake card clusters */}
              <div className="flex flex-col gap-1 items-center scale-90">
                <div className="flex gap-2">
                  <div className="w-5 h-2 bg-secondary opacity-35 rounded-sm" />
                  <div className="w-5 h-2 bg-secondary opacity-35 rounded-sm" />
                </div>
                <div className="w-1.5 h-2 bg-[#ab988b]" />
                <div className="flex gap-3">
                  <div className="w-4 h-2 bg-secondary-container rounded-sm" />
                  <div className="w-4 h-2 bg-secondary-container rounded-sm" />
                </div>
              </div>

              {/* Real Panning Highlight Frame Slider */}
              <div 
                className="absolute border border-primary/75 bg-primary/5 rounded w-16 h-8 cursor-move transition-all"
                style={{
                  top: `${14 - pan.y / 15}px`,
                  left: `${52 - pan.x / 10}px`
                }}
              />
            </div>
            
            <input 
              type="range" 
              min="0.65" 
              max="1.6" 
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full mt-2 h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
          </div>

        </div>
      </div>

      {/* RIGHT: Person Details Sidebar (Screen 2 panel) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Toast feedback and main profile details */}
        {shareToast && (
          <div className="p-3 bg-[#e5f5e0] border-l-4 border-green-500 text-green-800 text-xs flex items-center gap-2 rounded-lg animate-fade-in shadow">
            <CheckCircle className="w-4 h-4" />
            <span>Success: Branch link copied to clipboard!</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md border border-[#eae8e3] p-6 space-y-6 max-w-sm mx-auto">
          
          <div className="text-center relative">
            <div className="aspect-square w-32 h-32 rounded-full overflow-hidden mx-auto shadow-md border-2 border-white ring-4 ring-[#eae8e3] bg-gray-100">
              <img 
                src={selectedPerson?.avatarUrl} 
                alt={selectedPerson?.firstName} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <h3 className="font-serif text-2xl font-extrabold text-tertiary mt-4">
              {selectedPerson?.firstName} {selectedPerson?.lastName}
            </h3>

            {selectedPerson?.maidenName && (
              <p className="text-xs text-[#6b5b50]/70 italic mt-0.5">
                née {selectedPerson.maidenName}
              </p>
            )}

            <p className="text-sm font-semibold text-gray-500 mt-1">
              {selectedPerson?.birthYear} – {selectedPerson?.deathYear || "Present"}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Birthplace</div>
              <p className="text-xs text-stone-700 font-medium bg-stone-50 p-2.5 rounded-lg border border-[#eae8e3] mt-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-secondary" />
                <span>{selectedPerson?.birthPlace || "Unknown Location"}</span>
              </p>
            </div>

            {selectedPerson?.bio && (
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Archival Bio Note</div>
                <p className="text-xs text-gray-500 leading-relaxed mt-1 line-clamp-3">
                  {selectedPerson.bio}
                </p>
              </div>
            )}
          </div>

          {/* RECORDS FOUND LINKED UNDER SIDEBAR LIST */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Associated Documents ({personRecords.length})
            </div>
            {personRecords.length > 0 ? (
              <div className="space-y-2">
                {personRecords.map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => onNavigateToTab("archives")}
                    className="p-2.5 rounded-lg border border-gray-100 bg-stone-50 hover:bg-stone-100 cursor-pointer flex items-center justify-between transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-secondary/80" />
                      <div className="text-left">
                        <div className="text-xs font-bold text-gray-700 truncate max-w-[170px]">{r.title}</div>
                        <div className="text-[9px] text-[#006591]">{r.type} • {r.dateStr}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 text-center rounded-lg border border-dashed border-gray-200">
                <p className="text-[10px] text-gray-400 italic">No formal archives linked yet.</p>
              </div>
            )}
          </div>

          {/* COLLABORATIVE ACTIONS (Screen 2 buttons) */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setIsAddingMember(true)}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Family Member</span>
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShare}
                className="py-2 px-3 border border-[#eae8e3] hover:bg-stone-50 text-xs font-bold text-stone-700 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Share Branch</span>
              </button>

              <button
                onClick={() => onNavigateToTab("bio", selectedPerson?.id)}
                className="py-2 px-3 bg-secondary/10 hover:bg-secondary/15 text-xs font-bold text-[#506447] rounded-lg flex items-center justify-center gap-1 transition"
              >
                <span>Read Story</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ADD MEMBER DIALOG MODAL */}
      {isAddingMember && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-zoom-in">
            <div className="bg-[#506447] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <h3 className="font-serif font-bold text-lg">Add to Lineage Branches</h3>
              </div>
              <button 
                onClick={() => setIsAddingMember(false)}
                className="p-1 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-stone-50 rounded-lg text-[11px] text-gray-500 border border-gray-200">
                You are adding a relation relative linked to <span className="font-bold text-tertiary">{selectedPerson?.firstName} {selectedPerson?.lastName}</span>.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="e.g. Mary"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#506447]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="e.g. Vance"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#506447]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Birth Year
                  </label>
                  <input
                    type="text"
                    value={newBirthYear}
                    onChange={(e) => setNewBirthYear(e.target.value)}
                    placeholder="e.g. 1918"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#506447]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Death Year (Blank if Alive)
                  </label>
                  <input
                    type="text"
                    value={newDeathYear}
                    onChange={(e) => setNewDeathYear(e.target.value)}
                    placeholder="e.g. 1994"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#506447]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Birth Place Location
                </label>
                <input
                  type="text"
                  value={newBirthPlace}
                  onChange={(e) => setNewBirthPlace(e.target.value)}
                  placeholder="e.g. Skegness, Lincolnshire, UK"
                  className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#506447]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Gender Identity
                  </label>
                  <select
                    value={newGender}
                    onChange={(e: any) => setNewGender(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#506447]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Branch Connection
                  </label>
                  <select
                    value={newRelationship}
                    onChange={(e: any) => setNewRelationship(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#506447]"
                  >
                    <option value="child">Child of Selection</option>
                    <option value="spouse">Spouse of Selection</option>
                    <option value="parent">Parent of Selection</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="px-4 py-2 border border-gray-200 rounded text-xs font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#506447] hover:bg-[#506447]/95 text-white rounded text-xs font-bold"
                >
                  Save to Tree Space
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
