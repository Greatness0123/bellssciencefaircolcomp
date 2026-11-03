import { NavLink } from "react-router";
import ThemeToggle from "../ThemeToggle";
import {
  LayoutDashboard,
  Bell,
  Network,
  Activity,
  FolderOpen,
  FileBarChart,
  Users,
  ScrollText,
  Settings,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", to: "/home", icon: LayoutDashboard },
  { label: "Alerts", to: "/alerts", icon: Bell, badge: 7 },
  { label: "Network Map", to: "/network-map", icon: Network },
  { label: "Agent Activity", to: "/agent-activity", icon: Activity },
  { label: "Incidents / Cases", to: "/incidents", icon: FolderOpen },
  { label: "Reports & Efficacy", to: "/reports", icon: FileBarChart },
  { label: "User Management", to: "/users", icon: Users },
  { label: "Audit Trail", to: "/audit-trail", icon: ScrollText },
  { label: "Settings", to: "/settings", icon: Settings },
];

const Sidebar = ({ onNavigate }) => {
  return (
    <aside className="flex h-full w-full flex-col border-r border-[#E2E8F0] bg-white px-4 py-5 transition-colors dark:border-[#2B3A4B] dark:bg-[#0B1117]">
      <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#9AA9BA]">
        Operations &amp; Detection
      </p>

      <nav
        aria-label="Dashboard navigation"
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
      >
        {NAV_ITEMS.map(({ label, to, icon: Icon, badge }) => (
          <NavLink
            key={label}
            to={to}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md border-l-2 px-2.5 py-2 text-[13px] font-medium transition ${
                isActive
                  ? "border-[#2DD4BF] bg-[#2DD4BF]/10 text-[#0F172A] dark:text-white"
                  : "border-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-[#9AA9BA] dark:hover:bg-[#111A24] dark:hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={15}
                  className={isActive ? "text-[#2DD4BF]" : ""}
                />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500/20 px-1 text-[10px] font-bold text-red-400">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Lab network card */}
      <div className="mt-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 dark:border-[#2B3A4B] dark:bg-[#111A24]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#2DD4BF]" />
          <p className="text-xs font-semibold text-[#0F172A] dark:text-white">
            Isolated Lab Network
          </p>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-[#64748B] dark:text-[#9AA9BA]">
          Suricata mirror active on eth1. Authorized testing environment only.
        </p>
      </div>

      {/* Theme mode */}
      <div className="mt-4 flex items-center justify-between px-1">
        <span className="text-[11px] font-medium text-[#64748B] dark:text-[#9AA9BA]">
          Theme Mode
        </span>
        <ThemeToggle />
      </div>
    </aside>
  );
};

export default Sidebar;
