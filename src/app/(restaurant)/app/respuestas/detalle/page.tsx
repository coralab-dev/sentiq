import { Suspense } from "react";

import { LoadingState } from "@/components/shared";

import { ResponseDetailClient } from "./response-detail-client";

export default function ResponseDetailPage() {
  return (
    <Suspense
      fallback={
        <LoadingState
          title="Cargando detalle"
          description="Estamos preparando la vista de respuesta."
        />
      }
    >
      <ResponseDetailClient />
    </Suspense>
  );
}
