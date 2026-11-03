import { useState } from "react";
import { TrendingUp } from "lucide-react";

const W = 800;
const H = 300;
const PAD = { l: 16, r: 24, t: 16, b: 34 };
const START = 300; // 05:00 in minutes
const END = 600; // 10:00 in minutes
const THRESHOLD = 50;

// Replace with live data. `min` = minutes since midnight, `value` = 0-100 scale.
const DEFAULT_DATA = [
  { time: "05:00", min: 300, value: 8 },
  { time: "06:00", min: 360, value: 30 },
  { time: "07:00", min: 420, value: 22 },
  { time: "08:00", min: 480, value: 42 },
  { time: "09:30", min: 570, value: 72 },
  { time: "10:00", min: 600, value: 60 },
];

const TICKS = [
  { min: 300, label: "05:00" },
  { min: 360, label: "06:00" },
  { min: 420, label: "07:00" },
  { min: 480, label: "08:00" },
  { min: 540, label: "09:00" },
  { min: 600, label: "10:00 (Current)" },
];

const RANGES = ["1h", "6h", "24h"];

const x = (m) => PAD.l + ((m - START) / (END - START)) * (W - PAD.l - PAD.r);
const y = (v) => PAD.t + (1 - v / 100) * (H - PAD.t - PAD.b);

const LiveAlertChart = ({ data = DEFAULT_DATA }) => {
  const [range, setRange] = useState("6h");

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(d.min)},${y(d.value)}`)
    .join(" ");
  const area = `${line} L${x(data[data.length - 1].min)},${y(0)} L${x(
    data[0].min
  )},${y(0)} Z`;
  const breach = data.find((d) => d.value > THRESHOLD);

  return (
    <div className="w-full min-w-0 rounded-xl border border-[#E2E8F0] bg-white p-5 transition-colors dark:border-[#2B3A4B] dark:bg-[#111A24]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-family-jetbrains text-sm font-semibold uppercase text-[#2DD4BF]">
            <TrendingUp size={16} />
            Live Alert Volume Trend
          </h2>
          <p className="mt-1 text-[11px] text-[#64748B] dark:text-[#9AA9BA]">
            Observed events plotted against baseline anomaly threshold
          </p>
        </div>

        <div className="flex rounded-md border border-[#E2E8F0] p-0.5 dark:border-[#2B3A4B]">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded px-3 py-1 font-family-jetbrains text-[11px] font-medium transition ${
                range === r
                  ? "bg-[#2DD4BF] text-[#0B1117]"
                  : "text-[#64748B] hover:text-[#0F172A] dark:text-[#9AA9BA] dark:hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[560px] sm:min-w-0"
          role="img"
          aria-label="Live alert volume trend"
        >
        <defs>
          <linearGradient id="alertArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Baseline gridlines */}
        {[25, 75, 100].map((v) => (
          <line
            key={v}
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(v)}
            y2={y(v)}
            stroke="#64748B"
            strokeOpacity="0.35"
            strokeDasharray="4 6"
          />
        ))}

        {/* Threshold */}
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={y(THRESHOLD)}
          y2={y(THRESHOLD)}
          stroke="#F97316"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />

        {/* Area + line */}
        <path d={area} fill="url(#alertArea)" />
        <path
          d={line}
          fill="none"
          stroke="#2DD4BF"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Points */}
        {data.map((d) => {
          const isBreach = breach && d.min === breach.min;
          return (
            <circle
              key={d.min}
              cx={x(d.min)}
              cy={y(d.value)}
              r={isBreach ? 5 : 4}
              fill={isBreach ? "#EF4444" : "#2DD4BF"}
              stroke="#0B1117"
              strokeWidth="2"
            />
          );
        })}

        {/* Axis baseline */}
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={y(0)}
          y2={y(0)}
          stroke="#64748B"
          strokeOpacity="0.5"
        />

        {/* X labels */}
        {TICKS.map((t, i) => (
          <text
            key={t.min}
            x={x(t.min)}
            y={H - 10}
            fontSize="11"
            fill="#9AA9BA"
            fontFamily="monospace"
            textAnchor={i === 0 ? "start" : i === TICKS.length - 1 ? "end" : "middle"}
          >
            {t.label}
          </text>
        ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 font-family-jetbrains text-[11px] text-[#64748B] dark:text-[#9AA9BA]">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-[#2DD4BF]" />
          Observed Alert Volume
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dashed border-[#F97316]" />
          Target Anomaly Threshold
        </span>
        {breach && (
          <span className="flex items-center gap-2 text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Threshold breached at {breach.time}
          </span>
        )}
      </div>
    </div>
  );
};

export default LiveAlertChart;
