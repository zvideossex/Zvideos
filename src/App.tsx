import { useState, useEffect } from 'react'
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
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth"
import { auth, provider } from './lib/firebase';

// AgeGate Component
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
      <div style={{ textAlign: 'center', padding: '20px', maxWidth: '500px' }}>
        <h1 style={{fontSize: '32px', marginBottom: '20px'}}>18+ Age Verification</h1>
        <p style={{marginBottom: '30px', fontSize: '16px', lineHeight: '1.6'}}>
          This website contains adult content. You must be 18 years or older to enter.
        </p>
        <button onClick={handleYes} style={{
          margin: '10px', padding: '12px 40px', fontSize: '16px',
          background: '#ea580c', border: 'none', color: 'white',
          borderRadius: '8px', cursor: 'pointer'
        }}>Yes, I'm 18+</button>
        <button onClick={handleNo} style={{
          margin: '10px', padding: '12px 40px', fontSize: '16px',
          background: '#333', border: 'none', color: 'white',
          borderRadius: '8px', cursor: 'pointer'
        }}>No, Exit</button>
      </div>
    </div>
  )
}

// Login/Signup Component
function LoginScreen() {
  const [isSignup, setIsSignup] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be 6+ characters')
      return
    }
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCred.user, { displayName: name })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'black', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{maxWidth: '400px', width: '100%'}}>
        <h1 style={{textAlign: 'center', fontSize: '36px', marginBottom: '30px', fontWeight: 'bold'}}>
          Z-VIDEOS
        </h1>

        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%', padding: '14px', fontSize: '16px',
            background: '#ea580c', border: 'none', color: 'white',
            borderRadius: '8px', cursor: 'pointer', marginBottom: '20px'
          }}
        >
          🚀 Continue with Gmail
        </button>

        <p style={{textAlign: 'center', margin: '20px 0', opacity: 0.5}}>OR</p>

        <form onSubmit={isSignup? handleEmailSignup : handleEmailLogin}>
          {isSignup && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', marginBottom: '12px',
                background: '#111', border: '1px solid #333', color: 'white',
                borderRadius: '8px', boxSizing: 'border-box'
              }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%', padding: '12px', marginBottom: '12px',
              background: '#111', border: '1px solid #333', color: 'white',
              borderRadius: '8px', boxSizing: 'border-box'
            }}
          />
          <input
            type="password"
            placeholder="Password - 6+ characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%', padding: '12px', marginBottom: '12px',
              background: '#111', border: '1px solid #333', color: 'white',
              borderRadius: '8px', boxSizing: 'border-box'
            }}
          />
          {error && <p style={{color: '#ef4444', fontSize: '14px', marginBottom: '10px'}}>{error}</p>}
          <button
            type="submit"
            style={{
              width: '100%', padding: '14px', fontSize: '16px',
              background: 'white', border: 'none', color: 'black',
              borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            {isSignup? 'Create Account' : 'Login'}
          </button>
        </form>

        <p style={{textAlign: 'center', marginTop: '20px', fontSize: '14px'}}>
          {isSignup? 'Already have account? ' : "Don't have account? "}
          <span
            onClick={() => {setIsSignup(!isSignup); setError('')}}
            style={{color: '#ea580c', cursor: 'pointer', textDecoration: 'underline'}}
          >
            {isSignup? 'Login' : 'Sign Up'}
          </span>
        </p>
        <p style={{textAlign: 'center', marginTop: '30px', fontSize: '12px', opacity: 0.4}}>
          Once you sign up, you'll stay logged in automatically
        </p>
      </div>
    </div>
  )
}

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
    const autoApprove = async () => {
      if (user && profile && profile.monetizationStatus!== 'approved') {
        try {
          await updateDoc(doc(db, 'users', user.uid), { monetizationStatus: 'approved' });
        } catch (e) { console.error(e); }
      }
    };
    autoApprove();
  }, [user, profile]);

  useEffect(() => {
    if (!user) { setLikedVideoIds([]); return; }
    const ikQuery = query(collection(db, 'interactions'), where('userId', '==', user.uid), where('type', '==', 'like'));
    const unsubscribe = onSnapshot(ikQuery, (snapshot) => {
      setLikedVideoIds(snapshot.docs.map(doc => doc.data().videoId));
    }, (error) => { handleFirestoreError(error, OperationType.LIST, 'interactions'); });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const handleNavCreator = () => setView('creator');
    const handleNavHome = () => { setView('home'); setCategory('home'); };
    const handleNavProfile = (e: any) => { setView('profile'); setSelectedProfileId(e.detail.uid); };
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
      const vids = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() } as VideoData));
      setVideos(vids);
      setLoading(false);
    }, (error) => { handleFirestoreError(error, OperationType.LIST, 'videos'); });
    return unsubscribe;
  }, []);

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.ownerName?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (category === 'trending') return true;
    if (category === 'creators') return true;
    if (category === 'history') {
      const history = JSON.parse(localStorage.getItem('video_history') || '[]');
      return history.includes(v.id);
    }
    if (category === 'liked') return likedVideoIds.includes(v.id);
    return true;
  });

  const displayVideos = [...filteredVideos].sort((a, b) => {
    if (category === 'trending') return (b.views || 0) - (a.views || 0);
    return 0;
  });

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-4">
        <Zap className="w-12 h-12 text-orange-600 animate-pulse fill-current" />
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  // লগইন না থাকলে LoginScreen দেখাও
  if (!user) {
    return (
      <>
        <AgeGate />
        <LoginScreen />
      </>
    );
  }

  if (view === 'creator') {
    return <CreatorDashboard onBack={() => setView('home')} />;
  }

  return (
    <>
      <AgeGate />
      <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-600/30">
        <Navbar onUploadClick={() => setIsUploadOpen(true)} onSearch={setSearchQuery} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} onSettingsClick={() => setIsSettingsOpen(true)} onCategoryChange={(c) => { setView('home'); setCategory(c); }} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={(v, pid) => { setView(v); if (v === 'home') setCategory('home'); if (v === 'profile' && pid) setSelectedProfileId(pid); }} onCategoryChange={(c) => { setView('home'); setCategory(c); }} onSettingsClick={() => setIsSettingsOpen(true)} onSupportClick={() => setIsSupportOpen(true)} currentView={view} currentCategory={category} user
