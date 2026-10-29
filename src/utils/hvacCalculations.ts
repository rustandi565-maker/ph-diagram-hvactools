import {
  CoolingLoadResult,
  DuctSizingResult,
  InsulationQuality,
  PsychrometricResult,
  RoomPreset,
  RoomType,
  SunExposure,
  UnitSystem,
  VentilationResult,
  WindowType,
} from '../types/hvac';

export const ROOM_PRESETS: RoomPreset[] = [
  {
    id: 'bedroom',
    name: 'Kamar Tidur Utama',
    length: 4,
    width: 3.5,
    height: 3,
    roomType: 'bedroom',
    sunExposure: 'sheltered',
    occupants: 2,
    equipmentWattage: 200,
    windowType: 'standard',
    insulationQuality: 'standard',
    description: 'Kamar tidur 14 m² untuk 2 orang dengan TV dan lampu.',
  },
  {
    id: 'living_room',
    name: 'Ruang Tamu & Keluarga',
    length: 6,
    width: 4,
    height: 3.2,
    roomType: 'living_room',
    sunExposure: 'morning_east',
    occupants: 5,
    equipmentWattage: 500,
    windowType: 'standard',
    insulationQuality: 'standard',
    description: 'Ruang keluarga 24 m² dengan jendela kaca dan beberapa penghuni.',
  },
  {
    id: 'office',
    name: 'Ruang Kantor / Meeting',
    length: 8,
    width: 5,
    height: 3,
    roomType: 'office',
    sunExposure: 'afternoon_west',
    occupants: 10,
    equipmentWattage: 1800,
    windowType: 'large_glass',
    insulationQuality: 'standard',
    description: 'Kantor 40 m² berisi 10 workstation laptop/PC dan proyektor.',
  },
  {
    id: 'restaurant',
    name: 'Restoran / Kafe',
    length: 12,
    width: 7,
    height: 3.5,
    roomType: 'restaurant',
    sunExposure: 'afternoon_west',
    occupants: 28,
    equipmentWattage: 3500,
    windowType: 'large_glass',
    insulationQuality: 'poor',
    description: 'Kafe 84 m² dengan pintu sering terbuka dan pencahayaan intensif.',
  },
  {
    id: 'server_room',
    name: 'Server / Rack Room',
    length: 4,
    width: 3,
    height: 2.8,
    roomType: 'server_room',
    sunExposure: 'sheltered',
    occupants: 1,
    equipmentWattage: 4500,
    windowType: 'minimal',
    insulationQuality: 'excellent',
    description: 'Ruang server 12 m² dengan beban panas komputasi tinggi kontinu 24/7.',
  },
];

// Room type base BTU per m2
const BASE_BTU_PER_M2: Record<RoomType, number> = {
  bedroom: 550,
  living_room: 650,
  office: 750,
  classroom: 700,
  restaurant: 950,
  server_room: 1300,
  gym: 850,
  retail: 800,
};

const SUN_MULTIPLIER: Record<SunExposure, number> = {
  sheltered: 1.0,
  morning_east: 1.08,
  afternoon_west: 1.22,
  top_floor_roof: 1.18,
};

const WINDOW_ADDITION_BTU: Record<WindowType, number> = {
  minimal: 0,
  standard: 800,
  large_glass: 2200,
  full_curtain_wall: 4500,
};

const INSULATION_FACTOR: Record<InsulationQuality, number> = {
  excellent: 0.92,
  standard: 1.0,
  poor: 1.15,
};

