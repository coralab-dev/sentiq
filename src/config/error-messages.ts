export const PUBLIC_ERROR_MESSAGES = {
  invalid_token: "El enlace no es valido.",
  invalid_method: "Metodo no permitido.",
  inactive_link: "Este enlace ya no está disponible.",
  inactive_restaurant: "Este restaurante no está disponible.",
  inactive_branch: "Esta sucursal no está disponible.",
  inactive_device: "Este dispositivo no está disponible.",
  rate_limited: "Intenta de nuevo mas tarde.",
  invalid_payload: "Revisa la informacion e intenta de nuevo.",
  server_error: "No pudimos procesar la solicitud. Intenta de nuevo mas tarde.",
  unauthorized: "Inicia sesión para continuar.",
  forbidden: "No tienes acceso a esta seccion.",
  not_found: "No encontramos lo que buscas.",
  unknown_error: "Ocurrio un error inesperado. Intenta de nuevo mas tarde.",
} as const;

export type PublicErrorCode = keyof typeof PUBLIC_ERROR_MESSAGES;

export function getPublicErrorMessage(code: PublicErrorCode): string {
  return PUBLIC_ERROR_MESSAGES[code];
}
