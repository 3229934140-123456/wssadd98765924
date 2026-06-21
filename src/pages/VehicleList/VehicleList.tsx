import { useEffect, useMemo } from "react";
import { Truck, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import StatCard from "@/components/StatCard/StatCard";
import FilterBar from "@/components/FilterBar/FilterBar";
import VehicleTable from "@/components/VehicleTable/VehicleTable";
import { WatchlistPanel } from "@/components/WatchlistPanel/WatchlistPanel";
import { useVehicleStore } from "@/store/vehicleStore";

export default function VehicleList() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const filters = useVehicleStore((s) => s.filters);
  const getStats = useVehicleStore((s) => s.getStats);

  const stats = useMemo(() => {
    return getStats();
  }, [vehicles, filters, getStats]);

  useEffect(() => {
    const interval = setInterval(() => {
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <WatchlistPanel />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="在途车辆"
          value={stats.total}
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="温度正常"
          value={stats.normal}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="温度预警"
          value={stats.warning}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="温度异常"
          value={stats.alert}
          icon={AlertCircle}
          color="red"
        />
      </div>

      <FilterBar />

      <VehicleTable />
    </div>
  );
}
