import React from "react";
import {
  LayoutDashboard,
  Bell,
  Network,
  Activity,
  FolderOpen,
  FileText,
  Users,
  History,
  Settings,
  ShieldCheck,
  Moon,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Alerts", icon: Bell, path: "/alerts" },
  { name: "Network Map", icon: Network, path: "/network-map" },
  { name: "Agent Activity", icon: Activity, path: "/agent-activity" },
  { name: "Incidents / Cases", icon: FolderOpen, path: "/incidents" },
  { name: "Reports & Efficacy", icon: FileText, path: "/reports" },
  { name: "User Management", icon: Users, path: "/users" },
  { name: "Audit Trail", icon: History, path: "/audit-trail" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

const Sidebar = () => {
  return (
    <aside className="flex min-h-[calc(100vh-56px)] h-full w-full overflow-y-auto   shrink-0 flex-col border-r border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#2B3A4B] dark:bg-[#0B1117]">
      {/* Navigation */}
      <div className="px-4 pt-5">
        <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
          Operations & Detection
        </p>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.name === "Overview";

            return (
              <a
                key={item.name}
                href={item.path}
                className={`relative flex items-center gap-2 rounded-r-md px-2 py-2 text-[11px] font-medium transition ${
                  isActive
                    ? "bg-white text-[#0F172A] shadow-sm dark:bg-[#1B2937] dark:text-white"
                    : "text-[#64748B] hover:bg-white hover:text-[#0F172A] dark:hover:bg-[#1B2937] dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-[#2DD4BF]" />
                )}

                <Icon size={13} className={isActive ? "text-[#2DD4BF]" : ""} />

                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="mt-auto border-t border-[#E2E8F0] p-3 dark:border-[#2B3A4B]">
        {/* Isolated lab network */}
        <div className="mb-3 rounded-md border border-[#E2E8F0] bg-white p-3 dark:border-[#2B3A4B] dark:bg-[#111C28]">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck size={13} className="text-[#2DD4BF]" />

            <span className="text-[11px] font-semibold text-[#0F172A] dark:text-white">
              Isolated Lab Network
            </span>
          </div>

          <p className="text-[9px] leading-relaxed text-[#64748B] dark:text-[#9AA9BA]">
            Suricata mirror active on eth1. Authorized testing environment only.
          </p>
        </div>

        {/* Theme mode */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-medium text-[#64748B]">
            Theme Mode
          </span>

          <button className="flex items-center gap-1 rounded border border-[#E2E8F0] bg-white px-2 py-1 text-[10px] text-[#0F172A] dark:border-[#2B3A4B] dark:bg-[#1B2937] dark:text-white">
            <Moon size={11} />
            Dark
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
