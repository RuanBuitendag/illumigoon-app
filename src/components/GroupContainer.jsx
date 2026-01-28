import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, GripHorizontal } from 'lucide-react';
import { DraggablePeerCard } from './DraggablePeerCard';
import { useIllumigoonStore } from '../api';

export const GroupContainer = ({ name, peers, isLobby }) => {
    const { removeGroup, targetIp } = useIllumigoonStore();

    // Check if this group contains the currently targeted IP
    // This is tricky if we target by IP but group by ID.
    // 'peers' prop is list of peer objects.
    const isSelected = peers.some(p => targetIp.includes(p.ip) || (targetIp === '' && p.self));

    return (
        <div
            data-group-id={isLobby ? 'Lobby' : name}
            className={`
                flex flex-col gap-3 p-4 rounded-2xl border min-w-[180px] min-h-[200px] transition-colors
                ${isLobby
                    ? 'bg-zinc-900/50 border-dashed border-zinc-800'
                    : 'bg-zinc-900 border-white/5 hover:border-white/10'}
            `}
        >
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    {isLobby ? 'Unassigned' : name}
                    <span className="bg-zinc-800 text-zinc-500 text-[9px] px-1.5 py-0.5 rounded-full">
                        {peers.length}
                    </span>
                </h3>

                {!isLobby && (
                    <button
                        onClick={() => {
                            if (confirm(`Delete group "${name}"? Peers will be unassigned.`)) {
                                removeGroup(name);
                            }
                        }}
                        className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>

            <motion.div
                className="flex flex-col gap-2 flex-grow"
                layout
            >
                {peers.length === 0 && (
                    <div className="flex-grow flex items-center justify-center text-[10px] text-zinc-700 italic border-2 border-dashed border-zinc-800/50 rounded-lg m-1">
                        Drop here
                    </div>
                )}
                {peers.map(peer => (
                    <DraggablePeerCard
                        key={peer.id}
                        peer={peer}
                        isSelected={targetIp.includes(peer.ip) || (targetIp === '' && peer.self)}
                    />
                ))}
            </motion.div>
        </div>
    );
};
