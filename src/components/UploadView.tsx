import React, { useState, useRef, useEffect } from 'react';
import { useYouTube } from './YouTubeContext';
import { useTheme } from './ThemeContext';
import { uploadVideo } from '../lib/youtube';
import { Upload, ImageIcon, AlertCircle, CheckCircle2, Terminal, FileVideo, X, ChevronRight, ChevronLeft, Globe, Lock, EyeOff, Calendar, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function UploadView({ onClose }: { onClose: () => void }) {
  const { tokens, setQuotaExceeded, addUpload, updateUploadProgress, completeUpload, failUpload } = useYouTube();
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public');
  const [isPremiere, setIsPremiere] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setVideoPreviewUrl(url);
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
        setStep(1);
      } else {
        setErrorMessage("Please select a valid video file.");
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const url = URL.createObjectURL(file);
      setThumbnailPreviewUrl(url);
    }
  };

  const startBackgroundUpload = async () => {
    if (!tokens || !selectedFile || !title) return;
    
    const uploadId = Math.random().toString(36).substr(2, 9);
    addUpload({
      id: uploadId,
      title: title,
      thumbnailUrl: thumbnailPreviewUrl || undefined
    });

    onClose();

    try {
      await uploadVideo(
        tokens.access_token,
        selectedFile,
        { 
          title, 
          description, 
          privacyStatus: visibility 
        },
        (progress) => {
          updateUploadProgress(uploadId, progress);
        }
      );
      completeUpload(uploadId);
    } catch (err: any) {
      console.error(err);
      failUpload(uploadId);
      if (err.message?.includes('quota')) {
        setQuotaExceeded(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden rounded-[40px] shadow-2xl transition-colors duration-500 ${
          theme === 'dark' ? 'bg-[#0a0a0a] border border-white/5' : 'bg-white border border-black/5'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-inherit/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#ff0033]/10 text-[#ff0033] rounded-2xl flex items-center justify-center">
              <Upload size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight uppercase">
                {step === 0 ? 'Upload Video' : step === 1 ? 'Details' : 'Visibility'}
              </h2>
              <div className="flex items-center gap-2">
                <div className={`h-1 w-8 rounded-full ${step >= 0 ? 'bg-[#ff0033]' : 'bg-white/10'}`} />
                <div className={`h-1 w-8 rounded-full ${step >= 1 ? 'bg-[#ff0033]' : 'bg-white/10'}`} />
                <div className={`h-1 w-8 rounded-full ${step >= 2 ? 'bg-[#ff0033]' : 'bg-white/10'}`} />
                <span className={`text-[9px] font-bold uppercase tracking-widest ml-2 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                  STEP {step + 1} OF 3
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
              theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5 text-black'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div 
                key="step0"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center h-[400px] gap-8"
              >
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full max-w-2xl border-2 border-dashed rounded-[40px] p-20 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all group ${
                    theme === 'dark' ? 'border-white/10 hover:border-[#ff0033]/50 bg-white/[0.02]' : 'border-black/10 hover:border-[#ff0033]/50 bg-black/[0.02]'
                  }`}
                >
                  <div className="w-24 h-24 bg-[#ff0033]/10 text-[#ff0033] rounded-[32px] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <Upload size={48} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">Select Video Files</h3>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                      Drag and drop video files to upload
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-8 px-8 py-3 bg-[#ff0033] text-white rounded-full`}>
                      Choose Files
                    </p>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-black/30'}`}>
                  By submitting your videos, you agree to YouTube Terms of Service
                </p>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12"
              >
                {/* Left Side: Forms */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Title (required)</label>
                    <input 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Add a title that describes your video"
                      className={`w-full border rounded-2xl p-6 text-lg font-bold focus:border-[#ff0033]/50 outline-none transition-all ${
                        theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-black/5 border-black/10 text-black'
                      }`}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      placeholder="Tell viewers about your video"
                      className={`w-full border rounded-2xl p-6 font-medium focus:border-[#ff0033]/50 outline-none transition-all resize-none ${
                        theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-black/5 border-black/10 text-black'
                      }`}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Thumbnail</label>
                    <div className="flex gap-4">
                      <div 
                        onClick={() => thumbInputRef.current?.click()}
                        className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#ff0033]/5 overflow-hidden ${
                          theme === 'dark' ? 'border-white/10' : 'border-black/10'
                        }`}
                      >
                        {thumbnailPreviewUrl ? (
                          <img src={thumbnailPreviewUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <>
                            <ImageIcon size={24} className="opacity-40" />
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Upload Thumb</span>
                          </>
                        )}
                        <input type="file" ref={thumbInputRef} className="hidden" accept="image/*" onChange={handleThumbnailChange} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Preview */}
                <div className="space-y-8">
                  <div className={`sticky top-0 rounded-[40px] overflow-hidden border ${
                    theme === 'dark' ? 'bg-black/60 border-white/10' : 'bg-black/5 border-black/10'
                  }`}>
                    <div className="aspect-video relative bg-black">
                      {videoPreviewUrl ? (
                        <video src={videoPreviewUrl} className="w-full h-full object-contain" controls />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                          <FileVideo size={64} />
                        </div>
                      )}
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="space-y-1">
                        <p className={`text-[10px] uppercase font-bold tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-black/40'}`}>Video Preview</p>
                        <h4 className="font-bold text-lg truncate uppercase">{title || "Video Title"}</h4>
                      </div>
                      <div className="flex items-center gap-4 py-4 border-t border-white/5">
                        <div className="space-y-1">
                          <p className={`text-[9px] uppercase font-bold tracking-widest opacity-40`}>File Size</p>
                          <p className="font-mono text-xs">{selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) : 0} MB</p>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-[9px] uppercase font-bold tracking-widest opacity-40`}>Format</p>
                          <p className="font-mono text-xs uppercase">{selectedFile?.type.split('/')[1] || "MP4"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto space-y-10"
              >
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold uppercase tracking-tight">Visibility & Deployment</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                    Choose when to publish and who can see your video
                  </p>
                </div>

                <div className={`rounded-[32px] border overflow-hidden ${
                  theme === 'dark' ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/10'
                }`}>
                  <VisibilityOption 
                    active={visibility === 'public'} 
                    onClick={() => setVisibility('public')}
                    icon={<Globe size={20} />}
                    label="Public"
                    desc="Everyone can see your video"
                    theme={theme}
                  />
                  <VisibilityOption 
                    active={visibility === 'unlisted'} 
                    onClick={() => setVisibility('unlisted')}
                    icon={<EyeOff size={20} />}
                    label="Unlisted"
                    desc="Anyone with the link can see"
                    theme={theme}
                  />
                  <VisibilityOption 
                    active={visibility === 'private'} 
                    onClick={() => setVisibility('private')}
                    icon={<Lock size={20} />}
                    label="Private"
                    desc="Only you and people you choose can see"
                    theme={theme}
                  />
                </div>

                <div className="space-y-6 pt-10 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#ff0033]/10 text-[#ff0033] rounded-xl flex items-center justify-center">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm uppercase tracking-tight">Schedule Deployment</p>
                        <p className="text-[10px] opacity-40 uppercase font-black">Set a date to make the video public</p>
                      </div>
                    </div>
                    <input 
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className={`p-3 rounded-xl border text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-black/10 text-black'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#ff0033]/10 text-[#ff0033] rounded-xl flex items-center justify-center">
                        <Play size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm uppercase tracking-tight">Set as Premiere</p>
                        <p className="text-[10px] opacity-40 uppercase font-black">Watch with your audience in real-time</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsPremiere(!isPremiere)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${isPremiere ? 'bg-[#ff0033]' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: isPremiere ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {step > 0 && (
          <div className="p-8 border-t border-white/5 bg-inherit/80 backdrop-blur-xl flex items-center justify-between shrink-0">
            <button 
              onClick={() => setStep(prev => prev - 1)}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all ${
                theme === 'dark' ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 text-black'
              }`}
            >
              <ChevronLeft size={20} />
              Back
            </button>

            {step < 2 ? (
              <button 
                onClick={() => setStep(prev => prev + 1)}
                className={`flex items-center gap-2 px-8 py-4 bg-[#ff0033] text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-[#ff0033]/20 hover:scale-[1.02] active:scale-[0.98] transition-all`}
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={startBackgroundUpload}
                className={`flex items-center gap-2 px-12 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-[#ff0033] hover:text-white transition-all scale-110`}
              >
                Publish Now
                <CheckCircle2 size={20} />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function VisibilityOption({ active, onClick, icon, label, desc, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, desc: string, theme: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-6 flex items-center gap-6 text-left transition-all ${
        active ? (theme === 'dark' ? 'bg-white/5' : 'bg-black/5') : 'opacity-60'
      }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
        active ? 'bg-[#ff0033] text-white' : (theme === 'dark' ? 'bg-white/5' : 'bg-black/5')
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm uppercase tracking-tight">{label}</p>
        <p className="text-[10px] opacity-60 font-semibold">{desc}</p>
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
        active ? 'border-[#ff0033]' : 'border-white/10'
      }`}>
        {active && <div className="w-3 h-3 rounded-full bg-[#ff0033]" />}
      </div>
    </button>
  );
}
