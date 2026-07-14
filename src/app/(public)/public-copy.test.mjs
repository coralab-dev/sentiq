import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

async function readSource(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("public device thank-you copy describes the survey reset", async () => {
  const source = await readSource("src/components/feedback/thank-you-message.tsx");

  assert.match(
    source,
    /La encuesta se reiniciará automáticamente en unos segundos\./
  );
  assert.doesNotMatch(source, /Esta pantalla se cerrará automáticamente/);
  assert.doesNotMatch(source, /Esta pantalla se cerrara automaticamente/);
});

test("login public copy does not expose internal roles or route names", async () => {
  const source = await readSource("src/app/(auth)/login/page.tsx");

  for (const forbidden of [
    "platform_admin",
    "restaurant_admin",
    "manager",
    "/app/dashboard",
    "/platform-admin/restaurantes",
  ]) {
    assert.doesNotMatch(source, new RegExp(forbidden.replaceAll("/", "\\/")));
  }
});

test("login uses the editorial access portal without unsupported flows", async () => {
  const source = await readSource("src/app/(auth)/login/page.tsx");

  assert.match(source, /hero-restaurant-editorial\.webp/);
  assert.match(source, /Volver a SentiQ/);
  assert.match(source, /Mostrar contraseña/);

  for (const unsupported of [
    "Crear cuenta",
    "Regístrate",
    "Recuperar contraseña",
    "Olvidaste tu contraseña",
  ]) {
    assert.doesNotMatch(source, new RegExp(unsupported, "i"));
  }
});

test("privacy page is oriented to a controlled pilot", async () => {
  const source = await readSource("src/app/(public)/privacidad/page.tsx");

  assert.match(source, /piloto controlado/i);
  assert.match(source, /hasta cinco meses después de su cierre/);
  assert.match(source, /plazo máximo de tres meses/);
  assert.doesNotMatch(source, /demo controlada/i);
});

test("landing only presents verified SentiQ capabilities", async () => {
  const source = await readSource("src/app/(public)/page.tsx");

  for (const expected of [
    "Escucha mejor.",
    "Decide más rápido.",
    "QR",
    "dispositivo",
    "Respuestas",
    "Alertas",
    "seguimiento",
    'href="/login"',
    'href="/privacidad"',
  ]) {
    assert.match(source, new RegExp(expected, "i"));
  }

  for (const unsupported of [
    "Feedback para restaurantes, sin ruido",
    "inteligencia artificial",
    "generado por IA",
    "prueba gratis",
    "2,500",
    "98%",
    "testimonio",
    "nuestros clientes",
  ]) {
    assert.doesNotMatch(source, new RegExp(unsupported, "i"));
  }
});

test("landing hero and product scenes use the refined editorial direction", async () => {
  const source = await readSource("src/app/(public)/page.tsx");

  assert.match(source, /hero-restaurant-editorial\.webp/);
  assert.match(source, /Actividad reciente/);
  assert.match(source, /Captura en mesa/);
  assert.doesNotMatch(source, /Cada visita deja una señal\./);
  assert.doesNotMatch(source, /Tu experiencia/);
});
