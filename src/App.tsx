import { useState } from 'react';
import { Header } from './components/Header';
import { CoolingLoadCalculator } from './components/CoolingLoadCalculator';
import { VentilationCalculator } from './components/VentilationCalculator';
import { DuctSizingCalculator } from './components/DuctSizingCalculator';
import { PsychrometricCalculator } from './components/PsychrometricCalculator';
import { UnitConverter } from './components/UnitConverter';
import { HvacGlossary } from './components/HvacGlossary';
import { CascadeCalculator } from './components/CascadeCalculator';
import { PhCycleCalculator } from './components/PhCycleCalculator';
import { HeatExchangerCalculator } from './components/HeatExchangerCalculator';
import { ColdRoomCalculator } from './components/ColdRoomCalculator';
import { EvaporatorCoilCalculator } from './components/EvaporatorCoilCalculator';
import { PlantTestingSuite } from './components/PlantTestingSuite';
import { RefrigerationPiping3D } from './components/RefrigerationPiping3D';
import { SpecificationReportModal } from './components/SpecificationReportModal';
import { AccessGuideModal } from './components/AccessGuideModal';
import { BrandCustomizerModal } from './components/BrandCustomizerModal';
import { useCompanyBranding } from './hooks/useCompanyBranding';
import {
  InsulationQuality,
  RoomType,
  SunExposure,
  UnitSystem,
  WindowType,
} from './types/hvac';
import { calculateCoolingLoad, ROOM_PRESETS } from './utils/hvacCalculations';
import { AppLanguage } from './utils/i18n';

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>('id');
  const [activeTab, setActiveTab] = useState<string>('cold_room');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState<boolean>(false);

  // Company Branding management
  const { branding, updateBranding, applyPreset, resetToDefault } = useCompanyBranding();

  // Cooling Load Parameters
  const [length, setLength] = useState<number>(4);
  const [width, setWidth] = useState<number>(3.5);
  const [height, setHeight] = useState<number>(3.0);
  const [roomType, setRoomType] = useState<RoomType>('bedroom');
  const [sunExposure, setSunExposure] = useState<SunExposure>('sheltered');
  const [occupants, setOccupants] = useState<number>(2);
  const [equipmentWattage, setEquipmentWattage] = useState<number>(200);
  const [windowType, setWindowType] = useState<WindowType>('standard');
  const [insulationQuality, setInsulationQuality] = useState<InsulationQuality>('standard');
  const [hoursPerDay, setHoursPerDay] = useState<number>(10);
  const [kwhTariffIDR, setKwhTariffIDR] = useState<number>(1500);

  // Calculate cooling load
  const coolingResult = calculateCoolingLoad({
    length,
    width,
    height,
    unitSystem,
    roomType,
    sunExposure,
    occupants,
    equipmentWattage,
    windowType,
    insulationQuality,
    hoursPerDay,
    kwhTariffIDR,
  });

  // Calculate estimated CFM from cooling load (~400 CFM per 1 TR / 12,000 BTU)
  const suggestedCFM = Math.round((coolingResult.totalBTU / 12000) * 400);

  const handleDimensionChange = (field: 'length' | 'width' | 'height', val: number) => {
    if (field === 'length') setLength(val);
    if (field === 'width') setWidth(val);
    if (field === 'height') setHeight(val);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = ROOM_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      if (unitSystem === 'metric') {
        setLength(preset.length);
        setWidth(preset.width);
        setHeight(preset.height);
      } else {
        setLength(Math.round(preset.length * 3.28084 * 10) / 10);
        setWidth(Math.round(preset.width * 3.28084 * 10) / 10);
        setHeight(Math.round(preset.height * 3.28084 * 10) / 10);
      }
      setRoomType(preset.roomType);
      setSunExposure(preset.sunExposure);
      setOccupants(preset.occupants);
      setEquipmentWattage(preset.equipmentWattage);
      setWindowType(preset.windowType);
      setInsulationQuality(preset.insulationQuality);
    }
  };

  const handleToggleUnit = (newUnit: UnitSystem) => {
    if (newUnit === unitSystem) return;
    if (newUnit === 'imperial') {
      // Convert metric to imperial
      setLength((prev) => Math.round(prev * 3.28084 * 10) / 10);
      setWidth((prev) => Math.round(prev * 3.28084 * 10) / 10);
      setHeight((prev) => Math.round(prev * 3.28084 * 10) / 10);
    } else {
      // Convert imperial to metric
      setLength((prev) => Math.round((prev * 0.3048) * 10) / 10);
      setWidth((prev) => Math.round((prev * 0.3048) * 10) / 10);
      setHeight((prev) => Math.round((prev * 0.3048) * 10) / 10);
    }
    setUnitSystem(newUnit);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract compliant navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unitSystem={unitSystem}
        onToggleUnit={handleToggleUnit}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
        branding={branding}
        onOpenBrandModal={() => setIsBrandModalOpen(true)}
        language={language}
        onChangeLanguage={setLanguage}
      />

      {/* Main Content Area */}
      <main className={activeTab === 'ph_diagram' ? 'flex-1 w-full p-0' : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
        {activeTab === 'cold_room' && <ColdRoomCalculator branding={branding} />}

        {activeTab === 'evaporator_coil' && <EvaporatorCoilCalculator branding={branding} />}

        {activeTab === 'ph_diagram' && (
          <PhCycleCalculator
            branding={branding}
            onOpen3dPiping={() => setActiveTab('piping_3d')}
            language={language}
            onChangeLanguage={setLanguage}
            unitSystem={unitSystem}
            onToggleUnit={handleToggleUnit}
          />
        )}

        {activeTab === 'heat_exchanger' && (
          <HeatExchangerCalculator
            branding={branding}
            language={language}
          />
        )}

        {activeTab === 'piping_3d' && (
          <RefrigerationPiping3D
            branding={branding}
            language={language}
            onNavigateToPhCalc={() => setActiveTab('ph_diagram')}
          />
        )}

        {activeTab === 'cascade' && <CascadeCalculator branding={branding} />}

        {activeTab === 'plant_testing' && <PlantTestingSuite branding={branding} language={language} />}

        {activeTab === 'cooling' && (
          <CoolingLoadCalculator
            unitSystem={unitSystem}
            length={length}
            width={width}
            height={height}
            onChangeDimension={handleDimensionChange}
            roomType={roomType}
            onChangeRoomType={setRoomType}
            sunExposure={sunExposure}
            onChangeSunExposure={setSunExposure}
            occupants={occupants}
            onChangeOccupants={setOccupants}
            equipmentWattage={equipmentWattage}
            onChangeEquipmentWattage={setEquipmentWattage}
            windowType={windowType}
            onChangeWindowType={setWindowType}
            insulationQuality={insulationQuality}
            onChangeInsulation={setInsulationQuality}
            hoursPerDay={hoursPerDay}
            onChangeHoursPerDay={setHoursPerDay}
            kwhTariffIDR={kwhTariffIDR}
            onChangeTariff={setKwhTariffIDR}
            result={coolingResult}
            onApplyPreset={handleApplyPreset}
          />
        )}

        {activeTab === 'ventilation' && (
          <VentilationCalculator
            unitSystem={unitSystem}
            defaultLength={length}
            defaultWidth={width}
            defaultHeight={height}
          />
        )}

        {activeTab === 'duct' && (
          <DuctSizingCalculator
            unitSystem={unitSystem}
            suggestedCFM={suggestedCFM}
          />
        )}

        {activeTab === 'psychrometric' && (
          <PsychrometricCalculator unitSystem={unitSystem} />
        )}

        {activeTab === 'converter' && <UnitConverter />}

        {activeTab === 'glossary' && <HvacGlossary />}
      </main>

      {/* Report Modal */}
      <SpecificationReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        coolingResult={coolingResult}
        length={length}
        width={width}
        height={height}
        unitSystem={unitSystem}
        roomType={roomType}
        occupants={occupants}
        equipmentWattage={equipmentWattage}
        branding={branding}
      />

      {/* Access & Install Guide Modal */}
      <AccessGuideModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
      />

      {/* Brand Identity & Logo Customizer Modal */}
      <BrandCustomizerModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        branding={branding}
        onUpdateBranding={updateBranding}
        onApplyPreset={applyPreset}
        onReset={resetToDefault}
      />

      {/* Quiet Technical Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-semibold">{branding.companyName}</span>
            <span className="text-cyan-400 font-mono">({branding.shortName})</span>
            <span aria-hidden="true">·</span>
            <span>Standar Rekayasa ASHRAE 62.1 &amp; SMACNA</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span>1 PK ≈ 9.000 BTU/h</span>
            <span>1 TR = 12.000 BTU/h</span>
            <span>1 CFM ≈ 1.699 m³/h</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
