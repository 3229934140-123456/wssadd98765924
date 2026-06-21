import type { TrackPoint } from "@/types";

function generateTrackPoints(
  vehicleId: string,
  baseLng: number,
  baseLat: number,
  tempMin: number,
  tempMax: number,
  hasAnomaly: boolean = false
): TrackPoint[] {
  const points: TrackPoint[] = [];
  const phases: Array<{ phase: "loading" | "waiting" | "transporting" | "unloading"; points: number }> = [
    { phase: "loading", points: 10 },
    { phase: "waiting", points: 5 },
    { phase: "transporting", points: 30 },
    { phase: "unloading", points: 8 },
  ];

  let time = new Date("2026-06-21 06:00:00");
  let lng = baseLng;
  let lat = baseLat;
  let pointIndex = 0;

  const tempMid = (tempMin + tempMax) / 2;
  const tempRange = tempMax - tempMin;

  phases.forEach(({ phase, points: numPoints }) => {
    for (let i = 0; i < numPoints; i++) {
      let temp = tempMid + (Math.random() - 0.5) * tempRange * 0.6;

      if (hasAnomaly && phase === "transporting" && i >= 12 && i <= 20) {
        temp = tempMax + 1 + Math.random() * 3;
      }

      if (phase === "transporting") {
        lng += (Math.random() - 0.3) * 0.15;
        lat += (Math.random() - 0.4) * 0.1;
      } else if (phase === "loading" || phase === "unloading") {
        lng += (Math.random() - 0.5) * 0.02;
        lat += (Math.random() - 0.5) * 0.02;
      }

      points.push({
        id: `${vehicleId}-${pointIndex}`,
        vehicleId,
        lng: Number(lng.toFixed(4)),
        lat: Number(lat.toFixed(4)),
        temperature: Number(temp.toFixed(1)),
        timestamp: time.toISOString().replace("T", " ").slice(0, 19),
        phase,
      });

      time.setMinutes(time.getMinutes() + 8 + Math.floor(Math.random() * 5));
      pointIndex++;
    }
  });

  return points;
}

export const mockTrackPoints: Record<string, TrackPoint[]> = {
  v001: generateTrackPoints("v001", 121.47, 31.23, 0, 8, false),
  v002: generateTrackPoints("v002", 116.41, 39.90, 2, 8, false),
  v003: generateTrackPoints("v003", 113.27, 23.13, -18, -10, true),
  v004: generateTrackPoints("v004", 118.78, 32.06, 0, 8, false),
  v005: generateTrackPoints("v005", 120.15, 30.28, 0, 6, true),
  v006: generateTrackPoints("v006", 120.38, 36.07, -5, 0, false),
  v007: generateTrackPoints("v007", 118.08, 24.48, 2, 8, false),
  v008: generateTrackPoints("v008", 104.07, 30.67, -18, -10, false),
  v009: generateTrackPoints("v009", 112.94, 28.23, 0, 8, false),
  v010: generateTrackPoints("v010", 114.51, 38.04, 0, 6, false),
};

export function getTrackPoints(vehicleId: string): TrackPoint[] {
  return mockTrackPoints[vehicleId] || [];
}

export function getCurrentTrackPoint(vehicleId: string): TrackPoint | null {
  const points = mockTrackPoints[vehicleId];
  if (!points || points.length === 0) return null;
  return points[points.length - 1];
}
