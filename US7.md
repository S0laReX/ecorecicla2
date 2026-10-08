# US 7 · Explorar publicaciones disponibles

Sprint 2, épica 3. Fuente: PRODUCT BACKLOG (EcoRecicla) (1).xlsx, hoja 1, D87:E93.

## Uso

Iniciar sesión como empresa aprobada y activa, luego abrir **Explorar** en la navegación o en el inicio de empresa. Ruta `/recolecciones`; detalle `/recolecciones/:publicationUUID`.

El listado muestra materiales disponibles de otras cuentas, en páginas de seis resultados. Permite filtrar por plástico, papel, vidrio, metal u orgánico y limpiar el filtro. El detalle consulta nuevamente disponibilidad y permisos en el servidor. Si el material ya fue aceptado, eliminado o no pertenece al listado permitido, responde 404. El listado se actualiza al volver a enfocar la ventana o con **Actualizar**.

Se reutilizan User, Publication y las sesiones existentes; no se necesita una migración ni volver a crear la base de datos.

## API

- `GET /api/collections/publications?materialType=plastico&page=1&limit=6`
- `GET /api/collections/publications/:publicationUUID`

Ambos requieren Bearer JWT, sesión vigente y una empresa aprobada y activa según la base de datos. La comprobación se repite dentro de la transacción de lectura. `materialType` es opcional; `page` va de 1 a 100000 y `limit` de 1 a 12. Parámetros desconocidos o inválidos producen 422.

El listado responde `{success:true,message,data:{publications,meta:{total,page,limit}}}`. El detalle devuelve `{success:true,message,data:publication}`. Cada publicación expone los campos públicos existentes y `publisherName`; no entrega correo, ID interno, credenciales ni documentos del publicador. Los errores conservan el contrato oficial y el registro de auditoría.

## Diseño

Referencia revisada: Figma `15:4390`, Explorar Recolecciones (Empresa). Se conservan Quicksand, verdes/menta, tarjetas, filtros redondeados e iconos originales. Las fotos vienen de publicaciones reales. Se adapta a una columna en móvil y dos en escritorio; el detalle se apila en móvil.

El backlog especifica ubicación textual y no pide mapa ni distancia: no se muestran mapa simulado, cifras de ejemplo, filtro de distancia ni acciones de recompensas. La aceptación y agenda corresponden a US 8. El detalle conserva cantidad, foto, horario y publicador conforme a US 7.

## Verificación

```powershell
cd D:\EcoRecicla\backend
npm run typecheck
npm test
npm run test:collections

cd D:\EcoRecicla\frontend
npm run typecheck
npm test
npm run build
```

La prueba `test:collections` crea una base `ecorecicla_test_<identificador aleatorio>`, aplica las tres migraciones existentes y la elimina al finalizar. Necesita permiso local de creación/eliminación de bases de prueba. No usa cuentas ni publicaciones de la base de la aplicación. Verifica acceso anónimo/roles, empresa pendiente/rechazada/suspendida, sesión revocada, filtro y limpieza, paginación, exclusión de publicaciones propias/aceptadas/confirmadas/eliminadas, detalle y validación de entradas.

## Subir por partes en la rama actual

1. **Backend:** `backend/src/app.js`, `backend/src/models/Publication.js`, `backend/src/models/CompanyProfile.js` (corrección de tipado JSDoc existente), `backend/src/schemas/collectionSchema.js`, `backend/src/services/collectionService.js`, `backend/src/controllers/collectionController.js`, `backend/src/routes/collectionRoutes.js`, `backend/test/collections.mysql.cjs`, `backend/package.json`. Mensaje sugerido: `feat(collections): explorar materiales disponibles con permisos de empresa`.
2. **Frontend y documentación:** feature `collections`, rutas `app/recolecciones`, integración de store, navegación y dashboard, CSS, iconos `collection-*.svg`, este documento y `UI_FIGMA.md`. Mensaje sugerido: `feat(collections): listado y detalle responsive con filtro de material`.

Revisar `git diff` antes de cada commit. No incluir `.env`, claves, logs, dependencias ni archivos generados de Next.js. Esta entrega no crea ramas ni ejecuta commits o push.
