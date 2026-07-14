export type SettingsNavigationItem = {
  label: string;
  href: string;
  description: string;
};

export type SettingsNavigationGroup = {
  label: string;
  items: readonly SettingsNavigationItem[];
};

export const settingsNavigationGroups: readonly SettingsNavigationGroup[] = [
  {
    label: "Restaurante",
    items: [
      { label: "Cuenta", href: "/app/configuracion/cuenta", description: "Plan, estado y datos generales." },
      { label: "Encuesta", href: "/app/configuracion/preguntas", description: "Textos, preguntas y vista previa." },
    ],
  },
  {
    label: "Captura",
    items: [
      { label: "Códigos QR", href: "/app/configuracion/qr", description: "Enlaces públicos por sucursal." },
      { label: "Dispositivos", href: "/app/configuracion/dispositivos", description: "Equipos y enlaces de captura." },
      { label: "Zonas", href: "/app/configuracion/zonas", description: "Áreas operativas por sucursal." },
    ],
  },
  {
    label: "Equipo",
    items: [
      { label: "Usuarios", href: "/app/configuracion/usuarios", description: "Gerentes y alcance por sucursal." },
      { label: "Meseros", href: "/app/configuracion/meseros", description: "Registros internos del equipo." },
    ],
  },
] as const;

export function isSettingsRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
