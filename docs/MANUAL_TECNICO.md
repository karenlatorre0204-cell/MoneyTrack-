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
* **Accesibilidad:** Estándar WCAG AA con matrices SVG para daltonismo (*Protanopía*, *Deuteranopía*, *Tritanopía*), tamaño de letra dinámico (85%-130%), modo de alto contraste y reducción de animaciones.
* **Audio Háptico:** Síntesis pura en tiempo de ejecución con **Web Audio API** (sin dependencias de archivos de sonido externos, 100% offline).

---

## 2. Arquitectura de Software

La aplicación sigue una arquitectura desacoplada basada en módulos orientados a eventos y persistencia reactiva en el cliente:

```
moneytrack/
├── MoneyTrack.exe          <- Ejecutable nativo de escritorio portable (Windows)
├── MoneyTrack.bat          <- Lanzador alternativo por lotes
├── package.json            <- Manifiesto de dependencias y scripts
├── main.js                 <- Proceso principal de Electron (Desktop window)
├── preload.js              <- Puente seguro de contexto (Context Isolation)
├── public/
│   ├── index.html          <- Single Page Application con 12 módulos y modales
│   ├── manifest.json       <- PWA Manifest para instalación nativa
│   ├── sw.js               <- Service Worker con estrategia de caché offline
│   └── assets/
│       ├── css/
│       │   └── style-3d.css     <- Sistema de diseño 3D, temas, fuentes y daltonismo
│       └── js/
│           ├── storage.js       <- Capa de datos, algoritmos financieros y KPIs
│           ├── theme-engine.js  <- Motor de temas, sintetizador Web Audio y accesibilidad
│           ├── charts.js        <- Integración y renderizado de Chart.js
│           └── app.js           <- Controlador central de UI, atajos de teclado y modales
├── portable/
│   ├── Launcher.cs         <- Código fuente C# del ejecutable portable
│   ├── build_exe.bat       <- Script de compilación nativa con csc.exe
│   └── package_release.bat <- Script de empaquetado para GitHub Releases
└── docs/
    ├── MANUAL_TECNICO.md   <- Arquitectura, MER y especificaciones
    ├── MANUAL_USUARIO.md   <- Guía de uso para el usuario final
    └── MANUAL_DESPLIEGUE.md<- Guía de instalación y ejecución
```

---

## 3. Modelo de Datos y Entidades

El almacén gestiona estructuras estructuradas en `localStorage` con aislamiento estricto por usuario:

### A. Entidad Usuario (`mt_users`)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (PK) | Identificador único (`usr_...`) |
| `name` | String | Nombre completo del usuario |
| `email` | String (Unique) | Correo de inicio de sesión |
| `pin` | String | Clave de acceso o PIN |
| `failedAttempts` | Int | Contador de intentos fallidos (máx. 5) |
| `lockedUntil` | Timestamp/Null | Tiempo de expiración del bloqueo |
| `createdAt` | Date | Fecha de registro |

### B. Entidad Transacción (`mt_transactions`)
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

### C. Entidad Préstamos ("Me Deben / Debo") (`mt_loans`)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (PK) | Identificador del préstamo (`loan_...`) |
| `userId` | String (FK) | Usuario responsable |
| `type` | Enum | `me_deben` (por cobrar) o `debo` (por pagar) |
| `personName` | String | Nombre de la persona o entidad |
| `amount` | Float | Monto total original en COP |
| `paidAmount` | Float | Monto acumulado de abonos recibidos o pagados |
| `startDate` | Date | Fecha inicial del préstamo |
| `dueDate` | Date | Fecha pactada de pago |
| `notes` | String | Observaciones o motivo del préstamo |
| `status` | Enum | `pendiente`, `parcial`, `saldado` |
| `payments` | Array | Lista de abonos `{ id, amount, date, notes }` |

### D. Entidad Grupo Familiar (`mt_family_groups`)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (PK) | Identificador del grupo (`fam_...`) |
| `name` | String | Nombre personalizado del grupo (ej. Familia Pérez) |
| `createdBy` | String (FK) | ID del usuario titular |
| `createdByName`| String | Nombre del titular creador |
| `createdAt` | Date | Fecha de creación del grupo |
| `members` | Array | Lista de miembros `{ id, name, relationship, notes, isOwner, joinedAt }` |

