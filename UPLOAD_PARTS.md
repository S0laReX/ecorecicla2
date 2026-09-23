# Subir el Sprint 1 por partes

Repositorio local independiente: esta carpeta `ecorecicla`. Nunca ejecutar `git add` desde C:\.

Cada parte se entrega como un commit local. No se configura un remoto ni se hace push automáticamente.
Para subir hasta un commit concreto a una rama remota (después de añadir tu remoto):

```powershell
git remote add origin URL_DE_TU_REPOSITORIO
git push -u origin HASH_DE_LA_PARTE:refs/heads/sprint-1
```

Sustituye el hash por el indicado en cada aviso. Repite el push con el siguiente hash para avanzar la misma rama. No uses force. Si el repositorio remoto tiene historia previa, intégrala antes de subir.

1. Arquitectura, componentes compartidos y migración de cuentas.
2. Registro de usuario/empresa y administrador inicial.
3. Login, sesiones, recuperación y navegación por rol.
4. Alta de publicaciones integrada con la sesión.
5. Mis publicaciones, detalle, edición, eliminación y pruebas finales.
6. Actualización visual según Figma: fuentes e imágenes locales, acceso/registro, publicaciones y navegación responsive; referencias de futuros sprints en UI_FIGMA.md. Se entrega como un commit independiente de las US anteriores.

Se excluyen `.env`, `.keys`, `.local`, dependencias y compilados. La base de datos y sus datos no se suben; se suben los scripts de esquema.
