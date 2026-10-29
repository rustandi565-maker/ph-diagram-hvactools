import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ExtendedRefrigerantId } from '../types/phDiagram';
import {
  EXTENDED_REFRIGERANTS,
  getRefSaturationPressure,
  getRefLiquidEnthalpy,
  getRefVaporEnthalpy,
  getRefLiquidSpecificVolume,
  getRefVaporSpecificVolume,
} from '../utils/phThermodynamics';
import { AppLanguage } from '../utils/i18n';

export interface SaturationTableRow {
  tC: number;
  pBar: number;
  vl: number; // dm3/kg
  vg: number; // m3/kg
  hl: number; // kJ/kg
  hg: number; // kJ/kg
  r: number;  // kJ/kg (Latent heat = hg - hl)
  sl: number; // kJ/(kg K)
  sg: number; // kJ/(kg K)
}

// Fluid constant for entropy calculation under IIR reference standard
const REF_CPF: Record<string, number> = {
  R410A: 1.75,
  R32: 2.15,
  R134a: 1.41,
  R404A: 1.54,
  R448A: 1.54,
  R717: 4.75,
  R744: 2.30,
  R290: 2.65,
  R600a: 2.45,
  R22: 1.36,
  R507A: 1.55,
  R407C: 1.52,
  R1234yf: 1.40,
  R1234ze: 1.39,
  R23: 1.45,
  R41: 1.82,
  R114: 1.01,
  R12: 0.98,
  R1270: 2.70,
};

export function calculateSaturationRow(refId: ExtendedRefrigerantId, tempC: number): SaturationTableRow {
  const meta = EXTENDED_REFRIGERANTS[refId] ?? EXTENDED_REFRIGERANTS.R410A;
  const tcrit = meta.tcritC;
  const safeT = Math.min(tcrit - 0.05, tempC);
  const pBar = getRefSaturationPressure(refId, safeT);
  const hl = getRefLiquidEnthalpy(refId, safeT);
  const hg = getRefVaporEnthalpy(refId, safeT);
  const r = Math.max(0, hg - hl);
  const vl = getRefLiquidSpecificVolume(refId, safeT);
  const vg = getRefVaporSpecificVolume(refId, safeT);

  const cpf = REF_CPF[refId] ?? 1.50;
  const tK = safeT + 273.15;
  // Standard IIR reference convention: sf = 1.000 kJ/(kg·K) at 0°C (273.15 K)
  const sl = 1.000 + cpf * Math.log(Math.max(100, tK) / 273.15);
  const sg = sl + r / Math.max(1, tK);

  return {
    tC: tempC,
    pBar: Number(pBar.toFixed(3)),
    vl: Number(vl.toFixed(3)),
    vg: Number(vg.toFixed(4)),
    hl: Number(hl.toFixed(1)),
    hg: Number(hg.toFixed(1)),
    r: Number(r.toFixed(1)),
    sl: Number(sl.toFixed(3)),
    sg: Number(sg.toFixed(3)),
  };
}

export interface RefrigerantSaturationTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRefrigerantId?: ExtendedRefrigerantId;
  onSelectRefrigerant?: (refId: ExtendedRefrigerantId) => void;
  language?: AppLanguage;
  unitSystem?: 'SI' | 'Imperial';
}

