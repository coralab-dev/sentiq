import assert from "node:assert/strict";
import test from "node:test";

import { resolveCaptureSurveyToken } from "./capture-survey-token.ts";

test("keeps query token priority over pathname fallback", () => {
  const token = resolveCaptureSurveyToken({
    queryToken: "query-token",
    pathname: "/s/path-token",
    routePrefix: "s",
  });

  assert.equal(token, "query-token");
});

test("extracts QR token from /s/:token pathname", () => {
  const token = resolveCaptureSurveyToken({
    queryToken: null,
    pathname: "/s/path-token",
    routePrefix: "s",
  });

  assert.equal(token, "path-token");
});

test("extracts device token from /d/:token pathname", () => {
  const token = resolveCaptureSurveyToken({
    queryToken: null,
    pathname: "/d/device-token",
    routePrefix: "d",
  });

  assert.equal(token, "device-token");
});

test("decodes encoded pathname token safely", () => {
  const token = resolveCaptureSurveyToken({
    queryToken: null,
    pathname: "/s/token%2Bwith%2Fencoded",
    routePrefix: "s",
  });

  assert.equal(token, "token+with/encoded");
});

test("returns null when decodeURIComponent fails", () => {
  const token = resolveCaptureSurveyToken({
    queryToken: null,
    pathname: "/s/%E0%A4%A",
    routePrefix: "s",
  });

  assert.equal(token, null);
});

test("returns null when pathname does not match the route prefix", () => {
  const token = resolveCaptureSurveyToken({
    queryToken: null,
    pathname: "/d/device-token",
    routePrefix: "s",
  });

  assert.equal(token, null);
});
