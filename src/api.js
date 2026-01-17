import { create } from 'zustand';

// detect if running in dev mode (localhost) or on ESP32
const isDev = import.meta.env.DEV;
const DEFAULT_HOST = isDev ? 'http://illumigoon.local' : ''; // mDNS hostname for local dev

export const useIllumigoonStore = create((set, get) => ({
    targetIp: DEFAULT_HOST,
    isConnected: false,
    status: { brightness: 255, animation: 'Loading...', uptime: 0 },
    peers: [],
    animations: [], // This will now contain Preset Names
    baseAnimations: [], // This will contain Base Animation Types
    params: [],
    currentBaseType: null,

    setTargetIp: (ip) => {


        // If ip is just an IP address, prepend http://
        // If empty/local, use empty string for relative paths
        const host = ip ? (ip.startsWith('http') ? ip : `http://${ip}`) : '';
        set({ targetIp: host });
        get().connectWebSocket(); // Reconnect WS to new target
    },

    setStatus: (newStatus) => set((state) => ({ status: { ...state.status, ...newStatus } })),
    setPeers: (peers) => set({ peers }),
    setAnimations: (animations) => set({ animations }),
    setParams: (params) => set({ params }),

    // WebSocket Connection Logic
    socket: null,
    connectWebSocket: () => {
        const { targetIp, socket } = get();
        if (socket) socket.close();

        const wsUrl = targetIp
            ? targetIp.replace('http', 'ws') + '/ws'
            : `ws://${window.location.host}/ws`;

        console.log('Connecting to WS:', wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => set({ isConnected: true });
        ws.onclose = () => set({ isConnected: false });
        ws.onerror = (e) => {
            console.error('WS Error:', e);
            set({ isConnected: false });
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.event === 'status') {
                    get().setStatus(msg.data);
                } else if (msg.event === 'params') {
                    // Handle new structure { baseType: "", params: [] }
                    // Or fallback if array (backwards compat?)
                    if (Array.isArray(msg.data)) {
                        get().setParams(msg.data);
                    } else if (msg.data && msg.data.params) {
                        set({ params: msg.data.params, currentBaseType: msg.data.baseType });
                    }
                }
            } catch (e) {

                console.error('WS Parse Error', e);
            }
        };

        set({ socket: ws });
    },

    // API Actions
    fetchAnimations: async () => {
        try {
            const res = await fetch(`${get().targetIp}/api/animations`);
            const data = await res.json();
            set({ animations: data });
        } catch (e) {
            console.error('Fetch Anim failed', e);
        }
    },

    fetchBaseAnimations: async () => {
        try {
            const res = await fetch(`${get().targetIp}/api/baseAnimations`);
            const data = await res.json();
            set({ baseAnimations: data });
        } catch (e) {
            console.error('Fetch Base Anim failed', e);
        }
    },


    fetchPeers: async () => {
        try {
            const res = await fetch(`${get().targetIp}/api/mesh/peers`);
            const data = await res.json();
            set({ peers: data });
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
        } catch (e) {
            console.error('Fetch Params failed', e);
        }
    },


    sendCommand: (cmd, payload = {}) => {
        const { socket } = get();
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ cmd, ...payload }));
        }
    },

    setAnimation: async (name) => {
        // Use HTTP POST for animation switch to ensure reliability
        try {
            await fetch(`${get().targetIp}/api/animation`, {
                method: 'POST',
                body: JSON.stringify({ name }),
                // Using text/plain avoids CORS Preflight (OPTIONS) requests, 
                // which the current firmware might not handle perfectly.
                headers: { 'Content-Type': 'text/plain' }
            });
            // Optimistic update
            get().setStatus({ animation: name });
        } catch (e) {
            console.error("Set Anim Failed", e);
        }
    },

    setPower: (isOn) => {
        get().sendCommand('setPower', { value: isOn });
        // Optimistic update
        get().setStatus({ power: isOn });
    },

    reboot: () => {
        get().sendCommand('reboot');
    },

    savePreset: async (name, baseType) => {
        try {
            await fetch(`${get().targetIp}/api/savePreset`, {
                method: 'POST',
                body: JSON.stringify({ name, baseType }),
                headers: { 'Content-Type': 'text/plain' }
            });
            // Refresh lists
            get().fetchAnimations();
        } catch (e) {
            console.error("Save Preset Failed", e);
        }
    },

    renamePreset: async (oldName, newName) => {
        try {
            await fetch(`${get().targetIp}/api/renamePreset`, {
                method: 'POST',
                body: JSON.stringify({ oldName, newName }),
                headers: { 'Content-Type': 'text/plain' }
            });
            // Refresh lists
            get().fetchAnimations();
        } catch (e) {
            console.error("Rename Preset Failed", e);
        }
    },

    deletePreset: async (name) => {
        try {
            await fetch(`${get().targetIp}/api/deletePreset`, {
                method: 'POST',
                body: JSON.stringify({ name }),
                headers: { 'Content-Type': 'text/plain' }
            });
            // Refresh lists
            get().fetchAnimations();
        } catch (e) {
            console.error("Delete Preset Failed", e);
        }
    }

}));
