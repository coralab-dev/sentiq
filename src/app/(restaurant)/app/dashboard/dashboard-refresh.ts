export const DASHBOARD_POLLING_INTERVAL_MS = 60_000;

export type DashboardLoadMode = "manual" | "auto" | "realtime";

export type RealtimeStatus = "idle" | "connected" | "disconnected" | "error";

export function getRealtimeStatusLabel(status: RealtimeStatus): string {
  if (status === "connected") {
    return "Actualizacion automatica activa";
  }

  if (status === "idle") {
    return "Preparando actualización automática";
  }

  return "Realtime no disponible; usando refresco cada 60s";
}
