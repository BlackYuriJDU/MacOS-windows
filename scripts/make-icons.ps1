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

    # squircle (raio estilo Tahoe)
    $inset = [int]($size * 0.03)
    $d = $size - 2 * $inset
    $r = [int]($d * 0.23)
    $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
    $gp.AddArc($inset, $inset, 2 * $r, 2 * $r, 180, 90)
    $gp.AddArc($inset + $d - 2 * $r, $inset, 2 * $r, 2 * $r, 270, 90)
    $gp.AddArc($inset + $d - 2 * $r, $inset + $d - 2 * $r, 2 * $r, 2 * $r, 0, 90)
    $gp.AddArc($inset, $inset + $d - 2 * $r, 2 * $r, 2 * $r, 90, 90)
    $gp.CloseFigure()

    # gradiente "Liquid Glass" do Tahoe (azul-claro -> azul-profundo)
    $rect = New-Object System.Drawing.Rectangle($inset, $inset, $d, $d)
    $c1 = [System.Drawing.Color]::FromArgb(255, 168, 212, 252)
    $c2 = [System.Drawing.Color]::FromArgb(255, 10, 63, 184)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, [float]55.0)
    $g.FillPath($brush, $gp)

    # recorta o squircle para as ondas nao vazarem
    $g.SetClip($gp)

    # onda de vidro 1 — diagonal superior (branco translucido)
    $w1 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $w1.AddBezier($inset, [int]($size*0.47), [int]($size*0.29), [int]($size*0.29), [int]($size*0.5), [int]($size*0.41), [int]($size*0.97), [int]($size*0.37))
    $w1.AddLine([int]($size*0.97), [int]($size*0.37), [int]($size*0.97), $inset)
    $w1.AddLine([int]($size*0.97), $inset, $inset, $inset)
    $w1.CloseFigure()
    $b1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 255, 255, 255))
    $g.FillPath($b1, $w1)

    # onda de vidro 2 — diagonal inferior (azul-claro translucido)
    $w2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $w2.AddBezier($inset, [int]($size*0.59), [int]($size*0.31), [int]($size*0.74), [int]($size*0.55), [int]($size*0.65), [int]($size*0.97), [int]($size*0.68))
    $w2.AddLine([int]($size*0.97), [int]($size*0.68), [int]($size*0.97), [int]($size-$inset))
    $w2.AddLine([int]($size*0.97), [int]($size-$inset), $inset, [int]($size-$inset))
    $w2.CloseFigure()
    $b2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 220, 236, 255))
    $g.FillPath($b2, $w2)

    # brilho de vidro no topo
    $eb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(70, 255, 255, 255))
    $g.FillEllipse($eb, [int]($size*0.18), [int]($size*0.10), [int]($size*0.42), [int]($size*0.20))

    $g.ResetClip()
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
