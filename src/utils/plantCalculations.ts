import {
  ChillerTestInputs,
  ChillerTestResults,
  CoolingTowerTestInputs,
  CoolingTowerTestResults,
  AhuTestInputs,
  AhuTestResults,
  IntegratedPlantResults,
} from '../types/plantTesting';

// Water thermodynamic properties at standard air-conditioning temps (~10-35°C)
const WATER_SPECIFIC_HEAT = 4.186; // kJ/(kg·°C)
const WATER_DENSITY_KG_L = 1.0;    // 1 kg / L (approx)
const KW_TO_TR = 0.284345;         // 1 kW = 0.284345 TR
const TR_TO_KW = 3.5168528;        // 1 TR = 3.51685 kW = 12,000 BTU/h
const AIR_GAS_CONSTANT = 287.058;  // J/(kg·K)
const ATMOSPHERIC_PRESSURE_PA = 101325; // 1 atm = 101.325 kPa

/**
 * Saturation vapor pressure of water using Magnus-Tetens formula (kPa)
 */
export function getWaterSatVaporPressureKpa(tempC: number): number {
  return 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

/**
 * Humidity ratio W (kg moisture / kg dry air) from Dry Bulb and Relative Humidity
 */
export function getHumidityRatio(dbtC: number, rhPercent: number): number {
  const pSatKpa = getWaterSatVaporPressureKpa(dbtC);
  const pVaporKpa = (rhPercent / 100) * pSatKpa;
  const pAtmKpa = ATMOSPHERIC_PRESSURE_PA / 1000;
  if (pAtmKpa - pVaporKpa <= 0) return 0.001;
  return 0.62198 * (pVaporKpa / (pAtmKpa - pVaporKpa));
}

/**
 * Moist air specific enthalpy h (kJ/kg dry air)
 * h = 1.006 * T + W * (2501 + 1.86 * T)
 */
export function getMoistAirEnthalpy(dbtC: number, rhPercent: number): number {
  const W = getHumidityRatio(dbtC, rhPercent);
  return 1.006 * dbtC + W * (2501 + 1.86 * dbtC);
}

/**
 * Moist air density (kg/m3)
 */
export function getMoistAirDensity(dbtC: number, rhPercent: number): number {
  const pSatKpa = getWaterSatVaporPressureKpa(dbtC);
  const pVaporPa = (rhPercent / 100) * pSatKpa * 1000;
  const pDryAirPa = ATMOSPHERIC_PRESSURE_PA - pVaporPa;
  const tK = dbtC + 273.15;
  const rhoDry = pDryAirPa / (AIR_GAS_CONSTANT * tK);
  const rhoVapor = pVaporPa / (461.5 * tK);
  return rhoDry + rhoVapor;
}

// ==========================================
// 1. CHILLER PERFORMANCE TEST CALCULATION
// ==========================================
export function calculateChillerPerformance(inputs: ChillerTestInputs): ChillerTestResults {
  // Evaporator temperature difference
  const chwDeltaTC = Math.max(0.1, inputs.chwInletTempC - inputs.chwOutletTempC);

  // Evaporator mass flow in kg/s
  // 1 LPM = 1 / 60 L/s = 1 / 60 kg/s
  const chwFlowKgS = inputs.chwFlowLpm / 60;

  // Evaporator cooling capacity Q_evap = m_dot * Cp * delta_T (kW)
  const evapCapacityKW = chwFlowKgS * WATER_SPECIFIC_HEAT * chwDeltaTC;
  const evapCapacityTR = evapCapacityKW * KW_TO_TR;
  const evapCapacityBtuH = evapCapacityTR * 12000;
  const percentRatedCapacity = (evapCapacityTR / (inputs.ratedCapacityTR || 1)) * 100;

  // Compressor Electrical Power Input
  let totalPowerInputKW = inputs.measuredPowerKW;
  if (inputs.electricalInputMode === 'three_phase_vi') {
    // P = sqrt(3) * V * I * cos(phi) / 1000
    totalPowerInputKW = (Math.sqrt(3) * inputs.voltageV * inputs.currentA * inputs.powerFactor) / 1000;
  }
  totalPowerInputKW = Math.max(0.1, totalPowerInputKW);

  // Specific power kW/TR and COP / EER
  const specificPowerKWPerTR = evapCapacityTR > 0 ? totalPowerInputKW / evapCapacityTR : 0;
  const copActual = totalPowerInputKW > 0 ? evapCapacityKW / totalPowerInputKW : 0;
  const eerBtuPerWh = copActual * 3.412142; // 1 COP = 3.412142 Btu/Wh

  // Condenser Heat Rejection
  let condenserHeatRejectionKW = 0;
  if (inputs.isWaterCooled && inputs.cwFlowLpm > 0) {
    const cwDeltaTC = Math.max(0.1, inputs.cwOutletTempC - inputs.cwInletTempC);
    const cwFlowKgS = inputs.cwFlowLpm / 60;
    condenserHeatRejectionKW = cwFlowKgS * WATER_SPECIFIC_HEAT * cwDeltaTC;
  } else {
    // Air-cooled: estimated from thermodynamic heat balance Q_cond = Q_evap + P_comp
    condenserHeatRejectionKW = evapCapacityKW + totalPowerInputKW;
  }
  const condenserHeatRejectionTR = condenserHeatRejectionKW * KW_TO_TR;

  // Heat Balance Verification per ASHRAE Guideline 22
  // Theoretical Q_cond = Q_evap + P_comp
  const theoreticalHeatRejectionKW = evapCapacityKW + totalPowerInputKW;
  const heatBalanceDiffKW = Math.abs(condenserHeatRejectionKW - theoreticalHeatRejectionKW);
  const heatBalanceErrorPercent = (heatBalanceDiffKW / theoreticalHeatRejectionKW) * 100;

  let heatBalanceStatus: 'valid' | 'warning' | 'invalid' = 'valid';
  if (heatBalanceErrorPercent <= 5.0) {
    heatBalanceStatus = 'valid'; // ASHRAE compliant (<5%)
  } else if (heatBalanceErrorPercent <= 10.0) {
    heatBalanceStatus = 'warning'; // 5% - 10% acceptable field tolerance
  } else {
    heatBalanceStatus = 'invalid'; // >10% likely sensor calibration / flow error
  }

  // Diagnostic Approach Temperatures
  // Evaporator Approach = CHW Leaving Temp - Evaporating Saturation Temp
  const evaporatorApproachC = inputs.chwOutletTempC - inputs.evapSaturationTempC;

  // Condenser Approach = Condensing Saturation Temp - CW Leaving Temp
  const condenserApproachC = inputs.condSaturationTempC - (inputs.isWaterCooled ? inputs.cwOutletTempC : inputs.ambientDryBulbC);

  // Diagnostic evaluation
  const diagnostics: string[] = [];

  let evaporatorFoulingStatus: 'clean' | 'mild_fouling' | 'severe_fouling' = 'clean';
  if (evaporatorApproachC <= 1.5) {
    evaporatorFoulingStatus = 'clean';
  } else if (evaporatorApproachC <= 3.0) {
    evaporatorFoulingStatus = 'mild_fouling';
    diagnostics.push(`Evaporator approach (${evaporatorApproachC.toFixed(1)}°C) di atas standar normal (0.5-1.5°C). Ada indikasi fouling ringan pada tabung evaporator atau maldistribusi refrigerant.`);
  } else {
    evaporatorFoulingStatus = 'severe_fouling';
    diagnostics.push(`Peringatan: Evaporator approach tinggi (${evaporatorApproachC.toFixed(1)}°C). Tabung perlu pembersihan mekanis (brushing/cleaning) segera.`);
  }

  let condenserFoulingStatus: 'clean' | 'mild_fouling' | 'severe_fouling' = 'clean';
  if (condenserApproachC <= 2.0) {
    condenserFoulingStatus = 'clean';
  } else if (condenserApproachC <= 3.5) {
    condenserFoulingStatus = 'mild_fouling';
    diagnostics.push(`Condenser approach (${condenserApproachC.toFixed(1)}°C) mulai meningkat (standar: 0.5-2.0°C). Terdapat kerak atau endapan bio-fouling pada condenser tubes.`);
  } else {
    condenserFoulingStatus = 'severe_fouling';
    diagnostics.push(`Kritis: Condenser approach (${condenserApproachC.toFixed(1)}°C) sangat tinggi. Wajib descaling/rodding kondensor untuk mencegah lonjakan pressure discharge dan pemborosan listrik.`);
  }

  if (heatBalanceStatus === 'invalid') {
    diagnostics.push(`Error Keseimbangan Termal (${heatBalanceErrorPercent.toFixed(1)}% > 10% standar ASHRAE G-22). Periksa ulang kalibrasi sensor temperatur dan flowmeter air pendingin.`);
  }

  // Overall Efficiency Rating according to ASHRAE 90.1 / SNI 6389
  let efficiencyRating: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
  let efficiencyVerdict = '';

  if (inputs.isWaterCooled) {
    if (specificPowerKWPerTR <= 0.58) {
      efficiencyRating = 'excellent';
      efficiencyVerdict = 'Sangat Efisien (Green Building Tier-1 / ASHRAE 90.1 Path B)';
    } else if (specificPowerKWPerTR <= 0.70) {
      efficiencyRating = 'good';
      efficiencyVerdict = 'Baik / Efisien (Memenuhi Standar SNI & ASHRAE 90.1 Path A)';
    } else if (specificPowerKWPerTR <= 0.85) {
      efficiencyRating = 'fair';
      efficiencyVerdict = 'Cukup / Standar Operasional Industri';
    } else {
      efficiencyRating = 'poor';
      efficiencyVerdict = 'Boros Energi (kW/TR tinggi, perlu tuning atau perawatan sistem)';
    }
  } else {
    // Air-Cooled Benchmarks
    if (specificPowerKWPerTR <= 1.05) {
      efficiencyRating = 'excellent';
      efficiencyVerdict = 'Sangat Efisien untuk Chiller Udara (High-Efficiency VFD/EC Fans)';
    } else if (specificPowerKWPerTR <= 1.25) {
      efficiencyRating = 'good';
      efficiencyVerdict = 'Baik (Standar Efisiensi Air-Cooled Chiller)';
    } else if (specificPowerKWPerTR <= 1.45) {
      efficiencyRating = 'fair';
      efficiencyVerdict = 'Cukup (Standar Konvensional)';
    } else {
      efficiencyRating = 'poor';
      efficiencyVerdict = 'Boros Energi (Periksa kebersihan koil kondensor udara)';
    }
  }

  return {
    chwDeltaTC: Math.round(chwDeltaTC * 100) / 100,
    evapCapacityKW: Math.round(evapCapacityKW * 10) / 10,
    evapCapacityTR: Math.round(evapCapacityTR * 10) / 10,
    evapCapacityBtuH: Math.round(evapCapacityBtuH),
    percentRatedCapacity: Math.round(percentRatedCapacity * 10) / 10,
    totalPowerInputKW: Math.round(totalPowerInputKW * 10) / 10,
    specificPowerKWPerTR: Math.round(specificPowerKWPerTR * 1000) / 1000,
    copActual: Math.round(copActual * 100) / 100,
    eerBtuPerWh: Math.round(eerBtuPerWh * 100) / 100,
    efficiencyRating,
    efficiencyVerdict,
    condenserHeatRejectionKW: Math.round(condenserHeatRejectionKW * 10) / 10,
    condenserHeatRejectionTR: Math.round(condenserHeatRejectionTR * 10) / 10,
    theoreticalHeatRejectionKW: Math.round(theoreticalHeatRejectionKW * 10) / 10,
    heatBalanceErrorPercent: Math.round(heatBalanceErrorPercent * 10) / 10,
    heatBalanceStatus,
    evaporatorApproachC: Math.round(evaporatorApproachC * 100) / 100,
    condenserApproachC: Math.round(condenserApproachC * 100) / 100,
    evaporatorFoulingStatus,
    condenserFoulingStatus,
    diagnostics,
  };
}

// ==========================================
// 2. COOLING TOWER PERFORMANCE TEST CALCULATION
// ==========================================
export function calculateCoolingTowerPerformance(inputs: CoolingTowerTestInputs): CoolingTowerTestResults {
  // Range = Hot Water In - Cold Water Out
  const rangeC = Math.max(0.1, inputs.hotWaterInletTempC - inputs.coldWaterOutletTempC);

  // Approach = Cold Water Out - Ambient Wet Bulb
  const approachC = Math.max(0.1, inputs.coldWaterOutletTempC - inputs.ambientWetBulbC);

  // Cooling Tower Effectiveness = Range / (Range + Approach) * 100%
  const effectivenessPercent = (rangeC / (rangeC + approachC)) * 100;

  // Heat Rejected Q = m_dot * Cp * Range
  const waterFlowKgS = inputs.waterFlowLpm / 60;
  const heatRejectedKW = waterFlowKgS * WATER_SPECIFIC_HEAT * rangeC;
  const heatRejectedTR = heatRejectedKW * KW_TO_TR;

  // Fan Specific Power kW/TR
  const fanSpecificPowerKWPerTR = heatRejectedTR > 0 ? inputs.fanMotorKW / heatRejectedTR : 0;

  // Water Evaporation Loss (CTI ATC-105 standard formula):
  // E ≈ 0.00085 * (1.8 * Range) * WaterFlow (approx 0.00153 * Range * Flow)
  // Or ~1.8 L/h per 1 TR of heat rejected
  const evaporationPercentOfFlow = 0.00153 * rangeC * 100; // in percent
  const evaporationRateLpm = inputs.waterFlowLpm * (evaporationPercentOfFlow / 100);
  const evaporationRateM3H = (evaporationRateLpm * 60) / 1000;

  // Drift Loss (high efficiency drift eliminators limit to 0.005% - 0.02% of circulating flow)
  const driftLossPercent = 0.01; // 0.01%
  const driftLossLpm = inputs.waterFlowLpm * (driftLossPercent / 100);

  // Blowdown Rate based on Cycles of Concentration (CoC):
  // B = (E - (CoC - 1) * D) / (CoC - 1) ≈ E / (CoC - 1)
  const coc = Math.max(1.5, inputs.cyclesOfConcentration);
  const blowdownRateLpm = Math.max(0, evaporationRateLpm / (coc - 1));
  const blowdownRateM3H = (blowdownRateLpm * 60) / 1000;

  // Total Makeup Water Required = Evaporation + Drift + Blowdown
  const totalMakeupWaterLpm = evaporationRateLpm + driftLossLpm + blowdownRateLpm;
  const totalMakeupWaterM3H = (totalMakeupWaterLpm * 60) / 1000;

  // Estimated Liquid-to-Gas Ratio L/G
  // If airflow CFM given: L = kg/s water, G = kg/s air
  let liquidToGasRatio = 1.1; // typical nominal
  if (inputs.fanAirflowCfm > 0) {
    const airFlowM3S = (inputs.fanAirflowCfm * 0.0283168) / 60;
    const airFlowKgS = airFlowM3S * 1.2;
    if (airFlowKgS > 0) {
      liquidToGasRatio = waterFlowKgS / airFlowKgS;
    }
  }

  // Health and Diagnostic Assessment
  const diagnostics: string[] = [];
  let towerHealthStatus: 'excellent' | 'normal' | 'caution' | 'critical' = 'normal';
  let healthVerdict = '';

  if (approachC <= 3.0) {
    towerHealthStatus = 'excellent';
    healthVerdict = 'Kinerja Sangat Prima (Approach rendah ≤ 3.0°C, transfer panas optimal)';
  } else if (approachC <= 4.5) {
    towerHealthStatus = 'normal';
    healthVerdict = 'Kinerja Normal Sesuai Standar Desain CTI (Approach 3.0 - 4.5°C)';
  } else if (approachC <= 6.5) {
    towerHealthStatus = 'caution';
    healthVerdict = 'Kinerja Menurun (Approach 4.5 - 6.5°C, periksa fouling fill / nozzle)';
    diagnostics.push(`Nilai Approach (${approachC.toFixed(1)}°C) melebihi batas ideal (≤ 4.0°C). Indikasi distribusi air nozzle tidak merata atau fill pack mulai tersumbat lumut/kerak.`);
  } else {
    towerHealthStatus = 'critical';
    healthVerdict = 'Kinerja Kritis (Approach > 6.5°C, perlu inspeksi mendesak)';
    diagnostics.push(`Kritis: Approach sangat tinggi (${approachC.toFixed(1)}°C). Menara pendingin gagal mendinginkan air ke temperatur desain, menyebabkan lonjakan temperatur kondenser chiller.`);
  }

  if (effectivenessPercent >= 70) {
    diagnostics.push(`Efektivitas termal tinggi (${effectivenessPercent.toFixed(1)}%). Menara pendingin bekerja dengan efisiensi tinggi.`);
  } else if (effectivenessPercent < 55) {
    diagnostics.push(`Efektivitas termal rendah (${effectivenessPercent.toFixed(1)}% < 55%). Periksa apakah ada resirkulasi udara panas (recirculation) dari outlet fan ke air intake.`);
  }

  if (coc < 3.0) {
    diagnostics.push(`Siklus Konsentrasi (CoC = ${coc.toFixed(1)}) terlalu rendah. Pemborosan air blowdown berlebih (${blowdownRateM3H.toFixed(1)} m³/jam). Lakukan optimalisasi water treatment.`);
  } else if (coc > 6.0) {
    diagnostics.push(`Peringatan CoC tinggi (${coc.toFixed(1)} > 6.0). Risiko penumpukan silika dan kerak kalsium karbonat pada fill pack dan pipa kondensor.`);
  }

  return {
    rangeC: Math.round(rangeC * 100) / 100,
    approachC: Math.round(approachC * 100) / 100,
    effectivenessPercent: Math.round(effectivenessPercent * 10) / 10,
    heatRejectedKW: Math.round(heatRejectedKW * 10) / 10,
    heatRejectedTR: Math.round(heatRejectedTR * 10) / 10,
    fanSpecificPowerKWPerTR: Math.round(fanSpecificPowerKWPerTR * 1000) / 1000,
    evaporationRateLpm: Math.round(evaporationRateLpm * 10) / 10,
    evaporationRateM3H: Math.round(evaporationRateM3H * 100) / 100,
    evaporationPercentOfFlow: Math.round(evaporationPercentOfFlow * 100) / 100,
    driftLossLpm: Math.round(driftLossLpm * 100) / 100,
    blowdownRateLpm: Math.round(blowdownRateLpm * 10) / 10,
    blowdownRateM3H: Math.round(blowdownRateM3H * 100) / 100,
    totalMakeupWaterLpm: Math.round(totalMakeupWaterLpm * 10) / 10,
    totalMakeupWaterM3H: Math.round(totalMakeupWaterM3H * 100) / 100,
    liquidToGasRatio: Math.round(liquidToGasRatio * 100) / 100,
    towerHealthStatus,
    healthVerdict,
    diagnostics,
  };
}

// ==========================================
// 3. AHU (AIR HANDLING UNIT) TEST CALCULATION
// ==========================================
export function calculateAhuPerformance(inputs: AhuTestInputs): AhuTestResults {
  // Supply Airflow conversion
  const supplyAirflowCfm = inputs.measuredAirflowCfm;
  const supplyAirflowM3S = (supplyAirflowCfm * 0.0283168) / 60; // CFM to m3/s
  const supplyAirflowM3H = supplyAirflowM3S * 3600;

  // Psychrometrics
  const enteringEnthalpyKjKg = getMoistAirEnthalpy(inputs.enteringAirDbtC, inputs.enteringAirRhPercent);
  const leavingEnthalpyKjKg = getMoistAirEnthalpy(inputs.leavingAirDbtC, inputs.leavingAirRhPercent);
  const deltaEnthalpyKjKg = Math.max(0.1, enteringEnthalpyKjKg - leavingEnthalpyKjKg);

  const airDensityKgM3 = getMoistAirDensity(inputs.leavingAirDbtC, inputs.leavingAirRhPercent);
  const massFlowAirKgS = supplyAirflowM3S * airDensityKgM3;

  // Airside Capacities
  // Total Q_air = m_dot_air * (h_in - h_out) in kW
  const airsideTotalCapacityKW = massFlowAirKgS * deltaEnthalpyKjKg;
  const airsideTotalCapacityTR = airsideTotalCapacityKW * KW_TO_TR;

  // Sensible Q_sensible = m_dot_air * Cp_air * (T_in - T_out)
  const deltaTC = Math.max(0.1, inputs.enteringAirDbtC - inputs.leavingAirDbtC);
  const airsideSensibleCapacityKW = massFlowAirKgS * 1.006 * deltaTC;

  // Latent Q_latent = Q_total - Q_sensible
  const airsideLatentCapacityKW = Math.max(0, airsideTotalCapacityKW - airsideSensibleCapacityKW);

  // Sensible Heat Ratio SHR = Q_sensible / Q_total
  const sensibleHeatRatio = airsideTotalCapacityKW > 0 ? airsideSensibleCapacityKW / airsideTotalCapacityKW : 1.0;

  // Waterside Capacity Q_water = m_dot_water * Cp_water * (T_water_out - T_water_in)
  const chwDeltaTC = Math.max(0.1, inputs.chwOutletTempC - inputs.chwInletTempC);
  const chwFlowKgS = inputs.chwFlowLpm / 60;
  const watersideCapacityKW = chwFlowKgS * WATER_SPECIFIC_HEAT * chwDeltaTC;
  const watersideCapacityTR = watersideCapacityKW * KW_TO_TR;

  // Heat Balance Discrepancy (% difference between airside and waterside)
  const referenceCapacityKW = Math.max(0.1, (airsideTotalCapacityKW + watersideCapacityKW) / 2);
  const heatBalanceDiffKW = Math.abs(airsideTotalCapacityKW - watersideCapacityKW);
  const heatBalanceErrorPercent = (heatBalanceDiffKW / referenceCapacityKW) * 100;

  let heatBalanceStatus: 'balanced' | 'acceptable' | 'discrepancy' = 'balanced';
  if (heatBalanceErrorPercent <= 10.0) {
    heatBalanceStatus = 'balanced'; // < 10% very good for field AHU test
  } else if (heatBalanceErrorPercent <= 20.0) {
    heatBalanceStatus = 'acceptable'; // 10-20% acceptable field testing tolerance
  } else {
    heatBalanceStatus = 'discrepancy'; // > 20% indicates duct leakage, sensor bias, or uncalibrated flow
  }

  // Coil Bypass Factor BF & Contact Factor CF
  // BF = (T_leave_air - T_adp) / (T_enter_air - T_adp)
  // Approximate Apparatus Dew Point (ADP) from coil CHW temperature (~ average CHW + 1.0°C)
  const coilApparatusDewPointC = Math.min(
    inputs.leavingAirDbtC - 0.5,
    (inputs.chwInletTempC + inputs.chwOutletTempC) / 2 + 1.0
  );
  let coilBypassFactor = 0.12;
  const denom = inputs.enteringAirDbtC - coilApparatusDewPointC;
  if (denom > 0) {
    coilBypassFactor = Math.max(0.02, Math.min(0.35, (inputs.leavingAirDbtC - coilApparatusDewPointC) / denom));
  }
  const coilContactFactor = 1 - coilBypassFactor;

  // Specific Fan Power (SFP) per EN 13779 / ASHRAE 90.1
  // SFP in W / (L/s) or kW / (m3/s)
  // Supply Airflow in L/s = supplyAirflowM3S * 1000
  const supplyAirflowLps = Math.max(1, supplyAirflowM3S * 1000);
  const specificFanPowerWPerLps = (inputs.fanInputKW * 1000) / supplyAirflowLps;
  const specificFanPowerKWPerM3s = inputs.fanInputKW / Math.max(0.001, supplyAirflowM3S);

  // EN 13779 SFP Classification
  let sfpClassification: 'SFP-1' | 'SFP-2' | 'SFP-3' | 'SFP-4' | 'SFP-5' | 'SFP-6' | 'SFP-7' = 'SFP-3';
  if (specificFanPowerKWPerM3s < 0.5) sfpClassification = 'SFP-1';
  else if (specificFanPowerKWPerM3s <= 0.75) sfpClassification = 'SFP-2';
  else if (specificFanPowerKWPerM3s <= 1.25) sfpClassification = 'SFP-3';
  else if (specificFanPowerKWPerM3s <= 2.0) sfpClassification = 'SFP-4';
  else if (specificFanPowerKWPerM3s <= 3.0) sfpClassification = 'SFP-5';
  else if (specificFanPowerKWPerM3s <= 4.5) sfpClassification = 'SFP-6';
  else sfpClassification = 'SFP-7';

  // Fan Static Efficiency = (Airflow m3/s * Total Pressure Pa) / (Input Power W) * 100%
  const airPowerW = supplyAirflowM3S * inputs.fanTotalPressurePa;
  const fanStaticEfficiencyPercent = inputs.fanInputKW > 0 ? (airPowerW / (inputs.fanInputKW * 1000)) * 100 : 60;

  // Filter Status
  let filterStatus: 'clean' | 'acceptable' | 'dirty_replace' = 'clean';
  const dpRatio = inputs.filterPressureDropPa / Math.max(1, inputs.cleanFilterDpPa);
  if (dpRatio <= 1.3) filterStatus = 'clean';
  else if (dpRatio <= 2.2) filterStatus = 'acceptable';
  else filterStatus = 'dirty_replace';

  // Diagnostics
  const diagnostics: string[] = [];

  if (filterStatus === 'dirty_replace') {
    diagnostics.push(`Filter udara kotor/tersumbat! Tekanan beda filter (${inputs.filterPressureDropPa} Pa) melampaui batas penggantian (${Math.round(inputs.cleanFilterDpPa * 2.2)} Pa). Segera ganti atau bersihkan filter.`);
  }

  if (sfpClassification === 'SFP-1' || sfpClassification === 'SFP-2') {
    diagnostics.push(`Efisiensi kipas sangat tinggi (${sfpClassification}, ${specificFanPowerWPerLps.toFixed(2)} W/(L/s)). Memenuhi standar Green Building GBCI / ASHRAE 90.1.`);
  } else if (sfpClassification === 'SFP-5' || sfpClassification === 'SFP-6' || sfpClassification === 'SFP-7') {
    diagnostics.push(`Konsumsi daya kipas tinggi (${sfpClassification}, SFP = ${specificFanPowerKWPerM3s.toFixed(2)} kW/(m³/s)). Evaluasi penurunan tekanan ductwork, damper berlebih, atau upgrade ke motor EC Plug.`);
  }

  if (heatBalanceStatus === 'discrepancy') {
    diagnostics.push(`Selisih kapasitas udara dan air pendingin signifikan (${heatBalanceErrorPercent.toFixed(1)}% > 20%). Periksa kebocoran casing AHU, insulasi ducting, atau kalibrasi sensor CHW.`);
  }

  if (coilBypassFactor > 0.20) {
    diagnostics.push(`Bypass factor koil tinggi (BF = ${(coilBypassFactor * 100).toFixed(1)}%). Menunjukkan udara lolos tanpa kontak yang cukup dengan sirip pipa pendingin.`);
  }

  return {
    enteringEnthalpyKjKg: Math.round(enteringEnthalpyKjKg * 10) / 10,
    leavingEnthalpyKjKg: Math.round(leavingEnthalpyKjKg * 10) / 10,
    airDensityKgM3: Math.round(airDensityKgM3 * 1000) / 1000,
    airsideTotalCapacityKW: Math.round(airsideTotalCapacityKW * 10) / 10,
    airsideTotalCapacityTR: Math.round(airsideTotalCapacityTR * 10) / 10,
    airsideSensibleCapacityKW: Math.round(airsideSensibleCapacityKW * 10) / 10,
    airsideLatentCapacityKW: Math.round(airsideLatentCapacityKW * 10) / 10,
    sensibleHeatRatio: Math.round(sensibleHeatRatio * 100) / 100,
    supplyAirCfmActual: Math.round(supplyAirflowCfm),
    chwDeltaTC: Math.round(chwDeltaTC * 100) / 100,
    watersideCapacityKW: Math.round(watersideCapacityKW * 10) / 10,
    watersideCapacityTR: Math.round(watersideCapacityTR * 10) / 10,
    heatBalanceErrorPercent: Math.round(heatBalanceErrorPercent * 10) / 10,
    heatBalanceStatus,
    coilApparatusDewPointC: Math.round(coilApparatusDewPointC * 10) / 10,
    coilBypassFactor: Math.round(coilBypassFactor * 1000) / 1000,
    coilContactFactor: Math.round(coilContactFactor * 1000) / 1000,
    specificFanPowerWPerLps: Math.round(specificFanPowerWPerLps * 100) / 100,
    specificFanPowerKWPerM3s: Math.round(specificFanPowerKWPerM3s * 100) / 100,
    sfpClassification,
    fanStaticEfficiencyPercent: Math.round(fanStaticEfficiencyPercent * 10) / 10,
    filterStatus,
    diagnostics,
  };
}

// ==========================================
// 4. INTEGRATED PLANT EFFICIENCY
// ==========================================
export function calculateIntegratedPlant(
  chillerResults: ChillerTestResults,
  ctResults: CoolingTowerTestResults,
  ctFanKW: number,
  chwpKW: number,
  cwpKW: number,
  ahuKW: number,
  tariffPerKwhIDR: number = 1500,
  operatingHoursPerYear: number = 4380 // 12 hrs/day * 365
): IntegratedPlantResults {
  const totalChillerTR = Math.max(1, chillerResults.evapCapacityTR);
  const totalChillerPowerKW = chillerResults.totalPowerInputKW;
  const totalCoolingTowerPowerKW = ctFanKW;
  const totalChwPumpsPowerKW = chwpKW;
  const totalCwPumpsPowerKW = cwpKW;
  const totalAhuPowerKW = ahuKW;

  const totalPlantPowerKW =
    totalChillerPowerKW +
    totalCoolingTowerPowerKW +
    totalChwPumpsPowerKW +
    totalCwPumpsPowerKW +
    totalAhuPowerKW;

  const overallPlantKWPerTR = totalPlantPowerKW / totalChillerTR;
  const overallPlantCop = (totalChillerTR * TR_TO_KW) / totalPlantPowerKW;

  let plantRating: 'world_class' | 'efficient' | 'standard' | 'inefficient' = 'standard';
  if (overallPlantKWPerTR <= 0.70) {
    plantRating = 'world_class';
  } else if (overallPlantKWPerTR <= 0.85) {
    plantRating = 'efficient';
  } else if (overallPlantKWPerTR <= 1.05) {
    plantRating = 'standard';
  } else {
    plantRating = 'inefficient';
  }

  const annualEnergyCostIDR = totalPlantPowerKW * operatingHoursPerYear * tariffPerKwhIDR;

  return {
    totalChillerTR: Math.round(totalChillerTR * 10) / 10,
    totalChillerPowerKW: Math.round(totalChillerPowerKW * 10) / 10,
    totalCoolingTowerPowerKW: Math.round(totalCoolingTowerPowerKW * 10) / 10,
    totalChwPumpsPowerKW: Math.round(totalChwPumpsPowerKW * 10) / 10,
    totalCwPumpsPowerKW: Math.round(totalCwPumpsPowerKW * 10) / 10,
    totalAhuPowerKW: Math.round(totalAhuPowerKW * 10) / 10,
    totalPlantPowerKW: Math.round(totalPlantPowerKW * 10) / 10,
    overallPlantKWPerTR: Math.round(overallPlantKWPerTR * 1000) / 1000,
    overallPlantCop: Math.round(overallPlantCop * 100) / 100,
    plantRating,
    annualEnergyCostIDR: Math.round(annualEnergyCostIDR),
  };
}

// ==========================================
// 5. STANDARD INDUSTRY PRESETS
// ==========================================
export const CHILLER_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  inputs: ChillerTestInputs;
}> = [
  {
    id: 'chiller_centrif_500tr',
    name: 'Chiller Sentrifugal 500 TR (Water-Cooled)',
    description: 'Chiller sentrifugal berefisiensi tinggi untuk gedung bertingkat / hotel bintang 5',
    inputs: {
      chillerType: 'water_cooled_centrifugal',
      chillerTag: 'CH-01 (Sentrifugal VFD)',
      ratedCapacityTR: 500,
      ratedPowerKW: 290,
      chwInletTempC: 12.2,
      chwOutletTempC: 6.7,
      chwFlowLpm: 4650,
      chwPressureDropKpa: 48,
      evapSaturationTempC: 5.5,
      isWaterCooled: true,
      cwInletTempC: 29.5,
      cwOutletTempC: 34.8,
      cwFlowLpm: 5700,
      ambientDryBulbC: 33.0,
      condSaturationTempC: 36.2,
      electricalInputMode: 'direct_kw',
      measuredPowerKW: 278,
      voltageV: 380,
      currentA: 460,
      powerFactor: 0.91,
    },
  },
  {
    id: 'chiller_screw_250tr',
    name: 'Chiller Screw 250 TR (Water-Cooled)',
    description: 'Chiller water-cooled screw standar rumah sakit atau pabrik farmasi',
    inputs: {
      chillerType: 'water_cooled_screw',
      chillerTag: 'CH-02 (Water Screw)',
      ratedCapacityTR: 250,
      ratedPowerKW: 165,
      chwInletTempC: 12.0,
      chwOutletTempC: 7.0,
      chwFlowLpm: 2300,
      chwPressureDropKpa: 52,
      evapSaturationTempC: 5.4,
      isWaterCooled: true,
      cwInletTempC: 30.0,
      cwOutletTempC: 35.2,
      cwFlowLpm: 2850,
      ambientDryBulbC: 33.5,
      condSaturationTempC: 37.1,
      electricalInputMode: 'direct_kw',
      measuredPowerKW: 162,
      voltageV: 380,
      currentA: 275,
      powerFactor: 0.88,
    },
  },
  {
    id: 'chiller_air_150tr',
    name: 'Chiller Air-Cooled Screw 150 TR',
    description: 'Chiller berpendingin udara untuk mall/kantor tanpa menara pendingin',
    inputs: {
      chillerType: 'air_cooled_screw',
      chillerTag: 'ACC-01 (Air Cooled)',
      ratedCapacityTR: 150,
      ratedPowerKW: 185,
      chwInletTempC: 12.5,
      chwOutletTempC: 7.2,
      chwFlowLpm: 1400,
      chwPressureDropKpa: 40,
      evapSaturationTempC: 5.2,
      isWaterCooled: false,
      cwInletTempC: 30.0,
      cwOutletTempC: 35.0,
      cwFlowLpm: 0,
      ambientDryBulbC: 34.5,
      condSaturationTempC: 46.5,
      electricalInputMode: 'direct_kw',
      measuredPowerKW: 172,
      voltageV: 380,
      currentA: 310,
      powerFactor: 0.85,
    },
  },
  {
    id: 'chiller_fouled_condenser',
    name: 'Chiller Uji Fouling / Kerak Kondensor',
    description: 'Kondisi studi kasus dengan kerak pipa kondensor tinggi (high approach > 3.5°C)',
    inputs: {
      chillerType: 'water_cooled_screw',
      chillerTag: 'CH-TEST (Fouling Alert)',
      ratedCapacityTR: 300,
      ratedPowerKW: 195,
      chwInletTempC: 12.0,
      chwOutletTempC: 7.0,
      chwFlowLpm: 2700,
      chwPressureDropKpa: 55,
      evapSaturationTempC: 5.0,
      isWaterCooled: true,
      cwInletTempC: 30.5,
      cwOutletTempC: 35.0,
      cwFlowLpm: 3300,
      ambientDryBulbC: 33.0,
      condSaturationTempC: 39.5, // 4.5°C approach!
      electricalInputMode: 'direct_kw',
      measuredPowerKW: 228,
      voltageV: 380,
      currentA: 390,
      powerFactor: 0.86,
    },
  },
  {
    id: 'cikor_ck5w_r410a',
    name: '🎓 Trainer CK-5W 15 kW (R410A Actual Run)',
    description: 'Data aktual trainer Jinan Cikor 3-Ton water chiller berpendingin air dengan refrigeran R410A',
    inputs: {
      chillerType: 'water_cooled_scroll',
      chillerTag: 'CK-5W (R410A Trainer Run)',
      ratedCapacityTR: 4.27, // 15.0 kW
      ratedPowerKW: 3.75,
      chwInletTempC: 14.0,
      chwOutletTempC: 12.3,
      chwFlowLpm: 36.0,
      chwPressureDropKpa: 28,
      evapSaturationTempC: 3.5, // LP 7.9 bar -> Te ~3.5°C
      isWaterCooled: true,
      cwInletTempC: 35.8,
      cwOutletTempC: 45.1,
      cwFlowLpm: 13.0,
      ambientDryBulbC: 32.8,
      condSaturationTempC: 50.5, // HP 29.7 bar -> Tc ~50.5°C
      electricalInputMode: 'three_phase_vi',
      measuredPowerKW: 4.37,
      voltageV: 380,
      currentA: 8.3, // Compressor current (Total: 12.6A)
      powerFactor: 0.80,
    },
  },
  {
    id: 'cikor_ck5w_r32',
    name: '🎓 Trainer CK-5W 15 kW (R32 Actual Run)',
    description: 'Data aktual trainer Jinan Cikor 3-Ton water chiller dengan refrigeran ramah lingkungan R32',
    inputs: {
      chillerType: 'water_cooled_scroll',
      chillerTag: 'CK-5W (R32 Trainer Run)',
      ratedCapacityTR: 4.27, // 15.0 kW
      ratedPowerKW: 3.75,
      chwInletTempC: 14.1,
      chwOutletTempC: 11.0,
      chwFlowLpm: 34.5,
      chwPressureDropKpa: 30,
      evapSaturationTempC: 2.9, // LP 7.9 bar -> Te ~2.9°C
      isWaterCooled: true,
      cwInletTempC: 35.2,
      cwOutletTempC: 38.0,
      cwFlowLpm: 49.2,
      ambientDryBulbC: 29.8,
      condSaturationTempC: 45.4, // HP 27.2 bar -> Tc ~45.4°C
      electricalInputMode: 'three_phase_vi',
      measuredPowerKW: 4.22,
      voltageV: 420,
      currentA: 7.3, // Compressor current (Total: 13.0A)
      powerFactor: 0.80,
    },
  },
  {
    id: 'cikor_ck5w_ideal',
    name: '🎓 Trainer CK-5W 15 kW (Desain Ideal Pabrik)',
    description: 'Benchmark desain ideal Jinan Cikor CK-5W (Kapasitas 15 kW / 4.27 TR, Delta T 5 K)',
    inputs: {
      chillerType: 'water_cooled_scroll',
      chillerTag: 'CK-5W (Ideal Benchmark 15 kW)',
      ratedCapacityTR: 4.27,
      ratedPowerKW: 3.75,
      chwInletTempC: 12.0,
      chwOutletTempC: 7.0,
      chwFlowLpm: 43.0,
      chwPressureDropKpa: 35,
      evapSaturationTempC: 3.5,
      isWaterCooled: true,
      cwInletTempC: 30.0,
      cwOutletTempC: 35.0,
      cwFlowLpm: 60.0,
      ambientDryBulbC: 30.0,
      condSaturationTempC: 38.0,
      electricalInputMode: 'three_phase_vi',
      measuredPowerKW: 3.75,
      voltageV: 380,
      currentA: 7.2,
      powerFactor: 0.85,
    },
  },
];

