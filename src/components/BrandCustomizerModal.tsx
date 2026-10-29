import React, { useRef, useState } from 'react';
import { BRAND_PRESETS, CompanyBranding } from '../types/branding';
import { RtuLogo } from './RtuLogo';

interface BrandCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: CompanyBranding;
  onUpdateBranding: (updates: Partial<CompanyBranding>) => void;
  onApplyPreset: (presetId: string) => void;
  onReset: () => void;
}

export const BrandCustomizerModal: React.FC<BrandCustomizerModalProps> = ({
  isOpen,
  onClose,
  branding,
  onUpdateBranding,
  onApplyPreset,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'customize' | 'logos' | 'presets' | 'letterhead'>('logos');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // References for SVG downloads
  const iconSvgRef = useRef<HTMLDivElement>(null);
  const stampSvgRef = useRef<HTMLDivElement>(null);
  const badgeSvgRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Helper to trigger SVG download
  const downloadSvg = (containerRef: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(`SVG "${filename}.svg" berhasil diunduh!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Helper to render SVG onto Canvas and download high-res PNG
  const downloadPng = (
    containerRef: React.RefObject<HTMLDivElement | null>,
    filename: string,
    width = 1024,
    height = 1024
  ) => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${filename}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pngUrl);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
      setDownloadSuccess(`PNG Resolusi Tinggi "${filename}.png" berhasil diunduh!`);
      setTimeout(() => setDownloadSuccess(null), 3000);
    };
    img.src = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <RtuLogo size={36} branding={branding} idPrefix="modal-title-logo" />
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Studio Identitas &amp; Logo CV Kontraktor HVAC-R
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono px-2 py-0.5 rounded">
                  Branding Resmi
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kelola identitas merek, logo vektor, stempel resmi, dan kop surat untuk lembar penawaran teknis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Tutup"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('logos')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'logos'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🛡️ Koleksi &amp; Unduh Logo Vektor
          </button>
          <button
            onClick={() => setActiveTab('customize')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'customize'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ✏️ Sesuaikan Identitas Brand
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'presets'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            💡 Inspirasi Brand CV &amp; Makna
          </button>
          <button
            onClick={() => setActiveTab('letterhead')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'letterhead'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📄 Preview Kop Surat &amp; Penawaran
          </button>
        </div>

        {/* Notification Toast */}
        {downloadSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 px-6 py-2 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <span>✓ {downloadSuccess}</span>
            <button onClick={() => setDownloadSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: KOLEKSI & UNDUH LOGO */}
          {activeTab === 'logos' && (
            <div className="space-y-6">
              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <p>
                  Berikut adalah paket logo profesional lengkap untuk <strong>{branding.companyName}</strong>.
                  Setiap logo dirancang dengan standar vektor SVG murni sehingga tajam di semua ukuran—mulai dari kop surat,
                  bordir seragam teknisi, stempel resmi, hingga cetak billboard workshop.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Variant 1: Hexagonal Shield Icon */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 flex flex-col items-center justify-between text-center space-y-4">
                  <span className="text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                    Logo Utama (Shield Hexagon)
                  </span>
                  <div ref={iconSvgRef} className="py-2">
                    <RtuLogo size={140} branding={branding} idPrefix="down-shield" />
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p className="font-semibold text-slate-200">Monogram: {branding.shortName}</p>
                    <p className="text-[11px]">Format aplikasi, avatar medsos, &amp; icon aplikasi</p>
                  </div>
                  <div className="flex items-center gap-2 w-full pt-2">
                    <button
                      onClick={() => downloadSvg(iconSvgRef, `Logo_${branding.shortName}_Shield`)}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition-colors font-mono"
                    >
                      Unduh SVG
                    </button>
                    <button
                      onClick={() => downloadPng(iconSvgRef, `Logo_${branding.shortName}_Shield`, 1024, 1024)}
                      className="flex-1 px-3 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded transition-colors font-mono"
                    >
                      Unduh PNG
                    </button>
                  </div>
                </div>

                {/* Variant 2: Cap Stempel Resmi CV */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 flex flex-col items-center justify-between text-center space-y-4">
                  <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-wider">
                    Cap Stempel Resmi CV
                  </span>
                  <div ref={stampSvgRef} className="py-2">
                    <RtuLogo size={140} branding={branding} variant="stamp" idPrefix="down-stamp" />
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p className="font-semibold text-slate-200">Stempel Basah Tinta Biru</p>
                    <p className="text-[11px]">Untuk SPK, kwitansi, invoice, &amp; kontrak penawaran</p>
                  </div>
                  <div className="flex items-center gap-2 w-full pt-2">
                    <button
                      onClick={() => downloadSvg(stampSvgRef, `Stempel_Resmi_${branding.shortName}`)}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition-colors font-mono"
                    >
                      Unduh SVG
                    </button>
                    <button
                      onClick={() => downloadPng(stampSvgRef, `Stempel_Resmi_${branding.shortName}`, 1024, 1024)}
                      className="flex-1 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded transition-colors font-mono"
                    >
                      Unduh PNG
                    </button>
                  </div>
                </div>

                {/* Variant 3: Embroidered Technician Badge */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 flex flex-col items-center justify-between text-center space-y-4">
                  <span className="text-[11px] font-mono font-semibold text-amber-400 uppercase tracking-wider">
                    Badge Seragam / Wearpack
                  </span>
                  <div ref={badgeSvgRef} className="py-2">
                    <RtuLogo size={140} branding={branding} variant="badge" idPrefix="down-badge" />
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p className="font-semibold text-slate-200">Patch Bordir Teknisi Lapangan</p>
                    <p className="text-[11px]">Ideal untuk seragam kemeja, wearpack, atau stiker unit</p>
                  </div>
                  <div className="flex items-center gap-2 w-full pt-2">
                    <button
                      onClick={() => downloadSvg(badgeSvgRef, `Badge_Wearpack_${branding.shortName}`)}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition-colors font-mono"
                    >
                      Unduh SVG
                    </button>
                    <button
                      onClick={() => downloadPng(badgeSvgRef, `Badge_Wearpack_${branding.shortName}`, 1024, 1024)}
                      className="flex-1 px-3 py-1.5 text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded transition-colors font-mono"
                    >
                      Unduh PNG
                    </button>
                  </div>
                </div>
              </div>

              {/* Horizontal Brandmark Preview */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-3">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                  Preview Brandmark Horizontal (Header &amp; Signboard Workshop)
                </span>
                <div className="p-4 bg-slate-900 rounded-md border border-slate-800 flex items-center justify-center">
                  <RtuLogo size={52} branding={branding} variant="horizontal" idPrefix="down-horiz" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SESUAIKAN IDENTITAS BRAND */}
          {activeTab === 'customize' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Nama Perusahaan (CV / PT)</label>
                  <input
                    type="text"
                    value={branding.companyName}
                    onChange={(e) => onUpdateBranding({ companyName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-hidden"
                    placeholder="Contoh: CV. Rustandi Teknik Utama"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Singkatan Monogram (2-4 Huruf)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={branding.shortName}
                    onChange={(e) => onUpdateBranding({ shortName: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white font-mono uppercase focus:outline-hidden"
                    placeholder="Contoh: RTU"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Slogan / Tagline Keunggulan</label>
                  <input
                    type="text"
                    value={branding.tagline}
                    onChange={(e) => onUpdateBranding({ tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-hidden"
                    placeholder="Contoh: Solusi Rekayasa Tata Udara & Cold Storage"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Nama Direktur / Lead Engineer</label>
                  <input
                    type="text"
                    value={branding.directorName}
                    onChange={(e) => onUpdateBranding({ directorName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-hidden"
                    placeholder="Contoh: Rustandi, S.T."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Jabatan Penandatangan</label>
                  <input
                    type="text"
                    value={branding.title}
                    onChange={(e) => onUpdateBranding({ title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-hidden"
                    placeholder="Contoh: Managing Director / HVAC-R Lead Engineer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={branding.phone}
                    onChange={(e) => onUpdateBranding({ phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-hidden"
                    placeholder="+62 812-xxxx-xxxx"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Email Resmi</label>
                  <input
                    type="email"
                    value={branding.email}
                    onChange={(e) => onUpdateBranding({ email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-hidden"
                    placeholder="kontak@perusahaan.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Alamat Kantor / Workshop</label>
                  <input
                    type="text"
                    value={branding.address}
                    onChange={(e) => onUpdateBranding({ address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-hidden"
                    placeholder="Jl. Raya Industri No. ..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Kota &amp; Provinsi</label>
                  <input
                    type="text"
                    value={branding.city}
                    onChange={(e) => onUpdateBranding({ city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white focus:outline-hidden"
                    placeholder="Jakarta / Surabaya, Indonesia"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-mono text-slate-300">Skema Warna Brand Logo</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'arctic_cyan', label: 'Arctic Cyan', sub: 'Modern & Refrigerant', colors: ['#38bdf8', '#0284c7', '#fbbf24'] },
                      { id: 'deep_navy', label: 'Deep Navy', sub: 'Industrial & Heavy Duty', colors: ['#60a5fa', '#1d4ed8', '#38bdf8'] },
                      { id: 'emerald_eco', label: 'Eco Emerald', sub: 'Energy Efficient & Green', colors: ['#34d399', '#047857', '#38bdf8'] },
                      { id: 'frost_gold', label: 'Frost & Gold', sub: 'Premium & Engineering', colors: ['#fbbf24', '#b45309', '#38bdf8'] },
                    ].map((theme) => {
                      const isSel = branding.colorScheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => onUpdateBranding({ colorScheme: theme.id as any })}
                          className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                            isSel
                              ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400/50'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            {theme.colors.map((c, i) => (
                              <span key={i} className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-white">{theme.label}</span>
                          <span className="text-[10px] text-slate-400">{theme.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onReset}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
                >
                  Kembalikan ke Default RTU
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('logos')}
                  className="px-4 py-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded transition-colors"
                >
                  Simpan &amp; Lihat Logo ➔
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: INSPIRASI BRAND & FILOSOFI */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-xs text-slate-300">
                <p>
                  Nama brand CV teknik yang baik harus mudah diucapkan, memiliki akronim yang kuat, dan memancarkan reputasi
                  teknis yang dapat diandalkan oleh pemilik pabrik, manajer gedung, maupun kontraktor utama.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BRAND_PRESETS.map((preset) => {
                  const isCurrent = branding.companyName === preset.companyName;
                  return (
                    <div
                      key={preset.id}
                      className={`border rounded-lg p-5 flex flex-col justify-between space-y-4 transition-all ${
                        isCurrent
                          ? 'border-cyan-500 bg-cyan-950/20 shadow-md shadow-cyan-950/50'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-sm font-bold text-white block">{preset.companyName}</span>
                            <span className="text-xs text-cyan-400 font-medium">{preset.tagline}</span>
                          </div>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {preset.shortName}
                          </span>
                        </div>
                        <div className="pt-2 text-xs text-slate-400 space-y-2 leading-relaxed">
                          <p><strong className="text-slate-300">Filosofi &amp; Makna:</strong> {preset.philosophy}</p>
                          <p><strong className="text-slate-300">Target Pasar:</strong> {preset.targetMarket}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onApplyPreset(preset.id)}
                        disabled={isCurrent}
                        className={`w-full py-2 text-xs font-medium rounded transition-all font-mono ${
                          isCurrent
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default'
                            : 'bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isCurrent ? '✓ Sedang Digunakan' : 'Gunakan Brand Ini'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PREVIEW KOP SURAT RESMI */}
          {activeTab === 'letterhead' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Berikut adalah contoh kop surat resmi CV yang otomatis tercetak saat mengekspor laporan rancangan teknis.
                </p>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded transition-colors font-mono flex items-center gap-1.5"
                >
                  <span>🖨️ Cetak / Print Halaman</span>
                </button>
              </div>

              {/* Realistic White Paper Letterhead Preview */}
              <div className="bg-white text-slate-900 rounded-lg p-8 shadow-xl border border-slate-200 font-sans max-w-2xl mx-auto">
                {/* Kop Surat Header */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
                  <div className="flex items-center gap-4">
                    <RtuLogo size={56} branding={branding} idPrefix="paper-logo" isLightMode={true} />
                    <div>
                      <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">
                        {branding.companyName}
                      </h1>
                      <p className="text-xs font-semibold text-blue-700 tracking-wide">
                        {branding.tagline}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {branding.address} · {branding.city} · Telp/WA: {branding.phone}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Email: {branding.email}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      KODE REG. CV
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      NIB/HVAC-2026/01
                    </span>
                  </div>
                </div>

                {/* Letter Body Mock */}
                <div className="py-6 space-y-4 text-xs text-slate-700 leading-relaxed">
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>Lampiran: Lembar Perhitungan Beban Pendingin &amp; Cold Storage</span>
                    <span>Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>

                  <p>
                    Dengan hormat,<br />
                    Bersama lembar ini kami sampaikan hasil rancangan teknik rekayasa termal dan spesifikasi peralatan
                    mesin pendingin untuk kebutuhan proyek pelanggan dengan standar ketat ASHRAE dan SMACNA.
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimasi Kapasitas:</span>
                      <span className="font-bold text-slate-800">Sesuai Kalkulasi Sistem</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kontraktor Pelaksana:</span>
                      <span className="font-bold text-slate-800">{branding.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Penanggung Jawab Teknik:</span>
                      <span className="font-bold text-slate-800">{branding.directorName}</span>
                    </div>
                  </div>
                </div>

                {/* Signature & Official Stamp Section */}
                <div className="pt-4 flex justify-between items-end border-t border-slate-200">
                  <div className="text-[10px] text-slate-400">
                    Dokumen sah diterbitkan secara digital oleh sistem rekayasa HVAC Pro.
                  </div>
                  <div className="relative flex flex-col items-center w-52 text-center">
                    <span className="text-[11px] text-slate-600 mb-10">Hormat Kami,</span>
                    
                    {/* Floating Rubber Stamp Impression */}
                    <div className="absolute top-1 -left-2 opacity-80 pointer-events-none transform -rotate-12">
                      <RtuLogo size={90} branding={branding} variant="stamp" isLightMode={true} idPrefix="paper-stamp" />
                    </div>

                    <span className="text-xs font-bold text-slate-900 underline decoration-slate-400 underline-offset-4">
                      {branding.directorName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {branding.title}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>Merek Aktif:</span>
            <span className="text-white font-bold">{branding.companyName}</span>
            <span className="text-cyan-400 font-bold">({branding.shortName})</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors text-xs font-medium"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
