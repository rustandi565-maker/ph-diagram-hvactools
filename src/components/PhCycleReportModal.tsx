import React, { useState } from 'react';
import { CompanyBranding, LABTECH_BRANDING, DEFAULT_BRANDING } from '../types/branding';
import { PhCycleResult, PhReportMeta, PressureUnit, PowerUnit } from '../types/phDiagram';
import { PhDiagramCanvas } from './PhDiagramCanvas';
import { LabtechLogo } from './LabtechLogo';
import { RtuLogo } from './RtuLogo';
import { ReportVectorHeader } from './ReportVectorHeader';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { buildWhatsAppReportMessage } from '../utils/whatsappShare';
import { AppLanguage, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../utils/i18n';

interface PhCycleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding?: CompanyBranding;
  reportMeta: PhReportMeta;
  onUpdateReportMeta?: (meta: PhReportMeta) => void;
  result: PhCycleResult;
  inputValues: {
    suctionPressure: number;
    suctionPressureUnit: PressureUnit;
    dischargePressure: number;
    dischargePressureUnit: PressureUnit;
    suctionTempC: number;
    dischargeTempC: number;
    liquidTempC: number;
    compressorPower: number;
    compressorPowerUnit: PowerUnit;
  };
  language?: AppLanguage;
  onChangeLanguage?: (lang: AppLanguage) => void;
}

