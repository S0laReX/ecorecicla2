# Backend en Render y MySQL en Clever Cloud

## Despliegue

1. Sube los cambios al repositorio y selecciona la rama que publicarás.
2. Crea el complemento MySQL en Clever Cloud. Copia host, puerto, base, usuario y contraseña.
3. En Render crea un Blueprint desde `render.yaml`, ubicado en la raíz del repositorio.
   Esta plantilla usa **Starter, de pago**, para ejecutar migraciones antes de publicar y permitir SMTP 587.
4. Completa las variables solicitadas. Usa `backend/.env.production.example` como referencia.
5. En Environment → Secret Files agrega `jwt-private.pem` con una clave privada RSA de al menos 2048 bits.
   Configura su clave pública correspondiente en `JWT_PUBLIC_KEY`, en PEM con saltos reales o separadores literales `\n`.
   Conserva el mismo par entre despliegues. No lo guardes en Git ni lo regeneres al arrancar.
6. Define `FRONTEND_ORIGIN` con el origen HTTPS del frontend, sin rutas.
   Configura SMTP con un proveedor real para recuperar contraseñas.
7. Si Clever Cloud ofrece TLS en el endpoint elegido, usa `DB_SSL=true`.
   Si requiere una CA propia, cárgala como Secret File y configura `DB_SSL_CA_PATH`.
   La aplicación y las migraciones comparten esta configuración y verifican el certificado.
8. Ejecuta el despliegue y comprueba `/api/health` (proceso) y `/api/ready` (conexión MySQL).

Render configura `PORT`; no lo reemplaces con `DB_PORT`. La raíz del servicio debe quedar vacía para conservar acceso a `database/`.

| Campo manual de Render | Valor |
| --- | --- |
| Runtime | Node 22 |
| Root Directory | Vacío |
| Build Command | `npm ci --prefix backend --omit=dev` |
| Pre-deploy Command (plan de pago) | `npm run migrate --prefix backend` |
| Start Command | `npm start --prefix backend` |
| Health Check Path | `/api/ready` |

Las migraciones crean el esquema; no transfieren datos de la base local. Haz una copia antes de actualizar una base con datos.

## Plan gratuito

Para una demostración puedes crear el Web Service manualmente con los mismos comandos de build y arranque.
Render Free no admite pre-deploy ni SMTP en 465/587. Aplica las migraciones desde tu equipo antes de publicar:

```powershell
cd D:\EcoRecicla\backend
node --env-file=.env.production scripts/migrate.cjs
```

El archivo privado `.env.production` debe contener las credenciales remotas y queda excluido de Git.
La recuperación por correo requiere un puerto admitido por el proveedor y Render, o adaptar el código a una API de correo.
El servicio gratuito se suspende tras inactividad y el trabajo periódico de vencimientos se pausa; también se comprueban vencimientos durante las operaciones de recolección.

## Administrador y frontend

Para crear un administrador inicial desde tu equipo, agrega `ADMIN_EMAIL` y `ADMIN_PASSWORD` al archivo privado con las credenciales remotas y ejecuta:

```powershell
node --env-file=.env.production scripts/seed-admin.cjs
```

El script guarda las credenciales en `backend/.local/initial-admin.txt`, excluido de Git. No lo ejecutes en cada arranque.

En Firebase App Hosting configura `API_INTERNAL_ORIGIN=https://TU_API.onrender.com` durante BUILD y RUNTIME.
El frontend utiliza el proxy `/api`; esta configuración no exige acceso CORS directo desde el navegador.

`TRUST_PROXY_HOPS=1` confía únicamente en el proxy inmediato de Render. Verifica las IP y el límite 429 con tráfico real antes de abrir el servicio.
Con Firebase/Next delante de Render, los límites pueden agrupar usuarios por la IP de salida de ese proxy.
No aumentes los saltos sin comprobar todas las rutas de acceso y la limpieza de encabezados; la API de Render también es accesible directamente.
Los contadores actuales están en memoria por instancia y se reinician con el proceso.

Comprueba registro, login, publicaciones con imágenes, aprobaciones, recolecciones y recuperación de contraseña antes de publicar el enlace.

Referencias: [Render](https://render.com/docs/web-services), [Blueprints](https://render.com/docs/blueprint-spec), [planes gratuitos](https://render.com/docs/free), [Clever Cloud MySQL](https://www.clever.cloud/developers/doc/deploy/databases/mysql/).
