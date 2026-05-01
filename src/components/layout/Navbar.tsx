import React, { useState } from 'react';
import { Search, Upload, User, LogOut, Menu, Zap, Mail, LayoutDashboard, CheckCircle2, Sliders, X, MoreVertical, TrendingUp, History, ThumbsUp, Users } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { loginWithGoogle, auth, db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';

export const Navbar: React.FC<{ 
  onUploadClick: () => void; 
  onSearch: (q: string) => void;
  onMenuClick: () => void;
  onSettingsClick: () => void;
  onCategoryChange?: (category: any) => void;
}> = ({ onUploadClick, onSearch, onMenuClick, onSettingsClick, onCategoryChange }) => {
  const { user, profile } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-black border-b border-white/10 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-white/5 rounded-full lg:hidden"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
        <div 
          onClick={() => window.dispatchEvent(new CustomEvent('nav-home'))}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white hidden sm:block">Z-VIDEOS</span>
          <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">18+</span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8 relative group">
        <input
          type="text"
          placeholder="Explore Z-VIDEOS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-4 pr-12 text-white focus:outline-none focus:border-orange-600/50 transition-all placeholder:text-white/30"
        />
        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
          <Search className="w-5 h-5" />
        </button>
      </form>

      <div className="flex items-center gap-2 sm:gap-4">
        {user ? (
          <>
            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-2 z-50 text-left"
                    >
                      <button 
                        onClick={() => {
                          if (onCategoryChange) onCategoryChange('trending');
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5 rounded-lg uppercase tracking-widest transition-colors"
                      >
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        Trending
                      </button>
                      <button 
                        onClick={() => {
                          if (onCategoryChange) onCategoryChange('creators');
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5 rounded-lg uppercase tracking-widest transition-colors"
                      >
                        <Users className="w-4 h-4 text-orange-600" />
                        Creators
                      </button>
                      <button 
                        onClick={() => {
                          if (onCategoryChange) onCategoryChange('history');
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5 rounded-lg uppercase tracking-widest transition-colors"
                      >
                        <History className="w-4 h-4 text-orange-600" />
                        History
                      </button>
                      <button 
                        onClick={() => {
                          if (onCategoryChange) onCategoryChange('liked');
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5 rounded-lg uppercase tracking-widest transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4 text-orange-600" />
                        Liked Videos
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={onUploadClick}
              className="flex items-center justify-center w-10 h-10 bg-white text-black rounded-full sm:hidden"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button 
              onClick={onUploadClick}
              className="hidden sm:flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded-full font-medium hover:bg-white/90 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="w-9 h-9 rounded-full overflow-hidden border border-white/20 hover:border-orange-600 transition-colors"
              >
                <img src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Profile" className="w-full h-full object-cover" />
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium truncate">{profile?.username}</p>
                        <CheckCircle2 className="w-3 h-3 text-blue-500 fill-current" />
                      </div>
                      <p className="text-white/40 text-xs truncate">{user.email}</p>
                      <div className="mt-2 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[9px] font-black text-green-500 uppercase tracking-widest w-fit">
                        Verified 18+ Access
                      </div>
                    </div>
                    <div className="py-2">
                       <div className="px-4 py-2 flex justify-between items-center bg-orange-600/10 rounded-lg mb-2 mx-2">
                        <span className="text-xs text-white/60">Earnings</span>
                        <span className="text-sm font-bold text-orange-600">${profile?.earnings?.toFixed(2) || '0.00'}</span>
                      </div>
                      {profile?.isCreator && (
                        <button 
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('nav-creator'));
                            setShowProfile(false);
                          }}
                          className="w-full text-left px-4 py-2 text-orange-500 hover:bg-orange-500/5 rounded-lg text-sm flex items-center gap-3"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Creator Studio
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          onSettingsClick();
                          setShowProfile(false);
                        }}
                        className="w-full text-left px-4 py-2 text-white/70 hover:bg-white/5 rounded-lg text-sm flex items-center gap-3"
                      >
                        <User className="w-4 h-4" />
                        Profile Settings
                      </button>
                      <button 
                        onClick={() => auth.signOut()}
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-400/5 rounded-lg text-sm flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <button 
            onClick={loginWithGoogle}
            className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-white/90 transition-all active:scale-95"
          >
            <Mail className="w-4 h-4" />
            <span>Login with Gmail</span>
          </button>
        )}
      </div>

    </nav>
  );
};
