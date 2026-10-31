import React from "react";
import { ChevronDown, Search, Bell, Monitor } from "lucide-react";

const Topbar = () => {
  return (
    <header className="flex h-14 w-full items-center  justify-between border-b border-[#E2E8F0] bg-white px-6">
      {/* Brand */}
      <div className="flex shrink-0 items-center gap-2">
        <img
          src="/Sentinel AI Hexagon Logo.png"
          alt="Sentinel AI"
          className="h-7 w-7 object-contain"
        />

        <h1 className="text-lg font-bold tracking-tight text-[#0F172A]">
          Sentinel <span className="text-[#2DD4BF]">AI</span>
        </h1>
      </div>

      {/* Right side */}
      <div className="flex  flex-1 items-center justify-between pl-28">
        {/* Network selector */}
        <button className="flex items-center gap-3 rounded-md border-l border-l-[#E2E8F0] px-4 py-2">
          <Monitor size={16} className="text-[#2DD4BF]" />

          <div className="text-left">
            <p className="text-xs font-semibold text-[#0F172A]">
              Production Network
            </p>
            <p className="text-[10px] text-[#64748B]">Sensor-01</p>
          </div>

          <ChevronDown size={14} className="text-[#64748B]" />
        </button>

        {/* Sensor status */}
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2DD4BF]" />

          <span className="text-xs font-semibold text-[#2DD4BF]">
            Sensor Live
          </span>

          <span className="font-mono text-[11px] text-[#64748B]">
            | Pulse: 01s ago
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-md border border-[#E2E8F0] px-3 py-2">
          <Search size={15} className="text-[#64748B]" />

          <input
            type="text"
            placeholder="Search Alert IDs, IP..."
            className="w-44 bg-transparent text-xs text-[#0F172A] outline-none placeholder:text-[#64748B]"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-md border border-[#E2E8F0] p-2">
          <Bell size={17} className="text-[#64748B]" />

          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            2
          </span>
        </button>

        {/* Administrator */}
        <button className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#99F6E4] bg-[#CCFBF1] text-sm font-semibold text-[#0F766E]">
            J
          </div>

          <div className="text-left">
            <p className="text-xs font-semibold text-[#0F172A]">James Peter</p>
            <p className="text-[10px] text-[#64748B]">Administrator</p>
          </div>

          <ChevronDown size={14} className="text-[#64748B]" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
