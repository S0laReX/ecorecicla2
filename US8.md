# US 8 · Aceptar y agendar una recolección

Sprint 2, épica 3. Fuente: `PRODUCT BACKLOG (EcoRecicla) (1).xlsx`, hoja `PRODUCT BACKLOG`, filas 94–101. Diseño: Figma `15:4262`, documentado en `UI_FIGMA.md`.

## Uso

Iniciar sesión con una empresa recolectora aprobada y activa. Desde Explorar, abrir el detalle de una publicación, indicar fecha y hora dentro de la disponibilidad publicada y confirmar. La ruta `/agenda` muestra las reservas activas y permite cancelar una que siga aceptada. Mis Publicaciones muestra el estado nuevo; la lista se vuelve a cargar al enfocarla o al actualizarla.

La disponibilidad que ya existía en la publicación es texto libre. Para validarla al agendar, debe nombrar uno o más días de la semana en español y un rango de horas de 24 horas, por ejemplo `Lunes a viernes de 09:00 a 17:00` o `Lunes de 16:00 a 18:00`. El backend valida el día y la hora en `America/La_Paz`; no acepta texto que no pueda interpretar ni horarios pasados o fuera del rango. El formulario de publicación indica este formato.

## API

- `POST /api/collections/publications/:publicationUUID/accept` con `{ "scheduledAt": "<fecha ISO 8601 con zona>" }`.
- `GET /api/collections/agenda?page=1&limit=6`.
- `POST /api/collections/reservations/:reservationUUID/cancel`.

Las tres rutas requieren sesión vigente y empresa aprobada. La verificación de sesión, rol, estado y propiedad se repite en el servicio dentro de la transacción. La aceptación bloquea la publicación y hace un cambio condicional de `disponible` a `aceptada`; un índice único en la base protege también contra doble aceptación. La cancelación cambia la reserva a `CANCELADA` y la publicación a `disponible` en la misma transacción. Las reservas canceladas se conservan.

Las respuestas siguen el contrato `{success,message,data}` y los errores `{success:false,message,errorCode,statusCode}`. El publicador conserva acceso al estado de su publicación mediante el endpoint existente de Mis Publicaciones. Aceptar no otorga puntos; eso corresponde a US9. No se incorpora chat ni ruteo.

## Validaciones

- UUID, cuerpo estricto, fecha ISO, fecha futura, día y hora dentro del rango publicado.
- Solo empresas activas y aprobadas pueden aceptar, ver agenda o cancelar.
- No reservar publicaciones propias, eliminadas, no disponibles o ya aceptadas.
- Una empresa solo puede cancelar su propia reserva activa y no puede cancelarla dos veces.
- Paginación de agenda limitada; los datos internos de usuario y credenciales no se exponen.
- Escenarios de concurrencia: dos aceptaciones para una publicación producen una aceptación y un conflicto.

## Verificación

```powershell
cd backend
npm run typecheck
npm test
npm run test:reservations

cd ../frontend
npm run typecheck
npm test
npm run build
```

`test:reservations` crea una base aleatoria `ecorecicla_test_<identificador>` y la elimina al terminar. La cuenta de base de datos necesita privilegios para crear y eliminar esa base temporal.
