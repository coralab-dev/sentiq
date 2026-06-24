import { ROUTES } from "@/config/routes";
import type { UserProfile, UserRole } from "@/types/domain";

import { canAccessRoute, isRouteOrSubroute, isValidUserRole } from "./permissions";

export function getPostLoginRedirect(role: UserRole | null | undefined): string {
  if (role === "platform_admin") {
    return ROUTES.PLATFORM_ADMIN_RESTAURANTS;
  }

  if (role === "restaurant_admin" || role === "manager") {
    return ROUTES.APP_DASHBOARD;
  }

  return ROUTES.LOGIN;
}

export function getRedirectForAuthenticatedUser(
  profile: Pick<UserProfile, "role" | "status"> | null | undefined,
): string {
  if (!profile || profile.status !== "active" || !isValidUserRole(profile.role)) {
    return ROUTES.APP_NO_ACCESS;
  }

  return getPostLoginRedirect(profile.role);
}

export function getUnauthorizedRedirect(
  role: UserRole | null | undefined,
  pathname: string,
): string | null {
  if (!role) {
    return ROUTES.LOGIN;
  }

  if (canAccessRoute(role, pathname)) {
    return null;
  }

  if (isRouteOrSubroute(pathname, ROUTES.PLATFORM_ADMIN)) {
    if (role === "restaurant_admin" || role === "manager") {
      return ROUTES.APP_DASHBOARD;
    }

    return ROUTES.PLATFORM_ADMIN_NO_ACCESS;
  }

  if (role === "platform_admin") {
    return ROUTES.PLATFORM_ADMIN_RESTAURANTS;
  }

  return ROUTES.APP_NO_ACCESS;
}
