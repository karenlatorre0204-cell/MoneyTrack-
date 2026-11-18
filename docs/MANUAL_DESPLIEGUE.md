# Manual de Despliegue e Instalación · MoneyTrack

**Guía de Puesta en Marcha, Ejecución Portable y Publicación**  
*Versión 1.0.0 · Plataformas: Windows 10 / 11, Web PWA*

---

## 1. Requisitos del Sistema

### Para el Evaluador o Usuario Final (Ejecución Portable):
* **Sistema Operativo:** Windows 10 o Windows 11 (64 bits).
* **Navegador base del sistema:** Microsoft Edge o Google Chrome (preinstalados en Windows).
* **Dependencias externas:** **Ninguna.** No requiere instalar servidores (Apache, MySQL, XAMPP ni Node.js). La aplicación es 100% autocontenida.

### Para el Desarrollador (Modo Código Fuente):
* **Node.js:** Versión 18.x o superior (detectado v24.22.1).
* **npm:** Versión 9.x o superior.
* **Git:** Para control de versiones y subida a GitHub mediante **Git Neitor**.

---

## 2. Métodos de Ejecución

### Método 1: Ejecutable Portable Directo (.exe) — [Recomendado para Evaluadores]
1. Descomprime la carpeta del proyecto en cualquier ubicación del computador (por ejemplo, el Escritorio o una memoria USB).
2. Ubica el archivo **`MoneyTrack.exe`** en la raíz del proyecto.
3. Haz **doble clic** sobre el ejecutable.
4. La aplicación se abrirá de inmediato en una ventana nativa de escritorio de 1320x860 píxeles, con aceleración gráfica y el diseño *3D Effects and Depth* activado.

---

### Método 2: Lanzador Batch Portable (.bat)
Si por políticas de seguridad de Windows SmartScreen se restringen los `.exe` desconocidos:
1. Haz doble clic en el archivo **`MoneyTrack.bat`**.
2. El script detectará automáticamente los componentes disponibles e iniciará la ventana de la aplicación.

---

### Método 3: Instalación como Aplicación Progresiva (PWA Offline)
MoneyTrack cuenta con soporte PWA completo:
1. Abre el archivo `public/index.html` en Microsoft Edge o Google Chrome.
2. En la barra de direcciones superior, verás el icono de **"Instalar aplicación"** (un monitor con una flecha).
3. Haz clic en **Instalar**.
4. MoneyTrack se agregará al Menú Inicio de Windows y al Escritorio como una aplicación de escritorio nativa independiente que funciona incluso sin conexión a internet.

---

### Método 4: Entorno de Desarrollo con Electron
Si deseas ejecutar la aplicación utilizando el runtime oficial de Electron:
1. Abre una terminal de PowerShell o CMD en la carpeta del proyecto:
   ```powershell
   cd "C:\Users\karen\OneDrive\Desktop\moneytrack"
   ```
2. Instala las dependencias de Electron (si se requiere):
   ```bash
   npm install
   ```
3. Ejecuta la aplicación en modo desarrollo:
   ```bash
   npm start
   ```
4. Para compilar un nuevo archivo portable con Electron Builder:
   ```bash
   npm run dist
   ```
   El binario compilado se generará dentro de la carpeta `/dist`.

---

## 3. Guía de Subida a GitHub con Git Neitor

Para publicar el proyecto en tu repositorio remoto de GitHub respetando los lineamientos formativos:

1. **Verificar estado de los archivos:**
   ```bash
   git status
   ```
2. **Agregar los cambios:**
   ```bash
   git add .
   ```
3. **Realizar commit siguiendo Conventional Commits:**
   ```bash
   git commit -m "feat(core): implementacion de MoneyTrack con diseno 3D, accesibilidad y ejecutable portable"
   ```
4. **Vincular el repositorio remoto de GitHub (si aún no está vinculado):**
   ```bash
   git remote add origin https://github.com/TU_USUARIO/MoneyTrack.git
   git branch -M main
   ```
5. **Publicar en GitHub:**
   ```bash
   git push -u origin main
   ```

*(O abre tu herramienta **Git Neitor** del instructor, selecciona la carpeta `moneytrack`, introduce el mensaje de commit bajo el estándar y pulsa Push).*
