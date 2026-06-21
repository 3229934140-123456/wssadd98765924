import { useNavigate } from "react-router-dom";
import { ChevronRight, Thermometer, Clock, DoorOpen, DoorClosed, Truck } from "lucide-react";
import { TempStatusBadge, DoorStatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useVehicleStore } from "@/store/vehicleStore";
import { getTempColor, relativeTime } from "@/utils";
import type { Vehicle } from "@/types";

export default function VehicleTable() {
  const navigate = useNavigate();
  const getFilteredVehicles = useVehicleStore((s) => s.getFilteredVehicles);
  const vehicles = getFilteredVehicles();

  const handleRowClick = (id: string) => {
    navigate(`/vehicles/${id}`);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/30">
              <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 w-16">状态</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">车牌号</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">当前温度</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">设定温区</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">门磁</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">承运商</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">货品类型</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">线路</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">司机</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">最近上报</th>
              <th className="text-center text-xs font-medium text-slate-400 px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <VehicleRow key={vehicle.id} vehicle={vehicle} onClick={() => handleRowClick(vehicle.id)} />
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-12 text-slate-500">
                  <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无符合条件的车辆</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-800/20 flex items-center justify-between text-xs text-slate-500">
        <span>共 {vehicles.length} 辆在途车辆</span>
        <span>数据每 30 秒自动刷新</span>
      </div>
    </div>
  );
}

function VehicleRow({ vehicle, onClick }: { vehicle: Vehicle; onClick: () => void }) {
  const tempColor = getTempColor(vehicle.currentTemp, vehicle.tempMin, vehicle.tempMax);

  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer transition-colors group"
    >
      <td className="px-5 py-4">
        <div className="relative">
          <TempStatusBadge status={vehicle.tempStatus} />
          {vehicle.tempStatus === "alert" && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100 font-mono">{vehicle.plateNumber}</div>
            <div className="text-xs text-slate-500">{vehicle.status === "in_transit" ? "运输中" : "停靠中"}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4" style={{ color: tempColor }} />
          <span className="text-lg font-bold font-mono tabular-nums" style={{ color: tempColor }}>
            {vehicle.currentTemp > 0 ? "+" : ""}
            {vehicle.currentTemp.toFixed(1)}°C
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm text-slate-300 font-mono tabular-nums">
          {vehicle.tempMin}°C ~ {vehicle.tempMax}°C
        </span>
      </td>
      <td className="px-4 py-4">
        <DoorStatusBadge status={vehicle.doorStatus} />
      </td>
      <td className="px-4 py-4">
        <span className="text-sm text-slate-300">{vehicle.carrier}</span>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm text-slate-300">{vehicle.cargoType}</span>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm text-slate-400 max-w-40 truncate block" title={vehicle.route}>
          {vehicle.route}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm text-slate-300">{vehicle.driverName}</div>
        <div className="text-xs text-slate-500">{vehicle.driverPhone}</div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono tabular-nums">{relativeTime(vehicle.lastReportTime)}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </td>
    </tr>
  );
}
