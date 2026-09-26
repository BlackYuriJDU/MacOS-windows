# Gera os icones do app (PNGs + ICO com PNG embutido) 100% via codigo.
# Nenhum asset da Apple e usado — desenho original em gradiente.

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$dir = Join-Path $root "src-tauri\icons"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

function New-IconBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # quadrado arredondado (estilo generico de icone de app)
    $inset = [int]($size * 0.03)
    $d = $size - 2 * $inset
    $r = [int]($d * 0.225)
    $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
    $gp.AddArc($inset, $inset, 2 * $r, 2 * $r, 180, 90)
    $gp.AddArc($inset + $d - 2 * $r, $inset, 2 * $r, 2 * $r, 270, 90)
    $gp.AddArc($inset + $d - 2 * $r, $inset + $d - 2 * $r, 2 * $r, 2 * $r, 0, 90)
    $gp.AddArc($inset, $inset + $d - 2 * $r, 2 * $r, 2 * $r, 90, 90)
    $gp.CloseFigure()

    # gradiente tipo "wallpaper" (azul -> laranja)
    $rect = New-Object System.Drawing.Rectangle($inset, $inset, $d, $d)
    $c1 = [System.Drawing.Color]::FromArgb(255, 40, 62, 120)
    $c2 = [System.Drawing.Color]::FromArgb(255, 255, 138, 92)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, [float]50.0)
    $g.FillPath($brush, $gp)

    # marca: anel branco + ponto central (o logo do projeto)
    $penW = [float]($size * 0.05)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $penW)
    $ringR = [float]($size * 0.21)
    $cx = $size / 2.0
    $g.DrawEllipse($pen, [float]($cx - $ringR), [float]($cx - $ringR), [float](2 * $ringR), [float](2 * $ringR))
    $dotR = [float]($size * 0.045)
    $g.FillEllipse([System.Drawing.Brushes]::White, [float]($cx - $dotR), [float]($cx - $dotR), [float](2 * $dotR), [float](2 * $dotR))

    $g.Dispose()
    return $bmp
}

$sizes = @{
    "icon.png" = 512
    "32x32.png" = 32
    "128x128.png" = 128
    "128x128@2x.png" = 256
    "source-1024.png" = 1024
}
foreach ($k in $sizes.Keys) {
    $bmp = New-IconBitmap $sizes[$k]
    $bmp.Save((Join-Path $dir $k), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

# ICO com PNG de 256px embutido (formato valido desde o Windows Vista)
$png = [System.IO.File]::ReadAllBytes((Join-Path $dir "128x128@2x.png"))
$ms = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ms)
$bw.Write([uint16]0)                 # reserved
$bw.Write([uint16]1)                 # tipo = icone
$bw.Write([uint16]1)                 # quantidade
$bw.Write([byte]0)                    # largura 256 -> 0
$bw.Write([byte]0)                    # altura 256 -> 0
$bw.Write([byte]0)                    # paleta
$bw.Write([byte]0)                    # reservado
$bw.Write([uint16]0)                  # planos
$bw.Write([uint16]32)                  # bpp
$bw.Write([uint32]$png.Length)        # tamanho dos dados
$bw.Write([uint32](6 + 16))           # offset
$bw.Write($png)
[System.IO.File]::WriteAllBytes((Join-Path $dir "icon.ico"), $ms.ToArray())
$bw.Close()

Write-Host "Icones gerados em $dir"
Get-ChildItem $dir | Format-Table Name, Length
