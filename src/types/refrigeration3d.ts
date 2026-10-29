export type PhPointId = 'point1' | 'point2' | 'point3' | 'point4' | 'point5';

export interface PhMeasurementPoint {
  id: PhPointId;
  name: string;
  tag: string;
  location: string;
  pressureBar: number;
  temperatureC: number;
  enthalpyKjKg: number;
  stateDescription: string;
  phase: 'superheated_vapor' | 'discharge_gas' | 'subcooled_liquid' | 'two_phase_mixture' | 'evaporated_vapor';
  color: string;
  importance: string;
  position3D: [number, number, number]; // [x, y, z] in 3D scene
}

export type CameraPreset = 'overview' | 'compressor' | 'condenser' | 'txv_filter' | 'evaporator' | 'top_down';

export type SuperheatLevel = 'high' | 'normal' | 'low';

export type SchematicComponentId =
  | 'compressor'
  | 'oil_separator'
  | 'condenser'
  | 'condenser_fan'
  | 'liquid_receiver'
  | 'filter_drier'
  | 'solenoid_valve'
  | 'sight_glass'
  | 'txv'
  | 'sensing_bulb'
  | 'evaporator'
  | 'evaporator_fan'
  | 'suction_accumulator'
  | 'gauges'
  | 'point1'
  | 'point2'
  | 'point3'
  | 'point4'
  | 'point5';

export interface ComponentExplanation {
  id: SchematicComponentId;
  name: string;
  category: string;
  tag: string;
  phPointLink?: string;
  role: string;
  workingPrinciple: string;
  operationalParameters: string;
  troubleshootingTips: string[];
}

export interface SimulationParams {
  isRunning: boolean;
  simSpeed: number; // 0.25, 0.5, 1, 1.5, 2
  compressorRpm: number; // 0 - 1800
  condenserFanRpm: number; // 0 - 1500
  evaporatorFanRpm: number; // 0 - 1400
  refrigerant: 'R134a' | 'R404A' | 'R410A' | 'R22' | 'R32' | 'R448A';
  isCutawayMode: boolean; // Show cutaway transparent compressor body
  showPipingFlow: boolean;
  showAirflowVectors: boolean;
  showMeasurementLabels: boolean;
  selectedPoint: PhPointId | null;
  cameraPreset: CameraPreset;
  superheatLevel: SuperheatLevel;
  hasRefrigerantShortage: boolean;
  isDefrostActive: boolean;
  viewMode: 'schematic' | 'threejs';
}

export interface DynamicCycleState {
  suctionPressureBar: number;
  dischargePressureBar: number;
  suctionTempC: number;
  dischargeTempC: number;
  liquidTempC: number;
  evapTempC: number;
  condTempC: number;
  superheatK: number;
  subcoolingK: number;
  cop: number;
  eer: number;
  massFlowKgS: number;
  massFlowLpm: number;
  statusAlert: {
    level: 'normal' | 'warning' | 'critical';
    message: string;
    advice: string;
  } | null;
}
