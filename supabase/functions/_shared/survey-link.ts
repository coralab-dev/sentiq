import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { hashPublicToken, normalizePublicToken } from "./public-token.ts";

export type SurveySettings = {
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  survey_welcome_text: string | null;
  survey_thank_you_text: string | null;
  question_general_text: string | null;
  question_attention_text: string | null;
  question_food_text: string | null;
  question_speed_text: string | null;
  contact_consent_text: string | null;
};

export type SurveyLinkContext = {
  id: string;
  restaurant_id: string;
  branch_id: string;
  zone_id: string | null;
  device_id: string | null;
  type: "qr" | "device";
  status: string;
  token_hash: string;
  restaurant: { name: string; status: string };
  branch: { name: string; status: string };
  zone: { name: string; status: string } | null;
  device: { name: string; status: string } | null;
  settings: SurveySettings | null;
};

export type SurveyLinkLookupResult =
  | { ok: true; token: string; tokenHash: string; context: SurveyLinkContext }
  | { ok: false; code: "invalid_token" | "inactive_link" | "inactive_restaurant" | "inactive_branch" | "inactive_device" };

export async function getSurveyLinkContext(supabase: SupabaseClient, rawToken: string): Promise<SurveyLinkLookupResult> {
  const token = normalizePublicToken(rawToken);
  const tokenHash = await hashPublicToken(token);

  const { data, error } = await supabase
    .from("survey_links")
    .select(
      `
      id,
      restaurant_id,
      branch_id,
      zone_id,
      device_id,
      type,
      status,
      token_hash,
      restaurant:restaurants!survey_links_restaurant_id_fkey(name,status),
      branch:branches!survey_links_branch_id_fkey(name,status),
      zone:zones!survey_links_zone_id_fkey(name,status),
      device:devices!survey_links_device_id_fkey(name,status)
    `,
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, code: "invalid_token" };
  }

  const link = data as unknown as Omit<SurveyLinkContext, "settings">;

  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select(
      "logo_url,primary_color,secondary_color,survey_welcome_text,survey_thank_you_text,question_general_text,question_attention_text,question_food_text,question_speed_text,contact_consent_text",
    )
    .eq("restaurant_id", link.restaurant_id)
    .maybeSingle();

  const context: SurveyLinkContext = {
    ...link,
    settings: (settings ?? null) as SurveySettings | null,
  };

  if (context.status !== "active") {
    return { ok: false, code: "inactive_link" };
  }

  if (context.restaurant.status !== "active") {
    return { ok: false, code: "inactive_restaurant" };
  }

  if (context.branch.status !== "active") {
    return { ok: false, code: "inactive_branch" };
  }

  if (context.type === "device" && context.device?.status !== "active") {
    return { ok: false, code: "inactive_device" };
  }

  return { ok: true, token, tokenHash, context };
}
