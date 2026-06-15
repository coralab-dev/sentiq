import type { ReactNode } from "react";

import { PageHeader, SectionCard } from "@/components/panel";

type AppPlaceholderPageProps = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export function AppPlaceholderPage({
  title,
  description,
  eyebrow = "Proximo ticket",
  actions,
  children,
}: AppPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <SectionCard>
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={actions}
        />
      </SectionCard>
      {children}
    </div>
  );
}
