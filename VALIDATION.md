# Verificación del Sprint 1

Entorno: Node.js 22.17.0, MySQL 8.0.46, Next.js 16.3.5. Fecha: 22 de septiembre de 2026.

| Verificación | Resultado |
|---|---|
| Backend JavaScript/JSDoc estricto | `npm run typecheck`, correcto |
| Frontend TypeScript estricto | `npm run typecheck`, correcto |
| Pruebas unitarias y HTTP con conexión simulada | 9 correctas |
| Integración contra MySQL temporal real | 16 comprobaciones correctas |
| Compilación Next.js de producción | Correcta; incluye todas las rutas de Sprint 1 |
| Navegador local | Login, redirección por rol, alta con foto, listado, edición, detalle y logout verificados |
| Responsive | Panel y detalle revisados en escritorio; detalle, navegación y formulario empresarial revisados a 390×844 |

La suite de MySQL comprueba registro, duplicados, documento privado, sesión, separación por rol, renovación y replay, logout, bloqueo de empresa pendiente en dashboard, alta con JPEG y DECIMAL real, paginación, propiedad, whitelist, bloqueo de estados aceptada/confirmada, carrera aceptación/edición bajo bloqueo de filas, eliminación lógica, suspensión/rechazo, recuperación de un solo uso y revocación tras reset.

El enlace de recuperación se prueba con el canal local de archivos privados. No se enviaron correos reales ni se verificó un servidor SMTP externo. No se prueba concurrencia a escala de producción. Los endpoints y pantallas de recolecciones, puntos y administración de empresas quedan fuera de las épicas de este sprint.

Corrección posterior del login: se detectaron ambos servidores detenidos y se añadió un iniciador Windows persistente. Se verificaron login de administrador, acceso a su panel y logout a través del proxy de Next.js (HTTP 200 en los tres casos). Pasaron cuatro pruebas nuevas de transporte: HTML de proxy 5xx, preservación del contrato JSON, respuesta inválida y error de red/cancelación. El tipado del frontend también pasó.

En navegador se usaron datos e imagen sintéticos. Se verificó el diálogo de eliminación y su cancelación; la eliminación efectiva y los bloqueos por estado se verificaron en la suite HTTP/MySQL. La recuperación se verificó por API y almacenamiento, sin cambiar contraseñas del usuario del equipo.
