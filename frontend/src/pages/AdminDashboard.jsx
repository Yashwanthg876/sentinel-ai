import React, { useEffect } from "react";
import { FiActivity, FiShield, FiAlertTriangle, FiUsers } from "react-icons/fi";
import { useAppContext } from "../context/AppContext";

export default function AdminDashboard() {
    const { cases, loadCases, token } = useAppContext();

    useEffect(() => {
        if (token) loadCases();
    }, [token]);

    const activeIncidents = cases.filter(c => c.status !== 'Resolved');
    const criticalThreats = cases.filter(c => c.severity === 'Critical' || c.severity === 'High');

    return (
        <div className="p-10 overflow-y-auto h-full scrollbar-thin">
            <h2 className="text-3xl font-light mb-10 text-white tracking-wide">
                Enterprise <b className="font-bold border-b-2 border-primary pb-1">Command Center</b>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-3 text-slate-400 mb-4 font-medium uppercase tracking-wider text-xs"><FiShield size={16} className="text-emerald-400" /> Platform Status</div>
                    <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight flex items-center gap-2">
                        SECURE
                    </div>
                </div>
                <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-3 text-slate-400 mb-4 font-medium uppercase tracking-wider text-xs"><FiActivity size={16} className="text-sky-400" /> Security Incidents</div>
                    <div className="text-4xl font-black text-white">{activeIncidents.length}</div>
                </div>
                <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-3 text-slate-400 mb-4 font-medium uppercase tracking-wider text-xs"><FiUsers size={16} className="text-indigo-400" /> Employee Reports</div>
                    <div className="text-4xl font-black text-white">{cases.length}</div>
                </div>
                <div className="bg-bgPanel/50 backdrop-blur border border-red-900/50 bg-red-500/5 p-6 rounded-2xl shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:border-red-500/50 transition-colors">
                    <div className="flex items-center gap-3 text-red-400 mb-4 font-medium uppercase tracking-wider text-xs"><FiAlertTriangle size={16} /> Threat Alerts</div>
                    <div className="text-4xl font-black text-red-500">{criticalThreats.length}</div>
                </div>
            </div>

            <div className="bg-bgPanel/50 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-xl">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-slate-700/50 pb-4 text-slate-300 flex items-center gap-2"><FiAlertTriangle className="text-yellow-500" /> Priority Threat Queue</h3>
                {criticalThreats.length === 0 ? <p className="text-slate-500 text-sm font-mono mt-4">No critical threats detected across the enterprise.</p> :
                    <div className="flex flex-col gap-3">
                        {criticalThreats.map(c => (
                            <div key={c.case_id} className="flex items-center justify-between p-4 bg-red-900/10 rounded-xl border border-red-500/20 hover:bg-red-900/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="text-red-400 text-xs font-mono bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">{c.case_id}</span>
                                    <div>
                                        <div className="text-[15px] font-semibold text-slate-200">{c.issue_type}</div>
                                        <div className="text-[11px] text-slate-500 font-mono mt-1">Status: {c.status} | Severity: <span className="text-red-400 font-bold">{c.severity}</span></div>
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