export function calculateCoolingLoad(params: {
  length: number;
  width: number;
  height: number;
  unitSystem: UnitSystem;
  roomType: RoomType;
  sunExposure: SunExposure;
  occupants: number;
  equipmentWattage: number;
  windowType: WindowType;
  insulationQuality: InsulationQuality;
  hoursPerDay?: number;
  kwhTariffIDR?: number;
}): CoolingLoadResult {
  const {
    length,
    width,
    height,
    unitSystem,
    roomType,
    sunExposure,
    occupants,
    equipmentWattage,
    windowType,
    insulationQuality,
    hoursPerDay = 10,
    kwhTariffIDR = 1500,
  } = params;

  // Convert dimensions to metric for base internal calculations
  const lengthM = unitSystem === 'imperial' ? length * 0.3048 : length;
  const widthM = unitSystem === 'imperial' ? width * 0.3048 : width;
  const heightM = unitSystem === 'imperial' ? height * 0.3048 : height;

  const floorAreaM2 = lengthM * widthM;
  const volumeM3 = floorAreaM2 * heightM;

  const displayArea = unitSystem === 'imperial' ? floorAreaM2 * 10.7639 : floorAreaM2;
  const displayVolume = unitSystem === 'imperial' ? volumeM3 * 35.3147 : volumeM3;

  // Ceiling height correction factor (standard base is 2.8m)
  const heightFactor = Math.max(1, heightM / 2.8);

  // 1. Base Room Load
  const baseRate = BASE_BTU_PER_M2[roomType] || 600;
  const baseAreaBTU = floorAreaM2 * baseRate * heightFactor;

  // 2. Solar & Wall Orientation Extra Load
  const sunFactor = SUN_MULTIPLIER[sunExposure] || 1.0;
  const sunBTU = baseAreaBTU * (sunFactor - 1.0);

  // 3. Occupant Load (~550 BTU/hr sensible + latent heat per person)
  const occupantBTU = occupants * 550;

  // 4. Equipment Load (1 Watt = 3.412142 BTU/hr)
  const equipmentBTU = equipmentWattage * 3.412142;

  // 5. Window / Glazing Load
  const windowBTU = WINDOW_ADDITION_BTU[windowType] || 800;

  // Total raw BTU before insulation adjustment
  const subtotalBTU = baseAreaBTU + sunBTU + occupantBTU + equipmentBTU + windowBTU;
  const insulationCoeff = INSULATION_FACTOR[insulationQuality] || 1.0;
  const totalBTU = Math.round(subtotalBTU * insulationCoeff);

  // Conversions
  const tonnageTR = totalBTU / 12000;
  const kilowatt = totalBTU / 3412.142;

  // PK Recommendation Engine (Indonesian standard PK sizing)
  const pkRecommendation = determinePKRecommendation(totalBTU);

  // Power consumption estimates (Watts)
  // Standard non-inverter: ~1 PK = 750 - 800W, Inverter ~450 - 600W under modulation
  const estStandardWatts = Math.round((totalBTU / 9000) * 800);
  const estInverterWatts = Math.round((totalBTU / 9000) * 520);

  // Estimated monthly electricity cost (30 days)
  const standardKwhMonth = (estStandardWatts / 1000) * hoursPerDay * 30;
  const inverterKwhMonth = (estInverterWatts / 1000) * hoursPerDay * 30;

  return {
    floorArea: Math.round(displayArea * 10) / 10,
    volume: Math.round(displayVolume * 10) / 10,
    baseAreaBTU: Math.round(baseAreaBTU),
    sunBTU: Math.round(sunBTU),
    occupantBTU: Math.round(occupantBTU),
    equipmentBTU: Math.round(equipmentBTU),
    windowBTU: Math.round(windowBTU),
    totalBTU,
    tonnageTR: Math.round(tonnageTR * 100) / 100,
    kilowatt: Math.round(kilowatt * 100) / 100,
    pkRecommendation,
    estPowerWatts: {
      standard: estStandardWatts,
      inverter: estInverterWatts,
    },
    estMonthlyCostIDR: {
      standard: Math.round(standardKwhMonth * kwhTariffIDR),
      inverter: Math.round(inverterKwhMonth * kwhTariffIDR),
    },
  };
}

function determinePKRecommendation(totalBTU: number): {
  nominalPK: number;
  labelPK: string;
  description: string;
  unitCount: number;
  systemType: string;
} {
  if (totalBTU <= 5500) {
    return {
      nominalPK: 0.5,
      labelPK: '0.5 PK (1/2 PK)',
      description: 'Ideal untuk ruangan kecil / kamar tidur standar (±5.000 BTU/h).',
      unitCount: 1,
      systemType: 'Single Split Wall',
    };
  }
  if (totalBTU <= 7700) {
    return {
      nominalPK: 0.75,
      labelPK: '0.75 PK (3/4 PK)',
      description: 'Cukup untuk kamar tidur sedang atau ruang kerja personal (±7.000 BTU/h).',
      unitCount: 1,
      systemType: 'Single Split Wall',
    };
  }
  if (totalBTU <= 10000) {
    return {
      nominalPK: 1.0,
      labelPK: '1 PK',
      description: 'Kapasitas standar terpopuler untuk kamar utama atau ruang keluarga (±9.000 BTU/h).',
      unitCount: 1,
      systemType: 'Single Split Wall',
    };
  }
  if (totalBTU <= 14000) {
    return {
      nominalPK: 1.5,
      labelPK: '1.5 PK',
      description: 'Tepat untuk ruang keluarga besar atau kantor mini (±12.000 BTU/h).',
      unitCount: 1,
      systemType: 'Split Wall atau Cassette',
    };
  }
  if (totalBTU <= 20000) {
    return {
      nominalPK: 2.0,
      labelPK: '2 PK',
      description: 'Cocok untuk ruang tamu luas, ruko, atau ruang rapat (±18.000 BTU/h).',
      unitCount: 1,
      systemType: 'Split Wall, Cassette, atau Standing',
    };
  }
  if (totalBTU <= 26000) {
    return {
      nominalPK: 2.5,
      labelPK: '2.5 PK',
      description: 'Kapasitas besar untuk area komersial atau aula mini (±24.000 BTU/h).',
      unitCount: 1,
      systemType: 'Cassette atau Floor Standing',
    };
  }
  if (totalBTU <= 34000) {
    return {
      nominalPK: 3.0,
      labelPK: '3 PK (atau 2 x 1.5 PK)',
      description: 'Disarankan 1 unit 3 PK atau split menjadi 2 unit @1.5 PK untuk sirkulasi lebih merata.',
      unitCount: 2,
      systemType: 'Cassette / Standing / Multi-Split',
    };
  }
  if (totalBTU <= 55000) {
    const pk = Math.ceil(totalBTU / 9000) * 0.5;
    return {
      nominalPK: pk,
      labelPK: `5 PK (atau 2 x 2.5 PK)`,
      description: 'Ruangan komersial besar. Direkomendasikan 2 unit 2.5 PK atau 1 unit standing 5 PK.',
      unitCount: 2,
      systemType: 'Floor Standing / Cassette / Ducted',
    };
  }

  // Very large areas
  const totalPK = Math.ceil(totalBTU / 9000);
  const unitsOf2PK = Math.ceil(totalPK / 2);
  return {
    nominalPK: totalPK,
    labelPK: `${totalPK} PK Total (${unitsOf2PK} unit @2 PK)`,
    description: `Beban sangat besar. Direkomendasikan sistem multi-unit VRV/VRF atau ducted central AC.`,
    unitCount: unitsOf2PK,
    systemType: 'VRV / VRF Central System',
  };
}

