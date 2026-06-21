import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  User,
  Clock,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  History,
  Lightbulb,
  Truck,
} from "lucide-react";
import { useAnomalyStore } from "@/store/anomalyStore";
import { AnomalyStatusBadge } from "@/components/StatusBadge/StatusBadge";
import { HANDLE_ACTION_LABELS } from "@/types";
import { formatDuration } from "@/utils";

export default function HandoverView() {
  const navigate = useNavigate();
  const anomalies = useAnomalyStore((s) => s.anomalies);
  const handoverRecords = useAnomalyStore((s) => s.handoverRecords);
  const getUnclosedSummary = useAnomalyStore((s) => s.getUnclosedSummary);

  const summary = useMemo(() => {
    return getUnclosedSummary();
  }, [anomalies, handoverRecords, getUnclosedSummary]);

  const pendingItems = summary.filter((s) => s.anomaly.status === "pending");
  const processingItems = summary.filter((s) => s.anomaly.status === "processing");
  const reviewingItems = summary.filter((s) => s.anomaly.status === "reviewing");

  const handleViewTrack = (vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}`);
  };

  const handleViewAnomaly = (anomalyId: string) => {
    const event = new CustomEvent("selectAnomaly", { detail: { anomalyId } });
    window.dispatchEvent(event);
  };

  const Section = ({
    title,
    items,
    color,
    bgColor,
  }: {
    title: string;
    items: typeof summary;
    color: string;
    bgColor: string;
  }) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 ${color}`}>
          <div className={`w-1 h-5 rounded-full ${bgColor}`} />
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs text-slate-500">({items.length} 辆)</span>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.anomaly.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all cursor-pointer"
              onClick={() => handleViewAnomaly(item.anomaly.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 font-mono">
                        {item.anomaly.plateNumber}
                      </span>
                      <AnomalyStatusBadge status={item.anomaly.status} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.anomaly.carrier} · {item.anomaly.cargoType}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="text-xs text-slate-500 mb-1">异常时长</div>
                  <div className="text-sm font-medium text-slate-200">
                    {formatDuration(item.anomaly.durationMinutes)}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="text-xs text-slate-500 mb-1">峰值温度</div>
                  <div
                    className={`text-sm font-medium font-mono ${
                      item.anomaly.type === "over_high" ? "text-red-400" : "text-blue-400"
                    }`}
                  >
                    {item.anomaly.maxTemp.toFixed(1)}°C
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="text-xs text-slate-500 mb-1">处理次数</div>
                  <div className="text-sm font-medium text-slate-200">{item.recordsCount} 次</div>
                </div>
              </div>

              {item.lastRecord ? (
                <div className="border-t border-slate-800 pt-3">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">
                      <History className="w-4 h-4 text-slate-500 mt-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-blue-400 font-medium">
                          {HANDLE_ACTION_LABELS[item.lastRecord.action]}
                        </span>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-slate-500">
                          {item.lastRecord.handleTime.slice(11, 16)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {item.lastRecord.remark}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">处理人：{item.lastRecord.handler}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-800 pt-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">暂无人处理，请尽快跟进</span>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-800 pt-3 mt-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200/80">{item.suggestion}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
                <a
                  href={`tel:${item.anomaly.driverPhone.replace(/\*/g, "0")}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/20 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  联系司机
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewTrack(item.anomaly.vehicleId);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  查看轨迹
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <User className="w-3.5 h-3.5" />
                <span>{item.anomaly.driverName}</span>
                <span className="text-slate-700">·</span>
                <Clock className="w-3.5 h-3.5" />
                <span>开始于 {item.anomaly.startTime.slice(11, 16)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <ArrowRight className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">值班交接清单</h2>
              <p className="text-xs text-slate-500">未闭环异常按优先级排序，方便换班快速接手</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-slate-400">待处理 {pendingItems.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-slate-400">处理中 {processingItems.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-400">复核中 {reviewingItems.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <Section
            title="待处理 - 优先处理"
            items={pendingItems}
            color="text-red-400"
            bgColor="bg-red-500"
          />
          <Section
            title="处理中 - 持续跟进"
            items={processingItems}
            color="text-amber-400"
            bgColor="bg-amber-500"
          />
        </div>
        <div>
          <Section
            title="复核中 - 等待结论"
            items={reviewingItems}
            color="text-blue-400"
            bgColor="bg-blue-500"
          />

          {summary.length === 0 && (
            <div className="col-span-2 text-center py-16 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-slate-400 mb-1">所有异常已闭环</p>
              <p className="text-xs text-slate-600">暂无未处理的异常车辆</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
