import React, { useState } from 'react';
import { triggerWhatsAppShare, getWhatsAppShareUrl } from '../utils/whatsappShare';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  messageText: string;
  defaultPhone?: string;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  messageText,
  defaultPhone = '',
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>(defaultPhone);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSend = () => {
    triggerWhatsAppShare(messageText, phoneNumber);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const directUrl = getWhatsAppShareUrl(messageText, phoneNumber);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            {/* WhatsApp Authentic SVG Icon */}
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-5 h-5 text-emerald-600 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">Kirim Laporan ke WhatsApp</h3>
              <p className="text-[11px] text-emerald-100 font-mono truncate max-w-[280px]">
                {reportTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs font-mono">
          {/* Optional Phone Number Input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span>Nomor WhatsApp Tujuan (Opsional):</span>
              <span className="text-[10px] text-slate-400 font-normal">Kosongkan untuk memilih kontak di WhatsApp</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">📱</span>
              <input
                type="text"
                placeholder="Contoh: 08123456789 atau 62812..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-white outline-hidden text-xs"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              *Jika diisi, WhatsApp akan langsung membuka ruang chat dengan nomor tersebut. Jika kosong, Anda dapat memilih chat, grup, atau status.
            </p>
          </div>

          {/* Formatted Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span>Pratinjau Pesan WhatsApp:</span>
              <span className="text-[10px] text-emerald-400 font-bold">Auto-Markdown Format</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto text-[11px] text-slate-300 whitespace-pre-wrap select-all leading-relaxed scrollbar-thin">
              {messageText}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-950/80 border-t border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <button
            onClick={handleCopy}
            className={`px-3.5 py-2 text-xs font-mono font-medium rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              copied
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <span>{copied ? '✓ Teks Tersalin!' : '📋 Salin Teks'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-mono text-slate-400 hover:text-white transition cursor-pointer"
            >
              Batal
            </button>

            {/* Direct Open Link via <a> tag for maximum mobile & web reliability */}
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Kirim ke WhatsApp ➔</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
