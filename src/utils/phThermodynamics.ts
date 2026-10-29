import {
  CycleStatePoint,
  ExtendedRefrigerantId,
  ExtendedRefrigerantMeta,
  PhCycleResult,
} from '../types/phDiagram';

export const EXTENDED_REFRIGERANTS: Record<ExtendedRefrigerantId, ExtendedRefrigerantMeta> = {
  R134a: {
    id: 'R134a',
    name: 'R-134a (Tetrafluoroethane)',
    category: 'HFC',
    formula: 'CF₃CH₂F',
    safetyClass: 'A1 (Non-toksik, non-flammable)',
    nbpC: -26.1,
    tcritC: 101.1,
    pcritBar: 40.6,
    hcritKjKg: 382.0,
    gwp: 1430,
    odp: 0,
    typicalUse: 'AC Mobil, Chiller Gedung, Lemari Pendingin Komersial',
    color: '#06b6d4',
  },
  R410A: {
    id: 'R410A',
    name: 'R-410A (HFC-32/125 Blend)',
    category: 'HFC',
    formula: 'CH₂F₂ / CHF₂CF₃ (50/50)',
    safetyClass: 'A1',
    nbpC: -51.4,
    tcritC: 71.3,
    pcritBar: 49.0,
    hcritKjKg: 424.0,
    gwp: 2088,
    odp: 0,
    typicalUse: 'AC Split Residensial & VRF/VRV Komersial',
    color: '#3b82f6',
  },
  R32: {
    id: 'R32',
    name: 'R-32 (Difluoromethane)',
    category: 'HFC',
    formula: 'CH₂F₂',
    safetyClass: 'A2L (Mildly Flammable)',
    nbpC: -51.7,
    tcritC: 78.1,
    pcritBar: 57.8,
    hcritKjKg: 456.0,
    gwp: 675,
    odp: 0,
    typicalUse: 'AC Split Inverter Modern Efisiensi Tinggi',
    color: '#0ea5e9',
  },
  R404A: {
    id: 'R404A',
    name: 'R-404A (HFC Blend)',
    category: 'HFC',
    formula: 'R-125/143a/134a (44/52/4)',
    safetyClass: 'A1',
    nbpC: -46.5,
    tcritC: 72.1,
    pcritBar: 37.3,
    hcritKjKg: 362.0,
    gwp: 3922,
    odp: 0,
    typicalUse: 'Cold Storage, Supermarket Freezer, Blast Chiller',
    color: '#8b5cf6',
  },
  R448A: {
    id: 'R448A',
    name: 'R-448A (Solstice N40 - HFO/HFC Blend)',
    category: 'HFO',
    formula: 'R-32/125/1234yf/134a/1234ze (26/26/20/21/7)',
    safetyClass: 'A1 (Non-toksik, non-flammable)',
    nbpC: -45.9,
    tcritC: 83.7,
    pcritBar: 46.6,
    hcritKjKg: 396.0,
    gwp: 1273,
    odp: 0,
    typicalUse: 'Supermarket Refrigeration, Cold Storage Rendah GWP Pengganti R404A / R507A',
    color: '#0284c7',
  },
  R717: {
    id: 'R717',
    name: 'R-717 (Amonia / NH₃)',
    category: 'Natural',
    formula: 'NH₃',
    safetyClass: 'B2L (Toksik, Rendah Flammability)',
    nbpC: -33.3,
    tcritC: 132.3,
    pcritBar: 113.3,
    hcritKjKg: 1350.0,
    gwp: 0,
    odp: 0,
    typicalUse: 'Pabrik Es, Cold Storage Industri Besar, Pengolahan Makanan',
    color: '#10b981',
  },
  R744: {
    id: 'R744',
    name: 'R-744 (Karbon Dioksida / CO₂)',
    category: 'Natural',
    formula: 'CO₂',
    safetyClass: 'A1',
    nbpC: -78.4,
    tcritC: 31.0,
    pcritBar: 73.8,
    hcritKjKg: 325.0,
    gwp: 1,
    odp: 0,
    typicalUse: 'Sistem Kaskade Suhu Rendah, Supermarket Transkritis',
    color: '#14b8a6',
  },
  R290: {
    id: 'R290',
    name: 'R-290 (Propana Hidrokarbon)',
    category: 'Hydrocarbon',
    formula: 'C₃H₈',
    safetyClass: 'A3 (Flammable Tinggi)',
    nbpC: -42.1,
    tcritC: 96.7,
    pcritBar: 42.5,
    hcritKjKg: 575.0,
    gwp: 3,
    odp: 0,
    typicalUse: 'Heat Pump Ramah Lingkungan, Chiller Kompak, AC Portabel',
    color: '#22c55e',
  },
  R600a: {
    id: 'R600a',
    name: 'R-600a (Isobutana)',
    category: 'Hydrocarbon',
    formula: 'i-C₄H₁₀',
    safetyClass: 'A3 (Flammable Tinggi)',
    nbpC: -11.7,
    tcritC: 134.7,
    pcritBar: 36.3,
    hcritKjKg: 625.0,
    gwp: 3,
    odp: 0,
    typicalUse: 'Kulkas Rumah Tangga Dunia, Showcase Minuman',
    color: '#84cc16',
  },
  R22: {
    id: 'R22',
    name: 'R-22 (Klorodifluorometana)',
    category: 'HCFC',
    formula: 'CHClF₂',
    safetyClass: 'A1',
    nbpC: -40.8,
    tcritC: 96.2,
    pcritBar: 49.9,
    hcritKjKg: 398.0,
    gwp: 1810,
    odp: 0.055,
    typicalUse: 'AC Konvensional (Standar Referensi Buku Teks Termodinamika)',
    color: '#eab308',
  },
  R507A: {
    id: 'R507A',
    name: 'R-507A (Azeotropic Blend)',
    category: 'HFC',
    formula: 'R-125/143a (50/50)',
    safetyClass: 'A1',
    nbpC: -47.1,
    tcritC: 70.6,
    pcritBar: 37.0,
    hcritKjKg: 358.0,
    gwp: 3985,
    odp: 0,
    typicalUse: 'Freezer Industri Tanpa Temperature Glide',
    color: '#a855f7',
  },
  R407C: {
    id: 'R407C',
    name: 'R-407C (HFC Blend Glide)',
    category: 'HFC',
    formula: 'R-32/125/134a (23/25/52)',
    safetyClass: 'A1',
    nbpC: -43.8,
    tcritC: 86.0,
    pcritBar: 46.3,
    hcritKjKg: 416.0,
    gwp: 1774,
    odp: 0,
    typicalUse: 'Retrofit Pengganti R-22 pada AC dan Chiller',
    color: '#f97316',
  },
  R1234yf: {
    id: 'R1234yf',
    name: 'R-1234yf (Hydrofluoroolefin HFO)',
    category: 'HFO',
    formula: 'CF₃CF=CH₂',
    safetyClass: 'A2L',
    nbpC: -29.5,
    tcritC: 94.7,
    pcritBar: 33.8,
    hcritKjKg: 368.0,
    gwp: 1,
    odp: 0,
    typicalUse: 'Standar Baru AC Mobil Global Pengganti R-134a',
    color: '#06b6d4',
  },
  R1234ze: {
    id: 'R1234ze',
    name: 'R-1234ze(E) (HFO Chiller)',
    category: 'HFO',
    formula: 'trans-CHF=CHCF₃',
    safetyClass: 'A2L',
    nbpC: -19.0,
    tcritC: 109.4,
    pcritBar: 36.3,
    hcritKjKg: 385.0,
    gwp: 1,
    odp: 0,
    typicalUse: 'Water Chiller Sentrifugal & Vane Gedung Ramah Lingkungan',
    color: '#0284c7',
  },
  R23: {
    id: 'R23',
    name: 'R-23 (Fluoroform)',
    category: 'HFC',
    formula: 'CHF₃',
    safetyClass: 'A1',
    nbpC: -82.1,
    tcritC: 25.9,
    pcritBar: 48.3,
    hcritKjKg: 340.0,
    gwp: 14800,
    odp: 0,
    typicalUse: 'Freezer Biomedis & Farmasi Vaksin Suhu Sangat Rendah (-80°C)',
    color: '#38bdf8',
  },
  R1270: {
    id: 'R1270',
    name: 'R-1270 (Propilena / Propena)',
    category: 'Hydrocarbon',
    formula: 'C₃H₆',
    safetyClass: 'A3',
    nbpC: -47.6,
    tcritC: 92.4,
    pcritBar: 46.6,
    hcritKjKg: 580.0,
    gwp: 2,
    odp: 0,
    typicalUse: 'Refrigerasi Suhu Rendah Industri Petrokimia',
    color: '#10b981',
  },
  R41: {
    id: 'R41',
    name: 'R-41 (Fluorometana)',
    category: 'HFC',
    formula: 'CH₃F',
    safetyClass: 'A2 (Flammable Rendah)',
    nbpC: -78.1,
    tcritC: 44.1,
    pcritBar: 58.9,
    hcritKjKg: 450.0,
    gwp: 92,
    odp: 0,
    typicalUse: 'Aplikasi Pendinginan Khusus & Semikonduktor',
    color: '#38bdf8',
  },
  R114: {
    id: 'R114',
    name: 'R-114 (Diklorotetrafluoroetana)',
    category: 'CFC',
    formula: 'CClF₂CClF₂',
    safetyClass: 'A1 (Non-toksik, non-flammable)',
    nbpC: 3.8,
    tcritC: 145.7,
    pcritBar: 32.6,
    hcritKjKg: 345.0,
    gwp: 8590,
    odp: 1.0,
    typicalUse: 'Chiller Kapal Selam Angkatan Laut & Heat Pump Industri Suhu Tinggi',
    color: '#94a3b8',
  },
  R12: {
    id: 'R12',
    name: 'R-12 (Diklorodifluorometana)',
    category: 'CFC',
    formula: 'CCl₂F₂',
    safetyClass: 'A1',
    nbpC: -29.8,
    tcritC: 112.0,
    pcritBar: 41.4,
    hcritKjKg: 355.0,
    gwp: 10200,
    odp: 1.0,
    typicalUse: 'Standar Historis Otomotif & Kulkas Klasik (Referensi Studi)',
    color: '#a1a1aa',
  },
};

