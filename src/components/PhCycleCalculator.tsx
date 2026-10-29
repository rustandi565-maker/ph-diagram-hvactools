import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ExtendedRefrigerantId,
  PressureUnit,
  PowerUnit,
  PhReportMeta,
  CycleStatePoint,
  PhCycleResult,
  SavedPhCyclePlot,
} from '../types/phDiagram';
import { CompanyBranding } from '../types/branding';
import {
  calculatePhRefrigerationCycle,
  EXTENDED_REFRIGERANTS,
  REFRIGERANT_BLEND_DATA,
  calculateExtendedStatePoints,
  ExtendedStatePointRow,
  psiToBar,
  barToPsi,
  kpaToBar,
  barToKpa,
  getRefSaturationTemp,
  getRefSaturationPressure,
  getRefLiquidEnthalpy,
  getRefVaporEnthalpy,
  getRefSuperheatedEnthalpy,
  getRefSubcooledEnthalpy,
  getRefVaporSpecificVolume,
  getRefLiquidSpecificVolume,
  STANDARD_CHART_SPECS,
} from '../utils/phThermodynamics';
import { PhDiagramCanvas } from './PhDiagramCanvas';
import { PhCycleReportModal } from './PhCycleReportModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { buildWhatsAppReportMessage } from '../utils/whatsappShare';
import { SavedPlotsModal } from './SavedPlotsModal';
import { getSavedPhPlots, savePhPlot, deletePhPlot } from '../utils/phSavedPlots';
import { AppLanguage, TRANSLATIONS } from '../utils/i18n';
import { RefrigerantSelectorModal } from './RefrigerantSelectorModal';
import { RefrigerantSaturationTableModal } from './RefrigerantSaturationTableModal';

import { UnitSystem } from '../types/hvac';

interface PhCycleCalculatorProps {
  branding?: CompanyBranding;
  onOpen3dPiping?: () => void;
  language?: AppLanguage;
  onChangeLanguage?: (lang: AppLanguage) => void;
  unitSystem?: UnitSystem;
  onToggleUnit?: (unit: UnitSystem) => void;
}

