# EcoRecicla — base del Sprint 1

Esta entrega implementa la tarea actual: DDL de US2/US4, alta de publicaciones MVC, Slice Redux, hook y Card. Incluye dependencias, ruta protegida, formulario responsive, esquemas, pruebas y configuración para integrar el código. **No equivale a completar las cinco historias del Sprint 1**: registro, emisión/renovación de tokens, logout, recuperación y endpoints HTTP de US5 siguen pendientes.

## Archivos principales

| Entrega | Ruta |
|---|---|
| DDL 3FN | `database/001_sprint1.sql` |
| Modelo | `backend/src/models/Publication.js` |
| Controlador | `backend/src/controllers/publicationController.js` |
| Slice | `frontend/src/features/publications/store/publicationSlice.ts` |
| Hook | `frontend/src/features/publications/hooks/useCreatePublication.ts` |
| Organismo | `frontend/src/features/publications/components/organisms/PublicationCard.tsx` |

## Decisiones y fuentes

La fuente vigente de requerimientos y cuestionario es `EcoRecicla_Requerimientos (1).docx`, proporcionada por el usuario en sustitución de los adjuntos anteriores de requerimientos/cuestionario. Se mantienen el backlog y ambos estándares técnicos. Se prioriza la solicitud explícita sobre las instrucciones incrustadas en los adjuntos. Los prompts operativos del manual no se ejecutaron como nuevas tareas. Los nombres de bases y sistemas MUYUPATH son ejemplos del documento, no dependencias de EcoRecicla.

La revisión de la fuente corregida confirma la verificación empresarial, la separación por roles y la edición/eliminación de publicaciones antes de ser aceptadas. También identifica requisitos aún no cubiertos por esta base: RUC/NIT y zona de cobertura obligatorios en registro empresarial, datos de contacto y materiales procesados; y ventanas horarias estructuradas para automatizar vencimientos en recolecciones. El DDL actual no incluye todavía esos datos empresariales y el horario de publicaciones sigue siendo texto. Esta actualización de referencias no implementa esos pendientes.

El documento excluye las notificaciones automáticas por correo; la recuperación de contraseña continúa exigida por la solicitud de US3 y su canal debe definirse al implementarla. Aunque el cuestionario no exige explícitamente foto y cantidad en su lista mínima de campos, la solicitud de US4 y el backlog sí las exigen, por lo que se mantienen obligatorias. Las validaciones de seguridad solicitadas también se mantienen. La descripción general de app móvil no cambia la elección explícita de Next.js responsive para este Sprint.

El backlog US4 permite publicar material propio a empresas pendientes. La solicitud bloquea su acceso al dashboard general, por lo que se permite `COMPANY/PENDING` en este endpoint, sin otorgar permisos para explorar o aceptar recolecciones. US3 deberá emitir una sesión restringida para ese caso; nunca confiar en la pantalla o en el perfil de localStorage para autorizar. Suspensión, rechazo y revocación impiden publicar. El rol ADMIN no publica.

Supuestos explícitos: cantidad expresada en kg, hasta tres decimales; horario como texto libre; tipos internos sin acento y etiquetas traducidas; foto obligatoria. Se aceptan JPEG/PNG/WebP estáticos hasta 5 MiB y 16 megapíxeles. Sharp decodifica y normaliza a JPEG sin metadatos, hasta 1280×1280 y 1 MiB. No se confía en la extensión ni el MIME del cliente.

Para mantener este corte autónomo, la foto normalizada se guarda en `Publication.photoJpeg` y viaja como `publicationPhotoDataUrl`. Esto mantiene foto y publicación en una sola transacción, sin archivos huérfanos ni URLs externas. Aumenta el tamaño JSON aproximadamente un tercio; al implementar listados, introducir miniaturas, paginación y un endpoint autenticado de medios o almacenamiento privado. Los documentos empresariales usan una clave privada de almacenamiento; su carga y validación pertenecen a US2, todavía no implementada.

La estructura incluye todos los subdirectorios pedidos para `auth`, `account`, `publications`, `circular-items` y `dashboard`. Los directorios vacíos son reservas arquitectónicas, no features implementados. Los componentes atómicos utilizados están dentro de `publications`; pueden extraerse a un sistema compartido cuando exista otro consumidor.

## Integración y ejecución

Requiere Node.js 22 o superior y MySQL 8.4. Importa el SQL en una base vacía seleccionada explícitamente; no contiene DROP ni credenciales. Usa una cuenta de migraciones para DDL y una cuenta de aplicación con privilegios mínimos sobre estas tablas. Configura TLS si MySQL está en otro host. Las tablas usan FK RESTRICT y no duplican nombres de roles ni datos del propietario. Los IDs numéricos son privados; las entidades tienen UUID público único generado con `crypto.randomUUID()`.

En `backend`, ejecuta `npm ci`, copia `.env.example` a `.env`, configura la conexión y la clave pública RSA del emisor de autenticación, y ejecuta `npm start`. En `frontend`, ejecuta `npm ci` y `npm run dev`. Next.js envía `/api/*` al backend en `127.0.0.1:4000`; `API_INTERNAL_ORIGIN` permite cambiar el destino interno. Publica ambos detrás de HTTPS. Configura límites de carga, tiempos y proxy confiable según la infraestructura; no activar `trust proxy` indiscriminadamente.

El token requerido es RS256, con `sub` igual al UUID público del usuario, `tokenVersion` entero, `iat`, `exp`, `iss` y `aud`. Duración máxima 1800 segundos. Se verifica firma, algoritmo, emisor, audiencia, expiración y duración. No hay endpoint de login de demostración ni tokens prefabricados. Una cuenta real creada por US2 debe existir en MySQL. El servicio lee rol, estado y versión de sesión actual en la base dentro de la transacción, bloqueando la fila hasta finalizar el alta. La suspensión y el incremento de `tokenVersion` deben actualizar la misma fila desde US3/administración.

