# T-032 — Configuración de zonas

## Objetivo

Crear `/app/configuracion/zonas` para que `restaurant_admin` administre zonas operativas por sucursal. La pantalla permite consultar sucursales, zonas, dispositivos, estado de QR y gerentes disponibles por RLS; crear y editar zonas; y activar o desactivar zonas sin eliminar histórico.

## Fuentes de verdad

1. Linear: COR-101 / T-032.
2. Notion: modelo de restaurantes, sucursales y zonas; Wireframe 15; arquitectura de rutas de Fase 2.
3. Alcance y decisiones aprobadas en esta conversación.
4. Código y patrones existentes de SentiQ.

El apoyo visual basado en `linear.app` solo orienta layout y jerarquía. No agrega requisitos.

## Alcance funcional

- Listar las sucursales visibles por RLS.
- Mostrar por sucursal: estado, cantidad de zonas, cantidad de dispositivos, QR activo o sin QR y gerentes asignados cuando estén disponibles.
- Mostrar las zonas de la sucursal seleccionada y sus dispositivos asociados.
- Crear una zona eligiendo sucursal, nombre y descripción opcional.
- Editar únicamente nombre y descripción; la sucursal se muestra como contexto no editable.
- Activar o desactivar zonas. No eliminar zonas.
- Advertir antes de desactivar una zona con dispositivos activos; no reasignarlos automáticamente.
- Mostrar estados vacíos cuando no existan sucursales o zonas.

## Fuera de alcance

- CRUD de sucursales o una ruta separada de sucursales.
- Eliminar zonas o sucursales.
- Crear, editar, asignar o desactivar gerentes.
- Cambiar sucursal de una zona.
- Cambiar tokens de QR o dispositivos.
- Mapas, heatmaps, analytics o reportes por zona.
- API Routes, RPC o Edge Functions nuevas.

## Autorización y seguridad

- El guard existente permite la pantalla solo a `restaurant_admin`.
- `manager` no recibe navegación de Configuración y al acceder a la ruta debe terminar en `/app/sin-acceso`.
- RLS continúa siendo la seguridad efectiva de datos.
- Las consultas a `survey_links` seleccionan únicamente `id`, `branch_id`, `device_id`, `type`, `status`, `token_last4`, `regenerated_at` y `last_used_at`.
- Nunca se consulta ni expone `token_hash` o un token completo.
- Las inserciones derivan `restaurant_id` de la sucursal visible seleccionada; no aceptan un restaurante arbitrario del formulario.

## Arquitectura

La ruta usa una página delgada que renderiza un cliente React, siguiendo el patrón de las pantallas existentes de Configuración. `zones-settings-data.ts` contiene tipos acotados, consultas, combinación de resultados, validaciones y construcción de payloads; el componente cliente gestiona selección, modales, estados de carga y mutaciones.

Se ejecutan consultas paralelas independientes para `branches`, `zones`, `devices` y `survey_links`. Estas cuatro fuentes forman la carga principal: un error bloquea la vista y ofrece reintento. La lectura de `manager_branch_assignments` y `user_profiles` es una carga separada, tolerante a fallos y nunca bloquea sucursales o zonas.

No se usa un select relacional anidado porque aislar las consultas mantiene predecible el comportamiento parcial bajo RLS. No se crea RPC porque la agregación es pequeña y específica de UI.

## Modelo de datos

Se agrega `zones.description text null` mediante una migración creada con Supabase CLI. Se actualizan los tipos generados correspondientes a `zones.Row`, `zones.Insert` y `zones.Update`.

Campos consultados:

- `branches`: `id`, `restaurant_id`, `name`, `slug`, `address`, `status`, `created_at`, `updated_at`.
- `zones`: `id`, `restaurant_id`, `branch_id`, `name`, `description`, `status`, `created_at`, `updated_at`.
- `devices`: `id`, `branch_id`, `zone_id`, `name`, `status`, `last_used_at`.
- `survey_links`: metadatos seguros definidos en la sección de seguridad.
- `manager_branch_assignments` y `user_profiles`: identificadores de asociación, nombre y email disponibles por RLS.

