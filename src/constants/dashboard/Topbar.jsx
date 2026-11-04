import React, { useState } from "react";
import { ChevronDown, Search, Bell, Monitor, Menu } from "lucide-react";

const Topbar = ({ menuOpen, onMenuClick, mode, onModeChange }) => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="relative flex h-14 w-full items-center gap-2 border-b border-[#E2E8F0] bg-white px-3 transition-colors sm:gap-3 sm:px-6 dark:border-[#2B3A4B] dark:bg-[#0B1117]">
      {/* Menu button (below lg) */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        aria-controls="dashboard-sidebar"
        className="shrink-0 rounded-md border border-[#E2E8F0] p-2 transition hover:bg-[#F8FAFC] lg:hidden dark:border-[#2B3A4B] dark:hover:bg-[#111A24]"
      >
        <Menu size={17} className="text-[#64748B] dark:text-[#9AA9BA]" />
      </button>

      {/* Brand */}
      <div className="flex shrink-0 items-center gap-2">
        <img
          src="/Sentinel AI Hexagon Logo.png"
          alt="Sentinel AI"
          className="h-7 w-7 object-contain"
        />
        <h1 className="text-base font-bold tracking-tight text-[#0F172A] sm:text-lg dark:text-white">
          Sentinel <span className="text-[#2DD4BF]">AI</span>
        </h1>
      </div>

      {/* Right side */}
      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3 lg:ml-0 lg:flex-1 lg:justify-between lg:pl-10 xl:pl-28">
        {/* Network selector (lg+) */}
        <button className="hidden items-center gap-3 rounded-md border-l border-l-[#E2E8F0] px-4 py-2 lg:flex dark:border-l-[#2B3A4B]">
          <Monitor size={16} className="text-[#2DD4BF]" />
          <div className="text-left">
            <p className="text-xs font-semibold text-[#0F172A] dark:text-white">
              Production Network
            </p>
            <p className="text-[10px] text-[#64748B] dark:text-[#9AA9BA]">Sensor-01</p>
          </div>
          <ChevronDown size={14} className="text-[#64748B] dark:text-[#9AA9BA]" />
        </button>

        <div
          className="flex shrink-0 items-center rounded-md border border-[#E2E8F0] p-0.5 dark:border-[#2B3A4B]"
          role="group"
          aria-label="Threat response mode"
        >
          {["automated", "manual"].map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => onModeChange(option)}
              className={`rounded px-2 py-1.5 text-[10px] font-semibold capitalize transition-colors sm:px-2.5 ${
                mode === option
                  ? "bg-[#CCFBF1] text-[#0F766E] dark:bg-[#134E4A] dark:text-[#99F6E4]"
                  : "text-[#64748B] hover:bg-[#F8FAFC] dark:text-[#9AA9BA] dark:hover:bg-[#111A24]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Sensor status */}
        <div className="hidden items-center gap-2 sm:flex sm:gap-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#2DD4BF]" />
          <span className="hidden text-xs font-semibold text-[#2DD4BF] sm:inline">
            Sensor Live
          </span>
          <span className="hidden font-mono text-[11px] text-[#64748B] xl:inline dark:text-[#9AA9BA]">
            | Pulse: 01s ago
          </span>
        </div>

        {/* Search: full input from md, icon button below */}
        <div className="hidden items-center gap-2 rounded-md border border-[#E2E8F0] px-3 py-2 md:flex dark:border-[#2B3A4B]">
          <Search size={15} className="text-[#64748B] dark:text-[#9AA9BA]" />
          <input
            type="text"
            placeholder="Search Alert IDs, IP..."
            className="w-32 bg-transparent text-xs text-[#0F172A] outline-none placeholder:text-[#64748B] lg:w-44 dark:text-white dark:placeholder:text-[#9AA9BA]"
          />
        </div>
        <button
          type="button"
          aria-label="Search"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((open) => !open)}
          className="rounded-md border border-[#E2E8F0] p-2 md:hidden dark:border-[#2B3A4B]"
        >
          <Search size={17} className="text-[#64748B] dark:text-[#9AA9BA]" />
        </button>
        {searchOpen && (
          <div className="absolute right-3 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border border-[#E2E8F0] bg-white p-3 shadow-lg md:hidden dark:border-[#2B3A4B] dark:bg-[#111A24]">
            <label className="flex items-center gap-2 rounded-md border border-[#E2E8F0] px-3 py-2 dark:border-[#2B3A4B]">
              <Search size={15} className="shrink-0 text-[#64748B] dark:text-[#9AA9BA]" />
              <input
                autoFocus
                type="search"
                aria-label="Search alerts or IPs"
                placeholder="Search alerts or IPs"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#64748B] dark:text-white dark:placeholder:text-[#9AA9BA]"
              />
            </label>
          </div>
        )}

        {/* Notifications */}
        <button type="button" aria-label="Notifications" className="relative shrink-0 rounded-md border border-[#E2E8F0] p-2 dark:border-[#2B3A4B]">
          <Bell size={17} className="text-[#64748B] dark:text-[#9AA9BA]" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            2
          </span>
        </button>

        {/* Administrator */}
        <button type="button" className="flex shrink-0 items-center gap-2 rounded-md px-1 py-2 sm:gap-3 md:px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#99F6E4] bg-[#CCFBF1] text-sm font-semibold text-[#0F766E]">
            J
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold text-[#0F172A] dark:text-white">James Peter</p>
            <p className="text-[10px] text-[#64748B] dark:text-[#9AA9BA]">Administrator</p>
          </div>
          <ChevronDown size={14} className="hidden text-[#64748B] md:block dark:text-[#9AA9BA]" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;