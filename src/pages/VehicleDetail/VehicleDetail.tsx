import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  User,
  Truck,
  Package,
  Thermometer,
  MapPin,
  Clock,
  DoorOpen,
  DoorClosed,
  AlertTriangle,
} from "lucide-react";
import TrackMap from "@/components/TrackMap/TrackMap";
import TempChart from "@/components/TempChart/TempChart";
import TimeSlider from "@/components/TimeSlider/TimeSlider";
import { TempStatusBadge, DoorStatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useVehicleStore } from "@/store/vehicleStore";
import { getTrackPoints } from "@/mock/trackPoints";
import { getAnomaliesByVehicle } from "@/mock/anomalies";
import { formatDuration, getTempColor } from "@/utils";
import { PHASE_LABELS } from "@/types";

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getVehicleById = useVehicleStore((s) => s.getVehicleById);
  const vehicle = getVehicleById(id || "");
  const trackPoints = useMemo(() => getTrackPoints(id || ""), [id]);
  const anomalies = useMemo(() => getAnomaliesByVehicle(id || ""), [id]);

  const [currentIndex, setCurrentIndex] = useState(trackPoints.length - 1);

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Truck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">未找到该车辆信息</p>
          <button
            onClick={() => navigate("/vehicles")}
            className="mt-4 px-4 py-2 text-sm text-blue-400 hover:text-blue-300"
          >
            返回车辆列表
          </button>
        </div>
      </div>
    );
  }

  const currentPoint = trackPoints[currentIndex];
  const activeAnomalies = anomalies.filter((a) => a.status !== "resolved");

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/vehicles")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回车辆列表
        </button>

        {activeAnomalies.length > 0 && (
          <button
            onClick={() => navigate("/anomalies")}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            {activeAnomalies.length} 个异常待处理
          </button>
        )}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-100 font-mono">{vehicle.plateNumber}</h2>
                <TempStatusBadge status={vehicle.tempStatus} />
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {vehicle.cargoType}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {vehicle.route}
                </span>
                <DoorStatusBadge status={vehicle.doorStatus} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <InfoItem
              icon={Thermometer}
              label="当前温度"
              value={
                <span
                  className="text-2xl font-bold font-mono tabular-nums"
                  style={{ color: getTempColor(vehicle.currentTemp, vehicle.tempMin, vehicle.tempMax) }}
                >
                  {vehicle.currentTemp > 0 ? "+" : ""}
                  {vehicle.currentTemp.toFixed(1)}°C
                </span>
              }
              subValue={`温区: ${vehicle.tempMin}°C ~ ${vehicle.tempMax}°C`}
            />
            <InfoItem
              icon={User}
              label="司机"
              value={<span className="text-lg font-medium text-slate-200">{vehicle.driverName}</span>}
              subValue={vehicle.driverPhone}
            />
            <InfoItem
              icon={Clock}
              label="最近上报"
              value={<span className="text-sm font-mono text-slate-300">{vehicle.lastReportTime}</span>}
              subValue={vehicle.carrier}
            />
            <a
              href={`tel:${vehicle.driverPhone.replace(/\*/g, "0")}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/20 transition-colors"
            >
              <Phone className="w-4 h-4" />
              联系司机
            </a>
          </div>
        </div>
      </div>

      <div className="h-80">
        <TrackMap
          trackPoints={trackPoints}
          currentIndex={currentIndex}
          tempMin={vehicle.tempMin}
          tempMax={vehicle.tempMax}
        />
      </div>

      <TimeSlider
        trackPoints={trackPoints}
        currentIndex={currentIndex}
        tempMin={vehicle.tempMin}
        tempMax={vehicle.tempMax}
        onChange={setCurrentIndex}
      />

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200">温度曲线</h3>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-0.5 bg-emerald-500" style={{ borderStyle: "dashed" }}></div>
              <span>温区范围</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>当前位置</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <TempChart
            trackPoints={trackPoints}
            tempMin={vehicle.tempMin}
            tempMax={vehicle.tempMax}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {(["loading", "waiting", "transporting", "unloading"] as const).map((phase) => {
          const phasePoints = trackPoints.filter((p) => p.phase === phase);
          const temps = phasePoints.map((p) => p.temperature);
          const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
          const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;
          const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
          const duration = phasePoints.length * 8;

          const hasAlert = phasePoints.some(
            (p) => p.temperature < vehicle.tempMin || p.temperature > vehicle.tempMax
          );

          return (
            <div
              key={phase}
              className={`bg-slate-900/60 border rounded-xl p-4 transition-all ${
                hasAlert
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">{PHASE_LABELS[phase]}</span>
                {hasAlert && (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    超温
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">平均温度</span>
                  <span
                    className="font-mono tabular-nums"
                    style={{ color: getTempColor(avgTemp, vehicle.tempMin, vehicle.tempMax) }}
                  >
                    {avgTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">最高/最低</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {maxTemp.toFixed(1)} / {minTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">持续时长</span>
                  <span className="text-slate-300">{formatDuration(duration)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  subValue?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-lg bg-slate-800/50">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
        {value}
        {subValue && <div className="text-xs text-slate-500 mt-0.5">{subValue}</div>}
      </div>
    </div>
  );
}