export const COOLING_TOWER_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  inputs: CoolingTowerTestInputs;
}> = [
  {
    id: 'cikor_ck5w_dct_r410a',
    name: '🎓 Dry Cooling Tower CK-5W (R410A Run)',
    description: 'Pengujian aktual Dry Cooling Tower pada beban refrigeran R410A (Aliran 13 LPM, Air Vel 8.5 m/s)',
    inputs: {
      towerTag: 'DCT-CK5W (R410A)',
      towerType: 'induced_draft_counterflow',
      ratedFlowLpm: 60,
      ratedRangeC: 5.0,
      ratedApproachC: 3.5,
      waterFlowLpm: 13.0,
      hotWaterInletTempC: 45.1,
      coldWaterOutletTempC: 35.8,
      ambientWetBulbC: 27.0,
      ambientDryBulbC: 32.8,
      fanMotorKW: 0.75,
      fanAirflowCfm: 4300,
      cyclesOfConcentration: 4.0,
    },
  },
  {
    id: 'cikor_ck5w_dct_r32',
    name: '🎓 Dry Cooling Tower CK-5W (R32 Run)',
    description: 'Pengujian aktual Dry Cooling Tower pada beban refrigeran R32 (Aliran 49.2 LPM, Air Vel 10.1 m/s)',
    inputs: {
      towerTag: 'DCT-CK5W (R32)',
      towerType: 'induced_draft_counterflow',
      ratedFlowLpm: 60,
      ratedRangeC: 5.0,
      ratedApproachC: 3.5,
      waterFlowLpm: 49.2,
      hotWaterInletTempC: 38.0,
      coldWaterOutletTempC: 35.2,
      ambientWetBulbC: 26.5,
      ambientDryBulbC: 29.8,
      fanMotorKW: 0.75,
      fanAirflowCfm: 4300,
      cyclesOfConcentration: 4.0,
    },
  },
  {
    id: 'cikor_ck5w_dct_ideal',
    name: '🎓 Dry Cooling Tower CK-5W (Ideal 20.4 kW)',
    description: 'Benchmark desain pelepasan kalor dry cooling tower CK-5W (Qdct 20.4 kW, Flow 60 LPM)',
    inputs: {
      towerTag: 'DCT-CK5W (Desain Ideal)',
      towerType: 'induced_draft_counterflow',
      ratedFlowLpm: 60,
      ratedRangeC: 5.0,
      ratedApproachC: 3.5,
      waterFlowLpm: 60.0,
      hotWaterInletTempC: 35.0,
      coldWaterOutletTempC: 30.0,
      ambientWetBulbC: 26.0,
      ambientDryBulbC: 30.0,
      fanMotorKW: 0.75,
      fanAirflowCfm: 4300,
      cyclesOfConcentration: 4.0,
    },
  },
  {
    id: 'ct_standard_600tr',
    name: 'Cooling Tower 600 TR (Induced Draft Counterflow)',
    description: 'Menara pendingin standar CTI untuk mendampingi chiller 500 TR',
    inputs: {
      towerTag: 'CT-01 (Square Counterflow)',
      towerType: 'induced_draft_counterflow',
      ratedFlowLpm: 5700,
      ratedRangeC: 5.0,
      ratedApproachC: 3.5,
      waterFlowLpm: 5650,
      hotWaterInletTempC: 35.0,
      coldWaterOutletTempC: 30.2,
      ambientWetBulbC: 27.2,
      ambientDryBulbC: 33.0,
      fanMotorKW: 18.5,
      fanAirflowCfm: 95000,
      cyclesOfConcentration: 4.5,
    },
  },
  {
    id: 'ct_crossflow_300tr',
    name: 'Cooling Tower Crossflow 300 TR',
    description: 'Menara aliran silang hemat energi kebisingan rendah',
    inputs: {
      towerTag: 'CT-02 (Crossflow Low Noise)',
      towerType: 'induced_draft_crossflow',
      ratedFlowLpm: 2900,
      ratedRangeC: 5.0,
      ratedApproachC: 3.8,
      waterFlowLpm: 2850,
      hotWaterInletTempC: 35.2,
      coldWaterOutletTempC: 30.8,
      ambientWetBulbC: 27.0,
      ambientDryBulbC: 32.5,
      fanMotorKW: 9.2,
      fanAirflowCfm: 48000,
      cyclesOfConcentration: 4.0,
    },
  },
  {
    id: 'ct_high_approach_alert',
    name: 'Cooling Tower Perlu Perawatan (Fouling / Aliran Rendah)',
    description: 'Studi kasus performa buruk: approach tinggi 5.8°C akibat kerak/biofilm',
    inputs: {
      towerTag: 'CT-WARNING (Fouled Fill)',
      towerType: 'induced_draft_counterflow',
      ratedFlowLpm: 3500,
      ratedRangeC: 5.0,
      ratedApproachC: 3.5,
      waterFlowLpm: 3400,
      hotWaterInletTempC: 36.5,
      coldWaterOutletTempC: 33.2,
      ambientWetBulbC: 27.4,
      ambientDryBulbC: 33.5,
      fanMotorKW: 15.0,
      fanAirflowCfm: 52000,
      cyclesOfConcentration: 2.5,
    },
  },
];

