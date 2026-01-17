import React from 'react';
import { useIllumigoonStore } from '../api';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

export const AnimationGrid = () => {
    const { animations, status, setAnimation } = useIllumigoonStore();

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {animations.map(anim => {
                const isActive = status.animation === anim;
                return (
                    <motion.button
                        key={anim}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setAnimation(anim)}
                        className={`
                            relative h-24 rounded-xl flex flex-col items-center justify-center p-2 border transition-all
                            ${isActive
                                ? 'bg-neon-blue/20 border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                                : 'bg-slate-800/50 border-white/5 hover:bg-slate-700/50 hover:border-white/20'}
                        `}
                    >
                        <span className={`font-semibold z-10 ${isActive ? 'text-neon-blue' : 'text-slate-300'}`}>
                            {anim}
                        </span>
                        {isActive && (
                            <div className="absolute top-2 right-2">
                                <Play size={12} className="text-neon-blue fill-neon-blue" />
                            </div>
                        )}
                    </motion.button>
                )
            })}
        </div>
    );
};
