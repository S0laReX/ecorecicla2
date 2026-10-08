# US 9 · Confirmación de recolecciones y puntos

Sprint 2, épica 4. Se apoya en las reservas de US 8. Implementación web y móvil responsive en la misma aplicación Next.js.

## Comportamiento

- La empresa activa, aprobada y dueña de la reserva confirma desde `/agenda`.
- La ventana comienza a la hora reservada (`scheduledAt`) y termina al final del horario publicado de ese día (`expiresAt`). Se interpreta en **America/La_Paz**, y se persiste en UTC. Ejemplo: reserva lunes 16:30 dentro de lunes 16:00–18:00 permite confirmar desde 16:30 hasta 18:00, inclusive.
- El servidor usa el reloj de MySQL. No acepta puntos, estados ni fechas suministrados por el cliente en la confirmación.
- La reserva y la publicación pasan a confirmadas y se registra `confirmedAt` junto con dos premios, todo en una transacción. No hay confirmación doble ni foto adicional.
- Cada parte recibe provisionalmente **10 puntos por recolección**, no por kilogramo. El usuario aprobó este valor para los cinco materiales. Las entradas independientes por material están en `backend/src/constants/materialPoints.js`; una modificación futura no altera los premios ya registrados.
- `CollectionPointAward` es el registro acumulativo de puntos. La suma de sus filas por destinatario es el puntaje obtenido. Sus restricciones únicas impiden duplicar premios para una misma reserva. No se implementa todavía la configuración administrativa de US 12 ni un catálogo de recompensas.
- Una reserva vencida pasa a `VENCIDA`, devuelve su publicación a `disponible` y sale de la agenda. No genera puntos ni penalizaciones. La reserva se conserva como historial.
- No se puede confirmar antes de la hora acordada, después del vencimiento, ni si fue cancelada o ya confirmada. Si vence durante un intento de confirmar, se confirma la liberación en la base antes de devolver el error al cliente.

## Liberación automática y actualización

El backend ejecuta un barrido al arrancar y cada 30 segundos, procesando lotes de 100 hasta vaciar las reservas vencidas. También comprueba vencimientos al consultar agenda, exploración, publicaciones propias y al aceptar/cancelar. Si el servidor estuvo apagado, las reservas vencidas se reconcilian cuando vuelve a iniciar.

Agenda y Mis Publicaciones se actualizan cada 15 segundos mientras la pestaña esté visible, y al recuperar el foco. La empresa que confirma ve inmediatamente la confirmación y los puntos devueltos por el servidor. El botón de confirmar ocupa todo el ancho en móvil, conforme a la referencia Figma de agenda `15:4262`.

Las transacciones de confirmación, reserva y liberación reintentan hasta dos veces únicamente si MySQL detecta un interbloqueo; cada intento anterior se revierte. Errores de escritura de premios revierten también el estado de publicación y reserva.

## Base de datos

Migración aditiva `database/005_collection_confirmation.sql`:

- Tabla `CollectionPointAward` con UUID público, destinatario, reserva, puntos y fecha.
- Columnas `expiresAt`, `confirmedAt` y estados `CONFIRMADA`, `VENCIDA` en `CollectionReservation`.
- Índice para localizar vencimientos.

Ejecutar en cualquier otra instalación, antes de iniciar el backend actualizado:

```powershell
cd D:\EcoRecicla\backend
npm run migrate
```

El comando es repetible: detecta si la estructura ya existe y completa la fecha límite de las reservas activas de US 8. Si una reserva antigua tiene un horario imposible de interpretar, informa el problema para corregir ese dato, en lugar de inventar un horario. La migración ya se aplicó en esta instalación local.

## API

`POST /api/collections/reservations/:reservationUUID/confirm`

Requiere Bearer JWT y sesión vigente. Sin cuerpo, o `{}`. Respuesta:

```json
{"success":true,"message":"Recolección confirmada. Se otorgaron puntos a ambas partes.","data":{"reservationUUID":"UUID","publicationUUID":"UUID","publicationStatus":"confirmada","confirmedAt":"fecha UTC ISO 8601","publisherPoints":10,"collectorPoints":10}}
```

Errores seguros: 401 sesión inválida; 403 rol, aprobación o suspensión; 404 reserva ajena/inexistente; 409 horario prematuro/vencido o estado incompatible; 422 UUID o cuerpo inválido. Se conserva el contrato oficial y la auditoría sin credenciales ni SQL.

## Validación

```powershell
cd D:\EcoRecicla\backend
npm run typecheck
npm test
npm run test:confirmation
npm run test:reservations
npm run test:collections
npm run test:integration
cd ..\frontend
npm run typecheck
npm test
npm run build
```

Las integraciones crean bases temporales y las eliminan al terminar. `test:confirmation` cubre migración desde US 8, autorización, horario, cinco materiales, premios exactos, repetición, concurrencia, rollback por error del segundo premio, cancelación, vencimiento, suspensión y sesión revocada. Se verificó también el recorrido en navegador en escritorio y a 390 px, confirmando dos recolecciones sintéticas y comprobando sus puntos y estado en MySQL. Los datos temporales se eliminaron.

## Subida por partes

Se mantuvo la rama `santiago`; no se hicieron commits ni push.

1. **Backend, migración y pruebas:** cambios en `backend/` y `database/005_collection_confirmation.sql`. Mensaje sugerido: `feat(collections): confirmar recolecciones y otorgar puntos sin duplicados`.
2. **Frontend y documentación:** cambios en `frontend/`, este documento y `UI_FIGMA.md`. Mensaje sugerido: `feat(collections): confirmacion responsive y actualizacion de agenda`.

Revisar cada grupo con `git diff` antes de añadirlo. No incluir `.env`, claves, datos temporales ni archivos generados.
