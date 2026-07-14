import type { PublicSurveyConfig } from "@/types/domain";

export const SURVEY_RATING_FIELDS = [
  {
    key: "general_experience",
    configKey: "question_general_text",
  },
  {
    key: "service_attention",
    configKey: "question_attention_text",
  },
  {
    key: "food_quality",
    configKey: "question_food_text",
  },
  {
    key: "service_speed",
    configKey: "question_speed_text",
  },
] as const satisfies ReadonlyArray<{
  key: "general_experience" | "service_attention" | "food_quality" | "service_speed";
  configKey: keyof PublicSurveyConfig;
}>;

export type SurveyRatingField = (typeof SURVEY_RATING_FIELDS)[number]["key"];
