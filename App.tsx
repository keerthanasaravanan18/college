
import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, 
  CloudSun, 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  MapPin,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Cpu,
  Languages,
  CloudRain,
  Sun,
  Moon,
  Cloud,
  Volume2,
  Square,
  Loader2,
  Compass,
  LayoutGrid
} from 'lucide-react';
import SoilForm from './components/SoilForm';
import RecommendationCard from './components/RecommendationCard';
import MarketInsights from './components/MarketInsights';
import LocationSelector from './components/LocationSelector';
import WelcomeModal from './components/WelcomeModal';
import { fetchRegionalWeather } from './services/weatherService';
import { generateAiRecommendations, getExpertStrategicAdvice, predictSoilCharacteristics } from './services/geminiService';
import { speakWithFallback } from './services/ttsService';
import { stopPlayback } from './utils/audioUtils';
import { SoilData, WeatherData, CropRecommendation } from './types';
import { translations, Language } from './translations';

const App: React.FC = () => {
  // Default language set to Tamil
  const [lang, setLang] = useState<Language>('ta');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });
  const t = translations[lang];
  
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [weather, setWeather] = useState<WeatherData>({
    temp: 32,
    humidity: 60,
    rainfall: 0,
    // Initial forecast matches Tamil default
    forecast: "வளிமண்டலத்தை பகுப்பாய்வு செய்கிறது...",
    dailyForecast: []
  });
  const [location, setLocation] = useState("Thanjavur, Tamil Nadu");
  const [recs, setRecs] = useState<CropRecommendation[]>([]);
  const [expertAdvice, setExpertAdvice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [soilLoading, setSoilLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'market'>('dashboard');
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
  
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [loadingAudioExpert, setLoadingAudioExpert] = useState(false);

  // Ref for scrolling to recommendations
  const recsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleCloseWelcome = () => {
    setIsWelcomeOpen(false);
  };

  useEffect(() => {
    refreshRegionalData(location);
  }, [lang]);

  const refreshRegionalData = async (loc: string) => {
    setWeatherLoading(true);
    setSoilLoading(true);
    try {
      const weatherData = await fetchRegionalWeather(loc);
      setWeather(weatherData);
      
      const predictedSoil = await predictSoilCharacteristics(loc, weatherData);
      setSoil(predictedSoil);
      
      const advice = await getExpertStrategicAdvice(loc, weatherData, lang);
      setExpertAdvice(advice);
    } catch (e) {
      console.error("Regional refresh failed", e);
    } finally {
      setWeatherLoading(false);
      setSoilLoading(false);
    }
  };

  const handleAnalyze = async (data: SoilData, history: string) => {
    setLoading(true);
    setSoil(data);
    
    // Smoothly scroll to the recommendations section so user sees the loading state
    setTimeout(() => {
      recsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const recommendations = await generateAiRecommendations(data, weather, location, history, lang);
      setRecs(recommendations);
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (city: string, state: string) => {
    const newLoc = `${city}, ${state}`;
    setLocation(newLoc);
    refreshRegionalData(newLoc);
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'ta' : 'en');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSpeakExpert = async () => {
    const expertId = 'expert-insight';
    if (activeAudioId === expertId) {
      stopPlayback();
      setActiveAudioId(null);
      return;
    }
    
    stopPlayback();
    setActiveAudioId(expertId);
    setLoadingAudioExpert(true);

    try {
      setLoadingAudioExpert(false);
      await speakWithFallback(expertAdvice, lang);
    } catch (err) {
      console.error("Expert TTS failed", err);
    } finally {
      setLoadingAudioExpert(false);
      setActiveAudioId(null);
    }
  };

  const getWeatherIcon = (condition: string) => {
    const cond = condition.toLowerCase();
    if (cond.includes('rain')) return <CloudRain className="w-6 h-6 text-blue-500" aria-hidden="true" />;
    if (cond.includes('cloud')) return <Cloud className="w-6 h-6 text-slate-400 dark:text-slate-500" aria-hidden="true" />;
    return <Sun className="w-6 h-6 text-amber-500" aria-hidden="true" />;
  };

  const mainGridClass = activeTab === 'dashboard' 
    ? "grid-cols-1 lg:grid-cols-[100px_1fr_360px]" 
    : "grid-cols-1 lg:grid-cols-[100px_1fr]";

  return (
    <div className="min-h-screen bg-agro-light/40 dark:bg-slate-950 flex flex-col pb-28 lg:pb-0 text-agro-dark dark:text-slate-100 font-sans transition-colors duration-500 overflow-x-hidden">
      {/* Skip to Content for A11y */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-agro-primary focus:text-white focus:rounded-b-xl">
        Skip to main content
      </a>

      <WelcomeModal isOpen={isWelcomeOpen} onClose={handleCloseWelcome} />

      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-white/20 dark:border-slate-800/50 sticky top-0 z-40 transition-all shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group flex items-center cursor-default" aria-label="Vivasaya Udhaviyalar Logo">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-slate-900 border border-agro-primary/20 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center relative shadow-soft group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-agro-primary rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-emerald-glow transition-all">
                  <Leaf className="text-white w-4 h-4 sm:w-6 sm:h-6" aria-hidden="true" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4">
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-agro-dark to-agro-primary bg-clip-text text-transparent dark:from-white dark:to-emerald-400 tracking-tighter leading-none uppercase group-hover:tracking-normal transition-all duration-500">VIVASAYA</h1>
                <p className="text-[7px] sm:text-[10px] text-agro-muted font-black uppercase tracking-[0.4em] mt-0.5 sm:mt-1.5 opacity-80">UDHAVIYALAR</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme} 
              aria-label={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
              className="p-2 sm:p-3 bg-white dark:bg-slate-800 text-slate-500 rounded-lg sm:rounded-xl border border-slate-200/50 dark:border-slate-700 active:scale-90 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:ring-4 focus-visible:ring-agro-primary/30"
            >
              {theme === 'light' ? <Moon className="w-3 h-3 sm:w-4 sm:h-4" /> : <Sun className="w-3 h-3 sm:w-4 sm:h-4" />}
            </button>
            <button 
              onClick={toggleLanguage} 
              aria-label={lang === 'en' ? "தமிழ் மொழிக்கு மாற்றவும்" : "Switch to English"}
              className="px-3 sm:px-5 py-2 sm:py-3 bg-white dark:bg-emerald-900/20 text-agro-primary dark:text-emerald-400 rounded-lg sm:rounded-xl border border-agro-primary/10 font-black text-[10px] sm:text-xs flex items-center gap-2 active:scale-90 transition-all hover:bg-agro-primary/5 dark:hover:bg-emerald-500/10 focus-visible:ring-4 focus-visible:ring-agro-primary/30"
            >
              <Languages className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
              <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>
            <button 
              onClick={() => setIsLocModalOpen(true)} 
              aria-expanded={isLocModalOpen}
              aria-haspopup="dialog"
              className="flex items-center justify-center sm:justify-start gap-2 bg-agro-primary text-white p-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-2xl shadow-glass active:scale-90 hover:bg-agro-dark hover:shadow-emerald-glow transition-all focus-visible:ring-4 focus-visible:ring-emerald-500/50"
            >
              <MapPin className="w-4 h-4 sm:animate-bounce" aria-hidden="true" />
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="text-[9px] text-white/70 font-black uppercase tracking-widest leading-none">{t.regionHub}</span>
                <span className="text-xs font-black flex items-center gap-1">
                  {location.split(',')[0]} <ChevronDown className="w-3 h-3 text-white/60" aria-hidden="true" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className={`max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 grid ${mainGridClass} gap-6 sm:gap-10`}>
        <aside className="hidden lg:block" aria-label="Desktop Navigation">
          <nav className="sticky top-28 space-y-4">
            <NavSidebarButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Compass />} label={t.farm} />
            <NavSidebarButton active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<TrendingUp />} label={t.sandhai} />
          </nav>
        </aside>

        <main id="main-content" className="space-y-6 sm:space-y-10" tabIndex={-1}>
          {activeTab === 'dashboard' && (
            <>
              <section className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6" aria-label="Weather and Insights">
                <WeatherWidget label={t.temperature} value={weatherLoading ? "..." : `${weather.temp}°C`} icon={<CloudSun className="text-blue-500" />} />
                <WeatherWidget label={t.humidity} value={weatherLoading ? "..." : `${weather.humidity}%`} icon={<Activity className="text-emerald-500" />} />
                <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-agro-primary to-agro-dark p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-glass relative overflow-hidden group hover:scale-[1.03] hover:shadow-premium-hover transition-all duration-500">
                   <div className="absolute -right-4 -top-4 opacity-10">
                     <Sparkles className="w-24 h-24 text-white animate-pulse" aria-hidden="true" />
                   </div>
                   <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
                     <div className="flex items-center gap-2 px-2 py-1 bg-white/10 rounded-full border border-white/10">
                       <Cpu className="w-2.5 h-2.5 text-emerald-300" aria-hidden="true" />
                       <span className="text-[8px] text-white font-black uppercase tracking-widest">{t.liveExpertInsight}</span>
                     </div>
                     <button 
                        onClick={handleSpeakExpert} 
                        disabled={(activeAudioId !== null && activeAudioId !== 'expert-insight') || loadingAudioExpert || !expertAdvice} 
                        aria-label={activeAudioId === 'expert-insight' ? "Stop expert summary" : "Listen to expert summary"}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all focus-visible:ring-4 focus-visible:ring-white/50 ${activeAudioId === 'expert-insight' ? 'bg-white text-agro-primary shadow-xl scale-110' : 'bg-white/20 text-white active:scale-90 hover:bg-white/30'}`}
                      >
                       {loadingAudioExpert ? <Loader2 className="w-4 h-4 animate-spin" /> : activeAudioId === 'expert-insight' ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-4 h-4" />}
                     </button>
                   </div>
                   <p className="text-[11px] sm:text-sm text-white/90 font-medium leading-relaxed italic relative z-10 pr-2 line-clamp-2" aria-live="polite">
                     {weatherLoading ? "Decrypting environmental data..." : `"${expertAdvice || weather.forecast}"`}
                   </p>
                </div>
              </section>

              <section className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-white dark:border-slate-800 shadow-soft hover:shadow-glass transition-shadow duration-500" aria-label="5 Day Forecast">
                <h3 className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <CloudSun className="w-3.5 h-3.5 text-agro-primary" aria-hidden="true" /> {t.weatherOutlook}
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1 snap-x">
                  {weatherLoading ? (
                    <div className="w-full flex items-center justify-center py-4"><RefreshCw className="w-6 h-6 text-agro-primary animate-spin" aria-label="Loading weather..." /></div>
                  ) : weather.dailyForecast?.map((day, idx) => (
                    <div key={idx} className="flex-shrink-0 w-[90px] sm:w-[120px] bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-xl sm:rounded-[2rem] border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center gap-2 sm:gap-3 snap-start shadow-sm active:scale-95 hover:-translate-y-2 transition-transform duration-300" role="group" aria-label={`${day.date}: ${day.condition}, Max ${day.tempMax} degrees`}>
                      <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase">{day.date}</span>
                      <div className="bg-agro-light/30 dark:bg-slate-700/50 p-2 sm:p-3 rounded-lg sm:rounded-2xl group-hover:bg-agro-primary/10 transition-colors" aria-hidden="true">{getWeatherIcon(day.condition)}</div>
                      <div className="flex flex-col leading-tight"><span className="text-sm sm:text-lg font-black text-agro-dark dark:text-white">{day.tempMax}°</span><span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase">{day.tempMin}°</span></div>
                    </div>
                  ))}
                </div>
              </section>

              <section ref={recsRef} className="space-y-6 sm:space-y-8" aria-label="Crop Recommendations">
                <div className="flex items-center gap-3 sm:gap-4 px-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-soft hover:rotate-6 transition-transform"><Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-agro-primary" aria-hidden="true" /></div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-black text-agro-dark dark:text-white tracking-tight leading-none uppercase">{t.optimizedRecommendations}</h2>
                    <p className="text-[8px] sm:text-[10px] text-agro-muted font-bold uppercase tracking-[0.1em] mt-1.5 sm:mt-2">AI-Synthesized analysis</p>
                  </div>
                </div>
                
                <div aria-live="polite" className="min-h-[200px]">
                {loading ? (
                  <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg border border-white dark:border-slate-800 rounded-2xl sm:rounded-[3.5rem] p-12 sm:p-24 text-center flex flex-col items-center justify-center space-y-6 shadow-soft">
                    <div className="relative"><div className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-agro-light border-t-agro-primary rounded-full animate-spin" /><div className="absolute inset-0 flex items-center justify-center"><Cpu className="w-7 h-7 sm:w-10 sm:h-10 text-agro-primary animate-pulse" aria-hidden="true" /></div></div>
                    <div><h3 className="text-lg sm:text-2xl font-black text-agro-dark dark:text-white">{t.processing}</h3><p className="text-[10px] sm:text-sm text-agro-muted mt-2 max-w-xs mx-auto leading-relaxed">{t.processingSub}</p></div>
                  </div>
                ) : recs.length === 0 ? (
                  <div className="bg-white/30 dark:bg-emerald-900/5 border-2 border-dashed border-agro-muted/20 rounded-2xl sm:rounded-[3.5rem] p-10 sm:p-20 text-center flex flex-col items-center justify-center group hover:bg-white/50 dark:hover:bg-emerald-900/10 transition-colors duration-500">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white dark:bg-slate-900 rounded-xl sm:rounded-[2.5rem] flex items-center justify-center shadow-soft mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"><Leaf className="w-8 h-8 sm:w-10 sm:h-10 text-agro-primary" aria-hidden="true" /></div>
                    <h3 className="text-lg sm:text-2xl font-black text-agro-primary mb-2 uppercase group-hover:scale-105 transition-transform">{t.readyForAnalysis}</h3><p className="text-[10px] sm:text-sm text-agro-muted max-w-xs mx-auto leading-relaxed">{t.readyForAnalysisSub}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">{recs.map((rec, idx) => (<RecommendationCard key={`${rec.cropName}-${idx}`} rec={rec} lang={lang} activeAudioId={activeAudioId} setActiveAudioId={setActiveAudioId} />))}</div>
                )}
                </div>
              </section>
            </>
          )}
          {activeTab === 'market' && <MarketInsights location={location} lang={lang} recommendations={recs} />}
        </main>

        {activeTab === 'dashboard' && (
          <aside className="lg:col-span-1" aria-label="Input field data">
            <div className="sticky top-28 hover:shadow-2xl transition-shadow duration-500 rounded-[3rem] overflow-hidden"><SoilForm onCalculate={(s, h) => handleAnalyze(s, h)} loading={loading} predicting={soilLoading} lang={lang} initialData={soil} /></div>
          </aside>
        )}
      </div>

      <LocationSelector isOpen={isLocModalOpen} onClose={() => setIsLocModalOpen(false)} currentLocation={location} onSelect={handleLocationSelect} lang={lang} />
      
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-50">
        <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white/20 dark:border-slate-800 p-2 flex justify-between items-center rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5" aria-label="Mobile Navigation">
          <NavMobileButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutGrid />} label={t.farm} />
          <NavMobileButton active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<TrendingUp />} label={t.sandhai} />
        </nav>
      </div>
    </div>
  );
};

const WeatherWidget = ({ label, value, icon }: any) => (
  <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg p-3 sm:p-6 rounded-xl sm:rounded-[2.5rem] border border-white dark:border-slate-800 shadow-soft flex items-center gap-3 sm:gap-5 group hover-lift active:scale-95" aria-label={`${label}: ${value}`}>
    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-slate-800 rounded-lg sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:bg-agro-primary/5 dark:group-hover:bg-agro-primary/20 transition-colors" aria-hidden="true">{React.cloneElement(icon, { className: 'w-5 h-5 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform duration-500' })}</div>
    <div className="min-w-0">
      <div className="text-[7px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.15em] mb-0.5 sm:mb-1 truncate">{label}</div>
      <div className="text-sm sm:text-2xl font-black text-agro-dark dark:text-slate-100 tracking-tighter leading-none group-hover:text-agro-primary dark:group-hover:text-emerald-400 transition-colors">{value}</div>
    </div>
  </div>
);

const NavSidebarButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    aria-current={active ? 'page' : undefined}
    className={`p-5 rounded-3xl w-full flex flex-col items-center gap-2 transition-all duration-500 focus-visible:ring-4 focus-visible:ring-agro-primary/50 group active:scale-95 ${active ? 'bg-agro-primary text-white shadow-emerald-glow scale-105' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800 hover:text-agro-primary hover:border-agro-primary/40 hover:shadow-soft'}`}
  >
    {React.cloneElement(icon, { className: `w-7 h-7 group-hover:scale-110 transition-transform duration-500 ${active ? 'animate-float' : ''}`, 'aria-hidden': 'true' })}
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    {active && <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-white rounded-r-full shadow-emerald-glow"></span>}
  </button>
);

const NavMobileButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    aria-current={active ? 'page' : undefined}
    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all relative focus-visible:ring-4 focus-visible:ring-agro-primary/50 group active:scale-90 ${active ? 'text-agro-primary' : 'text-slate-500 dark:text-slate-400'}`}
  >
    {active && (
      <span className="absolute inset-0 bg-agro-primary/10 dark:bg-agro-primary/20 rounded-xl animate-in zoom-in-75 duration-300"></span>
    )}
    <div className={`transition-transform duration-500 ${active ? 'scale-110 translate-y-[-2px]' : 'group-hover:translate-y-[-2px]'}`}>
      {React.cloneElement(icon, { className: 'w-5 h-5', 'aria-hidden': 'true' })}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tight transition-colors ${active ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
  </button>
);

export default App;