// Ventilation Calculation (ASHRAE 62.1 inspired)
export function calculateVentilation(params: {
  length: number;
  width: number;
  height: number;
  unitSystem: UnitSystem;
  ach: number;
}): VentilationResult {
  const { length, width, height, unitSystem, ach } = params;

  const lengthFt = unitSystem === 'metric' ? length * 3.28084 : length;
  const widthFt = unitSystem === 'metric' ? width * 3.28084 : width;
  const heightFt = unitSystem === 'metric' ? height * 3.28084 : height;

  const volumeCuFt = lengthFt * widthFt * heightFt;
  const cfm = Math.round((volumeCuFt * ach) / 60);

  // Metric Volume (m3)
  const volumeM3 = volumeCuFt / 35.3147;
  const cmh = Math.round(volumeM3 * ach);
  const litersPerSecond = Math.round((cmh / 3.6) * 10) / 10;

  // Fan size recommendation
  let recommendedFanSize = 'Exhaust Fan 6-inch (15 cm)';
  if (cfm > 800) {
    recommendedFanSize = 'Industrial Blower / Inline Duct Fan 12-inch+ (30 cm+)';
  } else if (cfm > 450) {
    recommendedFanSize = 'Exhaust Fan 12-inch (30 cm) / High-flow Inline Fan';
  } else if (cfm > 250) {
    recommendedFanSize = 'Exhaust Fan 10-inch (25 cm)';
  } else if (cfm > 120) {
    recommendedFanSize = 'Exhaust Fan 8-inch (20 cm)';
  }

  return {
    roomVolume: Math.round(unitSystem === 'metric' ? volumeM3 * 10 : volumeCuFt) / (unitSystem === 'metric' ? 10 : 1),
    ach,
    cfm,
    cmh,
    litersPerSecond,
    recommendedFanSize,
  };
}

