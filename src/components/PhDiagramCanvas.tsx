import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CycleStatePoint, PhCycleResult } from '../types/phDiagram';
import {
  getRefSaturationTemp,
  getRefSaturationPressure,
  getRefLiquidEnthalpy,
  getRefVaporEnthalpy,
  getRefSuperheatedEnthalpy,
  getRefSubcooledEnthalpy,
  getRefLiquidSpecificVolume,
  getRefVaporSpecificVolume,
  STANDARD_CHART_SPECS,
} from '../utils/phThermodynamics';
import { AppLanguage, TRANSLATIONS } from '../utils/i18n';

export interface PhDiagramCanvasProps {
  result: PhCycleResult;
  isPrintView?: boolean;
  showPointBadges?: boolean;
  language?: AppLanguage;
  unitSystem?: 'SI' | 'Imperial';
  pressureUnit?: 'bar' | 'psi' | 'kPa';
  tempUnit?: '°C' | '°F' | 'K';
  enthalpyUnit?: 'kJ/kg' | 'Btu/lb';
  comparisonResult?: PhCycleResult | null;
  onSavePlot?: () => void;
  onOpenSavedList?: () => void;
  savedPlotsCount?: number;
  autoPlay?: boolean;
  // Controlled workstation toggles:
  pressureBasis?: 'abs' | 'gauge';
  showCycle?: boolean;
  showDome?: boolean;
  showQuality?: boolean;
  showIsotherms?: boolean;
  showEntropy?: boolean;
  showVolume?: boolean;
  showGrid?: boolean;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  isPanMode?: boolean;
  hideInternalToolbar?: boolean;
  selectedPointKey?: string | null;
  onSelectPoint?: (key: string | null) => void;
  onHoverPoint?: (pt: CycleStatePoint | null) => void;
}

