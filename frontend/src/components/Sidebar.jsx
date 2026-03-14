import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiMessageSquare, FiBriefcase, FiClock, FiSettings, FiLogOut, FiShield, FiChevronRight, FiChevronLeft, FiAlertTriangle, FiActivity, FiUsers, FiTarget } from "react-icons/fi";
import { useAppContext } from "../context/AppContext";

export default function Sidebar({ collapsed, setCollapsed }) {
    const { handleLogout, authRole } = useAppContext();
    const location = useLocation();

    const getNavItems = (role) => {
        if (role === 'student') {
            return [
                { id: '/', icon: <FiHome size={20} />, label: 'Dashboard' },
                { id: '/assistant', icon: <FiMessageSquare size={20} />, label: 'AI Assistant' },
                { id: '/assistant?topic=cyberbullying', icon: <FiAlertTriangle size={20} />, label: 'Report Cyberbullying' },
                { id: '/history', icon: <FiClock size={20} />, label: 'Incident History' },
                { id: '/settings', icon: <FiSettings size={20} />, label: 'Settings' },
            ];
        } else if (role === 'enterprise_user' || role === 'admin') {
            return [
                { id: '/', icon: <FiHome size={20} />, label: 'Dashboard' },
                { id: '/admin', icon: <FiActivity size={20} />, label: 'Security Incidents' },
                { id: '/cases', icon: <FiUsers size={20} />, label: 'Employee Reports' },
                { id: '/history', icon: <FiTarget size={20} />, label: 'Threat Alerts' },
                { id: '/settings', icon: <FiSettings size={20} />, label: 'Settings' },
            ];
        } else {
            return [
                { id: '/', icon: <FiHome size={20} />, label: 'Dashboard' },
                { id: '/assistant', icon: <FiMessageSquare size={20} />, label: 'AI Assistant' },
                { id: '/complaint-assistant', icon: <FiFileText size={20} />, label: 'Complaint Assistant' },
                { id: '/cases', icon: <FiBriefcase size={20} />, label: 'My Cases' },
                { id: '/history', icon: <FiClock size={20} />, label: 'Incident History' },
                { id: '/settings', icon: <FiSettings size={20} />, label: 'Settings' },
            ];
        }
    };

    const navItems = getNavItems(authRole);

    return (
        <aside className={`border-r border-slate-700/50 bg-bgPanel flex flex-col transition-all duration-300 z-20 shadow-xl ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-700/50">
                {!collapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="flex items-center gap-3">
                        <FiShield className="text-primary text-2xl drop-shadow-[0_0_8px_rgba(,,,)]" />
                        <span className="font-bold text-lg tracking-widest text-white">SENTINEL<span className="text-primary">AI</span></span>
                    </motion.div>
                )}
                {collapsed && <FiShield className="text-primary text-2xl mx-auto drop-shadow-[0_0_8px_rgba(,,,)]" />}
                <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white absolute right-[-14px] top-6 bg-slate-700 border border-slate-600 rounded-full p-0.5 shadow-lg z-50">
                    {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
                </button>
            </div>

            <nav className="flex-1 py-6 flex flex-col gap-1.5 px-3">
                {navItems.map((item, idx) => (
                    <Link key={idx} to={item.id}
                        className={`flex items-center gap-3.5 p-3 rounded-xl transition-all text-[14px] font-medium group
              ${location.pathname === item.id.split('?')[0] ? 'bg-primary/10 text-primary border border-primary/20 shadow-inner' : 'text-slate-400 border border-transparent hover:text-slate-100 hover:bg-slate-800'}`}>
                        <span className={`min-w-fit flex justify-center transition-transform ${location.pathname === item.id.split('?')[0] ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                        {!collapsed && <span className="tracking-wide">{item.label}</span>}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
                <button onClick={handleLogout} className={`flex items-center gap-3.5 w-full p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}>
                    <FiLogOut size={20} />
                    {!collapsed && <span className="text-sm font-medium tracking-wide">Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}
