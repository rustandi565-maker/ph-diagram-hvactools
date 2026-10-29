import {
  HeatExchangerInputs,
  HeatExchangerResults,
  TemperatureCurvePoint,
  FluidPreset,
  FlowConfiguration,
} from '../types/heatExchanger';

export const FLUID_PRESETS: FluidPreset[] = [
  { id: 'water', name: 'Air Bersih (Water)', cp: 4184, density: 998, phase: 'liquid', defaultTempC: 25 },
  { id: 'chilled_water', name: 'Air Dingin Chiller (Chilled Water 7°C)', cp: 4190, density: 1000, phase: 'liquid', defaultTempC: 7 },
  { id: 'hot_water', name: 'Air Panas Boiler (Hot Water 85°C)', cp: 4200, density: 968, phase: 'liquid', defaultTempC: 85 },
  { id: 'engine_oil', name: 'Oli Mesin / Pelumas (Engine Oil SAE 30)', cp: 1900, density: 880, phase: 'liquid', defaultTempC: 90 },
  { id: 'glycol_50', name: 'Ethylene Glycol 50% Aqueous', cp: 3350, density: 1070, phase: 'liquid', defaultTempC: 15 },
  { id: 'air', name: 'Udara Atmosfer (Ambient Air 1 atm)', cp: 1005, density: 1.20, phase: 'gas', defaultTempC: 30 },
  { id: 'steam_condensing', name: 'Uap Air Kondensasi (Steam 100°C)', cp: 2080, density: 0.6, phase: 'phase_change', defaultTempC: 100 },
  { id: 'r134a', name: 'Refrigerant R-134a (Liquid)', cp: 1425, density: 1206, phase: 'liquid', defaultTempC: 35 },
  { id: 'r410a', name: 'Refrigerant R-410A (Liquid)', cp: 1750, density: 1060, phase: 'liquid', defaultTempC: 40 },
];

export interface ExchangerUPreset {
  id: string;
  name: string;
  application: string;
  typicalU: number; // W/(m²·K)
  range: string;
}

export const TYPICAL_U_PRESETS: ExchangerUPreset[] = [
  { id: 'water_water', name: 'Air ke Air (Water - Water)', application: 'Plate / Shell & Tube', typicalU: 2000, range: '1000 - 3000 W/m²K' },
  { id: 'water_oil', name: 'Air ke Oli (Water - Lubricating Oil)', application: 'Oil Cooler Shell & Tube', typicalU: 250, range: '150 - 450 W/m²K' },
  { id: 'steam_water', name: 'Uap ke Air (Steam Condenser - Water)', application: 'Power Plant & Califier', typicalU: 2800, range: '1500 - 4000 W/m²K' },
  { id: 'water_air_finned', name: 'Air ke Udara (Finned-Tube Coils)', application: 'AHU / Radiator', typicalU: 55, range: '30 - 100 W/m²K' },
  { id: 'gas_gas', name: 'Gas ke Gas / Udara ke Udara', application: 'Heat Recovery Wheel / Economizer', typicalU: 25, range: '15 - 50 W/m²K' },
  { id: 'refrig_water', name: 'Kondensor Refrigerasi ke Air', application: 'Water-Cooled Chiller', typicalU: 1200, range: '800 - 1800 W/m²K' },
  { id: 'ammonia_water', name: 'Amonia ke Air (Shell & Tube)', application: 'Industrial Cold Storage', typicalU: 1400, range: '900 - 2000 W/m²K' },
];

/**
 * Converts heat capacity to Watts from selected input unit
 */
export function convertCapacityToWatts(capacity: number, unit: HeatExchangerInputs['capacityUnit']): number {
  switch (unit) {
    case 'kW':
      return capacity * 1000;
    case 'W':
      return capacity;
    case 'BTU/h':
      return capacity * 0.293071; // 1 BTU/h = 0.293071 W
    case 'kcal/h':
      return capacity * 1.163; // 1 kcal/h = 1.163 W
    case 'TR':
      return capacity * 3516.85; // 1 TR = 3.51685 kW
    default:
      return capacity * 1000;
  }
}

/**
 * Safe Logarithmic Mean Temperature Difference (LMTD) calculation
 */
export function calculateLMTD(deltaT1: number, deltaT2: number): number {
  if (deltaT1 <= 0 || deltaT2 <= 0) return 0;
  const diff = deltaT1 - deltaT2;
  if (Math.abs(diff) < 1e-4) {
    return (deltaT1 + deltaT2) / 2;
  }
  const ratio = deltaT1 / deltaT2;
  if (ratio <= 0) return 0;
  return diff / Math.log(ratio);
}

