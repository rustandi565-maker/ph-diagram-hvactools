import React from 'react';
import { CoolingTowerTestInputs, CoolingTowerTestResults } from '../types/plantTesting';
import { AppLanguage, TRANSLATIONS } from '../utils/i18n';

interface CoolingTowerTestingViewProps {
  inputs: CoolingTowerTestInputs;
  onChangeInput: <K extends keyof CoolingTowerTestInputs>(key: K, value: CoolingTowerTestInputs[K]) => void;
  results: CoolingTowerTestResults;
  language?: AppLanguage;
}

export const CoolingTowerTestingView: React.FC<CoolingTowerTestingViewProps> = ({
  inputs,
  onChangeInput,
  results,
  language = 'id',
}) => {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.id;

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">Cooling Range (ΔT)</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.rangeC.toFixed(2)} <span className="text-xs font-normal text-slate-400">°C</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            HWT ({inputs.hotWaterInletTempC}°C) - CWT ({inputs.coldWaterOutletTempC}°C)
          </div>
        </div>

        <div className={`rounded-xl p-3.5 border ${
          results.towerHealthStatus === 'excellent'
            ? 'bg-emerald-950/40 border-emerald-500/50'
            : results.towerHealthStatus === 'normal'
            ? 'bg-cyan-950/40 border-cyan-500/50'
            : results.towerHealthStatus === 'caution'
            ? 'bg-amber-950/40 border-amber-500/50'
            : 'bg-rose-950/40 border-rose-500/50'
        }`}>
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-300">Approach Temp</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.approachC.toFixed(2)} <span className="text-xs font-normal text-slate-400">°C</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5">
            CWT - WBT ({inputs.ambientWetBulbC}°C)
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Efektivitas Menara</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.effectivenessPercent.toFixed(1)} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Range / (Range + Approach)
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Pelepasan Kalor (TR)</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.heatRejectedTR} <span className="text-xs font-normal text-slate-400">TR</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {results.heatRejectedKW} kW termal
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">Laju Penguapan Air</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.evaporationRateLpm.toFixed(1)} <span className="text-xs font-normal text-slate-400">LPM</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            ≈ {results.evaporationRateM3H.toFixed(2)} m³/jam ({results.evaporationPercentOfFlow.toFixed(2)}%)
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider">Total Air Makeup</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.totalMakeupWaterM3H.toFixed(2)} <span className="text-xs font-normal text-slate-400">m³/h</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Evap + Drift + Blowdown
          </div>
        </div>
      </div>

      {/* Main Grid: Form Controls & SVG Schematic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Test Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Identitas &amp; Desain Menara</span>
              <span className="text-[10px] text-slate-500 font-mono">CTI ATC-105</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">Tag / Nama Cooling Tower</label>
                <input
                  type="text"
                  value={inputs.towerTag}
                  onChange={(e) => onChangeInput('towerTag', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tipe Aliran Tower</label>
                <select
                  value={inputs.towerType}
                  onChange={(e) => onChangeInput('towerType', e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                >
                  <option value="induced_draft_counterflow">Induced Draft Counterflow</option>
                  <option value="induced_draft_crossflow">Induced Draft Crossflow</option>
                  <option value="forced_draft_counterflow">Forced Draft Counterflow</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Debit Desain (LPM)</label>
                <input
                  type="number"
                  step="50"
                  value={inputs.ratedFlowLpm}
                  onChange={(e) => onChangeInput('ratedFlowLpm', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
              Temperatur &amp; Debit Air Terukur
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Air Panas Masuk / HWT (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.hotWaterInletTempC}
                  onChange={(e) => onChangeInput('hotWaterInletTempC', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-rose-300 font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Air Dingin Keluar / CWT (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.coldWaterOutletTempC}
                  onChange={(e) => onChangeInput('coldWaterOutletTempC', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Debit Air Aktual (LPM)</label>
                <input
                  type="number"
                  step="50"
                  value={inputs.waterFlowLpm}
                  onChange={(e) => onChangeInput('waterFlowLpm', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-mono font-semibold focus:border-cyan-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  ≈ {((inputs.waterFlowLpm * 60) / 1000).toFixed(1)} m³/h
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Siklus Konsentrasi (CoC)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.cyclesOfConcentration}
                  onChange={(e) => onChangeInput('cyclesOfConcentration', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  Standar ideal: 4.0 - 6.0
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              Kondisi Udara Sekitar &amp; Fan Kipas
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Bola Basah Sekitar / WBT (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.ambientWetBulbC}
                  onChange={(e) => onChangeInput('ambientWetBulbC', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-300 font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  Batas teoritis pendinginan
                </span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Bola Kering / DBT (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.ambientDryBulbC}
                  onChange={(e) => onChangeInput('ambientDryBulbC', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Daya Motor Kipas (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.fanMotorKW}
                  onChange={(e) => onChangeInput('fanMotorKW', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Aliran Udara Kipas (CFM)</label>
                <input
                  type="number"
                  step="1000"
                  value={inputs.fanAirflowCfm}
                  onChange={(e) => onChangeInput('fanAirflowCfm', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Schematic & Water Balance (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Skematik Aliran Menara &amp; Profil Pendinginan
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                Approach: {results.approachC}°C | Range: {results.rangeC}°C
              </span>
            </div>

            <div className="w-full bg-slate-950 rounded-lg p-2 border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 650 360" className="w-full h-auto max-h-[360px] font-sans">
                {/* Background */}
                <rect width="650" height="360" fill="#030712" />

                {/* Induced Draft Fan Cowling (Top) */}
                <polygon points="260,70 390,70 375,30 275,30" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                <ellipse cx="325" cy="50" rx="45" ry="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                {/* Fan Blades */}
                <line x1="325" y1="50" x2="290" y2="46" stroke="#38bdf8" strokeWidth="3" />
                <line x1="325" y1="50" x2="360" y2="54" stroke="#38bdf8" strokeWidth="3" />
                <line x1="325" y1="50" x2="320" y2="38" stroke="#38bdf8" strokeWidth="3" />
                <line x1="325" y1="50" x2="330" y2="62" stroke="#38bdf8" strokeWidth="3" />
                <text x="325" y="22" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
                  EXHAUST FAN ({inputs.fanMotorKW} kW)
                </text>

                {/* Main Tower Casing */}
                <rect x="200" y="70" width="250" height="210" fill="#0f172a" stroke="#475569" strokeWidth="2" />

                {/* Drift Eliminators */}
                <rect x="210" y="80" width="230" height="20" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" />
                <text x="325" y="94" fill="#94a3b8" fontSize="9" textAnchor="middle">DRIFT ELIMINATOR</text>

                {/* Hot Water Distribution Header & Nozzles */}
                <line x1="210" y1="115" x2="440" y2="115" stroke="#ef4444" strokeWidth="5" />
                {/* Hot Water Inlet pipe */}
                <path d="M 120 115 L 210 115" stroke="#ef4444" strokeWidth="6" />
                <text x="120" y="105" fill="#ef4444" fontSize="10" fontWeight="bold">
                  HWT IN: {inputs.hotWaterInletTempC}°C
                </text>
                <text x="120" y="130" fill="#fca5a5" fontSize="9">
                  Flow: {inputs.waterFlowLpm} LPM
                </text>

                {/* Spray Nozzles */}
                {[230, 265, 300, 335, 370, 405].map((x) => (
                  <g key={x}>
                    <line x1={x} y1="115" x2={x} y2="128" stroke="#ef4444" strokeWidth="2" />
                    <polygon points={`${x-6},128 ${x+6},128 ${x},136`} fill="#f97316" />
                    {/* Spray droplet lines */}
                    <line x1={x-8} y1="140" x2={x-14} y2="155" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={x} y1="140" x2={x} y2="155" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={x+8} y1="140" x2={x+14} y2="155" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  </g>
                ))}

                {/* FILL PACK (Honeycomb Media) */}
                <rect x="210" y="160" width="230" height="75" rx="4" fill="#182234" stroke="#0284c7" strokeWidth="1.5" />
                {/* Honeycomb fill pattern lines */}
                <path d="M 220 175 L 430 175 M 220 195 L 430 195 M 220 215 L 430 215" stroke="#0369a1" strokeWidth="1" strokeDasharray="5 3" />
                <text x="325" y="195" fill="#bae6fd" fontSize="11" textAnchor="middle" fontWeight="bold">
                  FILL PACKING MEDIA
                </text>
                <text x="325" y="210" fill="#7dd3fc" fontSize="9" textAnchor="middle">
                  Efektivitas: {results.effectivenessPercent}%
                </text>

                {/* Air Intake Louvers (Sides) */}
                {/* Left Louvers */}
                <rect x="180" y="235" width="20" height="40" fill="#334155" />
                <line x1="175" y1="245" x2="195" y2="238" stroke="#94a3b8" strokeWidth="2" />
                <line x1="175" y1="255" x2="195" y2="248" stroke="#94a3b8" strokeWidth="2" />
                <line x1="175" y1="265" x2="195" y2="258" stroke="#94a3b8" strokeWidth="2" />
                {/* Airflow arrows entering */}
                <path d="M 130 255 L 175 255" stroke="#38bdf8" strokeWidth="3" markerEnd="url(#arrow)" />
                <text x="145" y="245" fill="#38bdf8" fontSize="9" textAnchor="middle">Udara Masuk</text>
                <text x="145" y="275" fill="#64748b" fontSize="8" textAnchor="middle">WBT: {inputs.ambientWetBulbC}°C</text>

                {/* Right Louvers */}
                <rect x="450" y="235" width="20" height="40" fill="#334155" />
                <line x1="455" y1="238" x2="475" y2="245" stroke="#94a3b8" strokeWidth="2" />
                <line x1="455" y1="248" x2="475" y2="255" stroke="#94a3b8" strokeWidth="2" />
                <line x1="455" y1="258" x2="475" y2="265" stroke="#94a3b8" strokeWidth="2" />
                <path d="M 520 255 L 475 255" stroke="#38bdf8" strokeWidth="3" />
                <text x="505" y="245" fill="#38bdf8" fontSize="9" textAnchor="middle">Udara Masuk</text>
                <text x="505" y="275" fill="#64748b" fontSize="8" textAnchor="middle">DBT: {inputs.ambientDryBulbC}°C</text>

                {/* Cold Water Basin / Sump (Bottom) */}
                <polygon points="190,280 460,280 440,320 210,320" fill="#0369a1" fillOpacity="0.8" stroke="#38bdf8" strokeWidth="2" />
                <text x="325" y="305" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">
                  COLD WATER BASIN ({inputs.coldWaterOutletTempC}°C)
                </text>

                {/* Cold Water Outlet Pipe to Condenser */}
                <path d="M 440 310 L 540 310" stroke="#0284c7" strokeWidth="6" />
                <text x="540" y="295" fill="#38bdf8" fontSize="10" fontWeight="bold">
                  CWT OUT: {inputs.coldWaterOutletTempC}°C
                </text>
                <text x="540" y="325" fill="#94a3b8" fontSize="9">
                  Menuju Kondenser Chiller
                </text>

                {/* Makeup Water Line into Basin */}
                <path d="M 210 310 L 140 310" stroke="#10b981" strokeWidth="4" />
                <text x="140" y="300" fill="#10b981" fontSize="9" fontWeight="bold">
                  MAKEUP WATER
                </text>
                <text x="140" y="325" fill="#6ee7b7" fontSize="8">
                  {results.totalMakeupWaterM3H.toFixed(2)} m³/jam
                </text>
              </svg>
            </div>
          </div>

          {/* Water Consumption & Balance Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Neraca Air &amp; Diagnostik CTI</span>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                results.towerHealthStatus === 'excellent'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : results.towerHealthStatus === 'normal'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {results.healthVerdict}
              </span>
            </h4>

            {results.diagnostics.length > 0 ? (
              <div className="space-y-1.5">
                {results.diagnostics.map((diag, idx) => (
                  <div key={idx} className="bg-slate-950/80 border border-amber-500/40 rounded-lg p-2.5 text-xs text-amber-200/90 flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">⚠️</span>
                    <span>{diag}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-2.5 text-xs text-emerald-200 flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Kinerja pendinginan menara sangat baik, perpindahan panas optimal, dan penghematan air terjaga pada CoC {inputs.cyclesOfConcentration}.</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-300 border-collapse">
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-1.5 text-slate-400">1. Kehilangan Penguapan (Evaporation):</td>
                    <td className="py-1.5 text-right font-mono font-bold text-sky-300">
                      {results.evaporationRateLpm.toFixed(1)} LPM ({results.evaporationRateM3H.toFixed(2)} m³/jam)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-1.5 text-slate-400">2. Kehilangan Drift (Drift Loss):</td>
                    <td className="py-1.5 text-right font-mono text-slate-300">
                      {results.driftLossLpm.toFixed(2)} LPM (~0.01% dari sirkulasi)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-1.5 text-slate-400">3. Pembuangan Berkala (Blowdown):</td>
                    <td className="py-1.5 text-right font-mono text-amber-300">
                      {results.blowdownRateLpm.toFixed(1)} LPM ({results.blowdownRateM3H.toFixed(2)} m³/jam pada CoC {inputs.cyclesOfConcentration})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-400 font-semibold">Total Pasokan Air Baru (Makeup Required):</td>
                    <td className="py-1.5 text-right font-mono font-bold text-emerald-400">
                      {results.totalMakeupWaterM3H.toFixed(2)} m³/jam ({results.totalMakeupWaterLpm.toFixed(1)} LPM)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
