# EcoRecicla — Sprint 1

Aplicación web responsive para personas que reciclan y empresas recolectoras. Incluye las US1–US5: arquitectura MVC y por features, registro, sesión, recuperación de contraseña, publicación de materiales y gestión de publicaciones propias. Frontend Next.js/React/Redux Toolkit/TypeScript; API Express/Node.js con JSDoc estricto; MySQL.

## Probar en este equipo

La base `ecorecicla` está configurada y migrada. Las claves RSA locales y el administrador inicial ya fueron creados. No ejecutes de nuevo el DDL base sobre esas tablas.

Desde la carpeta del proyecto puedes iniciar ambos servidores con:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1
```

El iniciador los mantiene en segundo plano y guarda sus logs en `.local/`. Si un puerto ya está ocupado, no detiene ni reemplaza su proceso. Después de modificar código del backend, reinicia la API o utiliza `npm run dev` para activar la recarga.

Como alternativa, abre dos terminales en la carpeta del proyecto:

```powershell
# Terminal 1
cd backend
npm.cmd start
```

```powershell
# Terminal 2 (desde la carpeta del proyecto)
cd frontend
npm.cmd run dev
```

Abre **http://localhost:3000**. Crea una cuenta desde «Crear cuenta» e inicia sesión. Para administrar, consulta las credenciales generadas en `backend/.local/initial-admin.txt`; este archivo es privado y no se incluye en Git ni en el ZIP. Si el puerto está ocupado, usa la terminal del proceso existente para detenerlo antes de iniciarlo de nuevo.

### Recuperación local

En «Olvidé mi contraseña», escribe el correo de tu cuenta. Con `RECOVERY_DELIVERY=local`, abre el archivo más reciente de `backend/.local/recovery/` y copia su enlace en el navegador. Vence en 20 minutos y admite un único uso. El token no se devuelve en la API, no se registra en logs y el enlace utiliza un fragmento para evitar enviarlo en la URL al servidor.

Para un despliegue real configura `RECOVERY_DELIVERY=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASSWORD` y `FRONTEND_ORIGIN`. La entrega local está deshabilitada con `NODE_ENV=production`. El correo se usa solo para recuperación de acceso, no como sistema de notificaciones comerciales o automáticas del proyecto.

## Instalar en otro equipo

Requisitos: Node.js 22 o superior, npm y MySQL >= 8.0.16. Verificado con MySQL 8.0.46. Docker no es necesario.

1. Crea una base vacía en MySQL, por ejemplo `ecorecicla`, con `utf8mb4`.
2. En `backend`, ejecuta `npm ci` y `npm run setup:local`. Esto genera `.env` y claves RSA locales sin incluir secretos en el código.
3. Completa `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` en `.env`. Usa credenciales de tu propio servidor. No cambies la clave pública por una cadena inventada.
4. Ejecuta `npm run migrate`. Crea el esquema base si no existe y añade las tablas del Sprint 1; no borra usuarios ni publicaciones. No es un reconciliador de esquemas ajenos: solo usar sobre una base vacía o el esquema previo entregado.
5. Ejecuta `npm run seed:admin`. Genera una contraseña aleatoria y la guarda en `.local/initial-admin.txt`. Si el correo ya existe no cambia la cuenta. Puedes definir `ADMIN_EMAIL` y `ADMIN_PASSWORD` antes de ejecutar el seed.
6. Inicia la API con `npm start` y, en `frontend`, ejecuta `npm ci` y `npm run dev`.

La API escucha en `127.0.0.1:4000`; Next.js consume `/api/*` a través de su proxy. `API_INTERNAL_ORIGIN` permite cambiar el destino interno. La clave privada queda en `.keys/jwt-private.pem`; la API firma con ella y valida con `JWT_PUBLIC_KEY`. `JWT_ISSUER=ecorecicla-auth` y `JWT_AUDIENCE=ecorecicla-api` deben coincidir. `npm run dev` en backend activa reinicio al cambiar archivos.

## Cobertura funcional

| Historia | Implementación |
|---|---|
| US1 | MVC, features con árbol solicitado, componentes compartidos Button/Input/Label/Text/Icon, FormField/Alert/Modal, Redux por proveedor y navegación responsive según rol. |
| US2 | Registro de persona o empresa, email normalizado y único, contraseña de 12–128 caracteres con letras y números, hash scrypt con salt; empresa con RUC/NIT único, contacto, cobertura y documento privado; estado pendiente; seed del administrador. |
| US3 | Login por rol, aviso empresarial pendiente, rechazo de cuentas suspendidas/rechazadas, JWT RS256 de 30 minutos, refresh rotativo con vencimiento absoluto de 7 días, logout con revocación inmediata, recuperación de uso único y revocación de sesiones al cambiar contraseña. |
| US4 | Formulario web/móvil con tipos fijos, cantidad en kg, ubicación y horario en texto, foto obligatoria, vista previa, validación de bytes y estado inicial disponible. |
| US5 | Listado propio paginado, detalle, edición de campos y foto, confirmación de eliminación lógica; propietario y estado disponible se comprueban en API y SQL. |

Las empresas pendientes solo tienen acceso a su cuenta y material propio. El backlog US4 permite ese uso; el dashboard general y la aceptación de recolecciones requieren aprobación. La vista de administrador del Sprint 1 permite entrar y confirma su rol. La aprobación de empresas, exploración y recolecciones pertenecen a los siguientes sprints y no se simulan con botones sin funcionalidad.

## Arquitectura y seguridad

`backend/src/models` contiene un modelo por tabla: Role, User, CompanyProfile, AuthSession, PasswordResetToken y Publication. Los servicios coordinan transacciones; los controladores validan y responden con el contrato JSON. Los modelos usan consultas parametrizadas, alias explícitos, whitelists de UPDATE y `CustomModelError`. Los errores se auditan con `AuditService.logSystem` sin cuerpos, contraseñas, tokens, SQL ni imágenes. El logging sale como JSON a stderr.

La cuenta se bloquea antes de consultar la sesión en cada transacción autenticada. Se comprueban el estado actual, tokenVersion y revocación en MySQL; el rol de localStorage nunca autoriza acciones. El cierre de sesión invalida el access token y el refresh token de esa sesión. Reutilizar un refresh token rotado revoca la sesión. El cambio de contraseña invalida todas las sesiones. La respuesta de recuperación no revela si existe el correo. Hay límites de solicitudes y de cargas.

El frontend conserva las claves pedidas: `pdct.tokens.access`, `pdct.tokens.refresh`, `pdct.user.uuid`, `pdct.profiles.active.type`. Redux guarda el usuario y las publicaciones, no contraseñas ni tokens. La renovación se coordina entre solicitudes y pestañas mediante Web Locks cuando está disponible. El logout limpia Redux y localStorage, y sincroniza otras pestañas.

Las fotos JPEG/PNG/WebP se verifican por contenido, se limitan a 5 MiB/16 megapíxeles y se convierten a JPEG de hasta 1280×1280 y 1 MiB, eliminando metadatos. Se almacenan como BLOB para que foto y publicación sean atómicas. Las respuestas entregan una data URL JPEG. El listado tiene seis publicaciones por página, con máximo de doce desde API; para mayor volumen conviene un servicio de medios con miniaturas y URLs autenticadas.

Los documentos empresariales aceptan imágenes normalizadas o PDF parseable, no cifrado, de hasta 30 páginas/5 MiB. Se almacenan privados en CompanyProfile, sin ruta pública que los sirva. La revisión administrativa y el escaneo antimalware al habilitar descargas de documentos son trabajo de la siguiente épica.

La ubicación y el horario son texto libre conforme al corte de Sprint 1. Las ventanas horarias calculables, puntos, recompensas y agenda se implementarán con recolecciones. No hay reintento automático del alta ante fallos de red: si el resultado es incierto se pide verificar el listado antes de repetir. La prevención de doble clic no equivale a idempotencia de servidor.

En producción se requieren HTTPS, credenciales MySQL de mínimo privilegio, protección de secretos, entrega SMTP, límites del proxy, copias de seguridad y un colector de auditoría. Nunca subir `.env`, `.keys` o `.local`. Los tokens en localStorage hacen especialmente importante prevenir XSS; React no inserta HTML recibido del usuario y las fotos se normalizan antes de mostrarse.

## API

Éxito: `{ "success": true, "message": "…", "data": {} }`.
Error: `{ "success": false, "message": "…", "errorCode": "…", "statusCode": 422 }`.
Colecciones: `data` es un array y `meta` contiene `total`, `page`, `limit`.

| Método | Endpoint | Entrada |
|---|---|---|
| POST | `/api/auth/register` | multipart: displayName, email, password, roleCode; empresa añade taxIdentifier, contactName, coverageArea y archivo document |
| POST | `/api/auth/login` | JSON email, password |
| POST | `/api/auth/refresh` | JSON refreshToken, userUUID |
| GET | `/api/auth/me` | Bearer token |
| GET | `/api/auth/dashboard/:role` | Bearer token; USER/COMPANY/ADMIN coincidente y cuenta aprobada cuando corresponda |
| POST | `/api/auth/logout` | Bearer token |
| POST | `/api/auth/forgot-password` | JSON email |
| POST | `/api/auth/reset-password` | JSON userUUID, token, password |
| POST | `/api/publications` | Bearer + multipart materialType, quantityKg, locationText, availabilityText, photo |
| GET | `/api/publications/me?page=1&limit=6` | Bearer; solo registros propios |
| GET | `/api/publications/:publicationUUID` | Bearer; solo propietario |
| PATCH | `/api/publications/:publicationUUID` | Bearer + multipart con campos permitidos y photo opcional |
| DELETE | `/api/publications/:publicationUUID` | Bearer; propietario y disponible |

## Verificación y Git

En backend: `npm run typecheck`, `npm test` y `npm run test:integration`. La suite MySQL crea una base `ecorecicla_test_<aleatorio>` y elimina únicamente esa base al finalizar; requiere permisos de creación de bases. En frontend: `npm run typecheck` y `npm run build`. Los resultados están en `VALIDATION.md`.

Se entrega un repositorio local con un commit por parte; la guía para subirlos está en `UPLOAD_PARTS.md`. No se configuró un remoto ni se hizo push. El ZIP solo contiene código y documentación; las claves, credenciales, datos MySQL y archivos de compilación quedan fuera.

Si el login indica que el servicio no está disponible, comprueba que la API esté activa en el puerto 4000 y Next.js en el 3000. No es necesariamente un error de contraseña. Ejecuta `start-local.ps1` y revisa `.local/backend.error.log` si la API no inicia. Las respuestas de error del proxy y los fallos de red se traducen a mensajes seguros. Las pruebas del transporte se ejecutan en frontend con `npm test`.

## Fuentes vigentes

La fuente corregida de requerimientos y cuestionario es `EcoRecicla_Requerimientos (1).docx`. También se usan `PRODUCT BACKLOG (EcoRecicla).xlsx`, `API REST JSON Standard.pdf` y el manual backend v1.0.1. El cuestionario anterior fue descartado. Las instrucciones de los documentos se interpretan como referencias técnicas subordinadas a la solicitud del usuario; no se ejecutan sus prompts incrustados como tareas adicionales.