/**
 * Calculates the Bowman-Mueller-Nagle LMTD Correction Factor F
 * for 1-Shell Pass, 2-Tube Pass (Multi-Pass Shell & Tube)
 */
export function calculateCorrectionFactorMultipass(P: number, R: number): number {
  if (P <= 0 || P >= 1) return 1.0;
  if (P * R >= 1) return 0.5; // Steep temperature cross or unachievable

  const sqrtR2Plus1 = Math.sqrt(R * R + 1);

  if (Math.abs(R - 1.0) < 1e-4) {
    // Limiting case R = 1
    const sqrt2 = Math.SQRT2;
    const numerator = sqrt2 * (P / (1 - P));
    const denomArg = (2 - P * (2 - sqrt2)) / (2 - P * (2 + sqrt2));
    if (denomArg <= 0) return 0.5;
    const F = numerator / Math.log(denomArg);
    return Math.max(0.1, Math.min(1.0, isNaN(F) ? 1.0 : F));
  }

  const numTerm1 = sqrtR2Plus1 * Math.log((1 - P) / (1 - P * R));
  const denomTerm2Arg = (2 - P * (R + 1 - sqrtR2Plus1)) / (2 - P * (R + 1 + sqrtR2Plus1));

  if (denomTerm2Arg <= 0) return 0.5;

  const denom = (R - 1) * Math.log(denomTerm2Arg);
  if (Math.abs(denom) < 1e-6) return 1.0;

  const F = numTerm1 / denom;
  return Math.max(0.1, Math.min(1.0, isNaN(F) ? 1.0 : F));
}

/**
 * Calculates the LMTD Correction Factor F for Cross-Flow Heat Exchanger
 * with both fluids unmixed (Standard Kays & London / Incropera correlation)
 */
export function calculateCorrectionFactorCrossFlow(P: number, R: number): number {
  if (P <= 0 || P >= 1) return 1.0;
  if (P * R >= 1) return 0.6;

  // Unmixed-unmixed cross-flow correction factor approximation
  // Based on Bowman & Mueller correlation
  if (Math.abs(R - 1.0) < 1e-3) {
    const F = 1.0 - 0.22 * Math.pow(P, 1.8);
    return Math.max(0.2, Math.min(1.0, F));
  }

  // General empirical formulation for both fluids unmixed:
  // F ≈ 1 - (1 - F_shell_tube) * 0.65 (cross flow is inherently more efficient than 1-2 shell-tube)
  const fShell = calculateCorrectionFactorMultipass(P, R);
  const fCross = 1.0 - (1.0 - fShell) * 0.65;
  return Math.max(0.25, Math.min(1.0, fCross));
}

/**
 * Main Heat Exchanger performance calculation engine
 */
