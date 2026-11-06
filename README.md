# EcoRecicla

Aplicación de reciclaje con frontend Next.js y backend Express/MySQL. El código conserva la organización por funcionalidades en el frontend y por rutas, controladores, servicios, esquemas y modelos en el backend.

## Premios y ranking de empresas

- **Administrador:** `/admin/premios` permite crear y editar productos, definir el costo en puntos, ajustar las existencias, ocultar premios y registrar las entregas.
- **Usuario:** `/premios` muestra puntos disponibles, obtenidos y canjeados; permite canjear una unidad y consultar el código y estado de cada entrega.
- **Empresa aprobada:** `/ranking` compara los puntos obtenidos por mes y muestra su posición. El administrador también puede consultar el ranking.

Los accesos están integrados en la navegación, los paneles de inicio y el perfil. Consulta [las reglas y los endpoints](PREMIOS_Y_RANKING.md).

## Ejecución local

Requisitos: Node.js 22 o posterior, MySQL 8 y dependencias instaladas en `backend` y `frontend`. Configura la conexión y las claves de sesión en `backend/.env` siguiendo la configuración existente.

Desde la raíz, en PowerShell:

```powershell
.\start-local.ps1
```

El iniciador aplica las migraciones repetibles y levanta la API en el puerto 4000 y el frontend en el 3000. Los registros de los procesos se guardan en `.local`. Abre `http://localhost:3000/login`.

Para aplicar solamente el esquema, desde `backend`:

```powershell
npm run migrate
```

La migración `011_rewards.sql` agrega `Reward` y `RewardRedemption`. Conserva las cuentas, publicaciones y puntos otorgados anteriormente.

## Verificación

Desde `backend`: `npm run typecheck`, `npm test` y `npm run test:rewards`.

Desde `frontend`: `npm test` y `npm run build` (incluye el tipado).

Las suites de integración MySQL necesitan una cuenta de pruebas en `DB_USER`/`DB_PASSWORD` con permiso para crear y eliminar bases temporales `ecorecicla_test_*`. Cada ejecución utiliza una base aleatoria y la elimina al terminar; no necesita modificar los permisos de la cuenta de la aplicación.
