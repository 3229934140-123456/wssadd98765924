import { useState, useMemo } from "react";
import {
  Phone,
  User,
  Truck,
  Clock,
  Thermometer,
  Package,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  GitBranch,
} from "lucide-react";
import type { Anomaly, HandleAction, HandoverRecord, AnomalyStatus } from "@/types";
import { HANDLE_ACTION_LABELS, PHASE_LABELS } from "@/types";
import { AnomalyStatusBadge } from "@/components/StatusBadge/StatusBadge";
import { ClosureFlowView } from "@/components/ClosureFlowView/ClosureFlowView";
import { formatDuration } from "@/utils";
import { useAnomalyStore } from "@/store/anomalyStore";
import { useUserStore } from "@/store/userStore";

interface AnomalyDetailPanelProps {
  anomaly: Anomaly;
  onClose?: () => void;
}

const actionConfig = {
  notify_driver: {
    label: "已通知司机",
    icon: Phone,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
    nextStatus: "processing" as AnomalyStatus,
  },
  contact_customer: {
    label: "已联系客户",
    icon: MessageSquare,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
    nextStatus: "processing" as AnomalyStatus,
  },
  send_review: {
    label: "转入复核",
    icon: AlertTriangle,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20",
    nextStatus: "reviewing" as AnomalyStatus,
  },
  mark_resolved: {
    label: "已恢复正常",
    icon: CheckCircle2,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    nextStatus: "resolved" as AnomalyStatus,
  },
};

type DetailTab = "handover" | "flow";
type ActionKey = keyof typeof actionConfig;

export default function AnomalyDetailPanel({ anomaly, onClose }: AnomalyDetailPanelProps) {
  const [remark, setRemark] = useState("");
  const [selectedAction, setSelectedAction] = useState<ActionKey | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("flow");
  const handoverRecords = useAnomalyStore((s) => s.handoverRecords);
  const getHandoverRecordsByAnomaly = useAnomalyStore((s) => s.getHandoverRecordsByAnomaly);
  const addHandoverRecord = useAnomalyStore((s) => s.addHandoverRecord);
  const updateAnomalyStatus = useAnomalyStore((s) => s.updateAnomalyStatus);
  const userName = useUserStore((s) => s.userName);

  const records = useMemo(() => {
    return getHandoverRecordsByAnomaly(anomaly.id);
  }, [anomaly.id, handoverRecords, getHandoverRecordsByAnomaly]);

  const handleAction = (action: ActionKey) => {
    setSelectedAction(action);
  };

  const handleSubmit = () => {
    if (!selectedAction || !remark.trim()) return;

    addHandoverRecord(anomaly.id, selectedAction, remark, userName);

    const nextStatus = actionConfig[selectedAction].nextStatus;
    updateAnomalyStatus(anomaly.id, nextStatus);

    setRemark("");
    setSelectedAction(null);
  };

  const isOverHigh = anomaly.type === "over_high";

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl h-full flex flex-col">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100">异常详情</h3>
            <AnomalyStatusBadge status={anomaly.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {anomaly.plateNumber} · {isOverHigh ? "温度超高" : "温度超低"}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <StatBox
            icon={Thermometer}
            label="最高温度"
            value={`${anomaly.maxTemp.toFixed(1)}°C`}
            valueColor="text-red-400"
          />
          <StatBox
            icon={Thermometer}
            label="最低温度"
            value={`${anomaly.minTemp.toFixed(1)}°C`}
            valueColor="text-blue-400"
          />
          <StatBox
            icon={Clock}
            label="持续时长"
            value={formatDuration(anomaly.durationMinutes)}
            valueColor="text-amber-400"
          />
          <StatBox
            icon={Package}
            label="影响车厢"
            value={anomaly.compartment}
            valueColor="text-slate-200"
          />
        </div>

        <div className="bg-slate-800/40 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-medium text-slate-200">基本信息</h4>
          <div className="space-y-2 text-sm">
            <InfoRow icon={Truck} label="车牌号" value={anomaly.plateNumber} />
            <InfoRow icon={User} label="司机" value={`${anomaly.driverName} · ${anomaly.driverPhone}`} />
            <InfoRow icon={Truck} label="承运商" value={anomaly.carrier} />
            <InfoRow icon={Package} label="货品类型" value={anomaly.cargoType} />
            <InfoRow icon={Clock} label="运输阶段" value={PHASE_LABELS[anomaly.phase]} />
            <InfoRow icon={Clock} label="开始时间" value={anomaly.startTime} />
            <InfoRow icon={Clock} label="结束时间" value={anomaly.endTime || "持续中"} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab("flow")}
              className={`flex items-center gap-1.5 flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === "flow"
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GitBranch size={14} />
              闭环流程
            </button>
            <button
              onClick={() => setActiveTab("handover")}
              className={`flex items-center gap-1.5 flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === "handover"
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare size={14} />
              交接记录 ({records.length})
            </button>
          </div>

          {activeTab === "flow" ? (
            <ClosureFlowView anomalyId={anomaly.id} />
          ) : records.length > 0 ? (
            <div className="relative pl-4">
              <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-700" />
              <div className="space-y-4">
                {records.map((record) => (
                  <HandoverItem key={record.id} record={record} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              暂无交接记录
            </div>
          )}
        </div>
      </div>

      <div className="p-5 border-t border-slate-800 space-y-4">
        <div className="text-sm font-medium text-slate-300">处理动作</div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(actionConfig) as ActionKey[]).map((action) => {
            const config = actionConfig[action];
            const Icon = config.icon;
            const isSelected = selectedAction === action;
            return (
              <button
                key={action}
                onClick={() => handleAction(action)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  isSelected
                    ? `${config.color} ring-2 ring-offset-2 ring-offset-slate-900`
                    : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </button>
            );
          })}
        </div>

        {selectedAction && (
          <div className="animate-fade-in space-y-3 pt-2">
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入处理备注..."
              className="w-full h-20 px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
            />
            <button
              onClick={handleSubmit}
              disabled={!remark.trim()}
              className="w-full flex items-center justify-center gap-2 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              提交处理记录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, valueColor }: { icon: any; label: string; value: string; valueColor: string }) {
  return (
    <div className="bg-slate-800/40 rounded-lg p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className={`text-lg font-bold font-mono tabular-nums ${valueColor}`}>{value}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className="text-slate-200 text-right">{value}</span>
    </div>
  );
}

function HandoverItem({ record }: { record: HandoverRecord }) {
  const actionConfigMap: Record<HandleAction, { color: string; bgColor: string }> = {
    notify_driver: { color: "text-blue-400", bgColor: "bg-blue-500" },
    contact_customer: { color: "text-amber-400", bgColor: "bg-amber-500" },
    send_review: { color: "text-purple-400", bgColor: "bg-purple-500" },
    mark_resolved: { color: "text-emerald-400", bgColor: "bg-emerald-500" },
    takeover: { color: "text-cyan-400", bgColor: "bg-cyan-500" },
  };

  const config = actionConfigMap[record.action];

  return (
    <div className="relative">
      <div
        className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full ${config.bgColor} border-2 border-slate-900`}
      />
      <div className="bg-slate-800/40 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-sm font-medium ${config.color}`}>
            {HANDLE_ACTION_LABELS[record.action]}
          </span>
          <span className="text-xs text-slate-500">{record.handleTime.slice(11, 16)}</span>
        </div>
        <p className="text-sm text-slate-300 mb-2">{record.remark}</p>
        <div className="text-xs text-slate-500">处理人：{record.handler}</div>
      </div>
    </div>
  );
}
