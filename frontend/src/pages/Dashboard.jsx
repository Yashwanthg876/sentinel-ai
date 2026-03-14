import React, { useEffect } from "react";
import { FiBriefcase, FiCheckCircle, FiActivity } from "react-icons/fi";
import { useAppContext } from "../context/AppContext";

export default function Dashboard() {
    const { cases, loadCases, token } = useAppContext();

    useEffect(() => {
        if (token) loadCases();
    }, [token]);

    return (
        <div className="p-10 overflow-y-auto h-full scrollbar-thin">
            <h2 className="text-3xl font-light mb-10 text-white tracking-wide">
                Workspace <b className="font-bold border-b-2 border-primary pb-1">Dashboard</b>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-3 text-slate-400 mb-4 font-medium uppercase tracking-wider text-xs"><FiBriefcase size={16} className="text-sky-400" /> Active Incidents</div>
                    <div className="text-4xl font-black text-white">{cases.filter(c => c.status !== 'Resolved').length || 0}</div>
                </div>
                <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-3 text-slate-400 mb-4 font-medium uppercase tracking-wider text-xs"><FiCheckCircle size={16} className="text-green-400" /> Resolved</div>
                    <div className="text-4xl font-black text-white">{cases.filter(c => c.status === 'Resolved').length || 0}</div>
                </div>
                <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-3 text-slate-400 mb-4 font-medium uppercase tracking-wider text-xs"><FiActivity size={16} className="text-indigo-400" /> System Status</div>
                    <div className="text-4xl font-black text-sky-400 font-mono tracking-tight flex items-center gap-2">
                        <div className="w-3 h-3 bg-sky-400 rounded-full animate-pulse shadow-[0_0_10px_#38bdf8]"></div> 100%
                    </div>
                </div>
            </div>

            <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-xl">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-slate-700/50 pb-4 text-slate-300">Incident Timeline</h3>
                {cases.length === 0 ? <p className="text-slate-500 text-sm font-mono mt-4">No recent activity detected.</p> :
                    <div className="flex flex-col gap-3">
                        {cases.slice(0, 5).map(c => (
                            <div key={c.case_id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="text-primary text-xs font-mono bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">{c.case_id}</span>
                                    <div>
                                        <div className="text-[15px] font-semibold text-slate-200">{c.issue_type}</div>
                                        <div className="text-[11px] text-slate-500 font-mono mt-1">Status: {c.status}</div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 font-medium bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{new Date(c.timestamp).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                }
            </div>
        </div>
    );
}
