import React, { useEffect } from 'react';
import { useIllumigoonStore } from '../api';
import { Network, Server, User } from 'lucide-react';

export const PeerList = () => {
    const { peers, targetIp, setTargetIp, fetchPeers } = useIllumigoonStore();

    useEffect(() => {
        fetchPeers();
        const interval = setInterval(fetchPeers, 5000);
        return () => clearInterval(interval);
    }, [fetchPeers]);

    return (
        <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Network size={14} /> Mesh Network
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
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
                                flex flex-col items-start min-w-[140px] p-3 rounded-lg border text-left transition-all
                                ${isTarget
                                    ? 'bg-neon-purple/20 border-neon-purple'
                                    : 'bg-slate-900 border-white/5 hover:border-white/20'}
                            `}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                {peer.role === 'MASTER' ? <Server size={14} className="text-yellow-400" /> : <User size={14} className="text-slate-400" />}
                                <span className="text-xs font-mono text-slate-400">
                                    {peer.id.substring(0, 6)}...
                                </span>
                            </div>
                            <span className="text-sm font-bold text-white uppercase">{peer.role}</span>
                            <span className="text-xs text-slate-500 mt-1">{peer.ip}</span>
                            {peer.self && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" title="This Device"></span>}
                        </button>
                    )
                })}
                {peers.length === 0 && (
                    <div className="text-sm text-slate-600 italic px-2">Scanning for peers...</div>
                )}
            </div>
        </div>
    )
};
