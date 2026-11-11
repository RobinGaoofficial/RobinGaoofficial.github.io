param(
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-z0-9]+(-[a-z0-9]+)*$')][string]$Slug
)
$ErrorActionPreference = 'Stop'
$blogRoot = Split-Path $PSScriptRoot -Parent
function Run-Git {
  & git -C $blogRoot @args
  if ($LASTEXITCODE -ne 0) { throw "Git operation failed. Stop and inspect the message above." }
}
if (-not (Test-Path (Join-Path $blogRoot '.git'))) { throw 'This folder is not a Git clone. Follow README setup first.' }
$staged = & git -C $blogRoot diff --cached --name-only
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect Git status.' }
if ($staged) { throw 'There are staged changes. Commit or unstage them before publishing.' }
$draftPath = Join-Path $blogRoot "_drafts/$Slug.md"
if (-not (Test-Path -LiteralPath $draftPath)) { throw "Draft not found: $draftPath" }
$draftContent = [IO.File]::ReadAllText($draftPath)
if ($draftContent -notmatch '(?s)^---\r?\n.*?\r?\n---') { throw 'Draft must begin with YAML front matter.' }
if ($draftContent -match '(?m)^published:\s*false\s*$') { throw 'Remove published: false when ready to publish.' }
$postDate = [TimeZoneInfo]::ConvertTimeBySystemTimeZone([DateTime]::UtcNow, 'China Standard Time').ToString('yyyy-MM-dd')
$postRelative = "_posts/$postDate-$Slug.md"
$postPath = Join-Path $blogRoot $postRelative
if (Test-Path -LiteralPath $postPath) { throw "Post already exists: $postPath" }
if (Get-ChildItem (Join-Path $blogRoot '_posts') -Filter "*-$Slug.md") { throw 'This slug already exists. Use a new slug.' }
Run-Git fetch origin main
$localHead = & git -C $blogRoot rev-parse HEAD
$remoteHead = & git -C $blogRoot rev-parse origin/main
if ($localHead -ne $remoteHead) { throw 'Local and remote differ. Sync your changes before publishing.' }
Copy-Item -LiteralPath $draftPath -Destination $postPath
Run-Git add -- $postRelative assets/images
Run-Git diff --cached --stat
Run-Git commit -m "Publish $Slug"
Run-Git push origin HEAD:main
Write-Host 'Published source. GitHub Pages will deploy shortly.'
Write-Host 'https://robingaoofficial.github.io/'
Write-Host 'Your original draft remains in _drafts for backup.'

