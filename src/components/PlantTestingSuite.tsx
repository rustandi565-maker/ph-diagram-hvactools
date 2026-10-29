import React, { useState, useMemo } from 'react';
import { CompanyBranding } from '../types/branding';
import {
  ChillerTestInputs,
  CoolingTowerTestInputs,
  AhuTestInputs,
} from '../types/plantTesting';
import {
  calculateChillerPerformance,
  calculateCoolingTowerPerformance,
  calculateAhuPerformance,
  calculateIntegratedPlant,
  CHILLER_PRESETS,
  COOLING_TOWER_PRESETS,
  AHU_PRESETS,
} from '../utils/plantCalculations';
import { ChillerTestingView } from './ChillerTestingView';
import { CoolingTowerTestingView } from './CoolingTowerTestingView';
import { AhuTestingView } from './AhuTestingView';
import { IntegratedPlantView } from './IntegratedPlantView';
import { PlantTestingReportModal } from './PlantTestingReportModal';
import { CikorTrainerBenchmarkView } from './CikorTrainerBenchmarkView';
import { AppLanguage, TRANSLATIONS } from '../utils/i18n';

interface PlantTestingSuiteProps {
  branding: CompanyBranding;
  language?: AppLanguage;
}

export type PlantActiveSubTab =
  | 'chiller'
  | 'cooling_tower'
  | 'ahu'
  | 'integrated_plant'
  | 'cikor_trainer';

