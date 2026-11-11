param(
  [Parameter(Mandatory=$true)][string]$Title,
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-z0-9]+(-[a-z0-9]+)*$')][string]$Slug
)
$ErrorActionPreference = 'Stop'
$blogRoot = Split-Path $PSScriptRoot -Parent
$draftPath = Join-Path $blogRoot "_drafts/$Slug.md"
if (Test-Path -LiteralPath $draftPath) { throw "Draft already exists: $draftPath" }
New-Item -ItemType Directory -Force (Split-Path $draftPath) | Out-Null
$safeTitle = $Title.Replace("'", "''").Replace([string][char]13, ' ').Replace([string][char]10, ' ')
$body = @("---", "layout: post", "title: '$safeTitle'", "categories: [随笔]", "---", "", "在这里开始写作。", "") -join [char]10
[IO.File]::WriteAllText($draftPath, $body, (New-Object Text.UTF8Encoding($false)))
Write-Host "Created draft: $draftPath"

