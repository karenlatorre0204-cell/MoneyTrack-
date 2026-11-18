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
                // Si el ejecutable está dentro de portable/, subir a la raíz
                if (File.Exists(Path.Combine(baseDir, "..", "public", "index.html")))
                {
                    baseDir = Path.GetFullPath(Path.Combine(baseDir, ".."));
                }

                string htmlPath = Path.Combine(baseDir, "public", "index.html");
                if (!File.Exists(htmlPath))
                {
                    MessageBox.Show("No se encontró el archivo principal en:\n" + htmlPath, "MoneyTrack - Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                string fileUri = "file:///" + htmlPath.Replace('\\', '/');

                // 1. Intentar abrir con Microsoft Edge en Modo App de escritorio
                bool opened = false;
                try
                {
                    ProcessStartInfo psiEdge = new ProcessStartInfo
                    {
                        FileName = "msedge.exe",
                        Arguments = "--new-window --app=" + fileUri + " --window-size=1320,860",
                        UseShellExecute = true
                    };
                    Process p = Process.Start(psiEdge);
                    if (p != null) opened = true;
                }
                catch
                {
                    opened = false;
                }

                if (opened) return;

                // 2. Intentar abrir con Google Chrome en Modo App
                try
                {
                    ProcessStartInfo psiChrome = new ProcessStartInfo
                    {
                        FileName = "chrome.exe",
                        Arguments = "--new-window --app=" + fileUri + " --window-size=1320,860",
                        UseShellExecute = true
                    };
                    Process p = Process.Start(psiChrome);
                    if (p != null) opened = true;
                }
                catch
                {
                    opened = false;
                }

                if (opened) return;

                // 3. Fallback infalible de Windows Shell
                Process.Start(new ProcessStartInfo
                {
                    FileName = htmlPath,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al iniciar MoneyTrack: " + ex.Message, "MoneyTrack", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
