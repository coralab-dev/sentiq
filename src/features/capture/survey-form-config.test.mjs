import assert from "node:assert/strict";
import test from "node:test";

import { SURVEY_RATING_FIELDS } from "./survey-form-config.ts";

test("defines the four survey ratings once and in operational order", () => {
  assert.deepEqual(
    SURVEY_RATING_FIELDS.map(({ key, configKey }) => ({ key, configKey })),
    [
      { key: "general_experience", configKey: "question_general_text" },
      { key: "service_attention", configKey: "question_attention_text" },
      { key: "food_quality", configKey: "question_food_text" },
      { key: "service_speed", configKey: "question_speed_text" },
    ],
  );
});
