# 💰 MoneyTrack · Control Inteligente de Finanzas Personales

![Versión](https://img.shields.io/badge/Versi%C3%B3n-1.0.0-6C5CE7?style=for-the-badge)
![Plataforma](https://img.shields.io/badge/Plataforma-Windows%20Portable%20%7C%20PWA-00D2FF?style=for-the-badge)
![Diseño](https://img.shields.io/badge/Estilo-3D%20Effects%20%26%20Depth-8B5CF6?style=for-the-badge)
![Accesibilidad](https://img.shields.io/badge/Accesibilidad-WCAG%20AA%20%7C%20Daltonismo-10B981?style=for-the-badge)
![Moneda](https://img.shields.io/badge/Moneda-COP%20(%24)-F59E0B?style=for-the-badge)

> **MoneyTrack** es una solución integral y moderna para la administración de finanzas personales en pesos colombianos (COP). Desarrollada con un diseño de vanguardia en **3D Effects and Depth**, ofrece a los usuarios una interfaz tangible, fluida y con soporte ergonómico para personas con daltonismo, control de préstamos, calendario financiero, simulador inteligente de compras y gamificación.

---

## ✨ Características y Módulos del Sistema

### 📊 1. Panel de Control (Dashboard Inteligente)
* **KPIs Financieros en Tiempo Real:** Balance disponible, total de ingresos del mes, total de gastos del mes, cumplimiento de presupuesto y ahorro.
* **Widget de Salud Financiera:** Medidor 3D con tu Score (1 a 100), estado actual y recomendación inmediata.
* **Widget Simulador de Compra:** Acceso rápido para evaluar compras antes de desembolsar.
* **Resumen de Préstamos Personales:** Saldo neto a cobrar vs saldo a pagar.
* **Visualización con Chart.js:** Gráficas comparativas de flujo y distribución de gastos por categoría.

### 💵 2. Gestión de Ingresos y Gastos (CRUD)
* Registro, edición y eliminación de movimientos en moneda nacional (COP).
* Clasificación por categorías con colores e iconos 3D.
* Búsqueda instantánea, filtros dinámicos y paginación rápida.
* Efectos de sonido hápticos (moneda al ingresar dinero, clic al gastar).

### 🤝 3. Módulo "Me Deben / Debo" (Control de Préstamos Personales)
* Registro de personas a las que prestaste dinero (**Me Deben**) o con las que adquiriste deudas (**Debo**).
* Montos en COP, fechas de entrega y fechas pactadas de pago.
* Registro de abonos parciales con historial detallado.
* Detección y alerta visual animada de préstamos **⚠️ Vencidos** y marcación de **✓ Saldados**.
* Balance neto consolidado de préstamos.

### 📅 4. Calendario Financiero Interactivo
* Cuadrícula mensual completa (Lunes a Domingo) con navegación entre meses y botón para volver a "Hoy".
* Píldoras verdes `+$` para ingresos y rojas `-$` para gastos en cada día.
* Inspección interactiva: haz clic en cualquier día para ver el detalle de transacciones y agregar un movimiento directo en esa fecha.

### 🔮 5. Simulador "¿Puedo Permitírmelo?" (Asesor de Compras)
* Evalúa compras impulsivas antes de gastar tu dinero.
* Algoritmo inteligente que analiza tu balance disponible, compromisos presupuestales y metas de ahorro.
* Dictamen visual con semáforo 3D: 🟢 **¡Adelante!**, 🟡 **Con Precaución**, 🔴 **No Recomendado**.
* Muestra el saldo restante estimado y el equivalente en días de trabajo/sueldo.

### 🩺 6. Diagnóstico de Salud Financiera (Score 1 a 100)
* Medición ponderada continua en 4 pilares: Tasa de Ahorro (30 pts), Control de Presupuestos (25 pts), Colchón de Reserva (25 pts) y Control de Endeudamiento (20 pts).
* Clasificación: *Excelente*, *Saludable*, *En Riesgo*, *Alerta Crítica*.
* Consejos personalizados y accionables según tus debilidades detectadas.

### 🏷️ 7. Gestor de Categorías Personalizadas
* Crea tus propias categorías de ingreso o gasto con nombre y color 3D a tu gusto.
* Integración inmediata en los selectores de transacciones, presupuestos y filtros.

### 🏆 8. Gamificación y Retos de Ahorro
* **7 Medallas 3D Desbloqueables:** *Primer Despegue*, *Ahorrador Consciente*, *Tiro al Blanco*, *Estratega Financiero*, *Libre de Deudas*, *Hércules del Ahorro* y *Constancia de Oro*.
* **Reto Progresivo de los 30 Días:** Tablero interactivo para ahorrar desde $1.000 el día 1 hasta acumular **$ 465.000 COP** con abono automático a tu meta seleccionada.

### 👨‍👩‍👧‍👦 9. Grupo Familiar Personalizado
* Comienza limpio: permite al usuario crear el nombre de su grupo familiar con un clic.
* Botón **"+ Añadir Miembro"** para incorporar familiares con su parentesco (Esposo/a, Hijo/a, Pareja, Familiar, Roomie) y notas.

### ⌨️ 10. Atajos Rápidos de Teclado
* `Ctrl + I`: Nuevo Ingreso
* `Ctrl + G`: Nuevo Gasto
* `Ctrl + K`: Buscador Global interactivo en tiempo real
* `Ctrl + P`: Simulador "¿Puedo Permitírmelo?"
* `Esc`: Cerrar modales y paneles

### 🔤 11. Accesibilidad, Texto Dinámico y Sonido Háptico
* **Escala de Texto Dinámica:** Controles `A -` y `A +` (85%, 100%, 115%, 130%).
* **Efectos de Sonido Hápticos:** Sintetizador Web Audio API autónomo con opción de silenciar en un clic.
* **Filtros de Daltonismo (WCAG AA):** Protanopía, Deuteranopía y Tritanopía con matrices SVG.
* **12 Temas y 4 Modos:** Modo Oscuro, Claro, Alto Contraste y Automático.

---

## 🚀 Cómo Ejecutar MoneyTrack en Windows

Tienes tres formas inmediatas de abrir la aplicación:

### Opción 1: Archivo por Lotes (Recomendado y 100% Inmediato)
1. Haz doble clic sobre el archivo **`MoneyTrack.bat`** (en el explorador de Windows se muestra como `MoneyTrack` tipo *Archivo por lotes*).
2. Se abrirá la aplicación de inmediato.

### Opción 2: Ejecutable de Escritorio (.exe)
1. En la carpeta `dist\win-unpacked\` (o en el paquete portable descomprimido), haz doble clic en **`MoneyTrack.exe`**.
2. O ejecuta el lanzador **`MoneyTrack.exe`** en la carpeta raíz.

### Opción 3: Navegador Web / PWA
* Abre el archivo `public/index.html` en Microsoft Edge, Google Chrome o cualquier navegador moderno e instálala como PWA.

---

## 📦 Paquete Portable para GitHub Releases

El paquete oficial listo para distribuir o subir a la sección de **Releases** de tu repositorio se encuentra en:
* **`MoneyTrack-v1.0.0-Windows-Portable.zip`** (115 MB empaquetado, contiene la aplicación completa para Windows lista para descomprimir y usar).

---

## 📂 Estructura del Repositorio

```
moneytrack/
├── MoneyTrack.exe          <- Ejecutable nativo portable (Doble clic para abrir)
├── MoneyTrack.bat          <- Lanzador por lotes (Doble clic alternativo)
├── MoneyTrack-v1.0.0-Windows-Portable.zip <- Paquete release listo para GitHub
├── package.json            <- Configuración y dependencias
├── main.js                 <- Proceso principal de Electron (Desktop)
├── preload.js              <- Aislamiento de contexto seguro
├── public/
│   ├── index.html          <- Single Page Application con 12 módulos y modales
│   ├── manifest.json       <- PWA Manifest
│   ├── sw.js               <- Service Worker offline
│   └── assets/
│       ├── css/
│       │   └── style-3d.css     <- Sistema de diseño 3D, temas y daltonismo
│       └── js/
│           ├── storage.js       <- Persistencia, préstamos, salud, simulador
│           ├── theme-engine.js  <- Temas, accesibilidad y sonido Web Audio API
│           ├── charts.js        <- Gráficas interactivas con Chart.js
│           └── app.js           <- Controlador central de eventos y navegación
├── portable/
│   ├── Launcher.cs         <- Código fuente C# del ejecutable portable
│   ├── build_exe.bat       <- Script de compilación nativa
│   └── package_release.bat <- Script empaquetador del ZIP release
└── docs/
    ├── MANUAL_TECNICO.md   <- Arquitectura técnica y fórmulas
    ├── MANUAL_USUARIO.md   <- Guía completa de uso
    └── MANUAL_DESPLIEGUE.md<- Guía de despliegue y GitHub Releases
```
