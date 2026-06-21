import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from "recharts";
import type { TrackPoint } from "@/types";
import { getTempStatus, formatTime } from "@/utils";

interface TempChartProps {
  trackPoints: TrackPoint[];
  tempMin: number;
  tempMax: number;
  currentIndex: number;
  onIndexChange?: (index: number) => void;
}

export default function TempChart({
  trackPoints,
  tempMin,
  tempMax,
  currentIndex,
  onIndexChange,
}: TempChartProps) {
  const data = trackPoints.map((point, index) => ({
    ...point,
    time: formatTime(point.timestamp),
    index,
    isNormal: getTempStatus(point.temperature, tempMin, tempMax) === "normal",
    isWarning: getTempStatus(point.temperature, tempMin, tempMax) === "warning",
    isAlert: getTempStatus(point.temperature, tempMin, tempMax) === "alert",
  }));

  const yDomain = [
    Math.min(tempMin - 3, Math.min(...trackPoints.map((p) => p.temperature)) - 2),
    Math.max(tempMax + 3, Math.max(...trackPoints.map((p) => p.temperature)) + 2),
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const status = getTempStatus(point.temperature, tempMin, tempMax);
      const statusColor = status === "normal" ? "#10B981" : status === "warning" ? "#F59E0B" : "#EF4444";
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <div className="text-xs text-slate-400 mb-1">{point.timestamp}</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono" style={{ color: statusColor }}>
              {point.temperature.toFixed(1)}°C
            </span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                status === "normal"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : status === "warning"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {status === "normal" ? "正常" : status === "warning" ? "预警" : "异常"}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            阶段：{point.phase === "loading" ? "装货" : point.phase === "waiting" ? "等待" : point.phase === "transporting" ? "运输中" : "卸货"}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0 && onIndexChange) {
      onIndexChange(data.activePayload[0].payload.index);
    }
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

          <XAxis
            dataKey="time"
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={{ stroke: "#334155" }}
          />

          <YAxis
            domain={yDomain}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={{ stroke: "#334155" }}
            tickFormatter={(value) => `${value}°C`}
            width={50}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#475569", strokeDasharray: "3 3" }} />

          <ReferenceLine y={tempMin} stroke="#10B981" strokeDasharray="5 5" strokeWidth={1} />
          <ReferenceLine y={tempMax} stroke="#10B981" strokeDasharray="5 5" strokeWidth={1} />

          <Area
            type="monotone"
            dataKey="temperature"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#tempGradient)"
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const isCurrent = payload.index === currentIndex;
              const status = getTempStatus(payload.temperature, tempMin, tempMax);
              const color = status === "normal" ? "#10B981" : status === "warning" ? "#F59E0B" : "#EF4444";
              if (isCurrent) {
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={10} fill={color} opacity={0.2} className="animate-pulse" />
                    <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />
                  </g>
                );
              }
              return <circle cx={cx} cy={cy} r={0} />;
            }}
          />

          {currentIndex >= 0 && currentIndex < data.length && (
            <ReferenceLine x={data[currentIndex].time} stroke="#F8FAFC" strokeWidth={1.5} strokeDasharray="4 4" />
          )}

          <Brush
            dataKey="time"
            height={30}
            stroke="#475569"
            fill="#0f172a"
            travellerWidth={10}
          >
            <AreaChart>
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#3B82F6"
                strokeWidth={1}
                fill="#3B82F6"
                fillOpacity={0.1}
              />
            </AreaChart>
          </Brush>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
