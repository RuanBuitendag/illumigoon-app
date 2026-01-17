import React from 'react';
import { useIllumigoonStore } from '../api';
import { Play, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const AnimationSelector = () => {
    const { animations, status, setAnimation } = useIllumigoonStore();

    if (!animations || animations.length === 0) return null;

    return (
        <section className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
                    Animations
                </h3>
                <span className="text-xs font-bold text-zinc-600 bg-zinc-900 px-2 py-1 rounded-md">
                    {animations.length} Available
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 content-start">
                {animations.map((anim) => {
                    const isActive = status.animation === anim;
                    return (
                        <motion.button
                            key={anim}
                            whileTap={{ scale: 0.96 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setAnimation(anim)}
                            className={`
                group relative h-24 rounded-2xl flex flex-col items-start justify-between p-4 text-left border transition-all duration-300
                ${isActive
                                    ? 'bg-brand-600 border-transparent shadow-lg shadow-brand-500/20'
                                    : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800 hover:border-white/10'
                                }
              `}
                        >
                            {/* Icon / Indicator */}
                            <div className="w-full flex justify-between items-start">
                                {isActive ? (
                                    <Play size={16} className="text-white fill-white" />
                                ) : (
                                    <Sparkles size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                )}
                                {isActive && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                )}
                            </div>

                            <span
                                className={`text-sm font-semibold tracking-tight truncate w-full ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}
                            >
                                {anim}
                            </span>

                            {/* Active Glow/Indicator specific to this card */}
                            {isActive && (
                                <div className="absolute inset-0 rounded-2xl ring-2 ring-brand-400/50 ring-offset-2 ring-offset-[#09090b] pointer-events-none" />
                            )}

                            {/* Delete Button (visible on hover or if managing) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete preset "${anim}"?`)) {
                                        useIllumigoonStore.getState().deletePreset(anim);
                                    }
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-800/80 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete Preset"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </motion.button>
                    );

                })}
            </div>
        </section>
    );
};
