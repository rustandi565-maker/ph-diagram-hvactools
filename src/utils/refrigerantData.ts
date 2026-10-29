import { RefrigerantId, RefrigerantInfo } from '../types/cascade';

export const REFRIGERANTS: Record<RefrigerantId, RefrigerantInfo> = {
  R744: {
    id: 'R744',
    name: 'Karbon Dioksida (CO₂)',
    chemicalFormula: 'CO₂',
    ashraeSafety: 'A1 (Non-toksik, Non-flammable)',
    normalBoilingPointC: -78.4,
    criticalTempC: 31.0,
    criticalPressureBar: 73.8,
    gwp: 1,
    odp: 0,
    isSuitableLTC: true,
    isSuitableHTC: false,
    description: 'Refrigerant alami bertekanan tinggi dengan transfer kalor istimewa, sangat ramah lingkungan (GWP=1), standar modern untuk sirkuit suhu rendah.',
  },
  R717: {
    id: 'R717',
    name: 'Amonia (NH₃)',
    chemicalFormula: 'NH₃',
    ashraeSafety: 'B2L (Toksik, Rendah Flammability)',
    normalBoilingPointC: -33.3,
    criticalTempC: 132.3,
    criticalPressureBar: 113.3,
    gwp: 0,
    odp: 0,
    isSuitableLTC: false,
    isSuitableHTC: true,
    description: 'Refrigerant industri paling efisien di dunia dengan kalor laten luar biasa tinggi (~1.200-1.300 kJ/kg), standar emas sirkuit atas kaskade industri.',
  },
  R23: {
    id: 'R23',
    name: 'Trifluoromethane (R-23)',
    chemicalFormula: 'CHF₃',
    ashraeSafety: 'A1',
    normalBoilingPointC: -82.1,
    criticalTempC: 25.9,
    criticalPressureBar: 48.3,
    gwp: 14800,
    odp: 0,
    isSuitableLTC: true,
    isSuitableHTC: false,
    description: 'Refrigerant suhu ultra-rendah untuk pembekuan ekstrim medis, farmasi, dan kriogenik (-60°C s/d -85°C).',
  },
  R134a: {
    id: 'R134a',
    name: 'Tetrafluoroethane (R-134a)',
    chemicalFormula: 'CH₂FCF₃',
    ashraeSafety: 'A1',
    normalBoilingPointC: -26.1,
    criticalTempC: 101.1,
    criticalPressureBar: 40.6,
    gwp: 1430,
    odp: 0,
    isSuitableLTC: false,
    isSuitableHTC: true,
    description: 'Refrigerant HFC populer dengan tekanan kerja moderat, umum digunakan pada sirkuit suhu tinggi komersial.',
  },
  R404A: {
    id: 'R404A',
    name: 'Blend HFC (R-404A)',
    chemicalFormula: 'R-125/143a/134a',
    ashraeSafety: 'A1',
    normalBoilingPointC: -46.5,
    criticalTempC: 72.1,
    criticalPressureBar: 37.3,
    gwp: 3922,
    odp: 0,
    isSuitableLTC: true,
    isSuitableHTC: true,
    description: 'Fluida kerja standar komersial untuk cold storage, dapat berfungsi di sirkuit rendah maupun tinggi.',
  },
  R290: {
    id: 'R290',
    name: 'Propana (R-290)',
    chemicalFormula: 'C₃H₈',
    ashraeSafety: 'A3 (Flammable murni)',
    normalBoilingPointC: -42.1,
    criticalTempC: 96.7,
    criticalPressureBar: 42.5,
    gwp: 3,
    odp: 0,
    isSuitableLTC: true,
    isSuitableHTC: true,
    description: 'Hidrokarbon alami ramah ozon dan rendah GWP dengan termodinamika sangat prima dan kompresi ringan.',
  },
  R507A: {
    id: 'R507A',
    name: 'Azeotrope HFC (R-507A)',
    chemicalFormula: 'R-125/143a',
    ashraeSafety: 'A1',
    normalBoilingPointC: -47.1,
    criticalTempC: 70.6,
    criticalPressureBar: 37.0,
    gwp: 3985,
    odp: 0,
    isSuitableLTC: true,
    isSuitableHTC: true,
    description: 'Campuran azeotropik tanpa glide suhu, alternatif R-404A untuk sistem pembekuan industri.',
  },
  R410A: {
    id: 'R410A',
    name: 'Blend HFC (R-410A)',
    chemicalFormula: 'R-32/125',
    ashraeSafety: 'A1',
    normalBoilingPointC: -51.4,
    criticalTempC: 71.3,
    criticalPressureBar: 49.0,
    gwp: 2088,
    odp: 0,
    isSuitableLTC: true,
    isSuitableHTC: true,
    description: 'Refrigerant bertekanan tinggi dengan volumetric capacity besar, cocok untuk sirkuit menengah/tinggi.',
  },
};

