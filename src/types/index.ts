export type TempStatus = "normal" | "warning" | "alert";

export type DoorStatus = "closed" | "open";

export type TransportPhase = "loading" | "waiting" | "transporting" | "unloading";

export type AnomalyStatus = "pending" | "processing" | "reviewing" | "resolved";

export type HandleAction = "notify_driver" | "contact_customer" | "send_review" | "mark_resolved" | "takeover";

export type VehicleStatus = "in_transit" | "parked";

export type ShiftType = "morning" | "middle" | "night" | "all";

export interface Vehicle {
  id: string;
  plateNumber: string;
  carrier: string;
  route: string;
  cargoType: string;
  currentTemp: number;
  tempMin: number;
  tempMax: number;
  tempStatus: TempStatus;
  doorStatus: DoorStatus;
  driverName: string;
  driverPhone: string;
  lastReportTime: string;
  status: VehicleStatus;
  compartment: string;
  currentPhase: TransportPhase;
}

export interface TrackPoint {
  id: string;
  vehicleId: string;
  lng: number;
  lat: number;
  temperature: number;
  timestamp: string;
  phase: TransportPhase;
  doorStatus: DoorStatus;
}

export interface Anomaly {
  id: string;
  vehicleId: string;
  plateNumber: string;
  type: "over_high" | "over_low";
  maxTemp: number;
  minTemp: number;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  compartment: string;
  status: AnomalyStatus;
  phase: TransportPhase;
  driverName: string;
  driverPhone: string;
  carrier: string;
  cargoType: string;
}

export interface HandoverRecord {
  id: string;
  anomalyId: string;
  handler: string;
  handleTime: string;
  action: HandleAction;
  remark: string;
}

export interface AnomalyStatusHistory {
  id: string;
  anomalyId: string;
  fromStatus: AnomalyStatus | null;
  toStatus: AnomalyStatus;
  changedAt: string;
  changedBy: string | null;
}

export interface FilterState {
  route: string;
  carrier: string;
  cargoType: string;
  tempStatus: TempStatus | "all";
  vehicleStatus: VehicleStatus | "all";
  search: string;
}

export const PHASE_LABELS: Record<TransportPhase, string> = {
  loading: "装货",
  waiting: "等待",
  transporting: "运输中",
  unloading: "卸货",
};

export const ANOMALY_STATUS_LABELS: Record<AnomalyStatus, string> = {
  pending: "待处理",
  processing: "处理中",
  reviewing: "复核中",
  resolved: "已闭环",
};

export const HANDLE_ACTION_LABELS: Record<HandleAction, string> = {
  notify_driver: "已通知司机",
  contact_customer: "已联系客户",
  send_review: "转入复核",
  mark_resolved: "已恢复正常",
  takeover: "确认接手",
};

export const SHIFT_LABELS: Record<Exclude<ShiftType, "all">, string> = {
  morning: "早班",
  middle: "中班",
  night: "晚班",
};

export interface DailyReport {
  date: string;
  totalVehiclesInTransit: number;
  totalAnomalies: number;
  newAnomaliesToday: number;
  unresolvedAnomalies: number;
  resolvedToday: number;
  processingToday: number;
  handoverRecords: HandoverRecord[];
  anomalySummary: Array<{
    anomaly: Anomaly;
    latestRecord: HandoverRecord | null;
    handlers: string[];
    shiftNote: ShiftNote | null;
    statusAtEndOfDay: AnomalyStatus;
  }>;
  shiftNotes: ShiftNote[];
  confirmedTakeovers: ShiftNote[];
}

export interface ShiftNote {
  id: string;
  anomalyId: string;
  vehicleId: string;
  plateNumber: string;
  note: string;
  author: string;
  shift: string;
  createdAt: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
}

export interface TakeoverItem {
  anomaly: Anomaly;
  handlerChain: Array<{ handler: string; action: HandleAction; time: string }>;
  currentBottleneck: string;
  nextStepSuggestion: string;
  timeoutRisk: { level: "normal" | "warning" | "critical"; description: string };
  shiftNote: ShiftNote | null;
}

export interface ClosureStep {
  step: "detected" | "notify_driver" | "contact_customer" | "send_review" | "resolved";
  label: string;
  time: string | null;
  handler: string | null;
  remark: string | null;
  completed: boolean;
}

export const CLOSURE_FLOW: ClosureStep["step"][] = [
  "detected",
  "notify_driver",
  "contact_customer",
  "send_review",
  "resolved",
];

export const CLOSURE_STEP_LABELS: Record<ClosureStep["step"], string> = {
  detected: "发现异常",
  notify_driver: "通知司机",
  contact_customer: "联系客户",
  send_review: "质量复核",
  resolved: "闭环归档",
};
