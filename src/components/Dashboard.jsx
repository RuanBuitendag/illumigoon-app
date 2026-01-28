import React, { useState } from 'react';
import { useIllumigoonStore } from '../api';
import { GroupContainer } from './GroupContainer';
import { Plus } from 'lucide-react';

export const Dashboard = () => {
    const { peers, knownGroups, addGroup } = useIllumigoonStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Categorize Peers
    // 1. Grouped: Map of GroupName -> [Peers]
    // 2. Lobby: Peers with no group or unknown group

    // Initialize groups with empty arrays from knownGroups to ensure they show up even if empty
    const groupedPeers = {};
    knownGroups.forEach(g => {
        groupedPeers[g] = [];
    });

    const lobby = [];

    peers.forEach(peer => {
        if (peer.group && knownGroups.includes(peer.group)) {
            if (!groupedPeers[peer.group]) groupedPeers[peer.group] = [];
            groupedPeers[peer.group].push(peer);
        } else {
            lobby.push(peer);
        }
    });

    const handleCreateGroup = (e) => {
        e.preventDefault();
        if (newGroupName.trim()) {
            addGroup(newGroupName.trim());
            setNewGroupName('');
            setIsCreating(false);
        }
    };

    return (
        <div className="w-full pb-20">
            {/* Header / Actions */}
            <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-sm font-medium text-zinc-400">Network Overview</h2>

                {isCreating ? (
                    <form onSubmit={handleCreateGroup} className="flex items-center gap-2">
                        <input
                            autoFocus
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Group Name"
                            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-500 w-32"
                            onBlur={() => !newGroupName && setIsCreating(false)}
                        />
                        <button
                            type="submit"
                            className="bg-brand-500 text-brand-950 p-1 rounded hover:bg-brand-400"
                        >
                            <Plus size={14} />
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors bg-brand-500/5 px-2 py-1 rounded-md border border-brand-500/10"
                    >
                        <Plus size={12} />
                        New Group
                    </button>
                )}
            </div>

            {/* Board */}
            <div className="flex flex-wrap items-start gap-4">

                {/* Lobby (Always First or user preference?) */}
                <GroupContainer name="Lobby" peers={lobby} isLobby={true} />

                {/* Groups */}
                {Object.entries(groupedPeers).map(([groupName, groupPeers]) => (
                    <GroupContainer key={groupName} name={groupName} peers={groupPeers} />
                ))}

            </div>

            {/* Empty State Help */}
            {peers.length === 0 && (
                <div className="mt-12 text-center">
                    <p className="text-zinc-600 text-sm">No devices found.</p>
                    <p className="text-zinc-700 text-xs mt-1">Make sure devices are powered on and on the same WiFi.</p>
                </div>
            )}
        </div>
    );
};