// Duct Sizing calculation
export function calculateDuctSizing(params: {
  cfm: number;
  velocityFpm: number;
}): DuctSizingResult {
  const { cfm, velocityFpm } = params;

  // Duct area in sq feet = CFM / FPM
  const areaSqFt = cfm / Math.max(100, velocityFpm);
  const ductAreaSqIn = areaSqFt * 144;
  const ductAreaSqM = areaSqFt * 0.092903;

  // Circular duct diameter: Area = pi * (D/2)^2 => D = 2 * sqrt(Area / pi)
  const circularDiameterInches = Math.sqrt((4 * ductAreaSqIn) / Math.PI);
  const circularDiameterMm = circularDiameterInches * 25.4;

  // Generate rectangular duct options with realistic standard duct dimensions (multiples of 2 inches)
  const rectangularOptions: DuctSizingResult['rectangularOptions'] = [];
  const testWidths = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48];

  for (const w of testWidths) {
    const rawH = ductAreaSqIn / w;
    // Round to nearest inch
    const h = Math.round(rawH);
    if (h >= 4 && h <= 48) {
      const aspectRatio = Math.max(w, h) / Math.min(w, h);
      if (aspectRatio <= 4.0) {
        rectangularOptions.push({
          widthInches: w,
          heightInches: h,
          widthMm: Math.round(w * 25.4),
          heightMm: Math.round(h * 25.4),
          aspectRatio: Math.round(aspectRatio * 10) / 10,
          isIdeal: aspectRatio <= 2.0,
        });
      }
    }
  }

  // Sort by aspect ratio closeness to 1.0 (square is most aerodynamically efficient)
  rectangularOptions.sort((a, b) => Math.abs(a.aspectRatio - 1.2) - Math.abs(b.aspectRatio - 1.2));

  // Friction loss approximation using ASHRAE standard air duct formula
  // Delta P (in. wg per 100 ft) ≈ 0.109136 * (CFM^1.9) / (D_circular^5.02)
  const frictionLossInWg = 0.109136 * Math.pow(cfm, 1.9) / Math.pow(Math.max(2, circularDiameterInches), 5.02);
  // 1 in. wg / 100 ft ≈ 24.908 Pa / 30.48 m ≈ 0.817 Pa/m
  const frictionLossPaPerM = frictionLossInWg * 8.17;

  return {
    cfm,
    velocityFpm,
    ductAreaSqIn: Math.round(ductAreaSqIn * 10) / 10,
    ductAreaSqM: Math.round(ductAreaSqM * 1000) / 1000,
    circularDiameterInches: Math.round(circularDiameterInches * 10) / 10,
    circularDiameterMm: Math.round(circularDiameterMm),
    rectangularOptions: rectangularOptions.slice(0, 5),
    frictionLossInWgPer100Ft: Math.round(frictionLossInWg * 1000) / 1000,
    frictionLossPaPerMeter: Math.round(frictionLossPaPerM * 100) / 100,
  };
}

// Psychrometrics calculations
export function calculatePsychrometrics(dryBulbC: number, relativeHumidity: number): PsychrometricResult {
  const T = Math.min(60, Math.max(-20, dryBulbC));
  const RH = Math.min(100, Math.max(1, relativeHumidity));

  // Saturated vapor pressure (Magnus-Tetens formula) in kPa
  const pSatKPa = 0.61078 * Math.exp((17.27 * T) / (T + 237.3));
  // Actual vapor pressure
  const pActualKPa = pSatKPa * (RH / 100);

  // Dew point formula
  const alpha = Math.log(pActualKPa / 0.61078);
  const dewPointC = (237.3 * alpha) / (17.27 - alpha);

  // Stull's empirical formula for wet bulb temperature
  const wetBulbC =
    T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035;

  // Humidity ratio W (g moisture per kg dry air) at standard atmospheric pressure 101.325 kPa
  const pAtm = 101.325;
  const wKgKg = 0.62198 * (pActualKPa / (pAtm - pActualKPa));
  const humidityRatioGKg = wKgKg * 1000;

  // Enthalpy (kJ / kg dry air)
  const enthalpyKjKg = 1.006 * T + wKgKg * (2501 + 1.86 * T);

  // Comfort zone assessment (ASHRAE 55)
  let comfortStatus: PsychrometricResult['comfortStatus'] = {
    label: 'Kenyamanan Optimal (ASHRAE 55)',
    category: 'comfortable',
    description: 'Suhu dan kelembapan ideal untuk produktivitas & kenyamanan manusia.',
  };

  if (T > 27 && RH > 65) {
    comfortStatus = {
      label: 'Gerah & Lembap Berlebih',
      category: 'warm_humid',
      description: 'Beban laten tinggi. Diperlukan dehumidifikasi dan pendinginan AC intensif.',
    };
  } else if (T > 30) {
    comfortStatus = {
      label: 'Terlalu Panas (Thermal Stress)',
      category: 'hot',
      description: 'Suhu di luar batas kenyamanan standar ruangan ber-AC.',
    };
  } else if (T < 21 && RH < 40) {
    comfortStatus = {
      label: 'Dingin & Kering',
      category: 'cold_dry',
      description: 'Udara cenderung membuat kulit kering dan mata pedih. Kurangi pendinginan.',
    };
  } else if (T < 20) {
    comfortStatus = {
      label: 'Terlalu Dingin',
      category: 'cool',
      description: 'Suhu di bawah rentang kenyamanan ruang tropis (23°C - 26°C).',
    };
  } else if (RH > 70) {
    comfortStatus = {
      label: 'Lembap Tinggi (Risiko Jamur)',
      category: 'warm_humid',
      description: 'RH di atas 70% memicu tumbuhnya jamur dinding dan bau apek.',
    };
  }

  return {
    dryBulbC: Math.round(T * 10) / 10,
    relativeHumidity: Math.round(RH),
    dewPointC: Math.round(dewPointC * 10) / 10,
    wetBulbC: Math.round(wetBulbC * 10) / 10,
    enthalpyKjKg: Math.round(enthalpyKjKg * 10) / 10,
    humidityRatioGKg: Math.round(humidityRatioGKg * 10) / 10,
    vaporPressureKPa: Math.round(pActualKPa * 100) / 100,
    comfortStatus,
  };
}
