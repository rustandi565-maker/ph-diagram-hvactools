import { ExtendedRefrigerantId } from './phDiagram';

export type ColdRoomApplication =
  | 'beef_meat'          // Daging Sapi & Kambing
  | 'poultry'            // Daging Ayam / Unggas
  | 'fish_seafood'        // Ikan Laut & Seafood
  | 'fruits_vegetables'  // Buah & Sayuran Segar (Respirasi aktif)
  | 'dairy_milk'         // Susu, Keju & Olahan Susu
  | 'ice_cream'          // Es Krim (Suhu Sangat Rendah -25°C)
  | 'frozen_food'        // Makanan Beku Olahan / Nugget / Sosis
  | 'medical_vaccine'    // Vaksin, Obat & Farmasi (+2°C s/d +8°C)
  | 'pharmaceutical_sub' // Plasma Darah & Enzim Beku (-20°C s/d -40°C)
  | 'flowers_florist'    // Bunga Segar Potong (+4°C s/d +8°C)
  | 'bakery_dough'       // Adonan Roti & Pastry Beku (-18°C)
  | 'blast_freezer';     // Blast Freezing Cepat (Daging/Ikan beku dalam 8-12 jam)

export interface ColdRoomRefrigerantAnalysis {
  refrigerantId: ExtendedRefrigerantId;
  name: string;
  category: string;
  formula: string;
  safetyClass: string;
  gwp: number;
  odp: number;
  evaporatingTempC: number;
  condensingTempC: number;
  suctionPressureBarGauge: number;
  suctionPressurePsig: number;
  dischargePressureBarGauge: number;
  dischargePressurePsig: number;
  compressionRatio: number;
  compressionRatioStatus: 'Optimal' | 'Moderat' | 'Tinggi (Perlu Penanganan Khusus)';
  specificRefrigerationEffectKjKg: number;
  massFlowRateKgH: number;
  massFlowRateKgMin: number;
  estimatedChargeKg: number;
  recommendedLiquidLineInch: string;
  recommendedSuctionLineInch: string;
  recommendedDischargeLineInch: string;
  recommendedExpansionValve: string;
  recommendedReceiverVolumeLiters: number;
  recommendedFilterDrier: string;
  recommendedSightGlass: string;
  recommendedSolenoidValve: string;
  recommendedOilSeparator: string;
  recommendedSuctionAccumulator: string;
  condenserHeatRejectionKw: number;
  condenserHeatRejectionBtuH: number;
  compressorWorkEstimateKw: number;
  dischargeTempEstimateC: number;
  recommendedOilType: string;
  typicalApplicationNote: string;
}

export interface ProductThermalProfile {
  id: ColdRoomApplication;
  name: string;
  category: 'Chiller (+2°C s/d +8°C)' | 'Freezer (-18°C s/d -25°C)' | 'Deep/Blast (-35°C s/d -40°C)' | 'Khusus Farmasi';
  targetRoomTempC: number;
  typicalEnteringTempC: number;
  freezingPointC: number;
  cpAboveFreezing: number; // kJ/kg·K
  latentHeatFreezing: number; // kJ/kg
  cpBelowFreezing: number; // kJ/kg·K
  hasRespirationHeat: boolean;
  respirationHeatWattsPerTon: number;
  targetHumidityRhPercent: number;
  recommendedFinSpacingMm: number; // Evaporator fin spacing
  description: string;
}

export type PanelInsulationType =
  | 'pu_sandwich_50'   // 50mm Polyurethane (Chiller ringan)
  | 'pu_sandwich_75'   // 75mm PU (Chiller standar)
  | 'pu_sandwich_100'  // 100mm PU (Freezer standar)
  | 'pu_sandwich_125'  // 125mm PU (Freezer berat)
  | 'pu_sandwich_150'  // 150mm PU (Deep freezer -30°C)
  | 'pu_sandwich_200'  // 200mm PU (Blast freezer -40°C)
  | 'pir_sandwich_100' // 100mm PIR (Fire retardant)
  | 'eps_polystyrene'; // EPS Styrofoam 100mm (Ekonomis)

export interface PanelSpecs {
  id: PanelInsulationType;
  name: string;
  thicknessMm: number;
  kValue: number; // W/m·K
  uValue: number; // W/m²·K
  suitableFor: string;
}

export interface ColdRoomCalculationResult {
  // Dimensions & Envelope
  internalVolumeM3: number;
  internalFloorAreaM2: number;
  totalEnvelopeAreaM2: number;

  // Daily Heat Loads (kJ/day & kWh/day)
  transmissionLoadKjDay: number;
  productSensibleAboveKjDay: number;
  productLatentFreezingKjDay: number;
  productSensibleBelowKjDay: number;
  productRespirationKjDay: number;
  totalProductLoadKjDay: number;

  airInfiltrationLoadKjDay: number;
  occupantLoadKjDay: number;
  lightingLoadKjDay: number;
  fanMotorLoadKjDay: number;
  defrostLoadKjDay: number;
  totalInternalLoadKjDay: number;

  subtotalHeatLoadKjDay: number;
  safetyFactorPercent: number;
  totalHeatLoadKjDay: number;
  totalHeatLoadKwhDay: number;

  // Required Equipment Capacities
  compressorRunHoursPerDay: number;
  requiredRefrigerationKw: number; // kW thermal
  requiredRefrigerationBtuH: number; // BTU/h
  requiredRefrigerationTr: number; // Tons of Refrigeration
  recommendedCondensingUnitHp: number; // Compressor HP / PK
  recommendedCompressorType: string;

  // Evaporator specs
  evaporatorAirflowCmh: number;
  evaporatorAirflowCfm: number;
  recommendedFinSpacingMm: number;
  defrostType: 'Electric Defrost' | 'Air Defrost (Off Cycle)' | 'Hot Gas Defrost';

  // Refrigerant
  recommendedRefrigerants: string[];
  refrigerantAnalysis: ColdRoomRefrigerantAnalysis;

  // Percentage Breakdown for visual bar
  loadBreakdownPercentages: {
    transmission: number;
    product: number;
    infiltration: number;
    internal: number;
    defrost: number;
  };
}
