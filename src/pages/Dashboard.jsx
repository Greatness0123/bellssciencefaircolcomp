import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../constants/dashboard/Sidebar";
import Topbar from "../constants/dashboard/Topbar";
import LiveAlertChart from "../constants/dashboard/LiveAlertChart";
import { api, openAlertSocket } from "../lib/api";
import { ShieldAlert, Clock, Activity, ChevronRight, X } from "lucide-react";

const cardClass =
  "w-full min-w-0 rounded-lg border border-[#E2E8F0] bg-white p-4 transition-colors dark:border-[#2B3A4B] dark:bg-[#111A24]";
const labelClass =
  "text-xs font-family-jetbrains font-medium text-[#64748B] dark:text-[#9AA9BA]";
const footRow =
  "flex items-start justify-between gap-3 font-family-jetbrains text-[11px] sm:text-[10px]";
const bigNumber = "font-family-jetbrains text-2xl font-bold sm:text-3xl";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState("automated");
  const [alerts, setAlerts] = useState([]);
  const [overview, setOverview] = useState(null);
  const [pendingThreats, setPendingThreats] = useState({});
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionError, setActionError] = useState("");
  const pendingRef = useRef(new Map());
  const modeRef = useRef(mode);
  const seededRef = useRef(false);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    modeRef.current = mode;
    if (mode === "manual") {
      // Manual mode must never auto-resolve: cancel every automated countdown.
      for (const [id, pending] of Array.from(pendingRef.current.entries())) {
        if (pending.action === "automated") pendingRef.current.delete(id);
      }
      setPendingThreats(Object.fromEntries(pendingRef.current));
    } else {
      // Back in automated mode: re-arm auto-resolve for simulated threats
      // that are still unresolved.
      api.alerts({ limit: 200 })
        .then((alertData) => {
          if (modeRef.current !== "automated") return;
          for (const alert of alertData) {
            if (
              alert.evidence_json?.simulated &&
              alert.status !== "Neutralized" &&
              !pendingRef.current.has(alert.id)
            ) {
              pendingRef.current.set(alert.id, { remaining: 5, action: "automated" });
            }
          }
          if (modeRef.current === "automated") {
            setPendingThreats(Object.fromEntries(pendingRef.current));
          }
        })
        .catch(() => {});
    }
  }, [mode]);

  useEffect(() => {
    let active = true;
    const refreshDashboard = async () => {
      try {
        const [alertData, overviewData] = await Promise.all([
          api.alerts({ limit: 50 }),
          api.overview(),
        ]);
        if (active) {
          setAlerts(alertData);
          setOverview(overviewData);
        }
        return { alertData };
      } catch (error) {
        if (active) setActionError(error.message);
        return null;
      }
    };

    refreshDashboard().then((data) => {
      if (!active || !data || seededRef.current) return;
      seededRef.current = true;
      if (modeRef.current !== "automated") return;
      // Resume the countdown for simulated alerts that were raised before a
      // page reload (e.g. trigger.py ran, then the dashboard was refreshed).
      for (const alert of data.alertData) {
        if (
          alert.evidence_json?.simulated &&
          alert.status !== "Neutralized" &&
          !pendingRef.current.has(alert.id)
        ) {
          pendingRef.current.set(alert.id, { remaining: 5, action: "automated" });
        }
      }
      setPendingThreats(Object.fromEntries(pendingRef.current));
    });

    const socket = openAlertSocket((message) => {
      if (message.type === "STREAM_CLEARED" || message.type === "DEMO_NEUTRALIZED") {
        refreshDashboard();
        return;
      }
      if (message.type !== "LOG_STREAM" || !message.data) return;
      const log = message.data;
      const completed = [];

      for (const [id, pending] of pendingRef.current.entries()) {
        // Automated timers are paused while manual mode is active.
        if (pending.action === "automated" && modeRef.current === "manual") continue;
        const remaining = pending.remaining - 1;
        if (remaining <= 0) {
          pendingRef.current.delete(id);
          completed.push([id, pending.action]);
        } else {
          pendingRef.current.set(id, { ...pending, remaining });
        }
      }

      if (log?.is_threat && log.simulated && log.status !== "Neutralized" && modeRef.current === "automated") {
        if (!pendingRef.current.has(log.id)) {
          pendingRef.current.set(log.id, { remaining: 5, action: "automated" });
        }
      }

      setPendingThreats(Object.fromEntries(pendingRef.current));

      if (log?.is_threat) refreshDashboard();
      for (const [id, action] of completed) {
        api.neutralizeDemoThreat(id, action)
          .then(refreshDashboard)
          .catch((error) => {
            if (active) setActionError(error.message);
          });
      }
    });

    return () => {
      active = false;
      socket.close();
    };
  }, []);

  const queueManualResolution = (alert, action) => {
    pendingRef.current.set(alert.id, { remaining: 5, action });
    setPendingThreats(Object.fromEntries(pendingRef.current));
    setSelectedAlert(null);
    setActionError("");
  };

  // Keep the open threat dialog in sync with refreshed alert data so a
  // resolution shows up (green confirmation) without closing/reopening it.
  useEffect(() => {
    setSelectedAlert((selected) => {
      if (!selected) return selected;
      const fresh = alerts.find((alert) => alert.id === selected.id);
      return fresh || selected;
    });
  }, [alerts]);

  const openCount = overview?.open_count ?? alerts.filter((alert) =>
    ["New", "Acknowledged", "Investigating"].includes(alert.status)
  ).length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F8FAFC] text-[#0F172A] transition-colors dark:bg-[#0B1117] dark:text-white">
      {/* Top navigation */}
      <div className="fixed inset-x-0 top-0 z-50 h-14 w-full">
        <Topbar
          menuOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen((open) => !open)}
          mode={mode}
          onModeChange={setMode}
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
                <span className={`${bigNumber} text-[#0F172A] dark:text-white`}>{openCount}</span>
                <span className="font-family-jetbrains text-xs text-[#64748B] dark:text-[#9AA9BA]">
                  active events
                </span>
              </div>
              <div className="my-2 border-t border-[#E2E8F0] dark:border-[#2B3A4B]" />
              <div className={footRow}>
                <span className="text-[#64748B] dark:text-[#9AA9BA]">Requires Analyst View</span>
                <span className="shrink-0 font-semibold text-[#2DD4BF]">
                  {alerts.length} total threats
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
                <span className={`${bigNumber} text-red-400`}>{overview?.critical_count ?? 0}</span>
                <span className="font-family-jetbrains text-xs text-[#64748B] dark:text-[#9AA9BA]">
                  high risk
                </span>
              </div>
              <div className="my-2 border-t border-[#E2E8F0] dark:border-[#2B3A4B]" />
              <div className={footRow}>
                <span className="text-[#64748B] dark:text-[#9AA9BA]">Escalated to Cases</span>
                <span className="shrink-0 text-right font-semibold text-red-500">
                  {overview?.high_count ?? 0} high risk
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
                View All Queue ({alerts.length})
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Below 2xl: card list */}
            <ul className="divide-y divide-[#E2E8F0] 2xl:hidden dark:divide-[#2B3A4B]">
              {alerts.map((alert) => {
                const pending = pendingThreats[alert.id];
                const isResolved = alert.status === "Neutralized";
                const statusText = pending
                  ? `Resolving · ${pending.remaining} logs`
                  : isResolved
                    ? `Resolved${alert.evidence_json?.resolution_action ? ` · ${alert.evidence_json.resolution_action}` : ""}`
                    : alert.status;
                return (
                <li key={alert.id} className="space-y-3 p-4 transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#18232F]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="whitespace-nowrap rounded-md bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                      {alert.severity}
                    </span>
                    <span className="font-mono text-[11px] text-[#64748B] dark:text-[#9AA9BA]">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="break-all font-mono text-xs font-semibold text-[#00BFA6]">
                      {alert.id}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B] dark:text-[#9AA9BA]">{alert.title}</p>
                  </div>

                  <dl className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-[#94A3B8] dark:text-[#7B8A9C]">Affected asset</dt>
                      <dd className="break-all font-mono text-[#64748B] dark:text-[#9AA9BA]">
                        {alert.source_ip || "Unknown source"}
                      </dd>
                      <dd className="text-[#94A3B8] dark:text-[#7B8A9C]">{alert.category}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[#94A3B8] dark:text-[#7B8A9C]">Network boundary</dt>
                      <dd className="text-[#64748B] dark:text-[#9AA9BA]">
                        {alert.source_ip || "Unknown"}
                        <span className="mx-2 text-[#94A3B8] dark:text-[#7B8A9C]">→</span>
                        {alert.dest_ip || "Unknown"}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-center justify-between gap-2">
                    <span className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium ${
                      isResolved
                        ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                    }`}>
                      {statusText}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setActionError("");
                      }}
                      className="whitespace-nowrap text-xs font-medium text-[#00BFA6]"
                    >
                      {mode === "manual" ? "Review threat" : "Investigate"} →
                    </button>
                  </div>
                </li>
              );})}
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
                  {alerts.map((alert) => {
                    const pending = pendingThreats[alert.id];
                    const isResolved = alert.status === "Neutralized";
                    const statusText = pending
                      ? `Resolving · ${pending.remaining} logs`
                      : isResolved
                        ? `Resolved${alert.evidence_json?.resolution_action ? ` · ${alert.evidence_json.resolution_action}` : ""}`
                        : alert.status;
                    return (
                    <tr
                      key={alert.id}
                      className="text-xs transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#18232F]"
                    >
                      <td className="whitespace-nowrap px-6 py-3 font-mono text-[#64748B] dark:text-[#9AA9BA]">
                        {new Date(alert.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className="whitespace-nowrap rounded-md bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <p className="whitespace-nowrap font-mono font-semibold text-[#00BFA6]">
                          {alert.id}
                        </p>
                        <p className="mt-1 whitespace-normal text-[11px] text-[#64748B] dark:text-[#9AA9BA]">
                          {alert.title}
                        </p>
                      </td>
                      <td className="px-6 py-3">
                        <p className="whitespace-nowrap font-mono text-[#64748B] dark:text-[#9AA9BA]">
                          {alert.source_ip || "Unknown source"}
                        </p>
                        <p className="whitespace-normal text-[11px] text-[#94A3B8] dark:text-[#7B8A9C]">
                          {alert.category}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-[#64748B] dark:text-[#9AA9BA]">
                        {alert.source_ip || "Unknown"}
                        <span className="mx-2 text-[#94A3B8] dark:text-[#7B8A9C]">→</span>
                        {alert.dest_ip || "Unknown"}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium ${
                          isResolved
                            ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                        }`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedAlert(alert)}
                          className="whitespace-nowrap font-medium text-[#00BFA6]"
                        >
                          {mode === "manual" ? "Review threat" : "Investigate"} →
                        </button>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
      {selectedAlert && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
          onClick={() => setSelectedAlert(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="threat-dialog-title"
            className="w-full max-w-lg rounded-lg border border-[#2B3A4B] bg-white p-5 text-[#0F172A] shadow-2xl dark:bg-[#111A24] dark:text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-[#00BFA6]">{selectedAlert.id}</p>
                <h2 id="threat-dialog-title" className="mt-1 text-lg font-semibold">{selectedAlert.title}</h2>
              </div>
              <button
                type="button"
                aria-label="Close threat dialog"
                onClick={() => setSelectedAlert(null)}
                className="rounded-md p-1 text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#202C39]"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm text-[#64748B] dark:text-[#9AA9BA]">
              {selectedAlert.description}
            </p>
            {selectedAlert.status === "Neutralized" && (
              <p className="mt-4 rounded-md bg-green-100 px-3 py-2 font-family-jetbrains text-xs font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400">
                ✓ THREAT RESOLVED
                {selectedAlert.evidence_json?.resolution_action
                  ? ` · response: ${selectedAlert.evidence_json.resolution_action}`
                  : ""}
                {" "}— no host controls were executed.
              </p>
            )}
            {mode === "manual" &&
            selectedAlert.evidence_json?.simulated &&
            selectedAlert.status !== "Neutralized" ? (
              <>
                <p className="mt-5 text-xs font-semibold uppercase text-[#64748B] dark:text-[#9AA9BA]">
                  Select response
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {["quarantine", "destroy", "dismiss"].map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => queueManualResolution(selectedAlert, action)}
                      className="rounded-md border border-[#CBD5E1] px-2 py-2 text-xs font-semibold capitalize hover:border-[#00BFA6] hover:text-[#0F766E] dark:border-[#3B4A59] dark:hover:text-[#99F6E4]"
                    >
                      {action}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#64748B] dark:text-[#9AA9BA]">
                  The selected simulated response will be recorded after five more logs. No device controls are executed.
                </p>
              </>
            ) : (
              <p className="mt-5 text-xs text-[#64748B] dark:text-[#9AA9BA]">
                {mode === "manual"
                  ? "Manual response actions are available for simulated trigger events only."
                  : "Automated mode resolves simulated trigger events after five more logs."}
              </p>
            )}
            {actionError && <p role="alert" className="mt-3 text-sm text-red-600">{actionError}</p>}
          </section>
        </div>
      )}
    </main>
  );
};

export default Dashboard;