### E. Entidad Presupuesto (`mt_budgets`)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (PK) | Identificador del presupuesto (`bdg_...`) |
| `userId` | String (FK) | Usuario responsable |
| `categoryId` | String (FK) | Categoría presupuestada |
| `month` | String (YYYY-MM) | Periodo mensual |
| `limitAmount` | Float | Tope máximo establecido en COP |

### F. Entidad Meta de Ahorro (`mt_savings`)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String (PK) | Identificador de la meta (`svg_...`) |
| `userId` | String (FK) | Usuario creador |
| `name` | String | Nombre de la meta |
| `targetAmount` | Float | Monto objetivo en COP |
| `currentAmount` | Float | Saldo acumulado en COP |
| `targetDate` | Date | Fecha límite estimada |
| `notes` | String | Estrategia de ahorro |

---

## 4. Algoritmos y Lógica de Negocio

### 4.1. Algoritmo de Salud Financiera (Score 1 a 100)
El cálculo ponderado se realiza en `Storage.calculateFinancialHealthScore()` mediante 4 dimensiones:
$$\text{Score} = S_{\text{ahorro}} + S_{\text{presupuesto}} + S_{\text{reserva}} + S_{\text{deuda}}$$
1. **Tasa de Ahorro ($S_{\text{ahorro}}$, máx 30 pts):** Evalúa el porcentaje de excedente líquido retenido frente a ingresos brutos ($\ge 25\% \to 30$ pts, $15\%-24\% \to 22$ pts, $5\%-14\% \to 14$ pts, $< 5\% \to 6$ pts, negativo $\to 0$ pts).
2. **Control Presupuestario ($S_{\text{presupuesto}}$, máx 25 pts):** Mide el porcentaje de categorías que respetaron su tope fijado ($100\% \to 25$ pts, $\ge 70\% \to 18$ pts, $< 70\% \to 8$ pts).
3. **Colchón y Metas ($S_{\text{reserva}}$, máx 25 pts):** Relación de capital ahorrado frente a gastos mensuales ($\ge 3 \text{ meses} \to 25$ pts, $1 \text{ a } 2 \text{ meses} \to 18$ pts, con metas activas $\to 10$ pts).
4. **Nivel de Endeudamiento ($S_{\text{deuda}}$, máx 20 pts):** Nivel de deudas pendientes en "Me Deben / Debo" frente al ingreso mensual ($0 \text{ deudas} \to 20$ pts, $\le 15\% \to 16$ pts, $\le 40\% \to 10$ pts, $> 40\% \to 4$ pts).

### 4.2. Algoritmo del Asesor de Compras "¿Puedo Permitírmelo?"
Implementado en `Storage.simulatePurchase(itemName, amount, categoryId)`:
* Calcula la **Liquidez Libre Real**: $\text{Liquidez} = \text{Balance} - \sum \text{Presupuestos Pendientes}$.
* Determina el **Saldo Proyectado Post-Compra**: $\text{Balance Post} = \text{Balance} - \text{Monto}$.
* Emite dictamen de 3 niveles:
  * 🔴 **Peligro / Rechazado:** Si $\text{Balance Post} < 0$.
  * 🟡 **Precaución:** Si el monto compromete los presupuestos mensuales pendientes o representa más del 40% del ingreso mensual.
  * 🟢 **Aprobado / Adelante:** Si el monto se cubre íntegramente del excedente sin alterar presupuestos ni metas.

### 4.3. Motor de Audio Sintético Háptico (Web Audio API)
Ubicado en `public/assets/js/theme-engine.js`:
* Genera sonidos puros mediante nodos `OscillatorNode` y `GainNode` con curvas exponenciales `exponentialRampToValueAtTime`.
* **Sonido de Moneda (`playCoin`):** Modulación de doble tono en frecuencias $987.77\text{ Hz} \to 1318.51\text{ Hz}$ con decaimiento en $0.32$ segundos.
* Totalmente autónomo: no requiere peticiones de red ni archivos de medios `.mp3` o `.wav`.

---

## 5. Accesibilidad y Escalado Tipográfico (WCAG AA)
* **Escala de Texto Dinámica:** Implementada mediante variable CSS `--ui-font-scale` en el selector `html { font-size: calc(16px * var(--ui-font-scale)); }`. Los niveles soportados son $85\%$, $100\%$, $115\%$ y $130\%$.
* **Filtros SVG de Daltonismo:**
  * Protanopía: filtro `<feColorMatrix>` matriz estándar de deficiencia de conos L.
  * Deuteranopía: matriz estándar de deficiencia de conos M.
  * Tritanopía: matriz estándar de deficiencia de conos S.
