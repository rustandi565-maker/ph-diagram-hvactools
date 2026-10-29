import React from 'react';
import { ChillerTestInputs, ChillerTestResults } from '../types/plantTesting';
import { AppLanguage, TRANSLATIONS } from '../utils/i18n';

interface ChillerTestingViewProps {
  inputs: ChillerTestInputs;
  onChangeInput: <K extends keyof ChillerTestInputs>(key: K, value: ChillerTestInputs[K]) => void;
  results: ChillerTestResults;
  language?: AppLanguage;
}

export const ChillerTestingView: React.FC<ChillerTestingViewProps> = ({
  inputs,
  onChangeInput,
  results,
  language = 'id',
}) => {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.id;

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">Kapasitas Evaporator</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.evapCapacityTR} <span className="text-xs font-normal text-slate-400">TR</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {results.evapCapacityKW} kW ({results.percentRatedCapacity}% rating)
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Daya Kompresor</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.totalPowerInputKW} <span className="text-xs font-normal text-slate-400">kW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {inputs.electricalInputMode === 'direct_kw' ? 'Direct Meter' : `${inputs.voltageV}V / ${inputs.currentA}A`}
          </div>
        </div>

        <div className={`rounded-xl p-3.5 border ${
          results.efficiencyRating === 'excellent'
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
            : results.efficiencyRating === 'good'
            ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
            : results.efficiencyRating === 'fair'
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
            : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
        }`}>
          <div className="text-[11px] font-medium uppercase tracking-wider">Spesifik kW / TR</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.specificPowerKWPerTR.toFixed(3)}
          </div>
          <div className="text-[11px] mt-0.5 truncate font-semibold">
            {results.efficiencyRating.toUpperCase()}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">COP / EER</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.copActual.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            EER: <span className="text-emerald-300 font-semibold">{results.eerBtuPerWh.toFixed(1)}</span> Btu/Wh
          </div>
        </div>

        <div className={`rounded-xl p-3.5 border ${
          results.condenserFoulingStatus === 'clean'
            ? 'bg-slate-900/90 border-slate-700/80'
            : results.condenserFoulingStatus === 'mild_fouling'
            ? 'bg-amber-950/40 border-amber-500/50'
            : 'bg-rose-950/40 border-rose-500/50'
        }`}>
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Condenser Approach</div>
          <div className={`text-2xl font-bold mt-1 ${
            results.condenserFoulingStatus === 'clean' ? 'text-white' : 'text-amber-300'
          }`}>
            {results.condenserApproachC.toFixed(2)} <span className="text-xs font-normal text-slate-400">°C</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Target: 0.5 - 2.0 °C
          </div>
        </div>

        <div className={`rounded-xl p-3.5 border ${
          results.heatBalanceStatus === 'valid'
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : results.heatBalanceStatus === 'warning'
            ? 'bg-amber-950/30 border-amber-500/40'
            : 'bg-rose-950/30 border-rose-500/40'
        }`}>
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Keseimbangan Panas</div>
          <div className="text-2xl font-bold text-white mt-1">
            {results.heatBalanceErrorPercent.toFixed(1)} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {results.heatBalanceStatus === 'valid' ? '✓ ASHRAE G-22 Valid' : 'Peringatan deviasi'}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls & Right Interactive Schematic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Measurements (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section 1: Chiller Identity & Type */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Identitas &amp; Tipe Chiller</span>
              <span className="text-[10px] text-slate-500 font-mono">AHRI 550/590</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tag / Nama Chiller</label>
                <input
                  type="text"
                  value={inputs.chillerTag}
                  onChange={(e) => onChangeInput('chillerTag', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tipe Chiller</label>
                <select
                  value={inputs.chillerType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    onChangeInput('chillerType', val);
                    onChangeInput('isWaterCooled', !val.startsWith('air_cooled'));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                >
                  <option value="water_cooled_centrifugal">Water-Cooled Sentrifugal</option>
                  <option value="water_cooled_screw">Water-Cooled Screw</option>
                  <option value="water_cooled_mag_bearing">Magnetic Bearing (Oil-Free)</option>
                  <option value="air_cooled_screw">Air-Cooled Screw</option>
                  <option value="air_cooled_scroll">Air-Cooled Scroll</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kapasitas Desain (TR)</label>
                <input
                  type="number"
                  value={inputs.ratedCapacityTR}
                  onChange={(e) => onChangeInput('ratedCapacityTR', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Daya Desain (kW)</label>
                <input
                  type="number"
                  value={inputs.ratedPowerKW}
                  onChange={(e) => onChangeInput('ratedPowerKW', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Evaporator (Chilled Water) Measurement */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Sisi Evaporator (Chilled Water)</span>
              <span className="text-[10px] text-cyan-500/80 font-mono">ΔT = {results.chwDeltaTC}°C</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">CHW Masuk / In (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.chwInletTempC}
                  onChange={(e) => onChangeInput('chwInletTempC', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">CHW Keluar / Out (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.chwOutletTempC}
                  onChange={(e) => onChangeInput('chwOutletTempC', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Debit CHW (LPM)</label>
                <input
                  type="number"
                  step="10"
                  value={inputs.chwFlowLpm}
                  onChange={(e) => onChangeInput('chwFlowLpm', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono font-semibold focus:border-cyan-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  ≈ {((inputs.chwFlowLpm * 60) / 1000).toFixed(1)} m³/h | {(inputs.chwFlowLpm * 0.264172).toFixed(0)} GPM
                </span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Suhu Saturasi Evap (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.evapSaturationTempC}
                  onChange={(e) => onChangeInput('evapSaturationTempC', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  Approach: {results.evaporatorApproachC}°C
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Condenser Measurement */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Sisi Kondensor ({inputs.isWaterCooled ? 'Cooling Water' : 'Ambient Air'})</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {inputs.isWaterCooled ? 'Water-Cooled' : 'Air-Cooled'}
              </span>
            </h3>
            {inputs.isWaterCooled ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">CW Masuk / In (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.cwInletTempC}
                    onChange={(e) => onChangeInput('cwInletTempC', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CW Keluar / Out (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.cwOutletTempC}
                    onChange={(e) => onChangeInput('cwOutletTempC', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Debit CW (LPM)</label>
                  <input
                    type="number"
                    step="10"
                    value={inputs.cwFlowLpm}
                    onChange={(e) => onChangeInput('cwFlowLpm', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-mono font-semibold focus:border-cyan-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    ≈ {((inputs.cwFlowLpm * 60) / 1000).toFixed(1)} m³/h
                  </span>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Suhu Saturasi Kondenser (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.condSaturationTempC}
                    onChange={(e) => onChangeInput('condSaturationTempC', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    Approach: {results.condenserApproachC}°C
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Suhu Udara Sekitar DBT (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.ambientDryBulbC}
                    onChange={(e) => onChangeInput('ambientDryBulbC', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Suhu Saturasi Kondenser (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.condSaturationTempC}
                    onChange={(e) => onChangeInput('condSaturationTempC', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Electrical Power */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Daya Listrik Input</h3>
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => onChangeInput('electricalInputMode', 'direct_kw')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    inputs.electricalInputMode === 'direct_kw'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Direct kW
                </button>
                <button
                  type="button"
                  onClick={() => onChangeInput('electricalInputMode', 'three_phase_vi')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    inputs.electricalInputMode === 'three_phase_vi'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3-Phase V/A
                </button>
              </div>
            </div>

            {inputs.electricalInputMode === 'direct_kw' ? (
              <div className="text-xs">
                <label className="block text-slate-400 mb-1">Daya Aktif Terukur (kW)</label>
                <input
                  type="number"
                  step="0.5"
                  value={inputs.measuredPowerKW}
                  onChange={(e) => onChangeInput('measuredPowerKW', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-300 font-mono text-base font-bold focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Tegangan (V)</label>
                  <input
                    type="number"
                    value={inputs.voltageV}
                    onChange={(e) => onChangeInput('voltageV', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Arus (A)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={inputs.currentA}
                    onChange={(e) => onChangeInput('currentA', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">PF (cos φ)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.powerFactor}
                    onChange={(e) => onChangeInput('powerFactor', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Schematic & Diagnostics (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive SVG Schematic of Chiller Barrel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>Skematik Fisik Chiller &amp; Sensor Titik Uji</span>
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                {inputs.chillerTag}
              </span>
            </div>

            <div className="w-full bg-slate-950 rounded-lg p-2 border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 700 360" className="w-full h-auto max-h-[360px] font-sans">
                {/* Background Grid */}
                <defs>
                  <linearGradient id="chwGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="cwGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                  </linearGradient>
                  <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="700" height="360" fill="#030712" />
                <rect width="700" height="360" fill="url(#smallGrid)" />

                {/* Compressor Body */}
                <rect x="270" y="30" width="160" height="90" rx="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="350" cy="75" r="28" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
                <path d="M 335 75 L 365 75 M 350 60 L 350 90" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                <text x="350" y="112" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">KOMPRESOR ({results.totalPowerInputKW} kW)</text>

                {/* Motor Power Cable */}
                <path d="M 350 30 L 350 12" stroke="#10b981" strokeWidth="3" strokeDasharray="4 2" />
                <text x="350" y="10" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="bold">POWER INPUT (3-Phase)</text>

                {/* Discharge Pipe (Compressor to Condenser) */}
                <path d="M 430 75 L 530 75 L 530 150" fill="none" stroke="#f87171" strokeWidth="5" />
                <polygon points="530,155 526,145 534,145" fill="#f87171" />
                <text x="495" y="65" fill="#f87171" fontSize="9" fontWeight="bold">Discharge Gas</text>

                {/* Suction Pipe (Evaporator to Compressor) */}
                <path d="M 170 150 L 170 75 L 270 75" fill="none" stroke="#38bdf8" strokeWidth="6" />
                <polygon points="270,75 260,71 260,79" fill="#38bdf8" />
                <text x="205" y="65" fill="#38bdf8" fontSize="9" fontWeight="bold">Suction Vapor</text>

                {/* CONDENSER BARREL (Right) */}
                <rect x="430" y="150" width="200" height="110" rx="14" fill="#18181b" stroke="#ef4444" strokeWidth="2.5" />
                <rect x="440" y="160" width="180" height="90" rx="8" fill="#27272a" fillOpacity="0.5" />
                <text x="530" y="180" fill="#fca5a5" fontSize="12" textAnchor="middle" fontWeight="bold">KONDENSOR SHELL</text>
                <text x="530" y="196" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  Sat. Temp: {inputs.condSaturationTempC}°C
                </text>
                <text x="530" y="210" fill="#f87171" fontSize="9" textAnchor="middle" fontWeight="bold">
                  Approach: {results.condenserApproachC}°C {results.condenserFoulingStatus === 'clean' ? '✓' : '⚠️'}
                </text>

                {/* Condenser Water Inlet / Outlet */}
                {inputs.isWaterCooled ? (
                  <>
                    <path d="M 630 185 L 675 185" stroke="#f97316" strokeWidth="6" />
                    <text x="660" y="175" fill="#f97316" fontSize="9" fontWeight="bold">CW IN ({inputs.cwInletTempC}°C)</text>

                    <path d="M 630 225 L 675 225" stroke="#ef4444" strokeWidth="6" />
                    <text x="660" y="242" fill="#ef4444" fontSize="9" fontWeight="bold">CW OUT ({inputs.cwOutletTempC}°C)</text>
                  </>
                ) : (
                  <>
                    <rect x="460" y="125" width="140" height="20" rx="4" fill="#0284c7" fillOpacity="0.4" stroke="#38bdf8" />
                    <text x="530" y="139" fill="#38bdf8" fontSize="9" textAnchor="middle">AIR-COOLED FAN COIL</text>
                  </>
                )}

                {/* Liquid Line + TXV (Bottom) */}
                <path d="M 530 260 L 530 310 L 170 310 L 170 260" fill="none" stroke="#fbbf24" strokeWidth="4" />
                {/* TXV Valve symbol */}
                <polygon points="340,305 360,315 340,315 360,305" fill="#f59e0b" stroke="#d97706" />
                <text x="350" y="330" fill="#fbbf24" fontSize="9" textAnchor="middle" fontWeight="bold">Expansion Valve (TXV/EXV)</text>

                {/* EVAPORATOR BARREL (Left) */}
                <rect x="70" y="150" width="200" height="110" rx="14" fill="#0f172a" stroke="#0284c7" strokeWidth="2.5" />
                <rect x="80" y="160" width="180" height="90" rx="8" fill="#1e293b" fillOpacity="0.5" />
                <text x="170" y="180" fill="#7dd3fc" fontSize="12" textAnchor="middle" fontWeight="bold">EVAPORATOR SHELL</text>
                <text x="170" y="196" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  Sat. Temp: {inputs.evapSaturationTempC}°C
                </text>
                <text x="170" y="210" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">
                  Approach: {results.evaporatorApproachC}°C {results.evaporatorFoulingStatus === 'clean' ? '✓' : '⚠️'}
                </text>

                {/* Chilled Water Inlet / Outlet */}
                <path d="M 25 185 L 70 185" stroke="#38bdf8" strokeWidth="6" />
                <text x="30" y="175" fill="#38bdf8" fontSize="9" fontWeight="bold">CHW IN ({inputs.chwInletTempC}°C)</text>

                <path d="M 25 225 L 70 225" stroke="#0284c7" strokeWidth="6" />
                <text x="30" y="242" fill="#0284c7" fontSize="9" fontWeight="bold">CHW OUT ({inputs.chwOutletTempC}°C)</text>

                {/* Water Flow Labels */}
                <rect x="75" y="268" width="190" height="22" rx="4" fill="#0284c7" fillOpacity="0.2" />
                <text x="170" y="283" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
                  CHW: {inputs.chwFlowLpm} LPM | Q: {results.evapCapacityTR} TR
                </text>

                {inputs.isWaterCooled && (
                  <>
                    <rect x="435" y="268" width="190" height="22" rx="4" fill="#ef4444" fillOpacity="0.2" />
                    <text x="530" y="283" fill="#f87171" fontSize="10" textAnchor="middle" fontWeight="bold">
                      CW: {inputs.cwFlowLpm} LPM | Q: {results.condenserHeatRejectionTR} TR
                    </text>
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Diagnostic & Heat Balance Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Hasil Analisa &amp; Rekomendasi Teknisi</span>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                results.efficiencyRating === 'excellent'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : results.efficiencyRating === 'good'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {results.efficiencyVerdict}
              </span>
            </h4>

            {/* Diagnostic Alert List */}
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
                <span>Semua parameter operasional chiller (Approach Evap, Approach Condenser, Heat Balance &amp; kW/TR) berada dalam toleransi optimal standar ASHRAE Guideline 22.</span>
              </div>
            )}

            {/* Technical Parameters Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-300 border-collapse">
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-1.5 text-slate-400">Rasio Beban Nyata vs Desain:</td>
                    <td className="py-1.5 text-right font-mono font-bold text-white">
                      {results.percentRatedCapacity}% ({results.evapCapacityTR} / {inputs.ratedCapacityTR} TR)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-1.5 text-slate-400">Total Pelepasan Kalor Kondensor (Q_cond):</td>
                    <td className="py-1.5 text-right font-mono text-amber-300">
                      {results.condenserHeatRejectionKW} kW ({results.condenserHeatRejectionTR} TR)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-1.5 text-slate-400">Panas Teoretis (Q_evap + W_comp):</td>
                    <td className="py-1.5 text-right font-mono text-slate-300">
                      {results.theoreticalHeatRejectionKW} kW
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-400">Toleransi Keseimbangan Kalor (ASHRAE G-22):</td>
                    <td className="py-1.5 text-right font-mono font-bold">
                      <span className={results.heatBalanceErrorPercent <= 5 ? 'text-emerald-400' : 'text-amber-400'}>
                        {results.heatBalanceErrorPercent}% ({results.heatBalanceStatus.toUpperCase()})
                      </span>
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
