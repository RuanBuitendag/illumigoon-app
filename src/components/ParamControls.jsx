import React from 'react';
import { useIllumigoonStore } from '../api';
import { Sliders } from 'lucide-react';
import { HexColorPicker, HexColorInput } from 'react-colorful';

const ParamSlider = ({ param, onUpdate }) => (
    <div className="mb-6">
        <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-zinc-300">{param.name}</label>
            <input
                type="number"
                min={param.min}
                max={param.max}
                step={param.step || 1}
                value={param.value}
                onChange={(e) => {
                    let val = Number(e.target.value);
                    if (!isNaN(val)) {
                        val = Math.min(param.max, Math.max(param.min, val));
                        onUpdate(param.name, val, param.type);
                    }
                }}
                className="no-spinner w-20 text-xs font-mono text-zinc-300 bg-zinc-900/50 px-2 py-0.5 rounded text-center border border-transparent hover:border-white/20 focus:border-brand-500 focus:outline-none transition-colors"
            />
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

// Kelvin temperature presets
const TEMP_PRESETS = [
    { kelvin: 1900, label: 'Candle' },
    { kelvin: 2700, label: 'Tungsten' },
    { kelvin: 3000, label: 'Halogen' },
    { kelvin: 4000, label: 'Fluorescent' },
    { kelvin: 5500, label: 'Daylight' },
    { kelvin: 6500, label: 'Cloudy' },
    { kelvin: 10000, label: 'Blue Sky' },
];

// ==== LED CALIBRATION CONSTANTS ====
// Adjust these to fine-tune the temperature gradient for your LEDs
const LED_GREEN_REDUCTION = 0.03;     // Green multiplier for warm temps (lower = more orange)
const BLUE_START_TEMP = 40;          // When blue starts (default Kelvin is 19, higher = delay blue)
const BLUE_RAMP_SPEED = 0.7;         // How fast blue increases (lower = slower)
const WHITE_POINT_TEMP = 55;         // ~5500K = neutral white, blue maxes here

// Custom LED-calibrated Kelvin to Hex conversion
// Gives a smoother: Red → Orange → Yellow → White → Blue gradient
const kelvinToHex = (kelvin) => {
    const temp = kelvin / 100;
    let r, g, b;

    // Red: Full at warm temps, gradually reduces at cool temps
    if (temp <= 66) {
        r = 255;
    } else {
        // Slower red fade for better orange retention
        r = temp - 60;
        r = 329.698727446 * Math.pow(r, -0.1332047592);
        r = Math.max(0, Math.min(255, r));
    }

    // Green: Controls the orange → yellow → white transition
    if (temp <= 66) {
        g = temp;
        g = 99.4708025861 * Math.log(g) - 161.1195681661;
        g = Math.max(0, Math.min(255, g));
        // LED Calibration: reduce green at warm temps for more orange
        const warmFactor = Math.pow(temp / 66, 1.5); // Slower curve (0 at warm, 1 at 6600K)
        g = g * (LED_GREEN_REDUCTION + (1 - LED_GREEN_REDUCTION) * warmFactor);
    } else {
        g = temp - 60;
        g = 288.1221695283 * Math.pow(g, -0.0755148492);
        g = Math.max(0, Math.min(255, g));
    }

    // Blue: Delayed onset and slower ramp for proper gradient
    if (temp >= WHITE_POINT_TEMP) {
        b = 255;
    } else if (temp <= BLUE_START_TEMP) {
        b = 0;
    } else {
        // Custom slower blue ramp
        const blueProgress = (temp - BLUE_START_TEMP) / (WHITE_POINT_TEMP - BLUE_START_TEMP);
        b = 255 * Math.pow(blueProgress, 1 / BLUE_RAMP_SPEED);
        b = Math.max(0, Math.min(255, b));
    }

    // Convert to hex
    const toHex = (n) => Math.round(n).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Temperature slider component
const TemperatureSlider = ({ kelvin, onKelvinChange }) => (
    <div className="flex flex-col gap-3">
        <div className="relative h-10 w-full flex items-center">
            <input
                type="range"
                min={1000}
                max={10000}
                step={100}
                value={kelvin}
                onChange={(e) => onKelvinChange(Number(e.target.value))}
                className="w-full h-full absolute z-20 opacity-0 cursor-pointer"
            />
            {/* Gradient track showing warm to cool */}
            <div
                className="w-full h-3 rounded-full overflow-hidden relative z-10"
                style={{
                    background: 'linear-gradient(to right, #ff8a00, #ffcc66, #fff5e6, #ffffff, #cce6ff, #99ccff)'
                }}
            >
                {/* Thumb indicator */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-zinc-800 shadow-lg"
                    style={{ left: `calc(${((kelvin - 1000) / 9000) * 100}% - 8px)` }}
                />
            </div>
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
            <span>1000K</span>
            <span className="font-mono text-zinc-300">{kelvin}K</span>
            <span>10000K</span>
        </div>
        {/* Temperature presets */}
        <div className="flex flex-wrap gap-1.5">
            {TEMP_PRESETS.map((preset) => (
                <button
                    key={preset.kelvin}
                    onClick={() => onKelvinChange(preset.kelvin)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${kelvin === preset.kelvin
                        ? 'bg-zinc-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }`}
                >
                    {preset.label}
                </button>
            ))}
        </div>
    </div>
);


const ParamColor = ({ param, onUpdate }) => {
    // Ensure we have a valid hex color
    const currentColor = param.value || "#ffffff";
    const [mode, setMode] = React.useState('color'); // 'color' or 'temperature'
    const [kelvin, setKelvin] = React.useState(5500);

    const handleKelvinChange = (newKelvin) => {
        setKelvin(newKelvin);
        const hexColor = kelvinToHex(newKelvin);
        onUpdate(param.name, hexColor, param.type);
    };

    return (
        <div className="mb-6">
            <label className="text-sm font-medium text-zinc-300 mb-1 block">{param.name}</label>
            {param.description && <p className="text-xs text-zinc-500 mb-3">{param.description}</p>}

            {/* Mode Toggle */}
            <div className="flex gap-1 mb-4 p-1 bg-zinc-800/50 rounded-lg w-fit">
                <button
                    onClick={() => setMode('color')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'color'
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    Color
                </button>
                <button
                    onClick={() => setMode('temperature')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'temperature'
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    Temperature
                </button>
            </div>

            {mode === 'color' ? (
                <>
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

                    {/* Custom Picker & Hex Input */}
                    <div className="flex flex-col gap-3">
                        <div className="w-full [&_.react-colorful]:w-full [&_.react-colorful]:!h-32 [&_.react-colorful__hue]:!h-3 [&_.react-colorful__saturation]:!rounded-lg [&_.react-colorful__hue]:!rounded-lg [&_.react-colorful__pointer]:!w-4 [&_.react-colorful__pointer]:!h-4">
                            <HexColorPicker
                                color={currentColor}
                                onChange={(newColor) => onUpdate(param.name, newColor, param.type)}
                            />
                        </div>

                        <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg p-2 border border-white/5">
                            <div
                                className="w-8 h-8 rounded-md border border-white/10 flex-shrink-0"
                                style={{ backgroundColor: currentColor }}
                            />
                            <div className="flex items-center gap-1 flex-1">
                                <span className="text-zinc-500 text-sm">#</span>
                                <HexColorInput
                                    color={currentColor}
                                    onChange={(newColor) => onUpdate(param.name, newColor, param.type)}
                                    prefixed={false}
                                    className="w-full bg-transparent font-mono text-sm text-zinc-300 uppercase focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* Temperature Mode */
                <div className="flex flex-col gap-3">
                    <TemperatureSlider kelvin={kelvin} onKelvinChange={handleKelvinChange} />

                    <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg p-2 border border-white/5">
                        <div
                            className="w-8 h-8 rounded-md border border-white/10 flex-shrink-0"
                            style={{ backgroundColor: currentColor }}
                        />
                        <div className="flex items-center gap-1 flex-1">
                            <span className="text-zinc-500 text-sm">#</span>
                            <HexColorInput
                                color={currentColor}
                                onChange={(newColor) => onUpdate(param.name, newColor, param.type)}
                                prefixed={false}
                                className="w-full bg-transparent font-mono text-sm text-zinc-300 uppercase focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}
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
    const [paletteMode, setPaletteMode] = React.useState('color'); // 'color' or 'temperature'
    const [paletteKelvin, setPaletteKelvin] = React.useState(5500);

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

                    {/* Mode Toggle */}
                    <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-lg w-fit">
                        <button
                            onClick={() => setPaletteMode('color')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${paletteMode === 'color'
                                ? 'bg-zinc-700 text-white'
                                : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            Color
                        </button>
                        <button
                            onClick={() => setPaletteMode('temperature')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${paletteMode === 'temperature'
                                ? 'bg-zinc-700 text-white'
                                : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            Temperature
                        </button>
                    </div>

                    {paletteMode === 'color' ? (
                        <>
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
                        </>
                    ) : (
                        <TemperatureSlider
                            kelvin={paletteKelvin}
                            onKelvinChange={(k) => {
                                setPaletteKelvin(k);
                                handleColorChange(kelvinToHex(k));
                            }}
                        />
                    )}

                    {/* Hex Input */}
                    <div className="flex items-center gap-3 bg-zinc-900/50 rounded-lg p-2 border border-white/5">
                        <div
                            className="w-6 h-6 rounded-md border border-white/10 flex-shrink-0"
                            style={{ backgroundColor: colors[activeIndex] }}
                        />
                        <div className="flex items-center gap-1 flex-1">
                            <span className="text-zinc-500 text-sm">#</span>
                            <HexColorInput
                                color={colors[activeIndex]}
                                onChange={handleColorChange}
                                prefixed={false}
                                className="w-full bg-transparent font-mono text-sm text-zinc-300 uppercase focus:outline-none"
                            />
                        </div>
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