export function calculateHeatExchangerPerformance(inputs: HeatExchangerInputs): HeatExchangerResults {
  const warnings: string[] = [];

  // 1. Identify which fluid is Hot and Cold
  const dt1 = inputs.t1In - inputs.t1Out;
  const dt2 = inputs.t2In - inputs.t2Out;

  let isFluid1Hot = true;
  let tHotIn = inputs.t1In;
  let tHotOut = inputs.t1Out;
  let tColdIn = inputs.t2In;
  let tColdOut = inputs.t2Out;

  if (dt1 > 0 && dt2 < 0) {
    // Fluid 1 is cooling down (hot fluid), Fluid 2 is warming up (cold fluid)
    isFluid1Hot = true;
    tHotIn = inputs.t1In;
    tHotOut = inputs.t1Out;
    tColdIn = inputs.t2In;
    tColdOut = inputs.t2Out;
  } else if (dt1 < 0 && dt2 > 0) {
    // Fluid 1 is warming up (cold fluid), Fluid 2 is cooling down (hot fluid)
    isFluid1Hot = false;
    tHotIn = inputs.t2In;
    tHotOut = inputs.t2Out;
    tColdIn = inputs.t1In;
    tColdOut = inputs.t1Out;
  } else {
    // Fallback based on inlet temperature
    if (inputs.t1In >= inputs.t2In) {
      isFluid1Hot = true;
      tHotIn = inputs.t1In;
      tHotOut = inputs.t1Out;
      tColdIn = inputs.t2In;
      tColdOut = inputs.t2Out;
    } else {
      isFluid1Hot = false;
      tHotIn = inputs.t2In;
      tHotOut = inputs.t2Out;
      tColdIn = inputs.t1In;
      tColdOut = inputs.t1Out;
    }
    warnings.push('Arah perubahan temperatur tidak saling berlawanan; fluida diklasifikasikan berdasarkan temperatur masuk tertinggi.');
  }

  // 2. Capacity in Watts
  const capacityWatts = convertCapacityToWatts(inputs.capacity, inputs.capacityUnit);
  const capacityKw = capacityWatts / 1000;
  const capacityBtuHr = capacityWatts / 0.293071;
  const capacityTR = capacityWatts / 3516.85;

  // 3. Thermodynamic Feasibility Checks (2nd Law)
  let isThermodynamicallyFeasible = true;
  if (tHotIn <= tColdIn) {
    isThermodynamicallyFeasible = false;
    warnings.push('Pelanggaran Hukum II Termodinamika: Temperatur masuk fluida panas (Th,in) harus lebih tinggi dari temperatur masuk fluida dingin (Tc,in)!');
  }

  const deltaTHot = Math.abs(tHotIn - tHotOut);
  const deltaTCold = Math.abs(tColdOut - tColdIn);

  if (deltaTHot < 1e-4 || deltaTCold < 1e-4) {
    warnings.push('Perbedaan temperatur masuk dan keluar fluida mendekati nol (ΔT ≈ 0).');
  }

  // 4. Heat Capacity Rates
  const chWattsPerK = deltaTHot > 1e-4 ? capacityWatts / deltaTHot : 1;
  const ccWattsPerK = deltaTCold > 1e-4 ? capacityWatts / deltaTCold : 1;
  const cMin = Math.min(chWattsPerK, ccWattsPerK);
  const cMax = Math.max(chWattsPerK, ccWattsPerK);
  const capacityRatioR = cMax > 0 ? cMin / cMax : 1;

  // Fluid densities & Cp
  const fluidHotPreset = FLUID_PRESETS.find(p => p.id === (isFluid1Hot ? inputs.fluid1PresetId : inputs.fluid2PresetId)) || FLUID_PRESETS[0];
  const fluidColdPreset = FLUID_PRESETS.find(p => p.id === (!isFluid1Hot ? inputs.fluid1PresetId : inputs.fluid2PresetId)) || FLUID_PRESETS[0];

  const massFlowHotKgS = chWattsPerK / fluidHotPreset.cp;
  const massFlowColdKgS = ccWattsPerK / fluidColdPreset.cp;

  // 5. Dimensionless ratios for F factor
  // P = (Tc,out - Tc,in) / (Th,in - Tc,in)
  // R = (Th,in - Th,out) / (Tc,out - Tc,in)
  const drivingTotal = tHotIn - tColdIn;
  const effectivenessP = drivingTotal > 1e-4 ? Math.max(0.0001, Math.min(0.9999, (tColdOut - tColdIn) / drivingTotal)) : 0.5;
  const flowRatioR = deltaTCold > 1e-4 ? deltaTHot / deltaTCold : 1.0;

  // 6. LMTD for Parallel and Counter Flow
  // Parallel: ΔT1 = Th,in - Tc,in, ΔT2 = Th,out - Tc,out
  const dt1Parallel = tHotIn - tColdIn;
  const dt2Parallel = tHotOut - tColdOut;
  const lmtdParallel = calculateLMTD(dt1Parallel, dt2Parallel);

  // Counter: ΔT1 = Th,in - Tc,out, ΔT2 = Th,out - Tc,in
  const dt1Counter = tHotIn - tColdOut;
  const dt2Counter = tHotOut - tColdIn;
  const lmtdCounter = calculateLMTD(dt1Counter, dt2Counter);

  // Check temperature cross (Tc,out > Th,out)
  const hasTemperatureCross = tColdOut > tHotOut;
  if (inputs.flowConfig === 'parallel' && hasTemperatureCross) {
    warnings.push('Pada aliran sejajar (Parallel Flow), Tc,out tidak boleh melampaui Th,out (Temperature Cross tidak mungkin tercapai pada parallel flow).');
  }

  // 7. Flow configuration specific LMTD, F, and Effective Delta T
  let lmtdNominal = lmtdCounter;
  let correctionFactorF = 1.0;
  let deltaT1 = dt1Counter;
  let deltaT2 = dt2Counter;
  let pinchPointDeltaT = Math.min(dt1Counter, dt2Counter);
  let pinchPointLocation = dt1Counter <= dt2Counter ? 'Sisi Keluar Dingin / Masuk Panas (x = 0%)' : 'Sisi Keluar Panas / Masuk Dingin (x = 100%)';

  switch (inputs.flowConfig) {
    case 'parallel':
      lmtdNominal = lmtdParallel;
      correctionFactorF = 1.0;
      deltaT1 = dt1Parallel;
      deltaT2 = dt2Parallel;
      pinchPointDeltaT = Math.min(dt1Parallel, dt2Parallel);
      pinchPointLocation = dt1Parallel <= dt2Parallel ? 'Sisi Masuk (x = 0%)' : 'Sisi Keluar (x = 100%)';
      break;

    case 'counter':
      lmtdNominal = lmtdCounter;
      correctionFactorF = 1.0;
      deltaT1 = dt1Counter;
      deltaT2 = dt2Counter;
      pinchPointDeltaT = Math.min(dt1Counter, dt2Counter);
      pinchPointLocation = dt1Counter <= dt2Counter ? 'Sisi Masuk Panas (x = 0%)' : 'Sisi Keluar Panas (x = 100%)';
      break;

    case 'cross':
      lmtdNominal = lmtdCounter;
      correctionFactorF = calculateCorrectionFactorCrossFlow(effectivenessP, flowRatioR);
      deltaT1 = dt1Counter;
      deltaT2 = dt2Counter;
      pinchPointDeltaT = Math.min(dt1Counter, dt2Counter);
      pinchPointLocation = 'Distribusi Matriks Silang / Cross-Pass';
      if (correctionFactorF < 0.75) {
        warnings.push(`Faktor koreksi F = ${correctionFactorF.toFixed(3)} (< 0.75). Penukar kalor aliran silang kurang efisien pada rasio temperatur ini.`);
      }
      break;

    case 'multipass':
      lmtdNominal = lmtdCounter;
      correctionFactorF = calculateCorrectionFactorMultipass(effectivenessP, flowRatioR);
      deltaT1 = dt1Counter;
      deltaT2 = dt2Counter;
      pinchPointDeltaT = Math.min(dt1Counter, dt2Counter);
      pinchPointLocation = 'Zona Pembalikan U-Tube / Baffle Tengah';
      if (correctionFactorF < 0.75) {
        warnings.push(`Faktor koreksi F = ${correctionFactorF.toFixed(3)} (< 0.75). Multi-Pass 1-2 mengalami inefisiensi akibat temperatur cross lokal.`);
      }
      break;
  }

  const effectiveDeltaT = Math.max(0.01, lmtdNominal * correctionFactorF);

  // 8. Solve Overall U or Heat Transfer Area A
  let overallU = inputs.overallU;
  let areaM2 = inputs.area;

  if (inputs.calcMode === 'solve_area') {
    // A = Q / (U * ΔT_eff)
    if (overallU > 0 && effectiveDeltaT > 0) {
      areaM2 = capacityWatts / (overallU * effectiveDeltaT);
    } else {
      areaM2 = 1.0;
    }
  } else {
    // U = Q / (A * ΔT_eff)
    if (areaM2 > 0 && effectiveDeltaT > 0) {
      overallU = capacityWatts / (areaM2 * effectiveDeltaT);
    } else {
      overallU = 1000;
    }
  }

  const areaFt2 = areaM2 * 10.7639;

  // 9. Heat Exchanger Effectiveness (ε) & NTU
  const qMaxWatts = cMin * Math.max(0.1, tHotIn - tColdIn);
  const effectiveness = qMaxWatts > 0 ? Math.min(1.0, Math.max(0.01, capacityWatts / qMaxWatts)) : 0;
  const ntu = cMin > 0 ? (overallU * areaM2) / cMin : 0;

  // 10. Generate Temperature Distribution Curves (T vs Distance x/L from 0 to 1)
  const curvePoints = generateTemperatureCurves(
    inputs.flowConfig,
    tHotIn,
    tHotOut,
    tColdIn,
    tColdOut,
    inputs.exchangerLengthMeters || 2.0,
    overallU,
    areaM2,
    chWattsPerK,
    ccWattsPerK
  );

  return {
    isFluid1Hot,
    tHotIn,
    tHotOut,
    tColdIn,
    tColdOut,

    capacityWatts,
    capacityKw,
    capacityBtuHr,
    capacityTR,

    chWattsPerK,
    ccWattsPerK,
    cMin,
    cMax,
    capacityRatioR,
    flowRatioR,
    effectivenessP,

    massFlowHotKgS,
    massFlowColdKgS,

    lmtdCounter,
    lmtdParallel,
    lmtdNominal,
    correctionFactorF,
    effectiveDeltaT,

    overallU,
    areaM2,
    areaFt2,

    qMaxWatts,
    effectiveness,
    ntu,

    deltaT1,
    deltaT2,
    pinchPointDeltaT,
    pinchPointLocation,
    hasTemperatureCross,
    isThermodynamicallyFeasible,
    warnings,

    curvePoints,
  };
}