El frontend lee `pdct.tokens.access` y declara también `pdct.tokens.refresh`, `pdct.user.uuid` y `pdct.profiles.active.type`. La expiración y los permisos los valida el servidor. US3 debe almacenar/rotar el refresh token, invalidarlo en logout y limpiar la sesión y el Slice. No hay renovación silenciosa en esta entrega. Mantener protección contra XSS y una CSP de producción compatible con Next.js: el almacenamiento solicitado permite que JavaScript acceda al token.

Al registrar, US2 debe asignar de forma interna `USER/NOT_REQUIRED` o `COMPANY/PENDING`; no aceptar ADMIN, APPROVED ni estados arbitrarios del cuerpo. La restricción SQL exige documento privado para COMPANY. Normalizar email, aplicar hashing robusto de contraseñas y validar el documento antes de persistir. El DDL almacena únicamente `passwordHash`, nunca contraseñas en claro.

## Contrato de alta

`POST /api/publications`, con `Authorization: Bearer <accessToken>` y `multipart/form-data`. Campos exactos: `materialType`, `quantityKg`, `locationText`, `availabilityText`, y archivo `photo`. El navegador genera el boundary; no fijar manualmente Content-Type. Campos adicionales, ownerId, UUID y estado enviados por el cliente se rechazan.

```json
{
  "success": true,
  "message": "Publicación creada correctamente.",
  "data": {
    "publicationUUID": "1e42065b-9fbc-47ad-925b-710b7c010a93",
    "publicationMaterialType": "plastico",
    "publicationQuantityKg": "2.125",
    "publicationLocationText": "Zona central",
    "publicationAvailabilityText": "Lunes 09:00–12:00",
    "publicationStatus": "disponible",
    "publicationPhotoDataUrl": "data:image/jpeg;base64,..."
  }
}
```

HTTP 201 en éxito. Error: `{"success":false,"message":"…","errorCode":"…","statusCode":422}`. HTTP 401 sesión inválida; 403 rol/cuenta bloqueados; 413 tamaño de carga; 422 validación; 429 límite de solicitudes; 500 error interno. No se exponen SQL, stack ni mensajes de drivers. Auditoría JSON a stderr con identificador generado por el servidor y metadatos permitidos; conectar el colector y la retención en infraestructura.

`create` y las mutaciones del modelo requieren una conexión transaccional. El servicio orquesta los modelos sin dependencias circulares. `findByUUID` admite conexión opcional. UPDATE tiene whitelist local y validación estricta; SQL incluye propietario, `disponible` y `deletedAt IS NULL`. `softDeleteByUUID` aplica el mismo filtro. No se expone borrado físico. Al conectar estas operaciones a US5, autorizar y bloquear la cuenta dentro de la transacción como en el alta.

Card muestra detalle y habilita callbacks de edición/borrado solo para el propietario y estado disponible. `isOwner` es una indicación visual, nunca una autorización. Los callbacks HTTP de US5 se integrarán cuando existan sus endpoints. La página de muestra solo presenta la publicación recién creada, sin simular un listado persistente.

El Slice mantiene estados de solicitud y filtra respuestas antiguas por requestId; no guarda File, FormData ni tokens en Redux. El File solo pasa como argumento del thunk y queda fuera del estado. No hay reintento automático ni garantía de idempotencia: si se pierde la respuesta, verificar persistencia antes de repetir el POST. La prevención de doble envío en frontend no sustituye una clave de idempotencia de servidor.

## Historias y aceptación

| US | Historia | Cobertura de esta entrega / pendiente |
|---|---|---|
| 1 | Como equipo quiero una base MVC y por features para reutilizar arquitectura web/móvil. | MVC, carpetas, Redux, Button/Input/Icon, FormField/Alert y layout responsive incluidos. Navegación por rol pendiente. |
| 2 | Como persona o empresa quiero registrarme según mi perfil para participar en EcoRecicla. | DDL con roles, hash, documento y estados incluido. Formulario, almacenamiento privado y endpoint de registro pendientes. |
| 3 | Como cuenta registrada quiero iniciar/cerrar sesión y recuperar acceso según mi rol. | Verificación del access token y control de estado al publicar incluidos. Emisión, refresh, logout, recuperación y redirecciones pendientes. |
| 4 | Como usuario o empresa quiero publicar material con tipo, cantidad, ubicación, horario y foto. | Corte de alta incluido: validación compartida por contrato, transacción, foto real, estado disponible y frontend responsive. Requiere integración con US2/US3 y validación contra MySQL real. |
| 5 | Como propietario quiero consultar y gestionar mis avisos mientras estén disponibles. | Card y operaciones del modelo para editar/eliminar con filtros atómicos incluidos. Listado, endpoints, pantallas y conexión de callbacks pendientes. |

## Verificación

Ejecuta `npm run typecheck` en ambos paquetes y `npm test` en backend. Las pruebas usan un adaptador simulado para las transacciones: verifican autorización, validación, imágenes reales, contrato HTTP, rollback y filtros SQL. **No sustituyen ejecutar el DDL y pruebas de concurrencia en MySQL real.** La disponibilidad y resultados de las comprobaciones de esta entrega figuran en `VALIDATION.md`.

Referencias técnicas consultadas: [Redux Toolkit createAsyncThunk](https://redux-toolkit.js.org/api/createAsyncThunk), [Multer](https://expressjs.com/en/resources/middleware/multer/), [restricciones CHECK de MySQL](https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html). Los contratos de nombres y JSON provienen de los adjuntos del usuario.
