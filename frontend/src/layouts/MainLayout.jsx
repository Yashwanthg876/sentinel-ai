import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import ContextPanel from "../components/ContextPanel";

export default function MainLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-bgMain text-slate-100 overflow-hidden font-sans selection:bg-primary/30 antialiased">
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 bg-[#0b1120]">
                <TopNav />

                <div className="flex-1 flex overflow-hidden">
                    <main className="flex-1 relative flex flex-col h-full z-0 min-w-0">
                        <Outlet />
                    </main>

                    <ContextPanel />
                </div>
            </div>
        </div>
    );
}