export const RefrigerantSaturationTableModal: React.FC<RefrigerantSaturationTableModalProps> = ({
  isOpen,
  onClose,
  defaultRefrigerantId = 'R410A',
  onSelectRefrigerant,
  language = 'id',
  unitSystem = 'SI',
}) => {
  const isImp = unitSystem === 'Imperial';
  const isEn = language === 'en';
  const [selectedRefId, setSelectedRefId] = useState<ExtendedRefrigerantId>(defaultRefrigerantId);
  const [fineTempInput, setFineTempInput] = useState<string>(isImp ? '32' : '0');
  const [copiedRowText, setCopiedRowText] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'evap' | 'cond'>('all');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Sync default refrigerant if prop updates
  useEffect(() => {
    if (defaultRefrigerantId) {
      setSelectedRefId(defaultRefrigerantId);
    }
  }, [defaultRefrigerantId]);

  // Adjust default input when unitSystem switches
  useEffect(() => {
    setFineTempInput(isImp ? '32' : '0');
  }, [isImp]);

  const meta = useMemo(() => {
    return EXTENDED_REFRIGERANTS[selectedRefId] ?? EXTENDED_REFRIGERANTS.R410A;
  }, [selectedRefId]);

  // Generate complete saturation table rows (from -50°C to near Tcrit in 1°C steps)
  const allRows = useMemo(() => {
    const rows: SaturationTableRow[] = [];
    const minT = -50;
    const maxT = Math.min(65, Math.floor(meta.tcritC - 1));
    for (let t = minT; t <= maxT; t += 1) {
      rows.push(calculateSaturationRow(selectedRefId, t));
    }
    return rows;
  }, [selectedRefId, meta.tcritC]);

  // Filtered rows for fast review
  const displayRows = useMemo(() => {
    if (filterMode === 'evap') {
      return allRows.filter((r) => r.tC <= 15);
    }
    if (filterMode === 'cond') {
      return allRows.filter((r) => r.tC >= 20);
    }
    return allRows;
  }, [allRows, filterMode]);

  // Fine temperature parsed value & calculated dynamic row
  const parsedInputNumber = useMemo(() => {
    const val = parseFloat(fineTempInput);
    return isNaN(val) ? 0 : val;
  }, [fineTempInput]);

  // Temperature converted to Celsius for calculation
  const parsedTempC = useMemo(() => {
    if (isImp) {
      // Input is in Fahrenheit -> convert to Celsius
      return (parsedInputNumber - 32) / 1.8;
    }
    return parsedInputNumber;
  }, [parsedInputNumber, isImp]);

  const fineCalculatedRow = useMemo(() => {
    return calculateSaturationRow(selectedRefId, parsedTempC);
  }, [selectedRefId, parsedTempC]);

  // Find nearest row in full list
  const nearestRowIndex = useMemo(() => {
    let bestIdx = 0;
    let bestDiff = 9999;
    displayRows.forEach((r, idx) => {
      const diff = Math.abs(r.tC - parsedTempC);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [displayRows, parsedTempC]);

  // Scroll to nearest row when typing fine temperature
  useEffect(() => {
    if (!isOpen || !tableContainerRef.current) return;
    const rowEl = document.getElementById(`sat-row-${nearestRowIndex}`);
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [nearestRowIndex, isOpen]);

  // Preset quick temperature chips
  const quickChipsC = [-40, -30, -20, -10, -5, 0, 5, 10, 20, 35, 45, 50, 55];
  const quickChipsF = [-40, -22, -4, 14, 23, 32, 41, 50, 68, 95, 113, 122, 131];
  const quickChips = isImp ? quickChipsF : quickChipsC;

  // Formatters according to active unitSystem
  const formatT = (tC: number) => {
    if (isImp) return (tC * 1.8 + 32).toFixed(1);
    return tC.toString();
  };

  const formatP = (pBar: number) => {
    if (isImp) return (pBar * 14.5038).toFixed(1);
    return pBar.toFixed(3);
  };

  const formatVl = (vlDm3: number) => {
    if (isImp) return (vlDm3 * 0.0160185).toFixed(4); // dm3/kg to ft3/lb
    return vlDm3.toFixed(3);
  };

  const formatVg = (vgM3: number) => {
    if (isImp) return (vgM3 * 16.0185).toFixed(4); // m3/kg to ft3/lb
    return vgM3.toFixed(4);
  };

  const formatH = (hKj: number) => {
    if (isImp) return (hKj * 0.429923).toFixed(1);
    return hKj.toFixed(1);
  };

  const formatR = (rKj: number) => {
    if (isImp) return (rKj * 0.429923).toFixed(1);
    return rKj.toFixed(1);
  };

  const formatS = (sKj: number) => {
    if (isImp) return (sKj * 0.238846).toFixed(3);
    return sKj.toFixed(3);
  };

  const handleCopyRow = (row: SaturationTableRow) => {
    const text = isImp
      ? `${formatT(row.tC)}\t${formatP(row.pBar)}\t${formatVl(row.vl)}\t${formatVg(row.vg)}\t${formatH(row.hl)}\t${formatH(row.hg)}\t${formatR(row.r)}\t${formatS(row.sl)}\t${formatS(row.sg)}`
      : `${row.tC}\t${row.pBar}\t${row.vl}\t${row.vg}\t${row.hl}\t${row.hg}\t${row.r}\t${row.sl}\t${row.sg}`;
    navigator.clipboard.writeText(text);
    setCopiedRowText(`${formatT(row.tC)} ${isImp ? '°F' : '°C'}`);
    setTimeout(() => setCopiedRowText(null), 2000);
  };

  const handleExportCsv = () => {
    const headers = isImp
      ? ['T (deg F)', 'p (psi)', 'vl (ft3/lb)', 'vg (ft3/lb)', 'hl (Btu/lb)', 'hg (Btu/lb)', 'R (Btu/lb)', 'sl (Btu/lb-F)', 'sg (Btu/lb-F)']
      : ['T (deg C)', 'p (Bar)', 'vl (dm3/kg)', 'vg (m3/kg)', 'hl (kJ/kg)', 'hg (kJ/kg)', 'R (kJ/kg)', 'sl (kJ/(kg K))', 'sg (kJ/(kg K))'];
    const lines = [headers.join(',')];
    allRows.forEach((r) => {
      if (isImp) {
        lines.push(`${formatT(r.tC)},${formatP(r.pBar)},${formatVl(r.vl)},${formatVg(r.vg)},${formatH(r.hl)},${formatH(r.hg)},${formatR(r.r)},${formatS(r.sl)},${formatS(r.sg)}`);
      } else {
        lines.push(`${r.tC},${r.pBar},${r.vl},${r.vg},${r.hl},${r.hg},${r.r},${r.sl},${r.sg}`);
      }
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Saturation_Table_${selectedRefId}_${unitSystem}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0b101e] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#0e1628] border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-600/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-mono font-bold text-lg shadow-inner">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white font-mono tracking-tight">
                  {isEn ? `Refrigerant Saturation Table – ${selectedRefId}` : `Tabel Saturasi Refrigeran – ${selectedRefId}`}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {isEn ? 'CoolPack Standard Mollier Format' : 'Format Standar Solkane/CoolPack'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {isEn ? 'Formula:' : 'Rumus:'} <strong className="text-white">{meta.formula}</strong> · Tcrit: <strong className="text-amber-400">{isImp ? `${(meta.tcritC * 1.8 + 32).toFixed(1)}°F` : `${meta.tcritC}°C`}</strong> · Pcrit: <strong className="text-cyan-400">{isImp ? `${(meta.pcritBar * 14.5038).toFixed(1)} psi` : `${meta.pcritBar} bar`}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refrigerant Selector Dropdown inside Modal */}
            <div className="flex items-center gap-1.5 bg-[#070b15] border border-slate-700 px-2.5 py-1 rounded-lg">
              <span className="text-[11px] font-mono text-slate-400">{isEn ? 'Refrigerant:' : 'Refrigeran:'}</span>
              <select
                value={selectedRefId}
                onChange={(e) => {
                  const newRef = e.target.value as ExtendedRefrigerantId;
                  setSelectedRefId(newRef);
                  if (onSelectRefrigerant) onSelectRefrigerant(newRef);
                }}
                className="bg-transparent text-cyan-300 font-mono font-bold text-xs focus:outline-none cursor-pointer"
              >
                {(Object.keys(EXTENDED_REFRIGERANTS) as ExtendedRefrigerantId[]).map((rId) => (
                  <option key={rId} value={rId} className="bg-[#0b101e] text-white">
                    {rId} ({EXTENDED_REFRIGERANTS[rId]?.name.split('(')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1"
              title={isEn ? 'Download entire table as CSV' : 'Download Seluruh Tabel sebagai CSV'}
            >
              <span>📥</span>
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-900/80 hover:text-rose-200 text-slate-400 border border-slate-700 flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
              title={isEn ? 'Close' : 'Tutup'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================= KONTROL FINE (CARI / KETIK SUHU) ================= */}
        <div className="px-4 py-3 bg-[#070b15] border-b border-slate-800 space-y-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Fine Input Field */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 shrink-0">
                <span>{isEn ? '🔍 FINE CONTROL / ENTER TEMP:' : '🔍 KONTROL FINE / KETIK SUHU:'}</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.1"
                  value={fineTempInput}
                  onChange={(e) => setFineTempInput(e.target.value)}
                  placeholder={isImp ? 'e.g. 32, 45, 110' : 'misal: 0, 5, 45'}
                  className="w-36 bg-[#0e1628] border-2 border-cyan-500 rounded-lg px-3 py-1.5 text-white font-mono font-extrabold text-sm focus:ring-2 focus:ring-cyan-400 outline-none pr-8 text-right shadow-inner shadow-cyan-950/50"
                />
                <span className="absolute right-2.5 text-cyan-400 font-mono text-xs font-bold pointer-events-none">
                  {isImp ? '°F' : '°C'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFineTempInput((prev) => (parseFloat(prev || '0') - 1).toFixed(1))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs border border-slate-700 flex items-center justify-center cursor-pointer"
                  title={isImp ? '-1 °F' : '-1 °C'}
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => setFineTempInput((prev) => (parseFloat(prev || '0') + 1).toFixed(1))}
                  className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs border border-slate-700 flex items-center justify-center cursor-pointer"
                  title={isImp ? '+1 °F' : '+1 °C'}
                >
                  +1
                </button>
              </div>
            </div>

            {/* Range Presets Tabs */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400 text-[11px] hidden sm:inline">{isEn ? 'Filter Range:' : 'Filter Area:'}</span>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border transition-colors ${
                  filterMode === 'all'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/80 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {isEn
                  ? `All Temperatures (${isImp ? '-58 to 150°F' : '-50 to 65°C'})`
                  : `Semua Suhu (${isImp ? '-58 s/d 150°F' : '-50 s/d 65°C'})`}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('evap')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border transition-colors ${
                  filterMode === 'evap'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/80 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {isEn ? 'Evaporator (≤ 60°F / 15°C)' : 'Evaporator (≤ 15°C)'}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('cond')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border transition-colors ${
                  filterMode === 'cond'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/80 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {isEn ? 'Condenser (≥ 70°F / 20°C)' : 'Kondensor (≥ 20°C)'}
              </button>
            </div>
          </div>

          {/* Quick preset temperature chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-mono text-slate-400">{isEn ? 'Quick Presets:' : 'Pilihan Cepat:'}</span>
            {quickChips.map((chip) => {
              const chipTempC = isImp ? (chip - 32) / 1.8 : chip;
              if (chipTempC >= meta.tcritC - 0.5) return null;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setFineTempInput(String(chip))}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all cursor-pointer border ${
                    parsedInputNumber === chip
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {chip > 0 ? `+${chip}` : chip}{isImp ? '°F' : '°C'}
                </button>
              );
            })}
          </div>

          {/* ================= INSTANT RESULT BANNER MATCHING THE TABLE EXACTLY ================= */}
          <div className="bg-[#0e1628] border-2 border-amber-500/80 rounded-lg p-2.5 shadow-lg">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs font-mono">
              <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                {isEn
                  ? `INTERPOLATED & CALCULATED VALUES FOR T = ${formatT(fineCalculatedRow.tC)} ${isImp ? '°F' : '°C'}`
                  : `HASIL INTERPOLASI & PERHITUNGAN SUHU T = ${formatT(fineCalculatedRow.tC)} ${isImp ? '°F' : '°C'}`}
              </span>
              <button
                type="button"
                onClick={() => handleCopyRow(fineCalculatedRow)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] border border-slate-700 cursor-pointer font-bold flex items-center gap-1"
              >
                <span>
                  {copiedRowText === `${formatT(fineCalculatedRow.tC)} ${isImp ? '°F' : '°C'}`
                    ? (isEn ? '✓ Copied!' : '✓ Tersalin!')
                    : (isEn ? '📋 Copy This Row' : '📋 Salin Baris Ini')}
                </span>
              </button>
            </div>

            {/* Exactly matching screenshot columns: T | p | vl | vg | hl | hg | R | sl | sg */}
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-center font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 text-[11px] border-b border-slate-700/60">
                    <th className="py-1 px-2 font-bold text-white bg-slate-900/60">{isImp ? 'T (°F)' : 'T (°C)'}</th>
                    <th className="py-1 px-2 font-bold text-cyan-300 bg-slate-900/60">{isImp ? 'p (psi)' : 'p (Bar)'}</th>
                    <th className="py-1 px-2 font-bold text-slate-300 bg-slate-900/60">{isImp ? 'vl (ft³/lb)' : 'vl (dm³/kg)'}</th>
                    <th className="py-1 px-2 font-bold text-slate-300 bg-slate-900/60">{isImp ? 'vg (ft³/lb)' : 'vg (m³/kg)'}</th>
                    <th className="py-1 px-2 font-bold text-emerald-300 bg-slate-900/60">{isImp ? 'hl (Btu/lb)' : 'hl (kJ/kg)'}</th>
                    <th className="py-1 px-2 font-bold text-emerald-300 bg-slate-900/60">{isImp ? 'hg (Btu/lb)' : 'hg (kJ/kg)'}</th>
                    <th className="py-1 px-2 font-bold text-amber-300 bg-slate-900/60">{isImp ? 'R (Btu/lb)' : 'R (kJ/kg)'}</th>
                    <th className="py-1 px-2 font-bold text-blue-300 bg-slate-900/60">{isImp ? 'sl (Btu/lb·°F)' : 'sl (kJ/kg·K)'}</th>
                    <th className="py-1 px-2 font-bold text-blue-300 bg-slate-900/60">{isImp ? 'sg (Btu/lb·°F)' : 'sg (kJ/kg·K)'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-amber-950/25 text-white font-bold text-sm">
                    <td className="py-1.5 px-2 text-amber-300">{formatT(fineCalculatedRow.tC)}</td>
                    <td className="py-1.5 px-2 text-cyan-300">{formatP(fineCalculatedRow.pBar)}</td>
                    <td className="py-1.5 px-2 text-slate-200">{formatVl(fineCalculatedRow.vl)}</td>
                    <td className="py-1.5 px-2 text-slate-200">{formatVg(fineCalculatedRow.vg)}</td>
                    <td className="py-1.5 px-2 text-emerald-400">{formatH(fineCalculatedRow.hl)}</td>
                    <td className="py-1.5 px-2 text-emerald-400">{formatH(fineCalculatedRow.hg)}</td>
                    <td className="py-1.5 px-2 text-amber-400">{formatR(fineCalculatedRow.r)}</td>
                    <td className="py-1.5 px-2 text-blue-400">{formatS(fineCalculatedRow.sl)}</td>
                    <td className="py-1.5 px-2 text-blue-400">{formatS(fineCalculatedRow.sg)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ================= MAIN SATURATION TABLE (FAITHFUL TO SCREENSHOT) ================= */}
        <div ref={tableContainerRef} className="flex-1 overflow-y-auto overflow-x-auto p-2 bg-[#080d1a]">
          <table className="w-full text-center font-mono text-xs border-collapse">
            <thead className="sticky top-0 bg-[#0e1628] z-10 shadow-md">
              {/* Row 1: Symbol Header */}
              <tr className="border-b border-slate-700 text-slate-200">
                <th className="py-2 px-2.5 font-bold border-r border-slate-800 text-amber-300">T</th>
                <th className="py-2 px-2.5 font-bold border-r border-slate-800 text-cyan-300">p</th>
                <th className="py-2 px-2.5 font-bold border-r border-slate-800">v<sub>l</sub></th>
                <th className="py-2 px-2.5 font-bold border-r border-slate-800">v<sub>g</sub></th>
                <th className="py-2 px-2.5 font-bold border-r border-slate-800 text-emerald-300">h<sub>l</sub></th>
                <th className="py-2 px-2.5 font-bold border-r border-slate-800 text-emerald-300">h<sub>g</sub></th>
                <th className="py-2 px-2.5 font-bold border-r border-slate-800 text-amber-300">R</th>
                <th className="py-2 px-2.5 font-bold border-r border-slate-800 text-blue-300">s<sub>l</sub></th>
                <th className="py-2 px-2.5 font-bold border-r border-slate-800 text-blue-300">s<sub>g</sub></th>
                <th className="py-2 px-2 font-normal text-[10px] text-slate-400">{isEn ? 'Action' : 'Aksi'}</th>
              </tr>
              {/* Row 2: Unit Header (Exact match to image_9b868ee6.png!) */}
              <tr className="border-b-2 border-slate-700 bg-[#090f1d] text-[11px] text-slate-400">
                <th className="py-1 px-2.5 border-r border-slate-800 font-semibold text-amber-400">{isImp ? '°F' : '°C'}</th>
                <th className="py-1 px-2.5 border-r border-slate-800 font-semibold text-cyan-400">{isImp ? 'psi' : 'Bar'}</th>
                <th className="py-1 px-2.5 border-r border-slate-800 font-semibold">{isImp ? 'ft³/lb' : 'dm³/kg'}</th>
                <th className="py-1 px-2.5 border-r border-slate-800 font-semibold">{isImp ? 'ft³/lb' : 'm³/kg'}</th>
                <th className="py-1 px-2.5 border-r border-slate-800 font-semibold text-emerald-400">{isImp ? 'Btu/lb' : 'kJ/kg'}</th>
                <th className="py-1 px-2.5 border-r border-slate-800 font-semibold text-emerald-400">{isImp ? 'Btu/lb' : 'kJ/kg'}</th>
                <th className="py-1 px-2.5 border-r border-slate-800 font-semibold text-amber-400">{isImp ? 'Btu/lb' : 'kJ/kg'}</th>
                <th className="py-1 px-2.5 border-r border-slate-800 font-semibold text-blue-400">{isImp ? 'Btu/(lb·°F)' : 'kJ/(kg K)'}</th>
                <th className="py-1 px-2.5 border-r border-slate-800 font-semibold text-blue-400">{isImp ? 'Btu/(lb·°F)' : 'kJ/(kg K)'}</th>
                <th className="py-1 px-2 text-[10px]">{isEn ? 'Copy' : 'Salin'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {displayRows.map((row, idx) => {
                const isNearest = idx === nearestRowIndex;
                const isZero = row.tC === 0;
                return (
                  <tr
                    key={`row-${row.tC}`}
                    id={`sat-row-${idx}`}
                    className={`transition-colors cursor-pointer ${
                      isNearest
                        ? 'bg-amber-950/40 text-amber-200 ring-2 ring-amber-500 font-bold'
                        : isZero
                        ? 'bg-cyan-950/30 text-white font-semibold'
                        : idx % 2 === 0
                        ? 'bg-[#080d1a] hover:bg-slate-800/60'
                        : 'bg-[#0a1020] hover:bg-slate-800/60'
                    }`}
                    onClick={() => setFineTempInput(formatT(row.tC))}
                  >
                    <td className={`py-1.5 px-2.5 border-r border-slate-800/80 ${isNearest ? 'text-amber-300 font-extrabold' : 'text-amber-400'}`}>
                      {formatT(row.tC)}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800/80 text-cyan-300 font-medium">
                      {formatP(row.pBar)}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800/80 text-slate-300">
                      {formatVl(row.vl)}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800/80 text-slate-300">
                      {formatVg(row.vg)}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800/80 text-emerald-400">
                      {formatH(row.hl)}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800/80 text-emerald-400">
                      {formatH(row.hg)}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800/80 text-amber-300 font-medium">
                      {formatR(row.r)}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800/80 text-blue-300">
                      {formatS(row.sl)}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-800/80 text-blue-300">
                      {formatS(row.sg)}
                    </td>
                    <td className="py-1.5 px-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyRow(row);
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                        title={isEn ? 'Copy this row' : 'Salin baris ini'}
                      >
                        {copiedRowText === `${formatT(row.tC)} ${isImp ? '°F' : '°C'}` ? '✓' : (isEn ? 'Copy' : 'Salin')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 bg-[#0e1628] border-t border-slate-800 text-xs font-mono gap-2 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {isEn
                ? <>Note: <strong>R = Latent Heat of Evaporation (h<sub>g</sub> - h<sub>l</sub>)</strong></>
                : <>Keterangan: <strong>R = Panas Laten Penguapan (h<sub>g</sub> - h<sub>l</sub>)</strong></>}
            </span>
            <span>·</span>
            <span>
              {isEn
                ? 'Reference: IIR Standard (hl=200 kJ/kg, sl=1.000 kJ/kg·K at 0°C)'
                : 'Referensi: Standar IIR (hl=200 kJ/kg, sl=1.000 kJ/kg·K pada 0°C)'}
            </span>
          </div>
          <div>
            {isEn ? 'Total entries:' : 'Total data:'}{' '}
            <strong className="text-white">{displayRows.length} {isEn ? 'rows' : 'baris'}</strong>
          </div>
        </div>

      </div>
    </div>
  );
};
