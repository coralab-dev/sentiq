import type { ReactNode } from "react";

import { SettingsWorkspace } from "./settings-workspace";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsWorkspace>{children}</SettingsWorkspace>;
}
