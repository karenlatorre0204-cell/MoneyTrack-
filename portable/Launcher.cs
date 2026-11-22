using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace MoneyTrackLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                // Si el ejecutable se ejecuta desde portable/, subir a la raíz del proyecto
                if (File.Exists(Path.Combine(baseDir, "..", "public", "index.html")))
                {
                    baseDir = Path.GetFullPath(Path.Combine(baseDir, ".."));
                }

                // 1. Prioridad: Ejecutable oficial empaquetado de Electron
                string electronExe = Path.Combine(baseDir, "dist", "win-unpacked", "MoneyTrack.exe");
                if (File.Exists(electronExe))
                {
                    ProcessStartInfo psiElectron = new ProcessStartInfo
                    {
                        FileName = electronExe,
                        WorkingDirectory = Path.Combine(baseDir, "dist", "win-unpacked"),
                        UseShellExecute = true
                    };
                    Process.Start(psiElectron);
                    return;
                }

                // 2. Ejecutar con node_modules/electron si existe
                string devElectron = Path.Combine(baseDir, "node_modules", "electron", "dist", "electron.exe");
                if (File.Exists(devElectron))
                {
                    ProcessStartInfo psiDev = new ProcessStartInfo
                    {
                        FileName = devElectron,
                        Arguments = "\".\"",
                        WorkingDirectory = baseDir,
                        UseShellExecute = true
                    };
                    Process.Start(psiDev);
                    return;
                }

                // 3. Fallback: Modo App en Microsoft Edge o Navegador Web
                string htmlPath = Path.Combine(baseDir, "public", "index.html");
                if (!File.Exists(htmlPath))
                {
                    MessageBox.Show(
                        "No se encontró el archivo de la aplicación en:\n" + htmlPath,
                        "MoneyTrack - Error de Inicio",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                string fileUri = "file:///" + htmlPath.Replace('\\', '/');
                bool edgeStarted = false;
                try
                {
                    ProcessStartInfo psiEdge = new ProcessStartInfo
                    {
                        FileName = "msedge.exe",
                        Arguments = "--new-window --app=\"" + fileUri + "\" --window-size=1360,880",
                        UseShellExecute = true
                    };
                    Process p = Process.Start(psiEdge);
                    if (p != null) edgeStarted = true;
                }
                catch
                {
                    edgeStarted = false;
                }

                if (edgeStarted) return;

                // 4. Fallback al navegador predeterminado de Windows
                Process.Start(new ProcessStartInfo
                {
                    FileName = htmlPath,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Error al iniciar MoneyTrack: " + ex.Message,
                    "MoneyTrack",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }
    }
}
