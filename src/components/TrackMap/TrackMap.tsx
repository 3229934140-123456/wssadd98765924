import { useMemo } from "react";
import { MapPin, Navigation } from "lucide-react";
import type { TrackPoint, TransportPhase } from "@/types";
import { getTempColor, getPhaseColor } from "@/utils";
import { PHASE_LABELS } from "@/types";

interface TrackMapProps {
  trackPoints: TrackPoint[];
  currentIndex: number;
  tempMin: number;
  tempMax: number;
}

export default function TrackMap({ trackPoints, currentIndex, tempMin, tempMax }: TrackMapProps) {
  const { pathData, points, bounds, phaseRanges } = useMemo(() => {
    if (trackPoints.length === 0) {
      return { pathData: "", points: [], bounds: { minLng: 0, maxLng: 0, minLat: 0, maxLat: 0 }, phaseRanges: [] };
    }

    const lngs = trackPoints.map((p) => p.lng);
    const lats = trackPoints.map((p) => p.lat);
    const bounds = {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };

    const phaseRanges: Array<{ phase: TransportPhase; startIndex: number; endIndex: number }> = [];
    let currentPhase = trackPoints[0].phase;
    let startIndex = 0;
    trackPoints.forEach((point, index) => {
      if (point.phase !== currentPhase) {
        phaseRanges.push({ phase: currentPhase, startIndex, endIndex: index - 1 });
        currentPhase = point.phase;
        startIndex = index;
      }
    });
    phaseRanges.push({ phase: currentPhase, startIndex, endIndex: trackPoints.length - 1 });

    const padding = 0.1;
    const lngRange = bounds.maxLng - bounds.minLng || 0.1;
    const latRange = bounds.maxLat - bounds.minLat || 0.1;
    const lngPad = lngRange * padding;
    const latPad = latRange * padding;

    const svgWidth = 800;
    const svgHeight = 400;
    const margin = 40;

    const points = trackPoints.map((p, idx) => {
      const x = margin + ((p.lng - (bounds.minLng - lngPad)) / (lngRange + lngPad * 2)) * (svgWidth - margin * 2);
      const y =
        svgHeight - margin - ((p.lat - (bounds.minLat - latPad)) / (latRange + latPad * 2)) * (svgHeight - margin * 2);
      return { ...p, x, y, index: idx };
    });

    const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

    return { pathData, points, bounds, phaseRanges };
  }, [trackPoints]);

  const currentPoint = points[currentIndex];

  return (
    <div className="relative w-full h-full bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-slate-300">行驶轨迹</span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>正常</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span>预警</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span>异常</span>
        </div>
      </div>

      <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>

        <rect width="800" height="400" fill="url(#grid)" />

        {phaseRanges.map((range, i) => {
          const startPoint = points[range.startIndex];
          const endPoint = points[range.endIndex];
          if (!startPoint || !endPoint) return null;
          return (
            <g key={i}>
              <rect
                x={startPoint.x - 5}
                y={20}
                width={Math.abs(endPoint.x - startPoint.x) + 10}
                height={20}
                rx={4}
                fill={getPhaseColor(range.phase)}
                opacity={0.15}
              />
              <text
                x={(startPoint.x + endPoint.x) / 2}
                y={34}
                textAnchor="middle"
                fill={getPhaseColor(range.phase)}
                fontSize="10"
                fontWeight="500"
              >
                {PHASE_LABELS[range.phase]}
              </text>
            </g>
          );
        })}

        <path d={pathData} fill="none" stroke="#334155" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        <path
          d={pathData}
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1000"
          strokeDashoffset={1000 - (currentIndex / Math.max(points.length - 1, 1)) * 1000}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />

        {points.filter((_, i) => i % 4 === 0 || i === points.length - 1).map((point, i) => {
          const isPast = point.index <= currentIndex;
          const pointColor = getTempColor(point.temperature, tempMin, tempMax);
          return (
            <g key={`point-${i}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isPast ? 5 : 4}
                fill={isPast ? pointColor : "#334155"}
                stroke={isPast ? "#0f172a" : "#1e293b"}
                strokeWidth="2"
              />
            </g>
          );
        })}

        {currentPoint && (
          <g filter="url(#glow)">
            <circle
              cx={currentPoint.x}
              cy={currentPoint.y}
              r={16}
              fill="#3B82F6"
              opacity={0.2}
              className="animate-pulse"
            />
            <circle cx={currentPoint.x} cy={currentPoint.y} r={8} fill="#3B82F6" stroke="#fff" strokeWidth={2} />
            <circle cx={currentPoint.x} cy={currentPoint.y} r={3} fill="#fff" />
          </g>
        )}

        {points.length > 0 && (
          <>
            <g>
              <circle cx={points[0].x} cy={points[0].y} r={10} fill="#10B981" opacity={0.2} />
              <circle cx={points[0].x} cy={points[0].y} r={6} fill="#10B981" stroke="#fff" strokeWidth={1.5} />
              <text x={points[0].x} y={points[0].y - 14} textAnchor="middle" fill="#10B981" fontSize="10" fontWeight="500">
                起点
              </text>
            </g>
            <g>
              <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r={10}
                fill="#F59E0B"
                opacity={0.2}
              />
              <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r={6}
                fill="#F59E0B"
                stroke="#fff"
                strokeWidth={1.5}
              />
              <text
                x={points[points.length - 1].x}
                y={points[points.length - 1].y - 14}
                textAnchor="middle"
                fill="#F59E0B"
                fontSize="10"
                fontWeight="500"
              >
                终点
              </text>
            </g>
          </>
        )}
      </svg>

      {currentPoint && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Navigation className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200">当前位置</div>
              <div className="text-xs text-slate-500">{currentPoint.timestamp}</div>
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-xl font-bold font-mono tabular-nums"
              style={{ color: getTempColor(currentPoint.temperature, tempMin, tempMax) }}
            >
              {currentPoint.temperature > 0 ? "+" : ""}
              {currentPoint.temperature.toFixed(1)}°C
            </div>
            <div className="text-xs text-slate-500">{PHASE_LABELS[currentPoint.phase]}</div>
          </div>
        </div>
      )}
    </div>
  );
}
