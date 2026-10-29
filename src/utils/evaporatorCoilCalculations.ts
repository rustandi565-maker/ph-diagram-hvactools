import {
  CoilCalculationMode,
  CoilGeometryType,
  EvaporatorCoilCalculationResult,
  EvaporatorCoilInputs,
  PipeDimensionSpec,
  PipeMaterialType,
  WaterConvectionRegime,
} from '../types/evaporatorCoil';

// Database of standard refrigeration copper tubes (ASTM B280 / ASTM B88 Type L / EN 12735)
export const STANDARD_PIPE_DIMENSIONS: Record<string, PipeDimensionSpec> = {
  '1/4"': {
    nominalInch: '1/4"',
    odMm: 6.35,
    idMm: 4.83,
    wallThicknessMm: 0.76,
    maxRecommendedCircuitLengthM: 12,
    weightKgPerMeterCopper: 0.12,
    surfaceAreaPerMeterM2: Math.PI * 0.00635,
    internalVolumePerMeterLiters: (Math.PI * Math.pow(0.00483 / 2, 2) * 1) * 1000,
  },
  '3/8"': {
    nominalInch: '3/8"',
    odMm: 9.52,
    idMm: 7.90,
    wallThicknessMm: 0.81,
    maxRecommendedCircuitLengthM: 18,
    weightKgPerMeterCopper: 0.20,
    surfaceAreaPerMeterM2: Math.PI * 0.00952,
    internalVolumePerMeterLiters: (Math.PI * Math.pow(0.00790 / 2, 2) * 1) * 1000,
  },
  '1/2"': {
    nominalInch: '1/2"',
    odMm: 12.70,
    idMm: 11.08,
    wallThicknessMm: 0.81,
    maxRecommendedCircuitLengthM: 25,
    weightKgPerMeterCopper: 0.27,
    surfaceAreaPerMeterM2: Math.PI * 0.01270,
    internalVolumePerMeterLiters: (Math.PI * Math.pow(0.01108 / 2, 2) * 1) * 1000,
  },
  '5/8"': {
    nominalInch: '5/8"',
    odMm: 15.88,
    idMm: 14.10,
    wallThicknessMm: 0.89,
    maxRecommendedCircuitLengthM: 35,
    weightKgPerMeterCopper: 0.37,
    surfaceAreaPerMeterM2: Math.PI * 0.01588,
    internalVolumePerMeterLiters: (Math.PI * Math.pow(0.01410 / 2, 2) * 1) * 1000,
  },
  '3/4"': {
    nominalInch: '3/4"',
    odMm: 19.05,
    idMm: 17.15,
    wallThicknessMm: 0.95,
    maxRecommendedCircuitLengthM: 45,
    weightKgPerMeterCopper: 0.48,
    surfaceAreaPerMeterM2: Math.PI * 0.01905,
    internalVolumePerMeterLiters: (Math.PI * Math.pow(0.01715 / 2, 2) * 1) * 1000,
  },
  '7/8"': {
    nominalInch: '7/8"',
    odMm: 22.22,
    idMm: 20.22,
    wallThicknessMm: 1.00,
    maxRecommendedCircuitLengthM: 55,
    weightKgPerMeterCopper: 0.59,
    surfaceAreaPerMeterM2: Math.PI * 0.02222,
    internalVolumePerMeterLiters: (Math.PI * Math.pow(0.02022 / 2, 2) * 1) * 1000,
  },
  '1"': {
    nominalInch: '1"',
    odMm: 25.40,
    idMm: 23.12,
    wallThicknessMm: 1.14,
    maxRecommendedCircuitLengthM: 60,
    weightKgPerMeterCopper: 0.78,
    surfaceAreaPerMeterM2: Math.PI * 0.02540,
    internalVolumePerMeterLiters: (Math.PI * Math.pow(0.02312 / 2, 2) * 1) * 1000,
  },
  '1-1/8"': {
    nominalInch: '1-1/8"',
    odMm: 28.58,
    idMm: 26.04,
    wallThicknessMm: 1.27,
    maxRecommendedCircuitLengthM: 70,
    weightKgPerMeterCopper: 0.97,
    surfaceAreaPerMeterM2: Math.PI * 0.02858,
    internalVolumePerMeterLiters: (Math.PI * Math.pow(0.02604 / 2, 2) * 1) * 1000,
  },
  '1-3/8"': {
    nominalInch: '1-3/8"',
    odMm: 34.92,
    idMm: 32.12,
    wallThicknessMm: 1.40,
    maxRecommendedCircuitLengthM: 85,
    weightKgPerMeterCopper: 1.32,
    surfaceAreaPerMeterM2: Math.PI * 0.03492,
    internalVolumePerMeterLiters: (Math.PI * Math.pow(0.03212 / 2, 2) * 1) * 1000,
  },
};

