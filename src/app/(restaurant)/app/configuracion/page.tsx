import { AppPlaceholderPage } from "@/components/layout/app-placeholder-page";
import { ActionMenu, DataTable, SectionCard } from "@/components/panel";
import { EmptyState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";

export default function RestaurantSettingsPage() {
  return (
    <AppPlaceholderPage
      title="Configuracion"
      description="Preview de paneles para sucursales, QR, usuarios y ajustes. Sin persistencia ni permisos nuevos."
      actions={<Button className="bg-orange-600 text-white hover:bg-orange-700">Agregar sucursal</Button>}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <SectionCard title="Sucursales" contentClassName="p-0">
          <DataTable
            columns={[
              { key: "sucursal", header: "Sucursal" },
              { key: "zona", header: "Zona principal" },
              { key: "estado", header: "Estado" },
              { key: "qr", header: "QR" },
            ]}
            rows={[
              {
                id: "branch-1",
                cells: {
                  sucursal: "Sucursal Centro",
                  zona: "Terraza",
                  estado: <StatusBadge status="active" />,
                  qr: "https://sentiq.app/s/abc123",
                },
                actions: <ActionMenu items={[{ label: "Editar" }, { label: "Ver QR" }]} />,
              },
              {
                id: "branch-2",
                cells: {
                  sucursal: "Sucursal Sur",
                  zona: "Salon",
                  estado: <StatusBadge status="inactive" />,
                  qr: "Pendiente",
                },
                actions: <ActionMenu items={[{ label: "Editar" }, { label: "Activar" }]} />,
              },
            ]}
            emptyState={
              <EmptyState
                title="No hay sucursales"
                description="Las sucursales configuradas apareceran aqui."
                className="rounded-none border-0"
              />
            }
          />
        </SectionCard>

        <SectionCard title="Codigo QR por sucursal" description="Preview visual del patron de configuracion.">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-950">Sucursal Centro</p>
              <p className="text-xs text-slate-500">Enlace publico activo</p>
            </div>
            <div className="grid aspect-square place-items-center rounded-lg border border-slate-200 bg-slate-50">
              <div className="grid size-36 grid-cols-5 gap-1">
                {Array.from({ length: 25 }).map((_, index) => (
                  <span
                    key={index}
                    className={
                      index % 2 === 0 || index === 7 || index === 13
                        ? "bg-slate-950"
                        : "bg-white"
                    }
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <StatusBadge status="active" />
              <Button variant="outline">Copiar enlace</Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppPlaceholderPage>
  );
}
