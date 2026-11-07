param([string]$Root = (Split-Path -Parent $PSScriptRoot))
# Веб-версии отобранных фото для сайта: фото-для-клиентов → site/assets/real (1600 px, JPEG 80) + превью (640 px, JPEG 76)
# Запуск: powershell -ExecutionPolicy Bypass -File tools\web-photos.ps1
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Linq;
public static class WebImg {
  public static void Make(string src, string dest, int maxSide, long q) {
    using (var img = Image.FromFile(src)) {
      double k = Math.Min(1.0, (double)maxSide / Math.Max(img.Width, img.Height));
      using (var b = new Bitmap((int)(img.Width * k), (int)(img.Height * k), PixelFormat.Format24bppRgb)) {
        using (var g = Graphics.FromImage(b)) { g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic; g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality; g.DrawImage(img, 0, 0, b.Width, b.Height); }
        var codec = ImageCodecInfo.GetImageEncoders().First(c => c.MimeType == "image/jpeg");
        var ep = new EncoderParameters(1); ep.Param[0] = new EncoderParameter(Encoder.Quality, q);
        b.Save(dest, codec, ep);
      }
    }
  }
}
"@
$src = Join-Path $Root "фото-для-клиентов"
$dst = Join-Path $Root "site\assets\real"
New-Item -ItemType Directory -Force $dst, (Join-Path $dst "thumb") | Out-Null
# имя на сайте (латиницей) ← файл из отбора
$map = [ordered]@{
  "hero-cut"        = "1-лучшее\01-срез-спинки-и-икра-крупно.jpg"
  "cut-roe"         = "1-лучшее\02-срез-икряной-рыбы.jpg"
  "vacuum-3"        = "1-лучшее\03-вакуум-3-тушки.jpg"
  "fish-close"      = "1-лучшее\04-готовая-рыба-крупно.jpg"
  "chamber"         = "1-лучшее\05-камера-тележки-с-рыбой.jpg"
  "climate-check"   = "1-лучшее\06-контроль-климата-в-камере.jpg"
  "vacuum-box"      = "1-лучшее\07-вакуум-пакеты-в-контейнере.jpg"
  "eurocube"        = "1-лучшее\08-еврокуб-россыпью.jpg"
  "fish-row"        = "1-лучшее\09-готовая-рыба-ряд.jpg"
  "cut-large"       = "1-лучшее\10-срез-крупной-рыбы-с-икрой.jpg"
  "smelt-rods"      = "1-лучшее\11-корюшка-на-прутках.jpg"
  "trolleys"        = "1-лучшее\12-тележки-ряды-рыбы.jpg"
  "fish-whole"      = "2-продукция-и-срезы\готовая-рыба-целиком-1.jpg"
  "scales"          = "2-продукция-и-срезы\чешуя-крупно.jpg"
  "fish-close-2"    = "2-продукция-и-срезы\готовая-рыба-крупно-2.jpg"
  "cut-roe-2"       = "2-продукция-и-срезы\срез-икра-3.jpg"
  "caliber"         = "2-продукция-и-срезы\калибр-с-линейкой.jpg"
  "vacuum-sealer"   = "3-упаковка\вакуум-на-упаковщике.jpg"
  "vacuum-close"    = "3-упаковка\вакуум-пакеты-крупно.jpg"
  "vacuum-assorted" = "3-упаковка\вакуум-пакеты-ассорти.jpg"
  "eurocube-card"   = "3-упаковка\еврокуб-с-картоном.jpg"
  "chamber-2"       = "4-производство\камера-тележки-1.jpg"
  "rods-rows"       = "4-производство\ряды-на-прутках-2.jpg"
  "trolley-full"    = "4-производство\тележка-с-рыбой-1.jpg"
  "smelt-mesh"      = "4-производство\корюшка-на-сетках.jpg"
}
foreach ($k in $map.Keys) {
  $f = Join-Path $src $map[$k]
  if (-not (Test-Path $f)) { "нет файла: $($map[$k])"; continue }
  [WebImg]::Make($f, (Join-Path $dst "$k.jpg"), 1600, 80)
  [WebImg]::Make($f, (Join-Path $dst "thumb\$k.jpg"), 640, 76)
}
$sz = (Get-ChildItem $dst -Recurse -File | Measure-Object Length -Sum).Sum / 1mb
"site/assets/real: $($map.Count) фото, всего {0:N1} МБ" -f $sz
