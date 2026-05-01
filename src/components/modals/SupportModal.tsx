import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle } from 'lucide-react';
import { useAuth } from '../../AuthContext';

export const SupportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-blue-600" />
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-white/40 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-600 rounded-2xl">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Technical Support</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Agent Online</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-1 italic">Agent Z</p>
                <p className="text-sm text-white/80">Hello {profile?.username || 'Creator'}. How can I assist your system operations today? All systems are 100% active.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 self-end ml-8">
                <p className="text-sm text-white/60 italic">Checking system vitals... AdSense active. Faucets active. 18+ Verification active.</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:scale-[0.98] transition-all"
            >
              End Session
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
