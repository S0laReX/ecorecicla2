# EcoRecicla · Referencia visual para todos los sprints

Fuente de diseño: [EcoRecicla (Copy), Page 1](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=0-1). Revisado el 23 de septiembre de 2026 mediante Figma MCP. Los requisitos funcionales siguen siendo el backlog y el documento corregido EcoRecicla_Requerimientos (1).docx.

## Sistema visual compartido

| Elemento | Valor / comportamiento |
| --- | --- |
| Tipografía | Quicksand local, pesos 400, 500, 600 y 700. Licencia OFL en public/fonts. |
| Fondo | #F9F9FF; superficies #FFFFFF. |
| Acción principal | Verde #006C49; hover #00422B; texto blanco. |
| Acción destacada | Ámbar #E29100; texto #523200 para mejorar contraste. |
| Selección | Verde #10B981 y menta #C3ECD7. |
| Texto | Principal #151C27; secundario #3C4A42. |
| Campos | #F3F4F6, 48 px mínimo; empresa #F0F3FF. |
| Tarjetas | Radio 12 px, padding 20–24 px, sombra 0 4px 10px rgba(16,185,129,.08). |
| Botones | Radio completo, alto mínimo 48 px; foco visible y estados de carga/deshabilitado. |
| Espaciado | Base 4 px; separación de secciones 24 px, margen móvil 20 px. |
| Responsive | Móvil hasta 700 px; navegación inferior fija con espacio reservado; escritorio con navegación superior y rejillas. |
| Imágenes | Recursos originales de Figma guardados en public/design. Fotos de publicaciones siempre vienen de los datos reales. |

Reutilizar Button, Input, FormField, Alert, Modal, DesignIcon y AppShell. Los estilos compartidos están en src/app/globals.css. DesignIcon preserva el tamaño y proporción originales del SVG; el contenedor determina el espacio disponible. Mantener estructura por features, validaciones, Redux y servicios existentes.

## Sprint 1: pantallas adaptadas

| Pantalla | Referencia Figma | Aplicación |
| --- | --- | --- |
| Bienvenida | [15:5278](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-5278) | Imagen hero original, composición centrada, pasos en tarjetas y CTA. |
| Registro y acceso | [15:5543](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-5543) | Imagen superior en móvil, división imagen/formulario en escritorio, selector de rol y campos con iconos. Login y recuperación derivados de esta misma plantilla. |
| Registro de empresa | [15:5600](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-5600) | Variante con campos empresariales y carga privada de documento. |
| Pendiente de aprobación | [15:5692](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-5692) | Reloj de arena original, estado ámbar, resumen de empresa y acciones de material propio. |
| Publicar / editar | [15:4655](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-4655) | Materiales en tarjetas seleccionables, ubicación, disponibilidad y foto en secciones. |
| Inicio usuario | [15:5006](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-5006) | Saludo, tarjetas y navegación móvil. Acciones reales de Sprint 1. |
| Inicio empresa | [15:4534](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-4534) | Misma identidad visual con acceso según verificación. |
| Administración | [15:3530](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-3530) | Encabezado y tarjetas; gestión administrativa pendiente de Sprint 2. |
| Mis publicaciones / detalle / eliminar | Derivación de las tarjetas y formularios anteriores | Fotos reales, estado, cantidad, ubicación, horario y confirmación de eliminación. No había un frame dedicado a US5 en la página consultada. |

### Diferencias funcionales deliberadas

- Publicación de un único material: plástico, papel, vidrio, metal u orgánico. Figma muestra selección múltiple y cartón; se conservan los cinco valores del contrato aprobado.
- Cantidad y foto son obligatorias aunque el frame del formulario no las muestre. Se agregan usando las mismas secciones visuales.
- Ubicación y disponibilidad siguen siendo texto libre. No se muestra una imagen de mapa que pueda confundirse con la ubicación real.
- Registro conserva todos los datos admitidos por el backend; no se agregan teléfono ni materiales procesados sin persistencia.
- Se mantienen la contraseña de 12 caracteres, estados pendientes/suspendidos y permisos reales. La revisión empresarial no promete un correo que no existe.
- La portada y los dashboards no presentan cifras, puntos, rankings, premios ni actividad de ejemplo como datos reales.
- La pantalla de acceso se deriva del registro; el documento proporciona un frame de registro, no un login independiente. Escritorio se adapta con columnas fluidas porque las pantallas de usuario de referencia miden 390 px.
- Los placeholders son más oscuros y el botón ámbar usa texto oscuro para legibilidad. Las etiquetas y focos siguen siendo accesibles por teclado.
- El hero original contiene texto inglés incrustado. Se conserva el recurso y se añade un panel claro detrás del texto español para evitar superposiciones ilegibles.

