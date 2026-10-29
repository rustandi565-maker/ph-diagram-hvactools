export type ExtendedRefrigerantId =
  | 'R134a'   // Tetrafluoroethane
  | 'R410A'   // Commercial/Residential AC
  | 'R32'     // Modern split AC
  | 'R404A'   // Commercial freezing
  | 'R448A'   // Solstice N40 HFO blend (low GWP replacement for R404A)
  | 'R717'    // Ammonia (NH3)
  | 'R744'    // CO2 (Carbon Dioxide)
  | 'R290'    // Propane
  | 'R600a'   // Isobutane
  | 'R22'     // Chlorodifluoromethane (HCFC standard)
  | 'R507A'   // Azeotropic commercial
  | 'R407C'   // R22 retrofit blend
  | 'R1234yf' // Ultra-low GWP auto HFO
  | 'R1234ze' // Chiller HFO
  | 'R23'     // Ultra-low temperature (-80°C)
  | 'R41'     // Fluoromethane (HFC)
  | 'R114'    // Dichlorotetrafluoroethane (CFC)
  | 'R12'     // Dichlorodifluoromethane (CFC)
  | 'R1270';  // Propylene

export interface ExtendedRefrigerantMeta {
  id: ExtendedRefrigerantId;
  name: string;
  category: 'HFC' | 'Natural' | 'HFO' | 'HCFC' | 'Hydrocarbon' | 'CFC';
  formula: string;
  safetyClass: string; // ASHRAE 34: A1, A2L, A3, B2L
  nbpC: number;        // Normal Boiling Point (°C)
  tcritC: number;      // Critical Temperature (°C)
  pcritBar: number;    // Critical Pressure (bar)
  hcritKjKg: number;   // Critical Point Enthalpy (kJ/kg)
  gwp: number;         // Global Warming Potential
  odp: number;         // Ozone Depletion Potential
  typicalUse: string;  // Primary industrial/commercial application
  color: string;       // Theme color for P-h curve
}

export interface CycleStatePoint {
  index: 1 | 2 | 3 | 4;
  label: string;
  name: string;
  pressureBar: number;
  pressureKPa: number;
  enthalpyKjKg: number;
  tempC: number;
  phase: string;
  qualityX?: number; // vapor quality (0 to 1) if inside dome
  entropyKjKgK?: number;
  specificVolumeM3Kg?: number;
  specificVolumeDm3Kg?: number; // dm3/kg for liquid
}

export type PhInputMode = 'direct_measurements' | 'saturation_temperatures';
export type PressureUnit = 'bar' | 'psi' | 'kPa';
export type PowerUnit = 'kW' | 'HP' | 'Watt';

export interface PhReportMeta {
  productName: string; // Changed from trainerName as requested by user
  trainerName?: string; // Optional backwards compatibility
  modelUnit: string;
  workOrderNumber: string;
  projectName: string;
  reportDate: string;
  conclusion?: string; // Kesimpulan pengujian yang dapat diedit
}

export interface PhCycleResult {
  refrigerant: ExtendedRefrigerantMeta;
  inputMode: PhInputMode;
  // State points
  state1: CycleStatePoint; // Titik 1: Suction Kompresor (T1, P_suction)
  state2: CycleStatePoint; // Titik 2: Discharge Kompresor (T2, P_discharge)
  state3: CycleStatePoint; // Titik 3: Liquid Sebelum Ekspansi (T3, P_discharge) -> Perpotongan Discharge pressure & Temp liquid TXV (T3)
  state4: CycleStatePoint; // Titik 4: Inlet Evaporator / Setelah Ekspansi (T4, P_suction)

  // Operating parameters
  teC: number;
  tcC: number;
  peBar: number;
  pcBar: number;
  suctionPressureBar: number;
  dischargePressureBar: number;
  suctionTempC: number;
  dischargeTempC: number;
  liquidTempC: number;
  dischargeSuperheatK: number;
  isentropicEfficiencyActual: number;
  superheatK: number;
  subcoolingK: number;
  pressureRatio: number;
  coolingCapacityKw: number;

  // Performance metrics
  refrigeratingEffectKjKg: number; // q_e = h1 - h4
  workCompressionKjKg: number;     // w_c = h2 - h1
  heatRejectionKjKg: number;       // q_c = h2 - h3
  massFlowKgS: number;
  massFlowKgH: number;
  // Mass flow conversion to LPM using liquid specific volume Vl at T3:
  // Rumus: (kg/s x dm³/kg x 60)
  liquidSpecificVolumeDm3Kg: number; // Vl (dm3/kg or L/kg) at T3
  liquidSpecificVolumeM3Kg: number;  // vl (m3/kg)
  massFlowLpm: number;               // LPM = kg/s * Vl * 60

  compressorPowerKw: number;
  compressorPowerHp: number;
  heatRejectedCondenserKw: number;
  copActual: number;
  copCarnot: number;
  secondLawEfficiencyPercent: number;

  // Energy Efficiency Ratio (EER) and SKEM Star Rating
  // EER = COP * 3.41214 (Btu/(h·W))
  eerBtuWh: number;
  eerRatingStars: number; // 1 to 5 stars (SKEM ESDM standard)
  eerStarLabel: string;

  vaporQualityInletEvap: number; // x4
  estimatedDischargeTempC: number;
  volumetricEfficiency: number;
  displacementM3H: number;
  displacementCfm: number;

  // Saturation Dome Curve Points for SVG plotting (logP vs h)
  domePoints: Array<{
    tempC: number;
    pBar: number;
    hf: number; // saturated liquid enthalpy
    hg: number; // saturated vapor enthalpy
  }>;
  hMin: number;
  hMax: number;
  pMin: number;
  pMax: number;
}

export interface SavedPhCyclePlot {
  id: string;
  name: string;
  timestamp: number;
  refrigerantId: ExtendedRefrigerantId;
  suctionPressure: number;
  suctionPressureUnit: PressureUnit;
  dischargePressure: number;
  dischargePressureUnit: PressureUnit;
  suctionTempC: number;
  dischargeTempC: number;
  liquidTempC: number;
  compressorPower: number;
  compressorPowerUnit: PowerUnit;
  // Key metrics for quick glance
  cop: number;
  coolingCapacityKw: number;
  superheatK: number;
  subcoolingK: number;
  eerBtuWh: number;
  // Report identity metadata saved with the plotting
  reportMeta?: PhReportMeta;
}
