import React, { useState, useMemo } from 'react';
import { CompanyBranding } from '../types/branding';
import { ExtendedRefrigerantId } from '../types/phDiagram';
import {
  CoilCalculationMode,
  CoilGeometryType,
  EvaporatorCoilInputs,
  PipeMaterialType,
  WaterConvectionRegime,
} from '../types/evaporatorCoil';
import {
  calculateEvaporatorCoil,
  CONVECTION_BASELINES,
  PIPE_MATERIAL_SPECS,
  STANDARD_PIPE_DIMENSIONS,
} from '../utils/evaporatorCoilCalculations';
import { EvaporatorCoilDiagram } from './EvaporatorCoilDiagram';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { buildWhatsAppReportMessage } from '../utils/whatsappShare';

interface EvaporatorCoilCalculatorProps {
  branding: CompanyBranding;
}

export const EvaporatorCoilCalculator: React.FC<EvaporatorCoilCalculatorProps> = ({
  branding,
}) => {
  // Calculation inputs state
  const [inputs, setInputs] = useState<EvaporatorCoilInputs>({
    calculationMode: 'continuous_flow',
    coolingCapacityKw: 10.5, // ~3 TR default
    waterFlowRateLpm: 25, // 25 Liters/min
    waterInletTempC: 15,
    waterOutletTempC: 5,
    batchWaterVolumeLiters: 1000,
    batchInitialTempC: 28,
    batchTargetTempC: 4,
    batchCoolingTimeHours: 2.5,
    tankAmbientLossFactorPct: 10,
    refrigerantId: 'R404A',
    evaporatingTempC: 0,
    superheatK: 5,
    convectionRegime: 'gentle_agitation',
    foulingSafetyFactorPct: 15,
    pipeMaterial: 'copper_plain',
    pipeNominalInch: '1/2"',
    coilGeometry: 'helical_cylinder',
    coilDiameterMm: 450,
    coilPitchMm: 28,
    finMultiplierArea: 3.8,
  });

  const [activeTab, setActiveTab] = useState<'calculator' | 'material_comparison' | 'formula_steps'>('calculator');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  // Compute results
  const result = useMemo(() => {
    return calculateEvaporatorCoil(inputs);
  }, [inputs]);

  const waReportMessage = useMemo(() => {
    return buildWhatsAppReportMessage({
      reportTitle: `LAPORAN DESAIN EVAPORATOR COIL CONVECTOR (WATER CHILLER)`,
      reportMeta: {
        productName: `Evaporator Coil Convector - ${PIPE_MATERIAL_SPECS[inputs.pipeMaterial].name}`,
        modelUnit: `Nominal Pipa: ${inputs.pipeNominalInch} (${inputs.pipeMaterial})`,
        workOrderNumber: `EC-${Date.now().toString().slice(-6)}`,
        projectName: 'Perancangan Koil Pendingin Air / Convector Chiller',
        reportDate: new Date().toISOString().split('T')[0],
      },
      summarySections: [
        {
          title: 'Parameter Desain & Beban Kalor',
          items: [
            { label: 'Mode Kalkulasi', value: inputs.calculationMode === 'direct_capacity' ? 'Kapasitas Langsung' : inputs.calculationMode === 'continuous_flow' ? 'Aliran Kontinu (Chiller)' : 'Batch Tangki' },
            { label: 'Kapasitas Pendinginan Efektif', value: `${result.effectiveCoolingLoadKw.toFixed(2)} kW (${result.effectiveCoolingLoadTr.toFixed(2)} TR / ${result.effectiveCoolingLoadBtuHr.toLocaleString('id-ID', { maximumFractionDigits: 0 })} BTU/h)` },
            { label: 'Fluida & Suhu Air', value: `${inputs.waterInletTempC} °C ➔ ${inputs.waterOutletTempC} °C` },
            { label: 'Refrigerant', value: inputs.refrigerantId },
            { label: 'Suhu Evaporasi (T_evap)', value: `${inputs.evaporatingTempC} °C (Superheat: ${inputs.superheatK} K)` },
            { label: 'Beda Suhu Rata-rata (LMTD)', value: `${result.lmtdC.toFixed(2)} °C` },
            { label: 'Koefisien U-Value Efektif', value: `${result.uValueWm2K.toFixed(0)} W/m²·K` },
          ],
        },
        {
          title: 'Hasil Dimensi Pipa & Geometri Koil',
          items: [
            { label: 'Material Pipa', value: PIPE_MATERIAL_SPECS[inputs.pipeMaterial].name },
            { label: 'Ukuran Nominal Pipa', value: inputs.pipeNominalInch },
            { label: 'Total Panjang Pipa Dibutuhkan', value: `${result.totalPipeLengthMeters.toFixed(1)} meter` },
            { label: 'Luas Area Perpindahan Panas', value: `${result.requiredHeatTransferAreaM2.toFixed(2)} m²` },
            { label: 'Rekomendasi Sirkuit Paralel', value: `${result.recommendedCircuits} Sirkuit (${result.lengthPerCircuitMeters.toFixed(1)} m/sirkuit)` },
            { label: 'Diameter Gulungan Koil', value: `${inputs.coilDiameterMm} mm` },
            { label: 'Estimasi Jumlah Lilitan', value: `±${result.coilTurnsCount} Putaran (Tinggi ±${result.coilHeightMm} mm)` },
          ],
        },
      ],
      footerNote: `Dihitung menggunakan Engineering Engine Evaporator Coil - ${branding.companyName}.`,
    });
  }, [inputs, result, branding]);

  // Compute comparison across all materials for identical conditions
  const materialComparisons = useMemo(() => {
    const materials: PipeMaterialType[] = ['copper_plain', 'copper_finned', 'ss304', 'ss316l', 'titanium'];
    return materials.map((mat) => {
      const res = calculateEvaporatorCoil({
        ...inputs,
        pipeMaterial: mat,
      });
      return {
        materialKey: mat,
        spec: PIPE_MATERIAL_SPECS[mat],
        lengthMeters: res.totalPipeLengthMeters,
        circuits: res.recommendedCircuits,
        weightKg: res.coilWeightKg,
        areaM2: res.fouledHeatTransferAreaM2,
        uValue: res.uValueWm2K,
      };
    });
  }, [inputs]);

  // Compute comparison across all standard pipe diameters
  const pipeSizeComparisons = useMemo(() => {
    const sizes = Object.keys(STANDARD_PIPE_DIMENSIONS);
    return sizes.map((sz) => {
      const res = calculateEvaporatorCoil({
        ...inputs,
        pipeNominalInch: sz,
      });
      return {
        nominalInch: sz,
        dim: STANDARD_PIPE_DIMENSIONS[sz],
        totalLengthMeters: res.totalPipeLengthMeters,
        circuits: res.recommendedCircuits,
        lengthPerCircuit: res.lengthPerCircuitMeters,
        weightKg: res.coilWeightKg,
        pressureDropStatus: res.circuitPressureDropStatus,
      };
    });
  }, [inputs]);

  // Handle Preset Applications
  const handleApplyPreset = (presetKey: 'chiller_3tr' | 'milk_batch' | 'brewery_wort' | 'marine_chiller') => {
    if (presetKey === 'chiller_3tr') {
      setInputs((prev) => ({
        ...prev,
        calculationMode: 'continuous_flow',
        waterFlowRateLpm: 30,
        waterInletTempC: 12,
        waterOutletTempC: 7,
        refrigerantId: 'R410A',
        evaporatingTempC: 2,
        pipeMaterial: 'copper_plain',
        pipeNominalInch: '1/2"',
        convectionRegime: 'forced_shell_coil',
        coilDiameterMm: 400,
      }));
    } else if (presetKey === 'milk_batch') {
      setInputs((prev) => ({
        ...prev,
        calculationMode: 'batch_tank',
        batchWaterVolumeLiters: 1500,
        batchInitialTempC: 32,
        batchTargetTempC: 4,
        batchCoolingTimeHours: 3.0,
        refrigerantId: 'R404A',
        evaporatingTempC: -2,
        pipeMaterial: 'ss304',
        pipeNominalInch: '5/8"',
        convectionRegime: 'gentle_agitation',
        coilDiameterMm: 600,
      }));
    } else if (presetKey === 'brewery_wort') {
      setInputs((prev) => ({
        ...prev,
        calculationMode: 'batch_tank',
        batchWaterVolumeLiters: 500,
        batchInitialTempC: 95,
        batchTargetTempC: 20,
        batchCoolingTimeHours: 0.75,
        refrigerantId: 'R134a',
        evaporatingTempC: 5,
        pipeMaterial: 'ss316l',
        pipeNominalInch: '1/2"',
        convectionRegime: 'vigorous_agitation',
        coilDiameterMm: 350,
      }));
    } else if (presetKey === 'marine_chiller') {
      setInputs((prev) => ({
        ...prev,
        calculationMode: 'continuous_flow',
        waterFlowRateLpm: 20,
        waterInletTempC: 26,
        waterOutletTempC: 18,
        refrigerantId: 'R134a',
        evaporatingTempC: 10,
        pipeMaterial: 'titanium',
        pipeNominalInch: '3/4"',
        convectionRegime: 'forced_shell_coil',
        coilDiameterMm: 380,
      }));
    }
  };

  // Copy Technical Report
  const handleCopyReport = () => {
    const reportText = `
================================================================================
LAPORAN TEKNIS DESAIN EVAPORATOR COIL CONVECTOR (WATER CHILLER COIL)
${branding.companyName.toUpperCase()} - ${branding.tagline}
Nomor Dokumen: EC-${Date.now().toString().slice(-6)} | Tanggal: ${new Date().toLocaleDateString('id-ID')}
================================================================================

1. PARAMETER DESAIN & BEBAN KALOR:
   - Mode Perhitungan: ${inputs.calculationMode === 'direct_capacity' ? 'Kapasitas Langsung' : inputs.calculationMode === 'continuous_flow' ? 'Aliran Kontinu (Water Chiller)' : 'Pendinginan Tangki Batch'}
   - Kapasitas Pendinginan Efektif: ${result.effectiveCoolingLoadKw.toFixed(2)} kW | ${result.effectiveCoolingLoadTr.toFixed(2)} TR | ${result.effectiveCoolingLoadBtuHr.toLocaleString('id-ID', { maximumFractionDigits: 0 })} BTU/h
   - Fluida yang Didinginkan: Air (${inputs.waterInletTempC}°C -> ${inputs.waterOutletTempC}°C)
   - Freon Refrigerant: ${inputs.refrigerantId}
   - Suhu Evaporasi (T_evap): ${inputs.evaporatingTempC}°C
   - Derajat Superheat: ${inputs.superheatK} K
   - LMTD (Beda Suhu Logaritmik): ${result.lmtdC.toFixed(2)} °C
   - Rezim Aliran Air: ${CONVECTION_BASELINES[inputs.convectionRegime].label}
   - Koefisien U-Value Efektif: ${result.uValueWm2K.toFixed(0)} W/m²·K
   - Safety Margin / Faktor Kotor: +${inputs.foulingSafetyFactorPct}%

2. SPESIFIKASI PIPA & HASIL PANJANG YANG DIBUTUHKAN:
   - Jenis Material Pipa: ${result.materialName} (${result.materialStandard})
   - Ukuran Nominal Pipa: ${result.nominalPipeSpec.nominalInch} (OD ${result.nominalPipeSpec.odMm} mm, ID ${result.nominalPipeSpec.idMm} mm, Tebal ${result.nominalPipeSpec.wallThicknessMm} mm)
   - Luas Permukaan Perpindahan Kalor (A): ${result.fouledHeatTransferAreaM2.toFixed(3)} m²
   - TOTAL PANJANG PIPA YANG DIBUTUHKAN: ${result.totalPipeLengthMeters.toFixed(2)} METER
   - Total Berat Bahan Pipa: ±${result.coilWeightKg.toFixed(2)} kg
   - Volume Cairan Dalam Pipa: ±${result.internalRefrigerantVolumeLiters.toFixed(2)} Liter

3. PEMBAGIAN SIRKUIT PARALEL & DISTRIBUTOR (PRESSURE DROP):
   - Jumlah Sirkuit Paralel Disarankan: ${result.recommendedCircuits} Sirkuit
   - Panjang per Sirkuit: ${result.lengthPerCircuitMeters.toFixed(2)} meter / sirkuit
   - Status Penurunan Tekanan (Pressure Drop): ${result.circuitPressureDropStatus}
   - Spesifikasi Distributor Freon: ${result.distributorInletSpec}
   - Laju Massa Freon: ${(result.refrigerantMassFlowKgS * 1000).toFixed(1)} g/detik (${(result.refrigerantMassFlowKgS * 3600).toFixed(1)} kg/jam)

4. ESTIMASI GEOMETRI FABRIKASI GULUNGAN KOIL:
   - Tipe Bentuk Koil: Helikal Silinder (Spiral Melingkar)
   - Diameter Gulungan Koil (D_coil): ${inputs.coilDiameterMm} mm
   - Jarak Pitch Antar Lilitan: ${inputs.coilPitchMm || 28} mm
   - Estimasi Jumlah Putaran Lilitan: ±${result.coilTurnsCount} Putaran
   - Estimasi Tinggi Total Koil (H_coil): ±${result.coilHeightMm} mm
   - Rekomendasi Volume Tangki Convector: Min. ${result.convectorTankSuggestedVolumeLiters} Liter

5. CATATAN TEKNIS MATERIAL & REKOMENDASI PEMBENGKOKAN:
   - Ketahanan Korosi: ${result.corrosionSuitability}
   - Panduan Bending: ${result.bendingRecommendations}

Disusun secara otomatis oleh Kalkulator Evaporator Coil - ${branding.companyName}.
`.trim();

    navigator.clipboard.writeText(reportText).then(() => {
      setCopiedNotification('Laporan teknis berhasil disalin ke clipboard!');
      setTimeout(() => setCopiedNotification(null), 3500);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold uppercase">
                Tools Baru Rekayasa HVAC & Chiller
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {branding.shortName} • Modul Desain Penukar Kalor
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🌀</span>
              <span>Kalkulator Evaporator Coil Convector (Panjang & Ukuran Pipa)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Hitung secara presisi kebutuhan panjang pipa pendingin air dalam tangki convector / water chiller, pemilihan jenis material pipa (Tembaga polos, bersirip, Stainless Steel SS304/316L, Titanium), diameter nominal, pembagian sirkuit paralel, serta geometri fabrikasi koil.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyReport}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>📋</span>
              <span>Salin Laporan Teknis</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWaModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
              title="Bagikan Laporan Desain Koil ke WhatsApp"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              <span>Share ke WA</span>
            </button>
          </div>
        </div>

        {/* Preset Shortcuts */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">⚡ Contoh Kasus Cepat (Presets):</span>
          <button
            type="button"
            onClick={() => handleApplyPreset('chiller_3tr')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
          >
            Water Chiller 3 TR (Aliran Kontinu)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('milk_batch')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
          >
            Tangki Susu / Batch 1500L (SS304 Food Grade)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('brewery_wort')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
          >
            Wort Chiller Minuman 500L (SS316L)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('marine_chiller')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors"
          >
            Chiller Air Laut / Akuarium (Titanium)
          </button>
        </div>

        {copiedNotification && (
          <div className="mt-3 p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded text-xs font-mono animate-fadeIn">
            ✓ {copiedNotification}
          </div>
        )}
      </div>

      {/* Primary KPI Results Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Total Length Hero */}
        <div className="col-span-2 bg-gradient-to-br from-cyan-950/80 to-slate-900 border-2 border-cyan-500/50 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-cyan-300 font-medium">
            <span>TOTAL PANJANG PIPA DIBUTUHKAN</span>
            <span className="font-mono bg-cyan-500/20 px-2 py-0.5 rounded text-[10px] text-cyan-200">
              {result.nominalPipeSpec.nominalInch} (OD {result.nominalPipeSpec.odMm} mm)
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              {result.totalPipeLengthMeters.toFixed(2)}{' '}
              <span className="text-lg text-cyan-400 font-sans font-medium">Meter</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
              <span>🔀</span>
              <span>
                Dibagi menjadi <strong className="text-white">{result.recommendedCircuits} Sirkuit Paralel</strong> (@ {result.lengthPerCircuitMeters.toFixed(2)} m)
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Status Tekanan: <span className="text-emerald-400 font-semibold">{result.circuitPressureDropStatus}</span>
          </div>
        </div>

        {/* Heat Load */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Beban Pendinginan (Q)</span>
          <div className="my-1">
            <span className="text-2xl font-bold text-white font-mono">{result.effectiveCoolingLoadKw.toFixed(2)}</span>
            <span className="text-xs text-slate-400 ml-1">kW</span>
          </div>
          <div className="text-[10px] text-cyan-400 font-mono">
            {result.effectiveCoolingLoadTr.toFixed(2)} TR ({result.effectiveCoolingLoadBtuHr.toLocaleString('id-ID', { maximumFractionDigits: 0 })} BTU/h)
          </div>
        </div>

        {/* Heat Transfer Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Luas Permukaan (A)</span>
          <div className="my-1">
            <span className="text-2xl font-bold text-white font-mono">{result.fouledHeatTransferAreaM2.toFixed(3)}</span>
            <span className="text-xs text-slate-400 ml-1">m²</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            LMTD: {result.lmtdC.toFixed(2)}°C • U: {result.uValueWm2K.toFixed(0)} W/m²K
          </div>
        </div>

        {/* Weight of Pipe */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Total Berat Pipa</span>
          <div className="my-1">
            <span className="text-2xl font-bold text-white font-mono">{result.coilWeightKg.toFixed(1)}</span>
            <span className="text-xs text-slate-400 ml-1">kg</span>
          </div>
          <div className="text-[10px] text-amber-400 font-mono truncate">
            {result.materialName.slice(0, 20)}...
          </div>
        </div>

        {/* Coil Physical Turns */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Gulungan Spiral (Koil)</span>
          <div className="my-1">
            <span className="text-2xl font-bold text-white font-mono">±{result.coilTurnsCount}</span>
            <span className="text-xs text-slate-400 ml-1">Lilitan</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Ø {inputs.coilDiameterMm} mm • Tinggi ±{result.coilHeightMm} mm
          </div>
        </div>
      </div>

      {/* Main Interactive Diagram Preview */}
      <EvaporatorCoilDiagram inputs={inputs} result={result} />

      {/* Secondary View Switcher: Calculator Form vs Material Comparison vs Step-by-Step Proof */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'calculator'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>⚙️</span>
          <span>Parameter Input & Desain</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('material_comparison')}
          className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'material_comparison'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📊</span>
          <span>Perbandingan Jenis & Ukuran Pipa</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('formula_steps')}
          className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'formula_steps'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📐</span>
          <span>Rumus & Pembuktian Matematis (LMTD)</span>
        </button>
      </div>

      {/* TAB 1: CALCULATOR INPUTS FORM & SPECIFICATIONS */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Mode & Water Parameters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-cyan-400">1.</span> Mode & Parameter Beban Air
            </h3>

            {/* Calculation Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Metode Penentuan Beban Pendinginan
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: 'continuous_flow' as CoilCalculationMode,
                    title: '💧 Aliran Kontinu (Water Chiller / Convector)',
                    desc: 'Input debit air (L/min) dan delta suhu (T_in -> T_out)',
                  },
                  {
                    id: 'batch_tank' as CoilCalculationMode,
                    title: '📦 Tangki Batch (Mendinginkan Volume Air)',
                    desc: 'Input total volume (Liter) didinginkan dalam waktu t jam',
                  },
                  {
                    id: 'direct_capacity' as CoilCalculationMode,
                    title: '⚡ Kapasitas Mesin Langsung (kW / TR)',
                    desc: 'Input kapasitas kompresor / evaporator yang sudah diketahui',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setInputs((prev) => ({ ...prev, calculationMode: mode.id }))}
                    className={`p-2.5 rounded-lg text-left text-xs transition-all border ${
                      inputs.calculationMode === mode.id
                        ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/60 font-semibold'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-white font-medium">{mode.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode-specific input fields */}
            {inputs.calculationMode === 'direct_capacity' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Kapasitas Pendinginan (kW)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="200"
                      value={inputs.coolingCapacityKw}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          coolingCapacityKw: parseFloat(e.target.value) || 1,
                        }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                    />
                    <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                      ≈ {(inputs.coolingCapacityKw / 3.51685).toFixed(2)} TR
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Suhu Air Masuk (°C)</label>
                    <input
                      type="number"
                      value={inputs.waterInletTempC}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, waterInletTempC: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Suhu Air Keluar (°C)</label>
                    <input
                      type="number"
                      value={inputs.waterOutletTempC}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, waterOutletTempC: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {inputs.calculationMode === 'continuous_flow' && (
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Debit Aliran Air (Flow Rate)</span>
                    <span className="font-mono text-cyan-300 font-bold">{inputs.waterFlowRateLpm} Liter/menit</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="1"
                    value={inputs.waterFlowRateLpm}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, waterFlowRateLpm: parseInt(e.target.value) || 10 }))
                    }
                    className="w-full accent-cyan-400"
                  />
                  <div className="text-[10px] text-slate-400 font-mono">
                    ≈ {(inputs.waterFlowRateLpm * 0.06).toFixed(2)} m³/jam
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Suhu Air Masuk Hangat (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={inputs.waterInletTempC}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, waterInletTempC: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Suhu Air Dingin Keluar (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={inputs.waterOutletTempC}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, waterOutletTempC: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {inputs.calculationMode === 'batch_tank' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Volume Air Tangki Convector (Liter)</label>
                  <input
                    type="number"
                    step="50"
                    min="50"
                    max="50000"
                    value={inputs.batchWaterVolumeLiters}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        batchWaterVolumeLiters: parseFloat(e.target.value) || 100,
                      }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Suhu Air Awal (°C)</label>
                    <input
                      type="number"
                      value={inputs.batchInitialTempC}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, batchInitialTempC: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Suhu Target Dingin (°C)</label>
                    <input
                      type="number"
                      value={inputs.batchTargetTempC}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, batchTargetTempC: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Waktu Pendinginan Target</span>
                    <span className="font-mono text-cyan-300 font-bold">{inputs.batchCoolingTimeHours} Jam</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.25"
                    value={inputs.batchCoolingTimeHours}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, batchCoolingTimeHours: parseFloat(e.target.value) || 1 }))
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Pipe Material & Pipe Size Sizing (User explicitly asked) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-cyan-400">2.</span> Pilihan Jenis & Ukuran Pipa
            </h3>

            {/* Pipe Material Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Jenis Material Pipa Evaporator
              </label>
              <select
                value={inputs.pipeMaterial}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    pipeMaterial: e.target.value as PipeMaterialType,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="copper_plain">🟠 Tembaga Polos ASTM B280 (Plain Copper - Standar Industri)</option>
                <option value="copper_finned">✨ Tembaga Bersirip Spiral (Low-Fin Tube - Sangat Kompak)</option>
                <option value="ss304">⚪ Stainless Steel SS304 (Sanitary Food Grade / Air Minum)</option>
                <option value="ss316l">🛡️ Stainless Steel SS316L (Tahan Asam / Garam / Brewery)</option>
                <option value="titanium">🔵 Titanium Grade 2 (Air Laut / Marine Chiller)</option>
              </select>

              <div className="mt-2 p-2 bg-slate-950/70 border border-slate-800 rounded text-[11px] text-slate-300">
                <span className="text-cyan-400 font-semibold">Karakteristik Material: </span>
                <span>{PIPE_MATERIAL_SPECS[inputs.pipeMaterial].corrosionNotes}</span>
              </div>
            </div>

            {/* Pipe Diameter Nominal Inch Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ukuran Diameter Pipa (Nominal Inch OD)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.keys(STANDARD_PIPE_DIMENSIONS).map((sz) => {
                  const spec = STANDARD_PIPE_DIMENSIONS[sz];
                  const isSelected = inputs.pipeNominalInch === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, pipeNominalInch: sz }))}
                      className={`p-2 rounded text-center transition-all border ${
                        isSelected
                          ? 'bg-cyan-600 text-white border-cyan-400 font-bold shadow-xs'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <div className="text-xs font-mono">{sz}</div>
                      <div className="text-[10px] opacity-80 font-mono">{spec.odMm} mm</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>Tebal: {result.nominalPipeSpec.wallThicknessMm} mm</span>
                <span>ID: {result.nominalPipeSpec.idMm} mm</span>
                <span>Maks/Sirkuit: {result.nominalPipeSpec.maxRecommendedCircuitLengthM} m</span>
              </div>
            </div>

            {/* Convection Regime in Convector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pergerakan Air di Sekitar Pipa (Rezim Konveksi)
              </label>
              <select
                value={inputs.convectionRegime}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    convectionRegime: e.target.value as WaterConvectionRegime,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                {Object.keys(CONVECTION_BASELINES).map((key) => (
                  <option key={key} value={key}>
                    {CONVECTION_BASELINES[key as WaterConvectionRegime].label}
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-slate-400 mt-1">
                {CONVECTION_BASELINES[inputs.convectionRegime].description}
              </div>
            </div>
          </div>

          {/* Column 3: Refrigerant, Evaporating Temp & Coil Geometry */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-cyan-400">3.</span> Freon & Geometri Gulungan Koil
            </h3>

            {/* Refrigerant Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Jenis Refrigerant (Freon)
              </label>
              <select
                value={inputs.refrigerantId}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    refrigerantId: e.target.value as ExtendedRefrigerantId,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              >
                <option value="R404A">R404A (Komersial Chiller & Convector)</option>
                <option value="R134a">R134a (Tekanan Sedang Chiller Air Standar)</option>
                <option value="R410A">R410A (High Capacity Air Conditioner Chiller)</option>
                <option value="R32">R32 (Ramah Lingkungan GWP Rendah)</option>
                <option value="R22">R22 (HCFC Standar Industri Lama)</option>
                <option value="R290">R290 Propana (Hydrocarbon Alami Ramah Lingkungan)</option>
                <option value="R717">R717 Ammonia NH3 (Industri Pabrik Es Besar)</option>
                <option value="R507A">R507A (Azeotropic Chiller)</option>
              </select>
            </div>

            {/* Evaporating Temp & Superheat */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Suhu Evaporasi T_e (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={inputs.evaporatingTempC}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      evaporatingTempC: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                />
                <span className="text-[10px] text-slate-400">Saran: 3-5K dibawah T_out</span>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Superheat TXV (K)</label>
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  max="12"
                  value={inputs.superheatK}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, superheatK: parseFloat(e.target.value) || 5 }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                />
                <span className="text-[10px] text-slate-400">Standar: 4 - 6 K</span>
              </div>
            </div>

            {/* Coil Dimensions */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-cyan-300 block">
                📐 Dimensi Gulungan Spiral Koil
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Diameter Koil (mm)</label>
                  <input
                    type="number"
                    step="25"
                    min="150"
                    max="2000"
                    value={inputs.coilDiameterMm}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        coilDiameterMm: parseInt(e.target.value) || 300,
                      }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Pitch / Jarak Lilitan (mm)</label>
                  <input
                    type="number"
                    step="2"
                    min="15"
                    max="100"
                    value={inputs.coilPitchMm}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        coilPitchMm: parseInt(e.target.value) || 25,
                      }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Safety Factor Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Faktor Keamanan / Kotor (Fouling Margin)</span>
                <span className="font-mono text-cyan-300 font-semibold">+{inputs.foulingSafetyFactorPct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="5"
                value={inputs.foulingSafetyFactorPct}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    foulingSafetyFactorPct: parseInt(e.target.value) || 10,
                  }))
                }
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATERIAL & PIPE SIZE COMPARISON TABLE */}
      {activeTab === 'material_comparison' && (
        <div className="space-y-6">
          {/* Material Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📊</span> Perbandingan Kebutuhan Panjang Pipa Berdasarkan Jenis Material
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulasi dengan beban kalor tetap ({result.effectiveCoolingLoadKw.toFixed(2)} kW) dan ukuran pipa {inputs.pipeNominalInch}.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-300 font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Jenis Material Pipa</th>
                    <th className="py-2.5 px-3">Standar Pabrikan</th>
                    <th className="py-2.5 px-3 text-right">Konduktivitas k (W/m·K)</th>
                    <th className="py-2.5 px-3 text-right">U-Value (W/m²K)</th>
                    <th className="py-2.5 px-3 text-right text-cyan-300">Panjang Pipa (m)</th>
                    <th className="py-2.5 px-3 text-right">Sirkuit</th>
                    <th className="py-2.5 px-3 text-right">Berat (kg)</th>
                    <th className="py-2.5 px-3">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {materialComparisons.map((row) => {
                    const isCurrent = inputs.pipeMaterial === row.materialKey;
                    return (
                      <tr
                        key={row.materialKey}
                        className={isCurrent ? 'bg-cyan-950/40 text-cyan-200' : 'hover:bg-slate-800/40 text-slate-300'}
                      >
                        <td className="py-2.5 px-3 font-semibold font-sans flex items-center gap-2">
                          {isCurrent && <span className="text-cyan-400">●</span>}
                          {row.spec.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{row.spec.standard}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{row.spec.kConductivity}</td>
                        <td className="py-2.5 px-3 text-right">{row.uValue.toFixed(0)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white text-sm">
                          {row.lengthMeters.toFixed(2)} m
                        </td>
                        <td className="py-2.5 px-3 text-right">{row.circuits}</td>
                        <td className="py-2.5 px-3 text-right">{row.weightKg.toFixed(1)} kg</td>
                        <td className="py-2.5 px-3">
                          {!isCurrent ? (
                            <button
                              type="button"
                              onClick={() => setInputs((prev) => ({ ...prev, pipeMaterial: row.materialKey }))}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-[10px] transition-colors"
                            >
                              Gunakan
                            </button>
                          ) : (
                            <span className="text-cyan-400 text-[10px] font-semibold">Aktif</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pipe Size Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📐</span> Perbandingan Kebutuhan Panjang Jika Memakai Berbagai Ukuran Pipa
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Semakin besar diameter pipa (OD), luas permukaan per meter semakin luas sehingga panjang total yang dibutuhkan semakin pendek.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-300 font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Ukuran Nominal</th>
                    <th className="py-2.5 px-3 text-right">OD (mm)</th>
                    <th className="py-2.5 px-3 text-right">ID (mm)</th>
                    <th className="py-2.5 px-3 text-right">Tebal Dinding</th>
                    <th className="py-2.5 px-3 text-right text-cyan-300">Total Panjang (m)</th>
                    <th className="py-2.5 px-3 text-right">Sirkuit Paralel</th>
                    <th className="py-2.5 px-3 text-right">Panjang/Sirkuit</th>
                    <th className="py-2.5 px-3 text-right">Berat Pipa</th>
                    <th className="py-2.5 px-3">Pilih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {pipeSizeComparisons.map((row) => {
                    const isSelected = inputs.pipeNominalInch === row.nominalInch;
                    return (
                      <tr
                        key={row.nominalInch}
                        className={isSelected ? 'bg-cyan-950/40 text-cyan-200' : 'hover:bg-slate-800/40 text-slate-300'}
                      >
                        <td className="py-2.5 px-3 font-bold font-mono text-white">{row.nominalInch}</td>
                        <td className="py-2.5 px-3 text-right">{row.dim.odMm.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right">{row.dim.idMm.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right">{row.dim.wallThicknessMm} mm</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white text-sm">
                          {row.totalLengthMeters.toFixed(2)} m
                        </td>
                        <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">{row.circuits}</td>
                        <td className="py-2.5 px-3 text-right">{row.lengthPerCircuit.toFixed(2)} m</td>
                        <td className="py-2.5 px-3 text-right">{row.weightKg.toFixed(1)} kg</td>
                        <td className="py-2.5 px-3">
                          {!isSelected ? (
                            <button
                              type="button"
                              onClick={() => setInputs((prev) => ({ ...prev, pipeNominalInch: row.nominalInch }))}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-[10px] transition-colors"
                            >
                              Gunakan
                            </button>
                          ) : (
                            <span className="text-cyan-400 text-[10px] font-semibold">Aktif</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STEP-BY-STEP FORMULA LOG */}
      {activeTab === 'formula_steps' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-lg space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📐</span> Rincian Tahapan & Rumus Perhitungan Termal Evaporator Coil
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Transparansi perhitungan teknik termodinamika penukar kalor sesuai kaidah ASHRAE dan prinsip perpindahan panas industri.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {result.calculationSteps.map((st, sIdx) => (
              <div key={sIdx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                    {st.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    Step {sIdx + 1}
                  </span>
                </div>
                <div className="text-xs font-mono text-emerald-300 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800">
                  {st.formula}
                </div>
                <div className="text-xs font-mono font-bold text-white pt-1">
                  Hasil: <span className="text-cyan-300">{st.value}</span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  {st.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practical Fabrication & Engineering Advice Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs text-slate-300 space-y-3">
        <h4 className="font-semibold text-white tracking-wide uppercase flex items-center gap-2">
          <span>💡</span> Panduan Praktis Fabrikasi Evaporator Coil di Lapangan
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
            <span className="font-semibold text-cyan-400 block">1. Pembagian Sirkuit & Distributor</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Pipa koil tidak boleh dibuat 1 jalur panjang melebihi {result.nominalPipeSpec.maxRecommendedCircuitLengthM} m. Pembagian menjadi {result.recommendedCircuits} sirkuit paralel dengan pipa kapiler spider distributor memastikan aliran freon merata dan mencegah oil trapping.
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
            <span className="font-semibold text-amber-400 block">2. Pencegahan Pembentukan Es (Freeze-up)</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Air dalam convector harus selalu diaduk/disirkulasikan. Jika air diam, suhu sekitar pipa dapat turun di bawah 0°C dan membentuk kerak es tebal yang menyekat transfer panas secara drastis.
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
            <span className="font-semibold text-emerald-400 block">3. Penempatan Sensing Bulb TXV</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Pasang sensing bulb katup ekspansi pada pipa hisap suction horizontal setelah keluar tangki convector pada posisi arah jam 2 atau jam 10, diisolasi rapat dengan Armaflex agar tidak terpengaruh suhu udara luar.
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        reportTitle="LAPORAN DESAIN EVAPORATOR COIL CONVECTOR"
        messageText={waReportMessage}
      />
    </div>
  );
};
