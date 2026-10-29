import React, { useState } from 'react';
import { CompanyBranding, LABTECH_BRANDING } from '../types/branding';
import {
  ChillerTestInputs,
  ChillerTestResults,
  CoolingTowerTestInputs,
  CoolingTowerTestResults,
  AhuTestInputs,
  AhuTestResults,
  IntegratedPlantResults,
} from '../types/plantTesting';
import { AppLanguage, TRANSLATIONS } from '../utils/i18n';
import { LabtechLogo } from './LabtechLogo';
import { ReportVectorHeader } from './ReportVectorHeader';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { buildWhatsAppReportMessage } from '../utils/whatsappShare';

interface PlantTestingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: CompanyBranding;
  chillerInputs: ChillerTestInputs;
  chillerResults: ChillerTestResults;
  ctInputs: CoolingTowerTestInputs;
  ctResults: CoolingTowerTestResults;
  ahuInputs: AhuTestInputs;
  ahuResults: AhuTestResults;
  integrated: IntegratedPlantResults;
  language?: AppLanguage;
}

export const PlantTestingReportModal: React.FC<PlantTestingReportModalProps> = ({
  isOpen,
  onClose,
  branding,
  chillerInputs,
  chillerResults,
  ctInputs,
  ctResults,
  ahuInputs,
  ahuResults,
  integrated,
  language = 'id',
}) => {
  const [selectedLetterhead, setSelectedLetterhead] = useState<'current' | 'labtech'>('labtech');
  const [reportNumber, setReportNumber] = useState<string>(
    () => `BA-HVAC-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [projectName, setProjectName] = useState<string>('Gedung Menara Mandiri / Central Chiller Plant');
  const [clientName, setClientName] = useState<string>('PT. Pengelola Gedung Prima');
  const [testLocation, setTestLocation] = useState<string>('Ruang Mesin Chiller Basement-1');
  const [testDate, setTestDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [leadTester, setLeadTester] = useState<string>('Ir. Rustandi, IPM., ASEAN Eng.');
  const [inspectorName, setInspectorName] = useState<string>('Budi Santoso, S.T. (Building Operations Mgr)');
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeBrand = selectedLetterhead === 'labtech' ? LABTECH_BRANDING : branding;

  const waReportMessage = buildWhatsAppReportMessage({
    title: 'Berita Acara & Laporan Pengujian Performa HVAC Plant',
    docNumber: reportNumber,
    productName: 'Central Chiller Plant & AHU Integrated System',
    projectName: projectName,
    date: testDate,
    companyName: activeBrand.companyName,
    sections: [
      {
        heading: 'Hasil Pengujian Water-Cooled Chiller',
        items: [
          { label: 'Kapasitas Pendinginan', value: `${chillerResults.evapCapacityKW.toFixed(1)} kW (${chillerResults.evapCapacityTR.toFixed(1)} TR)` },
          { label: 'Daya Listrik Input', value: `${chillerResults.totalPowerInputKW.toFixed(1)} kW` },
          { label: 'COP Chiller', value: `${chillerResults.copActual.toFixed(2)}` },
          { label: 'Efisiensi kW/TR', value: `${chillerResults.specificPowerKWPerTR.toFixed(3)} kW/TR (Rating: ${chillerResults.efficiencyRating})` },
          { label: 'Temperatur CHW (In/Out)', value: `${chillerInputs.chwInletTempC}°C / ${chillerInputs.chwOutletTempC}°C (ΔT = ${chillerResults.chwDeltaTC.toFixed(1)}°C)` },
        ],
      },
      {
        heading: 'Hasil Pengujian Cooling Tower',
        items: [
          { label: 'Beban Buang Kalor', value: `${ctResults.heatRejectedKW.toFixed(1)} kW` },
          { label: 'Range / Approach', value: `${ctResults.rangeC.toFixed(1)}°C / ${ctResults.approachC.toFixed(1)}°C` },
          { label: 'Efisiensi CT (Efektivitas)', value: `${ctResults.effectivenessPercent.toFixed(1)}% (${ctResults.healthVerdict})` },
        ],
      },
      {
        heading: 'Hasil Pengujian Air Handling Unit (AHU)',
        items: [
          { label: 'Total Kapasitas Termal AHU', value: `${ahuResults.airsideTotalCapacityKW.toFixed(1)} kW (${ahuResults.airsideTotalCapacityTR.toFixed(1)} TR)` },
          { label: 'Debit Udara Aktual', value: `${ahuInputs.measuredAirflowCfm.toLocaleString('id-ID')} CFM` },
          { label: 'Sensible Heat Ratio (SHR)', value: `${ahuResults.sensibleHeatRatio.toFixed(2)}` },
        ],
      },
      {
        heading: 'Kinerja Menyeluruh (Plant Wire-to-Air)',
        items: [
          { label: 'Total Konsumsi Daya Plant', value: `${integrated.totalPlantPowerKW.toFixed(1)} kW` },
          { label: 'Overall Plant Efficiency', value: `${integrated.overallPlantKWPerTR.toFixed(3)} kW/TR` },
          { label: 'Rating Evaluasi Sistem', value: `Rating: ${integrated.plantRating.toUpperCase()}` },
        ],
      },
    ],
    directNotes: `Pengujian diselesaikan pada lokasi ${testLocation} oleh Lead Tester ${leadTester} dan diverifikasi oleh ${inspectorName}.`,
  });

  const handleDownloadReport = () => {
    const reportElem = document.getElementById('plant-test-report-printable');
    if (!reportElem) return;

    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Berita Acara Pengujian HVAC Plant - ${reportNumber}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 16px; font-size: 10.5px; line-height: 1.35; }
    .no-print { display: none !important; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; page-break-inside: avoid; }
    th, td { border: 1px solid #94a3b8; padding: 4.5px 6.5px; font-size: 9.5px; text-align: left; vertical-align: middle; }
    th { background-color: #f1f5f9 !important; font-weight: bold; color: #0f172a; }
    svg { max-width: 100%; height: auto; display: block; }
    .floating-print-bar {
      position: sticky; top: 0; z-index: 100;
      background: linear-gradient(135deg, #0284c7, #0c4a6e);
      color: #ffffff; padding: 14px 22px; border-radius: 10px;
      margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
      box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.3);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .floating-print-btn {
      background: #ffffff; color: #0284c7; padding: 9px 20px; border: none;
      border-radius: 6px; font-weight: 800; font-size: 13px; cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.18); transition: all 0.2s; white-space: nowrap;
    }
    .floating-print-btn:hover { background: #f0f9ff; transform: translateY(-1px); }
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
      <div style="font-weight: 800; font-size: 15px;">📄 Dokumen Laporan Pengujian Plant HVAC (A4)</div>
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
    a.download = `BeritaAcara_HVAC_Plant_${reportNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      handleDownloadReport();
    }
  };

  return (
    <div className="plant-modal-portal fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
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
          #root > *:not(:has(#plant-test-report-printable)):not(#plant-test-report-printable) {
            display: none !important;
          }
          .no-print, nav, header {
            display: none !important;
          }
          .plant-modal-portal {
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            display: block !important;
            width: 100% !important;
          }
          #plant-test-report-printable {
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 4mm 6mm !important;
            margin: 0 !important;
            width: 100% !important;
          }
        }
      `}} />

      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-6 print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-slate-900">
        {/* Modal Top Control Bar (Screen only) */}
        <div className="no-print bg-slate-950 border-b border-slate-800 px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">📄</span> Berita Acara &amp; Laporan Pengujian Performa HVAC Plant
            </span>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
              {reportNumber}
            </span>
          </div>

          {/* DUA PILIHAN KOP SURAT */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 pl-2">Kop Laporan:</span>
            <button
              type="button"
              onClick={() => setSelectedLetterhead('current')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                selectedLetterhead === 'current'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {branding.shortName || 'RTU'} (Brand CV)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLetterhead('labtech')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                selectedLetterhead === 'labtech'
                  ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>PT LABTECH PENTA INTERNATIONAL</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
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
              title="Bagikan ringkasan laporan pengujian plant langsung ke WhatsApp"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Share ke WA</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>🖨️ Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="plant-test-report-printable" className="p-6 sm:p-8 bg-slate-900 text-slate-100 print:p-6 print:bg-white print:text-slate-900 print:text-xs">
          {/* 1. KOP SURAT PERUSAHAAN & VECTOR WAVE HEADER RESMI */}
          <ReportVectorHeader
            selectedLetterhead={selectedLetterhead}
            branding={branding}
            documentTitle="BERITA ACARA PENGUJIAN PERFORMA SISTEM HVAC"
            documentSubtitle="Evaluasi Kinerja Chiller Plant, Menara Pendingin (Cooling Tower) dan Air Handling Unit (AHU)"
            docNumber={reportNumber}
            standardCode="ASHRAE 22 / CTI / NEBB"
          />

          {/* TABEL 2: METADATA PROYEK & PENGUJIAN */}
          <div className="mb-5">
            <div className="bg-slate-800/80 print:bg-slate-100 px-3 py-1.5 text-xs font-bold text-cyan-300 print:text-slate-900 uppercase tracking-wider rounded-t border border-slate-700 print:border-slate-300">
              I. IDENTITAS PROYEK &amp; INFORMASI PENGUJIAN
            </div>
            <table className="w-full text-xs border border-slate-700 print:border-slate-300 border-collapse bg-slate-950/40 print:bg-white">
              <tbody>
                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="w-36 p-2 font-semibold text-slate-400 print:text-slate-700 bg-slate-900/50 print:bg-slate-50">Nama Proyek</td>
                  <td className="p-2 font-medium text-white print:text-slate-900">
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-white print:text-slate-900 focus:outline-hidden"
                    />
                  </td>
                  <td className="w-36 p-2 font-semibold text-slate-400 print:text-slate-700 bg-slate-900/50 print:bg-slate-50">Tanggal Uji</td>
                  <td className="p-2 font-medium text-white print:text-slate-900">
                    <input
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="bg-transparent border-none p-0 text-white print:text-slate-900 focus:outline-hidden font-mono"
                    />
                  </td>
                </tr>
                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold text-slate-400 print:text-slate-700 bg-slate-900/50 print:bg-slate-50">Klien / Pemilik</td>
                  <td className="p-2 font-medium text-white print:text-slate-900">
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-white print:text-slate-900 focus:outline-hidden"
                    />
                  </td>
                  <td className="p-2 font-semibold text-slate-400 print:text-slate-700 bg-slate-900/50 print:bg-slate-50">Lokasi / Ruang Mesin</td>
                  <td className="p-2 font-medium text-white print:text-slate-900">
                    <input
                      type="text"
                      value={testLocation}
                      onChange={(e) => setTestLocation(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-white print:text-slate-900 focus:outline-hidden"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TABEL 3: HASIL PENGUJIAN PERFORMA CHILLER */}
          <div className="mb-5">
            <div className="bg-slate-800/80 print:bg-slate-100 px-3 py-1.5 text-xs font-bold text-cyan-300 print:text-slate-900 uppercase tracking-wider rounded-t border border-slate-700 print:border-slate-300 flex justify-between">
              <span>II. PENGUJIAN PERFORMA CHILLER ({chillerInputs.chillerTag})</span>
              <span className="font-mono text-emerald-400 print:text-emerald-800">{chillerResults.efficiencyVerdict}</span>
            </div>
            <table className="w-full text-xs border border-slate-700 print:border-slate-300 border-collapse bg-slate-950/40 print:bg-white">
              <thead>
                <tr className="bg-slate-900 print:bg-slate-100 border-b border-slate-700 print:border-slate-300 font-semibold text-slate-300 print:text-slate-800">
                  <th className="p-2 text-left">Parameter Pengujian</th>
                  <th className="p-2 text-center">Nilai Terukur</th>
                  <th className="p-2 text-center">Nilai Desain / Acuan</th>
                  <th className="p-2 text-left">Evaluasi &amp; Standar</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold">Kapasitas Pendinginan Evaporator</td>
                  <td className="p-2 text-center font-mono font-bold text-cyan-300 print:text-slate-900">
                    {chillerResults.evapCapacityTR} TR ({chillerResults.evapCapacityKW} kW)
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    {chillerInputs.ratedCapacityTR} TR
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    Beban operasional {chillerResults.percentRatedCapacity}% dari rating
                  </td>
                </tr>

                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold">Chilled Water (CHW IN / OUT / Debit)</td>
                  <td className="p-2 text-center font-mono text-white print:text-slate-900">
                    {chillerInputs.chwInletTempC}°C / {chillerInputs.chwOutletTempC}°C (ΔT: {chillerResults.chwDeltaTC}°C)
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    {chillerInputs.chwFlowLpm} LPM ({((chillerInputs.chwFlowLpm*60)/1000).toFixed(1)} m³/h)
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    Tekanan beda evaporator: {chillerInputs.chwPressureDropKpa} kPa
                  </td>
                </tr>

                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold">Daya Kompresor Chiller (P_elec)</td>
                  <td className="p-2 text-center font-mono font-bold text-amber-300 print:text-slate-900">
                    {chillerResults.totalPowerInputKW} kW
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    {chillerInputs.ratedPowerKW} kW
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    {chillerInputs.electricalInputMode === 'direct_kw' ? 'Power meter terkalibrasi' : `3-Phase: ${chillerInputs.voltageV}V, ${chillerInputs.currentA}A, PF ${chillerInputs.powerFactor}`}
                  </td>
                </tr>

                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold">Spesifik Konsumsi Daya (kW / TR)</td>
                  <td className="p-2 text-center font-mono font-bold text-emerald-400 print:text-slate-900">
                    {chillerResults.specificPowerKWPerTR.toFixed(3)} kW/TR
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    &le; 0.65 kW/TR (SNI 6389)
                  </td>
                  <td className="p-2 font-semibold text-emerald-400 print:text-emerald-800">
                    Rating: {chillerResults.efficiencyRating.toUpperCase()} (COP {chillerResults.copActual.toFixed(2)}, EER {chillerResults.eerBtuPerWh.toFixed(1)})
                  </td>
                </tr>

                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold">Approach Suhu (Evap &amp; Kondenser)</td>
                  <td className="p-2 text-center font-mono text-white print:text-slate-900">
                    Evap: {chillerResults.evaporatorApproachC}°C | Cond: {chillerResults.condenserApproachC}°C
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    Batas: &le; 2.0°C
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    {chillerResults.condenserFoulingStatus === 'clean' ? 'Kondensor bersih tanpa kerak' : 'Terdeteksi endapan/fouling'}
                  </td>
                </tr>

                <tr>
                  <td className="p-2 font-semibold">Keseimbangan Panas (ASHRAE G-22)</td>
                  <td className="p-2 text-center font-mono font-bold text-cyan-300 print:text-slate-900">
                    Error {chillerResults.heatBalanceErrorPercent.toFixed(1)}%
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    Toleransi &le; 5.0%
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    {chillerResults.heatBalanceStatus === 'valid' ? '✓ Data valid dan konsisten secara termodinamika' : 'Perlu kalibrasi sensor'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TABEL 4: HASIL PENGUJIAN COOLING TOWER */}
          <div className="mb-5">
            <div className="bg-slate-800/80 print:bg-slate-100 px-3 py-1.5 text-xs font-bold text-cyan-300 print:text-slate-900 uppercase tracking-wider rounded-t border border-slate-700 print:border-slate-300 flex justify-between">
              <span>III. PENGUJIAN MENARA PENDINGIN / COOLING TOWER ({ctInputs.towerTag})</span>
              <span className="font-mono text-cyan-400 print:text-cyan-800">{ctResults.healthVerdict}</span>
            </div>
            <table className="w-full text-xs border border-slate-700 print:border-slate-300 border-collapse bg-slate-950/40 print:bg-white">
              <thead>
                <tr className="bg-slate-900 print:bg-slate-100 border-b border-slate-700 print:border-slate-300 font-semibold text-slate-300 print:text-slate-800">
                  <th className="p-2 text-left">Parameter Menara</th>
                  <th className="p-2 text-center">Nilai Uji</th>
                  <th className="p-2 text-center">Nilai Acuan</th>
                  <th className="p-2 text-left">Keterangan Teknis</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold">Cooling Range (HWT - CWT)</td>
                  <td className="p-2 text-center font-mono font-bold text-white print:text-slate-900">
                    {ctResults.rangeC.toFixed(2)} °C
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    {ctInputs.ratedRangeC.toFixed(1)} °C
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    HWT {ctInputs.hotWaterInletTempC}°C &rarr; CWT {ctInputs.coldWaterOutletTempC}°C
                  </td>
                </tr>

                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold">Approach Temperature (CWT - WBT)</td>
                  <td className="p-2 text-center font-mono font-bold text-cyan-300 print:text-slate-900">
                    {ctResults.approachC.toFixed(2)} °C
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    &le; 4.0 °C (Standar CTI)
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    Suhu bola basah udara sekitar WBT = {ctInputs.ambientWetBulbC}°C
                  </td>
                </tr>

                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold">Efektivitas Termal Menara</td>
                  <td className="p-2 text-center font-mono font-bold text-emerald-400 print:text-slate-900">
                    {ctResults.effectivenessPercent.toFixed(1)} %
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    Target &ge; 65 %
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    Pelepasan kalor {ctResults.heatRejectedTR} TR ({ctResults.heatRejectedKW} kW)
                  </td>
                </tr>

                <tr>
                  <td className="p-2 font-semibold">Neraca Air &amp; Makeup Water</td>
                  <td className="p-2 text-center font-mono text-white print:text-slate-900">
                    {ctResults.totalMakeupWaterM3H.toFixed(2)} m³/jam
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    CoC = {ctInputs.cyclesOfConcentration}
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    Evap: {ctResults.evaporationRateM3H.toFixed(2)} m³/jam | Blowdown: {ctResults.blowdownRateM3H.toFixed(2)} m³/jam
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TABEL 5: HASIL PENGUJIAN AHU */}
          <div className="mb-5">
            <div className="bg-slate-800/80 print:bg-slate-100 px-3 py-1.5 text-xs font-bold text-cyan-300 print:text-slate-900 uppercase tracking-wider rounded-t border border-slate-700 print:border-slate-300 flex justify-between">
              <span>IV. PENGUJIAN AIR HANDLING UNIT ({ahuInputs.ahuTag})</span>
              <span className="font-mono text-emerald-400 print:text-emerald-800">SFP: {ahuResults.sfpClassification}</span>
            </div>
            <table className="w-full text-xs border border-slate-700 print:border-slate-300 border-collapse bg-slate-950/40 print:bg-white">
              <thead>
                <tr className="bg-slate-900 print:bg-slate-100 border-b border-slate-700 print:border-slate-300 font-semibold text-slate-300 print:text-slate-800">
                  <th className="p-2 text-left">Parameter AHU</th>
                  <th className="p-2 text-center">Nilai Uji</th>
                  <th className="p-2 text-center">Nilai Desain</th>
                  <th className="p-2 text-left">Keterangan Teknis</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold">Debit Udara Pasok (Supply Airflow)</td>
                  <td className="p-2 text-center font-mono font-bold text-white print:text-slate-900">
                    {ahuInputs.measuredAirflowCfm} CFM
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    {ahuInputs.designAirflowCfm} CFM
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    ≈ {Math.round((ahuInputs.measuredAirflowCfm * 0.0283168 * 3600) / 60)} m³/jam (ESP: {ahuInputs.externalStaticPressurePa} Pa)
                  </td>
                </tr>

                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold">Kapasitas Pendinginan Koil Udara vs Air</td>
                  <td className="p-2 text-center font-mono font-bold text-cyan-300 print:text-slate-900">
                    Udara: {ahuResults.airsideTotalCapacityTR} TR | Air: {ahuResults.watersideCapacityTR} TR
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    Error {ahuResults.heatBalanceErrorPercent.toFixed(1)}%
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    Sensible Heat Ratio (SHR) = {ahuResults.sensibleHeatRatio.toFixed(2)} | Bypass Factor = {(ahuResults.coilBypassFactor * 100).toFixed(1)}%
                  </td>
                </tr>

                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold">Spesific Fan Power (SFP)</td>
                  <td className="p-2 text-center font-mono font-bold text-emerald-400 print:text-slate-900">
                    {ahuResults.specificFanPowerWPerLps.toFixed(2)} W/(L/s)
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    Klasifikasi {ahuResults.sfpClassification}
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    Daya motor kipas = {ahuInputs.fanInputKW} kW (Efisiensi statis: {ahuResults.fanStaticEfficiencyPercent}%)
                  </td>
                </tr>

                <tr>
                  <td className="p-2 font-semibold">Status Kebersihan Filter Udara</td>
                  <td className="p-2 text-center font-mono font-bold text-white print:text-slate-900">
                    ΔP: {ahuInputs.filterPressureDropPa} Pa
                  </td>
                  <td className="p-2 text-center font-mono text-slate-400 print:text-slate-600">
                    Acuan bersih: {ahuInputs.cleanFilterDpPa} Pa
                  </td>
                  <td className="p-2 text-slate-300 print:text-slate-700">
                    {ahuResults.filterStatus === 'clean' ? 'Filter bersih optimal' : 'Filter kotor perlu diganti'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TABEL 6: RINGKASAN EFISIENSI TOTAL PLANT (Integrated System) */}
          <div className="mb-5">
            <div className="bg-slate-800/80 print:bg-slate-100 px-3 py-1.5 text-xs font-bold text-amber-300 print:text-slate-900 uppercase tracking-wider rounded-t border border-slate-700 print:border-slate-300 flex justify-between">
              <span>V. EFISIENSI TOTAL CENTRAL PLANT (CHILLER + CT + POMPA + AHU)</span>
              <span className="font-mono text-emerald-400 print:text-emerald-800">RATING: {integrated.plantRating.toUpperCase()}</span>
            </div>
            <table className="w-full text-xs border border-slate-700 print:border-slate-300 border-collapse bg-slate-950/40 print:bg-white">
              <tbody>
                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold text-slate-400 print:text-slate-700 w-1/2">Total Kapasitas Pendinginan Nyata:</td>
                  <td className="p-2 text-right font-mono font-bold text-white print:text-slate-900 w-1/2">
                    {integrated.totalChillerTR} TR ({chillerResults.evapCapacityKW} kW)
                  </td>
                </tr>
                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold text-slate-400 print:text-slate-700">Total Daya Listrik Seluruh Sistem Plant:</td>
                  <td className="p-2 text-right font-mono font-bold text-amber-300 print:text-slate-900">
                    {integrated.totalPlantPowerKW.toFixed(1)} kW (Chiller: {integrated.totalChillerPowerKW} kW, CT: {integrated.totalCoolingTowerPowerKW} kW, CHWP: {integrated.totalChwPumpsPowerKW} kW, CWP: {integrated.totalCwPumpsPowerKW} kW, AHU: {integrated.totalAhuPowerKW} kW)
                  </td>
                </tr>
                <tr className="border-b border-slate-800 print:border-slate-300">
                  <td className="p-2 font-semibold text-slate-400 print:text-slate-700">Total Plant kW / TR:</td>
                  <td className="p-2 text-right font-mono font-bold text-emerald-400 print:text-slate-900 text-sm">
                    {integrated.overallPlantKWPerTR.toFixed(3)} kW / TR (COP Total: {integrated.overallPlantCop.toFixed(2)})
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-400 print:text-slate-700">Estimasi Biaya Operasional Listrik Tahunan:</td>
                  <td className="p-2 text-right font-mono font-bold text-cyan-300 print:text-slate-900">
                    Rp {(integrated.annualEnergyCostIDR / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Juta / Tahun
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TABEL 7: LEMBAR TANDA TANGAN PENGESAHAN */}
          <div className="mt-8 pt-4 border-t-2 border-slate-700 print:border-slate-900">
            <table className="w-full text-center text-xs text-slate-300 print:text-slate-900 border-collapse">
              <tbody>
                <tr>
                  <td className="w-1/3 py-2">
                    <p className="text-[11px] text-slate-400 print:text-slate-600 mb-12">Diuji Oleh (Lead Test Engineer):</p>
                    <p className="font-bold border-b border-slate-600 print:border-slate-900 pb-1 mx-4 text-white print:text-slate-950">
                      {leadTester}
                    </p>
                    <p className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">Sertifikasi HVAC Plant Specialist</p>
                  </td>
                  <td className="w-1/3 py-2">
                    <p className="text-[11px] text-slate-400 print:text-slate-600 mb-12">Disetujui Oleh (Direktur Teknik):</p>
                    <p className="font-bold border-b border-slate-600 print:border-slate-900 pb-1 mx-4 text-white print:text-slate-950">
                      {branding.directorName}
                    </p>
                    <p className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">{branding.companyName}</p>
                  </td>
                  <td className="w-1/3 py-2">
                    <p className="text-[11px] text-slate-400 print:text-slate-600 mb-12">Diterima Oleh (Pihak Pengelola Gedung):</p>
                    <p className="font-bold border-b border-slate-600 print:border-slate-900 pb-1 mx-4 text-white print:text-slate-950">
                      {inspectorName}
                    </p>
                    <p className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">Building Operation &amp; Maintenance</p>
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
        reportTitle={`Berita Acara HVAC Plant - ${reportNumber}`}
        messageText={waReportMessage}
      />
    </div>
  );
};
