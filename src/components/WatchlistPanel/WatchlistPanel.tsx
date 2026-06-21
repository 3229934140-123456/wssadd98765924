import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Thermometer, DoorOpen, MapPin, Clock, AlertTriangle, X, Eye } from "lucide-react";
import { useVehicleStore } from "@/store/vehicleStore";
import { useAnomalyStore } from "@/store/anomalyStore";
import { TempStatusBadge, DoorStatusBadge } from "@/components/StatusBadge/StatusBadge";
import { formatDateTime, relativeTime } from "@/utils";
import { PHASE_LABELS } from "@/types";
import type { Vehicle, TransportPhase } from "@/types";

type SortReason = "anomaly" | "door_open" | "no_report" | "normal";
type FilterKey = "all" | "anomaly" | "door_open" | "no_report";

const SORT_REASON_LABELS: Record<Exclude<SortReason, "normal">, string> = {
  anomaly: "温度异常",
  door_open: "门磁开启",
  no_report: "超时未上报",
};

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "全部",
  anomaly: "温度异常",
  door_open: "门磁开启",
  no_report: "超时未上报",
};

const SORT_REASON_STYLES: Record<Exclude<SortReason, "normal">, string> = {
  anomaly: "bg-red-500/15 text-red-400 border border-red-500/30",
  door_open: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  no_report: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

const PHASE_PILL_STYLES: Record<TransportPhase, string> = {
  loading: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  waiting: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  transporting: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  unloading: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
};

interface WatchlistVehicleCardProps {
  vehicle: Vehicle;
  sortReason: SortReason;
  hasActiveAnomaly: boolean;
  latestAnomaly?: any;
}

function WatchlistVehicleCard({ vehicle, sortReason, hasActiveAnomaly, latestAnomaly }: WatchlistVehicleCardProps) {
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
      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
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

      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PHASE_PILL_STYLES[vehicle.currentPhase]}`}>
          {PHASE_LABELS[vehicle.currentPhase]}
        </span>
        {sortReason !== "normal" && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SORT_REASON_STYLES[sortReason]}`}>
            {SORT_REASON_LABELS[sortReason]}
          </span>
        )}
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
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const watchlistVehicles = useMemo(() => {
    return getWatchlistVehicles();
  }, [vehicles, watchlistIds, getWatchlistVehicles]);

  const activeAnomalies = useMemo(() => {
    return anomalies.filter((a) => a.status !== "resolved");
  }, [anomalies]);

  const filterCounts = useMemo(() => {
    const counts: Record<Exclude<FilterKey, "all">, number> = {
      anomaly: 0,
      door_open: 0,
      no_report: 0,
    };
    watchlistVehicles.forEach(({ sortReason }) => {
      if (sortReason !== "normal") {
        counts[sortReason]++;
      }
    });
    return counts;
  }, [watchlistVehicles]);

  const filteredVehicles = useMemo(() => {
    if (activeFilter === "all") {
      return watchlistVehicles;
    }
    return watchlistVehicles.filter(({ sortReason }) => sortReason === activeFilter);
  }, [watchlistVehicles, activeFilter]);

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

  const filterButtons: FilterKey[] = ["all", "anomaly", "door_open", "no_report"];

  const getFilterCount = (key: FilterKey): number => {
    if (key === "all") return watchlistVehicles.length;
    return filterCounts[key];
  };

  const getFilterEmptyMessage = (): string => {
    const label = FILTER_LABELS[activeFilter];
    return `暂无${label}的关注车辆`;
  };

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

      <div className="flex items-center gap-2 flex-wrap">
        {filterButtons.map((key) => {
          const count = getFilterCount(key);
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? "bg-slate-200 text-slate-900 shadow-sm"
                  : "bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-300"
              }`}
            >
              {FILTER_LABELS[key]} ({count})
            </button>
          );
        })}
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="bg-slate-800/20 border border-dashed border-slate-700/50 rounded-xl p-8 text-center">
          <Eye size={32} className="mx-auto text-slate-600 mb-2" />
          <div className="text-slate-400 text-sm">{getFilterEmptyMessage()}</div>
          <div className="text-slate-500 text-xs mt-1">
            切换其他筛选条件查看更多车辆
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVehicles.map(({ vehicle, sortReason }) => (
            <WatchlistVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              sortReason={sortReason}
              hasActiveAnomaly={activeAnomalies.some((a) => a.vehicleId === vehicle.id)}
              latestAnomaly={getVehicleAnomaly(vehicle.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
