import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";
import { errorResponse, handleOptions, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { getSurveyLinkContext } from "../_shared/survey-link.ts";

const DEFAULT_QUESTION_GENERAL = "¿Cómo fue tu experiencia general?";
const DEFAULT_QUESTION_ATTENTION = "¿Cómo calificarías la atención?";
const DEFAULT_QUESTION_FOOD = "¿Cómo calificarías los alimentos o bebidas?";
const DEFAULT_QUESTION_SPEED = "¿Cómo calificarías la rapidez del servicio?";
const DEFAULT_CONSENT_TEXT = "Acepto que el restaurante me contacte para dar seguimiento a mi experiencia.";
const DEFAULT_PRIMARY_COLOR = "#0f766e";
const DEFAULT_SECONDARY_COLOR = "#ea580c";
const DEFAULT_THANK_YOU_TEXT = "Tu feedback nos ayuda a brindar mejores experiencias cada día.";

type RequestPayload = {
  token?: unknown;
};

Deno.serve(async (req: Request) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (req.method !== "POST") {
    return errorResponse("invalid_method", 405);
  }

  const body = (await readJsonBody(req)) as RequestPayload | null;

  if (!body || typeof body.token !== "string" || body.token.trim().length === 0) {
    return errorResponse("invalid_payload", 400);
  }

  try {
    const supabase = createServiceClient();
    const result = await getSurveyLinkContext(supabase, body.token);

    if (!result.ok) {
      return errorResponse(result.code, result.code === "invalid_token" ? 404 : 403);
    }

    const { context } = result;
    const settings = context.settings;

    return jsonResponse({
      restaurant_name: context.restaurant.name,
      branch_name: context.branch.name,
      logo_url: settings?.logo_url ?? null,
      primary_color: settings?.primary_color ?? DEFAULT_PRIMARY_COLOR,
      secondary_color: settings?.secondary_color ?? DEFAULT_SECONDARY_COLOR,
      survey_welcome_text: settings?.survey_welcome_text ?? null,
      survey_thank_you_text: settings?.survey_thank_you_text ?? DEFAULT_THANK_YOU_TEXT,
      question_general_text: settings?.question_general_text ?? DEFAULT_QUESTION_GENERAL,
      question_attention_text: settings?.question_attention_text ?? DEFAULT_QUESTION_ATTENTION,
      question_food_text: settings?.question_food_text ?? DEFAULT_QUESTION_FOOD,
      question_speed_text: settings?.question_speed_text ?? DEFAULT_QUESTION_SPEED,
      contact_consent_text: settings?.contact_consent_text ?? DEFAULT_CONSENT_TEXT,
      source: context.type,
      device_name: context.device?.name ?? null,
      zone_name: context.zone?.name ?? null,
    });
  } catch {
    return errorResponse("server_error", 500);
  }
});
