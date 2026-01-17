import React from 'react';
import { Settings, CheckCircle2, XCircle } from 'lucide-react';

export function Header({ isConnected }) {
    return (
        <header className="flex items-center justify-between py-6 px-1">
            <div className="flex items-center gap-3">
                {/* Simple Brand */}
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-tight text-white">
                        Illumigoon
                    </h1>
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                        Control Center
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Connection Status Dot */}
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500'}`} />
                    <span className={`text-xs font-medium ${isConnected ? 'text-zinc-400' : 'text-red-400'}`}>
                        {isConnected ? 'Online' : 'Offline'}
                    </span>
                </div>

                {/* Settings Button (Placeholder for now) */}
                <button className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors active-press">
                    <Settings size={20} />
                </button>
            </div>
        </header>
    );
}
