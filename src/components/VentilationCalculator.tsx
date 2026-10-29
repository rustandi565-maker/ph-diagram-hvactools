import React, { useState } from 'react';
import { UnitSystem } from '../types/hvac';
import { calculateVentilation } from '../utils/hvacCalculations';

interface VentilationCalculatorProps {
  unitSystem: UnitSystem;
  defaultLength: number;
  defaultWidth: number;
  defaultHeight: number;
}

const ACH_PRESETS = [
  { label: 'Kamar Tidur / Residensial', ach: 4, desc: 'Sirkulasi udara standar rumah tinggal' },
  { label: 'Ruang Kantor Komersial', ach: 6, desc: 'Standar kenyamanan kerja ASHRAE 62.1' },
  { label: 'Ruang Kelas / Sekolah', ach: 6, desc: 'Mencegah penumpukan CO2 saat ruang penuh' },
  { label: 'Toilet / Kamar Mandi', ach: 10, desc: 'Pembuangan bau & uap lembap cepat' },
  { label: 'Dapur Restoran / Kafe', ach: 15, desc: 'Evakuasi asap & panas kompor intensif' },
  { label: 'Server Room / IT', ach: 12, desc: 'Distribusi pendinginan seragam pada rak server' },
  { label: 'Klinik / Fasilitas Medis', ach: 8, desc: 'Menjaga kemurnian udara dan sirkulasi' },
];

export const VentilationCalculator: React.FC<VentilationCalculatorProps> = ({
  unitSystem,
  defaultLength,
  defaultWidth,
  defaultHeight,
}) => {
  const [length, setLength] = useState(defaultLength);
  const [width, setWidth] = useState(defaultWidth);
  const [height, setHeight] = useState(defaultHeight);
  const [ach, setAch] = useState(6);
  const [peopleCount, setPeopleCount] = useState(4);

  const lengthUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const volumeUnit = unitSystem === 'metric' ? 'm³' : 'cu ft';

  const ventResult = calculateVentilation({
    length,
    width,
    height,
    unitSystem,
    ach,
  });

  // Fresh air per person (ASHRAE standard is ~15 - 20 CFM per person)
  const freshAirPerPersonCFM = peopleCount * 20;
  const freshAirPerPersonCMH = Math.round(freshAirPerPersonCFM * 1.699);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-base font-semibold text-white tracking-wide">
          Kalkulator Ventilasi & Laju Aliran Udara (CFM / CMH)
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Menghitung kapasitas kipas pembuangan (Exhaust Fan) dan pasokan udara segar (Fresh Air) berdasarkan volume ruangan dan standar pergantian udara per jam (ACH - <em>Air Changes per Hour</em>) sesuai standar ASHRAE.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dimensions */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                01. Dimensi Ruangan untuk Ventilasi
              </span>
              <span className="text-xs font-mono text-slate-400">
                Volume: <strong className="text-white">{ventResult.roomVolume} {volumeUnit}</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Panjang ({lengthUnit})</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={length}
                  onChange={(e) => setLength(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-sm font-mono text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Lebar ({lengthUnit})</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-sm font-mono text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Tinggi ({lengthUnit})</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-sm font-mono text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* ACH Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                02. Laju Pergantian Udara (ACH / Air Changes per Hour)
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">{ach} ACH</span>
            </div>

            {/* Slider */}
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>1 ACH (Sirkulasi Minimal)</span>
                <span>30 ACH (Sirkulasi Sangat Cepat)</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={ach}
                onChange={(e) => setAch(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                Pilih Standar Rekomendasi Sesuai Jenis Ruangan:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ACH_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setAch(preset.ach)}
                    className={`p-2.5 rounded border text-left transition-colors flex flex-col justify-between ${
                      ach === preset.ach
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{preset.label}</span>
                      <span className="text-xs font-mono font-bold text-cyan-400">{preset.ach} ACH</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Occupants Fresh Air Check */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                03. Verifikasi Pasokan Udara Segar Penghuni
              </span>
              <span className="text-xs font-mono text-slate-400">{peopleCount} Orang</span>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="50"
                value={peopleCount}
                onChange={(e) => setPeopleCount(parseInt(e.target.value, 10))}
                className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-xs font-mono text-white w-20 text-right">
                {peopleCount} Penghuni
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Kebutuhan pasokan udara luar segar minimum untuk {peopleCount} orang (20 CFM/orang):{' '}
              <strong className="text-cyan-400 font-mono">{freshAirPerPersonCFM} CFM</strong> (±{freshAirPerPersonCMH} m³/h).
            </p>
          </div>
        </div>

        {/* Right Output Console */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-6 shadow-lg shadow-cyan-950/40 space-y-5">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center justify-between">
              <span>Hasil Laju Aliran Udara Diperlukan</span>
              <span className="text-[10px] text-slate-400">Formula ACH</span>
            </div>

            {/* Primary CFM readout */}
            <div className="pb-4 border-b border-slate-800">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-mono font-bold text-cyan-400 tabular-nums">
                  {ventResult.cfm.toLocaleString('id-ID')}
                </span>
                <span className="text-sm font-mono uppercase text-slate-400">CFM</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Kaki kubik per menit (Cubic Feet per Minute)
              </p>
            </div>

            {/* Secondary Multi-Unit Metric Grid */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="block text-[11px] font-mono text-slate-400">Debit Metrik (CMH)</span>
                <span className="text-2xl font-mono font-bold text-white tabular-nums">
                  {ventResult.cmh.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] font-mono text-slate-500">m³ / jam</span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="block text-[11px] font-mono text-slate-400">Liter per Detik</span>
                <span className="text-2xl font-mono font-bold text-white tabular-nums">
                  {ventResult.litersPerSecond.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] font-mono text-slate-500">L / detik (L/s)</span>
              </div>
            </div>

            {/* Recommended Fan Size */}
            <div className="space-y-2">
              <span className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                Rekomendasi Spesifikasi Kipas / Blower
              </span>
              <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/50 rounded text-xs text-slate-200">
                <div className="font-semibold text-cyan-300 text-sm">
                  {ventResult.recommendedFanSize}
                </div>
                <p className="mt-1 text-slate-400 text-[11px] leading-relaxed">
                  Pilihlah exhaust fan atau blower yang memiliki rating airflow sedikit di atas {ventResult.cfm} CFM untuk mengantisipasi tahanan kisi-kisi (grille) dan pipa saluran (duct).
                </p>
              </div>
            </div>

            {/* Air Quality Guidance */}
            <div className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800">
              <div className="font-semibold text-slate-300">Mengapa Ventilasi Penting?</div>
              <p className="text-[11px] leading-relaxed">
                Ruangan ber-AC yang tertutup rapat tanpa ventilasi udara segar akan menyebabkan kadar CO2 meningkat (&gt;1.000 ppm), mengakibatkan kantuk, sakit kepala, dan penurunan konsentrasi. Pasang exhaust fan atau fresh air damper untuk menjaga sirkulasi sehat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
