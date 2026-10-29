export type FlowConfiguration = 'parallel' | 'counter' | 'cross' | 'multipass';

export type HeatExchangerType = 
  | 'double_pipe' 
  | 'shell_tube' 
  | 'plate_frame' 
  | 'cross_finned'
  | 'custom';

export type ExchangerCalculationMode = 'solve_area' | 'solve_u';

export type TemperatureUnit = 'C' | 'F' | 'K';
export type CapacityUnit = 'kW' | 'W' | 'BTU/h' | 'kcal/h' | 'TR';
export type AreaUnit = 'm2' | 'ft2';
export type CoefficientUnit = 'W/m2K' | 'BTU/hr-ft2-F' | 'kcal/hr-m2-C';

export interface FluidPreset {
  id: string;
  name: string;
  cp: number; // J/(kg·K)
  density: number; // kg/m³
  phase: 'liquid' | 'gas' | 'phase_change';
  defaultTempC: number;
}

export interface HeatExchangerInputs {
  // Fluid 1
  fluid1Name: string;
  t1In: number;
  t1Out: number;
  fluid1PresetId?: string;

  // Fluid 2
  fluid2Name: string;
  t2In: number;
  t2Out: number;
  fluid2PresetId?: string;

  // Capacity
  capacity: number;
  capacityUnit: CapacityUnit;

  // Flow and geometry
  flowConfig: FlowConfiguration;
  exchangerType: HeatExchangerType;
  calcMode: ExchangerCalculationMode;

  // Coefficient or Area depending on mode
  overallU: number; // W/(m²·K)
  area: number; // m²

  // Physical dimensions (optional for absolute distance)
  exchangerLengthMeters?: number;
  numberOfTubes?: number;
  foulingFactor?: number; // m²·K/W
}

export interface TemperatureCurvePoint {
  xRatio: number; // 0 to 1
  distanceMeters?: number;
  tHot: number; // °C
  tCold: number; // °C
  tColdPass2?: number; // for multi-pass 2-tube pass
  deltaT: number; // °C
}

export interface HeatExchangerResults {
  // Classified fluids
  isFluid1Hot: boolean;
  tHotIn: number;
  tHotOut: number;
  tColdIn: number;
  tColdOut: number;

  // Capacity in Watts & standard units
  capacityWatts: number;
  capacityKw: number;
  capacityBtuHr: number;
  capacityTR: number;

  // Heat capacity rates & mass flows
  chWattsPerK: number; // Ch = Q / (Th,in - Th,out)
  ccWattsPerK: number; // Cc = Q / (Tc,out - Tc,in)
  cMin: number;
  cMax: number;
  capacityRatioR: number; // Cr = Cmin / Cmax
  flowRatioR: number; // R = (Th,in - Th,out)/(Tc,out - Tc,in) = Cc / Ch
  effectivenessP: number; // P = (Tc,out - Tc,in)/(Th,in - Tc,in)

  // Mass flow rates
  massFlowHotKgS: number;
  massFlowColdKgS: number;

  // LMTD & Effective Delta T
  lmtdCounter: number;
  lmtdParallel: number;
  lmtdNominal: number;
  correctionFactorF: number;
  effectiveDeltaT: number; // F * LMTD

  // Solved parameters
  overallU: number; // W/(m²·K)
  areaM2: number;
  areaFt2: number;

  // Effectiveness - NTU
  qMaxWatts: number;
  effectiveness: number; // ε = Q / Qmax
  ntu: number; // UA / Cmin

  // Delta T terminals
  deltaT1: number;
  deltaT2: number;
  pinchPointDeltaT: number;
  pinchPointLocation: string; // e.g. "Inlet (x = 0%)", "Outlet (x = 100%)", or "Internal"
  hasTemperatureCross: boolean;
  isThermodynamicallyFeasible: boolean;
  warnings: string[];

  // Curve points for graphing
  curvePoints: TemperatureCurvePoint[];
}

export interface HeatExchangerReportMeta {
  productName: string;
  modelUnit: string;
  workOrderNumber: string;
  projectName: string;
  reportDate: string;
  testedBy?: string;
  verifiedBy?: string;
  approvedBy?: string;
  companyName?: string;
  notes?: string;
}
