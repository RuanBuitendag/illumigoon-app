import React, { useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Server, Router, GripVertical, Check, X } from 'lucide-react';
import { useIllumigoonStore } from '../api';
import { useRef } from 'react';

export const DraggablePeerCard = ({ peer, isSelected }) => {
    const { setTargetIp, assignPeerToGroup, renameDevice, targetIp } = useIllumigoonStore();
    const dragControls = useDragControls();
    const cardRef = useRef(null);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');

    const displayName = peer.name || `Device ${peer.id.substring(0, 6)}`;
    const canEdit = peer.self || targetIp.includes(peer.ip);

    const handleStartEdit = (e) => {
        e.stopPropagation();
        setEditName(peer.name || peer.id.substring(0, 8));
        setIsEditing(true);
    };

    const handleSaveEdit = (e) => {
        e.stopPropagation();
        if (editName.trim()) {
            renameDevice(editName.trim());
        }
        setIsEditing(false);
        setEditName('');
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditName('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSaveEdit(e);
        } else if (e.key === 'Escape') {
            handleCancelEdit(e);
        }
    };

    return (
        <motion.div
            ref={cardRef}
            layoutId={`peer-${peer.id}`}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragSnapToOrigin
            whileDrag={{ scale: 1.05, zIndex: 100, cursor: 'grabbing' }}
            onDragEnd={(event, info) => {
                if (cardRef.current) {
                    const originalPointerEvents = cardRef.current.style.pointerEvents;
                    cardRef.current.style.pointerEvents = 'none';
                    const dropTarget = document.elementFromPoint(info.point.x, info.point.y)?.closest('[data-group-id]');
                    cardRef.current.style.pointerEvents = originalPointerEvents;

                    if (dropTarget) {
                        const groupId = dropTarget.getAttribute('data-group-id');
                        const currentGroup = peer.group || 'Lobby';
                        const targetGroup = groupId;

                        if (targetGroup !== currentGroup) {
                            assignPeerToGroup(peer.id === 'local' ? 'local' : peer.id, targetGroup === 'Lobby' ? '' : targetGroup);
                        }
                    }
                }
            }}
            className={`
                relative flex items-center gap-2 p-2 rounded-xl border w-full max-w-[180px] transition-colors
                ${isSelected
                    ? 'bg-zinc-900 ring-1 ring-brand-500/50 border-brand-500/20'
                    : 'bg-zinc-900 border-white/5 hover:border-white/10'}
            `}
        >
            {/* Drag Handle */}
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-1 touch-none"
            >
                <GripVertical size={16} />
            </div>

            {/* Content Container */}
            <div
                className="flex-grow flex flex-col gap-1 min-w-0 cursor-pointer"
                onClick={() => {
                    if (!peer.self) setTargetIp(peer.ip);
                }}
            >
                <div className="flex items-center gap-1.5">
                    {peer.role === 'MASTER' ? (
                        <Server size={12} className="text-amber-400 shrink-0" />
                    ) : (
                        <Router size={12} className="text-zinc-500 shrink-0" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 truncate">
                        {peer.group || 'Ungrouped'}
                    </span>
                    {peer.self && (
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)] shrink-0" />
                    )}
                </div>

                {/* Device Name - Editable */}
                {isEditing ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-zinc-800 border border-brand-500/50 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none min-w-0"
                            autoFocus
                            maxLength={31}
                        />
                        <button onClick={handleSaveEdit} className="p-0.5 hover:bg-emerald-500/20 rounded">
                            <Check size={10} className="text-emerald-400" />
                        </button>
                        <button onClick={handleCancelEdit} className="p-0.5 hover:bg-red-500/20 rounded">
                            <X size={10} className="text-red-400" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-zinc-200 truncate leading-tight">
                            {displayName}
                        </span>
                        {canEdit && (
                            <button
                                onClick={handleStartEdit}
                                className="text-[10px] text-brand-400 hover:text-brand-300 px-1 rounded shrink-0"
                            >
                                ✏️
                            </button>
                        )}
                    </div>
                )}

                <span className="text-[9px] font-mono text-zinc-600 truncate">
                    {peer.ip}
                </span>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
            )}
        </motion.div>
    );
};
