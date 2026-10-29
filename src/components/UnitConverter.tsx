import React, { useState } from 'react';

type ConverterCategory = 'cooling' | 'airflow' | 'pressure' | 'velocity' | 'temperature';

export const UnitConverter: React.FC = () => {
  const [category, setCategory] = useState<ConverterCategory>('cooling');

  // Cooling Capacity States (Base is BTU/hr)
  const [btu, setBtu] = useState<number>(9000);

  // Airflow States (Base is CFM)
  const [cfm, setCfm] = useState<number>(800);

  // Pressure States (Base is Pa)
  const [pa, setPa] = useState<number>(100);

  // Velocity States (Base is m/s)
  const [ms, setMs] = useState<number>(4.5);

  // Temperature States (Base is Celsius)
  const [celsius, setCelsius] = useState<number>(24);

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Pilih Kategori Konversi Satuan HVAC
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'cooling', label: 'Daya Pendinginan (BTU/PK/TR)' },
              { id: 'airflow', label: 'Debit Udara (CFM/CMH/Ls)' },
              { id: 'pressure', label: 'Tekanan (Pa/in.wg/psi)' },
              { id: 'velocity', label: 'Kecepatan Udara (FPM/ms)' },
              { id: 'temperature', label: 'Suhu (°C/°F/K)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as ConverterCategory)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  category === cat.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        {category === 'cooling' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Konverter Kapasitas Daya Pendingin AC
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ubah nilai pada salah satu kotak untuk mengonversi secara otomatis:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* BTU / hr */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">BTU / Jam (BTU/h)</label>
                <input
                  type="number"
                  value={btu}
                  onChange={(e) => setBtu(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-cyan-400 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">British Thermal Unit</span>
              </div>

              {/* PK / HP */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">PK / HP (Paardenkracht)</label>
                <input
                  type="number"
                  step="0.25"
                  value={Math.round((btu / 9000) * 100) / 100}
                  onChange={(e) => setBtu((parseFloat(e.target.value) || 0) * 9000)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">1 PK ≈ 9.000 BTU/h</span>
              </div>

              {/* Kilowatt (kW) */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Kilowatt Pendingin (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  value={Math.round((btu / 3412.142) * 100) / 100}
                  onChange={(e) => setBtu((parseFloat(e.target.value) || 0) * 3412.142)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">1 kW ≈ 3.412 BTU/h</span>
              </div>

              {/* Ton of Refrigeration (TR) */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Tonase Pendingin (TR / Tons)</label>
                <input
                  type="number"
                  step="0.1"
                  value={Math.round((btu / 12000) * 100) / 100}
                  onChange={(e) => setBtu((parseFloat(e.target.value) || 0) * 12000)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">1 TR = 12.000 BTU/h</span>
              </div>

              {/* Kcal / hr */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Kilokalori / Jam (Kcal/h)</label>
                <input
                  type="number"
                  value={Math.round(btu * 0.252)}
                  onChange={(e) => setBtu((parseFloat(e.target.value) || 0) / 0.252)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">1 Kcal/h = 3.968 BTU/h</span>
              </div>
            </div>

            {/* Quick Reference Chips */}
            <div className="p-4 bg-slate-950 rounded border border-slate-800 text-xs">
              <span className="font-semibold text-slate-300 block mb-2 font-mono">
                Tabel Cepat Nilai PK Standar Indonesia:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400 font-mono text-[11px]">
                <div>0.5 PK = 5.000 BTU/h</div>
                <div>0.75 PK = 7.000 BTU/h</div>
                <div>1.0 PK = 9.000 BTU/h</div>
                <div>1.5 PK = 12.000 BTU/h</div>
                <div>2.0 PK = 18.000 BTU/h</div>
                <div>2.5 PK = 24.000 BTU/h</div>
                <div>3.0 PK = 28.000 BTU/h</div>
                <div>5.0 PK = 45.000 BTU/h</div>
              </div>
            </div>
          </div>
        )}

        {category === 'airflow' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Konverter Laju Aliran Udara (Airflow Rate)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Konversi antara CFM (Imperial) dan CMH / Liter per detik (Metrik):
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">CFM (Cubic Feet / Min)</label>
                <input
                  type="number"
                  value={cfm}
                  onChange={(e) => setCfm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-cyan-400 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Kaki kubik per menit</span>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">CMH (m³ / Jam)</label>
                <input
                  type="number"
                  value={Math.round(cfm * 1.69901)}
                  onChange={(e) => setCfm((parseFloat(e.target.value) || 0) / 1.69901)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">1 CFM ≈ 1.699 m³/h</span>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Liter / Detik (L/s)</label>
                <input
                  type="number"
                  step="0.5"
                  value={Math.round(cfm * 0.471947 * 10) / 10}
                  onChange={(e) => setCfm((parseFloat(e.target.value) || 0) / 0.471947)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">1 L/s ≈ 2.119 CFM</span>
              </div>
            </div>
          </div>
        )}

        {category === 'pressure' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Konverter Tekanan Statis & Refrigerant
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Konversi tekanan saluran udara (Pa / in.wg) dan tekanan manifold refrigerant (psi / bar):
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Pascal (Pa)</label>
                <input
                  type="number"
                  value={pa}
                  onChange={(e) => setPa(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-cyan-400 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">N / m²</span>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Inches of Water (in. wg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={Math.round((pa / 249.0889) * 1000) / 1000}
                  onChange={(e) => setPa((parseFloat(e.target.value) || 0) * 249.0889)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">1 in. wg ≈ 249.1 Pa</span>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">PSI (Pounds / Sq. Inch)</label>
                <input
                  type="number"
                  step="0.1"
                  value={Math.round((pa / 6894.757) * 100) / 100}
                  onChange={(e) => setPa((parseFloat(e.target.value) || 0) * 6894.757)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Standar manifold gauge</span>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Bar</label>
                <input
                  type="number"
                  step="0.01"
                  value={Math.round((pa / 100000) * 10000) / 10000}
                  onChange={(e) => setPa((parseFloat(e.target.value) || 0) * 100000)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">1 bar = 100.000 Pa</span>
              </div>
            </div>
          </div>
        )}

        {category === 'velocity' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Konverter Kecepatan Aliran Udara
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Meter per Detik (m/s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ms}
                  onChange={(e) => setMs(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-cyan-400 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Standar SI</span>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Feet per Minute (FPM)</label>
                <input
                  type="number"
                  value={Math.round(ms * 196.85)}
                  onChange={(e) => setMs((parseFloat(e.target.value) || 0) / 196.85)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Standar ducting HVAC</span>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Kilometer per Jam (km/h)</label>
                <input
                  type="number"
                  step="0.5"
                  value={Math.round(ms * 3.6 * 10) / 10}
                  onChange={(e) => setMs((parseFloat(e.target.value) || 0) / 3.6)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Kecepatan angin</span>
              </div>
            </div>
          </div>
        )}

        {category === 'temperature' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Konverter Skala Suhu
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Celsius (°C)</label>
                <input
                  type="number"
                  value={celsius}
                  onChange={(e) => setCelsius(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-cyan-400 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Standar Indonesia & Dunia</span>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Fahrenheit (°F)</label>
                <input
                  type="number"
                  step="0.5"
                  value={Math.round(((celsius * 9) / 5 + 32) * 10) / 10}
                  onChange={(e) => setCelsius((((parseFloat(e.target.value) || 0) - 32) * 5) / 9)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Standar US/Imperial</span>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 focus-within:border-cyan-500">
                <label className="block text-xs font-mono text-slate-400 mb-1">Kelvin (K)</label>
                <input
                  type="number"
                  step="0.5"
                  value={Math.round((celsius + 273.15) * 10) / 10}
                  onChange={(e) => setCelsius((parseFloat(e.target.value) || 0) - 273.15)}
                  className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Suhu mutlak termodinamika</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
