import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_QUESTION_VALUES,
  normalizeQuestionValues,
  validateQuestionValues,
} from "./questions-settings-data.ts";

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
