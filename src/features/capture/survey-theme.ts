import type { PublicSurveyConfig } from "@/types/domain";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function getSurveyTheme(config: PublicSurveyConfig) {
  return {
    primaryColor: config.primary_color && HEX_COLOR.test(config.primary_color) ? config.primary_color : "#2b1235",
    secondaryColor: config.secondary_color && HEX_COLOR.test(config.secondary_color) ? config.secondary_color : "#ff5947",
  };
}
