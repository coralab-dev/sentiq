import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

export default function PlatformAdminPage() { redirect(ROUTES.PLATFORM_ADMIN_RESTAURANTS); }
