import React, { useState } from 'react';
import { UnitSystem } from '../types/hvac';
import { calculateDuctSizing } from '../utils/hvacCalculations';

interface DuctSizingCalculatorProps {
  unitSystem: UnitSystem;
  suggestedCFM: number;
}

const VELOCITY_PRESETS = [
  { label: 'Saluran Cabang Residensial (Branch Duct)', fpm: 600, desc: 'Sangat tenang (NC-25), minim desis angin' },
  { label: 'Saluran Utama Residensial (Main Trunk)', fpm: 800, desc: 'Standar rumah tinggal & kamar hotel (NC-30)' },
  { label: 'Saluran Utama Kantor (Office Main Supply)', fpm: 1100, desc: 'Standar gedung komersial kantor (NC-35)' },
  { label: 'Saluran Balik Udara (Return Air Duct)', fpm: 750, desc: 'Mencegah suara dengung pada kisi return' },
  { label: 'Saluran Industri / Komersial Besar', fpm: 1600, desc: 'Kecepatan tinggi untuk pabrik atau gudang' },
];

export const DuctSizingCalculator: React.FC<DuctSizingCalculatorProps> = ({
  suggestedCFM,
}) => {
  const [cfm, setCfm] = useState<number>(suggestedCFM || 800);
  const [velocityFpm, setVelocityFpm] = useState<number>(900);

  const ductResult = calculateDuctSizing({ cfm, velocityFpm });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-base font-semibold text-white tracking-wide">
          Kalkulator Dimensi Saluran Udara (Duct Sizing & Velocity)
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Menghitung diameter saluran pipa bulat (Spiral / Round Duct) dan ukuran saluran persegi (Rectangular Duct: Lebar x Tinggi) dengan rasio aspek aerodinamis yang ideal serta rugi gesek (friction loss).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-6 space-y-6">
          {/* Airflow Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                01. Laju Aliran Udara (Airflow Volume)
              </span>
              {suggestedCFM > 0 && suggestedCFM !== cfm && (
                <button
                  onClick={() => setCfm(suggestedCFM)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline"
                >
                  Pakai {suggestedCFM} CFM (Dari Beban AC)
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <label htmlFor="cfm-input">Volume Aliran Udara</label>
                <span className="font-mono text-cyan-400">{cfm} CFM</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="10000"
                  step="50"
                  value={cfm}
                  onChange={(e) => setCfm(parseInt(e.target.value, 10))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <input
                  id="cfm-input"
                  type="number"
                  min="20"
                  max="50000"
                  step="50"
                  value={cfm}
                  onChange={(e) => setCfm(Math.max(10, parseInt(e.target.value, 10) || 10))}
                  className="w-24 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-center font-mono text-xs text-white outline-none"
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Ekivalen Metrik: <strong>{Math.round(cfm * 1.699)} m³/jam (CMH)</strong>
              </div>
            </div>
          </div>

          {/* Velocity Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                02. Kecepatan Udara Rencana (Air Velocity)
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">{velocityFpm} FPM</span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>300 FPM (Sangat Senyap)</span>
                <span>2500 FPM (Industri)</span>
              </div>
              <input
                type="range"
                min="300"
                max="2500"
                step="50"
                value={velocityFpm}
                onChange={(e) => setVelocityFpm(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded cursor-pointer"
              />
              <div className="text-[11px] font-mono text-slate-400">
                Ekivalen: <strong>{(velocityFpm * 0.00508).toFixed(2)} m/detik (m/s)</strong>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                Preset Kecepatan Rekomendasi (Berdasarkan Tingkat Kebisingan):
              </label>
              <div className="space-y-1.5">
                {VELOCITY_PRESETS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setVelocityFpm(item.fpm)}
                    className={`w-full p-2 rounded border text-left transition-colors flex items-center justify-between ${
                      velocityFpm === item.fpm
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-400 shrink-0 ml-3">
                      {item.fpm} FPM
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Console */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Sizing Box */}
          <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-6 shadow-lg shadow-cyan-950/40 space-y-5">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center justify-between">
              <span>Rekomendasi Dimensi Saluran Udara</span>
              <span className="text-[10px] text-slate-400">Equal Friction Method</span>
            </div>

            {/* Circular Diameter Readout */}
            <div className="pb-4 border-b border-slate-800">
              <span className="block text-xs font-mono text-slate-400 uppercase">
                Diameter Saluran Pipa Bulat (Round Duct Ø)
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl font-mono font-bold text-cyan-400 tabular-nums">
                  Ø {ductResult.circularDiameterInches}&quot;
                </span>
                <span className="text-lg font-mono text-slate-300">
                  ({ductResult.circularDiameterMm} mm)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Luas penampang saluran: {ductResult.ductAreaSqIn} in² ({ductResult.ductAreaSqM} m²)
              </p>
            </div>

            {/* Rectangular Duct Options */}
            <div className="space-y-3 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                  Opsi Ukuran Saluran Persegi (Rectangular Duct: L x T)
                </span>
                <span className="text-[10px] font-mono text-slate-500">Rasio w:h Ideal &le; 2.0</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1.5 px-2 font-normal">Ukuran (Inchi)</th>
                      <th className="py-1.5 px-2 font-normal">Ukuran (mm)</th>
                      <th className="py-1.5 px-2 font-normal">Rasio Aspek</th>
                      <th className="py-1.5 px-2 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ductResult.rectangularOptions.map((opt, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-2 font-semibold text-white">
                          {opt.widthInches}&quot; x {opt.heightInches}&quot;
                        </td>
                        <td className="py-2 px-2 text-slate-300">
                          {opt.widthMm} x {opt.heightMm} mm
                        </td>
                        <td className="py-2 px-2 text-slate-400">
                          1 : {opt.aspectRatio}
                        </td>
                        <td className="py-2 px-2">
                          {opt.isIdeal ? (
                            <span className="text-emerald-400 font-semibold">Sangat Ideal</span>
                          ) : (
                            <span className="text-amber-400">Bisa Diterapkan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Friction Loss / Pressure Drop */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="block text-[11px] font-mono text-slate-400">Friction Loss (Imperial)</span>
                <span className="text-lg font-mono font-bold text-white tabular-nums">
                  {ductResult.frictionLossInWgPer100Ft}
                </span>
                <span className="block text-[10px] font-mono text-slate-500">in. wg / 100 ft</span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="block text-[11px] font-mono text-slate-400">Friction Loss (Metrik)</span>
                <span className="text-lg font-mono font-bold text-white tabular-nums">
                  {ductResult.frictionLossPaPerMeter}
                </span>
                <span className="block text-[10px] font-mono text-slate-500">Pa / meter</span>
              </div>
            </div>

            {/* Note */}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              *Rekomendasi SMACNA: Usahakan rasio aspek ducting tidak melebihi 1:4 karena saluran yang terlalu tipis dan lebar akan meningkatkan kehilangan tekanan (pressure drop) serta menimbulkan deformasi getaran.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
