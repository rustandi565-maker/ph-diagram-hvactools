import React from 'react';
import { AhuTestInputs, AhuTestResults } from '../types/plantTesting';
import { AppLanguage, TRANSLATIONS } from '../utils/i18n';

interface AhuTestingViewProps {
  inputs: AhuTestInputs;
  onChangeInput: <K extends keyof AhuTestInputs>(key: K, value: AhuTestInputs[K]) => void;
  results: AhuTestResults;
  language?: AppLanguage;
}

export const AhuTestingView: React.FC<AhuTestingViewProps> = ({
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
          <div className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">Kapasitas Total Koil (TR)</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.airsideTotalCapacityTR} <span className="text-xs font-normal text-slate-400">TR</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {results.airsideTotalCapacityKW} kW (Airside)
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Sensible Heat Ratio</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.sensibleHeatRatio.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Sensible: {results.airsideSensibleCapacityKW} kW | Latent: {results.airsideLatentCapacityKW} kW
          </div>
        </div>

        <div className={`rounded-xl p-3.5 border ${
          results.sfpClassification === 'SFP-1' || results.sfpClassification === 'SFP-2'
            ? 'bg-emerald-950/40 border-emerald-500/50'
            : results.sfpClassification === 'SFP-3' || results.sfpClassification === 'SFP-4'
            ? 'bg-cyan-950/40 border-cyan-500/50'
            : 'bg-amber-950/40 border-amber-500/50'
        }`}>
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-300">Specific Fan Power (SFP)</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.specificFanPowerWPerLps.toFixed(2)} <span className="text-xs font-normal text-slate-400">W/(L/s)</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5 font-semibold">
            Klasifikasi: {results.sfpClassification}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Kapasitas Air CHW</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.watersideCapacityTR} <span className="text-xs font-normal text-slate-400">TR</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {results.watersideCapacityKW} kW (ΔT: {results.chwDeltaTC}°C)
          </div>
        </div>

        <div className={`rounded-xl p-3.5 border ${
          results.heatBalanceStatus === 'balanced'
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : results.heatBalanceStatus === 'acceptable'
            ? 'bg-slate-900/90 border-slate-700/80'
            : 'bg-rose-950/30 border-rose-500/40'
        }`}>
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Keseimbangan Termal</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.heatBalanceErrorPercent.toFixed(1)} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {results.heatBalanceStatus === 'balanced' ? '✓ Selisih udara vs air < 10%' : 'Deviasi > 10%'}
          </div>
        </div>

        <div className={`rounded-xl p-3.5 border ${
          results.filterStatus === 'clean'
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : results.filterStatus === 'acceptable'
            ? 'bg-slate-900/90 border-slate-700/80'
            : 'bg-rose-950/40 border-rose-500/50'
        }`}>
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Status Filter Udara</div>
          <div className={`text-2xl font-bold mt-1 ${
            results.filterStatus === 'clean' ? 'text-emerald-400' : results.filterStatus === 'acceptable' ? 'text-cyan-400' : 'text-rose-400'
          }`}>
            {inputs.filterPressureDropPa} <span className="text-xs font-normal text-slate-400">Pa</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {results.filterStatus === 'clean' ? 'Bersih (Optimal)' : results.filterStatus === 'acceptable' ? 'Masih Layak' : '⚠️ Kotor (Ganti Segera)'}
          </div>
        </div>
      </div>

      {/* Main Grid: Form Controls & SVG Schematic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Test Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Identitas &amp; Aliran Udara AHU</span>
              <span className="text-[10px] text-slate-500 font-mono">ASHRAE 111 / NEBB</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">Tag / Nama AHU</label>
                <input
                  type="text"
                  value={inputs.ahuTag}
                  onChange={(e) => onChangeInput('ahuTag', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tipe Motor/Kipas</label>
                <select
                  value={inputs.fanType}
                  onChange={(e) => onChangeInput('fanType', e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                >
                  <option value="direct_drive_ec_plug">Direct-Drive EC Plug Fan</option>
                  <option value="centrifugal_belt_driven">Centrifugal Belt-Driven Fan</option>
                  <option value="vane_axial">Vane Axial Fan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Debit Udara Terukur (CFM)</label>
                <input
                  type="number"
                  step="50"
                  value={inputs.measuredAirflowCfm}
                  onChange={(e) => {
                    const cfm = parseFloat(e.target.value) || 0;
                    onChangeInput('measuredAirflowCfm', cfm);
                    onChangeInput('supplyAirflowM3H', Math.round((cfm * 0.0283168 * 3600) / 60));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  ≈ {Math.round((inputs.measuredAirflowCfm * 0.0283168 * 3600) / 60)} m³/jam
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tekanan Statis Eksternal / ESP (Pa)</label>
                <input
                  type="number"
                  value={inputs.externalStaticPressurePa}
                  onChange={(e) => onChangeInput('externalStaticPressurePa', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Total Tekanan Kipas / TSP (Pa)</label>
                <input
                  type="number"
                  value={inputs.fanTotalPressurePa}
                  onChange={(e) => onChangeInput('fanTotalPressurePa', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
              Psikrometrik Udara Masuk &amp; Pasok
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Suhu Udara Masuk / On-Coil (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.enteringAirDbtC}
                  onChange={(e) => onChangeInput('enteringAirDbtC', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-rose-300 font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Kelembaban Masuk / On-Coil RH (%)</label>
                <input
                  type="number"
                  value={inputs.enteringAirRhPercent}
                  onChange={(e) => onChangeInput('enteringAirRhPercent', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Suhu Udara Pasok / Off-Coil (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.leavingAirDbtC}
                  onChange={(e) => onChangeInput('leavingAirDbtC', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Kelembaban Pasok / Off-Coil RH (%)</label>
                <input
                  type="number"
                  value={inputs.leavingAirRhPercent}
                  onChange={(e) => onChangeInput('leavingAirRhPercent', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              Koil Air Pendingin (CHW) &amp; Kipas
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">CHW Masuk Koil (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.chwInletTempC}
                  onChange={(e) => onChangeInput('chwInletTempC', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">CHW Keluar Koil (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.chwOutletTempC}
                  onChange={(e) => onChangeInput('chwOutletTempC', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Debit Air CHW Koil (LPM)</label>
                <input
                  type="number"
                  step="10"
                  value={inputs.chwFlowLpm}
                  onChange={(e) => onChangeInput('chwFlowLpm', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Daya Motor Kipas (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.fanInputKW}
                  onChange={(e) => onChangeInput('fanInputKW', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-300 font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tekanan Beda Filter (Pa)</label>
                <input
                  type="number"
                  value={inputs.filterPressureDropPa}
                  onChange={(e) => onChangeInput('filterPressureDropPa', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Filter Bersih Acuan (Pa)</label>
                <input
                  type="number"
                  value={inputs.cleanFilterDpPa}
                  onChange={(e) => onChangeInput('cleanFilterDpPa', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-400 font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Schematic & Air-Water Energy Balance (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Skematik Bagian Casing AHU &amp; Sensor Pengujian
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                {inputs.ahuTag}
              </span>
            </div>

            <div className="w-full bg-slate-950 rounded-lg p-2 border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 720 340" className="w-full h-auto max-h-[340px] font-sans">
                {/* Background */}
                <rect width="720" height="340" fill="#030712" />

                {/* AHU Insulated Casing Outer Box */}
                <rect x="50" y="60" width="620" height="220" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />

                {/* Section 1: Mixing Box (Fresh Air & Return Air) */}
                <rect x="50" y="60" width="130" height="220" fill="#1e293b" fillOpacity="0.4" />
                <path d="M 50 110 L 110 110" stroke="#f59e0b" strokeWidth="4" />
                <text x="55" y="100" fill="#f59e0b" fontSize="9" fontWeight="bold">RETURN AIR (RA)</text>

                <path d="M 115 60 L 115 110" stroke="#10b981" strokeWidth="4" />
                <text x="120" y="50" fill="#10b981" fontSize="9" fontWeight="bold">FRESH AIR (OA)</text>

                <text x="115" y="160" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">MIXING PLENUM</text>
                <text x="115" y="175" fill="#fca5a5" fontSize="9" textAnchor="middle">
                  {inputs.enteringAirDbtC}°C / {inputs.enteringAirRhPercent}% RH
                </text>
                <text x="115" y="190" fill="#cbd5e1" fontSize="8" textAnchor="middle">
                  h: {results.enteringEnthalpyKjKg} kJ/kg
                </text>

                {/* Section 2: Air Filter Section */}
                <rect x="180" y="65" width="25" height="210" fill="#334155" stroke="#64748b" strokeWidth="1" />
                {/* Zigzag pleated filter */}
                <path d="M 192 65 L 192 275" stroke="#94a3b8" strokeWidth="3" strokeDasharray="6 4" />
                <text x="192" y="50" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">FILTER</text>
                <text x="192" y="295" fill={results.filterStatus === 'clean' ? '#34d399' : '#f87171'} fontSize="9" textAnchor="middle" fontWeight="bold">
                  ΔP: {inputs.filterPressureDropPa} Pa
                </text>

                {/* Section 3: Cooling Coil (CHW) */}
                <rect x="235" y="65" width="80" height="210" fill="#1e3a8a" fillOpacity="0.3" stroke="#3b82f6" strokeWidth="1.5" />
                {/* Coil pipe tubes */}
                {[90, 120, 150, 180, 210, 240].map((y) => (
                  <g key={y}>
                    <circle cx="255" cy={y} r="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle cx="275" cy={y+10} r="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle cx="295" cy={y} r="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                  </g>
                ))}
                {/* Coil Chilled Water connections */}
                <path d="M 275 65 L 275 35" stroke="#0284c7" strokeWidth="5" />
                <text x="275" y="25" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">
                  CHW IN: {inputs.chwInletTempC}°C ({inputs.chwFlowLpm} LPM)
                </text>

                <path d="M 295 65 L 295 45" stroke="#0369a1" strokeWidth="5" />
                <text x="375" y="45" fill="#7dd3fc" fontSize="9" fontWeight="bold">
                  CHW OUT: {inputs.chwOutletTempC}°C
                </text>

                {/* Condensate Drain Pan */}
                <rect x="230" y="270" width="90" height="10" fill="#0284c7" />
                <path d="M 275 280 L 275 305" stroke="#0284c7" strokeWidth="3" strokeDasharray="3 2" />
                <text x="275" y="320" fill="#38bdf8" fontSize="8" textAnchor="middle">Kondensat Air</text>

                <text x="275" y="160" fill="#bae6fd" fontSize="10" textAnchor="middle" fontWeight="bold">
                  COOLING COIL
                </text>
                <text x="275" y="175" fill="#93c5fd" fontSize="9" textAnchor="middle">
                  Bypass: {(results.coilBypassFactor * 100).toFixed(1)}%
                </text>

                {/* Section 4: Fan Section */}
                <rect x="360" y="65" width="180" height="210" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                {/* Fan Housing & Impeller */}
                <circle cx="450" cy="170" r="55" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="450" cy="170" r="16" fill="#0284c7" stroke="#93c5fd" />
                {/* Fan blade rotation spokes */}
                <line x1="450" y1="170" x2="410" y2="150" stroke="#38bdf8" strokeWidth="3" />
                <line x1="450" y1="170" x2="480" y2="140" stroke="#38bdf8" strokeWidth="3" />
                <line x1="450" y1="170" x2="470" y2="210" stroke="#38bdf8" strokeWidth="3" />
                <line x1="450" y1="170" x2="420" y2="200" stroke="#38bdf8" strokeWidth="3" />
                <text x="450" y="245" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
                  SUPPLY FAN ({inputs.fanInputKW} kW)
                </text>
                <text x="450" y="260" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  {inputs.fanType === 'direct_drive_ec_plug' ? 'EC Plug Fan' : 'Belt-Driven Fan'}
                </text>

                {/* Section 5: Supply Duct Outlet */}
                <rect x="580" y="100" width="90" height="140" fill="#1e293b" fillOpacity="0.6" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M 670 170 L 710 170" stroke="#38bdf8" strokeWidth="6" />
                <text x="630" y="150" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
                  SUPPLY AIR
                </text>
                <text x="630" y="168" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">
                  {inputs.leavingAirDbtC}°C / {inputs.leavingAirRhPercent}%
                </text>
                <text x="630" y="185" fill="#7dd3fc" fontSize="9" textAnchor="middle">
                  {inputs.measuredAirflowCfm} CFM
                </text>
                <text x="630" y="200" fill="#94a3b8" fontSize="8" textAnchor="middle">
                  ESP: {inputs.externalStaticPressurePa} Pa
                </text>
              </svg>
            </div>
          </div>

          {/* Diagnostic & Energy Balance Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Hasil Analisa Psikrometrik &amp; Kipas AHU</span>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                results.heatBalanceStatus === 'balanced'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                Heat Balance: {results.heatBalanceErrorPercent.toFixed(1)}% ({results.heatBalanceStatus})
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
                <span>Kinerja termal AHU, distribusi debit udara, efisiensi kipas SFP, dan kondisi filter berada dalam performa ideal.</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-300 border-collapse">
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-1.5 text-slate-400">1. Kapasitas Udara vs Air:</td>
                    <td className="py-1.5 text-right font-mono font-bold text-cyan-300">
                      Udara: {results.airsideTotalCapacityTR} TR ({results.airsideTotalCapacityKW} kW) | Air: {results.watersideCapacityTR} TR ({results.watersideCapacityKW} kW)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-1.5 text-slate-400">2. Beban Sensibel &amp; Laten:</td>
                    <td className="py-1.5 text-right font-mono text-slate-300">
                      Sensibel: {results.airsideSensibleCapacityKW} kW | Laten: {results.airsideLatentCapacityKW} kW (SHR: {results.sensibleHeatRatio.toFixed(2)})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-1.5 text-slate-400">3. Efisiensi Koil &amp; Bypass:</td>
                    <td className="py-1.5 text-right font-mono text-slate-300">
                      Bypass Factor (BF): {(results.coilBypassFactor * 100).toFixed(1)}% | Contact Factor (CF): {(results.coilContactFactor * 100).toFixed(1)}% | ADP: {results.coilApparatusDewPointC}°C
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-400 font-semibold">4. Efisiensi Kipas Statis:</td>
                    <td className="py-1.5 text-right font-mono font-bold text-emerald-400">
                      {results.fanStaticEfficiencyPercent}% (SFP: {results.specificFanPowerWPerLps.toFixed(2)} W/(L/s) - {results.sfpClassification})
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
