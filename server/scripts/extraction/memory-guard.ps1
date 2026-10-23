param([int]$TargetId, [int]$OwnerId, [long]$LimitBytes)
$ErrorActionPreference = 'Stop'
$peak = 0L
Write-Output 'ready'
while ($true) {
    $target = Get-Process -Id $TargetId -ErrorAction SilentlyContinue
    if ($null -eq $target) { break }
    $peak = [Math]::Max($peak, $target.PeakWorkingSet64)
    if ($peak -gt $LimitBytes) {
        Stop-Process -Id $TargetId -Force -ErrorAction SilentlyContinue
        Write-Output 'MEMORY_LIMIT'
        break
    }
    if ($null -eq (Get-Process -Id $OwnerId -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $TargetId -Force -ErrorAction SilentlyContinue
        break
    }
    Start-Sleep -Milliseconds 25
}
Write-Output "peak:$peak"
