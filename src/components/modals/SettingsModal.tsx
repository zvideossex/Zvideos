import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestoreErrorHandler';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.username) {
      setNewUsername(profile.username);
    }
  }, [profile?.username]);

  const handleUpdateProfile = async () => {
    if (!user || !newUsername.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        username: newUsername.trim()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-white/40 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-orange-600 rounded-2xl shadow-lg shadow-orange-600/20">
                  <Sliders className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Profile Control</h3>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">User ID: {user?.uid.slice(0, 8)}...</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2 italic">Platform Handle</label>
                  <input 
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm font-bold focus:outline-none focus:border-orange-600 transition-all placeholder:text-white/10"
                    placeholder="Enter your creator name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                      <span className="text-[10px] font-black text-white uppercase italic">Verified</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">Member Since</p>
                    <span className="text-[10px] font-black text-white uppercase italic">May 2026</span>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-blue-600/10 to-transparent rounded-2xl border border-blue-600/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-[1.7]">
                    <Sliders className="w-12 h-12 text-blue-500" />
                  </div>
                  <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Secure Revenue Node
                  </div>
                  <p className="text-xs font-bold text-white tracking-tight">Status: Active & Secure</p>
                  <p className="text-[10px] text-white/40 mt-1 uppercase font-bold">Encrypted Payouts Enabled</p>
                </div>

              <button 
                onClick={handleUpdateProfile}
                disabled={saving}
                className="w-full py-4 bg-orange-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50"
              >
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
