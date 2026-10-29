import React, { useState, useId } from 'react';
import { HeatExchangerResults, FlowConfiguration } from '../types/heatExchanger';

interface HeatExchangerChartProps {
  results: HeatExchangerResults;
  flowConfig: FlowConfiguration;
  fluid1Name: string;
  fluid2Name: string;
  totalLengthMeters?: number;
  height?: number;
  className?: string;
  isPrintMode?: boolean;
}

export const HeatExchangerChart: React.FC<HeatExchangerChartProps> = ({
  results,
  flowConfig,
  fluid1Name,
  fluid2Name,
  totalLengthMeters = 2.0,
  height = 360,
  className = '',
  isPrintMode = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartId = useId();

  const points = results.curvePoints;
  if (!points || points.length === 0) return null;

  // Chart dimensions & margins
  const width = 760;
  const padding = { top: 40, right: 65, bottom: 55, left: 65 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Find min and max temperatures across all points
  let allTemps: number[] = [];
  points.forEach((p) => {
    allTemps.push(p.tHot, p.tCold);
    if (p.tColdPass2 !== undefined) allTemps.push(p.tColdPass2);
  });

  const minTempRaw = Math.min(...allTemps);
  const maxTempRaw = Math.max(...allTemps);
  const tempRangeRaw = Math.max(5, maxTempRaw - minTempRaw);
  const tempPadding = tempRangeRaw * 0.12;

  const minTemp = Math.floor(minTempRaw - tempPadding);
  const maxTemp = Math.ceil(maxTempRaw + tempPadding);
  const tempSpan = Math.max(1, maxTemp - minTemp);

  // Coordinate mappers
  const getX = (xRatio: number) => padding.left + xRatio * plotWidth;
  const getY = (temp: number) => padding.top + plotHeight - ((temp - minTemp) / tempSpan) * plotHeight;

  // Build SVG path strings
  const hotPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.xRatio).toFixed(1)},${getY(p.tHot).toFixed(1)}`)
    .join(' ');

  const coldPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.xRatio).toFixed(1)},${getY(p.tCold).toFixed(1)}`)
    .join(' ');

  const coldPass2Path = points[0]?.tColdPass2 !== undefined
    ? points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.xRatio).toFixed(1)},${getY(p.tColdPass2!).toFixed(1)}`)
        .join(' ')
    : null;

  // Temperature Grid Lines (Y-Axis)
  const numGridLines = 6;
  const gridTemps = Array.from({ length: numGridLines }, (_, i) => {
    return minTemp + (i / (numGridLines - 1)) * (maxTemp - minTemp);
  });

  // Distance Grid Lines (X-Axis)
  const xDivisions = [0, 0.25, 0.5, 0.75, 1.0];

  // Active hover point
  const activePoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length ? points[hoverIndex] : null;

  // Terminal delta T coordinates
  const pStart = points[0];
  const pEnd = points[points.length - 1];

  const flowTitleMap: Record<FlowConfiguration, string> = {
    parallel: 'Aliran Sejajar (Parallel / Co-Current Flow)',
    counter: 'Aliran Berlawanan (Counter-Current Flow)',
    cross: 'Aliran Silang (Cross Flow - Unmixed/Unmixed)',
    multipass: 'Aliran Multi-Pass (Shell & Tube 1-2 Pass)',
  };

  return (
    <div className={`relative w-full overflow-hidden select-none ${isPrintMode ? 'bg-white' : 'bg-slate-950/70 border border-slate-800 rounded-xl p-3 shadow-lg'} ${className}`}>
      {/* Header bar / Title */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse print:hidden" />
          <h4 className="text-xs sm:text-sm font-bold font-mono text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Diagram Distribusi Temperatur (T vs Jarak Relatif x/L)
          </h4>
        </div>
        <div className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-semibold">
          {flowTitleMap[flowConfig]}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full flex justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-w-full overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id={`${chartId}-hot-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <linearGradient id={`${chartId}-cold-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id={`${chartId}-cold-pass2-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Area Fill Gradients */}
            <linearGradient id={`${chartId}-area-hot`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={`${chartId}-area-cold`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            {/* Direction Arrow Markers */}
            <marker id={`${chartId}-arrow-hot`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#ef4444" />
            </marker>
            <marker id={`${chartId}-arrow-cold-right`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#06b6d4" />
            </marker>
            <marker id={`${chartId}-arrow-cold-left`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 8 1 L 0 5 L 8 9 z" fill="#06b6d4" />
            </marker>
          </defs>

          {/* Plot Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill={isPrintMode ? '#ffffff' : '#090d16'}
            stroke={isPrintMode ? '#cbd5e1' : '#1e293b'}
            strokeWidth="1"
            rx="4"
          />

          {/* Grid lines - Y axis (Temperatures) */}
          {gridTemps.map((tVal, i) => {
            const y = getY(tVal);
            return (
              <g key={`y-grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke={isPrintMode ? '#e2e8f0' : '#1e293b'}
                  strokeDasharray={i === 0 || i === gridTemps.length - 1 ? '' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="monospace"
                  fill={isPrintMode ? '#475569' : '#94a3b8'}
                >
                  {tVal.toFixed(1)}°
                </text>
              </g>
            );
          })}

          {/* Grid lines - X axis (Distance / x/L) */}
          {xDivisions.map((xVal, i) => {
            const x = getX(xVal);
            const distM = (xVal * totalLengthMeters).toFixed(2);
            return (
              <g key={`x-grid-${i}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + plotHeight}
                  stroke={isPrintMode ? '#e2e8f0' : '#1e293b'}
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + plotHeight + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                  fill={isPrintMode ? '#334155' : '#cbd5e1'}
                >
                  {Math.round(xVal * 100)}%
                </text>
                <text
                  x={x}
                  y={padding.top + plotHeight + 28}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fill={isPrintMode ? '#64748b' : '#64748b'}
                >
                  {distM} m
                </text>
              </g>
            );
          })}

          {/* Area under curves */}
          <path
            d={`${hotPath} L ${getX(1)},${getY(minTemp)} L ${getX(0)},${getY(minTemp)} Z`}
            fill={`url(#${chartId}-area-hot)`}
          />
          <path
            d={`${coldPath} L ${getX(1)},${getY(minTemp)} L ${getX(0)},${getY(minTemp)} Z`}
            fill={`url(#${chartId}-area-cold)`}
          />

          {/* Cold Fluid Line (Blue/Cyan) */}
          <path
            d={coldPath}
            fill="none"
            stroke={`url(#${chartId}-cold-grad)`}
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Multi-pass Cold Pass 2 (Purple) */}
          {coldPass2Path && (
            <path
              d={coldPass2Path}
              fill="none"
              stroke={`url(#${chartId}-cold-pass2-grad)`}
              strokeWidth="2.8"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
          )}

          {/* Hot Fluid Line (Red/Orange) */}
          <path
            d={hotPath}
            fill="none"
            stroke={`url(#${chartId}-hot-grad)`}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Key Terminal Points & Labels */}
          {/* Inlet Hot */}
          <circle cx={getX(0)} cy={getY(pStart.tHot)} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
          <text
            x={getX(0) + 10}
            y={getY(pStart.tHot) - 8}
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#ef4444"
          >
            Th,in = {results.tHotIn.toFixed(1)}°C
          </text>

          {/* Outlet Hot */}
          <circle cx={getX(1)} cy={getY(pEnd.tHot)} r="5" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
          <text
            x={getX(1) - 10}
            y={getY(pEnd.tHot) - 8}
            textAnchor="end"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#f97316"
          >
            Th,out = {results.tHotOut.toFixed(1)}°C
          </text>

          {/* Inlet & Outlet Cold depending on flow config */}
          {flowConfig === 'counter' ? (
            <>
              {/* Cold Enters at x = 1 */}
              <circle cx={getX(1)} cy={getY(pEnd.tCold)} r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
              <text
                x={getX(1) - 10}
                y={getY(pEnd.tCold) + 16}
                textAnchor="end"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#06b6d4"
              >
                Tc,in = {results.tColdIn.toFixed(1)}°C (Masuk)
              </text>

              {/* Cold Exits at x = 0 */}
              <circle cx={getX(0)} cy={getY(pStart.tCold)} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <text
                x={getX(0) + 10}
                y={getY(pStart.tCold) + 16}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#3b82f6"
              >
                Tc,out = {results.tColdOut.toFixed(1)}°C (Keluar)
              </text>
            </>
          ) : (
            <>
              {/* Cold Enters at x = 0 */}
              <circle cx={getX(0)} cy={getY(pStart.tCold)} r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
              <text
                x={getX(0) + 10}
                y={getY(pStart.tCold) + 16}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#06b6d4"
              >
                Tc,in = {results.tColdIn.toFixed(1)}°C
              </text>

              {/* Cold Exits at x = 1 */}
              <circle cx={getX(1)} cy={getY(pEnd.tCold)} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <text
                x={getX(1) - 10}
                y={getY(pEnd.tCold) + 16}
                textAnchor="end"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#3b82f6"
              >
                Tc,out = {results.tColdOut.toFixed(1)}°C
              </text>
            </>
          )}

          {/* Delta T dimension brackets at terminals */}
          {/* Delta T at x = 0 */}
          <line
            x1={getX(0) + 2}
            y1={getY(pStart.tHot)}
            x2={getX(0) + 2}
            y2={getY(pStart.tCold)}
            stroke={isPrintMode ? '#0284c7' : '#38bdf8'}
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <text
            x={getX(0) + 6}
            y={(getY(pStart.tHot) + getY(pStart.tCold)) / 2}
            fontSize="9"
            fontFamily="monospace"
            fill={isPrintMode ? '#0369a1' : '#38bdf8'}
            fontWeight="bold"
          >
            ΔT₁ = {results.deltaT1.toFixed(1)} K
          </text>

          {/* Delta T at x = 1 */}
          <line
            x1={getX(1) - 2}
            y1={getY(pEnd.tHot)}
            x2={getX(1) - 2}
            y2={getY(pEnd.tCold)}
            stroke={isPrintMode ? '#0284c7' : '#38bdf8'}
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <text
            x={getX(1) - 8}
            y={(getY(pEnd.tHot) + getY(pEnd.tCold)) / 2}
            textAnchor="end"
            fontSize="9"
            fontFamily="monospace"
            fill={isPrintMode ? '#0369a1' : '#38bdf8'}
            fontWeight="bold"
          >
            ΔT₂ = {results.deltaT2.toFixed(1)} K
          </text>

          {/* Flow Direction Indicator Banners inside chart */}
          {/* Hot Flow Direction (Always Left to Right) */}
          <g transform={`translate(${getX(0.45)}, ${getY(pStart.tHot) - 16})`}>
            <rect x="-42" y="-10" width="84" height="18" rx="3" fill={isPrintMode ? '#fee2e2' : '#450a0a'} stroke="#ef4444" strokeWidth="0.8" />
            <text x="0" y="2.5" textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#ef4444">
              Aliran Panas ➔
            </text>
          </g>

          {/* Cold Flow Direction */}
          <g transform={`translate(${getX(0.45)}, ${getY(pStart.tCold) + 20})`}>
            <rect x="-44" y="-10" width="88" height="18" rx="3" fill={isPrintMode ? '#e0f2fe' : '#082f49'} stroke="#0284c7" strokeWidth="0.8" />
            <text x="0" y="2.5" textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#0284c7">
              {flowConfig === 'counter' ? '⬅ Aliran Dingin' : 'Aliran Dingin ➔'}
            </text>
          </g>

          {/* Hover Crosshair & Tooltip Overlay */}
          {activePoint && !isPrintMode && (
            <g>
              {/* Vertical guideline */}
              <line
                x1={getX(activePoint.xRatio)}
                y1={padding.top}
                x2={getX(activePoint.xRatio)}
                y2={padding.top + plotHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Hot point dot */}
              <circle
                cx={getX(activePoint.xRatio)}
                cy={getY(activePoint.tHot)}
                r="6"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              {/* Cold point dot */}
              <circle
                cx={getX(activePoint.xRatio)}
                cy={getY(activePoint.tCold)}
                r="6"
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              {/* Floating Tooltip Box */}
              <g
                transform={`translate(${
                  activePoint.xRatio > 0.65 ? getX(activePoint.xRatio) - 165 : getX(activePoint.xRatio) + 12
                }, ${Math.max(padding.top + 10, (getY(activePoint.tHot) + getY(activePoint.tCold)) / 2 - 40)})`}
              >
                <rect
                  x="0"
                  y="0"
                  width="155"
                  height="78"
                  rx="6"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                />
                <text x="10" y="16" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#38bdf8">
                  Jarak: {(activePoint.xRatio * 100).toFixed(0)}% ({(activePoint.xRatio * totalLengthMeters).toFixed(2)} m)
                </text>
                <text x="10" y="34" fontSize="10" fontFamily="monospace" fill="#f87171">
                  ● Th(x) = {activePoint.tHot.toFixed(1)}°C
                </text>
                <text x="10" y="50" fontSize="10" fontFamily="monospace" fill="#38bdf8">
                  ● Tc(x) = {activePoint.tCold.toFixed(1)}°C
                </text>
                <text x="10" y="68" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#facc15">
                  ΔT(x) = {activePoint.deltaT.toFixed(1)} K
                </text>
              </g>
            </g>
          )}

          {/* Invisible interactive hover strip zones */}
          {!isPrintMode &&
            points.map((p, i) => {
              const prevX = i === 0 ? 0 : (points[i - 1].xRatio + p.xRatio) / 2;
              const nextX = i === points.length - 1 ? 1 : (points[i + 1].xRatio + p.xRatio) / 2;
              const xStart = getX(prevX);
              const xEnd = getX(nextX);
              return (
                <rect
                  key={`hover-col-${i}`}
                  x={xStart}
                  y={padding.top}
                  width={Math.max(1, xEnd - xStart)}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              );
            })}
        </svg>
      </div>

      {/* Axis & Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded bg-gradient-to-r from-red-500 to-orange-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Fluida Panas ({results.isFluid1Hot ? fluid1Name : fluid2Name})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded bg-gradient-to-r from-cyan-400 to-blue-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Fluida Dingin ({!results.isFluid1Hot ? fluid1Name : fluid2Name})
            </span>
          </div>
          {flowConfig === 'multipass' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 rounded bg-purple-500 border-dashed" />
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                Tube Pass 2 (Pembalik)
              </span>
            </div>
          )}
        </div>

        {/* LMTD & Pinch Summary Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Pinch Point: <strong className="text-amber-600 dark:text-amber-400">{results.pinchPointDeltaT.toFixed(1)} K</strong> ({results.pinchPointLocation})
          </span>
        </div>
      </div>
    </div>
  );
};