// Material characteristics database
export const PIPE_MATERIAL_SPECS: Record<
  PipeMaterialType,
  {
    name: string;
    standard: string;
    kConductivity: number; // W/m·K
    densityKgM3: number;
    corrosionNotes: string;
    bendingNotes: string;
    uMultiplier: number;
  }
> = {
  copper_plain: {
    name: 'Tembaga Deoksidasi Fosfor Murni (DHP-Cu C12200)',
    standard: 'ASTM B280 / ASTM B88 Tipe L & K / EN 12735-1',
    kConductivity: 386,
    densityKgM3: 8940,
    corrosionNotes: 'Sangat cocok untuk air tawar & sirkulasi tertutup convector. Hindari air asin berkadar klorida tinggi.',
    bendingNotes: 'Sangat elastis (soft annealed). Mudah ditekuk manual dengan bender pipa spiral atau mandrel.',
    uMultiplier: 1.0,
  },
  copper_finned: {
    name: 'Pipa Tembaga Bersirip Spiral Integral (Low-Fin Tube)',
    standard: 'ASTM B359 / ASME SB359 (19-26 Fins/Inch)',
    kConductivity: 386,
    densityKgM3: 8940,
    corrosionNotes: 'Cocok untuk convector tangki sempit / efisiensi tinggi dengan air bersih.',
    bendingNotes: 'Radius tekukan minimal 3.5× OD agar sirip tidak penyok/terjepit.',
    uMultiplier: 0.92, // Slight fin efficiency derating on overall U, but area is ~3.8x
  },
  ss304: {
    name: 'Stainless Steel SS304 / AISI 304 Sanitary Food Grade',
    standard: 'ASTM A269 / ASTM A270 (Sanitary Seamless Tube)',
    kConductivity: 16.2,
    densityKgM3: 7930,
    corrosionNotes: 'Standar higienis untuk air minum, susu, industri bir (wort chiller), farmasi & makanan.',
    bendingNotes: 'Keras & memiliki spring-back. Membutuhkan roll-bending mesin atau bender hidrolik.',
    uMultiplier: 0.82,
  },
  ss316l: {
    name: 'Stainless Steel SS316L (Low Carbon + Molybdenum)',
    standard: 'ASTM A269 / ASTM A270 SS316L',
    kConductivity: 15.0,
    densityKgM3: 7980,
    corrosionNotes: 'Tahan korosi klorida tinggi, air payau, bahan kimia organik, dan industri asam ringan.',
    bendingNotes: 'Kuat dan kaku. Wajib menggunakan roll-bender dengan pelumas anti-galling.',
    uMultiplier: 0.78,
  },
  titanium: {
    name: 'Titanium Grade 2 Murni (Pure Titanium Tube)',
    standard: 'ASTM B338 Grade 2 Seamless / Welded',
    kConductivity: 21.9,
    densityKgM3: 4510,
    corrosionNotes: '100% imun terhadap air laut, air garam pekat (brine chiller), dan asam agresif.',
    bendingNotes: 'Membutuhkan penekukan perlahan dengan radius besar (min 4× - 5× OD).',
    uMultiplier: 0.85,
  },
};

// Convection baseline heat transfer coefficients (W/m²·K)
export const CONVECTION_BASELINES: Record<
  WaterConvectionRegime,
  { label: string; description: string; baseU: number }