// Thermodynamic coefficients for saturation and property fits
interface RefCurveData {
  A: number; // Antoine A
  B: number; // Antoine B
  C: number; // Antoine C
  k: number; // cp/cv
  hf0: number; // kJ/kg at 0°C
  cpf: number; // liquid cp kJ/kg.K
  hfg0: number; // latent heat at 0°C kJ/kg
  dhfg_dT: number;
  cpg: number; // vapor cp kJ/kg.K
  v0: number; // m3/kg vapor base
}

const THERMO_CURVES: Record<ExtendedRefrigerantId, RefCurveData> = {
  R134a: {
    // ASHRAE 1988/2020: NBP=-26.1°C, Psat(0°C)=2.928 bar, Psat(40°C)=10.166 bar
    A: 4.1963,
    B: 881.7,
    C: 236.4,
    k: 1.12,
    hf0: 200.0,
    cpf: 1.41,
    hfg0: 198.6,
    dhfg_dT: -0.89,
    cpg: 0.96,
    v0: 0.071,
  },
  R410A: {
    // NBP=-51.4°C, Psat(0°C)=7.986 bar, Psat(40°C)=24.23 bar
    A: 4.1566,
    B: 748.5,
    C: 230.0,
    k: 1.17,
    hf0: 200.0,
    cpf: 1.75,
    hfg0: 220.0,
    dhfg_dT: -1.72,
    cpg: 1.25,
    v0: 0.028,
  },
  R32: {
    // ASHRAE / NIST REFPROP: NBP=-51.7°C, Psat(0°C)=8.13 bar, Psat(40°C)=24.78 bar
    A: 4.1168,
    B: 721.5,
    C: 225.0,
    k: 1.25,
    hf0: 200.0,
    cpf: 2.15,
    hfg0: 319.8, // Latent heat of vaporization at 0°C (kJ/kg)
    dhfg_dT: -2.35,
    cpg: 1.35,
    v0: 0.0467, // Saturated vapor volume at 0°C (m3/kg)
  },
  R404A: {
    // NBP=-46.2°C, Psat(-20°C)=3.00 bar, Psat(0°C)=6.04 bar, Psat(40°C)=18.26 bar
    A: 4.0245,
    B: 746.0,
    C: 230.0,
    k: 1.14,
    hf0: 200.0,
    cpf: 1.54,
    hfg0: 160.0,
    dhfg_dT: -1.35,
    cpg: 1.05,
    v0: 0.032,
  },
  R448A: {
    // R-448A (Solstice N40): NBP=-45.9°C, Psat(-20°C)=2.44 bar, Psat(0°C)=5.32 bar, Psat(40°C)=18.82 bar
    A: 4.2480,
    B: 885.6,
    C: 246.2,
    k: 1.15,
    hf0: 200.0,
    cpf: 1.54,
    hfg0: 188.5,
    dhfg_dT: -1.18,
    cpg: 1.12,
    v0: 0.043,
  },
  R717: {
    // Ammonia (NH3): NBP=-33.3°C, Psat(0°C)=4.29 bar, Psat(40°C)=15.55 bar
    A: 4.4765,
    B: 903.4,
    C: 235.0,
    k: 1.31,
    hf0: 200.0,
    cpf: 4.75,
    hfg0: 1262.0,
    dhfg_dT: -3.85,
    cpg: 2.25,
    v0: 0.28,
  },
  R744: {
    // CO2 (Carbon Dioxide): NBP=-78.4°C, Psat(-20°C)=19.7 bar, Psat(0°C)=34.85 bar
    A: 4.3476,
    B: 673.3,
    C: 240.0,
    k: 1.30,
    hf0: 200.0,
    cpf: 2.3,
    hfg0: 231.0,
    dhfg_dT: -2.1,
    cpg: 1.15,
    v0: 0.018,
  },
  R290: {
    // Propane: NBP=-42.1°C, Psat(0°C)=4.74 bar, Psat(40°C)=13.69 bar
    A: 3.8538,
    B: 750.0,
    C: 236.0,
    k: 1.15,
    hf0: 200.0,
    cpf: 2.65,
    hfg0: 374.0,
    dhfg_dT: -1.82,
    cpg: 1.75,
    v0: 0.095,
  },
  R600a: {
    // Isobutane: NBP=-11.7°C, Psat(0°C)=1.57 bar, Psat(40°C)=5.31 bar
    A: 3.874,
    B: 875.4,
    C: 238.0,
    k: 1.11,
    hf0: 200.0,
    cpf: 2.45,
    hfg0: 360.0,
    dhfg_dT: -1.75,
    cpg: 1.68,
    v0: 0.15,
  },
  R22: {
    // HCFC-22: NBP=-40.8°C, Psat(0°C)=4.98 bar, Psat(40°C)=15.34 bar
    A: 4.0559,
    B: 789.3,
    C: 235.0,
    k: 1.18,
    hf0: 200.0,
    cpf: 1.36,
    hfg0: 205.0,
    dhfg_dT: -1.3,
    cpg: 0.88,
    v0: 0.045,
  },
  R507A: {
    // R507A: NBP=-47.1°C, Psat(0°C)=6.20 bar, Psat(40°C)=18.72 bar
    A: 4.0324,
    B: 745.2,
    C: 230.0,
    k: 1.14,
    hf0: 200.0,
    cpf: 1.55,
    hfg0: 158.0,
    dhfg_dT: -1.35,
    cpg: 1.06,
    v0: 0.024,
  },
  R407C: {
    // R407C: NBP=-43.8°C, Psat(0°C)=5.25 bar, Psat(40°C)=16.35 bar
    A: 4.0542,
    B: 773.5,
    C: 232.0,
    k: 1.16,
    hf0: 200.0,
    cpf: 1.52,
    hfg0: 190.0,
    dhfg_dT: -1.45,
    cpg: 1.08,
    v0: 0.034,
  },
  R1234yf: {
    // R1234yf: NBP=-29.5°C, Psat(0°C)=3.15 bar, Psat(40°C)=10.15 bar
    A: 4.0303,
    B: 840.7,
    C: 238.0,
    k: 1.11,
    hf0: 200.0,
    cpf: 1.40,
    hfg0: 145.0,
    dhfg_dT: -1.15,
    cpg: 0.98,
    v0: 0.038,
  },
  R1234ze: {
    // R1234ze: NBP=-19.0°C, Psat(0°C)=2.17 bar, Psat(40°C)=7.66 bar
    A: 4.1719,
    B: 920.5,
    C: 240.0,
    k: 1.12,
    hf0: 200.0,
    cpf: 1.39,
    hfg0: 165.0,
    dhfg_dT: -1.2,
    cpg: 0.95,
    v0: 0.042,
  },
  R23: {
    // R23: NBP=-82.1°C, Psat(-40°C)=7.15 bar, Psat(0°C)=25.40 bar
    A: 4.2258,
    B: 691.2,
    C: 245.0,
    k: 1.18,
    hf0: 200.0,
    cpf: 1.45,
    hfg0: 175.0,
    dhfg_dT: -1.4,
    cpg: 0.85,
    v0: 0.035,
  },
  R1270: {
    // R1270: NBP=-47.6°C, Psat(0°C)=5.85 bar, Psat(40°C)=16.50 bar
    A: 3.8742,
    B: 733.3,
    C: 236.0,
    k: 1.16,
    hf0: 200.0,
    cpf: 2.7,
    hfg0: 365.0,
    dhfg_dT: -1.85,
    cpg: 1.78,
    v0: 0.088,
  },
  R41: {
    // Fluoromethane: NBP=-78.1°C, Psat(0°C)=18.2 bar, Psat(30°C)=40.5 bar
    A: 4.150,
    B: 660.0,
    C: 240.0,
    k: 1.22,
    hf0: 200.0,
    cpf: 1.82,
    hfg0: 280.0,
    dhfg_dT: -2.0,
    cpg: 1.15,
    v0: 0.035,
  },
  R114: {
    // Dichlorotetrafluoroethane: NBP=3.8°C, Psat(0°C)=0.88 bar, Psat(40°C)=3.45 bar
    A: 4.020,
    B: 990.0,
    C: 235.0,
    k: 1.09,
    hf0: 200.0,
    cpf: 1.01,
    hfg0: 136.0,
    dhfg_dT: -0.65,
    cpg: 0.72,
    v0: 0.12,
  },
  R12: {
    // CFC-12: NBP=-29.8°C, Psat(0°C)=3.08 bar, Psat(40°C)=9.60 bar
    A: 3.985,
    B: 880.0,
    C: 240.0,
    k: 1.13,
    hf0: 200.0,
    cpf: 0.98,
    hfg0: 165.0,
    dhfg_dT: -0.92,
    cpg: 0.65,
    v0: 0.055,
  },
};

// =========================================================================
// AUTHENTIC THERMODYNAMIC PROPERTIES TABLE FOR R-32 (DIFLUOROMETHANE CH2F2)
// Reference: NIST REFPROP / ASHRAE Fundamentals Handbook
// Standard IIR Reference State: hf = 200.0 kJ/kg, sf = 1.000 kJ/(kg·K) at 0°C
// Critical Point: Tcrit = 78.11°C, Pcrit = 57.82 bar, hcrit = 456.0 kJ/kg
// =========================================================================
export interface SaturatedStatePoint {
  tC: number;
  pBar: number;
  hf: number;  // Saturated liquid enthalpy (kJ/kg)
  hg: number;  // Saturated vapor enthalpy (kJ/kg)
  vl: number;  // Saturated liquid specific volume (dm3/kg or L/kg)
  vg: number;  // Saturated vapor specific volume (m3/kg)
}

