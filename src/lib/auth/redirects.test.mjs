import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const moduleCache = new Map();

function loadTsModule(filePath) {
  const resolvedPath = path.resolve(filePath);
  const cached = moduleCache.get(resolvedPath);
  if (cached) return cached.exports;

  const source = readFileSync(resolvedPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const loadedModule = { exports: {} };
  moduleCache.set(resolvedPath, loadedModule);

  function localRequire(specifier) {
    if (specifier.startsWith("@/")) {
      return loadTsModule(path.join(rootDir, "src", `${specifier.slice(2)}.ts`));
    }

    if (specifier.startsWith(".")) {
      return loadTsModule(path.resolve(path.dirname(resolvedPath), `${specifier}.ts`));
    }

    throw new Error(`Unsupported test import: ${specifier}`);
  }

  const evaluate = new Function("require", "module", "exports", output);
  evaluate(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const { ROUTES } = loadTsModule(path.join(rootDir, "src/config/routes.ts"));
const { getUnauthorizedRedirect } = loadTsModule(path.join(rootDir, "src/lib/auth/redirects.ts"));

test("permite platform_admin en rutas platform", () => {
  assert.equal(getUnauthorizedRedirect("platform_admin", ROUTES.PLATFORM_ADMIN_RESTAURANTS), null);
});

test("redirige usuarios restaurante desde platform admin al dashboard", () => {
  assert.equal(getUnauthorizedRedirect("restaurant_admin", ROUTES.PLATFORM_ADMIN), ROUTES.APP_DASHBOARD);
  assert.equal(getUnauthorizedRedirect("manager", ROUTES.PLATFORM_ADMIN_RESTAURANTS), ROUTES.APP_DASHBOARD);
});

test("redirige platform_admin fuera de app restaurante a restaurantes", () => {
  assert.equal(getUnauthorizedRedirect("platform_admin", ROUTES.APP_DASHBOARD), ROUTES.PLATFORM_ADMIN_RESTAURANTS);
});

test("mantiene acceso restaurante permitido y bloqueos de manager", () => {
  assert.equal(getUnauthorizedRedirect("restaurant_admin", ROUTES.APP_DASHBOARD), null);
  assert.equal(getUnauthorizedRedirect("manager", ROUTES.APP_SETTINGS), ROUTES.APP_NO_ACCESS);
});

test("redirige rol nulo a login", () => {
  assert.equal(getUnauthorizedRedirect(null, ROUTES.PLATFORM_ADMIN), ROUTES.LOGIN);
});
