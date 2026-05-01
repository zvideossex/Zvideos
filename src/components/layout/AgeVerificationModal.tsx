import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export const AgeVerificationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('age-verified');
    if (!verified) {
      setIsOpen(true);
    }
  }, []);

  const handleVerify = (verified: boolean) => {
    if (verified) {
      localStorage.setItem('age-verified', 'true');
      setIsOpen(false);
    } else {
      window.location.href = 'https://www.google.com';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl"
          >
            <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-red-600" />
            </div>

            <h2 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">
              Age Restricted <span className="text-red-600">Content</span>
            </h2>
            
            <p className="text-white/50 text-sm leading-relaxed mb-8">
              Z-VIDEOS contains adult material and is only accessible to individuals aged 18 and older. 
              By entering, you confirm you are of legal age in your jurisdiction.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleVerify(false)}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
              >
                <XCircle className="w-6 h-6 text-white/30 group-hover:text-white transition-colors" />
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">I am Under 18</span>
              </button>

              <button 
                onClick={() => handleVerify(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-orange-600 hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 group"
              >
                <CheckCircle2 className="w-6 h-6 text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">I am 18+</span>
              </button>
            </div>

            <p className="mt-8 text-[10px] text-white/20 uppercase font-black tracking-[0.2em]">
              Community Protection Policy v2.4
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
