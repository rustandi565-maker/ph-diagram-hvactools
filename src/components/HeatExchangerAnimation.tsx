import React, { useState, useEffect, useRef } from 'react';
import { FlowConfiguration, HeatExchangerResults } from '../types/heatExchanger';

interface HeatExchangerAnimationProps {
  flowConfig: FlowConfiguration;
  results: HeatExchangerResults;
  fluid1Name: string;
  fluid2Name: string;
  className?: string;
}

export const HeatExchangerAnimation: React.FC<HeatExchangerAnimationProps> = ({
  flowConfig,
  results,
  fluid1Name,
  fluid2Name,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [showFluxWaves, setShowFluxWaves] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);

  // Time ticker for smooth animation
  const [time, setTime] = useState<number>(0);
  const reqRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTimestamp: number | null = null;
    const animate = (timestamp: number) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying) {
        setTime((prev) => prev + dt * speedMultiplier);
      }
      reqRef.current = requestAnimationFrame(animate);
    };

    reqRef.current = requestAnimationFrame(animate);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying, speedMultiplier]);

  const hotFluidLabel = results.isFluid1Hot ? fluid1Name : fluid2Name;
  const coldFluidLabel = !results.isFluid1Hot ? fluid1Name : fluid2Name;

  return (
    <div className={`relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-4 font-mono ${className}`}>
      {/* Animation Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h4 className="font-bold text-white uppercase tracking-wider">
            Simulasi Visual Aliran &amp; Perpindahan Kalor
          </h4>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isPlaying ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500 text-slate-950'
            }`}
          >
            <span>{isPlaying ? '⏸ Pause' : '▶ Putar'}</span>
          </button>

          {/* Speed Buttons */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
            {[0.5, 1.0, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                  speedMultiplier === spd ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Toggle Heat Waves */}
          <button
            onClick={() => setShowFluxWaves(!showFluxWaves)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition border cursor-pointer ${
              showFluxWaves ? 'bg-orange-950/60 text-orange-300 border-orange-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            🔥 Gelombang Kalor
          </button>

          {/* Toggle Particle Stream */}
          <button
            onClick={() => setShowParticles(!showParticles)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition border cursor-pointer ${
              showParticles ? 'bg-blue-950/60 text-blue-300 border-blue-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            💧 Partikel Fluida
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full aspect-16/9 sm:aspect-21/9 bg-radial from-slate-900 via-slate-950 to-slate-950 rounded-lg border border-slate-800/80 p-2 flex items-center justify-center overflow-hidden">
        {flowConfig === 'parallel' && (
          <ParallelFlowSchematic
            time={time}
            results={results}
            hotFluidLabel={hotFluidLabel}
            coldFluidLabel={coldFluidLabel}
            showFluxWaves={showFluxWaves}
            showParticles={showParticles}
          />
        )}

        {flowConfig === 'counter' && (
          <CounterFlowSchematic
            time={time}
            results={results}
            hotFluidLabel={hotFluidLabel}
            coldFluidLabel={coldFluidLabel}
            showFluxWaves={showFluxWaves}
            showParticles={showParticles}
          />
        )}

        {flowConfig === 'cross' && (
          <CrossFlowSchematic
            time={time}
            results={results}
            hotFluidLabel={hotFluidLabel}
            coldFluidLabel={coldFluidLabel}
            showFluxWaves={showFluxWaves}
            showParticles={showParticles}
          />
        )}

        {flowConfig === 'multipass' && (
          <MultipassFlowSchematic
            time={time}
            results={results}
            hotFluidLabel={hotFluidLabel}
            coldFluidLabel={coldFluidLabel}
            showFluxWaves={showFluxWaves}
            showParticles={showParticles}
          />
        )}
      </div>

      {/* Thermodynamic Operational Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
        <div className="bg-slate-900/60 rounded p-2 border border-slate-800">
          <div className="text-slate-400">Kapasitas Perpindahan (Q):</div>
          <div className="font-bold text-amber-400 text-xs sm:text-sm">
            {results.capacityKw.toFixed(2)} kW
            <span className="text-[10px] text-slate-500 font-normal ml-1">({results.capacityTR.toFixed(2)} TR)</span>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded p-2 border border-slate-800">
          <div className="text-slate-400">LMTD Efektif (ΔTeff):</div>
          <div className="font-bold text-cyan-400 text-xs sm:text-sm">
            {results.effectiveDeltaT.toFixed(2)} °C
            <span className="text-[10px] text-slate-500 font-normal ml-1">(F = {results.correctionFactorF.toFixed(3)})</span>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded p-2 border border-slate-800">
          <div className="text-slate-400">Efektivitas (ε):</div>
          <div className="font-bold text-emerald-400 text-xs sm:text-sm">
            {(results.effectiveness * 100).toFixed(1)} %
            <span className="text-[10px] text-slate-500 font-normal ml-1">(NTU = {results.ntu.toFixed(2)})</span>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded p-2 border border-slate-800">
          <div className="text-slate-400">Luas Permukaan (A):</div>
          <div className="font-bold text-purple-400 text-xs sm:text-sm">
            {results.areaM2.toFixed(3)} m²
            <span className="text-[10px] text-slate-500 font-normal ml-1">(U = {results.overallU.toFixed(0)} W/m²K)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SCHEMATIC 1: PARALLEL FLOW (Co-Current Flow)
// -------------------------------------------------------------
function ParallelFlowSchematic({
  time,
  results,
  hotFluidLabel,
  coldFluidLabel,
  showFluxWaves,
  showParticles,
}: {
  time: number;
  results: HeatExchangerResults;
  hotFluidLabel: string;
  coldFluidLabel: string;
  showFluxWaves: boolean;
  showParticles: boolean;
}) {
  const width = 800;
  const height = 300;

  // Generate stream particles
  const numParticles = 14;
  const particleSpacing = 1 / numParticles;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="par-hot-pipe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="par-cold-pipe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Outer Casing / Insulated Shell */}
      <rect x="80" y="40" width="640" height="220" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />

      {/* Upper Channel: Hot Fluid (Left to Right) */}
      <rect x="100" y="55" width="600" height="80" rx="8" fill="url(#par-hot-pipe)" opacity="0.85" />

      {/* Dividing Conductive Metal Plate */}
      <rect x="100" y="140" width="600" height="20" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" />
      {/* Hatching on wall */}
      {Array.from({ length: 30 }).map((_, i) => (
        <line
          key={`wall-hatch-${i}`}
          x1={110 + i * 20}
          y1="140"
          x2={120 + i * 20}
          y2="160"
          stroke="#475569"
          strokeWidth="1.5"
        />
      ))}

      {/* Lower Channel: Cold Fluid (Left to Right) */}
      <rect x="100" y="165" width="600" height="80" rx="8" fill="url(#par-cold-pipe)" opacity="0.85" />

      {/* Flow Stream Particles - Hot (Left to Right) */}
      {showParticles &&
        Array.from({ length: numParticles }).map((_, i) => {
          const progress = (time * 0.35 + i * particleSpacing) % 1;
          const x = 110 + progress * 580;
          return (
            <g key={`hot-p-${i}`} transform={`translate(${x}, 95)`}>
              <circle r="4" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 0 4px #ffedd5)" />
              <path d="M -8 0 L -2 -3 L -2 3 Z" fill="#ffffff" opacity="0.8" />
            </g>
          );
        })}

      {/* Flow Stream Particles - Cold (Left to Right) */}
      {showParticles &&
        Array.from({ length: numParticles }).map((_, i) => {
          const progress = (time * 0.35 + i * particleSpacing) % 1;
          const x = 110 + progress * 580;
          return (
            <g key={`cold-p-${i}`} transform={`translate(${x}, 205)`}>
              <circle r="4" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 0 4px #bae6fd)" />
              <path d="M -8 0 L -2 -3 L -2 3 Z" fill="#ffffff" opacity="0.8" />
            </g>
          );
        })}

      {/* Heat Flux Waves Through the Dividing Wall (Top to Bottom) */}
      {showFluxWaves &&
        [150, 230, 310, 390, 470, 550, 630].map((xPos, idx) => {
          const wavePhase = (time * 3 + idx * 0.8) % 1;
          const yStart = 135;
          const yEnd = 165;
          const yCurrent = yStart + wavePhase * (yEnd - yStart);
          const intensity = Math.max(0.2, 1 - idx * 0.12); // Decreases along length as delta T narrows
          return (
            <g key={`flux-${idx}`} opacity={intensity}>
              <path
                d={`M ${xPos - 8} ${yCurrent} Q ${xPos} ${yCurrent + 6} ${xPos + 8} ${yCurrent}`}
                fill="none"
                stroke="#facc15"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d={`M ${xPos} ${yCurrent + 4} L ${xPos - 3} ${yCurrent} L ${xPos + 3} ${yCurrent} Z`}
                fill="#facc15"
              />
            </g>
          );
        })}

      {/* Inlet & Outlet Nozzles / Ports with Labels */}
      {/* Hot In (Top Left) */}
      <rect x="30" y="70" width="70" height="50" rx="4" fill="#b91c1c" />
      <text x="65" y="92" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        HOT IN
      </text>
      <text x="65" y="107" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#fecaca">
        {results.tHotIn.toFixed(1)}°C
      </text>
      <path d="M 85 95 L 98 95" stroke="#ffffff" strokeWidth="3" markerEnd="url(#arrow)" />

      {/* Hot Out (Top Right) */}
      <rect x="700" y="70" width="70" height="50" rx="4" fill="#c2410c" />
      <text x="735" y="92" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        HOT OUT
      </text>
      <text x="735" y="107" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#ffedd5">
        {results.tHotOut.toFixed(1)}°C
      </text>

      {/* Cold In (Bottom Left) */}
      <rect x="30" y="180" width="70" height="50" rx="4" fill="#1e3a8a" />
      <text x="65" y="202" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        COLD IN
      </text>
      <text x="65" y="217" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#bfdbfe">
        {results.tColdIn.toFixed(1)}°C
      </text>

      {/* Cold Out (Bottom Right) */}
      <rect x="700" y="180" width="70" height="50" rx="4" fill="#0369a1" />
      <text x="735" y="202" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        COLD OUT
      </text>
      <text x="735" y="217" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#bae6fd">
        {results.tColdOut.toFixed(1)}°C
      </text>

      {/* Central Explanatory Banner */}
      <text x="400" y="25" textAnchor="middle" fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#38bdf8">
        ALIRAN SEJAJAR (CO-CURRENT): KEDUA FLUIDA MENGALIR KE ARAH KANAN (x = 0 ➔ L)
      </text>
      <text x="400" y="100" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        Saluran Fluida Panas: {hotFluidLabel}
      </text>
      <text x="400" y="210" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        Saluran Fluida Dingin: {coldFluidLabel}
      </text>
    </svg>
  );
}

// -------------------------------------------------------------
// SCHEMATIC 2: COUNTER FLOW (Counter-Current Flow)
// -------------------------------------------------------------
function CounterFlowSchematic({
  time,
  results,
  hotFluidLabel,
  coldFluidLabel,
  showFluxWaves,
  showParticles,
}: {
  time: number;
  results: HeatExchangerResults;
  hotFluidLabel: string;
  coldFluidLabel: string;
  showFluxWaves: boolean;
  showParticles: boolean;
}) {
  const width = 800;
  const height = 300;
  const numParticles = 14;
  const particleSpacing = 1 / numParticles;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="cnt-hot-pipe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        {/* Cold enters at right (dark blue) and exits at left (cyan) */}
        <linearGradient id="cnt-cold-pipe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>

      {/* Casing */}
      <rect x="80" y="40" width="640" height="220" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />

      {/* Upper Channel: Hot Fluid (Left to Right) */}
      <rect x="100" y="55" width="600" height="80" rx="8" fill="url(#cnt-hot-pipe)" opacity="0.85" />

      {/* Dividing Metal Wall */}
      <rect x="100" y="140" width="600" height="20" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" />
      {Array.from({ length: 30 }).map((_, i) => (
        <line
          key={`wall-cnt-${i}`}
          x1={110 + i * 20}
          y1="140"
          x2={120 + i * 20}
          y2="160"
          stroke="#475569"
          strokeWidth="1.5"
        />
      ))}

      {/* Lower Channel: Cold Fluid (Right to Left) */}
      <rect x="100" y="165" width="600" height="80" rx="8" fill="url(#cnt-cold-pipe)" opacity="0.85" />

      {/* Hot Particles (Left to Right) */}
      {showParticles &&
        Array.from({ length: numParticles }).map((_, i) => {
          const progress = (time * 0.35 + i * particleSpacing) % 1;
          const x = 110 + progress * 580;
          return (
            <g key={`hot-cnt-p-${i}`} transform={`translate(${x}, 95)`}>
              <circle r="4" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 0 4px #ffedd5)" />
              <path d="M -8 0 L -2 -3 L -2 3 Z" fill="#ffffff" opacity="0.8" />
            </g>
          );
        })}

      {/* Cold Particles (Right to Left!) */}
      {showParticles &&
        Array.from({ length: numParticles }).map((_, i) => {
          const progress = (time * 0.35 + i * particleSpacing) % 1;
          const x = 690 - progress * 580;
          return (
            <g key={`cold-cnt-p-${i}`} transform={`translate(${x}, 205)`}>
              <circle r="4" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 0 4px #bae6fd)" />
              <path d="M 8 0 L 2 -3 L 2 3 Z" fill="#ffffff" opacity="0.8" />
            </g>
          );
        })}

      {/* Heat Flux Waves - Constant and Uniform Driving Temperature Difference */}
      {showFluxWaves &&
        [150, 230, 310, 390, 470, 550, 630].map((xPos, idx) => {
          const wavePhase = (time * 3 + idx * 0.8) % 1;
          const yStart = 135;
          const yEnd = 165;
          const yCurrent = yStart + wavePhase * (yEnd - yStart);
          return (
            <g key={`flux-cnt-${idx}`}>
              <path
                d={`M ${xPos - 8} ${yCurrent} Q ${xPos} ${yCurrent + 6} ${xPos + 8} ${yCurrent}`}
                fill="none"
                stroke="#facc15"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d={`M ${xPos} ${yCurrent + 4} L ${xPos - 3} ${yCurrent} L ${xPos + 3} ${yCurrent} Z`}
                fill="#facc15"
              />
            </g>
          );
        })}

      {/* Hot In (Top Left) */}
      <rect x="30" y="70" width="70" height="50" rx="4" fill="#b91c1c" />
      <text x="65" y="92" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        HOT IN ➔
      </text>
      <text x="65" y="107" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#fecaca">
        {results.tHotIn.toFixed(1)}°C
      </text>

      {/* Hot Out (Top Right) */}
      <rect x="700" y="70" width="70" height="50" rx="4" fill="#c2410c" />
      <text x="735" y="92" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        HOT OUT
      </text>
      <text x="735" y="107" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#ffedd5">
        {results.tHotOut.toFixed(1)}°C
      </text>

      {/* Cold Out (Bottom Left - Exits Here!) */}
      <rect x="30" y="180" width="70" height="50" rx="4" fill="#0369a1" />
      <text x="65" y="202" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        ⬅ COLD OUT
      </text>
      <text x="65" y="217" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#bae6fd">
        {results.tColdOut.toFixed(1)}°C
      </text>

      {/* Cold In (Bottom Right - Enters Here!) */}
      <rect x="700" y="180" width="70" height="50" rx="4" fill="#1e3a8a" />
      <text x="735" y="202" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        ⬅ COLD IN
      </text>
      <text x="735" y="217" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#bfdbfe">
        {results.tColdIn.toFixed(1)}°C
      </text>

      {/* Central Explanatory Banner */}
      <text x="400" y="25" textAnchor="middle" fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#10b981">
        ALIRAN BERLAWANAN (COUNTER-CURRENT): EFISIENSI TERMAL TERTINGGI (LMTD MAKSIMAL)
      </text>
      <text x="400" y="100" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        {hotFluidLabel} (Mengalir Kanan ➔)
      </text>
      <text x="400" y="210" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        {coldFluidLabel} (Mengalir Kiri ⬅)
      </text>
    </svg>
  );
}

// -------------------------------------------------------------
// SCHEMATIC 3: CROSS FLOW (Aliran Silang)
// -------------------------------------------------------------
function CrossFlowSchematic({
  time,
  results,
  hotFluidLabel,
  coldFluidLabel,
  showFluxWaves,
  showParticles,
}: {
  time: number;
  results: HeatExchangerResults;
  hotFluidLabel: string;
  coldFluidLabel: string;
  showFluxWaves: boolean;
  showParticles: boolean;
}) {
  const width = 800;
  const height = 300;

  // Horizontal tube rows
  const tubeRows = [75, 125, 175, 225];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="cross-tube" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="cross-air" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Exchanger Duct Housing */}
      <rect x="160" y="30" width="480" height="240" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="2" />

      {/* Vertical Fins Matrix */}
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={`fin-${i}`}
          x1={180 + i * 19}
          y1="32"
          x2={180 + i * 19}
          y2="268"
          stroke="#334155"
          strokeWidth="1.5"
          opacity="0.7"
        />
      ))}

      {/* Cross Cold Stream Upward Airflow/Fluid Flow (Bottom to Top) */}
      {showParticles &&
        Array.from({ length: 18 }).map((_, i) => {
          const colX = 185 + (i % 9) * 50;
          const progress = (time * 0.4 + Math.floor(i / 9) * 0.5) % 1;
          const yPos = 265 - progress * 230;
          return (
            <g key={`cross-cold-${i}`} transform={`translate(${colX}, ${yPos})`}>
              <circle r="3.5" fill="#38bdf8" opacity="0.8" />
              <path d="M 0 -7 L 3 -1 L -3 -1 Z" fill="#38bdf8" />
            </g>
          );
        })}

      {/* Horizontal Hot Tubes */}
      {tubeRows.map((yTube, rowIdx) => (
        <g key={`tube-row-${rowIdx}`}>
          <rect
            x="140"
            y={yTube - 12}
            width="520"
            height="24"
            rx="6"
            fill="url(#cross-tube)"
            stroke="#991b1b"
            strokeWidth="1.5"
            opacity="0.9"
          />

          {/* Hot Tube Particles Flowing Left to Right */}
          {showParticles &&
            Array.from({ length: 6 }).map((_, pIdx) => {
              const progress = (time * 0.35 + pIdx * (1 / 6) + rowIdx * 0.1) % 1;
              const xPos = 150 + progress * 500;
              return (
                <circle
                  key={`tube-p-${rowIdx}-${pIdx}`}
                  cx={xPos}
                  cy={yTube}
                  r="3.5"
                  fill="#ffffff"
                  filter="drop-shadow(0 0 3px #fde047)"
                />
              );
            })}
        </g>
      ))}

      {/* Heat Flux Radiation from Tubes into Passing Cross-Stream */}
      {showFluxWaves &&
        tubeRows.map((yTube, rIdx) => (
          <g key={`rad-${rIdx}`}>
            {[230, 330, 430, 530].map((xP, cIdx) => {
              const pulse = 1 + 0.3 * Math.sin(time * 5 + rIdx + cIdx);
              return (
                <circle
                  key={`pulse-${cIdx}`}
                  cx={xP}
                  cy={yTube}
                  r={12 * pulse}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="1.2"
                  opacity={0.6 / pulse}
                />
              );
            })}
          </g>
        ))}

      {/* Left Hot Header Tank */}
      <rect x="70" y="55" width="70" height="190" rx="8" fill="#b91c1c" stroke="#dc2626" strokeWidth="2" />
      <text x="105" y="140" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        HOT IN
      </text>
      <text x="105" y="156" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#fecaca">
        {results.tHotIn.toFixed(1)}°C
      </text>

      {/* Right Hot Collector Tank */}
      <rect x="660" y="55" width="70" height="190" rx="8" fill="#c2410c" stroke="#ea580c" strokeWidth="2" />
      <text x="695" y="140" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        HOT OUT
      </text>
      <text x="695" y="156" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#ffedd5">
        {results.tHotOut.toFixed(1)}°C
      </text>

      {/* Bottom Cross Fluid Entry */}
      <text x="400" y="290" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#38bdf8">
        ▲ COLD STREAM INLET: {coldFluidLabel} ({results.tColdIn.toFixed(1)}°C)
      </text>

      {/* Top Cross Fluid Exit */}
      <text x="400" y="18" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#06b6d4">
        ▲ COLD STREAM OUTLET: {results.tColdOut.toFixed(1)}°C
      </text>
    </svg>
  );
}

