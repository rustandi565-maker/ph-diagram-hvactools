export type AppLanguage = 'id' | 'en' | 'jv' | 'su';

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  flag: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'id', name: 'Indonesia', flag: '🇮🇩', nativeName: 'Bahasa Indonesia' },
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English (US/UK)' },
  { code: 'jv', name: 'Jawa', flag: 'ꦗ', nativeName: 'Basa Jawa' },
  { code: 'su', name: 'Sunda', flag: 'ᮞ', nativeName: 'Basa Sunda' },
];

export interface TranslationDict {
  // Navigation & General
  appTitle: string;
  subtitle: string;
  coldRoom: string;
  evapCoil: string;
  phDiagram: string;
  heatExchanger: string;
  cascade: string;
  coolingLoad: string;
  ventilation: string;
  ductSizing: string;
  psychrometric: string;
  unitConverter: string;
  glossary: string;
  installGuide: string;
  brandCustomizer: string;
  exportReport: string;
  languageSelect: string;
  plantTesting: string;
  piping3d: string;

  // P-H Calculator Section
  phCalcTitle: string;
  phCalcSubtitle: string;
  officialStandard: string;
  printOfficialReport: string;
  copyTextReport: string;
  copiedSuccess: string;

  // Report Identity Fields
  reportIdentityTitle: string;
  reportIdentityNote: string;
  productName: string;
  modelUnit: string;
  workOrderNumber: string;
  projectName: string;
  dateOfReport: string;

  // Refrigerant Selector
  selectRefrigerant: string;
  refrigerantSimpleNotice: string;
  prevRefrigerant: string;
  nextRefrigerant: string;
  refCategory: string;
  safetyClass: string;
  boilingPoint: string;
  criticalTemp: string;
  criticalPressure: string;
  gwpValue: string;
  typicalApplication: string;
  quickPresets: string;

  // P-H Inputs
  inputsTitle: string;
  suctionPressure: string;
  dischargePressure: string;
  suctionTemp: string;
  dischargeTemp: string;
  liquidTempTXV: string;
  compressorPower: string;
  superheatDegree: string;
  dischargeSuperheatDegree: string;
  subcoolingDegree: string;

  // Flow & Capacity Units
  massFlowKgS: string;
  massFlowKgH: string;
  liquidFlowLpm: string;
  liquidVolumeVl: string;
  lpmFormulaExplanation: string;
  coolingCapacity: string;
  refrigeratingEffect: string;
  compressionWork: string;
  heatRejection: string;
  pressureRatio: string;
  copActual: string;
  copCarnot: string;
  secondLawEfficiency: string;
  isentropicEfficiency: string;
  eerTitle: string;
  eerUnit: string;
  eerStarRating: string;

  // State Points
  point1Title: string;
  point1Desc: string;
  point2Title: string;
  point2Desc: string;
  point3Title: string;
  point3Desc: string;
  point3IntersectionNote: string;
  point4Title: string;
  point4Desc: string;
  vaporQuality: string;

  // Diagram labels
  domeKubah: string;
  isothermLine: string;
  isentropicLine: string;
  isochoricLine: string;
  cycle1234: string;
  subcooledRegion: string;
  twoPhaseRegion: string;
  superheatedRegion: string;
  saturatedLiquidLine: string;
  saturatedVaporLine: string;
  specificEnthalpyAxis: string;
  absolutePressureAxis: string;

