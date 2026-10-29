import React, { useState, useMemo } from 'react';
import {
  CoolingLoadResult,
  InsulationQuality,
  RoomType,
  SunExposure,
  UnitSystem,
  WindowType,
} from '../types/hvac';
import { ROOM_PRESETS } from '../utils/hvacCalculations';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { buildWhatsAppReportMessage } from '../utils/whatsappShare';

interface CoolingLoadCalculatorProps {
  unitSystem: UnitSystem;
  length: number;
  width: number;
  height: number;
  onChangeDimension: (field: 'length' | 'width' | 'height', val: number) => void;
  roomType: RoomType;
  onChangeRoomType: (val: RoomType) => void;
  sunExposure: SunExposure;
  onChangeSunExposure: (val: SunExposure) => void;
  occupants: number;
  onChangeOccupants: (val: number) => void;
  equipmentWattage: number;
  onChangeEquipmentWattage: (val: number) => void;
  windowType: WindowType;
  onChangeWindowType: (val: WindowType) => void;
  insulationQuality: InsulationQuality;
  onChangeInsulation: (val: InsulationQuality) => void;
  hoursPerDay: number;
  onChangeHoursPerDay: (val: number) => void;
  kwhTariffIDR: number;
  onChangeTariff: (val: number) => void;
  result: CoolingLoadResult;
  onApplyPreset: (presetId: string) => void;
}

