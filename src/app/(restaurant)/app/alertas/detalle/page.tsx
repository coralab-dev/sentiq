import { Suspense } from "react";

import { LoadingState } from "@/components/shared";

import { AlertDetailClient } from "./alert-detail-client";

export default function AlertDetailPage() {
  return (
    <Suspense
      fallback={
        <LoadingState
          title="Cargando alerta"
          description="Estamos preparando el detalle de la alerta."
        />
      }
    >
      <AlertDetailClient />
    </Suspense>
  );
}
