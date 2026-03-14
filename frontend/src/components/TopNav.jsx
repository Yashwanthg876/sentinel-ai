import React from "react";
import { FiSearch, FiBell } from "react-icons/fi";
import { useAppContext } from "../context/AppContext";

export default function TopNav() {
    const { authEmail } = useAppContext();

    return (
        <header className="h-16 border-b border-slate-700/50 bg-bgPanel/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10 shadow-sm w-full">
            <div className="flex items-center gap-4 w-[450px]">
                <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2 w-full focus-within:border-primary focus-within:ring-1 ring-primary transition-all shadow-inner">
                    <FiSearch className="text-slate-400" />
                    <input type="text" placeholder="Search knowledge base, cases, SOPs..." className="bg-transparent border-none text-[13px] outline-none w-full placeholder-slate-500 text-slate-200 font-mono tracking-wide" />
                </div>
            </div>

            <div className="flex items-center gap-6 text-slate-400">
                <button className="hover:text-primary transition-colors relative">
                    <FiBell size={20} />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bgPanel"></span>
                </button>

                <div className="h-6 w-px bg-slate-700"></div>

                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-slate-200 group-hover:text-primary transition-colors">{(authEmail || "Admin").split('@')[0]}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Lvl 3 Operator</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(,,,)] ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                        {authEmail ? authEmail.substring(0, 2).toUpperCase() : "AD"}
                    </div>
                </div>
            </div>
        </header>
    );
}
