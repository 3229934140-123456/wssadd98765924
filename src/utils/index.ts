import type { TempStatus, TransportPhase } from "@/types";

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} 小时`;
  }
  return `${hours} 小时 ${mins} 分`;
}

export function getTempStatus(temp: number, min: number, max: number): TempStatus {
  const warningRange = (max - min) * 0.1;
  if (temp < min || temp > max) {
    return "alert";
  }
  if (temp < min + warningRange || temp > max - warningRange) {
    return "warning";
  }
  return "normal";
}

export function getTempColor(temp: number, min: number, max: number): string {
  const status = getTempStatus(temp, min, max);
  switch (status) {
    case "normal":
      return "#10B981";
    case "warning":
      return "#F59E0B";
    case "alert":
      return "#EF4444";
  }
}

export function getStatusBgColor(status: TempStatus): string {
  switch (status) {
    case "normal":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "warning":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "alert":
      return "bg-red-500/10 text-red-400 border-red-500/30";
  }
}

export function getPhaseColor(phase: TransportPhase): string {
  switch (phase) {
    case "loading":
      return "#3B82F6";
    case "waiting":
      return "#8B5CF6";
    case "transporting":
      return "#10B981";
    case "unloading":
      return "#F59E0B";
  }
}

export function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