  // Report Modal & Tables
  officialTestReport: string;
  sectionA: string;
  sectionB: string;
  sectionC: string;
  sectionD: string;
  sectionE: string;
  conclusionTitle: string;
  conclusionEditNotice: string;
  approvalTitle: string;
  checkColumn: string;
  reviewColumn: string;
  approvedColumn: string;
  signatureDate: string;
  tableColPoint: string;
  tableColPosition: string;
  tableColPressure: string;
  tableColEnthalpy: string;
  tableColTemp: string;
  tableColPhase: string;
  tableColSpecVol: string;
  tableColEntropy: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDict> = {
  id: {
    appTitle: 'Kalkulator HVAC & Cold Room Pro',
    subtitle: 'Solusi Rekayasa Tata Udara & Cold Storage',
    coldRoom: '🏬 Cold Room',
    evapCoil: '🌀 Koil Pipa Convector',
    phDiagram: '📊 Diagram P-h',
    heatExchanger: '🔥 Heat Exchanger (HE)',
    cascade: '❄️ Sistem Kaskade',
    coolingLoad: 'Beban AC (BTU/PK)',
    ventilation: 'Ventilasi & CFM',
    ductSizing: 'Saluran Duct',
    psychrometric: 'Psikrometrik',
    unitConverter: 'Konverter',
    glossary: 'Glosarium',
    installGuide: '💻 Pasang di PC & HP',
    brandCustomizer: '🎨 Logo & Brand CV',
    exportReport: 'Salin Lembar Teknis',
    languageSelect: 'Pilih Bahasa',
    plantTesting: '🏭 Uji Chiller, CT & AHU',
    piping3d: '🧊 Animasi 3D Piping & Kompresor',

    phCalcTitle: 'Kalkulator Performa Refrigerasi & Diagram Log P - h',
    phCalcSubtitle: 'Input data aktual lapangan (Tekanan & Suhu Suction, Discharge, Liquid sebelum TXV, serta Daya Kompresor) untuk analisis termodinamika lengkap dan cetak laporan resmi.',
    officialStandard: 'Standar ASHRAE 15 / 34 & Termodinamika Teknik',
    printOfficialReport: 'Cetak / Print Laporan Resmi PDF',
    copyTextReport: 'Salin Ringkasan Teks',
    copiedSuccess: 'Berhasil Disalin! ✓',

    reportIdentityTitle: '1. Kolom Input Identitas Laporan Pengujian',
    reportIdentityNote: '* Data identitas ini dicantumkan pada bagian kop atas laporan pengujian',
    productName: 'Product Name',
    modelUnit: 'Model Unit',
    workOrderNumber: 'Work Order Number',
    projectName: 'Project',
    dateOfReport: 'Date of Report',

    selectRefrigerant: 'Pilih Jenis Refrigerant (Satu per Satu):',
    refrigerantSimpleNotice: 'Pilihan refrigerant ringkas satu per satu dengan data termodinamika instan',
    prevRefrigerant: 'Sebelumnya',
    nextRefrigerant: 'Berikutnya',
    refCategory: 'Kategori',
    safetyClass: 'Kelas Keamanan',
    boilingPoint: 'Titik Didih Normal (NBP)',
    criticalTemp: 'Suhu Kritis (T_crit)',
    criticalPressure: 'Tekanan Kritis (P_crit)',
    gwpValue: 'GWP',
    typicalApplication: 'Aplikasi Tipikal',
    quickPresets: '⚡ Preset Cepat Praktikum:',

    inputsTitle: '2. Data Input Pengukuran Siklus (P-h Diagram Input)',
    suctionPressure: 'Suction Pressure (P_suction / P_evap)',
    dischargePressure: 'Discharge Pressure (P_discharge / P_cond)',
    suctionTemp: 'Temperature Suction (T1 - Sebelum Kompresor)',
    dischargeTemp: 'Temperature Discharge (T2 - Gas Panas Keluar Kompresor)',
    liquidTempTXV: 'Temperature Liquid Sebelum Expansi (T3 - Masuk TXV)',
    compressorPower: 'Power Compressor (Daya Masukan Kompresor)',
    superheatDegree: 'Derajat Superheat',
    dischargeSuperheatDegree: 'Superheat Gas Buang',
    subcoolingDegree: 'Derajat Subcooling',

    massFlowKgS: 'Laju Aliran Massa (kg/s)',
    massFlowKgH: 'Laju Aliran Massa (kg/jam)',
    liquidFlowLpm: 'Laju Aliran Volumetrik Cairan (LPM)',
    liquidVolumeVl: 'Volume Spesifik Cairan Vl (dm³/kg pada T3)',
    lpmFormulaExplanation: 'Rumus: (kg/s × dm³/kg × 60) | Vl dari tabel saturasi suhu T3',
    coolingCapacity: 'Kapasitas Pendinginan (Qe)',
    refrigeratingEffect: 'Efek Refrigerasi (q_e = h1 - h4)',
    compressionWork: 'Kerja Kompresi (w_c = h2 - h1)',
    heatRejection: 'Kalor Dibuang Kondensor (q_c = h2 - h3)',
    pressureRatio: 'Rasio Kompresi (P_dis / P_suc)',
    copActual: 'COP Aktual Siklus Pendingin',
    copCarnot: 'COP Carnot Teoritis Maksimal',
    secondLawEfficiency: 'Efisiensi Hukum Kedua (Eksergi)',
    isentropicEfficiency: 'Efisiensi Isentropik Kompresor',
    eerTitle: 'Energy Efficiency Ratio (EER)',
    eerUnit: 'Btu/(h·W)',
    eerStarRating: 'Tingkat Bintang SKEM ESDM',

    point1Title: 'Titik 1: Suction Kompresor',
    point1Desc: 'Uap hisap masuk kompresor (T1, P_suction)',
    point2Title: 'Titik 2: Discharge Kompresor',
    point2Desc: 'Gas panas buang bertekanan tinggi (T2, P_discharge)',
    point3Title: 'Titik 3: Liquid Sebelum Ekspansi (TXV)',
    point3Desc: 'Cairan kondensor sebelum katup ekspansi TXV (T3, P_discharge)',
    point3IntersectionNote: 'Perpotongan garis Discharge Pressure (P_dis) dan isoterma Suhu Liquid TXV (T3)',
    point4Title: 'Titik 4: Inlet Evaporator',
    point4Desc: 'Campuran 2 fasa keluar ekspansi isentalpi (h4 = h3, P_suction)',
    vaporQuality: 'Kualitas Uap (x)',

    domeKubah: 'Kubah Saturasi (x=0 & x=1)',
    isothermLine: 'Isotermal (T = const)',
    isentropicLine: 'Entropi Konstan (s)',
    isochoricLine: 'Volume Spesifik (v)',
    cycle1234: 'Siklus Refrigerasi (1-2-3-4)',
    subcooledRegion: 'Daerah Cairan Subcooled',
    twoPhaseRegion: 'Campuran 2 Fasa (Cair + Uap)',
    superheatedRegion: 'Uap Superheated',
    saturatedLiquidLine: 'Garis Cair Jenuh (x = 0)',
    saturatedVaporLine: 'Garis Uap Jenuh (x = 1)',
    specificEnthalpyAxis: 'Entalpi Spesifik, h (kJ / kg)',
    absolutePressureAxis: 'Tekanan Absolut, P (bar) – Skala Logaritmik',

    officialTestReport: 'LAPORAN PENGUJIAN SIKLUS REFRIGERASI & DIAGRAM LOG P - h',
    sectionA: 'A. INFORMASI ADMINISTRASI & IDENTITAS PENGUJIAN',
    sectionB: 'B. PARAMETER INPUT PENGUKURAN OPERASIONAL',
    sectionC: 'C. GRAFIK DIAGRAM LOG P - h BESERTA TITIK SIKLUS 1-2-3-4',
    sectionD: 'D. TABEL KOORDINAT TITIK KEADAAN TERMODINAMIKA',
    sectionE: 'E. HASIL PERHITUNGAN KINERJA SIKLUS & EFISIENSI ENERGI',
    conclusionTitle: 'KESIMPULAN HASIL PENGUJIAN & EVALUASI TERMAL',
    conclusionEditNotice: '* Catatan kesimpulan pengujian dapat diedit langsung di bawah sebelum dicetak/diunduh.',
    approvalTitle: 'PENGESAHAN LAPORAN PENGUJIAN (APPROVAL SIGN-OFF)',
    checkColumn: 'CHECK',
    reviewColumn: 'REVIEW',
    approvedColumn: 'APPROVED',
    signatureDate: 'Tanggal',
    tableColPoint: 'Titik',
    tableColPosition: 'Posisi Siklus',
    tableColPressure: 'Tekanan (P)',
    tableColEnthalpy: 'Entalpi (h)',
    tableColTemp: 'Suhu (T)',
    tableColPhase: 'Fasa / Kualitas (x)',
    tableColSpecVol: 'Vol. Spesifik (v)',
    tableColEntropy: 'Entropi (s)',
  },

  en: {
    appTitle: 'HVAC & Cold Room Engineering Calculator Pro',
    subtitle: 'Air Conditioning, Refrigeration & Cold Storage Engineering',
    coldRoom: '🏬 Cold Room',
    evapCoil: '🌀 Convector Pipe Coil',
    phDiagram: '📊 P-h Diagram',
    heatExchanger: '🔥 Heat Exchanger (HE)',
    cascade: '❄️ Cascade System',
    coolingLoad: 'AC Load (BTU/TR)',
    ventilation: 'Ventilation & CFM',
    ductSizing: 'Duct Sizing',
    psychrometric: 'Psychrometric',
    unitConverter: 'Unit Converter',
    glossary: 'Glossary',
    installGuide: '💻 Install on PC & Phone',
    brandCustomizer: '🎨 Company Branding',
    exportReport: 'Copy Technical Sheet',
    languageSelect: 'Select Language',
    plantTesting: '🏭 Chiller, CT & AHU Testing',
    piping3d: '🧊 3D Piping & Compressor Animation',

    phCalcTitle: 'Refrigeration Performance Calculator & Log P - h Diagram',
    phCalcSubtitle: 'Input actual field measurements (Suction & Discharge Pressure and Temperature, Liquid Temp at TXV, Compressor Power) for full thermodynamic cycle analysis and official test report generation.',
    officialStandard: 'ASHRAE 15 / 34 Standards & Applied Thermodynamics',
    printOfficialReport: 'Print Official PDF Report',
    copyTextReport: 'Copy Text Summary',
    copiedSuccess: 'Copied Successfully! ✓',

    reportIdentityTitle: '1. Test Report Identity & Information Header',
    reportIdentityNote: '* All identity entries are rendered at the top of the official laboratory test report',
    productName: 'Product Name',
    modelUnit: 'Model Unit',
    workOrderNumber: 'Work Order Number',
    projectName: 'Project',
    dateOfReport: 'Date of Report',

    selectRefrigerant: 'Select Refrigerant Type (One by One):',
    refrigerantSimpleNotice: 'Streamlined single selector with instant thermodynamic property lookup',
    prevRefrigerant: 'Previous',
    nextRefrigerant: 'Next',
    refCategory: 'Category',
    safetyClass: 'Safety Group',
    boilingPoint: 'Normal Boiling Point (NBP)',
    criticalTemp: 'Critical Temperature (T_crit)',
    criticalPressure: 'Critical Pressure (P_crit)',
    gwpValue: 'GWP',
    typicalApplication: 'Typical Application',
    quickPresets: '⚡ Quick Presets:',

    inputsTitle: '2. Measured Operating Parameters (P-h Diagram Inputs)',
    suctionPressure: 'Suction Pressure (P_suction / P_evap)',
    dischargePressure: 'Discharge Pressure (P_discharge / P_cond)',
    suctionTemp: 'Suction Temperature (T1 - Compressor Inlet)',
    dischargeTemp: 'Discharge Temperature (T2 - Hot Gas Outlet)',
    liquidTempTXV: 'Liquid Temperature Before Expansion (T3 - TXV Inlet)',
    compressorPower: 'Compressor Power (Electrical Input Power)',
    superheatDegree: 'Superheat Degree',
    dischargeSuperheatDegree: 'Discharge Superheat',
    subcoolingDegree: 'Subcooling Degree',

    massFlowKgS: 'Refrigerant Mass Flow Rate (kg/s)',
    massFlowKgH: 'Refrigerant Mass Flow Rate (kg/h)',
    liquidFlowLpm: 'Liquid Volumetric Flow Rate (LPM)',
    liquidVolumeVl: 'Liquid Specific Volume Vl (dm³/kg at T3)',
    lpmFormulaExplanation: 'Formula: (kg/s × dm³/kg × 60) | Vl taken from saturation table at T3',
    coolingCapacity: 'Cooling Capacity (Qe)',
    refrigeratingEffect: 'Refrigerating Effect (q_e = h1 - h4)',
    compressionWork: 'Compression Work (w_c = h2 - h1)',
    heatRejection: 'Condenser Heat Rejection (q_c = h2 - h3)',
    pressureRatio: 'Compression Ratio (P_dis / P_suc)',
    copActual: 'Actual Cycle COP',
    copCarnot: 'Theoretical Carnot COP',
    secondLawEfficiency: 'Second Law (Exergy) Efficiency',
    isentropicEfficiency: 'Compressor Isentropic Efficiency',
    eerTitle: 'Energy Efficiency Ratio (EER)',
    eerUnit: 'Btu/(h·W)',
    eerStarRating: 'Energy Star / SKEM Rating',

    point1Title: 'Point 1: Compressor Suction',
    point1Desc: 'Superheated vapor entering compressor (T1, P_suction)',
    point2Title: 'Point 2: Compressor Discharge',
    point2Desc: 'High-pressure discharge vapor (T2, P_discharge)',
    point3Title: 'Point 3: Liquid Before Expansion (TXV)',
    point3Desc: 'Subcooled liquid entering TXV (T3, P_discharge)',
    point3IntersectionNote: 'Exact intersection of Discharge Pressure line (P_dis) and Liquid TXV isotherm (T3)',
    point4Title: 'Point 4: Evaporator Inlet',
    point4Desc: 'Two-phase mixture after isenthalpic expansion (h4 = h3, P_suction)',
    vaporQuality: 'Vapor Quality (x)',

    domeKubah: 'Saturation Dome (x=0 & x=1)',
    isothermLine: 'Isothermal Lines (T = const)',
    isentropicLine: 'Constant Entropy Lines (s)',
    isochoricLine: 'Constant Specific Volume (v)',
    cycle1234: 'Refrigeration Cycle (1-2-3-4)',
    subcooledRegion: 'Subcooled Liquid Region',
    twoPhaseRegion: 'Two-Phase Mixture (Liquid + Vapor)',
    superheatedRegion: 'Superheated Vapor',
    saturatedLiquidLine: 'Saturated Liquid Line (x = 0)',
    saturatedVaporLine: 'Saturated Vapor Line (x = 1)',
    specificEnthalpyAxis: 'Specific Enthalpy, h (kJ / kg)',
    absolutePressureAxis: 'Absolute Pressure, P (bar) – Logarithmic Scale',

    officialTestReport: 'VAPOR COMPRESSION REFRIGERATION TEST REPORT & LOG P - h DIAGRAM',
    sectionA: 'A. ADMINISTRATIVE & TEST IDENTIFICATION DATA',
    sectionB: 'B. OPERATIONAL MEASUREMENT INPUT PARAMETERS',
    sectionC: 'C. LOG P - h THERMODYNAMIC DIAGRAM & CYCLE POINTS',
    sectionD: 'D. THERMODYNAMIC STATE COORDINATES TABLE',
    sectionE: 'E. PERFORMANCE CALCULATIONS & ENERGY EFFICIENCY RATIO',
    conclusionTitle: 'TEST CONCLUSION & THERMAL EVALUATION',
    conclusionEditNotice: '* Technical conclusion notes can be edited directly below before printing or exporting.',
    approvalTitle: 'TEST APPROVAL & SIGN-OFF',
    checkColumn: 'CHECK',
    reviewColumn: 'REVIEW',
    approvedColumn: 'APPROVED',
    signatureDate: 'Date',
    tableColPoint: 'Point',
    tableColPosition: 'Cycle Location',
    tableColPressure: 'Pressure (P)',
    tableColEnthalpy: 'Enthalpy (h)',
    tableColTemp: 'Temp (T)',
    tableColPhase: 'Phase / Quality (x)',
    tableColSpecVol: 'Spec. Vol (v)',
    tableColEntropy: 'Entropy (s)',
  },

  jv: {
    appTitle: 'Kalkulator HVAC & Cold Room Pro (Basa Jawa)',
    subtitle: 'Solusi Rekayasa Tata Udara, Refrigerasi & Cold Storage',
    coldRoom: '🏬 Kamar Adhem (Cold Room)',
    evapCoil: '🌀 Koil Pipa Convector',
    phDiagram: '📊 Diagram P-h',
    heatExchanger: '🔥 Heat Exchanger (HE)',
    cascade: '❄️ Sistem Kaskade',
    coolingLoad: 'Beban AC (BTU/PK)',
    ventilation: 'Ventilasi & Hawar-Hawar',
    ductSizing: 'Saluran Duct',
    psychrometric: 'Psikrometrik',
    unitConverter: 'Konverter Ukuran',
    glossary: 'Kamus Istilah',
    installGuide: '💻 Pasang ing PC & HP',
    brandCustomizer: '🎨 Logo & Brand CV',
    exportReport: 'Salin Lembar Teknis',
    languageSelect: 'Pilih Basa',
    plantTesting: '🏭 Tes Chiller, CT & AHU',
    piping3d: '🧊 Animasi 3D Piping & Kompresor',

    phCalcTitle: 'Kalkulator Kinerja Refrigerasi & Diagram Log P - h',
    phCalcSubtitle: 'Lebokake data asil pangukuran lapangan (Tekanan & Suhu Suction, Discharge, Cairan TXV, lan Daya Kompresor) kanggo ngitung termodinamika jangkep lan nyithak laporan resmi.',
    officialStandard: 'Standar ASHRAE 15 / 34 & Termodinamika Teknik',
    printOfficialReport: 'Cithak Laporan Resmi PDF',
    copyTextReport: 'Salin Ringkesan Teks',
    copiedSuccess: 'Kasembadan Disalin! ✓',

    reportIdentityTitle: '1. Kolom Identitas Laporan Pangujian',
    reportIdentityNote: '* Sedaya data identitas iki bakal kacithak ing sisih dhuwur laporan pangujian',
    productName: 'Jeneng Produk (Product Name)',
    modelUnit: 'Model Unit',
    workOrderNumber: 'Nomer Surat Prentah (WO)',
    projectName: 'Proyek / Pangujian',
    dateOfReport: 'Tanggal Laporan',

    selectRefrigerant: 'Pilih Jinise Refrigerant (Siji-mbaka-Siji):',
    refrigerantSimpleNotice: 'Pilihan refrigerant ringkes siji-mbaka-siji kanthi data termodinamika akurat',
    prevRefrigerant: 'Sadurunge',
    nextRefrigerant: 'Sabanjure',
    refCategory: 'Kategori',
    safetyClass: 'Kelas Kaslametan',
    boilingPoint: 'Titik Umob Normal (NBP)',
    criticalTemp: 'Suhu Kritis (T_crit)',
    criticalPressure: 'Tekanan Kritis (P_crit)',
    gwpValue: 'GWP',
    typicalApplication: 'Panganggo Padinan',
    quickPresets: '⚡ Setelan Cepet Praktikum:',

    inputsTitle: '2. Data Input Pangukuran Siklus (P-h Diagram Input)',
    suctionPressure: 'Tekanan Suction / Nyedot (P_suction)',
    dischargePressure: 'Tekanan Discharge / Nguncalake (P_discharge)',
    suctionTemp: 'Suhu Suction (T1 - Sadurunge Kompresor)',
    dischargeTemp: 'Suhu Discharge (T2 - Kukus Panas Metu Kompresor)',
    liquidTempTXV: 'Suhu Cairan Sadurunge Ekspansi (T3 - Mlebu TXV)',
    compressorPower: 'Daya Kompresor (Power Kompresor)',
    superheatDegree: 'Derajat Superheat (Kukus Kering)',
    dischargeSuperheatDegree: 'Superheat Gas Buang',
    subcoolingDegree: 'Derajat Subcooling (Cairan Adem)',

    massFlowKgS: 'Mili Massa Refrigerant (kg/detik)',
    massFlowKgH: 'Mili Massa Refrigerant (kg/jam)',
    liquidFlowLpm: 'Mili Volumetrik Cairan (LPM)',
    liquidVolumeVl: 'Volume Spesifik Cairan Vl (dm³/kg ing T3)',
    lpmFormulaExplanation: 'Rumus: (kg/s × dm³/kg × 60) | Vl dijupuk saka tabel saturasi suhu T3',
    coolingCapacity: 'Kapasitas Ngadhemake (Qe)',
    refrigeratingEffect: 'Efek Refrigerasi (q_e = h1 - h4)',
    compressionWork: 'Pakaryan Kompresi (w_c = h2 - h1)',
    heatRejection: 'Kalor Dibuwang ing Kondensor (q_c = h2 - h3)',
    pressureRatio: 'Rasio Kompresi (P_dis / P_suc)',
    copActual: 'COP Aktual Siklus Adhem',
    copCarnot: 'COP Carnot Maksimal',
    secondLawEfficiency: 'Efisiensi Hukum Kapindho (Eksergi)',
    isentropicEfficiency: 'Efisiensi Isentropik Kompresor',
    eerTitle: 'Energy Efficiency Ratio (EER)',
    eerUnit: 'Btu/(h·W)',
    eerStarRating: 'Tingkat Bintang SKEM ESDM',

    point1Title: 'Titik 1: Suction Kompresor (Nyedot)',
    point1Desc: 'Kukus hisap mlebu ing kompresor (T1, P_suction)',
    point2Title: 'Titik 2: Discharge Kompresor (Nguncalake)',
    point2Desc: 'Gas panas buang tekanan dhuwur (T2, P_discharge)',
    point3Title: 'Titik 3: Cairan Sadurunge Katup Ekspansi (TXV)',
    point3Desc: 'Cairan kondensor sadurunge katup ekspansi TXV (T3, P_discharge)',
    point3IntersectionNote: 'Perpotongan garis Discharge Pressure (P_dis) lan isoterma Suhu Liquid TXV (T3)',
    point4Title: 'Titik 4: Mlebu Evaporator',
    point4Desc: 'Campuran 2 fasa sawise ekspansi isentalpi (h4 = h3, P_suction)',
    vaporQuality: 'Kualitas Uap (x)',

    domeKubah: 'Kubah Saturasi (x=0 & x=1)',
    isothermLine: 'Garis Suhu Tetep (T = const)',
    isentropicLine: 'Entropi Tetep (s)',
    isochoricLine: 'Volume Spesifik (v)',
    cycle1234: 'Siklus Refrigerasi (1-2-3-4)',
    subcooledRegion: 'Wewengkon Cairan Adem (Subcooled)',
    twoPhaseRegion: 'Campuran 2 Fasa (Banyu + Kukus)',
    superheatedRegion: 'Kukus Panas (Superheated)',
    saturatedLiquidLine: 'Garis Cair Jenuh (x = 0)',
    saturatedVaporLine: 'Garis Uap Jenuh (x = 1)',
    specificEnthalpyAxis: 'Entalpi Spesifik, h (kJ / kg)',
    absolutePressureAxis: 'Tekanan Mutlak, P (bar) – Skala Logaritmik',

    officialTestReport: 'LAPORAN PANGUJIAN SIKLUS REFRIGERASI & DIAGRAM LOG P - h',
    sectionA: 'A. INFORMASI ADMINISTRASI & IDENTITAS PANGUJIAN',
    sectionB: 'B. DATA PANGUKURAN OPERASIONAL LAPANGAN',
    sectionC: 'C. GRAFIK DIAGRAM LOG P - h LAN TITIK SIKLUS 1-2-3-4',
    sectionD: 'D. TABEL KOORDINAT TITIK TERMODINAMIKA SIKLUS',
    sectionE: 'E. HASIL ITUNGAN KINERJA REFRIGERASI & EFISIENSI ENERGI',
    conclusionTitle: 'KESIMPULAN PANGUJIAN & EVALUASI TERMAL',
    conclusionEditNotice: '* Catetan kesimpulan pengujian saged dipun-owahi langsung wonten ngandhap saderengipun dipuncithak.',
    approvalTitle: 'PENGESAHAN LAPORAN PANGUJIAN (APPROVAL SIGN-OFF)',
    checkColumn: 'CHECK',
    reviewColumn: 'REVIEW',
    approvedColumn: 'APPROVED',
    signatureDate: 'Tanggal',
    tableColPoint: 'Titik',
    tableColPosition: 'Posisi Siklus',
    tableColPressure: 'Tekanan (P)',
    tableColEnthalpy: 'Entalpi (h)',
    tableColTemp: 'Suhu (T)',
    tableColPhase: 'Fasa / Kualitas (x)',
    tableColSpecVol: 'Vol. Spesifik (v)',
    tableColEntropy: 'Entropi (s)',
  },

  su: {
    appTitle: 'Kalkulator HVAC & Cold Room Pro (Basa Sunda)',
    subtitle: 'Solusi Rekayasa Tata Udara, Refrigerasi & Cold Storage',
    coldRoom: '🏬 Kamar Tiis (Cold Room)',
    evapCoil: '🌀 Koil Pipa Convector',
    phDiagram: '📊 Diagram P-h',
    heatExchanger: '🔥 Heat Exchanger (HE)',
    cascade: '❄️ Sistem Kaskade',
    coolingLoad: 'Beban AC (BTU/PK)',
    ventilation: 'Ventilasi & Hawar',
    ductSizing: 'Saluran Duct',
    psychrometric: 'Psikrometrik',
    unitConverter: 'Konverter Satuan',
    glossary: 'Kamus Istilah',
    installGuide: '💻 Pasang dina PC & HP',
    brandCustomizer: '🎨 Logo & Brand CV',
    exportReport: 'Salin Lambar Teknis',
    languageSelect: 'Pilih Basa',
    plantTesting: '🏭 Uji Chiller, CT & AHU',
    piping3d: '🧊 Animasi 3D Piping & Komprésor',

    phCalcTitle: 'Kalkulator Kinerja Refrigerasi & Diagram Log P - h',
    phCalcSubtitle: 'Lebetkeun data hasil ukur di lapangan (Tekanan & Suhu Suction, Discharge, Cairan TXV, sareng Daya Kompresor) kanggo analisis termodinamika lengkep sareng nyitak laporan resmi.',
    officialStandard: 'Standar ASHRAE 15 / 34 & Termodinamika Téknik',
    printOfficialReport: 'Citak Laporan Resmi PDF',
    copyTextReport: 'Salin Ringkesan Téks',
    copiedSuccess: 'Parantos Disalin! ✓',

    reportIdentityTitle: '1. Kolom Idéntitas Laporan Pangujian',
    reportIdentityNote: '* Sadaya data idéntitas ieu bakal dipintonkeun dina bagian luhur laporan pangujian',
    productName: 'Nami Produk (Product Name)',
    modelUnit: 'Modél Unit',
    workOrderNumber: 'Nomer Surat Paréntah (WO)',
    projectName: 'Proyék / Pangujian',
    dateOfReport: 'Kaping Laporan',

    selectRefrigerant: 'Pilih Jinis Refrigerant (Hiji-hiji):',
    refrigerantSimpleNotice: 'Pilihan refrigerant singket hiji-hiji kalayan data termodinamika sacara langsung',
    prevRefrigerant: 'Sateuacanna',
    nextRefrigerant: 'Salajengna',
    refCategory: 'Kategori',
    safetyClass: 'Kelas Kasalametan',
    boilingPoint: 'Titik Golak Normal (NBP)',
    criticalTemp: 'Suhu Kritis (T_crit)',
    criticalPressure: 'Tekanan Kritis (P_crit)',
    gwpValue: 'GWP',
    typicalApplication: 'Larapan Sapopoé',
    quickPresets: '⚡ Setélan Gancang Praktikum:',

    inputsTitle: '2. Data Input Pangukuran Siklus (P-h Diagram Input)',
    suctionPressure: 'Tekanan Suction / Nyedot (P_suction)',
    dischargePressure: 'Tekanan Discharge / Nyembur (P_discharge)',
    suctionTemp: 'Suhu Suction (T1 - Sateuacan Kompresor)',
    dischargeTemp: 'Suhu Discharge (T2 - Uap Panas Kaluar Kompresor)',
    liquidTempTXV: 'Suhu Cairan Sateuacan Ékspansi (T3 - Lebet TXV)',
    compressorPower: 'Daya Kompresor (Power Kompresor)',
    superheatDegree: 'Darajat Superheat (Uap Garing)',
    dischargeSuperheatDegree: 'Superheat Gas Piceun',
    subcoolingDegree: 'Darajat Subcooling (Cairan Tiis)',

    massFlowKgS: 'Laju Aliran Massa Refrigerant (kg/detik)',
    massFlowKgH: 'Laju Aliran Massa Refrigerant (kg/jam)',
    liquidFlowLpm: 'Laju Aliran Volumétrik Cairan (LPM)',
    liquidVolumeVl: 'Volume Spésifik Cairan Vl (dm³/kg dina T3)',
    lpmFormulaExplanation: 'Rumus: (kg/s × dm³/kg × 60) | Vl tina tabel saturasi suhu T3',
    coolingCapacity: 'Kapasitas Niiskeun (Qe)',
    refrigeratingEffect: 'Pangaruh Refrigerasi (q_e = h1 - h4)',
    compressionWork: 'Karya Komprési (w_c = h2 - h1)',
    heatRejection: 'Kalor Dipiceun di Kondensor (q_c = h2 - h3)',
    pressureRatio: 'Rasio Komprési (P_dis / P_suc)',
    copActual: 'COP Aktual Siklus Tiis',
    copCarnot: 'COP Carnot Maksimal',
    secondLawEfficiency: 'Éfisiensi Hukum Kadua (Éksergi)',
    isentropicEfficiency: 'Éfisiensi Isentropik Kompresor',
    eerTitle: 'Energy Efficiency Ratio (EER)',
    eerUnit: 'Btu/(h·W)',
    eerStarRating: 'Tingkat Bentang SKEM ESDM',

    point1Title: 'Titik 1: Suction Kompresor (Nyedot)',
    point1Desc: 'Uap hisap lebet kana kompresor (T1, P_suction)',
    point2Title: 'Titik 2: Discharge Kompresor (Nyembur)',
    point2Desc: 'Gas panas piceun tekanan luhur (T2, P_discharge)',
    point3Title: 'Titik 3: Cairan Sateuacan Katup Ékspansi (TXV)',
    point3Desc: 'Cairan kondensor sateuacan katup ekspansi TXV (T3, P_discharge)',
    point3IntersectionNote: 'Pasapaton garis Discharge Pressure (P_dis) sareng isotérma Suhu Cairan TXV (T3)',
    point4Title: 'Titik 4: Lebet Evaporator',
    point4Desc: 'Campuran 2 fasa saatos ékspansi isentalpi (h4 = h3, P_suction)',
    vaporQuality: 'Kualitas Uap (x)',

    domeKubah: 'Kubah Saturasi (x=0 & x=1)',
    isothermLine: 'Garis Suhu Tetep (T = const)',
    isentropicLine: 'Entropi Tetep (s)',
    isochoricLine: 'Volume Spésifik (v)',
    cycle1234: 'Siklus Refrigerasi (1-2-3-4)',
    subcooledRegion: 'Wewengkon Cairan Tiis (Subcooled)',
    twoPhaseRegion: 'Campuran 2 Fasa (Cai + Uap)',
    superheatedRegion: 'Uap Panas (Superheated)',
    saturatedLiquidLine: 'Garis Cair Jenuh (x = 0)',
    saturatedVaporLine: 'Garis Uap Jenuh (x = 1)',
    specificEnthalpyAxis: 'Entalpi Spésifik, h (kJ / kg)',
    absolutePressureAxis: 'Tekanan Mutlak, P (bar) – Skala Logaritmik',

    officialTestReport: 'LAPORAN PANGUJIAN SIKLUS REFRIGERASI & DIAGRAM LOG P - h',
    sectionA: 'A. INFORMASI ADMINISTRASI & IDÉNTITAS PANGUJIAN',
    sectionB: 'B. PARAMETER INPUT PANGUKURAN OPERASIONAL',
    sectionC: 'C. GRAFIK DIAGRAM LOG P - h SARENG TITIK SIKLUS 1-2-3-4',
    sectionD: 'D. TABEL KOORDINAT TITIK TERMODINAMIKA',
    sectionE: 'E. HASIL ITUNGAN KINERJA SIKLUS & ÉFISIENSI ÉNÉRGI',
    conclusionTitle: 'KACINDEKAN PANGUJIAN & EVALUASI TÉRMAL',
    conclusionEditNotice: '* Catetan kacindekan pangujian tiasa diédit langsung di handap sateuacan dicitak.',
    approvalTitle: 'PANGESAHAN LAPORAN PANGUJIAN (APPROVAL SIGN-OFF)',
    checkColumn: 'CHECK',
    reviewColumn: 'REVIEW',
    approvedColumn: 'APPROVED',
    signatureDate: 'Kaping',
    tableColPoint: 'Titik',
    tableColPosition: 'Posisi Siklus',
    tableColPressure: 'Tekanan (P)',
    tableColEnthalpy: 'Entalpi (h)',
    tableColTemp: 'Suhu (T)',
    tableColPhase: 'Fasa / Kualitas (x)',
    tableColSpecVol: 'Vol. Spésifik (v)',
    tableColEntropy: 'Entropi (s)',
  },
};
