import React from 'react';
import { useIllumigoonStore } from '../api';
import { Sliders, Palette, Zap } from 'lucide-react';

const ParamSlider = ({ param, onUpdate }) => (
    <div className="mb-4">
        <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-slate-300">{param.name}</label>
            <span className="text-sm text-slate-500">{param.value}</span>
        </div>
        <input
            type="range"
            min={param.min}
            max={param.max}
            step={param.step}
            value={param.value}
            onChange={(e) => onUpdate(param.name, Number(e.target.value), param.type)}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
        />
    </div>
);

const ParamToggle = ({ param, onUpdate }) => (
    <div className="flex items-center justify-between mb-4 p-3 bg-slate-800/50 rounded-lg">
        <span className="text-sm font-medium text-slate-300">{param.name}</span>
        <button
            onClick={() => onUpdate(param.name, !param.value, param.type)}
            className={`w-12 h-6 rounded-full transition-colors relative ${param.value ? 'bg-green-500' : 'bg-slate-600'}`}
        >
            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${param.value ? 'translate-x-6' : ''}`} />
        </button>
    </div>
);

// Basic color picker for now - can be expanded to a full wheel
const ParamColor = ({ param, onUpdate }) => (
    <div className="mb-4">
        <label className="text-sm font-medium text-slate-300 mb-2 block">{param.name}</label>
        <div className="flex gap-2">
            <input
                type="color"
                value={param.value}
                onChange={(e) => onUpdate(param.name, e.target.value, param.type)}
                className="h-10 w-full rounded cursor-pointer bg-transparent border border-slate-600"
            />
        </div>
    </div>
)

export const ControlDeck = () => {
    const { params, sendCommand } = useIllumigoonStore();

    // Optimistic local update could be handled here if WS lag is high, 
    // but for now we rely on the input's local state and send updates freq.

    const handleUpdate = (name, value, type) => {
        // Debouncing could be added here for sliders
        sendCommand('setParam', { name, value });

        // Immediate local store update for responsiveness? 
        // Ideally we wait for WS echo, but for sliders we might want to force it locally to avoid jitter
        useIllumigoonStore.setState(state => ({
            params: state.params.map(p => p.name === name ? { ...p, value } : p)
        }));
    };

    if (params.length === 0) return <div className="text-slate-500 text-center py-8">No parameters available</div>;

    return (
        <div className="glass-panel p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sliders size={20} className="text-neon-pink" />
                Controls
            </h3>
            <div className="space-y-2">
                {params.map(p => {
                    // Type Mapping from Firmware Enum: 0=INT, 1=FLOAT, 2=BYTE, 3=COLOR, 4=BOOL, 5=PALETTE
                    switch (p.type) {
                        case 0: // INT
                        case 1: // FLOAT
                        case 2: // BYTE
                            return <ParamSlider key={p.name} param={p} onUpdate={handleUpdate} />;
                        case 3: // COLOR
                            return <ParamColor key={p.name} param={p} onUpdate={handleUpdate} />;
                        case 4: // BOOL
                            return <ParamToggle key={p.name} param={p} onUpdate={handleUpdate} />;
                        default:
                            return <div key={p.name} className="text-xs text-red-500">Unknown param: {p.name}</div>
                    }
                })}
            </div>
        </div>
    );
};
