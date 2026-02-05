
import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MapPin, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  CheckCircle2, 
  Plus, 
  Mail, 
  ShieldCheck, 
  ExternalLink, 
  Calculator, 
  Wallet, 
  Store, 
  Warehouse, 
  Scale, 
  Globe, 
  Link2,
  PieChart,
  ArrowRight,
  Loader2,
  Timer,
  Award,
  History,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { fetchLiveMarketData } from '../services/geminiService';
import { getSandhaiInsights } from '../services/localService';
import { MarketInsight, CropRecommendation } from '../types';
import { translations, Language } from '../translations';

const ValueSpreadChart = ({ wholesale, retail, lang }: { wholesale: number, retail: number, lang: Language }) => {
  const t = translations[lang];
  const farmerShare = Math.round((wholesale / retail) * 100);
  const markup = 100 - farmerShare;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-agro-primary">{t.farmersShare}: {farmerShare}%</span>
        <span className="text-emerald-400">{t.retailMarkup}: {markup}%</span>
      </div>
      <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
        <div 
          className="h-full bg-agro-primary transition-all duration-1000 ease-out relative group" 
          style={{ width: `${farmerShare}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>
        <div 
          className="h-full bg-emerald-400 transition-all duration-1000 ease-out delay-100" 
          style={{ width: `${markup}%` }}
        >
           <div className="absolute inset-0 bg-gradient-to-l from-black/5 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

const ReliabilityBadge = ({ type, lang }: { type?: 'Official' | 'Verified' | 'Standard', lang: Language }) => {
  const t = translations[lang];
  
  const configs = {
    Official: {
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: <Award className="w-3 h-3" />,
      label: 'OFFICIAL eNAM'
    },
    Verified: {
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: <FileCheck2 className="w-3 h-3" />,
      label: 'VERIFIED REPORT'
    },
    Standard: {
      color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      icon: <History className="w-3 h-3" />,
      label: 'WEB ESTIMATE'
    }
  };

  const config = configs[type || 'Standard'];

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[8px] font-black uppercase tracking-widest ${config.color}`}>
      {config.icon}
      {config.label}
    </div>
  );
};

const Sparkline = ({ data, trend, height = 40, width = 120 }: { data: number[], trend: string, height?: number, width?: number }) => {
  if (!data || data.length < 2) return <div style={{ height, width }}></div>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((val - min) / range) * height
  }));
  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;
  
  const color = trend === 'Up' ? '#10b981' : trend === 'Down' ? '#f43f5e' : '#249E94';
  const gradId = `spark-grad-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="drop-shadow-sm overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaData} fill={`url(#${gradId})`} />
      <path d={pathData} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="3" fill={color} />
    </svg>
  );
};

interface Props {
  location: string;
  lang: Language;
  recommendations: CropRecommendation[];
}

