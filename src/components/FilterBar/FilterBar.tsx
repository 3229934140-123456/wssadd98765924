import { Search, Filter, X } from "lucide-react";
import { carriers, routes, cargoTypes } from "@/mock/vehicles";
import { useVehicleStore } from "@/store/vehicleStore";
import type { TempStatus } from "@/types";

export default function FilterBar() {
  const { filters, setFilters } = useVehicleStore();

  const tempStatusOptions: Array<{ value: TempStatus | "all"; label: string; color: string }> = [
    { value: "all", label: "全部状态", color: "text-slate-400" },
    { value: "normal", label: "正常", color: "text-emerald-400" },
    { value: "warning", label: "预警", color: "text-amber-400" },
    { value: "alert", label: "异常", color: "text-red-400" },
  ];

  const hasActiveFilter =
    filters.route !== "全部线路" ||
    filters.carrier !== "全部" ||
    filters.cargoType !== "全部" ||
    filters.tempStatus !== "all" ||
    filters.search !== "";

  const resetFilters = () => {
    setFilters({
      route: "全部线路",
      carrier: "全部",
      cargoType: "全部",
      tempStatus: "all",
      search: "",
    });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-5">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Filter className="w-4 h-4" />
          <span>筛选条件</span>
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="搜索车牌号 / 司机"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-56 h-9 pl-9 pr-3 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
            />
          </div>

          <select
            value={filters.route}
            onChange={(e) => setFilters({ route: e.target.value })}
            className="h-9 px-3 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors cursor-pointer"
          >
            {routes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={filters.carrier}
            onChange={(e) => setFilters({ carrier: e.target.value })}
            className="h-9 px-3 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors cursor-pointer"
          >
            {carriers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filters.cargoType}
            onChange={(e) => setFilters({ cargoType: e.target.value })}
            className="h-9 px-3 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors cursor-pointer"
          >
            {cargoTypes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-lg p-0.5">
            {tempStatusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilters({ tempStatus: opt.value })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filters.tempStatus === opt.value
                    ? "bg-slate-700 text-slate-100"
                    : `${opt.color} hover:text-slate-200`
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilter && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 h-9 px-3 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            重置
          </button>
        )}
      </div>
    </div>
  );
}
