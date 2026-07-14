export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type PublicErrorCode =
  | "invalid_method"
  | "invalid_payload"
  | "invalid_token"
  | "inactive_link"
  | "inactive_restaurant"
  | "inactive_branch"
  | "inactive_device"
  | "rate_limited"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "server_error";

const PUBLIC_ERROR_MESSAGES: Record<PublicErrorCode, string> = {
  invalid_method: "Metodo no permitido.",
  invalid_payload: "Revisa la informacion e intenta de nuevo.",
  invalid_token: "El enlace no es valido.",
  inactive_link: "Este enlace ya no esta disponible.",
  inactive_restaurant: "Este restaurante no esta disponible.",
  inactive_branch: "Esta sucursal no esta disponible.",
  inactive_device: "Este dispositivo no esta disponible.",
  rate_limited: "Intenta de nuevo mas tarde.",
  unauthorized: "Inicia sesion para continuar.",
  forbidden: "No tienes acceso a esta seccion.",
  not_found: "No encontramos lo que buscas.",
  server_error: "No pudimos procesar la solicitud. Intenta de nuevo mas tarde.",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Connection": "keep-alive",
    },
  });
}

export function errorResponse(code: PublicErrorCode, status: number): Response {
  return jsonResponse({ ok: false, error: { code, message: PUBLIC_ERROR_MESSAGES[code] } }, status);
}

export async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return null;
}
