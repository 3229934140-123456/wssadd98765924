import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Thermometer, DoorOpen, MapPin, Clock, AlertTriangle, X, Eye } from "lucide-react";
import { useVehicleStore } from "@/store/vehicleStore";
import { useAnomalyStore } from "@/store/anomalyStore";
import { TempStatusBadge, DoorStatusBadge } from "@/components/StatusBadge/StatusBadge";
import { formatDateTime, relativeTime } from "@/utils";
import { PHASE_LABELS } from "@/types";
import type { Vehicle } from "@/types";

interface WatchlistVehicleCardProps {
  vehicle: Vehicle;
  hasActiveAnomaly: boolean;
  latestAnomaly?: any;
}

function WatchlistVehicleCard({ vehicle, hasActiveAnomaly, latestAnomaly }: WatchlistVehicleCardProps) {
  const navigate = useNavigate();
  const toggleWatchlist = useVehicleStore((s) => s.toggleWatchlist);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(vehicle.id);
  };

  return (
    <div
      className={`relative p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${
        hasActiveAnomaly
          ? "bg-red-500/5 border-red-500/30 hover:bg-red-500/10"
          : vehicle.tempStatus === "warning"
          ? "bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10"
          : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50"
      }`}
      onClick={() => navigate(`/vehicle/${vehicle.id}`)}
    >
      <button
        onClick={handleRemove}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        title="移出关注"
      >
        <X size={16} />
      </button>

      <div className="flex items-start justify-between mb-3 pr-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono">{vehicle.plateNumber}</span>
            <TempStatusBadge status={vehicle.tempStatus} />
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {vehicle.carrier} · {vehicle.cargoType}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Thermometer size={14} className="text-cyan-400" />
          <span className="font-mono font-bold text-lg">
            {vehicle.currentTemp.toFixed(1)}°C
          </span>
          <span className="text-xs text-slate-500">
            [{vehicle.tempMin}-{vehicle.tempMax}]
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DoorOpen size={14} className={vehicle.doorStatus === "open" ? "text-amber-400" : "text-emerald-400"} />
          <DoorStatusBadge status={vehicle.doorStatus} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
        <MapPin size={14} />
        <span>{vehicle.route}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock size={12} />
        <span>{relativeTime(vehicle.lastReportTime)}</span>
        <span className="text-slate-600">·</span>
        <span>{formatDateTime(vehicle.lastReportTime)}</span>
      </div>

      {hasActiveAnomaly && latestAnomaly && (
        <div className="mt-3 pt-3 border-t border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertTriangle size={12} />
            <span className="font-medium">
              {latestAnomaly.type === "over_high" ? "超高" : "超低"} {latestAnomaly.maxTemp.toFixed(1)}°C
            </span>
            <span className="text-slate-500">·</span>
            <span>{PHASE_LABELS[latestAnomaly.phase]}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function WatchlistPanel() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const watchlistIds = useVehicleStore((s) => s.watchlistIds);
  const getWatchlistVehicles = useVehicleStore((s) => s.getWatchlistVehicles);
  const anomalies = useAnomalyStore((s) => s.anomalies);
  const toggleWatchlist = useVehicleStore((s) => s.toggleWatchlist);

  const watchlistVehicles = useMemo(() => {
    return getWatchlistVehicles();
  }, [vehicles, watchlistIds, getWatchlistVehicles]);

  const activeAnomalies = anomalies.filter((a) => a.status !== "resolved");

  const getVehicleAnomaly = (vehicleId: string) => {
    return activeAnomalies.find((a) => a.vehicleId === vehicleId);
  };

  if (watchlistVehicles.length === 0) {
    return (
      <div className="bg-slate-800/20 border border-dashed border-slate-700/50 rounded-xl p-8 text-center">
        <Eye size={32} className="mx-auto text-slate-600 mb-2" />
        <div className="text-slate-400 text-sm">暂无关注车辆</div>
        <div className="text-slate-500 text-xs mt-1">
          点击车辆列表中的 ☆ 图标添加重点车到盯车工作台
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-amber-400" />
          <span className="font-semibold">多车盯车工作台</span>
          <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
            {watchlistVehicles.length} 辆重点车
          </span>
        </div>
        <div className="text-xs text-slate-500">
          异常车自动排前 · 实时刷新状态
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {watchlistVehicles.map((vehicle) => (
          <WatchlistVehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            hasActiveAnomaly={activeAnomalies.some((a) => a.vehicleId === vehicle.id)}
            latestAnomaly={getVehicleAnomaly(vehicle.id)}
          />
        ))}
      </div>
    </div>
  );
}
