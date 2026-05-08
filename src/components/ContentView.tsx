import React, { useState, useEffect, useMemo } from 'react';
import { useYouTube } from './YouTubeContext';
import { useTheme } from './ThemeContext';
import { fetchUserVideos, YouTubeVideo } from '../lib/youtube';
import { format } from 'date-fns';
import { 
  Search, 
  ArrowUpDown, 
  Eye, 
  MoreVertical, 
  Play, 
  Lock, 
  Globe, 
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertCircle,
  ArrowUpRight,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type SortField = 'date' | 'views' | 'title';
type SortOrder = 'asc' | 'desc';

export default function ContentView() {
  const { tokens, setQuotaExceeded, activeUploads } = useYouTube();
  const { theme } = useTheme();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    if (tokens?.access_token) {
      loadVideos();
    }
  }, [tokens]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const vids = await fetchUserVideos(tokens!.access_token);
      setVideos(vids);
    } catch (err: any) {
      console.error('Content Load Error:', err);
      if (err.message?.toLowerCase().includes('quota')) {
        setQuotaExceeded(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedVideos = useMemo(() => {
    return videos
      .filter(video => 
        video.snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.snippet.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'date') {
          comparison = new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime();
        } else if (sortField === 'views') {
          comparison = Number(b.statistics?.viewCount || 0) - Number(a.statistics?.viewCount || 0);
        } else if (sortField === 'title') {
          comparison = a.snippet.title.localeCompare(b.snippet.title);
        }
        return sortOrder === 'asc' ? comparison * -1 : comparison;
      });
  }, [videos, searchTerm, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className={`p-8 lg:p-12 space-y-8 min-h-full transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight mb-2 uppercase">Channel Contents</h2>
          <p className={`font-medium ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Manage and monitor all your uploaded assets</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-white/20' : 'text-black/30'}`} size={18} />
          <input 
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full border rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#ff0033]/50 outline-none transition-all ${
              theme === 'dark' ? 'bg-white/[0.03] border-white/10 focus:bg-white/[0.05]' : 'bg-black/[0.03] border-black/10 focus:bg-white'
            }`}
          />
        </div>
      </header>

      {/* Active Uploads Section */}
      <AnimatePresence>
        {activeUploads.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff0033]">Active Deployments</h3>
            <div className="grid gap-4">
              {activeUploads.map(upload => (
                <div 
                  key={upload.id}
                  className={`p-6 rounded-[32px] border flex items-center gap-6 ${
                    theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.02] border-black/10'
                  }`}
                >
                  <div className="w-20 aspect-video rounded-xl bg-black/40 overflow-hidden shrink-0 relative">
                    {upload.thumbnailUrl && <img src={upload.thumbnailUrl} className="w-full h-full object-cover" alt="" />}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="animate-spin text-[#ff0033]" size={20} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-2">
                      <p className="font-bold text-sm truncate max-w-md">{upload.title}</p>
                      <span className="font-mono text-xs font-bold text-[#ff0033]">{upload.progress}%</span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${upload.progress}%` }}
                        className="h-full bg-[#ff0033]"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-black/30'}`}>Status</p>
                    <p className="text-[10px] font-bold uppercase text-[#ff0033] tracking-wider">{upload.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`border rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500 ${
        theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-black/5'
      }`}>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b transition-colors ${theme === 'dark' ? 'border-white/5 bg-white/[0.01]' : 'border-black/5 bg-black/[0.01]'}`}>
                <th className={`p-6 text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-black/40'}`}>Video</th>
                <th className={`p-6 text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-black/40'}`}>Visibility</th>
                <th 
                  className={`p-6 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-[#ff0033] transition-colors ${theme === 'dark' ? 'text-white/30' : 'text-black/40'}`}
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Date
                    <ArrowUpDown size={12} className={sortField === 'date' ? 'text-[#ff0033]' : ''} />
                  </div>
                </th>
                <th 
                  className={`p-6 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-[#ff0033] transition-colors ${theme === 'dark' ? 'text-white/30' : 'text-black/40'}`}
                  onClick={() => toggleSort('views')}
                >
                  <div className="flex items-center gap-2">
                    Views
                    <ArrowUpDown size={12} className={sortField === 'views' ? 'text-[#ff0033]' : ''} />
                  </div>
                </th>
                <th className={`p-6 text-[10px] font-bold uppercase tracking-widest text-right ${theme === 'dark' ? 'text-white/30' : 'text-black/40'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className={`border-b animate-pulse ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                    <td className="p-6" colSpan={5}><div className={`h-12 rounded-xl w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`} /></td>
                  </tr>
                ))
              ) : filteredAndSortedVideos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center opacity-20 font-bold uppercase tracking-widest">No matching content found</td>
                </tr>
              ) : (
                filteredAndSortedVideos.map((video) => (
                  <tr 
                    key={video.id} 
                    className={`border-b transition-colors group cursor-pointer ${
                      theme === 'dark' ? 'border-white/5 hover:bg-white/[0.02]' : 'border-black/5 hover:bg-black/[0.02]'
                    }`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4 min-w-[300px]">
                        <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0">
                          <img src={video.snippet.thumbnails.medium.url} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={16} fill="white" />
                          </div>
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-bold text-sm truncate group-hover:text-[#ff0033] transition-colors">{video.snippet.title}</p>
                          <p className={`text-[10px] line-clamp-1 mt-1 ${theme === 'dark' ? 'text-white/30' : 'text-black/40'}`}>{video.snippet.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        {video.status?.privacyStatus === 'public' ? (
                          <span className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-500/20">
                            <Globe size={10} /> Public
                          </span>
                        ) : (
                          <span className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                            theme === 'dark' ? 'bg-white/5 text-white/40 border-white/10' : 'bg-black/5 text-black/40 border-black/10'
                          }`}>
                            <Lock size={10} /> {video.status?.privacyStatus || 'Private'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className={`flex items-center gap-2 text-xs font-mono font-bold ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                        <Clock size={12} />
                        {format(new Date(video.snippet.publishedAt), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Eye size={12} className="text-[#ff0033]" />
                        <span className="text-sm font-mono font-bold">{Number(video.statistics?.viewCount || 0).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <button className={`transition-colors p-2 rounded-lg ${theme === 'dark' ? 'text-white/20 hover:text-white hover:bg-white/5' : 'text-black/20 hover:text-black hover:bg-black/5'}`}>
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y border-t lg:border-t-0 divide-white/5">
           {loading ? (
             [...Array(3)].map((_, i) => (
               <div key={i} className="p-6 animate-pulse space-y-4">
                 <div className="h-40 bg-white/5 rounded-2xl" />
                 <div className="h-4 bg-white/5 rounded-full w-3/4" />
               </div>
             ))
           ) : filteredAndSortedVideos.length === 0 ? (
             <div className="p-12 text-center opacity-20 font-bold uppercase tracking-widest">No matching content</div>
           ) : (
             filteredAndSortedVideos.map(video => (
               <div 
                key={video.id} 
                onClick={() => setSelectedVideo(video)}
                className={`p-6 space-y-4 active:bg-white/[0.02] transition-colors ${
                  theme === 'dark' ? 'bg-black border-white/5' : 'bg-white border-black/5'
                }`}
               >
                 <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                   <img src={video.snippet.thumbnails.medium.url} className="w-full h-full object-cover" alt="" />
                   <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10">
                     {video.status?.privacyStatus}
                   </div>
                 </div>
                 <div className="space-y-2">
                   <h4 className="font-bold text-base leading-tight line-clamp-2">{video.snippet.title}</h4>
                   <div className="flex items-center justify-between">
                     <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-black/40'}`}>
                       {format(new Date(video.snippet.publishedAt), 'MMM dd, yyyy')}
                     </p>
                     <div className="flex items-center gap-2">
                        <Eye size={12} className="text-[#ff0033]" />
                        <span className="text-xs font-mono font-bold">{Number(video.statistics?.viewCount || 0).toLocaleString()}</span>
                      </div>
                   </div>
                 </div>
               </div>
             ))
           )}
        </div>

        
        {/* Pagination Placeholder */}
        <div className={`p-6 border-t flex justify-between items-center transition-colors ${
          theme === 'dark' ? 'border-white/5 bg-white/[0.01] text-white/30' : 'border-black/5 bg-black/[0.01] text-black/40'
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-widest">Showing {filteredAndSortedVideos.length} entries</p>
          <div className="flex gap-2">
            <button className={`p-2 border rounded-xl transition-all disabled:opacity-20 ${
              theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'
            }`} disabled><ChevronLeft size={16} /></button>
            <button className={`p-2 border rounded-xl transition-all disabled:opacity-20 ${
              theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'
            }`} disabled><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Full Video Details Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl relative border transition-colors duration-500 pb-12 ${
                theme === 'dark' ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10 text-black'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="aspect-video relative bg-black rounded-t-[40px] overflow-hidden">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                />
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors border border-white/10 backdrop-blur-md"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-12 space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                        theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40' : 'bg-black/5 border-black/10 text-black/60'
                      }`}>
                        {selectedVideo.status?.privacyStatus}
                      </span>
                      <span className={`text-[10px] font-mono font-bold tracking-widest opacity-40 uppercase`}>
                        Published: {format(new Date(selectedVideo.snippet.publishedAt), 'MMMM dd, yyyy')}
                      </span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tightest leading-tight uppercase">{selectedVideo.snippet.title}</h2>
                  </div>
                  
                  <div className="flex gap-4">
                    <StatBox label="Views" value={Number(selectedVideo.statistics?.viewCount || 0).toLocaleString()} theme={theme} />
                    <StatBox label="Likes" value={Number(selectedVideo.statistics?.likeCount || 0).toLocaleString()} theme={theme} />
                    <StatBox label="Comments" value={Number(selectedVideo.statistics?.commentCount || 0).toLocaleString()} theme={theme} />
                  </div>
                </div>

                <div className="space-y-6 pt-12 border-t border-white/5">
                   <h3 className={`text-xs font-black uppercase tracking-[0.3em] text-[#ff0033]`}>Video metadata details</h3>
                   <div className={`p-8 rounded-[32px] font-medium leading-relaxed ${
                     theme === 'dark' ? 'bg-white/[0.03]' : 'bg-black/[0.03]'
                   }`}>
                     {selectedVideo.snippet.description || "No description provided."}
                   </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBox({ label, value, theme }: { label: string, value: string, theme: string }) {
  return (
    <div className={`px-6 py-4 rounded-[24px] border ${
      theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/10'
    }`}>
      <p className={`text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1`}>{label}</p>
      <p className="font-mono font-black text-lg">{value}</p>
    </div>
  );
}

