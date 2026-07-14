import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import "./restaurant-theme.css";

type RestaurantAppLayoutProps = {
  children: ReactNode;
};

export default function RestaurantAppLayout({
  children,
}: RestaurantAppLayoutProps) {
  return <AppShell variant="restaurant">{children}</AppShell>;
}
