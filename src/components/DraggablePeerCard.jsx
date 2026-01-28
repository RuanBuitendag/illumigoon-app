import React from 'react';
// Used Framer Motion instead of dnd-kit
// User approved Framer Motion. 
// Plan said: "Droppable zone using framer-motion" and "DraggablePeerCard ... with drag handles"

// Using Framer Motion for Drag and Drop
import { motion, useDragControls } from 'framer-motion';
import { Server, Router, GripVertical } from 'lucide-react';
import { useIllumigoonStore } from '../api';
import { useRef } from 'react';

export const DraggablePeerCard = ({ peer, isSelected }) => {
    const { setTargetIp, assignPeerToGroup } = useIllumigoonStore();
    const dragControls = useDragControls();
    const cardRef = useRef(null);

    return (
        <motion.div
            ref={cardRef}
            layoutId={`peer-${peer.id}`}
            drag
            dragListener={false} // Only drag via handle
            dragControls={dragControls}
            dragSnapToOrigin
            whileDrag={{ scale: 1.05, zIndex: 100, cursor: 'grabbing' }}
            onDragEnd={(event, info) => {
                // HACK: Temporarily make the card ignored by elementFromPoint
                if (cardRef.current) {
                    const originalPointerEvents = cardRef.current.style.pointerEvents;
                    cardRef.current.style.pointerEvents = 'none';

                    // Check what's underneath
                    const dropTarget = document.elementFromPoint(info.point.x, info.point.y)?.closest('[data-group-id]');

                    // Restore
                    cardRef.current.style.pointerEvents = originalPointerEvents;

                    if (dropTarget) {
                        const groupId = dropTarget.getAttribute('data-group-id');
                        // Check if group changed
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

            {/* Content Container - Clickable for selection */}
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

                <div className="flex flex-col">
                    <span className="text-xs font-mono text-zinc-200 truncate leading-tight">
                        {peer.ip}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600 truncate">
                        {peer.id.substring(0, 8)}
                    </span>
                </div>
            </div>

            {/* Selection Indicator / Status */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
            )}

        </motion.div>
    );
};
