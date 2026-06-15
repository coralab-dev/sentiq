import { AppPlaceholderPage } from "@/components/layout/app-placeholder-page";
import { FilterBar, FilterField, SectionCard } from "@/components/panel";
import { EmptyState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function RestaurantExportPage() {
  return (
    <AppPlaceholderPage
      title="Exportar"
      description="Preview de parametros para exportacion CSV. No genera archivos ni consulta datos reales."
      actions={
        <Button className="bg-orange-600 text-white hover:bg-orange-700">
          <Download className="size-4" aria-hidden="true" />
          Generar CSV
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <FilterBar>
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
          <FilterField label="Formato">
            <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
              <option>CSV</option>
            </select>
          </FilterField>
        </FilterBar>

        <SectionCard title="Opciones incluidas">
          <div className="space-y-4">
            {["Con comentario", "Con telefono", "Con alertas"].map((label) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-700">{label}</span>
                <StatusBadge status="active" label="Activo" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <EmptyState
        title="Vista previa no disponible"
        description="La previsualizacion del archivo se conectara cuando exista la logica de exportacion."
      />
    </AppPlaceholderPage>
  );
}
