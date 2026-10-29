import React, { useState } from 'react';

interface GlossaryItem {
  term: string;
  category: string;
  shortDesc: string;
  detail: string;
  formulaOrRule?: string;
}

const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'BTU / jam (British Thermal Unit per Hour)',
    category: 'Kapasitas Pendingin',
    shortDesc: 'Satuan standar internasional untuk mengukur daya serap panas mesin AC.',
    detail: 'Satu BTU adalah jumlah energi panas yang diperlukan untuk menaikkan suhu satu pon air sebesar 1° Fahrenheit. Dalam AC, semakin tinggi angka BTU/jam, semakin cepat dan mampu AC mendinginkan ruangan besar.',
    formulaOrRule: '1 PK ≈ 9.000 BTU/jam · 1 kW ≈ 3.412 BTU/jam · 1 TR = 12.000 BTU/jam',
  },
  {
    term: 'PK (Paardenkracht / Horsepower)',
    category: 'Kapasitas Pendingin',
    shortDesc: 'Istilah populer di Indonesia untuk menyatakan kapasitas kompresor pendingin.',
    detail: 'Berasal dari bahasa Belanda yang berarti daya kuda. Di pasaran Indonesia, AC umumnya dijual dalam ukuran: 0.5 PK (±5.000 BTU), 0.75 PK (±7.000 BTU), 1 PK (±9.000 BTU), 1.5 PK (±12.000 BTU), 2 PK (±18.000 BTU), dan 2.5 PK (±24.000 BTU).',
    formulaOrRule: 'Kebutuhan PK = Total BTU / 9.000 (dibulatkan ke atas)',
  },
  {
    term: 'CFM (Cubic Feet per Minute)',
    category: 'Aliran Udara (Airflow)',
    shortDesc: 'Laju volume udara yang dipindahkan oleh kipas blower atau saluran ducting per menit.',
    detail: 'Menentukan seberapa kuat hembusan angin pada evaporator AC atau exhaust fan. Standar praktis AC biasanya membutuhkan aliran udara sekitar 400 CFM per 1 Ton Refrigerasi (TR) atau 12.000 BTU pendingin.',
    formulaOrRule: 'Standar HVAC: ~400 CFM per 1 TR (12.000 BTU) pendinginan',
  },
  {
    term: 'ACH (Air Changes per Hour)',
    category: 'Ventilasi',
    shortDesc: 'Frekuensi penggantian seluruh volume udara dalam ruangan per jam.',
    detail: 'Diperlukan untuk menjaga kualitas udara dalam ruangan (IAQ), membuang gas CO2, bau, dan kelembapan. Kamar tidur membutuhkan 3-5 ACH, kantor 4-6 ACH, dan dapur restoran membutuhkan 15-20 ACH.',
    formulaOrRule: 'CFM = (Volume Ruangan dalam Kaki Kubik × ACH) / 60',
  },
  {
    term: 'Titik Embun (Dew Point)',
    category: 'Psikrometrik',
    shortDesc: 'Suhu di mana udara menjadi jenuh dan uap air mulai mengembun menjadi tetesan air.',
    detail: 'Sangat krusial bagi instalasi AC. Jika pipa tembaga pendingin atau kisi diffuser AC memiliki suhu permukaan di bawah titik embun ruangan, air akan mengembun lebat (kondensasi) dan menetes merusak plafon. Oleh karena itu, insulasi busa hitam (Armaflex) wajib dipasang rapat.',
    formulaOrRule: 'Kondensasi terjadi jika: Suhu Permukaan Pipa ≤ Titik Embun Udara',
  },
  {
    term: 'AC Inverter vs Non-Inverter (Standar)',
    category: 'Teknologi & Efisiensi',
    shortDesc: 'Perbedaan cara kerja motor kompresor dalam menjaga kestabilan suhu ruangan.',
    detail: 'AC Non-Inverter bekerja dengan siklus On/Off secara konstan: mati saat dingin tercapai dan hidup kembali saat ruangan menghangat (lonjakan daya listrik berulang). AC Inverter memodulasi kecepatan putaran kompresor secara halus tanpa mati-hidup, menghemat listrik hingga 30-40% dan menjaga suhu sangat stabil.',
  },
  {
    term: 'EER (Energy Efficiency Ratio) & CSPF',
    category: 'Teknologi & Efisiensi',
    shortDesc: 'Indeks rasio efisiensi energi pendingin terhadap daya listrik yang dikonsumsi.',
    detail: 'EER dihitung dengan membagi total kapasitas pendinginan (BTU/jam) dengan daya listrik input (Watt). Di Indonesia, AC hemat energi memiliki label bintang 4 atau 5 dengan CSPF tinggi.',
    formulaOrRule: 'EER = Kapasitas BTU/h ÷ Daya Listrik Watt',
  },
  {
    term: 'Refrigerant R32 vs R410A vs R22',
    category: 'Refrigerant / Freon',
    shortDesc: 'Cairan/gas pendingin yang bersirkulasi menyerap dan membuang panas.',
    detail: 'R22 sudah dilarang karena merusak lapisan ozon. R410A ramah ozon namun bertekanan tinggi. R32 adalah refrigerant generasi terbaru dengan efisiensi perpindahan panas lebih tinggi, potensi pemanasan global (GWP) 3x lebih rendah dibanding R410A, dan hemat freon.',
  },
  {
    term: 'Proses Vakum Pipa (Vacuuming)',
    category: 'Pemasangan & Servis',
    shortDesc: 'Prosedur wajib mengosongkan udara dan uap air dari pipa instalasi AC sebelum dinyalakan.',
    detail: 'Udara yang tertinggal di dalam pipa mengandung uap air dan gas yang tidak dapat terkondensasi. Jika tidak divakum hingga tekanan vakum (<500 mikron), uap air akan membeku di pipa kapiler, memicu karat asam di oli kompresor, dan merusak kompresor secara permanen.',
    formulaOrRule: 'Standar pabrik AC: Wajib vakum minimal 15-20 menit dengan pompa vakum',
  },
  {
    term: 'Static Pressure (Tekanan Statis)',
    category: 'Saluran Udara (Ducting)',
    shortDesc: 'Hambatan aliran udara yang dialami fan saat mendorong udara melalui ducting dan filter.',
    detail: 'Diukur dalam satuan in. wg atau Pascal. Blower harus dipilih dengan daya dorong yang cukup untuk mengatasi gesekan saluran, tikungan (elbow), peredam suara, dan kisi keluaran (grille/diffuser).',
  },
  {
    term: 'Evaporator Coil Convector (Pendingin Air)',
    category: 'Perpindahan Kalor',
    shortDesc: 'Gulungan pipa terendam dalam tangki air untuk menyerap kalor cairan melalui ekspansi langsung refrigerant.',
    detail: 'Bekerja dengan prinsip mendidihkan freon dingin di dalam pipa spiral terendam air (DX Convector Chiller). Air yang dingin dapat disirkulasikan untuk AC gedung (FCU/AHU), pendingin susu/minuman, atau proses industri.',
    formulaOrRule: 'Panjang Pipa L = Q / (U × π × OD × LMTD) × Safety Factor',
  },
  {
    term: 'LMTD (Logarithmic Mean Temperature Difference)',
    category: 'Perpindahan Kalor',
    shortDesc: 'Beda suhu rata-rata logaritmik sebagai gaya pendorong (driving force) perpindahan panas.',
    detail: 'Menggambarkan gradien beda suhu aktual antara fluida air yang mengalir mendingin dengan suhu refrigerant yang mendidih secara konstan di dalam pipa evaporator.',
    formulaOrRule: 'LMTD = (ΔT₁ - ΔT₂) / ln(ΔT₁ / ΔT₂)',
  },
  {
    term: 'Koefisien Perpindahan Kalor Menyeluruh (U-Value)',
    category: 'Perpindahan Kalor',
    shortDesc: 'Kemampuan total penukar panas mengalirkan energi kalor melewati dinding pipa dari air ke freon.',
    detail: 'Dipengaruhi oleh turbulensi air (alami vs agitator vs aliran paksa), konduktivitas termal material pipa (tembaga 386 W/mK vs stainless steel 16 W/mK), dan kerak kotoran (fouling resistance).',
    formulaOrRule: 'Tangki Diam: U ≈ 200 W/m²K · Beragitator: U ≈ 450 - 650 W/m²K · Aliran Paksa: U ≈ 880 W/m²K',
  },
];

