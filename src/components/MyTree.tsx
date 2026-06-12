/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Plus, Minus, Maximize2, Search, FileText, ChevronRight,
  Share2, CheckCircle, X, Sparkles, PenTool, Trash2, AlertTriangle,
  UserPlus, Compass, Map as MapIcon
} from "lucide-react";
import { Person, ArchiveRecord } from "../types";
import { buildTreeLayout, CARD_W, CARD_H, H_GAP, V_STEP } from "../lib/treeLayout";

interface MyTreeProps {
  people: Person[];
  records: ArchiveRecord[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
  onAddPerson: (p: Person) => Promise<void>;
  onUpdatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  onDeletePerson: (id: string) => Promise<void>;
  onNavigateToTab: (tab: string, personId?: string) => void;
}

const PADDING_X = 80
const PADDING_Y = 60
const AVATAR_PLACEHOLDER_M = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
const AVATAR_PLACEHOLDER_F = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"

// ─── small helpers ────────────────────────────────────────────────────────────

function initials(p: Person) {
  return ((p.firstName?.[0] ?? "") + (p.lastName?.[0] ?? "")).toUpperCase()
}

// ─── main component ───────────────────────────────────────────────────────────

export default function MyTree({
  people, records, selectedPersonId,
  onSelectPerson, onAddPerson, onUpdatePerson, onDeletePerson, onNavigateToTab
}: MyTreeProps) {

  // ── canvas state ──────────────────────────────────────────────────────────
  const canvasRef   = useRef<HTMLDivElement>(null)
  const [canvasW, setCanvasW] = useState(800)
  const [pan,  setPan]  = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const dragRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)

