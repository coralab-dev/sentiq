import { ROUTES } from "@/config/routes";
import type { UserRole } from "@/types/domain";

const managerExactRoutes = [
  ROUTES.APP,
] as const;

const managerSubrouteRoots = [
  ROUTES.APP_DASHBOARD,
  ROUTES.APP_RESPONSES,
  ROUTES.APP_RESPONSE_DETAIL,
  ROUTES.APP_ALERTS,
  ROUTES.APP_ALERT_DETAIL,
  ROUTES.APP_EXPORT,
  ROUTES.APP_NO_ACCESS,
] as const;

const validRoles = [
  "platform_admin",
  "restaurant_admin",
  "manager",
] as const satisfies readonly UserRole[];

export function normalizePathname(pathname: string): string {
  if (!pathname) {
    return ROUTES.HOME;
  }

  const [path] = pathname.split(/[?#]/);
  const normalized = path.replace(/\/+$/, "");

  return normalized || ROUTES.HOME;
}

export function isValidUserRole(role: string | null | undefined): role is UserRole {
  return validRoles.includes(role as UserRole);
}

export function isExactRoute(pathname: string, route: string): boolean {
  return normalizePathname(pathname) === route;
}

export function isRouteOrSubroute(pathname: string, route: string): boolean {
  const normalizedPathname = normalizePathname(pathname);

  return (
    normalizedPathname === route || normalizedPathname.startsWith(`${route}/`)
  );
}

export function canAccessRoute(
  role: UserRole | null | undefined,
  pathname: string,
): boolean {
  if (!role) {
    return false;
  }

  const normalizedPathname = normalizePathname(pathname);

  if (isRouteOrSubroute(normalizedPathname, ROUTES.PLATFORM_ADMIN)) {
    return role === "platform_admin";
  }

  if (isRouteOrSubroute(normalizedPathname, ROUTES.APP)) {
    if (role === "platform_admin") {
      return false;
    }

    if (role === "restaurant_admin") {
      return true;
    }

    if (role === "manager") {
      return (
        managerExactRoutes.some((route) =>
          isExactRoute(normalizedPathname, route),
        ) ||
        managerSubrouteRoots.some((route) =>
          isRouteOrSubroute(normalizedPathname, route),
        )
      );
    }
  }

  return false;
}

export function getNavigationForRole(role: UserRole) {
  if (role === "platform_admin") {
    return [
      {
        label: "Restaurantes",
        href: ROUTES.PLATFORM_ADMIN_RESTAURANTS,
      },
    ];
  }

  const restaurantNavigation = [
    {
      label: "Dashboard",
      href: ROUTES.APP_DASHBOARD,
    },
    {
      label: "Respuestas",
      href: ROUTES.APP_RESPONSES,
    },
    {
      label: "Alertas",
      href: ROUTES.APP_ALERTS,
    },
    {
      label: "Exportar",
      href: ROUTES.APP_EXPORT,
    },
  ];

  if (role === "manager") {
    return restaurantNavigation;
  }

  return [
    ...restaurantNavigation,
    {
      label: "Configuración",
      href: ROUTES.APP_SETTINGS,
    },
  ];
}
