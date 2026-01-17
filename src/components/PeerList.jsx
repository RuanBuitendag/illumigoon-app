import React, { useEffect } from 'react';
import { useIllumigoonStore } from '../api';
import { Network, Server, Router } from 'lucide-react';

export const PeerList = () => {
    const { peers, targetIp, setTargetIp, fetchPeers } = useIllumigoonStore();

    useEffect(() => {
        fetchPeers();
        const interval = setInterval(fetchPeers, 15000);
        return () => clearInterval(interval);
    }, [fetchPeers]);

    if (!peers || peers.length === 0) return (
        <div className="mb-8">
            <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Network size={12} /> Mesh Network
            </h3>
            <div className="text-xs text-zinc-600 italic px-2">Scanning for peers...</div>
        </div>
    );

    return (
        <div className="mb-8">
            <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Network size={12} /> Mesh Network
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                {peers.map(peer => {
                    // Check if this peer is the one we are currently targeting
                    // peer.ip might be "192.168.1.15" and targetIp might be "http://192.168.1.15"
                    const isTarget = targetIp.includes(peer.ip) || (peer.self && targetIp === '');

                    return (
                        <button
                            key={peer.id}
                            onClick={() => !peer.self && setTargetIp(peer.ip)}
                            disabled={peer.self && targetIp === ''} // Already on self
                            className={`
                                group flex flex-col items-start min-w-[140px] p-3 rounded-xl border text-left transition-all duration-200 active:scale-95
                                ${isTarget
                                    ? 'bg-brand-500/10 border-brand-500/50'
                                    : 'bg-zinc-900 border-white/5 hover:border-white/10 hover:bg-zinc-800'}
                            `}
                        >
                            <div className="flex items-center gap-2 mb-2 w-full justify-between">
                                <div className="flex items-center gap-2">
                                    {peer.role === 'MASTER' ? <Server size={14} className="text-amber-400" /> : <Router size={14} className="text-zinc-500" />}
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isTarget ? 'text-brand-300' : 'text-zinc-400'}`}>
                                        {peer.role}
                                    </span>
                                </div>
                                {peer.self && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]" />}
                            </div>

                            <span className="text-xs font-mono text-zinc-300 mb-0.5">
                                {peer.ip}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-600">
                                ID: {peer.id.substring(0, 6)}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
};