const MarketInsights: React.FC<Props> = ({ location, lang, recommendations }) => {
  const t = translations[lang];
  const [data, setData] = useState<(MarketInsight & { sources?: any[], isLive?: boolean }) | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [quantity, setQuantity] = useState<number>(10);

  const fetchData = async (force: boolean = false) => {
    if (!data) {
      const recNames = recommendations.map(r => r.cropName);
      const simulated = getSandhaiInsights(location, recNames);
      setData({ ...simulated, isLive: false });
    }

    setSyncing(true);
    try {
      const recNames = recommendations.map(r => r.cropName.split('(')[0].trim());
      const insights = await fetchLiveMarketData(location, recNames, lang, force);
      setData({ ...insights, isLive: true });
    } catch (err) {
      console.warn("AI Grounding failed, using simulation", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location, recommendations]);

  const prices = data?.prices || [];

  const parsePrice = (priceStr: string): number => {
    return parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getCommodityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('tomato')) return '🍅';
    if (n.includes('paddy')) return '🌾';
    if (n.includes('onion')) return '🧅';
    if (n.includes('maize')) return '🌽';
    if (n.includes('turmeric')) return '🫚';
    if (n.includes('cotton')) return '☁️';
    if (n.includes('chilli')) return '🌶️';
    return '📦';
  };

  const recNames = recommendations.map(r => r.cropName.split('(')[0].trim().toLowerCase());

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-10 rounded-[3rem] shadow-glass border border-white dark:border-slate-800">
        
        {/* Market Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-agro-primary/10 rounded-2xl flex items-center justify-center text-agro-primary">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-agro-dark dark:text-white uppercase">
                  {t.apmcInsights}
                </h2>
                {syncing && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-agro-primary/10 text-agro-primary rounded-full animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Syncing</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${data?.isLive ? 'bg-emerald-500' : 'bg-amber-400'} animate-pulse`}></span>
                  <p className="text-[10px] text-agro-muted font-bold uppercase tracking-widest">
                    {data?.isLive ? t.sourceEnam : 'Simulated Prices - Grounding...'}
                  </p>
                </div>
                {data?.lastUpdated && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                    <Timer className="w-3 h-3 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.asOf} {data.lastUpdated}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
             <button 
              onClick={() => fetchData(true)} 
              disabled={syncing}
              className="px-6 py-4 bg-agro-light/50 dark:bg-slate-800 rounded-2xl text-agro-muted hover:bg-agro-primary hover:text-white transition-all flex items-center gap-3 font-black uppercase text-xs tracking-widest group active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Profit Estimator Section */}
        <section className="mb-10 bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800/50 dark:to-slate-900 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-500/20 shadow-inner">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-agro-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Calculator className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-agro-dark dark:text-white uppercase mb-1.5">{t.marketCalculator}</h3>
                <p className="text-[10px] text-agro-muted font-bold uppercase tracking-widest">{t.accuracyNote}</p>
              </div>
            </div>

            <div className="flex-1 w-full max-w-md">
              <input 
                type="range" 
                min="1" 
                max="500" 
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-agro-primary"
              />
              <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400 uppercase">
                <span>1 Qtl</span>
                <span>{quantity} {t.quintals}</span>
                <span>500 Qtl</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-sm border border-emerald-100 dark:border-slate-700 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-1">{t.quintals}</span>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-20 text-xl font-black text-agro-primary bg-transparent focus:outline-none"
                />
              </div>
              <Scale className="w-6 h-6 text-agro-muted opacity-40" />
            </div>
          </div>
        </section>

        {/* Commodity Listings */}
        <div className="grid grid-cols-1 gap-8 min-h-[400px]">
          {prices.map((p: any, idx) => {
            const isRecommended = recNames.some(name => p.commodity.toLowerCase().includes(name));
            const modalPriceNum = parsePrice(p.modalPrice);
            const retailPriceNum = parsePrice(p.retailPrice);
            const wholesaleRevenue = modalPriceNum * quantity;
            const retailRevenue = retailPriceNum * quantity;
            const marginPercent = modalPriceNum > 0 ? Math.round(((retailPriceNum - modalPriceNum) / modalPriceNum) * 100) : 0;
            
            return (
              <div key={idx} className={`relative p-8 rounded-[3rem] border transition-all duration-500 flex flex-col xl:flex-row items-center gap-10 ${
                isRecommended 
                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-500/30' 
                : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 shadow-sm'
              }`}>
                
                {isRecommended && (
                  <div className="absolute top-0 left-0 px-5 py-2 bg-agro-primary text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-br-2xl flex items-center gap-2 z-10">
                    <Target className="w-3.5 h-3.5" /> RECOMMENDED
                  </div>
                )}
                
                <div className="flex items-center gap-8 w-full xl:w-auto min-w-[280px]">
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner shrink-0 ${
                    isRecommended ? 'bg-agro-primary text-white' : 'bg-agro-light/40 dark:bg-slate-700/50'
                  }`}>
                    {getCommodityIcon(p.commodity)}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-agro-dark dark:text-slate-100 tracking-tight leading-none">{p.commodity}</h3>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-agro-muted uppercase">
                        <MapPin className="w-3.5 h-3.5" /> {p.mandi}
                      </div>
                      <ReliabilityBadge type={p.reliability} lang={lang} />
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/40 dark:bg-slate-900/40 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.wholesalePrice}</span>
                        </div>
                        <div className="text-xl font-black text-agro-dark dark:text-white">{p.modalPrice}</div>
                      </div>
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">{t.wholesaleRevenue}</span>
                        <div className="text-2xl font-black text-slate-700 dark:text-slate-300 tracking-tighter">{formatCurrency(wholesaleRevenue)}</div>
                      </div>
                    </div>

                    <div className="bg-agro-primary/5 dark:bg-emerald-900/10 p-5 rounded-[2rem] border border-agro-primary/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Store className="w-16 h-16" />
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-agro-primary" />
                          <span className="text-[10px] font-black text-agro-primary uppercase tracking-widest">{t.retailPrice}</span>
                        </div>
                        <div className="text-xl font-black text-agro-primary dark:text-emerald-400">{p.retailPrice}</div>
                      </div>
                      <div className="pt-4 border-t border-agro-primary/10">
                        <span className="text-[9px] font-black text-agro-primary uppercase block mb-1">{t.retailRevenue}</span>
                        <div className="text-2xl font-black text-agro-primary dark:text-emerald-400 tracking-tighter">{formatCurrency(retailRevenue)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-1">
                    <ValueSpreadChart wholesale={modalPriceNum} retail={retailPriceNum} lang={lang} />
                  </div>
                </div>

                <div className="flex flex-col items-center xl:items-end gap-5 shrink-0 min-w-[160px]">
                  <div className="bg-emerald-500 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                     <TrendingUp className="w-3.5 h-3.5" /> {marginPercent}% {t.potentialMargin}
                  </div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <Sparkline 
                      data={p.history || [modalPriceNum * 0.9, modalPriceNum * 0.95, modalPriceNum * 0.92, modalPriceNum * 0.98, modalPriceNum]} 
                      trend={p.trend} 
                      width={140} 
                      height={50} 
                    />
                    <div className="flex flex-col items-center gap-1.5">
                      {data?.isLive && (
                        <div className="px-3 py-1.5 rounded-full border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50/50 dark:bg-emerald-500/5">
                          {p.reliability === 'Official' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Timer className="w-3.5 h-3.5" />}
                          {p.sourceName || t.verifiedFresh}
                        </div>
                      )}
                      {p.lastUpdated && (
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          {t.sourceTime}: {p.lastUpdated}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grounding Sources */}
        {data?.sources && data.sources.length > 0 && (
          <div className="mt-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top duration-500">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" /> {t.viewSource}
            </h4>
            <div className="flex flex-wrap gap-4">
              {data.sources.map((src, i) => (
                <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-agro-primary hover:bg-agro-primary hover:text-white transition-all shadow-sm">
                  <Link2 className="w-3.5 h-3.5" /> {src.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Official Farmer Helpline */}
        <div className="mt-16 p-1 bg-gradient-to-br from-agro-dark to-slate-900 rounded-[3rem] shadow-premium-hover group overflow-hidden transition-all duration-700 hover:-translate-y-2">
          <div className="bg-white/5 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.8rem] p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-10 relative">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity group-hover:rotate-12 duration-1000">
              <ShieldCheck className="w-56 h-56 text-white" />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 text-center sm:text-left">
              <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] border border-white/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-700">
                <div className="relative">
                   <div className="absolute inset-0 bg-emerald-400/20 blur-2xl animate-pulse"></div>
                   <Mail className="w-12 h-12 text-emerald-400 relative" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-center sm:justify-start gap-4">
                  <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-emerald-500/30">
                    {t.officialBadge}
                  </span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase leading-none">
                  {t.govHelplineTitle}
                </h3>
                <p className="text-base text-slate-300 font-medium max-w-xl leading-relaxed opacity-80">
                  {t.govHelplineSub}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-4 w-full lg:w-auto relative z-10">
              <a 
                href="mailto:farmerhelpline@nafed-india.com"
                className="group/btn w-full sm:w-auto px-10 py-6 bg-white text-agro-dark font-black rounded-[2.2rem] text-sm uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl hover:bg-emerald-50 active:scale-95 transition-all"
              >
                {t.contactSupport}
                <ExternalLink className="w-5 h-5" />
              </a>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2 group-hover:text-emerald-400 transition-colors">
                farmerhelpline@nafed-india.com
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MarketInsights;
