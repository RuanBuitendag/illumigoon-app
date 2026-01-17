import React from 'react';
import { Sun } from 'lucide-react';

export function HeroData({ status }) {
    // Determine if we have a valid status or loading
    const animationName = status?.animation || "Loading...";
    const brightness = status?.brightness || 0;

    return (
        <section className="premium-card p-6 mb-8 relative overflow-hidden">
            {/* Subtle background gradient to give life without noise */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-6">
                <div>
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2 block">
                        Running Now
                    </span>
                    <h2 className="text-3xl font-semibold text-white tracking-tight">
                        {animationName}
                    </h2>
                </div>

                {/* Brightness Control integrated into Hero */}
                <div className="bg-zinc-900/80 rounded-xl p-4 border border-white/5">
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
                        {/* Thumb Viz (optional, native inputs are hard to style perfectly custom without headless UI libs, sticking to simple track for now or simple opacity hack) */}
                    </div>
                </div>
            </div>
        </section>
    );
}
