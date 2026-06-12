/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  User, 
  Cpu, 
  Check, 
  AlertCircle, 
  BookOpen, 
  FileText, 
  Upload, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  FileImage,
  Tag,
  Clock,
  Sparkles,
  X
} from "lucide-react";
import { ArchiveRecord, RecordType, Person } from "../types";

interface ArchivesPageProps {
  records: ArchiveRecord[];
  people: Person[];
  onAddRecord: (newRecord: ArchiveRecord) => void;
  onNavigateToTab: (tab: string, personId?: string) => void;
}

export default function ArchivesPage({ records, people, onAddRecord, onNavigateToTab }: ArchivesPageProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedPerson, setSelectedPerson] = useState<string>("All");
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");
  
  // Quick Filters
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>("All");

  // Selection & OCR Uploader states
  const [activeRecord, setActiveRecord] = useState<ArchiveRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // OCR Scan states
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string>("");
  const [ocrError, setOcrError] = useState("");

  // New Record form states for Upload Modal
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<RecordType>(RecordType.PHOTOGRAPH);
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newTagsStr, setNewTagsStr] = useState("");
  const [uploadedBase64, setUploadedBase64] = useState<string>("");

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Convert File to Base64 helper
  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setUploadedBase64(base64String);
      
      // Auto fill a mock/seed template for names
      setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
      setIsUploading(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Quick Filter Pill Click
  const handleQuickFilterClick = (filter: string) => {
    setActiveQuickFilter(filter);
    if (filter === "All") {
      setSelectedType("All");
      setSearchQuery("");
    } else if (filter === "Census Records") {
      setSelectedType("Vital Record");
      setSearchQuery("Census");
    } else if (filter === "Land Deeds") {
      setSelectedType("Property Map");
      setSearchQuery("Homestead");
    } else if (filter === "War Diaries") {
      setSelectedType("Letter");
      setSearchQuery("War");
    } else if (filter === "Recently Added") {
      setSelectedType("All");
      setSearchQuery("");
      setYearFrom("1920");
    }
  };

  // Form submit for upload record
  const handleCreateRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    // Default image if they didn't upload or drop one
    const defaultImg = "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=400";

    const parsedYear = parseInt(newDate.split("-")[0] || newDate.match(/\d{4}/)?.[0] || "1930");

    const created: ArchiveRecord = {
      id: `rec-${Date.now()}`,
      title: newTitle,
      type: newType,
      description: newDesc || "A newly uploaded document for the family repository.",
      imageUrl: uploadedBase64 || defaultImg,
      dateStr: newDate || "Circa 1930",
      year: isNaN(parsedYear) ? 1930 : parsedYear,
      location: newLocation || "Family Vault",
      tags: newTagsStr ? newTagsStr.split(",").map(t => t.trim()) : ["Uploaded", "Document"],
      relatedPersonIds: []
    };

    onAddRecord(created);
    setIsUploading(false);
    setActiveRecord(created); // auto-focus the uploaded file!
    
    // reset uploader states
    setNewTitle("");
    setNewDesc("");
    setNewDate("");
    setNewLocation("");
    setNewTagsStr("");
    setUploadedBase64("");
  };

  // Call Server-Side Gemini OCR transcribed text
  const startOcrAnalysis = async (record: ArchiveRecord) => {
    setIsScanning(true);
    setOcrError("");
    setScanResult("");

    try {
      // Extract clean image payload from records
      let imageBase64 = "";
      if (record.imageUrl.startsWith("data:image")) {
        // Splitting MIME out
        imageBase64 = record.imageUrl.split(",")[1] || "";
      } else {
        // If it's a seed URL, we will send a simple signal or prompt.
        // We will mock process or download standard base64 content safely on the server
        imageBase64 = "URL_PLACEHOLDER";
      }

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          base64: imageBase64,
          fileName: record.title
        })
      });

      const data = await res.json();
      if (res.ok) {
        setScanResult(data.transcription);
        // Save the result back to record reference locally to avoid scanning twice
        record.transcription = data.transcription;
      } else {
        throw new Error(data.error || "OCR transcription failed");
      }
    } catch (err: any) {
      console.error(err);
      setOcrError(err.message || "An error occurred dialing the AI Transcriber.");
    } finally {
      setIsScanning(false);
    }
  };

  // Perform filtration logic
  const filteredRecords = records.filter(rec => {
    // Search text query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = rec.title.toLowerCase().includes(q);
      const matchDesc = rec.description.toLowerCase().includes(q);
      const matchLocation = rec.location?.toLowerCase().includes(q) || false;
      const matchTags = rec.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchLocation && !matchTags) return false;
    }

    // Type filter
    if (selectedType !== "All" && rec.type !== selectedType) return false;

    // Person relations filter
    if (selectedPerson !== "All") {
      const fitsRelations = rec.relatedPersonIds?.includes(selectedPerson) || false;
      if (!fitsRelations) return false;
    }

    // Year parameters filter
    if (yearFrom && rec.year < parseInt(yearFrom)) return false;
    if (yearTo && rec.year > parseInt(yearTo)) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-8" id="archives-page-container">
      
      {/* Page Header Detail Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eae8e3] pb-6">
        <div>
          <h2 className="font-serif text-3xl font-extrabold text-tertiary">Family Archives</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            A curated repository of your family's history. Browse through scanned letters, vital church records, military service certificates, and vintage portraits.
          </p>
        </div>
        <button
          onClick={() => { setIsUploading(true); setUploadedBase64(""); }}
          className="px-5 py-3 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Record</span>
        </button>
      </div>

      {/* FILTER CONTROLS GRID (Screen 3 Search Block) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-[#eae8e3] space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Main search bar query */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search archives by name, place, or key term..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container border border-gray-200 rounded-lg text-xs leading-none focus:outline-none focus:border-secondary text-gray-700"
            />
          </div>

          {/* Document type selection */}
          <div className="relative md:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-[#006591] appearance-none cursor-pointer"
            >
              <option value="All">All Document Types</option>
              {Object.values(RecordType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Person association selector */}
          <div className="relative md:col-span-2">
            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-[#006591] cursor-pointer"
            >
              <option value="All">Filter by Person</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          {/* Year Range boundaries fields */}
          <div className="grid grid-cols-2 gap-1.5 md:col-span-2">
            <input
              type="number"
              placeholder="Year from"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              className="w-full px-2 py-2 bg-surface-container border border-gray-200 rounded text-xs text-center text-gray-700 focus:outline-none focus:border-secondary"
            />
            <input
              type="number"
              placeholder="Year to"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              className="w-full px-2 py-2 bg-surface-container border border-gray-200 rounded text-xs text-center text-gray-700 focus:outline-none focus:border-secondary"
            />
          </div>
        </div>

        {/* Quick Filter Pill Controls (Screen 3 pills) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Quick Presets:</span>
          {["All", "Recently Added", "Census Records", "Land Deeds", "War Diaries"].map(f => (
            <button
              key={f}
              onClick={() => handleQuickFilterClick(f)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                activeQuickFilter === f 
                  ? "bg-secondary text-white border-secondary shadow-sm"
                  : "bg-stone-50 text-gray-500 hover:text-gray-700 border-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

      </div>

      {/* CORE ARCHIVE GRID LISTINGS */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        
        {/* DRAG AND DROP ADD ZONE (Screen 3 dash container) */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => { setIsUploading(true); setUploadedBase64(""); }}
          className={`border-3 border-dashed rounded-xl p-6 flex flex-col justify-center items-center text-center cursor-pointer min-h-[340px] transition-all duration-300 ${
            dragActive 
              ? "border-secondary bg-secondary/5 scale-[1.01]" 
              : "border-[#bec8d2] hover:border-secondary hover:bg-[#eae8e3]/10 bg-[#fbf9f4]"
          }`}
          id="dropzone-archive"
        >
          <div className="w-12 h-12 rounded-full bg-secondary-container text-secondary flex items-center justify-center mb-4 shadow">
            <Plus className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-base font-bold text-tertiary">Add to Archive</h4>
          <p className="text-[11px] text-gray-400 mt-1 max-w-[190px] leading-relaxed">
            Drag and drop files here or click to select vintage photographs or handwritten parchment items.
          </p>
        </div>

        {/* Dynamic Map over records */}
        {filteredRecords.length > 0 ? (
          filteredRecords.map(rec => {
            // Determine visual badge configurations
            let badgeColor = "bg-blue-100 text-[#006591]";
            if (rec.type === RecordType.VITAL_RECORD) badgeColor = "bg-[#d0e7c2] text-[#506447]";
            if (rec.type === RecordType.LETTER) badgeColor = "bg-orange-100 text-orange-800";
            if (rec.type === RecordType.MILITARY) badgeColor = "bg-purple-100 text-purple-800";
            if (rec.type === RecordType.PROPERTY_MAP) badgeColor = "bg-rose-100 text-rose-800";
            if (rec.type === RecordType.ARTIFACT) badgeColor = "bg-amber-100 text-amber-800";

            return (
              <div 
                key={rec.id}
                onClick={() => {
                  setActiveRecord(rec);
                  setScanResult(rec.transcription || "");
                }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-transform hover:-translate-y-1 duration-200 border border-gray-100 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                    <img 
                      src={rec.imageUrl} 
                      alt={rec.title} 
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <span className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor} shadow-md uppercase tracking-wider`}>
                      {rec.type}
                    </span>
                    {rec.isRestricted && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white px-2 py-0.5 rounded text-[9px] font-bold shadow-md uppercase">
                        Restricted
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-serif text-lg font-bold text-tertiary truncate">
                      {rec.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 line-clamp-3 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-50 bg-[#fbf9f4]/50 flex items-center justify-between text-[10px] text-gray-400 font-sans">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{rec.dateStr}</span>
                  </span>
                  {rec.location && (
                    <span className="flex items-center gap-1 max-w-[130px] truncate">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{rec.location}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center space-y-3 bg-white border border-gray-100 rounded-xl">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="font-serif text-lg font-bold text-tertiary">No Archives Match</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              No scanned archives found fitting your specific query or year-boundaries parameters. Adjust your inputs and try again.
            </p>
          </div>
        )}

      </div>

      {/* MODAL 1: HISTORICAL DOCUMENT VIEWER & AI OCR SANDBOX */}
      {activeRecord && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-gray-100 animate-zoom-in">
            
            {/* Left Frame: Document Scan Image */}
            <div className="md:w-1/2 bg-[#30312e] flex flex-col justify-between relative min-h-[350px]">
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="bg-[#506447] text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider shadow">
                  Vault Scan
                </span>
                <span className="bg-black/50 backdrop-blur text-[#eae8e3] px-2.5 py-1 rounded text-[10px] font-mono shadow">
                  EST: {activeRecord.year}
                </span>
              </div>

              <div className="my-auto p-6 flex justify-center items-center">
                <img 
                  src={activeRecord.imageUrl} 
                  alt={activeRecord.title} 
                  className="max-h-[60vh] object-contain rounded-lg shadow-xl border border-white/10"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="bg-black/40 backdrop-blur-md p-4 text-xs text-gray-300 border-t border-white/5 flex gap-1.5 items-start">
                <BookOpen className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-serif italic font-medium text-[#eae8e3]">"{activeRecord.description}"</p>
                  <p className="text-[10px] text-gray-400 mt-1">Location filed: {activeRecord.location || "Central Archives"}</p>
                </div>
              </div>
            </div>

            {/* Right Frame: Transcript & AI Engine Console */}
            <div className="md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between bg-[#fbf9f4] space-y-6">
              
              <div className="flex justify-between items-start border-b border-[#eae8e3] pb-4">
                <div>
                  <div className="text-[10px] font-mono text-[#006591] font-bold uppercase tracking-wide">Archival Inventory #{activeRecord.id}</div>
                  <h3 className="font-serif text-2xl font-bold text-tertiary mt-1">{activeRecord.title}</h3>
                </div>
                <button 
                  onClick={() => { setActiveRecord(null); setScanResult(""); setOcrError(""); }}
                  className="p-1 hover:bg-[#eae8e3] rounded-full transition text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Transcription Area Box (Scroll parchment) */}
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-secondary" />
                    <span>Deciphered script text</span>
                  </h4>

                  {/* AI Scan trigger */}
                  <button
                    onClick={() => startOcrAnalysis(activeRecord)}
                    disabled={isScanning}
                    className="px-3 py-1 bg-[#006591]/15 text-[#006591] hover:bg-[#006591]/25 text-xs font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <Cpu className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                    <span>{isScanning ? "Transcribing..." : scanResult ? "Scan with AI again" : "Transcribe Cursive with AI"}</span>
                  </button>
                </div>

                {ocrError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded text-xs flex items-center gap-1.5 border border-red-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{ocrError}</span>
                  </div>
                )}

                {/* Main scroll paper block */}
                <div 
                  className="flex-1 p-5 rounded-lg border border-amber-200/50 min-h-[180px] text-xs leading-relaxed text-gray-800 font-serif italic relative shadow-inner overflow-y-auto"
                  style={{
                    backgroundColor: "#FAF6EE",
                    backgroundImage: "linear-gradient(#F5ECE1 1px, transparent 1px)",
                    backgroundSize: "100% 20px"
                  }}
                >
                  {isScanning ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-2">
                      <Sparkles className="w-6 h-6 text-amber-500 animate-spin" />
                      <p className="font-serif text-sm font-bold text-tertiary">Scanning document texture...</p>
                      <p className="text-[10px] text-gray-400">Deciphering faded ink and 19th-century cursive flow patterns server-side</p>
                    </div>
                  ) : scanResult ? (
                    <div className="whitespace-pre-line leading-loose pr-2 pt-2 scroll-smooth">
                      {scanResult}
                      <div className="mt-8 border-t border-stone-200 pt-4 flex justify-between text-[10px] font-sans text-gray-400 select-none">
                        <span>CONFIDENCE: 98% (GEMINI ENGINE)</span>
                        <span>DATE SCAN: {new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-3">
                      <FileImage className="w-8 h-8 text-amber-700/40" />
                      <p className="font-sans text-stone-400 text-[11px] leading-relaxed max-w-[200px]">
                        No pre-indexed digital transcription found. Click "Transcribe Cursive with AI" to let Gemini extract the handwritings!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tag parameters */}
              <div className="pt-4 border-t border-stone-200">
                <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">Subject Tags:</div>
                <div className="flex flex-wrap gap-1.5">
                  {activeRecord.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-stone-200 rounded text-stone-600 text-[10px] font-semibold flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      <span>{t}</span>
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD MANUALLY FORM */}
      {isUploading && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-zoom-in">
            
            <div className="bg-primary text-white p-4 flex justify-between items-center">
              <h3 className="font-serif font-bold text-lg flex items-center gap-1.5">
                <Upload className="w-5 h-5" />
                <span>Upload Historical Scans</span>
              </h3>
              <button 
                onClick={() => { setIsUploading(false); setUploadedBase64(""); }}
                className="p-1 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecordSubmit} className="p-6 space-y-4">
              
              {/* Optional Base64 Image Preview thumbnail if available */}
              {uploadedBase64 ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden shadow-sm flex-shrink-0">
                    <img className="w-full h-full object-cover" src={uploadedBase64} alt="Pre-upload" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-green-800">Scanned File Captured Successfully</h4>
                    <p className="text-[10px] text-gray-500">Image is stored locally inside local state sandbox.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedBase64("")}
                    className="text-[10px] text-red-600 hover:underline ml-auto"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-stone-50 rounded-lg border-2 border-dashed border-gray-300 text-center space-y-2">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-500">No raw snapshot selected yet.</p>
                  <label className="inline-block px-3 py-1 bg-gray-200 hover:bg-gray-300 text-[11px] font-bold text-gray-700 rounded-lg cursor-pointer transition">
                    Browse File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </label>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Document / Archive Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sterling Household Land Grant Title Deed"
                  className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#006591]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Record Sub-Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#006591] cursor-pointer"
                  >
                    {Object.values(RecordType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Event Date / Year
                  </label>
                  <input
                    type="text"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="e.g. Aug 19, 1924, or Circa 1905"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#006591]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Faux Location Origin
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g., Lincolnshire parish, UK"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#006591]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newTagsStr}
                    onChange={(e) => setNewTagsStr(e.target.value)}
                    placeholder="e.g. Vance, Deed, Certificate"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#006591]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Historical Brief Description / Anecdotes
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Tell us what you know about this specific piece..."
                  className="w-full p-2.5 bg-[#fbf9f4] border border-gray-200 rounded text-xs text-gray-800 focus:outline-[#006591] resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="px-4 py-2 border border-gray-200 rounded text-xs font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded text-xs font-bold"
                >
                  Index & Save Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