> = {
  static_natural: {
    label: 'Tangki Diam / Aliran Alami (Natural Convection)',
    description: 'Air di dalam convector diam tanpa agitator. Terbentuk lapisan batas termal alami (film layer) tebal.',
    baseU: 210,
  },
  gentle_agitation: {
    label: 'Pengaduk Pelan / Sirkulasi Santai (Gentle Agitation)',
    description: 'Terdapat agitator putaran rendah atau pompa sirkulasi berdebit kecil di sekitar pipa koil.',
    baseU: 420,
  },
  vigorous_agitation: {
    label: 'Agitator Turbulen / Pompa Kencang (Vigorous Agitation)',
    description: 'Aliran air turbulen menyapu permukaan koil pipa secara aktif, memecah lapisan film batas.',
    baseU: 650,
  },
  forced_shell_coil: {
    label: 'Convector Aliran Paksa / Shell & Coil Tertutup',
    description: 'Air dialirkan dalam ruang sempit selongsong bertekanan dengan kecepatan tinggi menyilang pipa.',
    baseU: 880,
  },
};

// Refrigerant latent heat & properties rough table for mass flow estimation
const REFRIGERANT_HEAT_OF_VAP: Record<string, number> = {
  R22: 185,
  R134a: 178,
  R404A: 140,
  R410A: 195,
  R32: 275,
  R290: 345,
  R717: 1200,
  R507A: 138,
  R407C: 175,
  R1234yf: 145,
  R1234ze: 160,
  R23: 130,
  R1270: 330,
  R744: 210,
  R600a: 330,
};

/**
 * Calculates Evaporator Coil Pipe Length & Sizing for Convector / Water Chiller Tank
 */
