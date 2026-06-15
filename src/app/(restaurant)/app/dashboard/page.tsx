import { AppPlaceholderPage } from "@/components/layout/app-placeholder-page";
import {
  ActionMenu,
  DataTable,
  FilterBar,
  FilterField,
  MetricCard,
  RatingScore,
  SectionCard,
} from "@/components/panel";
import { EmptyState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Bell, Clock, MessageSquareText, Store } from "lucide-react";

export default function RestaurantDashboardPage() {
  return (
    <AppPlaceholderPage
      title="Dashboard"
      description="Preview estructural para COR-91: metricas, filtros y tabla de actividad con datos estaticos."
      actions={<Button className="bg-orange-600 text-white hover:bg-orange-700">Nueva revision</Button>}
    >
      <FilterBar actions={<Button variant="outline">Filtrar</Button>}>
        <FilterField label="Periodo">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>12 may. - 18 may. 2025</option>
          </select>
        </FilterField>
        <FilterField label="Sucursal">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>Sucursal Centro</option>
          </select>
        </FilterField>
        <FilterField label="Zona">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>Todas las zonas</option>
          </select>
        </FilterField>
        <FilterField label="Fuente">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>QR y dispositivo</option>
          </select>
        </FilterField>
      </FilterBar>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Respuestas"
          value="245"
          helper="+12% vs periodo anterior"
          variant="success"
          icon={<MessageSquareText className="size-5" aria-hidden="true" />}
        />
        <MetricCard
          label="Alertas"
          value="18"
          helper="6 pendientes"
          variant="warning"
          icon={<Bell className="size-5" aria-hidden="true" />}
        />
        <MetricCard
          label="Tiempo promedio"
          value="1.8 h"
          helper="-9% vs periodo anterior"
          variant="info"
          icon={<Clock className="size-5" aria-hidden="true" />}
        />
        <MetricCard
          label="Sucursales activas"
          value="12"
          helper="+2 en el periodo"
          variant="neutral"
          icon={<Store className="size-5" aria-hidden="true" />}
        />
      </div>

      <SectionCard
        title="Actividad reciente"
        description="Tabla base para resumir respuestas y alertas del panel."
        contentClassName="p-0"
      >
        <DataTable
          columns={[
            { key: "alerta", header: "Alerta" },
            { key: "sucursal", header: "Sucursal" },
            { key: "zona", header: "Zona" },
            { key: "estado", header: "Estado" },
            { key: "calificacion", header: "Calificacion" },
            { key: "fecha", header: "Fecha" },
          ]}
          rows={[
            {
              id: "row-1",
              cells: {
                alerta: "Experiencia general",
                sucursal: "Sucursal Centro",
                zona: "Terraza",
                estado: <StatusBadge status="pending" />,
                calificacion: <RatingScore value={2} />,
                fecha: "18 may., 14:32",
              },
              actions: (
                <ActionMenu
                  items={[
                    { label: "Ver detalle" },
                    { label: "Asignar" },
                    { label: "Pausar" },
                  ]}
                />
              ),
            },
            {
              id: "row-2",
              cells: {
                alerta: "Atencion recibida",
                sucursal: "Sucursal Norte",
                zona: "Salon",
                estado: <StatusBadge status="attended" />,
                calificacion: <RatingScore value={4} />,
                fecha: "18 may., 12:15",
              },
              actions: (
                <ActionMenu items={[{ label: "Ver detalle" }, { label: "Editar" }]} />
              ),
            },
          ]}
          emptyState={
            <EmptyState
              title="No hay actividad"
              description="Aparecera cuando existan respuestas o alertas en el periodo."
              className="rounded-none border-0"
            />
          }
        />
      </SectionCard>
    </AppPlaceholderPage>
  );
}
