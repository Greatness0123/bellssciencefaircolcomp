import React from "react";
import Sidebar from "../constants/dashboard/Sidebar";
import Topbar from "../constants/dashboard/Topbar";
import { alerts } from "../constants";
import { ShieldAlert, Clock, Bell, Activity, ChevronRight } from "lucide-react";

const Dashboard = () => {
  return (
    <main className="min-h-screen bg-[#F8FAFC] ">
      {/* Top navigation */}
      <div className="sticky top-0 z-50 w-full">
        <Topbar />
      </div>

      {/* Dashboard body */}
      <div className="flex min-h-[calc(100vh-56px)]">
        {/* Sidebar */}
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-[56px] z-40 h-[calc(100vh-56px)] w-[260px]">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="  ml-[260px] flex min-w-0 flex-1 flex-col">
          {/* Cards horizontal scrollbar */}
          <div className="w-full min-w-0 overflow-x-auto scrollbar-hide">
            <div className="grid w-full grid-cols-[repeat(4,calc((100%-3rem)/3))_3rem] gap-6 px-6 py-6">
              {/* Card 4 - Open Alerts */}
              <div className="w-full min-w-0 rounded-lg border-2 border-[#E2E8F0] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-family-jetbrains font-medium text-[#64748B]">
                    Open alerts
                  </p>
                  <Activity size={14} className="text-[#2DD4BF]" />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="font-family-jetbrains text-3xl font-bold text-[#0F172A]">
                    7
                  </span>
                  <span className="font-family-jetbrains text-xs text-[#64748B]">
                    active events
                  </span>
                </div>

                <div className="my-2 border-t border-[#E2E8F0]" />

                <div className="flex items-center justify-between font-family-jetbrains text-[10px]">
                  <span className="text-[#64748B]">Requires Analyst View</span>
                  <span className="font-semibold text-[#2DD4BF]">4 New</span>
                </div>
              </div>

              {/* Card 1 - Critical Severity */}
              <div className="w-full min-w-0 rounded-lg border-2 border-[#E2E8F0] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-family-jetbrains font-medium text-[#64748B]">
                    Critical Severity
                  </p>
                  <ShieldAlert size={14} className="text-red-500" />
                </div>

                <div className="mt-3 flex items-center gap-1">
                  <span className="text-3xl font-bold text-red-400">1</span>
                  <span className="font-family-jetbrains text-xs text-[#64748B]">
                    high risk
                  </span>
                </div>

                <div className="my-2 border-t border-[#E2E8F0]" />

                <div className="flex justify-between font-family-jetbrains text-[10px]">
                  <span className="text-[#64748B]">
                    Escalated to
                    <br />
                    Cases
                  </span>
                  <span className="text-right font-family-jetbrains font-semibold text-red-500">
                    1 Active
                    <br />
                    Case
                  </span>
                </div>
              </div>

              {/* Card 2 - Time to Alert */}
              <div className="w-full min-w-0 rounded-lg border-2 border-[#E2E8F0] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-family-jetbrains font-medium text-[#64748B]">
                    Time to alert
                  </p>
                  <Clock size={14} className="text-blue-500" />
                </div>

                <div className="mt-3 flex items-center gap-1">
                  <span className="font-family-jetbrains text-3xl font-bold text-[#0F172A]">
                    3.2
                  </span>
                  <span className="font-family-jetbrains text-xs text-[#64748B]">
                    s
                  </span>
                </div>

                <div className="my-2 border-t border-[#E2E8F0]" />

                <div className="flex justify-between font-family-jetbrains text-[10px]">
                  <span className="text-[#64748B]">
                    Ingestion
                    <br />
                    Latency
                  </span>
                  <span className="text-right font-family-jetbrains font-semibold text-[#2DD4BF]">
                    Below SLA
                    <br />
                    (&lt;5s)
                  </span>
                </div>
              </div>

              {/* Card 3 - Agent / Sensor Status */}
              <div className="w-full min-w-0 rounded-lg border-2 border-[#E2E8F0] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-family-jetbrains font-medium text-[#64748B]">
                    Agent / Sensor Status
                  </p>
                  <span className="h-2 w-2 rounded-full bg-[#2DD4BF]" />
                </div>

                <p className="mt-3 font-family-jetbrains text-3xl font-bold text-[#2DD4BF]">
                  Online
                </p>

                <div className="my-2 border-t border-[#E2E8F0]" />

                <div className="flex justify-between font-family-jetbrains text-[10px]">
                  <span className="text-[#64748B]">
                    Suricata Rule
                    <br />
                    Engine
                  </span>
                  <span className="text-right font-family-jetbrains font-semibold text-[#0F172A]">
                    v7.0.2
                    <br />
                    Nominal
                  </span>
                </div>
              </div>

              {/* Extra space after fourth card */}
              <div className="w-0.5" />
            </div>
          </div>
          {/* Charts section */}
          <section className="w-full px-6 py-6"></section>

          {/* Recent flagged alerts */}
          <section className="w-full min-w-0 px-6 py-6 font-family-jetbrains">
            <div className="w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
              {/* Table Header */}
              <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
                <h2 className="text-sm font-semibold text-[#00BFA6]">
                  RECENT FLAGGED ALERTS
                </h2>

                <button className="flex items-center gap-1 text-xs font-medium text-[#00BFA6]">
                  View All Queue (9)
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Horizontal Scroll */}
              <div className="w-full overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[1450px] table-fixed border-collapse text-left font-family-jetbrains">
                  <thead className="bg-[#F8FAFC]">
                    <tr className="border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
                      <th className="w-[190px] px-6 py-3">Time</th>
                      <th className="w-[130px] px-6 py-3">Severity</th>
                      <th className="w-[300px] px-6 py-3">Alert ID & Title</th>
                      <th className="w-[260px] px-6 py-3">Affected Asset</th>
                      <th className="w-[230px] px-6 py-3">Network Boundary</th>
                      <th className="w-[170px] px-6 py-3">Status</th>
                      <th className="w-[170px] px-6 py-3">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E2E8F0]">
                    {alerts.map((alert, index) => (
                      <tr
                        key={index}
                        className="text-xs transition-colors hover:bg-[#F8FAFC]"
                      >
                        {/* Time */}
                        <td className="whitespace-nowrap px-6 py-3 font-mono text-[#64748B]">
                          {alert.time}
                        </td>

                        {/* Severity */}
                        <td className="px-6 py-3">
                          <span className="whitespace-nowrap rounded-md bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-600">
                            {alert.severity}
                          </span>
                        </td>

                        {/* Alert ID & Title */}
                        <td className="px-6 py-3">
                          <p className="whitespace-nowrap font-mono font-semibold text-[#00BFA6]">
                            {alert.alertId}
                          </p>
                          <p className="mt-1 whitespace-normal text-[11px] text-[#64748B]">
                            {alert.title}
                          </p>
                        </td>

                        {/* Affected Asset */}
                        <td className="px-6 py-3">
                          <p className="whitespace-nowrap font-mono text-[#64748B]">
                            {alert.assetIP}
                          </p>
                          <p className="whitespace-normal text-[11px] text-[#94A3B8]">
                            {alert.assetName}
                          </p>
                        </td>

                        {/* Network Boundary */}
                        <td className="whitespace-nowrap px-6 py-3 text-[#64748B]">
                          {alert.source}
                          <span className="mx-2 text-[#94A3B8]">→</span>
                          {alert.destination}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-3">
                          <span className="whitespace-nowrap rounded-md bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-600">
                            {alert.status}
                          </span>
                        </td>

                        {/* Action */}
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
      </div>
    </main>
  );
};

export default Dashboard;
