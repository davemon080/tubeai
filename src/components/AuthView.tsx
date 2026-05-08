import React from 'react';
import { motion } from 'motion/react';
import { useYouTube } from './YouTubeContext';
import { useTheme } from './ThemeContext';
import { Video, Zap, Shield, BarChart3, Globe, Sparkles, Play, ChevronRight, Github, Twitter, Youtube } from 'lucide-react';

export default function AuthView() {
  const { login } = useYouTube();
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-500 overflow-x-hidden ${
      theme === 'dark' ? 'bg-[#050505] text-white font-sans' : 'bg-[#fafafa] text-black font-sans'
    }`}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ff0033] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#ff0033]/20">
            <Video size={24} />
          </div>
          <h1 className="font-bold text-xl tracking-tight">TUBE<span className="text-[#ff0033]">AI</span></h1>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest opacity-60">
          <a href="#features" className="hover:text-[#ff0033] transition-colors text-inherit no-underline">Features</a>
          <a href="#vision" className="hover:text-[#ff0033] transition-colors text-inherit no-underline">Vision</a>
          <a href="#demo" className="hover:text-[#ff0033] transition-colors text-inherit no-underline">Showcase</a>
        </div>
        <button 
          onClick={login}
          className="px-6 py-2 bg-[#ff0033] text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[#ff0033]/20 hover:scale-105 active:scale-95 transition-all"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff0033]/10 text-[#ff0033] text-[9px] font-black uppercase tracking-widest mb-6">
              <Sparkles size={12} />
              Next-Gen Content Protocol
            </div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[0.95]">
              Studio <span className="text-[#ff0033]">Beyond</span> Limits
            </h2>
            <p className={`text-lg md:text-xl font-medium leading-relaxed max-w-lg mb-10 ${
              theme === 'dark' ? 'text-white/40' : 'text-black/40'
            }`}>
              The world's most advanced AI-powered dashboard for YouTube creators. Automate metadata, analyze growth signals, and deploy content with pinpoint precision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={login}
                className="group px-8 py-4 bg-[#ff0033] text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-[#ff0033]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Launch Console
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className={`px-8 py-4 rounded-2xl border flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs ${
                theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
              }`}>
                <Play size={16} className="text-[#ff0033]" />
                Explore Documentation
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#ff0033] rounded-[40px] blur-[100px] opacity-10 animate-pulse" />
            <div className={`relative aspect-video rounded-[40px] border overflow-hidden shadow-2xl ${
              theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-black/10'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#ff0033]/20 to-transparent pointer-events-none" />
              <img 
                src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop" 
                className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700" 
                alt="Studio Performance" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div onClick={login} className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                  <Play size={32} fill="white" />
                </div>
              </div>
              <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">System Status</p>
                  <p className="text-xs font-mono font-bold text-white">PRO_DECODER_v2.0 // STABLE</p>
                </div>
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-[#ff0033] border-2 border-black" />)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Content Section */}
      <section id="demo" className="py-20 px-6 md:px-12 bg-black/[0.02]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight uppercase">Performance Showcase</h3>
            <p className={`font-medium max-w-xl mx-auto ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
              Watch how our automated workflows transform raw footage into peak visibility events across the global YouTube network.
            </p>
          </div>
          
          <div className={`aspect-video rounded-[40px] overflow-hidden border shadow-2xl relative ${
            theme === 'dark' ? 'border-white/10 bg-black' : 'border-black/10 bg-white'
          }`}>
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0&mute=1&loop=1&playlist=jfKfPfyJRdk" 
              title="TubeAI Showcase" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="opacity-90"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Sparkles size={24} />} 
            label="AI Metadata" 
            title="Smarter Titles & Descriptions"
            desc="Gemini-powered title suggestions and deep-description generation for maximum SEO impact."
            theme={theme}
          />
          <FeatureCard 
            icon={<BarChart3 size={24} />} 
            label="Deep Analytics" 
            title="Real-time Signal Analysis"
            desc="Track audience retention, velocity signals, and growth trends with precision dashboards."
            theme={theme}
          />
          <FeatureCard 
            icon={<Zap size={24} />} 
            label="Bulk Uploads" 
            title="Background Deployment"
            desc="Upload massive files in the background while you continue optimizing your channel's footprint."
            theme={theme}
          />
        </div>
      </section>

      {/* Trust Section */}
      <section id="vision" className="py-20 px-6 md:px-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
          <div className="flex-1 space-y-6">
            <h3 className="text-4xl font-bold uppercase tracking-tight">Built for Scale</h3>
            <p className={`text-lg font-medium leading-relaxed ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
              Whether you're a solo creator or a massive media studio, TubeAI provides the enterprise-grade infrastructure needed to manage thousands of assets seamlessly.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:gap-12 shrink-0">
            <div className="space-y-1">
              <p className="text-4xl font-mono font-black text-[#ff0033]">99.8%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Uptime Reliability</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-mono font-black text-[#ff0033]">2M+</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">API Requests/Day</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-20 pb-10 px-6 md:px-12 border-t border-white/5 bg-inherit overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff0033] rounded-xl flex items-center justify-center text-white">
                  <Video size={24} />
                </div>
                <h1 className="font-bold text-xl tracking-tight">TUBE<span className="text-[#ff0033]">AI</span></h1>
              </div>
              <p className={`max-w-xs text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
                Advanced content orchestration protocol for the next generation of digital creators.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff0033]">Platform</h4>
              <ul className="space-y-2 text-sm font-bold opacity-60 list-none p-0">
                <li className="hover:text-[#ff0033] cursor-pointer">Login</li>
                <li className="hover:text-[#ff0033] cursor-pointer">Changelog</li>
                <li className="hover:text-[#ff0033] cursor-pointer">Developer API</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff0033]">Connect</h4>
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'} transition-colors cursor-pointer text-[#ff0033]`}>
                  <Twitter size={18} />
                </div>
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'} transition-colors cursor-pointer text-[#ff0033]`}>
                  <Github size={18} />
                </div>
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'} transition-colors cursor-pointer text-[#ff0033]`}>
                  <Youtube size={18} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest opacity-40">
            <p>© 2026 Studio Beyond Limits . All Rights Reserved</p>
            <div className="flex gap-8">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, label, title, desc, theme }: { icon: React.ReactNode, label: string, title: string, desc: string, theme: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={`p-10 rounded-[40px] border transition-all ${
        theme === 'dark' ? 'bg-white/[0.03] border-white/10 hover:border-[#ff0033]/40 shadow-2xl shadow-black/50' : 'bg-white border-black/5 hover:border-[#ff0033]/40 shadow-xl shadow-black/5'
      }`}
    >
      <div className="w-12 h-12 bg-[#ff0033]/10 text-[#ff0033] rounded-[20px] flex items-center justify-center mb-6">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#ff0033] mb-4">{label}</p>
      <h4 className="text-xl font-bold uppercase tracking-tight mb-4">{title}</h4>
      <p className={`text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>
        {desc}
      </p>
    </motion.div>
  );
}
