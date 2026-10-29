import React, { useState } from 'react';
import {
  EvaporatorCoilCalculationResult,
  EvaporatorCoilInputs,
} from '../types/evaporatorCoil';

interface EvaporatorCoilDiagramProps {
  inputs: EvaporatorCoilInputs;
  result: EvaporatorCoilCalculationResult;
}

type DiagramFocusPart =
  | 'overview'
  | 'coil'
  | 'distributor'
  | 'water_inlet'
  | 'water_outlet'
  | 'suction_header'
  | 'tank_body'
  | 'agitator';

export const EvaporatorCoilDiagram: React.FC<EvaporatorCoilDiagramProps> = ({
  inputs,
  result,
}) => {
  const [activePart, setActivePart] = useState<DiagramFocusPart>('overview');
  const [showFlowAnimation, setShowFlowAnimation] = useState<boolean>(true);

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 520;

  // Colors based on material
  const pipeStrokeColor =
    inputs.pipeMaterial === 'copper_plain'
      ? '#f97316' // warm copper orange
      : inputs.pipeMaterial === 'copper_finned'
      ? '#fb923c' // golden copper
      : inputs.pipeMaterial === 'titanium'
      ? '#38bdf8' // titanium sky
      : '#cbd5e1'; // stainless steel silver

  const pipeFillColor =
    inputs.pipeMaterial === 'copper_plain'
      ? 'rgba(249, 115, 22, 0.15)'
      : inputs.pipeMaterial === 'copper_finned'
      ? 'rgba(251, 146, 60, 0.2)'
      : inputs.pipeMaterial === 'titanium'
      ? 'rgba(56, 189, 248, 0.15)'
      : 'rgba(203, 213, 225, 0.15)';

  // Calculate visual turns for SVG representation (between 6 and 14 for clean visual aesthetics)
  const visualTurns = Math.min(14, Math.max(6, result.coilTurnsCount));
  const coilTopY = 135;
  const coilBottomY = 390;
  const coilSpacing = (coilBottomY - coilTopY) / (visualTurns - 1);
  const coilLeftX = 270;
  const coilRightX = 570;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Diagram Toolbar */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
            📐 Diagram Visual Evaporator Coil & Convector Tank
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            {inputs.refrigerantId} • {result.nominalPipeSpec.nominalInch} ({inputs.pipeMaterial.replace('_', ' ').toUpperCase()})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFlowAnimation(!showFlowAnimation)}
            className={`px-2.5 py-1 text-[11px] rounded font-mono transition-colors flex items-center gap-1.5 border ${
              showFlowAnimation
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-600/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${showFlowAnimation ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
            {showFlowAnimation ? 'Animasi Aliran: Aktif' : 'Animasi Aliran: Jeda'}
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative bg-radial from-slate-900 via-slate-950 to-slate-950 p-3 sm:p-4 flex justify-center items-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[840px] h-auto select-none font-sans"
          style={{ minWidth: '600px' }}
        >
          <defs>
            {/* Water gradient in convector */}
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.55" />
            </linearGradient>

            {/* Refrigerant expansion color (evaporating 2-phase) */}
            <linearGradient id="refrigFlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>

            {/* Metal tank wall gradient */}
            <linearGradient id="tankWallGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Pattern for insulation */}
            <pattern id="insulationHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1" strokeOpacity="0.4" />
            </pattern>

            {/* Arrow marker for water and freon */}
            <marker id="arrowWater" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker id="arrowRefrig" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#06b6d4" />
            </marker>
            <marker id="arrowSuction" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#818cf8" />
            </marker>
          </defs>

          {/* Background grid markings */}
          <g opacity="0.07">
            {Array.from({ length: 17 }).map((_, i) => (
              <line key={`gx-${i}`} x1={i * 50} y1="0" x2={i * 50} y2={svgHeight} stroke="#38bdf8" strokeWidth="1" />
            ))}
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`gy-${i}`} x1="0" y1={i * 50} x2={svgWidth} y2={i * 50} stroke="#38bdf8" strokeWidth="1" />
            ))}
          </g>

          {/* TANK BODY (CONVECTOR VESSEL) */}
          <g
            className="cursor-pointer transition-opacity"
            onClick={() => setActivePart('tank_body')}
            opacity={activePart === 'overview' || activePart === 'tank_body' ? 1 : 0.4}
          >
            {/* Outer Insulation Shell */}
            <rect
              x="210"
              y="75"
              width="420"
              height="380"
              rx="18"
              fill="url(#insulationHatch)"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Tank Inner Wall */}
            <rect
              x="224"
              y="85"
              width="392"
              height="360"
              rx="12"
              fill="#0f172a"
              stroke="url(#tankWallGrad)"
              strokeWidth="4"
            />
            {/* Water Fill Area */}
            <rect
              x="228"
              y="110"
              width="384"
              height="330"
              rx="8"
              fill="url(#waterGrad)"
            />
            {/* Water Surface Wave Line */}
            <path
              d="M 228 110 Q 276 106, 324 110 T 420 110 T 516 110 T 612 110"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray={showFlowAnimation ? '4 2' : 'none'}
              opacity="0.8"
            />
            {/* Tank Tag Label */}
            <text x="420" y="102" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="600">
              CONVECTOR WATER TANK • V_est ≈ {result.convectorTankSuggestedVolumeLiters} Liter
            </text>
          </g>

          {/* WATER INLET PORT (Warm water coming in) */}
          <g
            className="cursor-pointer"
            onClick={() => setActivePart('water_inlet')}
            opacity={activePart === 'overview' || activePart === 'water_inlet' ? 1 : 0.4}
          >
            {/* Pipe inlet at top right */}
            <path d="M 690 125 L 612 125" fill="none" stroke="#38bdf8" strokeWidth="10" strokeLinecap="round" />
            <path d="M 680 125 L 620 125" fill="none" stroke="#0284c7" strokeWidth="6" markerEnd="url(#arrowWater)" />
            {/* Inlet badge */}
            <rect x="650" y="145" width="170" height="46" rx="6" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
            <text x="660" y="162" fill="#38bdf8" fontSize="11" fontWeight="700">
              💧 Air Masuk (Inlet)
            </text>
            <text x="660" y="180" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              T_in = {inputs.waterInletTempC}°C
              {inputs.calculationMode === 'continuous_flow' && ` (${inputs.waterFlowRateLpm} LPM)`}
            </text>
          </g>

          {/* WATER OUTLET PORT (Cold water leaving at bottom) */}
          <g
            className="cursor-pointer"
            onClick={() => setActivePart('water_outlet')}
            opacity={activePart === 'overview' || activePart === 'water_outlet' ? 1 : 0.4}
          >
            {/* Pipe outlet at bottom right */}
            <path d="M 612 400 L 690 400" fill="none" stroke="#0284c7" strokeWidth="10" strokeLinecap="round" />
            <path d="M 620 400 L 680 400" fill="none" stroke="#38bdf8" strokeWidth="6" markerEnd="url(#arrowWater)" />
            {/* Outlet badge */}
            <rect x="650" y="380" width="170" height="46" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="660" y="398" fill="#22d3ee" fontSize="11" fontWeight="700">
              ❄️ Air Dingin Keluar (Outlet)
            </text>
            <text x="660" y="415" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              T_out = {inputs.waterOutletTempC}°C (ΔT = {(inputs.waterInletTempC - inputs.waterOutletTempC).toFixed(1)}K)
            </text>
          </g>

          {/* AGITATOR / CIRCULATOR PROPELLER (if active) */}
          <g
            className="cursor-pointer"
            onClick={() => setActivePart('agitator')}
            opacity={activePart === 'overview' || activePart === 'agitator' ? 1 : 0.4}
          >
            {/* Agitator motor mount on top center */}
            <rect x="400" y="50" width="40" height="30" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            {/* Motor cooling fins */}
            <line x1="405" y1="55" x2="405" y2="75" stroke="#94a3b8" strokeWidth="1" />
            <line x1="415" y1="55" x2="415" y2="75" stroke="#94a3b8" strokeWidth="1" />
            <line x1="425" y1="55" x2="425" y2="75" stroke="#94a3b8" strokeWidth="1" />
            <line x1="435" y1="55" x2="435" y2="75" stroke="#94a3b8" strokeWidth="1" />
            {/* Agitator shaft down into water */}
            <line x1="420" y1="80" x2="420" y2="350" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
            {/* Impeller blades */}
            <g transform="translate(420, 340)">
              <ellipse cx="-20" cy="0" rx="18" ry="6" fill="#64748b" stroke="#cbd5e1" strokeWidth="1" transform="rotate(-15)" />
              <ellipse cx="20" cy="0" rx="18" ry="6" fill="#64748b" stroke="#cbd5e1" strokeWidth="1" transform="rotate(15)" />
              <circle cx="0" cy="0" r="5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
            </g>
            {/* Flow vortex cues around impeller */}
            {showFlowAnimation && (
              <g opacity="0.6">
                <path d="M 370 330 Q 360 360, 420 370 Q 480 360, 470 330" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3" />
                <path d="M 350 310 Q 330 360, 420 385 Q 510 360, 490 310" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
              </g>
            )}
            <text x="420" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              Agitator / Sirkulator Air
            </text>
          </g>

          {/* REFRIGERANT EXPANSION INLET & DISTRIBUTOR (Left side) */}
          <g
            className="cursor-pointer"
            onClick={() => setActivePart('distributor')}
            opacity={activePart === 'overview' || activePart === 'distributor' ? 1 : 0.4}
          >
            {/* Liquid Line from TXV */}
            <path d="M 40 180 L 120 180" fill="none" stroke="#0284c7" strokeWidth="5" />
            <path d="M 50 180 L 110 180" fill="none" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrowRefrig)" />

            {/* Thermal Expansion Valve (TXV) symbol */}
            <g transform="translate(75, 180)">
              {/* Bowtie valve */}
              <polygon points="-12,-8 -12,8 12,-8 12,8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
              {/* Sensing dome / head */}
              <circle cx="0" cy="-14" r="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="0" y1="-7" x2="0" y2="0" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="0" y="-23" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="700">
                TXV
              </text>
            </g>

            {/* Refrigerant Distributor Header Body */}
            <rect x="120" y="165" width="22" height="30" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
            <text x="131" y="184" textAnchor="middle" fill="#06b6d4" fontSize="8" fontWeight="bold">
              {result.recommendedCircuits}W
            </text>

            {/* Feeder spider capillary tubes to coil entry points */}
            {Array.from({ length: result.recommendedCircuits }).map((_, cIdx) => {
              const startY = 170 + (cIdx * 20) / Math.max(1, result.recommendedCircuits - 1);
              const targetY = coilTopY + (cIdx * 28);
              return (
                <path
                  key={`feeder-${cIdx}`}
                  d={`M 142 ${startY} Q 180 ${startY}, 210 ${targetY} L 270 ${targetY}`}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray={showFlowAnimation ? '3 2' : 'none'}
                />
              );
            })}

            {/* TXV & Distributor Callout Badge */}
            <rect x="15" y="85" width="180" height="60" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.2" />
            <text x="25" y="103" fill="#22d3ee" fontSize="11" fontWeight="700">
              Inlet Freon ({inputs.refrigerantId})
            </text>
            <text x="25" y="120" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              T_evap = {inputs.evaporatingTempC}°C
            </text>
            <text x="25" y="136" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
              {result.recommendedCircuits} Sirkuit Paralel (Distributor)
            </text>
          </g>

          {/* SUCTION OUTLET HEADER (Top left to Compressor) */}
          <g
            className="cursor-pointer"
            onClick={() => setActivePart('suction_header')}
            opacity={activePart === 'overview' || activePart === 'suction_header' ? 1 : 0.4}
          >
            {/* Suction collector manifold */}
            <rect x="195" y="320" width="18" height="90" rx="3" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
            {/* Return line to compressor */}
            <path d="M 204 320 L 204 260 L 50 260" fill="none" stroke="#6366f1" strokeWidth="7" strokeLinecap="round" />
            <path d="M 190 260 L 60 260" fill="none" stroke="#a5b4fc" strokeWidth="3" markerEnd="url(#arrowSuction)" />

            {/* Feeder return lines from coil to collector manifold */}
            {Array.from({ length: result.recommendedCircuits }).map((_, cIdx) => {
              const returnCoilY = coilBottomY - (cIdx * 28);
              const headerEntryY = 340 + (cIdx * 18);
              return (
                <path
                  key={`return-${cIdx}`}
                  d={`M 270 ${returnCoilY} Q 240 ${returnCoilY}, 213 ${headerEntryY}`}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                />
              );
            })}

            {/* Suction Callout Badge */}
            <rect x="15" y="275" width="180" height="58" rx="6" fill="#0f172a" stroke="#818cf8" strokeWidth="1.2" />
            <text x="25" y="293" fill="#a5b4fc" fontSize="11" fontWeight="700">
              Pipa Suction Header
            </text>
            <text x="25" y="309" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              Gas Superheat ({inputs.superheatK}K)
            </text>
            <text x="25" y="324" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
              Kembali ke Suction Kompresor
            </text>
          </g>

          {/* THE EVAPORATOR COIL ITSELF (Helical Spiral in Convector Tank) */}
          <g
            className="cursor-pointer"
            onClick={() => setActivePart('coil')}
            opacity={activePart === 'overview' || activePart === 'coil' ? 1 : 0.4}
          >
            {/* Dimensional Dimension Line (Diameter of Coil) */}
            <g stroke="#94a3b8" strokeWidth="1" opacity="0.6">
              <line x1={coilLeftX} y1={coilTopY - 14} x2={coilRightX} y2={coilTopY - 14} markerEnd="url(#arrowWater)" markerStart="url(#arrowWater)" />
              <line x1={coilLeftX} y1={coilTopY - 20} x2={coilLeftX} y2={coilTopY - 8} />
              <line x1={coilRightX} y1={coilTopY - 20} x2={coilRightX} y2={coilTopY - 8} />
              <text x={(coilLeftX + coilRightX) / 2} y={coilTopY - 18} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                Ø Koil Spiral = {inputs.coilDiameterMm || 400} mm
              </text>
            </g>

            {/* Dimensional Dimension Line (Height of Coil) */}
            <g stroke="#94a3b8" strokeWidth="1" opacity="0.6">
              <line x1={coilRightX + 22} y1={coilTopY} x2={coilRightX + 22} y2={coilBottomY} />
              <line x1={coilRightX + 16} y1={coilTopY} x2={coilRightX + 28} y2={coilTopY} />
              <line x1={coilRightX + 16} y1={coilBottomY} x2={coilRightX + 28} y2={coilBottomY} />
              <text
                x={coilRightX + 32}
                y={(coilTopY + coilBottomY) / 2}
                fill="#94a3b8"
                fontSize="9"
                fontFamily="monospace"
                transform={`rotate(90 ${coilRightX + 32} ${(coilTopY + coilBottomY) / 2})`}
                textAnchor="middle"
              >
                Tinggi Koil ≈ {result.coilHeightMm} mm
              </text>
            </g>

            {/* Render Spiral Coil Loops */}
            {Array.from({ length: visualTurns }).map((_, idx) => {
              const yPos = coilTopY + idx * coilSpacing;
              const isEven = idx % 2 === 0;

              return (
                <g key={`loop-${idx}`}>
                  {/* Outer shadow / thickness */}
                  <ellipse
                    cx={(coilLeftX + coilRightX) / 2}
                    cy={yPos}
                    rx={(coilRightX - coilLeftX) / 2}
                    ry={coilSpacing * 0.42}
                    fill={pipeFillColor}
                    stroke={pipeStrokeColor}
                    strokeWidth={inputs.pipeNominalInch === '3/4"' || inputs.pipeNominalInch === '7/8"' ? 5.5 : 4}
                    strokeDasharray={inputs.pipeMaterial === 'copper_finned' ? '3 1.5' : 'none'}
                  />

                  {/* Flow animation particle on loop */}
                  {showFlowAnimation && (
                    <circle
                      cx={isEven ? coilLeftX + 30 : coilRightX - 30}
                      cy={yPos}
                      r="2.5"
                      fill="#ffffff"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="opacity"
                        values="0.3;1;0.3"
                        dur="1.5s"
                        repeatCount="indefinite"
                        begin={`${(idx * 0.15).toFixed(2)}s`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Big floating summary badge on the coil */}
            <g transform={`translate(${(coilLeftX + coilRightX) / 2 - 105}, ${coilBottomY + 30})`}>
              <rect
                x="0"
                y="0"
                width="210"
                height="34"
                rx="6"
                fill="#020617"
                stroke={pipeStrokeColor}
                strokeWidth="2"
                className="filter drop-shadow-lg"
              />
              <text x="105" y="15" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">
                PANJANG PIPA: {result.totalPipeLengthMeters.toFixed(2)} METER
              </text>
              <text x="105" y="27" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                {result.recommendedCircuits} Sirkuit × {result.lengthPerCircuitMeters.toFixed(2)} m ({result.nominalPipeSpec.nominalInch})
              </text>
            </g>
          </g>

          {/* BOTTOM ENGINEERING SPECS STRIP INSIDE DIAGRAM */}
          <g transform="translate(30, 475)">
            <rect x="0" y="0" width={svgWidth - 60} height="36" rx="6" fill="#090d16" stroke="#1e293b" strokeWidth="1" />
            <text x="20" y="16" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              BEBAN KALOR Q: <tspan fill="#38bdf8" fontWeight="bold">{result.effectiveCoolingLoadKw.toFixed(2)} kW</tspan> ({result.effectiveCoolingLoadTr.toFixed(2)} TR)
            </text>
            <text x="240" y="16" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              LMTD: <tspan fill="#22d3ee" fontWeight="bold">{result.lmtdC.toFixed(2)} °C</tspan>
            </text>
            <text x="360" y="16" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              U-VALUE: <tspan fill="#a78bfa" fontWeight="bold">{result.uValueWm2K.toFixed(0)} W/m²·K</tspan>
            </text>
            <text x="520" y="16" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              LUAS AREA A: <tspan fill="#34d399" fontWeight="bold">{result.fouledHeatTransferAreaM2.toFixed(3)} m²</tspan>
            </text>
            <text x="680" y="16" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              BERAT PIPA: <tspan fill="#f59e0b" fontWeight="bold">{result.coilWeightKg.toFixed(1)} kg</tspan>
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Detail Box on Click */}
      <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Komponen Terpilih:</span>
          <span className="font-semibold text-white uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            {activePart === 'overview' && '🔍 Seluruh Sistem Evaporator Coil'}
            {activePart === 'coil' && '🌀 Koil Pipa Evaporator (Perpindahan Kalor)'}
            {activePart === 'distributor' && '🔀 Katup Ekspansi TXV & Distributor Spider'}
            {activePart === 'suction_header' && '🔙 Header Kolektor Suction Gas'}
            {activePart === 'water_inlet' && '💧 Saluran Air Masuk Hangat'}
            {activePart === 'water_outlet' && '❄️ Saluran Air Dingin Siap Pakai'}
            {activePart === 'tank_body' && '📦 Bejana Tangki Convector & Isolasi PU'}
            {activePart === 'agitator' && '🔄 Agitator Pengaduk Air (Peningkat U-Value)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'overview', label: 'Semua' },
            { id: 'coil', label: 'Koil' },
            { id: 'distributor', label: 'Distributor' },
            { id: 'suction_header', label: 'Suction' },
            { id: 'water_inlet', label: 'Air Masuk' },
            { id: 'water_outlet', label: 'Air Dingin' },
            { id: 'agitator', label: 'Agitator' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setActivePart(btn.id as DiagramFocusPart)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                activePart === btn.id
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