export const R32_SATURATION_TABLE: SaturatedStatePoint[] = [
  { tC: -60,   pBar: 0.655, hf: 91.2,  hg: 492.3, vl: 0.713, vg: 0.4850 },
  { tC: -55,   pBar: 0.854, hf: 99.8,  hg: 495.0, vl: 0.721, vg: 0.3800 },
  { tC: -50,   pBar: 1.104, hf: 108.5, hg: 497.6, vl: 0.730, vg: 0.3015 },
  { tC: -45,   pBar: 1.405, hf: 117.1, hg: 500.2, vl: 0.739, vg: 0.2418 },
  { tC: -40,   pBar: 1.766, hf: 125.7, hg: 502.8, vl: 0.748, vg: 0.1947 },
  { tC: -35,   pBar: 2.196, hf: 134.5, hg: 505.3, vl: 0.757, vg: 0.1585 },
  { tC: -30,   pBar: 2.704, hf: 143.3, hg: 507.8, vl: 0.767, vg: 0.1306 },
  { tC: -25,   pBar: 3.298, hf: 152.3, hg: 510.1, vl: 0.778, vg: 0.1085 },
  { tC: -20,   pBar: 3.978, hf: 161.4, hg: 512.4, vl: 0.789, vg: 0.0903 },
  { tC: -15,   pBar: 4.770, hf: 170.7, hg: 514.5, vl: 0.801, vg: 0.0759 },
  { tC: -10,   pBar: 5.688, hf: 180.2, hg: 516.4, vl: 0.813, vg: 0.0642 },
  { tC: -5,    pBar: 6.745, hf: 189.9, hg: 518.2, vl: 0.827, vg: 0.0546 },
  { tC: 0,     pBar: 7.954, hf: 200.0, hg: 519.8, vl: 0.841, vg: 0.0467 },
  { tC: 5,     pBar: 9.336, hf: 210.3, hg: 521.2, vl: 0.857, vg: 0.0401 },
  { tC: 10,    pBar: 10.90, hf: 221.0, hg: 522.4, vl: 0.874, vg: 0.0346 },
  { tC: 15,    pBar: 12.68, hf: 232.0, hg: 523.3, vl: 0.893, vg: 0.0299 },
  { tC: 20,    pBar: 14.67, hf: 243.5, hg: 523.8, vl: 0.914, vg: 0.0259 },
  { tC: 25,    pBar: 16.90, hf: 255.4, hg: 524.1, vl: 0.937, vg: 0.0225 },
  { tC: 30,    pBar: 19.39, hf: 268.0, hg: 523.9, vl: 0.963, vg: 0.0195 },
  { tC: 35,    pBar: 22.15, hf: 281.2, hg: 523.3, vl: 0.993, vg: 0.0170 },
  { tC: 40,    pBar: 25.21, hf: 295.3, hg: 522.2, vl: 1.028, vg: 0.0147 },
  { tC: 45,    pBar: 28.60, hf: 310.4, hg: 520.4, vl: 1.070, vg: 0.0128 },
  { tC: 50,    pBar: 32.33, hf: 326.8, hg: 517.6, vl: 1.121, vg: 0.0110 },
  { tC: 55,    pBar: 36.45, hf: 344.8, hg: 513.6, vl: 1.185, vg: 0.0094 },
  { tC: 60,    pBar: 40.99, hf: 365.3, hg: 508.0, vl: 1.269, vg: 0.0080 },
  { tC: 65,    pBar: 46.03, hf: 389.5, hg: 499.7, vl: 1.393, vg: 0.0066 },
  { tC: 70,    pBar: 51.68, hf: 419.0, hg: 486.0, vl: 1.615, vg: 0.0052 },
  { tC: 75,    pBar: 56.40, hf: 448.0, hg: 465.0, vl: 2.150, vg: 0.0038 },
  { tC: 78.11, pBar: 57.82, hf: 456.0, hg: 456.0, vl: 2.350, vg: 0.0023 },
];

/**
 * Interpolate R32 thermodynamic saturation state from Temperature (°C)
 */
export function interpolateR32ByTemp(tempC: number): SaturatedStatePoint {
  const t = Math.max(-60, Math.min(78.11, tempC));
  for (let i = 0; i < R32_SATURATION_TABLE.length - 1; i++) {
    const p1 = R32_SATURATION_TABLE[i];
    const p2 = R32_SATURATION_TABLE[i + 1];
    if (t >= p1.tC && t <= p2.tC) {
      const frac = (t - p1.tC) / (p2.tC - p1.tC);
      return {
        tC: t,
        pBar: Math.round((p1.pBar + frac * (p2.pBar - p1.pBar)) * 100) / 100,
        hf: Math.round((p1.hf + frac * (p2.hf - p1.hf)) * 10) / 10,
        hg: Math.round((p1.hg + frac * (p2.hg - p1.hg)) * 10) / 10,
        vl: Math.round((p1.vl + frac * (p2.vl - p1.vl)) * 1000) / 1000,
        vg: Math.round((p1.vg + frac * (p2.vg - p1.vg)) * 10000) / 10000,
      };
    }
  }
  return R32_SATURATION_TABLE[R32_SATURATION_TABLE.length - 1];
}

/**
 * Interpolate R32 thermodynamic saturation state from Pressure (bar)
 */
export function interpolateR32ByPressure(pBar: number): SaturatedStatePoint {
  const p = Math.max(0.655, Math.min(57.82, pBar));
  for (let i = 0; i < R32_SATURATION_TABLE.length - 1; i++) {
    const p1 = R32_SATURATION_TABLE[i];
    const p2 = R32_SATURATION_TABLE[i + 1];
    if (p >= p1.pBar && p <= p2.pBar) {
      const frac = (p - p1.pBar) / (p2.pBar - p1.pBar);
      return {
        tC: Math.round((p1.tC + frac * (p2.tC - p1.tC)) * 10) / 10,
        pBar: p,
        hf: Math.round((p1.hf + frac * (p2.hf - p1.hf)) * 10) / 10,
        hg: Math.round((p1.hg + frac * (p2.hg - p1.hg)) * 10) / 10,
        vl: Math.round((p1.vl + frac * (p2.vl - p1.vl)) * 1000) / 1000,
        vg: Math.round((p1.vg + frac * (p2.vg - p1.vg)) * 10000) / 10000,
      };
    }
  }
  return {
    tC: 78.11,
    pBar: 57.82,
    hf: 456.0,
    hg: 456.0,
    vl: 2.35,
    vg: 0.0023,
  };
}

/**
 * Saturation pressure in bar at T (°C)
 * Smoothly anchors to authentic Critical Pressure (pcritBar) at Critical Temperature (tcritC)
 */
export function getRefSaturationPressure(refId: ExtendedRefrigerantId, tempC: number): number {
  if (refId === 'R32') {
    return interpolateR32ByTemp(tempC).pBar;
  }
  const meta = EXTENDED_REFRIGERANTS[refId];
  const tcrit = meta.tcritC;
  const pcrit = meta.pcritBar;

  if (tempC >= tcrit) {
    return pcrit;
  }

  const p = THERMO_CURVES[refId];
  const logP = p.A - p.B / (tempC + p.C);
  const pAnt = Math.pow(10, logP);

  // Smoothly blend Antoine curve to exact pcrit at tcrit
  const logPcritAnt = p.A - p.B / (tcrit + p.C);
  const pAntCrit = Math.pow(10, logPcritAnt);
  const ratio = pcrit / Math.max(0.1, pAntCrit);

  if (tempC > 0 && Math.abs(ratio - 1) > 0.001) {
    const u = Math.min(1, Math.max(0, tempC / tcrit));
    const factor = 1 + (ratio - 1) * Math.pow(u, 2.5);
    return Math.min(pcrit, Math.max(0.05, pAnt * factor));
  }

  return Math.min(pcrit, Math.max(0.05, pAnt));
}

/**
 * Saturation temperature in °C at pressure (bar)
 * Clamps smoothly to Critical Temperature (tcritC) at pcritBar
 */
export function getRefSaturationTemp(refId: ExtendedRefrigerantId, pBar: number): number {
  if (refId === 'R32') {
    return interpolateR32ByPressure(pBar).tC;
  }
  const meta = EXTENDED_REFRIGERANTS[refId];
  const tcrit = meta.tcritC;
  const pcrit = meta.pcritBar;

  if (pBar >= pcrit) {
    return tcrit;
  }

  const p = THERMO_CURVES[refId];
  if (!p) return 0;
  const safeP = Math.max(0.05, Math.min(pcrit * 0.999, pBar));
  const logP = Math.log10(safeP);
  const denominator = p.A - logP;
  if (Math.abs(denominator) < 1e-4) return tcrit;
  const tempC = p.B / denominator - p.C;
  return Math.min(tcrit, Math.round(tempC * 10) / 10);
}

export function barToPsi(bar: number): number {
  return bar * 14.5038;
}

export function psiToBar(psi: number): number {
  return psi / 14.5038;
}

export function barToKpa(bar: number): number {
  return bar * 100;
}

export function kpaToBar(kpa: number): number {
  return kpa / 100;
}

/**
 * Saturated liquid enthalpy hf (kJ/kg)
 * Formulated to strictly converge to authentic critical enthalpy hcritKjKg at tcritC
 * using the universal Guggenheim / Cailletet-Mathias scaling laws.
 */
