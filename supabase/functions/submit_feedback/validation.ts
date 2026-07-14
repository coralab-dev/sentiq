export type SubmitFeedbackRequestPayload = {
  token?: unknown;
  source?: unknown;
  general_experience?: unknown;
  service_attention?: unknown;
  food_quality?: unknown;
  service_speed?: unknown;
  comment?: unknown;
  customer_phone?: unknown;
  consent_to_contact?: unknown;
};

const COMMENT_MAX_LENGTH = 1000;
const PHONE_MAX_LENGTH = 30;

export function validateSubmitFeedbackPayload(body: SubmitFeedbackRequestPayload | null):
  | {
      ok: true;
      value: {
        token: string;
        source: "qr" | "device";
        general_experience: number;
        service_attention: number;
        food_quality: number;
        service_speed: number;
        comment: string | null;
        customer_phone: string | null;
        consent_to_contact: boolean;
      };
    }
  | { ok: false } {
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const source = body?.source === "qr" || body?.source === "device" ? body.source : null;
  const generalExperience = normalizeRating(body?.general_experience);
  const serviceAttention = normalizeRating(body?.service_attention);
  const foodQuality = normalizeRating(body?.food_quality);
  const serviceSpeed = normalizeRating(body?.service_speed);
  const comment = typeof body?.comment === "string" && body.comment.trim().length > 0 ? body.comment.trim() : null;
  const customerPhone = typeof body?.customer_phone === "string" && body.customer_phone.trim().length > 0
    ? body.customer_phone.trim()
    : null;
  const consentToContact = body?.consent_to_contact === true;

  if (
    !token ||
    !source ||
    !generalExperience ||
    !serviceAttention ||
    !foodQuality ||
    !serviceSpeed ||
    (comment !== null && comment.length > COMMENT_MAX_LENGTH) ||
    (customerPhone !== null && customerPhone.length > PHONE_MAX_LENGTH) ||
    (customerPhone !== null && !consentToContact)
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      token,
      source,
      general_experience: generalExperience,
      service_attention: serviceAttention,
      food_quality: foodQuality,
      service_speed: serviceSpeed,
      comment,
      customer_phone: customerPhone,
      consent_to_contact: consentToContact,
    },
  };
}

function normalizeRating(value: unknown): number | null {
  return Number.isInteger(value) && typeof value === "number" && value >= 1 && value <= 5 ? value : null;
}