export const AHU_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  inputs: AhuTestInputs;
}> = [
  {
    id: 'cikor_ck5w_ahu_r410a',
    name: '🎓 Matched AHU CK-5W (R410A Run)',
    description: 'Pengujian aktual AHU pendamping trainer CK-5W dengan R410A (Vel 11.7 m/s, Qahu 10.3 kW)',
    inputs: {
      ahuTag: 'AHU-CK5W (R410A Run)',
      fanType: 'direct_drive_ec_plug',
      designAirflowCfm: 3050, // ~1.44 m3/s
      measuredAirflowCfm: 2500,
      supplyAirflowM3H: 4250,
      externalStaticPressurePa: 180,
      fanTotalPressurePa: 320,
      enteringAirDbtC: 30.8,
      enteringAirRhPercent: 65,
      leavingAirDbtC: 23.5,
      leavingAirRhPercent: 82,
      chwInletTempC: 12.3,
      chwOutletTempC: 14.0,
      chwFlowLpm: 36.0,
      fanInputKW: 1.1,
      filterPressureDropPa: 80,
      cleanFilterDpPa: 75,
    },
  },
  {
    id: 'cikor_ck5w_ahu_r32',
    name: '🎓 Matched AHU CK-5W (R32 Run)',
    description: 'Pengujian aktual AHU trainer CK-5W dengan R32 (Vel 11.9 m/s, Qahu 6.2 kW)',
    inputs: {
      ahuTag: 'AHU-CK5W (R32 Run)',
      fanType: 'direct_drive_ec_plug',
      designAirflowCfm: 3050,
      measuredAirflowCfm: 2550,
      supplyAirflowM3H: 4330,
      externalStaticPressurePa: 180,
      fanTotalPressurePa: 320,
      enteringAirDbtC: 29.0,
      enteringAirRhPercent: 62,
      leavingAirDbtC: 24.7,
      leavingAirRhPercent: 80,
      chwInletTempC: 11.0,
      chwOutletTempC: 14.1,
      chwFlowLpm: 34.5,
      fanInputKW: 1.1,
      filterPressureDropPa: 80,
      cleanFilterDpPa: 75,
    },
  },
  {
    id: 'cikor_ck5w_ahu_ideal',
    name: '🎓 Matched AHU CK-5W (Desain Ideal 15 kW)',
    description: 'Benchmark desain ideal pendinginan udara AHU trainer CK-5W (1.44 m3/s, Qahu 15.0 kW)',
    inputs: {
      ahuTag: 'AHU-CK5W (Desain Ideal)',
      fanType: 'direct_drive_ec_plug',
      designAirflowCfm: 3050,
      measuredAirflowCfm: 3050,
      supplyAirflowM3H: 5184,
      externalStaticPressurePa: 220,
      fanTotalPressurePa: 380,
      enteringAirDbtC: 28.0,
      enteringAirRhPercent: 60,
      leavingAirDbtC: 17.65,
      leavingAirRhPercent: 88,
      chwInletTempC: 7.0,
      chwOutletTempC: 12.0,
      chwFlowLpm: 43.0,
      fanInputKW: 1.2,
      filterPressureDropPa: 90,
      cleanFilterDpPa: 75,
    },
  },
  {
    id: 'ahu_cleanroom_10k',
    name: 'AHU Ruang Bersih / RS 10.000 CFM',
    description: 'AHU rumah sakit dengan filter HEPA / F8 dan kipas direct-drive EC plug fan',
    inputs: {
      ahuTag: 'AHU-OK-01 (Operating Theater)',
      fanType: 'direct_drive_ec_plug',
      designAirflowCfm: 10000,
      measuredAirflowCfm: 9850,
      supplyAirflowM3H: 16735,
      externalStaticPressurePa: 420,
      fanTotalPressurePa: 680,
      enteringAirDbtC: 24.5,
      enteringAirRhPercent: 58,
      leavingAirDbtC: 13.2,
      leavingAirRhPercent: 92,
      chwInletTempC: 7.0,
      chwOutletTempC: 12.4,
      chwFlowLpm: 460,
      fanInputKW: 5.2,
      filterPressureDropPa: 145,
      cleanFilterDpPa: 110,
    },
  },
  {
    id: 'ahu_commercial_office',
    name: 'AHU Perkantoran Komersial 6.000 CFM',
    description: 'AHU lantai tipikal gedung kantor sewa dengan fan belt centrifugal',
    inputs: {
      ahuTag: 'AHU-L08 (Office Floor)',
      fanType: 'centrifugal_belt_driven',
      designAirflowCfm: 6000,
      measuredAirflowCfm: 5900,
      supplyAirflowM3H: 10024,
      externalStaticPressurePa: 280,
      fanTotalPressurePa: 460,
      enteringAirDbtC: 25.5,
      enteringAirRhPercent: 62,
      leavingAirDbtC: 14.0,
      leavingAirRhPercent: 90,
      chwInletTempC: 7.2,
      chwOutletTempC: 12.8,
      chwFlowLpm: 280,
      fanInputKW: 3.6,
      filterPressureDropPa: 160,
      cleanFilterDpPa: 120,
    },
  },
  {
    id: 'ahu_dirty_filter',
    name: 'AHU Uji Filter Kotor & High Static (Warning)',
    description: 'Filter terhambat debu tebal menyebabkan penurunan debit dan boros listrik',
    inputs: {
      ahuTag: 'AHU-TEST-CLOGGED',
      fanType: 'centrifugal_belt_driven',
      designAirflowCfm: 8000,
      measuredAirflowCfm: 6600,
      supplyAirflowM3H: 11213,
      externalStaticPressurePa: 240,
      fanTotalPressurePa: 720,
      enteringAirDbtC: 26.0,
      enteringAirRhPercent: 65,
      leavingAirDbtC: 15.5,
      leavingAirRhPercent: 88,
      chwInletTempC: 7.5,
      chwOutletTempC: 13.0,
      chwFlowLpm: 320,
      fanInputKW: 4.8,
      filterPressureDropPa: 340, // dirty!
      cleanFilterDpPa: 120,
    },
  },
];

