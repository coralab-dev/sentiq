import assert from "node:assert/strict";
import test from "node:test";

import {
  isSettingsRouteActive,
  settingsNavigationGroups,
} from "./settings-navigation.ts";

test("agrupa la configuración por restaurante, captura y equipo", () => {
  assert.deepEqual(
    settingsNavigationGroups.map((group) => ({
      label: group.label,
      items: group.items.map((item) => item.label),
    })),
    [
      { label: "Restaurante", items: ["Cuenta", "Encuesta"] },
      { label: "Captura", items: ["Códigos QR", "Dispositivos", "Zonas"] },
      { label: "Equipo", items: ["Usuarios", "Meseros"] },
    ],
  );
});

test("marca activa una subsección sin activar rutas hermanas", () => {
  assert.equal(
    isSettingsRouteActive("/app/configuracion/dispositivos", "/app/configuracion/dispositivos"),
    true,
  );
  assert.equal(
    isSettingsRouteActive("/app/configuracion/dispositivos/nuevo", "/app/configuracion/dispositivos"),
    true,
  );
  assert.equal(
    isSettingsRouteActive("/app/configuracion/qr", "/app/configuracion/dispositivos"),
    false,
  );
});
