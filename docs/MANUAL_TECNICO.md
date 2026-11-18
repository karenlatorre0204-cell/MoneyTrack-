# Manual Técnico · MoneyTrack

**Control Inteligente de Finanzas Personales**  
*Versión 1.0.0 · Generado para evaluación técnica y formativa*

---

## 1. Información General del Proyecto
* **Nombre de la Aplicación:** MoneyTrack – Control inteligente de finanzas personales.
* **Plataforma:** Aplicación de Escritorio Portable (Windows) + PWA Web.
* **Moneda de Cálculo:** Pesos Colombianos (COP).
* **Idioma:** Español.
* **Diseño Visual:** Sistema *3D Effects and Depth* (perspectiva, extrusión, sombras volumétricas y luz consistente).
* **Accesibilidad:** Estándar WCAG AA con matrices SVG para daltonismo (*Protanopía*, *Deuteranopía*, *Tritanopía*), modo de alto contraste y reducción de animaciones.

---

## 2. Arquitectura de Software

La aplicación sigue una arquitectura desacoplada basada en módulos orientados a eventos y persistencia reactiva en el cliente:

```
moneytrack/
├── MoneyTrack.exe          <- Ejecutable nativo portable para Windows
├── MoneyTrack.bat          <- Lanzador script alternativo
├── package.json            <- Manifiesto de dependencias y scripts de empaquetado
├── main.js                 <- Proceso principal de Electron (Desktop window)
├── preload.js              <- Puente seguro de contexto (Context Isolation)
├── public/
│   ├── index.html          <- Single Page Application con vistas y modales
│   ├── manifest.json       <- PWA Manifest para instalación nativa
│   ├── sw.js               <- Service Worker con estrategia de caché offline
│   └── assets/
│       ├── css/
│       │   └── style-3d.css     <- Sistema de diseño 3D, temas y daltonismo
│       └── js/
│           ├── storage.js       <- Capa de datos, multiusuario, sesiones y roles
│           ├── theme-engine.js  <- Motor de los 12 temas, 4 modos y accesibilidad
│           ├── charts.js        <- Integración y renderizado de Chart.js
│           └── app.js           <- Controlador central de UI, CRUD y eventos
├── portable/
│   ├── Launcher.cs         <- Código fuente C# del ejecutable portable
│   └── MoneyTrack.exe      <- Binario compilado para distribución
└── docs/
    ├── MANUAL_TECNICO.md   <- Arquitectura, MER y especificaciones
    ├── MANUAL_USUARIO.md   <- Guía de uso para el usuario final
    └── MANUAL_DESPLIEGUE.md<- Guía de instalación y ejecución
```

---

## 3. Modelo de Datos y Entidades

El almacén gestiona estructuras normalizadas con integridad referencial lógica:

### A. Entidad Usuario (`users`)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (PK) | Identificador único (`usr_...`) |
| `name` | String | Nombre del usuario |
| `email` | String (Unique) | Correo de inicio de sesión |
| `pin` | String | Clave de acceso / PIN |
| `role` | Enum | Rol asignado (`admin`, `editor`, `lector`) |
| `failedAttempts` | Int | Contador de intentos fallidos (máx. 5) |
| `lockedUntil` | Timestamp/Null | Tiempo de expiración del bloqueo |
| `createdAt` | Date | Fecha de registro |

### B. Entidad Transacción (`transactions`)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (PK) | Identificador del movimiento (`tx_...`) |
| `userId` | String (FK) | Propietario del movimiento |
| `type` | Enum | Tipo de movimiento (`ingreso` o `gasto`) |
| `categoryId` | String (FK) | Categoría asociada |
| `amount` | Float | Monto en pesos colombianos (COP) |
| `description` | String | Detalle del movimiento |
| `date` | Date (YYYY-MM-DD) | Fecha de la transacción |
| `createdAt` | Timestamp | Marca temporal de auditoría |

### C. Entidad Presupuesto (`budgets`)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (PK) | Identificador del presupuesto |
| `userId` | String (FK) | Usuario responsable |
| `categoryId` | String (FK) | Categoría presupuestada |
| `month` | String (YYYY-MM) | Periodo mensual |
| `limitAmount` | Float | Tope máximo establecido en COP |

### D. Entidad Meta de Ahorro (`savings`)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (PK) | Identificador de la meta |
| `userId` | String (FK) | Usuario creador |
| `name` | String | Nombre de la meta |
| `targetAmount` | Float | Monto objetivo en COP |
| `currentAmount` | Float | Saldo acumulado en COP |
| `targetDate` | Date | Fecha límite estimada |
| `notes` | String | Estrategia de ahorro |

---

## 4. Fórmulas y Métricas Implementadas

1. **Balance Mensual:**
   $$\text{Balance} = \sum \text{Ingresos del Mes} - \sum \text{Gastos del Mes}$$

2. **Cumplimiento de Presupuesto:**
   $$\text{Cumplimiento (\%)} = \left(\frac{\text{Gasto Real de la Categoría}}{\text{Límite Presupuestado}}\right) \times 100$$
   * *Nivel Normal:* $< 70\%$ (Acento / Verde)
   * *Alerta:* $70\% - 99\%$ (Amarillo / Naranja)
   * *Sobregiro:* $\ge 100\%$ (Rojo de peligro)

3. **Progreso de Ahorro:**
   $$\text{Progreso (\%)} = \left(\frac{\text{Monto Ahorrado}}{\text{Monto Meta}}\right) \times 100$$

4. **Estadísticas Descriptivas (Analítica):**
   * **Media (Promedio):** $\mu = \frac{\sum x_i}{N}$
   * **Mediana:** Valor central ordenado que divide el $50\%$ de los registros.

---

## 5. Seguridad y Roles

* **Modelo de Acceso y Roles:**
  * **Administrador (Admin):** Cada usuario registrado tiene el rol de Administrador de sus finanzas personales, contando con control total sobre el registro, edición, eliminación de ingresos, gastos, presupuestos, metas de ahorro y configuración.
  * **Aislamiento por Propietario:** Los datos financieros permanecen aislados de forma segura por usuario.
* **Control de Inactividad:** Cierre de sesión automático si no se detecta interacción durante **30 minutos**.
* **Protección contra Fuerza Bruta:** Bloqueo temporal automático de **15 minutos** al acumular **5 intentos fallidos consecutivos**.
* **Duración Deslizante de Sesión:** Máximo de **8 horas** activas continuas.
