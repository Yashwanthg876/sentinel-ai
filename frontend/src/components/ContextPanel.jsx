import React from "react";
import { motion } from "framer-motion";
import { FiAlertTriangle, FiActivity, FiFileText, FiBriefcase, FiCheckCircle } from "react-icons/fi";
import { useAppContext } from "../context/AppContext";

export default function ContextPanel() {
    const { currentRisk, currentIssue, evidenceChecklist, createCase } = useAppContext();

    const riskColors = {
        "Critical": "text-red-400 border-red-500/30 bg-red-500/10 shadow-[0_0_15px_rgba(,,,)]",
        "High": "text-orange-400 border-orange-500/30 bg-orange-500/10 shadow-[0_0_15px_rgba(,,,)]",
        "Medium": "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_15px_rgba(,,,)]",
        "Low": "text-green-400 border-green-500/30 bg-green-500/10 shadow-[0_0_15px_rgba(,,,)]",
        "Standby": "text-slate-400 border-slate-700 bg-slate-800"
    };

    return (
        <aside className="w-[320px] bg-bgPanel/95 backdrop-blur-xl border-l border-slate-700/80 flex flex-col shrink-0 overflow-y-auto scrollbar-thin relative z-10 shadow-[-10px_0_20px_rgba(,,,)] hidden lg:flex">
            <div className="p-6 border-b border-slate-700/50 bg-[#162032]">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-2"><FiAlertTriangle size={14} className="text-yellow-500" /> Threat Context</h3>

                <div className={`flex flex-col gap-1 p-4 rounded-xl border font-bold text-xs uppercase tracking-widest ${riskColors[currentRisk] || riskColors["Standby"]}`}>
                    <span className="opacity-60 text-[10px]">THREAT LEVEL</span>
                    <div className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${currentRisk !== 'Standby' ? 'bg-current shadow-[0_0_8px_currentColor] animate-pulse' : 'bg-slate-500'}`}></div>
                        {currentRisk}
                    </div>
                </div>

                <div className="mt-4 bg-[#0f172a] border border-slate-700 p-4 rounded-xl font-mono text-[13px] text-slate-200 border-l-4 border-l-primary shadow-inner">
                    <span className="block text-[10px] text-slate-500 mb-1 opacity-70">CLASSIFICATION</span>
                    {currentIssue}
                </div>
            </div>

            <div className="p-6 border-b border-slate-700/50">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-2"><FiActivity size={14} className="text-primary" /> Resolution Track</h3>
                <div className="h-1.5 w-full bg-[#0f172a] rounded-full overflow-hidden mb-4 border border-slate-700/50">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-primary w-[35%] shadow-[0_0_10px_rgba(,,,)] rounded-full"></div>
                </div>
                <p className="text-[13px] text-slate-300 leading-relaxed font-medium">
                    {currentIssue === 'Awaiting Data' ? 'Awaiting incident log parsing...' : 'Guidance active. Awaiting operator input/evidence.'}
                </p>
            </div>

            <div className="p-6 border-b border-slate-700/50 flex-1">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-2"><FiFileText size={14} className="text-sky-400" /> Context Required</h3>
                <ul className="flex flex-col gap-3">
                    {evidenceChecklist.length > 0 ? evidenceChecklist.map((item, i) => (
                        <motion.li initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i}
                            className="bg-slate-800/40 p-3 rounded-xl border border-slate-600 text-[12px] text-slate-300 flex items-start gap-3 shadow-sm hover:border-primary/50 transition-colors">
                            <span className="mt-0.5 min-w-[16px] flex justify-center text-primary"><FiCheckCircle size={14} /></span>
                            <span className="leading-snug">{item}</span>
                        </motion.li>
                    )) : (
                        <li className="p-6 border border-dashed border-slate-600 rounded-xl text-center flex flex-col items-center gap-2 text-slate-500">
                            <FiCheckCircle size={20} className="className-20 opacity-30" />
                            <span className="text-xs font-medium">No prerequisites detected.</span>
                        </li>
                    )}
                </ul>
            </div>

            <div className="p-6 bg-slate-900/30">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Action Panel</h3>
                <button
                    disabled={currentIssue === "Awaiting Data" || currentIssue === "Unknown"}
                    onClick={() => createCase(currentIssue, currentRisk, "Tracked from incident module.")}
                    className="w-full flex justify-center items-center gap-2 bg-primary/10 text-primary border border-primary/30 py-3.5 rounded-xl text-[11px] font-black tracking-widest hover:bg-primary hover:text-slate-900 transition-all disabled:opacity-30 disabled:pointer-events-none mb-3 shadow-md hover:shadow-[0_0_15px_rgba(,,,)] uppercase"
                >
                    <FiBriefcase size={16} /> Log as Case
                </button>
                <button className="w-full flex justify-center items-center gap-2 bg-slate-800 text-slate-300 border border-slate-600 py-3.5 rounded-xl text-[11px] font-bold tracking-widest hover:bg-slate-700 transition-all shadow-sm uppercase">
                    Download Report
                </button>
            </div>
        </aside>
    );
}
