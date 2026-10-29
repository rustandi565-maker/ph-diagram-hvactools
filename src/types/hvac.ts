export type UnitSystem = 'metric' | 'imperial';

export interface RoomPreset {
  id: string;
  name: string;
  length: number; // in meters
  width: number;  // in meters
  height: number; // in meters
  roomType: RoomType;
  sunExposure: SunExposure;
  occupants: number;
  equipmentWattage: number;
  windowType: WindowType;
  insulationQuality: InsulationQuality;
  description: string;
}

export type RoomType = 
  | 'bedroom' 
  | 'living_room' 
  | 'office' 
  | 'classroom' 
  | 'restaurant' 
  | 'server_room' 
  | 'gym' 
  | 'retail';

export type SunExposure = 
  | 'sheltered' 
  | 'morning_east' 
  | 'afternoon_west' 
  | 'top_floor_roof';

export type WindowType = 
  | 'minimal' 
  | 'standard' 
  | 'large_glass' 
  | 'full_curtain_wall';

export type InsulationQuality = 
  | 'excellent' 
  | 'standard' 
  | 'poor';

export interface CoolingLoadResult {
  floorArea: number; // m2 or sq ft
  volume: number; // m3 or cu ft
  baseAreaBTU: number;
  sunBTU: number;
  occupantBTU: number;
  equipmentBTU: number;
  windowBTU: number;
  totalBTU: number;
  tonnageTR: number;
  kilowatt: number;
  pkRecommendation: {
    nominalPK: number;
    labelPK: string;
    description: string;
    unitCount: number;
    systemType: string;
  };
  estPowerWatts: {
    standard: number;
    inverter: number;
  };
  estMonthlyCostIDR: {
    standard: number;
    inverter: number;
  };
}

export interface VentilationResult {
  roomVolume: number;
  ach: number;
  cfm: number;
  cmh: number; // m3/h
  litersPerSecond: number;
  recommendedFanSize: string;
}

export interface DuctSizingResult {
  cfm: number;
  velocityFpm: number;
  ductAreaSqIn: number;
  ductAreaSqM: number;
  circularDiameterInches: number;
  circularDiameterMm: number;
  rectangularOptions: Array<{
    widthInches: number;
    heightInches: number;
    widthMm: number;
    heightMm: number;
    aspectRatio: number;
    isIdeal: boolean;
  }>;
  frictionLossInWgPer100Ft: number;
  frictionLossPaPerMeter: number;
}

export interface PsychrometricResult {
  dryBulbC: number;
  relativeHumidity: number;
  dewPointC: number;
  wetBulbC: number;
  enthalpyKjKg: number;
  humidityRatioGKg: number;
  vaporPressureKPa: number;
  comfortStatus: {
    label: string;
    category: 'comfortable' | 'warm_humid' | 'hot' | 'cool' | 'cold_dry';
    description: string;
  };
}
