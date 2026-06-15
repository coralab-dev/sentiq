import { AppPlaceholderPage } from "@/components/layout/app-placeholder-page";
import {
  ActionMenu,
  DataTable,
  FilterBar,
  FilterField,
  RatingScore,
  SectionCard,
} from "@/components/panel";
import { EmptyState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";

export default function RestaurantResponsesPage() {
  return (
    <AppPlaceholderPage
      title="Respuestas"
      description="Preview de listado de feedback con filtros y calificacion. Sin detalle ni acciones reales."
    >
      <FilterBar actions={<Button variant="outline">Limpiar</Button>}>
        <FilterField label="Periodo">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>Ultimos 7 dias</option>
          </select>
        </FilterField>
        <FilterField label="Sucursal">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>Todas las sucursales</option>
          </select>
        </FilterField>
        <FilterField label="Calificacion">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>Todas</option>
          </select>
        </FilterField>
        <FilterField label="Estado">
          <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option>Todos los estados</option>
          </select>
        </FilterField>
      </FilterBar>

      <SectionCard title="Respuestas recientes" contentClassName="p-0">
        <DataTable
          columns={[
            { key: "respuesta", header: "Respuesta" },
            { key: "sucursal", header: "Sucursal" },
            { key: "fuente", header: "Fuente" },
            { key: "estado", header: "Estado" },
            { key: "calificacion", header: "Calificacion" },
            { key: "fecha", header: "Fecha" },
          ]}
          rows={[
            {
              id: "response-1",
              cells: {
                respuesta: "La comida tardo mucho y llego fria.",
                sucursal: "Sucursal Centro",
                fuente: "QR mesa 12",
                estado: <StatusBadge status="pending" />,
                calificacion: <RatingScore value={2} />,
                fecha: "18 may., 14:32",
              },
              actions: <ActionMenu items={[{ label: "Ver detalle" }, { label: "Asignar" }]} />,
            },
            {
              id: "response-2",
              cells: {
                respuesta: "Servicio rapido y amable.",
                sucursal: "Sucursal Sur",
                fuente: "Dispositivo",
                estado: <StatusBadge status="completed" />,
                calificacion: <RatingScore value={5} />,
                fecha: "18 may., 10:05",
              },
              actions: <ActionMenu items={[{ label: "Ver detalle" }, { label: "Editar" }]} />,
            },
          ]}
          emptyState={
            <EmptyState
              title="No hay respuestas"
              description="Ajusta los filtros o espera nuevas encuestas."
              className="rounded-none border-0"
            />
          }
        />
      </SectionCard>
    </AppPlaceholderPage>
  );
}
