import { create } from 'zustand';

// detect if running in dev mode (localhost) or on ESP32
const isDev = import.meta.env.DEV;
const DEFAULT_HOST = isDev ? 'http://192.168.1.156' : ''; // Change proxy IP as needed

export const useIllumigoonStore = create((set, get) => ({
    targetIp: DEFAULT_HOST,
    isConnected: false,
    status: { brightness: 255, animation: 'Loading...', uptime: 0 },
    peers: [],
    animations: [],
    params: [],

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
                    get().setParams(msg.data);
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
            set({ params: data });
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
                headers: { 'Content-Type': 'application/json' }
            });
            // Optimistic update
            get().setStatus({ animation: name });
        } catch (e) {
            console.error("Set Anim Failed", e);
        }
    }
}));
