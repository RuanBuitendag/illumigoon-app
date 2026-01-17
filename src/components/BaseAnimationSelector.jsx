import React from 'react';
import { useIllumigoonStore } from '../api';
import { Box, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export const BaseAnimationSelector = () => {
    const { baseAnimations, setAnimation } = useIllumigoonStore();

    if (!baseAnimations || baseAnimations.length === 0) return null;

    return (
        <section className="mb-6">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
                    Create New
                </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {baseAnimations.map((anim) => (
                    <motion.button
                        key={anim}
                        whileTap={{ scale: 0.96 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setAnimation(anim)} // Selects the base animation directly
                        className="group relative h-16 rounded-xl flex items-center justify-between px-4 text-left border border-white/5 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-white/10 transition-all duration-300"
                    >
                        <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 truncate">
                            {anim}
                        </span>

                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                            <Plus size={16} />
                        </div>
                    </motion.button>
                ))}
            </div>
        </section>
    );
};
