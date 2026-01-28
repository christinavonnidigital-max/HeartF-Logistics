# Sets the Vercel project root directory to the repo root (".").
# Usage:
#   ./scripts/set-vercel-root.ps1 -ProjectId prj_xS2VzkFZSvBHk8oUKl7f8WqZ7kNi -Token $env:VERCEL_TOKEN [-TeamId your_team_id]
Param(
  [Parameter(Mandatory = $true)][string]$ProjectId,
  [Parameter(Mandatory = $true)][string]$Token,
  [string]$RootDirectory = "",
  [string]$TeamId = ""
)

$headers = @{
  Authorization = "Bearer $Token"
  "Content-Type" = "application/json"
}

$body = @{ rootDirectory = $RootDirectory } | ConvertTo-Json
$uri = "https://api.vercel.com/v9/projects/$ProjectId"
if ($TeamId) {
  $uri = "$uri?teamId=$TeamId"
}

try {
  $response = Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -Body $body
  Write-Output "Updated rootDirectory to: $($response.rootDirectory)"
  if ($response.linkedGitDeployHookId) {
    Write-Output "Linked deploy hook id: $($response.linkedGitDeployHookId)"
  }
} catch {
  Write-Error "Failed to update project. $_"
  if ($_.Exception.Response) {
    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $reader.ReadToEnd() | Write-Output
    } catch {
      Write-Verbose "Could not read error response body."
    }
  }
}
