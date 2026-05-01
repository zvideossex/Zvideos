import React from 'react';
import { Home, TrendingUp, Users, DollarSign, History, ThumbsUp, Settings, HelpCircle, ShieldAlert, X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const NavItem: React.FC<{ 
  icon: any; 
  label: string; 
  active?: boolean; 
  onClick?: () => void;
}> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${active ? 'bg-orange-600 text-white font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'group-hover:text-orange-600'} transition-colors`} />
    <span className="text-sm">{label}</span>
  </button>
);

export const Sidebar: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  onNavigate: (view: 'home' | 'creator' | 'profile', profileId?: string) => void;
  onCategoryChange: (category: 'home' | 'trending' | 'creators' | 'history' | 'liked') => void;
  onSettingsClick: () => void;
  onSupportClick: () => void;
  currentView: string;
  currentCategory: string;
  userId?: string;
}> = ({ isOpen, onClose, onNavigate, onCategoryChange, onSettingsClick, onSupportClick, currentView, currentCategory, userId }) => {
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-black border-r border-white/5 p-4 overflow-y-auto z-[70] transition-transform duration-300 transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:top-16`}>
        <div className="flex items-center justify-between lg:hidden mb-6 mt-2">
          <span className="text-orange-600 font-black tracking-tighter text-xl italic">Z-VIDEOS</span>
          <button onClick={onClose} className="p-2 text-white/40">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-1">
          <NavItem 
            icon={Home} 
            label="Home" 
            active={currentView === 'home' && currentCategory === 'home'} 
            onClick={() => { onCategoryChange('home'); onClose(); }}
          />
          <NavItem 
            icon={UserPlus} 
            label="My Profile" 
            active={currentView === 'profile'}
            onClick={() => { 
              if (userId) {
                onNavigate('profile', userId);
              } else {
                // Trigger login if not signed in? Navbar already handles this
              }
              onClose(); 
            }}
          />
          <NavItem 
            icon={TrendingUp} 
            label="Trending" 
            active={currentView === 'home' && currentCategory === 'trending'}
            onClick={() => { onCategoryChange('trending'); onClose(); }}
          />
          <NavItem 
            icon={Users} 
            label="Creators" 
            active={currentView === 'home' && currentCategory === 'creators'}
            onClick={() => { onCategoryChange('creators'); onClose(); }}
          />
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 space-y-1">
          <h3 className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Library</h3>
          <NavItem 
            icon={History} 
            label="History" 
            active={currentView === 'home' && currentCategory === 'history'}
            onClick={() => { onCategoryChange('history'); onClose(); }}
          />
          <NavItem 
            icon={ThumbsUp} 
            label="Liked Videos" 
            active={currentView === 'home' && currentCategory === 'liked'}
            onClick={() => { onCategoryChange('liked'); onClose(); }}
          />
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 space-y-1">
          <h3 className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Monetization</h3>
          <NavItem 
            icon={DollarSign} 
            label="Earnings" 
            active={currentView === 'creator'}
            onClick={() => { onNavigate('creator'); onClose(); }}
          />
          <div className="px-4 py-3 bg-green-500/10 rounded-xl mt-2 border border-green-500/20">
            <p className="text-[10px] text-green-500/60 mb-2 font-black uppercase tracking-widest">Creator Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-black text-green-500 uppercase">Active & Verified</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 space-y-1">
          <NavItem 
            icon={Settings} 
            label="Settings" 
            active={false}
            onClick={() => { onSettingsClick(); onClose(); }}
          />
          <NavItem 
            icon={HelpCircle} 
            label="Help & Support" 
            active={false}
            onClick={() => { onSupportClick(); onClose(); }}
          />
          <NavItem 
            icon={ShieldAlert} 
            label="18+ Information" 
            active={false}
            onClick={() => { /* Info modal or page */ onClose(); }}
          />
        </div>

        <div className="mt-auto pt-8">
          <div className="p-4 bg-orange-600/10 border border-orange-600/20 rounded-2xl">
            <p className="text-xs text-white/60 leading-relaxed font-medium">
              Join the elite creators community and start earning from your content today.
            </p>
            <button 
              onClick={() => { onNavigate('creator'); onClose(); }}
              className="mt-3 w-full py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Become a Creator
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