/**
 * Generate accurate thermodynamic temperature profiles across x/L = 0 to 1
 */
function generateTemperatureCurves(
  flowConfig: FlowConfiguration,
  tHotIn: number,
  tHotOut: number,
  tColdIn: number,
  tColdOut: number,
  totalLengthMeters: number,
  U: number,
  A: number,
  Ch: number,
  Cc: number
): TemperatureCurvePoint[] {
  const numPoints = 81;
  const points: TemperatureCurvePoint[] = [];

  const betaPar = (U * A * (1 / Ch + 1 / Cc)) || 1.8;
  const denomPar = Math.abs(1 - Math.exp(-betaPar)) > 1e-4 ? (1 - Math.exp(-betaPar)) : 1;

  for (let i = 0; i < numPoints; i++) {
    const xRatio = i / (numPoints - 1);
    const distanceMeters = xRatio * totalLengthMeters;
    let tHot = tHotIn;
    let tCold = tColdIn;
    let tColdPass2: number | undefined = undefined;

    switch (flowConfig) {
      case 'parallel': {
        // Parallel Flow:
        // Hot and cold enter at x = 0, flow in the same direction to x = 1
        const decay = (1 - Math.exp(-betaPar * xRatio)) / denomPar;
        tHot = tHotIn - (tHotIn - tHotOut) * decay;
        tCold = tColdIn + (tColdOut - tColdIn) * decay;
        break;
      }

      case 'counter': {
        // Counter Flow:
        // Hot enters at x = 0, exits at x = 1. Cold enters at x = 1, exits at x = 0.
        // If Ch ≈ Cc, distribution is nearly linear.
        // Otherwise it has mild exponential curvature:
        const diffC = Ch - Cc;
        if (Math.abs(diffC) < 0.05 * Math.min(Ch, Cc)) {
          // Linear approximation
          tHot = tHotIn - (tHotIn - tHotOut) * xRatio;
          tCold = tColdOut - (tColdOut - tColdIn) * xRatio;
        } else {
          const betaCounter = (U * A * (1 / Ch - 1 / Cc)) || 0.8;
          const denomCounter = Math.abs(1 - Math.exp(-betaCounter)) > 1e-4 ? (1 - Math.exp(-betaCounter)) : 1;
          const decay = (1 - Math.exp(-betaCounter * xRatio)) / denomCounter;
          tHot = tHotIn - (tHotIn - tHotOut) * decay;
          tCold = tColdOut - (tColdOut - tColdIn) * decay;
        }
        break;
      }

      case 'cross': {
        // Cross Flow:
        // Hot flows horizontally 0 to 1, cold flows across vertically.
        // Hot bulk temperature exhibits exponential decay:
        const decayHot = 1 - Math.exp(-2.2 * xRatio);
        const normHot = 1 - Math.exp(-2.2);
        tHot = tHotIn - (tHotIn - tHotOut) * (decayHot / normHot);
        // Cold stream emerges warmer downstream as hot fluid is still hot:
        const coldShape = 1 - Math.exp(-1.8 * (1 - xRatio));
        const normCold = 1 - Math.exp(-1.8);
        tCold = tColdIn + (tColdOut - tColdIn) * (1 - (coldShape / normCold) * 0.45);
        break;
      }

      case 'multipass': {
        // Multi-Pass Shell & Tube (1 Shell Pass, 2 Tube Passes)
        // Shell fluid (Hot) flows along shell 0 to 1
        // Tube fluid (Cold) flows Pass 1 (0 -> 1) and Pass 2 (1 -> 0)
        tHot = tHotIn - (tHotIn - tHotOut) * Math.pow(xRatio, 0.85);

        const tColdMid = (tColdIn + tColdOut) / 2 + (tColdOut - tColdIn) * 0.08;
        // Pass 1: warms from tColdIn at x=0 to tColdMid at x=1
        tCold = tColdIn + (tColdMid - tColdIn) * (1 - Math.exp(-1.5 * xRatio)) / (1 - Math.exp(-1.5));
        // Pass 2: returns from tColdMid at x=1 to tColdOut at x=0
        tColdPass2 = tColdMid + (tColdOut - tColdMid) * (1 - xRatio);
        break;
      }
    }

    const deltaT = Math.abs(tHot - tCold);

    points.push({
      xRatio,
      distanceMeters,
      tHot,
      tCold,
      tColdPass2,
      deltaT,
    });
  }

  return points;
}
