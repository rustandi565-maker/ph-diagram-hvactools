import { UnitSystem } from '../types/hvac';
import { CompanyBranding } from '../types/branding';
import { RtuLogo } from './RtuLogo';
import { AppLanguage, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../utils/i18n';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  unitSystem: UnitSystem;
  onToggleUnit: (unit: UnitSystem) => void;
  onOpenReportModal: () => void;
  onOpenAccessModal: () => void;
  branding: CompanyBranding;
  onOpenBrandModal: () => void;
  language?: AppLanguage;
  onChangeLanguage?: (lang: AppLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  unitSystem,
  onToggleUnit,
  onOpenReportModal,
  onOpenAccessModal,
  branding,
  onOpenBrandModal,
  language = 'id',
  onChangeLanguage,
}) => {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.id;

  const navItems = [
    { id: 'cold_room', label: t.coldRoom },
    { id: 'evaporator_coil', label: t.evapCoil },
    { id: 'ph_diagram', label: t.phDiagram },
    { id: 'heat_exchanger', label: t.heatExchanger },
    { id: 'piping_3d', label: t.piping3d },
    { id: 'cascade', label: t.cascade },
    { id: 'plant_testing', label: t.plantTesting },
    { id: 'cooling', label: t.coolingLoad },
    { id: 'ventilation', label: t.ventilation },
    { id: 'duct', label: t.ductSizing },
    { id: 'psychrometric', label: t.psychrometric },
    { id: 'converter', label: t.unitConverter },
    { id: 'glossary', label: t.glossary },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Wordmark with quick Brand Editor trigger */}
          <button
            onClick={onOpenBrandModal}
            className="flex items-center gap-3 shrink-0 text-left group hover:opacity-95 transition-opacity cursor-pointer"
            title="Klik untuk membuka Studio Logo & Branding CV"
          >
            <RtuLogo size={38} branding={branding} idPrefix="header-main" className="w-9 h-9 shrink-0 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white truncate max-w-[200px] sm:max-w-[280px]">
                  {branding.companyName}
                </span>
                <span className="text-[10px] font-mono px-1 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded font-semibold group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                  {branding.shortName}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400/90 tracking-wide truncate max-w-[220px] sm:max-w-[320px]">
                {branding.tagline}
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Unit & Language Selector */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Switcher */}
            {onChangeLanguage && (
              <div className="hidden sm:flex items-center p-0.5 bg-slate-800/90 rounded border border-slate-700/80 text-xs font-mono">
                {SUPPORTED_LANGUAGES.map((langOpt) => (
                  <button
                    key={langOpt.code}
                    onClick={() => onChangeLanguage(langOpt.code)}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                      language === langOpt.code
                        ? 'bg-cyan-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={langOpt.nativeName}
                  >
                    <span>{langOpt.flag}</span>
                    <span className="uppercase text-[10px]">{langOpt.code}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Unit switch */}
            <div className="flex items-center p-0.5 bg-slate-800/90 rounded border border-slate-700/80 text-xs font-mono">
              <button
                onClick={() => onToggleUnit('metric')}
                className={`px-2 py-1 rounded transition-colors ${
                  unitSystem === 'metric'
                    ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sistem Metrik (Meter, °C, m³/h)"
              >
                m
              </button>
              <button
                onClick={() => onToggleUnit('imperial')}
                className={`px-2 py-1 rounded transition-colors ${
                  unitSystem === 'imperial'
                    ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sistem Imperial (Feet, °F, CFM)"
              >
                ft
              </button>
            </div>

            <button
              onClick={onOpenBrandModal}
              className="hidden md:flex px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-amber-500/40 rounded transition-all whitespace-nowrap shrink-0 items-center gap-1.5"
              title="Kustomisasi identitas perusahaan, unduh logo SVG/PNG & kop surat"
            >
              <span>🎨 Brand CV</span>
            </button>

            <button
              onClick={onOpenAccessModal}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 rounded transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
              title="Cara akses cepat, pasang di PC & HP serta scan QR code"
            >
              <span>💻 Pasang</span>
            </button>

            <button
              onClick={onOpenReportModal}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 rounded transition-all shadow-sm shadow-cyan-500/20 whitespace-nowrap shrink-0 flex items-center gap-1.5 font-bold"
            >
              <span>{t.exportReport}</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet scrollable tab bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2.5 pt-1 scrollbar-none border-t border-slate-800/60">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
