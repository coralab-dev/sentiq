import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

export default function RestaurantDetailPlaceholder() { return <EmptyState title="Detalle de restaurante" description="El detalle completo se implementara en T-037. Esta pantalla no consulta ni muestra informacion sensible." action={<Link className={buttonVariants({ variant: "outline" })} href={ROUTES.PLATFORM_ADMIN_RESTAURANTS}><ArrowLeft />Volver a restaurantes</Link>} />; }
