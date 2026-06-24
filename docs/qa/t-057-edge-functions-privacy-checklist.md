# T-057 - Checklist QA Edge Functions y privacidad

## Alcance

Este checklist cubre las Edge Functions registradas en `src/config/edge-functions.ts` antes de demo. El objetivo es validar metodos permitidos, CORS/OPTIONS, JWT, payloads, permisos por rol, alcance por restaurante/sucursal/dispositivo, errores controlados, respuesta minima, privacidad y rate limiting donde aplica.

No cambia contratos, rutas publicas ni funciones existentes. Las rutas publicas oficiales siguen siendo `/s/:token` y `/d/:token`.

## Funciones cubiertas

- `get_public_survey_config`
- `submit_feedback`
- `create_restaurant`
- `create_restaurant_admin`
- `get_platform_activity_summary`
- `update_restaurant_account`
- `create_manager_user`
- `regenerate_qr_token`
- `regenerate_device_token`
- `update_alert_status`
- `export_feedback_csv`

## Criterios globales

- OPTIONS responde sin ejecutar logica de negocio.
- Metodo distinto de POST devuelve error controlado.
- Las funciones administrativas requieren JWT.
- Las funciones publicas aceptan anon key sin sesion cuando el payload/token es valido.
- Payload invalido devuelve error controlado.
- El rol requerido se valida dentro de la Edge Function.
- El scope por restaurante, sucursal, dispositivo o link se valida antes de mutar datos.
- La respuesta es minima y no incluye errores tecnicos internos.
- No se expone `service_role`, `service_role_key`, `token_hash`, `raw_ip` ni `ip_address`.
- No se expone token completo salvo URL/token inmediato en creacion o regeneracion.
- No se exponen telefonos, comentarios ni respuestas individuales a `platform_admin` por defecto.
- `submit_feedback` valida rate limiting publico.

## Matriz por funcion

| Funcion | Metodo/OPTIONS | JWT | Payload | Rol/scope | Privacidad | Rate limit | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `get_public_survey_config` | Script valida OPTIONS y GET | Publica con anon key | Script valida token ausente/invalido | Token resuelve restaurante/sucursal/link activos | Script valida respuesta publica sin IDs internos, hash, telefono ni usuarios | No aplica | Ejecutable |
| `submit_feedback` | Script valida OPTIONS y GET | Publica con anon key | Script valida scores, telefono sin consentimiento y comentario largo | Token y `source` deben coincidir | Script valida respuesta minima; `response_id` permitido por contrato actual | Script fuerza multiples envios QR hasta 429 | Ejecutable |
| `create_restaurant` | Script valida OPTIONS y GET | Requerido | Script valida payload invalido | Solo `platform_admin` | Script valida que no exponga secretos/hash/token crudo | No aplica | Ejecutable |
| `create_restaurant_admin` | Script valida OPTIONS y GET | Requerido | Script valida payload invalido | Solo `platform_admin`; restaurante activo por QA dedicado | Script valida respuesta minima sin password | No aplica | Ejecutable |
| `get_platform_activity_summary` | Script valida OPTIONS y GET | Requerido | Script valida payload via QA dedicado | Solo `platform_admin` | Script valida solo agregados, sin `response_id`, telefono ni comentario | No aplica | Ejecutable |
| `update_restaurant_account` | Script valida OPTIONS y GET | Requerido | Script valida payload via QA dedicado | Solo `platform_admin` | Script valida respuesta minima | No aplica | Ejecutable |
| `create_manager_user` | Script valida OPTIONS y GET | Requerido | Script valida payload invalido | `restaurant_admin` de su restaurante; manager bloqueado si hay credenciales | Script valida respuesta minima sin password ni service role | No aplica | Ejecutable |
| `regenerate_qr_token` | Script valida OPTIONS y GET | Requerido | Script valida UUID y exclusividad `branch_id`/`survey_link_id` | `platform_admin`/`restaurant_admin`; manager bloqueado si hay credenciales | Script valida URL inmediata y que el token anterior deje de funcionar | No aplica | Ejecutable |
| `regenerate_device_token` | Script valida OPTIONS y GET | Requerido | Script valida UUID | `restaurant_admin`/`platform_admin`; manager bloqueado si hay credenciales y device | Script valida URL inmediata y carga publica si existe device activo | No aplica | Ejecutable con fixture device |
| `update_alert_status` | Script valida OPTIONS y GET | Requerido | Script valida payload invalido | Admin/manager segun alerta configurada | Script valida respuesta minima sin telefono/comentario | No aplica | Ejecutable con fixtures de alertas |
| `export_feedback_csv` | Script valida OPTIONS y GET | Requerido | Script valida rango invalido | `restaurant_admin`/manager; `platform_admin` bloqueado | Script valida que platform no exporta respuestas por defecto | No aplica | Ejecutable |

