import React, { useEffect } from 'react';
import { useIllumigoonStore } from './api';
import { ControlDeck } from './components/ControlDeck';
import { AnimationGrid } from './components/AnimationGrid';
import { PeerList } from './components/PeerList';
import { Wifi, WifiOff, Zap } from 'lucide-react';

function App() {
  const { isConnected, connectWebSocket, fetchAnimations, fetchParams, status } = useIllumigoonStore();

  useEffect(() => {
    connectWebSocket();
    fetchAnimations();
    fetchParams();

    // Polling backup for connection status or parameters
    const interval = setInterval(() => {
      fetchParams();
    }, 2000); // 2s polling to keep UI responsive if WS misses something
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto pb-20">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pt-2">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-white neon-text">
            ILLUMI<span className="text-neon-blue">GOON</span>
          </h1>
          <p className="text-xs text-slate-400">Control Interface</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isConnected ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isConnected ? 'ONLINE' : 'OFFLINE'}
        </div>
      </header>

      {/* Main Status Card */}
      <div className="glass-panel p-6 mb-8 relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-neon-blue/20 rounded-full blur-3xl group-hover:bg-neon-pink/20 transition-colors duration-1000"></div>

        <div className="relative z-10">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Current Animation</div>
          <div className="text-3xl font-bold text-white mb-4">{status.animation}</div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Zap size={12} /> BRIGHTNESS</span>
                <span className="text-xs text-slate-300">{status.brightness}</span>
              </div>
              {/* Brightness is usually global, might not be in params list? 
                         Assuming it might be added later, for now just visual placeholder or TODO 
                      */}
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-white w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PeerList />
      <AnimationGrid />
      <ControlDeck />

      <footer className="mt-12 text-center text-xs text-slate-600">
        Illumigoon v2.0 • {status.uptime}ms
      </footer>
    </div>
  );
}

export default App;
