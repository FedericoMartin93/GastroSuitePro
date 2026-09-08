# GastroSuitePro - Suite Integral de Gestión Gastronómica

**GastroSuitePro** es una aplicación web profesional de alto rendimiento diseñada para hostelería y restauración. Fusiona en una sola plataforma dos sistemas clave:
1. **Chef Manager PRO**: Escandallos, fichas técnicas de platos, sub-recetas multinivel con prevención de bucles, alérgenos dinámicos heredados, edición masiva de precios, matriz BCG y calculadora de producción con integración a WhatsApp.
2. **Gestor Horarios Lino PRO**: Cuadrante semanal con arrastre (Drag & Drop), turnos partidos, control del descanso legal mínimo (12h), planificador mensual de ausencias (vacaciones y bajas), clonación rápida con pincel, simulador de escenarios Sandbox e impresión de hojas de firmas y tickets térmicos de 80mm.
3. **Control 360° (Prime Cost)**: Enlace en tiempo real entre el coste laboral y el escandallo de recetas para monitorizar el Prime Cost del restaurante.
4. **Seguridad con PIN TPV**: Pantalla de bloqueo numérica protegida con cifrado SHA-256 para terminales de restaurante.

## 🚀 Cómo Ejecutar la Aplicación

No requiere instalación de servidores ni dependencias.

- **Opción 1 (Directa)**: Haz doble clic en el archivo `index.html` para abrirlo en cualquier navegador (Google Chrome, Edge, Safari, Firefox) o en la tablet/TPV de tu restaurante.
- **Opción 2 (Servidor Local opcional)**: Si dispones de Node.js instalado, puedes ejecutar `npx serve .` en esta carpeta.

## 🔐 Clave de Acceso Inicial

La primera vez que abras la aplicación, se te pedirá configurar tu **PIN maestro de 4 a 6 dígitos**.
Puedes cambiar el PIN en cualquier momento o bloquear la pantalla pulsando el botón **🔒 Bloquear** en la barra superior.

## 💾 Persistencia y Copias de Seguridad

- Todos los datos se guardan de forma segura en tu navegador mediante **IndexedDB** (`GastroSuiteDB`).
- Si ya tenías datos en versiones anteriores de Chef Manager o Horarios Lino en tu navegador, el sistema los migra automáticamente.
- Puedes generar una copia de seguridad completa de todas las recetas, almacén y horarios con el botón **⬇️ Backup Total** en formato JSON.
