import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AccessGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessGuideModal: React.FC<AccessGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Use current window location origin, or fallback to default production host
  const appUrl =
    typeof window !== 'undefined' && window.location.href
      ? window.location.href.split('?')[0]
      : 'https://ais-pre-45vwtru3ore5zpc5jwkty5-324614005070.asia-northeast1.run.app';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(appUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs font-mono">
              PWA
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Cara Mengakses & Memasang di HP (Aplikasi Mandiri)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Jadikan tools ini selalu siap pakai di layar utama HP Anda tanpa buka browser berulang kali.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-sm font-mono"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Install Banner if Installable */}
          {isInstallable && (
            <div className="bg-cyan-950/40 border border-cyan-500/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-cyan-300 block">
                  Perangkat Anda Mendukung Instalasi Langsung!
                </span>
                <span className="text-[11px] text-slate-300 mt-0.5 block">
                  Pasang aplikasi ini ke layar utama HP/Komputer hanya dengan satu ketukan:
                </span>
              </div>
              <button
                onClick={install}
                className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-slate-950 font-bold text-xs rounded transition-all shadow-md shadow-cyan-500/20 whitespace-nowrap shrink-0"
              >
                + Pasang Aplikasi Sekarang
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-3 text-xs text-emerald-300 flex items-center gap-2 font-mono">
              <span>✓ Aplikasi ini telah terpasang sebagai aplikasi mandiri di perangkat Anda!</span>
            </div>
          )}

          {/* Section 1: Link & QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-slate-950 p-4 rounded border border-slate-800">
            {/* QR Code */}
            <div className="sm:col-span-4 flex flex-col items-center justify-center text-center">
              {qrDataUrl ? (
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <img
                    src={qrDataUrl}
                    alt="QR Code HVAC Pro"
                    className="w-36 h-36 object-contain"
                  />
                </div>
              ) : (
                <div className="w-36 h-36 bg-slate-900 rounded-lg flex items-center justify-center text-xs text-slate-500">
                  Membuat QR...
                </div>
              )}
              <span className="text-[10px] text-slate-400 font-mono mt-2">
                Scan dengan kamera HP Anda
              </span>
            </div>

            {/* URL & Copy button */}
            <div className="sm:col-span-8 space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block">
                Link Akses Publik (Bisa Dibuka di Perangkat Mana Saja):
              </span>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-xs font-mono text-slate-300 break-all select-all">
                {appUrl}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold'
                  }`}
                >
                  {copied ? 'Tautan Berhasil Disalin! ✓' : 'Salin Tautan'}
                </button>
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                >
                  Buka di Tab Baru ↗
                </a>
              </div>
            </div>
          </div>

          {/* Section 2: Panduan Pasang di PC, Android & iPhone */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300">
              Panduan Pemasangan & Akses Cepat per Perangkat
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Komputer / PC (Windows & Mac) */}
              <div className="bg-slate-950 p-4 rounded border border-cyan-500/40 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                    PC
                  </span>
                  <span className="font-semibold text-white">Komputer / Laptop (Windows & Mac)</span>
                </div>
                <ol className="space-y-1.5 text-slate-300 list-decimal list-inside text-[11px] leading-relaxed">
                  <li>Buka link di <strong>Google Chrome</strong> atau <strong>MS Edge</strong>.</li>
                  <li>Klik ikon <strong>Install</strong> (monitor kecil dengan panah) di ujung kanan bilah alamat URL.</li>
                  <li>Atau klik menu titik tiga <strong>(⋮)</strong> &gt; <em>&quot;Install Kalkulator HVAC Pro&quot;</em>.</li>
                  <li>Aplikasi akan langsung muncul di <strong>Desktop</strong> & <strong>Start Menu</strong> serta bisa di-<strong>Pin ke Taskbar</strong>!</li>
                </ol>
              </div>

              {/* Android Chrome */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    A
                  </span>
                  <span className="font-semibold text-white">HP Android (Google Chrome)</span>
                </div>
                <ol className="space-y-1.5 text-slate-400 list-decimal list-inside text-[11px] leading-relaxed">
                  <li>Buka link aplikasi di <strong>Chrome HP</strong>.</li>
                  <li>Ketuk tombol menu <strong>titik tiga (⋮)</strong> di sudut kanan atas.</li>
                  <li>Pilih <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> / <em>&quot;Install App&quot;</em>.</li>
                  <li>Ikon aplikasi akan otomatis tampil di layar utama HP Anda.</li>
                </ol>
              </div>

              {/* iPhone / iPad Safari */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px]">
                    iOS
                  </span>
                  <span className="font-semibold text-white">iPhone / iPad (Safari)</span>
                </div>
                <ol className="space-y-1.5 text-slate-400 list-decimal list-inside text-[11px] leading-relaxed">
                  <li>Buka link di browser <strong>Safari</strong>.</li>
                  <li>Ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak panah atas).</li>
                  <li>Gulir ke bawah dan ketuk <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                  <li>Ketuk <strong>Add (Tambah)</strong> di sudut kanan atas.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Section 3: Keunggulan PWA */}
          <div className="p-4 bg-slate-950/80 rounded border border-slate-800 text-xs space-y-2">
            <span className="font-semibold text-slate-200 block text-xs">
              Keunggulan Setelah Dipasang di HP:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-400">
              <div className="space-y-0.5">
                <span className="text-cyan-400 font-semibold block">📱 Layar Penuh (Stand-Alone)</span>
                <p>Tampilan bersih seperti aplikasi native tanpa bilah alamat URL browser.</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-cyan-400 font-semibold block">⚡ Akses Cepat 1 Ketukan</span>
                <p>Langsung dibuka dari ikon di layar depan HP Anda kapan saja saat di lokasi survei proyek.</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-cyan-400 font-semibold block">📶 Tetap Bisa Dibuka Offline</span>
                <p>Aset inti dicache sehingga tetap bisa berhitung meski di basement atau saat sinyal lemah.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
