import Link from "next/link";

import { EmptyState } from "@/components/shared";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <EmptyState
        title="Página no encontrada"
        description="La página que buscas no está disponible o cambió de ubicación."
        action={
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-orange-600 px-3 text-sm font-medium text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-orange-600/25"
          >
            Volver al inicio
          </Link>
        }
        className="w-full max-w-lg border-solid shadow-sm"
      />
    </main>
  );
}
