import React from 'react';
import { useIllumigoonStore } from '../api';
import { Sliders } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

const ParamSlider = ({ param, onUpdate }) => (
    <div className="mb-6">
        <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-zinc-300">{param.name}</label>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded">
                {param.value}
            </span>
        </div>
        {param.description && <p className="text-xs text-zinc-500 mb-2">{param.description}</p>}
        <div className="relative h-10 w-full flex items-center">
            <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step || 1}
                value={param.value}
                onChange={(e) => onUpdate(param.name, Number(e.target.value), param.type)}
                className="w-full h-full absolute z-20 opacity-0 cursor-pointer"
            />
            {/* Track */}
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                <div
                    className="h-full bg-zinc-200 rounded-full"
                    style={{ width: `${((param.value - param.min) / (param.max - param.min)) * 100}%` }}
                />
            </div>
            {/* Thumb (Optional visual indicator, though the filled track implies position well enough for touch) */}
        </div>
    </div>
);

const ParamToggle = ({ param, onUpdate }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-300">{param.name}</span>
            {param.description && <span className="text-xs text-zinc-500">{param.description}</span>}
        </div>
        <button
            onClick={() => onUpdate(param.name, !param.value, param.type)}
            className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${param.value ? 'bg-brand-600' : 'bg-zinc-700'
                }`}
        >
            <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${param.value ? 'translate-x-5' : 'translate-x-0'
                    }`}
            />
        </button>
    </div>
);

const PRESET_COLORS = [
    { value: '#FF0000', label: 'Red' },
    { value: '#00FF00', label: 'Green' },
    { value: '#0000FF', label: 'Blue' },
    { value: '#FFFF00', label: 'Yellow' },
    { value: '#00FFFF', label: 'Cyan' },
    { value: '#FF00FF', label: 'Magenta' },
    { value: '#800080', label: 'Purple' },
    { value: '#FFA500', label: 'Orange' },
    { value: '#FFFFFF', label: 'White' },
    { value: '#FDF4DC', label: 'Warm' },
];

const ParamColor = ({ param, onUpdate }) => {
    // Ensure we have a valid hex color
    const currentColor = param.value || "#ffffff";

    return (
        <div className="mb-6">
            <label className="text-sm font-medium text-zinc-300 mb-1 block">{param.name}</label>
            {param.description && <p className="text-xs text-zinc-500 mb-3">{param.description}</p>}

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
                {PRESET_COLORS.map((preset) => (
                    <button
                        key={preset.value}
                        onClick={() => onUpdate(param.name, preset.value, param.type)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none ${currentColor.toLowerCase() === preset.value.toLowerCase()
                            ? 'border-white scale-110 shadow-lg shadow-white/20'
                            : 'border-transparent hover:border-white/50'
                            }`}
                        style={{ backgroundColor: preset.value }}
                        title={preset.label}
                    />
                ))}
            </div>

            {/* Custom Picker & Hex Display */}
            <div className="flex flex-col gap-3">
                <div className="w-full [&_.react-colorful]:w-full [&_.react-colorful]:!h-32 [&_.react-colorful__hue]:!h-3 [&_.react-colorful__saturation]:!rounded-lg [&_.react-colorful__hue]:!rounded-lg [&_.react-colorful__pointer]:!w-4 [&_.react-colorful__pointer]:!h-4">
                    <HexColorPicker
                        color={currentColor}
                        onChange={(newColor) => onUpdate(param.name, newColor, param.type)}
                    />
                </div>

                <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-2 border border-white/5">
                    <div
                        className="w-8 h-8 rounded-md border border-white/10"
                        style={{ backgroundColor: currentColor }}
                    />
                    <span className="font-mono text-sm text-zinc-400 uppercase">
                        {currentColor}
                    </span>
                </div>
            </div>
        </div>
    );
};

const ParamPalette = ({ param, onUpdate }) => {
    // Value should be array of 16 hex strings
    // If not array, mock it
    const colors = Array.isArray(param.value) ? param.value : Array(16).fill("#000000");
    const [elapsed, setElapsed] = React.useState(0);
    const [activeIndex, setActiveIndex] = React.useState(null);

    // Close picker when clicking outside? For now, toggle logic on the swatch.

    return (
        <div className="mb-6">
            <label className="text-sm font-medium text-zinc-300 mb-1 block">{param.name}</label>
            {param.description && <p className="text-xs text-zinc-500 mb-3">{param.description}</p>}

            {/* Palette Grid */}
            <div className="grid grid-cols-8 gap-1 mb-3">
                {colors.map((color, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                        className={`aspect-square rounded-sm border transition-transform hover:scale-105 focus:outline-none ${activeIndex === idx
                            ? 'border-white scale-110 shadow-lg shadow-white/20 z-10'
                            : 'border-white/10 opacity-90 hover:opacity-100'
                            }`}
                        style={{ backgroundColor: color }}
                        title={`Index ${idx}: ${color}`}
                    />
                ))}
            </div>

            {/* Picker for Active Index */}
            {activeIndex !== null && (
                <div className="flex flex-col gap-3 p-3 bg-zinc-800/50 rounded-lg border border-white/5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400">Editing Color {activeIndex + 1}</span>
                        <button onClick={() => setActiveIndex(null)} className="text-xs text-zinc-500 hover:text-white">Close</button>
                    </div>
                    <div className="w-full [&_.react-colorful]:w-full [&_.react-colorful]:!h-32 [&_.react-colorful__hue]:!h-3 [&_.react-colorful__saturation]:!rounded-lg [&_.react-colorful__hue]:!rounded-lg [&_.react-colorful__pointer]:!w-4 [&_.react-colorful__pointer]:!h-4">
                        <HexColorPicker
                            color={colors[activeIndex]}
                            onChange={(newColor) => {
                                const newColors = [...colors];
                                newColors[activeIndex] = newColor;
                                onUpdate(param.name, newColors, param.type);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export const ParamControls = () => {
    const { params, sendCommand } = useIllumigoonStore();

    // Simple throttle implementation to prevent WS flooding
    const lastSentRef = React.useRef({});

    const handleUpdate = (name, value, type) => {
        // Optimistic Update (Immediate)
        useIllumigoonStore.setState((state) => ({
            params: state.params.map((p) => (p.name === name ? { ...p, value } : p)),
        }));

        // Throttle Network Command (Max 20fps / 50ms)
        const now = Date.now();
        if (!lastSentRef.current[name] || now - lastSentRef.current[name] > 50) {
            sendCommand('setParam', { name, value });
            lastSentRef.current[name] = now;
        }
    };

    if (!params || params.length === 0) return null;

    return (
        <section className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
                <Sliders size={18} className="text-brand-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Adjustments
                </h3>
            </div>

            <div className="space-y-2">
                {params.map((p) => {
                    switch (p.type) {
                        case 0: // INT
                        case 1: // FLOAT
                        case 2: // BYTE
                            return <ParamSlider key={p.name} param={p} onUpdate={handleUpdate} />;
                        case 3: // COLOR
                            return <ParamColor key={p.name} param={p} onUpdate={handleUpdate} />;
                        case 4: // BOOL
                            return <ParamToggle key={p.name} param={p} onUpdate={handleUpdate} />;
                        case 5: // PALETTE
                            return <ParamPalette key={p.name} param={p} onUpdate={handleUpdate} />;
                        default:
                            return <div key={p.name} className="text-xs text-red-500">Unknown param: {p.type}</div>;
                    }
                })}
            </div>
        </section>
    );
};
