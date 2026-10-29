export type ChillerType =
  | 'water_cooled_centrifugal'
  | 'water_cooled_screw'
  | 'water_cooled_scroll'
  | 'water_cooled_mag_bearing'
  | 'air_cooled_screw'
  | 'air_cooled_scroll';

export type CoolingTowerType =
  | 'induced_draft_counterflow'
  | 'induced_draft_crossflow'
  | 'forced_draft_counterflow';

export type AhuFanType =
  | 'centrifugal_belt_driven'
  | 'direct_drive_ec_plug'
  | 'vane_axial';

export interface ChillerTestInputs {
  chillerType: ChillerType;
  chillerTag: string;
  ratedCapacityTR: number;
  ratedPowerKW: number;

  // Evaporator (Chilled Water)
  chwInletTempC: number;      // e.g. 12.0 °C
  chwOutletTempC: number;     // e.g. 7.0 °C
  chwFlowLpm: number;         // e.g. 2600 LPM (~156 m3/h)
  chwPressureDropKpa: number; // e.g. 45 kPa
  evapSaturationTempC: number;// e.g. 5.5 °C (for approach calculation)

  // Condenser Side
  isWaterCooled: boolean;
  cwInletTempC: number;       // e.g. 30.0 °C (ECWT)
  cwOutletTempC: number;      // e.g. 35.0 °C (LCWT)
  cwFlowLpm: number;          // e.g. 3200 LPM (~192 m3/h)
  ambientDryBulbC: number;    // For air-cooled, e.g. 35.0 °C
  condSaturationTempC: number;// e.g. 36.8 °C (for approach calculation)

  // Electrical Input
  electricalInputMode: 'direct_kw' | 'three_phase_vi';
  measuredPowerKW: number;    // Direct kW
  voltageV: number;           // Average phase-to-phase V
  currentA: number;           // Average line current A
  powerFactor: number;        // e.g. 0.88
}

export interface ChillerTestResults {
  // Evaporator Thermal Performance
  chwDeltaTC: number;
  evapCapacityKW: number;
  evapCapacityTR: number;
  evapCapacityBtuH: number;
  percentRatedCapacity: number;

  // Electrical & Efficiency
  totalPowerInputKW: number;
  specificPowerKWPerTR: number; // kW/TR
  copActual: number;
  eerBtuPerWh: number;
  efficiencyRating: 'excellent' | 'good' | 'fair' | 'poor';
  efficiencyVerdict: string;

  // Condenser & Heat Balance
  condenserHeatRejectionKW: number;
  condenserHeatRejectionTR: number;
  theoreticalHeatRejectionKW: number; // Q_evap + P_comp
  heatBalanceErrorPercent: number;    // ASHRAE Guideline 22 requires < 5%
  heatBalanceStatus: 'valid' | 'warning' | 'invalid';

  // Diagnostic Approach Temperatures
  evaporatorApproachC: number;  // CHW Out - Evap Sat Temp (target: 0.5 - 1.5 °C)
  condenserApproachC: number;   // Cond Sat Temp - CW Out (target: 0.5 - 2.0 °C)
  evaporatorFoulingStatus: 'clean' | 'mild_fouling' | 'severe_fouling';
  condenserFoulingStatus: 'clean' | 'mild_fouling' | 'severe_fouling';
  diagnostics: string[];
}

export interface CoolingTowerTestInputs {
  towerTag: string;
  towerType: CoolingTowerType;
  ratedFlowLpm: number;         // Design water flow (LPM)
  ratedRangeC: number;          // Design range, e.g. 5.0 °C
  ratedApproachC: number;       // Design approach, e.g. 3.0 °C

  // Operating Measurements
  waterFlowLpm: number;         // Measured water flow (LPM)
  hotWaterInletTempC: number;   // HWT (°C)
  coldWaterOutletTempC: number; // CWT (°C)
  ambientWetBulbC: number;      // WBT (°C)
  ambientDryBulbC: number;      // DBT (°C)

  // Fan & Auxiliary Power
  fanMotorKW: number;           // Measured fan input kW
  fanAirflowCfm: number;        // Measured air flow CFM (optional)
  cyclesOfConcentration: number;// Typically 4.0 - 6.0
}