// Thermodynamic correlation models (Antoine & empirical saturation fits)
interface ThermoParams {
  A: number; // Antoine A
  B: number; // Antoine B
  C: number; // Antoine C
  k: number; // Isentropic exponent cp/cv
  hf0: number; // enthalpy liquid base (kJ/kg)
  cpf: number; // specific heat liquid (kJ/kg.K)
  hfg0: number; // latent heat base at 0°C (kJ/kg)
  dhfg_dT: number; // latent heat temp coefficient
  cpg: number; // vapor heat capacity (kJ/kg.K)
  v0: number; // specific volume vapor base m3/kg
}

const THERMO_DATA: Record<RefrigerantId, ThermoParams> = {
  R744: {
    // CO2
    A: 4.542,
    B: 867.3,
    C: 247.5,
    k: 1.30,
    hf0: 200,
    cpf: 2.3,
    hfg0: 231.0,
    dhfg_dT: -2.1,
    cpg: 1.15,
    v0: 0.018,
  },
  R717: {
    // NH3
    A: 4.485,
    B: 1042.0,
    C: 242.0,
    k: 1.31,
    hf0: 200,
    cpf: 4.7,
    hfg0: 1262.0,
    dhfg_dT: -3.8,
    cpg: 2.2,
    v0: 0.28,
  },
  R23: {
    // R23
    A: 4.120,
    B: 742.0,
    C: 245.0,
    k: 1.18,
    hf0: 200,
    cpf: 1.45,
    hfg0: 175.0,
    dhfg_dT: -1.4,
    cpg: 0.85,
    v0: 0.035,
  },
  R134a: {
    // R134a
    A: 4.070,
    B: 1022.0,
    C: 248.0,
    k: 1.12,
    hf0: 200,
    cpf: 1.38,
    hfg0: 198.0,
    dhfg_dT: -1.2,
    cpg: 0.95,
    v0: 0.032,
  },
  R404A: {
    // R404A
    A: 4.050,
    B: 920.0,
    C: 240.0,
    k: 1.14,
    hf0: 200,
    cpf: 1.5,
    hfg0: 160.0,
    dhfg_dT: -1.3,
    cpg: 1.05,
    v0: 0.025,
  },
  R290: {
    // Propane
    A: 3.980,
    B: 830.0,
    C: 247.0,
    k: 1.15,
    hf0: 200,
    cpf: 2.6,
    hfg0: 374.0,
    dhfg_dT: -1.8,
    cpg: 1.75,
    v0: 0.095,
  },
  R507A: {
    // R507A
    A: 4.080,
    B: 935.0,
    C: 242.0,
    k: 1.14,
    hf0: 200,
    cpf: 1.52,
    hfg0: 158.0,
    dhfg_dT: -1.35,
    cpg: 1.06,
    v0: 0.024,
  },
  R410A: {
    // R410A
    A: 4.150,
    B: 885.0,
    C: 236.0,
    k: 1.17,
    hf0: 200,
    cpf: 1.75,
    hfg0: 220.0,
    dhfg_dT: -1.7,
    cpg: 1.25,
    v0: 0.028,
  },
};

/**
 * Calculates saturation pressure Psat in bar for given refrigerant and temperature T in °C
 */
export function getSaturationPressureBar(refId: RefrigerantId, tempC: number): number {
  const p = THERMO_DATA[refId];
  // Extended Antoine form: log10(P_bar) = A - B / (T_C + C)
  const logP = p.A - p.B / (tempC + p.C);
  const pBar = Math.pow(10, logP);
  return Math.max(0.1, Math.min(120, pBar));
}

/**
 * Calculates saturation liquid enthalpy hf (kJ/kg) at temperature T in °C
 */
export function getLiquidEnthalpy(refId: RefrigerantId, tempC: number): number {
  const p = THERMO_DATA[refId];
  return p.hf0 + p.cpf * tempC;
}

/**
 * Calculates saturation vapor enthalpy hg (kJ/kg) at temperature T in °C
 */
export function getVaporEnthalpy(refId: RefrigerantId, tempC: number): number {
  const p = THERMO_DATA[refId];
  const hf = getLiquidEnthalpy(refId, tempC);
  const hfg = Math.max(30, p.hfg0 + p.dhfg_dT * tempC);
  return hf + hfg;
}

/**
 * Calculates specific volume of saturated vapor vg (m3/kg)
 */
export function getVaporSpecificVolume(refId: RefrigerantId, tempC: number): number {
  const p = THERMO_DATA[refId];
  const tK = tempC + 273.15;
  const pBar = getSaturationPressureBar(refId, tempC);
  // Ideal/real gas approximation v = v0 * (T/273.15) / (P/P0)
  return Math.max(0.005, (p.v0 * (tK / 273.15)) / (pBar / 4.0));
}

/**
 * Returns isentropic exponent k = cp/cv
 */
export function getIsentropicExponent(refId: RefrigerantId): number {
  return THERMO_DATA[refId].k;
}
