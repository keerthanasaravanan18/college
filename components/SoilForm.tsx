
import React, { useState, useEffect, useRef } from 'react';
import { SoilData } from '../types';
import { 
  Sprout, 
  Droplets, 
  FlaskConical, 
  Database, 
  History, 
  ChevronRight, 
  Scan, 
  Loader2, 
  Radar, 
  ChevronDown,
  Terminal,
  Activity,
  Cpu,
  Binary
} from 'lucide-react';
import { translations, Language } from '../translations';

interface Props {
  onCalculate: (data: SoilData, history: string) => void;
  loading: boolean;
  predicting: boolean;
  lang: Language;
  initialData?: SoilData | null;
}

const SoilForm: React.FC<Props> = ({ onCalculate, loading, predicting, lang, initialData }) => {
  const t = translations[lang];
  const [history, setHistory] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [data, setData] = useState<SoilData>({
    ph: 7.2,
    nitrogen: 45,
    phosphorus: 22,
    potassium: 30,
    organicMatter: 2.8,
    moisture: 55,
    soilType: 'Black',
    moistureStatus: 'Moist'
  });

  // Display flickering values during scan
  const [flickerValues, setFlickerValues] = useState({ ph: 7.2, nitrogen: 45, moisture: 55 });

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setHistory('');
    }
  }, [initialData]);

  const soilTypes = ['Alluvial', 'Black', 'Red', 'Laterite', 'Desert', 'Mountain'];
  const moistureLevels = ['Dry', 'Moist', 'Wet'];

  const handleSimulateSensor = async () => {
    setIsScanning(true);
    setScanStep(1);

    const flickerInterval = setInterval(() => {
      setFlickerValues({
        ph: Number((5 + Math.random() * 4).toFixed(1)),
        nitrogen: Math.floor(10 + Math.random() * 90),
        moisture: Math.floor(10 + Math.random() * 90)
      });
    }, 100);

    // Sequence through diagnostic steps
    await new Promise(r => setTimeout(r, 800));
    setScanStep(2);
    await new Promise(r => setTimeout(r, 1000));
    setScanStep(3);
    await new Promise(r => setTimeout(r, 800));
    setScanStep(4);
    await new Promise(r => setTimeout(r, 600));

    clearInterval(flickerInterval);

    setData({
      ...data,
      ph: Number((6.2 + Math.random() * 1.6).toFixed(1)),
      nitrogen: Math.floor(35 + Math.random() * 45),
      moisture: Math.floor(40 + Math.random() * 50),
      soilType: soilTypes[Math.floor(Math.random() * soilTypes.length)],
      moistureStatus: moistureLevels[Math.floor(Math.random() * moistureLevels.length)]
    });

    setIsScanning(false);
    setScanStep(0);
  };

  const getScanMessage = () => {
    if (scanStep === 1) return t.scanStep1;
    if (scanStep === 2) return t.scanStep2;
    if (scanStep === 3) return t.scanStep3;
    if (scanStep === 4) return t.scanStep4;
    return "";
  };

  return (
    <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] shadow-glass border border-white dark:border-slate-800 space-y-6 sm:space-y-8 transition-all overflow-hidden" aria-busy={loading || predicting || isScanning}>
      
      {/* Diagnostic Overlay */}
      {isScanning && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 sm:p-10 pointer-events-none">
          <div className="absolute inset-0 bg-agro-dark/95 backdrop-blur-md animate-in fade-in duration-300"></div>
          
          {/* Diagnostic UI Elements */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="h-full w-full bg-[radial-gradient(#249E94_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          </div>

          <div className="relative w-full max-w-xs space-y-6 text-center">
            <div className="relative inline-block">
               <div className="w-24 h-24 border-2 border-dashed border-emerald-400/50 rounded-full animate-[spin_4s_linear_infinite]"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <Cpu className="w-10 h-10 text-emerald-400 animate-pulse" />
               </div>
               <div className="absolute -inset-4 border-2 border-emerald-500/20 rounded-full animate-ping"></div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter animate-pulse">{getScanMessage()}</h3>
              <div className="flex items-center justify-center gap-2">
                 <Activity className="w-4 h-4 text-agro-muted animate-bounce" />
                 <div className="h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${(scanStep / 4) * 100}%` }}></div>
                 </div>
                 <span className="text-[10px] font-black text-emerald-400">{(scanStep / 4) * 100}%</span>
              </div>
            </div>

            <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 font-mono text-[9px] text-emerald-400/80 text-left space-y-1">
               <div className="flex gap-2">
                 <span className="opacity-40">0x4F:</span> 
                 <span>INIT_SOIL_PROBE_V2.1</span>
               </div>
               <div className="flex gap-2">
                 <span className="opacity-40">0x52:</span> 
                 <span className={scanStep >= 2 ? 'text-white' : ''}>{scanStep >= 2 ? 'SENSORS_ALIGNED_NPK' : 'WAITING_FOR_CALIB'}</span>
               </div>
               <div className="flex gap-2">
                 <span className="opacity-40">0x5A:</span> 
                 <span className={scanStep >= 3 ? 'text-white' : ''}>{scanStep >= 3 ? 'DEPTH_PROBE_SUCCESS: 30CM' : 'INITIALIZING_DEPTH'}</span>
               </div>
               <div className="flex gap-2">
                 <span className="opacity-40">0x6E:</span> 
                 <span className="animate-pulse">DATA_STREAMING...</span>
               </div>
            </div>
          </div>

          {/* Scanning Animation */}
          <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-loop blur-sm top-0" aria-hidden="true"></div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="group cursor-default">
          <h2 className="text-lg sm:text-xl font-black text-agro-dark dark:text-white tracking-tight flex items-center gap-2 uppercase leading-none group-hover:text-agro-primary transition-colors">
            <Database className="w-4 h-4 sm:w-5 h-5 text-agro-primary group-hover:rotate-12 transition-transform" aria-hidden="true" /> {t.fieldProfile}
          </h2>
          <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1.5 tracking-widest opacity-60">
            {isScanning ? "Diagnostic in progress..." : t.mittiHistoryData}
          </p>
        </div>

        <div className="relative">
          <button 
            onClick={handleSimulateSensor}
            disabled={isScanning || predicting}
            className="relative flex items-center gap-2 px-3 sm:px-4 py-2 bg-agro-light/40 dark:bg-emerald-900/20 text-agro-primary dark:text-emerald-400 rounded-xl sm:rounded-2xl hover:bg-agro-primary hover:text-white transition-all border border-agro-primary/20 group/scan active:scale-90 focus-visible:ring-4 focus-visible:ring-agro-primary/30"
          >
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <span className="w-full h-full bg-agro-primary/20 rounded-xl sm:rounded-2xl animate-radar-ping"></span>
            </span>
            
            {isScanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Radar className="w-4 h-4 group-hover/scan:rotate-12 group-hover/scan:scale-110 transition-transform" />
            )}
            <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">{t.autoScan}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 relative z-10">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2 group">
            <label htmlFor="soil-type" className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 group-hover:text-agro-primary transition-colors">{t.soilClass}</label>
            <div className="relative">
              <select 
                id="soil-type"
                value={data.soilType}
                onChange={e => setData({...data, soilType: e.target.value})}
                className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-agro-light/30 dark:bg-slate-800 border border-agro-muted/10 dark:border-slate-700 rounded-xl sm:rounded-2xl text-[12px] sm:text-sm font-black text-agro-dark dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-agro-primary/10 hover:border-agro-primary/30 transition-all appearance-none cursor-pointer"
              >
                {soilTypes.map(type => <option key={type} value={type}>{type} Soil</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-agro-muted/40 pointer-events-none group-hover:text-agro-primary transition-colors" />
            </div>
          </div>
          <div className="space-y-1.5 sm:space-y-2 group">
            <label htmlFor="moisture-status" className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 group-hover:text-agro-primary transition-colors">{t.surfaceState}</label>
            <div className="relative">
              <select 
                id="moisture-status"
                value={data.moistureStatus}
                onChange={e => setData({...data, moistureStatus: e.target.value})}
                className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-agro-light/30 dark:bg-slate-800 border border-agro-muted/10 dark:border-slate-700 rounded-xl sm:rounded-2xl text-[12px] sm:text-sm font-black text-agro-dark dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-agro-primary/10 hover:border-agro-primary/30 transition-all appearance-none cursor-pointer"
              >
                {moistureLevels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-agro-muted/40 pointer-events-none group-hover:text-agro-primary transition-colors" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 group">
          <label htmlFor="prev-crop" className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1 group-hover:text-agro-primary transition-colors">
            <History className="w-3 h-3 group-hover:scale-110 transition-transform" /> {t.prevCrop}
          </label>
          <input 
            id="prev-crop"
            type="text" 
            placeholder={t.prevCropPlaceholder}
            value={history}
            onChange={e => setHistory(e.target.value)}
            className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-agro-light/30 dark:bg-slate-800 border border-agro-muted/10 dark:border-slate-700 rounded-xl sm:rounded-2xl text-[12px] sm:text-sm font-black text-agro-dark dark:text-slate-200 placeholder:text-agro-muted/40 focus:outline-none focus:ring-4 focus:ring-agro-primary/10 hover:border-agro-primary/30 transition-all"
          />
        </div>

        <fieldset className="bg-agro-light/10 dark:bg-slate-950/20 p-4 sm:p-5 rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-5 border border-agro-primary/5 hover:border-agro-primary/20 transition-colors">
           <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2 group/input">
              <label htmlFor="soil-ph" className="text-[8px] sm:text-[9px] font-black text-agro-primary dark:text-emerald-400 uppercase tracking-widest ml-1 group-hover/input:brightness-125 transition-all">{t.soilPh}</label>
              <div className="relative">
                <FlaskConical className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-agro-primary/40 group-focus-within/input:text-agro-primary transition-all" />
                <input 
                  id="soil-ph"
                  type="number" step="0.1" 
                  value={isScanning ? flickerValues.ph : data.ph} 
                  onChange={e => setData({...data, ph: Number(e.target.value)})}
                  className={`w-full pl-9 sm:pl-11 pr-3 py-3 sm:py-3.5 bg-white dark:bg-slate-800 border border-agro-muted/10 dark:border-slate-700 rounded-xl sm:rounded-2xl text-[12px] sm:text-sm font-black text-agro-dark dark:text-slate-200 focus:outline-none transition-all ${isScanning ? 'animate-pulse text-emerald-500' : ''}`}
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2 group/input">
              <label htmlFor="soil-humidity" className="text-[8px] sm:text-[9px] font-black text-agro-primary dark:text-emerald-400 uppercase tracking-widest ml-1 group-hover/input:brightness-125 transition-all">{t.humidityPercent}</label>
              <div className="relative">
                <Droplets className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-agro-primary/40 group-focus-within/input:text-agro-primary transition-all" />
                <input 
                  id="soil-humidity"
                  type="number" 
                  value={isScanning ? flickerValues.moisture : data.moisture} 
                  onChange={e => setData({...data, moisture: Number(e.target.value)})}
                  className={`w-full pl-9 sm:pl-11 pr-3 py-3 sm:py-3.5 bg-white dark:bg-slate-800 border border-agro-muted/10 dark:border-slate-700 rounded-xl sm:rounded-2xl text-[12px] sm:text-sm font-black text-agro-dark dark:text-slate-200 focus:outline-none transition-all ${isScanning ? 'animate-pulse text-emerald-500' : ''}`}
                />
              </div>
            </div>
          </div>
        </fieldset>
      </div>

      <button 
        onClick={() => onCalculate(data, history)}
        disabled={loading || predicting || isScanning}
        className="group w-full bg-agro-primary text-white font-black py-4 sm:py-5 px-6 rounded-xl sm:rounded-[2rem] shadow-glass hover:bg-agro-dark hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer-fast"></div>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span className="uppercase tracking-widest text-[11px] sm:text-sm">{t.runAiDiagnostic}</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
};

export default SoilForm;
