# 💰 MoneyTrack · Control Inteligente de Finanzas Personales

![Versión](https://img.shields.io/badge/Versi%C3%B3n-1.0.0-6C5CE7?style=for-the-badge)
![Plataforma](https://img.shields.io/badge/Plataforma-Windows%20Portable%20%7C%20PWA-00D2FF?style=for-the-badge)
![Diseño](https://img.shields.io/badge/Estilo-3D%20Effects%20%26%20Depth-8B5CF6?style=for-the-badge)
![Accesibilidad](https://img.shields.io/badge/Accesibilidad-WCAG%20AA%20%7C%20Daltonismo-10B981?style=for-the-badge)
![Moneda](https://img.shields.io/badge/Moneda-COP%20(%24)-F59E0B?style=for-the-badge)

> **MoneyTrack** es una solución integral y moderna para la administración de finanzas personales en pesos colombianos (COP). Desarrollada con un diseño de vanguardia en **3D Effects and Depth**, ofrece a los usuarios una interfaz tangible, fluida y con soporte ergonómico para personas con daltonismo.

---

## ✨ Características Principales

### 📊 1. Panel de Control (Dashboard Inteligente)
* **KPIs Financieros en Tiempo Real:** Balance disponible, total de ingresos del mes, total de gastos del mes, porcentaje de cumplimiento del presupuesto y progreso global de ahorro.
* **Visualización con Chart.js:**
  * Gráfica comparativa de Ingresos vs Gastos.
  * Gráfica circular/dona de distribución de gastos por categoría.
* **Historial Rápido:** Listado de los últimos movimientos con badges de estado y categorías.

### 💵 2. Gestión de Ingresos y Gastos (CRUD)
* Registro, edición y eliminación de movimientos financieros.
* Clasificación detallada por categorías (*Salario, Freelance, Alimentación, Vivienda, Transporte, Ocio, etc.*).
* Tabla interactiva con búsqueda por texto en tiempo real, filtros por categoría y paginación.
* Modales de confirmación para prevenir eliminaciones accidentales.

### 🎯 3. Presupuestos y Control de Gastos
* Configuración de topes mensuales por categoría.
* **Semáforo de Alertas Visuales:**
  * 🟢 **Normal ($< 70\%$):** Consumo controlado.
  * 🟡 **Alerta ($70\% - 99\%$):** Consumo cercano al límite.
  * 🔴 **Sobregiro ($\ge 100\%$):** Gasto excedido en la categoría.

### 🏆 4. Metas de Ahorro
* Creación de metas con valor objetivo en COP y fecha límite.
* Barra de progreso tridimensional reactiva (`(Ahorrado / Meta) * 100`).
* Botón de **Abono Directo** para registrar aportes a cada objetivo.

### 📈 5. Analítica y Estadísticas
* Cálculo automático de la **Media (Promedio)** y la **Mediana** de ingresos y gastos.
* Gráfica de evolución y tendencia semestral.

### 🎨 6. Sistema de Diseño 3D & Accesibilidad WCAG AA
* **Efectos 3D y Profundidad:** Tarjetas con perspectiva (`rotateX`, `rotateY`), botones con relieve de pulsación e inputs volumétricos.
* **12 Temas de Color:** *Firma, Solar, Cítrico, Bosque, Menta, Cielo, Océano, Índigo, Violeta, Magenta, Rubí y Cobre*.
* **4 Modos de Pantalla:** Modo Oscuro, Modo Claro, Modo Alto Contraste y Automático (según el sistema operativo).
* **Filtros de Daltonismo por Matriz SVG:** Modos dedicados para **Protanopía**, **Deuteranopía** y **Tritanopía**.
* **Ergonomía:** Foco visible de alto contraste, reducción de movimiento y subrayado de hipervínculos.

### 🔒 7. Seguridad, Registro y Control de Acceso
* **Registro Directo de Usuarios:** Cualquier usuario puede hacer clic en la pestaña **"Registrarse"**, crear su cuenta y comenzar a utilizar la aplicación al instante.
* **Rol de Administrador:** Cada usuario registrado asume el rol de Administrador de sus finanzas, con acceso ilimitado a todas las herramientas (CRUD, presupuestos, metas, reportes).
* **Bloqueo por Fuerza Bruta:** Bloqueo temporal de 15 minutos tras 5 intentos fallidos consecutivos de contraseña.
* **Protección de Sesión:** Cierre automático por inactividad tras 30 minutos y límite deslizante de 8 horas.

---

## 🚀 Ejecución Rápida en Windows

MoneyTrack incluye su propio ejecutable compilado para que el evaluador no deba instalar absolutamente nada:

1. Ubica el archivo **`MoneyTrack.exe`** en la carpeta principal (o en la subcarpeta `portable/`).
2. Haz **doble clic** sobre él.
3. La aplicación se abrirá al instante en su propia ventana de escritorio.

*(Alternativa: también puedes ejecutar `MoneyTrack.bat` o abrir `public/index.html` en tu navegador favorito e instalarla como PWA).*

### Acceso a la Aplicación:
* **Crear cuenta propia:** Pestaña **"Registrarse"** en la pantalla inicial.
* **Cuenta de prueba preconfigurada:** Correo `admin@moneytrack.com` | PIN: `123456` *(Rol: Administrador)*

---

## 📂 Estructura del Repositorio

```
moneytrack/
├── MoneyTrack.exe          <- Ejecutable nativo portable (Doble clic para abrir)
├── MoneyTrack.bat          <- Lanzador alternativo por lotes
├── package.json            <- Configuración y dependencias de Electron
├── main.js                 <- Proceso principal de escritorio (Electron)
├── preload.js              <- Aislamiento de contexto seguro
├── public/
│   ├── index.html          <- Interfaz SPA con módulos y modales
│   ├── manifest.json       <- Manifiesto PWA para instalación nativa
│   ├── sw.js               <- Service Worker para funcionamiento offline
│   └── assets/
│       ├── css/
│       │   └── style-3d.css     <- Hoja de estilos con efectos 3D y temas
│       └── js/
│           ├── storage.js       <- Persistencia local, sesiones y cálculos COP
│           ├── theme-engine.js  <- Motor de temas, modos y daltonismo
│           ├── charts.js        <- Gráficas interactivas con Chart.js
│           └── app.js           <- Lógica de interacción, navegación y CRUD
├── portable/
│   ├── Launcher.cs         <- Código fuente C# del ejecutable portable
│   ├── MoneyTrack.exe      <- Copia de seguridad del ejecutable
│   └── MoneyTrack.bat      <- Script lanzador
├── docs/
│   ├── MANUAL_TECNICO.md   <- Arquitectura, MER y especificaciones
│   ├── MANUAL_USUARIO.md   <- Guía de uso paso a paso
│   └── MANUAL_DESPLIEGUE.md<- Requisitos y despliegue portable
└── README.md
```

---

## 📚 Documentación Técnica y Manuales
* 📖 [Manual Técnico](docs/MANUAL_TECNICO.md)
* 👤 [Manual de Usuario](docs/MANUAL_USUARIO.md)
* 🚀 [Manual de Despliegue](docs/MANUAL_DESPLIEGUE.md)

---

## 🛠️ Convenciones de Git & Git Neitor
Este proyecto sigue la convención de **Conventional Commits**:
* `feat:` Nuevas funcionalidades (ej: `feat(presupuestos): calculo de alertas porcentuales`).
* `fix:` Corrección de errores.
* `docs:` Actualización de documentación y manuales.
* `style:` Ajustes estéticos, efectos 3D o colores sin cambios en la lógica.
* `refactor:` Optimización del código.
* `chore:` Mantenimiento de dependencias y scripts de empaquetado.

---

## 👩‍💻 Autor
**Karen Suárez**  
*Proyecto formativo MoneyTrack · Control inteligente de finanzas personales*
