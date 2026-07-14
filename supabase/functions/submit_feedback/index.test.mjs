import assert from "node:assert/strict";
import test from "node:test";

import { errorResponse } from "../_shared/http.ts";
import { validateSubmitFeedbackPayload } from "./validation.ts";

const invalidPayload = {
  token: "public-input-token",
  source: "qr",
  general_experience: 6,
  service_attention: 5,
  food_quality: 5,
  service_speed: 5,
  comment: "private customer comment",
  customer_phone: "+52 55 1000 1000",
  consent_to_contact: false,
};

test("invalid submit payload maps to a controlled public error", async () => {
  const validation = validateSubmitFeedbackPayload(invalidPayload);

  assert.equal(validation.ok, false);

  const response = errorResponse("invalid_payload", 400);
  const body = await response.json();
  const serialized = JSON.stringify(body);

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "invalid_payload");
  assert.equal(body.error.message, "Revisa la informacion e intenta de nuevo.");

  for (const marker of [
    "invalid_general_experience",
    "customer_phone_requires_consent",
    "public-input-token",
    "private customer comment",
    "+52 55 1000 1000",
    "source_mismatch",
    "token_required",
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked marker: ${marker}`);
  }
});