export interface CoolingTowerTestResults {
  rangeC: number;               // HWT - CWT
  approachC: number;            // CWT - WBT
  effectivenessPercent: number; // Range / (Range + Approach) * 100%
  heatRejectedKW: number;
  heatRejectedTR: number;
  fanSpecificPowerKWPerTR: number;

  // Water Balance
  evaporationRateLpm: number;   // Water loss via evaporation (LPM)
  evaporationRateM3H: number;
  evaporationPercentOfFlow: number;
  driftLossLpm: number;         // ~0.02% to 0.005% of flow
  blowdownRateLpm: number;      // E / (CoC - 1)
  blowdownRateM3H: number;
  totalMakeupWaterLpm: number;  // Evaporation + Drift + Blowdown
  totalMakeupWaterM3H: number;

  // Tower Performance Diagnostic
  liquidToGasRatio: number;     // L/G ratio
  towerHealthStatus: 'excellent' | 'normal' | 'caution' | 'critical';
  healthVerdict: string;
  diagnostics: string[];
}

export interface AhuTestInputs {
  ahuTag: string;
  fanType: AhuFanType;
  designAirflowCfm: number;

  // Airflow & Static Pressures
  measuredAirflowCfm: number;   // Measured Supply Airflow CFM
  supplyAirflowM3H: number;
  externalStaticPressurePa: number; // ESP (Pa)
  fanTotalPressurePa: number;       // TSP (Pa)

  // Air Conditions (Psychrometrics)
  enteringAirDbtC: number;      // Mixed/Entering air Dry Bulb (°C)
  enteringAirRhPercent: number; // Entering air Relative Humidity (%)
  leavingAirDbtC: number;       // Off-Coil Supply Dry Bulb (°C)
  leavingAirRhPercent: number;  // Off-Coil Supply Relative Humidity (%)

  // Waterside (Chilled Water Coil)
  chwInletTempC: number;        // Coil Water Entering (°C)
  chwOutletTempC: number;       // Coil Water Leaving (°C)
  chwFlowLpm: number;           // Coil CHW Flow (LPM)

  // Fan Power & Filters
  fanInputKW: number;           // Measured electric power kW
  filterPressureDropPa: number; // Differential pressure across filter (Pa)
  cleanFilterDpPa: number;      // Benchmark clean DP (Pa)
}

export interface AhuTestResults {
  // Airside Psychrometric Capacities
  enteringEnthalpyKjKg: number;
  leavingEnthalpyKjKg: number;
  airDensityKgM3: number;
  airsideTotalCapacityKW: number;
  airsideTotalCapacityTR: number;
  airsideSensibleCapacityKW: number;
  airsideLatentCapacityKW: number;
  sensibleHeatRatio: number;    // SHR = Q_sensible / Q_total
  supplyAirCfmActual: number;

  // Waterside Capacity & Heat Balance
  chwDeltaTC: number;
  watersideCapacityKW: number;
  watersideCapacityTR: number;
  heatBalanceErrorPercent: number; // |Q_air - Q_water| / Q_water * 100%
  heatBalanceStatus: 'balanced' | 'acceptable' | 'discrepancy';

  // Coil Efficiency & Characteristics
  coilApparatusDewPointC: number; // ADP (°C)
  coilBypassFactor: number;       // BF (0.05 - 0.20)
  coilContactFactor: number;      // CF = 1 - BF

  // Fan Performance & Green Standard
  specificFanPowerWPerLps: number; // W / (L/s)
  specificFanPowerKWPerM3s: number;// kW / (m3/s)
  sfpClassification: 'SFP-1' | 'SFP-2' | 'SFP-3' | 'SFP-4' | 'SFP-5' | 'SFP-6' | 'SFP-7';
  fanStaticEfficiencyPercent: number;
  filterStatus: 'clean' | 'acceptable' | 'dirty_replace';
  diagnostics: string[];
}

export interface IntegratedPlantResults {
  totalChillerTR: number;
  totalChillerPowerKW: number;
  totalCoolingTowerPowerKW: number;
  totalChwPumpsPowerKW: number;
  totalCwPumpsPowerKW: number;
  totalAhuPowerKW: number;
  totalPlantPowerKW: number;
  overallPlantKWPerTR: number;
  overallPlantCop: number;
  plantRating: 'world_class' | 'efficient' | 'standard' | 'inefficient';
  annualEnergyCostIDR: number;
}
