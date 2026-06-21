import type { TempStatus, DoorStatus, AnomalyStatus } from "@/types";
import { ANOMALY_STATUS_LABELS } from "@/types";

interface TempStatusBadgeProps {
  status: TempStatus;
  showDot?: boolean;
}

export function TempStatusBadge({ status, showDot = true }: TempStatusBadgeProps) {
  const config = {
    normal: {
      label: "正常",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-400",
    },
    warning: {
      label: "预警",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      dotColor: "bg-amber-400",
    },
    alert: {
      label: "异常",
      className: "bg-red-500/10 text-red-400 border-red-500/30",
      dotColor: "bg-red-400",
    },
  };

  const { label, className, dotColor } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${className}`}>
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor} ${status === "alert" ? "animate-pulse" : ""}`}
        ></span>
      )}
      {label}
    </span>
  );
}

interface DoorStatusBadgeProps {
  status: DoorStatus;
}

export function DoorStatusBadge({ status }: DoorStatusBadgeProps) {
  const isClosed = status === "closed";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${
        isClosed
          ? "bg-slate-700/50 text-slate-300 border-slate-600"
          : "bg-orange-500/10 text-orange-400 border-orange-500/30"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isClosed ? "bg-slate-400" : "bg-orange-400"}`}
      ></span>
      {isClosed ? "门已关" : "门打开"}
    </span>
  );
}

interface AnomalyStatusBadgeProps {
  status: AnomalyStatus;
}

export function AnomalyStatusBadge({ status }: AnomalyStatusBadgeProps) {
  const config: Record<AnomalyStatus, { className: string; label: string }> = {
    pending: {
      label: "待处理",
      className: "bg-red-500/10 text-red-400 border-red-500/30",
    },
    processing: {
      label: "处理中",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    reviewing: {
      label: "复核中",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    resolved: {
      label: "已闭环",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
  };

  const { label, className } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${className}`}>
      {ANOMALY_STATUS_LABELS[status]}
    </span>
  );
}