export function getRefLiquidEnthalpy(refId: ExtendedRefrigerantId, tempC: number): number {
  if (refId === 'R32') {
    return interpolateR32ByTemp(tempC).hf;
  }
  const p = THERMO_CURVES[refId];
  const meta = EXTENDED_REFRIGERANTS[refId];
  const tcrit = meta.tcritC;
  const hcrit = meta.hcritKjKg;

  if (tempC >= tcrit) {
    return hcrit;
  }

  // Linear mean enthalpy passing through (0°C, hf0 + hfg0/2) and (tcrit, hcrit)
  const hmid0 = p.hf0 + p.hfg0 / 2;
  const hmid = hmid0 + (tempC / tcrit) * (hcrit - hmid0);

  // Latent heat of vaporization following Guggenheim scaling law: deltaH = hfg0 * ((tcrit - T) / tcrit)^0.38
  const tr = Math.max(0, (tcrit - tempC) / tcrit);
  const deltaH = p.hfg0 * Math.pow(tr, 0.38);

  const hf = hmid - 0.5 * deltaH;
  return Math.round(hf * 10) / 10;
}

/**
 * Saturated vapor enthalpy hg (kJ/kg)
 * Formulated to strictly converge to authentic critical enthalpy hcritKjKg at tcritC
 */
export function getRefVaporEnthalpy(refId: ExtendedRefrigerantId, tempC: number): number {
  if (refId === 'R32') {
    return interpolateR32ByTemp(tempC).hg;
  }
  const p = THERMO_CURVES[refId];
  const meta = EXTENDED_REFRIGERANTS[refId];
  const tcrit = meta.tcritC;
  const hcrit = meta.hcritKjKg;

  if (tempC >= tcrit) {
    return hcrit;
  }

  const hmid0 = p.hf0 + p.hfg0 / 2;
  const hmid = hmid0 + (tempC / tcrit) * (hcrit - hmid0);

  const tr = Math.max(0, (tcrit - tempC) / tcrit);
  const deltaH = p.hfg0 * Math.pow(tr, 0.38);

  const hg = hmid + 0.5 * deltaH;
  return Math.round(hg * 10) / 10;
}

/**
 * Specific volume of saturated vapor vg (m3/kg)
 */
export function getRefVaporSpecificVolume(refId: ExtendedRefrigerantId, tempC: number): number {
  if (refId === 'R32') {
    return interpolateR32ByTemp(tempC).vg;
  }
  const p = THERMO_CURVES[refId];
  const tK = tempC + 273.15;
  const pBar = getRefSaturationPressure(refId, tempC);
  return Math.max(0.003, (p.v0 * (tK / 273.15)) / (pBar / 3.0));
}

/**
 * Liquid specific volume Vl (dm3/kg or L/kg) at given temperature
 * 1 dm3/kg = 1 L/kg = 0.001 m3/kg = 1000 / rho (kg/m3)
 */
export function getRefLiquidSpecificVolume(refId: ExtendedRefrigerantId, tempC: number): number {
  if (refId === 'R32') {
    return interpolateR32ByTemp(tempC).vl;
  }
  const baseDensity: Record<ExtendedRefrigerantId, { rho0: number; beta: number }> = {
    R134a: { rho0: 1295, beta: 0.0028 },
    R410A: { rho0: 1170, beta: 0.0039 },
    R32: { rho0: 1060, beta: 0.0036 },
    R404A: { rho0: 1150, beta: 0.0035 },
    R448A: { rho0: 1205, beta: 0.0031 },
    R717: { rho0: 638, beta: 0.0024 },
    R744: { rho0: 928, beta: 0.0072 },
    R290: { rho0: 528, beta: 0.0025 },
    R600a: { rho0: 580, beta: 0.0020 },
    R22: { rho0: 1285, beta: 0.0027 },
    R507A: { rho0: 1150, beta: 0.0036 },
    R407C: { rho0: 1240, beta: 0.0030 },
    R1234yf: { rho0: 1175, beta: 0.0028 },
    R1234ze: { rho0: 1240, beta: 0.0025 },
    R23: { rho0: 1180, beta: 0.0045 },
    R41: { rho0: 980, beta: 0.0040 },
    R114: { rho0: 1520, beta: 0.0019 },
    R12: { rho0: 1390, beta: 0.0022 },
    R1270: { rho0: 545, beta: 0.0026 },
  };

  const d = baseDensity[refId] ?? { rho0: 1200, beta: 0.003 };
  const rho = Math.max(200, d.rho0 * (1 - d.beta * tempC));
  return 1000 / rho;
}

/**
 * Superheated Vapor Enthalpy h(P, T) in kJ/kg
 * Evaluates real-gas enthalpy in superheated and supercritical regions
 */
export function getRefSuperheatedEnthalpy(
  refId: ExtendedRefrigerantId,
  pBar: number,
  tempC: number
): number {
  const meta = EXTENDED_REFRIGERANTS[refId];
  const tcrit = meta.tcritC;
  const pcrit = meta.pcritBar;
  const hcrit = meta.hcritKjKg;
  const curve = THERMO_CURVES[refId] ?? THERMO_CURVES.R410A;

  if (pBar >= pcrit) {
    // Supercritical fluid region (P >= Pcrit)
    const deltaT = tempC - tcrit;
    const pRatio = Math.max(1, pBar / pcrit);
    const h = hcrit + curve.cpg * deltaT - (pRatio - 1) * 2.2;
    return Math.round(h * 10) / 10;
  }

  const tSat = getRefSaturationTemp(refId, pBar);
  const hgSat = getRefVaporEnthalpy(refId, tSat);

  if (tempC <= tSat) {
    // Falls into subcooled or saturated mixture
    return getRefSubcooledEnthalpy(refId, pBar, tempC);
  }

  const deltaT = tempC - tSat;

  if (refId === 'R32') {
    const cpVapor = 1.30 + 0.022 * Math.pow(Math.min(55, pBar), 0.9) - 0.0005 * deltaT;
    return Math.round((hgSat + cpVapor * deltaT) * 10) / 10;
  }

  return Math.round((hgSat + curve.cpg * deltaT) * 10) / 10;
}

/**
 * Subcooled Liquid Enthalpy h(P, T) in kJ/kg
 * Evaluates liquid enthalpy with Poynting work correction
 */
export function getRefSubcooledEnthalpy(
  refId: ExtendedRefrigerantId,
  pBar: number,
  tempC: number
): number {
  const meta = EXTENDED_REFRIGERANTS[refId];
  const tcrit = meta.tcritC;
  const safeTemp = Math.min(tcrit - 0.1, tempC);
  const hf = getRefLiquidEnthalpy(refId, safeTemp);
  const pSat = getRefSaturationPressure(refId, safeTemp);
  const vlDm3Kg = getRefLiquidSpecificVolume(refId, safeTemp);
  const deltaP = Math.max(0, pBar - pSat);
  const poyntingWork = vlDm3Kg * deltaP * 0.1;
  return Math.round((hf + poyntingWork) * 10) / 10;
}

export interface StandardChartSpec {
  hMin: number;
  hMax: number;
  hStep: number;
  pMin: number;
  pMax: number;
  pTicks: number[];
  sValues: number[];
  vValues: number[];
  tValues: number[];
  Rs: number; // specific gas constant J/(kg·K)
}

