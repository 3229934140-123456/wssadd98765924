import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  User,
  Clock,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Truck,
  CheckCircle,
  Send,
  X,
  FileText,
  AlertCircle,
  Timer,
  ClipboardList,
} from "lucide-react";
import { useAnomalyStore } from "@/store/anomalyStore";
import { useUserStore } from "@/store/userStore";
import { AnomalyStatusBadge } from "@/components/StatusBadge/StatusBadge";
import { HANDLE_ACTION_LABELS, ANOMALY_STATUS_LABELS, PHASE_LABELS } from "@/types";
import type { HandleAction, AnomalyStatus, TakeoverItem } from "@/types";
import { formatDuration, formatDateTime } from "@/utils";

const actionConfig: Record<
  HandleAction,
  { label: string; nextStatus: AnomalyStatus; color: string; icon: typeof Phone }
> = {
  notify_driver: {
    label: "通知司机",
    nextStatus: "processing",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
    icon: Phone,
  },
  contact_customer: {
    label: "联系客户",
    nextStatus: "processing",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
    icon: MessageSquare,
  },
  send_review: {
    label: "转入复核",
    nextStatus: "reviewing",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20",
    icon: AlertTriangle,
  },
  mark_resolved: {
    label: "闭环归档",
    nextStatus: "resolved",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    icon: CheckCircle,
  },
};

