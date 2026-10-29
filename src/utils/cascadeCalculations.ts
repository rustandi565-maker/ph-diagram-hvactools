import {
  CascadeCycleResult,
  CascadePreset,
  RefrigerantId,
} from '../types/cascade';
import {
  getIsentropicExponent,
  getLiquidEnthalpy,
  getSaturationPressureBar,
  getVaporEnthalpy,
  getVaporSpecificVolume,
} from './refrigerantData';

export const CASCADE_PRESETS: CascadePreset[] = [
  {
    id: 'co2_nh3_industrial',
    name: 'CO₂ / NH₃ (R-744 / R-717)',
    ltcRefrigerant: 'R744',
    htcRefrigerant: 'R717',
    teC: -45,
    tcC: 38,
    deltaTcc: 4,
    coolingCapacityKw: 50,
    description: 'Sistem kaskade industri paling populer & ramah lingkungan (W.F. Stoecker Handbook 1998). Efisiensi termal luar biasa untuk cold storage dan blast freezer.',
    industryApplication: 'Industri Pembekuan Ikan, Daging & Gudang Cold Storage Besar',
  },
  {
    id: 'r23_r404a_ultradeep',
    name: 'R-23 / R-404A (Ultra-Low Temp)',
    ltcRefrigerant: 'R23',
    htcRefrigerant: 'R404A',
    teC: -75,
    tcC: 40,
    deltaTcc: 5,
    coolingCapacityKw: 15,
    description: 'Sistem kaskade pembekuan temperatur sangat rendah (-75°C) standar internasional untuk penyimpanan vaksin medis, plasma darah, dan uji lingkungan aerodinamis.',
    industryApplication: 'Freezer Medis Vaksin -80°C, Laboratorium & Biobank',
  },
  {
    id: 'co2_r134a_supermarket',
    name: 'CO₂ / R-134a (R-744 / R-134a)',
    ltcRefrigerant: 'R744',
    htcRefrigerant: 'R134a',
    teC: -35,
    tcC: 35,
    deltaTcc: 4,
    coolingCapacityKw: 30,
    description: 'Sistem kaskade komersial supermarket modern dengan sirkuit bawah CO₂ subkritis dan sirkuit atas R-134a bertekanan moderat.',
    industryApplication: 'Supermarket Display Freezer & Toko Ritel Makanan',
  },
  {
    id: 'r290_hydrocarbon_green',
    name: 'R-290 / R-290 (Pure Hydrocarbon)',
    ltcRefrigerant: 'R290',
    htcRefrigerant: 'R290',
    teC: -40,
    tcC: 35,
    deltaTcc: 4,
    coolingCapacityKw: 25,
    description: 'Sistem kaskade hidrokarbon murni natural dengan GWP sangat rendah (<3) dan tanpa zat perusak ozon.',
    industryApplication: 'Sistem Hijau Industri Ramah Lingkungan & Net Zero',
  },
];

export interface CascadeCalculationParams {
  teC: number; // Low stage evaporator temperature (°C)
  tcC: number; // High stage condenser temperature (°C)
  deltaTcc: number; // Cascade heat exchanger approach temperature difference (°C)
  coolingCapacityKw: number; // Evaporator cooling load (kW)
  ltcRefrigerant: RefrigerantId; // Low temperature circuit refrigerant
  htcRefrigerant: RefrigerantId; // High temperature circuit refrigerant
  manualTccC?: number; // Optional user override for cascade temperature
  isentropicEfficiencyLtc?: number; // Default 0.78
  isentropicEfficiencyHtc?: number; // Default 0.80
  clearanceRatio?: number; // Clearance factor c, default 0.04 (Stoecker & Jones)
}

/**
 * Calculates complete thermodynamic cascade refrigeration cycle
 * Based on references:
 * 1. C.P. Arora: Tcc,opt = sqrt(Te * Tc) in Kelvin
 * 2. W.F. Stoecker & J.W. Jones (1982): Volumetric clearance efficiency and displacement
 * 3. W.F. Stoecker (1998): Industrial cascade CO2 / NH3
 * 4. IIR Study: Performance deviation validation
 */
