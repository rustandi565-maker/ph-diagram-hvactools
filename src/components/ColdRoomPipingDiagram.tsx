import React, { useState } from 'react';
import { ColdRoomCalculationResult } from '../types/coldRoom';

interface ColdRoomPipingDiagramProps {
  result: ColdRoomCalculationResult;
  roomTempC: number;
  ambientTempC: number;
}

type ComponentId =
  | 'compressor'
  | 'oil_separator'
  | 'condenser'
  | 'receiver'
  | 'filter_drier'
  | 'sight_glass'
  | 'solenoid_valve'
  | 'txv'
  | 'evaporator'
  | 'suction_accumulator'
  | 'discharge_line'
  | 'liquid_line'
  | 'suction_line'
  | 'pressure_switch'
  | 'hp_gauge'
  | 'lp_gauge';

interface ComponentDetail {
  tag: string;
  name: string;
  category: string;
  calculatedValue: string;
  secondaryValue?: string;
  functionDesc: string;
  sizingBasis: string;
  fieldTips: string[];
}

export const ColdRoomPipingDiagram: React.FC<ColdRoomPipingDiagramProps> = ({
  result,
  roomTempC,
  ambientTempC,
}) => {
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>('txv');
  const [isAnimationActive, setIsAnimationActive] = useState(true);
  const [unitMode, setUnitMode] = useState<'metric' | 'imperial'>('metric');
  const [viewMode, setViewMode] = useState<'full_pid' | 'simple_loop'>('full_pid');

  const ref = result.refrigerantAnalysis;

  // Component Technical Details Registry
  const componentDetails: Record<ComponentId, ComponentDetail> = {
    compressor: {
      tag: 'COMP-01',
      name: 'Kompresor Pendingin (Condensing Unit)',
      category: 'Kompresi Gas Freon',
      calculatedValue: `${result.recommendedCondensingUnitHp} HP (${result.recommendedCondensingUnitHp} PK) - Daya: ~${ref.compressorWorkEstimateKw} kW`,
      secondaryValue: `Tipe: ${result.recommendedCompressorType} | Rasio Kompresi: ${ref.compressionRatio} : 1 (${ref.compressionRatioStatus})`,
      functionDesc:
        'Menghisap uap refrigerant bertekanan dan bersuhu rendah dari evaporator, lalu memampatkannya menjadi uap bertekanan dan bersuhu tinggi ke arah kondensor.',
      sizingBasis:
        'Dihitung dari beban kalor total cold room dibagi jam kerja kompresor (16-18 jam/hari) plus faktor keamanan dan efisiensi volumetrik.',
      fieldTips: [
        `Gunakan pelumas wajib: ${ref.recommendedOilType}.`,
        'Pasang crankcase heater 24 jam sebelum kompresor pertama kali distart untuk mencegah foaming oli.',
        'Wajib proteksi phase failure relay dan overload thermal trip.',
        ref.compressionRatio > 8
          ? 'Rasio kompresi tinggi: Pastikan ventilasi udara ruang mesin memadai atau gunakan kompresor dengan injeksi cairan/subcooler.'
          : 'Rasio kompresi dalam batas aman operasi single-stage.',
      ],
    },
    oil_separator: {
      tag: 'SEP-01',
      name: 'Pemisah Oli (Helical Oil Separator)',
      category: 'Proteksi Pelumasan',
      calculatedValue: ref.recommendedOilSeparator,
      secondaryValue: 'Garis Balik Oli: Pipa Kapiler 1/4" OD ke Karter Kompresor',
      functionDesc:
        'Memisahkan uap oli yang terbawa oleh gas panas buang kompresor dan mengembalikannya secara otomatis ke karter melalui mekanisme pelampung (float valve).',
      sizingBasis:
        'Dipilih berdasarkan kapasitas discharge pipa dan jenis refrigerant untuk memastikan pelumasan karter selalu terjaga.',
      fieldTips: [
        'Isi oli awal (pre-charge) ke dalam separator sebelum dioperasikan agar pelampung tidak bocor gas.',
        'Suhu tabung separator bagian bawah harus hangat/panas saat katup balik oli bekerja normal.',
        'Sangat disarankan pada instalasi pipa evaporator yang posisinya lebih tinggi dari kompresor.',
      ],
    },
    condenser: {
      tag: 'COND-01',
      name: 'Kondensor Berpendingin Udara (Air-Cooled Condenser)',
      category: 'Pelepasan Kalor Lingkungan',
      calculatedValue:
        unitMode === 'metric'
          ? `${ref.condenserHeatRejectionKw} kW Kalor Dibuang`
          : `${ref.condenserHeatRejectionBtuH.toLocaleString('id-ID')} BTU/h`,
      secondaryValue: `Suhu Kondensasi (Tc): ${ref.condensingTempC}°C | Tekanan (Pc): ${
        unitMode === 'metric' ? `${ref.dischargePressureBarGauge} bar-g` : `${ref.dischargePressurePsig} psig`
      }`,
      functionDesc:
        'Membuang seluruh kalor yang diserap di cold room ditambah kalor kerja mekanik kompresor (Qc = Qe + Wcomp) ke udara bebas di sekitar luar ruangan.',
      sizingBasis:
        'Didesain untuk iklim tropis dengan pendekatan TD 10-12 K di atas suhu sekitar (Ambient ' +
        ambientTempC +
        '°C).',
      fieldTips: [
        'Beri jarak minimal 1 meter dari dinding untuk ruang hisap kipas kondensor.',
        'Lakukan pembersihan sirip fin dari debu/kotoran minimal setiap 1-2 bulan sekali.',
        'Pastikan arah putaran kipas tidak terbalik (meniup keluar menembus kisi coil).',
      ],
    },
    receiver: {
      tag: 'REC-01',
      name: 'Tangki Penampung Cairan (Liquid Receiver)',
      category: 'Penyimpanan Refrigerant',
      calculatedValue: `Kapasitas: ${ref.recommendedReceiverVolumeLiters} Liter Vertical Vessel`,
      secondaryValue: `Menampung Muatan Freon: ±${ref.estimatedChargeKg} kg (Dilengkapi Katup Rotalock & PRV 28 bar)`,
      functionDesc:
        'Menyimpan cadangan refrigerant cair bertekanan tinggi saat beban berfluktuasi dan memfasilitasi proses penarikan freon (pumpdown) saat servis.',
      sizingBasis:
        'Volume dirancang menampung minimal 80-100% dari total freon sirkulasi sistem cold room.',
      fieldTips: [
        'Wajib dilengkapi safety relief valve (PRV) sesuai standar keselamatan ASME/ASHRAE.',
        'Gunakan katup Rotalock ganda untuk kemudahan isolasi saat penggantian komponen filter.',
      ],
    },
    filter_drier: {
      tag: 'FLT-01',
      name: 'Filter Drier (Saringan Pengering Freon)',
      category: 'Pemurnian Freon',
      calculatedValue: ref.recommendedFilterDrier,
      secondaryValue: 'Komposisi: 100% Molecular Sieve Padat (Menyerap Air & Asam)',
      functionDesc:
        'Menyaring kotoran mekanis gram pipa tembaga dan menyerap molekul uap air serta keasaman agar tidak menyumbat lubang orifice katup ekspansi.',
      sizingBasis:
        'Kapasitas adsorpsi kelembaban disesuaikan dengan tipe freon HFC/HC/Natural dan ukuran pipa cair.',
      fieldTips: [
        'Pasang searah panah aliran fluida menuju katup ekspansi.',
        'Ganti filter baru setiap kali sistem mengalami pembongkaran pipa atau kebocoran freon.',
        'Raba perbedaan suhu sebelum dan sesudah filter; jika terasa dingin/berembun, filter tersumbat!',
      ],
    },
    sight_glass: {
      tag: 'SG-01',
      name: 'Kaca Pengintai Cairan (Sight Glass & Moisture Indicator)',
      category: 'Monitoring Aliran',
      calculatedValue: ref.recommendedSightGlass,
      secondaryValue: 'Warna Indikator: Hijau = Kering (Aman) | Kuning = Lembab (Basah)',
      functionDesc:
        'Memantau kondisi fasa fluida apakah sudah cair penuh (tanpa gelembung/bubble) serta mendeteksi kadar uap air dalam sirkuit secara visual.',
      sizingBasis:
        'Ukuran lubang disesuaikan dengan pipa cair utama untuk menghindari rugi tekanan berlebih.',
      fieldTips: [
        'Gelembung terus menerus saat kompresor stabil menandakan freon kurang atau filter drier buntu.',
        'Jika indikator berubah warna menjadi kuning, segera ganti filter drier dan lakukan pembersihan.',
      ],
    },
    solenoid_valve: {
      tag: 'SOL-01',
      name: 'Katup Solenoid Cair (Pumpdown Solenoid Valve)',
      category: 'Kontrol Otomasi Pumpdown',
      calculatedValue: ref.recommendedSolenoidValve,
      secondaryValue: 'Tipe: NC (Normally Closed) dengan Kumparan 220V AC',
      functionDesc:
        'Memutus aliran cairan freon seketika saat termostat suhu ruangan tercapai, sehingga kompresor dapat memompa seluruh freon masuk ke receiver (pumpdown cycle).',
      sizingBasis:
        'Kapasitas Kv/Cv disesuaikan dengan debit massa refrigerant agar drop tekanan < 0.15 bar.',
      fieldTips: [
        'Dihubungkan seri dengan kontak output thermostat digital cold room.',
        'Pastikan posisi pemasangan horizontal dengan kumparan solenoid menghadap ke atas.',
      ],
    },
    txv: {
      tag: 'TXV-01',
      name: 'Katup Ekspansi Termostatik (TXV / EEV)',
      category: 'Pelepasan Tekanan & Metering',
      calculatedValue: ref.recommendedExpansionValve,
      secondaryValue: `Penurunan Tekanan: ${
        unitMode === 'metric'
          ? `${ref.dischargePressureBarGauge} bar-g ➜ ${ref.suctionPressureBarGauge} bar-g`
          : `${ref.dischargePressurePsig} psig ➜ ${ref.suctionPressurePsig} psig`
      }`,
      functionDesc:
        'Menurunkan tekanan cairan freon secara drastis hingga mendidih dingin dan mengatur debit aliran refrigerant masuk evaporator sesuai superheat hisap.',
      sizingBasis:
        'Dipilih berdasarkan tonase pendinginan (' +
        result.requiredRefrigerationTr +
        ' TR), tekanan inlet/outlet, dan refrigerant ' +
        ref.name +
        '.',
      fieldTips: [
        'Bulb termostatik wajib diklem kuat pada pipa hisap horisontal arah jam 1-2 atau 4-5 (jangan di bagian bawah penampung oli).',
        'Bungkus bulb dengan insulasi isolator tebal agar tidak terpengaruh suhu udara ruangan.',
        'Pipa equalizing eksternal 1/4" wajib dipasang downstream setelah bulb pada evaporator berdistributor.',
      ],
    },
    evaporator: {
      tag: 'EVAP-01',
      name: 'Evaporator (Unit Cooler Blower Cold Room)',
      category: 'Penyerapan Kalor Ruangan',
      calculatedValue:
        unitMode === 'metric'
          ? `${result.requiredRefrigerationKw} kW (${result.requiredRefrigerationTr} TR)`
          : `${result.requiredRefrigerationBtuH.toLocaleString('id-ID')} BTU/h`,
      secondaryValue: `Suhu Evaporasi (Te): ${ref.evaporatingTempC}°C | Tekanan (Pe): ${
        unitMode === 'metric' ? `${ref.suctionPressureBarGauge} bar-g` : `${ref.suctionPressurePsig} psig`
      }`,
      functionDesc:
        'Menyerap kalor dari udara cold room dan barang produk simpanan, menguapkan cairan refrigerant menjadi uap gas dingin.',
      sizingBasis:
        'Dihitung dari beban kalor total cold room dengan debit udara ' +
        result.evaporatorAirflowCmh.toLocaleString('id-ID') +
        ' m³/h dan jarak sirip fin ' +
        result.recommendedFinSpacingMm +
        ' mm.',
      fieldTips: [
        `Sistem defrost: ${result.defrostType}.`,
        `Jarak sirip fin ${result.recommendedFinSpacingMm} mm efektif mencegah penyumbatan bunga es pada suhu ${roomTempC}°C.`,
        'Pipa pembuangan air drain wajib diberi kemiringan minimal 2% dan dilengkapi heater kabel drain pada freezer.',
      ],
    },
    suction_accumulator: {
      tag: 'ACC-01',
      name: 'Akumulator Hisap (Suction Accumulator)',
      category: 'Proteksi Kompresor Anti-Liquid Hammer',
      calculatedValue: ref.recommendedSuctionAccumulator,
      secondaryValue: 'Desain: Tabung Vertikal dengan Internal U-Tube & Oil Orifice Metering',
      functionDesc:
        'Menampung tetesan cairan refrigerant liar yang belum sempat menguap di evaporator agar tidak masuk dan merusak klep kompresor (mencegah liquid slugging).',
      sizingBasis:
        'Volume penampung dirancang minimal 30-50% dari total muatan freon sistem (' +
        ref.estimatedChargeKg +
        ' kg).',
      fieldTips: [
        'Wajib dipasang sedekat mungkin dengan kompresor pada suction line.',
        'Lubang kecil (oil bleed hole) di dasar U-tube harus bersih agar oli pelumas tetap bisa kembali ke kompresor.',
      ],
    },
    discharge_line: {
      tag: 'PIPE-DIS',
      name: 'Pipa Gas Panas Buang (Discharge Line)',
      category: 'Pemipaan Gas Tekanan Tinggi',
      calculatedValue: `Diameter Pipa: ${ref.recommendedDischargeLineInch}`,
      secondaryValue: `Suhu Gas: ~${ref.dischargeTempEstimateC}°C | Tekanan: ${
        unitMode === 'metric' ? `${ref.dischargePressureBarGauge} bar-g` : `${ref.dischargePressurePsig} psig`
      }`,
      functionDesc:
        'Mengalirkan gas superheat panas bertekanan tinggi dari kompresor melewati oil separator menuju ke kondensor luar.',
      sizingBasis:
        'Kecepatan gas dirancang antara 10 - 18 m/s untuk memastikan partikel oli ikut terdorong.',
      fieldTips: [
        'Pasang vibration absorber (anakonda getaran) sedekat mungkin dengan kompresor.',
        'Beri kemiringan pipa 0.5% ke arah aliran kondensor untuk memperlancar sirkulasi oli.',
      ],
    },
    liquid_line: {
      tag: 'PIPE-LIQ',
      name: 'Pipa Cairan Freon (Liquid Line)',
      category: 'Pemipaan Cairan Tekanan Tinggi',
      calculatedValue: `Diameter Pipa: ${ref.recommendedLiquidLineInch}`,
      secondaryValue: `Debit Aliran Massa (ṁ): ${ref.massFlowRateKgH} kg/jam (${ref.massFlowRateKgMin} kg/menit)`,
      functionDesc:
        'Mengalirkan refrigerant fasa cair bertekanan tinggi dari tangki receiver melewati filter & solenoid valve menuju ke katup ekspansi.',
      sizingBasis:
        'Kecepatan aliran cairan dirancang 0.8 - 1.5 m/s untuk mencegah timbulnya flash gas dan water hammer.',
      fieldTips: [
        'Jaga subcooling minimal 3-5 K agar tidak terjadi penguapan dini sebelum katup ekspansi.',
        'Bila pipa melewati area yang terpapar sinar matahari langsung, wajib dibungkus isolasi.',
      ],
    },
    suction_line: {
      tag: 'PIPE-SUC',
      name: 'Pipa Gas Hisap Dingin (Suction Line)',
      category: 'Pemipaan Gas Tekanan Rendah',
      calculatedValue: `Diameter Pipa: ${ref.recommendedSuctionLineInch}`,
      secondaryValue: `Tekanan: ${
        unitMode === 'metric' ? `${ref.suctionPressureBarGauge} bar-g` : `${ref.suctionPressurePsig} psig`
      } | Isolasi: Armaflex Nitrile Rubber 25-32 mm`,
      functionDesc:
        'Mengalirkan kembali uap freon superheated bersuhu dingin dari evaporator menuju akumulator dan kompresor.',
      sizingBasis:
        'Kecepatan gas dirancang 4 - 8 m/s pada pipa horizontal dan 8 - 12 m/s pada pipa riser vertikal untuk pengembalian oli.',
      fieldTips: [
        'Wajib dipasang perangkap oli (oil trap / U-trap) setiap ketinggian riser vertikal 3 - 4 meter.',
        'Wajib dilapisi isolasi Armaflex tertutup rapat untuk mencegah kondensasi keringat dan penyerapan kalor liar.',
      ],
    },
    pressure_switch: {
      tag: 'DPS-01',
      name: 'Dual Pressure Switch (HPS / LPS Control)',
      category: 'Kontrol Keselamatan & Operasional',
      calculatedValue: `HP Cut-Out: ~${Math.round(ref.dischargePressureBarGauge * 1.25)} bar-g | LP Cut-Out: ~${Math.max(
        0.2,
        Math.round((ref.suctionPressureBarGauge - 0.7) * 10) / 10
      )} bar-g`,
      secondaryValue: 'Fungsi: Mematikan kompresor saat tekanan abnormal & kontrol siklus pumpdown',
      functionDesc:
        'Pengaman otomatis yang mematikan arus kompresor jika tekanan discharge melompat terlalu tinggi atau tekanan hisap anjlok terlalu rendah (kebocoran/buntu).',
      sizingBasis:
        'Setting disesuaikan dengan batas kerja kompresor dan tekanan saturasi refrigerant ' +
        ref.name +
        '.',
      fieldTips: [
        'LPS disetel cut-in di atas tekanan evaporasi saat standby agar kompresor start otomatis setelah defrost.',
        'HPS wajib bertipe manual reset untuk keselamatan teknisi.',
      ],
    },
    hp_gauge: {
      tag: 'PI-HP',
      name: 'Manometer Tekanan Tinggi (High Pressure Gauge)',
      category: 'Instrumentasi Ukur',
      calculatedValue:
        unitMode === 'metric'
          ? `${ref.dischargePressureBarGauge} bar-g (${ref.condensingTempC}°C Saturated)`
          : `${ref.dischargePressurePsig} psig`,
      secondaryValue: `Skala Tekanan Discharge Refrigerant ${ref.name}`,
      functionDesc:
        'Mengukur tekanan kondensasi aktual gas panas buang kompresor untuk memantau performa kondensor dan beban pendinginan.',
      sizingBasis: 'Rentang manometer: 0 - 35 bar-g (0 - 500 psig) glycerin-filled.',
      fieldTips: [
        'Gunakan pressure gauge berisi cairan glycerin peredam getaran kompresor.',
        'Jika tekanan terbaca melonjak tinggi, periksa kebersihan kondensor atau kipas mati.',
      ],
    },
    lp_gauge: {
      tag: 'PI-LP',
      name: 'Manometer Tekanan Rendah (Low Pressure Gauge)',
      category: 'Instrumentasi Ukur',
      calculatedValue:
        unitMode === 'metric'
          ? `${ref.suctionPressureBarGauge} bar-g (${ref.evaporatingTempC}°C Saturated)`
          : `${ref.suctionPressurePsig} psig`,
      secondaryValue: `Skala Tekanan Suction Evaporasi Refrigerant ${ref.name}`,
      functionDesc:
        'Mengukur tekanan evaporasi uap hisap dingin untuk memantau kondisi pembekuan evaporator dan kecukupan pengisian freon.',
      sizingBasis: 'Rentang manometer: -1 s/d 10 bar-g (-30 inHg s/d 150 psig).',
      fieldTips: [
        'Cocokkan pembacaan tekanan dengan tabel saturasi refrigeran untuk mengukur superheat.',
        'Tekanan hisap yang terlalu rendah menandakan freon bocor, filter tersumbat, atau sirip fin evaporator tertutup es tebal.',
      ],
    },
  };

  const activeDetail = selectedComponent ? componentDetails[selectedComponent] : null;

  return (
    <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4 sm:p-6 shadow-xl shadow-cyan-950/20 space-y-5">
      {/* Top Banner / Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wide text-white">
              Diagram Pemipaan Sistem Refrigerasi Cold Room (P&amp;ID)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Skematik pemipaan refrigerasi dengan ukuran pipa tembaga, tekanan kerja, &amp; spesifikasi komponen aktual
          </p>
        </div>

        {/* Action / View Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Unit Toggle */}
          <div className="bg-slate-950 p-1 rounded border border-slate-800 flex items-center">
            <button
              type="button"
              onClick={() => setUnitMode('metric')}
              className={`px-2.5 py-1 rounded transition-colors ${
                unitMode === 'metric'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Metrik (bar, °C, kW)
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('imperial')}
              className={`px-2.5 py-1 rounded transition-colors ${
                unitMode === 'imperial'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Imperial (psig, °F, BTU)
            </button>
          </div>

          {/* Animation Toggle */}
          <button
            type="button"
            onClick={() => setIsAnimationActive(!isAnimationActive)}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
              isAnimationActive
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAnimationActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            {isAnimationActive ? 'Aliran Freon Aktif' : 'Aliran Statis'}
          </button>

          {/* Mode Toggle */}
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'full_pid' | 'simple_loop')}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 outline-none"
          >
            <option value="full_pid">P&amp;ID Lengkap (Aksesori + Katup + Proteksi)</option>
            <option value="simple_loop">Siklus Pokok 4-Komponen Utama</option>
          </select>
        </div>
      </div>

      {/* Quick Summary Parameter Header Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono">
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Refrigerant Terpilih</span>
          <strong className="text-amber-400 text-sm block truncate">{ref.name}</strong>
          <span className="text-[10px] text-slate-400">ASHRAE {ref.safetyClass}</span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Suhu Ruang / Evaporasi</span>
          <strong className="text-cyan-300 text-sm block">
            {roomTempC}°C / {ref.evaporatingTempC}°C
          </strong>
          <span className="text-[10px] text-slate-400">
            Pe: {unitMode === 'metric' ? `${ref.suctionPressureBarGauge} bar` : `${ref.suctionPressurePsig} psig`}
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Kondensasi (Tc)</span>
          <strong className="text-rose-400 text-sm block">{ref.condensingTempC}°C</strong>
          <span className="text-[10px] text-slate-400">
            Pc: {unitMode === 'metric' ? `${ref.dischargePressureBarGauge} bar` : `${ref.dischargePressurePsig} psig`}
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Kapasitas Evaporator (Qe)</span>
          <strong className="text-white text-sm block">
            {unitMode === 'metric' ? `${result.requiredRefrigerationKw} kW` : `${result.requiredRefrigerationBtuH} BTU/h`}
          </strong>
          <span className="text-[10px] text-slate-400">({result.requiredRefrigerationTr} TR)</span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Condensing Unit (HP)</span>
          <strong className="text-cyan-400 text-sm block">{result.recommendedCondensingUnitHp} HP</strong>
          <span className="text-[10px] text-slate-400">~{ref.compressorWorkEstimateKw} kW Motor</span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Laju Alir Massa Freon</span>
          <strong className="text-emerald-400 text-sm block">{ref.massFlowRateKgH} kg/jam</strong>
          <span className="text-[10px] text-slate-400">Muatan: ±{ref.estimatedChargeKg} kg</span>
        </div>
      </div>

      {/* SVG Canvas Schematic Diagram */}
      <div className="relative w-full overflow-x-auto bg-slate-950 rounded-xl border border-slate-800 p-2 sm:p-4 select-none">
        <style>
          {`
            @keyframes flowAnim {
              from { stroke-dashoffset: 40; }
              to { stroke-dashoffset: 0; }
            }
            .pipe-flow-active {
              animation: flowAnim 1.2s linear infinite;
            }
          `}
        </style>

        <svg
          viewBox="0 0 1080 720"
          className="w-full min-w-[940px] h-auto font-sans text-xs"
        >
          <defs>
            {/* Arrow markers for piping */}
            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#ef4444" />
            </marker>
            <marker
              id="arrow-gold"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f59e0b" />
            </marker>
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#06b6d4" />
            </marker>
            <marker
              id="arrow-blue"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
            </marker>

            {/* Linear gradients */}
            <linearGradient id="cduGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="coldRoomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#082f49" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* ================= BACKGROUND ZONES ================= */}
          {/* Zona Mesin Luar (Condensing Unit / Machine Area) */}
          <rect
            x="30"
            y="25"
            width="650"
            height="665"
            rx="12"
            fill="url(#cduGrad)"
            stroke="#475569"
            strokeDasharray="6 4"
            strokeWidth="1.5"
          />
          <text
            x="50"
            y="52"
            fill="#f59e0b"
            fontSize="12"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="bold"
            letterSpacing="1"
          >
            ZONA MESIN CONDENSING UNIT (LUAR RUANGAN / OUTDOOR)
          </text>
          <text
            x="50"
            y="70"
            fill="#94a3b8"
            fontSize="11"
            fontFamily="'JetBrains Mono', monospace"
          >
            Suhu Lingkungan (Tamb): {ambientTempC}°C | Ventilasi Udara Terbuka Bebas
          </text>

          {/* Zona Ruangan Dalam (Cold Room Insulated Box) */}
          <rect
            x="720"
            y="25"
            width="330"
            height="665"
            rx="12"
            fill="url(#coldRoomGrad)"
            stroke="#0ea5e9"
            strokeDasharray="6 4"
            strokeWidth="2"
          />
          {/* Panel wall representation layer */}
          <rect
            x="712"
            y="25"
            width="14"
            height="665"
            fill="#334155"
            stroke="#64748b"
            strokeWidth="1"
          />
          <text
            x="720"
            y="350"
            fill="#94a3b8"
            fontSize="9"
            fontFamily="'JetBrains Mono', monospace"
            transform="rotate(-90, 720, 350)"
            textAnchor="middle"
          >
            DINDING INSULASI PANEL PU SANDWICH (PENETRASI PIPA)
          </text>

          <text
            x="745"
            y="52"
            fill="#38bdf8"
            fontSize="12"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="bold"
            letterSpacing="1"
          >
            RUANG COLD ROOM (INDOOR)
          </text>
          <text
            x="745"
            y="70"
            fill="#7dd3fc"
            fontSize="11"
            fontFamily="'JetBrains Mono', monospace"
          >
            Target Suhu Ruang: {roomTempC}°C | Volume: {result.internalVolumeM3} m³
          </text>

          {/* ========================================================================= */}
          {/* PIPING RUNS (Draw behind equipment) */}
          {/* ========================================================================= */}

          {/* 1. DISCHARGE LINE: Compressor (90, 480) -> Oil Separator (220, 340) -> Condenser (380, 110) */}
          {/* Main discharge path */}
          <path
            d="M 125 450 L 125 350 L 220 350"
            fill="none"
            stroke="#ef4444"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 290 350 L 330 350 L 330 140 L 400 140"
            fill="none"
            stroke="#ef4444"
            strokeWidth="4"
            strokeLinecap="round"
            markerEnd="url(#arrow-red)"
          />
          {/* Flow animation overlay */}
          {isAnimationActive && (
            <path
              d="M 125 450 L 125 350 L 220 350 M 290 350 L 330 350 L 330 140 L 400 140"
              fill="none"
              stroke="#fee2e2"
              strokeWidth="2"
              strokeDasharray="6 8"
              className="pipe-flow-active"
            />
          )}

          {/* Oil return capillary line from separator back to compressor */}
          <path
            d="M 255 400 L 255 520 L 160 520"
            fill="none"
            stroke="#c084fc"
            strokeWidth="2"
            strokeDasharray="4 3"
            markerEnd="url(#arrow-cyan)"
          />
          <text x="215" y="535" fill="#c084fc" fontSize="9" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
            Balik Oli 1/4" Kapiler
          </text>

          {/* Discharge pipe badge label */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedComponent('discharge_line')}
            transform="translate(140, 290)"
          >
            <rect width="165" height="42" rx="4" fill="#1e293b" stroke="#ef4444" strokeWidth="1" />
            <text x="8" y="16" fill="#f87171" fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              Pipa Gas Panas Buang:
            </text>
            <text x="8" y="32" fill="#ffffff" fontSize="10" fontFamily="'JetBrains Mono', monospace">
              {ref.recommendedDischargeLineInch} | {ref.dischargePressureBarGauge} bar-g
            </text>
          </g>

          {/* 2. CONDENSER TO RECEIVER (Liquid Drop) */}
          <path
            d="M 570 140 L 610 140 L 610 270"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="4"
            strokeLinecap="round"
            markerEnd="url(#arrow-gold)"
          />

          {/* 3. LIQUID LINE: Receiver (610, 390) -> Filter Drier (540, 480) -> Sight Glass (420, 480) -> Solenoid (320, 480) -> TXV (760, 480) */}
          <path
            d="M 610 390 L 610 480 L 760 480"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="4"
            strokeLinecap="round"
            markerEnd="url(#arrow-gold)"
          />
          {isAnimationActive && (
            <path
              d="M 570 140 L 610 140 L 610 480 L 760 480"
              fill="none"
              stroke="#fef3c7"
              strokeWidth="2"
              strokeDasharray="6 8"
              className="pipe-flow-active"
            />
          )}

          {/* Liquid Line pipe badge label */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedComponent('liquid_line')}
            transform="translate(410, 520)"
          >
            <rect width="180" height="42" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
            <text x="8" y="16" fill="#fbbf24" fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              Pipa Cair (Liquid Line):
            </text>
            <text x="8" y="32" fill="#ffffff" fontSize="10" fontFamily="'JetBrains Mono', monospace">
              {ref.recommendedLiquidLineInch} | {ref.massFlowRateKgH} kg/h
            </text>
          </g>

          {/* 4. EXPANSION TO EVAPORATOR (2-Phase Cold Mix) */}
          <path
            d="M 800 480 L 840 480 L 840 370"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="4"
            strokeLinecap="round"
            markerEnd="url(#arrow-cyan)"
          />

          {/* 5. SUCTION LINE: Evaporator Outlet (880, 220) -> Penetration (710, 220) -> Suction Accumulator (125, 220) -> Compressor (125, 460) */}
          <path
            d="M 880 220 L 125 220 L 125 450"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="5"
            strokeLinecap="round"
            markerEnd="url(#arrow-blue)"
          />
          {isAnimationActive && (
            <path
              d="M 880 220 L 125 220 L 125 450"
              fill="none"
              stroke="#e0f2fe"
              strokeWidth="2"
              strokeDasharray="6 8"
              className="pipe-flow-active"
            />
          )}

          {/* Suction Line pipe badge label */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedComponent('suction_line')}
            transform="translate(680, 160)"
          >
            <rect width="175" height="42" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
            <text x="8" y="16" fill="#38bdf8" fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
              Pipa Gas Hisap (Suction):
            </text>
            <text x="8" y="32" fill="#ffffff" fontSize="10" fontFamily="'JetBrains Mono', monospace">
              {ref.recommendedSuctionLineInch} | Armaflex
            </text>
          </g>

          {/* TXV Sensing Bulb clamped on suction pipe */}
          <g transform="translate(850, 212)">
            <rect width="26" height="16" rx="3" fill="#ca8a04" stroke="#eab308" strokeWidth="1.5" />
            <text x="13" y="12" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
              BULB
            </text>
            {/* Capillary line connecting bulb to TXV head */}
            <path
              d="M 13 16 L 13 360 L -60 360 L -60 460"
              fill="none"
              stroke="#eab308"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
          </g>

          {/* External Equalizer Line (TXV to Suction Line downstream of bulb) */}
          <g transform="translate(820, 220)">
            <circle cx="0" cy="0" r="3" fill="#38bdf8" />
            <path
              d="M 0 0 L 0 200 L -30 200 L -30 250"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <text x="-4" y="15" fill="#38bdf8" fontSize="8" fontFamily="'JetBrains Mono', monospace" textAnchor="end">
              Equalizer 1/4"
            </text>
          </g>

          {/* ========================================================================= */}
          {/* EQUIPMENT / VALVES / INSTRUMENT SYMBOLS */}
          {/* ========================================================================= */}

          {/* 1. KOMPRESOR (COMP-01) */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedComponent('compressor')}
            transform="translate(60, 460)"
          >
            {/* Base plate */}
            <rect x="0" y="110" width="130" height="8" rx="2" fill="#334155" stroke="#475569" />
            {/* Main Compressor Body Cylinder */}
            <rect
              x="15"
              y="20"
              width="100"
              height="90"
              rx="16"
              fill={selectedComponent === 'compressor' ? '#083344' : '#0f172a'}
              stroke={selectedComponent === 'compressor' ? '#06b6d4' : '#38bdf8'}
              strokeWidth="2.5"
            />
            {/* Terminal Box */}
            <rect x="90" y="35" width="22" height="28" rx="3" fill="#334155" stroke="#06b6d4" />
            {/* Oil level sight glass on crankcase */}
            <circle cx="65" cy="88" r="10" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="65" cy="88" r="4" fill="#fbbf24" />

            {/* Labels */}
            <text x="65" y="42" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
              KOMPRESOR
            </text>
            <text x="65" y="56" fill="#ffffff" fontSize="12" fontFamily="'JetBrains Mono', monospace" fontWeight="bold" textAnchor="middle">
              {result.recommendedCondensingUnitHp} HP ({result.recommendedCondensingUnitHp} PK)
            </text>
            <text x="65" y="70" fill="#94a3b8" fontSize="9" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
              W: ~{ref.compressorWorkEstimateKw} kW
            </text>
            <text x="65" y="105" fill="#f59e0b" fontSize="8" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
              Oli: {ref.recommendedOilType.split(' ')[0]} {ref.recommendedOilType.split(' ')[1]}
            </text>
          </g>

          {/* Discharge Vibration Absorber (Anakonda) */}
          <g transform="translate(117, 390)">
            <rect width="16" height="35" rx="3" fill="#1e293b" stroke="#f87171" strokeWidth="1.5" />
            {/* Corrugated ribs */}
            <line x1="117" y1="400" x2="133" y2="400" stroke="#f87171" strokeWidth="1" />
            <line x1="117" y1="408" x2="133" y2="408" stroke="#f87171" strokeWidth="1" />
            <line x1="117" y1="416" x2="133" y2="416" stroke="#f87171" strokeWidth="1" />
          </g>

          {/* 2. PEMISAH OLI (SEP-01) */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedComponent('oil_separator')}
            transform="translate(220, 310)"
          >
            <rect
              width="70"
              height="90"
              rx="12"
              fill={selectedComponent === 'oil_separator' ? '#2e1065' : '#0f172a'}
              stroke={selectedComponent === 'oil_separator' ? '#c084fc' : '#a855f7'}
              strokeWidth="2"
            />
            <text x="35" y="32" fill="#c084fc" fontSize="10" fontWeight="bold" textAnchor="middle">
              OIL
            </text>
            <text x="35" y="46" fill="#c084fc" fontSize="10" fontWeight="bold" textAnchor="middle">
              SEPARATOR
            </text>
            {/* Internal float symbol */}
            <circle cx="35" cy="65" r="8" fill="#e9d5ff" stroke="#a855f7" strokeWidth="1" />
            <text x="35" y="82" fill="#94a3b8" fontSize="8" textAnchor="middle">
              Helical
            </text>
          </g>

          {/* 3. KONDENSOR (COND-01) */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedComponent('condenser')}
            transform="translate(400, 80)"
          >
            {/* Condenser frame */}
            <rect
              width="170"
              height="115"
              rx="8"
              fill={selectedComponent === 'condenser' ? '#451a03' : '#1e293b'}
              stroke={selectedComponent === 'condenser' ? '#f59e0b' : '#d97706'}
              strokeWidth="2"
            />
            {/* Serpentine tube cooling coil representation */}
            <path
              d="M 15 25 L 155 25 M 155 45 L 15 45 M 15 65 L 155 65 M 155 85 L 15 85"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeOpacity="0.4"
            />
            {/* Fan Circles */}
            <circle cx="55" cy="55" r="24" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
            <circle cx="115" cy="55" r="24" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
            <text x="55" y="59" fill="#f59e0b" fontSize="11" textAnchor="middle">
              FAN 1
            </text>
            <text x="115" y="59" fill="#f59e0b" fontSize="11" textAnchor="middle">
              FAN 2
            </text>

            {/* Labels */}
            <text x="85" y="18" fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="middle">
              KONDENSOR UDARA (Qc)
            </text>
            <text x="85" y="98" fill="#ffffff" fontSize="11" fontFamily="'JetBrains Mono', monospace" fontWeight="bold" textAnchor="middle">
              {unitMode === 'metric' ? `${ref.condenserHeatRejectionKw} kW` : `${ref.condenserHeatRejectionBtuH.toLocaleString('id-ID')} BTU/h`}
            </text>
            <text x="85" y="110" fill="#cbd5e1" fontSize="9" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
              Tc: {ref.condensingTempC}°C | Pc: {ref.dischargePressureBarGauge} bar
            </text>

            {/* Heat outflow wavy arrows */}
            <g transform="translate(85, -20)">
              <path d="M -20 15 L -20 -5 M 0 15 L 0 -5 M 20 15 L 20 -5" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow-gold)" />
              <text x="0" y="-10" fill="#f59e0b" fontSize="9" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
                Udara Panas Keluar
              </text>
            </g>
          </g>

          {/* 4. TANGKI RECEIVER (REC-01) */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedComponent('receiver')}
            transform="translate(575, 270)"
          >
            <rect
              width="70"
              height="120"
              rx="16"
              fill={selectedComponent === 'receiver' ? '#451a03' : '#0f172a'}
              stroke={selectedComponent === 'receiver' ? '#f59e0b' : '#b45309'}
              strokeWidth="2"
            />
            {/* Liquid level representation */}
            <rect x="5" y="60" width="60" height="50" rx="10" fill="#f59e0b" fillOpacity="0.25" />
            <line x1="5" y1="60" x2="65" y2="60" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />

            <text x="35" y="26" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">
              LIQUID
            </text>
            <text x="35" y="38" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">
              RECEIVER
            </text>
            <text x="35" y="52" fill="#ffffff" fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="bold" textAnchor="middle">
              {ref.recommendedReceiverVolumeLiters} L
            </text>
            <text x="35" y="90" fill="#cbd5e1" fontSize="8" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
              ±{ref.estimatedChargeKg} kg Freon
            </text>

            {/* Safety Relief Valve (PRV) on top */}
            <polygon points="35, -12 30, 0 40, 0" fill="#ef4444" stroke="#f87171" strokeWidth="1" />
            <text x="45" y="-6" fill="#ef4444" fontSize="8" fontFamily="'JetBrains Mono', monospace">
              PRV 28 bar
            </text>
          </g>

          {/* 5. FILTER DRIER (FLT-01) */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedComponent('filter_drier')}
            transform="translate(530, 460)"
          >
            <polygon
              points="0,10 10,0 50,0 60,10 60,30 50,40 10,40 0,30"
              fill={selectedComponent === 'filter_drier' ? '#14532d' : '#0f172a'}
              stroke={selectedComponent === 'filter_drier' ? '#22c55e' : '#16a34a'}
              strokeWidth="2"
            />
            <text x="30" y="20" fill="#22c55e" fontSize="9" fontWeight="bold" textAnchor="middle">
              FILTER
            </text>
            <text x="30" y="32" fill="#86efac" fontSize="8" textAnchor="middle">
              DRIER
            </text>
          </g>

          {/* 6. SIGHT GLASS (SG-01) */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedComponent('sight_glass')}
            transform="translate(450, 465)"
          >
            <circle
              cx="15"
              cy="15"
              r="15"
              fill={selectedComponent === 'sight_glass' ? '#042f2e' : '#0f172a'}
              stroke={selectedComponent === 'sight_glass' ? '#14b8a6' : '#0d9488'}
              strokeWidth="2"
            />
            {/* Green moisture dot */}
            <circle cx="15" cy="15" r="5" fill="#22c55e" />
            <text x="15" y="-5" fill="#14b8a6" fontSize="8" fontWeight="bold" textAnchor="middle">
              SIGHT GLASS
            </text>
          </g>

          {/* 7. SOLENOID VALVE (SOL-01) */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedComponent('solenoid_valve')}
            transform="translate(370, 465)"
          >
            {/* Valve Body Triangles */}
            <polygon points="0,0 0,30 15,15" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <polygon points="30,0 30,30 15,15" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            {/* Solenoid Coil Box on top */}
            <rect
              x="5"
              y="-18"
              width="20"
              height="18"
              rx="2"
              fill={selectedComponent === 'solenoid_valve' ? '#451a03' : '#334155'}
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
            <text x="15" y="-6" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">
              220V
            </text>
            <text x="15" y="42" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">
              SOLENOID
            </text>
          </g>

          {/* 8. KATUP EKSPANSI TXV (TXV-01) */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedComponent('txv')}
            transform="translate(760, 460)"
          >
            {/* TXV Diaphragm dome head on top */}
            <path
              d="M 5 -10 Q 20 -24 35 -10 Z"
              fill={selectedComponent === 'txv' ? '#083344' : '#1e293b'}
              stroke="#06b6d4"
              strokeWidth="2"
            />
            {/* Connecting stem */}
            <rect x="17" y="-10" width="6" height="15" fill="#06b6d4" />
            {/* Two opposing triangles */}
            <polygon points="0,5 0,35 20,20" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
            <polygon points="40,5 40,35 20,20" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
            {/* Superheat adjust screw bottom */}
            <rect x="16" y="35" width="8" height="8" rx="1" fill="#334155" stroke="#06b6d4" />

            <text x="20" y="-28" fill="#22d3ee" fontSize="10" fontWeight="bold" textAnchor="middle">
              TXV / EEV
            </text>
            <text x="20" y="55" fill="#e2e8f0" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="bold" textAnchor="middle">
              {ref.recommendedExpansionValve.split(' ')[1] || 'TEX 2'}
            </text>
          </g>

          {/* 9. EVAPORATOR UNIT COOLER (EVAP-01) */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedComponent('evaporator')}
            transform="translate(770, 240)"
          >
            {/* Unit cooler casing */}
            <rect
              width="240"
              height="130"
              rx="8"
              fill={selectedComponent === 'evaporator' ? '#082f49' : '#0f172a'}
              stroke={selectedComponent === 'evaporator' ? '#0ea5e9' : '#0284c7'}
              strokeWidth="2.5"
            />
            {/* Finned Coil graphic */}
            <line x1="20" y1="20" x2="20" y2="110" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="30" y1="20" x2="30" y2="110" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="40" y1="20" x2="40" y2="110" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" />

            {/* Blower Fans */}
            <circle cx="95" cy="65" r="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="175" cy="65" r="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="95" y="70" fill="#38bdf8" fontSize="11" textAnchor="middle">
              FAN 1
            </text>
            <text x="175" y="70" fill="#38bdf8" fontSize="11" textAnchor="middle">
              FAN 2
            </text>

            {/* Air flow arrows blowing out cold air */}
            <g transform="translate(135, 132)">
              <path d="M -30 0 L -30 18 M 0 0 L 0 18 M 30 0 L 30 18" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-cyan)" />
              <text x="0" y="32" fill="#38bdf8" fontSize="9" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
                Udara Dingin Blower ({result.evaporatorAirflowCmh.toLocaleString('id-ID')} m³/h)
              </text>
            </g>

            {/* Labels */}
            <text x="135" y="24" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">
              EVAPORATOR (UNIT COOLER)
            </text>
            <text x="135" y="112" fill="#ffffff" fontSize="11" fontFamily="'JetBrains Mono', monospace" fontWeight="bold" textAnchor="middle">
              Qe: {result.requiredRefrigerationKw} kW ({result.requiredRefrigerationTr} TR)
            </text>
            <text x="135" y="125" fill="#94a3b8" fontSize="9" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
              Te: {ref.evaporatingTempC}°C | Pe: {ref.suctionPressureBarGauge} bar-g | Fin: {result.recommendedFinSpacingMm} mm
            </text>
          </g>

          {/* 10. AKUMULATOR HISAP (ACC-01) */}
          <g
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedComponent('suction_accumulator')}
            transform="translate(90, 240)"
          >
            <rect
              width="70"
              height="115"
              rx="16"
              fill={selectedComponent === 'suction_accumulator' ? '#082f49' : '#0f172a'}
              stroke={selectedComponent === 'suction_accumulator' ? '#38bdf8' : '#0284c7'}
              strokeWidth="2"
            />
            {/* Internal U-tube representation */}
            <path
              d="M 22 20 L 22 85 Q 35 98 48 85 L 48 20"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />
            {/* Oil metering bleed hole */}
            <circle cx="35" cy="94" r="2" fill="#f59e0b" />

            <text x="35" y="35" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">
              SUCTION
            </text>
            <text x="35" y="47" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">
              ACCUMULATOR
            </text>
            <text x="35" y="65" fill="#ffffff" fontSize="9" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
              {ref.recommendedSuctionAccumulator.split(' ')[2]} L
            </text>
            <text x="35" y="78" fill="#94a3b8" fontSize="8" textAnchor="middle">
              Anti Liquid Slug
            </text>
          </g>

          {/* Suction Vibration Absorber */}
          <g transform="translate(117, 360)">
            <rect width="16" height="30" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="117" y1="368" x2="133" y2="368" stroke="#38bdf8" strokeWidth="1" />
            <line x1="117" y1="375" x2="133" y2="375" stroke="#38bdf8" strokeWidth="1" />
            <line x1="117" y1="382" x2="133" y2="382" stroke="#38bdf8" strokeWidth="1" />
          </g>

          {/* 11. MANOMETER INSTRUMEN (HP & LP) */}
          {/* High Pressure Gauge */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedComponent('hp_gauge')}
            transform="translate(240, 240)"
          >
            <line x1="20" y1="35" x2="20" y2="70" stroke="#ef4444" strokeWidth="2" />
            <circle cx="20" cy="20" r="18" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
            {/* Needle pointing to high pressure */}
            <line x1="20" y1="20" x2="28" y2="12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="20" r="3" fill="#ffffff" />
            <text x="20" y="12" fill="#ef4444" fontSize="7" fontWeight="bold" textAnchor="middle">
              HP
            </text>
            <text x="20" y="29" fill="#ffffff" fontSize="7" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
              {ref.dischargePressureBarGauge}b
            </text>
          </g>

          {/* Low Pressure Gauge */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedComponent('lp_gauge')}
            transform="translate(420, 200)"
          >
            <line x1="20" y1="20" x2="20" y2="0" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="20" cy="35" r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <line x1="20" y1="35" x2="14" y2="28" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="35" r="3" fill="#ffffff" />
            <text x="20" y="28" fill="#38bdf8" fontSize="7" fontWeight="bold" textAnchor="middle">
              LP
            </text>
            <text x="20" y="44" fill="#ffffff" fontSize="7" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
              {ref.suctionPressureBarGauge}b
            </text>
          </g>

          {/* Dual Pressure Switch Box */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedComponent('pressure_switch')}
            transform="translate(290, 580)"
          >
            <rect width="90" height="50" rx="4" fill="#0f172a" stroke="#e2e8f0" strokeWidth="1.5" />
            <line x1="45" y1="0" x2="45" y2="50" stroke="#334155" strokeWidth="1" />
            <text x="22" y="20" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">
              LPS
            </text>
            <text x="22" y="34" fill="#94a3b8" fontSize="8" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
              {Math.max(0.2, Math.round((ref.suctionPressureBarGauge - 0.7) * 10) / 10)} b
            </text>

            <text x="68" y="20" fill="#f87171" fontSize="9" fontWeight="bold" textAnchor="middle">
              HPS
            </text>
            <text x="68" y="34" fill="#94a3b8" fontSize="8" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
              {Math.round(ref.dischargePressureBarGauge * 1.25)} b
            </text>
            <text x="45" y="46" fill="#e2e8f0" fontSize="7" fontWeight="bold" textAnchor="middle">
              DUAL CONTROLLER
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Component Inspector Box */}
      {activeDetail && (
        <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 sm:p-5 space-y-4 shadow-lg transition-all animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
                {activeDetail.tag}
              </span>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  {activeDetail.name}
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  Kategori: {activeDetail.category}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">
                Hasil Kalkulasi Proyek
              </span>
              <strong className="text-cyan-300 font-mono text-xs sm:text-sm">
                {activeDetail.calculatedValue}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Function & Role */}
            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <span className="font-mono text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                Fungsi &amp; Peran Sirkuit:
              </span>
              <p className="text-slate-300 leading-relaxed">{activeDetail.functionDesc}</p>
              {activeDetail.secondaryValue && (
                <div className="pt-2 text-[11px] font-mono text-cyan-400">
                  {activeDetail.secondaryValue}
                </div>
              )}
            </div>

            {/* Sizing Criteria */}
            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <span className="font-mono text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                Dasar &amp; Rumus Perhitungan:
              </span>
              <p className="text-slate-300 leading-relaxed">{activeDetail.sizingBasis}</p>
            </div>

            {/* Practical Field Installation Tips */}
            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <span className="font-mono text-emerald-400 text-[11px] uppercase tracking-wider block font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                SOP Teknisi &amp; Pemasangan Lapangan:
              </span>
              <ul className="space-y-1 text-slate-300 list-disc list-inside leading-relaxed text-[11px]">
                {activeDetail.fieldTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Component Quick Selector Pills */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
          Klik Komponen Diagram untuk Melihat Spesifikasi &amp; Panduan Sizing:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'compressor', label: 'Kompresor CDU' },
            { id: 'oil_separator', label: 'Pemisah Oli (Separator)' },
            { id: 'condenser', label: 'Kondensor Udara' },
            { id: 'receiver', label: 'Liquid Receiver' },
            { id: 'filter_drier', label: 'Filter Drier' },
            { id: 'sight_glass', label: 'Sight Glass' },
            { id: 'solenoid_valve', label: 'Solenoid Valve' },
            { id: 'txv', label: 'Katup Ekspansi (TXV)' },
            { id: 'evaporator', label: 'Evaporator (Unit Cooler)' },
            { id: 'suction_accumulator', label: 'Akumulator Hisap' },
            { id: 'discharge_line', label: 'Pipa Gas Buang' },
            { id: 'liquid_line', label: 'Pipa Cair' },
            { id: 'suction_line', label: 'Pipa Hisap' },
            { id: 'pressure_switch', label: 'Dual Pressure Switch' },
          ].map((item) => {
            const isSelected = selectedComponent === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedComponent(item.id as ComponentId)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all border ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm shadow-cyan-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