## Casos criticos

La demo no debe avanzar si se confirma cualquiera de estos casos:

- Acceso cruzado entre restaurantes.
- Manager opera sucursal no asignada.
- `platform_admin` ve respuestas individuales, telefonos o comentarios por defecto.
- Funcion administrativa acepta llamada sin JWT.
- Funcion publica devuelve `token_hash`, secretos o datos internos.
- Token anterior sigue funcionando despues de regeneracion.
- Rate limiting de `submit_feedback` no funciona.
- Error tecnico, stack trace o detalle interno visible al cliente final.

## Resultado de ejecucion

Comando principal:

```bash
pnpm qa:edge-functions-privacy
```

El script carga `.env` y `.env.local`, usa anon key y credenciales QA/demo existentes, crea datos aislados con prefijo `QA T057`, imprime `PASS`, `FAIL` y `SKIPPED`, y lista IDs creados al final. Los casos de manager, alertas y device pueden quedar `SKIPPED` si no existen credenciales o fixtures configuradas.

Ultima ejecucion local:

- `pnpm qa:edge-functions-privacy`: 41 PASS, 0 FAIL, 1 SKIPPED.
- SKIPPED: `update_alert_status` admin attends configured pending alert. Motivo: `QA_ALLOWED_ALERT_ID` ya estaba en estado `attended`, no `pending`.
- Datos QA creados por la ultima ejecucion:
  - Restaurante: `84d505e1-0193-4d8f-85fa-1e1698d1c4d6`
  - Sucursal: `ec2fc27e-05f1-4acb-8cb3-5bb3148f25d3`
  - QR link: `7b19d9c5-48b4-49bd-9689-4b25b0c618cc`
  - Manager: `8f0d1ca1-0873-4a2d-81a3-a595d297ab8b`

Comandos complementarios recomendados:

```bash
pnpm qa:create-restaurant
pnpm qa:create-restaurant-admin
pnpm qa:create-manager-user
pnpm qa:update-alert-status
pnpm qa:get-platform-activity-summary
pnpm qa:update-restaurant-account
pnpm lint
pnpm typecheck
pnpm build
git diff --check
```

## Hallazgos

- `submit_feedback` devuelve `response_id` por contrato actual. El script lo permite solo para esa funcion.
- `get_public_survey_config` aparece con `verify_jwt=true` en Supabase, pero debe validarse por flujo real anon. El script invoca la funcion publica con anon key y sin sesion de usuario.
- `regenerate_device_token` necesita un device activo visible para probar regeneracion completa; si no existe, el script marca el caso como `SKIPPED`.
- `update_alert_status` necesita `QA_ALLOWED_ALERT_ID` y `QA_FORBIDDEN_ALERT_ID` para validar mutacion real y bloqueo manager; si no existen, el script marca esos casos como `SKIPPED`.

## Decision de avance a demo

T-057 se puede cerrar cuando:

- `pnpm qa:edge-functions-privacy` corre y no reporta `FAIL`.
- Los `SKIPPED`, si existen, estan justificados por falta de fixtures y no por errores de seguridad.
- Los QA complementarios pasan o sus precondiciones faltantes quedan documentadas.
- No hay hallazgos criticos de acceso cruzado, datos de mas, token persistido expuesto, service role expuesto, rate limiting ausente o errores tecnicos visibles.
