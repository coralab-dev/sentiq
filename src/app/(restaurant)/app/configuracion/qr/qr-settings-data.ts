import type { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/supabase";

export type QrBranch = Pick<
  Tables<"branches">,
  "id" | "name" | "status" | "created_at" | "updated_at"
>;

export type QrSurveyLink = Pick<
  Tables<"survey_links">,
  | "id"
  | "branch_id"
  | "status"
  | "token_last4"
  | "regenerated_at"
  | "last_used_at"
  | "created_at"
  | "updated_at"
>;

export type QrSettingsRow = {
  branch: QrBranch;
  link: QrSurveyLink | null;
};

export type TemporaryGeneratedLink = {
  url: string;
  tokenLast4: string;
};

type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

export function combineQrSettingsRows(
  branches: QrBranch[],
  links: QrSurveyLink[],
): QrSettingsRow[] {
  const linksByBranch = new Map<string, QrSurveyLink>();

  for (const link of links) {
    const current = linksByBranch.get(link.branch_id);

    if (!current || (current.status !== "active" && link.status === "active")) {
      linksByBranch.set(link.branch_id, link);
    }
  }

  return branches.map((branch) => ({
    branch,
    link: linksByBranch.get(branch.id) ?? null,
  }));
}

export async function loadQrSettingsData(
  supabase: SupabaseBrowserClient,
): Promise<QrSettingsRow[]> {
  const [branchesResult, linksResult] = await Promise.all([
    supabase
      .from("branches")
      .select("id, name, status, created_at, updated_at")
      .order("name", { ascending: true }),
    supabase
      .from("survey_links")
      .select(
        "id, branch_id, status, token_last4, regenerated_at, last_used_at, created_at, updated_at",
      )
      .eq("type", "qr")
      .order("created_at", { ascending: false }),
  ]);

  if (branchesResult.error) {
    throw branchesResult.error;
  }

  if (linksResult.error) {
    throw linksResult.error;
  }

  return combineQrSettingsRows(
    branchesResult.data ?? [],
    linksResult.data ?? [],
  );
}
