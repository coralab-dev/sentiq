import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const stripAccents = (value) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const expectedMessages = [
  "El enlace no es válido.",
  "Método no permitido.",
  "Intenta de nuevo más tarde.",
  "Revisa la información e intenta de nuevo.",
  "No tienes acceso a esta sección.",
  "Ocurrió un error inesperado.",
];

test("public error messages use correct Spanish accentuation", async () => {
  const source = await readFile(
    path.join(root, "src/config/error-messages.ts"),
    "utf8",
  );

  for (const expected of expectedMessages) {
    assert.match(source, new RegExp(expected));
  }

  for (const forbidden of expectedMessages.map(stripAccents)) {
    assert.doesNotMatch(source, new RegExp(forbidden));
  }
});
