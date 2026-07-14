import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";
import { errorResponse, handleOptions, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { applyPublicRateLimit } from "../_shared/rate-limit.ts";
import { getSurveyLinkContext } from "../_shared/survey-link.ts";
import { validateSubmitFeedbackPayload, type SubmitFeedbackRequestPayload } from "./validation.ts";

Deno.serve(async (req: Request) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (req.method !== "POST") {
    return errorResponse("invalid_method", 405);
  }

  const body = (await readJsonBody(req)) as SubmitFeedbackRequestPayload | null;
  const validation = validateSubmitFeedbackPayload(body);

  if (!validation.ok) {
    return errorResponse("invalid_payload", 400);
  }

  try {
    const supabase = createServiceClient();
    const linkResult = await getSurveyLinkContext(supabase, validation.value.token);

    if (!linkResult.ok) {
      return errorResponse(linkResult.code, linkResult.code === "invalid_token" ? 404 : 403);
    }

    const { context } = linkResult;

    if (validation.value.source !== context.type) {
      return errorResponse("invalid_payload", 400);
    }

    const rateLimitResult = await applyPublicRateLimit({
      supabase,
      req,
      surveyLinkId: context.id,
      source: context.type,
    });

    if (!rateLimitResult.ok) {
      return errorResponse(rateLimitResult.reason === "limited" ? "rate_limited" : "server_error", rateLimitResult.reason === "limited" ? 429 : 500);
    }

    const hasAlert = validation.value.general_experience <= 3;
    const consentTextSnapshot = validation.value.customer_phone
      ? context.settings?.contact_consent_text ?? "Acepto que el restaurante me contacte para dar seguimiento a mi experiencia."
      : null;

    const { data: response, error: insertError } = await supabase
      .from("feedback_responses")
      .insert({
        restaurant_id: context.restaurant_id,
        branch_id: context.branch_id,
        zone_id: context.zone_id,
        device_id: context.device_id,
        survey_link_id: context.id,
        source: context.type,
        general_experience: validation.value.general_experience,
        service_attention: validation.value.service_attention,
        food_quality: validation.value.food_quality,
        service_speed: validation.value.service_speed,
        comment: validation.value.comment,
        customer_phone: validation.value.customer_phone,
        consent_to_contact: validation.value.consent_to_contact,
        consent_text_snapshot: consentTextSnapshot,
        has_alert: hasAlert,
      })
      .select("id")
      .single();

    if (insertError || !response) {
      return errorResponse("server_error", 500);
    }

    if (hasAlert) {
      const { error: alertError } = await supabase.from("feedback_alerts").insert({
        restaurant_id: context.restaurant_id,
        branch_id: context.branch_id,
        zone_id: context.zone_id,
        device_id: context.device_id,
        response_id: response.id,
        source: context.type,
        general_experience: validation.value.general_experience,
        status: "pending",
      });

      if (alertError) {
        return errorResponse("server_error", 500);
      }
    }

    await supabase.from("survey_links").update({ last_used_at: new Date().toISOString() }).eq("id", context.id);

    if (context.type === "device" && context.device_id) {
      await supabase.from("devices").update({ last_used_at: new Date().toISOString() }).eq("id", context.device_id);
    }

    return jsonResponse({ ok: true, response_id: response.id, has_alert: hasAlert });
  } catch {
    return errorResponse("server_error", 500);
  }
});
