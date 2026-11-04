import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { api, clearSession, openAlertSocket } from "../lib/api";
import ThemeToggle from "../constants/ThemeToggle";
import { X } from "lucide-react";

function mergeLogs(existing, incoming) {
  const logsByKey = new Map();
  [...existing, ...incoming].forEach((log) => {
    logsByKey.set(`${log.id}:${log.timestamp}`, log);
  });
  return [...logsByKey.values()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filterThreatsOnly, setFilterThreatsOnly] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("automated");
  const [pendingThreats, setPendingThreats] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);
  const pendingRef = useRef(new Map());
  const modeRef = useRef(mode);

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
    api.overview()
      .then((data) => {
        setOverview(data);
        return api.logs();
      })
      .then((data) => setLogs((prev) => mergeLogs(prev, data)))
      .catch(() => setError("Failed to load overview data"));

    // Resume the 5-log countdown for simulated threats that arrived before a
    // page reload (e.g. trigger.py ran, then the window was refreshed).
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
        setPendingThreats(Object.fromEntries(pendingRef.current));
      })
      .catch(() => {});

    const socket = openAlertSocket((message) => {
      if (message.type === "STREAM_CLEARED") {
        pendingRef.current.clear();
        setPendingThreats({});
        setLogs([]);
        api.overview().then(setOverview).catch(() => setError("Failed to refresh overview data"));
      }
      if (message.type === "DEMO_NEUTRALIZED") {
        // A simulated threat was resolved: mark its log row green, drop it
        // from the countdown, and reload counters so they stop counting it.
        const resolvedId = message.data?.id;
        setLogs((prev) => prev.map((log) => (
          log.id === resolvedId
            ? {
                ...log,
                status: "Neutralized",
                resolution_action: message.data?.resolution_action || log.resolution_action,
              }
            : log
        )));
        pendingRef.current.delete(resolvedId);
        setPendingThreats(Object.fromEntries(pendingRef.current));
        api.overview().then(setOverview).catch(() => setError("Failed to refresh overview data"));
      }
      if (message.type === "STREAM_COUNT") {
        setOverview((prev) => prev
          ? { ...prev, events_processed: message.data }
          : prev);
      }
      if (message.type === "LOG_STREAM" && message.data) {
        const log = message.data;
        setLogs((prev) => mergeLogs(prev, [log]));

        // 5-log resolution countdown, shared with the Dashboard behaviour.
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
        if (
          log.is_threat &&
          log.simulated &&
          log.status !== "Neutralized" &&
          modeRef.current === "automated" &&
          !pendingRef.current.has(log.id)
        ) {
          pendingRef.current.set(log.id, { remaining: 5, action: "automated" });
        }
        setPendingThreats(Object.fromEntries(pendingRef.current));
        for (const [id, action] of completed) {
          api.neutralizeDemoThreat(id, action)
            .then(() => api.overview())
            .then(setOverview)
            .catch(() => setError("Failed to resolve simulated threat"));
        }

        setOverview((prev) => {
          if (!prev) return prev;
          const isThreat = log.is_threat;
          const sev = log.severity;
          return {
            ...prev,
            sensor_status: "Online",
            critical_count: isThreat && sev === "Critical" ? prev.critical_count + 1 : prev.critical_count,
            high_count: isThreat && sev === "High" ? prev.high_count + 1 : prev.high_count,
            open_count: isThreat ? prev.open_count + 1 : prev.open_count,
          };
        });
      }
    });

    return () => {
      socket.close();
    };
  }, []);

  const queueManualResolution = (log, action) => {
    pendingRef.current.set(log.id, { remaining: 5, action });
    setPendingThreats(Object.fromEntries(pendingRef.current));
    setSelectedLog(null);
    setError("");
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const handleClearStream = async () => {
    try {
      await api.clearLogs();
      setLogs([]);
      setError("");
      const data = await api.overview();
      setOverview(data);
    } catch {
      setError("Failed to clear event stream");
    }
  };

  const displayedLogs = filterThreatsOnly
    ? logs.filter((log) => log.is_threat)
    : logs;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] transition-colors duration-300 dark:bg-[#0B1117] dark:text-white">
      <header className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-6 py-4 dark:border-[#2B3A4B] dark:bg-[#0B1117]">
        <div className="flex items-center gap-3">
          <img
            src="/Sentinel AI Hexagon Logo.png"
            alt="Sentinel AI Logo"
            className="h-8 w-8 object-contain"
          />
          <span className="text-xl font-bold tracking-tight">
            Sentinel <span className="text-[#2DD4BF]">AI</span>
          </span>
      
        </div>
        <div className="flex items-center gap-4">
          {/* Threat response mode toggle */}
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
                onClick={() => setMode(option)}
                className={`rounded px-2.5 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
                  mode === option
                    ? "bg-[#CCFBF1] text-[#0F766E] dark:bg-[#134E4A] dark:text-[#99F6E4]"
                    : "text-[#64748B] hover:bg-[#F8FAFC] dark:text-[#9AA9BA] dark:hover:bg-[#111A24]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {/* <ThemeToggle /> */}
          {/* <span className="text-sm font-medium text-[#64748B] dark:text-[#9AA9BA]">
            {session?.user?.full_name} ({session?.user?.role})
          </span> */}
          <button
            onClick={handleLogout}
            className="rounded-lg border border-[#E2E8F0] px-3.5 py-1.5 text-sm font-semibold text-[#64748B] transition hover:border-[#2DD4BF] hover:text-[#2DD4BF] dark:border-[#2B3A4B] dark:text-[#9AA9BA]"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Security Dashboard</h2>
        
          </div>
        
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        {overview && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 transition-shadow hover:shadow-sm dark:border-[#2B3A4B] dark:bg-[#111922]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#9AA9BA]">
                Critical Threats
              </p>
              <p className="mt-1 text-3xl font-bold text-red-500">
                {overview.critical_count}
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 transition-shadow hover:shadow-sm dark:border-[#2B3A4B] dark:bg-[#111922]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#9AA9BA]">
                High Severity
              </p>
              <p className="mt-1 text-3xl font-bold text-orange-500">
                {overview.high_count}
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 transition-shadow hover:shadow-sm dark:border-[#2B3A4B] dark:bg-[#111922]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#9AA9BA]">
                Active Alerts
              </p>
              <p className="mt-1 text-3xl font-bold text-[#2DD4BF]">
                {overview.open_count}
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 transition-shadow hover:shadow-sm dark:border-[#2B3A4B] dark:bg-[#111922]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#9AA9BA]">
                Total Packets Streamed
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-500">
                {overview.events_processed}
              </p>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm dark:border-[#2B3A4B] dark:bg-[#111922]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] px-6 py-4 dark:border-[#2B3A4B]">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base">Suricata Event Log Stream</h3>
              {/* <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-mono font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {displayedLogs.length} buffered
              </span> */}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#64748B] dark:text-[#9AA9BA]">
                <input
                  type="checkbox"
                  checked={filterThreatsOnly}
                  onChange={(e) => setFilterThreatsOnly(e.target.checked)}
                  className="h-4 w-4 rounded accent-red-600 focus:ring-red-500"
                />
                Show Malicious Threats Only
              </label>
              <button
                onClick={handleClearStream}
                className="text-xs font-medium text-[#64748B] hover:text-red-500 dark:text-[#9AA9BA]"
              >
                Clear Stream
              </button>
            </div>
          </div>

          <div className="max-h-[560px] overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:border-[#2B3A4B] dark:bg-[#0B1117] dark:text-[#9AA9BA]">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Proto</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-5">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-mono text-xs dark:divide-[#1F2A37]">
                {displayedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center font-sans text-sm text-[#64748B] dark:text-[#9AA9BA]">
                      {filterThreatsOnly
                        ? "No malicious threats detected."
                        : "Listening for incoming packets..."}
                    </td>
                  </tr>
                ) : (
                  displayedLogs.map((log) => {
                    const isThreat = log.is_threat;
                    const isCritical = log.severity === "Critical";
                    const pending = pendingThreats[log.id];
                    const isResolved = log.status === "Neutralized";
                    const rowClass = isThreat
                      ? isResolved
                        ? "cursor-pointer bg-green-50/90 text-green-950 font-semibold dark:bg-green-950/40 dark:text-green-100"
                        : isCritical
                          ? "cursor-pointer bg-red-50/90 text-red-950 font-semibold dark:bg-red-950/60 dark:text-red-100"
                          : "cursor-pointer bg-orange-50/90 text-orange-950 font-semibold dark:bg-orange-950/50 dark:text-orange-100"
                      : "hover:bg-gray-50/70 dark:hover:bg-gray-800/40 text-[#334155] dark:text-[#CBD5E1]";
                    return (
                      <tr
                        key={log.id + log.timestamp}
                        className={`transition-colors ${rowClass} ${isThreat ? "cursor-pointer" : ""}`}
                        onClick={() => isThreat && setSelectedLog(log)}
                        title={isThreat ? "Open threat details" : undefined}
                      >
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {isThreat ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-bold text-white shadow-xs ${isCritical ? "bg-red-600" : "bg-orange-600"}`}>
                                THREAT ({log.severity || "HIGH"})
                              </span>
                              {pending ? (
                                <span className="inline-block animate-pulse rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                  RESOLVING · {pending.remaining} LOG{pending.remaining === 1 ? "" : "S"}
                                </span>
                              ) : isResolved ? (
                                <span className="inline-block rounded bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                  RESOLVED{log.resolution_action ? ` · ${log.resolution_action.toUpperCase()}` : ""}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {log.event_type.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-[#64748B] dark:text-[#94A3B8]">
                          {log.timestamp ? log.timestamp.split("T")[1]?.slice(0, 12) : "-"}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap font-bold">
                          {log.proto}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {log.src_ip}{log.src_port ? `:${log.src_port}` : ""}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {log.dest_ip}{log.dest_port ? `:${log.dest_port}` : ""}
                        </td>
                        <td className="py-2.5 px-5 font-sans">
                          {isThreat ? (
                            <span className={`font-bold ${isCritical ? "text-red-700 dark:text-red-300" : "text-orange-700 dark:text-orange-300"}`}>
                              {log.signature || log.details}
                            </span>
                          ) : (
                            <span className="truncate max-w-md block text-[#475569] dark:text-[#94A3B8]">
                              {log.details || "-"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* <p className="mt-5 text-center text-xs text-[#64748B] dark:text-[#9AA9BA]">
          Live stream via WebSocket (/ws/alerts) &middot; Telemetry source: Kali Suricata Sensor (/var/log/suricata/eve.json)
        </p> */}
      </main>

      {selectedLog && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-threat-dialog-title"
            className="w-full max-w-lg rounded-lg border border-[#2B3A4B] bg-white p-5 text-[#0F172A] shadow-2xl dark:bg-[#111922] dark:text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-xs text-[#00BFA6]">{selectedLog.id}</p>
                <h2 id="home-threat-dialog-title" className="mt-1 text-lg font-semibold break-words">
                  {selectedLog.signature || selectedLog.details}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close threat dialog"
                onClick={() => setSelectedLog(null)}
                className="rounded-md p-1 text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#202C39]"
              >
                <X size={18} />
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 font-family-jetbrains text-xs">
              <div>
                <dt className="text-[#94A3B8] dark:text-[#7B8A9C]">Severity</dt>
                <dd className="font-semibold">{selectedLog.severity || "High"}</dd>
              </div>
              <div>
                <dt className="text-[#94A3B8] dark:text-[#7B8A9C]">Protocol</dt>
                <dd className="font-semibold">{selectedLog.proto}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[#94A3B8] dark:text-[#7B8A9C]">Source</dt>
                <dd className="break-all">{selectedLog.src_ip}{selectedLog.src_port ? `:${selectedLog.src_port}` : ""}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[#94A3B8] dark:text-[#7B8A9C]">Destination</dt>
                <dd className="break-all">{selectedLog.dest_ip}{selectedLog.dest_port ? `:${selectedLog.dest_port}` : ""}</dd>
              </div>
              <div className="col-span-2 min-w-0">
                <dt className="text-[#94A3B8] dark:text-[#7B8A9C]">Details</dt>
                <dd className="break-words">{selectedLog.details || "-"}</dd>
              </div>
            </dl>

            {selectedLog.status === "Neutralized" ? (
              <p className="mt-4 rounded-md bg-green-100 px-3 py-2 font-family-jetbrains text-xs font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400">
                ✓ THREAT RESOLVED
                {selectedLog.resolution_action ? ` · response: ${selectedLog.resolution_action}` : ""}
                {" "}— no host controls were executed.
              </p>
            ) : mode === "manual" && selectedLog.simulated ? (
              <>
                <p className="mt-5 text-xs font-semibold uppercase text-[#64748B] dark:text-[#9AA9BA]">
                  Select response
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {["quarantine", "destroy", "dismiss"].map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => queueManualResolution(selectedLog, action)}
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
                  : selectedLog.simulated
                    ? "Automated mode resolves this simulated threat after five more logs."
                    : "Automated mode resolves simulated trigger events after five more logs."}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
