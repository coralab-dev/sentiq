import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const mojibakeOperation = String.fromCodePoint(0x00c3, 0x00b3);

async function readSources(relativePaths) {
  const contents = await Promise.all(
    relativePaths.map((relativePath) => readFile(path.join(root, relativePath), "utf8")),
  );
  return contents.join("\n");
}

test("restaurant UI uses accented operational labels", async () => {
  const source = await readSources([
    "src/app/(restaurant)/app/dashboard/dashboard-client.tsx",
    "src/app/(restaurant)/app/respuestas/responses-client.tsx",
    "src/app/(restaurant)/app/exportar/export-client.tsx",
    "src/app/(restaurant)/app/configuracion/cuenta/account-settings-client.tsx",
    "src/components/layout/app-shell.tsx",
    "src/lib/auth/permissions.ts",
  ]);

  for (const expected of [
    "Operación",
    "Atención recibida",
    "Última actualización",
    "Calificación",
    "Teléfono",
    "Más filtros",
    "Página",
    "Configuración",
    "exportación",
  ]) {
    assert.match(source, new RegExp(expected, "i"));
  }
});

test("restaurant UI rejects the known unaccented operational copy", async () => {
  const source = await readSources([
    "src/app/(restaurant)/app/dashboard/dashboard-client.tsx",
    "src/app/(restaurant)/app/respuestas/responses-client.tsx",
    "src/app/(restaurant)/app/exportar/export-client.tsx",
    "src/app/(restaurant)/app/configuracion/cuenta/account-settings-client.tsx",
    "src/components/layout/app-shell.tsx",
    "src/lib/auth/permissions.ts",
  ]);

  for (const forbidden of [
    `Operaci${mojibakeOperation}n`,
    "Calificacion",
    "Telefono",
    "Con telefono consentido",
    "Sin telefono",
    "por pagina",
    "Pagina",
    "Configuracion",
    "Cargando exportacion",
    "Los filtros enviados no son validos",
    "Tu sesion no esta autorizada",
  ]) {
    assert.doesNotMatch(source, new RegExp(forbidden));
  }
});
