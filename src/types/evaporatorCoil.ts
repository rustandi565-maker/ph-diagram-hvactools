import { ExtendedRefrigerantId } from './phDiagram';

export type CoilCalculationMode = 'direct_capacity' | 'continuous_flow' | 'batch_tank';

export type CoilGeometryType = 'helical_cylinder' | 'pancake_flat' | 'trombone_bundle';

export type PipeMaterialType = 'copper_plain' | 'copper_finned' | 'ss304' | 'ss316l' | 'titanium';

export type WaterConvectionRegime = 
  | 'static_natural'      // Tangki air diam tanpa agitator
  | 'gentle_agitation'    // Agitator putaran rendah / sirkulasi santai
  | 'vigorous_agitation'  // Agitator turbulen / pompa sirkulasi kencang
  | 'forced_shell_coil';  // Convector tertutup / aliran paksa dalam selongsong

export interface PipeDimensionSpec {
  nominalInch: string;
  odMm: number;
  idMm: number;
  wallThicknessMm: number;
  maxRecommendedCircuitLengthM: number;
  weightKgPerMeterCopper: number;
  surfaceAreaPerMeterM2: number; // Pi * OD
  internalVolumePerMeterLiters: number;
}

export interface EvaporatorCoilInputs {
  // Mode selection
  calculationMode: CoilCalculationMode;
  
  // Direct Capacity Inputs
  coolingCapacityKw: number;

  // Continuous Water Flow Inputs
  waterFlowRateLpm: number;      // Liters per minute
  waterInletTempC: number;       // e.g. 15°C
  waterOutletTempC: number;      // e.g. 5°C
  
  // Batch Tank Inputs
  batchWaterVolumeLiters: number; // e.g. 1000 L
  batchInitialTempC: number;      // e.g. 28°C
  batchTargetTempC: number;       // e.g. 4°C
  batchCoolingTimeHours: number;  // e.g. 2 hours
  tankAmbientLossFactorPct: number; // e.g. 10%
  
  // Refrigeration & Evaporator Settings
  refrigerantId: ExtendedRefrigerantId;
  evaporatingTempC: number;      // e.g. -2°C to 2°C (typically 4-6K below outlet water)
  superheatK: number;            // e.g. 5K
  
  // Convection & Heat Transfer
  convectionRegime: WaterConvectionRegime;
  customUValue?: number;         // Optional override (W/m²·K)
  foulingSafetyFactorPct: number; // e.g. 15% safety margin
  
  // Pipe Selection
  pipeMaterial: PipeMaterialType;
  pipeNominalInch: string;       // e.g. '1/2"'
  
  // Fabrication / Physical Geometry Settings
  coilGeometry: CoilGeometryType;
  coilDiameterMm: number;        // Diameter gulungan spiral (e.g. 400 mm)
  coilPitchMm: number;           // Jarak antar lilitan pipa (e.g. 25 mm)
  finMultiplierArea?: number;    // Multiplier for finned tube (default 3.8x)
}

export interface EvaporatorCoilCalculationResult {
  // Thermal results
  effectiveCoolingLoadKw: number;
  effectiveCoolingLoadBtuHr: number;
  effectiveCoolingLoadTr: number;
  effectiveCoolingLoadHp: number;
  
  // Temperature differences
  lmtdC: number;
  deltaTIn: number;
  deltaTOut: number;
  uValueWm2K: number;
  thermalConductivityKm: number;
  
  // Surface Area & Pipe Length
  requiredHeatTransferAreaM2: number;
  fouledHeatTransferAreaM2: number;
  nominalPipeSpec: PipeDimensionSpec;
  
  // Pipe Lengths
  totalPipeLengthMeters: number;
  finnedEquivalentLengthMeters?: number;
  
  // Circuiting & Pressure Drop Distribution
  recommendedCircuits: number;
  lengthPerCircuitMeters: number;
  distributorInletSpec: string;
  refrigerantMassFlowKgS: number;
  refrigerantVolumetricFlowM3H: number;
  estimatedRefrigerantVelocityMs: number;
  circuitPressureDropStatus: 'Optimal' | 'Aman' | 'Terlalu Panjang (Waspada Penurunan Tekanan)';
  
  // Physical Coil Fabrication Output
  coilTurnsCount: number;
  coilHeightMm: number;
  coilWeightKg: number;
  internalRefrigerantVolumeLiters: number;
  convectorTankSuggestedVolumeLiters: number;
  
  // Material Specification Details
  materialName: string;
  materialStandard: string;
  corrosionSuitability: string;
  bendingRecommendations: string;
  
  // Step-by-step logs for verification
  calculationSteps: {
    title: string;
    formula: string;
    value: string;
    explanation: string;
  }[];
}
