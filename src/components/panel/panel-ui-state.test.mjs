import assert from "node:assert/strict";
import test from "node:test";

import {
  getSelectedItemId,
  getVisibleFilterChips,
} from "./panel-ui-state.ts";

test("conserva una seleccion solicitada cuando sigue visible", () => {
  assert.equal(
    getSelectedItemId("response-b", ["response-a", "response-b"]),
    "response-b",
  );
});

test("descarta una seleccion que ya no coincide con los resultados", () => {
  assert.equal(getSelectedItemId("response-c", ["response-a", "response-b"]), null);
  assert.equal(getSelectedItemId(null, ["response-a"]), null);
});

test("muestra solo filtros distintos a sus valores predeterminados", () => {
  assert.deepEqual(
    getVisibleFilterChips(
      {
        branchId: "branch-a",
        source: "qr",
        alert: "all",
      },
      {
        branchId: "all",
        source: "all",
        alert: "all",
      },
      {
        branchId: (value) => (value === "branch-a" ? "Sucursal Centro" : value),
        source: (value) => (value === "qr" ? "Origen: QR" : value),
        alert: (value) => value,
      },
    ),
    [
      { key: "branchId", label: "Sucursal Centro" },
      { key: "source", label: "Origen: QR" },
    ],
  );
});