La combinación produce una vista por sucursal con resumen, gerentes y zonas; cada zona incluye sus dispositivos asociados.

## Interfaz

La pantalla usa un layout maestro–detalle responsive:

- El maestro lista sucursales y sus métricas resumidas.
- El detalle muestra cabecera y contexto de la sucursal activa, seguido por sus zonas.
- En pantallas estrechas, ambos bloques se apilan y el selector de sucursal permanece antes del detalle.

La referencia visual de Linear se limita a densidad compacta, bordes discretos, jerarquía tipográfica y acciones contenidas. Se conservan el tema claro, el acento teal, los componentes compartidos y el lenguaje visual actual de SentiQ.

## Formularios

Un modal centrado reutilizable cubre creación y edición.

Crear:

- Sucursal requerida y seleccionable.
- Nombre requerido después de `trim`.
- Descripción opcional; se guarda con `trim` o `null` si queda vacía.
- `restaurant_id` deriva de la sucursal seleccionada.
- Estado inicial `active`.

Editar:

- Sucursal mostrada como texto de contexto, no editable.
- Nombre requerido después de `trim`.
- Descripción opcional normalizada a texto recortado o `null`.
- Actualiza `updated_at` con la hora actual.

## Activación y desactivación

El cambio alterna entre `active` e `inactive` y actualiza `updated_at`. La acción requiere confirmación. Si la zona tiene dispositivos activos, la confirmación muestra: “Esta zona tiene dispositivos asignados. Desactivarla no elimina histórico, pero puede afectar la organización operativa.” No se modifican ni reasignan dispositivos.

## Gerentes en modo degradado

Cuando asignaciones y perfiles están disponibles por RLS, se muestran nombre y email por sucursal. Si la consulta falla, RLS no expone datos o el resultado viene vacío, la sección muestra “Información no disponible” o “Sin información disponible”. Este estado no bloquea la carga principal y no ofrece acciones de administración.

## Estados y errores

- Carga principal: indicador de carga y error recuperable con reintento.
- Sin sucursales: estado vacío a nivel de página.
- Sucursal sin zonas: estado vacío dentro del detalle.
- Guardado o cambio de estado: controles bloqueados mientras la operación está activa.
- Mutaciones: mensajes concretos de éxito o error sin descartar datos ya cargados.
- Gerentes: degradación local sin convertir la página en error.

## Pruebas

`zones-settings-data.test.mjs` cubre:

- Agrupación de zonas y dispositivos por sucursal.
- Selección del estado QR usando solo metadatos seguros.
- Gerentes disponibles y estado no disponible.
- Estado vacío de zonas.
- Validación de sucursal y nombre requeridos.
- Rechazo de sucursal no visible.
- Normalización con `trim` y descripción vacía a `null`.
- Payload de creación con `restaurant_id` derivado.
- Payload de edición limitado a nombre, descripción y `updated_at`.

La aceptación exige ejecutar el test específico, `pnpm lint`, `pnpm typecheck` y `pnpm build`, y revisar que el diff no contenga cambios no relacionados.

## Archivos previstos

- Crear `src/app/(restaurant)/app/configuracion/zonas/page.tsx`.
- Crear `src/app/(restaurant)/app/configuracion/zonas/zones-settings-client.tsx`.
- Crear `src/app/(restaurant)/app/configuracion/zonas/zones-settings-data.ts`.
- Crear `src/app/(restaurant)/app/configuracion/zonas/zones-settings-data.test.mjs`.
- Crear una migración `add_zone_description` mediante Supabase CLI.
- Modificar `src/types/supabase.ts` únicamente en la definición de `zones`.
- Modificar `src/app/(restaurant)/app/configuracion/page.tsx` para marcar Zonas como disponible.

No se crea una card de Sucursales ni se modifica la navegación para managers.
