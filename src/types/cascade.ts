export type RefrigerantId =
  | 'R744'  // CO2 (Carbon Dioxide)
  | 'R717'  // NH3 (Ammonia)
  | 'R23'   // Trifluoromethane
  | 'R134a' // 1,1,1,2-Tetrafluoroethane
  | 'R404A' // HFC Blend
  | 'R290'  // Propane
  | 'R507A' // Azeotrope Blend
  | 'R410A'; // High Pressure Blend

export interface RefrigerantInfo {
  id: RefrigerantId;
  name: string;
  chemicalFormula: string;
  ashraeSafety: string; // e.g. A1, B2L, A3
  normalBoilingPointC: number;
  criticalTempC: number;
  criticalPressureBar: number;
  gwp: number; // Global Warming Potential
  odp: number; // Ozone Depletion Potential
  isSuitableLTC: boolean;
  isSuitableHTC: boolean;
  description: string;
}

export interface CascadePreset {
  id: string;
  name: string;
  ltcRefrigerant: RefrigerantId;
  htcRefrigerant: RefrigerantId;
  teC: number;
  tcC: number;
  deltaTcc: number;
  coolingCapacityKw: number;
  description: string;
  industryApplication: string;
}

export interface CascadeCycleResult {
  // Temperatures
  teK: number;
  teC: number;
  tcK: number;
  tcC: number;
  deltaTcc: number;
  tccOptCarnotK: number;
  tccOptCarnotC: number;
  tccActualK: number;
  tccActualC: number;
  tCondLtcC: number;
  tEvapHtcC: number;

  // Pressures (bar & kPa)
  pEvapLtcBar: number;
  pCondLtcBar: number;
  pressureRatioLtc: number;

  pEvapHtcBar: number;
  pCondHtcBar: number;
  pressureRatioHtc: number;

  // Enthalpies (kJ/kg)
  ltcEnthalpies: {
    h1: number; // Evaporator exit (saturated vapor)
    h2: number; // Compressor exit
    h3: number; // Condenser exit (saturated liquid)
    h4: number; // Expansion valve exit (= h3)
    qEvap: number; // h1 - h4
    wComp: number; // h2 - h1
  };
  htcEnthalpies: {
    h1: number; // Evaporator exit (saturated vapor)
    h2: number; // Compressor exit
    h3: number; // Condenser exit (saturated liquid)
    h4: number; // Expansion valve exit (= h3)
    qEvap: number; // h1 - h4
    wComp: number; // h2 - h1
  };

  // Mass flow rates
  coolingCapacityKw: number;
  massFlowLtcKgS: number;
  massFlowLtcKgH: number;
  massFlowHtcKgS: number;
  massFlowHtcKgH: number;

  // Work & Capacities (kW)
  workCompLtcKw: number;
  workCompHtcKw: number;
  totalWorkCompKw: number;
  cascadeCondenserLoadKw: number; // Heat exchanged in intermediate heat exchanger
  ambientCondenserHeatRejectedKw: number;

  // Performance Indicators
  copLtc: number;
  copHtc: number;
  copCascade: number;
  copCarnot: number;
  secondLawEfficiencyPercent: number;

  // Compressor Volumetric Performance (Stoecker & Jones)
  volumetricEfficiencyLtc: number;
  displacementLtcM3H: number;
  displacementLtcCfm: number;

  volumetricEfficiencyHtc: number;
  displacementHtcM3H: number;
  displacementHtcCfm: number;
}
