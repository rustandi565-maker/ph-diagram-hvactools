import { DynamicCycleState, PhMeasurementPoint } from '../types/refrigeration3d';

/**
 * Kinematic calculations for Reciprocating Compressor (Slider-Crank mechanism)
 * r = crank radius (e.g. 0.45 units)
 * L = connecting rod length (e.g. 1.35 units)
 */
export interface ReciprocatingKinematics {
  crankAngleRad: number;
  crankAngleDeg: number;
  pistonDisplacementY: number; // Distance from crankshaft center
  pistonNormalizedStroke: number; // 0 = BDC (Bottom Dead Center), 1 = TDC (Top Dead Center)
  conrodAngleRad: number; // Swivel angle of the connecting rod
  conrodPivotX: number; // Lateral offset of crankpin
  conrodPivotY: number; // Vertical offset of crankpin
  suctionValveLift: number; // 0 = closed, 1 = fully open
  dischargeValveLift: number; // 0 = closed, 1 = fully open
  cylinderPressureBar: number;
  strokePhase: 'suction' | 'compression' | 'discharge' | 'expansion';
}

export function computeReciprocatingKinematics(
  crankAngleRad: number,
  suctionPressureBar: number,
  dischargePressureBar: number,
  crankRadius: number = 0.45,
  conrodLength: number = 1.35
): ReciprocatingKinematics {
  // Normalize theta to [0, 2*PI)
  const theta = ((crankAngleRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const thetaDeg = (theta * 180) / Math.PI;

  // Crankpin coordinates (assuming crank rotates in XY plane about (0,0,0))
  // At theta = 0, crankpin is at top (0, r) -> TDC
  // At theta = PI, crankpin is at bottom (0, -r) -> BDC
  const crankpinX = crankRadius * Math.sin(theta);
  const crankpinY = crankRadius * Math.cos(theta);

  // Exact kinematic solution for slider displacement y from crank center:
  // y = r * cos(theta) + sqrt(L^2 - (r * sin(theta))^2)
  const sinTheta = Math.sin(theta);
  const sqrtTerm = Math.sqrt(Math.max(0.0001, conrodLength * conrodLength - crankRadius * crankRadius * sinTheta * sinTheta));
  const pistonDisplacementY = crankRadius * Math.cos(theta) + sqrtTerm;

  // Stroke limits
  const tdcY = conrodLength + crankRadius;
  const bdcY = conrodLength - crankRadius;
  const stroke = 2 * crankRadius;
  const normalizedStroke = Math.max(0, Math.min(1, (pistonDisplacementY - bdcY) / stroke));

  // Connecting rod tilt angle beta: sin(beta) = (r / L) * sin(theta)
  const conrodAngleRad = Math.asin(Math.max(-1, Math.min(1, (crankRadius / conrodLength) * sinTheta)));

  // Valve dynamics:
  // Downstroke (Intake / Suction): theta from 0 to PI.
  // Piston moves downwards away from cylinder head. Cylinder pressure drops -> Suction valve opens!
  let suctionValveLift = 0;
  let dischargeValveLift = 0;
  let cylinderPressureBar = suctionPressureBar;
  let strokePhase: 'suction' | 'compression' | 'discharge' | 'expansion' = 'suction';

  if (theta >= 0 && theta < Math.PI) {
    // Intake stroke
    strokePhase = 'suction';
    // Smooth bell curve opening during downstroke
    const progress = theta / Math.PI;
    suctionValveLift = Math.sin(progress * Math.PI); // peak at middle of downstroke
    dischargeValveLift = 0;
    cylinderPressureBar = Math.max(0.5, suctionPressureBar * (1 - 0.08 * suctionValveLift));
  } else {
    // Upstroke (Compression and Discharge): theta from PI to 2*PI
    const progress = (theta - Math.PI) / Math.PI; // 0 to 1
    suctionValveLift = 0;

    // Polytropic compression: Pc = Ps * (V_bdc / V)^n
    // Volume roughly proportional to (1.1 - normalizedStroke)
    const compressionRatio = dischargePressureBar / Math.max(0.5, suctionPressureBar);
    const estP = suctionPressureBar * Math.pow(1 + normalizedStroke * 1.5, 1.25);

    if (estP >= dischargePressureBar || progress > 0.75) {
      // Discharge phase near TDC
      strokePhase = 'discharge';
      cylinderPressureBar = dischargePressureBar * 1.05;
      // Discharge valve flapper opens
      dischargeValveLift = Math.sin(Math.max(0, (progress - 0.75) / 0.25) * Math.PI);
    } else {
      // Pure compression
      strokePhase = 'compression';
      cylinderPressureBar = Math.min(dischargePressureBar, estP);
      dischargeValveLift = 0;
    }
  }

  return {
    crankAngleRad: theta,
    crankAngleDeg: Math.round(thetaDeg),
    pistonDisplacementY,
    pistonNormalizedStroke: normalizedStroke,
    conrodAngleRad,
    conrodPivotX: crankpinX,
    conrodPivotY: crankpinY,
    suctionValveLift,
    dischargeValveLift,
    cylinderPressureBar: Math.round(cylinderPressureBar * 100) / 100,
    strokePhase,
  };
}

/**
 * Calculates dynamic cycle response when user alters:
 * - Condenser Fan RPM (nominal ~1100 RPM)
 * - Evaporator Fan RPM (nominal ~1000 RPM)
 * - Compressor RPM (nominal ~1450 RPM)
 */
export function calculateDynamicCycleFromFans(
  compressorRpm: number,
  condenserFanRpm: number,
  evaporatorFanRpm: number,
  refrigerant: string = 'R134a'
): DynamicCycleState {
  // Baseline nominal parameters for R134a
  const nominalCompRpm = 1450;
  const nominalCondRpm = 1100;
  const nominalEvapRpm = 1000;

  // Normalized fan factors (0 to ~1.4)
  const condFactor = Math.max(0.05, condenserFanRpm / nominalCondRpm);
  const evapFactor = Math.max(0.05, evaporatorFanRpm / nominalEvapRpm);
  const compFactor = Math.max(0.0, compressorRpm / nominalCompRpm);

  // If compressor is stopped
  if (compressorRpm <= 0) {
    const staticEquilibriumPress = 5.0; // Bar static equalization
    return {
      suctionPressureBar: staticEquilibriumPress,
      dischargePressureBar: staticEquilibriumPress,
      suctionTempC: 25.0,
      dischargeTempC: 25.0,
      liquidTempC: 25.0,
      evapTempC: 25.0,
      condTempC: 25.0,
      superheatK: 0,
      subcoolingK: 0,
      cop: 0,
      eer: 0,
      massFlowKgS: 0,
      massFlowLpm: 0,
      statusAlert: {
        level: 'normal',
        message: 'Kompresor Berhenti (Standby). Tekanan seimbang pada 5.0 bar.',
        advice: 'Tekan tombol RUN untuk menyalakan kompresor dan memulai siklus refrigerasi.',
      },
    };
  }

  // 1. CONDENSER BEHAVIOR:
  // Low condenser fan speed -> High condensing temperature & surging discharge pressure
  // High condenser fan speed -> Efficient heat rejection, low condensing temp, high subcooling
  const deltaCondTemp = (1.0 - condFactor) * 22.0; // Up to +22°C when fan is stopped!
  const baseCondTemp = 40.0;
  const condTempC = Math.max(28.0, Math.min(65.0, baseCondTemp + deltaCondTemp));

  // Saturation pressure approximation for R134a around condTempC: P = 10^(A - B/(T+C))
  // At 40°C = ~10.16 bar, at 55°C = ~14.9 bar, at 30°C = ~7.7 bar
  const dischargePressureBar = Math.max(
    6.5,
    Math.min(22.0, 10.16 + (condTempC - 40.0) * 0.32 + (compFactor - 1.0) * 1.2)
  );

  // Subcooling depends directly on condenser airflow
  const subcoolingK = Math.max(0.5, Math.min(9.0, 5.0 * condFactor));
  const liquidTempC = Math.round((condTempC - subcoolingK) * 10) / 10;

  // 2. EVAPORATOR BEHAVIOR:
  // Low evaporator fan speed -> Insufficient heat load absorption, evaporating temp plummets
  // High evaporator fan speed -> Normal heat load, stable evaporating temp
  const deltaEvapTemp = (evapFactor - 1.0) * 12.0;
  const baseEvapTemp = -5.0;
  const evapTempC = Math.max(-25.0, Math.min(8.0, baseEvapTemp + deltaEvapTemp - (compFactor - 1.0) * 3.0));

  // Suction pressure approximation for R134a around evapTempC:
  // At -5°C = ~2.44 bar, at 0°C = ~2.93 bar, at -15°C = ~1.64 bar
  const suctionPressureBar = Math.max(
    1.1,
    Math.min(4.5, 2.44 + (evapTempC - (-5.0)) * 0.10)
  );

  // Superheat: with low airflow, liquid may not fully evaporate, superheat drops dangerously
  const superheatK = Math.max(1.0, Math.min(18.0, 8.0 * evapFactor));
  const suctionTempC = Math.round((evapTempC + superheatK) * 10) / 10;

  // Discharge temp T2: Depends on compression ratio & suction temp
  const compressionRatio = dischargePressureBar / suctionPressureBar;
  const dischargeTempC = Math.round((suctionTempC + 273.15) * Math.pow(compressionRatio, 0.23) - 273.15 + 15.0);

  // Enthalpies approximate (kJ/kg):
  // h1: suction vapor ~ 400 + 0.9 * suctionTempC
  const h1 = 398.0 + 0.85 * suctionTempC;
  // h2: discharge gas ~ 425 + 0.95 * (dischargeTempC - 40)
  const h2 = 425.0 + 0.95 * Math.max(0, dischargeTempC - 40.0);
  // h3: subcooled liquid ~ 256 - 1.4 * (40 - liquidTempC)
  const h3 = 256.0 - 1.35 * (40.0 - liquidTempC);
  // h4 = h3 (isenthalpic expansion)
  const h4 = h3;

  const qEvap = Math.max(10, h1 - h4); // Refrigeration effect kJ/kg
  const wComp = Math.max(15, h2 - h1); // Work of compression kJ/kg

  const cop = Math.round((qEvap / wComp) * 100) / 100;
  const eer = Math.round(cop * 3.41214 * 100) / 100;

  // Mass flow rate proportional to compressor RPM and suction vapor density
  const baseMassFlow = 0.045; // kg/s
  const massFlowKgS = Math.round(baseMassFlow * compFactor * (suctionPressureBar / 2.5) * 1000) / 1000;
  // Liquid specific volume at ~35°C is approx 0.00085 m³/kg = 0.85 dm³/kg
  // LPM = kg/s * 0.85 * 60
  const massFlowLpm = Math.round(massFlowKgS * 0.85 * 60 * 100) / 100;

  // Diagnostic warnings based on abnormal fan speeds
  let statusAlert: DynamicCycleState['statusAlert'] = null;

  if (condenserFanRpm < 350) {
    statusAlert = {
      level: 'critical',
      message: 'PERINGATAN: Head Pressure Terlalu Tinggi! Fan Kondenser Lemah / Mati.',
      advice: 'Naikkan kecepatan Fan Kondenser agar panas kondensasi dapat dibuang, mencegah tripping overload kompresor.',
    };
  } else if (evaporatorFanRpm < 300) {
    statusAlert = {
      level: 'warning',
      message: 'PERINGATAN: Suction Pressure Anjlok & Risiko Bunga Es (Frosting) pada Evaporator!',
      advice: 'Tingkatkan Fan Evaporator untuk memaksimalkan penyerapan kalor udara ruangan dan mencegah liquid slugging.',
    };
  } else if (cop < 2.2) {
    statusAlert = {
      level: 'warning',
      message: 'Efisiensi Siklus Rendah (COP < 2.2). Perbedaan temperatur kondensasi dan evaporasi terlalu lebar.',
      advice: 'Optimalkan putaran kedua fan untuk menstabilkan temperatur kerja ideal.',
    };
  }

  return {
    suctionPressureBar: Math.round(suctionPressureBar * 100) / 100,
    dischargePressureBar: Math.round(dischargePressureBar * 100) / 100,
    suctionTempC,
    dischargeTempC,
    liquidTempC,
    evapTempC: Math.round(evapTempC * 10) / 10,
    condTempC: Math.round(condTempC * 10) / 10,
    superheatK: Math.round(superheatK * 10) / 10,
    subcoolingK: Math.round(subcoolingK * 10) / 10,
    cop,
    eer,
    massFlowKgS,
    massFlowLpm,
    statusAlert,
  };
}

/**
 * Builds the 5 P-H diagram measurement points with 3D scene coordinates and engineering metadata
 */
export function getPhMeasurementPoints(
  cycleState: DynamicCycleState,
  language: string = 'id'
): PhMeasurementPoint[] {
  const isId = language === 'id' || language === 'jv' || language === 'su';

  return [
    {
      id: 'point1',
      name: isId ? 'Point 1: Suction / Masuk Kompresor' : 'Point 1: Suction Inlet to Compressor',
      tag: 'P1 (LP & T1)',
      location: isId ? 'Pipa Hisap Kompresor (Manometer LP)' : 'Suction Line (LP Gauge)',
      pressureBar: cycleState.suctionPressureBar,
      temperatureC: cycleState.suctionTempC,
      enthalpyKjKg: 398.0 + 0.85 * cycleState.suctionTempC,
      phase: 'superheated_vapor',
      stateDescription: isId ? 'Uap Superheat (Gas Panas Lanjut Rendah)' : 'Superheated Vapor',
      color: '#38bdf8', // Light sky blue
      importance: isId
        ? `Titik awal kompresi pada Diagram P-H. Uap superheat (${cycleState.superheatK} K) memastikan cairan tidak merusak piston.`
        : `Start of compression on P-H diagram. Superheated vapor (${cycleState.superheatK} K) prevents liquid slugging.`,
      position3D: [-1.1, 1.85, 0.0], // Position near compressor suction inlet
    },
    {
      id: 'point2',
      name: isId ? 'Point 2: Discharge / Keluar Kompresor' : 'Point 2: Discharge Outlet from Compressor',
      tag: 'P2 (HP & T2)',
      location: isId ? 'Pipa Buang Kompresor (Manometer HP)' : 'Discharge Line (HP Gauge)',
      pressureBar: cycleState.dischargePressureBar,
      temperatureC: cycleState.dischargeTempC,
      enthalpyKjKg: 425.0 + 0.95 * Math.max(0, cycleState.dischargeTempC - 40.0),
      phase: 'discharge_gas',
      stateDescription: isId ? 'Gas Buang Panas Bertekanan Tinggi (Superheated Discharge)' : 'High Pressure Superheated Gas',
      color: '#ef4444', // Hot red
      importance: isId
        ? `Titik puncak tekanan & temperatur kerja kompresor. Gas panas bertekanan tinggi didorong menuju kondenser.`
        : `Peak pressure and temperature point. High-pressure hot discharge gas pushed to the condenser.`,
      position3D: [1.1, 1.85, 0.0], // Position near compressor discharge outlet
    },
    {
      id: 'point3',
      name: isId ? 'Point 3: Cairan Liquid Masuk TXV' : 'Point 3: Subcooled Liquid Entering TXV',
      tag: 'P3 (HP & T3)',
      location: isId ? 'Outlet Kondenser / Liquid Line' : 'Condenser Outlet / Liquid Line',
      pressureBar: cycleState.dischargePressureBar,
      temperatureC: cycleState.liquidTempC,
      enthalpyKjKg: 256.0 - 1.35 * (40.0 - cycleState.liquidTempC),
      phase: 'subcooled_liquid',
      stateDescription: isId ? 'Cairan Subcooled Dingin Lanjut' : 'Subcooled Liquid',
      color: '#2563eb', // Deep royal blue
      importance: isId
        ? `Perpotongan garis Discharge Pressure dan Temperatur Liquid T3. Menentukan nilai subcooling (${cycleState.subcoolingK} K).`
        : `Intersection of Discharge Pressure and Liquid Temp T3. Defines cycle subcooling (${cycleState.subcoolingK} K).`,
      position3D: [1.4, -1.85, 0.0], // Position on liquid line entering TXV
    },
    {
      id: 'point4',
      name: isId ? 'Point 4: Ekspansi Keluar TXV' : 'Point 4: Expansion Mixture Leaving TXV',
      tag: 'P4 (LP & T4)',
      location: isId ? 'Outlet TXV / Masuk Evaporator' : 'TXV Outlet / Evaporator Inlet',
      pressureBar: cycleState.suctionPressureBar,
      temperatureC: cycleState.evapTempC,
      enthalpyKjKg: 256.0 - 1.35 * (40.0 - cycleState.liquidTempC), // Isenthalpic: h4 = h3
      phase: 'two_phase_mixture',
      stateDescription: isId ? 'Campuran 2 Fase (Uap Flash & Cair Dingin)' : 'Two-Phase Mixture (Flash Gas & Liquid)',
      color: '#06b6d4', // Cyan
      importance: isId
        ? `Ekspansi isentalpi (h4 = h3). Tekanan turun drastis menghasilkan campuran 2 fase dingin (~20% uap flash + 80% cair).`
        : `Isenthalpic expansion (h4 = h3). High pressure drops to evaporating pressure, flashing into 2-phase mixture.`,
      position3D: [-1.2, -1.85, 0.0], // Position near TXV outlet
    },
    {
      id: 'point5',
      name: isId ? 'Point 5: Outlet Evaporator (Sensing Bulb)' : 'Point 5: Evaporator Outlet (Sensing Bulb)',
      tag: 'P5 (T5 Superheat)',
      location: isId ? 'Header Keluar Evaporator (Posisi Sensing Bulb TXV)' : 'Evaporator Outlet Header (TXV Bulb Location)',
      pressureBar: cycleState.suctionPressureBar,
      temperatureC: cycleState.suctionTempC - 0.5,
      enthalpyKjKg: 395.0 + 0.85 * cycleState.suctionTempC,
      phase: 'evaporated_vapor',
      stateDescription: isId ? 'Uap Jenuh Menuju Superheat' : 'Evaporated Saturated Vapor',
      color: '#0284c7', // Sky blue
      importance: isId
        ? `Tempat sensing bulb TXV membaca temperatur untuk mengatur bukaan jarum katup ekspansi secara proporsional.`
        : `Location of TXV sensing bulb regulating valve orifice based on suction superheat.`,
      position3D: [-2.2, 0.85, 0.0], // Position at evaporator top outlet
    },
  ];
}
