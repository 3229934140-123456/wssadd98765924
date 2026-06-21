import { create } from "zustand";
import type { Vehicle, FilterState } from "@/types";
import { mockVehicles } from "@/mock/vehicles";

interface VehicleStore {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  filters: FilterState;
  setSelectedVehicle: (id: string | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  updateVehicleTemp: (id: string, temp: number) => void;
  getFilteredVehicles: () => Vehicle[];
  getVehicleById: (id: string) => Vehicle | undefined;
  getStats: () => { total: number; normal: number; warning: number; alert: number };
}

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: mockVehicles,
  selectedVehicleId: null,
  filters: {
    route: "全部线路",
    carrier: "全部",
    cargoType: "全部",
    tempStatus: "all",
    search: "",
  },

  setSelectedVehicle: (id) => set({ selectedVehicleId: id }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  updateVehicleTemp: (id, temp) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === id ? { ...v, currentTemp: temp, lastReportTime: new Date().toISOString().replace("T", " ").slice(0, 19) } : v
      ),
    })),

  getFilteredVehicles: () => {
    const { vehicles, filters } = get();
    return vehicles.filter((v) => {
      if (filters.route !== "全部线路" && v.route !== filters.route) return false;
      if (filters.carrier !== "全部" && v.carrier !== filters.carrier) return false;
      if (filters.cargoType !== "全部" && v.cargoType !== filters.cargoType) return false;
      if (filters.tempStatus !== "all" && v.tempStatus !== filters.tempStatus) return false;
      if (filters.search && !v.plateNumber.toLowerCase().includes(filters.search.toLowerCase()) && !v.driverName.includes(filters.search))
        return false;
      return true;
    });
  },

  getVehicleById: (id) => {
    return get().vehicles.find((v) => v.id === id);
  },

  getStats: () => {
    const { vehicles } = get();
    const inTransit = vehicles.filter((v) => v.status === "in_transit");
    return {
      total: inTransit.length,
      normal: inTransit.filter((v) => v.tempStatus === "normal").length,
      warning: inTransit.filter((v) => v.tempStatus === "warning").length,
      alert: inTransit.filter((v) => v.tempStatus === "alert").length,
    };
  },
}));
