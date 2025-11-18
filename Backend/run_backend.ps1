<#
Simple helper to run the backend from PowerShell.
Usage:
  ./run_backend.ps1 [path-to-model]

If you provide a model path as the first argument, it will set $env:MODEL_PATH for the session.
This script does not create/activate a venv automatically; activate your venv before running it.
#>
param(
    [string]$modelPath = ''
)

if ($modelPath -ne '') {
    Write-Host "Setting MODEL_PATH = $modelPath"
    $env:MODEL_PATH = $modelPath
}

Write-Host "Starting backend (from $(Get-Location))"
python .\app.py
