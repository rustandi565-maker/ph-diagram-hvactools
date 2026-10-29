import { SavedPhCyclePlot } from '../types/phDiagram';

const STORAGE_KEY = 'rtu_ph_saved_plots_v1';

export const BENCHMARK_SAVED_PLOTS: SavedPhCyclePlot[] = [
  {
    id: 'benchmark-r134a-ashrae',
    name: 'Standar ASHRAE R134a (Normal & Efisien)',
    timestamp: Date.now() - 86400000 * 3,
    refrigerantId: 'R134a',
    suctionPressure: 2.5,
    suctionPressureUnit: 'bar',
    dischargePressure: 10.16,
    dischargePressureUnit: 'bar',
    suctionTempC: 5,
    dischargeTempC: 75,
    liquidTempC: 35,
    compressorPower: 2.2,
    compressorPowerUnit: 'kW',
    cop: 3.42,
    coolingCapacityKw: 7.52,
    superheatK: 9.3,
    subcoolingK: 5.0,
    eerBtuWh: 11.67,
    reportMeta: {
      productName: 'Trainer Refrigerasi Kompresi Uap R134a',
      trainerName: 'Trainer Refrigerasi Kompresi Uap R134a',
      modelUnit: 'RTU-REF-134A',
      workOrderNumber: 'WL-13095-01',
      projectName: 'Pengujian Karakteristik Standar ASHRAE R134a',
      reportDate: '2026-10-21',
      conclusion: 'Kondisi operasi berada pada parameter optimal ASHRAE dengan superheat 9.3 K dan subcooling 5.0 K.',
    },
  },
  {
    id: 'benchmark-r32-split',
    name: 'AC Split R32 (Beban Puncak 1.5 PK)',
    timestamp: Date.now() - 86400000 * 2,
    refrigerantId: 'R32',
    suctionPressure: 8.5,
    suctionPressureUnit: 'bar',
    dischargePressure: 27.5,
    dischargePressureUnit: 'bar',
    suctionTempC: 9,
    dischargeTempC: 84,
    liquidTempC: 40,
    compressorPower: 1.1,
    compressorPowerUnit: 'kW',
    cop: 3.85,
    coolingCapacityKw: 4.24,
    superheatK: 6.8,
    subcoolingK: 5.4,
    eerBtuWh: 13.14,
    reportMeta: {
      productName: 'Trainer Refrigerasi Kompresi Uap R32',
      trainerName: 'Trainer Refrigerasi Kompresi Uap R32',
      modelUnit: 'RTU-REF-32X',
      workOrderNumber: 'WL-13095-01',
      projectName: 'Pengujian Siklus Refrigerasi & Diagram P-h',
      reportDate: '2026-10-22',
      conclusion: 'Efisiensi refrigeran R32 tinggi dengan COP 3.85 pada kondisi beban puncak AC 1.5 PK.',
    },
  },
  {
    id: 'benchmark-r404a-coldroom',
    name: 'Cold Storage R404A (Suhu Rendah -22°C)',
    timestamp: Date.now() - 86400000,
    refrigerantId: 'R404A',
    suctionPressure: 2.2,
    suctionPressureUnit: 'bar',
    dischargePressure: 17.8,
    dischargePressureUnit: 'bar',
    suctionTempC: -15,
    dischargeTempC: 78,
    liquidTempC: 32,
    compressorPower: 3.5,
    compressorPowerUnit: 'kW',
    cop: 2.45,
    coolingCapacityKw: 8.58,
    superheatK: 7.2,
    subcoolingK: 6.5,
    eerBtuWh: 8.36,
    reportMeta: {
      productName: 'Trainer Refrigerasi Walk-in Cold Storage R404A',
      trainerName: 'Trainer Refrigerasi Walk-in Cold Storage R404A',
      modelUnit: 'RTU-REF-404C',
      workOrderNumber: 'WL-13095-02',
      projectName: 'Pengujian Cold Storage Suhu Rendah -22°C',
      reportDate: '2026-10-23',
      conclusion: 'Temperatur evaporasi mencapai -22°C sesuai peruntukan cold room pembekuan.',
    },
  },
  {
    id: 'benchmark-abnormal-subcool',
    name: 'Kasus Diagnostik: T3 Tinggi & Subcooling Kurang',
    timestamp: Date.now() - 43200000,
    refrigerantId: 'R134a',
    suctionPressure: 2.5,
    suctionPressureUnit: 'bar',
    dischargePressure: 10.16,
    dischargePressureUnit: 'bar',
    suctionTempC: 5,
    dischargeTempC: 95,
    liquidTempC: 48,
    compressorPower: 2.8,
    compressorPowerUnit: 'kW',
    cop: 1.46,
    coolingCapacityKw: 4.09,
    superheatK: 9.3,
    subcoolingK: -8.0,
    eerBtuWh: 4.98,
    reportMeta: {
      productName: 'Trainer Refrigerasi Kompresi Uap R134a',
      trainerName: 'Trainer Refrigerasi Kompresi Uap R134a',
      modelUnit: 'RTU-REF-134A',
      workOrderNumber: 'WL-13095-01-DIAG',
      projectName: 'Studi Diagnostik Kerusakan: Subcooling Rendah & Flash Gas',
      reportDate: '2026-10-24',
      conclusion: 'Kondensasi tidak sempurna menghasilkan subcooling negatif (-8.0 K). Terjadi flash gas sebelum katup ekspansi.',
    },
  },
];

export function getSavedPhPlots(): SavedPhCyclePlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial benchmarks if empty
      localStorage.setItem(STORAGE_KEY, JSON.stringify(BENCHMARK_SAVED_PLOTS));
      return BENCHMARK_SAVED_PLOTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all items have complete reportMeta
      return parsed.map((p) => {
        if (!p.reportMeta) {
          const matchBenchmark = BENCHMARK_SAVED_PLOTS.find((b) => b.id === p.id);
          if (matchBenchmark && matchBenchmark.reportMeta) {
            return { ...p, reportMeta: matchBenchmark.reportMeta };
          }
          return {
            ...p,
            reportMeta: {
              productName: `Trainer Refrigerasi Kompresi Uap ${p.refrigerantId || 'R32'}`,
              trainerName: `Trainer Refrigerasi Kompresi Uap ${p.refrigerantId || 'R32'}`,
              modelUnit: `RTU-REF-${p.refrigerantId || '32X'}`,
              workOrderNumber: 'WL-13095-01',
              projectName: 'Pengujian Siklus Refrigerasi & Diagram P-h',
              reportDate: new Date(p.timestamp || Date.now()).toISOString().split('T')[0],
            },
          };
        }
        return p;
      });
    }
    return BENCHMARK_SAVED_PLOTS;
  } catch (err) {
    console.warn('Failed to load saved Ph plots from localStorage', err);
    return BENCHMARK_SAVED_PLOTS;
  }
}

export function savePhPlot(plotData: Omit<SavedPhCyclePlot, 'id' | 'timestamp'>): SavedPhCyclePlot {
  const current = getSavedPhPlots();
  const newPlot: SavedPhCyclePlot = {
    ...plotData,
    id: `ph-plot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
  };

  const updated = [newPlot, ...current.filter((p) => p.name !== newPlot.name)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save Ph plot to localStorage', err);
  }
  return newPlot;
}

export function deletePhPlot(id: string): SavedPhCyclePlot[] {
  const current = getSavedPhPlots();
  const updated = current.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete Ph plot from localStorage', err);
  }
  return updated;
}
