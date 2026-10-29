/**
 * WhatsApp Sharing Utilities for HVAC & Thermal Engineering Reports
 */

export interface WhatsAppSection {
  heading?: string;
  title?: string;
  items: { label: string; value: string }[];
}

export interface WhatsAppShareOptions {
  title?: string;
  reportTitle?: string;
  docNumber?: string;
  productName?: string;
  modelUnit?: string;
  workOrderNumber?: string;
  projectName?: string;
  date?: string;
  companyName?: string;
  companyPhone?: string;
  reportMeta?: {
    productName?: string;
    trainerName?: string;
    modelUnit?: string;
    workOrderNumber?: string;
    projectName?: string;
    reportDate?: string;
    conclusion?: string;
  };
  sections?: WhatsAppSection[];
  summarySections?: WhatsAppSection[];
  customSummaryText?: string;
  directNotes?: string;
  footerNote?: string;
  appUrl?: string;
}

/**
 * Clean and format Indonesian/international phone numbers for WhatsApp
 */
export function sanitizeWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Builds professional WhatsApp message text with markdown and icons
 */
export function buildWhatsAppReportMessage(options: WhatsAppShareOptions): string {
  const lines: string[] = [];
  const appUrl = options.appUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const mainTitle = options.reportTitle || options.title || 'LAPORAN TEKNIS REKAYASA TERMAL';
  const meta = options.reportMeta || {};
  const productName = meta.productName || meta.trainerName || options.productName;
  const modelUnit = meta.modelUnit || options.modelUnit;
  const workOrderNumber = meta.workOrderNumber || options.workOrderNumber;
  const projectName = meta.projectName || options.projectName;
  const date = meta.reportDate || options.date;
  const sectionsList = options.summarySections || options.sections || [];

  // Header Banner
  lines.push(`*========================================*`);
  lines.push(`📄 *${mainTitle.toUpperCase()}*`);
  if (options.companyName) {
    lines.push(`🏢 _${options.companyName}_`);
  }
  lines.push(`*========================================*`);
  lines.push(``);

  // Identity / Administrative metadata
  lines.push(`📋 *INFORMASI ADMINISTRASI & IDENTITAS:*`);
  if (workOrderNumber) lines.push(`• *No. SPK / WO:* ${workOrderNumber}`);
  if (options.docNumber) lines.push(`• *No. Dokumen:* ${options.docNumber}`);
  if (productName) lines.push(`• *Nama Produk / Unit:* ${productName}`);
  if (modelUnit) lines.push(`• *Model / Unit:* ${modelUnit}`);
  if (projectName) lines.push(`• *Nama Pekerjaan:* ${projectName}`);
  if (date) lines.push(`• *Tanggal Uji / Laporan:* ${date}`);
  lines.push(``);

  // Custom summary text or structured sections
  if (options.customSummaryText) {
    lines.push(`📊 *RINGKASAN HASIL TEKNIS:*`);
    lines.push(options.customSummaryText);
    lines.push(``);
  }

  if (sectionsList && sectionsList.length > 0) {
    sectionsList.forEach((sec) => {
      const sectionHeading = sec.heading || sec.title || 'RINGKASAN TEKNIS';
      lines.push(`⚙️ *${sectionHeading.toUpperCase()}:*`);
      sec.items.forEach((item) => {
        lines.push(`  • ${item.label}: *${item.value}*`);
      });
      lines.push(``);
    });
  }

  if (options.directNotes) {
    lines.push(`📝 *EVALUASI & REKOMENDASI TEKNIS:*`);
    lines.push(`_${options.directNotes}_`);
    lines.push(``);
  }

  if (options.footerNote) {
    lines.push(`💡 _${options.footerNote}_`);
    lines.push(``);
  }

  // Footer & Verification note
  lines.push(`----------------------------------------`);
  lines.push(`✅ _Dokumen dihitung & diverifikasi secara otomatis oleh sistem rekayasa termal._`);
  if (appUrl) {
    lines.push(`🔗 Buka kalkulator online: ${appUrl}`);
  }
  lines.push(`*========================================*`);

  return lines.join('\n');
}

/**
 * Generate standard WhatsApp URL
 */
export function getWhatsAppShareUrl(text: string, phoneNumber?: string): string {
  const encodedText = encodeURIComponent(text);
  if (phoneNumber && phoneNumber.trim().length > 0) {
    const cleanPhone = sanitizeWhatsAppNumber(phoneNumber);
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Triggers WhatsApp share safely in browser/iframe environments
 */
export function triggerWhatsAppShare(text: string, phoneNumber?: string): void {
  const url = getWhatsAppShareUrl(text, phoneNumber);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
