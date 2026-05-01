import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Users, Eye, Heart, MessageSquare, ShieldCheck, Zap, UserPlus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, onSnapshot, updateDoc, increment, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { VideoCard, VideoData } from './video/VideoCard';
import { useAuth } from '../AuthContext';

interface ProfileViewProps {
  userId: string;
  onBack: () => void;
  onVideoClick: (videoId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId, onBack, onVideoClick }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [submittingSub, setSubmittingSub] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = user?.uid === userId;

  useEffect(() => {
    const unsubProfile = onSnapshot(doc(db, 'users', userId), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      }
      setLoading(false);
    });

    const vQuery = query(
      collection(db, 'videos'),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const unsubVideos = onSnapshot(vQuery, (snap) => {
      setVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData)));
    });

    if (user) {
      const subId = `${user.uid}_${userId}`;
      const unsubSub = onSnapshot(doc(db, 'subscriptions', subId), (snap) => {
        setIsSubscribed(snap.exists() && snap.data().active !== false);
      });
      return () => {
        unsubProfile();
        unsubVideos();
        unsubSub();
      };
    }

    return () => {
      unsubProfile();
      unsubVideos();
    };
  }, [userId, user]);

  const handleToggleSubscribe = async () => {
    if (!user || isOwnProfile || submittingSub) return;
    setSubmittingSub(true);
    try {
      const subId = `${user.uid}_${userId}`;
      const subRef = doc(db, 'subscriptions', subId);
      const ownerRef = doc(db, 'users', userId);

      if (isSubscribed) {
        await updateDoc(subRef, { active: false, updatedAt: serverTimestamp() });
        await updateDoc(ownerRef, { subscribers: increment(-1) });
      } else {
        await setDoc(subRef, {
          followerId: user.uid,
          targetId: userId,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        await updateDoc(ownerRef, { subscribers: increment(1) });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSub(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
  const totalLikes = videos.reduce((acc, v) => acc + (v.likesCount || 0), 0);

  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Discover</span>
        </button>
        {isOwnProfile && (
           <div className="flex items-center gap-2 px-4 py-2 bg-orange-600/10 border border-orange-600/20 rounded-full">
             <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Your Private Space</span>
           </div>
        )}
      </div>

      <div className="relative">
        <div className="h-48 rounded-[2.5rem] bg-gradient-to-br from-orange-600 to-indigo-900 border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
             <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-[100px]" />
             <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-orange-600 rounded-full blur-[120px]" />
          </div>
        </div>
        <div className="px-8 -mt-16 flex flex-col md:flex-row items-end gap-6 relative z-10">
          <div className="w-32 h-32 rounded-[2rem] border-4 border-black overflow-hidden bg-black shadow-2xl relative group">
            <img src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-white tracking-tighter">{profile.username}</h1>
              {profile.monetizationStatus === 'approved' && (
                 <div className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-black rounded uppercase tracking-widest flex items-center gap-1">
                   <Zap className="w-3 h-3 fill-current" />
                   PARTNER
                 </div>
              )}
            </div>
            <p className="text-white/40 mt-1 font-medium italic">{profile.bio || 'This creator hasn\'t set a bio yet.'}</p>
            {!isOwnProfile && (
              <button 
                onClick={handleToggleSubscribe}
                disabled={submittingSub}
                className={`mt-4 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 ${isSubscribed ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-500' : 'bg-white text-black hover:bg-orange-600 hover:text-white'}`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>
          <div className="flex gap-4 pb-2">
             <div className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-center backdrop-blur-md">
                <p className="text-xl font-black text-white">{(profile.subscribers || 0).toLocaleString()}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Fans</p>
             </div>
             <div className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-center backdrop-blur-md">
                <p className="text-xl font-black text-white">{videos.length}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Clips</p>
             </div>
             <div className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-center backdrop-blur-md">
                <p className="text-xl font-black text-white">{totalViews.toLocaleString()}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Views</p>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
           <h2 className="text-lg font-black text-white uppercase tracking-tight">
             {isOwnProfile ? 'Manage Your Content' : 'Uploaded Content'}
           </h2>
           {isOwnProfile && (
             <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest italic">Only you can see management options</p>
           )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          <AnimatePresence>
            {videos.map((video) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                onClick={() => onVideoClick(video.id)} 
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {videos.length === 0 && (
        <div className="py-20 text-center bg-white/5 rounded-[2.5rem] border border-white/5">
           <p className="text-white/40 font-bold italic">No content available for this creator yet.</p>
        </div>
      )}
    </div>
  );
};