export function calculateEvaporatorCoil(inputs: EvaporatorCoilInputs): EvaporatorCoilCalculationResult {
  const steps: EvaporatorCoilCalculationResult['calculationSteps'] = [];

  // 1. Determine Effective Cooling Load (Q in kW)
  let qKw = 0;
  let inletTempC = 0;
  let outletTempC = 0;

  if (inputs.calculationMode === 'direct_capacity') {
    qKw = Math.max(0.2, inputs.coolingCapacityKw);
    inletTempC = inputs.waterInletTempC || 15;
    outletTempC = inputs.waterOutletTempC || 5;

    steps.push({
      title: 'Langkah 1: Beban Pendinginan (Input Langsung)',
      formula: 'Q = Kapasitas Mesin yang Dimasukkan',
      value: `${qKw.toFixed(2)} kW (${(qKw * 3412.142).toLocaleString('id-ID', { maximumFractionDigits: 0 })} BTU/h | ${(qKw / 3.51685).toFixed(2)} TR)`,
      explanation: 'Kapasitas pendinginan yang harus diserap oleh pipa evaporator coil.',
    });
  } else if (inputs.calculationMode === 'continuous_flow') {
    // Q = m_dot * cp * deltaT
    // m_dot = LPM / 60 kg/s (density of water ~ 1 kg/L)
    // cp = 4.186 kJ/kg·°C
    inletTempC = inputs.waterInletTempC;
    outletTempC = inputs.waterOutletTempC;
    const deltaTWater = Math.max(0.5, inletTempC - outletTempC);
    const massFlowKgS = (inputs.waterFlowRateLpm * 1.0) / 60; // kg/s
    qKw = massFlowKgS * 4.186 * deltaTWater;

    steps.push({
      title: 'Langkah 1: Beban Pendinginan Aliran Air Kontinu',
      formula: 'Q = ṁ × c_p × (T_in - T_out)',
      value: `${qKw.toFixed(2)} kW (Debit: ${inputs.waterFlowRateLpm} L/menit, ΔT Air: ${deltaTWater.toFixed(1)}°C)`,
      explanation: `Air masuk pada suhu ${inletTempC}°C dan keluar pada ${outletTempC}°C dengan debit ${inputs.waterFlowRateLpm} L/menit.`,
    });
  } else {
    // batch_tank
    // Q = (V * rho * cp * deltaT) / (3600 * t_hours) * (1 + ambientLossPct)
    inletTempC = inputs.batchInitialTempC;
    outletTempC = inputs.batchTargetTempC;
    const deltaTWater = Math.max(0.5, inletTempC - outletTempC);
    const waterMassKg = inputs.batchWaterVolumeLiters * 1.0;
    const coolingSeconds = Math.max(0.25, inputs.batchCoolingTimeHours) * 3600;
    const rawQkJ = waterMassKg * 4.186 * deltaTWater;
    const ambientMultiplier = 1 + (inputs.tankAmbientLossFactorPct || 10) / 100;
    qKw = (rawQkJ / coolingSeconds) * ambientMultiplier;

    steps.push({
      title: 'Langkah 1: Beban Pendinginan Tangki Batch Convector',
      formula: 'Q = [ (V × ρ × c_p × ΔT) / t_detik ] × (1 + Faktor_Beban_Sekitar)',
      value: `${qKw.toFixed(2)} kW (Volume: ${inputs.batchWaterVolumeLiters} Liter, Target: ${inputs.batchCoolingTimeHours} jam)`,
      explanation: `Mendinginkan ${inputs.batchWaterVolumeLiters} Liter air dari ${inletTempC}°C ke ${outletTempC}°C dalam waktu ${inputs.batchCoolingTimeHours} jam (termasuk kompensasi beban lingkungan ${(inputs.tankAmbientLossFactorPct || 10)}%).`,
    });
  }

  // 2. Temperature Differences & LMTD
  const tEvap = inputs.evaporatingTempC;
  const deltaT1 = Math.max(0.2, inletTempC - tEvap);
  const deltaT2 = Math.max(0.1, outletTempC - tEvap);

  let lmtd = 0;
  if (Math.abs(deltaT1 - deltaT2) < 0.05) {
    lmtd = deltaT1;
  } else {
    lmtd = (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
  }

  steps.push({
    title: 'Langkah 2: Beda Suhu Rata-Rata Logaritmik (LMTD)',
    formula: 'LMTD = (ΔT₁ - ΔT₂) / ln(ΔT₁ / ΔT₂)',
    value: `${lmtd.toFixed(2)} °C (ΔT₁ = ${deltaT1.toFixed(1)}°C, ΔT₂ = ${deltaT2.toFixed(1)}°C, T_evap = ${tEvap}°C)`,
    explanation: `Beda suhu pendorong perpindahan kalor antara air convector dengan freon mendidih pada ${tEvap}°C.`,
  });

  // 3. Determine Overall Heat Transfer Coefficient (U)
  const material = PIPE_MATERIAL_SPECS[inputs.pipeMaterial] || PIPE_MATERIAL_SPECS.copper_plain;
  const convection = CONVECTION_BASELINES[inputs.convectionRegime] || CONVECTION_BASELINES.gentle_agitation;

  let uValue = inputs.customUValue && inputs.customUValue > 50
    ? inputs.customUValue
    : convection.baseU * material.uMultiplier;

  steps.push({
    title: 'Langkah 3: Koefisien Perpindahan Kalor Menyeluruh (U-Value)',
    formula: 'U = U_base × Faktor_Material',
    value: `${uValue.toFixed(0)} W/m²·K (Rezim: ${convection.label})`,
    explanation: `Koefisien U dihitung berdasarkan pergerakan air di convector dan hambatan konduktivitas material pipa (${material.name}).`,
  });

  // 4. Required Heat Transfer Surface Area (A_o)
  const qWatts = qKw * 1000;
  const cleanAreaM2 = qWatts / (uValue * lmtd);
  const safetyFactor = 1 + (inputs.foulingSafetyFactorPct || 15) / 100;
  const designAreaM2 = cleanAreaM2 * safetyFactor;

  steps.push({
    title: 'Langkah 4: Luas Permukaan Perpindahan Kalor yang Dibutuhkan (A)',
    formula: 'A_desain = (Q / [U × LMTD]) × (1 + Safety_Margin)',
    value: `${designAreaM2.toFixed(3)} m² (Luas Bersih: ${cleanAreaM2.toFixed(3)} m², Safety Margin: ${inputs.foulingSafetyFactorPct || 15}%)`,
    explanation: 'Luas selimut luar pipa yang harus terendam dalam air untuk mentransfer seluruh beban kalor secara optimal.',
  });

  // 5. Pipe Dimension & Length Calculation
  const pipeSpec = STANDARD_PIPE_DIMENSIONS[inputs.pipeNominalInch] || STANDARD_PIPE_DIMENSIONS['1/2"'];
  const surfaceAreaPerMeter = pipeSpec.surfaceAreaPerMeterM2; // Pi * OD

  let totalPipeLengthMeters = designAreaM2 / surfaceAreaPerMeter;

  // If finned tube is selected, fin area multiplier applies
  const isFinned = inputs.pipeMaterial === 'copper_finned';
  const finMultiplier = isFinned ? (inputs.finMultiplierArea || 3.8) : 1.0;

  let finnedEquivalentLengthMeters: number | undefined;
  if (isFinned) {
    finnedEquivalentLengthMeters = totalPipeLengthMeters / finMultiplier;
    totalPipeLengthMeters = finnedEquivalentLengthMeters;
  }

  steps.push({
    title: 'Langkah 5: Panjang Pipa yang Diperlukan (L)',
    formula: isFinned
      ? 'L_pipa = A_desain / (π × D_od × Faktor_Sirip)'
      : 'L_pipa = A_desain / (π × D_od)',
    value: `${totalPipeLengthMeters.toFixed(2)} Meter Pipa ${pipeSpec.nominalInch} (OD ${pipeSpec.odMm} mm)`,
    explanation: isFinned
      ? `Menggunakan pipa tembaga bersirip dengan pengali luas ${finMultiplier.toFixed(1)}× membuat panjang pipa jauh lebih hemat dan ringkas!`
      : `Setiap 1 meter pipa ${pipeSpec.nominalInch} memiliki luas permukaan luar ${(surfaceAreaPerMeter).toFixed(4)} m².`,
  });

  // 6. Refrigerant Mass Flow & Multi-Circuit Sizing (Pressure Drop & Distribution)
  const latHeat = REFRIGERANT_HEAT_OF_VAP[inputs.refrigerantId] || 180; // kJ/kg
  const refrigerantMassFlowKgS = qKw / latHeat;
  const refrigerantVolumetricFlowM3H = (refrigerantMassFlowKgS * 3600) / 1.15; // rough density of cold liquid/vapor mix
  
  // Rule of thumb for parallel circuits based on max recommended length per circuit
  const maxCircuitLen = pipeSpec.maxRecommendedCircuitLengthM;
  let recommendedCircuits = Math.max(1, Math.ceil(totalPipeLengthMeters / maxCircuitLen));
  
  // Also check if capacity per circuit exceeds standard limit (typically max 1.5 - 2.5 kW per circuit on 3/8" or 1/2")
  const kwPerCircuitLimit = pipeSpec.nominalInch === '1/4"' ? 0.8 : pipeSpec.nominalInch === '3/8"' ? 1.8 : pipeSpec.nominalInch === '1/2"' ? 3.5 : 6.0;
  const circuitsByCapacity = Math.ceil(qKw / kwPerCircuitLimit);
  recommendedCircuits = Math.max(recommendedCircuits, circuitsByCapacity);

  const lengthPerCircuitMeters = totalPipeLengthMeters / recommendedCircuits;

  let circuitPressureDropStatus: EvaporatorCoilCalculationResult['circuitPressureDropStatus'] = 'Optimal';
  if (lengthPerCircuitMeters > maxCircuitLen * 1.25) {
    circuitPressureDropStatus = 'Terlalu Panjang (Waspada Penurunan Tekanan)';
  } else if (lengthPerCircuitMeters > maxCircuitLen * 0.9) {
    circuitPressureDropStatus = 'Aman';
  } else {
    circuitPressureDropStatus = 'Optimal';
  }

  // Distributor spec
  const distributorInletSpec = recommendedCircuits === 1
    ? 'Koneksi Tunggal (Direct TXV Outlet tanpa Distributor)'
    : `Distributor ${recommendedCircuits}-Way dengan Nozzle Presisi & Pipa Spider (Pipa Kapiler Feeder 1/4" OD)`;

  // Rough refrigerant vapor velocity estimate at outlet (m/s)
  // v = (m_dot / rho_vapor) / (N_circuits * A_flow)
  const rhoVapor = 15.0; // kg/m³ approx for standard Freon at low pressure
  const flowAreaPerTubeM2 = Math.PI * Math.pow(pipeSpec.idMm / 1000 / 2, 2);
  const totalFlowAreaM2 = flowAreaPerTubeM2 * recommendedCircuits;
  const estimatedRefrigerantVelocityMs = (refrigerantMassFlowKgS / (rhoVapor * totalFlowAreaM2));

  steps.push({
    title: 'Langkah 6: Pembagian Sirkuit Paralel & Penurunan Tekanan (Pressure Drop)',
    formula: 'N_sirkuit = Ceil(L_total / L_maks_per_sirkuit)',
    value: `${recommendedCircuits} Sirkuit Paralel (@ ${lengthPerCircuitMeters.toFixed(2)} meter / sirkuit)`,
    explanation: `Untuk menghindari pressure drop freon berlebihan yang dapat menurunkan efisiensi kompresor, pipa koil disarankan dibagi menjadi ${recommendedCircuits} jalur paralel dengan distributor.`,
  });

  // 7. Physical Coil Fabrication Geometry
  const coilDiameterM = Math.max(0.15, (inputs.coilDiameterMm || 400) / 1000);
  const circumferenceM = Math.PI * coilDiameterM;
  const coilTurnsCount = Math.max(1, Math.round(totalPipeLengthMeters / circumferenceM));
  const coilPitchMm = Math.max(pipeSpec.odMm + 5, inputs.coilPitchMm || (pipeSpec.odMm + 15));
  const coilHeightMm = coilTurnsCount * coilPitchMm;

  // Weight
  const densityMultiplier = material.densityKgM3 / 8940; // relative to copper
  const coilWeightKg = totalPipeLengthMeters * pipeSpec.weightKgPerMeterCopper * densityMultiplier;
  const internalRefrigerantVolumeLiters = totalPipeLengthMeters * pipeSpec.internalVolumePerMeterLiters;

  // Suggested convector tank volume (around 1.5x - 2.5x coil displacement volume)
  const coilEnvelopeVolumeLiters = (Math.PI * Math.pow(coilDiameterM / 2, 2) * (coilHeightMm / 1000)) * 1000;
  const convectorTankSuggestedVolumeLiters = Math.max(50, Math.round(coilEnvelopeVolumeLiters * 1.6));

  return {
    effectiveCoolingLoadKw: qKw,
    effectiveCoolingLoadBtuHr: qKw * 3412.142,
    effectiveCoolingLoadTr: qKw / 3.51685,
    effectiveCoolingLoadHp: qKw / 0.7457,
    lmtdC: lmtd,
    deltaTIn: deltaT1,
    deltaTOut: deltaT2,
    uValueWm2K: uValue,
    thermalConductivityKm: material.kConductivity,
    requiredHeatTransferAreaM2: cleanAreaM2,
    fouledHeatTransferAreaM2: designAreaM2,
    nominalPipeSpec: pipeSpec,
    totalPipeLengthMeters: totalPipeLengthMeters,
    finnedEquivalentLengthMeters: finnedEquivalentLengthMeters,
    recommendedCircuits: recommendedCircuits,
    lengthPerCircuitMeters: lengthPerCircuitMeters,
    distributorInletSpec: distributorInletSpec,
    refrigerantMassFlowKgS: refrigerantMassFlowKgS,
    refrigerantVolumetricFlowM3H: refrigerantVolumetricFlowM3H,
    estimatedRefrigerantVelocityMs: estimatedRefrigerantVelocityMs,
    circuitPressureDropStatus: circuitPressureDropStatus,
    coilTurnsCount: coilTurnsCount,
    coilHeightMm: coilHeightMm,
    coilWeightKg: coilWeightKg,
    internalRefrigerantVolumeLiters: internalRefrigerantVolumeLiters,
    convectorTankSuggestedVolumeLiters: convectorTankSuggestedVolumeLiters,
    materialName: material.name,
    materialStandard: material.standard,
    corrosionSuitability: material.corrosionNotes,
    bendingRecommendations: material.bendingNotes,
    calculationSteps: steps,
  };
}
