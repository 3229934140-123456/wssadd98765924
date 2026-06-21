import { create } from "zustand";
import type { Anomaly, HandoverRecord, HandleAction, AnomalyStatus, ClosureStep, DailyReport, ShiftNote, TakeoverItem } from "@/types";
import { CLOSURE_FLOW, CLOSURE_STEP_LABELS } from "@/types";
import { mockAnomalies, mockHandoverRecords } from "@/mock/anomalies";
import { mockVehicles } from "@/mock/vehicles";
import { generateId } from "@/utils";

const STORAGE_KEYS = {
  ANOMALY_STATUSES: "coldchain_anomaly_statuses",
  HANDOVER_RECORDS: "coldchain_handover_records",
  SHIFT_NOTES: "coldchain_shift_notes",
};

interface PersistedAnomalyStatus {
  anomalyId: string;
  status: AnomalyStatus;
  updatedAt: string;
}

interface AnomalyStore {
  anomalies: Anomaly[];
  handoverRecords: HandoverRecord[];
  shiftNotes: ShiftNote[];
  selectedAnomalyId: string | null;
  statusFilter: AnomalyStatus | "all";
  initFromStorage: () => void;
  setSelectedAnomaly: (id: string | null) => void;
  setStatusFilter: (status: AnomalyStatus | "all") => void;
  getFilteredAnomalies: () => Anomaly[];
  getAnomalyById: (id: string) => Anomaly | undefined;
  getHandoverRecordsByAnomaly: (anomalyId: string) => HandoverRecord[];
  addHandoverRecord: (anomalyId: string, action: HandleAction, remark: string, handler: string) => void;
  updateAnomalyStatus: (id: string, status: AnomalyStatus) => void;
  getUnclosedSummary: () => Array<{
    anomaly: Anomaly;
    lastRecord: HandoverRecord | null;
    recordsCount: number;
    suggestion: string;
  }>;
  getClosureFlow: (anomalyId: string) => ClosureStep[];
  getDailyReport: (date?: string) => DailyReport;
  addShiftNote: (anomalyId: string, note: string, author: string, shift: string) => void;
  confirmTakeover: (noteId: string, confirmer: string) => void;
  getTakeoverWorkstation: () => TakeoverItem[];
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

function getActionSuggestion(action: HandleAction): string {
  const suggestions: Record<HandleAction, string> = {
    notify_driver: "请跟进司机处理结果，确认制冷机组是否正常",
    contact_customer: "请持续监控温度变化，到货前再次确认",
    send_review: "请等待质量部门复核结论，关注后续处理意见",
    mark_resolved: "已闭环，可归档",
  };
  return suggestions[action] || "请持续关注";
}

function getStepSuggestion(anomaly: Anomaly, lastAction: HandleAction | null): string {
  if (anomaly.status === "pending") {
    return "请立即通知司机检查制冷情况";
  }
  if (!lastAction) {
    return "请立即处理，联系司机确认情况";
  }
  const nextStepMap: Record<HandleAction, string> = {
    notify_driver: "司机已通知，下一步建议联系客户告知可能延迟",
    contact_customer: "客户已告知，下一步建议转入质量复核",
    send_review: "已转复核，等待质量部门结论后闭环归档",
    mark_resolved: "已闭环",
  };
  return nextStepMap[lastAction] || "请持续关注";
}

function calculateTimeoutRisk(anomaly: Anomaly, lastRecordTime: string | null): { level: "normal" | "warning" | "critical"; description: string } {
  const now = new Date().getTime();
  const startedAt = new Date(anomaly.startTime).getTime();
  const referenceTime = lastRecordTime ? new Date(lastRecordTime).getTime() : startedAt;
  const minutesSinceLastAction = Math.max(1, Math.floor((now - referenceTime) / 60000));
  const minutesSinceStart = Math.max(1, Math.floor((now - startedAt) / 60000));

  if (anomaly.status === "pending" && minutesSinceStart > 30) {
    return { level: "critical", description: `异常已 ${minutesSinceStart} 分钟，尚未处理` };
  }
  if (minutesSinceLastAction > 120) {
    return { level: "critical", description: `已 ${minutesSinceLastAction} 分钟无跟进` };
  }
  if (minutesSinceLastAction > 60) {
    return { level: "warning", description: `已 ${minutesSinceLastAction} 分钟未跟进` };
  }
  return { level: "normal", description: "跟进正常" };
}

export const useAnomalyStore = create<AnomalyStore>((set, get) => ({
  anomalies: mockAnomalies,
  handoverRecords: mockHandoverRecords,
  shiftNotes: loadFromStorage<ShiftNote[]>(STORAGE_KEYS.SHIFT_NOTES, []),
  selectedAnomalyId: null,
  statusFilter: "all",

  initFromStorage: () => {
    const persistedStatuses = loadFromStorage<PersistedAnomalyStatus[]>(STORAGE_KEYS.ANOMALY_STATUSES, []);
    const persistedRecords = loadFromStorage<HandoverRecord[]>(STORAGE_KEYS.HANDOVER_RECORDS, []);
    const persistedNotes = loadFromStorage<ShiftNote[]>(STORAGE_KEYS.SHIFT_NOTES, []);

    const updatedAnomalies = mockAnomalies.map((a) => {
      const persisted = persistedStatuses.find((p) => p.anomalyId === a.id);
      if (persisted) {
        return { ...a, status: persisted.status };
      }
      return a;
    });

    const allRecords = [...persistedRecords, ...mockHandoverRecords].filter(
      (record, index, self) => index === self.findIndex((r) => r.id === record.id)
    );

    allRecords.sort(
      (a, b) => new Date(b.handleTime).getTime() - new Date(a.handleTime).getTime()
    );

    set({
      anomalies: updatedAnomalies,
      handoverRecords: allRecords,
      shiftNotes: persistedNotes,
    });
  },

  setSelectedAnomaly: (id) => set({ selectedAnomalyId: id }),

  setStatusFilter: (status) => set({ statusFilter: status }),

  getFilteredAnomalies: () => {
    const { anomalies, statusFilter } = get();
    const filtered = statusFilter === "all" ? anomalies : anomalies.filter((a) => a.status === statusFilter);
    return filtered.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  },

  getAnomalyById: (id) => {
    return get().anomalies.find((a) => a.id === id);
  },

  getHandoverRecordsByAnomaly: (anomalyId) => {
    return get()
      .handoverRecords.filter((r) => r.anomalyId === anomalyId)
      .sort((a, b) => new Date(b.handleTime).getTime() - new Date(a.handleTime).getTime());
  },

  addHandoverRecord: (anomalyId, action, remark, handler) => {
    const newRecord: HandoverRecord = {
      id: generateId(),
      anomalyId,
      handler,
      handleTime: new Date().toISOString().replace("T", " ").slice(0, 19),
      action,
      remark,
    };

    set((state) => {
      const updatedRecords = [newRecord, ...state.handoverRecords];
      saveToStorage(STORAGE_KEYS.HANDOVER_RECORDS, updatedRecords);
      return {
        handoverRecords: updatedRecords,
      };
    });
  },

  updateAnomalyStatus: (id, status) => {
    set((state) => {
      const updatedAnomalies = state.anomalies.map((a) => (a.id === id ? { ...a, status } : a));

      const persistedStatuses = loadFromStorage<PersistedAnomalyStatus[]>(STORAGE_KEYS.ANOMALY_STATUSES, []);
      const existingIndex = persistedStatuses.findIndex((p) => p.anomalyId === id);
      const newStatus: PersistedAnomalyStatus = {
        anomalyId: id,
        status,
        updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      };

      if (existingIndex >= 0) {
        persistedStatuses[existingIndex] = newStatus;
      } else {
        persistedStatuses.push(newStatus);
      }
      saveToStorage(STORAGE_KEYS.ANOMALY_STATUSES, persistedStatuses);

      return {
        anomalies: updatedAnomalies,
      };
    });
  },

  addShiftNote: (anomalyId, note, author, shift) => {
    const anomaly = get().anomalies.find((a) => a.id === anomalyId);
    if (!anomaly) return;

    const vehicle = mockVehicles.find((v) => v.id === anomaly.vehicleId);

    const newNote: ShiftNote = {
      id: generateId(),
      anomalyId,
      vehicleId: anomaly.vehicleId,
      plateNumber: anomaly.plateNumber,
      note,
      author,
      shift,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      confirmedBy: null,
      confirmedAt: null,
    };

    set((state) => {
      const existing = state.shiftNotes.findIndex((n) => n.anomalyId === anomalyId);
      let updatedNotes: ShiftNote[];
      if (existing >= 0) {
        updatedNotes = [...state.shiftNotes];
        updatedNotes[existing] = newNote;
      } else {
        updatedNotes = [...state.shiftNotes, newNote];
      }
      saveToStorage(STORAGE_KEYS.SHIFT_NOTES, updatedNotes);
      return { shiftNotes: updatedNotes };
    });
  },

  confirmTakeover: (noteId, confirmer) => {
    set((state) => {
      const updatedNotes = state.shiftNotes.map((n) =>
        n.id === noteId
          ? { ...n, confirmedBy: confirmer, confirmedAt: new Date().toISOString().replace("T", " ").slice(0, 19) }
          : n
      );
      saveToStorage(STORAGE_KEYS.SHIFT_NOTES, updatedNotes);
      return { shiftNotes: updatedNotes };
    });
  },

  getTakeoverWorkstation: () => {
    const { anomalies, handoverRecords, shiftNotes } = get();
    const unclosed = anomalies.filter((a) => a.status !== "resolved");

    return unclosed
      .map((anomaly) => {
        const records = handoverRecords
          .filter((r) => r.anomalyId === anomaly.id)
          .sort((a, b) => new Date(a.handleTime).getTime() - new Date(b.handleTime).getTime());

        const handlerChain = records.map((r) => ({
          handler: r.handler,
          action: r.action,
          time: r.handleTime,
        }));

        const lastRecord = records.length > 0 ? records[records.length - 1] : null;
        const lastAction = lastRecord?.action || null;

        const flow = get().getClosureFlow(anomaly.id);
        const bottleneckStep = flow.find((s) => !s.completed);
        const currentBottleneck = bottleneckStep?.label || "无";

        const nextStepSuggestion = getStepSuggestion(anomaly, lastAction);
        const timeoutRisk = calculateTimeoutRisk(anomaly, lastRecord?.handleTime || null);
        const shiftNote = shiftNotes.find((n) => n.anomalyId === anomaly.id) || null;

        return {
          anomaly,
          handlerChain,
          currentBottleneck,
          nextStepSuggestion,
          timeoutRisk,
          shiftNote,
        };
      })
      .sort((a, b) => {
        const riskPriority = { critical: 0, warning: 1, normal: 2 };
        const riskDiff = riskPriority[a.timeoutRisk.level] - riskPriority[b.timeoutRisk.level];
        if (riskDiff !== 0) return riskDiff;
        const statusPriority = { pending: 0, processing: 1, reviewing: 2 };
        const priorityDiff = statusPriority[a.anomaly.status] - statusPriority[b.anomaly.status];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.anomaly.startTime).getTime() - new Date(a.anomaly.startTime).getTime();
      });
  },

  getUnclosedSummary: () => {
    const { anomalies, handoverRecords } = get();
    const unclosed = anomalies.filter((a) => a.status !== "resolved");

    return unclosed
      .map((anomaly) => {
        const records = handoverRecords.filter((r) => r.anomalyId === anomaly.id);
        const sortedRecords = [...records].sort(
          (a, b) => new Date(b.handleTime).getTime() - new Date(a.handleTime).getTime()
        );
        const lastRecord = sortedRecords[0] || null;

        let suggestion = "请立即处理，联系司机确认情况";
        if (lastRecord) {
          suggestion = getActionSuggestion(lastRecord.action);
        }

        return {
          anomaly,
          lastRecord,
          recordsCount: records.length,
          suggestion,
        };
      })
      .sort((a, b) => {
        const statusPriority = { pending: 0, processing: 1, reviewing: 2, resolved: 3 };
        const priorityDiff = statusPriority[a.anomaly.status] - statusPriority[b.anomaly.status];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.anomaly.startTime).getTime() - new Date(a.anomaly.startTime).getTime();
      });
  },

  getClosureFlow: (anomalyId) => {
    const { anomalies, handoverRecords } = get();
    const anomaly = anomalies.find((a) => a.id === anomalyId);
    if (!anomaly) return [];

    const records = handoverRecords
      .filter((r) => r.anomalyId === anomalyId)
      .sort((a, b) => new Date(a.handleTime).getTime() - new Date(b.handleTime).getTime());

    const steps: ClosureStep[] = [];

    for (const step of CLOSURE_FLOW) {
      if (step === "detected") {
        steps.push({
          step,
          label: CLOSURE_STEP_LABELS[step],
          time: anomaly.startTime,
          handler: "系统",
          remark: `温度${anomaly.type === "over_high" ? "超高" : "超低"}，${anomaly.compartment}`,
          completed: true,
        });
      } else if (step === "resolved") {
        const resolveRecord = records.find((r) => r.action === "mark_resolved");
        steps.push({
          step,
          label: CLOSURE_STEP_LABELS[step],
          time: resolveRecord?.handleTime || anomaly.endTime || null,
          handler: resolveRecord?.handler || null,
          remark: resolveRecord?.remark || null,
          completed: anomaly.status === "resolved",
        });
      } else {
        const stepRecord = records.find((r) => r.action === step);
        const isCompleted = !!stepRecord;
        steps.push({
          step,
          label: CLOSURE_STEP_LABELS[step],
          time: stepRecord?.handleTime || null,
          handler: stepRecord?.handler || null,
          remark: stepRecord?.remark || null,
          completed: isCompleted,
        });
      }
    }

    return steps;
  },

  getDailyReport: (dateStr) => {
    const { anomalies, handoverRecords, shiftNotes } = get();
    const today = new Date();
    const targetDate = dateStr || today.toISOString().split("T")[0];

    const isOnDate = (timeStr: string) => {
      return timeStr.split(" ")[0] === targetDate || timeStr.split("T")[0] === targetDate;
    };

    const inTransitCount = mockVehicles.filter((v) => v.status === "in_transit").length;

    const anomaliesOnDate = anomalies.filter((a) => isOnDate(a.startTime));
    const activeAnomaliesOnDate = anomalies.filter((a) => {
      if (a.status === "resolved") {
        return isOnDate(a.endTime || a.startTime);
      }
      return a.startTime.split(" ")[0] <= targetDate;
    });

    const totalAnomalies = anomaliesOnDate.length;
    const unresolvedOnDate = activeAnomaliesOnDate.filter((a) => a.status !== "resolved").length;

    const todayRecords = handoverRecords.filter((r) => isOnDate(r.handleTime));
    const resolvedOnDate = todayRecords.filter((r) => r.action === "mark_resolved").length;
    const processingOnDate = todayRecords.length;

    const anomalySummary = activeAnomaliesOnDate.map((anomaly) => {
      const records = handoverRecords.filter((r) => r.anomalyId === anomaly.id);
      const sortedRecords = [...records].sort(
        (a, b) => new Date(b.handleTime).getTime() - new Date(a.handleTime).getTime()
      );
      const handlers = [...new Set(records.map((r) => r.handler))];
      const note = shiftNotes.find((n) => n.anomalyId === anomaly.id);
      return {
        anomaly,
        latestRecord: sortedRecords[0] || null,
        handlers,
        shiftNote: note || null,
      };
    });

    const notesOnDate = shiftNotes.filter((n) => isOnDate(n.createdAt));

    return {
      date: targetDate,
      totalVehiclesInTransit: inTransitCount,
      totalAnomalies,
      unresolvedAnomalies: unresolvedOnDate,
      resolvedToday: resolvedOnDate,
      processingToday: processingOnDate,
      handoverRecords: todayRecords,
      anomalySummary,
      shiftNotes: notesOnDate,
    };
  },
}));
