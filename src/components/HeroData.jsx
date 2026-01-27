import { useIllumigoonStore } from '../api';
import React from 'react';
import { Power, RotateCcw } from 'lucide-react';

export function HeroData({ status }) {
    const { setPower, reboot } = useIllumigoonStore();

    // Determine if we have a valid status or loading
    const animationName = status?.animation || "Loading...";

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
                            {status?.version && (
                                <span className="text-xs text-zinc-500 font-mono ml-2">
                                    v{status.version}
                                </span>
                            )}
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


        </section>
    );
}
