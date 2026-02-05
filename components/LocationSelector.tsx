
import React, { useState } from 'react';
import { X, Search, MapPin, Check } from 'lucide-react';
import { translations, Language } from '../translations';

export const INDIAN_REGIONS_LIST = [
  {
    state: "Tamil Nadu",
    cities: [
      "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", 
      "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram", 
      "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", 
      "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", 
      "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", 
      "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", 
      "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", 
      "Vellore", "Viluppuram", "Virudhunagar"
    ]
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onSelect: (city: string, state: string) => void;
  lang: Language;
}

const LocationSelector: React.FC<Props> = ({ isOpen, onClose, currentLocation, onSelect, lang }) => {
  const t = translations[lang];
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredRegions = INDIAN_REGIONS_LIST.map(region => ({
    ...region,
    cities: region.cities.filter(city => 
      city.toLowerCase().includes(search.toLowerCase()) || 
      region.state.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(region => region.cities.length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-agro-dark/60 backdrop-blur-sm animate-in fade-in duration-200" role="presentation" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:max-h-[80vh] border-t sm:border border-agro-muted/10 transition-all animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-loc-title"
        onClick={e => e.stopPropagation()}
      >
        
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full mx-auto mt-4 mb-2 shrink-0" aria-hidden="true"></div>

        <div className="p-5 sm:p-6 border-b border-agro-muted/10 flex items-center justify-between shrink-0">
          <div>
            <h2 id="modal-loc-title" className="text-lg sm:text-xl font-black text-agro-dark dark:text-white uppercase tracking-tight">{t.selectLocation}</h2>
            <p className="text-[8px] sm:text-xs text-agro-muted font-black uppercase tracking-widest mt-0.5">{t.chooseSandhai}</p>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close location selector"
            className="p-2 hover:bg-agro-light dark:hover:bg-slate-800 rounded-full text-agro-muted transition-colors active:scale-90 focus-visible:ring-4 focus-visible:ring-agro-primary/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-agro-muted/60" aria-hidden="true" />
            <label htmlFor="city-search" className="sr-only">Search cities or states</label>
            <input 
              id="city-search"
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-agro-light/30 dark:bg-slate-800 border border-agro-muted/10 dark:border-slate-700 rounded-2xl text-[13px] sm:text-sm font-black text-agro-dark dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-agro-primary/10 transition-all placeholder:text-agro-muted/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 pt-2 space-y-8 scrollbar-hide">
          {filteredRegions.map((region) => (
            <section key={region.state} className="space-y-4" aria-labelledby={`state-${region.state}`}>
              <h3 id={`state-${region.state}`} className="text-[9px] font-black text-agro-primary dark:text-emerald-400 uppercase tracking-[0.2em] px-1 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm py-1 z-10">{region.state}</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {region.cities.map((city) => {
                  const isSelected = currentLocation.includes(city);
                  return (
                    <button
                      key={city}
                      onClick={() => {
                        onSelect(city, region.state);
                        onClose();
                      }}
                      aria-pressed={isSelected}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left transition-all active:scale-95 group focus-visible:ring-4 focus-visible:ring-agro-primary/30 ${
                        isSelected 
                        ? 'bg-agro-primary/10 border-agro-primary text-agro-primary font-black shadow-sm' 
                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-agro-primary/30 text-agro-dark dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-agro-primary' : 'text-agro-muted/40'}`} aria-hidden="true" />
                        <span className="text-[13px] truncate">{city}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-agro-primary shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="p-4 sm:p-5 bg-agro-light/30 dark:bg-slate-800/50 text-[9px] text-agro-muted dark:text-slate-500 text-center font-black uppercase tracking-[0.3em] border-t border-agro-muted/10 shrink-0">
          {t.sourceEnam}
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
