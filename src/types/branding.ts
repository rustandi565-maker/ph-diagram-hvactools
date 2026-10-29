export interface CompanyBranding {
  companyName: string;
  shortName: string; // e.g. "RTU" or "LABTECH"
  tagline: string;
  subTagline?: string; // e.g. "KNOWLEDGE ENGINEERING"
  directorName: string;
  title: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  colorScheme: 'arctic_cyan' | 'deep_navy' | 'emerald_eco' | 'frost_gold';
  logoUrl?: string; // e.g. "/assets/aistudio/image_405f34fc.png"
}

export interface BrandPreset {
  id: string;
  companyName: string;
  shortName: string;
  tagline: string;
  subTagline?: string;
  philosophy: string;
  colorScheme: 'arctic_cyan' | 'deep_navy' | 'emerald_eco' | 'frost_gold';
  targetMarket: string;
  logoUrl?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

export const LABTECH_BRANDING: CompanyBranding = {
  companyName: 'PT LABTECH PENTA INTERNATIONAL',
  shortName: 'LABTECH',
  tagline: 'KNOWLEDGE ENGINEERING',
  subTagline: 'KNOWLEDGE ENGINEERING',
  directorName: 'Technical & Training Division',
  title: 'Lead Testing & Commissioning Engineer',
  phone: '+62 778 392800',
  email: 'support@labtech.org',
  address: 'Kavling 34 Industri Sekupang',
  city: 'Batam, INDONESIA 29422',
  colorScheme: 'frost_gold',
  logoUrl: '/assets/aistudio/image_405f34fc.png',
};

export const BRAND_PRESETS: BrandPreset[] = [
  {
    id: 'labtech',
    companyName: 'PT LABTECH PENTA INTERNATIONAL',
    shortName: 'LABTECH',
    tagline: 'KNOWLEDGE ENGINEERING',
    subTagline: 'KNOWLEDGE ENGINEERING',
    philosophy:
      'Pelopor global dalam pengembangan sistem pelatihan teknik kejuruan dan teknologi rekayasa refrigerasi/tata udara internasional berbasis di Batam.',
    colorScheme: 'frost_gold',
    targetMarket: 'Institusi Vokasi, Balai Latihan Kerja, Universitas Teknik, & Industri Manufaktur Global',
    logoUrl: '/assets/aistudio/image_405f34fc.png',
    address: 'Kavling 34 Industri Sekupang',
    city: 'Batam, INDONESIA 29422',
    phone: '+62 778 392800',
    email: 'support@labtech.org',
  },
  {
    id: 'rtu',
    companyName: 'CV. Rustandi Teknik Utama',
    shortName: 'RTU',
    tagline: 'Solusi Rekayasa Tata Udara & Cold Storage',
    philosophy:
      'Nama "Rustandi" membawa integritas personal dan rasa tanggung jawab tinggi dari pemilik. "Teknik Utama" menegaskan keahlian rekayasa termodinamika nomor satu. Akronim RTU juga identik dengan "Rooftop Unit" dalam standar teknik HVAC global, menjadikannya sangat mudah diingat dan berwibawa di mata klien industri.',
    colorScheme: 'arctic_cyan',
    targetMarket: 'Kontraktor HVAC, Cold Storage Industri, Ruang Operasi Rumah Sakit, & Komersial',
  },
  {
    id: 'arm',
    companyName: 'CV. Arktik Rekayasa Mandiri',
    shortName: 'ARM',
    tagline: 'Presisi Pendinginan & Efisiensi Energi Termal',
    philosophy:
      '"Arktik" merefleksikan temperatur dingin ekstrem yang stabil, bersih, dan murni. "Rekayasa Mandiri" menunjukkan kapabilitas engineering independen yang mampu merancang sistem kaskade dan cold storage custom tanpa ketergantungan pihak ketiga.',
    colorScheme: 'deep_navy',
    targetMarket: 'Pabrik Pembekuan Ikan, Cold Chain Daging, & Gudang Logistik Suhu Rendah',
  },
  {
    id: 'pdt',
    companyName: 'CV. Polar Dinamika Teknik',
    shortName: 'PDT',
    tagline: 'Engineering Refrigerasi & Otomasi Kontrol Suhu',
    philosophy:
      '"Polar" merujuk pada kutub bumi dan titik nol beku presisi. "Dinamika" melambangkan kecepatan respons servis, sirkulasi fluida refrigerant optimal, dan adaptasi teknologi inverter modern.',
    colorScheme: 'frost_gold',
    targetMarket: 'Supermarket Chain, Industri Farmasi (Clean Room), & Sentra Pengolahan Susu',
  },
  {
    id: 'sintu',
    companyName: 'CV. Sinergi Tata Udara',
    shortName: 'SINTU',
    tagline: 'Kenyamanan Termal & Sirkulasi Udara Higienis',
    philosophy:
      '"Sinergi" menekankan harmoni antara efisiensi konsumsi listrik hemat energi dan kenyamanan udara bersih sehat sesuai standar ASHRAE 62.1.',
    colorScheme: 'emerald_eco',
    targetMarket: 'Gedung Perkantoran, Hotel, Pabrik Makanan (HACCP), & Rumah Sakit',
  },
];

export const DEFAULT_BRANDING: CompanyBranding = {
  companyName: 'CV. Rustandi Teknik Utama',
  shortName: 'RTU',
  tagline: 'Solusi Rekayasa Tata Udara & Cold Storage',
  directorName: 'Rustandi, S.T.',
  title: 'Managing Director / HVAC-R Lead Engineer',
  phone: '+6281363100055',
  email: 'rustandi565@gmail.com',
  address: 'Perum Glory Tanjung Riau, Blok F25',
  city: 'Batam, Kepulauan Riau, Indonesia',
  colorScheme: 'arctic_cyan',
};
