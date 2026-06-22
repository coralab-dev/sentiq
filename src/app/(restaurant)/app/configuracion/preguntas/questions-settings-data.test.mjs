import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_QUESTION_VALUES,
  DEFAULT_SURVEY_VISUAL_VALUES,
  buildSettingsPayload,
  getSettingsValidationMessage,
  normalizeQuestionValues,
  normalizeSurveyVisualValues,
  validateSurveyVisualValues,
  validateQuestionValues,
} from "./questions-settings-data.ts";

test("distingue errores visuales de preguntas requeridas", () => {
  assert.equal(getSettingsValidationMessage({}, { logo_url: "error" }), "Corrige la URL del logo y los colores antes de guardar.");
  assert.equal(getSettingsValidationMessage({ question_food_text: "error" }, {}), "Completa las cuatro preguntas antes de guardar.");
});

test("normaliza valores visuales faltantes con defaults", () => {
  assert.deepEqual(normalizeSurveyVisualValues(null), DEFAULT_SURVEY_VISUAL_VALUES);
});

test("valida colores hex y logo https absoluto", () => {
  assert.deepEqual(validateSurveyVisualValues({
    ...DEFAULT_SURVEY_VISUAL_VALUES,
    logo_url: "http://example.com/logo.png",
    primary_color: "teal",
    secondary_color: "#abc",
  }), {
    logo_url: "Ingresa una URL absoluta que use https://.",
    primary_color: "Usa un color hexadecimal con formato #RRGGBB.",
    secondary_color: "Usa un color hexadecimal con formato #RRGGBB.",
  });
});

test("crea payload trim y convierte visuales vacios a null", () => {
  const payload = buildSettingsPayload({
    questions: { ...DEFAULT_QUESTION_VALUES, question_general_text: "  General  " },
    visuals: { ...DEFAULT_SURVEY_VISUAL_VALUES, logo_url: " ", primary_color: "" },
  });
  assert.equal(payload.question_general_text, "General");
  assert.equal(payload.logo_url, null);
  assert.equal(payload.primary_color, null);
  assert.equal(payload.secondary_color, "#ea580c");
});

test("usa defaults cuando la configuracion no tiene textos", () => {
  assert.deepEqual(
    normalizeQuestionValues({
      question_general_text: null,
      question_attention_text: null,
      question_food_text: null,
      question_speed_text: null,
    }),
    DEFAULT_QUESTION_VALUES,
  );
});

test("conserva textos configurados y reemplaza solo valores vacios", () => {
  assert.deepEqual(
    normalizeQuestionValues({
      question_general_text: "  Experiencia personalizada  ",
      question_attention_text: "",
      question_food_text: "Calidad de alimentos",
      question_speed_text: "Rapidez personalizada",
    }),
    {
      question_general_text: "Experiencia personalizada",
      question_attention_text: DEFAULT_QUESTION_VALUES.question_attention_text,
      question_food_text: "Calidad de alimentos",
      question_speed_text: "Rapidez personalizada",
    },
  );
});

test("marca cada texto vacio como requerido", () => {
  assert.deepEqual(
    validateQuestionValues({
      question_general_text: "",
      question_attention_text: "Atencion",
      question_food_text: "   ",
      question_speed_text: "Rapidez",
    }),
    {
      question_general_text: "El texto de la pregunta es obligatorio.",
      question_food_text: "El texto de la pregunta es obligatorio.",
    },
  );
});
