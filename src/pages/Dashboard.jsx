import React, { useState } from "react";
import Sidebar from "../constants/dashboard/Sidebar";
import Topbar from "../constants/dashboard/Topbar";
import LiveAlertChart from "../constants/dashboard/LiveAlertChart";
import { alerts } from "../constants";
import { ShieldAlert, Clock, Activity, ChevronRight } from "lucide-react";

const cardClass =
  "w-full min-w-0 rounded-lg border border-[#E2E8F0] bg-white p-4 transition-colors dark:border-[#2B3A4B] dark:bg-[#111A24]";
const labelClass =
  "text-xs font-family-jetbrains font-medium text-[#64748B] dark:text-[#9AA9BA]";
const footRow =
  "flex items-start justify-between gap-3 font-family-jetbrains text-[11px] sm:text-[10px]";
const bigNumber = "font-family-jetbrains text-2xl font-bold sm:text-3xl";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F8FAFC] text-[#0F172A] transition-colors dark:bg-[#0B1117] dark:text-white">
      {/* Top navigation */}
      <div className="fixed inset-x-0 top-0 z-50 h-14 w-full">
        <Topbar
          menuOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen((open) => !open)}
        />
      </div>
      <div aria-hidden="true" className="h-14" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-14 z-30 bg-black/40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: off-canvas drawer below lg, fixed rail from lg up */}
      <div
        id="dashboard-sidebar"
        className={`fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 transform shadow-xl transition-transform duration-200 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={closeSidebar} />
      </div>

      {/* Main content */}
      <div className="flex min-h-[calc(100vh-3.5rem)] min-w-0 flex-col lg:ml-64">
        <header className="px-4 pb-2 pt-5 sm:px-6 sm:pt-7">
          <h1 className="text-xl font-semibold tracking-tight text-[#0F172A] sm:text-2xl dark:text-white">
            Security overview
          </h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#9AA9BA]">
            Monitor alerts, sensor health, and network activity.
          </p>
        </header>

        {/* Metric cards */}
        <section aria-label="Security metrics" className="w-full min-w-0">
          <div className="grid w-full grid-cols-1 gap-3 px-4 py-4 min-[480px]:grid-cols-2 sm:gap-4 sm:px-6 sm:py-6 xl:grid-cols-4 xl:gap-6">
            {/* Open Alerts */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <p className={labelClass}>Open alerts</p>
                <Activity size={14} className="text-[#2DD4BF]" />
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
                <span className={`${bigNumber} text-[#0F172A] dark:text-white`}>7</span>
                <span className="font-family-jetbrains text-xs text-[#64748B] dark:text-[#9AA9BA]">
                  active events
                </span>
              </div>
              <div className="my-2 border-t border-[#E2E8F0] dark:border-[#2B3A4B]" />
              <div className={footRow}>
                <span className="text-[#64748B] dark:text-[#9AA9BA]">Requires Analyst View</span>
                <span className="shrink-0 font-semibold text-[#2DD4BF]">
                  4 New
                </span>
              </div>
            </div>

            {/* Critical Severity */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <p className={labelClass}>Critical Severity</p>
                <ShieldAlert size={14} className="text-red-500" />
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
                <span className={`${bigNumber} text-red-400`}>1</span>
                <span className="font-family-jetbrains text-xs text-[#64748B] dark:text-[#9AA9BA]">
                  high risk
                </span>
              </div>
              <div className="my-2 border-t border-[#E2E8F0] dark:border-[#2B3A4B]" />
              <div className={footRow}>
                <span className="text-[#64748B] dark:text-[#9AA9BA]">Escalated to Cases</span>
                <span className="shrink-0 text-right font-semibold text-red-500">
                  1 Active Case
                </span>
              </div>
            </div>

            {/* Time to Alert */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <p className={labelClass}>Time to alert</p>
                <Clock size={14} className="text-blue-500" />
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-1">
                <span className={`${bigNumber} text-[#0F172A] dark:text-white`}>3.2</span>
                <span className="font-family-jetbrains text-xs text-[#64748B] dark:text-[#9AA9BA]">
                  s
                </span>
              </div>
              <div className="my-2 border-t border-[#E2E8F0] dark:border-[#2B3A4B]" />
              <div className={footRow}>
                <span className="text-[#64748B] dark:text-[#9AA9BA]">Ingestion Latency</span>
                <span className="shrink-0 text-right font-semibold text-[#2DD4BF]">
                  Below SLA (&lt;5s)
                </span>
              </div>
            </div>

            {/* Agent / Sensor Status */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <p className={labelClass}>Agent / Sensor Status</p>
                <span className="h-2 w-2 rounded-full bg-[#2DD4BF]" />
              </div>
              <p className={`mt-3 ${bigNumber} text-[#2DD4BF]`}>Online</p>
              <div className="my-2 border-t border-[#E2E8F0] dark:border-[#2B3A4B]" />
              <div className={footRow}>
                <span className="text-[#64748B] dark:text-[#9AA9BA]">Suricata Rule Engine</span>
                <span className="shrink-0 text-right font-semibold text-[#0F172A] dark:text-white">
                  v7.0.2 Nominal
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Charts section */}
        <section aria-label="Alert activity" className="w-full min-w-0 px-4 py-2 sm:px-6">
          <LiveAlertChart />
        </section>

        {/* Recent flagged alerts */}
        <section className="w-full min-w-0 px-4 py-4 font-family-jetbrains sm:px-6 sm:py-6">
          <div className="w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-white transition-colors dark:border-[#2B3A4B] dark:bg-[#111A24]">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] px-4 py-3 sm:px-5 sm:py-4 dark:border-[#2B3A4B]">
              <h2 className="text-xs font-semibold text-[#00BFA6] sm:text-sm">
                RECENT FLAGGED ALERTS
              </h2>
              <button className="flex items-center gap-1 text-xs font-medium text-[#00BFA6]">
                View All Queue (9)
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Below 2xl: card list */}
            <ul className="divide-y divide-[#E2E8F0] 2xl:hidden dark:divide-[#2B3A4B]">
              {alerts.map((alert, index) => (
                <li key={index} className="space-y-3 p-4 transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#18232F]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="whitespace-nowrap rounded-md bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                      {alert.severity}
                    </span>
                    <span className="font-mono text-[11px] text-[#64748B] dark:text-[#9AA9BA]">
                      {alert.time}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="break-all font-mono text-xs font-semibold text-[#00BFA6]">
                      {alert.alertId}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B] dark:text-[#9AA9BA]">{alert.title}</p>
                  </div>

                  <dl className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-[#94A3B8] dark:text-[#7B8A9C]">Affected asset</dt>
                      <dd className="break-all font-mono text-[#64748B] dark:text-[#9AA9BA]">
                        {alert.assetIP}
                      </dd>
                      <dd className="text-[#94A3B8] dark:text-[#7B8A9C]">{alert.assetName}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[#94A3B8] dark:text-[#7B8A9C]">Network boundary</dt>
                      <dd className="text-[#64748B] dark:text-[#9AA9BA]">
                        {alert.source}
                        <span className="mx-2 text-[#94A3B8] dark:text-[#7B8A9C]">→</span>
                        {alert.destination}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-center justify-between gap-2">
                    <span className="whitespace-nowrap rounded-md bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                      {alert.status}
                    </span>
                    <button className="whitespace-nowrap text-xs font-medium text-[#00BFA6]">
                      Investigate →
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* 2xl and up: table */}
            <div className="hidden w-full overflow-x-auto scrollbar-hide 2xl:block">
              <table className="w-full min-w-[1100px] border-collapse text-left font-family-jetbrains">
                <thead className="bg-[#F8FAFC] dark:bg-[#0B1117]">
                  <tr className="border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B] dark:border-[#2B3A4B] dark:text-[#9AA9BA]">
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Severity</th>
                    <th className="px-6 py-3">Alert ID & Title</th>
                    <th className="px-6 py-3">Affected Asset</th>
                    <th className="px-6 py-3">Network Boundary</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2B3A4B]">
                  {alerts.map((alert, index) => (
                    <tr
                      key={index}
                      className="text-xs transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#18232F]"
                    >
                      <td className="whitespace-nowrap px-6 py-3 font-mono text-[#64748B] dark:text-[#9AA9BA]">
                        {alert.time}
                      </td>
                      <td className="px-6 py-3">
                        <span className="whitespace-nowrap rounded-md bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <p className="whitespace-nowrap font-mono font-semibold text-[#00BFA6]">
                          {alert.alertId}
                        </p>
                        <p className="mt-1 whitespace-normal text-[11px] text-[#64748B] dark:text-[#9AA9BA]">
                          {alert.title}
                        </p>
                      </td>
                      <td className="px-6 py-3">
                        <p className="whitespace-nowrap font-mono text-[#64748B] dark:text-[#9AA9BA]">
                          {alert.assetIP}
                        </p>
                        <p className="whitespace-normal text-[11px] text-[#94A3B8] dark:text-[#7B8A9C]">
                          {alert.assetName}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-[#64748B] dark:text-[#9AA9BA]">
                        {alert.source}
                        <span className="mx-2 text-[#94A3B8] dark:text-[#7B8A9C]">→</span>
                        {alert.destination}
                      </td>
                      <td className="px-6 py-3">
                        <span className="whitespace-nowrap rounded-md bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button className="whitespace-nowrap font-medium text-[#00BFA6]">
                          Investigate →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;