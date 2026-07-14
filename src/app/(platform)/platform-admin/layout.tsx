import type { ReactNode } from "react";

import { PlatformRouteGuard } from "@/components/auth";
import { AppShell } from "@/components/layout/app-shell";

type PlatformAdminLayoutProps = {
  children: ReactNode;
};

export default function PlatformAdminLayout({
  children,
}: PlatformAdminLayoutProps) {
  return (
    <AppShell variant="platform">
      <PlatformRouteGuard>{children}</PlatformRouteGuard>
    </AppShell>
  );
}
