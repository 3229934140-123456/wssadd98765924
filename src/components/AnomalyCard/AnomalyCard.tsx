import { useNavigate } from "react-router-dom";
import {
  Thermometer,
  Clock,
  User,
  Phone,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ChevronRight,
} from "lucide-react";
import type { Anomaly } from "@/types";
import { PHASE_LABELS } from "@/types";
import { AnomalyStatusBadge } from "@/components/StatusBadge/StatusBadge";
import { formatDuration } from "@/utils";

interface AnomalyCardProps {
  anomaly: Anomaly;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function AnomalyCard({ anomaly, isSelected, onClick }: AnomalyCardProps) {
  const navigate = useNavigate();
  const isOverHigh = anomaly.type === "over_high";

  const handleViewTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/vehicles/${anomaly.vehicleId}`);
  };

  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/60 border rounded-xl p-5 cursor-pointer transition-all hover:bg-slate-800/60 ${
        isSelected
          ? "border-blue-500/50 ring-1 ring-blue-500/30"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg ${
              isOverHigh ? "bg-red-500/10" : "bg-blue-500/10"
            }`}
          >
            {isOverHigh ? (
              <ArrowUpRight className={`w-5 h-5 ${isOverHigh ? "text-red-400" : "text-blue-400"}`} />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-blue-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100 font-mono">
                {anomaly.plateNumber}
              </span>
              <AnomalyStatusBadge status={anomaly.status} />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {isOverHigh ? "温度超高" : "温度超低"} · {PHASE_LABELS[anomaly.phase]}阶段
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">最高温度</div>
          <div className="text-lg font-bold font-mono text-red-400 tabular-nums">
            {anomaly.maxTemp.toFixed(1)}°C
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">最低温度</div>
          <div className="text-lg font-bold font-mono text-blue-400 tabular-nums">
            {anomaly.minTemp.toFixed(1)}°C
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            持续时长
          </span>
          <span className="text-slate-200 font-medium">{formatDuration(anomaly.durationMinutes)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            影响车厢
          </span>
          <span className="text-slate-200">{anomaly.compartment}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            司机
          </span>
          <span className="text-slate-200">{anomaly.driverName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            承运商
          </span>
          <span className="text-slate-200">{anomaly.carrier}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          开始于 {anomaly.startTime.slice(11, 16)}
        </div>
        <button
          onClick={handleViewTrack}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
        >
          查看轨迹
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
