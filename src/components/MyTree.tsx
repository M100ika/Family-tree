/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Minus, Maximize2, Search, FileText, ChevronRight,
  Share2, CheckCircle, X, Sparkles, PenTool, Trash2, AlertTriangle,
  UserPlus, Compass, Map as MapIcon, Download, Filter, ZoomIn, ZoomOut, Upload,
} from "lucide-react";
import { Person, ArchiveRecord } from "../types";

// ─── constants ────────────────────────────────────────────────────────────────

const CARD_W = 160;
const CARD_H = 80;
const H_GAP = 40;
const V_STEP = 120;
const AVATAR_M = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200";
const AVATAR_F = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200";

// ─── props ────────────────────────────────────────────────────────────────────

interface MyTreeProps {
  people: Person[];
  records: ArchiveRecord[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
  onAddPerson: (p: Person) => Promise<Person | void>;
  onUpdatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  onDeletePerson: (id: string) => Promise<void>;
  onNavigateToTab: (tab: string, personId?: string) => void;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(p: Person) {
  return ((p.firstName?.[0] ?? "") + (p.lastName?.[0] ?? "")).toUpperCase();
}

function buildTreeLayout(
  people: Person[],
  collapsedNodes: Set<string> = new Set()
): Map<string, { x: number; y: number }> {
  const posMap = new Map<string, { x: number; y: number }>();
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  people.forEach(p => {
    if (p.fatherId) {
      if (!childrenMap.has(p.fatherId)) childrenMap.set(p.fatherId, []);
      childrenMap.get(p.fatherId)!.push(p.id);
      if (!parentMap.has(p.id)) parentMap.set(p.id, p.fatherId);
    }
    if (p.motherId && !parentMap.has(p.id)) {
      if (!childrenMap.has(p.motherId)) childrenMap.set(p.motherId, []);
      childrenMap.get(p.motherId)!.push(p.id);
      parentMap.set(p.id, p.motherId);
    }
  });

  const roots = people.filter(p => !parentMap.has(p.id)).map(p => p.id);
  let nextX = 0;

  function layoutNode(nodeId: string, depth: number): { x: number; width: number } {
    if (collapsedNodes.has(nodeId)) {
      const x = nextX;
      nextX += CARD_W + H_GAP;
      posMap.set(nodeId, { x, y: depth * V_STEP });
      return { x, width: CARD_W + H_GAP };
    }

    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) {
      const x = nextX;
      nextX += CARD_W + H_GAP;
      posMap.set(nodeId, { x, y: depth * V_STEP });
      return { x, width: CARD_W + H_GAP };
    }

    const childResults: { x: number; width: number }[] = [];
    let childWidth = 0;
    for (const childId of children) {
      const res = layoutNode(childId, depth + 1);
      childResults.push(res);
      childWidth += res.width;
    }

    const first = childResults[0];
    const last = childResults[childResults.length - 1];
    const x = first.x + (last.x + last.width - first.x) / 2 - CARD_W / 2;
    posMap.set(nodeId, { x, y: depth * V_STEP });
    return { x, width: Math.max(CARD_W + H_GAP, childWidth) };
  }

  roots.forEach(r => layoutNode(r, 0));

  if (posMap.size > 0) {
    const minX = Math.min(...Array.from(posMap.values()).map(p => p.x));
    posMap.forEach(pos => { pos.x += -minX + 100; });
  }

  return posMap;
}

// ─── PersonCard ───────────────────────────────────────────────────────────────

interface CardProps {
  person: Person;
  pos: { x: number; y: number };
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  isCollapsed: boolean;
  hasChildren: boolean;
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onDragStart: (e: React.MouseEvent, person: Person) => void;
}

const PersonCard = React.memo(({
  person, pos, isSelected, isHighlighted, isDimmed, isCollapsed, hasChildren,
  onSelect, onToggleCollapse, onDragStart,
}: CardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: isDimmed ? 0.3 : 1, scale: 1 }}
    transition={{ duration: 0.25 }}
    className={`tree-card absolute p-3 bg-white rounded-xl border-2 cursor-grab active:cursor-grabbing shadow-md hover:shadow-lg flex gap-2.5 items-center select-none transition-shadow ${
      isSelected
        ? "border-[#506447] bg-[#506447]/5 shadow-lg ring-2 ring-[#506447]/20"
        : "border-gray-200 hover:border-[#ab988b]"
    } ${isHighlighted ? "ring-4 ring-amber-400" : ""}`}
    style={{ left: pos.x, top: pos.y, width: CARD_W, minHeight: CARD_H }}
    onMouseDown={(e) => onDragStart(e, person)}
    onClick={(e) => { e.stopPropagation(); onSelect(person.id); }}
  >
    {person.avatarUrl ? (
      <img
        className="w-10 h-10 rounded-full object-cover shadow flex-shrink-0"
        src={person.avatarUrl} alt={person.firstName} referrerPolicy="no-referrer"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-[#ab988b]/20 text-[#506447] flex items-center justify-center font-bold text-sm flex-shrink-0">
        {initials(person)}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <div className="text-xs font-bold text-gray-800 truncate">
        {person.firstName} {person.lastName}
      </div>
      <div className="text-[10px] text-gray-400">
        {person.birthYear} – {person.deathYear || "Наст. вр."}
      </div>
      {person.isPatriarch && (
        <span className="text-[9px] px-1.5 py-0.5 mt-0.5 inline-block bg-[#006591] text-white rounded font-mono uppercase">
          Патриарх
        </span>
      )}
    </div>
    {hasChildren && (
      <button
        onClick={(e) => { e.stopPropagation(); onToggleCollapse(person.id); }}
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow hover:bg-gray-50 z-10"
        title={isCollapsed ? "Развернуть" : "Свернуть"}
      >
        {isCollapsed ? <Plus className="w-3 h-3 text-gray-600" /> : <Minus className="w-3 h-3 text-gray-600" />}
      </button>
    )}
  </motion.div>
));

// ─── AddModal ─────────────────────────────────────────────────────────────────

type AddForm = {
  firstName: string; lastName: string; birthYear: string; deathYear: string;
  birthPlace: string; gender: "male" | "female" | "other";
  relationship: "child" | "spouse" | "parent"; avatarUrl: string;
};

const EMPTY_ADD: AddForm = {
  firstName: "", lastName: "", birthYear: "", deathYear: "",
  birthPlace: "", gender: "male", relationship: "child", avatarUrl: "",
};

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: AddForm) => void;
  selectedPerson: Person | null;
}