export const STANDARD_CHART_SPECS: Record<ExtendedRefrigerantId, StandardChartSpec> = {
  R410A: {
    hMin: 100,
    hMax: 650,
    hStep: 50,
    pMin: 0.40,
    pMax: 45.0,
    pTicks: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 15.0, 20.0, 30.0, 40.0],
    sValues: [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1],
    vValues: [0.005, 0.006, 0.007, 0.008, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.15, 0.2, 0.3, 0.4, 0.6, 0.8, 1.0],
    tValues: [-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 220],
    Rs: 114.5,
  },
  R32: {
    hMin: 100,
    hMax: 650,
    hStep: 50,
    pMin: 0.40,
    pMax: 60.0,
    pTicks: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 15.0, 20.0, 30.0, 40.0, 50.0, 60.0],
    sValues: [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2],
    vValues: [0.005, 0.007, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.07, 0.1, 0.15, 0.2, 0.3, 0.5, 0.7, 1.0],
    tValues: [-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 220],
    Rs: 159.8,
  },
  R134a: {
    hMin: 100,
    hMax: 550,
    hStep: 50,
    pMin: 0.20,
    pMax: 35.0,
    pTicks: [0.2, 0.3, 0.4, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 35.0],
    sValues: [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1],
    vValues: [0.008, 0.01, 0.015, 0.02, 0.03, 0.05, 0.08, 0.12, 0.2, 0.35, 0.6, 1.0],
    tValues: [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180],
    Rs: 81.5,
  },
  R404A: {
    hMin: 100,
    hMax: 550,
    hStep: 50,
    pMin: 0.40,
    pMax: 40.0,
    pTicks: [0.4, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 40.0],
    sValues: [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0],
    vValues: [0.005, 0.008, 0.01, 0.015, 0.02, 0.03, 0.05, 0.08, 0.12, 0.2, 0.35, 0.6],
    tValues: [-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160],
    Rs: 85.2,
  },
  R448A: {
    hMin: 100,
    hMax: 600,
    hStep: 50,
    pMin: 0.40,
    pMax: 45.0,
    pTicks: [0.4, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 45.0],
    sValues: [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0],
    vValues: [0.006, 0.01, 0.015, 0.02, 0.03, 0.05, 0.08, 0.12, 0.2, 0.35, 0.6],
    tValues: [-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160],
    Rs: 96.4,
  },
  R717: {
    hMin: 0,
    hMax: 1800,
    hStep: 200,
    pMin: 0.20,
    pMax: 80.0,
    pTicks: [0.2, 0.4, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 50.0, 80.0],
    sValues: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5],
    vValues: [0.02, 0.05, 0.1, 0.2, 0.35, 0.5, 0.8, 1.2, 2.0, 3.5],
    tValues: [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 80, 100, 120, 140, 160, 180, 200],
    Rs: 488.2,
  },
  R744: {
    hMin: 50,
    hMax: 550,
    hStep: 50,
    pMin: 5.0,
    pMax: 95.0,
    pTicks: [5, 7, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90],
    sValues: [0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2],
    vValues: [0.002, 0.003, 0.005, 0.008, 0.012, 0.02, 0.035, 0.06, 0.1],
    tValues: [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 80, 100, 120, 140],
    Rs: 188.9,
  },
  R290: {
    hMin: 100,
    hMax: 800,
    hStep: 100,
    pMin: 0.30,
    pMax: 45.0,
    pTicks: [0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 45.0],
    sValues: [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8],
    vValues: [0.01, 0.015, 0.025, 0.04, 0.07, 0.12, 0.2, 0.35, 0.6, 1.0],
    tValues: [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160],
    Rs: 188.5,
  },
  R600a: {
    hMin: 100,
    hMax: 750,
    hStep: 100,
    pMin: 0.10,
    pMax: 35.0,
    pTicks: [0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 35.0],
    sValues: [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8],
    vValues: [0.015, 0.025, 0.04, 0.07, 0.12, 0.2, 0.35, 0.6, 1.0, 1.8],
    tValues: [-40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160],
    Rs: 143.1,
  },
  R22: {
    hMin: 100,
    hMax: 600,
    hStep: 50,
    pMin: 0.30,
    pMax: 45.0,
    pTicks: [0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 45.0],
    sValues: [0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2],
    vValues: [0.008, 0.012, 0.02, 0.035, 0.06, 0.1, 0.18, 0.3, 0.5, 0.9],
    tValues: [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160],
    Rs: 96.1,
  },
  R507A: {
    hMin: 100,
    hMax: 550,
    hStep: 50,
    pMin: 0.40,
    pMax: 40.0,
    pTicks: [0.4, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 40.0],
    sValues: [0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0],
    vValues: [0.005, 0.008, 0.012, 0.02, 0.035, 0.06, 0.1, 0.18, 0.3, 0.5],
    tValues: [-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140],
    Rs: 84.1,
  },
  R407C: {
    hMin: 100,
    hMax: 600,
    hStep: 50,
    pMin: 0.40,
    pMax: 45.0,
    pTicks: [0.4, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 45.0],
    sValues: [0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0],
    vValues: [0.006, 0.01, 0.015, 0.025, 0.04, 0.07, 0.12, 0.2, 0.35, 0.6],
    tValues: [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160],
    Rs: 96.4,
  },
  R1234yf: {
    hMin: 100,
    hMax: 550,
    hStep: 50,
    pMin: 0.20,
    pMax: 35.0,
    pTicks: [0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 35.0],
    sValues: [0.7, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0],
    vValues: [0.008, 0.012, 0.02, 0.035, 0.06, 0.1, 0.18, 0.3, 0.5],
    tValues: [-40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140],
    Rs: 72.9,
  },
  R1234ze: {
    hMin: 100,
    hMax: 550,
    hStep: 50,
    pMin: 0.20,
    pMax: 35.0,
    pTicks: [0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 35.0],
    sValues: [0.7, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0],
    vValues: [0.008, 0.012, 0.02, 0.035, 0.06, 0.1, 0.18, 0.3, 0.5],
    tValues: [-40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140],
    Rs: 72.9,
  },
  R23: {
    hMin: 50,
    hMax: 450,
    hStep: 50,
    pMin: 0.20,
    pMax: 50.0,
    pTicks: [0.2, 0.4, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 50.0],
    sValues: [0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8],
    vValues: [0.003, 0.006, 0.01, 0.02, 0.04, 0.08, 0.15, 0.3],
    tValues: [-90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 40, 60],
    Rs: 118.8,
  },
  R41: {
    hMin: 50,
    hMax: 550,
    hStep: 50,
    pMin: 0.40,
    pMax: 60.0,
    pTicks: [0.4, 0.6, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 40.0, 60.0],
    sValues: [0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9, 2.1],
    vValues: [0.005, 0.008, 0.015, 0.03, 0.06, 0.12, 0.25],
    tValues: [-80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 60, 80],
    Rs: 244.3,
  },
  R114: {
    hMin: 100,
    hMax: 500,
    hStep: 50,
    pMin: 0.10,
    pMax: 35.0,
    pTicks: [0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 35.0],
    sValues: [0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8],
    vValues: [0.01, 0.02, 0.04, 0.08, 0.15, 0.3, 0.6],
    tValues: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 100, 120, 140],
    Rs: 48.6,
  },
  R12: {
    hMin: 100,
    hMax: 550,
    hStep: 50,
    pMin: 0.20,
    pMax: 40.0,
    pTicks: [0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 40.0],
    sValues: [0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0],
    vValues: [0.008, 0.015, 0.03, 0.06, 0.12, 0.25, 0.5],
    tValues: [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140],
    Rs: 68.8,
  },
  R1270: {
    hMin: 100,
    hMax: 800,
    hStep: 100,
    pMin: 0.30,
    pMax: 45.0,
    pTicks: [0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 45.0],
    sValues: [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6],
    vValues: [0.01, 0.02, 0.04, 0.07, 0.12, 0.2, 0.35, 0.6],
    tValues: [-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140],
    Rs: 197.6,
  },
};

/**
 * Generate full saturation dome points for SVG P-h plotting.
 * Accurately spans from the bottom boundary pressure (pMin) up to the critical point apex.
 */
export function generateRefSaturationDome(refId: ExtendedRefrigerantId): Array<{
  tempC: number;
  pBar: number;
  hf: number;
  hg: number;
}> {
  const meta = EXTENDED_REFRIGERANTS[refId];
  const spec = STANDARD_CHART_SPECS[refId] ?? STANDARD_CHART_SPECS.R410A;
  const pBottom = spec.pMin;
  const tMin = Math.max(-100, getRefSaturationTemp(refId, pBottom));
  const tcrit = meta.tcritC;
  const pcrit = meta.pcritBar;
  const hcrit = meta.hcritKjKg;

  const dome: Array<{ tempC: number; pBar: number; hf: number; hg: number }> = [];
  const steps = 52;

  for (let i = 0; i < steps; i++) {
    // Non-linear progress u in [0, 1) with power clustering towards apex
    // Ensures fine point distribution close to critical point for silky-smooth dome curvature
    const u = i / steps;
    const uT = 1 - Math.pow(1 - u, 1.8);
    const t = tMin + uT * (tcrit - 0.05 - tMin);
    const pBar = getRefSaturationPressure(refId, t);
    const hf = getRefLiquidEnthalpy(refId, t);
    const hg = getRefVaporEnthalpy(refId, t);
    dome.push({
      tempC: Math.round(t * 10) / 10,
      pBar: Math.round(pBar * 100) / 100,
      hf: Math.round(hf * 10) / 10,
      hg: Math.round(hg * 10) / 10,
    });
  }

  // Exact Critical Point Apex (hf = hg = hcrit, pBar = pcrit)
  dome.push({
    tempC: tcrit,
    pBar: pcrit,
    hf: Math.round(hcrit * 10) / 10,
    hg: Math.round(hcrit * 10) / 10,
  });

  return dome;
}

/**
 * Calculate full thermodynamic refrigeration cycle
 * Supports:
 * - Direct Field Measurements: Suction Pressure, Discharge Pressure, Point 1 (Suction Temp), Point 2 (Discharge Temp), Point 3 (Liquid Temp)
 * - Theoretical Design: Evaporating & Condensing Saturation Temperatures (Te, Tc, Superheat, Subcooling)
 */