export const PhDiagramCanvas: React.FC<PhDiagramCanvasProps> = ({
  result,
  isPrintView = false,
  showPointBadges = false,
  language = 'id',
  unitSystem = 'SI',
  pressureUnit = 'bar',
  tempUnit = '°C',
  enthalpyUnit = 'kJ/kg',
  comparisonResult,
  onSavePlot,
  onOpenSavedList,
  savedPlotsCount = 0,
  autoPlay = false,
  pressureBasis = 'gauge',
  showCycle: propShowCycle,
  showDome: propShowDome,
  showQuality: propShowQuality,
  showIsotherms: propShowIsotherms,
  showEntropy: propShowEntropy,
  showVolume: propShowVolume,
  showGrid: propShowGrid,
  isPlaying: propIsPlaying,
  onTogglePlay: propOnTogglePlay,
  zoomLevel: propZoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isPanMode = false,
  hideInternalToolbar = false,
  selectedPointKey = null,
  onSelectPoint,
  onHoverPoint: propOnHoverPoint,
}) => {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.id;
  const [hoveredPoint, setHoveredPoint] = useState<CycleStatePoint | null>(null);

  // Canvas visual style theme: default to dark blueprint workstation theme matching reference photo
  const [canvasTheme, setCanvasTheme] = useState<'standard' | 'dark'>(() => (isPrintView ? 'standard' : 'dark'));

  // Local fallback states if uncontrolled
  const [localShowEntropy, setLocalShowEntropy] = useState<boolean>(true);
  const [localShowVolume, setLocalShowVolume] = useState<boolean>(true);
  const [localShowIsotherms, setLocalShowIsotherms] = useState<boolean>(true);
  const [localShowQuality, setLocalShowQuality] = useState<boolean>(true);
  const [localShowCycle, setLocalShowCycle] = useState<boolean>(true);
  const [localShowDome, setLocalShowDome] = useState<boolean>(true);
  const [localShowGrid, setLocalShowGrid] = useState<boolean>(true);

  const showEntropy = propShowEntropy !== undefined ? propShowEntropy : localShowEntropy;
  const showVolume = propShowVolume !== undefined ? propShowVolume : localShowVolume;
  const showIsotherms = propShowIsotherms !== undefined ? propShowIsotherms : localShowIsotherms;
  const showQuality = propShowQuality !== undefined ? propShowQuality : localShowQuality;
  const showCycle = propShowCycle !== undefined ? propShowCycle : localShowCycle;
  const showDome = propShowDome !== undefined ? propShowDome : localShowDome;
  const showGrid = propShowGrid !== undefined ? propShowGrid : localShowGrid;

  // Zoom and pan state
  const [localZoom, setLocalZoom] = useState<number>(propZoomLevel ?? 1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback internal state point selection if uncontrolled
  const [internalSelectedPointKey, setInternalSelectedPointKey] = useState<string | null>(null);
  const activeSelectedPointKey = selectedPointKey !== undefined ? selectedPointKey : internalSelectedPointKey;

  const currentZoom = Math.max(0.5, Math.min(6, localZoom));

  // Sync propZoomLevel when parent updates
  useEffect(() => {
    if (propZoomLevel !== undefined) {
      setLocalZoom(propZoomLevel);
    }
  }, [propZoomLevel]);

  // Pointer panning handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPanMode || e.button === 1 || (e.button === 0 && currentZoom > 1.05)) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStartRef.current.x);
      setPanY(e.clientY - dragStartRef.current.y);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // State point selection toggle
  const handleSelectBadge = (label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextKey = activeSelectedPointKey === label ? null : label;
    if (onSelectPoint) {
      onSelectPoint(nextKey);
    }
    setInternalSelectedPointKey(nextKey);
  };

  // SVG dimensions & margins matching standard engineering sheet proportions
  const width = 960;
  const height = 550;
  const margin = { top: 32, right: 65, bottom: 54, left: 72 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Retrieve standard specifications for the active refrigerant (e.g. R410A, R32, R134a, etc.)
  const spec = useMemo(() => {
    return STANDARD_CHART_SPECS[result.refrigerant.id] ?? STANDARD_CHART_SPECS.R410A;
  }, [result.refrigerant.id]);

  // Coordinate transforms
  // X: Linear Enthalpy scale (hMin to hMax)
  const hMin = result.hMin;
  const hMax = result.hMax;
  const hRange = hMax - hMin || 1;
  const toX = (h: number) => margin.left + ((h - hMin) / hRange) * plotWidth;

  // Y: Logarithmic Pressure scale (log10(pMin) to log10(pMax))
  const logPMin = Math.log10(Math.max(0.02, result.pMin));
  const logPMax = Math.log10(result.pMax);
  const logPRange = logPMax - logPMin || 1;
  const toY = (pBar: number) => {
    const logP = Math.log10(Math.max(0.01, pBar));
    return margin.top + plotHeight - ((logP - logPMin) / logPRange) * plotHeight;
  };

  // Build Saturation Dome Path (Kubah Kejenuhan)
  const dome = result.domePoints;
  const liquidCoords = dome.map((d) => `${toX(d.hf)},${toY(d.pBar)}`);
  // Slice(1) to avoid duplicate apex coordinate when joining reversed vapor branch
  const vaporCoords = [...dome].reverse().slice(1).map((d) => `${toX(d.hg)},${toY(d.pBar)}`);
  const fullDomeCoords = [...liquidCoords, ...vaporCoords];
  const domePathString = `M ${fullDomeCoords[0]} L ${fullDomeCoords.slice(1).join(' L ')} Z`;

  // Cycle points coordinates
  const p1 = { x: toX(result.state1.enthalpyKjKg), y: toY(result.state1.pressureBar) };
  const p2 = { x: toX(result.state2.enthalpyKjKg), y: toY(result.state2.pressureBar) };
  const p3 = { x: toX(result.state3.enthalpyKjKg), y: toY(result.state3.pressureBar) };
  const p4 = { x: toX(result.state4.enthalpyKjKg), y: toY(result.state4.pressureBar) };

  const cyclePathString = `M ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${p3.x},${p3.y} L ${p4.x},${p4.y} Z`;

  // Animation states & controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animProgress, setAnimProgress] = useState<number>(0);
  const [animSpeed, setAnimSpeed] = useState<number>(1);

  // Auto-play trigger when requested (e.g. from saved plot replay)
  useEffect(() => {
    if (autoPlay) {
      setIsPlaying(true);
      setAnimProgress(0);
    }
  }, [autoPlay, result]);

  // RequestAnimationFrame animation loop
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const baseDuration = 5.0; // 5 seconds per full cycle loop at 1x
      setAnimProgress((prev) => (prev + (dt * animSpeed) / baseDuration) % 1.0);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, animSpeed]);

  // Cycle segment distances
  const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const d23 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
  const d34 = Math.hypot(p4.x - p3.x, p4.y - p3.y);
  const d41 = Math.hypot(p1.x - p4.x, p1.y - p4.y);
  const totalPerimeter = d12 + d23 + d34 + d41 || 1;

  // Interpolate point along the cycle perimeter at s in [0, 1)
  const getPointOnCycle = (s: number) => {
    const normS = ((s % 1) + 1) % 1;
    const d = normS * totalPerimeter;

    if (d <= d12) {
      const u = d / (d12 || 1);
      return {
        x: p1.x + u * (p2.x - p1.x),
        y: p1.y + u * (p2.y - p1.y),
        segment: 1, // 1 -> 2: Compression
        color: '#f97316',
      };
    } else if (d <= d12 + d23) {
      const u = (d - d12) / (d23 || 1);
      return {
        x: p2.x + u * (p3.x - p2.x),
        y: p2.y + u * (p3.y - p2.y),
        segment: 2, // 2 -> 3: Condensation & Subcooling
        color: '#ef4444',
      };
    } else if (d <= d12 + d23 + d34) {
      const u = (d - d12 - d23) / (d34 || 1);
      return {
        x: p3.x + u * (p4.x - p3.x),
        y: p3.y + u * (p4.y - p3.y),
        segment: 3, // 3 -> 4: Isenthalpic Expansion
        color: '#10b981',
      };
    } else {
      const u = (d - d12 - d23 - d34) / (d41 || 1);
      return {
        x: p4.x + u * (p1.x - p4.x),
        y: p4.y + u * (p1.y - p4.y),
        segment: 4, // 4 -> 1: Evaporation
        color: '#06b6d4',
      };
    }
  };

  const currentLeadPt = getPointOnCycle(animProgress);
  const activeSegment = currentLeadPt.segment;

  // Fluid particle stream along cycle
  const particleOffsets = [0, 0.035, 0.07, 0.105, 0.14, 0.175, 0.21];
  const particles = particleOffsets.map((offset, idx) => {
    const pt = getPointOnCycle(animProgress - offset);
    return {
      x: pt.x,
      y: pt.y,
      color: pt.color,
      isLead: idx === 0,
      radius: idx === 0 ? 6.5 : Math.max(2.5, 5 - idx * 0.5),
      opacity: idx === 0 ? 1 : Math.max(0.2, 0.85 - idx * 0.12),
    };
  });

  // Optional comparison cycle coordinates
  const compCoords = useMemo(() => {
    if (!comparisonResult) return null;
    return {
      p1: { x: toX(comparisonResult.state1.enthalpyKjKg), y: toY(comparisonResult.state1.pressureBar) },
      p2: { x: toX(comparisonResult.state2.enthalpyKjKg), y: toY(comparisonResult.state2.pressureBar) },
      p3: { x: toX(comparisonResult.state3.enthalpyKjKg), y: toY(comparisonResult.state3.pressureBar) },
      p4: { x: toX(comparisonResult.state4.enthalpyKjKg), y: toY(comparisonResult.state4.pressureBar) },
      name: comparisonResult.refrigerant.name,
    };
  }, [comparisonResult, toX, toY]);

  // Standard logarithmic pressure grid ticks matching the R410A reference chart
  const pTicks = useMemo(() => {
    return spec.pTicks.filter((p) => p >= result.pMin * 0.96 && p <= result.pMax * 1.04);
  }, [spec.pTicks, result.pMin, result.pMax]);

  // Standard enthalpy linear grid ticks
  const hTicks = useMemo(() => {
    const step = spec.hStep;
    const ticks: number[] = [];
    const start = Math.ceil(result.hMin / step) * step;
    for (let h = start; h <= result.hMax; h += step) {
      ticks.push(h);
    }
    return ticks;
  }, [spec.hStep, result.hMin, result.hMax]);

  // ================= 1. STANDARD ISOTHERMS (T = const, RED LINES) =================
  // Matches standard Solkane / CoolPack Mollier chart red curves
  const isotherms = useMemo(() => {
    const refId = result.refrigerant.id;
    const tcrit = result.refrigerant.tcritC;
    const pcrit = result.refrigerant.pcritBar;
    const hcrit = result.refrigerant.hcritKjKg ?? dome[dome.length - 1].hf;

    return spec.tValues.map((temp) => {
      if (temp < tcrit - 0.5) {
        const pSat = getRefSaturationPressure(refId, temp);
        const hf = getRefLiquidEnthalpy(refId, temp);
        const hg = getRefVaporEnthalpy(refId, temp);

        // Subcooled liquid line (rising almost vertically from Psat up to pMax)
        const subPts: string[] = [];
        const pMaxSub = Math.min(result.pMax * 1.02, pcrit * 0.99);
        if (pMaxSub > pSat) {
          const subSteps = 6;
          for (let s = subSteps; s >= 1; s--) {
            const pCur = pSat + (s / subSteps) * (pMaxSub - pSat);
            const hCur = getRefSubcooledEnthalpy(refId, pCur, temp);
            subPts.push(`${toX(hCur)},${toY(pCur)}`);
          }
        }
        subPts.push(`${toX(hf)},${toY(pSat)}`);

        // Superheated vapor line (dropping from Psat down to pMin)
        const supPts: string[] = [`${toX(hg)},${toY(pSat)}`];
        const pMinSup = Math.max(result.pMin * 0.98, 0.15);
        if (pSat > pMinSup) {
          const supSteps = 16;
          for (let s = 1; s <= supSteps; s++) {
            const frac = s / supSteps;
            const pCur = pSat * Math.pow(pMinSup / pSat, frac);
            const hCur = getRefSuperheatedEnthalpy(refId, pCur, temp);
            if (hCur <= hMax + 60 && pCur >= pMinSup) {
              supPts.push(`${toX(hCur)},${toY(pCur)}`);
            }
          }
        }

        const isInsideDomeVisible = pSat >= result.pMin && pSat <= result.pMax;

        return {
          t: temp,
          pSat,
          hf,
          hg,
          subcooledPath: subPts.length >= 2 ? `M ${subPts.join(' L ')}` : '',
          horizontalPath: isInsideDomeVisible ? `M ${toX(hf)},${toY(pSat)} L ${toX(hg)},${toY(pSat)}` : '',
          superheatedPath: supPts.length >= 2 ? `M ${supPts.join(' L ')}` : '',
          isSupercritical: false,
          labelX: toX(Math.min(hMax - 10, hg + 30)),
          labelY: toY(Math.max(result.pMin * 1.05, pSat * 0.5)),
        };
      } else {
        // Supercritical isotherm (smooth drop strictly outside two-phase dome)
        const supPts: string[] = [];
        const pMaxPlot = Math.min(result.pMax, pcrit * 1.4);
        const pMinPlot = Math.max(result.pMin, 0.4);
        const steps = 16;
        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          const pCur = pMaxPlot * Math.pow(pMinPlot / pMaxPlot, frac);
          const hCur = getRefSuperheatedEnthalpy(refId, pCur, temp);
          if (hCur >= hMin && hCur <= hMax + 50) {
            supPts.push(`${toX(hCur)},${toY(pCur)}`);
          }
        }
        return {
          t: temp,
          pSat: pcrit,
          hf: 0,
          hg: 0,
          subcooledPath: '',
          horizontalPath: '',
          superheatedPath: supPts.length >= 2 ? `M ${supPts.join(' L ')}` : '',
          isSupercritical: true,
          labelX: toX(Math.min(hMax - 20, hcrit + 80)),
          labelY: toY(pMinPlot * 1.1),
        };
      }
    });
  }, [spec.tValues, result.refrigerant, result.pMin, result.pMax, hMin, hMax, plotWidth, plotHeight, dome, toX, toY]);

  // ================= 2. STANDARD ISENTROPES (s = const, BLUE LINES) =================
  // Continuous curves across both dome and superheated vapor zone
  const isentropicLines = useMemo(() => {
    const lines: Array<{ sVal: number; path: string; labelX: number; labelY: number }> = [];
    const refId = result.refrigerant.id;
    const curve = THERMO_CURVES_LOCAL[refId] ?? { k: 1.17, cpg: 1.25, cpf: 1.75 };
    const pMinLocal = result.pMin;
    const pMaxLocal = result.pMax;

    spec.sValues.forEach((s) => {
      const pts: Array<{ x: number; y: number }> = [];
      const numSteps = 24;

      for (let j = 0; j <= numSteps; j++) {
        const frac = j / numSteps;
        const pCur = pMinLocal * Math.pow(pMaxLocal / pMinLocal, frac);

        if (pCur < result.refrigerant.pcritBar) {
          const tSat = getRefSaturationTemp(refId, pCur);
          const hf = getRefLiquidEnthalpy(refId, tSat);
          const hg = getRefVaporEnthalpy(refId, tSat);
          const tK = tSat + 273.15;

          const sf = 1.0 + curve.cpf * Math.log(tK / 273.15);
          const sg = sf + (hg - hf) / Math.max(1, tK);

          let hCur: number;
          if (s < sf) {
            hCur = hf + tK * (s - sf);
          } else if (s <= sg) {
            const x = (s - sf) / Math.max(0.001, sg - sf);
            hCur = hf + x * (hg - hf);
          } else {
            const tSuper = tK * Math.exp((s - sg) / curve.cpg);
            hCur = hg + curve.cpg * (tSuper - tK);
          }

          if (hCur >= hMin - 40 && hCur <= hMax + 60) {
            pts.push({ x: toX(hCur), y: toY(pCur) });
          }
        }
      }

      if (pts.length >= 3) {
        const path = `M ${pts[0].x},${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x},${p.y}`).join(' ');
        const bottomPt = pts[0];
        lines.push({
          sVal: s,
          path,
          labelX: Math.max(margin.left + 5, bottomPt.x),
          labelY: margin.top + plotHeight + 14,
        });
      }
    });

    return lines;
  }, [spec.sValues, result.refrigerant, result.pMin, result.pMax, hMin, hMax, plotWidth, plotHeight]);

  // ================= 3. STANDARD ISOCHORS (v = const, GREEN LINES) =================
  // Sloping gently from lower-left to upper-right, labeled at top & right margins
  const isochoricLines = useMemo(() => {
    const lines: Array<{ vVal: number; path: string; labelX: number; labelY: number; labelPos: 'top' | 'right' }> = [];
    const refId = result.refrigerant.id;
    const curve = THERMO_CURVES_LOCAL[refId] ?? { k: 1.17, cpg: 1.25, cpf: 1.75 };
    const pMinLocal = result.pMin;
    const pMaxLocal = result.pMax;

    spec.vValues.forEach((v) => {
      const pts: Array<{ x: number; y: number }> = [];
      const numSteps = 24;

      for (let j = 0; j <= numSteps; j++) {
        const frac = j / numSteps;
        const pCur = pMinLocal * Math.pow(pMaxLocal / pMinLocal, frac);

        if (pCur < result.refrigerant.pcritBar) {
          const tSat = getRefSaturationTemp(refId, pCur);
          const vl = getRefLiquidSpecificVolume(refId, tSat) / 1000; // m3/kg
          const vg = getRefVaporSpecificVolume(refId, tSat); // m3/kg
          const hf = getRefLiquidEnthalpy(refId, tSat);
          const hg = getRefVaporEnthalpy(refId, tSat);

          let hCur: number;
          if (v < vl) {
            hCur = hf;
          } else if (v <= vg) {
            const x = (v - vl) / Math.max(0.0001, vg - vl);
            hCur = hf + x * (hg - hf);
          } else {
            const tK = (tSat + 273.15) * (v / vg);
            hCur = hg + curve.cpg * Math.max(0, tK - 273.15 - tSat);
          }

          if (hCur >= hMin - 30 && hCur <= hMax + 60) {
            pts.push({ x: toX(hCur), y: toY(pCur) });
          }
        }
      }

      if (pts.length >= 3) {
        const path = `M ${pts[0].x},${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x},${p.y}`).join(' ');
        const lastPt = pts[pts.length - 1];
        const isExitingTop = lastPt.y <= margin.top + 5;

        lines.push({
          vVal: v,
          path,
          labelX: isExitingTop ? lastPt.x : margin.left + plotWidth + 3,
          labelY: isExitingTop ? margin.top - 5 : lastPt.y,
          labelPos: isExitingTop ? 'top' : 'right',
        });
      }
    });

    return lines;
  }, [spec.vValues, result.refrigerant, result.pMin, result.pMax, hMin, hMax, plotWidth, plotHeight]);

  // ================= 4. VAPOR QUALITY (x = const, BLACK THIN LINES) =================
  const qualityCurves = useMemo(() => {
    const apexX = toX(result.refrigerant.hcritKjKg ?? dome[dome.length - 1].hf);
    const apexY = toY(result.refrigerant.pcritBar);

    return [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((x) => {
      const points = dome
        .filter((d) => d.pBar < result.refrigerant.pcritBar * 0.985)
        .map((d) => {
          const hx = d.hf + x * (d.hg - d.hf);
          return `${toX(hx)},${toY(d.pBar)}`;
        });
      // Converge smoothly to critical point apex
      points.push(`${apexX},${apexY}`);

      const bottomPt = dome[0];
      const bottomX = toX(bottomPt.hf + x * (bottomPt.hg - bottomPt.hf));
      const bottomY = toY(bottomPt.pBar);
      return { x, path: `M ${points.join(' L ')}`, bottomX, bottomY };
    });
  }, [dome, result.refrigerant, toX, toY]);

  // Colors & Styles based on Canvas Theme
  const isDark = canvasTheme === 'dark';
  const bgColor = isDark ? '#090d16' : '#ffffff';
  const frameBorderColor = isDark ? '#475569' : '#000000';
  const gridColor = isDark ? '#1e293b' : '#cbd5e1';
  const axisTextColor = isDark ? '#94a3b8' : '#000000';
  const domeColor = isDark ? '#f8fafc' : '#000000'; // Authentic thick black dome as in R410A reference
  const isothermColor = '#dc2626'; // Standard RED
  const isentropicColor = '#2563eb'; // Standard BLUE
  const isochoricColor = '#16a34a'; // Standard GREEN
  const qualityColor = isDark ? '#64748b' : '#0f172a'; // Standard BLACK/DARK

  // Mouse Wheel Zoom Listener with centered focus on cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent browser default window scrolling while mouse is over diagram
      e.preventDefault();

      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      const nextZoom = Math.min(6.0, Math.max(0.6, currentZoom * factor));
      if (Math.abs(nextZoom - currentZoom) < 0.001) return;

      const rect = el.getBoundingClientRect();
      const mouseXRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const mouseYRatio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      const curVbW = width / currentZoom;
      const curVbH = height / currentZoom;
      const curVbX = -panX + (width - curVbW) / 2;
      const curVbY = -panY + (height - curVbH) / 2;

      const cursorSvgX = curVbX + mouseXRatio * curVbW;
      const cursorSvgY = curVbY + mouseYRatio * curVbH;

      const newVbW = width / nextZoom;
      const newVbH = height / nextZoom;

      const newPanX = (width - newVbW) / 2 - (cursorSvgX - mouseXRatio * newVbW);
      const newPanY = (height - newVbH) / 2 - (cursorSvgY - mouseYRatio * newVbH);

      setLocalZoom(nextZoom);
      setPanX(newPanX);
      setPanY(newPanY);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [currentZoom, panX, panY, width, height]);

  // Zoom & Pan viewBox coordinates
  const viewBoxW = width / currentZoom;
  const viewBoxH = height / currentZoom;
  const viewBoxX = -panX + (width - viewBoxW) / 2;
  const viewBoxY = -panY + (height - viewBoxH) / 2;

  return (
    <div
      className={
        isPrintView
          ? 'bg-white text-slate-900 border border-slate-300 rounded p-3 space-y-3 print:p-0 print:border-0'
          : hideInternalToolbar
          ? 'relative w-full'
          : `${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} border rounded-xl p-5 space-y-4 shadow-xl transition-colors`
      }
    >
      {/* 1. TOP HEADER & TOOLBAR (Only shown in standalone mode or print view) */}
      {!hideInternalToolbar && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-4 h-4 rounded-sm shadow-xs border border-black/20"
              style={{ backgroundColor: result.refrigerant.color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-sm sm:text-base font-bold tracking-wide font-sans uppercase ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {language === 'en' ? 'MOLLIER STANDARD P-h DIAGRAM – ' : 'DIAGRAM P-h STANDAR MOLLIER – '}{result.refrigerant.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  {language === 'en' ? 'SOLKANE / ASHRAE STANDARD' : 'STANDAR SOLKANE / ASHRAE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {language === 'en' ? 'Fluid: ' : 'Fluida: '}<strong className={isDark ? 'text-cyan-400' : 'text-slate-900'}>{result.refrigerant.id}</strong> ({result.refrigerant.formula}) · {language === 'en' ? 'Black Dome, Red Isotherm, Blue Isentrope, Green Isochor' : 'Kubah Hitam, Isoterm Merah, Isentropik Biru, Isochor Hijau'}
              </p>
            </div>
          </div>

          {/* Legend, Theme Switcher & Toggle Controls */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            {!isPrintView && (
              <>
                {/* Theme Toggle (Standard White Paper vs Dark Blueprint) */}
                <button
                  type="button"
                  onClick={() => setCanvasTheme((prev) => (prev === 'standard' ? 'dark' : 'standard'))}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    canvasTheme === 'standard'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                  }`}
                  title={language === 'en' ? 'Toggle Canvas Theme: Standard Paper / Dark Mode' : 'Ganti Tema Kanvas: Kertas Standar Putih / Mode Gelap'}
                >
                  <span>{canvasTheme === 'standard' ? (language === 'en' ? '☀️ White Paper' : '☀️ Kertas Standar') : (language === 'en' ? '🌙 Dark Mode' : '🌙 Mode Gelap')}</span>
                </button>

                {/* Skeleton Families Toggles */}
                <div className={`flex items-center gap-1 p-0.5 rounded border text-[10px] ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setLocalShowIsotherms(!localShowIsotherms)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      showIsotherms
                        ? 'bg-red-500 text-white font-bold'
                        : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title={language === 'en' ? 'Toggle Temperature Isotherms (T, Red)' : 'Tampilkan / Sembunyikan Isoterma Suhu (T, Merah)'}
                  >
                    {language === 'en' ? 'T (Isotherm)' : 'T (Isoterm)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalShowEntropy(!localShowEntropy)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      showEntropy
                        ? 'bg-blue-600 text-white font-bold'
                        : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title={language === 'en' ? 'Toggle Entropy Lines (s, Blue)' : 'Tampilkan / Sembunyikan Garis Entropi (s, Biru)'}
                  >
                    {language === 'en' ? 's (Entropy)' : 's (Entropi)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalShowVolume(!localShowVolume)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      showVolume
                        ? 'bg-emerald-600 text-white font-bold'
                        : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title={language === 'en' ? 'Toggle Specific Volume Lines (v, Green)' : 'Tampilkan / Sembunyikan Garis Volume Spesifik (v, Hijau)'}
                  >
                    v (Isochor)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalShowQuality(!localShowQuality)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      showQuality
                        ? 'bg-slate-700 text-white font-bold'
                        : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title={language === 'en' ? 'Toggle Vapor Quality (x, Dark)' : 'Tampilkan / Sembunyikan Kualitas Uap (x, Hitam)'}
                  >
                    {language === 'en' ? 'x (Quality)' : 'x (Kualitas)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalShowCycle(!localShowCycle)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      showCycle
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title={language === 'en' ? 'Toggle Refrigeration Cycle (1-2-3-4)' : 'Tampilkan / Sembunyikan Siklus Refrigerasi (1-2-3-4)'}
                  >
                    {language === 'en' ? 'Cycle' : 'Siklus'}
                  </button>
                </div>
              </>
            )}

            {/* Color Legend Indicators */}
            <div className="hidden lg:flex items-center gap-3 text-[11px] pl-2 border-l border-slate-300/60">
              <span className="flex items-center gap-1">
                <span className="w-3 h-1 bg-black inline-block rounded-xs" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{language === 'en' ? 'Dome (x=0,1)' : 'Kubah (x=0,1)'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-red-600 inline-block" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{language === 'en' ? 'Isotherm (T)' : 'Isoterm (T)'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-blue-600 inline-block" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{language === 'en' ? 'Isentrope (s)' : 'Isentropik (s)'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Isochor (v)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-1 bg-amber-500 inline-block rounded-xs" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{language === 'en' ? 'Cycle 1-2-3-4' : 'Siklus 1-2-3-4'}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. PLAYBACK & CONTROLS TOOLBAR (Only shown in standalone mode) */}
      {!isPrintView && !hideInternalToolbar && (
        <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border shadow-xs ${
          isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (propOnTogglePlay) propOnTogglePlay();
                else setLocalShowCycle((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-bold shadow-xs transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <span>{isPlaying ? '⏸️ Jeda Animasi' : '▶️ Putar Aliran'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAnimProgress(0);
              }}
              className="px-2.5 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-xs cursor-pointer transition-colors border border-slate-300 font-semibold"
            >
              ⏮️ Reset
            </button>

            <div className="flex items-center bg-slate-200/80 rounded border border-slate-300 p-0.5 text-[11px] font-mono">
              {[0.5, 1.0, 2.0].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setAnimSpeed(spd)}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    animSpeed === spd ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-200/60 border border-slate-300/80 text-[11px] font-mono">
              <span className="text-slate-600">Aliran Siklus:</span>
              <strong className="text-slate-900 font-mono">{Math.round(animProgress * 100)}%</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSavePlot && (
              <button
                type="button"
                onClick={onSavePlot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <span>💾 Simpan Plotting</span>
              </button>
            )}
            {onOpenSavedList && (
              <button
                type="button"
                onClick={onOpenSavedList}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 font-mono text-xs font-semibold cursor-pointer transition-colors"
              >
                <span>📂 Plot Tersimpan</span>
                {savedPlotsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-600 text-white font-black">
                    {savedPlotsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. SVG CANVAS CONTAINER (STANDARD ENGINEERING MOLLIER P-h CHART) */}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden rounded-lg border shadow-inner ${
          isDark ? 'bg-[#090d16] border-slate-800/80' : 'bg-white border-slate-300'
        } p-1 sm:p-2`}
      >
        {/* Floating Mouse Zoom & Pan Controls Overlay */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-[#0b101e]/90 border border-slate-700/80 rounded-lg p-1 shadow-xl backdrop-blur-md z-20 select-none">
          <button
            type="button"
            onClick={() => setLocalZoom((z) => Math.min(6.0, z * 1.25))}
            className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono font-bold text-sm cursor-pointer transition-colors shadow-xs"
            title="Zoom In (atau gunakan Scroll Roda Mouse Ke Atas)"
          >
            +
          </button>
          <span className="px-1.5 text-[11px] font-mono font-bold text-white min-w-[42px] text-center">
            {Math.round(currentZoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setLocalZoom((z) => Math.max(0.6, z * 0.8))}
            className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono font-bold text-sm cursor-pointer transition-colors shadow-xs"
            title="Zoom Out (atau gunakan Scroll Roda Mouse Ke Bawah)"
          >
            &minus;
          </button>
          <button
            type="button"
            onClick={() => {
              setLocalZoom(1);
              setPanX(0);
              setPanY(0);
            }}
            className="px-2 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[11px] font-bold cursor-pointer transition-colors border border-slate-700/60"
            title={language === 'en' ? 'Reset Zoom & Position to 100%' : 'Reset Zoom & Posisi ke 100%'}
          >
            ⟲ {language === 'en' ? 'Reset' : 'Reset'}
          </button>
          <div className="hidden md:flex items-center text-[10px] text-slate-400 font-mono pl-1 border-l border-slate-700/60">
            <span>{language === 'en' ? '💡 Scroll: Zoom · Drag: Pan' : '💡 Scroll: Zoom · Geser: Pan'}</span>
          </div>
        </div>
        <svg
          viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`}
          className={`w-full h-auto select-none font-sans ${isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
          style={{ backgroundColor: bgColor }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            {/* Subtle Dome Two-Phase Region Fill */}
            <linearGradient id="domeFillStandard" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity={isDark ? '0.08' : '0.04'} />
              <stop offset="100%" stopColor="#0284c7" stopOpacity={isDark ? '0.12' : '0.07'} />
            </linearGradient>

            {/* Cycle Highlight Fill */}
            <linearGradient id="cycleFillStandard" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.12" />
            </linearGradient>

            <marker
              id="cycle-arrow-amber"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d97706" />
            </marker>

            {/* Strict plot area clip path to prevent curves (isotherms, dome, isentropes) from crossing left/right/top/bottom boundaries */}
            <clipPath id="ph-diagram-plot-clip">
              <rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} />
            </clipPath>
          </defs>

          {/* Solid Plot Interior Background (ensures pristine contrast and eliminates artifacts) */}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill={isDark ? '#080d1a' : '#ffffff'}
          />

          {/* Left Margin Mask behind axis labels to ensure 100% clean left boundary */}
          <rect
            x={0}
            y={0}
            width={margin.left}
            height={height}
            fill={isDark ? '#090d16' : '#f8fafc'}
          />

          {/* ================= A. BACKGROUND GRID LINES (ISOBARS & ISENTHALPS) ================= */}
          {showGrid && (
            <g className="chart-grid-layer">
              {/* Horizontal Isobars */}
              {pTicks.map((p) => {
                const y = toY(p);
                return (
                  <g key={`p-${p}`}>
                    <line
                      x1={margin.left}
                      y1={y}
                      x2={margin.left + plotWidth}
                      y2={y}
                      stroke={gridColor}
                      strokeWidth="0.8"
                    />
                    {/* Tick mark on left axis */}
                    <line
                      x1={margin.left - 4}
                      y1={y}
                      x2={margin.left}
                      y2={y}
                      stroke={frameBorderColor}
                      strokeWidth="1.2"
                    />
                    {/* Tick mark on right axis */}
                    <line
                      x1={margin.left + plotWidth}
                      y1={y}
                      x2={margin.left + plotWidth + 4}
                      y2={y}
                      stroke={frameBorderColor}
                      strokeWidth="1.2"
                    />
                    <text
                      x={margin.left - 7}
                      y={y + 3.5}
                      fill={axisTextColor}
                      fontSize="9.5"
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight="600"
                      textAnchor="end"
                    >
                      {(() => {
                        const isImp = unitSystem === 'Imperial' || pressureUnit === 'psi';
                        if (isImp) {
                          if (pressureBasis === 'gauge') {
                            const pgBar = p - 1.013;
                            const pgPsi = pgBar * 14.5038;
                            if (Math.abs(pgPsi) < 1.0) return '0';
                            if (pgPsi < 0) return pgPsi.toFixed(0);
                            return Math.round(pgPsi).toString();
                          }
                          const pPsi = p * 14.5038;
                          return Math.round(pPsi).toString();
                        }
                        if (pressureBasis === 'gauge') {
                          const pg = p - 1.013;
                          if (Math.abs(pg) < 0.08) return '0';
                          if (pg < 0) return (Math.round(pg * 10) / 10).toFixed(1);
                          if (pg >= 10) return Math.round(pg).toString();
                          if (pg >= 1) return (Math.round(pg * 10) / 10).toFixed(pg % 1 === 0 ? 0 : 1);
                          return (Math.round(pg * 10) / 10).toFixed(1);
                        }
                        return p >= 1 ? (p % 1 === 0 ? p.toFixed(0) : p.toFixed(1)) : p.toFixed(2);
                      })()}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Isenthalps */}
              {hTicks.map((h) => {
                const x = toX(h);
                return (
                  <g key={`h-${h}`}>
                    <line
                      x1={x}
                      y1={margin.top}
                      x2={x}
                      y2={margin.top + plotHeight}
                      stroke={gridColor}
                      strokeWidth="0.8"
                    />
                    {/* Tick mark on bottom axis */}
                    <line
                      x1={x}
                      y1={margin.top + plotHeight}
                      x2={x}
                      y2={margin.top + plotHeight + 4}
                      stroke={frameBorderColor}
                      strokeWidth="1.2"
                    />
                    {/* Tick mark on top axis */}
                    <line
                      x1={x}
                      y1={margin.top - 4}
                      x2={x}
                      y2={margin.top}
                      stroke={frameBorderColor}
                      strokeWidth="1.2"
                    />
                    <text
                      x={x}
                      y={margin.top + plotHeight + 17}
                      fill={axisTextColor}
                      fontSize="9.5"
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {unitSystem === 'Imperial' || enthalpyUnit === 'Btu/lb'
                        ? Math.round(h * 0.429923)
                        : h}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ================= B. SKELETON: ISENTROPES (s = const, BLUE LINES) ================= */}
          {showEntropy && (
            <g className="isentropic-curves-family" opacity="0.85">
              {/* Clipped curve paths */}
              <g clipPath="url(#ph-diagram-plot-clip)">
                {isentropicLines.map((line, idx) => (
                  <path
                    key={`s-line-${idx}`}
                    d={line.path}
                    fill="none"
                    stroke={isentropicColor}
                    strokeWidth="0.85"
                  />
                ))}
              </g>
              {/* s value labels along bottom border (unclipped so numbers stay fully legible) */}
              {isentropicLines.map((line, idx) =>
                idx % 2 === 0 ? (
                  <text
                    key={`s-label-${idx}`}
                    x={line.labelX}
                    y={line.labelY}
                    fill={isentropicColor}
                    fontSize="8"
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    s={line.sVal}
                  </text>
                ) : null
              )}
            </g>
          )}

          {/* ================= C. SKELETON: ISOCHORS (v = const, GREEN LINES) ================= */}
          {showVolume && (
            <g className="isochoric-curves-family" opacity="0.85">
              {/* Clipped curve paths */}
              <g clipPath="url(#ph-diagram-plot-clip)">
                {isochoricLines.map((line, idx) => (
                  <path
                    key={`v-line-${idx}`}
                    d={line.path}
                    fill="none"
                    stroke={isochoricColor}
                    strokeWidth="0.85"
                  />
                ))}
              </g>
              {/* Labels at top or right margins matching standard Solkane / CoolPack chart */}
              {isochoricLines.map((line, idx) => (
                <text
                  key={`v-label-${idx}`}
                  x={line.labelX}
                  y={line.labelY}
                  fill={isochoricColor}
                  fontSize="7.5"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="bold"
                  textAnchor={line.labelPos === 'top' ? 'middle' : 'start'}
                >
                  {line.vVal}
                </text>
              ))}
            </g>
          )}

          {/* ================= D. SKELETON: ISOTHERMS (T = const, RED LINES) ================= */}
          {showIsotherms && (
            <g className="isotherm-curves-family" opacity="0.9" clipPath="url(#ph-diagram-plot-clip)">
              {isotherms.map((iso, idx) => (
                <g key={`iso-line-${iso.t}-${idx}`}>
                  {/* Subcooled curve */}
                  {iso.subcooledPath && (
                    <path
                      d={iso.subcooledPath}
                      fill="none"
                      stroke={isothermColor}
                      strokeWidth="0.95"
                    />
                  )}
                  {/* Horizontal line inside dome */}
                  {iso.horizontalPath && (
                    <path
                      d={iso.horizontalPath}
                      fill="none"
                      stroke={isothermColor}
                      strokeWidth="0.95"
                    />
                  )}
                  {/* Superheated vapor curve */}
                  {iso.superheatedPath && (
                    <path
                      d={iso.superheatedPath}
                      fill="none"
                      stroke={isothermColor}
                      strokeWidth="0.95"
                    />
                  )}
                  {/* Temperature label inside dome */}
                  {!iso.isSupercritical && iso.horizontalPath && iso.t % 10 === 0 && (
                    <text
                      x={toX(iso.hf + 0.35 * (iso.hg - iso.hf))}
                      y={toY(iso.pSat) - 2.5}
                      fill={isothermColor}
                      fontSize="8"
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {unitSystem === 'Imperial' || tempUnit === '°F'
                        ? `${Math.round(iso.t * 1.8 + 32)}°`
                        : `${iso.t}°`}
                    </text>
                  )}
                  {/* Temperature label along lower margin / right curve */}
                  {iso.t % 20 === 0 && (
                    <text
                      x={iso.labelX}
                      y={iso.labelY}
                      fill={isothermColor}
                      fontSize="8"
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {unitSystem === 'Imperial' || tempUnit === '°F'
                        ? `${Math.round(iso.t * 1.8 + 32)}°`
                        : `${iso.t}°`}
                    </text>
                  )}
                </g>
              ))}
            </g>
          )}

          {/* ================= E. SKELETON: VAPOR QUALITY (x = const, BLACK THIN LINES) ================= */}
          {showQuality && (
            <g className="quality-curves-family" opacity="0.85" clipPath="url(#ph-diagram-plot-clip)">
              {qualityCurves.map(({ x, path, bottomX, bottomY }) => (
                <g key={`q-${x}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke={qualityColor}
                    strokeWidth="0.8"
                  />
                  {/* x label at bottom of dome */}
                  <text
                    x={bottomX}
                    y={Math.min(margin.top + plotHeight - 4, bottomY + 11)}
                    fill={qualityColor}
                    fontSize="7.5"
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    x={x.toFixed(2)}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* ================= F. SATURATION DOME (THICK OUTLINE & CRITICAL POINT) ================= */}
          {showDome && (
            <g className="saturation-dome-layer">
              {/* Strictly clip dome curves inside the plot area */}
              <g clipPath="url(#ph-diagram-plot-clip)">
                {/* Fill inside two-phase dome */}
                <path
                  d={domePathString}
                  fill="url(#domeFillStandard)"
                  stroke="none"
                />
                {/* Liquid Saturation Line (x=0) and Vapor Saturation Line (x=1) */}
                <path
                  d={domePathString}
                  fill="none"
                  stroke={domeColor}
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>

              {/* Critical Point Apex Marker & Label */}
              <g className="critical-point-marker">
                <circle
                  cx={toX(result.refrigerant.hcritKjKg ?? dome[dome.length - 1].hf)}
                  cy={toY(result.refrigerant.pcritBar)}
                  r="4.5"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                >
                  <title>{`Critical Point: ${result.refrigerant.tcritC.toFixed(1)}°C, ${result.refrigerant.pcritBar.toFixed(2)} bar, ${(result.refrigerant.hcritKjKg ?? dome[dome.length - 1].hf).toFixed(1)} kJ/kg`}</title>
                </circle>
                <text
                  x={toX(result.refrigerant.hcritKjKg ?? dome[dome.length - 1].hf)}
                  y={toY(result.refrigerant.pcritBar) - 7}
                  fill={isDark ? '#f8fafc' : '#0f172a'}
                  fontSize="8.5"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  letterSpacing="0.05em"
                >
                  CRITICAL POINT
                </text>
              </g>
            </g>
          )}

          {/* ================= G. REFRIGERANT CYCLE OVERLAY (1 ➔ 2 ➔ 3 ➔ 4) ================= */}
          {showCycle && (
            <g className="refrigeration-cycle-layer">
              <g clipPath="url(#ph-diagram-plot-clip)">
                {/* Highlight Pe Isobar */}
                <line
                  x1={margin.left}
                  y1={toY(result.peBar)}
                  x2={margin.left + plotWidth}
                  y2={toY(result.peBar)}
                  stroke="#0284c7"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  opacity="0.75"
                />

                {/* Highlight Pc Isobar */}
                <line
                  x1={margin.left}
                  y1={toY(result.pcBar)}
                  x2={margin.left + plotWidth}
                  y2={toY(result.pcBar)}
                  stroke="#ea580c"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  opacity="0.75"
                />

                {/* Cycle Fill Polygon */}
                <path
                  d={cyclePathString}
                  fill="url(#cycleFillStandard)"
                  stroke="none"
                />

                {/* Cycle Perimeter with Arrows */}
                <path
                  d={cyclePathString}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Directional Arrows along Segments */}
                {/* 1 -> 2: Compression */}
                <line
                  x1={p1.x + 0.3 * (p2.x - p1.x)}
                  y1={p1.y + 0.3 * (p2.y - p1.y)}
                  x2={p1.x + 0.5 * (p2.x - p1.x)}
                  y2={p1.y + 0.5 * (p2.y - p1.y)}
                  stroke="#d97706"
                  strokeWidth="3.2"
                  markerEnd="url(#cycle-arrow-amber)"
                />
                {/* 2 -> 3: Condensation */}
                <line
                  x1={p2.x + 0.3 * (p3.x - p2.x)}
                  y1={p2.y}
                  x2={p2.x + 0.55 * (p3.x - p2.x)}
                  y2={p2.y}
                  stroke="#d97706"
                  strokeWidth="3.2"
                  markerEnd="url(#cycle-arrow-amber)"
                />
                {/* 3 -> 4: Expansion */}
                <line
                  x1={p3.x}
                  y1={p3.y + 0.3 * (p4.y - p3.y)}
                  x2={p3.x}
                  y2={p3.y + 0.55 * (p4.y - p3.y)}
                  stroke="#d97706"
                  strokeWidth="3.2"
                  markerEnd="url(#cycle-arrow-amber)"
                />
                {/* 4 -> 1: Evaporation */}
                <line
                  x1={p4.x + 0.3 * (p1.x - p4.x)}
                  y1={p4.y}
                  x2={p4.x + 0.55 * (p1.x - p4.x)}
                  y2={p4.y}
                  stroke="#d97706"
                  strokeWidth="3.2"
                  markerEnd="url(#cycle-arrow-amber)"
                />

                {/* Point 3 Intersection Guide: T3 liquid isotherm reaching into subcooled region */}
                <g className="t3-subcooling-guide">
                  <circle cx={p3.x} cy={p3.y} r="5" fill="#16a34a" stroke="#ffffff" strokeWidth="2" />
                  <line
                    x1={p3.x}
                    y1={p3.y}
                    x2={p3.x - 4}
                    y2={Math.max(margin.top, p3.y - 20)}
                    stroke="#16a34a"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                </g>
              </g>

              {/* Animated Fluid Particles along Cycle */}
              {isPlaying && (
                <g className="fluid-particles-stream">
                  {particles.map((pt, idx) => (
                    <circle
                      key={`part-${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.radius}
                      fill={pt.color}
                      opacity={pt.opacity}
                      stroke="#ffffff"
                      strokeWidth={pt.isLead ? 1.5 : 0.8}
                    />
                  ))}
                </g>
              )}

              {/* Numbered State Point Badges (1, 2, 3, 4) */}
              {[
                { pt: p1, state: result.state1, bg: '#f97316', label: '1' },
                { pt: p2, state: result.state2, bg: '#ef4444', label: '2' },
                { pt: p3, state: result.state3, bg: '#10b981', label: '3' },
                { pt: p4, state: result.state4, bg: '#06b6d4', label: '4' },
              ].map(({ pt, state, bg, label }) => {
                const isSelected = activeSelectedPointKey === label;
                return (
                  <g
                    key={`badge-${label}`}
                    className="cursor-pointer"
                    onClick={(e) => handleSelectBadge(label, e)}
                    onMouseEnter={() => {
                      setHoveredPoint(state);
                      propOnHoverPoint && propOnHoverPoint(state);
                    }}
                    onMouseLeave={() => {
                      setHoveredPoint(null);
                      propOnHoverPoint && propOnHoverPoint(null);
                    }}
                  >
                    {/* Lingkaran Biru Muter-Muter (Rotating Blue Circle Animation on Click) */}
                    {isSelected && (
                      <g transform={`translate(${pt.x}, ${pt.y})`}>
                        {/* Radar Pulse Wave */}
                        <circle
                          r="25"
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="1.5"
                          opacity="0.4"
                          className="animate-ping"
                        />
                        {/* Static Subtle Guide Ring */}
                        <circle
                          r="20"
                          fill="none"
                          stroke="#0ea5e9"
                          strokeWidth="1.2"
                          opacity="0.45"
                        />
                        {/* Rotating Dashed Spinner Group using Native SVG animateTransform */}
                        <g>
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 0 0"
                            to="360 0 0"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <circle
                            r="16.5"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2.8"
                            strokeDasharray="18 10 5 10"
                            strokeLinecap="round"
                          />
                          {/* Orbiting beads */}
                          <circle cx="0" cy="-16.5" r="3.2" fill="#67e8f9" />
                          <circle cx="0" cy="16.5" r="2.2" fill="#38bdf8" />
                          <circle cx="16.5" cy="0" r="2.5" fill="#93c5fd" />
                          <circle cx="-16.5" cy="0" r="2.5" fill="#93c5fd" />
                        </g>
                      </g>
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? "12.5" : "9.5"}
                      fill={bg}
                      stroke={isSelected ? "#38bdf8" : "#ffffff"}
                      strokeWidth={isSelected ? "2.5" : "2"}
                      className="shadow-sm hover:scale-125 transition-transform origin-center"
                    />
                    <text
                      x={pt.x}
                      y={pt.y + 3.5}
                      fill="#ffffff"
                      fontSize={isSelected ? "11" : "10"}
                      fontWeight="bold"
                      fontFamily="'JetBrains Mono', monospace"
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ================= H. CRISP OUTER FRAME & REFRIGERANT TITLE ================= */}
          {/* Outer Border Box */}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="none"
            stroke={frameBorderColor}
            strokeWidth="1.6"
          />

          {/* Top-Left Refrigerant Name Header inside plot (matching R410A reference photo!) */}
          <text
            x={margin.left + 12}
            y={margin.top + 22}
            fill={frameBorderColor}
            fontSize="16"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
            letterSpacing="0.5px"
          >
            {result.refrigerant.id}
          </text>

          {/* Y-Axis Label: P [bar g, log scale] or P [psig, log scale] */}
          <text
            x={-(margin.top + plotHeight / 2)}
            y={margin.left - 48}
            fill={axisTextColor}
            fontSize="12"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
            transform="rotate(-90)"
          >
            {unitSystem === 'Imperial' || pressureUnit === 'psi'
              ? (pressureBasis === 'gauge' ? 'P [psig, log scale]' : 'P [psia, log scale]')
              : (pressureBasis === 'gauge' ? 'P [bar g, log scale]' : 'P [bar a, log scale]')}
          </text>

          {/* X-Axis Label: h [kJ/kg] or h [Btu/lb] */}
          <text
            x={margin.left + plotWidth / 2}
            y={margin.top + plotHeight + 42}
            fill={axisTextColor}
            fontSize="12"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            {unitSystem === 'Imperial' || enthalpyUnit === 'Btu/lb' ? 'h [Btu/lb]' : 'h [kJ/kg]'}
          </text>
        </svg>

        {/* Hovered State Point Floating HUD Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-slate-950/95 text-white p-3 rounded-lg border border-slate-700 shadow-2xl text-xs font-mono space-y-1 pointer-events-none z-20 backdrop-blur-sm animate-fadeIn">
            <div className="font-bold text-cyan-400 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
              <span>{hoveredPoint.name}</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold">
                {language === 'en' ? 'Point' : 'Titik'} {hoveredPoint.index}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-1 text-[11px]">
              <div>
                {language === 'en' ? 'Pressure (P): ' : 'Tekanan (P): '}
                <strong className="text-white">
                  {unitSystem === 'Imperial' || pressureUnit === 'psi'
                    ? `${(hoveredPoint.pressureBar * 14.5038).toFixed(1)} psi`
                    : `${hoveredPoint.pressureBar} bar`}
                </strong>
              </div>
              <div>
                {language === 'en' ? 'Temp (T): ' : 'Suhu (T): '}
                <strong className="text-amber-300">
                  {unitSystem === 'Imperial' || tempUnit === '°F'
                    ? `${(hoveredPoint.tempC * 1.8 + 32).toFixed(1)} °F`
                    : `${hoveredPoint.tempC} °C`}
                </strong>
              </div>
              <div>
                {language === 'en' ? 'Enthalpy (h): ' : 'Entalpi (h): '}
                <strong className="text-emerald-400">
                  {unitSystem === 'Imperial' || enthalpyUnit === 'Btu/lb'
                    ? `${(hoveredPoint.enthalpyKjKg * 0.429923).toFixed(1)} Btu/lb`
                    : `${hoveredPoint.enthalpyKjKg} kJ/kg`}
                </strong>
              </div>
              <div>
                {language === 'en' ? 'Phase: ' : 'Fasa: '}
                <strong className="text-cyan-300">{hoveredPoint.phase}</strong>
              </div>
              {hoveredPoint.specificVolumeM3Kg && (
                <div>
                  {language === 'en' ? 'Spec. Vol (v): ' : 'Vol. Spesifik (v): '}
                  <strong className="text-purple-300">
                    {unitSystem === 'Imperial'
                      ? `${(hoveredPoint.specificVolumeM3Kg * 16.0185).toFixed(3)} ft³/lb`
                      : `${hoveredPoint.specificVolumeM3Kg} m³/kg`}
                  </strong>
                </div>
              )}
              {hoveredPoint.entropyKjKgK && (
                <div>
                  {language === 'en' ? 'Entropy (s): ' : 'Entropi (s): '}
                  <strong className="text-blue-400">
                    {unitSystem === 'Imperial'
                      ? `${(hoveredPoint.entropyKjKgK * 0.238846).toFixed(3)} Btu/(lb·°F)`
                      : `${hoveredPoint.entropyKjKgK} kJ/(kg·K)`}
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. FOOTER NOTE & SUMMARY SPECIFICATION */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono pt-2 gap-2 ${
        isDark ? 'text-slate-400' : 'text-slate-600'
      }`}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            {language === 'en'
              ? 'Standard Solkane/CoolPack Log P vs h Chart'
              : 'Format: Diagram Log P vs h Standar Solkane/CoolPack'}
          </span>
          <span>·</span>
          <span>
            {language === 'en' ? 'Pressure Range: ' : 'Rentang Tekanan: '}
            {unitSystem === 'Imperial' || pressureUnit === 'psi'
              ? `${(result.pMin * 14.5038).toFixed(1)} - ${(result.pMax * 14.5038).toFixed(0)} psi`
              : `${result.pMin.toFixed(2)} - ${result.pMax.toFixed(1)} bar`}
          </span>
          <span>·</span>
          <span>
            {language === 'en' ? 'Enthalpy Range: ' : 'Rentang Entalpi: '}
            {unitSystem === 'Imperial' || enthalpyUnit === 'Btu/lb'
              ? `${Math.round(result.hMin * 0.429923)} - ${Math.round(result.hMax * 0.429923)} Btu/lb`
              : `${result.hMin} - ${result.hMax} kJ/kg`}
          </span>
        </div>
        <div>
          {language === 'en' ? 'Cooling Capacity: ' : 'Kapasitas Pendinginan: '}
          <strong className={isDark ? 'text-cyan-300' : 'text-slate-900'}>
            {unitSystem === 'Imperial'
              ? `${(result.coolingCapacityKw * 3412.14).toFixed(0)} Btu/h (${(result.coolingCapacityKw / 3.517).toFixed(2)} TR)`
              : `${result.coolingCapacityKw.toFixed(2)} kW`}
          </strong>{' '}
          | COP: <strong className={isDark ? 'text-emerald-300' : 'text-slate-900'}>{result.copActual.toFixed(2)}</strong>{' '}
          | EER: <strong className={isDark ? 'text-amber-300' : 'text-slate-900'}>{(result.copActual * 3.412142).toFixed(2)}</strong> <span className="text-[10px]">Btu/(W·h)</span>
        </div>
      </div>
    </div>
  );
};

// Local curves helper fallback for entropy and volume calculations
const THERMO_CURVES_LOCAL: Record<string, { k: number; cpg: number; cpf: number }> = {
  R410A: { k: 1.17, cpg: 1.25, cpf: 1.75 },
  R32: { k: 1.25, cpg: 1.35, cpf: 2.15 },
  R134a: { k: 1.12, cpg: 0.96, cpf: 1.41 },
  R404A: { k: 1.14, cpg: 1.05, cpf: 1.54 },
  R448A: { k: 1.15, cpg: 1.12, cpf: 1.54 },
  R717: { k: 1.31, cpg: 2.25, cpf: 4.75 },
  R744: { k: 1.30, cpg: 1.15, cpf: 2.30 },
  R290: { k: 1.15, cpg: 1.75, cpf: 2.65 },
  R600a: { k: 1.11, cpg: 1.68, cpf: 2.45 },
  R22: { k: 1.18, cpg: 0.88, cpf: 1.36 },
  R507A: { k: 1.14, cpg: 1.06, cpf: 1.55 },
  R407C: { k: 1.16, cpg: 1.08, cpf: 1.52 },
  R1234yf: { k: 1.11, cpg: 0.98, cpf: 1.40 },
  R1234ze: { k: 1.12, cpg: 0.95, cpf: 1.39 },
  R23: { k: 1.18, cpg: 0.85, cpf: 1.45 },
  R41: { k: 1.22, cpg: 1.15, cpf: 1.82 },
  R114: { k: 1.09, cpg: 0.72, cpf: 1.01 },
  R12: { k: 1.13, cpg: 0.65, cpf: 0.98 },
  R1270: { k: 1.16, cpg: 1.78, cpf: 2.70 },
};
