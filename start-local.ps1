$ErrorActionPreference = 'Stop'
$projectDirectory = $PSScriptRoot
$backendDirectory = Join-Path $projectDirectory 'backend'
$frontendDirectory = Join-Path $projectDirectory 'frontend'
$logDirectory = Join-Path $projectDirectory '.local'
$nodeExecutable = (Get-Command node -ErrorAction Stop).Source
foreach ($required in @('backend/.env','backend/node_modules','frontend/node_modules')) {
    if (-not (Test-Path (Join-Path $projectDirectory $required))) {
        throw "Falta $required. Completa la instalacion descrita en README.md."
    }
}
# Local development uses the same default port as next.config.ts. Do not print .env secrets.
$configuredPort = Get-Content (Join-Path $backendDirectory '.env') | Where-Object { $_ -match '^PORT=' } | Select-Object -First 1
if ($configuredPort -and $configuredPort.Trim() -ne 'PORT=4000') {
    throw 'Este iniciador requiere PORT=4000. Para puertos personalizados usa las terminales del README.'
}
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
function Test-LocalPort([int] $port) {
    $client = [Net.Sockets.TcpClient]::new()
    try { $task = $client.ConnectAsync('127.0.0.1',$port); return ($task.Wait(500) -and $client.Connected) }
    catch { return $false }
    finally { $client.Dispose() }
}
function Start-LocalService([string] $serviceName,[int] $port,[string] $directory,[string[]] $arguments) {
    if (Test-LocalPort $port) { Write-Host "$serviceName ya tiene un proceso en el puerto $port; no se reiniciara."; return }
    $process = Start-Process -FilePath $nodeExecutable -ArgumentList $arguments -WorkingDirectory $directory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory "$serviceName.log") -RedirectStandardError (Join-Path $logDirectory "$serviceName.error.log")
    $deadline = (Get-Date).AddSeconds(30)
    do {
        if ($process.HasExited) { throw "$serviceName no pudo iniciar. Revisa .local/$serviceName.error.log." }
        if (Test-LocalPort $port) { Write-Host "$serviceName disponible en http://127.0.0.1:$port (PID $($process.Id))."; return }
        Start-Sleep -Milliseconds 300
    } while ((Get-Date) -lt $deadline)
    throw "$serviceName tarda en iniciar. Revisa sus logs en .local antes de volver a ejecutar."
}
Start-LocalService 'backend' 4000 $backendDirectory @('--env-file=.env','src/server.js')
Start-LocalService 'frontend' 3000 $frontendDirectory @('node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3000')
Write-Host 'Abre http://localhost:3000/login. Los procesos siguen activos aunque cierres esta terminal.'
