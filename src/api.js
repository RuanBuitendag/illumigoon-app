import { create } from 'zustand';

// detect if running in dev mode (localhost) or on ESP32
const isDev = import.meta.env.DEV;
const DEFAULT_HOST = isDev ? 'http://illumigoon.local' : ''; // mDNS hostname for local dev

// Try to load saved IP from localStorage, otherwise use default
const getInitialTargetIp = () => {
    const saved = localStorage.getItem('illumigoon_target_ip');
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
    socket: null,
    reconnectTimer: null,
    reconnectAttempts: 0,

    connectWebSocket: () => {
        const { targetIp, socket, reconnectTimer } = get();

        // Prevent multiple connection attempts
        if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
            // Check if we are already connected to the correct URL
            const currentUrl = socket.url;
            const targetUrl = targetIp
                ? targetIp.replace('http', 'ws') + '/ws'
                : `ws://${window.location.host}/ws`;

            // If the URL matches, we are good. If not, close and reconnect.
            // If the URL matches, we are good. If not, close and reconnect.
            // Normalize URLs for comparison (remove trailing slash)
            const normalizedCurrent = currentUrl.replace(/\/$/, '');
            const normalizedTarget = targetUrl.replace(/\/$/, '');

            if (normalizedCurrent === normalizedTarget) {
                return;
            } else {
                console.log(`Switching WS from ${currentUrl} to ${targetUrl}`);
                socket.onclose = null; // Prevent old socket from triggering reconnect
                socket.onerror = null; // Prevent old socket from triggering errors
                socket.onmessage = null;
                socket.onopen = null;
                socket.close();
                // Continue to create new connection below
            }
        }

        if (reconnectTimer) clearTimeout(reconnectTimer);

        const wsUrl = targetIp
            ? targetIp.replace('http', 'ws') + '/ws'
            : `ws://${window.location.host}/ws`;

        console.log('Connecting to WS:', wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            if (ws !== get().socket) return;
            console.log('WS Connected');
            set({ isConnected: true, reconnectAttempts: 0 });
        };

        ws.onclose = () => {
            if (ws !== get().socket) return;
            console.log('WS Closed');
            set({ isConnected: false, socket: null });
            get().scheduleReconnect();
        };

        ws.onerror = (e) => {
            if (ws !== get().socket) return;
            console.error('WS Error:', e);
            // On error, onclose usually follows, but just in case
        };

        ws.onmessage = (event) => {
            if (ws !== get().socket) return;
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

    scheduleReconnect: () => {
        const { reconnectAttempts } = get();
        // Exponential backoff with max delay of 5 seconds
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 5000);

        console.log(`Reconnecting in ${delay}ms... (Attempt ${reconnectAttempts + 1})`);

        const timer = setTimeout(() => {
            set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 }));
            get().connectWebSocket();
        }, delay);

        set({ reconnectTimer: timer });
    },

    // Helper to trigger reconnect if we suspect we are online (e.g. API call worked)
    triggerManuallyReconnect: () => {
        const { isConnected, socket } = get();
        // If we are already connected or connecting, do not interrupt
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        console.log('API access successful, forcing immediate WS reconnect...');
        set({ reconnectAttempts: 0 }); // Reset backoff since we know it's there
        get().connectWebSocket();
    },

    // API Actions
    fetchAnimations: async () => {
        try {
            const res = await fetch(`${get().targetIp}/api/animations`);
            const data = await res.json();
            set({ animations: data });
            get().triggerManuallyReconnect();
        } catch (e) {
            console.error('Fetch Anim failed', e);
        }
    },

    fetchBaseAnimations: async () => {
        try {
            const res = await fetch(`${get().targetIp}/api/baseAnimations`);
            const data = await res.json();
            set({ baseAnimations: data });
            get().triggerManuallyReconnect();
        } catch (e) {
            console.error('Fetch Base Anim failed', e);
        }
    },


    fetchPeers: async () => {
        try {
            const { targetIp, setTargetIp } = get();
            const res = await fetch(`${targetIp}/api/mesh/peers`);
            const data = await res.json();
            set({ peers: data });

            // Auto-switch to direct IP if we are on .local or default
            const selfPeer = data.find(p => p.self);
            if (selfPeer && selfPeer.ip) {
                const isLocal = targetIp === '' || targetIp.includes('.local');
                const isDifferent = !targetIp.includes(selfPeer.ip);

                if (isLocal && isDifferent) {
                    console.log(`Auto-switching to direct IP: ${selfPeer.ip}`);
                    setTargetIp(selfPeer.ip);
                }
            }

            get().triggerManuallyReconnect();
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
            get().triggerManuallyReconnect();
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
            get().triggerManuallyReconnect();
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
            get().triggerManuallyReconnect();
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
            get().triggerManuallyReconnect();
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
            get().triggerManuallyReconnect();
        } catch (e) {
            console.error("Delete Preset Failed", e);
        }
    }

}));
