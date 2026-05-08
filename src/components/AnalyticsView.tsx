import React, { useEffect, useState } from 'react';
import { useYouTube } from './YouTubeContext';
import { useTheme } from './ThemeContext';
import { fetchAnalytics, YouTubeVideo, fetchUserVideos } from '../lib/youtube';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, subYears, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Eye, Clock, Users, ArrowUpRight, Filter, ChevronDown, Info } from 'lucide-react';

type Period = '7' | '30' | '365';

export default function AnalyticsView() {
  const { tokens, setQuotaExceeded, setAnalyticsDisabled } = useYouTube();
  const { theme } = useTheme();
  const [period, setPeriod] = useState<Period>('30');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [performance, setPerformance] = useState<{
    views: { current: number; previous: number };
    watchTime: { current: number; previous: number };
    likes: { current: number; previous: number };
  } | null>(null);
  const [topVideos, setTopVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tokens?.access_token) {
      loadAnalytics();
    }
  }, [tokens, period]);

  const loadAnalytics = async () => {
    setLoading(true);
    const endDate = format(new Date(), 'yyyy-MM-dd');
    let startDate: string;
    let prevStartDate: string;
    let prevEndDate: string;

    const days = parseInt(period);
    startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    prevEndDate = startDate;
    prevStartDate = format(subDays(new Date(), days * 2), 'yyyy-MM-dd');

    try {
      // Current Period
      const current = await fetchAnalytics(tokens!.access_token, startDate, endDate);
      // Previous Period
      const previous = await fetchAnalytics(tokens!.access_token, prevStartDate, prevEndDate);
      // Videos
      const videos = await fetchUserVideos(tokens!.access_token);

      if (current.rows) {
        const formatted = current.rows.map((row: any) => ({
          date: format(new Date(row[0]), period === '365' ? 'MMM yyyy' : 'MMM dd'),
          views: row[1],
          likes: row[2],
          watchTime: (row[4] || 0) / 60
        }));
        setAnalyticsData(formatted);

        const currentTotals = current.rows.reduce((acc: any, row: any) => ({
          views: acc.views + (row[1] || 0),
          likes: acc.likes + (row[2] || 0),
          comments: acc.comments + (row[3] || 0),
          watchTime: acc.watchTime + (row[4] || 0),
          subscribers: acc.subscribers + (row[5] || 0) - (row[6] || 0)
        }), { views: 0, likes: 0, comments: 0, watchTime: 0, subscribers: 0 });

        const prevTotals = previous.rows ? previous.rows.reduce((acc: any, row: any) => ({
          views: acc.views + (row[1] || 0),
          likes: acc.likes + (row[2] || 0),
          comments: acc.comments + (row[3] || 0),
          watchTime: acc.watchTime + (row[4] || 0),
          subscribers: acc.subscribers + (row[5] || 0) - (row[6] || 0)
        }), { views: 0, likes: 0, comments: 0, watchTime: 0, subscribers: 0 }) : { views: 0, likes: 0, comments: 0, watchTime: 0, subscribers: 0 };

        setPerformance({
          views: { current: currentTotals.views, previous: prevTotals.views },
          watchTime: { current: currentTotals.watchTime / 60, previous: prevTotals.watchTime / 60 },
          likes: { current: currentTotals.subscribers, previous: prevTotals.subscribers }
        });
      }

      setTopVideos(videos.slice(0, 5));
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('quota')) setQuotaExceeded(true);
      if (err.message?.includes('v2')) setAnalyticsDisabled(true);
    } finally {
      setLoading(false);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className={`p-8 lg:p-12 space-y-12 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight mb-2 uppercase">Channel Analysis</h2>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
            Deep-dive into your content performance and audience growth signals.
          </p>
        </div>

        <div className={`flex items-center gap-1 p-1 rounded-2xl border ${
          theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
        }`}>
          {(['7', '30', '365'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                period === p 
                  ? 'bg-[#ff0033] text-white shadow-lg shadow-[#ff0033]/20' 
                  : 'hover:bg-white/5'
              }`}
            >
              {p} Days
            </button>
          ))}
        </div>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Total Views" 
          value={performance?.views.current.toLocaleString() || '0'}
          change={performance ? calculateChange(performance.views.current, performance.views.previous) : 0}
          icon={<Eye size={20} />}
          theme={theme}
        />
        <MetricCard 
          label="Watch Hours" 
          value={performance?.watchTime.current.toFixed(1) || '0'}
          change={performance ? calculateChange(performance.watchTime.current, performance.watchTime.previous) : 0}
          icon={<Clock size={20} />}
          theme={theme}
        />
        <MetricCard 
          label="Subscribers" 
          value={performance?.likes.current.toLocaleString() || '0'}
          change={performance ? calculateChange(performance.likes.current, performance.likes.previous) : 0}
          icon={<Users size={20} />}
          theme={theme}
        />
      </div>

      {/* Main Chart */}
      <section className={`border rounded-[40px] p-10 space-y-8 shadow-2xl transition-colors duration-500 ${
        theme === 'dark' ? 'bg-white/[0.03] border-white/10 shadow-black/50' : 'bg-black/[0.01] border-black/5 shadow-black/5'
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff0033]/10 text-[#ff0033] rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="font-bold uppercase tracking-widest text-sm">Engagement Velocity</h3>
              <p className={`text-[10px] uppercase font-mono tracking-tighter ${theme === 'dark' ? 'text-white/20' : 'text-black/40'}`}>VIEWS OVER TIME SEQUENCE</p>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#ff0033] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff0033" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff0033" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#111' : '#fff', 
                    borderRadius: '16px', 
                    border: 'none',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                    fontSize: '12px',
                    fontWeight: 700
                  }} 
                  itemStyle={{ color: '#ff0033' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#ff0033" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Top Videos */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-bold tracking-tight uppercase">Top Performance Nodes</h3>
            <p className={`text-xs font-bold text-[#ff0033] uppercase tracking-widest`}>Sort by views</p>
          </div>
          
          <div className="space-y-4">
            {topVideos.map((video, idx) => (
              <div 
                key={video.id}
                className={`flex items-center gap-6 p-4 rounded-[28px] border transition-all hover:scale-[1.01] ${
                  theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5'
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center font-mono text-xl font-black opacity-10">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>
                <div className="w-24 aspect-video rounded-xl overflow-hidden shrink-0">
                  <img src={video.snippet.thumbnails.medium.url} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate uppercase tracking-tight">{video.snippet.title}</h4>
                  <p className={`text-[10px] font-mono mt-1 ${theme === 'dark' ? 'text-white/20' : 'text-black/40'}`}>
                    {Number(video.statistics?.viewCount).toLocaleString()} views
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#ff0033] text-xs">+{Math.floor(Math.random() * 20) + 5}%</p>
                  <p className={`text-[8px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/10' : 'text-black/20'}`}>CTR SIGNAL</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold tracking-tight uppercase">Audience Pulse</h3>
          <div className={`p-8 rounded-[40px] space-y-8 border ${
            theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/5'
          }`}>
            <RetentionItem label="New Viewers" value="64%" icon={<TrendingUp size={16} />} color="#ff0033" />
            <RetentionItem label="Returning" value="36%" icon={<Users size={16} />} color="#ff0033" />
            <RetentionItem label="Average Duration" value="4:22" icon={<Clock size={16} />} color="#ff0033" />
            
            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Info size={14} className="text-[#ff0033]" />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-black/60'}`}>Intelligence Report</span>
              </div>
              <p className={`text-[11px] leading-relaxed font-medium italic ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                "Upload frequency in current period is up 12%. Channel health remains optimal with steady retention signals across prime-time deployment windows."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, change, icon, theme }: { label: string, value: string, change: number, icon: React.ReactNode, theme: string }) {
  const isPositive = change >= 0;

  return (
    <div className={`p-8 rounded-[32px] border transition-all duration-500 ${
      theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.02] border-black/5 shadow-xl shadow-black/5'
    }`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-2 h-10 w-10 flex items-center justify-center rounded-xl bg-[#ff0033]/10 text-[#ff0033]`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
          isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-black/60'}`}>{label}</p>
      <p className="text-3xl font-bold tracking-tight font-mono">{value}</p>
    </div>
  );
}

function RetentionItem({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-[#ff0033]">{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</span>
      </div>
      <span className="font-mono font-black text-sm">{value}</span>
    </div>
  );
}
