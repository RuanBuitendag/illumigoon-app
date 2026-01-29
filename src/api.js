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
    status: { brightness: 255, animation: 'Loading...', uptime: 0, phase: 0.0 },
    peers: [],
    animations: [],
    baseAnimations: [],
    params: [],
    currentBaseType: null,

    setTargetIp: (ip) => {
        // Reset status
        set({ status: { brightness: 255, animation: 'Loading...', uptime: 0, version: null, phase: 0.0 } });

        const host = ip ? (ip.startsWith('http') ? ip : `http://${ip}`) : '';
        localStorage.setItem('illumigoon_target_ip', host);
        set({ targetIp: host });

        get().connectWebSocket(); // Reconnect WS to new target
    },

    setStatus: (newStatus) => set((state) => ({ status: { ...state.status, ...newStatus } })),
    setPeers: (peers) => set({ peers }),
    setAnimations: (animations) => set({ animations }),
    setParams: (params) => set({ params }),
    setBaseAnimations: (baseAnimations) => set({ baseAnimations }),

    // WebSocket Connection Logic
    socketMap: {}, // IP -> WebSocket

    manageGroupConnections: () => {
        const { peers, targetIp, socketMap } = get();

        // Identify the current group we are controlling
        let targetPeer = peers.find(p => targetIp.includes(p.ip));
        // Fallback for local dev 
        if (!targetPeer && (targetIp === '' || targetIp.includes('local'))) {
            targetPeer = peers.find(p => p.self);
        }

        const currentGroup = targetPeer?.group;

        // Extract raw IP from targetIp for bootstrapping
        let rawTargetIp = null;
        if (targetIp && !targetIp.includes('local')) {
            rawTargetIp = targetIp.replace('http://', '').replace('https://', '').replace(/\/$/, '');
        }

        // Identify peers to connect to (Target + Group Members)
        // We use a Map to ensure uniqueness by IP
        const peersToConnectMap = new Map();

        // 1. Always connect to the Target IP (Bootstrapping)
        if (rawTargetIp) {
            peersToConnectMap.set(rawTargetIp, { ip: rawTargetIp, id: 'target', group: null });
        }

        // 2. Add known peers from the list
        peers.forEach(p => {
            if (p.ip === '0.0.0.0' || !p.ip) return;

            let shouldConnect = false;
            if (p === targetPeer) shouldConnect = true;
            if (targetPeer && currentGroup && p.group === currentGroup) shouldConnect = true;

            // Also if this peer IS the rawTargetIp (match by IP), ensure we have the rich peer object
            if (rawTargetIp && p.ip === rawTargetIp) shouldConnect = true;

            if (shouldConnect) {
                peersToConnectMap.set(p.ip, p);
            }
        });

        const peersToConnect = Array.from(peersToConnectMap.values());

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
                if (get().targetIp.includes(ip) || (get().targetIp.includes('local') && peer.self)) {
                    set({ isConnected: true });
                    // Hydrate Data on Connect
                    const send = (cmd) => ws.send(JSON.stringify({ cmd }));
                    send('getStatus');
                    send('getAnimations');
                    send('getBaseAnimations');
                    send('getParams');
                    send('getPeers');
                }
            };

            ws.onclose = () => {
                console.log(`WS Closed: ${ip}`);
                if (get().targetIp.includes(ip)) {
                    set({ isConnected: false });
                }
            };

            ws.onerror = (e) => console.error(`WS Error (${ip}):`, e);

            ws.onmessage = (event) => {
                // Only update UI state if this message is from the TARGET IP (or we are in local dev mode)
                // Note regarding Group Sync: 
                // We typically only want the UI to reflect the "Target" device's state.
                // If the group is synced, the target's state will update via Mesh.
                // So ignoring other sockets for UI State is correct.

                const isTarget = get().targetIp.includes(ip) ||
                    (get().targetIp.includes('local') && peer?.self) ||
                    (!peer && get().targetIp.includes(ip)); // Allow unknown peer if it matches target IP

                if (isTarget) {
                    try {
                        const msg = JSON.parse(event.data);
                        const { event: evt, data } = msg;

                        if (evt === 'status') {
                            get().setStatus(data);
                        } else if (evt === 'params') {
                            if (Array.isArray(data)) {
                                get().setParams(data);
                            } else if (data && data.params) {
                                set({ params: data.params, currentBaseType: data.baseType });
                            }
                        } else if (evt === 'animations') {
                            get().setAnimations(data);
                        } else if (evt === 'baseAnimations') {
                            get().setBaseAnimations(data);
                        } else if (evt === 'peers') {
                            get().setPeers(data);
                            // Trigger recursion: We found peers, so we might need to connect to new group members
                            // Debounce this slightly?
                            setTimeout(() => get().manageGroupConnections(), 100);
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

    connectWebSocket: () => {
        get().manageGroupConnections();
    },

    triggerManuallyReconnect: () => {
        get().manageGroupConnections();
    },

    // --- API ACTIONS (Converted to WebSocket) ---

    // Send to ALL sockets in the socketMap (Broadcast/Group)
    sendCommand: (cmd, payload = {}) => {
        const { socketMap, peers, targetIp } = get();

        // 1. Determine "targetPeer"
        let targetPeer = peers.find(p => targetIp.includes(p.ip));
        if (!targetPeer && (targetIp === '' || targetIp.includes('local'))) {
            targetPeer = peers.find(p => p.self);
        }

        const currentGroup = targetPeer?.group;

        Object.keys(socketMap).forEach(ip => {
            const ws = socketMap[ip];
            // Skip if not open (e.g. connecting or closing)
            if (ws && ws.readyState === WebSocket.OPEN) {
                const peer = peers.find(p => p.ip === ip);
                let shouldSend = false;

                if (peer && targetPeer) {
                    if (peer === targetPeer) shouldSend = true;
                    else if (currentGroup && peer.group === currentGroup) shouldSend = true;
                }
                else if (!targetPeer) {
                    // Fallback
                    shouldSend = true;
                }
                // Extra check
                if (targetIp.includes(ip)) shouldSend = true;

                if (shouldSend) {
                    ws.send(JSON.stringify({ cmd, ...payload }));
                }
            }
        });
    },

    // Helper: Send to Target Device ONLY
    sendToTarget: (cmd, payload = {}) => {
        const { socketMap, targetIp, peers } = get();
        let targetPeer = peers.find(p => targetIp.includes(p.ip));
        if (!targetPeer && (targetIp === '' || targetIp.includes('local'))) {
            targetPeer = peers.find(p => p.self);
        }

        // If no peer identified yet, we might be in initial load.
        // The onopen handler will trigger hydration, so we can safely ignore if not ready.
        if (!targetPeer) return;

        if (socketMap[targetPeer.ip]) {
            const ws = socketMap[targetPeer.ip];
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ cmd, ...payload }));
                return;
            } else if (ws.readyState === WebSocket.CONNECTING) {
                // Connection in progress, onopen will handle hydration.
                // We can ignore this specific command if it's a fetch, or queue it.
                // For now, ignoring is safe for fetches as onopen does them.
                return;
            }
        }

        // Only warn if we really expected a connection
        console.warn("sendToTarget: No open socket found for target", targetIp);
    },

    // --- Public Store Actions ---

    // Polling / Refetching - Now just triggers WS request commands
    fetchAnimations: () => get().sendToTarget('getAnimations'),
    fetchBaseAnimations: () => get().sendToTarget('getBaseAnimations'),
    fetchPeers: () => get().sendToTarget('getPeers'),
    fetchParams: () => get().sendToTarget('getParams'),

    setAnimation: (name) => {
        get().sendCommand('setAnimation', { name });
        get().setStatus({ animation: name });
    },

    setPower: (isOn) => {
        get().sendCommand('setPower', { value: isOn });
        get().setStatus({ power: isOn });
    },

    reboot: () => {
        get().sendCommand('reboot');
    },

    savePreset: (name, baseType) => {
        get().sendCommand('savePreset', { name, baseType });
    },

    renamePreset: (oldName, newName) => {
        get().sendCommand('renamePreset', { oldName, newName });
    },

    deletePreset: (name) => {
        get().sendCommand('deletePreset', { name });
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

    assignPeerToGroup: (peerId, groupName) => {
        // Optimistic update
        const { peers } = get();
        const updatedPeers = peers.map(p => {
            if (p.id === peerId || (peerId === 'local' && p.self)) {
                return { ...p, group: groupName };
            }
            return p;
        });
        set({ peers: updatedPeers });

        get().sendCommand('assignGroup', { id: peerId, group: groupName });

        // Refresh peers shortly after to confirm
        setTimeout(() => get().fetchPeers(), 1000);
    },

    setDevicePhase: (phase) => {
        const { status } = get();
        set({ status: { ...status, phase } });
        get().sendToTarget('setPhase', { value: phase });
    }

}));
