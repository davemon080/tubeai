import React from 'react';
import { useTheme } from './ThemeContext';
import { Moon, Sun, Monitor, Bell, Shield, Smartphone, Globe, Palette } from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsView() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-4xl">
      <header>
        <h2 className="text-4xl font-bold tracking-tight mb-2 uppercase">App Settings</h2>
        <p className="text-muted-foreground font-medium">Configure your experience and visual preferences</p>
      </header>

      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff0033]">Appearance</h3>
        
        <div className="grid gap-4">
          <div className="flex items-center justify-between p-6 bg-white/[0.03] dark:bg-white/[0.03] border border-white/5 rounded-[24px]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                <Palette size={20} className="text-[#ff0033]" />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-widest">Interface Theme</p>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mt-0.5">
                  Currently set to {theme} mode
                </p>
              </div>
            </div>
            
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 relative h-10 w-24"
            >
              <div 
                className={`absolute inset-1 w-1/2 bg-white rounded-lg shadow-xl transition-all duration-500 ease-out flex items-center justify-center ${
                  theme === 'light' ? 'translate-x-0' : 'translate-x-[calc(100%-8px)]'
                }`}
              >
                {theme === 'light' ? <Sun size={14} className="text-black" /> : <Moon size={14} className="text-black" />}
              </div>
              <div className="flex-1 flex justify-center text-[10px] font-bold text-white/20 select-none">SUN</div>
              <div className="flex-1 flex justify-center text-[10px] font-bold text-white/20 select-none">MOON</div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingCard 
              icon={<Monitor size={18} />}
              title="Auto Dark Mode"
              desc="Sync with system preferences"
              enabled={false}
            />
            <SettingCard 
              icon={<Smartphone size={18} />}
              title="Compact UI"
              desc="Optimized for smaller screens"
              enabled={true}
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#ff0033]">Privacy & Security</h3>
        <div className="grid gap-4">
          <SettingCard 
            icon={<Shield size={18} />}
            title="Two-Factor Auth"
            desc="Add an extra layer of security"
            enabled={true}
          />
          <SettingCard 
            icon={<Bell size={18} />}
            title="Push Notifications"
            desc="Stay updated on video performance"
            enabled={false}
          />
        </div>
      </section>
    </div>
  );
}

function SettingCard({ icon, title, desc, enabled }: { icon: React.ReactNode, title: string, desc: string, enabled: boolean }) {
  return (
    <div className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-[24px] group hover:bg-white/[0.05] transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
          {icon}
        </div>
        <div>
          <p className="font-bold text-xs uppercase tracking-widest">{title}</p>
          <p className="text-[9px] text-muted-foreground font-semibold tracking-wider mt-0.5 uppercase">{desc}</p>
        </div>
      </div>
      <div className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${enabled ? 'bg-[#ff0033]' : 'bg-white/10'}`}>
        <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${enabled ? 'left-5' : 'left-1'}`} />
      </div>
    </div>
  );
}
