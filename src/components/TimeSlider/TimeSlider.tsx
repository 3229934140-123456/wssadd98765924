import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, DoorOpen, DoorClosed, Clock, Thermometer, AlertTriangle } from "lucide-react";
import type { TrackPoint, TransportPhase } from "@/types";
import { getPhaseColor, getTempStatus, formatDuration } from "@/utils";
import { PHASE_LABELS } from "@/types";

interface TimeSliderProps {
  trackPoints: TrackPoint[];
  currentIndex: number;
  tempMin: number;
  tempMax: number;
  onChange: (index: number) => void;
}

interface AnomalySegment {
  startIndex: number;
  endIndex: number;
  startPct: number;
  endPct: number;
  durationMinutes: number;
  type: "over_high" | "over_low";
}

export default function TimeSlider({ trackPoints, currentIndex, tempMin, tempMax, onChange }: TimeSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const totalPoints = trackPoints.length;
  const progress = totalPoints > 1 ? (currentIndex / (totalPoints - 1)) * 100 : 0;
  const displayIndex = hoverIndex ?? currentIndex;
  const displayPoint = trackPoints[displayIndex];

  const phaseRanges = useMemo(() => {
    if (trackPoints.length === 0) return [];
    const ranges: Array<{ phase: TransportPhase; startPct: number; endPct: number }> = [];
    let currentPhase = trackPoints[0].phase;
    let startIdx = 0;

    trackPoints.forEach((point, index) => {
      if (point.phase !== currentPhase) {
        ranges.push({
          phase: currentPhase,
          startPct: (startIdx / (totalPoints - 1)) * 100,
          endPct: ((index - 1) / (totalPoints - 1)) * 100,
        });
        currentPhase = point.phase;
        startIdx = index;
      }
    });
    ranges.push({
      phase: currentPhase,
      startPct: (startIdx / (totalPoints - 1)) * 100,
      endPct: 100,
    });
    return ranges;
  }, [trackPoints, totalPoints]);

  const anomalySegments = useMemo(() => {
    const segments: AnomalySegment[] = [];
    if (trackPoints.length === 0) return segments;

    let inAnomaly = false;
    let anomalyStart = 0;
    let anomalyType: "over_high" | "over_low" = "over_high";

    trackPoints.forEach((point, index) => {
      const status = getTempStatus(point.temperature, tempMin, tempMax);
      if (status === "alert" && !inAnomaly) {
        inAnomaly = true;
        anomalyStart = index;
        anomalyType = point.temperature > tempMax ? "over_high" : "over_low";
      } else if (status !== "alert" && inAnomaly) {
        inAnomaly = false;
        segments.push({
          startIndex: anomalyStart,
          endIndex: index - 1,
          startPct: (anomalyStart / (totalPoints - 1)) * 100,
          endPct: ((index - 1) / (totalPoints - 1)) * 100,
          durationMinutes: (index - anomalyStart) * 8,
          type: anomalyType,
        });
      }
    });

    if (inAnomaly) {
      segments.push({
        startIndex: anomalyStart,
        endIndex: trackPoints.length - 1,
        startPct: (anomalyStart / (totalPoints - 1)) * 100,
        endPct: 100,
        durationMinutes: (trackPoints.length - anomalyStart) * 8,
        type: anomalyType,
      });
    }

    return segments;
  }, [trackPoints, tempMin, tempMax, totalPoints]);

  const currentAnomaly = useMemo(() => {
    return anomalySegments.find(
      (s) => displayIndex >= s.startIndex && displayIndex <= s.endIndex
    );
  }, [anomalySegments, displayIndex]);

  const handlePosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current || totalPoints <= 1) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = x / rect.width;
      const index = Math.round(percent * (totalPoints - 1));
      onChange(index);
    },
    [totalPoints, onChange]
  );

  const updateHoverIndex = useCallback(
    (clientX: number) => {
      if (!sliderRef.current || totalPoints <= 1) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = x / rect.width;
      const index = Math.round(percent * (totalPoints - 1));
      setHoverIndex(index);
    },
    [totalPoints]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handlePosition(e.clientX);
  };

  const handleSliderMouseMove = (e: React.MouseEvent) => {
    updateHoverIndex(e.clientX);
  };

  const handleSliderMouseLeave = () => {
    setHoverIndex(null);
  };

  useEffect(() => {
    const handleDocMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handlePosition(e.clientX);
        updateHoverIndex(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleDocMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleDocMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handlePosition, updateHoverIndex]);

  useEffect(() => {
    let interval: number;
    if (isPlaying && currentIndex < totalPoints - 1) {
      interval = window.setInterval(() => {
        onChange(Math.min(currentIndex + 1, totalPoints - 1));
      }, 500);
    } else if (currentIndex >= totalPoints - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, totalPoints, onChange]);

  const togglePlay = () => {
    if (currentIndex >= totalPoints - 1) {
      onChange(0);
    }
    setIsPlaying(!isPlaying);
  };

  const skipBack = () => {
    onChange(Math.max(0, currentIndex - 5));
  };

  const skipForward = () => {
    onChange(Math.min(totalPoints - 1, currentIndex + 5));
  };

  const jumpToAnomaly = (segment: AnomalySegment) => {
    onChange(segment.startIndex);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-slate-300">时间轴回放</div>
          <div className="text-xs text-slate-500">
            共 {totalPoints} 个采样点 · 拖动滑块查看
          </div>
          {anomalySegments.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-red-400 font-medium">{anomalySegments.length} 处超温</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={skipBack}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="后退5个点"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
            title={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={skipForward}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="前进5个点"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {displayPoint && (
        <div
          className={`mb-4 p-4 rounded-xl border transition-all ${
            currentAnomaly
              ? "bg-red-500/5 border-red-500/30"
              : getTempStatus(displayPoint.temperature, tempMin, tempMax) === "warning"
              ? "bg-amber-500/5 border-amber-500/30"
              : "bg-slate-800/30 border-slate-700/50"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">采样时间</div>
                <div className="text-sm font-mono text-slate-200">{displayPoint.timestamp}</div>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                  <Thermometer className="w-3 h-3" />
                  当前温度
                </div>
                <div
                  className={`text-lg font-bold font-mono tabular-nums ${
                    getTempStatus(displayPoint.temperature, tempMin, tempMax) === "normal"
                      ? "text-emerald-400"
                      : getTempStatus(displayPoint.temperature, tempMin, tempMax) === "warning"
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {displayPoint.temperature > 0 ? "+" : ""}
                  {displayPoint.temperature.toFixed(1)}°C
                </div>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">运输阶段</div>
                <div
                  className="text-sm font-medium"
                  style={{ color: getPhaseColor(displayPoint.phase) }}
                >
                  {PHASE_LABELS[displayPoint.phase]}
                </div>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">门磁状态</div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    displayPoint.doorStatus === "open" ? "text-orange-400" : "text-slate-300"
                  }`}
                >
                  {displayPoint.doorStatus === "open" ? (
                    <>
                      <DoorOpen className="w-4 h-4" />
                      门打开
                    </>
                  ) : (
                    <>
                      <DoorClosed className="w-4 h-4" />
                      门已关
                    </>
                  )}
                </div>
              </div>
            </div>

            {currentAnomaly && (
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-red-400 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium">超温中</span>
                </div>
                <div className="text-sm text-slate-300">
                  已持续 <span className="text-red-400 font-medium">{formatDuration(currentAnomaly.durationMinutes)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {currentAnomaly.type === "over_high" ? "温度超高" : "温度超低"} · 第 {currentAnomaly.startIndex + 1} - {currentAnomaly.endIndex + 1} 点
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {anomalySegments.length > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">快速定位：</span>
          {anomalySegments.map((segment, i) => (
            <button
              key={i}
              onClick={() => jumpToAnomaly(segment)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs rounded-md transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              超温 #{i + 1} · {formatDuration(segment.durationMinutes)}
            </button>
          ))}
        </div>
      )}

      <div className="mb-3 flex items-end justify-between">
        <div className="text-xs text-slate-500">
          {trackPoints[0]?.timestamp || "--:--"}
        </div>
        <div className="text-xs text-slate-500">
          {trackPoints[totalPoints - 1]?.timestamp || "--:--"}
        </div>
      </div>

      <div className="mb-3 h-6 flex gap-0.5">
        {phaseRanges.map((range, i) => (
          <div
            key={i}
            className="relative flex-1 first:rounded-l last:rounded-r overflow-hidden"
            style={{
              flex: range.endPct - range.startPct,
              backgroundColor: getPhaseColor(range.phase) + "20",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-xs font-medium"
                style={{ color: getPhaseColor(range.phase) }}
              >
                {PHASE_LABELS[range.phase]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        ref={sliderRef}
        className="relative h-3 bg-slate-800 rounded-full cursor-pointer group"
        onMouseDown={handleMouseDown}
        onMouseMove={handleSliderMouseMove}
        onMouseLeave={handleSliderMouseLeave}
      >
        {anomalySegments.map((segment, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 bg-red-500/40"
            style={{
              left: `${segment.startPct}%`,
              width: `${segment.endPct - segment.startPct}%`,
            }}
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-red-500" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-red-500" />
          </div>
        ))}

        <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />

        {trackPoints.map((point, i) => {
          if (i % Math.max(1, Math.floor(totalPoints / 20)) !== 0) return null;
          const status = getTempStatus(point.temperature, tempMin, tempMax);
          const color =
            status === "normal" ? "#10B981" : status === "warning" ? "#F59E0B" : "#EF4444";
          const pct = (i / (totalPoints - 1)) * 100;
          return (
            <div
              key={i}
              className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-transform ${
                hoverIndex === i ? "scale-150" : ""
              }`}
              style={{ left: `calc(${pct}% - 3px)`, backgroundColor: color }}
            />
          );
        })}

        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-blue-500 transition-all group-hover:scale-110 cursor-grab active:cursor-grabbing z-10"
          style={{ left: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping-slow" />
        </div>

        {hoverIndex !== null && (
          <div
            className="absolute -top-8 -translate-x-1/2 px-2 py-1 bg-slate-700 text-xs text-slate-200 rounded font-mono whitespace-nowrap z-20"
            style={{ left: `${(hoverIndex / (totalPoints - 1)) * 100}%` }}
          >
            第 {hoverIndex + 1} 点
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        {(["loading", "waiting", "transporting", "unloading"] as TransportPhase[]).map((phase) => (
          <div key={phase} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getPhaseColor(phase) + "40" }} />
            <span className="text-slate-400">{PHASE_LABELS[phase]}</span>
          </div>
        ))}
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 bg-red-500/60 rounded" />
          <span className="text-slate-400">超温区间</span>
        </div>
      </div>
    </div>
  );
}
