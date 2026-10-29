import React, { useState } from 'react';
import { CoolingLoadResult, UnitSystem } from '../types/hvac';
import { CompanyBranding, LABTECH_BRANDING } from '../types/branding';
import { RtuLogo } from './RtuLogo';
import { LabtechLogo } from './LabtechLogo';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { buildWhatsAppReportMessage } from '../utils/whatsappShare';

interface SpecificationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  coolingResult: CoolingLoadResult;
  length: number;
  width: number;
  height: number;
  unitSystem: UnitSystem;
  roomType: string;
  occupants: number;
  equipmentWattage: number;
  branding: CompanyBranding;
}

export const SpecificationReportModal: React.FC<SpecificationReportModalProps> = ({
  isOpen,
  onClose,
  coolingResult,
  length,
  width,
  height,
  unitSystem,
  roomType,
  occupants,
  equipmentWattage,
  branding,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'text' | 'letterhead'>('letterhead');
  const [selectedLetterhead, setSelectedLetterhead] = useState<'current' | 'labtech'>('labtech');
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  if (!isOpen) return null;

  const activeBrand = selectedLetterhead === 'labtech' ? LABTECH_BRANDING : branding;

  const lengthUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const areaUnit = unitSystem === 'metric' ? 'm²' : 'sq ft';
  const volumeUnit = unitSystem === 'metric' ? 'm³' : 'cu ft';

  const waReportMessage = buildWhatsAppReportMessage({
    title: 'Lembar Spesifikasi Teknis Beban Pendingin Ruang',
    companyName: activeBrand.companyName,
    sections: [
      {
        heading: 'Data Ruangan & Dimensi',
        items: [
          { label: 'Dimensi Ruangan (P x L x T)', value: `${length} x ${width} x ${height} ${lengthUnit}` },
          { label: 'Luas Lantai / Volume', value: `${coolingResult.floorArea} ${areaUnit} / ${coolingResult.volume} ${volumeUnit}` },
          { label: 'Fungsi Ruang', value: roomType },
          { label: 'Penghuni / Beban Listrik', value: `${occupants} Orang / ${equipmentWattage} Watt` },
        ],
      },
      {
        heading: 'Hasil Analisis Beban Termal',
        items: [
          { label: 'Total Kapasitas Diperlukan', value: `${coolingResult.totalBTU.toLocaleString('id-ID')} BTU/jam` },
          { label: 'Daya Termal Ekuivalen', value: `${coolingResult.kilowatt} kW` },
          { label: 'Tonase Refrigerasi (TR)', value: `${coolingResult.tonnageTR} TR` },
        ],
      },
      {
        heading: 'Rekomendasi Unit Pendingin (AC)',
        items: [
          { label: 'Ukuran PK Disarankan', value: coolingResult.pkRecommendation.labelPK },
          { label: 'Tipe Sistem', value: coolingResult.pkRecommendation.systemType },
          { label: 'Catatan Teknis', value: coolingResult.pkRecommendation.description },
        ],
      },
      {
        heading: 'Estimasi Konsumsi Energi Listrik',
        items: [
          { label: 'AC Non-Inverter', value: `~${coolingResult.estPowerWatts.standard} Watt (Rp ${coolingResult.estMonthlyCostIDR.standard.toLocaleString('id-ID')}/bln)` },
          { label: 'AC Inverter Hemat Energi', value: `~${coolingResult.estPowerWatts.inverter} Watt (Rp ${coolingResult.estMonthlyCostIDR.inverter.toLocaleString('id-ID')}/bln)` },
        ],
      },
    ],
    directNotes: `Diterbitkan oleh ${activeBrand.companyName}. Penanggung jawab: ${activeBrand.directorName} (${activeBrand.phone}).`,
  });

  const reportText = `===========================================
${activeBrand.companyName.toUpperCase()} (${activeBrand.shortName})
${activeBrand.tagline}
Alamat: ${activeBrand.address}, ${activeBrand.city}
Telp/WA: ${activeBrand.phone} | Email: ${activeBrand.email}
Penanggung Jawab Teknik: ${activeBrand.directorName} (${activeBrand.title})
===========================================
LEMBAR SPESIFIKASI TEKNIS BEBAN PENDINGIN RUANG
Standar Rekayasa: ASHRAE 62.1 & SMACNA
Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
===========================================

1. DATA RUANGAN:
   - Dimensi Ruangan: ${length} x ${width} x ${height} ${lengthUnit}
   - Luas Lantai: ${coolingResult.floorArea} ${areaUnit}
   - Volume Ruangan: ${coolingResult.volume} ${volumeUnit}
   - Fungsi / Peruntukan: ${roomType}
   - Estimasi Penghuni: ${occupants} Orang
   - Beban Peralatan Listrik: ${equipmentWattage} Watt

2. HASIL ANALISIS BEBAN TERMAL:
   - Beban Dinding & Ruangan: ${coolingResult.baseAreaBTU.toLocaleString('id-ID')} BTU/h
   - Beban Radiasi Sinar Matahari: ${coolingResult.sunBTU.toLocaleString('id-ID')} BTU/h
   - Beban Kalor Manusia: ${coolingResult.occupantBTU.toLocaleString('id-ID')} BTU/h
   - Beban Kalor Elektronik: ${coolingResult.equipmentBTU.toLocaleString('id-ID')} BTU/h
   - Beban Kaca & Jendela: ${coolingResult.windowBTU.toLocaleString('id-ID')} BTU/h
   -----------------------------------------
   TOTAL KAPASITAS DIBUTUHKAN: ${coolingResult.totalBTU.toLocaleString('id-ID')} BTU/jam
   Daya Termal Ekuivalen: ${coolingResult.kilowatt} kW
   Tonase Refrigerasi (TR): ${coolingResult.tonnageTR} TR

3. REKOMENDASI UNIT PENDINGIN (AC):
   - Ukuran Disarankan: ${coolingResult.pkRecommendation.labelPK}
   - Tipe Sistem Direkomendasikan: ${coolingResult.pkRecommendation.systemType}
   - Catatan Teknis: ${coolingResult.pkRecommendation.description}

4. ESTIMASI KONSUMSI ENERGI:
   - AC Non-Inverter (Standar): ~${coolingResult.estPowerWatts.standard} Watt (Rp ${coolingResult.estMonthlyCostIDR.standard.toLocaleString('id-ID')}/bln)
   - AC Inverter Hemat Energi: ~${coolingResult.estPowerWatts.inverter} Watt (Rp ${coolingResult.estMonthlyCostIDR.inverter.toLocaleString('id-ID')}/bln)
   *Perhitungan berbasis jam operasi normal dan tarif listrik PLN rata-rata.
===========================================
Diterbitkan oleh: ${branding.companyName}
Hormat Kami, ${branding.directorName}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <RtuLogo size={32} branding={branding} idPrefix="spec-modal" />
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Lembar Spesifikasi Teknis HVAC
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilihan Kop: <strong>{activeBrand.companyName}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Kop Surat Brand Selector */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700 text-[11px] font-mono">
              <span className="text-slate-400 px-2 text-[10px] uppercase font-semibold">Kop:</span>
              <button
                onClick={() => setSelectedLetterhead('labtech')}
                className={`px-2 py-1 rounded transition-colors ${
                  selectedLetterhead === 'labtech'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="PT LABTECH PENTA INTERNATIONAL"
              >
                PT Labtech
              </button>
              <button
                onClick={() => setSelectedLetterhead('current')}
                className={`px-2 py-1 rounded transition-colors ${
                  selectedLetterhead === 'current'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={branding.companyName}
              >
                {branding.shortName || 'Brand CV'}
              </button>
            </div>

            <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700 text-xs font-mono">
              <button
                onClick={() => setViewMode('text')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === 'text' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Teks Salin
              </button>
              <button
                onClick={() => setViewMode('letterhead')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === 'letterhead' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Kop Surat
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-sm font-mono ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        {viewMode === 'text' ? (
          <div className="p-6 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950 m-4 rounded border border-slate-800 select-all whitespace-pre-wrap leading-relaxed">
            {reportText}
          </div>
        ) : (
          <div className="p-6 overflow-y-auto m-4 bg-white text-slate-900 rounded-lg shadow-inner max-h-[60vh] space-y-4 font-sans text-xs">
            {/* Kop Surat Header with Vector Logo on Right & Bottom Divider */}
            <div className="pb-3 border-b-2 border-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-950 uppercase text-sm tracking-tight font-sans">
                    {activeBrand.companyName}
                  </h4>
                  {activeBrand.subTagline && (
                    <p className="text-[10px] font-black tracking-widest text-blue-900 uppercase font-mono mt-0.5">
                      {activeBrand.subTagline}
                    </p>
                  )}
                  <p className="text-[11px] font-semibold text-blue-700">{activeBrand.tagline}</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    {activeBrand.address}, {activeBrand.city} · Telp/WA: {activeBrand.phone}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">Email: {activeBrand.email}</p>
                </div>

                <div className="shrink-0 flex flex-col items-end">
                  {selectedLetterhead === 'labtech' ? (
                    <LabtechLogo
                      className="h-12 w-auto"
                      width={180}
                      height={48}
                      showTagline={false}
                      lightBackground={true}
                    />
                  ) : (
                    <RtuLogo size={48} branding={activeBrand} idPrefix="spec-letterhead-logo" isLightMode={true} />
                  )}
                </div>
              </div>

              {/* Multi-tone Divider Bar */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-amber-500 rounded-full mt-3" />
            </div>

            {/* Document Content */}
            <div className="space-y-3 py-2 text-slate-800">
              <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                LEMBAR SPESIFIKASI TEKNIS BEBAN PENDINGIN RUANG
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Dimensi Ruangan:</span>
                  <span className="font-semibold">{length} x {width} x {height} {lengthUnit} ({coolingResult.floorArea} {areaUnit})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fungsi Ruangan:</span>
                  <span className="font-semibold">{roomType} ({occupants} Orang)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Kapasitas Rekomendasi:</span>
                  <span className="font-bold text-blue-700">{coolingResult.pkRecommendation.labelPK} ({coolingResult.totalBTU.toLocaleString('id-ID')} BTU/h)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tonase & Daya Termal:</span>
                  <span className="font-semibold">{coolingResult.tonnageTR} TR / {coolingResult.kilowatt} kW</span>
                </div>
              </div>

              <div className="text-[11px] space-y-1">
                <span className="font-bold block text-slate-900">Rekomendasi Unit Pendingin:</span>
                <p className="text-slate-700">Tipe Sistem: <strong>{coolingResult.pkRecommendation.systemType}</strong>. {coolingResult.pkRecommendation.description}</p>
              </div>

              <div className="pt-4 flex justify-between items-end border-t border-slate-200">
                <div className="text-[10px] text-slate-500">
                  Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="relative text-center w-40">
                  <div className="absolute -top-3 left-0 opacity-70 pointer-events-none transform -rotate-12">
                    <RtuLogo size={70} branding={activeBrand} variant="stamp" isLightMode={true} idPrefix="stamp-spec" />
                  </div>
                  <span className="text-[10px] text-slate-500 block mb-8">Penanggung Jawab Teknik</span>
                  <span className="text-xs font-bold text-slate-900 block underline">{activeBrand.directorName}</span>
                  <span className="text-[10px] text-slate-500 block">{activeBrand.title}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/70">
          <div className="text-xs text-slate-400 font-mono">
            {copied ? (
              <span className="text-emerald-400 font-bold">✓ Teks laporan siap dipaste ke WhatsApp/Email!</span>
            ) : (
              <span>Format teks kompatibel WhatsApp &amp; Email penawaran.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => setIsWaModalOpen(true)}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Share ke WhatsApp</span>
            </button>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 text-xs font-medium rounded transition-all flex items-center gap-2 cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
              }`}
            >
              <span>{copied ? 'Berhasil Disalin! ✓' : 'Salin Semua Teks'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        reportTitle={`Spesifikasi Teknis AC - ${activeBrand.companyName}`}
        messageText={waReportMessage}
      />
    </div>
  );
};
