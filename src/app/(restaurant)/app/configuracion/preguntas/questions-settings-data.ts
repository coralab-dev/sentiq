import type { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/supabase";

export type QuestionField =
  | "question_general_text"
  | "question_attention_text"
  | "question_food_text"
  | "question_speed_text";

export type QuestionMetric =
  | "general_experience"
  | "service_attention"
  | "food_quality"
  | "service_speed";

export type QuestionValues = Record<QuestionField, string>;
export type QuestionErrors = Partial<Record<QuestionField, string>>;
export type SurveyVisualValues = {
  logo_url: string; primary_color: string; secondary_color: string;
  survey_welcome_text: string; survey_thank_you_text: string; contact_consent_text: string;
};
export type SurveyVisualErrors = Partial<Record<keyof SurveyVisualValues, string>>;

export type QuestionsSettingsData = {
  settingsId: string | null;
  restaurantId: string;
  values: QuestionValues;
  visuals: SurveyVisualValues;
  updatedAt: string | null;
};

export const DEFAULT_QUESTION_VALUES: QuestionValues = {
  question_general_text: "¿Cómo fue tu experiencia general?",
  question_attention_text: "¿Cómo calificarías la atención?",
  question_food_text: "¿Cómo calificarías los alimentos o bebidas?",
  question_speed_text: "¿Cómo calificarías la rapidez del servicio?",
};
export const DEFAULT_SURVEY_VISUAL_VALUES: SurveyVisualValues = {
  logo_url: "", primary_color: "#0f766e", secondary_color: "#ea580c",
  survey_welcome_text: "Gracias por elegirnos. Tu opinión nos ayuda a mejorar cada día.",
  survey_thank_you_text: "Tu feedback nos ayuda a brindar mejores experiencias cada día.",
  contact_consent_text: "Acepto que el restaurante me contacte para dar seguimiento a mi experiencia.",
};

export const QUESTION_DEFINITIONS: ReadonlyArray<{
  field: QuestionField;
  metric: QuestionMetric;
}> = [
  { field: "question_general_text", metric: "general_experience" },
  { field: "question_attention_text", metric: "service_attention" },
  { field: "question_food_text", metric: "food_quality" },
  { field: "question_speed_text", metric: "service_speed" },
];

type QuestionSettingsRow = Pick<
  Tables<"restaurant_settings">,
  | "id"
  | "question_general_text"
  | "question_attention_text"
  | "question_food_text"
  | "question_speed_text"
  | "updated_at"
  | "logo_url" | "primary_color" | "secondary_color" | "survey_welcome_text"
  | "survey_thank_you_text" | "contact_consent_text"
>;

type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

export function normalizeQuestionValues(
  settings: Pick<QuestionSettingsRow, QuestionField> | null,
): QuestionValues {
  return {
    question_general_text:
      settings?.question_general_text?.trim() ||
      DEFAULT_QUESTION_VALUES.question_general_text,
    question_attention_text:
      settings?.question_attention_text?.trim() ||
      DEFAULT_QUESTION_VALUES.question_attention_text,
    question_food_text:
      settings?.question_food_text?.trim() ||
      DEFAULT_QUESTION_VALUES.question_food_text,
    question_speed_text:
      settings?.question_speed_text?.trim() ||
      DEFAULT_QUESTION_VALUES.question_speed_text,
  };
}

export function normalizeSurveyVisualValues(settings: Partial<QuestionSettingsRow> | null): SurveyVisualValues {
  return Object.fromEntries(Object.entries(DEFAULT_SURVEY_VISUAL_VALUES).map(([key, fallback]) => [
    key, settings?.[key as keyof QuestionSettingsRow]?.toString().trim() || fallback,
  ])) as SurveyVisualValues;
}

export function validateSurveyVisualValues(values: SurveyVisualValues): SurveyVisualErrors {
  const errors: SurveyVisualErrors = {};
  if (values.logo_url.trim()) {
    try { const url = new URL(values.logo_url.trim()); if (url.protocol !== "https:") throw new Error(); }
    catch { errors.logo_url = "Ingresa una URL absoluta que use https://."; }
  }
  for (const field of ["primary_color", "secondary_color"] as const) {
    if (values[field].trim() && !/^#[0-9a-fA-F]{6}$/.test(values[field].trim()))
      errors[field] = "Usa un color hexadecimal con formato #RRGGBB.";
  }
  return errors;
}

export function getSettingsValidationMessage(questionErrors: QuestionErrors, visualErrors: SurveyVisualErrors) {
  if (Object.keys(visualErrors).length > 0) return "Corrige la URL del logo y los colores antes de guardar.";
  if (Object.keys(questionErrors).length > 0) return "Completa las cuatro preguntas antes de guardar.";
  return null;
}

export function buildSettingsPayload(input: { questions: QuestionValues; visuals: SurveyVisualValues }) {
  const questions = Object.fromEntries(Object.entries(input.questions).map(([k, v]) => [k, v.trim()])) as QuestionValues;
  const visuals = Object.fromEntries(Object.entries(input.visuals).map(([k, v]) => [k, v.trim() || null])) as Record<keyof SurveyVisualValues, string | null>;
  return { ...questions, ...visuals };
}

export function validateQuestionValues(values: QuestionValues): QuestionErrors {
  const errors: QuestionErrors = {};

  for (const { field } of QUESTION_DEFINITIONS) {
    if (!values[field].trim()) {
      errors[field] = "El texto de la pregunta es obligatorio.";
    }
  }

  return errors;
}

export async function loadQuestionsSettingsData(
  supabase: SupabaseBrowserClient,
): Promise<QuestionsSettingsData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error("No hay una sesion autenticada.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("restaurant_id")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile?.restaurant_id) {
    throw profileError ?? new Error("El perfil no tiene restaurante asignado.");
  }

  const { data: settings, error: settingsError } = await supabase
    .from("restaurant_settings")
    .select(
      "id, logo_url, primary_color, secondary_color, survey_welcome_text, survey_thank_you_text, contact_consent_text, question_general_text, question_attention_text, question_food_text, question_speed_text, updated_at",
    )
    .eq("restaurant_id", profile.restaurant_id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (settingsError) {
    throw settingsError;
  }

  return {
    settingsId: settings?.id ?? null,
    restaurantId: profile.restaurant_id,
    values: normalizeQuestionValues(settings ?? null),
    visuals: normalizeSurveyVisualValues(settings ?? null),
    updatedAt: settings?.updated_at ?? null,
  };
}

export async function saveQuestionsSettingsData(
  supabase: SupabaseBrowserClient,
  current: QuestionsSettingsData,
  values: QuestionValues,
  visuals: SurveyVisualValues,
): Promise<QuestionsSettingsData> {
  const normalizedValues = {
    question_general_text: values.question_general_text.trim(),
    question_attention_text: values.question_attention_text.trim(),
    question_food_text: values.question_food_text.trim(),
    question_speed_text: values.question_speed_text.trim(),
  } satisfies QuestionValues;
  const validationErrors = validateQuestionValues(normalizedValues);

  if (Object.keys(validationErrors).length > 0) {
    throw new Error("Las cuatro preguntas son obligatorias.");
  }

  const updatedAt = new Date().toISOString();
  const visualErrors = validateSurveyVisualValues(visuals);
  if (Object.keys(visualErrors).length) throw new Error("La configuracion visual no es valida.");
  const payload = { ...buildSettingsPayload({ questions: normalizedValues, visuals }), updated_at: updatedAt };

  const result = current.settingsId
    ? await supabase
        .from("restaurant_settings")
        .update(payload)
        .eq("id", current.settingsId)
        .select("id, updated_at")
        .single()
    : await supabase
        .from("restaurant_settings")
        .insert({ restaurant_id: current.restaurantId, ...payload })
        .select("id, updated_at")
        .single();

  if (result.error || !result.data) {
    throw result.error ?? new Error("No se pudo guardar la configuracion.");
  }

  return {
    settingsId: result.data.id,
    restaurantId: current.restaurantId,
    values: normalizedValues,
    visuals: normalizeSurveyVisualValues(payload),
    updatedAt: result.data.updated_at ?? updatedAt,
  };
}
