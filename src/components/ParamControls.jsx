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
    // Value should be array of hex strings
    // If not array, use empty array (or default if null)
    const colors = Array.isArray(param.value) ? param.value : [];

    // Safety check: if colors is empty, maybe add a default black? 
    // But user might want empty. Firmware handles empty -> black palette.

    const [activeIndex, setActiveIndex] = React.useState(null);

    const handleAddColor = () => {
        const newColors = [...colors, "#FFFFFF"];
        onUpdate(param.name, newColors, param.type);
        // Optionally open the picker for the new color
        setActiveIndex(newColors.length - 1);
    };

    const handleRemoveColor = (index) => {
        const newColors = colors.filter((_, i) => i !== index);
        onUpdate(param.name, newColors, param.type);
        if (activeIndex === index) setActiveIndex(null);
        else if (activeIndex > index) setActiveIndex(activeIndex - 1);
    };

    const handleColorChange = (newColor) => {
        if (activeIndex === null) return;
        const newColors = [...colors];
        newColors[activeIndex] = newColor;
        onUpdate(param.name, newColors, param.type);
    };

    return (
        <div className="mb-6">
            <label className="text-sm font-medium text-zinc-300 mb-1 block">{param.name}</label>
            {param.description && <p className="text-xs text-zinc-500 mb-3">{param.description}</p>}

            {/* Palette Swatches */}
            <div className="flex flex-wrap gap-2 mb-3">
                {colors.map((color, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                        className={`w-9 h-9 rounded-md border transition-all hover:scale-105 focus:outline-none ${activeIndex === idx
                            ? 'border-white scale-110 shadow-lg shadow-white/20 z-10'
                            : 'border-white/10'
                            }`}
                        style={{ backgroundColor: color }}
                        title={`Index ${idx}: ${color}`}
                    />
                ))}

                {/* Add Button */}
                <button
                    onClick={handleAddColor}
                    className="w-9 h-9 rounded-md border border-white/10 border-dashed hover:border-white/40 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                    title="Add Color"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>

            {/* Picker for Active Index */}
            {activeIndex !== null && activeIndex < colors.length && (
                <div className="flex flex-col gap-3 p-3 bg-zinc-800/50 rounded-lg border border-white/5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400">Editing Color {activeIndex + 1}</span>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleRemoveColor(activeIndex)}
                                className="text-xs text-red-400 hover:text-red-300"
                            >
                                Remove
                            </button>
                            <button
                                onClick={() => setActiveIndex(null)}
                                className="text-xs text-zinc-500 hover:text-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <div className="w-full [&_.react-colorful]:w-full [&_.react-colorful]:!h-32 [&_.react-colorful__hue]:!h-3 [&_.react-colorful__saturation]:!rounded-lg [&_.react-colorful__hue]:!rounded-lg [&_.react-colorful__pointer]:!w-4 [&_.react-colorful__pointer]:!h-4">
                        <HexColorPicker
                            color={colors[activeIndex]}
                            onChange={handleColorChange}
                        />
                    </div>
                    <div className="flex gap-2">
                        {PRESET_COLORS.map((preset) => (
                            <button
                                key={preset.value}
                                onClick={() => handleColorChange(preset.value)}
                                className="w-6 h-6 rounded-full border border-white/10"
                                style={{ backgroundColor: preset.value }}
                                title={preset.label}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const ParamControls = () => {
    // Combine store access
    const { params, sendCommand, savePreset, currentBaseType, status } = useIllumigoonStore();

    // Simple throttle implementation
    const lastSentRef = React.useRef({});

    // Hooks must be unconditional
    const [showSave, setShowSave] = React.useState(false);
    const [presetName, setPresetName] = React.useState('');

    // Early return AFTER hooks
    if (!params || params.length === 0) return null;

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

    const handleSave = () => {
        if (!presetName.trim()) return;
        savePreset(presetName, currentBaseType || "Fire"); // Fallback if missing? Should not happen.
        setShowSave(false);
        setPresetName('');
    };

    return (
        <section className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
                <Sliders size={18} className="text-brand-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Adjustments
                </h3>
            </div>

            <div className="space-y-2 mb-6">
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

            <div className="pt-4 border-t border-white/5">
                {!showSave ? (
                    <button
                        onClick={() => { setShowSave(true); setPresetName(status.animation); }}
                        className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-zinc-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        Save as Preset
                    </button>
                ) : (
                    <div className="flex flex-col gap-3 animate-fade-in-up">
                        <input
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="Preset Name"
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setShowSave(false)}
                                className="px-4 py-2 bg-transparent hover:bg-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