  useEffect(() => {
    const el = canvasRef.current; if (!el) return
    const update = () => setCanvasW(el.offsetWidth)
    update()
    const ro = new ResizeObserver(update); ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // wheel zoom on canvas
  useEffect(() => {
    const el = canvasRef.current; if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoom(z => Math.max(0.3, Math.min(2.5, z * (e.deltaY > 0 ? 0.92 : 1.08))))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".tree-card")) return
    dragRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return
    const { mx, my, px, py } = dragRef.current
    setPan({ x: px + (e.clientX - mx) / zoom, y: py + (e.clientY - my) / zoom })
  }
  const handleMouseUp = () => { dragRef.current = null }

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // ── layout ────────────────────────────────────────────────────────────────
  const rawPositions = useMemo(() => buildTreeLayout(people), [people])

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    rawPositions.forEach((pos, id) => {
      map.set(id, {
        x: canvasW / 2 + pos.x,
        y: PADDING_Y + pos.y,
      })
    })
    return map
  }, [rawPositions, canvasW])

  const canvasInnerH = useMemo(() => {
    if (!positions.size) return 400
    const vals = Array.from(positions.values()) as { x: number; y: number }[]
    return Math.max(400, Math.max(...vals.map(p => p.y)) + CARD_H + PADDING_Y)
  }, [positions])

  const idSet = useMemo(() => new Set(people.map(p => p.id)), [people])

  // ── search ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const isHighlighted = (p: Person) =>
    !!searchQuery && `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())

  // ── share toast ───────────────────────────────────────────────────────────
  const [shareToast, setShareToast] = useState(false)
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setShareToast(true)
    setTimeout(() => setShareToast(false), 2000)
  }

  // ── selected person ───────────────────────────────────────────────────────
  const selectedPerson = people.find(p => p.id === selectedPersonId) || people[0] || null

  // ── Add member modal ──────────────────────────────────────────────────────
  const [isAddingMember, setIsAddingMember] = useState(false)
  const emptyForm = { firstName: "", lastName: "", birthYear: "", deathYear: "", birthPlace: "", gender: "male" as const, relationship: "child" as "child" | "spouse" | "parent", avatarUrl: "" }
  const [addForm, setAddForm] = useState(emptyForm)

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.firstName || !addForm.lastName) return

    const added: Person = {
      id: `tmp-${Date.now()}`,
      firstName: addForm.firstName,
      lastName: addForm.lastName,
      birthYear: addForm.birthYear || "1970",
      deathYear: addForm.deathYear || undefined,
      isAlive: !addForm.deathYear,
      birthPlace: addForm.birthPlace || undefined,
      avatarUrl: addForm.avatarUrl || (addForm.gender === "female" ? AVATAR_PLACEHOLDER_F : AVATAR_PLACEHOLDER_M),
      gender: addForm.gender,
    }

    if (selectedPerson) {
      if (addForm.relationship === "child") {
        if (selectedPerson.gender === "male") added.fatherId = selectedPerson.id
        else added.motherId = selectedPerson.id
      } else if (addForm.relationship === "spouse") {
        added.spouseId = selectedPerson.id
      } else if (addForm.relationship === "parent") {
        // Will update existing person after adding new
      }
    }

    await onAddPerson(added)

    // For "parent" relationship: update existing person's parent ref
    if (selectedPerson && addForm.relationship === "parent") {
      const update = selectedPerson.gender === "female"
        ? { motherId: added.id }
        : { fatherId: added.id }
      // The real id comes from Supabase; this will be set when the add resolves
      // We pass the temp id here; App.tsx will overwrite selectedPersonId with the real one
      await onUpdatePerson(selectedPerson.id, update)
    }

    setIsAddingMember(false)
    setAddForm(emptyForm)
  }

  // ── Edit person modal ─────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Person>>({})

  const openEdit = () => {
    if (!selectedPerson) return
    setEditForm({ ...selectedPerson })
    setIsEditing(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPerson) return
    await onUpdatePerson(selectedPerson.id, editForm)
    setIsEditing(false)
  }

  // ── Delete confirmation ───────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const handleDelete = async () => {
    if (!selectedPerson) return
    await onDeletePerson(selectedPerson.id)
    setDeleteConfirm(false)
  }

  // ── person records ────────────────────────────────────────────────────────
  const personRecords = records.filter(r =>
    r.relatedPersonIds?.includes(selectedPerson?.id || "") ||
    selectedPerson?.recordsFound?.includes(r.id)
  )

  // ── SVG connection paths ──────────────────────────────────────────────────
  const svgPaths = useMemo(() => {
    const paths: React.ReactNode[] = []

    people.forEach(person => {
      const childPos = positions.get(person.id)
      if (!childPos) return

      const cx = childPos.x + CARD_W / 2
      const cy = childPos.y

      const drawLine = (parentId: string, key: string) => {
        if (!idSet.has(parentId)) return
        const pp = positions.get(parentId)
        if (!pp) return
        const px = pp.x + CARD_W / 2
        const py = pp.y + CARD_H
        const my = (py + cy) / 2
        paths.push(
          <path key={key}
            d={`M ${px} ${py} C ${px} ${my}, ${cx} ${my}, ${cx} ${cy}`}
            fill="none" stroke="#ab988b" strokeWidth="1.5" strokeOpacity="0.55"
          />
        )
      }

      if (person.fatherId) drawLine(person.fatherId, `f-${person.id}`)
      if (person.motherId) drawLine(person.motherId, `m-${person.id}`)
    })

    // Spouse dashed connector
    people.forEach(p => {
      if (!p.spouseId || !idSet.has(p.spouseId)) return
      if (p.id > p.spouseId) return // draw each pair once
      const pa = positions.get(p.id)
      const pb = positions.get(p.spouseId)
      if (!pa || !pb) return
      const ax = pa.x + (pa.x < pb.x ? CARD_W : 0)
      const bx = pb.x + (pb.x < pa.x ? CARD_W : 0)
      const ay = pa.y + CARD_H / 2
      const by = pb.y + CARD_H / 2
      paths.push(
        <line key={`sp-${p.id}`}
          x1={ax} y1={ay} x2={bx} y2={by}
          stroke="#ab988b" strokeWidth="1" strokeDasharray="5 3" strokeOpacity="0.45"
        />
      )
    })

    return paths
  }, [positions, people, idSet])

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 md:px-8 py-4" id="tree-root-container">

      {/* ── LEFT: canvas ── */}
      <div className="lg:col-span-8 flex flex-col space-y-4">

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#eae8e3] flex flex-wrap gap-3 items-center justify-between">
          <div className="text-xs font-bold text-gray-500">
            {people.length === 0 ? "Your tree is empty" : `${people.length} person${people.length !== 1 ? "s" : ""} in tree`}
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-stone-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-secondary"
            />
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative bg-[#f6f4ee] rounded-2xl overflow-hidden border border-[#eae8e3] shadow-inner select-none"
          style={{
            height: 560,
            backgroundImage: "radial-gradient(#ab988b 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            cursor: dragRef.current ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Empty state */}
          {people.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <div className="bg-white/90 backdrop-blur p-8 rounded-2xl border border-[#eae8e3] shadow-lg text-center max-w-xs">
                <UserPlus className="w-10 h-10 text-secondary/60 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-tertiary">Your tree is empty</h3>
                <p className="text-xs text-gray-400 mt-1 mb-4">Add the first member to start building your family lineage.</p>
                <button
                  onClick={() => setIsAddingMember(true)}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-lg shadow transition hover:bg-primary/90"
                >
                  + Add First Person
                </button>
              </div>
            </div>
          )}

          {/* Pan/zoom content */}
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: "center center",
            }}
          >
            {/* SVG connections */}
            <svg
              style={{ position: "absolute", top: 0, left: 0, overflow: "visible", pointerEvents: "none" }}
              width={canvasW}
              height={canvasInnerH}
            >
              {svgPaths}
            </svg>

            {/* Person cards */}
            {people.map(person => {
              const pos = positions.get(person.id)
              if (!pos) return null
              const isSelected = person.id === selectedPersonId
              const highlighted = isHighlighted(person)

              return (
                <div
                  key={person.id}
                  className={`tree-card absolute p-3 bg-white rounded-xl border-2 cursor-pointer transition-all shadow-md hover:-translate-y-0.5 flex gap-2.5 items-center ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-gray-200 hover:border-secondary"
                  } ${highlighted ? "ring-4 ring-amber-400" : ""}`}
                  style={{ left: pos.x, top: pos.y, width: CARD_W, minHeight: CARD_H }}
                  onClick={() => onSelectPerson(person.id)}
                >
                  {person.avatarUrl ? (
                    <img
                      className="w-10 h-10 rounded-full object-cover shadow flex-shrink-0"
                      src={person.avatarUrl}
                      alt={person.firstName}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {initials(person)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-tertiary truncate">
                      {person.firstName} {person.lastName}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {person.birthYear} – {person.deathYear || "Present"}
                    </div>
                    {person.isPatriarch && (
                      <span className="text-[9px] px-1.5 py-0.5 mt-0.5 inline-block bg-[#006591] text-white rounded font-mono uppercase">
                        Patriarch
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Canvas controls (bottom-left) */}
          <div className="absolute bottom-4 left-4 bg-white p-1.5 rounded-xl shadow-lg border border-gray-200 flex gap-1 z-10">
            <button onClick={() => setZoom(z => Math.min(2.5, z + 0.12))} className="p-1.5 hover:bg-stone-100 rounded text-gray-600" title="Zoom In">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.12))} className="p-1.5 hover:bg-stone-100 rounded text-gray-600" title="Zoom Out">
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={resetView} className="p-1.5 hover:bg-stone-100 rounded text-gray-600" title="Reset View">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Mini navigator (bottom-right) */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur p-3 rounded-xl shadow-lg border border-gray-200 hidden sm:block w-44 z-10">
            <div className="text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <MapIcon className="w-3 h-3 text-[#506447]" />
              <span>Canvas Navigator</span>
            </div>
            <div className="relative h-14 bg-gray-50 rounded border border-gray-100 overflow-hidden">
              {/* Minimap dots */}
              {people.slice(0, 12).map(p => {
                const pos = positions.get(p.id)
                if (!pos) return null
                return (
                  <div key={p.id} className="absolute w-2 h-1.5 bg-secondary/50 rounded-sm"
                    style={{
                      left: `${Math.max(0, Math.min(95, (pos.x / canvasW) * 100))}%`,
                      top: `${Math.max(0, Math.min(85, (pos.y / canvasInnerH) * 100))}%`,
                    }}
                  />
                )
              })}
            </div>
            <input type="range" min="0.3" max="2.5" step="0.05" value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="w-full mt-2 h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
          </div>
        </div>
      </div>

      {/* ── RIGHT: sidebar ── */}
      <div className="lg:col-span-4 space-y-6">

        {shareToast && (
          <div className="p-3 bg-[#e5f5e0] border-l-4 border-green-500 text-green-800 text-xs flex items-center gap-2 rounded-lg shadow">
            <CheckCircle className="w-4 h-4" />
            <span>Branch link copied!</span>
          </div>
        )}

        {selectedPerson ? (
          <div className="bg-white rounded-2xl shadow-md border border-[#eae8e3] p-6 space-y-5 max-w-sm mx-auto">

            {/* Avatar + name */}
            <div className="text-center relative">
              <div className="aspect-square w-28 h-28 rounded-full overflow-hidden mx-auto shadow-md border-2 border-white ring-4 ring-[#eae8e3] bg-gray-100">
                {selectedPerson.avatarUrl ? (
                  <img src={selectedPerson.avatarUrl} alt={selectedPerson.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-2xl">
                    {initials(selectedPerson)}
                  </div>
                )}
              </div>
              <h3 className="font-serif text-xl font-extrabold text-tertiary mt-3">
                {selectedPerson.firstName} {selectedPerson.lastName}
              </h3>
              {selectedPerson.maidenName && (
                <p className="text-xs text-gray-400 italic">née {selectedPerson.maidenName}</p>
              )}
              <p className="text-sm font-semibold text-gray-400 mt-0.5">
                {selectedPerson.birthYear} – {selectedPerson.deathYear || "Present"}
              </p>
            </div>

            {/* Details */}
            <div className="border-t border-gray-100 pt-3 space-y-2">
              {selectedPerson.birthPlace && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Birthplace</div>
                  <p className="text-xs text-stone-700 bg-stone-50 p-2 rounded-lg border border-[#eae8e3] mt-1 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    {selectedPerson.birthPlace}
                  </p>
                </div>
              )}
              {selectedPerson.bio && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bio</div>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1 line-clamp-3">{selectedPerson.bio}</p>
                </div>
              )}
            </div>

            {/* Associated records */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Documents ({personRecords.length})
              </div>
              {personRecords.length > 0 ? (
                <div className="space-y-1.5">
                  {personRecords.map(r => (
                    <div key={r.id} onClick={() => onNavigateToTab("archives")}
                      className="p-2.5 rounded-lg border border-gray-100 bg-stone-50 hover:bg-stone-100 cursor-pointer flex items-center justify-between transition">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-secondary/80" />
                        <div>
                          <div className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{r.title}</div>
                          <div className="text-[9px] text-[#006591]">{r.type} · {r.dateStr}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 text-center rounded-lg border border-dashed border-gray-200">
                  <p className="text-[10px] text-gray-400 italic">No archives linked yet.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button onClick={() => setIsAddingMember(true)}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> Add Family Member
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleShare}
                  className="py-2 px-3 border border-[#eae8e3] hover:bg-stone-50 text-xs font-bold text-stone-700 rounded-lg flex items-center justify-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-gray-400" /> Share
                </button>
                <button onClick={() => onNavigateToTab("bio", selectedPerson.id)}
                  className="py-2 px-3 bg-secondary/10 hover:bg-secondary/15 text-xs font-bold text-[#506447] rounded-lg flex items-center justify-center gap-1">
                  Story <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={openEdit}
                  className="py-2 px-3 border border-[#eae8e3] hover:bg-stone-50 text-xs font-bold text-stone-700 rounded-lg flex items-center justify-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-gray-400" /> Edit
                </button>
                <button onClick={() => setDeleteConfirm(true)}
                  className="py-2 px-3 border border-red-100 hover:bg-red-50 text-xs font-bold text-red-500 rounded-lg flex items-center justify-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>

            {/* Delete confirmation inline */}
            {deleteConfirm && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-bold">Delete {selectedPerson.firstName}? This cannot be undone.</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDelete}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded">
                    Yes, delete
                  </button>
                  <button onClick={() => setDeleteConfirm(false)}
                    className="flex-1 py-1.5 border border-gray-200 text-xs font-bold text-gray-600 rounded hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border border-[#eae8e3] p-8 text-center max-w-sm mx-auto">
            <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-serif text-tertiary font-bold">No person selected</p>
            <p className="text-xs text-gray-400 mt-1">Click a card on the tree to see details.</p>
          </div>
        )}
      </div>

      {/* ── ADD MEMBER MODAL ── */}
      {isAddingMember && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="bg-[#506447] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h3 className="font-serif font-bold text-lg">Add to Lineage</h3>
              </div>
              <button onClick={() => { setIsAddingMember(false); setAddForm(emptyForm) }}
                className="p-1 hover:bg-white/10 rounded-full text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {selectedPerson && (
                <div className="p-3 bg-stone-50 rounded-lg text-[11px] text-gray-500 border border-gray-200">
                  Adding relation to <span className="font-bold text-tertiary">{selectedPerson.firstName} {selectedPerson.lastName}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input required value={addForm.firstName}
                    onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="e.g. Mary"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input required value={addForm.lastName}
                    onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="e.g. Vance"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Birth Year</label>
                  <input value={addForm.birthYear}
                    onChange={e => setAddForm(f => ({ ...f, birthYear: e.target.value }))}
                    placeholder="e.g. 1942"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Death Year</label>
                  <input value={addForm.deathYear}
                    onChange={e => setAddForm(f => ({ ...f, deathYear: e.target.value }))}
                    placeholder="blank = alive"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Birth Place</label>
                <input value={addForm.birthPlace}
                  onChange={e => setAddForm(f => ({ ...f, birthPlace: e.target.value }))}
                  placeholder="e.g. Almaty, Kazakhstan"
                  className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Avatar URL (optional)</label>
                <input value={addForm.avatarUrl}
                  onChange={e => setAddForm(f => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gender</label>
                  <select value={addForm.gender} onChange={e => setAddForm(f => ({ ...f, gender: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {selectedPerson && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Relationship</label>
                    <select value={addForm.relationship} onChange={e => setAddForm(f => ({ ...f, relationship: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs">
                      <option value="child">Child of selected</option>
                      <option value="spouse">Spouse of selected</option>
                      <option value="parent">Parent of selected</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => { setIsAddingMember(false); setAddForm(emptyForm) }}
                  className="px-4 py-2 border border-gray-200 rounded text-xs font-semibold text-gray-500 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-[#506447] hover:bg-[#506447]/90 text-white rounded text-xs font-bold">
                  Save to Tree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT PERSON MODAL ── */}
      {isEditing && selectedPerson && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#ab988b] text-white p-4 flex justify-between items-center sticky top-0">
              <div className="flex items-center gap-1.5">
                <PenTool className="w-4 h-4" />
                <h3 className="font-serif font-bold text-lg">Edit Person</h3>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">First Name</label>
                  <input value={editForm.firstName || ""} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Last Name</label>
                  <input value={editForm.lastName || ""} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Maiden Name</label>
                <input value={editForm.maidenName || ""} onChange={e => setEditForm(f => ({ ...f, maidenName: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Birth Year</label>
                  <input value={editForm.birthYear || ""} onChange={e => setEditForm(f => ({ ...f, birthYear: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Death Year</label>
                  <input value={editForm.deathYear || ""} onChange={e => setEditForm(f => ({ ...f, deathYear: e.target.value, isAlive: !e.target.value }))}
                    placeholder="blank = alive"
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Birth Place</label>
                  <input value={editForm.birthPlace || ""} onChange={e => setEditForm(f => ({ ...f, birthPlace: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gender</label>
                  <select value={editForm.gender || "other"} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Avatar URL</label>
                <input value={editForm.avatarUrl || ""} onChange={e => setEditForm(f => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
              </div>

              {/* Relationships */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Relationships</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["father", "mother", "spouse"] as const).map(rel => {
                    const fieldId = rel === "father" ? "fatherId" : rel === "mother" ? "motherId" : "spouseId"
                    return (
                      <div key={rel}>
                        <label className="block text-[10px] text-gray-400 mb-1 capitalize">{rel}</label>
                        <select
                          value={(editForm as any)[fieldId] || ""}
                          onChange={e => setEditForm(f => ({ ...f, [fieldId]: e.target.value || undefined }))}
                          className="w-full px-2 py-1.5 bg-[#fbf9f4] border border-gray-200 rounded text-[10px]"
                        >
                          <option value="">— none —</option>
                          {people.filter(p => p.id !== selectedPerson.id).map(p => (
                            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-200 rounded text-xs font-semibold text-gray-500 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-[#ab988b] hover:bg-[#ab988b]/90 text-white rounded text-xs font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
