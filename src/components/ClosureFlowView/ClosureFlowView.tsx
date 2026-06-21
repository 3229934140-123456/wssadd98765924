import { useMemo } from "react";
import { CheckCircle, Circle, Clock, User, MessageSquare, AlertCircle } from "lucide-react";
import { useAnomalyStore } from "@/store/anomalyStore";
import { formatDateTime } from "@/utils";
import { ANOMALY_STATUS_LABELS } from "@/types";
import type { ClosureStep } from "@/types";

interface ClosureFlowViewProps {
  anomalyId: string;
}

function FlowStep({ step, isLast }: { step: ClosureStep; isLast: boolean }) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            step.completed
              ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50"
              : "bg-slate-800 text-slate-500 border-2 border-slate-700"
          }`}
        >
          {step.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 flex-1 mt-1 ${
              step.completed ? "bg-emerald-500/50" : "bg-slate-700"
            }`}
          />
        )}
      </div>

      <div className={`flex-1 pb-6 ${isLast ? "" : ""}`}>
        <div className="flex items-start justify-between">
          <div>
            <div
              className={`font-semibold ${
                step.completed ? "text-slate-200" : "text-slate-500"
              }`}
            >
              {step.label}
            </div>
            {step.time && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <Clock size={12} />
                <span>{formatDateTime(step.time)}</span>
              </div>
            )}
          </div>
          {step.handler && (
            <div className="flex items-center gap-1 text-xs bg-slate-800/50 px-2 py-1 rounded-full text-slate-400">
              <User size={12} />
              <span>{step.handler}</span>
            </div>
          )}
        </div>

        {step.remark && (
          <div className="mt-2 flex items-start gap-2 text-sm text-slate-400 bg-slate-800/30 rounded-lg p-3">
            <MessageSquare size={14} className="flex-shrink-0 mt-0.5 text-slate-500" />
            <span>{step.remark}</span>
          </div>
        )}

        {!step.completed && !step.time && (
          <div className="mt-2 text-xs text-slate-600">
            待处理
          </div>
        )}
      </div>
    </div>
  );
}

export function ClosureFlowView({ anomalyId }: ClosureFlowViewProps) {
  const anomalies = useAnomalyStore((s) => s.anomalies);
  const handoverRecords = useAnomalyStore((s) => s.handoverRecords);
  const getClosureFlow = useAnomalyStore((s) => s.getClosureFlow);
  const getAnomalyById = useAnomalyStore((s) => s.getAnomalyById);

  const flow = useMemo(() => {
    return getClosureFlow(anomalyId);
  }, [anomalyId, anomalies, handoverRecords, getClosureFlow]);

  const anomaly = useMemo(() => {
    return getAnomalyById(anomalyId);
  }, [anomalyId, anomalies, getAnomalyById]);

  if (!anomaly || flow.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-500">
        <AlertCircle size={20} className="mr-2" />
        暂无流程数据
      </div>
    );
  }

  const completedSteps = flow.filter((s) => s.completed).length;
  const totalSteps = flow.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className="bg-slate-800/20 rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">闭环处理流程</h3>
          <div className="text-xs text-slate-500">
            {anomaly.plateNumber} · 当前状态：
            <span className="text-slate-400">{ANOMALY_STATUS_LABELS[anomaly.status]}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {completedSteps}/{totalSteps}
          </div>
          <div className="text-xs text-slate-500">处理进度</div>
        </div>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
        <div
          className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-0">
        {flow.map((step, index) => (
          <FlowStep key={step.step} step={step} isLast={index === flow.length - 1} />
        ))}
      </div>

      {anomaly.status !== "resolved" && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <AlertCircle size={14} />
            <span>当前卡在「{flow.find((s) => !s.completed)?.label || "待处理"}」环节</span>
          </div>
        </div>
      )}
    </div>
  );
}