// -------------------------------------------------------------
// SCHEMATIC 4: MULTI-PASS (1-Shell Pass, 2-Tube Pass Shell & Tube)
// -------------------------------------------------------------
function MultipassFlowSchematic({
  time,
  results,
  hotFluidLabel,
  coldFluidLabel,
  showFluxWaves,
  showParticles,
}: {
  time: number;
  results: HeatExchangerResults;
  hotFluidLabel: string;
  coldFluidLabel: string;
  showFluxWaves: boolean;
  showParticles: boolean;
}) {
  const width = 800;
  const height = 300;

  // Segmental Baffles in the shell
  const baffleX = [230, 330, 430, 530, 630];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="sh-body" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#450a0a" />
          <stop offset="100%" stopColor="#292524" />
        </linearGradient>
      </defs>

      {/* Shell Body (Cylindrical Vessel) */}
      <rect x="130" y="45" width="560" height="210" rx="16" fill="url(#sh-body)" stroke="#64748b" strokeWidth="2.5" />

      {/* Segmental Baffles (Alternating Up and Down to force Shell Zig-Zag Flow) */}
      {baffleX.map((xPos, idx) => {
        const isUp = idx % 2 === 0;
        return (
          <rect
            key={`baffle-${idx}`}
            x={xPos}
            y={isUp ? 45 : 100}
            width="8"
            height="155"
            fill="#94a3b8"
            stroke="#cbd5e1"
            strokeWidth="0.8"
          />
        );
      })}

      {/* Shell Fluid (Hot) Cascading Streamline / Zig-Zag Wave */}
      {showParticles &&
        Array.from({ length: 12 }).map((_, i) => {
          const progress = (time * 0.25 + i * (1 / 12)) % 1;
          const x = 160 + progress * 500;
          // Sine wave path corresponding to baffle zig-zag
          const y = 150 + Math.sin(progress * Math.PI * 4.5) * 60;
          return (
            <circle
              key={`shell-p-${i}`}
              cx={x}
              cy={y}
              r="4.5"
              fill="#f97316"
              opacity="0.8"
              filter="drop-shadow(0 0 4px #fdba74)"
            />
          );
        })}

      {/* U-Tube Bundle (Cold Fluid Pass 1 & Pass 2) */}
      {/* Upper Tube (Pass 1: Left to Right) */}
      <rect x="130" y="85" width="480" height="18" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
      {/* Lower Tube (Pass 2: Right to Left) */}
      <rect x="130" y="195" width="480" height="18" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />

      {/* 180° U-Bend Turnaround Head on the Right */}
      <path
        d="M 610 85 A 55 55 0 0 1 610 213"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="18"
        strokeLinecap="round"
      />

      {/* Tube Stream Particles (Pass 1: Left to Right) */}
      {showParticles &&
        Array.from({ length: 7 }).map((_, i) => {
          const progress = (time * 0.4 + i * (1 / 7)) % 1;
          const x = 140 + progress * 470;
          return <circle key={`tube-pass1-${i}`} cx={x} cy={94} r="3.5" fill="#ffffff" />;
        })}

      {/* Tube Stream Particles (Pass 2: Right to Left!) */}
      {showParticles &&
        Array.from({ length: 7 }).map((_, i) => {
          const progress = (time * 0.4 + i * (1 / 7)) % 1;
          const x = 610 - progress * 470;
          return <circle key={`tube-pass2-${i}`} cx={x} cy={204} r="3.5" fill="#ffffff" />;
        })}

      {/* Left Stationary Channel Head / Bonnets with Partition Plate */}
      {/* Top Chamber (Cold Tube Inlet) */}
      <rect x="40" y="65" width="90" height="60" rx="8" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" />
      <text x="85" y="93" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        TUBE IN ➔
      </text>
      <text x="85" y="108" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#bae6fd">
        {results.tColdIn.toFixed(1)}°C
      </text>

      {/* Central Partition Plate in Channel Head */}
      <rect x="40" y="135" width="90" height="20" fill="#334155" stroke="#475569" strokeWidth="1" />
      <text x="85" y="149" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#94a3b8">
        PARTISI BAFFLE
      </text>

      {/* Bottom Chamber (Cold Tube Outlet) */}
      <rect x="40" y="165" width="90" height="60" rx="8" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
      <text x="85" y="193" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
        ⬅ TUBE OUT
      </text>
      <text x="85" y="208" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#bae6fd">
        {results.tColdOut.toFixed(1)}°C
      </text>

      {/* Shell In Nozzle (Top Left) */}
      <rect x="180" y="15" width="50" height="30" rx="4" fill="#b91c1c" stroke="#ef4444" strokeWidth="1.5" />
      <text x="205" y="10" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#ef4444">
        ▼ SHELL IN ({results.tHotIn.toFixed(1)}°C)
      </text>

      {/* Shell Out Nozzle (Bottom Right) */}
      <rect x="580" y="255" width="50" height="30" rx="4" fill="#c2410c" stroke="#f97316" strokeWidth="1.5" />
      <text x="605" y="295" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#f97316">
        ▼ SHELL OUT ({results.tHotOut.toFixed(1)}°C)
      </text>

      {/* Title */}
      <text x="400" y="25" textAnchor="middle" fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#a855f7">
        SHELL &amp; TUBE 1-2 PASS: SHELL MENGALIR ZIG-ZAG, U-TUBE MENGALIR 2 PASS (0 ➔ L ➔ 0)
      </text>
    </svg>
  );
}
