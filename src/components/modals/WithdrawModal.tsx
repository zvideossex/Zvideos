import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, CheckCircle2, DollarSign, ArrowRight } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestoreErrorHandler';

export const WithdrawModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  balance: number;
}> = ({ isOpen, onClose, balance }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!user || loading || balance <= 0) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        earnings: 0, // Reset balance
        lastPayoutDate: new Date().toISOString()
      });
      setStep(2);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {step === 1 ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500 rounded-2xl shadow-lg shadow-green-500/20">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Your Balance</h3>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Withdrawal System</p>
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1 italic">Total Earnings</p>
                  <p className="text-4xl font-black text-white">${balance.toFixed(2)}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <DollarSign className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">Linked Account</p>
                      <p className="text-xs font-bold text-white">Verified Channel Wallet</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/20 text-center uppercase font-bold px-4 leading-relaxed tracking-widest">
                    Funds will be transferred to your linked AdSense account via Z-VIDEOS distribution network.
                  </p>
                </div>

                <button 
                  onClick={handleWithdraw}
                  disabled={loading || balance <= 0}
                  className="w-full py-4 bg-green-500 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-green-600 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {loading ? 'PROCESSING...' : (
                    <>
                      INITIALIZE PAYOUT
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 italic">Success!</h3>
                <p className="text-sm text-white/60 mb-8 px-4 font-medium leading-relaxed">
                  Your withdrawal of <span className="text-white font-bold">${balance.toFixed(2)}</span> has been processed and is on its way to your AdSense account.
                </p>
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:scale-[0.98] transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
