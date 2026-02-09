import React, { useEffect, useState } from 'react';
import { useIllumigoonStore } from '../api';
import { Network, Server, Router, Check, X } from 'lucide-react';

export const PeerList = () => {
    const { peers, targetIp, setTargetIp, fetchPeers, renameDevice } = useIllumigoonStore();
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchPeers();
        const interval = setInterval(fetchPeers, 15000);
        return () => clearInterval(interval);
    }, [fetchPeers]);

    const handleStartEdit = (peer, e) => {
        e.stopPropagation();
        setEditingId(peer.id);
        setEditName(peer.name || peer.id.substring(0, 8));
    };

    const handleSaveEdit = (peer, e) => {
        e.stopPropagation();
        if (editName.trim()) {
            if (peer.self || targetIp.includes(peer.ip)) {
                renameDevice(editName.trim());
            }
        }
        setEditingId(null);
        setEditName('');
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setEditingId(null);
        setEditName('');
    };

    const handleKeyDown = (e, peer) => {
        if (e.key === 'Enter') {
            handleSaveEdit(peer, e);
        } else if (e.key === 'Escape') {
            handleCancelEdit(e);
        }
    };

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
                    const isTarget = targetIp.includes(peer.ip) || (peer.self && targetIp === '');
                    const isEditing = editingId === peer.id;
                    const displayName = peer.name || `Device ${peer.id.substring(0, 6)}`;

                    return (
                        <div
                            key={peer.id}
                            onClick={() => !peer.self && setTargetIp(peer.ip)}
                            className={`
                                group flex flex-col items-start min-w-[160px] p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer active:scale-95
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

                            {/* Device Name with Edit UI */}
                            {isEditing ? (
                                <div className="flex items-center gap-1 w-full mb-1" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, peer)}
                                        className="flex-1 bg-zinc-800 border border-brand-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        autoFocus
                                        maxLength={31}
                                    />
                                    <button
                                        onClick={(e) => handleSaveEdit(peer, e)}
                                        className="p-1 hover:bg-emerald-500/20 rounded transition-colors"
                                    >
                                        <Check size={12} className="text-emerald-400" />
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                    >
                                        <X size={12} className="text-red-400" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 w-full mb-1">
                                    <span className={`text-sm font-medium truncate ${isTarget ? 'text-white' : 'text-zinc-300'}`}>
                                        {displayName}
                                    </span>
                                    <button
                                        onClick={(e) => handleStartEdit(peer, e)}
                                        className="text-[10px] text-brand-400 hover:text-brand-300 hover:bg-white/10 px-1.5 py-0.5 rounded"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}

                            <span className="text-[10px] font-mono text-zinc-500">
                                {peer.ip}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
};
