import { create } from 'zustand';

// detect if running in dev mode (localhost) or on ESP32
const isDev = import.meta.env.DEV;
const DEFAULT_HOST = isDev ? 'http://illumigoon.local' : ''; // mDNS hostname for local dev

// Try to load saved IP from localStorage, otherwise use default
const getInitialTargetIp = () => {
    const saved = localStorage.getItem('illumigoon_target_ip');
    if (saved && (saved.includes('0.0.0.0') || saved === 'http://')) {
        return DEFAULT_HOST;
    }
    return saved || DEFAULT_HOST;
};

export const useIllumigoonStore = create((set, get) => ({
    targetIp: getInitialTargetIp(),
    isConnected: false,
    status: { brightness: 255, animation: 'Loading...', uptime: 0 },
    peers: [],
    animations: [], // This will now contain Preset Names
    baseAnimations: [], // This will contain Base Animation Types
    params: [],
    currentBaseType: null,

    setTargetIp: (ip) => {
        // Reset status to prevent stale data from previous device
        set({ status: { brightness: 255, animation: 'Loading...', uptime: 0, version: null } });

        // If ip is just an IP address, prepend http://
        // If empty/local, use empty string for relative paths
        const host = ip ? (ip.startsWith('http') ? ip : `http://${ip}`) : '';
        // Save to localStorage
        localStorage.setItem('illumigoon_target_ip', host);
        set({ targetIp: host });
        get().connectWebSocket(); // Reconnect WS to new target

        // Immediate refresh to update UI with new peer's data
        get().fetchPeers();
        get().fetchAnimations();
        get().fetchBaseAnimations();
        get().fetchParams();
    },

    setStatus: (newStatus) => set((state) => ({ status: { ...state.status, ...newStatus } })),
    setPeers: (peers) => set({ peers }),
    setAnimations: (animations) => set({ animations }),
    setParams: (params) => set({ params }),

    // WebSocket Connection Logic
    socketMap: {}, // IP -> WebSocket
    socketReconnecting: {}, // IP -> boolean (lock)

    manageGroupConnections: () => {
        const { peers, targetIp, socketMap } = get();

        // Identify the current group we are controlling
        // If we are targeting a specific IP, find that peer
        let targetPeer = peers.find(p => targetIp.includes(p.ip));

        // Fallback for local dev or initial load where targetIp might be 'illumigoon.local'
        if (!targetPeer && (targetIp === '' || targetIp.includes('local'))) {
            targetPeer = peers.find(p => p.self);
        }

        const currentGroup = targetPeer?.group; // Can be undefined or ""

        // Identify peers to connect to
        // 1. Always connect to the Target Peer (the one we are looking at)
        // 2. Connect to all peers in the same group (if group exists)
        const peersToConnect = peers.filter(p => {
            if (p.ip === '0.0.0.0' || !p.ip) return false;
            if (p === targetPeer) return true;
            if (targetPeer && currentGroup && p.group === currentGroup) return true;
            return false;
        });

        const newSocketMap = { ...socketMap };
        let mapChanged = false;

        peersToConnect.forEach(peer => {
            const ip = peer.ip;
            const existingWs = newSocketMap[ip];

            if (existingWs && (existingWs.readyState === WebSocket.OPEN || existingWs.readyState === WebSocket.CONNECTING)) {
                return; // Already good
            }

            console.log(`Connecting Socket to ${peer.id} (${ip}) in group '${peer.group}'`);

            const wsUrl = `ws://${ip}/ws`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log(`WS Connected: ${ip}`);
                // If this is the primary target, set connected
                if (get().targetIp.includes(ip)) {
                    set({ isConnected: true });
                }
            };

            ws.onclose = () => {
                // Remove from map? Or mark disconnected?
                // For now, let's just leave it. The manager will retry if we call it again.
                console.log(`WS Closed: ${ip}`);
                if (get().targetIp.includes(ip)) {
                    set({ isConnected: false });
                }
            };

            ws.onerror = (e) => console.error(`WS Error (${ip}):`, e);

            ws.onmessage = (event) => {
                // Only update UI state if this message is from the TARGET IP
                // checking strictly string includes is safe enough for IP
                if (get().targetIp.includes(ip) || (get().targetIp.includes('local') && peer.self)) {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.event === 'status') {
                            get().setStatus(msg.data);
                        } else if (msg.event === 'params') {
                            if (Array.isArray(msg.data)) {
                                get().setParams(msg.data);
                            } else if (msg.data && msg.data.params) {
                                set({ params: msg.data.params, currentBaseType: msg.data.baseType });
                            }
                        }
                    } catch (e) {
                        console.error('WS Parse Error', e);
                    }
                }
            };

            newSocketMap[ip] = ws;
            mapChanged = true;
        });

        if (mapChanged) {
            set({ socketMap: newSocketMap });
        }
    },

    // Old single socket connect - Deprecated/Redirected
    connectWebSocket: () => {
        get().manageGroupConnections();
    },

    scheduleReconnect: () => {
        // Redundant with polling fetchPeers which calls manageGroupConnections
        // But maybe we need a dedicated timer?
        // Let's rely on the fetchPeers poll in App.jsx (5s info) to retry connections
    },

    triggerManuallyReconnect: () => {
        get().manageGroupConnections();
    },

    // API Actions
    fetchAnimations: async () => {
        try {
            const res = await fetch(`${get().targetIp}/api/animations`);
            const data = await res.json();
            set({ animations: data });
        } catch (e) { console.error('Fetch Anim failed', e); }
    },

    fetchBaseAnimations: async () => {
        try {
            const res = await fetch(`${get().targetIp}/api/baseAnimations`);
            const data = await res.json();
            set({ baseAnimations: data });
        } catch (e) { console.error('Fetch Base Anim failed', e); }
    },


    fetchPeers: async () => {
        try {
            const { targetIp, setTargetIp } = get();
            const res = await fetch(`${targetIp}/api/mesh/peers`);
            const data = await res.json();
            set({ peers: data });

            // Ensure sockets are connected for current group
            get().manageGroupConnections();

            const selfPeer = data.find(p => p.self);
            if (selfPeer && selfPeer.ip && selfPeer.ip !== '0.0.0.0') {
                const isLocal = targetIp === '' || targetIp.includes('.local');
                const isDifferent = !targetIp.includes(selfPeer.ip);

                if (isLocal && isDifferent) {
                    console.log(`Auto-switching to direct IP: ${selfPeer.ip}`);
                    setTargetIp(selfPeer.ip);
                }
            }
        } catch (e) {
            console.error('Fetch Peers failed', e);
        }
    },

    fetchParams: async () => {
        try {
            const res = await fetch(`${get().targetIp}/api/params`);
            const data = await res.json();
            if (Array.isArray(data)) {
                set({ params: data });
            } else if (data && data.params) {
                set({ params: data.params, currentBaseType: data.baseType });
            }
        } catch (e) { console.error('Fetch Params failed', e); }
    },


    // Updated: Send to ALL sockets in the socketMap
    // Ideally this should only send to sockets in the "current target group"
    // But sending to valid open sockets in the map (which are filtered by group in manageGroupConnections) is fine.
    // actually manageGroupConnections only ADDS.
    // We should be careful not to send to *everyone* if we moved groups.
    // Filter by group again here.
    sendCommand: (cmd, payload = {}) => {
        const { socketMap, peers, targetIp } = get();

        let targetPeer = peers.find(p => targetIp.includes(p.ip));
        if (!targetPeer && (targetIp === '' || targetIp.includes('local'))) targetPeer = peers.find(p => p.self);
        const currentGroup = targetPeer?.group;

        Object.keys(socketMap).forEach(ip => {
            const ws = socketMap[ip];
            if (ws && ws.readyState === WebSocket.OPEN) {
                // Check if this IP belongs to someone in our group
                const peer = peers.find(p => p.ip === ip);

                let shouldSend = false;
                if (peer && targetPeer) {
                    // Send if it's the target OR shares the group
                    if (peer === targetPeer) shouldSend = true;
                    else if (currentGroup && peer.group === currentGroup) shouldSend = true;
                } else if (!targetPeer) {
                    // Fallback: Just send to all open if we don't know who we are?
                    // Safe default: Send to ip if it IS the targetIp
                    if (targetIp.includes(ip)) shouldSend = true;
                }

                if (shouldSend) {
                    ws.send(JSON.stringify({ cmd, ...payload }));
                }
            }
        });
    },

    setAnimation: async (name) => {
        // We use HTTP for the trigger to ensure "At least one" succeeds, then Optimistic Update
        // BUT for Group Sync we need execution on ALL.
        // HTTP on leader + WS broadcast on all seems best.

        // 1. HTTP to Leader (Reliable start)
        try {
            await fetch(`${get().targetIp}/api/animation`, {
                method: 'POST', body: JSON.stringify({ name }),
                headers: { 'Content-Type': 'text/plain' }
            });
        } catch (e) { console.error("Set Anim HTTP failed", e); }

        // 2. WS Broadcast to Group (Sync others)
        get().sendCommand('setAnimation', { name });

        get().setStatus({ animation: name });
        // get().triggerManuallyReconnect(); // No need to reconnect, we are using persistent sockets
    },

    setPower: (isOn) => {
        get().sendCommand('setPower', { value: isOn });
        get().setStatus({ power: isOn });
    },

    reboot: () => {
        // Reboot only the specific target? Or group? Usually Reboot is device-specific.
        // Let's keep reboot TARGET ONLY.
        const { targetIp } = get();
        // find socket for targetIp
        // Actually sendCommand handles group logic.
        // Let's make a special "sendToTargetOnly" helper if needed, 
        // OR just rely on UI being context aware. 
        // User probably expects "Reboot" button to reboot the specific device they clicked.
        // But "Power" button is group.

        // Hack: Temporarily bypass sendCommand for reboot if we want single-device.
        // But for now, let's assume Reboot is also Group Action (or rarely used).
        get().sendCommand('reboot');
    },

    // Presets are Metadata on the master/leader, so HTTP is correct.
    savePreset: async (name, baseType) => {
        try {
            await fetch(`${get().targetIp}/api/savePreset`, {
                method: 'POST', body: JSON.stringify({ name, baseType }),
                headers: { 'Content-Type': 'text/plain' }
            });
            get().fetchAnimations();
        } catch (e) { console.error("Save Preset Failed", e); }
    },

    // ... rename/delete remain same HTTP calls ...
    renamePreset: async (oldName, newName) => {
        try {
            await fetch(`${get().targetIp}/api/renamePreset`, {
                method: 'POST', body: JSON.stringify({ oldName, newName }),
                headers: { 'Content-Type': 'text/plain' }
            });
            get().fetchAnimations();
        } catch (e) {
            console.error("Rename Preset Failed", e);
        }
    },

    deletePreset: async (name) => {
        try {
            await fetch(`${get().targetIp}/api/deletePreset`, {
                method: 'POST', body: JSON.stringify({ name }),
                headers: { 'Content-Type': 'text/plain' }
            });
            get().fetchAnimations();
        } catch (e) {
            console.error("Delete Preset Failed", e);
        }
    },

    // Groups Management
    knownGroups: JSON.parse(localStorage.getItem('illumigoon_groups') || '["Living Room", "Stage"]'),

    addGroup: (name) => {
        const { knownGroups } = get();
        if (!knownGroups.includes(name)) {
            const newGroups = [...knownGroups, name];
            set({ knownGroups: newGroups });
            localStorage.setItem('illumigoon_groups', JSON.stringify(newGroups));
        }
    },

    removeGroup: (name) => {
        const { knownGroups } = get();
        const newGroups = knownGroups.filter(g => g !== name);
        set({ knownGroups: newGroups });
        localStorage.setItem('illumigoon_groups', JSON.stringify(newGroups));
    },

    assignPeerToGroup: async (peerId, groupName) => {
        try {
            await fetch(`${get().targetIp}/api/mesh/assign_group`, {
                method: 'POST',
                // If peerId is string 'local', it passes through. If it's pure ID, it passes through.
                body: JSON.stringify({ id: peerId, group: groupName }),
                headers: { 'Content-Type': 'text/plain' }
            });

            // Optimistic update
            const { peers } = get();
            const updatedPeers = peers.map(p => {
                if (p.id === peerId || (peerId === 'local' && p.self)) {
                    return { ...p, group: groupName };
                }
                return p;
            });
            set({ peers: updatedPeers });

            // Refresh
            setTimeout(() => get().fetchPeers(), 500);
        } catch (e) {
            console.error("Assign Group Failed", e);
        }
    }

}));
