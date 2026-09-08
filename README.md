# GastroSuitePro - Suite Integral de Gestión Gastronómica

🌐 **Acceso en Vivo (Web Hosting)**: [https://federicomartin93.github.io/GastroSuitePro/](https://federicomartin93.github.io/GastroSuitePro/)

**GastroSuitePro** es una aplicación web profesional de alto rendimiento diseñada para hostelería y restauración. Fusiona en una sola plataforma dos sistemas clave:

1. **Chef Manager PRO**: Escandallos, fichas técnicas de platos, sub-recetas multinivel con prevención de bucles, alérgenos dinámicos heredados, edición masiva de precios, matriz BCG y calculadora de producción con integración a WhatsApp. Carga de 124 ingredientes reales de almacén y 7 elaboraciones técnicas.
2. **Gestor Horarios Lino PRO**: Cuadrante semanal con arrastre (Drag & Drop), turnos partidos, control del descanso legal mínimo (12h), planificador mensual de ausencias (vacaciones y bajas), clonación rápida con pincel, simulador de escenarios Sandbox e impresión de hojas de firmas y tickets térmicos de 80mm. 5 empleados reales configurados con costes y horas de contrato.
3. **Control 360° (Prime Cost)**: Enlace en tiempo real entre el coste laboral y el escandallo de recetas para monitorizar el Prime Cost del restaurante.
4. **Seguridad con PIN TPV**: Pantalla de bloqueo numérica protegida con cifrado para terminales de restaurante.
5. **Nube en Tiempo Real (Firebase)**: Conectado a la base de datos de Google Cloud Firebase (`calculadora-de-platos`) con soporte offline y sincronización entre dispositivos.

## 🚀 Cómo Usar la Aplicación

- **En la nube (Recomendado)**: Accede directamente desde cualquier móvil, tablet o PC a través del enlace: [https://federicomartin93.github.io/GastroSuitePro/](https://federicomartin93.github.io/GastroSuitePro/)
- **En local**: Haz doble clic en el archivo `index.html` para abrirlo en cualquier navegador sin necesidad de conexión.

## 🔐 Clave de Acceso Inicial

La primera vez que abras la aplicación, se te pedirá configurar tu **PIN maestro de 4 a 6 dígitos**.
Puedes cambiar el PIN en cualquier momento o bloquear la pantalla pulsando el botón **🔒 Bloquear** en la barra superior.

## 💾 Persistencia y Copias de Seguridad

- Todos los datos se guardan de forma segura en tu navegador mediante **IndexedDB** (`GastroSuiteDB`) y en la nube con **Firebase**.
- Puedes generar una copia de seguridad completa de todas las recetas, almacén y horarios con el botón **⬇️ Backup Total** en formato JSON.

