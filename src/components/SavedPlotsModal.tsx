import React, { useState, useEffect } from 'react';
import { SavedPhCyclePlot, PhReportMeta } from '../types/phDiagram';
import { EXTENDED_REFRIGERANTS } from '../utils/phThermodynamics';

interface SavedPlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlots: SavedPhCyclePlot[];
  onSelectPlotAndPlay: (plot: SavedPhCyclePlot) => void;
  onDeletePlot: (id: string) => void;
  onSaveCurrentPlot: (customName: string, customMeta?: PhReportMeta) => void;
  currentRefrigerantName: string;
  currentCop: number;
  currentCapacityKw: number;
  currentReportMeta?: PhReportMeta;
}

export const SavedPlotsModal: React.FC<SavedPlotsModalProps> = ({
  isOpen,
  onClose,
  savedPlots,
  onSelectPlotAndPlay,
  onDeletePlot,
  onSaveCurrentPlot,
  currentRefrigerantName,
  currentCop,
  currentCapacityKw,
  currentReportMeta,
}) => {
  const [newPlotName, setNewPlotName] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [showMetaCustomizer, setShowMetaCustomizer] = useState(false);
  const [filterRef, setFilterRef] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Identity metadata to be saved with the snapshot
  const [draftMeta, setDraftMeta] = useState<PhReportMeta>(() => {
    return currentReportMeta || {
      productName: `Trainer Refrigerasi Kompresi Uap ${currentRefrigerantName}`,
      trainerName: `Trainer Refrigerasi Kompresi Uap ${currentRefrigerantName}`,
      modelUnit: `RTU-REF-${currentRefrigerantName}`,
      workOrderNumber: 'WL-13095-01',
      projectName: 'Pengujian Siklus Refrigerasi & Diagram P-h',
      reportDate: new Date().toISOString().split('T')[0],
    };
  });

  // Keep draftMeta synced with currentReportMeta whenever modal opens or props change
  useEffect(() => {
    if (currentReportMeta) {
      setDraftMeta(currentReportMeta);
    }
  }, [currentReportMeta, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName =
      newPlotName.trim() ||
      `Plot ${currentRefrigerantName} - ${draftMeta.workOrderNumber || 'WL-13095-01'} (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;

    onSaveCurrentPlot(finalName, draftMeta);
    setNewPlotName('');
    setIsSavingNew(false);
    setShowMetaCustomizer(false);
    setFeedbackMsg(`Skenario "${finalName}" beserta seluruh identitas administratif berhasil disimpan!`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const filteredPlots = savedPlots.filter((p) => {
    if (filterRef === 'all') return true;
    return p.refrigerantId === filterRef;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
                <span>📁 Manajemen Plotting Siklus P-h</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Simpan &amp; Putar Ulang
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Snapshot siklus menyimpan koordinat P-h serta <strong>seluruh data identitas administratif</strong> (Nama Produk, Model, No. SPK, Proyek, Tanggal).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="bg-emerald-950 border-b border-emerald-800 text-emerald-200 px-6 py-2.5 text-xs font-mono flex items-center gap-2">
            <span>✓</span>
            <span className="font-semibold">{feedbackMsg}</span>
          </div>
        )}

        {/* Action Top Bar: Save Current Cycle */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          {!isSavingNew ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs font-mono space-y-1">
                <div>
                  <span className="text-slate-400">Siklus Aktif: </span>
                  <strong className="text-cyan-400">{currentRefrigerantName}</strong>
                  <span className="text-slate-500 mx-1.5">•</span>
                  <span className="text-slate-400">COP: </span>
                  <strong className="text-white">{currentCop}</strong>
                  <span className="text-slate-500 mx-1.5">•</span>
                  <span className="text-slate-400">Qe: </span>
                  <strong className="text-emerald-400">{currentCapacityKw} kW</strong>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                  <span className="text-amber-400 font-semibold">📋 Identitas:</span>
                  <span className="text-slate-200 font-bold font-mono">
                    {draftMeta.workOrderNumber || 'WL-13095-01'}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300">{draftMeta.modelUnit || 'RTU-REF'}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300 truncate max-w-[260px]">
                    {draftMeta.productName || draftMeta.trainerName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSavingNew(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg text-xs font-mono transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer shrink-0"
              >
                <span>💾 Simpan Plotting &amp; Identitas</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  autoFocus
                  placeholder={`Beri nama skenario (Contoh: Pengujian R32 Beban 1.5 PK)`}
                  value={newPlotName}
                  onChange={(e) => setNewPlotName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-cyan-500/60 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1"
                  >
                    <span>✓</span>
                    <span>Simpan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSavingNew(false);
                      setShowMetaCustomizer(false);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>

              {/* Identity Snapshot Card */}
              <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Identitas yang Tersimpan Bersama Plotting Ini:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMetaCustomizer(!showMetaCustomizer)}
                    className="text-[10.5px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    {showMetaCustomizer ? 'Sembunyikan Form Edit' : '✏️ Sesuaikan Identitas Skenario Ini'}
                  </button>
                </div>

                {!showMetaCustomizer ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-300">
                    <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9.5px]">No. SPK / WO:</span>
                      <strong className="text-amber-400 font-bold">{draftMeta.workOrderNumber || 'WL-13095-01'}</strong>
                    </div>
                    <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9.5px]">Model Unit:</span>
                      <strong className="text-white font-bold">{draftMeta.modelUnit}</strong>
                    </div>
                    <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9.5px]">Nama Produk:</span>
                      <strong className="text-cyan-300 truncate block font-bold">{draftMeta.productName || draftMeta.trainerName}</strong>
                    </div>
                    <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9.5px]">Tanggal Uji:</span>
                      <strong className="text-slate-300 font-bold">{draftMeta.reportDate}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-1 text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-cyan-400 block mb-0.5">Nama Produk:</label>
                      <input
                        type="text"
                        value={draftMeta.productName || draftMeta.trainerName || ''}
                        onChange={(e) =>
                          setDraftMeta({
                            ...draftMeta,
                            productName: e.target.value,
                            trainerName: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300 block mb-0.5">Model Unit:</label>
                      <input
                        type="text"
                        value={draftMeta.modelUnit}
                        onChange={(e) => setDraftMeta({ ...draftMeta, modelUnit: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-300 block mb-0.5">No. SPK / WO:</label>
                      <input
                        type="text"
                        value={draftMeta.workOrderNumber}
                        onChange={(e) => setDraftMeta({ ...draftMeta, workOrderNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300 block mb-0.5">Nama Proyek:</label>
                      <input
                        type="text"
                        value={draftMeta.projectName}
                        onChange={(e) => setDraftMeta({ ...draftMeta, projectName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300 block mb-0.5">Tanggal Laporan:</label>
                      <input
                        type="date"
                        value={draftMeta.reportDate}
                        onChange={(e) => setDraftMeta({ ...draftMeta, reportDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Filter Refrigerants */}
        <div className="px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
          <span className="text-slate-500 font-semibold shrink-0">Filter Freon:</span>
          <button
            onClick={() => setFilterRef('all')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              filterRef === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({savedPlots.length})
          </button>
          {['R134a', 'R32', 'R404A', 'R448A', 'R290'].map((ref) => {
            const count = savedPlots.filter((p) => p.refrigerantId === ref).length;
            if (count === 0) return null;
            return (
              <button
                key={ref}
                onClick={() => setFilterRef(ref)}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  filterRef === ref ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {ref} ({count})
              </button>
            );
          })}
        </div>

        {/* Saved Plots List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredPlots.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-mono text-xs">
              Belum ada plotting tersimpan untuk kategori ini.
            </div>
          ) : (
            filteredPlots.map((plot) => {
              const refMeta = EXTENDED_REFRIGERANTS[plot.refrigerantId];
              const dateStr = new Date(plot.timestamp).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const meta = plot.reportMeta;

              return (
                <div
                  key={plot.id}
                  className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 transition-all duration-200 group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: `${refMeta?.color || '#06b6d4'}20`,
                          color: refMeta?.color || '#38bdf8',
                          border: `1px solid ${refMeta?.color || '#06b6d4'}40`,
                        }}
                      >
                        {plot.refrigerantId}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {plot.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {dateStr}
                      </span>
                    </div>

                    {/* Operational Coordinates Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[9.5px]">Tekanan Suc/Dis:</span>
                        <span>{plot.suctionPressure} / {plot.dischargePressure} {plot.suctionPressureUnit}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9.5px]">Suhu T1 / T2 / T3:</span>
                        <span>{plot.suctionTempC}° / {plot.dischargeTempC}° / {plot.liquidTempC}°C</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9.5px]">Superheat / Subcooling:</span>
                        <span className={plot.subcoolingK < 3 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          +{plot.superheatK} K / {plot.subcoolingK} K
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9.5px]">Kapasitas &amp; COP:</span>
                        <span className="text-cyan-300 font-bold">
                          {plot.coolingCapacityKw} kW · COP {plot.cop}
                        </span>
                      </div>
                    </div>

                    {/* Report Identity Metadata Preserved */}
                    {meta && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 border-t border-slate-800/80 text-[10.5px] font-mono">
                        <span className="bg-amber-950/40 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded font-bold">
                          SPK: {meta.workOrderNumber || 'WL-13095-01'}
                        </span>
                        <span className="text-slate-300">
                          <span className="text-slate-500">Model:</span> <strong className="text-slate-200">{meta.modelUnit || '-'}</strong>
                        </span>
                        <span className="text-slate-400 truncate max-w-[280px]">
                          <span className="text-slate-500">Produk:</span> {meta.productName || meta.trainerName || '-'}
                        </span>
                        <span className="text-slate-400">
                          <span className="text-slate-500">Tgl:</span> {meta.reportDate || '-'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPlotAndPlay(plot);
                        onClose();
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-lg text-xs font-mono transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                      title="Terapkan parameter siklus & seluruh identitas laporan, lalu putar animasi peredaran refrigeran"
                    >
                      <span>▶️ Putar &amp; Terapkan</span>
                    </button>
                    {!plot.id.startsWith('benchmark-') && (
                      <button
                        type="button"
                        onClick={() => onDeletePlot(plot.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900 rounded-lg transition cursor-pointer"
                        title="Hapus skenario tersimpan"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">
            Total Skenario: <strong className="text-slate-300">{savedPlots.length}</strong> plotting (tersimpan lokal)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