export function calculatePhRefrigerationCycle(params: {
  refrigerantId: ExtendedRefrigerantId;
  inputMode?: 'direct_measurements' | 'saturation_temperatures';
  // Direct field measurement inputs:
  suctionPressureBar?: number;
  dischargePressureBar?: number;
  suctionTempC?: number;    // Point 1: Suction temperature (°C)
  dischargeTempC?: number;  // Point 2: Discharge temperature (°C)
  liquidTempC?: number;     // Point 3: Liquid temperature before expansion (°C)
  compressorPowerKw?: number; // Power Compressor in kW

  // Theoretical saturation inputs:
  teC?: number;             // Evaporation temperature (°C)
  tcC?: number;             // Condensation temperature (°C)
  superheatK?: number;      // Superheating at evaporator exit (K or °C)
  subcoolingK?: number;     // Subcooling at condenser exit (K or °C)

  coolingCapacityKw?: number;   // Evaporator load (kW)
  isentropicEfficiency?: number; // Compressor isentropic efficiency (default 0.78 - 0.82)
  clearanceRatio?: number;      // Clearance ratio c (default 0.04)
}): PhCycleResult {
  const {
    refrigerantId,
    inputMode = 'direct_measurements',
    coolingCapacityKw = 20,
    clearanceRatio = 0.04,
  } = params;

  const meta = EXTENDED_REFRIGERANTS[refrigerantId];
  const curve = THERMO_CURVES[refrigerantId];

  let peBar: number;
  let pcBar: number;
  let teC: number;
  let tcC: number;
  let t1C: number; // Point 1: Suction temp
  let t2C: number; // Point 2: Discharge temp
  let t3C: number; // Point 3: Liquid temp
  let superheatK: number;
  let subcoolingK: number;
  let dischargeSuperheatK: number;

  if (inputMode === 'direct_measurements' && params.suctionPressureBar !== undefined && params.dischargePressureBar !== undefined) {
    // Mode 1: Direct Field Measurements (Tekanan Suction & Discharge + T1, T2, T3)
    peBar = Math.max(0.1, params.suctionPressureBar);
    pcBar = Math.max(peBar * 1.05, params.dischargePressureBar);

    // Saturation temperatures corresponding to pressures
    teC = getRefSaturationTemp(refrigerantId, peBar);
    tcC = getRefSaturationTemp(refrigerantId, pcBar);

    // Point 1: Suction temperature
    t1C = params.suctionTempC !== undefined ? params.suctionTempC : (teC + 5);
    // Point 2: Discharge temperature
    t2C = params.dischargeTempC !== undefined ? params.dischargeTempC : (tcC + 30);
    // Point 3: Liquid temperature before expansion valve
    t3C = params.liquidTempC !== undefined ? params.liquidTempC : (tcC - 5);

    superheatK = Math.max(0, Math.round((t1C - teC) * 10) / 10);
    subcoolingK = Math.max(0, Math.round((tcC - t3C) * 10) / 10);
    dischargeSuperheatK = Math.max(0, Math.round((t2C - tcC) * 10) / 10);
  } else {
    // Mode 2: Theoretical Design from Saturation Temperatures Te & Tc
    teC = params.teC ?? 0;
    tcC = params.tcC ?? 45;
    superheatK = params.superheatK ?? 5;
    subcoolingK = params.subcoolingK ?? 5;

    peBar = getRefSaturationPressure(refrigerantId, teC);
    pcBar = getRefSaturationPressure(refrigerantId, tcC);

    t1C = teC + superheatK;
    t3C = tcC - subcoolingK;
    t2C = tcC + 25;
    dischargeSuperheatK = 25;
  }

  const pressureRatio = Math.max(1.05, pcBar / peBar);

  // 1. STATE 1: Evaporator Outlet / Compressor Suction (Point 1)
  // Evaluated at intersection of Suction Pressure peBar and Suction Temperature t1C
  const h1 = getRefSuperheatedEnthalpy(refrigerantId, peBar, t1C);
  const v1 = getRefVaporSpecificVolume(refrigerantId, teC) * ((t1C + 273.15) / (teC + 273.15));

  // 2. STATE 3: Condenser Outlet / Liquid Before Expansion Valve (Point 3)
  // Perpotongan Garis Discharge Pressure (pcBar) dan Isoterma Suhu Liquid TXV (t3C)
  // Vl didapat dari saturation table suhu expansi t3C (dm3/kg = L/kg)
  const vlDm3Kg = getRefLiquidSpecificVolume(refrigerantId, t3C);
  const vlM3Kg = vlDm3Kg / 1000;
  const h3 = getRefSubcooledEnthalpy(refrigerantId, pcBar, t3C);

  // 3. STATE 4: Expansion Valve Outlet / Evaporator Inlet
  // Isenthalpic expansion: h4 = h3
  const h4 = h3;
  // Vapor quality at state 4: x4 = (h4 - hf(Te)) / (hg(Te) - hf(Te))
  const hfTe = getRefLiquidEnthalpy(refrigerantId, teC);
  const hgTe = getRefVaporEnthalpy(refrigerantId, teC);
  const x4 = Math.max(0, Math.min(1, (h4 - hfTe) / Math.max(10, hgTe - hfTe)));

  // 4. STATE 2: Compressor Discharge (Point 2)
  const k = curve.k;
  const isenExp = (k - 1) / k;
  const rpTerm = Math.pow(pressureRatio, isenExp) - 1;
  const wIsen = (k / (k - 1)) * (peBar * 100 * v1) * rpTerm;

  let h2: number;
  let isentropicEfficiencyActual: number;

  if (inputMode === 'direct_measurements' && params.dischargeTempC !== undefined) {
    // Evaluated at intersection of Discharge Pressure pcBar and Discharge Temperature t2C
    h2 = getRefSuperheatedEnthalpy(refrigerantId, pcBar, t2C);
    const wActual = Math.max(10, h2 - h1);
    isentropicEfficiencyActual = Math.max(0.1, Math.min(0.99, wIsen / wActual));
  } else {
    const isenEff = params.isentropicEfficiency ?? 0.80;
    const wActual = Math.max(10, wIsen / Math.max(0.1, isenEff));
    h2 = h1 + wActual;
    const t1K = t1C + 273.15;
    const t2K = t1K * (1 + rpTerm / isenEff);
    t2C = Math.round((t2K - 273.15) * 10) / 10;
    dischargeSuperheatK = Math.max(0, Math.round((t2C - tcC) * 10) / 10);
    isentropicEfficiencyActual = isenEff;
  }

  // 5. Performance Indices
  const refrigeratingEffectKjKg = Math.max(5, h1 - h4); // q_e
  const workCompressionKjKg = Math.max(5, h2 - h1);    // w_c
  const heatRejectionKjKg = Math.max(5, h2 - h3);      // q_c

  let massFlowKgS: number;
  let massFlowKgH: number;
  let compressorPowerKw: number;
  let compressorPowerHp: number;
  let finalCoolingCapacityKw: number;
  let heatRejectedCondenserKw: number;

  if (params.compressorPowerKw !== undefined && params.compressorPowerKw > 0) {
    // If Power Compressor is given:
    compressorPowerKw = params.compressorPowerKw;
    compressorPowerHp = compressorPowerKw * 1.34102;
    massFlowKgS = compressorPowerKw / workCompressionKjKg;
    massFlowKgH = massFlowKgS * 3600;
    finalCoolingCapacityKw = massFlowKgS * refrigeratingEffectKjKg;
    heatRejectedCondenserKw = massFlowKgS * heatRejectionKjKg;
  } else {
    // If Cooling Capacity is given:
    finalCoolingCapacityKw = coolingCapacityKw;
    massFlowKgS = finalCoolingCapacityKw / refrigeratingEffectKjKg;
    massFlowKgH = massFlowKgS * 3600;
    compressorPowerKw = massFlowKgS * workCompressionKjKg;
    compressorPowerHp = compressorPowerKw * 1.34102;
    heatRejectedCondenserKw = massFlowKgS * heatRejectionKjKg;
  }

  // Mass flow conversion to LPM using liquid specific volume Vl at T3:
  // Rumus: (kg/s x dm3/kg x 60)
  const massFlowLpm = massFlowKgS * vlDm3Kg * 60;

  // COP
  const copActual = finalCoolingCapacityKw / Math.max(0.001, compressorPowerKw);
  // Carnot COP: Te(K) / (Tc(K) - Te(K))
  const teK = teC + 273.15;
  const tcK = tcC + 273.15;
  const copCarnot = teK / Math.max(1, tcK - teK);
  const secondLawEfficiencyPercent = (copActual / copCarnot) * 100;

  // Energy Efficiency Ratio (EER) in Btu/(h·W)
  // EER = COP * 3.412142
  const eerBtuWh = Math.round(copActual * 3.412142 * 100) / 100;
  let eerRatingStars = 1;
  let eerStarLabel = '1 Bintang (Standar Minimum)';
  if (eerBtuWh >= 12.8) {
    eerRatingStars = 5;
    eerStarLabel = '5 Bintang (🌟🌟🌟🌟🌟 Sangat Hemat / Inverter Grade)';
  } else if (eerBtuWh >= 11.4) {
    eerRatingStars = 4;
    eerStarLabel = '4 Bintang (🌟🌟🌟🌟 Hemat Tinggi)';
  } else if (eerBtuWh >= 10.4) {
    eerRatingStars = 3;
    eerStarLabel = '3 Bintang (🌟🌟🌟 Standar Efisien)';
  } else if (eerBtuWh >= 9.96) {
    eerRatingStars = 2;
    eerStarLabel = '2 Bintang (🌟🌟 Cukup Efisien)';
  } else {
    eerRatingStars = 1;
    eerStarLabel = '1 Bintang (🌟 Standar Dasar)';
  }

  // Volumetric efficiency & displacement (Stoecker & Jones formula)
  const etaV = Math.max(0.35, Math.min(0.96, 1 + clearanceRatio - clearanceRatio * Math.pow(pressureRatio, 1 / k)));
  const dispM3S = (massFlowKgS * v1) / etaV;
  const displacementM3H = dispM3S * 3600;
  const displacementCfm = displacementM3H * 0.588578;

  // Saturation Dome Data
  const domePoints = generateRefSaturationDome(refrigerantId);

  // Graph Bounds Calculation
  const allH = [
    ...domePoints.map((d) => d.hf),
    ...domePoints.map((d) => d.hg),
    h1,
    h2,
    h3,
    h4,
  ];
  const allP = [
    ...domePoints.map((d) => d.pBar),
    peBar,
    pcBar,
  ];

  // Scale diagram bounds to standard Solkane / CoolPack / ASHRAE chart specifications
  const spec = STANDARD_CHART_SPECS[refrigerantId] ?? STANDARD_CHART_SPECS.R410A;
  let hMin = spec.hMin;
  let hMax = spec.hMax;
  let pMin = spec.pMin;
  let pMax = spec.pMax;

  // If operating cycle points exceed standard bounds, expand smoothly without clipping
  const minRequiredH = Math.min(h1, h2, h3, h4);
  const maxRequiredH = Math.max(h1, h2, h3, h4);
  const minRequiredP = Math.min(peBar, pcBar);
  const maxRequiredP = Math.max(peBar, pcBar);

  if (minRequiredH < hMin) hMin = Math.floor((minRequiredH - 10) / spec.hStep) * spec.hStep;
  if (maxRequiredH > hMax) hMax = Math.ceil((maxRequiredH + 10) / spec.hStep) * spec.hStep;
  if (minRequiredP < pMin) pMin = Math.max(0.05, Math.floor(minRequiredP * 10) / 15);
  if (maxRequiredP > pMax) pMax = Math.ceil(maxRequiredP * 1.2);

  // Approximate entropy values (kJ/kg.K) for each point
  const s1 = 1.72 + curve.cpg * Math.log((t1C + 273.15) / (teC + 273.15));
  const s2 = s1 + (workCompressionKjKg * (1 - isentropicEfficiencyActual)) / (t2C + 273.15);
  const s3 = 1.0 + curve.cpf * Math.log((t3C + 273.15) / (tcC + 273.15 + 30));
  const s4 = s3 + (h4 - hfTe) / (teC + 273.15);

  const v2 = Math.max(0.005, (v1 * (t2C + 273.15)) / ((t1C + 273.15) * Math.pow(pressureRatio, 1 / k)));
  const v4 = vlM3Kg + x4 * (v1 - vlM3Kg);

  const state1: CycleStatePoint = {
    index: 1,
    label: 'Titik 1: Suction Kompresor',
    name: 'Gas Hisap Kompresor (Point 1)',
    pressureBar: Math.round(peBar * 100) / 100,
    pressureKPa: Math.round(peBar * 1000) / 10,
    enthalpyKjKg: Math.round(h1 * 10) / 10,
    tempC: Math.round(t1C * 10) / 10,
    phase: superheatK > 0 ? `Superheat (+${superheatK} K)` : 'Uap Jenuh (x = 1.0)',
    specificVolumeM3Kg: Math.round(v1 * 1000) / 1000,
    entropyKjKgK: Math.round(s1 * 1000) / 1000,
  };

  const state2: CycleStatePoint = {
    index: 2,
    label: 'Titik 2: Discharge Kompresor',
    name: 'Gas Panas Buang Kompresor (Point 2)',
    pressureBar: Math.round(pcBar * 100) / 100,
    pressureKPa: Math.round(pcBar * 1000) / 10,
    enthalpyKjKg: Math.round(h2 * 10) / 10,
    tempC: Math.round(t2C * 10) / 10,
    phase: `Gas Panas (Superheat: +${dischargeSuperheatK} K)`,
    specificVolumeM3Kg: Math.round(v2 * 1000) / 1000,
    entropyKjKgK: Math.round(s2 * 1000) / 1000,
  };

  const state3: CycleStatePoint = {
    index: 3,
    label: 'Titik 3: Liquid Sebelum Ekspansi',
    name: 'Perpotongan P_discharge & T_liquid TXV (Point 3)',
    pressureBar: Math.round(pcBar * 100) / 100,
    pressureKPa: Math.round(pcBar * 1000) / 10,
    enthalpyKjKg: Math.round(h3 * 10) / 10,
    tempC: Math.round(t3C * 10) / 10,
    phase: t3C > tcC
      ? `Cairan Terlalu Panas / Abnormal (T3 > Tc)`
      : subcoolingK > 0
      ? `Subcooled (+${subcoolingK} K)`
      : 'Cairan Jenuh (x = 0.0, Subcooling 0 K)',
    specificVolumeM3Kg: Math.round(vlM3Kg * 10000) / 10000,
    specificVolumeDm3Kg: Math.round(vlDm3Kg * 1000) / 1000,
    entropyKjKgK: Math.round(s3 * 1000) / 1000,
  };

  const state4: CycleStatePoint = {
    index: 4,
    label: 'Titik 4: Inlet Evaporator',
    name: 'Campuran 2 Fasa Setelah Ekspansi (Point 4)',
    pressureBar: Math.round(peBar * 100) / 100,
    pressureKPa: Math.round(peBar * 1000) / 10,
    enthalpyKjKg: Math.round(h4 * 10) / 10,
    tempC: Math.round(teC * 10) / 10,
    phase: `Campuran 2 Fasa (Kualitas x = ${(x4 * 100).toFixed(1)}%)`,
    qualityX: Math.round(x4 * 1000) / 1000,
    specificVolumeM3Kg: Math.round(v4 * 1000) / 1000,
    entropyKjKgK: Math.round(s4 * 1000) / 1000,
  };

  return {
    refrigerant: meta,
    inputMode,
    state1,
    state2,
    state3,
    state4,
    teC: Math.round(teC * 10) / 10,
    tcC: Math.round(tcC * 10) / 10,
    peBar: Math.round(peBar * 100) / 100,
    pcBar: Math.round(pcBar * 100) / 100,
    suctionPressureBar: Math.round(peBar * 100) / 100,
    dischargePressureBar: Math.round(pcBar * 100) / 100,
    suctionTempC: Math.round(t1C * 10) / 10,
    dischargeTempC: Math.round(t2C * 10) / 10,
    liquidTempC: Math.round(t3C * 10) / 10,
    dischargeSuperheatK: dischargeSuperheatK,
    isentropicEfficiencyActual: Math.round(isentropicEfficiencyActual * 1000) / 1000,
    superheatK,
    subcoolingK,
    pressureRatio: Math.round(pressureRatio * 100) / 100,
    coolingCapacityKw: Math.round(finalCoolingCapacityKw * 100) / 100,

    refrigeratingEffectKjKg: Math.round(refrigeratingEffectKjKg * 10) / 10,
    workCompressionKjKg: Math.round(workCompressionKjKg * 10) / 10,
    heatRejectionKjKg: Math.round(heatRejectionKjKg * 10) / 10,
    massFlowKgS: Math.round(massFlowKgS * 10000) / 10000,
    massFlowKgH: Math.round(massFlowKgH * 10) / 10,
    liquidSpecificVolumeDm3Kg: Math.round(vlDm3Kg * 1000) / 1000,
    liquidSpecificVolumeM3Kg: Math.round(vlM3Kg * 10000) / 10000,
    massFlowLpm: Math.round(massFlowLpm * 100) / 100,

    compressorPowerKw: Math.round(compressorPowerKw * 100) / 100,
    compressorPowerHp: Math.round(compressorPowerHp * 100) / 100,
    heatRejectedCondenserKw: Math.round(heatRejectedCondenserKw * 100) / 100,

    copActual: Math.round(copActual * 1000) / 1000,
    copCarnot: Math.round(copCarnot * 1000) / 1000,
    secondLawEfficiencyPercent: Math.round(secondLawEfficiencyPercent * 10) / 10,

    eerBtuWh,
    eerRatingStars,
    eerStarLabel,

    vaporQualityInletEvap: Math.round(x4 * 1000) / 1000,
    estimatedDischargeTempC: Math.round(t2C * 10) / 10,
    volumetricEfficiency: Math.round(etaV * 1000) / 1000,
    displacementM3H: Math.round(displacementM3H * 10) / 10,
    displacementCfm: Math.round(displacementCfm * 10) / 10,

    domePoints,
    hMin,
    hMax,
    pMin,
    pMax,
  };
}

