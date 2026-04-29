param(
  [string]$Namespace = "default"
)

$ErrorActionPreference = "Stop"

function Import-EnvFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "Secrets file not found: $Path"
  }

  foreach ($rawLine in Get-Content $Path) {
    $line = $rawLine.Trim()
    if (-not $line -or $line.StartsWith('#')) {
      continue
    }

    if ($line.StartsWith('export ')) {
      $line = $line.Substring(7).Trim()
    }

    $parts = $line.Split('=', 2)
    if ($parts.Count -ne 2) {
      continue
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    Set-Item -Path "Env:$name" -Value $value
  }
}

Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "Loading local secrets file..."
Import-EnvFile -Path ".\.secrets.local.env"
Write-Host "Loaded .secrets.local.env into the current PowerShell session."

Write-Host "Applying Kubernetes secrets..."
& .\scripts\apply-k8s-secrets.ps1 -Namespace $Namespace

Write-Host "Applying Kubernetes manifests..."
Get-ChildItem .\k8s\*.yaml |
  Where-Object { $_.Name -notlike '*.example.yaml' } |
  ForEach-Object { kubectl apply -f $_.FullName | Out-Null }

Write-Host "Applied Kubernetes manifests."

$deployments = kubectl get deployments -o name
foreach ($deployment in $deployments) {
  kubectl rollout restart $deployment | Out-Null
}

Write-Host "Restarted all deployments."

foreach ($deployment in $deployments) {
  kubectl rollout status $deployment --timeout=180s | Out-Null
}

Write-Host "All deployments are rolled out."