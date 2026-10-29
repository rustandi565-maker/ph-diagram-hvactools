import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  Wind,
  Gauge,
  Flame,
  Snowflake,
  Info,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Droplet,
  Zap,
} from 'lucide-react';
import {
  ComponentExplanation,
  DynamicCycleState,
  PhMeasurementPoint,
  PhPointId,
  SchematicComponentId,
  SuperheatLevel,
} from '../types/refrigeration3d';
import { AppLanguage, TRANSLATIONS } from '../utils/i18n';
import { computeReciprocatingKinematics } from '../utils/refrigeration3dKinematics';

interface EducationalPipingSchematicProps {
  cycleState: DynamicCycleState;
  measurementPoints: PhMeasurementPoint[];
  isRunning: boolean;
  onToggleRun: () => void;
  simSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  condenserFanRpm: number;
  onChangeCondenserFanRpm: (rpm: number) => void;
  evaporatorFanRpm: number;
  onChangeEvaporatorFanRpm: (rpm: number) => void;
  compressorRpm: number;
  onChangeCompressorRpm: (rpm: number) => void;
  selectedPointId: PhPointId | null;
  onSelectPoint: (id: PhPointId) => void;
  language?: AppLanguage;
}

export const EducationalPipingSchematic: React.FC<EducationalPipingSchematicProps> = ({
  cycleState,
  measurementPoints,
  isRunning,
  onToggleRun,
  simSpeed,
  onChangeSimSpeed,
  condenserFanRpm,
  onChangeCondenserFanRpm,
  evaporatorFanRpm,
  onChangeEvaporatorFanRpm,
  compressorRpm,
  onChangeCompressorRpm,
  selectedPointId,
  onSelectPoint,
  language = 'id',
}) => {
  const isId = language === 'id' || language === 'jv' || language === 'su';

  // Interactive Fault & Feature States
  const [selectedComponent, setSelectedComponent] = useState<SchematicComponentId>('compressor');
  const [superheatLevel, setSuperheatLevel] = useState<SuperheatLevel>('normal');
  const [hasShortage, setHasShortage] = useState<boolean>(false);
  const [isDefrost, setIsDefrost] = useState<boolean>(false);
  const [isCutaway, setIsCutaway] = useState<boolean>(true);

  // Animation clocks
  const [time, setTime] = useState<number>(0);

  useEffect(() => {
    if (!isRunning) return;
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setTime((prev) => prev + dt * simSpeed);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, simSpeed]);

  // Reciprocating kinematics calculation for the internal compressor cutaway
  const crankAngleRad = time * (compressorRpm / 60) * Math.PI * 2 * 0.4;
  const kinematics = useMemo(() => {
    return computeReciprocatingKinematics(
      crankAngleRad,
      cycleState.suctionPressureBar,
      cycleState.dischargePressureBar,
      18, // crank radius in SVG units
      52  // conrod length in SVG units
    );
  }, [crankAngleRad, cycleState.suctionPressureBar, cycleState.dischargePressureBar]);

  // Fan angles
  const condFanAngle = isRunning && !isDefrost ? (time * (condenserFanRpm / 60) * 360) % 360 : 0;
  const evapFanAngle = isRunning && !isDefrost ? (time * (evaporatorFanRpm / 60) * 360) % 360 : 0;

  // Flow animation offsets
  const flowOffset = (time * 65) % 100;

  // COMPONENT EXPLANATIONS DATABASE
  const explanations: Record<SchematicComponentId, ComponentExplanation> = {
    compressor: {
      id: 'compressor',
      name: isId ? 'Kompresor Semi-Hermetik / Reciprocating' : 'Semi-Hermetic Reciprocating Compressor',
      tag: 'COMP-01',
      category: isId ? 'Kompresi Gas & Sirkulasi Fluida' : 'Gas Compression & Fluid Circulation',
      phPointLink: 'Point 1 (Suction) -> Point 2 (Discharge)',
      role: isId
        ? 'Jantung sistem refrigerasi. Menghisap uap superheat dingin dari akumulator pada tekanan rendah (P1), memampatkannya menjadi gas buang panas bertekanan tinggi (P2) menuju kondenser.'
        : 'Heart of the refrigeration cycle. Draws cold superheated vapor from the accumulator at low pressure (P1) and compresses it into hot discharge gas (P2) to the condenser.',
      workingPrinciple: isId
        ? 'Mekanisme torak bolak-balik (slider-crank): Crankshaft berputar menggerakkan connecting rod dan piston. Pada langkah turun (suction stroke), katup hisap membuka. Pada langkah naik (compression stroke), freon dimampatkan hingga katup buang membuka.'
        : 'Reciprocating slider-crank mechanism: Crankshaft drives conrod and piston. On the downstroke, suction reed valve opens. On the upstroke, refrigerant vapor is compressed until discharge valve opens.',
      operationalParameters: isId
        ? `Kecepatan: ${isRunning ? compressorRpm : 0} RPM | Pe: ${cycleState.suctionPressureBar} bar | Pc: ${cycleState.dischargePressureBar} bar | Rasio Kompresi: ${(cycleState.dischargePressureBar / Math.max(0.5, cycleState.suctionPressureBar)).toFixed(2)} : 1`
        : `Speed: ${isRunning ? compressorRpm : 0} RPM | Pe: ${cycleState.suctionPressureBar} bar | Pc: ${cycleState.dischargePressureBar} bar | Compression Ratio: ${(cycleState.dischargePressureBar / Math.max(0.5, cycleState.suctionPressureBar)).toFixed(2)}:1`,
      troubleshootingTips: [
        isId ? 'Pastikan pelumasan oli karter berada pada level 1/2 hingga 3/4 kaca intip karter.' : 'Keep crankcase oil level at 1/2 to 3/4 of the sight glass.',
        isId ? 'Hindari fenomena liquid slugging (cairan masuk silinder) dengan memastikan superheat minimal 5 - 8 K.' : 'Prevent liquid slugging by maintaining at least 5-8 K of suction superheat.',
        isId ? 'Temperatur gas buang (Discharge T2) tidak boleh melebihi 110°C agar oli ester/mineral tidak terdegradasi.' : 'Discharge temperature must not exceed 110°C to prevent oil breakdown.',
      ],
    },
    oil_separator: {
      id: 'oil_separator',
      name: isId ? 'Pemisah Oli (Helical Oil Separator)' : 'Helical Oil Separator',
      tag: 'SEP-01',
      category: isId ? 'Proteksi Pelumasan Kompresor' : 'Lubrication Protection',
      phPointLink: 'Point 2 (Discharge Line)',
      role: isId
        ? 'Memisahkan kabut partikel oli pelumas yang ikut terbawa gas buang kompresor, lalu mengembalikannya secara otomatis ke karter kompresor melalui mekanisme jarum pelampung (float valve).'
        : 'Separates oil mist from high-pressure discharge gas and automatically returns it to the compressor crankcase via a float valve.',
      workingPrinciple: isId
        ? 'Gas buang masuk dengan pola pusaran heliks (sentrifugal). Butiran oli yang lebih berat menabrak dinding dan jatuh ke dasar tabung, sementara uap freon bersih terus mengalir ke kondenser.'
        : 'Gas enters with a helical centrifugal swirl. Dense oil droplets hit the walls and collect at the bottom, while clean refrigerant vapor exits to the condenser.',
      operationalParameters: isId
        ? 'Suhu tabung bawah normalnya hangat/panas saat oli kembali ke karter kompresor.'
        : 'Bottom of the separator stays warm/hot when oil is returning normally to the crankcase.',
      troubleshootingTips: [
        isId ? 'Wajib diisi oli awal (pre-charge) sebelum sistem dihidupkan pertama kali.' : 'Pre-charge with oil before first startup.',
        isId ? 'Bila pipa balik oli dingin terus-menerus, periksa apakah katup pelampung tersumbat kotoran.' : 'If the oil return pipe is constantly cold, check if the float valve is clogged.',
      ],
    },
    condenser: {
      id: 'condenser',
      name: isId ? 'Kondenser Pendingin Udara (Air-Cooled Condenser)' : 'Air-Cooled Condenser',
      tag: 'COND-01',
      category: isId ? 'Pelepasan Kalor Lingkungan' : 'Heat Rejection',
      phPointLink: 'Point 2 -> Point 3 (Desuperheating, Kondensasi, Subcooling)',
      role: isId
        ? 'Membuang total kalor (kalor yang diserap evaporator + kerja kompresi motor) ke udara luar. Mengubah gas panas menjadi cairan freon jenuh dingin lanjut (subcooled liquid).'
        : 'Rejects total heat (absorbed heat + motor compression work) into outdoor air, converting hot gas into subcooled liquid.',
      workingPrinciple: isId
        ? 'Terbagi menjadi 3 zona: Zona De-superheat (menurunkan suhu gas buang), Zona Kondensasi (fase uap berubah menjadi cair pada suhu konstan Tc), dan Zona Subcooling (mendinginkan cairan 3-5 K di bawah Tc).'
        : 'Operates in 3 zones: Desuperheating zone, Condensation zone (gas to liquid at constant temp Tc), and Subcooling zone (liquid cooled 3-5 K below Tc).',
      operationalParameters: isId
        ? `Suhu Kondensasi Tc: ${cycleState.condTempC}°C | Tekanan Pc: ${cycleState.dischargePressureBar} bar | Subcooling: ${cycleState.subcoolingK} K`
        : `Condensing Temp Tc: ${cycleState.condTempC}°C | Pressure Pc: ${cycleState.dischargePressureBar} bar | Subcooling: ${cycleState.subcoolingK} K`,
      troubleshootingTips: [
        isId ? 'Bersihkan sirip fin secara berkala dari debu agar tekanan discharge tidak melonjak tinggi.' : 'Clean fins regularly to avoid high discharge head pressure.',
        isId ? 'Bila subcooling < 2 K, periksa apakah muatan freon kurang atau sirip kondenser kotor.' : 'Subcooling < 2 K indicates low refrigerant charge or fouled condenser fins.',
      ],
    },
    condenser_fan: {
      id: 'condenser_fan',
      name: isId ? 'Kipas Aksial Kondenser (Condenser Fan)' : 'Condenser Axial Fan',
      tag: 'FAN-COND',
      category: isId ? 'Sirkulasi Udara Pendingin' : 'Airflow Circulation',
      phPointLink: 'Mempengaruhi Posisi Garis Tekanan Tinggi (Pc)',
      role: isId
        ? 'Menghembuskan udara luar melintasi kisi-kisi koil kondenser untuk mempercepat laju perpindahan panas konveksi paksa.'
        : 'Forces ambient air across condenser coil fins for high-rate convective heat transfer.',
      workingPrinciple: isId
        ? 'Bilah aerofoil menarik udara menembus sirip pendingin. Kecepatan kipas (RPM) mengontrol kestabilan tekanan head kompresor.'
        : 'Aerofoil blades pull air through cooling fins. Fan speed controls head pressure stability.',
      operationalParameters: isId
        ? `Kecepatan: ${condenserFanRpm} RPM | Status: ${condenserFanRpm > 0 ? 'Berputar Normal' : 'Mati / Terhenti'}`
        : `Speed: ${condenserFanRpm} RPM | Status: ${condenserFanRpm > 0 ? 'Running' : 'Stopped'}`,
      troubleshootingTips: [
        isId ? 'Kipas mati akan memicu High Pressure Trip pada pressure switch.' : 'Fan failure causes instantaneous High Pressure Trip.',
        isId ? 'Pastikan arah hembusan kipas meniup keluar (exhaust) bukan terbalik.' : 'Ensure correct airflow rotation direction.',
      ],
    },
    liquid_receiver: {
      id: 'liquid_receiver',
      name: isId ? 'Tangki Penampung Cairan (Liquid Receiver)' : 'Liquid Receiver Tank',
      tag: 'REC-01',
      category: isId ? 'Penyimpanan Refrigerant Tekanan Tinggi' : 'High Pressure Liquid Storage',
      phPointLink: 'Point 3 (Cairan Jenuh Menuju Filter)',
      role: isId
        ? 'Menyimpan cadangan freon cair bertekanan tinggi yang keluar dari kondenser, memastikan pasokan cairan bebas gelembung uap ke katup ekspansi (TXV).'
        : 'Stores reserve high-pressure liquid refrigerant from the condenser, ensuring bubble-free liquid supply to the TXV.',
      workingPrinciple: isId
        ? 'Dilengkapi pipa celup (dip tube) yang menghisap cairan dari dasar tabung sehingga gas tidak dapat lolos ke liquid line.'
        : 'Equipped with a dip tube drawing liquid from the bottom, preventing vapor bubbles from entering the liquid line.',
      operationalParameters: isId
        ? `Fasa: 100% Cairan Subcooled | Suhu: ${cycleState.liquidTempC}°C | Tekanan: ${cycleState.dischargePressureBar} bar`
        : `Phase: 100% Subcooled Liquid | Temp: ${cycleState.liquidTempC}°C | Pressure: ${cycleState.dischargePressureBar} bar`,
      troubleshootingTips: [
        isId ? 'Wajib dilengkapi Safety Relief Valve (PRV) untuk proteksi lonjakan tekanan hidrolik panas.' : 'Must include a Safety Relief Valve (PRV) for hydraulic overpressure protection.',
        isId ? 'Membantu proses pumpdown saat teknisi memperbaiki kompresor atau filter.' : 'Facilitates system pumpdown during maintenance.',
      ],
    },
    filter_drier: {
      id: 'filter_drier',
      name: isId ? 'Filter Drier (FS - Saringan Pengering Freon)' : 'Liquid Line Filter Drier (FS)',
      tag: 'FS / FLT-01',
      category: isId ? 'Pemurnian & Pengeringan Freon' : 'Refrigerant Purification',
      phPointLink: 'Point 3 (Liquid Line)',
      role: isId
        ? 'Menyaring partikel gram tembaga, lumpur las, serta menyerap molekul air dan asam agar tidak menyumbat lubang jarum katup ekspansi (TXV).'
        : 'Filters debris, scale, and absorbs moisture and acid to protect the fine TXV orifice.',
      workingPrinciple: isId
        ? 'Menggunakan inti padat 100% Molecular Sieve dengan pengikat poliester yang mengikat molekul H2O secara kimiawi.'
        : 'Uses a 100% solid core Molecular Sieve chemically trapping moisture molecules.',
      operationalParameters: isId
        ? 'Penurunan tekanan (Pressure Drop) ideal < 0.2 bar.'
        : 'Ideal pressure drop across filter is < 0.2 bar.',
      troubleshootingTips: [
        isId ? 'Raba bodi filter; bila terasa dingin atau berembun, berarti saringan buntu sebagian!' : 'Touch the filter body: if cold or sweating, the core is partially clogged!',
        isId ? 'Wajib diganti setiap kali sistem dibongkar atau setelah perbaikan kebocoran.' : 'Replace filter whenever the refrigeration loop is opened for service.',
      ],
    },
    solenoid_valve: {
      id: 'solenoid_valve',
      name: isId ? 'Katup Solenoid Cairan (SV - Solenoid Valve)' : 'Liquid Line Solenoid Valve (SV)',
      tag: 'SV / SOL-01',
      category: isId ? 'Kontrol Aliran Listrik Otomatis' : 'Flow Control Valve',
      phPointLink: 'Liquid Line Control',
      role: isId
        ? 'Membuka atau menutup aliran cairan refrigerant ke katup ekspansi secara otomatis berdasarkan sinyal termostat suhu ruangan.'
        : 'Electrically opens or stops liquid flow to the expansion valve based on thermostat demand.',
      workingPrinciple: isId
        ? 'Kumparan elektromagnetik menarik plunyer magnetis saat mendapat tegangan 220V/24V, membuka lubang aliran katup.'
        : 'Electromagnetic coil lifts a plunger when energized, allowing liquid flow to the expansion valve.',
      operationalParameters: isId
        ? isDefrost ? 'Tutup (Defrost / Pumpdown)' : 'Buka (Pendinginan Aktif)'
        : isDefrost ? 'Closed (Defrost)' : 'Open (Cooling Active)',
      troubleshootingTips: [
        isId ? 'Memungkinkan siklus Automatic Pumpdown sebelum kompresor mati, mencegah migrasi freon cair ke karter kompresor saat standby.' : 'Enables automatic pumpdown before compressor shutdown, preventing crankcase migration.',
      ],
    },
    sight_glass: {
      id: 'sight_glass',
      name: isId ? 'Kaca Intip & Indikator Kelembapan (Sight Glass Moisture Indicator)' : 'Sight Glass & Moisture Indicator',
      tag: 'SG-01',
      category: isId ? 'Diagnostik Visual Freon' : 'Visual Diagnostics',
      phPointLink: 'Point 3 (Cairan Sebelum TXV)',
      role: isId
        ? 'Memantau kondisi fasa freon cair (bening bebas gelembung) dan mendeteksi adanya uap air berbahaya dalam sistem melalui cincin warna kimia.'
        : 'Provides visual confirmation of liquid subcooling (bubble-free) and moisture contamination via color-changing indicator.',
      workingPrinciple: isId
        ? 'Garam kimia kobalt klorida berubah warna: HIJAU = Kering (Dry / Aman), KUNING = Basah (Wet / Bahaya air). Bila muncul gelembung saat kompresor jalan penuh, menandakan kekurangan freon.'
        : 'Chemical salt indicator changes color: GREEN = Dry, YELLOW = Wet. Bubbling indicates flash gas due to refrigerant shortage or restriction.',
      operationalParameters: isId
        ? `Warna: ${hasShortage ? 'Kuning / Gelembung Berbusa' : 'Hijau Bening (100% Cairan)'} | Status: ${hasShortage ? 'Kurang Freon / Shortage' : 'Kondisi Ideal (Kering)'}`
        : `Color: ${hasShortage ? 'Yellow / Bubbling' : 'Green / Clear Liquid'} | Status: ${hasShortage ? 'Shortage / Leak' : 'Dry & Normal'}`,
      troubleshootingTips: [
        isId ? 'Bila titik indikator berubah menjadi KUNING, segera ganti filter drier dan lakukan vakum ulang.' : 'If the indicator turns yellow, replace the filter drier and deep vacuum.',
        isId ? 'Gelembung sesaat saat kompresor baru start adalah normal, tetapi jika berbusa terus-menerus = Freon Kurang!' : 'Continuous bubbling during steady state indicates low refrigerant charge!',
      ],
    },
    txv: {
      id: 'txv',
      name: isId ? 'Katup Ekspansi Termostatik (TXV - Thermostatic Expansion Valve)' : 'Thermostatic Expansion Valve (TXV)',
      tag: 'TXV-01',
      category: isId ? 'Penurunan Tekanan & Pengaturan Debit' : 'Metering & Expansion Device',
      phPointLink: 'Point 3 (Cairan Pc) -> Point 4 (Campuran 2 Fase Pe)',
      role: isId
        ? 'Menurunkan tekanan freon dari tinggi (Pc) ke rendah (Pe) secara isentalpi (h4 = h3), dan mengatur debit aliran freon cair secara proporsional sesuai beban kalor evaporator untuk menjaga superheat stabil.'
        : 'Drops refrigerant pressure from high (Pc) to low (Pe) isenthalpically (h4 = h3), metering mass flow to maintain constant suction superheat.',
      workingPrinciple: isId
        ? 'Keseimbangan 3 gaya pada diafragma: P1 (tekanan bulb membuka katup) melawan P2 (tekanan evaporator menutup katup) + P3 (gaya pegas superheat menutup katup). Bila suhu bulb naik, tekanan bulb menekan diafragma ke bawah membuka jarum orifice.'
        : 'Operates via 3 forces: P1 (bulb pressure opening valve) balanced against P2 (evaporator pressure closing) + P3 (spring force closing). Rising superheat increases bulb pressure, pushing the needle open.',
      operationalParameters: isId
        ? `Setting Superheat: ${superheatLevel.toUpperCase()} | Tekanan Masuk: ${cycleState.dischargePressureBar} bar | Tekanan Keluar: ${cycleState.suctionPressureBar} bar | Kualitas Uap Flash: ~21%`
        : `Superheat: ${superheatLevel.toUpperCase()} | Inlet Pressure: ${cycleState.dischargePressureBar} bar | Outlet Pressure: ${cycleState.suctionPressureBar} bar | Flash Vapor: ~21%`,
      troubleshootingTips: [
        isId ? 'Putar baut penyetel (adjustment nut) searah jarum jam untuk menaikkan superheat (mempersempit debit).' : 'Turn adjustment clockwise to increase superheat (reduce flow).',
        isId ? 'Pastikan sensing bulb terikat kencang pada posisi jam 1 atau jam 2 di pipa hisap tembaga horizontal.' : 'Ensure sensing bulb is tightly clamped at 1 or 2 o’clock position.',
      ],
    },
    sensing_bulb: {
      id: 'sensing_bulb',
      name: isId ? 'Sensing Bulb & Pipa Kapiler TXV' : 'TXV Sensing Bulb & Capillary',
      tag: 'BULB-01',
      category: isId ? 'Sensor Termal Umpan Balik' : 'Thermal Feedback Sensor',
      phPointLink: 'Point 5 (Outlet Evaporator Superheat)',
      role: isId
        ? 'Membaca temperatur uap freon yang keluar dari koil evaporator, mentransmisikan tekanan gas ke bagian atas diafragma TXV melalui pipa kapiler.'
        : 'Measures suction vapor temperature leaving the evaporator, transmitting pressure to the TXV diaphragm via capillary.',
      workingPrinciple: isId
        ? 'Berisi muatan termostatik (liquid/cross charge). Perubahan suhu pada pipa tembaga langsung mengubah tekanan uap di dalam bulb.'
        : 'Filled with thermostatic charge. Temperature changes on the copper line directly vary vapor pressure inside the bulb.',
      operationalParameters: isId
        ? `Suhu Terbaca: ${cycleState.suctionTempC}°C | Lokasi: Pipa Suction Horizontal Dekat Outlet Evaporator`
        : `Reading: ${cycleState.suctionTempC}°C | Location: Horizontal suction line near coil exit`,
      troubleshootingTips: [
        isId ? 'Wajib dibungkus isolasi busa Armaflex agar tidak terpengaruh oleh temperatur udara ruang luar.' : 'Must be insulated with foam to avoid reading ambient room temperature.',
      ],
    },
    evaporator: {
      id: 'evaporator',
      name: isId ? 'Evaporator Pendingin Udara (Forced-Draft Evaporator Coil)' : 'Forced-Draft Evaporator Coil',
      tag: 'EVAP-01',
      category: isId ? 'Penyerapan Kalor Ruangan' : 'Heat Absorption',
      phPointLink: 'Point 4 (Campuran 2 Fase) -> Point 5 / Point 1 (Uap Superheat)',
      role: isId
        ? 'Menyerap kalor panas dari udara ruangan cold room / chiller. Cairan freon mendidih pada suhu rendah dan menguap sempurna menjadi uap gas.'
        : 'Absorbs heat from conditioned space. Low-pressure refrigerant boils at cold temperatures, evaporating into vapor.',
      workingPrinciple: isId
        ? 'Cairan freon masuk distributor pipa kapiler, mendidih di sepanjang pipa tembaga bersirip aluminium sambil menyerap panas laten penguapan (h1 - h4).'
        : 'Liquid refrigerant enters coil passes, boiling along finned copper tubes by absorbing latent heat of vaporization (h1 - h4).',
      operationalParameters: isId
        ? `Suhu Evaporasi Te: ${cycleState.evapTempC}°C | Tekanan Pe: ${cycleState.suctionPressureBar} bar | Superheat: ${cycleState.superheatK} K | Status Defrost: ${isDefrost ? 'Defrost Pemanas Aktif' : 'Normal Dingin'}`
        : `Evap Temp Te: ${cycleState.evapTempC}°C | Pressure Pe: ${cycleState.suctionPressureBar} bar | Superheat: ${cycleState.superheatK} K | Defrost: ${isDefrost ? 'Active' : 'Off'}`,
      troubleshootingTips: [
        isId ? 'Bunga es tebal pada sirip menghalangi aliran udara, wajib dijadwalkan siklus defrost elektrik/hot-gas.' : 'Heavy frost restricts airflow, requiring periodic defrost cycles.',
        isId ? 'Kemiringan pipa drain minimal 2% agar air es yang mencair tidak menggenang dan membeku kembali.' : 'Ensure 2% slope on condensate drain line.',
      ],
    },
    evaporator_fan: {
      id: 'evaporator_fan',
      name: isId ? 'Kipas Sirkulasi Evaporator (Evaporator Fan)' : 'Evaporator Circulation Fan',
      tag: 'FAN-EVAP',
      category: isId ? 'Sirkulasi Udara Dingin' : 'Airflow Circulation',
      phPointLink: 'Mempengaruhi Posisi Garis Tekanan Rendah (Pe)',
      role: isId
        ? 'Mensirkulasikan udara dingin ke seluruh sudut ruangan cold room dan menarik udara hangat melintasi kisi koil pendingin.'
        : 'Circulates conditioned cold air through the room and forces warm return air across cooling fins.',
      workingPrinciple: isId
        ? 'Kipas aksial meniupkan udara menembus sirip dingin evaporator, mempercepat laju penyerapan beban kalor sensible dan latent.'
        : 'Axial fan forces air through chilled fins, accelerating sensible and latent heat extraction.',
      operationalParameters: isId
        ? `Kecepatan: ${evaporatorFanRpm} RPM | Status: ${evaporatorFanRpm > 0 ? 'Berputar Normal' : 'Mati / Terhenti'}`
        : `Speed: ${evaporatorFanRpm} RPM | Status: ${evaporatorFanRpm > 0 ? 'Running' : 'Stopped'}`,
      troubleshootingTips: [
        isId ? 'Bila kipas mati, koil evaporator akan langsung membeku dan tekanan suction (LP) anjlok drastis.' : 'Fan stoppage leads to instant coil icing and low suction pressure.',
      ],
    },
    suction_accumulator: {
      id: 'suction_accumulator',
      name: isId ? 'Akumulator Hisap (Suction Accumulator)' : 'Suction Accumulator',
      tag: 'ACC-01',
      category: isId ? 'Proteksi Anti-Liquid Slugging' : 'Compressor Protection',
      phPointLink: 'Point 5 -> Point 1 (Sebelum Masuk Kompresor)',
      role: isId
        ? 'Perangkap penyelamat kompresor. Menampung tetesan cairan freon liar yang belum sempat menguap di evaporator agar tidak masuk dan merusak piston/klep kompresor.'
        : 'Safety vessel that catches unevaporated liquid droplets returning from the evaporator, preventing liquid slugging damage.',
      workingPrinciple: isId
        ? 'Uap dan cairan masuk ke dalam tabung; cairan yang lebih berat mengendap di dasar. Pipa internal berbentuk U menghisap hanya uap gas kering dari bagian paling atas tabung. Lubang kecil (orifice) di dasar U-tube mengembalikan oli secara terkontrol.'
        : 'Liquid drops to the bottom while an internal U-tube draws only dry vapor from the top into compressor suction. A small metering orifice at the bottom allows oil to return safely.',
      operationalParameters: isId
        ? `Tingkat Cairan Akumulator: ${superheatLevel === 'low' ? 'Tinggi (Bahaya Banjir Freon)' : 'Normal / Rendah'} | Tekanan: ${cycleState.suctionPressureBar} bar`
        : `Liquid Level: ${superheatLevel === 'low' ? 'High (Risk of liquid floodback)' : 'Normal'} | Pressure: ${cycleState.suctionPressureBar} bar`,
      troubleshootingTips: [
        isId ? 'Jika akumulator berembun/berbunga es hingga ke karter kompresor, itu tanda superheat terlalu rendah (banjir freon)!' : 'Frosting on the accumulator and compressor body indicates low superheat and liquid floodback!',
        isId ? 'Lubang oil bleed di dasar U-tube harus bersih dari kotoran gram pipa.' : 'Keep the oil bleed orifice at the bottom of the U-tube clean.',
      ],
    },
    gauges: {
      id: 'gauges',
      name: isId ? 'Manometer Tekanan Hisap & Buang (LP & HP Pressure Gauges)' : 'LP & HP Manometer Gauges',
      tag: 'GAUGE-01',
      category: isId ? 'Instrumen Pengukur Siklus P-h' : 'Cycle Instrumentation',
      phPointLink: 'Membaca Sumbu Y (Tekanan P) pada Diagram Log P-h',
      role: isId
        ? 'Dua instrumen utama teknisi untuk membaca tekanan hisap (Suction LP) dan tekanan buang (Discharge HP) secara langsung di lapangan.'
        : 'Twin analog gauges measuring low suction pressure (LP) and high discharge pressure (HP).',
      workingPrinciple: isId
        ? 'Tabung Bourdon (Bourdon tube) melengkung elastis yang meregang saat menerima tekanan fluida, menggerakkan jarum penunjuk mekanik pada skala bar/psi.'
        : 'Bourdon tube expands proportionally with fluid pressure, deflecting the calibrated dial needle.',
      operationalParameters: isId
        ? `Manometer Hisap (LP): ${cycleState.suctionPressureBar} bar | Manometer Buang (HP): ${cycleState.dischargePressureBar} bar`
        : `Suction LP: ${cycleState.suctionPressureBar} bar | Discharge HP: ${cycleState.dischargePressureBar} bar`,
      troubleshootingTips: [
        isId ? 'Selalu gunakan manometer dengan peredam getaran (glycerin-filled) agar jarum tidak bergetar akibat denyut kompresor.' : 'Use glycerin-filled gauges to dampen compressor pulsations.',
      ],
    },
    point1: {
      id: 'point1',
      name: isId ? 'Point 1: Suction / Masuk Kompresor' : 'Point 1: Compressor Suction Inlet',
      tag: 'P1 (LP & T1)',
      category: isId ? 'Titik Pengukuran Diagram P-h' : 'P-H Diagram State Point',
      phPointLink: 'Titik 1 pada Grafik P-h',
      role: isId
        ? 'Titik awal siklus kompresi. Uap freon superheated pada tekanan rendah (P1) bersuhu T1.'
        : 'Starting point of compression cycle. Low pressure superheated vapor (P1, T1).',
      workingPrinciple: isId
        ? `Tekanan: ${cycleState.suctionPressureBar} bar | Suhu: ${cycleState.suctionTempC}°C | Superheat: +${cycleState.superheatK} K.`
        : `Pressure: ${cycleState.suctionPressureBar} bar | Temp: ${cycleState.suctionTempC}°C | Superheat: +${cycleState.superheatK} K.`,
      operationalParameters: isId
        ? `Entalpi h1 = ${398.0 + Math.round(0.85 * cycleState.suctionTempC)} kJ/kg`
        : `Enthalpy h1 = ${398.0 + Math.round(0.85 * cycleState.suctionTempC)} kJ/kg`,
      troubleshootingTips: [
        isId ? 'Superheat positif (+5 K s/d +10 K) membuktikan bahwa uap sudah 100% kering tanpa tetesan cairan.' : 'Positive superheat (+5 K to +10 K) ensures dry vapor compression.',
      ],
    },
    point2: {
      id: 'point2',
      name: isId ? 'Point 2: Discharge / Keluar Kompresor' : 'Point 2: Compressor Discharge Outlet',
      tag: 'P2 (HP & T2)',
      category: isId ? 'Titik Pengukuran Diagram P-h' : 'P-H Diagram State Point',
      phPointLink: 'Titik 2 pada Grafik P-h',
      role: isId
        ? 'Titik puncak tekanan dan suhu siklus refrigerasi setelah pemampatan mekanik.'
        : 'Peak pressure and temperature state following isentropic mechanical compression.',
      workingPrinciple: isId
        ? `Tekanan: ${cycleState.dischargePressureBar} bar | Suhu: ${cycleState.dischargeTempC}°C | Gas Buang Panas.`
        : `Pressure: ${cycleState.dischargePressureBar} bar | Temp: ${cycleState.dischargeTempC}°C | Hot Gas.`,
      operationalParameters: isId
        ? `Entalpi h2 = ${425.0 + Math.round(0.95 * Math.max(0, cycleState.dischargeTempC - 40))} kJ/kg`
        : `Enthalpy h2 = ${425.0 + Math.round(0.95 * Math.max(0, cycleState.dischargeTempC - 40))} kJ/kg`,
      troubleshootingTips: [
        isId ? 'Suhu discharge terlalu tinggi (> 105°C) menandakan rasio kompresi ekstrem atau superheat suction berlebihan.' : 'Excessive discharge temperature (> 105°C) indicates high compression ratio or excessive suction superheat.',
      ],
    },
    point3: {
      id: 'point3',
      name: isId ? 'Point 3: Cairan Liquid Masuk TXV' : 'Point 3: Liquid Entering TXV',
      tag: 'P3 (HP & T3)',
      category: isId ? 'Titik Pengukuran Diagram P-h' : 'P-H Diagram State Point',
      phPointLink: 'Titik 3 pada Grafik P-h (Perpotongan Pc & T3)',
      role: isId
        ? 'Perpotongan garis Discharge Pressure (Pc) dan Temperatur Cairan T3. Menentukan derajat subcooling.'
        : 'Intersection of Discharge Pressure (Pc) and Liquid Temperature T3, defining cycle subcooling.',
      workingPrinciple: isId
        ? `Tekanan: ${cycleState.dischargePressureBar} bar | Suhu Cairan T3: ${cycleState.liquidTempC}°C | Subcooling: ${cycleState.subcoolingK.toFixed(1)} K${cycleState.subcoolingK < 3 ? ' (Abnormal Rendah)' : ' (Normal)'}.`
        : `Pressure: ${cycleState.dischargePressureBar} bar | Liquid Temp T3: ${cycleState.liquidTempC}°C | Subcooling: ${cycleState.subcoolingK.toFixed(1)} K${cycleState.subcoolingK < 3 ? ' (Abnormally Low)' : ' (Normal)'}.`,
      operationalParameters: isId
        ? `Entalpi h3 = ${256.0 - Math.round(1.35 * (40.0 - cycleState.liquidTempC))} kJ/kg`
        : `Enthalpy h3 = ${256.0 - Math.round(1.35 * (40.0 - cycleState.liquidTempC))} kJ/kg`,
      troubleshootingTips: [
        isId ? 'Subcooling memadai mencegah timbulnya gelembung uap flash sebelum freon masuk ke lubang katup ekspansi.' : 'Adequate subcooling prevents flash gas cavitation before the expansion valve.',
      ],
    },
    point4: {
      id: 'point4',
      name: isId ? 'Point 4: Ekspansi Keluar TXV' : 'Point 4: TXV Expansion Outlet',
      tag: 'P4 (LP & T4)',
      category: isId ? 'Titik Pengukuran Diagram P-h' : 'P-H Diagram State Point',
      phPointLink: 'Titik 4 pada Grafik P-h (Ekspansi Isentalpi h4 = h3)',
      role: isId
        ? 'Keluaran katup ekspansi TXV. Tekanan anjlok drastis ke Pe, menghasilkan campuran 2 fase dingin (~21% uap flash + 79% cairan dingin).'
        : 'TXV orifice exit. Pressure drops to Pe, flashing into a cold 2-phase mixture (~21% vapor + 79% liquid).',
      workingPrinciple: isId
        ? `Tekanan: ${cycleState.suctionPressureBar} bar | Suhu: ${cycleState.evapTempC}°C | Entalpi Tetap (h4 = h3).`
        : `Pressure: ${cycleState.suctionPressureBar} bar | Temp: ${cycleState.evapTempC}°C | Isenthalpic (h4 = h3).`,
      operationalParameters: isId
        ? `Entalpi h4 = h3 = ${256.0 - Math.round(1.35 * (40.0 - cycleState.liquidTempC))} kJ/kg`
        : `Enthalpy h4 = h3 = ${256.0 - Math.round(1.35 * (40.0 - cycleState.liquidTempC))} kJ/kg`,
      troubleshootingTips: [
        isId ? 'Penurunan entalpi ini menghasilkan efek refrigerasi (q_e = h1 - h4) yang mendinginkan ruangan.' : 'The enthalpy gap defines net refrigerating effect (q_e = h1 - h4).',
      ],
    },
    point5: {
      id: 'point5',
      name: isId ? 'Point 5: Outlet Evaporator (Sensing Bulb)' : 'Point 5: Evaporator Outlet Bulb Location',
      tag: 'P5 (T5 Superheat)',
      category: isId ? 'Titik Pengukuran Diagram P-h' : 'P-H Diagram State Point',
      phPointLink: 'Titik Akhir Penyerapan Kalor Evaporator',
      role: isId
        ? 'Tempat sensing bulb TXV membaca temperatur pipa uap hisap untuk mengendalikan bukaan jarum ekspansi secara otomatis.'
        : 'Location where TXV sensing bulb reads suction line temperature to regulate valve opening.',
      workingPrinciple: isId
        ? `Suhu: ${cycleState.suctionTempC}°C | Tekanan: ${cycleState.suctionPressureBar} bar.`
        : `Temp: ${cycleState.suctionTempC}°C | Pressure: ${cycleState.suctionPressureBar} bar.`,
      operationalParameters: isId
        ? `Superheat = T5 - Te = ${cycleState.superheatK} K`
        : `Superheat = T5 - Te = ${cycleState.superheatK} K`,
      troubleshootingTips: [
        isId ? 'Suhu di titik ini harus lebih hangat daripada suhu jenuh evaporasi (Te) agar kompresor aman dari cairan.' : 'Must be above saturation temperature Te to protect compressor from liquid return.',
      ],
    },
  };

  const activeExp = explanations[selectedComponent] ?? explanations.compressor;

  return (
    <div className="space-y-5">
      {/* TOP CONTROLS & STATUS BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Master Run / Pause & Speed */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleRun}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition cursor-pointer ${
              isRunning
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>ANIMASI BERJALAN (PAUSE)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping ml-0.5" />
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>RUN ANIMASI PIPING</span>
              </>
            )}
          </button>

          {/* Speed Selector */}
          <div className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 flex items-center gap-1">
            <span className="text-[10px] font-semibold text-slate-400 mr-1 uppercase">Speed:</span>
            {[0.25, 0.5, 1.0, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSimSpeed(spd)}
                className={`px-2 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                  simSpeed === spd
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Cutaway Toggle */}
          <button
            onClick={() => setIsCutaway(!isCutaway)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shadow-md cursor-pointer ${
              isCutaway
                ? 'bg-sky-500/20 border-sky-400/60 text-sky-300'
                : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Lihat Piston, Katup Reed, dan Mekanisme Internal"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isCutaway ? 'X-Ray Kompresor & TXV Aktif' : 'Bodi Solid Kompresor'}</span>
          </button>
        </div>

        {/* Right: Quick Diagnostic Toggles (Shortage, Defrost) */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Refrigerant Shortage Toggle */}
          <button
            onClick={() => setHasShortage(!hasShortage)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition cursor-pointer ${
              hasShortage
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Simulasikan kebocoran freon (muncul gelembung di sight glass & tekanan anjlok)"
          >
            <Droplet className={`w-3.5 h-3.5 ${hasShortage ? 'animate-bounce' : ''}`} />
            <span>{hasShortage ? 'Kurang Freon (Shortage) ON' : 'Freon Cukup (Normal)'}</span>
          </button>

          {/* Defrost Mode Toggle */}
          <button
            onClick={() => setIsDefrost(!isDefrost)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition cursor-pointer ${
              isDefrost
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Simulasikan proses defrost koil evaporator"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isDefrost ? 'Defrost Sedang Berlangsung' : 'Defrost Mati'}</span>
          </button>
        </div>
      </div>

      {/* MAIN ANIMATED SVG SCHEMATIC VIEWPORT (MODELED AFTER USER REFERENCE IMAGE) */}
      <div className="relative bg-[#070b14] border-2 border-slate-800 rounded-3xl p-3 sm:p-6 overflow-hidden shadow-2xl select-none">
        {/* Glow ambient background filters */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* THE INTERACTIVE SVG DIAGRAM */}
        <svg
          viewBox="0 0 1180 720"
          className="w-full h-auto max-h-[720px] font-sans text-xs drop-shadow-md"
        >
          <defs>
            {/* Pipe Flow Wave Patterns & Gradients */}
            <linearGradient id="hotGasGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>

            <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            <linearGradient id="suctionGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* Glowing filter for active selected item */}
            <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ============================================================== */}
          {/* 1. PIPING PATHS & FLOW ANIMATION                                */}
          {/* ============================================================== */}

          {/* PIPE 1: Discharge Line (Compressor -> Oil Separator -> Condenser Top) */}
          {/* Compressor discharge outlet at (640, 640) -> Oil Separator at (710, 640) */}
          <path
            d="M 640 640 L 710 640"
            stroke="#ef4444"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          {/* SINGLE DISCHARGE INLET PIPE: Oil Separator Top (740, 520) -> Single pipe up along x=1130 -> Enters Condenser Top at (1100, 24) */}
          <path
            d="M 740 520 L 740 480 L 1130 480 L 1130 24 L 1100 24"
            stroke="#ef4444"
            strokeWidth="14"
            fill="none"
            strokeLinejoin="round"
          />
          {/* Single Hot Gas Pulsing Wave inside discharge pipe */}
          {isRunning && (
            <path
              d="M 640 640 L 710 640 M 740 520 L 740 480 L 1130 480 L 1130 24 L 1100 24"
              stroke="#fbbf24"
              strokeWidth="6"
              strokeDasharray="14 10"
              strokeDashoffset={-flowOffset * 1.5}
              fill="none"
              strokeLinejoin="round"
              opacity="0.9"
            />
          )}

          {/* CONDENSER SERPENTINE COIL (Raised upward to TOP y=24, 7 massive passes snaking DOWNWARD to y=234, span x=740 to 1100) */}
          {/* Visibly much larger than evaporator, raised upwards for clean separation from liquid receiver */}
          <g id="condenser-coil">
            <path
              d="
                M 1100 24 L 740 24
                A 15 15 0 0 0 740 54
                L 1100 54
                A 15 15 0 0 1 1100 84
                L 740 84
                A 15 15 0 0 0 740 114
                L 1100 114
                A 15 15 0 0 1 1100 144
                L 740 144
                A 15 15 0 0 0 740 174
                L 1100 174
                A 15 15 0 0 1 1100 204
                L 740 204
                A 15 15 0 0 0 740 234
                L 1100 234
              "
              stroke="#f59e0b"
              strokeWidth="13"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {isRunning && (
              <path
                d="
                  M 1100 24 L 740 24
                  A 15 15 0 0 0 740 54
                  L 1100 54
                  A 15 15 0 0 1 1100 84
                  L 740 84
                  A 15 15 0 0 0 740 114
                  L 1100 114
                  A 15 15 0 0 1 1100 144
                  L 740 144
                  A 15 15 0 0 0 740 174
                  L 1100 174
                  A 15 15 0 0 1 1100 204
                  L 740 204
                  A 15 15 0 0 0 740 234
                  L 1100 234
                "
                stroke="#fde047"
                strokeWidth="5.5"
                strokeDasharray="10 8"
                strokeDashoffset={-flowOffset * 1.2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            )}
          </g>

          {/* PIPE 2: Condenser Bottom Exit (1100, 234) -> DUAL EXPANSION VIBRATION LOOPS -> Liquid Receiver */}
          {/* Tambahan loop ekstra: 2 loop melingkar bertingkat agar tidak langsung patah dan terlihat fleksibel profesional */}
          <path
            d="
              M 1100 234
              A 18 18 0 0 1 1124 252
              L 1124 262
              A 16 16 0 0 1 1108 278
              L 1045 278
              A 16 16 0 0 0 1029 294
              L 1029 304
              A 16 16 0 0 0 1045 320
              L 1090 320
              A 16 16 0 0 1 1106 336
              L 1106 348
              A 16 16 0 0 1 1090 364
              L 970 364
              L 970 345
            "
            stroke="#ea580c"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {isRunning && (
            <path
              d="
                M 1100 234
                A 18 18 0 0 1 1124 252
                L 1124 262
                A 16 16 0 0 1 1108 278
                L 1045 278
                A 16 16 0 0 0 1029 294
                L 1029 304
                A 16 16 0 0 0 1045 320
                L 1090 320
                A 16 16 0 0 1 1106 336
                L 1106 348
                A 16 16 0 0 1 1090 364
                L 970 364
                L 970 345
              "
              stroke="#38bdf8"
              strokeWidth="5"
              strokeDasharray="8 6"
              strokeDashoffset={-flowOffset}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* PIPE 3: Liquid Receiver Exit (Left Cap) -> Filter Drier -> Solenoid -> Sight Glass -> TXV Right Inlet */}
          <path
            d="M 775 380 L 745 380 L 745 260 L 465 260"
            stroke="#0284c7"
            strokeWidth="12"
            fill="none"
            strokeLinejoin="round"
          />
          {isRunning && (
            <path
              d="M 775 380 L 745 380 L 745 260 L 465 260"
              stroke="#93c5fd"
              strokeWidth="5"
              strokeDasharray={hasShortage ? "4 8" : "12 4"}
              strokeDashoffset={-flowOffset * 1.3}
              fill="none"
              strokeLinejoin="round"
            />
          )}

          {/* PIPE 4: TXV Expansion Exit -> EVAPORATOR BOTTOM INPUT (Enters at bottom y=232) */}
          <path
            d="M 427 232 L 380 232"
            stroke="#06b6d4"
            strokeWidth="15"
            fill="none"
            strokeLinejoin="round"
          />
          {isRunning && (
            <path
              d="M 427 232 L 380 232"
              stroke="#a5f3fc"
              strokeWidth="7"
              strokeDasharray="6 6"
              strokeDashoffset={-flowOffset * 1.6}
              fill="none"
              strokeLinejoin="round"
            />
          )}

          {/* EVAPORATOR SERPENTINE COIL (Enters at BOTTOM y=232, boils UPWARD to TOP suction header y=60) */}
          <g id="evaporator-coil">
            <path
              d="
                M 380 232 L 110 232
                A 22 22 0 0 1 110 188
                L 380 188
                A 22 22 0 0 0 380 144
                L 110 144
                A 22 22 0 0 1 110 100
                L 380 100
                A 20 20 0 0 0 380 60
                L 110 60
              "
              stroke="#e0f2fe"
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />
            {/* Boiling bubble stream inside evaporator moving upwards from bottom to top */}
            {isRunning && (
              <path
                d="
                  M 380 232 L 110 232
                  A 22 22 0 0 1 110 188
                  L 380 188
                  A 22 22 0 0 0 380 144
                  L 110 144
                  A 22 22 0 0 1 110 100
                  L 380 100
                  A 20 20 0 0 0 380 60
                  L 110 60
                "
                stroke="#38bdf8"
                strokeWidth="7"
                strokeDasharray="8 10"
                strokeDashoffset={-flowOffset * 1.4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>

          {/* PIPE 5: Top Suction Header (110, 60) -> Loops across top and all the way down left margin -> Suction Accumulator */}
          <path
            d="M 110 60 L 55 60 A 15 15 0 0 0 40 75 L 40 500 A 15 15 0 0 0 55 515 L 210 515 L 210 535"
            stroke="#f0f9ff"
            strokeWidth="16"
            fill="none"
            strokeLinejoin="round"
          />
          {isRunning && (
            <path
              d="M 110 60 L 55 60 A 15 15 0 0 0 40 75 L 40 500 A 15 15 0 0 0 55 515 L 210 515 L 210 535"
              stroke="#38bdf8"
              strokeWidth="6"
              strokeDasharray="12 8"
              strokeDashoffset={-flowOffset * 1.2}
              fill="none"
              strokeLinejoin="round"
            />
          )}

          {/* PIPE 6: Suction Accumulator U-Tube Exit (290, 535) -> Compressor Suction Port (430, 535) */}
          <path
            d="M 290 535 L 290 515 L 430 515 L 430 535"
            stroke="#f0f9ff"
            strokeWidth="16"
            fill="none"
            strokeLinejoin="round"
          />
          {isRunning && (
            <path
              d="M 290 535 L 290 515 L 430 515 L 430 535"
              stroke="#38bdf8"
              strokeWidth="6"
              strokeDasharray="12 8"
              strokeDashoffset={-flowOffset * 1.2}
              fill="none"
              strokeLinejoin="round"
            />
          )}

          {/* Capillary Line from Sensing Bulb on Top Suction Header to TXV Top Diaphragm Dome */}
          <path
            d="M 140 45 L 140 28 L 445 28 L 445 130"
            stroke="#f43f5e"
            strokeWidth="3.5"
            fill="none"
            strokeLinejoin="round"
          />
          {/* Sensing Bulb clamped to top suction pipe */}
          <rect
            x="115"
            y="48"
            width="50"
            height="15"
            rx="7.5"
            fill="#f43f5e"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-pointer hover:opacity-80"
            onClick={() => setSelectedComponent('sensing_bulb')}
          />
          <text x="140" y="42" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">
            Bulb (Point 5)
          </text>

          {/* ============================================================== */}
          {/* 2. EVAPORATOR FAN & FINS (Top Left)                           */}
          {/* ============================================================== */}
          <g id="evaporator-assembly">
            {/* Evaporator Wire Fins */}
            {Array.from({ length: 18 }).map((_, i) => (
              <line
                key={`evap-fin-${i}`}
                x1={120 + i * 15}
                y1="80"
                x2={120 + i * 15}
                y2="252"
                stroke="#475569"
                strokeWidth="1.5"
                opacity="0.75"
              />
            ))}

            {/* Evaporator Axial Fan (Centered behind coil) */}
            <g
              transform="translate(245, 166)"
              className="cursor-pointer"
              onClick={() => setSelectedComponent('evaporator_fan')}
            >
              <circle r="60" fill="#0f172a" stroke="#334155" strokeWidth="2" opacity="0.8" />
              <g transform={`rotate(${evapFanAngle})`}>
                <rect x="-8" y="-55" width="16" height="50" rx="6" fill="#38bdf8" opacity="0.9" />
                <rect x="-8" y="5" width="16" height="50" rx="6" fill="#38bdf8" opacity="0.9" />
                <rect x="-55" y="-8" width="50" height="16" rx="6" fill="#38bdf8" opacity="0.9" />
                <rect x="5" y="-8" width="50" height="16" rx="6" fill="#38bdf8" opacity="0.9" />
                <circle r="14" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2" />
              </g>
            </g>

            {/* Component Label */}
            <text
              x="245"
              y="266"
              fill="#ffffff"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
              className="cursor-pointer"
              onClick={() => setSelectedComponent('evaporator')}
            >
              Evaporator
            </text>

            {/* Defrost Indicator Lamp */}
            <g
              transform="translate(70, 320)"
              className="cursor-pointer"
              onClick={() => setIsDefrost(!isDefrost)}
            >
              <circle r="7" fill={isDefrost ? '#ef4444' : '#22c55e'} stroke="#ffffff" strokeWidth="1.5" />
              {isDefrost && <circle r="11" fill="none" stroke="#ef4444" strokeWidth="1.5" className="animate-ping" />}
              <text x="14" y="4" fill="#ffffff" fontSize="11" fontWeight="bold">
                Defrost {isDefrost ? '(Aktif)' : ''}
              </text>
            </g>

            {/* Superheat Control Box (Modeled exactly after user reference) */}
            <g transform="translate(190, 380)">
              <text x="0" y="0" fill="#ffffff" fontSize="12" fontWeight="bold">
                Superheat
              </text>
              {[
                { id: 'high' as SuperheatLevel, label: 'High', y: 16 },
                { id: 'normal' as SuperheatLevel, label: 'Normal', y: 38 },
                { id: 'low' as SuperheatLevel, label: 'Low', y: 60 },
              ].map((sh) => (
                <g
                  key={sh.id}
                  transform={`translate(0, ${sh.y})`}
                  className="cursor-pointer"
                  onClick={() => setSuperheatLevel(sh.id)}
                >
                  <rect
                    x="0"
                    y="0"
                    width="16"
                    height="16"
                    rx="3"
                    fill={superheatLevel === sh.id ? '#22c55e' : '#1e293b'}
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                  {superheatLevel === sh.id && (
                    <circle cx="8" cy="8" r="4" fill="#ffffff" />
                  )}
                  <text
                    x="24"
                    y="13"
                    fill={superheatLevel === sh.id ? '#22c55e' : '#94a3b8'}
                    fontSize="11"
                    fontWeight={superheatLevel === sh.id ? 'bold' : 'normal'}
                  >
                    {sh.label}
                  </text>
                </g>
              ))}
            </g>

            {/* Suction Pipe vertical text */}
            <text
              x="42"
              y="370"
              fill="#94a3b8"
              fontSize="12"
              fontWeight="bold"
              transform="rotate(-90, 42, 370)"
            >
              Suction Line
            </text>
          </g>

          {/* ============================================================== */}
          {/* 3. THERMOSTATIC EXPANSION VALVE (TXV - Center Left)           */}
          {/* ============================================================== */}
          <g
            id="txv-cross-section"
            transform="translate(445, 140)"
            className="cursor-pointer group"
            onClick={() => setSelectedComponent('txv')}
          >
            {selectedComponent === 'txv' && (
              <rect x="-40" y="-15" width="80" height="175" rx="10" fill="none" stroke="#38bdf8" strokeWidth="2" filter="url(#glowCyan)" />
            )}

            {/* Top Diaphragm Chamber (Dome) */}
            <path
              d="M -30 15 C -30 -10, 30 -10, 30 15 Z"
              fill="#fb7185"
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Diaphragm Flexible Disc */}
            <line
              x1="-26"
              y1={superheatLevel === 'high' ? 8 : superheatLevel === 'low' ? 14 : 11}
              x2="26"
              y2={superheatLevel === 'high' ? 8 : superheatLevel === 'low' ? 14 : 11}
              stroke="#be123c"
              strokeWidth="3"
            />

            {/* TXV Brass Body */}
            <rect x="-18" y="15" width="36" height="85" fill="#d97706" stroke="#b45309" strokeWidth="2" />

            {/* Push Pins & Orifice */}
            <line x1="-5" y1="18" x2="-5" y2="48" stroke="#e2e8f0" strokeWidth="2.5" />
            <line x1="5" y1="18" x2="5" y2="48" stroke="#e2e8f0" strokeWidth="2.5" />

            {/* Metering Needle & Spring */}
            <polygon
              points="0,58 -6,48 6,48"
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth="1"
            />
            {/* Coil Spring */}
            <path
              d="M -6 65 L 6 70 L -6 75 L 6 80 L -6 85"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="2"
            />

            {/* Bottom Superheat Adjustment Screw Cone */}
            <polygon
              points="0,100 -18,128 18,128"
              fill="#f59e0b"
              stroke="#d97706"
              strokeWidth="2"
            />
            <rect x="-6" y="98" width="12" height="10" fill="#78350f" />

            <text x="42" y="35" fill="#ffffff" fontSize="12" fontWeight="bold">
              Expansion valve
            </text>
            <text x="42" y="52" fill="#94a3b8" fontSize="10">
              (TXV)
            </text>
          </g>

          {/* ============================================================== */}
          {/* 4. LIQUID LINE CONTROLS: SIGHT GLASS, SOLENOID, FILTER DRIER  */}
          {/* ============================================================== */}

          {/* SIGHT GLASS (Around x=560, y=260) */}
          <g
            id="sight-glass-unit"
            transform="translate(560, 260)"
            className="cursor-pointer"
            onClick={() => setSelectedComponent('sight_glass')}
          >
            {selectedComponent === 'sight_glass' && (
              <circle r="26" fill="none" stroke="#22c55e" strokeWidth="2" filter="url(#glowGold)" />
            )}
            <circle r="18" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
            <circle r="13" fill="#0284c7" opacity="0.75" />
            {/* Moisture indicator dot */}
            <circle
              r="5"
              fill={hasShortage ? '#eab308' : '#22c55e'}
              stroke="#ffffff"
              strokeWidth="1"
            />
            {/* Bubbling animation if shortage */}
            {hasShortage && isRunning && (
              <>
                <circle cx="-6" cy="-4" r="2.5" fill="#ffffff" opacity="0.8" />
                <circle cx="5" cy="4" r="2" fill="#ffffff" opacity="0.8" />
                <circle cx="3" cy="-5" r="1.5" fill="#ffffff" opacity="0.8" />
              </>
            )}

            {/* Indicator label */}
            <g transform="translate(0, 36)">
              <circle r="5" fill="#22c55e" />
              <text x="10" y="4" fill="#94a3b8" fontSize="9">
                Indicate moisture (Green: Dry)
              </text>
            </g>
            <g transform="translate(0, 52)">
              <circle r="5" fill={hasShortage ? '#ef4444' : '#475569'} />
              <text x="10" y="4" fill="#94a3b8" fontSize="9">
                Shortage of Refrigerant
              </text>
            </g>
          </g>

          {/* SOLENOID VALVE (SV) */}
          <g
            id="solenoid-valve-unit"
            transform="translate(635, 245)"
            className="cursor-pointer"
            onClick={() => setSelectedComponent('solenoid_valve')}
          >
            {selectedComponent === 'solenoid_valve' && (
              <rect x="-4" y="-4" width="34" height="34" rx="4" fill="none" stroke="#38bdf8" strokeWidth="2" />
            )}
            <rect x="0" y="0" width="26" height="26" rx="4" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2" />
            <text x="13" y="17" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
              SV
            </text>
          </g>

          {/* FILTER DRIER (FS) */}
          <g
            id="filter-drier-unit"
            transform="translate(685, 245)"
            className="cursor-pointer"
            onClick={() => setSelectedComponent('filter_drier')}
          >
            {selectedComponent === 'filter_drier' && (
              <rect x="-4" y="-4" width="58" height="34" rx="8" fill="none" stroke="#38bdf8" strokeWidth="2" />
            )}
            <rect x="0" y="0" width="50" height="26" rx="8" fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
            <text x="25" y="17" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
              FS
            </text>
            <text x="25" y="42" fill="#94a3b8" fontSize="10" textAnchor="middle">
              Liquid line
            </text>
          </g>

          {/* ============================================================== */}
          {/* 5. CONDENSER ASSEMBLY & FAN (Top Right - Visibly Larger)      */}
          {/* ============================================================== */}
          <g id="condenser-assembly">
            {/* Extended Vertical Wire Fins across condenser (26 fins covering x=735 to 1115, raised to y=12 to 246) */}
            {Array.from({ length: 26 }).map((_, i) => (
              <line
                key={`cond-fin-${i}`}
                x1={735 + i * 15}
                y1="12"
                x2={735 + i * 15}
                y2="246"
                stroke="#475569"
                strokeWidth="1.5"
                opacity="0.8"
              />
            ))}

            {/* Condenser Axial Fan (Center at x=920, y=129, raised to align with raised 7-pass coil) */}
            <g
              transform="translate(920, 129)"
              className="cursor-pointer"
              onClick={() => setSelectedComponent('condenser_fan')}
            >
              <circle r="78" fill="#0f172a" stroke="#334155" strokeWidth="2.5" opacity="0.85" />
              <g transform={`rotate(${condFanAngle})`}>
                <rect x="-11" y="-74" width="22" height="68" rx="8" fill="#38bdf8" opacity="0.9" />
                <rect x="-11" y="6" width="22" height="68" rx="8" fill="#38bdf8" opacity="0.9" />
                <rect x="-74" y="-11" width="68" height="22" rx="8" fill="#38bdf8" opacity="0.9" />
                <rect x="6" y="-11" width="68" height="22" rx="8" fill="#38bdf8" opacity="0.9" />
                <circle r="19" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2.5" />
              </g>
            </g>

            {/* Fins label */}
            <g transform="translate(1115, 110)">
              <circle r="6" fill="#22c55e" />
              <text x="12" y="4" fill="#ffffff" fontSize="11" fontWeight="bold">
                Fins (Kondenser Besar)
              </text>
            </g>

            <text
              x="920"
              y="262"
              fill="#ffffff"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
              className="cursor-pointer"
              onClick={() => setSelectedComponent('condenser')}
            >
              Condenser (7-Pass Serpentine, Heavy Duty)
            </text>
          </g>

          {/* ============================================================== */}
          {/* 6. LIQUID RECEIVER TANK (Middle Right)                        */}
          {/* ============================================================== */}
          <g
            id="liquid-receiver-tank"
            transform="translate(775, 335)"
            className="cursor-pointer"
            onClick={() => setSelectedComponent('liquid_receiver')}
          >
            {selectedComponent === 'liquid_receiver' && (
              <rect x="-10" y="-10" width="350" height="105" rx="45" fill="none" stroke="#22c55e" strokeWidth="2" filter="url(#glowGold)" />
            )}
            {/* Cylindrical green capsule */}
            <rect
              x="0"
              y="0"
              width="330"
              height="85"
              rx="42.5"
              fill="#34d399"
              stroke="#059669"
              strokeWidth="3"
            />
            {/* Liquid level shading inside receiver */}
            <rect
              x="15"
              y="25"
              width="300"
              height="50"
              rx="25"
              fill="#10b981"
              opacity="0.8"
            />
            <text
              x="165"
              y="-12"
              fill="#ffffff"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
            >
              Liquid receiver
            </text>
          </g>

          {/* ============================================================== */}
          {/* 7. OIL SEPARATOR TANK (Bottom Right)                          */}
          {/* ============================================================== */}
          <g
            id="oil-separator-unit"
            transform="translate(705, 520)"
            className="cursor-pointer"
            onClick={() => setSelectedComponent('oil_separator')}
          >
            {selectedComponent === 'oil_separator' && (
              <rect x="-8" y="-8" width="70" height="166" rx="20" fill="none" stroke="#38bdf8" strokeWidth="2" />
            )}
            {/* Cylindrical vertical green vessel */}
            <rect
              x="0"
              y="0"
              width="54"
              height="150"
              rx="18"
              fill="#34d399"
              stroke="#059669"
              strokeWidth="3"
            />
            {/* Internal oil pool */}
            <rect x="5" y="110" width="44" height="32" rx="10" fill="#eab308" opacity="0.8" />

            {/* Oil return capillary line leading back to compressor crankcase */}
            <path
              d="M 27 150 L 27 165 L -80 165 L -80 150"
              stroke="#ca8a04"
              strokeWidth="4"
              fill="none"
              strokeLinejoin="round"
            />

            <text x="27" y="185" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
              Oil Separator
            </text>
          </g>

          {/* ============================================================== */}
          {/* 8. SUCTION ACCUMULATOR (Bottom Left)                          */}
          {/* ============================================================== */}
          <g
            id="suction-accumulator-unit"
            transform="translate(190, 520)"
            className="cursor-pointer"
            onClick={() => setSelectedComponent('suction_accumulator')}
          >
            {selectedComponent === 'suction_accumulator' && (
              <rect x="-8" y="-8" width="136" height="176" rx="28" fill="none" stroke="#38bdf8" strokeWidth="2" filter="url(#glowCyan)" />
            )}
            {/* White translucent vessel body */}
            <rect
              x="0"
              y="0"
              width="120"
              height="160"
              rx="24"
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth="3"
              opacity="0.9"
            />
            {/* Internal Liquid Refrigerant puddle at bottom */}
            <rect
              x="6"
              y={superheatLevel === 'low' ? 70 : 115}
              width="108"
              height={superheatLevel === 'low' ? 82 : 38}
              rx="16"
              fill="#38bdf8"
              opacity="0.6"
            />
            {/* Internal U-Tube: suction vapor enters top, U-tube draws dry vapor from high level */}
            <path
              d="M 100 0 L 100 135 A 15 15 0 0 1 70 135 L 70 30"
              stroke="#0284c7"
              strokeWidth="6"
              fill="none"
            />
            {/* Oil bleed hole at bottom of U-tube */}
            <circle cx="85" cy="148" r="2.5" fill="#eab308" />

            <text x="60" y="195" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
              Suction accumulator
            </text>
          </g>

          {/* ============================================================== */}
          {/* 9. RECIPROCATING COMPRESSOR WITH INTERNAL CUTAWAY (Bottom Ctr) */}
          {/* ============================================================== */}
          <g
            id="compressor-assembly"
            transform="translate(380, 510)"
            className="cursor-pointer"
            onClick={() => setSelectedComponent('compressor')}
          >
            {selectedComponent === 'compressor' && (
              <rect x="-10" y="-10" width="280" height="175" rx="16" fill="none" stroke="#22c55e" strokeWidth="2.5" filter="url(#glowGold)" />
            )}

            {/* Compressor Outer Cast Iron Green Shell */}
            <rect
              x="0"
              y="15"
              width="260"
              height="145"
              rx="14"
              fill={isCutaway ? '#064e3b' : '#10b981'}
              stroke="#047857"
              strokeWidth="4"
              opacity={isCutaway ? '0.75' : '1.0'}
            />

            {/* External Cooling Fins on Compressor */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={`comp-fin-${i}`}
                x1={60 + i * 16}
                y1="35"
                x2={60 + i * 16}
                y2="140"
                stroke="#047857"
                strokeWidth="2.5"
              />
            ))}

            {/* Electrical Terminal Box on Left */}
            <rect x="-18" y="30" width="22" height="90" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="2" />

            {/* Compressor Brand Emblem */}
            <g transform="translate(145, 100)">
              <polygon points="0,0 25,-10 50,0 25,10" fill="#ffffff" />
              <text x="25" y="3" fill="#047857" fontSize="8" fontWeight="black" textAnchor="middle">
                HVAC
              </text>
            </g>

            {/* INTERNAL RECIPROCATING MECHANISM CUTAWAY (Moving Crank, Conrod, Piston, & Valves) */}
            {isCutaway && (
              <g id="internal-slider-crank-mechanism" transform="translate(100, 75)">
                {/* Cylinder Sleeve Window */}
                <rect x="-24" y="-45" width="48" height="75" fill="#0f172a" stroke="#475569" strokeWidth="2" rx="4" />

                {/* Valve Plate & Reed Valves at Cylinder Top */}
                <line x1="-22" y1="-44" x2="22" y2="-44" stroke="#94a3b8" strokeWidth="4" />
                {/* Suction Reed Valve (flexes down on downstroke) */}
                <line
                  x1="-14"
                  y1="-42"
                  x2="-4"
                  y2={-42 + kinematics.suctionValveLift * 5}
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
                {/* Discharge Reed Valve (flexes up near TDC) */}
                <line
                  x1="4"
                  y1="-44"
                  x2="14"
                  y2={-44 - kinematics.dischargeValveLift * 6}
                  stroke="#ef4444"
                  strokeWidth="2"
                />

                {/* Crankshaft Center Axis at (0, 30) */}
                <circle cx="0" cy="30" r="14" fill="#64748b" stroke="#334155" strokeWidth="2" />
                {/* Counterweight */}
                <path
                  d="M -12 30 A 12 12 0 0 0 12 30 Z"
                  fill="#475569"
                  transform={`rotate(${-kinematics.crankAngleDeg}, 0, 30)`}
                />
                {/* Crankpin */}
                <circle
                  cx={kinematics.conrodPivotX}
                  cy={30 + kinematics.conrodPivotY}
                  r="5"
                  fill="#e2e8f0"
                />

                {/* Connecting Rod (Conrod) */}
                <line
                  x1={kinematics.conrodPivotX}
                  y1={30 + kinematics.conrodPivotY}
                  x2="0"
                  y2={-10 - kinematics.pistonNormalizedStroke * 22}
                  stroke="#eab308"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* Reciprocating Piston Body with Rings */}
                <g transform={`translate(0, ${-15 - kinematics.pistonNormalizedStroke * 22})`}>
                  <rect x="-20" y="-12" width="40" height="20" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                  {/* Piston Rings */}
                  <line x1="-20" y1="-7" x2="20" y2="-7" stroke="#1e293b" strokeWidth="1" />
                  <line x1="-20" y1="-3" x2="20" y2="-3" stroke="#1e293b" strokeWidth="1" />
                  {/* Wrist Pin */}
                  <circle cx="0" cy="2" r="3.5" fill="#475569" />
                </g>

                {/* Sump Oil Level in Crankcase */}
                <rect x="-35" y="46" width="130" height="14" fill="#eab308" opacity="0.6" rx="3" />
              </g>
            )}
          </g>

          {/* ============================================================== */}
          {/* 10. DUAL MANOMETERS (SUCTION LP & DISCHARGE HP GAUGES - ENLARGED) */}
          {/* ============================================================== */}
          <g
            id="manometer-gauges"
            transform="translate(515, 400)"
            className="cursor-pointer"
            onClick={() => setSelectedComponent('gauges')}
          >
            {/* Suction Gauge (LP - Left, Green Bezel, Distinct Header & Digital Display) */}
            <g transform="translate(-72, 0)">
              {/* Distinct Top Label Badge (Never Collides) */}
              <rect x="-60" y="-60" width="120" height="20" rx="5" fill="#022c22" stroke="#10b981" strokeWidth="1.5" />
              <text x="0" y="-46" fill="#34d399" fontSize="9.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
                SUCTION (LP)
              </text>
              <circle r="34" fill="#030712" stroke="#22c55e" strokeWidth="3.5" />
              <circle r="28" fill="#ffffff" />
              {/* Dial tick marks */}
              <circle r="23" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
              {/* Animated Needle */}
              <line
                x1="0"
                y1="0"
                x2={19 * Math.sin(((cycleState.suctionPressureBar - 1) / 5) * Math.PI - 1.2)}
                y2={-19 * Math.cos(((cycleState.suctionPressureBar - 1) / 5) * Math.PI - 1.2)}
                stroke="#dc2626"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <circle r="3.5" fill="#0f172a" />
              {/* ENLARGED PRESSURE DISPLAY BOX (PROMINENT DIGITAL LED) */}
              <rect x="-46" y="42" width="92" height="30" rx="7" fill="#022c22" stroke="#10b981" strokeWidth="2" filter="url(#glowCyan)" />
              <text x="0" y="63" fill="#34d399" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="ui-monospace, monospace">
                {cycleState.suctionPressureBar.toFixed(2)} <tspan fontSize="11" fontWeight="bold">bar</tspan>
              </text>
            </g>

            {/* Discharge Gauge (HP - Right, Red Bezel, Distinct Header & Digital Display) */}
            <g transform="translate(72, 0)">
              {/* Distinct Top Label Badge (Never Collides) */}
              <rect x="-65" y="-60" width="130" height="20" rx="5" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" />
              <text x="0" y="-46" fill="#fca5a5" fontSize="9.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
                DISCHARGE (HP)
              </text>
              <circle r="34" fill="#030712" stroke="#ef4444" strokeWidth="3.5" />
              <circle r="28" fill="#ffffff" />
              <circle r="23" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
              {/* Animated Needle */}
              <line
                x1="0"
                y1="0"
                x2={19 * Math.sin(((cycleState.dischargePressureBar - 5) / 20) * Math.PI - 1.2)}
                y2={-19 * Math.cos(((cycleState.dischargePressureBar - 5) / 20) * Math.PI - 1.2)}
                stroke="#dc2626"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <circle r="3.5" fill="#0f172a" />
              {/* ENLARGED PRESSURE DISPLAY BOX (PROMINENT DIGITAL LED) */}
              <rect x="-46" y="42" width="92" height="30" rx="7" fill="#450a0a" stroke="#f87171" strokeWidth="2" />
              <text x="0" y="63" fill="#fca5a5" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="ui-monospace, monospace">
                {cycleState.dischargePressureBar.toFixed(2)} <tspan fontSize="11" fontWeight="bold">bar</tspan>
              </text>
            </g>
          </g>

          {/* ============================================================== */}
          {/* 11. P-H DIAGRAM MEASUREMENT POINTS WITH DIGITAL TEMP READOUTS   */}
          {/* ============================================================== */}

          {/* POINT 1: Suction Line Entering Compressor (370, 500) */}
          <g
            transform="translate(365, 485)"
            className="cursor-pointer group"
            onClick={() => onSelectPoint('point1')}
          >
            {/* Number Pin */}
            <circle r="15" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.8" />
            <text x="0" y="5" fill="#0f172a" fontSize="12" fontWeight="900" textAnchor="middle">
              1
            </text>
            {/* Digital Display Box: Positioned to the left of suction pipe so it never collides with gauges */}
            <g transform="translate(-130, -22)">
              <rect x="0" y="0" width="120" height="46" rx="7" fill="#030712" stroke="#38bdf8" strokeWidth="1.8" filter="url(#glowCyan)" />
              <text x="8" y="13" fill="#94a3b8" fontSize="8.5" fontWeight="bold">POINT 1 (SUCTION)</text>
              <circle cx="108" cy="10" r="3.5" fill="#38bdf8" className="animate-ping" />
              {/* Digital Temperature */}
              <text x="8" y="29" fill="#38bdf8" fontSize="13" fontWeight="900" fontFamily="ui-monospace, monospace">
                T1: {cycleState.suctionTempC.toFixed(1)}°C
              </text>
              {/* Digital Pressure */}
              <text x="8" y="41" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="ui-monospace, monospace">
                P1: {cycleState.suctionPressureBar.toFixed(2)} bar
              </text>
            </g>
          </g>

          {/* POINT 2: Discharge Line (690, 625) */}
          <g
            transform="translate(685, 625)"
            className="cursor-pointer group"
            onClick={() => onSelectPoint('point2')}
          >
            <circle r="15" fill="#ef4444" stroke="#ffffff" strokeWidth="2.8" />
            <text x="0" y="5" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              2
            </text>
            {/* Digital Display Box */}
            <g transform="translate(-60, -56)">
              <rect x="0" y="0" width="120" height="46" rx="7" fill="#030712" stroke="#ef4444" strokeWidth="1.8" />
              <text x="8" y="13" fill="#fca5a5" fontSize="8.5" fontWeight="bold">POINT 2 (DISCHARGE)</text>
              <circle cx="108" cy="10" r="3.5" fill="#ef4444" className="animate-ping" />
              <text x="8" y="29" fill="#fb7185" fontSize="13" fontWeight="900" fontFamily="ui-monospace, monospace">
                T2: {cycleState.dischargeTempC.toFixed(1)}°C
              </text>
              <text x="8" y="41" fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="ui-monospace, monospace">
                P2: {cycleState.dischargePressureBar.toFixed(2)} bar
              </text>
            </g>
          </g>

          {/* POINT 3: Liquid Line entering TXV (505, 235) */}
          <g
            transform="translate(505, 235)"
            className="cursor-pointer group"
            onClick={() => onSelectPoint('point3')}
          >
            <circle r="15" fill="#2563eb" stroke="#ffffff" strokeWidth="2.8" />
            <text x="0" y="5" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              3
            </text>
            {/* Digital Display Box */}
            <g transform="translate(-60, -56)">
              <rect x="0" y="0" width="120" height="46" rx="7" fill="#030712" stroke="#60a5fa" strokeWidth="1.8" />
              <text x="8" y="13" fill="#93c5fd" fontSize="8.5" fontWeight="bold">POINT 3 (LIQUID LINE)</text>
              <circle cx="108" cy="10" r="3.5" fill="#60a5fa" className="animate-pulse" />
              <text x="8" y="29" fill="#60a5fa" fontSize="13" fontWeight="900" fontFamily="ui-monospace, monospace">
                T3: {cycleState.liquidTempC.toFixed(1)}°C
              </text>
              <text x="8" y="41" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="ui-monospace, monospace">
                P3: {cycleState.dischargePressureBar.toFixed(2)} bar
              </text>
            </g>
          </g>

          {/* POINT 4: TXV Expansion Outlet -> Evaporator Bottom Input (405, 232) */}
          <g
            transform="translate(405, 232)"
            className="cursor-pointer group"
            onClick={() => onSelectPoint('point4')}
          >
            <circle r="15" fill="#06b6d4" stroke="#ffffff" strokeWidth="2.8" />
            <text x="0" y="5" fill="#0f172a" fontSize="12" fontWeight="900" textAnchor="middle">
              4
            </text>
            {/* Digital Display Box */}
            <g transform="translate(-60, 20)">
              <rect x="0" y="0" width="120" height="46" rx="7" fill="#030712" stroke="#22d3ee" strokeWidth="1.8" />
              <text x="8" y="13" fill="#a5f3fc" fontSize="8.5" fontWeight="bold">POINT 4 (EVAP INLET)</text>
              <circle cx="108" cy="10" r="3.5" fill="#22d3ee" className="animate-pulse" />
              <text x="8" y="29" fill="#22d3ee" fontSize="13" fontWeight="900" fontFamily="ui-monospace, monospace">
                T4: {cycleState.evapTempC.toFixed(1)}°C
              </text>
              <text x="8" y="41" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="ui-monospace, monospace">
                P4: {cycleState.suctionPressureBar.toFixed(2)} bar
              </text>
            </g>
          </g>

          {/* POINT 5: Evaporator Top Suction Exit / Sensing Bulb (140, 60) */}
          <g
            transform="translate(140, 60)"
            className="cursor-pointer group"
            onClick={() => onSelectPoint('point5')}
          >
            <circle r="15" fill="#0284c7" stroke="#ffffff" strokeWidth="2.8" />
            <text x="0" y="5" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              5
            </text>
            {/* Digital Display Box */}
            <g transform="translate(18, -25)">
              <rect x="0" y="0" width="122" height="48" rx="7" fill="#030712" stroke="#38bdf8" strokeWidth="1.8" filter="url(#glowCyan)" />
              <text x="8" y="13" fill="#bae6fd" fontSize="8.5" fontWeight="bold">POINT 5 (BULB / S.H.)</text>
              <circle cx="110" cy="10" r="3.5" fill="#38bdf8" className="animate-ping" />
              <text x="8" y="30" fill="#38bdf8" fontSize="13" fontWeight="900" fontFamily="ui-monospace, monospace">
                T5: {(cycleState.evapTempC + cycleState.superheatK).toFixed(1)}°C
              </text>
              <text x="8" y="42" fill="#4ade80" fontSize="11" fontWeight="bold" fontFamily="ui-monospace, monospace">
                SH: {cycleState.superheatK.toFixed(1)} K
              </text>
            </g>
          </g>

          {/* INSTRUCTIONAL HINT BANNER ON SVG BOTTOM */}
          <text
            x="30"
            y="700"
            fill="#4ade80"
            fontSize="12"
            fontWeight="bold"
            className="animate-pulse"
          >
            👉 Klik komponen atau Point 1-5 untuk rincian termodinamika &amp; diagnosis evaluasi BAGUS vs JELEK
          </text>
        </svg>
      </div>

      {/* SHARPENED DIAGNOSTIC EVALUATION SUMMARY: "BAGUS vs JELEK" WITH FIELD SOLUTIONS */}
      {(() => {
        const isCycleGood =
          !hasShortage &&
          cycleState.superheatK >= 4 &&
          cycleState.superheatK <= 12 &&
          cycleState.dischargePressureBar <= 24 &&
          condenserFanRpm >= 500 &&
          evaporatorFanRpm >= 500 &&
          compressorRpm > 0;

        return (
          <div
            className={`rounded-2xl p-5 border-2 shadow-2xl transition-all ${
              isCycleGood
                ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-500/60 ring-2 ring-emerald-500/20'
                : 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 border-rose-500/80 ring-2 ring-rose-500/30'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs text-slate-950 ${
                    isCycleGood ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 animate-bounce'
                  }`}
                >
                  {isCycleGood ? '✓' : '!'}
                </span>
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    KESIMPULAN &amp; EVALUASI KINERJA REFRIGERASI
                  </div>
                  <h3
                    className={`text-lg font-black tracking-wide ${
                      isCycleGood ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isCycleGood
                      ? 'STATUS SISTEM: BAGUS (NORMAL & EFISIEN)'
                      : 'STATUS SISTEM: JELEK (ABNORMAL / PERLU TINDAKAN)'}
                  </h3>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black border uppercase self-start md:self-auto ${
                  isCycleGood
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                }`}
              >
                {isCycleGood ? 'GRADE A: OPTIMAL' : 'PERINGATAN KRITIKAL'}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 text-xs">
              {/* Left Column: Analytical Assessment */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90">
                <span className="font-bold uppercase text-[11px] text-cyan-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Parameter Hasil Pengukuran:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">COP Siklus</span>
                    <span className={`font-bold text-sm ${cycleState.cop >= 3.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {cycleState.cop.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Superheat (SH)</span>
                    <span className={`font-bold text-sm ${cycleState.superheatK >= 4 && cycleState.superheatK <= 10 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {cycleState.superheatK.toFixed(1)} K
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Subcooling (SC)</span>
                    <span className={`font-bold text-sm ${cycleState.subcoolingK >= 3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {cycleState.subcoolingK.toFixed(1)} K
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Tekanan LP (P1/P4)</span>
                    <span className="font-bold text-sm text-cyan-400">
                      {cycleState.suctionPressureBar.toFixed(2)} bar
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Tekanan HP (P2/P3)</span>
                    <span className={`font-bold text-sm ${cycleState.dischargePressureBar <= 24 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {cycleState.dischargePressureBar.toFixed(2)} bar
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Laju Sirkulasi</span>
                    <span className="font-bold text-sm text-slate-200">
                      {cycleState.massFlowLpm} LPM
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed pt-2">
                  {isCycleGood ? (
                    <span className="text-emerald-300 font-medium">
                      Kondisi siklus termodinamika <strong>SANGAT BAGUS</strong>. Tekanan hisap dan buang seimbang, superheat 5 - 10 K melindungi kompresor dari bahaya cairan (liquid slugging), subcooling cukup untuk mencegah flash gas sebelum TXV, dan pelepasan kalor kondenser optimal.
                    </span>
                  ) : (
                    <span className="text-rose-300 font-medium">
                      Kondisi siklus termodinamika <strong>JELEK / ABNORMAL</strong>.
                      {hasShortage && ' Terdeteksi kekurangan refrigeran parah (shortage), subcooling anjlok dan gelembung muncul di sight glass.'}
                      {cycleState.subcoolingK < 3 && ' Subcooling di bawah standar (< 3 K) akibat suhu cairan T3 tinggi atau perpindahan kalor kondenser terganggu, memicu risiko gelembung flash gas sebelum TXV.'}
                      {condenserFanRpm < 500 && ' Fan kondenser berputar terlalu lemah menyebabkan penumpukan kalor buang dan head pressure tinggi.'}
                      {evaporatorFanRpm < 500 && ' Fan evaporator terlalu pelan menyebabkan tekanan hisap anjlok dan risiko koil tertutup bunga es.'}
                      {cycleState.superheatK < 4 && ' Superheat terlalu rendah (< 4 K) berpotensi merusak katup kompresor akibat pukulan cairan (liquid slugging).'}
                    </span>
                  )}
                </p>
              </div>

              {/* Right Column: Troubleshooting Action Plan ("Jika Jelek Solusinya Apa") */}
              <div
                className={`p-3.5 rounded-xl border ${
                  isCycleGood
                    ? 'bg-slate-950/80 border-slate-800'
                    : 'bg-rose-950/50 border-rose-800/80'
                }`}
              >
                <span
                  className={`font-bold uppercase text-[11px] flex items-center gap-1.5 ${
                    isCycleGood ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  {isCycleGood ? 'Rekomendasi Pemeliharaan Rutin (Preventive):' : 'SOLUSI TEKNIS PERBAIKAN DI LAPANGAN (ACTION PLAN):'}
                </span>

                <ol className="space-y-2 mt-2 text-slate-200 list-decimal list-inside leading-relaxed">
                  {isCycleGood ? (
                    <>
                      <li>
                        <strong>Pertahankan kebersihan kisi sirip kondenser &amp; evaporator:</strong> Bersihkan debu berkala setiap 1-3 bulan untuk menjaga laju perpindahan kalor udara.
                      </li>
                      <li>
                        <strong>Pantau level oli karter dan sight glass:</strong> Pastikan warna indikator moisture tetap hijau (kering tanpa uap air) dan oli di level 1/2 kaca intip.
                      </li>
                      <li>
                        <strong>Verifikasi kalibrasi manometer:</strong> Lakukan cross-check tekanan LP/HP dengan termometer kontak digital (PT-chart) secara periodik.
                      </li>
                    </>
                  ) : (
                    <>
                      {hasShortage && (
                        <li className="text-amber-200">
                          <strong>Solusi Freon Kurang (Shortage):</strong> Lakukan leak check menggunakan electronic leak detector atau busa sabun di sambungan flare, brazing, dan valve stem. Perbaiki titik kebocoran, vakum sistem hingga &lt; 500 micron, lalu isi refrigeran cair sesuai timbangan nameplate.
                        </li>
                      )}
                      {condenserFanRpm < 500 && (
                        <li className="text-rose-200">
                          <strong>Solusi Head Pressure Tinggi / Fan Kondenser:</strong> Periksa kapasitor running dan belitan motor fan kondenser. Cuci kisi-kisi fin dengan chemical coil cleaner untuk merontokkan kerak minyak/debu yang menghalangi transfer kalor.
                        </li>
                      )}
                      {evaporatorFanRpm < 500 && (
                        <li className="text-cyan-200">
                          <strong>Solusi Suction Drop / Frosting Evaporator:</strong> Bersihkan filter udara yang buntu, naikkan putaran fan blower, dan aktifkan defrosting manual atau periksa sistem pemanas defrost bila sirip tertutup salju tebal.
                        </li>
                      )}
                      {cycleState.superheatK < 4 && (
                        <li className="text-amber-200">
                          <strong>Solusi Superheat Terlalu Rendah (&lt; 4 K):</strong> Buka cover TXV, putar adjustment screw <strong>searah jarum jam (clockwise)</strong> secara bertahap (1/4 putaran) untuk mencekik aliran cairan dan menaikkan superheat agar kompresor terlindungi dari liquid return.
                        </li>
                      )}
                      {cycleState.superheatK > 12 && (
                        <li className="text-amber-200">
                          <strong>Solusi Superheat Terlalu Tinggi (&gt; 12 K):</strong> Periksa apakah filter drier buntu (teraba dingin di outlet). Bila TXV kekurangan pasokan, putar adjustment screw <strong>berlawanan jarum jam</strong> untuk menambah aliran freon ke koil.
                        </li>
                      )}
                      <li>
                        <strong>Pemeriksaan Isolasi Sensing Bulb:</strong> Pastikan bulb TXV menempel kencang dengan klem logam pada posisi jam 1 atau jam 2 di pipa hisap horizontal dan dibalut isolasi insulasi kedap udara (Armaflex) agar tidak terpengaruh suhu ruang mesin.
                      </li>
                    </>
                  )}
                </ol>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DETAIL EXPLANATION CARD (ACTIVATED WHEN USER CLICKS ANY COMPONENT) */}
      <div className="bg-slate-900 border-2 border-sky-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-sky-400 ring-4 ring-sky-400/20" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold block">
                {activeExp.category} • Tag: {activeExp.tag}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">{activeExp.name}</h3>
            </div>
          </div>
          {activeExp.phPointLink && (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30 self-start sm:self-auto">
              🔗 {activeExp.phPointLink}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
          {/* Column 1: Role & Purpose */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-slate-300 uppercase text-[11px] flex items-center gap-1.5 text-cyan-400">
              <Zap className="w-3.5 h-3.5" />
              Fungsi &amp; Peran dalam Siklus:
            </span>
            <p className="text-slate-300 leading-relaxed">{activeExp.role}</p>
          </div>

          {/* Column 2: Working Principle */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-slate-300 uppercase text-[11px] flex items-center gap-1.5 text-amber-400">
              <Sliders className="w-3.5 h-3.5" />
              Prinsip Kerja &amp; Desain:
            </span>
            <p className="text-slate-300 leading-relaxed">{activeExp.workingPrinciple}</p>
            <div className="pt-2 border-t border-slate-800/80 font-mono text-[11px] text-emerald-400">
              <strong>Parameter Operasi:</strong> {activeExp.operationalParameters}
            </div>
          </div>

          {/* Column 3: Troubleshooting & Field Tips */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-slate-300 uppercase text-[11px] flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Troubleshooting &amp; Tips Lapangan:
            </span>
            <ul className="space-y-1 text-slate-300">
              {activeExp.troubleshootingTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-sky-400 shrink-0 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
