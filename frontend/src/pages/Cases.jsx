import React, { useEffect } from "react";
import { FiBriefcase, FiCheckCircle, FiGlobe, FiPaperclip, FiDownload } from "react-icons/fi";
import { useAppContext } from "../context/AppContext";

export default function Cases() {
    const { cases, loadCases, token } = useAppContext();

    useEffect(() => {
        if (token) loadCases();
    }, [token]);

    const riskColors = {
        "Critical": "text-red-400 border-red-500/30 bg-red-500/10 shadow-[0_0_15px_rgba(,,,)]",
        "High": "text-orange-400 border-orange-500/30 bg-orange-500/10 shadow-[0_0_15px_rgba(,,,)]",
        "Medium": "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_15px_rgba(,,,)]",
        "Low": "text-green-400 border-green-500/30 bg-green-500/10 shadow-[0_0_15px_rgba(,,,)]",
        "Standby": "text-slate-400 border-slate-700 bg-slate-800"
    };

    return (
        <div className="p-10 overflow-y-auto h-full scrollbar-thin">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 tracking-wide"><FiBriefcase className="text-primary" /> Recorded Incidents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map(c => (
                    <div key={c.case_id} className="bg-bgPanel border border-slate-700 rounded-2xl p-6 hover:border-primary/50 transition-colors shadow-lg hover:shadow-[0_0_15px_rgba(,,,)] flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-600">{c.case_id}</span>
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${riskColors[c.severity] || riskColors['Standby']}`}>{c.severity}</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-white">{c.issue_type}</h3>
                        {c.platform && (
                            <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest mb-3 bg-primary/5 w-fit px-2 py-1 rounded">
                                <FiGlobe size={12} /> {c.platform}
                            </div>
                        )}
                        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed flex-1">"{c.description}"</p>
                        
                        {c.evidence?.length > 0 && (
                            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                <FiPaperclip size={14} /> {c.evidence.length} Evidence Attachment(s)
                            </div>
                        )}
                        <div className="mt-5 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1.5"><FiCheckCircle className="text-primary" /> {c.status}</span>
                            <span className="text-[11px] font-mono text-slate-500">{new Date(c.timestamp).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
