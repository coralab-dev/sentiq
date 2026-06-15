import { AppPlaceholderPage } from "@/components/layout/app-placeholder-page";
import { ActionMenu, DataTable, FilterBar, FilterField, MetricCard } from "@/components/panel";
import { EmptyState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, PauseCircle } from "lucide-react";

export default function RestaurantAlertsPage() {
  return (
    <AppPlaceholderPage
      title="Alertas"
      description="Preview del flujo de seguimiento de alertas. Las acciones son visuales y no persisten cambios."
      actions={<Button className="bg-orange-600 text-white hover:bg-orange-700">Revisar pendientes</Button>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Pendientes"
          value="6"
          helper="Requieren atencion"
          variant="warning"
          icon={<AlertTriangle className="size-5" aria-hidden="true" />}
        />
        <MetricCard
          label="Atendidas"
          value="12"
          helper="Esta semana"
          variant="success"
          icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
        />
        <MetricCard
          label="Atendidas"
          value="3"
          helper="Con seguimiento"
          variant="neutral"
          icon={<PauseCircle className="size-5" aria-hidden="true" />}
        />
      </div>

      <FilterBar actions={<Button variant="outline">Filtrar</Button>}>
        <FilterField label="Prioridad">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>Todas</option>
          </select>
        </FilterField>
        <FilterField label="Estado">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>Pendientes y pausadas</option>
          </select>
        </FilterField>
        <FilterField label="Sucursal">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>Todas</option>
          </select>
        </FilterField>
        <FilterField label="Asignacion">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>Todos</option>
          </select>
        </FilterField>
      </FilterBar>

      <DataTable
        columns={[
          { key: "alerta", header: "Alerta" },
          { key: "sucursal", header: "Sucursal" },
          { key: "zona", header: "Zona" },
          { key: "estado", header: "Estado" },
          { key: "fecha", header: "Fecha" },
        ]}
        rows={[
          {
            id: "alert-1",
            cells: {
              alerta: "Experiencia general",
              sucursal: "Sucursal Centro",
              zona: "Terraza",
              estado: <StatusBadge status="pending" />,
              fecha: "18 may., 14:32",
            },
            actions: (
              <ActionMenu
                items={[
                  { label: "Ver detalle" },
                    { label: "Marcar atendida" },
                ]}
              />
            ),
          },
          {
            id: "alert-2",
            cells: {
              alerta: "Rapidez del servicio",
              sucursal: "Sucursal Valle",
              zona: "Bar",
              estado: <StatusBadge status="paused" />,
              fecha: "18 may., 09:47",
            },
            actions: <ActionMenu items={[{ label: "Ver detalle" }, { label: "Reactivar" }]} />,
          },
        ]}
        emptyState={
          <EmptyState
            title="No hay alertas"
            description="Las alertas criticas apareceran aqui."
            className="rounded-none border-0"
          />
        }
      />
    </AppPlaceholderPage>
  );
}
