import React from 'react';
import { useIllumigoonStore } from '../api';
import { Settings } from 'lucide-react';

export const DeviceSettings = () => {
    const { status, sendToTarget } = useIllumigoonStore();
    const lastSentRef = React.useRef(0);

    const handlePhaseChange = (val) => {
        // Optimistic update
        useIllumigoonStore.setState((state) => ({
            status: { ...state.status, phase: val },
        }));

        // Throttled Network Call
        const now = Date.now();
        if (now - lastSentRef.current > 50) {
            sendToTarget('setPhase', { value: val });
            lastSentRef.current = now;
        }
    };

    return (
        <section className="premium-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Settings size={18} className="text-brand-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Device Settings
                </h3>
            </div>

            <div className="mb-2">
                <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-zinc-300">Phase Offset</label>
                    <span className="text-xs font-mono text-zinc-500">{status.phase?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="relative h-10 w-full flex items-center">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={status.phase || 0}
                        onChange={(e) => handlePhaseChange(parseFloat(e.target.value))}
                        className="w-full h-full absolute z-20 opacity-0 cursor-pointer"
                    />
                    {/* Track */}
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                        <div
                            className="h-full bg-zinc-200 rounded-full"
                            style={{ width: `${((status.phase || 0) * 100)}%` }}
                        />
                    </div>
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                    Offsets periodic animations for this device. Useful for syncing multiple devices with delays.
                </p>
            </div>
        </section>
    );
};
