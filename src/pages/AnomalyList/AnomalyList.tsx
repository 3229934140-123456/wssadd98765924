import { useState } from "react";
import { AlertTriangle, Clock, CheckCircle2, Filter } from "lucide-react";
import AnomalyCard from "@/components/AnomalyCard/AnomalyCard";
import AnomalyDetailPanel from "@/components/AnomalyDetailPanel/AnomalyDetailPanel";
import { useAnomalyStore } from "@/store/anomalyStore";
import type { AnomalyStatus } from "@/types";
import { ANOMALY_STATUS_LABELS } from "@/types";

export default function AnomalyList() {
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const { statusFilter, setStatusFilter, getFilteredAnomalies, getAnomalyById } = useAnomalyStore();

  const anomalies = getFilteredAnomalies();
  const selectedAnomaly = selectedAnomalyId ? getAnomalyById(selectedAnomalyId) : null;

  const statusTabs: Array<{ value: AnomalyStatus | "all"; label: string; icon: any; count?: number }> = [
    { value: "all", label: "全部", icon: Filter },
    { value: "pending", label: "待处理", icon: AlertTriangle },
    { value: "processing", label: "处理中", icon: Clock },
    { value: "reviewing", label: "复核中", icon: AlertTriangle },
    { value: "resolved", label: "已闭环", icon: CheckCircle2 },
  ];

  const stats = {
    pending: anomalies.filter((a) => a.status === "pending").length,
    processing: anomalies.filter((a) => a.status === "processing").length,
    reviewing: anomalies.filter((a) => a.status === "reviewing").length,
    resolved: anomalies.filter((a) => a.status === "resolved").length,
  };

  return (
    <div className="animate-fade-in h-full flex gap-5">
      <div className={`transition-all ${selectedAnomaly ? "flex-1" : "w-full"}`}>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = statusFilter === tab.value;
                const count =
                  tab.value === "all"
                    ? anomalies.length
                    : stats[tab.value as keyof typeof stats];
                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span
                      className={`ml-1 px-1.5 py-0.5 text-xs rounded ${
                        isActive ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="text-sm text-slate-500">
              共 {anomalies.length} 条异常记录
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {anomalies.map((anomaly) => (
            <AnomalyCard
              key={anomaly.id}
              anomaly={anomaly}
              isSelected={selectedAnomalyId === anomaly.id}
              onClick={() => setSelectedAnomalyId(anomaly.id)}
            />
          ))}
          {anomalies.length === 0 && (
            <div className="col-span-2 text-center py-16">
              <CheckCircle2 className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
              <p className="text-slate-400">暂无异常记录</p>
            </div>
          )}
        </div>
      </div>

      {selectedAnomaly && (
        <div className="w-96 shrink-0">
          <div className="sticky top-0">
            <AnomalyDetailPanel
              anomaly={selectedAnomaly}
              onClose={() => setSelectedAnomalyId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
