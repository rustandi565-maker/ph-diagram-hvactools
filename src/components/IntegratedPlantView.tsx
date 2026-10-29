import React from 'react';
import { ChillerTestResults, CoolingTowerTestResults, IntegratedPlantResults } from '../types/plantTesting';

interface IntegratedPlantViewProps {
  chillerResults: ChillerTestResults;
  ctResults: CoolingTowerTestResults;
  integrated: IntegratedPlantResults;
  chwpKW: number;
  onChangeChwpKW: (val: number) => void;
  cwpKW: number;
  onChangeCwpKW: (val: number) => void;
  ctFanKW: number;
  onChangeCtFanKW: (val: number) => void;
  ahuKW: number;
  onChangeAhuKW: (val: number) => void;
  tariffPerKwhIDR: number;
  onChangeTariff: (val: number) => void;
  operatingHours: number;
  onChangeOperatingHours: (val: number) => void;
}

export const IntegratedPlantView: React.FC<IntegratedPlantViewProps> = ({
  chillerResults,
  integrated,
  chwpKW,
  onChangeChwpKW,
  cwpKW,
  onChangeCwpKW,
  ctFanKW,
  onChangeCtFanKW,
  ahuKW,
  onChangeAhuKW,
  tariffPerKwhIDR,
  onChangeTariff,
  operatingHours,
  onChangeOperatingHours,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 border ${
          integrated.plantRating === 'world_class'
            ? 'bg-emerald-950/40 border-emerald-500/50'
            : integrated.plantRating === 'efficient'
            ? 'bg-cyan-950/40 border-cyan-500/50'
            : integrated.plantRating === 'standard'
            ? 'bg-amber-950/40 border-amber-500/50'
            : 'bg-rose-950/40 border-rose-500/50'
        }`}>
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Total Plant kW / TR
          </div>
          <div className="text-3xl font-extrabold text-white mt-1">
            {integrated.overallPlantKWPerTR.toFixed(3)}
          </div>
          <div className="text-xs mt-1 font-bold truncate">
            {integrated.plantRating === 'world_class'
              ? '🌟 World-Class (< 0.70 kW/TR)'
              : integrated.plantRating === 'efficient'
              ? '✓ Efisien (0.70 - 0.85 kW/TR)'
              : integrated.plantRating === 'standard'
              ? '⚠️ Standar (0.85 - 1.05 kW/TR)'
              : '❌ Boros (> 1.05 kW/TR)'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Total Daya Plant Terukur
          </div>
          <div className="text-3xl font-extrabold text-white mt-1">
            {integrated.totalPlantPowerKW.toFixed(1)} <span className="text-sm font-normal text-slate-400">kW</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Melayani beban {integrated.totalChillerTR} TR
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            COP Total Central Plant
          </div>
          <div className="text-3xl font-extrabold text-white mt-1">
            {integrated.overallPlantCop.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Efisiensi termal ke listrik total
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            Estimasi Biaya Listrik / Tahun
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">
            Rp {(integrated.annualEnergyCostIDR / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-slate-400">Jt</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Pada Rp {tariffPerKwhIDR.toLocaleString('id-ID')}/kWh ({operatingHours} jam/th)
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input for Plant Equipment Auxiliaries */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            Daya Peralatan Penunjang Central Plant
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">1. Kompresor Chiller</span>
                <span className="text-slate-400 text-[11px]">Beban pendinginan: {integrated.totalChillerTR} TR</span>
              </div>
              <span className="text-base font-bold text-cyan-300 font-mono">
                {chillerResults.totalPowerInputKW} kW
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">2. Kipas Cooling Tower</span>
                  <span className="text-slate-400 text-[11px]">Fan motor tower pendingin</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={ctFanKW}
                  onChange={(e) => onChangeCtFanKW(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">3. Pompa Air Dingin (CHWP)</span>
                  <span className="text-slate-400 text-[11px]">Primary &amp; Secondary CHW Pumps</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={chwpKW}
                  onChange={(e) => onChangeChwpKW(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">4. Pompa Air Kondenser (CWP)</span>
                  <span className="text-slate-400 text-[11px]">Condenser Water Circulating Pumps</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={cwpKW}
                  onChange={(e) => onChangeCwpKW(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">5. Kipas Penghembus AHU / FCU</span>
                  <span className="text-slate-400 text-[11px]">Total supply &amp; return fans</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={ahuKW}
                  onChange={(e) => onChangeAhuKW(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div>
                <label className="text-slate-400 block mb-1">Tarif Listrik (Rp/kWh)</label>
                <input
                  type="number"
                  step="50"
                  value={tariffPerKwhIDR}
                  onChange={(e) => onChangeTariff(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Jam Operasi / Tahun</label>
                <input
                  type="number"
                  step="100"
                  value={operatingHours}
                  onChange={(e) => onChangeOperatingHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Visual Energy Distribution & Benchmark Bar */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Proporsi Konsumsi Energi Plant &amp; Benchmark Standar</span>
            <span className="text-cyan-400 font-mono text-[11px]">
              Total: {integrated.totalPlantPowerKW.toFixed(1)} kW
            </span>
          </h3>

          {/* Visual Percentage Stacked Bar */}
          <div className="space-y-2">
            <div className="h-6 w-full bg-slate-950 rounded-lg overflow-hidden flex border border-slate-700">
              <div
                style={{ width: `${(chillerResults.totalPowerInputKW / integrated.totalPlantPowerKW) * 100}%` }}
                className="bg-cyan-500 h-full flex items-center justify-center text-[10px] text-slate-950 font-bold"
                title={`Chiller: ${chillerResults.totalPowerInputKW} kW`}
              >
                Chiller {Math.round((chillerResults.totalPowerInputKW / integrated.totalPlantPowerKW) * 100)}%
              </div>
              <div
                style={{ width: `${(ctFanKW / integrated.totalPlantPowerKW) * 100}%` }}
                className="bg-sky-400 h-full flex items-center justify-center text-[10px] text-slate-950 font-bold"
                title={`CT Fan: ${ctFanKW} kW`}
              >
                CT
              </div>
              <div
                style={{ width: `${(chwpKW / integrated.totalPlantPowerKW) * 100}%` }}
                className="bg-blue-600 h-full flex items-center justify-center text-[10px] text-white font-bold"
                title={`CHWP: ${chwpKW} kW`}
              >
                CHWP
              </div>
              <div
                style={{ width: `${(cwpKW / integrated.totalPlantPowerKW) * 100}%` }}
                className="bg-indigo-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                title={`CWP: ${cwpKW} kW`}
              >
                CWP
              </div>
              <div
                style={{ width: `${(ahuKW / integrated.totalPlantPowerKW) * 100}%` }}
                className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-slate-950 font-bold"
                title={`AHU Fans: ${ahuKW} kW`}
              >
                AHU
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500 inline-block" /> Chiller ({chillerResults.totalPowerInputKW} kW)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-400 inline-block" /> CT Fan ({ctFanKW} kW)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" /> CHWP ({chwpKW} kW)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" /> CWP ({cwpKW} kW)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> AHU ({ahuKW} kW)
              </span>
            </div>
          </div>

          {/* ASHRAE 90.1 / Green Building Benchmark Comparison */}
          <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">
              Tingkat Efisiensi Plant (Standar ASHRAE 90.1 &amp; GBCI Indonesia):
            </span>

            <div className="space-y-2 text-xs">
              <div className={`p-2.5 rounded border flex items-center justify-between ${
                integrated.overallPlantKWPerTR <= 0.70
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}>
                <span>Tier 1: World-Class / Platinum Green Building (&lt; 0.70 kW/TR)</span>
                <span>Target Gold/Platinum</span>
              </div>

              <div className={`p-2.5 rounded border flex items-center justify-between ${
                integrated.overallPlantKWPerTR > 0.70 && integrated.overallPlantKWPerTR <= 0.85
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}>
                <span>Tier 2: Efisien / Standar ASHRAE 90.1 Path B (0.70 - 0.85 kW/TR)</span>
                <span>Efisiensi Tinggi</span>
              </div>

              <div className={`p-2.5 rounded border flex items-center justify-between ${
                integrated.overallPlantKWPerTR > 0.85 && integrated.overallPlantKWPerTR <= 1.05
                  ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}>
                <span>Tier 3: Standar Operasional Industri Konvensional (0.85 - 1.05 kW/TR)</span>
                <span>Cukup</span>
              </div>

              <div className={`p-2.5 rounded border flex items-center justify-between ${
                integrated.overallPlantKWPerTR > 1.05
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300 font-bold'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}>
                <span>Tier 4: Boros Energi (&gt; 1.05 kW/TR - Perlu Retrofit VFD &amp; Pembersihan)</span>
                <span>Perlu Audit Segera</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
