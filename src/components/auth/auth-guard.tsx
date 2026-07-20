"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { LoadingState } from "@/components/shared";
import {
  getCurrentSessionProfile,
  getUnauthorizedRedirect,
  type AuthSessionState,
} from "@/lib/auth";

type AuthGuardProps = {
  children: ReactNode;
  loadingTitle?: ReactNode;
};

export function AuthGuard({
  children,
  loadingTitle = "Validando acceso",
}: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionState, setSessionState] = useState<AuthSessionState | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function validateAccess() {
      const nextSessionState = await getCurrentSessionProfile();

      if (!isMounted) {
        return;
      }

      const redirectTo = getUnauthorizedRedirect(
        nextSessionState.isActiveProfile ? nextSessionState.role : null,
        pathname,
      );

      if (redirectTo && redirectTo !== pathname) {
        router.replace(redirectTo);
        return;
      }

      setSessionState(nextSessionState);
    }

    validateAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (!sessionState?.isActiveProfile) {
    return (
      <LoadingState
        title={loadingTitle}
        description="Estamos revisando tu sesión y permisos."
        className="min-h-screen rounded-none border-0 shadow-none"
      />
    );
  }

  return children;
}
