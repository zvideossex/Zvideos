import { useState, useEffect } from 'react'

function AgeGate() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const ageVerified = localStorage.getItem('ageVerified')
    if (!ageVerified) setShow(true)
  }, [])

  const handleYes = () => {
    localStorage.setItem('ageVerified', 'true')
    setShow(false)
  }

  const handleNo = () => {
    window.location.href = 'https://www.google.com'
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: 'white'
    }}>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1>18+ Age Verification</h1>
        <p>This website contains adult content. Are you 18 or older?</p>
        <button onClick={handleYes} style={{margin: '10px', padding: '10px 30px'}}>Yes, I'm 18+</button>
        <button onClick={handleNo} style={{margin: '10px', padding: '10px 30px'}}>No</button>
      </div>
    </div>
  )
}
// তারপর তোমার App ফাংশনের return এর ভিতরে একদম উপরে <AgeGate /> বসায় দাও
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { VideoCard, VideoData } from './components/video/VideoCard';
import { VideoUpload } from './components/video/VideoUpload';
import { VideoPlayer } from './components/video/VideoPlayer';
import { CreatorDashboard } from './components/creator/CreatorDashboard';
import { ProfileView } from './components/ProfileView';
import { AuthProvider, useAuth } from './AuthContext';
import { collection, query, orderBy, onSnapshot, limit, where, updateDoc, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ShieldCheck, Zap } from 'lucide-react';

import { SettingsModal } from './components/modals/SettingsModal';
import { SupportModal } from './components/modals/SupportModal';

function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'home' | 'creator' | 'profile'>('home');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [category, setCategory] = useState<'home' | 'trending' | 'creators' | 'history' | 'liked'>('home');
  const [likedVideoIds, setLikedVideoIds] = useState<string[]>([]);

  useEffect(() => {
    // Auto-approve monetization for everyone
    const autoApprove = async () => {
      if (user && profile && profile.monetizationStatus !== 'approved') {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            monetizationStatus: 'approved'
          });
        } catch (e) {
          console.error(e);
        }
      }
    };
    autoApprove();
  }, [user, profile]);

  useEffect(() => {
    if (!user) {
      setLikedVideoIds([]);
      return;
    }
    const ikQuery = query(collection(db, 'interactions'), where('userId', '==', user.uid), where('type', '==', 'like'));
    const unsubscribe = onSnapshot(ikQuery, (snapshot) => {
      setLikedVideoIds(snapshot.docs.map(doc => doc.data().videoId));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'interactions');
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const handleNavCreator = () => setView('creator');
    const handleNavHome = () => {
      setView('home');
      setCategory('home');
    };
    const handleNavProfile = (e: any) => {
      setView('profile');
      setSelectedProfileId(e.detail.uid);
    };
    window.addEventListener('nav-creator', handleNavCreator);
    window.addEventListener('nav-home', handleNavHome);
    window.addEventListener('nav-profile', handleNavProfile as any);
    return () => {
      window.removeEventListener('nav-creator', handleNavCreator);
      window.removeEventListener('nav-home', handleNavHome);
      window.removeEventListener('nav-profile', handleNavProfile as any);
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData));
      setVideos(vids);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'videos');
    });
    return unsubscribe;
  }, []);

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.ownerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (category === 'trending') return true; // Will sort instead
    if (category === 'creators') return true; 
    if (category === 'history') {
      const history = JSON.parse(localStorage.getItem('video_history') || '[]');
      return history.includes(v.id);
    }
    if (category === 'liked') return likedVideoIds.includes(v.id);
    
    return true;
  });

  const displayVideos = [...filteredVideos].sort((a, b) => {
    if (category === 'trending') {
      return (b.views || 0) - (a.views || 0);
    }
    return 0; // Keep original order (desc by createdAt)
  });

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-4">
        <Zap className="w-12 h-12 text-orange-600 animate-pulse fill-current" />
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  if (view === 'creator') {
    return <CreatorDashboard onBack={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-600/30">
      <Navbar 
        onUploadClick={() => setIsUploadOpen(true)} 
        onSearch={setSearchQuery} 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onCategoryChange={(c) => {
          setView('home');
          setCategory(c);
        }}
      />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={(v, pid) => {
          setView(v);
          if (v === 'home') setCategory('home');
          if (v === 'profile' && pid) setSelectedProfileId(pid);
        }}
        onCategoryChange={(c) => {
          setView('home');
          setCategory(c);
        }}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onSupportClick={() => setIsSupportOpen(true)}
        currentView={view}
        currentCategory={category}
        userId={user?.uid}
      />
      
      <main className="lg:ml-64 pt-24 px-4 sm:px-8 pb-12">
        <header className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-br from-orange-600/10 to-transparent p-8 rounded-3xl border border-orange-600/20 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-1000">
              <Zap className="w-64 h-64 text-orange-600" />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-white">
                Z-VIDEOS is <span className="text-orange-600">waiting.</span>
              </h2>
              <p className="text-white/40 max-w-md font-medium leading-relaxed">
                Discover exclusive content from the world's most daring creators. Secure, premium, and strictly for those who know what they want.
              </p>

            </div>
            <div className="relative z-10 flex gap-4">
              <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 min-w-[140px] text-center">
                <p className="text-2xl font-black text-white">{videos.length}</p>
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-1">Live Clips</p>
              </div>
              <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 min-w-[140px] text-center">
                <p className="text-2xl font-black text-white">
                  {videos.reduce((acc, v) => acc + (v.views || 0), 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-1">Global Views</p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-white/5 rounded-2xl mb-4" />
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                  <div className="space-y-2 flex-1 pt-1">
                    <div className="h-4 w-full bg-white/5 rounded" />
                    <div className="h-3 w-1/2 bg-white/5 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : view === 'profile' && selectedProfileId ? (
          <ProfileView 
            userId={selectedProfileId} 
            onBack={() => setView('home')} 
            onVideoClick={(id) => setSelectedVideoId(id)}
          />
        ) : displayVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            <AnimatePresence>
              {displayVideos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  onClick={() => {
                    setSelectedVideoId(video.id);
                    const history = JSON.parse(localStorage.getItem('video_history') || '[]');
                    if (!history.includes(video.id)) {
                      localStorage.setItem('video_history', JSON.stringify([video.id, ...history].slice(0, 50)));
                    }
                  }}
                  onCreatorClick={(uid) => {
                    setSelectedProfileId(uid);
                    setView('profile');
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="w-10 h-10 text-white/10" />
            </div>
            <h3 className="text-xl font-bold text-white">No content found</h3>
            <p className="text-white/40 mt-2 max-w-xs">Try adjusting your search or upload your own 18+ content to start the vault.</p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {isUploadOpen && (
          <VideoUpload 
            isOpen={isUploadOpen} 
            onClose={() => setIsUploadOpen(false)} 
            onComplete={() => {}} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedVideoId && (
          <VideoPlayer 
            videoId={selectedVideoId} 
            onClose={() => setSelectedVideoId(null)} 
          />
        )}
      </AnimatePresence>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