export const PhCycleReportModal: React.FC<PhCycleReportModalProps> = ({
  isOpen,
  onClose,
  branding,
  reportMeta,
  onUpdateReportMeta,
  result,
  inputValues,
  language = 'id',
  onChangeLanguage,
}) => {
  const [selectedLetterhead, setSelectedLetterhead] = useState<'current' | 'labtech'>('labtech');
  const [currentLang, setCurrentLang] = useState<AppLanguage>(language);
  const activeLang = onChangeLanguage ? language : currentLang;
  const setLang = (l: AppLanguage) => {
    setCurrentLang(l);
    onChangeLanguage?.(l);
  };

  const t = TRANSLATIONS[activeLang] ?? TRANSLATIONS.id;
  const [copied, setCopied] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);

  // Dynamic, thermodynamically rigorous conclusion tailored to active language
  const getDefaultConclusion = (lang: AppLanguage) => {
    // Thermodynamic boundary evaluation
    const isSubcoolingNormal = result.subcoolingK >= 3.0 && result.subcoolingK <= 10.0 && result.liquidTempC < result.tcC;
    const isSubcoolingLow = result.subcoolingK < 3.0 || result.liquidTempC >= result.tcC;
    const isSubcoolingHigh = result.subcoolingK > 10.0;

    const isSuperheatNormal = result.superheatK >= 4.0 && result.superheatK <= 12.0;
    const isSuperheatLow = result.superheatK < 4.0;
    const isSuperheatHigh = result.superheatK > 12.0;

    const isCopLow = result.copActual < 2.0;
    const isLiquidTempTooHigh = result.liquidTempC >= 55 || (result.liquidTempC >= result.tcC - 1.0);

    const isSystemNormal = isSubcoolingNormal && isSuperheatNormal && !isCopLow && !isLiquidTempTooHigh;

    if (lang === 'en') {
      const shEvaluation = isSuperheatNormal
        ? `1. Superheat Evaluation: Measured superheat is +${result.superheatK.toFixed(1)} K, which is optimal within ASHRAE operating standards (5 - 10 K), protecting the compressor against liquid floodback while ensuring dry suction vapor.`
        : isSuperheatLow
        ? `1. Superheat Evaluation (CRITICAL ABNORMAL WARNING): Measured superheat is only +${result.superheatK.toFixed(1)} K (below the 4 - 5 K minimum). There is a critical risk of wet suction vapor and liquid floodback/slugging into compressor cylinders, risking valve damage and oil dilution.`
        : `1. Superheat Evaluation (HIGH TEMPERATURE WARNING): Measured superheat is +${result.superheatK.toFixed(1)} K (exceeding the 10 - 12 K limit). High suction superheat degrades compressor volumetric efficiency and causes excessive discharge temperature (T2).`;

      const scEvaluation = isSubcoolingNormal
        ? `2. Subcooling Evaluation: Measured subcooling is +${result.subcoolingK.toFixed(1)} K (Liquid Temp T3 = ${result.liquidTempC}°C, Tc = ${result.tcC}°C), meeting ASHRAE standards (3 - 8 K) and guaranteeing solid liquid before the TXV without flash gas.`
        : isSubcoolingLow
        ? `2. Subcooling Evaluation (ABNORMAL / FAR BELOW STANDARD): Measured subcooling is only ${result.subcoolingK.toFixed(1)} K with abnormally high liquid temperature T3 (${result.liquidTempC}°C approaching or exceeding saturation condensing temperature Tc ${result.tcC}°C). This is FAR BELOW the ASHRAE minimum (3 - 8 K). Refrigerant leaves the condenser without proper subcooling, triggering premature flash gas vapor bubbles before the TXV orifice (vapor lock), inducing erratic valve hunting, and severely slashing the refrigerating effect (q_e).`
        : `2. Subcooling Evaluation (TOO HIGH): Measured subcooling is +${result.subcoolingK.toFixed(1)} K (> 10 K), indicating liquid accumulation in the condenser (potential refrigerant overcharge) which reduces effective condensing area.`;

      const cyclePerf = `3. System Cycle Performance: Refrigeration effect q_e = ${result.refrigeratingEffectKjKg} kJ/kg, compression work w_c = ${result.workCompressionKjKg} kJ/kg. Total cooling capacity is ${result.coolingCapacityKw} kW (${(result.coolingCapacityKw / 3.51685).toFixed(2)} TR / ${(result.coolingCapacityKw * 3412.14).toLocaleString('en-US', { maximumFractionDigits: 0 })} BTU/h). ${isSubcoolingLow ? 'Note: Refrigerating effect q_e is severely suppressed due to high liquid enthalpy h3 resulting from inadequate subcooling.' : ''}`;

      const flowPerf = `4. Flow Rate & Energy Efficiency: Mass flow rate is ${result.massFlowKgS} kg/s (${result.massFlowKgH} kg/h), equivalent to a liquid volumetric flow of ${result.massFlowLpm} LPM at expansion temperature T3 (${result.liquidTempC}°C, Vl = ${result.liquidSpecificVolumeDm3Kg} dm³/kg). Actual COP is ${result.copActual} (Isentropic Efficiency = ${(result.isentropicEfficiencyActual * 100).toFixed(1)}%). Energy Efficiency Ratio (EER) is ${result.eerBtuWh} Btu/(h·W) classified as ${result.eerStarLabel}.`;

      const statusConclusion = isSystemNormal
        ? `SYSTEM STATUS: GOOD (NORMAL & EFFICIENT). Unit ${result.refrigerant.name} operates optimally and fulfills all thermodynamic test parameters.`
        : `SYSTEM STATUS: POOR / ABNORMAL (Low Efficiency & Subcooling Deficiency). Unit ${result.refrigerant.name} IS NOT OPERATING OPTIMALLY because liquid temperature T3 (${result.liquidTempC}°C) is too high and subcooling (${result.subcoolingK.toFixed(1)} K) is far below standard, resulting in an abnormal drop of COP to ${result.copActual} (EER ${result.eerBtuWh} Btu/(h·W) / 1 Star rating).

5. Field Troubleshooting & Corrective Solutions:
   a. Inspect Condenser Heat Rejection: High T3 (${result.liquidTempC}°C) indicates severely impaired condenser heat transfer. Clean condenser fins, inspect fan motor speed/airflow, and eliminate hot air recirculation.
   b. Check Refrigerant Charge & Sight Glass: Inspect the liquid line sight glass. If persistent vapor bubbles appear alongside near-zero subcooling, the system is undercharged. Add refrigerant until solid liquid flow is achieved and subcooling reaches 3 - 8 K.
   c. Non-Condensable Gas Purge: If head pressure and liquid temperature are simultaneously elevated, check for non-condensable air/nitrogen in the condenser. Evacuate and pull a deep vacuum (< 500 microns) before recharging.
   d. Liquid Line Thermal Protection: Ensure the liquid line is not running adjacent to hot compressor discharge lines before entering the TXV.`;

      return `${shEvaluation}\n${scEvaluation}\n${cyclePerf}\n${flowPerf}\n${statusConclusion}`;
    }

    if (lang === 'jv') {
      const shEvaluation = isSuperheatNormal
        ? `1. Evaluasi Superheat: Nilai Superheat yaiku +${result.superheatK.toFixed(1)} K, ana ing kahanan apik manut standar ASHRAE (5 - 10 K), ngreksa kompresor saka bahaya cairan (liquid slugging) lan mesthekake kukus sing disedot garing.`
        : isSuperheatLow
        ? `1. Evaluasi Superheat (PERINGATAN KRITIS): Nilai Superheat mung +${result.superheatK.toFixed(1)} K (ing ngisore standar 4 K). Ana risiko uap teles mlebu silinder kompresor sing bisa ngrusak klep kompresor.`
        : `1. Evaluasi Superheat (KAPASITAS KELUWIHEN): Nilai Superheat tekan +${result.superheatK.toFixed(1)} K (ngluwihi 12 K), ndadekake kompresor panas banget (overheating).`;

      const scEvaluation = isSubcoolingNormal
        ? `2. Evaluasi Subcooling: Nilai Subcooling yaiku +${result.subcoolingK.toFixed(1)} K (Suhu Cairan T3 = ${result.liquidTempC}°C, Tc = ${result.tcC}°C), wis trep karo standar ASHRAE (3 - 8 K) lan njamin refrigerant wujude banyu jenuh sadurunge mlebu katup ekspansi tanpa flash gas.`
        : isSubcoolingLow
        ? `2. Evaluasi Subcooling (KAHANAN JELEK / ADOH SAKA STANDAR): Nilai Subcooling mung ${result.subcoolingK.toFixed(1)} K kanthi suhu cairan T3 dhuwur banget (${result.liquidTempC}°C nyedhaki/ngluwihi suhu kondensasi Tc ${result.tcC}°C). Iki ADOH ING NGISORE standar ASHRAE (3 - 8 K). Refrigerant metu saka kondensor ORA kelangan panas kanthi cukup, saengga nuwuhake umpluk gas (flash gas) sadurunge katup ekspansi TXV, nyebabake katup kesumpet lan nyuda daya adhem (q_e).`
        : `2. Evaluasi Subcooling (KEDHUWUREN): Nilai Subcooling ${result.subcoolingK.toFixed(1)} K (> 10 K), pratandha freon kakehan (overcharge).`;

      const cyclePerf = `3. Kinerja Siklus: Efek refrigerasi q_e = ${result.refrigeratingEffectKjKg} kJ/kg, gawean kompresi w_c = ${result.workCompressionKjKg} kJ/kg, kapasitas ngadhemake = ${result.coolingCapacityKw} kW (${(result.coolingCapacityKw / 3.51685).toFixed(2)} TR). ${isSubcoolingLow ? 'Cathetan: Efek pendinginan q_e anjlok amarga suhu cairan T3 durung adhem.' : ''}`;

      const flowPerf = `4. Mili Massa & Efisiensi Energi: Mili massa yaiku ${result.massFlowKgS} kg/detik (${result.massFlowKgH} kg/jam) utawa ${result.massFlowLpm} LPM kanthi volume cairan Vl = ${result.liquidSpecificVolumeDm3Kg} dm³/kg ing suhu T3 (${result.liquidTempC}°C). COP Aktual = ${result.copActual}, EER = ${result.eerBtuWh} Btu/(h·W) kanthi biji ${result.eerStarLabel}.`;

      const statusConclusion = isSystemNormal
        ? `STATUS SISTEM: BECIK / APIS (NORMAL & EFISIEN). Mesin ${result.refrigerant.name} mlaku kanthi becik manut panjalukan pangujian.`
        : `STATUS SISTEM: JELEK / ABNORMAL (Kinerja Kurang & Subcooling Rusak). Mesin ${result.refrigerant.name} ORA MLAKU OPTIMAL amarga suhu T3 (${result.liquidTempC}°C) kedhuwuren lan subcooling (${result.subcoolingK.toFixed(1)} K) adoh ing ngisore standar, nyebabake COP anjlok menyang ${result.copActual} (EER ${result.eerBtuWh} Btu/(h·W) / Bintang 1).

5. Solusi Ndandani Ing Lapangan:
   a. Resiki sirip-sirip kondensor saka bledug lan priksa kipas motor kondensor.
   b. Priksa sight glass; yen ana umpluk hawa terus, tambahi freon amarga sistem kurang isi (undercharge).
   c. Buwang hawa palsu (non-condensable gas) kanthi vakum ulang yen tekanan dhuwur banget.
   d. Pasang isolasi pipa cairan supaya ora keno panas mesin.`;

      return `${shEvaluation}\n${scEvaluation}\n${cyclePerf}\n${flowPerf}\n${statusConclusion}`;
    }

    if (lang === 'su') {
      const shEvaluation = isSuperheatNormal
        ? `1. Evaluasi Superheat: Peunteun Superheat nyaeta +${result.superheatK.toFixed(1)} K, aya dina kaayaan sae luyu jeung standar ASHRAE (5 - 10 K), ngajagi kompresor tina cairan bahaya (liquid slugging) sarta mastikeun uap hisap garing.`
        : isSuperheatLow
        ? `1. Evaluasi Superheat (PERINGATAN BAHAYA): Peunteun Superheat mung +${result.superheatK.toFixed(1)} K (handapeun standar 4 K). Aya résiko cairan freon asup ka jero silinder kompresor anu tiasa ngaruksak klep kompresor.`
        : `1. Evaluasi Superheat (KATINGGIAN): Peunteun Superheat dugi ka +${result.superheatK.toFixed(1)} K (ngalangkungan 12 K), nyababkeun kompresor panas teuing (overheating).`;

      const scEvaluation = isSubcoolingNormal
        ? `2. Evaluasi Subcooling: Peunteun Subcooling nyaeta +${result.subcoolingK.toFixed(1)} K (Suhu Cairan T3 = ${result.liquidTempC}°C, Tc = ${result.tcC}°C), cocog sareng standar ASHRAE (3 - 8 K), ngajamin refrigeran mangrupa cairan jenuh sateuacan lebet katup ekspansi tanpa flash gas.`
        : isSubcoolingLow
        ? `2. Evaluasi Subcooling (KAYAAN AWON / JAUH HANDAPEUN STANDAR): Peunteun Subcooling mung ${result.subcoolingK.toFixed(1)} K kalayan suhu cairan T3 luhur pisan (${result.liquidTempC}°C caket/ngalangkungan suhu kondensasi Tc ${result.tcC}°C). Ieu JAUH HANDAPEUN standar ASHRAE (3 - 8 K). Refrigeran kaluar ti kondensor TEU katingal subcooled kalayan sae, nyababkeun gelembung hawa uap (flash gas) sateuacan katup ekspansi TXV anu ngabendung klep sareng ngirangan pangaruh niiskeun (q_e).`
        : `2. Evaluasi Subcooling (KATINGGIAN): Peunteun Subcooling ${result.subcoolingK.toFixed(1)} K (> 10 K), ciciren freon kaleuwihan (overcharge).`;

      const cyclePerf = `3. Kinerja Siklus: Pangaruh refrigerasi q_e = ${result.refrigeratingEffectKjKg} kJ/kg, karya kompresi w_c = ${result.workCompressionKjKg} kJ/kg, kapasitas niiskeun = ${result.coolingCapacityKw} kW (${(result.coolingCapacityKw / 3.51685).toFixed(2)} TR). ${isSubcoolingLow ? 'Catetan: Pangaruh niiskeun q_e turun lantaran suhu cairan T3 teu acan tiis.' : ''}`;

      const flowPerf = `4. Aliran Massa & Efisiensi Energi: Laju aliran massa nyaeta ${result.massFlowKgS} kg/detik (${result.massFlowKgH} kg/jam) atanapi ${result.massFlowLpm} LPM kalayan volume spésifik Vl = ${result.liquidSpecificVolumeDm3Kg} dm³/kg dina suhu T3 (${result.liquidTempC}°C). COP Aktual = ${result.copActual}, EER = ${result.eerBtuWh} Btu/(h·W) kalayan tingkat ${result.eerStarLabel}.`;

      const statusConclusion = isSystemNormal
        ? `STATUS SISTEM: SAE / HADE (NORMAL & EFISIEN). Mesin ${result.refrigerant.name} fungsina sae pisan saluyu sareng spésifikasi pangujian.`
        : `STATUS SISTEM: AWON / ABNORMAL (Kinerja Handap & Subcooling Kurang). Mesin ${result.refrigerant.name} TEU JALAN OPTIMAL lantaran suhu T3 (${result.liquidTempC}°C) luhur teuing sareng subcooling (${result.subcoolingK.toFixed(1)} K) jauh handapeun standar, ngabalukarkeun COP anjlok ka ${result.copActual} (EER ${result.eerBtuWh} Btu/(h·W) / Bintang 1).

5. Léngkah Perbaikan di Lapangan:
   a. Beresihan sirip kondensor tina kokotor sarta parios kipas motor kondensor.
   b. Tingal sight glass; upami seueur gelembung uap, tambah freon margi sistem kakirangan muatan (undercharge).
   c. Piceun hawa non-condensable kalayan vakum ulang upami tekanan discharge tinggi teuing.
   d. Pasang isolasi pipa cairan supados teu kaserep panas mesin.`;

      return `${shEvaluation}\n${scEvaluation}\n${cyclePerf}\n${flowPerf}\n${statusConclusion}`;
    }

    // Default Indonesian
    const shEvaluation = isSuperheatNormal
      ? `1. Evaluasi Superheat: Nilai Superheat sebesar +${result.superheatK.toFixed(1)} K berada pada kondisi optimal sesuai standar ASHRAE (5 - 10 K), memastikan uap hisap kering sempurna dan melindungi kompresor dari risiko pukulan cairan (liquid slugging/floodback).`
      : isSuperheatLow
      ? `1. Evaluasi Superheat (PERINGATAN KRITIS / ABNORMAL): Nilai Superheat hanya +${result.superheatK.toFixed(1)} K (di bawah batas minimum 4 - 5 K). Kondisi ini kritis karena uap hisap basah berisiko membawa cairan refrigeran masuk ke silinder kompresor yang dapat merusak katup kompresor dan mengencerkan oli pelumas.`
      : `1. Evaluasi Superheat (PERINGATAN TINGGI): Nilai Superheat mencapai +${result.superheatK.toFixed(1)} K (melebihi batas aman 10 - 12 K). Uap hisap terlalu panas menyebabkan efisiensi volumetrik kompresor merosot dan temperatur pembuangan discharge (T2) melonjak tinggi.`;

    const scEvaluation = isSubcoolingNormal
      ? `2. Evaluasi Subcooling: Nilai Subcooling sebesar +${result.subcoolingK.toFixed(1)} K (Suhu Cairan T3 = ${result.liquidTempC}°C, Tc = ${result.tcC}°C) memenuhi standar ASHRAE (3 - 8 K), menjamin refrigeran berfasa cair jenuh penuh sebelum katup ekspansi TXV tanpa gelembung flash gas dini.`
      : isSubcoolingLow
      ? `2. Evaluasi Subcooling (KONDISI ABNORMAL / JAUH DI BAWAH STANDAR): Nilai Subcooling hanya ${result.subcoolingK.toFixed(1)} K dengan suhu cairan T3 sangat tinggi (${result.liquidTempC}°C, mendekati/melebihi suhu kondensasi Tc ${result.tcC}°C). Nilai ini JAUH DI BAWAH standar minimum ASHRAE (3 - 8 K). Refrigeran keluar kondenser TIDAK ter-subcooled dengan aman, memicu pembentukan gelembung flash gas dini sebelum katup ekspansi TXV yang menyumbat orifice katup (vapor lock), membuat kerja TXV hunting/tidak stabil, serta memangkas efek refrigerasi (q_e).`
      : `2. Evaluasi Subcooling (TERLALU TINGGI): Nilai Subcooling mencapai +${result.subcoolingK.toFixed(1)} K (> 10 K), mengindikasikan penumpukan cairan berlebih di kondenser (potensi overcharge freon) yang memakan volume pipa kondenser dan menaikkan head pressure.`;

    const cyclePerf = `3. Kinerja Siklus: Efek refrigerasi q_e = ${result.refrigeratingEffectKjKg} kJ/kg, kerja kompresi w_c = ${result.workCompressionKjKg} kJ/kg, kapasitas pendinginan aktual = ${result.coolingCapacityKw} kW (${(result.coolingCapacityKw / 3.51685).toFixed(2)} TR / ${(result.coolingCapacityKw * 3412.14).toLocaleString('id-ID', { maximumFractionDigits: 0 })} BTU/h). ${isSubcoolingLow ? 'Catatan: Efek refrigerasi q_e tertekan rendah akibat tingginya entalpi cairan h3 yang tidak ter-subcooled dengan baik.' : ''}`;

    const flowPerf = `4. Laju Aliran & Efisiensi Energi: Laju aliran massa refrigeran = ${result.massFlowKgS} kg/s (${result.massFlowKgH} kg/jam), setara dengan laju volumetrik cairan ${result.massFlowLpm} LPM pada suhu ekspansi T3 (${result.liquidTempC}°C) dengan Vl = ${result.liquidSpecificVolumeDm3Kg} dm³/kg. COP Aktual = ${result.copActual} (Efisiensi Isentropik = ${(result.isentropicEfficiencyActual * 100).toFixed(1)}%). Energy Efficiency Ratio (EER) = ${result.eerBtuWh} Btu/(h·W) dengan predikat ${result.eerStarLabel}.`;

    const statusConclusion = isSystemNormal
      ? `STATUS KESELURUHAN: SISTEM BAGUS (NORMAL & EFISIEN). Unit ${result.refrigerant.name} beroperasi optimal dan memenuhi seluruh parameter standar pengujian termodinamika.`
      : `STATUS KESELURUHAN: SISTEM JELEK / ABNORMAL (Kinerja Rendah & Subcooling Kritis). Unit ${result.refrigerant.name} TIDAK BERFUNGSI OPTIMAL karena suhu cairan T3 (${result.liquidTempC}°C) terlampau tinggi dan subcooling (${result.subcoolingK.toFixed(1)} K) berada jauh di bawah standar, menyebabkan efisiensi COP anjlok ke ${result.copActual} (EER ${result.eerBtuWh} Btu/(h·W) / ${result.eerStarLabel}).

5. Rekomendasi Solusi & Tindakan Perbaikan Lapangan:
   a. Investigasi Pelepasan Kalor Kondenser: Suhu T3 yang sangat tinggi (${result.liquidTempC}°C) menandakan pelepasan panas di kondenser terganggu parah. Segera bersihkan sirip-sirip kondenser dari kotoran/debu, periksa putaran motor kipas kondenser, dan pastikan tidak ada sirkulasi udara balik (short-circuiting).
   b. Pemeriksaan Sight Glass & Muatan Freon: Amati kaca pengintip cairan (sight glass) sebelum katup ekspansi TXV. Jika terlihat gelembung uap terus-menerus dan subcooling mendekati 0 K, sistem kekurangan muatan freon (undercharge) sehingga cairan tidak tertampung di kondenser/receiver.
   c. Pengecekan Gas Non-Condensable: Periksa apakah tekanan discharge abnormal tinggi akibat udara/nitrogen terjebak di kondenser. Lakukan recovery freon dan vakum ulang sistem hingga < 500 mikron sebelum pengisian freon baru berbobot presisi.
   d. Insulasi Pipa Liquid Line: Pastikan pipa cairan tidak berada dekat dengan sumber panas mesin kompresor sebelum memasuki TXV.`;

    return `${shEvaluation}\n${scEvaluation}\n${cyclePerf}\n${flowPerf}\n${statusConclusion}`;
  };

  const activeConclusion = reportMeta.conclusion ?? getDefaultConclusion(activeLang);

  const [showAdminEditor, setShowAdminEditor] = useState<boolean>(false);

  // Resolved administrative values ensuring no empty fields and high accuracy
  const resolvedProductName = (reportMeta.productName && reportMeta.productName.trim())
    || `Trainer Refrigerasi Kompresi Uap ${result.refrigerant.name}`;
  const resolvedModelUnit = (reportMeta.modelUnit && reportMeta.modelUnit.trim())
    || `RTU-REF-${result.refrigerant.id}`;
  const resolvedWorkOrder = (reportMeta.workOrderNumber && reportMeta.workOrderNumber.trim())
    || 'WL-13095-01';
  const resolvedProject = (reportMeta.projectName && reportMeta.projectName.trim())
    || `Pengujian Siklus Refrigerasi & Diagram P-h (${result.refrigerant.name})`;
  const resolvedDate = (reportMeta.reportDate && reportMeta.reportDate.trim())
    || new Date().toISOString().split('T')[0];

  const waReportMessage = buildWhatsAppReportMessage({
    title: 'Laporan Resmi Siklus Refrigerasi & Log P-h',
    docNumber: `RTU-REF-PH-${resolvedWorkOrder}`,
    productName: resolvedProductName,
    modelUnit: resolvedModelUnit,
    workOrderNumber: resolvedWorkOrder,
    projectName: resolvedProject,
    date: resolvedDate,
    companyName: selectedLetterhead === 'labtech' ? LABTECH_BRANDING.companyName : (branding?.companyName || 'CV REFRIGERASI TEKNIK UTAMA'),
    sections: [
      {
        heading: 'Parameter Operasional Freon',
        items: [
          { label: 'Refrigerant', value: `${result.refrigerant.name} (${result.refrigerant.formula}) - Keselamatan: ${result.refrigerant.safetyClass}` },
          { label: 'Tekanan Suction (P1)', value: `${inputValues.suctionPressure} ${inputValues.suctionPressureUnit} (Tevap = ${result.teC.toFixed(1)}°C)` },
          { label: 'Tekanan Discharge (P2)', value: `${inputValues.dischargePressure} ${inputValues.dischargePressureUnit} (Tcond = ${result.tcC.toFixed(1)}°C)` },
          { label: 'Suhu Suction (T1)', value: `${inputValues.suctionTempC}°C` },
          { label: 'Suhu Discharge (T2)', value: `${inputValues.dischargeTempC}°C` },
          { label: 'Suhu Cairan Sebelum TXV (T3)', value: `${inputValues.liquidTempC}°C` },
          { label: 'Daya Kompresor', value: `${inputValues.compressorPower} ${inputValues.compressorPowerUnit}` },
        ],
      },
      {
        heading: 'Kinerja Termodinamika & Efisiensi Energi',
        items: [
          { label: 'Superheat', value: `+${result.superheatK.toFixed(1)} K` },
          { label: 'Subcooling', value: `+${result.subcoolingK.toFixed(1)} K` },
          { label: 'Kapasitas Pendinginan (Qe)', value: `${result.coolingCapacityKw} kW (${(result.coolingCapacityKw / 3.51685).toFixed(2)} TR / ${(result.coolingCapacityKw * 3412.14).toLocaleString('id-ID', { maximumFractionDigits: 0 })} BTU/h)` },
          { label: 'COP Aktual', value: `${result.copActual}` },
          { label: 'EER Star Rating', value: `${result.eerBtuWh} Btu/(h·W) (${result.eerStarLabel})` },
          { label: 'Laju Alir Massa Freon', value: `${result.massFlowKgS} kg/s (${result.massFlowKgH} kg/h / ${result.massFlowLpm} LPM)` },
          { label: 'Efisiensi Isentropik Kompresor', value: `${(result.isentropicEfficiencyActual * 100).toFixed(1)}%` },
        ],
      },
    ],
    directNotes: activeConclusion,
  });

  const handleAutoFillWithRef = () => {
    onUpdateReportMeta?.({
      ...reportMeta,
      productName: `Trainer Refrigerasi Kompresi Uap ${result.refrigerant.name}`,
      trainerName: `Trainer Refrigerasi Kompresi Uap ${result.refrigerant.name}`,
      modelUnit: `RTU-REF-${result.refrigerant.id}`,
      workOrderNumber: reportMeta.workOrderNumber || 'WL-13095-01',
      projectName: `Pengujian Siklus Refrigerasi & Diagram P-h (${result.refrigerant.name})`,
      reportDate: reportMeta.reportDate || new Date().toISOString().split('T')[0],
    });
  };

  const handleSetLabtechStandard = () => {
    onUpdateReportMeta?.({
      ...reportMeta,
      productName: `Trainer Refrigerasi Kompresi Uap ${result.refrigerant.name}`,
      trainerName: `Trainer Refrigerasi Kompresi Uap ${result.refrigerant.name}`,
      modelUnit: `LABTECH-RTU-${result.refrigerant.id}`,
      workOrderNumber: 'WL-13095-01',
      projectName: `Pengujian Kinerja Termal & Verifikasi Diagram Log P-h`,
      reportDate: new Date().toISOString().split('T')[0],
    });
  };

  if (!isOpen) return null;

  const handleDownloadReport = () => {
    const reportElem = document.getElementById('ph-printable-report');
    if (!reportElem) return;

    const fullHtml = `<!DOCTYPE html>
<html lang="${activeLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Siklus P-h - ${reportMeta.productName || reportMeta.trainerName || 'HVAC'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { 
      size: A4 portrait; 
      margin: 8mm 10mm; 
    }
    * { 
      box-sizing: border-box; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
    }
    body { 
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; 
      background: #f8fafc; 
      color: #0f172a; 
      margin: 0; 
      padding: 16px; 
      font-size: 10.5px; 
      line-height: 1.35; 
    }
    .no-print { display: none !important; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 4px; 
      margin-bottom: 6px; 
      page-break-inside: avoid; 
    }
    th, td { 
      border: 1px solid #94a3b8; 
      padding: 4.5px 6.5px; 
      font-size: 9.5px; 
      text-align: left; 
      vertical-align: middle; 
    }
    th { 
      background-color: #f1f5f9 !important; 
      font-weight: bold; 
      color: #0f172a; 
    }
    .page-section { 
      page-break-inside: avoid; 
      margin-bottom: 8px; 
    }
    svg { 
      max-width: 100%; 
      height: auto; 
      display: block; 
    }
    .floating-print-bar {
      position: sticky; 
      top: 0; 
      z-index: 100;
      background: linear-gradient(135deg, #0284c7, #0c4a6e);
      color: #ffffff; 
      padding: 14px 22px; 
      border-radius: 10px;
      margin-bottom: 20px; 
      display: flex; 
      align-items: center; 
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.3);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .floating-print-btn {
      background: #ffffff; 
      color: #0284c7; 
      padding: 9px 20px; 
      border: none;
      border-radius: 6px; 
      font-weight: 800; 
      font-size: 13px; 
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.18); 
      transition: all 0.2s;
      white-space: nowrap;
    }
    .floating-print-btn:hover { 
      background: #f0f9ff; 
      transform: translateY(-1px);
    }
    @media print {
      body { background: #ffffff !important; padding: 0 !important; }
      .floating-print-bar { display: none !important; }
      #print-content { max-width: 100% !important; padding: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="floating-print-bar no-print">
    <div>
      <div style="font-weight: 800; font-size: 15px; letter-spacing: -0.01em;">📄 Dokumen Laporan Siap Cetak / Simpan PDF (A4)</div>
      <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Klik tombol di kanan atau tekan Ctrl + P untuk menyimpan dokumen sebagai file PDF A4 berkualitas tinggi.</div>
    </div>
    <button class="floating-print-btn" onclick="window.print()">🖨️ Cetak / Simpan PDF (Ctrl + P)</button>
  </div>
  <div id="print-content" style="max-width: 960px; margin: 0 auto; background: #ffffff; padding: 12px; border-radius: 8px;">
    ${reportElem.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (reportMeta.productName || 'Laporan_HVAC_PH').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeTitle}_${reportMeta.workOrderNumber || 'Report'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPrintFeedback('File laporan HTML siap cetak/PDF berhasil diunduh!');
    setTimeout(() => setPrintFeedback(null), 4000);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Direct print blocked by sandbox, downloading file:', err);
      handleDownloadReport();
    }
  };

  const handleCopyTextReport = async () => {
    const companyHeader = branding
      ? `========================================================
${branding.companyName.toUpperCase()} (${branding.shortName})
${branding.tagline}
Alamat: ${branding.address}, ${branding.city}
Telp/WA: ${branding.phone} | Email: ${branding.email}
========================================================\n`
      : '';

    const text = `${companyHeader}${t.officialTestReport}
${t.officialStandard}

A. ${t.sectionA}:
Product Name        : ${reportMeta.productName || reportMeta.trainerName || '-'}
Model Unit          : ${reportMeta.modelUnit || '-'}
Work Order Number   : ${reportMeta.workOrderNumber || '-'}
Project             : ${reportMeta.projectName || '-'}
Date of Report      : ${reportMeta.reportDate || '-'}
Refrigerant         : ${result.refrigerant.name} (${result.refrigerant.formula}) - ${result.refrigerant.safetyClass}

========================================================
B. ${t.sectionB}:
- Suction Pressure        : ${inputValues.suctionPressure} ${inputValues.suctionPressureUnit} (T_sat: ${result.teC} °C)
- Discharge Pressure      : ${inputValues.dischargePressure} ${inputValues.dischargePressureUnit} (T_sat: ${result.tcC} °C)
- Suction Temp (T1)       : ${inputValues.suctionTempC} °C (Superheat: +${result.superheatK} K)
- Discharge Temp (T2)     : ${inputValues.dischargeTempC} °C (Discharge Superheat: +${result.dischargeSuperheatK} K)
- Liquid Temp TXV (T3)    : ${inputValues.liquidTempC} °C (Subcooling: ${result.subcoolingK.toFixed(1)} K${result.subcoolingK < 3 ? ' - ABNORMAL RENDAH' : ' - NORMAL'})
- Compressor Power        : ${inputValues.compressorPower} ${inputValues.compressorPowerUnit} (${result.compressorPowerKw} kW / ${result.compressorPowerHp} HP)
- Pressure Ratio          : ${result.pressureRatio} : 1

========================================================
D. ${t.sectionD}:
- Point 1 (Suction)       : P=${result.state1.pressureBar} bar | h=${result.state1.enthalpyKjKg} kJ/kg | T=${result.state1.tempC} °C | s=${result.state1.entropyKjKgK} | v=${result.state1.specificVolumeM3Kg} m³/kg
- Point 2 (Discharge)     : P=${result.state2.pressureBar} bar | h=${result.state2.enthalpyKjKg} kJ/kg | T=${result.state2.tempC} °C | s=${result.state2.entropyKjKgK} | v=${result.state2.specificVolumeM3Kg} m³/kg
- Point 3 (TXV Inlet)     : P=${result.state3.pressureBar} bar | h=${result.state3.enthalpyKjKg} kJ/kg | T=${result.state3.tempC} °C | Vl=${result.liquidSpecificVolumeDm3Kg} dm³/kg (Perpotongan P_dis ∩ T3)
- Point 4 (Evap Inlet)    : P=${result.state4.pressureBar} bar | h=${result.state4.enthalpyKjKg} kJ/kg | T=${result.state4.tempC} °C | x=${(result.vaporQualityInletEvap * 100).toFixed(1)}%

========================================================
E. ${t.sectionE}:
- Refrigerating Effect (q_e) : ${result.refrigeratingEffectKjKg} kJ/kg
- Compression Work (w_c)     : ${result.workCompressionKjKg} kJ/kg
- Heat Rejection (q_c)       : ${result.heatRejectionKjKg} kJ/kg
- Mass Flow Rate             : ${result.massFlowKgS} kg/s (${result.massFlowKgH} kg/h)
- Liquid Volume at T3 (Vl)   : ${result.liquidSpecificVolumeDm3Kg} dm³/kg
- Volumetric Flow (LPM)      : ${result.massFlowLpm} LPM (Rumus: kg/s x dm³/kg x 60)
- Cooling Capacity (Qe)      : ${result.coolingCapacityKw} kW (${(result.coolingCapacityKw / 3.51685).toFixed(2)} TR / ${(result.coolingCapacityKw * 3412.14).toLocaleString('id-ID', { maximumFractionDigits: 0 })} BTU/h)
- Compressor Power           : ${result.compressorPowerKw} kW (${result.compressorPowerHp} HP)
- Total Condenser Heat (Qc)  : ${result.heatRejectedCondenserKw} kW
- Actual COP                 : ${result.copActual}
- Theoretical Carnot COP     : ${result.copCarnot}
- Energy Efficiency Ratio    : ${result.eerBtuWh} Btu/(h·W) (${result.eerStarLabel})
- Compressor Isentropic Eff. : ${(result.isentropicEfficiencyActual * 100).toFixed(1)} %

========================================================
${t.conclusionTitle}:
${activeConclusion}

========================================================
${t.approvalTitle}:
       [ ${t.checkColumn} ]                 [ ${t.reviewColumn} ]                [ ${t.approvedColumn} ]
(                         ) (                         ) (                         )
${t.signatureDate}: .................  ${t.signatureDate}: .................  ${t.signatureDate}: .................
Tanggal Cetak: ${new Date().toLocaleString()}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="ph-modal-portal fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Print Specific CSS Rules */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Do NOT hide #root; only hide sibling elements outside modal portal */
          #root > *:not(:has(#ph-printable-report)):not(#ph-printable-report) {
            display: none !important;
          }
          .no-print, nav, header {
            display: none !important;
          }
          .ph-modal-portal {
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            inset: auto !important;
          }
          .ph-modal-card {
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #ph-printable-report {
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 4mm 6mm !important;
            margin: 0 !important;
            width: 100% !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            page-break-inside: avoid !important;
          }
          th, td {
            border: 1px solid #94a3b8 !important;
            padding: 4px 6px !important;
            font-size: 9.5px !important;
            color: #0f172a !important;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
          }
        }
      `}} />

      <div className="ph-modal-card bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-5xl w-full max-h-[94vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:w-full">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              {t.officialTestReport}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language Switcher in Modal */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded p-0.5 text-xs font-mono">
              {SUPPORTED_LANGUAGES.map((langOpt) => (
                <button
                  key={langOpt.code}
                  onClick={() => setLang(langOpt.code)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                    activeLang === langOpt.code
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={langOpt.nativeName}
                >
                  <span>{langOpt.flag}</span>
                  <span className="uppercase">{langOpt.code}</span>
                </button>
              ))}
            </div>

            {/* DUA PILIHAN KOP SURAT */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 pl-1">Kop:</span>
              <button
                type="button"
                onClick={() => setSelectedLetterhead('current')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  selectedLetterhead === 'current'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {branding?.shortName || 'RTU'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedLetterhead('labtech')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  selectedLetterhead === 'labtech'
                    ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>PT LABTECH</span>
              </button>
            </div>

            <button
              onClick={() => setShowAdminEditor(!showAdminEditor)}
              className={`px-3 py-1.5 text-xs font-mono rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showAdminEditor
                  ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-400'
                  : 'bg-slate-800 text-cyan-300 hover:text-white hover:bg-slate-700 border border-cyan-800/60'
              }`}
              title="Buka/Tutup Form Edit Data Administrasi & Nomor Surat"
            >
              <span>📋</span>
              <span>{showAdminEditor ? 'Tutup Edit Administrasi' : 'Edit Identitas Laporan'}</span>
            </button>
            <button
              onClick={handleCopyTextReport}
              className={`px-3 py-1.5 text-xs font-mono rounded font-medium transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {copied ? `${t.copiedSuccess}` : t.copyTextReport}
            </button>
            <button
              onClick={handleDownloadReport}
              className="px-3.5 py-1.5 text-xs font-mono font-medium rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-800/60 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Unduh HTML / PDF
            </button>
            <button
              type="button"
              onClick={() => setIsWaModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-mono font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
              title="Bagikan ringkasan laporan resmi ini langsung ke WhatsApp"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Share ke WA</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-mono font-bold rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t.printOfficialReport}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Interactive Administration Editor (Hidden on print) */}
        {showAdminEditor && (
          <div className="no-print bg-slate-950 border-b border-slate-800 p-4 sm:p-5 text-xs font-mono space-y-3 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="font-bold text-white uppercase tracking-wider">
                  Pengaturan Informasi Administrasi &amp; Identitas Pengujian
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFillWithRef}
                  className="px-2.5 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  🔄 Sesuaikan dgn {result.refrigerant.name}
                </button>
                <button
                  type="button"
                  onClick={handleSetLabtechStandard}
                  className="px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  ✨ Standar Labtech (WL-13095-01)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] text-cyan-400 font-semibold block mb-1">
                  1. Product Name:
                </label>
                <input
                  type="text"
                  value={reportMeta.productName ?? ''}
                  onChange={(e) =>
                    onUpdateReportMeta?.({
                      ...reportMeta,
                      productName: e.target.value,
                      trainerName: e.target.value,
                    })
                  }
                  placeholder={`Trainer Refrigerasi ${result.refrigerant.name}...`}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-2.5 py-1.5 text-xs text-white outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  2. Model Unit:
                </label>
                <input
                  type="text"
                  value={reportMeta.modelUnit ?? ''}
                  onChange={(e) =>
                    onUpdateReportMeta?.({
                      ...reportMeta,
                      modelUnit: e.target.value,
                    })
                  }
                  placeholder="Contoh: RTU-REF-32X..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-2.5 py-1.5 text-xs text-white outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] text-blue-400 font-semibold block mb-1">
                  3. Work Order Number:
                </label>
                <input
                  type="text"
                  value={reportMeta.workOrderNumber ?? ''}
                  onChange={(e) =>
                    onUpdateReportMeta?.({
                      ...reportMeta,
                      workOrderNumber: e.target.value,
                    })
                  }
                  placeholder="Contoh: WL-13095-01..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-400 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  4. Project:
                </label>
                <input
                  type="text"
                  value={reportMeta.projectName ?? ''}
                  onChange={(e) =>
                    onUpdateReportMeta?.({
                      ...reportMeta,
                      projectName: e.target.value,
                    })
                  }
                  placeholder="Nama Proyek / Uji..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-2.5 py-1.5 text-xs text-white outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  5. Date of Report:
                </label>
                <input
                  type="date"
                  value={reportMeta.reportDate ?? ''}
                  onChange={(e) =>
                    onUpdateReportMeta?.({
                      ...reportMeta,
                      reportDate: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-2.5 py-1.5 text-xs text-white outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {printFeedback && (
          <div className="no-print bg-cyan-950/90 border-b border-cyan-700/60 text-cyan-200 px-5 py-2.5 text-xs font-mono flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 text-sm">ℹ️</span>
              <span>{printFeedback}</span>
            </div>
            <button onClick={() => setPrintFeedback(null)} className="text-cyan-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-cyan-900 cursor-pointer">✕</button>
          </div>
        )}

        {/* Printable Document Content (Strict Table Layouts on Professional High-Contrast White Sheet) */}
        <div
          id="ph-printable-report"
          className="p-6 sm:p-8 space-y-6 bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-xl print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none max-w-4xl mx-auto font-sans"
        >
          {/* 1. Executive Vector Wave Header & Kop Surat Resmi */}
          <ReportVectorHeader
            selectedLetterhead={selectedLetterhead}
            branding={branding}
            documentTitle={t.officialTestReport}
            documentSubtitle={`${t.officialStandard} • ASHRAE 15 / 34 • ISO 5149 • C.P. ARORA`}
            refrigerantName={`${result.refrigerant.name} (${result.refrigerant.formula}) - Safety: ${result.refrigerant.safetyClass}`}
            docNumber={`RTU-REF-PH-${resolvedWorkOrder}`}
            standardCode="ASHRAE 15/34 & ISO 5149"
          />

          {/* 2. TABEL INFORMASI ADMINISTRASI & IDENTITAS PENGUJIAN */}
          <div className="page-section">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800 mb-2">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-900">
                {t.sectionA}
              </span>
              <span className="text-[10px] font-mono text-slate-600 font-bold">
                DOC NO: RTU-REF-PH-01
              </span>
            </div>
            
            <table className="w-full text-xs font-mono border-collapse border border-slate-400">
              <tbody>
                <tr>
                  <td className="w-1/4 font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    1. {t.productName}
                  </td>
                  <td className="w-1/4 font-extrabold text-slate-950 bg-white border border-slate-300 p-2">
                    {resolvedProductName}
                  </td>
                  <td className="w-1/4 font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    2. {t.modelUnit}
                  </td>
                  <td className="w-1/4 font-extrabold text-slate-950 bg-white border border-slate-300 p-2">
                    {resolvedModelUnit}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    3. {t.workOrderNumber}
                  </td>
                  <td className="font-extrabold text-blue-900 bg-white border border-slate-300 p-2 font-mono">
                    {resolvedWorkOrder}
                  </td>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    4. {t.projectName}
                  </td>
                  <td className="font-extrabold text-slate-950 bg-white border border-slate-300 p-2">
                    {resolvedProject}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    5. {t.dateOfReport}
                  </td>
                  <td className="font-bold text-slate-950 bg-white border border-slate-300 p-2 font-mono">
                    {resolvedDate}
                  </td>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    6. Refrigerant Digunakan
                  </td>
                  <td className="font-extrabold text-emerald-900 bg-white border border-slate-300 p-2 font-mono">
                    {result.refrigerant.name} ({result.refrigerant.formula}) &ndash; {result.refrigerant.safetyClass}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. TABEL PARAMETER INPUT PENGUKURAN OPERASIONAL LAPANGAN */}
          <div className="page-section">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800 mb-2">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-900">
                {t.sectionB}
              </span>
              <span className="text-[10px] font-mono text-slate-600 font-bold">
                TEKANAN &amp; SUHU TERUKUR
              </span>
            </div>

            <table className="w-full text-xs font-mono border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="py-2 px-2.5 border border-slate-300 text-center">No</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">Parameter Pengukuran</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">Nilai Terukur (Input)</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">Konversi Bar / Satuan</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">Suhu Jenuh (T_sat)</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">Kondisi Superheat / Subcooling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">1</td>
                  <td className="font-semibold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.suctionPressure}</td>
                  <td className="font-extrabold text-blue-900 border border-slate-300 py-1.5 px-2.5">{inputValues.suctionPressure} {inputValues.suctionPressureUnit}</td>
                  <td className="text-slate-800 font-medium border border-slate-300 py-1.5 px-2.5">{result.peBar} bar</td>
                  <td className="font-bold text-slate-950 border border-slate-300 py-1.5 px-2.5">Te = {result.teC} °C</td>
                  <td className="text-slate-700 font-medium border border-slate-300 py-1.5 px-2.5">Titik Didih Evaporasi</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">2</td>
                  <td className="font-semibold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.dischargePressure}</td>
                  <td className="font-extrabold text-amber-900 border border-slate-300 py-1.5 px-2.5">{inputValues.dischargePressure} {inputValues.dischargePressureUnit}</td>
                  <td className="text-slate-800 font-medium border border-slate-300 py-1.5 px-2.5">{result.pcBar} bar</td>
                  <td className="font-bold text-slate-950 border border-slate-300 py-1.5 px-2.5">Tc = {result.tcC} °C</td>
                  <td className="text-slate-700 font-medium border border-slate-300 py-1.5 px-2.5">Titik Embun Kondensasi</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">3</td>
                  <td className="font-semibold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.suctionTemp} (T1)</td>
                  <td className="font-extrabold text-blue-900 border border-slate-300 py-1.5 px-2.5">{inputValues.suctionTempC} °C</td>
                  <td className="text-slate-800 font-medium border border-slate-300 py-1.5 px-2.5">T1 = {result.suctionTempC} °C</td>
                  <td className="text-slate-800 font-medium border border-slate-300 py-1.5 px-2.5">Te = {result.teC} °C</td>
                  <td className="font-extrabold text-teal-800 border border-slate-300 py-1.5 px-2.5">+{result.superheatK} K ({t.superheatDegree})</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">4</td>
                  <td className="font-semibold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.dischargeTemp} (T2)</td>
                  <td className="font-extrabold text-amber-900 border border-slate-300 py-1.5 px-2.5">{inputValues.dischargeTempC} °C</td>
                  <td className="text-slate-800 font-medium border border-slate-300 py-1.5 px-2.5">T2 = {result.dischargeTempC} °C</td>
                  <td className="text-slate-800 font-medium border border-slate-300 py-1.5 px-2.5">Tc = {result.tcC} °C</td>
                  <td className="font-extrabold text-amber-800 border border-slate-300 py-1.5 px-2.5">+{result.dischargeSuperheatK} K ({t.dischargeSuperheatDegree})</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">5</td>
                  <td className="font-semibold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.liquidTempTXV} (T3)</td>
                  <td className="font-extrabold text-emerald-900 border border-slate-300 py-1.5 px-2.5">{inputValues.liquidTempC} °C</td>
                  <td className="text-slate-800 font-medium border border-slate-300 py-1.5 px-2.5">T3 = {result.liquidTempC} °C</td>
                  <td className="text-slate-800 font-medium border border-slate-300 py-1.5 px-2.5">Tc = {result.tcC} °C</td>
                  <td className={`font-extrabold border border-slate-300 py-1.5 px-2.5 ${result.subcoolingK >= 3 ? 'text-emerald-800' : 'text-rose-700 bg-rose-50'}`}>
                    {result.subcoolingK.toFixed(1)} K {result.subcoolingK < 3 ? '(ABNORMAL RENDAH)' : `(${t.subcoolingDegree})`}
                  </td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">6</td>
                  <td className="font-semibold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.compressorPower}</td>
                  <td className="font-extrabold text-purple-900 border border-slate-300 py-1.5 px-2.5">{inputValues.compressorPower} {inputValues.compressorPowerUnit}</td>
                  <td className="text-slate-800 font-medium border border-slate-300 py-1.5 px-2.5">{result.compressorPowerKw} kW</td>
                  <td className="text-slate-800 font-medium border border-slate-300 py-1.5 px-2.5">{result.compressorPowerHp} HP</td>
                  <td className="text-slate-700 font-medium border border-slate-300 py-1.5 px-2.5">Rasio Kompresi = {result.pressureRatio} : 1</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. TABEL 4 TITIK KEADAAN TERMODINAMIKA SIKLUS (POINTS 1 - 4) */}
          <div className="page-section">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800 mb-2">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-900">
                {t.sectionD}
              </span>
              <span className="text-[10px] font-mono text-sky-900 font-bold">
                PERPOTONGAN GARIS DISCHARGE PRESSURE (P_DIS) DAN ISOTERMA SUHU LIQUID TXV (T3)
              </span>
            </div>

            <table className="w-full text-xs font-mono border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="py-2 px-2 border border-slate-300 text-center">{t.tableColPoint}</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">{t.tableColPosition}</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">{t.tableColPressure}</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left bg-slate-200/80">{t.tableColEnthalpy}</th>
                  <th className="py-2 px-2 border border-slate-300 text-left">{t.tableColTemp}</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">{t.tableColSpecVol}</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">{t.tableColEntropy}</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">{t.tableColPhase}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {[result.state1, result.state2, result.state3, result.state4].map((pt) => (
                  <tr key={pt.index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 font-black text-amber-900 text-center border border-slate-300">
                      [{pt.index}]
                    </td>
                    <td className="py-2 px-2.5 font-bold text-slate-900 border border-slate-300">
                      {pt.label}
                    </td>
                    <td className="py-2 px-2.5 text-blue-900 font-bold tabular-nums border border-slate-300">
                      {pt.pressureBar} bar ({pt.pressureKPa} kPa)
                    </td>
                    <td className="py-2 px-2.5 text-slate-950 font-black tabular-nums border border-slate-300 bg-amber-50/50">
                      {pt.enthalpyKjKg} kJ/kg
                    </td>
                    <td className="py-2 px-2 text-slate-900 font-semibold tabular-nums border border-slate-300">
                      {pt.tempC} °C
                    </td>
                    <td className="py-2 px-2.5 text-emerald-900 font-bold tabular-nums border border-slate-300">
                      {pt.index === 3
                        ? `${pt.specificVolumeDm3Kg} dm³/kg (${pt.specificVolumeM3Kg} m³/kg)`
                        : `${pt.specificVolumeM3Kg ?? '-'} m³/kg`}
                    </td>
                    <td className="py-2 px-2.5 text-indigo-900 font-bold tabular-nums border border-slate-300">
                      {pt.entropyKjKgK ?? '-'} kJ/kg·K
                    </td>
                    <td className="py-2 px-2.5 text-slate-800 font-medium border border-slate-300">
                      {pt.phase}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. TABEL HASIL ANALISIS KINERJA SIKLUS & EFISIENSI ENERGI (TERMASUK LPM & EER) */}
          <div className="page-section">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800 mb-2">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-900">
                {t.sectionE}
              </span>
              <span className="text-[10px] font-mono text-slate-600 font-bold">
                RUMUS: (KG/S × DM³/KG × 60) | VL DARI TABEL SATURASI SUHU T3
              </span>
            </div>

            <table className="w-full text-xs font-mono border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="py-2 px-2.5 border border-slate-300 text-center">No</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">Indikator Kinerja Sistem</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">Simbol / Rumus</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">Nilai Hasil Perhitungan</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-left">Keterangan / Evaluasi Standar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">1</td>
                  <td className="font-bold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.refrigeratingEffect}</td>
                  <td className="font-mono text-slate-700 border border-slate-300 py-1.5 px-2.5">q_e = h1 - h4</td>
                  <td className="font-extrabold text-blue-900 border border-slate-300 py-1.5 px-2.5 tabular-nums">{result.refrigeratingEffectKjKg} kJ/kg</td>
                  <td className="text-slate-700 border border-slate-300 py-1.5 px-2.5">Kemampuan penyerapan kalor di evaporator</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">2</td>
                  <td className="font-bold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.compressionWork}</td>
                  <td className="font-mono text-slate-700 border border-slate-300 py-1.5 px-2.5">w_c = h2 - h1</td>
                  <td className="font-extrabold text-amber-900 border border-slate-300 py-1.5 px-2.5 tabular-nums">{result.workCompressionKjKg} kJ/kg</td>
                  <td className="text-slate-700 border border-slate-300 py-1.5 px-2.5">Kerja kompresor per kg refrigeran</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">3</td>
                  <td className="font-bold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.heatRejection}</td>
                  <td className="font-mono text-slate-700 border border-slate-300 py-1.5 px-2.5">q_c = h2 - h3</td>
                  <td className="font-extrabold text-rose-800 border border-slate-300 py-1.5 px-2.5 tabular-nums">{result.heatRejectionKjKg} kJ/kg</td>
                  <td className="text-slate-700 border border-slate-300 py-1.5 px-2.5">Kalor yang dilepas pada kondensor</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">4</td>
                  <td className="font-bold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.massFlowKgS} &amp; kg/h</td>
                  <td className="font-mono text-slate-700 border border-slate-300 py-1.5 px-2.5">m_dot = P_comp / w_c</td>
                  <td className="font-black text-slate-950 border border-slate-300 py-1.5 px-2.5 tabular-nums">{result.massFlowKgS} kg/s ({result.massFlowKgH} kg/jam)</td>
                  <td className="text-slate-700 border border-slate-300 py-1.5 px-2.5">Laju aliran massa siklus sirkulasi</td>
                </tr>
                <tr className="bg-emerald-50/70">
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">5</td>
                  <td className="font-extrabold text-emerald-950 border border-slate-300 py-1.5 px-2.5">{t.liquidFlowLpm}</td>
                  <td className="font-mono font-semibold text-emerald-800 border border-slate-300 py-1.5 px-2.5">(kg/s × dm³/kg × 60)</td>
                  <td className="font-black text-emerald-950 text-sm border border-slate-300 py-1.5 px-2.5 tabular-nums">{result.massFlowLpm} LPM</td>
                  <td className="text-slate-800 border border-slate-300 py-1.5 px-2.5">
                    Vl = <strong className="text-slate-950">{result.liquidSpecificVolumeDm3Kg} dm³/kg</strong> (Saturasi T3 = {result.liquidTempC}°C)
                  </td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">6</td>
                  <td className="font-bold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.coolingCapacity}</td>
                  <td className="font-mono text-slate-700 border border-slate-300 py-1.5 px-2.5">Q_e = m_dot × q_e</td>
                  <td className="font-extrabold text-blue-900 border border-slate-300 py-1.5 px-2.5 tabular-nums">
                    {result.coolingCapacityKw} kW ({(result.coolingCapacityKw / 3.51685).toFixed(2)} TR)
                  </td>
                  <td className="text-slate-800 font-medium border border-slate-300 py-1.5 px-2.5">{(result.coolingCapacityKw * 3412.14).toLocaleString('id-ID', { maximumFractionDigits: 0 })} BTU/h</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">7</td>
                  <td className="font-bold text-slate-900 border border-slate-300 py-1.5 px-2.5">Daya Kompresor Aktual</td>
                  <td className="font-mono text-slate-700 border border-slate-300 py-1.5 px-2.5">P_comp = m_dot × w_c</td>
                  <td className="font-extrabold text-purple-900 border border-slate-300 py-1.5 px-2.5 tabular-nums">{result.compressorPowerKw} kW ({result.compressorPowerHp} HP)</td>
                  <td className="text-slate-700 border border-slate-300 py-1.5 px-2.5">Daya mekanik/listrik kompresor</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">8</td>
                  <td className="font-bold text-slate-900 border border-slate-300 py-1.5 px-2.5">Total Kalor Dibuang Kondensor (Qc)</td>
                  <td className="font-mono text-slate-700 border border-slate-300 py-1.5 px-2.5">Q_c = Q_e + P_comp</td>
                  <td className="font-extrabold text-amber-900 border border-slate-300 py-1.5 px-2.5 tabular-nums">{result.heatRejectedCondenserKw} kW</td>
                  <td className="text-slate-700 border border-slate-300 py-1.5 px-2.5">Total beban penolakan panas kondensor</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">9</td>
                  <td className="font-bold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.copActual}</td>
                  <td className="font-mono text-slate-700 border border-slate-300 py-1.5 px-2.5">COP = Q_e / P_comp</td>
                  <td className="font-black text-slate-950 text-sm border border-slate-300 py-1.5 px-2.5 tabular-nums">{result.copActual}</td>
                  <td className="text-slate-700 border border-slate-300 py-1.5 px-2.5">Koefisien Kinerja Aktual</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">10</td>
                  <td className="font-bold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.copCarnot}</td>
                  <td className="font-mono text-slate-700 border border-slate-300 py-1.5 px-2.5">COP_c = Te / (Tc - Te)</td>
                  <td className="font-bold text-slate-800 border border-slate-300 py-1.5 px-2.5 tabular-nums">{result.copCarnot}</td>
                  <td className="text-slate-700 border border-slate-300 py-1.5 px-2.5">Efisiensi Hukum II (Eksergi) = {result.secondLawEfficiencyPercent} %</td>
                </tr>
                <tr className="bg-amber-50/70">
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">11</td>
                  <td className="font-extrabold text-amber-950 border border-slate-300 py-1.5 px-2.5">{t.eerTitle}</td>
                  <td className="font-mono font-semibold text-amber-800 border border-slate-300 py-1.5 px-2.5">EER = COP × 3.41214</td>
                  <td className="font-black text-amber-950 text-sm border border-slate-300 py-1.5 px-2.5 tabular-nums">{result.eerBtuWh} Btu/(h·W)</td>
                  <td className="font-extrabold text-amber-900 border border-slate-300 py-1.5 px-2.5">{result.eerStarLabel}</td>
                </tr>
                <tr>
                  <td className="text-center font-bold text-slate-900 border border-slate-300 py-1.5 px-2">12</td>
                  <td className="font-bold text-slate-900 border border-slate-300 py-1.5 px-2.5">{t.isentropicEfficiency}</td>
                  <td className="font-mono text-slate-700 border border-slate-300 py-1.5 px-2.5">eta_isen = w_isen / w_actual</td>
                  <td className="font-extrabold text-emerald-900 border border-slate-300 py-1.5 px-2.5 tabular-nums">{(result.isentropicEfficiencyActual * 100).toFixed(1)} %</td>
                  <td className="text-slate-700 border border-slate-300 py-1.5 px-2.5">Rasio Tekanan: {result.pressureRatio} : 1</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. GRAFIK DIAGRAM LOG P - h BESERTA TITIK SIKLUS (1-2-3-4) */}
          <div className="page-section border border-slate-400 rounded-lg p-3 bg-white space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-300">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-900">
                {t.sectionC}
              </span>
              <span className="text-[10px] font-mono text-slate-600 font-semibold">
                Garis Isentropik (s), Isokhorik (v), Isoterma (T), dan Titik 3 (P_dis ∩ T3)
              </span>
            </div>
            <PhDiagramCanvas result={result} isPrintView={true} showPointBadges={true} language={activeLang} />
          </div>

          {/* 7. KESIMPULAN PENGUJIAN & EVALUASI TERMAL (DAPAT DIEDIT LANGSUNG) */}
          <div className="page-section bg-slate-50 border border-slate-400 rounded-lg p-3.5 space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between border-b border-slate-300 pb-1.5 flex-wrap gap-2">
              <span className="font-extrabold">{t.conclusionTitle}</span>
              <div className="no-print flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateReportMeta?.({
                      ...reportMeta,
                      conclusion: undefined,
                    });
                  }}
                  className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 transition-colors cursor-pointer"
                  title="Sinkronkan teks evaluasi otomatis berdasarkan data pengukuran terbaru"
                >
                  ↺ Sinkronkan Diagnosa Otomatis
                </button>
                <span className="text-[10px] text-slate-500 font-normal">
                  {t.conclusionEditNotice}
                </span>
              </div>
            </div>

            {/* Interactive textarea for instant on-screen edit */}
            <div className="no-print">
              <textarea
                value={activeConclusion}
                onChange={(e) => {
                  onUpdateReportMeta?.({
                    ...reportMeta,
                    conclusion: e.target.value,
                  });
                }}
                rows={7}
                className="w-full bg-white border border-slate-400 focus:border-blue-600 rounded p-2.5 text-xs text-slate-900 font-mono leading-relaxed outline-hidden resize-y shadow-inner"
                placeholder="Tuliskan catatan teknis dan kesimpulan pengujian di sini..."
              />
            </div>

            {/* Print version: clean crisp paragraph */}
            <div className="hidden print:block text-[10px] font-mono text-slate-900 leading-relaxed whitespace-pre-line p-2 bg-white border border-slate-300 rounded">
              {activeConclusion}
            </div>
          </div>

          {/* 8. PENGESAHAN LAPORAN (CHECK, REVIEW, APPROVED) */}
          <div className="page-section pt-3 border-t-2 border-slate-800 print:border-black">
            <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-900 mb-2.5 text-center">
              {t.approvalTitle}
            </div>
            <table className="w-full text-center text-xs font-mono border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="py-2 w-1/3 text-center border border-slate-300">{t.checkColumn}</th>
                  <th className="py-2 w-1/3 text-center border border-slate-300">{t.reviewColumn}</th>
                  <th className="py-2 w-1/3 text-center border border-slate-300">{t.approvedColumn}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-8 align-bottom border border-slate-300 bg-white">
                    <div className="font-bold text-slate-950 border-b-2 border-slate-900 pb-1 inline-block min-w-[160px]">
                      (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                    </div>
                    <div className="text-[10px] text-slate-700 font-semibold mt-1">{t.signatureDate}: ....................</div>
                  </td>
                  <td className="py-8 align-bottom border border-slate-300 bg-white">
                    <div className="font-bold text-slate-950 border-b-2 border-slate-900 pb-1 inline-block min-w-[160px]">
                      (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                    </div>
                    <div className="text-[10px] text-slate-700 font-semibold mt-1">{t.signatureDate}: ....................</div>
                  </td>
                  <td className="py-8 align-bottom border border-slate-300 bg-white">
                    <div className="font-bold text-slate-950 border-b-2 border-slate-900 pb-1 inline-block min-w-[160px]">
                      (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                    </div>
                    <div className="text-[10px] text-slate-700 font-semibold mt-1">{t.signatureDate}: ....................</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        reportTitle={`Laporan Siklus P-h - ${resolvedProductName}`}
        messageText={waReportMessage}
      />
    </div>
  );
};
