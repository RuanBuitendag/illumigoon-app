import React, { useEffect } from 'react';
import { useIllumigoonStore } from './api';
import { Header } from './components/Header';
import { HeroData } from './components/HeroData';
import { BaseAnimationSelector } from './components/BaseAnimationSelector';
import { AnimationSelector } from './components/AnimationSelector';
import { ParamControls } from './components/ParamControls';
import { DeviceSettings } from './components/DeviceSettings';
import { Dashboard } from './components/Dashboard';

function App() {
  const { isConnected, connectWebSocket, fetchAnimations, fetchBaseAnimations, fetchParams, status } = useIllumigoonStore();


  useEffect(() => {
    connectWebSocket();
    // Initial fetch of peers might be needed to start discovery if not connected yet
    useIllumigoonStore.getState().fetchPeers();

    const interval = setInterval(() => {
      fetchParams();
      useIllumigoonStore.getState().fetchPeers();
    }, 5000); // Polling every 5s for params and peers
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen">
        <Header isConnected={isConnected} />

        <main className="flex-1 w-full pb-20 animate-fade-in space-y-8">
          {/* Groups Dashboard - Front and Center */}
          <section className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5">
            <Dashboard />
          </section>

          {/* Controls Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: Status & Controls */}
            <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6 h-fit">
              <HeroData status={status} />
              <DeviceSettings />
              <ParamControls />
            </div>

            {/* Right Column: Animations Grid */}
            <div className="lg:col-span-8 flex flex-col space-y-8">
              <BaseAnimationSelector />
              <AnimationSelector />
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
