import React, { useState } from 'react';
import {
  ColdRoomApplication,
  PanelInsulationType,
} from '../types/coldRoom';
import { ExtendedRefrigerantId } from '../types/phDiagram';
import { CompanyBranding } from '../types/branding';
import {
  calculateColdRoom,
  PANEL_SPECS_DATA,
  PRODUCT_PROFILES,
} from '../utils/coldRoomCalculations';
import { ColdRoomPipingDiagram } from './ColdRoomPipingDiagram';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { buildWhatsAppReportMessage } from '../utils/whatsappShare';

interface ColdRoomCalculatorProps {
  branding?: CompanyBranding;
}

export const ColdRoomCalculator: React.FC<ColdRoomCalculatorProps> = ({ branding }) => {
  // Application Selection
  const [application, setApplication] = useState<ColdRoomApplication>('beef_meat');
  const [appCategoryFilter, setAppCategoryFilter] = useState<string>('all');
  const [viewSection, setViewSection] = useState<'both' | 'diagram' | 'calculator'>('both');

  // Room Dimensions (meters)
  const [lengthM, setLengthM] = useState<number>(6);
  const [widthM, setWidthM] = useState<number>(4);
  const [heightM, setHeightM] = useState<number>(3);

  // Insulation Panel
  const [panelType, setPanelType] = useState<PanelInsulationType>('pu_sandwich_100');
  const [isFloorInsulated, setIsFloorInsulated] = useState<boolean>(true);

  // Temperatures
  const [ambientTempC, setAmbientTempC] = useState<number>(35);
  const [customRoomTemp, setCustomRoomTemp] = useState<number | undefined>(undefined);
  const [customEnteringTemp, setCustomEnteringTemp] = useState<number | undefined>(undefined);

  // Refrigerant Selection
  const [selectedRefrigerant, setSelectedRefrigerant] = useState<ExtendedRefrigerantId>('R404A');

  // Daily Product Turnover
  const [productKgPerDay, setProductKgPerDay] = useState<number>(2000);

  // Infiltration & Operations
  const [doorFrequency, setDoorFrequency] = useState<'minimal' | 'moderate' | 'heavy'>('moderate');
  const [hasAirCurtain, setHasAirCurtain] = useState<boolean>(true);
  const [occupants, setOccupants] = useState<number>(2);
  const [occupantHours, setOccupantHours] = useState<number>(4);
  const [compressorRunHours, setCompressorRunHours] = useState<number>(18);
  const [safetyFactor, setSafetyFactor] = useState<number>(10);
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);

  // Copy report state
  const [copied, setCopied] = useState<boolean>(false);

  const product = PRODUCT_PROFILES[application];
  const targetRoomTemp = customRoomTemp !== undefined ? customRoomTemp : product.targetRoomTempC;
  const enteringProductTemp = customEnteringTemp !== undefined ? customEnteringTemp : product.typicalEnteringTempC;

  // Calculation
  const result = calculateColdRoom({
    lengthM,
    widthM,
    heightM,
    application,
    panelType,
    ambientTempC,
    dailyProductTurnoverKg: productKgPerDay,
    enteringProductTempC: enteringProductTemp,
    targetRoomTempC: targetRoomTemp,
    isFloorInsulated,
    occupantCount: occupants,
    occupantHoursPerDay: occupantHours,
    lightingHoursPerDay: 8,
    doorOpeningFrequency: doorFrequency,
    hasAirCurtainOrStrip: hasAirCurtain,
    compressorRunHoursPerDay: compressorRunHours,
    safetyFactorPercent: safetyFactor,
    selectedRefrigerant,
  });

  const allApps = Object.values(PRODUCT_PROFILES);
  const filteredApps = allApps.filter((a) => {
    if (appCategoryFilter === 'all') return true;
    return a.category.includes(appCategoryFilter);
  });

  const handleSelectApp = (appId: ColdRoomApplication) => {
    setApplication(appId);
    const p = PRODUCT_PROFILES[appId];
    setCustomRoomTemp(undefined);
    setCustomEnteringTemp(undefined);
    // Auto suggest recommended panel & refrigerant
    if (p.targetRoomTempC <= -30) {
      setPanelType('pu_sandwich_150');
      setSelectedRefrigerant('R507A');
    } else if (p.targetRoomTempC <= -15) {
      setPanelType('pu_sandwich_100');
      setSelectedRefrigerant('R404A');
    } else {
      setPanelType('pu_sandwich_75');
      setSelectedRefrigerant('R134a');
    }
  };

  const handleAutoSelectRefrigerant = () => {
    if (targetRoomTemp <= -30) {
      setSelectedRefrigerant('R507A');
    } else if (targetRoomTemp <= 0) {
      setSelectedRefrigerant('R404A');
    } else {
      setSelectedRefrigerant('R134a');
    }
  };

  const panel = PANEL_SPECS_DATA[panelType];

  const waReportMessage = buildWhatsAppReportMessage({
    title: 'Lembar Rancangan Teknis Cold Storage / Cold Room',
    productName: `Cold Room ${product.name} (${product.category})`,
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    companyName: branding?.companyName,
    sections: [
      {
        heading: 'Data Fisik & Dimensi Cold Room',
        items: [
          { label: 'Dimensi (P x L x T)', value: `${lengthM} x ${widthM} x ${heightM} m (Vol: ${result.internalVolumeM3} m³)` },
          { label: 'Luas Lantai / Selubung', value: `${result.internalFloorAreaM2} m² / ${result.totalEnvelopeAreaM2} m²` },
          { label: 'Panel PU', value: `${panel.name} (${panel.thicknessMm} mm, U=${panel.uValue} W/m²K)` },
          { label: 'Lantai', value: isFloorInsulated ? 'Lantai Panel PU Berinsulasi' : 'Lantai Cor Beton Non-Insulasi' },
        ],
      },
      {
        heading: 'Kondisi Termal & Produk',
        items: [
          { label: 'Suhu Luar (Ambient)', value: `${ambientTempC}°C` },
          { label: 'Target Suhu Ruang', value: `${targetRoomTemp}°C` },
          { label: 'Suhu Masuk Produk', value: `${enteringProductTemp}°C` },
          { label: 'Perputaran Produk', value: `${productKgPerDay.toLocaleString('id-ID')} kg/hari (${(productKgPerDay / 1000).toFixed(2)} ton/hari)` },
        ],
      },
      {
        heading: 'Beban Kalor & Rekomendasi Mesin',
        items: [
          { label: 'Total Beban Harian', value: `${result.totalHeatLoadKjDay.toLocaleString('id-ID')} kJ/hari (${result.totalHeatLoadKwhDay} kWh/hari)` },
          { label: 'Kapasitas Pendinginan', value: `${result.requiredRefrigerationKw} kW (${result.requiredRefrigerationBtuH.toLocaleString('id-ID')} BTU/h)` },
          { label: 'Tonase Refrigerasi (TR)', value: `${result.requiredRefrigerationTr} TR` },
          { label: 'Kompresor Unit', value: `${result.recommendedCondensingUnitHp} HP (${result.recommendedCompressorType})` },
          { label: 'Refrigerant', value: `${selectedRefrigerant}` },
          { label: 'Evaporator Blower', value: `${result.requiredRefrigerationKw} kW (${result.evaporatorAirflowCmh.toLocaleString('id-ID')} m³/h)` },
        ],
      },
    ],
    directNotes: `Safety factor ${result.safetyFactorPercent}%, estimasi waktu kompresor kerja ${result.compressorRunHoursPerDay} jam/hari. Diterbitkan oleh ${branding?.companyName || 'CV REFRIGERASI TEKNIK UTAMA'}.`,
  });

  const handleCopyReport = async () => {
    const brandingHeader = branding
      ? `===========================================
${branding.companyName.toUpperCase()} (${branding.shortName})
${branding.tagline}
Alamat: ${branding.address}, ${branding.city}
Telp/WA: ${branding.phone} | Email: ${branding.email}
Penanggung Jawab Teknik: ${branding.directorName}
===========================================
`
      : '';

    const report = `${brandingHeader}LEMBAR RANCANGAN TEKNIS COLD STORAGE / COLD ROOM
Aplikasi: ${product.name} (${product.category})
Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
===========================================

1. DATA FISIK & DIMENSI COLD ROOM:
   - Dimensi Ruangan (P x L x T): ${lengthM} x ${widthM} x ${heightM} meter
   - Luas Lantai: ${result.internalFloorAreaM2} m² | Volume Dalam: ${result.internalVolumeM3} m³
   - Total Luas Selubung Insulasi: ${result.totalEnvelopeAreaM2} m²
   - Jenis Panel Dinding & Atap: ${panel.name} (Tebal ${panel.thicknessMm} mm, U = ${panel.uValue} W/m²·K)
   - Kondisi Lantai: ${isFloorInsulated ? 'Lantai Panel PU Berinsulasi (Tahan Dingin)' : 'Lantai Cor Beton Non-Insulasi'}

2. KONDISI SUHU & PERPUTARAN PRODUK:
   - Suhu Udara Luar (Ambient): ${ambientTempC} °C
   - Suhu Target Ruang Cold Room: ${targetRoomTemp} °C
   - Suhu Produk Saat Masuk: ${enteringProductTemp} °C
   - Perputaran Produk Harian: ${productKgPerDay.toLocaleString('id-ID')} kg/hari (${(productKgPerDay / 1000).toFixed(2)} ton/hari)
   - Frekuensi Buka Pintu: ${doorFrequency} (Tirai PVC / Air Curtain: ${hasAirCurtain ? 'Aktif' : 'Tidak Ada'})

3. HASIL PERHITUNGAN BEBAN KALOR (HEAT LOAD):
   - Beban Transmisi Dinding/Atap: ${result.transmissionLoadKjDay.toLocaleString('id-ID')} kJ/hari (${result.loadBreakdownPercentages.transmission}%)
   - Beban Kalor Produk (Sensibel + Laten): ${result.totalProductLoadKjDay.toLocaleString('id-ID')} kJ/hari (${result.loadBreakdownPercentages.product}%)
   - Beban Infiltrasi Udara Buka Pintu: ${result.airInfiltrationLoadKjDay.toLocaleString('id-ID')} kJ/hari (${result.loadBreakdownPercentages.infiltration}%)
   - Beban Internal (Pekerja, Lampu, Blower, Defrost): ${result.totalInternalLoadKjDay.toLocaleString('id-ID')} kJ/hari (${result.loadBreakdownPercentages.internal}%)
   -----------------------------------------
   TOTAL BEBAN KALOR HARIAN: ${result.totalHeatLoadKjDay.toLocaleString('id-ID')} kJ/hari (${result.totalHeatLoadKwhDay} kWh/hari)
   Safety Factor: ${result.safetyFactorPercent} %
   Waktu Kerja Kompresor Rencana: ${result.compressorRunHoursPerDay} jam/hari

4. SPESIFIKASI PERALATAN MESIN & SIRKUIT FREON:
   - Kapasitas Pendinginan Diperlukan: ${result.requiredRefrigerationKw} kW
   - Ekivalen BTU/jam: ${result.requiredRefrigerationBtuH.toLocaleString('id-ID')} BTU/h
   - Tonase Refrigerasi: ${result.requiredRefrigerationTr} TR
   - Kapasitas Mesin Condensing Unit: ${result.recommendedCondensingUnitHp} HP / PK
   - Rekomendasi Tipe Kompresor: ${result.recommendedCompressorType}
   - Pilihan Refrigerant (Freon): ${result.refrigerantAnalysis.name} (${result.refrigerantAnalysis.formula})
   - Klasifikasi Keselamatan: ASHRAE ${result.refrigerantAnalysis.safetyClass} | GWP: ${result.refrigerantAnalysis.gwp}
   - Suhu Evaporasi (Te): ${result.refrigerantAnalysis.evaporatingTempC} °C | Tekanan Suction: ${result.refrigerantAnalysis.suctionPressureBarGauge} bar-g (${result.refrigerantAnalysis.suctionPressurePsig} psig)
   - Suhu Kondensasi (Tc): ${result.refrigerantAnalysis.condensingTempC} °C | Tekanan Discharge: ${result.refrigerantAnalysis.dischargePressureBarGauge} bar-g (${result.refrigerantAnalysis.dischargePressurePsig} psig)
   - Rasio Kompresi (Pc/Pe): ${result.refrigerantAnalysis.compressionRatio} [${result.refrigerantAnalysis.compressionRatioStatus}]
   - Laju Aliran Massa Freon: ${result.refrigerantAnalysis.massFlowRateKgH} kg/jam (${result.refrigerantAnalysis.massFlowRateKgMin} kg/menit)
   - Estimasi Muatan Freon Sistem: ±${result.refrigerantAnalysis.estimatedChargeKg} kg
   - Rekomendasi Pipa Cair (Liquid Line): OD ${result.refrigerantAnalysis.recommendedLiquidLineInch}
   - Rekomendasi Pipa Hisap (Suction Line): OD ${result.refrigerantAnalysis.recommendedSuctionLineInch}
   - Rekomendasi Pipa Gas Buang (Discharge): OD ${result.refrigerantAnalysis.recommendedDischargeLineInch}
   - Rekomendasi Pelumas Kompresor: ${result.refrigerantAnalysis.recommendedOilType}

5. SPESIFIKASI UNIT COOLER (EVAPORATOR BLOWER):
   - Debit Aliran Udara Evaporator: ${result.evaporatorAirflowCmh.toLocaleString('id-ID')} m³/jam (${result.evaporatorAirflowCfm.toLocaleString('id-ID')} CFM)
   - Jarak Sirip Fin Evaporator: ${result.recommendedFinSpacingMm} mm (Mencegah pemblokiran es)
   - Sistem Pencairan Es (Defrost): ${result.defrostType}

6. DAFTAR PERALATAN & AKSESORI PEMIPAAN P&ID (DIAGRAM PEMIPAAN):
   - [COMP-01] Kompresor: ${result.recommendedCondensingUnitHp} HP (${result.recommendedCompressorType}) | Daya: ~${result.refrigerantAnalysis.compressorWorkEstimateKw} kW
   - [COND-01] Kondensor Udara: Buang Kalor ${result.refrigerantAnalysis.condenserHeatRejectionKw} kW (${result.refrigerantAnalysis.condenserHeatRejectionBtuH.toLocaleString('id-ID')} BTU/h)
   - [REC-01] Liquid Receiver: ${result.refrigerantAnalysis.recommendedReceiverVolumeLiters} Liter Vertical Vessel (Safety PRV 28 bar)
   - [SEP-01] Oil Separator: ${result.refrigerantAnalysis.recommendedOilSeparator}
   - [FLT-01] Filter Drier: ${result.refrigerantAnalysis.recommendedFilterDrier}
   - [SG-01] Sight Glass: ${result.refrigerantAnalysis.recommendedSightGlass}
   - [SOL-01] Solenoid Valve: ${result.refrigerantAnalysis.recommendedSolenoidValve}
   - [TXV-01] Katup Ekspansi: ${result.refrigerantAnalysis.recommendedExpansionValve}
   - [EVAP-01] Evaporator Blower: ${result.requiredRefrigerationKw} kW (${result.evaporatorAirflowCmh.toLocaleString('id-ID')} m³/h)
   - [ACC-01] Akumulator Hisap: ${result.refrigerantAnalysis.recommendedSuctionAccumulator}
   - [PIPE-DIS] Pipa Gas Panas Buang: OD ${result.refrigerantAnalysis.recommendedDischargeLineInch}
   - [PIPE-LIQ] Pipa Cair: OD ${result.refrigerantAnalysis.recommendedLiquidLineInch}
   - [PIPE-SUC] Pipa Gas Hisap: OD ${result.refrigerantAnalysis.recommendedSuctionLineInch} (Insulasi Armaflex 25-32 mm)
===========================================`;

    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Intro & Application Selector Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide font-mono">
              Kalkulator Perancangan Cold Room & Cold Storage
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Perhitungan beban transmisi selubung panel PU, kalor produk (sensibel & laten beku), infiltrasi buka pintu, dan penentuan kapasitas HP kompresor serta evaporator.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsWaModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-mono font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5 whitespace-nowrap shrink-0"
              title="Bagikan rancangan teknis cold room langsung ke WhatsApp"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Share ke WA</span>
            </button>
            <button
              onClick={handleCopyReport}
              className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30'
              }`}
            >
              {copied ? 'Laporan Disalin! ✓' : 'Salin Laporan Cold Room'}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
            Pilih Bidang Penggunaan / Jenis Komoditas:
          </span>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
            {[
              { id: 'all', label: 'Semua (12)' },
              { id: 'Chiller', label: 'Chiller (+2° s/d +8°C)' },
              { id: 'Freezer', label: 'Freezer (-18° s/d -25°C)' },
              { id: 'Blast', label: 'Blast Freezer (-38°C)' },
              { id: 'Farmasi', label: 'Khusus Farmasi / Medis' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setAppCategoryFilter(cat.id)}
                className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                  appCategoryFilter === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 12 Application Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filteredApps.map((item) => {
            const isSelected = application === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectApp(item.id)}
                className={`p-3 rounded text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{item.name.split('(')[0]}</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded ${
                        item.targetRoomTempC <= -25
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : item.targetRoomTempC <= -15
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {item.targetRoomTempC}°C
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1 line-clamp-1">
                    {item.description}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2 pt-1 border-t border-slate-800/50">
                  <span>Masuk: {item.typicalEnteringTempC}°C</span>
                  <span>RH: {item.targetHumidityRhPercent}%</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Profile Info */}
        <div className="p-3 bg-slate-950 rounded border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-cyan-300 font-bold">{product.name}</span>
            <span className="text-slate-400">· Kategori: {product.category}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Suhu Beku: <strong className="text-white">{product.freezingPointC}°C</strong></span>
            <span>Kalor Laten: <strong className="text-white">{product.latentHeatFreezing} kJ/kg</strong></span>
            <span>Jarak Fin: <strong className="text-cyan-300">{product.recommendedFinSpacingMm} mm</strong></span>
          </div>
        </div>
      </div>

      {/* View Switcher: Diagram Pemipaan vs Form Input Desain */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5 sm:px-4 gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-xs font-mono uppercase text-slate-300 font-semibold">Mode Tampilan:</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setViewSection('both')}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
              viewSection === 'both'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/50'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>⚡ Tampilan Lengkap (Diagram P&amp;ID + Kalkulator)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewSection('diagram')}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
              viewSection === 'diagram'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/50'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>📐 Diagram Pemipaan (P&amp;ID)</span>
            <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[10px] rounded border border-amber-400/40 font-bold">
              Kalkulasi Aktif
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewSection('calculator')}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
              viewSection === 'calculator'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/50'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>📋 Parameter Mesin &amp; Beban Kalor Saja</span>
          </button>
        </div>
      </div>

      {/* Cold Room Refrigeration Piping Diagram (P&ID) with embedded calculations */}
      {(viewSection === 'both' || viewSection === 'diagram') && (
        <ColdRoomPipingDiagram
          result={result}
          roomTempC={targetRoomTemp}
          ambientTempC={ambientTempC}
        />
      )}

      {/* Two Column Grid: Inputs & Engineering Results */}
      {(viewSection === 'both' || viewSection === 'calculator') && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Dimensi Fisik Ruangan */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                01. Dimensi Fisik Cold Room (Meter)
              </span>
              <div className="text-xs font-mono text-slate-400">
                Lantai: <strong className="text-white">{result.internalFloorAreaM2} m²</strong> · Vol: <strong className="text-white">{result.internalVolumeM3} m³</strong>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Panjang (m)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="100"
                  value={lengthM}
                  onChange={(e) => setLengthM(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-sm font-mono text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Lebar (m)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="100"
                  value={widthM}
                  onChange={(e) => setWidthM(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-sm font-mono text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Tinggi (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="2"
                  max="15"
                  value={heightM}
                  onChange={(e) => setHeightM(parseFloat(e.target.value) || 2)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-sm font-mono text-white outline-none"
                />
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Total Luas Selubung Dinding + Plafon + Lantai: <strong className="text-slate-200">{result.totalEnvelopeAreaM2} m²</strong>
            </div>
          </div>

          {/* Section 2: Panel Insulasi Sandwich PU / PIR */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block pb-3 border-b border-slate-800">
              02. Panel Insulasi Dinding &amp; Lantai
            </span>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Jenis &amp; Tebal Sandwich Panel Dinding/Atap:
                </label>
                <select
                  value={panelType}
                  onChange={(e) => setPanelType(e.target.value as PanelInsulationType)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-xs font-mono text-white outline-none"
                >
                  <option value="pu_sandwich_50">PU Panel 50 mm (U = 0.44 W/m²K) &ndash; Chiller Ringan / Anteroom</option>
                  <option value="pu_sandwich_75">PU Panel 75 mm (U = 0.30 W/m²K) &ndash; Chiller Standar</option>
                  <option value="pu_sandwich_100">PU Panel 100 mm (U = 0.22 W/m²K) &ndash; Freezer Standar [Rekomendasi]</option>
                  <option value="pu_sandwich_125">PU Panel 125 mm (U = 0.18 W/m²K) &ndash; Freezer Berat (-25°C)</option>
                  <option value="pu_sandwich_150">PU Panel 150 mm (U = 0.15 W/m²K) &ndash; Deep / Blast Freezer</option>
                  <option value="pu_sandwich_200">PU Panel 200 mm (U = 0.11 W/m²K) &ndash; Ultra-Deep Freezer (-40°C)</option>
                  <option value="pir_sandwich_100">PIR Panel 100 mm (U = 0.21 W/m²K) &ndash; Polyisocyanurate Tahan Api B1</option>
                  <option value="eps_polystyrene">EPS Panel 100 mm (U = 0.36 W/m²K) &ndash; Styrofoam Ekonomis</option>
                </select>
              </div>

              {/* Floor toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Konstruksi Lantai Berinsulasi (Insulated Floor)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Freezer wajib memakai lantai panel PU / plat bordes agar tanah tidak membeku (frost heave).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFloorInsulated(!isFloorInsulated)}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    isFloorInsulated
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isFloorInsulated ? 'Ya (Panel PU)' : 'Cor Semen Biasa'}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Kondisi Suhu & Beban Produk */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block pb-3 border-b border-slate-800">
              03. Suhu Operasi &amp; Kapasitas Muatan Harian
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Suhu Luar */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Suhu Lingkungan Luar</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={ambientTempC}
                    onChange={(e) => setAmbientTempC(parseInt(e.target.value, 10) || 30)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-white text-center"
                  />
                  <span className="text-xs font-mono text-slate-400">°C</span>
                </div>
                <span className="text-[10px] text-slate-500">Standar tropis 35°C</span>
              </div>

              {/* Suhu Target Ruang */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Suhu Target Ruangan</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={targetRoomTemp}
                    onChange={(e) => setCustomRoomTemp(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-400 font-bold text-center"
                  />
                  <span className="text-xs font-mono text-slate-400">°C</span>
                </div>
                <span className="text-[10px] text-slate-500">Default: {product.targetRoomTempC}°C</span>
              </div>

              {/* Suhu Masuk Produk */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Suhu Awal Produk Masuk</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={enteringProductTemp}
                    onChange={(e) => setCustomEnteringTemp(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-amber-400 font-bold text-center"
                  />
                  <span className="text-xs font-mono text-slate-400">°C</span>
                </div>
                <span className="text-[10px] text-slate-500">Default: {product.typicalEnteringTempC}°C</span>
              </div>
            </div>

            {/* Daily Product Load kg */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <label>Muatan Produk Masuk per Hari (Daily Turnover):</label>
                <span className="font-mono text-cyan-400 font-bold">
                  {productKgPerDay.toLocaleString('id-ID')} kg ({(productKgPerDay / 1000).toFixed(2)} Ton)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="100"
                  max="20000"
                  step="100"
                  value={productKgPerDay}
                  onChange={(e) => setProductKgPerDay(parseInt(e.target.value, 10))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <input
                  type="number"
                  min="50"
                  max="100000"
                  step="100"
                  value={productKgPerDay}
                  onChange={(e) => setProductKgPerDay(Math.max(10, parseInt(e.target.value, 10) || 10))}
                  className="w-24 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-center font-mono text-xs text-white"
                />
              </div>
              <span className="text-[11px] text-slate-500">
                Jumlah bahan pangan / barang yang dimasukkan dan perlu didinginkan setiap harinya.
              </span>
            </div>
          </div>

          {/* Section 4: Pilihan Jenis Refrigerant (Freon) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                04. Pilihan Jenis Refrigerant (Freon)
              </span>
              <button
                type="button"
                onClick={handleAutoSelectRefrigerant}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 px-2.5 py-1 rounded border border-cyan-500/30 transition-all flex items-center gap-1.5"
                title="Rekomendasikan refrigerant terbaik berdasarkan suhu target cold room saat ini"
              >
                <span className="text-amber-400">⚡</span> Auto-Saran Suhu
              </button>
            </div>

            {/* Quick Selection Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Pilihan Cepat Refrigerant Populer:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'R404A', label: 'R-404A', note: 'Standar Industri' },
                  { id: 'R507A', label: 'R-507A', note: 'Blast & Deep Freeze' },
                  { id: 'R134a', label: 'R-134a', note: 'Chiller Suhu Positif' },
                  { id: 'R290', label: 'R-290', note: 'Eco Propana (A3)' },
                  { id: 'R22', label: 'R-22', note: 'Konvensional Retrofit' },
                  { id: 'R717', label: 'R-717', note: 'Amoniak Tonase Besar' },
                  { id: 'R744', label: 'R-744', note: 'CO₂ Modern Subkritis' },
                  { id: 'R407C', label: 'R-407C', note: 'Chiller & Anteroom' },
                ].map((item) => {
                  const isSelected = selectedRefrigerant === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedRefrigerant(item.id as ExtendedRefrigerantId)}
                      className={`p-2 rounded text-left border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/50'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold">{item.label}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 truncate">
                        {item.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dropdown for All 15 Refrigerants */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-slate-300 block">
                Atau Pilih dari Seluruh Koleksi Refrigerant Lengkap:
              </label>
              <select
                value={selectedRefrigerant}
                onChange={(e) => setSelectedRefrigerant(e.target.value as ExtendedRefrigerantId)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
              >
                <optgroup label="Refrigerant Standar HFC Komersial">
                  <option value="R404A">R-404A (HFC Blend - Standar Cold Room Freezer/Chiller)</option>
                  <option value="R507A">R-507A (HFC Azeotropik - Deep/Blast Freezer Tanpa Glide)</option>
                  <option value="R134a">R-134a (Tetrafluoroethane - Chiller Sayur, Buah, Susu, Vaksin)</option>
                  <option value="R407C">R-407C (HFC Blend - Chiller Suhu Positif & Pengganti R22)</option>
                  <option value="R410A">R-410A (HFC Tekanan Tinggi - Anteroom & Ruang Proses AC)</option>
                  <option value="R32">R-32 (Difluoromethane - Inverter Modern GWP 675)</option>
                  <option value="R23">R-23 (Fluoroform - Cryogenic Ultra-Low Temp -80°C)</option>
                </optgroup>
                <optgroup label="Refrigerant Alami & Ramah Lingkungan (Natural)">
                  <option value="R717">R-717 Amonia / NH₃ (Natural B2L - Cold Storage Industri Raksasa)</option>
                  <option value="R744">R-744 CO₂ Karbon Dioksida (Natural A1 - GWP 1 Kaskade/Transkritis)</option>
                  <option value="R290">R-290 Propana (Hydrocarbon A3 - Efisiensi Sangat Tinggi GWP 3)</option>
                  <option value="R600a">R-600a Isobutana (Hydrocarbon A3 - Unit Pendingin Kecil)</option>
                  <option value="R1270">R-1270 Propilena (Hydrocarbon A3 - Industri Petrokimia)</option>
                </optgroup>
                <optgroup label="HCFC & HFO Generasi Baru">
                  <option value="R22">R-22 Klorodifluorometana (HCFC - Cold Storage Konvensional)</option>
                  <option value="R1234yf">R-1234yf (HFO A2L - Ultra-Low GWP &lt; 1 Generasi Baru)</option>
                  <option value="R1234ze">R-1234ze (HFO A2L - Eco Chiller Generasi Baru)</option>
                </optgroup>
              </select>
            </div>

            {/* Active Refrigerant Profile Card */}
            <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-300">
                    {result.refrigerantAnalysis.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({result.refrigerantAnalysis.formula})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    ASHRAE: {result.refrigerantAnalysis.safetyClass}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    GWP: {result.refrigerantAnalysis.gwp}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {result.refrigerantAnalysis.typicalApplicationNote}
              </p>
            </div>
          </div>

          {/* Section 5: Infiltrasi Pintu & Operasional */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block pb-3 border-b border-slate-800">
              05. Infiltrasi Pintu &amp; Waktu Kerja Mesin
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Door Opening Frequency */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Frekuensi Buka Pintu Cold Room</label>
                <select
                  value={doorFrequency}
                  onChange={(e) => setDoorFrequency(e.target.value as 'minimal' | 'moderate' | 'heavy')}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white outline-none"
                >
                  <option value="minimal">Minimal (&lt; 10 kali/hari &ndash; Gudang Stok Long Term)</option>
                  <option value="moderate">Sedang (10 - 30 kali/hari &ndash; Distribusi Reguler)</option>
                  <option value="heavy">Tinggi / Padat (&gt; 40 kali/hari &ndash; Supermarket/Loading Sibuk)</option>
                </select>
              </div>

              {/* Strip Curtain */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Tirai Plastik PVC / Air Curtain</label>
                <select
                  value={hasAirCurtain ? 'yes' : 'no'}
                  onChange={(e) => setHasAirCurtain(e.target.value === 'yes')}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white outline-none"
                >
                  <option value="yes">Dipasang Tirai PVC Strip (Hemat ~35% Infiltrasi)</option>
                  <option value="no">Tanpa Tirai Plastik (Infiltrasi Udara Panas Penuh)</option>
                </select>
              </div>

              {/* Compressor Running Hours */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <label>Jam Operasi Kompresor / Hari</label>
                  <span className="font-mono text-cyan-400">{compressorRunHours} Jam</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="22"
                  value={compressorRunHours}
                  onChange={(e) => setCompressorRunHours(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">
                  Standar industri: 16-18 jam (memberi waktu istirahat & siklus defrost).
                </span>
              </div>

              {/* Safety Factor */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <label>Faktor Keamanan (Safety Margin)</label>
                  <span className="font-mono text-cyan-400">{safetyFactor} %</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={safetyFactor}
                  onChange={(e) => setSafetyFactor(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Umumnya 10% s/d 15%.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Console: Engineering Results (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Sizing Box */}
          <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-6 shadow-lg shadow-cyan-950/40 space-y-5">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center justify-between">
              <span>Kapasitas Mesin Pendingin Diperlukan</span>
              <span className="text-[10px] text-slate-400">ASHRAE Cold Storage</span>
            </div>

            {/* Condensing Unit HP Big Display */}
            <div className="pb-4 border-b border-slate-800">
              <span className="block text-xs font-mono text-slate-400 uppercase">
                Ukuran Condensing Unit (Kompresor)
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                  {result.recommendedCondensingUnitHp} HP
                </span>
                <span className="text-sm font-mono text-cyan-400">
                  ({result.recommendedCondensingUnitHp} PK)
                </span>
              </div>
              <p className="text-xs text-cyan-300 mt-2 font-medium">
                {result.recommendedCompressorType}
              </p>
            </div>

            {/* Required Capacities in Multi-Unit */}
            <div className="grid grid-cols-3 gap-3 pb-4 border-b border-slate-800 text-center">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="block text-[10px] font-mono text-slate-400 uppercase">Kapasitas Termal</span>
                <span className="text-lg font-mono font-bold text-cyan-400 tabular-nums">
                  {result.requiredRefrigerationKw}
                </span>
                <span className="block text-[10px] font-mono text-slate-500">kW</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="block text-[10px] font-mono text-slate-400 uppercase">Tonase Pendingin</span>
                <span className="text-lg font-mono font-bold text-white tabular-nums">
                  {result.requiredRefrigerationTr}
                </span>
                <span className="block text-[10px] font-mono text-slate-500">TR (Tons)</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="block text-[10px] font-mono text-slate-400 uppercase">Beban BTU</span>
                <span className="text-lg font-mono font-bold text-white tabular-nums">
                  {result.requiredRefrigerationBtuH.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] font-mono text-slate-500">BTU / Jam</span>
              </div>
            </div>

            {/* Daily Heat Load Total */}
            <div className="flex justify-between items-center text-xs font-mono p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">Total Beban Kalor Harian:</span>
              <div className="text-right">
                <strong className="text-cyan-400 text-sm">
                  {result.totalHeatLoadKwhDay.toLocaleString('id-ID')} kWh/hari
                </strong>
                <span className="block text-[10px] text-slate-500">
                  ({result.totalHeatLoadKjDay.toLocaleString('id-ID')} kJ/hari)
                </span>
              </div>
            </div>

            {/* Visual Heat Load Breakdown Bar */}
            <div className="space-y-2 pb-4 border-b border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                <span>Distribusi Sumber Beban Kalor:</span>
                <span className="text-slate-500 text-[11px]">100% Total</span>
              </div>

              {/* Progress bar multi-segment */}
              <div className="h-3 w-full bg-slate-950 rounded overflow-hidden flex">
                <div
                  style={{ width: `${result.loadBreakdownPercentages.product}%` }}
                  className="bg-cyan-500 hover:opacity-90 transition-all"
                  title={`Beban Produk: ${result.loadBreakdownPercentages.product}%`}
                />
                <div
                  style={{ width: `${result.loadBreakdownPercentages.transmission}%` }}
                  className="bg-amber-500 hover:opacity-90 transition-all"
                  title={`Transmisi Dinding/Atap: ${result.loadBreakdownPercentages.transmission}%`}
                />
                <div
                  style={{ width: `${result.loadBreakdownPercentages.infiltration}%` }}
                  className="bg-emerald-500 hover:opacity-90 transition-all"
                  title={`Infiltrasi Pintu: ${result.loadBreakdownPercentages.infiltration}%`}
                />
                <div
                  style={{ width: `${result.loadBreakdownPercentages.internal}%` }}
                  className="bg-violet-500 hover:opacity-90 transition-all"
                  title={`Internal (Lampu/Kipas/Pekerja): ${result.loadBreakdownPercentages.internal}%`}
                />
                <div
                  style={{ width: `${result.loadBreakdownPercentages.defrost}%` }}
                  className="bg-rose-500 hover:opacity-90 transition-all"
                  title={`Beban Defrost: ${result.loadBreakdownPercentages.defrost}%`}
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400 font-mono pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-cyan-500 shrink-0" />
                  <span>Kalor Produk: {result.loadBreakdownPercentages.product}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-amber-500 shrink-0" />
                  <span>Transmisi Panel: {result.loadBreakdownPercentages.transmission}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-emerald-500 shrink-0" />
                  <span>Infiltrasi Buka Pintu: {result.loadBreakdownPercentages.infiltration}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-violet-500 shrink-0" />
                  <span>Internal / Kipas: {result.loadBreakdownPercentages.internal}%</span>
                </div>
              </div>
            </div>

            {/* Evaporator Unit Cooler Specs */}
            <div className="space-y-3">
              <span className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                Spesifikasi Evaporator (Unit Cooler)
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">Debit Udara Blower</span>
                  <strong className="text-white text-sm">{result.evaporatorAirflowCmh.toLocaleString('id-ID')} m³/h</strong>
                  <span className="text-[10px] text-slate-400 block">({result.evaporatorAirflowCfm.toLocaleString('id-ID')} CFM)</span>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">Jarak Sirip (Fin Spacing)</span>
                  <strong className="text-cyan-300 text-sm">{result.recommendedFinSpacingMm} mm</strong>
                  <span className="text-[10px] text-slate-400 block">Anti-blokir bunga es</span>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">Sistem Defrost</span>
                  <strong className="text-emerald-400">{result.defrostType}</strong>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">Refrigerant Terpilih</span>
                  <strong className="text-amber-400 text-sm">{result.refrigerantAnalysis.refrigerantId}</strong>
                  <span className="text-[10px] text-slate-400 block">{result.refrigerantAnalysis.formula}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Refrigerant Circuit Engineering Specs */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block">
                  Parameter Sirkuit Freon &amp; Tekanan Kerja
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {result.refrigerantAnalysis.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewSection('both');
                    window.scrollTo({ top: 320, behavior: 'smooth' });
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 transition-colors"
                >
                  📐 Lihat di P&amp;ID
                </button>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    result.refrigerantAnalysis.compressionRatioStatus === 'Optimal'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : result.refrigerantAnalysis.compressionRatioStatus === 'Moderat'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  Rasio: {result.refrigerantAnalysis.compressionRatioStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {/* Suction Pressure */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Tekanan Hisap (Suction Pe)</span>
                <strong className="text-cyan-400 text-sm">
                  {result.refrigerantAnalysis.suctionPressureBarGauge} bar-g
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  {result.refrigerantAnalysis.suctionPressurePsig} psig (Te: {result.refrigerantAnalysis.evaporatingTempC}°C)
                </span>
              </div>

              {/* Discharge Pressure */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Tekanan Buang (Discharge Pc)</span>
                <strong className="text-amber-400 text-sm">
                  {result.refrigerantAnalysis.dischargePressureBarGauge} bar-g
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  {result.refrigerantAnalysis.dischargePressurePsig} psig (Tc: {result.refrigerantAnalysis.condensingTempC}°C)
                </span>
              </div>

              {/* Compression Ratio */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Rasio Kompresi (Pc / Pe)</span>
                <strong className="text-white text-sm">
                  {result.refrigerantAnalysis.compressionRatio} : 1
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  {result.refrigerantAnalysis.compressionRatio < 8 ? 'Single stage aman' : 'Disarankan economizer'}
                </span>
              </div>

              {/* Mass Flow Rate */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Laju Aliran Freon (ṁ)</span>
                <strong className="text-white text-sm">
                  {result.refrigerantAnalysis.massFlowRateKgH} kg/jam
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  ({result.refrigerantAnalysis.massFlowRateKgMin} kg/menit)
                </span>
              </div>

              {/* Pipe sizes */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Pipa Cair (Liquid Line OD)</span>
                <strong className="text-emerald-400 text-xs sm:text-sm">
                  {result.refrigerantAnalysis.recommendedLiquidLineInch}
                </strong>
                <span className="text-[10px] text-slate-500 block">Ke expansion valve</span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Pipa Hisap (Suction Line OD)</span>
                <strong className="text-cyan-300 text-xs sm:text-sm">
                  {result.refrigerantAnalysis.recommendedSuctionLineInch}
                </strong>
                <span className="text-[10px] text-slate-500 block">Isolasi Armaflex wajib</span>
              </div>

              {/* Freon Charge */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Estimasi Muatan Freon</span>
                <strong className="text-amber-300 text-sm">
                  ±{result.refrigerantAnalysis.estimatedChargeKg} kg
                </strong>
                <span className="text-[10px] text-slate-500 block">Total sistem + receiver</span>
              </div>

              {/* Lubricant Oil */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Pelumas Kompresor</span>
                <strong className="text-purple-300 text-[11px] block leading-tight">
                  {result.refrigerantAnalysis.recommendedOilType}
                </strong>
              </div>
            </div>
          </div>

          {/* Practical Engineering Guidance Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 text-xs text-slate-300 space-y-3">
            <h3 className="font-semibold text-white tracking-wide text-xs uppercase font-mono text-cyan-400">
              Tips Pemasangan &amp; Perawatan Cold Storage
            </h3>
            <ul className="space-y-2 text-slate-300 leading-relaxed list-disc list-inside">
              <li>
                <strong className="text-white">Pemasangan Pressure Relief Valve (PRV):</strong> Pada freezer di bawah -10°C, wajib pasang katup pelepas tekanan pada dinding agar pintu tidak tersedot vakum atau panel terdorong rusak saat blower menyala setelah defrost.
              </li>
              <li>
                <strong className="text-white">Heater Pintu &amp; Pipa Drain:</strong> Karet kusen pintu freezer dan pipa pembuangan air kondensasi wajib dipasangi kabel pemanas (*drain line heater*) agar es tidak membeku dan menyumbat saluran.
              </li>
              <li>
                <strong className="text-white">Sirkulasi Udara:</strong> Jangan menumpuk barang menempel langsung ke dinding panel atau lantai (beri jarak pallet minimal 10 cm dari dinding dan 50 cm di bawah evaporator) agar aliran angin dingin merata.
              </li>
            </ul>
          </div>
        </div>
      </div>
      )}

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        reportTitle={`Rancangan Cold Room - ${product.name}`}
        messageText={waReportMessage}
      />
    </div>
  );
};