export function calculateCascadeCycle(params: CascadeCalculationParams): CascadeCycleResult {
  const {
    teC,
    tcC,
    deltaTcc,
    coolingCapacityKw,
    ltcRefrigerant,
    htcRefrigerant,
    manualTccC,
    isentropicEfficiencyLtc = 0.78,
    isentropicEfficiencyHtc = 0.80,
    clearanceRatio = 0.04,
  } = params;

  // 1. Absolute Temperatures (Kelvin)
  const teK = teC + 273.15;
  const tcK = tcC + 273.15;

  // Formula C.P. Arora & Stoecker: Tcc,opt = sqrt(Te * Tc) for Carnot cascade cycle
  const tccOptCarnotK = Math.sqrt(teK * tcK);
  const tccOptCarnotC = Math.round((tccOptCarnotK - 273.15) * 10) / 10;

  // Actual intermediate temperature used (either manual override or optimum)
  const tccActualC = manualTccC !== undefined ? manualTccC : tccOptCarnotC;
  const tccActualK = tccActualC + 273.15;

  // Temperatures in Cascade Condenser / Evaporator heat exchanger:
  // LTC condenses at TccActualC
  const tCondLtcC = tccActualC;
  // HTC evaporates at TccActualC - deltaTcc
  const tEvapHtcC = tccActualC - deltaTcc;

  // 2. Pressures
  // LTC Pressures
  const pEvapLtcBar = getSaturationPressureBar(ltcRefrigerant, teC);
  const pCondLtcBar = getSaturationPressureBar(ltcRefrigerant, tCondLtcC);
  const pressureRatioLtc = Math.max(1.1, pCondLtcBar / pEvapLtcBar);

  // HTC Pressures
  const pEvapHtcBar = getSaturationPressureBar(htcRefrigerant, tEvapHtcC);
  const pCondHtcBar = getSaturationPressureBar(htcRefrigerant, tcC);
  const pressureRatioHtc = Math.max(1.1, pCondHtcBar / pEvapHtcBar);

  // 3. Low-Temperature Circuit (LTC) Enthalpy Calculation
  // State 1: Evaporator exit (saturated vapor at teC)
  const h1Ltc = getVaporEnthalpy(ltcRefrigerant, teC);
  // State 3: Condenser exit (saturated liquid at tCondLtcC)
  const h3Ltc = getLiquidEnthalpy(ltcRefrigerant, tCondLtcC);
  // State 4: Expansion valve exit (isenthalpic h4 = h3)
  const h4Ltc = h3Ltc;
  // Refrigeration effect in LTC: q_evap = h1 - h4
  const qEvapLtc = Math.max(10, h1Ltc - h4Ltc);

  // Compression work in LTC:
  // Isentropic state 2s approximation using pressure ratio and isentropic exponent k
  const kLtc = getIsentropicExponent(ltcRefrigerant);
  const isenFactorLtc = Math.pow(pressureRatioLtc, (kLtc - 1) / kLtc) - 1;
  const wIsenLtc = (kLtc / (kLtc - 1)) * (pEvapLtcBar * 100 * getVaporSpecificVolume(ltcRefrigerant, teC)) * isenFactorLtc;
  const wActualLtc = Math.max(15, wIsenLtc / isentropicEfficiencyLtc);
  const h2Ltc = h1Ltc + wActualLtc;

  // Mass flow rate in LTC
  const massFlowLtcKgS = coolingCapacityKw / qEvapLtc;
  const massFlowLtcKgH = massFlowLtcKgS * 3600;

  // Work of compression LTC (kW)
  const workCompLtcKw = massFlowLtcKgS * wActualLtc;

  // Heat rejected by LTC in Cascade Condenser (kW)
  // Q_cc = Q_e + W_comp_ltc
  const cascadeCondenserLoadKw = coolingCapacityKw + workCompLtcKw;

  // 4. High-Temperature Circuit (HTC) Enthalpy Calculation
  // State 1: Evaporator exit (saturated vapor at tEvapHtcC)
  const h1Htc = getVaporEnthalpy(htcRefrigerant, tEvapHtcC);
  // State 3: Condenser exit (saturated liquid at tcC)
  const h3Htc = getLiquidEnthalpy(htcRefrigerant, tcC);
  // State 4: Expansion valve exit (h4 = h3)
  const h4Htc = h3Htc;
  // Refrigeration effect in HTC: q_evap = h1 - h4
  const qEvapHtc = Math.max(10, h1Htc - h4Htc);

  // Compression work in HTC:
  const kHtc = getIsentropicExponent(htcRefrigerant);
  const isenFactorHtc = Math.pow(pressureRatioHtc, (kHtc - 1) / kHtc) - 1;
  const wIsenHtc = (kHtc / (kHtc - 1)) * (pEvapHtcBar * 100 * getVaporSpecificVolume(htcRefrigerant, tEvapHtcC)) * isenFactorHtc;
  const wActualHtc = Math.max(15, wIsenHtc / isentropicEfficiencyHtc);
  const h2Htc = h1Htc + wActualHtc;

  // Mass flow rate in HTC to absorb Q_cc
  const massFlowHtcKgS = cascadeCondenserLoadKw / qEvapHtc;
  const massFlowHtcKgH = massFlowHtcKgS * 3600;

  // Work of compression HTC (kW)
  const workCompHtcKw = massFlowHtcKgS * wActualHtc;

  // Total Compressor Work (kW)
  const totalWorkCompKw = workCompLtcKw + workCompHtcKw;

  // Total Heat Rejected to Ambient in Condenser (kW)
  const ambientCondenserHeatRejectedKw = cascadeCondenserLoadKw + workCompHtcKw;

  // 5. Performance Indicators
  const copLtc = coolingCapacityKw / Math.max(0.01, workCompLtcKw);
  const copHtc = cascadeCondenserLoadKw / Math.max(0.01, workCompHtcKw);
  const copCascade = coolingCapacityKw / Math.max(0.01, totalWorkCompKw);

  // Carnot COP for overall temperature lift
  const copCarnot = teK / Math.max(1, tcK - teK);
  const secondLawEfficiencyPercent = (copCascade / copCarnot) * 100;

  // 6. Compressor Volumetric Performance (Stoecker & Jones Chapter: Volumetric clearance efficiency)
  // eta_v = 1 + c - c * (P_dis / P_suc)^(1/k)
  const etaVLtc = Math.max(0.4, Math.min(0.95, 1 + clearanceRatio - clearanceRatio * Math.pow(pressureRatioLtc, 1 / kLtc)));
  const vSucLtc = getVaporSpecificVolume(ltcRefrigerant, teC);
  const dispLtcM3S = (massFlowLtcKgS * vSucLtc) / etaVLtc;
  const displacementLtcM3H = dispLtcM3S * 3600;
  const displacementLtcCfm = displacementLtcM3H * 0.588578;

  const etaVHtc = Math.max(0.4, Math.min(0.95, 1 + clearanceRatio - clearanceRatio * Math.pow(pressureRatioHtc, 1 / kHtc)));
  const vSucHtc = getVaporSpecificVolume(htcRefrigerant, tEvapHtcC);
  const dispHtcM3S = (massFlowHtcKgS * vSucHtc) / etaVHtc;
  const displacementHtcM3H = dispHtcM3S * 3600;
  const displacementHtcCfm = displacementHtcM3H * 0.588578;

  return {
    teK: Math.round(teK * 10) / 10,
    teC: Math.round(teC * 10) / 10,
    tcK: Math.round(tcK * 10) / 10,
    tcC: Math.round(tcC * 10) / 10,
    deltaTcc,
    tccOptCarnotK: Math.round(tccOptCarnotK * 10) / 10,
    tccOptCarnotC,
    tccActualK: Math.round(tccActualK * 10) / 10,
    tccActualC: Math.round(tccActualC * 10) / 10,
    tCondLtcC: Math.round(tCondLtcC * 10) / 10,
    tEvapHtcC: Math.round(tEvapHtcC * 10) / 10,

    pEvapLtcBar: Math.round(pEvapLtcBar * 100) / 100,
    pCondLtcBar: Math.round(pCondLtcBar * 100) / 100,
    pressureRatioLtc: Math.round(pressureRatioLtc * 100) / 100,

    pEvapHtcBar: Math.round(pEvapHtcBar * 100) / 100,
    pCondHtcBar: Math.round(pCondHtcBar * 100) / 100,
    pressureRatioHtc: Math.round(pressureRatioHtc * 100) / 100,

    ltcEnthalpies: {
      h1: Math.round(h1Ltc * 10) / 10,
      h2: Math.round(h2Ltc * 10) / 10,
      h3: Math.round(h3Ltc * 10) / 10,
      h4: Math.round(h4Ltc * 10) / 10,
      qEvap: Math.round(qEvapLtc * 10) / 10,
      wComp: Math.round(wActualLtc * 10) / 10,
    },
    htcEnthalpies: {
      h1: Math.round(h1Htc * 10) / 10,
      h2: Math.round(h2Htc * 10) / 10,
      h3: Math.round(h3Htc * 10) / 10,
      h4: Math.round(h4Htc * 10) / 10,
      qEvap: Math.round(qEvapHtc * 10) / 10,
      wComp: Math.round(wActualHtc * 10) / 10,
    },

    coolingCapacityKw,
    massFlowLtcKgS: Math.round(massFlowLtcKgS * 1000) / 1000,
    massFlowLtcKgH: Math.round(massFlowLtcKgH * 10) / 10,
    massFlowHtcKgS: Math.round(massFlowHtcKgS * 1000) / 1000,
    massFlowHtcKgH: Math.round(massFlowHtcKgH * 10) / 10,

    workCompLtcKw: Math.round(workCompLtcKw * 100) / 100,
    workCompHtcKw: Math.round(workCompHtcKw * 100) / 100,
    totalWorkCompKw: Math.round(totalWorkCompKw * 100) / 100,
    cascadeCondenserLoadKw: Math.round(cascadeCondenserLoadKw * 100) / 100,
    ambientCondenserHeatRejectedKw: Math.round(ambientCondenserHeatRejectedKw * 100) / 100,

    copLtc: Math.round(copLtc * 100) / 100,
    copHtc: Math.round(copHtc * 100) / 100,
    copCascade: Math.round(copCascade * 1000) / 1000,
    copCarnot: Math.round(copCarnot * 1000) / 1000,
    secondLawEfficiencyPercent: Math.round(secondLawEfficiencyPercent * 10) / 10,

    volumetricEfficiencyLtc: Math.round(etaVLtc * 1000) / 1000,
    displacementLtcM3H: Math.round(displacementLtcM3H * 10) / 10,
    displacementLtcCfm: Math.round(displacementLtcCfm * 10) / 10,

    volumetricEfficiencyHtc: Math.round(etaVHtc * 1000) / 1000,
    displacementHtcM3H: Math.round(displacementHtcM3H * 10) / 10,
    displacementHtcCfm: Math.round(displacementHtcCfm * 10) / 10,
  };
}

/**
 * Generate COP curve variation across a range of intermediate temperatures
 * to visually verify the IIR finding that geometric mean COP differs < 2% from optimum!
 */
export function generateCopOptimizationCurve(params: CascadeCalculationParams): Array<{
  tccC: number;
  cop: number;
  isCarnotOpt: boolean;
}> {
  const { teC, tcC } = params;
  const teK = teC + 273.15;
  const tcK = tcC + 273.15;
  const optCarnotC = Math.round((Math.sqrt(teK * tcK) - 273.15) * 10) / 10;

  const minTcc = teC + 8;
  const maxTcc = tcC - 10;
  const points: Array<{ tccC: number; cop: number; isCarnotOpt: boolean }> = [];

  const step = Math.max(1, Math.round((maxTcc - minTcc) / 16));

  for (let t = Math.ceil(minTcc); t <= Math.floor(maxTcc); t += step) {
    const res = calculateCascadeCycle({
      ...params,
      manualTccC: t,
    });
    points.push({
      tccC: t,
      cop: res.copCascade,
      isCarnotOpt: Math.abs(t - optCarnotC) <= step / 2,
    });
  }

  return points;
}
