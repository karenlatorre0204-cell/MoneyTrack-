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
                // Si el ejecutable está en la carpeta portable/, subir un nivel
                if (File.Exists(Path.Combine(baseDir, "..", "public", "index.html")))
                {
                    baseDir = Path.GetFullPath(Path.Combine(baseDir, ".."));
                }

                string htmlPath = Path.Combine(baseDir, "public", "index.html");
                if (!File.Exists(htmlPath))
                {
                    MessageBox.Show("No se encontró el archivo principal: " + htmlPath, "MoneyTrack - Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // 1. Intentar Electron si está instalado
                string electronLocal = Path.Combine(baseDir, "node_modules", ".bin", "electron.cmd");
                if (File.Exists(electronLocal))
                {
                    ProcessStartInfo psi = new ProcessStartInfo(electronLocal, ".")
                    {
                        WorkingDirectory = baseDir,
                        CreateNoWindow = true,
                        UseShellExecute = false
                    };
                    Process.Start(psi);
                    return;
                }

                // 2. Ejecutar con Microsoft Edge en Modo Aplicación de Escritorio (--app)
                string edge64 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe");
                string edge32 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe");
                string edgePath = File.Exists(edge64) ? edge64 : (File.Exists(edge32) ? edge32 : null);

                if (edgePath != null)
                {
                    string args = string.Format("--app=\"file:///{0}\" --window-size=1320,860", htmlPath.Replace('\\', '/'));
                    Process.Start(edgePath, args);
                    return;
                }

                // 3. Ejecutar con Google Chrome en Modo Aplicación
                string chrome64 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google", "Chrome", "Application", "chrome.exe");
                string chrome32 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google", "Chrome", "Application", "chrome.exe");
                string chromePath = File.Exists(chrome64) ? chrome64 : (File.Exists(chrome32) ? chrome32 : null);

                if (chromePath != null)
                {
                    string args = string.Format("--app=\"file:///{0}\" --window-size=1320,860", htmlPath.Replace('\\', '/'));
                    Process.Start(chromePath, args);
                    return;
                }

                // 4. Fallback abrir archivo HTML
                Process.Start(new ProcessStartInfo(htmlPath) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al iniciar MoneyTrack: " + ex.Message, "MoneyTrack", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
