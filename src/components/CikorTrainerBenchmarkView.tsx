import React, { useState } from 'react';
import {
  GraduationCap,
  Gauge,
  Droplet,
  Wind,
  Layers,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Zap,
  Activity,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import {
  CIKOR_CK5W_BENCHMARK_DATA,
  CHILLER_PRESETS,
  COOLING_TOWER_PRESETS,
  AHU_PRESETS,
} from '../utils/plantCalculations';
import {
  ChillerTestInputs,
  CoolingTowerTestInputs,
  AhuTestInputs,
} from '../types/plantTesting';

interface CikorTrainerBenchmarkViewProps {
  onLoadPreset: (
    chiller: ChillerTestInputs,
    ct: CoolingTowerTestInputs,
    ahu: AhuTestInputs,
    label: string
  ) => void;
}

export const CikorTrainerBenchmarkView: React.FC<CikorTrainerBenchmarkViewProps> = ({
  onLoadPreset,
}) => {
  const [activeDatasetTab, setActiveDatasetTab] = useState<'matrix' | 'ref_cycle' | 'evaporator' | 'condenser' | 'dct' | 'ahu' | 'diagnosis'>('matrix');
  const [selectedPresetId, setSelectedPresetId] = useState<'r410a' | 'r32' | 'ideal'>('r410a');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const data = CIKOR_CK5W_BENCHMARK_DATA;

  const handleApplyPreset = (mode: 'r410a' | 'r32' | 'ideal') => {
    setSelectedPresetId(mode);
    if (mode === 'r410a') {
      const ch = CHILLER_PRESETS.find((p) => p.id === 'cikor_ck5w_r410a')!.inputs;
      const ct = COOLING_TOWER_PRESETS.find((p) => p.id === 'cikor_ck5w_dct_r410a')!.inputs;
      const ah = AHU_PRESETS.find((p) => p.id === 'cikor_ck5w_ahu_r410a')!.inputs;
      onLoadPreset(ch, ct, ah, 'Trainer CK-5W (R410A Actual Run)');
      setAppliedNotification('Data pengujian R410A berhasil dimuat ke seluruh modul pengujian!');
    } else if (mode === 'r32') {
      const ch = CHILLER_PRESETS.find((p) => p.id === 'cikor_ck5w_r32')!.inputs;
      const ct = COOLING_TOWER_PRESETS.find((p) => p.id === 'cikor_ck5w_dct_r32')!.inputs;
      const ah = AHU_PRESETS.find((p) => p.id === 'cikor_ck5w_ahu_r32')!.inputs;
      onLoadPreset(ch, ct, ah, 'Trainer CK-5W (R32 Actual Run)');
      setAppliedNotification('Data pengujian R32 berhasil dimuat ke seluruh modul pengujian!');
    } else {
      const ch = CHILLER_PRESETS.find((p) => p.id === 'cikor_ck5w_ideal')!.inputs;
      const ct = COOLING_TOWER_PRESETS.find((p) => p.id === 'cikor_ck5w_dct_ideal')!.inputs;
      const ah = AHU_PRESETS.find((p) => p.id === 'cikor_ck5w_ahu_ideal')!.inputs;
      onLoadPreset(ch, ct, ah, 'Trainer CK-5W (Desain Ideal 15 kW)');
      setAppliedNotification('Data desain ideal 15 kW berhasil dimuat ke seluruh modul pengujian!');
    }

    setTimeout(() => {
      setAppliedNotification(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. TRAINER IDENTITY & SPECIFICATION HEADER */}
      <div className="relative bg-gradient-to-br from-slate-900 via-sky-950/60 to-slate-950 border-2 border-sky-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                Data Uji Laboratorium Lapangan (Model Jinan Cikor)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                15 kW / 3 TR Nominal
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Commercial Air Con Trainer – Water Chiller &amp; Matched AHU
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Studi komparasi empiris performa antara refrigeran standar <strong>R410A</strong> dan alternatif ramah lingkungan <strong>R32</strong> terhadap <strong>Desain Ideal Pabrik (15 kW)</strong> pada 5 titik penukar kalor: Siklus Refrigerasi, Evaporator Sisi Air, Kondensor Water-Cooled, Dry Cooling Tower, dan Matched AHU.
            </p>
          </div>

          {/* Quick Apply Preset Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              onClick={() => handleApplyPreset('r410a')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Muat Uji R410A</span>
            </button>
            <button
              onClick={() => handleApplyPreset('r32')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Muat Uji R32</span>
            </button>
            <button
              onClick={() => handleApplyPreset('ideal')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Muat Desain Ideal</span>
            </button>
          </div>
        </div>

        {appliedNotification && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedNotification}</span>
          </div>
        )}

        {/* Technical Specification Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-800/80 font-mono text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Model Trainer</span>
            <span className="font-bold text-white">CK-5W (3-Ton)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Kapasitas Nominal</span>
            <span className="font-bold text-cyan-400">15.0 kW (4.27 TR)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Motor Kompresor</span>
            <span className="font-bold text-emerald-400">3.75 kW (3PH-400V)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Pompa Sirkulasi</span>
            <span className="font-bold text-amber-400">0.75 kW (Lift 25m)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Debit Air Nominal</span>
            <span className="font-bold text-sky-400">2.6 m³/h (43.3 LPM)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Delta T Desain</span>
            <span className="font-bold text-purple-400">5.0 K (12°C &rarr; 7°C)</span>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS FOR BENCHMARK SECTIONS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'matrix', label: '📊 Matriks Komparasi 3-Kolom', icon: Layers },
          { id: 'ref_cycle', label: '1. Siklus Refrigerasi (P-h)', icon: Activity },
          { id: 'evaporator', label: '2. Evaporator Air Dingin', icon: Droplet },
          { id: 'condenser', label: '3. Kondensor Water-Cooled', icon: Flame },
          { id: 'dct', label: '4. Dry Cooling Tower', icon: Wind },
          { id: 'ahu', label: '5. Matched AHU', icon: Gauge },
          { id: 'diagnosis', label: '⚠️ Diagnostik & Solusi (Page 5)', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeDatasetTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDatasetTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT */}
      {/* 3A: MATRIKS KOMPARASI 3-KOLOM (IDEAL vs R410A vs R32) */}
      {activeDatasetTab === 'matrix' && (
        <div className="space-y-5">
          {/* Quick Verdict Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/50 shadow-xl">
              <div className="flex items-center gap-2 font-black text-sm text-emerald-400 uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SIKLUS REFRIGERASI: STATUS BAGUS</span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Kinerja kompresi freon bekerja normal dan efisien dengan <strong>COP 4.40 (R410A)</strong> dan <strong>3.78 (R32)</strong>. Kapasitas termodinamika siklus mencapai <strong>19.20 kW</strong> dan <strong>15.96 kW</strong>, melampaui rating nominal 15 kW.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/60 border-2 border-rose-500/50 shadow-xl">
              <div className="flex items-center gap-2 font-black text-sm text-rose-400 uppercase">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>SISI AIR EVAPORATOR: STATUS JELEK / DISKREPANSI TINGGI</span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Penyerapan kalor air pendingin hanya mencapai <strong>4.3 kW (28.7% pada R410A)</strong> dan <strong>7.5 kW (50.0% pada R32)</strong>. Penyebab utama: beda suhu $\Delta T$ air sangat sempit (1.7 - 3.1 K vs 5.0 K desain) dan debit rotameter menyimpang.
              </p>
            </div>
          </div>

          {/* Master 5-Zone Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Tabel Rangkuman Komparasi 5 Zona Penukar Kalor Trainer CK-5W</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Data PDF: RCO-WCT-2A</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 font-bold">Zona Pengukuran</th>
                    <th className="p-3.5 font-bold">Parameter Kunci</th>
                    <th className="p-3.5 font-bold text-purple-300">Desain Ideal (15 kW)</th>
                    <th className="p-3.5 font-bold text-sky-300">Aktual R410A</th>
                    <th className="p-3.5 font-bold text-emerald-300">Aktual R32</th>
                    <th className="p-3.5 font-bold">Evaluasi Kinerja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {/* Row 1: Kompresor */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-white font-sans">1. Siklus Kompresor (P-h)</td>
                    <td className="p-3.5 text-slate-300 font-sans">Kapasitas Qe &amp; COP</td>
                    <td className="p-3.5 text-purple-300 font-bold">15.0 kW (COP 4.00)</td>
                    <td className="p-3.5 text-sky-400 font-bold">19.20 kW (COP 4.40)</td>
                    <td className="p-3.5 text-emerald-400 font-bold">15.96 kW (COP 3.78)</td>
                    <td className="p-3.5 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        BAGUS (Siklus Normal)
                      </span>
                    </td>
                  </tr>

                  {/* Row 2: Evaporator Air */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-white font-sans">2. Evaporator (Sisi Air)</td>
                    <td className="p-3.5 text-slate-300 font-sans">Q_chw &amp; Delta T Air</td>
                    <td className="p-3.5 text-purple-300 font-bold">15.0 kW (&Delta;T 5.0 K)</td>
                    <td className="p-3.5 text-rose-400 font-bold">4.3 kW (&Delta;T 1.7 K)</td>
                    <td className="p-3.5 text-amber-400 font-bold">7.5 kW (&Delta;T 3.1 K)</td>
                    <td className="p-3.5 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        JELEK (Hanya 28.7% - 50%)
                      </span>
                    </td>
                  </tr>

                  {/* Row 3: Kondensor Air */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-white font-sans">3. Kondenser (Sisi Air)</td>
                    <td className="p-3.5 text-slate-300 font-sans">Q_cw &amp; Debit Air</td>
                    <td className="p-3.5 text-purple-300 font-bold">20.9 kW (60.0 LPM)</td>
                    <td className="p-3.5 text-rose-400 font-bold">8.4 kW (13.0 LPM)</td>
                    <td className="p-3.5 text-amber-400 font-bold">9.6 kW (49.2 LPM)</td>
                    <td className="p-3.5 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        JELEK (Debit/Delta T Rendah)
                      </span>
                    </td>
                  </tr>

                  {/* Row 4: DCT */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-white font-sans">4. Dry Cooling Tower</td>
                    <td className="p-3.5 text-slate-300 font-sans">Q_dct &amp; Kecepatan Udara</td>
                    <td className="p-3.5 text-purple-300 font-bold">20.4 kW (10.0 m/s)</td>
                    <td className="p-3.5 text-sky-400 font-bold">14.2 kW (8.5 m/s)</td>
                    <td className="p-3.5 text-emerald-400 font-bold">16.0 kW (10.1 m/s)</td>
                    <td className="p-3.5 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        BAGUS (69.6% - 78.4%)
                      </span>
                    </td>
                  </tr>

                  {/* Row 5: AHU */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-white font-sans">5. Matched AHU</td>
                    <td className="p-3.5 text-slate-300 font-sans">Q_ahu &amp; Suhu Suplai</td>
                    <td className="p-3.5 text-purple-300 font-bold">15.0 kW (17.65°C)</td>
                    <td className="p-3.5 text-sky-400 font-bold">10.3 kW (23.5°C)</td>
                    <td className="p-3.5 text-rose-400 font-bold">6.2 kW (24.7°C)</td>
                    <td className="p-3.5 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        CUKUP (Udara Belum Dingin)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3B: DETAIL PER SECTION TABLES */}
      {activeDatasetTab === 'ref_cycle' && (
        <DetailSectionTable
          title="1. Rincian Siklus Termodinamika Kompresor (Diagram P-h)"
          items={data.refrigerationCycle}
          verdict="BAGUS (NORMAL & EFISIEN)"
          verdictType="good"
          description="Siklus refrigerasi diukur menggunakan manometer LP/HP dan probe temperatur pipa hisap/buang. Kinerja kompresi freon bekerja sangat baik dengan COP 3.78 - 4.40."
        />
      )}

      {activeDatasetTab === 'evaporator' && (
        <DetailSectionTable
          title="2. Rincian Penukar Kalor Evaporator Water Chiller (Sisi Air Dingin)"
          items={data.waterChillerEvaporator}
          verdict="JELEK (DISKREPANSI TINGGI: HANYA 28.7% - 50% DARI IDEAL)"
          verdictType="bad"
          description="Kapasitas aktual air dingin sangat rendah karena perbedaan temperatur (Delta T) hanya terbaca 1.7 K (R410A) dan 3.1 K (R32), jauh di bawah target 5.0 K."
        />
      )}

      {activeDatasetTab === 'condenser' && (
        <DetailSectionTable
          title="3. Rincian Kondensor Water-Cooled (Sisi Air Panas)"
          items={data.waterCooledCondenser}
          verdict="JELEK (PELEPASAN KALOR AIR RENDAH 8.4 - 9.6 kW DARI 20.9 kW)"
          verdictType="bad"
          description="Pada pengujian R410A terjadi pembatasan aliran air kondenser (hanya 13 LPM vs desain 60 LPM), sedangkan pada R32 debit naik ke 49.2 LPM namun Delta T hanya 2.8 K."
        />
      )}

      {activeDatasetTab === 'dct' && (
        <DetailSectionTable
          title="4. Rincian Dry Cooling Tower (Sisi Udara Menara Pendingin)"
          items={data.dryCoolingTower}
          verdict="BAGUS (PELEPASAN KALOR UDARA 14.2 - 16.0 kW)"
          verdictType="good"
          description="Dry Cooling Tower menggunakan koil bersirip dengan kipas aksial. Pelepasan kalor ke udara sekitar berlangsung lancar dengan kecepatan udara 8.5 - 10.1 m/s."
        />
      )}

      {activeDatasetTab === 'ahu' && (
        <DetailSectionTable
          title="5. Rincian Matched AHU Air Handling Unit (Sisi Udara Ruangan)"
          items={data.matchedAhu}
          verdict="CUKUP / KURANG DINGIN (6.2 - 10.3 kW vs IDEAL 15.0 kW)"
          verdictType="warning"
          description="Udara suplai keluar AHU hanya mencapai 23.5°C - 24.7°C (target ideal 17.65°C) akibat pasokan air dingin dari chiller suhunya belum cukup rendah (11°C - 14°C)."
        />
      )}

      {/* 3C: DIAGNOSIS & ACTIONABLE SOLUTIONS (PAGE 5 FROM PDF) */}
      {activeDatasetTab === 'diagnosis' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/70 border-2 border-rose-500/60 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-rose-500 text-slate-950 font-black flex items-center justify-center text-sm">
                !
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-rose-300">
                  ANALISIS DISKREPANSI HASIL PENGUJIAN (KORELASI HALAMAN 5 PDF)
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Pertanyaan Pokok: Mengapa Siklus Kompresor BAGUS (16-19 kW, COP 4.40) tapi Kapasitas Air JELEK (hanya 4.3 - 7.5 kW)?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-200 mt-4 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              {data.diagnosisSummary.coreIssue}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            {/* Root Causes */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="font-bold text-amber-400 uppercase flex items-center gap-2 text-[11px]">
                <TrendingDown className="w-4 h-4 text-amber-400" />
                <span>Penyebab Utama Terjadinya Diskrepansi (Root Causes):</span>
              </div>
              <ul className="space-y-2.5 text-slate-300">
                {data.diagnosisSummary.rootCauses.map((cause, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-amber-400 font-black shrink-0">{idx + 1}.</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical Solutions */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="font-bold text-emerald-400 uppercase flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>5 Solusi Kalibrasi &amp; Optimalisasi Alat Uji (Action Plan):</span>
              </div>
              <ol className="space-y-2.5 text-slate-200">
                {data.diagnosisSummary.technicalSolutions.map((sol, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/20">
                    <span className="text-emerald-400 font-black shrink-0">{idx + 1}.</span>
                    <span>{sol}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for structured 3-way table
interface DetailSectionTableProps {
  title: string;
  items: Array<{
    param: string;
    ideal: string | number;
    r410a: string | number;
    r32: string | number;
    notes: string;
  }>;
  verdict: string;
  verdictType: 'good' | 'bad' | 'warning';
  description: string;
}

const DetailSectionTable: React.FC<DetailSectionTableProps> = ({
  title,
  items,
  verdict,
  verdictType,
  description,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-0">
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm text-white">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase self-start sm:self-auto border ${
            verdictType === 'good'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : verdictType === 'bad'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}
        >
          {verdict}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3.5 font-bold">Parameter</th>
              <th className="p-3.5 font-bold text-purple-300">Desain Ideal (15 kW)</th>
              <th className="p-3.5 font-bold text-sky-300">Aktual R410A</th>
              <th className="p-3.5 font-bold text-emerald-300">Aktual R32</th>
              <th className="p-3.5 font-bold">Catatan Teknis / Diagnosis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {items.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-white font-sans">{row.param}</td>
                <td className="p-3.5 text-purple-300 font-bold">{row.ideal}</td>
                <td className="p-3.5 text-sky-400 font-bold">{row.r410a}</td>
                <td className="p-3.5 text-emerald-400 font-bold">{row.r32}</td>
                <td className="p-3.5 text-slate-300 font-sans">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
