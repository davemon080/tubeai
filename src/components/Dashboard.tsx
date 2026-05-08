import React, { useEffect, useState } from 'react';
import { useYouTube } from './YouTubeContext';
import { useTheme } from './ThemeContext';
import { fetchAnalytics, fetchUserVideos, YouTubeVideo } from '../lib/youtube';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, Eye, Video, TrendingUp, Calendar, Upload, Settings, LogOut, ArrowUpRight, Play, MoreHorizontal, AlertCircle, BarChart3, Clock, ThumbsUp, MessageSquare } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard({ onNavigate, onOpenUpload }: { onNavigate?: (tab: any) => void; onOpenUpload?: () => void }) {
  const { channel, tokens, logout, setQuotaExceeded, setAnalyticsDisabled, analyticsDisabled } = useYouTube();
  const { theme } = useTheme();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [totalWatchHours, setTotalWatchHours] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    if (tokens?.access_token) {
      loadDashboardData();
    }
  }, [tokens]);

  const loadDashboardData = async () => {
    setLoading(true);
    setAnalyticsDisabled(false);
    
    // Fetch videos separately
    try {
      const vids = await fetchUserVideos(tokens!.access_token);
      setVideos(vids);
    } catch (err: any) {
      console.error('Video Load Error:', err);
      if (err.message?.toLowerCase().includes('quota')) {
        setQuotaExceeded(true);
      }
    }

    // Fetch analytics separately
    try {
      const analytics = await fetchAnalytics(tokens!.access_token, format(subDays(new Date(), 30), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd'));
      
      if (analytics.rows) {
        let totalMinutes = 0;
        const formatted = analytics.rows.map((row: any) => {
          totalMinutes += row[4] || 0; // estimatedMinutesWatched
          return {
            date: row[0],
            views: row[1],
            likes: row[2]
          };
        });
        setAnalyticsData(formatted);
        setTotalWatchHours((totalMinutes / 60).toFixed(1));
      }
    } catch (err: any) {
      console.error('Analytics Load Error:', err);
      if (err.message?.toLowerCase().includes('quota')) {
        setQuotaExceeded(true);
      }
      if (err.message?.toLowerCase().includes('youtubeanalytics.googleapis.com')) {
        setAnalyticsDisabled(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!channel) return null;

  const latestVideo = videos[0];

  return (
    <div className={`p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
      {/* Header */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 uppercase">Channel Dashboard</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
          <button 
            onClick={onOpenUpload}
            className={`w-full sm:w-12 h-12 rounded-2xl sm:rounded-full flex items-center justify-center transition-all gap-3 sm:gap-0 ${
              theme === 'dark' 
                ? 'bg-white/5 border border-white/10 text-white/40 hover:text-[#ff0033] hover:border-[#ff0033]/40' 
                : 'bg-black/5 border border-black/10 text-black/40 hover:text-[#ff0033] hover:border-[#ff0033]/40'
            }`}
          >
            <Upload size={20} />
            <span className="sm:hidden font-bold text-[10px] uppercase tracking-widest">New Deployment</span>
          </button>

          <div className={`flex items-center gap-4 border p-2 pl-4 sm:pl-6 rounded-2xl sm:rounded-full overflow-hidden group hover:border-[#ff0033]/40 transition-colors w-full sm:w-auto min-w-0 ${
            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
          }`}>
            <div className="text-right flex-1 sm:flex-none min-w-0">
              <p className="font-bold text-sm tracking-tight truncate">{channel.snippet.title}</p>
              <p className={`text-[10px] font-mono uppercase tracking-widest truncate ${theme === 'dark' ? 'text-white/30' : 'text-black/40'}`}>
                {Number(channel.statistics.subscriberCount).toLocaleString()} subs
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-full overflow-hidden border-2 border-[#ff0033]/20 group-hover:border-[#ff0033] transition-colors shrink-0">
              <img src={channel.snippet.thumbnails.medium.url} className="w-full h-full object-cover" alt="Channel" />
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Latest Video Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`lg:col-span-3 border rounded-[40px] p-6 md:p-10 relative overflow-hidden flex flex-col min-h-[500px] md:min-h-[480px] shadow-2xl transition-colors duration-500 ${
            theme === 'dark' ? 'bg-white/[0.03] border-white/10 shadow-black/50' : 'bg-black/[0.03] border-black/10 shadow-black/5'
          }`}
        >
          {latestVideo ? (
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 md:mb-12">
                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="px-3 py-1 bg-[#ff0033] text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-[#ff0033]/20">
                      Latest Upload
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                      {format(new Date(latestVideo.snippet.publishedAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-[1.1] max-w-2xl line-clamp-3">{latestVideo.snippet.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedVideo(latestVideo)}
                  className="w-14 h-14 bg-[#ff0033] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-[#ff0033]/20 hover:scale-105 transition-transform shrink-0 self-end sm:self-start"
                >
                  <Play fill="white" size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-auto">
                <div className="md:col-span-1">
                  <div className="relative aspect-video rounded-3xl overflow-hidden group border-4 border-white/10 shadow-2xl">
                    <img 
                      src={(latestVideo.snippet.thumbnails as any)?.maxres?.url || (latestVideo.snippet.thumbnails as any)?.high?.url || latestVideo.snippet.thumbnails.medium.url} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 xs:grid-cols-4 md:grid-cols-4 gap-4 md:gap-6 content-center">
                  <MiniStat icon={<Eye size={16} />} label="Views" value={Number(latestVideo.statistics?.viewCount || 0).toLocaleString()} theme={theme} />
                  <MiniStat icon={<ThumbsUp size={16} />} label="Likes" value={Number(latestVideo.statistics?.likeCount || 0).toLocaleString()} theme={theme} />
                  <MiniStat icon={<MessageSquare size={16} />} label="Comments" value={Number(latestVideo.statistics?.commentCount || 0).toLocaleString()} theme={theme} />
                  <MiniStat icon={<Clock size={16} />} label="Velo" value="High" theme={theme} />
                  
                  {/* Progress Indicator */}
                  <div className="col-span-full mt-4 md:mt-6 space-y-3">
                    <div className="flex justify-between items-end">
                      <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/40' : 'text-black/60'}`}>Reach Signal</p>
                      <p className="text-xs font-black font-mono">84%</p>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden p-0.5 border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '84%' }}
                        className="h-full bg-gradient-to-r from-[#ff0033] to-[#ff5c7c] rounded-full shadow-[0_0_15px_rgba(255,0,51,0.4)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-2xl" />
                <div className="h-4 w-48 bg-white/5 rounded-full" />
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Stats - Vertical Stack */}
        <div className="md:col-span-1 space-y-6">
          <StatComponent 
            label="Total Views" 
            value={Number(channel.statistics.viewCount).toLocaleString()} 
            icon={<Eye size={20} />}
            delay={0.1}
            theme={theme}
          />
          <StatComponent 
            label="Watch Hours (30d)" 
            value={totalWatchHours} 
            icon={<TrendingUp size={20} />} 
            accent
            delay={0.2}
            theme={theme}
          />
          <StatComponent 
            label="Video Count" 
            value={channel.statistics.videoCount} 
            icon={<Video size={20} />}
            delay={0.3}
            theme={theme}
          />
        </div>
      </div>

      {/* Recent Videos */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-bold tracking-tight mb-1">Your Content</h3>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Performance analytics for your latest uploads</p>
          </div>
          <button className="flex items-center gap-2 text-xs font-bold text-[#ff0033] hover:text-[#ff0033]/80 transition-colors uppercase tracking-[0.2em] group">
            View All Content
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className={`h-40 rounded-[32px] animate-pulse ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`} />)
          ) : (
            videos.slice(1, 7).map((video, idx) => (
              <VideoCard key={video.id} video={video} index={idx} onClick={() => setSelectedVideo(video)} theme={theme} />
            ))
          )}
        </div>
      </section>

      {/* Video Preview Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-white/10"
              onClick={e => e.stopPropagation()}
            >
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
                <MoreHorizontal className="rotate-45" size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniStat({ icon, label, value, theme }: { icon: React.ReactNode, label: string, value: string, theme: string }) {
  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-2 mb-1 ${theme === 'dark' ? 'text-white/20' : 'text-black/40'}`}>
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-bold font-mono">{value}</p>
    </div>
  );
}

function StatComponent({ label, value, icon, accent = false, delay = 0, theme }: { label: string, value: string, icon: React.ReactNode, accent?: boolean, delay?: number, theme: string }) {
  const baseClasses = `p-8 rounded-[32px] border transition-all duration-500`;
  const themeClasses = theme === 'dark' 
    ? 'bg-white/[0.03] border-white/10 text-white shadow-xl shadow-black/20' 
    : 'bg-black/[0.03] border-black/10 text-black shadow-xl shadow-black/5';
  const accentClasses = 'bg-[#ff0033] border-[#ff0033] text-white shadow-[0_20px_40px_rgba(255,0,51,0.2)]';

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`${baseClasses} ${accent ? accentClasses : themeClasses}`}
    >
      <div className={`mb-6 p-2 h-10 w-10 flex items-center justify-center rounded-xl ${accent ? 'bg-white/20' : theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'}`}>
        {icon}
      </div>
      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${accent ? 'text-white/80' : theme === 'dark' ? 'text-white/40' : 'text-black/60'}`}>{label}</p>
      <p className="text-3xl font-bold tracking-tight font-mono">{value}</p>
    </motion.div>
  );
}

function VideoCard({ video, index, onClick, theme }: { video: YouTubeVideo, index: number, onClick: () => void, theme: string, key?: React.Key }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={`group relative border rounded-[32px] overflow-hidden transition-all duration-500 cursor-pointer ${
        theme === 'dark' ? 'bg-[#0f0f11] border-white/5 hover:border-white/20' : 'bg-white border-black/5 hover:border-black/20 shadow-xl shadow-black/5'
      }`}
    >
      <div className="flex h-32 md:h-40">
        <div className="relative w-1/3 overflow-hidden">
          <img src={video.snippet.thumbnails.medium.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="text-white fill-white" size={32} />
          </div>
        </div>
        
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start gap-4">
            <h4 className="font-bold text-lg leading-tight tracking-tight line-clamp-1 group-hover:text-[#ff0033] transition-colors">{video.snippet.title}</h4>
            <button className={`transition-colors ${theme === 'dark' ? 'text-white/20 hover:text-white' : 'text-black/20 hover:text-black'}`}>
              <MoreHorizontal size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="space-y-1">
              <p className={`text-[10px] uppercase font-bold tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-black/40'}`}>Performance</p>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-bold">
                  {Number(video.statistics?.viewCount || 0).toLocaleString()} 
                  <span className={`text-[9px] uppercase tracking-tighter ml-1 ${theme === 'dark' ? 'text-white/30' : 'text-black/40'}`}>Views</span>
                </span>
                <span className="font-mono text-xs font-bold text-[#ff0033]">
                  {Number(video.statistics?.likeCount || 0).toLocaleString()} 
                  <span className={`text-[9px] uppercase tracking-tighter ml-1 ${theme === 'dark' ? 'text-white/30' : 'text-black/40'}`}>Likes</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