## Diseño previsto para los siguientes sprints

Estas referencias quedan fijadas para las siguientes implementaciones. Son diseños de referencia, no funcionalidades habilitadas en esta entrega. Cada nueva pantalla debe obtener el contexto actualizado de su frame antes de implementarse y reutilizar los componentes anteriores.

| Sprint / módulo | Frame de referencia | Diseño y comportamiento a implementar |
| --- | --- | --- |
| 2 · US6 / admin | [Gestión de compañías · 15:2871](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-2871) | Escritorio con navegación lateral, listado y estados; móvil con filas apiladas. Documento privado, confirmación de aprobación y motivo obligatorio de rechazo; estados vacío/cargando/error. |
| 2 · US7 / collections | [Explorar · 15:4390](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-4390) | Filtros de material, tarjetas y detalle de material disponible. Acceso exclusivo de empresa aprobada. Ubicación textual hasta acordar geolocalización. |
| 2 · US8 / collections | [Agenda · 15:4262](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-4262) | Agenda de materiales aceptados, chips de estado y confirmación de aceptación. Evitar doble aceptación con control del servidor. |
| 2 · US9 / collections | Agenda anterior + [Historial empresa · 15:4018](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-4018) | Tarjeta de recolección, confirmación y resultado; puntos calculados por servidor, no constantes visuales. |
| 3 · calificaciones | [Modal y aviso · 15:5725](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-5725) | Modal con estrellas accesibles, comentario y validación. Usar Modal con foco administrado y estados de envío/error. |
| 3 · administración | [Usuarios · 15:3196](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-3196), [Configuración · 15:2419](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-2419) | Tablas responsivas, filtros, estado y confirmación de suspensión/reactivación; controles solo cuando exista autorización y endpoint. |
| 3 · perfil / profile | [Usuario · 15:4792](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-4792), [Empresa · 15:3903](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-3903) | Identidad, datos editables y resumen por rol; reutilizar FormField y validaciones formales. |
| 3 · historial / dashboard | [Usuario · 15:5122](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-5122), [Empresa · 15:4018](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-4018) | Actividad paginada por fecha y estado, resúmenes derivados del servidor, estados vacíos honestos. |
| 3 · avisos / notices | [15:5725](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-5725) | Avisos internos de eventos reales, accesibles con regiones de estado; no solicitar permisos push sin alcance aprobado. |
| 4 · integración | Todos los anteriores | Verificación de roles, teclado, foco, contraste, 390 px y escritorio, errores de red, estados vacíos y datos extensos. No constituye una nueva épica funcional. |

Otros frames presentes: [Catálogo · 15:4903](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-4903), [Calificación y recompensas · 15:4168](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-4168), [Gestión de recompensas · 15:2626](https://www.figma.com/design/kFCZcNJ66SjgRkuhdeG7bt/EcoRecicla--Copy-?node-id=15-2626). Su presencia en Figma no crea nuevas historias ni adelanta funcionalidades: vincular primero cada acción a su requisito aprobado.

## Continuidad

### US 9 implementada

Se revisó nuevamente `15:4262` para incorporar el botón verde de confirmar recolección como acción principal de ancho completo en la agenda. Se conserva la tarjeta funcional de US 8 con sus fotos reales; se añadieron fecha límite, confirmación modal y resultado con puntos reales del servidor. Las vencidas salen de la agenda según el backlog, en lugar de conservar las acciones de contacto simuladas en el diseño. Ver `US9.md`.

### US 7 implementada

El frame `15:4390` se volvió a consultar para la US 7. `/recolecciones` y su detalle usan datos reales, filtro por material, fotos, nombre del publicador y navegación de empresa aprobada. Se omiten mapa simulado, distancias y acciones de historias posteriores de acuerdo con el backlog. Los iconos originales adicionales están en `public/design/collection-*.svg`. Ver `US7.md` para endpoints y validación.

Para cada historia futura: seleccionar su frame, adaptar a la feature correspondiente, conectar datos reales, implementar vacío/carga/error/éxito, verificar permisos en backend y comparar móvil/escritorio con Figma. Los cambios visuales no deben modificar el contrato JSON ni la jerarquía de almacenamiento de sesión.

### US 8 implementada

El frame `15:4262` guía la agenda de recolecciones: estados visibles, detalle de material y acciones responsivas. `/agenda` comparte estructura entre escritorio y móvil y solo está disponible para empresas aprobadas. La aceptación reserva de forma exclusiva, muestra fecha y hora, y el publicador ve el estado actualizado en Mis Publicaciones. La cancelación solo se ofrece para reservas aceptadas. Para validar el horario publicado, se requiere un texto estructurado con día(s) de semana y un rango `HH:mm` interpretable en `America/La_Paz`; ver `US8.md`.
