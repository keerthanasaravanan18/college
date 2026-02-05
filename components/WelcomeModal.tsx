
import React, { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Start exit animation after 3 seconds
      const timer = setTimeout(() => {
        setIsExiting(true);
        // Completely remove after exit animation finishes
        setTimeout(onClose, 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-slate-950 transition-all duration-500 ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}`}>
      {/* Cinematic Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-agro-primary/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px] animate-radar-ping"></div>

      <div className="relative flex flex-col items-center justify-center">
        {/* Animated Logo Container */}
        <div className="relative mb-8 group animate-bounce">
          <div className="absolute inset-0 bg-agro-primary blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-agro-primary rounded-[2.5rem] flex items-center justify-center shadow-emerald-glow relative transform hover:scale-110 transition-transform duration-500">
            <Leaf className="text-white w-12 h-12" />
          </div>
        </div>

        {/* App Title Display */}
        <div className="text-center opacity-0 animate-[fade-in_1s_ease-out_forwards]">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-agro-dark to-agro-primary bg-clip-text text-transparent dark:from-white dark:to-emerald-400 tracking-tighter leading-none uppercase italic mb-2">
            VIVASAYA
          </h1>
          <p className="text-sm text-agro-muted dark:text-emerald-500 font-black uppercase tracking-[0.5em] opacity-80">
            UDHAVIYALAR
          </p>
        </div>

        {/* Subtle Progress Line */}
        <div className="mt-12 w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-agro-primary animate-progress-load"></div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default WelcomeModal;
