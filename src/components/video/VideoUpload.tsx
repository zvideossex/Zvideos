import React, { useState, useRef } from 'react';
import { X, Loader2, Play, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../AuthContext';

export const VideoUpload: React.FC<{ isOpen: boolean; onClose: () => void; onComplete: () => void }> = ({ isOpen, onClose, onComplete }) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [generatingThumb, setGeneratingThumb] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ভিডিও URL দিলেই অটো থাম্বনেইল + প্রিভিউ
  const handleVideoUrlChange = async (url: string) => {
    setVideoUrl(url);
    if (url && url.startsWith('http')) {
      setGeneratingThumb(true);
      try {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = url;
        video.muted = true;
        video.preload = 'metadata';

        video.onloadeddata = () => {
          video.currentTime = Math.min(1, video.duration / 2); // 1 সেকেন্ড বা মাঝের ফ্রেম
        };

        video.onseeked = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setThumbnailUrl(dataUrl);
          setGeneratingThumb(false);
          video.remove();
        };

        video.onerror = () => {
          setGeneratingThumb(false);
          setThumbnailUrl('');
        };
      } catch {
        setGeneratingThumb(false);
      }
    } else {
      setThumbnailUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user ||!videoUrl ||!title) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'videos'), {
        ownerId: user.uid,
        ownerName: profile?.username || 'Guest',
        ownerAvatar: profile?.avatarUrl || '',
        title,
        description,
        videoUrl,
        thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/640x360/1a1a1a/ea580c?text=Z-VIDEOS',
        views: 0,
        likesCount: 0,
        is18Plus: true,
        monetized: true,
        adNetwork: 'popads',
        createdAt: serverTimestamp(),
      });
      onComplete();
      onClose();
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setThumbnailUrl('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'videos');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <canvas ref={canvasRef} className="hidden" />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 p-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a] z-10">
          <h2 className="text-xl font-bold text-white">Upload Video</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* রিয়েল ভিডিও প্রিভিউ */}
            {videoUrl && (
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10">
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  controls
                />
                {generatingThumb && (
                  <div className="absolute top-2 right-2 bg-black/80 px-3 py-1.5 rounded-full flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                    <span className="text-[10px] text-white/70 font-bold">Creating thumbnail...</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase mb-2">Video URL *</label>
              <input
                required
                type="url"
                value={videoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                placeholder="https://dood.ws/e/abc123"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-orange-600"
              />
              <div className="mt-2 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-orange-500" />
                <p className="text-[10px] text-white/40">Use Doodstream, Streamtape direct MP4 link. Fast & free.</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase mb-2">Thumbnail</label>
              <div className="flex gap-4 items-center">
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Auto generated"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-orange-600"
                />
                {thumbnailUrl && (
                  <img src={thumbnailUrl} alt="thumb" className="w-24 h-14 object-cover rounded-lg border border-white/10" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase mb-2">Title *</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase mb-2">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-orange-600 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading ||!videoUrl ||!title}
              className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Now'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
