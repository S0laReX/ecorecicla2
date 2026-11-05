# Premios y ranking mensual

## Reglas de puntos

Los puntos siguen otorgándose mediante el flujo existente de confirmación de recolecciones y la configuración del administrador por material. `CollectionPointAward` conserva el historial de puntos ganados.

Para los usuarios, el saldo disponible es la suma de puntos obtenidos menos el costo de todos sus canjes. Registrar una entrega no vuelve a descontar puntos. El perfil mantiene su indicador histórico de puntos acumulados; el catálogo muestra por separado el saldo disponible y el total canjeado.

Solo cuentas `USER` activas pueden ver su catálogo, consultar sus canjes y canjear. Las cuentas `COMPANY` y `ADMIN` no pueden canjear, incluso si llaman directamente a la API.

## Administración de premios

Cada producto tiene nombre, descripción o condiciones de entrega, costo entero entre 1 y 1 000 000 puntos, existencias entre 0 y 1 000 000 y visibilidad. Se puede ocultar un premio para detener los nuevos canjes. Los productos agotados siguen visibles con el botón deshabilitado.

Los canjes guardan el nombre y el costo del premio en el momento del intercambio. Las ediciones posteriores del producto no cambian esos registros. Cada canje reserva una unidad, genera un código UUID y queda pendiente de entrega. El administrador verifica el código y registra la entrega desde la misma pantalla.

Cada edición administrativa incluye la versión que se leyó del producto. Si otra edición o un canje cambió sus existencias, la edición se rechaza y hay que recargar el catálogo. Así se evita restablecer accidentalmente unidades ya canjeadas.

## Consistencia del canje

La sesión, el rol, la existencia y visibilidad del premio, el costo, el saldo, el descuento de stock y el registro del canje se verifican dentro de una transacción. El bloqueo de la cuenta serializa sus canjes; el bloqueo del premio protege la última unidad ante diferentes usuarios.

Cada solicitud incluye un `requestUUID` y el costo que el usuario confirmó (`expectedPointsCost`). El precio se obtiene del servidor y debe coincidir con el mostrado. Los reintentos de una misma solicitud devuelven el mismo canje, incluso después de ocultar o editar el premio, sin volver a descontar saldo o existencias. Reutilizar el código de solicitud con otro premio o costo se rechaza. El diálogo conserva el código de solicitud al reintentar un fallo.

## Ranking

Participan empresas aprobadas, activas y no eliminadas con puntos mayores a cero en el mes seleccionado. Se suman sus puntos como publicador y recolector, según la fecha de otorgamiento registrada en el historial.

El mes usa `America/La_Paz` (UTC−4): noviembre, por ejemplo, incluye desde el 1 de noviembre a las 04:00 UTC hasta antes del 1 de diciembre a las 04:00 UTC. Cada mes se consulta de forma independiente y no requiere borrar ni reiniciar los puntos acumulados.

El ranking ordena por puntos descendentes. Los empates comparten posición (`1, 1, 3`) y tienen un orden estable por nombre y UUID. La empresa puede ver su propia posición aunque quede fuera de la página actual. Se puede consultar el mes actual o meses anteriores con el selector.

## Endpoints

Todos requieren una sesión vigente y mantienen el contrato JSON existente de éxito/error.

| Método y ruta | Acceso | Función |
| --- | --- | --- |
| `GET /api/admin/rewards` | ADMIN | Catálogo completo paginado |
| `POST /api/admin/rewards` | ADMIN | Crear producto |
| `PUT /api/admin/rewards/:rewardUUID` | ADMIN | Editar producto incluyendo `version` |
| `GET /api/admin/redemptions` | ADMIN | Canjes paginados con usuario y estado |
| `POST /api/admin/redemptions/:redemptionUUID/deliver` | ADMIN | Registrar entrega, cuerpo `{}` |
| `GET /api/rewards` | USER | Catálogo visible y saldo propio |
| `POST /api/rewards/:rewardUUID/redeem` | USER | Canjear con `requestUUID` y `expectedPointsCost` |
| `GET /api/rewards/redemptions` | USER | Historial propio paginado |
| `GET /api/rankings/companies` | COMPANY aprobada, ADMIN | Ranking paginado y posición propia |

Los listados aceptan `page` y `limit` (máximo 50). Los canjes aceptan `status=ALL|PENDING|DELIVERED`. El ranking acepta `month=YYYY-MM` (2000–2099); si se omite, se consulta el mes actual en Bolivia. Los campos desconocidos se rechazan.

## Validación realizada — 5 de noviembre de 2026

- Tipado estricto del backend y compilación de producción del frontend: correctos.
- Pruebas del backend: 15 correctas. Pruebas de transporte del frontend: 4 correctas.
- Integración de premios y ranking: 12 escenarios correctos contra MySQL 8.4 en una base temporal aislada.
- Regresión de flujos existentes: 9 escenarios de confirmación, 8 de puntos por material y 9 de perfiles, todos correctos.
- Navegador con datos sintéticos: alta administrativa de producto, canje con saldo de 200 a 170, código de canje, entrega administrativa y estado entregado visible al usuario.
- Ranking verificado con posición propia, cambio de mes y mes sin puntos.
- Catálogo y ranking revisados a 390 px de ancho y en escritorio; sin desbordamiento horizontal de la página ni imágenes rotas en las vistas medidas.
- Migración repetida y preservación de datos comprobadas. Las bases temporales de integración y revisión visual se eliminaron al terminar.

## Integración con dev — 5 de noviembre de 2026

La rama `jhoel` incorpora `dev` hasta `9d9d4f2`. Los cambios de premios y ranking se reaplicaron sobre esa versión, conservando los avisos emergentes, el selector de disponibilidad, los límites de autenticación y las imágenes actualizadas. La pantalla administrativa de premios sigue el diseño de `dev`, con navegación centralizada y sin menú lateral duplicado.

Validación posterior: tipado del backend, compilación de producción del frontend, 16 pruebas de backend, 6 de frontend y 12 escenarios MySQL de premios y ranking, todos correctos.
