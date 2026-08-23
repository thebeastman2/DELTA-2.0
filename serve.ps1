$port = 4173
$root = "C:\Users\aryan\Downloads\Project DELTA - Replit_files\mirror"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Output "Serving $root on http://localhost:$port/"
while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path -eq "/") { $path = "/index.html" }
    $file = [System.IO.Path]::GetFullPath((Join-Path $root ($path.TrimStart('/'))))
    $rootFull = [System.IO.Path]::GetFullPath($root)
    if (-not $file.StartsWith($rootFull)) {
      $ctx.Response.StatusCode = 403
      $ctx.Response.Close()
      continue
    }
    if (-not (Test-Path $file -PathType Leaf) -and -not ([System.IO.Path]::GetExtension($file))) {
      $file = Join-Path $root "index.html"
    }
    if (Test-Path $file -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $mime = switch ($ext) {
        ".html" { "text/html" }
        ".js"   { "text/javascript" }
        ".mjs"  { "text/javascript" }
        ".css"  { "text/css" }
        ".svg"  { "image/svg+xml" }
        ".png"  { "image/png" }
        ".jpg"  { "image/jpeg" }
        ".jpeg" { "image/jpeg" }
        ".gif"  { "image/gif" }
        ".webp" { "image/webp" }
        ".json" { "application/json" }
        ".woff2"{ "font/woff2" }
        ".woff" { "font/woff" }
        ".ttf"  { "font/ttf" }
        ".mp4"  { "video/mp4" }
        ".webm" { "video/webm" }
        ".ico"  { "image/x-icon" }
        default { "application/octet-stream" }
      }
      $ctx.Response.ContentType = $mime
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
  } catch {
    # ignore per-request errors
  } finally {
    try { $ctx.Response.Close() } catch {}
  }
}
