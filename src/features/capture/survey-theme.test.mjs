import assert from "node:assert/strict";
import test from "node:test";

import { getSurveyTheme } from "./survey-theme.ts";

const baseConfig = {
  primary_color: null,
  secondary_color: null,
};

test("uses the SentiQ palette when restaurant accents are not configured", () => {
  assert.deepEqual(getSurveyTheme(baseConfig), {
    primaryColor: "#2b1235",
    secondaryColor: "#ff5947",
  });
});

test("keeps valid restaurant colors as survey accents", () => {
  assert.deepEqual(
    getSurveyTheme({
      ...baseConfig,
      primary_color: "#315f55",
      secondary_color: "#d84f3f",
    }),
    {
      primaryColor: "#315f55",
      secondaryColor: "#d84f3f",
    },
  );
});

test("rejects malformed colors and falls back independently", () => {
  assert.deepEqual(
    getSurveyTheme({
      ...baseConfig,
      primary_color: "teal",
      secondary_color: "#123",
    }),
    {
      primaryColor: "#2b1235",
      secondaryColor: "#ff5947",
    },
  );
});