export const PlantTestingSuite: React.FC<PlantTestingSuiteProps> = ({
  branding,
  language = 'id',
}) => {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.id;

  const [activeSubTab, setActiveSubTab] = useState<PlantActiveSubTab>('chiller');
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // 1. Chiller State
  const [chillerInputs, setChillerInputs] = useState<ChillerTestInputs>(
    () => CHILLER_PRESETS[0].inputs
  );

  // 2. Cooling Tower State
  const [ctInputs, setCtInputs] = useState<CoolingTowerTestInputs>(
    () => COOLING_TOWER_PRESETS[0].inputs
  );

  // 3. AHU State
  const [ahuInputs, setAhuInputs] = useState<AhuTestInputs>(
    () => AHU_PRESETS[0].inputs
  );

  // 4. Plant Auxiliaries State
  const [chwpKW, setChwpKW] = useState<number>(37.0); // Chilled water pump
  const [cwpKW, setCwpKW] = useState<number>(45.0);  // Condenser water pump
  const [ctFanKW, setCtFanKW] = useState<number>(18.5); // CT Fan kW
  const [ahuKW, setAhuKW] = useState<number>(32.0);   // Total AHU fans
  const [tariffPerKwhIDR, setTariffPerKwhIDR] = useState<number>(1500);
  const [operatingHours, setOperatingHours] = useState<number>(4380);

  // Dynamic calculations
  const chillerResults = useMemo(
    () => calculateChillerPerformance(chillerInputs),
    [chillerInputs]
  );

  const ctResults = useMemo(
    () => calculateCoolingTowerPerformance(ctInputs),
    [ctInputs]
  );

  const ahuResults = useMemo(
    () => calculateAhuPerformance(ahuInputs),
    [ahuInputs]
  );

  const integratedResults = useMemo(
    () =>
      calculateIntegratedPlant(
        chillerResults,
        ctResults,
        ctFanKW,
        chwpKW,
        cwpKW,
        ahuKW,
        tariffPerKwhIDR,
        operatingHours
      ),
    [chillerResults, ctResults, ctFanKW, chwpKW, cwpKW, ahuKW, tariffPerKwhIDR, operatingHours]
  );

  const handleUpdateChiller = <K extends keyof ChillerTestInputs>(
    key: K,
    val: ChillerTestInputs[K]
  ) => {
    setChillerInputs((prev) => ({ ...prev, [key]: val }));
  };

  const handleUpdateCt = <K extends keyof CoolingTowerTestInputs>(
    key: K,
    val: CoolingTowerTestInputs[K]
  ) => {
    setCtInputs((prev) => ({ ...prev, [key]: val }));
  };

  const handleUpdateAhu = <K extends keyof AhuTestInputs>(
    key: K,
    val: AhuTestInputs[K]
  ) => {
    setAhuInputs((prev) => ({ ...prev, [key]: val }));
  };

  const handleCopySummary = async () => {
    const text = `=== HASIL TESTING PERFORMA HVAC PLANT (${branding.companyName}) ===
1. CHILLER (${chillerInputs.chillerTag}):
   - Kapasitas: ${chillerResults.evapCapacityTR} TR (${chillerResults.evapCapacityKW} kW)
   - Daya Listrik: ${chillerResults.totalPowerInputKW} kW
   - Efisiensi: ${chillerResults.specificPowerKWPerTR.toFixed(3)} kW/TR (COP: ${chillerResults.copActual.toFixed(2)}, EER: ${chillerResults.eerBtuPerWh.toFixed(1)} Btu/Wh)
   - Approach: Evap ${chillerResults.evaporatorApproachC}°C | Condenser ${chillerResults.condenserApproachC}°C
   - Status: ${chillerResults.efficiencyVerdict}

2. COOLING TOWER (${ctInputs.towerTag}):
   - Range: ${ctResults.rangeC.toFixed(2)} °C | Approach: ${ctResults.approachC.toFixed(2)} °C
   - Efektivitas: ${ctResults.effectivenessPercent.toFixed(1)} %
   - Kalor Terbuang: ${ctResults.heatRejectedTR} TR
   - Makeup Water: ${ctResults.totalMakeupWaterM3H.toFixed(2)} m³/jam (CoC: ${ctInputs.cyclesOfConcentration})

3. AHU (${ahuInputs.ahuTag}):
   - Debit Udara: ${ahuInputs.measuredAirflowCfm} CFM (ESP: ${ahuInputs.externalStaticPressurePa} Pa)
   - Kapasitas Total: ${ahuResults.airsideTotalCapacityTR} TR (SHR: ${ahuResults.sensibleHeatRatio.toFixed(2)})
   - Specific Fan Power: ${ahuResults.specificFanPowerWPerLps.toFixed(2)} W/(L/s) (${ahuResults.sfpClassification})
   - Status Filter: ${ahuInputs.filterPressureDropPa} Pa (${ahuResults.filterStatus})

4. TOTAL PLANT EFFICIENCY:
   - Total Beban: ${integratedResults.totalChillerTR} TR
   - Total Daya: ${integratedResults.totalPlantPowerKW.toFixed(1)} kW
   - Overall Plant: ${integratedResults.overallPlantKWPerTR.toFixed(3)} kW/TR
   - Kategori: ${integratedResults.plantRating.toUpperCase()}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏭</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Testing Performa Chiller, Cooling Tower &amp; AHU
            </h1>
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              ASHRAE 22 / CTI / NEBB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Audit kinerja termal, specific power (kW/TR), efisiensi menara pendingin (range &amp; approach), psikrometrik koil AHU, Specific Fan Power (SFP), neraca air, dan simulasi biaya energi terintegrasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>{copySuccess ? '✓ Tersalin!' : '📋 Salin Ringkasan'}</span>
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 rounded-lg transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>📄 Berita Acara &amp; Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Preset Fast Selector Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1">
          <span>⚡ Preset Pengujian Cepat:</span>
        </span>

        {activeSubTab === 'chiller' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {CHILLER_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setChillerInputs(p.inputs)}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  chillerInputs.chillerTag === p.inputs.chillerTag
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {activeSubTab === 'cooling_tower' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {COOLING_TOWER_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setCtInputs(p.inputs)}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  ctInputs.towerTag === p.inputs.towerTag
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {activeSubTab === 'ahu' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {AHU_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setAhuInputs(p.inputs)}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  ahuInputs.ahuTag === p.inputs.ahuTag
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {activeSubTab === 'integrated_plant' && (
          <div className="text-slate-400 text-xs">
            Data plant terhubung secara otomatis dengan pengukuran Chiller ({chillerResults.evapCapacityTR} TR) dan Menara ({ctResults.heatRejectedTR} TR).
          </div>
        )}
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('chiller')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'chiller'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>❄️</span>
          <span>1. Uji Performa Chiller</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-400 rounded">
            {chillerResults.specificPowerKWPerTR.toFixed(2)} kW/TR
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('cooling_tower')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'cooling_tower'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>💧</span>
          <span>2. Uji Cooling Tower</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-400 rounded">
            Approach: {ctResults.approachC.toFixed(1)}°C
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('ahu')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'ahu'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>💨</span>
          <span>3. Uji Performa AHU</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-400 rounded">
            {ahuInputs.measuredAirflowCfm} CFM
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('integrated_plant')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'integrated_plant'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>⚡</span>
          <span>4. Total Central Plant Efficiency</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-emerald-400 rounded font-bold">
            {integratedResults.overallPlantKWPerTR.toFixed(2)} kW/TR
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('cikor_trainer')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'cikor_trainer'
              ? 'bg-gradient-to-r from-sky-500/20 to-purple-500/20 text-sky-300 border-2 border-sky-400/60 shadow-lg ring-2 ring-sky-400/20 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <span>🎓</span>
          <span>5. Studi Trainer CK-5W (Data PDF)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-950 text-purple-300 rounded font-bold border border-purple-500/30">
            R410A vs R32 vs Ideal
          </span>
        </button>
      </div>

      {/* Sub-Tab View Rendering */}
      <div>
        {activeSubTab === 'chiller' && (
          <ChillerTestingView
            inputs={chillerInputs}
            onChangeInput={handleUpdateChiller}
            results={chillerResults}
            language={language}
          />
        )}

        {activeSubTab === 'cooling_tower' && (
          <CoolingTowerTestingView
            inputs={ctInputs}
            onChangeInput={handleUpdateCt}
            results={ctResults}
            language={language}
          />
        )}

        {activeSubTab === 'ahu' && (
          <AhuTestingView
            inputs={ahuInputs}
            onChangeInput={handleUpdateAhu}
            results={ahuResults}
            language={language}
          />
        )}

        {activeSubTab === 'integrated_plant' && (
          <IntegratedPlantView
            chillerResults={chillerResults}
            ctResults={ctResults}
            integrated={integratedResults}
            chwpKW={chwpKW}
            onChangeChwpKW={setChwpKW}
            cwpKW={cwpKW}
            onChangeCwpKW={setCwpKW}
            ctFanKW={ctFanKW}
            onChangeCtFanKW={setCtFanKW}
            ahuKW={ahuKW}
            onChangeAhuKW={setAhuKW}
            tariffPerKwhIDR={tariffPerKwhIDR}
            onChangeTariff={setTariffPerKwhIDR}
            operatingHours={operatingHours}
            onChangeOperatingHours={setOperatingHours}
          />
        )}

        {activeSubTab === 'cikor_trainer' && (
          <CikorTrainerBenchmarkView
            onLoadPreset={(ch, ct, ah, label) => {
              setChillerInputs(ch);
              setCtInputs(ct);
              setAhuInputs(ah);
              // Set appropriate auxiliary pump kW according to CK-5W pump specs (0.75 kW pump)
              setChwpKW(0.75);
              setCwpKW(0.75);
              setCtFanKW(0.75);
              setAhuKW(1.1);
            }}
          />
        )}
      </div>

      {/* Official Engineering Test Report Modal */}
      <PlantTestingReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        branding={branding}
        chillerInputs={chillerInputs}
        chillerResults={chillerResults}
        ctInputs={ctInputs}
        ctResults={ctResults}
        ahuInputs={ahuInputs}
        ahuResults={ahuResults}
        integrated={integratedResults}
        language={language}
      />
    </div>
  );
};
