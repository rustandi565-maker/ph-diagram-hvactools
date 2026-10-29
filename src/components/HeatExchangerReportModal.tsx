import React, { useState } from 'react';
import { CompanyBranding, LABTECH_BRANDING, DEFAULT_BRANDING } from '../types/branding';
import {
  HeatExchangerInputs,
  HeatExchangerResults,
  HeatExchangerReportMeta,
  FlowConfiguration,
} from '../types/heatExchanger';
import { ReportVectorHeader } from './ReportVectorHeader';
import { HeatExchangerChart } from './HeatExchangerChart';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { buildWhatsAppReportMessage } from '../utils/whatsappShare';
import { AppLanguage, TRANSLATIONS } from '../utils/i18n';

interface HeatExchangerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding?: CompanyBranding;
  reportMeta: HeatExchangerReportMeta;
  onUpdateReportMeta?: (meta: HeatExchangerReportMeta) => void;
  inputs: HeatExchangerInputs;
  results: HeatExchangerResults;
  language?: AppLanguage;
}

export const HeatExchangerReportModal: React.FC<HeatExchangerReportModalProps> = ({
  isOpen,
  onClose,
  branding,
  reportMeta,
  onUpdateReportMeta,
  inputs,
  results,
  language = 'id',
}) => {
  const [selectedLetterhead, setSelectedLetterhead] = useState<'current' | 'labtech'>('labtech');
  const [showAdminEditor, setShowAdminEditor] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const t = TRANSLATIONS[language] ?? TRANSLATIONS.id;

  const flowLabels: Record<FlowConfiguration, string> = {
    parallel: 'Aliran Sejajar (Parallel Flow / Co-Current)',
    counter: 'Aliran Berlawanan (Counter-Current Flow)',
    cross: 'Aliran Silang (Cross Flow - Unmixed/Unmixed)',
    multipass: 'Aliran Multi-Pass (Shell & Tube 1-2 Pass)',
  };

  const resolvedProductName = reportMeta.productName?.trim() || `Heat Exchanger Test Rig (${flowLabels[inputs.flowConfig]})`;
  const resolvedModelUnit = reportMeta.modelUnit?.trim() || `HX-${inputs.exchangerType.toUpperCase()}-01`;
  const resolvedWorkOrder = reportMeta.workOrderNumber?.trim() || 'WL-13095-HX';
  const resolvedProject = reportMeta.projectName?.trim() || `Uji Kinerja & Evaluasi LMTD Heat Exchanger (${inputs.capacity} ${inputs.capacityUnit})`;
  const resolvedDate = reportMeta.reportDate?.trim() || new Date().toISOString().split('T')[0];

  const waReportMessage = buildWhatsAppReportMessage({
    title: 'Laporan Resmi Uji Kinerja Heat Exchanger',
    docNumber: `HX-PERF-${resolvedWorkOrder}`,
    productName: resolvedProductName,
    modelUnit: resolvedModelUnit,
    workOrderNumber: resolvedWorkOrder,
    projectName: resolvedProject,
    date: resolvedDate,
    companyName: selectedLetterhead === 'labtech' ? LABTECH_BRANDING.companyName : (branding?.companyName || 'CV REFRIGERASI TEKNIK UTAMA'),
    sections: [
      {
        heading: 'Parameter Operasional Fluida',
        items: [
          { label: 'Konfigurasi Aliran', value: flowLabels[inputs.flowConfig] },
          { label: 'Fluida 1 (Inlet / Outlet)', value: `${inputs.t1In}°C / ${inputs.t1Out}°C (${inputs.fluid1Name})` },
          { label: 'Fluida 2 (Inlet / Outlet)', value: `${inputs.t2In}°C / ${inputs.t2Out}°C (${inputs.fluid2Name})` },
          { label: 'Kapasitas Kalor (Q)', value: `${results.capacityKw.toFixed(2)} kW (${results.capacityTR.toFixed(2)} TR / ${Math.round(results.capacityBtuHr).toLocaleString('id-ID')} BTU/h)` },
        ],
      },
      {
        heading: 'Hasil Perhitungan Termal (LMTD, U, A, ε)',
        items: [
          { label: 'LMTD Nominal', value: `${results.lmtdNominal.toFixed(2)} °C` },
          { label: 'Faktor Koreksi (F)', value: `${results.correctionFactorF.toFixed(3)}` },
          { label: 'LMTD Efektif (ΔTeff)', value: `${results.effectiveDeltaT.toFixed(2)} °C` },
          { label: 'Koefisien U', value: `${results.overallU.toFixed(1)} W/(m²·K)` },
          { label: 'Luas Permukaan (A)', value: `${results.areaM2.toFixed(3)} m² (${results.areaFt2.toFixed(2)} ft²)` },
          { label: 'Efektivitas (ε)', value: `${(results.effectiveness * 100).toFixed(1)}%` },
          { label: 'Number of Transfer Units (NTU)', value: `${results.ntu.toFixed(2)}` },
          { label: 'Pinch Point ΔT', value: `${results.pinchPointDeltaT.toFixed(1)} K (${results.pinchPointLocation})` },
        ],
      },
    ],
    directNotes: `Penukar kalor beroperasi pada beda temperatur efektif ΔT_eff = ${results.effectiveDeltaT.toFixed(2)} °C dengan faktor koreksi F = ${results.correctionFactorF.toFixed(3)}. Pinch point tercatat sebesar ${results.pinchPointDeltaT.toFixed(1)} K pada ${results.pinchPointLocation}. Luas permukaan A = ${results.areaM2.toFixed(3)} m² mencukupi untuk transfer kapasitas ${results.capacityKw.toFixed(2)} kW.`,
  });

  const handleAutoFillWithFluids = () => {
    onUpdateReportMeta?.({
      ...reportMeta,
      productName: `Penukar Kalor ${inputs.fluid1Name} - ${inputs.fluid2Name}`,
      modelUnit: `HX-${inputs.flowConfig.toUpperCase()}-01`,
      workOrderNumber: reportMeta.workOrderNumber || 'WL-13095-HX',
      projectName: `Pengujian Termal & Efektivitas Heat Exchanger (${inputs.capacity} ${inputs.capacityUnit})`,
      reportDate: reportMeta.reportDate || new Date().toISOString().split('T')[0],
    });
  };

  const handleSetLabtechStandard = () => {
    onUpdateReportMeta?.({
      ...reportMeta,
      productName: `Trainer Penukar Kalor Laboratorium (Heat Exchanger Bench)`,
      modelUnit: `LABTECH-HX-801`,
      workOrderNumber: 'WL-13095-01',
      projectName: `Verifikasi Kinerja Termal LMTD & Efektivitas NTU`,
      reportDate: new Date().toISOString().split('T')[0],
    });
  };

  const handlePrint = () => {
    setPrintFeedback('Membuka dialog cetak sistem...');
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintFeedback(null), 3000);
    }, 150);
  };

  const handleCopyTextReport = () => {
    const summary = `===============================================================
LAPORAN HASIL PENGUJIAN KINERJA PENUKAR KALOR (HEAT EXCHANGER)
===============================================================
No. SPK / WO       : ${resolvedWorkOrder}
Nama Produk        : ${resolvedProductName}
Model Unit         : ${resolvedModelUnit}
Proyek / Pekerjaan : ${resolvedProject}
Tanggal Pengujian  : ${resolvedDate}
Konfigurasi Aliran : ${flowLabels[inputs.flowConfig]}

PARAMETER OPERASIONAL:
- Fluida 1 (Inlet / Outlet) : ${inputs.t1In}°C / ${inputs.t1Out}°C (${inputs.fluid1Name})
- Fluida 2 (Inlet / Outlet) : ${inputs.t2In}°C / ${inputs.t2Out}°C (${inputs.fluid2Name})
- Kapasitas Kalor (Q)       : ${results.capacityKw.toFixed(2)} kW (${results.capacityTR.toFixed(2)} TR)

HASIL PERHITUNGAN TERMAL:
- LMTD Nominal             : ${results.lmtdNominal.toFixed(2)} °C
- Faktor Koreksi (F)       : ${results.correctionFactorF.toFixed(3)}
- LMTD Efektif (ΔTeff)     : ${results.effectiveDeltaT.toFixed(2)} °C
- Koefisien U              : ${results.overallU.toFixed(1)} W/(m²·K)
- Luas Permukaan (A)       : ${results.areaM2.toFixed(3)} m² (${results.areaFt2.toFixed(2)} ft²)
- Efektivitas (ε)          : ${(results.effectiveness * 100).toFixed(1)} %
- NTU                      : ${results.ntu.toFixed(2)}
- Laju Alir Massa Panas    : ${results.massFlowHotKgS.toFixed(3)} kg/s (${(results.massFlowHotKgS * 3600).toFixed(1)} kg/h)
- Laju Alir Massa Dingin   : ${results.massFlowColdKgS.toFixed(3)} kg/s (${(results.massFlowColdKgS * 3600).toFixed(1)} kg/h)
- Pinch Point Temperatur   : ${results.pinchPointDeltaT.toFixed(1)} K (${results.pinchPointLocation})
===============================================================`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReport = () => {
    const reportElem = document.getElementById('hx-printable-report');
    if (!reportElem) return;

    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Heat Exchanger - ${resolvedProductName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #ffffff; color: #0f172a; margin: 0; padding: 16px; font-size: 10.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; }
    th, td { border: 1px solid #94a3b8; padding: 5px 7px; font-size: 9.5px; text-align: left; }
    th { background-color: #f1f5f9 !important; font-weight: bold; color: #0f172a; }
  </style>
</head>
<body>
  <div style="max-width: 800px; margin: 0 auto;">
    ${reportElem.innerHTML}
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_HeatExchanger_${resolvedWorkOrder}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col print:border-none print:shadow-none print:rounded-none print:bg-white">
        {/* Top Floating Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider text-sm">
              Laporan Pengujian Penukar Kalor (Heat Exchanger)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Letterhead Switcher */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedLetterhead('current')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  selectedLetterhead === 'current'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
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
                    ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>PT LABTECH</span>
              </button>
            </div>

            {/* Toggle Admin Editor */}
            <button
              onClick={() => setShowAdminEditor(!showAdminEditor)}
              className={`px-3 py-1.5 text-xs font-mono rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showAdminEditor
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                  : 'bg-slate-800 text-cyan-300 hover:text-white hover:bg-slate-700 border border-cyan-800/60'
              }`}
            >
              <span>📋</span>
              <span>{showAdminEditor ? 'Tutup Edit Administrasi' : 'Edit Identitas Laporan'}</span>
            </button>

            {/* Copy Text Summary */}
            <button
              onClick={handleCopyTextReport}
              className={`px-3 py-1.5 text-xs font-mono rounded font-medium transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {copied ? '✓ Tersalin!' : 'Salin Ringkasan'}
            </button>

            {/* Download HTML */}
            <button
              onClick={handleDownloadReport}
              className="px-3.5 py-1.5 text-xs font-mono font-medium rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-800/60 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Unduh HTML / PDF
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={() => setIsWaModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-mono font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
              title="Bagikan ringkasan laporan Heat Exchanger langsung ke WhatsApp"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Share ke WA</span>
            </button>

            {/* Print Official Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-mono font-bold rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak Laporan Resmi
            </button>

            {/* Close Button */}
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

        {/* Administration Editor Dropdown Form (Hidden on print) */}
        {showAdminEditor && (
          <div className="no-print bg-slate-950 border-b border-slate-800 p-4 sm:p-5 text-xs font-mono space-y-3">
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
                  onClick={handleAutoFillWithFluids}
                  className="px-2.5 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  🔄 Sinkronkan dgn Fluida
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
                    })
                  }
                  placeholder="Contoh: Heat Exchanger Rig..."
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
                  placeholder="Contoh: LABTECH-HX-801..."
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

        {/* Printable Document Content (Strict High-Contrast Table Layouts on Clean White Sheet) */}
        <div
          id="hx-printable-report"
          className="p-6 sm:p-8 space-y-6 bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-xl print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none max-w-4xl mx-auto font-sans"
        >
          {/* 1. Header with Vector Wave Logo & Official Letterhead */}
          <ReportVectorHeader
            selectedLetterhead={selectedLetterhead}
            branding={branding}
            documentTitle="LAPORAN RESMI UJI KINERJA HEAT EXCHANGER"
            documentSubtitle="TEMA PERHITUNGAN LMTD, U, A &amp; EFEKTIVITAS ALIRAN TERMAL • TEMA STANDAR TEMA / ASME / ISO 9001"
            refrigerantName={`${inputs.fluid1Name} ⇄ ${inputs.fluid2Name}`}
            docNumber={`HX-PERF-${resolvedWorkOrder}`}
            standardCode="TEMA &amp; ASME SEC. VIII"
          />

          {/* 2. SECTION A: INFORMASI ADMINISTRASI & IDENTITAS PENGUJIAN */}
          <div className="page-section">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800 mb-2">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-900">
                BAGIAN A: INFORMASI ADMINISTRASI &amp; IDENTITAS PENGUJIAN
              </span>
              <span className="text-[10px] font-mono text-slate-600 font-bold">
                DOC NO: HX-PERF-01
              </span>
            </div>

            <table className="w-full text-xs font-mono border-collapse border border-slate-400">
              <tbody>
                <tr>
                  <td className="w-1/4 font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    1. Product Name:
                  </td>
                  <td className="w-1/4 font-extrabold text-slate-950 bg-white border border-slate-300 p-2">
                    {resolvedProductName}
                  </td>
                  <td className="w-1/4 font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    2. Model Unit:
                  </td>
                  <td className="w-1/4 font-extrabold text-slate-950 bg-white border border-slate-300 p-2">
                    {resolvedModelUnit}
                  </td>
                </tr>
                <tr>
                  <td className="w-1/4 font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    3. Work Order Number:
                  </td>
                  <td className="w-1/4 font-extrabold text-blue-900 bg-white border border-slate-300 p-2">
                    {resolvedWorkOrder}
                  </td>
                  <td className="w-1/4 font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    4. Project:
                  </td>
                  <td className="w-1/4 font-extrabold text-slate-950 bg-white border border-slate-300 p-2">
                    {resolvedProject}
                  </td>
                </tr>
                <tr>
                  <td className="w-1/4 font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    5. Date of Report:
                  </td>
                  <td className="w-1/4 font-extrabold text-slate-950 bg-white border border-slate-300 p-2">
                    {resolvedDate}
                  </td>
                  <td className="w-1/4 font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    Standar Referensi:
                  </td>
                  <td className="w-1/4 font-bold text-slate-950 bg-white border border-slate-300 p-2">
                    TEMA Class C / Incropera Dewitt
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. SECTION B: PARAMETER OPERASIONAL & SPESIFIKASI FLUIDA */}
          <div className="page-section">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800 mb-2">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-900">
                BAGIAN B: PARAMETER MASUKAN OPERASIONAL &amp; SPESIFIKASI FLUIDA
              </span>
              <span className="text-[10px] font-mono text-slate-600 font-bold">
                THERMAL OPERATING DATA
              </span>
            </div>

            <table className="w-full text-xs font-mono border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-slate-900 font-bold">Parameter Operasional</th>
                  <th className="border border-slate-300 p-2 text-slate-900 font-bold">Fluida 1 ({inputs.fluid1Name})</th>
                  <th className="border border-slate-300 p-2 text-slate-900 font-bold">Fluida 2 ({inputs.fluid2Name})</th>
                  <th className="border border-slate-300 p-2 text-slate-900 font-bold">Keterangan / Satuan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-50 border border-slate-300 p-2">Peran Aliran Termal</td>
                  <td className="font-extrabold border border-slate-300 p-2 text-slate-900">
                    {results.isFluid1Hot ? '🔥 Sisi Fluida Panas (Hot Side)' : '❄️ Sisi Fluida Dingin (Cold Side)'}
                  </td>
                  <td className="font-extrabold border border-slate-300 p-2 text-slate-900">
                    {!results.isFluid1Hot ? '🔥 Sisi Fluida Panas (Hot Side)' : '❄️ Sisi Fluida Dingin (Cold Side)'}
                  </td>
                  <td className="border border-slate-300 p-2 text-slate-700">Otomatis teridentifikasi</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-50 border border-slate-300 p-2">Temperatur Masuk (T_in)</td>
                  <td className="font-extrabold text-slate-950 border border-slate-300 p-2">{inputs.t1In.toFixed(1)} °C</td>
                  <td className="font-extrabold text-slate-950 border border-slate-300 p-2">{inputs.t2In.toFixed(1)} °C</td>
                  <td className="border border-slate-300 p-2 text-slate-700">°C (Inlet Temperature)</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-50 border border-slate-300 p-2">Temperatur Keluar (T_out)</td>
                  <td className="font-extrabold text-slate-950 border border-slate-300 p-2">{inputs.t1Out.toFixed(1)} °C</td>
                  <td className="font-extrabold text-slate-950 border border-slate-300 p-2">{inputs.t2Out.toFixed(1)} °C</td>
                  <td className="border border-slate-300 p-2 text-slate-700">°C (Outlet Temperature)</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-50 border border-slate-300 p-2">Perubahan Suhu (|ΔT|)</td>
                  <td className="font-bold text-slate-950 border border-slate-300 p-2">{Math.abs(inputs.t1In - inputs.t1Out).toFixed(1)} K</td>
                  <td className="font-bold text-slate-950 border border-slate-300 p-2">{Math.abs(inputs.t2In - inputs.t2Out).toFixed(1)} K</td>
                  <td className="border border-slate-300 p-2 text-slate-700">Rentang perubahan fluida</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-50 border border-slate-300 p-2">Kapasitas Panas (C = Q/ΔT)</td>
                  <td className="font-bold text-slate-950 border border-slate-300 p-2">
                    {(results.isFluid1Hot ? results.chWattsPerK : results.ccWattsPerK).toFixed(1)} W/K
                  </td>
                  <td className="font-bold text-slate-950 border border-slate-300 p-2">
                    {(!results.isFluid1Hot ? results.chWattsPerK : results.ccWattsPerK).toFixed(1)} W/K
                  </td>
                  <td className="border border-slate-300 p-2 text-slate-700">W/K (Heat capacity rate)</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-50 border border-slate-300 p-2">Estimasi Laju Alir Massa</td>
                  <td className="font-bold text-slate-950 border border-slate-300 p-2">
                    {(results.isFluid1Hot ? results.massFlowHotKgS : results.massFlowColdKgS).toFixed(3)} kg/s
                  </td>
                  <td className="font-bold text-slate-950 border border-slate-300 p-2">
                    {(!results.isFluid1Hot ? results.massFlowHotKgS : results.massFlowColdKgS).toFixed(3)} kg/s
                  </td>
                  <td className="border border-slate-300 p-2 text-slate-700">
                    Berdasarkan Cp fluida
                  </td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td className="font-bold text-slate-900 border border-slate-300 p-2">Kapasitas Perpindahan (Q)</td>
                  <td colSpan={2} className="font-black text-slate-950 border border-slate-300 p-2 text-center text-sm">
                    {results.capacityKw.toFixed(2)} kW &nbsp;|&nbsp; {results.capacityTR.toFixed(2)} TR &nbsp;|&nbsp; {Math.round(results.capacityBtuHr).toLocaleString('id-ID')} BTU/h
                  </td>
                  <td className="border border-slate-300 p-2 text-slate-700">{inputs.capacity} {inputs.capacityUnit}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. SECTION C: HASIL PERHITUNGAN TERMAL & METRIK KINERJA */}
          <div className="page-section">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800 mb-2">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-900">
                BAGIAN C: HASIL PERHITUNGAN TERMAL &amp; PARAMETER PERFORMA (LMTD, U, A, ε)
              </span>
              <span className="text-[10px] font-mono text-slate-600 font-bold">
                THERMAL PERFORMANCE METRICS
              </span>
            </div>

            <table className="w-full text-xs font-mono border-collapse border border-slate-400">
              <tbody>
                <tr>
                  <td className="w-1/3 font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    Konfigurasi Aliran Terpilih:
                  </td>
                  <td className="font-extrabold text-blue-900 bg-white border border-slate-300 p-2">
                    {flowLabels[inputs.flowConfig]}
                  </td>
                  <td className="w-1/4 font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    Faktor Koreksi (F):
                  </td>
                  <td className="font-extrabold text-slate-950 bg-white border border-slate-300 p-2">
                    {results.correctionFactorF.toFixed(3)}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    LMTD Nominal (Counter/Parallel):
                  </td>
                  <td className="font-bold text-slate-950 bg-white border border-slate-300 p-2">
                    {results.lmtdNominal.toFixed(2)} °C
                  </td>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    LMTD Efektif (ΔT_eff = F × LMTD):
                  </td>
                  <td className="font-extrabold text-emerald-800 bg-white border border-slate-300 p-2">
                    {results.effectiveDeltaT.toFixed(2)} °C
                  </td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    Koefisien Perpindahan Kalor Menyeluruh (U):
                  </td>
                  <td className="font-extrabold text-slate-950 bg-white border border-slate-300 p-2">
                    {results.overallU.toFixed(1)} W/(m²·K)
                  </td>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    Luas Permukaan Perpindahan (A):
                  </td>
                  <td className="font-extrabold text-blue-950 bg-white border border-slate-300 p-2">
                    {results.areaM2.toFixed(3)} m² ({results.areaFt2.toFixed(2)} ft²)
                  </td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    Efektivitas Heat Exchanger (ε):
                  </td>
                  <td className="font-extrabold text-purple-900 bg-white border border-slate-300 p-2">
                    {(results.effectiveness * 100).toFixed(1)} % (Q / Q_max)
                  </td>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    Number of Transfer Units (NTU):
                  </td>
                  <td className="font-bold text-slate-950 bg-white border border-slate-300 p-2">
                    {results.ntu.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    Pinch Point ΔT (Beda Suhu Terdekat):
                  </td>
                  <td className="font-bold text-amber-900 bg-white border border-slate-300 p-2">
                    {results.pinchPointDeltaT.toFixed(1)} K ({results.pinchPointLocation})
                  </td>
                  <td className="font-bold text-slate-900 bg-slate-100 border border-slate-300 p-2">
                    Rasio Kapasitas (Cr = Cmin/Cmax):
                  </td>
                  <td className="font-bold text-slate-950 bg-white border border-slate-300 p-2">
                    {results.capacityRatioR.toFixed(3)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. SECTION D: DIAGRAM DISTRIBUSI TEMPERATUR (T vs Jarak Relatif x/L) */}
          <div className="page-section">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800 mb-2">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-900">
                BAGIAN D: DIAGRAM DISTRIBUSI TEMPERATUR (T vs JARAK RELATIF x/L)
              </span>
              <span className="text-[10px] font-mono text-slate-600 font-bold">
                THERMAL TEMPERATURE PROFILE
              </span>
            </div>

            <div className="border border-slate-300 p-2 rounded bg-white">
              <HeatExchangerChart
                results={results}
                flowConfig={inputs.flowConfig}
                fluid1Name={inputs.fluid1Name}
                fluid2Name={inputs.fluid2Name}
                totalLengthMeters={inputs.exchangerLengthMeters || 2.0}
                isPrintMode={true}
                height={320}
              />
            </div>
            <div className="text-[9.5px] font-mono text-slate-600 mt-1.5">
              * Kurva merah mengindikasikan penurunan suhu fluida panas; kurva biru mengindikasikan kenaikan suhu fluida dingin sepanjang jarak penukar kalor.
            </div>
          </div>

          {/* 6. SECTION E: EVALUASI KINERJA TERMAL & REKOMENDASI REKAYASA */}
          <div className="page-section">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800 mb-2">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-900">
                BAGIAN E: EVALUASI KINERJA TERMAL &amp; REKOMENDASI REKAYASA
              </span>
              <span className="text-[10px] font-mono text-slate-600 font-bold">
                ENGINEERING EVALUATION &amp; RECOMMENDATIONS
              </span>
            </div>

            <div className="border border-slate-300 bg-slate-50 p-3 rounded text-xs font-mono space-y-2 text-slate-800 leading-relaxed">
              <p>
                <strong>1. Evaluasi LMTD &amp; Faktor Koreksi:</strong> Penukar kalor beroperasi dengan beda temperatur efektif ΔT_eff = <strong>{results.effectiveDeltaT.toFixed(2)} °C</strong> (Faktor koreksi F = {results.correctionFactorF.toFixed(3)}). {results.correctionFactorF >= 0.8 ? 'Nilai F berada di atas batas standar 0.75 - 0.80, menandakan luas permukaan digunakan dengan efisien dan tidak terjadi pinch temperatur berlebih.' : 'Perhatian: Nilai F < 0.75 menandakan konfigurasi aliran multi-pass/cross mengalami ketidakefisienan akibat temperatur cross lokal.'}
              </p>
              <p>
                <strong>2. Analisis Pinch Point:</strong> Beda temperatur terdekat (Pinch Point) tercatat sebesar <strong>{results.pinchPointDeltaT.toFixed(1)} K</strong> di lokasi <em>{results.pinchPointLocation}</em>. {results.pinchPointDeltaT >= 3.0 ? 'Pinch point berada dalam ambang batas aman (> 3 K), menjamin driving force perpindahan kalor memadai tanpa memerlukan luasan tak terhingga.' : 'Peringatan: Pinch point sangat rapat (< 3 K), luas penukar kalor akan melonjak tajam secara asimtotik.'}
              </p>
              <p>
                <strong>3. Efektivitas &amp; NTU:</strong> Efektivitas penukar kalor tercatat <strong>{(results.effectiveness * 100).toFixed(1)}%</strong> dengan nilai NTU = <strong>{results.ntu.toFixed(2)}</strong>. Luas permukaan A = <strong>{results.areaM2.toFixed(3)} m²</strong> mencukupi untuk mentransfer kapasitas beban penuh {results.capacityKw.toFixed(2)} kW pada koefisien U = {results.overallU.toFixed(0)} W/(m²·K).
              </p>
              <p>
                <strong>4. Rekomendasi Pemeliharaan &amp; Fouling:</strong> Disarankan melakukan pembersihan berkala (chemical cleaning / descaling) untuk mengantisipasi penurunan koefisien U akibat fouling factor pada sisi fluida cair maupun gas.
              </p>
            </div>
          </div>

          {/* 7. SECTION F: TANDA TANGAN & PENGESAHAN */}
          <div className="page-section pt-3 border-t-2 border-slate-800">
            <div className="grid grid-cols-3 gap-4 text-center text-xs font-mono">
              <div>
                <p className="text-slate-600 font-semibold mb-1">Diverifikasi &amp; Diuji Oleh:</p>
                <div className="h-16 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">[Tanda Tangan Penguji]</span>
                </div>
                <p className="font-extrabold text-slate-900 mt-1">{reportMeta.testedBy || 'Eng. Fajar Ramadhan, S.T.'}</p>
                <p className="text-[10px] text-slate-500">Thermal Testing Specialist</p>
              </div>

              <div>
                <p className="text-slate-600 font-semibold mb-1">Diperiksa &amp; Diverifikasi:</p>
                <div className="h-16 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">[Tanda Tangan Reviewer]</span>
                </div>
                <p className="font-extrabold text-slate-900 mt-1">{reportMeta.verifiedBy || 'Ir. Bambang Tri, M.T., IPM'}</p>
                <p className="text-[10px] text-slate-500">Quality Assurance Manager</p>
              </div>

              <div>
                <p className="text-slate-600 font-semibold mb-1">Disetujui / Disahkan:</p>
                <div className="h-16 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">[Stempel &amp; Tanda Tangan]</span>
                </div>
                <p className="font-extrabold text-slate-900 mt-1">{reportMeta.approvedBy || 'Dr. Ir. Hendra S., S.T., M.Eng.'}</p>
                <p className="text-[10px] text-slate-500">Kepala Laboratorium Perpindahan Kalor</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        reportTitle={`Laporan Heat Exchanger - ${resolvedProductName}`}
        messageText={waReportMessage}
      />
    </div>
  );
};