export const CoolingLoadCalculator: React.FC<CoolingLoadCalculatorProps> = ({
  unitSystem,
  length,
  width,
  height,
  onChangeDimension,
  roomType,
  onChangeRoomType,
  sunExposure,
  onChangeSunExposure,
  occupants,
  onChangeOccupants,
  equipmentWattage,
  onChangeEquipmentWattage,
  windowType,
  onChangeWindowType,
  insulationQuality,
  onChangeInsulation,
  hoursPerDay,
  onChangeHoursPerDay,
  kwhTariffIDR,
  onChangeTariff,
  result,
  onApplyPreset,
}) => {
  const lengthUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const areaUnit = unitSystem === 'metric' ? 'm²' : 'sq ft';
  const volumeUnit = unitSystem === 'metric' ? 'm³' : 'cu ft';

  // Format currency
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  // Percentage breakdown calculation for visual bar
  const totalRaw =
    result.baseAreaBTU +
    result.sunBTU +
    result.occupantBTU +
    result.equipmentBTU +
    result.windowBTU;

  const basePercent = Math.round((result.baseAreaBTU / Math.max(1, totalRaw)) * 100);
  const sunPercent = Math.round((result.sunBTU / Math.max(1, totalRaw)) * 100);
  const occupantPercent = Math.round((result.occupantBTU / Math.max(1, totalRaw)) * 100);
  const equipPercent = Math.round((result.equipmentBTU / Math.max(1, totalRaw)) * 100);
  const windowPercent = Math.max(
    0,
    100 - (basePercent + sunPercent + occupantPercent + equipPercent)
  );

  const waReportMessage = useMemo(() => {
    return buildWhatsAppReportMessage({
      reportTitle: `ESTIMASI BEBAN PENDINGIN (COOLING LOAD) & REKOMENDASI KAPASITAS AC`,
      reportMeta: {
        productName: `Kalkulasi Beban Pendingin Ruangan (${length}x${width}x${height} ${lengthUnit})`,
        modelUnit: `Tipe Ruangan: ${roomType}`,
        projectName: 'Analisis Cooling Load & Sizing Unit AC',
        reportDate: new Date().toISOString().split('T')[0],
      },
      summarySections: [
        {
          title: 'Spesifikasi Dimensi & Karakteristik Ruangan',
          items: [
            { label: 'Dimensi (P x L x T)', value: `${length} x ${width} x ${height} ${lengthUnit}` },
            { label: 'Luas Lantai', value: `${result.floorArea} ${areaUnit}` },
            { label: 'Volume Udara', value: `${result.volume} ${volumeUnit}` },
            { label: 'Tipe Ruangan', value: roomType },
            { label: 'Jumlah Penghuni', value: `${occupants} orang` },
            { label: 'Daya Beban Alat Listrik', value: `${equipmentWattage} Watt` },
            { label: 'Paparan Sinar Matahari', value: sunExposure },
          ],
        },
        {
          title: 'Rekomendasi Kapasitas AC & Sizing',
          items: [
            { label: 'Rekomendasi Kapasitas PK', value: result.pkRecommendation.labelPK },
            { label: 'Total Beban Panas', value: `${result.totalBTU.toLocaleString('id-ID')} BTU/h` },
            { label: 'Ekuivalen Tonase (TR)', value: `${result.tonnageTR} TR` },
            { label: 'Daya Thermal Pendinginan', value: `${result.kilowatt} kW` },
            { label: 'Rekomendasi Tipe Sistem', value: result.pkRecommendation.systemType },
            { label: 'Estimasi Listrik Non-Inverter', value: `~${result.estPowerWatts.standard} W (${formatIDR(result.estMonthlyCostIDR.standard)}/bln)` },
            { label: 'Estimasi Listrik Inverter', value: `~${result.estPowerWatts.inverter} W (${formatIDR(result.estMonthlyCostIDR.inverter)}/bln)` },
          ],
        },
      ],
      footerNote: 'Dihitung berdasarkan panduan standar ASHRAE & SNI Pengkondisian Udara.',
    });
  }, [length, width, height, lengthUnit, areaUnit, volumeUnit, roomType, occupants, equipmentWattage, sunExposure, result, kwhTariffIDR, hoursPerDay]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Presets */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Preset Cepat Karakteristik Ruangan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pilih tipe tipikal untuk mengisi parameter dimensi dan beban secara otomatis:
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ROOM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onApplyPreset(preset.id)}
                className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors whitespace-nowrap"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Dimensi Ruangan */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                01. Dimensi Fisik Ruangan
              </span>
              <div className="text-xs font-mono text-slate-400">
                Luas: <span className="text-slate-100 font-semibold">{result.floorArea} {areaUnit}</span> · Vol:{' '}
                <span className="text-slate-100 font-semibold">{result.volume} {volumeUnit}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Panjang */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <label htmlFor="dim-length">Panjang ({lengthUnit})</label>
                  <span className="font-mono text-cyan-400">{length}</span>
                </div>
                <input
                  id="dim-length"
                  type="number"
                  step="0.5"
                  min="1"
                  max="50"
                  value={length}
                  onChange={(e) => onChangeDimension('length', parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-sm font-mono text-white outline-none"
                />
              </div>

              {/* Lebar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <label htmlFor="dim-width">Lebar ({lengthUnit})</label>
                  <span className="font-mono text-cyan-400">{width}</span>
                </div>
                <input
                  id="dim-width"
                  type="number"
                  step="0.5"
                  min="1"
                  max="50"
                  value={width}
                  onChange={(e) => onChangeDimension('width', parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-sm font-mono text-white outline-none"
                />
              </div>

              {/* Tinggi Plafon */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <label htmlFor="dim-height">Tinggi Plafon ({lengthUnit})</label>
                  <span className="font-mono text-cyan-400">{height}</span>
                </div>
                <input
                  id="dim-height"
                  type="number"
                  step="0.1"
                  min="2"
                  max="10"
                  value={height}
                  onChange={(e) => onChangeDimension('height', parseFloat(e.target.value) || 2)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-sm font-mono text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fungsi & Lingkungan Ruangan */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                02. Karakteristik & Paparan Panas Eksternal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipe Ruangan */}
              <div className="space-y-1.5">
                <label htmlFor="room-type" className="text-xs font-medium text-slate-300">
                  Fungsi & Beban Aktivitas
                </label>
                <select
                  id="room-type"
                  value={roomType}
                  onChange={(e) => onChangeRoomType(e.target.value as RoomType)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-xs font-medium text-white outline-none"
                >
                  <option value="bedroom">Kamar Tidur (Aktivitas Istirahat ~550 BTU/m²)</option>
                  <option value="living_room">Ruang Keluarga / Tamu (~650 BTU/m²)</option>
                  <option value="office">Ruang Kerja / Kantor (~750 BTU/m²)</option>
                  <option value="classroom">Ruang Kelas / Seminar (~700 BTU/m²)</option>
                  <option value="restaurant">Restoran / Kafe / Dapur Bersih (~950 BTU/m²)</option>
                  <option value="server_room">Server Room / Data Center (~1.300 BTU/m²)</option>
                  <option value="gym">Gym / Pusat Kebugaran (~850 BTU/m²)</option>
                  <option value="retail">Toko Ritel / Showroom (~800 BTU/m²)</option>
                </select>
              </div>

              {/* Paparan Matahari */}
              <div className="space-y-1.5">
                <label htmlFor="sun-exposure" className="text-xs font-medium text-slate-300">
                  Orientasi Sinar Matahari Dinding
                </label>
                <select
                  id="sun-exposure"
                  value={sunExposure}
                  onChange={(e) => onChangeSunExposure(e.target.value as SunExposure)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-xs font-medium text-white outline-none"
                >
                  <option value="sheltered">Teduh / Diapit Ruangan Lain (Standar x1.0)</option>
                  <option value="morning_east">Menghadap Timur (Kena Matahari Pagi +8%)</option>
                  <option value="afternoon_west">Menghadap Barat (Matahari Terik Sore +22%)</option>
                  <option value="top_floor_roof">Lantai Teratas / Langsung Dak Beton (+18%)</option>
                </select>
              </div>

              {/* Bukaan Jendela / Kaca */}
              <div className="space-y-1.5">
                <label htmlFor="window-type" className="text-xs font-medium text-slate-300">
                  Bukaan Jendela & Dinding Kaca
                </label>
                <select
                  id="window-type"
                  value={windowType}
                  onChange={(e) => onChangeWindowType(e.target.value as WindowType)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-xs font-medium text-white outline-none"
                >
                  <option value="minimal">Sedikit / Tanpa Jendela Kaca Langsung</option>
                  <option value="standard">Jendela Standar dengan Gorden/Tirai (+800 BTU)</option>
                  <option value="large_glass">Banyak Kaca / Jendela Lebar (+2.200 BTU)</option>
                  <option value="full_curtain_wall">Dinding Kaca Penuh / Facade Curtain Wall (+4.500 BTU)</option>
                </select>
              </div>

              {/* Kerapatan Insulasi */}
              <div className="space-y-1.5">
                <label htmlFor="insulation-quality" className="text-xs font-medium text-slate-300">
                  Kualitas Insulasi & Kerapatan Pintu
                </label>
                <select
                  id="insulation-quality"
                  value={insulationQuality}
                  onChange={(e) => onChangeInsulation(e.target.value as InsulationQuality)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-2 text-xs font-medium text-white outline-none"
                >
                  <option value="excellent">Bagus Sekali (Tertutup Rapat, Plafon Berinsulasi)</option>
                  <option value="standard">Standar (Pintu tertutup reguler)</option>
                  <option value="poor">Kurang Rapat (Pintu sering keluar-masuk/celah angin)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Beban Internal (Manusia & Elektronik) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                03. Beban Termal Internal (Orang & Peralatan)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Jumlah Orang */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <label htmlFor="occupants-input">Jumlah Orang di Ruangan</label>
                  <span className="font-mono text-cyan-400">{occupants} Orang</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={occupants}
                    onChange={(e) => onChangeOccupants(parseInt(e.target.value, 10))}
                    className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <input
                    id="occupants-input"
                    type="number"
                    min="1"
                    max="200"
                    value={occupants}
                    onChange={(e) => onChangeOccupants(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs text-white outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Est. kalor tubuh manusia: ~550 BTU/jam per orang
                </p>
              </div>

              {/* Peralatan Listrik */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <label htmlFor="wattage-input">Total Daya Elektronik (Watt)</label>
                  <span className="font-mono text-cyan-400">{equipmentWattage} W</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={equipmentWattage}
                    onChange={(e) => onChangeEquipmentWattage(parseInt(e.target.value, 10))}
                    className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <input
                    id="wattage-input"
                    type="number"
                    min="0"
                    max="50000"
                    step="50"
                    value={equipmentWattage}
                    onChange={(e) => onChangeEquipmentWattage(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs text-white outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  TV, PC, lampu, kulkas (1 Watt panas ≈ 3.412 BTU/jam)
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Jam Operasional & Biaya Listrik */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                04. Estimasi Biaya Listrik Operasional
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <label htmlFor="hours-input">Durasi Pemakaian per Hari</label>
                  <span className="font-mono text-cyan-400">{hoursPerDay} Jam/Hari</span>
                </div>
                <input
                  id="hours-input"
                  type="range"
                  min="1"
                  max="24"
                  value={hoursPerDay}
                  onChange={(e) => onChangeHoursPerDay(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <label htmlFor="tariff-input">Tarif Listrik PLN (Rp / kWh)</label>
                  <span className="font-mono text-cyan-400">{kwhTariffIDR}</span>
                </div>
                <input
                  id="tariff-input"
                  type="number"
                  step="50"
                  min="500"
                  max="3000"
                  value={kwhTariffIDR}
                  onChange={(e) => onChangeTariff(parseInt(e.target.value, 10) || 1500)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Engineering Result Console (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Sizing Metric Box */}
          <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-6 relative overflow-hidden shadow-lg shadow-cyan-950/40">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center justify-between flex-wrap gap-2">
              <span>Hasil Kapasitas AC yang Direkomendasikan</span>
              <button
                onClick={() => setIsWaModalOpen(true)}
                className="px-2.5 py-1 text-[11px] font-mono font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow cursor-pointer transition-all uppercase"
                title="Bagikan Ringkasan Sizing AC ke WhatsApp"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                Share WA
              </button>
            </div>

            {/* Primary Capacity PK */}
            <div className="mt-4 pb-4 border-b border-slate-800">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                  {result.pkRecommendation.labelPK}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {result.pkRecommendation.description}
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>Tipe Sistem:</span>
                <span className="text-cyan-300 font-medium">{result.pkRecommendation.systemType}</span>
              </div>
            </div>

            {/* Total Thermal Load In BTU/hr & Technical Equivalents */}
            <div className="grid grid-cols-3 gap-3 py-4 border-b border-slate-800 text-center">
              <div>
                <span className="block text-[11px] font-mono text-slate-400 uppercase">Total Beban</span>
                <span className="text-lg font-mono font-bold text-cyan-400 tabular-nums">
                  {result.totalBTU.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] font-mono text-slate-500">BTU / Jam</span>
              </div>
              <div>
                <span className="block text-[11px] font-mono text-slate-400 uppercase">Tonase Pendingin</span>
                <span className="text-lg font-mono font-bold text-white tabular-nums">
                  {result.tonnageTR}
                </span>
                <span className="block text-[10px] font-mono text-slate-500">TR (Tons)</span>
              </div>
              <div>
                <span className="block text-[11px] font-mono text-slate-400 uppercase">Daya Thermal</span>
                <span className="text-lg font-mono font-bold text-white tabular-nums">
                  {result.kilowatt}
                </span>
                <span className="block text-[10px] font-mono text-slate-500">kW</span>
              </div>
            </div>

            {/* Thermal Load Breakdown Visualizer */}
            <div className="py-4 border-b border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                <span>Proporsi Sumber Kalor Panas</span>
                <span className="text-slate-500 text-[11px]">100% Total</span>
              </div>

              {/* Progress bar multi-color */}
              <div className="h-3 w-full bg-slate-950 rounded overflow-hidden flex">
                <div
                  style={{ width: `${basePercent}%` }}
                  className="bg-cyan-500 hover:opacity-90 transition-all"
                  title={`Ruangan & Dinding: ${result.baseAreaBTU} BTU (${basePercent}%)`}
                />
                <div
                  style={{ width: `${sunPercent}%` }}
                  className="bg-amber-500 hover:opacity-90 transition-all"
                  title={`Paparan Sinar Matahari: ${result.sunBTU} BTU (${sunPercent}%)`}
                />
                <div
                  style={{ width: `${occupantPercent}%` }}
                  className="bg-emerald-500 hover:opacity-90 transition-all"
                  title={`Penghuni Manusia: ${result.occupantBTU} BTU (${occupantPercent}%)`}
                />
                <div
                  style={{ width: `${equipPercent}%` }}
                  className="bg-violet-500 hover:opacity-90 transition-all"
                  title={`Peralatan Elektronik: ${result.equipmentBTU} BTU (${equipPercent}%)`}
                />
                <div
                  style={{ width: `${windowPercent}%` }}
                  className="bg-sky-400 hover:opacity-90 transition-all"
                  title={`Jendela/Kaca: ${result.windowBTU} BTU (${windowPercent}%)`}
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400 font-mono pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-cyan-500 shrink-0" />
                  <span>Dinding Ruangan: {basePercent}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-amber-500 shrink-0" />
                  <span>Matahari: {sunPercent}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-emerald-500 shrink-0" />
                  <span>Manusia: {occupantPercent}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-violet-500 shrink-0" />
                  <span>Elektronik: {equipPercent}%</span>
                </div>
              </div>
            </div>

            {/* Electricity & Efficiency Comparison */}
            <div className="pt-4 space-y-3">
              <span className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                Perbandingan Listrik: Inverter vs Standar
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Standard AC */}
                <div className="bg-slate-950/80 p-3 rounded border border-slate-800">
                  <div className="text-slate-400 font-medium">AC Non-Inverter</div>
                  <div className="text-base font-mono font-bold text-slate-200 mt-1">
                    ~{result.estPowerWatts.standard} Watt
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Biaya per bulan:
                  </div>
                  <div className="text-xs font-mono font-semibold text-amber-400 mt-0.5">
                    {formatIDR(result.estMonthlyCostIDR.standard)}
                  </div>
                </div>

                {/* Inverter AC */}
                <div className="bg-cyan-950/30 p-3 rounded border border-cyan-800/40">
                  <div className="text-cyan-400 font-medium flex items-center justify-between">
                    <span>AC Inverter</span>
                    <span className="text-[10px] text-emerald-400">Hemat ~35%</span>
                  </div>
                  <div className="text-base font-mono font-bold text-cyan-300 mt-1">
                    ~{result.estPowerWatts.inverter} Watt
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Biaya per bulan:
                  </div>
                  <div className="text-xs font-mono font-semibold text-emerald-400 mt-0.5">
                    {formatIDR(result.estMonthlyCostIDR.inverter)}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-normal">
                *Dihitung berdasarkan pemakaian {hoursPerDay} jam/hari @ Rp {kwhTariffIDR}/kWh.
                AC Inverter menghemat biaya dengan memodulasi kecepatan kompresor setelah suhu tercapai.
              </p>
            </div>
          </div>

          {/* Practical Engineering Guidance Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 text-xs text-slate-300 space-y-3">
            <h3 className="font-semibold text-white tracking-wide text-xs uppercase font-mono text-cyan-400">
              Tips Pemasangan & Pemilihan Teknisi
            </h3>
            <ul className="space-y-2 text-slate-300 leading-relaxed list-disc list-inside">
              <li>
                <strong className="text-white">Hindari Undersizing:</strong> Memilih PK yang terlalu kecil akan membuat kompresor bekerja non-stop tanpa pernah mati, boros listrik, dan ruangan tidak pernah dingin.
              </li>
              <li>
                <strong className="text-white">Hindari Oversizing Berlebih:</strong> AC yang terlalu besar mendinginkan terlalu cepat tanpa sempat mengeringkan kelembapan (ruangan dingin tapi lembap berisiko jamur).
              </li>
              <li>
                <strong className="text-white">Pipa Refrigerant:</strong> Gunakan pipa tembaga dengan ketebalan minimal 0.61 mm (standar R32/R410A) agar aman dari kebocoran freon bertekanan tinggi.
              </li>
              <li>
                <strong className="text-white">Wajib Vakum:</strong> Pastikan teknisi memvakum instalasi pipa minimal 15 menit sebelum membuka katup freon agar tidak ada uap air yang membeku di pipa kapiler.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        reportTitle="ESTIMASI BEBAN PENDINGIN & SIZING AC"
        messageText={waReportMessage}
      />
    </div>
  );
};
