import React, { useState, useMemo, useEffect } from 'react';
import { ExtendedRefrigerantId, ExtendedRefrigerantMeta } from '../types/phDiagram';
import { EXTENDED_REFRIGERANTS } from '../utils/phThermodynamics';

import { AppLanguage } from '../utils/i18n';

interface RefrigerantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: ExtendedRefrigerantId;
  onSelect: (id: ExtendedRefrigerantId) => void;
  // If embedded is true, renders inline without modal backdrop
  isInline?: boolean;
  language?: AppLanguage;
}

export const RefrigerantSelectorModal: React.FC<RefrigerantSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedId,
  onSelect,
  isInline = false,
  language = 'id',
}) => {
  const isEn = language === 'en';
  // 1. Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Active Tab: 'all' (Semua) or 'favorites' (Favorit)
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  // 3. Category Filter via Funnel Icon
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // 4. Favorites State persisted in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rtu_refrigerant_favorites_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default popular favorites
    return ['R32', 'R134a', 'R410A', 'R404A', 'R290', 'R717'];
  });

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('rtu_refrigerant_favorites_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // 5. Refrigerants List (Order: R23, R32, R41, R114 prioritized or natural sequence)
  const allRefrigerants = useMemo(() => {
    // Exact Danfoss-like order, placing R23, R32, R41, R114 prominently as seen in photo
    const preferredOrder: ExtendedRefrigerantId[] = [
      'R23',
      'R32',
      'R41',
      'R114',
      'R12',
      'R22',
      'R134a',
      'R290',
      'R404A',
      'R407C',
      'R410A',
      'R448A',
      'R507A',
      'R600a',
      'R717',
      'R744',
      'R1234yf',
      'R1234ze',
      'R1270',
    ];

    const list: ExtendedRefrigerantMeta[] = [];
    const seen = new Set<string>();

    for (const id of preferredOrder) {
      if (EXTENDED_REFRIGERANTS[id]) {
        list.push(EXTENDED_REFRIGERANTS[id]);
        seen.add(id);
      }
    }

    for (const [id, meta] of Object.entries(EXTENDED_REFRIGERANTS)) {
      if (!seen.has(id)) {
        list.push(meta);
      }
    }

    return list;
  }, []);

  // Filtered List based on search, tab, and category filter
  const filteredRefrigerants = useMemo(() => {
    return allRefrigerants.filter((ref) => {
      // Tab filter
      if (activeTab === 'favorites' && !favorites.includes(ref.id)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && ref.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = ref.id.toLowerCase().includes(q);
        const matchesName = ref.name.toLowerCase().includes(q);
        const matchesFormula = ref.formula.toLowerCase().includes(q);
        const matchesCategory = ref.category.toLowerCase().includes(q);
        const matchesSafety = ref.safetyClass.toLowerCase().includes(q);
        return matchesId || matchesName || matchesFormula || matchesCategory || matchesSafety;
      }

      return true;
    });
  }, [allRefrigerants, activeTab, favorites, selectedCategory, searchQuery]);

  // Categories list for filter menu
  const categories = useMemo(() => {
    const set = new Set<string>();
    allRefrigerants.forEach((r) => set.add(r.category));
    return ['ALL', ...Array.from(set)];
  }, [allRefrigerants]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen || isInline) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isInline, onClose]);

  if (!isOpen && !isInline) return null;

  const content = (
    <div className="w-full max-w-xl mx-auto flex flex-col bg-[#111316] text-white min-h-[580px] max-h-[90vh] rounded-3xl shadow-2xl border border-[#23272e] overflow-hidden">
      {/* 1. TOP HEADER: Back Button and Title */}
      <div className="relative flex items-center justify-center px-4 py-4 sm:px-6 sm:py-5 border-b border-transparent">
        {/* Circular Back Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isEn ? "Back" : "Kembali"}
          className="absolute left-4 sm:left-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#272b32] hover:bg-[#343842] active:bg-[#3f444f] flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer shadow-md focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* Center Title */}
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white select-none">
          {isEn ? 'Select refrigerant' : 'Pilih refrigeran'}
        </h1>

        {/* Right Action: Count Badge or Close */}
        <div className="absolute right-4 sm:right-6 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span>{filteredRefrigerants.length}</span>
          <span className="hidden sm:inline">{isEn ? 'fluids' : 'fluida'}</span>
        </div>
      </div>

      {/* 2. SEARCH BAR & FILTER FUNNEL */}
      <div className="px-4 sm:px-6 pt-1 pb-3 space-y-2">
        <div className="relative flex items-center bg-[#1c1f24] rounded-2xl px-4 py-3 sm:py-3.5 border border-slate-800/80 focus-within:border-slate-500 transition-colors shadow-inner">
          {/* Magnifying Glass Icon */}
          <svg
            className="w-5 h-5 text-slate-400 shrink-0 mr-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEn ? "Search..." : "Mencari..."}
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base font-normal focus:outline-none"
          />

          {/* Clear Search Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-white mr-2 cursor-pointer transition-colors"
              title="Hapus pencarian"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Filter Funnel Icon (Toggle Category Filter) */}
          <button
            type="button"
            onClick={() => setShowFilterDrawer((prev) => !prev)}
            aria-label="Filter refrigeran"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer relative shrink-0 ${
              selectedCategory !== 'ALL' || showFilterDrawer
                ? 'text-cyan-400 bg-cyan-950/60'
                : 'text-slate-300 hover:text-white hover:bg-[#282d35]'
            }`}
            title="Filter Kategori"
          >
            {/* Danfoss funnel icon style */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-6.586a1 1 0 00-.293-.707L1.293 7.293A1 1 0 011 6.586V4a1 1 0 011-1z" />
            </svg>
            {selectedCategory !== 'ALL' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full ring-2 ring-[#1c1f24]" />
            )}
          </button>
        </div>

        {/* Filter Drawer / Category Selector Chips */}
        {showFilterDrawer && (
          <div className="bg-[#181a1f] p-3 rounded-xl border border-slate-800 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Filter berdasarkan Kelas Fluida:</span>
              {selectedCategory !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowFilterDrawer(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-[#252830] text-slate-300 hover:bg-[#303540] hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? (isEn ? 'All Categories' : 'Semua Kategori') : cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. SEGMENTED TABS: "Semua" and "Favorit" */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="bg-[#181a1f] p-1.5 rounded-2xl flex items-center gap-2 border border-slate-800/80">
          {/* Tab 1: Semua (List Icon) */}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 font-semibold text-sm sm:text-base transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#34383f] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202329]'
            }`}
          >
            {/* Bullet list icon */}
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zm5-10h11v2H9V6zm0 5h11v2H9v-2zm0 5h11v2H9v-2z" />
            </svg>
            <span>{isEn ? 'All' : 'Semua'}</span>
          </button>

          {/* Tab 2: Favorit (Star Icon) */}
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 font-semibold text-sm sm:text-base transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-[#34383f] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202329]'
            }`}
          >
            {/* Star Icon */}
            <svg
              className={`w-5 h-5 shrink-0 ${
                activeTab === 'favorites' ? 'fill-current' : 'fill-none stroke-current'
              }`}
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <span>Favorit</span>
            {favorites.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#272b32] text-amber-300 font-mono">
                {favorites.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. REFRIGERANT LIST SECTION (Group Header & Cards) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-3 custom-scrollbar">
        {/* Subtle Group Divider Header with Chevron (matching photo top indicator) */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-2 pt-1">
          <span className="tracking-wider">
            {activeTab === 'favorites'
              ? 'DAFTAR REFRIGERAN FAVORIT'
              : selectedCategory !== 'ALL'
              ? `KATEGORI: ${selectedCategory}`
              : 'SEMUA REFRIGERAN'}
          </span>
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>

        {/* Empty State */}
        {filteredRefrigerants.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#1c1f24] flex items-center justify-center text-slate-500">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">
              {activeTab === 'favorites'
                ? 'Belum ada refrigeran favorit. Klik tanda bintang (☆) pada kartu refrigeran untuk menyimpannya di sini.'
                : 'Tidak ditemukan refrigeran yang sesuai kriteria pencarian.'}
            </p>
            {activeTab === 'favorites' && (
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer transition-colors"
              >
                Lihat Semua Refrigeran
              </button>
            )}
          </div>
        ) : (
          filteredRefrigerants.map((ref) => {
            const isSelected = ref.id === selectedId;
            const isFav = favorites.includes(ref.id);

            return (
              <div
                key={ref.id}
                onClick={() => {
                  onSelect(ref.id);
                  if (!isInline) onClose();
                }}
                className={`relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#1c1f24] transition-all cursor-pointer group select-none ${
                  isSelected
                    ? 'border-2 border-slate-100 shadow-xl shadow-black/40 bg-[#1e2228]'
                    : 'border border-transparent hover:border-slate-700 hover:bg-[#22262d]'
                }`}
              >
                {/* Left Side: Refrigerant ID & Technical Info */}
                <div className="space-y-1 pr-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl sm:text-2xl font-bold text-white tracking-wide font-sans">
                      {ref.id}
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-slate-900 tracking-wider">
                        AKTIF
                      </span>
                    )}
                  </div>

                  {/* Clean unboxed technical metadata (anti-slop standard) */}
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-400 font-mono">
                    <span className="text-slate-300 truncate max-w-[220px] sm:max-w-none">
                      {ref.name.replace(`[${ref.id}]`, '').trim()}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-cyan-400">{ref.category}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-emerald-400">{ref.safetyClass.split(' ')[0]}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span>GWP: {ref.gwp}</span>
                  </div>
                </div>

                {/* Right Side: Star Favorite Icon */}
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(ref.id, e)}
                  aria-label={isFav ? `Hapus ${ref.id} dari favorit` : `Tambah ${ref.id} ke favorit`}
                  className="p-2 sm:p-2.5 rounded-full hover:bg-[#2c313a] active:scale-125 transition-all text-slate-400 hover:text-amber-400 cursor-pointer shrink-0"
                  title={isFav ? 'Hapus dari Favorit' : 'Tandai sebagai Favorit'}
                >
                  <svg
                    className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                      isFav
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'fill-none text-slate-400 group-hover:text-slate-300'
                    }`}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 5. FOOTER CONFIRMATION / TIP */}
      <div className="px-4 sm:px-6 py-3 bg-[#0d0f12] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{isEn ? 'Selected Fluid: ' : 'Fluida Terpilih: '}<strong className="text-white font-mono">{selectedId}</strong></span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg bg-[#272b32] hover:bg-[#343842] text-white font-medium cursor-pointer transition-colors"
        >
          {isEn ? 'Done' : 'Selesai'}
        </button>
      </div>
    </div>
  );

  // If inline, return content container directly
  if (isInline) {
    return content;
  }

  // Full-screen Modal Backdrop
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {content}
    </div>
  );
};