export const PhCycleCalculator: React.FC<PhCycleCalculatorProps> = ({
  branding,
  onOpen3dPiping,
  language: propLanguage,
  onChangeLanguage: propOnChangeLanguage,
  unitSystem: propUnitSystem,
  onToggleUnit: propOnToggleUnit,
}) => {
  // Container ref for browser fullscreen API
  const workstationRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // 0. Language State (English, Indonesia, etc.)
  const [localLanguage, setLocalLanguage] = useState<AppLanguage>(propLanguage ?? 'id');
  const language = propLanguage ?? localLanguage;
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.id;
  const isEn = language === 'en';

  useEffect(() => {
    if (propLanguage) {
      setLocalLanguage(propLanguage);
    }
  }, [propLanguage]);

  const handleLanguageChange = (newLang: AppLanguage) => {
    setLocalLanguage(newLang);
    if (propOnChangeLanguage) {
      propOnChangeLanguage(newLang);
    }
  };

  // 1. REPORT HEADER METADATA
  const [reportMeta, setReportMeta] = useState<PhReportMeta>(() => {
    try {
      const saved = localStorage.getItem('rtu_report_meta_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      productName: 'Trainer Refrigerasi Kompresi Uap R407C',
      trainerName: 'Trainer Refrigerasi Kompresi Uap R407C',
      modelUnit: 'RTU-REF-407C',
      workOrderNumber: 'WL-13095-01',
      projectName: 'Pengujian Siklus Refrigerasi & Diagram P-h',
      reportDate: new Date().toISOString().split('T')[0],
    };
  });

  const handleUpdateReportMeta = (meta: PhReportMeta) => {
    setReportMeta(meta);
    try {
      localStorage.setItem('rtu_report_meta_v1', JSON.stringify(meta));
    } catch {}
  };

  // Modals visibility
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);
  const [isRefModalOpen, setIsRefModalOpen] = useState<boolean>(false);
  const [isSavedPlotsModalOpen, setIsSavedPlotsModalOpen] = useState<boolean>(false);
  const [isTechDataExpanded, setIsTechDataExpanded] = useState<boolean>(false);
  const [isSaturationTableOpen, setIsSaturationTableOpen] = useState<boolean>(false);

  // 2. REFRIGERANT SELECTION: Default to R407C as in user reference photo!
  const [selectedRef, setSelectedRef] = useState<ExtendedRefrigerantId>('R407C');
  const isRestoringPlotRef = useRef(false);

  useEffect(() => {
    if (isRestoringPlotRef.current) return;
    setReportMeta((prev) => {
      const isDefault = !prev.productName || prev.productName.startsWith('Trainer Refrigerasi');
      if (isDefault) {
        const updated = {
          ...prev,
          productName: `Trainer Refrigerasi Kompresi Uap ${selectedRef}`,
          trainerName: `Trainer Refrigerasi Kompresi Uap ${selectedRef}`,
          modelUnit: !prev.modelUnit || prev.modelUnit.startsWith('RTU-REF-') ? `RTU-REF-${selectedRef}` : prev.modelUnit,
        };
        try {
          localStorage.setItem('rtu_report_meta_v1', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });
  }, [selectedRef]);

  // 3. UNITS & BASIS:
  const [unitSystem, setUnitSystem] = useState<'SI' | 'Imperial'>(() => {
    if (propUnitSystem === 'imperial') return 'Imperial';
    return 'SI';
  });
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>(() => (propUnitSystem === 'imperial' ? 'psi' : 'bar'));
  const [pressureBasis, setPressureBasis] = useState<'abs' | 'gauge'>('gauge');
  const [tempUnit, setTempUnit] = useState<'°C' | '°F' | 'K'>(() => (propUnitSystem === 'imperial' ? '°F' : '°C'));
  const [enthalpyUnit, setEnthalpyUnit] = useState<'kJ/kg' | 'Btu/lb'>(() => (propUnitSystem === 'imperial' ? 'Btu/lb' : 'kJ/kg'));

  // Sync unitSystem if propUnitSystem changes from parent
  useEffect(() => {
    if (propUnitSystem) {
      const isImp = propUnitSystem === 'imperial';
      const targetUnit: 'SI' | 'Imperial' = isImp ? 'Imperial' : 'SI';
      if (targetUnit !== unitSystem) {
        setUnitSystem(targetUnit);
        setPressureUnit(isImp ? 'psi' : 'bar');
        setTempUnit(isImp ? '°F' : '°C');
        setEnthalpyUnit(isImp ? 'Btu/lb' : 'kJ/kg');
        setCompressorPowerUnit(isImp ? 'HP' : 'kW');
      }
    }
  }, [propUnitSystem, unitSystem]);

  // Collapsible Side Panels State
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);

  // 4. REFRIGERATION CYCLE MODE: Measured Only (Field Measurement Data)
  // Started empty so user can fill their own numbers as requested
  const [suctionPressureInput, setSuctionPressureInput] = useState<string>('');
  const [dischargePressureInput, setDischargePressureInput] = useState<string>('');
  const [suctionTempInput, setSuctionTempInput] = useState<string>('');
  const [dischargeTempInput, setDischargeTempInput] = useState<string>('');
  const [liquidTempInput, setLiquidTempInput] = useState<string>('');
  const [compressorPowerInput, setCompressorPowerInput] = useState<string>('');
  const [compressorPowerUnit, setCompressorPowerUnit] = useState<PowerUnit>(() => (propUnitSystem === 'imperial' ? 'HP' : 'kW'));

  // Curve Visibility Toggles (Top bar pills matching user reference photo)
  const [showCycle, setShowCycle] = useState<boolean>(true);
  const [showDome, setShowDome] = useState<boolean>(true);
  const [showQuality, setShowQuality] = useState<boolean>(true);
  const [showIsotherms, setShowIsotherms] = useState<boolean>(true);
  const [showEntropy, setShowEntropy] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Chart Interactive Tool Controls
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Point Inspection State
  const [selectedPointKey, setSelectedPointKey] = useState<string | null>(null);
  const [hoveredStatePoint, setHoveredStatePoint] = useState<CycleStatePoint | null>(null);

  // Refrigerant Blend Information Lookup
  const blendInfo = useMemo(() => {
    return REFRIGERANT_BLEND_DATA[selectedRef] ?? {
      type: 'Pure fluid',
      components: [{ name: selectedRef, percent: 100 }],
      bubbleTempC: EXTENDED_REFRIGERANTS[selectedRef]?.nbpC ?? -30,
      glideK: 0.0,
      safetyClass: EXTENDED_REFRIGERANTS[selectedRef]?.safetyClass ?? 'A1',
      chemicalType: EXTENDED_REFRIGERANTS[selectedRef]?.category ?? 'HFC',
    };
  }, [selectedRef]);

  // Handle Unit System Single Button Toggle (SI vs Imperial)
  const handleToggleUnitSystem = () => {
    if (unitSystem === 'SI') {
      setUnitSystem('Imperial');
      setPressureUnit('psi');
      setTempUnit('°F');
      setEnthalpyUnit('Btu/lb');
      setCompressorPowerUnit('HP');
      if (propOnToggleUnit) propOnToggleUnit('imperial');

      // Convert current inputs to Imperial if present
      if (suctionPressureInput) {
        const val = parseFloat(suctionPressureInput);
        if (!isNaN(val)) setSuctionPressureInput((val * 14.5038).toFixed(1));
      }
      if (dischargePressureInput) {
        const val = parseFloat(dischargePressureInput);
        if (!isNaN(val)) setDischargePressureInput((val * 14.5038).toFixed(1));
      }
      if (suctionTempInput) {
        const val = parseFloat(suctionTempInput);
        if (!isNaN(val)) setSuctionTempInput(((val * 9) / 5 + 32).toFixed(1));
      }
      if (dischargeTempInput) {
        const val = parseFloat(dischargeTempInput);
        if (!isNaN(val)) setDischargeTempInput(((val * 9) / 5 + 32).toFixed(1));
      }
      if (liquidTempInput) {
        const val = parseFloat(liquidTempInput);
        if (!isNaN(val)) setLiquidTempInput(((val * 9) / 5 + 32).toFixed(1));
      }
      if (compressorPowerInput) {
        const val = parseFloat(compressorPowerInput);
        if (!isNaN(val)) setCompressorPowerInput((val * 1.34102).toFixed(2));
      }
    } else {
      setUnitSystem('SI');
      setPressureUnit('bar');
      setTempUnit('°C');
      setEnthalpyUnit('kJ/kg');
      setCompressorPowerUnit('kW');
      if (propOnToggleUnit) propOnToggleUnit('metric');

      // Convert current inputs to SI if present
      if (suctionPressureInput) {
        const val = parseFloat(suctionPressureInput);
        if (!isNaN(val)) setSuctionPressureInput((val / 14.5038).toFixed(2));
      }
      if (dischargePressureInput) {
        const val = parseFloat(dischargePressureInput);
        if (!isNaN(val)) setDischargePressureInput((val / 14.5038).toFixed(2));
      }
      if (suctionTempInput) {
        const val = parseFloat(suctionTempInput);
        if (!isNaN(val)) setSuctionTempInput((((val - 32) * 5) / 9).toFixed(1));
      }
      if (dischargeTempInput) {
        const val = parseFloat(dischargeTempInput);
        if (!isNaN(val)) setDischargeTempInput((((val - 32) * 5) / 9).toFixed(1));
      }
      if (liquidTempInput) {
        const val = parseFloat(liquidTempInput);
        if (!isNaN(val)) setLiquidTempInput((((val - 32) * 5) / 9).toFixed(1));
      }
      if (compressorPowerInput) {
        const val = parseFloat(compressorPowerInput);
        if (!isNaN(val)) setCompressorPowerInput((val * 0.7457).toFixed(2));
      }
    }
  };

  // Check if user has entered valid field measurements
  const hasValidInputs = Boolean(
    suctionPressureInput.trim() !== '' &&
    dischargePressureInput.trim() !== '' &&
    suctionTempInput.trim() !== '' &&
    dischargeTempInput.trim() !== '' &&
    liquidTempInput.trim() !== ''
  );

  // Handle Preset Examples for the active refrigerant
  const handleApplyExample = () => {
    if (unitSystem === 'Imperial') {
      if (selectedRef === 'R407C') {
        setSuctionPressureInput('50.1');
        setDischargePressureInput('256.9');
        setSuctionTempInput('50.0');
        setDischargeTempInput('173.1');
        setLiquidTempInput('107.6');
        setCompressorPowerInput('2.96');
      } else if (selectedRef === 'R32') {
        setSuctionPressureInput('127.6');
        setDischargePressureInput('413.4');
        setSuctionTempInput('53.6');
        setDischargeTempInput('179.6');
        setLiquidTempInput('109.4');
        setCompressorPowerInput('2.95');
      } else if (selectedRef === 'R410A') {
        setSuctionPressureInput('120.4');
        setDischargePressureInput('384.4');
        setSuctionTempInput('50.0');
        setDischargeTempInput('167.0');
        setLiquidTempInput('104.0');
        setCompressorPowerInput('2.95');
      } else if (selectedRef === 'R134a') {
        setSuctionPressureInput('27.6');
        setDischargePressureInput('133.4');
        setSuctionTempInput('41.0');
        setDischargeTempInput('154.4');
        setLiquidTempInput('96.8');
        setCompressorPowerInput('2.01');
      } else if (selectedRef === 'R290') {
        setSuctionPressureInput('65.6');
        setDischargePressureInput('209.8');
        setSuctionTempInput('50.0');
        setDischargeTempInput('161.2');
        setLiquidTempInput('107.6');
        setCompressorPowerInput('2.96');
      } else {
        setSuctionPressureInput('50.0');
        setDischargePressureInput('210.0');
        setSuctionTempInput('50.0');
        setDischargeTempInput('162.0');
        setLiquidTempInput('107.6');
        setCompressorPowerInput('2.96');
      }
    } else {
      // SI Units
      if (selectedRef === 'R407C') {
        setSuctionPressureInput('4.46');
        setDischargePressureInput('18.71');
        setSuctionTempInput('10.0');
        setDischargeTempInput('78.4');
        setLiquidTempInput('42.0');
        setCompressorPowerInput('2.21');
      } else if (selectedRef === 'R32') {
        setSuctionPressureInput('9.80');
        setDischargePressureInput('29.50');
        setSuctionTempInput('12.0');
        setDischargeTempInput('82.0');
        setLiquidTempInput('43.0');
        setCompressorPowerInput('2.20');
      } else if (selectedRef === 'R410A') {
        setSuctionPressureInput('9.30');
        setDischargePressureInput('27.50');
        setSuctionTempInput('10.0');
        setDischargeTempInput('75.0');
        setLiquidTempInput('40.0');
        setCompressorPowerInput('2.20');
      } else if (selectedRef === 'R134a') {
        setSuctionPressureInput('2.90');
        setDischargePressureInput('10.20');
        setSuctionTempInput('5.0');
        setDischargeTempInput('68.0');
        setLiquidTempInput('36.0');
        setCompressorPowerInput('1.50');
      } else if (selectedRef === 'R290') {
        setSuctionPressureInput('5.52');
        setDischargePressureInput('15.46');
        setSuctionTempInput('10.0');
        setDischargeTempInput('71.8');
        setLiquidTempInput('42.0');
        setCompressorPowerInput('2.21');
      } else {
        setSuctionPressureInput('4.50');
        setDischargePressureInput('15.50');
        setSuctionTempInput('10.0');
        setDischargeTempInput('72.0');
        setLiquidTempInput('42.0');
        setCompressorPowerInput('2.21');
      }
    }
  };

  const handleClearInputs = () => {
    setSuctionPressureInput('');
    setDischargePressureInput('');
    setSuctionTempInput('');
    setDischargeTempInput('');
    setLiquidTempInput('');
    setCompressorPowerInput('');
  };

  // Convert inputs to bar absolute for thermodynamic calculations
  const { suctionPressureBar, dischargePressureBar, suctionTempC, dischargeTempC, liquidTempC, activeCompressorKw } = useMemo(() => {
    if (hasValidInputs) {
      let p1Bar = parseFloat(suctionPressureInput) || 0;
      let p2Bar = parseFloat(dischargePressureInput) || 0;
      let t1C = parseFloat(suctionTempInput) || 0;
      let t2C = parseFloat(dischargeTempInput) || 0;
      let t3C = parseFloat(liquidTempInput) || 0;
      let pKw = parseFloat(compressorPowerInput) || 2.21;

      if (unitSystem === 'Imperial') {
        p1Bar = psiToBar(p1Bar);
        p2Bar = psiToBar(p2Bar);
        t1C = ((t1C - 32) * 5) / 9;
        t2C = ((t2C - 32) * 5) / 9;
        t3C = ((t3C - 32) * 5) / 9;
        pKw = pKw * 0.7457;
      }

      if (pressureBasis === 'gauge') {
        p1Bar += 1.013;
        p2Bar += 1.013;
      }

      return {
        suctionPressureBar: Math.max(0.1, p1Bar),
        dischargePressureBar: Math.max(p1Bar * 1.05, p2Bar),
        suctionTempC: t1C,
        dischargeTempC: t2C,
        liquidTempC: t3C,
        activeCompressorKw: Math.max(0.05, pKw),
      };
    } else {
      // Default safe nominal baseline for chart bounds and pure skeleton rendering
      const p1 = getRefSaturationPressure(selectedRef, 5.0);
      const p2 = getRefSaturationPressure(selectedRef, 45.0);
      return {
        suctionPressureBar: p1,
        dischargePressureBar: p2,
        suctionTempC: 10.0,
        dischargeTempC: 75.0,
        liquidTempC: 42.0,
        activeCompressorKw: 2.21,
      };
    }
  }, [
    hasValidInputs,
    selectedRef,
    unitSystem,
    pressureBasis,
    suctionPressureInput,
    dischargePressureInput,
    suctionTempInput,
    dischargeTempInput,
    liquidTempInput,
    compressorPowerInput,
  ]);

  // Live diagnostic thermodynamic values derived from field measurements
  const liveMetrics = useMemo(() => {
    const p1 = suctionPressureBar;
    const p2 = dischargePressureBar;
    const tEvapSat = getRefSaturationTemp(selectedRef, p1);
    const tCondSat = getRefSaturationTemp(selectedRef, p2);
    const sh = suctionTempC - tEvapSat;
    const sc = tCondSat - liquidTempC;
    const pr = p2 / Math.max(0.01, p1);

    let displayTEvap = tEvapSat;
    let displayTCond = tCondSat;
    let displaySH = sh;
    let displaySC = sc;

    if (unitSystem === 'Imperial') {
      displayTEvap = (tEvapSat * 9) / 5 + 32;
      displayTCond = (tCondSat * 9) / 5 + 32;
      displaySH = sh * 1.8;
      displaySC = sc * 1.8;
    }

    return {
      tEvapSat,
      tCondSat,
      sh,
      sc,
      pr,
      displayTEvap,
      displayTCond,
      displaySH,
      displaySC,
    };
  }, [selectedRef, suctionPressureBar, dischargePressureBar, suctionTempC, liquidTempC, unitSystem]);

  // Calculate thermodynamic cycle
  const result: PhCycleResult = useMemo(() => {
    return calculatePhRefrigerationCycle({
      refrigerantId: selectedRef,
      inputMode: 'direct_measurements',
      suctionPressureBar,
      dischargePressureBar,
      suctionTempC,
      dischargeTempC,
      liquidTempC,
      compressorPowerKw: activeCompressorKw,
    });
  }, [
    selectedRef,
    suctionPressureBar,
    dischargePressureBar,
    suctionTempC,
    dischargeTempC,
    liquidTempC,
    activeCompressorKw,
  ]);

  // Generate 8 full industrial cycle state points (1, 2s, 2, 2', 3', 3, 4, 1')
  const extendedStatePoints: ExtendedStatePointRow[] = useMemo(() => {
    return calculateExtendedStatePoints(result, 0.70);
  }, [result]);

  // Format pressure values for UI display based on basis and unit
  const formatPressureValue = (pBarAbs: number) => {
    let pVal = pBarAbs;
    if (pressureBasis === 'gauge') {
      pVal = Math.max(-1, pBarAbs - 1.013);
    }
    if (pressureUnit === 'psi') {
      pVal = barToPsi(pVal);
      return pVal.toFixed(1);
    } else if (pressureUnit === 'kPa') {
      pVal = barToKpa(pVal);
      return pVal.toFixed(0);
    }
    return pVal.toFixed(3);
  };

  // Helper pressure string for inputs
  const peDisplayStr = useMemo(() => {
    const pAbs = suctionPressureBar;
    return `Pe = ${formatPressureValue(pAbs)} ${pressureUnit} ${pressureBasis === 'gauge' ? 'g' : 'a'}`;
  }, [suctionPressureBar, pressureBasis, pressureUnit]);

  const pcDisplayStr = useMemo(() => {
    const pAbs = dischargePressureBar;
    return `Pc = ${formatPressureValue(pAbs)} ${pressureUnit} ${pressureBasis === 'gauge' ? 'g' : 'a'}`;
  }, [dischargePressureBar, pressureBasis, pressureUnit]);

  // Key KPI values
  const copCooling = result.copActual;
  const eerBtuWh = copCooling * 3.412142;
  const eerWw = copCooling;
  const copHeating = result.copActual + 1.0;
  const carnotCoolingPercent = result.secondLawEfficiencyPercent;
  const carnotHeating = (liveMetrics.tCondSat + 273.15) / Math.max(1, liveMetrics.tCondSat - liveMetrics.tEvapSat);
  const carnotHeatingPercent = Math.min(99.9, Math.round((copHeating / Math.max(0.1, carnotHeating)) * 1000) / 10);
  const coolingCapacityKw = result.coolingCapacityKw;
  const heatingCapacityKw = result.coolingCapacityKw + result.compressorPowerKw;
  const pressureRatio = result.pressureRatio;
  const dischargeTemp = result.dischargeTempC;
  const valveOutletQuality = result.vaporQualityInletEvap;
  const massFlowKgH = result.massFlowKgH;
  const massFlowKgS = result.massFlowKgS;
  const refrigerationEffect = result.refrigeratingEffectKjKg;
  const compressorWork = result.workCompressionKjKg;
  const heatRejection = result.heatRejectionKjKg;

  // Selected State Point for the Point Inspector card
  const inspectedPoint = useMemo(() => {
    if (hoveredStatePoint) {
      return {
        point: String(hoveredStatePoint.index),
        label: hoveredStatePoint.label,
        pBar: hoveredStatePoint.pressureBar,
        tC: hoveredStatePoint.tempC,
        hKjKg: hoveredStatePoint.enthalpyKjKg,
        sKjKgK: hoveredStatePoint.entropyKjKgK,
        vM3Kg: hoveredStatePoint.specificVolumeM3Kg,
        phase: hoveredStatePoint.phase,
        isMainPoint: true,
      };
    }
    if (selectedPointKey) {
      const match = extendedStatePoints.find((p) => p.point === selectedPointKey);
      if (match) return match;
    }
    return null;
  }, [hoveredStatePoint, selectedPointKey, extendedStatePoints]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      workstationRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(3.5, prev + 0.25));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.6, prev - 0.25));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setIsPanMode(false);
  };

  // Saved Plots Handling
  const [savedPlots, setSavedPlots] = useState<SavedPhCyclePlot[]>(() => getSavedPhPlots());
  const handleSaveCurrentPlot = (customName: string, customMeta?: PhReportMeta) => {
    const metaToSave = customMeta || reportMeta;
    savePhPlot({
      name: customName,
      refrigerantId: selectedRef,
      suctionPressure: suctionPressureBar,
      suctionPressureUnit: 'bar',
      dischargePressure: dischargePressureBar,
      dischargePressureUnit: 'bar',
      suctionTempC: suctionTempC,
      dischargeTempC: dischargeTempC,
      liquidTempC: liquidTempC,
      compressorPower: result.compressorPowerKw,
      compressorPowerUnit: 'kW',
      cop: copCooling,
      coolingCapacityKw,
      superheatK: liveMetrics.sh,
      subcoolingK: liveMetrics.sc,
      eerBtuWh: result.eerBtuWh,
      reportMeta: metaToSave,
    });
    setSavedPlots(getSavedPhPlots());
  };

  const handleRestorePlot = (saved: SavedPhCyclePlot) => {
    isRestoringPlotRef.current = true;
    setSelectedRef(saved.refrigerantId);
    setSuctionPressureInput(String(saved.suctionPressure));
    setDischargePressureInput(String(saved.dischargePressure));
    setSuctionTempInput(String(saved.suctionTempC));
    setDischargeTempInput(String(saved.dischargeTempC));
    setLiquidTempInput(String(saved.liquidTempC));
    setCompressorPowerInput(String(saved.compressorPower));
    if (saved.reportMeta) setReportMeta(saved.reportMeta);
    setIsSavedPlotsModalOpen(false);
    setTimeout(() => {
      isRestoringPlotRef.current = false;
    }, 100);
  };

  return (
    <div
      ref={workstationRef}
      className="w-full min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans select-none"
    >
      {/* ================= 1. MASTER TOP WORKSTATION HEADER ================= */}
      <header className="w-full bg-[#0b101d] border-b border-slate-800/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Branding & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-600 via-rose-600 to-red-500 flex items-center justify-center shadow-md shadow-red-950/40 border border-white/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2 font-mono">
                {isEn ? 'Refrigerant Pressure-Enthalpy Chart' : 'Diagram Tekanan-Entalpi Refrigeran'}
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                v1.7.0 Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              {isEn ? 'Interactive P-h Diagram & Refrigeration Cycle Analysis' : 'Diagram P-h Interaktif & Analisis Siklus Refrigerasi'}
            </p>
          </div>
        </div>

        {/* Center: Curve Visibility Pills (Matching reference photo!) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#080d1a] border border-slate-800 p-1 rounded-lg">
          {/* Cycle Pill */}
          <button
            type="button"
            onClick={() => setShowCycle(!showCycle)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
              showCycle ? 'bg-[#1e293b] text-amber-300 border border-amber-500/50 shadow-xs' : 'text-slate-500 hover:text-slate-300 opacity-60'
            }`}
            title={isEn ? 'Toggle Refrigeration Cycle (1-2-3-4)' : 'Tampilkan/Sembunyikan Siklus Refrigerasi (1-2-3-4)'}
          >
            <span className="w-2.5 h-0.5 rounded-full bg-amber-400" />
            <span>{isEn ? 'Cycle' : 'Siklus'}</span>
          </button>

          {/* Dome Pill */}
          <button
            type="button"
            onClick={() => setShowDome(!showDome)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
              showDome ? 'bg-[#1e293b] text-slate-100 border border-slate-400/50 shadow-xs' : 'text-slate-500 hover:text-slate-300 opacity-60'
            }`}
            title={isEn ? 'Toggle Saturation Dome (x=0, x=1)' : 'Tampilkan/Sembunyikan Kubah Kejenuhan (x=0, x=1)'}
          >
            <span className="w-2.5 h-0.5 rounded-full bg-white" />
            <span>{isEn ? 'Dome' : 'Kubah'}</span>
          </button>

          {/* Quality Pill */}
          <button
            type="button"
            onClick={() => setShowQuality(!showQuality)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
              showQuality ? 'bg-[#1e293b] text-cyan-300 border border-cyan-500/50 shadow-xs' : 'text-slate-500 hover:text-slate-300 opacity-60'
            }`}
            title={isEn ? 'Toggle Vapor Quality Lines (x=0.1...0.9)' : 'Tampilkan/Sembunyikan Garis Kualitas Uap (x=0.1...0.9)'}
          >
            <span className="w-2.5 h-0.5 rounded-full bg-cyan-400" />
            <span>{isEn ? 'Quality' : 'Kualitas'}</span>
          </button>

          {/* Isotherm Pill */}
          <button
            type="button"
            onClick={() => setShowIsotherms(!showIsotherms)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
              showIsotherms ? 'bg-[#1e293b] text-rose-300 border border-rose-500/50 shadow-xs' : 'text-slate-500 hover:text-slate-300 opacity-60'
            }`}
            title={isEn ? 'Toggle Constant Temperature Isotherms (T, Red)' : 'Tampilkan/Sembunyikan Garis Suhu Konstan T (Isoterm, Merah)'}
          >
            <span className="w-2.5 h-0.5 rounded-full bg-rose-500" />
            <span>{isEn ? 'Isotherm' : 'Isoterm'}</span>
          </button>

          {/* Isentrope Pill */}
          <button
            type="button"
            onClick={() => setShowEntropy(!showEntropy)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
              showEntropy ? 'bg-[#1e293b] text-blue-300 border border-blue-500/50 shadow-xs' : 'text-slate-500 hover:text-slate-300 opacity-60'
            }`}
            title={isEn ? 'Toggle Constant Entropy Isentropes (s, Blue)' : 'Tampilkan/Sembunyikan Garis Entropi Konstan s (Isentrop, Biru)'}
          >
            <span className="w-2.5 h-0.5 rounded-full bg-blue-500" />
            <span>{isEn ? 'Isentrope' : 'Isentrop'}</span>
          </button>

          {/* Volume Pill */}
          <button
            type="button"
            onClick={() => setShowVolume(!showVolume)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
              showVolume ? 'bg-[#1e293b] text-emerald-300 border border-emerald-500/50 shadow-xs' : 'text-slate-500 hover:text-slate-300 opacity-60'
            }`}
            title={isEn ? 'Toggle Constant Specific Volume Lines (v, Green)' : 'Tampilkan/Sembunyikan Garis Volume Spesifik (v, Hijau)'}
          >
            <span className="w-2.5 h-0.5 rounded-full bg-emerald-500" />
            <span>Volume</span>
          </button>

          {/* Grid Pill */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
              showGrid ? 'bg-[#1e293b] text-slate-300 border border-slate-600/60 shadow-xs' : 'text-slate-500 hover:text-slate-300 opacity-60'
            }`}
            title={isEn ? 'Toggle Coordinate Grid (Isobar & Isenthalp Grid Lines)' : 'Tampilkan/Sembunyikan Garis Kisi Koordinat (Isobar & Isentalpi)'}
          >
            <span className="w-2.5 h-0.5 rounded-full bg-slate-400" />
            <span>Grid</span>
          </button>
        </div>

        {/* Right: Actions Toolbar & Panel Visibility Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Toggle Left Input Panel */}
          <button
            type="button"
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              !isLeftCollapsed
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/70 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isLeftCollapsed ? (isEn ? 'Show Input Panel' : 'Buka Panel Input') : (isEn ? 'Hide Input Panel' : 'Sembunyikan Panel Input')}
          >
            <span>{isLeftCollapsed ? '▶' : '◀'}</span>
            <span className="hidden sm:inline">{isEn ? 'Inputs' : 'Panel Input'}</span>
          </button>

          {/* Single Button Toggle for Unit System (SI vs Imperial) */}
          <button
            type="button"
            onClick={handleToggleUnitSystem}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#0e172a] hover:bg-[#162544] text-cyan-300 border border-cyan-500/60 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title={isEn ? 'Switch between SI (Metric: bar, °C, kW) and Imperial (psi, °F, HP)' : 'Klik untuk beralih antara SI (Metrik: bar, °C, kW) dan Imperial (psi, °F, HP)'}
          >
            <span>{unitSystem === 'SI' ? '🌐' : '🇺🇸'}</span>
            <span>{unitSystem === 'SI' ? 'SI' : 'Imperial'}</span>
          </button>

          {/* Language Switcher Button (ID / EN) */}
          <div className="flex items-center bg-[#070b15] border border-slate-700/80 rounded p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => handleLanguageChange('id')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                language === 'id'
                  ? 'bg-red-950 text-red-200 border border-red-500/70 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Bahasa Indonesia"
            >
              <span>🇮🇩</span>
              <span>ID</span>
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                language === 'en'
                  ? 'bg-blue-950 text-blue-200 border border-blue-500/70 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
            >
              <span>🇬🇧</span>
              <span>EN</span>
            </button>
          </div>

          {/* Tabel Saturasi Refrigeran Button (CoolPack Reference) */}
          <button
            type="button"
            onClick={() => setIsSaturationTableOpen(true)}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#0c1f2e] hover:bg-[#133047] text-cyan-300 border border-cyan-500/70 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title={isEn ? 'Open Saturation Table & Fine Temp Control' : 'Buka Tabel Saturasi Refrigeran Lengkap dengan Kontrol Pencarian Suhu'}
          >
            <span>📋</span>
            <span>{isEn ? 'Saturation Table' : 'Tabel Saturasi'}</span>
          </button>

          {/* Toggle Right Results Panel */}
          <button
            type="button"
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              !isRightCollapsed
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/70 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isRightCollapsed ? (isEn ? 'Open Cycle Info (Right)' : 'Buka Info Siklus (Kanan)') : (isEn ? 'Hide Cycle Info (Right)' : 'Sembunyikan Info Siklus (Kanan)')}
          >
            <span className="hidden sm:inline">{isEn ? 'Cycle Info' : 'Info Siklus'}</span>
            <span>{isRightCollapsed ? '◀' : '▶'}</span>
          </button>

          {/* Pan Toggle */}
          <button
            type="button"
            onClick={() => setIsPanMode(!isPanMode)}
            className={`px-2 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
              isPanMode
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isEn ? 'Pan Diagram Canvas' : 'Geser Tampilan Diagram (Pan Canvas)'}
          >
            <span>{isEn ? '✋ Pan' : '✋ Geser'}</span>
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center text-xs font-bold font-mono cursor-pointer"
            title={isEn ? 'Zoom In' : 'Perbesar (Zoom In)'}
          >
            +
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center text-xs font-bold font-mono cursor-pointer"
            title={isEn ? 'Zoom Out' : 'Perkecil (Zoom Out)'}
          >
            -
          </button>

          {/* Fit / Home */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono cursor-pointer"
            title={isEn ? 'Reset Zoom & Pan (Fit)' : 'Reset Zoom & Pan (Fit)'}
          >
            Fit
          </button>

          {/* Animate Cycle Stream */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all border ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
            title={isEn ? 'Animate Refrigerant Flow' : 'Animasi Aliran Refrigeran pada Siklus'}
          >
            <span>{isPlaying ? (isEn ? '⏸ Pause' : '⏸ Jeda') : (isEn ? '▶ Animate' : '▶ Animasi')}</span>
          </button>

          {/* Full Screen */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="hidden md:flex px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono cursor-pointer"
            title={isEn ? 'Toggle Fullscreen' : 'Mode Layar Penuh (Fullscreen)'}
          >
            🗖 {isFullscreen ? (isEn ? 'Exit Full' : 'Keluar Penuh') : (isEn ? 'Full Screen' : 'Layar Penuh')}
          </button>

          {/* Print Report */}
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer"
            title={isEn ? 'Print Official Test Report' : 'Cetak Laporan Pengujian Resmi RTU'}
          >
            <span>🖨 {isEn ? 'Print' : 'Cetak'}</span>
          </button>

          {/* WhatsApp Share */}
          <button
            type="button"
            onClick={() => setIsWaModalOpen(true)}
            className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer"
            title={isEn ? 'Share Summary to WhatsApp' : 'Bagikan Ringkasan ke WhatsApp'}
          >
            <span>💬 {isEn ? 'Share' : 'Bagi WA'}</span>
          </button>

          {/* 3D Piping Link */}
          {onOpen3dPiping && (
            <button
              type="button"
              onClick={onOpen3dPiping}
              className="hidden lg:flex px-2.5 py-1 rounded bg-indigo-700 hover:bg-indigo-600 text-white border border-indigo-600 text-xs font-mono font-semibold items-center gap-1 cursor-pointer"
              title={isEn ? 'Open 3D Piping View' : 'Buka Skema Perpipaan 3D'}
            >
              <span>🎮 {isEn ? '3D View' : 'Tampilan 3D'}</span>
            </button>
          )}
        </div>
      </header>

      {/* ================= 2. LIVE STATUS STRIP RIBBON ================= */}
      <div className="w-full bg-[#0a0f1d] border-b border-slate-800/90 px-4 py-1.5 text-xs font-mono flex flex-wrap items-center justify-between text-slate-300 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <strong className="text-white text-[13px]">{selectedRef}</strong>
          <span className="text-slate-600">·</span>
          {hasValidInputs ? (
            <>
              <span>Te <strong className="text-amber-300">{liveMetrics.displayTEvap.toFixed(1)} {tempUnit}</strong> / Tc <strong className="text-amber-300">{liveMetrics.displayTCond.toFixed(1)} {tempUnit}</strong></span>
              <span className="text-slate-600">·</span>
              <span>SH <strong className="text-cyan-300">{liveMetrics.displaySH.toFixed(1)} {unitSystem === 'SI' ? 'K' : '°F'}</strong></span>
              <span className="text-slate-600">·</span>
              <span>SC <strong className="text-emerald-300">{liveMetrics.displaySC.toFixed(1)} {unitSystem === 'SI' ? 'K' : '°F'}</strong></span>
              <span className="text-slate-600">·</span>
              <span>COPc <strong className="text-emerald-400 font-bold">{copCooling.toFixed(2)}</strong></span>
              <span className="text-slate-600">·</span>
              <span>EER <strong className="text-amber-300 font-bold">{eerBtuWh.toFixed(2)}</strong> <span className="text-[10px]">Btu/(W·h)</span></span>
              <span className="text-slate-600">·</span>
              <span>COPh <strong className="text-rose-400 font-bold">{copHeating.toFixed(2)}</strong></span>
              <span className="text-slate-600">·</span>
              <span>T2 <strong className="text-rose-300 font-bold">{dischargeTemp.toFixed(1)} {tempUnit}</strong></span>
            </>
          ) : (
            <span className="text-slate-400">
              {isEn
                ? 'P-h Diagram Ready · Enter field measurements in left panel or click [Load Example]'
                : 'Diagram P-h Siap · Masukkan nilai pengukuran lapangan di panel kiri atau klik [Isi Contoh]'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Qe: <strong className="text-cyan-300">{hasValidInputs ? `${coolingCapacityKw.toFixed(2)} kW` : '--'}</strong></span>
          <span>Wcomp: <strong className="text-amber-300">{hasValidInputs ? `${result.compressorPowerKw.toFixed(2)} kW` : '--'}</strong></span>
          <span>Basis: <strong className="text-indigo-300 uppercase">{pressureBasis}</strong></span>
          <span>Unit: <strong className="text-cyan-300 uppercase">{unitSystem}</strong></span>
        </div>
      </div>

      {/* ================= 3. MASTER 3-COLUMN WORKSTATION LAYOUT (FLEX RESPONSIVE) ================= */}
      <div className="flex-1 w-full flex flex-col lg:flex-row gap-2.5 p-2.5 overflow-hidden min-h-0 relative">
        {/* ----------------- COLUMN 1: LEFT INPUT PANEL (Collapsible) ----------------- */}
        {!isLeftCollapsed && (
          <aside className="w-full lg:w-[325px] 2xl:w-[360px] shrink-0 flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-105px)] pr-1 transition-all duration-300">
            {/* Header with Collapse Button */}
            <div className="flex items-center justify-between pb-0.5">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>📊</span> <span>{isEn ? 'INPUT PARAMETERS' : 'PARAMETER INPUT'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsLeftCollapsed(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
                title={isEn ? 'Hide Input Panel to the Left' : 'Sembunyikan Panel Input ke Kiri'}
              >
                <span>◀</span>
                <span>{isEn ? 'Hide' : 'Sembunyikan'}</span>
              </button>
            </div>

            {/* Section A: Refrigerant Card */}
            <div className="bg-[#0b101e] border border-slate-800 rounded-lg p-3 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  {isEn ? 'REFRIGERANT' : 'REFRIGERAN'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {blendInfo.safetyClass} - {blendInfo.chemicalType}
                </span>
              </div>

              {/* Danfoss-style big button selector */}
              <button
                type="button"
                onClick={() => setIsRefModalOpen(true)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#0e1628] hover:bg-[#121c33] border border-slate-700 text-left transition-all cursor-pointer group shadow-inner"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30 group-hover:scale-110 transition-transform" />
                  <span className="text-base font-extrabold text-white font-mono tracking-wide">
                    {selectedRef}
                  </span>
                  <span className="text-xs text-slate-400 truncate max-w-[130px]">
                    {EXTENDED_REFRIGERANTS[selectedRef]?.name.split('(')[0]}
                  </span>
                </div>
                <span className="text-slate-400 group-hover:text-cyan-400 transition-colors font-mono text-sm">
                  ▾
                </span>
              </button>

              {/* Blend Composition Header & Chips */}
              <div className="space-y-1.5 pt-0.5 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="font-bold text-slate-300 uppercase">{blendInfo.type.toUpperCase()} · MASS %</span>
                  <span>Bubble {blendInfo.bubbleTempC}°C · Glide {blendInfo.glideK} K</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {blendInfo.components.map((comp, idx) => (
                    <span
                      key={`${comp.name}-${idx}`}
                      className="px-2 py-1 rounded bg-[#0a0f1d] border border-slate-800 text-[11px] font-mono text-cyan-300 font-semibold"
                    >
                      {comp.name} <strong className="text-white">{comp.percent}%</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Expandable Technical Data Accordion */}
              <div className="border-t border-slate-800/80 pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsTechDataExpanded(!isTechDataExpanded)}
                  className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors py-1 cursor-pointer"
                >
                  <span>{isEn ? 'Technical Data & Properties' : 'Data Teknis & Properti'}</span>
                  <span>{isTechDataExpanded ? '▲' : '▼'}</span>
                </button>

                {isTechDataExpanded && (
                  <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10.5px] font-mono bg-[#070b15] p-2.5 rounded border border-slate-800/80">
                    <div>Formula: <strong className="text-white">{EXTENDED_REFRIGERANTS[selectedRef]?.formula}</strong></div>
                    <div>NBP: <strong className="text-amber-300">{EXTENDED_REFRIGERANTS[selectedRef]?.nbpC}°C</strong></div>
                    <div>Tcrit: <strong className="text-amber-300">{EXTENDED_REFRIGERANTS[selectedRef]?.tcritC}°C</strong></div>
                    <div>Pcrit: <strong className="text-cyan-300">{EXTENDED_REFRIGERANTS[selectedRef]?.pcritBar} bar</strong></div>
                    <div>GWP: <strong className="text-rose-400">{EXTENDED_REFRIGERANTS[selectedRef]?.gwp}</strong></div>
                    <div>ODP: <strong className="text-emerald-400">{EXTENDED_REFRIGERANTS[selectedRef]?.odp}</strong></div>
                    <div className="col-span-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800 mt-1">
                      {isEn ? 'Application: ' : 'Aplikasi: '}{EXTENDED_REFRIGERANTS[selectedRef]?.typicalUse}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section B: Single Button Unit System & Basis Card */}
            <div className="bg-[#0b101e] border border-slate-800 rounded-lg p-3 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  {isEn ? 'UNIT SYSTEM' : 'SISTEM SATUAN / UNIT'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleUnitSystem}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    unitSystem === 'SI'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 hover:bg-cyan-900/80 shadow-xs'
                      : 'bg-amber-950/80 border-amber-500 text-amber-300 hover:bg-amber-900/80 shadow-xs'
                  }`}
                  title={isEn ? 'Switch between SI (Metric: bar, °C, kW) and Imperial (psi, °F, HP)' : 'Klik untuk beralih antara SI (Metrik: bar, °C, kW) dan Imperial (psi, °F, HP)'}
                >
                  <span>{unitSystem === 'SI' ? '🌐' : '🇺🇸'}</span>
                  <span>{unitSystem === 'SI' ? 'SI (bar, °C, kW)' : 'Imperial (psi, °F, HP)'}</span>
                  <span className="text-[9px] px-1 py-0.2 bg-white/10 rounded font-normal">{isEn ? 'Switch' : 'Ganti'}</span>
                </button>
              </div>

              {/* Basis Abs / Gauge toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs font-mono">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{isEn ? 'PRESSURE BASIS' : 'BASIS TEKANAN'}</span>
                <div className="grid grid-cols-2 bg-[#080d1a] border border-slate-700/80 rounded p-0.5 w-36">
                  <button
                    type="button"
                    onClick={() => setPressureBasis('abs')}
                    className={`py-0.5 text-center text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
                      pressureBasis === 'abs' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    abs
                  </button>
                  <button
                    type="button"
                    onClick={() => setPressureBasis('gauge')}
                    className={`py-0.5 text-center text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
                      pressureBasis === 'gauge' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    gauge
                  </button>
                </div>
              </div>
            </div>

            {/* Section C: Measured Refrigeration Cycle Inputs Card (Measured Only!) */}
            <div className="bg-[#0b101e] border border-slate-800 rounded-lg p-3 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">
                    {isEn ? 'CYCLE MEASUREMENTS (MEASURED)' : 'PENGUKURAN SIKLUS (MEASURED)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleApplyExample}
                    className="px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/70 cursor-pointer shadow-xs transition-colors"
                    title={isEn ? 'Load typical standard measurement values' : 'Isi dengan contoh nilai pengukuran standar'}
                  >
                    {isEn ? 'Load Example' : 'Isi Contoh'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearInputs}
                    className="px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer transition-colors"
                    title={isEn ? 'Clear all input fields' : 'Kosongkan semua input'}
                  >
                    {isEn ? 'Clear' : 'Kosongkan'}
                  </button>
                </div>
              </div>

              {/* Form Fields: 2 Columns */}
              <div className="space-y-2.5 font-mono text-xs">
                {/* Row 1: Pressures */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      {isEn ? 'P SUCTION' : 'P SUCTION'} ({pressureUnit} {pressureBasis === 'gauge' ? 'g' : 'a'})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder={unitSystem === 'SI' ? (isEn ? 'e.g. 4.46' : 'cth: 4.46') : (isEn ? 'e.g. 50.1' : 'cth: 50.1')}
                        value={suctionPressureInput}
                        onChange={(e) => setSuctionPressureInput(e.target.value)}
                        className="w-full bg-[#080d1a] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono font-bold focus:border-cyan-500 outline-none text-right pr-12"
                      />
                      <span className="absolute right-2 top-1.5 text-slate-400 text-[11px]">{pressureUnit}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      {isEn ? 'P DISCHARGE' : 'P DISCHARGE'} ({pressureUnit} {pressureBasis === 'gauge' ? 'g' : 'a'})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder={unitSystem === 'SI' ? (isEn ? 'e.g. 18.71' : 'cth: 18.71') : (isEn ? 'e.g. 256.9' : 'cth: 256.9')}
                        value={dischargePressureInput}
                        onChange={(e) => setDischargePressureInput(e.target.value)}
                        className="w-full bg-[#080d1a] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono font-bold focus:border-cyan-500 outline-none text-right pr-12"
                      />
                      <span className="absolute right-2 top-1.5 text-slate-400 text-[11px]">{pressureUnit}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Suction & Discharge Temps */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      {isEn ? 'T1 SUCTION TEMP' : 'SUHU SUCTION (T1)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder={unitSystem === 'SI' ? (isEn ? 'e.g. 10.0' : 'cth: 10.0') : (isEn ? 'e.g. 50.0' : 'cth: 50.0')}
                        value={suctionTempInput}
                        onChange={(e) => setSuctionTempInput(e.target.value)}
                        className="w-full bg-[#080d1a] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono font-bold focus:border-cyan-500 outline-none text-right pr-8"
                      />
                      <span className="absolute right-2 top-1.5 text-slate-400 text-[11px]">{tempUnit}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      {isEn ? 'T2 DISCHARGE TEMP' : 'SUHU DISCHARGE (T2)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder={unitSystem === 'SI' ? (isEn ? 'e.g. 78.4' : 'cth: 78.4') : (isEn ? 'e.g. 173.1' : 'cth: 173.1')}
                        value={dischargeTempInput}
                        onChange={(e) => setDischargeTempInput(e.target.value)}
                        className="w-full bg-[#080d1a] border border-slate-700 rounded px-2.5 py-1.5 text-rose-300 font-mono font-bold focus:border-cyan-500 outline-none text-right pr-8"
                      />
                      <span className="absolute right-2 top-1.5 text-slate-400 text-[11px]">{tempUnit}</span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Liquid Temp & Compressor Power */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      {isEn ? 'T3 LIQUID LINE (TXV)' : 'SUHU CAIRAN TXV (T3)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder={unitSystem === 'SI' ? (isEn ? 'e.g. 42.0' : 'cth: 42.0') : (isEn ? 'e.g. 107.6' : 'cth: 107.6')}
                        value={liquidTempInput}
                        onChange={(e) => setLiquidTempInput(e.target.value)}
                        className="w-full bg-[#080d1a] border border-slate-700 rounded px-2.5 py-1.5 text-emerald-300 font-mono font-bold focus:border-cyan-500 outline-none text-right pr-8"
                      />
                      <span className="absolute right-2 top-1.5 text-slate-400 text-[11px]">{tempUnit}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      {isEn ? 'COMPRESSOR POWER' : 'DAYA KOMPRESOR'} ({unitSystem === 'SI' ? 'kW' : 'HP'})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        placeholder={unitSystem === 'SI' ? (isEn ? 'e.g. 2.21' : 'cth: 2.21') : (isEn ? 'e.g. 2.96' : 'cth: 2.96')}
                        value={compressorPowerInput}
                        onChange={(e) => setCompressorPowerInput(e.target.value)}
                        className="w-full bg-[#080d1a] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono font-bold focus:border-cyan-500 outline-none text-right pr-9"
                      />
                      <span className="absolute right-2 top-1.5 text-slate-400 text-[11px]">{unitSystem === 'SI' ? 'kW' : 'HP'}</span>
                    </div>
                  </div>
                </div>

                {/* Diagnostic live badges from measurements */}
                {hasValidInputs ? (
                  <div className="bg-[#070b15] border border-slate-800 rounded p-2 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Te (Sat Dew): <strong className="text-amber-300">{liveMetrics.displayTEvap.toFixed(1)} {tempUnit}</strong></span>
                      <span>Tc (Sat Bubble): <strong className="text-amber-300">{liveMetrics.displayTCond.toFixed(1)} {tempUnit}</strong></span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Superheat (SH): <strong className="text-cyan-300">{liveMetrics.displaySH.toFixed(1)} {unitSystem === 'SI' ? 'K' : '°F'}</strong></span>
                      <span>Subcooling (SC): <strong className="text-emerald-300">{liveMetrics.displaySC.toFixed(1)} {unitSystem === 'SI' ? 'K' : '°F'}</strong></span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 pt-0.5 border-t border-slate-800/80">
                      <span>{isEn ? 'Pressure Ratio (rp): ' : 'Rasio Tekanan (rp): '}<strong className="text-indigo-300">{liveMetrics.pr.toFixed(2)}</strong></span>
                      <span>{isEn ? 'Mass Flow (m): ' : 'Aliran Massa (m): '}<strong className="text-white">{unitSystem === 'Imperial' ? `${(massFlowKgH * 2.20462).toFixed(1)} lb/h` : `${massFlowKgH.toFixed(1)} kg/h`}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#070b15] border border-dashed border-slate-700/80 rounded p-2.5 text-center text-[11px] text-slate-400">
                    {isEn ? (
                      <span>Input fields are empty. Enter field measurements above or click <strong className="text-cyan-300 cursor-pointer underline" onClick={handleApplyExample}>[Load Example]</strong> to plot cycle.</span>
                    ) : (
                      <span>Kolom input kosong. Masukkan data pengukuran lapangan di atas atau klik <strong className="text-cyan-300 cursor-pointer underline" onClick={handleApplyExample}>[Isi Contoh]</strong> untuk memplot siklus.</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section D: Point Inspector Card */}
            <div className="bg-[#0b101e] border border-slate-800 rounded-lg p-3 space-y-2 shadow-sm flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  {isEn ? 'POINT INSPECTOR' : 'INSPEKTOR TITIK (POINT)'}
                </span>
                {inspectedPoint && (
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold text-[10px] font-mono">
                    {isEn ? 'Point ' : 'Titik '}{inspectedPoint.point}
                  </span>
                )}
              </div>

              {inspectedPoint ? (
                <div className="bg-[#070b15] border border-slate-800 p-2.5 rounded space-y-1.5 text-xs font-mono">
                  <div className="font-bold text-cyan-300 border-b border-slate-800 pb-1 text-[11px]">
                    {inspectedPoint.label}
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px]">
                    <div>{isEn ? 'Pressure: ' : 'Tekanan: '}<strong className="text-white">{formatPressureValue(inspectedPoint.pBar)} {pressureUnit}</strong></div>
                    <div>{isEn ? 'Temp: ' : 'Suhu: '}<strong className="text-amber-300">{unitSystem === 'Imperial' ? `${(inspectedPoint.tC * 1.8 + 32).toFixed(1)} °F` : `${inspectedPoint.tC.toFixed(1)} °C`}</strong></div>
                    <div>{isEn ? 'Enthalpy: ' : 'Entalpi: '}<strong className="text-emerald-400">{unitSystem === 'Imperial' ? `${(inspectedPoint.hKjKg * 0.429923).toFixed(1)} Btu/lb` : `${inspectedPoint.hKjKg.toFixed(1)} kJ/kg`}</strong></div>
                    <div>{isEn ? 'Entropy: ' : 'Entropi: '}<strong className="text-blue-400">{inspectedPoint.sKjKgK ? (unitSystem === 'Imperial' ? `${(inspectedPoint.sKjKgK * 0.238846).toFixed(3)} Btu/(lb·°F)` : `${inspectedPoint.sKjKgK.toFixed(3)} kJ/(kg·K)`) : '-'}</strong></div>
                    <div>{isEn ? 'Volume: ' : 'Volume: '}<strong className="text-purple-300">{inspectedPoint.vM3Kg ? (unitSystem === 'Imperial' ? `${(inspectedPoint.vM3Kg * 16.0185).toFixed(4)} ft³/lb` : `${inspectedPoint.vM3Kg.toFixed(4)} m³/kg`) : '-'}</strong></div>
                    <div>{isEn ? 'Phase: ' : 'Fase: '}<strong className="text-cyan-300 truncate block">{inspectedPoint.phase}</strong></div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {isEn
                    ? 'Hover cursor over chart to read properties, or click points 1-4 / State Points table rows for details.'
                    : 'Arahkan kursor ke chart untuk membaca property, klik titik 1-4 atau baris tabel State Points untuk penjelasan.'}
                </p>
              )}
            </div>
          </aside>
        )}

        {/* ----------------- COLUMN 2: CENTER P-H CHART PANEL (Expands to 100% when side panels are collapsed) ----------------- */}
        <main className="flex-1 min-w-0 flex flex-col h-full bg-[#090d16] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl relative transition-all duration-300">
          {/* Floating Button to Re-open Left Panel when Collapsed */}
          {isLeftCollapsed && (
            <button
              type="button"
              onClick={() => setIsLeftCollapsed(false)}
              className="absolute left-2.5 top-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b101e]/90 hover:bg-[#121a30] border border-cyan-500/70 text-cyan-300 font-mono text-xs font-bold shadow-xl shadow-black/60 backdrop-blur cursor-pointer hover:scale-105 transition-all"
              title={isEn ? "Open Input Panel" : "Tampilkan Kembali Panel Input"}
            >
              <span>▶</span>
              <span>{isEn ? 'Open Inputs' : 'Buka Input'}</span>
            </button>
          )}

          {/* Floating Button to Re-open Right Panel when Collapsed */}
          {isRightCollapsed && (
            <button
              type="button"
              onClick={() => setIsRightCollapsed(false)}
              className="absolute right-2.5 top-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b101e]/90 hover:bg-[#121a30] border border-indigo-500/70 text-indigo-300 font-mono text-xs font-bold shadow-xl shadow-black/60 backdrop-blur cursor-pointer hover:scale-105 transition-all"
              title={isEn ? "Open Cycle Info" : "Tampilkan Kembali Info Siklus"}
            >
              <span>{isEn ? 'Open Info' : 'Buka Info'}</span>
              <span>◀</span>
            </button>
          )}

          <div className="flex-1 w-full flex flex-col min-h-[520px]">
            <PhDiagramCanvas
              result={result}
              pressureBasis={pressureBasis}
              unitSystem={unitSystem}
              pressureUnit={pressureUnit}
              tempUnit={tempUnit}
              enthalpyUnit={enthalpyUnit}
              language={language}
              showCycle={showCycle && hasValidInputs}
              showDome={showDome}
              showQuality={showQuality}
              showIsotherms={showIsotherms}
              showEntropy={showEntropy}
              showVolume={showVolume}
              showGrid={showGrid}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              isPanMode={isPanMode}
              zoomLevel={zoomLevel}
              hideInternalToolbar={true}
              selectedPointKey={selectedPointKey}
              onSelectPoint={(key) => setSelectedPointKey(key)}
              onHoverPoint={(pt) => setHoveredStatePoint(pt)}
              autoPlay={false}
            />
          </div>
        </main>

        {/* ----------------- COLUMN 3: RIGHT INFORMATION / CALCULATED OUTPUTS (Collapsible) ----------------- */}
        {!isRightCollapsed && (
          <aside className="w-full lg:w-[340px] 2xl:w-[380px] shrink-0 flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-105px)] pl-1 transition-all duration-300">
            {/* Section A: Header with Collapse Button */}
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">
                  {isEn ? 'CYCLE PERFORMANCE' : 'KINERJA SIKLUS'}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                  Live
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRightCollapsed(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
                title={isEn ? 'Hide Cycle Info' : 'Sembunyikan Info Siklus ke Kanan'}
              >
                <span>{isEn ? 'Hide' : 'Sembunyikan'}</span>
                <span>▶</span>
              </button>
            </div>

          {/* Section B: Three Prominent Performance Cards (COP Cooling, EER, COP Heating) */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* COP COOLING */}
            <div className="bg-[#0e172a] border border-cyan-800/60 rounded-lg p-2 shadow-md shadow-cyan-950/20">
              <span className="text-[9px] font-mono font-bold tracking-wide text-cyan-300 uppercase block truncate">
                {isEn ? 'COP COOLING' : 'COP DINGIN'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono tracking-tight mt-0.5">
                {copCooling.toFixed(2)}
              </div>
              <span className="text-[8.5px] text-slate-400 font-mono block mt-0.5 truncate">
                {carnotCoolingPercent.toFixed(0)}% Carnot
              </span>
            </div>

            {/* EER (ENERGY EFFICIENCY RATIO) */}
            <div className="bg-[#0a1f18] border border-emerald-600/70 rounded-lg p-2 shadow-md shadow-emerald-950/20">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold tracking-wide text-emerald-300 uppercase">
                  EER
                </span>
                <span className="text-[7.5px] font-mono font-bold text-amber-300 bg-amber-950/70 border border-amber-600/50 px-0.5 rounded">
                  {eerBtuWh >= 11.5 ? '★★★★★' : eerBtuWh >= 10.0 ? '★★★★' : '★★★'}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
                {eerBtuWh.toFixed(2)}
              </div>
              <span className="text-[8.5px] text-slate-400 font-mono block mt-0.5 truncate">
                Btu/(W·h)
              </span>
            </div>

            {/* COP HEATING */}
            <div className="bg-[#1a0f1d] border border-rose-800/60 rounded-lg p-2 shadow-md shadow-rose-950/20">
              <span className="text-[9px] font-mono font-bold tracking-wide text-rose-300 uppercase block truncate">
                {isEn ? 'COP HEATING' : 'COP PANAS'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight mt-0.5">
                {copHeating.toFixed(2)}
              </div>
              <span className="text-[8.5px] text-slate-400 font-mono block mt-0.5 truncate">
                {carnotHeatingPercent.toFixed(0)}% Carnot
              </span>
            </div>
          </div>

          {/* Section C: 10 Calculated Metric Cards (Matching reference photo!) */}
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            {/* 1. REFRIGERATION EFFECT */}
            <div className="bg-[#0b101e] border border-slate-800 rounded p-2">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">{isEn ? 'REFRIGERATION EFFECT' : 'EFEK REFRIGERASI'}</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {unitSystem === 'Imperial'
                  ? `${(refrigerationEffect * 0.429923).toFixed(1)} Btu/lb`
                  : `${refrigerationEffect.toFixed(1)} kJ/kg`}
              </div>
              <span className="text-[9px] text-slate-500 font-sans">qe = h1 - h4</span>
            </div>

            {/* 2. COMPRESSOR WORK */}
            <div className="bg-[#0b101e] border border-slate-800 rounded p-2">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">{isEn ? 'COMPRESSOR WORK' : 'KERJA KOMPRESI'}</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {unitSystem === 'Imperial'
                  ? `${(compressorWork * 0.429923).toFixed(1)} Btu/lb`
                  : `${compressorWork.toFixed(1)} kJ/kg`}
              </div>
              <span className="text-[9px] text-slate-500 font-sans">wc = h2 - h1</span>
            </div>

            {/* 3. HEAT REJECTION */}
            <div className="bg-[#0b101e] border border-slate-800 rounded p-2">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">{isEn ? 'HEAT REJECTION' : 'PELEPASAN PANAS'}</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {unitSystem === 'Imperial'
                  ? `${(heatRejection * 0.429923).toFixed(1)} Btu/lb`
                  : `${heatRejection.toFixed(1)} kJ/kg`}
              </div>
              <span className="text-[9px] text-slate-500 font-sans">qc = h2 - h3</span>
            </div>

            {/* 4. PRESSURE RATIO */}
            <div className="bg-[#0b101e] border border-slate-800 rounded p-2">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">{isEn ? 'PRESSURE RATIO' : 'RASIO TEKANAN'}</span>
              <div className="text-sm font-bold text-white mt-0.5">{pressureRatio.toFixed(2)}</div>
              <span className="text-[9px] text-slate-500 font-sans">P_cond / P_evap (abs)</span>
            </div>

            {/* 5. DISCHARGE TEMP */}
            <div className="bg-[#0b101e] border border-slate-800 rounded p-2">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">{isEn ? 'DISCHARGE TEMP' : 'SUHU DISCHARGE'}</span>
              <div className="text-sm font-bold text-rose-300 mt-0.5">
                {unitSystem === 'Imperial'
                  ? `${(dischargeTemp * 1.8 + 32).toFixed(1)} °F`
                  : `${dischargeTemp.toFixed(1)} °C`}
              </div>
              <span className="text-[9px] text-slate-500 font-sans">
                {isEn ? 'Isentropic: ' : 'Isentropik: '}
                {unitSystem === 'Imperial'
                  ? `${((dischargeTemp - 9.8) * 1.8 + 32).toFixed(1)} °F`
                  : `${(dischargeTemp - 9.8).toFixed(1)} °C`}
              </span>
            </div>

            {/* 6. VALVE OUTLET QUALITY */}
            <div className="bg-[#0b101e] border border-slate-800 rounded p-2">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">{isEn ? 'VALVE OUTLET QUALITY' : 'KUALITAS OUTLET EXP'}</span>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">{valveOutletQuality.toFixed(3)}</div>
              <span className="text-[9px] text-slate-500 font-sans">x4 = (h4 - hf) / hfg</span>
            </div>

            {/* 7. MASS FLOW */}
            <div className="bg-[#0b101e] border border-slate-800 rounded p-2">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">{isEn ? 'MASS FLOW' : 'LAJU ALIR MASSA'}</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {unitSystem === 'Imperial'
                  ? `${(massFlowKgH * 2.20462).toFixed(1)} lb/h`
                  : `${massFlowKgH.toFixed(1)} kg/h`}
              </div>
              <span className="text-[9px] text-slate-500 font-sans">
                {unitSystem === 'Imperial'
                  ? `${(massFlowKgS * 2.20462).toFixed(4)} lb/s`
                  : `${massFlowKgS.toFixed(4)} kg/s`}
              </span>
            </div>

            {/* 8. COOLING CAPACITY */}
            <div className="bg-[#0b101e] border border-slate-800 rounded p-2">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">{isEn ? 'COOLING CAPACITY' : 'KAPASITAS PENDINGINAN'}</span>
              <div className="text-sm font-bold text-cyan-400 mt-0.5">
                {unitSystem === 'Imperial'
                  ? `${(coolingCapacityKw * 3412.14).toFixed(0)} Btu/h`
                  : `${coolingCapacityKw.toFixed(2)} kW`}
              </div>
              <span className="text-[9px] text-slate-500 font-sans">{(coolingCapacityKw / 3.517).toFixed(2)} TR</span>
            </div>

            {/* 9. COMPRESSOR POWER */}
            <div className="bg-[#0b101e] border border-slate-800 rounded p-2">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">{isEn ? 'COMPRESSOR POWER' : 'DAYA KOMPRESOR'}</span>
              <div className="text-sm font-bold text-amber-400 mt-0.5">
                {unitSystem === 'Imperial'
                  ? `${(result.compressorPowerKw * 1.34102).toFixed(2)} HP`
                  : `${result.compressorPowerKw.toFixed(2)} kW`}
              </div>
              <span className="text-[9px] text-slate-500 font-sans">
                {isEn ? 'Isentropic: ' : 'Isentropik: '}
                {unitSystem === 'Imperial'
                  ? `${(result.compressorPowerKw * 0.70 * 1.34102).toFixed(2)} HP`
                  : `${(result.compressorPowerKw * 0.70).toFixed(2)} kW`}
              </span>
            </div>

            {/* 10. HEATING CAPACITY */}
            <div className="bg-[#0b101e] border border-slate-800 rounded p-2">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">{isEn ? 'HEATING CAPACITY' : 'KAPASITAS PEMANASAN'}</span>
              <div className="text-sm font-bold text-rose-400 mt-0.5">
                {unitSystem === 'Imperial'
                  ? `${(heatingCapacityKw * 3412.14).toFixed(0)} Btu/h`
                  : `${heatingCapacityKw.toFixed(2)} kW`}
              </div>
              <span className="text-[9px] text-slate-500 font-sans">Qh = Qe + Wcomp</span>
            </div>
          </div>

          {/* Section D: STATE POINTS Table (Matching reference photo!) */}
          <div className="bg-[#0b101e] border border-slate-800 rounded-lg p-2.5 space-y-1.5 shadow-sm flex-1">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">
                {isEn ? 'STATE POINTS' : 'TITIK KEADAAN'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {isEn ? 'Pressure: ' : 'Tekanan: '}{pressureBasis.toUpperCase()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[10.5px]">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="py-1 px-1 font-bold">{isEn ? 'Point' : 'Titik'}</th>
                    <th className="py-1 px-1 font-bold text-right">P ({pressureUnit})</th>
                    <th className="py-1 px-1 font-bold text-right">T ({tempUnit})</th>
                    <th className="py-1 px-1 font-bold text-right">h ({enthalpyUnit})</th>
                    <th className="py-1 px-1 font-bold text-right">s</th>
                    <th className="py-1 px-1 font-bold text-right">v</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {extendedStatePoints.map((row) => {
                    const isSelected = selectedPointKey === row.point;
                    return (
                      <tr
                        key={`state-row-${row.point}`}
                        onClick={() => setSelectedPointKey(row.point)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/70 text-cyan-200 font-bold'
                            : row.isMainPoint
                            ? 'text-slate-200 hover:bg-slate-800/50'
                            : 'text-slate-400 hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-1 px-1 font-bold flex items-center gap-1">
                          <span className={`w-3.5 h-3.5 rounded text-[9px] flex items-center justify-center font-bold text-white ${
                            row.point === '1' ? 'bg-orange-500' :
                            row.point === '2' ? 'bg-red-500' :
                            row.point === '3' ? 'bg-emerald-600' :
                            row.point === '4' ? 'bg-cyan-600' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {row.point}
                          </span>
                        </td>
                        <td className="py-1 px-1 text-right">{formatPressureValue(row.pBar)}</td>
                        <td className="py-1 px-1 text-right text-amber-300">
                          {unitSystem === 'Imperial' ? (row.tC * 1.8 + 32).toFixed(1) : row.tC.toFixed(1)}
                        </td>
                        <td className="py-1 px-1 text-right text-emerald-400">
                          {unitSystem === 'Imperial' ? (row.hKjKg * 0.429923).toFixed(1) : row.hKjKg.toFixed(1)}
                        </td>
                        <td className="py-1 px-1 text-right text-blue-400">
                          {row.sKjKgK ? (unitSystem === 'Imperial' ? (row.sKjKgK * 0.238846).toFixed(3) : row.sKjKgK.toFixed(3)) : '-'}
                        </td>
                        <td className="py-1 px-1 text-right text-purple-300">
                          {row.vM3Kg ? (unitSystem === 'Imperial' ? (row.vM3Kg * 16.0185).toFixed(4) : row.vM3Kg.toFixed(4)) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </aside>
      )}
      </div>

      {/* ================= 4. MODALS INTEGRATION ================= */}
      {/* A. Refrigerant Selector Modal (Danfoss Style) */}
      <RefrigerantSelectorModal
        isOpen={isRefModalOpen}
        onClose={() => setIsRefModalOpen(false)}
        selectedId={selectedRef}
        onSelect={(refId) => {
          setSelectedRef(refId);
          setIsRefModalOpen(false);
        }}
      />

      {/* B. Official RTU Ph-Cycle PDF Report Modal */}
      {isReportModalOpen && (
        <PhCycleReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          branding={branding}
          reportMeta={reportMeta}
          onUpdateReportMeta={handleUpdateReportMeta}
          result={result}
          inputValues={{
            suctionPressure: suctionPressureBar,
            suctionPressureUnit: 'bar',
            dischargePressure: dischargePressureBar,
            dischargePressureUnit: 'bar',
            suctionTempC,
            dischargeTempC,
            liquidTempC,
            compressorPower: result.compressorPowerKw,
            compressorPowerUnit: 'kW',
          }}
          language={language}
        />
      )}

      {/* C. WhatsApp Share Modal */}
      {isWaModalOpen && (
        <WhatsAppShareModal
          isOpen={isWaModalOpen}
          onClose={() => setIsWaModalOpen(false)}
          reportTitle={`Laporan Siklus P-h ${selectedRef}`}
          messageText={buildWhatsAppReportMessage({
            title: `Pengujian Siklus P-h ${selectedRef}`,
            companyName: branding?.companyName || 'Labtech RTU Trainer',
            reportMeta,
            sections: [
              {
                title: 'Parameter Operasi & Kinerja',
                items: [
                  { label: 'Refrigeran', value: selectedRef },
                  { label: 'Tekanan Suction (Pe)', value: peDisplayStr },
                  { label: 'Tekanan Discharge (Pc)', value: pcDisplayStr },
                  { label: 'Superheat (SH)', value: `${liveMetrics.sh.toFixed(1)} K` },
                  { label: 'Subcooling (SC)', value: `${liveMetrics.sc.toFixed(1)} K` },
                  { label: 'COP Pendinginan / COP Cooling', value: copCooling.toFixed(2) },
                  { label: 'EER (Energy Efficiency Ratio)', value: `${eerBtuWh.toFixed(2)} Btu/(W·h)` },
                  { label: 'COP Pemanasan / COP Heating', value: copHeating.toFixed(2) },
                  { label: 'Kapasitas Pendinginan', value: `${coolingCapacityKw.toFixed(2)} kW` },
                  { label: 'Daya Kompresor', value: `${result.compressorPowerKw.toFixed(2)} kW` },
                ],
              },
            ],
          })}
        />
      )}

      {/* D. Saved Plots Modal */}
      {isSavedPlotsModalOpen && (
        <SavedPlotsModal
          isOpen={isSavedPlotsModalOpen}
          onClose={() => setIsSavedPlotsModalOpen(false)}
          savedPlots={savedPlots}
          onSelectPlotAndPlay={handleRestorePlot}
          onDeletePlot={(id) => {
            deletePhPlot(id);
            setSavedPlots(getSavedPhPlots());
          }}
          onSaveCurrentPlot={handleSaveCurrentPlot}
          currentRefrigerantName={selectedRef}
          currentCop={copCooling}
          currentCapacityKw={coolingCapacityKw}
          currentReportMeta={reportMeta}
        />
      )}

      {/* E. Refrigerant Saturation Table Modal (CoolPack Style with Fine Control) */}
      {isSaturationTableOpen && (
        <RefrigerantSaturationTableModal
          isOpen={isSaturationTableOpen}
          onClose={() => setIsSaturationTableOpen(false)}
          defaultRefrigerantId={selectedRef}
          onSelectRefrigerant={(refId) => setSelectedRef(refId)}
          language={language}
          unitSystem={unitSystem}
        />
      )}
    </div>
  );
};
