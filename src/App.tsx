/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { YouTubeProvider, useYouTube } from './components/YouTubeContext';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import AuthView from './components/AuthView';
import Dashboard from './components/Dashboard';
import UploadView from './components/UploadView';
import ContentView from './components/ContentView';
import SettingsView from './components/SettingsView';
import AnalyticsView from './components/AnalyticsView';
import { TrendingUp, Video, Upload, Settings, LogOut, AlertCircle, ArrowUpRight, BarChart3, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AppContent = () => {
  const { tokens, channel, logout, isLoading, quotaExceeded, analyticsDisabled, setQuotaExceeded, error } = useYouTube();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis' | 'videos' | 'editor' | 'settings'>('dashboard');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const updateDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    updateDesktop();
    window.addEventListener('resize', updateDesktop);
    return () => window.removeEventListener('resize', updateDesktop);
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-[#fafafa] text-black'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#ff0033] border-t-transparent rounded-full animate-spin" />
          <p className={`font-bold uppercase tracking-widest text-xs ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Initializing...</p>
        </div>
      </div>
    );
  }

  if (quotaExceeded) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-8 ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-[#fafafa] text-black'}`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-md border rounded-[40px] p-10 text-center ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/10'}`}
        >
          <div className="w-20 h-20 bg-yellow-500/20 text-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h3 className="text-2xl font-bold mb-4 tracking-tight">API Quota Depleted</h3>
          <p className={`${theme === 'dark' ? 'text-white/40' : 'text-black/40'} text-sm leading-relaxed mb-8`}>
            The YouTube daily request limit has been reached. This usually resets at midnight Pacific Time.
          </p>
          <div className="flex flex-col gap-3">
            <a 
              href="https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                theme === 'dark' ? 'bg-white text-black hover:bg-[#ff0033] hover:text-white' : 'bg-black text-white hover:bg-[#ff0033]'
              }`}
            >
              Check Console <ArrowUpRight size={14} />
            </a>
            <button 
              onClick={logout}
              className={`text-[10px] font-bold uppercase tracking-widest pt-2 ${theme === 'dark' ? 'text-white/20 hover:text-white' : 'text-black/20 hover:text-black'}`}
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!tokens || !channel) {
    return <AuthView />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onOpenUpload={() => setIsUploadModalOpen(true)} onNavigate={setActiveTab} />;
      case 'analysis': return <AnalyticsView />;
      case 'videos': return <ContentView />;
      case 'settings': return <SettingsView />;
      default: return (
        <div className="flex flex-col items-center justify-center h-[80vh] opacity-40 text-center p-6">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
            <TrendingUp size={40} />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">Editor Protocol Pending</h3>
          <p className="font-semibold uppercase tracking-wider text-[10px]">Coming Soon to Studio Beyond Limits</p>
        </div>
      );
    }
  };

  return (
    <div className={`flex min-h-screen font-sans selection:bg-[#ff0033] selection:text-white transition-colors duration-500 overflow-hidden ${
      theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-[#fafafa] text-black'
    }`}>
      {/* Mobile Header */}
      <header className={`lg:hidden fixed top-0 left-0 w-full z-[80] border-b backdrop-blur-xl px-6 py-4 flex items-center justify-between transition-colors duration-500 ${
        theme === 'dark' ? 'bg-black/80 border-white/5' : 'bg-white/80 border-black/5'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#ff0033] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#ff0033]/20">
            <Video size={18} />
          </div>
          <h1 className="font-bold text-lg tracking-tight">TUBE<span className="text-[#ff0033]">AI</span></h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-2 rounded-xl border transition-all ${
            theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5 text-black'
          }`}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Error Overlay */}
      <AnimatePresence>
        {error && !quotaExceeded && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-[300] w-[calc(100%-2rem)] max-w-sm"
          >
            <div className={`p-6 rounded-3xl border shadow-2xl flex gap-4 ${
              theme === 'dark' ? 'bg-black border-red-500/20' : 'bg-white border-red-500/20'
            }`}>
              <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-xs uppercase tracking-widest text-red-500">System Error</p>
                <p className="text-xs opacity-60 leading-relaxed truncate max-w-[200px]">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Pro Design */}
      <AnimatePresence>
        {(isSidebarOpen || isDesktop) && (
          <>
            {/* Mobile Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`w-72 border-r p-8 flex flex-col fixed lg:sticky top-0 h-screen z-[100] transition-colors duration-500 overflow-y-auto overflow-x-hidden ${
                theme === 'dark' ? 'bg-black border-white/5' : 'bg-white border-black/5 shadow-xl shadow-black/5'
              }`}
            >
              <div className="flex items-center gap-4 mb-16">
                <div className="w-12 h-12 bg-[#ff0033] rounded-2xl flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,0,51,0.3)]">
                  <Video size={28} />
                </div>
                <h1 className="font-bold text-2xl tracking-tight">TUBE<span className="text-[#ff0033]">AI</span></h1>
              </div>

              <nav className="flex-1 space-y-4">
                <NavItem 
                  icon={<TrendingUp size={22} />} 
                  label="Dashboard" 
                  active={activeTab === 'dashboard'} 
                  onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                  theme={theme}
                />
                <NavItem 
                  icon={<BarChart3 size={22} />} 
                  label="Analysis" 
                  active={activeTab === 'analysis'} 
                  onClick={() => { setActiveTab('analysis'); setIsSidebarOpen(false); }}
                  theme={theme}
                />
                <NavItem 
                  icon={<Video size={22} />} 
                  label="Contents" 
                  active={activeTab === 'videos'}
                  onClick={() => { setActiveTab('videos'); setIsSidebarOpen(false); }}
                  theme={theme}
                />
                <NavItem 
                  icon={<Upload size={22} />} 
                  label="Editor" 
                  active={activeTab === 'editor'}
                  onClick={() => { setActiveTab('editor'); setIsSidebarOpen(false); }}
                  theme={theme}
                />
                <NavItem 
                  icon={<Settings size={22} />} 
                  label="Settings" 
                  active={activeTab === 'settings'}
                  onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                  theme={theme}
                />
              </nav>

              <div className="mt-auto space-y-6 pt-10">
                <div className={`border p-4 rounded-2xl flex items-center gap-3 transition-colors ${
                  theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'
                }`}>
                  <img 
                    src={channel.snippet.thumbnails.default.url} 
                    className={`w-10 h-10 rounded-xl transition-all cursor-pointer ${theme === 'dark' ? 'grayscale hover:grayscale-0' : ''}`}
                    alt="Channel"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate uppercase tracking-widest">{channel.snippet.title}</p>
                    <p className={`text-[10px] font-mono font-bold tracking-tighter uppercase ${theme === 'dark' ? 'text-white/20' : 'text-black/40'}`}>LIVE MONITORING</p>
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group font-bold text-xs uppercase tracking-widest ${
                    theme === 'dark' ? 'text-white/30 hover:text-[#ff0033] hover:bg-white/[0.02]' : 'text-black/30 hover:text-[#ff0033] hover:bg-black/[0.02]'
                  }`}
                >
                  <div className="group-hover:scale-110 transition-transform">
                    <LogOut size={20} />
                  </div>
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 overflow-x-hidden relative lg:pt-0 pt-20">
        {/* Subtle noise and glow */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none ${
          theme === 'dark' ? 'bg-[#ff0033]/5' : 'bg-[#ff0033]/2'
        }`} />
        
        <div className="relative z-10 min-h-full">
          {renderContent()}
        </div>
      </main>

      <AnimatePresence>
        {isUploadModalOpen && (
          <UploadView onClose={() => setIsUploadModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};


function NavItem({ icon, label, active, onClick, theme }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, theme: string }) {
  const activeClasses = theme === 'dark' 
    ? 'bg-white/5 text-white shadow-[0_0_20px_rgba(255,255,255,0.02)]' 
    : 'bg-black/5 text-black shadow-lg shadow-black/5';
  
  const inactiveClasses = theme === 'dark'
    ? 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
    : 'text-black/30 hover:text-black/60 hover:bg-black/[0.02]';

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
        active ? activeClasses : inactiveClasses
      } ${active ? 'active-rail' : ''}`}
    >
      <div className={`${active ? 'text-[#ff0033]' : 'text-inherit group-hover:text-inherit'} transition-colors`}>
        {icon}
      </div>
      <span className="font-semibold text-[11px] uppercase tracking-wider">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <YouTubeProvider>
        <AppContent />
      </YouTubeProvider>
    </ThemeProvider>
  );
}
