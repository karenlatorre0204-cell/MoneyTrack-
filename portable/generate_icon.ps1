Add-Type -AssemblyName System.Drawing
$iconDir = 'C:\Users\karen\OneDrive\Desktop\moneytrack\public\assets\icons'
if (-not (Test-Path $iconDir)) {
    New-Item -ItemType Directory -Path $iconDir -Force | Out-Null
}

$bmp = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$rect = New-Object System.Drawing.Rectangle 0, 0, 512, 512
$c1 = [System.Drawing.ColorTranslator]::FromHtml('#6C5CE7')
$c2 = [System.Drawing.ColorTranslator]::FromHtml('#00D2FF')
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c2, 45.0
$g.FillEllipse($brush, 24, 24, 464, 464)

$font = New-Object System.Drawing.Font ('Arial', [float]190, [System.Drawing.FontStyle]::Bold)
$textBrush = [System.Drawing.Brushes]::White
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString('$', $font, $textBrush, (New-Object System.Drawing.RectangleF 0, 0, 512, 512), $sf)

$g.Dispose()
$outPath = Join-Path $iconDir 'icon.png'
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "Icono generado en: $outPath"
