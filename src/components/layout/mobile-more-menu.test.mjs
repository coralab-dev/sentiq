import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

async function readSource(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("mobile more menu is a controlled accessible dialog trigger", async () => {
  const [shell, menu] = await Promise.all([
    readSource("src/components/layout/app-shell.tsx"),
    readSource("src/components/layout/mobile-more-menu.tsx"),
  ]);

  assert.match(shell, /<MobileMoreMenu\b/);
  assert.doesNotMatch(shell, /role="dialog"/);
  assert.match(menu, /<Dialog\.Root/);
  assert.match(menu, /<Dialog\.Trigger/);
  assert.match(menu, /<Dialog\.Portal/);
  assert.match(menu, /<Dialog\.Backdrop/);
  assert.match(menu, /<Dialog\.Popup/);
  assert.match(menu, /<Dialog\.Title/);
  assert.match(menu, /<Dialog\.Close/);
  assert.match(menu, /Más opciones/);
  assert.match(menu, /safe-area-inset-bottom/);
});
