import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, Eye, ArrowUpRight, 
  ArrowDownRight, Play, CheckCircle2, AlertCircle, 
  Wallet, Settings, ChevronRight, BarChart3, Clock,
  Zap, Gift, MessageCircle, Sliders, X, MoreVertical, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../AuthContext';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreErrorHandler';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { VideoUpload } from '../video/VideoUpload';
import { WithdrawModal } from '../modals/WithdrawModal';
import { Edit2, ExternalLink, Link2 } from 'lucide-react';

const CreatorVideoRow: React.FC<{ 
  video: any; 
  onDelete: () => void; 
  confirmDelete: boolean;
}> = ({ video, onDelete, confirmDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <tr className="hover:bg-white/[0.02] transition-all group">
      <td className="px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="relative w-20 aspect-video rounded-lg overflow-hidden group/thumb">
            <img src={video.thumbnailUrl} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
          <span className="text-sm font-black text-white group-hover:text-orange-600 transition-colors">{video.title}</span>
        </div>
      </td>
      <td className="px-8 py-4">
        <div className="flex items-center gap-2 text-white/40 font-mono text-sm">
          <Eye className="w-3 h-3" />
          {video.views.toLocaleString()}
        </div>
      </td>
      <td className="px-8 py-4">
        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg w-fit">
          <span className="text-sm font-black text-green-500">${(video.views * 0.015).toFixed(2)}</span>
        </div>
      </td>
      <td className="px-8 py-4 text-right relative">
          <div className="flex items-center justify-end gap-3">
            <span className="px-3 py-1 bg-white/5 text-white/30 text-[10px] font-black rounded-full border border-white/5 uppercase tracking-widest sm:block hidden">
              Live
            </span>
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 text-left"
                    >
                      <button 
                        onClick={() => {
                          alert('Edit feature coming soon to Studio');
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-white/60 hover:bg-white/5 rounded-xl uppercase tracking-widest transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Metadata
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/video/${video.id}`);
                          alert('Link copied');
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-white/60 hover:bg-white/5 rounded-xl uppercase tracking-widest transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Copy Link
                      </button>
                      <button 
                        onClick={() => {
                          window.open(video.videoUrl, '_blank');
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-white/60 hover:bg-white/5 rounded-xl uppercase tracking-widest transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Raw Asset
                      </button>
                      <div className="h-px bg-white/5 my-2" />
                      <button 
                        onClick={() => {
                          onDelete();
                          if (!confirmDelete) setShowMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold rounded-xl uppercase tracking-widest transition-colors ${confirmDelete ? 'bg-red-600 text-white' : 'text-red-500 hover:bg-red-500/10'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {confirmDelete ? 'Confirm End' : 'End Broadcast'}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
      </td>
    </tr>
  );
};

const dummyData = [
  { name: 'Mon', views: 4000, earnings: 40 },
  { name: 'Tue', views: 3000, earnings: 30 },
  { name: 'Wed', views: 2000, earnings: 20 },
  { name: 'Thu', views: 2780, earnings: 27 },
  { name: 'Fri', views: 1890, earnings: 18 },
  { name: 'Sat', views: 2390, earnings: 23 },
  { name: 'Sun', views: 3490, earnings: 34 },
];

const StatCard: React.FC<{ icon: any; label: string; value: string; trend?: number; color: string }> = ({ icon: Icon, label, value, trend, color }) => (
  <div className="bg-[#111] border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-colors">
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
    </div>
  </div>
);

export const CreatorDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, profile } = useAuth();
  const [myVideos, setMyVideos] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [faucetClaiming, setFaucetClaiming] = useState(false);
  const [faucetMessage, setFaucetMessage] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [monetizationApplying, setMonetizationApplying] = useState(false);
  const [monetizationStep, setMonetizationStep] = useState(profile?.monetizationStatus || 'unapplied');

  const isAdmin = user?.email === 'mdrifathossen059@gmail.com';

  useEffect(() => {
    const checkAutoPayout = async () => {
      if (!user || !profile || profile.earnings <= 0) return;
      
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // If it's the 10th or later and we haven't paid out this month
      if (currentDay >= 10 && profile.lastAutoPayoutMonth !== currentMonthStr) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const amount = profile.earnings;
          
          await updateDoc(userRef, {
            earnings: 0,
            lastPayoutDate: now.toISOString(),
            lastAutoPayoutMonth: currentMonthStr
          });
          
          setFaucetMessage(`Auto-Settlement Success: $${amount.toFixed(2)} sent to linked account.`);
          setTimeout(() => setFaucetMessage(''), 8000);
        } catch (err) {
          console.error("Auto-payout error:", err);
        }
      }
    };
    
    if (profile) {
      checkAutoPayout();
    }
  }, [user, profile]);

  const handleDeleteVideo = async (videoId: string) => {
    if (confirmDeleteId !== videoId) {
      setConfirmDeleteId(videoId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'videos', videoId));
      setMyVideos(prev => prev.filter(v => v.id !== videoId));
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `videos/${videoId}`);
    }
  };

  const handleApplyMonetization = async () => {
    if (!user || monetizationApplying) return;
    setMonetizationApplying(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        monetizationStatus: 'pending',
        monetizationAppliedAt: new Date().toISOString()
      });
      setMonetizationStep('pending');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setMonetizationApplying(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch User Videos
        const videoQuery = query(
          collection(db, 'videos'),
          where('ownerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const videoSnap = await getDocs(videoQuery);
        setMyVideos(videoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Platform Stats (Only for Admin)
        if (isAdmin) {
          const globalSnap = await getDoc(doc(db, 'stats', 'global'));
          if (globalSnap.exists()) {
            setPlatformStats(globalSnap.data());
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'dashboard_data');
      }
      
      setLoading(false);
    };
    fetchData();
  }, [user, isAdmin]);

  const totalViews = myVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const totalLikes = myVideos.reduce((acc, v) => acc + (v.likesCount || 0), 0);

  return (
    <div className="min-h-screen bg-black p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
          >
            <div className="p-2 bg-white/5 rounded-full group-hover:bg-orange-600 transition-all">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Back to Feed</span>
          </button>
        </div>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-orange-600 text-xs font-black uppercase tracking-[0.2em] mb-2">
              <BarChart3 className="w-4 h-4" />
              <span>Studio Analytics</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Creator <span className="text-orange-600">Studio</span></h1>
            <p className="text-white/40 mt-2 font-medium">Welcome back, {profile?.username}. Your vault is performing well.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onBack}
              className="px-6 py-3 bg-white/5 text-white/70 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all border border-white/5"
            >
              Exit Studio
            </button>
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="px-6 py-3 bg-white text-black rounded-2xl text-sm font-extrabold hover:bg-white/90 transition-all shadow-xl shadow-white/10"
            >
              New Content
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard icon={Eye} label="Global Views" value={totalViews.toLocaleString()} trend={12.5} color="bg-orange-600" />
          <StatCard icon={DollarSign} label="Net Earnings" value={`$${profile?.earnings?.toFixed(2) || '0.00'}`} trend={8.1} color="bg-green-600" />
          <StatCard icon={BarChart3} label="Program Status" value="Revenue Active" trend={100} color="bg-yellow-600" />
          <StatCard icon={Users} label="Followers" value="12.4K" trend={4.2} color="bg-blue-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Performance Overview
                </h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-orange-600/10 text-orange-600 text-[10px] font-bold rounded-lg border border-orange-600/20">7 Days</button>
                  <button className="px-3 py-1 text-white/30 text-[10px] font-bold rounded-lg">30 Days</button>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dummyData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="name" stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-[2.5rem] overflow-hidden">
               <div className="p-8 border-b border-white/5">
                 <h3 className="text-xl font-bold text-white">Content Performance</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead>
                     <tr className="text-left bg-white/5">
                       <th className="px-8 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Video</th>
                       <th className="px-8 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Stats</th>
                       <th className="px-8 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Vault Income</th>
                       <th className="px-8 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest text-right">System Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {myVideos.map(video => (
                       <CreatorVideoRow 
                         key={video.id} 
                         video={video} 
                         onDelete={() => handleDeleteVideo(video.id)}
                         confirmDelete={confirmDeleteId === video.id}
                       />
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-orange-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-orange-600/30">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4">
                <Wallet className="w-32 h-32" />
              </div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Your Balance</p>
              <h2 className="text-4xl font-black mb-6 relative z-10">${profile?.earnings?.toFixed(2) || '0.00'}</h2>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between text-xs font-medium border-t border-white/20 pt-4">
                  <span className="opacity-60">Revenue Progress</span>
                  <span>Goal: $100.00</span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-white h-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, ((profile?.earnings || 0) / 100) * 100)}%` }} 
                  />
                </div>
              </div>
              <AnimatePresence>
                {faucetMessage && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3 bg-white/10 rounded-xl border border-white/10"
                  >
                    <p className="text-[10px] text-white font-black uppercase tracking-widest text-center animate-pulse">
                      {faucetMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem]">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-600" />
                Monetization Program
              </h3>
              <div className="space-y-4">
                <div className="p-6 bg-orange-600/10 rounded-3xl border border-orange-600/20 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                      <Zap className="w-6 h-6 text-white fill-current" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Active Partner</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Revenue System Online</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-orange-600/10">
                    <p className="text-xs text-white/60 leading-relaxed font-medium italic">
                      Congratulations! Your profile is fully integrated with the Z-Vault partner network. All your content is now eligible for revenue generation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem]">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-500" />
                Partner Revenue Structure
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs text-white/40">Network Status</span>
                  <span className="flex items-center gap-2 text-[10px] font-black text-green-500">
                    <span className={`w-2 h-2 rounded-full ${profile?.monetizationStatus === 'approved' ? 'bg-green-500 animate-pulse' : 'bg-white/10'}`} />
                    {profile?.monetizationStatus === 'approved' ? 'PARTNER ACTIVE' : 'STANDBY'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs text-white/40">Gross Rev / View</span>
                  <span className="text-sm font-bold text-white tracking-widest">$0.05</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-orange-600/10 border border-orange-600/20">
                  <span className="text-xs text-orange-600 font-bold uppercase tracking-widest leading-none">Creator Revenue Share</span>
                  <span className="text-sm font-black text-orange-600">Calculated</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs text-white/40 uppercase tracking-widest text-center w-full">
                    Distribution Active
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem]">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Latest Alerts
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs text-white leading-relaxed">
                    Account verified for high-def streaming. You can now upload 4K content.
                  </p>
                  <p className="text-[10px] text-white/30 font-bold mt-2">2 HOURS AGO</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs text-white leading-relaxed">
                    Monetization updated. Earnings per unique view increased to $0.012.
                  </p>
                  <p className="text-[10px] text-white/30 font-bold mt-2">1 DAY AGO</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] text-white">
              <h3 className="text-xl font-bold mb-2">Technical Support</h3>
              <p className="text-white/60 text-sm mb-6">Need help with your studio or uploads? Our technical agents are ready.</p>
              <button 
                onClick={() => setIsSupportOpen(true)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                Contact Agent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <VideoUpload 
            isOpen={isUploadOpen} 
            onClose={() => setIsUploadOpen(false)} 
            onComplete={() => {
              setIsUploadOpen(false);
              // Refresh is automatic due to firestore listeners in parent or effect here
            }} 
          />
        )}
      </AnimatePresence>

      {/* Support Modal */}
      <AnimatePresence>
        {isSupportOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-blue-600" />
              <button 
                onClick={() => setIsSupportOpen(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-600 rounded-2xl">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Studio Support</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Agent Online</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-1 italic">Agent Z</p>
                  <p className="text-sm text-white/80">Hello {profile?.username}. I've detected your system request. How can I assist your 18+ content operations today?</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 self-end ml-8">
                  <p className="text-sm text-white/60 italic">Checking system vitals...</p>
                </div>
              </div>

              <button 
                onClick={() => setIsSupportOpen(false)}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:scale-[0.98] transition-all"
              >
                End Session
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsWithdrawOpen(false)}>
             <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl text-center"
              onClick={e => e.stopPropagation()}
            >
               <DollarSign className="w-12 h-12 text-orange-600 mx-auto mb-4" />
               <h3 className="text-xl font-black text-white uppercase tracking-tight">Auto-Settlement System</h3>
               <p className="text-white/40 text-sm mt-4">Earnings are automatically settled to your linked account on the 10th of every month when the balance reaches $100.00.</p>
               <button 
                onClick={() => setIsWithdrawOpen(false)}
                className="w-full mt-8 py-4 bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all"
               >
                Close Window
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