const AddModal = ({ isOpen, onClose, onSubmit, selectedPerson }: AddModalProps) => {
  const [form, setForm] = useState<AddForm>(EMPTY_ADD);
  useEffect(() => { if (isOpen) setForm(EMPTY_ADD); }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#506447] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h3 className="font-serif font-bold text-lg">Добавить в родословную</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-4">
              {selectedPerson && (
                <div className="p-3 bg-stone-50 rounded-lg text-[11px] text-gray-500 border border-gray-200">
                  Добавление связи с <span className="font-bold text-gray-800">{selectedPerson.firstName} {selectedPerson.lastName}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Имя <span className="text-red-500">*</span></label>
                  <input required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="Напр. Айгуль" className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Фамилия <span className="text-red-500">*</span></label>
                  <input required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Напр. Сейтов" className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Год рождения</label>
                  <input value={form.birthYear} onChange={e => setForm(f => ({ ...f, birthYear: e.target.value }))}
                    placeholder="1942" className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Год смерти</label>
                  <input value={form.deathYear} onChange={e => setForm(f => ({ ...f, deathYear: e.target.value }))}
                    placeholder="пусто = жив(а)" className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Место рождения</label>
                <input value={form.birthPlace} onChange={e => setForm(f => ({ ...f, birthPlace: e.target.value }))}
                  placeholder="Напр. Алматы" className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Ссылка на фото (необязательно)</label>
                <input value={form.avatarUrl} onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="https://..." className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#506447]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Пол</label>
                  <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as AddForm["gender"] }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs">
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="other">Другой</option>
                  </select>
                </div>
                {selectedPerson && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Связь</label>
                    <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value as AddForm["relationship"] }))}
                      className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs">
                      <option value="child">Ребёнок</option>
                      <option value="spouse">Супруг(а)</option>
                      <option value="parent">Родитель</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 border border-gray-200 rounded text-xs font-semibold text-gray-500 hover:bg-gray-50">Отмена</button>
                <button type="submit"
                  className="px-4 py-2 bg-[#506447] hover:bg-[#506447]/90 text-white rounded text-xs font-bold">Сохранить</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── EditModal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: Partial<Person>) => void;
  person: Person | null;
  people: Person[];
}

