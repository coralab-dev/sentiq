import { AppPlaceholderPage } from "@/components/layout/app-placeholder-page";
import { SectionCard } from "@/components/panel";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";

export default function RestaurantAccessDeniedPage() {
  return (
    <AppPlaceholderPage
      eyebrow="Permisos"
      title="Sin acceso"
      description="No tienes permisos para ver esta seccion. Solicita apoyo a un administrador."
      actions={<Button variant="outline">Volver al panel</Button>}
    >
      <SectionCard>
        <EmptyState
          title="Acceso restringido"
          description="Este estado reutiliza el componente base para pantallas bloqueadas o sin informacion disponible."
          className="min-h-80 border-solid shadow-none"
        />
      </SectionCard>
    </AppPlaceholderPage>
  );
}
