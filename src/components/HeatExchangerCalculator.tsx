import React, { useState, useEffect, useMemo } from 'react';
import { CompanyBranding } from '../types/branding';
import {
  HeatExchangerInputs,
  HeatExchangerReportMeta,
  FlowConfiguration,
  HeatExchangerType,
  ExchangerCalculationMode,
  CapacityUnit,
} from '../types/heatExchanger';
import {
  calculateHeatExchangerPerformance,
  FLUID_PRESETS,
  TYPICAL_U_PRESETS,
} from '../utils/heatExchangerCalc';
import { HeatExchangerChart } from './HeatExchangerChart';
import { HeatExchangerAnimation } from './HeatExchangerAnimation';
import { HeatExchangerReportModal } from './HeatExchangerReportModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { buildWhatsAppReportMessage } from '../utils/whatsappShare';
import { AppLanguage } from '../utils/i18n';

interface HeatExchangerCalculatorProps {
  branding?: CompanyBranding;
  language?: AppLanguage;
}

const STORAGE_KEY_INPUTS = 'heat_exchanger_inputs_v1';
const STORAGE_KEY_META = 'heat_exchanger_report_meta_v1';

export const HeatExchangerCalculator: React.FC<HeatExchangerCalculatorProps> = ({
  branding,
  language = 'id',
}) => {
  // Main Heat Exchanger Inputs State
  const [inputs, setInputs] = useState<HeatExchangerInputs>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INPUTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved inputs', e);
      }
    }
    return {
      fluid1Name: 'Air Panas (Hot Water)',
      t1In: 65,
      t1Out: 40,
      fluid1PresetId: 'hot_water',

      fluid2Name: 'Air Dingin (Cold Water)',
      t2In: 20,
      t2Out: 35,
      fluid2PresetId: 'water',

      capacity: 50,
      capacityUnit: 'kW' as CapacityUnit,

      flowConfig: 'counter' as FlowConfiguration,
      exchangerType: 'shell_tube' as HeatExchangerType,
      calcMode: 'solve_area' as ExchangerCalculationMode,

      overallU: 1800, // W/(m²·K)
      area: 2.5, // m²
      exchangerLengthMeters: 2.5,
    };
  });

  // Report Administrative Metadata State
  const [reportMeta, setReportMeta] = useState<HeatExchangerReportMeta>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_META);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved report meta', e);
      }
    }
    return {
      productName: 'Trainer Penukar Kalor Laboratorium (Heat Exchanger Bench)',
      modelUnit: 'LABTECH-HX-801',
      workOrderNumber: 'WL-13095-01',
      projectName: 'Uji Kinerja Termal & Verifikasi LMTD Heat Exchanger',
      reportDate: new Date().toISOString().split('T')[0],
      testedBy: 'Eng. Fajar Ramadhan, S.T.',
      verifiedBy: 'Ir. Bambang Tri, M.T., IPM',
      approvedBy: 'Dr. Ir. Hendra S., S.T., M.Eng.',
    };
  });

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);
  const [activeViewTab, setActiveViewTab] = useState<'both' | 'chart' | 'animation'>('both');

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INPUTS, JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify(reportMeta));
  }, [reportMeta]);

  // Compute thermal performance results
  const results = useMemo(() => {
    return calculateHeatExchangerPerformance(inputs);
  }, [inputs]);

  const waReportMessage = useMemo(() => {
    return buildWhatsAppReportMessage({
      title: 'Laporan Ringkasan Performa Heat Exchanger',
      productName: reportMeta.productName || 'Heat Exchanger Test Unit',
      modelUnit: reportMeta.modelUnit || 'HX-01',
      workOrderNumber: reportMeta.workOrderNumber,
      projectName: reportMeta.projectName,
      date: reportMeta.reportDate || new Date().toISOString().split('T')[0],
      companyName: branding?.companyName,
      sections: [
        {
          heading: 'Kondisi Operasional Fluida',
          items: [
            { label: 'Konfigurasi Aliran', value: inputs.flowConfig.toUpperCase() },
            { label: 'Fluida Panas (Th,in -> Th,out)', value: `${results.tHotIn}°C -> ${results.tHotOut}°C (${results.isFluid1Hot ? inputs.fluid1Name : inputs.fluid2Name})` },
            { label: 'Fluida Dingin (Tc,in -> Tc,out)', value: `${results.tColdIn}°C -> ${results.tColdOut}°C (${!results.isFluid1Hot ? inputs.fluid1Name : inputs.fluid2Name})` },
            { label: 'Kapasitas Termal (Q)', value: `${results.capacityKw.toFixed(2)} kW (${results.capacityTR.toFixed(2)} TR)` },
          ],
        },
        {
          heading: 'Hasil Perhitungan LMTD & Luas Area',
          items: [
            { label: 'LMTD Efektif (ΔTeff)', value: `${results.effectiveDeltaT.toFixed(2)} °C (F = ${results.correctionFactorF.toFixed(3)})` },
            { label: 'Koefisien U', value: `${results.overallU.toFixed(1)} W/(m²·K)` },
            { label: 'Luas Permukaan (A)', value: `${results.areaM2.toFixed(3)} m² (${results.areaFt2.toFixed(2)} ft²)` },
            { label: 'Efektivitas (ε)', value: `${(results.effectiveness * 100).toFixed(1)}% (NTU = ${results.ntu.toFixed(2)})` },
            { label: 'Pinch Point ΔT', value: `${results.pinchPointDeltaT.toFixed(1)} K` },
          ],
        },
      ],
      directNotes: 'Dihitung secara otomatis berdasarkan standar perpindahan kalor industri.',
    });
  }, [inputs, results, reportMeta, branding]);

  // Handlers for fluid preset selection
  const handleSelectFluid1Preset = (presetId: string) => {
    const preset = FLUID_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setInputs((prev) => ({
        ...prev,
        fluid1PresetId: preset.id,
        fluid1Name: preset.name,
      }));
    }
  };

  const handleSelectFluid2Preset = (presetId: string) => {
    const preset = FLUID_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setInputs((prev) => ({
        ...prev,
        fluid2PresetId: preset.id,
        fluid2Name: preset.name,
      }));
    }
  };

  const handleApplyUPreset = (uVal: number) => {
    setInputs((prev) => ({
      ...prev,
      overallU: uVal,
    }));
  };

  // Quick Preset Engineering Scenarios
  const handleLoadScenario = (scenarioKey: 'water_water' | 'oil_cooler' | 'steam_condenser' | 'multipass_st' | 'cross_radiator') => {
    switch (scenarioKey) {
      case 'water_water':
        setInputs({
          fluid1Name: 'Air Panas Proses (Hot Water 70°C)',
          t1In: 70,
          t1Out: 45,
          fluid1PresetId: 'hot_water',
          fluid2Name: 'Air Pendingin Menara (Cooling Water 28°C)',
          t2In: 28,
          t2Out: 38,
          fluid2PresetId: 'water',
          capacity: 75,
          capacityUnit: 'kW',
          flowConfig: 'counter',
          exchangerType: 'plate_frame',
          calcMode: 'solve_area',
          overallU: 2200,
          area: 1.5,
          exchangerLengthMeters: 1.8,
        });
        break;

      case 'oil_cooler':
        setInputs({
          fluid1Name: 'Oli Pelumas Mesin (Engine Lube Oil 90°C)',
          t1In: 90,
          t1Out: 65,
          fluid1PresetId: 'engine_oil',
          fluid2Name: 'Air Pendingin (Cooling Water 25°C)',
          t2In: 25,
          t2Out: 35,
          fluid2PresetId: 'water',
          capacity: 40,
          capacityUnit: 'kW',
          flowConfig: 'counter',
          exchangerType: 'shell_tube',
          calcMode: 'solve_area',
          overallU: 280,
          area: 3.2,
          exchangerLengthMeters: 2.2,
        });
        break;

      case 'multipass_st':
        setInputs({
          fluid1Name: 'Produk Minyak Hangat Sisi Shell',
          t1In: 85,
          t1Out: 55,
          fluid1PresetId: 'engine_oil',
          fluid2Name: 'Air Pendingin Sisi U-Tube (2-Pass)',
          t2In: 22,
          t2Out: 42,
          fluid2PresetId: 'water',
          capacity: 60,
          capacityUnit: 'kW',
          flowConfig: 'multipass',
          exchangerType: 'shell_tube',
          calcMode: 'solve_area',
          overallU: 450,
          area: 4.8,
          exchangerLengthMeters: 3.0,
        });
        break;

      case 'cross_radiator':
        setInputs({
          fluid1Name: 'Air Panas Radiator (Hot Water)',
          t1In: 85,
          t1Out: 60,
          fluid1PresetId: 'hot_water',
          fluid2Name: 'Udara Sekitar (Ambient Air 30°C)',
          t2In: 30,
          t2Out: 48,
          fluid2PresetId: 'air',
          capacity: 35,
          capacityUnit: 'kW',
          flowConfig: 'cross',
          exchangerType: 'cross_finned',
          calcMode: 'solve_area',
          overallU: 65,
          area: 18.5,
          exchangerLengthMeters: 1.2,
        });
        break;

      case 'steam_condenser':
        setInputs({
          fluid1Name: 'Uap Jenuh Kondensasi (Steam 100°C)',
          t1In: 100,
          t1Out: 98,
          fluid1PresetId: 'steam_condensing',
          fluid2Name: 'Air Pendingin Chiller / Raw Water',
          t2In: 25,
          t2Out: 45,
          fluid2PresetId: 'water',
          capacity: 120,
          capacityUnit: 'kW',
          flowConfig: 'counter',
          exchangerType: 'shell_tube',
          calcMode: 'solve_area',
          overallU: 2600,
          area: 1.2,
          exchangerLengthMeters: 2.0,
        });
        break;
    }
  };

  const flowConfigs: { id: FlowConfiguration; label: string; icon: string; desc: string }[] = [
    {
      id: 'counter',
      label: 'Aliran Berlawanan (Counter Flow)',
      icon: '⇄',
      desc: 'Efisiensi termal tertinggi, LMTD maksimal, memungkinkan Tc,out > Th,out',
    },
    {
      id: 'parallel',
      label: 'Aliran Sejajar (Parallel Flow)',
      icon: '⇉',
      desc: 'Aliran searah (co-current), gradien suhu seragam di hilir, tidak ada thermal cross',
    },
    {
      id: 'cross',
      label: 'Aliran Silang (Cross Flow)',
      icon: '⤨',
      desc: 'Aliran bersilangan 90° (unmixed/unmixed), umum pada radiator finned-tube & AHU coil',
    },
    {
      id: 'multipass',
      label: 'Multi-Pass (Shell & Tube 1-2 Pass)',
      icon: '⮂',
      desc: 'Shell 1-pass zig-zag dengan tube bundle 2-pass (U-bend), faktor koreksi F Bowman',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Card with Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-linear-to-r from-slate-900 via-slate-900 to-slate-950 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                THERMAL HEAT EXCHANGER ENGINE
              </span>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                • Standar TEMA / ASME / Incropera &amp; DeWitt
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
              Kalkulator Kinerja &amp; Perancangan Heat Exchanger
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-sans">
              Hitung otomatis <strong>LMTD</strong>, <strong>Koefisien U</strong>, <strong>Luas Permukaan A</strong>, dan <strong>Efektivitas (ε - NTU)</strong> dengan visualisasi diagram <em>T vs Distance</em> serta simulasi fisik aliran termal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* WhatsApp Share Quick Button */}
            <button
              type="button"
              onClick={() => setIsWaModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
              title="Share laporan ke WhatsApp"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Share ke WA</span>
            </button>

            {/* View Official Report Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>📄 Buka Laporan Resmi (PDF)</span>
            </button>
          </div>
        </div>

        {/* Quick Scenario Preset Chips */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <span>⚡ Contoh Kasus:</span>
          </span>
          <button
            onClick={() => handleLoadScenario('water_water')}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition cursor-pointer"
          >
            Air - Air (Counter Flow 75 kW)
          </button>
          <button
            onClick={() => handleLoadScenario('oil_cooler')}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/50 transition cursor-pointer"
          >
            Pendingin Oli Mesin (40 kW)
          </button>
          <button
            onClick={() => handleLoadScenario('multipass_st')}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-purple-300 border border-slate-700 hover:border-purple-500/50 transition cursor-pointer"
          >
            Shell &amp; Tube 1-2 Pass (60 kW)
          </button>
          <button
            onClick={() => handleLoadScenario('cross_radiator')}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer"
          >
            Radiator / AHU Silang (35 kW)
          </button>
          <button
            onClick={() => handleLoadScenario('steam_condenser')}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-sky-300 border border-slate-700 hover:border-sky-500/50 transition cursor-pointer"
          >
            Kondensor Steam (120 kW)
          </button>
        </div>
      </div>

      {/* 2. Flow Configuration Selector Cards */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          PILIH KONFIGURASI ALIRAN TERMAL (FLOW ARRANGEMENT)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {flowConfigs.map((cfg) => {
            const isSelected = inputs.flowConfig === cfg.id;
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => setInputs((prev) => ({ ...prev, flowConfig: cfg.id }))}
                className={`p-3.5 rounded-xl text-left font-mono transition-all border flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-linear-to-b from-cyan-950/60 to-slate-900 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-cyan-400">{cfg.icon}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isSelected ? 'Aktif' : 'Pilih'}
                    </span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-white mb-1">{cfg.label}</div>
                  <div className="text-[11px] text-slate-400 leading-snug">{cfg.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Inputs & Solved Metric Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Operating Inputs (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 font-mono space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>⚙️</span>
                <span>Data Masukan Operasional</span>
              </span>
              <span className="text-[10px] text-slate-400">Fluida 1 &amp; Fluida 2</span>
            </div>

            {/* FLUIDA 1 */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                  <span>🔴</span> Fluida 1 ({results.isFluid1Hot ? 'Fluida Panas' : 'Fluida Dingin'})
                </span>
                <select
                  value={inputs.fluid1PresetId || 'hot_water'}
                  onChange={(e) => handleSelectFluid1Preset(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-1 outline-hidden"
                >
                  {FLUID_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    T₁ Masuk (Inlet):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={inputs.t1In}
                      onChange={(e) => setInputs((prev) => ({ ...prev, t1In: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-red-400 rounded px-2.5 py-1.5 text-xs text-white font-bold outline-hidden pr-8"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400">°C</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    T₁ Keluar (Outlet):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={inputs.t1Out}
                      onChange={(e) => setInputs((prev) => ({ ...prev, t1Out: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-red-400 rounded px-2.5 py-1.5 text-xs text-white font-bold outline-hidden pr-8"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400">°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FLUIDA 2 */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                  <span>🔵</span> Fluida 2 ({!results.isFluid1Hot ? 'Fluida Panas' : 'Fluida Dingin'})
                </span>
                <select
                  value={inputs.fluid2PresetId || 'water'}
                  onChange={(e) => handleSelectFluid2Preset(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-1 outline-hidden"
                >
                  {FLUID_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    T₂ Masuk (Inlet):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={inputs.t2In}
                      onChange={(e) => setInputs((prev) => ({ ...prev, t2In: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-2.5 py-1.5 text-xs text-white font-bold outline-hidden pr-8"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400">°C</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    T₂ Keluar (Outlet):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={inputs.t2Out}
                      onChange={(e) => setInputs((prev) => ({ ...prev, t2Out: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-2.5 py-1.5 text-xs text-white font-bold outline-hidden pr-8"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400">°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CAPACITY Q */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-400">
                  Kapasitas Termal (Q / Capacity):
                </label>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px]">
                  {(['kW', 'W', 'TR', 'BTU/h'] as CapacityUnit[]).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, capacityUnit: unit }))}
                      className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                        inputs.capacityUnit === unit ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0.1"
                  value={inputs.capacity}
                  onChange={(e) => setInputs((prev) => ({ ...prev, capacity: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded px-3 py-2 text-sm text-white font-bold outline-hidden pr-16"
                />
                <span className="absolute right-3 top-2 text-xs text-amber-400 font-bold">
                  {inputs.capacityUnit}
                </span>
              </div>
            </div>

            {/* CALCULATION MODE & U / AREA SOLVER */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400">
                  Target Perhitungan:
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setInputs((prev) => ({ ...prev, calcMode: 'solve_area' }))}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer transition ${
                      inputs.calcMode === 'solve_area' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cari Luas Area (A)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputs((prev) => ({ ...prev, calcMode: 'solve_u' }))}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer transition ${
                      inputs.calcMode === 'solve_u' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cari Koefisien (U)
                  </button>
                </div>
              </div>

              {inputs.calcMode === 'solve_area' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-300">
                      Koefisien U Masukan:
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">W/(m²·K)</span>
                  </div>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    value={inputs.overallU}
                    onChange={(e) => setInputs((prev) => ({ ...prev, overallU: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-purple-400 rounded px-2.5 py-1.5 text-xs text-white font-bold outline-hidden"
                  />

                  {/* Typical U Preset Chips */}
                  <div className="mt-2 pt-2 border-t border-slate-800/80">
                    <div className="text-[10px] text-slate-400 mb-1">Preset Nilai U Tipikal:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {TYPICAL_U_PRESETS.slice(0, 4).map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyUPreset(preset.typicalU)}
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-purple-950/60 text-[10px] text-slate-300 border border-slate-800 hover:border-purple-500/50 transition cursor-pointer"
                          title={`${preset.name} (${preset.range})`}
                        >
                          {preset.typicalU} W/m²K
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    Luas Permukaan (A) Masukan:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.01"
                      value={inputs.area}
                      onChange={(e) => setInputs((prev) => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-purple-400 rounded px-2.5 py-1.5 text-xs text-white font-bold outline-hidden pr-10"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400">m²</span>
                  </div>
                </div>
              )}

              {/* Exchanger Length */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Panjang Fisik Penukar Kalor (L):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    value={inputs.exchangerLengthMeters || 2.0}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        exchangerLengthMeters: parseFloat(e.target.value) || 2.0,
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 focus:border-slate-500 rounded px-2.5 py-1.5 text-xs text-white outline-hidden pr-8"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-slate-400">meter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Results & Summary Cards (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Thermodynamic Alert Banners if any */}
          {results.warnings.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-3 text-xs font-mono text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <span>⚠️</span> Catatan Verifikasi Termodinamika:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-300">
                {results.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Output Metrics (4 Primary Big Metric Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* LMTD Nominal */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 font-mono shadow-md">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">LMTD Nominal</div>
              <div className="text-xl sm:text-2xl font-black text-cyan-400 mt-0.5">
                {results.lmtdNominal.toFixed(2)}
                <span className="text-xs text-slate-500 font-normal ml-1">°C</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                ΔT₁ = {results.deltaT1.toFixed(1)}K, ΔT₂ = {results.deltaT2.toFixed(1)}K
              </div>
            </div>

            {/* LMTD Efektif */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 font-mono shadow-md">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">LMTD Efektif (ΔTeff)</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                {results.effectiveDeltaT.toFixed(2)}
                <span className="text-xs text-slate-500 font-normal ml-1">°C</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                F = <strong className="text-emerald-300">{results.correctionFactorF.toFixed(3)}</strong>
              </div>
            </div>

            {/* Overall U */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 font-mono shadow-md">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Koefisien U</div>
              <div className="text-xl sm:text-2xl font-black text-purple-400 mt-0.5">
                {results.overallU.toFixed(0)}
                <span className="text-xs text-slate-500 font-normal ml-1">W/m²K</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {(results.overallU * 0.1761).toFixed(1)} BTU/(hr·ft²·°F)
              </div>
            </div>

            {/* Heat Transfer Area A */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 font-mono shadow-md">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Luas Area (A)</div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
                {results.areaM2.toFixed(3)}
                <span className="text-xs text-slate-500 font-normal ml-1">m²</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {results.areaFt2.toFixed(2)} ft²
              </div>
            </div>
          </div>

          {/* Secondary Thermodynamic Breakdown Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 font-mono text-xs shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-300 font-bold mb-2">
              <span>Metrik Efektivitas &amp; Aliran Massa</span>
              <span className="text-[11px] text-cyan-400 font-normal">Metode ε - NTU</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block">Efektivitas (ε):</span>
                <span className="text-white font-bold text-sm">
                  {(results.effectiveness * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 block">Q / Q_max</span>
              </div>

              <div>
                <span className="text-slate-400 block">Number of Transfer Units:</span>
                <span className="text-cyan-300 font-bold text-sm">
                  NTU = {results.ntu.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block">UA / C_min</span>
              </div>

              <div>
                <span className="text-slate-400 block">Rasio Kapasitas (Cr):</span>
                <span className="text-slate-200 font-bold text-sm">
                  {results.capacityRatioR.toFixed(3)}
                </span>
                <span className="text-[10px] text-slate-500 block">C_min / C_max</span>
              </div>

              <div>
                <span className="text-slate-400 block">Laju Alir Massa Panas:</span>
                <span className="text-red-300 font-bold">
                  {results.massFlowHotKgS.toFixed(3)} kg/s
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ({(results.massFlowHotKgS * 3600).toFixed(1)} kg/jam)
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Laju Alir Massa Dingin:</span>
                <span className="text-cyan-300 font-bold">
                  {results.massFlowColdKgS.toFixed(3)} kg/s
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ({(results.massFlowColdKgS * 3600).toFixed(1)} kg/jam)
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Pinch Point Terdekat:</span>
                <span className="text-amber-300 font-bold">
                  {results.pinchPointDeltaT.toFixed(1)} K
                </span>
                <span className="text-[10px] text-slate-500 block truncate" title={results.pinchPointLocation}>
                  {results.pinchPointLocation}
                </span>
              </div>
            </div>
          </div>

          {/* View Tab Switcher for Chart & Animation */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              VISUALISASI DISTRIBUSI &amp; SIMULASI ALIRAN
            </span>

            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveViewTab('both')}
                className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                  activeViewTab === 'both' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Keduanya (Both)
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab('chart')}
                className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                  activeViewTab === 'chart' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Diagram T vs x/L
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab('animation')}
                className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                  activeViewTab === 'animation' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Animasi Aliran
              </button>
            </div>
          </div>

          {/* Visual Components Display */}
          {(activeViewTab === 'both' || activeViewTab === 'chart') && (
            <HeatExchangerChart
              results={results}
              flowConfig={inputs.flowConfig}
              fluid1Name={inputs.fluid1Name}
              fluid2Name={inputs.fluid2Name}
              totalLengthMeters={inputs.exchangerLengthMeters || 2.0}
              height={340}
            />
          )}

          {(activeViewTab === 'both' || activeViewTab === 'animation') && (
            <HeatExchangerAnimation
              flowConfig={inputs.flowConfig}
              results={results}
              fluid1Name={inputs.fluid1Name}
              fluid2Name={inputs.fluid2Name}
            />
          )}
        </div>
      </div>

      {/* 4. Formal Report Modal */}
      <HeatExchangerReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        branding={branding}
        reportMeta={reportMeta}
        onUpdateReportMeta={setReportMeta}
        inputs={inputs}
        results={results}
        language={language}
      />

      {/* WhatsApp Share Quick Modal */}
      <WhatsAppShareModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        reportTitle={`Performa Heat Exchanger (${inputs.capacity} ${inputs.capacityUnit})`}
        messageText={waReportMessage}
      />
    </div>
  );
};
