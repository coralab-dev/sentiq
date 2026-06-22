import { Plus } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

export default function RestaurantsPage() { return <div className="mx-auto max-w-5xl space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-slate-500">Administracion de plataforma</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Restaurantes</h2><p className="mt-2 text-sm text-slate-600">Crea y administra los restaurantes clientes de SentiQ.</p></div><Link className={buttonVariants()} href={ROUTES.PLATFORM_ADMIN_RESTAURANT_NEW}><Plus />Nuevo restaurante</Link></div><div className="border-t border-slate-200 py-12 text-sm text-slate-500">El listado avanzado de restaurantes se implementara en una tarea posterior.</div></div>; }