// ==========================================
// 6. JINAN CIKOR CK-5W DETAILED BENCHMARK DATASET
// (Extracted from Chiller_Performance_Analisis_RCO-WCT-2A_94e4ecf7.pdf)
// ==========================================
export const CIKOR_CK5W_BENCHMARK_DATA = {
  unitInfo: {
    model: 'Jinan Cikor CK-5W (Commercial Air Con Trainer)',
    type: 'Water Chiller with Water-Cooled Condenser & Matched AHU',
    nominalCapacityKW: 15.0,
    nominalCapacityTR: 4.27,
    nominalKcalH: 12900,
    compressorType: 'Scroll Hermetic / Semi-Hermetic Trainer Unit',
    compressorPowerKW: 3.75,
    waterPumpPowerKW: 0.75,
    waterPumpLiftM: 25,
    nominalChwFlowM3H: 2.6,
    nominalChwFlowLpm: 43.3,
  },
  refrigerationCycle: [
    { param: 'Jenis Refrigeran', ideal: 'R410A / R32', r410a: 'R410A', r32: 'R32', notes: 'Uji komparasi alternatif ramah lingkungan' },
    { param: 'Tegangan Kerja (V)', ideal: '380 - 420 V', r410a: '380 V', r32: '420 V', notes: '3-Fasa 50 Hz' },
    { param: 'Arus Total (A)', ideal: '10.5 A', r410a: '12.6 A', r32: '13.0 A', notes: 'Termasuk kompresor & motor pompa' },
    { param: 'Arus Kompresor (A)', ideal: '7.2 A', r410a: '8.3 A', r32: '7.3 A', notes: 'Arus kerja kompresor aktual' },
    { param: 'Daya Input Wk (kW)', ideal: '3.75 kW', r410a: '4.37 kW', r32: '4.22 kW', notes: 'Beban kompresi' },
    { param: 'Tekanan Rendah LP (bar)', ideal: '7.9 bar', r410a: '7.9 bar', r32: '7.9 bar', notes: 'Tekanan hisap stabil' },
    { param: 'Tekanan Tinggi HP (bar)', ideal: '26.0 - 28.0 bar', r410a: '29.7 bar', r32: '27.2 bar', notes: 'Tekanan buang / kondensasi' },
    { param: 'Suhu Evaporasi Te (°C)', ideal: '3.5 °C', r410a: '3.5 °C', r32: '2.9 °C', notes: 'Suhu jenuh evaporasi' },
    { param: 'Suhu Kondensasi Tc (°C)', ideal: '45.0 - 50.0 °C', r410a: '50.5 °C', r32: '45.4 °C', notes: 'Suhu jenuh kondensasi' },
    { param: 'Suhu Hisap T1 (°C)', ideal: '9.0 - 11.0 °C', r410a: '10.6 °C', r32: '7.2 °C', notes: 'Superheat R410A: 7.1 K, R32: 4.3 K' },
    { param: 'Suhu Buang T2 (°C)', ideal: '75.0 - 85.0 °C', r410a: '86.2 °C', r32: '98.8 °C', notes: 'R32 menghasilkan discharge lebih panas' },
    { param: 'Suhu Cairan T3 (°C)', ideal: '38.0 - 42.0 °C', r410a: '42.3 °C', r32: '38.6 °C', notes: 'Subcooling R410A: 8.2 K, R32: 6.8 K' },
    { param: 'Kapasitas Siklus Qe (kW)', ideal: '15.00 kW', r410a: '19.20 kW', r32: '15.96 kW', notes: 'Dihitung dari entalpi h1 - h4' },
    { param: 'Kalor Lepas Qc (kW)', ideal: '18.75 kW', r410a: '24.45 kW', r32: '20.19 kW', notes: 'Dihitung dari entalpi h2 - h3' },
    { param: 'COP Aktual Siklus', ideal: '4.00', r410a: '4.40', r32: '3.78', notes: 'Siklus refrigerasi bekerja SANGAT BAGUS' },
    { param: 'COP Carnot', ideal: '6.50', r410a: '5.89', r32: '6.50', notes: 'Efisiensi batas teoretis' },
  ],
  waterChillerEvaporator: [
    { param: 'Debit Air CHW (LPM)', ideal: '43.0 LPM', r410a: '36.0 LPM', r32: '34.5 LPM', notes: 'Rotameter air dingin' },
    { param: 'Suhu Masuk Tin (°C)', ideal: '12.0 °C', r410a: '12.3 °C', r32: '11.0 °C', notes: 'Chilled water return' },
    { param: 'Suhu Keluar Tout (°C)', ideal: '7.0 °C', r410a: '14.0 °C', r32: '14.1 °C', notes: 'Perbedaan suhu terbaca kecil' },
    { param: 'Perbedaan Suhu Delta T (K)', ideal: '5.0 K', r410a: '1.7 K', r32: '3.1 K', notes: 'Delta T sangat rendah di bawah 5 K' },
    { param: 'Kapasitas Air Aktual (kW)', ideal: '15.0 kW', r410a: '4.3 kW', r32: '7.5 kW', notes: 'Hanya 28.7% (R410A) & 50.0% (R32) dari ideal' },
    { param: 'Evaluasi Kinerja', ideal: 'BAGUS (100%)', r410a: 'JELEK (Diskrepansi Tinggi)', r32: 'JELEK (Diskrepansi Sedang)', notes: 'Sisi air belum optimal' },
  ],
  waterCooledCondenser: [
    { param: 'Debit Air CW (LPM)', ideal: '60.0 LPM', r410a: '13.0 LPM', r32: '49.2 LPM', notes: 'R410A aliran sangat kecil (13 LPM)' },
    { param: 'Suhu Masuk Tin (°C)', ideal: '30.0 °C', r410a: '45.1 °C', r32: '38.0 °C', notes: 'Air pendingin masuk kondenser' },
    { param: 'Suhu Keluar Tout (°C)', ideal: '35.0 °C', r410a: '35.8 °C', r32: '35.2 °C', notes: 'Air pendingin keluar kondenser' },
    { param: 'Perbedaan Suhu Delta T (K)', ideal: '5.0 K', r410a: '9.3 K', r32: '2.8 K', notes: 'Dipengaruhi oleh variasi debit rotameter' },
    { param: 'Kalor Air Kondenser Qc (kW)', ideal: '20.9 kW', r410a: '8.4 kW', r32: '9.6 kW', notes: '40.2% (R410A) & 45.9% (R32) dari ideal' },
    { param: 'Evaluasi Kinerja', ideal: 'BAGUS (100%)', r410a: 'JELEK (Debit Kurang)', r32: 'JELEK (Delta T Rendah)', notes: 'Pelepasan kalor ke air rendah' },
  ],
  dryCoolingTower: [
    { param: 'Kecepatan Udara (m/s)', ideal: '10.0 m/s', r410a: '8.5 m/s', r32: '10.1 m/s', notes: 'Anemometer udara buang DCT' },
    { param: 'Suhu Masuk Udara (°C)', ideal: '30.0 °C', r410a: '32.8 °C', r32: '29.8 °C', notes: 'Temperatur udara sekitar' },
    { param: 'Suhu Keluar Udara (°C)', ideal: '40.0 °C', r410a: '41.0 °C', r32: '37.6 °C', notes: 'Udara panas meninggalkan menara' },
    { param: 'Perbedaan Suhu Udara (K)', ideal: '10.0 K', r410a: '8.2 K', r32: '7.8 K', notes: 'Perpindahan kalor udara berlangsung baik' },
    { param: 'Kapasitas Pelepasan Qdct (kW)', ideal: '20.4 kW', r410a: '14.2 kW', r32: '16.0 kW', notes: '69.6% (R410A) & 78.4% (R32) dari ideal' },
    { param: 'Evaluasi Kinerja', ideal: 'BAGUS', r410a: 'CUKUP BAGUS', r32: 'BAGUS', notes: 'Sisi udara menara berfungsi memadai' },
  ],
  matchedAhu: [
    { param: 'Kecepatan Udara (m/s)', ideal: '12.0 m/s', r410a: '11.7 m/s', r32: '11.9 m/s', notes: 'Aliran udara supply duct AHU' },
    { param: 'Suhu Masuk Udara Tea (°C)', ideal: '28.0 °C', r410a: '30.8 °C', r32: '29.0 °C', notes: 'Return air ruangan' },
    { param: 'Suhu Keluar Udara Tla (°C)', ideal: '17.65 °C', r410a: '23.5 °C', r32: '24.7 °C', notes: 'Off-coil supply air' },
    { param: 'Perbedaan Suhu Delta T (K)', ideal: '10.35 K', r410a: '7.3 K', r32: '4.3 K', notes: 'Pendinginan udara belum sedingin ideal' },
    { param: 'Kapasitas AHU Qahu (kW)', ideal: '15.0 kW', r410a: '10.3 kW', r32: '6.2 kW', notes: '68.7% (R410A) & 41.3% (R32) dari ideal' },
    { param: 'Evaluasi Kinerja', ideal: 'BAGUS (100%)', r410a: 'CUKUP (68.7%)', r32: 'JELEK (41.3%)', notes: 'Pasokan air dingin chiller terbatas' },
  ],
  diagnosisSummary: {
    verdictRefCycle: 'BAGUS (NORMAL & EFISIEN)',
    verdictWaterside: 'JELEK / ABNORMAL (TERJADI DISKREPANSI TINGGI)',
    coreIssue:
      'Siklus kompresor refrigerasi bekerja prima (COP 3.78 - 4.40 dengan kapasitas 16 - 19 kW), namun kapasitas penyerapan air dingin evaporator hanya terbaca 4.3 kW (R410A) dan 7.5 kW (R32), jauh di bawah kapasitas ideal 15 kW.',
    rootCauses: [
      'Delta T air pada evaporator sangat kecil (hanya 1.7 K pada R410A dan 3.1 K pada R32, jauh di bawah standar desain 5.0 K).',
      'Rotameter flowmeter air evaporator dan kondenser belum terkalibrasi dengan akurat (laju alir aktual kemungkinan menyimpang dari skala baca).',
      'Terjadi fenomena short-circuiting atau bypass mixing di tangki penyangga (buffer tank) sebelum air sempat melintasi seluruh permukaan perpindahan kalor pipa koil.',
      'Laju pompa sirkulasi 0.75 kW terlalu kencang untuk luas permukaan koil trainer sehingga waktu tinggal (retention time) air terlalu singkat untuk transfer kalor optimal.',
      'Suhu inlet dan outlet air kondenser pada uji R410A menunjukkan anomali debit sangat rendah (hanya 13 LPM vs nominal 60 LPM).',
    ],
    technicalSolutions: [
      'Kalibrasi Sensor Temperatur (RTD PT100 / Termokopel): Lakukan kalibrasi 2-titik (es mencair 0°C dan air mendidih 100°C) pada seluruh probe suhu air dingin (inlet/outlet) dan air kondenser.',
      'Penyetelan Balancing Valve Pompa: Atur katup manual (throttling valve) di jalur pompa air untuk menurunkan debit air hingga tercapai perbedaan temperatur standar Delta T = 5.0 K (12°C masuk -> 7°C keluar).',
      'Kalibrasi Rotameter Air: Lakukan uji kalibrasi debit dengan metode penimbangan massa air per detik (bucket & stopwatch method) untuk membuat faktor koreksi rotameter.',
      'Inspeksi Jalur Pemipaan & Isolasi: Pastikan pipa tembaga/baja chilled water dari chiller menuju AHU terisolasi sempurna dengan Armaflex tebal guna mencegah kebocoran kalor dari udara sekitar.',
      'Pembersihan Tube Kondenser (Descaling): Bersihkan kerak air dan endapan pada kondenser water-cooled dengan larutan pembersih kerak kimia ringan agar laju pelepasan kalor kondenser kembali ke 20.9 kW.',
    ],
  },
};
