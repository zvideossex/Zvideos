
import React, { useRef, useState } from 'react';
import { Play, Heart, MessageSquare, MoreVertical, Eye, Trash2, Flag, Link2, Ban, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../AuthContext';
import { db } from '../../lib/firebase';
import { doc, deleteDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export interface VideoData {
  id: string;
  title: string;
  videoUrl: string; // নতুন: ভিডিও URL লাগবে প্রিভিউর জন্য
  thumbnailUrl: string;
  ownerId: string;
  ownerName?: string;
  ownerAvatar?: string;
  views: number;
  likesCount: number;
  is18Plus: boolean;
  createdAt: string;
  duration?: string;
  monetized?: boolean; // নতুন: PopAds চালু কিনা
}

export const VideoCard: React.FC<{
  video: VideoData;
  onClick: () => void;
  onCreatorClick?: (uid: string) => void;
}> = ({ video, onClick, onCreatorClick }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isOwner = user?.uid === video.ownerId;

  // 3 সেকেন্ড হোভার প্রিভিউ
  const startPreview = () => {
    if (!videoRef.current ||!video.videoUrl) return;
    setIsPlaying(true);
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});

    // 3 সেকেন্ড পর বন্ধ + ভিউ কাউন্ট
    timeoutRef.current = setTimeout(() => {
      stopPreview();
      // ভিউ কাউন্ট বাড়াও
      updateDoc(doc(db, 'videos', video.id), {
        views: increment(1)
      }).catch(() => {});
    }, 3000);
  };

  const stopPreview = () => {
    setIsPlaying(false);
    clearTimeout(timeoutRef.current);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // PopAds ট্রিগার - ভিডিওতে ক্লিক করলে
  const handleVideoClick = () => {
    if (video.monetized) {
      // PopAds Popunder ট্রিগার হবে এখানে
      // window._pop?.push(['triggerPop']);
    }
    onClick();
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('Please login to report content');
      return;
    }
    try {
      const reportId = `${user.uid}_${video.id}`;
      await setDoc(doc(db, 'reports', reportId), {
        userId: user.uid,
        videoId: video.id,
        reason: 'General Report',
        createdAt: new Date().toISOString()
      });
      alert('Content reported. Our team will review it.');
      setShowMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/video/${video.id}`);
    alert('Link copied to clipboard');
    setShowMenu(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDeleting) {
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 3000);
      return;
    }
    try {
      await deleteDoc(doc(db, 'videos', video.id));
      setShowMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  const wrapCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreatorClick) onCreatorClick(video.ownerId);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group cursor-pointer"
      onClick={handleVideoClick}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onTouchStart={startPreview}
      onTouchEnd={stopPreview}
    >
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/5">
        {/* থাম্বনেইল - প্রিভিউ না চললে দেখাবে */}
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=640&auto=format&fit=crop';
          }}
          className={`w-full h-full object-cover transition-all duration-300 ${isPlaying? 'opacity-0 scale-105' : 'opacity-100 group-hover:scale-105'}`}
        />

        {/* ভিডিও - হোভার/টাচে 3 সেকেন্ড চলবে */}
        <video
          ref={videoRef}
          src={video.videoUrl}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${isPlaying? 'opacity-100' : 'opacity-0'}`}
          muted
          playsInline
          preload="metadata"
        />

        {/* প্লে আইকন */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-black fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text- font-bold text-white">
          {video.duration || '12:44'}
        </div>

        {/* 18+ Badge */}
        {video.is18Plus && (
          <div className="absolute top-2 left-2 bg-red-600 px-2 py-0.5 rounded text- font-bold text-white uppercase tracking-tighter shadow-lg">
            18+
          </div>
        )}

        {/* Monetized Badge */}
        {video.monetized && (
          <div className="absolute top-2 right-2 bg-orange-600/90 px-2 py-0.5 rounded text- font-bold text-white uppercase tracking-tighter shadow-lg">
            AD
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <div onClick={wrapCreatorClick} className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0 border border-white/5 hover:border-orange-600 transition-all">
          <img src={video.ownerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.ownerId}`} alt={video.ownerName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-sm line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">
            {video.title}
          </h3>
          <p onClick={wrapCreatorClick} className="text-white/40 text-xs mt-1 font-medium hover:text-white transition-colors">
            {video.ownerName || 'Creator'}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-white/30 text- font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{video.views.toLocaleString()}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-orange-600" />
              <span>{video.likesCount || 0}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button className="text-white/30 hover:text-white p-1" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 bottom-full mb-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-1 z-50">
                  <button onClick={wrapCreatorClick} className="w-full text-left px-3 py-1.5 text- font-bold text-white/60 hover:bg-white/5 rounded-lg uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-orange-600" /> Visit Creator
                  </button>
                  <button onClick={handleCopyLink} className="w-full text-left px-3 py-1.5 text- font-bold text-white/60 hover:bg-white/5 rounded-lg uppercase tracking-widest flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5" /> Copy Link
                  </button>
                  <button onClick={handleReport} className="w-full text-left px-3 py-1.5 text- font-bold text-white/60 hover:bg-white/5 rounded-lg uppercase tracking-widest flex items-center gap-2">
                    <Flag className="w-3.5 h-3.5 text-yellow-500" /> Report
                  </button>
                  {isOwner && (
                    <button onClick={handleDelete} className={`w-full text-left px-3 py-1.5 text- font-bold rounded-lg uppercase tracking-widest flex items-center gap-2 transition-colors border-t border-white/5 mt-1 pt-2 ${isDeleting? 'bg-red-500 text-white' : 'text-red-400 hover:bg-red-400/10'}`}>
                      <Trash2 className="w-3.5 h-3.5" /> {isDeleting? 'Confirm Delete' : 'Delete'}
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
