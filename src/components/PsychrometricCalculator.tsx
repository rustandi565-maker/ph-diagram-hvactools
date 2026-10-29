import React, { useState } from 'react';
import { UnitSystem } from '../types/hvac';
import { calculatePsychrometrics } from '../utils/hvacCalculations';

interface PsychrometricCalculatorProps {
  unitSystem: UnitSystem;
}

export const PsychrometricCalculator: React.FC<PsychrometricCalculatorProps> = ({
  unitSystem,
}) => {
  // Default values representative of Indonesian tropical climate
  const [dryBulbC, setDryBulbC] = useState<number>(31);
  const [relativeHumidity, setRelativeHumidity] = useState<number>(75);

  const result = calculatePsychrometrics(dryBulbC, relativeHumidity);

  // Conversion helpers for Imperial display if chosen
  const toF = (c: number) => Math.round(((c * 9) / 5 + 32) * 10) / 10;
  const tempUnit = unitSystem === 'metric' ? '°C' : '°F';
  const displayDryBulb = unitSystem === 'metric' ? result.dryBulbC : toF(result.dryBulbC);
  const displayDewPoint = unitSystem === 'metric' ? result.dewPointC : toF(result.dewPointC);
  const displayWetBulb = unitSystem === 'metric' ? result.wetBulbC : toF(result.wetBulbC);

  // Quick weather condition presets
  const presets = [
    { label: 'Tropis Lembap Siang Hari (Jakarta/Surabaya)', temp: 32, rh: 75 },
    { label: 'Standar Kenyamanan Ruang AC (ASHRAE 55)', temp: 24, rh: 55 },
    { label: 'Malam Hari Lembap Dingin', temp: 23, rh: 85 },
    { label: 'Server Room Dingin & Kering', temp: 20, rh: 45 },
    { label: 'Terik Ekstrem Tropis', temp: 36, rh: 65 },
  ];

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-base font-semibold text-white tracking-wide">
          Kalkulator Psikrometrik, Titik Embun (Dew Point) & Kenyamanan Termal
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Menganalisis sifat termodinamika udara lembap: titik embun kondensasi pipa AC, suhu bola basah (Wet Bulb), entalpi total kalor, dan zona kenyamanan manusia berdasarkan ASHRAE 55.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Sliders Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                01. Kondisi Udara Sekitar (Ambient Air)
              </span>
            </div>

            {/* Dry Bulb Temperature Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <label htmlFor="temp-input">Suhu Bola Kering (Dry Bulb / T_db)</label>
                <span className="font-mono text-cyan-400 font-bold text-sm">
                  {displayDryBulb} {tempUnit}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="0.5"
                value={dryBulbC}
                onChange={(e) => setDryBulbC(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>10°C (Dingin)</span>
                <span>24°C (Nyaman)</span>
                <span>45°C (Ekstrem)</span>
              </div>
            </div>

            {/* Relative Humidity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <label htmlFor="rh-input">Kelembapan Relatif (Relative Humidity / RH)</label>
                <span className="font-mono text-cyan-400 font-bold text-sm">
                  {result.relativeHumidity}% RH
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="100"
                step="1"
                value={relativeHumidity}
                onChange={(e) => setRelativeHumidity(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>15% (Sangat Kering)</span>
                <span>50% (Ideal)</span>
                <span>100% (Jenuh / Hujan)</span>
              </div>
            </div>
          </div>

          {/* Climate Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block pb-3 border-b border-slate-800 mb-3">
              02. Preset Kondisi Lingkungan Nyata
            </span>
            <div className="space-y-2">
              {presets.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setDryBulbC(item.temp);
                    setRelativeHumidity(item.rh);
                  }}
                  className={`w-full p-2.5 rounded border text-left transition-colors flex items-center justify-between ${
                    dryBulbC === item.temp && relativeHumidity === item.rh
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-semibold">{item.label}</span>
                  <span className="text-xs font-mono text-cyan-400 shrink-0 ml-2">
                    {item.temp}°C · {item.rh}% RH
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output Console */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-6 shadow-lg shadow-cyan-950/40 space-y-5">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center justify-between">
              <span>Analisis Termodinamika & Titik Embun</span>
              <span className="text-[10px] text-slate-400">Magnus-Tetens Formula</span>
            </div>

            {/* Dew Point Big Display */}
            <div className="pb-4 border-b border-slate-800">
              <span className="block text-xs font-mono text-slate-400 uppercase">
                Titik Embun (Dew Point Temperature)
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-mono font-bold text-cyan-400 tabular-nums">
                  {displayDewPoint} {tempUnit}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Uap air di udara akan mulai mengembun menjadi tetesan air jika menyentuh permukaan benda bersuhu di bawah{' '}
                <strong className="text-white font-mono">{displayDewPoint} {tempUnit}</strong>.
              </p>
            </div>

            {/* Wet Bulb & Enthalpy Grid */}
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-800 text-xs">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="block text-[11px] font-mono text-slate-400">Suhu Bola Basah (Wet Bulb)</span>
                <span className="text-2xl font-mono font-bold text-white tabular-nums">
                  {displayWetBulb} {tempUnit}
                </span>
                <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                  Batas teoritis pendinginan evaporatif
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="block text-[11px] font-mono text-slate-400">Entalpi Udara (Total Heat)</span>
                <span className="text-2xl font-mono font-bold text-white tabular-nums">
                  {result.enthalpyKjKg}
                </span>
                <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                  kJ / kg udara kering
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="block text-[11px] font-mono text-slate-400">Rasio Kelembapan (W)</span>
                <span className="text-2xl font-mono font-bold text-white tabular-nums">
                  {result.humidityRatioGKg}
                </span>
                <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                  gram air / kg udara
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="block text-[11px] font-mono text-slate-400">Tekanan Uap Air (Pv)</span>
                <span className="text-2xl font-mono font-bold text-white tabular-nums">
                  {result.vaporPressureKPa}
                </span>
                <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                  kPa
                </span>
              </div>
            </div>

            {/* Thermal Comfort Status Badge Box */}
            <div className="p-4 rounded border border-slate-700 bg-slate-950 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400">Evaluasi Kenyamanan:</span>
                <span
                  className={`text-xs font-semibold font-mono ${
                    result.comfortStatus.category === 'comfortable'
                      ? 'text-emerald-400'
                      : result.comfortStatus.category === 'warm_humid'
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                  }`}
                >
                  {result.comfortStatus.label}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {result.comfortStatus.description}
              </p>
            </div>

            {/* Important Field Tip for HVAC Installation */}
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-800/40 rounded text-xs text-slate-300 space-y-1.5">
              <span className="font-semibold text-cyan-400 block">
                Catatan Penting Teknisi: Insulasi Pipa Tembaga AC
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Pipa tembaga suction AC membawa freon dingin bersuhu 5°C - 10°C, yang jauh lebih dingin daripada titik embun udara ({result.dewPointC}°C). Jika insulasi busa hitam (Armaflex) robek atau sambungannya tidak dilem rapat, pipa akan langsung mengembun lebat dan meneteskan air ke plafon gypsum.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
