import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Loader2, ShieldAlert, DollarSign, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../AuthContext';

export const VideoUpload: React.FC<{ isOpen: boolean; onClose: () => void; onComplete: () => void }> = ({ isOpen, onClose, onComplete }) => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [is18Plus, setIs18Plus] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file.');
        return;
      }
      setSelectedFile(file);
      setTitle(file.name.split('.')[0]); 
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let finalVideoUrl = videoUrl;
      
      // If a local file is selected, upload it to Firebase Storage
      if (selectedFile) {
        const storageRef = ref(storage, `videos/${user.uid}/${Date.now()}_${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            }, 
            (error) => {
              console.error("Upload error:", error);
              reject(error);
            }, 
            async () => {
              finalVideoUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(true);
            }
          );
        });
      }

      // If no URL or file, use sample (failsafe)
      if (!finalVideoUrl) {
        finalVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-4001-large.mp4';
      }

      const finalThumbUrl = thumbnailUrl || 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=640&auto=format&fit=crop';

      await addDoc(collection(db, 'videos'), {
        ownerId: user.uid,
        ownerName: profile?.username || 'Guest',
        ownerAvatar: profile?.avatarUrl || '',
        title,
        description,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbUrl,
        views: 0,
        likesCount: 0,
        unlikesCount: 0,
        is18Plus,
        monetized: true,
        createdAt: serverTimestamp(),
      });

      setStep(3);
      setTimeout(() => {
        onComplete();
        onClose();
        setStep(1);
        setSelectedFile(null);
        setVideoUrl('');
        setThumbnailUrl('');
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'videos');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Upload Content</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="relative">
              <input 
                type="file" 
                accept="video/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                onChange={onFileSelect}
              />
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-orange-600/50 hover:bg-orange-600/5 transition-all">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center group">
                  <Upload className="w-8 h-8 text-white/30 group-hover:text-orange-600 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">Select or Drag Video</p>
                  <p className="text-white/40 text-xs mt-1">MP4, WEBM or MOV. Max 1GB.</p>
                </div>
                <div className="flex items-center gap-2 mt-4 px-4 py-1.5 bg-red-600/20 text-red-500 rounded-full">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">18+ Content Only</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {selectedFile && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-600/20 rounded flex items-center justify-center text-orange-500">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate w-40">{selectedFile.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest">Change</button>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 italic font-mono">Video Asset Link (Direct MP4/HD Required)</label>
                  <input 
                    type="text" 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://assets.mixkit.co/videos/preview/..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs focus:outline-none focus:border-orange-600 transition-all font-mono"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[8px] bg-orange-600/20 text-orange-600 px-2 py-0.5 rounded font-black uppercase">Direct only</span>
                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">Use Dropbox, Pexels, or Mixkit high-quality MP4 URLs.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 italic font-mono">Poster/Cover Image Link</label>
                  <input 
                    type="text" 
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs focus:outline-none focus:border-orange-600 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 font-mono">Video Title</label>
                  <input 
                    required
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Provide a name for your content..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-orange-600 transition-all font-black text-sm uppercase tracking-tight"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 font-mono">Description</label>
                  <textarea 
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write whatever you want about this clip..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-orange-600 transition-all resize-none italic text-xs leading-relaxed"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-orange-600/10 border border-orange-600/30 rounded-[2rem] flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                    <Zap className="w-16 h-16 text-orange-600 fill-current" />
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-green-600/20 rounded-2xl flex items-center justify-center shadow-lg">
                      <DollarSign className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-tighter">Monetization: Active</p>
                      <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Revenue System Enabled</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500 animate-pulse relative z-10" />
                </div>

                {loading && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
                      <span>Uploading Asset...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.5)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-600/20 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{uploadProgress > 0 && uploadProgress < 100 ? 'Uploading...' : 'Publishing...'}</span>
                  </div>
                ) : 'Publish to Z-VIDEOS'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-green-600/10 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-white">Upload Successful</h3>
              <p className="text-white/40">Your video is now live on Z-VIDEOS.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
