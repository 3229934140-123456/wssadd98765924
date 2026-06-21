import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import type { TrackPoint, TransportPhase } from "@/types";
import { getPhaseColor, getTempStatus } from "@/utils";
import { PHASE_LABELS } from "@/types";

interface TimeSliderProps {
  trackPoints: TrackPoint[];
  currentIndex: number;
  tempMin: number;
  tempMax: number;
  onChange: (index: number) => void;
}

export default function TimeSlider({ trackPoints, currentIndex, tempMin, tempMax, onChange }: TimeSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalPoints = trackPoints.length;
  const progress = totalPoints > 1 ? (currentIndex / (totalPoints - 1)) * 100 : 0;

  const phaseRanges = (() => {
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
  })();

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

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handlePosition(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handlePosition(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handlePosition]);

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

  const currentPoint = trackPoints[currentIndex];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-slate-300">时间轴回放</div>
          <div className="text-xs text-slate-500">
            共 {totalPoints} 个采样点 · 拖动滑块查看
          </div>
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

      <div className="mb-3 flex items-end justify-between">
        <div className="text-xs text-slate-500">
          {trackPoints[0]?.timestamp || "--:--"}
        </div>
        {currentPoint && (
          <div className="text-center">
            <div className="text-sm font-mono text-slate-200">{currentPoint.timestamp}</div>
            <div
              className={`text-xs ${
                getTempStatus(currentPoint.temperature, tempMin, tempMax) === "normal"
                  ? "text-emerald-400"
                  : getTempStatus(currentPoint.temperature, tempMin, tempMax) === "warning"
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {currentPoint.temperature.toFixed(1)}°C · {PHASE_LABELS[currentPoint.phase]}
            </div>
          </div>
        )}
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
        className="relative h-2 bg-slate-800 rounded-full cursor-pointer group"
        onMouseDown={handleMouseDown}
      >
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
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
              style={{ left: `calc(${pct}% - 3px)`, backgroundColor: color }}
            />
          );
        })}

        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-blue-500 transition-all group-hover:scale-110 cursor-grab active:cursor-grabbing"
          style={{ left: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping-slow" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        {(["loading", "waiting", "transporting", "unloading"] as TransportPhase[]).map((phase) => (
          <div key={phase} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getPhaseColor(phase) + "40" }} />
            <span className="text-slate-400">{PHASE_LABELS[phase]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
