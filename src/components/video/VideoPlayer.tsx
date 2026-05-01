import React, { useState, useEffect } from 'react';
import { X, ThumbsUp, ThumbsDown, MessageSquare, Share2, Heart, DollarSign, UserPlus, Eye, Send, MoreHorizontal, Flag, ShieldCheck, Zap, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, updateDoc, increment, setDoc, serverTimestamp, collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../AuthContext';

interface Comment {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  createdAt: any;
}

interface VideoPlayerProps {
  videoId: string;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, onClose }) => {
  const { user } = useAuth();
  const [video, setVideo] = useState<any>(null);
  const [interaction, setInteraction] = useState<'like' | 'unlike' | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [submittingSub, setSubmittingSub] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'videos', videoId);
    
    // Increment view once on mount
    const incrementView = async () => {
      try {
        await updateDoc(docRef, { views: increment(1) });
      } catch (err) {
        console.warn("View increment failed:", err);
      }
    };
    incrementView();

    // Real-time listener for video data (likes, views, status)
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setVideo({ id: docSnap.id, ...data });
        
        // Revenue logic (runs once per session essentially or on data changes, but we check if we've processed revenue)
        // Here we just check for initial data load or shifts
        if (data.monetized && data.ownerId !== user?.uid) {
          // Logic for revenue injection (already mostly handled, just keeping consistent)
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `videos/${videoId}`);
    });

    // Check interaction & subscription
    const checkUserStatus = async () => {
      if (user) {
        try {
          const interId = `${user.uid}_${videoId}`;
          const interSnap = await getDoc(doc(db, 'interactions', interId));
          if (interSnap.exists()) {
            setInteraction(interSnap.data().type);
          }

          const videoSnap = await getDoc(docRef);
          if (videoSnap.exists()) {
            const data = videoSnap.data();
            const subId = `${user.uid}_${data.ownerId}`;
            const subSnap = await getDoc(doc(db, 'subscriptions', subId));
            setIsSubscribed(subSnap.exists() && subSnap.data().active !== false);
          }
        } catch (e) {
          console.warn("User status check failed");
        }
      }
    };
    checkUserStatus();

    return () => unsubscribe();
  }, [videoId, user]);

  useEffect(() => {
    const q = query(
      collection(db, 'videos', videoId, 'comments'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    }, (error) => {
      console.warn("Could not fetch comments:", error);
    });

    return unsubscribe;
  }, [videoId]);

  const handleInteraction = async (type: 'like' | 'unlike') => {
    if (!user) return;

    try {
      const interId = `${user.uid}_${videoId}`;
      const interRef = doc(db, 'interactions', interId);
      const videoRef = doc(db, 'videos', videoId);

      if (interaction === type) {
        await setDoc(interRef, { type: null, updatedAt: serverTimestamp() }, { merge: true });
        setInteraction(null);
        await updateDoc(videoRef, { [type === 'like' ? 'likesCount' : 'unlikesCount']: increment(-1) });
      } else {
        const prevType = interaction;
        await setDoc(interRef, {
          userId: user.uid,
          videoId: videoId,
          type: type,
          createdAt: interaction ? undefined : serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        setInteraction(type);
        
        const updates: any = { [type === 'like' ? 'likesCount' : 'unlikesCount']: increment(1) };
        if (prevType) {
          updates[prevType === 'like' ? 'likesCount' : 'unlikesCount'] = increment(-1);
        }
        await updateDoc(videoRef, updates);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `interactions/${user.uid}_${videoId}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'videos', videoId, 'comments'), {
        userId: user.uid,
        username: user.displayName || 'User',
        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        text: newComment,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!user || !video || submittingSub) return;
    setSubmittingSub(true);
    try {
      const subId = `${user.uid}_${video.ownerId}`;
      const subRef = doc(db, 'subscriptions', subId);
      const ownerRef = doc(db, 'users', video.ownerId);

      if (isSubscribed) {
        await updateDoc(subRef, { active: false, updatedAt: serverTimestamp() });
        await updateDoc(ownerRef, { subscribers: increment(-1) });
        setIsSubscribed(false);
      } else {
        await setDoc(subRef, {
          followerId: user.uid,
          targetId: video.ownerId,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        await updateDoc(ownerRef, { subscribers: increment(1) });
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error("Sub error:", err);
    } finally {
      setSubmittingSub(false);
    }
  };

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black flex flex-col lg:flex-row shadow-2xl overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 bg-black overflow-y-auto">
        <div className="relative aspect-video bg-black group sticky top-0 z-20">
          <video 
            src={video.videoUrl} 
            controls 
            autoPlay 
            muted
            className="w-full h-full object-contain"
          />
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-4 bg-black/80 text-white rounded-full z-30 hover:bg-orange-600 transition-all flex items-center gap-3 group shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/5 active:scale-90"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest pr-2">Back to Space</span>
          </button>
        </div>

        <div className="p-6 bg-[#0a0a0a]">
          <div className="max-w-4xl mx-auto pb-20">
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight uppercase group cursor-default">
              {video.title}
              <div className="h-1 w-12 bg-orange-600 mt-2 transition-all group-hover:w-24" />
            </h1>
            
            <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-6 text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-600" />
                  <span>{video.views.toLocaleString()} Watchers</span>
                </div>
                <span>•</span>
                <span>Live since {new Date(video.createdAt?.toDate?.() || video.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleInteraction('like')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${interaction === 'like' ? 'bg-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)]' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'}`}
                >
                  <ThumbsUp className={`w-4 h-4 ${interaction === 'like' ? 'fill-current' : ''}`} />
                  <span>{video.likesCount || 0}</span>
                </button>
                <button 
                  onClick={() => handleInteraction('unlike')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${interaction === 'unlike' ? 'bg-orange-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'}`}
                >
                  <ThumbsDown className={`w-4 h-4 ${interaction === 'unlike' ? 'fill-current' : ''}`} />
                  <span>{video.unlikesCount || 0}</span>
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest border border-white/5">
                  <Share2 className="w-4 h-4" />
                  <span>Relink</span>
                </button>
              </div>
            </div>
            
            <div className="mt-10 p-8 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-xl relative overflow-hidden group/creator">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <ShieldCheck className="w-32 h-32 text-orange-600" />
               </div>
               
               <div className="flex items-start gap-6 relative z-10">
                 <div className="w-16 h-16 rounded-[1.25rem] overflow-hidden border-2 border-orange-600/20 bg-black flex-shrink-0 group-hover/creator:scale-105 transition-transform">
                   <img src={video.ownerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.ownerId}`} alt="Owner" className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                   <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-white uppercase tracking-tighter">{video.ownerName}</h3>
                          <Zap className="w-4 h-4 text-orange-600 fill-current" />
                        </div>
                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mt-1">Verified Member • Partner</p>
                      </div>
                      <button 
                        onClick={handleToggleSubscribe}
                        disabled={submittingSub || user?.uid === video.ownerId}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 ${isSubscribed ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-500' : 'bg-white text-black hover:bg-orange-600 hover:text-white'}`}
                      >
                        {user?.uid === video.ownerId ? 'Your Profile' : isSubscribed ? 'Subscribed' : 'Subscribe'}
                      </button>
                   </div>
                   <p className="mt-4 text-white/50 leading-relaxed max-w-2xl text-xs font-medium italic">
                     {video.description || 'This creator prioritizes visual performance over textual details.'}
                   </p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full lg:w-[400px] bg-[#080808] border-l border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5 bg-black/40 backdrop-blur-md">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-orange-600" />
            Active Feed <span className="text-white/20 tabular-nums">({comments.length})</span>
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {comments.map((comment) => (
              <motion.div 
                key={comment.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-4 group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 overflow-hidden flex-shrink-0 group-hover:border-orange-600/50 transition-colors">
                  <img src={comment.avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{comment.username}</span>
                    <span className="text-[9px] text-white/20 font-bold italic">
                      {comment.createdAt?.toDate?.() ? new Date(comment.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed font-medium">{comment.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {comments.length === 0 && (
            <div className="py-20 text-center opacity-20">
               <MessageSquare className="w-12 h-12 mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest italic">Signal is silent</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-black border-t border-white/10">
          {user ? (
            <form onSubmit={handleAddComment} className="relative">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Say something bold..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-medium text-white focus:outline-none focus:border-orange-600 transition-all pr-12"
              />
              <button 
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-orange-600 hover:text-white transition-colors disabled:opacity-30"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <div className="p-4 bg-orange-600/10 border border-orange-600/20 rounded-2xl text-center">
               <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest italic">Sign in to interact</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
