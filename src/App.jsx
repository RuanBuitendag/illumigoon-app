import React, { useEffect } from 'react';
import { useIllumigoonStore } from './api';
import { Header } from './components/Header';
import { HeroData } from './components/HeroData';
import { BaseAnimationSelector } from './components/BaseAnimationSelector';
import { AnimationSelector } from './components/AnimationSelector';
import { ParamControls } from './components/ParamControls';
import { PeerList } from './components/PeerList';

function App() {
  const { isConnected, connectWebSocket, fetchAnimations, fetchBaseAnimations, fetchParams, status } = useIllumigoonStore();


  useEffect(() => {
    connectWebSocket();
    fetchAnimations();
    fetchBaseAnimations();
    fetchParams();


    const interval = setInterval(() => {
      fetchParams();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen">
        <Header isConnected={isConnected} />

        <main className="flex-1 w-full pb-20 animate-fade-in">
          {/* Responsive Grid Layout: Stack on mobile, 2 columns on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

            {/* Left Column: Status & Controls (Sticky on Desktop) */}
            <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6 h-fit">
              <HeroData status={status} />
              <ParamControls />
              <div className="hidden lg:block pt-6 border-t border-white/5">
                <PeerList />
              </div>
            </div>

            {/* Right Column: Animations Grid */}
            <div className="lg:col-span-8 flex flex-col space-y-8">
              <BaseAnimationSelector />
              <AnimationSelector />

              {/* Mobile Only PeerList */}
              <div className="lg:hidden mt-8 pt-8 border-t border-white/5">
                <PeerList />
              </div>
            </div>

          </div>
        </main>

        <footer className="py-8 text-center text-[10px] text-zinc-600 uppercase tracking-widest border-t border-white/5 mt-auto">
          Illumigoon v2.0 • {status.uptime}ms • {isConnected ? 'Connected' : 'Disconnected'}
        </footer>
      </div>
    </div>
  );
}

export default App;