const EditModal = ({ isOpen, onClose, onSubmit, person, people }: EditModalProps) => {
  const [form, setForm] = useState<Partial<Person>>({});
  useEffect(() => { if (isOpen && person) setForm({ ...person }); }, [isOpen, person]);

  return (
    <AnimatePresence>
      {isOpen && person && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#ab988b] text-white p-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-1.5">
                <PenTool className="w-4 h-4" />
                <h3 className="font-serif font-bold text-lg">Редактировать</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Имя</label>
                  <input value={form.firstName || ""} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Фамилия</label>
                  <input value={form.lastName || ""} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Девичья фамилия</label>
                <input value={form.maidenName || ""} onChange={e => setForm(f => ({ ...f, maidenName: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Год рождения</label>
                  <input value={form.birthYear || ""} onChange={e => setForm(f => ({ ...f, birthYear: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Год смерти</label>
                  <input value={form.deathYear || ""} onChange={e => setForm(f => ({ ...f, deathYear: e.target.value, isAlive: !e.target.value }))}
                    placeholder="пусто = жив(а)" className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Место рождения</label>
                  <input value={form.birthPlace || ""} onChange={e => setForm(f => ({ ...f, birthPlace: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Пол</label>
                  <select value={form.gender || "other"} onChange={e => setForm(f => ({ ...f, gender: e.target.value as Person["gender"] }))}
                    className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs">
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="other">Другой</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Ссылка на фото</label>
                <input value={form.avatarUrl || ""} onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="https://..." className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs focus:outline-[#ab988b]" />
              </div>
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Связи</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["father", "mother", "spouse"] as const).map(rel => {
                    const field = rel === "father" ? "fatherId" : rel === "mother" ? "motherId" : "spouseId";
                    const label = rel === "father" ? "Отец" : rel === "mother" ? "Мать" : "Супруг(а)";
                    return (
                      <div key={rel}>
                        <label className="block text-[10px] text-gray-400 mb-1">{label}</label>
                        <select
                          value={(form as any)[field] || ""}
                          onChange={e => setForm(f => ({ ...f, [field]: e.target.value || undefined }))}
                          className="w-full px-2 py-1.5 bg-[#fbf9f4] border border-gray-200 rounded text-[10px]"
                        >
                          <option value="">— нет —</option>
                          {people.filter(p => p.id !== person.id).map(p => (
                            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 border border-gray-200 rounded text-xs font-semibold text-gray-500 hover:bg-gray-50">Отмена</button>
                <button type="submit"
                  className="px-4 py-2 bg-[#ab988b] hover:bg-[#ab988b]/90 text-white rounded text-xs font-bold">Сохранить</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── ImportModal ──────────────────────────────────────────────────────────────

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (csv: string) => void;
}

const ImportModal = ({ isOpen, onClose, onImport }: ImportModalProps) => {
  const [csv, setCsv] = useState("");
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#006591] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                <h3 className="font-serif font-bold text-lg">Импорт CSV</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); onImport(csv); setCsv(""); onClose(); }} className="p-6 space-y-4">
              <p className="text-xs text-gray-500">Вставьте данные в формате CSV: Имя, Фамилия, Год рождения, Пол</p>
              <code className="block p-2 bg-gray-100 rounded text-[10px] text-gray-600">
                Иван,Петров,1950,мужской<br />
                Мария,Иванова,1952,женский
              </code>
              <textarea value={csv} onChange={e => setCsv(e.target.value)}
                placeholder="Вставьте CSV данные..." rows={8}
                className="w-full px-3 py-2 bg-[#fbf9f4] border border-gray-200 rounded text-xs font-mono focus:outline-[#006591]" />
              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 border border-gray-200 rounded text-xs font-semibold text-gray-500 hover:bg-gray-50">Отмена</button>
                <button type="submit"
                  className="px-4 py-2 bg-[#006591] hover:bg-[#006591]/90 text-white rounded text-xs font-bold">Импортировать</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

export default function MyTree({
  people, records, selectedPersonId,
  onSelectPerson, onAddPerson, onUpdatePerson, onDeletePerson, onNavigateToTab,
}: MyTreeProps) {

  // canvas state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(1200);
  const [canvasH, setCanvasH] = useState(800);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const dragRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const cardDragRef = useRef<{ id: string; mx: number; my: number; baseX: number; baseY: number } | null>(null);
  const [manualPositions, setManualPositions] = useState<Record<string, { x: number; y: number }>>({});
  const touchRef = useRef<any>(null);

  // ui state
  const [collapsedNodes, setCollapsedNodes] = useState(new Set<string>());
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ gender: "all", status: "all" });
  const [showFilters, setShowFilters] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // modals
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // canvas resize
  useEffect(() => {
    const el = canvasRef.current; if (!el) return;
    const update = () => { setCanvasW(el.offsetWidth); setCanvasH(el.offsetHeight); };
    update();
    const ro = new ResizeObserver(update); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // wheel zoom
  useEffect(() => {
    const el = canvasRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(z => Math.max(0.3, Math.min(2.5, z * (e.deltaY > 0 ? 0.92 : 1.08))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") {
        const child = people.find(p => p.fatherId === selectedPersonId || p.motherId === selectedPersonId);
        if (child) onSelectPerson(child.id);
      } else if (e.key === "ArrowLeft") {
        const cur = people.find(p => p.id === selectedPersonId);
        if (cur?.fatherId) onSelectPerson(cur.fatherId);
        else if (cur?.motherId) onSelectPerson(cur.motherId);
      } else if (e.key === "+" || e.key === "=") {
        setZoom(z => Math.min(2.5, z + 0.1));
      } else if (e.key === "-") {
        setZoom(z => Math.max(0.3, z - 0.1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPersonId, people, onSelectPerson]);

  // layout
  const positions = useMemo(() => {
    const raw = buildTreeLayout(people, collapsedNodes);
    const map = new Map<string, { x: number; y: number }>();
    raw.forEach((pos, id) => {
      const m = manualPositions[id];
      map.set(id, {
        x: m ? m.x : canvasW / 2 + pos.x - 400,
        y: 60 + (m ? m.y : pos.y),
      });
    });
    return map;
  }, [people, collapsedNodes, canvasW, manualPositions]);

  // auto-center on selected
  useEffect(() => {
    if (!selectedPersonId || !positions.has(selectedPersonId)) return;
    const pos = positions.get(selectedPersonId)!;
    setPan({
      x: canvasW / (2 * zoom) - CARD_W / 2 - pos.x,
      y: canvasH / (2 * zoom) - CARD_H / 2 - pos.y,
    });
  }, [selectedPersonId, positions, canvasW, canvasH, zoom]);

  const idSet = useMemo(() => new Set(people.map(p => p.id)), [people]);

  // search
  const isHighlighted = useCallback((p: Person) =>
    !!searchQuery && `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()),
  [searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const found = people.find(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()));
    if (found && found.id !== selectedPersonId) onSelectPerson(found.id);
  }, [searchQuery, people, selectedPersonId, onSelectPerson]);

  // filters
  const isVisible = useCallback((p: Person) => {
    if (filters.gender !== "all" && p.gender !== filters.gender) return false;
    if (filters.status === "alive" && p.deathYear) return false;
    if (filters.status === "dead" && !p.deathYear) return false;
    return true;
  }, [filters]);

  // svg paths
  const svgPaths = useMemo(() => {
    const paths: React.ReactNode[] = [];
    people.forEach(person => {
      const cp = positions.get(person.id); if (!cp) return;
      const cx = cp.x + CARD_W / 2, cy = cp.y;
      const drawLine = (parentId: string, key: string) => {
        if (!idSet.has(parentId)) return;
        const pp = positions.get(parentId); if (!pp) return;
        const px = pp.x + CARD_W / 2, py = pp.y + CARD_H, my = (py + cy) / 2;
        paths.push(<path key={key} d={`M ${px} ${py} C ${px} ${my}, ${cx} ${my}, ${cx} ${cy}`} fill="none" stroke="#ab988b" strokeWidth="1.5" strokeOpacity="0.55" />);
      };
      if (person.fatherId) drawLine(person.fatherId, `f-${person.id}`);
      if (person.motherId) drawLine(person.motherId, `m-${person.id}`);
    });
    people.forEach(p => {
      if (!p.spouseId || !idSet.has(p.spouseId) || p.id > p.spouseId) return;
      const pa = positions.get(p.id), pb = positions.get(p.spouseId);
      if (!pa || !pb) return;
      const ax = pa.x + (pa.x < pb.x ? CARD_W : 0), bx = pb.x + (pb.x < pa.x ? CARD_W : 0);
      paths.push(<line key={`sp-${p.id}`} x1={ax} y1={pa.y + CARD_H / 2} x2={bx} y2={pb.y + CARD_H / 2} stroke="#ab988b" strokeWidth="1" strokeDasharray="5 3" strokeOpacity="0.45" />);
    });
    return paths;
  }, [positions, people, idSet]);

  // mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".tree-card")) return;
    setIsDraggingCanvas(true);
    dragRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current && isDraggingCanvas) {
      const { mx, my, px, py } = dragRef.current;
      setPan({ x: px + (e.clientX - mx) / zoom, y: py + (e.clientY - my) / zoom });
    }
    if (cardDragRef.current) {
      const drag = cardDragRef.current;
      const dx = (e.clientX - drag.mx) / zoom;
      const dy = (e.clientY - drag.my) / zoom;
      setManualPositions(prev => ({
        ...prev,
        [drag.id]: { x: drag.baseX + dx, y: drag.baseY + dy },
      }));
    }
  };
  const handleMouseUp = () => {
    cardDragRef.current = null; setIsDraggingCard(false);
    dragRef.current = null; setIsDraggingCanvas(false);
  };
  const handleCardDragStart = (e: React.MouseEvent, person: Person) => {
    e.stopPropagation();
    const pos = positions.get(person.id); if (!pos) return;
    const m = manualPositions[person.id];
    setIsDraggingCard(true);
    cardDragRef.current = { id: person.id, mx: e.clientX, my: e.clientY, baseX: m?.x ?? pos.x, baseY: m?.y ?? pos.y };
  };

  // touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0], t2 = e.touches[1];
      touchRef.current = { dist: Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY), zoom };
    } else if (e.touches.length === 1 && !(e.target as HTMLElement).closest(".tree-card")) {
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, px: pan.x, py: pan.y };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchRef.current?.dist) {
      e.preventDefault();
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const tc = touchRef.current;
      if (tc) setZoom(() => Math.max(0.3, Math.min(2.5, tc.zoom * (dist / tc.dist))));
    } else if (e.touches.length === 1 && touchRef.current?.x && !isDraggingCard) {
      e.preventDefault();
      const t = e.touches[0];
      setPan({ x: touchRef.current.px + (t.clientX - touchRef.current.x) / zoom, y: touchRef.current.py + (t.clientY - touchRef.current.y) / zoom });
    }
  };

  // mutation handlers
  const handleAddSubmit = async (form: AddForm) => {
    const added: Person = {
      id: `tmp-${Date.now()}`,
      firstName: form.firstName, lastName: form.lastName,
      birthYear: form.birthYear || "",
      deathYear: form.deathYear || undefined,
      isAlive: !form.deathYear,
      birthPlace: form.birthPlace || undefined,
      avatarUrl: form.avatarUrl || (form.gender === "female" ? AVATAR_F : AVATAR_M),
      gender: form.gender,
    };
    if (selectedPerson) {
      if (form.relationship === "child") {
        if (selectedPerson.gender === "male") added.fatherId = selectedPerson.id;
        else added.motherId = selectedPerson.id;
      } else if (form.relationship === "spouse") {
        added.spouseId = selectedPerson.id;
      }
    }
    const saved = await onAddPerson(added);
    if (selectedPerson && form.relationship === "parent") {
      const parentId = (saved as Person | undefined)?.id ?? added.id;
      const update = form.gender === "female" ? { motherId: parentId } : { fatherId: parentId };
      await onUpdatePerson(selectedPerson.id, update);
    }
    setIsAddingMember(false);
  };

  const handleEditSubmit = async (updates: Partial<Person>) => {
    if (!selectedPerson) return;
    await onUpdatePerson(selectedPerson.id, updates);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!selectedPerson) return;
    await onDeletePerson(selectedPerson.id);
    setDeleteConfirm(false);
  };

  const handleImport = async (csvText: string) => {
    const lines = csvText.trim().split("\n").filter(l => l.trim());
    for (const [idx, line] of lines.entries()) {
      const [firstName, lastName, birthYear, genderStr] = line.split(",").map(s => s?.trim());
      await onAddPerson({
        id: `tmp-${Date.now()}-${idx}`,
        firstName: firstName || "Неизвестно", lastName: lastName || "",
        birthYear: birthYear || "1900",
        gender: genderStr?.toLowerCase().includes("жен") ? "female" : "male",
        isAlive: true, avatarUrl: "",
      });
    }
    setIsImporting(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedPerson = people.find(p => p.id === selectedPersonId) || people[0] || null;
  const personRecords = records.filter(r =>
    r.relatedPersonIds?.includes(selectedPerson?.id ?? "") ||
    selectedPerson?.recordsFound?.includes(r.id)
  );
  const hasChildren = (id: string) => people.some(p => p.fatherId === id || p.motherId === id);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 72px)" }} id="tree-root-container">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #tree-root-container, #tree-root-container * { visibility: visible; }
          #tree-root-container { position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: white; }
          .no-print { display: none !important; }
        }
        .tree-canvas-content { transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .tree-canvas-content.dragging { transition: none; }
      `}</style>

      {/* ── toolbar ── */}
      <div className="no-print bg-white border-b border-[#eae8e3] px-4 py-2 flex items-center justify-between shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-lg font-bold text-[#506447]">Родословное дерево</h1>
          <span className="text-xs text-gray-400 hidden sm:block">{people.length} чел.</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Поиск..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-stone-50 border border-gray-200 rounded-lg text-xs w-36 focus:w-52 transition-all focus:outline-[#506447]" />
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`p-2 rounded-lg border ${showFilters ? "bg-[#506447] text-white border-[#506447]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            title="Фильтры">
            <Filter className="w-4 h-4" />
          </button>
          <button onClick={() => setIsImporting(true)}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" title="Импорт CSV">
            <Upload className="w-4 h-4" />
          </button>
          <button onClick={() => window.print()}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" title="Распечатать">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => setIsAddingMember(true)}
            className="px-3 py-1.5 bg-[#506447] text-white text-xs font-bold rounded-lg hover:bg-[#506447]/90 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>
      </div>

      {/* ── filter panel ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="no-print bg-white border-b border-[#eae8e3] px-4 py-2 flex gap-4 items-center overflow-hidden flex-shrink-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Пол:</span>
              {[["all", "Все"], ["male", "Муж"], ["female", "Жен"]].map(([val, label]) => (
                <button key={val} onClick={() => setFilters(f => ({ ...f, gender: val }))}
                  className={`px-2 py-1 text-[10px] rounded ${filters.gender === val ? "bg-[#506447] text-white" : "bg-gray-100 text-gray-600"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Статус:</span>
              {[["all", "Все"], ["alive", "Живы"], ["dead", "Умерли"]].map(([val, label]) => (
                <button key={val} onClick={() => setFilters(f => ({ ...f, status: val }))}
                  className={`px-2 py-1 text-[10px] rounded ${filters.status === val ? "bg-[#506447] text-white" : "bg-gray-100 text-gray-600"}`}>
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── main area ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden select-none"
          style={{
            backgroundImage: "radial-gradient(#ab988b 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            backgroundColor: "#f6f4ee",
            cursor: isDraggingCanvas || isDraggingCard ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => { touchRef.current = null; }}
        >
          {people.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-white/90 backdrop-blur p-8 rounded-2xl border border-[#eae8e3] shadow-lg text-center max-w-xs">
                <UserPlus className="w-10 h-10 text-[#506447]/60 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-gray-800">Ваше дерево пусто</h3>
                <p className="text-xs text-gray-400 mt-1 mb-4">Добавьте первого человека, чтобы начать.</p>
                <button onClick={() => setIsAddingMember(true)}
                  className="px-5 py-2.5 bg-[#506447] text-white text-xs font-bold rounded-lg shadow hover:bg-[#506447]/90">
                  + Добавить первого
                </button>
              </div>
            </div>
          )}

          <div
            className={`tree-canvas-content absolute inset-0 ${isDraggingCanvas || isDraggingCard ? "dragging" : ""}`}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
          >
            <svg style={{ position: "absolute", top: 0, left: 0, overflow: "visible", pointerEvents: "none" }}
              width={canvasW * 3} height={canvasH * 3}>
              {svgPaths}
            </svg>
            {people.map(person => {
              const pos = positions.get(person.id); if (!pos) return null;
              return (
                <PersonCard key={person.id} person={person} pos={pos}
                  isSelected={person.id === selectedPersonId}
                  isHighlighted={isHighlighted(person)}
                  isDimmed={!isVisible(person)}
                  isCollapsed={collapsedNodes.has(person.id)}
                  hasChildren={hasChildren(person.id)}
                  onSelect={onSelectPerson}
                  onToggleCollapse={toggleCollapse}
                  onDragStart={handleCardDragStart}
                />
              );
            })}
          </div>

          {/* zoom controls */}
          <div className="no-print absolute bottom-4 left-4 bg-white p-1.5 rounded-xl shadow-lg border border-gray-200 flex gap-1 z-10">
            <button onClick={() => setZoom(z => Math.min(2.5, z + 0.12))} className="p-1.5 hover:bg-stone-100 rounded text-gray-600" title="Приблизить">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.12))} className="p-1.5 hover:bg-stone-100 rounded text-gray-600" title="Отдалить">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 hover:bg-stone-100 rounded text-gray-600" title="Сбросить">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* minimap */}
          <div className="no-print absolute bottom-4 right-4 bg-white/95 backdrop-blur p-3 rounded-xl shadow-lg border border-gray-200 hidden sm:block w-44 z-10">
            <div className="text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <MapIcon className="w-3 h-3 text-[#506447]" />
              <span>Навигатор</span>
            </div>
            <div className="relative h-14 bg-gray-50 rounded border border-gray-100 overflow-hidden">
              {people.slice(0, 20).map(p => {
                const pos = positions.get(p.id); if (!pos) return null;
                return (
                  <div key={p.id}
                    className={`absolute w-2 h-1.5 rounded-sm ${p.id === selectedPersonId ? "bg-[#506447]" : "bg-[#ab988b]/50"}`}
                    style={{
                      left: `${Math.max(0, Math.min(95, (pos.x / (canvasW * 2)) * 100))}%`,
                      top: `${Math.max(0, Math.min(85, (pos.y / (canvasH * 2)) * 100))}%`,
                    }} />
                );
              })}
            </div>
            <input type="range" min="0.3" max="2.5" step="0.05" value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="w-full mt-2 h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#506447]" />
          </div>
        </div>

        {/* sidebar */}
        <div className="no-print w-80 bg-white border-l border-[#eae8e3] overflow-y-auto p-4 space-y-4 hidden lg:block">
          <AnimatePresence>
            {shareToast && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-3 bg-[#e5f5e0] border-l-4 border-green-500 text-green-800 text-xs flex items-center gap-2 rounded-lg shadow">
                <CheckCircle className="w-4 h-4" />
                <span>Ссылка скопирована!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedPerson ? (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-28 h-28 rounded-full overflow-hidden mx-auto shadow-md border-2 border-white ring-4 ring-[#eae8e3] bg-gray-100">
                  {selectedPerson.avatarUrl ? (
                    <img src={selectedPerson.avatarUrl} alt={selectedPerson.firstName}
                      className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-[#ab988b]/20 text-[#506447] flex items-center justify-center font-bold text-2xl">
                      {initials(selectedPerson)}
                    </div>
                  )}
                </div>
                <h3 className="font-serif text-xl font-extrabold text-gray-800 mt-3">
                  {selectedPerson.firstName} {selectedPerson.lastName}
                </h3>
                {selectedPerson.maidenName && (
                  <p className="text-xs text-gray-400 italic">дев. {selectedPerson.maidenName}</p>
                )}
                <p className="text-sm font-semibold text-gray-400 mt-0.5">
                  {selectedPerson.birthYear} – {selectedPerson.deathYear || "Наст. время"}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                {selectedPerson.birthPlace && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Место рождения</div>
                    <p className="text-xs text-stone-700 bg-stone-50 p-2 rounded-lg border border-[#eae8e3] mt-1 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#506447] flex-shrink-0" />
                      {selectedPerson.birthPlace}
                    </p>
                  </div>
                )}
                {selectedPerson.bio && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Биография</div>
                    <p className="text-xs text-gray-500 leading-relaxed mt-1 line-clamp-3">{selectedPerson.bio}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Документы ({personRecords.length})
                </div>
                {personRecords.length > 0 ? (
                  <div className="space-y-1.5">
                    {personRecords.map(r => (
                      <div key={r.id} onClick={() => onNavigateToTab("archives")}
                        className="p-2.5 rounded-lg border border-gray-100 bg-stone-50 hover:bg-stone-100 cursor-pointer flex items-center justify-between transition">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#506447]/80" />
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
                    <p className="text-[10px] text-gray-400 italic">Архивы пока не привязаны.</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <button onClick={() => setIsAddingMember(true)}
                  className="w-full py-2.5 bg-[#506447] hover:bg-[#506447]/90 text-white text-xs font-bold rounded-lg shadow flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" /> Добавить члена семьи
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleShare}
                    className="py-2 px-3 border border-[#eae8e3] hover:bg-stone-50 text-xs font-bold text-stone-700 rounded-lg flex items-center justify-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-gray-400" /> Поделиться
                  </button>
                  <button onClick={() => onNavigateToTab("bio", selectedPerson.id)}
                    className="py-2 px-3 bg-[#506447]/10 hover:bg-[#506447]/15 text-xs font-bold text-[#506447] rounded-lg flex items-center justify-center gap-1">
                    История <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setIsEditing(true)}
                    className="py-2 px-3 border border-[#eae8e3] hover:bg-stone-50 text-xs font-bold text-stone-700 rounded-lg flex items-center justify-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-gray-400" /> Редактировать
                  </button>
                  <button onClick={() => setDeleteConfirm(true)}
                    className="py-2 px-3 border border-red-100 hover:bg-red-50 text-xs font-bold text-red-500 rounded-lg flex items-center justify-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Удалить
                  </button>
                </div>
              </div>

              {deleteConfirm && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-bold">Удалить {selectedPerson.firstName}? Это нельзя отменить.</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDelete}
                      className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded">Да, удалить</button>
                    <button onClick={() => setDeleteConfirm(false)}
                      className="flex-1 py-1.5 border border-gray-200 text-xs font-bold text-gray-600 rounded hover:bg-gray-50">Отмена</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-serif text-gray-800 font-bold">Человек не выбран</p>
              <p className="text-xs text-gray-400 mt-1">Нажмите на карточку в дереве.</p>
            </div>
          )}
        </div>
      </div>

      {/* modals */}
      <AddModal
        isOpen={isAddingMember}
        onClose={() => setIsAddingMember(false)}
        onSubmit={handleAddSubmit}
        selectedPerson={selectedPerson}
      />
      <EditModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSubmit={handleEditSubmit}
        person={selectedPerson}
        people={people}
      />
      <ImportModal
        isOpen={isImporting}
        onClose={() => setIsImporting(false)}
        onImport={handleImport}
      />
    </div>
  );
}
