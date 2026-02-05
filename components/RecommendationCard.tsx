import React, { useState, useEffect } from 'react';
import { CropRecommendation } from '../types';
import { 
  TrendingUp, 
  BarChart3, 
  Info, 
  Calendar, 
  ShieldCheck, 
  Zap, 
  Volume2, 
  Square, 
  Loader2, 
  Image as ImageIcon,
  RefreshCw,
  AlertCircle,
  Leaf,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { translations, Language } from '../translations';
import { speakWithFallback } from '../services/ttsService';
import { stopPlayback } from '../utils/audioUtils';
import { generateCropImage } from '../services/imageService';

interface Props {
  rec: CropRecommendation;
  lang: Language;
  activeAudioId: string | null;
  setActiveAudioId: (id: string | null) => void;
}

const FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1200&auto=format&fit=crop";

const RecommendationCard: React.FC<Props> = ({ rec, lang, activeAudioId, setActiveAudioId }) => {
  const t = translations[lang];
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  const cardId = `crop-${rec.cropName}`;
  const isSpeaking = activeAudioId === cardId;

  const loadImage = async (forceRegenerate = false) => {
    setLoadingImage(true);
    setIsFallback(false);
    try {
      const dataUrl = await generateCropImage(rec.cropName, forceRegenerate);
      if (dataUrl) {
        setImageUrl(dataUrl);
      } else {
        setImageUrl(FALLBACK_IMAGE_URL);
        setIsFallback(true);
      }
    } catch (err) {
      console.error("Card image fetch failed", err);
      setImageUrl(FALLBACK_IMAGE_URL);
      setIsFallback(true);
    } finally {
      setLoadingImage(false);
    }
  };

  useEffect(() => {
    loadImage();
  }, [rec.cropName]);

  const isHigh = rec.sustainabilityScore > 80;
  const isMed = rec.sustainabilityScore > 60;
  
  const scoreColor = isHigh ? 'text-agro-primary dark:text-emerald-400' : isMed ? 'text-amber-700 dark:text-amber-500' : 'text-rose-700 dark:text-rose-400';

  const handleSpeak = async () => {
    if (isSpeaking) {
      stopPlayback();
      setActiveAudioId(null);
      return;
    }

    stopPlayback();
    setActiveAudioId(cardId);
    setLoadingAudio(true);
    
    const fullText = [
      rec.cropName, 
      ...(rec.suitabilityReasons || []),
      rec.sustainabilityReport, 
      rec.advice
    ].filter(Boolean).join('. ');

    try {
      await speakWithFallback(fullText, lang);
    } catch (err) {
      console.error("Speech playback error", err);
    } finally {
      setLoadingAudio(false);
      setActiveAudioId(null);
    }
  };

  return (
    <article className="group bg-white dark:bg-slate-900 rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-premium-hover hover:-translate-y-4 transition-all duration-700 flex flex-col focus-within:ring-4 focus-within:ring-agro-primary/30">
      <div className="relative h-72 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {loadingImage ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-agro-light/20 dark:bg-slate-800 animate-pulse" aria-hidden="true">
              <Loader2 className="w-10 h-10 text-agro-primary/40 animate-spin" />
              <span className="text-[10px] font-black uppercase text-agro-primary/60 tracking-widest">{t.generatingImage}</span>
           </div>
        ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt={`Photo of ${rec.cropName}`}
              className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-[4000ms] ease-out"
              onError={() => {
                if (!isFallback) {
                   setImageUrl(FALLBACK_IMAGE_URL);
                   setIsFallback(true);
                }
              }}
            />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-agro-light/20" aria-hidden="true">
             <ImageIcon className="w-10 h-10 text-agro-primary/30" />
          </div>
        )}

        {isFallback && !loadingImage && (
            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20 hover:bg-black/80 transition-colors">
              <AlertCircle className="w-3 h-3 text-white" />
              <span className="text-[8px] font-bold text-white uppercase tracking-widest">{t.imageUnavailable}</span>
            </div>
        )}
        
        <button 
            onClick={() => loadImage(true)}
            aria-label={`Regenerate image for ${rec.cropName}`}
            className="absolute top-6 right-6 p-2.5 bg-white/30 backdrop-blur-xl hover:bg-white/60 text-white rounded-full transition-all border border-white/20 opacity-0 group-hover:opacity-100 shadow-lg z-20 focus-visible:opacity-100 focus-visible:ring-4 focus-visible:ring-white/50 active:scale-90"
        >
            <RefreshCw className={`w-4 h-4 ${loadingImage ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
        </button>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:opacity-90 transition-opacity" aria-hidden="true" />
        
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-agro-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg">{t.optimized}</span>
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] font-black text-white">{rec.confidence}%</span>
              </div>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none drop-shadow-md">{rec.cropName}</h3>
          </div>
          <button 
            onClick={handleSpeak}
            disabled={loadingAudio}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 border border-white/20 ${isSpeaking ? 'bg-white text-agro-primary' : 'bg-white/10 text-white backdrop-blur-md hover:bg-white/20'}`}
          >
            {loadingAudio ? <Loader2 className="w-5 h-5 animate-spin" /> : isSpeaking ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group/item hover:border-agro-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-agro-primary group-hover/item:rotate-12 transition-transform" />
              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.yieldPotential}</span>
            </div>
            <p className="text-sm font-black text-agro-dark dark:text-slate-200">{rec.expectedYield}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group/item hover:border-agro-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-agro-accent group-hover/item:scale-110 transition-transform" />
              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.netProfit}</span>
            </div>
            <p className="text-sm font-black text-agro-dark dark:text-slate-200">{rec.estimatedProfit}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-agro-primary" /> Why this crop?
          </h4>
          <div className="space-y-2">
            {rec.suitabilityReasons?.map((reason, i) => (
              <div key={i} className="flex items-start gap-3 text-[11px] font-medium text-agro-dark dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-900/10 px-3 py-2 rounded-xl border border-emerald-100/50 dark:border-emerald-500/10">
                <ChevronRight className="w-3 h-3 text-agro-primary mt-0.5 shrink-0" />
                {reason}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 bg-agro-light/30 dark:bg-slate-800/50 rounded-2xl border border-agro-primary/10 space-y-3 relative overflow-hidden group/advice">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/advice:scale-125 transition-transform">
            <Leaf className="w-12 h-12 text-agro-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-agro-primary" />
            <span className="text-[9px] font-black text-agro-primary dark:text-emerald-400 uppercase tracking-widest">{t.optimalWindow}: {rec.plantingWindow}</span>
          </div>
          <p className="text-xs font-medium text-agro-dark dark:text-slate-200 leading-relaxed italic pr-4">"{rec.advice}"</p>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-agro-primary" />
              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.sustainabilityReport}</span>
            </div>
            <span className={`text-xs font-black ${scoreColor}`}>{rec.sustainabilityScore}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${isHigh ? 'bg-agro-primary shadow-emerald-glow' : isMed ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${rec.sustainabilityScore}%` }}
            />
          </div>
          <p className="mt-3 text-[10px] text-agro-muted dark:text-slate-400 font-medium leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-500">{rec.sustainabilityReport}</p>
        </div>
      </div>
    </article>
  );
};

export default RecommendationCard;