const riskConfig = {
  critical: {
    label: "⚠ 严重超时",
    className: "bg-red-500/15 text-red-400 border border-red-500/30",
  },
  warning: {
    label: "⏰ 需要关注",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  },
  normal: {
    label: "✓ 跟进正常",
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
};

export default function HandoverView() {
  const navigate = useNavigate();
  const userName = useUserStore((s) => s.userName);
  const shift = useUserStore((s) => s.shift);
  const anomalies = useAnomalyStore((s) => s.anomalies);
  const handoverRecords = useAnomalyStore((s) => s.handoverRecords);
  const shiftNotes = useAnomalyStore((s) => s.shiftNotes);
  const getTakeoverWorkstation = useAnomalyStore((s) => s.getTakeoverWorkstation);
  const addHandoverRecord = useAnomalyStore((s) => s.addHandoverRecord);
  const updateAnomalyStatus = useAnomalyStore((s) => s.updateAnomalyStatus);
  const addShiftNote = useAnomalyStore((s) => s.addShiftNote);
  const confirmTakeover = useAnomalyStore((s) => s.confirmTakeover);

  const items = useMemo(() => {
    return getTakeoverWorkstation();
  }, [anomalies, handoverRecords, shiftNotes, getTakeoverWorkstation]);

  const summaryCounts = useMemo(() => {
    const pending = items.filter((i) => i.anomaly.status === "pending").length;
    const processing = items.filter((i) => i.anomaly.status === "processing").length;
    const reviewing = items.filter((i) => i.anomaly.status === "reviewing").length;
    const critical = items.filter((i) => i.timeoutRisk.level === "critical").length;
    const warning = items.filter((i) => i.timeoutRisk.level === "warning").length;
    return { pending, processing, reviewing, critical, warning };
  }, [items]);

  return (
    <div className="animate-fade-in">
      <HeaderSection counts={summaryCounts} />
      <div className="space-y-4">
        {items.map((item) => (
          <TakeoverCard
            key={item.anomaly.id}
            item={item}
            userName={userName}
            shift={shift}
            onAddRecord={addHandoverRecord}
            onUpdateStatus={updateAnomalyStatus}
            onAddNote={addShiftNote}
            onConfirmTakeover={confirmTakeover}
            onNavigate={navigate}
          />
        ))}
        {items.length === 0 && (
          <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-slate-400 mb-1">所有异常已闭环</p>
            <p className="text-xs text-slate-600">暂无未处理的异常车辆</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderSection({
  counts,
}: {
  counts: { pending: number; processing: number; reviewing: number; critical: number; warning: number };
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <ArrowRight className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">接班工作台</h2>
            <p className="text-xs text-slate-500">未闭环异常按风险排序，快速接手跟进</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-400">待处理 {counts.pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-400">处理中 {counts.processing}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-400">复核中 {counts.reviewing}</span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-slate-400">严重超时 {counts.critical}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">需关注 {counts.warning}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TakeoverCard({
  item,
  userName,
  shift,
  onAddRecord,
  onUpdateStatus,
  onAddNote,
  onConfirmTakeover,
  onNavigate,
}: {
  item: TakeoverItem;
  userName: string;
  shift: string;
  onAddRecord: (anomalyId: string, action: HandleAction, remark: string, handler: string) => void;
  onUpdateStatus: (id: string, status: AnomalyStatus) => void;
  onAddNote: (anomalyId: string, note: string, author: string, shift: string) => void;
  onConfirmTakeover: (noteId: string, confirmer: string) => void;
  onNavigate: ReturnType<typeof useNavigate>;
}) {
  const { anomaly, handlerChain, currentBottleneck, nextStepSuggestion, timeoutRisk, shiftNote } = item;
  const [activeAction, setActiveAction] = useState<HandleAction | null>(null);
  const [remark, setRemark] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");

  const isOverHigh = anomaly.type === "over_high";

  const handleSubmitAction = () => {
    if (!activeAction || !remark.trim()) return;
    onAddRecord(anomaly.id, activeAction, remark, userName);
    onUpdateStatus(anomaly.id, actionConfig[activeAction].nextStatus);
    setRemark("");
    setActiveAction(null);
  };

  const handleSubmitNote = () => {
    if (!noteText.trim()) return;
    onAddNote(anomaly.id, noteText, userName, shift);
    setNoteText("");
    setShowNoteInput(false);
  };

  const handleConfirmTakeover = () => {
    if (shiftNote) {
      onConfirmTakeover(shiftNote.id, userName);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <Truck className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 font-mono">{anomaly.plateNumber}</span>
              <AnomalyStatusBadge status={anomaly.status} />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {anomaly.carrier} · {anomaly.cargoType}
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigate(`/vehicles/${anomaly.vehicleId}`)}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          查看轨迹
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="text-xs text-slate-500 mb-1">异常类型</div>
          <div className={`text-sm font-medium ${isOverHigh ? "text-red-400" : "text-blue-400"}`}>
            {isOverHigh ? "温度超高" : "温度超低"}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="text-xs text-slate-500 mb-1">峰值温度</div>
          <div className={`text-sm font-medium font-mono ${isOverHigh ? "text-red-400" : "text-blue-400"}`}>
            {anomaly.maxTemp.toFixed(1)}°C
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="text-xs text-slate-500 mb-1">持续时长</div>
          <div className="text-sm font-medium text-slate-200">
            {formatDuration(anomaly.durationMinutes)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="text-xs text-slate-500 mb-1">运输阶段</div>
          <div className="text-sm font-medium text-slate-200">{PHASE_LABELS[anomaly.phase]}</div>
        </div>
      </div>

      {handlerChain.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">接手人链</span>
          </div>
          <div className="flex items-center gap-0 flex-wrap">
            {handlerChain.map((entry, idx) => (
              <span key={idx} className="flex items-center">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800/60 rounded text-xs">
                  <span className="text-slate-200">{entry.handler}</span>
                  <span className="text-slate-600">
                    {HANDLE_ACTION_LABELS[entry.action]}
                  </span>
                  <span className="text-slate-500">{entry.time.slice(11, 16)}</span>
                </span>
                {idx < handlerChain.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-600 mx-1" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400/80">当前卡点</span>
          </div>
          <div className="text-sm text-amber-200">{currentBottleneck}</div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Timer className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-blue-400/80">下一步建议</span>
          </div>
          <div className="text-sm text-blue-200">{nextStepSuggestion}</div>
        </div>
      </div>

      <div className="mb-4">
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${riskConfig[timeoutRisk.level].className}`}
        >
          {riskConfig[timeoutRisk.level].label}
          <span className="opacity-70">{timeoutRisk.description}</span>
        </span>
      </div>

      <div className="border-t border-slate-800 pt-4 mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500">交班备注</span>
        </div>
        {shiftNote ? (
          <div className="bg-slate-800/40 rounded-lg p-3">
            <p className="text-sm text-slate-200 mb-2">{shiftNote.note}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {shiftNote.author}
              </span>
              <span>{shiftNote.shift}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDateTime(shiftNote.createdAt)}
              </span>
            </div>
            {shiftNote.confirmedBy ? (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>
                  已接手: {shiftNote.confirmedBy} @ {formatDateTime(shiftNote.confirmedAt!)}
                </span>
              </div>
            ) : (
              <button
                onClick={handleConfirmTakeover}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                确认接手
              </button>
            )}
          </div>
        ) : (
          <>
            {!showNoteInput ? (
              <button
                onClick={() => setShowNoteInput(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700 text-slate-400 text-xs font-medium rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                留交班备注
              </button>
            ) : (
              <div className="animate-fade-in space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="输入交班备注..."
                  className="w-full h-16 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSubmitNote}
                    disabled={!noteText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium rounded-lg hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    提交备注
                  </button>
                  <button
                    onClick={() => {
                      setShowNoteInput(false);
                      setNoteText("");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700 text-slate-500 text-xs font-medium rounded-lg hover:text-slate-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    取消
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-slate-800 pt-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Phone className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500">直接处理</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(actionConfig) as HandleAction[]).map((action) => {
            const config = actionConfig[action];
            const Icon = config.icon;
            const isActive = activeAction === action;
            return (
              <button
                key={action}
                onClick={() => setActiveAction(isActive ? null : action)}
                className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                  isActive
                    ? config.color
                    : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </button>
            );
          })}
        </div>
        {activeAction && (
          <div className="animate-fade-in space-y-2 mt-3">
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入处理备注..."
              className="w-full h-16 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmitAction}
                disabled={!remark.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                提交处理记录
              </button>
              <button
                onClick={() => {
                  setActiveAction(null);
                  setRemark("");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700 text-slate-500 text-xs font-medium rounded-lg hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <User className="w-3.5 h-3.5" />
        <span>{anomaly.driverName}</span>
        <span className="text-slate-700">·</span>
        <Clock className="w-3.5 h-3.5" />
        <span>开始于 {anomaly.startTime.slice(11, 16)}</span>
        <span className="text-slate-700">·</span>
        <span>{anomaly.compartment}</span>
      </div>
    </div>
  );
}
