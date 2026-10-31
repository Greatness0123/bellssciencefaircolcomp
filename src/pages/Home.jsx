import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { api, getSession, clearSession, openAlertSocket } from "../lib/api";
import ThemeToggle from "../constants/ThemeToggle";

export default function Home() {
  const navigate = useNavigate();
  const session = getSession();
  const [overview, setOverview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filterThreatsOnly, setFilterThreatsOnly] = useState(false);
  const [error, setError] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const tableBottomRef = useRef(null);
  const clearCutoffRef = useRef(0);

  useEffect(() => {
    api.overview()
      .then((data) => {
        setOverview(data);
        if (data.recent_logs && data.recent_logs.length > 0) {
          setLogs(data.recent_logs);
        }
      })
      .catch(() => setError("Failed to load overview data"));

    const ws = openAlertSocket((message) => {
      if (message.type === "STREAM_CLEARED") {
        setLogs([]);
      }
      if (message.type === "STREAM_COUNT") {
        setOverview((prev) => prev
          ? { ...prev, events_processed: message.data }
          : prev);
      }
      if (message.type === "LOG_STREAM" && message.data) {
        const eventTime = Date.parse(message.data.timestamp);
        if (Number.isFinite(eventTime) && eventTime <= clearCutoffRef.current) {
          return;
        }
        setLogs((prev) => [message.data, ...prev.slice(0, 199)]);
        setOverview((prev) => {
          if (!prev) return prev;
          const isThreat = message.data.is_threat;
          const sev = message.data.severity;
          return {
            ...prev,
            sensor_status: "Online",
            critical_count: sev === "Critical" ? prev.critical_count + 1 : prev.critical_count,
            high_count: sev === "High" ? prev.high_count + 1 : prev.high_count,
            open_count: isThreat ? prev.open_count + 1 : prev.open_count,
          };
        });
      }
    });

    return () => {
      ws.close();
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const handleClearStream = async () => {
    if (isClearing) return;

    setIsClearing(true);
    clearCutoffRef.current = Date.now();
    setLogs([]);
    setError("");

    try {
      await api.clearLogs();
    } catch {
      setError("Failed to clear event stream");
    } finally {
      setIsClearing(false);
    }
  };

  const displayedLogs = filterThreatsOnly
    ? logs.filter((log) => log.is_threat && log.event_type === "alert")
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
          <ThemeToggle />
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
                disabled={isClearing}
                className="text-xs font-medium text-[#64748B] hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#9AA9BA]"
              >
                {isClearing ? "Clearing..." : "Clear Stream"}
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
                    return (
                      <tr
                        key={log.id + log.timestamp}
                        className={`transition-colors ${
                          isThreat
                            ? "bg-red-50/90 text-red-950 font-semibold dark:bg-red-950/60 dark:text-red-100"
                            : "hover:bg-gray-50/70 dark:hover:bg-gray-800/40 text-[#334155] dark:text-[#CBD5E1]"
                        }`}
                      >
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {isThreat ? (
                            <span className="inline-flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                              THREAT ({log.severity || "HIGH"})
                            </span>
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
                            <span className="font-bold text-red-700 dark:text-red-300">
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
    </div>
  );
}
