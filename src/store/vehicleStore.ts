import { create } from "zustand";
import type { Vehicle, FilterState } from "@/types";
import { mockVehicles } from "@/mock/vehicles";

const WATCHLIST_KEY = "coldchain_watchlist";

function loadWatchlist(): string[] {
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load watchlist:", e);
  }
  return [];
}

function saveWatchlist(ids: string[]): void {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error("Failed to save watchlist:", e);
  }
}

type WatchlistSortReason = "anomaly" | "door_open" | "no_report" | "normal";

interface VehicleStore {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  watchlistIds: string[];
  filters: FilterState;
  setSelectedVehicle: (id: string | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  updateVehicleTemp: (id: string, temp: number) => void;
  getFilteredVehicles: () => Vehicle[];
  getVehicleById: (id: string) => Vehicle | undefined;
  getStats: () => { total: number; normal: number; warning: number; alert: number };
  toggleWatchlist: (vehicleId: string) => void;
  isWatched: (vehicleId: string) => boolean;
  getWatchlistVehicles: () => Array<{ vehicle: Vehicle; sortReason: WatchlistSortReason }>;
  initWatchlist: () => void;
}

function getSortReason(vehicle: Vehicle): WatchlistSortReason {
  if (vehicle.tempStatus === "alert" || vehicle.tempStatus === "warning") {
    return "anomaly";
  }
  if (vehicle.doorStatus === "open") {
    return "door_open";
  }
  const now = new Date().getTime();
  const lastReport = new Date(vehicle.lastReportTime).getTime();
  const minutesSinceReport = Math.floor((now - lastReport) / 60000);
  if (minutesSinceReport > 30) {
    return "no_report";
  }
  return "normal";
}

const REASON_PRIORITY: Record<WatchlistSortReason, number> = {
  anomaly: 0,
  door_open: 1,
  no_report: 2,
  normal: 3,
};

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: mockVehicles,
  selectedVehicleId: null,
  watchlistIds: loadWatchlist(),
  filters: {
    route: "全部线路",
    carrier: "全部",
    cargoType: "全部",
    tempStatus: "all",
    vehicleStatus: "in_transit",
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
      if (filters.vehicleStatus !== "all" && v.status !== filters.vehicleStatus) return false;
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
    const filtered = get().getFilteredVehicles();
    return {
      total: filtered.length,
      normal: filtered.filter((v) => v.tempStatus === "normal").length,
      warning: filtered.filter((v) => v.tempStatus === "warning").length,
      alert: filtered.filter((v) => v.tempStatus === "alert").length,
    };
  },

  toggleWatchlist: (vehicleId) => {
    set((state) => {
      const newWatchlist = state.watchlistIds.includes(vehicleId)
        ? state.watchlistIds.filter((id) => id !== vehicleId)
        : [...state.watchlistIds, vehicleId];
      saveWatchlist(newWatchlist);
      return { watchlistIds: newWatchlist };
    });
  },

  isWatched: (vehicleId) => {
    return get().watchlistIds.includes(vehicleId);
  },

  getWatchlistVehicles: () => {
    const { watchlistIds, vehicles } = get();
    const watched = vehicles.filter((v) => watchlistIds.includes(v.id));
    return watched
      .map((vehicle) => ({
        vehicle,
        sortReason: getSortReason(vehicle),
      }))
      .sort((a, b) => {
        const priorityDiff = REASON_PRIORITY[a.sortReason] - REASON_PRIORITY[b.sortReason];
        if (priorityDiff !== 0) return priorityDiff;
        const statusPriority = { alert: 0, warning: 1, normal: 2 };
        return statusPriority[a.vehicle.tempStatus] - statusPriority[b.vehicle.tempStatus];
      });
  },

  initWatchlist: () => {
    set({ watchlistIds: loadWatchlist() });
  },
}));