export const HvacGlossary: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Perpindahan Kalor', 'Kapasitas Pendingin', 'Aliran Udara (Airflow)', 'Ventilasi', 'Psikrometrik', 'Teknologi & Efisiensi', 'Pemasangan & Servis'];

  const filteredItems = GLOSSARY_ITEMS.filter((item) => {
    const matchSearch =
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.shortDesc.toLowerCase().includes(search.toLowerCase()) ||
      item.detail.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-base font-semibold text-white tracking-wide">
          Glosarium & Panduan Teknik HVAC
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Kamus referensi istilah penting seputar tata udara, pemilihan unit pendingin AC, ventilasi, psikrometrik, dan standar pemasangan teknis.
        </p>

        {/* Search & Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Cari istilah (misal: BTU, PK, Inverter, Vakum, Titik Embun)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
          />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded text-xs whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Glossary Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.term}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-5 flex flex-col justify-between transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                  {item.category}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                {item.term}
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-1.5">
                {item.shortDesc}
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {item.detail}
              </p>
            </div>

            {item.formulaOrRule && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="block text-[10px] font-mono uppercase text-slate-500 mb-0.5">
                  Rumus / Patokan Praktis:
                </span>
                <code className="text-xs font-mono text-cyan-300 block bg-slate-950 p-2 rounded border border-slate-800/80">
                  {item.formulaOrRule}
                </code>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
