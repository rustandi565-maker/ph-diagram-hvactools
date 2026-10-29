import React from 'react';
import { CascadeCycleResult, RefrigerantId } from '../types/cascade';
import { REFRIGERANTS } from '../utils/refrigerantData';

interface CascadeDiagramProps {
  result: CascadeCycleResult;
  ltcRefrigerant: RefrigerantId;
  htcRefrigerant: RefrigerantId;
}

export const CascadeDiagram: React.FC<CascadeDiagramProps> = ({
  result,
  ltcRefrigerant,
  htcRefrigerant,
}) => {
  const ltcRef = REFRIGERANTS[ltcRefrigerant];
  const htcRef = REFRIGERANTS[htcRefrigerant];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Skema Alir Termodinamika Sistem Kaskade 2-Tahap
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-cyan-400">Sirkuit Bawah (LTC): {ltcRef.name}</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400">Sirkuit Atas (HTC): {htcRef.name}</span>
        </div>
      </div>

      {/* SVG Diagram */}
      <div className="w-full overflow-x-auto bg-slate-950 rounded border border-slate-800/80 p-2">
        <svg
          viewBox="0 0 920 420"
          className="w-full min-w-[760px] h-auto font-sans select-none"
        >
          <defs>
            {/* Markers */}
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#22d3ee" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f59e0b" />
            </marker>
            <linearGradient id="hxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0891b2" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#d97706" stop-opacity="0.3" />
            </linearGradient>
          </defs>

          {/* ================= BACKGROUND ZONES ================= */}
          {/* LTC Zone */}
          <rect x="30" y="20" width="370" height="380" rx="8" fill="#082f49" fill-opacity="0.12" stroke="#0284c7" stroke-dasharray="4 4" stroke-opacity="0.4" />
          <text x="45" y="44" fill="#38bdf8" font-size="12" font-family="'JetBrains Mono', monospace" font-weight="700">SIRKUIT SUHU RENDAH (LTC)</text>
          <text x="45" y="60" fill="#94a3b8" font-size="11" font-family="'JetBrains Mono', monospace">Fluida: {ltcRef.name} ({ltcRef.chemicalFormula})</text>

          {/* HTC Zone */}
          <rect x="520" y="20" width="370" height="380" rx="8" fill="#451a03" fill-opacity="0.12" stroke="#d97706" stroke-dasharray="4 4" stroke-opacity="0.4" />
          <text x="535" y="44" fill="#fbbf24" font-size="12" font-family="'JetBrains Mono', monospace" font-weight="700">SIRKUIT SUHU TINGGI (HTC)</text>
          <text x="535" y="60" fill="#94a3b8" font-size="11" font-family="'JetBrains Mono', monospace">Fluida: {htcRef.name} ({htcRef.chemicalFormula})</text>

          {/* ================= LTC LOOP (LEFT) ================= */}
          {/* LTC Evaporator (Bottom Left) */}
          <g transform="translate(60, 270)">
            <rect width="130" height="65" rx="6" fill="#042f2e" stroke="#14b8a6" stroke-width="2" />
            <text x="65" y="24" fill="#5eead4" font-size="12" font-weight="bold" text-anchor="middle">EVAPORATOR</text>
            <text x="65" y="42" fill="#e2e8f0" font-size="11" font-family="'JetBrains Mono', monospace" text-anchor="middle">Te = {result.teC}°C</text>
            <text x="65" y="56" fill="#94a3b8" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">Pe = {result.pEvapLtcBar} bar</text>

            {/* Heat Inflow Q_e */}
            <path d="M 65 95 L 65 72" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#arrow-cyan)" />
            <text x="65" y="112" fill="#38bdf8" font-size="11" font-family="'JetBrains Mono', monospace" font-weight="bold" text-anchor="middle">Qe = {result.coolingCapacityKw} kW</text>
          </g>

          {/* LTC Compressor (Top Left) */}
          <g transform="translate(60, 95)">
            <path d="M 20 60 L 110 60 L 95 10 L 35 10 Z" fill="#0f172a" stroke="#06b6d4" stroke-width="2" />
            <text x="65" y="38" fill="#22d3ee" font-size="11" font-weight="bold" text-anchor="middle">KOMPRESOR LTC</text>
            <text x="65" y="52" fill="#e2e8f0" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">W = {result.workCompLtcKw} kW</text>
          </g>

          {/* LTC Expansion Valve (Bottom Center) */}
          <g transform="translate(260, 285)">
            <polygon points="0,0 30,15 30,0 0,15" fill="#0f172a" stroke="#06b6d4" stroke-width="2" transform="translate(0, 10)" />
            <text x="15" y="45" fill="#94a3b8" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">Katup Ekspansi</text>
          </g>

          {/* LTC Piping Lines */}
          {/* Evap -> Comp (Suction) */}
          <path d="M 95 270 L 95 160" stroke="#06b6d4" stroke-width="3" marker-end="url(#arrow-cyan)" />
          <text x="80" y="215" fill="#22d3ee" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="end">Uap Jenuh</text>

          {/* Comp -> Cascade Condenser (Discharge) */}
          <path d="M 95 95 L 95 80 L 380 80 L 380 120" stroke="#06b6d4" stroke-width="3" marker-end="url(#arrow-cyan)" />
          <text x="230" y="73" fill="#22d3ee" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">Gas Panas (Pc = {result.pCondLtcBar} bar)</text>

          {/* Cascade Condenser -> Expansion Valve (Liquid) */}
          <path d="M 380 240 L 380 292 L 295 292" stroke="#06b6d4" stroke-width="3" marker-end="url(#arrow-cyan)" />
          <text x="340" y="310" fill="#22d3ee" font-size="10" font-family="'JetBrains Mono', monospace">Cairan LTC</text>

          {/* Expansion Valve -> Evap */}
          <path d="M 260 292 L 195 292" stroke="#06b6d4" stroke-width="3" marker-end="url(#arrow-cyan)" />

          {/* ================= CASCADE HEAT EXCHANGER (CENTER) ================= */}
          <g transform="translate(370, 120)">
            <rect width="180" height="120" rx="8" fill="url(#hxGrad)" stroke="#38bdf8" stroke-width="2" />
            <text x="90" y="25" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle">PENUKAR KALOR KASKADE</text>
            <text x="90" y="42" fill="#94a3b8" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">Cascade Condenser / Evaporator</text>

            {/* Heat flux arrow */}
            <path d="M 40 65 L 140 65" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4 2" marker-end="url(#arrow-amber)" />
            <text x="90" y="60" fill="#fbbf24" font-size="11" font-family="'JetBrains Mono', monospace" font-weight="bold" text-anchor="middle">Qcc = {result.cascadeCondenserLoadKw} kW</text>

            {/* Temp Details */}
            <text x="90" y="85" fill="#38bdf8" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">Kondensasi LTC: {result.tCondLtcC}°C</text>
            <text x="90" y="100" fill="#f59e0b" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">Evaporasi HTC: {result.tEvapHtcC}°C</text>
            <text x="90" y="113" fill="#cbd5e1" font-size="9" font-family="'JetBrains Mono', monospace" text-anchor="middle">(ΔTcc = {result.deltaTcc}°C)</text>
          </g>

          {/* ================= HTC LOOP (RIGHT) ================= */}
          {/* HTC Compressor (Top Right) */}
          <g transform="translate(730, 95)">
            <path d="M 20 60 L 110 60 L 95 10 L 35 10 Z" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
            <text x="65" y="38" fill="#fbbf24" font-size="11" font-weight="bold" text-anchor="middle">KOMPRESOR HTC</text>
            <text x="65" y="52" fill="#e2e8f0" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">W = {result.workCompHtcKw} kW</text>
          </g>

          {/* Ambient Condenser (Bottom Right) */}
          <g transform="translate(730, 270)">
            <rect width="130" height="65" rx="6" fill="#451a03" stroke="#f59e0b" stroke-width="2" />
            <text x="65" y="24" fill="#fbbf24" font-size="12" font-weight="bold" text-anchor="middle">KONDENSOR ATAS</text>
            <text x="65" y="42" fill="#e2e8f0" font-size="11" font-family="'JetBrains Mono', monospace" text-anchor="middle">Tc = {result.tcC}°C</text>
            <text x="65" y="56" fill="#94a3b8" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">Pc = {result.pCondHtcBar} bar</text>

            {/* Heat Outflow Q_cond */}
            <path d="M 65 65 L 65 92" stroke="#f59e0b" stroke-width="2.5" marker-end="url(#arrow-amber)" />
            <text x="65" y="112" fill="#f59e0b" font-size="11" font-family="'JetBrains Mono', monospace" font-weight="bold" text-anchor="middle">Q_buang = {result.ambientCondenserHeatRejectedKw} kW</text>
          </g>

          {/* HTC Expansion Valve (Bottom Center-Right) */}
          <g transform="translate(620, 285)">
            <polygon points="30,0 0,15 0,0 30,15" fill="#0f172a" stroke="#f59e0b" stroke-width="2" transform="translate(0, 10)" />
            <text x="15" y="45" fill="#94a3b8" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">Katup Ekspansi</text>
          </g>

          {/* HTC Piping Lines */}
          {/* Cascade Evap -> HTC Compressor */}
          <path d="M 540 140 L 670 140 L 730 140" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrow-amber)" />
          <text x="630" y="132" fill="#fbbf24" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">Uap HTC (Pe = {result.pEvapHtcBar} bar)</text>

          {/* HTC Compressor -> Ambient Condenser */}
          <path d="M 800 160 L 800 270" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrow-amber)" />
          <text x="812" y="215" fill="#fbbf24" font-size="10" font-family="'JetBrains Mono', monospace">Discharge Pc</text>

          {/* Ambient Condenser -> Expansion Valve */}
          <path d="M 730 292 L 655 292" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrow-amber)" />
          <text x="690" y="310" fill="#fbbf24" font-size="10" font-family="'JetBrains Mono', monospace">Cairan</text>

          {/* Expansion Valve -> Cascade Evaporator */}
          <path d="M 620 292 L 540 292 L 540 240" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrow-amber)" />
        </svg>
      </div>

      {/* Legend summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1 text-slate-400">
        <div className="bg-slate-950 p-2 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block">Laju Massa LTC (ṁ_LTC)</span>
          <span className="font-bold text-cyan-400">{result.massFlowLtcKgS} kg/s</span> ({result.massFlowLtcKgH} kg/h)
        </div>
        <div className="bg-slate-950 p-2 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block">Laju Massa HTC (ṁ_HTC)</span>
          <span className="font-bold text-amber-400">{result.massFlowHtcKgS} kg/s</span> ({result.massFlowHtcKgH} kg/h)
        </div>
        <div className="bg-slate-950 p-2 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block">Rasio Tekanan LTC</span>
          <span className="font-bold text-white">{result.pressureRatioLtc} : 1</span>
        </div>
        <div className="bg-slate-950 p-2 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block">Rasio Tekanan HTC</span>
          <span className="font-bold text-white">{result.pressureRatioHtc} : 1</span>
        </div>
      </div>
    </div>
  );
};
