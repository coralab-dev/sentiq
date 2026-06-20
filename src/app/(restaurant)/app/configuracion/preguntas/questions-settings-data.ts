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

export type QuestionsSettingsData = {
  settingsId: string | null;
  restaurantId: string;
  values: QuestionValues;
  updatedAt: string | null;
};

export const DEFAULT_QUESTION_VALUES: QuestionValues = {
  question_general_text: "¿Cómo fue tu experiencia general?",
  question_attention_text: "¿Cómo calificarías la atención?",
  question_food_text: "¿Cómo calificarías los alimentos o bebidas?",
  question_speed_text: "¿Cómo calificarías la rapidez del servicio?",
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
      "id, question_general_text, question_attention_text, question_food_text, question_speed_text, updated_at",
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
    updatedAt: settings?.updated_at ?? null,
  };
}

export async function saveQuestionsSettingsData(
  supabase: SupabaseBrowserClient,
  current: QuestionsSettingsData,
  values: QuestionValues,
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
  const payload = { ...normalizedValues, updated_at: updatedAt };

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
    updatedAt: result.data.updated_at ?? updatedAt,
  };
}