export interface RefrigerantBlendComponent {
  name: string;
  percent: number;
}

export interface RefrigerantBlendInfo {
  type: 'Zeotropic blend' | 'Near-azeotropic blend' | 'Azeotropic blend' | 'Pure fluid';
  components: RefrigerantBlendComponent[];
  bubbleTempC: number;
  glideK: number;
  glideDescription?: string;
  safetyClass: string;
  chemicalType: string;
}

export const REFRIGERANT_BLEND_DATA: Record<ExtendedRefrigerantId, RefrigerantBlendInfo> = {
  R407C: {
    type: 'Zeotropic blend',
    components: [
      { name: 'R32', percent: 23 },
      { name: 'R125', percent: 25 },
      { name: 'R134a', percent: 52 },
    ],
    bubbleTempC: -43.8,
    glideK: 7.0,
    glideDescription: 'Zeotropic blend: evaporator inlet is 4.4 K colder than the dew point (glide). Superheat is measured from the dew point, subcooling from the bubble point.',
    safetyClass: 'A1',
    chemicalType: 'HFC blend',
  },
  R410A: {
    type: 'Near-azeotropic blend',
    components: [
      { name: 'R32', percent: 50 },
      { name: 'R125', percent: 50 },
    ],
    bubbleTempC: -51.4,
    glideK: 0.2,
    glideDescription: 'Near-azeotropic blend with minimal temperature glide (< 0.2 K). Evaporation and condensation behave virtually as a single pure fluid.',
    safetyClass: 'A1',
    chemicalType: 'HFC blend',
  },
  R404A: {
    type: 'Near-azeotropic blend',
    components: [
      { name: 'R125', percent: 44 },
      { name: 'R143a', percent: 52 },
      { name: 'R134a', percent: 4 },
    ],
    bubbleTempC: -46.5,
    glideK: 0.5,
    glideDescription: 'Near-azeotropic blend with low temperature glide (~0.5 K). Widely utilized in commercial low-temperature freezing.',
    safetyClass: 'A1',
    chemicalType: 'HFC blend',
  },
  R448A: {
    type: 'Zeotropic blend',
    components: [
      { name: 'R32', percent: 26 },
      { name: 'R125', percent: 26 },
      { name: 'R1234yf', percent: 20 },
      { name: 'R134a', percent: 21 },
      { name: 'R1234ze', percent: 7 },
    ],
    bubbleTempC: -45.9,
    glideK: 5.0,
    glideDescription: 'Low-GWP HFO/HFC blend with moderate glide (~5.0 K). Direct replacement for R404A/R507A in supermarket refrigeration.',
    safetyClass: 'A1',
    chemicalType: 'HFO/HFC blend',
  },
  R507A: {
    type: 'Azeotropic blend',
    components: [
      { name: 'R125', percent: 50 },
      { name: 'R143a', percent: 50 },
    ],
    bubbleTempC: -47.1,
    glideK: 0.0,
    glideDescription: 'True azeotropic mixture with 0 K temperature glide. No fractionation during phase changes.',
    safetyClass: 'A1',
    chemicalType: 'HFC azeotrope',
  },
  R32: {
    type: 'Pure fluid',
    components: [{ name: 'R32', percent: 100 }],
    bubbleTempC: -51.7,
    glideK: 0.0,
    safetyClass: 'A2L',
    chemicalType: 'HFC pure',
  },
  R134a: {
    type: 'Pure fluid',
    components: [{ name: 'R134a', percent: 100 }],
    bubbleTempC: -26.1,
    glideK: 0.0,
    safetyClass: 'A1',
    chemicalType: 'HFC pure',
  },
  R22: {
    type: 'Pure fluid',
    components: [{ name: 'R22', percent: 100 }],
    bubbleTempC: -40.8,
    glideK: 0.0,
    safetyClass: 'A1',
    chemicalType: 'HCFC pure',
  },
  R290: {
    type: 'Pure fluid',
    components: [{ name: 'R290 Propane', percent: 100 }],
    bubbleTempC: -42.1,
    glideK: 0.0,
    safetyClass: 'A3',
    chemicalType: 'Hydrocarbon',
  },
  R600a: {
    type: 'Pure fluid',
    components: [{ name: 'R600a Isobutane', percent: 100 }],
    bubbleTempC: -11.7,
    glideK: 0.0,
    safetyClass: 'A3',
    chemicalType: 'Hydrocarbon',
  },
  R717: {
    type: 'Pure fluid',
    components: [{ name: 'NH3 Ammonia', percent: 100 }],
    bubbleTempC: -33.3,
    glideK: 0.0,
    safetyClass: 'B2L',
    chemicalType: 'Natural',
  },
  R744: {
    type: 'Pure fluid',
    components: [{ name: 'CO2 Carbon Dioxide', percent: 100 }],
    bubbleTempC: -78.4,
    glideK: 0.0,
    safetyClass: 'A1',
    chemicalType: 'Natural',
  },
  R1234yf: {
    type: 'Pure fluid',
    components: [{ name: 'R1234yf', percent: 100 }],
    bubbleTempC: -29.5,
    glideK: 0.0,
    safetyClass: 'A2L',
    chemicalType: 'HFO pure',
  },
  R1234ze: {
    type: 'Pure fluid',
    components: [{ name: 'R1234ze(E)', percent: 100 }],
    bubbleTempC: -19.0,
    glideK: 0.0,
    safetyClass: 'A2L',
    chemicalType: 'HFO pure',
  },
  R23: {
    type: 'Pure fluid',
    components: [{ name: 'R23', percent: 100 }],
    bubbleTempC: -82.1,
    glideK: 0.0,
    safetyClass: 'A1',
    chemicalType: 'HFC pure',
  },
  R41: {
    type: 'Pure fluid',
    components: [{ name: 'R41', percent: 100 }],
    bubbleTempC: -78.4,
    glideK: 0.0,
    safetyClass: 'A2L',
    chemicalType: 'HFC pure',
  },
  R114: {
    type: 'Pure fluid',
    components: [{ name: 'R114', percent: 100 }],
    bubbleTempC: 3.8,
    glideK: 0.0,
    safetyClass: 'A1',
    chemicalType: 'CFC pure',
  },
  R12: {
    type: 'Pure fluid',
    components: [{ name: 'R12', percent: 100 }],
    bubbleTempC: -29.8,
    glideK: 0.0,
    safetyClass: 'A1',
    chemicalType: 'CFC pure',
  },
  R1270: {
    type: 'Pure fluid',
    components: [{ name: 'R1270 Propylene', percent: 100 }],
    bubbleTempC: -47.6,
    glideK: 0.0,
    safetyClass: 'A3',
    chemicalType: 'Hydrocarbon',
  },
};

