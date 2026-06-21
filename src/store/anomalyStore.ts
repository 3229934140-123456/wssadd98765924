import { create } from "zustand";
import type { Anomaly, HandoverRecord, HandleAction, AnomalyStatus } from "@/types";
import { mockAnomalies, mockHandoverRecords } from "@/mock/anomalies";
import { generateId } from "@/utils";

interface AnomalyStore {
  anomalies: Anomaly[];
  handoverRecords: HandoverRecord[];
  selectedAnomalyId: string | null;
  statusFilter: AnomalyStatus | "all";
  setSelectedAnomaly: (id: string | null) => void;
  setStatusFilter: (status: AnomalyStatus | "all") => void;
  getFilteredAnomalies: () => Anomaly[];
  getAnomalyById: (id: string) => Anomaly | undefined;
  getHandoverRecordsByAnomaly: (anomalyId: string) => HandoverRecord[];
  addHandoverRecord: (anomalyId: string, action: HandleAction, remark: string, handler: string) => void;
  updateAnomalyStatus: (id: string, status: AnomalyStatus) => void;
}

export const useAnomalyStore = create<AnomalyStore>((set, get) => ({
  anomalies: mockAnomalies,
  handoverRecords: mockHandoverRecords,
  selectedAnomalyId: null,
  statusFilter: "all",

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
    set((state) => ({
      handoverRecords: [newRecord, ...state.handoverRecords],
    }));
  },

  updateAnomalyStatus: (id, status) => {
    set((state) => ({
      anomalies: state.anomalies.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
  },
}));
