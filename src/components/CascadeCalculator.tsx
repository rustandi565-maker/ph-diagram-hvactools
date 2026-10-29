import React, { useState } from 'react';
import { RefrigerantId } from '../types/cascade';
import { CompanyBranding } from '../types/branding';
import {
  calculateCascadeCycle,
  CASCADE_PRESETS,
  generateCopOptimizationCurve,
} from '../utils/cascadeCalculations';
import { REFRIGERANTS } from '../utils/refrigerantData';
import { CascadeDiagram } from './CascadeDiagram';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { buildWhatsAppReportMessage } from '../utils/whatsappShare';

interface CascadeCalculatorProps {
  branding?: CompanyBranding;
}

export const CascadeCalculator: React.FC<CascadeCalculatorProps> = ({ branding }) => {
  // Main cycle parameters
  const [teC, setTeC] = useState<number>(-45);
  const [tcC, setTcC] = useState<number>(38);
  const [deltaTcc, setDeltaTcc] = useState<number>(4);
  const [coolingCapacityKw, setCoolingCapacityKw] = useState<number>(50);
  const [ltcRefrigerant, setLtcRefrigerant] = useState<RefrigerantId>('R744');
  const [htcRefrigerant, setHtcRefrigerant] = useState<RefrigerantId>('R717');

  // Intermediate temperature mode
  const [useManualTcc, setUseManualTcc] = useState<boolean>(false);
  const [manualTccC, setManualTccC] = useState<number>(-10);

  // Compressor parameters (Stoecker & Jones)
  const [etaIsLtc, setEtaIsLtc] = useState<number>(0.78);
  const [etaIsHtc, setEtaIsHtc] = useState<number>(0.80);
  const [clearanceRatio, setClearanceRatio] = useState<number>(0.04);

  // Copy report feedback
  const [copied, setCopied] = useState<boolean>(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);

  // Calculate thermodynamic cycle
  const result = calculateCascadeCycle({
    teC,
    tcC,
    deltaTcc,
    coolingCapacityKw,
    ltcRefrigerant,
    htcRefrigerant,
    manualTccC: useManualTcc ? manualTccC : undefined,
    isentropicEfficiencyLtc: etaIsLtc,
    isentropicEfficiencyHtc: etaIsHtc,
    clearanceRatio,
  });

  // Generate COP curve
  const copCurvePoints = generateCopOptimizationCurve({
    teC,
    tcC,
    deltaTcc,
    coolingCapacityKw,
    ltcRefrigerant,
    htcRefrigerant,
  });

  const handleApplyPreset = (presetId: string) => {
    const p = CASCADE_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setLtcRefrigerant(p.ltcRefrigerant);
      setHtcRefrigerant(p.htcRefrigerant);
      setTeC(p.teC);
      setTcC(p.tcC);
      setDeltaTcc(p.deltaTcc);
      setCoolingCapacityKw(p.coolingCapacityKw);
      setUseManualTcc(false);
    }
  };

  const ltcInfo = REFRIGERANTS[ltcRefrigerant];
  const htcInfo = REFRIGERANTS[htcRefrigerant];

  const waReportMessage = buildWhatsAppReportMessage({
    title: 'Laporan Teknis Performa Sistem Refrigerasi Kaskade',
    productName: `Sistem Kaskade ${ltcInfo.name} / ${htcInfo.name}`,
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    companyName: branding?.companyName,
    sections: [
      {
        heading: 'Parameter Siklus & Suhu Kaskade',
        items: [
          { label: 'Suhu Evaporator (Te)', value: `${result.teC}°C (${result.teK} K)` },
          { label: 'Suhu Kondensor (Tc)', value: `${result.tcC}°C (${result.tcK} K)` },
          { label: 'Beda Suhu Intercooler (ΔTcc)', value: `${result.deltaTcc}°C` },
          { label: 'Suhu Kaskade Optimum Carnot (C.P. Arora)', value: `${result.tccOptCarnotC}°C` },
          { label: 'Suhu Kaskade Aktual (Tcc)', value: `${result.tccActualC}°C` },
          { label: 'Kapasitas Pendinginan (Qe)', value: `${result.coolingCapacityKw} kW (${(result.coolingCapacityKw / 3.51685).toFixed(2)} TR)` },
        ],
      },
      {
        heading: 'Refrigerant & Tekanan Kerja',
        items: [
          { label: 'Sirkuit Rendah (LTC)', value: `${ltcInfo.name} (${ltcInfo.chemicalFormula}) | P_evap=${result.pEvapLtcBar} bar, P_cond=${result.pCondLtcBar} bar (Rasio ${result.pressureRatioLtc}:1)` },
          { label: 'Sirkuit Tinggi (HTC)', value: `${htcInfo.name} (${htcInfo.chemicalFormula}) | P_evap=${result.pEvapHtcBar} bar, P_cond=${result.pCondHtcBar} bar (Rasio ${result.pressureRatioHtc}:1)` },
        ],
      },
      {
        heading: 'Daya Kompresor & Kinerja COP',
        items: [
          { label: 'Daya Kompresor LTC', value: `${result.workCompLtcKw.toFixed(2)} kW` },
          { label: 'Daya Kompresor HTC', value: `${result.workCompHtcKw.toFixed(2)} kW` },
          { label: 'Total Daya Kompresi', value: `${result.totalWorkCompKw.toFixed(2)} kW` },
          { label: 'COP Aktual Siklus Kaskade', value: `${result.copCascade.toFixed(2)}` },
          { label: 'COP Carnot Maksimum', value: `${result.copCarnot.toFixed(2)}` },
          { label: 'Efisiensi Hukum II (η_II)', value: `${result.secondLawEfficiencyPercent.toFixed(1)}%` },
        ],
      },
    ],
    directNotes: `Referensi teori sistem refrigerasi kaskade multi-tekanan: C.P. Arora & W.F. Stoecker. Diterbitkan oleh ${branding?.companyName || 'CV REFRIGERASI TEKNIK UTAMA'}.`,
  });

  const handleCopyReport = async () => {

    const brandingHeader = branding
      ? `===========================================
${branding.companyName.toUpperCase()} (${branding.shortName})
${branding.tagline}
Alamat: ${branding.address}, ${branding.city}
Telp/WA: ${branding.phone} | Email: ${branding.email}
Penanggung Jawab Teknik: ${branding.directorName}
===========================================
`
      : '';

    const report = `${brandingHeader}LAPORAN TEKNIS PERFORMA SISTEM REFRIGERASI KASKADE
Referensi: C.P. Arora & W.F. Stoecker
Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
===========================================

1. PARAMETER DESAIN:
   - Suhu Evaporator Sirkuit Rendah (Te): ${result.teC} °C (${result.teK} K)
   - Suhu Kondensor Sirkuit Tinggi (Tc): ${result.tcC} °C (${result.tcK} K)
   - Beda Suhu Penukar Kalor (ΔTcc): ${result.deltaTcc} °C
   - Suhu Optimum Teoritis (C.P. Arora: √(Te·Tc)): ${result.tccOptCarnotC} °C (${result.tccOptCarnotK} K)
   - Suhu Kaskade Aktual Dipakai (Tcc): ${result.tccActualC} °C
   - Kapasitas Pendingin (Qe): ${result.coolingCapacityKw} kW (${(result.coolingCapacityKw / 3.51685).toFixed(2)} TR)

2. REFRIGERANT:
   - Sirkuit Suhu Rendah (LTC): ${ltcInfo.name} (${ltcInfo.chemicalFormula})
   - Sirkuit Suhu Tinggi (HTC): ${htcInfo.name} (${htcInfo.chemicalFormula})

3. TEKANAN KERJA & RASIO KOMPRESI:
   - LTC Evaporasi: ${result.pEvapLtcBar} bar | Kondensasi: ${result.pCondLtcBar} bar (Rasio: ${result.pressureRatioLtc}:1)
   - HTC Evaporasi: ${result.pEvapHtcBar} bar | Kondensasi: ${result.pCondHtcBar} bar (Rasio: ${result.pressureRatioHtc}:1)

4. DEBIT ALIRAN MASSA & BEBAN TERMAL:
   - Laju Massa LTC: ${result.massFlowLtcKgS} kg/s (${result.massFlowLtcKgH} kg/jam)
   - Daya Kompresor LTC: ${result.workCompLtcKw} kW
   - Beban Penukar Kalor Kaskade (Qcc): ${result.cascadeCondenserLoadKw} kW
   - Laju Massa HTC: ${result.massFlowHtcKgS} kg/s (${result.massFlowHtcKgH} kg/jam)
   - Daya Kompresor HTC: ${result.workCompHtcKw} kW
   - Total Daya Kompresi (W_total): ${result.totalWorkCompKw} kW
   - Kalor Dibuang ke Lingkungan: ${result.ambientCondenserHeatRejectedKw} kW

5. INDIKATOR PERFORMA (COP):
   - COP Kaskade Aktual: ${result.copCascade}
   - COP Carnot Teoritis: ${result.copCarnot}
   - Efisiensi Hukum Kedua (Exergetic): ${result.secondLawEfficiencyPercent} %
   - Volumetric Efficiency LTC: ${(result.volumetricEfficiencyLtc * 100).toFixed(1)} % (Displacement: ${result.displacementLtcM3H} m³/h)
   - Volumetric Efficiency HTC: ${(result.volumetricEfficiencyHtc * 100).toFixed(1)} % (Displacement: ${result.displacementHtcM3H} m³/h)
===========================================`;

    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Reference Academic Banner matching user image */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-xs bg-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
              Referensi Rumus & Landasan Teori Sistem Kaskade
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsWaModalOpen(true)}
              className="px-3 py-1 text-xs font-mono font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
              title="Bagikan laporan performa kaskade langsung ke WhatsApp"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Share WA</span>
            </button>
            <button
              onClick={handleCopyReport}
              className={`px-3 py-1 text-xs font-mono rounded transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30'
              }`}
            >
              {copied ? 'Laporan Disalin! ✓' : 'Salin Laporan Kaskade'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 font-mono">
          <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
            <span className="text-cyan-400 font-bold block mb-1">
              1. C.P. Arora &ndash; Refrigeration and Air Conditioning
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Bab sistem multi-tekanan: tekanan antara geometrik <code className="text-cyan-300">√(Pe · Pc)</code> dan suhu kaskade optimum Carnot <code className="text-cyan-300">Tcc,opt = √(Te · Tc)</code> (dalam Kelvin).
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
            <span className="text-cyan-400 font-bold block mb-1">
              2. W.F. Stoecker &amp; J.W. Jones (1982)
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sistem multi-tekanan: efisiensi volumetrik clearance kompresor <code className="text-cyan-300">ηv = 1 + c - c(Pdis/Psuc)^(1/k)</code> dan volume displacement.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
            <span className="text-amber-400 font-bold block mb-1">
              3. W.F. Stoecker &ndash; Industrial Refrigeration Handbook (1998)
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sistem dua tahap dan kaskade industri natural refrigerant pasangan <code className="text-amber-300">CO₂ / NH₃ (R-744 / R-717)</code>.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
            <span className="text-emerald-400 font-bold block mb-1">
              4. Kajian IIR (International Institute of Refrigeration)
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Kurva kompresor nyata menunjukkan COP pada temperatur rata-rata geometrik berbeda kurang dari 2% dari COP optimum mutlak, membuktikan rumus ini sangat valid untuk rancangan teknik.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Pilih Preset Pasangan Refrigerant Industri:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CASCADE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.id)}
                className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors whitespace-nowrap"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Schematic Diagram */}
      <CascadeDiagram
        result={result}
        ltcRefrigerant={ltcRefrigerant}
        htcRefrigerant={htcRefrigerant}
      />

      {/* Two-Column Grid: Inputs & Detailed Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Parameter Inputs (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Section: Refrigerant Pair Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block pb-3 border-b border-slate-800">
              01. Pemilihan Pasangan Refrigerant (Fluida Kerja)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* LTC Refrigerant */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Sirkuit Rendah (LTC / Bawah)
                </label>
                <select
                  value={ltcRefrigerant}
                  onChange={(e) => setLtcRefrigerant(e.target.value as RefrigerantId)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-xs font-mono text-cyan-300 outline-none"
                >
                  <option value="R744">R-744 (CO₂ Karbon Dioksida) [Rec.]</option>
                  <option value="R23">R-23 (Trifluoromethane -80°C)</option>
                  <option value="R404A">R-404A (HFC Blend)</option>
                  <option value="R290">R-290 (Propana Hidrokarbon)</option>
                  <option value="R507A">R-507A (Azeotrope)</option>
                  <option value="R410A">R-410A (High Pressure)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  {REFRIGERANTS[ltcRefrigerant].ashraeSafety} · NBP: {REFRIGERANTS[ltcRefrigerant].normalBoilingPointC}°C
                </p>
              </div>

              {/* HTC Refrigerant */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Sirkuit Tinggi (HTC / Atas)
                </label>
                <select
                  value={htcRefrigerant}
                  onChange={(e) => setHtcRefrigerant(e.target.value as RefrigerantId)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-xs font-mono text-amber-300 outline-none"
                >
                  <option value="R717">R-717 (Amonia NH₃ Industri) [Rec.]</option>
                  <option value="R134a">R-134a (Tetrafluoroethane)</option>
                  <option value="R404A">R-404A (HFC Blend)</option>
                  <option value="R290">R-290 (Propana Hidrokarbon)</option>
                  <option value="R507A">R-507A (Azeotrope)</option>
                  <option value="R410A">R-410A (High Pressure)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  {REFRIGERANTS[htcRefrigerant].ashraeSafety} · NBP: {REFRIGERANTS[htcRefrigerant].normalBoilingPointC}°C
                </p>
              </div>
            </div>
          </div>

          {/* Section: Temperature Limits */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block pb-3 border-b border-slate-800">
              02. Suhu Batas Operasi & Kapasitas Beban
            </span>

            {/* Te */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <label>Suhu Evaporasi Rendah (Te):</label>
                <span className="font-mono text-cyan-400 font-bold">{teC} °C ({result.teK} K)</span>
              </div>
              <input
                type="range"
                min="-80"
                max="-20"
                step="1"
                value={teC}
                onChange={(e) => setTeC(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            {/* Tc */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <label>Suhu Kondensor Atas (Tc):</label>
                <span className="font-mono text-amber-400 font-bold">+{tcC} °C ({result.tcK} K)</span>
              </div>
              <input
                type="range"
                min="25"
                max="50"
                step="1"
                value={tcC}
                onChange={(e) => setTcC(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            {/* Delta Tcc approach */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <label>Beda Suhu Heat Exchanger Kaskade (ΔTcc):</label>
                <span className="font-mono text-slate-200 font-bold">{deltaTcc} °C</span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                step="0.5"
                value={deltaTcc}
                onChange={(e) => setDeltaTcc(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block">
                Umumnya 3°C &ndash; 5°C untuk plate heat exchanger berinsulasi rapat.
              </span>
            </div>

            {/* Cooling Capacity Qe */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <label>Kapasitas Pendinginan Evaporator (Qe):</label>
                <span className="font-mono text-cyan-400 font-bold">{coolingCapacityKw} kW</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={coolingCapacityKw}
                  onChange={(e) => setCoolingCapacityKw(parseInt(e.target.value, 10))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={coolingCapacityKw}
                  onChange={(e) => setCoolingCapacityKw(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-center font-mono text-xs text-white outline-none"
                />
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Ekivalen: {(coolingCapacityKw / 3.51685).toFixed(2)} Ton Refrigerasi (TR) · {(coolingCapacityKw * 3412.142).toLocaleString('id-ID')} BTU/h
              </span>
            </div>
          </div>

          {/* Section: Intermediate Cascade Temperature Mode */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                03. Suhu Antara Kaskade (Tcc)
              </span>
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => setUseManualTcc(false)}
                  className={`px-2 py-0.5 rounded ${
                    !useManualTcc
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  Otomatis √(Te·Tc)
                </button>
                <button
                  onClick={() => {
                    setUseManualTcc(true);
                    setManualTccC(result.tccOptCarnotC);
                  }}
                  className={`px-2 py-0.5 rounded ${
                    useManualTcc
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  Manual Slider
                </button>
              </div>
            </div>

            {!useManualTcc ? (
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Optimum C.P. Arora &amp; Stoecker:</span>
                  <span className="text-cyan-400 font-bold text-sm">
                    {result.tccOptCarnotC} °C ({result.tccOptCarnotK} K)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Dihitung otomatis dengan rumus <code className="text-cyan-300">Tcc,opt = √(Te · Tc)</code> dalam satuan Kelvin mutlak ({result.teK} K × {result.tcK} K)^0.5.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <label>Geser Suhu Antara Kaskade (Tcc):</label>
                  <span className="font-mono text-amber-400 font-bold">{manualTccC} °C</span>
                </div>
                <input
                  type="range"
                  min={Math.round(teC + 6)}
                  max={Math.round(tcC - 6)}
                  step="0.5"
                  value={manualTccC}
                  onChange={(e) => setManualTccC(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Batas Bawah: {teC + 6}°C</span>
                  <span className="text-cyan-400">Optimum: {result.tccOptCarnotC}°C</span>
                  <span>Batas Atas: {tcC - 6}°C</span>
                </div>
              </div>
            )}
          </div>

          {/* Section: Compressor Parameters (Stoecker & Jones) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block pb-3 border-b border-slate-800">
              04. Parameter Kompresor (W.F. Stoecker &amp; Jones 1982)
            </span>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">η Isentropik LTC</label>
                <input
                  type="number"
                  step="0.02"
                  min="0.5"
                  max="0.9"
                  value={etaIsLtc}
                  onChange={(e) => setEtaIsLtc(parseFloat(e.target.value) || 0.78)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">η Isentropik HTC</label>
                <input
                  type="number"
                  step="0.02"
                  min="0.5"
                  max="0.9"
                  value={etaIsHtc}
                  onChange={(e) => setEtaIsHtc(parseFloat(e.target.value) || 0.80)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Clearance Factor (c)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.02"
                  max="0.08"
                  value={clearanceRatio}
                  onChange={(e) => setClearanceRatio(parseFloat(e.target.value) || 0.04)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Console (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main COP Display Card */}
          <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-6 shadow-lg shadow-cyan-950/40 space-y-5">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center justify-between">
              <span>Hasil Analisis Performa Termodinamika</span>
              <span className="text-[10px] text-slate-400">Siklus 2-Tahap Kaskade</span>
            </div>

            {/* COP Big readout */}
            <div className="pb-4 border-b border-slate-800">
              <span className="block text-xs font-mono text-slate-400 uppercase">
                COP Aktual Sistem Kaskade (Coefficient of Performance)
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-mono font-bold text-cyan-400 tabular-nums">
                  {result.copCascade}
                </span>
                <div className="text-xs font-mono text-slate-400">
                  <span>COP Carnot: <strong>{result.copCarnot}</strong></span>
                  <span className="block text-emerald-400">
                    Efisiensi Hukum II (Exergy): {result.secondLawEfficiencyPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Work & Energy Balance Grid */}
            <div className="grid grid-cols-3 gap-3 pb-4 border-b border-slate-800 text-center">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="block text-[10px] font-mono text-slate-400 uppercase">Daya Kompresor LTC</span>
                <span className="text-lg font-mono font-bold text-cyan-400 tabular-nums">
                  {result.workCompLtcKw} kW
                </span>
                <span className="block text-[10px] font-mono text-slate-500">COP: {result.copLtc}</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="block text-[10px] font-mono text-slate-400 uppercase">Daya Kompresor HTC</span>
                <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                  {result.workCompHtcKw} kW
                </span>
                <span className="block text-[10px] font-mono text-slate-500">COP: {result.copHtc}</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="block text-[10px] font-mono text-slate-400 uppercase">Total Daya Kompresi</span>
                <span className="text-lg font-mono font-bold text-white tabular-nums">
                  {result.totalWorkCompKw} kW
                </span>
                <span className="block text-[10px] font-mono text-slate-500">W_ltc + W_htc</span>
              </div>
            </div>

            {/* Heat Flow Summary */}
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-800 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Beban Penukar Kalor (Q_cc)</span>
                <span className="text-lg font-bold text-cyan-300 tabular-nums">
                  {result.cascadeCondenserLoadKw} kW
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Kalor dibuang LTC &amp; diserap oleh HTC
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Kalor Dibuang ke Udara (Q_cond)</span>
                <span className="text-lg font-bold text-amber-300 tabular-nums">
                  {result.ambientCondenserHeatRejectedKw} kW
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Beban kalor kondensor akhir luar
                </p>
              </div>
            </div>

            {/* Volumetric Efficiency & Displacement (Stoecker & Jones) */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                Performa Volumetrik Kompresor (Stoecker &amp; Jones 1982)
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                  <span className="text-cyan-400 font-semibold block text-[11px]">Kompresor LTC ({REFRIGERANTS[ltcRefrigerant].name})</span>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Efisiensi Volumetrik (ηv):</span>
                    <strong className="text-white">{(result.volumetricEfficiencyLtc * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Laju Displacement:</span>
                    <strong className="text-cyan-300">{result.displacementLtcM3H} m³/h</strong>
                  </div>
                  <span className="text-[10px] text-slate-500 block">({result.displacementLtcCfm} CFM)</span>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                  <span className="text-amber-400 font-semibold block text-[11px]">Kompresor HTC ({REFRIGERANTS[htcRefrigerant].name})</span>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Efisiensi Volumetrik (ηv):</span>
                    <strong className="text-white">{(result.volumetricEfficiencyHtc * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Laju Displacement:</span>
                    <strong className="text-amber-300">{result.displacementHtcM3H} m³/h</strong>
                  </div>
                  <span className="text-[10px] text-slate-500 block">({result.displacementHtcCfm} CFM)</span>
                </div>
              </div>
            </div>
          </div>

          {/* COP Optimization Curve Visualizer (IIR Study Proof) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Kurva Optimasi COP vs Suhu Kaskade (Tcc)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Kajian IIR (&lt;2% Deviasi)</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Grafik di bawah memperlihatkan bagaimana COP berubah terhadap variasi suhu antara <code className="text-cyan-300">Tcc</code>. Titik tertinggi berada tepat di sekitar rata-rata geometrik <code className="text-cyan-300">√(Te · Tc) = {result.tccOptCarnotC}°C</code>:
            </p>

            {/* SVG Line Chart */}
            <div className="w-full h-44 bg-slate-950 rounded border border-slate-800/80 p-2 relative flex items-end">
              <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                {/* Horizontal grid lines */}
                <line x1="30" y1="20" x2="480" y2="20" stroke="#1e293b" stroke-dasharray="2 2" />
                <line x1="30" y1="70" x2="480" y2="70" stroke="#1e293b" stroke-dasharray="2 2" />
                <line x1="30" y1="120" x2="480" y2="120" stroke="#1e293b" stroke-dasharray="2 2" />

                {/* Plot points and polyline */}
                {(() => {
                  if (copCurvePoints.length < 2) return null;
                  const cops = copCurvePoints.map((p) => p.cop);
                  const minCop = Math.min(...cops) * 0.95;
                  const maxCop = Math.max(...cops) * 1.05;
                  const copRange = maxCop - minCop || 1;

                  const coords = copCurvePoints.map((p, idx) => {
                    const x = 40 + (idx / (copCurvePoints.length - 1)) * 430;
                    const y = 135 - ((p.cop - minCop) / copRange) * 115;
                    return { x, y, ...p };
                  });

                  const pointsString = coords.map((c) => `${c.x},${c.y}`).join(' ');

                  return (
                    <g>
                      {/* Gradient area under curve */}
                      <polygon
                        points={`40,140 ${pointsString} ${coords[coords.length - 1].x},140`}
                        fill="#0891b2"
                        fillOpacity="0.12"
                      />
                      {/* Line */}
                      <polyline
                        points={pointsString}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="2.5"
                      />
                      {/* Circles */}
                      {coords.map((c, i) => (
                        <g key={i}>
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={c.isCarnotOpt ? 5 : 2.5}
                            fill={c.isCarnotOpt ? '#f59e0b' : '#38bdf8'}
                            stroke="#0f172a"
                            strokeWidth="1.5"
                          />
                          {c.isCarnotOpt && (
                            <text
                              x={c.x}
                              y={c.y - 10}
                              fill="#fbbf24"
                              fontSize="10"
                              fontFamily="'JetBrains Mono', monospace"
                              textAnchor="middle"
                              fontWeight="bold"
                            >
                              Opt: {c.cop}
                            </text>
                          )}
                        </g>
                      ))}
                    </g>
                  );
                })()}
              </svg>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
              <span>Suhu Kaskade Rendah</span>
              <span className="text-amber-400 font-semibold">● Titik Optimum Geometrik</span>
              <span>Suhu Kaskade Tinggi</span>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        reportTitle={`Laporan Sistem Kaskade - ${ltcInfo.name}/${htcInfo.name}`}
        messageText={waReportMessage}
      />
    </div>
  );
};
