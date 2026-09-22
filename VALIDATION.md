# Verificación de la entrega

Fecha: 22 de septiembre de 2026.

Actualización de referencias: se revisó `EcoRecicla_Requerimientos (1).docx` como fuente vigente de requerimientos y cuestionario. Se corrigió la documentación y se retiraron las extracciones anteriores de las referencias de trabajo. El código no cambió; los resultados siguientes corresponden a su verificación previa. Los requisitos adicionales pendientes están registrados en README.

| Comprobación ejecutada | Resultado |
|---|---|
| Backend `npm run typecheck` con JavaScript/JSDoc y `strict: true` | Correcto |
| Backend `npm test` | 6 pruebas correctas, 0 fallidas |
| Frontend `npm run typecheck` con TypeScript estricto | Correcto |
| Frontend `npm run build` | Correcto; Next.js 16.3.5, generación estática de `/` |

Pruebas: rechazo de mass assignment y cantidades inválidas; empresa pendiente permitida y suspensión/rechazo/ADMIN/sesión revocada bloqueados; procesamiento real de PNG a JPEG y rechazo de contenido falso; UPDATE y borrado con filtros de propietario/estado; HTTP 401 con contrato JSON para tokens ausentes, expirados o de otra audiencia; HTTP 201 con commit y HTTP 500 seguro con rollback/release.

Las transacciones SQL se prueban con una conexión simulada. No se ejecutó el DDL sobre el servicio MySQL existente ni se modificaron bases del equipo. Falta una base de pruebas y sus credenciales para comprobar restricciones, round-trip DECIMAL/BLOB, aislamiento y carreras contra aceptación/suspensión en MySQL real. No se realizó validación visual en navegador ni una prueba completa con login real; US2/US3 no forman parte de los archivos funcionales solicitados en este corte.

Se incluyen `package-lock.json` de ambos paquetes para reproducir las versiones instaladas con `npm ci`. El ZIP excluye dependencias y archivos de compilación.
