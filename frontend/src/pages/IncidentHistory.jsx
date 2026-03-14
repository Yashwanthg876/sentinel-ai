import React from "react";
import { FiSettings } from "react-icons/fi";

export default function IncidentHistory() {
    return (
        <div className="flex-1 flex items-center justify-center text-slate-600 font-mono text-sm uppercase flex-col gap-5 h-full">
            <div className="relative">
                <FiSettings size={64} className="opacity-20 animate-[spin_10s_linear_infinite]" />
                <FiSettings size={32} className="opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_8s_linear_infinite_reverse]" />
            </div>
            <span className="tracking-[0.3em] font-bold">INCIDENT HISTORY MODULE CALIBRATING</span>
        </div>
    );
}
