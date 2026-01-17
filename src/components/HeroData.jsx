import { useIllumigoonStore } from '../api';
import React from 'react';
import { Sun, Power, RotateCcw } from 'lucide-react';

export function HeroData({ status }) {
    const { setPower, reboot } = useIllumigoonStore();

    // Determine if we have a valid status or loading
    const animationName = status?.animation || "Loading...";
    const brightness = status?.brightness || 0;
    const isPowered = status?.power ?? true;

    return (
        <section className="premium-card p-6 mb-8 relative overflow-hidden flex flex-col gap-6">
            {/* Subtle background gradient */}
            <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${isPowered ? 'bg-brand-500/10' : 'bg-black/0'}`} />

            <div className="relative z-10 flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2 block">
                    System Status
                </span>

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-white tracking-tight">
                            {isPowered ? animationName : "Standby"}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${isPowered ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                            <span className="text-xs text-zinc-400 font-mono">
                                {isPowered ? "SYSTEM ACTIVE" : "SYSTEM OFFLINE"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-4 gap-3">
                {/* Power Toggle */}
                <button
                    onClick={() => setPower(!isPowered)}
                    className={`col-span-3 flex items-center justify-center gap-3 p-4 rounded-xl border font-medium transition-all duration-300 ${isPowered
                        ? 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800 text-zinc-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    <Power size={20} className={isPowered ? 'text-brand-400' : ''} />
                    <span>{isPowered ? "Enter Standby Mode" : "Wake Up System"}</span>
                </button>

                {/* Panic / Reboot */}
                <button
                    onClick={() => { if (window.confirm('Are you sure you want to hard reset the device?')) reboot(); }}
                    className="col-span-1 flex items-center justify-center p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                    title="Hard Reset (Panic Button)"
                >
                    <RotateCcw size={20} />
                </button>
            </div>

            {/* Brightness Control integrated into Hero (Only visible when powered) */}
            <div className={`bg-zinc-900/80 rounded-xl p-4 border border-white/5 transition-opacity duration-500 ${isPowered ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Sun size={16} />
                        <span className="text-xs font-medium uppercase tracking-wider">Master Brightness</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-300">{brightness}%</span>
                </div>

                {/* Custom Range Slider Styling */}
                <div className="relative h-12 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max="255"
                        defaultValue={brightness} // TODO: Bind to actual onChange later
                        className="w-full h-full opacity-0 absolute z-20 cursor-pointer"
                    />
                    {/* Viz track */}
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                        <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-300"
                            style={{ width: `${(brightness / 255) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