export interface ExtendedStatePointRow {
  point: '1' | '2s' | '2' | "2'" | "3'" | '3' | '4' | "1'";
  label: string;
  pBar: number;
  tC: number;
  hKjKg: number;
  sKjKgK?: number;
  vM3Kg?: number;
  phase: string;
  isMainPoint: boolean;
}

/**
 * Generate 8 full industrial cycle state points (1, 2s, 2, 2', 3', 3, 4, 1')
 * matching engineering software tables (e.g. Danfoss CoolPack, Solkane, Chemours).
 */
export function calculateExtendedStatePoints(
  result: PhCycleResult,
  isentropicEff: number = 0.70
): ExtendedStatePointRow[] {
  const refId = result.refrigerant.id;
  const blend = REFRIGERANT_BLEND_DATA[refId];
  const glide = blend ? blend.glideK : 0;
  const pe = result.peBar;
  const pc = result.pcBar;

  const h1 = result.state1.enthalpyKjKg;
  const t1 = result.state1.tempC;
  const s1 = result.state1.entropyKjKgK ?? 1.786;
  const v1 = result.state1.specificVolumeM3Kg ?? 0.0512;

  // 2s: Isentropic discharge point
  const h2s = h1 + (result.workCompressionKjKg * isentropicEff);
  const t2s = Math.round((result.state2.tempC - (result.workCompressionKjKg * (1 - isentropicEff)) / 1.15) * 10) / 10;
  const s2s = s1;
  const v2s = Math.round((v1 * Math.pow(pe / pc, 1 / 1.16)) * 10000) / 10000;

  // 2: Actual discharge
  const h2 = result.state2.enthalpyKjKg;
  const t2 = result.state2.tempC;
  const s2 = result.state2.entropyKjKgK ?? Math.round((s1 + 1.15 * Math.log((t2 + 273.15) / (t2s + 273.15))) * 1000) / 1000;
  const v2 = result.state2.specificVolumeM3Kg ?? Math.round((v2s * ((t2 + 273.15) / (t2s + 273.15))) * 10000) / 10000;

  // 2': Condenser Dew point
  const t2Prime = Math.round((result.tcC + (glide > 0 ? glide * 0.53 : 0)) * 10) / 10;
  const h2Prime = Math.round(getRefVaporEnthalpy(refId, t2Prime) * 10) / 10;
  const s2Prime = Math.round((s1 - 0.067) * 1000) / 1000;

  // 3': Condenser Bubble point
  const t3Prime = result.tcC;
  const h3Prime = Math.round(getRefLiquidEnthalpy(refId, t3Prime) * 10) / 10;
  const s3Prime = Math.round(1.228 * 1000) / 1000;
  const v3Prime = 0.0010;

  // 3: Subcooled liquid at condenser outlet / TXV inlet
  const h3 = result.state3.enthalpyKjKg;
  const t3 = result.state3.tempC;
  const s3 = result.state3.entropyKjKgK ?? Math.round((s3Prime - 0.016) * 1000) / 1000;
  const v3 = result.liquidSpecificVolumeM3Kg || 0.0009;

  // 4: Evaporator inlet after expansion
  const h4 = result.state4.enthalpyKjKg;
  const x4 = result.vaporQualityInletEvap;
  const t4 = Math.round((result.teC - (glide > 0 ? glide * (1 - x4) : 0)) * 10) / 10;
  const s4 = result.state4.entropyKjKgK ?? Math.round((s3 + 0.021) * 1000) / 1000;
  const v4 = result.state4.specificVolumeM3Kg ?? Math.round((v3 + x4 * (v1 - v3)) * 10000) / 10000;

  // 1': Evaporator Dew point
  const t1Prime = result.teC;
  const h1Prime = Math.round(getRefVaporEnthalpy(refId, t1Prime) * 10) / 10;
  const s1Prime = Math.round((s1 - 0.016) * 1000) / 1000;
  const v1Prime = Math.round((v1 * ((t1Prime + 273.15) / (t1 + 273.15))) * 10000) / 10000;

  return [
    {
      point: '1',
      label: 'Suction Kompresor (Evaporator Exit)',
      pBar: pe,
      tC: t1,
      hKjKg: h1,
      sKjKgK: s1,
      vM3Kg: v1,
      phase: 'Superheated Vapor',
      isMainPoint: true,
    },
    {
      point: '2s',
      label: 'Discharge Isentropik (Ideal ηis=100%)',
      pBar: pc,
      tC: t2s,
      hKjKg: h2s,
      sKjKgK: s2s,
      vM3Kg: v2s,
      phase: 'Superheated Vapor',
      isMainPoint: false,
    },
    {
      point: '2',
      label: 'Discharge Aktual (Kompresor Exit)',
      pBar: pc,
      tC: t2,
      hKjKg: h2,
      sKjKgK: s2,
      vM3Kg: v2,
      phase: 'Superheated Vapor',
      isMainPoint: true,
    },
    {
      point: "2'",
      label: 'Kondensor Dew Point (Titik Embun)',
      pBar: pc,
      tC: t2Prime,
      hKjKg: h2Prime,
      sKjKgK: s2Prime,
      vM3Kg: undefined,
      phase: 'Saturated Vapor (x=1.0)',
      isMainPoint: false,
    },
    {
      point: "3'",
      label: 'Kondensor Bubble Point (Titik Didih)',
      pBar: pc,
      tC: t3Prime,
      hKjKg: h3Prime,
      sKjKgK: s3Prime,
      vM3Kg: v3Prime,
      phase: 'Saturated Liquid (x=0.0)',
      isMainPoint: false,
    },
    {
      point: '3',
      label: 'Cairan Subcooled (TXV Inlet)',
      pBar: pc,
      tC: t3,
      hKjKg: h3,
      sKjKgK: s3,
      vM3Kg: v3,
      phase: 'Subcooled Liquid',
      isMainPoint: true,
    },
    {
      point: '4',
      label: 'Inlet Evaporator (Setelah Ekspansi)',
      pBar: pe,
      tC: t4,
      hKjKg: h4,
      sKjKgK: s4,
      vM3Kg: v4,
      phase: `Campuran 2 Fasa (x = ${(x4 * 100).toFixed(1)}%)`,
      isMainPoint: true,
    },
    {
      point: "1'",
      label: 'Evaporator Dew Point (Titik Embun)',
      pBar: pe,
      tC: t1Prime,
      hKjKg: h1Prime,
      sKjKgK: s1Prime,
      vM3Kg: v1Prime,
      phase: 'Saturated Vapor (x=1.0)',
      isMainPoint: false,
    },
  ];
}
